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
  DescribeStackResourceCommand,
  DescribeStackEventsCommand,
  GetTemplateCommand,
  ValidateTemplateCommand,
  ListExportsCommand,
  CreateChangeSetCommand,
  DescribeChangeSetCommand,
  ExecuteChangeSetCommand,
  DeleteChangeSetCommand,
  ListChangeSetsCommand,
  ListStackSetsCommand,
  CreateStackSetCommand,
  DescribeStackSetCommand,
  DeleteStackSetCommand,
  CreateStackInstancesCommand,
  ListStackInstancesCommand,
  DeleteStackInstancesCommand,
  ListStackSetOperationsCommand,
} from "@aws-sdk/client-cloudformation";
import { getAwsConfig } from "../../clients/aws";
import { sanitizeName, sanitizeText, validateJson } from "../../clients/sanitize";

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
  const stackName = sanitizeName(body.name || "", 128);
  if (!stackName) return c.json({ error: "name is required" }, 400);
  if (body.templateBody) {
    const validation = validateJson(body.templateBody);
    if (!validation.valid) {
      return c.json({ error: `Invalid template: ${validation.error}` }, 400);
    }
  }
  await cfn().send(
    new CreateStackCommand({
      StackName: stackName,
      TemplateBody: body.templateBody,
      TemplateURL: sanitizeName(body.templateUrl || "", 2048),
      Parameters: (body.parameters || []).map((p: any) => ({
        ParameterKey: sanitizeName(p.key || "", 256),
        ParameterValue: sanitizeText(p.value || "", 4096),
      })),
      Capabilities: body.capabilities || ["CAPABILITY_IAM", "CAPABILITY_NAMED_IAM"],
    } as any)
  );
  return c.json({ name: stackName, created: true });
});

router.put("/stacks/:name", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<any>();
  if (body.templateBody) {
    const validation = validateJson(body.templateBody);
    if (!validation.valid) {
      return c.json({ error: `Invalid template: ${validation.error}` }, 400);
    }
  }
  await cfn().send(
    new UpdateStackCommand({
      StackName: name,
      TemplateBody: body.templateBody,
      TemplateURL: sanitizeName(body.templateUrl || "", 2048),
      Parameters: (body.parameters || []).map((p: any) => ({
        ParameterKey: sanitizeName(p.key || "", 256),
        ParameterValue: sanitizeText(p.value || "", 4096),
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

// ─── RESOURCE DETAIL ─────────────────────────────────────

router.get("/stacks/:name/resources/:logicalId", async (c: Context) => {
  const stackName = c.req.param("name");
  const logicalId = c.req.param("logicalId");
  const result = await cfn().send(
    new DescribeStackResourceCommand({ StackName: stackName, LogicalResourceId: logicalId })
  );
  const detail = result.StackResourceDetail;
  if (!detail) return c.json({ error: "Resource not found" }, 404);
  return c.json({
    resource: {
      logicalId: detail.LogicalResourceId,
      physicalId: detail.PhysicalResourceId,
      resourceType: detail.ResourceType,
      status: detail.ResourceStatus,
      statusReason: detail.ResourceStatusReason,
      description: detail.Description,
      lastUpdated: detail.LastUpdatedTimestamp,
      metadata: detail.Metadata,
      driftInformation: detail.DriftInformation ? {
        stackResourceDriftStatus: detail.DriftInformation.StackResourceDriftStatus,
        lastCheckTimestamp: detail.DriftInformation.LastCheckTimestamp,
      } : null,
      moduleInfo: detail.ModuleInfo ? {
        typeHierarchy: detail.ModuleInfo.TypeHierarchy,
        logicalIdHierarchy: detail.ModuleInfo.LogicalIdHierarchy,
      } : null,
    },
  });
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
    new ValidateTemplateCommand({ TemplateBody: body.templateBody, TemplateURL: sanitizeName(body.templateUrl || "", 2048) })
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
    status: cs.Status,
    executionStatus: cs.ExecutionStatus,
    statusReason: cs.StatusReason,
    creationTime: cs.CreationTime,
    description: cs.Description,
  }));
  return c.json({ changeSets, total: changeSets.length });
});

router.get("/stacks/:name/change-sets/:changeSetName", async (c: Context) => {
  const stackName = c.req.param("name");
  const changeSetName = c.req.param("changeSetName");
  try {
    const result = await cfn().send(new DescribeChangeSetCommand({
      StackName: stackName,
      ChangeSetName: changeSetName,
    }));
    const cs = {
      id: result.ChangeSetId,
      name: result.ChangeSetName,
      stackId: result.StackId,
      stackName: result.StackName,
      status: result.Status,
      executionStatus: result.ExecutionStatus,
      statusReason: result.StatusReason,
      creationTime: result.CreationTime,
      description: result.Description,
      parameters: (result.Parameters || []).map((p: any) => ({
        key: p.ParameterKey,
        value: p.ParameterValue,
        usePreviousValue: p.UsePreviousValue,
      })),
      changes: (result.Changes || []).map((ch: any) => ({
        type: ch.Type,
        resourceChange: ch.ResourceChange ? {
          action: ch.ResourceChange.Action,
          logicalResourceId: ch.ResourceChange.LogicalResourceId,
          physicalResourceId: ch.ResourceChange.PhysicalResourceId,
          resourceType: ch.ResourceChange.ResourceType,
          replacement: ch.ResourceChange.Replacement,
          scope: ch.ResourceChange.Scope || [],
          details: (ch.ResourceChange.Details || []).map((d: any) => ({
            target: d.Target ? {
              attribute: d.Target.Attribute,
              name: d.Target.Name,
              requiresRecreation: d.Target.RequiresRecreation,
            } : null,
            evaluation: d.Evaluation,
            changeSource: d.ChangeSource,
            causingEntity: d.CausingEntity,
          })),
        } : null,
      })),
    };
    return c.json({ changeSet: cs });
  } catch (err: any) {
    if (err.name === "ChangeSetNotFoundException") {
      return c.json({ error: "Change set not found" }, 404);
    }
    throw err;
  }
});

router.post("/change-sets", async (c: Context) => {
  const body = await c.req.json<any>();
  if (body.templateBody) {
    const validation = validateJson(body.templateBody);
    if (!validation.valid) {
      return c.json({ error: `Invalid template: ${validation.error}` }, 400);
    }
  }
  await cfn().send(
    new CreateChangeSetCommand({
      StackName: sanitizeName(body.stackName || "", 128),
      ChangeSetName: sanitizeName(body.changeSetName || "", 128),
      ChangeSetType: body.changeSetType || "CREATE",
      TemplateBody: body.templateBody,
      TemplateURL: sanitizeName(body.templateUrl || "", 2048),
      Parameters: (body.parameters || []).map((p: any) => ({
        ParameterKey: sanitizeName(p.key || "", 256),
        ParameterValue: sanitizeText(p.value || "", 4096),
      })),
      Capabilities: body.capabilities || ["CAPABILITY_IAM"],
      Description: sanitizeText(body.description || "", 1024),
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

// ─── STACK SETS ──────────────────────────────────────────

router.get("/stacksets", async (c: Context) => {
  const result = await cfn().send(new ListStackSetsCommand({ Status: "ACTIVE" }));
  const stackSets = (result.Summaries || []).map((ss: any) => ({
    id: ss.StackSetId,
    name: ss.StackSetName,
    status: ss.Status,
    description: ss.Description,
  }));
  return c.json({ stackSets, total: stackSets.length });
});

router.post("/stacksets", async (c: Context) => {
  const body = await c.req.json<any>();
  const name = sanitizeName(body.name || "", 128);
  if (!name) return c.json({ error: "name is required" }, 400);
  if (body.templateBody) {
    const validation = validateJson(body.templateBody);
    if (!validation.valid) {
      return c.json({ error: `Invalid template: ${validation.error}` }, 400);
    }
  }
  await cfn().send(
    new CreateStackSetCommand({
      StackSetName: name,
      TemplateBody: body.templateBody,
      Description: sanitizeText(body.description || "", 1024),
      Parameters: (body.parameters || []).map((p: any) => ({
        ParameterKey: sanitizeName(p.key || "", 256),
        ParameterValue: sanitizeText(p.value || "", 4096),
      })),
      Capabilities: body.capabilities || ["CAPABILITY_IAM", "CAPABILITY_NAMED_IAM"],
      PermissionModel: body.permissionModel || "SELF_MANAGED",
    })
  );
  return c.json({ name, created: true });
});

router.get("/stacksets/:name", async (c: Context) => {
  const name = c.req.param("name");
  const [ssRes, instRes, opsRes] = await Promise.all([
    cfn().send(new DescribeStackSetCommand({ StackSetName: name })),
    cfn().send(new ListStackInstancesCommand({ StackSetName: name })),
    cfn().send(new ListStackSetOperationsCommand({ StackSetName: name })),
  ]);
  const stackSet = {
    id: ssRes.StackSet?.StackSetId,
    name: ssRes.StackSet?.StackSetName,
    status: ssRes.StackSet?.Status,
    description: ssRes.StackSet?.Description,
    templateBody: ssRes.StackSet?.TemplateBody,
    parameters: (ssRes.StackSet?.Parameters || []).map((p: any) => ({
      key: p.ParameterKey,
      value: p.ParameterValue,
    })),
    capabilities: ssRes.StackSet?.Capabilities || [],
    permissionModel: ssRes.StackSet?.PermissionModel,
  };
  const instances = (instRes.Summaries || []).map((i: any) => ({
    account: i.Account,
    region: i.Region,
    stackId: i.StackId,
    status: i.Status,
    statusReason: i.StatusReason,
  }));
  const operations = (opsRes.Summaries || []).map((o: any) => ({
    id: o.OperationId,
    action: o.Action,
    status: o.Status,
    creationTime: o.CreationTimestamp,
    endTime: o.EndTimestamp,
  }));
  return c.json({ stackSet, instances, operations });
});

router.delete("/stacksets/:name", async (c: Context) => {
  const name = c.req.param("name");
  await cfn().send(new DeleteStackSetCommand({ StackSetName: name }));
  return c.json({ name, deleted: true });
});

router.post("/stacksets/:name/instances", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<any>();
  if (!body.accounts?.length || !body.regions?.length) {
    return c.json({ error: "accounts and regions arrays are required" }, 400);
  }
  await cfn().send(
    new CreateStackInstancesCommand({
      StackSetName: name,
      Accounts: body.accounts,
      Regions: body.regions,
    })
  );
  return c.json({ name, instancesCreated: true });
});

router.delete("/stacksets/:name/instances", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<any>();
  if (!body.accounts?.length || !body.regions?.length) {
    return c.json({ error: "accounts and regions arrays are required" }, 400);
  }
  await cfn().send(
    new DeleteStackInstancesCommand({
      StackSetName: name,
      Accounts: body.accounts,
      Regions: body.regions,
      RetainStacks: body.retainStacks ?? false,
    })
  );
  return c.json({ name, instancesDeleted: true });
});

export default router;
