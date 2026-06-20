import { Hono } from "hono";
import type { Context } from "hono";
import {
  LambdaClient,
  ListFunctionsCommand,
  CreateFunctionCommand,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  UpdateFunctionConfigurationCommand,
  UpdateFunctionCodeCommand,
  DeleteFunctionCommand,
  InvokeCommand,
  PublishVersionCommand,
  ListVersionsByFunctionCommand,
  ListAliasesCommand,
  CreateAliasCommand,
  DeleteAliasCommand,
  ListLayersCommand,
  ListLayerVersionsCommand,
  DeleteLayerVersionCommand,
  ListEventSourceMappingsCommand,
  DeleteEventSourceMappingCommand,
  ListTagsCommand,
  TagResourceCommand,
  UntagResourceCommand,
  GetFunctionUrlConfigCommand,
  DeleteFunctionUrlConfigCommand,
  GetFunctionConcurrencyCommand,
  ListFunctionUrlConfigsCommand,
} from "@aws-sdk/client-lambda";
import { getAwsConfig } from "../../clients/aws";
import { sanitizeName, sanitizeText } from "../../clients/sanitize";

const router = new Hono();

function lambda() {
  return new LambdaClient(getAwsConfig());
}

function mapFunction(f: any) {
  return {
    name: f.FunctionName,
    arn: f.FunctionArn,
    runtime: f.Runtime,
    handler: f.Handler,
    role: f.Role,
    timeout: f.Timeout,
    memorySize: f.MemorySize,
    lastModified: f.LastModified,
    codeSize: f.CodeSize,
    codeSha256: f.CodeSha256,
    version: f.Version,
    state: f.State,
    stateReason: f.StateReason,
    description: f.Description,
    architectures: f.Architectures,
    packageType: f.PackageType,
    environment: f.Environment?.Variables,
    layers: (f.Layers || []).map((l: any) => ({ arn: l.Arn, codeSize: l.CodeSize })),
    tracingConfig: f.TracingConfig?.Mode,
    ephemeralStorage: f.EphemeralStorage?.Size,
    revisionId: f.RevisionId,
  };
}

// ─── FUNCTIONS ──────────────────────────────────────────

router.get("/functions", async (c: Context) => {
  const result = await lambda().send(new ListFunctionsCommand({}));
  const functions = (result.Functions || []).map(mapFunction);
  return c.json({ functions, total: functions.length });
});

router.post("/functions", async (c: Context) => {
  const body = await c.req.json<any>();
  const funcName = sanitizeName(body.name || "", 140);
  if (!funcName) return c.json({ error: "name is required" }, 400);
  const result = await lambda().send(
    new CreateFunctionCommand({
      FunctionName: funcName,
      Runtime: body.runtime,
      Role: body.role || "arn:aws:iam::000000000000:role/lambda-role",
      Handler: sanitizeName(body.handler || "", 128),
      Code: body.zipFile
        ? { ZipFile: new Uint8Array(Buffer.from(body.zipFile, "base64")) }
        : { S3Bucket: sanitizeName(body.s3Bucket || "", 255), S3Key: sanitizeName(body.s3Key || "", 1024) },
      Timeout: body.timeout || 3,
      MemorySize: body.memorySize || 128,
      Environment: body.environment
        ? { Variables: body.environment }
        : undefined,
      Description: sanitizeText(body.description || "", 256),
      Layers: body.layers,
      Architectures: body.architectures,
      PackageType: body.packageType,
    })
  );
  return c.json({ function: mapFunction(result), created: true });
});

router.get("/functions/:name", async (c: Context) => {
  const name = c.req.param("name");
  const result = await lambda().send(new GetFunctionCommand({ FunctionName: name }));
  return c.json({
    configuration: mapFunction(result.Configuration),
    code: result.Code
      ? {
          repositoryType: result.Code.RepositoryType,
          location: result.Code.Location,
        }
      : undefined,
  });
});

router.put("/functions/:name/configuration", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<any>();
  const result = await lambda().send(
    new UpdateFunctionConfigurationCommand({
      FunctionName: name,
      Runtime: body.runtime,
      Handler: sanitizeName(body.handler || "", 128),
      Timeout: body.timeout,
      MemorySize: body.memorySize,
      Environment: body.environment ? { Variables: body.environment } : undefined,
      Description: sanitizeText(body.description || "", 256),
    })
  );
  return c.json({ function: mapFunction(result), updated: true });
});

router.put("/functions/:name/code", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<any>();
  const result = await lambda().send(
    new UpdateFunctionCodeCommand({
      FunctionName: name,
      ZipFile: body.zipFile
        ? new Uint8Array(Buffer.from(body.zipFile, "base64"))
        : undefined,
      S3Bucket: sanitizeName(body.s3Bucket || "", 255),
      S3Key: sanitizeName(body.s3Key || "", 1024),
    })
  );
  return c.json({ function: mapFunction(result), updated: true });
});

router.delete("/functions/:name", async (c: Context) => {
  const name = c.req.param("name");
  await lambda().send(new DeleteFunctionCommand({ FunctionName: name }));
  return c.json({ name, deleted: true });
});

// ─── INVOKE ─────────────────────────────────────────────

router.post("/functions/:name/invocations", async (c: Context) => {
  const name = c.req.param("name");
  const invocationType = c.req.header("X-Amz-Invocation-Type") || "RequestResponse";
  const rawBody = await c.req.arrayBuffer();
  const payload = new Uint8Array(rawBody);

  const result = await lambda().send(
    new InvokeCommand({
      FunctionName: name,
      InvocationType: invocationType as any,
      Payload: payload,
    })
  );

  const response: any = {
    statusCode: result.StatusCode,
    executedVersion: result.ExecutedVersion,
    functionError: result.FunctionError,
    requestId: result.$metadata?.requestId,
  };

  if (result.Payload) {
    const decoded = new TextDecoder().decode(result.Payload);
    try {
      response.payload = JSON.parse(decoded);
    } catch {
      response.payload = decoded;
    }
  }

  return c.json(response);
});

// ─── VERSIONS ───────────────────────────────────────────

router.post("/functions/:name/versions", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<any>().catch(() => ({}));
  const result = await lambda().send(
    new PublishVersionCommand({
      FunctionName: name,
      Description: body.description,
    })
  );
  return c.json({ version: mapFunction(result), published: true });
});

router.get("/functions/:name/versions", async (c: Context) => {
  const name = c.req.param("name");
  const result = await lambda().send(
    new ListVersionsByFunctionCommand({ FunctionName: name })
  );
  const versions = (result.Versions || []).map(mapFunction);
  return c.json({ versions, total: versions.length });
});

// ─── ALIASES ────────────────────────────────────────────

router.get("/functions/:name/aliases", async (c: Context) => {
  const name = c.req.param("name");
  const result = await lambda().send(
    new ListAliasesCommand({ FunctionName: name })
  );
  const aliases = (result.Aliases || []).map((a: any) => ({
    name: a.Name,
    functionVersion: a.FunctionVersion,
    aliasArn: a.AliasArn,
    description: a.Description,
    revisionId: a.RevisionId,
    routingConfig: a.RoutingConfig,
  }));
  return c.json({ aliases, total: aliases.length });
});

router.post("/functions/:name/aliases", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<any>();
  const result = await lambda().send(
    new CreateAliasCommand({
      FunctionName: name,
      Name: body.name,
      FunctionVersion: body.functionVersion,
      Description: body.description,
    })
  );
  return c.json({ alias: result, created: true });
});

router.delete("/functions/:name/aliases/:aliasName", async (c: Context) => {
  const name = c.req.param("name");
  const aliasName = c.req.param("aliasName");
  const { DeleteAliasCommand } = await import("@aws-sdk/client-lambda");
  await lambda().send(new DeleteAliasCommand({ FunctionName: name, Name: aliasName }));
  return c.json({ name: aliasName, deleted: true });
});

// ─── EVENT SOURCE MAPPINGS ──────────────────────────────

router.get("/event-source-mappings", async (c: Context) => {
  const functionName = c.req.query("functionName");
  const result = await lambda().send(
    new ListEventSourceMappingsCommand({
      FunctionName: functionName,
    })
  );
  const mappings = (result.EventSourceMappings || []).map((m: any) => ({
    uuid: m.UUID,
    functionArn: m.FunctionArn,
    eventSourceArn: m.EventSourceArn,
    state: m.State,
    batchSize: m.BatchSize,
    lastProcessingResult: m.LastProcessingResult,
  }));
  return c.json({ eventSourceMappings: mappings, total: mappings.length });
});

router.delete("/event-source-mappings/:uuid", async (c: Context) => {
  const uuid = c.req.param("uuid");
  await lambda().send(new DeleteEventSourceMappingCommand({ UUID: uuid }));
  return c.json({ uuid, deleted: true });
});

// ─── LAYERS ─────────────────────────────────────────────

router.get("/layers", async (c: Context) => {
  const result = await lambda().send(new ListLayersCommand({}));
  const layers = (result.Layers || []).map((l: any) => ({
    name: l.LayerName,
    arn: l.LayerArn,
    latestVersion: l.LatestMatchingVersion
      ? {
          version: l.LatestMatchingVersion.Version,
          description: l.LatestMatchingVersion.Description,
          codeSize: l.LatestMatchingVersion.CodeSize,
          compatibleRuntimes: l.LatestMatchingVersion.CompatibleRuntimes,
          licenseInfo: l.LatestMatchingVersion.LicenseInfo,
        }
      : undefined,
  }));
  return c.json({ layers, total: layers.length });
});

router.get("/layers/:name/versions", async (c: Context) => {
  const name = c.req.param("name");
  const result = await lambda().send(
    new ListLayerVersionsCommand({ LayerName: name })
  );
  const versions = (result.LayerVersions || []).map((v: any) => ({
    version: v.Version,
    description: v.Description,
    codeSize: v.CodeSize,
    compatibleRuntimes: v.CompatibleRuntimes,
    licenseInfo: v.LicenseInfo,
  }));
  return c.json({ versions, total: versions.length });
});

router.delete("/layers/:name/versions/:version", async (c: Context) => {
  const name = c.req.param("name");
  const version = Number(c.req.param("version"));
  await lambda().send(
    new DeleteLayerVersionCommand({ LayerName: name, VersionNumber: version })
  );
  return c.json({ name, version, deleted: true });
});

// ─── TAGS ───────────────────────────────────────────────

router.get("/tags/:arn", async (c: Context) => {
  const arn = c.req.param("arn");
  const result = await lambda().send(new ListTagsCommand({ Resource: arn }));
  return c.json({ tags: result.Tags || {} });
});

router.post("/tags/:arn", async (c: Context) => {
  const arn = c.req.param("arn");
  const body = await c.req.json<any>();
  await lambda().send(
    new TagResourceCommand({ Resource: arn, Tags: body.tags })
  );
  return c.json({ tagged: true });
});

router.delete("/tags/:arn", async (c: Context) => {
  const arn = c.req.param("arn");
  const tagKeys = c.req.queries("tagKeys") || [];
  await lambda().send(
    new UntagResourceCommand({ Resource: arn, TagKeys: tagKeys })
  );
  return c.json({ untagged: true });
});

// ─── FUNCTION URLS ──────────────────────────────────────

router.get("/functions/:name/url", async (c: Context) => {
  const name = c.req.param("name");
  const result = await lambda().send(
    new GetFunctionUrlConfigCommand({ FunctionName: name })
  );
  return c.json({
    url: result.FunctionUrl,
    authType: result.AuthType,
    cors: result.Cors,
    invokeMode: result.InvokeMode,
  });
});

router.delete("/functions/:name/url", async (c: Context) => {
  const name = c.req.param("name");
  await lambda().send(new DeleteFunctionUrlConfigCommand({ FunctionName: name }));
  return c.json({ name, deleted: true });
});

// ─── CONCURRENCY ────────────────────────────────────────

router.get("/functions/:name/concurrency", async (c: Context) => {
  const name = c.req.param("name");
  try {
    const result = await lambda().send(
      new GetFunctionConcurrencyCommand({ FunctionName: name })
    );
    return c.json({ reservedConcurrentExecutions: result.ReservedConcurrentExecutions });
  } catch (err: any) {
    return c.json({ reservedConcurrentExecutions: undefined });
  }
});

export default router;
