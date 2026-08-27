import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-s3tables", () => ({
  S3TablesClient: vi.fn(function () {
    return { send: mockSend };
  }),
  ListTableBucketsCommand: createCmd("ListTableBucketsCommand"),
  CreateTableBucketCommand: createCmd("CreateTableBucketCommand"),
  GetTableBucketCommand: createCmd("GetTableBucketCommand"),
  DeleteTableBucketCommand: createCmd("DeleteTableBucketCommand"),
  ListNamespacesCommand: createCmd("ListNamespacesCommand"),
  CreateNamespaceCommand: createCmd("CreateNamespaceCommand"),
  DeleteNamespaceCommand: createCmd("DeleteNamespaceCommand"),
  ListTablesCommand: createCmd("ListTablesCommand"),
  CreateTableCommand: createCmd("CreateTableCommand"),
  DeleteTableCommand: createCmd("DeleteTableCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./s3tables";

const ARN = encodeURIComponent(
  "arn:aws:s3tables:us-east-1:123:bucket/my-bucket"
);

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
  mockSend.mockReset();
});

describe("S3 Tables routes", () => {
  it("lists table buckets with name derived from ARN", async () => {
    mockSend.mockResolvedValueOnce({
      tableBuckets: [
        { tableBucketArn: "arn:aws:s3tables:us-east-1:123:bucket/alpha", createdAt: 111 },
      ],
      continuationToken: "tok",
    });
    const res = await get("/buckets");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.buckets[0]).toEqual({
      arn: "arn:aws:s3tables:us-east-1:123:bucket/alpha",
      name: "alpha",
      createdAt: "111",
    });
    expect(json.total).toBe(1);
    expect(json.nextToken).toBe("tok");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListTableBucketsCommand");
  });

  it("defaults bucket fields when sparse and empty list", async () => {
    mockSend.mockResolvedValueOnce({ tableBuckets: [{}] });
    const res = await get("/buckets");
    const json = await res.json();
    expect(json.buckets[0]).toEqual({ arn: null, name: "", createdAt: "" });

    mockSend.mockReset();
    mockSend.mockResolvedValueOnce({});
    const res2 = await get("/buckets");
    expect(await res2.json()).toEqual({ buckets: [], total: 0, nextToken: null });
  });

  it("creates a table bucket", async () => {
    mockSend.mockResolvedValueOnce({ arn: "arn:aws:s3tables:::bucket/new" });
    const res = await post("/buckets", { name: "new" });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ arn: "arn:aws:s3tables:::bucket/new" });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "CreateTableBucketCommand",
      name: "new",
    });
  });

  it("rejects bucket create without name", async () => {
    const res = await post("/buckets", {});
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "name is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("gets a table bucket by encoded ARN", async () => {
    mockSend.mockResolvedValueOnce({ arn: "arn:aws:s3tables:::bucket/x" });
    const res = await get(`/buckets/${ARN}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ bucket: "arn:aws:s3tables:::bucket/x" });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "GetTableBucketCommand",
      tableBucketARN: "arn:aws:s3tables:us-east-1:123:bucket/my-bucket",
    });
  });

  it("returns null bucket when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/buckets/${ARN}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ bucket: null });
  });

  it("deletes a table bucket", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del(`/buckets/${ARN}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: true });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "DeleteTableBucketCommand",
      tableBucketARN: "arn:aws:s3tables:us-east-1:123:bucket/my-bucket",
    });
  });

  it("lists namespaces for a bucket", async () => {
    mockSend.mockResolvedValueOnce({
      namespaces: [{ namespace: ["my-ns"] }],
    });
    const res = await get(`/namespaces/${ARN}`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "ListNamespacesCommand",
      tableBucketARN: "arn:aws:s3tables:us-east-1:123:bucket/my-bucket",
    });
  });

  it("returns empty namespaces", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/namespaces/${ARN}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ namespaces: [], total: 0 });
  });

  it("creates a namespace", async () => {
    mockSend.mockResolvedValueOnce({
      tableBucketARN: "arn:x",
      namespace: ["ns-new"],
    });
    const res = await post(`/namespaces/${ARN}`, { namespace: "ns-new" });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ namespace: ["ns-new"] });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "CreateNamespaceCommand",
      namespace: ["ns-new"],
    });
  });

  it("defaults namespace response when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post(`/namespaces/${ARN}`, { namespace: "ns-x" });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ namespace: ["ns-x"] });
  });

  it("rejects namespace create without name", async () => {
    const res = await post(`/namespaces/${ARN}`, {});
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "namespace is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("deletes a namespace", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del(`/namespaces/${ARN}/my-ns`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: true });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "DeleteNamespaceCommand",
      namespace: "my-ns",
    });
  });

  it("lists tables in a namespace", async () => {
    mockSend.mockResolvedValueOnce({
      tables: [
        {
          name: "t1",
          namespace: ["a", "my-ns"],
          tableType: "ICEBERG",
          createdAt: 222,
        },
      ],
    });
    const res = await get(`/tables/${ARN}/my-ns`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.tables[0]).toEqual({
      name: "t1",
      namespace: "my-ns",
      type: "ICEBERG",
      createdAt: "222",
    });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "ListTablesCommand",
      namespace: "my-ns",
    });
  });

  it("defaults table rows when sparse and empty list", async () => {
    mockSend.mockResolvedValueOnce({ tables: [{}] });
    const res = await get(`/tables/${ARN}/my-ns`);
    const json = await res.json();
    expect(json.tables[0]).toEqual({
      name: null,
      namespace: null,
      type: null,
      createdAt: "",
    });

    mockSend.mockReset();
    mockSend.mockResolvedValueOnce({});
    const res2 = await get(`/tables/${ARN}/my-ns`);
    expect(await res2.json()).toEqual({ tables: [], total: 0 });
  });

  it("creates a table", async () => {
    mockSend.mockResolvedValueOnce({ tableARN: "arn:t", versionToken: "v1" });
    const res = await post(`/tables/${ARN}/my-ns`, { name: "t1", format: "ICEBERG" });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ tableArn: "arn:t", versionToken: "v1" });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "CreateTableCommand",
      namespace: "my-ns",
      name: "t1",
      format: "ICEBERG",
    });
  });

  it("defaults version token when absent", async () => {
    mockSend.mockResolvedValueOnce({ tableARN: "arn:t" });
    const res = await post(`/tables/${ARN}/my-ns`, { name: "t2", format: "ICEBERG" });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ tableArn: "arn:t", versionToken: null });
  });

  it("rejects table create without name", async () => {
    const res = await post(`/tables/${ARN}/my-ns`, { format: "ICEBERG" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "name is required" });
  });

  it("rejects table create without format", async () => {
    const res = await post(`/tables/${ARN}/my-ns`, { name: "t1" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "format is required" });
  });

  it("deletes a table", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del(`/tables/${ARN}/my-ns/t1`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: true });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "DeleteTableCommand",
      name: "t1",
    });
  });
});
