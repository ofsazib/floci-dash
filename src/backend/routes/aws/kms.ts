import { Hono } from "hono";
import type { Context } from "hono";
import {
  KMSClient,
  ListKeysCommand,
  DescribeKeyCommand,
  CreateKeyCommand,
  ScheduleKeyDeletionCommand,
  CancelKeyDeletionCommand,
  DisableKeyCommand,
  EnableKeyCommand,
  UpdateKeyDescriptionCommand,
  EnableKeyRotationCommand,
  DisableKeyRotationCommand,
  GetKeyRotationStatusCommand,
  ListAliasesCommand,
  CreateAliasCommand,
  DeleteAliasCommand,
  ListGrantsCommand,
  CreateGrantCommand,
  RevokeGrantCommand,
  RetireGrantCommand,
  EncryptCommand,
  DecryptCommand,
  ReEncryptCommand,
  GenerateDataKeyCommand,
  GenerateRandomCommand,
  TagResourceCommand,
  UntagResourceCommand,
  ListResourceTagsCommand,
  GetKeyPolicyCommand,
  GetPublicKeyCommand,
} from "@aws-sdk/client-kms";
import { getAwsConfig } from "../../clients/aws";

const router = new Hono();

function kms() {
  return new KMSClient(getAwsConfig());
}

function mapKey(k: any) {
  return {
    keyId: k.KeyId,
    arn: k.KeyArn || k.Arn,
    description: k.Description,
    enabled: k.Enabled,
    keyState: k.KeyState,
    keyUsage: k.KeyUsage,
    keySpec: k.KeySpec,
    customerMasterKeySpec: k.CustomerMasterKeySpec,
    origin: k.Origin,
    keyManager: k.KeyManager,
    creationDate: k.CreationDate,
    deletionDate: k.DeletionDate,
    validTo: k.ValidTo,
    multiRegion: k.MultiRegion,
    encryptionAlgorithms: k.EncryptionAlgorithms,
    signingAlgorithms: k.SigningAlgorithms,
    macAlgorithms: k.MacAlgorithms,
    pendingDeletionWindowInDays: k.PendingDeletionWindowInDays,
    automaticRotationEnabled: k.AutonomousKeyStore,
  };
}

function mapAlias(a: any) {
  return {
    name: a.AliasName,
    arn: a.AliasArn,
    targetKeyId: a.TargetKeyId,
    creationDate: a.CreationDate,
    lastUpdatedDate: a.LastUpdatedDate,
  };
}

function mapGrant(g: any) {
  return {
    grantId: g.GrantId,
    keyId: g.KeyId,
    granteePrincipal: g.GranteePrincipal,
    name: g.Name,
    operations: g.Operations || [],
    creationDate: g.CreationDate,
    issuingAccount: g.IssuingAccount,
    constraints: g.Constraints,
  };
}

// ─── KEYS ────────────────────────────────────────────────

router.get("/keys", async (c: Context) => {
  const result = await kms().send(new ListKeysCommand({}));
  const keys = (result.Keys || []).map((k: any) => ({
    keyId: k.KeyId,
    arn: k.KeyArn,
  }));

  // Enrich with descriptions
  const enriched = await Promise.all(
    keys.map(async (k) => {
      try {
        const desc = await kms().send(new DescribeKeyCommand({ KeyId: k.keyId }));
        return mapKey(desc.KeyMetadata);
      } catch {
        return k;
      }
    })
  );

  return c.json({ keys: enriched, total: enriched.length });
});

router.get("/keys/:id", async (c: Context) => {
  const id = c.req.param("id");

  const [keyRes, tagsRes, aliasesRes, grantsRes, rotationRes] = await Promise.all([
    kms().send(new DescribeKeyCommand({ KeyId: id })),
    kms().send(new ListResourceTagsCommand({ KeyId: id })),
    kms().send(new ListAliasesCommand({ KeyId: id })),
    kms().send(new ListGrantsCommand({ KeyId: id })),
    kms().send(new GetKeyRotationStatusCommand({ KeyId: id })).catch(() => null),
  ]);

  const key = mapKey(keyRes.KeyMetadata);
  const tags: Record<string, string> = {};
  (tagsRes.Tags || []).forEach((t: any) => { tags[t.TagKey] = t.TagValue; });
  const aliases = (aliasesRes.Aliases || []).map(mapAlias);
  const grants = (grantsRes.Grants || []).map(mapGrant);

  return c.json({
    key,
    tags,
    aliases,
    grants,
    rotationEnabled: rotationRes?.KeyRotationEnabled ?? false,
  });
});

router.post("/keys", async (c: Context) => {
  const body = await c.req.json<any>();
  const result = await kms().send(
    new CreateKeyCommand({
      Description: body.description,
      KeyUsage: body.keyUsage || "ENCRYPT_DECRYPT",
      KeySpec: body.keySpec || "SYMMETRIC_DEFAULT",
      CustomerMasterKeySpec: body.keySpec || "SYMMETRIC_DEFAULT",
      Origin: body.origin || "AWS_KMS",
      MultiRegion: body.multiRegion,
      Tags: (body.tags || []).map((t: any) => ({ TagKey: t.key, TagValue: t.value })),
    })
  );
  return c.json({ keyId: result.KeyMetadata?.KeyId, arn: result.KeyMetadata?.Arn, created: true });
});

router.put("/keys/:id/description", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  await kms().send(new UpdateKeyDescriptionCommand({ KeyId: id, Description: body.description }));
  return c.json({ keyId: id, updated: true });
});

router.post("/keys/:id/schedule-deletion", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  const result = await kms().send(
    new ScheduleKeyDeletionCommand({ KeyId: id, PendingWindowInDays: body.pendingWindowInDays || 7 })
  );
  return c.json({ keyId: id, deletionDate: result.DeletionDate, scheduled: true });
});

router.post("/keys/:id/cancel-deletion", async (c: Context) => {
  const id = c.req.param("id");
  await kms().send(new CancelKeyDeletionCommand({ KeyId: id }));
  return c.json({ keyId: id, cancelled: true });
});

router.post("/keys/:id/enable", async (c: Context) => {
  const id = c.req.param("id");
  await kms().send(new EnableKeyCommand({ KeyId: id }));
  return c.json({ keyId: id, enabled: true });
});

router.post("/keys/:id/disable", async (c: Context) => {
  const id = c.req.param("id");
  await kms().send(new DisableKeyCommand({ KeyId: id }));
  return c.json({ keyId: id, disabled: true });
});

router.post("/keys/:id/enable-rotation", async (c: Context) => {
  const id = c.req.param("id");
  await kms().send(new EnableKeyRotationCommand({ KeyId: id }));
  return c.json({ keyId: id, rotationEnabled: true });
});

router.post("/keys/:id/disable-rotation", async (c: Context) => {
  const id = c.req.param("id");
  await kms().send(new DisableKeyRotationCommand({ KeyId: id }));
  return c.json({ keyId: id, rotationEnabled: false });
});

// ─── PUBLIC KEY ──────────────────────────────────────────

router.get("/keys/:id/public-key", async (c: Context) => {
  const id = c.req.param("id");
  const result = await kms().send(new GetPublicKeyCommand({ KeyId: id }));
  return c.json({
    keyId: result.KeyId,
    publicKey: result.PublicKey ? Buffer.from(result.PublicKey as any).toString("base64") : null,
    keySpec: result.KeySpec,
    keyUsage: result.KeyUsage,
    encryptionAlgorithms: result.EncryptionAlgorithms,
    signingAlgorithms: result.SigningAlgorithms,
  });
});

// ─── ENCRYPT / DECRYPT ───────────────────────────────────

router.post("/keys/:id/encrypt", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  const result = await kms().send(
    new EncryptCommand({
      KeyId: id,
      Plaintext: Buffer.from(body.plaintext, "base64"),
      EncryptionAlgorithm: body.algorithm,
    })
  );
  return c.json({
    ciphertextBlob: Buffer.from(result.CiphertextBlob as any).toString("base64"),
    keyId: result.KeyId,
    encryptionAlgorithm: result.EncryptionAlgorithm,
  });
});

router.post("/decrypt", async (c: Context) => {
  const body = await c.req.json<any>();
  const result = await kms().send(
    new DecryptCommand({
      CiphertextBlob: Buffer.from(body.ciphertextBlob, "base64"),
      EncryptionAlgorithm: body.algorithm,
    })
  );
  return c.json({
    plaintext: Buffer.from(result.Plaintext as any).toString("base64"),
    keyId: result.KeyId,
    encryptionAlgorithm: result.EncryptionAlgorithm,
  });
});

router.post("/keys/:id/data-key", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  const result = await kms().send(
    new GenerateDataKeyCommand({
      KeyId: id,
      KeySpec: body.keySpec || "AES_256",
    })
  );
  return c.json({
    plaintext: result.Plaintext ? Buffer.from(result.Plaintext as any).toString("base64") : null,
    ciphertextBlob: result.CiphertextBlob ? Buffer.from(result.CiphertextBlob as any).toString("base64") : null,
    keyId: result.KeyId,
  });
});

router.post("/random", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const result = await kms().send(
    new GenerateRandomCommand({ NumberOfBytes: body.numberOfBytes || 32 })
  );
  return c.json({
    plaintext: result.Plaintext ? Buffer.from(result.Plaintext as any).toString("base64") : null,
  });
});

// ─── ALIASES ─────────────────────────────────────────────

router.get("/aliases", async (c: Context) => {
  const result = await kms().send(new ListAliasesCommand({}));
  const aliases = (result.Aliases || []).map(mapAlias);
  return c.json({ aliases, total: aliases.length });
});

router.post("/aliases", async (c: Context) => {
  const body = await c.req.json<any>();
  await kms().send(
    new CreateAliasCommand({
      AliasName: body.aliasName.startsWith("alias/") ? body.aliasName : `alias/${body.aliasName}`,
      TargetKeyId: body.targetKeyId,
    })
  );
  return c.json({ aliasName: body.aliasName, created: true });
});

router.delete("/aliases/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const aliasName = name.startsWith("alias/") ? name : `alias/${name}`;
  await kms().send(new DeleteAliasCommand({ AliasName: aliasName }));
  return c.json({ aliasName, deleted: true });
});

// ─── GRANTS ──────────────────────────────────────────────

router.delete("/keys/:keyId/grants/:grantId", async (c: Context) => {
  const keyId = c.req.param("keyId");
  const grantId = c.req.param("grantId");
  await kms().send(new RevokeGrantCommand({ KeyId: keyId, GrantId: grantId }));
  return c.json({ grantId, revoked: true });
});

router.post("/keys/:keyId/grants/retire", async (c: Context) => {
  const keyId = c.req.param("keyId");
  const body = await c.req.json<any>();
  await kms().send(new RetireGrantCommand({ KeyId: keyId, GrantId: body.grantId }));
  return c.json({ grantId: body.grantId, retired: true });
});

// ─── TAGS ────────────────────────────────────────────────

router.post("/keys/:id/tags", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  await kms().send(
    new TagResourceCommand({
      KeyId: id,
      Tags: (body.tags || []).map((t: any) => ({ TagKey: t.key, TagValue: t.value })),
    })
  );
  return c.json({ tagged: true });
});

router.delete("/keys/:id/tags", async (c: Context) => {
  const id = c.req.param("id");
  const keys = c.req.query("keys")?.split(",") || [];
  await kms().send(new UntagResourceCommand({ KeyId: id, TagKeys: keys }));
  return c.json({ untagged: true });
});

export default router;
