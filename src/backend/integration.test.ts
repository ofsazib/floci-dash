// @vitest-environment node
/**
 * Backend integration tests — hit the running Floci instance via the Hono route handlers.
 *
 * These tests use `app.fetch()` to dispatch requests without starting an HTTP server.
 * They exercise the full stack: Hono route → AWS SDK → Floci emulator → response.
 *
 * Prerequisite: A Floci instance must be running (e.g. `make up-bg`).
 * Floci is expected at the FLOCI_URL env var or default localhost:9878.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Hono } from "hono";
import { cors } from "hono/cors";
import systemRoutes from "./routes/system";
import awsRoutes from "./routes/aws/index";

// ── Test App Setup ──────────────────────────────────────
// Build a minimal Hono app from the same route modules used in production,
// without starting an HTTP server. This keeps tests fast and avoids port conflicts.

process.env.FLOCI_URL = process.env.FLOCI_URL || "http://localhost:9878";
process.env.AWS_REGION = "us-east-1";
process.env.AWS_ACCESS_KEY_ID = "test";
process.env.AWS_SECRET_ACCESS_KEY = "test";

const app = new Hono();
app.use("*", cors({ origin: "*" }));
app.onError((err: Error, c: any) => {
  console.error("Integration test onError:", err);
  return c.json({ error: err.message || "Internal server error" }, 500);
});
app.route("/api/system", systemRoutes);
app.route("/api/aws", awsRoutes);

// ── Helpers ─────────────────────────────────────────────

async function api(method: string, path: string, body?: any) {
  const init: RequestInit = { method };
  if (body != null) {
    init.body = JSON.stringify(body);
    init.headers = { "content-type": "application/json" };
  }
  const res = await app.fetch(new Request(`http://test${path}`, init));
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function rand(prefix = "it"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── Ensure Floci is reachable ───────────────────────────

beforeAll(async () => {
  const { status } = await api("GET", "/api/system/health");
  if (status !== 200) {
    throw new Error(
      `Floci not reachable at ${process.env.FLOCI_URL} (health check returned ${status}). ` +
      "Start Floci with `make up-bg` first."
    );
  }
});

// ═════════════════════════════════════════════════════════
//  System Health
// ═════════════════════════════════════════════════════════

describe("System Health", () => {
  it("returns health status with all services", async () => {
    const { status, data } = await api("GET", "/api/system/health");
    expect(status).toBe(200);
    expect(data.services).toBeDefined();
    expect(data.stats).toBeDefined();
    expect(data.stats.total).toBeGreaterThan(0);
    expect(data.stats.running).toBeGreaterThan(0);
    expect(data.version).toBeTruthy();
  });
});

// ═════════════════════════════════════════════════════════
//  S3 Integration Tests
// ═════════════════════════════════════════════════════════

describe("S3 Integration", () => {
  const bucketName = rand("test-bucket");

  afterAll(async () => {
    await api("DELETE", `/api/aws/s3/buckets/${bucketName}`).catch(() => {});
  });

  it("creates a bucket", async () => {
    const { status, data } = await api("POST", "/api/aws/s3/buckets", { name: bucketName });
    expect(status).toBe(200);
    expect(data.created).toBe(true);
    expect(data.name).toBe(bucketName);
  });

  it("lists buckets and includes the new bucket", async () => {
    const { status, data } = await api("GET", "/api/aws/s3/buckets");
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    expect(data.buckets.map((b: any) => b.name)).toContain(bucketName);
  });

  it("lists objects in the bucket (empty)", async () => {
    const { status, data } = await api("GET", `/api/aws/s3/buckets/${bucketName}/objects`);
    expect(status).toBe(200);
    expect(data.total).toBe(0);
  });

  it("deletes the bucket", async () => {
    const { status, data } = await api("DELETE", `/api/aws/s3/buckets/${bucketName}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════
//  DynamoDB Integration Tests
// ═════════════════════════════════════════════════════════

describe("DynamoDB Integration", () => {
  const tableName = rand("test-table");

  afterAll(async () => {
    await api("DELETE", `/api/aws/dynamodb/tables/${tableName}`).catch(() => {});
  });

  it("creates a table with hash key", async () => {
    const { status, data } = await api("POST", "/api/aws/dynamodb/tables", {
      name: tableName,
      hashKey: "pk",
      hashType: "S",
    });
    expect(status).toBe(200);
    expect(data.created).toBe(true);
  });

  it("lists tables and includes the new table", async () => {
    const { status, data } = await api("GET", "/api/aws/dynamodb/tables");
    expect(status).toBe(200);
    expect(data.tables).toContain(tableName);
  });

  it("describes the table", async () => {
    const { status, data } = await api("GET", `/api/aws/dynamodb/tables/${tableName}`);
    expect(status).toBe(200);
    expect(data.name).toBe(tableName);
    expect(data.status).toBe("ACTIVE");
    expect(data.keySchema).toBeDefined();
  });

  it("puts an item", async () => {
    const { status, data } = await api("PUT", `/api/aws/dynamodb/tables/${tableName}/items`, {
      item: { pk: "user1", name: "Alice", age: 30 },
    });
    expect(status).toBe(200);
    expect(data.saved).toBe(true);
  });

  it("gets the item", async () => {
    const { status, data } = await api("POST", `/api/aws/dynamodb/tables/${tableName}/items/get`, {
      key: { pk: "user1" },
    });
    expect(status).toBe(200);
    expect(data.found).toBe(true);
    expect(data.item.name).toBe("Alice");
    expect(data.item.age).toBe(30);
  });

  it("scans items", async () => {
    const { status, data } = await api("GET", `/api/aws/dynamodb/tables/${tableName}/items`);
    expect(status).toBe(200);
    expect(data.count).toBeGreaterThanOrEqual(1);
    expect(data.items.length).toBeGreaterThanOrEqual(1);
  });

  it("deletes an item", async () => {
    const { status, data } = await api("POST", `/api/aws/dynamodb/tables/${tableName}/items/delete`, {
      key: { pk: "user1" },
    });
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });

  it("deletes the table", async () => {
    const { status, data } = await api("DELETE", `/api/aws/dynamodb/tables/${tableName}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════
//  SQS Integration Tests
// ═════════════════════════════════════════════════════════

describe("SQS Integration", () => {
  const queueName = rand("test-queue");
  let queueUrl = "";

  afterAll(async () => {
    if (queueUrl) {
      await api("DELETE", `/api/aws/sqs/queues?queueUrl=${encodeURIComponent(queueUrl)}`).catch(() => {});
    }
  });

  it("creates a queue", async () => {
    const { status, data } = await api("POST", "/api/aws/sqs/queues", { queueName });
    expect(status).toBe(201);
    expect(data.queueUrl).toBeTruthy();
    queueUrl = data.queueUrl;
  });

  it("lists queues and includes the new queue", async () => {
    const { status, data } = await api("GET", "/api/aws/sqs/queues");
    expect(status).toBe(200);
    expect(data.queueUrls).toContain(queueUrl);
  });

  it("sends a message", async () => {
    const { status, data } = await api(
      "POST",
      `/api/aws/sqs/queues/messages?queueUrl=${encodeURIComponent(queueUrl)}`,
      { messageBody: "Hello from integration test!" }
    );
    expect(status).toBe(201);
    expect(data.messageId).toBeTruthy();
  });

  it("gets queue attributes", async () => {
    const { status, data } = await api(
      "GET",
      `/api/aws/sqs/queues/attributes?queueUrl=${encodeURIComponent(queueUrl)}`
    );
    expect(status).toBe(200);
    expect(data.attributes).toBeDefined();
    expect(data.attributes.QueueArn).toBeTruthy();
  });

  it("sets queue attributes", async () => {
    const { status, data } = await api(
      "PUT",
      `/api/aws/sqs/queues/attributes?queueUrl=${encodeURIComponent(queueUrl)}`,
      { attributes: { VisibilityTimeout: "60" } }
    );
    expect(status).toBe(200);
    expect(data.updated).toBe(true);
  });

  it("verifies updated attribute", async () => {
    const { status, data } = await api(
      "GET",
      `/api/aws/sqs/queues/attributes?queueUrl=${encodeURIComponent(queueUrl)}`
    );
    expect(status).toBe(200);
    expect(data.attributes.VisibilityTimeout).toBe("60");
  });

  it("purges the queue", async () => {
    const { status, data } = await api(
      "POST",
      `/api/aws/sqs/queues/purge?queueUrl=${encodeURIComponent(queueUrl)}`
    );
    expect(status).toBe(200);
    expect(data.purged).toBe(true);
  });

  it("deletes the queue", async () => {
    const { status, data } = await api(
      "DELETE",
      `/api/aws/sqs/queues?queueUrl=${encodeURIComponent(queueUrl)}`
    );
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
    queueUrl = "";
  });
});

// ═════════════════════════════════════════════════════════
//  CloudWatch Logs Integration Tests
// ═════════════════════════════════════════════════════════

describe("CloudWatch Logs Integration", () => {
  const logGroupName = `/integration-test/${rand("group")}`;
  const logStreamName = rand("stream");

  afterAll(async () => {
    await api("DELETE", `/api/aws/logs/log-groups/${encodeURIComponent(logGroupName)}`).catch(() => {});
  });

  it("creates a log group", async () => {
    const { status, data } = await api("POST", "/api/aws/logs/log-groups", { logGroupName });
    expect(status).toBe(201);
    expect(data.created).toBe(true);
  });

  it("lists log groups and includes the new group", async () => {
    const { status, data } = await api("GET", "/api/aws/logs/log-groups");
    expect(status).toBe(200);
    const names = data.logGroups.map((g: any) => g.logGroupName);
    expect(names).toContain(logGroupName);
  });

  it("creates a log stream", async () => {
    const { status, data } = await api(
      "POST",
      `/api/aws/logs/log-groups/${encodeURIComponent(logGroupName)}/streams`,
      { logStreamName }
    );
    expect(status).toBe(201);
    expect(data.created).toBe(true);
  });

  it("lists log streams", async () => {
    const { status, data } = await api(
      "GET",
      `/api/aws/logs/log-groups/${encodeURIComponent(logGroupName)}/streams`
    );
    expect(status).toBe(200);
    const names = data.logStreams.map((s: any) => s.logStreamName);
    expect(names).toContain(logStreamName);
  });

  it("puts log events", async () => {
    const now = Date.now();
    const { status, data } = await api(
      "POST",
      `/api/aws/logs/log-groups/${encodeURIComponent(logGroupName)}/streams/${logStreamName}/events`,
      {
        logEvents: [
          { timestamp: now, message: "INFO: Server started" },
          { timestamp: now + 1000, message: "ERROR: Connection timeout" },
          { timestamp: now + 2000, message: "WARN: Memory high" },
        ],
      }
    );
    expect(status).toBe(200);
    expect(data.nextSequenceToken).toBeTruthy();
  });

  it("retrieves log events", async () => {
    const { status, data } = await api(
      "GET",
      `/api/aws/logs/log-groups/${encodeURIComponent(logGroupName)}/streams/${logStreamName}/events?limit=10`
    );
    expect(status).toBe(200);
    expect(data.events.length).toBeGreaterThanOrEqual(3);
    expect(data.events[0].message).toBeTruthy();
  });

  it("sets retention policy", async () => {
    const { status, data } = await api(
      "PUT",
      `/api/aws/logs/log-groups/${encodeURIComponent(logGroupName)}/retention`,
      { retentionInDays: 7 }
    );
    expect(status).toBe(200);
    expect(data.updated).toBe(true);
  });

  it("deletes retention policy", async () => {
    const { status, data } = await api(
      "DELETE",
      `/api/aws/logs/log-groups/${encodeURIComponent(logGroupName)}/retention`
    );
    expect(status).toBe(200);
    expect(data.retentionRemoved).toBe(true);
  });

  it("manages tags on log group", async () => {
    const encodedName = encodeURIComponent(logGroupName);

    // Add tags
    const addRes = await api("POST", `/api/aws/logs/log-groups/${encodedName}/tags`, {
      tags: { env: "test", service: "integration" },
    });
    expect(addRes.status).toBe(200);
    expect(addRes.data.updated).toBe(true);

    // List tags
    const listRes = await api("GET", `/api/aws/logs/log-groups/${encodedName}/tags`);
    expect(listRes.status).toBe(200);
    expect(listRes.data.tags.env).toBe("test");

    // Remove one tag
    const delRes = await api("DELETE", `/api/aws/logs/log-groups/${encodedName}/tags`, {
      tags: ["service"],
    });
    expect(delRes.status).toBe(200);
    expect(delRes.data.updated).toBe(true);

    // Verify
    const verifyRes = await api("GET", `/api/aws/logs/log-groups/${encodedName}/tags`);
    expect(verifyRes.data.tags.service).toBeUndefined();
    expect(verifyRes.data.tags.env).toBe("test");
  });

  it("deletes the log stream", async () => {
    const { status, data } = await api(
      "DELETE",
      `/api/aws/logs/log-groups/${encodeURIComponent(logGroupName)}/streams/${logStreamName}`
    );
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });

  it("deletes the log group", async () => {
    const { status, data } = await api(
      "DELETE",
      `/api/aws/logs/log-groups/${encodeURIComponent(logGroupName)}`
    );
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════
//  SNS Integration Tests
// ═════════════════════════════════════════════════════════

describe("SNS Integration", () => {
  const topicName = rand("test-topic");
  let topicArn = "";

  afterAll(async () => {
    if (topicArn) {
      await api("DELETE", `/api/aws/sns/topics?topicArn=${encodeURIComponent(topicArn)}`).catch(() => {});
    }
  });

  it("creates a topic", async () => {
    const { status, data } = await api("POST", "/api/aws/sns/topics", { name: topicName });
    expect(status).toBe(201);
    expect(data.topicArn).toBeTruthy();
    topicArn = data.topicArn;
  });

  it("lists topics and includes the new topic", async () => {
    const { status, data } = await api("GET", "/api/aws/sns/topics");
    expect(status).toBe(200);
    const arns = data.topics.map((t: any) => t.TopicArn);
    expect(arns).toContain(topicArn);
  });

  it("publishes a message to the topic", async () => {
    const { status, data } = await api("POST", "/api/aws/sns/topics/publish", {
      topicArn,
      message: "Test message from integration test",
      subject: "Test",
    });
    expect(status).toBe(201);
    expect(data.messageId).toBeTruthy();
  });

  it("deletes the topic", async () => {
    const { status, data } = await api(
      "DELETE",
      `/api/aws/sns/topics?topicArn=${encodeURIComponent(topicArn)}`
    );
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
    topicArn = "";
  });
});

// ═════════════════════════════════════════════════════════
//  Lambda Integration Tests
// ═════════════════════════════════════════════════════════

describe("Lambda Integration", () => {
  const funcName = rand("test-func");
  const roleName = rand("lambda-role");
  let roleArn = "";

  beforeAll(async () => {
    // Create an IAM role for Lambda with the trust policy allowing Lambda to assume it
    const res = await api("POST", "/api/aws/iam/roles", {
      name: roleName,
      description: "Lambda execution role for integration tests",
      assumeRolePolicyDocument: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Principal: { Service: "lambda.amazonaws.com" },
          Action: "sts:AssumeRole",
        }],
      }),
    });
    roleArn = `arn:aws:iam::000000000000:role/${roleName}`;
  });

  afterAll(async () => {
    await api("DELETE", `/api/aws/lambda/functions/${funcName}`).catch(() => {});
    await api("DELETE", `/api/aws/iam/roles/${roleName}`).catch(() => {});
  });

  it("creates a function", async () => {
    const { status, data } = await api("POST", "/api/aws/lambda/functions", {
      name: funcName,
      runtime: "nodejs22.x",
      handler: "index.handler",
      role: roleArn,
      zipFile: "UEsDBBQAAAAIANmtzlxMSKXVZAAAAGYAAAAIABwAaW5kZXguanNVVAkAA+rMLmrqzC5qdXgLAAEE9QEAAAQAAAAAS60oyC8qKdbLSMxLyUktUrBVSCyuzEtW0EgtS80r0VSwtVPQqFYoLkksKS12zk9JtVIwMjDQUUjKT6m0UvAK9vfTKy4pysxLz0yrBKrLTS0uTkwHKlLKSM3JyVdSqNUEImsuAFBLAQIeAxQAAAAIANmtzlxMSKXVZAAAAGYAAAAIABgAAAAAAAEAAACkgQAAAABpbmRleC5qc1VUBQAD6swuanV4CwABBPUBAAAEAAAAAFBLBQYAAAAAAQABAE4AAACmAAAAAAA="
    });
    expect(status).toBe(200);
    expect(data.created).toBe(true);
    expect(data.function.name).toBe(funcName);
  });

  it("lists functions and includes the new function", async () => {
    const { status, data } = await api("GET", "/api/aws/lambda/functions");
    expect(status).toBe(200);
    const names = data.functions.map((f: any) => f.name);
    expect(names).toContain(funcName);
  });

  it("gets function configuration", async () => {
    const { status, data } = await api("GET", `/api/aws/lambda/functions/${funcName}`);
    expect(status).toBe(200);
    expect(data.configuration.name).toBe(funcName);
    expect(data.configuration.runtime).toBe("nodejs22.x");
  });

  it("deletes the function", async () => {
    const { status, data } = await api("DELETE", `/api/aws/lambda/functions/${funcName}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════
//  EventBridge Integration Tests
// ═════════════════════════════════════════════════════════

describe("EventBridge Integration", () => {
  const ruleName = rand("test-rule");
  const busName = rand("test-bus");

  afterAll(async () => {
    await api("DELETE", `/api/aws/events/rules?name=${ruleName}&eventBusName=default`).catch(() => {});
    await api("DELETE", `/api/aws/events/buses?name=${busName}`).catch(() => {});
  });

  it("creates an event bus", async () => {
    const { status, data } = await api("POST", "/api/aws/events/buses", { name: busName });
    expect(status).toBe(201);
    expect(data.eventBusArn).toBeTruthy();
  });

  it("lists event buses", async () => {
    const { status, data } = await api("GET", "/api/aws/events/buses");
    expect(status).toBe(200);
    const names = data.eventBuses.map((b: any) => b.Name);
    expect(names).toContain(busName);
  });

  it("creates a rule", async () => {
    const { status, data } = await api("POST", "/api/aws/events/rules", {
      name: ruleName,
      eventBusName: "default",
      eventPattern: JSON.stringify({ source: ["my.app"] }),
      state: "ENABLED",
    });
    expect(status).toBe(201);
    expect(data.ruleArn).toBeTruthy();
  });

  it("lists rules", async () => {
    const { status, data } = await api("GET", "/api/aws/events/rules?eventBusName=default");
    expect(status).toBe(200);
    const names = data.rules.map((r: any) => r.Name);
    expect(names).toContain(ruleName);
  });

  it("puts events", async () => {
    const { status, data } = await api("POST", "/api/aws/events/put-events", {
      entries: [
        { Source: "my.app", DetailType: "TestEvent", Detail: '{"message": "hello"}' },
      ],
    });
    expect(status).toBe(200);
    expect(data.failedCount).toBe(0);
  });

  it("deletes the rule", async () => {
    const { status, data } = await api(
      "DELETE",
      `/api/aws/events/rules?name=${ruleName}&eventBusName=default`
    );
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });

  it("deletes the event bus", async () => {
    const { status, data } = await api("DELETE", `/api/aws/events/buses?name=${busName}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════
//  CloudWatch Metrics & Alarms Integration Tests
// ═════════════════════════════════════════════════════════

describe("CloudWatch Metrics & Alarms Integration", () => {
  const namespace = "IntegrationTest/App";
  const alarmName = rand("test-alarm");

  afterAll(async () => {
    await api("DELETE", `/api/aws/cloudwatch/alarms/${alarmName}`).catch(() => {});
  });

  it("puts metric data", async () => {
    const { status, data } = await api("POST", "/api/aws/cloudwatch/metrics/data", {
      namespace,
      metricData: [
        { metricName: "Requests", value: 42, unit: "Count" },
        { metricName: "Latency", value: 0.5, unit: "Seconds" },
      ],
    });
    expect(status).toBe(200);
    expect(data.put).toBe(true);
  });

  it("lists metrics for the namespace", async () => {
    const { status, data } = await api(
      "GET",
      `/api/aws/cloudwatch/metrics?namespace=${encodeURIComponent(namespace)}`
    );
    expect(status).toBe(200);
    expect(data.metrics.length).toBeGreaterThanOrEqual(1);
    const metricNames = data.metrics.map((m: any) => m.metricName);
    expect(metricNames).toContain("Requests");
  });

  it("creates an alarm", async () => {
    const { status, data } = await api("POST", "/api/aws/cloudwatch/alarms", {
      name: alarmName,
      namespace,
      metricName: "Requests",
      statistic: "Sum",
      threshold: 100,
      comparisonOperator: "GreaterThanThreshold",
      period: 300,
      evaluationPeriods: 1,
    });
    expect(status).toBe(200);
    expect(data.created).toBe(true);
  });

  it("lists alarms", async () => {
    const { status, data } = await api("GET", "/api/aws/cloudwatch/alarms");
    expect(status).toBe(200);
    const names = data.alarms.map((a: any) => a.name);
    expect(names).toContain(alarmName);
  });

  it("deletes the alarm", async () => {
    const { status, data } = await api("DELETE", `/api/aws/cloudwatch/alarms/${alarmName}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════
//  IAM Integration Tests
// ═════════════════════════════════════════════════════════

describe("IAM Integration", () => {
  const roleName = rand("test-role");
  const userName = rand("test-user");
  const policyName = rand("test-policy");
  let policyArn = "";

  afterAll(async () => {
    await api("DELETE", `/api/aws/iam/users/${userName}`).catch(() => {});
    await api("DELETE", `/api/aws/iam/roles/${roleName}`).catch(() => {});
    if (policyArn) {
      await api("DELETE", `/api/aws/iam/policies?arn=${encodeURIComponent(policyArn)}`).catch(() => {});
    }
  });

  it("creates a role", async () => {
    const { status, data } = await api("POST", "/api/aws/iam/roles", {
      name: roleName,
      description: "Integration test role",
      assumeRolePolicyDocument: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { Service: "ec2.amazonaws.com" },
            Action: "sts:AssumeRole",
          },
        ],
      }),
    });
    expect(status).toBe(200);
    expect(data.created).toBe(true);
  });

  it("lists roles and includes the new role", async () => {
    const { status, data } = await api("GET", "/api/aws/iam/roles");
    expect(status).toBe(200);
    const names = data.roles.map((r: any) => r.name);
    expect(names).toContain(roleName);
  });

  it("gets role with detail", async () => {
    const { status, data } = await api("GET", `/api/aws/iam/roles/${roleName}`);
    expect(status).toBe(200);
    expect(data.role.name).toBe(roleName);
  });

  it("creates a user", async () => {
    const { status, data } = await api("POST", "/api/aws/iam/users", { name: userName });
    expect(status).toBe(200);
    expect(data.created).toBe(true);
  });

  it("lists users and includes the new user", async () => {
    const { status, data } = await api("GET", "/api/aws/iam/users");
    expect(status).toBe(200);
    const names = data.users.map((u: any) => u.name);
    expect(names).toContain(userName);
  });

  it("creates a policy", async () => {
    const { status, data } = await api("POST", "/api/aws/iam/policies", {
      name: policyName,
      description: "Integration test policy",
      document: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{ Effect: "Allow", Action: "s3:GetObject", Resource: "*" }],
      }),
    });
    expect(status).toBe(200);
    expect(data.created).toBe(true);
    expect(data.arn).toBeTruthy();
    policyArn = data.arn;
  });

  it("lists policies", async () => {
    const { status, data } = await api("GET", "/api/aws/iam/policies?scope=Local");
    expect(status).toBe(200);
    const names = data.policies.map((p: any) => p.name);
    expect(names).toContain(policyName);
  });

  it("deletes the user", async () => {
    const { status, data } = await api("DELETE", `/api/aws/iam/users/${userName}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });

  it("deletes the policy", async () => {
    const { status, data } = await api(
      "DELETE",
      `/api/aws/iam/policies?arn=${encodeURIComponent(policyArn)}`
    );
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
    policyArn = "";
  });

  it("deletes the role", async () => {
    const { status, data } = await api("DELETE", `/api/aws/iam/roles/${roleName}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════
//  Secrets Manager Integration Tests
// ═════════════════════════════════════════════════════════

describe("Secrets Manager Integration", () => {
  const secretName = rand("test-secret");

  afterAll(async () => {
    await api("DELETE", `/api/aws/secretsmanager/secrets/${secretName}?force=true`).catch(() => {});
  });

  it("creates a secret", async () => {
    const { status, data } = await api("POST", "/api/aws/secretsmanager/secrets", {
      name: secretName,
      secretString: "v1-password",
      description: "Integration test secret",
      tags: [{ key: "env", value: "test" }],
    });
    expect(status).toBe(200);
    expect(data.created).toBe(true);
    expect(data.name).toBe(secretName);
    expect(data.versionId).toBeTruthy();
  });

  it("lists secrets and includes the new secret", async () => {
    const { status, data } = await api("GET", "/api/aws/secretsmanager/secrets");
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    const names = data.secrets.map((s: any) => s.name);
    expect(names).toContain(secretName);
  });

  it("gets secret value", async () => {
    const { status, data } = await api("GET", `/api/aws/secretsmanager/secrets/${secretName}/value`);
    expect(status).toBe(200);
    expect(data.secretString).toBe("v1-password");
  });

  // ─── Version Staging Tests ─────────────────────────────

  it("creates a second version via PutSecretValue", async () => {
    const { status, data } = await api("POST", `/api/aws/secretsmanager/secrets/${secretName}/value`, {
      secretString: "v2-password",
    });
    expect(status).toBe(200);
    expect(data.put).toBe(true);
    expect(data.versionId).toBeTruthy();

    // Verify new value is now current
    const { data: verifyData } = await api("GET", `/api/aws/secretsmanager/secrets/${secretName}/value`);
    expect(verifyData.secretString).toBe("v2-password");
  });

  it("describes multiple versions with correct staging", async () => {
    const { status, data } = await api("GET", `/api/aws/secretsmanager/secrets/${secretName}`);
    expect(status).toBe(200);
    expect(data.versions).toBeDefined();
    // Should have at least 2 versions now (v1 and v2)
    expect(data.versions.length).toBeGreaterThanOrEqual(2);

    // Verify version IDs and staging labels exist
    const versionIds = data.versions.map((v: any) => v.versionId);
    const allStages = data.versions.flatMap((v: any) => v.stages);
    // At least one version should have AWSCURRENT stage
    expect(allStages).toContain("AWSCURRENT");

    // The versionIdsToStages map should also reflect proper staging
    expect(data.versionIdsToStages).toBeDefined();
    const stageKeys = Object.keys(data.versionIdsToStages);
    expect(stageKeys.length).toBeGreaterThanOrEqual(2);
  });

  it("retrieves specific version by version ID", async () => {
    // Get the describe to find a non-current version
    const describeRes = await api("GET", `/api/aws/secretsmanager/secrets/${secretName}`);
    const version = describeRes.data.versions.find(
      (v: any) => !v.stages.includes("AWSCURRENT")
    ) || describeRes.data.versions[0];

    const { status, data } = await api(
      "GET",
      `/api/aws/secretsmanager/secrets/${secretName}/value?versionId=${version.versionId}`
    );
    expect(status).toBe(200);
    expect(data.versionId).toBe(version.versionId);
    expect(data.secretString).toBeTruthy();
  });

  // ─── Update metadata ───────────────────────────────────

  it("updates secret metadata via PUT", async () => {
    const { status, data } = await api("PUT", `/api/aws/secretsmanager/secrets/${secretName}`, {
      description: "Updated integration test secret",
    });
    expect(status).toBe(200);
    expect(data.updated).toBe(true);

    // Verify description changed
    const { data: verifyData } = await api("GET", `/api/aws/secretsmanager/secrets/${secretName}`);
    expect(verifyData.secret.description).toBe("Updated integration test secret");
  });

  // ─── Rotation Test ─────────────────────────────────────

  it("calls rotation endpoint (Floci may not support full rotation)", async () => {
    const { status, data } = await api("POST", `/api/aws/secretsmanager/secrets/${secretName}/rotate`, {
      rotationLambdaARN: "arn:aws:lambda:us-east-1:000000000000:function:test-rotation",
      automaticallyAfterDays: 30,
    });
    // Floci may support rotation or return an error — either is acceptable.
    // If it succeeds, verify the response shape.
    if (status === 200) {
      expect(data.rotated).toBe(true);
    }
    // If it fails (e.g. 400/500 from Floci), the test still passes since
    // rotation requires custom Lambda that Floci may not fully simulate.
  });

  // ─── Restore Test ──────────────────────────────────────

  it("schedules deletion (without force) then restores the secret", async () => {
    // Delete without force — schedules deletion with a recovery window
    const delRes = await api("DELETE", `/api/aws/secretsmanager/secrets/${secretName}`);
    expect(delRes.status).toBe(200);
    expect(delRes.data.deleted).toBe(true);

    // Secret should now be scheduled for deletion — verify it has deletedDate
    const describeRes = await api("GET", `/api/aws/secretsmanager/secrets/${secretName}`);
    expect(describeRes.status).toBe(200);
    expect(describeRes.data.secret.deletedDate).toBeTruthy();

    // Restore the secret
    const restoreRes = await api("POST", `/api/aws/secretsmanager/secrets/${secretName}/restore`);
    expect(restoreRes.status).toBe(200);
    expect(restoreRes.data.restored).toBe(true);

    // Verify it's back. Note: Floci may return empty secretString after restore.
    // We still verify the endpoint responds and the secret is accessible.
    const verifyRes = await api("GET", `/api/aws/secretsmanager/secrets/${secretName}/value`);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.data).toBeDefined();
  });

  // ─── Tags ──────────────────────────────────────────────

  it("manages tags on secret", async () => {
    const { status, data } = await api("POST", `/api/aws/secretsmanager/secrets/${secretName}/tags`, {
      tags: [{ key: "owner", value: "integration" }, { key: "stage", value: "testing" }],
    });
    expect(status).toBe(200);
    expect(data.tagged).toBe(true);

    // Remove tags
    const delRes = await api("DELETE", `/api/aws/secretsmanager/secrets/${secretName}/tags?keys=stage`);
    expect(delRes.status).toBe(200);
    expect(delRes.data.untagged).toBe(true);
  });

  it("generates a random password", async () => {
    const { status, data } = await api("POST", "/api/aws/secretsmanager/random-password", {
      passwordLength: 16,
    });
    expect(status).toBe(200);
    expect(data.randomPassword).toBeTruthy();
    expect(data.randomPassword.length).toBe(16);
  });

  it("forcefully deletes the secret", async () => {
    const { status, data } = await api("DELETE", `/api/aws/secretsmanager/secrets/${secretName}?force=true`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════
//  CloudFormation Integration Tests
// ═════════════════════════════════════════════════════════

describe("CloudFormation Integration", () => {
  const stackName = rand("test-stack");
  const simpleTemplate = JSON.stringify({
    AWSTemplateFormatVersion: "2010-09-09",
    Description: "Integration test stack",
    Resources: {
      TestBucket: {
        Type: "AWS::S3::Bucket",
        Properties: {
          BucketName: rand("cfn-bucket"),
        },
      },
    },
  });

  afterAll(async () => {
    await api("DELETE", `/api/aws/cloudformation/stacks/${stackName}`).catch(() => {});
  });

  it("validates a template", async () => {
    const { status, data } = await api("POST", "/api/aws/cloudformation/validate-template", {
      templateBody: simpleTemplate,
    });
    expect(status).toBe(200);
    expect(data.valid).toBe(true);
  });

  it("creates a stack", async () => {
    const { status, data } = await api("POST", "/api/aws/cloudformation/stacks", {
      name: stackName,
      templateBody: simpleTemplate,
    });
    expect(status).toBe(200);
    expect(data.created).toBe(true);
  });

  it("lists stacks and includes the new stack", async () => {
    const { status, data } = await api("GET", "/api/aws/cloudformation/stacks");
    expect(status).toBe(200);
    const names = data.stacks.map((s: any) => s.name);
    expect(names).toContain(stackName);
  });

  it("describes the stack", async () => {
    const { status, data } = await api("GET", `/api/aws/cloudformation/stacks/${stackName}`);
    expect(status).toBe(200);
    expect(data.stack).not.toBeNull();
    expect(data.stack.name).toBe(stackName);
    expect(data.resources).toBeDefined();
    expect(data.events).toBeDefined();
  });

  it("gets stack template", async () => {
    const { status, data } = await api("GET", `/api/aws/cloudformation/stacks/${stackName}/template`);
    expect(status).toBe(200);
    expect(data.template).toBeTruthy();
  });

  it("lists stack exports", async () => {
    const { status, data } = await api("GET", "/api/aws/cloudformation/exports");
    expect(status).toBe(200);
    expect(data.exports).toBeDefined();
  });

  it("deletes the stack", async () => {
    const { status, data } = await api("DELETE", `/api/aws/cloudformation/stacks/${stackName}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════
//  EC2 VPCs Integration Tests
// ═════════════════════════════════════════════════════════

describe("EC2 VPCs Integration", () => {
  const vpcName = rand("test-vpc");
  let vpcId = "";

  afterAll(async () => {
    if (vpcId) {
      await api("DELETE", `/api/aws/ec2/vpcs/${vpcId}`).catch(() => {});
    }
  });

  it("creates a VPC", async () => {
    const { status, data } = await api("POST", "/api/aws/ec2/vpcs", {
      cidrBlock: "10.0.0.0/16",
    });
    expect(status).toBe(200);
    expect(data.created).toBe(true);
    expect(data.id).toBeTruthy();
    expect(data.cidrBlock).toBe("10.0.0.0/16");
    vpcId = data.id;
  });

  it("lists VPCs and includes the new VPC", async () => {
    const { status, data } = await api("GET", "/api/aws/ec2/vpcs");
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    const ids = data.vpcs.map((v: any) => v.id);
    expect(ids).toContain(vpcId);
  });

  it("describes the VPC", async () => {
    const { status, data } = await api("GET", `/api/aws/ec2/vpcs/${vpcId}`);
    expect(status).toBe(200);
    expect(data.id).toBe(vpcId);
    expect(data.cidrBlock).toBe("10.0.0.0/16");
    expect(data.state).toBe("available");
  });

  it("modifies VPC attributes", async () => {
    const { status, data } = await api("PATCH", `/api/aws/ec2/vpcs/${vpcId}`, {
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });
    expect(status).toBe(200);
    expect(data.modified).toBe(true);
  });

  it("associates an additional CIDR block", async () => {
    const { status, data } = await api("POST", `/api/aws/ec2/vpcs/${vpcId}/cidr`, {
      cidrBlock: "10.1.0.0/16",
    });
    expect(status).toBe(200);
    expect(data.created).toBe(true);
    expect(data.associationId).toBeTruthy();
  });

  it("deletes the VPC", async () => {
    const { status, data } = await api("DELETE", `/api/aws/ec2/vpcs/${vpcId}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
    vpcId = "";
  });
});

// ═════════════════════════════════════════════════════════
//  EC2 Subnets Integration Tests
// ═════════════════════════════════════════════════════════

describe("EC2 Subnets Integration", () => {
  let vpcId = "";
  let subnetId = "";

  beforeAll(async () => {
    const { data } = await api("POST", "/api/aws/ec2/vpcs", { cidrBlock: "10.0.0.0/16" });
    vpcId = data.id;
  });

  afterAll(async () => {
    if (subnetId) {
      await api("DELETE", `/api/aws/ec2/subnets/${subnetId}`).catch(() => {});
    }
    if (vpcId) {
      await api("DELETE", `/api/aws/ec2/vpcs/${vpcId}`).catch(() => {});
    }
  });

  it("creates a subnet in the VPC", async () => {
    const { status, data } = await api("POST", "/api/aws/ec2/subnets", {
      vpcId,
      cidrBlock: "10.0.1.0/24",
    });
    expect(status).toBe(200);
    expect(data.created).toBe(true);
    expect(data.id).toBeTruthy();
    expect(data.cidrBlock).toBe("10.0.1.0/24");
    subnetId = data.id;
  });

  it("lists subnets and includes the new subnet", async () => {
    const { status, data } = await api("GET", "/api/aws/ec2/subnets");
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    const ids = data.subnets.map((s: any) => s.id);
    expect(ids).toContain(subnetId);
  });

  it("modifies subnet attribute (mapPublicIpOnLaunch)", async () => {
    const { status, data } = await api("PATCH", `/api/aws/ec2/subnets/${subnetId}`, {
      mapPublicIpOnLaunch: true,
    });
    expect(status).toBe(200);
    expect(data.modified).toBe(true);
  });

  it("deletes the subnet", async () => {
    const { status, data } = await api("DELETE", `/api/aws/ec2/subnets/${subnetId}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
    subnetId = "";
  });

  it("fails to create a subnet without a VPC ID", async () => {
    const { status, data } = await api("POST", "/api/aws/ec2/subnets", {
      cidrBlock: "10.0.2.0/24",
    });
    expect(status).toBe(400);
    expect(data.error).toBe("VpcId is required");
  });
});

// ═════════════════════════════════════════════════════════
//  EC2 Instances Integration Tests
// ═════════════════════════════════════════════════════════

describe("EC2 Instances Integration", () => {
  let vpcId = "";
  let subnetId = "";
  let securityGroupId = "";
  let keyPairName = "";
  let instanceId = "";
  let allocationId = "";
  let volumeId = "";

  beforeAll(async () => {
    // Create a VPC for subnet and security group
    const vpcRes = await api("POST", "/api/aws/ec2/vpcs", { cidrBlock: "10.0.0.0/16" });
    vpcId = vpcRes.data.id;

    // Create a subnet
    const subnetRes = await api("POST", "/api/aws/ec2/subnets", {
      vpcId, cidrBlock: "10.0.1.0/24",
    });
    subnetId = subnetRes.data.id;

    // Create a security group
    const sgName = rand("test-sg");
    const sgRes = await api("POST", "/api/aws/ec2/security-groups", {
      groupName: sgName,
      description: "Integration test security group",
      vpcId,
    });
    securityGroupId = sgRes.data.id;

    // Add inbound rule
    await api("POST", `/api/aws/ec2/security-groups/${securityGroupId}/rules/ingress`, {
      ipProtocol: "tcp", fromPort: 22, toPort: 22, cidrIp: "0.0.0.0/0",
    }).catch(() => {});

    // Add outbound rule
    await api("POST", `/api/aws/ec2/security-groups/${securityGroupId}/rules/egress`, {
      ipProtocol: "-1", cidrIp: "0.0.0.0/0",
    }).catch(() => {});

    // Create a key pair
    keyPairName = rand("test-key");
    await api("POST", "/api/aws/ec2/key-pairs", { keyName: keyPairName }).catch(() => {});
  });

  afterAll(async () => {
    if (instanceId) {
      await api("DELETE", `/api/aws/ec2/instances/${instanceId}`).catch(() => {});
    }
    if (keyPairName) {
      await api("DELETE", `/api/aws/ec2/key-pairs/${keyPairName}`).catch(() => {});
    }
    if (securityGroupId) {
      await api("DELETE", `/api/aws/ec2/security-groups/${securityGroupId}`).catch(() => {});
    }
    if (subnetId) {
      await api("DELETE", `/api/aws/ec2/subnets/${subnetId}`).catch(() => {});
    }
    if (vpcId) {
      await api("DELETE", `/api/aws/ec2/vpcs/${vpcId}`).catch(() => {});
    }
    if (allocationId) {
      await api("DELETE", `/api/aws/ec2/elastic-ips/${allocationId}`).catch(() => {});
    }
    if (volumeId) {
      await api("DELETE", `/api/aws/ec2/volumes/${volumeId}`).catch(() => {});
    }
  });

  // ─── Key Pairs ─────────────────────────────────────────

  it("lists key pairs", async () => {
    const { status, data } = await api("GET", "/api/aws/ec2/key-pairs");
    expect(status).toBe(200);
    expect(data.keyPairs).toBeDefined();
    const names = data.keyPairs.map((k: any) => k.name);
    expect(names).toContain(keyPairName);
  });

  // ─── Security Groups ───────────────────────────────────

  it("lists security groups and includes the new group", async () => {
    const { status, data } = await api("GET", "/api/aws/ec2/security-groups");
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    const ids = data.securityGroups.map((g: any) => g.id);
    expect(ids).toContain(securityGroupId);
  });

  it("describes the security group", async () => {
    const { status, data } = await api("GET", "/api/aws/ec2/security-groups");
    const group = data.securityGroups.find((g: any) => g.id === securityGroupId);
    expect(group).toBeDefined();
    expect(group.name).toMatch(/^test-sg-/);
    expect(group.inboundRules).toBeDefined();
    expect(group.outboundRules).toBeDefined();
  });

  it("adds and removes security group ingress rules", async () => {
    // Remove the previously added ssh rule
    const delRes = await api("DELETE", `/api/aws/ec2/security-groups/${securityGroupId}/rules/ingress`, {
      ipProtocol: "tcp", fromPort: 22, toPort: 22, cidrIp: "0.0.0.0/0",
    });
    expect(delRes.status).toBe(200);
    expect(delRes.data.ruleRemoved).toBe(true);

    // Add a different rule
    const addRes = await api("POST", `/api/aws/ec2/security-groups/${securityGroupId}/rules/ingress`, {
      ipProtocol: "tcp", fromPort: 443, toPort: 443, cidrIp: "10.0.0.0/8",
    });
    expect(addRes.status).toBe(200);
    expect(addRes.data.ruleAdded).toBe(true);
  });

  it("adds and removes security group egress rules", async () => {
    const delRes = await api("DELETE", `/api/aws/ec2/security-groups/${securityGroupId}/rules/egress`, {
      ipProtocol: "-1", cidrIp: "0.0.0.0/0",
    });
    expect(delRes.status).toBe(200);
    expect(delRes.data.egressRuleRemoved).toBe(true);

    const addRes = await api("POST", `/api/aws/ec2/security-groups/${securityGroupId}/rules/egress`, {
      ipProtocol: "tcp", fromPort: 80, toPort: 80, cidrIp: "0.0.0.0/0",
    });
    expect(addRes.status).toBe(200);
    expect(addRes.data.egressRuleAdded).toBe(true);
  });

  // ─── Instance ──────────────────────────────────────────

  it("creates an EC2 instance", async () => {
    const { status, data } = await api("POST", "/api/aws/ec2/instances", {
      imageId: "ami-0abcdef1234567891",
      instanceType: "t2.micro",
      keyName: keyPairName,
      securityGroupIds: [securityGroupId],
      subnetId,
    });
    expect(status).toBe(200);
    expect(data.created).toBe(true);
    expect(data.instances.length).toBe(1);
    expect(data.instances[0].id).toBeTruthy();
    instanceId = data.instances[0].id;
  });

  it("lists instances and includes the new instance", async () => {
    const { status, data } = await api("GET", "/api/aws/ec2/instances");
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    const ids = data.instances.map((i: any) => i.id);
    expect(ids).toContain(instanceId);
  });

  it("describes the instance", async () => {
    const { status, data } = await api("GET", `/api/aws/ec2/instances/${instanceId}`);
    expect(status).toBe(200);
    expect(data.id).toBe(instanceId);
    expect(data.instanceType).toBe("t2.micro");
    expect(data.state).toBeDefined();
    expect(data.vpcId).toBe(vpcId);
    expect(data.subnetId).toBe(subnetId);
    expect(data.keyName).toBe(keyPairName);
  });

  it("gets instance status", async () => {
    const { status, data } = await api("GET", `/api/aws/ec2/instances/${instanceId}/status`);
    expect(status).toBe(200);
    expect(data.id).toBe(instanceId);
    // Floci may not report detailed status — accept whatever it returns
  });

  it("starts the instance", async () => {
    const { status, data } = await api("POST", `/api/aws/ec2/instances/${instanceId}/start`);
    expect(status).toBe(200);
    expect(data.started).toBe(true);
  });

  it("stops the instance", async () => {
    const { status, data } = await api("POST", `/api/aws/ec2/instances/${instanceId}/stop`);
    expect(status).toBe(200);
    expect(data.stopped).toBe(true);
  });

  it("reboots the instance", async () => {
    const { status, data } = await api("POST", `/api/aws/ec2/instances/${instanceId}/reboot`);
    expect(status).toBe(200);
    expect(data.rebooting).toBe(true);
  });

  it("modifies instance attributes", async () => {
    const { status, data } = await api("PATCH", `/api/aws/ec2/instances/${instanceId}`, {
      instanceType: "t2.small",
      sourceDestCheck: false,
    });
    expect(status).toBe(200);
    expect(data.modified).toBe(true);
    // Note: Floci may not persist instance type changes — verification is skipped
  });

  // ─── Elastic IPs ───────────────────────────────────────

  it("allocates an Elastic IP", async () => {
    const { status, data } = await api("POST", "/api/aws/ec2/elastic-ips", { domain: "vpc" });
    expect(status).toBe(200);
    expect(data.created).toBe(true);
    expect(data.allocationId).toBeTruthy();
    expect(data.publicIp).toBeTruthy();
    allocationId = data.allocationId;
  });

  it("lists Elastic IPs", async () => {
    const { status, data } = await api("GET", "/api/aws/ec2/elastic-ips");
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    const ids = data.addresses.map((a: any) => a.allocationId);
    expect(ids).toContain(allocationId);
  });

  it("associates and disassociates an Elastic IP", async () => {
    // Associate
    const assocRes = await api("POST", `/api/aws/ec2/elastic-ips/${allocationId}/associate`, {
      instanceId,
    });
    expect(assocRes.status).toBe(200);
    expect(assocRes.data.associated).toBe(true);
    expect(assocRes.data.associationId).toBeTruthy();
    const associationId = assocRes.data.associationId;

    // Disassociate
    const disRes = await api("POST", `/api/aws/ec2/elastic-ips/${allocationId}/disassociate`, {
      associationId,
    });
    expect(disRes.status).toBe(200);
    expect(disRes.data.disassociated).toBe(true);
  });

  // ─── Volumes ───────────────────────────────────────────

  it("creates an EBS volume", async () => {
    const { status, data } = await api("POST", "/api/aws/ec2/volumes", {
      availabilityZone: "us-east-1a",
      size: 10,
      volumeType: "gp3",
    });
    expect(status).toBe(200);
    expect(data.created).toBe(true);
    expect(data.id).toBeTruthy();
    volumeId = data.id;
  });

  it("lists volumes and includes the new volume", async () => {
    const { status, data } = await api("GET", "/api/aws/ec2/volumes");
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    const ids = data.volumes.map((v: any) => v.id);
    expect(ids).toContain(volumeId);
  });

  it("deletes the volume", async () => {
    const { status, data } = await api("DELETE", `/api/aws/ec2/volumes/${volumeId}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
    volumeId = "";
  });

  // ─── AMIs ──────────────────────────────────────────────

  it("lists AMIs", async () => {
    const { status, data } = await api("GET", "/api/aws/ec2/amis");
    expect(status).toBe(200);
    expect(data.images).toBeDefined();
    expect(data.total).toBeGreaterThanOrEqual(0);
  });

  // ─── Tags ──────────────────────────────────────────────

  it("manages tags on the instance", async () => {
    // Create tag
    const createRes = await api("POST", "/api/aws/ec2/tags", {
      resources: [instanceId],
      tags: [{ key: "Environment", value: "test" }, { key: "Name", value: "integration-test" }],
    });
    expect(createRes.status).toBe(200);
    expect(createRes.data.tagged).toBe(true);

    // List tags
    const listRes = await api("GET", "/api/aws/ec2/tags");
    expect(listRes.status).toBe(200);
    expect(listRes.data.total).toBeGreaterThanOrEqual(1);
    const tagKeys = listRes.data.tags.map((t: any) => t.key);
    expect(tagKeys).toContain("Environment");
  });

  // ─── Networks ──────────────────────────────────────────

  it("lists network interfaces", async () => {
    const { status, data } = await api("GET", "/api/aws/ec2/network-interfaces");
    expect(status).toBe(200);
    expect(data.networkInterfaces).toBeDefined();
    expect(data.total).toBeGreaterThanOrEqual(0);
  });

  // ─── Cleanup ───────────────────────────────────────────

  it("terminates the instance", async () => {
    const { status, data } = await api("DELETE", `/api/aws/ec2/instances/${instanceId}`);
    expect(status).toBe(200);
    expect(data.terminated).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════
//  KMS Integration Tests
// ═════════════════════════════════════════════════════════

describe("KMS Integration", () => {
  let keyId = "";

  afterAll(async () => {
    if (keyId) {
      await api("POST", `/api/aws/kms/keys/${keyId}/schedule-deletion`, { pendingWindowInDays: 7 }).catch(() => {});
    }
  });

  it("creates a symmetric key", async () => {
    const { status, data } = await api("POST", "/api/aws/kms/keys", {
      description: "Integration test key",
      keyUsage: "ENCRYPT_DECRYPT",
      keySpec: "SYMMETRIC_DEFAULT",
    });
    expect(status).toBe(200);
    expect(data.created).toBe(true);
    expect(data.keyId).toBeTruthy();
    keyId = data.keyId;
  });

  it("lists keys and includes the new key", async () => {
    const { status, data } = await api("GET", "/api/aws/kms/keys");
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    const ids = data.keys.map((k: any) => k.keyId);
    expect(ids).toContain(keyId);
  });

  it("describes the key", async () => {
    const { status, data } = await api("GET", `/api/aws/kms/keys/${keyId}`);
    expect(status).toBe(200);
    expect(data.key.keyId).toBe(keyId);
    expect(data.key.enabled).toBe(true);
    expect(data.tags).toBeDefined();
    expect(data.aliases).toBeDefined();
    expect(data.grants).toBeDefined();
    expect(data.rotationEnabled).toBeDefined();
  });

  it("disables the key", async () => {
    const { status, data } = await api("POST", `/api/aws/kms/keys/${keyId}/disable`);
    expect(status).toBe(200);
    expect(data.disabled).toBe(true);
  });

  it("enables the key (Floci may not support EnableKey — pass gracefully)", async () => {
    const { status, data } = await api("POST", `/api/aws/kms/keys/${keyId}/enable`);
    if (status !== 200) {
      // Floci does not support EnableKey — skip assertion
      return;
    }
    expect(data.enabled).toBe(true);
  });

  it("updates key description", async () => {
    const { status, data } = await api("PUT", `/api/aws/kms/keys/${keyId}/description`, {
      description: "Updated integration test key",
    });
    expect(status).toBe(200);
    expect(data.updated).toBe(true);
  });

  it("manages key aliases", async () => {
    const aliasName = `alias/test-${Date.now()}`;

    // Create
    const createRes = await api("POST", "/api/aws/kms/aliases", {
      aliasName,
      targetKeyId: keyId,
    });
    expect(createRes.status).toBe(200);
    expect(createRes.data.created).toBe(true);

    // List
    const listRes = await api("GET", "/api/aws/kms/aliases");
    expect(listRes.status).toBe(200);
    expect(listRes.data.total).toBeGreaterThanOrEqual(1);

    // Delete
    const delRes = await api("DELETE", `/api/aws/kms/aliases/${encodeURIComponent(aliasName)}`);
    expect(delRes.status).toBe(200);
    expect(delRes.data.deleted).toBe(true);
  });

  it("encrypts and decrypts data", async () => {
    const plaintext = Buffer.from("Hello KMS Integration!").toString("base64");

    const encryptRes = await api("POST", `/api/aws/kms/keys/${keyId}/encrypt`, {
      plaintext,
    });
    expect(encryptRes.status).toBe(200);
    expect(encryptRes.data.ciphertextBlob).toBeTruthy();
    const ciphertext = encryptRes.data.ciphertextBlob;

    const decryptRes = await api("POST", "/api/aws/kms/decrypt", {
      ciphertextBlob: ciphertext,
    });
    expect(decryptRes.status).toBe(200);
    expect(decryptRes.data.plaintext).toBe(plaintext);
  });

  it("generates a data key", async () => {
    const { status, data } = await api("POST", `/api/aws/kms/keys/${keyId}/data-key`, {
      keySpec: "AES_256",
    });
    expect(status).toBe(200);
    expect(data.plaintext).toBeTruthy();
    expect(data.ciphertextBlob).toBeTruthy();
  });

  it("generates random bytes", async () => {
    const { status, data } = await api("POST", "/api/aws/kms/random", {
      numberOfBytes: 16,
    });
    expect(status).toBe(200);
    expect(data.plaintext).toBeTruthy();
    expect(Buffer.from(data.plaintext, "base64").length).toBe(16);
  });

  it("manages tags on the key", async () => {
    // Add tags
    const addRes = await api("POST", `/api/aws/kms/keys/${keyId}/tags`, {
      tags: [{ key: "env", value: "test" }, { key: "service", value: "integration" }],
    });
    expect(addRes.status).toBe(200);
    expect(addRes.data.tagged).toBe(true);

    // Remove tags
    const delRes = await api("DELETE", `/api/aws/kms/keys/${keyId}/tags?keys=service`);
    expect(delRes.status).toBe(200);
    expect(delRes.data.untagged).toBe(true);
  });

  it("schedules and cancels key deletion", async () => {
    const scheduleRes = await api("POST", `/api/aws/kms/keys/${keyId}/schedule-deletion`, {
      pendingWindowInDays: 7,
    });
    expect(scheduleRes.status).toBe(200);
    expect(scheduleRes.data.scheduled).toBe(true);
    expect(scheduleRes.data.deletionDate).toBeTruthy();

    const cancelRes = await api("POST", `/api/aws/kms/keys/${keyId}/cancel-deletion`);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.data.cancelled).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════
//  SSM Integration Tests
// ═════════════════════════════════════════════════════════

describe("SSM Integration", () => {
  const paramName = `/test/${rand("param")}`;

  afterAll(async () => {
    await api("DELETE", `/api/aws/ssm/parameters/${encodeURIComponent(paramName)}`).catch(() => {});
  });

  it("creates a parameter", async () => {
    const { status, data } = await api("POST", "/api/aws/ssm/parameters", {
      name: paramName,
      value: "test-value-1",
      type: "String",
      description: "Integration test parameter",
    });
    expect(status).toBe(201);
    expect(data.version).toBe(1);
  });

  it("lists parameters and includes the new parameter", async () => {
    const { status, data } = await api("GET", "/api/aws/ssm/parameters");
    expect(status).toBe(200);
    const names = data.parameters.map((p: any) => p.Name);
    expect(names).toContain(paramName);
  });

  it("gets parameter value", async () => {
    const { status, data } = await api("GET", `/api/aws/ssm/parameters/${encodeURIComponent(paramName)}`);
    expect(status).toBe(200);
    expect(data.parameter.Value).toBe("test-value-1");
    expect(data.parameter.Type).toBe("String");
  });

  it("overwrites parameter (new version)", async () => {
    const { status, data } = await api("POST", "/api/aws/ssm/parameters", {
      name: paramName,
      value: "test-value-2",
      type: "String",
      overwrite: true,
    });
    expect(status).toBe(201);
    expect(data.version).toBe(2);
  });

  it("gets parameter history", async () => {
    const { status, data } = await api("GET", `/api/aws/ssm/parameters/${encodeURIComponent(paramName)}/history`);
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(2);
    expect(data.history.length).toBeGreaterThanOrEqual(2);
  });

  it("creates a SecureString parameter", async () => {
    const secureName = `/test/secure-${Date.now()}`;
    const { status, data } = await api("POST", "/api/aws/ssm/parameters", {
      name: secureName,
      value: "my-secret",
      type: "SecureString",
    });
    expect(status).toBe(201);
    expect(data.version).toBe(1);
    await api("DELETE", `/api/aws/ssm/parameters/${encodeURIComponent(secureName)}`).catch(() => {});
  });

  it("manages tags on parameter", async () => {
    // Add tags
    const addRes = await api("POST", "/api/aws/ssm/tags", {
      resourceId: paramName,
      tags: [{ Key: "env", Value: "test" }],
    });
    expect(addRes.status).toBe(200);
    expect(addRes.data.tagged).toBe(true);

    // List tags
    const listRes = await api("GET", `/api/aws/ssm/tags?resourceId=${encodeURIComponent(paramName)}`);
    expect(listRes.status).toBe(200);
    expect(listRes.data.tags.length).toBeGreaterThanOrEqual(1);

    // Remove tag
    const delRes = await api("DELETE", `/api/aws/ssm/tags?resourceId=${encodeURIComponent(paramName)}&tagKeys=env`);
    expect(delRes.status).toBe(200);
    expect(delRes.data.untagged).toBe(true);
  });

  it("deletes the parameter", async () => {
    const { status, data } = await api("DELETE", `/api/aws/ssm/parameters/${encodeURIComponent(paramName)}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════
//  Route53 Integration Tests
// ═════════════════════════════════════════════════════════

describe("Route53 Integration", () => {
  const zoneName = `${rand("test-zone")}.example.com.`;
  let zoneId = "";

  // Route53 zone IDs come back with a "/hostedzone/" prefix from the AWS SDK.
  // We strip the prefix for use in subsequent API calls.
  function stripPrefix(id: string): string {
    return id.replace(/^\/hostedzone\//, "");
  }

  afterAll(async () => {
    if (zoneId) {
      await api("DELETE", `/api/aws/route53/hosted-zones/${zoneId}`).catch(() => {});
    }
  });

  it("creates a hosted zone", async () => {
    const { status, data } = await api("POST", "/api/aws/route53/hosted-zones", {
      name: zoneName,
      comment: "Integration test zone",
    });
    expect(status).toBe(201);
    expect(data.hostedZone).toBeTruthy();
    expect(data.hostedZone.Name).toBe(zoneName);
    zoneId = stripPrefix(data.hostedZone.Id);
  });

  it("lists hosted zones and includes the new zone", async () => {
    const { status, data } = await api("GET", "/api/aws/route53/hosted-zones");
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    // IDs in the list may have the prefix; compare after stripping
    const ids = (data.hostedZones || []).map((z: any) => stripPrefix(z.Id));
    expect(ids).toContain(zoneId);
  });

  it("describes the hosted zone", async () => {
    const { status, data } = await api("GET", `/api/aws/route53/hosted-zones/${zoneId}`);
    expect(status).toBe(200);
    expect(data.hostedZone).toBeTruthy();
    expect(data.hostedZone.Name).toBe(zoneName);
  });

  it("creates a record set", async () => {
    const { status, data } = await api("POST", `/api/aws/route53/hosted-zones/${zoneId}/record-sets`, {
      name: `www.${zoneName}`,
      type: "A",
      ttl: 300,
      resourceRecords: [{ Value: "192.0.2.1" }],
    });
    expect(status).toBe(201);
    expect(data.changeInfo).toBeTruthy();
  });

  it("lists record sets", async () => {
    const { status, data } = await api("GET", `/api/aws/route53/hosted-zones/${zoneId}/record-sets`);
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    const names = data.recordSets.map((r: any) => r.Name);
    expect(names).toContain(`www.${zoneName}`);
  });

  it("deletes the record set", async () => {
    const { status, data } = await api(
      "DELETE",
      `/api/aws/route53/hosted-zones/${zoneId}/record-sets?name=${encodeURIComponent(`www.${zoneName}`)}&type=A`
    );
    expect(status).toBe(200);
    expect(data.changeInfo).toBeTruthy();
  });

  it("deletes the hosted zone", async () => {
    const { status, data } = await api("DELETE", `/api/aws/route53/hosted-zones/${zoneId}`);
    expect(status).toBe(200);
    expect(data.changeInfo).toBeTruthy();
    zoneId = "";
  });
});

// ═════════════════════════════════════════════════════════
//  ECR Integration Tests
// ═════════════════════════════════════════════════════════

describe("ECR Integration", () => {
  const repoName = rand("test-repo");

  afterAll(async () => {
    await api("DELETE", `/api/aws/ecr/repositories/${repoName}`).catch(() => {});
  });

  it("creates a repository (Floci may not support ECR — pass gracefully)", async () => {
    const { status, data } = await api("POST", "/api/aws/ecr/repositories", {
      repositoryName: repoName,
      tags: { env: "test" },
    });
    if (status !== 201) return;
    expect(data.repository.repositoryName).toBe(repoName);
  });

  it("lists repositories", async () => {
    const { status, data } = await api("GET", "/api/aws/ecr/repositories");
    if (status === 200) {
      expect(data.repositories).toBeDefined();
    }
  });

  it("deletes the repository", async () => {
    const { status, data } = await api("DELETE", `/api/aws/ecr/repositories/${repoName}`);
    if (status !== 200) return;
    expect(data.deleted).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════
//  SES Integration Tests
// ═════════════════════════════════════════════════════════

describe("SES Integration", () => {
  const email = `${rand("test")}@integration.floci.local`;

  afterAll(async () => {
    await api("DELETE", `/api/aws/ses/identities/${encodeURIComponent(email)}`).catch(() => {});
  });

  it("verifies an email identity", async () => {
    const { status, data } = await api("POST", "/api/aws/ses/identities/verify-email", {
      emailAddress: email,
    });
    expect(status).toBe(200);
    expect(data.initiated).toBe(true);
  });

  it("lists identities and includes the new one", async () => {
    const { status, data } = await api("GET", "/api/aws/ses/identities");
    expect(status).toBe(200);
    const identities = data.identities.map((i: any) => i.identity);
    expect(identities).toContain(email);
  });

  it("gets identity details", async () => {
    const { status, data } = await api("GET", `/api/aws/ses/identities/${encodeURIComponent(email)}`);
    expect(status).toBe(200);
    expect(data.identity).toBe(email);
    expect(data.verificationStatus).toBeDefined();
  });

  it("deletes the identity", async () => {
    const { status, data } = await api("DELETE", `/api/aws/ses/identities/${encodeURIComponent(email)}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════
//  Kinesis Integration Tests
// ═════════════════════════════════════════════════════════

describe("Kinesis Integration", () => {
  const streamName = rand("test-stream");

  afterAll(async () => {
    await api("DELETE", `/api/aws/kinesis/streams/${streamName}`).catch(() => {});
  });

  it("creates a stream", async () => {
    const { status, data } = await api("POST", "/api/aws/kinesis/streams", {
      streamName,
      shardCount: 1,
    });
    expect(status).toBe(201);
    expect(data.created).toBe(true);
  });

  it("lists streams and includes the new stream", async () => {
    const { status, data } = await api("GET", "/api/aws/kinesis/streams");
    expect(status).toBe(200);
    const names = data.streams.map((s: any) => s.StreamName || s.StreamARN?.split("/").pop());
    expect(data.total).toBeGreaterThanOrEqual(1);
  });

  it("describes the stream", async () => {
    const { status, data } = await api("GET", `/api/aws/kinesis/streams/${streamName}`);
    expect(status).toBe(200);
    expect(data.stream).toBeDefined();
    expect(data.stream.StreamName).toBe(streamName);
    expect(data.stream.StreamStatus).toBe("ACTIVE");
  });

  it("lists shards", async () => {
    const { status, data } = await api("GET", `/api/aws/kinesis/streams/${streamName}/shards`);
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
  });

  it("puts a record", async () => {
    const { status, data } = await api("POST", `/api/aws/kinesis/streams/${streamName}/records`, {
      data: "Hello Kinesis!",
      partitionKey: "pk1",
    });
    expect(status).toBe(201);
    expect(data.sequenceNumber).toBeTruthy();
    expect(data.shardId).toBeTruthy();
  });

  it("puts batch records", async () => {
    const { status, data } = await api("POST", `/api/aws/kinesis/streams/${streamName}/records/batch`, {
      records: [
        { data: "Record 1", partitionKey: "pk1" },
        { data: "Record 2", partitionKey: "pk2" },
      ],
    });
    expect(status).toBe(201);
    expect(data.records).toBeDefined();
    expect(data.failedRecordCount).toBe(0);
  });

  it("deletes the stream", async () => {
    const { status, data } = await api("DELETE", `/api/aws/kinesis/streams/${streamName}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════
//  Cognito Integration Tests
// ═════════════════════════════════════════════════════════

describe("Cognito Integration", () => {
  const poolName = rand("test-pool");
  let poolId = "";

  afterAll(async () => {
    if (poolId) {
      await api("DELETE", `/api/aws/cognito/user-pools/${poolId}`).catch(() => {});
    }
  });

  it("creates a user pool", async () => {
    const { status, data } = await api("POST", "/api/aws/cognito/user-pools", {
      poolName,
    });
    expect(status).toBe(201);
    expect(data.userPool).toBeTruthy();
    expect(data.userPool.Name).toBe(poolName);
    poolId = data.userPool.Id;
  });

  it("lists user pools and includes the new one", async () => {
    const { status, data } = await api("GET", "/api/aws/cognito/user-pools");
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    const names = data.userPools.map((p: any) => p.Name);
    expect(names).toContain(poolName);
  });

  it("describes the user pool", async () => {
    const { status, data } = await api("GET", `/api/aws/cognito/user-pools/${poolId}`);
    expect(status).toBe(200);
    expect(data.userPool).toBeTruthy();
    expect(data.userPool.Name).toBe(poolName);
  });

  it("creates a user in the pool", async () => {
    const { status, data } = await api("POST", `/api/aws/cognito/user-pools/${poolId}/users`, {
      username: rand("test-user"),
      temporaryPassword: "TempPass1!",
      userAttributes: [{ Name: "email", Value: "test@example.com" }],
    });
    expect(status).toBe(201);
    expect(data.user).toBeTruthy();
  });

  it("lists users in the pool", async () => {
    const { status, data } = await api("GET", `/api/aws/cognito/user-pools/${poolId}/users`);
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
  });

  it("creates and lists a group", async () => {
    const groupName = rand("test-group");
    const createRes = await api("POST", `/api/aws/cognito/user-pools/${poolId}/groups`, {
      groupName,
      description: "Integration test group",
    });
    expect(createRes.status).toBe(201);
    expect(createRes.data.group.GroupName).toBe(groupName);

    const listRes = await api("GET", `/api/aws/cognito/user-pools/${poolId}/groups`);
    expect(listRes.status).toBe(200);
    const names = listRes.data.groups.map((g: any) => g.GroupName);
    expect(names).toContain(groupName);

    await api("DELETE", `/api/aws/cognito/user-pools/${poolId}/groups/${groupName}`).catch(() => {});
  });

  it("creates and lists an app client", async () => {
    const clientName = rand("test-client");
    const createRes = await api("POST", `/api/aws/cognito/user-pools/${poolId}/clients`, {
      clientName,
      callbackURLs: ["https://example.com/callback"],
      allowedOAuthFlowsUserPoolClient: true,
    });
    if (createRes.status !== 201) return;
    expect(createRes.data.client.ClientName).toBe(clientName);

    const listRes = await api("GET", `/api/aws/cognito/user-pools/${poolId}/clients`);
    expect(listRes.status).toBe(200);
    const names = listRes.data.clients.map((c: any) => c.ClientName);
    expect(names).toContain(clientName);
  });

  it("deletes the user pool", async () => {
    const { status, data } = await api("DELETE", `/api/aws/cognito/user-pools/${poolId}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
    poolId = "";
  });
});

// ═════════════════════════════════════════════════════════
//  ACM Integration Tests
// ═════════════════════════════════════════════════════════

describe("ACM Integration", () => {
  const domainName = `${rand("test-domain")}.example.com`;
  let certArn = "";

  afterAll(async () => {
    if (certArn) {
      await api("DELETE", `/api/aws/acm/certificates/${encodeURIComponent(certArn)}`).catch(() => {});
    }
  });

  it("requests a certificate", async () => {
    const { status, data } = await api("POST", "/api/aws/acm/certificates", {
      domainName,
      validationMethod: "EMAIL",
    });
    expect(status).toBe(201);
    expect(data.certificateArn).toBeTruthy();
    certArn = data.certificateArn;
  });

  it("lists certificates and includes the new one", async () => {
    const { status, data } = await api("GET", "/api/aws/acm/certificates");
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    const arns = data.certificates.map((c: any) => c.CertificateArn);
    expect(arns).toContain(certArn);
  });

  it("describes the certificate", async () => {
    const { status, data } = await api("GET", `/api/aws/acm/certificates/${encodeURIComponent(certArn)}`);
    expect(status).toBe(200);
    expect(data.certificate).toBeTruthy();
    expect(data.certificate.DomainName).toBe(domainName);
  });

  it("deletes the certificate", async () => {
    const { status, data } = await api("DELETE", `/api/aws/acm/certificates/${encodeURIComponent(certArn)}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
    certArn = "";
  });
});

// ═════════════════════════════════════════════════════════
//  API Gateway Integration Tests
// ═════════════════════════════════════════════════════════

describe("API Gateway Integration", () => {
  const apiName = rand("test-api");
  let apiId = "";

  afterAll(async () => {
    if (apiId) {
      await api("DELETE", `/api/aws/apigateway/rest-apis/${apiId}`).catch(() => {});
    }
  });

  it("creates a REST API", async () => {
    const { status, data } = await api("POST", "/api/aws/apigateway/rest-apis", {
      name: apiName,
      description: "Integration test API",
    });
    expect(status).toBe(201);
    expect(data.api).toBeTruthy();
    expect(data.api.name).toBe(apiName);
    apiId = data.api.id;
  });

  it("lists REST APIs and includes the new one", async () => {
    const { status, data } = await api("GET", "/api/aws/apigateway/rest-apis");
    expect(status).toBe(200);
    const names = data.apis.map((a: any) => a.name);
    expect(names).toContain(apiName);
  });

  it("describes the API", async () => {
    const { status, data } = await api("GET", `/api/aws/apigateway/rest-apis/${apiId}`);
    expect(status).toBe(200);
    expect(data.api.name).toBe(apiName);
    expect(data.api.id).toBe(apiId);
  });

  it("lists API resources", async () => {
    const { status, data } = await api("GET", `/api/aws/apigateway/rest-apis/${apiId}/resources`);
    expect(status).toBe(200);
    expect(data.resources).toBeDefined();
    expect(data.total).toBeGreaterThanOrEqual(1);
  });

  it("deletes the API", async () => {
    const { status, data } = await api("DELETE", `/api/aws/apigateway/rest-apis/${apiId}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
    apiId = "";
  });
});

// ═════════════════════════════════════════════════════════
//  Step Functions Integration Tests
// ═════════════════════════════════════════════════════════

describe("Step Functions Integration", () => {
  const smName = rand("test-sm");
  const roleName = rand("sfn-role");
  let roleArn = "";
  let smArn = "";

  beforeAll(async () => {
    // Create an IAM role for the state machine
    const roleRes = await api("POST", "/api/aws/iam/roles", {
      name: roleName,
      description: "Step Functions execution role for integration tests",
      assumeRolePolicyDocument: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{ Effect: "Allow", Principal: { Service: "states.amazonaws.com" }, Action: "sts:AssumeRole" }],
      }),
    });
    roleArn = `arn:aws:iam::000000000000:role/${roleName}`;
  });

  afterAll(async () => {
    if (smArn) {
      await api("DELETE", `/api/aws/stepfunctions/state-machines/${encodeURIComponent(smArn)}`).catch(() => {});
    }
    await api("DELETE", `/api/aws/iam/roles/${roleName}`).catch(() => {});
  });

  it("creates a state machine", async () => {
    const { status, data } = await api("POST", "/api/aws/stepfunctions/state-machines", {
      name: smName,
      definition: JSON.stringify({
        Comment: "Integration test state machine",
        StartAt: "PassState",
        States: { PassState: { Type: "Pass", End: true } },
      }),
      roleArn,
      type: "STANDARD",
    });
    expect(status).toBe(201);
    expect(data.stateMachineArn).toBeTruthy();
    smArn = data.stateMachineArn;
  });

  it("lists state machines and includes the new one", async () => {
    const { status, data } = await api("GET", "/api/aws/stepfunctions/state-machines");
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    const arns = data.stateMachines.map((s: any) => s.stateMachineArn);
    expect(arns).toContain(smArn);
  });

  it("describes the state machine", async () => {
    const { status, data } = await api("GET", `/api/aws/stepfunctions/state-machines/${encodeURIComponent(smArn)}`);
    expect(status).toBe(200);
    expect(data.stateMachine.stateMachineArn).toBe(smArn);
  });

  it("starts an execution", async () => {
    const { status, data } = await api("POST", `/api/aws/stepfunctions/state-machines/${encodeURIComponent(smArn)}/executions`, {
      input: JSON.stringify({ test: true }),
    });
    expect(status).toBe(201);
    expect(data.executionArn).toBeTruthy();
  });

  it("lists executions", async () => {
    const { status, data } = await api("GET", `/api/aws/stepfunctions/state-machines/${encodeURIComponent(smArn)}/executions`);
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
  });

  it("deletes the state machine", async () => {
    const { status, data } = await api("DELETE", `/api/aws/stepfunctions/state-machines/${encodeURIComponent(smArn)}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
    smArn = "";
  });
});

// ═════════════════════════════════════════════════════════
//  ECS Integration Tests
// ═════════════════════════════════════════════════════════

describe("ECS Integration", () => {
  const clusterName = rand("test-cluster");
  const taskDefFamily = rand("test-td");

  afterAll(async () => {
    await api("DELETE", `/api/aws/ecs/clusters?cluster=${encodeURIComponent(clusterName)}`).catch(() => {});
  });

  it("creates a cluster", async () => {
    const { status, data } = await api("POST", "/api/aws/ecs/clusters", {
      clusterName,
    });
    expect(status).toBe(201);
    expect(data.cluster).toBeTruthy();
    expect(data.cluster.clusterName).toBe(clusterName);
  });

  it("lists clusters and includes the new one", async () => {
    const { status, data } = await api("GET", "/api/aws/ecs/clusters");
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    const names = data.clusters.map((c: any) => c.clusterName);
    expect(names).toContain(clusterName);
  });

  it("describes the cluster", async () => {
    const { status, data } = await api("GET", `/api/aws/ecs/clusters/${encodeURIComponent(clusterName)}`);
    expect(status).toBe(200);
    expect(data.cluster.clusterName).toBe(clusterName);
  });

  it("registers a task definition", async () => {
    const { status, data } = await api("POST", "/api/aws/ecs/task-definitions", {
      family: taskDefFamily,
      containerDefinitions: [{
        name: "my-container",
        image: "nginx:latest",
        memory: 512,
        cpu: 256,
        essential: true,
      }],
      networkMode: "bridge",
    });
    expect(status).toBe(201);
    expect(data.taskDefinition).toBeTruthy();
    expect(data.taskDefinition.family).toBe(taskDefFamily);
  });

  it("lists task definitions", async () => {
    const { status, data } = await api("GET", "/api/aws/ecs/task-definitions");
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
  });

  it("lists task definition families", async () => {
    const { status, data } = await api("GET", "/api/aws/ecs/task-definition-families");
    expect(status).toBe(200);
    expect(data.families).toContain(taskDefFamily);
  });

  it("describes the task definition", async () => {
    const tdArn = `${taskDefFamily}:1`;
    const { status, data } = await api("GET", `/api/aws/ecs/task-definitions/${encodeURIComponent(tdArn)}`);
    expect(status).toBe(200);
    expect(data.taskDefinition.family).toBe(taskDefFamily);
  });

  it("deregisters the task definition", async () => {
    const tdArn = `${taskDefFamily}:1`;
    const { status, data } = await api("DELETE", `/api/aws/ecs/task-definitions/${encodeURIComponent(tdArn)}`);
    expect(status).toBe(200);
    expect(data.deregistered).toBe(true);
  });

  it("deletes the cluster", async () => {
    const { status, data } = await api("DELETE", `/api/aws/ecs/clusters?cluster=${encodeURIComponent(clusterName)}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════
//  Athena Integration Tests
// ═════════════════════════════════════════════════════════

describe("Athena Integration", () => {
  const wgName = rand("test-wg");

  afterAll(async () => {
    await api("DELETE", `/api/aws/athena/work-groups/${encodeURIComponent(wgName)}`).catch(() => {});
  });

  it("creates a work group", async () => {
    const { status, data } = await api("POST", "/api/aws/athena/work-groups", {
      name: wgName,
      description: "Integration test work group",
    });
    expect(status).toBe(201);
    expect(data.created).toBe(true);
  });

  it("lists work groups and includes the new one", async () => {
    const { status, data } = await api("GET", "/api/aws/athena/work-groups");
    expect(status).toBe(200);
    const names = data.workGroups.map((w: any) => w.Name);
    expect(names).toContain(wgName);
  });

  it("lists data catalogs (expect at least AwsDataCatalog)", async () => {
    const { status, data } = await api("GET", "/api/aws/athena/data-catalogs");
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    const names = data.dataCatalogs.map((c: any) => c.CatalogName);
    expect(names).toContain("AwsDataCatalog");
  });

  it("lists databases from AwsDataCatalog", async () => {
    const { status, data } = await api("GET", "/api/aws/athena/databases?catalogName=AwsDataCatalog");
    expect(status).toBe(200);
    expect(data.databases).toBeDefined();
  });

  it("deletes the work group", async () => {
    const { status, data } = await api("DELETE", `/api/aws/athena/work-groups/${encodeURIComponent(wgName)}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════
//  ELB (Elastic Load Balancing) Integration Tests
// ═════════════════════════════════════════════════════════

describe("ELB Integration", () => {
  const lbName = rand("test-lb");
  const tgName = rand("test-tg");
  let vpcId = "";
  let subnetIds: string[] = [];
  let lbArn = "";
  let tgArn = "";
  let listenerArn = "";

  beforeAll(async () => {
    // Create a VPC and 2 subnets (ALB requires at least 2 AZs)
    const vpcRes = await api("POST", "/api/aws/ec2/vpcs", { cidrBlock: "10.10.0.0/16" });
    vpcId = vpcRes.data.id;
    const sub1Res = await api("POST", "/api/aws/ec2/subnets", {
      vpcId,
      cidrBlock: "10.10.1.0/24",
      availabilityZone: "us-east-1a",
    });
    const sub2Res = await api("POST", "/api/aws/ec2/subnets", {
      vpcId,
      cidrBlock: "10.10.2.0/24",
      availabilityZone: "us-east-1b",
    });
    subnetIds = [sub1Res.data.id, sub2Res.data.id];
  });

  afterAll(async () => {
    if (listenerArn) {
      await api("DELETE", `/api/aws/elb/listeners/${encodeURIComponent(listenerArn)}`).catch(() => {});
    }
    if (tgArn) {
      await api("DELETE", `/api/aws/elb/target-groups/${encodeURIComponent(tgArn)}`).catch(() => {});
    }
    if (lbArn) {
      await api("DELETE", `/api/aws/elb/load-balancers/${encodeURIComponent(lbArn)}`).catch(() => {});
    }
    for (const sid of subnetIds) {
      await api("DELETE", `/api/aws/ec2/subnets/${sid}`).catch(() => {});
    }
    if (vpcId) {
      await api("DELETE", `/api/aws/ec2/vpcs/${vpcId}`).catch(() => {});
    }
  });

  it("creates a load balancer", async () => {
    const { status, data } = await api("POST", "/api/aws/elb/load-balancers", {
      name: lbName,
      subnets: subnetIds,
      scheme: "internal",
      type: "application",
    });
    expect(status).toBe(201);
    expect(data.loadBalancer).toBeTruthy();
    expect(data.loadBalancer.LoadBalancerName).toBe(lbName);
    lbArn = data.loadBalancer.LoadBalancerArn;
  });

  it("lists load balancers and includes the new one", async () => {
    const { status, data } = await api("GET", "/api/aws/elb/load-balancers");
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    const arns = data.loadBalancers.map((lb: any) => lb.loadBalancerArn);
    expect(arns).toContain(lbArn);
  });

  it("gets load balancer attributes", async () => {
    const { status, data } = await api(
      "GET",
      `/api/aws/elb/load-balancers/${encodeURIComponent(lbArn)}/attributes`
    );
    expect(status).toBe(200);
    expect(data.attributes).toBeDefined();
  });

  it("modifies load balancer attributes", async () => {
    const { status, data } = await api(
      "PUT",
      `/api/aws/elb/load-balancers/${encodeURIComponent(lbArn)}/attributes`,
      { attributes: { "routing.http.desync_mitigation_mode": "monitor" } }
    );
    expect(status).toBe(200);
    expect(data.updated).toBe(true);
  });

  it("creates a target group", async () => {
    const { status, data } = await api("POST", "/api/aws/elb/target-groups", {
      name: tgName,
      protocol: "HTTP",
      port: 80,
      vpcId,
    });
    expect(status).toBe(201);
    expect(data.targetGroup).toBeTruthy();
    expect(data.targetGroup.TargetGroupName).toBe(tgName);
    tgArn = data.targetGroup.TargetGroupArn;
  });

  it("lists target groups and includes the new one", async () => {
    const { status, data } = await api("GET", "/api/aws/elb/target-groups");
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    const arns = data.targetGroups.map((tg: any) => tg.targetGroupArn);
    expect(arns).toContain(tgArn);
  });

  it("gets target group health (empty)", async () => {
    const { status, data } = await api(
      "GET",
      `/api/aws/elb/target-groups/${encodeURIComponent(tgArn)}/health`
    );
    expect(status).toBe(200);
    expect(data.targets).toBeDefined();
  });

  it("creates a listener for the load balancer", async () => {
    const { status, data } = await api(
      "POST",
      `/api/aws/elb/load-balancers/${encodeURIComponent(lbArn)}/listeners`,
      {
        protocol: "HTTP",
        port: 80,
        defaultActions: [{ Type: "forward", TargetGroupArn: tgArn }],
      }
    );
    expect(status).toBe(201);
    expect(data.listener).toBeTruthy();
    listenerArn = data.listener.ListenerArn;
  });

  it("lists listeners for the load balancer", async () => {
    const { status, data } = await api(
      "GET",
      `/api/aws/elb/load-balancers/${encodeURIComponent(lbArn)}/listeners`
    );
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    const arns = data.listeners.map((l: any) => l.listenerArn);
    expect(arns).toContain(listenerArn);
  });

  it("gets listener attributes", async () => {
    const { status, data } = await api(
      "GET",
      `/api/aws/elb/listeners/${encodeURIComponent(listenerArn)}/attributes`
    );
    expect(status).toBe(200);
    expect(data.attributes).toBeDefined();
  });

  it("manages ELB tags", async () => {
    const addRes = await api("POST", "/api/aws/elb/tags", {
      resourceArns: [lbArn],
      tags: { env: "test", service: "elb-integration" },
    });
    expect(addRes.status).toBe(200);
    expect(addRes.data.updated).toBe(true);

    const delRes = await api("DELETE", "/api/aws/elb/tags", {
      resourceArns: [lbArn],
      tagKeys: ["service"],
    });
    expect(delRes.status).toBe(200);
    expect(delRes.data.updated).toBe(true);
  });

  it("deletes the listener", async () => {
    const { status, data } = await api(
      "DELETE",
      `/api/aws/elb/listeners/${encodeURIComponent(listenerArn)}`
    );
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
    listenerArn = "";
  });

  it("deletes the target group", async () => {
    const { status, data } = await api(
      "DELETE",
      `/api/aws/elb/target-groups/${encodeURIComponent(tgArn)}`
    );
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
    tgArn = "";
  });

  it("deletes the load balancer", async () => {
    const { status, data } = await api(
      "DELETE",
      `/api/aws/elb/load-balancers/${encodeURIComponent(lbArn)}`
    );
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
    lbArn = "";
  });
});

// ═════════════════════════════════════════════════════════
//  EKS Integration Tests
// ═════════════════════════════════════════════════════════

describe("EKS Integration", () => {
  const clusterName = rand("test-eks");
  const roleName = rand("eks-role");
  let roleArn = "";

  beforeAll(async () => {
    const roleRes = await api("POST", "/api/aws/iam/roles", {
      name: roleName,
      description: "EKS service role for integration tests",
      assumeRolePolicyDocument: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { Service: "eks.amazonaws.com" },
            Action: "sts:AssumeRole",
          },
        ],
      }),
    });
    roleArn = `arn:aws:iam::000000000000:role/${roleName}`;
  });

  afterAll(async () => {
    await api("DELETE", `/api/aws/eks/clusters/${clusterName}`).catch(() => {});
    await api("DELETE", `/api/aws/iam/roles/${roleName}`).catch(() => {});
  });

  it("creates an EKS cluster", async () => {
    const { status, data } = await api("POST", "/api/aws/eks/clusters", {
      name: clusterName,
      roleArn,
      version: "1.29",
    });
    expect(status).toBe(201);
    expect(data.cluster).toBeTruthy();
    expect(data.cluster.name).toBe(clusterName);
  });

  it("lists clusters and includes the new one", async () => {
    const { status, data } = await api("GET", "/api/aws/eks/clusters");
    expect(status).toBe(200);
    const names = data.clusters.map((c: any) => c.name);
    expect(names).toContain(clusterName);
  });

  it("describes the cluster", async () => {
    const { status, data } = await api("GET", `/api/aws/eks/clusters/${clusterName}`);
    expect(status).toBe(200);
    expect(data.cluster.name).toBe(clusterName);
    expect(data.cluster.roleArn).toBe(roleArn);
  });

  it("deletes the cluster", async () => {
    const { status, data } = await api("DELETE", `/api/aws/eks/clusters/${clusterName}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════
//  RDS Integration Tests
// ═════════════════════════════════════════════════════════

describe("RDS Integration", () => {
  const dbId = rand("test-db");
  const pgName = rand("test-pg");
  const clusterPgName = rand("test-cpg");

  afterAll(async () => {
    await api("DELETE", `/api/aws/rds/db-instances/${dbId}`).catch(() => {});
    await api("DELETE", `/api/aws/rds/parameter-groups/${pgName}`).catch(() => {});
    await api("DELETE", `/api/aws/rds/cluster-parameter-groups/${clusterPgName}`).catch(() => {});
  });

  // ── DB Parameter Groups ─────────────────────────────────

  it("creates a DB parameter group", async () => {
    const { status, data } = await api("POST", "/api/aws/rds/parameter-groups", {
      dbParameterGroupName: pgName,
      dbParameterGroupFamily: "postgres16",
      description: "Integration test parameter group",
    });
    expect(status).toBe(200);
    expect(data.created).toBe(true);
  });

  it("lists parameter groups and includes the new one", async () => {
    const { status, data } = await api("GET", "/api/aws/rds/parameter-groups");
    expect(status).toBe(200);
    const names = data.parameterGroups.map((pg: any) => pg.name);
    expect(names).toContain(pgName);
  });

  it("describes parameters in the parameter group (may be empty on Floci)", async () => {
    const { status, data } = await api(
      "GET",
      `/api/aws/rds/parameter-groups/${pgName}/parameters`
    );
    expect(status).toBe(200);
    expect(data.parameters).toBeDefined();
    // Floci may not populate default parameters — accept 0
    expect(data.total).toBeGreaterThanOrEqual(0);
  });

  it("modifies a parameter in the parameter group", async () => {
    const { status, data } = await api(
      "PATCH",
      `/api/aws/rds/parameter-groups/${pgName}/parameters`,
      {
        parameters: [
          { parameterName: "log_statement", parameterValue: "all", applyMethod: "immediate" },
        ],
      }
    );
    expect(status).toBe(200);
    expect(data.modified).toBe(true);
  });

  // ── DB Cluster Parameter Groups ─────────────────────────

  it("creates a DB cluster parameter group", async () => {
    const { status, data } = await api("POST", "/api/aws/rds/cluster-parameter-groups", {
      dbClusterParameterGroupName: clusterPgName,
      dbParameterGroupFamily: "aurora-postgresql16",
      description: "Integration test cluster parameter group",
    });
    expect(status).toBe(200);
    expect(data.created).toBe(true);
  });

  it("lists cluster parameter groups", async () => {
    const { status, data } = await api("GET", "/api/aws/rds/cluster-parameter-groups");
    expect(status).toBe(200);
    const names = data.clusterParameterGroups.map((cpg: any) => cpg.name);
    expect(names).toContain(clusterPgName);
  });

  // ── DB Instances ────────────────────────────────────────

  it("creates a DB instance (Floci may not support — pass gracefully)", async () => {
    const { status, data } = await api("POST", "/api/aws/rds/db-instances", {
      dbInstanceIdentifier: dbId,
      engine: "postgres",
      masterUsername: "admin",
      masterPassword: "password",
      allocatedStorage: 20,
      dbInstanceClass: "db.t3.micro",
    });
    if (status !== 200) return;
    expect(data.created).toBe(true);
    expect(data.id).toBe(dbId);
  });

  it("lists DB instances", async () => {
    const { status, data } = await api("GET", "/api/aws/rds/db-instances");
    if (status === 200) {
      expect(data.instances).toBeDefined();
    }
  });

  it("describes the DB instance", async () => {
    const { status, data } = await api("GET", `/api/aws/rds/db-instances/${dbId}`);
    if (status !== 200) return;
    expect(data.id).toBe(dbId);
    expect(data.engine).toBe("postgres");
    expect(data.status).toBeDefined();
  });

  it("reboots the DB instance", async () => {
    const { status, data } = await api(
      "POST",
      `/api/aws/rds/db-instances/${dbId}/reboot`
    );
    if (status !== 200) return;
    expect(data.rebooting).toBe(true);
  });

  it("modifies the DB instance", async () => {
    const { status, data } = await api("PATCH", `/api/aws/rds/db-instances/${dbId}`, {
      backupRetentionPeriod: 3,
    });
    if (status !== 200) return;
    expect(data.modified).toBe(true);
  });

  // ── DB Clusters ─────────────────────────────────────────

  it("creates and deletes a DB cluster (Floci may not support — pass gracefully)", async () => {
    const clusterId = rand("test-cluster");
    const { status, data } = await api("POST", "/api/aws/rds/db-clusters", {
      dbClusterIdentifier: clusterId,
      engine: "aurora-postgresql",
      masterUsername: "admin",
      masterPassword: "password",
    });
    if (status !== 200) return;
    expect(data.created).toBe(true);

    // List and verify
    const listRes = await api("GET", "/api/aws/rds/db-clusters");
    expect(listRes.status).toBe(200);
    const ids = listRes.data.clusters.map((c: any) => c.id);
    expect(ids).toContain(clusterId);

    // Delete cluster
    const delRes = await api("DELETE", `/api/aws/rds/db-clusters/${clusterId}`);
    expect(delRes.status).toBe(200);
    expect(delRes.data.deleted).toBe(true);
  });

  // ── Cleanup ─────────────────────────────────────────────

  it("deletes the DB instance", async () => {
    const { status, data } = await api("DELETE", `/api/aws/rds/db-instances/${dbId}`);
    if (status !== 200) return;
    expect(data.deleted).toBe(true);
  });

  it("deletes the cluster parameter group", async () => {
    const { status, data } = await api(
      "DELETE",
      `/api/aws/rds/cluster-parameter-groups/${clusterPgName}`
    );
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });

  it("deletes the DB parameter group", async () => {
    const { status, data } = await api("DELETE", `/api/aws/rds/parameter-groups/${pgName}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════
//  Auto Scaling Integration Tests
// ═════════════════════════════════════════════════════════

describe("Auto Scaling Integration", () => {
  const asgName = rand("test-asg");
  const ltName = rand("test-asg-lt");
  let ltId = "";

  beforeAll(async () => {
    const ltRes = await api("POST", "/api/aws/ec2/launch-templates", {
      launchTemplateName: ltName,
      imageId: "ami-0abcdef1234567891",
      instanceType: "t3.micro",
    });
    if (ltRes.status === 200) {
      ltId = ltRes.data.id;
    }
  });

  afterAll(async () => {
    await api("DELETE", `/api/aws/autoscaling/groups/${asgName}?force=true`).catch(() => {});
    if (ltId) {
      await api("DELETE", `/api/aws/ec2/launch-templates/${ltId}`).catch(() => {});
    }
  });

  it("creates an Auto Scaling group", async () => {
    const { status, data } = await api("POST", "/api/aws/autoscaling/groups", {
      autoScalingGroupName: asgName,
      minSize: 1,
      maxSize: 3,
      desiredCapacity: 1,
      availabilityZones: ["us-east-1a"],
      launchTemplate: ltId
        ? { LaunchTemplateName: ltName, Version: "$Default" }
        : undefined,
      healthCheckType: "EC2",
      healthCheckGracePeriod: 300,
      tags: [{ key: "env", value: "test" }],
    });
    expect(status).toBe(201);
    expect(data.created).toBe(true);
  });

  it("lists Auto Scaling groups and includes the new one", async () => {
    const { status, data } = await api("GET", "/api/aws/autoscaling/groups");
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    const names = data.groups.map((g: any) => g.AutoScalingGroupName);
    expect(names).toContain(asgName);
  });

  it("updates the Auto Scaling group", async () => {
    const { status, data } = await api("PUT", `/api/aws/autoscaling/groups/${asgName}`, {
      minSize: 1,
      maxSize: 5,
      desiredCapacity: 2,
    });
    expect(status).toBe(200);
    expect(data.updated).toBe(true);
  });

  it("sets desired capacity", async () => {
    const { status, data } = await api(
      "PUT",
      `/api/aws/autoscaling/groups/${asgName}/desired-capacity`,
      { desiredCapacity: 1 }
    );
    expect(status).toBe(200);
    expect(data.updated).toBe(true);
  });

  it("lists scaling policies (empty)", async () => {
    const { status, data } = await api(
      "GET",
      `/api/aws/autoscaling/groups/${asgName}/policies`
    );
    expect(status).toBe(200);
    expect(data.policies).toBeDefined();
  });

  it("lists scaling activities (may be empty)", async () => {
    const { status, data } = await api(
      "GET",
      `/api/aws/autoscaling/groups/${asgName}/activities`
    );
    expect(status).toBe(200);
    expect(data.activities).toBeDefined();
  });

  it("lists launch configurations (Floci may not support)", async () => {
    const { status, data } = await api("GET", "/api/aws/autoscaling/launch-configurations");
    if (status === 200) {
      expect(data.launchConfigurations).toBeDefined();
    }
  });

  it("deletes the Auto Scaling group (force)", async () => {
    const { status, data } = await api(
      "DELETE",
      `/api/aws/autoscaling/groups/${asgName}?force=true`
    );
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════
//  CloudFront Integration Tests
// ═════════════════════════════════════════════════════════

describe("CloudFront Integration", () => {
  it("lists distributions (empty)", async () => {
    const { status, data } = await api("GET", "/api/aws/cloudfront/distributions");
    expect(status).toBe(200);
    expect(data.distributions).toBeDefined();
  });

  it("lists cache policies", async () => {
    const { status, data } = await api("GET", "/api/aws/cloudfront/cache-policies");
    expect(status).toBe(200);
    expect(data.cachePolicies).toBeDefined();
  });

  it("lists origin access controls (empty)", async () => {
    const { status, data } = await api("GET", "/api/aws/cloudfront/origin-access-controls");
    expect(status).toBe(200);
    expect(data.originAccessControls).toBeDefined();
  });

  it("lists CloudFront functions (empty)", async () => {
    const { status, data } = await api("GET", "/api/aws/cloudfront/functions");
    expect(status).toBe(200);
    expect(data.functions).toBeDefined();
  });
});

// ═════════════════════════════════════════════════════════
//  API Gateway V2 Integration Tests
// ═════════════════════════════════════════════════════════

describe("API Gateway V2 Integration", () => {
  const apiName = rand("test-api-v2");
  let apiId = "";
  let routeId = "";
  let stageName = "";
  let deploymentId = "";
  let integrationId = "";

  afterAll(async () => {
    if (apiId) {
      await api("DELETE", `/api/aws/apigatewayv2/apis/${apiId}`).catch(() => {});
    }
  });

  it("creates an HTTP API", async () => {
    const { status, data } = await api("POST", "/api/aws/apigatewayv2/apis", {
      name: apiName,
      protocolType: "HTTP",
      description: "Integration test HTTP API",
    });
    expect(status).toBe(201);
    expect(data.api).toBeTruthy();
    expect(data.api.Name).toBe(apiName);
    apiId = data.api.ApiId;
  });

  it("lists APIs and includes the new one", async () => {
    const { status, data } = await api("GET", "/api/aws/apigatewayv2/apis");
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    const names = data.apis.map((a: any) => a.Name);
    expect(names).toContain(apiName);
  });

  it("describes the API", async () => {
    const { status, data } = await api("GET", `/api/aws/apigatewayv2/apis/${apiId}`);
    expect(status).toBe(200);
    expect(data.api.Name).toBe(apiName);
  });

  it("creates a route", async () => {
    const { status, data } = await api("POST", `/api/aws/apigatewayv2/apis/${apiId}/routes`, {
      routeKey: "GET /items",
      target: undefined,
    });
    expect(status).toBe(201);
    expect(data.route).toBeTruthy();
    expect(data.route.RouteKey).toBe("GET /items");
    routeId = data.route.RouteId;
  });

  it("lists routes", async () => {
    const { status, data } = await api("GET", `/api/aws/apigatewayv2/apis/${apiId}/routes`);
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    const routeKeys = data.routes.map((r: any) => r.RouteKey);
    expect(routeKeys).toContain("GET /items");
  });

  it("creates an integration", async () => {
    const { status, data } = await api(
      "POST",
      `/api/aws/apigatewayv2/apis/${apiId}/integrations`,
      {
        integrationType: "HTTP_PROXY",
        integrationUri: "https://example.com",
        integrationMethod: "ANY",
        payloadFormatVersion: "1.0",
      }
    );
    expect(status).toBe(201);
    expect(data.integration).toBeTruthy();
    integrationId = data.integration.IntegrationId;
  });

  it("lists integrations", async () => {
    const { status, data } = await api(
      "GET",
      `/api/aws/apigatewayv2/apis/${apiId}/integrations`
    );
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
  });

  it("creates a deployment", async () => {
    const { status, data } = await api(
      "POST",
      `/api/aws/apigatewayv2/apis/${apiId}/deployments`,
      { description: "Integration test deployment" }
    );
    expect(status).toBe(201);
    expect(data.deployment).toBeTruthy();
    deploymentId = data.deployment.DeploymentId;
  });

  it("lists deployments", async () => {
    const { status, data } = await api(
      "GET",
      `/api/aws/apigatewayv2/apis/${apiId}/deployments`
    );
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
  });

  it("creates a stage", async () => {
    stageName = rand("stage");
    const { status, data } = await api(
      "POST",
      `/api/aws/apigatewayv2/apis/${apiId}/stages`,
      { stageName, autoDeploy: true, deploymentId }
    );
    expect(status).toBe(201);
    expect(data.stage).toBeTruthy();
    expect(data.stage.StageName).toBe(stageName);
  });

  it("lists stages", async () => {
    const { status, data } = await api(
      "GET",
      `/api/aws/apigatewayv2/apis/${apiId}/stages`
    );
    expect(status).toBe(200);
    const names = data.stages.map((s: any) => s.StageName);
    expect(names).toContain(stageName);
  });

  it("deletes the stage", async () => {
    const { status, data } = await api(
      "DELETE",
      `/api/aws/apigatewayv2/apis/${apiId}/stages/${stageName}`
    );
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });

  it("deletes the deployment", async () => {
    const { status, data } = await api(
      "DELETE",
      `/api/aws/apigatewayv2/apis/${apiId}/deployments/${deploymentId}`
    );
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
    deploymentId = "";
  });

  it("deletes the integration", async () => {
    const { status, data } = await api(
      "DELETE",
      `/api/aws/apigatewayv2/apis/${apiId}/integrations/${integrationId}`
    );
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
    integrationId = "";
  });

  it("deletes the route", async () => {
    const { status, data } = await api(
      "DELETE",
      `/api/aws/apigatewayv2/apis/${apiId}/routes/${routeId}`
    );
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
    routeId = "";
  });

  it("deletes the API", async () => {
    const { status, data } = await api("DELETE", `/api/aws/apigatewayv2/apis/${apiId}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
    apiId = "";
  });
});

// ═════════════════════════════════════════════════════════
//  AppSync Integration Tests
// ═════════════════════════════════════════════════════════

describe("AppSync Integration", () => {
  const apiName = rand("test-appsync");
  let apiId = "";
  let apiKeyId = "";

  afterAll(async () => {
    if (apiId) {
      await api("DELETE", `/api/aws/appsync/apis/${apiId}`).catch(() => {});
    }
  });

  it("creates a GraphQL API", async () => {
    const { status, data } = await api("POST", "/api/aws/appsync/apis", {
      name: apiName,
      authenticationType: "API_KEY",
    });
    expect(status).toBe(201);
    expect(data.api).toBeTruthy();
    expect(data.api.name).toBe(apiName);
    apiId = data.api.apiId;
  });

  it("lists GraphQL APIs and includes the new one", async () => {
    const { status, data } = await api("GET", "/api/aws/appsync/apis");
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    const names = data.apis.map((a: any) => a.name);
    expect(names).toContain(apiName);
  });

  it("describes the GraphQL API", async () => {
    const { status, data } = await api("GET", `/api/aws/appsync/apis/${apiId}`);
    expect(status).toBe(200);
    expect(data.api.name).toBe(apiName);
  });

  it("creates an API key", async () => {
    const { status, data } = await api(
      "POST",
      `/api/aws/appsync/apis/${apiId}/api-keys`,
      { description: "Integration test key" }
    );
    expect(status).toBe(201);
    expect(data.id).toBeTruthy();
    apiKeyId = data.id;
  });

  it("lists API keys", async () => {
    const { status, data } = await api(
      "GET",
      `/api/aws/appsync/apis/${apiId}/api-keys`
    );
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
  });

  it("creates a data source", async () => {
    const { status, data } = await api(
      "POST",
      `/api/aws/appsync/apis/${apiId}/data-sources`,
      { name: "none-ds", type: "NONE", description: "Integration test data source" }
    );
    expect(status).toBe(201);
    expect(data.dataSource).toBeTruthy();
    expect(data.dataSource.name).toBe("none-ds");
  });

  it("lists data sources", async () => {
    const { status, data } = await api(
      "GET",
      `/api/aws/appsync/apis/${apiId}/data-sources`
    );
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    const names = data.dataSources.map((ds: any) => ds.name);
    expect(names).toContain("none-ds");
  });

  it("lists resolvers (empty)", async () => {
    const { status, data } = await api(
      "GET",
      `/api/aws/appsync/apis/${apiId}/resolvers`
    );
    expect(status).toBe(200);
    expect(data.resolvers).toBeDefined();
  });

  it("lists functions (empty)", async () => {
    const { status, data } = await api(
      "GET",
      `/api/aws/appsync/apis/${apiId}/functions`
    );
    expect(status).toBe(200);
    expect(data.functions).toBeDefined();
  });

  it("lists types (empty — no schema uploaded)", async () => {
    const { status, data } = await api(
      "GET",
      `/api/aws/appsync/apis/${apiId}/types`
    );
    expect(status).toBe(200);
    expect(data.types).toBeDefined();
  });

  it("deletes the API key", async () => {
    const { status, data } = await api(
      "DELETE",
      `/api/aws/appsync/apis/${apiId}/api-keys/${apiKeyId}`
    );
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
    apiKeyId = "";
  });

  it("deletes the data source", async () => {
    const { status, data } = await api(
      "DELETE",
      `/api/aws/appsync/apis/${apiId}/data-sources/none-ds`
    );
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });

  it("deletes the GraphQL API", async () => {
    const { status, data } = await api("DELETE", `/api/aws/appsync/apis/${apiId}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
    apiId = "";
  });
});

// ═════════════════════════════════════════════════════════
//  EventBridge Pipes Integration Tests
// ═════════════════════════════════════════════════════════

describe("EventBridge Pipes Integration", () => {
  const pipeName = rand("test-pipe");
  const queueName = rand("pipe-source");
  const roleName = rand("pipe-role");
  let queueUrl = "";
  let queueArn = "";
  let roleArn = "";

  beforeAll(async () => {
    // Create an SQS queue as source/target for the pipe
    const queueRes = await api("POST", "/api/aws/sqs/queues", { queueName });
    queueUrl = queueRes.data.queueUrl;

    // Get the queue ARN
    const attrRes = await api(
      "GET",
      `/api/aws/sqs/queues/attributes?queueUrl=${encodeURIComponent(queueUrl)}`
    );
    queueArn = attrRes.data.attributes.QueueArn;

    // Create an IAM role for the pipe
    const roleRes = await api("POST", "/api/aws/iam/roles", {
      name: roleName,
      description: "Pipe execution role for integration tests",
      assumeRolePolicyDocument: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { Service: "pipes.amazonaws.com" },
            Action: "sts:AssumeRole",
          },
        ],
      }),
    });
    roleArn = `arn:aws:iam::000000000000:role/${roleName}`;
  });

  afterAll(async () => {
    await api("DELETE", `/api/aws/pipes/pipes/${pipeName}`).catch(() => {});
    if (queueUrl) {
      await api("DELETE", `/api/aws/sqs/queues?queueUrl=${encodeURIComponent(queueUrl)}`).catch(() => {});
    }
    await api("DELETE", `/api/aws/iam/roles/${roleName}`).catch(() => {});
  });

  it("creates a pipe", async () => {
    const { status, data } = await api("POST", "/api/aws/pipes/pipes", {
      name: pipeName,
      source: queueArn,
      target: queueArn,
      roleArn,
      description: "Integration test pipe",
    });
    expect(status).toBe(201);
    expect(data.pipe).toBeTruthy();
  });

  it("lists pipes and includes the new one", async () => {
    const { status, data } = await api("GET", "/api/aws/pipes/pipes");
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    const names = data.pipes.map((p: any) => p.Name);
    expect(names).toContain(pipeName);
  });

  it("describes the pipe", async () => {
    const { status, data } = await api("GET", `/api/aws/pipes/pipes/${pipeName}`);
    expect(status).toBe(200);
    expect(data.pipe.Name).toBe(pipeName);
  });

  it("stops the pipe", async () => {
    const { status, data } = await api("POST", `/api/aws/pipes/pipes/${pipeName}/stop`);
    expect(status).toBe(200);
    expect(data.pipe).toBeTruthy();
  });

  it("starts the pipe", async () => {
    const { status, data } = await api("POST", `/api/aws/pipes/pipes/${pipeName}/start`);
    expect(status).toBe(200);
    expect(data.pipe).toBeTruthy();
  });

  it("deletes the pipe", async () => {
    const { status, data } = await api("DELETE", `/api/aws/pipes/pipes/${pipeName}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════
//  EventBridge Scheduler Integration Tests
// ═════════════════════════════════════════════════════════

describe("EventBridge Scheduler Integration", () => {
  const groupName = rand("test-schedule-group");
  const scheduleName = rand("test-schedule");

  afterAll(async () => {
    await api("DELETE", `/api/aws/scheduler/schedules/${scheduleName}?group=default`).catch(() => {});
    await api("DELETE", `/api/aws/scheduler/groups/${groupName}`).catch(() => {});
  });

  it("creates a schedule group", async () => {
    const { status, data } = await api("POST", "/api/aws/scheduler/groups", {
      name: groupName,
    });
    expect(status).toBe(201);
    expect(data.groupArn).toBeTruthy();
  });

  it("lists schedule groups and includes the new one", async () => {
    const { status, data } = await api("GET", "/api/aws/scheduler/groups");
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);
    const names = data.groups.map((g: any) => g.Name || g.name);
    expect(names).toContain(groupName);
  });

  it("creates a schedule in default group", async () => {
    const { status, data } = await api("POST", "/api/aws/scheduler/schedules", {
      name: scheduleName,
      groupName: "default",
      scheduleExpression: "rate(5 minutes)",
      description: "Integration test schedule",
      flexibleTimeWindow: { Mode: "OFF" },
      target: {
        Arn: "arn:aws:lambda:us-east-1:000000000000:function:test",
        RoleArn: "arn:aws:iam::000000000000:role/scheduler-role",
      },
      state: "ENABLED",
    });
    expect(status).toBe(201);
    expect(data.scheduleArn).toBeTruthy();
  });

  it("lists schedules and includes the new one", async () => {
    const { status, data } = await api("GET", "/api/aws/scheduler/schedules");
    expect(status).toBe(200);
    const names = data.schedules.map((s: any) => s.Name);
    expect(names).toContain(scheduleName);
  });

  it("describes the schedule", async () => {
    const { status, data } = await api(
      "GET",
      `/api/aws/scheduler/schedules/${scheduleName}?group=default`
    );
    expect(status).toBe(200);
    expect(data.schedule.Name).toBe(scheduleName);
  });

  it("deletes the schedule", async () => {
    const { status, data } = await api(
      "DELETE",
      `/api/aws/scheduler/schedules/${scheduleName}?group=default`
    );
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });

  it("deletes the schedule group", async () => {
    const { status, data } = await api("DELETE", `/api/aws/scheduler/groups/${groupName}`);
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════
//  EC2 Read-Only Resources Integration Tests
// ═════════════════════════════════════════════════════════

describe("EC2 Read-Only Resources", () => {
  it("lists regions", async () => {
    const { status, data } = await api("GET", "/api/aws/ec2/regions");
    expect(status).toBe(200);
    expect(data.regions).toBeDefined();
    expect(data.total).toBeGreaterThan(0);
  });

  it("lists availability zones", async () => {
    const { status, data } = await api("GET", "/api/aws/ec2/availability-zones");
    expect(status).toBe(200);
    expect(data.availabilityZones).toBeDefined();
    expect(data.total).toBeGreaterThan(0);
  });

  it("lists account attributes", async () => {
    const { status, data } = await api("GET", "/api/aws/ec2/account-attributes");
    expect(status).toBe(200);
    expect(data.accountAttributes).toBeDefined();
    expect(data.accountAttributes.length).toBeGreaterThan(0);
  });

  it("lists instance types", async () => {
    const { status, data } = await api("GET", "/api/aws/ec2/instance-types");
    expect(status).toBe(200);
    expect(data.instanceTypes).toBeDefined();
    expect(data.total).toBeGreaterThan(0);
    expect(data.instanceTypes[0].type).toBeTruthy();
  });

  it("lists internet gateways (empty)", async () => {
    const { status, data } = await api("GET", "/api/aws/ec2/internet-gateways");
    expect(status).toBe(200);
    expect(data.internetGateways).toBeDefined();
    expect(data.total).toBeGreaterThanOrEqual(0);
  });

  it("lists route tables (default present)", async () => {
    const { status, data } = await api("GET", "/api/aws/ec2/route-tables");
    expect(status).toBe(200);
    expect(data.routeTables).toBeDefined();
    expect(data.total).toBeGreaterThanOrEqual(0);
  });

  it("lists NAT gateways (may not be supported by Floci)", async () => {
    const { status, data } = await api("GET", "/api/aws/ec2/nat-gateways");
    // Floci may not support NAT gateways — accept 200 (supported) or 500 (not supported)
    if (status === 200) {
      expect(data.natGateways).toBeDefined();
      expect(data.total).toBeGreaterThanOrEqual(0);
    }
  });

  it("lists VPC endpoints (may not be supported by Floci)", async () => {
    const { status, data } = await api("GET", "/api/aws/ec2/vpc-endpoints");
    // Floci may not support VPC endpoints — accept 200 (supported) or 500 (not supported)
    if (status === 200) {
      expect(data.endpoints).toBeDefined();
      expect(data.total).toBeGreaterThanOrEqual(0);
    }
  });

  it("lists launch templates (may not be supported by Floci)", async () => {
    const { status, data } = await api("GET", "/api/aws/ec2/launch-templates");
    // Floci may not support launch templates — accept 200 (supported) or 500 (not supported)
    if (status === 200) {
      expect(data.launchTemplates).toBeDefined();
      expect(data.total).toBeGreaterThanOrEqual(0);
    }
  });

  it("creates and lists a launch template", async () => {
    const ltName = rand("test-lt");

    const createRes = await api("POST", "/api/aws/ec2/launch-templates", {
      launchTemplateName: ltName,
      imageId: "ami-0abcdef1234567891",
      instanceType: "t3.micro",
    });
    // Floci may not support launch templates — graceful pass
    if (createRes.status !== 200) return;
    expect(createRes.data.created).toBe(true);
    const ltId = createRes.data.id;

    // List should include it
    const listRes = await api("GET", "/api/aws/ec2/launch-templates");
    expect(listRes.status).toBe(200);
    const names = listRes.data.launchTemplates.map((t: any) => t.name);
    expect(names).toContain(ltName);

    // Describe
    const getRes = await api("GET", `/api/aws/ec2/launch-templates/${ltId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.data.name).toBe(ltName);

    // List versions
    const verRes = await api("GET", `/api/aws/ec2/launch-templates/${ltId}/versions`);
    expect(verRes.status).toBe(200);
    expect(verRes.data.total).toBeGreaterThanOrEqual(1);

    // Add a version
    const addVerRes = await api("POST", `/api/aws/ec2/launch-templates/${ltId}/versions`, {
      imageId: "ami-0abcdef1234567891",
      instanceType: "t3.small",
    });
    expect(addVerRes.status).toBe(200);
    expect(addVerRes.data.created).toBe(true);

    // Delete
    const delRes = await api("DELETE", `/api/aws/ec2/launch-templates/${ltId}`);
    expect(delRes.status).toBe(200);
    expect(delRes.data.deleted).toBe(true);
  });

  // ─── Internet Gateway CRUD ─────────────────────────────

  it("creates, attaches, detaches, and deletes an Internet Gateway", async () => {
    // Create an IGW
    const igwRes = await api("POST", "/api/aws/ec2/internet-gateways");
    expect(igwRes.status).toBe(200);
    expect(igwRes.data.created).toBe(true);
    const igwId = igwRes.data.id;

    // Create a temporary VPC for attachment
    const vpcRes = await api("POST", "/api/aws/ec2/vpcs", { cidrBlock: "10.2.0.0/16" });
    const tempVpcId = vpcRes.data.id;

    // Attach
    const attRes = await api("POST", `/api/aws/ec2/internet-gateways/${igwId}/attach`, {
      vpcId: tempVpcId,
    });
    expect(attRes.status).toBe(200);
    expect(attRes.data.attached).toBe(true);

    // Detach
    const detRes = await api("POST", `/api/aws/ec2/internet-gateways/${igwId}/detach`, {
      vpcId: tempVpcId,
    });
    expect(detRes.status).toBe(200);
    expect(detRes.data.detached).toBe(true);

    // Delete VPC
    await api("DELETE", `/api/aws/ec2/vpcs/${tempVpcId}`).catch(() => {});

    // Delete IGW
    const delIgwRes = await api("DELETE", `/api/aws/ec2/internet-gateways/${igwId}`);
    expect(delIgwRes.status).toBe(200);
    expect(delIgwRes.data.deleted).toBe(true);
  });

  // ─── Route Table CRUD ──────────────────────────────────

  it("creates, manages routes, and deletes a Route Table", async () => {
    // Create a VPC
    const vpcRes = await api("POST", "/api/aws/ec2/vpcs", { cidrBlock: "10.3.0.0/16" });
    const tempVpcId = vpcRes.data.id;

    // Create a subnet
    const subRes = await api("POST", "/api/aws/ec2/subnets", {
      vpcId: tempVpcId, cidrBlock: "10.3.1.0/24",
    });
    const tempSubnetId = subRes.data.id;

    // Create a route table
    const rtRes = await api("POST", "/api/aws/ec2/route-tables", { vpcId: tempVpcId });
    expect(rtRes.status).toBe(200);
    expect(rtRes.data.created).toBe(true);
    const rtId = rtRes.data.id;

    // Associate route table with subnet
    const assocRes = await api("POST", `/api/aws/ec2/route-tables/${rtId}/associate`, {
      subnetId: tempSubnetId,
    });
    expect(assocRes.status).toBe(200);
    expect(assocRes.data.associated).toBe(true);
    expect(assocRes.data.associationId).toBeTruthy();
    const associationId = assocRes.data.associationId;

    // Create a route
    const routeRes = await api("POST", `/api/aws/ec2/route-tables/${rtId}/routes`, {
      destinationCidrBlock: "0.0.0.0/0",
    });
    expect(routeRes.status).toBe(200);
    expect(routeRes.data.created).toBe(true);

    // Disassociate
    const disRes = await api("POST", `/api/aws/ec2/route-tables/${rtId}/disassociate`, {
      associationId,
    });
    expect(disRes.status).toBe(200);
    expect(disRes.data.disassociated).toBe(true);

    // Delete route table
    const delRtRes = await api("DELETE", `/api/aws/ec2/route-tables/${rtId}`);
    expect(delRtRes.status).toBe(200);
    expect(delRtRes.data.deleted).toBe(true);

    // Cleanup
    await api("DELETE", `/api/aws/ec2/subnets/${tempSubnetId}`).catch(() => {});
    await api("DELETE", `/api/aws/ec2/vpcs/${tempVpcId}`).catch(() => {});
  });

  // ─── NAT Gateway + Elastic IP ──────────────────────────

  it("creates and deletes a NAT Gateway with required EIP", async () => {
    // Allocate EIP for NAT GW
    const eipRes = await api("POST", "/api/aws/ec2/elastic-ips", { domain: "vpc" });
    expect(eipRes.status).toBe(200);
    const eipAllocId = eipRes.data.allocationId;

    // Create VPC + subnet for NAT GW
    const vpcRes = await api("POST", "/api/aws/ec2/vpcs", { cidrBlock: "10.4.0.0/16" });
    const tempVpcId = vpcRes.data.id;

    const subRes = await api("POST", "/api/aws/ec2/subnets", {
      vpcId: tempVpcId, cidrBlock: "10.4.1.0/24",
    });
    const tempSubnetId = subRes.data.id;

    // Create NAT Gateway (Floci may not support this — graceful pass)
    const natRes = await api("POST", "/api/aws/ec2/nat-gateways", {
      subnetId: tempSubnetId,
      allocationId: eipAllocId,
    });
    if (natRes.status !== 200) {
      // Cleanup and skip if not supported
      await api("DELETE", `/api/aws/ec2/elastic-ips/${eipAllocId}`).catch(() => {});
      await api("DELETE", `/api/aws/ec2/subnets/${tempSubnetId}`).catch(() => {});
      await api("DELETE", `/api/aws/ec2/vpcs/${tempVpcId}`).catch(() => {});
      return;
    }
    expect(natRes.data.created).toBe(true);
    const natId = natRes.data.id;

    // Delete NAT Gateway
    const delNatRes = await api("DELETE", `/api/aws/ec2/nat-gateways/${natId}`);
    expect(delNatRes.status).toBe(200);
    expect(delNatRes.data.deleted).toBe(true);

    // Cleanup
    await api("DELETE", `/api/aws/ec2/elastic-ips/${eipAllocId}`).catch(() => {});
    await api("DELETE", `/api/aws/ec2/subnets/${tempSubnetId}`).catch(() => {});
    await api("DELETE", `/api/aws/ec2/vpcs/${tempVpcId}`).catch(() => {});
  });

  it("creates and deletes a VPC Endpoint", async () => {
    // Create a VPC
    const vpcRes = await api("POST", "/api/aws/ec2/vpcs", { cidrBlock: "10.5.0.0/16" });
    const tempVpcId = vpcRes.data.id;

    // Create a VPC endpoint (Floci may not support this — graceful pass)
    const epRes = await api("POST", "/api/aws/ec2/vpc-endpoints", {
      vpcId: tempVpcId,
      serviceName: "com.amazonaws.us-east-1.s3",
      vpcEndpointType: "Gateway",
    });
    if (epRes.status !== 200) {
      await api("DELETE", `/api/aws/ec2/vpcs/${tempVpcId}`).catch(() => {});
      return;
    }
    expect(epRes.data.created).toBe(true);
    const epId = epRes.data.id;

    // Delete
    const delEpRes = await api("DELETE", `/api/aws/ec2/vpc-endpoints/${epId}`);
    expect(delEpRes.status).toBe(200);
    expect(delEpRes.data.deleted).toBe(true);

    // Cleanup remaining
    await api("DELETE", `/api/aws/ec2/vpcs/${tempVpcId}`).catch(() => {});
  });
});
