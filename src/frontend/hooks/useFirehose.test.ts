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
  useFirehoseStreams,
  useCreateFirehoseStream,
  useDeleteFirehoseStream,
  usePutFirehoseRecord,
} from "./useFirehose";

beforeEach(() => mockApi.mockReset());

describe("useFirehose hooks", () => {
  it("useFirehoseStreams calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ streams: [], total: 0 });
    const { result } = renderHook(() => useFirehoseStreams(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/firehose/streams");
  });

  it("useCreateFirehoseStream calls POST", async () => {
    mockApi.mockResolvedValueOnce({ deliveryStreamARN: "arn:..." });
    const { result } = renderHook(() => useCreateFirehoseStream(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ deliveryStreamName: "stream-1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/firehose/streams", {
      method: "POST",
      body: JSON.stringify({ deliveryStreamName: "stream-1" }),
    });
  });

  it("useDeleteFirehoseStream calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteFirehoseStream(), { wrapper: createWrapper() });
    await result.current.mutateAsync("stream-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/firehose/streams/stream-1", { method: "DELETE" });
  });

  it("usePutFirehoseRecord calls POST", async () => {
    mockApi.mockResolvedValueOnce({ recordId: "rec-1" });
    const { result } = renderHook(() => usePutFirehoseRecord("stream-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ data: "hello" });
    expect(mockApi).toHaveBeenCalledWith("/aws/firehose/streams/stream-1/records", {
      method: "POST",
      body: JSON.stringify({ data: "hello" }),
    });
  });
});
