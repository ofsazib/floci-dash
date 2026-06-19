import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { AppConfigDataClient, StartConfigurationSessionCommand, GetLatestConfigurationCommand } from "@aws-sdk/client-appconfigdata";

const router = new Hono();
const getClient = () => create(AppConfigDataClient);

router.post("/sessions", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.ApplicationIdentifier) return c.json({ error: "ApplicationIdentifier is required" }, 400);
  if (!body.EnvironmentIdentifier) return c.json({ error: "EnvironmentIdentifier is required" }, 400);
  if (!body.ConfigurationProfileIdentifier) return c.json({ error: "ConfigurationProfileIdentifier is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new StartConfigurationSessionCommand({
      ApplicationIdentifier: body.ApplicationIdentifier,
      EnvironmentIdentifier: body.EnvironmentIdentifier,
      ConfigurationProfileIdentifier: body.ConfigurationProfileIdentifier,
      RequiredMinimumPollIntervalInSeconds: body.RequiredMinimumPollIntervalInSeconds,
    })
  );
  return c.json({ initialConfigurationToken: result.InitialConfigurationToken });
});

router.post("/configurations", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.configurationToken) return c.json({ error: "configurationToken is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new GetLatestConfigurationCommand({
      ConfigurationToken: body.configurationToken,
    })
  );

  const content = result.Configuration
    ? Buffer.from(result.Configuration as any).toString("base64")
    : null;

  return c.json({
    content,
    contentType: result.ContentType,
    versionLabel: result.VersionLabel,
    nextPollConfigurationToken: result.NextPollConfigurationToken,
    nextPollIntervalInSeconds: result.NextPollIntervalInSeconds,
  });
});

export default router;
