import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockSMClient = vi.hoisted(() =>
  vi.fn(function () {
    return { send: mockSend };
  })
);

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-secrets-manager", () => ({
  SecretsManagerClient: mockSMClient,
  ListSecretsCommand: createCmd("ListSecretsCommand"),
  CreateSecretCommand: createCmd("CreateSecretCommand"),
  DescribeSecretCommand: createCmd("DescribeSecretCommand"),
  GetSecretValueCommand: createCmd("GetSecretValueCommand"),
  PutSecretValueCommand: createCmd("PutSecretValueCommand"),
  UpdateSecretCommand: createCmd("UpdateSecretCommand"),
  DeleteSecretCommand: createCmd("DeleteSecretCommand"),
  RestoreSecretCommand: createCmd("RestoreSecretCommand"),
  RotateSecretCommand: createCmd("RotateSecretCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
  ListSecretVersionIdsCommand: createCmd("ListSecretVersionIdsCommand"),
  GetRandomPasswordCommand: createCmd("GetRandomPasswordCommand"),
  GetResourcePolicyCommand: createCmd("GetResourcePolicyCommand"),
  PutResourcePolicyCommand: createCmd("PutResourcePolicyCommand"),
  DeleteResourcePolicyCommand: createCmd("DeleteResourcePolicyCommand"),
  BatchGetSecretValueCommand: createCmd("BatchGetSecretValueCommand"),
  UpdateSecretVersionStageCommand: createCmd("UpdateSecretVersionStageCommand"),
}));

vi.mock("../../clients/aws", () => ({
  getAwsConfig: () => ({
    endpoint: "http://localhost:4566",
    region: "us-east-1",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  }),
}));

import router from "./secretsmanager";

async function get(path: string) {
  return router.request(path, { method: "GET" });
}

async function post(path: string, body?: any) {
  return router.request(path, {
    method: "POST",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function del(path: string) {
  return router.request(path, { method: "DELETE" });
}

async function put(path: string, body?: any) {
  return router.request(path, {
    method: "PUT",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

beforeEach(() => {
  mockSend.mockReset();
});

describe("Secrets Manager Routes", () => {
  describe("Secrets", () => {
    it("GET /secrets — lists secrets", async () => {
      mockSend.mockResolvedValueOnce({
        SecretList: [
          {
            Name: "my-secret",
            ARN: "arn:aws:secretsmanager:...:secret:my-secret",
            Description: "Test secret",
            CreatedDate: new Date("2025-01-01"),
            Tags: [{ Key: "env", Value: "prod" }],
          },
        ],
      });
      const res = await get("/secrets");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.secrets[0].name).toBe("my-secret");
      expect(body.secrets[0].tags[0].key).toBe("env");
    });

    it("GET /secrets — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ SecretList: [] });
      const res = await get("/secrets");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /secrets — handles undefined SecretList", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/secrets");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("POST /secrets — creates a secret", async () => {
      mockSend.mockResolvedValueOnce({
        ARN: "arn:aws:secretsmanager:...:secret:new-secret",
        Name: "new-secret",
        VersionId: "v1",
      });
      const res = await post("/secrets", {
        name: "new-secret",
        secretString: "my-password",
        tags: [{ key: "env", value: "prod" }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.name).toBe("new-secret");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.Name).toBe("new-secret");
      expect(cmd.SecretString).toBe("my-password");
      expect(cmd.Tags[0].Key).toBe("env");
    });

    it("POST /secrets — creates with secretBinary and description and kmsKeyId", async () => {
      mockSend.mockResolvedValueOnce({
        ARN: "arn:aws:secretsmanager:...:secret:binary-secret",
        Name: "binary-secret",
        VersionId: "v1",
      });
      const res = await post("/secrets", {
        name: "binary-secret",
        secretBinary: "binary-data",
        description: "Binary secret",
        kmsKeyId: "arn:aws:kms:...:key/123",
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.SecretBinary).toBe("binary-data");
      expect(cmd.Description).toBe("Binary secret");
      expect(cmd.KmsKeyId).toBe("arn:aws:kms:...:key/123");
    });

    it("POST /secrets — creates with tags missing key/value", async () => {
      mockSend.mockResolvedValueOnce({
        ARN: "arn:aws:secretsmanager:...:secret:tagged",
        Name: "tagged",
        VersionId: "v1",
      });
      const res = await post("/secrets", {
        name: "tagged",
        secretString: "pw",
        tags: [{ key: "", value: "" }, { key: "env", value: "prod" }],
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.Tags[0].Key).toBe("");
      expect(cmd.Tags[0].Value).toBe("");
      expect(cmd.Tags[1].Key).toBe("env");
      expect(cmd.Tags[1].Value).toBe("prod");
    });

    it("POST /secrets — 400 when name is empty", async () => {
      const res = await post("/secrets", { name: "", secretString: "password" });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("name is required");
    });

    it("GET /secrets/:id — describes a secret with versions", async () => {
      mockSend
        .mockResolvedValueOnce({
          Name: "my-secret",
          ARN: "arn:aws:secretsmanager:...:secret:my-secret",
          CreatedDate: new Date("2025-01-01"),
          Tags: [],
        })
        .mockResolvedValueOnce({
          Versions: [
            {
              VersionId: "v1",
              VersionStages: ["AWSCURRENT"],
              CreatedDate: new Date("2025-01-01"),
            },
          ],
        });
      const res = await get("/secrets/my-secret");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.secret.name).toBe("my-secret");
      expect(body.versions).toHaveLength(1);
      expect(body.versions[0].versionId).toBe("v1");
    });

    it("GET /secrets/:id — handles secret with no Tags and no Versions", async () => {
      mockSend
        .mockResolvedValueOnce({
          Name: "minimal",
          ARN: "arn:aws:secretsmanager:...:secret:minimal",
          CreatedDate: new Date("2025-01-01"),
        })
        .mockResolvedValueOnce({});
      const res = await get("/secrets/minimal");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.secret.name).toBe("minimal");
      expect(body.secret.tags).toEqual([]);
      expect(body.versions).toEqual([]);
    });

    it("GET /secrets/:id — handles version with no VersionStages", async () => {
      mockSend
        .mockResolvedValueOnce({
          Name: "no-stages",
          ARN: "arn:aws:secretsmanager:...:secret:no-stages",
          Description: "No stages",
          KmsKeyId: "arn:aws:kms:...:key/789",
          CreatedDate: new Date("2025-01-01"),
          Tags: [{ Key: "env", Value: "prod" }],
          RotationEnabled: false,
          LastChangedDate: new Date("2025-01-02"),
        })
        .mockResolvedValueOnce({
          Versions: [
            {
              VersionId: "v1",
              CreatedDate: new Date("2025-01-01"),
            },
          ],
        });
      const res = await get("/secrets/no-stages");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.versions[0].stages).toEqual([]);
    });

    it("GET /secrets/:id/value — gets secret value", async () => {
      mockSend.mockResolvedValueOnce({
        Name: "my-secret",
        ARN: "arn:aws:secretsmanager:...",
        VersionId: "v1",
        SecretString: "my-password",
        VersionStages: ["AWSCURRENT"],
        CreatedDate: new Date("2025-01-01"),
      });
      const res = await get("/secrets/my-secret/value");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.secretString).toBe("my-password");
    });

    it("GET /secrets/:id/value — returns secretBinary as base64", async () => {
      mockSend.mockResolvedValueOnce({
        Name: "my-secret",
        ARN: "arn:aws:secretsmanager:...",
        VersionId: "v1",
        SecretBinary: Buffer.from("binary-secret-value"),
        VersionStages: ["AWSCURRENT"],
        CreatedDate: new Date("2025-01-01"),
      });
      const res = await get("/secrets/my-secret/value");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.secretBinary).toBe(Buffer.from("binary-secret-value").toString("base64"));
    });

    it("GET /secrets/:id/value — null secretBinary when absent", async () => {
      mockSend.mockResolvedValueOnce({
        Name: "my-secret",
        ARN: "arn:aws:secretsmanager:...",
        VersionId: "v1",
        SecretString: "text-only",
        VersionStages: ["AWSCURRENT"],
        CreatedDate: new Date("2025-01-01"),
      });
      const res = await get("/secrets/my-secret/value");
      const body = await res.json();
      expect(body.secretBinary).toBeNull();
    });

    it("GET /secrets/:id/value — supports versionId query param", async () => {
      mockSend.mockResolvedValueOnce({
        Name: "my-secret",
        ARN: "arn:aws:secretsmanager:...",
        VersionId: "v2",
        SecretString: "new-password",
        VersionStages: ["AWSCURRENT"],
        CreatedDate: new Date("2025-01-02"),
      });
      const res = await get("/secrets/my-secret/value?versionId=v2");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.secretString).toBe("new-password");
      expect(mockSend.mock.calls[0][0].VersionId).toBe("v2");
    });

    it("GET /secrets/:id/value — handles no VersionStages", async () => {
      mockSend.mockResolvedValueOnce({
        Name: "my-secret",
        ARN: "arn:aws:secretsmanager:...",
        VersionId: "v1",
        SecretString: "my-password",
        CreatedDate: new Date("2025-01-01"),
      });
      const res = await get("/secrets/my-secret/value");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.versionStages).toEqual([]);
    });

    it("PUT /secrets/:id — updates secret metadata", async () => {
      mockSend.mockResolvedValueOnce({
        ARN: "arn:aws:secretsmanager:...",
        Name: "my-secret",
        VersionId: "v2",
      });
      const res = await put("/secrets/my-secret", {
        description: "Updated description",
        secretString: "new-value",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.SecretId).toBe("my-secret");
      expect(cmd.Description).toBe("Updated description");
    });

    it("PUT /secrets/:id — updates with kmsKeyId", async () => {
      mockSend.mockResolvedValueOnce({
        ARN: "arn:aws:secretsmanager:...",
        Name: "my-secret",
        VersionId: "v3",
      });
      const res = await put("/secrets/my-secret", {
        kmsKeyId: "arn:aws:kms:...:key/456",
      });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].KmsKeyId).toBe("arn:aws:kms:...:key/456");
    });

    it("POST /secrets/:id/value — puts secret value", async () => {
      mockSend.mockResolvedValueOnce({
        ARN: "arn:aws:secretsmanager:...",
        Name: "my-secret",
        VersionId: "v2",
      });
      const res = await post("/secrets/my-secret/value", {
        secretString: "new-version",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.put).toBe(true);
    });

    it("POST /secrets/:id/value — with secretBinary", async () => {
      mockSend.mockResolvedValueOnce({
        ARN: "arn:aws:secretsmanager:...",
        Name: "my-secret",
        VersionId: "v3",
      });
      const res = await post("/secrets/my-secret/value", {
        secretBinary: "binary-value",
      });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].SecretBinary).toBe("binary-value");
    });

    it("DELETE /secrets/:id — deletes a secret", async () => {
      mockSend.mockResolvedValueOnce({
        ARN: "arn:aws:secretsmanager:...",
        Name: "my-secret",
      });
      const res = await del("/secrets/my-secret");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].SecretId).toBe("my-secret");
    });

    it("DELETE /secrets/:id?force=true — force deletes a secret", async () => {
      mockSend.mockResolvedValueOnce({
        ARN: "arn:aws:secretsmanager:...",
        Name: "my-secret",
      });
      const res = await del("/secrets/my-secret?force=true");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].ForceDeleteWithoutRecovery).toBe(true);
    });

    it("POST /secrets/:id/restore — restores a secret", async () => {
      mockSend.mockResolvedValueOnce({
        ARN: "arn:aws:secretsmanager:...",
        Name: "my-secret",
      });
      const res = await post("/secrets/my-secret/restore");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.restored).toBe(true);
    });

    it("POST /secrets/:id/rotate — rotates a secret", async () => {
      mockSend.mockResolvedValueOnce({
        ARN: "arn:aws:secretsmanager:...",
        Name: "my-secret",
      });
      const res = await post("/secrets/my-secret/rotate", {
        rotationLambdaARN: "arn:aws:lambda:...:function:rotator",
        automaticallyAfterDays: 30,
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.rotated).toBe(true);
    });

    it("POST /secrets/:id/rotate — with defaults (no autoDays, rotateImmediately false)", async () => {
      mockSend.mockResolvedValueOnce({
        ARN: "arn:aws:secretsmanager:...",
        Name: "my-secret",
      });
      const res = await post("/secrets/my-secret/rotate", {
        rotationLambdaARN: "arn:aws:lambda:...:function:rotator",
        rotateImmediately: false,
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.RotateImmediately).toBe(false);
      expect(cmd.RotationRules).toBeUndefined();
    });

    it("POST /secrets/:id/rotate — with rotateImmediately default (true when undefined)", async () => {
      mockSend.mockResolvedValueOnce({
        ARN: "arn:aws:secretsmanager:...",
        Name: "my-secret",
      });
      const res = await post("/secrets/my-secret/rotate", {
        rotationLambdaARN: "arn:aws:lambda:...:function:rotator",
      });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].RotateImmediately).toBe(true);
    });

    it("POST /secrets/:id/tags — tags a secret", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/secrets/my-secret/tags", {
        tags: [{ key: "env", value: "prod" }],
      });
      expect(res.status).toBe(200);
      expect((await res.json()).tagged).toBe(true);
    });

    it("POST /secrets/:id/tags — tags with missing key/value", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/secrets/my-secret/tags", {
        tags: [{ key: "", value: "" }],
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.Tags[0].Key).toBe("");
      expect(cmd.Tags[0].Value).toBe("");
    });

    it("POST /secrets/:id/tags — handles empty tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/secrets/my-secret/tags", {});
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].Tags).toEqual([]);
    });

    it("DELETE /secrets/:id/tags — untags a secret", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/secrets/my-secret/tags?keys=env,project");
      expect(res.status).toBe(200);
      expect((await res.json()).untagged).toBe(true);
    });

    it("DELETE /secrets/:id/tags — handles empty keys", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/secrets/my-secret/tags");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].TagKeys).toEqual([]);
    });

    it("POST /random-password — generates random password", async () => {
      mockSend.mockResolvedValueOnce({
        RandomPassword: "R@nd0mP@ss!",
      });
      const res = await post("/random-password", { passwordLength: 16 });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.randomPassword).toBe("R@nd0mP@ss!");
      expect(mockSend.mock.calls[0][0].PasswordLength).toBe(16);
    });

    it("POST /random-password — uses defaults when no body", async () => {
      mockSend.mockResolvedValueOnce({ RandomPassword: "pass123" });
      const res = await post("/random-password", {});
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].PasswordLength).toBe(32);
    });

    it("POST /random-password — empty request body falls back via catch", async () => {
      mockSend.mockResolvedValueOnce({ RandomPassword: "fallback-pass" });
      // No body and no content-type -> c.req.json() rejects -> catch(() => ({})) fires
      const res = await post("/random-password");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.randomPassword).toBe("fallback-pass");
      expect(mockSend.mock.calls[0][0].PasswordLength).toBe(32);
    });

    it("POST /random-password — with all exclusion options and requireEachIncludedType: false", async () => {
      mockSend.mockResolvedValueOnce({ RandomPassword: "custom-pass" });
      const res = await post("/random-password", {
        passwordLength: 20,
        excludeCharacters: "!@#",
        excludeLowercase: true,
        excludeUppercase: false,
        excludeNumbers: true,
        excludePunctuation: true,
        includeSpace: false,
        requireEachIncludedType: false,
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.PasswordLength).toBe(20);
      expect(cmd.ExcludeCharacters).toBe("!@#");
      expect(cmd.ExcludeLowercase).toBe(true);
      expect(cmd.ExcludeUppercase).toBe(false);
      expect(cmd.ExcludeNumbers).toBe(true);
      expect(cmd.ExcludePunctuation).toBe(true);
      expect(cmd.IncludeSpace).toBe(false);
      expect(cmd.RequireEachIncludedType).toBe(false);
    });
  });

  describe("Resource policy + version stage + batch value", () => {
    it("GET /secrets/:id/resource-policy — returns the policy", async () => {
      mockSend.mockResolvedValueOnce({ ARN: "arn:s1", Name: "s1", ResourcePolicy: "{}" });
      const res = await get("/secrets/s1/resource-policy");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.resourcePolicy).toBe("{}");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("GetResourcePolicyCommand");
    });

    it("GET /secrets/:id/resource-policy — null policy when absent", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/secrets/s1/resource-policy");
      const body = await res.json();
      expect(body.resourcePolicy).toBeNull();
    });

    it("PUT /secrets/:id/resource-policy — puts the policy", async () => {
      mockSend.mockResolvedValueOnce({ ARN: "arn:s1", Name: "s1" });
      const res = await put("/secrets/s1/resource-policy", { resourcePolicy: '{"Version":"2012-10-17"}' });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("PutResourcePolicyCommand");
      expect(cmd.ResourcePolicy).toBe('{"Version":"2012-10-17"}');
    });

    it("PUT /secrets/:id/resource-policy — 400 without policy", async () => {
      const res = await put("/secrets/s1/resource-policy", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /secrets/:id/resource-policy — deletes the policy", async () => {
      mockSend.mockResolvedValueOnce({ ARN: "arn:s1", Name: "s1" });
      const res = await del("/secrets/s1/resource-policy");
      const body = await res.json();
      expect(body.arn).toBe("arn:s1");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteResourcePolicyCommand");
    });

    it("POST /secrets/batch-value — with SecretIdList", async () => {
      mockSend.mockResolvedValueOnce({ SecretValues: [{ Name: "s1", SecretString: "v" }] });
      const res = await post("/secrets/batch-value", { secretIdList: ["s1"] });
      const body = await res.json();
      expect(body.secretValues).toHaveLength(1);
      expect(body.errors).toEqual([]);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("BatchGetSecretValueCommand");
    });

    it("POST /secrets/batch-value — with Filters only", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/secrets/batch-value", { filters: [{ Key: "all", Values: ["true"] }] });
      expect(res.status).toBe(200);
    });

    it("POST /secrets/batch-value — 400 without list or filters", async () => {
      const res = await post("/secrets/batch-value", {});
      expect(res.status).toBe(400);
    });

    it("POST /secrets/:id/version-stage — moves a stage", async () => {
      mockSend.mockResolvedValueOnce({ ARN: "arn:s1", Name: "s1" });
      const res = await post("/secrets/s1/version-stage", {
        versionStage: "AWSCURRENT",
        moveToVersionId: "v2",
      });
      const body = await res.json();
      expect(body.arn).toBe("arn:s1");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("UpdateSecretVersionStageCommand");
      expect(cmd.MoveToVersionId).toBe("v2");
    });

    it("POST /secrets/:id/version-stage — 400 without versionStage", async () => {
      const res = await post("/secrets/s1/version-stage", {});
      expect(res.status).toBe(400);
    });
  });
});
