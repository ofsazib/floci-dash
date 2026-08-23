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
  RegisterInstanceCommand: createCmd("RegisterInstanceCommand"),
  DeregisterInstanceCommand: createCmd("DeregisterInstanceCommand"),
  DiscoverInstancesCommand: createCmd("DiscoverInstancesCommand"),
  GetInstancesHealthStatusCommand: createCmd("GetInstancesHealthStatusCommand"),
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

  it("GET /services — sparse response defaults to []", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/services");
    const body = await res.json();
    expect(body).toEqual({ services: [], total: 0 });
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

  it("GET /services/:id/instances — sparse response defaults to []", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/services/svc-1/instances");
    const body = await res.json();
    expect(body).toEqual({ instances: [], total: 0 });
  });

  describe("Instance registration + discovery", () => {
    it("POST /services/:id/instances — registers an instance", async () => {
      mockSend.mockResolvedValueOnce({ OperationId: "op-1" });
      const res = await post("/services/srv-1/instances", {
        instanceId: "i-1",
        attributes: { AWS_INSTANCE_IPV4: "10.0.0.1" },
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.operationId).toBe("op-1");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("RegisterInstanceCommand");
      expect(cmd.ServiceId).toBe("srv-1");
      expect(cmd.Attributes.AWS_INSTANCE_IPV4).toBe("10.0.0.1");
    });

    it("POST /services/:id/instances — null operationId on sparse response", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/services/srv-1/instances", { instanceId: "i-1" });
      expect((await res.json()).operationId).toBeNull();
    });

    it("DELETE /services/:id/instances/:instanceId — null operationId on sparse response", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/services/srv-1/instances/i-1");
      expect((await res.json()).operationId).toBeNull();
    });

    it("POST /services/:id/instances — 400 without instanceId", async () => {
      const res = await post("/services/srv-1/instances", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /services/:id/instances/:instanceId — deregisters", async () => {
      mockSend.mockResolvedValueOnce({ OperationId: "op-2" });
      const res = await del("/services/srv-1/instances/i-1");
      const body = await res.json();
      expect(body.operationId).toBe("op-2");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeregisterInstanceCommand");
    });

    it("GET /services/:id/instances/health — returns status map", async () => {
      mockSend.mockResolvedValueOnce({ Status: { "i-1": "HEALTHY" } });
      const res = await get("/services/srv-1/instances/health");
      const body = await res.json();
      expect(body.status["i-1"]).toBe("HEALTHY");
    });

    it("GET /services/:id/instances/health — sparse fallback", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/services/srv-1/instances/health");
      const body = await res.json();
      expect(body.status).toEqual({});
    });

    it("POST /discover — discovers instances", async () => {
      mockSend.mockResolvedValueOnce({
        Instances: [{ InstanceId: "i-1", NamespaceName: "ns", ServiceName: "svc", Attributes: { A: "B" } }],
      });
      const res = await post("/discover", { namespaceName: "ns", serviceName: "svc" });
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.instances[0].attributes).toEqual({ A: "B" });
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DiscoverInstancesCommand");
    });

    it("POST /discover — sparse instance falls back to empty attributes", async () => {
      mockSend.mockResolvedValueOnce({ Instances: [{ InstanceId: "i-1" }] });
      const res = await post("/discover", { namespaceName: "ns", serviceName: "svc" });
      const body = await res.json();
      expect(body.instances[0].attributes).toEqual({});
    });

    it("POST /discover — undefined Instances falls back to []", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/discover", { namespaceName: "ns", serviceName: "svc" });
      expect((await res.json()).instances).toEqual([]);
    });

    it("POST /discover — 400 without namespaceName", async () => {
      const res = await post("/discover", { serviceName: "svc" });
      expect(res.status).toBe(400);
    });

    it("POST /discover — 400 without serviceName", async () => {
      const res = await post("/discover", { namespaceName: "ns" });
      expect(res.status).toBe(400);
    });
  });
});
