import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-emr-serverless", () => ({
  EMRServerlessClient: vi.fn(function () {
    return { send: mockSend };
  }),
  ListApplicationsCommand: createCmd("ListApplicationsCommand"),
  GetApplicationCommand: createCmd("GetApplicationCommand"),
  CreateApplicationCommand: createCmd("CreateApplicationCommand"),
  UpdateApplicationCommand: createCmd("UpdateApplicationCommand"),
  DeleteApplicationCommand: createCmd("DeleteApplicationCommand"),
  StartApplicationCommand: createCmd("StartApplicationCommand"),
  StopApplicationCommand: createCmd("StopApplicationCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./emrserverless";

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

async function put(path: string, body?: any) {
  return router.request(path, {
    method: "PUT",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function del(path: string) {
  return router.request(path, { method: "DELETE" });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EMR Serverless Routes", () => {
  it("GET /applications — lists with nextToken", async () => {
    mockSend.mockResolvedValueOnce({
      applications: [{ id: "app-1", name: "my-app", state: "CREATED" }],
      nextToken: "tok-1",
    });
    const res = await get("/applications");
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.nextToken).toBe("tok-1");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListApplicationsCommand");
  });

  it("GET /applications — empty with null nextToken", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/applications");
    const body = await res.json();
    expect(body).toEqual({ applications: [], nextToken: null, total: 0 });
  });

  it("GET /applications/:id — maps detail fields", async () => {
    mockSend.mockResolvedValueOnce({
      application: {
        id: "app-1",
        arn: "arn:app-1",
        name: "my-app",
        state: "STARTED",
        releaseLabel: "emr-7.1.0",
        type: "SPARK",
        createdAt: new Date(0),
        updatedAt: new Date(0),
        autoStartConfiguration: { enabled: true },
        autoStopConfiguration: { enabled: false },
      },
    });
    const res = await get("/applications/app-1");
    const body = await res.json();
    expect(body.application).toEqual({
      id: "app-1",
      arn: "arn:app-1",
      name: "my-app",
      status: "STARTED",
      releaseLabel: "emr-7.1.0",
      type: "SPARK",
      createdAt: "1970-01-01T00:00:00.000Z",
      updatedAt: "1970-01-01T00:00:00.000Z",
      autoStart: true,
      autoStop: false,
    });
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetApplicationCommand");
  });

  it("GET /applications/:id — null on sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/applications/none");
    expect((await res.json()).application).toBeNull();
  });

  it("POST /applications — creates with 400 guards", async () => {
    mockSend.mockResolvedValueOnce({ applicationId: "app-1", arn: "arn:app-1" });
    const res = await post("/applications", {
      name: "my-app",
      releaseLabel: "emr-7.1.0",
      type: "SPARK",
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.applicationId).toBe("app-1");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("CreateApplicationCommand");
    expect(cmd.type).toBe("SPARK");

    expect((await post("/applications", {})).status).toBe(400);
    expect((await post("/applications", { name: "a" })).status).toBe(400);
    expect((await post("/applications", { name: "a", releaseLabel: "r" })).status).toBe(400);
  });

  it("PUT /applications/:id — toggles auto configs", async () => {
    mockSend.mockResolvedValueOnce({ application: { id: "app-1" } });
    const res = await put("/applications/app-1", { autoStart: true, autoStop: false });
    const body = await res.json();
    expect(body.application.id).toBe("app-1");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("UpdateApplicationCommand");
    expect(cmd.autoStartConfiguration.enabled).toBe(true);
    expect(cmd.autoStopConfiguration.enabled).toBe(false);
  });

  it("PUT /applications/:id — omits configs when absent + null sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    await put("/applications/app-1", {});
    expect(mockSend.mock.calls[0][0].autoStartConfiguration).toBeUndefined();
    expect(mockSend.mock.calls[0][0].autoStopConfiguration).toBeUndefined();

    mockSend.mockResolvedValueOnce({});
    const res = await put("/applications/app-1", { autoStart: true });
    expect((await res.json()).application).toBeNull();
  });

  it("DELETE /applications/:id — deletes", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/applications/app-1");
    expect((await res.json()).deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteApplicationCommand");
  });

  it("POST /applications/:id/start — starts", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/applications/app-1/start");
    expect((await res.json()).started).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("StartApplicationCommand");
  });

  it("POST /applications/:id/stop — stops", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/applications/app-1/stop");
    expect((await res.json()).stopped).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("StopApplicationCommand");
  });
});
