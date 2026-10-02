import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { readJson } from "../../clients/read-json";
import {
  DLMClient,
  CreateLifecyclePolicyCommand,
  GetLifecyclePolicyCommand,
  UpdateLifecyclePolicyCommand,
  DeleteLifecyclePolicyCommand,
  GetLifecyclePoliciesCommand,
} from "@aws-sdk/client-dlm";

const router = new Hono();
const getClient = () => create(DLMClient);

// ── Lifecycle policies ───────────────────────────────────

router.get("/policies", async (c: Context) => {
  const result: any = await getClient().send(new GetLifecyclePoliciesCommand({}));
  return c.json({ policies: result.Policies || [], total: result.Policies?.length || 0 });
});

router.post("/policies", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.executionRoleArn) return c.json({ error: "executionRoleArn is required" }, 400);
  if (!body?.description) return c.json({ error: "description is required" }, 400);
  if (!body?.state) return c.json({ error: "state is required" }, 400);
  if (!body?.policyDetails) return c.json({ error: "policyDetails is required" }, 400);
  const result: any = await getClient().send(
    new CreateLifecyclePolicyCommand({
      ExecutionRoleArn: body.executionRoleArn,
      Description: body.description,
      State: body.state,
      PolicyDetails: body.policyDetails,
    })
  );
  return c.json({ policyId: result.PolicyId }, 201);
});

router.get("/policies/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const result: any = await getClient().send(
    new GetLifecyclePolicyCommand({ PolicyId: id })
  );
  return c.json({ policy: result?.Policy || null });
});

router.put("/policies/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const body: any = await readJson(c);
  if (!body?.executionRoleArn) return c.json({ error: "executionRoleArn is required" }, 400);
  if (!body?.description) return c.json({ error: "description is required" }, 400);
  if (!body?.state) return c.json({ error: "state is required" }, 400);
  await getClient().send(
    new UpdateLifecyclePolicyCommand({
      PolicyId: id,
      ExecutionRoleArn: body.executionRoleArn,
      Description: body.description,
      State: body.state,
      PolicyDetails: body.policyDetails,
    })
  );
  return c.json({ ok: true });
});

router.delete("/policies/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  await getClient().send(new DeleteLifecyclePolicyCommand({ PolicyId: id }));
  return c.json({ ok: true });
});

export default router;
