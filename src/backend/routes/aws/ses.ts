import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { SESClient } from "@aws-sdk/client-ses";
import {
  ListIdentitiesCommand,
  VerifyEmailIdentityCommand,
  VerifyDomainIdentityCommand,
  DeleteIdentityCommand,
  GetIdentityVerificationAttributesCommand,
  SendEmailCommand,
  GetIdentityDkimAttributesCommand,
  SetIdentityDkimEnabledCommand,
  SetIdentityMailFromDomainCommand,
  GetIdentityMailFromDomainAttributesCommand,
  ListVerifiedEmailAddressesCommand,
  GetIdentityNotificationAttributesCommand,
  SetIdentityNotificationTopicCommand,
  SetIdentityFeedbackForwardingEnabledCommand,
  SetIdentityHeadersInNotificationsEnabledCommand,
  ListConfigurationSetsCommand,
  CreateConfigurationSetCommand,
  DescribeConfigurationSetCommand,
  DeleteConfigurationSetCommand,
  CreateConfigurationSetEventDestinationCommand,
  UpdateConfigurationSetEventDestinationCommand,
  DeleteConfigurationSetEventDestinationCommand,
  UpdateConfigurationSetSendingEnabledCommand,
  CreateConfigurationSetTrackingOptionsCommand,
  UpdateConfigurationSetTrackingOptionsCommand,
  DeleteConfigurationSetTrackingOptionsCommand,
  UpdateConfigurationSetReputationMetricsEnabledCommand,
  PutConfigurationSetDeliveryOptionsCommand,
} from "@aws-sdk/client-ses";

const router = new Hono();
const getClient = () => create(SESClient);

// ── Identities ────────────────────────────────────────────

router.get("/identities", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListIdentitiesCommand({}));
  const identities = result.Identities || [];
  if (!identities.length) return c.json({ identities: [], total: 0 });
  const attrsResult = await client.send(
    new GetIdentityVerificationAttributesCommand({ Identities: identities })
  );
  const dkimResult = await client.send(
    new GetIdentityDkimAttributesCommand({ Identities: identities })
  );
  const mailFromResult = await client.send(
    new GetIdentityMailFromDomainAttributesCommand({ Identities: identities })
  );
  const enriched = identities.map((id) => ({
    identity: id,
    verificationStatus: attrsResult.VerificationAttributes?.[id]?.VerificationStatus,
    verificationToken: attrsResult.VerificationAttributes?.[id]?.VerificationToken,
    dkimEnabled: dkimResult.DkimAttributes?.[id]?.DkimEnabled || false,
    dkimVerificationStatus: dkimResult.DkimAttributes?.[id]?.DkimVerificationStatus,
    mailFromDomain: mailFromResult.MailFromDomainAttributes?.[id]?.MailFromDomain || null,
  }));
  return c.json({ identities: enriched, total: enriched.length });
});

router.post("/identities/verify-email", async (c: Context) => {
  const body = await c.req.json<{ emailAddress: string }>();
  if (!body.emailAddress) return c.json({ error: "emailAddress is required" }, 400);
  const client = getClient();
  await client.send(new VerifyEmailIdentityCommand({ EmailAddress: body.emailAddress }));
  return c.json({ emailAddress: body.emailAddress, initiated: true });
});

router.post("/identities/verify-domain", async (c: Context) => {
  const body = await c.req.json<{ domain: string }>();
  if (!body.domain) return c.json({ error: "domain is required" }, 400);
  const client = getClient();
  const result = await client.send(new VerifyDomainIdentityCommand({ Domain: body.domain }));
  return c.json({ domain: body.domain, verificationToken: result.VerificationToken });
});

router.delete("/identities/:value", async (c: Context) => {
  const value = decodeURIComponent(c.req.param("value")!);
  const client = getClient();
  await client.send(new DeleteIdentityCommand({ Identity: value }));
  return c.json({ identity: value, deleted: true });
});

router.get("/identities/:value", async (c: Context) => {
  const value = decodeURIComponent(c.req.param("value")!);
  const client = getClient();
  const attrsResult = await client.send(
    new GetIdentityVerificationAttributesCommand({ Identities: [value] })
  );
  const dkimResult = await client.send(
    new GetIdentityDkimAttributesCommand({ Identities: [value] })
  );
  const mailFromResult = await client.send(
    new GetIdentityMailFromDomainAttributesCommand({ Identities: [value] })
  );
  return c.json({
    identity: value,
    verificationStatus: attrsResult.VerificationAttributes?.[value]?.VerificationStatus,
    verificationToken: attrsResult.VerificationAttributes?.[value]?.VerificationToken,
    dkimEnabled: dkimResult.DkimAttributes?.[value]?.DkimEnabled || false,
    dkimVerificationStatus: dkimResult.DkimAttributes?.[value]?.DkimVerificationStatus,
    mailFromDomain: mailFromResult.MailFromDomainAttributes?.[value]?.MailFromDomain || null,
  });
});

// ── DKIM ──────────────────────────────────────────────────

router.put("/identities/:value/dkim", async (c: Context) => {
  const value = decodeURIComponent(c.req.param("value")!);
  const body = await c.req.json<{ enabled: boolean }>();
  const client = getClient();
  await client.send(
    new SetIdentityDkimEnabledCommand({
      Identity: value,
      DkimEnabled: body.enabled,
    })
  );
  return c.json({ identity: value, dkimEnabled: body.enabled });
});

// ── Mail From ─────────────────────────────────────────────

router.put("/identities/:value/mail-from", async (c: Context) => {
  const value = decodeURIComponent(c.req.param("value")!);
  const body = await c.req.json<{ mailFromDomain: string }>();
  if (!body.mailFromDomain) return c.json({ error: "mailFromDomain is required" }, 400);
  const client = getClient();
  await client.send(
    new SetIdentityMailFromDomainCommand({
      Identity: value,
      MailFromDomain: body.mailFromDomain,
    })
  );
  return c.json({ identity: value, mailFromDomain: body.mailFromDomain });
});

// ── Notification Attributes ─────────────────────────────

router.get("/identities/:value/notification-attributes", async (c: Context) => {
  const value = decodeURIComponent(c.req.param("value")!);
  const client = getClient();
  const result = await client.send(
    new GetIdentityNotificationAttributesCommand({ Identities: [value] })
  );
  const attrs = result.NotificationAttributes?.[value];
  return c.json({
    identity: value,
    bounceTopic: attrs?.BounceTopic || null,
    complaintTopic: attrs?.ComplaintTopic || null,
    deliveryTopic: attrs?.DeliveryTopic || null,
    forwardingEnabled: attrs?.ForwardingEnabled ?? true,
    headersInBounceNotifications: attrs?.HeadersInBounceNotificationsEnabled,
    headersInComplaintNotifications: attrs?.HeadersInComplaintNotificationsEnabled,
    headersInDeliveryNotifications: attrs?.HeadersInDeliveryNotificationsEnabled,
  });
});

router.put("/identities/:value/notification-topic", async (c: Context) => {
  const value = decodeURIComponent(c.req.param("value")!);
  const body = await c.req.json<{ notificationType: string; snsTopic?: string }>();
  if (!body.notificationType) return c.json({ error: "notificationType is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new SetIdentityNotificationTopicCommand({
      Identity: value,
      NotificationType: body.notificationType as any,
      SnsTopic: body.snsTopic,
    })
  );
  return c.json({ identity: value, notificationType: body.notificationType, updated: true });
});

router.put("/identities/:value/feedback-forwarding", async (c: Context) => {
  const value = decodeURIComponent(c.req.param("value")!);
  const body = await c.req.json<{ forwardingEnabled: boolean }>();
  if (typeof body.forwardingEnabled !== "boolean") return c.json({ error: "forwardingEnabled (boolean) is required" }, 400);

  const client = getClient();
  await client.send(
    new SetIdentityFeedbackForwardingEnabledCommand({
      Identity: value,
      ForwardingEnabled: body.forwardingEnabled,
    })
  );
  return c.json({ identity: value, forwardingEnabled: body.forwardingEnabled, updated: true });
});

router.put("/identities/:value/headers-in-notifications", async (c: Context) => {
  const value = decodeURIComponent(c.req.param("value")!);
  const body = await c.req.json<{ notificationType: string; enabled: boolean }>();
  if (!body.notificationType) return c.json({ error: "notificationType is required" }, 400);
  if (typeof body.enabled !== "boolean") return c.json({ error: "enabled (boolean) is required" }, 400);

  const client = getClient();
  await client.send(
    new SetIdentityHeadersInNotificationsEnabledCommand({
      Identity: value,
      NotificationType: body.notificationType as any,
      Enabled: body.enabled,
    })
  );
  return c.json({ identity: value, notificationType: body.notificationType, enabled: body.enabled, updated: true });
});

// ── Send Email ────────────────────────────────────────────

router.post("/send-email", async (c: Context) => {
  const body = await c.req.json<{
    source: string;
    toAddresses: string[];
    ccAddresses?: string[];
    bccAddresses?: string[];
    subject: string;
    html?: string;
    text?: string;
  }>();
  if (!body.source || !body.toAddresses?.length || !body.subject) {
    return c.json({ error: "source, toAddresses, and subject are required" }, 400);
  }
  const client = getClient();
  const result = await client.send(
    new SendEmailCommand({
      Source: body.source,
      Destination: {
        ToAddresses: body.toAddresses,
        CcAddresses: body.ccAddresses,
        BccAddresses: body.bccAddresses,
      },
      Message: {
        Subject: { Data: body.subject, Charset: "UTF-8" },
        Body: {
          Html: body.html ? { Data: body.html, Charset: "UTF-8" } : undefined,
          Text: body.text ? { Data: body.text, Charset: "UTF-8" } : undefined,
        },
      },
    })
  );
  return c.json({ messageId: result.MessageId });
});

// ── Configuration Sets ─────────────────────────────────────

router.get("/configuration-sets", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListConfigurationSetsCommand({}));
  const sets = result.ConfigurationSets || [];
  return c.json({ configurationSets: sets, total: sets.length });
});

router.post("/configuration-sets", async (c: Context) => {
  const body = await c.req.json<{ name: string }>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const client = getClient();
  await client.send(new CreateConfigurationSetCommand({ ConfigurationSet: { Name: body.name } }));
  return c.json({ name: body.name, created: true }, 201);
});

router.get("/configuration-sets/:name", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const client = getClient();
  const result = await client.send(
    new DescribeConfigurationSetCommand({
      ConfigurationSetName: name,
      ConfigurationSetAttributeNames: [
        "eventDestinations",
        "trackingOptions",
        "deliveryOptions",
        "reputationOptions",
      ],
    })
  );
  const cs = result.ConfigurationSet as any;
  if (!cs) return c.json({ error: "Configuration set not found" }, 404);
  return c.json({
    name: cs.Name,
    eventDestinations: result.EventDestinations || [],
    trackingOptions: cs.TrackingOptions || null,
    deliveryOptions: cs.DeliveryOptions || null,
    reputationOptions: cs.ReputationOptions || null,
  });
});

router.delete("/configuration-sets/:name", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const client = getClient();
  await client.send(new DeleteConfigurationSetCommand({ ConfigurationSetName: name }));
  return c.json({ name, deleted: true });
});

// ── Event Destinations ─────────────────────────────────────

router.post("/configuration-sets/:name/event-destinations", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const body = await c.req.json<any>();
  if (!body.eventDestinationName) return c.json({ error: "eventDestinationName is required" }, 400);
  if (!body.matchingEventTypes?.length) return c.json({ error: "matchingEventTypes is required" }, 400);

  const client = getClient();
  const dest: any = {
    Name: body.eventDestinationName,
    Enabled: body.enabled !== false,
    MatchingEventTypes: body.matchingEventTypes,
  };
  if (body.snsTopicARN) dest.SNSDestination = { TopicARN: body.snsTopicARN };
  if (body.cloudWatchDestination) dest.CloudWatchDestination = body.cloudWatchDestination;
  if (body.kinesisFirehoseDestination) dest.KinesisFirehoseDestination = body.kinesisFirehoseDestination;

  await client.send(
    new CreateConfigurationSetEventDestinationCommand({
      ConfigurationSetName: name,
      EventDestination: dest,
    })
  );
  return c.json({ name, eventDestinationName: body.eventDestinationName, created: true }, 201);
});

router.put("/configuration-sets/:name/event-destinations/:edName", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const edName = decodeURIComponent(c.req.param("edName")!);
  const body = await c.req.json<any>();
  if (!body.matchingEventTypes?.length) return c.json({ error: "matchingEventTypes is required" }, 400);

  const client = getClient();
  const dest: any = {
    Name: edName,
    Enabled: body.enabled !== false,
    MatchingEventTypes: body.matchingEventTypes,
  };
  if (body.snsTopicARN) dest.SNSDestination = { TopicARN: body.snsTopicARN };
  if (body.cloudWatchDestination) dest.CloudWatchDestination = body.cloudWatchDestination;
  if (body.kinesisFirehoseDestination) dest.KinesisFirehoseDestination = body.kinesisFirehoseDestination;

  await client.send(
    new UpdateConfigurationSetEventDestinationCommand({
      ConfigurationSetName: name,
      EventDestination: dest,
    })
  );
  return c.json({ name, eventDestinationName: edName, updated: true });
});

router.delete("/configuration-sets/:name/event-destinations/:edName", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const edName = decodeURIComponent(c.req.param("edName")!);
  const client = getClient();
  await client.send(
    new DeleteConfigurationSetEventDestinationCommand({
      ConfigurationSetName: name,
      EventDestinationName: edName,
    })
  );
  return c.json({ name, eventDestinationName: edName, deleted: true });
});

// ── Sending Enabled ────────────────────────────────────────

router.put("/configuration-sets/:name/sending-enabled", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const body = await c.req.json<{ enabled: boolean }>();
  if (typeof body.enabled !== "boolean") return c.json({ error: "enabled (boolean) is required" }, 400);
  const client = getClient();
  await client.send(
    new UpdateConfigurationSetSendingEnabledCommand({
      ConfigurationSetName: name,
      Enabled: body.enabled,
    })
  );
  return c.json({ name, sendingEnabled: body.enabled, updated: true });
});

// ── Tracking Options ───────────────────────────────────────

router.post("/configuration-sets/:name/tracking-options", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const body = await c.req.json<{ customRedirectDomain: string }>();
  if (!body.customRedirectDomain) return c.json({ error: "customRedirectDomain is required" }, 400);
  const client = getClient();
  await client.send(
    new CreateConfigurationSetTrackingOptionsCommand({
      ConfigurationSetName: name,
      TrackingOptions: { CustomRedirectDomain: body.customRedirectDomain },
    })
  );
  return c.json({ name, trackingOptions: { customRedirectDomain: body.customRedirectDomain }, created: true });
});

router.put("/configuration-sets/:name/tracking-options", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const body = await c.req.json<{ customRedirectDomain: string }>();
  if (!body.customRedirectDomain) return c.json({ error: "customRedirectDomain is required" }, 400);
  const client = getClient();
  await client.send(
    new UpdateConfigurationSetTrackingOptionsCommand({
      ConfigurationSetName: name,
      TrackingOptions: { CustomRedirectDomain: body.customRedirectDomain },
    })
  );
  return c.json({ name, trackingOptions: { customRedirectDomain: body.customRedirectDomain }, updated: true });
});

router.delete("/configuration-sets/:name/tracking-options", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const client = getClient();
  await client.send(
    new DeleteConfigurationSetTrackingOptionsCommand({ ConfigurationSetName: name })
  );
  return c.json({ name, deleted: true });
});

// ── Reputation Metrics ────────────────────────────────────

router.put("/configuration-sets/:name/reputation-metrics", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const body = await c.req.json<{ enabled: boolean }>();
  if (typeof body.enabled !== "boolean") return c.json({ error: "enabled (boolean) is required" }, 400);
  const client = getClient();
  await client.send(
    new UpdateConfigurationSetReputationMetricsEnabledCommand({
      ConfigurationSetName: name,
      Enabled: body.enabled,
    })
  );
  return c.json({ name, reputationMetricsEnabled: body.enabled, updated: true });
});

// ── Delivery Options ───────────────────────────────────────

router.put("/configuration-sets/:name/delivery-options", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const body = await c.req.json<{ tlsPolicy?: string }>();
  const client = getClient();
  await client.send(
    new PutConfigurationSetDeliveryOptionsCommand({
      ConfigurationSetName: name,
      DeliveryOptions: { TlsPolicy: body.tlsPolicy as any },
    })
  );
  return c.json({ name, deliveryOptions: { tlsPolicy: body.tlsPolicy }, updated: true });
});

// ── Verified Emails ───────────────────────────────────────

router.get("/verified-emails", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListVerifiedEmailAddressesCommand({}));
  return c.json({
    emails: result.VerifiedEmailAddresses || [],
    total: result.VerifiedEmailAddresses?.length || 0,
  });
});

export default router;
