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
  CreatePrivateDnsNamespaceCommand: createCmd("CreatePrivateDnsNamespaceCommand"),
  CreatePublicDnsNamespaceCommand: createCmd("CreatePublicDnsNamespaceCommand"),
  GetOperationCommand: createCmd("GetOperationCommand"),
  ListOperationsCommand: createCmd("ListOperationsCommand"),
  GetInstanceCommand: createCmd("GetInstanceCommand"),
  DiscoverInstancesRevisionCommand: createCmd("DiscoverInstancesRevisionCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
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

  describe("DNS namespaces + operations + instance detail", () => {
    it("POST /namespaces/private-dns — creates with VPC", async () => {
      mockSend.mockResolvedValueOnce({ OperationId: "op-1", Namespace: { Id: "ns-1" } });
      const res = await post("/namespaces/private-dns", { name: "corp.internal", vpc: "vpc-1", description: "private" });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.operationId).toBe("op-1");
      expect(body.namespace.Id).toBe("ns-1");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("CreatePrivateDnsNamespaceCommand");
      expect(cmd.Vpc).toBe("vpc-1");
    });

    it("POST /namespaces/private-dns — 400s", async () => {
      expect((await post("/namespaces/private-dns", { vpc: "v" })).status).toBe(400);
      expect((await post("/namespaces/private-dns", { name: "n" })).status).toBe(400);
    });

    it("POST /namespaces/private-dns — sparse fallbacks", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/namespaces/private-dns", { name: "n", vpc: "v" });
      const body = await res.json();
      expect(body.operationId).toBeUndefined();
      expect(body.namespace).toBeNull();
    });

    it("POST /namespaces/public-dns — creates without VPC", async () => {
      mockSend.mockResolvedValueOnce({ OperationId: "op-2" });
      const res = await post("/namespaces/public-dns", { name: "example.com" });
      expect(res.status).toBe(201);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("CreatePublicDnsNamespaceCommand");
      expect(cmd.Name).toBe("example.com");
    });

    it("POST /namespaces/public-dns — 400 without name", async () => {
      expect((await post("/namespaces/public-dns", {})).status).toBe(400);
    });

    it("GET /operations — lists id/status pairs", async () => {
      mockSend.mockResolvedValueOnce({ Operations: [{ Id: "op-1", Status: "SUCCESS" }] });
      const res = await get("/operations");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.operations[0]).toEqual({ id: "op-1", status: "SUCCESS" });
    });

    it("GET /operations — empty fallback", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/operations");
      expect((await res.json()).operations).toEqual([]);
    });

    it("GET /operations/:id — maps operation detail", async () => {
      mockSend.mockResolvedValueOnce({
        Operation: { Id: "op-1", Status: "SUCCESS", CreateDate: new Date(0), Targets: { NAMESPACE: "ns-1" } },
      });
      const res = await get("/operations/op-1");
      const body = await res.json();
      expect(body.operation.targets.NAMESPACE).toBe("ns-1");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetOperationCommand");
    });

    it("GET /operations/:id — null when missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/operations/none");
      expect((await res.json()).operation).toBeNull();
    });

    it("GET /operations/:id — sparse targets fallback", async () => {
      mockSend.mockResolvedValueOnce({ Operation: { Id: "op-1" } });
      const res = await get("/operations/op-1");
      const body = await res.json();
      expect(body.operation.targets).toEqual({});
    });

    it("GET /services/:id/instances/:instanceId — maps instance", async () => {
      mockSend.mockResolvedValueOnce({ Instance: { Id: "i-1", Attributes: { AWS_INSTANCE_IPV4: "10.0.0.1" } } });
      const res = await get("/services/srv-1/instances/i-1");
      const body = await res.json();
      expect(body.instance.attributes.AWS_INSTANCE_IPV4).toBe("10.0.0.1");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetInstanceCommand");
    });

    it("GET /services/:id/instances/:instanceId — null + sparse attrs", async () => {
      mockSend.mockResolvedValueOnce({});
      const resNull = await get("/services/s/instances/none");
      expect((await resNull.json()).instance).toBeNull();
      mockSend.mockResolvedValueOnce({ Instance: { Id: "i-1" } });
      const res = await get("/services/s/instances/i-1");
      expect((await res.json()).instance.attributes).toEqual({});
    });
  });

  describe("Discover Instances Revision + Tags", () => {
    it("GET /discover-instances-revision", async () => {
      mockSend.mockResolvedValueOnce({ InstancesRevision: 42 });
      const res = await get("/discover-instances-revision?namespaceName=ns&serviceName=svc");
      const body = await res.json();
      expect(body.instancesRevision).toBe(42);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DiscoverInstancesRevisionCommand");
    });

    it("GET /discover-instances-revision — null when missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/discover-instances-revision?namespaceName=ns&serviceName=svc");
      const body = await res.json();
      expect(body.instancesRevision).toBeNull();
    });

    it("GET /resources/tags", async () => {
      mockSend.mockResolvedValueOnce({ Tags: [{ Key: "env", Value: "prod" }] });
      const res = await get("/resources/tags?arn=arn:aws:servicediscovery:us-east-1:123:service/srv-1");
      const body = await res.json();
      expect(body.tags).toHaveLength(1);
      expect(body.tags[0].Key).toBe("env");
    });

    it("GET /resources/tags — 400 without arn", async () => {
      const res = await get("/resources/tags");
      expect(res.status).toBe(400);
    });

    it("POST /resources/tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await router.request("/resources/tags", {
        method: "POST",
        body: JSON.stringify({ arn: "arn:x", tags: [{ Key: "k", Value: "v" }] }),
        headers: { "content-type": "application/json" },
      });
      const body = await res.json();
      expect(body.tagged).toBe(true);
    });

    it("POST /resources/tags — 400 without arn or tags", async () => {
      const res = await router.request("/resources/tags", {
        method: "POST",
        body: JSON.stringify({ arn: "arn:x" }),
        headers: { "content-type": "application/json" },
      });
      expect(res.status).toBe(400);
    });

    it("DELETE /resources/tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await router.request("/resources/tags?arn=arn:x&tagKeys=env,team", { method: "DELETE" });
      const body = await res.json();
      expect(body.untagged).toBe(true);
    });

    it("DELETE /resources/tags — 400 without arn or tagKeys", async () => {
      const res = await router.request("/resources/tags?tagKeys=env", { method: "DELETE" });
      expect(res.status).toBe(400);
    });
  });
});
