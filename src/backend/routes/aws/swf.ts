import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { SWFClient } from "@aws-sdk/client-swf";
import {
  ListDomainsCommand,
  DescribeDomainCommand,
  RegisterDomainCommand,
  DeprecateDomainCommand,
  UndeprecateDomainCommand,
  ListWorkflowTypesCommand,
  DescribeWorkflowTypeCommand,
  RegisterWorkflowTypeCommand,
  DeprecateWorkflowTypeCommand,
  UndeprecateWorkflowTypeCommand,
  DeleteWorkflowTypeCommand,
  ListActivityTypesCommand,
  DescribeActivityTypeCommand,
  RegisterActivityTypeCommand,
  DeprecateActivityTypeCommand,
  UndeprecateActivityTypeCommand,
  DeleteActivityTypeCommand,
  ListOpenWorkflowExecutionsCommand,
  ListClosedWorkflowExecutionsCommand,
  StartWorkflowExecutionCommand,
  DescribeWorkflowExecutionCommand,
  GetWorkflowExecutionHistoryCommand,
  TerminateWorkflowExecutionCommand,
  SignalWorkflowExecutionCommand,
  RequestCancelWorkflowExecutionCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from "@aws-sdk/client-swf";

const router = new Hono();
const getClient = () => create(SWFClient);

// ── Domains ──────────────────────────────────────────────

router.get("/domains", async (c: Context) => {
  const status = c.req.query("registrationStatus") || "REGISTERED";
/* istanbul ignore next */
  const client = getClient();
  const result = await client.send(new ListDomainsCommand({ registrationStatus: status as any }));
  const domains = result.domainInfos || [];
  return c.json({ domains, total: domains.length });
});

router.get("/domains/:name", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const client = getClient();
  const result = await client.send(new DescribeDomainCommand({ name }));
  return c.json({ domain: result });
});

router.post("/domains", async (c: Context) => {
  const body = await c.req.json<{
    name: string;
    description?: string;
    workflowExecutionRetentionPeriodInDays?: string;
    tags?: Record<string, string>;
  }>();
  if (!body.name) return c.json({ error: "name is required" }, 400);

  const client = getClient();
  await client.send(
    new RegisterDomainCommand({
      name: body.name,
      description: body.description || undefined,
      workflowExecutionRetentionPeriodInDays:
        body.workflowExecutionRetentionPeriodInDays || "30",
      tags: body.tags && Object.keys(body.tags).length
        ? Object.entries(body.tags).map(([key, value]) => ({ key, value }))
        : undefined,
    })
  );
  return c.json({ created: true }, 201);
});

router.post("/domains/:name/deprecate", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const client = getClient();
  await client.send(new DeprecateDomainCommand({ name }));
  return c.json({ deprecated: true });
});

router.post("/domains/:name/undeprecate", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const client = getClient();
  await client.send(new UndeprecateDomainCommand({ name }));
  return c.json({ undeprecated: true });
});

// ── Workflow Types ───────────────────────────────────────

router.get("/workflow-types", async (c: Context) => {
  const domain = c.req.query("domain");
  if (!domain) return c.json({ error: "domain is required" }, 400);
  const status = c.req.query("registrationStatus") || "REGISTERED";
  const client = getClient();
  const result = await client.send(
    new ListWorkflowTypesCommand({ domain, registrationStatus: status as any })
  );
  const typeInfos = result.typeInfos || [];
  return c.json({ typeInfos, total: typeInfos.length });
});

router.get("/workflow-types/detail", async (c: Context) => {
  const domain = c.req.query("domain");
  const name = c.req.query("name");
  const version = c.req.query("version");
  if (!domain || !name || !version)
    return c.json({ error: "domain, name and version are required" }, 400);
  const client = getClient();
  const result = await client.send(
    new DescribeWorkflowTypeCommand({
      domain,
      workflowType: { name, version },
    })
  );
  return c.json({ typeInfo: result.typeInfo, configuration: result.configuration });
});

router.post("/workflow-types", async (c: Context) => {
  const body = await c.req.json<{
    domain: string;
    name: string;
    version: string;
    description?: string;
    defaultTaskStartToCloseTimeout?: string;
    defaultExecutionStartToCloseTimeout?: string;
    defaultTaskList?: string;
    defaultChildPolicy?: string;
  }>();
  if (!body.domain) return c.json({ error: "domain is required" }, 400);
  if (!body.name) return c.json({ error: "name is required" }, 400);
  if (!body.version) return c.json({ error: "version is required" }, 400);

  const client = getClient();
  await client.send(
    new RegisterWorkflowTypeCommand({
      domain: body.domain,
      name: body.name,
      version: body.version,
      description: body.description || undefined,
      defaultTaskStartToCloseTimeout: body.defaultTaskStartToCloseTimeout || undefined,
      defaultExecutionStartToCloseTimeout:
        body.defaultExecutionStartToCloseTimeout || undefined,
      defaultTaskList: body.defaultTaskList ? { name: body.defaultTaskList } : undefined,
      defaultChildPolicy: (body.defaultChildPolicy || undefined) as any,
    })
  );
  return c.json({ created: true }, 201);
});

router.post("/workflow-types/deprecate", async (c: Context) => {
  const body = await c.req.json<{ domain: string; name: string; version: string }>();
  if (!body.domain || !body.name || !body.version)
    return c.json({ error: "domain, name and version are required" }, 400);
  const client = getClient();
  await client.send(
    new DeprecateWorkflowTypeCommand({
      domain: body.domain,
      workflowType: { name: body.name, version: body.version },
    })
  );
  return c.json({ deprecated: true });
});

router.post("/workflow-types/undeprecate", async (c: Context) => {
  const body = await c.req.json<{ domain: string; name: string; version: string }>();
  if (!body.domain || !body.name || !body.version)
    return c.json({ error: "domain, name and version are required" }, 400);
  const client = getClient();
  await client.send(
    new UndeprecateWorkflowTypeCommand({
      domain: body.domain,
      workflowType: { name: body.name, version: body.version },
    })
  );
  return c.json({ undeprecated: true });
});

router.delete("/workflow-types", async (c: Context) => {
  const body = await c.req.json<{ domain: string; name: string; version: string }>();
  if (!body.domain || !body.name || !body.version)
    return c.json({ error: "domain, name and version are required" }, 400);
  const client = getClient();
  await client.send(
    new DeleteWorkflowTypeCommand({
      domain: body.domain,
      workflowType: { name: body.name, version: body.version },
    })
  );
  return c.json({ deleted: true });
});

// ── Activity Types ───────────────────────────────────────

router.get("/activity-types", async (c: Context) => {
  const domain = c.req.query("domain");
  if (!domain) return c.json({ error: "domain is required" }, 400);
  const status = c.req.query("registrationStatus") || "REGISTERED";
  const client = getClient();
  const result = await client.send(
    new ListActivityTypesCommand({ domain, registrationStatus: status as any })
  );
  const typeInfos = result.typeInfos || [];
  return c.json({ typeInfos, total: typeInfos.length });
});

router.get("/activity-types/detail", async (c: Context) => {
  const domain = c.req.query("domain");
  const name = c.req.query("name");
  const version = c.req.query("version");
  if (!domain || !name || !version)
    return c.json({ error: "domain, name and version are required" }, 400);
  const client = getClient();
  const result = await client.send(
    new DescribeActivityTypeCommand({
      domain,
      activityType: { name, version },
    })
  );
  return c.json({ typeInfo: result.typeInfo, configuration: result.configuration });
});

router.post("/activity-types", async (c: Context) => {
  const body = await c.req.json<{
    domain: string;
    name: string;
    version: string;
    description?: string;
    defaultTaskStartToCloseTimeout?: string;
    defaultTaskHeartbeatTimeout?: string;
    defaultTaskList?: string;
    defaultTaskScheduleToStartTimeout?: string;
    defaultTaskScheduleToCloseTimeout?: string;
  }>();
  if (!body.domain) return c.json({ error: "domain is required" }, 400);
  if (!body.name) return c.json({ error: "name is required" }, 400);
  if (!body.version) return c.json({ error: "version is required" }, 400);

  const client = getClient();
  await client.send(
    new RegisterActivityTypeCommand({
      domain: body.domain,
      name: body.name,
      version: body.version,
      description: body.description || undefined,
      defaultTaskStartToCloseTimeout: body.defaultTaskStartToCloseTimeout || undefined,
      defaultTaskHeartbeatTimeout: body.defaultTaskHeartbeatTimeout || undefined,
      defaultTaskList: body.defaultTaskList ? { name: body.defaultTaskList } : undefined,
      defaultTaskScheduleToStartTimeout:
        body.defaultTaskScheduleToStartTimeout || undefined,
      defaultTaskScheduleToCloseTimeout:
        body.defaultTaskScheduleToCloseTimeout || undefined,
    })
  );
  return c.json({ created: true }, 201);
});

router.post("/activity-types/deprecate", async (c: Context) => {
  const body = await c.req.json<{ domain: string; name: string; version: string }>();
  if (!body.domain || !body.name || !body.version)
    return c.json({ error: "domain, name and version are required" }, 400);
  const client = getClient();
  await client.send(
    new DeprecateActivityTypeCommand({
      domain: body.domain,
      activityType: { name: body.name, version: body.version },
    })
  );
  return c.json({ deprecated: true });
});

router.post("/activity-types/undeprecate", async (c: Context) => {
  const body = await c.req.json<{ domain: string; name: string; version: string }>();
  if (!body.domain || !body.name || !body.version)
    return c.json({ error: "domain, name and version are required" }, 400);
  const client = getClient();
  await client.send(
    new UndeprecateActivityTypeCommand({
      domain: body.domain,
      activityType: { name: body.name, version: body.version },
    })
  );
  return c.json({ undeprecated: true });
});

router.delete("/activity-types", async (c: Context) => {
  const body = await c.req.json<{ domain: string; name: string; version: string }>();
  if (!body.domain || !body.name || !body.version)
    return c.json({ error: "domain, name and version are required" }, 400);
  const client = getClient();
  await client.send(
    new DeleteActivityTypeCommand({
      domain: body.domain,
      activityType: { name: body.name, version: body.version },
    })
  );
  return c.json({ deleted: true });
});

// ── Workflow Executions ──────────────────────────────────

function parseStartedAfter(value: string | undefined): Date | undefined {
  return value ? new Date(value) : undefined;
}

router.get("/executions/open", async (c: Context) => {
  const domain = c.req.query("domain");
  if (!domain) return c.json({ error: "domain is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new ListOpenWorkflowExecutionsCommand({
      domain,
      startTimeFilter: { oldestDate: parseStartedAfter(c.req.query("startedAfter")) || new Date(0) },
    })
  );
  const executionInfos = result.executionInfos || [];
  return c.json({ executionInfos, total: executionInfos.length });
});

router.get("/executions/closed", async (c: Context) => {
  const domain = c.req.query("domain");
  if (!domain) return c.json({ error: "domain is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new ListClosedWorkflowExecutionsCommand({
      domain,
      startTimeFilter: { oldestDate: parseStartedAfter(c.req.query("startedAfter")) || new Date(0) },
    })
  );
  const executionInfos = result.executionInfos || [];
  return c.json({ executionInfos, total: executionInfos.length });
});

router.post("/executions", async (c: Context) => {
  const body = await c.req.json<{
    domain: string;
    workflowId: string;
    workflowTypeName: string;
    workflowTypeVersion: string;
    taskList?: string;
    input?: string;
    executionStartToCloseTimeout?: string;
    taskStartToCloseTimeout?: string;
    childPolicy?: string;
    tagList?: string[];
  }>();
  if (!body.domain) return c.json({ error: "domain is required" }, 400);
  if (!body.workflowId) return c.json({ error: "workflowId is required" }, 400);
  if (!body.workflowTypeName) return c.json({ error: "workflowTypeName is required" }, 400);
  if (!body.workflowTypeVersion)
    return c.json({ error: "workflowTypeVersion is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new StartWorkflowExecutionCommand({
      domain: body.domain,
      workflowId: body.workflowId,
      workflowType: {
        name: body.workflowTypeName,
        version: body.workflowTypeVersion,
      },
      taskList: body.taskList ? { name: body.taskList } : undefined,
      input: body.input || undefined,
      executionStartToCloseTimeout: body.executionStartToCloseTimeout || undefined,
      taskStartToCloseTimeout: body.taskStartToCloseTimeout || undefined,
      childPolicy: (body.childPolicy || undefined) as any,
      tagList: body.tagList && body.tagList.length ? body.tagList : undefined,
    })
  );
  return c.json({ runId: result.runId }, 201);
});

router.get("/executions/detail", async (c: Context) => {
  const domain = c.req.query("domain");
  const workflowId = c.req.query("workflowId");
  const runId = c.req.query("runId");
  if (!domain || !workflowId || !runId)
    return c.json({ error: "domain, workflowId and runId are required" }, 400);
  const client = getClient();
  const result = await client.send(
    new DescribeWorkflowExecutionCommand({
      domain,
      execution: { workflowId, runId },
    })
  );
  return c.json({ executionInfo: result.executionInfo });
});

router.get("/executions/history", async (c: Context) => {
  const domain = c.req.query("domain");
  const workflowId = c.req.query("workflowId");
  const runId = c.req.query("runId");
  if (!domain || !workflowId || !runId)
    return c.json({ error: "domain, workflowId and runId are required" }, 400);
  const client = getClient();
  const result = await client.send(
    new GetWorkflowExecutionHistoryCommand({
      domain,
      execution: { workflowId, runId },
    })
  );
  const events = result.events || [];
  return c.json({ events, total: events.length });
});

router.post("/executions/terminate", async (c: Context) => {
  const body = await c.req.json<{
    domain: string;
    workflowId: string;
    runId?: string;
    reason?: string;
  }>();
  if (!body.domain) return c.json({ error: "domain is required" }, 400);
  if (!body.workflowId) return c.json({ error: "workflowId is required" }, 400);
  const client = getClient();
  await client.send(
    new TerminateWorkflowExecutionCommand({
      domain: body.domain,
      workflowId: body.workflowId,
      runId: body.runId || undefined,
      reason: body.reason || undefined,
    })
  );
  return c.json({ terminated: true });
});

router.post("/executions/signal", async (c: Context) => {
  const body = await c.req.json<{
    domain: string;
    workflowId: string;
    runId?: string;
    signalName: string;
    input?: string;
  }>();
  if (!body.domain) return c.json({ error: "domain is required" }, 400);
  if (!body.workflowId) return c.json({ error: "workflowId is required" }, 400);
  if (!body.signalName) return c.json({ error: "signalName is required" }, 400);
  const client = getClient();
  await client.send(
    new SignalWorkflowExecutionCommand({
      domain: body.domain,
      workflowId: body.workflowId,
      runId: body.runId || undefined,
      signalName: body.signalName,
      input: body.input || undefined,
    })
  );
  return c.json({ signaled: true });
});

router.post("/executions/request-cancel", async (c: Context) => {
  const body = await c.req.json<{
    domain: string;
    workflowId: string;
    runId?: string;
  }>();
  if (!body.domain) return c.json({ error: "domain is required" }, 400);
  if (!body.workflowId) return c.json({ error: "workflowId is required" }, 400);
  const client = getClient();
  await client.send(
    new RequestCancelWorkflowExecutionCommand({
      domain: body.domain,
      workflowId: body.workflowId,
      runId: body.runId || undefined,
    })
  );
  return c.json({ cancelRequested: true });
});

// ── Tags ─────────────────────────────────────────────────

router.get("/tags", async (c: Context) => {
  const resourceArn = c.req.query("resourceArn");
  if (!resourceArn) return c.json({ error: "resourceArn is required" }, 400);
  const client = getClient();
  const result = await client.send(new ListTagsForResourceCommand({ resourceArn }));
  return c.json({ tags: result.tags || [] });
});

router.put("/tags", async (c: Context) => {
  const body = await c.req.json<{
    resourceArn: string;
    tagsToAdd: Record<string, string>;
  }>();
  if (!body.resourceArn) return c.json({ error: "resourceArn is required" }, 400);
  const entries = Object.entries(body.tagsToAdd || {});
  if (!entries.length) return c.json({ error: "at least one tag is required" }, 400);
  const client = getClient();
  await client.send(
    new TagResourceCommand({
      resourceArn: body.resourceArn,
      tags: entries.map(([key, value]) => ({ key, value })),
    })
  );
  return c.json({ tagged: true });
});

router.delete("/tags", async (c: Context) => {
  const body = await c.req.json<{ resourceArn: string; tagKeys: string[] }>();
  if (!body.resourceArn) return c.json({ error: "resourceArn is required" }, 400);
  if (!body.tagKeys || !body.tagKeys.length)
    return c.json({ error: "at least one tagKey is required" }, 400);
  const client = getClient();
  await client.send(
    new UntagResourceCommand({ resourceArn: body.resourceArn, tagKeys: body.tagKeys })
  );
  return c.json({ untagged: true });
});

export default router;
