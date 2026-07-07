import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockKMS = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-kms", () => ({
  KMSClient: mockKMS,
  ListKeysCommand: createCmd("ListKeysCommand"),
  DescribeKeyCommand: createCmd("DescribeKeyCommand"),
  CreateKeyCommand: createCmd("CreateKeyCommand"),
  ScheduleKeyDeletionCommand: createCmd("ScheduleKeyDeletionCommand"),
  CancelKeyDeletionCommand: createCmd("CancelKeyDeletionCommand"),
  DisableKeyCommand: createCmd("DisableKeyCommand"),
  EnableKeyCommand: createCmd("EnableKeyCommand"),
  UpdateKeyDescriptionCommand: createCmd("UpdateKeyDescriptionCommand"),
  EnableKeyRotationCommand: createCmd("EnableKeyRotationCommand"),
  DisableKeyRotationCommand: createCmd("DisableKeyRotationCommand"),
  GetKeyRotationStatusCommand: createCmd("GetKeyRotationStatusCommand"),
  ListAliasesCommand: createCmd("ListAliasesCommand"),
  CreateAliasCommand: createCmd("CreateAliasCommand"),
  DeleteAliasCommand: createCmd("DeleteAliasCommand"),
  ListGrantsCommand: createCmd("ListGrantsCommand"),
  CreateGrantCommand: createCmd("CreateGrantCommand"),
  RevokeGrantCommand: createCmd("RevokeGrantCommand"),
  RetireGrantCommand: createCmd("RetireGrantCommand"),
  EncryptCommand: createCmd("EncryptCommand"),
  DecryptCommand: createCmd("DecryptCommand"),
  ReEncryptCommand: createCmd("ReEncryptCommand"),
  GenerateDataKeyCommand: createCmd("GenerateDataKeyCommand"),
  GenerateRandomCommand: createCmd("GenerateRandomCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
  ListResourceTagsCommand: createCmd("ListResourceTagsCommand"),
  GetKeyPolicyCommand: createCmd("GetKeyPolicyCommand"),
  GetPublicKeyCommand: createCmd("GetPublicKeyCommand"),
}));

vi.mock("../../clients/aws", () => ({
  getAwsConfig: () => ({
    endpoint: "http://localhost:4566",
    region: "us-east-1",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  }),
}));

import router from "./kms";

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

describe("KMS Routes", () => {
  describe("Keys", () => {
    it("GET /keys — lists keys", async () => {
      mockSend
        .mockResolvedValueOnce({ Keys: [{ KeyId: "1234-abcd", KeyArn: "arn:aws:kms:us-east-1::key/1234-abcd" }] })
        .mockResolvedValueOnce({ KeyMetadata: { KeyId: "1234-abcd", KeyArn: "arn:aws:kms:us-east-1::key/1234-abcd", Description: "My key", Enabled: true, KeyState: "Enabled", KeyUsage: "ENCRYPT_DECRYPT", KeySpec: "SYMMETRIC_DEFAULT", Origin: "AWS_KMS", CustomerMasterKeySpec: "SYMMETRIC_DEFAULT", CreationDate: new Date("2025-01-01") } });
      const res = await get("/keys");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.keys[0].keyId).toBe("1234-abcd");
      expect(body.keys[0].description).toBe("My key");
    });

    it("GET /keys — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ Keys: [] });
      const res = await get("/keys");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /keys/:id — returns key detail with tags, aliases, grants, rotation", async () => {
      mockSend
        .mockResolvedValueOnce({ KeyMetadata: { KeyId: "1234-abcd", Description: "My key", Enabled: true, KeyState: "Enabled", KeyUsage: "ENCRYPT_DECRYPT", KeySpec: "SYMMETRIC_DEFAULT", CustomerMasterKeySpec: "SYMMETRIC_DEFAULT", Origin: "AWS_KMS", CreationDate: new Date("2025-01-01") } })
        .mockResolvedValueOnce({ Tags: [{ TagKey: "env", TagValue: "prod" }] })
        .mockResolvedValueOnce({ Aliases: [{ AliasName: "alias/my-key", TargetKeyId: "1234-abcd", CreationDate: new Date("2025-01-01") }] })
        .mockResolvedValueOnce({ Grants: [{ GrantId: "grant-1", GranteePrincipal: "user", Operations: ["Encrypt"] }] })
        .mockResolvedValueOnce({ KeyRotationEnabled: true });
      const res = await get("/keys/1234-abcd");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.key.keyId).toBe("1234-abcd");
      expect(body.tags.env).toBe("prod");
      expect(body.aliases).toHaveLength(1);
      expect(body.aliases[0].name).toBe("alias/my-key");
      expect(body.grants).toHaveLength(1);
      expect(body.rotationEnabled).toBe(true);
    });

    it("GET /keys/:id — returns automaticRotationEnabled as boolean", async () => {
      mockSend
        .mockResolvedValueOnce({
          KeyMetadata: {
            KeyId: "key-1",
            AutomaticRotationEnabled: true,
            KeyState: "Enabled",
            KeyManager: "CUSTOMER",
            Origin: "AWS_KMS",
          },
        })
        .mockResolvedValueOnce({ Tags: [] })
        .mockResolvedValueOnce({ Aliases: [] })
        .mockResolvedValueOnce({ Grants: [] })
        .mockResolvedValueOnce({ KeyRotationEnabled: true });
      const res = await get("/keys/key-1");
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.key.automaticRotationEnabled).toBe(true);
      expect(typeof data.key.automaticRotationEnabled).toBe("boolean");
    });

    it("POST /keys — creates a key", async () => {
      mockSend.mockResolvedValueOnce({ KeyMetadata: { KeyId: "new-key", Arn: "arn:..." } });
      const res = await post("/keys", { description: "Test key" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.keyId).toBe("new-key");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateKeyCommand");
    });

    it("POST /keys/:id/schedule-deletion — schedules key deletion", async () => {
      mockSend.mockResolvedValueOnce({ DeletionDate: new Date("2025-02-01") });
      const res = await post("/keys/1234-abcd/schedule-deletion", { pendingWindowInDays: 7 });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.scheduled).toBe(true);
      expect(mockSend.mock.calls[0][0].PendingWindowInDays).toBe(7);
    });

    it("POST /keys/:id/cancel-deletion — cancels deletion", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/keys/1234-abcd/cancel-deletion");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.cancelled).toBe(true);
    });

    it("POST /keys/:id/enable — enables a key", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/keys/1234-abcd/enable");
      const body = await res.json();
      expect(body.enabled).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("EnableKeyCommand");
    });

    it("POST /keys/:id/disable — disables a key", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/keys/1234-abcd/disable");
      const body = await res.json();
      expect(body.disabled).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DisableKeyCommand");
    });

    it("POST /keys/:id/enable-rotation — enables rotation", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/keys/1234-abcd/enable-rotation");
      const body = await res.json();
      expect(body.rotationEnabled).toBe(true);
    });

    it("POST /keys/:id/disable-rotation — disables rotation", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/keys/1234-abcd/disable-rotation");
      const body = await res.json();
      expect(body.rotationEnabled).toBe(false);
    });

    it("PUT /keys/:id/description — updates description", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/keys/1234-abcd/description", { description: "New desc" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
    });

    it("GET /keys/:id/public-key — gets public key", async () => {
      mockSend.mockResolvedValueOnce({
        KeyId: "1234-abcd",
        PublicKey: new Uint8Array([1, 2, 3]),
        KeySpec: "RSA_2048",
        KeyUsage: "ENCRYPT_DECRYPT",
        EncryptionAlgorithms: ["RSAES_OAEP_SHA_256"],
        SigningAlgorithms: [],
      });
      const res = await get("/keys/1234-abcd/public-key");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.keyId).toBe("1234-abcd");
      expect(body.keySpec).toBe("RSA_2048");
    });
  });

  describe("Encrypt / Decrypt", () => {
    it("POST /keys/:id/encrypt — encrypts data", async () => {
      mockSend.mockResolvedValueOnce({
        CiphertextBlob: new Uint8Array([1, 2, 3]),
        KeyId: "1234-abcd",
        EncryptionAlgorithm: "SYMMETRIC_DEFAULT",
      });
      const res = await post("/keys/1234-abcd/encrypt", { plaintext: Buffer.from("hello").toString("base64") });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ciphertextBlob).toBeTruthy();
    });

    it("POST /decrypt — decrypts data", async () => {
      mockSend.mockResolvedValueOnce({
        Plaintext: new Uint8Array([104, 101, 108, 108, 111]),
        KeyId: "1234-abcd",
        EncryptionAlgorithm: "SYMMETRIC_DEFAULT",
      });
      const res = await post("/decrypt", { ciphertextBlob: Buffer.from("encrypted").toString("base64") });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.plaintext).toBeTruthy();
    });

    it("POST /keys/:id/data-key — generates data key", async () => {
      mockSend.mockResolvedValueOnce({
        Plaintext: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
        CiphertextBlob: new Uint8Array([9, 10]),
        KeyId: "1234-abcd",
      });
      const res = await post("/keys/1234-abcd/data-key", { keySpec: "AES_256" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.plaintext).toBeTruthy();
      expect(body.ciphertextBlob).toBeTruthy();
    });

    it("POST /random — generates random bytes", async () => {
      mockSend.mockResolvedValueOnce({ Plaintext: new Uint8Array([1, 2, 3, 4]) });
      const res = await post("/random", { numberOfBytes: 4 });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.plaintext).toBeTruthy();
    });
  });

  describe("Aliases", () => {
    it("GET /aliases — lists aliases", async () => {
      mockSend.mockResolvedValueOnce({ Aliases: [{ AliasName: "alias/my-key", TargetKeyId: "1234-abcd", CreationDate: new Date("2025-01-01") }] });
      const res = await get("/aliases");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.aliases[0].name).toBe("alias/my-key");
    });

    it("POST /aliases — creates an alias", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/aliases", { aliasName: "my-key", targetKeyId: "1234-abcd" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(mockSend.mock.calls[0][0].AliasName).toBe("alias/my-key");
    });

    it("POST /aliases — creates an alias with alias/ prefix", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/aliases", { aliasName: "alias/my-key-2", targetKeyId: "5678-efgh" });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].AliasName).toBe("alias/my-key-2");
    });

    it("DELETE /aliases/:name — deletes an alias without alias/ prefix", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/aliases/my-key");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].AliasName).toBe("alias/my-key");
    });

    it("DELETE /aliases/:name — deletes an alias with alias/ prefix (URL-encoded)", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/aliases/alias%2Fmy-key");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].AliasName).toBe("alias/my-key");
    });
  });

  describe("Grants", () => {
    it("DELETE /keys/:keyId/grants/:grantId — revokes a grant", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/keys/1234-abcd/grants/grant-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.revoked).toBe(true);
      expect(mockSend.mock.calls[0][0].GrantId).toBe("grant-1");
    });

    it("POST /keys/:keyId/grants/retire — retires a grant", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/keys/1234-abcd/grants/retire", { grantId: "grant-2" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.retired).toBe(true);
    });
  });

  describe("Tags", () => {
    it("POST /keys/:id/tags — adds tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/keys/1234-abcd/tags", { tags: [{ key: "env", value: "prod" }] });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tagged).toBe(true);
    });

    it("DELETE /keys/:id/tags — removes tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/keys/1234-abcd/tags?keys=env,project");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.untagged).toBe(true);
      expect(mockSend.mock.calls[0][0].TagKeys).toEqual(["env", "project"]);
    });
  });

  describe("Random", () => {
    it("POST /random — generates random bytes with defaults", async () => {
      mockSend.mockResolvedValueOnce({ Plaintext: new Uint8Array([1, 2, 3, 4]) });
      const res = await post("/random", {});
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.plaintext).toBeTruthy();
      expect(mockSend.mock.calls[0][0].NumberOfBytes).toBe(32);
    });
  });
});
