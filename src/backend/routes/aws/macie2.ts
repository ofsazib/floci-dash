import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { readJson } from "../../clients/read-json";
import {
  Macie2Client,
  GetMacieSessionCommand,
  EnableMacieCommand,
  ListOrganizationAdminAccountsCommand,
  EnableOrganizationAdminAccountCommand,
  DescribeOrganizationConfigurationCommand,
  UpdateOrganizationConfigurationCommand,
  ListMembersCommand,
  CreateMemberCommand,
} from "@aws-sdk/client-macie2";

const router = new Hono();
const getClient = () => create(Macie2Client);

// ── Session ──────────────────────────────────────────────

router.get("/session", async (c: Context) => {
  try {
    const result: any = await getClient().send(new GetMacieSessionCommand({}));
    return c.json({
      enabled: true,
      status: result.status,
      serviceRole: result.serviceRole,
    });
  } catch (err: any) {
    if (err?.name === "ResourceNotFoundException") return c.json({ enabled: false });
    throw err;
  }
});

router.post("/session/enable", async (c: Context) => {
  await getClient().send(new EnableMacieCommand({}));
  return c.json({ enabled: true }, 201);
});

// ── Organization admin ───────────────────────────────────

router.get("/organization/admins", async (c: Context) => {
  const result: any = await getClient().send(new ListOrganizationAdminAccountsCommand({}));
  return c.json({ adminAccounts: result.adminAccounts || [] });
});

router.post("/organization/admins/enable", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.accountId) return c.json({ error: "accountId is required" }, 400);
  await getClient().send(
    new EnableOrganizationAdminAccountCommand({ adminAccountId: body.accountId })
  );
  return c.json({ enabled: true }, 201);
});

// ── Organization configuration ───────────────────────────

router.get("/organization/configuration", async (c: Context) => {
  const result: any = await getClient().send(new DescribeOrganizationConfigurationCommand({}));
  return c.json({ autoEnable: result.autoEnable ?? false });
});

router.patch("/organization/configuration", async (c: Context) => {
  const body: any = await readJson(c);
  if (typeof body?.autoEnable !== "boolean")
    return c.json({ error: "autoEnable boolean is required" }, 400);
  await getClient().send(
    new UpdateOrganizationConfigurationCommand({ autoEnable: body.autoEnable })
  );
  return c.json({ updated: true });
});

// ── Members (requires a Floci build newer than the 2.1.0 release) ──

router.get("/members", async (c: Context) => {
  const onlyAssociated = c.req.query("onlyAssociated");
  // SDK 3.1146 types onlyAssociated as string; the runtime serializes either way.
  const result: any = await getClient().send(
    new ListMembersCommand({
      onlyAssociated: onlyAssociated === "true" ? "true" : undefined,
    } as any)
  );
  return c.json({
    members: result.members || [],
    nextToken: result.nextToken,
  });
});

router.post("/members", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.accountId) return c.json({ error: "accountId is required" }, 400);
  if (!body?.email) return c.json({ error: "email is required" }, 400);
  const result: any = await getClient().send(
    new CreateMemberCommand({
      account: { accountId: body.accountId, email: body.email },
      tags: body.tags,
    })
  );
  return c.json({ arn: result.arn }, 201);
});

export default router;
