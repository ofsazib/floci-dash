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

vi.mock("@aws-sdk/client-dlm", () => ({
  DLMClient: mockClient,
  CreateLifecyclePolicyCommand: createCmd("CreateLifecyclePolicyCommand"),
  GetLifecyclePolicyCommand: createCmd("GetLifecyclePolicyCommand"),
  UpdateLifecyclePolicyCommand: createCmd("UpdateLifecyclePolicyCommand"),
  DeleteLifecyclePolicyCommand: createCmd("DeleteLifecyclePolicyCommand"),
  GetLifecyclePoliciesCommand: createCmd("GetLifecyclePoliciesCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./dlm";

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

const POLICY_BODY = {
  executionRoleArn: "arn:aws:iam::1:role/dlm",
  description: "nightly snapshots",
  state: "ENABLED",
  policyDetails: [{ ResourceTypes: ["VOLUME"], Schedules: [{ Name: "sched" }] }],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("GET /policies", () => {
  it("lists policies", async () => {
    mockSend.mockResolvedValueOnce({
      Policies: [{ PolicyId: "p1", Description: "nightly", State: "ENABLED" }],
    });
    const res = await get("/policies");
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.policies[0].PolicyId).toBe("p1");
  });

  it("returns sparse policies", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/policies");
    const json = await res.json();
    expect(json.policies).toEqual([]);
  });
});

describe("POST /policies", () => {
  it("creates a policy", async () => {
    mockSend.mockResolvedValueOnce({ PolicyId: "p1" });
    const res = await post("/policies", POLICY_BODY);
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.policyId).toBe("p1");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateLifecyclePolicyCommand",
        ExecutionRoleArn: POLICY_BODY.executionRoleArn,
        State: "ENABLED",
      })
    );
  });

  it("400 without executionRoleArn", async () => {
    expect((await post("/policies", { ...POLICY_BODY, executionRoleArn: undefined })).status).toBe(400);
  });

  it("400 without description", async () => {
    expect((await post("/policies", { ...POLICY_BODY, description: undefined })).status).toBe(400);
  });

  it("400 without state", async () => {
    expect((await post("/policies", { ...POLICY_BODY, state: undefined })).status).toBe(400);
  });

  it("400 without policyDetails", async () => {
    expect((await post("/policies", { ...POLICY_BODY, policyDetails: undefined })).status).toBe(400);
  });
});

describe("GET /policies/:id", () => {
  it("gets a policy", async () => {
    mockSend.mockResolvedValueOnce({ Policy: { PolicyId: "p1" } });
    const res = await get("/policies/p1");
    const json = await res.json();
    expect(json.policy.PolicyId).toBe("p1");
  });

  it("returns null when absent", async () => {
    mockSend.mockResolvedValueOnce(null);
    const res = await get("/policies/none");
    const json = await res.json();
    expect(json.policy).toBeNull();
  });
});

describe("PUT /policies/:id", () => {
  it("updates a policy", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/policies/p1", POLICY_BODY);
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UpdateLifecyclePolicyCommand",
        PolicyId: "p1",
      })
    );
  });

  it("400 update without required fields", async () => {
    expect((await put("/policies/p1", {})).status).toBe(400);
    expect((await put("/policies/p1", { executionRoleArn: "r" })).status).toBe(400);
  });
});

describe("DELETE /policies/:id", () => {
  it("deletes a policy", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/policies/p1");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteLifecyclePolicyCommand",
        PolicyId: "p1",
      })
    );
  });
});
