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
  useStacks,
  useStack,
  useStackTemplate,
  useStackResource,
  useCreateStack,
  useDeleteStack,
  useValidateTemplate,
  useExports,
  useChangeSets,
  useChangeSet,
  useCreateChangeSet,
  useExecuteChangeSet,
  useDeleteChangeSet,
  useStackSets,
  useStackSet,
  useCreateStackSet,
  useDeleteStackSet,
  useCreateStackInstances,
  useDeleteStackInstances,
  useStackPolicy,
  useSetStackPolicy,
  useStackSetOperation,
  useStackInstance,
  useUpdateStackSet,
  useAutoDeploymentTargets,
  useUpdateTerminationProtection,
  useOrganizationsAccess,
  useActivateOrganizationsAccess,
  useTemplateSummary,
} from "./useCloudFormation";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── Stacks list ────────────────────────────────────────

describe("useStacks", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ stacks: [], total: 0 });
    const { result } = renderHook(() => useStacks(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudformation/stacks");
  });
});

// ─── Stack detail ───────────────────────────────────────

describe("useStack", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useStack(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with stack name in path when provided", async () => {
    mockApi.mockResolvedValueOnce({ stack: {}, resources: [], events: [] });
    const { result } = renderHook(() => useStack("my-stack"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudformation/stacks/my-stack");
  });
});

// ─── Stack template ─────────────────────────────────────

describe("useStackTemplate", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useStackTemplate(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with template URL when name provided", async () => {
    mockApi.mockResolvedValueOnce({ name: "my-stack", template: "{}" });
    const { result } = renderHook(() => useStackTemplate("my-stack"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/cloudformation/stacks/my-stack/template"
    );
  });
});

// ─── Create stack ───────────────────────────────────────

describe("useCreateStack", () => {
  it("calls api with POST method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateStack(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ stackName: "s1", templateBody: "{}" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/cloudformation/stacks",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ stackName: "s1", templateBody: "{}" }),
      })
    );
  });
});

// ─── Delete stack ───────────────────────────────────────

describe("useDeleteStack", () => {
  it("calls api with DELETE method and name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteStack(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("s1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/cloudformation/stacks/s1",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── Validate template ──────────────────────────────────

describe("useValidateTemplate", () => {
  it("calls api with POST method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useValidateTemplate(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ templateBody: "{}" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/cloudformation/validate-template",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ templateBody: "{}" }),
      })
    );
  });
});

// ─── Exports ────────────────────────────────────────────

describe("useExports", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ exports: [], total: 0 });
    const { result } = renderHook(() => useExports(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudformation/exports");
  });
});

// ─── Change Sets ────────────────────────────────────────

describe("Change Sets", () => {
    it("useChangeSets — calls correct URL and returns data", async () => {
      mockApi.mockResolvedValueOnce({
        changeSets: [
          { name: "cs-1", executionStatus: "AVAILABLE", creationTime: "2025-01-01" },
        ],
        total: 1,
      });
      const { result } = renderHook(() => useChangeSets("my-stack"), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/cloudformation/stacks/my-stack/change-sets");
      expect(result.current.data?.changeSets).toHaveLength(1);
      expect(result.current.data?.changeSets[0].name).toBe("cs-1");
    });

    it("useChangeSets — disabled when stackName is null", () => {
      const { result } = renderHook(() => useChangeSets(null), { wrapper: createWrapper() });
      expect(result.current.isLoading).toBe(false);
      expect(mockApi).not.toHaveBeenCalled();
    });

    it("useChangeSet — calls correct URL", async () => {
      mockApi.mockResolvedValueOnce({
        changeSet: { name: "cs-1", executionStatus: "AVAILABLE" },
      });
      const { result } = renderHook(() => useChangeSet("my-stack", "cs-1"), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/cloudformation/stacks/my-stack/change-sets/cs-1");
      expect(result.current.data?.changeSet.name).toBe("cs-1");
    });

    it("useChangeSet — disabled when stackName or changeSetName is null", () => {
      const { result: r1 } = renderHook(() => useChangeSet(null, "cs-1"), { wrapper: createWrapper() });
      expect(r1.current.isLoading).toBe(false);
      const { result: r2 } = renderHook(() => useChangeSet("my-stack", null), { wrapper: createWrapper() });
      expect(r2.current.isLoading).toBe(false);
      expect(mockApi).not.toHaveBeenCalled();
    });

    it("useCreateChangeSet — posts to correct URL", async () => {
      mockApi.mockResolvedValueOnce({ created: true });
      const { result } = renderHook(() => useCreateChangeSet(), { wrapper: createWrapper() });
      result.current.mutate({ stackName: "my-stack", changeSetName: "cs-1", templateBody: "{}" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/cloudformation/change-sets", {
        method: "POST",
        body: JSON.stringify({ stackName: "my-stack", changeSetName: "cs-1", templateBody: "{}" }),
      });
    });

    it("useExecuteChangeSet — posts to correct URL and invalidates queries", async () => {
      mockApi.mockResolvedValueOnce({ executed: true });
      const { result } = renderHook(() => useExecuteChangeSet(), { wrapper: createWrapper() });
      result.current.mutate({ stackName: "my-stack", changeSetName: "cs-1" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/cloudformation/change-sets/execute", {
        method: "POST",
        body: JSON.stringify({ stackName: "my-stack", changeSetName: "cs-1" }),
      });
    });

    it("useDeleteChangeSet — sends DELETE with URL-encoded params", async () => {
      mockApi.mockResolvedValueOnce({ deleted: true });
      const { result } = renderHook(() => useDeleteChangeSet(), { wrapper: createWrapper() });
      result.current.mutate({ stackName: "my-stack", changeSetName: "cs-1" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/cloudformation/change-sets?name=cs-1&stack=my-stack",
        { method: "DELETE" }
      );
  });

// ─── Stack Sets ───────────────────────────────────────

describe("Stack Sets", () => {
  it("useStackSets — calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ stackSets: [{ name: "ss-1", status: "ACTIVE" }], total: 1 });
    const { result } = renderHook(() => useStackSets(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudformation/stacksets");
    expect(result.current.data?.stackSets).toHaveLength(1);
  });

  it("useStackSet — calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({
      stackSet: { name: "ss-1", status: "ACTIVE" },
      instances: [],
      operations: [],
    });
    const { result } = renderHook(() => useStackSet("ss-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudformation/stacksets/ss-1");
  });

  it("useStackSet — disabled when name is null", () => {
    const { result } = renderHook(() => useStackSet(null), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(false);
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useCreateStackSet — posts to correct URL", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => useCreateStackSet(), { wrapper: createWrapper() });
    result.current.mutate({ name: "ss-1", templateBody: "{}" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudformation/stacksets", {
      method: "POST",
      body: JSON.stringify({ name: "ss-1", templateBody: "{}" }),
    });
  });

  it("useDeleteStackSet — sends DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteStackSet(), { wrapper: createWrapper() });
    result.current.mutate("ss-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudformation/stacksets/ss-1", { method: "DELETE" });
  });

  it("useCreateStackInstances — posts to correct URL", async () => {
    mockApi.mockResolvedValueOnce({ instancesCreated: true });
    const { result } = renderHook(() => useCreateStackInstances(), { wrapper: createWrapper() });
    result.current.mutate({ stackSetName: "ss-1", accounts: ["123"], regions: ["us-east-1"] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudformation/stacksets/ss-1/instances", {
      method: "POST",
      body: JSON.stringify({ accounts: ["123"], regions: ["us-east-1"] }),
    });
  });

  it("useDeleteStackInstances — sends DELETE", async () => {
    mockApi.mockResolvedValueOnce({ instancesDeleted: true });
    const { result } = renderHook(() => useDeleteStackInstances(), { wrapper: createWrapper() });
    result.current.mutate({ stackSetName: "ss-1", accounts: ["123"], regions: ["us-east-1"] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudformation/stacksets/ss-1/instances", {
      method: "DELETE",
      body: JSON.stringify({ accounts: ["123"], regions: ["us-east-1"], retainStacks: undefined }),
    });
  });
});

// ─── Resource Detail ───────────────────────────────────

describe("useStackResource", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ resource: { logicalId: "MyBucket", resourceType: "AWS::S3::Bucket" } });
    const { result } = renderHook(() => useStackResource("my-stack", "MyBucket"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudformation/stacks/my-stack/resources/MyBucket");
    expect(result.current.data?.resource.logicalId).toBe("MyBucket");
  });

  it("disabled when stackName is null", () => {
    const { result } = renderHook(() => useStackResource(null, "MyBucket"), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(false);
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("disabled when logicalId is null", () => {
    const { result } = renderHook(() => useStackResource("my-stack", null), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(false);
    expect(mockApi).not.toHaveBeenCalled();
  });
});

// ─── Stack policy ───────────────────────────────────────

describe("useStackPolicy", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useStackPolicy(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with policy URL when name provided", async () => {
    mockApi.mockResolvedValueOnce({ name: "my-stack", policy: null });
    const { result } = renderHook(() => useStackPolicy("my-stack"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/cloudformation/stacks/my-stack/policy"
    );
  });
});

describe("useSetStackPolicy", () => {
  it("calls api with PUT method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSetStackPolicy(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ stackName: "s1", policyBody: "{}" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/cloudformation/stacks/s1/policy",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ policyBody: "{}" }),
      })
    );
  });
});

});

// ─── Stack Set operations / instances / org access ─────

describe("useStackSetOperation", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ operation: { id: "op-1" } });
    const { result } = renderHook(
      () => useStackSetOperation("my-ss", "op-1"),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudformation/stacksets/my-ss/operations/op-1");
  });

  it("disabled when operationId is null", () => {
    const { result } = renderHook(() => useStackSetOperation("my-ss", null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useStackInstance", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ instance: { account: "123" } });
    const { result } = renderHook(
      () => useStackInstance("my-ss", "123", "us-east-1"),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudformation/stacksets/my-ss/instances/123/us-east-1");
  });

  it("disabled when account is null", () => {
    const { result } = renderHook(() => useStackInstance("my-ss", null, "us-east-1"), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useUpdateStackSet", () => {
  it("sends PUT with serialized body", async () => {
    mockApi.mockResolvedValueOnce({ operationId: "op-9" });
    const { result } = renderHook(() => useUpdateStackSet(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      stackSetName: "my-ss", templateBody: "{}", description: "upd", parameters: [], operationId: "op-9",
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudformation/stacksets/my-ss", {
      method: "PUT",
      body: JSON.stringify({ templateBody: "{}", description: "upd", parameters: [], operationId: "op-9" }),
    });
  });
});

describe("useAutoDeploymentTargets", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ targets: [], total: 0 });
    const { result } = renderHook(() => useAutoDeploymentTargets("my-ss"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudformation/stacksets/my-ss/auto-deployment-targets");
  });

  it("disabled when stackSetName is null", () => {
    const { result } = renderHook(() => useAutoDeploymentTargets(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useUpdateTerminationProtection", () => {
  it("sends PUT with enabled flag", async () => {
    mockApi.mockResolvedValueOnce({ enabled: true });
    const { result } = renderHook(() => useUpdateTerminationProtection(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ stackName: "my-stack", enabled: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudformation/stacks/my-stack/termination-protection", {
      method: "PUT",
      body: JSON.stringify({ enabled: true }),
    });
  });
});

describe("useOrganizationsAccess", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ status: "ENABLED" });
    const { result } = renderHook(() => useOrganizationsAccess(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudformation/organizations-access");
  });
});

describe("useActivateOrganizationsAccess", () => {
  it("posts to activate endpoint", async () => {
    mockApi.mockResolvedValueOnce({ activated: true });
    const { result } = renderHook(() => useActivateOrganizationsAccess(), { wrapper: createWrapper() });
    await result.current.mutateAsync();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudformation/organizations-access/activate", { method: "POST" });
  });
});

describe("useTemplateSummary", () => {
  it("posts body and returns summary", async () => {
    mockApi.mockResolvedValueOnce({ summary: { description: "d" } });
    const { result } = renderHook(() => useTemplateSummary(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ templateBody: "{}" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudformation/template-summary", {
      method: "POST",
      body: JSON.stringify({ templateBody: "{}" }),
    });
    expect(result.current.data?.summary.description).toBe("d");
  });
});
