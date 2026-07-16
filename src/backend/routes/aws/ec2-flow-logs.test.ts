import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockEC2Client = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-ec2", () => ({
  EC2Client: mockEC2Client,
  CreateFlowLogsCommand: createCmd("CreateFlowLogsCommand"),
  DescribeFlowLogsCommand: createCmd("DescribeFlowLogsCommand"),
  DeleteFlowLogsCommand: createCmd("DeleteFlowLogsCommand"),
}));

vi.mock("../../clients/aws", () => ({
  getAwsConfig: () => ({
    endpoint: "http://localhost:4566",
    region: "us-east-1",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  }),
}));

vi.mock("../../clients/sanitize", () => ({
  sanitizeName: (v: string) => v,
}));

import router from "./ec2-flow-logs";

async function get(path: string) {
  return router.request(path, { method: "GET" });
}

async function post(path: string, body?: any) {
  return router.request(path, {
    method: "POST",
    body: body != null ? JSON.stringify(body) : undefined,
    headers:
      body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function del(path: string) {
  return router.request(path, { method: "DELETE" });
}

beforeEach(() => {
  mockSend.mockReset();
  mockEC2Client.mockClear();
});

describe("EC2 Flow Logs Routes", () => {
  describe("List Flow Logs", () => {
    it("GET /flow-logs — lists flow logs", async () => {
      mockSend.mockResolvedValueOnce({
        FlowLogs: [
          {
            FlowLogId: "fl-abc123",
            ResourceId: "vpc-xyz",
            ResourceType: "VPC",
            TrafficType: "ALL",
            LogDestinationType: "s3",
            LogDestination: "arn:aws:s3:::flow-logs-bucket",
            LogFormat: "${version} ${account-id} ${interface-id}",
            MaxAggregationInterval: 600,
            FlowLogStatus: "ACTIVE",
            DeliverLogsStatus: "SUCCESS",
            CreationTime: new Date("2025-01-01"),
            Tags: [{ Key: "Name", Value: "main-flow-log" }],
          },
        ],
      });
      const res = await get("/flow-logs");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.flowLogs[0].flowLogId).toBe("fl-abc123");
      expect(body.flowLogs[0].resourceId).toBe("vpc-xyz");
      expect(body.flowLogs[0].trafficType).toBe("ALL");
      expect(body.flowLogs[0].tags[0].key).toBe("Name");
    });

    it("GET /flow-logs — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ FlowLogs: [] });
      const res = await get("/flow-logs");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.flowLogs).toEqual([]);
    });

    it("GET /flow-logs — filters by resourceId query param", async () => {
      mockSend.mockResolvedValueOnce({ FlowLogs: [] });
      const res = await get("/flow-logs?resourceId=vpc-123");
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.Filter).toEqual([
        { Name: "resource-id", Values: ["vpc-123"] },
      ]);
    });

    it("GET /flow-logs — no filter when resourceId not provided", async () => {
      mockSend.mockResolvedValueOnce({ FlowLogs: [] });
      await get("/flow-logs");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.Filter).toBeUndefined();
    });
  });

  describe("Create Flow Log", () => {
    it("POST /flow-logs — creates a flow log", async () => {
      mockSend.mockResolvedValueOnce({
        FlowLogIds: ["fl-new123"],
        Unsuccessful: [],
      });
      const res = await post("/flow-logs", {
        resourceId: "vpc-abc",
        resourceType: "VPC",
        trafficType: "ALL",
        logDestinationType: "s3",
        logDestination: "arn:aws:s3:::my-bucket",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.flowLogIds).toEqual(["fl-new123"]);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.ResourceIds).toEqual(["vpc-abc"]);
      expect(cmd.ResourceType).toBe("VPC");
      expect(cmd.TrafficType).toBe("ALL");
    });

    it("POST /flow-logs — includes logFormat and maxAggregationInterval", async () => {
      mockSend.mockResolvedValueOnce({
        FlowLogIds: ["fl-fmt"],
        Unsuccessful: [],
      });
      await post("/flow-logs", {
        resourceId: "vpc-abc",
        resourceType: "VPC",
        trafficType: "ACCEPT",
        logDestinationType: "cloud-watch-logs",
        logDestination: "arn:aws:logs:...",
        logFormat: "${version} ${account-id}",
        maxAggregationInterval: 60,
      });
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.LogFormat).toBe("${version} ${account-id}");
      expect(cmd.MaxAggregationInterval).toBe(60);
      expect(cmd.TrafficType).toBe("ACCEPT");
    });

    it("POST /flow-logs — 400 when resourceId missing", async () => {
      const res = await post("/flow-logs", {
        resourceType: "VPC",
        trafficType: "ALL",
      });
      expect(res.status).toBe(400);
    });

    it("POST /flow-logs — 400 when resourceType missing", async () => {
      const res = await post("/flow-logs", {
        resourceId: "vpc-abc",
        trafficType: "ALL",
      });
      expect(res.status).toBe(400);
    });

    it("POST /flow-logs — 400 when trafficType missing", async () => {
      const res = await post("/flow-logs", {
        resourceId: "vpc-abc",
        resourceType: "VPC",
      });
      expect(res.status).toBe(400);
    });

    it("POST /flow-logs — 400 when all required fields missing", async () => {
      const res = await post("/flow-logs", {});
      expect(res.status).toBe(400);
    });

    it("POST /flow-logs — handles unsuccessful items", async () => {
      mockSend.mockResolvedValueOnce({
        FlowLogIds: [],
        Unsuccessful: [
          {
            ResourceId: "vpc-bad",
            Error: { Code: "InvalidVpcId", Message: "VPC not found" },
          },
        ],
      });
      const res = await post("/flow-logs", {
        resourceId: "vpc-bad",
        resourceType: "VPC",
        trafficType: "ALL",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(false);
      expect(body.unsuccessful).toHaveLength(1);
    });
  });

  describe("Delete Flow Log", () => {
    it("DELETE /flow-logs/:id — deletes a flow log", async () => {
      mockSend.mockResolvedValueOnce({ Unsuccessful: [] });
      const res = await del("/flow-logs/fl-abc123");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(body.id).toBe("fl-abc123");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.FlowLogIds).toEqual(["fl-abc123"]);
    });

    it("DELETE /flow-logs/:id — handles unsuccessful deletion", async () => {
      mockSend.mockResolvedValueOnce({
        Unsuccessful: [
          {
            ResourceId: "fl-missing",
            Error: { Code: "InvalidFlowLogId.NotFound", Message: "Not found" },
          },
        ],
      });
      const res = await del("/flow-logs/fl-missing");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(false);
      expect(body.unsuccessful).toHaveLength(1);
    });
  });
});
