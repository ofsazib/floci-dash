import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

vi.mock("@aws-sdk/client-lightsail", () => ({
  LightsailClient: vi.fn(function () {
    return { send: mockSend };
  }),
  GetInstancesCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  GetInstanceCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  CreateInstancesCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  DeleteInstanceCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  StartInstanceCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  StopInstanceCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  RebootInstanceCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  GetInstanceStateCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  GetInstancePortStatesCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  OpenInstancePublicPortsCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  PutInstancePublicPortsCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  CloseInstancePublicPortsCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  GetDisksCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  GetDiskCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  CreateDiskCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  AttachDiskCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  DetachDiskCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  DeleteDiskCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  GetStaticIpsCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  GetStaticIpCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  AllocateStaticIpCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  AttachStaticIpCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  DetachStaticIpCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  ReleaseStaticIpCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  GetKeyPairsCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  GetKeyPairCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  CreateKeyPairCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  DeleteKeyPairCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  TagResourceCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
  UntagResourceCommand: vi.fn(function (this: any, args?: any) { return { ...args }; }),
}));

import router from "./lightsail";

describe("Lightsail routes", () => {
  beforeEach(() => vi.clearAllMocks());

  const get = (path: string) => router.request(path);
  const post = (path: string, body?: any) =>
    router.request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  const del = (path: string) =>
    router.request(path, { method: "DELETE" });

  // ── Instances ──────────────────────────────────────────

  describe("GET /instances", () => {
    it("returns instances list", async () => {
      mockSend.mockResolvedValueOnce({ instances: [{ name: "i-1", state: { name: "running" } }] });
      const res = await get("/instances");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.instances).toHaveLength(1);
    });

    it("returns empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/instances");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.instances).toEqual([]);
    });
  });

  describe("GET /instances/:name", () => {
    it("returns a single instance", async () => {
      mockSend.mockResolvedValueOnce({ instance: { name: "i-1" } });
      const res = await get("/instances/i-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.instance.name).toBe("i-1");
    });
  });

  describe("POST /instances", () => {
    it("creates an instance", async () => {
      mockSend.mockResolvedValueOnce({ operations: [{ id: "op-1" }] });
      const res = await post("/instances", {
        instanceNames: ["new-i"],
        availabilityZone: "us-east-1a",
        bundleId: "nano_3_0",
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.operations).toHaveLength(1);
    });

    it("returns 400 without instanceNames", async () => {
      const res = await post("/instances", { availabilityZone: "us-east-1a", bundleId: "nano_3_0" });
      expect(res.status).toBe(400);
    });

    it("returns 400 without availabilityZone", async () => {
      const res = await post("/instances", { instanceNames: ["i-1"], bundleId: "nano_3_0" });
      expect(res.status).toBe(400);
    });

    it("returns 400 without bundleId", async () => {
      const res = await post("/instances", { instanceNames: ["i-1"], availabilityZone: "us-east-1a" });
      expect(res.status).toBe(400);
    });

    it("creates an instance with empty result", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/instances", {
        instanceNames: ["new-i"],
        availabilityZone: "us-east-1a",
        bundleId: "nano_3_0",
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.operations).toEqual([]);
    });
  });

  describe("DELETE /instances/:name", () => {
    it("deletes an instance", async () => {
      mockSend.mockResolvedValueOnce({ operations: [{ id: "op-1" }] });
      const res = await del("/instances/i-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.operations).toHaveLength(1);
    });
  });

  describe("POST /instances/:name/start", () => {
    it("starts an instance", async () => {
      mockSend.mockResolvedValueOnce({ operations: [{ id: "op-1" }] });
      const res = await post("/instances/i-1/start");
      expect(res.status).toBe(200);
    });
  });

  describe("POST /instances/:name/stop", () => {
    it("stops an instance", async () => {
      mockSend.mockResolvedValueOnce({ operations: [{ id: "op-1" }] });
      const res = await post("/instances/i-1/stop");
      expect(res.status).toBe(200);
    });
  });

  describe("POST /instances/:name/reboot", () => {
    it("reboots an instance", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/instances/i-1/reboot");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.rebooted).toBe(true);
    });
  });

  describe("GET /instances/:name/state", () => {
    it("returns instance state", async () => {
      mockSend.mockResolvedValueOnce({ state: { name: "running" } });
      const res = await get("/instances/i-1/state");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.state.name).toBe("running");
    });
  });

  describe("GET /instances/:name/ports", () => {
    it("returns port states", async () => {
      mockSend.mockResolvedValueOnce({ portStates: [{ fromPort: 80, toPort: 80 }] });
      const res = await get("/instances/i-1/ports");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.portStates).toHaveLength(1);
    });
  });

  describe("POST /instances/:name/open-ports", () => {
    it("opens ports", async () => {
      mockSend.mockResolvedValueOnce({ operation: { id: "op-1" } });
      const res = await post("/instances/i-1/open-ports", { portInfo: { fromPort: 80, toPort: 80, protocol: "tcp" } });
      expect(res.status).toBe(200);
    });
  });

  describe("POST /instances/:name/ports", () => {
    it("puts ports", async () => {
      mockSend.mockResolvedValueOnce({ operation: { id: "op-1" } });
      const res = await post("/instances/i-1/ports", { portInfos: [{ fromPort: 443, toPort: 443, protocol: "tcp" }] });
      expect(res.status).toBe(200);
    });
  });

  describe("POST /instances/:name/close-ports", () => {
    it("closes ports", async () => {
      mockSend.mockResolvedValueOnce({ operation: { id: "op-1" } });
      const res = await post("/instances/i-1/close-ports", { portInfo: { fromPort: 80, toPort: 80, protocol: "tcp" } });
      expect(res.status).toBe(200);
    });
  });

  // ── Disks ──────────────────────────────────────────────

  describe("GET /disks", () => {
    it("returns disks", async () => {
      mockSend.mockResolvedValueOnce({ disks: [{ name: "d-1" }] });
      const res = await get("/disks");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.disks).toHaveLength(1);
    });

    it("returns empty disks", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/disks");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.disks).toEqual([]);
    });
  });

  describe("GET /disks/:name", () => {
    it("returns a disk", async () => {
      mockSend.mockResolvedValueOnce({ disk: { name: "d-1" } });
      const res = await get("/disks/d-1");
      expect(res.status).toBe(200);
    });
  });

  describe("POST /disks", () => {
    it("creates a disk", async () => {
      mockSend.mockResolvedValueOnce({ operations: [{ id: "op-1" }] });
      const res = await post("/disks", { diskName: "d-new", availabilityZone: "us-east-1a", sizeInGb: 8 });
      expect(res.status).toBe(201);
    });

    it("returns 400 without diskName", async () => {
      const res = await post("/disks", { availabilityZone: "us-east-1a", sizeInGb: 8 });
      expect(res.status).toBe(400);
    });

    it("returns 400 without availabilityZone", async () => {
      const res = await post("/disks", { diskName: "d-1", sizeInGb: 8 });
      expect(res.status).toBe(400);
    });

    it("returns 400 without sizeInGb", async () => {
      const res = await post("/disks", { diskName: "d-1", availabilityZone: "us-east-1a" });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /disks/:name/attach", () => {
    it("attaches a disk", async () => {
      mockSend.mockResolvedValueOnce({ operations: [] });
      const res = await post("/disks/d-1/attach", { instanceName: "i-1", diskPath: "/dev/xvdf" });
      expect(res.status).toBe(200);
    });

    it("returns 400 without instanceName", async () => {
      const res = await post("/disks/d-1/attach", { diskPath: "/dev/xvdf" });
      expect(res.status).toBe(400);
    });

    it("returns 400 without diskPath", async () => {
      const res = await post("/disks/d-1/attach", { instanceName: "i-1" });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /disks/:name/detach", () => {
    it("detaches a disk", async () => {
      mockSend.mockResolvedValueOnce({ operations: [] });
      const res = await post("/disks/d-1/detach");
      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /disks/:name", () => {
    it("deletes a disk", async () => {
      mockSend.mockResolvedValueOnce({ operations: [] });
      const res = await del("/disks/d-1");
      expect(res.status).toBe(200);
    });
  });

  // ── Static IPs ─────────────────────────────────────────

  describe("GET /static-ips", () => {
    it("returns static IPs", async () => {
      mockSend.mockResolvedValueOnce({ staticIps: [{ name: "sip-1" }] });
      const res = await get("/static-ips");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.staticIps).toHaveLength(1);
    });

    it("returns empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/static-ips");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.staticIps).toEqual([]);
    });
  });

  describe("GET /static-ips/:name", () => {
    it("returns a static IP", async () => {
      mockSend.mockResolvedValueOnce({ staticIp: { name: "sip-1" } });
      const res = await get("/static-ips/sip-1");
      expect(res.status).toBe(200);
    });
  });

  describe("POST /static-ips", () => {
    it("allocates a static IP", async () => {
      mockSend.mockResolvedValueOnce({ operations: [] });
      const res = await post("/static-ips", { staticIpName: "sip-new" });
      expect(res.status).toBe(201);
    });

    it("returns 400 without staticIpName", async () => {
      const res = await post("/static-ips", {});
      expect(res.status).toBe(400);
    });
  });

  describe("POST /static-ips/:name/attach", () => {
    it("attaches static IP", async () => {
      mockSend.mockResolvedValueOnce({ operations: [] });
      const res = await post("/static-ips/sip-1/attach", { instanceName: "i-1" });
      expect(res.status).toBe(200);
    });

    it("returns 400 without instanceName", async () => {
      const res = await post("/static-ips/sip-1/attach", {});
      expect(res.status).toBe(400);
    });
  });

  describe("POST /static-ips/:name/detach", () => {
    it("detaches static IP", async () => {
      mockSend.mockResolvedValueOnce({ operations: [] });
      const res = await post("/static-ips/sip-1/detach");
      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /static-ips/:name", () => {
    it("releases static IP", async () => {
      mockSend.mockResolvedValueOnce({ operations: [] });
      const res = await del("/static-ips/sip-1");
      expect(res.status).toBe(200);
    });
  });

  // ── Key Pairs ──────────────────────────────────────────

  describe("GET /key-pairs", () => {
    it("returns key pairs", async () => {
      mockSend.mockResolvedValueOnce({ keyPairs: [{ name: "kp-1" }] });
      const res = await get("/key-pairs");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.keyPairs).toHaveLength(1);
    });

    it("returns empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/key-pairs");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.keyPairs).toEqual([]);
    });
  });

  describe("GET /key-pairs/:name", () => {
    it("returns a key pair", async () => {
      mockSend.mockResolvedValueOnce({ keyPair: { name: "kp-1" } });
      const res = await get("/key-pairs/kp-1");
      expect(res.status).toBe(200);
    });
  });

  describe("POST /key-pairs", () => {
    it("creates a key pair", async () => {
      mockSend.mockResolvedValueOnce({ keyPair: { name: "kp-1" }, privateKeyBase64: "abc123" });
      const res = await post("/key-pairs", { keyPairName: "kp-new" });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.privateKey).toBe("abc123");
    });

    it("returns 400 without keyPairName", async () => {
      const res = await post("/key-pairs", {});
      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /key-pairs/:name", () => {
    it("deletes a key pair", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/key-pairs/kp-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  // ── Tags ───────────────────────────────────────────────

  describe("POST /tags", () => {
    it("tags a resource", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tags", { resourceName: "i-1", tags: [{ key: "k", value: "v" }] });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tagged).toBe(true);
    });

    it("returns 400 without resourceName", async () => {
      const res = await post("/tags", { tags: [] });
      expect(res.status).toBe(400);
    });

    it("returns 400 without tags", async () => {
      const res = await post("/tags", { resourceName: "i-1" });
      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /tags", () => {
    it("untags a resource", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await router.request("/tags", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceName: "i-1", tagKeys: ["k"] }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.untagged).toBe(true);
    });

    it("returns 400 without resourceName", async () => {
      const res = await router.request("/tags", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagKeys: ["k"] }),
      });
      expect(res.status).toBe(400);
    });

    it("returns 400 without tagKeys", async () => {
      const res = await router.request("/tags", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceName: "i-1" }),
      });
      expect(res.status).toBe(400);
    });
  });

  // ── Fallback arms (?? right-side branches) ───────────

  describe("fallback arms", () => {
    it("GET /instances returns empty when instances undefined", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/instances");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.instances).toEqual([]);
    });

    it("GET /instances/:name returns null when instance undefined", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/instances/i-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.instance).toBeNull();
    });

    it("DELETE /instances returns empty operations", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/instances/i-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.operations).toEqual([]);
    });

    it("POST /instances/start returns empty operations", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/instances/i-1/start");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.operations).toEqual([]);
    });

    it("POST /instances/stop returns empty operations", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/instances/i-1/stop");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.operations).toEqual([]);
    });

    it("GET /instances/:name/state returns null when state undefined", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/instances/i-1/state");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.state).toBeNull();
    });

    it("GET /instances/:name/ports returns empty", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/instances/i-1/ports");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.portStates).toEqual([]);
    });

    it("POST /instances/:name/open-ports returns null operation", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/instances/i-1/open-ports", { portInfo: { fromPort: 80, toPort: 80, protocol: "tcp" } });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.operation).toBeNull();
    });

    it("POST /instances/:name/ports returns null operation", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/instances/i-1/ports", { portInfos: [{ fromPort: 443, toPort: 443, protocol: "tcp" }] });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.operation).toBeNull();
    });

    it("POST /instances/:name/close-ports returns null operation", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/instances/i-1/close-ports", { portInfo: { fromPort: 80, toPort: 80, protocol: "tcp" } });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.operation).toBeNull();
    });

    it("GET /disks returns empty when disks undefined", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/disks");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.disks).toEqual([]);
    });

    it("GET /disks/:name returns null when disk undefined", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/disks/d-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.disk).toBeNull();
    });

    it("POST /disks returns empty operations", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/disks", { diskName: "d-1", availabilityZone: "us-east-1a", sizeInGb: 8 });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.operations).toEqual([]);
    });

    it("POST /disks/:name/attach returns empty operations", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/disks/d-1/attach", { instanceName: "i-1", diskPath: "/dev/xvdf" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.operations).toEqual([]);
    });

    it("POST /disks/:name/detach returns empty operations", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/disks/d-1/detach");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.operations).toEqual([]);
    });

    it("DELETE /disks/:name returns empty operations", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/disks/d-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.operations).toEqual([]);
    });

    it("GET /static-ips returns empty", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/static-ips");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.staticIps).toEqual([]);
    });

    it("GET /static-ips/:name returns null", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/static-ips/sip-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.staticIp).toBeNull();
    });

    it("POST /static-ips returns empty operations", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/static-ips", { staticIpName: "sip-1" });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.operations).toEqual([]);
    });

    it("POST /static-ips/:name/attach returns empty operations", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/static-ips/sip-1/attach", { instanceName: "i-1" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.operations).toEqual([]);
    });

    it("POST /static-ips/:name/detach returns empty operations", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/static-ips/sip-1/detach");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.operations).toEqual([]);
    });

    it("DELETE /static-ips/:name returns empty operations", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/static-ips/sip-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.operations).toEqual([]);
    });

    it("GET /key-pairs returns empty", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/key-pairs");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.keyPairs).toEqual([]);
    });

    it("GET /key-pairs/:name returns null", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/key-pairs/kp-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.keyPair).toBeNull();
    });

    it("POST /key-pairs returns null keypair and private key", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/key-pairs", { keyPairName: "kp-1" });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.keyPair).toBeNull();
      expect(body.privateKey).toBeNull();
    });

    it("POST /instances/:name/open-ports with empty body", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/instances/i-1/open-ports", {});
      expect(res.status).toBe(200);
    });

    it("POST /instances/:name/ports with empty body", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/instances/i-1/ports", {});
      expect(res.status).toBe(200);
    });

    it("POST /instances/:name/close-ports with empty body", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/instances/i-1/close-ports", {});
      expect(res.status).toBe(200);
    });
  });

});
