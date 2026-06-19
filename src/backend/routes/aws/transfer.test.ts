import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockTransfer = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-transfer", () => ({
  TransferClient: mockTransfer,
  ListServersCommand: createCmd("ListServersCommand"),
  CreateServerCommand: createCmd("CreateServerCommand"),
  DescribeServerCommand: createCmd("DescribeServerCommand"),
  DeleteServerCommand: createCmd("DeleteServerCommand"),
  StartServerCommand: createCmd("StartServerCommand"),
  StopServerCommand: createCmd("StopServerCommand"),
  ListUsersCommand: createCmd("ListUsersCommand"),
  CreateUserCommand: createCmd("CreateUserCommand"),
  DescribeUserCommand: createCmd("DescribeUserCommand"),
  DeleteUserCommand: createCmd("DeleteUserCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./transfer";

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

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("Transfer Family Routes", () => {
  describe("Servers", () => {
    it("GET /servers — returns described servers", async () => {
      mockSend
        .mockResolvedValueOnce({
          Servers: [{ ServerId: "s-1234abcd", Arn: "arn:aws:transfer:us-east-1::server/s-1234abcd" }],
        })
        .mockResolvedValueOnce({
          Server: {
            ServerId: "s-1234abcd",
            Arn: "arn:aws:transfer:us-east-1::server/s-1234abcd",
            Domain: "S3",
            State: "ONLINE",
            IdentityProviderType: "SERVICE_MANAGED",
          },
        });
      const res = await get("/servers");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.servers[0].ServerId).toBe("s-1234abcd");
    });

    it("GET /servers — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ Servers: [] });
      const res = await get("/servers");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.servers).toEqual([]);
    });

    it("POST /servers — creates a server", async () => {
      mockSend.mockResolvedValueOnce({
        ServerId: "s-newserver",
      });
      const res = await post("/servers", { domain: "S3" });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.serverId).toBe("s-newserver");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateServerCommand");
    });

    it("GET /servers/:serverId — describes a server", async () => {
      mockSend.mockResolvedValueOnce({
        Server: { ServerId: "s-1234abcd", State: "ONLINE" },
      });
      const res = await get("/servers/s-1234abcd");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.server.ServerId).toBe("s-1234abcd");
    });

    it("DELETE /servers/:serverId — deletes a server", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/servers/s-1234abcd");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });

    it("POST /servers/:serverId/start — starts a server", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/servers/s-1234abcd/start");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.started).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("StartServerCommand");
    });

    it("POST /servers/:serverId/stop — stops a server", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/servers/s-1234abcd/stop");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.stopped).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("StopServerCommand");
    });
  });

  describe("Users", () => {
    it("GET /servers/:serverId/users — returns described users", async () => {
      mockSend
        .mockResolvedValueOnce({
          Users: [{ UserName: "alice" }, { UserName: "bob" }],
        })
        .mockResolvedValueOnce({
          User: {
            UserName: "alice",
            Role: "arn:aws:iam::123456789012:role/transfer-role",
            ServerId: "s-1234abcd",
          },
        })
        .mockResolvedValueOnce({
          User: {
            UserName: "bob",
            Role: "arn:aws:iam::123456789012:role/transfer-role",
            ServerId: "s-1234abcd",
          },
        });
      const res = await get("/servers/s-1234abcd/users");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(2);
      expect(body.users).toHaveLength(2);
    });

    it("GET /servers/:serverId/users — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ Users: [] });
      const res = await get("/servers/s-1234abcd/users");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.users).toEqual([]);
    });

    it("POST /servers/:serverId/users — creates a user", async () => {
      mockSend.mockResolvedValueOnce({
        UserName: "alice",
        ServerId: "s-1234abcd",
      });
      const res = await post("/servers/s-1234abcd/users", {
        userName: "alice",
        role: "arn:aws:iam::123456789012:role/transfer-role",
        homeDirectory: "/bucket/home",
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.userName).toBe("alice");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateUserCommand");
    });

    it("POST /servers/:serverId/users — 400 when userName missing", async () => {
      const res = await post("/servers/s-1234abcd/users", {
        role: "arn:aws:iam::123456789012:role/transfer-role",
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("userName is required");
    });

    it("POST /servers/:serverId/users — 400 when role missing", async () => {
      const res = await post("/servers/s-1234abcd/users", {
        userName: "alice",
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("role is required");
    });

    it("GET /servers/:serverId/users/:userName — describes a user", async () => {
      mockSend.mockResolvedValueOnce({
        User: { UserName: "alice", ServerId: "s-1234abcd" },
      });
      const res = await get("/servers/s-1234abcd/users/alice");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user.UserName).toBe("alice");
    });

    it("DELETE /servers/:serverId/users/:userName — deletes a user", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/servers/s-1234abcd/users/alice");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Tags", () => {
    it("GET /tags — returns tags for resource", async () => {
      mockSend.mockResolvedValueOnce({
        Tags: [{ Key: "env", Value: "prod" }],
      });
      const res = await get("/tags?resourceArn=arn:aws:transfer:us-east-1::server/s-1234abcd");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags).toHaveLength(1);
      expect(body.tags[0].Key).toBe("env");
    });

    it("GET /tags — returns empty array when no tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/tags?resourceArn=arn:aws:transfer:us-east-1::server/s-1234abcd");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags).toEqual([]);
    });

    it("GET /tags — 400 when no resourceArn", async () => {
      const res = await get("/tags");
      expect(res.status).toBe(400);
    });
  });
});
