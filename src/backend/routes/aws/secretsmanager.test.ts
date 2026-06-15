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

    it("POST /secrets/:id/tags — tags a secret", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/secrets/my-secret/tags", {
        tags: [{ key: "env", value: "prod" }],
      });
      expect(res.status).toBe(200);
      expect((await res.json()).tagged).toBe(true);
    });

    it("DELETE /secrets/:id/tags — untags a secret", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/secrets/my-secret/tags?keys=env,project");
      expect(res.status).toBe(200);
      expect((await res.json()).untagged).toBe(true);
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
  });
});
