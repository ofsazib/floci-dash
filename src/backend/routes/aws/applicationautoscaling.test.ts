import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());
const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) { return { __cmdName: name, ...args }; });
  };
});

vi.mock("@aws-sdk/client-application-auto-scaling", () => {
  const t: any = { ApplicationAutoScalingClient: vi.fn(function () { return { send: mockSend }; }) };
  for (const n of ["RegisterScalableTargetCommand","DescribeScalableTargetsCommand","DeregisterScalableTargetCommand","PutScalingPolicyCommand","DescribeScalingPoliciesCommand","DeleteScalingPolicyCommand","ListTagsForResourceCommand","TagResourceCommand","UntagResourceCommand"]) t[n] = createCmd(n);
  return t;
});

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./applicationautoscaling";

const AG = "";
const j = async (r: Response) => await r.json();

beforeEach(() => {
  mockSend.mockReset();
});

describe("scalable targets", () => {
  it("registers", async () => {
    mockSend.mockResolvedValueOnce({ ScalableTargetARN: "arn:x" });
    const res = await router.request(`${AG}/scalable-targets`, { method: "POST", body: JSON.stringify({ serviceNamespace: "ecs", resourceId: "c/s", scalableDimension: "d", minCapacity: 1, maxCapacity: 5 }), headers: { "content-type": "application/json" } });
    expect(res.status).toBe(201);
    expect((await j(res)).scalableTargetARN).toBe("arn:x");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("RegisterScalableTargetCommand");
  });
  it("400 without serviceNamespace", async () => {
    expect((await router.request(`${AG}/scalable-targets`, { method: "POST", body: JSON.stringify({ resourceId: "r" }), headers: { "content-type": "application/json" } })).status).toBe(400);
  });
  it("400 without resourceId", async () => {
    expect((await router.request(`${AG}/scalable-targets`, { method: "POST", body: JSON.stringify({ serviceNamespace: "ecs" }), headers: { "content-type": "application/json" } })).status).toBe(400);
  });
  it("400 without scalableDimension", async () => {
    expect((await router.request(`${AG}/scalable-targets`, { method: "POST", body: JSON.stringify({ serviceNamespace: "ecs", resourceId: "r" }), headers: { "content-type": "application/json" } })).status).toBe(400);
  });
  it("400 without capacities", async () => {
    expect((await router.request(`${AG}/scalable-targets`, { method: "POST", body: JSON.stringify({ serviceNamespace: "ecs", resourceId: "r", scalableDimension: "d" }), headers: { "content-type": "application/json" } })).status).toBe(400);
  });
  it("lists targets", async () => {
    mockSend.mockResolvedValueOnce({ ScalableTargets: [{ ServiceNamespace: "ecs", ResourceId: "c/s", ScalableDimension: "d", MinCapacity: 1, MaxCapacity: 5 }] });
    const res = await router.request(`${AG}/scalable-targets?serviceNamespace=ecs`);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.scalableTargets[0].resourceId).toBe("c/s");
  });
  it("deregisters", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request(`${AG}/scalable-targets`, { method: "DELETE", body: JSON.stringify({ serviceNamespace: "ecs", resourceId: "c/s", scalableDimension: "d" }), headers: { "content-type": "application/json" } });
    expect(res.status).toBe(200);
    expect((await res.json()).deregistered).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeregisterScalableTargetCommand");
  });
  it("deregister 400 without fields", async () => {
    expect((await router.request(`${AG}/scalable-targets`, { method: "DELETE", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
  });
});

describe("scaling policies", () => {
  it("puts policy", async () => {
    mockSend.mockResolvedValueOnce({ PolicyARN: "arn:p", Alarms: [] });
    const res = await router.request(`${AG}/scalable-policies`, { method: "POST", body: JSON.stringify({ policyName: "p", serviceNamespace: "ecs", resourceId: "r", scalableDimension: "d" }), headers: { "content-type": "application/json" } });
    expect(res.status).toBe(201);
    expect((await j(res)).policyArn).toBe("arn:p");
  });
  it("policy 400 without policyName", async () => {
    expect((await router.request(`${AG}/scalable-policies`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
  });
  it("policy 400 without serviceNamespace", async () => {
    expect((await router.request(`${AG}/scalable-policies`, { method: "POST", body: JSON.stringify({ policyName: "p" }), headers: { "content-type": "application/json" } })).status).toBe(400);
  });
  it("policy 400 without resourceId", async () => {
    expect((await router.request(`${AG}/scalable-policies`, { method: "POST", body: JSON.stringify({ policyName: "p" }), headers: { "content-type": "application/json" } })).status).toBe(400);
  });
  it("lists policies", async () => {
    mockSend.mockResolvedValueOnce({ ScalingPolicies: [{ PolicyName: "p", PolicyARN: "arn:p", ServiceNamespace: "ecs", ResourceId: "r", ScalableDimension: "d", PolicyType: "TargetTrackingScaling", TargetTrackingScalingPolicyConfiguration: {}, CreationTime: new Date("2026-01-01") }] });
    const res = await router.request(`${AG}/scalable-policies?serviceNamespace=ecs`);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.scalingPolicies[0].name).toBe("p");
  });
  it("deletes policy", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request(`${AG}/scalable-policies/p?serviceNamespace=ecs&resourceId=r&scalableDimension=d`, { method: "DELETE" });
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteScalingPolicyCommand");
  });
  it("delete 400 without resourceId", async () => {
    expect((await router.request(`${AG}/scalable-policies/p?serviceNamespace=ecs`, { method: "DELETE" })).status).toBe(400);
  });
});

describe("tags", () => {
  it("lists tags", async () => {
    mockSend.mockResolvedValueOnce({ Tags: [{ Key: "a", Value: "b" }] });
    const res = await router.request(`${AG}/resources/c%2Fs/tags`);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.tags[0].Key).toBe("a");
  });
  it("tags resource", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request(`${AG}/resources/c%2Fs/tags`, { method: "PUT", body: JSON.stringify({ tags: [{ Key: "a", Value: "b" }] }), headers: { "content-type": "application/json" } });
    expect(res.status).toBe(200);
  });
  it("400 without tags", async () => {
    expect((await router.request(`${AG}/resources/c%2Fs/tags`, { method: "PUT", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
  });
  it("untags resource", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request(`${AG}/resources/c%2Fs/tags/a`, { method: "DELETE" });
    expect(res.status).toBe(200);
  });
});
