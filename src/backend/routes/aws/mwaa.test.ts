import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-mwaa", () => ({
  MWAAClient: vi.fn(function () {
    return { send: mockSend };
  }),
  ListEnvironmentsCommand: createCmd("ListEnvironmentsCommand"),
  GetEnvironmentCommand: createCmd("GetEnvironmentCommand"),
  CreateEnvironmentCommand: createCmd("CreateEnvironmentCommand"),
  UpdateEnvironmentCommand: createCmd("UpdateEnvironmentCommand"),
  DeleteEnvironmentCommand: createCmd("DeleteEnvironmentCommand"),
  CreateWebLoginTokenCommand: createCmd("CreateWebLoginTokenCommand"),
  CreateCliTokenCommand: createCmd("CreateCliTokenCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./mwaa";

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

async function patchReq(path: string, body?: any) {
  return router.request(path, {
    method: "PATCH",
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

describe("MWAA routes", () => {
  it("lists environments", async () => {
    mockSend.mockResolvedValueOnce({ Environments: ["env-a", "env-b"] });
    const res = await get("/environments");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      environments: ["env-a", "env-b"],
      total: 2,
    });
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListEnvironmentsCommand");
  });

  it("returns empty list when no environments", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/environments");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ environments: [], total: 0 });
  });

  it("gets environment detail", async () => {
    mockSend.mockResolvedValueOnce({
      Environment: {
        Name: "env-a",
        Arn: "arn:aws:airflow:us-east-1:123:environment/env-a",
        Status: "AVAILABLE",
        AirflowVersion: "2.10.1",
        EnvironmentClass: "ENV_TYPE_SMALL",
        SourceBucketArn: "arn:aws:s3:::bucket",
        ExecutionRoleArn: "arn:aws:iam::123:role/mwaa",
        CreatedAt: "2026-01-01T00:00:00Z",
        WebserverUrl: "https://example.com",
      },
    });
    const res = await get("/environments/env-a");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.environment.name).toBe("env-a");
    expect(json.environment.status).toBe("AVAILABLE");
    expect(json.environment.webserverUrl).toBe("https://example.com");
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "GetEnvironmentCommand",
      Name: "env-a",
    });
  });

  it("returns null environment when missing", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/environments/env-x");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ environment: null });
  });

  it("creates an environment", async () => {
    mockSend.mockResolvedValueOnce({ Arn: "arn:new" });
    const res = await post("/environments", {
      name: "env-a",
      sourceBucketArn: "arn:aws:s3:::bucket",
      executionRoleArn: "arn:aws:iam::123:role/mwaa",
      airflowVersion: "2.10.1",
      environmentClass: "ENV_TYPE_SMALL",
      dagS3Path: "dags/",
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ arn: "arn:new" });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "CreateEnvironmentCommand",
      Name: "env-a",
      DagS3Path: "dags/",
    });
  });

  it("defaults DagS3Path and NetworkConfiguration when omitted", async () => {
    mockSend.mockResolvedValueOnce({ Arn: "arn:def" });
    const res = await post("/environments", {
      name: "env-b",
      sourceBucketArn: "arn:aws:s3:::bucket",
      executionRoleArn: "arn:aws:iam::123:role/mwaa",
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ arn: "arn:def" });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "CreateEnvironmentCommand",
      Name: "env-b",
      DagS3Path: "dags/",
      NetworkConfiguration: {},
    });
  });

  it("rejects create without name", async () => {
    const res = await post("/environments", { sourceBucketArn: "b", executionRoleArn: "r" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "name is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejects create without sourceBucketArn", async () => {
    const res = await post("/environments", { name: "n", executionRoleArn: "r" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "sourceBucketArn is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejects create without executionRoleArn", async () => {
    const res = await post("/environments", { name: "n", sourceBucketArn: "b" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "executionRoleArn is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("updates an environment", async () => {
    mockSend.mockResolvedValueOnce({ Arn: "arn:upd" });
    const res = await patchReq("/environments/env-a", {
      airflowVersion: "2.10.2",
      environmentClass: "ENV_TYPE_MEDIUM_1VPU",
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ arn: "arn:upd" });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "UpdateEnvironmentCommand",
      Name: "env-a",
      AirflowVersion: "2.10.2",
    });
  });

  it("deletes an environment", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/environments/env-a");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: true });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "DeleteEnvironmentCommand",
      Name: "env-a",
    });
  });

  it("creates a web login token", async () => {
    mockSend.mockResolvedValueOnce({
      WebServerHostname: "https://host",
      WebToken: "tok",
    });
    const res = await post("/environments/env-a/webtoken");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ webServerHostname: "https://host", webToken: "tok" });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "CreateWebLoginTokenCommand",
      Name: "env-a",
    });
  });

  it("defaults web token fields when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/environments/env-a/webtoken");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ webServerHostname: null, webToken: null });
  });

  it("creates a CLI token", async () => {
    mockSend.mockResolvedValueOnce({ CliToken: "cli", WebServerHostname: "https://host" });
    const res = await post("/environments/env-a/clitoken");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ cliToken: "cli", webServerHostname: "https://host" });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "CreateCliTokenCommand",
      Name: "env-a",
    });
  });

  it("defaults CLI token fields when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/environments/env-a/clitoken");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ cliToken: null, webServerHostname: null });
  });
});
