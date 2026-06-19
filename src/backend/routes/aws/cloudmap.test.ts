import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());
const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) { return { __cmdName: name, ...args }; });
  };
});

vi.mock("@aws-sdk/client-servicediscovery", () => ({
  ServiceDiscoveryClient: vi.fn(function () { return { send: mockSend }; }),
  ListNamespacesCommand: createCmd("ListNamespacesCommand"),
  GetNamespaceCommand: createCmd("GetNamespaceCommand"),
  CreateHttpNamespaceCommand: createCmd("CreateHttpNamespaceCommand"),
  DeleteNamespaceCommand: createCmd("DeleteNamespaceCommand"),
  ListServicesCommand: createCmd("ListServicesCommand"),
  GetServiceCommand: createCmd("GetServiceCommand"),
  CreateServiceCommand: createCmd("CreateServiceCommand"),
  DeleteServiceCommand: createCmd("DeleteServiceCommand"),
  ListInstancesCommand: createCmd("ListInstancesCommand"),
}));

vi.mock("../../clients/aws", () => ({ create: (Ctor: any, extra?: any) => new Ctor(extra) }));

import router from "./cloudmap";

async function get(p: string) { return router.request(p, { method: "GET" }); }
async function post(p: string, b?: any) {
  return router.request(p, { method: "POST", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}
async function del(p: string) { return router.request(p, { method: "DELETE" }); }

beforeEach(() => mockSend.mockReset());

describe("Cloud Map Routes", () => {
  it("GET /namespaces — lists namespaces", async () => {
    mockSend.mockResolvedValueOnce({ Namespaces: [{ Id: "ns-1", Name: "my-ns", Type: "HTTP" }] });
    const res = await get("/namespaces");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /namespaces — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/namespaces");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("GET /namespaces/:id — gets namespace", async () => {
    mockSend.mockResolvedValueOnce({ Namespace: { Id: "ns-1", Name: "my-ns" } });
    const res = await get("/namespaces/ns-1");
    expect(res.status).toBe(200);
  });

  it("POST /namespaces — creates namespace (201)", async () => {
    mockSend.mockResolvedValueOnce({ OperationId: "op-1" });
    const res = await post("/namespaces", { name: "my-ns" });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.operationId).toBe("op-1");
  });

  it("POST /namespaces — 400 if name missing", async () => {
    const res = await post("/namespaces", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /namespaces/:id — deletes namespace", async () => {
    mockSend.mockResolvedValueOnce({ OperationId: "op-1" });
    const res = await del("/namespaces/ns-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.operationId).toBe("op-1");
  });

  it("GET /services — lists all services", async () => {
    mockSend.mockResolvedValueOnce({ Services: [{ Id: "svc-1", Name: "my-svc" }] });
    const res = await get("/services");
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /services?namespaceId=ns-1 — filtered", async () => {
    mockSend.mockResolvedValueOnce({ Services: [] });
    const res = await get("/services?namespaceId=ns-1");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("GET /services/:id — gets service", async () => {
    mockSend.mockResolvedValueOnce({ Service: { Id: "svc-1", Name: "my-svc" } });
    const res = await get("/services/svc-1");
    expect(res.status).toBe(200);
  });

  it("POST /services — creates service (201)", async () => {
    mockSend.mockResolvedValueOnce({ Service: { Id: "svc-1" } });
    const res = await post("/services", { name: "my-svc" });
    expect(res.status).toBe(201);
  });

  it("POST /services — 400 if name missing", async () => {
    const res = await post("/services", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /services/:id — deletes service", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/services/svc-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it("GET /services/:id/instances — lists instances", async () => {
    mockSend.mockResolvedValueOnce({ Instances: [{ Id: "inst-1" }] });
    const res = await get("/services/svc-1/instances");
    const body = await res.json();
    expect(body.total).toBe(1);
  });
});
