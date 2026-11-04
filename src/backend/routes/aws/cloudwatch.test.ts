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
  PutDashboardCommand: createCmd("PutDashboardCommand"),
  GetDashboardCommand: createCmd("GetDashboardCommand"),
  ListDashboardsCommand: createCmd("ListDashboardsCommand"),
  DeleteDashboardsCommand: createCmd("DeleteDashboardsCommand"),
  PutMetricStreamCommand: createCmd("PutMetricStreamCommand"),
  GetMetricStreamCommand: createCmd("GetMetricStreamCommand"),
  ListMetricStreamsCommand: createCmd("ListMetricStreamsCommand"),
  DeleteMetricStreamCommand: createCmd("DeleteMetricStreamCommand"),
  StartMetricStreamsCommand: createCmd("StartMetricStreamsCommand"),
  StopMetricStreamsCommand: createCmd("StopMetricStreamsCommand"),
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

    it("GET /metrics — sparse response defaults to empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/metrics");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.metrics).toEqual([]);
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

    it("GET /metrics — maps metric with populated Dimensions", async () => {
      mockSend.mockResolvedValueOnce({
        Metrics: [{
          Namespace: "AWS/Lambda",
          MetricName: "Invocations",
          Dimensions: [{ Name: "FunctionName", Value: "my-fn" }],
        }],
      });
      const res = await get("/metrics");
      const body = await res.json();
      expect(body.metrics[0].dimensions).toEqual([{ name: "FunctionName", value: "my-fn" }]);
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

    it("POST /metrics/data — without metricData (falls back to empty)", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/metrics/data", { namespace: "Test" });
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

    it("GET /tags/:arn — sparse response defaults to empty tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/tags/my-alarm-arn");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags).toEqual({});
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

    it("POST /tags/:arn — tags without body.tags (uses empty object)", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tags/my-alarm-arn", {});
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].Tags).toEqual([]);
    });
  });

  // ═══ Additional branch coverage tests ═══════════════

  describe("Alarms — edge cases", () => {
    it("GET /alarms — alarm without Dimensions property", async () => {
      mockSend.mockResolvedValueOnce({
        MetricAlarms: [{ AlarmName: "no-dim", MetricName: "CPU", Namespace: "AWS/EC2", StateValue: "OK", Threshold: 50, ComparisonOperator: "GreaterThanThreshold", Period: 60, Statistic: "Average" }],
      });
      const res = await get("/alarms");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.alarms[0].dimensions).toEqual([]);
    });

    it("GET /alarms — returns empty alarms list", async () => {
      mockSend.mockResolvedValueOnce({ MetricAlarms: [] });
      const res = await get("/alarms");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.alarms).toEqual([]);
    });

    it("GET /alarms — sparse response defaults to empty alarms", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/alarms");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.alarms).toEqual([]);
    });
  });

  describe("Metrics — additional edge cases", () => {
    it("GET /metrics/statistics — label falls back to metricName", async () => {
      mockSend.mockResolvedValueOnce({
        Label: undefined,
        Datapoints: [{ Timestamp: new Date(), Average: 25, Unit: "Percent" }],
      });
      const res = await get("/metrics/statistics?namespace=Test&metricName=MyMetric");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.label).toBe("MyMetric");
    });

    it("GET /alarms — maps alarm without state fields to empty arrays", async () => {
      mockSend.mockResolvedValueOnce({
        MetricAlarms: [{ AlarmName: "bare-alarm", MetricName: "CPU", Namespace: "AWS/EC2", StateValue: "OK", Threshold: 80, ComparisonOperator: "GT", Period: 60, Statistic: "Avg" }],
      });
      const res = await get("/alarms");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.alarms[0].alarmActions).toEqual([]);
      expect(body.alarms[0].okActions).toEqual([]);
      expect(body.alarms[0].insufficientDataActions).toEqual([]);
    });
  });

  describe("Statistics — dimensions", () => {
    it("GET /metrics/statistics — without dimensions query param", async () => {
      mockSend.mockResolvedValueOnce({
        Label: "CPUUtilization",
        Datapoints: [{ Timestamp: new Date(), Average: 75, Unit: "Percent" }],
      });
      const res = await get("/metrics/statistics?namespace=AWS/EC2&metricName=CPUUtilization");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.datapoints).toHaveLength(1);
      expect(mockSend.mock.calls[0][0].Dimensions).toEqual([]);
    });

    it("GET /metrics/statistics — sparse response defaults to empty datapoints", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/metrics/statistics?namespace=AWS/EC2&metricName=CPUUtilization");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.datapoints).toEqual([]);
    });

    it("GET /metrics/statistics — parses valid JSON dimensions", async () => {
      mockSend.mockResolvedValueOnce({
        Label: "CPUUtilization",
        Datapoints: [{ Timestamp: new Date(), Average: 50, Unit: "Percent" }],
      });
      const dims = encodeURIComponent(JSON.stringify([{ name: "InstanceId", value: "i-001" }]));
      const res = await get(`/metrics/statistics?namespace=AWS/EC2&metricName=CPUUtilization&dimensions=${dims}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.datapoints).toHaveLength(1);
      expect(mockSend.mock.calls[0][0].Dimensions).toEqual([{ Name: "InstanceId", Value: "i-001" }]);
    });

    it("GET /metrics/statistics — sorts datapoints with and without timestamps", async () => {
      mockSend.mockResolvedValueOnce({
        Label: "CPUUtilization",
        Datapoints: [
          { Timestamp: new Date("2025-01-01T00:00:00Z"), Average: 1 },
          { Average: 2 },
          { Timestamp: new Date("2025-01-02T00:00:00Z"), Average: 3 },
          { Average: 4 },
        ],
      });
      const res = await get("/metrics/statistics?namespace=AWS/EC2&metricName=CPUUtilization");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.datapoints).toHaveLength(4);
      expect(body.datapoints[0].timestamp).toBeUndefined();
      expect(body.datapoints[3].timestamp).toBe(new Date("2025-01-02T00:00:00Z").getTime());
    });
  });

  describe("MetricData — edge cases", () => {
    it("POST /metrics/data — metricData without timestamp", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/metrics/data", {
        namespace: "Test",
        metricData: [{ metricName: "latency", value: 10, unit: "Milliseconds" }],
      });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].MetricData[0].Timestamp).toBeUndefined();
    });

    it("POST /metrics/data — metricData without statisticValues", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/metrics/data", {
        namespace: "Test",
        metricData: [{ metricName: "latency", value: 10, unit: "Milliseconds" }],
      });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].MetricData[0].StatisticValues).toBeUndefined();
    });

    it("POST /metrics/data/query — MetricDataResults without Timestamps", async () => {
      mockSend.mockResolvedValueOnce({
        MetricDataResults: [{ Id: "m1", Label: "Test", StatusCode: "Complete", Values: [10] }],
      });
      const res = await post("/metrics/data/query", { queries: [{ id: "m1", expression: "SELECT 1" }] });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.results[0].timestamps).toEqual([]);
    });

    it("POST /metrics/data/query — MetricDataResults without Values", async () => {
      mockSend.mockResolvedValueOnce({
        MetricDataResults: [{ Id: "m1", Label: "Test", StatusCode: "Complete", Timestamps: [] }],
      });
      const res = await post("/metrics/data/query", { queries: [{ id: "m1", expression: "SELECT 1" }] });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.results[0].values).toEqual([]);
    });

    it("POST /metrics/data/query — without queries (falls back to empty)", async () => {
      mockSend.mockResolvedValueOnce({ MetricDataResults: [] });
      const res = await post("/metrics/data/query", {});
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.results).toEqual([]);
      expect(mockSend.mock.calls[0][0].MetricDataQueries).toEqual([]);
    });

    it("POST /metrics/data/query — sparse response defaults to empty results", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/metrics/data/query", { queries: [{ id: "m1", expression: "SELECT 1" }] });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.results).toEqual([]);
    });
  });

  describe("Dashboards", () => {
    it("GET /dashboards — lists dashboards", async () => {
      mockSend.mockResolvedValueOnce({
        DashboardEntries: [
          { DashboardName: "ops", DashboardArn: "arn:aws:cloudwatch::dashboard/ops", LastModified: 1000, Size: 42 },
        ],
      });
      const res = await get("/dashboards");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.dashboards[0].dashboardName).toBe("ops");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListDashboardsCommand");
    });

    it("GET /dashboards — forwards prefix and handles sparse response", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/dashboards?prefix=op");
      const body = await res.json();
      expect(body.dashboards).toEqual([]);
      expect(body.total).toBe(0);
      expect(mockSend.mock.calls[0][0].DashboardNamePrefix).toBe("op");
    });

    it("GET /dashboards/:name — returns dashboard body", async () => {
      mockSend.mockResolvedValueOnce({
        DashboardName: "ops",
        DashboardArn: "arn:aws:cloudwatch::dashboard/ops",
        DashboardBody: '{"widgets":[]}',
      });
      const res = await get("/dashboards/ops");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.dashboardName).toBe("ops");
      expect(body.dashboardBody).toBe('{"widgets":[]}');
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetDashboardCommand");
    });

    it("PUT /dashboards/:name — puts a dashboard body", async () => {
      mockSend.mockResolvedValueOnce({ DashboardValidationMessages: [] });
      const res = await put("/dashboards/ops", { dashboardBody: '{"widgets":[]}' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.validationMessages).toEqual([]);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("PutDashboardCommand");
      expect(mockSend.mock.calls[0][0].DashboardName).toBe("ops");
      expect(mockSend.mock.calls[0][0].DashboardBody).toBe('{"widgets":[]}');
    });

    it("PUT /dashboards/:name — forwards tags and defaults validation messages", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/dashboards/ops", {
        dashboardBody: "{}",
        tags: [{ key: "env", value: "test" }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.validationMessages).toEqual([]);
      expect(mockSend.mock.calls[0][0].Tags).toEqual([{ Key: "env", Value: "test" }]);
    });

    it("PUT /dashboards/:name — 400 when dashboardBody missing", async () => {
      const res = await put("/dashboards/ops", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /dashboards/:name — deletes via DeleteDashboards", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/dashboards/ops");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteDashboardsCommand");
      expect(mockSend.mock.calls[0][0].DashboardNames).toEqual(["ops"]);
    });
  });

  describe("Metric Streams", () => {
    it("GET /metric-streams — lists streams", async () => {
      mockSend.mockResolvedValueOnce({
        Entries: [
          {
            Arn: "arn:aws:cloudwatch::metric-stream/main",
            Name: "main",
            FirehoseArn: "arn:aws:firehose::deliverable/main",
            State: "running",
            OutputFormat: "json",
            CreationDate: 1000,
            LastUpdateDate: 2000,
          },
        ],
        NextToken: "t2",
      });
      const res = await get("/metric-streams");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.metricStreams[0].name).toBe("main");
      expect(body.metricStreams[0].state).toBe("running");
      expect(body.nextToken).toBe("t2");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListMetricStreamsCommand");
    });

    it("GET /metric-streams — sparse response defaults and forwards nextToken", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/metric-streams?nextToken=t1");
      const body = await res.json();
      expect(body.metricStreams).toEqual([]);
      expect(body.nextToken).toBeUndefined();
      expect(mockSend.mock.calls[0][0].NextToken).toBe("t1");
    });

    it("GET /metric-streams/:name — returns stream detail with filters", async () => {
      mockSend.mockResolvedValueOnce({
        Arn: "arn:aws:cloudwatch::metric-stream/main",
        Name: "main",
        FirehoseArn: "arn:aws:firehose::deliverable/main",
        RoleArn: "arn:aws:iam::role/stream",
        State: "running",
        OutputFormat: "json",
        CreationDate: 1000,
        LastUpdateDate: 2000,
        IncludeLinkedAccountsMetrics: false,
        IncludeFilters: [{ Namespace: "AWS/EC2", MetricNames: ["CPUUtilization"] }],
        ExcludeFilters: [{ Namespace: "AWS/S3" }],
      });
      const res = await get("/metric-streams/main");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.name).toBe("main");
      expect(body.includeFilters).toEqual([{ namespace: "AWS/EC2", metricNames: ["CPUUtilization"] }]);
      expect(body.excludeFilters).toEqual([{ namespace: "AWS/S3", metricNames: [] }]);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetMetricStreamCommand");
    });

    it("GET /metric-streams/:name — defaults filters when absent", async () => {
      mockSend.mockResolvedValueOnce({ Name: "main", State: "stopped" });
      const res = await get("/metric-streams/main");
      const body = await res.json();
      expect(body.includeFilters).toEqual([]);
      expect(body.excludeFilters).toEqual([]);
    });

    it("GET /metric-streams/:name — filters without MetricNames default to empty lists", async () => {
      mockSend.mockResolvedValueOnce({
        Name: "main",
        State: "stopped",
        IncludeFilters: [{ Namespace: "AWS/EC2" }],
      });
      const res = await get("/metric-streams/main");
      const body = await res.json();
      expect(body.includeFilters).toEqual([{ namespace: "AWS/EC2", metricNames: [] }]);
    });

    it("PUT /metric-streams/:name — creates a stream", async () => {
      mockSend.mockResolvedValueOnce({ Arn: "arn:aws:cloudwatch::metric-stream/main" });
      const res = await put("/metric-streams/main", {
        firehoseArn: "arn:aws:firehose::deliverable/main",
        roleArn: "arn:aws:iam::role/stream",
        outputFormat: "json",
        includeFilters: [{ namespace: "AWS/EC2", metricNames: ["CPUUtilization"] }],
        tags: [{ key: "env", value: "test" }],
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.arn).toBe("arn:aws:cloudwatch::metric-stream/main");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("PutMetricStreamCommand");
      expect(mockSend.mock.calls[0][0].Name).toBe("main");
      expect(mockSend.mock.calls[0][0].IncludeFilters).toEqual([
        { Namespace: "AWS/EC2", MetricNames: ["CPUUtilization"] },
      ]);
      expect(mockSend.mock.calls[0][0].Tags).toEqual([{ Key: "env", Value: "test" }]);
    });

    it("PUT /metric-streams/:name — omits optional filters and configurations", async () => {
      mockSend.mockResolvedValueOnce({ Arn: "arn:x" });
      const res = await put("/metric-streams/main", {
        firehoseArn: "arn:f",
        roleArn: "arn:r",
        outputFormat: "opentelemetry1.0",
      });
      expect(res.status).toBe(201);
      expect(mockSend.mock.calls[0][0].IncludeFilters).toEqual([]);
      expect(mockSend.mock.calls[0][0].ExcludeFilters).toEqual([]);
      expect(mockSend.mock.calls[0][0].StatisticsConfigurations).toEqual([]);
      expect(mockSend.mock.calls[0][0].Tags).toEqual([]);
    });

    it("PUT /metric-streams/:name — forwards statistics configurations and exclude filters", async () => {
      mockSend.mockResolvedValueOnce({ Arn: "arn:x" });
      const res = await put("/metric-streams/main", {
        firehoseArn: "arn:f",
        roleArn: "arn:r",
        outputFormat: "json",
        excludeFilters: [{ namespace: "AWS/S3" }],
        statisticsConfigurations: [
          {
            includeMetrics: [{ namespace: "AWS/EC2", metricName: "CPUUtilization" }],
            additionalStatistics: ["p99"],
          },
        ],
      });
      expect(res.status).toBe(201);
      expect(mockSend.mock.calls[0][0].ExcludeFilters).toEqual([
        { Namespace: "AWS/S3", MetricNames: undefined },
      ]);
      expect(mockSend.mock.calls[0][0].StatisticsConfigurations).toEqual([
        {
          IncludeMetrics: [{ Namespace: "AWS/EC2", MetricName: "CPUUtilization" }],
          AdditionalStatistics: ["p99"],
        },
      ]);
    });

    it("PUT /metric-streams/:name — 400 when required fields missing", async () => {
      const res = await put("/metric-streams/main", { firehoseArn: "arn:f" });
      expect(res.status).toBe(400);
    });

    it("DELETE /metric-streams/:name — deletes a stream", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/metric-streams/main");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteMetricStreamCommand");
      expect(mockSend.mock.calls[0][0].Name).toBe("main");
    });

    it("POST /metric-streams/start — starts streams by name", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/metric-streams/start", { names: ["a", "b"] });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.started).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("StartMetricStreamsCommand");
      expect(mockSend.mock.calls[0][0].Names).toEqual(["a", "b"]);
    });

    it("POST /metric-streams/start — 400 when names missing", async () => {
      const res = await post("/metric-streams/start", {});
      expect(res.status).toBe(400);
    });

    it("POST /metric-streams/stop — stops streams by name", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/metric-streams/stop", { names: ["a"] });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.stopped).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("StopMetricStreamsCommand");
    });

    it("POST /metric-streams/stop — 400 when names missing", async () => {
      const res = await post("/metric-streams/stop", { names: [] });
      expect(res.status).toBe(400);
    });
  });
});
