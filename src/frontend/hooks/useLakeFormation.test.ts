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
  useLakeFormationSettings,
  useUpdateLakeFormationSettings,
  useLakeFormationResources,
  useLakeFormationResourceDetail,
  useRegisterLakeFormationResource,
  useUpdateLakeFormationResource,
  useDeregisterLakeFormationResource,
  useLakeFormationPermissions,
  useGrantLakeFormationPermissions,
  useRevokeLakeFormationPermissions,
  useLfTags,
  useLfTag,
  useCreateLfTag,
  useUpdateLfTag,
  useDeleteLfTag,
  useAssignLfTags,
  useUnassignLfTags,
} from "./useLakeFormation";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useLakeFormationSettings", () => {
  it("fetches settings", async () => {
    mockApi.mockResolvedValueOnce({ dataLakeAdmins: [], allowExternalDataFiltering: false });
    const { result } = renderHook(() => useLakeFormationSettings(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lakeformation/settings");
  });
});

describe("useUpdateLakeFormationSettings", () => {
  it("puts settings and invalidates", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useUpdateLakeFormationSettings(), { wrapper: createWrapper() });
    result.current.mutate({ dataLakeAdmins: ["arn:aws:iam::1:user/a"], allowExternalDataFiltering: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lakeformation/settings", {
      method: "PUT",
      body: JSON.stringify({ dataLakeAdmins: ["arn:aws:iam::1:user/a"], allowExternalDataFiltering: true }),
    });
  });
});

describe("useLakeFormationResources", () => {
  it("fetches resources", async () => {
    mockApi.mockResolvedValueOnce({ resources: [], total: 0 });
    const { result } = renderHook(() => useLakeFormationResources(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lakeformation/resources");
  });
});

describe("useLakeFormationResourceDetail", () => {
  it("fetches resource detail with encoded arn", async () => {
    mockApi.mockResolvedValueOnce({ resourceArn: "arn:aws:s3:::x" });
    const { result } = renderHook(() => useLakeFormationResourceDetail("arn:aws:s3:::x"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lakeformation/resources/detail?resourceArn=arn%3Aaws%3As3%3A%3A%3Ax");
  });

  it("is disabled when resourceArn is null", () => {
    const { result } = renderHook(() => useLakeFormationResourceDetail(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useRegisterLakeFormationResource", () => {
  it("registers a resource", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useRegisterLakeFormationResource(), { wrapper: createWrapper() });
    result.current.mutate({ resourceArn: "arn:aws:s3:::x" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lakeformation/resources", {
      method: "POST",
      body: JSON.stringify({ resourceArn: "arn:aws:s3:::x" }),
    });
  });
});

describe("useUpdateLakeFormationResource", () => {
  it("updates a resource role", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useUpdateLakeFormationResource(), { wrapper: createWrapper() });
    result.current.mutate({ resourceArn: "arn:aws:s3:::x", roleArn: "arn:aws:iam::1:role/r" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lakeformation/resources", {
      method: "PUT",
      body: JSON.stringify({ resourceArn: "arn:aws:s3:::x", roleArn: "arn:aws:iam::1:role/r" }),
    });
  });
});

describe("useDeregisterLakeFormationResource", () => {
  it("deregisters a resource", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeregisterLakeFormationResource(), { wrapper: createWrapper() });
    result.current.mutate("arn:aws:s3:::x");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lakeformation/resources?resourceArn=arn%3Aaws%3As3%3A%3A%3Ax", {
      method: "DELETE",
    });
  });
});

describe("useLakeFormationPermissions", () => {
  it("fetches permissions", async () => {
    mockApi.mockResolvedValueOnce({ principalResourcePermissions: [], total: 0 });
    const { result } = renderHook(() => useLakeFormationPermissions(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lakeformation/permissions");
  });
});

describe("useGrantLakeFormationPermissions", () => {
  it("grants permissions", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useGrantLakeFormationPermissions(), { wrapper: createWrapper() });
    const body = { principal: "p", resource: { Database: { Name: "db" } }, permissions: ["SELECT"] };
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lakeformation/permissions/grant", { method: "POST", body: JSON.stringify(body) });
  });
});

describe("useRevokeLakeFormationPermissions", () => {
  it("revokes permissions", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useRevokeLakeFormationPermissions(), { wrapper: createWrapper() });
    const body = { principal: "p", resource: { Database: { Name: "db" } }, permissions: ["SELECT"] };
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lakeformation/permissions/revoke", { method: "POST", body: JSON.stringify(body) });
  });
});

describe("useLfTags", () => {
  it("fetches LF-tags", async () => {
    mockApi.mockResolvedValueOnce({ lfTags: [], total: 0 });
    const { result } = renderHook(() => useLfTags("123456789012"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lakeformation/lf-tags?catalogId=123456789012");
  });

  it("fetches LF-tags without catalogId", async () => {
    mockApi.mockResolvedValueOnce({ lfTags: [], total: 0 });
    const { result } = renderHook(() => useLfTags(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lakeformation/lf-tags");
  });
});

describe("useLfTag", () => {
  it("fetches a single LF-tag", async () => {
    mockApi.mockResolvedValueOnce({ tagKey: "env", tagValues: ["prod"] });
    const { result } = renderHook(() => useLfTag("env", "123"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lakeformation/lf-tags/env?catalogId=123");
  });

  it("is disabled when tagKey is null", () => {
    const { result } = renderHook(() => useLfTag(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useCreateLfTag", () => {
  it("creates an LF-tag", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useCreateLfTag(), { wrapper: createWrapper() });
    result.current.mutate({ tagKey: "env", tagValues: ["prod"] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lakeformation/lf-tags", {
      method: "POST",
      body: JSON.stringify({ tagKey: "env", tagValues: ["prod"] }),
    });
  });
});

describe("useUpdateLfTag", () => {
  it("updates an LF-tag", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useUpdateLfTag(), { wrapper: createWrapper() });
    result.current.mutate({ tagKey: "env", tagValuesToAdd: ["staging"] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lakeformation/lf-tags/env", {
      method: "PUT",
      body: JSON.stringify({ tagValuesToAdd: ["staging"], tagValuesToDelete: undefined, catalogId: undefined }),
    });
  });
});

describe("useDeleteLfTag", () => {
  it("deletes an LF-tag", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteLfTag(), { wrapper: createWrapper() });
    result.current.mutate({ tagKey: "env", catalogId: "123" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lakeformation/lf-tags/env?catalogId=123", { method: "DELETE" });
  });
});

describe("useAssignLfTags", () => {
  it("assigns LF-tags", async () => {
    mockApi.mockResolvedValueOnce({ failures: [] });
    const { result } = renderHook(() => useAssignLfTags(), { wrapper: createWrapper() });
    const body = { resource: { Database: { Name: "db" } }, lfTags: [{ TagKey: "env", TagValues: ["prod"] }] };
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lakeformation/lf-tags/assign", { method: "POST", body: JSON.stringify(body) });
  });
});

describe("useUnassignLfTags", () => {
  it("unassigns LF-tags", async () => {
    mockApi.mockResolvedValueOnce({ failures: [] });
    const { result } = renderHook(() => useUnassignLfTags(), { wrapper: createWrapper() });
    const body = { resource: { Database: { Name: "db" } }, lfTags: [{ TagKey: "env", TagValues: ["prod"] }] };
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lakeformation/lf-tags/unassign", { method: "POST", body: JSON.stringify(body) });
  });
});
