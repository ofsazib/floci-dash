import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockSSM = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-ssm", () => ({
  SSMClient: mockSSM,
  DescribeParametersCommand: createCmd("DescribeParametersCommand"),
  GetParameterCommand: createCmd("GetParameterCommand"),
  GetParameterHistoryCommand: createCmd("GetParameterHistoryCommand"),
  PutParameterCommand: createCmd("PutParameterCommand"),
  DeleteParameterCommand: createCmd("DeleteParameterCommand"),
  AddTagsToResourceCommand: createCmd("AddTagsToResourceCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  RemoveTagsFromResourceCommand: createCmd("RemoveTagsFromResourceCommand"),
}));

vi.mock("../../clients/aws", () => ({
  getAwsConfig: () => ({
    endpoint: "http://localhost:4566",
    region: "us-east-1",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  }),
}));

import router from "./ssm";

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

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

// ── Parameters ───────────────────────────────────────────

describe("SSM routes — Parameters", () => {
  it("GET /parameters — returns list", async () => {
    mockSend.mockResolvedValueOnce({
      Parameters: [{ Name: "/app/config", Type: "String", Version: 1 }],
    });
    const res = await get("/parameters");
    const json = await res.json();
    expect(json.parameters).toHaveLength(1);
    expect(json.total).toBe(1);
  });

  it("GET /parameters — returns empty when none", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/parameters");
    const json = await res.json();
    expect(json.parameters).toEqual([]);
    expect(json.total).toBe(0);
  });

  it("GET /parameters/:name — returns parameter with decryption", async () => {
    mockSend.mockResolvedValueOnce({
      Parameter: { Name: "/app/key", Value: "secret", Type: "SecureString" },
    });
    const res = await get("/parameters/%2Fapp%2Fkey");
    const json = await res.json();
    expect(json.parameter.Name).toBe("/app/key");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "GetParameterCommand",
        Name: "/app/key",
        WithDecryption: true,
      })
    );
  });

  it("GET /parameters/:name — returns null when not found", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/parameters/nonexistent");
    const json = await res.json();
    expect(json.parameter).toBeNull();
  });

  it("POST /parameters — creates parameter", async () => {
    mockSend.mockResolvedValueOnce({ Version: 1 });
    const res = await post("/parameters", {
      name: "/app/config",
      value: "my-value",
      type: "String",
      description: "test",
    });
    const json = await res.json();
    expect(json.version).toBe(1);
    expect(res.status).toBe(201);
  });

  it("POST /parameters — defaults type to String", async () => {
    mockSend.mockResolvedValueOnce({ Version: 1 });
    await post("/parameters", { name: "/app/x", value: "y" });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "PutParameterCommand",
        Type: "String",
      })
    );
  });

  it("DELETE /parameters/:name — deletes parameter", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/parameters/%2Fapp%2Fconfig");
    const json = await res.json();
    expect(json.deleted).toBe(true);
  });
});

// ── Parameter History ────────────────────────────────────

describe("SSM routes — Parameter History", () => {
  it("GET /parameters/:name/history — returns history", async () => {
    mockSend.mockResolvedValueOnce({
      Parameters: [
        { Name: "/app/config", Version: 1, Value: "v1" },
        { Name: "/app/config", Version: 2, Value: "v2" },
      ],
    });
    const res = await get("/parameters/%2Fapp%2Fconfig/history");
    const json = await res.json();
    expect(json.history).toHaveLength(2);
    expect(json.total).toBe(2);
  });

  it("GET /parameters/:name/history — returns empty when none", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/parameters/%2Fapp%2Fconfig/history");
    const json = await res.json();
    expect(json.history).toEqual([]);
    expect(json.total).toBe(0);
  });
});

// ── Tags ─────────────────────────────────────────────────

describe("SSM routes — Tags", () => {
  it("GET /tags — returns tags", async () => {
    mockSend.mockResolvedValueOnce({
      TagList: [{ Key: "env", Value: "prod" }],
    });
    const res = await get("/tags?resourceId=/app/config");
    const json = await res.json();
    expect(json.tags).toHaveLength(1);
  });

  it("GET /tags — returns empty when none", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/tags?resourceId=/app/config");
    const json = await res.json();
    expect(json.tags).toEqual([]);
  });

  it("GET /tags — 400 when no resourceId", async () => {
    const res = await get("/tags");
    expect(res.status).toBe(400);
  });

  it("POST /tags — tags resource", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/tags", {
      resourceId: "/app/config",
      tags: [{ Key: "env", Value: "prod" }],
    });
    const json = await res.json();
    expect(json.tagged).toBe(true);
  });

  it("DELETE /tags — untags resource", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/tags?resourceId=/app/config&tagKeys=env,team");
    const json = await res.json();
    expect(json.untagged).toBe(true);
  });

  it("DELETE /tags — 400 when no resourceId", async () => {
    const res = await del("/tags?tagKeys=env");
    expect(res.status).toBe(400);
  });
});
