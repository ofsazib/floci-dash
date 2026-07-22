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
  PutScalingPolicyCommand: createCmd("PutScalingPolicyCommand"),
  DeletePolicyCommand: createCmd("DeletePolicyCommand"),
  PutLifecycleHookCommand: createCmd("PutLifecycleHookCommand"),
  DeleteLifecycleHookCommand: createCmd("DeleteLifecycleHookCommand"),
  DescribeLifecycleHooksCommand: createCmd("DescribeLifecycleHooksCommand"),
  CompleteLifecycleActionCommand: createCmd("CompleteLifecycleActionCommand"),
  DescribeAutoScalingNotificationTypesCommand: createCmd("DescribeAutoScalingNotificationTypesCommand"),
  DescribeTerminationPolicyTypesCommand: createCmd("DescribeTerminationPolicyTypesCommand"),
  DescribeAdjustmentTypesCommand: createCmd("DescribeAdjustmentTypesCommand"),
  DescribeAccountLimitsCommand: createCmd("DescribeAccountLimitsCommand"),
  DescribeLifecycleHookTypesCommand: createCmd("DescribeLifecycleHookTypesCommand"),
  DescribeMetricCollectionTypesCommand: createCmd("DescribeMetricCollectionTypesCommand"),
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

    it("POST /groups/:name/policies — creates policy (201)", async () => {
      mockSend.mockResolvedValueOnce({ PolicyARN: "arn:aws:autoscaling:policy/scale-up" });
      const res = await post("/groups/asg-1/policies", { policyName: "scale-up", policyType: "SimpleScaling", adjustmentType: "ChangeInCapacity", scalingAdjustment: 1 });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.policyARN).toBe("arn:aws:autoscaling:policy/scale-up");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("PutScalingPolicyCommand");
    });

    it("POST /groups/:name/policies — 400 when policyName missing", async () => {
      const res = await post("/groups/asg-1/policies", { adjustmentType: "ChangeInCapacity" });
      expect(res.status).toBe(400);
    });

    it("DELETE /groups/:name/policies/:policyName — deletes policy", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/groups/asg-1/policies/scale-up");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeletePolicyCommand");
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

  describe("Lifecycle Hooks", () => {
    it("GET /groups/:name/lifecycle-hooks — lists hooks", async () => {
      mockSend.mockResolvedValueOnce({
        LifecycleHooks: [
          { LifecycleHookName: "my-hook", LifecycleTransition: "autoscaling:EC2_INSTANCE_LAUNCHING" },
        ],
      });
      const res = await get("/groups/asg-1/lifecycle-hooks");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.lifecycleHooks[0].LifecycleHookName).toBe("my-hook");
    });

    it("GET /groups/:name/lifecycle-hooks — returns empty", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/groups/asg-1/lifecycle-hooks");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("POST /groups/:name/lifecycle-hooks — creates hook (201)", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/groups/asg-1/lifecycle-hooks", {
        lifecycleHookName: "my-hook",
        lifecycleTransition: "autoscaling:EC2_INSTANCE_LAUNCHING",
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("PutLifecycleHookCommand");
    });

    it("POST /groups/:name/lifecycle-hooks — 400 when lifecycleHookName missing", async () => {
      const res = await post("/groups/asg-1/lifecycle-hooks", { lifecycleTransition: "autoscaling:EC2_INSTANCE_LAUNCHING" });
      expect(res.status).toBe(400);
    });

    it("POST /groups/:name/lifecycle-hooks — 400 when lifecycleTransition missing", async () => {
      const res = await post("/groups/asg-1/lifecycle-hooks", { lifecycleHookName: "my-hook" });
      expect(res.status).toBe(400);
    });

    it("DELETE /groups/:name/lifecycle-hooks/:hookName — deletes hook", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/groups/asg-1/lifecycle-hooks/my-hook");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteLifecycleHookCommand");
    });

    it("POST /groups/:name/lifecycle-hooks/complete — completes action", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/groups/asg-1/lifecycle-hooks/complete", {
        lifecycleHookName: "my-hook",
        lifecycleActionResult: "CONTINUE",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.completed).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CompleteLifecycleActionCommand");
    });

    it("POST /groups/:name/lifecycle-hooks/complete — 400 when lifecycleHookName missing", async () => {
      const res = await post("/groups/asg-1/lifecycle-hooks/complete", {
        lifecycleActionResult: "CONTINUE",
      });
      expect(res.status).toBe(400);
    });

    it("POST /groups/:name/lifecycle-hooks/complete — 400 when lifecycleActionResult missing", async () => {
      const res = await post("/groups/asg-1/lifecycle-hooks/complete", {
        lifecycleHookName: "my-hook",
      });
      expect(res.status).toBe(400);
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

  describe("Describe Types", () => {
    it("GET /notification-types — returns list", async () => {
      mockSend.mockResolvedValueOnce({
        AutoScalingNotificationTypes: ["autoscaling:EC2_INSTANCE_LAUNCH", "autoscaling:EC2_INSTANCE_TERMINATE"],
      });
      const res = await get("/notification-types");
      const body = await res.json();
      expect(body.notificationTypes).toContain("autoscaling:EC2_INSTANCE_LAUNCH");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DescribeAutoScalingNotificationTypesCommand");
    });

    it("GET /notification-types — returns empty array", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/notification-types");
      const body = await res.json();
      expect(body.notificationTypes).toEqual([]);
    });

    it("GET /termination-policy-types — returns list", async () => {
      mockSend.mockResolvedValueOnce({
        TerminationPolicyTypes: ["OldestInstance", "NewestInstance", "Default"],
      });
      const res = await get("/termination-policy-types");
      const body = await res.json();
      expect(body.terminationPolicyTypes).toHaveLength(3);
      expect(body.terminationPolicyTypes).toContain("Default");
    });

    it("GET /termination-policy-types — returns empty", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/termination-policy-types");
      const body = await res.json();
      expect(body.terminationPolicyTypes).toEqual([]);
    });

    it("GET /adjustment-types — returns list", async () => {
      mockSend.mockResolvedValueOnce({
        AdjustmentTypes: [
          { AdjustmentType: "ChangeInCapacity" },
          { AdjustmentType: "ExactCapacity" },
        ],
      });
      const res = await get("/adjustment-types");
      const body = await res.json();
      expect(body.adjustmentTypes).toContain("ChangeInCapacity");
    });

    it("GET /adjustment-types — returns empty", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/adjustment-types");
      const body = await res.json();
      expect(body.adjustmentTypes).toEqual([]);
    });

    it("GET /account-limits — returns limits", async () => {
      mockSend.mockResolvedValueOnce({
        MaxNumberOfAutoScalingGroups: 200,
        MaxNumberOfLaunchConfigurations: 200,
        NumberOfAutoScalingGroups: 5,
        NumberOfLaunchConfigurations: 3,
      });
      const res = await get("/account-limits");
      const body = await res.json();
      expect(body.maxNumberOfAutoScalingGroups).toBe(200);
      expect(body.numberOfLaunchConfigurations).toBe(3);
    });

    it("GET /lifecycle-hook-types — returns list", async () => {
      mockSend.mockResolvedValueOnce({
        LifecycleHookTypes: ["autoscaling:EC2_INSTANCE_LAUNCHING", "autoscaling:EC2_INSTANCE_TERMINATING"],
      });
      const res = await get("/lifecycle-hook-types");
      const body = await res.json();
      expect(body.lifecycleHookTypes).toHaveLength(2);
    });

    it("GET /lifecycle-hook-types — returns empty", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/lifecycle-hook-types");
      const body = await res.json();
      expect(body.lifecycleHookTypes).toEqual([]);
    });

    it("GET /metric-collection-types — returns list", async () => {
      mockSend.mockResolvedValueOnce({
        Metrics: [
          {
            Metric: "GroupMinSize",
            Granularities: [{ Granularity: "1Minute" }],
          },
        ],
      });
      const res = await get("/metric-collection-types");
      const body = await res.json();
      expect(body.metricCollectionTypes).toHaveLength(1);
      expect(body.metricCollectionTypes[0].metric).toBe("GroupMinSize");
      expect(body.metricCollectionTypes[0].granularities).toContain("1Minute");
    });

    it("GET /metric-collection-types — returns empty", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/metric-collection-types");
      const body = await res.json();
      expect(body.metricCollectionTypes).toEqual([]);
    });
  });
});
