import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  SSOAdminClient,
  ListInstancesCommand,
  ListPermissionSetsCommand,
  DescribePermissionSetCommand,
  CreatePermissionSetCommand,
  UpdatePermissionSetCommand,
  DeletePermissionSetCommand,
  ListManagedPoliciesInPermissionSetCommand,
  AttachManagedPolicyToPermissionSetCommand,
  DetachManagedPolicyFromPermissionSetCommand,
  ListCustomerManagedPolicyReferencesInPermissionSetCommand,
  AttachCustomerManagedPolicyReferenceToPermissionSetCommand,
  DetachCustomerManagedPolicyReferenceFromPermissionSetCommand,
  GetInlinePolicyForPermissionSetCommand,
  PutInlinePolicyToPermissionSetCommand,
  DeleteInlinePolicyFromPermissionSetCommand,
  GetPermissionsBoundaryForPermissionSetCommand,
  PutPermissionsBoundaryToPermissionSetCommand,
  DeletePermissionsBoundaryFromPermissionSetCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
  ListAccountAssignmentsCommand,
  CreateAccountAssignmentCommand,
  DeleteAccountAssignmentCommand,
  ListAccountAssignmentCreationStatusCommand,
  DescribeAccountAssignmentCreationStatusCommand,
  ListAccountAssignmentDeletionStatusCommand,
  DescribeAccountAssignmentDeletionStatusCommand,
  ListPermissionSetProvisioningStatusCommand,
  DescribePermissionSetProvisioningStatusCommand,
  ProvisionPermissionSetCommand,
  ListAccountsForProvisionedPermissionSetCommand,
  ListTrustedTokenIssuersCommand,
  CreateTrustedTokenIssuerCommand,
  DescribeTrustedTokenIssuerCommand,
  UpdateTrustedTokenIssuerCommand,
  DeleteTrustedTokenIssuerCommand,
  DescribeInstanceAccessControlAttributeConfigurationCommand,
  CreateInstanceAccessControlAttributeConfigurationCommand,
  UpdateInstanceAccessControlAttributeConfigurationCommand,
  DeleteInstanceAccessControlAttributeConfigurationCommand,
  ListRegionsCommand,
  AddRegionCommand,
  RemoveRegionCommand,
} from "@aws-sdk/client-sso-admin";

const router = new Hono();
const getClient = () => create(SSOAdminClient);

// Floci surfaces SDK errors with names like ResourceNotFoundException even when
// the HTTP status is 400 — match by name first, then by status code.
router.onError((err: any, c: Context) => {
  if (err?.name === "ResourceNotFoundException" || err?.message?.includes("not found"))
    return c.json({ error: err.message || "Not found" }, 404);
  if (err?.name === "ValidationException" || err?.$metadata?.httpStatusCode === 400)
    return c.json({ error: err.message || "Validation error" }, 400);
  if (err?.name === "ConflictException" || err?.$metadata?.httpStatusCode === 409)
    return c.json({ error: err.message || "Conflict" }, 409);
  return c.json({ error: err?.message || "Internal server error" }, 500);
});

/** Returns the name of the first missing query parameter, or null when all present. */
function missingQuery(c: Context, names: string[]): string | null {
  for (const name of names) {
    if (!c.req.query(name)) return name;
  }
  return null;
}

/** Returns the name of the first missing body field, or null when all present. */
function missingBody(body: any, names: string[]): string | null {
  for (const name of names) {
    if (!body?.[name]) return name;
  }
  return null;
}

function missingQueryResponse(c: Context, missing: string | null) {
  return c.json({ error: `${missing} query parameter is required` }, 400);
}

function missingBodyResponse(c: Context, missing: string | null) {
  return c.json({ error: `${missing} is required` }, 400);
}

function tagsToEntries(tags: Record<string, string>) {
  return Object.entries(tags).map(([Key, Value]) => ({ Key, Value }));
}

// ── Instances ────────────────────────────────────────────

router.get("/instances", async (c: Context) => {
  const result: any = await getClient().send(new ListInstancesCommand({}));
  return c.json({ instances: result.Instances || [], total: result.Instances?.length || 0 });
});

// ── Permission Sets ──────────────────────────────────────

router.get("/permission-sets", async (c: Context) => {
  const instanceArn = c.req.query("instanceArn");
  const missing = missingQuery(c, ["instanceArn"]);
  if (missing) return missingQueryResponse(c, missing);

  const client = getClient();
  const result: any = await client.send(new ListPermissionSetsCommand({ InstanceArn: instanceArn }));
  const arns: string[] = result.PermissionSets || [];
  // ListPermissionSets returns ARNs only — describe each for name/description/session.
  const details = await Promise.all(
    arns.map((arn) =>
      client.send(
        new DescribePermissionSetCommand({ InstanceArn: instanceArn, PermissionSetArn: arn })
      )
    )
  );
  const permissionSets = arns.map((arn, i) => ({
    PermissionSetArn: arn,
    ...(details[i]?.PermissionSet || {}),
  }));
  return c.json({ permissionSets, total: permissionSets.length });
});

router.post("/permission-sets", async (c: Context) => {
  const body = await c.req.json<any>();
  const missing = missingBody(body, ["instanceArn", "name"]);
  if (missing) return missingBodyResponse(c, missing);

  const result: any = await getClient().send(
    new CreatePermissionSetCommand({
      InstanceArn: body.instanceArn,
      Name: body.name,
      Description: body.description,
      SessionDuration: body.sessionDuration,
    })
  );
  return c.json({ permissionSet: result.PermissionSet || null }, 201);
});

router.get("/permission-sets/detail", async (c: Context) => {
  const missing = missingQuery(c, ["instanceArn", "permissionSetArn"]);
  if (missing) return missingQueryResponse(c, missing);

  const result: any = await getClient().send(
    new DescribePermissionSetCommand({
      InstanceArn: c.req.query("instanceArn"),
      PermissionSetArn: c.req.query("permissionSetArn"),
    })
  );
  return c.json({ permissionSet: result.PermissionSet || null });
});

router.put("/permission-sets", async (c: Context) => {
  const body = await c.req.json<any>();
  const missing = missingBody(body, ["instanceArn", "permissionSetArn"]);
  if (missing) return missingBodyResponse(c, missing);

  const input: any = {
    InstanceArn: body.instanceArn,
    PermissionSetArn: body.permissionSetArn,
  };
  if (body.description !== undefined) input.Description = body.description;
  if (body.sessionDuration !== undefined) input.SessionDuration = body.sessionDuration;
  await getClient().send(new UpdatePermissionSetCommand(input));
  return c.json({ updated: true });
});

router.delete("/permission-sets", async (c: Context) => {
  const missing = missingQuery(c, ["instanceArn", "permissionSetArn"]);
  if (missing) return missingQueryResponse(c, missing);

  await getClient().send(
    new DeletePermissionSetCommand({
      InstanceArn: c.req.query("instanceArn"),
      PermissionSetArn: c.req.query("permissionSetArn"),
    })
  );
  return c.json({ deleted: true });
});

// ── Permission Set Policies ──────────────────────────────

router.get("/managed-policies", async (c: Context) => {
  const missing = missingQuery(c, ["instanceArn", "permissionSetArn"]);
  if (missing) return missingQueryResponse(c, missing);

  const result: any = await getClient().send(
    new ListManagedPoliciesInPermissionSetCommand({
      InstanceArn: c.req.query("instanceArn"),
      PermissionSetArn: c.req.query("permissionSetArn"),
    })
  );
  const policies = result.AttachedManagedPolicies || [];
  return c.json({ policies, total: policies.length });
});

router.post("/managed-policies", async (c: Context) => {
  const body = await c.req.json<any>();
  const missing = missingBody(body, ["instanceArn", "permissionSetArn", "managedPolicyArn"]);
  if (missing) return missingBodyResponse(c, missing);

  await getClient().send(
    new AttachManagedPolicyToPermissionSetCommand({
      InstanceArn: body.instanceArn,
      PermissionSetArn: body.permissionSetArn,
      ManagedPolicyArn: body.managedPolicyArn,
    })
  );
  return c.json({ attached: true }, 201);
});

router.delete("/managed-policies", async (c: Context) => {
  const missing = missingQuery(c, ["instanceArn", "permissionSetArn", "managedPolicyArn"]);
  if (missing) return missingQueryResponse(c, missing);

  await getClient().send(
    new DetachManagedPolicyFromPermissionSetCommand({
      InstanceArn: c.req.query("instanceArn"),
      PermissionSetArn: c.req.query("permissionSetArn"),
      ManagedPolicyArn: c.req.query("managedPolicyArn"),
    })
  );
  return c.json({ detached: true });
});

router.get("/customer-managed-policies", async (c: Context) => {
  const missing = missingQuery(c, ["instanceArn", "permissionSetArn"]);
  if (missing) return missingQueryResponse(c, missing);

  const result: any = await getClient().send(
    new ListCustomerManagedPolicyReferencesInPermissionSetCommand({
      InstanceArn: c.req.query("instanceArn"),
      PermissionSetArn: c.req.query("permissionSetArn"),
    })
  );
  const references = result.CustomerManagedPolicyReferences || [];
  return c.json({ references, total: references.length });
});

router.post("/customer-managed-policies", async (c: Context) => {
  const body = await c.req.json<any>();
  const missing = missingBody(body, ["instanceArn", "permissionSetArn", "name"]);
  if (missing) return missingBodyResponse(c, missing);

  await getClient().send(
    new AttachCustomerManagedPolicyReferenceToPermissionSetCommand({
      InstanceArn: body.instanceArn,
      PermissionSetArn: body.permissionSetArn,
      CustomerManagedPolicyReference: { Name: body.name, Path: body.path },
    })
  );
  return c.json({ attached: true }, 201);
});

router.delete("/customer-managed-policies", async (c: Context) => {
  const missing = missingQuery(c, ["instanceArn", "permissionSetArn", "name"]);
  if (missing) return missingQueryResponse(c, missing);

  await getClient().send(
    new DetachCustomerManagedPolicyReferenceFromPermissionSetCommand({
      InstanceArn: c.req.query("instanceArn"),
      PermissionSetArn: c.req.query("permissionSetArn"),
      CustomerManagedPolicyReference: { Name: c.req.query("name"), Path: c.req.query("path") },
    })
  );
  return c.json({ detached: true });
});

router.get("/inline-policy", async (c: Context) => {
  const missing = missingQuery(c, ["instanceArn", "permissionSetArn"]);
  if (missing) return missingQueryResponse(c, missing);

  const result: any = await getClient().send(
    new GetInlinePolicyForPermissionSetCommand({
      InstanceArn: c.req.query("instanceArn"),
      PermissionSetArn: c.req.query("permissionSetArn"),
    })
  );
  return c.json({ inlinePolicy: result.InlinePolicy ?? "" });
});

router.put("/inline-policy", async (c: Context) => {
  const body = await c.req.json<any>();
  const missing = missingBody(body, ["instanceArn", "permissionSetArn", "inlinePolicy"]);
  if (missing) return missingBodyResponse(c, missing);

  await getClient().send(
    new PutInlinePolicyToPermissionSetCommand({
      InstanceArn: body.instanceArn,
      PermissionSetArn: body.permissionSetArn,
      InlinePolicy: body.inlinePolicy,
    })
  );
  return c.json({ saved: true });
});

router.delete("/inline-policy", async (c: Context) => {
  const missing = missingQuery(c, ["instanceArn", "permissionSetArn"]);
  if (missing) return missingQueryResponse(c, missing);

  await getClient().send(
    new DeleteInlinePolicyFromPermissionSetCommand({
      InstanceArn: c.req.query("instanceArn"),
      PermissionSetArn: c.req.query("permissionSetArn"),
    })
  );
  return c.json({ deleted: true });
});

router.get("/permissions-boundary", async (c: Context) => {
  const missing = missingQuery(c, ["instanceArn", "permissionSetArn"]);
  if (missing) return missingQueryResponse(c, missing);

  const result: any = await getClient().send(
    new GetPermissionsBoundaryForPermissionSetCommand({
      InstanceArn: c.req.query("instanceArn"),
      PermissionSetArn: c.req.query("permissionSetArn"),
    })
  );
  return c.json({ permissionsBoundary: result.PermissionsBoundary || null });
});

router.put("/permissions-boundary", async (c: Context) => {
  const body = await c.req.json<any>();
  const missing = missingBody(body, ["instanceArn", "permissionSetArn"]);
  if (missing) return missingBodyResponse(c, missing);

  const boundary = body.managedPolicyArn
    ? { ManagedPolicyArn: body.managedPolicyArn }
    : body.customerName
      ? {
          CustomerManagedPolicyReference: {
            Name: body.customerName,
            Path: body.customerPath,
          },
        }
      : null;
  if (!boundary) return c.json({ error: "managedPolicyArn or customerName is required" }, 400);

  await getClient().send(
    new PutPermissionsBoundaryToPermissionSetCommand({
      InstanceArn: body.instanceArn,
      PermissionSetArn: body.permissionSetArn,
      PermissionsBoundary: boundary,
    })
  );
  return c.json({ saved: true });
});

router.delete("/permissions-boundary", async (c: Context) => {
  const missing = missingQuery(c, ["instanceArn", "permissionSetArn"]);
  if (missing) return missingQueryResponse(c, missing);

  await getClient().send(
    new DeletePermissionsBoundaryFromPermissionSetCommand({
      InstanceArn: c.req.query("instanceArn"),
      PermissionSetArn: c.req.query("permissionSetArn"),
    })
  );
  return c.json({ deleted: true });
});

// ── Tags ─────────────────────────────────────────────────

router.get("/tags", async (c: Context) => {
  const missing = missingQuery(c, ["resourceArn"]);
  if (missing) return missingQueryResponse(c, missing);

  const result: any = await getClient().send(
    new ListTagsForResourceCommand({ ResourceArn: c.req.query("resourceArn") })
  );
  const tags = (result.Tags || []).map((t: any) => ({ key: t.Key, value: t.Value }));
  return c.json({ tags, total: tags.length });
});

router.post("/tags", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body?.resourceArn) return c.json({ error: "resourceArn is required" }, 400);
  if (!body.tags || !Object.keys(body.tags).length)
    return c.json({ error: "tags is required" }, 400);

  await getClient().send(
    new TagResourceCommand({ ResourceArn: body.resourceArn, Tags: tagsToEntries(body.tags) })
  );
  return c.json({ tagged: true });
});

router.post("/tags/untag", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body?.resourceArn) return c.json({ error: "resourceArn is required" }, 400);
  if (!body.tagKeys?.length) return c.json({ error: "tagKeys is required" }, 400);

  await getClient().send(
    new UntagResourceCommand({ ResourceArn: body.resourceArn, TagKeys: body.tagKeys })
  );
  return c.json({ untagged: true });
});

// ── Account Assignments ──────────────────────────────────

router.get("/account-assignments", async (c: Context) => {
  const missing = missingQuery(c, ["instanceArn", "accountId", "permissionSetArn"]);
  if (missing) return missingQueryResponse(c, missing);

  const result: any = await getClient().send(
    new ListAccountAssignmentsCommand({
      InstanceArn: c.req.query("instanceArn"),
      AccountId: c.req.query("accountId"),
      PermissionSetArn: c.req.query("permissionSetArn"),
    })
  );
  const assignments = result.AccountAssignments || [];
  return c.json({ assignments, total: assignments.length });
});

router.post("/account-assignments", async (c: Context) => {
  const body = await c.req.json<any>();
  const missing = missingBody(body, [
    "instanceArn",
    "targetId",
    "permissionSetArn",
    "principalId",
    "principalType",
  ]);
  if (missing) return missingBodyResponse(c, missing);

  const result: any = await getClient().send(
    new CreateAccountAssignmentCommand({
      InstanceArn: body.instanceArn,
      TargetId: body.targetId,
      TargetType: "AWS_ACCOUNT",
      PermissionSetArn: body.permissionSetArn,
      PrincipalId: body.principalId,
      PrincipalType: body.principalType,
    })
  );
  return c.json({ creationStatus: result.AccountAssignmentCreationStatus || null }, 201);
});

router.delete("/account-assignments", async (c: Context) => {
  const missing = missingQuery(c, [
    "instanceArn",
    "targetId",
    "permissionSetArn",
    "principalId",
    "principalType",
  ]);
  if (missing) return missingQueryResponse(c, missing);

  const result: any = await getClient().send(
    new DeleteAccountAssignmentCommand({
      InstanceArn: c.req.query("instanceArn"),
      TargetId: c.req.query("targetId"),
      TargetType: "AWS_ACCOUNT",
      PermissionSetArn: c.req.query("permissionSetArn"),
      PrincipalId: c.req.query("principalId"),
      PrincipalType: c.req.query("principalType"),
    } as any)
  );
  return c.json({ deletionStatus: result.AccountAssignmentDeletionStatus || null });
});

router.get("/assignment-creation-status", async (c: Context) => {
  const missing = missingQuery(c, ["instanceArn"]);
  if (missing) return missingQueryResponse(c, missing);

  const status = c.req.query("status");
  const result: any = await getClient().send(
    new ListAccountAssignmentCreationStatusCommand({
      InstanceArn: c.req.query("instanceArn"),
      Filter: status ? { Status: status } : undefined,
    } as any)
  );
  const statuses = result.AccountAssignmentsCreationStatus || [];
  return c.json({ statuses, total: statuses.length });
});

router.get("/assignment-creation-status/:requestId", async (c: Context) => {
  const missing = missingQuery(c, ["instanceArn"]);
  if (missing) return missingQueryResponse(c, missing);

  const result: any = await getClient().send(
    new DescribeAccountAssignmentCreationStatusCommand({
      InstanceArn: c.req.query("instanceArn"),
      AccountAssignmentCreationRequestId: c.req.param("requestId"),
    })
  );
  return c.json({ status: result.AccountAssignmentCreationStatus || null });
});

router.get("/assignment-deletion-status", async (c: Context) => {
  const missing = missingQuery(c, ["instanceArn"]);
  if (missing) return missingQueryResponse(c, missing);

  const status = c.req.query("status");
  const result: any = await getClient().send(
    new ListAccountAssignmentDeletionStatusCommand({
      InstanceArn: c.req.query("instanceArn"),
      Filter: status ? { Status: status } : undefined,
    } as any)
  );
  const statuses = result.AccountAssignmentsDeletionStatus || [];
  return c.json({ statuses, total: statuses.length });
});

router.get("/assignment-deletion-status/:requestId", async (c: Context) => {
  const missing = missingQuery(c, ["instanceArn"]);
  if (missing) return missingQueryResponse(c, missing);

  const result: any = await getClient().send(
    new DescribeAccountAssignmentDeletionStatusCommand({
      InstanceArn: c.req.query("instanceArn"),
      AccountAssignmentDeletionRequestId: c.req.param("requestId"),
    })
  );
  return c.json({ status: result.AccountAssignmentDeletionStatus || null });
});

// ── Permission Set Provisioning ──────────────────────────

router.get("/permission-set-provisioning-status", async (c: Context) => {
  const missing = missingQuery(c, ["instanceArn"]);
  if (missing) return missingQueryResponse(c, missing);

  const status = c.req.query("status");
  const result: any = await getClient().send(
    new ListPermissionSetProvisioningStatusCommand({
      InstanceArn: c.req.query("instanceArn"),
      Filter: status ? { Status: status } : undefined,
    } as any)
  );
  const statuses = result.PermissionSetsProvisioningStatus || [];
  return c.json({ statuses, total: statuses.length });
});

router.get("/permission-set-provisioning-status/:requestId", async (c: Context) => {
  const missing = missingQuery(c, ["instanceArn"]);
  if (missing) return missingQueryResponse(c, missing);

  const result: any = await getClient().send(
    new DescribePermissionSetProvisioningStatusCommand({
      InstanceArn: c.req.query("instanceArn"),
      ProvisionPermissionSetRequestId: c.req.param("requestId"),
    })
  );
  return c.json({ status: result.PermissionSetProvisioningStatus || null });
});

router.post("/provision-permission-set", async (c: Context) => {
  const body = await c.req.json<any>();
  const missing = missingBody(body, ["instanceArn", "permissionSetArn", "targetType"]);
  if (missing) return missingBodyResponse(c, missing);

  const result: any = await getClient().send(
    new ProvisionPermissionSetCommand({
      InstanceArn: body.instanceArn,
      PermissionSetArn: body.permissionSetArn,
      TargetType: body.targetType,
      TargetId: body.targetId,
    })
  );
  return c.json({ provisioningStatus: result.PermissionSetProvisioningStatus || null }, 201);
});

router.get("/accounts-for-provisioned-permission-set", async (c: Context) => {
  const missing = missingQuery(c, ["instanceArn", "permissionSetArn"]);
  if (missing) return missingQueryResponse(c, missing);

  const result: any = await getClient().send(
    new ListAccountsForProvisionedPermissionSetCommand({
      InstanceArn: c.req.query("instanceArn"),
      PermissionSetArn: c.req.query("permissionSetArn"),
    })
  );
  const accountIds = result.AccountIds || [];
  return c.json({ accountIds, total: accountIds.length });
});

// ── Trusted Token Issuers ────────────────────────────────

router.get("/trusted-token-issuers", async (c: Context) => {
  const missing = missingQuery(c, ["instanceArn"]);
  if (missing) return missingQueryResponse(c, missing);

  const result: any = await getClient().send(
    new ListTrustedTokenIssuersCommand({ InstanceArn: c.req.query("instanceArn") })
  );
  const trustedTokenIssuers = result.TrustedTokenIssuers || [];
  return c.json({ trustedTokenIssuers, total: trustedTokenIssuers.length });
});

router.post("/trusted-token-issuers", async (c: Context) => {
  const body = await c.req.json<any>();
  const missing = missingBody(body, [
    "instanceArn",
    "name",
    "issuerUrl",
    "claimAttributePath",
    "identityStoreAttributePath",
  ]);
  if (missing) return missingBodyResponse(c, missing);

  const result: any = await getClient().send(
    new CreateTrustedTokenIssuerCommand({
      InstanceArn: body.instanceArn,
      Name: body.name,
      TrustedTokenIssuerType: "OIDC_JWT",
      TrustedTokenIssuerConfiguration: {
        OidcJwtConfiguration: {
          ClaimAttributePath: body.claimAttributePath,
          IdentityStoreAttributePath: body.identityStoreAttributePath,
          IssuerUrl: body.issuerUrl,
          JwksRetrievalOption: "OPEN_ID_DISCOVERY",
        },
      },
    })
  );
  return c.json({ trustedTokenIssuerArn: result.TrustedTokenIssuerArn }, 201);
});

router.get("/trusted-token-issuers/detail", async (c: Context) => {
  const missing = missingQuery(c, ["trustedTokenIssuerArn"]);
  if (missing) return missingQueryResponse(c, missing);

  const result: any = await getClient().send(
    new DescribeTrustedTokenIssuerCommand({
      TrustedTokenIssuerArn: c.req.query("trustedTokenIssuerArn"),
    })
  );
  return c.json({ trustedTokenIssuer: result || null });
});

router.put("/trusted-token-issuers", async (c: Context) => {
  const body = await c.req.json<any>();
  const missing = missingBody(body, ["trustedTokenIssuerArn"]);
  if (missing) return missingBodyResponse(c, missing);

  const input: any = { TrustedTokenIssuerArn: body.trustedTokenIssuerArn };
  if (body.name) input.Name = body.name;
  const oidc: any = {};
  if (body.claimAttributePath) oidc.ClaimAttributePath = body.claimAttributePath;
  if (body.identityStoreAttributePath)
    oidc.IdentityStoreAttributePath = body.identityStoreAttributePath;
  if (body.jwksRetrievalOption) oidc.JwksRetrievalOption = body.jwksRetrievalOption;
  if (Object.keys(oidc).length) {
    input.TrustedTokenIssuerConfiguration = { OidcJwtConfiguration: oidc };
  }
  await getClient().send(new UpdateTrustedTokenIssuerCommand(input));
  return c.json({ updated: true });
});

router.delete("/trusted-token-issuers", async (c: Context) => {
  const missing = missingQuery(c, ["trustedTokenIssuerArn"]);
  if (missing) return missingQueryResponse(c, missing);

  await getClient().send(
    new DeleteTrustedTokenIssuerCommand({
      TrustedTokenIssuerArn: c.req.query("trustedTokenIssuerArn"),
    })
  );
  return c.json({ deleted: true });
});

// ── Instance Access Control Attributes ───────────────────

router.get("/access-control-attribute-configuration", async (c: Context) => {
  const missing = missingQuery(c, ["instanceArn"]);
  if (missing) return missingQueryResponse(c, missing);

  const result: any = await getClient().send(
    new DescribeInstanceAccessControlAttributeConfigurationCommand({
      InstanceArn: c.req.query("instanceArn"),
    })
  );
  return c.json({
    configuration: result.InstanceAccessControlAttributeConfiguration || null,
    status: result.Status,
    statusReason: result.StatusReason,
  });
});

function accessControlAttributes(body: any) {
  return body.attributes.map((a: any) => ({
    Key: a.key,
    Value: { Source: [a.source] },
  }));
}

router.post("/access-control-attribute-configuration", async (c: Context) => {
  const body = await c.req.json<any>();
  const missing = missingBody(body, ["instanceArn"]);
  if (missing) return missingBodyResponse(c, missing);
  if (!body.attributes?.length) return c.json({ error: "attributes is required" }, 400);

  await getClient().send(
    new CreateInstanceAccessControlAttributeConfigurationCommand({
      InstanceArn: body.instanceArn,
      InstanceAccessControlAttributeConfiguration: {
        AccessControlAttributes: accessControlAttributes(body),
      },
    })
  );
  return c.json({ created: true }, 201);
});

router.put("/access-control-attribute-configuration", async (c: Context) => {
  const body = await c.req.json<any>();
  const missing = missingBody(body, ["instanceArn"]);
  if (missing) return missingBodyResponse(c, missing);
  if (!body.attributes?.length) return c.json({ error: "attributes is required" }, 400);

  await getClient().send(
    new UpdateInstanceAccessControlAttributeConfigurationCommand({
      InstanceArn: body.instanceArn,
      InstanceAccessControlAttributeConfiguration: {
        AccessControlAttributes: accessControlAttributes(body),
      },
    })
  );
  return c.json({ updated: true });
});

router.delete("/access-control-attribute-configuration", async (c: Context) => {
  const missing = missingQuery(c, ["instanceArn"]);
  if (missing) return missingQueryResponse(c, missing);

  await getClient().send(
    new DeleteInstanceAccessControlAttributeConfigurationCommand({
      InstanceArn: c.req.query("instanceArn"),
    })
  );
  return c.json({ deleted: true });
});

// ── Regions ──────────────────────────────────────────────

router.get("/regions", async (c: Context) => {
  const missing = missingQuery(c, ["instanceArn"]);
  if (missing) return missingQueryResponse(c, missing);

  const result: any = await getClient().send(
    new ListRegionsCommand({ InstanceArn: c.req.query("instanceArn") })
  );
  const regions = result.Regions || [];
  return c.json({ regions, total: regions.length });
});

router.post("/regions", async (c: Context) => {
  const body = await c.req.json<any>();
  const missing = missingBody(body, ["instanceArn", "regionName"]);
  if (missing) return missingBodyResponse(c, missing);

  const result: any = await getClient().send(
    new AddRegionCommand({ InstanceArn: body.instanceArn, RegionName: body.regionName })
  );
  return c.json({ status: result.Status || null }, 201);
});

router.delete("/regions", async (c: Context) => {
  const missing = missingQuery(c, ["instanceArn", "regionName"]);
  if (missing) return missingQueryResponse(c, missing);

  const result: any = await getClient().send(
    new RemoveRegionCommand({
      InstanceArn: c.req.query("instanceArn"),
      RegionName: c.req.query("regionName"),
    })
  );
  return c.json({ status: result.Status || null });
});

export default router;
