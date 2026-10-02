import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  ControlCatalogClient,
  ListControlsCommand,
  GetControlCommand,
} from "@aws-sdk/client-controlcatalog";

const router = new Hono();
const getClient = () => create(ControlCatalogClient);

// ── Controls catalog ─────────────────────────────────────

router.get("/controls", async (c: Context) => {
  const result: any = await getClient().send(new ListControlsCommand({}));
  return c.json({
    controls: result.Controls || [],
    nextToken: result.NextToken || null,
  });
});

router.get("/controls/:arn{.+}", async (c: Context) => {
  const arn = c.req.param("arn")!;
  const result: any = await getClient().send(new GetControlCommand({ ControlArn: arn }));
  return c.json({ control: result || null });
});

export default router;
