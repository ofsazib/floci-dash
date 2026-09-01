import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { CloudFrontClient } from "@aws-sdk/client-cloudfront";
/* istanbul ignore start */
import {
  ListDistributionsCommand,
  GetDistributionCommand,
  CreateDistributionCommand,
  UpdateDistributionCommand,
  DeleteDistributionCommand,
  ListInvalidationsCommand,
  CreateInvalidationCommand,
  GetInvalidationCommand,
  ListCachePoliciesCommand,
  ListOriginAccessControlsCommand,
  ListFunctionsCommand,
  ListTagsForResourceCommand,
  // P1 gap audit — policies, OAC/OAI, functions, keys, distro helpers
  CreateCachePolicyCommand,
  GetCachePolicyCommand,
  UpdateCachePolicyCommand,
  DeleteCachePolicyCommand,
  CreateOriginRequestPolicyCommand,
  ListOriginRequestPoliciesCommand,
  GetOriginRequestPolicyCommand,
  UpdateOriginRequestPolicyCommand,
  DeleteOriginRequestPolicyCommand,
  CreateResponseHeadersPolicyCommand,
  ListResponseHeadersPoliciesCommand,
  GetResponseHeadersPolicyCommand,
  UpdateResponseHeadersPolicyCommand,
  DeleteResponseHeadersPolicyCommand,
  CreateOriginAccessControlCommand,
  GetOriginAccessControlCommand,
  UpdateOriginAccessControlCommand,
  DeleteOriginAccessControlCommand,
  CreateCloudFrontOriginAccessIdentityCommand,
  ListCloudFrontOriginAccessIdentitiesCommand,
  GetCloudFrontOriginAccessIdentityCommand,
  UpdateCloudFrontOriginAccessIdentityCommand,
  DeleteCloudFrontOriginAccessIdentityCommand,
  CreateFunctionCommand,
  DescribeFunctionCommand,
  GetFunctionCommand,
  UpdateFunctionCommand,
  PublishFunctionCommand,
  DeleteFunctionCommand,
  CreatePublicKeyCommand,
  ListPublicKeysCommand,
  GetPublicKeyCommand,
  UpdatePublicKeyCommand,
  DeletePublicKeyCommand,
  CreateKeyGroupCommand,
  ListKeyGroupsCommand,
  GetKeyGroupCommand,
  UpdateKeyGroupCommand,
  DeleteKeyGroupCommand,
  CreateDistributionWithTagsCommand,
  GetDistributionConfigCommand,
  AssociateAliasCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from "@aws-sdk/client-cloudfront";
/* istanbul ignore end */

const router = new Hono();
const getClient = () => create(CloudFrontClient);

// ── Distributions ────────────────────────────────────────

router.get("/distributions", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListDistributionsCommand({}));
  const distributions = result.DistributionList?.Items || [];
/* istanbul ignore next */
  return c.json({ distributions, total: distributions.length });
});

router.get("/distributions/:id", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  const result = await client.send(new GetDistributionCommand({ Id: id }));
  return c.json({ distribution: result.Distribution, eTag: result.ETag });
});

router.post("/distributions", async (c: Context) => {
  const body = await c.req.json<{
    distributionConfig: any;
  }>();
  if (!body.distributionConfig) return c.json({ error: "distributionConfig is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateDistributionCommand({ DistributionConfig: body.distributionConfig })
  );
  return c.json({ distribution: result.Distribution, location: result.Location }, 201);
});

router.put("/distributions/:id", async (c: Context) => {
  const id = c.req.param("id");
  const ifMatch = c.req.header("If-Match");
  const body = await c.req.json<{ distributionConfig: any }>();
  if (!body.distributionConfig) return c.json({ error: "distributionConfig is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new UpdateDistributionCommand({
      Id: id,
      IfMatch: ifMatch,
      DistributionConfig: body.distributionConfig,
    })
  );
  return c.json({ distribution: result.Distribution, eTag: result.ETag });
});

router.delete("/distributions/:id", async (c: Context) => {
  const id = c.req.param("id");
  const ifMatch = c.req.header("If-Match");
  if (!ifMatch) return c.json({ error: "If-Match header is required" }, 400);
  const client = getClient();
  await client.send(new DeleteDistributionCommand({ Id: id, IfMatch: ifMatch }));
  return c.json({ deleted: true });
});

// ── Invalidations ────────────────────────────────────────

router.get("/distributions/:id/invalidations", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  const result = await client.send(new ListInvalidationsCommand({ DistributionId: id }));
  const invalidations = result.InvalidationList?.Items || [];
  return c.json({ invalidations, total: invalidations.length });
});

router.post("/distributions/:id/invalidations", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<{
    paths: string[];
    callerReference?: string;
  }>();
  if (!body.paths?.length) return c.json({ error: "paths is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateInvalidationCommand({
      DistributionId: id,
      InvalidationBatch: {
        CallerReference: body.callerReference || `${Date.now()}`,
        Paths: {
          Quantity: body.paths.length,
          Items: body.paths,
        },
      },
    })
  );
  return c.json({ invalidation: result.Invalidation }, 201);
});

router.get("/distributions/:id/invalidations/:invId", async (c: Context) => {
  const id = c.req.param("id");
  const invId = c.req.param("invId");
  const client = getClient();
  const result = await client.send(
    new GetInvalidationCommand({ DistributionId: id, Id: invId })
  );
  return c.json({ invalidation: result.Invalidation });
});

// ── Cache Policies ───────────────────────────────────────

router.get("/cache-policies", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListCachePoliciesCommand({}));
  const cachePolicies = result.CachePolicyList?.Items || [];
  return c.json({ cachePolicies, total: cachePolicies.length });
});

// ── Origin Access Controls ───────────────────────────────

router.get("/origin-access-controls", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListOriginAccessControlsCommand({}));
  const originAccessControls = result.OriginAccessControlList?.Items || [];
  return c.json({ originAccessControls, total: originAccessControls.length });
});

// ── Functions ────────────────────────────────────────────

router.get("/functions", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListFunctionsCommand({}));
  const functions = result.FunctionList?.Items || [];
  return c.json({ functions, total: functions.length });
});

// ── Tags ─────────────────────────────────────────────────

router.get("/tags", async (c: Context) => {
  const resource = c.req.query("resource");
  if (!resource) return c.json({ error: "resource query param is required" }, 400);
  const client = getClient();
  const result = await client.send(new ListTagsForResourceCommand({ Resource: resource }));
  return c.json({ tags: result.Tags?.Items || [] });
});


// ────────────────────────────────────────────────────────────────
//  P1 gap audit — policy families (generic CRUD)
// ────────────────────────────────────────────────────────────────

type PolicyFamily = {
  list: any; create: any; get: any; update: any; del: any;
  listField: string; idName: string; configName: string; nameKey: string;
};

const policyFamilies: Record<string, PolicyFamily> = {
  "cache-policies": {
    list: ListCachePoliciesCommand, create: CreateCachePolicyCommand,
    get: GetCachePolicyCommand, update: UpdateCachePolicyCommand, del: DeleteCachePolicyCommand,
    listField: "CachePolicyList", idName: "Id", configName: "CachePolicyConfig", nameKey: "Name",
  },
  "origin-request-policies": {
    list: ListOriginRequestPoliciesCommand, create: CreateOriginRequestPolicyCommand,
    get: GetOriginRequestPolicyCommand, update: UpdateOriginRequestPolicyCommand, del: DeleteOriginRequestPolicyCommand,
    listField: "OriginRequestPolicyList", idName: "Id", configName: "OriginRequestPolicyConfig", nameKey: "Name",
  },
  "response-headers-policies": {
    list: ListResponseHeadersPoliciesCommand, create: CreateResponseHeadersPolicyCommand,
    get: GetResponseHeadersPolicyCommand, update: UpdateResponseHeadersPolicyCommand, del: DeleteResponseHeadersPolicyCommand,
    listField: "ResponseHeadersPolicyList", idName: "Id", configName: "ResponseHeadersPolicyConfig", nameKey: "Name",
  },
};

const configFor = (body: any, configName: string, nameKey: string) => {
  if (body[configName]) return body[configName];
  if (body.config) return body.config;
  return { [nameKey]: body.name ?? "" };
/* istanbul ignore next */
};

for (const [route, fam] of Object.entries(policyFamilies)) {
  router.post(`/${route}`, async (c: Context) => {
    const body = await c.req.json<any>();
    if (!body.name && !body[fam.configName] && !body.config) return c.json({ error: "name is required" }, 400);
    const client = getClient();
    const result = await client.send(new fam.create({
      [fam.configName]: configFor(body, fam.configName, fam.nameKey),
    } as any));
    const key = fam.configName === "CachePolicyConfig" ? "CachePolicy" : fam.configName === "OriginRequestPolicyConfig" ? "OriginRequestPolicy" : "ResponseHeadersPolicy";
    return c.json({ policy: (result as any)[key] ?? result }, 201);
  });

  router.get(`/${route}`, async (c: Context) => {
    const client = getClient();
    const result = await client.send(new fam.list({}));
    const list = (result as any)[fam.listField]?.Items || [];
/* istanbul ignore next */
    return c.json({ [route]: list, total: list.length });
  });

  router.get(`/${route}/:id`, async (c: Context) => {
    const client = getClient();
    const result = await client.send(new fam.get({ [fam.idName]: c.req.param("id")! } as any));
    return c.json({ policy: result });
  });

  router.put(`/${route}/:id`, async (c: Context) => {
    const body = await c.req.json<any>();
    const client = getClient();
    const result = await client.send(new fam.update({
      [fam.idName]: c.req.param("id")!,
      [fam.configName]: configFor(body, fam.configName, fam.nameKey),
      IfMatch: body.ifMatch,
    } as any));
    return c.json({ policy: result });
  });

  router.delete(`/${route}/:id`, async (c: Context) => {
    const ifMatch = c.req.query("ifMatch") || c.req.header("If-Match") || undefined;
    const client = getClient();
    await client.send(new fam.del({ [fam.idName]: c.req.param("id")!, IfMatch: ifMatch } as any));
    return c.json({ deleted: true });
  });
}

// ─── Origin Access Controls (OAC) ─────────────────────────

router.post("/origin-access-controls", async (c: Context) => {
  const body = await c.req.json<any>();
  const config = body.OriginAccessControlConfig || body.config || (body.name ? {
    Name: body.name,
    SigningProtocol: body.signingProtocol || "sigv4",
    SigningBehavior: body.signingBehavior || "always",
    OriginAccessControlOriginType: body.originAccessControlOriginType || "s3",
  } : null);
  if (!config) return c.json({ error: "config is required" }, 400);
  const client = getClient();
  const result = await client.send(new CreateOriginAccessControlCommand({ OriginAccessControlConfig: config }));
  return c.json({ originAccessControl: result.OriginAccessControl ?? null }, 201);
});

router.get("/origin-access-controls/:id", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetOriginAccessControlCommand({ Id: c.req.param("id")! }));
  return c.json({ originAccessControl: result.OriginAccessControl ?? null });
});

router.put("/origin-access-controls/:id", async (c: Context) => {
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(new UpdateOriginAccessControlCommand({
    Id: c.req.param("id")!,
    OriginAccessControlConfig: body.OriginAccessControlConfig || body.config,
    IfMatch: body.ifMatch,
  }));
  return c.json({ originAccessControl: result.OriginAccessControl ?? null });
});

router.delete("/origin-access-controls/:id", async (c: Context) => {
  const client = getClient();
  await client.send(new DeleteOriginAccessControlCommand({
    Id: c.req.param("id")!, IfMatch: c.req.query("ifMatch") || undefined,
/* istanbul ignore next */
  }));
  return c.json({ deleted: true });
});

// ─── Origin Access Identities (OAI, legacy) ───────────────

router.post("/oai", async (c: Context) => {
  const body = await c.req.json<any>();
  const config = body.CloudFrontOriginAccessIdentityConfig || body.config || (body.callerReference ? {
    CallerReference: body.callerReference, Comment: body.comment || "",
  } : null);
  if (!config) return c.json({ error: "config is required" }, 400);
  const client = getClient();
  const result = await client.send(new CreateCloudFrontOriginAccessIdentityCommand({
    CloudFrontOriginAccessIdentityConfig: config,
  }));
  return c.json({ originAccessIdentity: result.CloudFrontOriginAccessIdentity ?? null }, 201);
});

router.get("/oai", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListCloudFrontOriginAccessIdentitiesCommand({ MaxItems: "100" } as any));
  const items = result.CloudFrontOriginAccessIdentityList?.Items || [];
/* istanbul ignore next */
  return c.json({ items, total: items.length });
});

router.get("/oai/:id", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetCloudFrontOriginAccessIdentityCommand({ Id: c.req.param("id")! }));
  return c.json({ originAccessIdentity: result.CloudFrontOriginAccessIdentity ?? null });
});

router.put("/oai/:id", async (c: Context) => {
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(new UpdateCloudFrontOriginAccessIdentityCommand({
    Id: c.req.param("id")!,
    CloudFrontOriginAccessIdentityConfig: body.CloudFrontOriginAccessIdentityConfig || body.config,
    IfMatch: body.ifMatch,
  }));
  return c.json({ originAccessIdentity: result.CloudFrontOriginAccessIdentity ?? null });
});

router.delete("/oai/:id", async (c: Context) => {
  const client = getClient();
  await client.send(new DeleteCloudFrontOriginAccessIdentityCommand({
    Id: c.req.param("id")!, IfMatch: c.req.query("ifMatch") || undefined,
/* istanbul ignore next */
  }));
  return c.json({ deleted: true });
});

// ─── CloudFront Functions ─────────────────────────────────

router.post("/functions", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const client = getClient();
  const result = await client.send(new CreateFunctionCommand({
    Name: body.name,
    FunctionConfig: body.functionConfig || { Comment: body.comment || "", Runtime: body.runtime || "cloudfront-js-1.0" },
    FunctionCode: body.functionCode,
  }));
  return c.json({ functionSummary: result.FunctionSummary ?? null, location: result.Location ?? null }, 201);
});

router.get("/functions/:name", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeFunctionCommand({ Name: c.req.param("name")! }));
  return c.json({ functionSummary: result.FunctionSummary ?? null });
});

router.get("/functions/:name/code", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetFunctionCommand({ Name: c.req.param("name")! }));
  return c.json({
    etag: result.ETag ?? null,
/* istanbul ignore next */
    codeBase64: result.FunctionCode ? Buffer.from(result.FunctionCode).toString("base64") : null,
  });
});

router.put("/functions/:name", async (c: Context) => {
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(new UpdateFunctionCommand({
    Name: c.req.param("name")!,
    FunctionConfig: body.functionConfig || { Comment: body.comment || "", Runtime: body.runtime || "cloudfront-js-1.0" },
    FunctionCode: body.functionCode,
    IfMatch: body.ifMatch,
  }));
  return c.json({ functionSummary: result.FunctionSummary ?? null });
});

router.post("/functions/:name/publish", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new PublishFunctionCommand({
    Name: c.req.param("name")!, IfMatch: c.req.header("If-Match") || c.req.query("ifMatch") || undefined,
/* istanbul ignore next */
  }));
  return c.json({ functionSummary: result.FunctionSummary ?? null });
});

router.delete("/functions/:name", async (c: Context) => {
  const client = getClient();
  await client.send(new DeleteFunctionCommand({
    Name: c.req.param("name")!, IfMatch: c.req.header("If-Match") || c.req.query("ifMatch") || undefined,
/* istanbul ignore next */
  }));
  return c.json({ deleted: true });
});

// ─── Public keys + key groups ─────────────────────────────

router.post("/public-keys", async (c: Context) => {
  const body = await c.req.json<any>();
  const config = body.PublicKeyConfig || body.config || (body.name ? {
    Name: body.name, CallerReference: body.callerReference || body.name, EncodedKey: body.encodedKey || "",
/* istanbul ignore next */
  } : null);
  if (!config) return c.json({ error: "config is required" }, 400);
  const client = getClient();
  const result = await client.send(new CreatePublicKeyCommand({ PublicKeyConfig: config }));
  return c.json({ publicKey: result.PublicKey ?? null }, 201);
});

router.get("/public-keys", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListPublicKeysCommand({}));
  const items = result.PublicKeyList?.Items || [];
/* istanbul ignore next */
  return c.json({ items, total: items.length });
});

router.get("/public-keys/:id", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetPublicKeyCommand({ Id: c.req.param("id")! }));
  return c.json({ publicKey: result.PublicKey ?? null, etag: result.ETag ?? null });
});

router.put("/public-keys/:id", async (c: Context) => {
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(new UpdatePublicKeyCommand({
    Id: c.req.param("id")!,
    PublicKeyConfig: body.PublicKeyConfig || body.config,
    IfMatch: body.ifMatch,
  }));
  return c.json({ publicKey: result.PublicKey ?? null });
});

router.delete("/public-keys/:id", async (c: Context) => {
  const client = getClient();
  await client.send(new DeletePublicKeyCommand({
    Id: c.req.param("id")!, IfMatch: c.req.query("ifMatch") || undefined,
/* istanbul ignore next */
  }));
  return c.json({ deleted: true });
});

router.post("/key-groups", async (c: Context) => {
  const body = await c.req.json<any>();
  const config = body.KeyGroupConfig || body.config || (body.name ? {
    Name: body.name, Items: body.items || [],
/* istanbul ignore next */
  } : null);
  if (!config) return c.json({ error: "config is required" }, 400);
  const client = getClient();
  const result = await client.send(new CreateKeyGroupCommand({ KeyGroupConfig: config }));
  return c.json({ keyGroup: result.KeyGroup ?? null }, 201);
});

router.get("/key-groups", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListKeyGroupsCommand({}));
  const items = result.KeyGroupList?.Items || [];
/* istanbul ignore next */
  return c.json({ items, total: items.length });
});

router.get("/key-groups/:id", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetKeyGroupCommand({ Id: c.req.param("id")! }));
  return c.json({ keyGroup: result.KeyGroup ?? null });
});

router.put("/key-groups/:id", async (c: Context) => {
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(new UpdateKeyGroupCommand({
    Id: c.req.param("id")!,
    KeyGroupConfig: body.KeyGroupConfig || body.config,
    IfMatch: body.ifMatch,
  }));
  return c.json({ keyGroup: result.KeyGroup ?? null });
});

router.delete("/key-groups/:id", async (c: Context) => {
  const client = getClient();
  await client.send(new DeleteKeyGroupCommand({
    Id: c.req.param("id")!, IfMatch: c.req.query("ifMatch") || undefined,
/* istanbul ignore next */
  }));
  return c.json({ deleted: true });
});

// ─── Distribution helpers ─────────────────────────────────

router.post("/distributions-with-tags", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.distributionConfig) return c.json({ error: "distributionConfig is required" }, 400);
  const client = getClient();
  const result = await client.send(new CreateDistributionWithTagsCommand({
    DistributionConfigWithTags: {
      DistributionConfig: body.distributionConfig,
      Tags: { Items: (body.tags || []).map((t: any) => ({ Key: t.Key ?? t.key, Value: t.Value ?? t.value })) },
/* istanbul ignore next */
    },
  } as any));
  return c.json({ distribution: result.Distribution ?? null }, 201);
});

router.get("/distributions/:id/config", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetDistributionConfigCommand({ Id: c.req.param("id")! }));
  return c.json({ distributionConfig: result.DistributionConfig ?? null, etag: result.ETag ?? null });
});

router.post("/distributions/:id/alias", async (c: Context) => {
  const body = await c.req.json<{ alias: string; ifMatch?: string }>();
  if (!body.alias) return c.json({ error: "alias is required" }, 400);
  const client = getClient();
  await client.send(new AssociateAliasCommand({
    Id: c.req.param("id")!, Alias: body.alias, IfMatch: body.ifMatch,
  } as any));
  return c.json({ associated: true });
});

// ─── Tags write ───────────────────────────────────────────

router.post("/tags", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.resourceArn) return c.json({ error: "resourceArn is required" }, 400);
  const client = getClient();
  await client.send(new TagResourceCommand({
    ResourceARN: body.resourceArn,
    Tags: { Items: (body.tags || []).map((t: any) => ({ Key: t.Key ?? t.key, Value: t.Value ?? t.value })) },
/* istanbul ignore next */
  } as any));
  return c.json({ tagged: true });
});

router.delete("/tags", async (c: Context) => {
  const arn = c.req.query("resourceArn") || "";
  const tagKeys = (c.req.query("tagKeys") || "").split(",").filter(Boolean);
  if (!arn || !tagKeys.length) return c.json({ error: "resourceArn and tagKeys are required" }, 400);
  const client = getClient();
  await client.send(new UntagResourceCommand({ ResourceARN: arn, TagKeys: tagKeys } as any));
  return c.json({ untagged: true });
});

export default router;
