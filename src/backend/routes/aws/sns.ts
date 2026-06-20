import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { SNSClient } from "@aws-sdk/client-sns";
import {
  ListTopicsCommand,
  CreateTopicCommand,
  DeleteTopicCommand,
  GetTopicAttributesCommand,
  SetTopicAttributesCommand,
  ListSubscriptionsCommand,
  ListSubscriptionsByTopicCommand,
  SubscribeCommand,
  UnsubscribeCommand,
  GetSubscriptionAttributesCommand,
  SetSubscriptionAttributesCommand,
  ConfirmSubscriptionCommand,
  PublishCommand,
  PublishBatchCommand,
  TagResourceCommand,
  UntagResourceCommand,
  ListTagsForResourceCommand,
  ListPlatformApplicationsCommand,
  CreatePlatformApplicationCommand,
  DeletePlatformApplicationCommand,
  GetPlatformApplicationAttributesCommand,
  SetPlatformApplicationAttributesCommand,
  ListEndpointsByPlatformApplicationCommand,
  CreatePlatformEndpointCommand,
  DeleteEndpointCommand,
  GetEndpointAttributesCommand,
  SetEndpointAttributesCommand,
} from "@aws-sdk/client-sns";
import { flociFetch } from "../../clients/floci";
import { sanitizeName, sanitizeText } from "../../clients/sanitize";

const router = new Hono();
const getClient = () => create(SNSClient);

router.get("/topics", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListTopicsCommand({}));
  return c.json({ topics: result.Topics || [] });
});

router.post("/topics", async (c: Context) => {
  const body = await c.req.json();
  const topicName = sanitizeName(body.name || "", 256);
  if (!topicName) return c.json({ error: "name is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateTopicCommand({
      Name: topicName,
      Attributes: body.attributes,
      Tags: body.tags?.map((t: { Key: string; Value: string }) => ({ Key: t.Key, Value: t.Value })),
    })
  );
  return c.json({ topicArn: result.TopicArn }, 201);
});

router.delete("/topics", async (c: Context) => {
  const topicArn = c.req.query("topicArn");
  if (!topicArn) return c.json({ error: "topicArn query parameter required" }, 400);
  const client = getClient();
  await client.send(new DeleteTopicCommand({ TopicArn: topicArn }));
  return c.json({ deleted: true });
});

router.get("/topics/attributes", async (c: Context) => {
  const topicArn = c.req.query("topicArn");
  if (!topicArn) return c.json({ error: "topicArn query parameter required" }, 400);
  const client = getClient();
  const result = await client.send(new GetTopicAttributesCommand({ TopicArn: topicArn }));
  return c.json({ attributes: result.Attributes || {} });
});

router.put("/topics/attributes", async (c: Context) => {
  const topicArn = c.req.query("topicArn");
  if (!topicArn) return c.json({ error: "topicArn query parameter required" }, 400);
  const body = await c.req.json();
  const client = getClient();
  await client.send(
    new SetTopicAttributesCommand({
      TopicArn: topicArn,
      AttributeName: body.attributeName,
      AttributeValue: body.attributeValue,
    })
  );
  return c.json({ updated: true });
});

router.get("/topics/tags", async (c: Context) => {
  const topicArn = c.req.query("topicArn");
  if (!topicArn) return c.json({ error: "topicArn query parameter required" }, 400);
  const client = getClient();
  const result = await client.send(new ListTagsForResourceCommand({ ResourceArn: topicArn }));
  return c.json({ tags: result.Tags || [] });
});

router.post("/topics/tags", async (c: Context) => {
  const topicArn = c.req.query("topicArn");
  if (!topicArn) return c.json({ error: "topicArn query parameter required" }, 400);
  const body = await c.req.json();
  const client = getClient();
  await client.send(new TagResourceCommand({ ResourceArn: topicArn, Tags: body.tags }));
  return c.json({ tagged: true });
});

router.delete("/topics/tags", async (c: Context) => {
  const topicArn = c.req.query("topicArn");
  if (!topicArn) return c.json({ error: "topicArn query parameter required" }, 400);
  const tagKeys = c.req.query("tagKeys");
  if (!tagKeys) return c.json({ error: "tagKeys query parameter required" }, 400);
  const client = getClient();
  await client.send(new UntagResourceCommand({ ResourceArn: topicArn, TagKeys: tagKeys.split(",") }));
  return c.json({ untagged: true });
});

router.get("/subscriptions", async (c: Context) => {
  const topicArn = c.req.query("topicArn");
  const client = getClient();
  const result = topicArn
    ? await client.send(new ListSubscriptionsByTopicCommand({ TopicArn: topicArn }))
    : await client.send(new ListSubscriptionsCommand({}));
  return c.json({ subscriptions: result.Subscriptions || [] });
});

router.post("/subscriptions", async (c: Context) => {
  const body = await c.req.json();
  if (!body.topicArn || !body.protocol || !body.endpoint) return c.json({ error: "topicArn, protocol, and endpoint are required" }, 400);
  const client = getClient();
  const result = await client.send(
    new SubscribeCommand({
      TopicArn: body.topicArn,
      Protocol: body.protocol,
      Endpoint: sanitizeText(body.endpoint || "", 2048),
      Attributes: body.attributes,
    })
  );
  return c.json({ subscriptionArn: result.SubscriptionArn }, 201);
});

router.delete("/subscriptions", async (c: Context) => {
  const subscriptionArn = c.req.query("subscriptionArn");
  if (!subscriptionArn) return c.json({ error: "subscriptionArn query parameter required" }, 400);
  const client = getClient();
  await client.send(new UnsubscribeCommand({ SubscriptionArn: subscriptionArn }));
  return c.json({ deleted: true });
});

router.get("/subscriptions/attributes", async (c: Context) => {
  const subscriptionArn = c.req.query("subscriptionArn");
  if (!subscriptionArn) return c.json({ error: "subscriptionArn query parameter required" }, 400);
  const client = getClient();
  const result = await client.send(new GetSubscriptionAttributesCommand({ SubscriptionArn: subscriptionArn }));
  return c.json({ attributes: result.Attributes || {} });
});

router.put("/subscriptions/attributes", async (c: Context) => {
  const subscriptionArn = c.req.query("subscriptionArn");
  if (!subscriptionArn) return c.json({ error: "subscriptionArn query parameter required" }, 400);
  const body = await c.req.json();
  const client = getClient();
  await client.send(
    new SetSubscriptionAttributesCommand({
      SubscriptionArn: subscriptionArn,
      AttributeName: body.attributeName,
      AttributeValue: body.attributeValue,
    })
  );
  return c.json({ updated: true });
});

router.post("/topics/publish", async (c: Context) => {
  const body = await c.req.json();
  if (!body.topicArn || !body.message) return c.json({ error: "topicArn and message are required" }, 400);
  const client = getClient();
  const result = await client.send(
    new PublishCommand({
      TopicArn: body.topicArn,
      Message: sanitizeText(body.message || "", 262144),
      Subject: sanitizeName(body.subject || "", 100),
      MessageAttributes: body.messageAttributes,
      MessageStructure: body.messageStructure,
      MessageGroupId: sanitizeName(body.messageGroupId || "", 128),
      MessageDeduplicationId: sanitizeName(body.messageDeduplicationId || "", 128),
    })
  );
  return c.json({ messageId: result.MessageId }, 201);
});

router.post("/topics/publish-batch", async (c: Context) => {
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(
    new PublishBatchCommand({
      TopicArn: body.topicArn,
      PublishBatchRequestEntries: body.entries,
    })
  );
  return c.json({
    successful: result.Successful || [],
    failed: result.Failed || [],
  });
});

router.get("/platform-apps", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListPlatformApplicationsCommand({}));
  return c.json({ platformApplications: result.PlatformApplications || [] });
});

router.post("/platform-apps", async (c: Context) => {
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(
    new CreatePlatformApplicationCommand({
      Name: body.name,
      Platform: body.platform,
      Attributes: body.attributes,
    })
  );
  return c.json({ platformApplicationArn: result.PlatformApplicationArn }, 201);
});

router.delete("/platform-apps", async (c: Context) => {
  const arn = c.req.query("arn");
  if (!arn) return c.json({ error: "arn query parameter required" }, 400);
  const client = getClient();
  await client.send(new DeletePlatformApplicationCommand({ PlatformApplicationArn: arn }));
  return c.json({ deleted: true });
});

router.get("/platform-apps/endpoints", async (c: Context) => {
  const arn = c.req.query("arn");
  if (!arn) return c.json({ error: "arn query parameter required" }, 400);
  const client = getClient();
  const result = await client.send(
    new ListEndpointsByPlatformApplicationCommand({ PlatformApplicationArn: arn })
  );
  return c.json({ endpoints: result.Endpoints || [] });
});

router.post("/platform-apps/endpoints", async (c: Context) => {
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(
    new CreatePlatformEndpointCommand({
      PlatformApplicationArn: body.platformApplicationArn,
      Token: body.token,
      CustomUserData: body.customUserData,
      Attributes: body.attributes,
    })
  );
  return c.json({ endpointArn: result.EndpointArn }, 201);
});

router.delete("/platform-apps/endpoints", async (c: Context) => {
  const arn = c.req.query("arn");
  if (!arn) return c.json({ error: "arn query parameter required" }, 400);
  const client = getClient();
  await client.send(new DeleteEndpointCommand({ EndpointArn: arn }));
  return c.json({ deleted: true });
});

router.get("/inspect/sms", async (c: Context) => {
  const data = await flociFetch("/_aws/sns");
  return c.json(data);
});

router.delete("/inspect/sms", async (c: Context) => {
  await flociFetch("/_aws/sns", { method: "DELETE" });
  return c.json({ cleared: true });
});

router.get("/inspect/push", async (c: Context) => {
  const data = await flociFetch("/_aws/sns/push-notifications");
  return c.json(data);
});

router.delete("/inspect/push", async (c: Context) => {
  await flociFetch("/_aws/sns/push-notifications", { method: "DELETE" });
  return c.json({ cleared: true });
});

export default router;
