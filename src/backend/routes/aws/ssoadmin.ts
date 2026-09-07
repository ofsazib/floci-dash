import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { SSOAdminClient, ListInstancesCommand } from "@aws-sdk/client-sso-admin";

const router = new Hono();
const getClient = () => create(SSOAdminClient);

router.get("/instances", async (c: Context) => {
  const result: any = await getClient().send(new ListInstancesCommand({}));
  return c.json({ instances: result.Instances || [], total: result.Instances?.length || 0 });
});

export default router;
