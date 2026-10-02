import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { readJson } from "../../clients/read-json";
import {
  Inspector2Client,
  ListDelegatedAdminAccountsCommand,
  EnableDelegatedAdminAccountCommand,
  DisableDelegatedAdminAccountCommand,
  BatchGetAccountStatusCommand,
  EnableCommand,
  DescribeOrganizationConfigurationCommand,
  UpdateOrganizationConfigurationCommand,
} from "@aws-sdk/client-inspector2";

const router = new Hono();
const getClient = () => create(Inspector2Client);

// ── Delegated admin accounts ─────────────────────────────

router.get("/delegated-admins", async (c: Context) => {
  const result: any = await getClient().send(
    new ListDelegatedAdminAccountsCommand({})
  );
  return c.json({
    delegatedAdminAccounts: result.delegatedAdminAccounts || [],
    total: result.delegatedAdminAccounts?.length || 0,
  });
});

router.post("/delegated-admins/enable", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.accountId) return c.json({ error: "accountId is required" }, 400);
  const result: any = await getClient().send(
    new EnableDelegatedAdminAccountCommand({
      delegatedAdminAccountId: body.accountId,
    })
  );
  return c.json({ delegatedAdminAccountId: result.delegatedAdminAccountId }, 201);
});

router.post("/delegated-admins/disable", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.accountId) return c.json({ error: "accountId is required" }, 400);
  const result: any = await getClient().send(
    new DisableDelegatedAdminAccountCommand({
      delegatedAdminAccountId: body.accountId,
    })
  );
  return c.json({ delegatedAdminAccountId: result.delegatedAdminAccountId });
});

// ── Account status / enable ──────────────────────────────

router.post("/account-status", async (c: Context) => {
  const body: any = await readJson(c);
  if (!Array.isArray(body?.accountIds) || body.accountIds.length === 0)
    return c.json({ error: "accountIds array with at least one id is required" }, 400);
  const result: any = await getClient().send(
    new BatchGetAccountStatusCommand({ accountIds: body.accountIds })
  );
  return c.json({ accounts: result.accounts || [], failedAccounts: result.failedAccounts || [] });
});

router.post("/enable", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.resourceTypes || body.resourceTypes.length === 0)
    return c.json({ error: "resourceTypes array with at least one type is required" }, 400);
  const result: any = await getClient().send(
    new EnableCommand({ resourceTypes: body.resourceTypes })
  );
  return c.json({ accounts: result.accounts || [] });
});

// ── Organization configuration ───────────────────────────

router.get("/organization-configuration", async (c: Context) => {
  const result: any = await getClient().send(
    new DescribeOrganizationConfigurationCommand({})
  );
  // The SDK returns autoEnable at the top level of the response; the route
  // surfaces it as organizationConfiguration for the frontend.
  return c.json({ organizationConfiguration: result.autoEnable || null });
});

router.put("/organization-configuration", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.autoEnable) return c.json({ error: "autoEnable is required" }, 400);
  const result: any = await getClient().send(
    new UpdateOrganizationConfigurationCommand({ autoEnable: body.autoEnable })
  );
  return c.json({ organizationConfiguration: result.autoEnable || null });
});

export default router;
