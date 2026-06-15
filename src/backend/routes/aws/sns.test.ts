import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());
const mockFlociFetch = vi.hoisted(() => vi.fn());

const mockSNSClient = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-sns", () => ({
  SNSClient: mockSNSClient,
  ListTopicsCommand: createCmd("ListTopicsCommand"),
  CreateTopicCommand: createCmd("CreateTopicCommand"),
  DeleteTopicCommand: createCmd("DeleteTopicCommand"),
  GetTopicAttributesCommand: createCmd("GetTopicAttributesCommand"),
  SetTopicAttributesCommand: createCmd("SetTopicAttributesCommand"),
  ListSubscriptionsCommand: createCmd("ListSubscriptionsCommand"),
  ListSubscriptionsByTopicCommand: createCmd("ListSubscriptionsByTopicCommand"),
  SubscribeCommand: createCmd("SubscribeCommand"),
  UnsubscribeCommand: createCmd("UnsubscribeCommand"),
  PublishCommand: createCmd("PublishCommand"),
  PublishBatchCommand: createCmd("PublishBatchCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  ListPlatformApplicationsCommand: createCmd("ListPlatformApplicationsCommand"),
  CreatePlatformApplicationCommand: createCmd("CreatePlatformApplicationCommand"),
  DeletePlatformApplicationCommand: createCmd("DeletePlatformApplicationCommand"),
  ListEndpointsByPlatformApplicationCommand: createCmd("ListEndpointsByPlatformApplicationCommand"),
  CreatePlatformEndpointCommand: createCmd("CreatePlatformEndpointCommand"),
  DeleteEndpointCommand: createCmd("DeleteEndpointCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: vi.fn((Ctor: any) => new Ctor({})),
}));

vi.mock("../../clients/floci", () => ({
  flociFetch: mockFlociFetch,
}));

import router from "./sns";

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
  mockFlociFetch.mockReset();
});

describe("SNS Routes", () => {
  describe("Topics", () => {
    it("GET /topics — lists topics", async () => {
      mockSend.mockResolvedValueOnce({
        Topics: [
          { TopicArn: "arn:aws:sns:us-east-1:000000000000:my-topic" },
        ],
      });
      const res = await get("/topics");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.topics).toHaveLength(1);
      expect(body.topics[0].TopicArn).toContain("my-topic");
    });

    it("GET /topics — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ Topics: [] });
      const res = await get("/topics");
      const body = await res.json();
      expect(body.topics).toEqual([]);
    });

    it("POST /topics — creates a topic", async () => {
      mockSend.mockResolvedValueOnce({
        TopicArn: "arn:aws:sns:us-east-1:000000000000:new-topic",
      });
      const res = await post("/topics", {
        name: "new-topic",
        attributes: { DisplayName: "test" },
        tags: [{ Key: "env", Value: "prod" }],
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.topicArn).toContain("new-topic");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.Name).toBe("new-topic");
    });

    it("DELETE /topics — deletes a topic", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del(
        "/topics?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"
      );
      expect(res.status).toBe(200);
      expect((await res.json()).deleted).toBe(true);
    });

    it("DELETE /topics — 400 when topicArn missing", async () => {
      const res = await del("/topics");
      expect(res.status).toBe(400);
    });

    it("GET /topics/attributes — gets topic attributes", async () => {
      mockSend.mockResolvedValueOnce({
        Attributes: { TopicArn: "arn:aws:sns:...", DisplayName: "test" },
      });
      const res = await get(
        "/topics/attributes?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.attributes.DisplayName).toBe("test");
    });

    it("PUT /topics/attributes — updates topic attribute", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put(
        "/topics/attributes?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic",
        { attributeName: "DisplayName", attributeValue: "new-name" }
      );
      expect(res.status).toBe(200);
      expect((await res.json()).updated).toBe(true);
    });

    it("GET /topics/tags — lists topic tags", async () => {
      mockSend.mockResolvedValueOnce({
        Tags: [{ Key: "env", Value: "test" }],
      });
      const res = await get(
        "/topics/tags?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags).toHaveLength(1);
    });

    it("POST /topics/tags — tags a topic", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post(
        "/topics/tags?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic",
        { tags: [{ Key: "env", Value: "prod" }] }
      );
      expect(res.status).toBe(200);
      expect((await res.json()).tagged).toBe(true);
    });

    it("DELETE /topics/tags — untags a topic", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del(
        "/topics/tags?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic&tagKeys=env"
      );
      expect(res.status).toBe(200);
      expect((await res.json()).untagged).toBe(true);
    });

    it("POST /topics/publish — publishes to a topic", async () => {
      mockSend.mockResolvedValueOnce({ MessageId: "msg-001" });
      const res = await post("/topics/publish", {
        topicArn: "arn:aws:sns:us-east-1:000000000000:my-topic",
        message: "Hello!",
        subject: "Test",
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.messageId).toBe("msg-001");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.Message).toBe("Hello!");
      expect(cmd.Subject).toBe("Test");
    });
  });

  describe("Subscriptions", () => {
    it("GET /subscriptions — lists all subscriptions", async () => {
      mockSend.mockResolvedValueOnce({
        Subscriptions: [
          {
            SubscriptionArn: "arn:aws:sns:...:sub-001",
            TopicArn: "arn:aws:sns:...:my-topic",
            Protocol: "sqs",
            Endpoint: "arn:aws:sqs:...:my-queue",
          },
        ],
      });
      const res = await get("/subscriptions");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.subscriptions).toHaveLength(1);
    });

    it("GET /subscriptions?topicArn= — filters by topic", async () => {
      mockSend.mockResolvedValueOnce({ Subscriptions: [] });
      const res = await get(
        "/subscriptions?topicArn=arn:aws:sns:...:my-topic"
      );
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.TopicArn).toContain("my-topic");
    });

    it("POST /subscriptions — creates subscription", async () => {
      mockSend.mockResolvedValueOnce({
        SubscriptionArn: "arn:aws:sns:...:sub-new",
      });
      const res = await post("/subscriptions", {
        topicArn: "arn:aws:sns:...:my-topic",
        protocol: "sqs",
        endpoint: "arn:aws:sqs:...:my-queue",
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.subscriptionArn).toContain("sub-new");
    });

    it("DELETE /subscriptions — deletes subscription", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del(
        "/subscriptions?subscriptionArn=arn:aws:sns:...:sub-001"
      );
      expect(res.status).toBe(200);
      expect((await res.json()).deleted).toBe(true);
    });

    it("DELETE /subscriptions — 400 when arn missing", async () => {
      const res = await del("/subscriptions");
      expect(res.status).toBe(400);
    });
  });

  describe("Platform Apps", () => {
    it("GET /platform-apps — lists platform apps", async () => {
      mockSend.mockResolvedValueOnce({
        PlatformApplications: [
          {
            PlatformApplicationArn: "arn:aws:sns:...:app/GCM/my-app",
          },
        ],
      });
      const res = await get("/platform-apps");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.platformApplications).toHaveLength(1);
    });

    it("POST /platform-apps — creates platform app", async () => {
      mockSend.mockResolvedValueOnce({
        PlatformApplicationArn: "arn:aws:sns:...:app/GCM/new-app",
      });
      const res = await post("/platform-apps", {
        name: "new-app",
        platform: "GCM",
        attributes: { PlatformCredential: "key" },
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.platformApplicationArn).toContain("new-app");
    });

    it("DELETE /platform-apps — deletes platform app", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del(
        "/platform-apps?arn=arn:aws:sns:...:app/GCM/my-app"
      );
      expect(res.status).toBe(200);
      expect((await res.json()).deleted).toBe(true);
    });

    it("DELETE /platform-apps — 400 when arn missing", async () => {
      const res = await del("/platform-apps");
      expect(res.status).toBe(400);
    });
  });

  describe("Inspect SMS & Push", () => {
    it("GET /inspect/sms — fetches SMS data via flociFetch", async () => {
      mockFlociFetch.mockResolvedValueOnce({ smsMessages: [] });
      const res = await get("/inspect/sms");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.smsMessages).toEqual([]);
      expect(mockFlociFetch).toHaveBeenCalledWith("/_aws/sns");
    });

    it("DELETE /inspect/sms — clears SMS data", async () => {
      mockFlociFetch.mockResolvedValueOnce({});
      const res = await del("/inspect/sms");
      expect(res.status).toBe(200);
      expect((await res.json()).cleared).toBe(true);
    });
  });
});
