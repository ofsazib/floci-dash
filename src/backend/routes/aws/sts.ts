import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  STSClient,
  GetCallerIdentityCommand,
  AssumeRoleCommand,
  GetSessionTokenCommand,
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

export default router;
