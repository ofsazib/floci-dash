import { Hono } from "hono";
import type { Context } from "hono";
import {
  IAMClient,
  // Users
  ListUsersCommand,
  CreateUserCommand,
  GetUserCommand,
  DeleteUserCommand,
  UpdateUserCommand,
  ListUserTagsCommand,
  // Roles
  ListRolesCommand,
  CreateRoleCommand,
  GetRoleCommand,
  DeleteRoleCommand,
  UpdateRoleCommand,
  ListAttachedRolePoliciesCommand,
  ListRoleTagsCommand,
  // Groups
  ListGroupsCommand,
  CreateGroupCommand,
  DeleteGroupCommand,
  ListGroupsForUserCommand,
  GetGroupCommand,
  AddUserToGroupCommand,
  RemoveUserFromGroupCommand,
  SetDefaultPolicyVersionCommand,
  ListPolicyTagsCommand,
  TagRoleCommand,
  UntagRoleCommand,
  TagPolicyCommand,
  UntagPolicyCommand,
  TagUserCommand,
  UntagUserCommand,
  // Policies
  ListPoliciesCommand,
  CreatePolicyCommand,
  GetPolicyCommand,
  DeletePolicyCommand,
  ListPolicyVersionsCommand,
  GetPolicyVersionCommand,
  CreatePolicyVersionCommand,
  DeletePolicyVersionCommand,
  // Attachments
  AttachUserPolicyCommand,
  DetachUserPolicyCommand,
  ListAttachedUserPoliciesCommand,
  AttachRolePolicyCommand,
  DetachRolePolicyCommand,
  // Access keys
  ListAccessKeysCommand,
  CreateAccessKeyCommand,
  DeleteAccessKeyCommand,
  UpdateAccessKeyCommand,
  // Inline policies
  ListUserPoliciesCommand,
  GetUserPolicyCommand,
  PutUserPolicyCommand,
  DeleteUserPolicyCommand,
  ListGroupPoliciesCommand,
  GetGroupPolicyCommand,
  PutGroupPolicyCommand,
  DeleteGroupPolicyCommand,
  // Instance profiles
  ListInstanceProfilesCommand,
  CreateInstanceProfileCommand,
  DeleteInstanceProfileCommand,
  AddRoleToInstanceProfileCommand,
  RemoveRoleFromInstanceProfileCommand,
  // Permission boundaries
  PutUserPermissionsBoundaryCommand,
  DeleteUserPermissionsBoundaryCommand,
  PutRolePermissionsBoundaryCommand,
  DeleteRolePermissionsBoundaryCommand,
  PutRolePolicyCommand,
  DeleteRolePolicyCommand,
  UpdateAssumeRolePolicyCommand,
  SimulatePrincipalPolicyCommand,
  // P1 gap audit — managed policy attachments (groups), policy entities/versions
  AttachGroupPolicyCommand,
  DetachGroupPolicyCommand,
  ListAttachedGroupPoliciesCommand,
  ListEntitiesForPolicyCommand,
  // P1 — users/roles extras
  CreateServiceLinkedRoleCommand,
  DeleteServiceLinkedRoleCommand,
  GetServiceLinkedRoleDeletionStatusCommand,
  // P1 — role inline policies
  ListRolePoliciesCommand,
  GetRolePolicyCommand,
  // P1 — instance profiles + access keys
  GetInstanceProfileCommand,
  ListInstanceProfilesForRoleCommand,
  GetAccessKeyLastUsedCommand,
  // P1 — account aliases + summary
  CreateAccountAliasCommand,
  DeleteAccountAliasCommand,
  ListAccountAliasesCommand,
  GetAccountSummaryCommand,
  // P1 — MFA, SAML, server certs
  ListMFADevicesCommand,
  ListSAMLProvidersCommand,
  ListServerCertificatesCommand,
  // P1 — OIDC providers
  CreateOpenIDConnectProviderCommand,
  DeleteOpenIDConnectProviderCommand,
  UpdateOpenIDConnectProviderThumbprintCommand,
  GetOpenIDConnectProviderCommand,
  ListOpenIDConnectProvidersCommand,
  AddClientIDToOpenIDConnectProviderCommand,
  RemoveClientIDFromOpenIDConnectProviderCommand,
  // P1 — login profile (read-only; Floci implements Get only)
  GetLoginProfileCommand,
} from "@aws-sdk/client-iam";
import { getAwsConfig } from "../../clients/aws";
import { sanitizeName, validateJson } from "../../clients/sanitize";

const router = new Hono();

function iam() {
  return new IAMClient(getAwsConfig());
}

function mapUser(u: any) {
  return {
    name: u.UserName,
    arn: u.Arn,
    userId: u.UserId,
    path: u.Path,
    createDate: u.CreateDate,
    passwordLastUsed: u.PasswordLastUsed,
  };
}

function mapRole(r: any) {
  return {
    name: r.RoleName,
    arn: r.Arn,
    roleId: r.RoleId,
    path: r.Path,
    createDate: r.CreateDate,
    maxSessionDuration: r.MaxSessionDuration,
    description: r.Description,
    assumeRolePolicyDocument: r.AssumeRolePolicyDocument
      ? decodeURIComponent(r.AssumeRolePolicyDocument)
      : null,
  };
}

function mapGroup(g: any) {
  return {
    name: g.GroupName,
    arn: g.Arn,
    groupId: g.GroupId,
    path: g.Path,
    createDate: g.CreateDate,
  };
}

function mapPolicy(p: any) {
  return {
    name: p.PolicyName,
    arn: p.Arn,
    policyId: p.PolicyId,
    path: p.Path,
    defaultVersionId: p.DefaultVersionId,
    attachmentCount: p.AttachmentCount,
    isAttachable: p.IsAttachable,
    createDate: p.CreateDate,
    updateDate: p.UpdateDate,
    description: p.Description,
    scope: p.PolicyScope || (p.Arn?.includes("aws:policy") ? "AWS" : "Local"),
  };
}

function mapAccessKey(k: any) {
  return {
    accessKeyId: k.AccessKeyId,
    userName: k.UserName,
    status: k.Status,
    createDate: k.CreateDate,
  };
}

function mapInstanceProfile(p: any) {
  return {
    name: p.InstanceProfileName,
    arn: p.Arn,
    instanceProfileId: p.InstanceProfileId,
    path: p.Path,
    createDate: p.CreateDate,
    roles: (p.Roles || []).map((r: any) => r.RoleName),
  };
}

// ─── USERS ───────────────────────────────────────────────

router.get("/users", async (c: Context) => {
  const result = await iam().send(new ListUsersCommand({}));
  const users = (result.Users || []).map(mapUser);
  return c.json({ users, total: users.length });
});

router.get("/users/:name", async (c: Context) => {
  const name = c.req.param("name");
  const result = await iam().send(new GetUserCommand({ UserName: name }));

  // Fetch groups and attached policies in parallel
  const [groupsRes, attachedRes, accessKeysRes, inlineRes, tagsRes] = await Promise.all([
    iam().send(new ListGroupsForUserCommand({ UserName: name })),
    iam().send(new ListAttachedUserPoliciesCommand({ UserName: name })),
    iam().send(new ListAccessKeysCommand({ UserName: name })),
    iam().send(new ListUserPoliciesCommand({ UserName: name })),
    iam().send(new ListUserTagsCommand({ UserName: name })),
  ]);

  const user = mapUser(result.User);
  const tags: Record<string, string> = {};
  (tagsRes.Tags || []).forEach((t: any) => { tags[t.Key] = t.Value; });
  return c.json({
    user,
    groups: (groupsRes.Groups || []).map(mapGroup),
    attachedPolicies: (attachedRes.AttachedPolicies || []).map((p: any) => ({
      name: p.PolicyName,
      arn: p.PolicyArn,
    })),
    accessKeys: (accessKeysRes.AccessKeyMetadata || []).map(mapAccessKey),
    tags,
    inlinePolicies: inlineRes.PolicyNames || [],
  });
});

router.post("/users", async (c: Context) => {
  const body = await c.req.json<any>();
  const username = sanitizeName(body.name || "", 128);
  if (!username) return c.json({ error: "name is required" }, 400);
  await iam().send(new CreateUserCommand({ UserName: username, Path: sanitizeName(body.path || "", 512) }));
  return c.json({ name: username, created: true });
});

router.delete("/users/:name", async (c: Context) => {
  const name = c.req.param("name");
  await iam().send(new DeleteUserCommand({ UserName: name }));
  return c.json({ name, deleted: true });
});

router.get("/users/:name/tags", async (c: Context) => {
  const name = c.req.param("name");
  const result = await iam().send(new ListUserTagsCommand({ UserName: name }));
  const tags: Record<string, string> = {};
  (result.Tags || []).forEach((t: any) => { tags[t.Key] = t.Value; });
  return c.json({ tags });
});

router.post("/users/:name/tags", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<any>();
  const tags = (body.tags || []).filter((t: any) => t.Key && t.Value);
  if (tags.length === 0) return c.json({ error: "tags must be a non-empty array of {Key, Value}" }, 400);
  await iam().send(new TagUserCommand({ UserName: name, Tags: tags }));
  return c.json({ tagged: true });
});

router.delete("/users/:name/tags", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<any>();
  if (!body.tagKeys || !Array.isArray(body.tagKeys) || body.tagKeys.length === 0)
    return c.json({ error: "tagKeys must be a non-empty array" }, 400);
  await iam().send(new UntagUserCommand({ UserName: name, TagKeys: body.tagKeys }));
  return c.json({ untagged: true });
});

// ─── ROLES ───────────────────────────────────────────────

router.get("/roles", async (c: Context) => {
  const result = await iam().send(new ListRolesCommand({}));
  const roles = (result.Roles || []).map(mapRole);
  return c.json({ roles, total: roles.length });
});

router.get("/roles/:name", async (c: Context) => {
  const name = c.req.param("name");
  const result = await iam().send(new GetRoleCommand({ RoleName: name }));

  const [attachedRes, tagsRes] = await Promise.all([
    iam().send(new ListAttachedRolePoliciesCommand({ RoleName: name })),
    iam().send(new ListRoleTagsCommand({ RoleName: name })),
  ]);

  const role = mapRole(result.Role);
  const tags: Record<string, string> = {};
  (tagsRes.Tags || []).forEach((t: any) => { tags[t.Key] = t.Value; });

  return c.json({
    role,
    attachedPolicies: (attachedRes.AttachedPolicies || []).map((p: any) => ({
      name: p.PolicyName,
      arn: p.PolicyArn,
    })),
    tags,
  });
});

router.post("/roles", async (c: Context) => {
  const body = await c.req.json<any>();
  const roleName = sanitizeName(body.name || "", 128);
  if (!roleName) return c.json({ error: "name is required" }, 400);
  const trustDoc = body.assumeRolePolicyDocument || JSON.stringify({
    Version: "2012-10-17",
    Statement: [{ Effect: "Allow", Principal: { Service: "ec2.amazonaws.com" }, Action: "sts:AssumeRole" }],
  });
  // Validate trust policy JSON if provided
  if (body.assumeRolePolicyDocument) {
    const validation = validateJson(body.assumeRolePolicyDocument, "object");
    if (!validation.valid) {
      return c.json({ error: `Invalid trust policy: ${validation.error}` }, 400);
    }
  }
  await iam().send(
    new CreateRoleCommand({
      RoleName: roleName,
      AssumeRolePolicyDocument: trustDoc,
      Description: sanitizeName(body.description || "", 1000),
      MaxSessionDuration: body.maxSessionDuration,
      Path: sanitizeName(body.path || "", 512),
    })
  );
  return c.json({ name: roleName, created: true });
});

router.delete("/roles/:name", async (c: Context) => {
  const name = c.req.param("name");
  await iam().send(new DeleteRoleCommand({ RoleName: name }));
  return c.json({ name, deleted: true });
});

// ─── GROUPS ──────────────────────────────────────────────

router.get("/groups", async (c: Context) => {
  const result = await iam().send(new ListGroupsCommand({}));
  const groups = (result.Groups || []).map(mapGroup);
  return c.json({ groups, total: groups.length });
});

router.post("/groups", async (c: Context) => {  const body = await c.req.json<any>();
  const groupName = sanitizeName(body.name || "", 128);
  if (!groupName) return c.json({ error: "name is required" }, 400);
  await iam().send(
    new CreateGroupCommand({ GroupName: groupName, Path: sanitizeName(body.path || "", 512) })
  );
  return c.json({ name: groupName, created: true });
});

router.delete("/groups/:name", async (c: Context) => {
  const name = c.req.param("name");
  await iam().send(new DeleteGroupCommand({ GroupName: name }));
  return c.json({ name, deleted: true });
});

router.get("/groups/:name", async (c: Context) => {
  const name = c.req.param("name");
  const result = await iam().send(new GetGroupCommand({ GroupName: name }));
  return c.json({ group: mapGroup(result.Group), users: result.Users || [] });
});

router.post("/groups/:name/users", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<any>();
  if (!body.userName) return c.json({ error: "userName is required" }, 400);
  await iam().send(new AddUserToGroupCommand({ GroupName: name, UserName: body.userName }));
  return c.json({ added: true });
});

router.delete("/groups/:name/users/:userName", async (c: Context) => {
  const name = c.req.param("name");
  const userName = c.req.param("userName");
  await iam().send(new RemoveUserFromGroupCommand({ GroupName: name, UserName: userName }));
  return c.json({ removed: true });
});

// ─── POLICIES ────────────────────────────────────────────

router.get("/policies", async (c: Context) => {
  const scope = (c.req.query("scope") || "Local") as any;
  const result = await iam().send(new ListPoliciesCommand({ Scope: scope }));
  const policies = (result.Policies || []).map(mapPolicy);
  return c.json({ policies, total: policies.length });
});

router.get("/policies/detail", async (c: Context) => {
  const policyArn = c.req.query("arn");
  if (!policyArn) return c.json({ error: "arn query parameter required" }, 400);

  const [policyRes, versionsRes, tagsRes] = await Promise.all([
    iam().send(new GetPolicyCommand({ PolicyArn: policyArn })),
    iam().send(new ListPolicyVersionsCommand({ PolicyArn: policyArn })),
    iam().send(new ListPolicyTagsCommand({ PolicyArn: policyArn })),
  ]);

  const tags: Record<string, string> = {};
  (tagsRes.Tags || []).forEach((t: any) => { tags[t.Key] = t.Value; });

  return c.json({
    policy: policyRes.Policy ? mapPolicy(policyRes.Policy) : null,
    versions: (versionsRes.Versions || []).map((v: any) => ({
      versionId: v.VersionId,
      isDefaultVersion: v.IsDefaultVersion,
      createDate: v.CreateDate,
    })),
    tags,
  });
});

router.get("/policies/version", async (c: Context) => {
  const policyArn = c.req.query("arn");
  const versionId = c.req.query("versionId");
  if (!policyArn || !versionId) return c.json({ error: "arn and versionId query parameters required" }, 400);
  const result = await iam().send(
    new GetPolicyVersionCommand({ PolicyArn: policyArn, VersionId: versionId })
  );
  const doc = result.PolicyVersion?.Document
    ? decodeURIComponent(result.PolicyVersion.Document as string)
    : null;
  return c.json({
    versionId,
    document: doc,
    isDefaultVersion: result.PolicyVersion?.IsDefaultVersion,
  });
});

router.post("/policies/:arn/set-default-version", async (c: Context) => {
  const policyArn = c.req.param("arn");
  const body = await c.req.json<any>();
  if (!body.versionId) return c.json({ error: "versionId is required" }, 400);
  await iam().send(new SetDefaultPolicyVersionCommand({ PolicyArn: policyArn, VersionId: body.versionId }));
  return c.json({ set: true });
});

router.post("/policies/:arn/tags", async (c: Context) => {
  const policyArn = c.req.param("arn");
  const body = await c.req.json<any>();
  const tags = (body.tags || []).filter((t: any) => t.Key && t.Value);
  if (tags.length === 0) return c.json({ error: "tags must be a non-empty array of {Key, Value}" }, 400);
  await iam().send(new TagPolicyCommand({ PolicyArn: policyArn, Tags: tags }));
  return c.json({ tagged: true });
});

router.delete("/policies/:arn/tags", async (c: Context) => {
  const policyArn = c.req.param("arn");
  const body = await c.req.json<any>();
  if (!body.tagKeys || !Array.isArray(body.tagKeys) || body.tagKeys.length === 0)
    return c.json({ error: "tagKeys must be a non-empty array" }, 400);
  await iam().send(new UntagPolicyCommand({ PolicyArn: policyArn, TagKeys: body.tagKeys }));
  return c.json({ untagged: true });
});

router.post("/roles/:name/tags", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<any>();
  const tags = (body.tags || []).filter((t: any) => t.Key && t.Value);
  if (tags.length === 0) return c.json({ error: "tags must be a non-empty array of {Key, Value}" }, 400);
  await iam().send(new TagRoleCommand({ RoleName: name, Tags: tags }));
  return c.json({ tagged: true });
});

router.delete("/roles/:name/tags", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<any>();
  if (!body.tagKeys || !Array.isArray(body.tagKeys) || body.tagKeys.length === 0)
    return c.json({ error: "tagKeys must be a non-empty array" }, 400);
  await iam().send(new UntagRoleCommand({ RoleName: name, TagKeys: body.tagKeys }));
  return c.json({ untagged: true });
});

router.post("/policies", async (c: Context) => {
  const body = await c.req.json<any>();
  const policyName = sanitizeName(body.name || "", 128);
  if (!policyName) return c.json({ error: "name is required" }, 400);
  const policyDoc = body.document || JSON.stringify({
    Version: "2012-10-17",
    Statement: [{ Effect: "Allow", Action: "*", Resource: "*" }],
  });
  if (body.document) {
    const validation = validateJson(body.document, "object");
    if (!validation.valid) {
      return c.json({ error: `Invalid policy document: ${validation.error}` }, 400);
    }
  }
  const result = await iam().send(
    new CreatePolicyCommand({
      PolicyName: policyName,
      PolicyDocument: policyDoc,
      Description: sanitizeName(body.description || "", 1000),
      Path: sanitizeName(body.path || "", 512),
    })
  );
  return c.json({ name: result.Policy?.PolicyName, arn: result.Policy?.Arn, created: true });
});

router.delete("/policies", async (c: Context) => {
  const policyArn = c.req.query("arn");
  if (!policyArn) return c.json({ error: "arn query parameter required" }, 400);
  await iam().send(new DeletePolicyCommand({ PolicyArn: policyArn }));
  return c.json({ arn: policyArn, deleted: true });
});

// ─── ACCESS KEYS ─────────────────────────────────────────

router.post("/users/:name/access-keys", async (c: Context) => {
  const name = c.req.param("name");
  const result = await iam().send(new CreateAccessKeyCommand({ UserName: name }));
  const key = result.AccessKey;
  return c.json({
    accessKeyId: key?.AccessKeyId,
    secretAccessKey: key?.SecretAccessKey,
    status: key?.Status,
    userName: key?.UserName,
    created: true,
  });
});

router.delete("/users/:name/access-keys/:id", async (c: Context) => {
  const name = c.req.param("name");
  const id = c.req.param("id");
  await iam().send(new DeleteAccessKeyCommand({ UserName: name, AccessKeyId: id }));
  return c.json({ id, deleted: true });
});

router.put("/users/:name/access-keys/:id", async (c: Context) => {
  const name = c.req.param("name");
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  await iam().send(
    new UpdateAccessKeyCommand({ UserName: name, AccessKeyId: id, Status: body.status })
  );
  return c.json({ id, status: body.status });
});

// ─── INSTANCE PROFILES ───────────────────────────────────

router.get("/instance-profiles", async (c: Context) => {
  const result = await iam().send(new ListInstanceProfilesCommand({}));
  const profiles = (result.InstanceProfiles || []).map(mapInstanceProfile);
  return c.json({ instanceProfiles: profiles, total: profiles.length });
});

router.post("/instance-profiles", async (c: Context) => {
  const body = await c.req.json<any>();
  await iam().send(
    new CreateInstanceProfileCommand({ InstanceProfileName: body.name, Path: body.path })
  );
  return c.json({ name: body.name, created: true });
});

router.delete("/instance-profiles/:name", async (c: Context) => {
  const name = c.req.param("name");
  await iam().send(new DeleteInstanceProfileCommand({ InstanceProfileName: name }));
  return c.json({ name, deleted: true });
});

router.post("/instance-profiles/:name/roles/:roleName", async (c: Context) => {
  const name = c.req.param("name");
  const roleName = c.req.param("roleName");
  await iam().send(
    new AddRoleToInstanceProfileCommand({ InstanceProfileName: name, RoleName: roleName })
  );
  return c.json({ added: true });
});

router.delete("/instance-profiles/:name/roles/:roleName", async (c: Context) => {
  const name = c.req.param("name");
  const roleName = c.req.param("roleName");
  await iam().send(
    new RemoveRoleFromInstanceProfileCommand({ InstanceProfileName: name, RoleName: roleName })
  );
  return c.json({ removed: true });
});

// ─── INLINE POLICIES ─────────────────────────────────────

router.get("/users/:name/inline-policies/:policyName", async (c: Context) => {
  const name = c.req.param("name");
  const policyName = c.req.param("policyName");
  const result = await iam().send(
    new GetUserPolicyCommand({ UserName: name, PolicyName: policyName })
  );
  const doc = result.PolicyDocument ? decodeURIComponent(result.PolicyDocument as string) : null;
  return c.json({ policyName, document: doc });
});

router.put("/users/:name/inline-policies", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<any>();
  const inlinePolicyName = sanitizeName(body.policyName || "", 128);
  if (!inlinePolicyName) return c.json({ error: "policyName is required" }, 400);
  if (body.document) {
    const validation = validateJson(body.document, "object");
    if (!validation.valid) {
      return c.json({ error: `Invalid policy document: ${validation.error}` }, 400);
    }
  }
  await iam().send(
    new PutUserPolicyCommand({ UserName: name, PolicyName: inlinePolicyName, PolicyDocument: body.document })
  );
  return c.json({ policyName: inlinePolicyName, put: true });
});

router.delete("/users/:name/inline-policies/:policyName", async (c: Context) => {
  const name = c.req.param("name");
  const policyName = c.req.param("policyName");
  await iam().send(new DeleteUserPolicyCommand({ UserName: name, PolicyName: policyName }));
  return c.json({ policyName, deleted: true });
});

// ─── GROUP POLICIES ──────────────────────────────────────

router.get("/groups/:name/inline-policies", async (c: Context) => {
  const name = c.req.param("name");
  const result = await iam().send(new ListGroupPoliciesCommand({ GroupName: name }));
  return c.json({ policyNames: result.PolicyNames || [] });
});

router.get("/groups/:name/inline-policies/:policyName", async (c: Context) => {
  const name = c.req.param("name");
  const policyName = c.req.param("policyName");
  const result = await iam().send(
    new GetGroupPolicyCommand({ GroupName: name, PolicyName: policyName })
  );
  const doc = result.PolicyDocument ? decodeURIComponent(result.PolicyDocument as string) : null;
  return c.json({ policyName, document: doc });
});

router.put("/groups/:name/inline-policies", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<any>();
  const inlinePolicyName = sanitizeName(body.policyName || "", 128);
  if (!inlinePolicyName) return c.json({ error: "policyName is required" }, 400);
  if (body.document) {
    const validation = validateJson(body.document, "object");
    if (!validation.valid) {
      return c.json({ error: `Invalid policy document: ${validation.error}` }, 400);
    }
  }
  await iam().send(
    new PutGroupPolicyCommand({ GroupName: name, PolicyName: inlinePolicyName, PolicyDocument: body.document })
  );
  return c.json({ policyName: inlinePolicyName, put: true });
});

router.delete("/groups/:name/inline-policies/:policyName", async (c: Context) => {
  const name = c.req.param("name");
  const policyName = c.req.param("policyName");
  await iam().send(new DeleteGroupPolicyCommand({ GroupName: name, PolicyName: policyName }));
  return c.json({ policyName, deleted: true });
});

// ─── PERMISSION BOUNDARIES ───────────────────────────────

router.put("/users/:name/permissions-boundary", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ permissionsBoundary: string }>();
  if (!body.permissionsBoundary) return c.json({ error: "permissionsBoundary ARN is required" }, 400);
  await iam().send(
    new PutUserPermissionsBoundaryCommand({ UserName: name, PermissionsBoundary: body.permissionsBoundary })
  );
  return c.json({ set: true });
});

router.delete("/users/:name/permissions-boundary", async (c: Context) => {
  const name = c.req.param("name");
  await iam().send(new DeleteUserPermissionsBoundaryCommand({ UserName: name }));
  return c.json({ deleted: true });
});

router.put("/roles/:name/permissions-boundary", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ permissionsBoundary: string }>();
  if (!body.permissionsBoundary) return c.json({ error: "permissionsBoundary ARN is required" }, 400);
  await iam().send(
    new PutRolePermissionsBoundaryCommand({ RoleName: name, PermissionsBoundary: body.permissionsBoundary })
  );
  return c.json({ set: true });
});

router.delete("/roles/:name/permissions-boundary", async (c: Context) => {
  const name = c.req.param("name");
  await iam().send(new DeleteRolePermissionsBoundaryCommand({ RoleName: name }));
  return c.json({ deleted: true });
});


// ── Role inline policies + trust policy + simulator ─────

router.put("/roles/:name/inline-policies", async (c: Context) => {
  const name = c.req.param("name")!;
  const body = await c.req.json<any>();
  if (!body.policyName) return c.json({ error: "policyName is required" }, 400);
  if (!body.document) return c.json({ error: "document is required" }, 400);
  await iam().send(
    new PutRolePolicyCommand({
      RoleName: name,
      PolicyName: body.policyName,
      PolicyDocument: body.document,
    })
  );
  return c.json({ updated: true });
});

router.delete("/roles/:name/inline-policies/:policyName", async (c: Context) => {
  const name = c.req.param("name")!;
  const policyName = c.req.param("policyName")!;
  await iam().send(new DeleteRolePolicyCommand({ RoleName: name, PolicyName: policyName }));
  return c.json({ deleted: true });
});

router.put("/roles/:name/trust-policy", async (c: Context) => {
  const name = c.req.param("name")!;
  const body = await c.req.json<{ document?: string }>();
  if (!body.document) return c.json({ error: "document is required" }, 400);
  await iam().send(
    new UpdateAssumeRolePolicyCommand({
      RoleName: name,
      PolicyDocument: body.document,
    })
  );
  return c.json({ updated: true });
});

router.post("/simulate", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.policySourceArn) return c.json({ error: "policySourceArn is required" }, 400);
  if (!body.actionNames?.length) return c.json({ error: "actionNames is required" }, 400);
  const result = await iam().send(
    new SimulatePrincipalPolicyCommand({
      PolicySourceArn: body.policySourceArn,
      ActionNames: body.actionNames,
      ResourceArns: body.resourceArns,
    })
  );
  const evaluations = (result.EvaluationResults || []).map((e: any) => ({
    evalActionName: e.EvalActionName,
    evalDecision: e.EvalDecision,
    matchedStatements: (e.MatchedStatements || []).map((ms: any) => ({
      sourcePolicyId: ms.SourcePolicyId,
      statementId: ms.StatementId,
    })),
  }));
  return c.json({ evaluations, total: evaluations.length });
});


// ────────────────────────────────────────────────────────────────
//  P1 gap audit — users/roles extras
// ────────────────────────────────────────────────────────────────

router.put("/users/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const body = await c.req.json<{ newName?: string; newPath?: string }>();
  if (!body.newName && !body.newPath) {
    return c.json({ error: "newName or newPath is required" }, 400);
  }
  await iam().send(new UpdateUserCommand({
    UserName: name,
    NewUserName: body.newName,
    NewPath: body.newPath,
  }));
  return c.json({ renamed: true });
});

router.put("/roles/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const body = await c.req.json<{ description?: string; maxSessionDuration?: number }>();
  if (body.description != null) {
    await iam().send(new UpdateRoleCommand({
      RoleName: name,
      Description: body.description,
      MaxSessionDuration: body.maxSessionDuration,
    }));
  }
  return c.json({ updated: true });
});

router.post("/roles/service-linked", async (c: Context) => {
  const body = await c.req.json<{ roleName: string; awsServiceName?: string; description?: string }>();
  if (!body.roleName) return c.json({ error: "roleName is required" }, 400);
  const result = await iam().send(new CreateServiceLinkedRoleCommand({
    AWSServiceName: body.awsServiceName ?? body.roleName,
    Description: body.description,
  }));
  return c.json({ role: mapRole(result.Role ?? {}) }, 201);
});

router.delete("/roles/service-linked/:roleName", async (c: Context) => {
  const roleName = c.req.param("roleName")!;
  const result = await iam().send(new DeleteServiceLinkedRoleCommand({ RoleName: roleName }));
  return c.json({
    deleted: true,
    deletionTaskId: result.DeletionTaskId ?? null,
  });
});

router.get("/roles/service-linked/:roleName/deletion-status", async (c: Context) => {
  const roleName = c.req.param("roleName")!;
  const result = await iam().send(new GetServiceLinkedRoleDeletionStatusCommand({ DeletionTaskId: roleName }));
  return c.json({
    status: result.Status ?? null,
    reason: result.Reason?.Reason ?? null,
    roleName,
  });
});

// ─── Policy entities + versions ─────────────────────────────────

router.get("/policies/entities", async (c: Context) => {
  const policyArn = c.req.query("policyArn") || "";
  if (!policyArn) return c.json({ error: "policyArn is required" }, 400);
  const result = await iam().send(new ListEntitiesForPolicyCommand({
    PolicyArn: policyArn,
    EntityFilter: (c.req.query("entityFilter") as any) || undefined,
    PathPrefix: c.req.query("pathPrefix") || undefined,
  }));
  return c.json({
    policyUsers: (result.PolicyUsers || []).map((u: any) => u.UserName),
    policyRoles: (result.PolicyRoles || []).map((r: any) => r.RoleName),
    policyGroups: (result.PolicyGroups || []).map((g: any) => g.GroupName),
    total: (result.PolicyUsers || []).length + (result.PolicyRoles || []).length + (result.PolicyGroups || []).length,
  });
});

router.post("/policies/:arn/versions", async (c: Context) => {
  const policyArn = decodeURIComponent(c.req.param("arn")!);
  const body = await c.req.json<{ document: string; setAsDefault?: boolean }>();
  if (!body.document) return c.json({ error: "document is required" }, 400);
  const result = await iam().send(new CreatePolicyVersionCommand({
    PolicyArn: policyArn,
    PolicyDocument: body.document,
    SetAsDefault: body.setAsDefault,
  }));
  return c.json({
    versionId: result.PolicyVersion?.VersionId ?? null,
    isDefaultVersion: result.PolicyVersion?.IsDefaultVersion ?? false,
    created: true,
  }, 201);
});

router.delete("/policies/:arn/versions/:versionId", async (c: Context) => {
  const policyArn = decodeURIComponent(c.req.param("arn")!);
  const versionId = c.req.param("versionId")!;
  await iam().send(new DeletePolicyVersionCommand({ PolicyArn: policyArn, VersionId: versionId }));
  return c.json({ deleted: true });
});

// ─── Managed policy attachments ─────────────────────────────────

router.post("/users/:name/policies", async (c: Context) => {
  const name = c.req.param("name")!;
  const body = await c.req.json<{ policyArn: string }>();
  if (!body.policyArn) return c.json({ error: "policyArn is required" }, 400);
  await iam().send(new AttachUserPolicyCommand({ UserName: name, PolicyArn: body.policyArn }));
  return c.json({ attached: true });
});

router.delete("/users/:name/policies/:policyArn", async (c: Context) => {
  const name = c.req.param("name")!;
  const policyArn = decodeURIComponent(c.req.param("policyArn")!);
  await iam().send(new DetachUserPolicyCommand({ UserName: name, PolicyArn: policyArn }));
  return c.json({ detached: true });
});

router.post("/roles/:name/policies", async (c: Context) => {
  const name = c.req.param("name")!;
  const body = await c.req.json<{ policyArn: string }>();
  if (!body.policyArn) return c.json({ error: "policyArn is required" }, 400);
  await iam().send(new AttachRolePolicyCommand({ RoleName: name, PolicyArn: body.policyArn }));
  return c.json({ attached: true });
});

router.delete("/roles/:name/policies/:policyArn", async (c: Context) => {
  const name = c.req.param("name")!;
  const policyArn = decodeURIComponent(c.req.param("policyArn")!);
  await iam().send(new DetachRolePolicyCommand({ RoleName: name, PolicyArn: policyArn }));
  return c.json({ detached: true });
});

router.post("/groups/:name/policies", async (c: Context) => {
  const name = c.req.param("name")!;
  const body = await c.req.json<{ policyArn: string }>();
  if (!body.policyArn) return c.json({ error: "policyArn is required" }, 400);
  await iam().send(new AttachGroupPolicyCommand({ GroupName: name, PolicyArn: body.policyArn }));
  return c.json({ attached: true });
});

router.delete("/groups/:name/policies/:policyArn", async (c: Context) => {
  const name = c.req.param("name")!;
  const policyArn = decodeURIComponent(c.req.param("policyArn")!);
  await iam().send(new DetachGroupPolicyCommand({ GroupName: name, PolicyArn: policyArn }));
  return c.json({ detached: true });
});

router.get("/groups/:name/policies", async (c: Context) => {
  const name = c.req.param("name")!;
  const result = await iam().send(new ListAttachedGroupPoliciesCommand({ GroupName: name }));
  return c.json({
    attachedPolicies: (result.AttachedPolicies || []).map((p: any) => ({
      name: p.PolicyName,
      arn: p.PolicyArn,
    })),
    total: (result.AttachedPolicies || []).length,
  });
});

// ─── Role inline policies ───────────────────────────────────────

router.get("/roles/:name/inline-policies", async (c: Context) => {
  const name = c.req.param("name")!;
  const result = await iam().send(new ListRolePoliciesCommand({ RoleName: name }));
  return c.json({ policyNames: result.PolicyNames || [], total: (result.PolicyNames || []).length });
});

router.get("/roles/:name/inline-policies/:policyName", async (c: Context) => {
  const name = c.req.param("name")!;
  const policyName = decodeURIComponent(c.req.param("policyName")!);
  const result = await iam().send(new GetRolePolicyCommand({ RoleName: name, PolicyName: policyName }));
  return c.json({
    policyName: result.PolicyName ?? policyName,
    document: result.PolicyDocument ? decodeURIComponent(result.PolicyDocument) : null,
  });
});

// ─── Instance profiles + access keys ────────────────────────────

router.get("/instance-profiles/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const result = await iam().send(new GetInstanceProfileCommand({ InstanceProfileName: name }));
  return c.json({ instanceProfile: result.InstanceProfile ?? null });
});

router.get("/roles/:name/instance-profiles", async (c: Context) => {
  const name = c.req.param("name")!;
  const result = await iam().send(new ListInstanceProfilesForRoleCommand({ RoleName: name }));
  return c.json({
    instanceProfiles: (result.InstanceProfiles || []).map((p: any) => ({
      name: p.InstanceProfileName,
      arn: p.InstanceProfileArn,
    })),
    total: (result.InstanceProfiles || []).length,
  });
});

router.get("/users/:name/access-keys/:keyId/last-used", async (c: Context) => {
  const name = c.req.param("name")!;
  const keyId = c.req.param("keyId")!;
  const result = await iam().send(new GetAccessKeyLastUsedCommand({ AccessKeyId: keyId }));
  return c.json({
    userName: result.UserName ?? null,
    lastUsedDate: result.AccessKeyLastUsed?.LastUsedDate ?? null,
    service: result.AccessKeyLastUsed?.ServiceName ?? null,
    region: result.AccessKeyLastUsed?.Region ?? null,
  });
});

// ─── Account aliases + summary ──────────────────────────────────

router.post("/account/aliases", async (c: Context) => {
  const body = await c.req.json<{ alias: string }>();
  if (!body.alias) return c.json({ error: "alias is required" }, 400);
  await iam().send(new CreateAccountAliasCommand({ AccountAlias: body.alias }));
  return c.json({ created: true }, 201);
});

router.delete("/account/aliases/:alias", async (c: Context) => {
  const alias = c.req.param("alias")!;
  await iam().send(new DeleteAccountAliasCommand({ AccountAlias: alias }));
  return c.json({ deleted: true });
});

router.get("/account/aliases", async (c: Context) => {
  const result = await iam().send(new ListAccountAliasesCommand({}));
  return c.json({ aliases: result.AccountAliases || [], total: (result.AccountAliases || []).length });
});

router.get("/account/summary", async (c: Context) => {
  const result = await iam().send(new GetAccountSummaryCommand({}));
  return c.json({ summary: result.SummaryMap ?? {} });
});

// ─── OIDC providers ─────────────────────────────────────────────

router.post("/oidc-providers", async (c: Context) => {
  const body = await c.req.json<{ url: string; clientIds?: string[]; thumbprints?: string[] }>();
  if (!body.url) return c.json({ error: "url is required" }, 400);
  const result = await iam().send(new CreateOpenIDConnectProviderCommand({
    Url: body.url,
    ClientIDList: body.clientIds,
    ThumbprintList: body.thumbprints,
  }));
  return c.json({ openIdConnectProviderArn: result.OpenIDConnectProviderArn }, 201);
});

router.get("/oidc-providers", async (c: Context) => {
  const result = await iam().send(new ListOpenIDConnectProvidersCommand({}));
  return c.json({
    providers: (result.OpenIDConnectProviderList || []).map((p: any) => p.Arn),
    total: (result.OpenIDConnectProviderList || []).length,
  });
});

router.get("/oidc-providers/:arn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const result = await iam().send(new GetOpenIDConnectProviderCommand({ OpenIDConnectProviderArn: arn }));
  return c.json({
    url: result.Url ?? null,
    clientIds: result.ClientIDList ?? [],
    thumbprints: result.ThumbprintList ?? [],
    createDate: result.CreateDate ?? null,
  });
});

router.delete("/oidc-providers/:arn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  await iam().send(new DeleteOpenIDConnectProviderCommand({ OpenIDConnectProviderArn: arn }));
  return c.json({ deleted: true });
});

router.post("/oidc-providers/:arn/client-ids", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const body = await c.req.json<{ clientId: string }>();
  if (!body.clientId) return c.json({ error: "clientId is required" }, 400);
  await iam().send(new AddClientIDToOpenIDConnectProviderCommand({
    OpenIDConnectProviderArn: arn,
    ClientID: body.clientId,
  }));
  return c.json({ added: true });
});

router.delete("/oidc-providers/:arn/client-ids/:clientId", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const clientId = decodeURIComponent(c.req.param("clientId")!);
  await iam().send(new RemoveClientIDFromOpenIDConnectProviderCommand({
    OpenIDConnectProviderArn: arn,
    ClientID: clientId,
  }));
  return c.json({ removed: true });
});

router.put("/oidc-providers/:arn/thumbprint", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const body = await c.req.json<{ thumbprints: string[] }>();
  if (!body.thumbprints || !body.thumbprints.length) {
    return c.json({ error: "thumbprints is required" }, 400);
  }
  await iam().send(new UpdateOpenIDConnectProviderThumbprintCommand({
    OpenIDConnectProviderArn: arn,
    ThumbprintList: body.thumbprints,
  }));
  return c.json({ updated: true });
});

// ─── Login profile (Floci implements Get only) ──────────────────

router.get("/users/:name/login-profile", async (c: Context) => {
  const name = c.req.param("name")!;
  try {
    const result = await iam().send(new GetLoginProfileCommand({ UserName: name }));
    return c.json({ userName: result.LoginProfile?.UserName ?? name, createdAt: result.LoginProfile?.CreateDate ?? null });
  } catch (err: any) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === "NoSuchEntityException") {
      return c.json({ loginProfile: null });
    }
    throw err;
  }
});

export default router;
// ── MFA Devices ──────────────────────────────────────────

router.get("/users/:name/mfa-devices", async (c: Context) => {
  const userName = c.req.param("name")!;
  const result = await iam().send(new ListMFADevicesCommand({ UserName: userName }));
  return c.json({ mfaDevices: result.MFADevices || [] });
});

// ── SAML Providers ───────────────────────────────────────

router.get("/saml-providers", async (c: Context) => {
  const result = await iam().send(new ListSAMLProvidersCommand({}));
  return c.json({ samlProviders: result.SAMLProviderList || [] });
});

// ── Server Certificates ──────────────────────────────────

router.get("/server-certificates", async (c: Context) => {
  const result = await iam().send(new ListServerCertificatesCommand({}));
  return c.json({ serverCertificates: result.ServerCertificateMetadataList || [] });
});
