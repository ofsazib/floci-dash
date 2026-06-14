import { Hono } from "hono";
import type { Context } from "hono";
import {
  SecretsManagerClient,
  ListSecretsCommand,
  CreateSecretCommand,
  DescribeSecretCommand,
  GetSecretValueCommand,
  PutSecretValueCommand,
  UpdateSecretCommand,
  DeleteSecretCommand,
  RestoreSecretCommand,
  RotateSecretCommand,
  TagResourceCommand,
  UntagResourceCommand,
  ListSecretVersionIdsCommand,
  GetRandomPasswordCommand,
} from "@aws-sdk/client-secrets-manager";
import { getAwsConfig } from "../../clients/aws";

const router = new Hono();

function sm() {
  return new SecretsManagerClient(getAwsConfig());
}

function mapSecret(s: any) {
  return {
    name: s.Name,
    arn: s.ARN,
    description: s.Description,
    kmsKeyId: s.KmsKeyId,
    rotationEnabled: s.RotationEnabled,
    rotationLambdaARN: s.RotationLambdaARN,
    rotationRules: s.RotationRules,
    createdDate: s.CreatedDate,
    lastChangedDate: s.LastChangedDate,
    lastAccessedDate: s.LastAccessedDate,
    deletedDate: s.DeletedDate,
    tags: (s.Tags || []).map((t: any) => ({ key: t.Key, value: t.Value })),
  };
}

// ─── SECRETS LIST ────────────────────────────────────────

router.get("/secrets", async (c: Context) => {
  const result = await sm().send(new ListSecretsCommand({}));
  const secrets = (result.SecretList || []).map(mapSecret);
  return c.json({ secrets, total: secrets.length });
});

// ─── SECRET DETAIL ───────────────────────────────────────

router.get("/secrets/:id", async (c: Context) => {
  const id = c.req.param("id");
  const [descRes, versionsRes] = await Promise.all([
    sm().send(new DescribeSecretCommand({ SecretId: id })),
    sm().send(new ListSecretVersionIdsCommand({ SecretId: id })),
  ]);

  const secret = mapSecret(descRes);
  return c.json({
    secret,
    versions: (versionsRes.Versions || []).map((v: any) => ({
      versionId: v.VersionId,
      stages: v.VersionStages || [],
      createdDate: v.CreatedDate,
    })),
    versionIdsToStages: descRes.VersionIdsToStages || {},
  });
});

// ─── GET SECRET VALUE ────────────────────────────────────

router.get("/secrets/:id/value", async (c: Context) => {
  const id = c.req.param("id");
  const versionId = c.req.query("versionId");
  const result = await sm().send(
    new GetSecretValueCommand({ SecretId: id, VersionId: versionId || undefined })
  );
  return c.json({
    name: result.Name,
    arn: result.ARN,
    versionId: result.VersionId,
    secretString: result.SecretString,
    secretBinary: result.SecretBinary
      ? Buffer.from(result.SecretBinary as any).toString("base64")
      : null,
    createdDate: result.CreatedDate,
    versionStages: result.VersionStages || [],
  });
});

// ─── CREATE SECRET ───────────────────────────────────────

router.post("/secrets", async (c: Context) => {
  const body = await c.req.json<any>();
  const result = await sm().send(
    new CreateSecretCommand({
      Name: body.name,
      SecretString: body.secretString,
      SecretBinary: body.secretBinary,
      Description: body.description,
      KmsKeyId: body.kmsKeyId,
      Tags: (body.tags || []).map((t: any) => ({ Key: t.key, Value: t.value })),
    })
  );
  return c.json({ arn: result.ARN, name: result.Name, versionId: result.VersionId, created: true });
});

// ─── UPDATE SECRET ───────────────────────────────────────

router.put("/secrets/:id", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  const result = await sm().send(
    new UpdateSecretCommand({
      SecretId: id,
      Description: body.description,
      SecretString: body.secretString,
      KmsKeyId: body.kmsKeyId,
    })
  );
  return c.json({ arn: result.ARN, name: result.Name, versionId: result.VersionId, updated: true });
});

// ─── PUT SECRET VALUE ────────────────────────────────────

router.post("/secrets/:id/value", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  const result = await sm().send(
    new PutSecretValueCommand({
      SecretId: id,
      SecretString: body.secretString,
      SecretBinary: body.secretBinary,
    })
  );
  return c.json({ arn: result.ARN, name: result.Name, versionId: result.VersionId, put: true });
});

// ─── DELETE SECRET ───────────────────────────────────────

router.delete("/secrets/:id", async (c: Context) => {
  const id = c.req.param("id");
  const forceDelete = c.req.query("force") === "true";
  const result = await sm().send(
    new DeleteSecretCommand({
      SecretId: id,
      ForceDeleteWithoutRecovery: forceDelete,
    })
  );
  return c.json({ arn: result.ARN, name: result.Name, deleted: true });
});

// ─── RESTORE SECRET ──────────────────────────────────────

router.post("/secrets/:id/restore", async (c: Context) => {
  const id = c.req.param("id");
  const result = await sm().send(new RestoreSecretCommand({ SecretId: id }));
  return c.json({ arn: result.ARN, name: result.Name, restored: true });
});

// ─── ROTATE SECRET ───────────────────────────────────────

router.post("/secrets/:id/rotate", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  const result = await sm().send(
    new RotateSecretCommand({
      SecretId: id,
      RotationLambdaARN: body.rotationLambdaARN,
      RotateImmediately: body.rotateImmediately !== false,
      RotationRules: body.automaticallyAfterDays
        ? { AutomaticallyAfterDays: body.automaticallyAfterDays }
        : undefined,
    })
  );
  return c.json({ arn: result.ARN, name: result.Name, rotated: true });
});

// ─── TAGS ────────────────────────────────────────────────

router.post("/secrets/:id/tags", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  await sm().send(
    new TagResourceCommand({
      SecretId: id,
      Tags: (body.tags || []).map((t: any) => ({ Key: t.key, Value: t.value })),
    })
  );
  return c.json({ tagged: true });
});

router.delete("/secrets/:id/tags", async (c: Context) => {
  const id = c.req.param("id");
  const keys = c.req.query("keys")?.split(",") || [];
  await sm().send(new UntagResourceCommand({ SecretId: id, TagKeys: keys }));
  return c.json({ untagged: true });
});

// ─── RANDOM PASSWORD ─────────────────────────────────────

router.post("/random-password", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const result = await sm().send(
    new GetRandomPasswordCommand({
      PasswordLength: body.passwordLength || 32,
      ExcludeCharacters: body.excludeCharacters,
      ExcludeLowercase: body.excludeLowercase,
      ExcludeUppercase: body.excludeUppercase,
      ExcludeNumbers: body.excludeNumbers,
      ExcludePunctuation: body.excludePunctuation,
      IncludeSpace: body.includeSpace,
      RequireEachIncludedType: body.requireEachIncludedType !== false,
    })
  );
  return c.json({ randomPassword: result.RandomPassword });
});

export default router;
