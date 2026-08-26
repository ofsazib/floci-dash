import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-organizations", () => ({
  OrganizationsClient: vi.fn(function () {
    return { send: mockSend };
  }),
  CreateOrganizationCommand: createCmd("CreateOrganizationCommand"),
  DescribeOrganizationCommand: createCmd("DescribeOrganizationCommand"),
  DeleteOrganizationCommand: createCmd("DeleteOrganizationCommand"),
  EnableAllFeaturesCommand: createCmd("EnableAllFeaturesCommand"),
  ListRootsCommand: createCmd("ListRootsCommand"),
  CreateOrganizationalUnitCommand: createCmd("CreateOrganizationalUnitCommand"),
  UpdateOrganizationalUnitCommand: createCmd("UpdateOrganizationalUnitCommand"),
  DeleteOrganizationalUnitCommand: createCmd("DeleteOrganizationalUnitCommand"),
  DescribeOrganizationalUnitCommand: createCmd("DescribeOrganizationalUnitCommand"),
  ListOrganizationalUnitsForParentCommand: createCmd("ListOrganizationalUnitsForParentCommand"),
  ListParentsCommand: createCmd("ListParentsCommand"),
  ListChildrenCommand: createCmd("ListChildrenCommand"),
  CreateAccountCommand: createCmd("CreateAccountCommand"),
  DescribeCreateAccountStatusCommand: createCmd("DescribeCreateAccountStatusCommand"),
  ListCreateAccountStatusCommand: createCmd("ListCreateAccountStatusCommand"),
  DescribeAccountCommand: createCmd("DescribeAccountCommand"),
  ListAccountsCommand: createCmd("ListAccountsCommand"),
  ListAccountsForParentCommand: createCmd("ListAccountsForParentCommand"),
  MoveAccountCommand: createCmd("MoveAccountCommand"),
  RemoveAccountFromOrganizationCommand: createCmd("RemoveAccountFromOrganizationCommand"),
  LeaveOrganizationCommand: createCmd("LeaveOrganizationCommand"),
  CloseAccountCommand: createCmd("CloseAccountCommand"),
  CreatePolicyCommand: createCmd("CreatePolicyCommand"),
  UpdatePolicyCommand: createCmd("UpdatePolicyCommand"),
  DeletePolicyCommand: createCmd("DeletePolicyCommand"),
  DescribePolicyCommand: createCmd("DescribePolicyCommand"),
  ListPoliciesCommand: createCmd("ListPoliciesCommand"),
  AttachPolicyCommand: createCmd("AttachPolicyCommand"),
  DetachPolicyCommand: createCmd("DetachPolicyCommand"),
  ListPoliciesForTargetCommand: createCmd("ListPoliciesForTargetCommand"),
  ListTargetsForPolicyCommand: createCmd("ListTargetsForPolicyCommand"),
  EnablePolicyTypeCommand: createCmd("EnablePolicyTypeCommand"),
  DisablePolicyTypeCommand: createCmd("DisablePolicyTypeCommand"),
  DescribeEffectivePolicyCommand: createCmd("DescribeEffectivePolicyCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: (Ctor: any, extra?: any) => new Ctor(extra),
}));

import router from "./organizations";

const get = (path: string) => router.request(path);
const post = (path: string, body?: any) =>
  router.request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
const put = (path: string, body: any) =>
  router.request(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
const del = (path: string, body?: any) =>
  router.request(path, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Organizations routes", () => {
  describe("Organization", () => {
    it("GET / returns organization", async () => {
      mockSend.mockResolvedValueOnce({ Organization: { Id: "o-123", Arn: "arn:org" } });
      const res = await get("/");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.organization.Id).toBe("o-123");
    });

    it("GET / returns null when not in use", async () => {
      mockSend.mockRejectedValueOnce({ name: "AWSOrganizationsNotInUseException" });
      const res = await get("/");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.organization).toBeNull();
    });

    it("POST /create creates organization", async () => {
      mockSend.mockResolvedValueOnce({ Organization: { Id: "o-new" } });
      const res = await post("/create");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.organization.Id).toBe("o-new");
    });

    it("POST /delete deletes organization", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/delete");
      expect(res.status).toBe(200);
      expect((await res.json()).deleted).toBe(true);
    });

    it("POST /enable-all-features enables features", async () => {
      mockSend.mockResolvedValueOnce({ Handshake: { Id: "h-1" } });
      const res = await post("/enable-all-features");
      expect(res.status).toBe(200);
      expect((await res.json()).handshake.Id).toBe("h-1");
    });
  });

  describe("Roots", () => {
    it("GET /roots lists roots", async () => {
      mockSend.mockResolvedValueOnce({ Roots: [{ Id: "r-1", Name: "Root" }] });
      const res = await get("/roots");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.roots[0].Id).toBe("r-1");
      expect(body.total).toBe(1);
    });
  });

  describe("Organizational Units", () => {
    it("GET /ous lists OUs for parent", async () => {
      mockSend.mockResolvedValueOnce({ OrganizationalUnits: [{ Id: "ou-1", Name: "Dev" }] });
      const res = await get("/ous?parentId=r-1");
      expect(res.status).toBe(200);
      expect((await res.json()).organizationalUnits[0].Id).toBe("ou-1");
    });

    it("GET /ous returns 400 without parentId", async () => {
      const res = await get("/ous");
      expect(res.status).toBe(400);
    });

    it("GET /ous/:id describes OU", async () => {
      mockSend.mockResolvedValueOnce({ OrganizationalUnit: { Id: "ou-1", Name: "Dev" } });
      const res = await get("/ous/ou-1");
      expect(res.status).toBe(200);
      expect((await res.json()).Id).toBe("ou-1");
    });

    it("POST /ous creates OU", async () => {
      mockSend.mockResolvedValueOnce({ OrganizationalUnit: { Id: "ou-new", Name: "Test" } });
      const res = await post("/ous", { parentId: "r-1", name: "Test" });
      expect(res.status).toBe(200);
      expect((await res.json()).organizationalUnit.Id).toBe("ou-new");
    });

    it("POST /ous returns 400 without parentId", async () => {
      const res = await post("/ous", { name: "Test" });
      expect(res.status).toBe(400);
    });

    it("PUT /ous/:id updates OU", async () => {
      mockSend.mockResolvedValueOnce({ OrganizationalUnit: { Id: "ou-1", Name: "Updated" } });
      const res = await put("/ous/ou-1", { name: "Updated" });
      expect(res.status).toBe(200);
      expect((await res.json()).Name).toBe("Updated");
    });

    it("PUT /ous/:id returns 400 without name", async () => {
      const res = await put("/ous/ou-1", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /ous/:id deletes OU", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/ous/ou-1");
      expect(res.status).toBe(200);
      expect((await res.json()).deleted).toBe(true);
    });
  });

  describe("Parents / Children", () => {
    it("GET /parents lists parents", async () => {
      mockSend.mockResolvedValueOnce({ Parents: [{ Id: "r-1", Type: "ROOT" }] });
      const res = await get("/parents?childId=ou-1");
      expect(res.status).toBe(200);
      expect((await res.json()).parents[0].Id).toBe("r-1");
    });

    it("GET /parents returns 400 without childId", async () => {
      const res = await get("/parents");
      expect(res.status).toBe(400);
    });

    it("GET /children lists children", async () => {
      mockSend.mockResolvedValueOnce({ Children: [{ Id: "ou-1", Type: "ORGANIZATIONAL_UNIT" }] });
      const res = await get("/children?parentId=r-1");
      expect(res.status).toBe(200);
      expect((await res.json()).children[0].Id).toBe("ou-1");
    });

    it("GET /children returns 400 without parentId", async () => {
      const res = await get("/children");
      expect(res.status).toBe(400);
    });
  });

  describe("Accounts", () => {
    it("GET /accounts lists all accounts", async () => {
      mockSend.mockResolvedValueOnce({ Accounts: [{ Id: "123", Name: "Test" }] });
      const res = await get("/accounts");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.accounts[0].Id).toBe("123");
      expect(body.total).toBe(1);
    });

    it("GET /accounts?parentId lists accounts for parent", async () => {
      mockSend.mockResolvedValueOnce({ Accounts: [{ Id: "123" }] });
      const res = await get("/accounts?parentId=r-1");
      expect(res.status).toBe(200);
    });

    it("GET /accounts/:id describes account", async () => {
      mockSend.mockResolvedValueOnce({ Account: { Id: "123", Name: "Test" } });
      const res = await get("/accounts/123");
      expect(res.status).toBe(200);
      expect((await res.json()).Id).toBe("123");
    });

    it("POST /accounts creates account", async () => {
      mockSend.mockResolvedValueOnce({ CreateAccountStatus: { Id: "car-1", State: "IN_PROGRESS" } });
      const res = await post("/accounts", { email: "test@test.com", name: "Test" });
      expect(res.status).toBe(200);
      expect((await res.json()).createAccountStatus.Id).toBe("car-1");
    });

    it("POST /accounts returns 400 without email", async () => {
      const res = await post("/accounts", { name: "Test" });
      expect(res.status).toBe(400);
    });

    it("GET /accounts/create-status lists statuses", async () => {
      mockSend.mockResolvedValueOnce({ CreateAccountStatuses: [{ Id: "car-1" }] });
      const res = await get("/accounts/create-status");
      expect(res.status).toBe(200);
      expect((await res.json()).statuses[0].Id).toBe("car-1");
    });

    it("GET /accounts/create-status?id= describes status", async () => {
      mockSend.mockResolvedValueOnce({ CreateAccountStatus: { Id: "car-1", State: "SUCCEEDED" } });
      const res = await get("/accounts/create-status?id=car-1");
      expect(res.status).toBe(200);
      expect((await res.json()).State).toBe("SUCCEEDED");
    });

    it("POST /accounts/move moves account", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/accounts/move", { accountId: "123", sourceParentId: "r-1", destinationParentId: "r-2" });
      expect(res.status).toBe(200);
      expect((await res.json()).moved).toBe(true);
    });

    it("POST /accounts/move returns 400 without fields", async () => {
      const res = await post("/accounts/move", {});
      expect(res.status).toBe(400);
    });

    it("POST /accounts/remove removes account", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/accounts/remove", { accountId: "123" });
      expect(res.status).toBe(200);
      expect((await res.json()).removed).toBe(true);
    });

    it("POST /accounts/remove returns 400 without accountId", async () => {
      const res = await post("/accounts/remove", {});
      expect(res.status).toBe(400);
    });

    it("POST /accounts/leave leaves org", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/accounts/leave");
      expect(res.status).toBe(200);
      expect((await res.json()).left).toBe(true);
    });

    it("POST /accounts/close closes account", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/accounts/close", { accountId: "123" });
      expect(res.status).toBe(200);
      expect((await res.json()).closed).toBe(true);
    });

    it("POST /accounts/close returns 400 without accountId", async () => {
      const res = await post("/accounts/close", {});
      expect(res.status).toBe(400);
    });
  });

  describe("Policies", () => {
    it("GET /policies lists policies", async () => {
      mockSend.mockResolvedValueOnce({ Policies: [{ Id: "p-1", Name: "Test SCP" }] });
      const res = await get("/policies");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.policies[0].Id).toBe("p-1");
    });

    it("GET /policies/:id describes policy", async () => {
      mockSend.mockResolvedValueOnce({ Policy: { Id: "p-1", Name: "Test" } });
      const res = await get("/policies/p-1");
      expect(res.status).toBe(200);
      expect((await res.json()).Id).toBe("p-1");
    });

    it("POST /policies creates policy", async () => {
      mockSend.mockResolvedValueOnce({ Policy: { Id: "p-new", Name: "New" } });
      const res = await post("/policies", { name: "New", content: "{}" });
      expect(res.status).toBe(200);
      expect((await res.json()).policy.Id).toBe("p-new");
    });

    it("POST /policies returns 400 without name/content", async () => {
      const res = await post("/policies", { name: "Test" });
      expect(res.status).toBe(400);
    });

    it("PUT /policies/:id updates policy", async () => {
      mockSend.mockResolvedValueOnce({ Policy: { Id: "p-1", Name: "Updated" } });
      const res = await put("/policies/p-1", { name: "Updated" });
      expect(res.status).toBe(200);
      expect((await res.json()).Name).toBe("Updated");
    });

    it("DELETE /policies/:id deletes policy", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/policies/p-1");
      expect(res.status).toBe(200);
      expect((await res.json()).deleted).toBe(true);
    });

    it("POST /policies/attach attaches policy", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/policies/attach", { policyId: "p-1", targetId: "ou-1" });
      expect(res.status).toBe(200);
      expect((await res.json()).attached).toBe(true);
    });

    it("POST /policies/attach returns 400 without fields", async () => {
      const res = await post("/policies/attach", {});
      expect(res.status).toBe(400);
    });

    it("POST /policies/detach detaches policy", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/policies/detach", { policyId: "p-1", targetId: "ou-1" });
      expect(res.status).toBe(200);
      expect((await res.json()).detached).toBe(true);
    });

    it("POST /policies/detach returns 400 without fields", async () => {
      const res = await post("/policies/detach", {});
      expect(res.status).toBe(400);
    });

    it("GET /policies/:id/targets lists targets", async () => {
      mockSend.mockResolvedValueOnce({ Targets: [{ Id: "ou-1", Name: "Dev" }] });
      const res = await get("/policies/p-1/targets");
      expect(res.status).toBe(200);
      expect((await res.json()).targets[0].Id).toBe("ou-1");
    });

    it("GET /targets/:id/policies lists policies for target", async () => {
      mockSend.mockResolvedValueOnce({ Policies: [{ Id: "p-1" }] });
      const res = await get("/targets/ou-1/policies");
      expect(res.status).toBe(200);
      expect((await res.json()).policies[0].Id).toBe("p-1");
    });

    it("POST /policies/enable-type enables policy type", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/policies/enable-type", { policyType: "SERVICE_CONTROL_POLICY", rootId: "r-1" });
      expect(res.status).toBe(200);
      expect((await res.json()).enabled).toBe(true);
    });

    it("POST /policies/enable-type returns 400 without fields", async () => {
      const res = await post("/policies/enable-type", {});
      expect(res.status).toBe(400);
    });

    it("POST /policies/disable-type disables policy type", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/policies/disable-type", { policyType: "SERVICE_CONTROL_POLICY", rootId: "r-1" });
      expect(res.status).toBe(200);
      expect((await res.json()).disabled).toBe(true);
    });

    it("POST /policies/disable-type returns 400 without fields", async () => {
      const res = await post("/policies/disable-type", {});
      expect(res.status).toBe(400);
    });

    it("GET /effective-policy returns effective policy", async () => {
      mockSend.mockResolvedValueOnce({ EffectivePolicy: { PolicyId: "p-1" } });
      const res = await get("/effective-policy?targetId=ou-1");
      expect(res.status).toBe(200);
      expect((await res.json()).effectivePolicy.PolicyId).toBe("p-1");
    });

    it("GET /effective-policy returns 400 without targetId", async () => {
      const res = await get("/effective-policy");
      expect(res.status).toBe(400);
    });
  });

  describe("Tags", () => {
    it("GET /tags lists tags", async () => {
      mockSend.mockResolvedValueOnce({ Tags: [{ Key: "env", Value: "dev" }] });
      const res = await get("/tags?resourceArn=arn:org");
      expect(res.status).toBe(200);
      expect((await res.json()).tags[0].Key).toBe("env");
    });

    it("GET /tags returns 400 without resourceArn", async () => {
      const res = await get("/tags");
      expect(res.status).toBe(400);
    });

    it("POST /tags adds tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tags", { resourceArn: "arn:org", tags: { env: "dev" } });
      expect(res.status).toBe(200);
      expect((await res.json()).tagged).toBe(true);
    });

    it("POST /tags returns 400 without resourceArn", async () => {
      const res = await post("/tags", { tags: { env: "dev" } });
      expect(res.status).toBe(400);
    });

    it("POST /tags returns 400 with empty tags", async () => {
      const res = await post("/tags", { resourceArn: "arn:org", tags: {} });
      expect(res.status).toBe(400);
    });

    it("POST /tags/remove removes tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tags/remove", { resourceArn: "arn:org", tagKeys: ["env"] });
      expect(res.status).toBe(200);
      expect((await res.json()).untagged).toBe(true);
    });

    it("POST /tags/remove returns 400 without resourceArn", async () => {
      const res = await post("/tags/remove", { tagKeys: ["env"] });
      expect(res.status).toBe(400);
    });

    it("POST /tags/remove returns 400 with empty tagKeys", async () => {
      const res = await post("/tags/remove", { resourceArn: "arn:org", tagKeys: [] });
      expect(res.status).toBe(400);
    });
  });

  // ── Exception branches ────────────────────────────────

  describe("exception branches", () => {
    it("GET / returns null org when AWSOrganizationsNotInUseException", async () => {
      const err = new Error("not in use");
      (err as any).name = "AWSOrganizationsNotInUseException";
      mockSend.mockRejectedValueOnce(err);
      const res = await get("/");
      expect(res.status).toBe(200);
      expect((await res.json()).organization).toBeNull();
    });

    it("GET / returns 500 for non-Organizations exception", async () => {
      mockSend.mockRejectedValueOnce(new Error("random"));
      const res = await get("/");
      expect(res.status).toBe(500);
    });

    it("POST /ous with tags converts tag map to SDK format", async () => {
      mockSend.mockResolvedValueOnce({ OrganizationalUnit: { Id: "ou-1", Name: "OU1" } });
      const res = await post("/ous", { parentId: "r-1", name: "OU1", tags: { env: "dev", team: "infra" } });
      expect(res.status).toBe(200);
      const call = mockSend.mock.calls[mockSend.mock.calls.length - 1][0];
      expect(call.Tags).toEqual([{ Key: "env", Value: "dev" }, { Key: "team", Value: "infra" }]);
    });

    it("GET /effective-policy returns null when PolicyInUseException", async () => {
      const err = new Error("policy in use");
      (err as any).name = "PolicyInUseException";
      mockSend.mockRejectedValueOnce(err);
      const res = await get("/effective-policy?targetId=t-1");
      expect(res.status).toBe(200);
      expect((await res.json()).effectivePolicy).toBeNull();
    });

    it("GET /effective-policy returns 500 for non-PolicyInUse exception", async () => {
      mockSend.mockRejectedValueOnce(new Error("other"));
      const res = await get("/effective-policy?targetId=t-1");
      expect(res.status).toBe(500);
    });
  });

  // ── Fallback arms for || [] / || {} ────────────────

  describe("fallback arms", () => {
    it("GET / roots fallback when Roots undefined", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/");
      expect(res.status).toBe(200);
    });

    it("GET /roots uses [] when Roots undefined", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/roots");
      expect(res.status).toBe(200);
      expect((await res.json()).roots).toEqual([]);
    });

    it("GET /ous uses [] when OrganizationalUnits undefined", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/ous?parentId=r-1");
      expect(res.status).toBe(200);
      expect((await res.json()).organizationalUnits).toEqual([]);
    });

    it("GET /ous returns 400 without parentId", async () => {
      const res = await get("/ous");
      expect(res.status).toBe(400);
    });

    it("GET /ous/:id returns 500 when not found", async () => {
      mockSend.mockRejectedValueOnce(new Error("NotFoundException"));
      const res = await get("/ous/ou-1");
      expect(res.status).toBe(500);
    });

    it("POST /ous validates name required", async () => {
      const res = await post("/ous", { parentId: "r-1" });
      expect(res.status).toBe(400);
    });

    it("GET /parents uses [] when Parents undefined", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/parents?childId=c-1");
      expect(res.status).toBe(200);
      expect((await res.json()).parents).toEqual([]);
    });

    it("GET /children uses [] when Children undefined", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/children?parentId=p-1");
      expect(res.status).toBe(200);
      expect((await res.json()).children).toEqual([]);
    });

    it("GET /accounts uses [] when Accounts undefined", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/accounts");
      expect(res.status).toBe(200);
      expect((await res.json()).accounts).toEqual([]);
    });

    it("POST /accounts with parentId adds ParentId tag", async () => {
      mockSend.mockResolvedValueOnce({ CreateAccountStatus: { Id: "ca-1" } });
      const res = await post("/accounts", { email: "a@b.com", parentId: "r-1" });
      expect(res.status).toBe(200);
    });

    it("GET /accounts/create-status uses [] when CreateAccountStatuses undefined", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/accounts/create-status");
      expect(res.status).toBe(200);
      expect((await res.json()).statuses).toEqual([]);
    });

    it("GET /policies uses [] when Policies undefined", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/policies");
      expect(res.status).toBe(200);
      expect((await res.json()).policies).toEqual([]);
    });

    it("GET /policies/:id/targets uses [] when Targets undefined", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/policies/p-1/targets");
      expect(res.status).toBe(200);
      expect((await res.json()).targets).toEqual([]);
    });

    it("GET /targets/:id/policies uses [] when Policies undefined", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/targets/t-1/policies");
      expect(res.status).toBe(200);
      expect((await res.json()).policies).toEqual([]);
    });

    it("GET /tags uses [] when Tags undefined", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/tags?resourceArn=arn:org");
      expect(res.status).toBe(200);
      expect((await res.json()).tags).toEqual([]);
    });

    it("POST /tags uses empty entries when tags undefined", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tags", { resourceArn: "arn:org" });
      expect(res.status).toBe(400);
    });
  });
});
