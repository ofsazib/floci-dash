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
}));

vi.mock("../../clients/aws", () => ({ create: (Ctor: any, extra?: any) => new Ctor(extra) }));

import router from "./opensearch";

async function get(p: string) { return router.request(p, { method: "GET" }); }
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
});
