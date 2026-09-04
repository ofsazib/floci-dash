// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mockLanguages = vi.fn();
// Each is called with the mutation body and must return the "response".
const mockTranslateText = vi.fn();
const mockTranslateDocument = vi.fn();

vi.mock("../../hooks/useTranslate", async (orig) => {
  const actual: any = await orig();
  return {
    ...actual,
    useTranslateLanguages: (...args: any[]) => mockLanguages(...args),
    useTranslateText: () => {
      const [state, setState] = React.useState({
        data: null as any,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null as any,
      });
      const mutate = async (body: any) => {
        setState((p: any) => ({ ...p, isPending: true }));
        try {
          const data = await mockTranslateText(body);
          setState({ data, isPending: false, isError: false, isSuccess: true, error: null });
        } catch (e: any) {
          setState({ data: null, isPending: false, isError: true, isSuccess: false, error: e });
        }
      };
      const reset = () => setState({ data: null, isPending: false, isError: false, isSuccess: false, error: null });
      return { ...state, mutate, mutateAsync: mutate, reset };
    },
    useTranslateDocument: () => {
      const [state, setState] = React.useState({
        data: null as any,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null as any,
      });
      const mutate = async (body: any) => {
        setState((p: any) => ({ ...p, isPending: true }));
        try {
          const data = await mockTranslateDocument(body);
          setState({ data, isPending: false, isError: false, isSuccess: true, error: null });
        } catch (e: any) {
          setState({ data: null, isPending: false, isError: true, isSuccess: false, error: e });
        }
      };
      const reset = () => setState({ data: null, isPending: false, isError: false, isSuccess: false, error: null });
      return { ...state, mutate, mutateAsync: mutate, reset };
    },
  };
});

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
            onClick={() => onChange?.({ detail: { selectedOption: o } })}
          >
            {o.label}
          </button>
        ))}
      </div>
    ),
  };
});

import { TranslateDashboard } from "./TranslateDashboard";

const languages = [
  { languageCode: "en", languageName: "English" },
  { languageCode: "fr", languageName: "French" },
  { languageCode: "de", languageName: "German" },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockLanguages.mockReturnValue({
    data: { languages, displayLanguageCode: "en" },
    isLoading: false,
  });
});

afterEach(() => {
  cleanup();
});

describe("TranslateDashboard", () => {
  it("renders the Translate header", () => {
    render(<TranslateDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("heading", { name: "Translate" })).toBeTruthy();
  });

  it("translates text on submit", async () => {
    mockTranslateText.mockResolvedValue({ translatedText: "Bonjour" });
    const user = userEvent.setup();
    render(<TranslateDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("Enter text to translate"), "Hello");
    await user.click(screen.getByRole("button", { name: "Translate" }));
    await waitFor(() =>
      expect(mockTranslateText).toHaveBeenCalledWith({
        text: "Hello",
        sourceLanguageCode: "en",
        targetLanguageCode: "fr",
      })
    );
    expect(await screen.findByText("Bonjour")).toBeTruthy();
  });

  it("does not translate empty text", async () => {
    const user = userEvent.setup();
    render(<TranslateDashboard />, { wrapper: createWrapper() });
    const btn = screen.getByRole("button", { name: "Translate" });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    await user.click(btn);
    expect(mockTranslateText).not.toHaveBeenCalled();
  });

  it("picks a source and target language then translates", async () => {
    mockTranslateText.mockResolvedValue({ translatedText: "Hallo" });
    const user = userEvent.setup();
    render(<TranslateDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("opt-auto"));
    // German appears in both selects; the last one is the target select
    const deButtons = screen.getAllByTestId("opt-de");
    await user.click(deButtons[deButtons.length - 1]);
    await user.type(screen.getByPlaceholderText("Enter text to translate"), "Hello");
    await user.click(screen.getByRole("button", { name: "Translate" }));
    await waitFor(() =>
      expect(mockTranslateText).toHaveBeenCalledWith({
        text: "Hello",
        sourceLanguageCode: "auto",
        targetLanguageCode: "de",
      })
    );
    expect(await screen.findByText("Hallo")).toBeTruthy();
  });

  it("shows the error alert when text translation fails and dismisses it", async () => {
    mockTranslateText.mockRejectedValue(new Error("translation boom"));
    const user = userEvent.setup();
    render(<TranslateDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("Enter text to translate"), "Hello");
    await user.click(screen.getByRole("button", { name: "Translate" }));
    expect(await screen.findByText("translation boom")).toBeTruthy();
    await user.click(document.querySelector("[class*='dismiss-button']") as HTMLElement);
    await waitFor(() => expect(screen.queryByText("translation boom")).toBeNull());
  });

  it("translates a document from the document tab", async () => {
    mockTranslateDocument.mockResolvedValue({ translatedDocument: "<p>Bonjour</p>" });
    const user = userEvent.setup();
    render(<TranslateDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Translate document/ }));
    await user.type(
      screen.getByPlaceholderText("Paste document content to translate"),
      "<p>Hello</p>"
    );
    await user.click(screen.getByRole("button", { name: "Translate document" }));
    await waitFor(() =>
      expect(mockTranslateDocument).toHaveBeenCalledWith({
        content: "<p>Hello</p>",
        contentType: "text/plain",
        sourceLanguageCode: "en",
        targetLanguageCode: "fr",
      })
    );
    expect(await screen.findByText("<p>Bonjour</p>")).toBeTruthy();
  });

  it("picks a doc content type, source and target language then translates", async () => {
    mockTranslateDocument.mockResolvedValue({ translatedDocument: "ok" });
    const user = userEvent.setup();
    render(<TranslateDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Translate document/ }));
    // German appears in both the source and target selects — first is source
    let deButtons = screen.getAllByTestId("opt-de");
    await user.click(deButtons[0]);
    deButtons = screen.getAllByTestId("opt-de");
    await user.click(deButtons[deButtons.length - 1]);
    await user.click(screen.getAllByTestId("opt-text/html")[0]);
    await user.type(screen.getByPlaceholderText("Paste document content to translate"), "Hello");
    await user.click(screen.getByRole("button", { name: "Translate document" }));
    await waitFor(() => {
      const call: any = mockTranslateDocument.mock.calls[0][0];
      expect(call.contentType).toBe("text/html");
      expect(call.sourceLanguageCode).toBe("de");
      expect(call.targetLanguageCode).toBe("de");
    });
  });

  it("shows the error alert when document translation fails and dismisses it", async () => {
    mockTranslateDocument.mockRejectedValue(new Error("doc boom"));
    const user = userEvent.setup();
    render(<TranslateDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Translate document/ }));
    await user.type(screen.getByPlaceholderText("Paste document content to translate"), "Hello");
    await user.click(screen.getByRole("button", { name: "Translate document" }));
    expect(await screen.findByText("doc boom")).toBeTruthy();
    await user.click(document.querySelector("[class*='dismiss-button']") as HTMLElement);
    await waitFor(() => expect(screen.queryByText("doc boom")).toBeNull());
  });
});
