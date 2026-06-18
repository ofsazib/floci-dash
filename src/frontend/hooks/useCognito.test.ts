// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.hoisted(() => vi.fn());

vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

import {
  useCognitoUserPools,
  useCognitoUserPool,
  useCreateCognitoUserPool,
  useDeleteCognitoUserPool,
  useCognitoUsers,
  useCreateCognitoUser,
  useDeleteCognitoUser,
  useDisableCognitoUser,
  useEnableCognitoUser,
  useCognitoGroups,
  useCreateCognitoGroup,
  useDeleteCognitoGroup,
  useCognitoUserPoolClients,
  useCreateCognitoUserPoolClient,
  useDeleteCognitoUserPoolClient,
} from "./useCognito";

beforeEach(() => mockApi.mockReset());

describe("useCognito hooks", () => {
  const POOL_ID = "us-east-1_abc";

  it("useCognitoUserPools calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ userPools: [], total: 0 });
    const { result } = renderHook(() => useCognitoUserPools(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cognito/user-pools");
  });

  it("useCognitoUserPool calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ userPool: {} });
    const { result } = renderHook(() => useCognitoUserPool(POOL_ID), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}`);
  });

  it("useCognitoUserPool disabled when null", () => {
    const { result } = renderHook(() => useCognitoUserPool(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useCreateCognitoUserPool calls POST", async () => {
    mockApi.mockResolvedValueOnce({ userPool: {} });
    const { result } = renderHook(() => useCreateCognitoUserPool(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ poolName: "mypool" });
    expect(mockApi).toHaveBeenCalledWith("/aws/cognito/user-pools", {
      method: "POST",
      body: JSON.stringify({ poolName: "mypool" }),
    });
  });

  it("useDeleteCognitoUserPool calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteCognitoUserPool(), { wrapper: createWrapper() });
    await result.current.mutateAsync(POOL_ID);
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}`, {
      method: "DELETE",
    });
  });

  it("useCognitoUsers calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ users: [], total: 0 });
    const { result } = renderHook(() => useCognitoUsers(POOL_ID), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/users`);
  });

  it("useCognitoUsers disabled when null", () => {
    const { result } = renderHook(() => useCognitoUsers(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useCreateCognitoUser calls POST", async () => {
    mockApi.mockResolvedValueOnce({ user: {} });
    const { result } = renderHook(() => useCreateCognitoUser(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({ username: "user1" });
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/users`, {
      method: "POST",
      body: JSON.stringify({ username: "user1" }),
    });
  });

  it("useDeleteCognitoUser calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteCognitoUser(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync("user1");
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/cognito/user-pools/${POOL_ID}/users/user1`,
      { method: "DELETE" }
    );
  });

  it("useDisableCognitoUser calls PUT disable", async () => {
    mockApi.mockResolvedValueOnce({ disabled: true });
    const { result } = renderHook(() => useDisableCognitoUser(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync("user1");
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/cognito/user-pools/${POOL_ID}/users/user1/disable`,
      { method: "PUT" }
    );
  });

  it("useEnableCognitoUser calls PUT enable", async () => {
    mockApi.mockResolvedValueOnce({ enabled: true });
    const { result } = renderHook(() => useEnableCognitoUser(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync("user1");
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/cognito/user-pools/${POOL_ID}/users/user1/enable`,
      { method: "PUT" }
    );
  });

  it("useCognitoGroups calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ groups: [], total: 0 });
    const { result } = renderHook(() => useCognitoGroups(POOL_ID), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/groups`);
  });

  it("useCognitoGroups disabled when null", () => {
    const { result } = renderHook(() => useCognitoGroups(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useCreateCognitoGroup calls POST", async () => {
    mockApi.mockResolvedValueOnce({ group: {} });
    const { result } = renderHook(() => useCreateCognitoGroup(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({ groupName: "admins" });
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/groups`, {
      method: "POST",
      body: JSON.stringify({ groupName: "admins" }),
    });
  });

  it("useDeleteCognitoGroup calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteCognitoGroup(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync("admins");
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/cognito/user-pools/${POOL_ID}/groups/admins`,
      { method: "DELETE" }
    );
  });

  it("useCognitoUserPoolClients calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ clients: [], total: 0 });
    const { result } = renderHook(() => useCognitoUserPoolClients(POOL_ID), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/clients`);
  });

  it("useCognitoUserPoolClients disabled when null", () => {
    const { result } = renderHook(() => useCognitoUserPoolClients(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useCreateCognitoUserPoolClient calls POST", async () => {
    mockApi.mockResolvedValueOnce({ client: {} });
    const { result } = renderHook(() => useCreateCognitoUserPoolClient(POOL_ID), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ clientName: "myapp" });
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/clients`, {
      method: "POST",
      body: JSON.stringify({ clientName: "myapp" }),
    });
  });

  it("useDeleteCognitoUserPoolClient calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteCognitoUserPoolClient(POOL_ID), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("client-1");
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/cognito/user-pools/${POOL_ID}/clients/client-1`,
      { method: "DELETE" }
    );
  });
});
