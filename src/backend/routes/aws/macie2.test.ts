import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockClient = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-macie2", () => ({
  Macie2Client: mockClient,
  GetMacieSessionCommand: createCmd("GetMacieSessionCommand"),
  EnableMacieCommand: createCmd("EnableMacieCommand"),
  ListOrganizationAdminAccountsCommand: createCmd("ListOrganizationAdminAccountsCommand"),
  EnableOrganizationAdminAccountCommand: createCmd("EnableOrganizationAdminAccountCommand"),
  DescribeOrganizationConfigurationCommand: createCmd("DescribeOrganizationConfigurationCommand"),
  UpdateOrganizationConfigurationCommand: createCmd("UpdateOrganizationConfigurationCommand"),
  ListMembersCommand: createCmd("ListMembersCommand"),
  CreateMemberCommand: createCmd("CreateMemberCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./macie2";

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

async function patch(path: string, body?: any) {
  return router.request(path, {
    method: "PATCH",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("session", () => {
  it("describes an enabled session", async () => {
    mockSend.mockResolvedValueOnce({ status: "ENABLED", serviceRole: "arn:role" });
    const res = await get("/session");
    const json = await res.json();
    expect(json.enabled).toBe(true);
    expect(json.status).toBe("ENABLED");
    expect(json.serviceRole).toBe("arn:role");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ __cmdName: "GetMacieSessionCommand" })
    );
  });

  it("returns enabled false when the session does not exist", async () => {
    mockSend.mockRejectedValueOnce(
      Object.assign(new Error("not found"), { name: "ResourceNotFoundException" })
    );
    const res = await get("/session");
    const json = await res.json();
    expect(json.enabled).toBe(false);
  });

  it("rethrows non-404 describe errors", async () => {
    mockSend.mockRejectedValueOnce(Object.assign(new Error("boom"), { name: "ServiceError" }));
    const res = await get("/session");
    expect(res.status).toBe(500);
  });

  it("enables the session", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/session/enable");
    expect(res.status).toBe(201);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ __cmdName: "EnableMacieCommand" })
    );
  });
});

describe("organization admin", () => {
  it("lists admin accounts", async () => {
    mockSend.mockResolvedValueOnce({
      adminAccounts: [{ accountId: "000000000000", status: "ENABLED" }],
    });
    const res = await get("/organization/admins");
    const json = await res.json();
    expect(json.adminAccounts).toHaveLength(1);
    expect(json.adminAccounts[0].accountId).toBe("000000000000");
  });

  it("returns an empty list when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/organization/admins");
    const json = await res.json();
    expect(json.adminAccounts).toEqual([]);
  });

  it("400 enable without accountId", async () => {
    expect((await post("/organization/admins/enable", {})).status).toBe(400);
  });

  it("enables an admin account", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/organization/admins/enable", { accountId: "000000000000" });
    expect(res.status).toBe(201);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ adminAccountId: "000000000000" })
    );
  });
});

describe("organization configuration", () => {
  it("describes the configuration", async () => {
    mockSend.mockResolvedValueOnce({ autoEnable: true });
    const res = await get("/organization/configuration");
    const json = await res.json();
    expect(json.autoEnable).toBe(true);
  });

  it("defaults autoEnable to false when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/organization/configuration");
    const json = await res.json();
    expect(json.autoEnable).toBe(false);
  });

  it("400 update without boolean autoEnable", async () => {
    expect((await patch("/organization/configuration", {})).status).toBe(400);
    expect((await patch("/organization/configuration", { autoEnable: "yes" })).status).toBe(400);
  });

  it("updates the configuration", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await patch("/organization/configuration", { autoEnable: true });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ autoEnable: true })
    );
  });
});

describe("members", () => {
  it("lists members", async () => {
    mockSend.mockResolvedValueOnce({
      members: [
        { accountId: "222222222222", relationshipStatus: "Created", arn: "arn:member" },
      ],
      nextToken: "tok",
    });
    const res = await get("/members");
    const json = await res.json();
    expect(json.members).toHaveLength(1);
    expect(json.nextToken).toBe("tok");
  });

  it("returns an empty member list when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/members");
    const json = await res.json();
    expect(json.members).toEqual([]);
    expect(json.nextToken).toBeUndefined();
  });

  it("passes onlyAssociated=true", async () => {
    mockSend.mockResolvedValueOnce({ members: [] });
    await get("/members?onlyAssociated=true");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ onlyAssociated: "true" })
    );
  });

  it("omits onlyAssociated when not true", async () => {
    mockSend.mockResolvedValueOnce({ members: [] });
    await get("/members?onlyAssociated=false");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.onlyAssociated).toBeUndefined();
  });

  it("400 create without accountId or email", async () => {
    expect((await post("/members", {})).status).toBe(400);
    expect((await post("/members", { accountId: "222222222222" })).status).toBe(400);
  });

  it("creates a member", async () => {
    mockSend.mockResolvedValueOnce({ arn: "arn:member" });
    const res = await post("/members", {
      accountId: "222222222222",
      email: "member@example.com",
      tags: { team: "sec" },
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.arn).toBe("arn:member");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        account: { accountId: "222222222222", email: "member@example.com" },
        tags: { team: "sec" },
      })
    );
  });

  it("creates a member without tags", async () => {
    mockSend.mockResolvedValueOnce({ arn: "arn:member" });
    await post("/members", { accountId: "222222222222", email: "member@example.com" });
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.tags).toBeUndefined();
  });
});
