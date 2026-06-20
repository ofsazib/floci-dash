import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { SQSClient } from "@aws-sdk/client-sqs";
import {
  ListQueuesCommand,
  CreateQueueCommand,
  DeleteQueueCommand,
  GetQueueUrlCommand,
  GetQueueAttributesCommand,
  SetQueueAttributesCommand,
  SendMessageCommand,
  SendMessageBatchCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  DeleteMessageBatchCommand,
  ChangeMessageVisibilityCommand,
  ChangeMessageVisibilityBatchCommand,
  PurgeQueueCommand,
  TagQueueCommand,
  UntagQueueCommand,
  ListQueueTagsCommand,
  ListDeadLetterSourceQueuesCommand,
  AddPermissionCommand,
  RemovePermissionCommand,
} from "@aws-sdk/client-sqs";
import type { QueueAttributeName } from "@aws-sdk/client-sqs";
import { flociFetch } from "../../clients/floci";
import { sanitizeName, sanitizeText } from "../../clients/sanitize";

const router = new Hono();
const getClient = () => create(SQSClient);

const ALL_ATTRS: QueueAttributeName[] = [
  "QueueArn",
  "ApproximateNumberOfMessages",
  "ApproximateNumberOfMessagesNotVisible",
  "ApproximateNumberOfMessagesDelayed",
  "CreatedTimestamp",
  "LastModifiedTimestamp",
  "VisibilityTimeout",
  "MaximumMessageSize",
  "DelaySeconds",
  "MessageRetentionPeriod",
  "FifoQueue",
  "ContentBasedDeduplication",
  "RedrivePolicy",
  "Policy",
  "DeduplicationScope",
];

router.get("/queues", async (c: Context) => {
  const prefix = c.req.query("prefix");
  const client = getClient();
  const cmd = new ListQueuesCommand(prefix ? { QueueNamePrefix: prefix } : {});
  const result = await client.send(cmd);
  return c.json({ queueUrls: result.QueueUrls || [] });
});

router.post("/queues", async (c: Context) => {
  const body = await c.req.json();
  const queueName = sanitizeName(body.queueName || "", 80);
  if (!queueName) return c.json({ error: "queueName is required" }, 400);
  const client = getClient();
  const cmd = new CreateQueueCommand({
    QueueName: queueName,
    Attributes: body.attributes,
    tags: body.tags,
  });
  const result = await client.send(cmd);
  return c.json({ queueUrl: result.QueueUrl }, 201);
});

router.delete("/queues", async (c: Context) => {
  const queueUrl = c.req.query("queueUrl");
  if (!queueUrl) return c.json({ error: "queueUrl query parameter required" }, 400);
  const client = getClient();
  await client.send(new DeleteQueueCommand({ QueueUrl: queueUrl }));
  return c.json({ deleted: true });
});

router.get("/queues/url", async (c: Context) => {
  const queueName = c.req.query("queueName");
  if (!queueName) return c.json({ error: "queueName query parameter required" }, 400);
  const client = getClient();
  const result = await client.send(new GetQueueUrlCommand({ QueueName: queueName }));
  return c.json({ queueUrl: result.QueueUrl });
});

router.get("/queues/attributes", async (c: Context) => {
  const queueUrl = c.req.query("queueUrl");
  if (!queueUrl) return c.json({ error: "queueUrl query parameter required" }, 400);
  const client = getClient();
  const result = await client.send(
    new GetQueueAttributesCommand({ QueueUrl: queueUrl, AttributeNames: ALL_ATTRS })
  );
  return c.json({ attributes: result.Attributes || {} });
});

router.put("/queues/attributes", async (c: Context) => {
  const queueUrl = c.req.query("queueUrl");
  if (!queueUrl) return c.json({ error: "queueUrl query parameter required" }, 400);
  const body = await c.req.json();
  const client = getClient();
  await client.send(new SetQueueAttributesCommand({ QueueUrl: queueUrl, Attributes: body.attributes }));
  return c.json({ updated: true });
});

router.get("/queues/tags", async (c: Context) => {
  const queueUrl = c.req.query("queueUrl");
  if (!queueUrl) return c.json({ error: "queueUrl query parameter required" }, 400);
  const client = getClient();
  const result = await client.send(new ListQueueTagsCommand({ QueueUrl: queueUrl }));
  return c.json({ tags: result.Tags || {} });
});

router.post("/queues/tags", async (c: Context) => {
  const queueUrl = c.req.query("queueUrl");
  if (!queueUrl) return c.json({ error: "queueUrl query parameter required" }, 400);
  const body = await c.req.json();
  const client = getClient();
  await client.send(new TagQueueCommand({ QueueUrl: queueUrl, Tags: body.tags }));
  return c.json({ tagged: true });
});

router.delete("/queues/tags", async (c: Context) => {
  const queueUrl = c.req.query("queueUrl");
  if (!queueUrl) return c.json({ error: "queueUrl query parameter required" }, 400);
  const tagKeys = c.req.query("tagKeys");
  if (!tagKeys) return c.json({ error: "tagKeys query parameter required" }, 400);
  const client = getClient();
  await client.send(new UntagQueueCommand({ QueueUrl: queueUrl, TagKeys: tagKeys.split(",") }));
  return c.json({ untagged: true });
});

router.post("/queues/purge", async (c: Context) => {
  const queueUrl = c.req.query("queueUrl");
  if (!queueUrl) return c.json({ error: "queueUrl query parameter required" }, 400);
  const client = getClient();
  await client.send(new PurgeQueueCommand({ QueueUrl: queueUrl }));
  return c.json({ purged: true });
});

router.get("/queues/messages", async (c: Context) => {
  const queueUrl = c.req.query("queueUrl");
  if (!queueUrl) return c.json({ error: "queueUrl query parameter required" }, 400);
  const data = await flociFetch(`/_aws/sqs/messages?QueueUrl=${encodeURIComponent(queueUrl)}`);
  return c.json(data);
});

router.delete("/queues/messages", async (c: Context) => {
  const queueUrl = c.req.query("queueUrl");
  if (!queueUrl) return c.json({ error: "queueUrl query parameter required" }, 400);
  await flociFetch(`/_aws/sqs/messages?QueueUrl=${encodeURIComponent(queueUrl)}`, { method: "DELETE" });
  return c.json({ cleared: true });
});

router.post("/queues/messages", async (c: Context) => {
  const queueUrl = c.req.query("queueUrl");
  if (!queueUrl) return c.json({ error: "queueUrl query parameter required" }, 400);
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: sanitizeText(body.messageBody || "", 262144),
      DelaySeconds: body.delaySeconds,
      MessageAttributes: body.messageAttributes,
      MessageGroupId: sanitizeName(body.messageGroupId || "", 128),
      MessageDeduplicationId: sanitizeName(body.messageDeduplicationId || "", 128),
    })
  );
  return c.json({
    messageId: result.MessageId,
    md5OfMessageBody: result.MD5OfMessageBody,
    md5OfMessageAttributes: result.MD5OfMessageAttributes,
    sequenceNumber: result.SequenceNumber,
  }, 201);
});

router.post("/queues/messages/batch", async (c: Context) => {
  const queueUrl = c.req.query("queueUrl");
  if (!queueUrl) return c.json({ error: "queueUrl query parameter required" }, 400);
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(
    new SendMessageBatchCommand({ QueueUrl: queueUrl, Entries: body.entries })
  );
  return c.json({
    successful: result.Successful || [],
    failed: result.Failed || [],
  });
});

router.delete("/queues/messages/item", async (c: Context) => {
  const queueUrl = c.req.query("queueUrl");
  const receiptHandle = c.req.query("receiptHandle");
  if (!queueUrl || !receiptHandle)
    return c.json({ error: "queueUrl and receiptHandle query parameters required" }, 400);
  const client = getClient();
  await client.send(new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: receiptHandle }));
  return c.json({ deleted: true });
});

router.post("/queues/messages/visibility", async (c: Context) => {
  const queueUrl = c.req.query("queueUrl");
  if (!queueUrl) return c.json({ error: "queueUrl query parameter required" }, 400);
  const body = await c.req.json();
  const client = getClient();
  await client.send(
    new ChangeMessageVisibilityCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: body.receiptHandle,
      VisibilityTimeout: body.visibilityTimeout,
    })
  );
  return c.json({ updated: true });
});

router.post("/queues/messages/visibility-batch", async (c: Context) => {
  const queueUrl = c.req.query("queueUrl");
  if (!queueUrl) return c.json({ error: "queueUrl query parameter required" }, 400);
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(
    new ChangeMessageVisibilityBatchCommand({ QueueUrl: queueUrl, Entries: body.entries })
  );
  return c.json({
    successful: result.Successful || [],
    failed: result.Failed || [],
  });
});

router.get("/queues/dlq-sources", async (c: Context) => {
  const queueUrl = c.req.query("queueUrl");
  if (!queueUrl) return c.json({ error: "queueUrl query parameter required" }, 400);
  const client = getClient();
  const result = await client.send(
    new ListDeadLetterSourceQueuesCommand({ QueueUrl: queueUrl })
  );
  return c.json({ queueUrls: result.queueUrls || [] });
});

// Move messages from a DLQ to a source queue
router.post("/queues/dlq/move-tasks", async (c: Context) => {
  const body = await c.req.json();
  const { dlqUrl, sourceUrl, maxMessages = 10 } = body;
  if (!dlqUrl || !sourceUrl)
    return c.json({ error: "dlqUrl and sourceUrl are required" }, 400);

  const client = getClient();
  const moved: Array<{ messageId: string; body: string }> = [];
  const failed: Array<{ messageId: string; error: string }> = [];

  // Receive messages from DLQ
  const receiveResult = await client.send(
    new ReceiveMessageCommand({
      QueueUrl: dlqUrl,
      MaxNumberOfMessages: Math.min(maxMessages, 10),
      WaitTimeSeconds: 1,
      MessageAttributeNames: ["All"],
    })
  );

  const messages = receiveResult.Messages || [];

  for (const msg of messages) {
    try {
      // Send to source queue
      await client.send(
        new SendMessageCommand({
          QueueUrl: sourceUrl,
          MessageBody: msg.Body || "",
          MessageAttributes: msg.MessageAttributes,
        })
      );
      // Delete from DLQ
      await client.send(
        new DeleteMessageCommand({
          QueueUrl: dlqUrl,
          ReceiptHandle: msg.ReceiptHandle!,
        })
      );
      moved.push({ messageId: msg.MessageId || "", body: msg.Body || "" });
    } catch (err) {
      failed.push({ messageId: msg.MessageId || "", error: (err as Error).message });
    }
  }

  return c.json({ moved: moved.length, failed: failed.length, movedMessages: moved, failedMessages: failed });
});

router.post("/queues/permissions", async (c: Context) => {
  const queueUrl = c.req.query("queueUrl");
  if (!queueUrl) return c.json({ error: "queueUrl query parameter required" }, 400);
  const body = await c.req.json();
  const client = getClient();
  await client.send(
    new AddPermissionCommand({
      QueueUrl: queueUrl,
      Label: body.label,
      AWSAccountIds: body.awsAccountIds,
      Actions: body.actions,
    })
  );
  return c.json({ added: true });
});

router.delete("/queues/permissions", async (c: Context) => {
  const queueUrl = c.req.query("queueUrl");
  const label = c.req.query("label");
  if (!queueUrl || !label)
    return c.json({ error: "queueUrl and label query parameters required" }, 400);
  const client = getClient();
  await client.send(new RemovePermissionCommand({ QueueUrl: queueUrl, Label: label }));
  return c.json({ removed: true });
});

export default router;
