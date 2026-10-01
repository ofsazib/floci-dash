import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { readJson } from "../../clients/read-json";
import {
  VerifiedPermissionsClient,
  ListPolicyStoresCommand,
  CreatePolicyStoreCommand,
  GetPolicyStoreCommand,
  DeletePolicyStoreCommand,
  ListPoliciesCommand,
  CreatePolicyCommand,
  DeletePolicyCommand,
  ListIdentitySourcesCommand,
  CreateIdentitySourceCommand,
  DeleteIdentitySourceCommand,
  IsAuthorizedCommand,
} from "@aws-sdk/client-verifiedpermissions";

const router = new Hono();
const getClient = () => create(VerifiedPermissionsClient);

// ── Policy stores ────────────────────────────────────────

router.get("/stores", async (c: Context) => {
  const result: any = await getClient().send(new ListPolicyStoresCommand({}));
  return c.json({
    stores: result.policyStores || [],
    total: result.policyStores?.length || 0,
  });
});

router.post("/stores", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.name) return c.json({ error: "name is required" }, 400);
  if (!body?.validationSettings?.mode)
    return c.json({ error: "validationSettings.mode is required" }, 400);
  const result: any = await getClient().send(
    new CreatePolicyStoreCommand({
      name: body.name,
      description: body.description,
      validationSettings: body.validationSettings,
    } as any)
  );
  return c.json({ store: result }, 201);
});

router.get("/stores/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const result: any = await getClient().send(
    new GetPolicyStoreCommand({ policyStoreId: id })
  );
  return c.json({ store: result || null });
});

router.delete("/stores/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  await getClient().send(new DeletePolicyStoreCommand({ policyStoreId: id }));
  return c.json({ ok: true });
});

// ── Policies ─────────────────────────────────────────────

router.get("/stores/:id/policies", async (c: Context) => {
  const id = c.req.param("id")!;
  const result: any = await getClient().send(
    new ListPoliciesCommand({ policyStoreId: id })
  );
  return c.json({ policies: result.policies || [], total: result.policies?.length || 0 });
});

router.post("/stores/:id/policies", async (c: Context) => {
  const id = c.req.param("id")!;
  const body: any = await readJson(c);
  if (!body?.definition?.static?.statement)
    return c.json({ error: "definition.static.statement is required" }, 400);
  const result: any = await getClient().send(
    new CreatePolicyCommand({
      policyStoreId: id,
      name: body.name,
      definition: body.definition,
    })
  );
  return c.json({ policy: result }, 201);
});

router.delete("/stores/:id/policies/:policyId", async (c: Context) => {
  const id = c.req.param("id")!;
  const policyId = c.req.param("policyId")!;
  await getClient().send(
    new DeletePolicyCommand({ policyStoreId: id, policyId })
  );
  return c.json({ ok: true });
});

// ── Identity sources ─────────────────────────────────────

router.get("/stores/:id/identity-sources", async (c: Context) => {
  const id = c.req.param("id")!;
  const result: any = await getClient().send(
    new ListIdentitySourcesCommand({ policyStoreId: id })
  );
  return c.json({
    identitySources: result.identitySources || [],
    total: result.identitySources?.length || 0,
  });
});

router.post("/stores/:id/identity-sources", async (c: Context) => {
  const id = c.req.param("id")!;
  const body: any = await readJson(c);
  if (!body?.configuration?.cognitoUserPool?.userPoolArn)
    return c.json({ error: "configuration.cognitoUserPool.userPoolArn is required" }, 400);
  const result: any = await getClient().send(
    new CreateIdentitySourceCommand({
      policyStoreId: id,
      configuration: body.configuration,
      principalEntityType: body.principalEntityType,
    })
  );
  return c.json({ identitySource: result }, 201);
});

router.delete("/stores/:id/identity-sources/:sourceId", async (c: Context) => {
  const id = c.req.param("id")!;
  const sourceId = c.req.param("sourceId")!;
  await getClient().send(
    new DeleteIdentitySourceCommand({ policyStoreId: id, identitySourceId: sourceId })
  );
  return c.json({ ok: true });
});

// ── Authorization console ────────────────────────────────

router.post("/stores/:id/is-authorized", async (c: Context) => {
  const id = c.req.param("id")!;
  const body: any = await readJson(c);
  if (!body?.principal) return c.json({ error: "principal is required" }, 400);
  if (!body?.action) return c.json({ error: "action is required" }, 400);
  if (!body?.resource) return c.json({ error: "resource is required" }, 400);
  const result: any = await getClient().send(
    new IsAuthorizedCommand({
      policyStoreId: id,
      principal: body.principal,
      action: body.action,
      resource: body.resource,
      context: body.context,
    })
  );
  return c.json({
    decision: result.decision,
    determiningPolicies: result.determiningPolicies || [],
    errors: result.errors || [],
  });
});

export default router;
