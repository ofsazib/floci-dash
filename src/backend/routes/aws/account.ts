import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  AccountClient,
  GetAlternateContactCommand,
  PutAlternateContactCommand,
} from "@aws-sdk/client-account";

const router = new Hono();
const getClient = () => create(AccountClient);

const CONTACT_TYPES = ["BILLING", "OPERATIONS", "SECURITY"];

router.get("/alternate-contact", async (c: Context) => {
  const type = c.req.query("type") || "";
  if (!CONTACT_TYPES.includes(type))
    return c.json({ error: `type query parameter must be one of ${CONTACT_TYPES.join(", ")}` }, 400);
  try {
    const result: any = await getClient().send(
      new GetAlternateContactCommand({ AlternateContactType: type as any })
    );
    return c.json({ contact: result.AlternateContact || null });
  } catch (err: any) {
    // Floci returns 404 ResourceNotFoundException when no contact is set yet —
    // surface that as "not set" instead of an error the UI has to special-case.
    if (err?.name === "ResourceNotFoundException" || err?.$metadata?.httpStatusCode === 404)
      return c.json({ contact: null });
    throw err;
  }
});

router.put("/alternate-contact", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const { type, name, title, emailAddress, phoneNumber } = body || {};
  if (!CONTACT_TYPES.includes(type))
    return c.json({ error: `type must be one of ${CONTACT_TYPES.join(", ")}` }, 400);
  if (!name || !title || !emailAddress || !phoneNumber)
    return c.json({ error: "name, title, emailAddress and phoneNumber are required" }, 400);
  await getClient().send(
    new PutAlternateContactCommand({
      AlternateContactType: type,
      Name: name,
      Title: title,
      EmailAddress: emailAddress,
      PhoneNumber: phoneNumber,
    })
  );
  return c.json({ ok: true }, 200);
});

export default router;
