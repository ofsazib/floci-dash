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
  useAthenaWorkGroup,
  useAthenaQueryExecutions,
  useAthenaQueryExecution,
  useAthenaQueryResults,
  useStopAthenaQuery,
  useAthenaDataCatalogs,
  useAthenaDatabases,
  useAthenaTables,
  useAthenaTableMetadata,
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

  it("useAthenaWorkGroup does not call api when name is null", async () => {
    const { result } = renderHook(() => useAthenaWorkGroup(null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useAthenaWorkGroup calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ workGroup: { Name: "test" } });
    const { result } = renderHook(() => useAthenaWorkGroup("test"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/athena/work-groups/test");
  });

  it("useAthenaQueryResults does not call api when id is null", async () => {
    const { result } = renderHook(() => useAthenaQueryResults(null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useAthenaQueryResults calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ queryExecutionId: "q1", rows: [], headers: [], nextToken: null, totalRows: 0 });
    const { result } = renderHook(() => useAthenaQueryResults("q1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/athena/query-executions/q1/results");
  });

  it("useStopAthenaQuery calls POST", async () => {
    mockApi.mockResolvedValueOnce({ stopped: true });
    const { result } = renderHook(() => useStopAthenaQuery(), { wrapper: createWrapper() });
    await result.current.mutateAsync("q1");
    expect(mockApi).toHaveBeenCalledWith("/aws/athena/query-executions/q1/stop", { method: "POST" });
  });

  it("useAthenaTableMetadata does not call api when params are null", async () => {
    const { result } = renderHook(() => useAthenaTableMetadata(null, null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useAthenaTableMetadata calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ tableMetadata: { Name: "t1" } });
    const { result } = renderHook(() => useAthenaTableMetadata("mydb", "t1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/athena/databases/mydb/tables/t1");
  });
});
