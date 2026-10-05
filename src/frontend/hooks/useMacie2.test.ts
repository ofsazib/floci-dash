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
  useMcSession,
  useMcEnableSession,
  useMcAdminAccounts,
  useMcEnableAdmin,
  useMcOrgConfiguration,
  useMcUpdateOrgConfiguration,
  useMcMembers,
  useMcCreateMember,
} from "./useMacie2";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useMcSession", () => {
  it("fetches the session", async () => {
    mockApi.mockResolvedValueOnce({ enabled: true, status: "ENABLED" });
    const { result } = renderHook(() => useMcSession(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/macie2/session");
  });
});

describe("useMcEnableSession", () => {
  it("POSTs the enable", async () => {
    mockApi.mockResolvedValueOnce({ enabled: true });
    const { result } = renderHook(() => useMcEnableSession(), { wrapper: createWrapper() });
    await result.current.mutateAsync();
    expect(mockApi).toHaveBeenCalledWith("/aws/macie2/session/enable", { method: "POST" });
  });
});

describe("useMcAdminAccounts", () => {
  it("fetches admin accounts", async () => {
    mockApi.mockResolvedValueOnce({ adminAccounts: [] });
    const { result } = renderHook(() => useMcAdminAccounts(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/macie2/organization/admins");
  });
});

describe("useMcEnableAdmin", () => {
  it("POSTs the accountId", async () => {
    mockApi.mockResolvedValueOnce({ enabled: true });
    const { result } = renderHook(() => useMcEnableAdmin(), { wrapper: createWrapper() });
    await result.current.mutateAsync("111111111111");
    expect(mockApi).toHaveBeenCalledWith("/aws/macie2/organization/admins/enable", {
      method: "POST",
      body: JSON.stringify({ accountId: "111111111111" }),
    });
  });
});

describe("useMcOrgConfiguration", () => {
  it("fetches the org configuration", async () => {
    mockApi.mockResolvedValueOnce({ autoEnable: false });
    const { result } = renderHook(() => useMcOrgConfiguration(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/macie2/organization/configuration");
  });
});

describe("useMcUpdateOrgConfiguration", () => {
  it("PATCHes autoEnable", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useMcUpdateOrgConfiguration(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync(true);
    expect(mockApi).toHaveBeenCalledWith("/aws/macie2/organization/configuration", {
      method: "PATCH",
      body: JSON.stringify({ autoEnable: true }),
    });
  });
});

describe("useMcMembers", () => {
  it("fetches members", async () => {
    mockApi.mockResolvedValueOnce({ members: [] });
    const { result } = renderHook(() => useMcMembers(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/macie2/members");
  });

  it("appends onlyAssociated=true to the URL", async () => {
    mockApi.mockResolvedValueOnce({ members: [] });
    const { result } = renderHook(() => useMcMembers(true), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/macie2/members?onlyAssociated=true");
  });
});

describe("useMcCreateMember", () => {
  it("POSTs accountId and email", async () => {
    mockApi.mockResolvedValueOnce({ arn: "arn:member" });
    const { result } = renderHook(() => useMcCreateMember(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ accountId: "222222222222", email: "m@e.c" });
    expect(mockApi).toHaveBeenCalledWith("/aws/macie2/members", {
      method: "POST",
      body: JSON.stringify({ accountId: "222222222222", email: "m@e.c" }),
    });
  });
});
