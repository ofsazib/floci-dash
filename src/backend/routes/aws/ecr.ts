import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { ECRClient } from "@aws-sdk/client-ecr";
import {
  DescribeRepositoriesCommand,
  CreateRepositoryCommand,
  DeleteRepositoryCommand,
  ListImagesCommand,
  DescribeImagesCommand,
  BatchDeleteImageCommand,
  GetRepositoryPolicyCommand,
  SetRepositoryPolicyCommand,
  DeleteRepositoryPolicyCommand,
  GetLifecyclePolicyCommand,
  PutLifecyclePolicyCommand,
  DeleteLifecyclePolicyCommand,
  TagResourceCommand,
  PutImageTagMutabilityCommand,
  UntagResourceCommand,
  ListTagsForResourceCommand,
  BatchGetRepositoryScanningConfigurationCommand,
  BatchGetImageCommand,
  GetAuthorizationTokenCommand,
} from "@aws-sdk/client-ecr";

const router = new Hono();
const getClient = () => create(ECRClient);

// ── Repositories ──────────────────────────────────────────

router.get("/repositories", async (c: Context) => {
  const client = getClient();
  const repositoryNames = c.req.query("repositoryNames")?.split(",");
  const result = await client.send(
    new DescribeRepositoriesCommand(repositoryNames ? { repositoryNames } : {})
  );
  const repos = (result.repositories || []).map((r) => ({
    repositoryName: r.repositoryName,
    repositoryUri: r.repositoryUri,
    createdAt: r.createdAt?.toISOString() || null,
    imageTagMutability: r.imageTagMutability,
    encryptionConfiguration: r.encryptionConfiguration,
  }));
  return c.json({ repositories: repos, total: repos.length });
});

router.post("/repositories", async (c: Context) => {
  const body = await c.req.json<{ repositoryName: string; tags?: Record<string, string> }>();
  if (!body.repositoryName) return c.json({ error: "repositoryName is required" }, 400);
  const client = getClient();
  const tagList = body.tags
    ? Object.entries(body.tags).map(([Key, Value]) => ({ Key, Value }))
    : [];
  const result = await client.send(
    new CreateRepositoryCommand({
      repositoryName: body.repositoryName,
      tags: tagList.length ? tagList : undefined,
    })
  );
  return c.json({ repository: result.repository }, 201);
});

router.delete("/repositories/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new DeleteRepositoryCommand({ repositoryName: name }));
  return c.json({ repositoryName: name, deleted: true });
});

// ── Images ────────────────────────────────────────────────

router.get("/repositories/:name/images", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const listResult = await client.send(
    new ListImagesCommand({ repositoryName: name })
  );
  if (!listResult.imageIds?.length) return c.json({ images: [], total: 0 });
  const detailed = await client.send(
    new DescribeImagesCommand({
      repositoryName: name,
      imageIds: listResult.imageIds,
    })
  );
  const images = (detailed.imageDetails || []).map((img) => ({
    imageDigest: img.imageDigest,
    imageTags: img.imageTags || [],
    imageSizeInBytes: img.imageSizeInBytes,
    imagePushedAt: img.imagePushedAt?.toISOString() || null,
    imageScanStatus: img.imageScanStatus,
    imageScanFindingsSummary: img.imageScanFindingsSummary,
  }));
  return c.json({ images, total: images.length });
});

router.delete("/repositories/:name/images", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ imageIds: Array<{ imageDigest?: string; imageTag?: string }> }>();
  if (!body.imageIds?.length) return c.json({ error: "imageIds is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new BatchDeleteImageCommand({
      repositoryName: name,
      imageIds: body.imageIds,
    })
  );
  return c.json({
    imageIds: result.imageIds || [],
    failures: result.failures || [],
  });
});

// ── Image manifests ───────────────────────────────────────

router.get("/repositories/:name/images/manifest", async (c: Context) => {
  const name = c.req.param("name");
  const tag = c.req.query("tag");
  const digest = c.req.query("digest");
  if (!tag && !digest) {
    return c.json({ error: "tag or digest is required" }, 400);
  }
  const client = getClient();
  const result = await client.send(
    new BatchGetImageCommand({
      repositoryName: name,
      imageIds: [{ imageTag: tag || undefined, imageDigest: digest || undefined }],
    })
  );
  const image = (result.images || [])[0];
  return c.json({
    repositoryName: name,
    image: image
      ? {
          registryId: image.registryId,
          repositoryName: image.repositoryName,
          imageId: image.imageId,
          imageManifest: image.imageManifest,
          imageManifestMediaType: image.imageManifestMediaType,
        }
      : null,
  });
});

// ── Auth token ────────────────────────────────────────────

router.get("/auth-token", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetAuthorizationTokenCommand({}));
  const authData = (result.authorizationData || [])[0];
  return c.json({
    authorizationToken: authData?.authorizationToken || null,
    expiresAt: authData?.expiresAt?.toISOString() || null,
    proxyEndpoint: authData?.proxyEndpoint || null,
  });
});

// ── Repository Policy ─────────────────────────────────────

router.get("/repositories/:name/policy", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  try {
    const result = await client.send(new GetRepositoryPolicyCommand({ repositoryName: name }));
    return c.json({
      repositoryName: name,
      policyText: result.policyText || null,
    });
  } catch (err: any) {
    if (err.name === "RepositoryPolicyNotFoundException") {
      return c.json({ repositoryName: name, policyText: null });
    }
    throw err;
  }
});

router.put("/repositories/:name/policy", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ policyText: string }>();
  if (!body.policyText) return c.json({ error: "policyText is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new SetRepositoryPolicyCommand({
      repositoryName: name,
      policyText: body.policyText,
    })
  );
  return c.json({ repositoryName: name, policyText: result.policyText });
});

router.delete("/repositories/:name/policy", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new DeleteRepositoryPolicyCommand({ repositoryName: name }));
  return c.json({ repositoryName: name, deleted: true });
});

// ── Lifecycle Policy ──────────────────────────────────────

router.get("/repositories/:name/lifecycle", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  try {
    const result = await client.send(new GetLifecyclePolicyCommand({ repositoryName: name }));
    return c.json({
      repositoryName: name,
      lifecyclePolicyText: result.lifecyclePolicyText || null,
    });
  } catch (err: any) {
    if (err.name === "LifecyclePolicyNotFoundException") {
      return c.json({ repositoryName: name, lifecyclePolicyText: null });
    }
    throw err;
  }
});

router.put("/repositories/:name/lifecycle", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ lifecyclePolicyText: string }>();
  if (!body.lifecyclePolicyText) return c.json({ error: "lifecyclePolicyText is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new PutLifecyclePolicyCommand({
      repositoryName: name,
      lifecyclePolicyText: body.lifecyclePolicyText,
    })
  );
  return c.json({
    repositoryName: name,
    lifecyclePolicyText: result.lifecyclePolicyText,
  });
});

// ── Scanning Configuration ────────────────────────────────

router.get("/repositories/:name/scanning-configuration", async (c: Context) => {
  const name = c.req.param("name")!;
  const client = getClient();
  const result = await client.send(
    new BatchGetRepositoryScanningConfigurationCommand({ repositoryNames: [name] })
  );
  const config = (result.scanningConfigurations || [])[0] || null;
  const failure = (result.failures || [])[0] || null;
  return c.json({
    repositoryName: name,
    scanningConfiguration: config
      ? {
          repositoryArn: config.repositoryArn,
          scanOnPush: config.scanOnPush ?? false,
          scanFrequency: config.scanFrequency || null,
          appliedScanFilters: config.appliedScanFilters || [],
        }
      : null,
    failure: failure
      ? { repositoryName: failure.repositoryName, failureCode: failure.failureCode, failureReason: failure.failureReason }
      : null,
  });
});

// ── Tags ──────────────────────────────────────────────────

router.get("/repositories/:name/tags", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(
    new ListTagsForResourceCommand({ resourceArn: `arn:aws:ecr:*:*:repository/${name}` })
  );
  return c.json({ tags: result.tags || [] });
});

router.post("/repositories/:name/tags", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ tags: Record<string, string> }>();
  const client = getClient();
  const tagList = Object.entries(body.tags || {}).map(([Key, Value]) => ({ Key, Value }));
  await client.send(
    new TagResourceCommand({
      resourceArn: `arn:aws:ecr:*:*:repository/${name}`,
      tags: tagList,
    })
  );
  return c.json({ updated: true });
});

router.delete("/repositories/:name/tags", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ tagKeys: string[] }>();
  const client = getClient();
  await client.send(
    new UntagResourceCommand({
      resourceArn: `arn:aws:ecr:*:*:repository/${name}`,
      tagKeys: body.tagKeys || [],
    })
  );
  return c.json({ updated: true });
});


router.put("/repositories/:name/tag-mutability", async (c: Context) => {
  const name = c.req.param("name")!;
  const body = await c.req.json<{ tagMutability?: string }>();
  if (!body.tagMutability) return c.json({ error: "tagMutability is required" }, 400);
  const client = getClient();
  const result: any = await client.send(
    new PutImageTagMutabilityCommand({
      repositoryName: name,
      imageTagMutability: body.tagMutability as any,
    })
  );
  return c.json({
    registryId: result.registryId,
    repositoryName: result.repositoryName,
    imageTagMutability: result.imageTagMutability,
  });
});

export default router;