import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  GuardDutyClient,
  ListDetectorsCommand,
  GetDetectorCommand,
  CreateDetectorCommand,
  UpdateDetectorCommand,
  DeleteDetectorCommand,
} from "@aws-sdk/client-guardduty";

const router = new Hono();
const getClient = () => create(GuardDutyClient);

router.get("/detectors", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListDetectorsCommand({}));
  const detectorIds = result.DetectorIds || [];
  return c.json({ detectorIds, total: detectorIds.length, nextToken: result.NextToken ?? null });
});

router.get("/detectors/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const d = await client.send(new GetDetectorCommand({ DetectorId: id }));
  return c.json({
    detector: {
      status: d.Status ?? null,
      createdAt: String(d.CreatedAt ?? ""),
      findingPublishingFrequency: d.FindingPublishingFrequency ?? null,
      serviceRole: d.ServiceRole ?? null,
      tags: Object.keys(d.Tags ?? {}).length ? d.Tags : {},
    },
  });
});

router.post("/detectors", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.enable && body.enable !== false) {
    return c.json({ error: "enable is required" }, 400);
  }
  const client = getClient();
  const result = await client.send(
    new CreateDetectorCommand({
      Enable: body.enable,
      FindingPublishingFrequency: body.frequency,
    })
  );
  return c.json({ detectorId: result.DetectorId }, 201);
});

router.patch("/detectors/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const body = await c.req.json<any>();
  const client = getClient();
  await client.send(
    new UpdateDetectorCommand({
      DetectorId: id,
      Enable: body.enable,
      FindingPublishingFrequency: body.frequency,
    })
  );
  return c.json({ updated: true });
});

router.delete("/detectors/:id", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  await client.send(new DeleteDetectorCommand({ DetectorId: id }));
  return c.json({ deleted: true });
});

export default router;
