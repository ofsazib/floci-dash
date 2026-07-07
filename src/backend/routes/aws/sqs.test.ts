import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());
const mockFlociFetch = vi.hoisted(() => vi.fn());

const mockSQSClient = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-sqs", () => ({
  SQSClient: mockSQSClient,
  ListQueuesCommand: createCmd("ListQueuesCommand"),
  CreateQueueCommand: createCmd("CreateQueueCommand"),
  DeleteQueueCommand: createCmd("DeleteQueueCommand"),
  GetQueueUrlCommand: createCmd("GetQueueUrlCommand"),
  GetQueueAttributesCommand: createCmd("GetQueueAttributesCommand"),
  SetQueueAttributesCommand: createCmd("SetQueueAttributesCommand"),
  SendMessageCommand: createCmd("SendMessageCommand"),
  SendMessageBatchCommand: createCmd("SendMessageBatchCommand"),
  ReceiveMessageCommand: createCmd("ReceiveMessageCommand"),
  DeleteMessageCommand: createCmd("DeleteMessageCommand"),
  DeleteMessageBatchCommand: createCmd("DeleteMessageBatchCommand"),
  ChangeMessageVisibilityCommand: createCmd("ChangeMessageVisibilityCommand"),
  ChangeMessageVisibilityBatchCommand: createCmd("ChangeMessageVisibilityBatchCommand"),
  PurgeQueueCommand: createCmd("PurgeQueueCommand"),
  TagQueueCommand: createCmd("TagQueueCommand"),
  UntagQueueCommand: createCmd("UntagQueueCommand"),
  ListQueueTagsCommand: createCmd("ListQueueTagsCommand"),
  ListDeadLetterSourceQueuesCommand: createCmd("ListDeadLetterSourceQueuesCommand"),
  AddPermissionCommand: createCmd("AddPermissionCommand"),
  RemovePermissionCommand: createCmd("RemovePermissionCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: vi.fn((Ctor: any) => {
    return new Ctor({});
  }),
  getAwsConfig: () => ({
    endpoint: "http://localhost:4566",
    region: "us-east-1",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  }),
}));

vi.mock("../../clients/floci", () => ({
  flociFetch: mockFlociFetch,
}));

import router from "./sqs";

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

describe("SQS Routes", () => {
  describe("Queues", () => {
    it("GET /queues — lists queues", async () => {
      mockSend.mockResolvedValueOnce({
        QueueUrls: ["http://localhost:4566/000000000000/my-queue"],
      });
      const res = await get("/queues");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.queueUrls).toHaveLength(1);
      expect(body.queueUrls[0]).toContain("my-queue");
    });

    it("GET /queues — supports prefix filter", async () => {
      mockSend.mockResolvedValueOnce({ QueueUrls: [] });
      const res = await get("/queues?prefix=prod");
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.QueueNamePrefix).toBe("prod");
    });

    it("GET /queues — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ QueueUrls: [] });
      const res = await get("/queues");
      const body = await res.json();
      expect(body.queueUrls).toEqual([]);
    });

    it("POST /queues — creates a queue", async () => {
      mockSend.mockResolvedValueOnce({
        QueueUrl: "http://localhost:4566/000000000000/new-queue",
      });
      const res = await post("/queues", {
        queueName: "new-queue",
        attributes: { VisibilityTimeout: "30" },
        tags: { env: "test" },
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.queueUrl).toContain("new-queue");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.QueueName).toBe("new-queue");
      expect(cmd.Attributes.VisibilityTimeout).toBe("30");
    });

    it("POST /queues — 400 when queueName missing", async () => {
      const res = await post("/queues", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /queues — deletes a queue", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del(
        "/queues?queueUrl=http://localhost:4566/000000000000/my-queue"
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });

    it("DELETE /queues — 400 when queueUrl missing", async () => {
      const res = await del("/queues");
      expect(res.status).toBe(400);
    });

    it("GET /queues/url — gets queue URL", async () => {
      mockSend.mockResolvedValueOnce({
        QueueUrl: "http://localhost:4566/000000000000/test-queue",
      });
      const res = await get("/queues/url?queueName=test-queue");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.queueUrl).toContain("test-queue");
    });

    it("GET /queues/url — 400 when queueName missing", async () => {
      const res = await get("/queues/url");
      expect(res.status).toBe(400);
    });

    it("GET /queues/attributes — gets queue attributes", async () => {
      mockSend.mockResolvedValueOnce({
        Attributes: { QueueArn: "arn:aws:sqs:...", VisibilityTimeout: "30" },
      });
      const res = await get(
        "/queues/attributes?queueUrl=http://localhost:4566/000000000000/my-queue"
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.attributes.QueueArn).toBeDefined();
    });

    it("GET /queues/attributes — 400 when queueUrl missing", async () => {
      const res = await get("/queues/attributes");
      expect(res.status).toBe(400);
    });

    it("PUT /queues/attributes — updates attributes", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put(
        "/queues/attributes?queueUrl=http://localhost:4566/000000000000/my-queue",
        { attributes: { VisibilityTimeout: "60" } }
      );
      expect(res.status).toBe(200);
      expect((await res.json()).updated).toBe(true);
    });

    it("PURGE /queues/purge — purges a queue", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post(
        "/queues/purge?queueUrl=http://localhost:4566/000000000000/my-queue"
      );
      expect(res.status).toBe(200);
      expect((await res.json()).purged).toBe(true);
    });
  });

  describe("Messages", () => {
    it("GET /queues/messages — lists messages via flociFetch", async () => {
      mockFlociFetch.mockResolvedValueOnce({
        messages: [{ MessageId: "msg-001", Body: "Hello" }],
      });
      const res = await get(
        "/queues/messages?queueUrl=http://localhost:4566/000000000000/my-queue"
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.messages).toHaveLength(1);
    });

    it("DELETE /queues/messages — clears messages via flociFetch", async () => {
      mockFlociFetch.mockResolvedValueOnce({});
      const res = await del(
        "/queues/messages?queueUrl=http://localhost:4566/000000000000/my-queue"
      );
      expect(res.status).toBe(200);
      expect((await res.json()).cleared).toBe(true);
    });

    it("GET /queues/messages — 400 when queueUrl missing", async () => {
      const res = await get("/queues/messages");
      expect(res.status).toBe(400);
    });

    it("POST /queues/messages — sends a message", async () => {
      mockSend.mockResolvedValueOnce({
        MessageId: "msg-001",
        MD5OfMessageBody: "abc123",
      });
      const res = await post(
        "/queues/messages?queueUrl=http://localhost:4566/000000000000/my-queue",
        { messageBody: "Hello, world!" }
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.messageId).toBe("msg-001");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.QueueUrl).toContain("my-queue");
      expect(cmd.MessageBody).toBe("Hello, world!");
    });

    it("POST /queues/messages — 400 when queueUrl missing", async () => {
      const res = await post("/queues/messages", {
        messageBody: "Hello",
      });
      expect(res.status).toBe(400);
    });

    it("GET /queues/tags — lists queue tags", async () => {
      mockSend.mockResolvedValueOnce({
        Tags: { env: "test", project: "floci" },
      });
      const res = await get(
        "/queues/tags?queueUrl=http://localhost:4566/000000000000/my-queue"
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags.env).toBe("test");
    });

    it("GET /queues/tags — 400 when queueUrl missing", async () => {
      const res = await get("/queues/tags");
      expect(res.status).toBe(400);
    });

    it("POST /queues/tags — tags a queue", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post(
        "/queues/tags?queueUrl=http://localhost:4566/000000000000/my-queue",
        { tags: { env: "prod" } }
      );
      expect(res.status).toBe(200);
      expect((await res.json()).tagged).toBe(true);
      expect(mockSend.mock.calls[0][0].Tags).toEqual({ env: "prod" });
    });

    it("DELETE /queues/tags — untags a queue", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del(
        "/queues/tags?queueUrl=http://localhost:4566/000000000000/my-queue&tagKeys=env,project"
      );
      expect(res.status).toBe(200);
      expect((await res.json()).untagged).toBe(true);
    });

    it("DELETE /queues/tags — 400 when tagKeys missing", async () => {
      const res = await del(
        "/queues/tags?queueUrl=http://localhost:4566/000000000000/my-queue"
      );
      expect(res.status).toBe(400);
    });

    it("GET /queues/dlq-sources — lists DLQ sources", async () => {
      mockSend.mockResolvedValueOnce({
        queueUrls: ["http://localhost:4566/000000000000/source-queue"],
      });
      const res = await get(
        "/queues/dlq-sources?queueUrl=http://localhost:4566/000000000000/dlq"
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.queueUrls).toHaveLength(1);
    });

    it("DELETE /queues/messages/item — deletes a message", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del(
        "/queues/messages/item?queueUrl=http://localhost:4566/000000000000/my-queue&receiptHandle=abc123"
      );
      expect(res.status).toBe(200);
      expect((await res.json()).deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].ReceiptHandle).toBe("abc123");
    });

    it("DELETE /queues/messages/item — 400 when params missing", async () => {
      const res = await del("/queues/messages/item?queueUrl=test");
      expect(res.status).toBe(400);
    });

    it("POST /queues/messages/batch — sends batch", async () => {
      mockSend.mockResolvedValueOnce({
        Successful: [{ Id: "1", MessageId: "m1" }],
        Failed: [],
      });
      const res = await post(
        "/queues/messages/batch?queueUrl=http://localhost:4566/000000000000/my-queue",
        { entries: [{ Id: "1", MessageBody: "hi" }] }
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.successful).toHaveLength(1);
    });

    it("POST /queues/messages/batch — 400 when queueUrl missing", async () => {
      const res = await post("/queues/messages/batch", { entries: [] });
      expect(res.status).toBe(400);
    });

    it("POST /queues/messages/visibility — changes visibility timeout", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post(
        "/queues/messages/visibility?queueUrl=http://localhost:4566/000000000000/my-queue",
        { receiptHandle: "rh-123", visibilityTimeout: 60 }
      );
      expect(res.status).toBe(200);
      expect((await res.json()).updated).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.ReceiptHandle).toBe("rh-123");
      expect(cmd.VisibilityTimeout).toBe(60);
    });

    it("POST /queues/messages/visibility — 400 when queueUrl missing", async () => {
      const res = await post("/queues/messages/visibility", {});
      expect(res.status).toBe(400);
    });

    it("POST /queues/messages/visibility-batch — changes batch visibility", async () => {
      mockSend.mockResolvedValueOnce({
        Successful: [{ Id: "1" }],
        Failed: [],
      });
      const res = await post(
        "/queues/messages/visibility-batch?queueUrl=http://localhost:4566/000000000000/my-queue",
        { entries: [{ Id: "1", ReceiptHandle: "rh", VisibilityTimeout: 30 }] }
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.successful).toHaveLength(1);
    });

    it("POST /queues/messages/visibility-batch — 400 when queueUrl missing", async () => {
      const res = await post("/queues/messages/visibility-batch", {});
      expect(res.status).toBe(400);
    });
  });

  describe("DLQ Move Tasks", () => {
    it("POST /queues/dlq/move-tasks — moves messages from DLQ to source", async () => {
      // ReceiveMessage returns 2 messages
      mockSend.mockResolvedValueOnce({
        Messages: [
          {
            MessageId: "msg-001",
            Body: "Hello 1",
            ReceiptHandle: "rh-001",
            MessageAttributes: {},
          },
          {
            MessageId: "msg-002",
            Body: "Hello 2",
            ReceiptHandle: "rh-002",
            MessageAttributes: {},
          },
        ],
      });
      // SendMessage (called twice, once per message)
      mockSend.mockResolvedValueOnce({ MessageId: "moved-001" });
      // DeleteMessage (called twice)
      mockSend.mockResolvedValueOnce({});
      mockSend.mockResolvedValueOnce({ MessageId: "moved-002" });
      mockSend.mockResolvedValueOnce({});

      const res = await post("/queues/dlq/move-tasks", {
        dlqUrl: "http://localhost:4566/000000000000/dlq",
        sourceUrl: "http://localhost:4566/000000000000/source",
        maxMessages: 10,
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.moved).toBe(2);
      expect(body.failed).toBe(0);
      expect(body.movedMessages).toHaveLength(2);
      expect(body.movedMessages[0].messageId).toBe("msg-001");

      // Verify ReceiveMessage was called with DLQ URL
      expect(mockSend.mock.calls[0][0].QueueUrl).toContain("dlq");
      // Verify SendMessage was called with source URL
      expect(mockSend.mock.calls[1][0].QueueUrl).toContain("source");
      expect(mockSend.mock.calls[1][0].MessageBody).toBe("Hello 1");
    });

    it("POST /queues/dlq/move-tasks — 400 when dlqUrl or sourceUrl missing", async () => {
      const res = await post("/queues/dlq/move-tasks", {});
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("dlqUrl");
    });

    it("POST /queues/dlq/move-tasks — handles empty DLQ (no messages)", async () => {
      mockSend.mockResolvedValueOnce({ Messages: [] });

      const res = await post("/queues/dlq/move-tasks", {
        dlqUrl: "http://localhost:4566/000000000000/dlq",
        sourceUrl: "http://localhost:4566/000000000000/source",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.moved).toBe(0);
      expect(body.failed).toBe(0);
      expect(body.movedMessages).toEqual([]);
    });

    it("POST /queues/dlq/move-tasks — handles send failure for one message", async () => {
      mockSend.mockResolvedValueOnce({
        Messages: [
          {
            MessageId: "msg-good",
            Body: "Good message",
            ReceiptHandle: "rh-good",
            MessageAttributes: {},
          },
          {
            MessageId: "msg-bad",
            Body: "Bad message",
            ReceiptHandle: "rh-bad",
            MessageAttributes: {},
          },
        ],
      });
      // SendMessage succeeds for first, fails for second
      mockSend.mockResolvedValueOnce({ MessageId: "moved-good" });
      mockSend.mockResolvedValueOnce({}); // DeleteMessage for good
      mockSend.mockRejectedValueOnce(new Error("Send failed")); // SendMessage for bad fails

      const res = await post("/queues/dlq/move-tasks", {
        dlqUrl: "http://localhost:4566/000000000000/dlq",
        sourceUrl: "http://localhost:4566/000000000000/source",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.moved).toBe(1);
      expect(body.failed).toBe(1);
      expect(body.movedMessages).toHaveLength(1);
      expect(body.movedMessages[0].messageId).toBe("msg-good");
      expect(body.failedMessages).toHaveLength(1);
      expect(body.failedMessages[0].messageId).toBe("msg-bad");
      expect(body.failedMessages[0].error).toBe("Send failed");
    });
  });

  describe("Permissions", () => {
    it("POST /queues/permissions — adds permission", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post(
        "/queues/permissions?queueUrl=http://localhost:4566/000000000000/my-queue",
        { label: "cross-account", awsAccountIds: ["123456789012"], actions: ["SendMessage"] }
      );
      expect(res.status).toBe(200);
      expect((await res.json()).added).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.Label).toBe("cross-account");
      expect(cmd.AWSAccountIds).toEqual(["123456789012"]);
    });

    it("POST /queues/permissions — 400 when queueUrl missing", async () => {
      const res = await post("/queues/permissions", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /queues/permissions — removes permission", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del(
        "/queues/permissions?queueUrl=http://localhost:4566/000000000000/my-queue&label=cross-account"
      );
      expect(res.status).toBe(200);
      expect((await res.json()).removed).toBe(true);
    });

    it("DELETE /queues/permissions — 400 when params missing", async () => {
      const res = await del("/queues/permissions?queueUrl=only-url");
      expect(res.status).toBe(400);
    });
  });
});
