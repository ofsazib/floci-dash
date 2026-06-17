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
  const value = decodeURIComponent(c.req.param("value") || "");
  const client = getClient();
  await client.send(new DeleteIdentityCommand({ Identity: value }));
  return c.json({ identity: value, deleted: true });
});

router.get("/identities/:value", async (c: Context) => {
  const value = decodeURIComponent(c.req.param("value") || "");
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
  const value = decodeURIComponent(c.req.param("value") || "");
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
  const value = decodeURIComponent(c.req.param("value") || "");
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
