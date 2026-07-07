import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockELB = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-elastic-load-balancing-v2", () => ({
  ElasticLoadBalancingV2Client: mockELB,
  DescribeLoadBalancersCommand: createCmd("DescribeLoadBalancersCommand"),
  CreateLoadBalancerCommand: createCmd("CreateLoadBalancerCommand"),
  DeleteLoadBalancerCommand: createCmd("DeleteLoadBalancerCommand"),
  DescribeLoadBalancerAttributesCommand: createCmd("DescribeLoadBalancerAttributesCommand"),
  ModifyLoadBalancerAttributesCommand: createCmd("ModifyLoadBalancerAttributesCommand"),
  DescribeTargetGroupsCommand: createCmd("DescribeTargetGroupsCommand"),
  CreateTargetGroupCommand: createCmd("CreateTargetGroupCommand"),
  DeleteTargetGroupCommand: createCmd("DeleteTargetGroupCommand"),
  DescribeTargetGroupAttributesCommand: createCmd("DescribeTargetGroupAttributesCommand"),
  ModifyTargetGroupAttributesCommand: createCmd("ModifyTargetGroupAttributesCommand"),
  DescribeListenersCommand: createCmd("DescribeListenersCommand"),
  CreateListenerCommand: createCmd("CreateListenerCommand"),
  DeleteListenerCommand: createCmd("DeleteListenerCommand"),
  DescribeListenerAttributesCommand: createCmd("DescribeListenerAttributesCommand"),
  ModifyListenerAttributesCommand: createCmd("ModifyListenerAttributesCommand"),
  RegisterTargetsCommand: createCmd("RegisterTargetsCommand"),
  DeregisterTargetsCommand: createCmd("DeregisterTargetsCommand"),
  DescribeTargetHealthCommand: createCmd("DescribeTargetHealthCommand"),
  AddTagsCommand: createCmd("AddTagsCommand"),
  RemoveTagsCommand: createCmd("RemoveTagsCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./elb";

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

async function put(path: string, body?: any) {
  return router.request(path, {
    method: "PUT",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

beforeEach(() => {
  mockSend.mockReset();
});

describe("ELB Routes", () => {
  describe("Load Balancers", () => {
    it("GET /load-balancers — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ LoadBalancers: [] });
      const res = await get("/load-balancers");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.loadBalancers).toEqual([]);
    });

    it("GET /load-balancers — returns list", async () => {
      const now = new Date("2025-01-01");
      mockSend.mockResolvedValueOnce({
        LoadBalancers: [
          {
            LoadBalancerArn: "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/my-alb/abc123",
            LoadBalancerName: "my-alb",
            DNSName: "my-alb-123.us-east-1.elb.amazonaws.com",
            Scheme: "internet-facing",
            VpcId: "vpc-123",
            State: { Code: "active" },
            Type: "application",
            AvailabilityZones: [{ ZoneName: "us-east-1a" }],
            IpAddressType: "ipv4",
            CreatedTime: now,
          },
        ],
      });
      const res = await get("/load-balancers");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.loadBalancers[0].loadBalancerName).toBe("my-alb");
      expect(body.loadBalancers[0].state).toBe("active");
      expect(body.loadBalancers[0].type).toBe("application");
    });

    it("GET /load-balancers — passes arns and names query params", async () => {
      mockSend.mockResolvedValueOnce({ LoadBalancers: [] });
      await get("/load-balancers?arns=arn:lb1,arn:lb2&names=lb1,lb2");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DescribeLoadBalancersCommand");
      expect(mockSend.mock.calls[0][0].LoadBalancerArns).toEqual(["arn:lb1", "arn:lb2"]);
      expect(mockSend.mock.calls[0][0].Names).toEqual(["lb1", "lb2"]);
    });

    it("POST /load-balancers — creates load balancer", async () => {
      mockSend.mockResolvedValueOnce({
        LoadBalancers: [{ LoadBalancerName: "new-alb" }],
      });
      const res = await post("/load-balancers", {
        name: "new-alb",
        subnets: ["subnet-123"],
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.loadBalancer.LoadBalancerName).toBe("new-alb");
    });

    it("POST /load-balancers — 400 when name or subnets missing", async () => {
      const res1 = await post("/load-balancers", {});
      expect(res1.status).toBe(400);
      const res2 = await post("/load-balancers", { name: "test", subnets: [] });
      expect(res2.status).toBe(400);
    });

    it("DELETE /load-balancers/:arn — deletes load balancer", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/load-balancers/arn:lb1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });

    it("GET /load-balancers/:arn/attributes — returns attributes", async () => {
      mockSend.mockResolvedValueOnce({
        Attributes: [{ Key: "access_logs.s3.enabled", Value: "false" }],
      });
      const res = await get("/load-balancers/arn:lb1/attributes");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.attributes["access_logs.s3.enabled"]).toBe("false");
    });

    it("PUT /load-balancers/:arn/attributes — modifies attributes", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/load-balancers/arn:lb1/attributes", {
        attributes: { "access_logs.s3.enabled": "true" },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
    });
  });

  describe("Target Groups", () => {
    it("GET /target-groups — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ TargetGroups: [] });
      const res = await get("/target-groups");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /target-groups — returns list", async () => {
      mockSend.mockResolvedValueOnce({
        TargetGroups: [
          {
            TargetGroupArn: "arn:aws:elasticloadbalancing:us-east-1:123:targetgroup/my-tg/abc",
            TargetGroupName: "my-tg",
            Protocol: "HTTP",
            Port: 80,
            VpcId: "vpc-123",
            TargetType: "instance",
            HealthCheckProtocol: "HTTP",
            HealthCheckEnabled: true,
            HealthCheckIntervalSeconds: 30,
            HealthyThresholdCount: 5,
            UnhealthyThresholdCount: 2,
          },
        ],
      });
      await get("/target-groups?loadBalancerArn=arn:lb1");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DescribeTargetGroupsCommand");
    });

    it("POST /target-groups — creates target group", async () => {
      mockSend.mockResolvedValueOnce({
        TargetGroups: [{ TargetGroupName: "my-tg" }],
      });
      const res = await post("/target-groups", {
        name: "my-tg",
        protocol: "HTTP",
        port: 80,
        vpcId: "vpc-123",
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.targetGroup.TargetGroupName).toBe("my-tg");
    });

    it("POST /target-groups — 400 when required fields missing", async () => {
      const res = await post("/target-groups", { name: "my-tg" });
      expect(res.status).toBe(400);
    });

    it("DELETE /target-groups/:arn — deletes target group", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/target-groups/arn:tg1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });

    it("GET /target-groups/:arn/attributes — returns attributes", async () => {
      mockSend.mockResolvedValueOnce({
        Attributes: [{ Key: "deregistration_delay.timeout_seconds", Value: "300" }],
      });
      const res = await get("/target-groups/arn:tg1/attributes");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.attributes["deregistration_delay.timeout_seconds"]).toBe("300");
    });

    it("GET /target-groups/:arn/health — returns target health", async () => {
      mockSend.mockResolvedValueOnce({
        TargetHealthDescriptions: [
          {
            Target: { Id: "i-123", Port: 80 },
            TargetHealth: { State: "healthy", Reason: "N/A", Description: "Target healthy" },
          },
        ],
      });
      const res = await get("/target-groups/arn:tg1/health");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.targets[0].healthState).toBe("healthy");
    });

    it("GET /target-groups/:arn/health — returns empty when no targets", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/target-groups/arn:tg1/health");
      const body = await res.json();
      expect(body.total).toBe(0);
    });
  });

  describe("Listeners", () => {
    it("GET /load-balancers/:arn/listeners — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ Listeners: [] });
      const res = await get("/load-balancers/arn:lb1/listeners");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /load-balancers/:arn/listeners — returns list", async () => {
      mockSend.mockResolvedValueOnce({
        Listeners: [
          {
            ListenerArn: "arn:aws:elasticloadbalancing:us-east-1:123:listener/app/my-alb/abc/def",
            LoadBalancerArn: "arn:lb1",
            Protocol: "HTTP",
            Port: 80,
            DefaultActions: [{ Type: "forward", TargetGroupArn: "arn:tg1" }],
          },
        ],
      });
      const res = await get("/load-balancers/arn:lb1/listeners");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.listeners[0].protocol).toBe("HTTP");
    });

    it("POST /load-balancers/:arn/listeners — creates listener", async () => {
      mockSend.mockResolvedValueOnce({
        Listeners: [{ ListenerArn: "arn:listener1" }],
      });
      const res = await post("/load-balancers/arn:lb1/listeners", {
        protocol: "HTTP",
        port: 80,
        defaultActions: [{ Type: "forward", TargetGroupArn: "arn:tg1" }],
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.listener.ListenerArn).toBe("arn:listener1");
    });

    it("POST /load-balancers/:arn/listeners — 400 when required fields missing", async () => {
      const res = await post("/load-balancers/arn:lb1/listeners", {
        protocol: "HTTP",
      });
      expect(res.status).toBe(400);
    });

    it("DELETE /listeners/:arn — deletes listener", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/listeners/arn:listener1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });

    it("GET /listeners/:arn/attributes — returns listener attributes", async () => {
      mockSend.mockResolvedValueOnce({
        Attributes: [{ Key: "routing.http2.enabled", Value: "true" }],
      });
      const res = await get("/listeners/arn:listener1/attributes");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.attributes["routing.http2.enabled"]).toBe("true");
    });
  });

  describe("Target Registration", () => {
    it("POST /target-groups/:arn/register — registers targets", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/target-groups/arn:tg1/register", {
        targets: [{ id: "i-123", port: 80 }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.registered).toBe(true);
    });

    it("POST /target-groups/:arn/register — 400 when targets missing", async () => {
      const res = await post("/target-groups/arn:tg1/register", { targets: [] });
      expect(res.status).toBe(400);
    });

    it("POST /target-groups/:arn/deregister — deregisters targets", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/target-groups/arn:tg1/deregister", {
        targets: [{ id: "i-123" }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deregistered).toBe(true);
    });
  });

  describe("Tags", () => {
    it("POST /tags — adds tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tags", {
        resourceArns: ["arn:lb1"],
        tags: { env: "prod" },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
    });

    it("DELETE /tags — removes tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/tags", {
        resourceArns: ["arn:lb1"],
        tagKeys: ["env"],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
    });
  });
});
