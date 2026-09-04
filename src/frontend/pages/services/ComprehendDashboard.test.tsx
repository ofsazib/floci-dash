// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mocks = vi.hoisted(() => ({
  sentiment: vi.fn(),
  keyPhrases: vi.fn(),
  dominantLanguage: vi.fn(),
  piiEntities: vi.fn(),
  containsPii: vi.fn(),
}));

function createMutationMock(fn: (body: any) => Promise<any>) {
  return function useMockMutation() {
    const [state, setState] = React.useState({
      data: null as any,
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null as any,
    });
    const mutateAsync = async (body: any) => {
      setState((p: any) => ({ ...p, isPending: true }));
      try {
        const data = await fn(body);
        setState({ data, isPending: false, isError: false, isSuccess: true, error: null });
        return data;
      } catch (e: any) {
        setState({ data: null, isPending: false, isError: true, isSuccess: false, error: e });
        throw e;
      }
    };
    const reset = () =>
      setState({ data: null, isPending: false, isError: false, isSuccess: false, error: null });
    return { ...state, mutate: mutateAsync, mutateAsync, reset };
  };
}

vi.mock("../../hooks/useComprehend", () => ({
  useComprehendDetectSentiment: createMutationMock((b: any) => mocks.sentiment(b)),
  useComprehendDetectKeyPhrases: createMutationMock((b: any) => mocks.keyPhrases(b)),
  useComprehendDetectDominantLanguage: createMutationMock((b: any) => mocks.dominantLanguage(b)),
  useComprehendDetectPiiEntities: createMutationMock((b: any) => mocks.piiEntities(b)),
  useComprehendContainsPiiEntities: createMutationMock((b: any) => mocks.containsPii(b)),
}));

vi.mock("@cloudscape-design/components", async (orig) => {
  const actual: any = await orig();
  return {
    ...actual,
    Select: ({ selectedOption, onChange, options }: any) => (
      <div data-testid="mock-select">
        {options?.map((o: any) => (
          <button
            key={o.value}
            data-testid={`opt-${o.value}`}
            onClick={() => onChange?.({ detail: { selectedOption: { ...o } } })}
          >
            {o.label}
          </button>
        ))}
      </div>
    ),
  };
});

import { ComprehendDashboard } from "./ComprehendDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.sentiment.mockResolvedValue({ sentiment: "NEUTRAL", sentimentScore: { Neutral: 0.7 } });
  mocks.keyPhrases.mockResolvedValue({ keyPhrases: [{ text: "Floci", score: 0.99 }] });
  mocks.dominantLanguage.mockResolvedValue({ languages: [{ languageCode: "en", score: 0.99 }] });
  mocks.piiEntities.mockResolvedValue({ entities: [] });
  mocks.containsPii.mockResolvedValue({ labels: [] });
});

afterEach(() => {
  cleanup();
});

async function typeText(user: any, text: string) {
  await user.type(screen.getByPlaceholderText("Enter text to analyze"), text);
}

async function pickOp(user: any, opId: string) {
  await user.click(screen.getByTestId(`opt-${opId}`));
}

describe("ComprehendDashboard", () => {
  it("renders the Comprehend header", () => {
    render(<ComprehendDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("heading", { name: "Comprehend" })).toBeTruthy();
  });

  it("disables Analyze until text is provided", () => {
    render(<ComprehendDashboard />, { wrapper: createWrapper() });
    expect((screen.getByRole("button", { name: "Analyze" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("detects sentiment (default op) with language code", async () => {
    const user = userEvent.setup();
    render(<ComprehendDashboard />, { wrapper: createWrapper() });
    await typeText(user, "I love Floci");
    await user.click(screen.getByRole("button", { name: "Analyze" }));
    await waitFor(() =>
      expect(mocks.sentiment).toHaveBeenCalledWith({ text: "I love Floci", languageCode: "en" })
    );
    expect(await screen.findByText(/Detect sentiment:/)).toBeTruthy();
    expect(screen.getByText(/"sentiment": "NEUTRAL"/)).toBeTruthy();
  });

  it("detects key phrases", async () => {
    const user = userEvent.setup();
    render(<ComprehendDashboard />, { wrapper: createWrapper() });
    await pickOp(user, "key-phrases");
    await typeText(user, "Floci rocks");
    await user.click(screen.getByRole("button", { name: "Analyze" }));
    await waitFor(() =>
      expect(mocks.keyPhrases).toHaveBeenCalledWith({ text: "Floci rocks", languageCode: "en" })
    );
  });

  it("detects dominant language without sending or showing a language select", async () => {
    const user = userEvent.setup();
    render(<ComprehendDashboard />, { wrapper: createWrapper() });
    await pickOp(user, "dominant-language");
    await typeText(user, "bonjour tout le monde");
    // No language select exists for this operation.
    expect(screen.queryAllByTestId("opt-en")).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Analyze" }));
    await waitFor(() =>
      expect(mocks.dominantLanguage).toHaveBeenCalledWith({ text: "bonjour tout le monde" })
    );
  });

  it("detects PII entities restricting the language list to en/es", async () => {
    const user = userEvent.setup();
    render(<ComprehendDashboard />, { wrapper: createWrapper() });
    await pickOp(user, "pii-entities");
    // General-language options (fr) are gone; only the PII set is offered.
    expect(screen.queryByTestId("opt-fr")).toBeNull();
    expect(screen.getByTestId("opt-en")).toBeTruthy();
    expect(screen.getByTestId("opt-es")).toBeTruthy();
    await user.click(screen.getByTestId("opt-es"));
    await typeText(user, "call me at 555-1234");
    await user.click(screen.getByRole("button", { name: "Analyze" }));
    await waitFor(() =>
      expect(mocks.piiEntities).toHaveBeenCalledWith({
        text: "call me at 555-1234",
        languageCode: "es",
      })
    );
  });

  it("checks for PII labels", async () => {
    const user = userEvent.setup();
    render(<ComprehendDashboard />, { wrapper: createWrapper() });
    await pickOp(user, "contains-pii");
    await typeText(user, "mail me at a@b.co");
    await user.click(screen.getByRole("button", { name: "Analyze" }));
    await waitFor(() =>
      expect(mocks.containsPii).toHaveBeenCalledWith({
        text: "mail me at a@b.co",
        languageCode: "en",
      })
    );
    expect(await screen.findByText(/Check for PII labels:/)).toBeTruthy();
  });

  it("shows an error alert when analysis fails", async () => {
    mocks.sentiment.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    render(<ComprehendDashboard />, { wrapper: createWrapper() });
    await typeText(user, "hello");
    await user.click(screen.getByRole("button", { name: "Analyze" }));
    expect(await screen.findByText(/Analysis failed/)).toBeTruthy();
    expect(screen.getByText(/"error": "Analysis failed"/)).toBeTruthy();
  });

  it("clears the result with the Clear button", async () => {
    const user = userEvent.setup();
    render(<ComprehendDashboard />, { wrapper: createWrapper() });
    await typeText(user, "hello");
    await user.click(screen.getByRole("button", { name: "Analyze" }));
    expect(await screen.findByText(/Detect sentiment:/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Clear result" }));
    await waitFor(() => expect(screen.queryByText(/Detect sentiment:/)).toBeNull());
  });

  it("dismisses the result alert", async () => {
    const user = userEvent.setup();
    render(<ComprehendDashboard />, { wrapper: createWrapper() });
    await typeText(user, "hello");
    await user.click(screen.getByRole("button", { name: "Analyze" }));
    expect(await screen.findByText(/Detect sentiment:/)).toBeTruthy();
    await user.click(document.querySelector("[class*='dismiss-button']") as HTMLElement);
    await waitFor(() => expect(screen.queryByText(/Detect sentiment:/)).toBeNull());
  });
});
