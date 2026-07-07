import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockLogs = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-cloudwatch-logs", () => ({
  CloudWatchLogsClient: mockLogs,
  DescribeLogGroupsCommand: createCmd("DescribeLogGroupsCommand"),
  CreateLogGroupCommand: createCmd("CreateLogGroupCommand"),
  DeleteLogGroupCommand: createCmd("DeleteLogGroupCommand"),
  PutRetentionPolicyCommand: createCmd("PutRetentionPolicyCommand"),
  DeleteRetentionPolicyCommand: createCmd("DeleteRetentionPolicyCommand"),
  DescribeLogStreamsCommand: createCmd("DescribeLogStreamsCommand"),
  CreateLogStreamCommand: createCmd("CreateLogStreamCommand"),
  DeleteLogStreamCommand: createCmd("DeleteLogStreamCommand"),
  GetLogEventsCommand: createCmd("GetLogEventsCommand"),
  PutLogEventsCommand: createCmd("PutLogEventsCommand"),
  FilterLogEventsCommand: createCmd("FilterLogEventsCommand"),
  PutSubscriptionFilterCommand: createCmd("PutSubscriptionFilterCommand"),
  DescribeSubscriptionFiltersCommand: createCmd("DescribeSubscriptionFiltersCommand"),
  DeleteSubscriptionFilterCommand: createCmd("DeleteSubscriptionFilterCommand"),
  TagLogGroupCommand: createCmd("TagLogGroupCommand"),
  UntagLogGroupCommand: createCmd("UntagLogGroupCommand"),
  ListTagsLogGroupCommand: createCmd("ListTagsLogGroupCommand"),
}));

vi.mock("../../clients/aws", () => ({
  getAwsConfig: () => ({
    endpoint: "http://localhost:4566",
    region: "us-east-1",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  }),
}));

import router from "./logs";

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

describe("CloudWatch Logs Routes", () => {
  describe("Log Groups", () => {
    it("GET /log-groups — lists log groups", async () => {
      mockSend.mockResolvedValueOnce({
        logGroups: [
          { logGroupName: "/aws/lambda/my-func", creationTime: 1000, arn: "arn:aws:logs:us-east-1::log-group:/aws/lambda/my-func", retentionInDays: 14, storedBytes: 0 },
        ],
      });
      const res = await get("/log-groups");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.logGroups[0].logGroupName).toBe("/aws/lambda/my-func");
    });

    it("GET /log-groups — supports prefix query param", async () => {
      mockSend.mockResolvedValueOnce({ logGroups: [] });
      const res = await get("/log-groups?prefix=/aws/lambda");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].logGroupNamePrefix).toBe("/aws/lambda");
    });

    it("GET /log-groups — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ logGroups: [] });
      const res = await get("/log-groups");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("POST /log-groups — creates a log group", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/log-groups", { logGroupName: "/aws/lambda/my-func" });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(mockSend.mock.calls[0][0].logGroupName).toBe("/aws/lambda/my-func");
    });

    it("POST /log-groups — creates a log group with tags and kmsKeyId", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/log-groups", {
        logGroupName: "/aws/lambda/encrypted",
        tags: { env: "prod" },
        kmsKeyId: "arn:aws:kms:...:key/1234",
      });
      expect(res.status).toBe(201);
      expect(mockSend.mock.calls[0][0].tags).toEqual({ env: "prod" });
      expect(mockSend.mock.calls[0][0].kmsKeyId).toBe("arn:aws:kms:...:key/1234");
    });

    it("POST /log-groups — returns 400 without name", async () => {
      const res = await post("/log-groups", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /log-groups/:name — deletes a log group", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/log-groups/%2Faws%2Flambda%2Fmy-func");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });

    it("PUT /log-groups/:name/retention — sets retention policy", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/log-groups/%2Faws%2Flambda%2Fmy-func/retention", { retentionInDays: 30 });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend.mock.calls[0][0].retentionInDays).toBe(30);
    });

    it("PUT /log-groups/:name/retention — 400 without retentionInDays", async () => {
      const res = await put("/log-groups/%2Faws%2Flambda%2Fmy-func/retention", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /log-groups/:name/retention — removes retention policy", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/log-groups/%2Faws%2Flambda%2Fmy-func/retention");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.retentionRemoved).toBe(true);
    });
  });

  describe("Log Streams", () => {
    it("GET /log-groups/:name/streams — lists streams", async () => {
      mockSend.mockResolvedValueOnce({
        logStreams: [
          { logStreamName: "2025/01/01/stream-1", creationTime: 1000, storedBytes: 0 },
        ],
      });
      const res = await get("/log-groups/%2Faws%2Flambda%2Fmy-func/streams");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.logStreams[0].logStreamName).toBe("2025/01/01/stream-1");
    });

    it("GET /log-groups/:name/streams — supports prefix query param", async () => {
      mockSend.mockResolvedValueOnce({ logStreams: [] });
      const res = await get("/log-groups/%2Faws%2Flambda%2Fmy-func/streams?prefix=2025");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].logStreamNamePrefix).toBe("2025");
    });

    it("POST /log-groups/:name/streams — creates a stream", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/log-groups/%2Faws%2Flambda%2Fmy-func/streams", { logStreamName: "stream-1" });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
    });

    it("POST /log-groups/:name/streams — 400 without logStreamName", async () => {
      const res = await post("/log-groups/%2Faws%2Flambda%2Fmy-func/streams", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /log-groups/:name/streams/:stream — deletes a stream", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/log-groups/%2Faws%2Flambda%2Fmy-func/streams/stream-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Log Events", () => {
    it("GET /log-groups/:name/streams/:stream/events — gets events", async () => {
      mockSend.mockResolvedValueOnce({
        events: [{ eventId: "evt-1", timestamp: 1000, message: "Hello", ingestionTime: 1001 }],
        nextForwardToken: "fwd",
        nextBackwardToken: "bwd",
      });
      const res = await get("/log-groups/%2Faws%2Flambda%2Fmy-func/streams/stream-1/events");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.events).toHaveLength(1);
      expect(body.events[0].message).toBe("Hello");
      expect(body.nextForwardToken).toBe("fwd");
    });

    it("GET /log-groups/:name/streams/:stream/events — with query params", async () => {
      mockSend.mockResolvedValueOnce({
        events: [],
        nextForwardToken: "fwd2",
        nextBackwardToken: "bwd2",
      });
      const res = await get("/log-groups/%2Faws%2Flambda%2Fmy-func/streams/stream-1/events?startTime=1000&endTime=2000&limit=10&nextToken=abc&startFromHead=true");
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.startTime).toBe(1000);
      expect(cmd.endTime).toBe(2000);
      expect(cmd.limit).toBe(10);
      expect(cmd.nextToken).toBe("abc");
      expect(cmd.startFromHead).toBe(true);
    });

    it("POST /log-groups/:name/streams/:stream/events — puts events", async () => {
      mockSend.mockResolvedValueOnce({ nextSequenceToken: "token-1" });
      const res = await post("/log-groups/%2Faws%2Flambda%2Fmy-func/streams/stream-1/events", { logEvents: [{ timestamp: Date.now(), message: "Hello" }] });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.nextSequenceToken).toBe("token-1");
    });

    it("POST /log-groups/:name/streams/:stream/events — with sequenceToken", async () => {
      mockSend.mockResolvedValueOnce({ nextSequenceToken: "token-2" });
      const res = await post("/log-groups/%2Faws%2Flambda%2Fmy-func/streams/stream-1/events", {
        logEvents: [{ timestamp: Date.now(), message: "Hello again" }],
        sequenceToken: "token-1",
      });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].sequenceToken).toBe("token-1");
    });

    it("POST /log-groups/:name/streams/:stream/events — returns 400 without events", async () => {
      const res = await post("/log-groups/%2Faws%2Flambda%2Fmy-func/streams/stream-1/events", {});
      expect(res.status).toBe(400);
    });

    it("POST /log-groups/:name/filter-events — filters events across streams", async () => {
      mockSend.mockResolvedValueOnce({
        events: [{ eventId: "evt-1", timestamp: 1000, message: "ERROR", logStreamName: "stream-1" }],
        searchedLogStreams: [],
        nextToken: undefined,
      });
      const res = await post("/log-groups/%2Faws%2Flambda%2Fmy-func/filter-events", { filterPattern: "ERROR" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.events).toHaveLength(1);
      expect(body.events[0].message).toBe("ERROR");
    });

    it("POST /log-groups/:name/filter-events — with all optional params", async () => {
      mockSend.mockResolvedValueOnce({
        events: [],
        searchedLogStreams: [],
        nextToken: undefined,
      });
      const res = await post("/log-groups/%2Faws%2Flambda%2Fmy-func/filter-events", {
        filterPattern: "ERROR",
        startTime: 1000,
        endTime: 2000,
        limit: 50,
        logStreamNames: ["stream-1"],
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.logGroupName).toBe("/aws/lambda/my-func");
      expect(cmd.filterPattern).toBe("ERROR");
      expect(cmd.startTime).toBe(1000);
      expect(cmd.endTime).toBe(2000);
      expect(cmd.limit).toBe(50);
      expect(cmd.logStreamNames).toEqual(["stream-1"]);
    });
  });

  describe("Subscription Filters", () => {
    it("GET /log-groups/:name/subscription-filters — lists filters", async () => {
      mockSend.mockResolvedValueOnce({
        subscriptionFilters: [{ filterName: "my-filter", destinationArn: "arn:aws:lambda:...", filterPattern: "" }],
      });
      const res = await get("/log-groups/%2Faws%2Flambda%2Fmy-func/subscription-filters");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.subscriptionFilters[0].filterName).toBe("my-filter");
    });

    it("POST /log-groups/:name/subscription-filters — creates a filter", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/log-groups/%2Faws%2Flambda%2Fmy-func/subscription-filters", { filterName: "my-filter", destinationArn: "arn:aws:lambda:..." });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
    });

    it("POST /log-groups/:name/subscription-filters — 400 when filterName missing", async () => {
      const res = await post("/log-groups/%2Faws%2Flambda%2Fmy-func/subscription-filters", { destinationArn: "arn:aws:lambda:..." });
      expect(res.status).toBe(400);
    });

    it("POST /log-groups/:name/subscription-filters — 400 when destinationArn missing", async () => {
      const res = await post("/log-groups/%2Faws%2Flambda%2Fmy-func/subscription-filters", { filterName: "my-filter" });
      expect(res.status).toBe(400);
    });

    it("POST /log-groups/:name/subscription-filters — with optional roleArn and distribution", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/log-groups/%2Faws%2Flambda%2Fmy-func/subscription-filters", {
        filterName: "my-filter",
        destinationArn: "arn:aws:lambda:...",
        filterPattern: "ERROR",
        distribution: "Random",
        roleArn: "arn:aws:iam:...:role/logs",
      });
      expect(res.status).toBe(201);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.filterPattern).toBe("ERROR");
      expect(cmd.distribution).toBe("Random");
      expect(cmd.roleArn).toBe("arn:aws:iam:...:role/logs");
    });

    it("DELETE /log-groups/:name/subscription-filters/:filterName — deletes a filter", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/log-groups/%2Faws%2Flambda%2Fmy-func/subscription-filters/my-filter");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Tags", () => {
    it("GET /log-groups/:name/tags — lists tags", async () => {
      mockSend.mockResolvedValueOnce({ tags: { env: "prod" } });
      const res = await get("/log-groups/%2Faws%2Flambda%2Fmy-func/tags");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags.env).toBe("prod");
    });

    it("POST /log-groups/:name/tags — adds tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/log-groups/%2Faws%2Flambda%2Fmy-func/tags", { tags: { env: "prod" } });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
    });

    it("DELETE /log-groups/:name/tags — removes tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const resDel = await router.request("/log-groups/%2Faws%2Flambda%2Fmy-func/tags", {
        method: "DELETE",
        body: JSON.stringify({ tags: ["env"] }),
        headers: { "content-type": "application/json" },
      });
      expect(resDel.status).toBe(200);
      const body = await resDel.json();
      expect(body.updated).toBe(true);
    });
  });
});
