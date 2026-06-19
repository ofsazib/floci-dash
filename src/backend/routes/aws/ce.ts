import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { CostExplorerClient } from "@aws-sdk/client-cost-explorer";
import {
  GetCostAndUsageCommand,
  GetDimensionValuesCommand,
  GetTagsCommand,
  GetReservationCoverageCommand,
  GetReservationUtilizationCommand,
  GetSavingsPlansCoverageCommand,
  GetSavingsPlansUtilizationCommand,
  GetCostCategoriesCommand,
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

export default router;
