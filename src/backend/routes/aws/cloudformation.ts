import { Hono } from "hono";
import type { Context } from "hono";
import {
  CloudFormationClient,
  ListStacksCommand,
  DescribeStacksCommand,
  CreateStackCommand,
  UpdateStackCommand,
  DeleteStackCommand,
  DescribeStackResourcesCommand,
  ListStackResourcesCommand,
  DescribeStackEventsCommand,
  GetTemplateCommand,
  ValidateTemplateCommand,
  ListExportsCommand,
  CreateChangeSetCommand,
  DescribeChangeSetCommand,
  ExecuteChangeSetCommand,
  DeleteChangeSetCommand,
  ListChangeSetsCommand,
} from "@aws-sdk/client-cloudformation";
import { getAwsConfig } from "../../clients/aws";

const router = new Hono();

function cfn() {
  return new CloudFormationClient(getAwsConfig());
}

const STACK_STATUS_COLORS: Record<string, string> = {
  CREATE_COMPLETE: "green",
  UPDATE_COMPLETE: "green",
  DELETE_COMPLETE: "grey",
  CREATE_IN_PROGRESS: "blue",
  UPDATE_IN_PROGRESS: "blue",
  DELETE_IN_PROGRESS: "blue",
  CREATE_FAILED: "red",
  UPDATE_FAILED: "red",
  DELETE_FAILED: "red",
  ROLLBACK_COMPLETE: "red",
  ROLLBACK_IN_PROGRESS: "red",
  UPDATE_ROLLBACK_COMPLETE: "red",
  REVIEW_IN_PROGRESS: "blue",
};

function mapStack(s: any) {
  return {
    name: s.StackName,
    stackId: s.StackId,
    status: s.StackStatus,
    statusReason: s.StackStatusReason,
    description: s.Description,
    creationTime: s.CreationTime,
    lastUpdatedTime: s.LastUpdatedTime,
    parameters: (s.Parameters || []).map((p: any) => ({
      key: p.ParameterKey,
      value: p.ParameterValue,
      usePreviousValue: p.UsePreviousValue,
    })),
    outputs: (s.Outputs || []).map((o: any) => ({
      key: o.OutputKey,
      value: o.OutputValue,
      description: o.Description,
      exportName: o.ExportName,
    })),
    capabilities: s.Capabilities || [],
    tags: (s.Tags || []).map((t: any) => ({ key: t.Key, value: t.Value })),
    notificationARNs: s.NotificationARNs || [],
    enableTerminationProtection: s.EnableTerminationProtection,
  };
}

function mapResource(r: any) {
  return {
    logicalId: r.LogicalResourceId,
    physicalId: r.PhysicalResourceId,
    type: r.ResourceType,
    status: r.ResourceStatus,
    statusReason: r.ResourceStatusReason,
    lastUpdated: r.LastUpdatedTimestamp,
  };
}

// ─── STACKS ──────────────────────────────────────────────

router.get("/stacks", async (c: Context) => {
  const result = await cfn().send(new ListStacksCommand({}));
  const stacks = (result.StackSummaries || []).map(mapStack);
  return c.json({ stacks, total: stacks.length });
});

router.get("/stacks/:name", async (c: Context) => {
  const name = c.req.param("name");

  const [stackRes, resourcesRes, eventsRes] = await Promise.all([
    cfn().send(new DescribeStacksCommand({ StackName: name })),
    cfn().send(new ListStackResourcesCommand({ StackName: name })),
    cfn().send(new DescribeStackEventsCommand({ StackName: name })),
  ]);

  const stack = stackRes.Stacks?.[0] ? mapStack(stackRes.Stacks[0]) : null;
  const resources = (resourcesRes.StackResourceSummaries || []).map(mapResource);
  const events = (eventsRes.StackEvents || []).map((e: any) => ({
    eventId: e.EventId,
    timestamp: e.Timestamp,
    logicalId: e.LogicalResourceId,
    type: e.ResourceType,
    status: e.ResourceStatus,
    statusReason: e.ResourceStatusReason,
  }));

  return c.json({ stack, resources, events });
});

router.post("/stacks", async (c: Context) => {
  const body = await c.req.json<any>();
  await cfn().send(
    new CreateStackCommand({
      StackName: body.name,
      TemplateBody: body.templateBody,
      TemplateURL: body.templateUrl,
      Parameters: (body.parameters || []).map((p: any) => ({
        ParameterKey: p.key,
        ParameterValue: p.value,
      })),
      Capabilities: body.capabilities || ["CAPABILITY_IAM", "CAPABILITY_NAMED_IAM"],
    } as any)
  );
  return c.json({ name: body.name, created: true });
});

router.put("/stacks/:name", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<any>();
  await cfn().send(
    new UpdateStackCommand({
      StackName: name,
      TemplateBody: body.templateBody,
      TemplateURL: body.templateUrl,
      Parameters: (body.parameters || []).map((p: any) => ({
        ParameterKey: p.key,
        ParameterValue: p.value,
      })),
      Capabilities: body.capabilities || ["CAPABILITY_IAM", "CAPABILITY_NAMED_IAM"],
    })
  );
  return c.json({ name, updated: true });
});

router.delete("/stacks/:name", async (c: Context) => {
  const name = c.req.param("name");
  await cfn().send(new DeleteStackCommand({ StackName: name }));
  return c.json({ name, deleted: true });
});

// ─── TEMPLATE ────────────────────────────────────────────

router.get("/stacks/:name/template", async (c: Context) => {
  const name = c.req.param("name");
  const result = await cfn().send(new GetTemplateCommand({ StackName: name }));
  const template = result.TemplateBody
    ? typeof result.TemplateBody === "string"
      ? result.TemplateBody
      : JSON.stringify(result.TemplateBody, null, 2)
    : null;
  return c.json({ name, template });
});

router.post("/validate-template", async (c: Context) => {
  const body = await c.req.json<any>();
  const result = await cfn().send(
    new ValidateTemplateCommand({ TemplateBody: body.templateBody, TemplateURL: body.templateUrl })
  );
  return c.json({
    valid: true,
    description: result.Description,
    parameters: (result.Parameters || []).map((p: any) => ({
      key: p.ParameterKey,
      defaultValue: p.DefaultValue,
      description: p.Description,
      noEcho: p.NoEcho,
    })),
  });
});

// ─── CHANGE SETS ─────────────────────────────────────────

router.get("/stacks/:name/change-sets", async (c: Context) => {
  const name = c.req.param("name");
  const result = await cfn().send(new ListChangeSetsCommand({ StackName: name }));
  const changeSets = (result.Summaries || []).map((cs: any) => ({
    id: cs.ChangeSetId,
    name: cs.ChangeSetName,
    status: cs.ExecutionStatus,
    statusReason: cs.StatusReason,
    creationTime: cs.CreationTime,
    description: cs.Description,
  }));
  return c.json({ changeSets, total: changeSets.length });
});

router.post("/change-sets", async (c: Context) => {
  const body = await c.req.json<any>();
  await cfn().send(
    new CreateChangeSetCommand({
      StackName: body.stackName,
      ChangeSetName: body.changeSetName,
      ChangeSetType: body.changeSetType || "CREATE",
      TemplateBody: body.templateBody,
      TemplateURL: body.templateUrl,
      Parameters: (body.parameters || []).map((p: any) => ({
        ParameterKey: p.key,
        ParameterValue: p.value,
      })),
      Capabilities: body.capabilities || ["CAPABILITY_IAM"],
      Description: body.description,
    })
  );
  return c.json({ stackName: body.stackName, changeSetName: body.changeSetName, created: true });
});

router.post("/change-sets/execute", async (c: Context) => {
  const body = await c.req.json<any>();
  await cfn().send(
    new ExecuteChangeSetCommand({ ChangeSetName: body.changeSetName, StackName: body.stackName })
  );
  return c.json({ executed: true });
});

router.delete("/change-sets", async (c: Context) => {
  const changeSetName = c.req.query("name");
  const stackName = c.req.query("stack");
  if (!changeSetName || !stackName) return c.json({ error: "name and stack query parameters required" }, 400);
  await cfn().send(new DeleteChangeSetCommand({ ChangeSetName: changeSetName, StackName: stackName }));
  return c.json({ deleted: true });
});

// ─── EXPORTS ─────────────────────────────────────────────

router.get("/exports", async (c: Context) => {
  const result = await cfn().send(new ListExportsCommand({}));
  const exports = (result.Exports || []).map((e: any) => ({
    name: e.Name,
    value: e.Value,
    exportingStackId: e.ExportingStackId,
  }));
  return c.json({ exports, total: exports.length });
});

export default router;
