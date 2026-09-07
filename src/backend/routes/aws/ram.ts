import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { RAMClient } from "@aws-sdk/client-ram";
import {
  EnableSharingWithAwsOrganizationCommand,
  CreateResourceShareCommand,
  GetResourceSharesCommand,
  DeleteResourceShareCommand,
  UpdateResourceShareCommand,
  AssociateResourceShareCommand,
  DisassociateResourceShareCommand,
  ListPrincipalsCommand,
  ListResourcesCommand,
  GetResourceShareInvitationsCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from "@aws-sdk/client-ram";

const router = new Hono();
const getClient = () => create(RAMClient);

router.post("/enable-sharing", async (c: Context) => {
  const result: any = await getClient().send(new EnableSharingWithAwsOrganizationCommand({}));
  return c.json({ returnValue: result.returnValue });
});

router.get("/shares", async (c: Context) => {
  const result: any = await getClient().send(
    new GetResourceSharesCommand({
      resourceOwner: (c.req.query("resourceOwner") || "SELF") as any,
    })
  );
  return c.json({
    resourceShares: result.resourceShares || [],
    total: result.resourceShares?.length || 0,
  });
});

router.post("/shares", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const result: any = await getClient().send(
    new CreateResourceShareCommand({
      name: body.name,
      allowExternalPrincipals: body.allowExternalPrincipals,
      principals: body.principals,
      resourceArns: body.resourceArns,
      tags: body.tags,
    })
  );
  return c.json({ resourceShare: result.resourceShare }, 201);
});

router.put("/shares/:arn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const body = await c.req.json<any>();
  const result: any = await getClient().send(
    new UpdateResourceShareCommand({
      resourceShareArn: arn,
      name: body.name,
      allowExternalPrincipals: body.allowExternalPrincipals,
    })
  );
  return c.json({ resourceShare: result.resourceShare });
});

router.delete("/shares/:arn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  await getClient().send(new DeleteResourceShareCommand({ resourceShareArn: arn }));
  return c.json({ deleted: true });
});

router.post("/shares/:arn/associate", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const body = await c.req.json<any>();
  const result: any = await getClient().send(
    new AssociateResourceShareCommand({
      resourceShareArn: arn,
      resourceArns: body.resourceArns,
      principals: body.principals,
    })
  );
  return c.json({ resourceShareAssociations: result.resourceShareAssociations || [] });
});

router.post("/shares/:arn/disassociate", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const body = await c.req.json<any>();
  const result: any = await getClient().send(
    new DisassociateResourceShareCommand({
      resourceShareArn: arn,
      resourceArns: body.resourceArns,
      principals: body.principals,
    })
  );
  return c.json({ resourceShareAssociations: result.resourceShareAssociations || [] });
});

router.get("/principals", async (c: Context) => {
  const result: any = await getClient().send(
    new ListPrincipalsCommand({
      resourceOwner: (c.req.query("resourceOwner") || "SELF") as any,
      resourceShareArns: c.req.query("resourceShareArn")
        ? [decodeURIComponent(c.req.query("resourceShareArn")!)]
        : undefined,
    })
  );
  return c.json({
    principals: result.principals || [],
    total: result.principals?.length || 0,
  });
});

router.get("/resources", async (c: Context) => {
  const result: any = await getClient().send(
    new ListResourcesCommand({
      resourceOwner: (c.req.query("resourceOwner") || "SELF") as any,
      resourceShareArns: c.req.query("resourceShareArn")
        ? [decodeURIComponent(c.req.query("resourceShareArn")!)]
        : undefined,
    })
  );
  return c.json({
    resources: result.resources || [],
    total: result.resources?.length || 0,
  });
});

router.get("/invitations", async (c: Context) => {
  const result: any = await getClient().send(new GetResourceShareInvitationsCommand({}));
  return c.json({
    resourceShareInvitations: result.resourceShareInvitations || [],
    total: result.resourceShareInvitations?.length || 0,
  });
});

router.post("/tags", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.resourceShareArn || !body.tags) {
    return c.json({ error: "resourceShareArn and tags are required" }, 400);
  }
  await getClient().send(
    new TagResourceCommand({
      resourceShareArn: body.resourceShareArn,
      tags: body.tags.map((t: any) => ({ key: t.key, value: t.value })),
    })
  );
  return c.json({ tagged: true });
});

router.post("/tags/untag", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.resourceShareArn || !body.tagKeys) {
    return c.json({ error: "resourceShareArn and tagKeys are required" }, 400);
  }
  const untagBody: any = { resourceShareArn: body.resourceShareArn, tagKeys: body.tagKeys };
  await getClient().send(
    new UntagResourceCommand(untagBody)
  );
  return c.json({ untagged: true });
});

export default router;
