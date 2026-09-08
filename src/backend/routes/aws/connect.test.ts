import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSend, mocks } = vi.hoisted(() => {
  const mockSend = vi.fn();
  const createCmd = (name: string) =>
    vi.fn(function (this: any, args?: any) {
      const cmd: any = { ...args, __cmdName: name };
      return cmd;
    });
  return {
    mockSend,
    mocks: {
      ConnectClient: vi.fn(function (this: any) {
        return { send: mockSend };
      }),
      CreateInstanceCommand: createCmd("CreateInstanceCommand"),
      ListInstancesCommand: createCmd("ListInstancesCommand"),
      DescribeInstanceCommand: createCmd("DescribeInstanceCommand"),
      DeleteInstanceCommand: createCmd("DeleteInstanceCommand"),
      UpdateInstanceAttributeCommand: createCmd("UpdateInstanceAttributeCommand"),
      DescribeInstanceAttributeCommand: createCmd("DescribeInstanceAttributeCommand"),
      ListInstanceAttributesCommand: createCmd("ListInstanceAttributesCommand"),
      AssociateInstanceStorageConfigCommand: createCmd("AssociateInstanceStorageConfigCommand"),
      DescribeInstanceStorageConfigCommand: createCmd("DescribeInstanceStorageConfigCommand"),
      UpdateInstanceStorageConfigCommand: createCmd("UpdateInstanceStorageConfigCommand"),
      DisassociateInstanceStorageConfigCommand: createCmd("DisassociateInstanceStorageConfigCommand"),
      ListInstanceStorageConfigsCommand: createCmd("ListInstanceStorageConfigsCommand"),
    },
  };
});

vi.mock("@aws-sdk/client-connect", () => mocks);

import router from "./connect";

const get = (path: string) => router.request(path);
const post = (path: string, body?: any) =>
  router.request(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
const put = (path: string, body?: any) =>
  router.request(path, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
const del = (path: string) => router.request(path, { method: "DELETE" });

const instanceSummary = {
  Id: "inst-1",
  Arn: "arn:aws:connect:us-east-1:123456789012:instance/inst-1",
  InstanceAlias: "my-connect",
  InstanceStatus: "ACTIVE",
};

beforeEach(() => {
  mockSend.mockReset();
});

describe("Connect — instances", () => {
  it("GET /instances — lists instance summaries", async () => {
    mockSend.mockResolvedValueOnce({ InstanceSummaryList: [instanceSummary] });
    const res = await get("/instances");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.instances).toHaveLength(1);
    expect(body.total).toBe(1);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("ListInstancesCommand");
  });

  it("GET /instances — falls back to empty when list undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/instances");
    const body = await res.json();
    expect(body.instances).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("POST /instances — creates an instance", async () => {
    mockSend.mockResolvedValueOnce({ Id: "inst-new", Arn: "arn:aws:connect:instance/inst-new" });
    const res = await post("/instances", {
      IdentityManagementType: "CONNECT_MANAGED",
      InstanceAlias: "new-connect",
      InboundCallsEnabled: true,
      OutboundCallsEnabled: false,
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("inst-new");
    expect(body.arn).toContain("inst-new");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("CreateInstanceCommand");
    expect(cmd.IdentityManagementType).toBe("CONNECT_MANAGED");
    expect(cmd.InstanceAlias).toBe("new-connect");
  });

  it("POST /instances — 400 when IdentityManagementType missing", async () => {
    const res = await post("/instances", { InstanceAlias: "x" });
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("GET /instances/:id — describes an instance", async () => {
    mockSend.mockResolvedValueOnce({
      Instance: { ...instanceSummary, Tags: { env: "dev" } },
    });
    const res = await get("/instances/inst-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.instance.Id).toBe("inst-1");
    expect(body.instance.Tags).toEqual({ env: "dev" });
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DescribeInstanceCommand");
    expect(cmd.InstanceId).toBe("inst-1");
  });

  it("DELETE /instances/:id — deletes an instance", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/instances/inst-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DeleteInstanceCommand");
    expect(cmd.InstanceId).toBe("inst-1");
  });
});

describe("Connect — attributes", () => {
  it("GET /instances/:id/attributes — lists attributes", async () => {
    mockSend.mockResolvedValueOnce({
      Attributes: [{ AttributeType: "INBOUND_CALLS", Value: "true" }],
    });
    const res = await get("/instances/inst-1/attributes");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.attributes).toHaveLength(1);
    expect(body.total).toBe(1);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("ListInstanceAttributesCommand");
  });

  it("GET /instances/:id/attributes — falls back to empty when undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/instances/inst-1/attributes");
    const body = await res.json();
    expect(body.attributes).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("GET /instances/:id/attribute/:type — describes one attribute", async () => {
    mockSend.mockResolvedValueOnce({ Attribute: { AttributeType: "INBOUND_CALLS", Value: "true" } });
    const res = await get("/instances/inst-1/attribute/INBOUND_CALLS");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.attribute.AttributeType).toBe("INBOUND_CALLS");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DescribeInstanceAttributeCommand");
    expect(cmd.AttributeType).toBe("INBOUND_CALLS");
  });

  it("PUT /instances/:id/attribute/:type — updates an attribute", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/instances/inst-1/attribute/INBOUND_CALLS", { Value: "true" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("UpdateInstanceAttributeCommand");
    expect(cmd.Value).toBe("true");
  });

  it("PUT /instances/:id/attribute/:type — 400 when Value missing", async () => {
    const res = await put("/instances/inst-1/attribute/INBOUND_CALLS", {});
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });
});

describe("Connect — storage configs", () => {
  const storageConfig = { StorageType: "S3", S3Config: { BucketName: "b", Prefix: "p" } };

  it("GET /instances/:id/storage-configs — lists configs", async () => {
    mockSend.mockResolvedValueOnce({ StorageConfigs: [storageConfig] });
    const res = await get("/instances/inst-1/storage-configs?resourceType=CHAT_TRANSCRIPTS");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.storageConfigs).toHaveLength(1);
    expect(body.total).toBe(1);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("ListInstanceStorageConfigsCommand");
    expect(cmd.ResourceType).toBe("CHAT_TRANSCRIPTS");
  });

  it("GET /instances/:id/storage-configs — falls back to empty when undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/instances/inst-1/storage-configs");
    const body = await res.json();
    expect(body.storageConfigs).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("POST /instances/:id/storage-configs — associates a config", async () => {
    mockSend.mockResolvedValueOnce({ AssociationId: "assoc-1" });
    const res = await post("/instances/inst-1/storage-configs", {
      ResourceType: "CHAT_TRANSCRIPTS",
      StorageConfig: storageConfig,
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.associationId).toBe("assoc-1");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("AssociateInstanceStorageConfigCommand");
    expect(cmd.ResourceType).toBe("CHAT_TRANSCRIPTS");
  });

  it("POST /instances/:id/storage-configs — 400 when params missing", async () => {
    const res = await post("/instances/inst-1/storage-configs", { ResourceType: "CHAT_TRANSCRIPTS" });
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("GET /instances/:id/storage-configs/:assocId — describes a config", async () => {
    mockSend.mockResolvedValueOnce({ StorageConfig: { ...storageConfig, AssociationId: "assoc-1" } });
    const res = await get("/instances/inst-1/storage-configs/assoc-1?resourceType=CHAT_TRANSCRIPTS");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.storageConfig.AssociationId).toBe("assoc-1");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DescribeInstanceStorageConfigCommand");
    expect(cmd.AssociationId).toBe("assoc-1");
  });

  it("PUT /instances/:id/storage-configs/:assocId — updates a config", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/instances/inst-1/storage-configs/assoc-1", {
      ResourceType: "CHAT_TRANSCRIPTS",
      StorageConfig: storageConfig,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("UpdateInstanceStorageConfigCommand");
  });

  it("PUT /instances/:id/storage-configs/:assocId — 400 when params missing", async () => {
    const res = await put("/instances/inst-1/storage-configs/assoc-1", { ResourceType: "X" });
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("DELETE /instances/:id/storage-configs/:assocId — disassociates a config", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/instances/inst-1/storage-configs/assoc-1?resourceType=CHAT_TRANSCRIPTS");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.disassociated).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DisassociateInstanceStorageConfigCommand");
    expect(cmd.AssociationId).toBe("assoc-1");
  });
});
