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
  useGlueFamily,
  useCreateGlueFamily,
  useDeleteGlueFamily,
  useUpdateGlueFamily,
  useStartGlueCrawler,
  useStopGlueCrawler,
  useGlueCrawlerMetrics,
  useStartGlueCrawlerSchedule,
  useStopGlueCrawlerSchedule,
  useUpdateGlueCrawlerSchedule,
  useStartGlueJobRun,
  useGlueJobRuns,
  useGlueJobRun,
  useGlueBatchGetJobs,
  useGlueBatchStopJobRun,
  useStartGlueTrigger,
  useStopGlueTrigger,
  useStartGlueWorkflowRun,
  useGlueWorkflowRuns,
  useGlueWorkflowRun,
  useStopGlueWorkflowRun,
  useResumeGlueWorkflowRun,
  useGlueWorkflowRunProperties,
  usePutGlueWorkflowRunProperties,
  useGlueBatchGetWorkflows,
  useGlueBatchDeleteConnections,
  useTestGlueConnection,
  useGlueResourcePolicy,
  useGlueResourcePolicies,
  usePutGlueResourcePolicy,
  useDeleteGlueResourcePolicy,
  useGlueDataCatalogEncryptionSettings,
  usePutGlueDataCatalogEncryptionSettings,
  useGlueDataQualityRulesets,
  useSearchGlueTables,
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
    result.current.mutate("1-2");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/registries/reg1/schemas/s1/versions", {
      method: "DELETE",
      body: JSON.stringify({ versions: "1-2" }),
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

// ─── ETL family generic hooks ──────────────────────────────

describe.each([
  ["crawlers"],
  ["jobs"],
  ["triggers"],
  ["workflows"],
  ["connections"],
  ["classifiers"],
  ["security-configurations"],
])("glue family %s", (family) => {
  it("useGlueFamily lists and unwraps dynamic key", async () => {
    mockApi.mockResolvedValueOnce({ [family]: [{ Name: "x" }], total: 1 });
    const { result } = renderHook(() => useGlueFamily(family), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/glue/${family}`);
    expect(result.current.data).toEqual({ items: [{ Name: "x" }], total: 1 });
  });

  it("useGlueFamily unwraps to empty items when key missing", async () => {
    mockApi.mockResolvedValueOnce({ total: 0 });
    const { result } = renderHook(() => useGlueFamily(family), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ items: [], total: 0 });
  });

  it("useCreateGlueFamily posts body", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => useCreateGlueFamily(family), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "x" });
    expect(mockApi).toHaveBeenCalledWith(`/aws/glue/${family}`, {
      method: "POST",
      body: JSON.stringify({ name: "x" }),
    });
  });

  it("useDeleteGlueFamily sends DELETE with encoded name", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteGlueFamily(family), { wrapper: createWrapper() });
    await result.current.mutateAsync("my name");
    expect(mockApi).toHaveBeenCalledWith(`/aws/glue/${family}/my%20name`, { method: "DELETE" });
  });

  it("useUpdateGlueFamily sends PUT with params", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateGlueFamily(family), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "x", update: { Role: "r" } });
    expect(mockApi).toHaveBeenCalledWith(`/aws/glue/${family}/x`, {
      method: "PUT",
      body: JSON.stringify({ name: "x", update: { Role: "r" } }),
    });
  });
});

// ─── Crawler lifecycle ─────────────────────────────────────

describe("crawler lifecycle hooks", () => {
  it("useStartGlueCrawler starts crawler", async () => {
    mockApi.mockResolvedValueOnce({ started: true });
    const { result } = renderHook(() => useStartGlueCrawler(), { wrapper: createWrapper() });
    await result.current.mutateAsync("c1");
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/crawlers/c1/start", { method: "POST" });
  });

  it("useStopGlueCrawler stops crawler", async () => {
    mockApi.mockResolvedValueOnce({ stopped: true });
    const { result } = renderHook(() => useStopGlueCrawler(), { wrapper: createWrapper() });
    await result.current.mutateAsync("c1");
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/crawlers/c1/stop", { method: "POST" });
  });

  it("useGlueCrawlerMetrics calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ metrics: [], total: 0 });
    const { result } = renderHook(() => useGlueCrawlerMetrics(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/crawler-metrics");
  });

  it("useStartGlueCrawlerSchedule posts crawler name", async () => {
    mockApi.mockResolvedValueOnce({ started: true });
    const { result } = renderHook(() => useStartGlueCrawlerSchedule(), { wrapper: createWrapper() });
    await result.current.mutateAsync("c1");
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/crawler-schedule/start", {
      method: "POST",
      body: JSON.stringify({ crawlerName: "c1" }),
    });
  });

  it("useStopGlueCrawlerSchedule posts crawler name", async () => {
    mockApi.mockResolvedValueOnce({ stopped: true });
    const { result } = renderHook(() => useStopGlueCrawlerSchedule(), { wrapper: createWrapper() });
    await result.current.mutateAsync("c1");
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/crawler-schedule/stop", {
      method: "POST",
      body: JSON.stringify({ crawlerName: "c1" }),
    });
  });

  it("useUpdateGlueCrawlerSchedule puts schedule", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateGlueCrawlerSchedule(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ crawlerName: "c1", schedule: "cron(0 1 * * ? *)" });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/crawler-schedule", {
      method: "PUT",
      body: JSON.stringify({ crawlerName: "c1", schedule: "cron(0 1 * * ? *)" }),
    });
  });
});

// ─── Job runs ──────────────────────────────────────────────

describe("job run hooks", () => {
  it("useStartGlueJobRun posts to runs", async () => {
    mockApi.mockResolvedValueOnce({ runId: "jr-1" });
    const { result } = renderHook(() => useStartGlueJobRun(), { wrapper: createWrapper() });
    await result.current.mutateAsync("j1");
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/jobs/j1/runs", { method: "POST", body: JSON.stringify({}) });
  });

  it("useGlueJobRuns disabled when job name null", async () => {
    const { result } = renderHook(() => useGlueJobRuns(null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useGlueJobRuns calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ runs: [], total: 0 });
    const { result } = renderHook(() => useGlueJobRuns("j1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/jobs/j1/runs");
  });

  it("useGlueJobRun disabled when runId null", async () => {
    const { result } = renderHook(() => useGlueJobRun("j1", null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useGlueJobRun calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ run: { Id: "jr-1" } });
    const { result } = renderHook(() => useGlueJobRun("j1", "jr-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/jobs/j1/runs/jr-1");
  });

  it("useGlueBatchGetJobs posts job names", async () => {
    mockApi.mockResolvedValueOnce({ jobs: [], jobsNotFound: [] });
    const { result } = renderHook(() => useGlueBatchGetJobs(), { wrapper: createWrapper() });
    await result.current.mutateAsync(["j1"]);
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/jobs/batch-get", {
      method: "POST",
      body: JSON.stringify({ jobNames: ["j1"] }),
    });
  });

  it("useGlueBatchStopJobRun posts batch stop", async () => {
    mockApi.mockResolvedValueOnce({ successfulSubmissions: [], errors: [] });
    const { result } = renderHook(() => useGlueBatchStopJobRun(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ jobName: "j1", jobRunIds: ["jr-1"] });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/jobs/batch-stop", {
      method: "POST",
      body: JSON.stringify({ jobName: "j1", jobRunIds: ["jr-1"] }),
    });
  });
});

// ─── Trigger lifecycle ─────────────────────────────────────

describe("trigger lifecycle hooks", () => {
  it("useStartGlueTrigger starts trigger", async () => {
    mockApi.mockResolvedValueOnce({ name: "t1", state: "ACTIVATING" });
    const { result } = renderHook(() => useStartGlueTrigger(), { wrapper: createWrapper() });
    await result.current.mutateAsync("t1");
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/triggers/t1/start", { method: "POST" });
  });

  it("useStopGlueTrigger stops trigger", async () => {
    mockApi.mockResolvedValueOnce({ name: "t1", state: "STOPPING" });
    const { result } = renderHook(() => useStopGlueTrigger(), { wrapper: createWrapper() });
    await result.current.mutateAsync("t1");
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/triggers/t1/stop", { method: "POST" });
  });
});

// ─── Workflow runs ─────────────────────────────────────────

describe("workflow run hooks", () => {
  it("useStartGlueWorkflowRun posts to runs", async () => {
    mockApi.mockResolvedValueOnce({ runId: "wr-1" });
    const { result } = renderHook(() => useStartGlueWorkflowRun(), { wrapper: createWrapper() });
    await result.current.mutateAsync("w1");
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/workflows/w1/runs", { method: "POST" });
  });

  it("useGlueWorkflowRuns disabled when name null", async () => {
    const { result } = renderHook(() => useGlueWorkflowRuns(null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useGlueWorkflowRuns calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ runs: [], total: 0 });
    const { result } = renderHook(() => useGlueWorkflowRuns("w1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/workflows/w1/runs");
  });

  it("useGlueWorkflowRun disabled when runId null", async () => {
    const { result } = renderHook(() => useGlueWorkflowRun("w1", null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useGlueWorkflowRun calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ run: { RunId: "wr-1" } });
    const { result } = renderHook(() => useGlueWorkflowRun("w1", "wr-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/workflows/w1/runs/wr-1");
  });

  it("useStopGlueWorkflowRun posts stop", async () => {
    mockApi.mockResolvedValueOnce({ stopped: true });
    const { result } = renderHook(() => useStopGlueWorkflowRun(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "w1", runId: "wr-1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/workflows/w1/runs/wr-1/stop", { method: "POST" });
  });

  it("useResumeGlueWorkflowRun posts resume", async () => {
    mockApi.mockResolvedValueOnce({ runId: "wr-2" });
    const { result } = renderHook(() => useResumeGlueWorkflowRun(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "w1", runId: "wr-1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/workflows/w1/runs/wr-1/resume", { method: "POST" });
  });

  it("useGlueWorkflowRunProperties disabled when runId null", async () => {
    const { result } = renderHook(() => useGlueWorkflowRunProperties("w1", null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useGlueWorkflowRunProperties calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ runProperties: {} });
    const { result } = renderHook(() => useGlueWorkflowRunProperties("w1", "wr-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/workflows/w1/runs/wr-1/properties");
  });

  it("usePutGlueWorkflowRunProperties puts properties", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => usePutGlueWorkflowRunProperties("w1", "wr-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ env: "prod" });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/workflows/w1/runs/wr-1/properties", {
      method: "PUT",
      body: JSON.stringify({ runProperties: { env: "prod" } }),
    });
  });

  it("useGlueBatchGetWorkflows posts names", async () => {
    mockApi.mockResolvedValueOnce({ workflows: [], missingWorkflows: [] });
    const { result } = renderHook(() => useGlueBatchGetWorkflows(), { wrapper: createWrapper() });
    await result.current.mutateAsync(["w1"]);
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/workflows/batch-get", {
      method: "POST",
      body: JSON.stringify({ names: ["w1"] }),
    });
  });
});

// ─── Connection extras ─────────────────────────────────────

describe("connection extras hooks", () => {
  it("useGlueBatchDeleteConnections posts names", async () => {
    mockApi.mockResolvedValueOnce({ succeeded: [], errors: [] });
    const { result } = renderHook(() => useGlueBatchDeleteConnections(), { wrapper: createWrapper() });
    await result.current.mutateAsync(["conn1"]);
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/connections/batch-delete", {
      method: "POST",
      body: JSON.stringify({ connectionNames: ["conn1"] }),
    });
  });

  it("useTestGlueConnection posts body", async () => {
    mockApi.mockResolvedValueOnce({ result: {} });
    const { result } = renderHook(() => useTestGlueConnection(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ ConnectionName: "conn1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/connections/test", {
      method: "POST",
      body: JSON.stringify({ ConnectionName: "conn1" }),
    });
  });
});

// ─── Policies / catalog / data quality / search ────────────

describe("glue policy hooks", () => {
  it("useGlueResourcePolicy calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ policyInJson: null });
    const { result } = renderHook(() => useGlueResourcePolicy(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/resource-policy");
  });

  it("useGlueResourcePolicies calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ policies: [], total: 0 });
    const { result } = renderHook(() => useGlueResourcePolicies(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/resource-policies");
  });

  it("usePutGlueResourcePolicy puts policy", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => usePutGlueResourcePolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync("{}");
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/resource-policy", {
      method: "PUT",
      body: JSON.stringify({ policyInJson: "{}" }),
    });
  });

  it("useDeleteGlueResourcePolicy sends DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteGlueResourcePolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync();
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/resource-policy", { method: "DELETE" });
  });
});

describe("glue catalog and data quality hooks", () => {
  it("useGlueDataCatalogEncryptionSettings calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ dataCatalogEncryptionSettings: null });
    const { result } = renderHook(() => useGlueDataCatalogEncryptionSettings(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/data-catalog-encryption-settings");
  });

  it("usePutGlueDataCatalogEncryptionSettings puts settings", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => usePutGlueDataCatalogEncryptionSettings(), { wrapper: createWrapper() });
    const settings = { DataCatalogEncryptionMode: "SSE-KMS" };
    await result.current.mutateAsync(settings);
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/data-catalog-encryption-settings", {
      method: "PUT",
      body: JSON.stringify({ dataCatalogEncryptionSettings: settings }),
    });
  });

  it("useGlueDataQualityRulesets calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ rulesets: [], total: 0 });
    const { result } = renderHook(() => useGlueDataQualityRulesets(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/data-quality-rulesets");
  });

  it("useSearchGlueTables disabled when searchText null", async () => {
    const { result } = renderHook(() => useSearchGlueTables(null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useSearchGlueTables calls correct URL with encoded text", async () => {
    mockApi.mockResolvedValueOnce({ tables: [], total: 0 });
    const { result } = renderHook(() => useSearchGlueTables("my table"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/glue/search-tables?text=my%20table");
  });
});
