// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

// Each mock fn receives the mutation body and returns the "response" promise.
const mocks = vi.hoisted(() => ({
  labels: vi.fn(),
  faces: vi.fn(),
  text: vi.fn(),
  moderation: vi.fn(),
  compare: vi.fn(),
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

vi.mock("../../hooks/useRekognition", () => ({
  useRekognitionDetectLabels: createMutationMock((b: any) => mocks.labels(b)),
  useRekognitionDetectFaces: createMutationMock((b: any) => mocks.faces(b)),
  useRekognitionDetectText: createMutationMock((b: any) => mocks.text(b)),
  useRekognitionDetectModerationLabels: createMutationMock((b: any) => mocks.moderation(b)),
  useRekognitionCompareFaces: createMutationMock((b: any) => mocks.compare(b)),
}));

import { RekognitionDashboard } from "./RekognitionDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.labels.mockResolvedValue({ labels: [{ name: "Floci", confidence: 99.9 }] });
  mocks.faces.mockResolvedValue({ faceDetails: [] });
  mocks.text.mockResolvedValue({ textDetections: [], textModelVersion: "1.0" });
  mocks.moderation.mockResolvedValue({ moderationLabels: [], moderationModelVersion: "1.1" });
  mocks.compare.mockResolvedValue({ faceMatches: [], unmatchedFaces: [] });
});

afterEach(() => {
  cleanup();
});

async function fillBase64(user: any, text: string) {
  await user.type(screen.getByPlaceholderText("Paste base64-encoded image bytes"), text);
}

describe("RekognitionDashboard", () => {
  it("renders the Rekognition header", () => {
    render(<RekognitionDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("heading", { name: "Rekognition" })).toBeTruthy();
  });

  it("detects labels with pasted base64 bytes", async () => {
    const user = userEvent.setup();
    render(<RekognitionDashboard />, { wrapper: createWrapper() });
    await fillBase64(user, "aGVsbG8=");
    await user.click(screen.getByRole("button", { name: "Detect labels" }));
    await waitFor(() =>
      expect(mocks.labels).toHaveBeenCalledWith({ image: { bytes: "aGVsbG8=" } })
    );
    expect(await screen.findByText(/detect-labels|labels:/)).toBeTruthy();
  });

  it("uses an S3 object reference when toggled", async () => {
    const user = userEvent.setup();
    render(<RekognitionDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("checkbox", { name: /Use an S3 object/ }));
    await user.type(screen.getByPlaceholderText("my-bucket"), "photos");
    await user.type(screen.getByPlaceholderText("photos/cat.jpg"), "cat.jpg");
    await user.click(screen.getByRole("button", { name: "Detect faces" }));
    await waitFor(() =>
      expect(mocks.faces).toHaveBeenCalledWith({
        image: { s3Object: { bucket: "photos", name: "cat.jpg" } },
      })
    );
  });

  it("detects text", async () => {
    const user = userEvent.setup();
    render(<RekognitionDashboard />, { wrapper: createWrapper() });
    await fillBase64(user, "aGVsbG8=");
    await user.click(screen.getByRole("button", { name: "Detect text" }));
    await waitFor(() => expect(mocks.text).toHaveBeenCalledWith({ image: { bytes: "aGVsbG8=" } }));
    expect(await screen.findByText(/text:/)).toBeTruthy();
  });

  it("detects moderation labels", async () => {
    const user = userEvent.setup();
    render(<RekognitionDashboard />, { wrapper: createWrapper() });
    await fillBase64(user, "aGVsbG8=");
    await user.click(screen.getByRole("button", { name: "Detect moderation" }));
    await waitFor(() =>
      expect(mocks.moderation).toHaveBeenCalledWith({ image: { bytes: "aGVsbG8=" } })
    );
  });

  it("disables detection buttons until an image is provided", () => {
    render(<RekognitionDashboard />, { wrapper: createWrapper() });
    expect((screen.getByRole("button", { name: "Detect labels" }) as HTMLButtonElement).disabled).toBe(
      true
    );
  });

  it("shows an error result when detection fails", async () => {
    mocks.labels.mockRejectedValue(new Error("labels boom"));
    const user = userEvent.setup();
    render(<RekognitionDashboard />, { wrapper: createWrapper() });
    await fillBase64(user, "aGVsbG8=");
    await user.click(screen.getByRole("button", { name: "Detect labels" }));
    expect(await screen.findByText(/Detection failed/)).toBeTruthy();
  });

  it("compares faces between source and target images", async () => {
    const user = userEvent.setup();
    render(<RekognitionDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Compare faces/ }));
    // The page now shows two image sections; fill the first visible bytes field twice.
    const bytesInputs = screen.getAllByPlaceholderText("Paste base64-encoded image bytes");
    await user.type(bytesInputs[0], "c291cmNl");
    await user.type(bytesInputs[1], "dGFyZ2V0");
    await user.click(screen.getByRole("button", { name: "Compare faces" }));
    await waitFor(() =>
      expect(mocks.compare).toHaveBeenCalledWith({
        sourceImage: { bytes: "c291cmNl" },
        targetImage: { bytes: "dGFyZ2V0" },
      })
    );
  });

  it("compares S3-backed source and target images", async () => {
    const user = userEvent.setup();
    render(<RekognitionDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Compare faces/ }));
    const checkboxes = screen.getAllByRole("checkbox", { name: /Use an S3 object/ });
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);
    await user.type(screen.getAllByPlaceholderText("my-bucket")[0], "src-bucket");
    await user.type(screen.getAllByPlaceholderText("my-bucket")[1], "tgt-bucket");
    await user.type(screen.getAllByPlaceholderText("photos/a.jpg")[0], "src.jpg");
    await user.type(screen.getAllByPlaceholderText("photos/a.jpg")[1], "tgt.jpg");
    await user.click(screen.getByRole("button", { name: "Compare faces" }));
    await waitFor(() =>
      expect(mocks.compare).toHaveBeenCalledWith({
        sourceImage: { s3Object: { bucket: "src-bucket", name: "src.jpg" } },
        targetImage: { s3Object: { bucket: "tgt-bucket", name: "tgt.jpg" } },
      })
    );
  });

  it("shows an error result when compare fails", async () => {
    mocks.compare.mockRejectedValue(new Error("compare boom"));
    const user = userEvent.setup();
    render(<RekognitionDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Compare faces/ }));
    const bytesInputs = screen.getAllByPlaceholderText("Paste base64-encoded image bytes");
    await user.type(bytesInputs[0], "c291cmNl");
    await user.type(bytesInputs[1], "dGFyZ2V0");
    await user.click(screen.getByRole("button", { name: "Compare faces" }));
    expect(await screen.findByText(/Face comparison failed/)).toBeTruthy();
  });

  it("dismisses the result alert", async () => {
    const user = userEvent.setup();
    render(<RekognitionDashboard />, { wrapper: createWrapper() });
    await fillBase64(user, "aGVsbG8=");
    await user.click(screen.getByRole("button", { name: "Detect text" }));
    expect(await screen.findByText(/text:/)).toBeTruthy();
    await user.click(document.querySelector("[class*='dismiss-button']") as HTMLElement);
    await waitFor(() => expect(screen.queryByText(/text:/)).toBeNull());
  });
});
