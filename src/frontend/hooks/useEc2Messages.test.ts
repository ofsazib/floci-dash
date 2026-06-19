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
  useEc2Messages,
  useAcknowledgeMessage,
  useSendReply,
} from "./useEc2Messages";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useEc2Messages", () => {
  it("calls api with POST and Destination", async () => {
    mockApi.mockResolvedValueOnce({ Messages: [] });
    const { result } = renderHook(() => useEc2Messages("i-123"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ec2messages/messages/get",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ Destination: "i-123" }),
      })
    );
  });

  it("does NOT call api when destination is null", () => {
    renderHook(() => useEc2Messages(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useAcknowledgeMessage", () => {
  it("calls api with POST and MessageId", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useAcknowledgeMessage(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("m-1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ec2messages/messages/acknowledge",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ MessageId: "m-1" }),
      })
    );
  });
});

describe("useSendReply", () => {
  it("calls api with POST, MessageId and Payload", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSendReply(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ MessageId: "m-1", Payload: "{}" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ec2messages/messages/send-reply",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ MessageId: "m-1", Payload: "{}" }),
      })
    );
  });
});
