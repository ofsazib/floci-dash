// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.hoisted(() => vi.fn());

vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  };
});

import {
  useKinesisStreams,
  useKinesisStream,
  useCreateKinesisStream,
  useDeleteKinesisStream,
  useKinesisShards,
  useKinesisConsumers,
  usePutKinesisRecord,
  usePutKinesisRecords,
  useKinesisRecords,
  useKinesisTags,
} from "./useKinesis";

beforeEach(() => {
  mockApi.mockReset();
});

describe("useKinesis hooks", () => {
  describe("useKinesisStreams", () => {
    it("calls correct URL", async () => {
      mockApi.mockResolvedValueOnce({ streams: [], total: 0 });
      const { result } = renderHook(() => useKinesisStreams(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/kinesis/streams");
    });
  });

  describe("useKinesisStream", () => {
    it("calls correct URL when name provided", async () => {
      mockApi.mockResolvedValueOnce({ stream: {} });
      const { result } = renderHook(() => useKinesisStream("stream-1"), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/kinesis/streams/stream-1");
    });

    it("disabled when name is null", () => {
      const { result } = renderHook(() => useKinesisStream(null), {
        wrapper: createWrapper(),
      });
      expect(result.current.fetchStatus).toBe("idle");
    });
  });

  describe("useCreateKinesisStream", () => {
    it("calls POST with correct params", async () => {
      mockApi.mockResolvedValueOnce({ created: true });
      const { result } = renderHook(() => useCreateKinesisStream(), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync({ streamName: "stream-1", shardCount: 3 });
      expect(mockApi).toHaveBeenCalledWith("/aws/kinesis/streams", {
        method: "POST",
        body: JSON.stringify({ streamName: "stream-1", shardCount: 3 }),
      });
    });
  });

  describe("useDeleteKinesisStream", () => {
    it("calls DELETE with correct URL", async () => {
      mockApi.mockResolvedValueOnce({ deleted: true });
      const { result } = renderHook(() => useDeleteKinesisStream(), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync("stream-1");
      expect(mockApi).toHaveBeenCalledWith("/aws/kinesis/streams/stream-1", {
        method: "DELETE",
      });
    });
  });

  describe("useKinesisShards", () => {
    it("calls correct URL when streamName provided", async () => {
      mockApi.mockResolvedValueOnce({ shards: [], total: 0 });
      const { result } = renderHook(() => useKinesisShards("stream-1"), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/kinesis/streams/stream-1/shards");
    });

    it("disabled when streamName is null", () => {
      const { result } = renderHook(() => useKinesisShards(null), {
        wrapper: createWrapper(),
      });
      expect(result.current.fetchStatus).toBe("idle");
    });
  });

  describe("useKinesisConsumers", () => {
    it("calls correct URL when streamName provided", async () => {
      mockApi.mockResolvedValueOnce({ consumers: [], total: 0 });
      const { result } = renderHook(() => useKinesisConsumers("stream-1"), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/kinesis/streams/stream-1/consumers");
    });

    it("disabled when streamName is null", () => {
      const { result } = renderHook(() => useKinesisConsumers(null), {
        wrapper: createWrapper(),
      });
      expect(result.current.fetchStatus).toBe("idle");
    });
  });

  describe("usePutKinesisRecord", () => {
    it("calls POST with correct params", async () => {
      mockApi.mockResolvedValueOnce({ sequenceNumber: "123" });
      const { result } = renderHook(() => usePutKinesisRecord("stream-1"), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync({ data: "hello", partitionKey: "key1" });
      expect(mockApi).toHaveBeenCalledWith("/aws/kinesis/streams/stream-1/records", {
        method: "POST",
        body: JSON.stringify({ data: "hello", partitionKey: "key1" }),
      });
    });
  });

  describe("usePutKinesisRecords", () => {
    it("calls POST with correct params", async () => {
      mockApi.mockResolvedValueOnce({ records: [], failedRecordCount: 0 });
      const { result } = renderHook(() => usePutKinesisRecords("stream-1"), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync({ records: [{ data: "a", partitionKey: "k" }] });
      expect(mockApi).toHaveBeenCalledWith("/aws/kinesis/streams/stream-1/records/batch", {
        method: "POST",
        body: JSON.stringify({ records: [{ data: "a", partitionKey: "k" }] }),
      });
    });
  });

  describe("useKinesisRecords", () => {
    it("calls correct URL when both params provided", async () => {
      mockApi.mockResolvedValueOnce({ records: [] });
      const { result } = renderHook(
        () => useKinesisRecords("stream-1", "shardId-000000000001"),
        { wrapper: createWrapper() }
      );
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/kinesis/streams/stream-1/shards/shardId-000000000001/records?type=LATEST"
      );
    });

    it("disabled when streamName is null", () => {
      const { result } = renderHook(
        () => useKinesisRecords(null, "shardId-1"),
        { wrapper: createWrapper() }
      );
      expect(result.current.fetchStatus).toBe("idle");
    });

    it("disabled when shardId is null", () => {
      const { result } = renderHook(
        () => useKinesisRecords("stream-1", null),
        { wrapper: createWrapper() }
      );
      expect(result.current.fetchStatus).toBe("idle");
    });
  });

  describe("useKinesisTags", () => {
    it("calls correct URL when streamName provided", async () => {
      mockApi.mockResolvedValueOnce({ tags: [] });
      const { result } = renderHook(() => useKinesisTags("stream-1"), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/kinesis/streams/stream-1/tags");
    });

    it("disabled when streamName is null", () => {
      const { result } = renderHook(() => useKinesisTags(null), {
        wrapper: createWrapper(),
      });
      expect(result.current.fetchStatus).toBe("idle");
    });
  });
});
