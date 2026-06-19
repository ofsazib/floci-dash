import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  CodeBuildClient,
  ListProjectsCommand,
  CreateProjectCommand,
  DeleteProjectCommand,
  BatchGetProjectsCommand,
  StartBuildCommand,
  ListBuildsCommand,
  BatchGetBuildsCommand,
  StopBuildCommand,
  ListBuildsForProjectCommand,
  ListCuratedEnvironmentImagesCommand,
  ListSourceCredentialsCommand,
  ImportSourceCredentialsCommand,
  DeleteSourceCredentialsCommand,
} from "@aws-sdk/client-codebuild";

const router = new Hono();
const getClient = () => create(CodeBuildClient);

router.get("/projects", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListProjectsCommand({}));
  const names = result.projects || [];
  if (!names.length) return c.json({ projects: [], total: 0 });
  const detailed = await client.send(new BatchGetProjectsCommand({ names }));
  return c.json({ projects: detailed.projects || [], total: detailed.projects?.length || 0 });
});

router.post("/projects", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateProjectCommand({
      name: body.name,
      description: body.description,
      source: body.source,
      artifacts: body.artifacts,
      environment: body.environment,
      serviceRole: body.serviceRole,
      tags: body.tags,
    })
  );
  return c.json({ project: result.project }, 201);
});

router.get("/projects/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const client = getClient();
  const result = await client.send(new BatchGetProjectsCommand({ names: [name] }));
  return c.json({ project: result.projects?.[0] || null });
});

router.delete("/projects/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new DeleteProjectCommand({ name }));
  return c.json({ deleted: true });
});

router.post("/projects/:name/build", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(new StartBuildCommand({ projectName: name }));
  return c.json({ build: result.build }, 201);
});

router.get("/projects/:name/builds", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const listResult = await client.send(new ListBuildsForProjectCommand({ projectName: name }));
  const ids = listResult.ids || [];
  if (!ids.length) return c.json({ builds: [], total: 0 });
  const detailed = await client.send(new BatchGetBuildsCommand({ ids }));
  return c.json({ builds: detailed.builds || [], total: detailed.builds?.length || 0 });
});

router.get("/builds", async (c: Context) => {
  const client = getClient();
  const listResult = await client.send(new ListBuildsCommand({}));
  const ids = listResult.ids || [];
  if (!ids.length) return c.json({ builds: [], total: 0 });
  const detailed = await client.send(new BatchGetBuildsCommand({ ids }));
  return c.json({ builds: detailed.builds || [], total: detailed.builds?.length || 0 });
});

router.get("/builds/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(new BatchGetBuildsCommand({ ids: [id] }));
  return c.json({ build: result.builds?.[0] || null });
});

router.post("/builds/:id/stop", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  const result = await client.send(new StopBuildCommand({ id }));
  return c.json({ build: result.build });
});

router.get("/source-credentials", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListSourceCredentialsCommand({}));
  return c.json({ sourceCredentials: result.sourceCredentialsInfos || [] });
});

router.post("/source-credentials", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.token || !body.serverType || !body.authType) {
    return c.json({ error: "token, serverType, and authType are required" }, 400);
  }
  const client = getClient();
  const result = await client.send(
    new ImportSourceCredentialsCommand({
      token: body.token,
      serverType: body.serverType,
      authType: body.authType,
    })
  );
  return c.json({ sourceCredentialsInfo: { arn: result.arn } }, 201);
});

router.delete("/source-credentials/:arn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const client = getClient();
  await client.send(new DeleteSourceCredentialsCommand({ arn }));
  return c.json({ deleted: true });
});

router.get("/curated-images", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListCuratedEnvironmentImagesCommand({}));
  return c.json({ curatedImages: result.platforms || [] });
});

export default router;
