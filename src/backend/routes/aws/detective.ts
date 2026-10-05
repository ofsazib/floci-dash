import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { readJson } from "../../clients/read-json";
import {
  DetectiveClient,
  ListGraphsCommand,
  ListOrganizationAdminAccountsCommand,
  EnableOrganizationAdminAccountCommand,
  DescribeOrganizationConfigurationCommand,
  UpdateOrganizationConfigurationCommand,
  ListMembersCommand,
  CreateMembersCommand,
  StartMonitoringMemberCommand,
} from "@aws-sdk/client-detective";

const router = new Hono();
const getClient = () => create(DetectiveClient);

// Floci emits Detective responses in PascalCase wire casing, which the
// schema-based SDK deserializer passes through unmapped. Normalize keys to
// camelCase so callers always see SDK-style names.
function camelize(value: any): any {
  if (Array.isArray(value)) return value.map(camelize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [
        key.charAt(0).toLowerCase() + key.slice(1),
        camelize(v),
      ])
    );
  }
  return value;
}

// ── Organization admin ───────────────────────────────────

router.post("/organization/admins", async (c: Context) => {
  const result: any = camelize(
    await getClient().send(new ListOrganizationAdminAccountsCommand({}))
  );
  return c.json({ administrators: result.administrators || [] });
});

router.post("/organization/admins/enable", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.accountId) return c.json({ error: "accountId is required" }, 400);
  await getClient().send(
    new EnableOrganizationAdminAccountCommand({ AccountId: body.accountId })
  );
  return c.json({ enabled: true }, 201);
});

// ── Graphs ───────────────────────────────────────────────

router.post("/graphs", async (c: Context) => {
  const result: any = camelize(await getClient().send(new ListGraphsCommand({})));
  return c.json({ graphList: result.graphList || [] });
});

// ── Organization configuration ───────────────────────────

router.post("/organization/configuration/get", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.graphArn) return c.json({ error: "graphArn is required" }, 400);
  const result: any = camelize(
    await getClient().send(new DescribeOrganizationConfigurationCommand({ GraphArn: body.graphArn }))
  );
  return c.json({ autoEnable: result.autoEnable ?? false });
});

router.post("/organization/configuration", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.graphArn) return c.json({ error: "graphArn is required" }, 400);
  if (typeof body?.autoEnable !== "boolean")
    return c.json({ error: "autoEnable boolean is required" }, 400);
  await getClient().send(
    new UpdateOrganizationConfigurationCommand({
      GraphArn: body.graphArn,
      AutoEnable: body.autoEnable,
    })
  );
  return c.json({ updated: true });
});

// ── Members ──────────────────────────────────────────────

router.post("/members", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.graphArn) return c.json({ error: "graphArn is required" }, 400);
  const result: any = camelize(
    await getClient().send(new ListMembersCommand({ GraphArn: body.graphArn }))
  );
  return c.json({ memberDetails: result.memberDetails || [] });
});

router.post("/members/create", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.graphArn) return c.json({ error: "graphArn is required" }, 400);
  if (!Array.isArray(body?.accounts) || body.accounts.length === 0)
    return c.json({ error: "accounts array with at least one member is required" }, 400);
  const result: any = camelize(
    await getClient().send(
      new CreateMembersCommand({
        GraphArn: body.graphArn,
        Accounts: body.accounts.map((a: any) => ({
          AccountId: a.accountId,
          EmailAddress: a.emailAddress,
        })),
      })
    )
  );
  return c.json({
    members: result.members || [],
    unprocessedAccounts: result.unprocessedAccounts || [],
  });
});

router.post("/members/monitoring", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.graphArn) return c.json({ error: "graphArn is required" }, 400);
  if (!body?.accountId) return c.json({ error: "accountId is required" }, 400);
  await getClient().send(
    new StartMonitoringMemberCommand({
      GraphArn: body.graphArn,
      AccountId: body.accountId,
    })
  );
  return c.json({ monitoring: true });
});

export default router;
