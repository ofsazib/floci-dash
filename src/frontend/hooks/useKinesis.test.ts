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
  useRegisterKinesisConsumer,
  useDeregisterKinesisConsumer,
  useSubscribeToShard,
  usePutKinesisRecord,
  usePutKinesisRecords,
  useKinesisRecords,
  useKinesisTags,
  useDescribeKinesisConsumer,
  useAddKinesisTags,
  useRemoveKinesisTags,
  useIncreaseKinesisRetention,
  useDecreaseKinesisRetention,
  useStartKinesisEncryption,
  useStopKinesisEncryption,
  useEnableKinesisMonitoring,
  useDisableKinesisMonitoring,
  useUpdateKinesisStreamMode,
  useSplitKinesisShard,
  useMergeKinesisShards,
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

  describe("useRegisterKinesisConsumer", () => {
    it("calls POST with correct URL", async () => {
      mockApi.mockResolvedValueOnce({ consumer: { ConsumerName: "my-consumer" } });
      const { result } = renderHook(() => useRegisterKinesisConsumer("stream-1"), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync("my-consumer");
      expect(mockApi).toHaveBeenCalledWith("/aws/kinesis/streams/stream-1/consumers", {
        method: "POST",
        body: JSON.stringify({ consumerName: "my-consumer" }),
      });
    });
  });

  describe("useDeregisterKinesisConsumer", () => {
    it("calls DELETE with correct URL", async () => {
      mockApi.mockResolvedValueOnce({ deregistered: true });
      const { result } = renderHook(() => useDeregisterKinesisConsumer("stream-1"), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync("my-consumer");
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/kinesis/streams/stream-1/consumers/my-consumer",
        { method: "DELETE" }
      );
    });
  });

  describe("useSubscribeToShard", () => {
    it("calls POST with correct URL and params", async () => {
      mockApi.mockResolvedValueOnce({ events: [], total: 0 });
      const { result } = renderHook(() => useSubscribeToShard("stream-1"), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync({
        consumerARN: "arn:aws:kinesis:...:consumer/my-consumer",
        shardId: "shardId-000000000001",
      });
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/kinesis/streams/stream-1/subscribe-to-shard",
        {
          method: "POST",
          body: JSON.stringify({
            consumerARN: "arn:aws:kinesis:...:consumer/my-consumer",
            shardId: "shardId-000000000001",
          }),
        }
      );
    });
  });

  describe("useDescribeKinesisConsumer", () => {
    it("calls correct URL when both streamName and consumerName provided", async () => {
      mockApi.mockResolvedValueOnce({ consumer: { ConsumerName: "my-consumer" } });
      const { result } = renderHook(
        () => useDescribeKinesisConsumer("stream-1", "my-consumer"),
        { wrapper: createWrapper() }
      );
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/kinesis/streams/stream-1/consumers/my-consumer"
      );
    });

    it("disabled when streamName is null", () => {
      const { result } = renderHook(
        () => useDescribeKinesisConsumer(null, "my-consumer"),
        { wrapper: createWrapper() }
      );
      expect(result.current.fetchStatus).toBe("idle");
    });

    it("disabled when consumerName is null", () => {
      const { result } = renderHook(
        () => useDescribeKinesisConsumer("stream-1", null),
        { wrapper: createWrapper() }
      );
      expect(result.current.fetchStatus).toBe("idle");
    });
  });

  describe("useAddKinesisTags", () => {
    it("calls PUT with correct URL and body", async () => {
      mockApi.mockResolvedValueOnce({ tagged: true });
      const { result } = renderHook(() => useAddKinesisTags("stream-1"), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync({ tags: { env: "prod" } });
      expect(mockApi).toHaveBeenCalledWith("/aws/kinesis/streams/stream-1/tags", {
        method: "PUT",
        body: JSON.stringify({ tags: { env: "prod" } }),
      });
    });
  });

  describe("useRemoveKinesisTags", () => {
    it("calls DELETE with correct URL and body", async () => {
      mockApi.mockResolvedValueOnce({ untagged: true });
      const { result } = renderHook(() => useRemoveKinesisTags("stream-1"), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync(["env"]);
      expect(mockApi).toHaveBeenCalledWith("/aws/kinesis/streams/stream-1/tags", {
        method: "DELETE",
        body: JSON.stringify({ tagKeys: ["env"] }),
      });
    });
  });

  describe("useIncreaseKinesisRetention", () => {
    it("calls POST with correct URL and body", async () => {
      mockApi.mockResolvedValueOnce({ updated: true });
      const { result } = renderHook(() => useIncreaseKinesisRetention("stream-1"), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync(48);
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/kinesis/streams/stream-1/retention/increase",
        { method: "POST", body: JSON.stringify({ retentionPeriodHours: 48 }) }
      );
    });
  });

  describe("useDecreaseKinesisRetention", () => {
    it("calls POST with correct URL and body", async () => {
      mockApi.mockResolvedValueOnce({ updated: true });
      const { result } = renderHook(() => useDecreaseKinesisRetention("stream-1"), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync(24);
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/kinesis/streams/stream-1/retention/decrease",
        { method: "POST", body: JSON.stringify({ retentionPeriodHours: 24 }) }
      );
    });
  });

  describe("useStartKinesisEncryption", () => {
    it("calls POST with correct URL and body", async () => {
      mockApi.mockResolvedValueOnce({ updated: true });
      const { result } = renderHook(() => useStartKinesisEncryption("stream-1"), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync({ encryptionType: "KMS", keyId: "alias/aws/kinesis" });
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/kinesis/streams/stream-1/encryption/start",
        {
          method: "POST",
          body: JSON.stringify({ encryptionType: "KMS", keyId: "alias/aws/kinesis" }),
        }
      );
    });
  });

  describe("useStopKinesisEncryption", () => {
    it("calls POST with correct URL", async () => {
      mockApi.mockResolvedValueOnce({ updated: true });
      const { result } = renderHook(() => useStopKinesisEncryption("stream-1"), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync();
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/kinesis/streams/stream-1/encryption/stop",
        { method: "POST" }
      );
    });
  });

  describe("useEnableKinesisMonitoring", () => {
    it("calls POST and normalizes populated metrics", async () => {
      mockApi.mockResolvedValueOnce({
        streamName: "stream-1",
        currentShardLevelMetrics: ["IncomingBytes"],
        desiredShardLevelMetrics: ["IncomingBytes"],
      });
      const { result } = renderHook(() => useEnableKinesisMonitoring("stream-1"), {
        wrapper: createWrapper(),
      });
      const data = await result.current.mutateAsync(["IncomingBytes"]);
      expect(data.currentShardLevelMetrics).toEqual(["IncomingBytes"]);
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/kinesis/streams/stream-1/monitoring/enable",
        {
          method: "POST",
          body: JSON.stringify({ shardLevelMetrics: ["IncomingBytes"] }),
        }
      );
    });

    it("normalizes sparse response to empty arrays", async () => {
      mockApi.mockResolvedValueOnce({});
      const { result } = renderHook(() => useEnableKinesisMonitoring("stream-1"), {
        wrapper: createWrapper(),
      });
      const data = await result.current.mutateAsync([]);
      expect(data.currentShardLevelMetrics).toEqual([]);
    });
  });

  describe("useDisableKinesisMonitoring", () => {
    it("calls POST with correct URL and body", async () => {
      mockApi.mockResolvedValueOnce({
        currentShardLevelMetrics: [],
        desiredShardLevelMetrics: [],
      });
      const { result } = renderHook(() => useDisableKinesisMonitoring("stream-1"), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync(["IncomingBytes"]);
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/kinesis/streams/stream-1/monitoring/disable",
        {
          method: "POST",
          body: JSON.stringify({ shardLevelMetrics: ["IncomingBytes"] }),
        }
      );
    });
  });

  describe("useUpdateKinesisStreamMode", () => {
    it("calls PUT with correct URL and body", async () => {
      mockApi.mockResolvedValueOnce({ updated: true });
      const { result } = renderHook(() => useUpdateKinesisStreamMode("stream-1"), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync({
        streamARN: "arn:aws:kinesis:us-east-1::stream/stream-1",
        streamMode: "ON_DEMAND",
      });
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/kinesis/streams/stream-1/stream-mode",
        {
          method: "PUT",
          body: JSON.stringify({
            streamARN: "arn:aws:kinesis:us-east-1::stream/stream-1",
            streamMode: "ON_DEMAND",
          }),
        }
      );
    });
  });

  describe("useSplitKinesisShard", () => {
    it("calls POST with correct URL and body", async () => {
      mockApi.mockResolvedValueOnce({ split: true });
      const { result } = renderHook(() => useSplitKinesisShard("stream-1"), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync({
        shardToSplit: "shardId-1",
        newStartingHashKey: "170141183460469231731687303715884105728",
      });
      expect(mockApi).toHaveBeenCalledWith("/aws/kinesis/streams/stream-1/shards/split", {
        method: "POST",
        body: JSON.stringify({
          shardToSplit: "shardId-1",
          newStartingHashKey: "170141183460469231731687303715884105728",
        }),
      });
    });
  });

  describe("useMergeKinesisShards", () => {
    it("calls POST with correct URL and body", async () => {
      mockApi.mockResolvedValueOnce({ merged: true });
      const { result } = renderHook(() => useMergeKinesisShards("stream-1"), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync({
        shardToMerge: "shardId-1",
        adjacentShardToMerge: "shardId-2",
      });
      expect(mockApi).toHaveBeenCalledWith("/aws/kinesis/streams/stream-1/shards/merge", {
        method: "POST",
        body: JSON.stringify({
          shardToMerge: "shardId-1",
          adjacentShardToMerge: "shardId-2",
        }),
      });
    });
  });
});
