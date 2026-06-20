import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { RDSDataClient } from "@aws-sdk/client-rds-data";
import {
  ExecuteStatementCommand,
  BeginTransactionCommand,
  CommitTransactionCommand,
  RollbackTransactionCommand,
} from "@aws-sdk/client-rds-data";

const router = new Hono();
const getClient = () => create(RDSDataClient);

router.post("/execute", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.sql) return c.json({ error: "sql is required" }, 400);
  if (!body.resourceArn) return c.json({ error: "resourceArn is required" }, 400);
  if (!body.secretArn) return c.json({ error: "secretArn is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new ExecuteStatementCommand({
      sql: body.sql,
      resourceArn: body.resourceArn,
      secretArn: body.secretArn,
      database: body.database,
      transactionId: body.transactionId,
      includeResultMetadata: body.includeResultMetadata,
    })
  );
  return c.json({
    records: result.records || [],
    columnMetadata: result.columnMetadata,
    numberOfRecordsUpdated: result.numberOfRecordsUpdated,
  });
});

router.post("/begin-transaction", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.resourceArn) return c.json({ error: "resourceArn is required" }, 400);
  if (!body.secretArn) return c.json({ error: "secretArn is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new BeginTransactionCommand({
      resourceArn: body.resourceArn,
      secretArn: body.secretArn,
      database: body.database,
    })
  );
  return c.json({ transactionId: result.transactionId });
});

router.post("/commit-transaction", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.transactionId) return c.json({ error: "transactionId is required" }, 400);
  if (!body.resourceArn) return c.json({ error: "resourceArn is required" }, 400);
  if (!body.secretArn) return c.json({ error: "secretArn is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CommitTransactionCommand({
      transactionId: body.transactionId,
      resourceArn: body.resourceArn,
      secretArn: body.secretArn,
    })
  );
  return c.json({ transactionStatus: result.transactionStatus });
});

router.post("/rollback-transaction", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.transactionId) return c.json({ error: "transactionId is required" }, 400);
  if (!body.resourceArn) return c.json({ error: "resourceArn is required" }, 400);
  if (!body.secretArn) return c.json({ error: "secretArn is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new RollbackTransactionCommand({
      transactionId: body.transactionId,
      resourceArn: body.resourceArn,
      secretArn: body.secretArn,
    })
  );
  return c.json({ transactionStatus: result.transactionStatus });
});

export default router;
