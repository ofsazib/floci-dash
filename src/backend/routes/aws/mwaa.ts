import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  MWAAClient,
  ListEnvironmentsCommand,
  GetEnvironmentCommand,
  CreateEnvironmentCommand,
  UpdateEnvironmentCommand,
  DeleteEnvironmentCommand,
  CreateWebLoginTokenCommand,
  CreateCliTokenCommand,
} from "@aws-sdk/client-mwaa";

const router = new Hono();
const getClient = () => create(MWAAClient);

router.get("/environments", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListEnvironmentsCommand({}));
  const environments = result.Environments || [];
  return c.json({ environments, total: environments.length });
});

router.get("/environments/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const client = getClient();
  const result = await client.send(
    new GetEnvironmentCommand({ Name: name })
  );
  const env = result.Environment;
  return c.json({
    environment: env
      ? {
          name: env.Name,
          arn: env.Arn,
          status: env.Status,
          airflowVersion: env.AirflowVersion,
          environmentClass: env.EnvironmentClass,
          sourceBucketArn: env.SourceBucketArn,
          executionRoleArn: env.ExecutionRoleArn,
          createdAt: env.CreatedAt,
          webserverUrl: env.WebserverUrl,
        }
      : null,
  });
});

router.post("/environments", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  if (!body.sourceBucketArn) return c.json({ error: "sourceBucketArn is required" }, 400);
  if (!body.executionRoleArn) return c.json({ error: "executionRoleArn is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateEnvironmentCommand({
      Name: body.name,
      SourceBucketArn: body.sourceBucketArn,
      ExecutionRoleArn: body.executionRoleArn,
      DagS3Path: body.dagS3Path ?? "dags/",
      NetworkConfiguration: body.networkConfiguration ?? {},
      AirflowVersion: body.airflowVersion,
      EnvironmentClass: body.environmentClass,
    })
  );
  return c.json({ arn: result.Arn }, 201);
});

router.patch("/environments/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(
    new UpdateEnvironmentCommand({
      Name: name,
      AirflowVersion: body.airflowVersion,
      EnvironmentClass: body.environmentClass,
    })
  );
  return c.json({ arn: result.Arn });
});

router.delete("/environments/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new DeleteEnvironmentCommand({ Name: name }));
  return c.json({ deleted: true });
});

router.post("/environments/:name/webtoken", async (c: Context) => {
  const name = c.req.param("name")!;
  const client = getClient();
  const result = await client.send(
    new CreateWebLoginTokenCommand({ Name: name })
  );
  return c.json({
    webServerHostname: result.WebServerHostname || null,
    webToken: result.WebToken || null,
  });
});

router.post("/environments/:name/clitoken", async (c: Context) => {
  const name = c.req.param("name")!;
  const client = getClient();
  const result = await client.send(
    new CreateCliTokenCommand({ Name: name })
  );
  return c.json({
    cliToken: result.CliToken || null,
    webServerHostname: result.WebServerHostname || null,
  });
});

export default router;
