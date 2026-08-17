import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockIAMClient = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-iam", () => ({
  IAMClient: mockIAMClient,
  ListUsersCommand: createCmd("ListUsersCommand"),
  CreateUserCommand: createCmd("CreateUserCommand"),
  GetUserCommand: createCmd("GetUserCommand"),
  DeleteUserCommand: createCmd("DeleteUserCommand"),
  UpdateUserCommand: createCmd("UpdateUserCommand"),
  ListUserTagsCommand: createCmd("ListUserTagsCommand"),
  ListGroupsForUserCommand: createCmd("ListGroupsForUserCommand"),
  ListAttachedUserPoliciesCommand: createCmd("ListAttachedUserPoliciesCommand"),
  ListAccessKeysCommand: createCmd("ListAccessKeysCommand"),
  ListUserPoliciesCommand: createCmd("ListUserPoliciesCommand"),
  ListRolesCommand: createCmd("ListRolesCommand"),
  CreateRoleCommand: createCmd("CreateRoleCommand"),
  GetRoleCommand: createCmd("GetRoleCommand"),
  DeleteRoleCommand: createCmd("DeleteRoleCommand"),
  ListAttachedRolePoliciesCommand: createCmd("ListAttachedRolePoliciesCommand"),
  ListRoleTagsCommand: createCmd("ListRoleTagsCommand"),
  ListGroupsCommand: createCmd("ListGroupsCommand"),
  CreateGroupCommand: createCmd("CreateGroupCommand"),
  DeleteGroupCommand: createCmd("DeleteGroupCommand"),
  GetGroupCommand: createCmd("GetGroupCommand"),
  AddUserToGroupCommand: createCmd("AddUserToGroupCommand"),
  RemoveUserFromGroupCommand: createCmd("RemoveUserFromGroupCommand"),
  SetDefaultPolicyVersionCommand: createCmd("SetDefaultPolicyVersionCommand"),
  ListPolicyTagsCommand: createCmd("ListPolicyTagsCommand"),
  TagRoleCommand: createCmd("TagRoleCommand"),
  UntagRoleCommand: createCmd("UntagRoleCommand"),
  TagPolicyCommand: createCmd("TagPolicyCommand"),
  UntagPolicyCommand: createCmd("UntagPolicyCommand"),
  TagUserCommand: createCmd("TagUserCommand"),
  UntagUserCommand: createCmd("UntagUserCommand"),
  ListPoliciesCommand: createCmd("ListPoliciesCommand"),
  CreatePolicyCommand: createCmd("CreatePolicyCommand"),
  GetPolicyCommand: createCmd("GetPolicyCommand"),
  DeletePolicyCommand: createCmd("DeletePolicyCommand"),
  ListPolicyVersionsCommand: createCmd("ListPolicyVersionsCommand"),
  GetPolicyVersionCommand: createCmd("GetPolicyVersionCommand"),
  CreatePolicyVersionCommand: createCmd("CreatePolicyVersionCommand"),
  DeletePolicyVersionCommand: createCmd("DeletePolicyVersionCommand"),
  AttachUserPolicyCommand: createCmd("AttachUserPolicyCommand"),
  DetachUserPolicyCommand: createCmd("DetachUserPolicyCommand"),
  AttachRolePolicyCommand: createCmd("AttachRolePolicyCommand"),
  DetachRolePolicyCommand: createCmd("DetachRolePolicyCommand"),
  CreateAccessKeyCommand: createCmd("CreateAccessKeyCommand"),
  DeleteAccessKeyCommand: createCmd("DeleteAccessKeyCommand"),
  UpdateAccessKeyCommand: createCmd("UpdateAccessKeyCommand"),
  GetUserPolicyCommand: createCmd("GetUserPolicyCommand"),
  PutUserPolicyCommand: createCmd("PutUserPolicyCommand"),
  DeleteUserPolicyCommand: createCmd("DeleteUserPolicyCommand"),
  ListGroupPoliciesCommand: createCmd("ListGroupPoliciesCommand"),
  GetGroupPolicyCommand: createCmd("GetGroupPolicyCommand"),
  PutGroupPolicyCommand: createCmd("PutGroupPolicyCommand"),
  DeleteGroupPolicyCommand: createCmd("DeleteGroupPolicyCommand"),
  ListInstanceProfilesCommand: createCmd("ListInstanceProfilesCommand"),
  CreateInstanceProfileCommand: createCmd("CreateInstanceProfileCommand"),
  DeleteInstanceProfileCommand: createCmd("DeleteInstanceProfileCommand"),
  AddRoleToInstanceProfileCommand: createCmd("AddRoleToInstanceProfileCommand"),
  RemoveRoleFromInstanceProfileCommand: createCmd("RemoveRoleFromInstanceProfileCommand"),
  PutUserPermissionsBoundaryCommand: createCmd("PutUserPermissionsBoundaryCommand"),
  DeleteUserPermissionsBoundaryCommand: createCmd("DeleteUserPermissionsBoundaryCommand"),
  PutRolePermissionsBoundaryCommand: createCmd("PutRolePermissionsBoundaryCommand"),
  DeleteRolePermissionsBoundaryCommand: createCmd("DeleteRolePermissionsBoundaryCommand"),
}));

vi.mock("../../clients/aws", () => ({
  getAwsConfig: () => ({
    endpoint: "http://localhost:4566",
    region: "us-east-1",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  }),
}));

import router from "./iam";

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

async function put(path: string, body?: any) {
  return router.request(path, {
    method: "PUT",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

beforeEach(() => {
  mockSend.mockReset();
});

describe("IAM Routes", () => {
  describe("Users", () => {
    it("GET /users — lists users", async () => {
      mockSend.mockResolvedValueOnce({
        Users: [
          {
            UserName: "admin",
            Arn: "arn:aws:iam::000000000000:user/admin",
            UserId: "A1B2C3",
            Path: "/",
            CreateDate: new Date("2025-01-01"),
          },
        ],
      });
      const res = await get("/users");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.users[0].name).toBe("admin");
    });

    it("GET /users — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ Users: [] });
      const res = await get("/users");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /users — empty when Users key missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/users");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.users).toEqual([]);
    });

    it("GET /users/:name/tags — lists user tags", async () => {
      mockSend.mockResolvedValueOnce({
        Tags: [
          { Key: "env", Value: "prod" },
          { Key: "team", Value: "infra" },
        ],
      });
      const res = await get("/users/admin/tags");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags).toEqual({ env: "prod", team: "infra" });
      expect(mockSend.mock.calls[0][0].UserName).toBe("admin");
    });

    it("GET /users/:name/tags — empty tags when Tags key missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/users/admin/tags");
      const body = await res.json();
      expect(body.tags).toEqual({});
    });

    it("POST /users — creates a user", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/users", { name: "new-user", path: "/" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.name).toBe("new-user");
      expect(mockSend.mock.calls[0][0].UserName).toBe("new-user");
    });

    it("POST /users — default empty path when path omitted", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/users", { name: "no-path-user" });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].UserName).toBe("no-path-user");
      expect(mockSend.mock.calls[0][0].Path).toBe("");
    });

    it("POST /users — 400 when name is missing", async () => {
      const res = await post("/users", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /users/:name — deletes a user", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/users/admin");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].UserName).toBe("admin");
    });

    it("GET /users/:name — gets user detail with groups, policies, keys", async () => {
      mockSend
        .mockResolvedValueOnce({
          User: {
            UserName: "admin",
            Arn: "arn:aws:iam::000000000000:user/admin",
            UserId: "A1B2C3",
            Path: "/",
            CreateDate: new Date("2025-01-01"),
          },
        })
        .mockResolvedValueOnce({ Groups: [] })
        .mockResolvedValueOnce({ AttachedPolicies: [] })
        .mockResolvedValueOnce({ AccessKeyMetadata: [] })
        .mockResolvedValueOnce({ PolicyNames: [] })
        .mockResolvedValueOnce({ Tags: [] });
      const res = await get("/users/admin");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user.name).toBe("admin");
      expect(body.groups).toEqual([]);
      expect(mockSend).toHaveBeenCalledTimes(6);
    });

    it("GET /users/:name — gets user detail with actual access keys and groups", async () => {
      mockSend
        .mockResolvedValueOnce({
          User: {
            UserName: "admin",
            Arn: "arn:aws:iam::000000000000:user/admin",
            UserId: "A1B2C3",
            Path: "/",
            CreateDate: new Date("2025-01-01"),
          },
        })
        .mockResolvedValueOnce({ Groups: [{ GroupName: "admins", Arn: "arn:aws:iam::...", GroupId: "G1", Path: "/", CreateDate: new Date("2025-01-01") }] })
        .mockResolvedValueOnce({}) // undefined AttachedPolicies → || [] fallback
        .mockResolvedValueOnce({
          AccessKeyMetadata: [
            { AccessKeyId: "AKIA123", UserName: "admin", Status: "Active", CreateDate: new Date("2025-01-01") },
            { AccessKeyId: "AKIA456", UserName: "admin", Status: "Inactive", CreateDate: new Date("2025-03-01") },
          ],
        })
        .mockResolvedValueOnce({ PolicyNames: ["inline-policy-1"] })
        .mockResolvedValueOnce({ Tags: [{ Key: "env", Value: "prod" }] });
      const res = await get("/users/admin");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user.name).toBe("admin");
      expect(body.groups).toHaveLength(1);
      expect(body.groups[0].name).toBe("admins");
      expect(body.attachedPolicies).toEqual([]);
      expect(body.accessKeys).toHaveLength(2);
      expect(body.accessKeys[0].accessKeyId).toBe("AKIA123");
      expect(body.accessKeys[0].status).toBe("Active");
      expect(body.inlinePolicies).toEqual(["inline-policy-1"]);
      expect(body.tags).toEqual({ env: "prod" });
      expect(mockSend).toHaveBeenCalledTimes(6);
    });

    it("GET /users/:name — sparse responses (all keys missing)", async () => {
      mockSend
        .mockResolvedValueOnce({
          User: { UserName: "admin", Arn: "arn:x", UserId: "A1", Path: "/", CreateDate: new Date("2025-01-01") },
        })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});
      const res = await get("/users/admin");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.groups).toEqual([]);
      expect(body.attachedPolicies).toEqual([]);
      expect(body.accessKeys).toEqual([]);
      expect(body.inlinePolicies).toEqual([]);
      expect(body.tags).toEqual({});
    });

    it("GET /users/:name — maps attached policies, access keys, and inline policies", async () => {
      mockSend
        .mockResolvedValueOnce({
          User: { UserName: "admin", Arn: "arn:x", UserId: "A1", Path: "/", CreateDate: new Date("2025-01-01") },
        })
        .mockResolvedValueOnce({ Groups: [] })
        .mockResolvedValueOnce({ AttachedPolicies: [{ PolicyName: "AdminPolicy", PolicyArn: "arn:aws:iam::...:policy/AdminPolicy" }] })
        .mockResolvedValueOnce({ AccessKeyMetadata: [{ AccessKeyId: "AKIA789", UserName: "admin", Status: "Active", CreateDate: new Date() }] })
        .mockResolvedValueOnce({ PolicyNames: ["p1", "p2"] })
        .mockResolvedValueOnce({ Tags: [] });
      const res = await get("/users/admin");
      const body = await res.json();
      expect(body.attachedPolicies).toEqual([{ name: "AdminPolicy", arn: "arn:aws:iam::...:policy/AdminPolicy" }]);
      expect(body.accessKeys[0].accessKeyId).toBe("AKIA789");
      expect(body.inlinePolicies).toEqual(["p1", "p2"]);
      expect(body.tags).toEqual({});
    });

    it("POST /users/:name/access-keys — creates access key", async () => {
      mockSend.mockResolvedValueOnce({
        AccessKey: {
          AccessKeyId: "AKIA123",
          SecretAccessKey: "secret123",
          Status: "Active",
          UserName: "admin",
        },
      });
      const res = await post("/users/admin/access-keys");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.accessKeyId).toBe("AKIA123");
    });

    it("DELETE /users/:name/access-keys/:id — deletes access key", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/users/admin/access-keys/AKIA123");
      expect(res.status).toBe(200);
      expect((await res.json()).deleted).toBe(true);
    });

    it("PUT /users/:name/access-keys/:id — updates access key status", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/users/admin/access-keys/AKIA123", { status: "Inactive" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("Inactive");
      expect(mockSend.mock.calls[0][0].Status).toBe("Inactive");
    });

    it("GET /users/:name/inline-policies/:policyName — gets inline policy document", async () => {
      mockSend.mockResolvedValueOnce({
        PolicyDocument: encodeURIComponent(JSON.stringify({ Version: "2012-10-17" })),
      });
      const res = await get("/users/admin/inline-policies/my-policy");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.policyName).toBe("my-policy");
      expect(body.document).toContain("2012-10-17");
    });

    it("GET /users/:name/inline-policies/:policyName — null document when absent", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/users/admin/inline-policies/empty");
      const body = await res.json();
      expect(body.document).toBeNull();
    });

    it("PUT /users/:name/inline-policies — puts inline policy", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/users/admin/inline-policies", {
        policyName: "my-policy",
        document: '{"Version":"2012-10-17"}',
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.put).toBe(true);
      expect(body.policyName).toBe("my-policy");
      expect(mockSend.mock.calls[0][0].PolicyName).toBe("my-policy");
    });

    it("PUT /users/:name/inline-policies — 400 when policyName missing", async () => {
      const res = await put("/users/admin/inline-policies", { document: '{"Version":"2012-10-17"}' });
      expect(res.status).toBe(400);
    });

    it("PUT /users/:name/inline-policies — puts inline policy without document", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/users/admin/inline-policies", { policyName: "no-doc" });
      expect(res.status).toBe(200);
      expect((await res.json()).put).toBe(true);
      expect(mockSend.mock.calls[0][0].PolicyDocument).toBeUndefined();
    });

    it("PUT /users/:name/inline-policies — 400 when document is invalid JSON", async () => {
      const res = await put("/users/admin/inline-policies", {
        policyName: "bad-policy",
        document: "not-json",
      });
      expect(res.status).toBe(400);
    });

    it("DELETE /users/:name/inline-policies/:policyName — deletes inline policy", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/users/admin/inline-policies/my-policy");
      expect(res.status).toBe(200);
      expect((await res.json()).deleted).toBe(true);
    });
  });

  describe("Roles", () => {
    it("GET /roles — lists roles", async () => {
      mockSend.mockResolvedValueOnce({
        Roles: [
          {
            RoleName: "ec2-role",
            Arn: "arn:aws:iam::000000000000:role/ec2-role",
            RoleId: "R1",
            Path: "/",
            CreateDate: new Date("2025-01-01"),
          },
        ],
      });
      const res = await get("/roles");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.roles[0].name).toBe("ec2-role");
    });

    it("POST /roles — creates a role", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/roles", { name: "lambda-role" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(mockSend.mock.calls[0][0].RoleName).toBe("lambda-role");
    });

    it("POST /roles — 400 when name missing", async () => {
      const res = await post("/roles", { description: "no name" });
      expect(res.status).toBe(400);
    });

    it("POST /roles — uses provided valid trust policy document", async () => {
      mockSend.mockResolvedValueOnce({});
      const doc = JSON.stringify({ Version: "2012-10-17", Statement: [{ Effect: "Allow", Principal: { Service: "lambda.amazonaws.com" }, Action: "sts:AssumeRole" }] });
      const res = await post("/roles", { name: "custom-trust", assumeRolePolicyDocument: doc });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].AssumeRolePolicyDocument).toBe(doc);
    });

    it("POST /roles — validates trust policy document", async () => {
      const res = await post("/roles", { name: "bad-role", assumeRolePolicyDocument: "not-json" });
      expect(res.status).toBe(400);
    });

    it("POST /roles — with description and maxSessionDuration", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/roles", {
        name: "custom-role",
        description: "Custom role",
        maxSessionDuration: 43200,
        path: "/custom/",
      });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].Description).toBe("Custom role");
      expect(mockSend.mock.calls[0][0].MaxSessionDuration).toBe(43200);
      expect(mockSend.mock.calls[0][0].Path).toBe("/custom/");
    });

    it("DELETE /roles/:name — deletes a role", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/roles/lambda-role");
      expect(res.status).toBe(200);
      expect((await res.json()).deleted).toBe(true);
    });

    it("GET /roles/:name — gets role detail", async () => {
      mockSend
        .mockResolvedValueOnce({
          Role: {
            RoleName: "ec2-role",
            Arn: "arn:aws:iam::000000000000:role/ec2-role",
            RoleId: "R1",
            Path: "/",
            CreateDate: new Date("2025-01-01"),
            AssumeRolePolicyDocument: encodeURIComponent(
              JSON.stringify({ Version: "2012-10-17" })
            ),
          },
        })
        .mockResolvedValueOnce({ AttachedPolicies: [] })
        .mockResolvedValueOnce({ Tags: [] });
      const res = await get("/roles/ec2-role");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.role.name).toBe("ec2-role");
      expect(body.role.assumeRolePolicyDocument).toBeDefined();
    });

    it("GET /roles/:name — undefined attached policies and tags (|| [] fallbacks)", async () => {
      mockSend
        .mockResolvedValueOnce({
          Role: {
            RoleName: "no-policy-role",
            Arn: "arn:aws:iam::000000000000:role/no-policy-role",
            RoleId: "R2",
            Path: "/",
            CreateDate: new Date("2025-01-01"),
          },
        })
        .mockResolvedValueOnce({}) // undefined AttachedPolicies → || []
        .mockResolvedValueOnce({}); // undefined Tags → || []
      const res = await get("/roles/no-policy-role");
      const body = await res.json();
      expect(body.attachedPolicies).toEqual([]);
      expect(body.tags).toEqual({});
    });

    it("GET /roles — empty when Roles key missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/roles");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.roles).toEqual([]);
    });

    it("GET /roles/:name — maps attached policies and tags", async () => {
      mockSend
        .mockResolvedValueOnce({
          Role: { RoleName: "full-role", Arn: "arn:x", RoleId: "R3", Path: "/", CreateDate: new Date(), AssumeRolePolicyDocument: null },
        })
        .mockResolvedValueOnce({ AttachedPolicies: [{ PolicyName: "RolePolicy", PolicyArn: "arn:aws:iam::...:policy/RolePolicy" }] })
        .mockResolvedValueOnce({ Tags: [{ Key: "env", Value: "staging" }] });
      const res = await get("/roles/full-role");
      const body = await res.json();
      expect(body.attachedPolicies).toEqual([{ name: "RolePolicy", arn: "arn:aws:iam::...:policy/RolePolicy" }]);
      expect(body.tags).toEqual({ env: "staging" });
      expect(body.role.assumeRolePolicyDocument).toBeNull();
    });
  });

  describe("Groups", () => {
    it("GET /groups — lists groups", async () => {
      mockSend.mockResolvedValueOnce({
        Groups: [
          {
            GroupName: "admins",
            Arn: "arn:aws:iam::000000000000:group/admins",
            GroupId: "G1",
            Path: "/",
            CreateDate: new Date("2025-01-01"),
          },
        ],
      });
      const res = await get("/groups");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.groups[0].name).toBe("admins");
    });

    it("GET /groups — empty when Groups key missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/groups");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.groups).toEqual([]);
    });

    it("POST /groups — 400 when name missing", async () => {
      const res = await post("/groups", { path: "/" });
      expect(res.status).toBe(400);
    });

    it("POST /groups — creates a group", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/groups", { name: "developers" });
      expect(res.status).toBe(200);
      expect((await res.json()).created).toBe(true);
    });

    it("DELETE /groups/:name — deletes a group", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/groups/developers");
      expect(res.status).toBe(200);
      expect((await res.json()).deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].GroupName).toBe("developers");
    });
  });

  describe("Policies", () => {
    it("GET /policies — lists policies", async () => {
      mockSend.mockResolvedValueOnce({
        Policies: [
          {
            PolicyName: "AdminPolicy",
            Arn: "arn:aws:iam::000000000000:policy/AdminPolicy",
            PolicyId: "P1",
            Path: "/",
            DefaultVersionId: "v1",
            AttachmentCount: 0,
            IsAttachable: true,
            CreateDate: new Date("2025-01-01"),
          },
        ],
      });
      const res = await get("/policies");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.policies[0].name).toBe("AdminPolicy");
    });

    it("GET /policies — empty when Policies key missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/policies");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.policies).toEqual([]);
    });

    it("POST /policies — 400 when name missing", async () => {
      const res = await post("/policies", { description: "no name" });
      expect(res.status).toBe(400);
    });

    it("POST /policies — creates a policy", async () => {
      mockSend.mockResolvedValueOnce({
        Policy: { PolicyName: "my-policy", Arn: "arn:aws:iam::...:policy/my-policy" },
      });
      const res = await post("/policies", { name: "my-policy" });
      expect(res.status).toBe(200);
      expect((await res.json()).created).toBe(true);
      // Default document should be used
      expect(mockSend.mock.calls[0][0].PolicyDocument).toContain("Allow");
    });

    it("POST /policies — validates document JSON", async () => {
      const res = await post("/policies", { name: "bad-policy", document: "not-json" });
      expect(res.status).toBe(400);
    });

    it("POST /policies — with description and path", async () => {
      mockSend.mockResolvedValueOnce({
        Policy: { PolicyName: "desc-policy", Arn: "arn:aws:iam::...:policy/desc" },
      });
      const res = await post("/policies", {
        name: "desc-policy",
        description: "My policy",
        path: "/app/",
        document: JSON.stringify({ Version: "2012-10-17", Statement: [{ Effect: "Allow", Action: "s3:GetObject", Resource: "*" }] }),
      });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].Description).toBe("My policy");
      expect(mockSend.mock.calls[0][0].Path).toBe("/app/");
    });

    it("GET /policies — uses custom scope", async () => {
      mockSend.mockResolvedValueOnce({
        Policies: [{ PolicyName: "AWSAdmin", Arn: "arn:aws:iam::aws:policy/AdministratorAccess" }],
      });
      const res = await get("/policies?scope=AWS");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(mockSend.mock.calls[0][0].Scope).toBe("AWS");
    });

    it("GET /policies/detail — returns policy + versions + tags", async () => {
      mockSend
        .mockResolvedValueOnce({
          Policy: {
            PolicyName: "AdminPolicy",
            Arn: "arn:aws:iam::000000000000:policy/AdminPolicy",
            PolicyId: "P1",
            DefaultVersionId: "v1",
          },
        })
        .mockResolvedValueOnce({
          Versions: [
            { VersionId: "v1", IsDefaultVersion: true, CreateDate: new Date("2025-01-01") },
            { VersionId: "v2", IsDefaultVersion: false, CreateDate: new Date("2025-02-01") },
          ],
        })
        .mockResolvedValueOnce({
          Tags: [{ Key: "env", Value: "prod" }],
        });
      const res = await get("/policies/detail?arn=arn:aws:iam::000000000000:policy/AdminPolicy");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.policy.name).toBe("AdminPolicy");
      expect(body.versions).toHaveLength(2);
      expect(body.tags).toEqual({ env: "prod" });
    });

    it("GET /policies/detail — null policy when not found", async () => {
      mockSend.mockResolvedValue({ Policy: null, Versions: [], Tags: [] });
      const res = await get("/policies/detail?arn=missing");
      const body = await res.json();
      expect(body.policy).toBeNull();
    });

    it("GET /policies/detail — empty versions and tags when keys missing", async () => {
      mockSend
        .mockResolvedValueOnce({ Policy: { PolicyName: "P" } })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});
      const res = await get("/policies/detail?arn=arn-x");
      const body = await res.json();
      expect(body.versions).toEqual([]);
      expect(body.tags).toEqual({});
    });

    it("GET /policies/version — returns decoded document", async () => {
      mockSend.mockResolvedValueOnce({
        PolicyVersion: {
          Document: encodeURIComponent(JSON.stringify({ Version: "2012-10-17" })),
          IsDefaultVersion: true,
        },
      });
      const res = await get("/policies/version?arn=arn-x&versionId=v1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.versionId).toBe("v1");
      expect(body.isDefaultVersion).toBe(true);
      expect(body.document).toContain("2012-10-17");
    });

    it("GET /policies/version — null document when absent", async () => {
      mockSend.mockResolvedValueOnce({ PolicyVersion: {} });
      const res = await get("/policies/version?arn=arn-x&versionId=v1");
      const body = await res.json();
      expect(body.document).toBeNull();
    });

    it("DELETE /policies — deletes policy by arn", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/policies?arn=arn:aws:iam::000000000000:policy/Old");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].PolicyArn).toBe("arn:aws:iam::000000000000:policy/Old");
    });

    it("GET /policies/detail — 400 when arn missing", async () => {
      const res = await get("/policies/detail");
      expect(res.status).toBe(400);
    });

    it("GET /policies/version — 400 when arn or versionId missing", async () => {
      const res1 = await get("/policies/version");
      expect(res1.status).toBe(400);
      const res2 = await get("/policies/version?arn=foo");
      expect(res2.status).toBe(400);
      const res3 = await get("/policies/version?versionId=v1");
      expect(res3.status).toBe(400);
    });

    it("DELETE /policies — 400 when arn missing", async () => {
      const res = await del("/policies");
      expect(res.status).toBe(400);
    });
  });

  describe("Permission Boundaries", () => {
    it("PUT /users/:name/permissions-boundary — sets boundary", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/users/admin/permissions-boundary", {
        permissionsBoundary: "arn:aws:iam::000000000000:policy/boundary",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.set).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("PutUserPermissionsBoundaryCommand");
      expect(mockSend.mock.calls[0][0].PermissionsBoundary).toBe("arn:aws:iam::000000000000:policy/boundary");
    });

    it("PUT /users/:name/permissions-boundary — 400 when ARN missing", async () => {
      const res = await put("/users/admin/permissions-boundary", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /users/:name/permissions-boundary — deletes boundary", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/users/admin/permissions-boundary");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteUserPermissionsBoundaryCommand");
    });

    it("PUT /roles/:name/permissions-boundary — sets boundary", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/roles/my-role/permissions-boundary", {
        permissionsBoundary: "arn:aws:iam::000000000000:policy/role-boundary",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.set).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("PutRolePermissionsBoundaryCommand");
    });

    it("PUT /roles/:name/permissions-boundary — 400 when ARN missing", async () => {
      const res = await put("/roles/my-role/permissions-boundary", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /roles/:name/permissions-boundary — deletes boundary", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/roles/my-role/permissions-boundary");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteRolePermissionsBoundaryCommand");
    });
  });

  describe("Instance Profiles", () => {
    it("GET /instance-profiles — lists instance profiles", async () => {
      mockSend.mockResolvedValueOnce({
        InstanceProfiles: [
          {
            InstanceProfileName: "web-profile",
            Arn: "arn:aws:iam::...:instance-profile/web-profile",
            InstanceProfileId: "IP1",
            Path: "/",
            CreateDate: new Date("2025-01-01"),
            Roles: [],
          },
        ],
      });
      const res = await get("/instance-profiles");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.instanceProfiles[0].name).toBe("web-profile");
    });

    it("GET /instance-profiles — empty when InstanceProfiles key missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/instance-profiles");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.instanceProfiles).toEqual([]);
    });

    it("GET /instance-profiles — sparse profile without Roles key", async () => {
      mockSend.mockResolvedValueOnce({
        InstanceProfiles: [{ InstanceProfileName: "no-roles", Arn: "arn:x", InstanceProfileId: "IP3", Path: "/", CreateDate: new Date() }],
      });
      const res = await get("/instance-profiles");
      const body = await res.json();
      expect(body.instanceProfiles[0].roles).toEqual([]);
    });

    it("POST /instance-profiles — creates instance profile", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/instance-profiles", { name: "web-profile" });
      expect(res.status).toBe(200);
      expect((await res.json()).created).toBe(true);
    });

    it("DELETE /instance-profiles/:name — deletes instance profile", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/instance-profiles/web-profile");
      expect(res.status).toBe(200);
      expect((await res.json()).deleted).toBe(true);
    });

    it("POST /instance-profiles/:name/roles/:roleName — adds role to profile", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/instance-profiles/web-profile/roles/ec2-role");
      expect(res.status).toBe(200);
      expect((await res.json()).added).toBe(true);
      expect(mockSend.mock.calls[0][0].InstanceProfileName).toBe("web-profile");
      expect(mockSend.mock.calls[0][0].RoleName).toBe("ec2-role");
    });

    it("DELETE /instance-profiles/:name/roles/:roleName — removes role from profile", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/instance-profiles/web-profile/roles/ec2-role");
      expect(res.status).toBe(200);
      expect((await res.json()).removed).toBe(true);
    });

    it("GET /instance-profiles — maps roles in instance profile", async () => {
      mockSend.mockResolvedValueOnce({
        InstanceProfiles: [
          {
            InstanceProfileName: "with-roles",
            Arn: "arn:x",
            InstanceProfileId: "IP2",
            Path: "/",
            CreateDate: new Date("2025-01-01"),
            Roles: [{ RoleName: "r1" }, { RoleName: "r2" }],
          },
        ],
      });
      const res = await get("/instance-profiles");
      const body = await res.json();
      expect(body.instanceProfiles[0].roles).toEqual(["r1", "r2"]);
    });
  });

  describe("G.85 — group membership, default version, tags", () => {
    it("GET /groups/:name — returns group with members", async () => {
      mockSend.mockResolvedValueOnce({
        Group: { GroupName: "admins", Arn: "arn:admins" },
        Users: [{ UserName: "alice" }],
      });
      const res = await get("/groups/admins");
      const body = await res.json();
      expect(body.group.name).toBe("admins");
      expect(body.users).toEqual([{ UserName: "alice" }]);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetGroupCommand");
    });

    it("GET /groups/:name — sparse users", async () => {
      mockSend.mockResolvedValueOnce({ Group: { GroupName: "admins" } });
      const res = await get("/groups/admins");
      const body = await res.json();
      expect(body.users).toEqual([]);
    });

    it("POST /groups/:name/users — adds a user", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/groups/admins/users", { userName: "alice" });
      const body = await res.json();
      expect(body.added).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("AddUserToGroupCommand");
      expect(mockSend.mock.calls[0][0].UserName).toBe("alice");
      const res400 = await post("/groups/admins/users", {});
      expect(res400.status).toBe(400);
    });

    it("DELETE /groups/:name/users/:userName — removes a user", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/groups/admins/users/alice");
      const body = await res.json();
      expect(body.removed).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("RemoveUserFromGroupCommand");
      expect(mockSend.mock.calls[0][0].UserName).toBe("alice");
    });

    it("GET /groups/:name/inline-policies — lists group inline policies", async () => {
      mockSend.mockResolvedValueOnce({ PolicyNames: ["gp1", "gp2"] });
      mockSend.mockResolvedValueOnce({});
      const res = await get("/groups/admins/inline-policies");
      const body = await res.json();
      expect(body.policyNames).toEqual(["gp1", "gp2"]);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListGroupPoliciesCommand");
      const sparse = await get("/groups/admins/inline-policies");
      expect((await sparse.json()).policyNames).toEqual([]);
    });

    it("GET /groups/:name/inline-policies/:policyName — gets group inline policy document", async () => {
      mockSend.mockResolvedValueOnce({
        PolicyDocument: encodeURIComponent(JSON.stringify({ Version: "2012-10-17" })),
      });
      const res = await get("/groups/admins/inline-policies/gp1");
      const body = await res.json();
      expect(body.policyName).toBe("gp1");
      expect(body.document).toContain("2012-10-17");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetGroupPolicyCommand");
    });

    it("GET /groups/:name/inline-policies/:policyName — null document when absent", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/groups/admins/inline-policies/gp2");
      expect((await res.json()).document).toBeNull();
    });

    it("PUT /groups/:name/inline-policies — puts group inline policy", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/groups/admins/inline-policies", {
        policyName: "gp1",
        document: '{"Version":"2012-10-17"}',
      });
      const body = await res.json();
      expect(body.put).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("PutGroupPolicyCommand");
      expect(mockSend.mock.calls[0][0].GroupName).toBe("admins");
    });

    it("PUT /groups/:name/inline-policies — 400 when policyName missing", async () => {
      const res = await put("/groups/admins/inline-policies", { document: '{"Version":"2012-10-17"}' });
      expect(res.status).toBe(400);
    });

    it("PUT /groups/:name/inline-policies — puts without document", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/groups/admins/inline-policies", { policyName: "gp-no-doc" });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].PolicyDocument).toBeUndefined();
    });

    it("PUT /groups/:name/inline-policies — 400 when document is invalid JSON", async () => {
      const res = await put("/groups/admins/inline-policies", { policyName: "bad", document: "not-json" });
      expect(res.status).toBe(400);
    });

    it("DELETE /groups/:name/inline-policies/:policyName — deletes group inline policy", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/groups/admins/inline-policies/gp1");
      expect((await res.json()).deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteGroupPolicyCommand");
    });

    it("POST /policies/:arn/set-default-version — sets default version", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/policies/arn%3Ap1/set-default-version", { versionId: "v2" });
      const body = await res.json();
      expect(body.set).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("SetDefaultPolicyVersionCommand");
      expect(mockSend.mock.calls[0][0].PolicyArn).toBe("arn:p1");
      expect(mockSend.mock.calls[0][0].VersionId).toBe("v2");
      const res400 = await post("/policies/arn%3Ap1/set-default-version", {});
      expect(res400.status).toBe(400);
    });

    it("POST /users/:name/tags — tags a user with 400 when empty", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/users/alice/tags", { tags: [{ Key: "env", Value: "prod" }] });
      const body = await res.json();
      expect(body.tagged).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("TagUserCommand");
      expect(mockSend.mock.calls[0][0].Tags).toEqual([{ Key: "env", Value: "prod" }]);
      const res400 = await post("/users/alice/tags", { tags: [{ Key: "env" }] });
      expect(res400.status).toBe(400);
      const res400b = await post("/users/alice/tags", { tags: [{ Value: "prod" }] });
      expect(res400b.status).toBe(400);
      const res400c = await post("/users/alice/tags", {});
      expect(res400c.status).toBe(400);
    });

    it("DELETE /users/:name/tags — untags a user with 400 when empty", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await router.request("/users/alice/tags", {
        method: "DELETE",
        body: JSON.stringify({ tagKeys: ["env"] }),
        headers: { "content-type": "application/json" },
      });
      const body = await res.json();
      expect(body.untagged).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("UntagUserCommand");
      expect(mockSend.mock.calls[0][0].TagKeys).toEqual(["env"]);
      const res400 = await router.request("/users/alice/tags", {
        method: "DELETE",
        body: JSON.stringify({ tagKeys: [] }),
        headers: { "content-type": "application/json" },
      });
      expect(res400.status).toBe(400);
    });

    it("POST /roles/:name/tags — tags a role", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/roles/deploy/tags", { tags: [{ Key: "env", Value: "prod" }] });
      const body = await res.json();
      expect(body.tagged).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("TagRoleCommand");
      const res400 = await post("/roles/deploy/tags", { tags: [{ Key: "env" }] });
      expect(res400.status).toBe(400);
      const res400b = await post("/roles/deploy/tags", { tags: [{ Value: "prod" }] });
      expect(res400b.status).toBe(400);
      const res400c = await post("/roles/deploy/tags", {});
      expect(res400c.status).toBe(400);
    });

    it("DELETE /roles/:name/tags — untags a role", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await router.request("/roles/deploy/tags", {
        method: "DELETE",
        body: JSON.stringify({ tagKeys: ["env"] }),
        headers: { "content-type": "application/json" },
      });
      const body = await res.json();
      expect(body.untagged).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("UntagRoleCommand");
      const res400 = await router.request("/roles/deploy/tags", {
        method: "DELETE",
        body: JSON.stringify({ tagKeys: [] }),
        headers: { "content-type": "application/json" },
      });
      expect(res400.status).toBe(400);
    });

    it("POST /policies/:arn/tags — tags a policy", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/policies/arn%3Ap1/tags", { tags: [{ Key: "env", Value: "prod" }] });
      const body = await res.json();
      expect(body.tagged).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("TagPolicyCommand");
      const res400 = await post("/policies/arn%3Ap1/tags", { tags: [{ Key: "env" }] });
      expect(res400.status).toBe(400);
      const res400b = await post("/policies/arn%3Ap1/tags", { tags: [{ Value: "prod" }] });
      expect(res400b.status).toBe(400);
      const res400c = await post("/policies/arn%3Ap1/tags", {});
      expect(res400c.status).toBe(400);
    });

    it("DELETE /policies/:arn/tags — untags a policy", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await router.request("/policies/arn%3Ap1/tags", {
        method: "DELETE",
        body: JSON.stringify({ tagKeys: ["env"] }),
        headers: { "content-type": "application/json" },
      });
      const body = await res.json();
      expect(body.untagged).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("UntagPolicyCommand");
      const res400 = await router.request("/policies/arn%3Ap1/tags", {
        method: "DELETE",
        body: JSON.stringify({ tagKeys: [] }),
        headers: { "content-type": "application/json" },
      });
      expect(res400.status).toBe(400);
    });
  });
});
