import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  FisClient,
  ListExperimentTemplatesCommand,
  GetExperimentTemplateCommand,
  CreateExperimentTemplateCommand,
  UpdateExperimentTemplateCommand,
  DeleteExperimentTemplateCommand,
  ListExperimentsCommand,
  GetExperimentCommand,
  StartExperimentCommand,
  StopExperimentCommand,
} from "@aws-sdk/client-fis";

const router = new Hono();
const getClient = () => create(FisClient);

router.get("/experiment-templates", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListExperimentTemplatesCommand({}));
  const templates = result.experimentTemplates || [];
/* istanbul ignore next */
  return c.json({ experimentTemplates: templates, total: templates.length });
});

router.get("/experiment-templates/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(
    new GetExperimentTemplateCommand({ id })
  );
  const t = result.experimentTemplate;
  return c.json({
    experimentTemplate: t
      ? {
          id: t.id,
          description: nstr(t.description),
          title: nstr((t as any).title),
          state: statusOf((t as any).state),
          targets: Object.keys(t.targets ?? {}),
          actions: Object.keys(t.actions ?? {}),
          stopConditions: t.stopConditions ?? [],
          roleArn: nstr(t.roleArn),
          tags: t.tags ?? {},
        }
      : null,
  });
});

router.post("/experiment-templates", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.description) return c.json({ error: "description is required" }, 400);
  if (!body.roleArn) return c.json({ error: "roleArn is required" }, 400);
  if (!body.actions) return c.json({ error: "actions are required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateExperimentTemplateCommand({
      description: body.description,
      roleArn: body.roleArn,
      targets: body.targets ?? {},
      actions: body.actions,
      stopConditions: body.stopConditions ?? [{ source: "none" }],
      tags: { Name: body.name ?? "" },
    })
  );
  const t = result.experimentTemplate;
  return c.json({ id: t?.id, state: statusOf((t as any)?.state) }, 201);
});

router.patch("/experiment-templates/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(
    new UpdateExperimentTemplateCommand({
      id,
      description: body.description,
      roleArn: body.roleArn,
    })
  );
  const tpl = result.experimentTemplate;
  return c.json({
    id: tpl?.id,
    state: statusOf((tpl as any)?.state),
  });
});

router.delete("/experiment-templates/:id", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  await client.send(new DeleteExperimentTemplateCommand({ id }));
  return c.json({ deleted: true });
});

const nstr = (v: any) => (v == null ? null : v);
const statusOf = (s: any) => (s && s.status != null ? s.status : null);

router.get("/experiments", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListExperimentsCommand({}));
  const experiments = result.experiments || [];
  return c.json({ experiments, total: experiments.length });
});

router.get("/experiments/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(new GetExperimentCommand({ id }));
  const e = result.experiment;
  return c.json({
    experiment: e
      ? {
          id: e.id,
          templateId: e.experimentTemplateId ?? null,
          state: e.state?.status ?? null,
          startTime: String(e.startTime ?? ""),
          endTime: String(e.endTime ?? ""),
          stopReason: nstr((e as any).stopReason),
        }
      : null,
  });
});

router.post("/experiments", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.templateId) return c.json({ error: "templateId is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new StartExperimentCommand({ experimentTemplateId: body.templateId })
  );
  return c.json(
    { id: result.experiment?.id, state: statusOf((result.experiment as any)?.state) },
    202
  );
});

router.delete("/experiments/:id", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  const result = await client.send(new StopExperimentCommand({ id }));
  return c.json({
    id: result.experiment?.id,
    state: statusOf((result.experiment as any)?.state),
  });
});

export default router;
