import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());
const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) { return { __cmdName: name, ...args }; });
  };
});

vi.mock("@aws-sdk/client-glue", () => ({
  GlueClient: vi.fn(function () { return { send: mockSend }; }),
  GetDatabasesCommand: createCmd("GetDatabasesCommand"),
  GetDatabaseCommand: createCmd("GetDatabaseCommand"),
  CreateDatabaseCommand: createCmd("CreateDatabaseCommand"),
  DeleteDatabaseCommand: createCmd("DeleteDatabaseCommand"),
  GetTablesCommand: createCmd("GetTablesCommand"),
  GetTableCommand: createCmd("GetTableCommand"),
  CreateTableCommand: createCmd("CreateTableCommand"),
  DeleteTableCommand: createCmd("DeleteTableCommand"),
  ListRegistriesCommand: createCmd("ListRegistriesCommand"),
  CreateRegistryCommand: createCmd("CreateRegistryCommand"),
  GetRegistryCommand: createCmd("GetRegistryCommand"),
  DeleteRegistryCommand: createCmd("DeleteRegistryCommand"),
  ListSchemasCommand: createCmd("ListSchemasCommand"),
  CreateSchemaCommand: createCmd("CreateSchemaCommand"),
  GetSchemaCommand: createCmd("GetSchemaCommand"),
  DeleteSchemaCommand: createCmd("DeleteSchemaCommand"),
  ListSchemaVersionsCommand: createCmd("ListSchemaVersionsCommand"),
  RegisterSchemaVersionCommand: createCmd("RegisterSchemaVersionCommand"),
  UpdateRegistryCommand: createCmd("UpdateRegistryCommand"),
  GetSchemaVersionCommand: createCmd("GetSchemaVersionCommand"),
  GetSchemaVersionsDiffCommand: createCmd("GetSchemaVersionsDiffCommand"),
  CheckSchemaVersionValidityCommand: createCmd("CheckSchemaVersionValidityCommand"),
  PutSchemaVersionMetadataCommand: createCmd("PutSchemaVersionMetadataCommand"),
  RemoveSchemaVersionMetadataCommand: createCmd("RemoveSchemaVersionMetadataCommand"),
  QuerySchemaVersionMetadataCommand: createCmd("QuerySchemaVersionMetadataCommand"),
  GetUserDefinedFunctionsCommand: createCmd("GetUserDefinedFunctionsCommand"),
  CreateUserDefinedFunctionCommand: createCmd("CreateUserDefinedFunctionCommand"),
  GetUserDefinedFunctionCommand: createCmd("GetUserDefinedFunctionCommand"),
  DeleteUserDefinedFunctionCommand: createCmd("DeleteUserDefinedFunctionCommand"),
  UpdateUserDefinedFunctionCommand: createCmd("UpdateUserDefinedFunctionCommand"),
  GetColumnStatisticsForTableCommand: createCmd("GetColumnStatisticsForTableCommand"),
  UpdateColumnStatisticsForTableCommand: createCmd("UpdateColumnStatisticsForTableCommand"),
  DeleteColumnStatisticsForTableCommand: createCmd("DeleteColumnStatisticsForTableCommand"),
  GetColumnStatisticsForPartitionCommand: createCmd("GetColumnStatisticsForPartitionCommand"),
  UpdateColumnStatisticsForPartitionCommand: createCmd("UpdateColumnStatisticsForPartitionCommand"),
  DeleteColumnStatisticsForPartitionCommand: createCmd("DeleteColumnStatisticsForPartitionCommand"),
  GetPartitionsCommand: createCmd("GetPartitionsCommand"),
  GetPartitionCommand: createCmd("GetPartitionCommand"),
  BatchCreatePartitionCommand: createCmd("BatchCreatePartitionCommand"),
  BatchGetPartitionCommand: createCmd("BatchGetPartitionCommand"),
  UpdatePartitionCommand: createCmd("UpdatePartitionCommand"),
  DeletePartitionCommand: createCmd("DeletePartitionCommand"),
  BatchUpdatePartitionCommand: createCmd("BatchUpdatePartitionCommand"),
  GetTagsCommand: createCmd("GetTagsCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
  UpdateSchemaCommand: createCmd("UpdateSchemaCommand"),
  DeleteSchemaVersionsCommand: createCmd("DeleteSchemaVersionsCommand"),
  GetSchemaByDefinitionCommand: createCmd("GetSchemaByDefinitionCommand"),
  UpdateTableCommand: createCmd("UpdateTableCommand"),
  UpdateDatabaseCommand: createCmd("UpdateDatabaseCommand"),
  GetTableVersionsCommand: createCmd("GetTableVersionsCommand"),
  BatchDeleteTableCommand: createCmd("BatchDeleteTableCommand"),
  CreateCrawlerCommand: createCmd("CreateCrawlerCommand"),
  GetCrawlerCommand: createCmd("GetCrawlerCommand"),
  GetCrawlersCommand: createCmd("GetCrawlersCommand"),
  UpdateCrawlerCommand: createCmd("UpdateCrawlerCommand"),
  DeleteCrawlerCommand: createCmd("DeleteCrawlerCommand"),
  BatchGetCrawlersCommand: createCmd("BatchGetCrawlersCommand"),
  StartCrawlerCommand: createCmd("StartCrawlerCommand"),
  StopCrawlerCommand: createCmd("StopCrawlerCommand"),
  GetCrawlerMetricsCommand: createCmd("GetCrawlerMetricsCommand"),
  StartCrawlerScheduleCommand: createCmd("StartCrawlerScheduleCommand"),
  StopCrawlerScheduleCommand: createCmd("StopCrawlerScheduleCommand"),
  UpdateCrawlerScheduleCommand: createCmd("UpdateCrawlerScheduleCommand"),
  CreateJobCommand: createCmd("CreateJobCommand"),
  GetJobCommand: createCmd("GetJobCommand"),
  GetJobsCommand: createCmd("GetJobsCommand"),
  UpdateJobCommand: createCmd("UpdateJobCommand"),
  DeleteJobCommand: createCmd("DeleteJobCommand"),
  BatchGetJobsCommand: createCmd("BatchGetJobsCommand"),
  StartJobRunCommand: createCmd("StartJobRunCommand"),
  GetJobRunCommand: createCmd("GetJobRunCommand"),
  GetJobRunsCommand: createCmd("GetJobRunsCommand"),
  BatchStopJobRunCommand: createCmd("BatchStopJobRunCommand"),
  CreateTriggerCommand: createCmd("CreateTriggerCommand"),
  GetTriggerCommand: createCmd("GetTriggerCommand"),
  GetTriggersCommand: createCmd("GetTriggersCommand"),
  UpdateTriggerCommand: createCmd("UpdateTriggerCommand"),
  DeleteTriggerCommand: createCmd("DeleteTriggerCommand"),
  StartTriggerCommand: createCmd("StartTriggerCommand"),
  StopTriggerCommand: createCmd("StopTriggerCommand"),
  CreateWorkflowCommand: createCmd("CreateWorkflowCommand"),
  GetWorkflowCommand: createCmd("GetWorkflowCommand"),
  ListWorkflowsCommand: createCmd("ListWorkflowsCommand"),
  BatchGetWorkflowsCommand: createCmd("BatchGetWorkflowsCommand"),
  UpdateWorkflowCommand: createCmd("UpdateWorkflowCommand"),
  DeleteWorkflowCommand: createCmd("DeleteWorkflowCommand"),
  StartWorkflowRunCommand: createCmd("StartWorkflowRunCommand"),
  StopWorkflowRunCommand: createCmd("StopWorkflowRunCommand"),
  ResumeWorkflowRunCommand: createCmd("ResumeWorkflowRunCommand"),
  GetWorkflowRunCommand: createCmd("GetWorkflowRunCommand"),
  GetWorkflowRunsCommand: createCmd("GetWorkflowRunsCommand"),
  GetWorkflowRunPropertiesCommand: createCmd("GetWorkflowRunPropertiesCommand"),
  PutWorkflowRunPropertiesCommand: createCmd("PutWorkflowRunPropertiesCommand"),
  CreateConnectionCommand: createCmd("CreateConnectionCommand"),
  GetConnectionCommand: createCmd("GetConnectionCommand"),
  GetConnectionsCommand: createCmd("GetConnectionsCommand"),
  UpdateConnectionCommand: createCmd("UpdateConnectionCommand"),
  DeleteConnectionCommand: createCmd("DeleteConnectionCommand"),
  BatchDeleteConnectionCommand: createCmd("BatchDeleteConnectionCommand"),
  TestConnectionCommand: createCmd("TestConnectionCommand"),
  CreateClassifierCommand: createCmd("CreateClassifierCommand"),
  GetClassifierCommand: createCmd("GetClassifierCommand"),
  GetClassifiersCommand: createCmd("GetClassifiersCommand"),
  UpdateClassifierCommand: createCmd("UpdateClassifierCommand"),
  DeleteClassifierCommand: createCmd("DeleteClassifierCommand"),
  CreateSecurityConfigurationCommand: createCmd("CreateSecurityConfigurationCommand"),
  GetSecurityConfigurationCommand: createCmd("GetSecurityConfigurationCommand"),
  GetSecurityConfigurationsCommand: createCmd("GetSecurityConfigurationsCommand"),
  DeleteSecurityConfigurationCommand: createCmd("DeleteSecurityConfigurationCommand"),
  PutResourcePolicyCommand: createCmd("PutResourcePolicyCommand"),
  GetResourcePolicyCommand: createCmd("GetResourcePolicyCommand"),
  GetResourcePoliciesCommand: createCmd("GetResourcePoliciesCommand"),
  DeleteResourcePolicyCommand: createCmd("DeleteResourcePolicyCommand"),
  GetDataCatalogEncryptionSettingsCommand: createCmd("GetDataCatalogEncryptionSettingsCommand"),
  PutDataCatalogEncryptionSettingsCommand: createCmd("PutDataCatalogEncryptionSettingsCommand"),
  ListDataQualityRulesetsCommand: createCmd("ListDataQualityRulesetsCommand"),
  SearchTablesCommand: createCmd("SearchTablesCommand"),
}));

vi.mock("../../clients/aws", () => ({ create: (Ctor: any, extra?: any) => new Ctor(extra) }));

import router from "./glue";

async function get(p: string) { return router.request(p, { method: "GET" }); }
async function post(p: string, b?: any) {
  return router.request(p, { method: "POST", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}
async function del(p: string) { return router.request(p, { method: "DELETE" }); }
async function put(p: string, b?: any) {
  return router.request(p, { method: "PUT", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}

beforeEach(() => mockSend.mockReset());

describe("Glue Routes", () => {
  it("GET /databases — lists databases", async () => {
    mockSend.mockResolvedValueOnce({ DatabaseList: [{ Name: "default", Description: "Default" }] });
    const res = await get("/databases");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /databases — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/databases");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("GET /databases/:name — gets database", async () => {
    mockSend.mockResolvedValueOnce({ Database: { Name: "default" } });
    const res = await get("/databases/default");
    expect(res.status).toBe(200);
  });

  it("POST /databases — creates database (201)", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/databases", { name: "mydb" });
    expect(res.status).toBe(201);
  });

  it("POST /databases — 400 if name missing", async () => {
    const res = await post("/databases", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /databases/:name — deletes database", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/databases/mydb");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it("GET /databases/:dbName/tables — lists tables", async () => {
    mockSend.mockResolvedValueOnce({ TableList: [{ Name: "table-1", TableType: "EXTERNAL_TABLE" }] });
    const res = await get("/databases/mydb/tables");
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /databases/:dbName/tables — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/databases/mydb/tables");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("GET /databases/:dbName/tables/:tableName — gets table", async () => {
    mockSend.mockResolvedValueOnce({ Table: { Name: "table-1" } });
    const res = await get("/databases/mydb/tables/table-1");
    expect(res.status).toBe(200);
  });

  it("POST /databases/:dbName/tables — creates table (201)", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/databases/mydb/tables", { name: "table-1" });
    expect(res.status).toBe(201);
  });

  it("POST /databases/:dbName/tables — 400 if name missing", async () => {
    const res = await post("/databases/mydb/tables", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /databases/:dbName/tables/:tableName — deletes table", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/databases/mydb/tables/table-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  // Schema Registry
  it("GET /registries — lists registries", async () => {
    mockSend.mockResolvedValueOnce({
      Registries: [{ RegistryName: "reg-1", RegistryArn: "arn:...", Status: "AVAILABLE", Description: "Test" }],
    });
    const res = await get("/registries");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.registries[0].name).toBe("reg-1");
  });

  it("GET /registries — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/registries");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("POST /registries — creates registry (201)", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/registries", { name: "reg-1" });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.created).toBe(true);
  });

  it("POST /registries — 400 if name missing", async () => {
    const res = await post("/registries", {});
    expect(res.status).toBe(400);
  });

  it("GET /registries/:name — gets a registry", async () => {
    mockSend.mockResolvedValueOnce({ RegistryName: "reg-1", Status: "AVAILABLE" });
    const res = await get("/registries/reg-1");
    expect(res.status).toBe(200);
  });

  it("DELETE /registries/:name — deletes registry", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/registries/reg-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  // Schemas
  it("GET /registries/:regName/schemas — lists schemas", async () => {
    mockSend.mockResolvedValueOnce({
      Schemas: [{ SchemaName: "s-1", SchemaStatus: "AVAILABLE", DataFormat: "AVRO", Compatibility: "NONE" }],
    });
    const res = await get("/registries/reg-1/schemas");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.schemas[0].name).toBe("s-1");
  });

  it("GET /registries/:regName/schemas — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/registries/reg-1/schemas");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("POST /registries/:regName/schemas — creates schema (201)", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/registries/reg-1/schemas", { name: "s-1" });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.created).toBe(true);
  });

  it("POST /registries/:regName/schemas — 400 if name missing", async () => {
    const res = await post("/registries/reg-1/schemas", {});
    expect(res.status).toBe(400);
  });

  it("GET /registries/:regName/schemas/:schemaName — gets a schema", async () => {
    mockSend.mockResolvedValueOnce({ SchemaName: "s-1" });
    const res = await get("/registries/reg-1/schemas/s-1");
    expect(res.status).toBe(200);
  });

  it("DELETE /registries/:regName/schemas/:schemaName — deletes schema", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/registries/reg-1/schemas/s-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  // Schema Versions
  it("GET /registries/:regName/schemas/:schemaName/versions — lists versions", async () => {
    mockSend.mockResolvedValueOnce({
      Schemas: [{ SchemaVersionId: "v1", VersionNumber: 1, Status: "AVAILABLE", CreatedTime: "2025-01-01" }],
    });
    const res = await get("/registries/reg-1/schemas/s-1/versions");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.versions[0].versionNumber).toBe(1);
  });

  it("GET /registries/:regName/schemas/:schemaName/versions — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/registries/reg-1/schemas/s-1/versions");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("POST /registries/:regName/schemas/:schemaName/versions — registers version (201)", async () => {
    mockSend.mockResolvedValueOnce({ SchemaVersionId: "v1" });
    const res = await post("/registries/reg-1/schemas/s-1/versions", { definition: '{"type":"record"}' });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.registered).toBe(true);
  });

  it("POST /registries/:regName/schemas/:schemaName/versions — 400 if definition missing", async () => {
    const res = await post("/registries/reg-1/schemas/s-1/versions", {});
    expect(res.status).toBe(400);
  });

  // UpdateRegistry
  it("PUT /registries/:name — updates registry description", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/registries/reg-1", { description: "new desc" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UpdateRegistryCommand",
        RegistryId: { RegistryName: "reg-1" },
        Description: "new desc",
      })
    );
  });

  it("PUT /registries/:name — 400 if description missing", async () => {
    const res = await put("/registries/reg-1", {});
    expect(res.status).toBe(400);
  });

  // GetSchemaVersion
  it("GET versions/:versionNumber — gets a specific schema version", async () => {
    mockSend.mockResolvedValueOnce({
      SchemaVersionId: "v-id-1",
      VersionNumber: 2,
      Status: "AVAILABLE",
      SchemaDefinition: '{"type":"record"}',
      DataFormat: "AVRO",
    });
    const res = await get("/registries/reg-1/schemas/s-1/versions/2");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.version.versionNumber).toBe(2);
    expect(body.version.definition).toBe('{"type":"record"}');
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "GetSchemaVersionCommand",
        SchemaId: { RegistryName: "reg-1", SchemaName: "s-1" },
        SchemaVersionNumber: { VersionNumber: 2 },
      })
    );
  });

  // GetSchemaVersionsDiff
  it("GET versions-diff — returns diff", async () => {
    mockSend.mockResolvedValueOnce({ Diff: "some-diff" });
    const res = await get("/registries/reg-1/schemas/s-1/versions-diff?first=1&second=2");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.diff).toBe("some-diff");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "GetSchemaVersionsDiffCommand",
        SchemaId: { RegistryName: "reg-1", SchemaName: "s-1" },
        FirstSchemaVersionNumber: { VersionNumber: 1 },
        SecondSchemaVersionNumber: { VersionNumber: 2 },
        SchemaDiffType: "SYNTAX_DIFF",
      })
    );
  });

  it("GET versions-diff — 400 without first/second", async () => {
    const res = await get("/registries/reg-1/schemas/s-1/versions-diff?first=1");
    expect(res.status).toBe(400);
  });

  // CheckSchemaVersionValidity
  it("POST /schema-version-validity — returns validity", async () => {
    mockSend.mockResolvedValueOnce({ Valid: true, Error: undefined });
    const res = await post("/schema-version-validity", { dataFormat: "AVRO", definition: '{"type":"record"}' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CheckSchemaVersionValidityCommand",
        DataFormat: "AVRO",
        SchemaDefinition: '{"type":"record"}',
      })
    );
  });

  it("POST /schema-version-validity — 400 without definition", async () => {
    const res = await post("/schema-version-validity", {});
    expect(res.status).toBe(400);
  });

  it("POST /schema-version-validity — defaults dataFormat to AVRO", async () => {
    mockSend.mockResolvedValueOnce({ Valid: true, Error: undefined });
    const res = await post("/schema-version-validity", { definition: '{"type":"record"}' });
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].DataFormat).toBe("AVRO");
  });

  // QuerySchemaVersionMetadata
  it("GET /schema-versions/:versionId/metadata — returns metadata map", async () => {
    mockSend.mockResolvedValueOnce({ MetadataInfoMap: { owner: { MetadataValue: "team" } }, SchemaVersionId: "v-id-1" });
    const res = await get("/schema-versions/v-id-1/metadata");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.metadataInfoMap.owner.MetadataValue).toBe("team");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ __cmdName: "QuerySchemaVersionMetadataCommand", SchemaVersionId: "v-id-1" })
    );
  });

  it("GET /schema-versions/:versionId/metadata — empty map", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/schema-versions/v-id-1/metadata");
    const body = await res.json();
    expect(body.metadataInfoMap).toEqual({});
  });

  // PutSchemaVersionMetadata
  it("POST /schema-versions/:versionId/metadata — adds metadata", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/schema-versions/v-id-1/metadata", { key: "owner", value: "team" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.added).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "PutSchemaVersionMetadataCommand",
        SchemaVersionId: "v-id-1",
        MetadataKeyValue: { MetadataKey: "owner", MetadataValue: "team" },
      })
    );
  });

  it("POST /schema-versions/:versionId/metadata — 400 without key/value", async () => {
    const res = await post("/schema-versions/v-id-1/metadata", { key: "owner" });
    expect(res.status).toBe(400);
  });

  // RemoveSchemaVersionMetadata
  it("POST /schema-versions/:versionId/metadata/delete — removes metadata", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/schema-versions/v-id-1/metadata/delete", { key: "owner", value: "team" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.removed).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "RemoveSchemaVersionMetadataCommand",
        SchemaVersionId: "v-id-1",
        MetadataKeyValue: { MetadataKey: "owner", MetadataValue: "team" },
      })
    );
  });

  it("POST /schema-versions/:versionId/metadata/delete — 400 without key/value", async () => {
    const res = await post("/schema-versions/v-id-1/metadata/delete", { value: "team" });
    expect(res.status).toBe(400);
  });

  // UDFs
  it("GET /databases/:dbName/functions — lists UDFs", async () => {
    mockSend.mockResolvedValueOnce({
      UserDefinedFunctions: [{ FunctionName: "my_udf", ClassName: "com.example.MyUDF", OwnerName: "admin", OwnerType: "USER" }],
    });
    const res = await get("/databases/mydb/functions");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.functions[0].name).toBe("my_udf");
  });

  it("GET /databases/:dbName/functions — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/databases/mydb/functions");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("POST /databases/:dbName/functions — creates UDF (201)", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/databases/mydb/functions", { name: "my_udf", className: "com.example.MyUDF" });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.created).toBe(true);
  });

  it("POST /databases/:dbName/functions — 400 if name missing", async () => {
    const res = await post("/databases/mydb/functions", { className: "c" });
    expect(res.status).toBe(400);
  });

  it("GET /databases/:dbName/functions/:funcName — gets UDF", async () => {
    mockSend.mockResolvedValueOnce({ UserDefinedFunction: { FunctionName: "my_udf", ClassName: "c" } });
    const res = await get("/databases/mydb/functions/my_udf");
    expect(res.status).toBe(200);
  });

  it("GET /databases/:dbName/functions/:funcName — 404 when function not found", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/databases/mydb/functions/missing");
    expect(res.status).toBe(404);
  });

  it("DELETE /databases/:dbName/functions/:funcName — deletes UDF", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/databases/mydb/functions/my_udf");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it("PUT /databases/:dbName/functions/:funcName — updates UDF", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request("/databases/mydb/functions/my_udf", {
      method: "PUT",
      body: JSON.stringify({ className: "com.example.New" }),
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
  });

  // Column Stats (Table)
  it("GET /databases/:dbName/tables/:tableName/column-stats — lists stats", async () => {
    mockSend.mockResolvedValueOnce({
      ColumnStatisticsList: [{ ColumnName: "col1", ColumnType: "string", AnalyzedTime: new Date() }],
    });
    const res = await get("/databases/mydb/tables/tbl1/column-stats");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.columnStats[0].columnName).toBe("col1");
  });

  it("GET /databases/:dbName/tables/:tableName/column-stats — sparse response defaults to empty array", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/databases/mydb/tables/tbl1/column-stats");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.columnStats).toEqual([]);
  });

  it("GET /databases/:dbName/tables/:tableName/column-stats — error returns empty", async () => {
    mockSend.mockRejectedValueOnce(new Error("not found"));
    const res = await get("/databases/mydb/tables/tbl1/column-stats");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("POST /databases/:dbName/tables/:tableName/column-stats — updates stats", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/databases/mydb/tables/tbl1/column-stats", { columnStatisticsList: [{ ColumnName: "col1" }] });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
  });

  it("POST /databases/:dbName/tables/:tableName/column-stats — 400 if list missing", async () => {
    const res = await post("/databases/mydb/tables/tbl1/column-stats", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /databases/:dbName/tables/:tableName/column-stats — deletes column stat", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request("/databases/mydb/tables/tbl1/column-stats?column=col1", { method: "DELETE" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it("DELETE /databases/:dbName/tables/:tableName/column-stats — 400 if column missing", async () => {
    const res = await router.request("/databases/mydb/tables/tbl1/column-stats", { method: "DELETE" });
    expect(res.status).toBe(400);
  });

  // Column Stats (Partition)
  it("GET with values — lists partition stats", async () => {
    mockSend.mockResolvedValueOnce({
      ColumnStatisticsList: [{ ColumnName: "col1", ColumnType: "string" }],
    });
    const res = await get("/databases/mydb/tables/tbl1/partitions/column-stats?values=2024");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET with values — sparse response defaults to empty array", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/databases/mydb/tables/tbl1/partitions/column-stats?values=2024");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.columnStats).toEqual([]);
  });

  it("GET with values — error returns empty", async () => {
    mockSend.mockRejectedValueOnce(new Error("not found"));
    const res = await get("/databases/mydb/tables/tbl1/partitions/column-stats?values=2024");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("GET with values — 400 if values missing", async () => {
    const res = await get("/databases/mydb/tables/tbl1/partitions/column-stats");
    expect(res.status).toBe(400);
  });

  it("POST partitions/column-stats — updates partition stats", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/databases/mydb/tables/tbl1/partitions/column-stats", {
      partitionValues: ["2024"],
      columnStatisticsList: [{ ColumnName: "col1" }],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
  });

  it("POST partitions/column-stats — 400 without partitionValues", async () => {
    const res = await post("/databases/mydb/tables/tbl1/partitions/column-stats", {
      columnStatisticsList: [{ ColumnName: "col1" }],
    });
    expect(res.status).toBe(400);
  });

  it("POST partitions/column-stats — 400 without columnStatisticsList", async () => {
    const res = await post("/databases/mydb/tables/tbl1/partitions/column-stats", {
      partitionValues: ["2024"],
    });
    expect(res.status).toBe(400);
  });

  it("DELETE partitions/column-stats — deletes partition stat", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request("/databases/mydb/tables/tbl1/partitions/column-stats?column=col1&values=2024", { method: "DELETE" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it("DELETE partitions/column-stats — 400 without column", async () => {
    const res = await router.request("/databases/mydb/tables/tbl1/partitions/column-stats?values=2024", { method: "DELETE" });
    expect(res.status).toBe(400);
  });

  it("DELETE partitions/column-stats — 400 without values", async () => {
    const res = await router.request("/databases/mydb/tables/tbl1/partitions/column-stats?column=col1", { method: "DELETE" });
    expect(res.status).toBe(400);
  });

  // Partitions
  it("GET /databases/:dbName/tables/:tableName/partitions — lists partitions", async () => {
    mockSend.mockResolvedValueOnce({
      Partitions: [
        { Values: ["2024", "01"], DatabaseName: "mydb", TableName: "tbl1", StorageDescriptor: { Location: "s3://b/p/" }, CreationTime: new Date() },
      ],
    });
    const res = await get("/databases/mydb/tables/tbl1/partitions");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.partitions[0].values).toEqual(["2024", "01"]);
    expect(body.partitions[0].location).toBe("s3://b/p/");
  });

  it("GET /databases/:dbName/tables/:tableName/partitions — passes expression", async () => {
    mockSend.mockResolvedValueOnce({ Partitions: [] });
    const res = await get("/databases/mydb/tables/tbl1/partitions?expression=year%3D2024");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ Expression: "year=2024" }));
  });

  it("GET /databases/:dbName/tables/:tableName/partitions — sparse response and partition without Values", async () => {
    mockSend.mockResolvedValueOnce({ Partitions: [{ DatabaseName: "mydb", TableName: "tbl1" }] });
    const res = await get("/databases/mydb/tables/tbl1/partitions");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.partitions[0].values).toEqual([]);
    expect(body.partitions[0].location).toBeNull();
    expect(body.partitions[0].parameters).toEqual({});
  });

  it("GET /databases/:dbName/tables/:tableName/partitions — sparse response defaults to empty array", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/databases/mydb/tables/tbl1/partitions");
    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.partitions).toEqual([]);
  });

  it("GET partitions/get — returns a single partition", async () => {
    mockSend.mockResolvedValueOnce({ Partition: { Values: ["2024"], DatabaseName: "mydb", TableName: "tbl1" } });
    const res = await get("/databases/mydb/tables/tbl1/partitions/get?values=2024");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.partition.values).toEqual(["2024"]);
  });

  it("GET partitions/get — 400 without values", async () => {
    const res = await get("/databases/mydb/tables/tbl1/partitions/get");
    expect(res.status).toBe(400);
  });

  it("GET partitions/get — 404 when not found", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/databases/mydb/tables/tbl1/partitions/get?values=2024");
    expect(res.status).toBe(404);
  });

  it("POST partitions — batch creates partitions", async () => {
    mockSend.mockResolvedValueOnce({ Errors: [] });
    const res = await post("/databases/mydb/tables/tbl1/partitions", {
      partitionInputList: [{ Values: ["2024", "01"] }],
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.created).toBe(true);
    expect(body.errors).toEqual([]);
  });

  it("POST partitions — 400 without partitionInputList", async () => {
    const res = await post("/databases/mydb/tables/tbl1/partitions", {});
    expect(res.status).toBe(400);
  });

  it("POST partitions — sparse response defaults errors to empty array", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/databases/mydb/tables/tbl1/partitions", {
      partitionInputList: [{ Values: ["2024"] }],
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.created).toBe(true);
    expect(body.errors).toEqual([]);
  });

  it("POST partitions/batch-get — returns partitions", async () => {
    mockSend.mockResolvedValueOnce({ Partitions: [{ Values: ["2024"] }], UnprocessedKeys: [] });
    const res = await post("/databases/mydb/tables/tbl1/partitions/batch-get", {
      partitionsToGet: [{ Values: ["2024"] }],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("POST partitions/batch-get — 400 without partitionsToGet", async () => {
    const res = await post("/databases/mydb/tables/tbl1/partitions/batch-get", {});
    expect(res.status).toBe(400);
  });

  it("POST partitions/batch-get — sparse response defaults to empty arrays", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/databases/mydb/tables/tbl1/partitions/batch-get", {
      partitionsToGet: [{ Values: ["2024"] }],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.partitions).toEqual([]);
    expect(body.unprocessedKeys).toEqual([]);
  });

  it("POST partitions/batch-update — batch updates partitions", async () => {
    mockSend.mockResolvedValueOnce({ Errors: [] });
    const res = await post("/databases/mydb/tables/tbl1/partitions/batch-update", {
      entries: [{ PartitionValueList: ["2024"], PartitionInput: { Values: ["2024"] } }],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
    expect(body.errors).toEqual([]);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "BatchUpdatePartitionCommand",
        DatabaseName: "mydb",
        TableName: "tbl1",
        Entries: [{ PartitionValueList: ["2024"], PartitionInput: { Values: ["2024"] } }],
      })
    );
  });

  it("POST partitions/batch-update — 400 without entries", async () => {
    const res = await post("/databases/mydb/tables/tbl1/partitions/batch-update", {});
    expect(res.status).toBe(400);
  });

  it("POST partitions/batch-update — sparse response defaults errors to empty array", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/databases/mydb/tables/tbl1/partitions/batch-update", {
      entries: [{ PartitionValueList: ["2024"], PartitionInput: { Values: ["2024"] } }],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
    expect(body.errors).toEqual([]);
  });

  it("PUT partitions — updates a partition", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request("/databases/mydb/tables/tbl1/partitions", {
      method: "PUT",
      body: JSON.stringify({ partitionValueList: ["2024"], partitionInput: { Values: ["2024"] } }),
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
  });

  it("PUT partitions — 400 without partitionValueList", async () => {
    const res = await router.request("/databases/mydb/tables/tbl1/partitions", {
      method: "PUT",
      body: JSON.stringify({ partitionInput: {} }),
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(400);
  });

  it("PUT partitions — 400 without partitionInput", async () => {
    const res = await router.request("/databases/mydb/tables/tbl1/partitions", {
      method: "PUT",
      body: JSON.stringify({ partitionValueList: ["2024"] }),
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(400);
  });

  it("DELETE partitions — deletes a partition", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request("/databases/mydb/tables/tbl1/partitions?values=2024&values=01", { method: "DELETE" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ PartitionValues: ["2024", "01"] }));
  });

  it("DELETE partitions — 400 without values", async () => {
    const res = await router.request("/databases/mydb/tables/tbl1/partitions", { method: "DELETE" });
    expect(res.status).toBe(400);
  });

  describe("Table/Database updates + versions", () => {
    it("PUT /databases/:db/tables/:table — sends UpdateTableCommand", async () => {
      mockSend.mockResolvedValue({});
      const res = await put("/databases/db1/tables/t1", { tableInput: { description: "new" } });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("UpdateTableCommand");
      expect(cmd.DatabaseName).toBe("db1");
      expect(cmd.TableInput.Name).toBe("t1");
      expect(cmd.TableInput.description).toBe("new");
    });

    it("PUT /databases/:db/tables/:table — 400 without tableInput", async () => {
      const res = await put("/databases/db1/tables/t1", {});
      expect(res.status).toBe(400);
    });

    it("PUT /databases/:db — sends UpdateDatabaseCommand", async () => {
      mockSend.mockResolvedValue({});
      const res = await put("/databases/db1", { databaseInput: { description: "new" } });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("UpdateDatabaseCommand");
      expect(cmd.Name).toBe("db1");
      expect(cmd.DatabaseInput.Name).toBe("db1");
    });

    it("PUT /databases/:db — 400 without databaseInput", async () => {
      const res = await put("/databases/db1", {});
      expect(res.status).toBe(400);
    });

    it("GET /databases/:db/tables/:table/versions — maps versions", async () => {
      mockSend.mockResolvedValueOnce({
        TableVersions: [{ VersionId: "2", CreatedTime: "2026", Table: { Name: "t1", Description: "d" } }],
      });
      const res = await get("/databases/db1/tables/t1/versions");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.versions[0].table.name).toBe("t1");
    });

    it("GET /databases/:db/tables/:table/versions — sparse fallback", async () => {
      mockSend.mockResolvedValueOnce({ TableVersions: [{}] });
      const res = await get("/databases/db1/tables/t1/versions");
      const body = await res.json();
      expect(body.versions[0].table).toBeNull();
    });

    it("GET /databases/:db/tables/:table/versions — empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/databases/db1/tables/t1/versions");
      expect((await res.json()).versions).toEqual([]);
    });

    it("POST /databases/:db/tables/batch-delete — deletes tables", async () => {
      mockSend.mockResolvedValueOnce({ TablesDeleted: ["t1", "t2"], Errors: [] });
      const res = await post("/databases/db1/tables/batch-delete", { tableNames: ["t1", "t2"] });
      const body = await res.json();
      expect(body.deleted).toBe(2);
      expect(mockSend.mock.calls[0][0].TablesToDelete).toEqual(["t1", "t2"]);
    });

    it("POST /databases/:db/tables/batch-delete — sparse response", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/databases/db1/tables/batch-delete", { tableNames: ["t1"] });
      const body = await res.json();
      expect(body.deleted).toBe(0);
      expect(body.errors).toEqual([]);
    });

    it("POST /databases/:db/tables/batch-delete — 400 without tableNames", async () => {
      const res = await post("/databases/db1/tables/batch-delete", {});
      expect(res.status).toBe(400);
    });
  });

  // Tags
  describe("Tags", () => {
    it("GET /tags — returns tags for a resource ARN", async () => {
      mockSend.mockResolvedValueOnce({ Tags: { env: "prod", team: "data" } });
      const res = await get("/tags?resourceArn=arn:aws:glue:us-east-1:123:table/db/tbl");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags.env).toBe("prod");
    });

    it("GET /tags — 400 without resourceArn", async () => {
      const res = await get("/tags");
      expect(res.status).toBe(400);
    });

    it("POST /tags — tags a resource", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tags", { resourceArn: "arn:aws:glue:us-east-1:123:table/db/tbl", tags: { env: "prod" } });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tagged).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        __cmdName: "TagResourceCommand",
        ResourceArn: "arn:aws:glue:us-east-1:123:table/db/tbl",
        TagsToAdd: { env: "prod" },
      }));
    });

    it("POST /tags — 400 without resourceArn", async () => {
      const res = await post("/tags", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /tags/:resourceArn — untags a resource", async () => {
      mockSend.mockResolvedValueOnce({});
      const arn = encodeURIComponent("arn:aws:glue:us-east-1:123:table/db/tbl");
      const res = await del(`/tags/${arn}?tagKey=env&tagKey=team`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.untagged).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        __cmdName: "UntagResourceCommand",
        TagsToRemove: ["env", "team"],
      }));
    });

    it("DELETE /tags/:resourceArn — 400 without tagKey", async () => {
      const arn = encodeURIComponent("arn:aws:glue:us-east-1:123:table/db/tbl");
      const res = await del(`/tags/${arn}`);
      expect(res.status).toBe(400);
    });
  });

  // Schema Registry extra operations
  describe("Schema Registry extras", () => {
    it("PUT /registries/:reg/schemas/:schema — updates schema", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/registries/reg-1/schemas/s-1", { compatibility: "BACKWARD" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        __cmdName: "UpdateSchemaCommand",
        SchemaId: { RegistryName: "reg-1", SchemaName: "s-1" },
        Compatibility: "BACKWARD",
      }));
    });

    it("PUT /registries/:reg/schemas/:schema — 400 without compatibility or description", async () => {
      const res = await put("/registries/reg-1/schemas/s-1", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /registries/:reg/schemas/:schema/versions — deletes schema versions", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await router.request("/registries/reg-1/schemas/s-1/versions", {
        method: "DELETE",
        body: JSON.stringify({ versions: "1-2" }),
        headers: { "content-type": "application/json" },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        __cmdName: "DeleteSchemaVersionsCommand",
        SchemaId: { RegistryName: "reg-1", SchemaName: "s-1" },
        Versions: "1-2",
      }));
    });

    it("DELETE /registries/:reg/schemas/:schema/versions — 400 without versions array", async () => {
      const res = await router.request("/registries/reg-1/schemas/s-1/versions", {
        method: "DELETE",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      });
      expect(res.status).toBe(400);
    });

    it("POST /schemas/by-definition — looks up schema by definition", async () => {
      mockSend.mockResolvedValueOnce({
        SchemaVersionId: "v-1",
        SchemaArn: "arn:aws:glue:schema/reg-1/s-1",
        DataFormat: "AVRO",
        Status: "AVAILABLE",
        CreatedTime: "2025-01-01",
      });
      const res = await post("/schemas/by-definition", { registryName: "reg-1", schemaName: "s-1", definition: '{"type":"record"}' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.schemaVersionId).toBe("v-1");
      expect(body.schemaArn).toBe("arn:aws:glue:schema/reg-1/s-1");
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        __cmdName: "GetSchemaByDefinitionCommand",
        SchemaDefinition: '{"type":"record"}',
        SchemaId: { RegistryName: "reg-1", SchemaName: "s-1" },
      }));
    });

    it("POST /schemas/by-definition — 400 without definition", async () => {
      const res = await post("/schemas/by-definition", {});
      expect(res.status).toBe(400);
    });
  });
});

// ── ETL families ────────────────────────────────────────────

describe.each([
  ["crawlers", "Crawlers", "crawler", { name: "c1", role: "arn:role" }],
  ["jobs", "Jobs", "job", { name: "j1", role: "arn:role", command: { Name: "glueetl" } }],
  ["triggers", "Triggers", "trigger", { name: "t1", type: "ON_DEMAND" }],
  ["workflows", "Names", "workflow", { name: "w1" }],
  ["connections", "ConnectionList", "connection", { connectionInput: { Name: "conn1", ConnectionType: "JDBC" } }],
  ["classifiers", "Classifiers", "classifier", { classifier: { Name: "cls1", Classification: "csv" } }],
  ["security-configurations", "SecurityConfigurations", "securityconfiguration", { name: "sec1", encryptionConfiguration: { CloudWatchEncryption: {} } }],
])("Glue family %s", (route, listField, singular, createBody) => {
  it(`GET /${route} — lists items`, async () => {
    const items = listField === "Names" ? ["w1", "w2"] : [{ Name: "x" }];
    mockSend.mockResolvedValueOnce({ [listField]: items });
    const res = await get(`/${route}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body[route]).toEqual(items);
    expect(body.total).toBe(items.length);
  });

  it(`GET /${route} — empty list`, async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/${route}`);
    const body = await res.json();
    expect(body[route]).toEqual([]);
    expect(body.total).toBe(0);
  });

  it(`POST /${route} — creates`, async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post(`/${route}`, createBody);
    expect(res.status).toBe(201);
    expect((await res.json()).created).toBe(true);
  });

  it(`POST /${route} — 400 without name`, async () => {
    const res = await post(`/${route}`, {});
    expect(res.status).toBe(400);
  });

  it(`GET /${route}/:name — returns item`, async () => {
    mockSend.mockResolvedValueOnce({ Crawler: { Name: "x" }, Job: { Name: "x" }, Trigger: { Name: "x" }, Workflow: { Name: "x" }, Connection: { Name: "x" }, Classifier: { Name: "x" }, SecurityConfiguration: { Name: "x" } });
    const res = await get(`/${route}/x`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body[singular].Name).toBe("x");
    expect(mockSend.mock.calls[0][0].Name ?? mockSend.mock.calls[0][0].JobName).toBe("x");
  });

  it(`GET /${route}/:name — null when sparse`, async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/${route}/x`);
    expect((await res.json())[singular]).toBe(null);
  });

  it(`DELETE /${route}/:name — deletes`, async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del(`/${route}/x`);
    expect(res.status).toBe(200);
    expect((await res.json()).deleted).toBe(true);
  });
});

describe("Glue family updates", () => {
  it("PUT /crawlers/:name — updates crawler", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/crawlers/c1", { update: { Role: "arn:r2" } });
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].Name).toBe("c1");
    expect(mockSend.mock.calls[0][0].Role).toBe("arn:r2");
  });

  it("PUT /jobs/:name — updates job", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/jobs/j1", { jobUpdate: { Description: "d" } });
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].JobName).toBe("j1");
    expect(mockSend.mock.calls[0][0].JobUpdate.Description).toBe("d");
  });

  it("PUT /jobs/:name — defaults empty JobUpdate", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/jobs/j1", {});
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].JobUpdate).toEqual({});
  });

  it("PUT /triggers/:name — updates trigger", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/triggers/t1", { triggerUpdate: { Name: "t2" } });
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].TriggerUpdate.Name).toBe("t2");
  });

  it("PUT /workflows/:name — updates workflow", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/workflows/w1", { update: { Description: "dw" } });
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].Description).toBe("dw");
  });

  it("PUT /connections/:name — updates connection", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/connections/conn1", { connectionInput: { Name: "conn1", ConnectionType: "S3" } });
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].ConnectionInput.ConnectionType).toBe("S3");
  });

  it("PUT /connections/:name — defaults empty ConnectionInput", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/connections/conn1", {});
    expect(mockSend.mock.calls[0][0].ConnectionInput).toEqual({});
  });

  it("PUT /classifiers/:name — updates classifier with Name from body", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/classifiers/cls1", { update: { Name: "cls2", Classification: "json" } });
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].Name).toBe("cls2");
  });

  it("PUT /classifiers/:name — falls back to param name", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/classifiers/cls1", { update: { Classification: "json" } });
    expect(mockSend.mock.calls[0][0].Name).toBe("cls1");
  });
});

// ── Crawler lifecycle ───────────────────────────────────────

describe("Crawler lifecycle", () => {
  it("POST /crawlers/:name/start — starts", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/crawlers/c1/start");
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].Name).toBe("c1");
  });

  it("POST /crawlers/:name/stop — stops", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/crawlers/c1/stop");
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].Name).toBe("c1");
  });

  it("POST /crawlers/batch-get — returns crawlers and not-found", async () => {
    mockSend.mockResolvedValueOnce({ Crawlers: [{ Name: "c1" }], CrawlersNotFound: ["c9"] });
    const res = await post("/crawlers/batch-get", { crawlerNames: ["c1", "c9"] });
    const body = await res.json();
    expect(body.crawlers).toHaveLength(1);
    expect(body.crawlersNotFound).toEqual(["c9"]);
  });

  it("POST /crawlers/batch-get — empty defaults", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/crawlers/batch-get", {});
    const body = await res.json();
    expect(body.crawlers).toEqual([]);
    expect(body.crawlersNotFound).toEqual([]);
  });

  it("GET /crawler-metrics — returns metrics", async () => {
    mockSend.mockResolvedValueOnce({ CrawlerMetricsList: [{ CrawlerName: "c1" }] });
    const res = await get("/crawler-metrics");
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /crawler-metrics — empty defaults", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/crawler-metrics");
    expect((await res.json()).total).toBe(0);
  });

  it("GET /crawler-metrics — passes name filter", async () => {
    mockSend.mockResolvedValueOnce({});
    await get("/crawler-metrics?names=c1,c2");
    expect(mockSend.mock.calls[0][0].CrawlerNameList).toEqual(["c1", "c2"]);
  });

  it("POST /crawler-schedule/start — 400 without crawlerName", async () => {
    const res = await post("/crawler-schedule/start", {});
    expect(res.status).toBe(400);
  });

  it("POST /crawler-schedule/start — starts schedule", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/crawler-schedule/start", { crawlerName: "c1" });
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].CrawlerName).toBe("c1");
  });

  it("POST /crawler-schedule/stop — 400 without crawlerName", async () => {
    const res = await post("/crawler-schedule/stop", {});
    expect(res.status).toBe(400);
  });

  it("POST /crawler-schedule/stop — stops schedule", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/crawler-schedule/stop", { crawlerName: "c1" });
    expect(res.status).toBe(200);
  });

  it("PUT /crawler-schedule — 400 without crawlerName", async () => {
    const res = await put("/crawler-schedule", {});
    expect(res.status).toBe(400);
  });

  it("PUT /crawler-schedule — updates schedule", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/crawler-schedule", { crawlerName: "c1", schedule: "cron(0 1 * * ? *)" });
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].Schedule).toBe("cron(0 1 * * ? *)");
  });
});

// ── Job runs ────────────────────────────────────────────────

describe("Job runs", () => {
  it("POST /jobs/:name/runs — starts run", async () => {
    mockSend.mockResolvedValueOnce({ RunId: "jr-1" });
    const res = await post("/jobs/j1/runs", {});
    expect(res.status).toBe(201);
    expect((await res.json()).runId).toBe("jr-1");
    expect(mockSend.mock.calls[0][0].JobName).toBe("j1");
  });

  it("GET /jobs/:name/runs — lists runs", async () => {
    mockSend.mockResolvedValueOnce({ JobRuns: [{ Id: "jr-1", JobRunState: "RUNNING" }] });
    const res = await get("/jobs/j1/runs");
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /jobs/:name/runs — empty defaults", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/jobs/j1/runs");
    expect((await res.json()).total).toBe(0);
  });

  it("GET /jobs/:name/runs/:runId — returns run", async () => {
    mockSend.mockResolvedValueOnce({ JobRun: { Id: "jr-1" } });
    const res = await get("/jobs/j1/runs/jr-1");
    expect((await res.json()).run.Id).toBe("jr-1");
    expect(mockSend.mock.calls[0][0].RunId).toBe("jr-1");
  });

  it("GET /jobs/:name/runs/:runId — null when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/jobs/j1/runs/jr-1");
    expect((await res.json()).run).toBe(null);
  });

  it("POST /jobs/batch-stop — returns submissions and errors", async () => {
    mockSend.mockResolvedValueOnce({ SuccessfulSubmissions: [{ JobRunId: "jr-1" }], Errors: [] });
    const res = await post("/jobs/batch-stop", { jobName: "j1", jobRunIds: ["jr-1"] });
    const body = await res.json();
    expect(body.successfulSubmissions).toHaveLength(1);
    expect(body.errors).toEqual([]);
  });

  it("POST /jobs/batch-stop — empty defaults", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/jobs/batch-stop", { jobName: "j1" });
    const body = await res.json();
    expect(body.successfulSubmissions).toEqual([]);
    expect(body.errors).toEqual([]);
  });

  it("POST /jobs/batch-stop — 400 without jobName", async () => {
    const res = await post("/jobs/batch-stop", {});
    expect(res.status).toBe(400);
  });

  it("POST /jobs/batch-get — returns jobs and not-found", async () => {
    mockSend.mockResolvedValueOnce({ Jobs: [{ Name: "j1" }], JobsNotFound: ["j9"] });
    const res = await post("/jobs/batch-get", { jobNames: ["j1", "j9"] });
    const body = await res.json();
    expect(body.jobs).toHaveLength(1);
    expect(body.jobsNotFound).toEqual(["j9"]);
  });

  it("POST /jobs/batch-get — empty defaults", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/jobs/batch-get", {});
    const body = await res.json();
    expect(body.jobs).toEqual([]);
    expect(body.jobsNotFound).toEqual([]);
  });
});

// ── Trigger lifecycle ───────────────────────────────────────

describe("Trigger lifecycle", () => {
  it("POST /triggers/:name/start — starts", async () => {
    mockSend.mockResolvedValueOnce({ Name: "t1", TriggerInfo: { State: "ACTIVATING" } });
    const res = await post("/triggers/t1/start");
    const body = await res.json();
    expect(body.name).toBe("t1");
    expect(body.state).toBe("ACTIVATING");
  });

  it("POST /triggers/:name/start — nulls when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/triggers/t1/start");
    const body = await res.json();
    expect(body.name).toBe(null);
    expect(body.state).toBe(null);
  });

  it("POST /triggers/:name/stop — stops", async () => {
    mockSend.mockResolvedValueOnce({ Name: "t1", TriggerInfo: { State: "STOPPING" } });
    const res = await post("/triggers/t1/stop");
    expect((await res.json()).state).toBe("STOPPING");
  });
});

// ── Workflow runs ───────────────────────────────────────────

describe("Workflow runs", () => {
  it("POST /workflows/:name/runs — starts run", async () => {
    mockSend.mockResolvedValueOnce({ RunId: "wr-1" });
    const res = await post("/workflows/w1/runs");
    expect(res.status).toBe(201);
    expect((await res.json()).runId).toBe("wr-1");
  });

  it("GET /workflows/:name/runs — lists runs", async () => {
    mockSend.mockResolvedValueOnce({ Runs: [{ RunId: "wr-1" }] });
    const res = await get("/workflows/w1/runs");
    expect((await res.json()).total).toBe(1);
  });

  it("GET /workflows/:name/runs — empty defaults", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/workflows/w1/runs");
    expect((await res.json()).total).toBe(0);
  });

  it("GET /workflows/:name/runs/:runId — returns run", async () => {
    mockSend.mockResolvedValueOnce({ Run: { RunId: "wr-1" } });
    const res = await get("/workflows/w1/runs/wr-1");
    expect((await res.json()).run.RunId).toBe("wr-1");
  });

  it("GET /workflows/:name/runs/:runId — null when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/workflows/w1/runs/wr-1");
    expect((await res.json()).run).toBe(null);
  });

  it("POST /workflows/:name/runs/:runId/stop — stops run", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/workflows/w1/runs/wr-1/stop");
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].RunId).toBe("wr-1");
  });

  it("POST /workflows/:name/runs/:runId/resume — resumes run", async () => {
    mockSend.mockResolvedValueOnce({ RunId: "wr-2" });
    const res = await post("/workflows/w1/runs/wr-1/resume");
    expect(res.status).toBe(201);
    expect((await res.json()).runId).toBe("wr-2");
  });

  it("GET /workflows/:name/runs/:runId/properties — returns properties", async () => {
    mockSend.mockResolvedValueOnce({ RunProperties: { env: "prod" } });
    const res = await get("/workflows/w1/runs/wr-1/properties");
    expect((await res.json()).runProperties.env).toBe("prod");
  });

  it("GET /workflows/:name/runs/:runId/properties — null when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/workflows/w1/runs/wr-1/properties");
    expect((await res.json()).runProperties).toBe(null);
  });

  it("PUT /workflows/:name/runs/:runId/properties — puts properties", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/workflows/w1/runs/wr-1/properties", { runProperties: { env: "prod" } });
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].RunProperties.env).toBe("prod");
  });

  it("PUT /workflows/:name/runs/:runId/properties — defaults empty properties", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/workflows/w1/runs/wr-1/properties", {});
    expect(mockSend.mock.calls[0][0].RunProperties).toEqual({});
  });

  it("POST /workflows/batch-get — returns workflows and missing", async () => {
    mockSend.mockResolvedValueOnce({ Workflows: [{ Name: "w1" }], MissingWorkflows: ["w9"] });
    const res = await post("/workflows/batch-get", { names: ["w1", "w9"] });
    const body = await res.json();
    expect(body.workflows).toHaveLength(1);
    expect(body.missingWorkflows).toEqual(["w9"]);
  });

  it("POST /workflows/batch-get — empty defaults", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/workflows/batch-get", {});
    const body = await res.json();
    expect(body.workflows).toEqual([]);
    expect(body.missingWorkflows).toEqual([]);
  });
});

// ── Connections extras ──────────────────────────────────────

describe("Connections extras", () => {
  it("POST /connections/batch-delete — returns succeeded and errors", async () => {
    mockSend.mockResolvedValueOnce({ Succeeded: ["conn1"], Errors: [] });
    const res = await post("/connections/batch-delete", { connectionNames: ["conn1"] });
    const body = await res.json();
    expect(body.succeeded).toEqual(["conn1"]);
    expect(body.errors).toEqual([]);
  });

  it("POST /connections/batch-delete — empty defaults", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/connections/batch-delete", {});
    const body = await res.json();
    expect(body.succeeded).toEqual([]);
    expect(body.errors).toEqual([]);
  });

  it("POST /connections/test — passes body through", async () => {
    mockSend.mockResolvedValueOnce({ ConnectionName: "conn1" });
    const res = await post("/connections/test", { ConnectionName: "conn1" });
    const body = await res.json();
    expect(body.result.ConnectionName).toBe("conn1");
    expect(mockSend.mock.calls[0][0].ConnectionName).toBe("conn1");
  });

  it("POST /connections/test — null result when sparse", async () => {
    mockSend.mockResolvedValueOnce(undefined);
    const res = await post("/connections/test", {});
    expect((await res.json()).result).toBe(null);
  });
});

// ── Policies / catalog / data quality / search ──────────────

describe("Resource policies", () => {
  it("GET /resource-policy — returns policy", async () => {
    mockSend.mockResolvedValueOnce({ PolicyInJson: '{"Version":"2012-10-17"}' });
    const res = await get("/resource-policy");
    expect((await res.json()).policyInJson).toContain("Version");
  });

  it("GET /resource-policy — null when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/resource-policy");
    expect((await res.json()).policyInJson).toBe(null);
  });

  it("GET /resource-policies — lists policies", async () => {
    mockSend.mockResolvedValueOnce({ GetResourcePoliciesResponseList: [{ PolicyInJson: "{}" }] });
    const res = await get("/resource-policies");
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /resource-policies — empty defaults", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/resource-policies");
    expect((await res.json()).total).toBe(0);
  });

  it("PUT /resource-policy — updates policy", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/resource-policy", { policyInJson: "{}" });
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].PolicyInJson).toBe("{}");
  });

  it("PUT /resource-policy — 400 without policyInJson", async () => {
    const res = await put("/resource-policy", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /resource-policy — deletes", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/resource-policy");
    expect((await res.json()).deleted).toBe(true);
  });
});

describe("Data catalog encryption settings", () => {
  it("GET — returns settings", async () => {
    mockSend.mockResolvedValueOnce({ DataCatalogEncryptionSettings: { DataCatalogEncryptionMode: "SSE-KMS" } });
    const res = await get("/data-catalog-encryption-settings");
    expect((await res.json()).dataCatalogEncryptionSettings.DataCatalogEncryptionMode).toBe("SSE-KMS");
  });

  it("GET — null when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/data-catalog-encryption-settings");
    expect((await res.json()).dataCatalogEncryptionSettings).toBe(null);
  });

  it("PUT — updates settings", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/data-catalog-encryption-settings", { dataCatalogEncryptionSettings: { DataCatalogEncryptionMode: "SSE-KMS" } });
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].DataCatalogEncryptionSettings.DataCatalogEncryptionMode).toBe("SSE-KMS");
  });

  it("PUT — defaults empty settings", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/data-catalog-encryption-settings", {});
    expect(mockSend.mock.calls[0][0].DataCatalogEncryptionSettings).toEqual({});
  });
});

describe("Data quality rulesets and search", () => {
  it("GET /data-quality-rulesets — lists rulesets", async () => {
    mockSend.mockResolvedValueOnce({ Rulesets: [{ Name: "rs1" }] });
    const res = await get("/data-quality-rulesets");
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /data-quality-rulesets — empty defaults", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/data-quality-rulesets");
    expect((await res.json()).total).toBe(0);
  });

  it("GET /search-tables — returns tables", async () => {
    mockSend.mockResolvedValueOnce({ TableList: [{ Name: "t1" }] });
    const res = await get("/search-tables?text=t1");
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(mockSend.mock.calls[0][0].SearchText).toBe("t1");
  });

  it("GET /search-tables — no text filter", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/search-tables");
    const body = await res.json();
    expect(body.tables).toEqual([]);
    expect(mockSend.mock.calls[0][0].SearchText).toBeUndefined();
  });
});

describe("Glue advanced route arms", () => {
  it("PUT /triggers/:name — defaults empty TriggerUpdate", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/triggers/t1", {});
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].TriggerUpdate).toEqual({});
  });

  it("POST /triggers/:name/stop — nulls when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/triggers/t1/stop");
    const body = await res.json();
    expect(body.name).toBe(null);
    expect(body.state).toBe(null);
  });
});
