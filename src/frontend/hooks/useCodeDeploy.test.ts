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
  useCodeDeployApplications,
  useCreateCodeDeployApplication,
  useCodeDeployApplication,
  useDeleteCodeDeployApplication,
  useCodeDeployDeploymentGroups,
  useCreateCodeDeployDeploymentGroup,
  useCodeDeployDeploymentConfigs,
  useCreateCodeDeployDeploymentConfig,
  useCreateCodeDeployDeployment,
  useCodeDeployDeployments,
} from "./useCodeDeploy";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── Applications ─────────────────────────────────────

describe("useCodeDeployApplications", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ applications: [] });
    const { result } = renderHook(() => useCodeDeployApplications(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codedeploy/applications");
  });
});

describe("useCreateCodeDeployApplication", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateCodeDeployApplication(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ applicationName: "my-app" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/codedeploy/applications",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("invalidates applications query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useCreateCodeDeployApplication(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({ applicationName: "a" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "codedeploy", "applications"] });
  });
});

describe("useCodeDeployApplication", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useCodeDeployApplication(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with name in path when provided", async () => {
    mockApi.mockResolvedValueOnce({ application: {} });
    const { result } = renderHook(() => useCodeDeployApplication("my-app"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codedeploy/applications/my-app");
  });
});

describe("useDeleteCodeDeployApplication", () => {
  it("calls api with DELETE method and name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteCodeDeployApplication(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my-app");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/codedeploy/applications/my-app",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── Deployment Groups ────────────────────────────────

describe("useCodeDeployDeploymentGroups", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useCodeDeployDeploymentGroups(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with name in path when provided", async () => {
    mockApi.mockResolvedValueOnce({ deploymentGroups: [] });
    const { result } = renderHook(() => useCodeDeployDeploymentGroups("my-app"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codedeploy/applications/my-app/deployment-groups");
  });
});

describe("useCreateCodeDeployDeploymentGroup", () => {
  it("calls api with POST method and appName in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateCodeDeployDeploymentGroup(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      appName: "my-app",
      deploymentGroupName: "my-group",
      serviceRoleArn: "arn:aws:iam::123:role/MyRole",
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/codedeploy/applications/my-app/deployment-groups",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("invalidates deployment groups query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useCreateCodeDeployDeploymentGroup(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({
      appName: "my-app",
      deploymentGroupName: "g",
      serviceRoleArn: "arn:a",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["aws", "codedeploy", "applications", "my-app", "deployment-groups"],
    });
  });
});

// ─── Deployment Configs ───────────────────────────────

describe("useCodeDeployDeploymentConfigs", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ deploymentConfigs: [] });
    const { result } = renderHook(() => useCodeDeployDeploymentConfigs(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codedeploy/deployment-configs");
  });
});

describe("useCreateCodeDeployDeploymentConfig", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateCodeDeployDeploymentConfig(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ deploymentConfigName: "MyConfig" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/codedeploy/deployment-configs",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("invalidates deployment configs query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useCreateCodeDeployDeploymentConfig(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({ deploymentConfigName: "C" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "codedeploy", "deployment-configs"] });
  });
});

// ─── Deployments ──────────────────────────────────────

describe("useCodeDeployDeployments", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useCodeDeployDeployments(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with name in path when provided", async () => {
    mockApi.mockResolvedValueOnce({ deployments: [] });
    const { result } = renderHook(() => useCodeDeployDeployments("my-app"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codedeploy/applications/my-app/deployments");
  });
});

describe("useCreateCodeDeployDeployment", () => {
  it("calls api with POST method and appName in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateCodeDeployDeployment(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      appName: "my-app",
      deploymentGroupName: "my-group",
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/codedeploy/applications/my-app/deployments",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("invalidates deployments query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useCreateCodeDeployDeployment(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({ appName: "my-app", deploymentGroupName: "g" });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["aws", "codedeploy", "applications", "my-app", "deployments"],
    });
  });
});
