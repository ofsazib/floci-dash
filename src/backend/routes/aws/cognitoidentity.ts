import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { readJson } from "../../clients/read-json";
import { callerAccountId, identityPoolArn } from "../../clients/arns";
import {
  CognitoIdentityClient,
  ListIdentityPoolsCommand,
  CreateIdentityPoolCommand,
  DescribeIdentityPoolCommand,
  UpdateIdentityPoolCommand,
  DeleteIdentityPoolCommand,
  GetIdentityPoolRolesCommand,
  SetIdentityPoolRolesCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
  GetPrincipalTagAttributeMapCommand,
  SetPrincipalTagAttributeMapCommand,
} from "@aws-sdk/client-cognito-identity";

const router = new Hono();
const getClient = () => create(CognitoIdentityClient);

router.get("/pools", async (c: Context) => {
  const result: any = await getClient().send(
    new ListIdentityPoolsCommand({ MaxResults: 60 })
  );
  return c.json({
    pools: result.IdentityPools || [],
    total: result.IdentityPools?.length || 0,
  });
});

router.post("/pools", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.name)
    return c.json({ error: "name is required" }, 400);
  if (typeof body?.allowUnauthenticated !== "boolean")
    return c.json({ error: "allowUnauthenticated boolean is required" }, 400);
  const result: any = await getClient().send(
    new CreateIdentityPoolCommand({
      IdentityPoolName: body.name,
      AllowUnauthenticatedIdentities: body.allowUnauthenticated,
      AllowClassicFlow: body.allowClassic === true,
    })
  );
  return c.json({ pool: result }, 201);
});

router.get("/pools/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const result: any = await getClient().send(
    new DescribeIdentityPoolCommand({ IdentityPoolId: id })
  );
  return c.json({ pool: result || null });
});

router.put("/pools/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const body: any = await readJson(c);
  if (!body?.pool?.IdentityPoolName)
    return c.json({ error: "pool.IdentityPoolName is required" }, 400);
  const result: any = await getClient().send(
    new UpdateIdentityPoolCommand({
      ...body.pool,
      IdentityPoolId: id,
    })
  );
  return c.json({ pool: result });
});

router.delete("/pools/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  await getClient().send(new DeleteIdentityPoolCommand({ IdentityPoolId: id }));
  return c.json({ ok: true });
});

router.get("/pools/:id/roles", async (c: Context) => {
  const id = c.req.param("id")!;
  try {
    const result: any = await getClient().send(
      new GetIdentityPoolRolesCommand({ IdentityPoolId: id })
    );
    return c.json({
      roles: result.Roles || {},
      roleMappings: result.RoleMappings || {},
    });
  } catch (err: any) {
    // Floci (and AWS) 404 when roles were never set — render as "not set".
    if (err?.name === "ResourceNotFoundException" || err?.$metadata?.httpStatusCode === 404)
      return c.json({ roles: null, roleMappings: null });
    throw err;
  }
});

router.put("/pools/:id/roles", async (c: Context) => {
  const id = c.req.param("id")!;
  const body: any = await readJson(c);
  if (!body?.roles || typeof body.roles !== "object" || Object.keys(body.roles).length === 0)
    return c.json({ error: "roles object with at least one role is required" }, 400);
  await getClient().send(
    new SetIdentityPoolRolesCommand({
      IdentityPoolId: id,
      Roles: body.roles,
      RoleMappings: body.roleMappings,
    })
  );
  return c.json({ ok: true });
});

router.get("/pools/:id/tags", async (c: Context) => {
  const arn = await identityPoolArn(c.req.param("id")!);
  const result: any = await getClient().send(
    new ListTagsForResourceCommand({ ResourceArn: arn })
  );
  return c.json({ tags: result.Tags || {} });
});

router.post("/pools/:id/tags", async (c: Context) => {
  const arn = await identityPoolArn(c.req.param("id")!);
  const body: any = await readJson(c);
  if (!body?.tags || typeof body.tags !== "object" || Object.keys(body.tags).length === 0)
    return c.json({ error: "tags object with at least one tag is required" }, 400);
  await getClient().send(new TagResourceCommand({ ResourceArn: arn, Tags: body.tags }));
  return c.json({ ok: true });
});

router.post("/pools/:id/tags/untag", async (c: Context) => {
  const arn = await identityPoolArn(c.req.param("id")!);
  const body: any = await readJson(c);
  if (!Array.isArray(body?.tagKeys) || body.tagKeys.length === 0)
    return c.json({ error: "tagKeys array with at least one key is required" }, 400);
  await getClient().send(
    new UntagResourceCommand({ ResourceArn: arn, TagKeys: body.tagKeys })
  );
  return c.json({ ok: true });
});

router.get("/pools/:id/provider-tags", async (c: Context) => {
  const id = c.req.param("id")!;
  const provider = c.req.query("provider");
  if (!provider)
    return c.json({ error: "provider query parameter is required" }, 400);
  const result: any = await getClient().send(
    new GetPrincipalTagAttributeMapCommand({
      IdentityPoolId: id,
      IdentityProviderName: provider,
    })
  );
  return c.json({
    useDefaults: result.UseDefaults ?? false,
    principalTags: result.PrincipalTags || {},
  });
});

router.put("/pools/:id/provider-tags", async (c: Context) => {
  const id = c.req.param("id")!;
  const body: any = await readJson(c);
  if (!body?.identityProviderName)
    return c.json({ error: "identityProviderName is required" }, 400);
  const result: any = await getClient().send(
    new SetPrincipalTagAttributeMapCommand({
      IdentityPoolId: id,
      IdentityProviderName: body.identityProviderName,
      UseDefaults: body.useDefaults === true,
      PrincipalTags: body.principalTags || {},
    })
  );
  return c.json({
    useDefaults: result.UseDefaults ?? false,
    principalTags: result.PrincipalTags || {},
  });
});

export default router;
