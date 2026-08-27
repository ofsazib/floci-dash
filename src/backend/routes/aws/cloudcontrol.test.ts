import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-cloudcontrol", () => ({
  CloudControlClient: vi.fn(function () {
    return { send: mockSend };
  }),
  ListResourcesCommand: createCmd("ListResourcesCommand"),
  GetResourceCommand: createCmd("GetResourceCommand"),
  CreateResourceCommand: createCmd("CreateResourceCommand"),
  DeleteResourceCommand: createCmd("DeleteResourceCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./cloudcontrol";

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

const TYPE = encodeURIComponent("AWS::S3::Bucket");
const ID = encodeURIComponent("my-bucket");

beforeEach(() => {
  mockSend.mockReset();
});

describe("CloudControl routes", () => {
  it("lists resources of a type", async () => {
    mockSend.mockResolvedValueOnce({
      ResourceDescriptions: [{ Identifier: "b-1" }, { Identifier: "b-2" }],
      NextToken: "tok",
    });
    const res = await post("/resources/list", {
      typeName: "AWS::S3::Bucket",
      nextToken: "t0",
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      resourceDescriptions: [{ identifier: "b-1" }, { identifier: "b-2" }],
      typeName: "AWS::S3::Bucket",
      nextToken: "tok",
    });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "ListResourcesCommand",
      TypeName: "AWS::S3::Bucket",
      NextToken: "t0",
    });
  });

  it("returns empty resource list without token", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/resources/list", { typeName: "AWS::S3::Bucket" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      resourceDescriptions: [],
      typeName: "AWS::S3::Bucket",
      nextToken: null,
    });
  });

  it("defaults sparse identifiers to null", async () => {
    mockSend.mockResolvedValueOnce({ ResourceDescriptions: [{}] });
    const res = await post("/resources/list", { typeName: "AWS::S3::Bucket" });
    expect((await res.json()).resourceDescriptions).toEqual([{ identifier: null }]);
  });

  it("rejects list without typeName", async () => {
    const res = await post("/resources/list", {});
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "typeName is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("gets a resource with decoded params", async () => {
    mockSend.mockResolvedValueOnce({
      ResourceDescription: { Identifier: "my-bucket", Properties: '{"Name":"my-bucket"}' },
    });
    const res = await get(`/resources/${TYPE}/${ID}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      resourceDescription: {
        identifier: "my-bucket",
        properties: '{"Name":"my-bucket"}',
      },
    });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "GetResourceCommand",
      TypeName: "AWS::S3::Bucket",
      Identifier: "my-bucket",
    });
  });

  it("returns null resource when absent and defaults sparse fields", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/resources/${TYPE}/${ID}`);
    expect(await res.json()).toEqual({ resourceDescription: null });

    mockSend.mockReset();
    mockSend.mockResolvedValueOnce({ ResourceDescription: {} });
    const res3 = await get(`/resources/${TYPE}/${ID}`);
    expect(await res3.json()).toEqual({
      resourceDescription: { identifier: null, properties: null },
    });
  });

  it("creates a resource with object desired state", async () => {
    mockSend.mockResolvedValueOnce({
      ProgressEvent: {
        TypeName: "AWS::S3::Bucket",
        Identifier: "new-bucket",
        RequestToken: "tok",
        OperationStatus: "IN_PROGRESS",
      },
    });
    const res = await post("/resources/create", {
      typeName: "AWS::S3::Bucket",
      desiredState: { BucketName: "new-bucket" },
    });
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({
      typeName: "AWS::S3::Bucket",
      identifier: "new-bucket",
      requestToken: "tok",
      status: "IN_PROGRESS",
    });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "CreateResourceCommand",
      DesiredState: '{"BucketName":"new-bucket"}',
    });
  });

  it("creates a resource with string desired state", async () => {
    mockSend.mockResolvedValueOnce({
      ProgressEvent: { OperationStatus: "SUCCESS" },
    });
    const res = await post("/resources/create", {
      typeName: "AWS::S3::Bucket",
      desiredState: '{"BucketName":"x"}',
    });
    expect(res.status).toBe(202);
    expect(mockSend.mock.calls[0][0].DesiredState).toBe('{"BucketName":"x"}');
  });

  it("defaults sparse progress event on create", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/resources/create", {
      typeName: "AWS::S3::Bucket",
      desiredState: {},
    });
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({
      typeName: null,
      identifier: null,
      requestToken: null,
      status: null,
    });
  });

  it("rejects create without typeName", async () => {
    const res = await post("/resources/create", { desiredState: {} });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "typeName is required" });
  });

  it("rejects create without desiredState", async () => {
    const res = await post("/resources/create", { typeName: "T" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "desiredState is required" });
  });

  it("deletes a resource with decoded params", async () => {
    mockSend.mockResolvedValueOnce({
      ProgressEvent: {
        TypeName: "AWS::S3::Bucket",
        Identifier: "my-bucket",
        OperationStatus: "IN_PROGRESS",
      },
    });
    const res = await del(`/resources/${TYPE}/${ID}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      typeName: "AWS::S3::Bucket",
      identifier: "my-bucket",
      status: "IN_PROGRESS",
    });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "DeleteResourceCommand",
      Identifier: "my-bucket",
    });
  });

  it("defaults sparse progress event on delete", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del(`/resources/${TYPE}/${ID}`);
    expect(await res.json()).toEqual({
      typeName: null,
      identifier: null,
      status: null,
    });
  });
});
