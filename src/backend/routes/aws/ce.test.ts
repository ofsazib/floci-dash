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
  GetDimensionValuesCommand: createCmd("GetDimensionValuesCommand"),
  GetTagsCommand: createCmd("GetTagsCommand"),
  GetReservationCoverageCommand: createCmd("GetReservationCoverageCommand"),
  GetReservationUtilizationCommand: createCmd("GetReservationUtilizationCommand"),
  GetSavingsPlansCoverageCommand: createCmd("GetSavingsPlansCoverageCommand"),
  GetSavingsPlansUtilizationCommand: createCmd("GetSavingsPlansUtilizationCommand"),
  GetCostCategoriesCommand: createCmd("GetCostCategoriesCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./ce";

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

    it("returns empty results", async () => {
      mockSend.mockResolvedValueOnce({ ResultsByTime: [] });
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

    it("returns empty results", async () => {
      mockSend.mockResolvedValueOnce({ DimensionValues: [] });
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

    it("returns empty results", async () => {
      mockSend.mockResolvedValueOnce({ Tags: [] });
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

    it("returns empty results", async () => {
      mockSend.mockResolvedValueOnce({ CoveragesByTime: [] });
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

    it("returns empty results", async () => {
      mockSend.mockResolvedValueOnce({ UtilizationsByTime: [] });
      const res = await post("/reservation-utilization", validBody);
      const body = await res.json();
      expect(body.utilizationsByTime).toEqual([]);
      expect(body.total).toBe(0);
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

    it("returns empty results", async () => {
      mockSend.mockResolvedValueOnce({ SavingsPlansCoverages: [] });
      const res = await post("/savings-plans-coverage", validBody);
      const body = await res.json();
      expect(body.savingsPlansCoverages).toEqual([]);
      expect(body.total).toBe(0);
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

    it("returns empty results", async () => {
      mockSend.mockResolvedValueOnce({ SavingsPlansUtilizationsByTime: [] });
      const res = await post("/savings-plans-utilization", validBody);
      const body = await res.json();
      expect(body.savingsPlansUtilizationsByTime).toEqual([]);
      expect(body.total).toBe(0);
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

    it("returns empty results", async () => {
      mockSend.mockResolvedValueOnce({ CostCategoryNames: [] });
      const res = await post("/cost-categories", {});
      const body = await res.json();
      expect(body.costCategories).toEqual([]);
      expect(body.total).toBe(0);
    });
  });
});
