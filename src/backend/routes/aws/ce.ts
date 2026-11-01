import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { CostExplorerClient } from "@aws-sdk/client-cost-explorer";
import {
  GetCostAndUsageCommand,
  GetCostAndUsageWithResourcesCommand,
  GetDimensionValuesCommand,
  GetTagsCommand,
  GetReservationCoverageCommand,
  GetReservationUtilizationCommand,
  GetSavingsPlansCoverageCommand,
  GetSavingsPlansUtilizationCommand,
  GetCostCategoriesCommand,
  CreateAnomalyMonitorCommand,
  GetAnomalyMonitorsCommand,
  UpdateAnomalyMonitorCommand,
  DeleteAnomalyMonitorCommand,
  CreateAnomalySubscriptionCommand,
  GetAnomalySubscriptionsCommand,
  UpdateAnomalySubscriptionCommand,
  DeleteAnomalySubscriptionCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from "@aws-sdk/client-cost-explorer";

const router = new Hono();
const getClient = () => create(CostExplorerClient);

router.post("/cost-and-usage", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.timePeriod?.start || !body.timePeriod?.end) return c.json({ error: "timePeriod.start and timePeriod.end are required" }, 400);
  if (!body.granularity) return c.json({ error: "granularity is required" }, 400);
  if (!body.metrics?.length) return c.json({ error: "metrics is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new GetCostAndUsageCommand({
      TimePeriod: body.timePeriod,
      Granularity: body.granularity,
      Metrics: body.metrics,
      Filter: body.filter,
      GroupBy: body.groupBy,
    })
  );
  return c.json({
    resultsByTime: result.ResultsByTime || [],
    groupDefinitions: result.GroupDefinitions || [],
    total: (result.ResultsByTime || []).length,
  });
});

router.post("/cost-and-usage-with-resources", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.timePeriod?.start || !body.timePeriod?.end) return c.json({ error: "timePeriod.start and timePeriod.end are required" }, 400);
  if (!body.granularity) return c.json({ error: "granularity is required" }, 400);
  if (!body.metrics?.length) return c.json({ error: "metrics is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new GetCostAndUsageWithResourcesCommand({
      TimePeriod: body.timePeriod,
      Granularity: body.granularity,
      Metrics: body.metrics,
      Filter: body.filter,
      GroupBy: body.groupBy,
    })
  );
  return c.json({
    resultsByTime: result.ResultsByTime || [],
    groupDefinitions: result.GroupDefinitions || [],
    total: (result.ResultsByTime || []).length,
  });
});

router.post("/dimension-values", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.timePeriod?.start || !body.timePeriod?.end) return c.json({ error: "timePeriod.start and timePeriod.end are required" }, 400);
  if (!body.dimension) return c.json({ error: "dimension is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new GetDimensionValuesCommand({
      TimePeriod: body.timePeriod,
      Dimension: body.dimension,
      Filter: body.filter,
    })
  );
  return c.json({
    dimensionValues: result.DimensionValues || [],
    total: (result.DimensionValues || []).length,
  });
});

router.post("/tags", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.timePeriod?.start || !body.timePeriod?.end) return c.json({ error: "timePeriod.start and timePeriod.end are required" }, 400);

  const client = getClient();
  const result = await client.send(
    new GetTagsCommand({
      TimePeriod: body.timePeriod,
      TagKey: body.tagKey,
      Filter: body.filter,
    })
  );
  return c.json({
    tags: result.Tags || [],
    total: (result.Tags || []).length,
  });
});

router.post("/reservation-coverage", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.timePeriod?.start || !body.timePeriod?.end) return c.json({ error: "timePeriod.start and timePeriod.end are required" }, 400);
  if (!body.granularity) return c.json({ error: "granularity is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new GetReservationCoverageCommand({
      TimePeriod: body.timePeriod,
      Granularity: body.granularity,
      Filter: body.filter,
      GroupBy: body.groupBy,
    })
  );
  return c.json({
    coveragesByTime: result.CoveragesByTime || [],
    total: (result.CoveragesByTime || []).length,
  });
});

router.post("/reservation-utilization", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.timePeriod?.start || !body.timePeriod?.end) return c.json({ error: "timePeriod.start and timePeriod.end are required" }, 400);
  if (!body.granularity) return c.json({ error: "granularity is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new GetReservationUtilizationCommand({
      TimePeriod: body.timePeriod,
      Granularity: body.granularity,
      Filter: body.filter,
      GroupBy: body.groupBy,
    })
  );
  return c.json({
    utilizationsByTime: result.UtilizationsByTime || [],
    total: (result.UtilizationsByTime || []).length,
  });
});

router.post("/savings-plans-coverage", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.timePeriod?.start || !body.timePeriod?.end) return c.json({ error: "timePeriod.start and timePeriod.end are required" }, 400);
  if (!body.granularity) return c.json({ error: "granularity is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new GetSavingsPlansCoverageCommand({
      TimePeriod: body.timePeriod,
      Granularity: body.granularity,
      Filter: body.filter,
      GroupBy: body.groupBy,
    })
  );
  return c.json({
    savingsPlansCoverages: result.SavingsPlansCoverages || [],
    total: (result.SavingsPlansCoverages || []).length,
  });
});

router.post("/savings-plans-utilization", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.timePeriod?.start || !body.timePeriod?.end) return c.json({ error: "timePeriod.start and timePeriod.end are required" }, 400);
  if (!body.granularity) return c.json({ error: "granularity is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new GetSavingsPlansUtilizationCommand({
      TimePeriod: body.timePeriod,
      Granularity: body.granularity,
      Filter: body.filter,
    })
  );
  return c.json({
    savingsPlansUtilizationsByTime: result.SavingsPlansUtilizationsByTime || [],
    total: (result.SavingsPlansUtilizationsByTime || []).length,
  });
});

router.post("/cost-categories", async (c: Context) => {
  const body = await c.req.json<any>();

  const client = getClient();
  const result = await client.send(
    new GetCostCategoriesCommand({
      TimePeriod: body.timePeriod,
      Filter: body.filter,
    })
  );
  return c.json({
    costCategories: result.CostCategoryNames || [],
    total: (result.CostCategoryNames || []).length,
  });
});

// ── Cost anomaly monitors ─────────────────────────────────

router.post("/anomaly-monitors", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.monitorName) return c.json({ error: "monitorName is required" }, 400);
  if (!body.monitorType) return c.json({ error: "monitorType is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateAnomalyMonitorCommand({
      AnomalyMonitor: {
        MonitorName: body.monitorName,
        MonitorType: body.monitorType,
        MonitorDimension: body.monitorDimension,
        MonitorSpecification: body.monitorSpecification,
      } as any,
    })
  );
  return c.json({ monitorArn: result.MonitorArn }, 201);
});

router.get("/anomaly-monitors", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetAnomalyMonitorsCommand({}));
  const anomalyMonitors = result.AnomalyMonitors || [];
  return c.json({
    anomalyMonitors: anomalyMonitors.map((m: any) => ({
      arn: m.MonitorArn,
      name: m.MonitorName,
      type: m.MonitorType,
      dimension: m.MonitorDimension || null,
      state: m.MonitorState || null,
      createdBy: m.CreatedBy || null,
      creationDate: m.CreationDate || null,
      lastUpdatedDate: m.LastUpdatedDate || null,
      tags: m.Tags || {},
    })),
    total: anomalyMonitors.length,
  });
});

router.put("/anomaly-monitors/:arn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const body = await c.req.json<any>();
  if (typeof body.monitorState !== "string") {
    return c.json({ error: "monitorState is required" }, 400);
  }
  const client = getClient();
  await client.send(
    new UpdateAnomalyMonitorCommand({
      MonitorArn: arn,
      MonitorState: body.monitorState,
    } as any)
  );
  return c.json({ updated: true });
});

router.delete("/anomaly-monitors/:arn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const client = getClient();
  await client.send(new DeleteAnomalyMonitorCommand({ MonitorArn: arn }));
  return c.json({ deleted: true });
});

// ── Cost anomaly subscriptions ────────────────────────────

router.post("/anomaly-subscriptions", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.subscriptionName) return c.json({ error: "subscriptionName is required" }, 400);
  if (!body.monitorArn) return c.json({ error: "monitorArn is required" }, 400);
  if (!Array.isArray(body.subscribers) || body.subscribers.length === 0) {
    return c.json({ error: "subscribers array is required" }, 400);
  }
  const client = getClient();
  const result = await client.send(
    new CreateAnomalySubscriptionCommand({
      AnomalySubscription: {
        SubscriptionName: body.subscriptionName,
        MonitorArns: [body.monitorArn],
        Subscribers: body.subscribers,
        Threshold: body.threshold,
        Frequency: body.frequency,
      } as any,
    })
  );
  return c.json({ subscriptionArn: result.SubscriptionArn }, 201);
});

router.get("/anomaly-subscriptions", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetAnomalySubscriptionsCommand({}));
  const anomalySubscriptions = result.AnomalySubscriptions || [];
  return c.json({
    anomalySubscriptions: anomalySubscriptions.map((sub: any) => ({
      arn: sub.SubscriptionArn,
      name: sub.SubscriptionName,
      monitorArns: sub.MonitorArns || [],
      subscribers: sub.Subscribers || [],
      threshold: sub.Threshold ?? null,
      frequency: sub.Frequency || null,
      createdBy: sub.CreatedBy || null,
    })),
    total: anomalySubscriptions.length,
  });
});

router.put("/anomaly-subscriptions/:arn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const body = await c.req.json<any>();
  if (!Array.isArray(body.subscribers) || body.subscribers.length === 0) {
    return c.json({ error: "subscribers array is required" }, 400);
  }
  const client = getClient();
  await client.send(
    new UpdateAnomalySubscriptionCommand({
      SubscriptionArn: arn,
      Subscribers: body.subscribers,
      Threshold: body.threshold,
      Frequency: body.frequency,
      MonitorArns: body.monitorArns,
    } as any)
  );
  return c.json({ updated: true });
});

router.delete("/anomaly-subscriptions/:arn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const client = getClient();
  await client.send(new DeleteAnomalySubscriptionCommand({ SubscriptionArn: arn }));
  return c.json({ deleted: true });
});

// ── Resource tags ─────────────────────────────────────────

router.get("/resource-tags", async (c: Context) => {
  const arn = c.req.query("resourceArn");
  if (!arn) return c.json({ error: "resourceArn query parameter required" }, 400);
  const client = getClient();
  const result = await client.send(new ListTagsForResourceCommand({ ResourceArn: arn }));
  return c.json({ tags: result.ResourceTags || {}, arn });
});

router.post("/resource-tags", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.resourceArn) return c.json({ error: "resourceArn is required" }, 400);
  if (!body.tags || typeof body.tags !== "object") {
    return c.json({ error: "tags object is required" }, 400);
  }
  const client = getClient();
  await client.send(
    new TagResourceCommand({
      ResourceArn: body.resourceArn,
      ResourceTags: body.tags,
    })
  );
  return c.json({ tagged: true });
});

router.post("/resource-tags/untag", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.resourceArn) return c.json({ error: "resourceArn is required" }, 400);
  if (!Array.isArray(body.tagKeys) || body.tagKeys.length === 0) {
    return c.json({ error: "tagKeys array is required" }, 400);
  }
  const client = getClient();
  await client.send(
    new UntagResourceCommand({
      ResourceArn: body.resourceArn,
      ResourceTagKeys: body.tagKeys,
    })
  );
  return c.json({ untagged: true });
});

export default router;
