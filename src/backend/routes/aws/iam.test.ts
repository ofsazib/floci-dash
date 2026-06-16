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
  ListInstanceProfilesCommand: createCmd("ListInstanceProfilesCommand"),
  CreateInstanceProfileCommand: createCmd("CreateInstanceProfileCommand"),
  DeleteInstanceProfileCommand: createCmd("DeleteInstanceProfileCommand"),
  AddRoleToInstanceProfileCommand: createCmd("AddRoleToInstanceProfileCommand"),
  RemoveRoleFromInstanceProfileCommand: createCmd("RemoveRoleFromInstanceProfileCommand"),
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

    it("POST /users — creates a user", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/users", { name: "new-user", path: "/" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.name).toBe("new-user");
      expect(mockSend.mock.calls[0][0].UserName).toBe("new-user");
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
        .mockResolvedValueOnce({ PolicyNames: [] });
      const res = await get("/users/admin");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user.name).toBe("admin");
      expect(body.groups).toEqual([]);
      expect(mockSend).toHaveBeenCalledTimes(5);
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

    it("POST /groups — creates a group", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/groups", { name: "developers" });
      expect(res.status).toBe(200);
      expect((await res.json()).created).toBe(true);
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

    it("POST /policies — creates a policy", async () => {
      mockSend.mockResolvedValueOnce({
        Policy: { PolicyName: "my-policy", Arn: "arn:aws:iam::...:policy/my-policy" },
      });
      const res = await post("/policies", { name: "my-policy" });
      expect(res.status).toBe(200);
      expect((await res.json()).created).toBe(true);
    });

    it("GET /policies/detail — returns policy + versions", async () => {
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
        });
      const res = await get("/policies/detail?arn=arn:aws:iam::000000000000:policy/AdminPolicy");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.policy.name).toBe("AdminPolicy");
      expect(body.versions).toHaveLength(2);
    });

    it("GET /policies/detail — null policy when not found", async () => {
      mockSend.mockResolvedValue({ Policy: null, Versions: [] });
      const res = await get("/policies/detail?arn=missing");
      const body = await res.json();
      expect(body.policy).toBeNull();
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
});
