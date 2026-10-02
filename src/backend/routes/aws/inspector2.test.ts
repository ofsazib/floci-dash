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

vi.mock("@aws-sdk/client-inspector2", () => ({
  Inspector2Client: mockClient,
  ListDelegatedAdminAccountsCommand: createCmd("ListDelegatedAdminAccountsCommand"),
  EnableDelegatedAdminAccountCommand: createCmd("EnableDelegatedAdminAccountCommand"),
  DisableDelegatedAdminAccountCommand: createCmd("DisableDelegatedAdminAccountCommand"),
  BatchGetAccountStatusCommand: createCmd("BatchGetAccountStatusCommand"),
  EnableCommand: createCmd("EnableCommand"),
  DescribeOrganizationConfigurationCommand: createCmd("DescribeOrganizationConfigurationCommand"),
  UpdateOrganizationConfigurationCommand: createCmd("UpdateOrganizationConfigurationCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./inspector2";

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

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("delegated admins", () => {
  it("lists delegated admin accounts", async () => {
    mockSend.mockResolvedValueOnce({
      delegatedAdminAccounts: [{ accountId: "111111111111", status: "ENABLED" }],
    });
    const res = await get("/delegated-admins");
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.delegatedAdminAccounts[0].accountId).toBe("111111111111");
  });

  it("returns sparse delegated admins", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/delegated-admins");
    const json = await res.json();
    expect(json.delegatedAdminAccounts).toEqual([]);
  });

  it("enables a delegated admin", async () => {
    mockSend.mockResolvedValueOnce({ delegatedAdminAccountId: "222222222222" });
    const res = await post("/delegated-admins/enable", { accountId: "222222222222" });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.delegatedAdminAccountId).toBe("222222222222");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "EnableDelegatedAdminAccountCommand",
        delegatedAdminAccountId: "222222222222",
      })
    );
  });

  it("400 enable without accountId", async () => {
    expect((await post("/delegated-admins/enable", {})).status).toBe(400);
  });

  it("disables a delegated admin", async () => {
    mockSend.mockResolvedValueOnce({ delegatedAdminAccountId: "222222222222" });
    const res = await post("/delegated-admins/disable", { accountId: "222222222222" });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DisableDelegatedAdminAccountCommand",
        delegatedAdminAccountId: "222222222222",
      })
    );
  });

  it("400 disable without accountId", async () => {
    expect((await post("/delegated-admins/disable", {})).status).toBe(400);
  });
});

describe("account status", () => {
  it("batch-gets account status", async () => {
    mockSend.mockResolvedValueOnce({
      accounts: [{ accountId: "1", state: { status: "ENABLED" } }],
      failedAccounts: [],
    });
    const res = await post("/account-status", { accountIds: ["1"] });
    const json = await res.json();
    expect(json.accounts[0].accountId).toBe("1");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "BatchGetAccountStatusCommand",
        accountIds: ["1"],
      })
    );
  });

  it("400 without accountIds", async () => {
    expect((await post("/account-status", {})).status).toBe(400);
    expect((await post("/account-status", { accountIds: [] })).status).toBe(400);
  });
});

describe("enable", () => {
  it("enables resource types", async () => {
    mockSend.mockResolvedValueOnce({
      accounts: [{ accountId: "1", status: "ENABLED" }],
    });
    const res = await post("/enable", { resourceTypes: ["EC2", "ECR"] });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "EnableCommand",
        resourceTypes: ["EC2", "ECR"],
      })
    );
  });

  it("400 without resourceTypes", async () => {
    expect((await post("/enable", {})).status).toBe(400);
    expect((await post("/enable", { resourceTypes: [] })).status).toBe(400);
  });
});

describe("organization configuration", () => {
  it("describes the configuration", async () => {
    mockSend.mockResolvedValueOnce({
      autoEnable: { ec2: true, ecr: false },
    });
    const res = await get("/organization-configuration");
    const json = await res.json();
    expect(json.organizationConfiguration.ec2).toBe(true);
  });

  it("returns null when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/organization-configuration");
    const json = await res.json();
    expect(json.organizationConfiguration).toBeNull();
  });

  it("updates the configuration", async () => {
    mockSend.mockResolvedValueOnce({
      autoEnable: { ec2: true },
    });
    const res = await put("/organization-configuration", {
      autoEnable: { ec2: true, ecr: true },
    });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UpdateOrganizationConfigurationCommand",
        autoEnable: { ec2: true, ecr: true },
      })
    );
  });

  it("400 update without autoEnable", async () => {
    expect((await put("/organization-configuration", {})).status).toBe(400);
  });
});
