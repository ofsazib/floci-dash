import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { CloudFrontClient } from "@aws-sdk/client-cloudfront";
import {
  ListDistributionsCommand,
  GetDistributionCommand,
  CreateDistributionCommand,
  UpdateDistributionCommand,
  DeleteDistributionCommand,
  ListInvalidationsCommand,
  CreateInvalidationCommand,
  GetInvalidationCommand,
  ListCachePoliciesCommand,
  ListOriginAccessControlsCommand,
  ListFunctionsCommand,
  ListTagsForResourceCommand,
} from "@aws-sdk/client-cloudfront";

const router = new Hono();
const getClient = () => create(CloudFrontClient);

// ── Distributions ────────────────────────────────────────

router.get("/distributions", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListDistributionsCommand({}));
  const distributions = result.DistributionList?.Items || [];
  return c.json({ distributions, total: distributions.length });
});

router.get("/distributions/:id", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  const result = await client.send(new GetDistributionCommand({ Id: id }));
  return c.json({ distribution: result.Distribution, eTag: result.ETag });
});

router.post("/distributions", async (c: Context) => {
  const body = await c.req.json<{
    distributionConfig: any;
  }>();
  if (!body.distributionConfig) return c.json({ error: "distributionConfig is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateDistributionCommand({ DistributionConfig: body.distributionConfig })
  );
  return c.json({ distribution: result.Distribution, location: result.Location }, 201);
});

router.put("/distributions/:id", async (c: Context) => {
  const id = c.req.param("id");
  const ifMatch = c.req.header("If-Match");
  const body = await c.req.json<{ distributionConfig: any }>();
  if (!body.distributionConfig) return c.json({ error: "distributionConfig is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new UpdateDistributionCommand({
      Id: id,
      IfMatch: ifMatch,
      DistributionConfig: body.distributionConfig,
    })
  );
  return c.json({ distribution: result.Distribution, eTag: result.ETag });
});

router.delete("/distributions/:id", async (c: Context) => {
  const id = c.req.param("id");
  const ifMatch = c.req.header("If-Match");
  if (!ifMatch) return c.json({ error: "If-Match header is required" }, 400);
  const client = getClient();
  await client.send(new DeleteDistributionCommand({ Id: id, IfMatch: ifMatch }));
  return c.json({ deleted: true });
});

// ── Invalidations ────────────────────────────────────────

router.get("/distributions/:id/invalidations", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  const result = await client.send(new ListInvalidationsCommand({ DistributionId: id }));
  const invalidations = result.InvalidationList?.Items || [];
  return c.json({ invalidations, total: invalidations.length });
});

router.post("/distributions/:id/invalidations", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<{
    paths: string[];
    callerReference?: string;
  }>();
  if (!body.paths?.length) return c.json({ error: "paths is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateInvalidationCommand({
      DistributionId: id,
      InvalidationBatch: {
        CallerReference: body.callerReference || `${Date.now()}`,
        Paths: {
          Quantity: body.paths.length,
          Items: body.paths,
        },
      },
    })
  );
  return c.json({ invalidation: result.Invalidation }, 201);
});

router.get("/distributions/:id/invalidations/:invId", async (c: Context) => {
  const id = c.req.param("id");
  const invId = c.req.param("invId");
  const client = getClient();
  const result = await client.send(
    new GetInvalidationCommand({ DistributionId: id, Id: invId })
  );
  return c.json({ invalidation: result.Invalidation });
});

// ── Cache Policies ───────────────────────────────────────

router.get("/cache-policies", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListCachePoliciesCommand({}));
  const cachePolicies = result.CachePolicyList?.Items || [];
  return c.json({ cachePolicies, total: cachePolicies.length });
});

// ── Origin Access Controls ───────────────────────────────

router.get("/origin-access-controls", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListOriginAccessControlsCommand({}));
  const originAccessControls = result.OriginAccessControlList?.Items || [];
  return c.json({ originAccessControls, total: originAccessControls.length });
});

// ── Functions ────────────────────────────────────────────

router.get("/functions", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListFunctionsCommand({}));
  const functions = result.FunctionList?.Items || [];
  return c.json({ functions, total: functions.length });
});

// ── Tags ─────────────────────────────────────────────────

router.get("/tags", async (c: Context) => {
  const resource = c.req.query("resource");
  if (!resource) return c.json({ error: "resource query param is required" }, 400);
  const client = getClient();
  const result = await client.send(new ListTagsForResourceCommand({ Resource: resource }));
  return c.json({ tags: result.Tags?.Items || [] });
});

export default router;
