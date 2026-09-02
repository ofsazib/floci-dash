import { Hono } from "hono";
import type { Context } from "hono";
import { SESv2Client } from "@aws-sdk/client-sesv2";
import { create } from "../../clients/aws";
import {
  CreateEmailIdentityCommand,
  ListEmailIdentitiesCommand,
  GetEmailIdentityCommand,
  DeleteEmailIdentityCommand,
  PutEmailIdentityMailFromAttributesCommand,
  GetEmailIdentityPoliciesCommand,
  CreateEmailIdentityPolicyCommand,
  UpdateEmailIdentityPolicyCommand,
  DeleteEmailIdentityPolicyCommand,
  SendEmailCommand,
  SendBulkEmailCommand,
  CreateEmailTemplateCommand,
  GetEmailTemplateCommand,
  ListEmailTemplatesCommand,
  DeleteEmailTemplateCommand,
  UpdateEmailTemplateCommand,
  GetAccountCommand,
  PutAccountSendingAttributesCommand,
  PutAccountSuppressionAttributesCommand,
  PutAccountVdmAttributesCommand,
  CreateConfigurationSetCommand,
  GetConfigurationSetCommand,
  ListConfigurationSetsCommand,
  DeleteConfigurationSetCommand,
  PutConfigurationSetSendingOptionsCommand,
  PutConfigurationSetReputationOptionsCommand,
  PutConfigurationSetDeliveryOptionsCommand,
  PutConfigurationSetTrackingOptionsCommand,
  PutConfigurationSetSuppressionOptionsCommand,
  PutConfigurationSetVdmOptionsCommand,
  PutConfigurationSetArchivingOptionsCommand,
  CreateDedicatedIpPoolCommand,
  ListDedicatedIpPoolsCommand,
  GetDedicatedIpPoolCommand,
  DeleteDedicatedIpPoolCommand,
  CreateContactListCommand,
  ListContactListsCommand,
  GetContactListCommand,
  DeleteContactListCommand,
  CreateContactCommand,
  ListContactsCommand,
  GetContactCommand,
  UpdateContactCommand,
  DeleteContactCommand,
  PutSuppressedDestinationCommand,
  ListSuppressedDestinationsCommand,
  GetSuppressedDestinationCommand,
  DeleteSuppressedDestinationCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
  GetConfigurationSetEventDestinationsCommand,
  CreateConfigurationSetEventDestinationCommand,
  UpdateConfigurationSetEventDestinationCommand,
  DeleteConfigurationSetEventDestinationCommand,
  CreateCustomVerificationEmailTemplateCommand,
  GetCustomVerificationEmailTemplateCommand,
  ListCustomVerificationEmailTemplatesCommand,
  UpdateCustomVerificationEmailTemplateCommand,
  DeleteCustomVerificationEmailTemplateCommand,
  PutEmailIdentityConfigurationSetAttributesCommand,
  PutEmailIdentityDkimAttributesCommand,
  PutEmailIdentityDkimSigningAttributesCommand,
  PutEmailIdentityFeedbackAttributesCommand,
  TestRenderEmailTemplateCommand,
} from "@aws-sdk/client-sesv2";

const router = new Hono();

const v2 = () => create(SESv2Client);

// ─── Email identities ────────────────────────────────────

router.post("/email-identities", async (c: Context) => {
  const body = await c.req.json<{ emailIdentity: string; tags?: Record<string, string> }>();
  if (!body.emailIdentity) return c.json({ error: "emailIdentity is required" }, 400);
  const result = await v2().send(new CreateEmailIdentityCommand({
    EmailIdentity: body.emailIdentity,
    Tags: body.tags
      ? Object.entries(body.tags).map(([Key, Value]) => ({ Key, Value }))
      : undefined,
  }));
  return c.json({
    identityType: result.IdentityType ?? null,
    verifiedForSendingStatus: result.VerifiedForSendingStatus ?? false,
    dkim: result.DkimAttributes ?? null,
  }, 201);
});

router.get("/email-identities", async (c: Context) => {
  const result = await v2().send(new ListEmailIdentitiesCommand({}));
  return c.json({
    identities: (result.EmailIdentities || ([] as any[])).map((i: any) => ({
      identity: i.IdentityName,
      type: i.IdentityType,
      sendingEnabled: i.SendingEnabled ?? false,
    })),
    total: (result.EmailIdentities || []).length,
  });
});

router.get("/email-identities/:identity", async (c: Context) => {
  const identity = decodeURIComponent(c.req.param("identity")!);
  const result = await v2().send(new GetEmailIdentityCommand({ EmailIdentity: identity }));
  return c.json({
    identity,
    identityType: result.IdentityType ?? null,
    verifiedForSendingStatus: result.VerifiedForSendingStatus ?? false,
    dkim: result.DkimAttributes ?? null,
    mailFrom: result.MailFromAttributes ?? null,
    policies: result.Policies ?? null,
    tags: result.Tags ?? [],
  });
});

router.delete("/email-identities/:identity", async (c: Context) => {
  const identity = decodeURIComponent(c.req.param("identity")!);
  await v2().send(new DeleteEmailIdentityCommand({ EmailIdentity: identity }));
  return c.json({ deleted: true });
});

router.put("/email-identities/:identity/mail-from", async (c: Context) => {
  const identity = decodeURIComponent(c.req.param("identity")!);
  const body = await c.req.json<{ mailFromDomain: string; behaviorOnMxFailure?: string }>();
  if (!body.mailFromDomain) return c.json({ error: "mailFromDomain is required" }, 400);
  await v2().send(new PutEmailIdentityMailFromAttributesCommand({
    EmailIdentity: identity,
    MailFromDomain: body.mailFromDomain,
    BehaviorOnMxFailure: (body.behaviorOnMxFailure as any) || "USE_DEFAULT_VALUE",
  }));
  return c.json({ updated: true });
});

// ─── Identity policies ───────────────────────────────────

router.get("/email-identities/:identity/policies", async (c: Context) => {
  const identity = decodeURIComponent(c.req.param("identity")!);
  const result = await v2().send(new GetEmailIdentityPoliciesCommand({ EmailIdentity: identity }));
  return c.json({ policies: result.Policies ?? {} });
});

router.put("/email-identities/:identity/policies/:policyName", async (c: Context) => {
  const identity = decodeURIComponent(c.req.param("identity")!);
  const policyName = decodeURIComponent(c.req.param("policyName")!);
  const body = await c.req.json<{ policy?: string }>();
  if (!body.policy) return c.json({ error: "policy is required" }, 400);
  await v2().send(new CreateEmailIdentityPolicyCommand({
    EmailIdentity: identity, PolicyName: policyName, Policy: body.policy,
  }));
  return c.json({ created: true }, 201);
});

router.post("/email-identities/:identity/policies/:policyName", async (c: Context) => {
  const identity = decodeURIComponent(c.req.param("identity")!);
  const policyName = decodeURIComponent(c.req.param("policyName")!);
  const body = await c.req.json<{ policy?: string }>();
  if (body.policy) {
    await v2().send(new UpdateEmailIdentityPolicyCommand({
      EmailIdentity: identity, PolicyName: policyName, Policy: body.policy,
    }));
    return c.json({ updated: true });
  }
  return c.json({ error: "policy is required" }, 400);
});

router.delete("/email-identities/:identity/policies/:policyName", async (c: Context) => {
  const identity = decodeURIComponent(c.req.param("identity")!);
  const policyName = decodeURIComponent(c.req.param("policyName")!);
  await v2().send(new DeleteEmailIdentityPolicyCommand({
    EmailIdentity: identity, PolicyName: policyName,
  }));
  return c.json({ deleted: true });
});

// ─── Sending ─────────────────────────────────────────────

router.post("/send", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.from) return c.json({ error: "from is required" }, 400);
  if (!body.destination) return c.json({ error: "destination is required" }, 400);
  if (!body.content) return c.json({ error: "content is required" }, 400);
  const result = await v2().send(new SendEmailCommand({
    FromEmailAddress: body.from,
    Destination: body.destination,
    Content: body.content,
    ConfigurationSetName: body.configurationSetName,
    Tags: body.tags,
  } as any));
  return c.json({ messageId: result.MessageId ?? null }, 201);
});

router.post("/send-bulk", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.from || !Array.isArray(body.bulkEmailEntries) || !body.bulkEmailEntries.length) {
    return c.json({ error: "from and bulkEmailEntries are required" }, 400);
  }
  const result = await v2().send(new SendBulkEmailCommand({
    FromEmailAddress: body.from,
    BulkEmailEntries: body.bulkEmailEntries as any,
    DefaultContent: body.defaultContent,
    ConfigurationSetName: body.configurationSetName,
  } as any));
  return c.json({
    results: (result.BulkEmailEntryResults || []).map((r: any) => ({
      status: r.Status,
      messageId: r.MessageId ?? null,
      error: r.Error ?? null,
    })),
  }, 201);
});

// ─── Templates ───────────────────────────────────────────

router.post("/templates", async (c: Context) => {
  const body = await c.req.json<{ templateName: string; subject: string; html?: string; text?: string }>();
  if (!body.templateName) return c.json({ error: "templateName is required" }, 400);
  await v2().send(new CreateEmailTemplateCommand({
    TemplateContent: {
      Subject: body.subject || "",
      Html: body.html,
      Text: body.text,
    },
    TemplateName: body.templateName,
  }));
  return c.json({ created: true }, 201);
});

router.get("/templates", async (c: Context) => {
  const result = await v2().send(new ListEmailTemplatesCommand({ PageSize: 50 }));
  return c.json({
    templates: (result.TemplatesMetadata || ([] as any[])).map((t: any) => ({
      name: t.TemplateName,
      createdTimestamp: t.CreatedTimestamp,
    })),
    total: (result.TemplatesMetadata || []).length,
  });
});

router.get("/templates/:name", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const result = await v2().send(new GetEmailTemplateCommand({ TemplateName: name }));
  return c.json({
    templateName: result.TemplateName ?? name,
    subject: result.TemplateContent?.Subject ?? null,
    html: result.TemplateContent?.Html ?? null,
    text: result.TemplateContent?.Text ?? null,
  });
});

router.put("/templates/:name", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const body = await c.req.json<{ subject?: string; html?: string; text?: string }>();
  let subject = body.subject;
  if (!subject) subject = "";
  await v2().send(new UpdateEmailTemplateCommand({
    TemplateName: name,
    TemplateContent: {
      Subject: subject,
      Html: body.html,
      Text: body.text,
    },
  }));
  return c.json({ updated: true });
});

router.delete("/templates/:name", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  await v2().send(new DeleteEmailTemplateCommand({ TemplateName: name }));
  return c.json({ deleted: true });
});

// ─── Account attributes ──────────────────────────────────

router.get("/account/sending", async (c: Context) => {
  const result = await v2().send(new GetAccountCommand({}));
  return c.json({ sendingEnabled: result.SendingEnabled ?? false });
});

router.put("/account/sending", async (c: Context) => {
  const body = await c.req.json<{ sendingEnabled: boolean }>();
  await v2().send(new PutAccountSendingAttributesCommand({ SendingEnabled: body.sendingEnabled }));
  return c.json({ updated: true });
});

router.get("/account/suppression", async (c: Context) => {
  const result = await v2().send(new GetAccountCommand({}));
  return c.json({ suppressionAttributes: result.SuppressionAttributes ?? null });
});

router.put("/account/suppression", async (c: Context) => {
  const body = await c.req.json<{ suppressedReasons?: string[] }>();
  await v2().send(new PutAccountSuppressionAttributesCommand({
    SuppressedReasons: (body.suppressedReasons as any[]) || undefined,
  }));
  return c.json({ updated: true });
});

router.get("/account/vdm", async (c: Context) => {
  const result = await v2().send(new GetAccountCommand({}));
  return c.json({ vdmAttributes: result.VdmAttributes ?? null });
});

router.put("/account/vdm", async (c: Context) => {
  const body = await c.req.json<{ vdmAttributes?: unknown }>();
  await v2().send(new PutAccountVdmAttributesCommand({
    VdmAttributes: (body.vdmAttributes as any) || {},
  }));
  return c.json({ updated: true });
});

// ─── Configuration sets ──────────────────────────────────

router.post("/configuration-sets", async (c: Context) => {
  const body = await c.req.json<{ name: string }>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  await v2().send(new CreateConfigurationSetCommand({ ConfigurationSetName: body.name }));
  return c.json({ created: true }, 201);
});

router.get("/configuration-sets", async (c: Context) => {
  const result = await v2().send(new ListConfigurationSetsCommand({ PageSize: 100 }));
  return c.json({
    configurationSets: (result.ConfigurationSets || []).map((cs: any) => cs.ConfigurationSetName),
    total: (result.ConfigurationSets || []).length,
  });
});

router.get("/configuration-sets/:name", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const result = await v2().send(new GetConfigurationSetCommand({ ConfigurationSetName: name }));
  return c.json({ configurationSet: result });
});

router.delete("/configuration-sets/:name", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  await v2().send(new DeleteConfigurationSetCommand({ ConfigurationSetName: name }));
  return c.json({ deleted: true });
});

const configSetOption = (route: string, Cmd: any, field: string) => {
  router.put(`/configuration-sets/:name/${route}`, async (c: Context) => {
    const name = decodeURIComponent(c.req.param("name")!);
    const body = await c.req.json<any>();
    await v2().send(new Cmd({ ConfigurationSetName: name, [field]: body }));
    return c.json({ updated: true });
  });
};

configSetOption("sending", PutConfigurationSetSendingOptionsCommand, "SendingOptions");
configSetOption("reputation", PutConfigurationSetReputationOptionsCommand, "ReputationOptions");
configSetOption("delivery", PutConfigurationSetDeliveryOptionsCommand, "DeliveryOptions");
configSetOption("tracking", PutConfigurationSetTrackingOptionsCommand, "TrackingOptions");
configSetOption("suppression", PutConfigurationSetSuppressionOptionsCommand, "SuppressionOptions");
configSetOption("vdm", PutConfigurationSetVdmOptionsCommand, "VdmOptions");
configSetOption("archiving", PutConfigurationSetArchivingOptionsCommand, "ArchivingOptions");

// ─── Dedicated IP pools ──────────────────────────────────

router.post("/dedicated-ip-pools", async (c: Context) => {
  const body = await c.req.json<{ poolName: string }>();
  if (!body.poolName) return c.json({ error: "poolName is required" }, 400);
  await v2().send(new CreateDedicatedIpPoolCommand({ PoolName: body.poolName }));
  return c.json({ created: true }, 201);
});

router.get("/dedicated-ip-pools", async (c: Context) => {
  const result = await v2().send(new ListDedicatedIpPoolsCommand({ PageSize: 100 }));
  return c.json({
    pools: (result.DedicatedIpPools || []).map((p: any) => p.PoolName),
    total: (result.DedicatedIpPools || []).length,
  });
});

router.get("/dedicated-ip-pools/:name", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const result = await v2().send(new GetDedicatedIpPoolCommand({ PoolName: name }));
  return c.json({ pool: result.DedicatedIpPool ?? null });
});

router.delete("/dedicated-ip-pools/:name", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  await v2().send(new DeleteDedicatedIpPoolCommand({ PoolName: name }));
  return c.json({ deleted: true });
});

// ─── Contact lists + contacts ────────────────────────────

router.post("/contact-lists", async (c: Context) => {
  const body = await c.req.json<{ listName: string; topicName?: string }>();
  if (!body.listName) return c.json({ error: "listName is required" }, 400);
  await v2().send(new CreateContactListCommand({
    ContactListName: body.listName,
    Topics: body.topicName ? ([{ TopicName: body.topicName }] as any) : undefined,
  }));
  return c.json({ created: true }, 201);
});

router.get("/contact-lists", async (c: Context) => {
  const result = await v2().send(new ListContactListsCommand({ PageSize: 100 }));
  return c.json({
    contactLists: (result.ContactLists || []).map((l: any) => l.ContactListName),
    total: (result.ContactLists || []).length,
  });
});

router.get("/contact-lists/:name", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const result = await v2().send(new GetContactListCommand({ ContactListName: name }));
  return c.json({ contactList: result });
});

router.delete("/contact-lists/:name", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  await v2().send(new DeleteContactListCommand({ ContactListName: name }));
  return c.json({ deleted: true });
});

router.post("/contact-lists/:name/contacts", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const body = await c.req.json<{ email: string }>();
  if (!body.email) return c.json({ error: "email is required" }, 400);
  await v2().send(new CreateContactCommand({ ContactListName: name, Email: body.email } as any));
  return c.json({ created: true }, 201);
});

router.get("/contact-lists/:name/contacts", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const result = await v2().send(new ListContactsCommand({ ContactListName: name, PageSize: 100 } as any));
  return c.json({
    contacts: (result.Contacts || []).map((ct: any) => ({
      email: ct.Email,
      unsubscribeAll: ct.UnsubscribeAll ?? false,
      lastUpdated: ct.LastUpdateTimestamp,
    })),
    total: (result.Contacts || []).length,
  });
});

router.get("/contact-lists/:name/contacts/:email", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const email = decodeURIComponent(c.req.param("email")!);
  const result = await v2().send(new GetContactCommand({
    ContactListName: name, Email: email,
  } as any));
  return c.json({ contact: result });
});

router.put("/contact-lists/:name/contacts/:email", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const email = decodeURIComponent(c.req.param("email")!);
  const body = await c.req.json<any>();
  await v2().send(new UpdateContactCommand({
    ContactListName: name, Email: email,
    UnsubscribeAll: body.unsubscribeAll,
    TopicPreferences: body.topicPreferences,
  } as any));
  return c.json({ updated: true });
});

router.delete("/contact-lists/:name/contacts/:email", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const email = decodeURIComponent(c.req.param("email")!);
  await v2().send(new DeleteContactCommand({
    ContactListName: name, Email: email,
  } as any));
  return c.json({ deleted: true });
});

// ─── Suppression list ────────────────────────────────────

router.put("/suppressed-destinations", async (c: Context) => {
  const body = await c.req.json<{ email: string; reason?: string }>();
  if (!body.email) return c.json({ error: "email is required" }, 400);
  await v2().send(new PutSuppressedDestinationCommand({
    Email: body.email,
    Reason: (body.reason || "BOUNCE") as any,
  } as any));
  return c.json({ suppressed: true }, 201);
});

router.get("/suppressed-destinations", async (c: Context) => {
  const result = await v2().send(new ListSuppressedDestinationsCommand({ PageSize: 100 }));
  return c.json({
    suppressed: (result.SuppressedDestinationSummaries || []).map((s: any) => ({
      email: s.EmailAddress,
      reason: s.Reason,
      lastUpdated: s.LastUpdateTime,
    })),
    total: (result.SuppressedDestinationSummaries || []).length,
  });
});

router.get("/suppressed-destinations/:email", async (c: Context) => {
  const email = decodeURIComponent(c.req.param("email")!);
  const result = await v2().send(new GetSuppressedDestinationCommand({ EmailAddress: email }));
  return c.json({ suppressedDestination: result.SuppressedDestination ?? null });
});

router.delete("/suppressed-destinations/:email", async (c: Context) => {
  const email = decodeURIComponent(c.req.param("email")!);
  await v2().send(new DeleteSuppressedDestinationCommand({ EmailAddress: email }));
  return c.json({ deleted: true });
});

// ─── Tags ────────────────────────────────────────────────

router.get("/resources/tags", async (c: Context) => {
  const arn = c.req.query("arn") || "";
  if (!arn) return c.json({ error: "arn is required" }, 400);
  const result = await v2().send(new ListTagsForResourceCommand({ ResourceArn: arn }));
  return c.json({ tags: result.Tags ?? [] });
});

router.post("/resources/tags", async (c: Context) => {
  const body = await c.req.json<{ arn: string; tags: Record<string, string> }>();
  if (!body.arn || !body.tags) return c.json({ error: "arn and tags are required" }, 400);
  await v2().send(new TagResourceCommand({
    ResourceArn: body.arn,
    Tags: Object.entries(body.tags).map(([Key, Value]) => ({ Key, Value })),
  }));
  return c.json({ tagged: true });
});

router.delete("/resources/tags", async (c: Context) => {
  const arn = c.req.query("arn") || "";
  const tagKeys = (c.req.query("tagKeys") || "").split(",").filter(Boolean);
  if (!arn || !tagKeys.length) return c.json({ error: "arn and tagKeys are required" }, 400);
  await v2().send(new UntagResourceCommand({ ResourceArn: arn, TagKeys: tagKeys }));
  return c.json({ untagged: true });
});

// ─── Configuration Set Event Destinations ───────────────

router.get("/configuration-sets/:name/event-destinations", async (c: Context) => {
  const name = c.req.param("name");
  const result = await v2().send(new GetConfigurationSetEventDestinationsCommand({ ConfigurationSetName: name }));
  return c.json({ eventDestinations: result.EventDestinations ?? [] });
});

router.post("/configuration-sets/:name/event-destinations", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ EventDestinationName: string; EventDestination: any }>();
  if (!body.EventDestinationName || !body.EventDestination) return c.json({ error: "EventDestinationName and EventDestination are required" }, 400);
  await v2().send(new CreateConfigurationSetEventDestinationCommand({
    ConfigurationSetName: name,
    EventDestinationName: body.EventDestinationName,
    EventDestination: body.EventDestination,
  }));
  return c.json({ created: true }, 201);
});

router.put("/configuration-sets/:name/event-destinations/:edName", async (c: Context) => {
  const name = c.req.param("name");
  const edName = c.req.param("edName");
  const body = await c.req.json<{ EventDestination: any }>();
  if (!body.EventDestination) return c.json({ error: "EventDestination is required" }, 400);
  await v2().send(new UpdateConfigurationSetEventDestinationCommand({
    ConfigurationSetName: name,
    EventDestinationName: edName,
    EventDestination: body.EventDestination,
  }));
  return c.json({ updated: true });
});

router.delete("/configuration-sets/:name/event-destinations/:edName", async (c: Context) => {
  const name = c.req.param("name");
  const edName = c.req.param("edName");
  await v2().send(new DeleteConfigurationSetEventDestinationCommand({
    ConfigurationSetName: name,
    EventDestinationName: edName,
  }));
  return c.json({ deleted: true });
});

// ─── Custom Verification Email Templates ─────────────────

router.get("/custom-verification-email-templates", async (c: Context) => {
  const result = await v2().send(new ListCustomVerificationEmailTemplatesCommand({}));
  return c.json({ templates: result.CustomVerificationEmailTemplates ?? [], nextToken: result.NextToken });
});

router.get("/custom-verification-email-templates/:name", async (c: Context) => {
  const name = c.req.param("name");
  const result = await v2().send(new GetCustomVerificationEmailTemplateCommand({ TemplateName: name }));
  return c.json({ template: result });
});

router.post("/custom-verification-email-templates", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.TemplateName) return c.json({ error: "TemplateName is required" }, 400);
  await v2().send(new CreateCustomVerificationEmailTemplateCommand(body));
  return c.json({ created: true }, 201);
});

router.put("/custom-verification-email-templates/:name", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<any>();
  await v2().send(new UpdateCustomVerificationEmailTemplateCommand({ TemplateName: name, ...body }));
  return c.json({ updated: true });
});

router.delete("/custom-verification-email-templates/:name", async (c: Context) => {
  const name = c.req.param("name");
  await v2().send(new DeleteCustomVerificationEmailTemplateCommand({ TemplateName: name }));
  return c.json({ deleted: true });
});

// ─── Email Identity Attributes ──────────────────────────

router.put("/email-identities/:identity/configuration-set", async (c: Context) => {
  const identity = c.req.param("identity");
  const body = await c.req.json<{ ConfigurationSetName?: string }>();
  await v2().send(new PutEmailIdentityConfigurationSetAttributesCommand({
    EmailIdentity: identity,
    ConfigurationSetName: body.ConfigurationSetName,
  }));
  return c.json({ updated: true });
});

router.put("/email-identities/:identity/dkim", async (c: Context) => {
  const identity = c.req.param("identity");
  const body = await c.req.json<{ SigningEnabled?: boolean }>();
  await v2().send(new PutEmailIdentityDkimAttributesCommand({
    EmailIdentity: identity,
    SigningEnabled: body.SigningEnabled,
  }));
  return c.json({ updated: true });
});

router.put("/email-identities/:identity/dkim/signing", async (c: Context) => {
  const identity = c.req.param("identity");
  const body = await c.req.json<Record<string, any>>();
  await v2().send(new PutEmailIdentityDkimSigningAttributesCommand({
    EmailIdentity: identity,
    SigningAttributesOrigin: body.SigningAttributesOrigin,
    SigningAttributes: body.SigningAttributes,
  } as any));
  return c.json({ updated: true });
});

router.put("/email-identities/:identity/feedback", async (c: Context) => {
  const identity = c.req.param("identity");
  const body = await c.req.json<{ EmailForwardingEnabled?: boolean }>();
  await v2().send(new PutEmailIdentityFeedbackAttributesCommand({
    EmailIdentity: identity,
    EmailForwardingEnabled: body.EmailForwardingEnabled,
  }));
  return c.json({ updated: true });
});

// ─── Template Render ─────────────────────────────────────

router.post("/templates/:name/render", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ TemplateData: string }>();
  const result = await v2().send(new TestRenderEmailTemplateCommand({
    TemplateName: name,
    TemplateData: body.TemplateData || "{}",
  }));
  return c.json({ renderedTemplate: result.RenderedTemplate });
});

// ─── Account ─────────────────────────────────────────────

router.get("/account", async (c: Context) => {
  const result = await v2().send(new GetAccountCommand({}));
  return c.json({ account: {
    ProductionAccessEnabled: result.ProductionAccessEnabled,
    EnforcementStatus: result.EnforcementStatus,
  }});
});

export default router;
