import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());
const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-elastic-load-balancing-v2", () => ({
  ElasticLoadBalancingV2Client: vi.fn(function() { return { send: mockSend }; }),
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
  DescribeTargetHealthCommand: createCmd("DescribeTargetHealthCommand"),
  DescribeListenersCommand: createCmd("DescribeListenersCommand"),
  CreateListenerCommand: createCmd("CreateListenerCommand"),
  DeleteListenerCommand: createCmd("DeleteListenerCommand"),
  DescribeListenerAttributesCommand: createCmd("DescribeListenerAttributesCommand"),
  ModifyListenerAttributesCommand: createCmd("ModifyListenerAttributesCommand"),
  RegisterTargetsCommand: createCmd("RegisterTargetsCommand"),
  DeregisterTargetsCommand: createCmd("DeregisterTargetsCommand"),
  AddTagsCommand: createCmd("AddTagsCommand"),
  RemoveTagsCommand: createCmd("RemoveTagsCommand"),
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

async function del(path: string) {
  return router.request(path, { method: "DELETE" });
}

beforeEach(() => {
  mockSend.mockReset();
});

describe("ELB Routes", () => {
  describe("Load Balancers", () => {
    it("GET /load-balancers — lists load balancers", async () => {
      mockSend.mockResolvedValueOnce({
        LoadBalancers: [
          {
            LoadBalancerArn: "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/my-lb",
            LoadBalancerName: "my-lb",
            DNSName: "my-lb-123.us-east-1.elb.amazonaws.com",
            Scheme: "internet-facing",
            VpcId: "vpc-123",
            State: { Code: "active" },
            Type: "application",
            AvailabilityZones: [{ ZoneName: "us-east-1a" }],
            IpAddressType: "ipv4",
            CreatedTime: new Date("2025-01-01"),
          },
        ],
      });
      const res = await get("/load-balancers");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.loadBalancers[0].loadBalancerName).toBe("my-lb");
      expect(body.loadBalancers[0].state).toBe("active");
    });

    it("GET /load-balancers — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ LoadBalancers: [] });
      const res = await get("/load-balancers");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.loadBalancers).toEqual([]);
    });

    it("POST /load-balancers — creates load balancer (201)", async () => {
      mockSend.mockResolvedValueOnce({
        LoadBalancers: [
          {
            LoadBalancerArn: "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/new-lb",
            LoadBalancerName: "new-lb",
            DNSName: "new-lb-123.us-east-1.elb.amazonaws.com",
            Scheme: "internet-facing",
            VpcId: "vpc-123",
            State: { Code: "provisioning" },
            Type: "application",
            AvailabilityZones: [{ ZoneName: "us-east-1a" }],
            IpAddressType: "ipv4",
            CreatedTime: new Date("2025-01-01"),
          },
        ],
      });
      const res = await post("/load-balancers", {
        name: "new-lb",
        subnets: ["subnet-123"],
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.loadBalancer.LoadBalancerName).toBe("new-lb");
      expect(mockSend.mock.calls[0][0].Name).toBe("new-lb");
      expect(mockSend.mock.calls[0][0].Subnets).toEqual(["subnet-123"]);
    });

    it("POST /load-balancers — 400 when name/subnets missing", async () => {
      const res = await post("/load-balancers", {});
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("name and subnets are required");
    });

    it("DELETE /load-balancers/:arn — deletes load balancer", async () => {
      mockSend.mockResolvedValueOnce({});
      const arn = "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/my-lb";
      const res = await del(`/load-balancers/${encodeURIComponent(arn)}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(body.loadBalancerArn).toBe(arn);
      expect(mockSend.mock.calls[0][0].LoadBalancerArn).toBe(arn);
    });

    it("GET /load-balancers/:arn/attributes — gets attributes", async () => {
      mockSend.mockResolvedValueOnce({
        Attributes: [
          { Key: "idle_timeout.timeout_seconds", Value: "60" },
          { Key: "deletion_protection.enabled", Value: "false" },
        ],
      });
      const arn = "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/my-lb";
      const res = await get(`/load-balancers/${encodeURIComponent(arn)}/attributes`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.loadBalancerArn).toBe(arn);
      expect(body.attributes["idle_timeout.timeout_seconds"]).toBe("60");
      expect(body.attributes["deletion_protection.enabled"]).toBe("false");
    });
  });

  describe("Target Groups", () => {
    it("GET /target-groups — lists target groups", async () => {
      mockSend.mockResolvedValueOnce({
        TargetGroups: [
          {
            TargetGroupArn: "arn:aws:elasticloadbalancing:us-east-1:123:targetgroup/my-tg/123",
            TargetGroupName: "my-tg",
            Protocol: "HTTP",
            Port: 80,
            VpcId: "vpc-123",
            TargetType: "instance",
          },
        ],
      });
      const res = await get("/target-groups");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.targetGroups[0].targetGroupName).toBe("my-tg");
    });

    it("POST /target-groups — creates target group (201)", async () => {
      mockSend.mockResolvedValueOnce({
        TargetGroups: [
          {
            TargetGroupArn: "arn:aws:elasticloadbalancing:us-east-1:123:targetgroup/new-tg/123",
            TargetGroupName: "new-tg",
            Protocol: "HTTP",
            Port: 80,
            VpcId: "vpc-123",
            TargetType: "instance",
          },
        ],
      });
      const res = await post("/target-groups", {
        name: "new-tg",
        protocol: "HTTP",
        port: 80,
        vpcId: "vpc-123",
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.targetGroup.TargetGroupName).toBe("new-tg");
      expect(mockSend.mock.calls[0][0].Name).toBe("new-tg");
    });

    it("POST /target-groups — 400 when fields missing", async () => {
      const res = await post("/target-groups", { name: "tg" });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("name, protocol, port, and vpcId are required");
    });

    it("DELETE /target-groups/:arn — deletes target group", async () => {
      mockSend.mockResolvedValueOnce({});
      const arn = "arn:aws:elasticloadbalancing:us-east-1:123:targetgroup/my-tg/123";
      const res = await del(`/target-groups/${encodeURIComponent(arn)}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(body.targetGroupArn).toBe(arn);
      expect(mockSend.mock.calls[0][0].TargetGroupArn).toBe(arn);
    });
  });

  describe("Listeners", () => {
    it("GET /load-balancers/:arn/listeners — lists listeners", async () => {
      mockSend.mockResolvedValueOnce({
        Listeners: [
          {
            ListenerArn: "arn:aws:elasticloadbalancing:us-east-1:123:listener/my-lb/123/456",
            LoadBalancerArn: "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/my-lb",
            Protocol: "HTTP",
            Port: 80,
            DefaultActions: [{ Type: "forward" }],
            Certificates: [],
          },
        ],
      });
      const lbArn = "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/my-lb";
      const res = await get(`/load-balancers/${encodeURIComponent(lbArn)}/listeners`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.listeners[0].protocol).toBe("HTTP");
    });

    it("POST /load-balancers/:arn/listeners — creates listener (201)", async () => {
      mockSend.mockResolvedValueOnce({
        Listeners: [
          {
            ListenerArn: "arn:aws:elasticloadbalancing:us-east-1:123:listener/my-lb/123/789",
            LoadBalancerArn: "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/my-lb",
            Protocol: "HTTP",
            Port: 80,
            DefaultActions: [{ Type: "forward" }],
            Certificates: [],
          },
        ],
      });
      const lbArn = "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/my-lb";
      const res = await post(`/load-balancers/${encodeURIComponent(lbArn)}/listeners`, {
        protocol: "HTTP",
        port: 80,
        defaultActions: [{ Type: "forward" }],
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.listener.Protocol).toBe("HTTP");
      expect(mockSend.mock.calls[0][0].LoadBalancerArn).toBe(lbArn);
    });

    it("DELETE /listeners/:arn — deletes listener", async () => {
      mockSend.mockResolvedValueOnce({});
      const arn = "arn:aws:elasticloadbalancing:us-east-1:123:listener/my-lb/123/456";
      const res = await del(`/listeners/${encodeURIComponent(arn)}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(body.listenerArn).toBe(arn);
      expect(mockSend.mock.calls[0][0].ListenerArn).toBe(arn);
    });
  });

  describe("Target Registration", () => {
    it("POST /target-groups/:arn/register — registers targets", async () => {
      mockSend.mockResolvedValueOnce({});
      const arn = "arn:aws:elasticloadbalancing:us-east-1:123:targetgroup/my-tg/123";
      const res = await post(`/target-groups/${encodeURIComponent(arn)}/register`, {
        targets: [{ id: "i-123", port: 80 }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.registered).toBe(true);
      expect(mockSend.mock.calls[0][0].TargetGroupArn).toBe(arn);
      expect(mockSend.mock.calls[0][0].Targets).toEqual([{ Id: "i-123", Port: 80 }]);
    });
  });
});