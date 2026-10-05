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
  useDtAdminAccounts,
  useDtEnableAdmin,
  useDtGraphs,
  useDtOrgConfiguration,
  useDtUpdateOrgConfiguration,
  useDtMembers,
  useDtCreateMembers,
  useDtStartMonitoring,
} from "./useDetective";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useDtAdminAccounts", () => {
  it("fetches administrators", async () => {
    mockApi.mockResolvedValueOnce({ administrators: [] });
    const { result } = renderHook(() => useDtAdminAccounts(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/detective/organization/admins", {
      method: "POST",
    });
  });
});

describe("useDtEnableAdmin", () => {
  it("POSTs the accountId", async () => {
    mockApi.mockResolvedValueOnce({ enabled: true });
    const { result } = renderHook(() => useDtEnableAdmin(), { wrapper: createWrapper() });
    await result.current.mutateAsync("111111111111");
    expect(mockApi).toHaveBeenCalledWith("/aws/detective/organization/admins/enable", {
      method: "POST",
      body: JSON.stringify({ accountId: "111111111111" }),
    });
  });
});

describe("useDtGraphs", () => {
  it("fetches graphs", async () => {
    mockApi.mockResolvedValueOnce({ graphList: [] });
    const { result } = renderHook(() => useDtGraphs(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/detective/graphs", { method: "POST" });
  });
});

describe("useDtOrgConfiguration", () => {
  it("POSTs the graphArn", async () => {
    mockApi.mockResolvedValueOnce({ autoEnable: true });
    const { result } = renderHook(() => useDtOrgConfiguration("arn:graph"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/detective/organization/configuration/get", {
      method: "POST",
      body: JSON.stringify({ graphArn: "arn:graph" }),
    });
  });

  it("does not fetch when graphArn is null", () => {
    renderHook(() => useDtOrgConfiguration(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useDtUpdateOrgConfiguration", () => {
  it("POSTs graphArn and autoEnable", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useDtUpdateOrgConfiguration(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ graphArn: "arn:graph", autoEnable: true });
    expect(mockApi).toHaveBeenCalledWith("/aws/detective/organization/configuration", {
      method: "POST",
      body: JSON.stringify({ graphArn: "arn:graph", autoEnable: true }),
    });
  });
});

describe("useDtMembers", () => {
  it("POSTs the graphArn", async () => {
    mockApi.mockResolvedValueOnce({ memberDetails: [] });
    const { result } = renderHook(() => useDtMembers("arn:graph"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/detective/members", {
      method: "POST",
      body: JSON.stringify({ graphArn: "arn:graph" }),
    });
  });

  it("does not fetch when graphArn is null", () => {
    renderHook(() => useDtMembers(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useDtCreateMembers", () => {
  it("POSTs graphArn and accounts", async () => {
    mockApi.mockResolvedValueOnce({ members: [], unprocessedAccounts: [] });
    const { result } = renderHook(() => useDtCreateMembers(), { wrapper: createWrapper() });
    const accounts = [{ accountId: "222222222222", emailAddress: "m@e.c" }];
    await result.current.mutateAsync({ graphArn: "arn:graph", accounts });
    expect(mockApi).toHaveBeenCalledWith("/aws/detective/members/create", {
      method: "POST",
      body: JSON.stringify({ graphArn: "arn:graph", accounts }),
    });
  });
});

describe("useDtStartMonitoring", () => {
  it("POSTs graphArn and accountId", async () => {
    mockApi.mockResolvedValueOnce({ monitoring: true });
    const { result } = renderHook(() => useDtStartMonitoring(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ graphArn: "arn:graph", accountId: "222222222222" });
    expect(mockApi).toHaveBeenCalledWith("/aws/detective/members/monitoring", {
      method: "POST",
      body: JSON.stringify({ graphArn: "arn:graph", accountId: "222222222222" }),
    });
  });
});
