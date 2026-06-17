import { Hono } from "hono";
import type { Context } from "hono";
import { getAwsConfig } from "../../clients/aws";
import { Route53Client } from "@aws-sdk/client-route-53";
import {
  ListHostedZonesCommand,
  GetHostedZoneCommand,
  CreateHostedZoneCommand,
  DeleteHostedZoneCommand,
  ListResourceRecordSetsCommand,
  ChangeResourceRecordSetsCommand,
  ListHealthChecksCommand,
} from "@aws-sdk/client-route-53";

const router = new Hono();
const getClient = () => new Route53Client(getAwsConfig());

// ── Hosted Zones ─────────────────────────────────────────

router.get("/hosted-zones", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListHostedZonesCommand({}));
  return c.json({
    hostedZones: result.HostedZones || [],
    total: result.HostedZones?.length || 0,
  });
});

router.get("/hosted-zones/:id", async (c: Context) => {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "id param required" }, 400);
  const client = getClient();
  const result = await client.send(
    new GetHostedZoneCommand({ Id: id })
  );
  return c.json({
    hostedZone: result.HostedZone || null,
    delegationSet: result.DelegationSet || null,
  });
});

router.post("/hosted-zones", async (c: Context) => {
  const body = await c.req.json();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateHostedZoneCommand({
      Name: body.name,
      CallerReference: body.callerReference || `${Date.now()}`,
      HostedZoneConfig: {
        Comment: body.comment,
        PrivateZone: body.privateZone ?? false,
      },
    })
  );
  return c.json(
    {
      hostedZone: result.HostedZone,
      changeInfo: result.ChangeInfo,
      delegationSet: result.DelegationSet,
    },
    201
  );
});

router.delete("/hosted-zones/:id", async (c: Context) => {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "id param required" }, 400);
  const client = getClient();
  const result = await client.send(
    new DeleteHostedZoneCommand({ Id: id })
  );
  return c.json({ changeInfo: result.ChangeInfo });
});

// ── Resource Record Sets ─────────────────────────────────

router.get("/hosted-zones/:id/record-sets", async (c: Context) => {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "id param required" }, 400);
  const client = getClient();
  const result = await client.send(
    new ListResourceRecordSetsCommand({ HostedZoneId: id })
  );
  return c.json({
    recordSets: result.ResourceRecordSets || [],
    total: result.ResourceRecordSets?.length || 0,
  });
});

router.post("/hosted-zones/:id/record-sets", async (c: Context) => {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "id param required" }, 400);
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(
    new ChangeResourceRecordSetsCommand({
      HostedZoneId: id,
      ChangeBatch: {
        Changes: [
          {
            Action: body.action || "CREATE",
            ResourceRecordSet: {
              Name: body.name,
              Type: body.type,
              TTL: body.ttl ?? 300,
              ResourceRecords: body.resourceRecords,
            },
          },
        ],
      },
    })
  );
  return c.json({ changeInfo: result.ChangeInfo }, 201);
});

router.delete("/hosted-zones/:id/record-sets", async (c: Context) => {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "id param required" }, 400);
  const name = c.req.query("name");
  const type = c.req.query("type");
  if (!name || !type)
    return c.json({ error: "name and type query parameters required" }, 400);
  const client = getClient();
  const result = await client.send(
    new ChangeResourceRecordSetsCommand({
      HostedZoneId: id,
      ChangeBatch: {
        Changes: [
          {
            Action: "DELETE",
            ResourceRecordSet: {
              Name: name,
              Type: type as any,
            },
          },
        ],
      },
    })
  );
  return c.json({ changeInfo: result.ChangeInfo });
});

// ── Health Checks ────────────────────────────────────────

router.get("/health-checks", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListHealthChecksCommand({}));
  return c.json({
    healthChecks: result.HealthChecks || [],
    total: result.HealthChecks?.length || 0,
  });
});

export default router;
