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

vi.mock("@aws-sdk/client-verifiedpermissions", () => ({
  VerifiedPermissionsClient: mockClient,
  ListPolicyStoresCommand: createCmd("ListPolicyStoresCommand"),
  CreatePolicyStoreCommand: createCmd("CreatePolicyStoreCommand"),
  GetPolicyStoreCommand: createCmd("GetPolicyStoreCommand"),
  DeletePolicyStoreCommand: createCmd("DeletePolicyStoreCommand"),
  ListPoliciesCommand: createCmd("ListPoliciesCommand"),
  CreatePolicyCommand: createCmd("CreatePolicyCommand"),
  DeletePolicyCommand: createCmd("DeletePolicyCommand"),
  ListIdentitySourcesCommand: createCmd("ListIdentitySourcesCommand"),
  CreateIdentitySourceCommand: createCmd("CreateIdentitySourceCommand"),
  DeleteIdentitySourceCommand: createCmd("DeleteIdentitySourceCommand"),
  IsAuthorizedCommand: createCmd("IsAuthorizedCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./verifiedpermissions";

const STORE = "Ps-1234";

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

const STATEMENT = 'permit(principal, action == Action::"view", resource);';

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("policy stores", () => {
  it("lists stores", async () => {
    mockSend.mockResolvedValueOnce({
      policyStores: [{ policyStoreId: STORE, arn: "arn:vp" }],
    });
    const res = await get("/stores");
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.stores[0].policyStoreId).toBe(STORE);
  });

  it("returns sparse stores", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/stores");
    const json = await res.json();
    expect(json.stores).toEqual([]);
  });

  it("creates a store", async () => {
    mockSend.mockResolvedValueOnce({ policyStoreId: STORE, arn: "arn:vp" });
    const res = await post("/stores", {
      name: "app",
      validationSettings: { mode: "OFF" },
    });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.store.policyStoreId).toBe(STORE);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreatePolicyStoreCommand",
        name: "app",
        validationSettings: { mode: "OFF" },
      })
    );
  });

  it("400 store create without name", async () => {
    expect((await post("/stores", { validationSettings: { mode: "OFF" } })).status).toBe(400);
  });

  it("400 store create without validationSettings.mode", async () => {
    expect((await post("/stores", { name: "app" })).status).toBe(400);
  });

  it("gets a store", async () => {
    mockSend.mockResolvedValueOnce({ policyStoreId: STORE });
    const res = await get(`/stores/${STORE}`);
    const json = await res.json();
    expect(json.store.policyStoreId).toBe(STORE);
  });

  it("returns null store when absent", async () => {
    mockSend.mockResolvedValueOnce(null);
    const res = await get("/stores/none");
    const json = await res.json();
    expect(json.store).toBeNull();
  });

  it("deletes a store", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del(`/stores/${STORE}`);
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeletePolicyStoreCommand",
        policyStoreId: STORE,
      })
    );
  });
});

describe("policies", () => {
  it("lists policies", async () => {
    mockSend.mockResolvedValueOnce({
      policies: [{ policyId: "p1", definition: { static: { statement: STATEMENT } } }],
    });
    const res = await get(`/stores/${STORE}/policies`);
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.policies[0].policyId).toBe("p1");
  });

  it("returns sparse policies", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/stores/${STORE}/policies`);
    const json = await res.json();
    expect(json.policies).toEqual([]);
  });

  it("creates a policy", async () => {
    mockSend.mockResolvedValueOnce({ policyId: "p1" });
    const res = await post(`/stores/${STORE}/policies`, {
      name: "view-permit",
      definition: { static: { statement: STATEMENT } },
    });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.policy.policyId).toBe("p1");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreatePolicyCommand",
        policyStoreId: STORE,
        definition: { static: { statement: STATEMENT } },
      })
    );
  });

  it("400 policy create without statement", async () => {
    expect((await post(`/stores/${STORE}/policies`, { name: "x" })).status).toBe(400);
    expect(
      (await post(`/stores/${STORE}/policies`, { definition: { static: {} } })).status
    ).toBe(400);
  });

  it("deletes a policy", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del(`/stores/${STORE}/policies/p1`);
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeletePolicyCommand",
        policyStoreId: STORE,
        policyId: "p1",
      })
    );
  });
});

describe("identity sources", () => {
  const CONFIG = {
    cognitoUserPool: { userPoolArn: "arn:aws:cognito-idp::1:userpool/pool" },
  };

  it("lists identity sources", async () => {
    mockSend.mockResolvedValueOnce({ identitySources: [{ identitySourceId: "is1" }] });
    const res = await get(`/stores/${STORE}/identity-sources`);
    const json = await res.json();
    expect(json.total).toBe(1);
  });

  it("returns sparse identity sources", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/stores/${STORE}/identity-sources`);
    const json = await res.json();
    expect(json.identitySources).toEqual([]);
  });

  it("creates an identity source", async () => {
    mockSend.mockResolvedValueOnce({ identitySourceId: "is1" });
    const res = await post(`/stores/${STORE}/identity-sources`, {
      configuration: CONFIG,
    });
    expect(res.status).toBe(201);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateIdentitySourceCommand",
        configuration: CONFIG,
      })
    );
  });

  it("400 identity source without user pool arn", async () => {
    expect((await post(`/stores/${STORE}/identity-sources`, {})).status).toBe(400);
    expect(
      (await post(`/stores/${STORE}/identity-sources`, { configuration: {} })).status
    ).toBe(400);
  });

  it("deletes an identity source", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del(`/stores/${STORE}/identity-sources/is1`);
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteIdentitySourceCommand",
        identitySourceId: "is1",
      })
    );
  });
});

describe("is-authorized", () => {
  const PRINCIPAL = { entityType: "User", entityId: "u1" };
  const ACTION = { actionType: "Action", actionId: "view" };
  const RESOURCE = { entityType: "Document", entityId: "doc1" };

  it("evaluates and returns the decision", async () => {
    mockSend.mockResolvedValueOnce({
      decision: "ALLOW",
      determiningPolicies: [{ policyId: "p1" }],
      errors: [],
    });
    const res = await post(`/stores/${STORE}/is-authorized`, {
      principal: PRINCIPAL,
      action: ACTION,
      resource: RESOURCE,
    });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.decision).toBe("ALLOW");
    expect(json.determiningPolicies[0].policyId).toBe("p1");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "IsAuthorizedCommand",
        principal: PRINCIPAL,
        action: ACTION,
        resource: RESOURCE,
      })
    );
  });

  it("400 without principal, action or resource", async () => {
    expect(
      (await post(`/stores/${STORE}/is-authorized`, { action: ACTION, resource: RESOURCE })).status
    ).toBe(400);
    expect(
      (await post(`/stores/${STORE}/is-authorized`, { principal: PRINCIPAL, resource: RESOURCE })).status
    ).toBe(400);
    expect(
      (await post(`/stores/${STORE}/is-authorized`, { principal: PRINCIPAL, action: ACTION })).status
    ).toBe(400);
  });
});
