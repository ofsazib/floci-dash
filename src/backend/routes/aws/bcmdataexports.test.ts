import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockBCM = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-bcm-data-exports", () => ({
  BCMDataExportsClient: mockBCM,
  ListExportsCommand: createCmd("ListExportsCommand"),
  CreateExportCommand: createCmd("CreateExportCommand"),
  GetExportCommand: createCmd("GetExportCommand"),
  UpdateExportCommand: createCmd("UpdateExportCommand"),
  DeleteExportCommand: createCmd("DeleteExportCommand"),
  ListExecutionsCommand: createCmd("ListExecutionsCommand"),
  GetExecutionCommand: createCmd("GetExecutionCommand"),
  ListTablesCommand: createCmd("ListTablesCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./bcmdataexports";

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
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("BCM Data Exports routes", () => {
  describe("Exports", () => {
    it("GET /exports — lists exports", async () => {
      mockSend.mockResolvedValueOnce({ Exports: [{ ExportArn: "arn:1", Name: "export1" }] });
      const res = await get("/exports");
      const json = await res.json();
      expect(json.exports).toHaveLength(1);
      expect(json.total).toBe(1);
      expect(json.exports[0].Name).toBe("export1");
    });

    it("GET /exports — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/exports");
      const json = await res.json();
      expect(json.exports).toEqual([]);
      expect(json.total).toBe(0);
    });

    it("POST /exports — creates export", async () => {
      mockSend.mockResolvedValueOnce({ ExportArn: "arn:new", created: true });
      const res = await post("/exports", { Export: { Name: "new-export" } });
      const json = await res.json();
      expect(json.created).toBe(true);
      expect(json.exportArn).toBe("arn:new");
      expect(res.status).toBe(201);
    });

    it("POST /exports — 400 when Export.Name missing", async () => {
      const res = await post("/exports", {});
      expect(res.status).toBe(400);
    });

    it("GET /exports/:exportArn — gets single export", async () => {
      mockSend.mockResolvedValueOnce({ Export: { ExportArn: "arn:1", Name: "export1" } });
      const res = await get("/exports/arn%3Aexport1");
      const json = await res.json();
      expect(json.export.Name).toBe("export1");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetExportCommand");
    });

    it("PUT /exports/:exportArn — updates export", async () => {
      mockSend.mockResolvedValueOnce({ ExportArn: "arn:1" });
      const res = await put("/exports/arn%3Aexport1", { Export: { Name: "updated" } });
      const json = await res.json();
      expect(json.exportArn).toBe("arn:1");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateExportCommand");
    });

    it("DELETE /exports/:exportArn — deletes export", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/exports/arn%3Aexport1");
      const json = await res.json();
      expect(json.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteExportCommand");
    });
  });

  describe("Executions", () => {
    it("GET /exports/:exportArn/executions — lists executions", async () => {
      mockSend.mockResolvedValueOnce({ Executions: [{ ExecutionId: "exec-1" }] });
      const res = await get("/exports/arn%3Aexport1/executions");
      const json = await res.json();
      expect(json.executions).toHaveLength(1);
      expect(json.total).toBe(1);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListExecutionsCommand");
    });

    it("GET /exports/:exportArn/executions — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/exports/arn%3Aexport1/executions");
      const json = await res.json();
      expect(json.executions).toEqual([]);
      expect(json.total).toBe(0);
    });
  });

  describe("Tables", () => {
    it("GET /tables — lists tables", async () => {
      mockSend.mockResolvedValueOnce({ Tables: [{ TableName: "table1" }] });
      const res = await get("/tables");
      const json = await res.json();
      expect(json.tables).toHaveLength(1);
      expect(json.total).toBe(1);
    });

    it("GET /tables — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/tables");
      const json = await res.json();
      expect(json.tables).toEqual([]);
      expect(json.total).toBe(0);
    });
  });

  describe("Tags", () => {
    it("GET /tags — lists tags", async () => {
      mockSend.mockResolvedValueOnce({ ResourceTags: [{ Key: "env", Value: "prod" }] });
      const res = await get("/tags?resourceArn=arn:export1");
      const json = await res.json();
      expect(json.tags).toHaveLength(1);
    });

    it("GET /tags — 400 when no resourceArn", async () => {
      const res = await get("/tags");
      expect(res.status).toBe(400);
    });

    it("POST /tags — tags resource", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tags", { resourceArn: "arn:1", tags: [{ Key: "env", Value: "prod" }] });
      const json = await res.json();
      expect(json.tagged).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("TagResourceCommand");
    });

    it("POST /tags — 400 when missing params", async () => {
      const res = await post("/tags", {});
      expect(res.status).toBe(400);
    });

    it("POST /tags/untag — untags resource", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tags/untag", { resourceArn: "arn:1", tagKeys: ["env"] });
      const json = await res.json();
      expect(json.untagged).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("UntagResourceCommand");
    });

    it("POST /tags/untag — 400 when missing params", async () => {
      const res = await post("/tags/untag", {});
      expect(res.status).toBe(400);
    });
  });
});
