// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.hoisted(() => vi.fn());
vi.mock("../lib/client", () => ({ api: (...args: any[]) => mockApi(...args) }));
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, useQueryClient: () => ({ invalidateQueries: vi.fn() }) };
});

import {
  useTranscriptionJobs,
  useTranscriptionJob,
  useStartTranscriptionJob,
  useDeleteTranscriptionJob,
  useTranscribeVocabularies,
} from "./useTranscribe";

beforeEach(() => mockApi.mockReset());

describe("useTranscribe hooks", () => {
  it("useTranscriptionJobs calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ jobs: [], total: 0 });
    const { result } = renderHook(() => useTranscriptionJobs(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/transcribe/jobs");
  });

  it("useTranscriptionJob calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ job: {} });
    const { result } = renderHook(() => useTranscriptionJob("job-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/transcribe/jobs/job-1");
  });

  it("useTranscriptionJob disabled when null", () => {
    const { result } = renderHook(() => useTranscriptionJob(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useStartTranscriptionJob calls POST", async () => {
    mockApi.mockResolvedValueOnce({ job: {} });
    const { result } = renderHook(() => useStartTranscriptionJob(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ transcriptionJobName: "job-1", media: { mediaFileUri: "s3://b/f" } });
    expect(mockApi).toHaveBeenCalledWith("/aws/transcribe/jobs", {
      method: "POST",
      body: JSON.stringify({ transcriptionJobName: "job-1", media: { mediaFileUri: "s3://b/f" } }),
    });
  });

  it("useDeleteTranscriptionJob calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteTranscriptionJob(), { wrapper: createWrapper() });
    await result.current.mutateAsync("job-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/transcribe/jobs/job-1", { method: "DELETE" });
  });

  it("useTranscribeVocabularies calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ vocabularies: [], total: 0 });
    const { result } = renderHook(() => useTranscribeVocabularies(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/transcribe/vocabularies");
  });
});
