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
  useSNSTopics,
  useSNSTopicAttributes,
  useSNSTopicTags,
  useSNSSubscriptions,
  useSNSPlatformApps,
  useSNSSmsMessages,
  useSNSPushNotifications,
  useCreateSNSTopic,
  useDeleteSNSTopic,
  useSetSNSTopicAttribute,
  useSNSTopicTagsMutation,
  useSNSSubscribe,
  useSNSUnsubscribe,
  useSNSPublish,
  useSNSPublishBatch,
  useCreateSNSPlatformApp,
  useDeleteSNSPlatformApp,
  extractTopicName,
} from "./useSNS";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

const TOPIC_ARN = "arn:aws:sns:us-east-1:123456789012:my-topic";
const ENCODED_ARN = encodeURIComponent(TOPIC_ARN);

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── Queries ──────────────────────────────────────────────────────

describe("useSNSTopics", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ topics: [] });
    const { result } = renderHook(() => useSNSTopics(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/sns/topics");
  });
});

describe("useSNSTopicAttributes", () => {
  it("does not call api when topicArn is null", async () => {
    const { result } = renderHook(() => useSNSTopicAttributes(null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL when topicArn is provided", async () => {
    mockApi.mockResolvedValueOnce({ attributes: {} });
    const { result } = renderHook(() => useSNSTopicAttributes(TOPIC_ARN), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/sns/topics/attributes?topicArn=${ENCODED_ARN}`,
    );
  });
});

describe("useSNSTopicTags", () => {
  it("does not call api when topicArn is null", async () => {
    const { result } = renderHook(() => useSNSTopicTags(null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL when topicArn is provided", async () => {
    mockApi.mockResolvedValueOnce({ tags: [] });
    const { result } = renderHook(() => useSNSTopicTags(TOPIC_ARN), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/sns/topics/tags?topicArn=${ENCODED_ARN}`);
  });
});

describe("useSNSSubscriptions", () => {
  it("does not call api when topicArn is null", async () => {
    const { result } = renderHook(() => useSNSSubscriptions(null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL when topicArn is provided", async () => {
    mockApi.mockResolvedValueOnce({ subscriptions: [] });
    const { result } = renderHook(() => useSNSSubscriptions(TOPIC_ARN), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/sns/subscriptions?topicArn=${ENCODED_ARN}`);
  });
});

describe("useSNSPlatformApps", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ platformApplications: [] });
    const { result } = renderHook(() => useSNSPlatformApps(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/sns/platform-apps");
  });
});

describe("useSNSSmsMessages", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ messages: [] });
    const { result } = renderHook(() => useSNSSmsMessages(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/sns/inspect/sms");
  });
});

describe("useSNSPushNotifications", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ notifications: [] });
    const { result } = renderHook(() => useSNSPushNotifications(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/sns/inspect/push");
  });
});

// ─── Mutations ────────────────────────────────────────────────────

describe("useCreateSNSTopic", () => {
  it("calls api with POST method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateSNSTopic(), { wrapper: createWrapper() });
    const params = { name: "my-topic" };
    await result.current.mutateAsync(params);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/sns/topics",
      expect.objectContaining({ method: "POST", body: JSON.stringify(params) }),
    );
  });
});

describe("useDeleteSNSTopic", () => {
  it("calls api with DELETE method and encoded topicArn", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteSNSTopic(), { wrapper: createWrapper() });
    await result.current.mutateAsync(TOPIC_ARN);
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/sns/topics?topicArn=${ENCODED_ARN}`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("useSetSNSTopicAttribute", () => {
  it("calls api with PUT method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSetSNSTopicAttribute(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      topicArn: TOPIC_ARN,
      attributeName: "DisplayName",
      attributeValue: "My Topic",
    });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/sns/topics/attributes?topicArn=${ENCODED_ARN}`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ attributeName: "DisplayName", attributeValue: "My Topic" }),
      }),
    );
  });
});

describe("useSNSTopicTagsMutation", () => {
  it("tag calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSNSTopicTagsMutation(), {
      wrapper: createWrapper(),
    });
    const tags = [{ Key: "env", Value: "prod" }];
    await result.current.tag.mutateAsync({ topicArn: TOPIC_ARN, tags });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/sns/topics/tags?topicArn=${ENCODED_ARN}`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ tags }),
      }),
    );
  });

  it("untag calls api with DELETE method and joined tagKeys", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSNSTopicTagsMutation(), {
      wrapper: createWrapper(),
    });
    await result.current.untag.mutateAsync({ topicArn: TOPIC_ARN, tagKeys: ["env", "team"] });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/sns/topics/tags?topicArn=${ENCODED_ARN}&tagKeys=env,team`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("useSNSSubscribe", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSNSSubscribe(), { wrapper: createWrapper() });
    const params = { topicArn: TOPIC_ARN, protocol: "email", endpoint: "a@b.com" };
    await result.current.mutateAsync(params);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/sns/subscriptions",
      expect.objectContaining({ method: "POST", body: JSON.stringify(params) }),
    );
  });
});

describe("useSNSUnsubscribe", () => {
  it("calls api with DELETE method and encoded subscriptionArn", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSNSUnsubscribe(), { wrapper: createWrapper() });
    const subArn = "arn:aws:sns:us-east-1:123:my-topic:abc";
    await result.current.mutateAsync({ subscriptionArn: subArn, topicArn: TOPIC_ARN });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/sns/subscriptions?subscriptionArn=${encodeURIComponent(subArn)}`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("useSNSPublish", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSNSPublish(), { wrapper: createWrapper() });
    const params = { topicArn: TOPIC_ARN, message: "hello" };
    await result.current.mutateAsync(params);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/sns/topics/publish",
      expect.objectContaining({ method: "POST", body: JSON.stringify(params) }),
    );
  });
});

describe("useSNSPublishBatch", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSNSPublishBatch(), { wrapper: createWrapper() });
    const params = {
      topicArn: TOPIC_ARN,
      entries: [{ Id: "1", Message: "m" }],
    };
    await result.current.mutateAsync(params);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/sns/topics/publish-batch",
      expect.objectContaining({ method: "POST", body: JSON.stringify(params) }),
    );
  });
});

describe("useCreateSNSPlatformApp", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateSNSPlatformApp(), {
      wrapper: createWrapper(),
    });
    const params = { name: "app", platform: "APNS" };
    await result.current.mutateAsync(params);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/sns/platform-apps",
      expect.objectContaining({ method: "POST", body: JSON.stringify(params) }),
    );
  });
});

describe("useDeleteSNSPlatformApp", () => {
  it("calls api with DELETE method and encoded arn", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteSNSPlatformApp(), {
      wrapper: createWrapper(),
    });
    const arn = "arn:aws:sns:us-east-1:123:app/APNS/myapp";
    await result.current.mutateAsync(arn);
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/sns/platform-apps?arn=${encodeURIComponent(arn)}`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── Pure helpers ─────────────────────────────────────────────────

describe("extractTopicName", () => {
  it("extracts the last colon-separated segment", () => {
    expect(extractTopicName(TOPIC_ARN)).toBe("my-topic");
  });

  it("returns the input when there are no colons", () => {
    expect(extractTopicName("plain")).toBe("plain");
  });
});
