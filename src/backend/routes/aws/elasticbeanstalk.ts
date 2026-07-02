import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { ElasticBeanstalkClient } from "@aws-sdk/client-elastic-beanstalk";
import {
  CreateApplicationCommand,
  DescribeApplicationsCommand,
  UpdateApplicationCommand,
  DeleteApplicationCommand,
  CreateApplicationVersionCommand,
  DescribeApplicationVersionsCommand,
  DeleteApplicationVersionCommand,
  CreateEnvironmentCommand,
  DescribeEnvironmentsCommand,
  UpdateEnvironmentCommand,
  TerminateEnvironmentCommand,
  DescribeConfigurationSettingsCommand,
  CheckDNSAvailabilityCommand,
  ListAvailableSolutionStacksCommand,
} from "@aws-sdk/client-elastic-beanstalk";

const router = new Hono();
const getClient = () => create(ElasticBeanstalkClient);

function mapApp(a: any) {
  return {
    applicationName: a.ApplicationName,
    description: a.Description,
    dateCreated: a.DateCreated,
    dateUpdated: a.DateUpdated,
    versions: a.Versions?.length || 0,
    configurationTemplates: a.ConfigurationTemplates?.length || 0,
    resourceLifecycleConfig: a.ResourceLifecycleConfig,
  };
}

function mapVersion(v: any) {
  return {
    applicationName: v.ApplicationName,
    versionLabel: v.VersionLabel,
    description: v.Description,
    dateCreated: v.DateCreated,
    dateUpdated: v.DateUpdated,
    sourceBundle: v.SourceBundle,
    status: v.Status,
  };
}

function mapEnv(e: any) {
  return {
    environmentName: e.EnvironmentName,
    environmentId: e.EnvironmentId,
    applicationName: e.ApplicationName,
    description: e.Description || "",
    versionLabel: e.VersionLabel,
    solutionStackName: e.SolutionStackName,
    platformArn: e.PlatformArn,
    endpointURL: e.EndpointURL,
    cname: e.CNAME,
    status: e.Status,
    health: e.Health,
    healthStatus: e.HealthStatus,
    resources: e.Resources,
    tier: e.Tier,
    environmentLinks: e.EnvironmentLinks || [],
    environmentArn: e.EnvironmentArn,
    dateCreated: e.DateCreated,
    dateUpdated: e.DateUpdated,
    operationsRole: e.OperationsRole,
  };
}

// ─── Applications ─────────────────────────────────────

router.get("/applications", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeApplicationsCommand({}));
  const apps = (result.Applications || []).map(mapApp);
  return c.json({ applications: apps, total: apps.length });
});

router.get("/applications/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const client = getClient();
  const result = await client.send(
    new DescribeApplicationsCommand({ ApplicationNames: [name] })
  );
  const app = result.Applications?.[0] ? mapApp(result.Applications[0]) : null;
  return c.json({ application: app });
});

router.post("/applications", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.applicationName) return c.json({ error: "applicationName is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateApplicationCommand({
      ApplicationName: body.applicationName,
      Description: body.description,
      Tags: body.tags,
      ResourceLifecycleConfig: body.resourceLifecycleConfig,
    })
  );
  return c.json({ application: mapApp(result.Application), created: true }, 201);
});

router.put("/applications/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(
    new UpdateApplicationCommand({
      ApplicationName: name,
      Description: body.description,
    })
  );
  return c.json({ application: result.Application ? mapApp(result.Application) : null, updated: true });
});

router.delete("/applications/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const client = getClient();
  await client.send(
    new DeleteApplicationCommand({
      ApplicationName: name,
      TerminateEnvByForce: c.req.query("terminateEnvByForce") === "true",
    })
  );
  return c.json({ deleted: true });
});

// ─── Application Versions ─────────────────────────────

router.get("/applications/:name/versions", async (c: Context) => {
  const name = c.req.param("name")!;
  const client = getClient();
  const result = await client.send(
    new DescribeApplicationVersionsCommand({ ApplicationName: name })
  );
  const versions = (result.ApplicationVersions || []).map(mapVersion);
  return c.json({ versions, total: versions.length });
});

router.post("/applications/:name/versions", async (c: Context) => {
  const appName = c.req.param("name")!;
  const body = await c.req.json<any>();
  if (!body.versionLabel) return c.json({ error: "versionLabel is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateApplicationVersionCommand({
      ApplicationName: appName,
      VersionLabel: body.versionLabel,
      Description: body.description,
      SourceBundle: body.sourceBundle,
      AutoCreateApplication: body.autoCreateApplication ?? false,
      Process: body.process,
      Tags: body.tags,
    })
  );
  return c.json({ version: mapVersion(result.ApplicationVersion), created: true }, 201);
});

router.delete("/applications/:name/versions/:versionLabel", async (c: Context) => {
  const appName = c.req.param("name")!;
  const versionLabel = c.req.param("versionLabel")!;
  const client = getClient();
  await client.send(
    new DeleteApplicationVersionCommand({
      ApplicationName: appName,
      VersionLabel: versionLabel,
      DeleteSourceBundle: c.req.query("deleteSourceBundle") !== "false",
    })
  );
  return c.json({ deleted: true });
});

// ─── Environments ─────────────────────────────────────

router.get("/applications/:name/environments", async (c: Context) => {
  const name = c.req.param("name")!;
  const client = getClient();
  const result = await client.send(
    new DescribeEnvironmentsCommand({
      ApplicationName: name,
      IncludeDeleted: c.req.query("includeDeleted") === "true",
    })
  );
  const envs = (result.Environments || []).map(mapEnv);
  return c.json({ environments: envs, total: envs.length });
});

router.get("/environments/:envName", async (c: Context) => {
  const envName = c.req.param("envName")!;
  const appName = c.req.query("applicationName");
  const client = getClient();
  const result = await client.send(
    new DescribeEnvironmentsCommand({
      EnvironmentNames: [envName],
      ApplicationName: appName,
    })
  );
  const env = result.Environments?.[0] ? mapEnv(result.Environments[0]) : null;
  return c.json({ environment: env });
});

router.post("/applications/:name/environments", async (c: Context) => {
  const appName = c.req.param("name")!;
  const body = await c.req.json<any>();
  if (!body.environmentName) return c.json({ error: "environmentName is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateEnvironmentCommand({
      ApplicationName: appName,
      EnvironmentName: body.environmentName,
      Description: body.description,
      VersionLabel: body.versionLabel,
      SolutionStackName: body.solutionStackName,
      Tier: body.tier,
      OptionSettings: body.optionSettings,
      Tags: body.tags,
      TemplateName: body.templateName,
      PlatformArn: body.platformArn,
      CNAMEPrefix: body.cnamePrefix,
      OperationsRole: body.operationsRole,
    })
  );
  return c.json({ environment: mapEnv(result), created: true }, 201);
});

router.put("/applications/:name/environments/:envName", async (c: Context) => {
  const envName = c.req.param("envName")!;
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(
    new UpdateEnvironmentCommand({
      EnvironmentName: envName,
      Description: body.description,
      VersionLabel: body.versionLabel,
      Tier: body.tier,
      SolutionStackName: body.solutionStackName,
      OptionSettings: body.optionSettings,
      OptionsToRemove: body.optionsToRemove,
      TemplateName: body.templateName,
      PlatformArn: body.platformArn,
    })
  );
  return c.json({ environment: mapEnv(result), updated: true });
});

router.delete("/environments/:envName", async (c: Context) => {
  const envName = c.req.param("envName")!;
  const client = getClient();
  const result = await client.send(
    new TerminateEnvironmentCommand({
      EnvironmentName: envName,
    })
  );
  return c.json({ environmentId: result.EnvironmentId, terminated: true });
});

// ─── Configuration ────────────────────────────────────

router.get("/applications/:name/environments/:envName/configuration", async (c: Context) => {
  const appName = c.req.param("name")!;
  const envName = c.req.param("envName")!;
  const client = getClient();
  const result = await client.send(
    new DescribeConfigurationSettingsCommand({
      ApplicationName: appName,
      EnvironmentName: envName,
    })
  );
  return c.json({
    configurationSettings: result.ConfigurationSettings || [],
  });
});

// ─── Utility ──────────────────────────────────────────

router.get("/solution-stacks", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListAvailableSolutionStacksCommand({}));
  return c.json({
    solutionStacks: result.SolutionStacks || [],
    solutionStackDetails: result.SolutionStackDetails || [],
  });
});

router.get("/check-dns-availability/:cnamePrefix", async (c: Context) => {
  const cnamePrefix = c.req.param("cnamePrefix")!;
  const client = getClient();
  const result = await client.send(
    new CheckDNSAvailabilityCommand({ CNAMEPrefix: cnamePrefix })
  );
  return c.json({
    available: result.Available,
    fullyQualifiedCNAME: result.FullyQualifiedCNAME,
  });
});

export default router;
