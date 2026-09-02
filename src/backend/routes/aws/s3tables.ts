import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  S3TablesClient,
  ListTableBucketsCommand,
  CreateTableBucketCommand,
  GetTableBucketCommand,
  DeleteTableBucketCommand,
  ListNamespacesCommand,
  CreateNamespaceCommand,
  DeleteNamespaceCommand,
  ListTablesCommand,
  CreateTableCommand,
  DeleteTableCommand,
} from "@aws-sdk/client-s3tables";

const router = new Hono();
const getClient = () => create(S3TablesClient);

router.get("/buckets", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListTableBucketsCommand({}));
  const buckets = result.tableBuckets || [];
  return c.json({
    buckets: buckets.map((b: any) => {
      const arn = b.tableBucketArn ?? "";
      return {
        arn: b.tableBucketArn ?? null,
        name: arn.split("/").pop()!,
        createdAt: String(b.createdAt ?? ""),
      };
    }),
    total: buckets.length,
    nextToken: result.continuationToken ?? null,
  });
});

router.post("/buckets", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateTableBucketCommand({ name: body.name })
  );
  return c.json({ arn: result.arn }, 201);
});

router.get("/buckets/:arn{.+}", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const client = getClient();
  const result = await client.send(new GetTableBucketCommand({ tableBucketARN: arn }));
  return c.json({ bucket: result.arn ?? null });
});

router.delete("/buckets/:arn{.+}", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const client = getClient();
  await client.send(new DeleteTableBucketCommand({ tableBucketARN: arn }));
  return c.json({ deleted: true });
});

router.get("/namespaces/:arn{.+}", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const client = getClient();
  const result = await client.send(
    new ListNamespacesCommand({ tableBucketARN: arn })
  );
  const namespaces = result.namespaces || [];
  return c.json({ namespaces, total: namespaces.length });
});

router.post("/namespaces/:arn{.+}", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const body = await c.req.json<any>();
  if (!body.namespace) return c.json({ error: "namespace is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateNamespaceCommand({ tableBucketARN: arn, namespace: [body.namespace] })
  );
  return c.json({ namespace: result.namespace ?? [body.namespace] }, 201);
});

router.delete("/namespaces/:arn{.+}/:namespace", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const namespace = c.req.param("namespace")!;
  const client = getClient();
  await client.send(
    new DeleteNamespaceCommand({
      tableBucketARN: arn,
      namespace,
    })
  );
  return c.json({ deleted: true });
});

router.get("/tables/:arn{.+}/:namespace", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const namespace = c.req.param("namespace")!;
  const client = getClient();
  const result = await client.send(
    new ListTablesCommand({
      tableBucketARN: arn,
      namespace,
    })
  );
  const tables = result.tables || [];
  return c.json({
    tables: tables.map((t: any) => ({
      name: t.name ?? null,
      namespace: t.namespace?.at(-1) ?? null,
      type: t.tableType ?? null,
      createdAt: String(t.createdAt ?? ""),
    })),
    total: tables.length,
  });
});

router.post("/tables/:arn{.+}/:namespace", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const namespace = c.req.param("namespace")!;
  const body = await c.req.json<any>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  if (!body.format) return c.json({ error: "format is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateTableCommand({
      tableBucketARN: arn,
      namespace,
      name: body.name,
      format: body.format,
    })
  );
  return c.json(
    { tableArn: result.tableARN, versionToken: result.versionToken ?? null },
    201
  );
});

router.delete("/tables/:arn{.+}/:namespace/:tableName", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const namespace = c.req.param("namespace")!;
  const tableName = c.req.param("tableName")!;
  const client = getClient();
  await client.send(
    new DeleteTableCommand({
      tableBucketARN: arn,
      namespace,
      name: tableName,
    })
  );
  return c.json({ deleted: true });
});

export default router;
