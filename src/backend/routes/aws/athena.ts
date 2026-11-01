import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { AthenaClient } from "@aws-sdk/client-athena";
import {
  ListWorkGroupsCommand,
  CreateWorkGroupCommand,
  DeleteWorkGroupCommand,
  GetWorkGroupCommand,
  ListQueryExecutionsCommand,
  GetQueryExecutionCommand,
  StopQueryExecutionCommand,
  GetQueryResultsCommand,
  ListDataCatalogsCommand,
  GetDataCatalogCommand,
  ListDatabasesCommand,
  ListTableMetadataCommand,
  GetTableMetadataCommand,
  StartQueryExecutionCommand,
  CreateDataCatalogCommand,
  UpdateDataCatalogCommand,
  DeleteDataCatalogCommand,
  TagResourceCommand,
  UntagResourceCommand,
  ListTagsForResourceCommand,
} from "@aws-sdk/client-athena";

const router = new Hono();
const getClient = () => create(AthenaClient);

// ── Work Groups ──────────────────────────────────────────

router.get("/work-groups", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListWorkGroupsCommand({}));
  const workGroups = result.WorkGroups || [];
  return c.json({ workGroups, total: workGroups.length });
});

router.get("/work-groups/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(new GetWorkGroupCommand({ WorkGroup: name }));
  return c.json({ workGroup: result.WorkGroup });
});

router.post("/work-groups", async (c: Context) => {
  const body = await c.req.json<{ name: string; description?: string }>();
  if (!body.name) return c.json({ error: "name is required" }, 400);

  const client = getClient();
  await client.send(
    new CreateWorkGroupCommand({
      Name: body.name,
      Description: body.description,
      Configuration: {
        ResultConfiguration: { OutputLocation: "s3://floci-athena-results/" },
        EnforceWorkGroupConfiguration: false,
        PublishCloudWatchMetricsEnabled: false,
        RequesterPaysEnabled: false,
      },
    })
  );
  return c.json({ created: true }, 201);
});

router.delete("/work-groups/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new DeleteWorkGroupCommand({ WorkGroup: name }));
  return c.json({ deleted: true });
});

// ── Query Executions ─────────────────────────────────────

router.get("/query-executions", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListQueryExecutionsCommand({}));
  const ids = result.QueryExecutionIds || [];
  return c.json({ queryExecutionIds: ids, total: ids.length });
});

router.get("/query-executions/:id", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  const result = await client.send(new GetQueryExecutionCommand({ QueryExecutionId: id }));
  return c.json({ queryExecution: result.QueryExecution });
});

router.post("/query-executions/:id/stop", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  await client.send(new StopQueryExecutionCommand({ QueryExecutionId: id }));
  return c.json({ stopped: true });
});

router.get("/query-executions/:id/results", async (c: Context) => {
  const id = c.req.param("id");
  const maxResults = parseInt(c.req.query("maxResults") || "100");
  const nextToken = c.req.query("nextToken") || undefined;
  const client = getClient();
  const input: any = { QueryExecutionId: id, MaxResults: maxResults };
  if (nextToken) input.NextToken = nextToken;
  const result = await client.send(new GetQueryResultsCommand(input));
  const rows = (result.ResultSet?.Rows || []).map((r: any) =>
    (r.Data || []).map((d: any) => d.VarCharValue || "")
  );
  const headers = result.ResultSet?.ResultSetMetadata?.ColumnInfo?.map((c: any) => ({
    name: c.Name, type: c.Type, label: c.Label,
  })) || [];
  return c.json({
    queryExecutionId: id,
    rows,
    headers,
    nextToken: result.NextToken || null,
    totalRows: rows.length,
  });
});

// ── Data Catalogs ────────────────────────────────────────

router.get("/data-catalogs", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListDataCatalogsCommand({}));
  const catalogs = result.DataCatalogsSummary || [];
  return c.json({ dataCatalogs: catalogs, total: catalogs.length });
});

router.get("/data-catalogs/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(new GetDataCatalogCommand({ Name: name }));
  return c.json({ dataCatalog: result.DataCatalog });
});

router.post("/data-catalogs", async (c: Context) => {
  const body = await c.req.json<{ name: string; type: string; description?: string; parameters?: Record<string, string>; tags?: Record<string, string> }>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  if (!body.type) return c.json({ error: "type is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new CreateDataCatalogCommand({
      Name: body.name,
      Type: body.type as any,
      Description: body.description,
      Parameters: body.parameters,
      Tags: body.tags
        ? Object.entries(body.tags).map(([Key, Value]) => ({ Key, Value }))
        : undefined,
    })
  );
  return c.json({ dataCatalog: result.DataCatalog }, 201);
});

router.put("/data-catalogs/:name", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ type: string; description?: string; parameters?: Record<string, string> }>();
  if (!body.type) return c.json({ error: "type is required" }, 400);

  const client = getClient();
  await client.send(
    new UpdateDataCatalogCommand({
      Name: name,
      Type: body.type as any,
      Description: body.description,
      Parameters: body.parameters,
    })
  );
  return c.json({ updated: true });
});

router.delete("/data-catalogs/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(new DeleteDataCatalogCommand({ Name: name }));
  return c.json({ deleted: true, dataCatalog: result.DataCatalog });
});

// ── Resource Tags (TagResource / UntagResource / ListTagsForResource) ──

router.get("/resource-tags", async (c: Context) => {
  const resourceArn = c.req.query("resourceArn");
  if (!resourceArn) return c.json({ error: "resourceArn is required" }, 400);

  const client = getClient();
  const result = await client.send(new ListTagsForResourceCommand({ ResourceARN: resourceArn }));
  const tags = result.Tags || [];
  return c.json({ resourceArn, tags, total: tags.length });
});

router.post("/resource-tags", async (c: Context) => {
  const body = await c.req.json<{ resourceArn: string; tags: Record<string, string> }>();
  if (!body.resourceArn) return c.json({ error: "resourceArn is required" }, 400);
  if (!body.tags || Object.keys(body.tags).length === 0)
    return c.json({ error: "tags are required" }, 400);

  const client = getClient();
  await client.send(
    new TagResourceCommand({
      ResourceARN: body.resourceArn,
      Tags: Object.entries(body.tags).map(([Key, Value]) => ({ Key, Value })),
    })
  );
  return c.json({ tagged: true });
});

router.delete("/resource-tags", async (c: Context) => {
  const body = await c.req.json<{ resourceArn: string; tagKeys: string[] }>();
  if (!body.resourceArn) return c.json({ error: "resourceArn is required" }, 400);
  if (!body.tagKeys || body.tagKeys.length === 0)
    return c.json({ error: "tagKeys are required" }, 400);

  const client = getClient();
  await client.send(
    new UntagResourceCommand({ ResourceARN: body.resourceArn, TagKeys: body.tagKeys })
  );
  return c.json({ untagged: true });
});

// ── Databases ────────────────────────────────────────────

router.get("/databases", async (c: Context) => {
  const catalogName = c.req.query("catalogName") || "AwsDataCatalog";
  const client = getClient();
  const result = await client.send(new ListDatabasesCommand({ CatalogName: catalogName }));
  const databases = result.DatabaseList || [];
  return c.json({ databases, total: databases.length });
});

// ── Table Metadata ───────────────────────────────────────

router.get("/databases/:dbName/tables", async (c: Context) => {
  const dbName = c.req.param("dbName");
  const client = getClient();
  const result = await client.send(
    new ListTableMetadataCommand({ CatalogName: "AwsDataCatalog", DatabaseName: dbName })
  );
  const tables = result.TableMetadataList || [];
  return c.json({ tables, total: tables.length });
});

router.get("/databases/:dbName/tables/:tableName", async (c: Context) => {
  const dbName = c.req.param("dbName");
  const tableName = c.req.param("tableName");
  const client = getClient();
  const result = await client.send(
    new GetTableMetadataCommand({ CatalogName: "AwsDataCatalog", DatabaseName: dbName, TableName: tableName })
  );
  return c.json({ tableMetadata: result.TableMetadata });
});

// ── Run Query ──────────────────────────────────────────────

router.post("/start-query", async (c: Context) => {
  const body = await c.req.json<{ query: string; database?: string; workGroup?: string }>();
  if (!body.query?.trim()) return c.json({ error: "query is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new StartQueryExecutionCommand({
      QueryString: body.query.trim(),
      QueryExecutionContext: body.database ? { Database: body.database } : undefined,
      WorkGroup: body.workGroup || "primary",
    })
  );
  return c.json({ queryExecutionId: result.QueryExecutionId }, 201);
});

export default router;
