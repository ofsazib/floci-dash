import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockCUR = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-cost-and-usage-report-service", () => ({
  CostAndUsageReportServiceClient: mockCUR,
  DescribeReportDefinitionsCommand: createCmd("DescribeReportDefinitionsCommand"),
  PutReportDefinitionCommand: createCmd("PutReportDefinitionCommand"),
  ModifyReportDefinitionCommand: createCmd("ModifyReportDefinitionCommand"),
  DeleteReportDefinitionCommand: createCmd("DeleteReportDefinitionCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./cur";

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

describe("CUR Routes", () => {
  describe("GET /report-definitions", () => {
    it("lists report definitions", async () => {
      mockSend.mockResolvedValueOnce({
        ReportDefinitions: [
          {
            ReportName: "my-report",
            TimeUnit: "DAILY",
            Format: "textORcsv",
            Compression: "GZIP",
            S3Bucket: "my-bucket",
            S3Prefix: "reports",
            S3Region: "us-east-1",
          },
        ],
      });
      const res = await get("/report-definitions");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.reportDefinitions[0].ReportName).toBe("my-report");
    });

    it("returns empty list when no definitions", async () => {
      mockSend.mockResolvedValueOnce({ ReportDefinitions: [] });
      const res = await get("/report-definitions");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.reportDefinitions).toEqual([]);
    });
  });

  describe("POST /report-definitions", () => {
    it("creates a report definition", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/report-definitions", {
        reportName: "test-report",
        timeUnit: "DAILY",
        s3Bucket: "my-bucket",
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("PutReportDefinitionCommand");
      expect(mockSend.mock.calls[0][0].ReportDefinition.ReportName).toBe("test-report");
    });

    it("returns 400 when reportName is missing", async () => {
      const res = await post("/report-definitions", { timeUnit: "DAILY", s3Bucket: "bucket" });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("reportName");
    });

    it("returns 400 when timeUnit is missing", async () => {
      const res = await post("/report-definitions", { reportName: "test", s3Bucket: "bucket" });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("timeUnit");
    });

    it("returns 400 when s3Bucket is missing", async () => {
      const res = await post("/report-definitions", { reportName: "test", timeUnit: "DAILY" });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("s3Bucket");
    });
  });

  describe("PUT /report-definitions", () => {
    it("modifies a report definition", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/report-definitions", {
        reportName: "test-report",
        timeUnit: "HOURLY",
        s3Bucket: "my-bucket",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.modified).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("ModifyReportDefinitionCommand");
      expect(mockSend.mock.calls[0][0].ReportName).toBe("test-report");
    });

    it("returns 400 when reportName is missing", async () => {
      const res = await put("/report-definitions", { timeUnit: "DAILY" });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("reportName");
    });
  });

  describe("DELETE /report-definitions", () => {
    it("deletes a report definition", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/report-definitions/delete", { reportName: "test-report" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(body.reportName).toBe("test-report");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteReportDefinitionCommand");
      expect(mockSend.mock.calls[0][0].ReportName).toBe("test-report");
    });
  });

  describe("GET /tags", () => {
    it("lists tags for a report definition", async () => {
      mockSend.mockResolvedValueOnce({
        Tags: [{ Key: "env", Value: "prod" }],
      });
      const res = await get("/tags?reportName=test-report");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags).toHaveLength(1);
      expect(body.tags[0].Key).toBe("env");
      expect(mockSend.mock.calls[0][0].ReportName).toBe("test-report");
    });

    it("returns 400 when reportName is missing", async () => {
      const res = await get("/tags");
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("reportName");
    });
  });

  describe("POST /tags", () => {
    it("adds tags to a report definition", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tags", {
        reportName: "test-report",
        tags: [{ Key: "env", Value: "prod" }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tagged).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("TagResourceCommand");
      expect(mockSend.mock.calls[0][0].ReportName).toBe("test-report");
    });

    it("returns 400 when reportName is missing", async () => {
      const res = await post("/tags", { tags: [] });
      expect(res.status).toBe(400);
    });

    it("returns 400 when tags is missing", async () => {
      const res = await post("/tags", { reportName: "test" });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /tags/untag", () => {
    it("removes tags from a report definition", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tags/untag", {
        reportName: "test-report",
        tagKeys: ["env"],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.untagged).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("UntagResourceCommand");
      expect(mockSend.mock.calls[0][0].ReportName).toBe("test-report");
    });

    it("returns 400 when reportName is missing", async () => {
      const res = await post("/tags/untag", { tagKeys: [] });
      expect(res.status).toBe(400);
    });

    it("returns 400 when tagKeys is missing", async () => {
      const res = await post("/tags/untag", { reportName: "test" });
      expect(res.status).toBe(400);
    });
  });
});
