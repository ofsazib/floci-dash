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
  useSmModels,
  useCreateSmModel,
  useDeleteSmModel,
  useSmEndpointConfigs,
  useCreateSmEndpointConfig,
  useDeleteSmEndpointConfig,
  useSmEndpoints,
  useCreateSmEndpoint,
  useUpdateSmEndpoint,
  useDeleteSmEndpoint,
  useSmTrainingJobs,
  useCreateSmTrainingJob,
  useStopSmTrainingJob,
} from "./useSageMaker";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useSmModels", () => {
  it("fetches models", async () => {
    mockApi.mockResolvedValueOnce({ models: [], total: 0 });
    const { result } = renderHook(() => useSmModels(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/sagemaker/models");
  });
});

describe("useCreateSmModel", () => {
  it("POSTs the model body", async () => {
    mockApi.mockResolvedValueOnce({ modelArn: "arn" });
    const { result } = renderHook(() => useCreateSmModel(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      modelName: "m1",
      primaryContainer: { Image: "img" },
      executionRoleArn: "role",
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/sagemaker/models", {
      method: "POST",
      body: JSON.stringify({
        modelName: "m1",
        primaryContainer: { Image: "img" },
        executionRoleArn: "role",
      }),
    });
  });
});

describe("useDeleteSmModel", () => {
  it("DELETEs with encoded name", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteSmModel(), { wrapper: createWrapper() });
    await result.current.mutateAsync("m 1");
    expect(mockApi).toHaveBeenCalledWith("/aws/sagemaker/models/m%201", { method: "DELETE" });
  });
});

describe("useSmEndpointConfigs", () => {
  it("fetches configs", async () => {
    mockApi.mockResolvedValueOnce({ configs: [], total: 0 });
    const { result } = renderHook(() => useSmEndpointConfigs(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/sagemaker/endpoint-configs");
  });
});

describe("useCreateSmEndpointConfig", () => {
  it("POSTs the config body", async () => {
    mockApi.mockResolvedValueOnce({ endpointConfigArn: "arn" });
    const { result } = renderHook(() => useCreateSmEndpointConfig(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      endpointConfigName: "cfg1",
      productionVariants: [{ ModelName: "m1" }],
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/sagemaker/endpoint-configs", {
      method: "POST",
      body: JSON.stringify({
        endpointConfigName: "cfg1",
        productionVariants: [{ ModelName: "m1" }],
      }),
    });
  });
});

describe("useDeleteSmEndpointConfig", () => {
  it("DELETEs with encoded name", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteSmEndpointConfig(), { wrapper: createWrapper() });
    await result.current.mutateAsync("cfg 1");
    expect(mockApi).toHaveBeenCalledWith("/aws/sagemaker/endpoint-configs/cfg%201", {
      method: "DELETE",
    });
  });
});

describe("useSmEndpoints", () => {
  it("fetches endpoints", async () => {
    mockApi.mockResolvedValueOnce({ endpoints: [], total: 0 });
    const { result } = renderHook(() => useSmEndpoints(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/sagemaker/endpoints");
  });
});

describe("useCreateSmEndpoint", () => {
  it("POSTs the endpoint body", async () => {
    mockApi.mockResolvedValueOnce({ endpointArn: "arn" });
    const { result } = renderHook(() => useCreateSmEndpoint(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ endpointName: "ep1", endpointConfigName: "cfg1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/sagemaker/endpoints", {
      method: "POST",
      body: JSON.stringify({ endpointName: "ep1", endpointConfigName: "cfg1" }),
    });
  });
});

describe("useUpdateSmEndpoint", () => {
  it("PUTs the new config", async () => {
    mockApi.mockResolvedValueOnce({ endpointArn: "arn" });
    const { result } = renderHook(() => useUpdateSmEndpoint(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ endpointName: "ep 1", endpointConfigName: "cfg2" });
    expect(mockApi).toHaveBeenCalledWith("/aws/sagemaker/endpoints/ep%201", {
      method: "PUT",
      body: JSON.stringify({ endpointConfigName: "cfg2" }),
    });
  });
});

describe("useDeleteSmEndpoint", () => {
  it("DELETEs with encoded name", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteSmEndpoint(), { wrapper: createWrapper() });
    await result.current.mutateAsync("ep 1");
    expect(mockApi).toHaveBeenCalledWith("/aws/sagemaker/endpoints/ep%201", {
      method: "DELETE",
    });
  });
});

describe("useSmTrainingJobs", () => {
  it("fetches training jobs", async () => {
    mockApi.mockResolvedValueOnce({ jobs: [], total: 0 });
    const { result } = renderHook(() => useSmTrainingJobs(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/sagemaker/training-jobs");
  });
});

describe("useCreateSmTrainingJob", () => {
  it("POSTs the job body", async () => {
    mockApi.mockResolvedValueOnce({ trainingJobArn: "arn" });
    const { result } = renderHook(() => useCreateSmTrainingJob(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      trainingJobName: "job1",
      algorithmSpecification: { TrainingImage: "img" },
      inputDataConfig: [{ ChannelName: "train" }],
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/sagemaker/training-jobs", {
      method: "POST",
      body: JSON.stringify({
        trainingJobName: "job1",
        algorithmSpecification: { TrainingImage: "img" },
        inputDataConfig: [{ ChannelName: "train" }],
      }),
    });
  });
});

describe("useStopSmTrainingJob", () => {
  it("POSTs stop with encoded name", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useStopSmTrainingJob(), { wrapper: createWrapper() });
    await result.current.mutateAsync("job 1");
    expect(mockApi).toHaveBeenCalledWith("/aws/sagemaker/training-jobs/job%201/stop", {
      method: "POST",
    });
  });
});
