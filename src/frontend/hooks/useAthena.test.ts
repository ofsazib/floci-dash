// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.hoisted(() => vi.fn());
vi.mock("../lib/client", () => ({ api: (...args: any[]) => mockApi(...args) }));
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, useQueryClient: () => ({ invalidateQueries: vi.fn() }) };
});

import {
  useAthenaWorkGroups,
  useCreateAthenaWorkGroup,
  useDeleteAthenaWorkGroup,
  useAthenaQueryExecutions,
  useAthenaQueryExecution,
  useAthenaDataCatalogs,
  useAthenaDatabases,
  useAthenaTables,
} from "./useAthena";

beforeEach(() => mockApi.mockReset());

describe("useAthena hooks", () => {
  it("useAthenaWorkGroups calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ workGroups: [], total: 0 });
    const { result } = renderHook(() => useAthenaWorkGroups(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/athena/work-groups");
  });

  it("useCreateAthenaWorkGroup calls POST", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => useCreateAthenaWorkGroup(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "my-wg" });
    expect(mockApi).toHaveBeenCalledWith("/aws/athena/work-groups", {
      method: "POST",
      body: JSON.stringify({ name: "my-wg" }),
    });
  });

  it("useDeleteAthenaWorkGroup calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteAthenaWorkGroup(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my-wg");
    expect(mockApi).toHaveBeenCalledWith("/aws/athena/work-groups/my-wg", { method: "DELETE" });
  });

  it("useAthenaQueryExecutions calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ queryExecutionIds: [], total: 0 });
    const { result } = renderHook(() => useAthenaQueryExecutions(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/athena/query-executions");
  });

  it("useAthenaQueryExecution calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ queryExecution: {} });
    const { result } = renderHook(() => useAthenaQueryExecution("qe-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/athena/query-executions/qe-1");
  });

  it("useAthenaQueryExecution disabled when null", () => {
    const { result } = renderHook(() => useAthenaQueryExecution(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useAthenaDataCatalogs calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ dataCatalogs: [], total: 0 });
    const { result } = renderHook(() => useAthenaDataCatalogs(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/athena/data-catalogs");
  });

  it("useAthenaDatabases calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ databases: [], total: 0 });
    const { result } = renderHook(() => useAthenaDatabases(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/athena/databases");
  });

  it("useAthenaTables calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ tables: [], total: 0 });
    const { result } = renderHook(() => useAthenaTables("default"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/athena/databases/default/tables");
  });

  it("useAthenaTables disabled when null", () => {
    const { result } = renderHook(() => useAthenaTables(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});
