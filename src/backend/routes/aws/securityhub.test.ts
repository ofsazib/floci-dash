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

vi.mock("@aws-sdk/client-securityhub", () => ({
  SecurityHubClient: mockClient,
  DescribeHubCommand: createCmd("DescribeHubCommand"),
  EnableSecurityHubCommand: createCmd("EnableSecurityHubCommand"),
  UpdateSecurityHubConfigurationCommand: createCmd("UpdateSecurityHubConfigurationCommand"),
  ListOrganizationAdminAccountsCommand: createCmd("ListOrganizationAdminAccountsCommand"),
  EnableOrganizationAdminAccountCommand: createCmd("EnableOrganizationAdminAccountCommand"),
  DescribeOrganizationConfigurationCommand: createCmd("DescribeOrganizationConfigurationCommand"),
  UpdateOrganizationConfigurationCommand: createCmd("UpdateOrganizationConfigurationCommand"),
  ListFindingAggregatorsCommand: createCmd("ListFindingAggregatorsCommand"),
  CreateFindingAggregatorCommand: createCmd("CreateFindingAggregatorCommand"),
  GetFindingAggregatorCommand: createCmd("GetFindingAggregatorCommand"),
  UpdateFindingAggregatorCommand: createCmd("UpdateFindingAggregatorCommand"),
  ListConfigurationPoliciesCommand: createCmd("ListConfigurationPoliciesCommand"),
  CreateConfigurationPolicyCommand: createCmd("CreateConfigurationPolicyCommand"),
  GetConfigurationPolicyCommand: createCmd("GetConfigurationPolicyCommand"),
  UpdateConfigurationPolicyCommand: createCmd("UpdateConfigurationPolicyCommand"),
  StartConfigurationPolicyAssociationCommand: createCmd("StartConfigurationPolicyAssociationCommand"),
  GetConfigurationPolicyAssociationCommand: createCmd("GetConfigurationPolicyAssociationCommand"),
  StartConfigurationPolicyDisassociationCommand: createCmd("StartConfigurationPolicyDisassociationCommand"),
  ListConfigurationPolicyAssociationsCommand: createCmd("ListConfigurationPolicyAssociationsCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./securityhub";

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

describe("hub", () => {
  it("describes the hub", async () => {
    mockSend.mockResolvedValueOnce({
      hubArn: "arn:aws:securityhub:us-east-1:111111111111:hub/default",
      autoEnableControls: true,
      controlFindingGenerator: "SECURITY_CONTROL",
    });
    const res = await get("/hub");
    const json = await res.json();
    expect(json.enabled).toBe(true);
    expect(json.hubArn).toContain("hub/default");
    expect(json.autoEnableControls).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ __cmdName: "DescribeHubCommand" })
    );
  });

  it("defaults autoEnableControls when the SDK omits it", async () => {
    mockSend.mockResolvedValueOnce({ hubArn: "arn:hub" });
    const res = await get("/hub");
    const json = await res.json();
    expect(json.enabled).toBe(true);
    expect(json.autoEnableControls).toBe(false);
  });

  it("returns enabled false when the hub does not exist", async () => {
    mockSend.mockRejectedValueOnce(
      Object.assign(new Error("not found"), { name: "ResourceNotFoundException" })
    );
    const res = await get("/hub");
    const json = await res.json();
    expect(json.enabled).toBe(false);
  });

  it("rethrows non-404 describe errors", async () => {
    mockSend.mockRejectedValueOnce(Object.assign(new Error("boom"), { name: "ServiceError" }));
    const res = await get("/hub");
    expect(res.status).toBe(500);
  });

  it("enables the hub with defaults", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/hub/enable", {});
    expect(res.status).toBe(201);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ __cmdName: "EnableSecurityHubCommand" })
    );
  });

  it("enables the hub with no body", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/hub/enable");
    expect(res.status).toBe(201);
  });

  it("passes controlFindingGenerator and tags when enabling", async () => {
    mockSend.mockResolvedValueOnce({});
    await post("/hub/enable", {
      controlFindingGenerator: "STANDARD_CONTROL",
      tags: { team: "sec" },
    });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        ControlFindingGenerator: "STANDARD_CONTROL",
        Tags: { team: "sec" },
      })
    );
  });

  it("updates hub configuration", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await patch("/hub", {
      autoEnableControls: false,
      controlFindingGenerator: "SECURITY_CONTROL",
    });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        AutoEnableControls: false,
        ControlFindingGenerator: "SECURITY_CONTROL",
      })
    );
  });

  it("updates hub configuration with an empty body", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await patch("/hub");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ __cmdName: "UpdateSecurityHubConfigurationCommand" })
    );
  });
});

describe("organization admin", () => {
  it("lists admin accounts", async () => {
    mockSend.mockResolvedValueOnce({
      adminAccounts: [{ accountId: "111111111111", status: "ENABLED" }],
      feature: "SecurityHub",
    });
    const res = await get("/organization/admins");
    const json = await res.json();
    expect(json.adminAccounts).toHaveLength(1);
    expect(json.feature).toBe("SecurityHub");
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
    mockSend.mockResolvedValueOnce({ adminAccountId: "111111111111", feature: "SecurityHub" });
    const res = await post("/organization/admins/enable", {
      accountId: "111111111111",
      feature: "SecurityHub",
    });
    expect(res.status).toBe(201);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        AdminAccountId: "111111111111",
        Feature: "SecurityHub",
      })
    );
  });
});

describe("organization configuration", () => {
  it("describes the configuration", async () => {
    mockSend.mockResolvedValueOnce({
      autoEnable: true,
      autoEnableStandards: "DEFAULT",
      organizationConfiguration: { configurationType: "LOCAL", status: "ENABLED" },
    });
    const res = await get("/organization/configuration");
    const json = await res.json();
    expect(json.autoEnable).toBe(true);
    expect(json.organizationConfiguration.configurationType).toBe("LOCAL");
  });

  it("defaults autoEnable to false when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/organization/configuration");
    const json = await res.json();
    expect(json.autoEnable).toBe(false);
    expect(json.organizationConfiguration).toBeNull();
  });

  it("400 update with no body", async () => {
    expect((await post("/organization/configuration")).status).toBe(400);
  });

  it("400 update without boolean autoEnable", async () => {
    expect((await post("/organization/configuration", {})).status).toBe(400);
    expect((await post("/organization/configuration", { autoEnable: "yes" })).status).toBe(400);
  });

  it("updates the configuration", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/organization/configuration", {
      autoEnable: true,
      autoEnableStandards: "DEFAULT",
      configurationType: "LOCAL",
    });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        AutoEnable: true,
        AutoEnableStandards: "DEFAULT",
        OrganizationConfiguration: { ConfigurationType: "LOCAL" },
      })
    );
  });

  it("updates the configuration without a type", async () => {
    mockSend.mockResolvedValueOnce({});
    await post("/organization/configuration", { autoEnable: false });
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.OrganizationConfiguration).toBeUndefined();
  });
});

describe("finding aggregators", () => {
  it("lists aggregators", async () => {
    mockSend.mockResolvedValueOnce({
      findingAggregators: [{ findingAggregatorArn: "arn:aws:securityhub:us-east-1:1:finding-aggregator/x" }],
    });
    const res = await get("/finding-aggregators");
    const json = await res.json();
    expect(json.findingAggregators).toHaveLength(1);
  });

  it("returns an empty aggregator list when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/finding-aggregators");
    const json = await res.json();
    expect(json.findingAggregators).toEqual([]);
  });

  it("400 create without regionLinkingMode", async () => {
    expect((await post("/finding-aggregators", {})).status).toBe(400);
  });

  it("creates an aggregator", async () => {
    mockSend.mockResolvedValueOnce({
      findingAggregatorArn: "arn:agg",
      findingAggregationRegion: "us-east-1",
      regionLinkingMode: "SPECIFIED_REGIONS",
      regions: ["us-east-1"],
    });
    const res = await post("/finding-aggregators", {
      regionLinkingMode: "SPECIFIED_REGIONS",
      regions: ["us-east-1"],
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.findingAggregatorArn).toBe("arn:agg");
    expect(json.regions).toEqual(["us-east-1"]);
  });

  it("creates an aggregator without regions", async () => {
    mockSend.mockResolvedValueOnce({
      findingAggregatorArn: "arn:agg",
      regionLinkingMode: "ALL_REGIONS",
    });
    const res = await post("/finding-aggregators", { regionLinkingMode: "ALL_REGIONS" });
    const json = await res.json();
    expect(json.regions).toEqual([]);
  });

  it("400 get without arn", async () => {
    expect((await post("/finding-aggregators/get", {})).status).toBe(400);
  });

  it("gets an aggregator", async () => {
    mockSend.mockResolvedValueOnce({
      findingAggregatorArn: "arn:agg",
      regionLinkingMode: "ALL_REGIONS",
    });
    const res = await post("/finding-aggregators/get", { findingAggregatorArn: "arn:agg" });
    const json = await res.json();
    expect(json.regionLinkingMode).toBe("ALL_REGIONS");
    expect(json.regions).toEqual([]);
  });

  it("400 update without arn or mode", async () => {
    expect((await patch("/finding-aggregators", {})).status).toBe(400);
    expect(
      (await patch("/finding-aggregators", { findingAggregatorArn: "arn:agg" })).status
    ).toBe(400);
  });

  it("updates an aggregator", async () => {
    mockSend.mockResolvedValueOnce({ findingAggregatorArn: "arn:agg" });
    const res = await patch("/finding-aggregators", {
      findingAggregatorArn: "arn:agg",
      regionLinkingMode: "ALL_REGIONS",
    });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        FindingAggregatorArn: "arn:agg",
        RegionLinkingMode: "ALL_REGIONS",
      })
    );
  });
});

describe("configuration policies", () => {
  it("lists policies", async () => {
    mockSend.mockResolvedValueOnce({
      configurationPolicySummaries: [{ id: "p1", name: "baseline" }],
      nextToken: "tok",
    });
    const res = await get("/configuration-policies");
    const json = await res.json();
    expect(json.configurationPolicySummaries).toHaveLength(1);
    expect(json.nextToken).toBe("tok");
  });

  it("returns an empty policy list when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/configuration-policies");
    const json = await res.json();
    expect(json.configurationPolicySummaries).toEqual([]);
    expect(json.nextToken).toBeUndefined();
  });

  it("400 create without name or configurationPolicy", async () => {
    expect((await post("/configuration-policies", {})).status).toBe(400);
    expect(
      (await post("/configuration-policies", { name: "baseline" })).status
    ).toBe(400);
  });

  it("creates a policy", async () => {
    mockSend.mockResolvedValueOnce({
      arn: "arn:policy",
      id: "p1",
      name: "baseline",
      serviceEnabled: true,
    });
    const res = await post("/configuration-policies", {
      name: "baseline",
      description: "d",
      configurationPolicy: { SecurityHub: { ServiceEnabled: true } },
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe("p1");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        Name: "baseline",
        Description: "d",
        ConfigurationPolicy: { SecurityHub: { ServiceEnabled: true } },
      })
    );
  });

  it("400 get without id", async () => {
    expect((await post("/configuration-policies/get", {})).status).toBe(400);
  });

  it("gets a policy", async () => {
    mockSend.mockResolvedValueOnce({
      arn: "arn:policy",
      id: "p1",
      name: "baseline",
      configurationPolicy: { SecurityHub: { ServiceEnabled: true } },
    });
    const res = await post("/configuration-policies/get", { id: "p1" });
    const json = await res.json();
    expect(json.name).toBe("baseline");
    expect(json.configurationPolicy.SecurityHub.ServiceEnabled).toBe(true);
  });

  it("returns null configurationPolicy when absent", async () => {
    mockSend.mockResolvedValueOnce({ arn: "arn:policy", id: "p1", name: "baseline" });
    const res = await post("/configuration-policies/get", { id: "p1" });
    const json = await res.json();
    expect(json.configurationPolicy).toBeNull();
  });

  it("400 update without id", async () => {
    expect((await post("/configuration-policies/update", {})).status).toBe(400);
  });

  it("updates a policy", async () => {
    mockSend.mockResolvedValueOnce({ arn: "arn:policy", id: "p1", name: "renamed" });
    const res = await post("/configuration-policies/update", { id: "p1", name: "renamed" });
    const json = await res.json();
    expect(json.name).toBe("renamed");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ Identifier: "p1", Name: "renamed" })
    );
  });
});

describe("configuration policy associations", () => {
  it("400 associate without target", async () => {
    expect((await post("/associations/associate", {})).status).toBe(400);
  });

  it("400 associate with no body", async () => {
    expect((await post("/associations/associate")).status).toBe(400);
  });

  it("400 associate without policy identifier", async () => {
    expect(
      (await post("/associations/associate", { targetAccountId: "111111111111" })).status
    ).toBe(400);
  });

  it("associates a policy with an account target", async () => {
    mockSend.mockResolvedValueOnce({
      associationStatus: "PENDING",
      associationType: "APPLIED",
      configurationPolicyId: "p1",
      targetId: "111111111111",
      targetType: "ACCOUNT",
    });
    const res = await post("/associations/associate", {
      targetAccountId: "111111111111",
      configurationPolicyIdentifier: "p1",
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.associationStatus).toBe("PENDING");
    expect(json.targetType).toBe("ACCOUNT");
  });

  it("maps organizational unit and root targets", async () => {
    mockSend.mockResolvedValueOnce({ associationStatus: "PENDING" });
    await post("/associations/associate", {
      targetOrganizationalUnitId: "ou-ab12-cdef3333",
      configurationPolicyIdentifier: "p1",
    });
    expect(mockSend.mock.calls[0][0].Target).toEqual({
      OrganizationalUnitId: "ou-ab12-cdef3333",
    });

    mockSend.mockResolvedValueOnce({ associationStatus: "PENDING" });
    await post("/associations/associate", {
      targetRootId: "r-ab12",
      configurationPolicyIdentifier: "p1",
    });
    expect(mockSend.mock.calls[1][0].Target).toEqual({ RootId: "r-ab12" });
  });

  it("400 association get without target", async () => {
    expect((await post("/associations/get", {})).status).toBe(400);
  });

  it("gets an association", async () => {
    mockSend.mockResolvedValueOnce({
      associationStatus: "SUCCESS",
      configurationPolicyId: "p1",
      targetId: "111111111111",
      targetType: "ACCOUNT",
    });
    const res = await post("/associations/get", { targetAccountId: "111111111111" });
    const json = await res.json();
    expect(json.associationStatus).toBe("SUCCESS");
  });

  it("400 disassociate without target or policy", async () => {
    expect((await post("/associations/disassociate", {})).status).toBe(400);
    expect(
      (await post("/associations/disassociate", { targetAccountId: "111111111111" })).status
    ).toBe(400);
  });

  it("disassociates a policy", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/associations/disassociate", {
      targetAccountId: "111111111111",
      configurationPolicyIdentifier: "p1",
    });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        Target: { AccountId: "111111111111" },
        ConfigurationPolicyIdentifier: "p1",
      })
    );
  });

  it("lists associations", async () => {
    mockSend.mockResolvedValueOnce({
      configurationPolicyAssociationSummaries: [
        { targetId: "111111111111", associationStatus: "SUCCESS" },
      ],
    });
    const res = await post("/associations/list");
    const json = await res.json();
    expect(json.configurationPolicyAssociationSummaries).toHaveLength(1);
  });

  it("returns an empty association list when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/associations/list");
    const json = await res.json();
    expect(json.configurationPolicyAssociationSummaries).toEqual([]);
  });
});
