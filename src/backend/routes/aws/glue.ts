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

export default router;
