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
  KeyType,
  ScalarAttributeType,
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

  const keySchema: Array<{ AttributeName: string; KeyType: typeof KeyType.HASH | typeof KeyType.RANGE }> = [
    { AttributeName: hashKey, KeyType: KeyType.HASH },
  ];
  const attributeDefinitions: Array<{ AttributeName: string; AttributeType: ScalarAttributeType }> = [
    { AttributeName: hashKey, AttributeType: (hashType as ScalarAttributeType) || ScalarAttributeType.S },
  ];

  if (rangeKey) {
    keySchema.push({ AttributeName: rangeKey, KeyType: KeyType.RANGE });
    attributeDefinitions.push({ AttributeName: rangeKey, AttributeType: (rangeType as ScalarAttributeType) || ScalarAttributeType.S });
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
    globalSecondaryIndexes: (t.GlobalSecondaryIndexes || []).map((gsi) => ({
      indexName: gsi.IndexName,
      indexStatus: gsi.IndexStatus,
      itemCount: gsi.ItemCount,
      indexSizeBytes: gsi.IndexSizeBytes,
      keySchema: gsi.KeySchema,
      projection: gsi.Projection,
    })),
    localSecondaryIndexes: (t.LocalSecondaryIndexes || []).map((lsi) => ({
      indexName: lsi.IndexName,
      keySchema: lsi.KeySchema,
      projection: lsi.Projection,
    })),
  });
});

// Scan table
router.get("/tables/:name/items", async (c: Context) => {
  const name = c.req.param("name");
  const limit = parseInt(c.req.query("limit") || "50");

  const params: any = { TableName: name, Limit: limit };

  const eskRaw = c.req.query("exclusiveStartKey");
  if (eskRaw) {
    try {
      const esk = JSON.parse(eskRaw);
      params.ExclusiveStartKey = marshall(esk);
    } catch {
      return c.json({ error: "Invalid exclusiveStartKey" }, 400);
    }
  }

  const result = await ddb().send(new ScanCommand(params));
  const items = (result.Items || []).map((item) => unmarshall(item));
  return c.json({
    table: name,
    items,
    count: result.Count,
    scannedCount: result.ScannedCount,
    lastEvaluatedKey: result.LastEvaluatedKey ? unmarshall(result.LastEvaluatedKey) : undefined,
  });
});

// Query items with filter
router.post("/tables/:name/items/query", async (c: Context) => {
  const name = c.req.param("name");
  const { filters, exclusiveStartKey, filterLogic } = await c.req.json<{
    filters: Array<{ attribute: string; operator: string; value: any }>;
    exclusiveStartKey?: Record<string, any>;
    filterLogic?: "AND" | "OR";
  }>();

  const limit = 50;
  const params: any = { TableName: name, Limit: limit };

  if (exclusiveStartKey) {
    params.ExclusiveStartKey = marshall(exclusiveStartKey);
  }

  if (filters && filters.length > 0) {
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};
    const conditions: string[] = [];

    filters.forEach((f, i) => {
      const nameKey = `#${i}`;
      const valueKey = `:${i}`;
      expressionAttributeNames[nameKey] = f.attribute;

      switch (f.operator) {
        case "=":
          expressionAttributeValues[valueKey] = f.value;
          conditions.push(`${nameKey} = ${valueKey}`);
          break;
        case "<>":
          expressionAttributeValues[valueKey] = f.value;
          conditions.push(`${nameKey} <> ${valueKey}`);
          break;
        case "<":
          expressionAttributeValues[valueKey] = f.value;
          conditions.push(`${nameKey} < ${valueKey}`);
          break;
        case ">":
          expressionAttributeValues[valueKey] = f.value;
          conditions.push(`${nameKey} > ${valueKey}`);
          break;
        case "<=":
          expressionAttributeValues[valueKey] = f.value;
          conditions.push(`${nameKey} <= ${valueKey}`);
          break;
        case ">=":
          expressionAttributeValues[valueKey] = f.value;
          conditions.push(`${nameKey} >= ${valueKey}`);
          break;
        case "BEGINS_WITH":
          expressionAttributeValues[valueKey] = f.value;
          conditions.push(`begins_with(${nameKey}, ${valueKey})`);
          break;
        case "EXISTS":
          conditions.push(`attribute_exists(${nameKey})`);
          break;
        case "NOT_EXISTS":
          conditions.push(`attribute_not_exists(${nameKey})`);
          break;
        case "CONTAINS":
          expressionAttributeValues[valueKey] = f.value;
          conditions.push(`contains(${nameKey}, ${valueKey})`);
          break;
        default:
          // Unsupported operator, skip
          break;
      }
    });

    if (conditions.length > 0) {
      params.FilterExpression = conditions.join(filterLogic === "OR" ? " OR " : " AND ");
      params.ExpressionAttributeNames = expressionAttributeNames;
      params.ExpressionAttributeValues = marshall(expressionAttributeValues);
    }
  }

  const result = await ddb().send(new ScanCommand(params));
  const items = (result.Items || []).map((item) => unmarshall(item));
  return c.json({
    table: name,
    items,
    count: result.Count,
    scannedCount: result.ScannedCount,
    lastEvaluatedKey: result.LastEvaluatedKey ? unmarshall(result.LastEvaluatedKey) : undefined,
  });
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
