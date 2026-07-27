import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockCW = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-cloudwatch", () => ({
  CloudWatchClient: mockCW,
  PutMetricDataCommand: createCmd("PutMetricDataCommand"),
  ListMetricsCommand: createCmd("ListMetricsCommand"),
  GetMetricStatisticsCommand: createCmd("GetMetricStatisticsCommand"),
  GetMetricDataCommand: createCmd("GetMetricDataCommand"),
  PutMetricAlarmCommand: createCmd("PutMetricAlarmCommand"),
  DescribeAlarmsCommand: createCmd("DescribeAlarmsCommand"),
  DeleteAlarmsCommand: createCmd("DeleteAlarmsCommand"),
  SetAlarmStateCommand: createCmd("SetAlarmStateCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
}));

vi.mock("../../clients/aws", () => ({
  getAwsConfig: () => ({
    endpoint: "http://localhost:4566",
    region: "us-east-1",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  }),
}));

import router from "./cloudwatch";

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

describe("CloudWatch Routes", () => {
  describe("Metrics", () => {
    it("GET /metrics — lists metrics with namespaces", async () => {
      mockSend.mockResolvedValueOnce({
        Metrics: [
          { Namespace: "AWS/Lambda", MetricName: "Invocations", Dimensions: [] },
          { Namespace: "AWS/Lambda", MetricName: "Errors", Dimensions: [] },
          { Namespace: "AWS/EC2", MetricName: "CPUUtilization", Dimensions: [] },
        ],
      });
      const res = await get("/metrics");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(3);
      expect(body.namespaces).toEqual(["AWS/EC2", "AWS/Lambda"]);
      expect(body.metrics).toHaveLength(3);
    });

    it("GET /metrics — filters by namespace", async () => {
      mockSend.mockResolvedValueOnce({
        Metrics: [{ Namespace: "AWS/Lambda", MetricName: "Invocations", Dimensions: [] }],
      });
      const res = await get("/metrics?namespace=AWS/Lambda");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(mockSend.mock.calls[0][0].Namespace).toBe("AWS/Lambda");
    });

    it("GET /metrics — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ Metrics: [] });
      const res = await get("/metrics");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("POST /metrics/data — puts metric data", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/metrics/data", {
        namespace: "AWS/Lambda",
        metricData: [{ metricName: "Invocations", value: 42, unit: "Count" }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.put).toBe(true);
      expect(mockSend.mock.calls[0][0].Namespace).toBe("AWS/Lambda");
    });

    it("GET /metrics/statistics — gets statistics with datapoints", async () => {
      mockSend.mockResolvedValueOnce({
        Label: "Invocations",
        Datapoints: [
          { Timestamp: new Date("2025-01-01T00:00:00Z"), Average: 42, Unit: "Count" },
        ],
      });
      const res = await get("/metrics/statistics?namespace=AWS/Lambda&metricName=Invocations");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.label).toBe("Invocations");
      expect(body.datapoints).toHaveLength(1);
      expect(body.datapoints[0].average).toBe(42);
    });

    it("POST /metrics/data/query — runs metric data query", async () => {
      mockSend.mockResolvedValueOnce({
        MetricDataResults: [
          { Id: "m1", Label: "Invocations", StatusCode: "Complete", Timestamps: [new Date("2025-01-01T00:00:00Z")], Values: [42] },
        ],
      });
      const res = await post("/metrics/data/query", {
        queries: [{ id: "m1", metricStat: { namespace: "AWS/Lambda", metricName: "Invocations", stat: "Average" } }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.results).toHaveLength(1);
      expect(body.results[0].id).toBe("m1");
    });

    it("GET /metrics — filters by metricName", async () => {
      mockSend.mockResolvedValueOnce({
        Metrics: [{ Namespace: "AWS/Lambda", MetricName: "Invocations", Dimensions: [] }],
      });
      const res = await get("/metrics?namespace=AWS/Lambda&metricName=Invocations");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].MetricName).toBe("Invocations");
    });

    it("GET /metrics — handles metric without Dimensions property", async () => {
      mockSend.mockResolvedValueOnce({
        Metrics: [{ Namespace: "Custom/Test", MetricName: "Latency" }],
      });
      const res = await get("/metrics");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.metrics[0].dimensions).toEqual([]);
    });

    it("POST /metrics/data — with statisticValues, timestamps, dimensions", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/metrics/data", {
        namespace: "Custom/Test",
        metricData: [{
          metricName: "latency",
          value: 99,
          unit: "Milliseconds",
          timestamp: "2025-06-01T00:00:00Z",
          dimensions: [{ name: "Service", value: "api" }],
          statisticValues: { sampleCount: 10, sum: 990, minimum: 50, maximum: 150 },
        }],
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.Namespace).toBe("Custom/Test");
      expect(cmd.MetricData[0].Timestamp).toBeInstanceOf(Date);
      expect(cmd.MetricData[0].Dimensions).toEqual([{ Name: "Service", Value: "api" }]);
      expect(cmd.MetricData[0].StatisticValues.SampleCount).toBe(10);
      expect(cmd.MetricData[0].StatisticValues.Sum).toBe(990);
    });

    it("POST /metrics/data — with empty metricData", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/metrics/data", { namespace: "Test", metricData: [] });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].MetricData).toEqual([]);
    });

    it("GET /metrics/statistics — handles invalid dimensions JSON gracefully", async () => {
      mockSend.mockResolvedValueOnce({
        Label: "CPUUtilization",
        Datapoints: [{ Timestamp: new Date(), Average: 50, Unit: "Percent" }],
      });
      const res = await get("/metrics/statistics?namespace=AWS/EC2&metricName=CPUUtilization&dimensions=not-json");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.datapoints).toHaveLength(1);
      expect(mockSend.mock.calls[0][0].Dimensions).toEqual([]);
    });

    it("POST /metrics/data/query — with expression only (no metricStat)", async () => {
      mockSend.mockResolvedValueOnce({
        MetricDataResults: [{ Id: "expr1", Label: "Expression", StatusCode: "Complete", Timestamps: [], Values: [] }],
      });
      const res = await post("/metrics/data/query", {          queries: [{ id: "expr1", expression: `SELECT AVG(CPUUtilization) FROM SCHEMA("AWS/EC2")`, returnData: false }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.results).toHaveLength(1);
      expect(body.results[0].id).toBe("expr1");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.MetricDataQueries[0].MetricStat).toBeUndefined();
      expect(cmd.MetricDataQueries[0].Expression).toBeDefined();
      expect(cmd.MetricDataQueries[0].ReturnData).toBe(false);
    });

    it("POST /metrics/data/query — with dimensions on metricStat", async () => {
      mockSend.mockResolvedValueOnce({
        MetricDataResults: [{ Id: "m1", Label: "CPU", StatusCode: "Complete", Timestamps: [new Date()], Values: [50] }],
      });
      const res = await post("/metrics/data/query", {
        queries: [{
          id: "m1",
          metricStat: {
            namespace: "AWS/EC2",
            metricName: "CPUUtilization",
            stat: "Average",
            dimensions: [{ name: "InstanceId", value: "i-001" }],
          },
        }],
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.MetricDataQueries[0].MetricStat.Metric.Dimensions).toEqual([{ Name: "InstanceId", Value: "i-001" }]);
    });
  });

  describe("Alarms", () => {
    it("GET /alarms — lists alarms", async () => {
      mockSend.mockResolvedValueOnce({
        MetricAlarms: [
          { AlarmName: "high-cpu", MetricName: "CPUUtilization", Namespace: "AWS/EC2", Threshold: 80, ComparisonOperator: "GreaterThanThreshold", Period: 300, Statistic: "Average", StateValue: "ALARM", AlarmActions: [] },
        ],
      });
      const res = await get("/alarms");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.alarms[0].name).toBe("high-cpu");
      expect(body.alarms[0].state).toBe("ALARM");
    });

    it("GET /alarms — filters by state", async () => {
      mockSend.mockResolvedValueOnce({
        MetricAlarms: [
          { AlarmName: "ok-alarm", MetricName: "CPUUtilization", Namespace: "AWS/EC2", StateValue: "OK", Threshold: 80, ComparisonOperator: "GreaterThanThreshold", Period: 300, Statistic: "Average", AlarmActions: [] },
          { AlarmName: "alarm-alarm", MetricName: "CPUUtilization", Namespace: "AWS/EC2", StateValue: "ALARM", Threshold: 80, ComparisonOperator: "GreaterThanThreshold", Period: 300, Statistic: "Average", AlarmActions: [] },
        ],
      });
      const res = await get("/alarms?state=ALARM");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.alarms[0].name).toBe("alarm-alarm");
    });

    it("POST /alarms — creates an alarm", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/alarms", { name: "my-alarm", metricName: "CPUUtilization", namespace: "AWS/EC2", comparisonOperator: "GreaterThanThreshold" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(mockSend.mock.calls[0][0].AlarmName).toBe("my-alarm");
    });

    it("DELETE /alarms/:name — deletes an alarm", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/alarms/my-alarm");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].AlarmNames).toEqual(["my-alarm"]);
    });

    it("PUT /alarms/:name/state — sets alarm state", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/alarms/my-alarm/state", { state: "ALARM", reason: "Testing" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.state).toBe("ALARM");
      expect(mockSend.mock.calls[0][0].StateValue).toBe("ALARM");
    });

    it("GET /alarms — filters by prefix", async () => {
      mockSend.mockResolvedValueOnce({
        MetricAlarms: [{ AlarmName: "high-cpu", MetricName: "CPUUtilization", Namespace: "AWS/EC2", StateValue: "ALARM", Threshold: 80, ComparisonOperator: "GreaterThanThreshold", Period: 300, Statistic: "Average", AlarmActions: [] }],
      });
      const res = await get("/alarms?prefix=high");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].AlarmNamePrefix).toBe("high");
    });

    it("GET /alarms — maps alarm with Dimensions", async () => {
      mockSend.mockResolvedValueOnce({
        MetricAlarms: [{
          AlarmName: "dim-alarm",
          MetricName: "CPUUtilization",
          Namespace: "AWS/EC2",
          StateValue: "ALARM",
          Threshold: 80,
          ComparisonOperator: "GreaterThanThreshold",
          Period: 300,
          Statistic: "Average",
          AlarmActions: [],
          Dimensions: [{ Name: "InstanceId", Value: "i-001" }],
        }],
      });
      const res = await get("/alarms");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.alarms[0].dimensions).toEqual([{ name: "InstanceId", value: "i-001" }]);
    });

    it("POST /alarms — creates alarm with full fields (dimensions, tags, actionsEnabled false)", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/alarms", {
        name: "full-alarm",
        description: "Full alarm",
        metricName: "CPUUtilization",
        namespace: "AWS/EC2",
        statistic: "Average",
        period: 120,
        evaluationPeriods: 3,
        datapointsToAlarm: 2,
        threshold: 90,
        comparisonOperator: "GreaterThanThreshold",
        treatMissingData: "ignore",
        actionsEnabled: false,
        alarmActions: ["arn:alert"],
        okActions: ["arn:ok"],
        unit: "Percent",
        dimensions: [{ name: "InstanceId", value: "i-001" }],
        tags: [{ key: "env", value: "prod" }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.ActionsEnabled).toBe(false);
      expect(cmd.Dimensions).toHaveLength(1);
      expect(cmd.Tags).toHaveLength(1);
      expect(cmd.Period).toBe(120);
      expect(cmd.EvaluationPeriods).toBe(3);
      expect(cmd.DatapointsToAlarm).toBe(2);
    });
  });

  describe("Tags", () => {
    it("GET /tags/:arn — lists tags", async () => {
      mockSend.mockResolvedValueOnce({ Tags: [{ Key: "env", Value: "prod" }] });
      const res = await get("/tags/my-alarm-arn");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags.env).toBe("prod");
    });

    it("POST /tags/:arn — tags a resource", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tags/my-alarm-arn", { tags: { env: "prod" } });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tagged).toBe(true);
    });

    it("DELETE /tags/:arn — untags a resource", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await router.request("/tags/my-alarm-arn?keys=env", { method: "DELETE" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.untagged).toBe(true);
      expect(mockSend.mock.calls[0][0].TagKeys).toEqual(["env"]);
    });

    it("DELETE /tags/:arn — untags without keys (empty array)", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/tags/my-alarm-arn");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].TagKeys).toEqual([]);
    });
  });
});
