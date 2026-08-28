import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());
const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) { return { __cmdName: name, ...args }; });
  };
});

vi.mock("@aws-sdk/client-opensearch", () => ({
  OpenSearchClient: vi.fn(function () { return { send: mockSend }; }),
  ListDomainNamesCommand: createCmd("ListDomainNamesCommand"),
  DescribeDomainCommand: createCmd("DescribeDomainCommand"),
  CreateDomainCommand: createCmd("CreateDomainCommand"),
  DeleteDomainCommand: createCmd("DeleteDomainCommand"),
  ListVersionsCommand: createCmd("ListVersionsCommand"),
  UpdateDomainConfigCommand: createCmd("UpdateDomainConfigCommand"),
  UpgradeDomainCommand: createCmd("UpgradeDomainCommand"),
  AddTagsCommand: createCmd("AddTagsCommand"),
  ListTagsCommand: createCmd("ListTagsCommand"),
  RemoveTagsCommand: createCmd("RemoveTagsCommand"),
  DescribeDomainsCommand: createCmd("DescribeDomainsCommand"),
  DescribeDomainConfigCommand: createCmd("DescribeDomainConfigCommand"),
}));

vi.mock("../../clients/aws", () => ({ create: (Ctor: any, extra?: any) => new Ctor(extra) }));

import router from "./opensearch";

async function get(p: string) { return router.request(p, { method: "GET" }); }
async function put(p: string, b?: any) {
  return router.request(p, {
    method: "PUT",
    body: b != null ? JSON.stringify(b) : undefined,
    headers: b != null ? { "content-type": "application/json" } : undefined,
  });
}
async function post(p: string, b?: any) {
  return router.request(p, { method: "POST", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}
async function del(p: string) { return router.request(p, { method: "DELETE" }); }

beforeEach(() => mockSend.mockReset());

describe("OpenSearch Routes", () => {
  it("GET /domains — lists domains", async () => {
    mockSend.mockResolvedValueOnce({ DomainNames: [{ DomainName: "my-domain", EngineType: "OpenSearch" }] });
    const res = await get("/domains");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /domains — empty", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/domains");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("GET /domains/:name — describes domain", async () => {
    mockSend.mockResolvedValueOnce({ DomainStatus: { DomainName: "my-domain", ARN: "arn:..." } });
    const res = await get("/domains/my-domain");
    expect(res.status).toBe(200);
  });

  it("POST /domains — creates domain (201)", async () => {
    mockSend.mockResolvedValueOnce({ DomainStatus: { DomainName: "new-domain" } });
    const res = await post("/domains", { domainName: "new-domain" });
    expect(res.status).toBe(201);
  });

  it("POST /domains — 400 if domainName missing", async () => {
    const res = await post("/domains", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /domains/:name — deletes domain", async () => {
    mockSend.mockResolvedValueOnce({ DomainStatus: { DomainName: "my-domain" } });
    const res = await del("/domains/my-domain");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it("GET /versions — lists versions", async () => {
    mockSend.mockResolvedValueOnce({ Versions: ["OpenSearch_2.11", "OpenSearch_2.9"] });
    const res = await get("/versions");
    const body = await res.json();
    expect(body.total).toBe(2);
  });

  it("GET /versions — sparse response defaults to empty array", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/versions");
    const body = await res.json();
    expect(body.versions).toEqual([]);
    expect(body.total).toBe(0);
  });

  describe("Config update + upgrade + tags", () => {
    it("PUT /domains/:name/config — updates domain config", async () => {
      mockSend.mockResolvedValueOnce({ ChangeId: "ch-1" });
      const res = await put("/domains/d1/config", {
        clusterConfig: { InstanceType: "r6g.large.search" },
        ebsOptions: { VolumeSize: 100 },
      });
      const body = await res.json();
      expect(body.changeId).toBe("ch-1");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("UpdateDomainConfigCommand");
      expect(cmd.ClusterConfig.InstanceType).toBe("r6g.large.search");
    });

    it("PUT /domains/:name/config — null changeId on sparse", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/domains/d1/config", {});
      expect((await res.json()).changeId).toBeNull();
    });

    it("POST /domains/:name/upgrade — starts upgrade", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/domains/d1/upgrade", { targetVersion: "OpenSearch_2.11", performCheckOnly: true });
      const body = await res.json();
      expect(body.upgradeStarted).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("UpgradeDomainCommand");
      expect(cmd.PerformCheckOnly).toBe(true);
    });

    it("POST /domains/:name/upgrade — 400 without targetVersion", async () => {
      const res = await post("/domains/d1/upgrade", {});
      expect(res.status).toBe(400);
    });

    it("GET /domains/:name/tags — maps tags", async () => {
      mockSend.mockResolvedValueOnce({ TagList: [{ Key: "env", Value: "prod" }] });
      const res = await get("/domains/d1/tags?arn=arn:d1");
      const body = await res.json();
      expect(body.tags).toEqual([{ key: "env", value: "prod" }]);
      expect(mockSend.mock.calls[0][0].ARN).toBe("arn:d1");
    });

    it("GET /domains/:name/tags — sparse fallback + 400 without arn", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/domains/d1/tags?arn=arn:x");
      expect((await res.json()).tags).toEqual([]);
      const res400 = await get("/domains/d1/tags");
      expect(res400.status).toBe(400);
    });

    it("POST /domains/:name/tags — adds tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/domains/d1/tags?arn=arn:d1", { tags: { env: "prod" } });
      expect((await res.json()).tagged).toBe(true);
      expect(mockSend.mock.calls[0][0].TagList).toEqual([{ Key: "env", Value: "prod" }]);
    });

    it("POST /domains/:name/tags — 400s for missing arn/tags", async () => {
      expect((await post("/domains/d1/tags", { tags: { a: "b" } })).status).toBe(400);
      expect((await post("/domains/d1/tags?arn=x", {})).status).toBe(400);
      expect((await post("/domains/d1/tags?arn=x", { tags: {} })).status).toBe(400);
    });
  });
});

describe("Remove Tags", () => {
  it("removes tag keys from a domain", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/domains/d1/tags/remove?arn=arn:d1", { tagKeys: ["env", "team"] });
    expect(res.status).toBe(200);
    expect((await res.json()).removed).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("RemoveTagsCommand");
    expect(cmd.TagKeys).toEqual(["env", "team"]);
  });

  it("returns 400 without arn", async () => {
    const res = await post("/domains/d1/tags/remove", { tagKeys: ["k"] });
    expect(res.status).toBe(400);
  });

  it("returns 400 without tagKeys", async () => {
    const res = await post("/domains/d1/tags/remove?arn=arn:d1", {});
    expect(res.status).toBe(400);
  });
});

describe("Describe Domains (batch)", () => {
  it("describes multiple domains", async () => {
    mockSend.mockResolvedValueOnce({
      DomainStatusList: [{ DomainName: "d1" }, { DomainName: "d2" }],
    });
    const res = await post("/domains/describe", { domainNames: ["d1", "d2"] });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.domainStatusList).toHaveLength(2);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DescribeDomainsCommand");
  });

  it("returns 400 without domainNames", async () => {
    const res = await post("/domains/describe", {});
    expect(res.status).toBe(400);
  });
});

describe("Describe Domain Config", () => {
  it("returns domain config", async () => {
    mockSend.mockResolvedValueOnce({
      DomainConfig: { DomainName: "d1", ClusterConfig: { InstanceType: "m5.large.search" } },
    });
    const res = await get("/domains/d1/config");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.domainConfig.DomainName).toBe("d1");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DescribeDomainConfigCommand");
  });
});
