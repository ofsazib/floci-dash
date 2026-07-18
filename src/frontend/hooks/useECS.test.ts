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
  useECSClusters,
  useECSCluster,
  useCreateECSCluster,
  useDeleteECSCluster,
  useECSTaskDefinitions,
  useECSTaskDefinitionFamilies,
  useECSTaskDefinition,
  useRegisterECSTaskDefinition,
  useDeregisterECSTaskDefinition,
  useECSServices,
  useCreateECSService,
  useUpdateECSService,
  useDeleteECSService,
  useECSTasks,
  useRunECSTask,
  useStopECSTask,
  useECSContainerInstances,
  useECSTags,
  useTagECSResource,
  useUntagECSResource,
  useECSAccountSettings,
  usePutECSAccountSetting,
  useDeleteECSAccountSetting,
  useECSAttributes,
  usePutECSAttributes,
  useDeleteECSAttributes,
  useECSTaskSets,
  useCreateECSTaskSet,
  useUpdateECSTaskSet,
  useSetPrimaryECSTaskSet,
  useDeleteECSTaskSet,
  useECSServiceDeployments,
} from "./useECS";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ── Clusters ─────────────────────────────────────────────

describe("useECSClusters", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ clusters: [], total: 0 });
    const { result } = renderHook(() => useECSClusters(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ecs/clusters");
  });
});

describe("useECSCluster", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useECSCluster(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with cluster name in path", async () => {
    mockApi.mockResolvedValueOnce({ cluster: {} });
    const { result } = renderHook(() => useECSCluster("my-cluster"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ecs/clusters/my-cluster");
  });
});

describe("useCreateECSCluster", () => {
  it("calls api with POST", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateECSCluster(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ clusterName: "test" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecs/clusters",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("useDeleteECSCluster", () => {
  it("calls api with DELETE and encoded cluster", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteECSCluster(), { wrapper: createWrapper() });
    await result.current.mutateAsync("arn:cluster/my-cluster");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecs/clusters?cluster=arn%3Acluster%2Fmy-cluster",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ── Task Definitions ────────────────────────────────────

describe("useECSTaskDefinitions", () => {
  it("calls api without familyPrefix by default", async () => {
    mockApi.mockResolvedValueOnce({ taskDefinitionArns: [], total: 0 });
    const { result } = renderHook(() => useECSTaskDefinitions(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ecs/task-definitions");
  });

  it("passes familyPrefix in query string", async () => {
    mockApi.mockResolvedValueOnce({ taskDefinitionArns: [], total: 0 });
    const { result } = renderHook(() => useECSTaskDefinitions("myfamily"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ecs/task-definitions?familyPrefix=myfamily");
  });
});

describe("useECSTaskDefinitionFamilies", () => {
  it("calls api with prefix", async () => {
    mockApi.mockResolvedValueOnce({ families: [] });
    const { result } = renderHook(() => useECSTaskDefinitionFamilies("fam"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ecs/task-definition-families?familyPrefix=fam");
  });

  it("calls api without prefix when undefined", async () => {
    mockApi.mockResolvedValueOnce({ families: [] });
    const { result } = renderHook(() => useECSTaskDefinitionFamilies(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ecs/task-definition-families");
  });
});

describe("useECSTaskDefinition", () => {
  it("does NOT call api when null", () => {
    renderHook(() => useECSTaskDefinition(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded task def name", async () => {
    mockApi.mockResolvedValueOnce({ taskDefinition: {}, tags: [] });
    const { result } = renderHook(() => useECSTaskDefinition("myfamily:1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ecs/task-definitions/myfamily%3A1");
  });
});

describe("useRegisterECSTaskDefinition", () => {
  it("calls api with POST", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRegisterECSTaskDefinition(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ family: "test" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecs/task-definitions",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("useDeregisterECSTaskDefinition", () => {
  it("calls api with DELETE and encoded name", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeregisterECSTaskDefinition(), { wrapper: createWrapper() });
    await result.current.mutateAsync("myfamily:1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecs/task-definitions/myfamily%3A1",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ── Services ────────────────────────────────────────────

describe("useECSServices", () => {
  it("does NOT call api when cluster is null", () => {
    renderHook(() => useECSServices(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with cluster param", async () => {
    mockApi.mockResolvedValueOnce({ services: [], total: 0 });
    const { result } = renderHook(() => useECSServices("my-cluster"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ecs/services?cluster=my-cluster");
  });
});

describe("useCreateECSService", () => {
  it("calls api with POST", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateECSService(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ cluster: "c1", serviceName: "s1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecs/services",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("useUpdateECSService", () => {
  it("calls api with PUT and query params", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUpdateECSService(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ cluster: "c1", service: "s1", desiredCount: 3 });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecs/services?cluster=c1&service=s1",
      expect.objectContaining({ method: "PUT" })
    );
  });
});

describe("useDeleteECSService", () => {
  it("calls api with DELETE and force=false", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteECSService(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ cluster: "c1", service: "s1", force: false });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecs/services?cluster=c1&service=s1&force=false",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("calls api with DELETE and force=true", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteECSService(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ cluster: "c1", service: "s1", force: true });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecs/services?cluster=c1&service=s1&force=true",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ── Tasks ───────────────────────────────────────────────

describe("useECSTasks", () => {
  it("does NOT call api when cluster is null", () => {
    renderHook(() => useECSTasks(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with cluster param only", async () => {
    mockApi.mockResolvedValueOnce({ tasks: [], total: 0 });
    const { result } = renderHook(() => useECSTasks("my-cluster"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ecs/tasks?cluster=my-cluster");
  });

  it("passes desiredStatus param", async () => {
    mockApi.mockResolvedValueOnce({ tasks: [], total: 0 });
    const { result } = renderHook(() => useECSTasks("my-cluster", "STOPPED"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ecs/tasks?cluster=my-cluster&desiredStatus=STOPPED");
  });
});

describe("useRunECSTask", () => {
  it("calls api with POST to /tasks/run", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRunECSTask(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ cluster: "c1", taskDefinition: "td:1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecs/tasks/run",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("useStopECSTask", () => {
  it("calls api with POST to /tasks/stop", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useStopECSTask(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ cluster: "c1", task: "t1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecs/tasks/stop",
      expect.objectContaining({ method: "POST" })
    );
  });
});

// ── Container Instances ─────────────────────────────────

describe("useECSContainerInstances", () => {
  it("does NOT call api when cluster is null", () => {
    renderHook(() => useECSContainerInstances(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with cluster param", async () => {
    mockApi.mockResolvedValueOnce({ containerInstances: [], total: 0 });
    const { result } = renderHook(() => useECSContainerInstances("my-cluster"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ecs/container-instances?cluster=my-cluster");
  });
});

// ── Tags ────────────────────────────────────────────────

describe("useECSTags", () => {
  it("does NOT call api when resourceArn is null", () => {
    renderHook(() => useECSTags(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with resourceArn param", async () => {
    mockApi.mockResolvedValueOnce({ tags: [] });
    const { result } = renderHook(() => useECSTags("arn:cluster1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ecs/tags?resourceArn=arn%3Acluster1");
  });
});

describe("useTagECSResource", () => {
  it("calls api with POST", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useTagECSResource(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ resourceArn: "arn:1", tags: [] });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecs/tags",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("useUntagECSResource", () => {
  it("calls api with DELETE and tagKeys as comma-separated", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUntagECSResource(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ resourceArn: "arn:1", tagKeys: ["env", "team"] });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecs/tags?resourceArn=arn%3A1&tagKeys=env,team",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ── Account Settings ─────────────────────────────────────

describe("useECSAccountSettings", () => {
  it("calls api with base URL", async () => {
    mockApi.mockResolvedValueOnce({ settings: [], total: 0 });
    const { result } = renderHook(() => useECSAccountSettings(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ecs/account-settings");
  });

  it("adds effectiveSettings query when requested", async () => {
    mockApi.mockResolvedValueOnce({ settings: [], total: 0 });
    const { result } = renderHook(() => useECSAccountSettings(true), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ecs/account-settings?effectiveSettings=true");
  });
});

describe("usePutECSAccountSetting", () => {
  it("calls api with PUT", async () => {
    mockApi.mockResolvedValueOnce({ setting: {} });
    const { result } = renderHook(() => usePutECSAccountSetting(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "containerInsights", value: "enabled" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecs/account-settings",
      expect.objectContaining({ method: "PUT" })
    );
  });
});

describe("useDeleteECSAccountSetting", () => {
  it("calls api with DELETE and encoded name", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteECSAccountSetting(), { wrapper: createWrapper() });
    await result.current.mutateAsync("containerInsights");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecs/account-settings?name=containerInsights",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ── Attributes ───────────────────────────────────────────

describe("useECSAttributes", () => {
  it("does NOT call api when cluster is null", () => {
    renderHook(() => useECSAttributes(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with cluster and default targetType", async () => {
    mockApi.mockResolvedValueOnce({ attributes: [], total: 0 });
    const { result } = renderHook(() => useECSAttributes("c1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ecs/attributes?cluster=c1&targetType=container-instance");
  });
});

describe("usePutECSAttributes", () => {
  it("calls api with POST", async () => {
    mockApi.mockResolvedValueOnce({ attributes: [] });
    const { result } = renderHook(() => usePutECSAttributes(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ cluster: "c1", attributes: [] });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecs/attributes",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("useDeleteECSAttributes", () => {
  it("calls api with DELETE and body", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteECSAttributes(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ cluster: "c1", attributes: [{ name: "x", targetId: "t" }] });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecs/attributes",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ── Task Sets ────────────────────────────────────────────

describe("useECSTaskSets", () => {
  it("does NOT call api when cluster/service missing", () => {
    renderHook(() => useECSTaskSets(null, "svc"), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with cluster and service", async () => {
    mockApi.mockResolvedValueOnce({ taskSets: [], total: 0 });
    const { result } = renderHook(() => useECSTaskSets("c1", "svc1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ecs/task-sets?cluster=c1&service=svc1");
  });
});

describe("useCreateECSTaskSet", () => {
  it("calls api with POST", async () => {
    mockApi.mockResolvedValueOnce({ taskSet: {} });
    const { result } = renderHook(() => useCreateECSTaskSet(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ cluster: "c1", service: "svc1", taskDefinition: "td:1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecs/task-sets",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("useUpdateECSTaskSet", () => {
  it("calls api with PUT", async () => {
    mockApi.mockResolvedValueOnce({ taskSet: {} });
    const { result } = renderHook(() => useUpdateECSTaskSet(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ cluster: "c1", service: "svc1", taskSet: "ts-1", scale: { value: 50, unit: "PERCENT" } });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecs/task-sets",
      expect.objectContaining({ method: "PUT" })
    );
  });
});

describe("useSetPrimaryECSTaskSet", () => {
  it("calls api with PUT on /primary", async () => {
    mockApi.mockResolvedValueOnce({ taskSet: {} });
    const { result } = renderHook(() => useSetPrimaryECSTaskSet(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ cluster: "c1", service: "svc1", primaryTaskSet: "ts-2" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecs/task-sets/primary",
      expect.objectContaining({ method: "PUT" })
    );
  });
});

describe("useDeleteECSTaskSet", () => {
  it("calls api with DELETE and force flag", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteECSTaskSet(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ cluster: "c1", service: "svc1", taskSet: "ts-1", force: true });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecs/task-sets?cluster=c1&service=svc1&taskSet=ts-1&force=true",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ── Service Deployments ──────────────────────────────────

describe("useECSServiceDeployments", () => {
  it("does NOT call api when service is null", () => {
    renderHook(() => useECSServiceDeployments(null, "c1"), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with service and cluster", async () => {
    mockApi.mockResolvedValueOnce({ serviceDeployments: [], total: 0 });
    const { result } = renderHook(() => useECSServiceDeployments("svc1", "c1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ecs/service-deployments?service=svc1&cluster=c1");
  });
});
