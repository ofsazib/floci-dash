import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockSend, createCmd } = vi.hoisted(() => {
  const mockSend = vi.fn();
  const createCmd = (name: string) => function (this: any, input: any) { return { __cmd: name, ...(input || {}) }; };
  return { mockSend, createCmd };
});

vi.mock("../../clients/aws", () => ({
  create: vi.fn(() => ({ send: mockSend })),
}));

vi.mock("@aws-sdk/client-elastic-load-balancing", () => ({
  ElasticLoadBalancingClient: class {},
  AddTagsCommand: createCmd("AddTagsCommand"),
  ApplySecurityGroupsToLoadBalancerCommand: createCmd("ApplySecurityGroupsToLoadBalancerCommand"),
  AttachLoadBalancerToSubnetsCommand: createCmd("AttachLoadBalancerToSubnetsCommand"),
  ConfigureHealthCheckCommand: createCmd("ConfigureHealthCheckCommand"),
  CreateLoadBalancerCommand: createCmd("CreateLoadBalancerCommand"),
  CreateLoadBalancerListenersCommand: createCmd("CreateLoadBalancerListenersCommand"),
  DeleteLoadBalancerCommand: createCmd("DeleteLoadBalancerCommand"),
  DeleteLoadBalancerListenersCommand: createCmd("DeleteLoadBalancerListenersCommand"),
  DeregisterInstancesFromLoadBalancerCommand: createCmd("DeregisterInstancesFromLoadBalancerCommand"),
  DescribeAccountLimitsCommand: createCmd("DescribeAccountLimitsCommand"),
  DescribeInstanceHealthCommand: createCmd("DescribeInstanceHealthCommand"),
  DescribeLoadBalancerAttributesCommand: createCmd("DescribeLoadBalancerAttributesCommand"),
  DescribeLoadBalancersCommand: createCmd("DescribeLoadBalancersCommand"),
  DescribeTagsCommand: createCmd("DescribeTagsCommand"),
  DetachLoadBalancerFromSubnetsCommand: createCmd("DetachLoadBalancerFromSubnetsCommand"),
  DisableAvailabilityZonesForLoadBalancerCommand: createCmd("DisableAvailabilityZonesForLoadBalancerCommand"),
  EnableAvailabilityZonesForLoadBalancerCommand: createCmd("EnableAvailabilityZonesForLoadBalancerCommand"),
  ModifyLoadBalancerAttributesCommand: createCmd("ModifyLoadBalancerAttributesCommand"),
  RegisterInstancesWithLoadBalancerCommand: createCmd("RegisterInstancesWithLoadBalancerCommand"),
  RemoveTagsCommand: createCmd("RemoveTagsCommand"),
}));

import elbclassicRoutes from "./elbclassic";
import { Hono } from "hono";

const app = new Hono();
app.route("/", elbclassicRoutes);

const get = (path: string) => app.request(path);
const post = (path: string, json?: any) =>
  app.request(path, json === undefined ? { method: "POST" } : { method: "POST", body: JSON.stringify(json), headers: { "content-type": "application/json" } });
const put = (path: string, json?: any) =>
  app.request(path, json === undefined ? { method: "PUT" } : { method: "PUT", body: JSON.stringify(json), headers: { "content-type": "application/json" } });
const del = (path: string) => app.request(path, { method: "DELETE" });

const lbDescription = {
  LoadBalancerName: "web",
  DNSName: "web-abc.elb.amazonaws.com",
  Scheme: "internet-facing",
  CreatedTime: "t",
  VPCId: "vpc-1",
  AvailabilityZones: ["us-east-1a"],
  Subnets: ["subnet-1"],
  SecurityGroups: ["sg-1"],
  Instances: [{ InstanceId: "i-1" }],
  ListenerDescriptions: [{ Listener: { Protocol: "HTTP", LoadBalancerPort: 80, InstancePort: 8080 } }],
};

beforeEach(() => {
  mockSend.mockReset();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("elbclassic — load balancers", () => {
  it("GET /load-balancers maps descriptions", async () => {
    mockSend.mockResolvedValueOnce({ LoadBalancerDescriptions: [lbDescription] });
    const b = await (await get("/load-balancers")).json();
    expect(b.total).toBe(1);
    expect(b.loadBalancers[0]).toEqual({
      name: "web",
      dnsName: "web-abc.elb.amazonaws.com",
      scheme: "internet-facing",
      createdTime: "t",
      vpcId: "vpc-1",
      zones: ["us-east-1a"],
      subnets: ["subnet-1"],
      securityGroups: ["sg-1"],
      instances: ["i-1"],
      listeners: [{ Protocol: "HTTP", LoadBalancerPort: 80, InstancePort: 8080 }],
    });
  });

  it("GET /load-balancers handles undefined and sparse rows", async () => {
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/load-balancers")).json()).loadBalancers).toEqual([]);
    mockSend.mockResolvedValueOnce({ LoadBalancerDescriptions: [{}] });
    const b = await (await get("/load-balancers")).json();
    expect(b.loadBalancers[0]).toEqual({
      name: undefined, dnsName: null, scheme: null, createdTime: null, vpcId: null,
      zones: [], subnets: [], securityGroups: [], instances: [], listeners: [],
    });
  });

  it("POST /load-balancers creates and validates", async () => {
    mockSend.mockResolvedValueOnce({ DNSName: "dns" });
    const res = await post("/load-balancers", {
      name: "web",
      zones: "us-east-1a, us-east-1b",
      listener: { protocol: "http", port: "80", instancePort: "8080" },
      scheme: "internal",
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ dnsName: "dns" });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      LoadBalancerName: "web",
      AvailabilityZones: ["us-east-1a", "us-east-1b"],
      Listeners: [{ Protocol: "HTTP", LoadBalancerPort: 80, InstancePort: 8080 }],
      Scheme: "internal",
    });
    expect((await post("/load-balancers", { zones: "a" })).status).toBe(400);
    expect((await post("/load-balancers", { name: "web" })).status).toBe(400);
    expect((await post("/load-balancers", { name: "web", zones: "a", listener: { protocol: "http" } })).status).toBe(400);
  });

  it("DELETE /load-balancers requires name", async () => {
    const res = await del("/load-balancers?name=web");
    expect(await res.json()).toEqual({ name: "web" });
    expect((await del("/load-balancers")).status).toBe(400);
  });

  it("GET /load-balancers/detail requires name and returns lb", async () => {
    mockSend.mockResolvedValueOnce({ LoadBalancerDescriptions: [lbDescription] });
    const b = await (await get("/load-balancers/detail?name=web")).json();
    expect(b.loadBalancer).toMatchObject({ LoadBalancerName: "web" });
    mockSend.mockResolvedValueOnce({ LoadBalancerDescriptions: [] });
    const b2 = await (await get("/load-balancers/detail?name=web")).json();
    expect(b2.loadBalancer).toBeNull();
    expect((await get("/load-balancers/detail")).status).toBe(400);
  });

  it("attributes routes validate and pass through", async () => {
    mockSend.mockResolvedValueOnce({ LoadBalancerAttributes: { CrossZoneLoadBalancing: { Enabled: true } } });
    const b = await (await get("/load-balancers/attributes?name=web")).json();
    expect(b.LoadBalancerAttributes.CrossZoneLoadBalancing.Enabled).toBe(true);
    expect((await get("/load-balancers/attributes")).status).toBe(400);

    mockSend.mockResolvedValueOnce({ LoadBalancerAttributes: {} });
    const res = await put("/load-balancers/attributes", { name: "web", attributes: { CrossZoneLoadBalancing: { Enabled: false } } });
    expect(res.status).toBe(200);
    expect((await put("/load-balancers/attributes", { attributes: {} })).status).toBe(400);
    expect((await put("/load-balancers/attributes", { name: "web" })).status).toBe(400);
    expect((await put("/load-balancers/attributes", { name: "web", attributes: "x" })).status).toBe(400);
  });
});

describe("elbclassic — listeners", () => {
  it("POST /listeners creates and validates", async () => {
    const res = await post("/listeners", {
      name: "web",
      listeners: [{ protocol: "tcp", port: 443, instancePort: 8443 }],
    });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      LoadBalancerName: "web",
      Listeners: [{ Protocol: "TCP", LoadBalancerPort: 443, InstancePort: 8443 }],
    });
    expect((await post("/listeners", { listeners: [{ protocol: "tcp", port: 1, instancePort: 2 }] })).status).toBe(400);
    expect((await post("/listeners", { name: "web" })).status).toBe(400);
    const bad = await app.request("/listeners", { method: "POST", body: "not-json", headers: { "content-type": "application/json" } });
    expect(bad.status).toBe(400);
  });

  it("DELETE /listeners validates and sends ports", async () => {
    const res = await del("/listeners?name=web&ports=80, 443");
    expect(await res.json()).toEqual({ ok: true });
    expect(mockSend.mock.calls[0][0]).toMatchObject({ LoadBalancerName: "web", LoadBalancerPorts: [80, 443] });
    expect((await del("/listeners?ports=80")).status).toBe(400);
    expect((await del("/listeners?name=web")).status).toBe(400);
  });
});

describe("elbclassic — instances and health", () => {
  it("GET /health maps instance states", async () => {
    mockSend.mockResolvedValueOnce({
      InstanceStates: [{ InstanceId: "i-1", State: "InService", ReasonCode: "N/A", Description: "ok" }],
    });
    const b = await (await get("/health?name=web")).json();
    expect(b.total).toBe(1);
    expect(b.instanceStates[0]).toEqual({ instanceId: "i-1", state: "InService", reasonCode: "N/A", description: "ok" });
    expect((await get("/health")).status).toBe(400);
    mockSend.mockResolvedValueOnce({});
    const b2 = await (await get("/health?name=web")).json();
    expect(b2.instanceStates).toEqual([]);
  });

  it("POST /instances/register and /deregister validate", async () => {
    mockSend.mockResolvedValueOnce({ Instances: [{ InstanceId: "i-2" }] });
    const res = await post("/instances/register", { name: "web", instances: "i-1, i-2" });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ instances: [{ InstanceId: "i-2" }] });
    expect(mockSend.mock.calls[0][0].Instances).toEqual([{ InstanceId: "i-1" }, { InstanceId: "i-2" }]);

    mockSend.mockResolvedValueOnce({ Instances: [] });
    const res2 = await post("/instances/deregister", { name: "web", instances: ["i-1"] });
    expect(await res2.json()).toEqual({ instances: [] });
    expect((await post("/instances/register", { instances: "i-1" })).status).toBe(400);
    expect((await post("/instances/register", { name: "web" })).status).toBe(400);
    expect((await post("/instances/deregister", { name: "web" })).status).toBe(400);
  });

  it("PUT /health-check configures with defaults", async () => {
    mockSend.mockResolvedValueOnce({ HealthCheck: { Target: "HTTP:80/" } });
    const res = await put("/health-check", { name: "web", healthCheck: { target: "HTTP:80/" } });
    expect(await res.json()).toEqual({ healthCheck: { Target: "HTTP:80/" } });
    expect(mockSend.mock.calls[0][0].HealthCheck).toEqual({
      Target: "HTTP:80/", Interval: 30, Timeout: 5, HealthyThreshold: 2, UnhealthyThreshold: 2,
    });
    expect((await put("/health-check", { healthCheck: { target: "x" } })).status).toBe(400);
    expect((await put("/health-check", { name: "web", healthCheck: {} })).status).toBe(400);
  });
});

describe("elbclassic — networking", () => {
  it("PUT routes validate and pass through", async () => {
    mockSend.mockResolvedValue({ SecurityGroups: ["sg-1"], Subnets: ["subnet-1"], AvailabilityZones: ["us-east-1a"] });
    expect((await (await put("/security-groups", { name: "web", securityGroups: "sg-1" })).json()).securityGroups).toEqual(["sg-1"]);
    expect((await (await put("/subnets/attach", { name: "web", subnets: ["subnet-1"] })).json()).subnets).toEqual(["subnet-1"]);
    expect((await (await put("/subnets/detach", { name: "web", subnets: ["subnet-1"] })).json()).subnets).toEqual(["subnet-1"]);
    expect((await (await put("/zones/enable", { name: "web", zones: "us-east-1a" })).json()).zones).toEqual(["us-east-1a"]);
    expect((await (await put("/zones/disable", { name: "web", zones: ["us-east-1a"] })).json()).zones).toEqual(["us-east-1a"]);

    for (const path of ["/security-groups", "/subnets/attach", "/subnets/detach", "/zones/enable", "/zones/disable"]) {
      expect((await put(path, { name: "web" })).status).toBe(400);
      expect((await put(path, {})).status).toBe(400);
    }
  });
});

describe("elbclassic — tags and limits", () => {
  it("GET /tags returns tag list", async () => {
    mockSend.mockResolvedValueOnce({ TagDescriptions: [{ Tags: [{ Key: "env", Value: "dev" }] }] });
    const b = await (await get("/tags?name=web")).json();
    expect(b.tags).toEqual([{ Key: "env", Value: "dev" }]);
    mockSend.mockResolvedValueOnce({});
    const b2 = await (await get("/tags?name=web")).json();
    expect(b2.tags).toEqual([]);
    expect((await get("/tags")).status).toBe(400);
  });

  it("POST /tags adds and validates", async () => {
    const res = await post("/tags", { name: "web", tags: [{ Key: "env", Value: "dev" }] });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0]).toMatchObject({ LoadBalancerNames: ["web"] });
    expect((await post("/tags", { tags: [{ Key: "k" }] })).status).toBe(400);
    expect((await post("/tags", { name: "web" })).status).toBe(400);
  });

  it("POST /tags/remove removes by keys", async () => {
    const res = await post("/tags/remove", { name: "web", keys: ["env"] });
    expect(await res.json()).toEqual({ ok: true });
    expect(mockSend.mock.calls[0][0].Tags).toEqual([{ Key: "env" }]);
    expect((await post("/tags/remove", { keys: ["env"] })).status).toBe(400);
    expect((await post("/tags/remove", { name: "web" })).status).toBe(400);
  });

  it("routes tolerate undefined SDK results and sparse inputs", async () => {
    mockSend.mockResolvedValue(undefined);
    expect((await (await put("/security-groups", { name: "web", securityGroups: ["sg-1"] })).json()).securityGroups).toEqual([]);
    expect((await (await put("/subnets/attach", { name: "web", subnets: ["subnet-1"] })).json()).subnets).toEqual([]);
    expect((await (await put("/subnets/detach", { name: "web", subnets: ["subnet-1"] })).json()).subnets).toEqual([]);
    expect((await (await put("/zones/enable", { name: "web", zones: ["z"] })).json()).zones).toEqual([]);
    expect((await (await put("/zones/disable", { name: "web", zones: ["z"] })).json()).zones).toEqual([]);
    expect((await (await post("/instances/register", { name: "web", instances: ["i-1"] })).json()).instances).toEqual([]);
    expect((await (await post("/instances/deregister", { name: "web", instances: ["i-1"] })).json()).instances).toEqual([]);
    expect((await put("/health-check", { name: "web" })).status).toBe(400);
    expect((await post("/instances/deregister", { instances: ["i-1"] })).status).toBe(400);
    mockSend.mockResolvedValueOnce({ InstanceStates: [{}] });
    const b = await (await get("/health?name=web")).json();
    expect(b.instanceStates[0]).toEqual({ instanceId: undefined, state: null, reasonCode: null, description: null });
    mockSend.mockResolvedValueOnce({ DNSName: "dns" });
    await post("/load-balancers", {
      name: "web",
      zones: ["us-east-1a"],
      listener: { protocol: "http", port: 80, instancePort: 8080 },
    });
    expect(mockSend.mock.calls.at(-1)![0].Scheme).toBeUndefined();
    await post("/listeners", { name: "web", listeners: [{ port: 80, instancePort: 8080 }] });
    expect(mockSend.mock.calls.at(-1)![0].Listeners[0].Protocol).toBe("");
  });

  it("GET /account-limits passes through with default", async () => {
    mockSend.mockResolvedValueOnce({ Limits: [{ Name: "max-load-balancers", Max: 20 }] });
    const b = await (await get("/account-limits")).json();
    expect(b.limits.length).toBe(1);
    mockSend.mockResolvedValueOnce(undefined);
    const b2 = await (await get("/account-limits")).json();
    expect(b2.limits).toEqual([]);
  });
});
