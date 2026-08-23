// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockJobs = vi.fn();
const mockDeleteJob = vi.fn();
const mockVocabs = vi.fn();
const mockCreateVocab = vi.fn();
const mockDeleteVocab = vi.fn();

const createVocabState = vi.hoisted(() => ({ isPending: false, isError: false, error: null as Error | null }));
const deleteVocabState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));

const deleteJobState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));

vi.mock("../../hooks/useTranscribe", () => ({
  useTranscriptionJobs: (...args: any[]) => mockJobs(...args),
  useDeleteTranscriptionJob: () => ({
    mutateAsync: mockDeleteJob,
    get isPending() { return deleteJobState.isPending; },
    get variables() { return deleteJobState.variables; },
  }),
  useTranscribeVocabularies: (...args: any[]) => mockVocabs(...args),
  useCreateTranscribeVocabulary: () => ({
    mutate: mockCreateVocab,
    get isPending() { return createVocabState.isPending; },
    get isError() { return createVocabState.isError; },
    get error() { return createVocabState.error; },
  }),
  useDeleteTranscribeVocabulary: () => ({
    mutateAsync: mockDeleteVocab,
    get isPending() { return deleteVocabState.isPending; },
    get variables() { return deleteVocabState.variables; },
  }),
}));

import { TranscribeDashboard } from "./TranscribeDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  deleteJobState.isPending = false;
  deleteJobState.variables = null;
  mockJobs.mockReturnValue({ data: { jobs: [], total: 0 }, isLoading: false });
  mockVocabs.mockReturnValue({ data: { vocabularies: [] } });
  createVocabState.isPending = false;
  createVocabState.isError = false;
  createVocabState.error = null;
  deleteVocabState.isPending = false;
  deleteVocabState.variables = null;
});

describe("TranscribeDashboard", () => {
  it("shows loading skeleton", () => {
    mockJobs.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<TranscribeDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty message", () => {
    render(<TranscribeDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No transcription jobs/i)).toBeTruthy();
  });

  it("renders jobs with data", () => {
    mockJobs.mockReturnValue({
      data: {
        jobs: [{
          TranscriptionJobName: "my-job",
          TranscriptionJobStatus: "COMPLETED",
          LanguageCode: "en-US",
          CreationTime: "2024-01-15T00:00:00Z",
          CompletionTime: "2024-01-15T01:00:00Z",
        }],
        total: 1,
      },
      isLoading: false,
    });
    render(<TranscribeDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-job")).toBeTruthy();
    expect(screen.getByText("COMPLETED")).toBeTruthy();
    expect(screen.getByText("en-US")).toBeTruthy();
  });

  it("shows dash for missing language", () => {
    mockJobs.mockReturnValue({
      data: { jobs: [{ TranscriptionJobName: "test", TranscriptionJobStatus: "COMPLETED" }], total: 1 },
      isLoading: false,
    });
    render(<TranscribeDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("test")).toBeTruthy();
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });

  it("deletes a job", async () => {
    mockJobs.mockReturnValue({
      data: { jobs: [{ TranscriptionJobName: "delete-me", TranscriptionJobStatus: "COMPLETED" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<TranscribeDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("delete-me")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete delete-me/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteJob).toHaveBeenCalledWith("delete-me"));
  });

  it("filters jobs by name", async () => {
    mockJobs.mockReturnValue({
      data: {
        jobs: [
          { TranscriptionJobName: "alpha-job", TranscriptionJobStatus: "COMPLETED" },
          { TranscriptionJobName: "beta-job", TranscriptionJobStatus: "IN_PROGRESS" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<TranscribeDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-job")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find jobs by name");
    await user.type(filterInput, "beta");
    await waitFor(() => {
      expect(screen.queryByText("alpha-job")).toBeNull();
    });
  });


  // ── Sparse data & delete loading ────────────────────

  it("renders empty when data lacks the jobs array", () => {
    mockJobs.mockReturnValue({ data: { total: 0 }, isLoading: false });
    render(<TranscribeDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No transcription jobs/i)).toBeTruthy();
  });

  it("renders delete loading state", () => {
    deleteJobState.isPending = true;
    deleteJobState.variables = "loading-job";
    mockJobs.mockReturnValue({
      data: { jobs: [{ TranscriptionJobName: "loading-job", TranscriptionJobStatus: "COMPLETED" }], total: 1 },
      isLoading: false,
    });
    render(<TranscribeDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("loading-job")).toBeTruthy();
  });
});

describe("TranscribeDashboard — vocabularies", () => {
  it("renders vocabularies with the table", () => {
    mockVocabs.mockReturnValue({
      data: { vocabularies: [{ VocabularyName: "vocab-1", LanguageCode: "en-US", VocabularyState: "READY" }] },
    });
    render(<TranscribeDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("vocab-1")).toBeTruthy();
    expect(screen.getByText("READY")).toBeTruthy();
  });

  it("falls back to dashes for sparse vocabulary fields", () => {
    mockVocabs.mockReturnValue({ data: { vocabularies: [{ VocabularyName: "vocab-1" }] } });
    render(<TranscribeDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("vocab-1")).toBeTruthy();
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2);
  });

  it("shows the empty vocabularies message while the query is loading", () => {
    mockVocabs.mockReturnValue({ data: undefined });
    render(<TranscribeDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No custom vocabularies")).toBeTruthy();
  });

  it("shows the empty vocabularies message", () => {
    render(<TranscribeDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No custom vocabularies")).toBeTruthy();
  });

  it("creates a vocabulary from the modal", async () => {
    mockCreateVocab.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    render(<TranscribeDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create Vocabulary/i }));
    const dialog = screen.getByRole("dialog");
    const inputs = dialog.querySelectorAll("input");
    await user.type(inputs[0], "my-vocab");
    await user.clear(inputs[1]);
    await user.type(inputs[1], "es-ES");
    const createBtn = screen.getAllByRole("button", { name: /^Create$/ }).at(-1)!;
    await user.click(createBtn);
    await waitFor(() =>
      expect(mockCreateVocab).toHaveBeenCalledWith(
        { vocabularyName: "my-vocab", languageCode: "es-ES" },
        { onSuccess: expect.any(Function) },
      )
    );
  });

  it("cancels the create vocabulary modal", async () => {
    const user = userEvent.setup();
    render(<TranscribeDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create Vocabulary/i }));
    const dialog = screen.getByRole("dialog");
    const cancel = screen.getAllByRole("button", { name: "Cancel" }).at(-1)!;
    await user.click(cancel);
    await waitFor(() => expect(dialog.className).toContain("hidden"));
    expect(mockCreateVocab).not.toHaveBeenCalled();
  });

  it("dismisses the create vocabulary modal with Escape", async () => {
    const user = userEvent.setup();
    render(<TranscribeDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create Vocabulary/i }));
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => fireEvent.keyDown(d as HTMLElement, { keyCode: 27 }));
    await waitFor(() => {
      const header = screen.getAllByText("Create vocabulary").find((h) => h.closest('[role="dialog"]'));
      expect(header!.closest('[role="dialog"]')!.className).toContain("hidden");
    });
  });

  it("shows the create error and fallback message", async () => {
    createVocabState.isError = true;
    createVocabState.error = new Error("vocab failed");
    const user = userEvent.setup();
    render(<TranscribeDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create Vocabulary/i }));
    expect(await screen.findByText("vocab failed")).toBeTruthy();
  });

  it("falls back to a generic create error message", async () => {
    createVocabState.isError = true;
    createVocabState.error = null;
    const user = userEvent.setup();
    render(<TranscribeDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create Vocabulary/i }));
    expect(await screen.findByText("Failed to create vocabulary")).toBeTruthy();
  });

  it("deletes a vocabulary after confirmation", async () => {
    mockDeleteVocab.mockResolvedValue({});
    mockVocabs.mockReturnValue({
      data: { vocabularies: [{ VocabularyName: "vocab-1", LanguageCode: "en-US" }] },
    });
    const user = userEvent.setup();
    render(<TranscribeDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Delete vocab-1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteVocab).toHaveBeenCalledWith("vocab-1"));
  });

  it("disables the delete while pending", () => {
    deleteVocabState.isPending = true;
    deleteVocabState.variables = "vocab-1";
    mockVocabs.mockReturnValue({
      data: { vocabularies: [{ VocabularyName: "vocab-1", LanguageCode: "en-US" }] },
    });
    render(<TranscribeDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: /Delete vocab-1/i }).className).toMatch(/disabled/);
  });
});
