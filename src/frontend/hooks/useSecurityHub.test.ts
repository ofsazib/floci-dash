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
  useShHub,
  useShEnableHub,
  useShUpdateHub,
  useShAdminAccounts,
  useShEnableAdmin,
  useShOrgConfiguration,
  useShUpdateOrgConfiguration,
  useShAggregators,
  useShCreateAggregator,
  useShGetAggregator,
  useShUpdateAggregator,
  useShPolicies,
  useShCreatePolicy,
  useShUpdatePolicy,
  useShAssociate,
  useShAssociation,
  useShDisassociate,
  useShAssociations,
} from "./useSecurityHub";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useShHub", () => {
  it("fetches the hub", async () => {
    mockApi.mockResolvedValueOnce({ enabled: true, hubArn: "arn:hub" });
    const { result } = renderHook(() => useShHub(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/securityhub/hub");
  });
});

describe("useShEnableHub", () => {
  it("POSTs the control finding generator", async () => {
    mockApi.mockResolvedValueOnce({ enabled: true });
    const { result } = renderHook(() => useShEnableHub(), { wrapper: createWrapper() });
    await result.current.mutateAsync("SECURITY_CONTROL");
    expect(mockApi).toHaveBeenCalledWith("/aws/securityhub/hub/enable", {
      method: "POST",
      body: JSON.stringify({ controlFindingGenerator: "SECURITY_CONTROL" }),
    });
  });

  it("POSTs without a generator", async () => {
    mockApi.mockResolvedValueOnce({ enabled: true });
    const { result } = renderHook(() => useShEnableHub(), { wrapper: createWrapper() });
    await result.current.mutateAsync(undefined);
    expect(mockApi).toHaveBeenCalledWith("/aws/securityhub/hub/enable", {
      method: "POST",
      body: JSON.stringify({ controlFindingGenerator: undefined }),
    });
  });
});

describe("useShUpdateHub", () => {
  it("PATCHes hub configuration", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useShUpdateHub(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ autoEnableControls: false });
    expect(mockApi).toHaveBeenCalledWith("/aws/securityhub/hub", {
      method: "PATCH",
      body: JSON.stringify({ autoEnableControls: false }),
    });
  });
});

describe("useShAdminAccounts", () => {
  it("fetches admin accounts", async () => {
    mockApi.mockResolvedValueOnce({ adminAccounts: [], feature: "SecurityHub" });
    const { result } = renderHook(() => useShAdminAccounts(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/securityhub/organization/admins");
  });
});

describe("useShEnableAdmin", () => {
  it("POSTs accountId and feature", async () => {
    mockApi.mockResolvedValueOnce({ adminAccountId: "a1" });
    const { result } = renderHook(() => useShEnableAdmin(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ accountId: "a1", feature: "SecurityHub" });
    expect(mockApi).toHaveBeenCalledWith("/aws/securityhub/organization/admins/enable", {
      method: "POST",
      body: JSON.stringify({ accountId: "a1", feature: "SecurityHub" }),
    });
  });
});

describe("useShOrgConfiguration", () => {
  it("fetches the org configuration", async () => {
    mockApi.mockResolvedValueOnce({ autoEnable: false });
    const { result } = renderHook(() => useShOrgConfiguration(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/securityhub/organization/configuration");
  });
});

describe("useShUpdateOrgConfiguration", () => {
  it("POSTs autoEnable", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useShUpdateOrgConfiguration(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ autoEnable: true, autoEnableStandards: "DEFAULT" });
    expect(mockApi).toHaveBeenCalledWith("/aws/securityhub/organization/configuration", {
      method: "POST",
      body: JSON.stringify({ autoEnable: true, autoEnableStandards: "DEFAULT" }),
    });
  });
});

describe("useShAggregators", () => {
  it("fetches aggregators", async () => {
    mockApi.mockResolvedValueOnce({ findingAggregators: [] });
    const { result } = renderHook(() => useShAggregators(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/securityhub/finding-aggregators");
  });
});

describe("useShCreateAggregator", () => {
  it("POSTs the linking mode and regions", async () => {
    mockApi.mockResolvedValueOnce({ findingAggregatorArn: "arn" });
    const { result } = renderHook(() => useShCreateAggregator(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ regionLinkingMode: "ALL_REGIONS", regions: ["us-east-1"] });
    expect(mockApi).toHaveBeenCalledWith("/aws/securityhub/finding-aggregators", {
      method: "POST",
      body: JSON.stringify({ regionLinkingMode: "ALL_REGIONS", regions: ["us-east-1"] }),
    });
  });
});

describe("useShGetAggregator", () => {
  it("POSTs the arn", async () => {
    mockApi.mockResolvedValueOnce({ findingAggregatorArn: "arn" });
    const { result } = renderHook(() => useShGetAggregator("arn"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/securityhub/finding-aggregators/get", {
      method: "POST",
      body: JSON.stringify({ findingAggregatorArn: "arn" }),
    });
  });

  it("does not fetch when arn is null", () => {
    renderHook(() => useShGetAggregator(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useShUpdateAggregator", () => {
  it("PATCHes the aggregator", async () => {
    mockApi.mockResolvedValueOnce({ findingAggregatorArn: "arn" });
    const { result } = renderHook(() => useShUpdateAggregator(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      findingAggregatorArn: "arn",
      regionLinkingMode: "ALL_REGIONS",
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/securityhub/finding-aggregators", {
      method: "PATCH",
      body: JSON.stringify({ findingAggregatorArn: "arn", regionLinkingMode: "ALL_REGIONS" }),
    });
  });
});

describe("useShPolicies", () => {
  it("fetches policies", async () => {
    mockApi.mockResolvedValueOnce({ configurationPolicySummaries: [] });
    const { result } = renderHook(() => useShPolicies(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/securityhub/configuration-policies");
  });
});

describe("useShCreatePolicy", () => {
  it("POSTs the policy", async () => {
    mockApi.mockResolvedValueOnce({ id: "p1" });
    const { result } = renderHook(() => useShCreatePolicy(), { wrapper: createWrapper() });
    const configurationPolicy = { SecurityHub: { ServiceEnabled: true } };
    await result.current.mutateAsync({ name: "baseline", configurationPolicy });
    expect(mockApi).toHaveBeenCalledWith("/aws/securityhub/configuration-policies", {
      method: "POST",
      body: JSON.stringify({ name: "baseline", configurationPolicy }),
    });
  });
});

describe("useShUpdatePolicy", () => {
  it("POSTs the policy update", async () => {
    mockApi.mockResolvedValueOnce({ id: "p1" });
    const { result } = renderHook(() => useShUpdatePolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "p1", name: "renamed" });
    expect(mockApi).toHaveBeenCalledWith("/aws/securityhub/configuration-policies/update", {
      method: "POST",
      body: JSON.stringify({ id: "p1", name: "renamed" }),
    });
  });
});

describe("useShAssociate", () => {
  it("POSTs the association", async () => {
    mockApi.mockResolvedValueOnce({ associationStatus: "PENDING" });
    const { result } = renderHook(() => useShAssociate(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      targetAccountId: "111111111111",
      configurationPolicyIdentifier: "p1",
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/securityhub/associations/associate", {
      method: "POST",
      body: JSON.stringify({
        targetAccountId: "111111111111",
        configurationPolicyIdentifier: "p1",
      }),
    });
  });
});

describe("useShAssociation", () => {
  it("POSTs the target", async () => {
    mockApi.mockResolvedValueOnce({ associationStatus: "SUCCESS" });
    const { result } = renderHook(
      () => useShAssociation({ targetAccountId: "111111111111" }),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/securityhub/associations/get", {
      method: "POST",
      body: JSON.stringify({ targetAccountId: "111111111111" }),
    });
  });

  it("does not fetch when target is null", () => {
    renderHook(() => useShAssociation(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useShDisassociate", () => {
  it("POSTs the disassociation", async () => {
    mockApi.mockResolvedValueOnce({ disassociating: true });
    const { result } = renderHook(() => useShDisassociate(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      targetAccountId: "111111111111",
      configurationPolicyIdentifier: "p1",
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/securityhub/associations/disassociate", {
      method: "POST",
      body: JSON.stringify({
        targetAccountId: "111111111111",
        configurationPolicyIdentifier: "p1",
      }),
    });
  });
});

describe("useShAssociations", () => {
  it("POSTs the list", async () => {
    mockApi.mockResolvedValueOnce({ configurationPolicyAssociationSummaries: [] });
    const { result } = renderHook(() => useShAssociations(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/securityhub/associations/list", {
      method: "POST",
    });
  });
});
