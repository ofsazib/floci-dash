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

vi.mock("@aws-sdk/client-redshift-serverless", () => ({
  RedshiftServerlessClient: mockClient,
  ListNamespacesCommand: createCmd("ListNamespacesCommand"),
  CreateNamespaceCommand: createCmd("CreateNamespaceCommand"),
  GetNamespaceCommand: createCmd("GetNamespaceCommand"),
  UpdateNamespaceCommand: createCmd("UpdateNamespaceCommand"),
  DeleteNamespaceCommand: createCmd("DeleteNamespaceCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./redshiftserverless";

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

const NS = {
  namespaceName: "analytics",
  namespaceArn: "arn:aws:redshift-serverless:us-east-1:123456789012:namespace/abc",
  dbName: "dev",
  status: "AVAILABLE",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("GET /namespaces", () => {
  it("lists namespaces", async () => {
    mockSend.mockResolvedValueOnce({ namespaces: [NS] });
    const res = await get("/namespaces");
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.total).toBe(1);
    expect(json.namespaces[0].namespaceName).toBe("analytics");
  });

  it("returns sparse namespaces", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/namespaces");
    const json = await res.json();
    expect(json.namespaces).toEqual([]);
    expect(json.total).toBe(0);
  });
});

describe("POST /namespaces", () => {
  it("creates a namespace", async () => {
    mockSend.mockResolvedValueOnce({ namespace: NS });
    const res = await post("/namespaces", {
      namespaceName: "analytics",
      dbName: "dev",
      adminUsername: "admin",
    });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.namespace.namespaceName).toBe("analytics");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateNamespaceCommand",
        namespaceName: "analytics",
        dbName: "dev",
        adminUsername: "admin",
      })
    );
  });

  it("passes optional fields through", async () => {
    mockSend.mockResolvedValueOnce({ namespace: NS });
    await post("/namespaces", {
      namespaceName: "analytics",
      dbName: "dev",
      adminUsername: "admin",
      kmsKeyId: "kms-key",
      defaultIamRoleArn: "arn:aws:iam::123456789012:role/r",
      iamRoles: ["arn:aws:iam::123456789012:role/r"],
      logExports: ["userlog"],
    });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateNamespaceCommand",
        kmsKeyId: "kms-key",
        logExports: ["userlog"],
      })
    );
  });

  it("400 when namespaceName missing", async () => {
    expect((await post("/namespaces", { dbName: "dev", adminUsername: "admin" })).status).toBe(400);
  });

  it("400 when dbName missing", async () => {
    expect((await post("/namespaces", { namespaceName: "n", adminUsername: "admin" })).status).toBe(400);
  });

  it("400 when adminUsername missing", async () => {
    expect((await post("/namespaces", { namespaceName: "n", dbName: "dev" })).status).toBe(400);
  });
});

describe("GET /namespaces/:name", () => {
  it("gets a namespace", async () => {
    mockSend.mockResolvedValueOnce({ namespace: NS });
    const res = await get("/namespaces/analytics");
    const json = await res.json();
    expect(json.namespace.dbName).toBe("dev");
  });

  it("returns null when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/namespaces/none");
    const json = await res.json();
    expect(json.namespace).toBeNull();
  });
});

describe("PUT /namespaces/:name", () => {
  it("updates adminUsername", async () => {
    mockSend.mockResolvedValueOnce({ namespace: { ...NS, adminUsername: "newadmin" } });
    const res = await put("/namespaces/analytics", { adminUsername: "newadmin" });
    const json = await res.json();
    expect(json.namespace.adminUsername).toBe("newadmin");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UpdateNamespaceCommand",
        namespaceName: "analytics",
        adminUsername: "newadmin",
      })
    );
  });

  it("400 when no updatable field is provided", async () => {
    expect((await put("/namespaces/analytics", {})).status).toBe(400);
  });
});

describe("DELETE /namespaces/:name", () => {
  it("deletes a namespace", async () => {
    mockSend.mockResolvedValueOnce({ namespace: NS });
    const res = await del("/namespaces/analytics");
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.namespace.namespaceName).toBe("analytics");
  });

  it("returns null namespace when absent in response", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/namespaces/analytics");
    const json = await res.json();
    expect(json.namespace).toBeNull();
  });
});

describe("tags", () => {
  it("lists tags by ARN", async () => {
    mockSend.mockResolvedValueOnce({ tags: [{ key: "env", value: "dev" }] });
    const res = await get("/namespaces/analytics/tags?arn=arn%3Aaws");
    const json = await res.json();
    expect(json.tags).toEqual([{ key: "env", value: "dev" }]);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "ListTagsForResourceCommand",
        resourceArn: "arn:aws",
      })
    );
  });

  it("returns sparse tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/namespaces/analytics/tags?arn=arn%3Aaws");
    const json = await res.json();
    expect(json.tags).toEqual([]);
  });

  it("400 tag list without arn", async () => {
    expect((await get("/namespaces/analytics/tags")).status).toBe(400);
  });

  it("adds tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/namespaces/analytics/tags", {
      arn: "arn:aws",
      tags: [{ key: "env", value: "dev" }],
    });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "TagResourceCommand",
        resourceArn: "arn:aws",
        tags: [{ key: "env", value: "dev" }],
      })
    );
  });

  it("400 add tags without arn or empty tags", async () => {
    expect((await post("/namespaces/analytics/tags", { tags: [{ key: "k", value: "v" }] })).status).toBe(400);
    expect((await post("/namespaces/analytics/tags", { arn: "arn:aws" })).status).toBe(400);
    expect((await post("/namespaces/analytics/tags", { arn: "arn:aws", tags: [] })).status).toBe(400);
  });

  it("removes tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/namespaces/analytics/tags/untag", {
      arn: "arn:aws",
      tagKeys: ["env"],
    });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UntagResourceCommand",
        tagKeys: ["env"],
      })
    );
  });

  it("400 untag without arn or empty keys", async () => {
    expect((await post("/namespaces/analytics/tags/untag", { tagKeys: ["env"] })).status).toBe(400);
    expect((await post("/namespaces/analytics/tags/untag", { arn: "arn:aws" })).status).toBe(400);
    expect((await post("/namespaces/analytics/tags/untag", { arn: "arn:aws", tagKeys: [] })).status).toBe(400);
  });
});
