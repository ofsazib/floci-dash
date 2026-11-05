import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSend, mocks } = vi.hoisted(() => {
  const mockSend = vi.fn();
  const createCmd = (name: string) =>
    vi.fn(function (this: any, args?: any) {
      const cmd: any = { ...args, __cmdName: name };
      return cmd;
    });
  const names = [
    "ListInstancesCommand",
    "ListPermissionSetsCommand",
    "DescribePermissionSetCommand",
    "CreatePermissionSetCommand",
    "UpdatePermissionSetCommand",
    "DeletePermissionSetCommand",
    "ListManagedPoliciesInPermissionSetCommand",
    "AttachManagedPolicyToPermissionSetCommand",
    "DetachManagedPolicyFromPermissionSetCommand",
    "ListCustomerManagedPolicyReferencesInPermissionSetCommand",
    "AttachCustomerManagedPolicyReferenceToPermissionSetCommand",
    "DetachCustomerManagedPolicyReferenceFromPermissionSetCommand",
    "GetInlinePolicyForPermissionSetCommand",
    "PutInlinePolicyToPermissionSetCommand",
    "DeleteInlinePolicyFromPermissionSetCommand",
    "GetPermissionsBoundaryForPermissionSetCommand",
    "PutPermissionsBoundaryToPermissionSetCommand",
    "DeletePermissionsBoundaryFromPermissionSetCommand",
    "ListTagsForResourceCommand",
    "TagResourceCommand",
    "UntagResourceCommand",
    "ListAccountAssignmentsCommand",
    "CreateAccountAssignmentCommand",
    "DeleteAccountAssignmentCommand",
    "ListAccountAssignmentCreationStatusCommand",
    "DescribeAccountAssignmentCreationStatusCommand",
    "ListAccountAssignmentDeletionStatusCommand",
    "DescribeAccountAssignmentDeletionStatusCommand",
    "ListPermissionSetProvisioningStatusCommand",
    "DescribePermissionSetProvisioningStatusCommand",
    "ProvisionPermissionSetCommand",
    "ListAccountsForProvisionedPermissionSetCommand",
    "ListTrustedTokenIssuersCommand",
    "CreateTrustedTokenIssuerCommand",
    "DescribeTrustedTokenIssuerCommand",
    "UpdateTrustedTokenIssuerCommand",
    "DeleteTrustedTokenIssuerCommand",
    "DescribeInstanceAccessControlAttributeConfigurationCommand",
    "CreateInstanceAccessControlAttributeConfigurationCommand",
    "UpdateInstanceAccessControlAttributeConfigurationCommand",
    "DeleteInstanceAccessControlAttributeConfigurationCommand",
    "ListRegionsCommand",
    "AddRegionCommand",
    "RemoveRegionCommand",
  ];
  const mocks: Record<string, any> = {
    SSOAdminClient: vi.fn(function (this: any) {
      return { send: mockSend };
    }),
  };
  for (const name of names) mocks[name] = createCmd(name);
  return { mockSend, mocks };
});

vi.mock("@aws-sdk/client-sso-admin", () => mocks);

import router from "./ssoadmin";

const INSTANCE = "arn:aws:sso:::instance/ssoins-7223b02a5d9f7c8e";
const PS_ARN =
  "arn:aws:sso:::permissionSet/ssoins-7223b02a5d9f7c8e/ps-aaaaaaaaaaaaaaaa";
const TTI_ARN =
  "arn:aws:sso::123456789012:trustedTokenIssuer/ssoins-7223b02a5d9f7c8e/tti-11111111-2222-3333-4444-555555555555";

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

/** Builds a querystring from base, removing one key at a time. */
function qsWithout(base: Record<string, string>, omit: string) {
  const q = new URLSearchParams(base);
  q.delete(omit);
  return q.toString();
}

/** Every listed query param must be required (400 when omitted). */
async function expectAllQueryRequired(
  path: string,
  params: Record<string, string>,
  method: "GET" | "DELETE" = "GET"
) {
  for (const omit of Object.keys(params)) {
    const res = await router.request(`${path}?${qsWithout(params, omit)}`, { method });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe(`${omit} query parameter is required`);
  }
}

/** Every listed body field must be required (400 when omitted/falsy). */
async function expectAllBodyRequired(
  path: string,
  body: Record<string, any>,
  names: string[],
  method: "POST" | "PUT" = "POST"
) {
  for (const omit of names) {
    const partial: Record<string, any> = {};
    for (const key of names) if (key !== omit) partial[key] = body[key];
    const res = await router.request(path, {
      method,
      body: JSON.stringify(partial),
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe(`${omit} is required`);
  }
}

beforeEach(() => {
  mockSend.mockReset();
});

describe("SSO Admin routes", () => {
  // ── Instances ────────────────────────────────────────

  it("GET /instances — sends ListInstancesCommand and maps rows", async () => {
    mockSend.mockResolvedValueOnce({
      Instances: [
        {
          InstanceArn: INSTANCE,
          IdentityStoreId: "d-9067f2a3c1",
          Name: "floci-identity-center",
          OwnerAccountId: "123456789012",
          Status: "ACTIVE",
        },
      ],
    });
    const res = await get("/instances");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.instances).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.instances[0].InstanceArn).toBe(INSTANCE);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListInstancesCommand");
  });

  it("GET /instances — falls back to empty when Instances undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/instances");
    const body = await res.json();
    expect(body.instances).toEqual([]);
    expect(body.total).toBe(0);
  });

  // ── Permission Sets ──────────────────────────────────

  it("GET /permission-sets — lists and enriches via describe", async () => {
    const arn2 = PS_ARN.replace("aaaaaaaa", "bbbbbbbb");
    mockSend.mockImplementation(async (cmd: any) => {
      if (cmd.__cmdName === "ListPermissionSetsCommand")
        return { PermissionSets: [PS_ARN, arn2] };
      return { PermissionSet: { PermissionSetArn: cmd.PermissionSetArn, Name: `ps-${cmd.PermissionSetArn.slice(-4)}`, SessionDuration: "PT1H" } };
    });
    const res = await get(`/permission-sets?instanceArn=${INSTANCE}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(2);
    expect(body.permissionSets[0].PermissionSetArn).toBe(PS_ARN);
    expect(body.permissionSets[0].Name).toContain("ps-");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListPermissionSetsCommand");
    expect(mockSend.mock.calls[1][0].__cmdName).toBe("DescribePermissionSetCommand");
    expect(mockSend.mock.calls[1][0].InstanceArn).toBe(INSTANCE);
    expect(mockSend.mock.calls[1][0].PermissionSetArn).toBe(PS_ARN);
  });

  it("GET /permission-sets — empty when PermissionSets undefined (no describes)", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/permission-sets?instanceArn=${INSTANCE}`);
    const body = await res.json();
    expect(body.permissionSets).toEqual([]);
    expect(body.total).toBe(0);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("GET /permission-sets — describe without PermissionSet spreads nothing", async () => {
    mockSend.mockImplementation(async (cmd: any) => {
      if (cmd.__cmdName === "ListPermissionSetsCommand") return { PermissionSets: [PS_ARN] };
      return {};
    });
    const res = await get(`/permission-sets?instanceArn=${INSTANCE}`);
    const body = await res.json();
    expect(body.permissionSets).toEqual([{ PermissionSetArn: PS_ARN }]);
  });

  it("GET /permission-sets — 400 when instanceArn missing", async () => {
    const res = await get("/permission-sets");
    expect(res.status).toBe(400);
  });

  it("POST /permission-sets — creates a permission set", async () => {
    mockSend.mockResolvedValueOnce({
      PermissionSet: { PermissionSetArn: PS_ARN, Name: "admins" },
    });
    const res = await post("/permission-sets", {
      instanceArn: INSTANCE,
      name: "admins",
      description: "Admins",
      sessionDuration: "PT2H",
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.permissionSet.Name).toBe("admins");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("CreatePermissionSetCommand");
    expect(cmd.Name).toBe("admins");
    expect(cmd.SessionDuration).toBe("PT2H");
  });

  it("POST /permission-sets — null permissionSet when response omits it", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/permission-sets", { instanceArn: INSTANCE, name: "admins" });
    const body = await res.json();
    expect(body.permissionSet).toBeNull();
  });

  it("POST /permission-sets — 400 when instanceArn or name missing", async () => {
    await expectAllBodyRequired("/permission-sets", { instanceArn: INSTANCE, name: "admins" }, [
      "instanceArn",
      "name",
    ]);
  });

  it("GET /permission-sets/detail — describes a permission set", async () => {
    mockSend.mockResolvedValueOnce({
      PermissionSet: { PermissionSetArn: PS_ARN, Name: "admins", Description: "d", SessionDuration: "PT1H" },
    });
    const res = await get(
      `/permission-sets/detail?instanceArn=${INSTANCE}&permissionSetArn=${PS_ARN}`
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.permissionSet.Name).toBe("admins");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DescribePermissionSetCommand");
  });

  it("GET /permission-sets/detail — null when PermissionSet undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(
      `/permission-sets/detail?instanceArn=${INSTANCE}&permissionSetArn=${PS_ARN}`
    );
    const body = await res.json();
    expect(body.permissionSet).toBeNull();
  });

  it("GET /permission-sets/detail — 400 when params missing", async () => {
    await expectAllQueryRequired("/permission-sets/detail", {
      instanceArn: INSTANCE,
      permissionSetArn: PS_ARN,
    });
  });

  it("PUT /permission-sets — updates description and session", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/permission-sets", {
      instanceArn: INSTANCE,
      permissionSetArn: PS_ARN,
      description: "new",
      sessionDuration: "PT3H",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("UpdatePermissionSetCommand");
    expect(cmd.Description).toBe("new");
    expect(cmd.SessionDuration).toBe("PT3H");
  });

  it("PUT /permission-sets — omits description/session when not provided", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/permission-sets", {
      instanceArn: INSTANCE,
      permissionSetArn: PS_ARN,
    });
    expect(res.status).toBe(200);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.Description).toBeUndefined();
    expect(cmd.SessionDuration).toBeUndefined();
  });

  it("PUT /permission-sets — 400 when params missing", async () => {
    await expectAllBodyRequired(
      "/permission-sets",
      { instanceArn: INSTANCE, permissionSetArn: PS_ARN },
      ["instanceArn", "permissionSetArn"],
      "PUT"
    );
  });

  it("DELETE /permission-sets — deletes", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del(`/permission-sets?instanceArn=${INSTANCE}&permissionSetArn=${PS_ARN}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeletePermissionSetCommand");
  });

  it("DELETE /permission-sets — 400 when params missing", async () => {
    await expectAllQueryRequired(
      "/permission-sets",
      { instanceArn: INSTANCE, permissionSetArn: PS_ARN },
      "DELETE"
    );
  });

  // ── Managed Policies ─────────────────────────────────

  it("GET /managed-policies — lists attached policies", async () => {
    mockSend.mockResolvedValueOnce({
      AttachedManagedPolicies: [
        { Arn: "arn:aws:iam::aws:policy/AdministratorAccess", Name: "AdministratorAccess" },
      ],
    });
    const res = await get(`/managed-policies?instanceArn=${INSTANCE}&permissionSetArn=${PS_ARN}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.policies[0].Name).toBe("AdministratorAccess");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe(
      "ListManagedPoliciesInPermissionSetCommand"
    );
  });

  it("GET /managed-policies — empty when none", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/managed-policies?instanceArn=${INSTANCE}&permissionSetArn=${PS_ARN}`);
    const body = await res.json();
    expect(body.policies).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("GET /managed-policies — 400 when params missing", async () => {
    await expectAllQueryRequired("/managed-policies", {
      instanceArn: INSTANCE,
      permissionSetArn: PS_ARN,
    });
  });

  it("POST /managed-policies — attaches", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/managed-policies", {
      instanceArn: INSTANCE,
      permissionSetArn: PS_ARN,
      managedPolicyArn: "arn:aws:iam::aws:policy/ReadOnlyAccess",
    });
    expect(res.status).toBe(201);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("AttachManagedPolicyToPermissionSetCommand");
    expect(cmd.ManagedPolicyArn).toContain("ReadOnlyAccess");
  });

  it("POST /managed-policies — 400 when fields missing", async () => {
    await expectAllBodyRequired(
      "/managed-policies",
      { instanceArn: INSTANCE, permissionSetArn: PS_ARN, managedPolicyArn: "arn:x" },
      ["instanceArn", "permissionSetArn", "managedPolicyArn"]
    );
  });

  it("DELETE /managed-policies — detaches", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del(
      `/managed-policies?instanceArn=${INSTANCE}&permissionSetArn=${PS_ARN}&managedPolicyArn=arn:x`
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.detached).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe(
      "DetachManagedPolicyFromPermissionSetCommand"
    );
  });

  it("DELETE /managed-policies — 400 when params missing", async () => {
    await expectAllQueryRequired(
      "/managed-policies",
      { instanceArn: INSTANCE, permissionSetArn: PS_ARN, managedPolicyArn: "arn:x" },
      "DELETE"
    );
  });

  // ── Customer Managed Policy References ───────────────

  it("GET /customer-managed-policies — lists references", async () => {
    mockSend.mockResolvedValueOnce({
      CustomerManagedPolicyReferences: [{ Name: "cust-policy", Path: "/team/" }],
    });
    const res = await get(
      `/customer-managed-policies?instanceArn=${INSTANCE}&permissionSetArn=${PS_ARN}`
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.references[0].Name).toBe("cust-policy");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe(
      "ListCustomerManagedPolicyReferencesInPermissionSetCommand"
    );
  });

  it("GET /customer-managed-policies — empty when none", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(
      `/customer-managed-policies?instanceArn=${INSTANCE}&permissionSetArn=${PS_ARN}`
    );
    const body = await res.json();
    expect(body.references).toEqual([]);
  });

  it("GET /customer-managed-policies — 400 when params missing", async () => {
    await expectAllQueryRequired("/customer-managed-policies", {
      instanceArn: INSTANCE,
      permissionSetArn: PS_ARN,
    });
  });

  it("POST /customer-managed-policies — attaches with name and path", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/customer-managed-policies", {
      instanceArn: INSTANCE,
      permissionSetArn: PS_ARN,
      name: "cust-policy",
      path: "/team/",
    });
    expect(res.status).toBe(201);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("AttachCustomerManagedPolicyReferenceToPermissionSetCommand");
    expect(cmd.CustomerManagedPolicyReference).toEqual({ Name: "cust-policy", Path: "/team/" });
  });

  it("POST /customer-managed-policies — 400 when fields missing", async () => {
    await expectAllBodyRequired(
      "/customer-managed-policies",
      { instanceArn: INSTANCE, permissionSetArn: PS_ARN, name: "cust" },
      ["instanceArn", "permissionSetArn", "name"]
    );
  });

  it("DELETE /customer-managed-policies — detaches", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del(
      `/customer-managed-policies?instanceArn=${INSTANCE}&permissionSetArn=${PS_ARN}&name=cust&path=/team/`
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.detached).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DetachCustomerManagedPolicyReferenceFromPermissionSetCommand");
    expect(cmd.CustomerManagedPolicyReference).toEqual({ Name: "cust", Path: "/team/" });
  });

  it("DELETE /customer-managed-policies — 400 when params missing", async () => {
    await expectAllQueryRequired(
      "/customer-managed-policies",
      { instanceArn: INSTANCE, permissionSetArn: PS_ARN, name: "cust" },
      "DELETE"
    );
  });

  // ── Inline Policy ────────────────────────────────────

  it("GET /inline-policy — returns the inline policy", async () => {
    mockSend.mockResolvedValueOnce({ InlinePolicy: '{"Version":"2012-10-17"}' });
    const res = await get(`/inline-policy?instanceArn=${INSTANCE}&permissionSetArn=${PS_ARN}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.inlinePolicy).toContain("2012-10-17");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetInlinePolicyForPermissionSetCommand");
  });

  it("GET /inline-policy — empty string when no policy", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/inline-policy?instanceArn=${INSTANCE}&permissionSetArn=${PS_ARN}`);
    const body = await res.json();
    expect(body.inlinePolicy).toBe("");
  });

  it("GET /inline-policy — 400 when params missing", async () => {
    await expectAllQueryRequired("/inline-policy", {
      instanceArn: INSTANCE,
      permissionSetArn: PS_ARN,
    });
  });

  it("PUT /inline-policy — saves the policy", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/inline-policy", {
      instanceArn: INSTANCE,
      permissionSetArn: PS_ARN,
      inlinePolicy: '{"Version":"2012-10-17"}',
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.saved).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("PutInlinePolicyToPermissionSetCommand");
  });

  it("PUT /inline-policy — 400 when fields missing", async () => {
    await expectAllBodyRequired(
      "/inline-policy",
      { instanceArn: INSTANCE, permissionSetArn: PS_ARN, inlinePolicy: "{}" },
      ["instanceArn", "permissionSetArn", "inlinePolicy"],
      "PUT"
    );
  });

  it("DELETE /inline-policy — deletes the policy", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del(`/inline-policy?instanceArn=${INSTANCE}&permissionSetArn=${PS_ARN}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteInlinePolicyFromPermissionSetCommand");
  });

  it("DELETE /inline-policy — 400 when params missing", async () => {
    await expectAllQueryRequired(
      "/inline-policy",
      { instanceArn: INSTANCE, permissionSetArn: PS_ARN },
      "DELETE"
    );
  });

  // ── Permissions Boundary ─────────────────────────────

  it("GET /permissions-boundary — returns the boundary", async () => {
    mockSend.mockResolvedValueOnce({
      PermissionsBoundary: { ManagedPolicyArn: "arn:aws:iam::aws:policy/ReadOnlyAccess" },
    });
    const res = await get(
      `/permissions-boundary?instanceArn=${INSTANCE}&permissionSetArn=${PS_ARN}`
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.permissionsBoundary.ManagedPolicyArn).toContain("ReadOnlyAccess");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe(
      "GetPermissionsBoundaryForPermissionSetCommand"
    );
  });

  it("GET /permissions-boundary — null when no boundary", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(
      `/permissions-boundary?instanceArn=${INSTANCE}&permissionSetArn=${PS_ARN}`
    );
    const body = await res.json();
    expect(body.permissionsBoundary).toBeNull();
  });

  it("GET /permissions-boundary — 400 when params missing", async () => {
    await expectAllQueryRequired("/permissions-boundary", {
      instanceArn: INSTANCE,
      permissionSetArn: PS_ARN,
    });
  });

  it("PUT /permissions-boundary — puts a managed policy boundary", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/permissions-boundary", {
      instanceArn: INSTANCE,
      permissionSetArn: PS_ARN,
      managedPolicyArn: "arn:aws:iam::aws:policy/ReadOnlyAccess",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.saved).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("PutPermissionsBoundaryToPermissionSetCommand");
    expect(cmd.PermissionsBoundary).toEqual({
      ManagedPolicyArn: "arn:aws:iam::aws:policy/ReadOnlyAccess",
    });
  });

  it("PUT /permissions-boundary — puts a customer managed reference boundary", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/permissions-boundary", {
      instanceArn: INSTANCE,
      permissionSetArn: PS_ARN,
      customerName: "cust-boundary",
      customerPath: "/team/",
    });
    expect(res.status).toBe(200);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.PermissionsBoundary).toEqual({
      CustomerManagedPolicyReference: { Name: "cust-boundary", Path: "/team/" },
    });
  });

  it("PUT /permissions-boundary — 400 when neither boundary type given", async () => {
    const res = await put("/permissions-boundary", {
      instanceArn: INSTANCE,
      permissionSetArn: PS_ARN,
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("managedPolicyArn or customerName is required");
  });

  it("PUT /permissions-boundary — 400 when params missing", async () => {
    await expectAllBodyRequired(
      "/permissions-boundary",
      { instanceArn: INSTANCE, permissionSetArn: PS_ARN, managedPolicyArn: "arn:x" },
      ["instanceArn", "permissionSetArn"],
      "PUT"
    );
  });

  it("DELETE /permissions-boundary — deletes the boundary", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del(
      `/permissions-boundary?instanceArn=${INSTANCE}&permissionSetArn=${PS_ARN}`
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe(
      "DeletePermissionsBoundaryFromPermissionSetCommand"
    );
  });

  it("DELETE /permissions-boundary — 400 when params missing", async () => {
    await expectAllQueryRequired(
      "/permissions-boundary",
      { instanceArn: INSTANCE, permissionSetArn: PS_ARN },
      "DELETE"
    );
  });

  // ── Tags ─────────────────────────────────────────────

  it("GET /tags — lists resource tags", async () => {
    mockSend.mockResolvedValueOnce({
      Tags: [
        { Key: "env", Value: "dev" },
        { Key: "team", Value: "platform" },
      ],
    });
    const res = await get(`/tags?resourceArn=${PS_ARN}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(2);
    expect(body.tags[0]).toEqual({ key: "env", value: "dev" });
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListTagsForResourceCommand");
    expect(mockSend.mock.calls[0][0].ResourceArn).toBe(PS_ARN);
  });

  it("GET /tags — empty when no tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/tags?resourceArn=${PS_ARN}`);
    const body = await res.json();
    expect(body.tags).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("GET /tags — 400 when resourceArn missing", async () => {
    const res = await get("/tags");
    expect(res.status).toBe(400);
  });

  it("POST /tags — tags a resource", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/tags", { resourceArn: PS_ARN, tags: { env: "dev" } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tagged).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("TagResourceCommand");
    expect(cmd.Tags).toEqual([{ Key: "env", Value: "dev" }]);
  });

  it("POST /tags — 400 when resourceArn missing", async () => {
    const res = await post("/tags", { tags: { env: "dev" } });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("resourceArn is required");
  });

  it("POST /tags — 400 when tags empty object", async () => {
    const res = await post("/tags", { resourceArn: PS_ARN, tags: {} });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("tags is required");
  });

  it("POST /tags — 400 when tags missing", async () => {
    const res = await post("/tags", { resourceArn: PS_ARN });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("tags is required");
  });

  it("POST /tags/untag — removes tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/tags/untag", { resourceArn: PS_ARN, tagKeys: ["env"] });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.untagged).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("UntagResourceCommand");
    expect(cmd.TagKeys).toEqual(["env"]);
  });

  it("POST /tags/untag — 400 when resourceArn missing", async () => {
    const res = await post("/tags/untag", { tagKeys: ["env"] });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("resourceArn is required");
  });

  it("POST /tags/untag — 400 when tagKeys empty array", async () => {
    const res = await post("/tags/untag", { resourceArn: PS_ARN, tagKeys: [] });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("tagKeys is required");
  });

  it("POST /tags/untag — 400 when tagKeys missing", async () => {
    const res = await post("/tags/untag", { resourceArn: PS_ARN });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("tagKeys is required");
  });

  // ── Account Assignments ──────────────────────────────

  it("GET /account-assignments — lists assignments", async () => {
    mockSend.mockResolvedValueOnce({
      AccountAssignments: [
        {
          AccountId: "111122223333",
          PermissionSetArn: PS_ARN,
          PrincipalId: "user-uuid",
          PrincipalType: "USER",
        },
      ],
    });
    const res = await get(
      `/account-assignments?instanceArn=${INSTANCE}&accountId=111122223333&permissionSetArn=${PS_ARN}`
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.assignments[0].PrincipalType).toBe("USER");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListAccountAssignmentsCommand");
  });

  it("GET /account-assignments — empty when none", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(
      `/account-assignments?instanceArn=${INSTANCE}&accountId=111122223333&permissionSetArn=${PS_ARN}`
    );
    const body = await res.json();
    expect(body.assignments).toEqual([]);
  });

  it("GET /account-assignments — 400 when params missing", async () => {
    await expectAllQueryRequired("/account-assignments", {
      instanceArn: INSTANCE,
      accountId: "111122223333",
      permissionSetArn: PS_ARN,
    });
  });

  it("POST /account-assignments — creates an assignment", async () => {
    mockSend.mockResolvedValueOnce({
      AccountAssignmentCreationStatus: { RequestId: "req-1", Status: "SUCCEEDED" },
    });
    const res = await post("/account-assignments", {
      instanceArn: INSTANCE,
      targetId: "111122223333",
      permissionSetArn: PS_ARN,
      principalId: "user-uuid",
      principalType: "USER",
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.creationStatus.Status).toBe("SUCCEEDED");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("CreateAccountAssignmentCommand");
    expect(cmd.TargetType).toBe("AWS_ACCOUNT");
  });

  it("POST /account-assignments — null creationStatus when response omits it", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/account-assignments", {
      instanceArn: INSTANCE,
      targetId: "111122223333",
      permissionSetArn: PS_ARN,
      principalId: "user-uuid",
      principalType: "USER",
    });
    const body = await res.json();
    expect(body.creationStatus).toBeNull();
  });

  it("POST /account-assignments — 400 when fields missing", async () => {
    await expectAllBodyRequired(
      "/account-assignments",
      {
        instanceArn: INSTANCE,
        targetId: "111122223333",
        permissionSetArn: PS_ARN,
        principalId: "p",
        principalType: "USER",
      },
      ["instanceArn", "targetId", "permissionSetArn", "principalId", "principalType"]
    );
  });

  it("DELETE /account-assignments — deletes an assignment", async () => {
    mockSend.mockResolvedValueOnce({
      AccountAssignmentDeletionStatus: { RequestId: "req-2", Status: "SUCCEEDED" },
    });
    const res = await del(
      `/account-assignments?instanceArn=${INSTANCE}&targetId=111122223333&permissionSetArn=${PS_ARN}&principalId=user-uuid&principalType=USER`
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deletionStatus.Status).toBe("SUCCEEDED");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DeleteAccountAssignmentCommand");
    expect(cmd.TargetType).toBe("AWS_ACCOUNT");
  });

  it("DELETE /account-assignments — null deletionStatus when response omits it", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del(
      `/account-assignments?instanceArn=${INSTANCE}&targetId=111122223333&permissionSetArn=${PS_ARN}&principalId=user-uuid&principalType=USER`
    );
    const body = await res.json();
    expect(body.deletionStatus).toBeNull();
  });

  it("DELETE /account-assignments — 400 when params missing", async () => {
    await expectAllQueryRequired(
      "/account-assignments",
      {
        instanceArn: INSTANCE,
        targetId: "111122223333",
        permissionSetArn: PS_ARN,
        principalId: "user-uuid",
        principalType: "USER",
      },
      "DELETE"
    );
  });

  it("GET /assignment-creation-status — lists statuses without filter", async () => {
    mockSend.mockResolvedValueOnce({
      AccountAssignmentsCreationStatus: [{ RequestId: "r1", Status: "SUCCEEDED" }],
    });
    const res = await get(`/assignment-creation-status?instanceArn=${INSTANCE}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("ListAccountAssignmentCreationStatusCommand");
    expect(cmd.Filter).toBeUndefined();
  });

  it("GET /assignment-creation-status — passes Status filter", async () => {
    mockSend.mockResolvedValueOnce({ AccountAssignmentsCreationStatus: [] });
    const res = await get(`/assignment-creation-status?instanceArn=${INSTANCE}&status=FAILED`);
    const body = await res.json();
    expect(body.statuses).toEqual([]);
    expect(mockSend.mock.calls[0][0].Filter).toEqual({ Status: "FAILED" });
  });

  it("GET /assignment-creation-status — empty when response omits array", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/assignment-creation-status?instanceArn=${INSTANCE}`);
    const body = await res.json();
    expect(body.statuses).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("GET /assignment-creation-status — 400 when instanceArn missing", async () => {
    const res = await get("/assignment-creation-status");
    expect(res.status).toBe(400);
  });

  it("GET /assignment-creation-status/:requestId — describes status", async () => {
    mockSend.mockResolvedValueOnce({
      AccountAssignmentCreationStatus: { RequestId: "r1", Status: "SUCCEEDED" },
    });
    const res = await get(`/assignment-creation-status/r1?instanceArn=${INSTANCE}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status.RequestId).toBe("r1");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe(
      "DescribeAccountAssignmentCreationStatusCommand"
    );
    expect(mockSend.mock.calls[0][0].AccountAssignmentCreationRequestId).toBe("r1");
  });

  it("GET /assignment-creation-status/:requestId — null when response omits it", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/assignment-creation-status/r1?instanceArn=${INSTANCE}`);
    const body = await res.json();
    expect(body.status).toBeNull();
  });

  it("GET /assignment-creation-status/:requestId — 400 when instanceArn missing", async () => {
    const res = await get("/assignment-creation-status/r1");
    expect(res.status).toBe(400);
  });

  it("GET /assignment-deletion-status — lists statuses without filter", async () => {
    mockSend.mockResolvedValueOnce({
      AccountAssignmentsDeletionStatus: [{ RequestId: "r2", Status: "SUCCEEDED" }],
    });
    const res = await get(`/assignment-deletion-status?instanceArn=${INSTANCE}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe(
      "ListAccountAssignmentDeletionStatusCommand"
    );
    expect(mockSend.mock.calls[0][0].Filter).toBeUndefined();
  });

  it("GET /assignment-deletion-status — passes Status filter", async () => {
    mockSend.mockResolvedValueOnce({ AccountAssignmentsDeletionStatus: [] });
    const res = await get(`/assignment-deletion-status?instanceArn=${INSTANCE}&status=SUCCEEDED`);
    const body = await res.json();
    expect(body.statuses).toEqual([]);
    expect(mockSend.mock.calls[0][0].Filter).toEqual({ Status: "SUCCEEDED" });
  });

  it("GET /assignment-deletion-status — empty when response omits array", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/assignment-deletion-status?instanceArn=${INSTANCE}`);
    const body = await res.json();
    expect(body.statuses).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("GET /assignment-deletion-status — 400 when instanceArn missing", async () => {
    const res = await get("/assignment-deletion-status");
    expect(res.status).toBe(400);
  });

  it("GET /assignment-deletion-status/:requestId — describes status", async () => {
    mockSend.mockResolvedValueOnce({
      AccountAssignmentDeletionStatus: { RequestId: "r2", Status: "SUCCEEDED" },
    });
    const res = await get(`/assignment-deletion-status/r2?instanceArn=${INSTANCE}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status.RequestId).toBe("r2");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe(
      "DescribeAccountAssignmentDeletionStatusCommand"
    );
  });

  it("GET /assignment-deletion-status/:requestId — null when response omits it", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/assignment-deletion-status/r2?instanceArn=${INSTANCE}`);
    const body = await res.json();
    expect(body.status).toBeNull();
  });

  it("GET /assignment-deletion-status/:requestId — 400 when instanceArn missing", async () => {
    const res = await get("/assignment-deletion-status/r2");
    expect(res.status).toBe(400);
  });

  // ── Permission Set Provisioning ──────────────────────

  it("GET /permission-set-provisioning-status — lists statuses", async () => {
    mockSend.mockResolvedValueOnce({
      PermissionSetsProvisioningStatus: [{ RequestId: "r3", Status: "SUCCEEDED" }],
    });
    const res = await get(`/permission-set-provisioning-status?instanceArn=${INSTANCE}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe(
      "ListPermissionSetProvisioningStatusCommand"
    );
    expect(mockSend.mock.calls[0][0].Filter).toBeUndefined();
  });

  it("GET /permission-set-provisioning-status — passes Status filter", async () => {
    mockSend.mockResolvedValueOnce({ PermissionSetsProvisioningStatus: [] });
    const res = await get(`/permission-set-provisioning-status?instanceArn=${INSTANCE}&status=FAILED`);
    const body = await res.json();
    expect(body.statuses).toEqual([]);
    expect(mockSend.mock.calls[0][0].Filter).toEqual({ Status: "FAILED" });
  });

  it("GET /permission-set-provisioning-status — empty when response omits array", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/permission-set-provisioning-status?instanceArn=${INSTANCE}`);
    const body = await res.json();
    expect(body.statuses).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("GET /permission-set-provisioning-status — 400 when instanceArn missing", async () => {
    const res = await get("/permission-set-provisioning-status");
    expect(res.status).toBe(400);
  });

  it("GET /permission-set-provisioning-status/:requestId — describes status", async () => {
    mockSend.mockResolvedValueOnce({
      PermissionSetProvisioningStatus: { RequestId: "r3", Status: "SUCCEEDED" },
    });
    const res = await get(`/permission-set-provisioning-status/r3?instanceArn=${INSTANCE}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status.RequestId).toBe("r3");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe(
      "DescribePermissionSetProvisioningStatusCommand"
    );
    expect(mockSend.mock.calls[0][0].ProvisionPermissionSetRequestId).toBe("r3");
  });

  it("GET /permission-set-provisioning-status/:requestId — null when response omits it", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/permission-set-provisioning-status/r3?instanceArn=${INSTANCE}`);
    const body = await res.json();
    expect(body.status).toBeNull();
  });

  it("GET /permission-set-provisioning-status/:requestId — 400 when instanceArn missing", async () => {
    const res = await get("/permission-set-provisioning-status/r3");
    expect(res.status).toBe(400);
  });

  it("POST /provision-permission-set — provisions to one account", async () => {
    mockSend.mockResolvedValueOnce({
      PermissionSetProvisioningStatus: { RequestId: "r4", Status: "SUCCEEDED" },
    });
    const res = await post("/provision-permission-set", {
      instanceArn: INSTANCE,
      permissionSetArn: PS_ARN,
      targetType: "AWS_ACCOUNT",
      targetId: "111122223333",
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.provisioningStatus.Status).toBe("SUCCEEDED");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("ProvisionPermissionSetCommand");
    expect(cmd.TargetId).toBe("111122223333");
  });

  it("POST /provision-permission-set — all accounts omits TargetId", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/provision-permission-set", {
      instanceArn: INSTANCE,
      permissionSetArn: PS_ARN,
      targetType: "ALL_PROVISIONED_ACCOUNTS",
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.provisioningStatus).toBeNull();
    expect(mockSend.mock.calls[0][0].TargetId).toBeUndefined();
  });

  it("POST /provision-permission-set — 400 when fields missing", async () => {
    await expectAllBodyRequired(
      "/provision-permission-set",
      { instanceArn: INSTANCE, permissionSetArn: PS_ARN, targetType: "AWS_ACCOUNT" },
      ["instanceArn", "permissionSetArn", "targetType"]
    );
  });

  it("GET /accounts-for-provisioned-permission-set — lists account ids", async () => {
    mockSend.mockResolvedValueOnce({ AccountIds: ["111122223333", "444455556666"] });
    const res = await get(
      `/accounts-for-provisioned-permission-set?instanceArn=${INSTANCE}&permissionSetArn=${PS_ARN}`
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(2);
    expect(body.accountIds[0]).toBe("111122223333");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe(
      "ListAccountsForProvisionedPermissionSetCommand"
    );
  });

  it("GET /accounts-for-provisioned-permission-set — empty when none", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(
      `/accounts-for-provisioned-permission-set?instanceArn=${INSTANCE}&permissionSetArn=${PS_ARN}`
    );
    const body = await res.json();
    expect(body.accountIds).toEqual([]);
  });

  it("GET /accounts-for-provisioned-permission-set — 400 when params missing", async () => {
    await expectAllQueryRequired("/accounts-for-provisioned-permission-set", {
      instanceArn: INSTANCE,
      permissionSetArn: PS_ARN,
    });
  });

  // ── Trusted Token Issuers ────────────────────────────

  it("GET /trusted-token-issuers — lists issuers", async () => {
    mockSend.mockResolvedValueOnce({
      TrustedTokenIssuers: [
        { Name: "okta", TrustedTokenIssuerArn: TTI_ARN, TrustedTokenIssuerType: "OIDC_JWT" },
      ],
    });
    const res = await get(`/trusted-token-issuers?instanceArn=${INSTANCE}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.trustedTokenIssuers[0].Name).toBe("okta");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListTrustedTokenIssuersCommand");
  });

  it("GET /trusted-token-issuers — empty when none", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/trusted-token-issuers?instanceArn=${INSTANCE}`);
    const body = await res.json();
    expect(body.trustedTokenIssuers).toEqual([]);
  });

  it("GET /trusted-token-issuers — 400 when instanceArn missing", async () => {
    const res = await get("/trusted-token-issuers");
    expect(res.status).toBe(400);
  });

  it("POST /trusted-token-issuers — creates an OIDC_JWT issuer", async () => {
    mockSend.mockResolvedValueOnce({ TrustedTokenIssuerArn: TTI_ARN });
    const res = await post("/trusted-token-issuers", {
      instanceArn: INSTANCE,
      name: "okta",
      issuerUrl: "https://okta.example.com",
      claimAttributePath: "sub",
      identityStoreAttributePath: "userName",
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.trustedTokenIssuerArn).toBe(TTI_ARN);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("CreateTrustedTokenIssuerCommand");
    expect(cmd.TrustedTokenIssuerType).toBe("OIDC_JWT");
    expect(cmd.TrustedTokenIssuerConfiguration.OidcJwtConfiguration).toEqual({
      ClaimAttributePath: "sub",
      IdentityStoreAttributePath: "userName",
      IssuerUrl: "https://okta.example.com",
      JwksRetrievalOption: "OPEN_ID_DISCOVERY",
    });
  });

  it("POST /trusted-token-issuers — 400 when fields missing", async () => {
    await expectAllBodyRequired(
      "/trusted-token-issuers",
      {
        instanceArn: INSTANCE,
        name: "okta",
        issuerUrl: "https://okta.example.com",
        claimAttributePath: "sub",
        identityStoreAttributePath: "userName",
      },
      ["instanceArn", "name", "issuerUrl", "claimAttributePath", "identityStoreAttributePath"]
    );
  });

  it("GET /trusted-token-issuers/detail — describes an issuer", async () => {
    mockSend.mockResolvedValueOnce({
      Name: "okta",
      TrustedTokenIssuerArn: TTI_ARN,
      TrustedTokenIssuerConfiguration: {
        OidcJwtConfiguration: { IssuerUrl: "https://okta.example.com" },
      },
    });
    const res = await get(`/trusted-token-issuers/detail?trustedTokenIssuerArn=${TTI_ARN}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.trustedTokenIssuer.Name).toBe("okta");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DescribeTrustedTokenIssuerCommand");
  });

  it("GET /trusted-token-issuers/detail — null when response empty", async () => {
    mockSend.mockResolvedValueOnce(undefined);
    const res = await get(`/trusted-token-issuers/detail?trustedTokenIssuerArn=${TTI_ARN}`);
    const body = await res.json();
    expect(body.trustedTokenIssuer).toBeNull();
  });

  it("GET /trusted-token-issuers/detail — 400 when arn missing", async () => {
    const res = await get("/trusted-token-issuers/detail");
    expect(res.status).toBe(400);
  });

  it("PUT /trusted-token-issuers — updates name and OIDC config", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/trusted-token-issuers", {
      trustedTokenIssuerArn: TTI_ARN,
      name: "okta-2",
      claimAttributePath: "email",
      identityStoreAttributePath: "email",
      jwksRetrievalOption: "OPEN_ID_DISCOVERY",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("UpdateTrustedTokenIssuerCommand");
    expect(cmd.Name).toBe("okta-2");
    expect(cmd.TrustedTokenIssuerConfiguration.OidcJwtConfiguration).toEqual({
      ClaimAttributePath: "email",
      IdentityStoreAttributePath: "email",
      JwksRetrievalOption: "OPEN_ID_DISCOVERY",
    });
  });

  it("PUT /trusted-token-issuers — arn only omits name and config", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/trusted-token-issuers", { trustedTokenIssuerArn: TTI_ARN });
    expect(res.status).toBe(200);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.Name).toBeUndefined();
    expect(cmd.TrustedTokenIssuerConfiguration).toBeUndefined();
  });

  it("PUT /trusted-token-issuers — 400 when arn missing", async () => {
    const res = await put("/trusted-token-issuers", {});
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("trustedTokenIssuerArn is required");
  });

  it("DELETE /trusted-token-issuers — deletes an issuer", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del(`/trusted-token-issuers?trustedTokenIssuerArn=${TTI_ARN}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteTrustedTokenIssuerCommand");
  });

  it("DELETE /trusted-token-issuers — 400 when arn missing", async () => {
    const res = await del("/trusted-token-issuers");
    expect(res.status).toBe(400);
  });

  // ── Instance Access Control Attributes ───────────────

  it("GET /access-control-attribute-configuration — describes config", async () => {
    mockSend.mockResolvedValueOnce({
      InstanceAccessControlAttributeConfiguration: {
        AccessControlAttributes: [{ Key: "costCenter", Value: { Source: ["$.costCenter"] } }],
      },
      Status: "ENABLED",
      StatusReason: null,
    });
    const res = await get(`/access-control-attribute-configuration?instanceArn=${INSTANCE}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ENABLED");
    expect(body.configuration.AccessControlAttributes[0].Key).toBe("costCenter");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe(
      "DescribeInstanceAccessControlAttributeConfigurationCommand"
    );
  });

  it("GET /access-control-attribute-configuration — null configuration when none", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/access-control-attribute-configuration?instanceArn=${INSTANCE}`);
    const body = await res.json();
    expect(body.configuration).toBeNull();
    expect(body.status).toBeUndefined();
  });

  it("GET /access-control-attribute-configuration — 400 when instanceArn missing", async () => {
    const res = await get("/access-control-attribute-configuration");
    expect(res.status).toBe(400);
  });

  it("POST /access-control-attribute-configuration — creates config", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/access-control-attribute-configuration", {
      instanceArn: INSTANCE,
      attributes: [{ key: "costCenter", source: "$.costCenter" }],
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.created).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("CreateInstanceAccessControlAttributeConfigurationCommand");
    expect(cmd.InstanceAccessControlAttributeConfiguration).toEqual({
      AccessControlAttributes: [{ Key: "costCenter", Value: { Source: ["$.costCenter"] } }],
    });
  });

  it("POST /access-control-attribute-configuration — 400 when instanceArn missing", async () => {
    const res = await post("/access-control-attribute-configuration", {
      attributes: [{ key: "k", source: "s" }],
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("instanceArn is required");
  });

  it("POST /access-control-attribute-configuration — 400 when attributes missing", async () => {
    const res = await post("/access-control-attribute-configuration", { instanceArn: INSTANCE });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("attributes is required");
  });

  it("POST /access-control-attribute-configuration — 400 when attributes empty", async () => {
    const res = await post("/access-control-attribute-configuration", {
      instanceArn: INSTANCE,
      attributes: [],
    });
    expect(res.status).toBe(400);
  });

  it("PUT /access-control-attribute-configuration — updates config", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/access-control-attribute-configuration", {
      instanceArn: INSTANCE,
      attributes: [{ key: "dept", source: "$.dept" }],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe(
      "UpdateInstanceAccessControlAttributeConfigurationCommand"
    );
  });

  it("PUT /access-control-attribute-configuration — 400 when instanceArn missing", async () => {
    const res = await put("/access-control-attribute-configuration", {
      attributes: [{ key: "k", source: "s" }],
    });
    expect(res.status).toBe(400);
  });

  it("PUT /access-control-attribute-configuration — 400 when attributes missing", async () => {
    const res = await put("/access-control-attribute-configuration", { instanceArn: INSTANCE });
    expect(res.status).toBe(400);
  });

  it("PUT /access-control-attribute-configuration — 400 when attributes empty", async () => {
    const res = await put("/access-control-attribute-configuration", {
      instanceArn: INSTANCE,
      attributes: [],
    });
    expect(res.status).toBe(400);
  });

  it("DELETE /access-control-attribute-configuration — deletes config", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del(`/access-control-attribute-configuration?instanceArn=${INSTANCE}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe(
      "DeleteInstanceAccessControlAttributeConfigurationCommand"
    );
  });

  it("DELETE /access-control-attribute-configuration — 400 when instanceArn missing", async () => {
    const res = await del("/access-control-attribute-configuration");
    expect(res.status).toBe(400);
  });

  // ── Regions ──────────────────────────────────────────

  it("GET /regions — lists regions", async () => {
    mockSend.mockResolvedValueOnce({
      Regions: [
        { RegionName: "us-east-1", Status: "ACTIVE", IsPrimaryRegion: true },
        { RegionName: "eu-west-1", Status: "ACTIVE", IsPrimaryRegion: false },
      ],
    });
    const res = await get(`/regions?instanceArn=${INSTANCE}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(2);
    expect(body.regions[0].RegionName).toBe("us-east-1");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListRegionsCommand");
  });

  it("GET /regions — empty when none", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/regions?instanceArn=${INSTANCE}`);
    const body = await res.json();
    expect(body.regions).toEqual([]);
  });

  it("GET /regions — 400 when instanceArn missing", async () => {
    const res = await get("/regions");
    expect(res.status).toBe(400);
  });

  it("POST /regions — adds a region", async () => {
    mockSend.mockResolvedValueOnce({ Status: "ADDING" });
    const res = await post("/regions", { instanceArn: INSTANCE, regionName: "eu-west-1" });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("ADDING");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("AddRegionCommand");
    expect(cmd.RegionName).toBe("eu-west-1");
  });

  it("POST /regions — null status when response omits it", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/regions", { instanceArn: INSTANCE, regionName: "eu-west-1" });
    const body = await res.json();
    expect(body.status).toBeNull();
  });

  it("POST /regions — 400 when fields missing", async () => {
    await expectAllBodyRequired(
      "/regions",
      { instanceArn: INSTANCE, regionName: "eu-west-1" },
      ["instanceArn", "regionName"]
    );
  });

  it("DELETE /regions — removes a region", async () => {
    mockSend.mockResolvedValueOnce({ Status: "REMOVING" });
    const res = await del(`/regions?instanceArn=${INSTANCE}&regionName=eu-west-1`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("REMOVING");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("RemoveRegionCommand");
  });

  it("DELETE /regions — null status when response omits it", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del(`/regions?instanceArn=${INSTANCE}&regionName=eu-west-1`);
    const body = await res.json();
    expect(body.status).toBeNull();
  });

  it("DELETE /regions — 400 when params missing", async () => {
    await expectAllQueryRequired(
      "/regions",
      { instanceArn: INSTANCE, regionName: "eu-west-1" },
      "DELETE"
    );
  });

  // ── Error mapping (router.onError) ───────────────────

  it("maps ResourceNotFoundException by name to 404", async () => {
    const err: any = new Error("Permission set not found: x");
    err.name = "ResourceNotFoundException";
    mockSend.mockRejectedValueOnce(err);
    const res = await get(`/permissions-boundary?instanceArn=${INSTANCE}&permissionSetArn=${PS_ARN}`);
    expect(res.status).toBe(404);
    expect((await res.json()).error).toContain("not found");
  });

  it("maps ResourceNotFoundException with empty message to fallback", async () => {
    const err: any = new Error();
    err.name = "ResourceNotFoundException";
    mockSend.mockRejectedValueOnce(err);
    const res = await get(`/permissions-boundary?instanceArn=${INSTANCE}&permissionSetArn=${PS_ARN}`);
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Not found");
  });

  it("maps 'not found' messages to 404 even without error name", async () => {
    mockSend.mockRejectedValueOnce(new Error("Permission set arn not found in this instance"));
    const res = await get(`/permissions-boundary?instanceArn=${INSTANCE}&permissionSetArn=${PS_ARN}`);
    expect(res.status).toBe(404);
    expect((await res.json()).error).toContain("not found");
  });

  it("maps ValidationException by name to 400", async () => {
    const err: any = new Error("SessionDuration is invalid.");
    err.name = "ValidationException";
    mockSend.mockRejectedValueOnce(err);
    const res = await get(`/permissions-boundary?instanceArn=${INSTANCE}&permissionSetArn=${PS_ARN}`);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("SessionDuration");
  });

  it("maps HTTP 400 metadata to 400 with fallback message", async () => {
    const err: any = new Error();
    err.$metadata = { httpStatusCode: 400 };
    mockSend.mockRejectedValueOnce(err);
    const res = await get(`/permissions-boundary?instanceArn=${INSTANCE}&permissionSetArn=${PS_ARN}`);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Validation error");
  });

  it("maps ConflictException by name to 409", async () => {
    const err: any = new Error("The managed policy is already attached to the permission set.");
    err.name = "ConflictException";
    mockSend.mockRejectedValueOnce(err);
    const res = await post("/managed-policies", {
      instanceArn: INSTANCE,
      permissionSetArn: PS_ARN,
      managedPolicyArn: "arn:x",
    });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toContain("already attached");
  });

  it("maps HTTP 409 metadata to 409 with fallback message", async () => {
    const err: any = new Error();
    err.$metadata = { httpStatusCode: 409 };
    mockSend.mockRejectedValueOnce(err);
    const res = await post("/managed-policies", {
      instanceArn: INSTANCE,
      permissionSetArn: PS_ARN,
      managedPolicyArn: "arn:x",
    });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("Conflict");
  });

  it("maps other errors to 500 preserving message", async () => {
    mockSend.mockRejectedValueOnce(new Error("boom"));
    const res = await get("/instances");
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("boom");
  });

  it("maps message-less errors to 500 with fallback message", async () => {
    const err: any = new Error();
    err.name = "SomeWeirdError";
    mockSend.mockRejectedValueOnce(err);
    const res = await get("/instances");
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Internal server error");
  });
});
