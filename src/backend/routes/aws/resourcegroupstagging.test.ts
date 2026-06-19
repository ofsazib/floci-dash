import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockRGT = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-resource-groups-tagging-api", () => ({
  ResourceGroupsTaggingAPIClient: mockRGT,
  GetResourcesCommand: createCmd("GetResourcesCommand"),
  TagResourcesCommand: createCmd("TagResourcesCommand"),
  UntagResourcesCommand: createCmd("UntagResourcesCommand"),
  GetTagKeysCommand: createCmd("GetTagKeysCommand"),
  GetTagValuesCommand: createCmd("GetTagValuesCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./resourcegroupstagging";

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

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("Resource Groups Tagging Routes", () => {
  describe("GET /resources", () => {
    it("returns tagged resources", async () => {
      mockSend.mockResolvedValueOnce({
        ResourceTagMappingList: [
          { ResourceARN: "arn:aws:s3:::my-bucket", Tags: [{ Key: "env", Value: "prod" }] },
        ],
        PaginationToken: "token1",
      });
      const res = await get("/resources");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.resourceTagMappingList).toHaveLength(1);
      expect(body.paginationToken).toBe("token1");
      expect(body.total).toBe(1);
    });

    it("returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ ResourceTagMappingList: [] });
      const res = await get("/resources");
      const body = await res.json();
      expect(body.resourceTagMappingList).toEqual([]);
      expect(body.total).toBe(0);
    });
  });

  describe("POST /tag", () => {
    const validBody = {
      resourceARNList: ["arn:aws:s3:::my-bucket"],
      tags: { env: "prod" },
    };

    it("tags resources", async () => {
      mockSend.mockResolvedValueOnce({ FailedResourcesMap: {} });
      const res = await post("/tag", validBody);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.failedResourcesMap).toEqual({});
    });

    it("returns 400 when resourceARNList is missing", async () => {
      const res = await post("/tag", { tags: { env: "prod" } });
      expect(res.status).toBe(400);
    });

    it("returns 400 when tags is missing", async () => {
      const res = await post("/tag", { resourceARNList: ["arn:aws:s3:::my-bucket"] });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /untag", () => {
    const validBody = {
      resourceARNList: ["arn:aws:s3:::my-bucket"],
      tagKeys: ["env"],
    };

    it("untags resources", async () => {
      mockSend.mockResolvedValueOnce({ FailedResourcesMap: {} });
      const res = await post("/untag", validBody);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.failedResourcesMap).toEqual({});
    });

    it("returns 400 when resourceARNList is missing", async () => {
      const res = await post("/untag", { tagKeys: ["env"] });
      expect(res.status).toBe(400);
    });

    it("returns 400 when tagKeys is missing", async () => {
      const res = await post("/untag", { resourceARNList: ["arn:aws:s3:::my-bucket"] });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /tag-keys", () => {
    it("returns tag keys", async () => {
      mockSend.mockResolvedValueOnce({
        TagKeys: ["Environment", "Project"],
        PaginationToken: "token1",
      });
      const res = await get("/tag-keys");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tagKeys).toEqual(["Environment", "Project"]);
      expect(body.total).toBe(2);
    });

    it("returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ TagKeys: [] });
      const res = await get("/tag-keys");
      const body = await res.json();
      expect(body.tagKeys).toEqual([]);
      expect(body.total).toBe(0);
    });
  });

  describe("GET /tag-values", () => {
    it("returns tag values", async () => {
      mockSend.mockResolvedValueOnce({
        TagValues: ["prod", "staging"],
        PaginationToken: "token1",
      });
      const res = await get("/tag-values?key=Environment");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tagValues).toEqual(["prod", "staging"]);
      expect(body.total).toBe(2);
    });

    it("returns 400 when key is missing", async () => {
      const res = await get("/tag-values");
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("key query param is required");
    });

    it("returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ TagValues: [] });
      const res = await get("/tag-values?key=Environment");
      const body = await res.json();
      expect(body.tagValues).toEqual([]);
      expect(body.total).toBe(0);
    });
  });
});
