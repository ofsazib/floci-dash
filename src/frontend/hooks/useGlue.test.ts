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
  useGlueDatabases,
  useCreateGlueDatabase,
  useDeleteGlueDatabase,
  useGlueTables,
  useDeleteGlueTable,
  useGlueRegistries,
  useCreateGlueRegistry,
  useDeleteGlueRegistry,
  useGlueSchemas,
  useCreateGlueSchema,
  useDeleteGlueSchema,
  useGlueSchemaVersions,
  useRegisterGlueSchemaVersion,
} from "./useGlue";

beforeEach(() => mockApi.mockReset());

describe("useGlue hooks", () => {
  it("useGlueDatabases calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ databases: [], total: 0 });
    const { result } = renderHook(() => useGlueDatabases(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases");
  });

  it("useCreateGlueDatabase calls POST", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => useCreateGlueDatabase(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "mydb" });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases", {
      method: "POST",
      body: JSON.stringify({ name: "mydb" }),
    });
  });

  it("useDeleteGlueDatabase calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteGlueDatabase(), { wrapper: createWrapper() });
    await result.current.mutateAsync("mydb");
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/mydb", { method: "DELETE" });
  });

  it("useGlueTables calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ tables: [], total: 0 });
    const { result } = renderHook(() => useGlueTables("mydb"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/mydb/tables");
  });

  it("useGlueTables disabled when null", () => {
    const { result } = renderHook(() => useGlueTables(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useDeleteGlueTable calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteGlueTable("mydb"), { wrapper: createWrapper() });
    await result.current.mutateAsync("table-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/mydb/tables/table-1", { method: "DELETE" });
  });

  // Schema Registry
  it("useGlueRegistries calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ registries: [], total: 0 });
    const { result } = renderHook(() => useGlueRegistries(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/registries");
  });

  it("useCreateGlueRegistry calls POST", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => useCreateGlueRegistry(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "reg-1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/registries", {
      method: "POST",
      body: JSON.stringify({ name: "reg-1" }),
    });
  });

  it("useDeleteGlueRegistry calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteGlueRegistry(), { wrapper: createWrapper() });
    await result.current.mutateAsync("reg-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/registries/reg-1", { method: "DELETE" });
  });

  it("useGlueSchemas calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ schemas: [], total: 0 });
    const { result } = renderHook(() => useGlueSchemas("reg-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/registries/reg-1/schemas");
  });

  it("useGlueSchemas disabled when null", () => {
    const { result } = renderHook(() => useGlueSchemas(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useCreateGlueSchema calls POST", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => useCreateGlueSchema("reg-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "s-1", dataFormat: "AVRO" });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/registries/reg-1/schemas", {
      method: "POST",
      body: JSON.stringify({ name: "s-1", dataFormat: "AVRO" }),
    });
  });

  it("useDeleteGlueSchema calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteGlueSchema("reg-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync("s-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/registries/reg-1/schemas/s-1", { method: "DELETE" });
  });

  it("useGlueSchemaVersions calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ versions: [], total: 0 });
    const { result } = renderHook(() => useGlueSchemaVersions("reg-1", "s-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/registries/reg-1/schemas/s-1/versions");
  });

  it("useGlueSchemaVersions disabled when registry is null", () => {
    const { result } = renderHook(() => useGlueSchemaVersions(null, "s-1"), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useGlueSchemaVersions disabled when schema is null", () => {
    const { result } = renderHook(() => useGlueSchemaVersions("reg-1", null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useRegisterGlueSchemaVersion calls POST", async () => {
    mockApi.mockResolvedValueOnce({ versionId: "v1", registered: true });
    const { result } = renderHook(() => useRegisterGlueSchemaVersion("reg-1", "s-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ definition: '{"type":"record"}' });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/registries/reg-1/schemas/s-1/versions", {
      method: "POST",
      body: JSON.stringify({ definition: '{"type":"record"}' }),
    });
  });
});
