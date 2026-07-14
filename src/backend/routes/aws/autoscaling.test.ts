import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-auto-scaling", () => ({
  AutoScalingClient: vi.fn(function () {
    return { send: mockSend };
  }),
  DescribeAutoScalingGroupsCommand: createCmd("DescribeAutoScalingGroupsCommand"),
  CreateAutoScalingGroupCommand: createCmd("CreateAutoScalingGroupCommand"),
  UpdateAutoScalingGroupCommand: createCmd("UpdateAutoScalingGroupCommand"),
  DeleteAutoScalingGroupCommand: createCmd("DeleteAutoScalingGroupCommand"),
  SetDesiredCapacityCommand: createCmd("SetDesiredCapacityCommand"),
  DescribeLaunchConfigurationsCommand: createCmd("DescribeLaunchConfigurationsCommand"),
  DescribePoliciesCommand: createCmd("DescribePoliciesCommand"),
  DescribeScalingActivitiesCommand: createCmd("DescribeScalingActivitiesCommand"),
  StartInstanceRefreshCommand: createCmd("StartInstanceRefreshCommand"),
  DescribeInstanceRefreshesCommand: createCmd("DescribeInstanceRefreshesCommand"),
  CreateOrUpdateTagsCommand: createCmd("CreateOrUpdateTagsCommand"),
  DeleteTagsCommand: createCmd("DeleteTagsCommand"),
  AttachLoadBalancerTargetGroupsCommand: createCmd("AttachLoadBalancerTargetGroupsCommand"),
  DetachLoadBalancerTargetGroupsCommand: createCmd("DetachLoadBalancerTargetGroupsCommand"),
  DescribeLoadBalancerTargetGroupsCommand: createCmd("DescribeLoadBalancerTargetGroupsCommand"),
  AttachLoadBalancersCommand: createCmd("AttachLoadBalancersCommand"),
  DetachLoadBalancersCommand: createCmd("DetachLoadBalancersCommand"),
  DescribeLoadBalancersCommand: createCmd("DescribeLoadBalancersCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: (Ctor: any, extra?: any) => new Ctor(extra),
}));

import router from "./autoscaling";

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

async function put(path: string, body?: any) {
  return router.request(path, {
    method: "PUT",
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

describe("Auto Scaling Routes", () => {
  describe("Auto Scaling Groups", () => {
    it("GET /groups — lists groups", async () => {
      mockSend.mockResolvedValueOnce({
        AutoScalingGroups: [
          {
            AutoScalingGroupName: "asg-1",
            AutoScalingGroupARN: "arn:aws:autoscaling:us-east-1:123:autoScalingGroup:asg-1",
            MinSize: 1,
            MaxSize: 5,
            DesiredCapacity: 2,
          },
        ],
      });
      const res = await get("/groups");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.groups[0].AutoScalingGroupName).toBe("asg-1");
    });

    it("GET /groups — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ AutoScalingGroups: [] });
      const res = await get("/groups");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.groups).toEqual([]);
    });

    it("POST /groups — creates group (201)", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/groups", {
        autoScalingGroupName: "asg-1",
        minSize: 1,
        maxSize: 5,
        desiredCapacity: 2,
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("POST /groups — 400 if name missing", async () => {
      const res = await post("/groups", { minSize: 1, maxSize: 5 });
      expect(res.status).toBe(400);
    });

    it("POST /groups — 400 if minSize missing", async () => {
      const res = await post("/groups", { autoScalingGroupName: "asg-1", maxSize: 5 });
      expect(res.status).toBe(400);
    });

    it("POST /groups — 400 if maxSize missing", async () => {
      const res = await post("/groups", { autoScalingGroupName: "asg-1", minSize: 1 });
      expect(res.status).toBe(400);
    });

    it("PUT /groups/:name — updates group", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/groups/asg-1", { maxSize: 10 });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
    });

    it("DELETE /groups/:name — deletes group", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/groups/asg-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });

    it("PUT /groups/:name/desired-capacity — sets desired capacity", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/groups/asg-1/desired-capacity", { desiredCapacity: 3 });
      expect(res.status).toBe(200);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("PUT /groups/:name/desired-capacity — 400 if desiredCapacity missing", async () => {
      const res = await put("/groups/asg-1/desired-capacity", {});
      expect(res.status).toBe(400);
    });
  });

  describe("Launch Configurations", () => {
    it("GET /launch-configurations — lists launch configs", async () => {
      mockSend.mockResolvedValueOnce({
        LaunchConfigurations: [
          {
            LaunchConfigurationName: "lc-1",
            LaunchConfigurationARN: "arn:...:lc-1",
            ImageId: "ami-123",
            InstanceType: "t3.micro",
            CreatedTime: new Date("2024-01-01"),
          },
        ],
      });
      const res = await get("/launch-configurations");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.launchConfigurations[0].LaunchConfigurationName).toBe("lc-1");
    });

    it("GET /launch-configurations — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ LaunchConfigurations: [] });
      const res = await get("/launch-configurations");
      const body = await res.json();
      expect(body.total).toBe(0);
    });
  });

  describe("Scaling Policies", () => {
    it("GET /groups/:name/policies — lists policies", async () => {
      mockSend.mockResolvedValueOnce({
        ScalingPolicies: [
          { PolicyName: "scale-up", PolicyARN: "arn:...:scale-up", AutoScalingGroupName: "asg-1" },
        ],
      });
      const res = await get("/groups/asg-1/policies");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.policies[0].PolicyName).toBe("scale-up");
    });

    it("GET /groups/:name/policies — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ ScalingPolicies: [] });
      const res = await get("/groups/asg-1/policies");
      const body = await res.json();
      expect(body.total).toBe(0);
    });
  });

  describe("Scaling Activities", () => {
    it("GET /groups/:name/activities — lists activities", async () => {
      mockSend.mockResolvedValueOnce({
        Activities: [
          {
            ActivityId: "act-1",
            AutoScalingGroupName: "asg-1",
            StatusCode: "Successful",
            Progress: 100,
            StartTime: new Date("2024-01-01"),
          },
        ],
      });
      const res = await get("/groups/asg-1/activities");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.activities[0].ActivityId).toBe("act-1");
    });

    it("GET /groups/:name/activities — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ Activities: [] });
      const res = await get("/groups/asg-1/activities");
      const body = await res.json();
      expect(body.total).toBe(0);
    });
  });

  describe("Instance Refresh", () => {
    it("POST /groups/:name/instance-refresh — starts refresh", async () => {
      mockSend.mockResolvedValueOnce({ InstanceRefreshId: "ir-1" });
      const res = await post("/groups/asg-1/instance-refresh", { minHealthyPercentage: 90 });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.instanceRefreshId).toBe("ir-1");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("StartInstanceRefreshCommand");
    });

    it("GET /groups/:name/instance-refreshes — lists refreshes", async () => {
      mockSend.mockResolvedValueOnce({
        InstanceRefreshes: [{ InstanceRefreshId: "ir-1", Status: "InProgress", PercentageComplete: 50 }],
      });
      const res = await get("/groups/asg-1/instance-refreshes");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.instanceRefreshes[0].status).toBe("InProgress");
    });

    it("GET /groups/:name/instance-refreshes — returns empty", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/groups/asg-1/instance-refreshes");
      const body = await res.json();
      expect(body.total).toBe(0);
    });
  });

  describe("Tags", () => {
    it("POST /groups/:name/tags — creates tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/groups/asg-1/tags", { tags: [{ key: "env", value: "prod" }] });
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateOrUpdateTagsCommand");
    });

    it("POST /groups/:name/tags — 400 when tags empty", async () => {
      const res = await post("/groups/asg-1/tags", { tags: [] });
      expect(res.status).toBe(400);
    });

    it("POST /groups/:name/tags/delete — deletes tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/groups/asg-1/tags/delete", { tagKeys: ["env"] });
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteTagsCommand");
    });
  });

  describe("LB Target Groups", () => {
    it("GET /groups/:name/lb-target-groups — lists", async () => {
      mockSend.mockResolvedValueOnce({ LoadBalancerTargetGroups: [{ LoadBalancerTargetGroupARN: "arn:tg1" }] });
      const res = await get("/groups/asg-1/lb-target-groups");
      const body = await res.json();
      expect(body.targetGroups).toHaveLength(1);
    });

    it("POST /groups/:name/lb-target-groups — attaches", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/groups/asg-1/lb-target-groups", { targetGroupARNs: ["arn:tg1"] });
      const body = await res.json();
      expect(body.attached).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("AttachLoadBalancerTargetGroupsCommand");
    });

    it("POST /groups/:name/lb-target-groups/detach — detaches", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/groups/asg-1/lb-target-groups/detach", { targetGroupARNs: ["arn:tg1"] });
      const body = await res.json();
      expect(body.detached).toBe(true);
    });
  });

  describe("Classic Load Balancers", () => {
    it("GET /groups/:name/load-balancers — lists", async () => {
      mockSend.mockResolvedValueOnce({ LoadBalancers: [{ LoadBalancerName: "my-clb" }] });
      const res = await get("/groups/asg-1/load-balancers");
      const body = await res.json();
      expect(body.loadBalancers).toHaveLength(1);
    });

    it("POST /groups/:name/load-balancers — attaches", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/groups/asg-1/load-balancers", { loadBalancerNames: ["my-clb"] });
      const body = await res.json();
      expect(body.attached).toBe(true);
    });

    it("POST /groups/:name/load-balancers/detach — detaches", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/groups/asg-1/load-balancers/detach", { loadBalancerNames: ["my-clb"] });
      const body = await res.json();
      expect(body.detached).toBe(true);
    });
  });
});
