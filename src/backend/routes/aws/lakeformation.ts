import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { LakeFormationClient, type Permission } from "@aws-sdk/client-lakeformation";
import {
  GetDataLakeSettingsCommand,
  PutDataLakeSettingsCommand,
  RegisterResourceCommand,
  DeregisterResourceCommand,
  ListResourcesCommand,
  DescribeResourceCommand,
  UpdateResourceCommand,
  GrantPermissionsCommand,
  RevokePermissionsCommand,
  ListPermissionsCommand,
  CreateLFTagCommand,
  GetLFTagCommand,
  UpdateLFTagCommand,
  DeleteLFTagCommand,
  ListLFTagsCommand,
  AddLFTagsToResourceCommand,
  RemoveLFTagsFromResourceCommand,
} from "@aws-sdk/client-lakeformation";

const router = new Hono();
const getClient = () => create(LakeFormationClient);

const badRequest = (c: Context, msg: string) => c.json({ error: msg }, 400);

// ---------- Data lake settings ----------

router.get("/settings", async (c: Context) => {
  const result: any = await getClient().send(new GetDataLakeSettingsCommand({}));
  const s = result?.DataLakeSettings || {};
  return c.json({
    dataLakeAdmins: (s.DataLakeAdmins || []).map((p: any) => p.DataLakePrincipalIdentifier).filter(Boolean),
    createDatabaseDefaultPermissions: s.CreateDatabaseDefaultPermissions || [],
    createTableDefaultPermissions: s.CreateTableDefaultPermissions || [],
    allowExternalDataFiltering: !!s.AllowExternalDataFiltering,
    parameters: s.Parameters || {},
    trustedResourceOwners: s.TrustedResourceOwners || [],
  });
});

router.put("/settings", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const admins: string[] = Array.isArray(body.dataLakeAdmins) ? body.dataLakeAdmins : [];
  await getClient().send(
    new PutDataLakeSettingsCommand({
      DataLakeSettings: {
        DataLakeAdmins: admins.map((id) => ({ DataLakePrincipalIdentifier: id })),
        AllowExternalDataFiltering: !!body.allowExternalDataFiltering,
        TrustedResourceOwners: body.trustedResourceOwners || [],
      },
    }),
  );
  return c.json({ ok: true });
});

// ---------- Registered resources ----------

router.post("/resources", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const ResourceArn = body.resourceArn;
  if (!ResourceArn) return badRequest(c, "resourceArn is required");
  await getClient().send(
    new RegisterResourceCommand({
      ResourceArn,
      RoleArn: body.roleArn,
      UseServiceLinkedRole: body.useServiceLinkedRole ?? true,
    }),
  );
  return c.json({ ok: true }, 201);
});

router.get("/resources", async (c: Context) => {
  const result: any = await getClient().send(new ListResourcesCommand({}));
  return c.json({
    resources: (result?.ResourceInfoList || []).map((r: any) => ({
      resourceArn: r.ResourceArn,
      roleArn: r.RoleArn,
      lastModified: r.LastModified,
      withFederation: r.WithFederation,
    })),
    total: result?.ResourceInfoList?.length || 0,
  });
});

router.get("/resources/detail", async (c: Context) => {
  const ResourceArn = c.req.query("resourceArn");
  if (!ResourceArn) return badRequest(c, "resourceArn query param is required");
  const result: any = await getClient().send(new DescribeResourceCommand({ ResourceArn }));
  const r = result?.ResourceInfo || {};
  return c.json({
    resourceArn: r.ResourceArn,
    roleArn: r.RoleArn,
    lastModified: r.LastModified,
    hybridAccessEnabled: r.HybridAccessEnabled,
    withFederation: r.WithFederation,
    withPrivilegedAccess: r.WithPrivilegedAccess,
  });
});

router.delete("/resources", async (c: Context) => {
  const ResourceArn = c.req.query("resourceArn");
  if (!ResourceArn) return badRequest(c, "resourceArn query param is required");
  await getClient().send(new DeregisterResourceCommand({ ResourceArn }));
  return c.json({ ok: true });
});

router.put("/resources", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const ResourceArn = body.resourceArn;
  if (!ResourceArn) return badRequest(c, "resourceArn is required");
  await getClient().send(
    new UpdateResourceCommand({ ResourceArn, RoleArn: body.roleArn }),
  );
  return c.json({ ok: true });
});

// ---------- Permissions ----------

router.post("/permissions/grant", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const Principal = body.principal;
  if (!Principal) return badRequest(c, "principal is required");
  const Permissions = (Array.isArray(body.permissions) ? body.permissions : []) as Permission[];
  if (Permissions.length === 0) return badRequest(c, "permissions must be a non-empty list");
  await getClient().send(
    new GrantPermissionsCommand({
      Principal: { DataLakePrincipalIdentifier: Principal },
      Resource: body.resource,
      Permissions,
      PermissionsWithGrantOption: body.permissionsWithGrantOption || [],
    }),
  );
  return c.json({ ok: true }, 201);
});

router.post("/permissions/revoke", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const Principal = body.principal;
  if (!Principal) return badRequest(c, "principal is required");
  const Permissions = (Array.isArray(body.permissions) ? body.permissions : []) as Permission[];
  if (Permissions.length === 0) return badRequest(c, "permissions must be a non-empty list");
  await getClient().send(
    new RevokePermissionsCommand({
      Principal: { DataLakePrincipalIdentifier: Principal },
      Resource: body.resource,
      Permissions,
      PermissionsWithGrantOption: body.permissionsWithGrantOption || [],
    }),
  );
  return c.json({ ok: true }, 201);
});

router.get("/permissions", async (c: Context) => {
  const result: any = await getClient().send(new ListPermissionsCommand({}));
  return c.json({
    principalResourcePermissions: (result?.PrincipalResourcePermissions || []).map((p: any) => ({
      principal: p.Principal?.DataLakePrincipalIdentifier,
      resource: p.Resource,
      permissions: p.Permissions || [],
      permissionsWithGrantOption: p.PermissionsWithGrantOption || [],
    })),
    total: result?.PrincipalResourcePermissions?.length || 0,
  });
});

// ---------- LF-tags ----------

router.post("/lf-tags", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const TagKey = body.tagKey;
  if (!TagKey) return badRequest(c, "tagKey is required");
  const TagValues: string[] = Array.isArray(body.tagValues) ? body.tagValues : [];
  if (TagValues.length === 0) return badRequest(c, "tagValues must be a non-empty list");
  await getClient().send(new CreateLFTagCommand({ CatalogId: body.catalogId, TagKey, TagValues }));
  return c.json({ ok: true }, 201);
});

router.get("/lf-tags/:key", async (c: Context) => {
  const result: any = await getClient().send(
    new GetLFTagCommand({ CatalogId: c.req.query("catalogId"), TagKey: c.req.param("key") }),
  );
  return c.json({
    catalogId: result?.CatalogId,
    tagKey: result?.TagKey,
    tagValues: result?.TagValues || [],
  });
});

router.put("/lf-tags/:key", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const TagKey = c.req.param("key");
  if (!body.tagValuesToDelete?.length && !body.tagValuesToAdd?.length) {
    return badRequest(c, "tagValuesToAdd or tagValuesToDelete is required");
  }
  await getClient().send(
    new UpdateLFTagCommand({
      CatalogId: body.catalogId,
      TagKey,
      TagValuesToAdd: body.tagValuesToAdd,
      TagValuesToDelete: body.tagValuesToDelete,
    }),
  );
  return c.json({ ok: true });
});

router.delete("/lf-tags/:key", async (c: Context) => {
  await getClient().send(
    new DeleteLFTagCommand({ CatalogId: c.req.query("catalogId"), TagKey: c.req.param("key") }),
  );
  return c.json({ ok: true });
});

router.get("/lf-tags", async (c: Context) => {
  const result: any = await getClient().send(
    new ListLFTagsCommand({ CatalogId: c.req.query("catalogId"), MaxResults: c.req.query("maxResults") ? Number(c.req.query("maxResults")) : undefined }),
  );
  return c.json({
    lfTags: (result?.LFTags || []).map((t: any) => ({
      catalogId: t.CatalogId,
      tagKey: t.TagKey,
      tagValues: t.TagValues || [],
    })),
    nextToken: result?.NextToken,
    total: result?.LFTags?.length || 0,
  });
});

// ---------- LF-tag assignment ----------

router.post("/lf-tags/assign", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const Resource = body.resource;
  if (!Resource) return badRequest(c, "resource is required");
  const LFTags: any[] = Array.isArray(body.lfTags) ? body.lfTags : [];
  if (LFTags.length === 0) return badRequest(c, "lfTags must be a non-empty list");
  const result: any = await getClient().send(
    new AddLFTagsToResourceCommand({ Resource, LFTags }),
  );
  return c.json({
    failures: (result?.Failures || []).map((f: any) => ({
      lfTag: f.LFTag,
      error: f.Error?.ErrorMessage,
    })),
  }, 201);
});

router.post("/lf-tags/unassign", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const Resource = body.resource;
  if (!Resource) return badRequest(c, "resource is required");
  const LFTags: any[] = Array.isArray(body.lfTags) ? body.lfTags : [];
  if (LFTags.length === 0) return badRequest(c, "lfTags must be a non-empty list");
  const result: any = await getClient().send(
    new RemoveLFTagsFromResourceCommand({ Resource, LFTags }),
  );
  return c.json({
    failures: (result?.Failures || []).map((f: any) => ({
      lfTag: f.LFTag,
      error: f.Error?.ErrorMessage,
    })),
  }, 201);
});

export default router;
