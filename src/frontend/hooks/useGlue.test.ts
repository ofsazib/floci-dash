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
  useGlueUDFs,
  useCreateGlueUDF,
  useDeleteGlueUDF,
  useGlueColumnStats,
  useUpdateGlueColumnStats,
  useDeleteGlueColumnStats,
  useGluePartitionColumnStats,
  useUpdateGlueUDF,
  useGluePartitions,
  useCreateGluePartitions,
  useUpdateGluePartition,
  useDeleteGluePartition,
  useUpdateGlueTable,
  useUpdateGlueDatabase,
  useGlueTableVersions,
  useBatchDeleteGlueTables,
  useGlueTags,
  useTagGlueResource,
  useUntagGlueResource,
  useUpdateGlueSchema,
  useDeleteGlueSchemaVersions,
  useGetGlueSchemaByDefinition,
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

  // UDFs
  it("useGlueUDFs calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ functions: [], total: 0 });
    const { result } = renderHook(() => useGlueUDFs("mydb"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/mydb/functions");
  });

  it("useGlueUDFs disabled when null", () => {
    const { result } = renderHook(() => useGlueUDFs(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useCreateGlueUDF calls POST", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => useCreateGlueUDF("mydb"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "my_udf", className: "com.example.MyUDF" });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/mydb/functions", {
      method: "POST",
      body: JSON.stringify({ name: "my_udf", className: "com.example.MyUDF" }),
    });
  });

  it("useDeleteGlueUDF calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteGlueUDF("mydb"), { wrapper: createWrapper() });
    await result.current.mutateAsync("my_udf");
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/mydb/functions/my_udf", { method: "DELETE" });
  });

  // Column Stats
  it("useGlueColumnStats calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ columnStats: [], total: 0 });
    const { result } = renderHook(() => useGlueColumnStats("mydb", "tbl1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/mydb/tables/tbl1/column-stats");
  });

  it("useGlueColumnStats disabled when database is null", () => {
    const { result } = renderHook(() => useGlueColumnStats(null, "tbl1"), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useGlueColumnStats disabled when table is null", () => {
    const { result } = renderHook(() => useGlueColumnStats("mydb", null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useUpdateGlueColumnStats calls POST", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateGlueColumnStats("mydb", "tbl1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ columnStatisticsList: [{ ColumnName: "col1" }] });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/mydb/tables/tbl1/column-stats", {
      method: "POST",
      body: JSON.stringify({ columnStatisticsList: [{ ColumnName: "col1" }] }),
    });
  });

  it("useDeleteGlueColumnStats calls DELETE with URL-encoded param", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteGlueColumnStats("mydb", "tbl1"), { wrapper: createWrapper() });
    await result.current.mutateAsync("col1");
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/mydb/tables/tbl1/column-stats?column=col1", { method: "DELETE" });
  });

  it("useGluePartitionColumnStats calls correct URL with values", async () => {
    mockApi.mockResolvedValueOnce({ columnStats: [], total: 0 });
    const { result } = renderHook(() => useGluePartitionColumnStats("mydb", "tbl1", ["2024"]), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/mydb/tables/tbl1/partitions/column-stats?values=2024");
  });

  it("useGluePartitionColumnStats disabled when partitionValues empty", () => {
    const { result } = renderHook(() => useGluePartitionColumnStats("mydb", "tbl1", []), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useUpdateGlueUDF calls PUT", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateGlueUDF("mydb"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ funcName: "my_udf", className: "com.example.New" });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/mydb/functions/my_udf", {
      method: "PUT",
      body: JSON.stringify({ className: "com.example.New" }),
    });
  });

  it("useGluePartitions calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ partitions: [], total: 0 });
    const { result } = renderHook(() => useGluePartitions("mydb", "tbl1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/mydb/tables/tbl1/partitions");
  });

  it("useGluePartitions disabled when db or table null", () => {
    const { result } = renderHook(() => useGluePartitions("mydb", null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useCreateGluePartitions calls POST", async () => {
    mockApi.mockResolvedValueOnce({ created: true, errors: [] });
    const { result } = renderHook(() => useCreateGluePartitions("mydb", "tbl1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ partitionInputList: [{ Values: ["2024"] }] });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/mydb/tables/tbl1/partitions", {
      method: "POST",
      body: JSON.stringify({ partitionInputList: [{ Values: ["2024"] }] }),
    });
  });

  it("useUpdateGluePartition calls PUT", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateGluePartition("mydb", "tbl1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ partitionValueList: ["2024"], partitionInput: { Values: ["2024"] } });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/mydb/tables/tbl1/partitions", {
      method: "PUT",
      body: JSON.stringify({ partitionValueList: ["2024"], partitionInput: { Values: ["2024"] } }),
    });
  });

  it("useDeleteGluePartition calls DELETE with encoded values", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteGluePartition("mydb", "tbl1"), { wrapper: createWrapper() });
    await result.current.mutateAsync(["2024", "01"]);
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/mydb/tables/tbl1/partitions?values=2024&values=01", { method: "DELETE" });
  });
});

describe("Glue update/version hooks", () => {
  it("useUpdateGlueTable puts by db+table", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateGlueTable(), { wrapper: createWrapper() });
    result.current.mutate({ databaseName: "d 1", tableName: "t 1", tableInput: { description: "x" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/d%201/tables/t%201", {
      method: "PUT",
      body: JSON.stringify({ tableInput: { description: "x" } }),
    });
  });

  it("useUpdateGlueDatabase puts by db", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateGlueDatabase(), { wrapper: createWrapper() });
    result.current.mutate({ databaseName: "d 1", databaseInput: { description: "x" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/d%201", {
      method: "PUT",
      body: JSON.stringify({ databaseInput: { description: "x" } }),
    });
  });

  it("useGlueTableVersions fetches encoded", async () => {
    mockApi.mockResolvedValueOnce({ versions: [], total: 0 });
    const { result } = renderHook(() => useGlueTableVersions("d 1", "t 1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/d%201/tables/t%201/versions");
  });

  it("useGlueTableVersions disabled without params", () => {
    const { result } = renderHook(() => useGlueTableVersions(null, null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useBatchDeleteGlueTables posts names", async () => {
    mockApi.mockResolvedValueOnce({ deleted: 2 });
    const { result } = renderHook(() => useBatchDeleteGlueTables(), { wrapper: createWrapper() });
    result.current.mutate({ databaseName: "d1", tableNames: ["t1", "t2"] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/databases/d1/tables/batch-delete", {
      method: "POST",
      body: JSON.stringify({ tableNames: ["t1", "t2"] }),
    });
  });

  // Tags
  it("useGlueTags calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ tags: { env: "prod" } });
    const { result } = renderHook(() => useGlueTags("arn:aws:glue:us-east-1:123:table/db/tbl"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/tags?resourceArn=arn%3Aaws%3Aglue%3Aus-east-1%3A123%3Atable%2Fdb%2Ftbl");
  });

  it("useGlueTags disabled without arn", () => {
    const { result } = renderHook(() => useGlueTags(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useTagGlueResource posts tags", async () => {
    mockApi.mockResolvedValueOnce({ tagged: true });
    const { result } = renderHook(() => useTagGlueResource(), { wrapper: createWrapper() });
    result.current.mutate({ resourceArn: "arn:test", tags: { k: "v" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/tags", {
      method: "POST",
      body: JSON.stringify({ resourceArn: "arn:test", tags: { k: "v" } }),
    });
  });

  it("useUntagGlueResource deletes tags", async () => {
    mockApi.mockResolvedValueOnce({ untagged: true });
    const { result } = renderHook(() => useUntagGlueResource(), { wrapper: createWrapper() });
    result.current.mutate({ resourceArn: "arn:test", tagKeys: ["k1"] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/tags/arn%3Atest?tagKey=k1", { method: "DELETE" });
  });

  // Schema extras
  it("useUpdateGlueSchema puts update", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateGlueSchema("reg1"), { wrapper: createWrapper() });
    result.current.mutate({ schemaName: "s1", compatibility: "BACKWARD" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/registries/reg1/schemas/s1", {
      method: "PUT",
      body: JSON.stringify({ compatibility: "BACKWARD", description: undefined }),
    });
  });

  it("useDeleteGlueSchemaVersions posts versions", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteGlueSchemaVersions("reg1", "s1"), { wrapper: createWrapper() });
    result.current.mutate([1, 2]);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/registries/reg1/schemas/s1/versions", {
      method: "DELETE",
      body: JSON.stringify({ versions: [1, 2] }),
    });
  });

  it("useGetGlueSchemaByDefinition posts definition", async () => {
    mockApi.mockResolvedValueOnce({ schemaVersionId: "v1" });
    const { result } = renderHook(() => useGetGlueSchemaByDefinition(), { wrapper: createWrapper() });
    result.current.mutate({ definition: "{}" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/schemas/by-definition", {
      method: "POST",
      body: JSON.stringify({ definition: "{}" }),
    });
  });
});
