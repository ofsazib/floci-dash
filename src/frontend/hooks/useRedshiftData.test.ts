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
  useRedshiftDataStatements,
  useExecuteRedshiftDataQuery,
  useDescribeRedshiftDataStatement,
  useRedshiftDataStatementResult,
  useCancelRedshiftDataStatement,
  useRedshiftDataDatabases,
  useRedshiftDataSchemas,
  useRedshiftDataTables,
} from "./useRedshiftData";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useRedshiftDataStatements", () => {
  it("fetches the statements list", async () => {
    mockApi.mockResolvedValueOnce({ statements: [{ Id: "st-1" }], total: 1 });
    const { result } = renderHook(() => useRedshiftDataStatements(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/redshiftdata/statements");
  });
});

describe("useExecuteRedshiftDataQuery", () => {
  it("POSTs the query body", async () => {
    mockApi.mockResolvedValueOnce({ id: "st-1", hasResultSet: true });
    const { result } = renderHook(() => useExecuteRedshiftDataQuery(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      clusterIdentifier: "c1",
      database: "dev",
      dbUser: "admin",
      sql: "SELECT 1",
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/redshiftdata/query", {
      method: "POST",
      body: JSON.stringify({
        clusterIdentifier: "c1",
        database: "dev",
        dbUser: "admin",
        sql: "SELECT 1",
      }),
    });
  });
});

describe("useDescribeRedshiftDataStatement", () => {
  it("fetches the statement detail with encoded id", async () => {
    mockApi.mockResolvedValueOnce({ id: "st 1", status: "FINISHED" });
    const { result } = renderHook(() => useDescribeRedshiftDataStatement("st 1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/redshiftdata/statements/st%201");
  });

  it("does not fetch when id is null", () => {
    renderHook(() => useDescribeRedshiftDataStatement(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useRedshiftDataStatementResult", () => {
  it("fetches the result with encoded id", async () => {
    mockApi.mockResolvedValueOnce({ columns: [], records: [], totalNumRows: 0 });
    const { result } = renderHook(() => useRedshiftDataStatementResult("st 1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/redshiftdata/statements/st%201/result");
  });

  it("does not fetch when id is null", () => {
    renderHook(() => useRedshiftDataStatementResult(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useCancelRedshiftDataStatement", () => {
  it("POSTs cancel with encoded id", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useCancelRedshiftDataStatement(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("st 1");
    expect(mockApi).toHaveBeenCalledWith("/aws/redshiftdata/statements/st%201/cancel", {
      method: "POST",
    });
  });
});

describe("useRedshiftDataDatabases", () => {
  it("fetches databases with encoded cluster", async () => {
    mockApi.mockResolvedValueOnce({ databases: ["dev"] });
    const { result } = renderHook(() => useRedshiftDataDatabases("c 1", "admin"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/redshiftdata/databases?cluster=c%201&dbUser=admin"
    );
  });

  it("does not fetch when cluster is null", () => {
    renderHook(() => useRedshiftDataDatabases(null, "admin"), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("does not fetch when dbUser is null", () => {
    renderHook(() => useRedshiftDataDatabases("c1", null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useRedshiftDataSchemas", () => {
  it("fetches schemas with encoded params", async () => {
    mockApi.mockResolvedValueOnce({ schemas: ["public"] });
    const { result } = renderHook(() => useRedshiftDataSchemas("c1", "dev", "admin"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/redshiftdata/schemas?cluster=c1&database=dev&dbUser=admin"
    );
  });

  it("does not fetch when database is null", () => {
    renderHook(() => useRedshiftDataSchemas("c1", null, "admin"), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useRedshiftDataTables", () => {
  it("fetches tables with encoded params", async () => {
    mockApi.mockResolvedValueOnce({ tables: [{ name: "t1" }] });
    const { result } = renderHook(() => useRedshiftDataTables("c1", "dev", "public", "admin"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/redshiftdata/tables?cluster=c1&database=dev&schema=public&dbUser=admin"
    );
  });

  it("does not fetch when schema is null", () => {
    renderHook(() => useRedshiftDataTables("c1", "dev", null, "admin"), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});
