import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSend, mocks } = vi.hoisted(() => {
  const mockSend = vi.fn();
  const createCmd = (name: string) =>
    vi.fn(function (this: any, args?: any) {
      const cmd: any = { ...args, __cmdName: name };
      return cmd;
    });
  return {
    mockSend,
    mocks: {
      PrometheusClient: vi.fn(function (this: any) {
        return { send: mockSend };
      }),
      AmpClient: vi.fn(function (this: any) {
        return { send: mockSend };
      }),
      CreateWorkspaceCommand: createCmd("CreateWorkspaceCommand"),
      ListWorkspacesCommand: createCmd("ListWorkspacesCommand"),
      DescribeWorkspaceCommand: createCmd("DescribeWorkspaceCommand"),
      DeleteWorkspaceCommand: createCmd("DeleteWorkspaceCommand"),
      UpdateWorkspaceAliasCommand: createCmd("UpdateWorkspaceAliasCommand"),
      ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
      TagResourceCommand: createCmd("TagResourceCommand"),
      UntagResourceCommand: createCmd("UntagResourceCommand"),
      CreateRuleGroupsNamespaceCommand: createCmd("CreateRuleGroupsNamespaceCommand"),
      ListRuleGroupsNamespacesCommand: createCmd("ListRuleGroupsNamespacesCommand"),
      DescribeRuleGroupsNamespaceCommand: createCmd("DescribeRuleGroupsNamespaceCommand"),
      PutRuleGroupsNamespaceCommand: createCmd("PutRuleGroupsNamespaceCommand"),
      DeleteRuleGroupsNamespaceCommand: createCmd("DeleteRuleGroupsNamespaceCommand"),
    },
  };
});

vi.mock("@aws-sdk/client-amp", () => mocks);

import router from "./amp";

const get = (path: string) => router.request(path);
const post = (path: string, body?: any) =>
  router.request(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
const put = (path: string, body?: any) =>
  router.request(path, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
const del = (path: string) => router.request(path, { method: "DELETE" });

beforeEach(() => {
  mockSend.mockReset();
});

describe("AMP — workspaces", () => {
  it("GET /workspaces — sends ListWorkspacesCommand without alias", async () => {
    mockSend.mockResolvedValueOnce({
      workspaces: [
        { workspaceId: "ws-1", alias: "a", arn: "arn:aws:aps:us-east-1:1:workspace/ws-1", status: { statusCode: "ACTIVE" } },
      ],
    });
    const res = await get("/workspaces");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.workspaces).toHaveLength(1);
    expect(body.total).toBe(1);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("ListWorkspacesCommand");
    expect(cmd.alias).toBeUndefined();
    expect(cmd.maxResults).toBe(100);
  });

  it("GET /workspaces — forwards alias filter", async () => {
    mockSend.mockResolvedValueOnce({ workspaces: [] });
    const res = await get("/workspaces?alias=prod");
    expect(res.status).toBe(200);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.alias).toBe("prod");
    const body = await res.json();
    expect(body.workspaces).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("GET /workspaces — falls back to empty when workspaces undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/workspaces");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.workspaces).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("POST /workspaces — creates a workspace", async () => {
    mockSend.mockResolvedValueOnce({
      workspaceId: "ws-new",
      arn: "arn:aws:aps:us-east-1:1:workspace/ws-new",
      status: { statusCode: "CREATING" },
    });
    const res = await post("/workspaces", { alias: "lawful", tags: { env: "dev" } });
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.workspaceId).toBe("ws-new");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("CreateWorkspaceCommand");
    expect(cmd.alias).toBe("lawful");
    expect(cmd.tags).toEqual({ env: "dev" });
  });

  it("POST /workspaces — 400 when alias missing", async () => {
    const res = await post("/workspaces", {});
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/alias/);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("GET /workspaces/:id — describes a workspace", async () => {
    mockSend.mockResolvedValueOnce({
      workspace: {
        workspaceId: "ws-1",
        alias: "a",
        prometheusEndpoint: "https://aps-workspaces.us-east-1.amazonaws.com/workspaces/ws-1/",
      },
    });
    const res = await get("/workspaces/ws-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.workspace.workspaceId).toBe("ws-1");
    expect(body.workspace.prometheusEndpoint).toBeTruthy();
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DescribeWorkspaceCommand");
    expect(cmd.workspaceId).toBe("ws-1");
  });

  it("DELETE /workspaces/:id — deletes a workspace", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/workspaces/ws-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DeleteWorkspaceCommand");
    expect(cmd.workspaceId).toBe("ws-1");
  });

  it("PUT /workspaces/:id/alias — updates the alias", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/workspaces/ws-1/alias", { alias: "new-alias" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("UpdateWorkspaceAliasCommand");
    expect(cmd.workspaceId).toBe("ws-1");
    expect(cmd.alias).toBe("new-alias");
  });

  it("PUT /workspaces/:id/alias — 400 when alias missing", async () => {
    const res = await put("/workspaces/ws-1/alias", {});
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });
});

describe("AMP — tags", () => {
  it("GET /tags — lists tags for a resource ARN", async () => {
    mockSend.mockResolvedValueOnce({ tags: { env: "prod" } });
    const res = await get("/tags?resourceArn=arn:aws:aps:us-east-1:1:workspace/ws-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tags).toEqual({ env: "prod" });
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("ListTagsForResourceCommand");
    expect(cmd.resourceArn).toBe("arn:aws:aps:us-east-1:1:workspace/ws-1");
  });

  it("GET /tags — falls back to empty object when tags undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/tags?resourceArn=arn:aws:aps:us-east-1:1:workspace/ws-1");
    const body = await res.json();
    expect(body.tags).toEqual({});
  });

  it("GET /tags — 400 when resourceArn missing", async () => {
    const res = await get("/tags");
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("POST /tags — sends TagResourceCommand", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/tags", { resourceArn: "arn:aws:aps:ws-1", tags: { a: "b" } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tagged).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("TagResourceCommand");
    expect(cmd.resourceArn).toBe("arn:aws:aps:ws-1");
    expect(cmd.tags).toEqual({ a: "b" });
  });

  it("POST /tags — 400 when params missing", async () => {
    const res = await post("/tags", { resourceArn: "arn" });
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("POST /tags/untag — sends UntagResourceCommand", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/tags/untag", { resourceArn: "arn:aws:aps:ws-1", tagKeys: ["a"] });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.untagged).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("UntagResourceCommand");
    expect(cmd.tagKeys).toEqual(["a"]);
  });

  it("POST /tags/untag — 400 when params missing", async () => {
    const res = await post("/tags/untag", { resourceArn: "arn" });
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });
});

describe("AMP — rule groups namespaces", () => {
  beforeEach(() => mockSend.mockReset());

  it("GET /workspaces/:id/namespaces — lists namespaces", async () => {
    mockSend.mockResolvedValueOnce({
      ruleGroupsNamespaces: [
        { name: "ns1", arn: "arn:ns1", status: { statusCode: "ACTIVE" }, createdAt: "t1", modifiedAt: "t2" },
      ],
    });
    const res = await get("/workspaces/w1/namespaces");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.total).toBe(1);
    expect(body.namespaces[0].name).toBe("ns1");
    expect(body.namespaces[0].status).toBe("ACTIVE");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListRuleGroupsNamespacesCommand");
  });

  it("GET /workspaces/:id/namespaces — string status falls through ?? arm", async () => {
    mockSend.mockResolvedValueOnce({
      ruleGroupsNamespaces: [{ name: "ns2", arn: "arn:ns2", status: "ACTIVE" }],
    });
    const res = await get("/workspaces/w1/namespaces");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.namespaces[0].status).toBe("ACTIVE");
  });

  it("GET /workspaces/:id/namespaces — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const body = await (await get("/workspaces/w1/namespaces")).json();
    expect(body.namespaces).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("POST /workspaces/:id/namespaces — creates namespace", async () => {
    mockSend.mockResolvedValueOnce({ name: "ns1", arn: "arn:ns1", status: { statusCode: "CREATING" } });
    const res = await post("/workspaces/w1/namespaces", { name: "ns1", data: "groups: []" });
    const body = await res.json();
    expect(res.status).toBe(202);
    expect(body.name).toBe("ns1");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateRuleGroupsNamespaceCommand");
    expect(mockSend.mock.calls[0][0].data).toBe("groups: []");
  });

  it("POST /workspaces/:id/namespaces — 400 when name missing", async () => {
    expect((await post("/workspaces/w1/namespaces", { data: "x" })).status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("POST /workspaces/:id/namespaces — 400 when data missing", async () => {
    expect((await post("/workspaces/w1/namespaces", { name: "ns1" })).status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("GET /workspaces/:id/namespaces/:name — describes namespace", async () => {
    mockSend.mockResolvedValueOnce({
      ruleGroupsNamespace: {
        name: "ns1", arn: "arn:ns1", status: { statusCode: "ACTIVE" },
        createdAt: "t1", modifiedAt: "t2", data: "groups: []",
      },
    });
    const res = await get("/workspaces/w1/namespaces/ns1");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.namespace.name).toBe("ns1");
    expect(body.namespace.status).toBe("ACTIVE");
    expect(body.namespace.data).toBe("groups: []");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DescribeRuleGroupsNamespaceCommand");
  });

  it("GET /workspaces/:id/namespaces/:name — string status falls through ?? arm", async () => {
    mockSend.mockResolvedValueOnce({
      ruleGroupsNamespace: { name: "ns1", arn: "arn:ns1", status: "UPDATING" },
    });
    const res = await get("/workspaces/w1/namespaces/ns1");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.namespace.status).toBe("UPDATING");
  });

  it("GET /workspaces/:id/namespaces/:name — null namespace when missing", async () => {
    mockSend.mockResolvedValueOnce({});
    const body = await (await get("/workspaces/w1/namespaces/ns1")).json();
    expect(body.namespace).toBeNull();
  });

  it("GET /workspaces/:id/namespaces/:name — 404 on ResourceNotFound", async () => {
    mockSend.mockRejectedValueOnce(Object.assign(new Error("nf"), { name: "ResourceNotFoundException" }));
    expect((await get("/workspaces/w1/namespaces/ns1")).status).toBe(404);
  });

  it("GET /workspaces/:id/namespaces/:name — rethrows unknown errors", async () => {
    mockSend.mockRejectedValueOnce(Object.assign(new Error("boom"), { name: "ThrottlingException" }));
    expect((await get("/workspaces/w1/namespaces/ns1")).status).toBe(500);
  });

  it("PUT /workspaces/:id/namespaces/:name — updates namespace", async () => {
    mockSend.mockResolvedValueOnce({ name: "ns1", arn: "arn:ns1", status: { statusCode: "UPDATING" } });
    const res = await put("/workspaces/w1/namespaces/ns1", { data: "groups: [1]" });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.updatedAt).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("PutRuleGroupsNamespaceCommand");
  });

  it("PUT /workspaces/:id/namespaces/:name — 400 when data missing", async () => {
    expect((await put("/workspaces/w1/namespaces/ns1", {})).status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("DELETE /workspaces/:id/namespaces/:name — deletes namespace", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request("/workspaces/w1/namespaces/ns1", { method: "DELETE" });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteRuleGroupsNamespaceCommand");
  });
});
