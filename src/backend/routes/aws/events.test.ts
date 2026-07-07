import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockEBClient = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-eventbridge", () => ({
  EventBridgeClient: mockEBClient,
  ListEventBusesCommand: createCmd("ListEventBusesCommand"),
  CreateEventBusCommand: createCmd("CreateEventBusCommand"),
  DeleteEventBusCommand: createCmd("DeleteEventBusCommand"),
  DescribeEventBusCommand: createCmd("DescribeEventBusCommand"),
  ListRulesCommand: createCmd("ListRulesCommand"),
  PutRuleCommand: createCmd("PutRuleCommand"),
  DeleteRuleCommand: createCmd("DeleteRuleCommand"),
  DescribeRuleCommand: createCmd("DescribeRuleCommand"),
  EnableRuleCommand: createCmd("EnableRuleCommand"),
  DisableRuleCommand: createCmd("DisableRuleCommand"),
  ListTargetsByRuleCommand: createCmd("ListTargetsByRuleCommand"),
  PutTargetsCommand: createCmd("PutTargetsCommand"),
  RemoveTargetsCommand: createCmd("RemoveTargetsCommand"),
  PutEventsCommand: createCmd("PutEventsCommand"),
  ListArchivesCommand: createCmd("ListArchivesCommand"),
  CreateArchiveCommand: createCmd("CreateArchiveCommand"),
  DeleteArchiveCommand: createCmd("DeleteArchiveCommand"),
  DescribeArchiveCommand: createCmd("DescribeArchiveCommand"),
  ListReplaysCommand: createCmd("ListReplaysCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: vi.fn((Ctor: any) => new Ctor({})),
}));

import router from "./events";

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

beforeEach(() => {
  mockSend.mockReset();
});

describe("Events (EventBridge) Routes", () => {
  describe("Event Buses", () => {
    it("GET /buses — lists event buses", async () => {
      mockSend.mockResolvedValueOnce({
        EventBuses: [
          { Name: "default", Arn: "arn:aws:events:us-east-1:...:event-bus/default" },
        ],
      });
      const res = await get("/buses");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.eventBuses).toHaveLength(1);
      expect(body.eventBuses[0].Name).toBe("default");
    });

    it("GET /buses — handles missing EventBuses (|| [] branch)", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/buses");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.eventBuses).toEqual([]);
    });

    it("POST /buses — creates an event bus", async () => {
      mockSend.mockResolvedValueOnce({
        EventBusArn: "arn:aws:events:us-east-1:...:event-bus/custom",
      });
      const res = await post("/buses", { name: "custom", description: "Custom bus" });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.eventBusArn).toContain("custom");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.Name).toBe("custom");
    });

    it("POST /buses — 400 when name missing", async () => {
      const res = await post("/buses", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /buses — deletes an event bus", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/buses?name=custom");
      expect(res.status).toBe(200);
      expect((await res.json()).deleted).toBe(true);
    });

    it("DELETE /buses — 400 when name missing", async () => {
      const res = await del("/buses");
      expect(res.status).toBe(400);
    });
  });

  describe("Rules", () => {
    it("GET /rules — lists rules", async () => {
      mockSend.mockResolvedValueOnce({
        Rules: [{ Name: "my-rule", State: "ENABLED", EventBusName: "default" }],
      });
      const res = await get("/rules");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.rules).toHaveLength(1);
      expect(body.rules[0].Name).toBe("my-rule");
    });

    it("GET /rules — handles missing Rules (|| [] branch)", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/rules");
      expect(res.status).toBe(200);
      expect((await res.json()).rules).toEqual([]);
    });

    it("GET /rules?eventBusName= — filters by bus", async () => {
      mockSend.mockResolvedValueOnce({ Rules: [] });
      const res = await get("/rules?eventBusName=custom");
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.EventBusName).toBe("custom");
    });

    it("GET /rules — calls without eventBusName param (ternary else branch)", async () => {
      mockSend.mockResolvedValueOnce({ Rules: [] });
      const res = await get("/rules");
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      // When no eventBusName, the command is called with empty object {}
      expect(cmd.EventBusName).toBeUndefined();
    });

    it("POST /rules — creates a rule", async () => {
      mockSend.mockResolvedValueOnce({
        RuleArn: "arn:aws:events:...:rule/my-rule",
      });
      const res = await post("/rules", {
        name: "my-rule",
        eventBusName: "default",
        eventPattern: JSON.stringify({ source: ["my-app"] }),
        state: "ENABLED",
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.ruleArn).toContain("my-rule");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.Name).toBe("my-rule");
      expect(cmd.State).toBe("ENABLED");
    });

    it("DELETE /rules — deletes a rule", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/rules?name=my-rule");
      expect(res.status).toBe(200);
      expect((await res.json()).deleted).toBe(true);
    });

    it("DELETE /rules — without eventBusName (|| undefined branch)", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/rules?name=my-rule");
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.EventBusName).toBeUndefined();
    });

    it("DELETE /rules — 400 when name missing", async () => {
      const res = await del("/rules");
      expect(res.status).toBe(400);
    });

    it("POST /rules/enable — enables a rule", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/rules/enable", { name: "my-rule", eventBusName: "default" });
      expect(res.status).toBe(200);
      expect((await res.json()).enabled).toBe(true);
    });

    it("POST /rules/enable — 400 when name missing", async () => {
      const res = await post("/rules/enable", {});
      expect(res.status).toBe(400);
    });

    it("POST /rules/disable — disables a rule", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/rules/disable", { name: "my-rule", eventBusName: "default" });
      expect(res.status).toBe(200);
      expect((await res.json()).disabled).toBe(true);
    });

    it("POST /rules/disable — 400 when name missing", async () => {
      const res = await post("/rules/disable", {});
      expect(res.status).toBe(400);
    });
  });

  describe("Targets", () => {
    it("GET /targets — lists targets for a rule", async () => {
      mockSend.mockResolvedValueOnce({
        Targets: [{ Id: "target-1", Arn: "arn:aws:lambda:...:function:my-fn" }],
      });
      const res = await get("/targets?rule=my-rule&eventBusName=default");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.targets).toHaveLength(1);
    });

    it("GET /targets — handles missing Targets (|| [] branch)", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/targets?rule=my-rule");
      expect(res.status).toBe(200);
      expect((await res.json()).targets).toEqual([]);
    });

    it("GET /targets — without eventBusName (|| undefined branch)", async () => {
      mockSend.mockResolvedValueOnce({ Targets: [] });
      const res = await get("/targets?rule=my-rule");
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.EventBusName).toBeUndefined();
    });

    it("GET /targets — 400 when rule missing", async () => {
      const res = await get("/targets");
      expect(res.status).toBe(400);
    });

    it("POST /targets — puts targets for a rule", async () => {
      mockSend.mockResolvedValueOnce({ FailedEntryCount: 0 });
      const res = await post("/targets", {
        rule: "my-rule",
        eventBusName: "default",
        targets: [{ Id: "1", Arn: "arn:aws:lambda:...:function:my-fn" }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.failedEntries).toBe(0);
    });

    it("POST /targets — 400 when rule or targets missing", async () => {
      const res = await post("/targets", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /targets — removes targets", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/targets?rule=my-rule&ids=1,2&eventBusName=default");
      expect(res.status).toBe(200);
      expect((await res.json()).removed).toBe(true);
    });

    it("DELETE /targets — without eventBusName (|| undefined branch)", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/targets?rule=my-rule&ids=1,2");
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.EventBusName).toBeUndefined();
    });

    it("DELETE /targets — 400 when required params missing", async () => {
      const res = await del("/targets?rule=my-rule");
      expect(res.status).toBe(400);
    });
  });

  describe("Put Events", () => {
    it("POST /put-events — sends events", async () => {
      mockSend.mockResolvedValueOnce({
        FailedEntryCount: 0,
        Entries: [{ EventId: "evt-001" }],
      });
      const res = await post("/put-events", {
        entries: [
          {
            Source: "my-app",
            DetailType: "test",
            Detail: JSON.stringify({ key: "value" }),
          },
        ],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.failedCount).toBe(0);
      expect(body.entries[0].EventId).toBe("evt-001");
    });

    it("POST /put-events — handles missing fields (|| 0 and || [] branches)", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/put-events", { entries: [] });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.failedCount).toBe(0);
      expect(body.entries).toEqual([]);
    });
  });

  describe("Archives", () => {
    it("GET /archives — lists archives", async () => {
      mockSend.mockResolvedValueOnce({
        Archives: [
          { ArchiveName: "my-archive", EventSourceArn: "arn:aws:events:...:event-bus/default", State: "ENABLED" },
        ],
      });
      const res = await get("/archives");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.archives).toHaveLength(1);
    });

    it("GET /archives — handles missing Archives (|| [] branch)", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/archives");
      expect(res.status).toBe(200);
      expect((await res.json()).archives).toEqual([]);
    });

    it("POST /archives — creates an archive", async () => {
      mockSend.mockResolvedValueOnce({
        ArchiveArn: "arn:aws:events:...:archive/my-archive",
        State: "ENABLED",
      });
      const res = await post("/archives", {
        archiveName: "my-archive",
        eventSourceArn: "arn:aws:events:...:event-bus/default",
        retentionDays: 30,
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.archiveArn).toContain("my-archive");
    });

    it("DELETE /archives — deletes an archive", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/archives?name=my-archive");
      expect(res.status).toBe(200);
      expect((await res.json()).deleted).toBe(true);
    });
  });

  describe("Replays", () => {
    it("GET /replays — lists replays", async () => {
      mockSend.mockResolvedValueOnce({ Replays: [] });
      const res = await get("/replays");
      expect(res.status).toBe(200);
      expect((await res.json()).replays).toEqual([]);
    });

    it("GET /replays — handles missing Replays (|| [] branch)", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/replays");
      expect(res.status).toBe(200);
      expect((await res.json()).replays).toEqual([]);
    });
  });
});
