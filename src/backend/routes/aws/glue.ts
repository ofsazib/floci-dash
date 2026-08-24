import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { GlueClient } from "@aws-sdk/client-glue";
import {
  UpdateTableCommand,
  UpdateDatabaseCommand,
  GetTableVersionsCommand,
  BatchDeleteTableCommand,
} from "@aws-sdk/client-glue";
import {
  GetDatabasesCommand,
  GetDatabaseCommand,
  CreateDatabaseCommand,
  DeleteDatabaseCommand,
  GetTablesCommand,
  GetTableCommand,
  CreateTableCommand,
  DeleteTableCommand,
  ListRegistriesCommand,
  CreateRegistryCommand,
  GetRegistryCommand,
  DeleteRegistryCommand,
  ListSchemasCommand,
  CreateSchemaCommand,
  GetSchemaCommand,
  DeleteSchemaCommand,
  ListSchemaVersionsCommand,
  RegisterSchemaVersionCommand,
  UpdateRegistryCommand,
  GetSchemaVersionCommand,
  GetSchemaVersionsDiffCommand,
  CheckSchemaVersionValidityCommand,
  PutSchemaVersionMetadataCommand,
  RemoveSchemaVersionMetadataCommand,
  QuerySchemaVersionMetadataCommand,
  GetUserDefinedFunctionsCommand,
  CreateUserDefinedFunctionCommand,
  GetUserDefinedFunctionCommand,
  DeleteUserDefinedFunctionCommand,
  UpdateUserDefinedFunctionCommand,
  GetColumnStatisticsForTableCommand,
  UpdateColumnStatisticsForTableCommand,
  DeleteColumnStatisticsForTableCommand,
  GetColumnStatisticsForPartitionCommand,
  UpdateColumnStatisticsForPartitionCommand,
  DeleteColumnStatisticsForPartitionCommand,
  GetPartitionsCommand,
  GetPartitionCommand,
  BatchCreatePartitionCommand,
  BatchGetPartitionCommand,
  UpdatePartitionCommand,
  DeletePartitionCommand,
  BatchUpdatePartitionCommand,
  GetTagsCommand,
  TagResourceCommand,
  UntagResourceCommand,
  UpdateSchemaCommand,
  DeleteSchemaVersionsCommand,
  GetSchemaByDefinitionCommand,
} from "@aws-sdk/client-glue";

const router = new Hono();
const getClient = () => create(GlueClient);

// ── Databases ────────────────────────────────────────────

router.get("/databases", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetDatabasesCommand({}));
  const databases = result.DatabaseList || [];
  return c.json({ databases, total: databases.length });
});

router.get("/databases/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(new GetDatabaseCommand({ Name: name }));
  return c.json({ database: result.Database });
});

router.post("/databases", async (c: Context) => {
  const body = await c.req.json<{ name: string; description?: string; locationUri?: string }>();
  if (!body.name) return c.json({ error: "name is required" }, 400);

  const client = getClient();
  await client.send(
    new CreateDatabaseCommand({
      DatabaseInput: { Name: body.name, Description: body.description, LocationUri: body.locationUri },
    })
  );
  return c.json({ created: true }, 201);
});

router.delete("/databases/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new DeleteDatabaseCommand({ Name: name }));
  return c.json({ deleted: true });
});

// ── Tables ───────────────────────────────────────────────

router.get("/databases/:dbName/tables", async (c: Context) => {
  const dbName = c.req.param("dbName");
  const client = getClient();
  const result = await client.send(new GetTablesCommand({ DatabaseName: dbName }));
  const tables = result.TableList || [];
  return c.json({ tables, total: tables.length });
});

router.get("/databases/:dbName/tables/:tableName", async (c: Context) => {
  const dbName = c.req.param("dbName");
  const tableName = c.req.param("tableName");
  const client = getClient();
  const result = await client.send(new GetTableCommand({ DatabaseName: dbName, Name: tableName }));
  return c.json({ table: result.Table });
});

router.post("/databases/:dbName/tables", async (c: Context) => {
  const dbName = c.req.param("dbName");
  const body = await c.req.json<{
    name: string;
    description?: string;
    storageDescriptor?: any;
    tableType?: string;
    parameters?: Record<string, string>;
  }>();
  if (!body.name) return c.json({ error: "name is required" }, 400);

  const client = getClient();
  await client.send(
    new CreateTableCommand({
      DatabaseName: dbName,
      TableInput: {
        Name: body.name,
        Description: body.description,
        StorageDescriptor: body.storageDescriptor,
        TableType: body.tableType,
        Parameters: body.parameters,
      },
    })
  );
  return c.json({ created: true }, 201);
});

router.delete("/databases/:dbName/tables/:tableName", async (c: Context) => {
  const dbName = c.req.param("dbName");
  const tableName = c.req.param("tableName");
  const client = getClient();
  await client.send(new DeleteTableCommand({ DatabaseName: dbName, Name: tableName }));
  return c.json({ deleted: true });
});

// ── Schema Registry ──────────────────────────────────────

router.get("/registries", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListRegistriesCommand({}));
  const registries = (result.Registries || []).map((r: any) => ({
    name: r.RegistryName,
    arn: r.RegistryArn,
    status: r.Status,
    description: r.Description,
    createdTime: r.CreatedTime,
  }));
  return c.json({ registries, total: registries.length });
});

router.post("/registries", async (c: Context) => {
  const body = await c.req.json<{ name: string; description?: string }>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateRegistryCommand({
      RegistryName: body.name,
      Description: body.description,
    })
  );
  return c.json({ name: body.name, created: true }, 201);
});

router.get("/registries/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(new GetRegistryCommand({ RegistryId: { RegistryName: name } }));
  return c.json({ registry: result } as any);
});

router.put("/registries/:name", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ description?: string }>();
  if (!body.description) return c.json({ error: "description is required" }, 400);
  const client = getClient();
  await client.send(
    new UpdateRegistryCommand({
      RegistryId: { RegistryName: name },
      Description: body.description,
    })
  );
  return c.json({ name, updated: true });
});

router.delete("/registries/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new DeleteRegistryCommand({ RegistryId: { RegistryName: name } }));
  return c.json({ deleted: true });
});

// ── Schemas ──────────────────────────────────────────────

router.get("/registries/:regName/schemas", async (c: Context) => {
  const regName = c.req.param("regName");
  const client = getClient();
  const result = await client.send(new ListSchemasCommand({ RegistryId: { RegistryName: regName } }));
  const schemas = (result.Schemas || []).map((s: any) => ({
    name: s.SchemaName,
    arn: s.SchemaArn,
    status: s.SchemaStatus,
    description: s.Description,
    dataFormat: s.DataFormat,
    compatibility: s.Compatibility,
  }));
  return c.json({ schemas, total: schemas.length });
});

router.post("/registries/:regName/schemas", async (c: Context) => {
  const regName = c.req.param("regName");
  const body = await c.req.json<{
    name: string;
    dataFormat?: string;
    compatibility?: string;
    description?: string;
    definition?: string;
  }>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const client = getClient();
  await client.send(
    new CreateSchemaCommand({
      RegistryId: { RegistryName: regName },
      SchemaName: body.name,
      DataFormat: (body.dataFormat || "AVRO") as any,
      Compatibility: (body.compatibility || "NONE") as any,
      Description: body.description,
      SchemaDefinition: body.definition,
    })
  );
  return c.json({ created: true }, 201);
});

router.get("/registries/:regName/schemas/:schemaName", async (c: Context) => {
  const regName = c.req.param("regName");
  const schemaName = c.req.param("schemaName");
  const client = getClient();
  const result = await client.send(
    new GetSchemaCommand({ SchemaId: { RegistryName: regName, SchemaName: schemaName } })
  );
  return c.json({ schema: result } as any);
});

router.delete("/registries/:regName/schemas/:schemaName", async (c: Context) => {
  const regName = c.req.param("regName");
  const schemaName = c.req.param("schemaName");
  const client = getClient();
  await client.send(
    new DeleteSchemaCommand({ SchemaId: { RegistryName: regName, SchemaName: schemaName } })
  );
  return c.json({ deleted: true });
});

// ── Schema Versions ──────────────────────────────────────

router.get("/registries/:regName/schemas/:schemaName/versions", async (c: Context) => {
  const regName = c.req.param("regName");
  const schemaName = c.req.param("schemaName");
  const client = getClient();
  const result = await client.send(
    new ListSchemaVersionsCommand({ SchemaId: { RegistryName: regName, SchemaName: schemaName } })
  );
  const versions = (result.Schemas || []).map((v: any) => ({
    versionId: v.SchemaVersionId,
    versionNumber: v.VersionNumber,
    status: v.Status,
    createdTime: v.CreatedTime,
  }));
  return c.json({ versions, total: versions.length });
});

router.post("/registries/:regName/schemas/:schemaName/versions", async (c: Context) => {
  const regName = c.req.param("regName");
  const schemaName = c.req.param("schemaName");
  const body = await c.req.json<{ definition: string }>();
  if (!body.definition) return c.json({ error: "definition is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new RegisterSchemaVersionCommand({
      SchemaId: { RegistryName: regName, SchemaName: schemaName },
      SchemaDefinition: body.definition,
    })
  );
  return c.json({ versionId: result.SchemaVersionId, registered: true }, 201);
});

router.get("/registries/:regName/schemas/:schemaName/versions-diff", async (c: Context) => {
  const regName = c.req.param("regName");
  const schemaName = c.req.param("schemaName");
  const first = c.req.query("first");
  const second = c.req.query("second");
  if (!first || !second) return c.json({ error: "first and second query parameters are required" }, 400);
  const client = getClient();
  const result = await client.send(
    new GetSchemaVersionsDiffCommand({
      SchemaId: { RegistryName: regName, SchemaName: schemaName },
      FirstSchemaVersionNumber: { VersionNumber: Number(first) },
      SecondSchemaVersionNumber: { VersionNumber: Number(second) },
      SchemaDiffType: "SYNTAX_DIFF",
    })
  );
  return c.json({ diff: result.Diff });
});

router.get("/registries/:regName/schemas/:schemaName/versions/:versionNumber", async (c: Context) => {
  const regName = c.req.param("regName");
  const schemaName = c.req.param("schemaName");
  const versionNumber = c.req.param("versionNumber");
  const client = getClient();
  const result = await client.send(
    new GetSchemaVersionCommand({
      SchemaId: { RegistryName: regName, SchemaName: schemaName },
      SchemaVersionNumber: { VersionNumber: Number(versionNumber) },
    })
  );
  return c.json({
    version: {
      versionId: result.SchemaVersionId,
      versionNumber: result.VersionNumber,
      status: result.Status,
      definition: result.SchemaDefinition,
      dataFormat: result.DataFormat,
      createdTime: result.CreatedTime,
    },
  });
});

router.post("/schema-version-validity", async (c: Context) => {
  const body = await c.req.json<{ dataFormat?: string; definition: string }>();
  if (!body.definition) return c.json({ error: "definition is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CheckSchemaVersionValidityCommand({
      DataFormat: (body.dataFormat || "AVRO") as any,
      SchemaDefinition: body.definition,
    })
  );
  return c.json({ valid: result.Valid, error: result.Error });
});

router.get("/schema-versions/:versionId/metadata", async (c: Context) => {
  const versionId = c.req.param("versionId");
  const client = getClient();
  const result = await client.send(
    new QuerySchemaVersionMetadataCommand({ SchemaVersionId: versionId })
  );
  return c.json({ metadataInfoMap: result.MetadataInfoMap || {}, schemaVersionId: result.SchemaVersionId });
});

router.post("/schema-versions/:versionId/metadata", async (c: Context) => {
  const versionId = c.req.param("versionId");
  const body = await c.req.json<{ key: string; value: string }>();
  if (!body.key || !body.value) return c.json({ error: "key and value are required" }, 400);
  const client = getClient();
  await client.send(
    new PutSchemaVersionMetadataCommand({
      SchemaVersionId: versionId,
      MetadataKeyValue: { MetadataKey: body.key, MetadataValue: body.value },
    })
  );
  return c.json({ added: true });
});

router.post("/schema-versions/:versionId/metadata/delete", async (c: Context) => {
  const versionId = c.req.param("versionId");
  const body = await c.req.json<{ key: string; value: string }>();
  if (!body.key || !body.value) return c.json({ error: "key and value are required" }, 400);
  const client = getClient();
  await client.send(
    new RemoveSchemaVersionMetadataCommand({
      SchemaVersionId: versionId,
      MetadataKeyValue: { MetadataKey: body.key, MetadataValue: body.value },
    })
  );
  return c.json({ removed: true });
});

// ── User-Defined Functions ──────────────────────────────

router.get("/databases/:dbName/functions", async (c: Context) => {
  const dbName = c.req.param("dbName");
  const pattern = c.req.query("pattern") || "*";
  const client = getClient();
  const result = await client.send(
    new GetUserDefinedFunctionsCommand({ DatabaseName: dbName, Pattern: pattern })
  );
  const functions = (result.UserDefinedFunctions || []).map((f: any) => ({
    name: f.FunctionName,
    className: f.ClassName,
    ownerName: f.OwnerName,
    ownerType: f.OwnerType,
    createTime: f.CreateTime,
    resourceUris: f.ResourceUris || [],
  }));
  return c.json({ functions, total: functions.length });
});

router.post("/databases/:dbName/functions", async (c: Context) => {
  const dbName = c.req.param("dbName");
  const body = await c.req.json<{ name: string; className: string; ownerName?: string; ownerType?: string }>();
  if (!body.name || !body.className) return c.json({ error: "name and className are required" }, 400);
  const client = getClient();
  await client.send(
    new CreateUserDefinedFunctionCommand({
      DatabaseName: dbName,
      FunctionInput: {
        FunctionName: body.name,
        ClassName: body.className,
        OwnerName: body.ownerName || "admin",
        OwnerType: (body.ownerType || "USER") as any,
      },
    })
  );
  return c.json({ name: body.name, created: true }, 201);
});

router.get("/databases/:dbName/functions/:funcName", async (c: Context) => {
  const dbName = c.req.param("dbName");
  const funcName = c.req.param("funcName");
  const client = getClient();
  const result = await client.send(
    new GetUserDefinedFunctionCommand({ DatabaseName: dbName, FunctionName: funcName })
  );
  const f = result.UserDefinedFunction;
  if (!f) return c.json({ error: "Function not found" }, 404);
  return c.json({
    function: {
      name: f.FunctionName,
      className: f.ClassName,
      ownerName: f.OwnerName,
      ownerType: f.OwnerType,
      createTime: f.CreateTime,
      resourceUris: f.ResourceUris || [],
    },
  });
});

router.delete("/databases/:dbName/functions/:funcName", async (c: Context) => {
  const dbName = c.req.param("dbName");
  const funcName = c.req.param("funcName");
  const client = getClient();
  await client.send(
    new DeleteUserDefinedFunctionCommand({ DatabaseName: dbName, FunctionName: funcName })
  );
  return c.json({ name: funcName, deleted: true });
});

router.put("/databases/:dbName/functions/:funcName", async (c: Context) => {
  const dbName = c.req.param("dbName");
  const funcName = c.req.param("funcName");
  const body = await c.req.json<{ className?: string; ownerName?: string; ownerType?: string }>();
  const client = getClient();
  await client.send(
    new UpdateUserDefinedFunctionCommand({
      DatabaseName: dbName,
      FunctionName: funcName,
      FunctionInput: {
        FunctionName: funcName,
        ClassName: body.className,
        OwnerName: body.ownerName,
        OwnerType: body.ownerType as any,
      },
    })
  );
  return c.json({ name: funcName, updated: true });
});

// ── Column Statistics (Table) ───────────────────────────

router.get("/databases/:dbName/tables/:tableName/column-stats", async (c: Context) => {
  const dbName = c.req.param("dbName");
  const tableName = c.req.param("tableName");
  const client = getClient();
  try {
    const result = await client.send(
      new GetColumnStatisticsForTableCommand({
        DatabaseName: dbName,
        TableName: tableName,
      } as any)
    );
    const stats = (result.ColumnStatisticsList || []).map((cs: any) => ({
      columnName: cs.ColumnName,
      columnType: cs.ColumnType,
      analyzedTime: cs.AnalyzedTime,
      statisticsData: cs.StatisticsData,
    }));
    return c.json({ columnStats: stats, total: stats.length });
  } catch {
    return c.json({ columnStats: [], total: 0 });
  }
});

router.post("/databases/:dbName/tables/:tableName/column-stats", async (c: Context) => {
  const dbName = c.req.param("dbName");
  const tableName = c.req.param("tableName");
  const body = await c.req.json<{ columnStatisticsList: any[] }>();
  if (!body.columnStatisticsList?.length) return c.json({ error: "columnStatisticsList is required" }, 400);
  const client = getClient();
  await client.send(
    new UpdateColumnStatisticsForTableCommand({
      DatabaseName: dbName,
      TableName: tableName,
      ColumnStatisticsList: body.columnStatisticsList,
    })
  );
  return c.json({ updated: true });
});

router.delete("/databases/:dbName/tables/:tableName/column-stats", async (c: Context) => {
  const dbName = c.req.param("dbName");
  const tableName = c.req.param("tableName");
  const columnName = c.req.query("column");
  if (!columnName) return c.json({ error: "column query parameter is required" }, 400);
  const client = getClient();
  await client.send(
    new DeleteColumnStatisticsForTableCommand({
      DatabaseName: dbName,
      TableName: tableName,
      ColumnName: columnName,
    })
  );
  return c.json({ column: columnName, deleted: true });
});

// ── Column Statistics (Partition) ───────────────────────

router.get("/databases/:dbName/tables/:tableName/partitions/column-stats", async (c: Context) => {
  const dbName = c.req.param("dbName");
  const tableName = c.req.param("tableName");
  const partitionValues = c.req.queries("values") || [];
  if (!partitionValues.length) return c.json({ error: "values query parameter is required" }, 400);
  const client = getClient();
  try {
    const result = await client.send(
      new GetColumnStatisticsForPartitionCommand({
        DatabaseName: dbName,
        TableName: tableName,
        PartitionValues: partitionValues,
      } as any)
    );
    const stats = (result.ColumnStatisticsList || []).map((cs: any) => ({
      columnName: cs.ColumnName,
      columnType: cs.ColumnType,
      analyzedTime: cs.AnalyzedTime,
      statisticsData: cs.StatisticsData,
    }));
    return c.json({ columnStats: stats, total: stats.length });
  } catch {
    return c.json({ columnStats: [], total: 0 });
  }
});

router.post("/databases/:dbName/tables/:tableName/partitions/column-stats", async (c: Context) => {
  const dbName = c.req.param("dbName");
  const tableName = c.req.param("tableName");
  const body = await c.req.json<{ partitionValues: string[]; columnStatisticsList: any[] }>();
  if (!body.partitionValues?.length) return c.json({ error: "partitionValues is required" }, 400);
  if (!body.columnStatisticsList?.length) return c.json({ error: "columnStatisticsList is required" }, 400);
  const client = getClient();
  await client.send(
    new UpdateColumnStatisticsForPartitionCommand({
      DatabaseName: dbName,
      TableName: tableName,
      PartitionValues: body.partitionValues,
      ColumnStatisticsList: body.columnStatisticsList,
    })
  );
  return c.json({ updated: true });
});

router.delete("/databases/:dbName/tables/:tableName/partitions/column-stats", async (c: Context) => {
  const dbName = c.req.param("dbName");
  const tableName = c.req.param("tableName");
  const columnName = c.req.query("column");
  const partitionValues = c.req.queries("values") || [];
  if (!columnName) return c.json({ error: "column query parameter is required" }, 400);
  if (!partitionValues.length) return c.json({ error: "values query parameter is required" }, 400);
  const client = getClient();
  await client.send(
    new DeleteColumnStatisticsForPartitionCommand({
      DatabaseName: dbName,
      TableName: tableName,
      ColumnName: columnName,
      PartitionValues: partitionValues,
    })
  );
  return c.json({ column: columnName, deleted: true });
});

// ── Partitions ──────────────────────────────────────────

function mapPartition(p: any) {
  return {
    values: p.Values || [],
    databaseName: p.DatabaseName,
    tableName: p.TableName,
    creationTime: p.CreationTime,
    lastAccessTime: p.LastAccessTime,
    location: p.StorageDescriptor?.Location || null,
    parameters: p.Parameters || {},
  };
}

router.get("/databases/:dbName/tables/:tableName/partitions", async (c: Context) => {
  const dbName = c.req.param("dbName");
  const tableName = c.req.param("tableName");
  const expression = c.req.query("expression");
  const client = getClient();
  const result = await client.send(
    new GetPartitionsCommand({
      DatabaseName: dbName,
      TableName: tableName,
      Expression: expression || undefined,
    })
  );
  const partitions = (result.Partitions || []).map(mapPartition);
  return c.json({ partitions, total: partitions.length });
});

router.get("/databases/:dbName/tables/:tableName/partitions/get", async (c: Context) => {
  const dbName = c.req.param("dbName");
  const tableName = c.req.param("tableName");
  const partitionValues = c.req.queries("values") || [];
  if (!partitionValues.length) return c.json({ error: "values query parameter is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new GetPartitionCommand({
      DatabaseName: dbName,
      TableName: tableName,
      PartitionValues: partitionValues,
    })
  );
  if (!result.Partition) return c.json({ error: "Partition not found" }, 404);
  return c.json({ partition: mapPartition(result.Partition) });
});

router.post("/databases/:dbName/tables/:tableName/partitions", async (c: Context) => {
  const dbName = c.req.param("dbName");
  const tableName = c.req.param("tableName");
  const body = await c.req.json<{ partitionInputList: any[] }>();
  if (!body.partitionInputList?.length) return c.json({ error: "partitionInputList is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new BatchCreatePartitionCommand({
      DatabaseName: dbName,
      TableName: tableName,
      PartitionInputList: body.partitionInputList,
    })
  );
  return c.json({ created: true, errors: result.Errors || [] }, 201);
});

router.post("/databases/:dbName/tables/:tableName/partitions/batch-get", async (c: Context) => {
  const dbName = c.req.param("dbName");
  const tableName = c.req.param("tableName");
  const body = await c.req.json<{ partitionsToGet: { Values: string[] }[] }>();
  if (!body.partitionsToGet?.length) return c.json({ error: "partitionsToGet is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new BatchGetPartitionCommand({
      DatabaseName: dbName,
      TableName: tableName,
      PartitionsToGet: body.partitionsToGet,
    })
  );
  const partitions = (result.Partitions || []).map(mapPartition);
  return c.json({ partitions, total: partitions.length, unprocessedKeys: result.UnprocessedKeys || [] });
});

router.post("/databases/:dbName/tables/:tableName/partitions/batch-update", async (c: Context) => {
  const dbName = c.req.param("dbName");
  const tableName = c.req.param("tableName");
  const body = await c.req.json<{ entries: { PartitionValueList: string[]; PartitionInput: any }[] }>();
  if (!body.entries?.length) return c.json({ error: "entries is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new BatchUpdatePartitionCommand({
      DatabaseName: dbName,
      TableName: tableName,
      Entries: body.entries,
    })
  );
  return c.json({ updated: true, errors: result.Errors || [] });
});

router.put("/databases/:dbName/tables/:tableName/partitions", async (c: Context) => {
  const dbName = c.req.param("dbName");
  const tableName = c.req.param("tableName");
  const body = await c.req.json<{ partitionValueList: string[]; partitionInput: any }>();
  if (!body.partitionValueList?.length) return c.json({ error: "partitionValueList is required" }, 400);
  if (!body.partitionInput) return c.json({ error: "partitionInput is required" }, 400);
  const client = getClient();
  await client.send(
    new UpdatePartitionCommand({
      DatabaseName: dbName,
      TableName: tableName,
      PartitionValueList: body.partitionValueList,
      PartitionInput: body.partitionInput,
    })
  );
  return c.json({ updated: true });
});

router.delete("/databases/:dbName/tables/:tableName/partitions", async (c: Context) => {
  const dbName = c.req.param("dbName");
  const tableName = c.req.param("tableName");
  const partitionValues = c.req.queries("values") || [];
  if (!partitionValues.length) return c.json({ error: "values query parameter is required" }, 400);
  const client = getClient();
  await client.send(
    new DeletePartitionCommand({
      DatabaseName: dbName,
      TableName: tableName,
      PartitionValues: partitionValues,
    })
  );
  return c.json({ deleted: true });
});


// ── Table/Database updates + versions ──────────────────

router.put("/databases/:dbName/tables/:tableName", async (c: Context) => {
  const dbName = c.req.param("dbName")!;
  const tableName = c.req.param("tableName")!;
  const body = await c.req.json<any>();
  if (!body.tableInput) return c.json({ error: "tableInput is required" }, 400);
  const client = getClient();
  await client.send(
    new UpdateTableCommand({
      DatabaseName: dbName,
      TableInput: { ...body.tableInput, Name: body.tableInput.name || tableName },
    })
  );
  return c.json({ updated: true });
});

router.put("/databases/:dbName", async (c: Context) => {
  const dbName = c.req.param("dbName")!;
  const body = await c.req.json<any>();
  if (!body.databaseInput) return c.json({ error: "databaseInput is required" }, 400);
  const client = getClient();
  await client.send(
    new UpdateDatabaseCommand({
      Name: dbName,
      DatabaseInput: { ...body.databaseInput, Name: body.databaseInput.name || dbName },
    })
  );
  return c.json({ updated: true });
});

router.get("/databases/:dbName/tables/:tableName/versions", async (c: Context) => {
  const dbName = c.req.param("dbName")!;
  const tableName = c.req.param("tableName")!;
  const client = getClient();
  const result = await client.send(
    new GetTableVersionsCommand({ DatabaseName: dbName, TableName: tableName })
  );
  const versions = (result.TableVersions || []).map((v: any) => ({
    versionId: v.VersionId,
    createdTime: v.CreatedTime,
    table: v.Table ? { name: v.Table.Name, description: v.Table.Description } : null,
  }));
  return c.json({ versions, total: versions.length });
});

router.post("/databases/:dbName/tables/batch-delete", async (c: Context) => {
  const dbName = c.req.param("dbName")!;
  const body = await c.req.json<any>();
  if (!body.tableNames?.length) return c.json({ error: "tableNames is required" }, 400);
  const client = getClient();
  const result: any = await client.send(
    new BatchDeleteTableCommand({ DatabaseName: dbName, TablesToDelete: body.tableNames })
  );
  return c.json({
    deleted: (result.TablesDeleted || []).length,
    errors: result.Errors || [],
  });
});

// ── Tags ────────────────────────────────────────────────

router.get("/tags", async (c: Context) => {
  const resourceArn = c.req.query("resourceArn");
  if (!resourceArn) return c.json({ error: "resourceArn query parameter is required" }, 400);
  const client = getClient();
  const result = await client.send(new GetTagsCommand({ ResourceArn: resourceArn }));
  return c.json({ tags: result.Tags || {} });
});

router.post("/tags", async (c: Context) => {
  const body = await c.req.json<{ resourceArn: string; tags: Record<string, string> }>();
  if (!body.resourceArn) return c.json({ error: "resourceArn is required" }, 400);
  const client = getClient();
  await client.send(
    new TagResourceCommand({
      ResourceArn: body.resourceArn,
      Tags: body.tags || {},
    })
  );
  return c.json({ tagged: true });
});

router.delete("/tags/:resourceArn", async (c: Context) => {
  const resourceArn = decodeURIComponent(c.req.param("resourceArn"));
  const tagKeys = c.req.queries("tagKey") || [];
  if (!tagKeys.length) return c.json({ error: "tagKey query parameter is required" }, 400);
  const client = getClient();
  await client.send(
    new UntagResourceCommand({
      ResourceArn: resourceArn,
      TagKeys: tagKeys,
    })
  );
  return c.json({ untagged: true });
});

// ── Schema Registry extra operations ────────────────────

router.put("/registries/:regName/schemas/:schemaName", async (c: Context) => {
  const regName = c.req.param("regName");
  const schemaName = c.req.param("schemaName");
  const body = await c.req.json<{ compatibility?: string; description?: string }>();
  if (!body.compatibility && !body.description) return c.json({ error: "compatibility or description is required" }, 400);
  const client = getClient();
  await client.send(
    new UpdateSchemaCommand({
      SchemaId: { RegistryName: regName, SchemaName: schemaName },
      Compatibility: body.compatibility as any,
      Description: body.description,
    })
  );
  return c.json({ schemaName, updated: true });
});

router.delete("/registries/:regName/schemas/:schemaName/versions", async (c: Context) => {
  const regName = c.req.param("regName");
  const schemaName = c.req.param("schemaName");
  const body = await c.req.json<{ versions: number[] }>();
  if (!body.versions?.length) return c.json({ error: "versions array is required" }, 400);
  const client = getClient();
  await client.send(
    new DeleteSchemaVersionsCommand({
      SchemaId: { RegistryName: regName, SchemaName: schemaName },
      Versions: body.versions,
    })
  );
  return c.json({ deleted: true });
});

router.post("/schemas/by-definition", async (c: Context) => {
  const body = await c.req.json<{ registryName?: string; schemaName?: string; definition: string }>();
  if (!body.definition) return c.json({ error: "definition is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new GetSchemaByDefinitionCommand({
      SchemaId: {
        RegistryName: body.registryName,
        SchemaName: body.schemaName,
      },
      SchemaDefinition: body.definition,
    })
  );
  return c.json({
    schemaVersionId: result.SchemaVersionId,
    schemaArn: result.SchemaArn,
    dataFormat: result.DataFormat,
    status: result.Status,
    createdTime: result.CreatedTime,
  });
});

export default router;