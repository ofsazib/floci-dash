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

vi.mock("@aws-sdk/client-identitystore", () => ({
  IdentitystoreClient: mockClient,
  ListUsersCommand: createCmd("ListUsersCommand"),
  CreateUserCommand: createCmd("CreateUserCommand"),
  DescribeUserCommand: createCmd("DescribeUserCommand"),
  UpdateUserCommand: createCmd("UpdateUserCommand"),
  DeleteUserCommand: createCmd("DeleteUserCommand"),
  ListGroupsCommand: createCmd("ListGroupsCommand"),
  CreateGroupCommand: createCmd("CreateGroupCommand"),
  DescribeGroupCommand: createCmd("DescribeGroupCommand"),
  UpdateGroupCommand: createCmd("UpdateGroupCommand"),
  DeleteGroupCommand: createCmd("DeleteGroupCommand"),
  ListGroupMembershipsCommand: createCmd("ListGroupMembershipsCommand"),
  CreateGroupMembershipCommand: createCmd("CreateGroupMembershipCommand"),
  DeleteGroupMembershipCommand: createCmd("DeleteGroupMembershipCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./identitystore";

const STORE = "d-9067f2a3c1";
const Q = `identityStoreId=${STORE}`;

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

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("store-id guard", () => {
  it("400s when identityStoreId query param is missing", async () => {
    const res = await get("/users");
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toContain("identityStoreId");
  });
});

describe("users", () => {
  it("lists users", async () => {
    mockSend.mockResolvedValueOnce({ Users: [{ UserId: "u1", UserName: "jane" }] });
    const res = await get(`/users?${Q}`);
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "ListUsersCommand",
        IdentityStoreId: STORE,
      })
    );
  });

  it("returns sparse users", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/users?${Q}`);
    const json = await res.json();
    expect(json.users).toEqual([]);
  });

  it("creates a user", async () => {
    mockSend.mockResolvedValueOnce({ UserId: "u1" });
    const res = await post(`/users?${Q}`, {
      userName: "jane",
      displayName: "Jane",
      emails: [{ Value: "jane@x.com" }],
    });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.userId).toBe("u1");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateUserCommand",
        UserName: "jane",
        DisplayName: "Jane",
      })
    );
  });

  it("400 user create without userName", async () => {
    expect((await post(`/users?${Q}`, { displayName: "Jane" })).status).toBe(400);
  });

  it("describes a user", async () => {
    mockSend.mockResolvedValueOnce({ UserId: "u1", DisplayName: "Jane" });
    const res = await get(`/users/u1?${Q}`);
    const json = await res.json();
    expect(json.user.DisplayName).toBe("Jane");
  });

  it("returns null user when absent", async () => {
    mockSend.mockResolvedValueOnce(null);
    const res = await get(`/users/none?${Q}`);
    const json = await res.json();
    expect(json.user).toBeNull();
  });

  it("updates a user via Operations list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put(`/users/u1?${Q}`, { displayName: "New" });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UpdateUserCommand",
        Operations: [{ AttributePath: "displayName", AttributeValue: "New" }],
      })
    );
  });

  it("400 user update without displayName", async () => {
    expect((await put(`/users/u1?${Q}`, {})).status).toBe(400);
  });

  it("deletes a user", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del(`/users/u1?${Q}`);
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteUserCommand",
        UserId: "u1",
      })
    );
  });

  it("400s a ValidationException as 400", async () => {
    mockSend.mockRejectedValueOnce(
      Object.assign(new Error("bad"), { name: "ValidationException" })
    );
    const res = await get(`/users?${Q}`);
    expect(res.status).toBe(400);
  });

  it("404s a ResourceNotFoundException", async () => {
    mockSend.mockRejectedValueOnce(
      Object.assign(new Error("none"), { name: "ResourceNotFoundException" })
    );
    const res = await get(`/users/u1?${Q}`);
    expect(res.status).toBe(404);
  });

  it("409s a ConflictException", async () => {
    mockSend.mockRejectedValueOnce(
      Object.assign(new Error("dup"), { name: "ConflictException" })
    );
    const res = await post(`/users?${Q}`, { userName: "jane" });
    expect(res.status).toBe(409);
  });

  it("rethrows unknown errors", async () => {
    mockSend.mockRejectedValueOnce(new Error("boom"));
    const res = await get(`/users?${Q}`);
    expect(res.status).toBe(500);
  });
});

describe("groups", () => {
  it("lists groups", async () => {
    mockSend.mockResolvedValueOnce({ Groups: [{ GroupId: "g1", DisplayName: "admins" }] });
    const res = await get(`/groups?${Q}`);
    const json = await res.json();
    expect(json.total).toBe(1);
  });

  it("returns sparse groups", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/groups?${Q}`);
    const json = await res.json();
    expect(json.groups).toEqual([]);
  });

  it("creates a group", async () => {
    mockSend.mockResolvedValueOnce({ GroupId: "g1" });
    const res = await post(`/groups?${Q}`, { displayName: "admins", description: "d" });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.groupId).toBe("g1");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateGroupCommand",
        DisplayName: "admins",
        Description: "d",
      })
    );
  });

  it("400 group create without displayName", async () => {
    expect((await post(`/groups?${Q}`, {})).status).toBe(400);
  });

  it("describes a group", async () => {
    mockSend.mockResolvedValueOnce({ GroupId: "g1", DisplayName: "admins" });
    const res = await get(`/groups/g1?${Q}`);
    const json = await res.json();
    expect(json.group.DisplayName).toBe("admins");
  });

  it("returns null group when absent", async () => {
    mockSend.mockResolvedValueOnce(null);
    const res = await get(`/groups/none?${Q}`);
    const json = await res.json();
    expect(json.group).toBeNull();
  });

  it("updates a group via Operations list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put(`/groups/g1?${Q}`, { description: "new" });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UpdateGroupCommand",
        Operations: [{ AttributePath: "description", AttributeValue: "new" }],
      })
    );
  });

  it("400 group update without description", async () => {
    expect((await put(`/groups/g1?${Q}`, {})).status).toBe(400);
  });

  it("deletes a group", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del(`/groups/g1?${Q}`);
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteGroupCommand",
        GroupId: "g1",
      })
    );
  });
});

describe("memberships", () => {
  it("lists group memberships", async () => {
    mockSend.mockResolvedValueOnce({
      GroupMemberships: [{ MembershipId: "m1", GroupId: "g1", MemberId: { UserId: "u1" } }],
    });
    const res = await get(`/groups/g1/memberships?${Q}`);
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.memberships[0].MemberId.UserId).toBe("u1");
  });

  it("returns sparse memberships", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/groups/g1/memberships?${Q}`);
    const json = await res.json();
    expect(json.memberships).toEqual([]);
  });

  it("creates a membership", async () => {
    mockSend.mockResolvedValueOnce({ MembershipId: "m1" });
    const res = await post(`/groups/g1/memberships?${Q}`, { userId: "u1" });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.membershipId).toBe("m1");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateGroupMembershipCommand",
        MemberId: { UserId: "u1" },
      })
    );
  });

  it("400 membership create without userId", async () => {
    expect((await post(`/groups/g1/memberships?${Q}`, {})).status).toBe(400);
  });

  it("deletes a membership", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del(`/memberships/m1?${Q}`);
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteGroupMembershipCommand",
        MembershipId: "m1",
      })
    );
  });
  it("users/groups routes map rejections through handleError", async () => {
    const reject400 = () =>
      mockSend.mockRejectedValueOnce(
        Object.assign(new Error("Invalid"), { name: "ValidationException" })
      );
    reject400();
    expect((await get(`/users?${Q}`)).status).toBe(400);
    reject400();
    expect((await get(`/users/u1?${Q}`)).status).toBe(400);
    reject400();
    expect(
      (
        await post(`/users?${Q}`, {
          userName: "u",
          name: { givenName: "A", familyName: "B" },
          emails: [{ value: "a@b.c" }],
        })
      ).status
    ).toBe(400);
    reject400();
    expect((await del(`/users/u1?${Q}`)).status).toBe(400);
    reject400();
    expect((await get(`/groups?${Q}`)).status).toBe(400);
    reject400();
    expect(
      (
        await post(`/groups?${Q}`, { displayName: "g", description: "d" })
      ).status
    ).toBe(400);
    reject400();
    expect((await del(`/groups/g1?${Q}`)).status).toBe(400);
    reject400();
    expect((await get(`/groups/g1?${Q}`)).status).toBe(400);
  });

  it("router-level error handler falls back when err.message is empty", async () => {
    mockSend.mockRejectedValueOnce(new Error(""));
    const res = await get(`/users?${Q}`);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Internal server error");
  });

  it("router-level error handler 400s on the missing-store sentinel", async () => {
    mockSend.mockRejectedValueOnce(new Error("identity store ID is required"));
    const res = await get(`/users`);
    expect(res.status).toBe(400);
  });

  it("router-level error handler returns 500 for unknown errors", async () => {
    mockSend.mockRejectedValueOnce(Object.assign(new Error("kaboom"), {}));
    const res = await get(`/users?${Q}`);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("kaboom");
  });

  it("handleError falls back to default messages when err.message is empty", async () => {
    mockSend.mockRejectedValueOnce(
      Object.assign(new Error(""), { name: "ResourceNotFoundException" })
    );
    const nf = await get(`/users/u1?${Q}`);
    expect((await nf.json()).error).toBe("Not found");

    mockSend.mockRejectedValueOnce(
      Object.assign(new Error(""), { name: "ValidationException" })
    );
    const inv = await get(`/users/u1?${Q}`);
    expect((await inv.json()).error).toBe("Validation error");

    mockSend.mockRejectedValueOnce(
      Object.assign(new Error(""), { name: "ConflictException" })
    );
    const conf = await get(`/users/u1?${Q}`);
    expect((await conf.json()).error).toBe("Conflict");
  });

  it("update routes map rejections through handleError", async () => {
    mockSend.mockRejectedValueOnce(
      Object.assign(new Error("User update invalid"), { name: "ValidationException" })
    );
    const updUser = await router.request(`/users/u1?${Q}`, {
      method: "PUT",
      body: JSON.stringify({ displayName: "New Name" }),
      headers: { "content-type": "application/json" },
    });
    expect(updUser.status).toBe(400);

    mockSend.mockRejectedValueOnce(
      Object.assign(new Error("Group update invalid"), { name: "ValidationException" })
    );
    const updGroup = await router.request(`/groups/g1?${Q}`, {
      method: "PUT",
      body: JSON.stringify({ description: "New description" }),
      headers: { "content-type": "application/json" },
    });
    expect(updGroup.status).toBe(400);
  });

  it("membership error arms — 404 / 400 / 409 map through", async () => {
    mockSend.mockRejectedValueOnce(
      Object.assign(new Error("Group not found"), { name: "ResourceNotFoundException" })
    );
    const notFound = await get(`/groups/g1/memberships?${Q}`);
    expect(notFound.status).toBe(404);

    mockSend.mockRejectedValueOnce(
      Object.assign(new Error("Invalid parameter"), { name: "ValidationException" })
    );
    const invalid = await get(`/groups/g1/memberships?${Q}`);
    expect(invalid.status).toBe(400);

    mockSend.mockRejectedValueOnce(
      Object.assign(new Error("Already exists"), { name: "ConflictException" })
    );
    const conflict = await get(`/groups/g1/memberships?${Q}`);
    expect(conflict.status).toBe(409);

    mockSend.mockRejectedValueOnce(Object.assign(new Error("boom"), { name: "InternalError" }));
    const boom = await get(`/groups/g1/memberships?${Q}`);
    expect(boom.status).toBe(500);

    mockSend.mockRejectedValueOnce(
      Object.assign(new Error("Invalid membership"), { name: "ValidationException" })
    );
    const addInvalid = await post(`/groups/g1/memberships?${Q}`, { userId: "u1" });
    expect(addInvalid.status).toBe(400);

    mockSend.mockRejectedValueOnce(
      Object.assign(new Error("Conflict"), { $metadata: { httpStatusCode: 409 } })
    );
    const addConflict = await post(`/groups/g1/memberships?${Q}`, { userId: "u1" });
    expect(addConflict.status).toBe(409);

    mockSend.mockRejectedValueOnce(
      Object.assign(new Error("Missing"), { name: "ResourceNotFoundException" })
    );
    const delMissing = await del(`/memberships/m-1?${Q}`);
    expect(delMissing.status).toBe(404);

    mockSend.mockRejectedValueOnce(
      Object.assign(new Error("Bad delete"), { name: "ValidationException" })
    );
    const delInvalid = await del(`/memberships/m-1?${Q}`);
    expect(delInvalid.status).toBe(400);
  });

});
