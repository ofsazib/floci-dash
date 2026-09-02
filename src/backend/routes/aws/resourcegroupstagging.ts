import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { ResourceGroupsTaggingAPIClient } from "@aws-sdk/client-resource-groups-tagging-api";
import {
  GetResourcesCommand,
  TagResourcesCommand,
  UntagResourcesCommand,
  GetTagKeysCommand,
  GetTagValuesCommand,
} from "@aws-sdk/client-resource-groups-tagging-api";

const router = new Hono();
const getClient = () => create(ResourceGroupsTaggingAPIClient);

router.get("/resources", async (c: Context) => {
  const tagFilters = c.req.query("tagFilters")
    ? JSON.parse(c.req.query("tagFilters")!)
    : undefined;
  const resourceTypeFilters = c.req.query("resourceTypeFilters")
    ? JSON.parse(c.req.query("resourceTypeFilters")!)
    : undefined;
  const resourcesPerPage = Number(c.req.query("resourcesPerPage")) || 50;
  const paginationToken = c.req.query("paginationToken") || undefined;

  const client = getClient();
  const result = await client.send(
    new GetResourcesCommand({
      TagFilters: tagFilters,
      ResourceTypeFilters: resourceTypeFilters,
      ResourcesPerPage: resourcesPerPage,
      PaginationToken: paginationToken,
    })
  );
  return c.json({
    resourceTagMappingList: result.ResourceTagMappingList || [],
    paginationToken: result.PaginationToken,
    total: (result.ResourceTagMappingList || []).length,
  });
});

router.post("/tag", async (c: Context) => {
  const body = await c.req.json<{ resourceARNList: string[]; tags: Record<string, string> }>();
  if (!body.resourceARNList?.length) return c.json({ error: "resourceARNList is required" }, 400);
  if (!body.tags || !Object.keys(body.tags).length) return c.json({ error: "tags is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new TagResourcesCommand({ ResourceARNList: body.resourceARNList, Tags: body.tags })
  );
  return c.json({ failedResourcesMap: result.FailedResourcesMap || {} });
});

router.post("/untag", async (c: Context) => {
  const body = await c.req.json<{ resourceARNList: string[]; tagKeys: string[] }>();
  if (!body.resourceARNList?.length) return c.json({ error: "resourceARNList is required" }, 400);
  if (!body.tagKeys?.length) return c.json({ error: "tagKeys is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new UntagResourcesCommand({ ResourceARNList: body.resourceARNList, TagKeys: body.tagKeys })
  );
  return c.json({ failedResourcesMap: result.FailedResourcesMap || {} });
});

router.get("/tag-keys", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetTagKeysCommand({}));
  return c.json({
    tagKeys: result.TagKeys || [],
    paginationToken: result.PaginationToken,
    total: (result.TagKeys || []).length,
  });
});

router.get("/tag-values", async (c: Context) => {
  const key = c.req.query("key") || "";
  if (!key) return c.json({ error: "key query param is required" }, 400);

  const client = getClient();
  const result = await client.send(new GetTagValuesCommand({ Key: key }));
  return c.json({
    tagValues: result.TagValues || [],
    paginationToken: result.PaginationToken,
    total: (result.TagValues || []).length,
  });
});

export default router;
