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
  useGlueDatabases,
  useCreateGlueDatabase,
  useDeleteGlueDatabase,
  useGlueTables,
  useDeleteGlueTable,
  useGlueRegistries,
  useCreateGlueRegistry,
  useUpdateGlueRegistry,
  useDeleteGlueRegistry,
  useGlueSchemas,
  useCreateGlueSchema,
  useGlueSchemaVersions,
  useRegisterGlueSchemaVersion,
  useGlueSchemaVersion,
  useGlueSchemaVersionsDiff,
  useCheckSchemaVersionValidity,
  useSchemaVersionMetadata,
  usePutSchemaVersionMetadata,
  useRemoveSchemaVersionMetadata,
  useGlueUDFs,
  useCreateGlueUDF,
  useUpdateGlueUDF,
  useGlueColumnStats,
  useUpdateGlueColumnStats,
  useGluePartitionColumnStats,
  useGluePartitions,
  useCreateGluePartitions,
  useUpdateGluePartition,
  useBatchUpdateGluePartitions,
  useDeleteGluePartition,
} from "./useGlue";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("Glue databases + tables hooks", () => {
  it("useGlueDatabases fetches databases", async () => {
    mockApi.mockResolvedValueOnce({ databases: [], total: 0 });
    const { result } = renderHook(() => useGlueDatabases(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases");
  });

  it("useCreateGlueDatabase posts a database", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => useCreateGlueDatabase(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "db1", description: "d" });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases", {
      method: "POST",
      body: JSON.stringify({ name: "db1", description: "d" }),
    });
  });

  it("useDeleteGlueDatabase deletes a database", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteGlueDatabase(), { wrapper: createWrapper() });
    await result.current.mutateAsync("db 1");
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/db%201", { method: "DELETE" });
  });

  it("useGlueTables fetches tables when db set", async () => {
    mockApi.mockResolvedValueOnce({ tables: [], total: 0 });
    const { result } = renderHook(() => useGlueTables("db1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/db1/tables");
  });

  it("useGlueTables disabled when db null", async () => {
    const { result } = renderHook(() => useGlueTables(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useDeleteGlueTable deletes a table", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteGlueTable("db1"), { wrapper: createWrapper() });
    await result.current.mutateAsync("t1");
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/db1/tables/t1", { method: "DELETE" });
  });
});

describe("Glue registry hooks", () => {
  it("useGlueRegistries fetches registries", async () => {
    mockApi.mockResolvedValueOnce({ registries: [], total: 0 });
    const { result } = renderHook(() => useGlueRegistries(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/registries");
  });

  it("useCreateGlueRegistry posts a registry", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => useCreateGlueRegistry(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "reg1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/registries", {
      method: "POST",
      body: JSON.stringify({ name: "reg1" }),
    });
  });

  it("useUpdateGlueRegistry puts description", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateGlueRegistry(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "reg1", description: "new" });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/registries/reg1", {
      method: "PUT",
      body: JSON.stringify({ description: "new" }),
    });
  });

  it("useDeleteGlueRegistry deletes a registry", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteGlueRegistry(), { wrapper: createWrapper() });
    await result.current.mutateAsync("reg1");
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/registries/reg1", { method: "DELETE" });
  });
});

describe("Glue schema + version hooks", () => {
  it("useGlueSchemas fetches schemas", async () => {
    mockApi.mockResolvedValueOnce({ schemas: [], total: 0 });
    const { result } = renderHook(() => useGlueSchemas("reg1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/registries/reg1/schemas");
  });

  it("useCreateGlueSchema posts a schema", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => useCreateGlueSchema("reg1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "s1", dataFormat: "AVRO" });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/registries/reg1/schemas", {
      method: "POST",
      body: JSON.stringify({ name: "s1", dataFormat: "AVRO" }),
    });
  });

  it("useGlueSchemaVersions fetches versions", async () => {
    mockApi.mockResolvedValueOnce({ versions: [], total: 0 });
    const { result } = renderHook(() => useGlueSchemaVersions("reg1", "s1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/registries/reg1/schemas/s1/versions");
  });

  it("useRegisterGlueSchemaVersion posts a version", async () => {
    mockApi.mockResolvedValueOnce({ registered: true });
    const { result } = renderHook(() => useRegisterGlueSchemaVersion("reg1", "s1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ definition: "{}" });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/registries/reg1/schemas/s1/versions", {
      method: "POST",
      body: JSON.stringify({ definition: "{}" }),
    });
  });

  it("useGlueSchemaVersion fetches a specific version", async () => {
    mockApi.mockResolvedValueOnce({ version: { versionNumber: 2 } });
    const { result } = renderHook(() => useGlueSchemaVersion("reg1", "s1", 2), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/registries/reg1/schemas/s1/versions/2");
  });

  it("useGlueSchemaVersion disabled when versionNumber null", async () => {
    const { result } = renderHook(() => useGlueSchemaVersion("reg1", "s1", null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useGlueSchemaVersionsDiff fetches a diff", async () => {
    mockApi.mockResolvedValueOnce({ diff: "d" });
    const { result } = renderHook(() => useGlueSchemaVersionsDiff("reg1", "s1", 1, 2), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/registries/reg1/schemas/s1/versions-diff?first=1&second=2");
  });

  it("useCheckSchemaVersionValidity posts for validity", async () => {
    mockApi.mockResolvedValueOnce({ valid: true });
    const { result } = renderHook(() => useCheckSchemaVersionValidity(), { wrapper: createWrapper() });
    const resp = await result.current.mutateAsync({ dataFormat: "AVRO", definition: "{}" });
    expect(resp.valid).toBe(true);
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/schema-version-validity", {
      method: "POST",
      body: JSON.stringify({ dataFormat: "AVRO", definition: "{}" }),
    });
  });

  it("useSchemaVersionMetadata fetches metadata", async () => {
    mockApi.mockResolvedValueOnce({ metadataInfoMap: {} });
    const { result } = renderHook(() => useSchemaVersionMetadata("v-id-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/schema-versions/v-id-1/metadata");
  });

  it("usePutSchemaVersionMetadata posts metadata", async () => {
    mockApi.mockResolvedValueOnce({ added: true });
    const { result } = renderHook(() => usePutSchemaVersionMetadata("v-id-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ key: "owner", value: "team" });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/schema-versions/v-id-1/metadata", {
      method: "POST",
      body: JSON.stringify({ key: "owner", value: "team" }),
    });
  });

  it("useRemoveSchemaVersionMetadata posts to delete endpoint", async () => {
    mockApi.mockResolvedValueOnce({ removed: true });
    const { result } = renderHook(() => useRemoveSchemaVersionMetadata("v-id-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ key: "owner", value: "team" });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/schema-versions/v-id-1/metadata/delete", {
      method: "POST",
      body: JSON.stringify({ key: "owner", value: "team" }),
    });
  });
});

describe("Glue UDF + column stats hooks", () => {
  it("useGlueUDFs fetches functions", async () => {
    mockApi.mockResolvedValueOnce({ functions: [], total: 0 });
    const { result } = renderHook(() => useGlueUDFs("db1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/db1/functions");
  });

  it("useCreateGlueUDF posts a function", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => useCreateGlueUDF("db1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "f1", className: "com.X" });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/db1/functions", {
      method: "POST",
      body: JSON.stringify({ name: "f1", className: "com.X" }),
    });
  });

  it("useUpdateGlueUDF puts a function", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateGlueUDF("db1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ funcName: "f1", className: "com.Y" });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/db1/functions/f1", {
      method: "PUT",
      body: JSON.stringify({ className: "com.Y", ownerName: undefined, ownerType: undefined }),
    });
  });

  it("useGlueColumnStats fetches table stats", async () => {
    mockApi.mockResolvedValueOnce({ columnStats: [], total: 0 });
    const { result } = renderHook(() => useGlueColumnStats("db1", "t1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/db1/tables/t1/column-stats");
  });

  it("useUpdateGlueColumnStats posts stats", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateGlueColumnStats("db1", "t1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ columnStatisticsList: [{ ColumnName: "c" }] });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/db1/tables/t1/column-stats", {
      method: "POST",
      body: JSON.stringify({ columnStatisticsList: [{ ColumnName: "c" }] }),
    });
  });

  it("useGluePartitionColumnStats fetches partition stats with values query", async () => {
    mockApi.mockResolvedValueOnce({ columnStats: [], total: 0 });
    const { result } = renderHook(() => useGluePartitionColumnStats("db1", "t1", ["2024", "01"]), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/db1/tables/t1/partitions/column-stats?values=2024&values=01");
  });
});

describe("Glue partition hooks", () => {
  it("useGluePartitions fetches partitions", async () => {
    mockApi.mockResolvedValueOnce({ partitions: [], total: 0 });
    const { result } = renderHook(() => useGluePartitions("db1", "t1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/db1/tables/t1/partitions");
  });

  it("useCreateGluePartitions posts partitions", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => useCreateGluePartitions("db1", "t1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ partitionInputList: [{ Values: ["2024"] }] });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/db1/tables/t1/partitions", {
      method: "POST",
      body: JSON.stringify({ partitionInputList: [{ Values: ["2024"] }] }),
    });
  });

  it("useUpdateGluePartition puts a partition", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateGluePartition("db1", "t1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ partitionValueList: ["2024"], partitionInput: { Values: ["2024"] } });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/db1/tables/t1/partitions", {
      method: "PUT",
      body: JSON.stringify({ partitionValueList: ["2024"], partitionInput: { Values: ["2024"] } }),
    });
  });

  it("useBatchUpdateGluePartitions posts to batch-update", async () => {
    mockApi.mockResolvedValueOnce({ updated: true, errors: [] });
    const { result } = renderHook(() => useBatchUpdateGluePartitions("db1", "t1"), { wrapper: createWrapper() });
    const entries = [{ PartitionValueList: ["2024"], PartitionInput: { Values: ["2024"] } }];
    await result.current.mutateAsync({ entries });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/db1/tables/t1/partitions/batch-update", {
      method: "POST",
      body: JSON.stringify({ entries }),
    });
  });

  it("useDeleteGluePartition deletes with values query string", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteGluePartition("db1", "t1"), { wrapper: createWrapper() });
    await result.current.mutateAsync(["2024", "01"]);
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/db1/tables/t1/partitions?values=2024&values=01", { method: "DELETE" });
  });
});
