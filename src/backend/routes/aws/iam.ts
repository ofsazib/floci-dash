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
} from "@aws-sdk/client-iam";
import { getAwsConfig } from "../../clients/aws";

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
  const [groupsRes, attachedRes, accessKeysRes, inlineRes] = await Promise.all([
    iam().send(new ListGroupsForUserCommand({ UserName: name })),
    iam().send(new ListAttachedUserPoliciesCommand({ UserName: name })),
    iam().send(new ListAccessKeysCommand({ UserName: name })),
    iam().send(new ListUserPoliciesCommand({ UserName: name })),
  ]);

  const user = mapUser(result.User);
  return c.json({
    user,
    groups: (groupsRes.Groups || []).map(mapGroup),
    attachedPolicies: (attachedRes.AttachedPolicies || []).map((p: any) => ({
      name: p.PolicyName,
      arn: p.PolicyArn,
    })),
    accessKeys: (accessKeysRes.AccessKeyMetadata || []).map(mapAccessKey),
    inlinePolicies: inlineRes.PolicyNames || [],
  });
});

router.post("/users", async (c: Context) => {
  const body = await c.req.json<any>();
  await iam().send(new CreateUserCommand({ UserName: body.name, Path: body.path }));
  return c.json({ name: body.name, created: true });
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
  await iam().send(
    new CreateRoleCommand({
      RoleName: body.name,
      AssumeRolePolicyDocument: body.assumeRolePolicyDocument || JSON.stringify({
        Version: "2012-10-17",
        Statement: [{ Effect: "Allow", Principal: { Service: "ec2.amazonaws.com" }, Action: "sts:AssumeRole" }],
      }),
      Description: body.description,
      MaxSessionDuration: body.maxSessionDuration,
      Path: body.path,
    })
  );
  return c.json({ name: body.name, created: true });
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

router.post("/groups", async (c: Context) => {
  const body = await c.req.json<any>();
  await iam().send(new CreateGroupCommand({ GroupName: body.name, Path: body.path }));
  return c.json({ name: body.name, created: true });
});

router.delete("/groups/:name", async (c: Context) => {
  const name = c.req.param("name");
  await iam().send(new DeleteGroupCommand({ GroupName: name }));
  return c.json({ name, deleted: true });
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

  const [policyRes, versionsRes] = await Promise.all([
    iam().send(new GetPolicyCommand({ PolicyArn: policyArn })),
    iam().send(new ListPolicyVersionsCommand({ PolicyArn: policyArn })),
  ]);

  return c.json({
    policy: policyRes.Policy ? mapPolicy(policyRes.Policy) : null,
    versions: (versionsRes.Versions || []).map((v: any) => ({
      versionId: v.VersionId,
      isDefaultVersion: v.IsDefaultVersion,
      createDate: v.CreateDate,
    })),
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

router.post("/policies", async (c: Context) => {
  const body = await c.req.json<any>();
  const result = await iam().send(
    new CreatePolicyCommand({
      PolicyName: body.name,
      PolicyDocument: body.document || JSON.stringify({
        Version: "2012-10-17",
        Statement: [{ Effect: "Allow", Action: "*", Resource: "*" }],
      }),
      Description: body.description,
      Path: body.path,
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
  await iam().send(
    new PutUserPolicyCommand({ UserName: name, PolicyName: body.policyName, PolicyDocument: body.document })
  );
  return c.json({ policyName: body.policyName, put: true });
});

router.delete("/users/:name/inline-policies/:policyName", async (c: Context) => {
  const name = c.req.param("name");
  const policyName = c.req.param("policyName");
  await iam().send(new DeleteUserPolicyCommand({ UserName: name, PolicyName: policyName }));
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

export default router;
