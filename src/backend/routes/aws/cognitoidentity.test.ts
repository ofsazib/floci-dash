import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockCognitoIdentity = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-cognito-identity", () => ({
  CognitoIdentityClient: mockCognitoIdentity,
  ListIdentityPoolsCommand: createCmd("ListIdentityPoolsCommand"),
  CreateIdentityPoolCommand: createCmd("CreateIdentityPoolCommand"),
  DescribeIdentityPoolCommand: createCmd("DescribeIdentityPoolCommand"),
  UpdateIdentityPoolCommand: createCmd("UpdateIdentityPoolCommand"),
  DeleteIdentityPoolCommand: createCmd("DeleteIdentityPoolCommand"),
  GetIdentityPoolRolesCommand: createCmd("GetIdentityPoolRolesCommand"),
  SetIdentityPoolRolesCommand: createCmd("SetIdentityPoolRolesCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
  GetPrincipalTagAttributeMapCommand: createCmd("GetPrincipalTagAttributeMapCommand"),
  SetPrincipalTagAttributeMapCommand: createCmd("SetPrincipalTagAttributeMapCommand"),
}));

vi.mock("../../clients/arns", () => ({
  callerAccountId: async () => "123456789012",
  identityPoolArn: async (poolId: string) =>
    `arn:aws:cognito-identity:us-east-1:123456789012:identitypool/${poolId}`,
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./cognitoidentity";

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

describe("GET /pools", () => {
  it("lists pools", async () => {
    mockSend.mockResolvedValueOnce({
      IdentityPools: [{ IdentityPoolId: "us-east-1:a1", IdentityPoolName: "app" }],
    });
    const res = await get("/pools");
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.total).toBe(1);
    expect(json.pools[0].IdentityPoolName).toBe("app");
  });

  it("returns sparse pools", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/pools");
    const json = await res.json();
    expect(json.pools).toEqual([]);
    expect(json.total).toBe(0);
  });
});

describe("POST /pools", () => {
  it("creates a pool with unauthenticated access", async () => {
    mockSend.mockResolvedValueOnce({
      IdentityPoolId: "us-east-1:new",
      IdentityPoolName: "app",
    });
    const res = await post("/pools", { name: "app", allowUnauthenticated: true });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.pool.IdentityPoolId).toBe("us-east-1:new");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateIdentityPoolCommand",
        IdentityPoolName: "app",
        AllowUnauthenticatedIdentities: true,
        AllowClassicFlow: false,
      })
    );
  });

  it("passes allowClassic when set", async () => {
    mockSend.mockResolvedValueOnce({ IdentityPoolId: "x" });
    await post("/pools", { name: "app", allowUnauthenticated: false, allowClassic: true });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateIdentityPoolCommand",
        AllowUnauthenticatedIdentities: false,
        AllowClassicFlow: true,
      })
    );
  });

  it("400 when name missing", async () => {
    expect((await post("/pools", { allowUnauthenticated: true })).status).toBe(400);
  });

  it("400 when allowUnauthenticated not boolean", async () => {
    expect((await post("/pools", { name: "app", allowUnauthenticated: "yes" })).status).toBe(400);
  });
});

describe("GET /pools/:id", () => {
  it("describes a pool", async () => {
    mockSend.mockResolvedValueOnce({ IdentityPoolId: "p1", IdentityPoolName: "app" });
    const res = await get("/pools/us-east-1%3Aa1");
    const json = await res.json();
    expect(json.pool.IdentityPoolName).toBe("app");
  });

  it("returns null when pool absent", async () => {
    mockSend.mockResolvedValueOnce(null);
    const res = await get("/pools/none");
    const json = await res.json();
    expect(json.pool).toBeNull();
  });
});

describe("PUT /pools/:id", () => {
  it("updates with path id forced", async () => {
    mockSend.mockResolvedValueOnce({ IdentityPoolId: "p1", IdentityPoolName: "renamed" });
    const res = await put("/pools/p1", { pool: { IdentityPoolName: "renamed" } });
    const json = await res.json();
    expect(json.pool.IdentityPoolName).toBe("renamed");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UpdateIdentityPoolCommand",
        IdentityPoolId: "p1",
        IdentityPoolName: "renamed",
      })
    );
  });

  it("400 when pool.IdentityPoolName missing", async () => {
    expect((await put("/pools/p1", { pool: {} })).status).toBe(400);
    expect((await put("/pools/p1", {})).status).toBe(400);
  });
});

describe("DELETE /pools/:id", () => {
  it("deletes a pool", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/pools/p1");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteIdentityPoolCommand",
        IdentityPoolId: "p1",
      })
    );
  });
});

describe("roles", () => {
  it("gets roles", async () => {
    mockSend.mockResolvedValueOnce({
      Roles: { authenticated: "arn:aws:iam::123456789012:role/auth" },
      RoleMappings: {},
    });
    const res = await get("/pools/p1/roles");
    const json = await res.json();
    expect(json.roles.authenticated).toContain("auth");
  });

  it("returns empty roles maps when response is sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/pools/p1/roles");
    const json = await res.json();
    expect(json.roles).toEqual({});
    expect(json.roleMappings).toEqual({});
  });

  it("maps ResourceNotFoundException to null roles", async () => {
    mockSend.mockRejectedValueOnce(
      Object.assign(new Error("none"), { name: "ResourceNotFoundException" })
    );
    const res = await get("/pools/p1/roles");
    const json = await res.json();
    expect(json.roles).toBeNull();
  });

  it("maps 404 status to null roles", async () => {
    mockSend.mockRejectedValueOnce(
      Object.assign(new Error("none"), { $metadata: { httpStatusCode: 404 } })
    );
    const res = await get("/pools/p1/roles");
    const json = await res.json();
    expect(json.roles).toBeNull();
  });

  it("rethrows other errors", async () => {
    mockSend.mockRejectedValueOnce(Object.assign(new Error("boom"), { name: "Other" }));
    const res = await get("/pools/p1/roles");
    expect(res.status).toBe(500);
  });

  it("sets roles", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/pools/p1/roles", {
      roles: { authenticated: "arn:aws:iam::123456789012:role/auth" },
    });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "SetIdentityPoolRolesCommand",
        Roles: { authenticated: "arn:aws:iam::123456789012:role/auth" },
      })
    );
  });

  it("400 when roles empty or not object", async () => {
    expect((await put("/pools/p1/roles", {})).status).toBe(400);
    expect((await put("/pools/p1/roles", { roles: {} })).status).toBe(400);
    expect((await put("/pools/p1/roles", { roles: "x" })).status).toBe(400);
  });
});

describe("tags", () => {
  it("lists tags by rebuilt ARN", async () => {
    mockSend.mockResolvedValueOnce({ Tags: { env: "dev" } });
    const res = await get("/pools/p1/tags");
    const json = await res.json();
    expect(json.tags).toEqual({ env: "dev" });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "ListTagsForResourceCommand",
        ResourceArn: "arn:aws:cognito-identity:us-east-1:123456789012:identitypool/p1",
      })
    );
  });

  it("returns empty tags when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/pools/p1/tags");
    const json = await res.json();
    expect(json.tags).toEqual({});
  });

  it("adds tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/pools/p1/tags", { tags: { env: "dev" } });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "TagResourceCommand",
        Tags: { env: "dev" },
      })
    );
  });

  it("400 when tags empty or not object", async () => {
    expect((await post("/pools/p1/tags", {})).status).toBe(400);
    expect((await post("/pools/p1/tags", { tags: {} })).status).toBe(400);
  });

  it("removes tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/pools/p1/tags/untag", { tagKeys: ["env"] });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UntagResourceCommand",
        TagKeys: ["env"],
      })
    );
  });

  it("400 when tagKeys missing or empty", async () => {
    expect((await post("/pools/p1/tags/untag", {})).status).toBe(400);
    expect((await post("/pools/p1/tags/untag", { tagKeys: [] })).status).toBe(400);
  });
});

describe("provider tags", () => {
  it("gets the principal tag attribute map", async () => {
    mockSend.mockResolvedValueOnce({
      UseDefaults: true,
      PrincipalTags: { sub: "${sub}" },
    });
    const res = await get("/pools/p1/provider-tags?provider=login.myapp");
    const json = await res.json();
    expect(json.useDefaults).toBe(true);
    expect(json.principalTags.sub).toBe("${sub}");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "GetPrincipalTagAttributeMapCommand",
        IdentityProviderName: "login.myapp",
      })
    );
  });

  it("returns sparse defaults when provider-map response is empty", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/pools/p1/provider-tags?provider=login.myapp");
    const json = await res.json();
    expect(json.useDefaults).toBe(false);
    expect(json.principalTags).toEqual({});
  });

  it("400 when provider query param missing", async () => {
    expect((await get("/pools/p1/provider-tags")).status).toBe(400);
  });

  it("sets the principal tag attribute map", async () => {
    mockSend.mockResolvedValueOnce({ UseDefaults: false, PrincipalTags: { sub: "${sub}" } });
    const res = await put("/pools/p1/provider-tags", {
      identityProviderName: "login.myapp",
      useDefaults: true,
      principalTags: { sub: "${sub}" },
    });
    const json = await res.json();
    expect(json.principalTags.sub).toBe("${sub}");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "SetPrincipalTagAttributeMapCommand",
        UseDefaults: true,
      })
    );
  });

  it("400 when identityProviderName missing", async () => {
    expect((await put("/pools/p1/provider-tags", { principalTags: {} })).status).toBe(400);
  });

  it("defaults useDefaults to false when omitted", async () => {
    mockSend.mockResolvedValueOnce({});
    await put("/pools/p1/provider-tags", { identityProviderName: "p" });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ __cmdName: "SetPrincipalTagAttributeMapCommand", UseDefaults: false })
    );
  });
});
