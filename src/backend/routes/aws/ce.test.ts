import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockCE = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-cost-explorer", () => ({
  CostExplorerClient: mockCE,
  GetCostAndUsageCommand: createCmd("GetCostAndUsageCommand"),
  GetCostAndUsageWithResourcesCommand: createCmd("GetCostAndUsageWithResourcesCommand"),
  GetDimensionValuesCommand: createCmd("GetDimensionValuesCommand"),
  GetTagsCommand: createCmd("GetTagsCommand"),
  GetReservationCoverageCommand: createCmd("GetReservationCoverageCommand"),
  GetReservationUtilizationCommand: createCmd("GetReservationUtilizationCommand"),
  GetSavingsPlansCoverageCommand: createCmd("GetSavingsPlansCoverageCommand"),
  GetSavingsPlansUtilizationCommand: createCmd("GetSavingsPlansUtilizationCommand"),
  GetCostCategoriesCommand: createCmd("GetCostCategoriesCommand"),
  CreateAnomalyMonitorCommand: createCmd("CreateAnomalyMonitorCommand"),
  GetAnomalyMonitorsCommand: createCmd("GetAnomalyMonitorsCommand"),
  UpdateAnomalyMonitorCommand: createCmd("UpdateAnomalyMonitorCommand"),
  DeleteAnomalyMonitorCommand: createCmd("DeleteAnomalyMonitorCommand"),
  CreateAnomalySubscriptionCommand: createCmd("CreateAnomalySubscriptionCommand"),
  GetAnomalySubscriptionsCommand: createCmd("GetAnomalySubscriptionsCommand"),
  UpdateAnomalySubscriptionCommand: createCmd("UpdateAnomalySubscriptionCommand"),
  DeleteAnomalySubscriptionCommand: createCmd("DeleteAnomalySubscriptionCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./ce";

async function get(path: string) {
  return router.request(path, { method: "GET" });
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

async function post(path: string, body?: any) {
  return router.request(path, {
    method: "POST",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("CE Routes", () => {
  describe("POST /cost-and-usage", () => {
    const validBody = {
      timePeriod: { start: "2025-01-01", end: "2025-02-01" },
      granularity: "DAILY",
      metrics: ["BlendedCost"],
    };

    it("returns cost and usage", async () => {
      mockSend.mockResolvedValueOnce({
        ResultsByTime: [{ timePeriod: { start: "2025-01-01" } }],
        GroupDefinitions: [{ key: "SERVICE", type: "DIMENSION" }],
      });
      const res = await post("/cost-and-usage", validBody);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.resultsByTime).toHaveLength(1);
      expect(body.groupDefinitions).toHaveLength(1);
      expect(body.total).toBe(1);
    });

    it("returns empty results when ResultsByTime is missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/cost-and-usage", validBody);
      const body = await res.json();
      expect(body.resultsByTime).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("returns 400 when timePeriod is missing", async () => {
      const res = await post("/cost-and-usage", { granularity: "DAILY", metrics: ["BlendedCost"] });
      expect(res.status).toBe(400);
    });

    it("returns 400 when granularity is missing", async () => {
      const res = await post("/cost-and-usage", {
        timePeriod: { start: "2025-01-01", end: "2025-02-01" },
        metrics: ["BlendedCost"],
      });
      expect(res.status).toBe(400);
    });

    it("returns 400 when metrics is missing", async () => {
      const res = await post("/cost-and-usage", {
        timePeriod: { start: "2025-01-01", end: "2025-02-01" },
        granularity: "DAILY",
      });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /dimension-values", () => {
    const validBody = {
      timePeriod: { start: "2025-01-01", end: "2025-02-01" },
      dimension: "SERVICE",
    };

    it("returns dimension values", async () => {
      mockSend.mockResolvedValueOnce({
        DimensionValues: [{ value: "Amazon EC2", attributes: {} }],
      });
      const res = await post("/dimension-values", validBody);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.dimensionValues).toHaveLength(1);
      expect(body.total).toBe(1);
    });

    it("returns empty results when DimensionValues is missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/dimension-values", validBody);
      const body = await res.json();
      expect(body.dimensionValues).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("returns 400 when dimension is missing", async () => {
      const res = await post("/dimension-values", {
        timePeriod: { start: "2025-01-01", end: "2025-02-01" },
      });
      expect(res.status).toBe(400);
    });

    it("returns 400 when timePeriod is missing", async () => {
      const res = await post("/dimension-values", { dimension: "SERVICE" });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /tags", () => {
    const validBody = {
      timePeriod: { start: "2025-01-01", end: "2025-02-01" },
    };

    it("returns tags", async () => {
      mockSend.mockResolvedValueOnce({ Tags: ["Environment", "Project"] });
      const res = await post("/tags", validBody);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags).toEqual(["Environment", "Project"]);
      expect(body.total).toBe(2);
    });

    it("returns empty results when Tags is missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tags", validBody);
      const body = await res.json();
      expect(body.tags).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("returns 400 when timePeriod is missing", async () => {
      const res = await post("/tags", {});
      expect(res.status).toBe(400);
    });
  });

  describe("POST /reservation-coverage", () => {
    const validBody = {
      timePeriod: { start: "2025-01-01", end: "2025-02-01" },
      granularity: "DAILY",
    };

    it("returns reservation coverage", async () => {
      mockSend.mockResolvedValueOnce({
        CoveragesByTime: [{ timePeriod: { start: "2025-01-01" } }],
      });
      const res = await post("/reservation-coverage", validBody);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.coveragesByTime).toHaveLength(1);
      expect(body.total).toBe(1);
    });

    it("returns empty results when CoveragesByTime is missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/reservation-coverage", validBody);
      const body = await res.json();
      expect(body.coveragesByTime).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("returns 400 when granularity is missing", async () => {
      const res = await post("/reservation-coverage", {
        timePeriod: { start: "2025-01-01", end: "2025-02-01" },
      });
      expect(res.status).toBe(400);
    });

    it("returns 400 when timePeriod is missing", async () => {
      const res = await post("/reservation-coverage", { granularity: "DAILY" });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /reservation-utilization", () => {
    const validBody = {
      timePeriod: { start: "2025-01-01", end: "2025-02-01" },
      granularity: "DAILY",
    };

    it("returns reservation utilization", async () => {
      mockSend.mockResolvedValueOnce({
        UtilizationsByTime: [{ timePeriod: { start: "2025-01-01" } }],
      });
      const res = await post("/reservation-utilization", validBody);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.utilizationsByTime).toHaveLength(1);
      expect(body.total).toBe(1);
    });

    it("returns empty results when UtilizationsByTime is missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/reservation-utilization", validBody);
      const body = await res.json();
      expect(body.utilizationsByTime).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("returns 400 when timePeriod is missing", async () => {
      const res = await post("/reservation-utilization", { granularity: "DAILY" });
      expect(res.status).toBe(400);
    });

    it("returns 400 when granularity is missing", async () => {
      const res = await post("/reservation-utilization", {
        timePeriod: { start: "2025-01-01", end: "2025-02-01" },
      });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /savings-plans-coverage", () => {
    const validBody = {
      timePeriod: { start: "2025-01-01", end: "2025-02-01" },
      granularity: "DAILY",
    };

    it("returns savings plans coverage", async () => {
      mockSend.mockResolvedValueOnce({
        SavingsPlansCoverages: [{ attributes: {} }],
      });
      const res = await post("/savings-plans-coverage", validBody);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.savingsPlansCoverages).toHaveLength(1);
      expect(body.total).toBe(1);
    });

    it("returns empty results when SavingsPlansCoverages is missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/savings-plans-coverage", validBody);
      const body = await res.json();
      expect(body.savingsPlansCoverages).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("returns 400 when timePeriod is missing", async () => {
      const res = await post("/savings-plans-coverage", { granularity: "DAILY" });
      expect(res.status).toBe(400);
    });

    it("returns 400 when granularity is missing", async () => {
      const res = await post("/savings-plans-coverage", {
        timePeriod: { start: "2025-01-01", end: "2025-02-01" },
      });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /savings-plans-utilization", () => {
    const validBody = {
      timePeriod: { start: "2025-01-01", end: "2025-02-01" },
      granularity: "DAILY",
    };

    it("returns savings plans utilization", async () => {
      mockSend.mockResolvedValueOnce({
        SavingsPlansUtilizationsByTime: [{ timePeriod: { start: "2025-01-01" } }],
      });
      const res = await post("/savings-plans-utilization", validBody);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.savingsPlansUtilizationsByTime).toHaveLength(1);
      expect(body.total).toBe(1);
    });

    it("returns empty results when SavingsPlansUtilizationsByTime is missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/savings-plans-utilization", validBody);
      const body = await res.json();
      expect(body.savingsPlansUtilizationsByTime).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("returns 400 when timePeriod is missing", async () => {
      const res = await post("/savings-plans-utilization", { granularity: "DAILY" });
      expect(res.status).toBe(400);
    });

    it("returns 400 when granularity is missing", async () => {
      const res = await post("/savings-plans-utilization", {
        timePeriod: { start: "2025-01-01", end: "2025-02-01" },
      });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /cost-categories", () => {
    it("returns cost categories", async () => {
      mockSend.mockResolvedValueOnce({
        CostCategoryNames: ["Category1", "Category2"],
      });
      const res = await post("/cost-categories", {});
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.costCategories).toEqual(["Category1", "Category2"]);
      expect(body.total).toBe(2);
    });

    it("returns empty results when CostCategoryNames is missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/cost-categories", {});
      const body = await res.json();
      expect(body.costCategories).toEqual([]);
      expect(body.total).toBe(0);
    });
  });

  it("POST /cost-and-usage-with-resources — returns grouped results", async () => {
    mockSend.mockResolvedValueOnce({
      ResultsByTime: [{ TimePeriod: { Start: "2026-01-01" }, Total: {} }],
      GroupDefinitions: [{ Type: "DIMENSION", Key: "RESOURCE_ID" }],
    });
    const res = await post("/cost-and-usage-with-resources", {
      timePeriod: { start: "2026-01-01", end: "2026-01-31" },
      granularity: "MONTHLY",
      metrics: ["UnblendedCost"],
      filter: { Dimensions: { Key: "SERVICE", Values: ["Amazon S3"] } },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.groupDefinitions[0].Key).toBe("RESOURCE_ID");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("GetCostAndUsageWithResourcesCommand");
    expect(cmd.Granularity).toBe("MONTHLY");
    expect(cmd.Filter.Dimensions.Key).toBe("SERVICE");
  });

  it("POST /cost-and-usage-with-resources — sparse response", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/cost-and-usage-with-resources", {
      timePeriod: { start: "a", end: "b" },
      granularity: "MONTHLY",
      metrics: ["UnblendedCost"],
    });
    const body = await res.json();
    expect(body).toEqual({ resultsByTime: [], groupDefinitions: [], total: 0 });
  });

  it("POST /cost-and-usage-with-resources — 400 without timePeriod", async () => {
    const res = await post("/cost-and-usage-with-resources", { granularity: "MONTHLY", metrics: ["x"] });
    expect(res.status).toBe(400);
  });

  it("POST /cost-and-usage-with-resources — 400 without granularity", async () => {
    const res = await post("/cost-and-usage-with-resources", { timePeriod: { start: "a", end: "b" }, metrics: ["x"] });
    expect(res.status).toBe(400);
  });

  it("POST /cost-and-usage-with-resources — 400 without metrics", async () => {
    const res = await post("/cost-and-usage-with-resources", { timePeriod: { start: "a", end: "b" }, granularity: "MONTHLY" });
    expect(res.status).toBe(400);
  });
});

describe("CE — anomaly monitors", () => {
  beforeEach(() => mockSend.mockReset());

  it("POST /anomaly-monitors — creates a monitor", async () => {
    mockSend.mockResolvedValueOnce({ MonitorArn: "arn:monitor" });
    const res = await post("/anomaly-monitors", { monitorName: "m1", monitorType: "DIMENSIONAL", monitorDimension: "SERVICE" });
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.monitorArn).toBe("arn:monitor");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateAnomalyMonitorCommand");
    expect(mockSend.mock.calls[0][0].AnomalyMonitor.MonitorName).toBe("m1");
  });

  it("POST /anomaly-monitors — 400 when monitorName missing", async () => {
    expect((await post("/anomaly-monitors", { monitorType: "DIMENSIONAL" })).status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("POST /anomaly-monitors — 400 when monitorType missing", async () => {
    expect((await post("/anomaly-monitors", { monitorName: "m1" })).status).toBe(400);
  });

  it("GET /anomaly-monitors — lists monitors", async () => {
    mockSend.mockResolvedValueOnce({
      AnomalyMonitors: [{
        MonitorArn: "arn:monitor", MonitorName: "m1", MonitorType: "DIMENSIONAL",
        MonitorDimension: "SERVICE", MonitorState: "ACTIVE", CreatedBy: "me",
        CreationDate: "d1", LastUpdatedDate: "d2", Tags: { env: "prod" },
      }],
    });
    const res = await get("/anomaly-monitors");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.total).toBe(1);
    expect(body.anomalyMonitors[0].name).toBe("m1");
    expect(body.anomalyMonitors[0].state).toBe("ACTIVE");
    expect(body.anomalyMonitors[0].tags).toEqual({ env: "prod" });
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetAnomalyMonitorsCommand");
  });

  it("GET /anomaly-monitors — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const body = await (await get("/anomaly-monitors")).json();
    expect(body.anomalyMonitors).toEqual([]);
  });

  it("GET /anomaly-monitors — falls back to nulls and empty tags for sparse entries", async () => {
    mockSend.mockResolvedValueOnce({ AnomalyMonitors: [{ MonitorArn: "arn:m", MonitorName: "m0" }] });
    const res = await get("/anomaly-monitors");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.anomalyMonitors[0].dimension).toBeNull();
    expect(body.anomalyMonitors[0].state).toBeNull();
    expect(body.anomalyMonitors[0].createdBy).toBeNull();
    expect(body.anomalyMonitors[0].creationDate).toBeNull();
    expect(body.anomalyMonitors[0].lastUpdatedDate).toBeNull();
    expect(body.anomalyMonitors[0].tags).toEqual({});
  });

  it("PUT /anomaly-monitors/:arn — updates monitor state", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/anomaly-monitors/" + encodeURIComponent("arn:monitor"), { monitorState: "PAUSED" });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.updated).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateAnomalyMonitorCommand");
    expect(mockSend.mock.calls[0][0].MonitorState).toBe("PAUSED");
  });

  it("PUT /anomaly-monitors/:arn — 400 when monitorState missing", async () => {
    expect((await put("/anomaly-monitors/arn", {})).status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("DELETE /anomaly-monitors/:arn — deletes monitor", async () => {
    mockSend.mockResolvedValueOnce({});
    const body = await (await del("/anomaly-monitors/" + encodeURIComponent("arn:monitor"))).json();
    expect(body.deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteAnomalyMonitorCommand");
  });
});

describe("CE — anomaly subscriptions", () => {
  beforeEach(() => mockSend.mockReset());

  it("POST /anomaly-subscriptions — creates a subscription", async () => {
    mockSend.mockResolvedValueOnce({ SubscriptionArn: "arn:sub" });
    const res = await post("/anomaly-subscriptions", {
      subscriptionName: "s1", monitorArn: "arn:monitor", subscribers: [{ Type: "EMAIL", Address: "a@b.c" }],
      threshold: 100, frequency: "DAILY",
    });
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.subscriptionArn).toBe("arn:sub");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateAnomalySubscriptionCommand");
    expect(mockSend.mock.calls[0][0].AnomalySubscription.MonitorArns).toEqual(["arn:monitor"]);
  });

  it("POST /anomaly-subscriptions — 400 when subscriptionName missing", async () => {
    expect((await post("/anomaly-subscriptions", { monitorArn: "m", subscribers: [{}] })).status).toBe(400);
  });

  it("POST /anomaly-subscriptions — 400 when monitorArn missing", async () => {
    expect((await post("/anomaly-subscriptions", { subscriptionName: "s", subscribers: [{}] })).status).toBe(400);
  });

  it("POST /anomaly-subscriptions — 400 when subscribers missing or empty", async () => {
    expect((await post("/anomaly-subscriptions", { subscriptionName: "s", monitorArn: "m" })).status).toBe(400);
    expect((await post("/anomaly-subscriptions", { subscriptionName: "s", monitorArn: "m", subscribers: [] })).status).toBe(400);
  });

  it("GET /anomaly-subscriptions — lists subscriptions", async () => {
    mockSend.mockResolvedValueOnce({
      AnomalySubscriptions: [{
        SubscriptionArn: "arn:sub", SubscriptionName: "s1", MonitorArns: ["arn:monitor"],
        Subscribers: [{ Type: "EMAIL" }], Threshold: 50, Frequency: "IMMEDIATE", CreatedBy: "me",
      }],
    });
    const res = await get("/anomaly-subscriptions");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.total).toBe(1);
    expect(body.anomalySubscriptions[0].name).toBe("s1");
    expect(body.anomalySubscriptions[0].threshold).toBe(50);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetAnomalySubscriptionsCommand");
  });

  it("GET /anomaly-subscriptions — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const body = await (await get("/anomaly-subscriptions")).json();
    expect(body.anomalySubscriptions).toEqual([]);
  });

  it("GET /anomaly-subscriptions — falls back to empty arrays and nulls for sparse entries", async () => {
    mockSend.mockResolvedValueOnce({ AnomalySubscriptions: [{ SubscriptionArn: "arn:s", SubscriptionName: "s0" }] });
    const res = await get("/anomaly-subscriptions");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.anomalySubscriptions[0].monitorArns).toEqual([]);
    expect(body.anomalySubscriptions[0].subscribers).toEqual([]);
    expect(body.anomalySubscriptions[0].threshold).toBeNull();
    expect(body.anomalySubscriptions[0].frequency).toBeNull();
    expect(body.anomalySubscriptions[0].createdBy).toBeNull();
  });

  it("GET /resource-tags — empty tags fall back to empty object", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/resource-tags?resourceArn=arn:m");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.tags).toEqual({});
    expect(body.arn).toBe("arn:m");
  });

  it("PUT /anomaly-subscriptions/:arn — updates subscription", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/anomaly-subscriptions/" + encodeURIComponent("arn:sub"), {
      subscribers: [{ Type: "EMAIL", Address: "x@y.z" }], threshold: 10, frequency: "WEEKLY",
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.updated).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateAnomalySubscriptionCommand");
  });

  it("PUT /anomaly-subscriptions/:arn — 400 when subscribers missing", async () => {
    expect((await put("/anomaly-subscriptions/arn", {})).status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("DELETE /anomaly-subscriptions/:arn — deletes subscription", async () => {
    mockSend.mockResolvedValueOnce({});
    const body = await (await del("/anomaly-subscriptions/" + encodeURIComponent("arn:sub"))).json();
    expect(body.deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteAnomalySubscriptionCommand");
  });
});

describe("CE — resource tags", () => {
  beforeEach(() => mockSend.mockReset());

  it("GET /resource-tags — lists tags", async () => {
    mockSend.mockResolvedValueOnce({ ResourceTags: { env: "prod" } });
    const res = await get("/resource-tags?resourceArn=arn:m");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.tags).toEqual({ env: "prod" });
    expect(body.arn).toBe("arn:m");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListTagsForResourceCommand");
  });

  it("GET /resource-tags — 400 when resourceArn missing", async () => {
    expect((await get("/resource-tags")).status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("POST /resource-tags — tags a resource", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/resource-tags", { resourceArn: "arn:m", tags: { env: "prod" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.tagged).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("TagResourceCommand");
    expect(mockSend.mock.calls[0][0].ResourceTags).toEqual({ env: "prod" });
  });

  it("POST /resource-tags — 400 when resourceArn or tags missing", async () => {
    expect((await post("/resource-tags", { tags: {} })).status).toBe(400);
    expect((await post("/resource-tags", { resourceArn: "arn:m" })).status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("POST /resource-tags/untag — untags keys", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/resource-tags/untag", { resourceArn: "arn:m", tagKeys: ["env"] });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.untagged).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("UntagResourceCommand");
    expect(mockSend.mock.calls[0][0].ResourceTagKeys).toEqual(["env"]);
  });

  it("POST /resource-tags/untag — 400 when resourceArn or tagKeys missing", async () => {
    expect((await post("/resource-tags/untag", { tagKeys: ["a"] })).status).toBe(400);
    expect((await post("/resource-tags/untag", { resourceArn: "arn:m" })).status).toBe(400);
    expect((await post("/resource-tags/untag", { resourceArn: "arn:m", tagKeys: [] })).status).toBe(400);
  });
});
