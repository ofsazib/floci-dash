import { Hono } from "hono";
import type { Context } from "hono";
import {
  DynamoDBClient,
  ListTablesCommand,
  CreateTableCommand,
  DeleteTableCommand,
  DescribeTableCommand,
  ScanCommand,
  GetItemCommand,
  PutItemCommand,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { getAwsConfig } from "../../clients/aws";

const router = new Hono();

function ddb(): DynamoDBClient {
  return new DynamoDBClient(getAwsConfig());
}

// List tables
router.get("/tables", async (c: Context) => {
  const result = await ddb().send(new ListTablesCommand({}));
  return c.json({ tables: result.TableNames || [], total: (result.TableNames || []).length });
});

// Create table
router.post("/tables", async (c: Context) => {
  const { name, hashKey, hashType, rangeKey, rangeType } = await c.req.json<{
    name: string;
    hashKey: string;
    hashType?: string;
    rangeKey?: string;
    rangeType?: string;
  }>();
  if (!name || !hashKey) return c.json({ error: "Table name and hash key are required" }, 400);

  const keySchema: { AttributeName: string; KeyType: string }[] = [
    { AttributeName: hashKey, KeyType: "HASH" },
  ];
  const attributeDefinitions: { AttributeName: string; AttributeType: string }[] = [
    { AttributeName: hashKey, AttributeType: hashType || "S" },
  ];

  if (rangeKey) {
    keySchema.push({ AttributeName: rangeKey, KeyType: "RANGE" });
    attributeDefinitions.push({ AttributeName: rangeKey, AttributeType: rangeType || "S" });
  }

  await ddb().send(
    new CreateTableCommand({
      TableName: name,
      KeySchema: keySchema,
      AttributeDefinitions: attributeDefinitions,
      BillingMode: "PAY_PER_REQUEST",
    })
  );
  return c.json({ name, created: true });
});

// Delete table
router.delete("/tables/:name", async (c: Context) => {
  const name = c.req.param("name");
  await ddb().send(new DeleteTableCommand({ TableName: name }));
  return c.json({ name, deleted: true });
});

// Describe table
router.get("/tables/:name", async (c: Context) => {
  const name = c.req.param("name");
  const result = await ddb().send(new DescribeTableCommand({ TableName: name }));
  const t = result.Table!;
  return c.json({
    name: t.TableName,
    status: t.TableStatus,
    itemCount: t.ItemCount,
    sizeBytes: t.TableSizeBytes,
    keySchema: t.KeySchema,
    arn: t.TableArn,
    createdAt: t.CreationDateTime?.toISOString(),
  });
});

// Scan table
router.get("/tables/:name/items", async (c: Context) => {
  const name = c.req.param("name");
  const limit = parseInt(c.req.query("limit") || "50");
  const result = await ddb().send(new ScanCommand({ TableName: name, Limit: limit }));
  const items = (result.Items || []).map((item) => unmarshall(item));
  return c.json({ table: name, items, count: result.Count, scannedCount: result.ScannedCount });
});

// Get item
router.post("/tables/:name/items/get", async (c: Context) => {
  const name = c.req.param("name");
  const { key } = await c.req.json<{ key: Record<string, any> }>();
  if (!key) return c.json({ error: "Item key is required" }, 400);
  const result = await ddb().send(new GetItemCommand({ TableName: name, Key: marshall(key) }));
  if (!result.Item) return c.json({ item: null, found: false });
  return c.json({ item: unmarshall(result.Item), found: true });
});

// Put item
router.put("/tables/:name/items", async (c: Context) => {
  const name = c.req.param("name");
  const { item } = await c.req.json<{ item: Record<string, any> }>();
  if (!item) return c.json({ error: "Item is required" }, 400);
  await ddb().send(new PutItemCommand({ TableName: name, Item: marshall(item, { removeUndefinedValues: true }) }));
  return c.json({ saved: true });
});

// Delete item
router.post("/tables/:name/items/delete", async (c: Context) => {
  const name = c.req.param("name");
  const { key } = await c.req.json<{ key: Record<string, any> }>();
  if (!key) return c.json({ error: "Item key is required" }, 400);
  await ddb().send(new DeleteItemCommand({ TableName: name, Key: marshall(key) }));
  return c.json({ deleted: true });
});

export default router;
