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
  useI2DelegatedAdmins,
  useI2EnableDelegatedAdmin,
  useI2DisableDelegatedAdmin,
  useI2AccountStatus,
  useI2Enable,
  useI2OrgConfiguration,
  useI2UpdateOrgConfiguration,
} from "./useInspector2";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useI2DelegatedAdmins", () => {
  it("fetches delegated admins", async () => {
    mockApi.mockResolvedValueOnce({ delegatedAdminAccounts: [], total: 0 });
    const { result } = renderHook(() => useI2DelegatedAdmins(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/inspector2/delegated-admins");
  });
});

describe("useI2EnableDelegatedAdmin", () => {
  it("POSTs the accountId", async () => {
    mockApi.mockResolvedValueOnce({ delegatedAdminAccountId: "a1" });
    const { result } = renderHook(() => useI2EnableDelegatedAdmin(), { wrapper: createWrapper() });
    await result.current.mutateAsync("a1");
    expect(mockApi).toHaveBeenCalledWith("/aws/inspector2/delegated-admins/enable", {
      method: "POST",
      body: JSON.stringify({ accountId: "a1" }),
    });
  });
});

describe("useI2DisableDelegatedAdmin", () => {
  it("POSTs the accountId", async () => {
    mockApi.mockResolvedValueOnce({ delegatedAdminAccountId: "a1" });
    const { result } = renderHook(() => useI2DisableDelegatedAdmin(), { wrapper: createWrapper() });
    await result.current.mutateAsync("a1");
    expect(mockApi).toHaveBeenCalledWith("/aws/inspector2/delegated-admins/disable", {
      method: "POST",
      body: JSON.stringify({ accountId: "a1" }),
    });
  });
});

describe("useI2AccountStatus", () => {
  it("POSTs accountIds", async () => {
    mockApi.mockResolvedValueOnce({ accounts: [], failedAccounts: [] });
    const { result } = renderHook(() => useI2AccountStatus(["1"]), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/inspector2/account-status", {
      method: "POST",
      body: JSON.stringify({ accountIds: ["1"] }),
    });
  });

  it("does not fetch when accountIds is null", () => {
    renderHook(() => useI2AccountStatus(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useI2Enable", () => {
  it("POSTs resourceTypes", async () => {
    mockApi.mockResolvedValueOnce({ accounts: [] });
    const { result } = renderHook(() => useI2Enable(), { wrapper: createWrapper() });
    await result.current.mutateAsync(["EC2"]);
    expect(mockApi).toHaveBeenCalledWith("/aws/inspector2/enable", {
      method: "POST",
      body: JSON.stringify({ resourceTypes: ["EC2"] }),
    });
  });
});

describe("useI2OrgConfiguration", () => {
  it("fetches the org configuration", async () => {
    mockApi.mockResolvedValueOnce({ organizationConfiguration: null });
    const { result } = renderHook(() => useI2OrgConfiguration(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/inspector2/organization-configuration");
  });
});

describe("useI2UpdateOrgConfiguration", () => {
  it("PUTs autoEnable", async () => {
    mockApi.mockResolvedValueOnce({ organizationConfiguration: null });
    const { result } = renderHook(() => useI2UpdateOrgConfiguration(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ ec2: true });
    expect(mockApi).toHaveBeenCalledWith("/aws/inspector2/organization-configuration", {
      method: "PUT",
      body: JSON.stringify({ autoEnable: { ec2: true } }),
    });
  });
});
