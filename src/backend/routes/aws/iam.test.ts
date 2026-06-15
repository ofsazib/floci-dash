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
  });
});
