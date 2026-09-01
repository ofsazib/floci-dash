import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { OrganizationsClient } from "@aws-sdk/client-organizations";
import {
  CreateOrganizationCommand,
  DescribeOrganizationCommand,
  DeleteOrganizationCommand,
  EnableAllFeaturesCommand,
  ListRootsCommand,
  CreateOrganizationalUnitCommand,
  UpdateOrganizationalUnitCommand,
  DeleteOrganizationalUnitCommand,
  DescribeOrganizationalUnitCommand,
  ListOrganizationalUnitsForParentCommand,
  ListParentsCommand,
  ListChildrenCommand,
  CreateAccountCommand,
  DescribeCreateAccountStatusCommand,
  ListCreateAccountStatusCommand,
  DescribeAccountCommand,
  ListAccountsCommand,
  ListAccountsForParentCommand,
  MoveAccountCommand,
  RemoveAccountFromOrganizationCommand,
  LeaveOrganizationCommand,
  CloseAccountCommand,
  CreatePolicyCommand,
  UpdatePolicyCommand,
  DeletePolicyCommand,
  DescribePolicyCommand,
  ListPoliciesCommand,
  AttachPolicyCommand,
  DetachPolicyCommand,
  ListPoliciesForTargetCommand,
  ListTargetsForPolicyCommand,
  EnablePolicyTypeCommand,
  DisablePolicyTypeCommand,
  DescribeEffectivePolicyCommand,
  TagResourceCommand,
  UntagResourceCommand,
  ListTagsForResourceCommand,
} from "@aws-sdk/client-organizations";

const router = new Hono();
const getClient = () => create(OrganizationsClient);

// ── Organization ─────────────────────────────────────────

router.get("/", async (c: Context) => {
  const client = getClient();
  try {
    const result = await client.send(new DescribeOrganizationCommand({}));
    return c.json({ organization: result.Organization! });
  } catch (e: any) {
    if (e.name === "AWSOrganizationsNotInUseException") {
/* istanbul ignore next */
      return c.json({ organization: null });
    }
    throw e;
  }
});

router.post("/create", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new CreateOrganizationCommand({}));
  return c.json({ organization: result.Organization! });
});

router.post("/delete", async (c: Context) => {
  const client = getClient();
  await client.send(new DeleteOrganizationCommand({}));
  return c.json({ deleted: true });
});

router.post("/enable-all-features", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new EnableAllFeaturesCommand({}));
  return c.json({ handshake: result.Handshake! });
});

// ── Roots ────────────────────────────────────────────────

router.get("/roots", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListRootsCommand({}));
  return c.json({ roots: result.Roots || [], total: (result.Roots || []).length });
});

// ── Organizational Units ─────────────────────────────────

router.get("/ous", async (c: Context) => {
  const parentId = c.req.query("parentId");
  if (!parentId) return c.json({ error: "parentId is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new ListOrganizationalUnitsForParentCommand({ ParentId: parentId })
  );
  return c.json({ organizationalUnits: result.OrganizationalUnits || [], total: (result.OrganizationalUnits || []).length });
});

router.get("/ous/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(new DescribeOrganizationalUnitCommand({ OrganizationalUnitId: id }));
  return c.json(result.OrganizationalUnit!);
});

router.post("/ous", async (c: Context) => {
  const body = await c.req.json<{ parentId: string; name: string; tags?: Record<string, string> }>();
  if (!body.parentId || !body.name) return c.json({ error: "parentId and name are required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateOrganizationalUnitCommand({
      ParentId: body.parentId,
      Name: body.name,
      Tags: body.tags
        ? Object.entries(body.tags).map(([Key, Value]) => ({ Key, Value }))
        : undefined,
    })
  );
  return c.json({ organizationalUnit: result.OrganizationalUnit! });
});

router.put("/ous/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const body = await c.req.json<{ name: string }>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new UpdateOrganizationalUnitCommand({
      OrganizationalUnitId: id,
      Name: body.name,
    })
  );
  return c.json(result.OrganizationalUnit!);
});

router.delete("/ous/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  await client.send(new DeleteOrganizationalUnitCommand({ OrganizationalUnitId: id }));
  return c.json({ deleted: true });
});

// ── Parents / Children ───────────────────────────────────

router.get("/parents", async (c: Context) => {
  const childId = c.req.query("childId");
  if (!childId) return c.json({ error: "childId is required" }, 400);
  const client = getClient();
  const result = await client.send(new ListParentsCommand({ ChildId: childId }));
  return c.json({ parents: result.Parents || [] });
});

router.get("/children", async (c: Context) => {
  const parentId = c.req.query("parentId");
  if (!parentId) return c.json({ error: "parentId is required" }, 400);
  const client = getClient();
  const result = await client.send(    new ListChildrenCommand({ ParentId: parentId, ChildType: "ACCOUNT" as any }));
  return c.json({ children: result.Children || [] });
});

// ── Accounts ─────────────────────────────────────────────

router.get("/accounts", async (c: Context) => {
  const parentId = c.req.query("parentId");
  const client = getClient();
  const result = parentId
    ? await client.send(new ListAccountsForParentCommand({ ParentId: parentId }))
    : await client.send(new ListAccountsCommand({}));
  return c.json({ accounts: result.Accounts || [], total: (result.Accounts || []).length });
});

router.post("/accounts", async (c: Context) => {
  const body = await c.req.json<{ email: string; name?: string; iamUserAccessToBilling?: string; parentId?: string; roleName?: string }>();
  if (!body.email) return c.json({ error: "email is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateAccountCommand({
      Email: body.email,
      AccountName: body.name,
      IamUserAccessToBilling: body.iamUserAccessToBilling as any,
      Tags: body.parentId ? [{ Key: "ParentId", Value: body.parentId }] : undefined,
      RoleName: body.roleName,
    } as any)
  );
  return c.json({ createAccountStatus: result.CreateAccountStatus! });
});

// Literal routes before :id to avoid param catch-all
router.get("/accounts/create-status", async (c: Context) => {
  const id = c.req.query("id");
  const client = getClient();
  if (id) {
    const result = await client.send(new DescribeCreateAccountStatusCommand({ CreateAccountRequestId: id }));
    return c.json(result.CreateAccountStatus!);
  }
  const result = await client.send(new ListCreateAccountStatusCommand({}));
  return c.json({ statuses: result.CreateAccountStatuses || [] });
});

router.get("/accounts/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(new DescribeAccountCommand({ AccountId: id }));
  return c.json(result.Account!);
});

router.post("/accounts/move", async (c: Context) => {
  const body = await c.req.json<{ accountId: string; sourceParentId: string; destinationParentId: string }>();
  if (!body.accountId || !body.sourceParentId || !body.destinationParentId)
    return c.json({ error: "accountId, sourceParentId, and destinationParentId are required" }, 400);
  const client = getClient();
  await client.send(
    new MoveAccountCommand({
      AccountId: body.accountId,
      SourceParentId: body.sourceParentId,
      DestinationParentId: body.destinationParentId,
    })
  );
  return c.json({ moved: true });
});

router.post("/accounts/remove", async (c: Context) => {
  const body = await c.req.json<{ accountId: string }>();
  if (!body.accountId) return c.json({ error: "accountId is required" }, 400);
  const client = getClient();
  await client.send(new RemoveAccountFromOrganizationCommand({ AccountId: body.accountId }));
  return c.json({ removed: true });
});

router.post("/accounts/leave", async (c: Context) => {
  const client = getClient();
  await client.send(new LeaveOrganizationCommand({}));
  return c.json({ left: true });
});

router.post("/accounts/close", async (c: Context) => {
  const body = await c.req.json<{ accountId: string }>();
  if (!body.accountId) return c.json({ error: "accountId is required" }, 400);
  const client = getClient();
  await client.send(new CloseAccountCommand({ AccountId: body.accountId }));
  return c.json({ closed: true });
});

// ── Policies ─────────────────────────────────────────────

router.get("/policies", async (c: Context) => {
  const filter = c.req.query("filter") || "SERVICE_CONTROL_POLICY";
  const client = getClient();
  const result = await client.send(new ListPoliciesCommand({ Filter: filter as any }));
  return c.json({ policies: result.Policies || [], total: (result.Policies || []).length });
});

router.get("/policies/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(new DescribePolicyCommand({ PolicyId: id }));
  return c.json(result.Policy!);
});

router.post("/policies", async (c: Context) => {
  const body = await c.req.json<{ name: string; description?: string; content: string; type?: string }>();
  if (!body.name || !body.content) return c.json({ error: "name and content are required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreatePolicyCommand({
      Name: body.name,
      Description: body.description,
      Content: body.content,
      Type: (body.type || "SERVICE_CONTROL_POLICY") as any,
    })
  );
  return c.json({ policy: result.Policy! });
});

router.put("/policies/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const body = await c.req.json<{ name?: string; description?: string; content?: string }>();
  const client = getClient();
  const result = await client.send(
    new UpdatePolicyCommand({
      PolicyId: id,
      Name: body.name,
      Description: body.description,
      Content: body.content,
    })
  );
  return c.json(result.Policy!);
});

router.delete("/policies/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  await client.send(new DeletePolicyCommand({ PolicyId: id }));
  return c.json({ deleted: true });
});

router.post("/policies/attach", async (c: Context) => {
  const body = await c.req.json<{ policyId: string; targetId: string }>();
  if (!body.policyId || !body.targetId) return c.json({ error: "policyId and targetId are required" }, 400);
  const client = getClient();
  await client.send(new AttachPolicyCommand({ PolicyId: body.policyId, TargetId: body.targetId }));
  return c.json({ attached: true });
});

router.post("/policies/detach", async (c: Context) => {
  const body = await c.req.json<{ policyId: string; targetId: string }>();
  if (!body.policyId || !body.targetId) return c.json({ error: "policyId and targetId are required" }, 400);
  const client = getClient();
  await client.send(new DetachPolicyCommand({ PolicyId: body.policyId, TargetId: body.targetId }));
  return c.json({ detached: true });
});

router.get("/policies/:id/targets", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(new ListTargetsForPolicyCommand({ PolicyId: id }));
  return c.json({ targets: result.Targets || [] });
});

router.get("/targets/:id/policies", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(    new ListPoliciesForTargetCommand({ TargetId: id, Filter: "SERVICE_CONTROL_POLICY" as any }));
  return c.json({ policies: result.Policies || [] });
});

router.post("/policies/enable-type", async (c: Context) => {
  const body = await c.req.json<{ policyType: string; rootId: string }>();
  if (!body.policyType || !body.rootId) return c.json({ error: "policyType and rootId are required" }, 400);
  const client = getClient();
  await client.send(new EnablePolicyTypeCommand({ PolicyType: body.policyType as any, RootId: body.rootId }));
  return c.json({ enabled: true });
});

router.post("/policies/disable-type", async (c: Context) => {
  const body = await c.req.json<{ policyType: string; rootId: string }>();
  if (!body.policyType || !body.rootId) return c.json({ error: "policyType and rootId are required" }, 400);
  const client = getClient();
  await client.send(new DisablePolicyTypeCommand({ PolicyType: body.policyType as any, RootId: body.rootId }));
  return c.json({ disabled: true });
});

router.get("/effective-policy", async (c: Context) => {
  const targetId = c.req.query("targetId");
  if (!targetId) return c.json({ error: "targetId is required" }, 400);
  const client = getClient();
  try {
    const result = await client.send(    new DescribeEffectivePolicyCommand({ TargetId: targetId, PolicyType: "SERVICE_CONTROL_POLICY" as any }));
    return c.json({ effectivePolicy: result.EffectivePolicy! });
  } catch (e: any) {
    if (e.name === "PolicyInUseException") {
      return c.json({ effectivePolicy: null });
    }
    throw e;
  }
});

// ── Tags ─────────────────────────────────────────────────

router.get("/tags", async (c: Context) => {
  const resourceArn = c.req.query("resourceArn");
  if (!resourceArn) return c.json({ error: "resourceArn is required" }, 400);
  const client = getClient();
  const result = await client.send(new ListTagsForResourceCommand({ ResourceId: resourceArn }));
  return c.json({ tags: result.Tags || [] });
});

router.post("/tags", async (c: Context) => {
  const body = await c.req.json<{ resourceArn: string; tags: Record<string, string> }>();
  if (!body.resourceArn) return c.json({ error: "resourceArn is required" }, 400);
  const entries = Object.entries(body.tags || {});
  if (!entries.length) return c.json({ error: "at least one tag is required" }, 400);
  const client = getClient();
  await client.send(
    new TagResourceCommand({
      ResourceId: body.resourceArn,
      Tags: entries.map(([Key, Value]) => ({ Key, Value })),
    })
  );
  return c.json({ tagged: true });
});

router.post("/tags/remove", async (c: Context) => {
  const body = await c.req.json<{ resourceArn: string; tagKeys: string[] }>();
  if (!body.resourceArn) return c.json({ error: "resourceArn is required" }, 400);
  if (!body.tagKeys || !body.tagKeys.length)
    return c.json({ error: "at least one tagKey is required" }, 400);
  const client = getClient();
  await client.send(
    new UntagResourceCommand({
      ResourceId: body.resourceArn,
      TagKeys: body.tagKeys,
    })
  );
  return c.json({ untagged: true });
});

export default router;
