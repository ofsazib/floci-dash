import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { GlueClient } from "@aws-sdk/client-glue";
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
      DataFormat: body.dataFormat || "AVRO",
      Compatibility: body.compatibility || "NONE",
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

export default router;
