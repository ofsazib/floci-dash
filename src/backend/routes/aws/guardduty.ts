import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  GuardDutyClient,
  ListDetectorsCommand,
  GetDetectorCommand,
  CreateDetectorCommand,
  UpdateDetectorCommand,
  DeleteDetectorCommand,
  ListMembersCommand,
  CreateMembersCommand,
  DescribeOrganizationConfigurationCommand,
  UpdateOrganizationConfigurationCommand,
  EnableOrganizationAdminAccountCommand,
  DisableOrganizationAdminAccountCommand,
} from "@aws-sdk/client-guardduty";

const router = new Hono();
const getClient = () => create(GuardDutyClient);

router.get("/detectors", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListDetectorsCommand({}));
  const detectorIds = result.DetectorIds || [];
  return c.json({ detectorIds, total: detectorIds.length, nextToken: result.NextToken ?? null });
});

router.get("/detectors/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const d = await client.send(new GetDetectorCommand({ DetectorId: id }));
  return c.json({
    detector: {
      status: d.Status ?? null,
      createdAt: String(d.CreatedAt ?? ""),
      findingPublishingFrequency: d.FindingPublishingFrequency ?? null,
      serviceRole: d.ServiceRole ?? null,
      tags: Object.keys(d.Tags ?? {}).length ? d.Tags : {},
    },
  });
});

router.post("/detectors", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.enable && body.enable !== false) {
    return c.json({ error: "enable is required" }, 400);
  }
  const client = getClient();
  const result = await client.send(
    new CreateDetectorCommand({
      Enable: body.enable,
      FindingPublishingFrequency: body.frequency,
    })
  );
  return c.json({ detectorId: result.DetectorId }, 201);
});

router.patch("/detectors/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const body = await c.req.json<any>();
  const client = getClient();
  await client.send(
    new UpdateDetectorCommand({
      DetectorId: id,
      Enable: body.enable,
      FindingPublishingFrequency: body.frequency,
    })
  );
  return c.json({ updated: true });
});

router.delete("/detectors/:id", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  await client.send(new DeleteDetectorCommand({ DetectorId: id }));
  return c.json({ deleted: true });
});

// ── Members ────────────────────────────────────────────────

router.get("/detectors/:id/members", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(new ListMembersCommand({ DetectorId: id }));
  const members = (result.Members || []).map((m: any) => ({
    accountId: m.AccountId,
    email: m.Email,
    masterId: m.MasterId,
    administratorId: m.AdministratorId,
    status: m.RelationshipStatus,
    invitedAt: m.InvitedAt,
    detectorId: m.DetectorId,
  }));
  return c.json({ members, total: members.length });
});

router.post("/detectors/:id/members", async (c: Context) => {
  const id = c.req.param("id")!;
  const body = await c.req.json<any>();
  if (!Array.isArray(body.accounts) || body.accounts.length === 0) {
    return c.json({ error: "accounts array is required" }, 400);
  }
  const client = getClient();
  const result = await client.send(
    new CreateMembersCommand({
      DetectorId: id,
      AccountDetails: body.accounts.map((a: any) => ({
        AccountId: a.accountId,
        Email: a.email,
      })),
    })
  );
  return c.json({ unprocessedAccounts: result.UnprocessedAccounts || [], created: true }, 201);
});

// ── Organization configuration ─────────────────────────────

router.get("/detectors/:id/organization-config", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(
    new DescribeOrganizationConfigurationCommand({ DetectorId: id })
  );
  return c.json({ autoEnable: result.AutoEnable ?? false, memberAccountLimitReached: result.MemberAccountLimitReached ?? false });
});

router.put("/detectors/:id/organization-config", async (c: Context) => {
  const id = c.req.param("id")!;
  const body = await c.req.json<any>();
  if (typeof body.autoEnable !== "boolean") {
    return c.json({ error: "autoEnable boolean is required" }, 400);
  }
  const client = getClient();
  await client.send(
    new UpdateOrganizationConfigurationCommand({ DetectorId: id, AutoEnable: body.autoEnable })
  );
  return c.json({ updated: true });
});

// ── Organization admin account ─────────────────────────────

router.post("/admin/enable", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.adminAccountId) {
    return c.json({ error: "adminAccountId is required" }, 400);
  }
  const client = getClient();
  await client.send(
    new EnableOrganizationAdminAccountCommand({ AdminAccountId: body.adminAccountId })
  );
  return c.json({ enabled: true });
});

router.post("/admin/disable", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.adminAccountId) {
    return c.json({ error: "adminAccountId is required" }, 400);
  }
  const client = getClient();
  await client.send(
    new DisableOrganizationAdminAccountCommand({ AdminAccountId: body.adminAccountId })
  );
  return c.json({ disabled: true });
});

export default router;
