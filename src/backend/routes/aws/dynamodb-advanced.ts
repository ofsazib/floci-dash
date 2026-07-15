import { Hono } from "hono";
import type { Context } from "hono";
import {
  DynamoDBClient,
  UpdateItemCommand,
  UpdateTableCommand,
  BatchGetItemCommand,
  BatchWriteItemCommand,
  TransactGetItemsCommand,
  TransactWriteItemsCommand,
  DescribeTimeToLiveCommand,
  UpdateTimeToLiveCommand,
  TagResourceCommand,
  UntagResourceCommand,
  ListTagsOfResourceCommand,
  DescribeContinuousBackupsCommand,
  UpdateContinuousBackupsCommand,
  ExecuteStatementCommand,
  ExecuteTransactionCommand,
  BatchExecuteStatementCommand,
  ExportTableToPointInTimeCommand,
  ListExportsCommand,
  DescribeExportCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { getAwsConfig } from "../../clients/aws";

const router = new Hono();

function ddb(): DynamoDBClient {
  return new DynamoDBClient(getAwsConfig());
}

// ─── UpdateTable ──────────────────────────────────────────────────

router.put("/tables/:name/update", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{
    BillingMode?: string;
    ProvisionedThroughput?: { ReadCapacityUnits: number; WriteCapacityUnits: number };
    SSESpecification?: { Enabled: boolean; SSEType?: string; KMSMasterKeyId?: string };
    StreamSpecification?: { StreamEnabled: boolean; StreamViewType?: string };
    DeletionProtectionEnabled?: boolean;
    TableClass?: string;
    AttributeDefinitions?: Array<{ AttributeName: string; AttributeType: string }>;
    GlobalSecondaryIndexUpdates?: Array<{
      Create?: {
        IndexName: string;
        KeySchema: Array<{ AttributeName: string; KeyType: string }>;
        Projection?: { ProjectionType?: string; NonKeyAttributes?: string[] };
        ProvisionedThroughput?: { ReadCapacityUnits: number; WriteCapacityUnits: number };
      };
      Delete?: { IndexName: string };
    }>;
  }>();

  if (!body || Object.keys(body).length === 0) {
    return c.json({ error: "At least one update parameter is required" }, 400);
  }

  if (body.BillingMode === "PAY_PER_REQUEST" && body.ProvisionedThroughput) {
    return c.json({ error: "ProvisionedThroughput cannot be specified when BillingMode is PAY_PER_REQUEST" }, 400);
  }

  const params: any = { TableName: name };

  if (body.BillingMode) params.BillingMode = body.BillingMode;
  if (body.ProvisionedThroughput) {
    params.ProvisionedThroughput = {
      ReadCapacityUnits: body.ProvisionedThroughput.ReadCapacityUnits,
      WriteCapacityUnits: body.ProvisionedThroughput.WriteCapacityUnits,
    };
  }
  if (body.SSESpecification) {
    const sse: any = { Enabled: body.SSESpecification.Enabled };
    if (body.SSESpecification.SSEType) sse.SSEType = body.SSESpecification.SSEType;
    if (body.SSESpecification.KMSMasterKeyId) sse.KMSMasterKeyId = body.SSESpecification.KMSMasterKeyId;
    params.SSESpecification = sse;
  }
  if (body.StreamSpecification) {
    params.StreamSpecification = {
      StreamEnabled: body.StreamSpecification.StreamEnabled,
      StreamViewType: body.StreamSpecification.StreamViewType || "NEW_AND_OLD_IMAGES",
    };
  }
  if (body.DeletionProtectionEnabled !== undefined) {
    params.DeletionProtectionEnabled = body.DeletionProtectionEnabled;
  }
  if (body.TableClass) params.TableClass = body.TableClass;
  if (body.AttributeDefinitions && body.AttributeDefinitions.length > 0) {
    params.AttributeDefinitions = body.AttributeDefinitions;
  }
  if (body.GlobalSecondaryIndexUpdates && body.GlobalSecondaryIndexUpdates.length > 0) {
    params.GlobalSecondaryIndexUpdates = body.GlobalSecondaryIndexUpdates.map((update) => {
      const mapped: any = {};
      if (update.Create) {
        mapped.Create = {
          IndexName: update.Create.IndexName,
          KeySchema: update.Create.KeySchema,
          Projection: update.Create.Projection
            ? {
                ProjectionType: update.Create.Projection.ProjectionType || "ALL",
                ...(update.Create.Projection.NonKeyAttributes?.length
                  ? { NonKeyAttributes: update.Create.Projection.NonKeyAttributes }
                  : {}),
              }
            : { ProjectionType: "ALL" },
        };
        if (update.Create.ProvisionedThroughput) {
          mapped.Create.ProvisionedThroughput = update.Create.ProvisionedThroughput;
        }
      }
      if (update.Delete) mapped.Delete = { IndexName: update.Delete.IndexName };
      return mapped;
    });
  }

  const result = await ddb().send(new UpdateTableCommand(params));
  const desc = result.TableDescription;

  return c.json({
    table: name,
    updated: true,
    tableStatus: desc?.TableStatus || "UPDATING",
    billingMode: desc?.BillingModeSummary?.BillingMode || body.BillingMode || null,
    streamSpecification: desc?.StreamSpecification || null,
    sseDescription: desc?.SSEDescription || null,
  });
});

// ─── UpdateItem ───────────────────────────────────────────────────

router.post("/tables/:name/items/update", async (c: Context) => {
  const name = c.req.param("name");
  const { key, updates, conditionExpression, expressionAttributeNames, expressionAttributeValues } = await c.req.json<{
    key: Record<string, any>;
    updates: Record<string, any>;
    conditionExpression?: string;
    expressionAttributeNames?: Record<string, string>;
    expressionAttributeValues?: Record<string, any>;
  }>();
  if (!key || !updates) return c.json({ error: "Key and updates are required" }, 400);

  const updateParts: string[] = [];
  const names: Record<string, string> = { ...expressionAttributeNames };
  const values: Record<string, any> = { ...expressionAttributeValues };

  let i = 0;
  for (const [attr, val] of Object.entries(updates)) {
    const nameKey = `#u${i}`;
    const valueKey = `:u${i}`;
    names[nameKey] = attr;
    values[valueKey] = val;
    updateParts.push(`${nameKey} = ${valueKey}`);
    i++;
  }

  const params: any = {
    TableName: name,
    Key: marshall(key),
    UpdateExpression: `SET ${updateParts.join(", ")}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: marshall(values, { removeUndefinedValues: true }),
    ReturnValues: "ALL_NEW",
  };
  if (conditionExpression) params.ConditionExpression = conditionExpression;

  const result = await ddb().send(new UpdateItemCommand(params));
  return c.json({
    updated: true,
    attributes: result.Attributes ? unmarshall(result.Attributes) : null,
  });
});

// ─── BatchGetItem ─────────────────────────────────────────────────

router.post("/batch-get", async (c: Context) => {
  const { requests } = await c.req.json<{
    requests: Array<{ tableName: string; keys: Record<string, any>[] }>;
  }>();
  if (!requests || !Array.isArray(requests)) return c.json({ error: "Requests array is required" }, 400);

  const requestItems: Record<string, any> = {};
  for (const req of requests) {
    requestItems[req.tableName] = {
      Keys: req.keys.map((k) => marshall(k)),
    };
  }

  const result = await ddb().send(new BatchGetItemCommand({ RequestItems: requestItems }));

  const responses: Record<string, any[]> = {};
  for (const [table, items] of Object.entries(result.Responses || {})) {
    responses[table] = items.map((item) => unmarshall(item));
  }

  return c.json({
    responses,
    unprocessedKeys: result.UnprocessedKeys || {},
  });
});

// ─── BatchWriteItem ───────────────────────────────────────────────

router.post("/batch-write", async (c: Context) => {
  const { requests } = await c.req.json<{
    requests: Array<{
      tableName: string;
      type: "put" | "delete";
      item?: Record<string, any>;
      key?: Record<string, any>;
    }>;
  }>();
  if (!requests || !Array.isArray(requests)) return c.json({ error: "Requests array is required" }, 400);

  const requestItems: Record<string, any[]> = {};
  for (const req of requests) {
    if (!requestItems[req.tableName]) requestItems[req.tableName] = [];
    if (req.type === "put" && req.item) {
      requestItems[req.tableName].push({ PutRequest: { Item: marshall(req.item, { removeUndefinedValues: true }) } });
    } else if (req.type === "delete" && req.key) {
      requestItems[req.tableName].push({ DeleteRequest: { Key: marshall(req.key) } });
    }
  }

  const result = await ddb().send(new BatchWriteItemCommand({ RequestItems: requestItems }));
  return c.json({
    wrote: requests.length - Object.keys(result.UnprocessedItems || {}).length,
    unprocessedItems: result.UnprocessedItems || {},
  });
});

// ─── TransactGetItems ─────────────────────────────────────────────

router.post("/transaction/get", async (c: Context) => {
  const { items } = await c.req.json<{
    items: Array<{ tableName: string; key: Record<string, any> }>;
  }>();
  if (!items || !Array.isArray(items)) return c.json({ error: "Items array is required" }, 400);

  const result = await ddb().send(new TransactGetItemsCommand({
    TransactItems: items.map((item) => ({
      Get: { TableName: item.tableName, Key: marshall(item.key) },
    })),
  }));

  const responses = (result.Responses || []).map((r) =>
    r.Item ? unmarshall(r.Item) : null
  );

  return c.json({ responses, total: responses.length });
});

// ─── TransactWriteItems ───────────────────────────────────────────

router.post("/transaction/write", async (c: Context) => {
  const { items } = await c.req.json<{
    items: Array<{
      type: "put" | "delete" | "update";
      tableName: string;
      item?: Record<string, any>;
      key?: Record<string, any>;
      updates?: Record<string, any>;
    }>;
  }>();
  if (!items || !Array.isArray(items)) return c.json({ error: "Items array is required" }, 400);

  const transactItems: any[] = items.map((item) => {
    switch (item.type) {
      case "put":
        return { Put: { TableName: item.tableName, Item: marshall(item.item!, { removeUndefinedValues: true }) } };
      case "delete":
        return { Delete: { TableName: item.tableName, Key: marshall(item.key!) } };
      case "update": {
        const updateParts: string[] = [];
        const values: Record<string, any> = {};
        let i = 0;
        for (const [attr, val] of Object.entries(item.updates || {})) {
          updateParts.push(`#u${i} = :u${i}`);
          values[`:u${i}`] = val;
          i++;
        }
        return {
          Update: {
            TableName: item.tableName,
            Key: marshall(item.key!),
            UpdateExpression: `SET ${updateParts.join(", ")}`,
            ExpressionAttributeNames: Object.fromEntries(
              Object.keys(item.updates || {}).map((k: string, idx: number): [string, string] => [`#u${idx}`, k])
            ),
            ExpressionAttributeValues: marshall(values, { removeUndefinedValues: true }),
          },
        };
      }
      default:
        throw new Error(`Unknown type: ${item.type}`);
    }
  });

  await ddb().send(new TransactWriteItemsCommand({ TransactItems: transactItems }));
  return c.json({ written: items.length });
});

// ─── Time to Live ─────────────────────────────────────────────────

router.get("/tables/:name/ttl", async (c: Context) => {
  const name = c.req.param("name");
  const result = await ddb().send(new DescribeTimeToLiveCommand({ TableName: name }));
  return c.json({
    table: name,
    enabled: result.TimeToLiveDescription?.TimeToLiveStatus === "ENABLED",
    status: result.TimeToLiveDescription?.TimeToLiveStatus || "DISABLED",
    attributeName: result.TimeToLiveDescription?.AttributeName || null,
  });
});

router.put("/tables/:name/ttl", async (c: Context) => {
  const name = c.req.param("name");
  const { enabled, attributeName } = await c.req.json<{ enabled: boolean; attributeName: string }>();
  if (!attributeName) return c.json({ error: "attributeName is required" }, 400);
  await ddb().send(new UpdateTimeToLiveCommand({
    TableName: name,
    TimeToLiveSpecification: { Enabled: enabled, AttributeName: attributeName },
  }));
  return c.json({ table: name, enabled, attributeName, updated: true });
});

// ─── Tags ─────────────────────────────────────────────────────────

router.get("/tables/:name/tags", async (c: Context) => {
  const name = c.req.param("name");
  const arn = `arn:aws:dynamodb:${getAwsConfig().region}:${getAwsConfig().credentials.accessKeyId}:table/${name}`;
  const result = await ddb().send(new ListTagsOfResourceCommand({ ResourceArn: arn }));
  return c.json({ table: name, tags: result.Tags || [], total: (result.Tags || []).length });
});

router.post("/tables/:name/tags", async (c: Context) => {
  const name = c.req.param("name");
  const { tags } = await c.req.json<{ tags: Array<{ Key: string; Value: string }> }>();
  if (!tags || !Array.isArray(tags)) return c.json({ error: "Tags array is required" }, 400);
  const arn = `arn:aws:dynamodb:${getAwsConfig().region}:${getAwsConfig().credentials.accessKeyId}:table/${name}`;
  await ddb().send(new TagResourceCommand({ ResourceArn: arn, Tags: tags }));
  return c.json({ table: name, tags, updated: true });
});

router.delete("/tables/:name/tags/:tagKey", async (c: Context) => {
  const name = c.req.param("name");
  const tagKey = c.req.param("tagKey") as string;
  const arn = `arn:aws:dynamodb:${getAwsConfig().region}:${getAwsConfig().credentials.accessKeyId}:table/${name}`;
  await ddb().send(new UntagResourceCommand({ ResourceArn: arn, TagKeys: [tagKey] }));
  return c.json({ table: name, deleted: true });
});

// ─── Continuous Backups ───────────────────────────────────────────

router.get("/tables/:name/backups", async (c: Context) => {
  const name = c.req.param("name");
  const result = await ddb().send(new DescribeContinuousBackupsCommand({ TableName: name }));
  const pitr = result.ContinuousBackupsDescription?.PointInTimeRecoveryDescription;
  return c.json({
    table: name,
    pointInTimeRecovery: {
      enabled: pitr?.PointInTimeRecoveryStatus === "ENABLED",
      status: pitr?.PointInTimeRecoveryStatus || "DISABLED",
    },
  });
});

router.put("/tables/:name/backups", async (c: Context) => {
  const name = c.req.param("name");
  const { pointInTimeRecovery } = await c.req.json<{ pointInTimeRecovery: boolean }>();
  await ddb().send(new UpdateContinuousBackupsCommand({
    TableName: name,
    PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: pointInTimeRecovery },
  }));
  return c.json({ table: name, pointInTimeRecovery, updated: true });
});

// ─── PartiQL ExecuteStatement ─────────────────────────────────────

router.post("/partiql/execute", async (c: Context) => {
  const { statement, parameters, consistentRead, nextToken } = await c.req.json<{
    statement: string;
    parameters?: any[];
    consistentRead?: boolean;
    nextToken?: string;
  }>();
  if (!statement) return c.json({ error: "Statement is required" }, 400);

  const params: any = { Statement: statement };
  if (parameters && parameters.length > 0) {
    params.Parameters = parameters.map((p) => marshall(p));
  }
  if (consistentRead !== undefined) params.ConsistentRead = consistentRead;
  if (nextToken) params.NextToken = nextToken;

  const result = await ddb().send(new ExecuteStatementCommand(params));
  const items = (result.Items || []).map((item) => unmarshall(item));
  return c.json({
    items,
    count: result.Items?.length || 0,
    nextToken: result.NextToken || null,
  });
});

// ─── PartiQL ExecuteTransaction ───────────────────────────────────

router.post("/partiql/transaction", async (c: Context) => {
  const { statements } = await c.req.json<{
    statements: Array<{ Statement: string; Parameters?: any[] }>;
  }>();
  if (!statements || !Array.isArray(statements) || statements.length === 0) {
    return c.json({ error: "Statements array is required and must not be empty" }, 400);
  }

  const transactStatements = statements.map((s) => ({
    Statement: s.Statement,
    ...(s.Parameters?.length ? { Parameters: s.Parameters.map((p) => marshall(p)) } : {}),
  }));

  const result = await ddb().send(new ExecuteTransactionCommand({
    TransactStatements: transactStatements,
  }));

  const responses = (result.Responses || []).map((r: any) =>
    r.Item ? { Item: unmarshall(r.Item) } : {}
  );
  return c.json({ responses, total: responses.length });
});

// ─── PartiQL BatchExecuteStatement ────────────────────────────────

router.post("/partiql/batch", async (c: Context) => {
  const { statements } = await c.req.json<{
    statements: Array<{ Statement: string; Parameters?: any[]; ConsistentRead?: boolean }>;
  }>();
  if (!statements || !Array.isArray(statements) || statements.length === 0) {
    return c.json({ error: "Statements array is required and must not be empty" }, 400);
  }

  const batchStatements = statements.map((s) => ({
    Statement: s.Statement,
    ...(s.Parameters?.length ? { Parameters: s.Parameters.map((p) => marshall(p)) } : {}),
    ...(s.ConsistentRead !== undefined ? { ConsistentRead: s.ConsistentRead } : {}),
  }));

  const result = await ddb().send(new BatchExecuteStatementCommand({
    Statements: batchStatements,
  }));

  const responses = (result.Responses || []).map((r: any) => ({
    tableName: r.TableName || null,
    item: r.Item ? unmarshall(r.Item) : null,
    error: r.Error
      ? { Code: r.Error.Code, Message: r.Error.Message }
      : null,
  }));

  return c.json({ responses, total: responses.length });
});

// ─── Exports ───────────────────────────────────────────────────────

router.get("/tables/:name/exports", async (c: Context) => {
  const name = c.req.param("name");
  const maxResults = parseInt(c.req.query("maxResults") || "25", 10);
  const nextToken = c.req.query("nextToken") || undefined;
  const arn = `arn:aws:dynamodb:${getAwsConfig().region}:${getAwsConfig().credentials.accessKeyId}:table/${name}`;

  const result = await ddb().send(new ListExportsCommand({
    TableArn: arn,
    MaxResults: Math.min(maxResults, 25),
    NextToken: nextToken,
  }));

  const exports = (result.ExportSummaries || []).map((e: any) => ({
    exportArn: e.ExportArn,
    exportStatus: e.ExportStatus,
    exportType: e.ExportType,
    startTime: e.StartTime?.toISOString() || null,
    endTime: e.EndTime?.toISOString() || null,
    itemCount: e.ItemCount,
    exportManifest: e.ExportManifest,
  }));

  return c.json({ exports, total: exports.length, nextToken: result.NextToken || null });
});

router.post("/tables/:name/exports", async (c: Context) => {
  const name = c.req.param("name");
  const { s3Bucket, s3Prefix, exportFormat, exportType, exportTime } = await c.req.json<{
    s3Bucket: string;
    s3Prefix?: string;
    exportFormat?: string;
    exportType?: string;
    exportTime?: string;
  }>();
  if (!s3Bucket) return c.json({ error: "s3Bucket is required" }, 400);

  const arn = `arn:aws:dynamodb:${getAwsConfig().region}:${getAwsConfig().credentials.accessKeyId}:table/${name}`;
  const params: any = {
    TableArn: arn,
    S3Bucket: s3Bucket,
    S3Prefix: s3Prefix || "",
    ExportFormat: exportFormat || "DYNAMODB_JSON",
  };
  if (exportType) params.ExportType = exportType;
  if (exportTime) params.ExportTime = new Date(exportTime);

  const result = await ddb().send(new ExportTableToPointInTimeCommand(params));
  const desc = result.ExportDescription;

  return c.json({
    exportArn: desc?.ExportArn,
    exportStatus: desc?.ExportStatus || "IN_PROGRESS",
    exportType: desc?.ExportType,
    startTime: desc?.StartTime?.toISOString() || null,
    s3Bucket: desc?.S3Bucket,
    s3Prefix: desc?.S3Prefix,
    exportManifest: desc?.ExportManifest,
    created: true,
  });
});

router.get("/exports", async (c: Context) => {
  const exportArn = c.req.query("arn");
  if (!exportArn) return c.json({ error: "arn query parameter is required" }, 400);

  const result = await ddb().send(new DescribeExportCommand({ ExportArn: exportArn }));
  const desc = result.ExportDescription;

  return c.json({
    exportArn: desc?.ExportArn,
    exportStatus: desc?.ExportStatus,
    exportType: desc?.ExportType,
    startTime: desc?.StartTime?.toISOString() || null,
    endTime: desc?.EndTime?.toISOString() || null,
    itemCount: desc?.ItemCount,
    s3Bucket: desc?.S3Bucket,
    s3Prefix: desc?.S3Prefix,
    exportManifest: desc?.ExportManifest,
    tableArn: desc?.TableArn,
    failureCode: desc?.FailureCode,
    failureMessage: desc?.FailureMessage,
  });
});

export default router;
