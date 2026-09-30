import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { readJson } from "../../clients/read-json";
import {
  RedshiftDataClient,
  ExecuteStatementCommand,
  BatchExecuteStatementCommand,
  DescribeStatementCommand,
  GetStatementResultCommand,
  ListStatementsCommand,
  CancelStatementCommand,
  ListDatabasesCommand,
  ListSchemasCommand,
  ListTablesCommand,
} from "@aws-sdk/client-redshift-data";

const router = new Hono();
const getClient = () => create(RedshiftDataClient);

// ── Query execution ──────────────────────────────────────

router.post("/query", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.sql) return c.json({ error: "sql is required" }, 400);
  if (!body?.database) return c.json({ error: "database is required" }, 400);
  if (!body?.clusterIdentifier)
    return c.json({ error: "clusterIdentifier is required" }, 400);
  if (!body?.dbUser) return c.json({ error: "dbUser is required" }, 400);
  const result: any = await getClient().send(
    new ExecuteStatementCommand({
      ClusterIdentifier: body.clusterIdentifier,
      Database: body.database,
      DbUser: body.dbUser,
      Sql: body.sql,
    })
  );
  return c.json(
    {
      id: result.Id,
      clusterIdentifier: result.ClusterIdentifier,
      database: result.Database,
      hasResultSet: result.HasResultSet ?? false,
    },
    201
  );
});

router.post("/query/batch", async (c: Context) => {
  const body: any = await readJson(c);
  if (!Array.isArray(body?.sqls) || body.sqls.length === 0)
    return c.json({ error: "sqls array with at least one statement is required" }, 400);
  if (!body?.database) return c.json({ error: "database is required" }, 400);
  if (!body?.clusterIdentifier)
    return c.json({ error: "clusterIdentifier is required" }, 400);
  if (!body?.dbUser) return c.json({ error: "dbUser is required" }, 400);
  const result: any = await getClient().send(
    new BatchExecuteStatementCommand({
      ClusterIdentifier: body.clusterIdentifier,
      Database: body.database,
      DbUser: body.dbUser,
      Sqls: body.sqls,
    })
  );
  return c.json({ id: result.Id }, 201);
});

// ── Statement inspection ─────────────────────────────────

router.get("/statements", async (c: Context) => {
  const result: any = await getClient().send(new ListStatementsCommand({}));
  return c.json({
    statements: result.Statements || [],
    total: result.Statements?.length || 0,
  });
});

router.get("/statements/:id", async (c: Context) => {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "id is required" }, 400);
  const result: any = await getClient().send(
    new DescribeStatementCommand({ Id: id })
  );
  return c.json({
    id: result.Id,
    status: result.Status,
    queryString: result.QueryString,
    duration: result.Duration,
    error: result.Error ?? null,
    resultRows: result.ResultRows ?? 0,
    hasResultSet: result.HasResultSet ?? false,
    clusterIdentifier: result.ClusterIdentifier ?? null,
    database: result.Database,
  });
});

router.get("/statements/:id/result", async (c: Context) => {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "id is required" }, 400);
  const result: any = await getClient().send(
    new GetStatementResultCommand({ Id: id })
  );
  return c.json({
    columns: (result.ColumnMetadata || []).map((col: any) => ({
      name: col.name,
      typeName: col.typeName,
    })),
    records: result.Records || [],
    totalNumRows: result.TotalNumRows ?? 0,
  });
});

router.post("/statements/:id/cancel", async (c: Context) => {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "id is required" }, 400);
  await getClient().send(new CancelStatementCommand({ Id: id }));
  return c.json({ ok: true });
});

// ── Catalog browsing ─────────────────────────────────────

router.get("/databases", async (c: Context) => {
  const cluster = c.req.query("cluster");
  const dbUser = c.req.query("dbUser");
  if (!cluster) return c.json({ error: "cluster query parameter is required" }, 400);
  if (!dbUser) return c.json({ error: "dbUser query parameter is required" }, 400);
  const result: any = await getClient().send(
    new ListDatabasesCommand({
      ClusterIdentifier: cluster,
      Database: "dev",
      DbUser: dbUser,
    })
  );
  return c.json({ databases: result.Databases || [] });
});

router.get("/schemas", async (c: Context) => {
  const cluster = c.req.query("cluster");
  const database = c.req.query("database");
  const dbUser = c.req.query("dbUser");
  if (!cluster) return c.json({ error: "cluster query parameter is required" }, 400);
  if (!database) return c.json({ error: "database query parameter is required" }, 400);
  if (!dbUser) return c.json({ error: "dbUser query parameter is required" }, 400);
  const result: any = await getClient().send(
    new ListSchemasCommand({
      ClusterIdentifier: cluster,
      Database: database,
      DbUser: dbUser,
    })
  );
  return c.json({ schemas: result.Schemas || [] });
});

router.get("/tables", async (c: Context) => {
  const cluster = c.req.query("cluster");
  const database = c.req.query("database");
  const schema = c.req.query("schema");
  const dbUser = c.req.query("dbUser");
  if (!cluster) return c.json({ error: "cluster query parameter is required" }, 400);
  if (!database) return c.json({ error: "database query parameter is required" }, 400);
  if (!schema) return c.json({ error: "schema query parameter is required" }, 400);
  if (!dbUser) return c.json({ error: "dbUser query parameter is required" }, 400);
  const result: any = await getClient().send(
    new ListTablesCommand({
      ClusterIdentifier: cluster,
      Database: database,
      DbUser: dbUser,
      SchemaPattern: schema,
    })
  );
  return c.json({ tables: result.Tables || [] });
});

export default router;
