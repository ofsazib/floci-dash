import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { SESClient } from "@aws-sdk/client-ses";
import { SESv2Client, PutAccountDetailsCommand, GetAccountCommand } from "@aws-sdk/client-sesv2";
import {
  ListTemplatesCommand,
  CreateTemplateCommand,
  UpdateTemplateCommand,
  DeleteTemplateCommand,
  GetTemplateCommand,
  SendTemplatedEmailCommand,
  TestRenderTemplateCommand,
} from "@aws-sdk/client-ses";
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
  GetAccountSendingEnabledCommand,
  UpdateAccountSendingEnabledCommand,
  GetSendQuotaCommand,
  GetSendStatisticsCommand,
  SendRawEmailCommand,
  VerifyEmailAddressCommand,
  DeleteVerifiedEmailAddressCommand,
  // P1 gap audit — v1 extras
  SendBulkTemplatedEmailCommand,
  CreateCustomVerificationEmailTemplateCommand,
  GetCustomVerificationEmailTemplateCommand,
  ListCustomVerificationEmailTemplatesCommand,
  UpdateCustomVerificationEmailTemplateCommand,
  DeleteCustomVerificationEmailTemplateCommand,
  SendCustomVerificationEmailCommand,
  VerifyDomainDkimCommand,
  PutIdentityPolicyCommand,
  GetIdentityPoliciesCommand,
  ListIdentityPoliciesCommand,
  DeleteIdentityPolicyCommand,
  CreateReceiptRuleSetCommand,
  DescribeReceiptRuleSetCommand,
  ListReceiptRuleSetsCommand,
  DeleteReceiptRuleSetCommand,
  SetActiveReceiptRuleSetCommand,
  DescribeActiveReceiptRuleSetCommand,
} from "@aws-sdk/client-ses";

const router = new Hono();
const getClient = () => create(SESClient);
const getV2Client = () => create(SESv2Client);

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

router.post("/verified-emails", async (c: Context) => {
  const body = await c.req.json<{ emailAddress: string }>();
  if (!body.emailAddress || !body.emailAddress.trim()) {
    return c.json({ error: "emailAddress is required" }, 400);
  }
  const client = getClient();
  await client.send(new VerifyEmailAddressCommand({ EmailAddress: body.emailAddress.trim() }));
  return c.json({ emailAddress: body.emailAddress.trim(), verified: true }, 201);
});

router.delete("/verified-emails/:email", async (c: Context) => {
  const email = decodeURIComponent(c.req.param("email")!);
  const client = getClient();
  await client.send(new DeleteVerifiedEmailAddressCommand({ EmailAddress: email }));
  return c.json({ emailAddress: email, deleted: true });
});

// ── Account sending stats ─────────────────────────────────

router.get("/account/sending-enabled", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetAccountSendingEnabledCommand({}));
  return c.json({ enabled: result.Enabled ?? false });
});

router.put("/account/sending-enabled", async (c: Context) => {
  const body = await c.req.json<{ enabled: boolean }>();
  const client = getClient();
  await client.send(
    new UpdateAccountSendingEnabledCommand({ Enabled: Boolean(body.enabled) })
  );
  return c.json({ enabled: Boolean(body.enabled), updated: true });
});

router.get("/account/send-quota", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetSendQuotaCommand({}));
  return c.json({
    max24HourSend: result.Max24HourSend,
    maxSendRate: result.MaxSendRate,
    sentLast24Hours: result.SentLast24Hours,
  });
});

router.get("/account/send-statistics", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetSendStatisticsCommand({}));
  return c.json({
    sendDataPoints: (result.SendDataPoints || []).map((p) => ({
      timestamp: p.Timestamp?.toISOString() || null,
      deliveryAttempts: p.DeliveryAttempts,
      rejects: p.Rejects,
      complaints: p.Complaints,
      bounces: p.Bounces,
    })),
  });
});

router.get("/account/details", async (c: Context) => {
  const client = getV2Client();
  const result = await client.send(new GetAccountCommand({}));
  const d = result.Details;
  return c.json({
    details: d
      ? {
          mailType: d.MailType ?? null,
          websiteUrl: d.WebsiteURL ?? null,
          contactLanguage: d.ContactLanguage ?? null,
          useCaseDescription: d.UseCaseDescription ?? null,
          additionalContacts: d.AdditionalContactEmailAddresses ?? [],
          productionAccessEnabled: (d as any).ProductionAccessEnabled ?? false,
        }
      : null,
  });
});

router.put("/account/details", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.mailType) return c.json({ error: "mailType is required" }, 400);
  const client = getV2Client();
  await client.send(
    new PutAccountDetailsCommand({
      MailType: body.mailType,
      WebsiteURL: body.websiteUrl,
      ContactLanguage: body.contactLanguage,
      UseCaseDescription: body.useCaseDescription,
      AdditionalContactEmailAddresses: body.additionalContacts,
      ProductionAccessEnabled: body.productionAccessEnabled,
    })
  );
  return c.json({ updated: true });
});

// ── Raw email ─────────────────────────────────────────────

router.post("/send-raw", async (c: Context) => {
  const body = await c.req.json<{ rawMessage: string; source?: string; destinations?: string[] }>();
  if (!body.rawMessage || !body.rawMessage.trim()) {
    return c.json({ error: "rawMessage is required" }, 400);
  }
  const client = getClient();
  const result = await client.send(
    new SendRawEmailCommand({
      Source: body.source || undefined,
      Destinations: body.destinations && body.destinations.length > 0 ? body.destinations : undefined,
      RawMessage: { Data: new TextEncoder().encode(body.rawMessage) },
    })
  );
  return c.json({ messageId: result.MessageId }, 201);
});


// ── Templates ─────────────────────────────────────────────

router.get("/templates", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListTemplatesCommand({}));
  const templates = (result.TemplatesMetadata || []).map((t: any) => ({
    name: t.Name,
    createdTimestamp: t.CreatedTimestamp,
  }));
  return c.json({ templates, total: templates.length });
});

router.post("/templates", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const client = getClient();
  await client.send(
    new CreateTemplateCommand({
      Template: {
        TemplateName: body.name,
        SubjectPart: body.subject,
        TextPart: body.text,
        HtmlPart: body.html,
      },
    })
  );
  return c.json({ created: true }, 201);
});

router.put("/templates/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const body = await c.req.json<any>();
  const client = getClient();
  await client.send(
    new UpdateTemplateCommand({
      Template: {
        TemplateName: name,
        SubjectPart: body.subject,
        TextPart: body.text,
        HtmlPart: body.html,
      },
    })
  );
  return c.json({ updated: true });
});

router.get("/templates/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const client = getClient();
  const result = await client.send(new GetTemplateCommand({ TemplateName: name }));
  const t = result.Template;
  return c.json({
    template: t
      ? { name: t.TemplateName, subject: t.SubjectPart, text: t.TextPart, html: t.HtmlPart }
      : null,
  });
});

router.delete("/templates/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new DeleteTemplateCommand({ TemplateName: name }));
  return c.json({ deleted: true });
});

router.post("/templates/:name/render", async (c: Context) => {
  const name = c.req.param("name")!;
  const body = await c.req.json<{ templateData?: string }>();
  const client = getClient();
  const result = await client.send(
    new TestRenderTemplateCommand({
      TemplateName: name,
      TemplateData: body.templateData || "{}",
    })
  );
  return c.json({ rendered: result.RenderedTemplate || "" });
});

router.post("/send-templated", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.source) return c.json({ error: "source is required" }, 400);
  if (!body.template) return c.json({ error: "template is required" }, 400);
  if (!body.destination?.to?.length)
    return c.json({ error: "destination.to is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new SendTemplatedEmailCommand({
      Source: body.source,
      Destination: { ToAddresses: body.destination.to, CcAddresses: body.destination.cc },
      Template: body.template,
      TemplateData: body.templateData || "{}",
    })
  );
  return c.json({ messageId: result.MessageId }, 201);
});


// ────────────────────────────────────────────────────────────────
//  P1 gap audit — v1 extras
// ────────────────────────────────────────────────────────────────

router.post("/send-bulk-templated", async (c: Context) => {
  const body = await c.req.json<{ source?: string; template?: string; destinations?: any[]; defaultTemplateData?: string }>();
  if (!body.source) return c.json({ error: "source is required" }, 400);
  if (!body.template) return c.json({ error: "template is required" }, 400);
  if (!Array.isArray(body.destinations) || !body.destinations.length) {
    return c.json({ error: "destinations is required" }, 400);
  }
  const result = await getClient().send(new SendBulkTemplatedEmailCommand({
    Source: body.source,
    Template: body.template,
    Destinations: body.destinations,
    DefaultTemplateData: body.defaultTemplateData || "{}",
  }));
  return c.json({
    status: (result.Status || []).map((s: any) => ({
      status: s.Status,
      messageId: s.MessageId ?? null,
      error: s.Error ?? null,
    })),
  }, 201);
});

// ─── Custom verification email templates (CVET) ────────────────

router.post("/custom-verification-templates", async (c: Context) => {
  const body = await c.req.json<{ templateName?: string; fromEmailAddress?: string; templateSubject?: string; templateHtml?: string; templateText?: string; successRedirectionURL?: string; failureRedirectionURL?: string }>();
  if (!body.templateName) return c.json({ error: "templateName is required" }, 400);
  if (!body.fromEmailAddress) return c.json({ error: "fromEmailAddress is required" }, 400);
  await getClient().send(new CreateCustomVerificationEmailTemplateCommand({
    TemplateName: body.templateName,
    FromEmailAddress: body.fromEmailAddress,
    TemplateSubject: body.templateSubject || "",
    TemplateContent: body.templateHtml || body.templateText || "",
    SuccessRedirectionURL: body.successRedirectionURL,
    FailureRedirectionURL: body.failureRedirectionURL,
  }));
  return c.json({ created: true }, 201);
});

router.get("/custom-verification-templates", async (c: Context) => {
  const result = await getClient().send(new ListCustomVerificationEmailTemplatesCommand({ MaxItems: 100 } as any));
  return c.json({
    templates: (result.CustomVerificationEmailTemplates || []).map((t: any) => ({
      name: t.TemplateName,
      from: t.FromEmailAddress,
      successUrl: t.SuccessRedirectionURL,
      failureUrl: t.FailureRedirectionURL,
    })),
    total: (result.CustomVerificationEmailTemplates || []).length,
  });
});

router.get("/custom-verification-templates/:name", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const result = await getClient().send(new GetCustomVerificationEmailTemplateCommand({ TemplateName: name }));
  return c.json({
    templateName: result.TemplateName ?? name,
    from: result.FromEmailAddress ?? null,
    subject: result.TemplateSubject ?? null,
    content: result.TemplateContent ?? null,
    successUrl: result.SuccessRedirectionURL ?? null,
    failureUrl: result.FailureRedirectionURL ?? null,
  });
});

router.put("/custom-verification-templates/:name", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const body = await c.req.json<any>();
  await getClient().send(new UpdateCustomVerificationEmailTemplateCommand({
    TemplateName: name,
    FromEmailAddress: body.fromEmailAddress,
    TemplateSubject: body.templateSubject || "",
    TemplateContent: body.templateHtml || body.templateText || "",
    SuccessRedirectionURL: body.successRedirectionURL,
    FailureRedirectionURL: body.failureRedirectionURL,
  } as any));
  return c.json({ updated: true });
});

router.delete("/custom-verification-templates/:name", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  await getClient().send(new DeleteCustomVerificationEmailTemplateCommand({ TemplateName: name }));
  return c.json({ deleted: true });
});

router.post("/send-custom-verification", async (c: Context) => {
  const body = await c.req.json<{ emailAddress?: string; templateName?: string; configurationSetName?: string }>();
  if (!body.emailAddress) return c.json({ error: "emailAddress is required" }, 400);
  if (!body.templateName) return c.json({ error: "templateName is required" }, 400);
  await getClient().send(new SendCustomVerificationEmailCommand({
    EmailAddress: body.emailAddress,
    TemplateName: body.templateName,
    ConfigurationSetName: body.configurationSetName,
  }));
  return c.json({ sent: true }, 201);
});

// ─── DKIM + identity policies (v1) ──────────────────────────────

router.post("/domains/:domain/dkim", async (c: Context) => {
  const domain = c.req.param("domain")!;
  const result = await getClient().send(new VerifyDomainDkimCommand({ Domain: domain }));
  return c.json({ dkimTokens: result.DkimTokens ?? [] }, 201);
});

router.put("/identities/:identity/policies/:policyName", async (c: Context) => {
  const identity = decodeURIComponent(c.req.param("identity")!);
  const policyName = decodeURIComponent(c.req.param("policyName")!);
  const body = await c.req.json<{ policy?: string }>();
  if (!body.policy) return c.json({ error: "policy is required" }, 400);
  await getClient().send(new PutIdentityPolicyCommand({
    Identity: identity, PolicyName: policyName, Policy: body.policy,
  }));
  return c.json({ created: true }, 201);
});

router.get("/identities/:identity/policies", async (c: Context) => {
  const identity = decodeURIComponent(c.req.param("identity")!);
  const result = await getClient().send(new GetIdentityPoliciesCommand({
    Identity: identity,
    PolicyNames: (c.req.query("policyNames") || "").split(",").filter(Boolean),
  }));
  return c.json({ policies: result.Policies ?? {} });
});

router.delete("/identities/:identity/policies/:policyName", async (c: Context) => {
  const identity = decodeURIComponent(c.req.param("identity")!);
  const policyName = decodeURIComponent(c.req.param("policyName")!);
  await getClient().send(new DeleteIdentityPolicyCommand({
    Identity: identity, PolicyName: policyName,
  }));
  return c.json({ deleted: true });
});

// ─── Receipt rule sets ──────────────────────────────────────────

router.post("/receipt-rule-sets", async (c: Context) => {
  const body = await c.req.json<{ ruleSetName?: string }>();
  if (!body.ruleSetName) return c.json({ error: "ruleSetName is required" }, 400);
  await getClient().send(new CreateReceiptRuleSetCommand({ RuleSetName: body.ruleSetName }));
  return c.json({ created: true }, 201);
});

router.get("/receipt-rule-sets/:name", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const result = await getClient().send(new DescribeReceiptRuleSetCommand({ RuleSetName: name }));
  return c.json({
    name: result.Metadata?.Name ?? name,
    created: result.Metadata?.CreatedTimestamp ?? null,
    rules: (result.Rules || []).map((r: any) => ({ name: r.Name, enabled: r.Enabled })),
    total: (result.Rules || []).length,
  });
});

router.get("/receipt-rule-sets", async (c: Context) => {
  const result = await getClient().send(new ListReceiptRuleSetsCommand({ NextToken: c.req.query("nextToken") }));
  return c.json({
    ruleSets: (result.RuleSets || []).map((r: any) => ({
      name: r.Name,
      created: r.CreatedTimestamp,
    })),
    total: (result.RuleSets || []).length,
  });
});

router.delete("/receipt-rule-sets/:name", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  await getClient().send(new DeleteReceiptRuleSetCommand({ RuleSetName: name }));
  return c.json({ deleted: true });
});

router.post("/receipt-rule-sets/:name/activate", async (c: Context) => {
  const name = c.req.param("name")!;
  await getClient().send(new SetActiveReceiptRuleSetCommand({ RuleSetName: name }));
  return c.json({ activated: true });
});

router.get("/receipt-rule-sets-active", async (c: Context) => {
  const result = await getClient().send(new DescribeActiveReceiptRuleSetCommand({}));
  return c.json({
    name: result.Metadata?.Name ?? null,
    created: result.Metadata?.CreatedTimestamp ?? null,
    rules: (result.Rules || []).map((r: any) => ({ name: r.Name, enabled: r.Enabled })),
  });
});

export default router;