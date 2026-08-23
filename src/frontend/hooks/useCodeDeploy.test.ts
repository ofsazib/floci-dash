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
  useCodeDeployOnPremInstances,
  useRegisterCodeDeployOnPremInstance,
  useDeregisterCodeDeployOnPremInstance,
  useAddCodeDeployOnPremTags,
  useRemoveCodeDeployOnPremTags,
  useContinueCodeDeployDeployment,
  usePutCodeDeployLifecycleHookStatus,
  useCodeDeployDeploymentTargets,
  useStopCodeDeployDeployment,
  useUpdateCodeDeployDeploymentGroup,
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

describe("useCodeDeployOnPremInstances", () => {
  it("fetches the on-prem instance list", async () => {
    mockApi.mockResolvedValueOnce({ instances: [], total: 0 });
    const { result } = renderHook(() => useCodeDeployOnPremInstances(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codedeploy/on-prem-instances");
  });
});

describe("useRegisterCodeDeployOnPremInstance", () => {
  it("posts the registration body", async () => {
    mockApi.mockResolvedValueOnce({ registered: true });
    const { result } = renderHook(() => useRegisterCodeDeployOnPremInstance(), { wrapper: createWrapper() });
    result.current.mutate({ instanceName: "srv-1", iamUserArn: "arn:user" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codedeploy/on-prem-instances", {
      method: "POST",
      body: JSON.stringify({ instanceName: "srv-1", iamUserArn: "arn:user" }),
    });
  });
});

describe("useDeregisterCodeDeployOnPremInstance", () => {
  it("deletes by encoded name", async () => {
    mockApi.mockResolvedValueOnce({ deregistered: true });
    const { result } = renderHook(() => useDeregisterCodeDeployOnPremInstance(), { wrapper: createWrapper() });
    result.current.mutate("srv 1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codedeploy/on-prem-instances/srv%201", {
      method: "DELETE",
    });
  });
});

describe("useAddCodeDeployOnPremTags", () => {
  it("posts tags for the instances", async () => {
    mockApi.mockResolvedValueOnce({ tagged: true });
    const { result } = renderHook(() => useAddCodeDeployOnPremTags(), { wrapper: createWrapper() });
    result.current.mutate({ instanceNames: ["srv-1"], tags: [{ Key: "env", Value: "prod" }] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codedeploy/on-prem-instances/tags", {
      method: "POST",
      body: JSON.stringify({ instanceNames: ["srv-1"], tags: [{ Key: "env", Value: "prod" }] }),
    });
  });
});

describe("useRemoveCodeDeployOnPremTags", () => {
  it("posts untag for the instances", async () => {
    mockApi.mockResolvedValueOnce({ untagged: true });
    const { result } = renderHook(() => useRemoveCodeDeployOnPremTags(), { wrapper: createWrapper() });
    result.current.mutate({ instanceNames: ["srv-1"], tags: [{ Key: "env", Value: "" }] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codedeploy/on-prem-instances/untag", {
      method: "POST",
      body: JSON.stringify({ instanceNames: ["srv-1"], tags: [{ Key: "env", Value: "" }] }),
    });
  });
});

describe("useContinueCodeDeployDeployment", () => {
  it("posts continue for the deployment", async () => {
    mockApi.mockResolvedValueOnce({ continued: true });
    const { result } = renderHook(() => useContinueCodeDeployDeployment(), { wrapper: createWrapper() });
    result.current.mutate("d-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codedeploy/deployments/d-1/continue", {
      method: "POST",
    });
  });
});

describe("usePutCodeDeployLifecycleHookStatus", () => {
  it("posts the hook status", async () => {
    mockApi.mockResolvedValueOnce({ lifecycleEventHookExecutionId: "exe-1" });
    const { result } = renderHook(() => usePutCodeDeployLifecycleHookStatus(), { wrapper: createWrapper() });
    result.current.mutate({ id: "d-1", lifecycleEventHookExecutionId: "exe-1", status: "Succeeded" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codedeploy/deployments/d-1/lifecycle-hook-status", {
      method: "POST",
      body: JSON.stringify({ lifecycleEventHookExecutionId: "exe-1", status: "Succeeded" }),
    });
  });
});

describe("useCodeDeployDeploymentTargets", () => {
  it("lists then batch-gets targets", async () => {
    mockApi.mockResolvedValueOnce({ targetIds: ["t-1"] });
    mockApi.mockResolvedValueOnce({ targets: [{ deploymentTargetId: "t-1" }] });
    const { result } = renderHook(() => useCodeDeployDeploymentTargets("d-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenNthCalledWith(1, "/aws/codedeploy/deployments/d-1/targets");
    expect(mockApi).toHaveBeenNthCalledWith(2, "/aws/codedeploy/deployments/d-1/targets", {
      method: "POST",
      body: JSON.stringify({ targetIds: ["t-1"] }),
    });
    expect(result.current.data?.targets).toEqual([{ deploymentTargetId: "t-1" }]);
  });

  it("skips the batch-get when there are no target ids", async () => {
    mockApi.mockResolvedValueOnce({ targetIds: [] });
    const { result } = renderHook(() => useCodeDeployDeploymentTargets("d-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledTimes(1);
    expect(result.current.data?.targets).toEqual([]);
  });

  it("falls back to an empty list when the batch-get returns no targets", async () => {
    mockApi.mockResolvedValueOnce({ targetIds: ["t-1"] });
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCodeDeployDeploymentTargets("d-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.targets).toEqual([]);
  });

  it("is disabled without an id", () => {
    const { result } = renderHook(() => useCodeDeployDeploymentTargets(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useStopCodeDeployDeployment", () => {
  it("posts stop for the deployment", async () => {
    mockApi.mockResolvedValueOnce({ status: "Stopped" });
    const { result } = renderHook(() => useStopCodeDeployDeployment(), { wrapper: createWrapper() });
    result.current.mutate("d-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codedeploy/deployments/d-1/stop", { method: "POST" });
  });
});

describe("useUpdateCodeDeployDeploymentGroup", () => {
  it("puts the group update", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateCodeDeployDeploymentGroup(), { wrapper: createWrapper() });
    result.current.mutate({ appName: "a", groupName: "g", serviceRoleArn: "arn:role" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codedeploy/deployment-groups/a/g", {
      method: "PUT",
      body: JSON.stringify({ newDeploymentGroupName: undefined, deploymentConfigName: undefined, serviceRoleArn: "arn:role" }),
    });
  });
});
