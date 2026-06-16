// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useSQSQueues,
  useSQSQueueAttributes,
  useSQSQueueTags,
  useSQSMessages,
  useSQSDLQSources,
  useCreateSQSQueue,
  useDeleteSQSQueue,
  useSetSQSAttributes,
  useSQSTags,
  usePurgeSQSQueue,
  useSendSQSMessage,
  useSendSQSBatch,
  useDeleteSQSMessage,
  useChangeSQSVisibility,
  extractQueueName,
} from "./useSQS";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

const QUEUE_URL = "http://localhost:4566/000000000000/my-queue";
const ENCODED_URL = encodeURIComponent(QUEUE_URL);

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── Queries ──────────────────────────────────────────────────────

describe("useSQSQueues", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ queueUrls: [] });
    const { result } = renderHook(() => useSQSQueues(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/sqs/queues");
  });
});

describe("useSQSQueueAttributes", () => {
  it("does not call api when queueUrl is null", async () => {
    const { result } = renderHook(() => useSQSQueueAttributes(null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL when queueUrl is provided", async () => {
    mockApi.mockResolvedValueOnce({ attributes: {} });
    const { result } = renderHook(() => useSQSQueueAttributes(QUEUE_URL), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/sqs/queues/attributes?queueUrl=${ENCODED_URL}`,
    );
  });
});

describe("useSQSQueueTags", () => {
  it("does not call api when queueUrl is null", async () => {
    const { result } = renderHook(() => useSQSQueueTags(null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL when queueUrl is provided", async () => {
    mockApi.mockResolvedValueOnce({ tags: {} });
    const { result } = renderHook(() => useSQSQueueTags(QUEUE_URL), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/sqs/queues/tags?queueUrl=${ENCODED_URL}`);
  });
});

describe("useSQSMessages", () => {
  it("does not call api when queueUrl is null", async () => {
    const { result } = renderHook(() => useSQSMessages(null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL when queueUrl is provided", async () => {
    mockApi.mockResolvedValueOnce({ messages: [] });
    const { result } = renderHook(() => useSQSMessages(QUEUE_URL), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/sqs/queues/messages?queueUrl=${ENCODED_URL}`);
  });
});

describe("useSQSDLQSources", () => {
  it("does not call api when queueUrl is null", async () => {
    const { result } = renderHook(() => useSQSDLQSources(null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL when queueUrl is provided", async () => {
    mockApi.mockResolvedValueOnce({ queueUrls: [] });
    const { result } = renderHook(() => useSQSDLQSources(QUEUE_URL), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/sqs/queues/dlq-sources?queueUrl=${ENCODED_URL}`,
    );
  });
});

// ─── Mutations ────────────────────────────────────────────────────

describe("useCreateSQSQueue", () => {
  it("calls api with POST method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateSQSQueue(), { wrapper: createWrapper() });
    const params = { queueName: "my-queue" };
    await result.current.mutateAsync(params);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/sqs/queues",
      expect.objectContaining({ method: "POST", body: JSON.stringify(params) }),
    );
  });
});

describe("useDeleteSQSQueue", () => {
  it("calls api with DELETE method and encoded queueUrl", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteSQSQueue(), { wrapper: createWrapper() });
    await result.current.mutateAsync(QUEUE_URL);
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/sqs/queues?queueUrl=${ENCODED_URL}`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("useSetSQSAttributes", () => {
  it("calls api with PUT method and wrapped attributes", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSetSQSAttributes(), { wrapper: createWrapper() });
    const attributes = { VisibilityTimeout: "30" };
    await result.current.mutateAsync({ queueUrl: QUEUE_URL, attributes });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/sqs/queues/attributes?queueUrl=${ENCODED_URL}`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ attributes }),
      }),
    );
  });
});

describe("useSQSTags", () => {
  it("tag calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSQSTags(), { wrapper: createWrapper() });
    const tags = { env: "prod" };
    await result.current.tag.mutateAsync({ queueUrl: QUEUE_URL, tags });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/sqs/queues/tags?queueUrl=${ENCODED_URL}`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ tags }),
      }),
    );
  });

  it("untag calls api with DELETE method and joined tagKeys", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSQSTags(), { wrapper: createWrapper() });
    await result.current.untag.mutateAsync({ queueUrl: QUEUE_URL, tagKeys: ["env", "team"] });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/sqs/queues/tags?queueUrl=${ENCODED_URL}&tagKeys=env,team`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("usePurgeSQSQueue", () => {
  it("calls api with POST method and encoded queueUrl", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => usePurgeSQSQueue(), { wrapper: createWrapper() });
    await result.current.mutateAsync(QUEUE_URL);
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/sqs/queues/purge?queueUrl=${ENCODED_URL}`,
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useSendSQSMessage", () => {
  it("calls api with POST method and encoded queueUrl", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSendSQSMessage(), { wrapper: createWrapper() });
    const params = { queueUrl: QUEUE_URL, messageBody: "hello" };
    await result.current.mutateAsync(params);
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/sqs/queues/messages?queueUrl=${ENCODED_URL}`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(params),
      }),
    );
  });
});

describe("useSendSQSBatch", () => {
  it("calls api with POST method and wrapped entries", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSendSQSBatch(), { wrapper: createWrapper() });
    const entries = [{ Id: "1", MessageBody: "m" }];
    await result.current.mutateAsync({ queueUrl: QUEUE_URL, entries });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/sqs/queues/messages/batch?queueUrl=${ENCODED_URL}`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ entries }),
      }),
    );
  });
});

describe("useDeleteSQSMessage", () => {
  it("calls api with DELETE method with both query params encoded", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteSQSMessage(), { wrapper: createWrapper() });
    const receiptHandle = "abc/def+ghi";
    await result.current.mutateAsync({ queueUrl: QUEUE_URL, receiptHandle });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/sqs/queues/messages/item?queueUrl=${ENCODED_URL}&receiptHandle=${encodeURIComponent(receiptHandle)}`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("useChangeSQSVisibility", () => {
  it("calls api with POST method with receiptHandle and visibilityTimeout in body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useChangeSQSVisibility(), {
      wrapper: createWrapper(),
    });
    const receiptHandle = "rh123";
    await result.current.mutateAsync({
      queueUrl: QUEUE_URL,
      receiptHandle,
      visibilityTimeout: 60,
    });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/sqs/queues/messages/visibility?queueUrl=${ENCODED_URL}`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ receiptHandle, visibilityTimeout: 60 }),
      }),
    );
  });
});

// ─── Pure helpers ─────────────────────────────────────────────────

describe("extractQueueName", () => {
  it("extracts the last path segment", () => {
    expect(extractQueueName(QUEUE_URL)).toBe("my-queue");
  });

  it("returns the input when there are no slashes", () => {
    expect(extractQueueName("plain")).toBe("plain");
  });
});
