import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  STSClient,
  GetCallerIdentityCommand,
  AssumeRoleCommand,
  GetSessionTokenCommand,
  AssumeRoleWithSAMLCommand,
  AssumeRoleWithWebIdentityCommand,
  GetFederationTokenCommand,
  DecodeAuthorizationMessageCommand,
} from "@aws-sdk/client-sts";

const router = new Hono();
const getClient = () => create(STSClient);

// ─── Get Caller Identity ─────────────────────────────────

router.get("/caller-identity", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetCallerIdentityCommand({}));
  return c.json({
    account: result.Account,
    arn: result.Arn,
    userId: result.UserId,
  });
});

// ─── Assume Role ─────────────────────────────────────────

router.post("/assume-role", async (c: Context) => {
  const body = await c.req.json();
  if (!body.roleArn) return c.json({ error: "roleArn is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new AssumeRoleCommand({
      RoleArn: body.roleArn,
      RoleSessionName: body.sessionName || "dashboard-session",
      DurationSeconds: body.durationSeconds,
      Policy: body.policy,
      PolicyArns: body.policyArns,
      Tags: body.tags,
    })
  );

  return c.json({
    credentials: result.Credentials
      ? {
          accessKeyId: result.Credentials.AccessKeyId,
          secretAccessKey: result.Credentials.SecretAccessKey,
          sessionToken: result.Credentials.SessionToken,
          expiration: result.Credentials.Expiration?.toISOString(),
        }
      : null,
    assumedRoleUser: result.AssumedRoleUser
      ? {
          assumedRoleId: result.AssumedRoleUser.AssumedRoleId,
          arn: result.AssumedRoleUser.Arn,
        }
      : null,
  });
});

// ─── Get Session Token ───────────────────────────────────

router.post("/session-token", async (c: Context) => {
  const body = await c.req.json();

  const client = getClient();
  const result = await client.send(
    new GetSessionTokenCommand({
      DurationSeconds: body.durationSeconds,
      SerialNumber: body.serialNumber,
      TokenCode: body.tokenCode,
    })
  );

  return c.json({
    credentials: result.Credentials
      ? {
          accessKeyId: result.Credentials.AccessKeyId,
          secretAccessKey: result.Credentials.SecretAccessKey,
          sessionToken: result.Credentials.SessionToken,
          expiration: result.Credentials.Expiration?.toISOString(),
        }
      : null,
  });
});


router.post("/assume-role-with-saml", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.roleArn) return c.json({ error: "roleArn is required" }, 400);
  if (!body.principalArn) return c.json({ error: "principalArn is required" }, 400);
  if (!body.samlAssertion) return c.json({ error: "samlAssertion is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new AssumeRoleWithSAMLCommand({
      RoleArn: body.roleArn,
      PrincipalArn: body.principalArn,
      SAMLAssertion: body.samlAssertion,
      DurationSeconds: body.durationSeconds,
    })
  );
  return c.json({
    credentials: result.Credentials
      ? {
          accessKeyId: result.Credentials.AccessKeyId,
          secretAccessKey: result.Credentials.SecretAccessKey,
          sessionToken: result.Credentials.SessionToken,
          expiration: result.Credentials.Expiration,
        }
      : null,
  });
});

router.post("/assume-role-with-web-identity", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.roleArn) return c.json({ error: "roleArn is required" }, 400);
  if (!body.webIdentityToken) return c.json({ error: "webIdentityToken is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new AssumeRoleWithWebIdentityCommand({
      RoleArn: body.roleArn,
      RoleSessionName: body.roleSessionName,
      WebIdentityToken: body.webIdentityToken,
      DurationSeconds: body.durationSeconds,
    })
  );
  return c.json({
    credentials: result.Credentials
      ? {
          accessKeyId: result.Credentials.AccessKeyId,
          secretAccessKey: result.Credentials.SecretAccessKey,
          sessionToken: result.Credentials.SessionToken,
          expiration: result.Credentials.Expiration,
        }
      : null,
  });
});

router.post("/federation-token", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new GetFederationTokenCommand({
      Name: body.name,
      DurationSeconds: body.durationSeconds,
      Policy: body.policy,
    })
  );
  return c.json({
    credentials: result.Credentials
      ? {
          accessKeyId: result.Credentials.AccessKeyId,
          secretAccessKey: result.Credentials.SecretAccessKey,
          sessionToken: result.Credentials.SessionToken,
          expiration: result.Credentials.Expiration,
        }
      : null,
    federatedUser: result.FederatedUser
      ? { arn: (result.FederatedUser as any).FederatedUserId, accountId: (result.FederatedUser as any).AccountId }
      : null,
  });
});

router.post("/decode-authorization-message", async (c: Context) => {
  const body = await c.req.json<{ encodedMessage?: string }>();
  if (!body.encodedMessage) return c.json({ error: "encodedMessage is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new DecodeAuthorizationMessageCommand({ EncodedMessage: body.encodedMessage })
  );
  return c.json({ decodedMessage: result.DecodedMessage || "" });
});

export default router;