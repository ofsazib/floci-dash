import { Hono } from "hono";
import type { Context } from "hono";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  CreateLogGroupCommand,
  DeleteLogGroupCommand,
  PutRetentionPolicyCommand,
  DeleteRetentionPolicyCommand,
  DescribeLogStreamsCommand,
  CreateLogStreamCommand,
  DeleteLogStreamCommand,
  GetLogEventsCommand,
  PutLogEventsCommand,
  FilterLogEventsCommand,
  PutSubscriptionFilterCommand,
  DescribeSubscriptionFiltersCommand,
  DeleteSubscriptionFilterCommand,
  TagLogGroupCommand,
  UntagLogGroupCommand,
  ListTagsLogGroupCommand,
  GetDataProtectionPolicyCommand,
  AssociateKmsKeyCommand,
  DisassociateKmsKeyCommand,
  PutLogGroupDeletionProtectionCommand,
  PutAccountPolicyCommand,
  DescribeAccountPoliciesCommand,
  PutResourcePolicyCommand,
  DescribeResourcePoliciesCommand,
  PutDestinationCommand,
  PutDestinationPolicyCommand,
  PutMetricFilterCommand,
  DescribeMetricFiltersCommand,
  DeleteMetricFilterCommand,
  TestMetricFilterCommand,
  StartQueryCommand,
  StopQueryCommand,
  GetQueryResultsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { getAwsConfig } from "../../clients/aws";

const router = new Hono();

const LOGS_PAGE_SIZE = 10;
const LOGS_MAX_PAGE = 50;
const OFFSET_PREFIX = "offset:";

function logs(): CloudWatchLogsClient {
  return new CloudWatchLogsClient(getAwsConfig());
}

function parsePageLimit(raw: string | undefined): number {
  if (raw == null || raw === "") return LOGS_PAGE_SIZE;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return LOGS_PAGE_SIZE;
  return Math.min(n, LOGS_MAX_PAGE);
}

function pageLocally<T>(
  items: T[],
  limit: number,
  token: string | undefined
): { page: T[]; nextToken?: string; total: number } | null {
  if (token && !token.startsWith(OFFSET_PREFIX)) return null;
  const offset = token ? Number.parseInt(token.slice(OFFSET_PREFIX.length), 10) : 0;
  const start = Number.isFinite(offset) && offset >= 0 ? offset : 0;
  const page = items.slice(start, start + limit);
  const nextToken = start + limit < items.length ? `${OFFSET_PREFIX}${start + limit}` : undefined;
  return { page, nextToken, total: items.length };
}

function matchesQuery(name: string | undefined, q: string | undefined): boolean {
  if (!q) return true;
  return (name ?? "").toLowerCase().includes(q);
}

async function storedBytesFromStreams(
  client: CloudWatchLogsClient,
  logGroupName: string
): Promise<number> {
  let nextToken: string | undefined;
  let total = 0;
  do {
    const result = await client.send(
      new DescribeLogStreamsCommand({
        logGroupName,
        limit: LOGS_MAX_PAGE,
        nextToken,
      })
    );
    for (const stream of result.logStreams || []) {
      total += stream.storedBytes ?? 0;
    }
    nextToken = result.nextToken;
  } while (nextToken);
  return total;
}

// ──────────────────────────────────────────────
//  Log Groups
// ──────────────────────────────────────────────

router.get("/log-groups", async (c: Context) => {
  const prefix = c.req.query("prefix");
  const limit = parsePageLimit(c.req.query("limit"));
  const token = c.req.query("nextToken") || undefined;
  const q = c.req.query("q")?.trim().toLowerCase() || undefined;
  const client = logs();
  const result = await client.send(
    new DescribeLogGroupsCommand({
      logGroupNamePrefix: prefix || undefined,
      limit,
      nextToken: token && !token.startsWith(OFFSET_PREFIX) ? token : undefined,
    })
  );
  // Floci ignores limit/nextToken and returns the full list. Filter, then page,
  // so stored-bytes summing only runs for the visible matches.
  const raw = (result.logGroups || []).filter((g) => matchesQuery(g.logGroupName, q));
  const local = !result.nextToken ? pageLocally(raw, limit, token) : null;
  const page = local?.page ?? raw;
  const nextToken = local ? local.nextToken : result.nextToken;
  const total = local ? local.total : page.length;
  // Floci's DescribeLogGroups always reports storedBytes: 0; streams carry the real size.
  const groups = await Promise.all(
    page.map(async (g) => {
      let storedBytes = g.storedBytes ?? 0;
      if (storedBytes === 0 && g.logGroupName) {
        try {
          storedBytes = await storedBytesFromStreams(client, g.logGroupName);
        } catch {
          storedBytes = 0;
        }
      }
      return {
        logGroupName: g.logGroupName,
        creationTime: g.creationTime,
        retentionInDays: g.retentionInDays,
        metricFilterCount: g.metricFilterCount,
        arn: g.arn,
        storedBytes,
        kmsKeyId: g.kmsKeyId,
      };
    })
  );
  return c.json({ logGroups: groups, total, nextToken });
});

router.post("/log-groups", async (c: Context) => {
  const body = await c.req.json<{
    logGroupName: string;
    tags?: Record<string, string>;
    kmsKeyId?: string;
  }>();
  if (!body.logGroupName) {
    return c.json({ error: "logGroupName is required" }, 400);
  }
  const params: any = { logGroupName: body.logGroupName };
  if (body.tags) params.tags = body.tags;
  if (body.kmsKeyId) params.kmsKeyId = body.kmsKeyId;
  await logs().send(new CreateLogGroupCommand(params));
  return c.json({ logGroupName: body.logGroupName, created: true }, 201);
});

router.delete("/log-groups/:name", async (c: Context) => {
  const name = c.req.param("name");
  await logs().send(new DeleteLogGroupCommand({ logGroupName: name }));
  return c.json({ logGroupName: name, deleted: true });
});

router.put("/log-groups/:name/retention", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ retentionInDays: number }>();
  if (!body.retentionInDays) {
    return c.json({ error: "retentionInDays is required" }, 400);
  }
  await logs().send(
    new PutRetentionPolicyCommand({
      logGroupName: name,
      retentionInDays: body.retentionInDays,
    })
  );
  return c.json({ logGroupName: name, retentionInDays: body.retentionInDays, updated: true });
});

router.delete("/log-groups/:name/retention", async (c: Context) => {
  const name = c.req.param("name");
  await logs().send(new DeleteRetentionPolicyCommand({ logGroupName: name }));
  return c.json({ logGroupName: name, retentionRemoved: true });
});

// ──────────────────────────────────────────────
//  Log Streams
// ──────────────────────────────────────────────

router.get("/log-groups/:name/streams", async (c: Context) => {
  const name = c.req.param("name");
  const prefix = c.req.query("prefix");
  const limit = parsePageLimit(c.req.query("limit"));
  const token = c.req.query("nextToken") || undefined;
  const q = c.req.query("q")?.trim().toLowerCase() || undefined;
  const result = await logs().send(
    new DescribeLogStreamsCommand({
      logGroupName: name,
      logStreamNamePrefix: prefix || undefined,
      orderBy: prefix ? undefined : "LastEventTime",
      descending: prefix ? undefined : true,
      limit,
      nextToken: token && !token.startsWith(OFFSET_PREFIX) ? token : undefined,
    })
  );
  const raw = (result.logStreams || []).filter((s) => matchesQuery(s.logStreamName, q));
  const local = !result.nextToken ? pageLocally(raw, limit, token) : null;
  const page = local?.page ?? raw;
  const streams = page.map((s) => ({
    logStreamName: s.logStreamName,
    creationTime: s.creationTime,
    firstEventTimestamp: s.firstEventTimestamp,
    lastEventTimestamp: s.lastEventTimestamp,
    lastIngestionTime: s.lastIngestionTime,
    uploadSequenceToken: s.uploadSequenceToken,
    storedBytes: s.storedBytes,
  }));
  return c.json({
    logStreams: streams,
    total: local ? local.total : streams.length,
    nextToken: local ? local.nextToken : result.nextToken,
  });
});

router.post("/log-groups/:name/streams", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ logStreamName: string }>();
  if (!body.logStreamName) {
    return c.json({ error: "logStreamName is required" }, 400);
  }
  await logs().send(
    new CreateLogStreamCommand({
      logGroupName: name,
      logStreamName: body.logStreamName,
    })
  );
  return c.json({ logGroupName: name, logStreamName: body.logStreamName, created: true }, 201);
});

router.delete("/log-groups/:name/streams/:stream", async (c: Context) => {
  const name = c.req.param("name");
  const stream = c.req.param("stream");
  await logs().send(
    new DeleteLogStreamCommand({
      logGroupName: name,
      logStreamName: stream,
    })
  );
  return c.json({ logGroupName: name, logStreamName: stream, deleted: true });
});

// ──────────────────────────────────────────────
//  Log Events
// ──────────────────────────────────────────────

router.get("/log-groups/:name/streams/:stream/events", async (c: Context) => {
  const name = c.req.param("name");
  const stream = c.req.param("stream");
  const startTime = c.req.query("startTime");
  const endTime = c.req.query("endTime");
  const limit = c.req.query("limit");
  const startFromHead = c.req.query("startFromHead");
  const nextToken = c.req.query("nextToken");

  const params: any = {
    logGroupName: name,
    logStreamName: stream,
  };
  if (startTime) params.startTime = parseInt(startTime);
  if (endTime) params.endTime = parseInt(endTime);
  if (limit) params.limit = parseInt(limit);
  if (nextToken) params.nextToken = nextToken;
  if (startFromHead !== undefined) params.startFromHead = startFromHead === "true";

  const result = await logs().send(new GetLogEventsCommand(params));
  const events = (result.events || []).map((e) => ({
    eventId: (e as any).eventId,
    timestamp: e.timestamp,
    message: e.message,
    ingestionTime: e.ingestionTime,
  }));
  return c.json({
    events,
    nextForwardToken: result.nextForwardToken,
    nextBackwardToken: result.nextBackwardToken,
  });
});

router.post("/log-groups/:name/streams/:stream/events", async (c: Context) => {
  const name = c.req.param("name");
  const stream = c.req.param("stream");
  const body = await c.req.json<{
    logEvents: Array<{ timestamp: number; message: string }>;
    sequenceToken?: string;
  }>();
  if (!body.logEvents || body.logEvents.length === 0) {
    return c.json({ error: "logEvents array is required" }, 400);
  }
  const params: any = {
    logGroupName: name,
    logStreamName: stream,
    logEvents: body.logEvents,
  };
  if (body.sequenceToken) params.sequenceToken = body.sequenceToken;
  const result = await logs().send(new PutLogEventsCommand(params));
  return c.json({
    nextSequenceToken: result.nextSequenceToken,
    rejectedLogEventsInfo: result.rejectedLogEventsInfo,
  });
});

// ──────────────────────────────────────────────
//  Filter Log Events (across streams)
// ──────────────────────────────────────────────

router.post("/log-groups/:name/filter-events", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{
    filterPattern?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
    logStreamNames?: string[];
  }>();
  const params: any = { logGroupName: name };
  if (body.filterPattern) params.filterPattern = body.filterPattern;
  if (body.startTime) params.startTime = body.startTime;
  if (body.endTime) params.endTime = body.endTime;
  if (body.limit) params.limit = body.limit;
  if (body.logStreamNames) params.logStreamNames = body.logStreamNames;
  const result = await logs().send(new FilterLogEventsCommand(params));
  const events = (result.events || []).map((e) => ({
    eventId: (e as any).eventId,
    timestamp: e.timestamp,
    message: e.message,
    ingestionTime: e.ingestionTime,
    logStreamName: e.logStreamName,
  }));
  return c.json({
    events,
    searchedLogStreams: result.searchedLogStreams,
    nextToken: result.nextToken,
  });
});

// ──────────────────────────────────────────────
//  Subscription Filters
// ──────────────────────────────────────────────

router.get("/log-groups/:name/subscription-filters", async (c: Context) => {
  const name = c.req.param("name");
  const result = await logs().send(
    new DescribeSubscriptionFiltersCommand({
      logGroupName: name,
    })
  );
  const filters = (result.subscriptionFilters || []).map((f) => ({
    filterName: f.filterName,
    logGroupName: f.logGroupName,
    filterPattern: f.filterPattern,
    destinationArn: f.destinationArn,
    distribution: f.distribution,
    creationTime: f.creationTime,
    roleArn: f.roleArn,
  }));
  return c.json({ subscriptionFilters: filters, total: filters.length });
});

router.post("/log-groups/:name/subscription-filters", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{
    filterName: string;
    filterPattern?: string;
    destinationArn: string;
    distribution?: string;
    roleArn?: string;
  }>();
  if (!body.filterName || !body.destinationArn) {
    return c.json({ error: "filterName and destinationArn are required" }, 400);
  }
  await logs().send(
    new PutSubscriptionFilterCommand({
      logGroupName: name,
      filterName: body.filterName,
      filterPattern: body.filterPattern || "",
      destinationArn: body.destinationArn,
      distribution: body.distribution as "Random" | "ByLogStream" | undefined,
      roleArn: body.roleArn,
    })
  );
  return c.json({ filterName: body.filterName, logGroupName: name, created: true }, 201);
});

router.delete("/log-groups/:name/subscription-filters/:filterName", async (c: Context) => {
  const name = c.req.param("name");
  const filterName = c.req.param("filterName");
  await logs().send(
    new DeleteSubscriptionFilterCommand({
      logGroupName: name,
      filterName,
    })
  );
  return c.json({ filterName, logGroupName: name, deleted: true });
});

// ──────────────────────────────────────────────
//  Tags
// ──────────────────────────────────────────────

router.get("/log-groups/:name/tags", async (c: Context) => {
  const name = c.req.param("name");
  const result = await logs().send(
    new ListTagsLogGroupCommand({ logGroupName: name })
  );
  return c.json({ tags: result.tags || {} });
});

router.post("/log-groups/:name/tags", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ tags: Record<string, string> }>();
  if (!body.tags) return c.json({ error: "tags object is required" }, 400);
  await logs().send(
    new TagLogGroupCommand({ logGroupName: name, tags: body.tags })
  );
  return c.json({ logGroupName: name, tags: body.tags, updated: true });
});

router.delete("/log-groups/:name/tags", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ tags: string[] }>();
  if (!body.tags || body.tags.length === 0) {
    return c.json({ error: "tags array is required" }, 400);
  }
  await logs().send(
    new UntagLogGroupCommand({ logGroupName: name, tags: body.tags })
  );
  return c.json({ logGroupName: name, removedTags: body.tags, updated: true });
});

// ── Data Protection Policy ───────────────────────────────

router.get("/log-groups/:name/data-protection", async (c: Context) => {
  const name = c.req.param("name");
  const result = await logs().send(
    new GetDataProtectionPolicyCommand({ logGroupIdentifier: name })
  );
  return c.json({ logGroupIdentifier: result.logGroupIdentifier, policyDocument: result.policyDocument });
});

// ──────────────────────────────────────────────
//  KMS Key Association
// ──────────────────────────────────────────────

router.post("/log-groups/kms", async (c: Context) => {
  const body = await c.req.json<{
    logGroupName?: string;
    resourceIdentifier?: string;
    kmsKeyId?: string;
  }>();
  if (!body.kmsKeyId) {
    return c.json({ error: "kmsKeyId is required" }, 400);
  }
  if (!!body.logGroupName === !!body.resourceIdentifier) {
    return c.json(
      { error: "Exactly one of logGroupName or resourceIdentifier is required" },
      400
    );
  }
  await logs().send(
    new AssociateKmsKeyCommand({
      logGroupName: body.logGroupName,
      resourceIdentifier: body.resourceIdentifier,
      kmsKeyId: body.kmsKeyId,
    } as any)
  );
  return c.json({
    target: body.logGroupName || body.resourceIdentifier,
    kmsKeyId: body.kmsKeyId,
    associated: true,
  });
});

router.post("/log-groups/kms/disassociate", async (c: Context) => {
  const body = await c.req.json<{ logGroupName?: string; resourceIdentifier?: string }>();
  if (!!body.logGroupName === !!body.resourceIdentifier) {
    return c.json(
      { error: "Exactly one of logGroupName or resourceIdentifier is required" },
      400
    );
  }
  await logs().send(
    new DisassociateKmsKeyCommand({
      logGroupName: body.logGroupName,
      resourceIdentifier: body.resourceIdentifier,
    } as any)
  );
  return c.json({
    target: body.logGroupName || body.resourceIdentifier,
    disassociated: true,
  });
});

// ──────────────────────────────────────────────
//  Deletion Protection
// ──────────────────────────────────────────────

router.put("/log-groups/:name/deletion-protection", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ deletionProtectionEnabled?: boolean }>();
  if (typeof body.deletionProtectionEnabled !== "boolean") {
    return c.json({ error: "deletionProtectionEnabled boolean is required" }, 400);
  }
  await logs().send(
    new PutLogGroupDeletionProtectionCommand({
      logGroupIdentifier: name,
      deletionProtectionEnabled: body.deletionProtectionEnabled,
    })
  );
  return c.json({
    logGroupIdentifier: name,
    deletionProtectionEnabled: body.deletionProtectionEnabled,
    updated: true,
  });
});

// ──────────────────────────────────────────────
//  Account Policies
// ──────────────────────────────────────────────

router.get("/account-policies", async (c: Context) => {
  const policyType = c.req.query("policyType") || undefined;
  const policyName = c.req.query("policyName") || undefined;
  const result = await logs().send(
    new DescribeAccountPoliciesCommand({ policyType: policyType as any, policyName })
  );
  const accountPolicies = (result.accountPolicies || []).map((p: any) => ({
    accountId: p.accountId,
    policyName: p.policyName,
    policyDocument: p.policyDocument,
    policyType: p.policyType,
    scope: p.scope,
    selectionCriteria: p.selectionCriteria,
    lastUpdatedTime: p.lastUpdatedTime,
  }));
  return c.json({ accountPolicies, total: accountPolicies.length });
});

router.post("/account-policies", async (c: Context) => {
  const body = await c.req.json<{
    policyName?: string;
    policyDocument?: string;
    policyType?: string;
    scope?: string;
    selectionCriteria?: string;
  }>();
  if (!body.policyName || !body.policyDocument || !body.policyType) {
    return c.json({ error: "policyName, policyDocument and policyType are required" }, 400);
  }
  const result = await logs().send(
    new PutAccountPolicyCommand({
      policyName: body.policyName,
      policyDocument: body.policyDocument,
      policyType: body.policyType as any,
      scope: body.scope as any,
      selectionCriteria: body.selectionCriteria,
    })
  );
  return c.json({ accountPolicy: result.accountPolicy, created: true }, 201);
});

// ──────────────────────────────────────────────
//  Resource Policies
// ──────────────────────────────────────────────

router.get("/resource-policies", async (c: Context) => {
  const result = await logs().send(new DescribeResourcePoliciesCommand({}));
  const resourcePolicies = (result.resourcePolicies || []).map((p: any) => ({
    policyName: p.policyName,
    policyDocument: p.policyDocument,
    lastUpdatedTime: p.lastUpdatedTime,
  }));
  return c.json({ resourcePolicies, total: resourcePolicies.length });
});

router.post("/resource-policies", async (c: Context) => {
  const body = await c.req.json<{ policyName?: string; policyDocument?: string }>();
  if (!body.policyName || !body.policyDocument) {
    return c.json({ error: "policyName and policyDocument are required" }, 400);
  }
  const result = await logs().send(
    new PutResourcePolicyCommand({
      policyName: body.policyName,
      policyDocument: body.policyDocument,
    })
  );
  return c.json({ resourcePolicy: result.resourcePolicy, created: true }, 201);
});

// ──────────────────────────────────────────────
//  Destinations (cross-account subscription targets)
// ──────────────────────────────────────────────

router.post("/destinations", async (c: Context) => {
  const body = await c.req.json<{
    destinationName?: string;
    targetArn?: string;
    roleArn?: string;
  }>();
  if (!body.destinationName || !body.targetArn) {
    return c.json({ error: "destinationName and targetArn are required" }, 400);
  }
  const result = await logs().send(
    new PutDestinationCommand({
      destinationName: body.destinationName,
      targetArn: body.targetArn,
      roleArn: body.roleArn,
    })
  );
  return c.json({ destination: result.destination, created: true }, 201);
});

router.post("/destinations/:name/policy", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ accessPolicy?: string }>();
  if (!body.accessPolicy) {
    return c.json({ error: "accessPolicy is required" }, 400);
  }
  await logs().send(
    new PutDestinationPolicyCommand({
      destinationName: name,
      accessPolicy: body.accessPolicy,
    })
  );
  return c.json({ destinationName: name, accessPolicy: body.accessPolicy, updated: true });
});

// ──────────────────────────────────────────────
//  Metric Filters
// ──────────────────────────────────────────────

router.get("/log-groups/:name/metric-filters", async (c: Context) => {
  const name = c.req.param("name");
  const prefix = c.req.query("prefix");
  const metricName = c.req.query("metricName");
  const metricNamespace = c.req.query("metricNamespace");
  const limit = c.req.query("limit");
  const nextToken = c.req.query("nextToken") || undefined;
  // Floci requires metricName and metricNamespace together or not at all.
  const metricSelector =
    metricName && metricNamespace ? { metricName, metricNamespace } : {};
  const result = await logs().send(
    new DescribeMetricFiltersCommand({
      logGroupName: name,
      filterNamePrefix: prefix || undefined,
      ...metricSelector,
      limit: limit ? parseInt(limit) : undefined,
      nextToken,
    } as any)
  );
  const metricFilters = (result.metricFilters || []).map((f: any) => ({
    filterName: f.filterName,
    filterPattern: f.filterPattern,
    logGroupName: f.logGroupName,
    creationTime: f.creationTime,
    applyOnTransformedLogs: f.applyOnTransformedLogs,
    metricTransformations: (f.metricTransformations || []).map((t: any) => ({
      metricName: t.metricName,
      metricNamespace: t.metricNamespace,
      metricValue: t.metricValue,
      defaultValue: t.defaultValue,
      dimensions: t.dimensions,
      unit: t.unit,
    })),
  }));
  return c.json({ metricFilters, total: metricFilters.length, nextToken: result.nextToken });
});

router.post("/log-groups/:name/metric-filters", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{
    filterName?: string;
    filterPattern?: string;
    metricTransformations?: Array<{
      metricName: string;
      metricNamespace: string;
      metricValue: string;
      defaultValue?: number;
      dimensions?: Record<string, string>;
      unit?: string;
    }>;
    applyOnTransformedLogs?: boolean;
  }>();
  if (!body.filterName || !body.metricTransformations?.length) {
    return c.json({ error: "filterName and at least one metricTransformations entry are required" }, 400);
  }
  await logs().send(
    new PutMetricFilterCommand({
      logGroupName: name,
      filterName: body.filterName,
      filterPattern: body.filterPattern || "",
      metricTransformations: body.metricTransformations.map((t) => ({
        metricName: t.metricName,
        metricNamespace: t.metricNamespace,
        metricValue: t.metricValue,
        defaultValue: t.defaultValue,
        dimensions: t.dimensions,
        unit: t.unit,
      })) as any,
      applyOnTransformedLogs: body.applyOnTransformedLogs,
    })
  );
  return c.json({ filterName: body.filterName, logGroupName: name, created: true }, 201);
});

router.delete("/log-groups/:name/metric-filters/:filterName", async (c: Context) => {
  const name = c.req.param("name");
  const filterName = c.req.param("filterName");
  await logs().send(
    new DeleteMetricFilterCommand({
      logGroupName: name,
      filterName,
    })
  );
  return c.json({ filterName, logGroupName: name, deleted: true });
});

router.post("/metric-filters/test", async (c: Context) => {
  const body = await c.req.json<{
    filterPattern?: string;
    logEventMessages?: string[];
  }>();
  if (!Array.isArray(body.logEventMessages)) {
    return c.json({ error: "logEventMessages array is required" }, 400);
  }
  const result = await logs().send(
    new TestMetricFilterCommand({
      filterPattern: body.filterPattern || "",
      logEventMessages: body.logEventMessages,
    })
  );
  const matches = (result.matches || []).map((m: any) => ({
    eventNumber: m.eventNumber,
    eventMessage: m.eventMessage,
    extractedValues: m.extractedValues || {},
  }));
  return c.json({ matches, total: matches.length });
});

// ──────────────────────────────────────────────
//  Logs Insights Queries
// ──────────────────────────────────────────────

router.post("/queries", async (c: Context) => {
  const body = await c.req.json<{
    logGroupName?: string;
    logGroupNames?: string[];
    logGroupIdentifiers?: string[];
    startTime?: number;
    endTime?: number;
    queryString?: string;
    limit?: number;
  }>();
  if (!body.queryString || !body.startTime || !body.endTime) {
    return c.json({ error: "queryString, startTime and endTime are required" }, 400);
  }
  if (!!body.logGroupName === !!(body.logGroupNames?.length || body.logGroupIdentifiers?.length)) {
    return c.json(
      { error: "Exactly one of logGroupName, logGroupNames or logGroupIdentifiers may be specified" },
      400
    );
  }
  const result = await logs().send(
    new StartQueryCommand({
      logGroupName: body.logGroupName,
      logGroupNames: body.logGroupNames,
      logGroupIdentifiers: body.logGroupIdentifiers,
      startTime: body.startTime,
      endTime: body.endTime,
      queryString: body.queryString,
      limit: body.limit,
    } as any)
  );
  return c.json({ queryId: result.queryId }, 201);
});

router.post("/queries/:id/stop", async (c: Context) => {
  const id = c.req.param("id");
  const result = await logs().send(new StopQueryCommand({ queryId: id }));
  return c.json({ queryId: id, success: result.success ?? true });
});

router.get("/queries/:id", async (c: Context) => {
  const id = c.req.param("id");
  const result = await logs().send(new GetQueryResultsCommand({ queryId: id }));
  const results = (result.results || []).map((row: any[]) =>
    (row || []).map((f: any) => ({ field: f.field, value: f.value }))
  );
  return c.json({
    queryId: id,
    status: result.status,
    results,
    statistics: {
      recordsMatched: result.statistics?.recordsMatched ?? 0,
      recordsScanned: result.statistics?.recordsScanned ?? 0,
      bytesScanned: result.statistics?.bytesScanned ?? 0,
    },
  });
});

export default router;
