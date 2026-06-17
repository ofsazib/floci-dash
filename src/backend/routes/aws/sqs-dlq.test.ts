import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockSQS = vi.hoisted(() =>
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
  SQSClient: mockSQS,
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

import app from "../../index";

beforeEach(() => {
  mockSend.mockReset();
});

// ─── DLQ move-tasks ─────────────────────────────────────

describe("POST /api/aws/sqs/queues/dlq/move-tasks", () => {
  it("moves messages from DLQ to source queue", async () => {
    mockSend
      .mockResolvedValueOnce({
        Messages: [
          { MessageId: "msg1", Body: "body1", ReceiptHandle: "handle1", MessageAttributes: {} },
          { MessageId: "msg2", Body: "body2", ReceiptHandle: "handle2", MessageAttributes: {} },
        ],
      })
      .mockResolvedValueOnce({})  // SendMessage for msg1
      .mockResolvedValueOnce({})  // DeleteMessage for msg1
      .mockResolvedValueOnce({})  // SendMessage for msg2
      .mockResolvedValueOnce({}); // DeleteMessage for msg2

    const res = await app.request("/api/aws/sqs/queues/dlq/move-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dlqUrl: "http://dlq", sourceUrl: "http://source" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.moved).toBe(2);
    expect(body.failed).toBe(0);
    expect(body.movedMessages).toHaveLength(2);
  });

  it("returns 400 if dlqUrl is missing", async () => {
    const res = await app.request("/api/aws/sqs/queues/dlq/move-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceUrl: "http://source" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 if sourceUrl is missing", async () => {
    const res = await app.request("/api/aws/sqs/queues/dlq/move-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dlqUrl: "http://dlq" }),
    });
    expect(res.status).toBe(400);
  });

  it("handles empty DLQ gracefully", async () => {
    mockSend.mockResolvedValueOnce({ Messages: undefined });

    const res = await app.request("/api/aws/sqs/queues/dlq/move-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dlqUrl: "http://dlq", sourceUrl: "http://source" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.moved).toBe(0);
    expect(body.failed).toBe(0);
  });
});
