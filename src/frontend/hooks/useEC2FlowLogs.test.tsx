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
  useEC2FlowLogs,
  useEC2CreateFlowLog,
  useEC2DeleteFlowLog,
} from "./useEC2FlowLogs";

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

describe("useEC2FlowLogs", () => {
  it("calls api with correct URL without filter", async () => {
    mockApi.mockResolvedValueOnce({ flowLogs: [], total: 0 });
    const { result } = renderHook(() => useEC2FlowLogs(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ec2/flow-logs?");
  });

  it("calls api with resourceId filter", async () => {
    mockApi.mockResolvedValueOnce({ flowLogs: [], total: 0 });
    const { result } = renderHook(() => useEC2FlowLogs("vpc-123"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ec2/flow-logs?resourceId=vpc-123"
    );
  });

  it("calls api with null resourceId (no filter)", async () => {
    mockApi.mockResolvedValueOnce({ flowLogs: [], total: 0 });
    const { result } = renderHook(() => useEC2FlowLogs(null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ec2/flow-logs?");
  });

  it("returns flow log data", async () => {
    const data = {
      flowLogs: [
        {
          flowLogId: "fl-abc",
          resourceId: "vpc-xyz",
          resourceType: "VPC",
          trafficType: "ALL",
          logDestinationType: "s3",
          logDestination: "arn:aws:s3:::bucket",
          logFormat: "",
          maxAggregationInterval: 600,
          flowLogStatus: "ACTIVE",
          deliverLogsStatus: "SUCCESS",
          creationTime: "2025-01-01T00:00:00Z",
          deliverCrossAccountRole: null,
          tags: [],
        },
      ],
      total: 1,
    };
    mockApi.mockResolvedValueOnce(data);
    const { result } = renderHook(() => useEC2FlowLogs("vpc-xyz"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });
});

describe("useEC2CreateFlowLog", () => {
  it("calls api with POST method and correct body", async () => {
    mockApi.mockResolvedValueOnce({ flowLogIds: ["fl-new"], created: true });
    const { result } = renderHook(() => useEC2CreateFlowLog(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      resourceId: "vpc-abc",
      resourceType: "VPC",
      trafficType: "ALL",
      logDestinationType: "s3",
      logDestination: "arn:aws:s3:::bucket",
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ec2/flow-logs",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          resourceId: "vpc-abc",
          resourceType: "VPC",
          trafficType: "ALL",
          logDestinationType: "s3",
          logDestination: "arn:aws:s3:::bucket",
        }),
      })
    );
  });

  it("includes optional logFormat and maxAggregationInterval", async () => {
    mockApi.mockResolvedValueOnce({ flowLogIds: ["fl-fmt"], created: true });
    const { result } = renderHook(() => useEC2CreateFlowLog(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      resourceId: "vpc-abc",
      resourceType: "VPC",
      trafficType: "ACCEPT",
      logFormat: "${version} ${account-id}",
      maxAggregationInterval: 60,
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ec2/flow-logs",
      expect.objectContaining({
        body: JSON.stringify({
          resourceId: "vpc-abc",
          resourceType: "VPC",
          trafficType: "ACCEPT",
          logFormat: "${version} ${account-id}",
          maxAggregationInterval: 60,
        }),
      })
    );
  });
});

describe("useEC2DeleteFlowLog", () => {
  it("calls api with DELETE method and correct URL", async () => {
    mockApi.mockResolvedValueOnce({ id: "fl-abc", deleted: true });
    const { result } = renderHook(() => useEC2DeleteFlowLog(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("fl-abc");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ec2/flow-logs/fl-abc",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});
