import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { TransferClient } from "@aws-sdk/client-transfer";
import {
  UpdateServerCommand,
  UpdateUserCommand,
  ImportSshPublicKeyCommand,
  DeleteSshPublicKeyCommand,
} from "@aws-sdk/client-transfer";
import {
  ListServersCommand,
  CreateServerCommand,
  DescribeServerCommand,
  DeleteServerCommand,
  StartServerCommand,
  StopServerCommand,
  ListUsersCommand,
  CreateUserCommand,
  DescribeUserCommand,
  DeleteUserCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from "@aws-sdk/client-transfer";

const router = new Hono();
const getClient = () => create(TransferClient);

router.get("/servers", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListServersCommand({}));
  if (!result.Servers?.length) return c.json({ servers: [], total: 0 });
  const detailed = await Promise.all(
    result.Servers.map((s: any) =>
      client.send(new DescribeServerCommand({ ServerId: s.ServerId }))
    )
  );
  return c.json({
    servers: detailed.map((d: any) => d.Server),
    total: detailed.length,
  });
});

router.post("/servers", async (c: Context) => {
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(
    new CreateServerCommand({
      Domain: body.domain || "S3",
      IdentityProviderType: body.identityProviderType || "SERVICE_MANAGED",
      ...body,
    })
  );
  return c.json({ serverId: result.ServerId, created: true }, 201);
});

router.get("/servers/:serverId", async (c: Context) => {
  const serverId = c.req.param("serverId");
  const client = getClient();
  const result = await client.send(
    new DescribeServerCommand({ ServerId: serverId })
  );
  return c.json({ server: result.Server });
});

router.delete("/servers/:serverId", async (c: Context) => {
  const serverId = c.req.param("serverId");
  const client = getClient();
  await client.send(new DeleteServerCommand({ ServerId: serverId }));
  return c.json({ deleted: true });
});

router.post("/servers/:serverId/start", async (c: Context) => {
  const serverId = c.req.param("serverId");
  const client = getClient();
  await client.send(new StartServerCommand({ ServerId: serverId }));
  return c.json({ started: true });
});

router.post("/servers/:serverId/stop", async (c: Context) => {
  const serverId = c.req.param("serverId");
  const client = getClient();
  await client.send(new StopServerCommand({ ServerId: serverId }));
  return c.json({ stopped: true });
});

router.get("/servers/:serverId/users", async (c: Context) => {
  const serverId = c.req.param("serverId");
  const client = getClient();
  const result = await client.send(new ListUsersCommand({ ServerId: serverId }));
  if (!result.Users?.length) return c.json({ users: [], total: 0 });
  const detailed = await Promise.all(
    result.Users.map((u: any) =>
      client.send(
        new DescribeUserCommand({ ServerId: serverId, UserName: u.UserName })
      )
    )
  );
  return c.json({
    users: detailed.map((d: any) => d.User),
    total: detailed.length,
  });
});

router.post("/servers/:serverId/users", async (c: Context) => {
  const serverId = c.req.param("serverId");
  const body = await c.req.json();
  if (!body.userName) return c.json({ error: "userName is required" }, 400);
  if (!body.role) return c.json({ error: "role is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateUserCommand({
      ServerId: serverId,
      UserName: body.userName,
      Role: body.role,
      HomeDirectory: body.homeDirectory,
    })
  );
  return c.json({ userName: result.UserName, serverId: result.ServerId, created: true }, 201);
});

router.get("/servers/:serverId/users/:userName", async (c: Context) => {
  const serverId = c.req.param("serverId");
  const userName = c.req.param("userName");
  const client = getClient();
  const result = await client.send(
    new DescribeUserCommand({ ServerId: serverId, UserName: userName })
  );
  return c.json({ user: result.User });
});

router.delete("/servers/:serverId/users/:userName", async (c: Context) => {
  const serverId = c.req.param("serverId");
  const userName = c.req.param("userName");
  const client = getClient();
  await client.send(
    new DeleteUserCommand({ ServerId: serverId, UserName: userName })
  );
  return c.json({ deleted: true });
});

router.get("/tags", async (c: Context) => {
  const resourceArn = c.req.query("resourceArn");
  if (!resourceArn)
    return c.json({ error: "resourceArn query parameter required" }, 400);
  const client = getClient();
  const result = await client.send(
    new ListTagsForResourceCommand({ Arn: resourceArn })
  );
  return c.json({ tags: result.Tags || [] });
});

router.post("/tags", async (c: Context) => {
  const body = await c.req.json();
  const client = getClient();
  await client.send(
    new TagResourceCommand({
      Arn: body.resourceArn,
      Tags: (body.tags || []).map((t: any) => ({
        Key: t.key,
        Value: t.value,
      })),
    })
  );
  return c.json({ tagged: true });
});

router.delete("/tags", async (c: Context) => {
  const resourceArn = c.req.query("resourceArn");
  const tagKeys = c.req.query("tagKeys")?.split(",") || [];
  if (!resourceArn)
    return c.json({ error: "resourceArn query parameter required" }, 400);
  const client = getClient();
  await client.send(
    new UntagResourceCommand({ Arn: resourceArn, TagKeys: tagKeys })
  );
  return c.json({ untagged: true });
});


router.put("/servers/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(
    new UpdateServerCommand({
      ServerId: id,
      Protocols: body.protocols,
      EndpointType: body.endpointType,
      LoggingRole: body.loggingRole,
      SecurityPolicyName: body.securityPolicyName,
    })
  );
  return c.json({ serverId: result.ServerId || id });
});

router.put("/servers/:id/users/:userName", async (c: Context) => {
  const id = c.req.param("id")!;
  const userName = c.req.param("userName")!;
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(
    new UpdateUserCommand({
      ServerId: id,
      UserName: userName,
      Role: body.role,
      HomeDirectory: body.homeDirectory,
      HomeDirectoryType: body.homeDirectoryType,
    })
  );
  return c.json({ serverId: result.ServerId || id, userName: result.UserName || userName });
});

router.post("/servers/:id/users/:userName/ssh-keys", async (c: Context) => {
  const id = c.req.param("id")!;
  const userName = c.req.param("userName")!;
  const body = await c.req.json<any>();
  if (!body.sshPublicKeyBody) return c.json({ error: "sshPublicKeyBody is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new ImportSshPublicKeyCommand({
      ServerId: id,
      UserName: userName,
      SshPublicKeyBody: body.sshPublicKeyBody,
    })
  );
  return c.json({ sshPublicKeyId: result.SshPublicKeyId }, 201);
});

router.delete("/servers/:id/users/:userName/ssh-keys/:keyId", async (c: Context) => {
  const id = c.req.param("id")!;
  const userName = c.req.param("userName")!;
  const keyId = c.req.param("keyId")!;
  const client = getClient();
  await client.send(
    new DeleteSshPublicKeyCommand({
      ServerId: id,
      UserName: userName,
      SshPublicKeyId: keyId,
    })
  );
  return c.json({ deleted: true });
});

export default router;