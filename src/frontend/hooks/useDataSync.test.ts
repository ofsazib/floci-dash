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
  useDsAgents,
  useCreateDsAgent,
  useDeleteDsAgent,
  useDsLocations,
  useCreateDsLocation,
  useDeleteDsLocation,
  useDsTasks,
  useCreateDsTask,
  useDeleteDsTask,
} from "./useDataSync";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useDsAgents", () => {
  it("fetches agents", async () => {
    mockApi.mockResolvedValueOnce({ agents: [], total: 0 });
    const { result } = renderHook(() => useDsAgents(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/datasync/agents");
  });
});

describe("useCreateDsAgent", () => {
  it("POSTs the agent body", async () => {
    mockApi.mockResolvedValueOnce({ agentArn: "arn" });
    const { result } = renderHook(() => useCreateDsAgent(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ activationKey: "k", agentName: "a" });
    expect(mockApi).toHaveBeenCalledWith("/aws/datasync/agents", {
      method: "POST",
      body: JSON.stringify({ activationKey: "k", agentName: "a" }),
    });
  });
});

describe("useDeleteDsAgent", () => {
  it("DELETEs with the raw ARN path", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteDsAgent(), { wrapper: createWrapper() });
    await result.current.mutateAsync("arn:x/y");
    expect(mockApi).toHaveBeenCalledWith("/aws/datasync/agents/arn:x/y", {
      method: "DELETE",
    });
  });
});

describe("useDsLocations", () => {
  it("fetches locations", async () => {
    mockApi.mockResolvedValueOnce({ locations: [], total: 0 });
    const { result } = renderHook(() => useDsLocations(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/datasync/locations");
  });
});

describe("useCreateDsLocation", () => {
  it("POSTs the location body", async () => {
    mockApi.mockResolvedValueOnce({ locationArn: "arn" });
    const { result } = renderHook(() => useCreateDsLocation(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      blobType: "BLOCK",
      containerUrl: "u",
      agentArns: ["a"],
      authenticationType: "SAS",
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/datasync/locations", {
      method: "POST",
      body: JSON.stringify({
        blobType: "BLOCK",
        containerUrl: "u",
        agentArns: ["a"],
        authenticationType: "SAS",
      }),
    });
  });
});

describe("useDeleteDsLocation", () => {
  it("DELETEs with the raw ARN path", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteDsLocation(), { wrapper: createWrapper() });
    await result.current.mutateAsync("arn:l");
    expect(mockApi).toHaveBeenCalledWith("/aws/datasync/locations/arn:l", {
      method: "DELETE",
    });
  });
});

describe("useDsTasks", () => {
  it("fetches tasks", async () => {
    mockApi.mockResolvedValueOnce({ tasks: [], total: 0 });
    const { result } = renderHook(() => useDsTasks(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/datasync/tasks");
  });
});

describe("useCreateDsTask", () => {
  it("POSTs the task body", async () => {
    mockApi.mockResolvedValueOnce({ taskArn: "arn" });
    const { result } = renderHook(() => useCreateDsTask(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      sourceLocationArn: "src",
      destinationLocationArn: "dst",
      name: "t",
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/datasync/tasks", {
      method: "POST",
      body: JSON.stringify({
        sourceLocationArn: "src",
        destinationLocationArn: "dst",
        name: "t",
      }),
    });
  });
});

describe("useDeleteDsTask", () => {
  it("DELETEs with the raw ARN path", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteDsTask(), { wrapper: createWrapper() });
    await result.current.mutateAsync("arn:t");
    expect(mockApi).toHaveBeenCalledWith("/aws/datasync/tasks/arn:t", {
      method: "DELETE",
    });
  });
});
