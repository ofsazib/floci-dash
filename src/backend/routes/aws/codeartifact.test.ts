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

vi.mock("@aws-sdk/client-codeartifact", () => ({
  CodeartifactClient: mockClient,
  ListDomainsCommand: createCmd("ListDomainsCommand"),
  CreateDomainCommand: createCmd("CreateDomainCommand"),
  DeleteDomainCommand: createCmd("DeleteDomainCommand"),
  GetAuthorizationTokenCommand: createCmd("GetAuthorizationTokenCommand"),
  ListRepositoriesCommand: createCmd("ListRepositoriesCommand"),
  CreateRepositoryCommand: createCmd("CreateRepositoryCommand"),
  DeleteRepositoryCommand: createCmd("DeleteRepositoryCommand"),
  GetRepositoryEndpointCommand: createCmd("GetRepositoryEndpointCommand"),
  AssociateExternalConnectionCommand: createCmd("AssociateExternalConnectionCommand"),
  DisassociateExternalConnectionCommand: createCmd("DisassociateExternalConnectionCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./codeartifact";

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

async function del(path: string, body?: any) {
  return router.request(path, {
    method: "DELETE",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("domains", () => {
  it("lists domains", async () => {
    mockSend.mockResolvedValueOnce({
      domains: [{ name: "probe-domain", arn: "arn:domain", status: "Active" }],
      nextToken: "tok",
    });
    const res = await get("/domains");
    const json = await res.json();
    expect(json.domains).toHaveLength(1);
    expect(json.nextToken).toBe("tok");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ __cmdName: "ListDomainsCommand" })
    );
  });

  it("returns an empty domain list when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/domains");
    const json = await res.json();
    expect(json.domains).toEqual([]);
    expect(json.nextToken).toBeUndefined();
  });

  it("400 create without name", async () => {
    expect((await post("/domains", {})).status).toBe(400);
  });

  it("creates a domain", async () => {
    mockSend.mockResolvedValueOnce({
      domain: { name: "probe-domain", arn: "arn:domain", status: "Active" },
    });
    const res = await post("/domains", { name: "probe-domain", encryptionKey: "arn:key" });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.domain.name).toBe("probe-domain");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ domain: "probe-domain", encryptionKey: "arn:key" })
    );
  });

  it("returns a null domain when create omits it", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/domains", { name: "probe-domain" });
    const json = await res.json();
    expect(json.domain).toBeNull();
  });

  it("400 delete without name", async () => {
    expect((await del("/domains", {})).status).toBe(400);
  });

  it("returns a null domain when delete omits it", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/domains", { name: "probe-domain" });
    const json = await res.json();
    expect(json.domain).toBeNull();
  });

  it("deletes a domain", async () => {
    mockSend.mockResolvedValueOnce({ domain: { name: "probe-domain", status: "Deleted" } });
    const res = await del("/domains", { name: "probe-domain" });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ domain: "probe-domain" })
    );
  });
});

describe("authorization token", () => {
  it("400 without domain", async () => {
    expect((await post("/authorization-token", {})).status).toBe(400);
  });

  it("fetches an authorization token", async () => {
    mockSend.mockResolvedValueOnce({
      authorizationToken: "tok-123",
      expiration: 1759000000,
    });
    const res = await post("/authorization-token", { domain: "probe-domain" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.authorizationToken).toBe("tok-123");
    expect(json.expiration).toBe(1759000000);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ domain: "probe-domain" })
    );
  });
});

describe("repositories", () => {
  it("lists repositories", async () => {
    mockSend.mockResolvedValueOnce({
      repositories: [{ name: "probe-repo", domainName: "probe-domain", arn: "arn:repo" }],
    });
    const res = await get("/repositories");
    const json = await res.json();
    expect(json.repositories).toHaveLength(1);
  });

  it("returns an empty repository list when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/repositories");
    const json = await res.json();
    expect(json.repositories).toEqual([]);
  });

  it("passes a repository prefix", async () => {
    mockSend.mockResolvedValueOnce({ repositories: [] });
    await get("/repositories?prefix=probe");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ repositoryPrefix: "probe" })
    );
  });

  it("omits the prefix when absent", async () => {
    mockSend.mockResolvedValueOnce({ repositories: [] });
    await get("/repositories");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.repositoryPrefix).toBeUndefined();
  });

  it("400 create without domain or name", async () => {
    expect((await post("/repositories", {})).status).toBe(400);
    expect((await post("/repositories", { domain: "probe-domain" })).status).toBe(400);
  });

  it("creates a repository with upstreams", async () => {
    mockSend.mockResolvedValueOnce({
      repository: { name: "probe-repo", domainName: "probe-domain" },
    });
    const res = await post("/repositories", {
      domain: "probe-domain",
      name: "probe-repo",
      description: "d",
      upstreams: ["upstream-a"],
    });
    expect(res.status).toBe(201);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: "probe-domain",
        repository: "probe-repo",
        upstreams: [{ repositoryName: "upstream-a" }],
      })
    );
  });

  it("returns a null repository when create omits it", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/repositories", { domain: "probe-domain", name: "probe-repo" });
    const json = await res.json();
    expect(json.repository).toBeNull();
  });

  it("creates a repository without upstreams", async () => {
    mockSend.mockResolvedValueOnce({ repository: { name: "probe-repo" } });
    await post("/repositories", { domain: "probe-domain", name: "probe-repo" });
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.upstreams).toBeUndefined();
  });

  it("400 delete without domain or name", async () => {
    expect((await del("/repositories", {})).status).toBe(400);
    expect((await del("/repositories", { domain: "probe-domain" })).status).toBe(400);
  });

  it("returns a null repository when delete omits it", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/repositories", { domain: "probe-domain", name: "probe-repo" });
    const json = await res.json();
    expect(json.repository).toBeNull();
  });

  it("deletes a repository", async () => {
    mockSend.mockResolvedValueOnce({ repository: { name: "probe-repo" } });
    const res = await del("/repositories", { domain: "probe-domain", name: "probe-repo" });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ domain: "probe-domain", repository: "probe-repo" })
    );
  });

  it("400 endpoint without domain or repository", async () => {
    expect((await get("/repositories/endpoint")).status).toBe(400);
    expect((await get("/repositories/endpoint?domain=probe-domain")).status).toBe(400);
  });

  it("gets an npm endpoint by default", async () => {
    mockSend.mockResolvedValueOnce({
      repositoryEndpoint: "https://probe-domain-000000000000.d.codeartifact.us-east-1.amazonaws.com/npm/probe-repo/",
    });
    const res = await get("/repositories/endpoint?domain=probe-domain&repository=probe-repo");
    const json = await res.json();
    expect(json.repositoryEndpoint).toContain("/npm/probe-repo/");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: "probe-domain",
        repository: "probe-repo",
        format: "npm",
      })
    );
  });
});

describe("external connections", () => {
  it("400 associate without required fields", async () => {
    expect((await post("/external-connections", {})).status).toBe(400);
    expect(
      (await post("/external-connections", { domain: "probe-domain" })).status
    ).toBe(400);
    expect(
      (
        await post("/external-connections", {
          domain: "probe-domain",
          repository: "probe-repo",
        })
      ).status
    ).toBe(400);
  });

  it("associates an external connection", async () => {
    mockSend.mockResolvedValueOnce({
      repository: { name: "probe-repo", externalConnections: [{ externalConnectionName: "public:npmjs" }] },
    });
    const res = await post("/external-connections", {
      domain: "probe-domain",
      repository: "probe-repo",
      externalConnection: "public:npmjs",
    });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: "probe-domain",
        repository: "probe-repo",
        externalConnection: "public:npmjs",
      })
    );
  });

  it("returns a null repository when associate omits it", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/external-connections", {
      domain: "probe-domain",
      repository: "probe-repo",
      externalConnection: "public:npmjs",
    });
    const json = await res.json();
    expect(json.repository).toBeNull();
  });

  it("400 disassociate without required fields", async () => {
    expect((await del("/external-connections", {})).status).toBe(400);
    expect(
      (await del("/external-connections", { domain: "probe-domain" })).status
    ).toBe(400);
    expect(
      (
        await del("/external-connections", {
          domain: "probe-domain",
          repository: "probe-repo",
        })
      ).status
    ).toBe(400);
  });

  it("returns a null repository when disassociate omits it", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/external-connections", {
      domain: "probe-domain",
      repository: "probe-repo",
      externalConnection: "public:npmjs",
    });
    const json = await res.json();
    expect(json.repository).toBeNull();
  });

  it("disassociates an external connection", async () => {
    mockSend.mockResolvedValueOnce({ repository: { name: "probe-repo" } });
    const res = await del("/external-connections", {
      domain: "probe-domain",
      repository: "probe-repo",
      externalConnection: "public:npmjs",
    });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ externalConnection: "public:npmjs" })
    );
  });
});
