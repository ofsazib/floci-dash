import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import {
  ListUserPoolsCommand,
  DescribeUserPoolCommand,
  CreateUserPoolCommand,
  DeleteUserPoolCommand,
  ListUsersCommand,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminSetUserPasswordCommand,
  ListGroupsCommand,
  CreateGroupCommand,
  DeleteGroupCommand,
  ListUserPoolClientsCommand,
  DescribeUserPoolClientCommand,
  CreateUserPoolClientCommand,
  DeleteUserPoolClientCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const router = new Hono();
const getClient = () => create(CognitoIdentityProviderClient);

// ── User Pools ───────────────────────────────────────────

router.get("/user-pools", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListUserPoolsCommand({ MaxResults: 60 }));
  const userPools = result.UserPools || [];
  return c.json({ userPools, total: userPools.length });
});

router.get("/user-pools/:id", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  const result = await client.send(new DescribeUserPoolCommand({ UserPoolId: id }));
  return c.json({ userPool: result.UserPool });
});

router.post("/user-pools", async (c: Context) => {
  const body = await c.req.json<{ poolName: string }>();
  if (!body.poolName) return c.json({ error: "poolName is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new CreateUserPoolCommand({ PoolName: body.poolName })
  );
  return c.json({ userPool: result.UserPool }, 201);
});

router.delete("/user-pools/:id", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  await client.send(new DeleteUserPoolCommand({ UserPoolId: id }));
  return c.json({ deleted: true });
});

// ── Users ────────────────────────────────────────────────

router.get("/user-pools/:id/users", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  const result = await client.send(new ListUsersCommand({ UserPoolId: id }));
  const users = result.Users || [];
  return c.json({ users, total: users.length });
});

router.post("/user-pools/:id/users", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<{
    username: string;
    temporaryPassword?: string;
    userAttributes?: { Name: string; Value: string }[];
  }>();
  if (!body.username) return c.json({ error: "username is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new AdminCreateUserCommand({
      UserPoolId: id,
      Username: body.username,
      TemporaryPassword: body.temporaryPassword,
      UserAttributes: body.userAttributes,
    })
  );
  return c.json({ user: result.User }, 201);
});

router.delete("/user-pools/:id/users/:username", async (c: Context) => {
  const id = c.req.param("id");
  const username = c.req.param("username");
  const client = getClient();
  await client.send(new AdminDeleteUserCommand({ UserPoolId: id, Username: username }));
  return c.json({ deleted: true });
});

router.put("/user-pools/:id/users/:username/disable", async (c: Context) => {
  const id = c.req.param("id");
  const username = c.req.param("username");
  const client = getClient();
  await client.send(new AdminDisableUserCommand({ UserPoolId: id, Username: username }));
  return c.json({ disabled: true });
});

router.put("/user-pools/:id/users/:username/enable", async (c: Context) => {
  const id = c.req.param("id");
  const username = c.req.param("username");
  const client = getClient();
  await client.send(new AdminEnableUserCommand({ UserPoolId: id, Username: username }));
  return c.json({ enabled: true });
});

router.put("/user-pools/:id/users/:username/password", async (c: Context) => {
  const id = c.req.param("id");
  const username = c.req.param("username");
  const body = await c.req.json<{ password: string; permanent?: boolean }>();
  if (!body.password) return c.json({ error: "password is required" }, 400);
  const client = getClient();
  await client.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: id,
      Username: username,
      Password: body.password,
      Permanent: body.permanent ?? true,
    })
  );
  return c.json({ updated: true });
});

// ── Groups ───────────────────────────────────────────────

router.get("/user-pools/:id/groups", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  const result = await client.send(new ListGroupsCommand({ UserPoolId: id }));
  const groups = result.Groups || [];
  return c.json({ groups, total: groups.length });
});

router.post("/user-pools/:id/groups", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<{
    groupName: string;
    description?: string;
    precedence?: number;
    roleArn?: string;
  }>();
  if (!body.groupName) return c.json({ error: "groupName is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new CreateGroupCommand({
      UserPoolId: id,
      GroupName: body.groupName,
      Description: body.description,
      Precedence: body.precedence,
      RoleArn: body.roleArn,
    })
  );
  return c.json({ group: result.Group }, 201);
});

router.delete("/user-pools/:id/groups/:groupName", async (c: Context) => {
  const id = c.req.param("id");
  const groupName = c.req.param("groupName");
  const client = getClient();
  await client.send(new DeleteGroupCommand({ UserPoolId: id, GroupName: groupName }));
  return c.json({ deleted: true });
});

// ── User Pool Clients ────────────────────────────────────

router.get("/user-pools/:id/clients", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  const result = await client.send(new ListUserPoolClientsCommand({ UserPoolId: id }));
  const clients = result.UserPoolClients || [];
  return c.json({ clients, total: clients.length });
});

router.get("/user-pools/:id/clients/:clientId", async (c: Context) => {
  const id = c.req.param("id");
  const clientId = c.req.param("clientId");
  const client = getClient();
  const result = await client.send(
    new DescribeUserPoolClientCommand({ UserPoolId: id, ClientId: clientId })
  );
  return c.json({ client: result.UserPoolClient });
});

router.post("/user-pools/:id/clients", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<{
    clientName: string;
    generateSecret?: boolean;
    callbackURLs?: string[];
    logoutURLs?: string[];
    allowedOAuthFlowsUserPoolClient?: boolean;
  }>();
  if (!body.clientName) return c.json({ error: "clientName is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new CreateUserPoolClientCommand({
      UserPoolId: id,
      ClientName: body.clientName,
      GenerateSecret: body.generateSecret,
      CallbackURLs: body.callbackURLs,
      LogoutURLs: body.logoutURLs,
      AllowedOAuthFlowsUserPoolClient: body.allowedOAuthFlowsUserPoolClient,
    })
  );
  return c.json({ client: result.UserPoolClient }, 201);
});

router.delete("/user-pools/:id/clients/:clientId", async (c: Context) => {
  const id = c.req.param("id");
  const clientId = c.req.param("clientId");
  const client = getClient();
  await client.send(new DeleteUserPoolClientCommand({ UserPoolId: id, ClientId: clientId }));
  return c.json({ deleted: true });
});

export default router;
