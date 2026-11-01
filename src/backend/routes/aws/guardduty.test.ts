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
  ListMembersCommand: createCmd("ListMembersCommand"),
  CreateMembersCommand: createCmd("CreateMembersCommand"),
  DescribeOrganizationConfigurationCommand: createCmd("DescribeOrganizationConfigurationCommand"),
  UpdateOrganizationConfigurationCommand: createCmd("UpdateOrganizationConfigurationCommand"),
  EnableOrganizationAdminAccountCommand: createCmd("EnableOrganizationAdminAccountCommand"),
  DisableOrganizationAdminAccountCommand: createCmd("DisableOrganizationAdminAccountCommand"),
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

// ── Members / organization ─────────────────────────────────

describe("GuardDuty members and organization", () => {
  beforeEach(() => mockSend.mockReset());

  it("GET /detectors/:id/members — lists members", async () => {
    mockSend.mockResolvedValueOnce({
      Members: [{ AccountId: "111", Email: "a@b.c", MasterId: "m1", AdministratorId: "adm", RelationshipStatus: "Enabled", InvitedAt: "2025-01-01", DetectorId: "d2" }],
    });
    const res = await get("/detectors/d1/members");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.total).toBe(1);
    expect(body.members[0].accountId).toBe("111");
    expect(body.members[0].status).toBe("Enabled");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListMembersCommand");
  });

  it("GET /detectors/:id/members — empty when Members missing", async () => {
    mockSend.mockResolvedValueOnce({});
    const body = await (await get("/detectors/d1/members")).json();
    expect(body.members).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("POST /detectors/:id/members — creates members", async () => {
    mockSend.mockResolvedValueOnce({ UnprocessedAccounts: [] });
    const res = await post("/detectors/d1/members", { accounts: [{ accountId: "111", email: "a@b.c" }] });
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.created).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateMembersCommand");
    expect(mockSend.mock.calls[0][0].AccountDetails).toEqual([{ AccountId: "111", Email: "a@b.c" }]);
  });

  it("POST /detectors/:id/members — defaults unprocessedAccounts to empty array", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/detectors/d1/members", { accounts: [{ accountId: "222" }] });
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.unprocessedAccounts).toEqual([]);
  });

  it("POST /detectors/:id/members — 400 when accounts missing or empty", async () => {
    expect((await post("/detectors/d1/members", {})).status).toBe(400);
    expect((await post("/detectors/d1/members", { accounts: [] })).status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("GET /detectors/:id/organization-config — returns config", async () => {
    mockSend.mockResolvedValueOnce({ AutoEnable: true, MemberAccountLimitReached: true });
    const res = await get("/detectors/d1/organization-config");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.autoEnable).toBe(true);
    expect(body.memberAccountLimitReached).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DescribeOrganizationConfigurationCommand");
  });

  it("GET /detectors/:id/organization-config — defaults when fields missing", async () => {
    mockSend.mockResolvedValueOnce({});
    const body = await (await get("/detectors/d1/organization-config")).json();
    expect(body.autoEnable).toBe(false);
    expect(body.memberAccountLimitReached).toBe(false);
  });

  it("PUT /detectors/:id/organization-config — updates config", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/detectors/d1/organization-config", { autoEnable: true });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.updated).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateOrganizationConfigurationCommand");
    expect(mockSend.mock.calls[0][0].AutoEnable).toBe(true);
  });

  it("PUT /detectors/:id/organization-config — 400 when autoEnable not boolean", async () => {
    expect((await put("/detectors/d1/organization-config", { autoEnable: "yes" })).status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("POST /admin/enable — enables admin account", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/admin/enable", { adminAccountId: "111" });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.enabled).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("EnableOrganizationAdminAccountCommand");
  });

  it("POST /admin/enable — 400 when adminAccountId missing", async () => {
    expect((await post("/admin/enable", {})).status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("POST /admin/disable — disables admin account", async () => {
    mockSend.mockResolvedValueOnce({});
    const body = await (await post("/admin/disable", { adminAccountId: "111" })).json();
    expect(body.disabled).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DisableOrganizationAdminAccountCommand");
  });

  it("POST /admin/disable — 400 when adminAccountId missing", async () => {
    expect((await post("/admin/disable", {})).status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });
});
