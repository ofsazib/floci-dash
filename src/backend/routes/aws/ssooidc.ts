import { Hono } from "hono";
import type { Context } from "hono";
import { getFlociEndpoint } from "../../clients/config";
import { readJson } from "../../clients/read-json";

// SSO OIDC is REST-JSON on /client/register, /device_authorization and /token
// with the `sso-oauth` credential scope, camelCase members, and OIDC-style
// error bodies ({error, error_description}). Floci verifies no signatures, so a
// synthetic SigV4-shaped Authorization header carrying the scope suffices.
async function oidcCall(path: string, body: Record<string, unknown>): Promise<any> {
  const amzDate = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const res = await fetch(`${getFlociEndpoint()}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-amz-date": amzDate,
      authorization: `AWS4-HMAC-SHA256 Credential=test/${amzDate.slice(0, 8)}/us-east-1/sso-oauth/aws4_request, SignedHeaders=content-type;host;x-amz-date, Signature=${"0".repeat(64)}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err: any = new Error(
      data.error_description || data.error || "Request failed"
    );
    err.name = String(data.error || "SSOOIDCError");
    throw err;
  }
  return data;
}

const router = new Hono();

router.post("/clients", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.clientName) return c.json({ error: "clientName is required" }, 400);
  const result = await oidcCall("/client/register", {
    clientName: body.clientName,
    clientType: "public",
    scopes: body.scopes,
  });
  return c.json({
    clientId: result.clientId,
    clientSecret: result.clientSecret,
    clientIdIssuedAt: result.clientIdIssuedAt,
    clientSecretExpiresAt: result.clientSecretExpiresAt,
    authorizationEndpoint: result.authorizationEndpoint,
    tokenEndpoint: result.tokenEndpoint,
  });
});

router.post("/device-authorization", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.clientId) return c.json({ error: "clientId is required" }, 400);
  if (!body?.clientSecret) return c.json({ error: "clientSecret is required" }, 400);
  const result = await oidcCall("/device_authorization", {
    clientId: body.clientId,
    clientSecret: body.clientSecret,
    startUrl: body.startUrl,
  });
  return c.json({
    deviceCode: result.deviceCode,
    userCode: result.userCode,
    verificationUri: result.verificationUri,
    verificationUriComplete: result.verificationUriComplete,
    expiresIn: result.expiresIn,
    interval: result.interval,
  });
});

router.post("/token", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.clientId) return c.json({ error: "clientId is required" }, 400);
  if (!body?.clientSecret) return c.json({ error: "clientSecret is required" }, 400);
  const result = await oidcCall("/token", {
    clientId: body.clientId,
    clientSecret: body.clientSecret,
    grantType: "urn:ietf:params:oauth:grant-type:device_code",
    deviceCode: body.deviceCode,
  });
  return c.json({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresIn: result.expiresIn,
    tokenType: result.tokenType,
  });
});

export default router;
