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
  useIdentityStoreUsers,
  useCreateIdentityStoreUser,
  useDeleteIdentityStoreUser,
  useIdentityStoreGroups,
  useCreateIdentityStoreGroup,
  useDeleteIdentityStoreGroup,
  useIdentityStoreMemberships,
  useAddIdentityStoreMembership,
  useRemoveIdentityStoreMembership,
} from "./useIdentityStore";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useIdentityStoreUsers", () => {
  it("fetches users with encoded store id", async () => {
    mockApi.mockResolvedValueOnce({ users: [], total: 0 });
    const { result } = renderHook(() => useIdentityStoreUsers("d-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/identitystore/users?identityStoreId=d-1");
  });

  it("does not fetch when store id is null", () => {
    renderHook(() => useIdentityStoreUsers(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useCreateIdentityStoreUser", () => {
  it("POSTs the user body", async () => {
    mockApi.mockResolvedValueOnce({ userId: "u1" });
    const { result } = renderHook(() => useCreateIdentityStoreUser(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      identityStoreId: "d-1",
      userName: "jane",
      displayName: "Jane",
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/identitystore/users?identityStoreId=d-1", {
      method: "POST",
      body: JSON.stringify({ userName: "jane", displayName: "Jane" }),
    });
  });
});

describe("useDeleteIdentityStoreUser", () => {
  it("DELETEs with encoded ids", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteIdentityStoreUser(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ identityStoreId: "d-1", userId: "u 1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/identitystore/users/u%201?identityStoreId=d-1", {
      method: "DELETE",
    });
  });
});

describe("useIdentityStoreGroups", () => {
  it("fetches groups", async () => {
    mockApi.mockResolvedValueOnce({ groups: [], total: 0 });
    const { result } = renderHook(() => useIdentityStoreGroups("d-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/identitystore/groups?identityStoreId=d-1");
  });

  it("does not fetch when store id is null", () => {
    renderHook(() => useIdentityStoreGroups(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useCreateIdentityStoreGroup", () => {
  it("POSTs the group body", async () => {
    mockApi.mockResolvedValueOnce({ groupId: "g1" });
    const { result } = renderHook(() => useCreateIdentityStoreGroup(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ identityStoreId: "d-1", displayName: "admins" });
    expect(mockApi).toHaveBeenCalledWith("/aws/identitystore/groups?identityStoreId=d-1", {
      method: "POST",
      body: JSON.stringify({ displayName: "admins" }),
    });
  });
});

describe("useDeleteIdentityStoreGroup", () => {
  it("DELETEs with encoded ids", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteIdentityStoreGroup(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ identityStoreId: "d-1", groupId: "g 1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/identitystore/groups/g%201?identityStoreId=d-1", {
      method: "DELETE",
    });
  });
});

describe("useIdentityStoreMemberships", () => {
  it("fetches memberships", async () => {
    mockApi.mockResolvedValueOnce({ memberships: [], total: 0 });
    const { result } = renderHook(() => useIdentityStoreMemberships("d-1", "g1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/identitystore/groups/g1/memberships?identityStoreId=d-1"
    );
  });

  it("does not fetch when group is null", () => {
    renderHook(() => useIdentityStoreMemberships("d-1", null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useAddIdentityStoreMembership", () => {
  it("POSTs the userId", async () => {
    mockApi.mockResolvedValueOnce({ membershipId: "m1" });
    const { result } = renderHook(() => useAddIdentityStoreMembership(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ identityStoreId: "d-1", groupId: "g1", userId: "u1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/identitystore/groups/g1/memberships?identityStoreId=d-1",
      {
        method: "POST",
        body: JSON.stringify({ userId: "u1" }),
      }
    );
  });
});

describe("useRemoveIdentityStoreMembership", () => {
  it("DELETEs with encoded ids", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useRemoveIdentityStoreMembership(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ identityStoreId: "d-1", membershipId: "m 1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/identitystore/memberships/m%201?identityStoreId=d-1", {
      method: "DELETE",
    });
  });
});
