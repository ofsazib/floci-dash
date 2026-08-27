import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-guardduty", () => ({
  GuardDutyClient: vi.fn(function () {
    return { send: mockSend };
  }),
  ListDetectorsCommand: createCmd("ListDetectorsCommand"),
  GetDetectorCommand: createCmd("GetDetectorCommand"),
  CreateDetectorCommand: createCmd("CreateDetectorCommand"),
  UpdateDetectorCommand: createCmd("UpdateDetectorCommand"),
  DeleteDetectorCommand: createCmd("DeleteDetectorCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./guardduty";

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

describe("GuardDuty routes", () => {
  it("lists detectors", async () => {
    mockSend.mockResolvedValueOnce({
      DetectorIds: ["det-1", "det-2"],
      NextToken: "tok",
    });
    const res = await get("/detectors");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      detectorIds: ["det-1", "det-2"],
      total: 2,
      nextToken: "tok",
    });
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListDetectorsCommand");
  });

  it("returns empty detector list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/detectors");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ detectorIds: [], total: 0, nextToken: null });
  });

  it("gets detector detail", async () => {
    mockSend.mockResolvedValueOnce({
      Status: "ENABLED",
      CreatedAt: 111,
      FindingPublishingFrequency: "SIX_HOURS",
      ServiceRole: "arn:role",
      Tags: { env: "test" },
    });
    const res = await get("/detectors/det-1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      detector: {
        status: "ENABLED",
        createdAt: "111",
        findingPublishingFrequency: "SIX_HOURS",
        serviceRole: "arn:role",
        tags: { env: "test" },
      },
    });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "GetDetectorCommand",
      DetectorId: "det-1",
    });
  });

  it("defaults detector detail fields when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/detectors/det-9");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      detector: {
        status: null,
        createdAt: "",
        findingPublishingFrequency: null,
        serviceRole: null,
        tags: {},
      },
    });
  });

  it("creates a detector enabled", async () => {
    mockSend.mockResolvedValueOnce({ DetectorId: "det-new" });
    const res = await post("/detectors", { enable: true, frequency: "SIX_HOURS" });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ detectorId: "det-new" });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "CreateDetectorCommand",
      Enable: true,
      FindingPublishingFrequency: "SIX_HOURS",
    });
  });

  it("creates a detector disabled without frequency", async () => {
    mockSend.mockResolvedValueOnce({ DetectorId: "det-off" });
    const res = await post("/detectors", { enable: false });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "CreateDetectorCommand",
      Enable: false,
      FindingPublishingFrequency: undefined,
    });
  });

  it("rejects create without enable flag", async () => {
    const res = await post("/detectors", {});
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "enable is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("updates a detector", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await patchReq("/detectors/det-1", { enable: false, frequency: "ONE_HOUR" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ updated: true });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "UpdateDetectorCommand",
      DetectorId: "det-1",
      Enable: false,
      FindingPublishingFrequency: "ONE_HOUR",
    });
  });

  it("deletes a detector", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/detectors/det-1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: true });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "DeleteDetectorCommand",
      DetectorId: "det-1",
    });
  });
});
