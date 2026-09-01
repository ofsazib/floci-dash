import { Hono } from "hono";
import type { Context } from "hono";
import {
  EC2Client,
  CreateFlowLogsCommand,
  DescribeFlowLogsCommand,
  DeleteFlowLogsCommand,
} from "@aws-sdk/client-ec2";
import { getAwsConfig } from "../../clients/aws";
import { sanitizeName } from "../../clients/sanitize";

const router = new Hono();

function ec2(): EC2Client {
  return new EC2Client(getAwsConfig());
}

// ─── List Flow Logs ───────────────────────────────────────────────

router.get("/flow-logs", async (c: Context) => {
  const filterName = c.req.query("resourceId");
  const params: any = {};
  if (filterName) {
/* istanbul ignore next */
    params.Filter = [{ Name: "resource-id", Values: [filterName] }];
  }

  const result = await ec2().send(new DescribeFlowLogsCommand(params));
  const flowLogs = (result.FlowLogs || []).map((fl: any) => ({
    flowLogId: fl.FlowLogId,
    resourceId: fl.ResourceId,
    resourceType: fl.ResourceType,
    trafficType: fl.TrafficType,
    logDestinationType: fl.LogDestinationType,
    logDestination: fl.LogDestination,
    logFormat: fl.LogFormat,
    maxAggregationInterval: fl.MaxAggregationInterval,
    flowLogStatus: fl.FlowLogStatus,
    deliverLogsStatus: fl.DeliverLogsStatus,
    creationTime: fl.CreationTime?.toISOString() || null,
    deliverCrossAccountRole: fl.DeliverCrossAccountRole || null,
    tags: (fl.Tags || []).map((t: any) => ({ key: t.Key, value: t.Value })),
  }));
  return c.json({ flowLogs, total: flowLogs.length });
});

// ─── Create Flow Log ──────────────────────────────────────────────

router.post("/flow-logs", async (c: Context) => {
  const body = await c.req.json<{
    resourceId: string;
    resourceType: string;
    trafficType: string;
    logDestinationType: string;
    logDestination: string;
    logFormat?: string;
    maxAggregationInterval?: number;
  }>();

  if (!body.resourceId || !body.resourceType || !body.trafficType) {
    return c.json(
      { error: "resourceId, resourceType, and trafficType are required" },
      400
    );
  }

  const params: any = {
    ResourceIds: [sanitizeName(body.resourceId, 256)],
    ResourceType: body.resourceType,
    TrafficType: body.trafficType,
  };

  if (body.logDestinationType && body.logDestination) {
    params.LogDestinationType = body.logDestinationType;
    params.LogDestination = sanitizeName(body.logDestination, 2048);
  }
  if (body.logFormat) {
    params.LogFormat = body.logFormat;
  }
  if (body.maxAggregationInterval) {
    params.MaxAggregationInterval = body.maxAggregationInterval;
  }

  const result = await ec2().send(new CreateFlowLogsCommand(params));
  const created = (result.FlowLogIds || []).length > 0;
  return c.json({
    flowLogIds: result.FlowLogIds || [],
    unsuccessful: result.Unsuccessful || [],
    created,
  });
});

// ─── Delete Flow Log ──────────────────────────────────────────────

router.delete("/flow-logs/:id", async (c: Context) => {
  const id = c.req.param("id");
  const result = await ec2().send(
    new DeleteFlowLogsCommand({ FlowLogIds: [id!] })
  );
  const deleted = (result.Unsuccessful || []).length === 0;
  return c.json({ id, deleted, unsuccessful: result.Unsuccessful || [] });
});

export default router;
