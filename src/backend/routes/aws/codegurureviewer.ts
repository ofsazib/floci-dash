import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { CodeGuruReviewerClient } from "@aws-sdk/client-codeguru-reviewer";
import {
  AssociateRepositoryCommand,
  DescribeRepositoryAssociationCommand,
  DisassociateRepositoryCommand,
  ListRepositoryAssociationsCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from "@aws-sdk/client-codeguru-reviewer";

const router = new Hono();
const getClient = () => create(CodeGuruReviewerClient);

router.get("/associations", async (c: Context) => {
  const result: any = await getClient().send(
    new ListRepositoryAssociationsCommand({ MaxResults: 100 })
  );
  return c.json({
    associations: result.RepositoryAssociationSummaries || [],
    total: result.RepositoryAssociationSummaries?.length || 0,
  });
});

router.post("/associations", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.Repository) return c.json({ error: "Repository is required" }, 400);
  const result: any = await getClient().send(
    new AssociateRepositoryCommand({
      Repository: body.Repository,
      KMSKeyDetails: body.KMSKeyDetails,
      Tags: body.Tags,
    })
  );
  return c.json(
    { repositoryAssociation: result.RepositoryAssociation, tags: result.Tags || {} },
    201
  );
});

router.get("/associations/:associationArn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("associationArn")!);
  const result: any = await getClient().send(
    new DescribeRepositoryAssociationCommand({ AssociationArn: arn })
  );
  return c.json({
    repositoryAssociation: result.RepositoryAssociation,
    tags: result.Tags || {},
  });
});

router.delete("/associations/:associationArn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("associationArn")!);
  const result: any = await getClient().send(
    new DisassociateRepositoryCommand({ AssociationArn: arn })
  );
  return c.json({
    repositoryAssociation: result.RepositoryAssociation,
    tags: result.Tags || {},
  });
});

router.get("/tags", async (c: Context) => {
  const resourceArn = c.req.query("resourceArn");
  if (!resourceArn) return c.json({ error: "resourceArn query parameter required" }, 400);
  const result: any = await getClient().send(
    new ListTagsForResourceCommand({ resourceArn })
  );
  return c.json({ tags: result.tags || {} });
});

router.post("/tags", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.resourceArn || !body.tags) {
    return c.json({ error: "resourceArn and tags are required" }, 400);
  }
  const tagBody: any = { resourceArn: body.resourceArn, tags: body.tags };
  await getClient().send(new TagResourceCommand(tagBody));
  return c.json({ tagged: true });
});

router.post("/tags/untag", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.resourceArn || !body.tagKeys) {
    return c.json({ error: "resourceArn and tagKeys are required" }, 400);
  }
  const untagBody: any = { resourceArn: body.resourceArn, tagKeys: body.tagKeys };
  await getClient().send(new UntagResourceCommand(untagBody));
  return c.json({ untagged: true });
});

export default router;
