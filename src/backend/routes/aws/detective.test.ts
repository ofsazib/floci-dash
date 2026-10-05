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

vi.mock("@aws-sdk/client-detective", () => ({
  DetectiveClient: mockClient,
  ListGraphsCommand: createCmd("ListGraphsCommand"),
  ListOrganizationAdminAccountsCommand: createCmd("ListOrganizationAdminAccountsCommand"),
  EnableOrganizationAdminAccountCommand: createCmd("EnableOrganizationAdminAccountCommand"),
  DescribeOrganizationConfigurationCommand: createCmd("DescribeOrganizationConfigurationCommand"),
  UpdateOrganizationConfigurationCommand: createCmd("UpdateOrganizationConfigurationCommand"),
  ListMembersCommand: createCmd("ListMembersCommand"),
  CreateMembersCommand: createCmd("CreateMembersCommand"),
  StartMonitoringMemberCommand: createCmd("StartMonitoringMemberCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./detective";

async function post(path: string, body?: any) {
  return router.request(path, {
    method: "POST",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("organization admin", () => {
  it("lists administrators", async () => {
    mockSend.mockResolvedValueOnce({ administrators: [{ accountId: "111111111111" }] });
    const res = await post("/organization/admins");
    const json = await res.json();
    expect(json.administrators).toHaveLength(1);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ __cmdName: "ListOrganizationAdminAccountsCommand" })
    );
  });

  it("returns an empty administrator list when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/organization/admins");
    const json = await res.json();
    expect(json.administrators).toEqual([]);
  });

  it("400 enable without accountId", async () => {
    expect((await post("/organization/admins/enable", {})).status).toBe(400);
  });

  it("enables an administrator", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/organization/admins/enable", { accountId: "111111111111" });
    expect(res.status).toBe(201);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ AccountId: "111111111111" })
    );
  });
});

describe("graphs", () => {
  it("lists graphs", async () => {
    mockSend.mockResolvedValueOnce({ graphList: [{ arn: "arn:graph" }] });
    const res = await post("/graphs");
    const json = await res.json();
    expect(json.graphList).toHaveLength(1);
    expect(json.graphList[0].arn).toBe("arn:graph");
  });

  it("returns an empty graph list when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/graphs");
    const json = await res.json();
    expect(json.graphList).toEqual([]);
  });
});

describe("organization configuration", () => {
  it("400 describe without graphArn", async () => {
    expect((await post("/organization/configuration/get", {})).status).toBe(400);
  });

  it("describes the configuration", async () => {
    mockSend.mockResolvedValueOnce({ autoEnable: true });
    const res = await post("/organization/configuration/get", { graphArn: "arn:graph" });
    const json = await res.json();
    expect(json.autoEnable).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ GraphArn: "arn:graph" })
    );
  });

  it("defaults autoEnable to false when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/organization/configuration/get", { graphArn: "arn:graph" });
    const json = await res.json();
    expect(json.autoEnable).toBe(false);
  });

  it("400 update without graphArn", async () => {
    expect((await post("/organization/configuration", {})).status).toBe(400);
  });

  it("400 update without boolean autoEnable", async () => {
    expect((await post("/organization/configuration", { graphArn: "arn:graph" })).status).toBe(400);
    expect(
      (await post("/organization/configuration", { graphArn: "arn:graph", autoEnable: "yes" }))
        .status
    ).toBe(400);
  });

  it("updates the configuration", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/organization/configuration", {
      graphArn: "arn:graph",
      autoEnable: true,
    });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ GraphArn: "arn:graph", AutoEnable: true })
    );
  });
});

describe("members", () => {
  it("400 list without graphArn", async () => {
    expect((await post("/members", {})).status).toBe(400);
  });

  it("lists members", async () => {
    mockSend.mockResolvedValueOnce({
      memberDetails: [{ accountId: "111111111111", status: "ENABLED" }],
    });
    const res = await post("/members", { graphArn: "arn:graph" });
    const json = await res.json();
    expect(json.memberDetails).toHaveLength(1);
  });

  it("returns an empty member list when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/members", { graphArn: "arn:graph" });
    const json = await res.json();
    expect(json.memberDetails).toEqual([]);
  });

  it("400 create without graphArn", async () => {
    expect((await post("/members/create", { accounts: [] })).status).toBe(400);
  });

  it("400 create without accounts", async () => {
    expect((await post("/members/create", { graphArn: "arn:graph" })).status).toBe(400);
    expect(
      (await post("/members/create", { graphArn: "arn:graph", accounts: [] })).status
    ).toBe(400);
  });

  it("creates members", async () => {
    mockSend.mockResolvedValueOnce({
      members: [{ accountId: "111111111111", status: "ACCEPTED_BUT_DISABLED" }],
      unprocessedAccounts: [],
    });
    const res = await post("/members/create", {
      graphArn: "arn:graph",
      accounts: [{ accountId: "111111111111", emailAddress: "a@b.c" }],
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.members).toHaveLength(1);
    expect(json.unprocessedAccounts).toEqual([]);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        GraphArn: "arn:graph",
        Accounts: [{ AccountId: "111111111111", EmailAddress: "a@b.c" }],
      })
    );
  });

  it("returns empty member and unprocessed lists when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/members/create", {
      graphArn: "arn:graph",
      accounts: [{ accountId: "111111111111" }],
    });
    const json = await res.json();
    expect(json.members).toEqual([]);
    expect(json.unprocessedAccounts).toEqual([]);
  });

  it("reports unprocessed accounts", async () => {
    mockSend.mockResolvedValueOnce({
      members: [],
      unprocessedAccounts: [{ accountId: "111111111111", reason: "conflict" }],
    });
    const res = await post("/members/create", {
      graphArn: "arn:graph",
      accounts: [{ accountId: "111111111111" }],
    });
    const json = await res.json();
    expect(json.unprocessedAccounts).toHaveLength(1);
  });

  it("400 monitoring without graphArn or accountId", async () => {
    expect((await post("/members/monitoring", {})).status).toBe(400);
    expect((await post("/members/monitoring", { graphArn: "arn:graph" })).status).toBe(400);
  });

  it("starts monitoring a member", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/members/monitoring", {
      graphArn: "arn:graph",
      accountId: "111111111111",
    });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ GraphArn: "arn:graph", AccountId: "111111111111" })
    );
  });
});
