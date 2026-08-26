import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-kinesis-analytics-v2", () => ({
  KinesisAnalyticsV2Client: vi.fn(function () {
    return { send: mockSend };
  }),
  ListApplicationsCommand: createCmd("ListApplicationsCommand"),
  DescribeApplicationCommand: createCmd("DescribeApplicationCommand"),
  CreateApplicationCommand: createCmd("CreateApplicationCommand"),
  UpdateApplicationCommand: createCmd("UpdateApplicationCommand"),
  DeleteApplicationCommand: createCmd("DeleteApplicationCommand"),
  StartApplicationCommand: createCmd("StartApplicationCommand"),
  StopApplicationCommand: createCmd("StopApplicationCommand"),
  CreateApplicationSnapshotCommand: createCmd("CreateApplicationSnapshotCommand"),
  DescribeApplicationSnapshotCommand: createCmd("DescribeApplicationSnapshotCommand"),
  ListApplicationSnapshotsCommand: createCmd("ListApplicationSnapshotsCommand"),
  DeleteApplicationSnapshotCommand: createCmd("DeleteApplicationSnapshotCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./kinesisanalytics";

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

async function delWithBody(path: string, body?: any) {
  return router.request(path, {
    method: "DELETE",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Kinesis Analytics V2 Routes", () => {
  describe("Applications", () => {
    it("GET /applications — lists summaries", async () => {
      mockSend.mockResolvedValueOnce({
        ApplicationSummaries: [{ ApplicationName: "app-1", ApplicationStatus: "RUNNING", RuntimeEnvironment: "FLINK-1_19" }],
      });
      const res = await get("/applications");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.applications[0].ApplicationName).toBe("app-1");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListApplicationsCommand");
    });

    it("GET /applications — empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/applications");
      const body = await res.json();
      expect(body).toEqual({ applications: [], total: 0 });
    });

    it("GET /applications/:name — maps detail fields", async () => {
      mockSend.mockResolvedValueOnce({
        ApplicationDetail: {
          ApplicationName: "app-1",
          ApplicationARN: "arn:app-1",
          ApplicationStatus: "RUNNING",
          ApplicationVersionId: 3,
          RuntimeEnvironment: "FLINK-1_19",
          ApplicationDescription: "test",
          ServiceExecutionRole: "arn:role",
          ApplicationConfiguration: {
            FlinkApplicationConfiguration: {
              ParallelismConfiguration: { Parallelism: 4 },
            },
            ApplicationCodeConfiguration: {
              CodeContent: {
                S3ContentLocation: { BucketARN: "arn:bucket", FileKey: "app.jar" },
              },
            },
          },
        },
      });
      const res = await get("/applications/app-1");
      const body = await res.json();
      expect(body.application).toEqual({
        name: "app-1",
        arn: "arn:app-1",
        status: "RUNNING",
        versionId: 3,
        runtimeEnvironment: "FLINK-1_19",
        applicationMode: undefined,
        description: "test",
        serviceExecutionRole: "arn:role",
        parallelism: 4,
        codeLocation: { bucketArn: "arn:bucket", fileKey: "app.jar" },
      });
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DescribeApplicationCommand");
    });

    it("GET /applications/:name — null when sparse", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/applications/none");
      expect((await res.json()).application).toBeNull();
    });

    it("GET /applications/:name — null codeLocation when no app config", async () => {
      mockSend.mockResolvedValueOnce({
        ApplicationDetail: { ApplicationName: "app-1" },
      });
      const res = await get("/applications/app-1");
      const body = await res.json();
      expect(body.application.codeLocation).toBeNull();
    });

    it("POST /applications — creates with code + parallelism", async () => {
      mockSend.mockResolvedValueOnce({ ApplicationDetail: { ApplicationName: "app-1" } });
      const res = await post("/applications", {
        name: "app-1",
        runtimeEnvironment: "FLINK-1_19",
        serviceExecutionRole: "arn:role",
        description: "test app",
        codeBucket: "arn:bucket",
        codeKey: "app.jar",
        parallelism: 2,
      });
      expect(res.status).toBe(201);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("CreateApplicationCommand");
      expect(cmd.ApplicationName).toBe("app-1");
      expect(cmd.ApplicationConfiguration.ApplicationCodeConfiguration.CodeContent.S3ContentLocation.FileKey).toBe("app.jar");
      expect(cmd.ApplicationConfiguration.FlinkApplicationConfiguration.ParallelismConfiguration.Parallelism).toBe(2);
    });

    it("POST /applications — minimal create without code", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/applications", {
        name: "app-1",
        runtimeEnvironment: "FLINK-1_19",
        serviceExecutionRole: "arn:role",
      });
      expect(res.status).toBe(201);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.ApplicationConfiguration).toBeUndefined();
    });

    it("POST /applications — bucket without key omits CodeContentType", async () => {
      mockSend.mockResolvedValueOnce({});
      await post("/applications", {
        name: "a",
        runtimeEnvironment: "FLINK-1_19",
        serviceExecutionRole: "r",
        codeBucket: "arn:bucket",
      });
      expect(mockSend.mock.calls[0][0].ApplicationConfiguration.ApplicationCodeConfiguration.CodeContentType).toBeUndefined();
    });

    it("POST /applications — code without parallelism omits Flink config", async () => {
      mockSend.mockResolvedValueOnce({});
      await post("/applications", {
        name: "a",
        runtimeEnvironment: "FLINK-1_19",
        serviceExecutionRole: "r",
        codeBucket: "arn:bucket",
        codeKey: "app.jar",
      });
      expect(mockSend.mock.calls[0][0].ApplicationConfiguration.FlinkApplicationConfiguration).toBeUndefined();
    });

    it("POST /applications — 400s for missing fields", async () => {
      expect((await post("/applications", {})).status).toBe(400);
      expect((await post("/applications", { name: "a" })).status).toBe(400);
      expect((await post("/applications", { name: "a", runtimeEnvironment: "FLINK-1_19" })).status).toBe(400);
    });

    it("PUT /applications/:name — updates parallelism", async () => {
      mockSend.mockResolvedValueOnce({ ApplicationDetail: { ApplicationName: "app-1" } });
      const res = await put("/applications/app-1", { parallelism: 8 });
      const body = await res.json();
      expect(body.application.ApplicationName).toBe("app-1");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("UpdateApplicationCommand");
      expect(cmd.ApplicationConfigurationUpdate.FlinkApplicationConfigurationUpdate.ParallelismConfigurationUpdate.ParallelismUpdate).toBe(8);
    });

    it("PUT /applications/:name — null detail on sparse", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/applications/app-1", {});
      expect((await res.json()).application).toBeNull();
    });

    it("DELETE /applications/:name — requires createTimestamp", async () => {
      const res = await delWithBody("/applications/app-1");
      expect(res.status).toBe(400);
    });

    it("DELETE /applications/:name — deletes with epoch timestamp", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await delWithBody("/applications/app-1?createTimestamp=1700000000");
      expect(res.status).toBe(200);
      expect((await res.json()).deleted).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("DeleteApplicationCommand");
      expect(cmd.CreateTimestamp.getTime()).toBe(1700000000000);
    });

    it("POST /applications/:name/start — starts", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/applications/app-1/start");
      expect((await res.json()).started).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("StartApplicationCommand");
    });

    it("POST /applications/:name/stop — stops", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/applications/app-1/stop");
      expect((await res.json()).stopped).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("StopApplicationCommand");
    });
  });

  describe("Snapshots", () => {
    it("GET /applications/:name/snapshots — lists", async () => {
      mockSend.mockResolvedValueOnce({
        SnapshotSummaries: [{ SnapshotName: "snap-1", SnapshotStatus: "CREATING" }],
      });
      const res = await get("/applications/app-1/snapshots");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListApplicationSnapshotsCommand");
    });

    it("GET /applications/:name/snapshots — empty", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/applications/app-1/snapshots");
      const body = await res.json();
      expect(body).toEqual({ snapshots: [], total: 0 });
    });

    it("POST /applications/:name/snapshots — creates with 400 guard", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/applications/app-1/snapshots", { snapshotName: "snap-1" });
      expect(res.status).toBe(201);
      expect(mockSend.mock.calls[0][0].SnapshotName).toBe("snap-1");

      const res400 = await post("/applications/app-1/snapshots", {});
      expect(res400.status).toBe(400);
    });

    it("GET /applications/:name/snapshots/:snapshot — describes", async () => {
      mockSend.mockResolvedValueOnce({ SnapshotDetails: { SnapshotName: "snap-1", SnapshotStatus: "READY" } });
      const res = await get("/applications/app-1/snapshots/snap-1");
      const body = await res.json();
      expect(body.snapshot.SnapshotStatus).toBe("READY");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DescribeApplicationSnapshotCommand");
    });

    it("GET /applications/:name/snapshots/:snapshot — null on sparse", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/applications/app-1/snapshots/snap-1");
      expect((await res.json()).snapshot).toBeNull();
    });

    it("DELETE /applications/:name/snapshots/:snapshot — optional timestamp", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await delWithBody("/applications/app-1/snapshots/snap-1?snapshotCreationTimestamp=1700000000");
      expect((await res.json()).deleted).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("DeleteApplicationSnapshotCommand");
      expect(cmd.SnapshotCreationTimestamp.getTime()).toBe(1700000000000);
    });

    it("DELETE /applications/:name/snapshots/:snapshot — without timestamp", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await delWithBody("/applications/app-1/snapshots/snap-1");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].SnapshotCreationTimestamp).toBeUndefined();
    });
  });

  describe("Tags", () => {
    it("GET /applications/:name/tags — maps tags with arn", async () => {
      mockSend.mockResolvedValueOnce({ Tags: [{ Key: "env", Value: "prod" }] });
      const res = await get("/applications/app-1/tags?arn=arn:app-1");
      const body = await res.json();
      expect(body.tags).toEqual([{ key: "env", value: "prod" }]);
      expect(mockSend.mock.calls[0][0].ResourceARN).toBe("arn:app-1");
    });

    it("GET /applications/:name/tags — sparse + 400", async () => {
      mockSend.mockResolvedValueOnce({});
      expect((await (await get("/applications/app-1/tags?arn=x")).json()).tags).toEqual([]);
      expect((await get("/applications/app-1/tags")).status).toBe(400);
    });

    it("POST /applications/:name/tags — adds tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/applications/app-1/tags?arn=arn:x", { tags: { env: "prod" } });
      expect((await res.json()).tagged).toBe(true);
      expect(mockSend.mock.calls[0][0].Tags).toEqual([{ Key: "env", Value: "prod" }]);
    });

    it("POST /applications/:name/tags — 400s", async () => {
      expect((await post("/applications/app-1/tags", { tags: { a: "b" } })).status).toBe(400);
      expect((await post("/applications/app-1/tags?arn=x", {})).status).toBe(400);
      expect((await post("/applications/app-1/tags?arn=x", { tags: {} })).status).toBe(400);
    });

    it("DELETE /applications/:name/tags — removes tag keys", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await delWithBody("/applications/app-1/tags?arn=arn:x", { tagKeys: ["env"] });
      expect((await res.json()).untagged).toBe(true);
      expect(mockSend.mock.calls[0][0].TagKeys).toEqual(["env"]);
    });

    it("DELETE /applications/:name/tags — 400s", async () => {
      expect((await delWithBody("/applications/app-1/tags", { tagKeys: ["a"] })).status).toBe(400);
      expect((await delWithBody("/applications/app-1/tags?arn=x", {})).status).toBe(400);
      expect((await delWithBody("/applications/app-1/tags?arn=x", { tagKeys: [] })).status).toBe(400);
    });
  });
});
