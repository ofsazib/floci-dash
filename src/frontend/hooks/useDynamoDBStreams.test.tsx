// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useDynamoDBStreams,
  useDynamoDBStreamDetail,
  useDynamoDBGetShardIterator,
  useDynamoDBGetRecords,
  useDynamoDBStreamPoller,
} from "./useDynamoDBStreams";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useDynamoDBStreams", () => {
  it("calls api with correct URL without tableName", async () => {
    mockApi.mockResolvedValueOnce({ streams: [], total: 0 });
    const { result } = renderHook(() => useDynamoDBStreams(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/dynamodb/streams?");
  });

  it("calls api with tableName query param", async () => {
    mockApi.mockResolvedValueOnce({ streams: [], total: 0 });
    const { result } = renderHook(() => useDynamoDBStreams("users"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/streams?tableName=users"
    );
  });

  it("calls api with null tableName (no filter)", async () => {
    mockApi.mockResolvedValueOnce({ streams: [], total: 0 });
    const { result } = renderHook(() => useDynamoDBStreams(null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/dynamodb/streams?");
  });

  it("returns stream data", async () => {
    const data = {
      streams: [
        {
          streamArn: "arn:aws:dynamodb:.../stream/2025-01-01",
          streamLabel: "2025-01-01",
          tableName: "users",
        },
      ],
      total: 1,
    };
    mockApi.mockResolvedValueOnce(data);
    const { result } = renderHook(() => useDynamoDBStreams("users"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });
});

describe("useDynamoDBStreamDetail", () => {
  const streamArn =
    "arn:aws:dynamodb:us-east-1:123456789012:table/users/stream/2025-01-01";

  it("does not call api when streamArn is null", async () => {
    const { result } = renderHook(() => useDynamoDBStreamDetail(null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with URL-encoded streamArn", async () => {
    mockApi.mockResolvedValueOnce({
      streamArn,
      streamLabel: "2025-01-01",
      streamStatus: "ENABLED",
      streamViewType: "NEW_AND_OLD_IMAGES",
      tableName: "users",
      creationRequestDateTime: 1700000000,
      keySchema: [],
      shards: [],
      lastEvaluatedShardId: null,
    });
    const { result } = renderHook(
      () => useDynamoDBStreamDetail(streamArn),
      {
        wrapper: createWrapper(),
      }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/dynamodb/streams/${encodeURIComponent(streamArn)}`
    );
  });

  it("returns stream detail with shards", async () => {
    const detail = {
      streamArn,
      streamLabel: "2025-01-01",
      streamStatus: "ENABLED",
      streamViewType: "KEYS_ONLY",
      tableName: "users",
      creationRequestDateTime: 1700000000,
      keySchema: [{ attributeName: "pk", keyType: "HASH" }],
      shards: [
        {
          shardId: "shardId-000",
          parentShardId: null,
          adjacentParentShardId: null,
          sequenceNumberRange: {
            startingSequenceNumber: "100",
            endingSequenceNumber: null,
          },
        },
      ],
      lastEvaluatedShardId: null,
    };
    mockApi.mockResolvedValueOnce(detail);
    const { result } = renderHook(
      () => useDynamoDBStreamDetail(streamArn),
      {
        wrapper: createWrapper(),
      }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(detail);
  });
});

describe("useDynamoDBGetShardIterator", () => {
  const streamArn =
    "arn:aws:dynamodb:us-east-1:123456789012:table/users/stream/2025-01-01";

  it("calls api with POST, correct URL, and body", async () => {
    mockApi.mockResolvedValueOnce({ shardIterator: "iter-123" });
    const { result } = renderHook(() => useDynamoDBGetShardIterator(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      streamArn,
      shardId: "shardId-000",
      shardIteratorType: "TRIM_HORIZON",
    });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/dynamodb/streams/${encodeURIComponent(streamArn)}/shard-iterator`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          shardId: "shardId-000",
          shardIteratorType: "TRIM_HORIZON",
        }),
      })
    );
  });

  it("includes sequenceNumber in body when provided", async () => {
    mockApi.mockResolvedValueOnce({ shardIterator: "iter-456" });
    const { result } = renderHook(() => useDynamoDBGetShardIterator(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      streamArn,
      shardId: "shardId-001",
      shardIteratorType: "AT_SEQUENCE_NUMBER",
      sequenceNumber: "0000001",
    });
    expect(mockApi).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          shardId: "shardId-001",
          shardIteratorType: "AT_SEQUENCE_NUMBER",
          sequenceNumber: "0000001",
        }),
      })
    );
  });

  it("returns shardIterator from response", async () => {
    mockApi.mockResolvedValueOnce({ shardIterator: "iter-abc" });
    const { result } = renderHook(() => useDynamoDBGetShardIterator(), {
      wrapper: createWrapper(),
    });
    const data: { shardIterator: string } = await result.current.mutateAsync({
      streamArn,
      shardId: "shardId-000",
      shardIteratorType: "LATEST",
    });
    expect(data.shardIterator).toBe("iter-abc");
  });
});

describe("useDynamoDBGetRecords", () => {
  it("calls api with POST, correct URL, and body", async () => {
    mockApi.mockResolvedValueOnce({
      records: [],
      total: 0,
      nextShardIterator: null,
      millisBehindLatest: 0,
    });
    const { result } = renderHook(() => useDynamoDBGetRecords(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ shardIterator: "iter-abc", limit: 50 });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/streams/records",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ shardIterator: "iter-abc", limit: 50 }),
      })
    );
  });

  it("omits limit from body when not provided", async () => {
    mockApi.mockResolvedValueOnce({
      records: [],
      total: 0,
      nextShardIterator: null,
      millisBehindLatest: 0,
    });
    const { result } = renderHook(() => useDynamoDBGetRecords(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ shardIterator: "iter-abc" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/streams/records",
      expect.objectContaining({
        body: JSON.stringify({ shardIterator: "iter-abc" }),
      })
    );
  });

  it("returns records with nextShardIterator", async () => {
    const data = {
      records: [
        {
          eventID: "evt1",
          eventName: "INSERT",
          eventVersion: "1.1",
          eventSource: "aws:dynamodb",
          awsRegion: "us-east-1",
          dynamodb: {
            approximateCreationDateTime: 1700000000,
            keys: { pk: { S: "user1" } },
            newImage: { pk: { S: "user1" }, name: { S: "Alice" } },
            oldImage: {},
            sequenceNumber: "000001",
            sizeBytes: 50,
            streamViewType: "NEW_AND_OLD_IMAGES",
          },
          userIdentity: null,
        },
      ],
      total: 1,
      nextShardIterator: "next-iter",
      millisBehindLatest: 100,
    };
    mockApi.mockResolvedValueOnce(data);
    const { result } = renderHook(() => useDynamoDBGetRecords(), {
      wrapper: createWrapper(),
    });
    const resp: Awaited<ReturnType<typeof result.current.mutateAsync>> = await result.current.mutateAsync({
      shardIterator: "iter-abc",
    });
    expect(resp.total).toBe(1);
    expect(resp.nextShardIterator).toBe("next-iter");
    expect(resp.millisBehindLatest).toBe(100);
  });
});

describe("useDynamoDBStreamPoller", () => {
  it("pollRecords calls getRecords.mutateAsync with the shard iterator", async () => {
    mockApi.mockResolvedValueOnce({
      records: [],
      total: 0,
      nextShardIterator: null,
      millisBehindLatest: 0,
    });
    const { result } = renderHook(() => useDynamoDBStreamPoller(), {
      wrapper: createWrapper(),
    });
    const resp = await result.current.pollRecords("iter-1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/streams/records",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ shardIterator: "iter-1" }),
      })
    );
    expect(resp.total).toBe(0);
  });

  it("continuePolling fetches records when a next shard iterator is provided", async () => {
    mockApi.mockResolvedValueOnce({
      records: [{ eventID: "evt2", eventName: "MODIFY", dynamodb: null }],
      total: 1,
      nextShardIterator: null,
      millisBehindLatest: 10,
    });
    const { result } = renderHook(() => useDynamoDBStreamPoller(), {
      wrapper: createWrapper(),
    });
    const resp = await result.current.continuePolling("next-iter");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/streams/records",
      expect.objectContaining({
        body: JSON.stringify({ shardIterator: "next-iter" }),
      })
    );
    expect(resp?.total).toBe(1);
  });

  it("continuePolling returns null when next shard iterator is null", async () => {
    const { result } = renderHook(() => useDynamoDBStreamPoller(), {
      wrapper: createWrapper(),
    });
    const resp = result.current.continuePolling(null);
    expect(resp).toBeNull();
    expect(mockApi).not.toHaveBeenCalled();
  });
});
