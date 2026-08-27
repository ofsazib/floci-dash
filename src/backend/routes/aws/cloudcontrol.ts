import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  CloudControlClient,
  ListResourcesCommand,
  GetResourceCommand,
  CreateResourceCommand,
  DeleteResourceCommand,
} from "@aws-sdk/client-cloudcontrol";

const router = new Hono();
const getClient = () => create(CloudControlClient);

router.post("/resources/list", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.typeName) return c.json({ error: "typeName is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new ListResourcesCommand({
      TypeName: body.typeName,
      NextToken: body.nextToken,
    })
  );
  const descriptions = result.ResourceDescriptions || [];
  return c.json({
    resourceDescriptions: descriptions.map((d: any) => ({
      identifier: d.Identifier ?? null,
    })),
    typeName: body.typeName,
    nextToken: result.NextToken ?? null,
  });
});

router.get("/resources/:typeName/:identifier", async (c: Context) => {
  const typeName = decodeURIComponent(c.req.param("typeName")!);
  const identifier = decodeURIComponent(c.req.param("identifier")!);
  const client = getClient();
  const result = await client.send(
    new GetResourceCommand({ TypeName: typeName, Identifier: identifier })
  );
  const d = result.ResourceDescription;
  return c.json({
    resourceDescription: d
      ? { identifier: d.Identifier ?? null, properties: d.Properties ?? null }
      : null,
  });
});

router.post("/resources/create", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.typeName) return c.json({ error: "typeName is required" }, 400);
  if (!body.desiredState) return c.json({ error: "desiredState is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateResourceCommand({
      TypeName: body.typeName,
      DesiredState:
        typeof body.desiredState === "string"
          ? body.desiredState
          : JSON.stringify(body.desiredState),
    })
  );
  const pe = result.ProgressEvent;
  return c.json(
    {
      typeName: pe?.TypeName ?? null,
      identifier: pe?.Identifier ?? null,
      requestToken: pe?.RequestToken ?? null,
      status: pe?.OperationStatus ?? null,
    },
    202
  );
});

router.delete("/resources/:typeName/:identifier", async (c: Context) => {
  const typeName = decodeURIComponent(c.req.param("typeName")!);
  const identifier = decodeURIComponent(c.req.param("identifier")!);
  const client = getClient();
  const result = await client.send(
    new DeleteResourceCommand({ TypeName: typeName, Identifier: identifier })
  );
  const pe = result.ProgressEvent;
  return c.json({
    typeName: pe?.TypeName ?? null,
    identifier: pe?.Identifier ?? null,
    status: pe?.OperationStatus ?? null,
  });
});

export default router;
