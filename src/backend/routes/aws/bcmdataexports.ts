import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { BCMDataExportsClient } from "@aws-sdk/client-bcm-data-exports";
import {
  ListExportsCommand,
  CreateExportCommand,
  GetExportCommand,
  UpdateExportCommand,
  DeleteExportCommand,
  ListExecutionsCommand,
  GetExecutionCommand,
  ListTablesCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from "@aws-sdk/client-bcm-data-exports";

const router = new Hono();
const getClient = () => create(BCMDataExportsClient);

router.get("/exports", async (c: Context) => {
  const result = await getClient().send(new ListExportsCommand({}));
  return c.json({ exports: result.Exports || [], total: result.Exports?.length || 0 });
});

router.post("/exports", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.Export || !body.Export.Name) return c.json({ error: "Export.Name is required" }, 400);
  const result = await getClient().send(
    new CreateExportCommand({
      Export: body.Export,
      ResourceTags: body.ResourceTags,
    })
  );
  return c.json({ exportArn: result.ExportArn, created: true }, 201);
});

router.get("/exports/:exportArn", async (c: Context) => {
  const exportArn = decodeURIComponent(c.req.param("exportArn")!);
  const result = await getClient().send(new GetExportCommand({ ExportArn: exportArn }));
  return c.json({ export: result.Export });
});

router.put("/exports/:exportArn", async (c: Context) => {
  const exportArn = decodeURIComponent(c.req.param("exportArn")!);
  const body = await c.req.json<any>();
  const result = await getClient().send(
    new UpdateExportCommand({ ExportArn: exportArn, Export: body.Export })
  );
  return c.json({ exportArn: result.ExportArn });
});

router.delete("/exports/:exportArn", async (c: Context) => {
  const exportArn = decodeURIComponent(c.req.param("exportArn")!);
  await getClient().send(new DeleteExportCommand({ ExportArn: exportArn }));
  return c.json({ deleted: true });
});

router.get("/exports/:exportArn/executions", async (c: Context) => {
  const exportArn = decodeURIComponent(c.req.param("exportArn")!);
  const result = await getClient().send(new ListExecutionsCommand({ ExportArn: exportArn }));
  return c.json({ executions: result.Executions || [], total: result.Executions?.length || 0 });
});

router.get("/tables", async (c: Context) => {
  const result = await getClient().send(new ListTablesCommand({}));
  return c.json({ tables: result.Tables || [], total: result.Tables?.length || 0 });
});

router.get("/tags", async (c: Context) => {
  const resourceArn = c.req.query("resourceArn");
  if (!resourceArn) return c.json({ error: "resourceArn query parameter required" }, 400);
  const result = await getClient().send(new ListTagsForResourceCommand({ ResourceArn: resourceArn }));
  return c.json({ tags: result.ResourceTags || [] });
});

router.post("/tags", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.resourceArn || !body.tags) return c.json({ error: "resourceArn and tags are required" }, 400);
  await getClient().send(new TagResourceCommand({ ResourceArn: body.resourceArn, ResourceTags: body.tags }));
  return c.json({ tagged: true });
});

router.post("/tags/untag", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.resourceArn || !body.tagKeys) return c.json({ error: "resourceArn and tagKeys are required" }, 400);
  await getClient().send(new UntagResourceCommand({ ResourceArn: body.resourceArn, ResourceTagKeys: body.tagKeys }));
  return c.json({ untagged: true });
});

export default router;
