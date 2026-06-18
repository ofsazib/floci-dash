import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-cognito-identity-provider", () => ({
  CognitoIdentityProviderClient: vi.fn(function () {
    return { send: mockSend };
  }),
  ListUserPoolsCommand: createCmd("ListUserPoolsCommand"),
  DescribeUserPoolCommand: createCmd("DescribeUserPoolCommand"),
  CreateUserPoolCommand: createCmd("CreateUserPoolCommand"),
  DeleteUserPoolCommand: createCmd("DeleteUserPoolCommand"),
  ListUsersCommand: createCmd("ListUsersCommand"),
  AdminCreateUserCommand: createCmd("AdminCreateUserCommand"),
  AdminDeleteUserCommand: createCmd("AdminDeleteUserCommand"),
  AdminDisableUserCommand: createCmd("AdminDisableUserCommand"),
  AdminEnableUserCommand: createCmd("AdminEnableUserCommand"),
  AdminSetUserPasswordCommand: createCmd("AdminSetUserPasswordCommand"),
  ListGroupsCommand: createCmd("ListGroupsCommand"),
  CreateGroupCommand: createCmd("CreateGroupCommand"),
  DeleteGroupCommand: createCmd("DeleteGroupCommand"),
  ListUserPoolClientsCommand: createCmd("ListUserPoolClientsCommand"),
  DescribeUserPoolClientCommand: createCmd("DescribeUserPoolClientCommand"),
  CreateUserPoolClientCommand: createCmd("CreateUserPoolClientCommand"),
  DeleteUserPoolClientCommand: createCmd("DeleteUserPoolClientCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: (Ctor: any, extra?: any) => new Ctor(extra),
}));

import router from "./cognito";

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
  mockSend.mockReset();
});

describe("Cognito Routes", () => {
  describe("User Pools", () => {
    it("GET /user-pools — lists pools", async () => {
      mockSend.mockResolvedValueOnce({
        UserPools: [{ Id: "us-east-1_abc", Name: "mypool", Status: "Enabled" }],
      });
      const res = await get("/user-pools");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /user-pools — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ UserPools: [] });
      const res = await get("/user-pools");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /user-pools/:id — describes pool", async () => {
      mockSend.mockResolvedValueOnce({ UserPool: { Id: "us-east-1_abc", Name: "mypool" } });
      const res = await get("/user-pools/us-east-1_abc");
      expect(res.status).toBe(200);
    });

    it("POST /user-pools — creates pool (201)", async () => {
      mockSend.mockResolvedValueOnce({ UserPool: { Id: "us-east-1_new", Name: "newpool" } });
      const res = await post("/user-pools", { poolName: "newpool" });
      expect(res.status).toBe(201);
    });

    it("POST /user-pools — 400 if poolName missing", async () => {
      const res = await post("/user-pools", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /user-pools/:id — deletes pool", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/user-pools/us-east-1_abc");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Users", () => {
    it("GET /user-pools/:id/users — lists users", async () => {
      mockSend.mockResolvedValueOnce({
        Users: [{ Username: "user1", UserStatus: "CONFIRMED", Enabled: true }],
      });
      const res = await get("/user-pools/us-east-1_abc/users");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /user-pools/:id/users — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ Users: [] });
      const res = await get("/user-pools/us-east-1_abc/users");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("POST /user-pools/:id/users — creates user (201)", async () => {
      mockSend.mockResolvedValueOnce({ User: { Username: "user1" } });
      const res = await post("/user-pools/us-east-1_abc/users", { username: "user1" });
      expect(res.status).toBe(201);
    });

    it("POST /user-pools/:id/users — 400 if username missing", async () => {
      const res = await post("/user-pools/us-east-1_abc/users", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /user-pools/:id/users/:username — deletes user", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/user-pools/us-east-1_abc/users/user1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });

    it("PUT /user-pools/:id/users/:username/disable — disables user", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/user-pools/us-east-1_abc/users/user1/disable");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.disabled).toBe(true);
    });

    it("PUT /user-pools/:id/users/:username/enable — enables user", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/user-pools/us-east-1_abc/users/user1/enable");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.enabled).toBe(true);
    });

    it("PUT /user-pools/:id/users/:username/password — sets password", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/user-pools/us-east-1_abc/users/user1/password", {
        password: "NewPass123!",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
    });

    it("PUT /user-pools/:id/users/:username/password — 400 if password missing", async () => {
      const res = await put("/user-pools/us-east-1_abc/users/user1/password", {});
      expect(res.status).toBe(400);
    });
  });

  describe("Groups", () => {
    it("GET /user-pools/:id/groups — lists groups", async () => {
      mockSend.mockResolvedValueOnce({
        Groups: [{ GroupName: "admins", UserPoolId: "us-east-1_abc" }],
      });
      const res = await get("/user-pools/us-east-1_abc/groups");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /user-pools/:id/groups — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ Groups: [] });
      const res = await get("/user-pools/us-east-1_abc/groups");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("POST /user-pools/:id/groups — creates group (201)", async () => {
      mockSend.mockResolvedValueOnce({ Group: { GroupName: "admins" } });
      const res = await post("/user-pools/us-east-1_abc/groups", { groupName: "admins" });
      expect(res.status).toBe(201);
    });

    it("POST /user-pools/:id/groups — 400 if groupName missing", async () => {
      const res = await post("/user-pools/us-east-1_abc/groups", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /user-pools/:id/groups/:groupName — deletes group", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/user-pools/us-east-1_abc/groups/admins");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("User Pool Clients", () => {
    it("GET /user-pools/:id/clients — lists clients", async () => {
      mockSend.mockResolvedValueOnce({
        UserPoolClients: [{ ClientId: "client-1", ClientName: "myapp" }],
      });
      const res = await get("/user-pools/us-east-1_abc/clients");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /user-pools/:id/clients — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ UserPoolClients: [] });
      const res = await get("/user-pools/us-east-1_abc/clients");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /user-pools/:id/clients/:clientId — describes client", async () => {
      mockSend.mockResolvedValueOnce({ UserPoolClient: { ClientId: "client-1" } });
      const res = await get("/user-pools/us-east-1_abc/clients/client-1");
      expect(res.status).toBe(200);
    });

    it("POST /user-pools/:id/clients — creates client (201)", async () => {
      mockSend.mockResolvedValueOnce({ UserPoolClient: { ClientId: "new-client" } });
      const res = await post("/user-pools/us-east-1_abc/clients", { clientName: "myapp" });
      expect(res.status).toBe(201);
    });

    it("POST /user-pools/:id/clients — 400 if clientName missing", async () => {
      const res = await post("/user-pools/us-east-1_abc/clients", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /user-pools/:id/clients/:clientId — deletes client", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/user-pools/us-east-1_abc/clients/client-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });
});
