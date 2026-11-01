import { Hono } from "hono";
import type { Context } from "hono";
import { getAwsConfig } from "../../clients/aws";
import { Route53Client } from "@aws-sdk/client-route-53";
import {
  ListTagsForResourceCommand,
  ChangeTagsForResourceCommand,
  GetChangeCommand,
  GetDNSSECCommand,
  GetAccountLimitCommand,
} from "@aws-sdk/client-route-53";
import type { ResourceRecordSet } from "@aws-sdk/client-route-53";
import {
  ListHostedZonesCommand,
  GetHostedZoneCommand,
  CreateHostedZoneCommand,
  DeleteHostedZoneCommand,
  ListResourceRecordSetsCommand,
  ChangeResourceRecordSetsCommand,
  ListHealthChecksCommand,
  CreateHealthCheckCommand,
  DeleteHealthCheckCommand,
  ListHostedZonesByNameCommand,
  GetHostedZoneCountCommand,
  GetHealthCheckCommand,
  UpdateHealthCheckCommand,
  UpdateHostedZoneCommentCommand,
  AssociateVPCWithHostedZoneCommand,
  DisassociateVPCFromHostedZoneCommand,
  CreateVPCAssociationAuthorizationCommand,
  DeleteVPCAssociationAuthorizationCommand,
  ListVPCAssociationAuthorizationsCommand,
  ListHostedZonesByVPCCommand,
  GetHealthCheckStatusCommand,
  GetHostedZoneLimitCommand,
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
  const client = getClient();
  const result = await client.send(
    new DeleteHostedZoneCommand({ Id: id })
  );
  return c.json({ changeInfo: result.ChangeInfo });
});

// ── Resource Record Sets ─────────────────────────────────

router.get("/hosted-zones/:id/record-sets", async (c: Context) => {
  const id = c.req.param("id");
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
  const name = c.req.query("name");
  const type = c.req.query("type");
  if (!name || !type)
    return c.json({ error: "name and type query parameters required" }, 400);
  // AWS requires the full record-set body on DELETE: exactly one of AliasTarget
  // or [TTL + ResourceRecords]. Floci 2.x enforces this, so the frontend passes
  // the row's TTL/values along; without them the bare Name+Type form is sent
  // for older emulators that accept it.
  const ttlParam = c.req.query("ttl");
  const recordsParam = c.req.query("records");
  let resourceRecordSet: ResourceRecordSet = { Name: name, Type: type as any };
  if (ttlParam && recordsParam) {
    const ttl = Number(ttlParam);
    if (!Number.isNaN(ttl)) {
      resourceRecordSet = {
        ...resourceRecordSet,
        TTL: ttl,
        ResourceRecords: recordsParam.split(",").map((v) => ({ Value: v })),
      };
    }
  }
  const client = getClient();
  const result = await client.send(
    new ChangeResourceRecordSetsCommand({
      HostedZoneId: id,
      ChangeBatch: {
        Changes: [
          {
            Action: "DELETE",
            ResourceRecordSet: resourceRecordSet,
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

router.post("/health-checks", async (c: Context) => {
  const client = getClient();
  const body = await c.req.json();
  const result = await client.send(
    new CreateHealthCheckCommand({
      CallerReference: body.CallerReference || `hc-${Date.now()}`,
      HealthCheckConfig: {
        IPAddress: body.IPAddr,
        Port: body.Port,
        Type: body.Type,
        ResourcePath: body.ResourcePath,
        FullyQualifiedDomainName: body.FullyQualifiedDomainName,
        RequestInterval: body.RequestInterval,
        FailureThreshold: body.FailureThreshold,
      },
    })
  );
  return c.json({ healthCheck: result.HealthCheck });
});

router.delete("/health-checks/:id", async (c: Context) => {
  const client = getClient();
  const id = c.req.param("id");
  await client.send(new DeleteHealthCheckCommand({ HealthCheckId: id }));
  return c.json({});
});


// ── Tags ───────────────────────────────────────────────

router.get("/tags/:resourceType/:resourceId", async (c: Context) => {
  const resourceType = c.req.param("resourceType")!;
  const resourceId = c.req.param("resourceId")!;
  const client = getClient();
  const result = await client.send(
    new ListTagsForResourceCommand({
      ResourceType: resourceType as any,
      ResourceId: resourceId,
    })
  );
  const tags = (result.ResourceTagSet?.Tags || []).map((t: any) => ({
    key: t.Key,
    value: t.Value,
  }));
  return c.json({ tags });
});

router.post("/tags/:resourceType/:resourceId", async (c: Context) => {
  const resourceType = c.req.param("resourceType")!;
  const resourceId = c.req.param("resourceId")!;
  const body = await c.req.json<{ tags?: Record<string, string> }>();
  if (!body.tags || !Object.keys(body.tags).length)
    return c.json({ error: "tags is required" }, 400);
  const client = getClient();
  await client.send(
    new ChangeTagsForResourceCommand({
      ResourceType: resourceType as any,
      ResourceId: resourceId,
      AddTags: Object.entries(body.tags).map(([Key, Value]) => ({ Key, Value })),
    })
  );
  return c.json({ tagged: true });
});

router.delete("/tags/:resourceType/:resourceId", async (c: Context) => {
  const resourceType = c.req.param("resourceType")!;
  const resourceId = c.req.param("resourceId")!;
  const body = await c.req.json<{ tagKeys?: string[] }>();
  if (!body.tagKeys?.length) return c.json({ error: "tagKeys is required" }, 400);
  const client = getClient();
  await client.send(
    new ChangeTagsForResourceCommand({
      ResourceType: resourceType as any,
      ResourceId: resourceId,
      RemoveTagKeys: body.tagKeys,
    })
  );
  return c.json({ untagged: true });
});

// ── Change status + DNSSEC + limits ────────────────────

router.get("/changes/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(new GetChangeCommand({ Id: id }));
  return c.json({ changeInfo: result.ChangeInfo || null });
});

router.get("/hostedzones/:id/dnssec", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(new GetDNSSECCommand({ HostedZoneId: id }));
  return c.json({ status: result.Status || null, keySigningKeys: result.KeySigningKeys || [] });
});

router.get("/account-limit/:type", async (c: Context) => {
  const type = c.req.param("type")!;
  const client = getClient();
  const result: any = await client.send(new GetAccountLimitCommand({ Type: type as any }));
  return c.json({ limit: result.AccountLimit || null, count: result.Count ?? 0 });
});


// ── P1 gap audit ─────────────────────────────────────────

router.get("/hosted-zones-by-name", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListHostedZonesByNameCommand({
    DNSName: c.req.query("dnsName"),
    HostedZoneId: c.req.query("hostedZoneId"),
    MaxItems: c.req.query("maxItems") ? parseInt(c.req.query("maxItems")!) : undefined,
  }));
  return c.json({
    zones: (result.HostedZones || []).map((z: any) => ({ id: z.Id, name: z.Name, private: z.Config?.PrivateZone ?? false })),
    total: (result.HostedZones || []).length,
    dnsName: result.NextDNSName ?? null,
    truncated: result.IsTruncated ?? false,
  });
});

router.get("/hosted-zone-count", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetHostedZoneCountCommand({}));
  return c.json({ count: result.HostedZoneCount ?? 0 });
});

router.get("/health-checks/:id", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetHealthCheckCommand({ HealthCheckId: c.req.param("id")! }));
  return c.json({ healthCheck: result.HealthCheck ?? null });
});

router.put("/health-checks/:id", async (c: Context) => {
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(new UpdateHealthCheckCommand({
    HealthCheckId: c.req.param("id")!,
    HealthThreshold: body.healthThreshold,
    FailureThreshold: body.failureThreshold,
    ResourcePath: body.resourcePath,
    FullyQualifiedDomainName: body.fqdn,
  }));
  return c.json({ healthCheck: result.HealthCheck ?? null });
});


// ── Hosted zone comment ──────────────────────────────────

router.put("/hosted-zones/:id/comment", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  if (typeof body.comment !== "string") {
    return c.json({ error: "comment string is required" }, 400);
  }
  await getClient().send(new UpdateHostedZoneCommentCommand({ Id: id, Comment: body.comment }));
  return c.json({ id, comment: body.comment, updated: true });
});

// ── VPC association ──────────────────────────────────────

router.post("/hosted-zones/:id/associate-vpc", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  if (!body.vpcId || !body.vpcRegion) {
    return c.json({ error: "vpcId and vpcRegion are required" }, 400);
  }
  const result = await getClient().send(
    new AssociateVPCWithHostedZoneCommand({
      HostedZoneId: id,
      VPC: { VPCId: body.vpcId, VPCRegion: body.vpcRegion },
    } as any)
  );
  return c.json({ changeInfo: result.ChangeInfo || null });
});

router.post("/hosted-zones/:id/disassociate-vpc", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  if (!body.vpcId || !body.vpcRegion) {
    return c.json({ error: "vpcId and vpcRegion are required" }, 400);
  }
  const result = await getClient().send(
    new DisassociateVPCFromHostedZoneCommand({
      HostedZoneId: id,
      VPC: { VPCId: body.vpcId, VPCRegion: body.vpcRegion },
    } as any)
  );
  return c.json({ changeInfo: result.ChangeInfo || null });
});

// ── VPC association authorizations ───────────────────────

router.post("/hosted-zones/:id/vpc-authorizations", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  if (!body.vpcId || !body.vpcRegion) {
    return c.json({ error: "vpcId and vpcRegion are required" }, 400);
  }
  const result = await getClient().send(
    new CreateVPCAssociationAuthorizationCommand({
      HostedZoneId: id,
      VPC: { VPCId: body.vpcId, VPCRegion: body.vpcRegion },
    } as any)
  );
  return c.json({
    vpc: result.VPC ? { vpcId: result.VPC.VPCId, vpcRegion: result.VPC.VPCRegion } : null,
    hostedZoneId: id,
  });
});

router.delete("/hosted-zones/:id/vpc-authorizations", async (c: Context) => {
  const id = c.req.param("id");
  let body: any = {};
  try { body = await c.req.json<any>(); } catch {}
  if (!body.vpcId || !body.vpcRegion) {
    return c.json({ error: "vpcId and vpcRegion are required" }, 400);
  }
  await getClient().send(
    new DeleteVPCAssociationAuthorizationCommand({
      HostedZoneId: id,
      VPC: { VPCId: body.vpcId, VPCRegion: body.vpcRegion },
    } as any)
  );
  return c.json({ deleted: true });
});

router.get("/hosted-zones/:id/vpc-authorizations", async (c: Context) => {
  const id = c.req.param("id");
  const result: any = await getClient().send(
    new ListVPCAssociationAuthorizationsCommand({
      HostedZoneId: id,
      MaxResults: "10",
    } as any)
  );
  const authorizations = (result.Authorizations || []).map((v: any) => ({
    vpcId: v.VPCId,
    vpcRegion: v.VPCRegion,
  }));
  return c.json({ authorizations, total: authorizations.length, hostedZoneId: id });
});

router.get("/hosted-zones-by-vpc", async (c: Context) => {
  const vpcId = c.req.query("vpcId");
  const vpcRegion = c.req.query("vpcRegion") || "us-east-1";
  if (!vpcId) return c.json({ error: "vpcId query parameter required" }, 400);
  const result = await getClient().send(
    new ListHostedZonesByVPCCommand({ VPCId: vpcId, VPCRegion: vpcRegion as any })
  );
  const hostedZoneSummaries = (result.HostedZoneSummaries || []).map((z: any) => ({
    hostedZoneId: z.HostedZoneId,
    name: z.Name,
    owner: z.Owner?.OwningAccount || z.Owner?.OwningService || null,
  }));
  return c.json({ hostedZoneSummaries, total: hostedZoneSummaries.length });
});

// ── Health check status & hosted zone limit ──────────────

router.get("/health-checks/:id/status", async (c: Context) => {
  const id = c.req.param("id");
  const result = await getClient().send(new GetHealthCheckStatusCommand({ HealthCheckId: id }));
  const statuses = (result.HealthCheckObservations || []).map((o: any) => ({
    region: o.Region || null,
    ipAddress: o.IPAddress || null,
    statusReport: o.StatusReport
      ? { status: o.StatusReport.Status, checkedTime: o.StatusReport.CheckedTime }
      : null,
  }));
  return c.json({ observations: statuses, total: statuses.length });
});

router.get("/hosted-zones/:id/limit/:type", async (c: Context) => {
  const id = c.req.param("id");
  const type = c.req.param("type");
  const result: any = await getClient().send(new GetHostedZoneLimitCommand({
    HostedZoneId: id,
    Type: type as any,
  }));
  return c.json({
    limit: type,
    value: result.Value ?? null,
    count: result.Count ?? null,
  });
});

export default router;