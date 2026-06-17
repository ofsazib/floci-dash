import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockIAM = vi.hoisted(() =>
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
  IAMClient: mockIAM,
  ListUsersCommand: createCmd("ListUsersCommand"),
  CreateUserCommand: createCmd("CreateUserCommand"),
  GetUserCommand: createCmd("GetUserCommand"),
  DeleteUserCommand: createCmd("DeleteUserCommand"),
  UpdateUserCommand: createCmd("UpdateUserCommand"),
  ListUserTagsCommand: createCmd("ListUserTagsCommand"),
  ListRolesCommand: createCmd("ListRolesCommand"),
  CreateRoleCommand: createCmd("CreateRoleCommand"),
  GetRoleCommand: createCmd("GetRoleCommand"),
  DeleteRoleCommand: createCmd("DeleteRoleCommand"),
  UpdateRoleCommand: createCmd("UpdateRoleCommand"),
  ListAttachedRolePoliciesCommand: createCmd("ListAttachedRolePoliciesCommand"),
  ListRoleTagsCommand: createCmd("ListRoleTagsCommand"),
  ListGroupsCommand: createCmd("ListGroupsCommand"),
  CreateGroupCommand: createCmd("CreateGroupCommand"),
  DeleteGroupCommand: createCmd("DeleteGroupCommand"),
  ListGroupsForUserCommand: createCmd("ListGroupsForUserCommand"),
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
  ListAttachedUserPoliciesCommand: createCmd("ListAttachedUserPoliciesCommand"),
  AttachRolePolicyCommand: createCmd("AttachRolePolicyCommand"),
  DetachRolePolicyCommand: createCmd("DetachRolePolicyCommand"),
  ListAccessKeysCommand: createCmd("ListAccessKeysCommand"),
  CreateAccessKeyCommand: createCmd("CreateAccessKeyCommand"),
  DeleteAccessKeyCommand: createCmd("DeleteAccessKeyCommand"),
  UpdateAccessKeyCommand: createCmd("UpdateAccessKeyCommand"),
  ListUserPoliciesCommand: createCmd("ListUserPoliciesCommand"),
  GetUserPolicyCommand: createCmd("GetUserPolicyCommand"),
  PutUserPolicyCommand: createCmd("PutUserPolicyCommand"),
  DeleteUserPolicyCommand: createCmd("DeleteUserPolicyCommand"),
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

import app from "../../index";

beforeEach(() => {
  mockSend.mockReset();
});

// ─── User Permission Boundaries ──────────────────────────

describe("PUT /api/aws/iam/users/:name/permissions-boundary", () => {
  it("sets a permission boundary on a user", async () => {
    mockSend.mockResolvedValue({});
    const res = await app.request("/api/aws/iam/users/testuser/permissions-boundary", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissionsBoundary: "arn:aws:iam::123456789012:policy/TestPolicy" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.set).toBe(true);
  });

  it("returns 400 if permissionsBoundary is missing", async () => {
    const res = await app.request("/api/aws/iam/users/testuser/permissions-boundary", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/aws/iam/users/:name/permissions-boundary", () => {
  it("removes permission boundary from a user", async () => {
    mockSend.mockResolvedValue({});
    const res = await app.request("/api/aws/iam/users/testuser/permissions-boundary", {
      method: "DELETE",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });
});

// ─── Role Permission Boundaries ──────────────────────────

describe("PUT /api/aws/iam/roles/:name/permissions-boundary", () => {
  it("sets a permission boundary on a role", async () => {
    mockSend.mockResolvedValue({});
    const res = await app.request("/api/aws/iam/roles/testrole/permissions-boundary", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissionsBoundary: "arn:aws:iam::123456789012:policy/TestPolicy" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.set).toBe(true);
  });

  it("returns 400 if permissionsBoundary is missing", async () => {
    const res = await app.request("/api/aws/iam/roles/testrole/permissions-boundary", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/aws/iam/roles/:name/permissions-boundary", () => {
  it("removes permission boundary from a role", async () => {
    mockSend.mockResolvedValue({});
    const res = await app.request("/api/aws/iam/roles/testrole/permissions-boundary", {
      method: "DELETE",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });
});
