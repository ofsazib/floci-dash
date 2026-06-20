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
  useBatchComputeEnvironments,
  useCreateBatchComputeEnvironment,
  useDeleteBatchComputeEnvironment,
  useBatchJobQueues,
  useCreateBatchJobQueue,
  useDeleteBatchJobQueue,
  useBatchJobDefinitions,
  useRegisterBatchJobDefinition,
  useDeregisterBatchJobDefinition,
  useBatchJobs,
  useSubmitBatchJob,
  useBatchJob,
  useTerminateBatchJob,
} from "./useBatch";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useBatchComputeEnvironments", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ computeEnvironments: [], total: 0 });
    const { result } = renderHook(() => useBatchComputeEnvironments(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/batch/compute-environments");
  });
});

describe("useCreateBatchComputeEnvironment", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateBatchComputeEnvironment(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ computeEnvironmentName: "ce1", type: "MANAGED" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/batch/compute-environments",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useDeleteBatchComputeEnvironment", () => {
  it("calls api with DELETE method and name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteBatchComputeEnvironment(), { wrapper: createWrapper() });
    await result.current.mutateAsync("ce1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/batch/compute-environments/ce1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("useBatchJobQueues", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ jobQueues: [], total: 0 });
    const { result } = renderHook(() => useBatchJobQueues(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/batch/job-queues");
  });
});

describe("useCreateBatchJobQueue", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateBatchJobQueue(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ jobQueueName: "jq1", priority: 5 });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/batch/job-queues",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useDeleteBatchJobQueue", () => {
  it("calls api with DELETE method and name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteBatchJobQueue(), { wrapper: createWrapper() });
    await result.current.mutateAsync("jq1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/batch/job-queues/jq1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("useBatchJobDefinitions", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ jobDefinitions: [], total: 0 });
    const { result } = renderHook(() => useBatchJobDefinitions(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/batch/job-definitions");
  });
});

describe("useRegisterBatchJobDefinition", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRegisterBatchJobDefinition(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ jobDefinitionName: "jd1", type: "container", containerProperties: {} });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/batch/job-definitions",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useDeregisterBatchJobDefinition", () => {
  it("calls api with DELETE method and name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeregisterBatchJobDefinition(), { wrapper: createWrapper() });
    await result.current.mutateAsync("jd1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/batch/job-definitions/jd1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("useBatchJobs", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ jobs: [], total: 0 });
    const { result } = renderHook(() => useBatchJobs(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/batch/jobs");
  });
});

describe("useSubmitBatchJob", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSubmitBatchJob(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ jobName: "test", jobQueue: "q1", jobDefinition: "d1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/batch/jobs",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useBatchJob", () => {
  it("does NOT call api when id is null", () => {
    renderHook(() => useBatchJob(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with id in path when provided", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useBatchJob("j1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/batch/jobs/j1");
  });
});

describe("useTerminateBatchJob", () => {
  it("calls api with POST method and id in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useTerminateBatchJob(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "j1", reason: "test" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/batch/jobs/j1/terminate",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
