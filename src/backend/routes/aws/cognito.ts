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
  ListResourceServersCommand,
  CreateResourceServerCommand,
  DescribeResourceServerCommand,
  UpdateResourceServerCommand,
  DeleteResourceServerCommand,
  GetUserPoolMfaConfigCommand,
  SetUserPoolMfaConfigCommand,
  AddCustomAttributesCommand,
  AdminDeleteUserAttributesCommand,
  AdminUserGlobalSignOutCommand,
  AdminConfirmSignUpCommand,
  AdminListGroupsForUserCommand,
  ListUsersInGroupCommand,
  ListUserPoolClientSecretsCommand,
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

// ── Client Secrets ───────────────────────────────────────

router.get("/user-pools/:id/clients/:clientId/secrets", async (c: Context) => {
  const id = c.req.param("id");
  const clientId = c.req.param("clientId");
  const client = getClient();
  const result = await client.send(new ListUserPoolClientSecretsCommand({ UserPoolId: id, ClientId: clientId }));
  return c.json({ secrets: result.Secrets || [] });
});

// ── Resource Servers ─────────────────────────────────────

router.get("/user-pools/:id/resource-servers", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  const result = await client.send(new ListResourceServersCommand({ UserPoolId: id, MaxResults: 60 }));
  return c.json({ resourceServers: result.ResourceServers || [], total: result.ResourceServers?.length || 0 });
});

router.post("/user-pools/:id/resource-servers", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ identifier: string; name: string; scopes?: { ScopeName: string; ScopeDescription: string }[] }>();
  if (!body.identifier || !body.name) return c.json({ error: "identifier and name are required" }, 400);
  const client = getClient();
  await client.send(new CreateResourceServerCommand({
    UserPoolId: id, Identifier: body.identifier, Name: body.name, Scopes: body.scopes,
  }));
  return c.json({ created: true }, 201);
});

router.get("/user-pools/:id/resource-servers/:identifier", async (c: Context) => {
  const id = c.req.param("id");
  const identifier = c.req.param("identifier");
  const client = getClient();
  const result = await client.send(new DescribeResourceServerCommand({ UserPoolId: id, Identifier: identifier }));
  return c.json({ resourceServer: result.ResourceServer });
});

router.put("/user-pools/:id/resource-servers/:identifier", async (c: Context) => {
  const id = c.req.param("id");
  const identifier = c.req.param("identifier");
  const body = await c.req.json<{ name: string; scopes?: { ScopeName: string; ScopeDescription: string }[] }>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const client = getClient();
  await client.send(new UpdateResourceServerCommand({
    UserPoolId: id, Identifier: identifier, Name: body.name, Scopes: body.scopes,
  }));
  return c.json({ updated: true });
});

router.delete("/user-pools/:id/resource-servers/:identifier", async (c: Context) => {
  const id = c.req.param("id");
  const identifier = c.req.param("identifier");
  const client = getClient();
  await client.send(new DeleteResourceServerCommand({ UserPoolId: id, Identifier: identifier }));
  return c.json({ deleted: true });
});

// ── MFA Config ───────────────────────────────────────────

router.get("/user-pools/:id/mfa-config", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  const result = await client.send(new GetUserPoolMfaConfigCommand({ UserPoolId: id }));
  return c.json({
    mfaConfiguration: result.MfaConfiguration,
    smsMfaConfiguration: result.SmsMfaConfiguration,
    softwareTokenMfaConfiguration: result.SoftwareTokenMfaConfiguration,
  });
});

router.put("/user-pools/:id/mfa-config", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ mfaConfiguration: string; smsAuthenticationMessage?: string }>();
  if (!body.mfaConfiguration) return c.json({ error: "mfaConfiguration is required" }, 400);
  const client = getClient();
  await client.send(new SetUserPoolMfaConfigCommand({
    UserPoolId: id,
    MfaConfiguration: body.mfaConfiguration as any,
    SmsMfaConfiguration: body.smsAuthenticationMessage ? {
      SmsAuthenticationMessage: body.smsAuthenticationMessage,
      SmsConfiguration: { SnsCallerArn: "" },
    } : undefined,
    SoftwareTokenMfaConfiguration: body.mfaConfiguration === "ON" ? { Enabled: true } : undefined,
  }));
  return c.json({ updated: true });
});

// ── Custom Attributes ────────────────────────────────────

router.post("/user-pools/:id/custom-attributes", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ customAttributes: { Name: string; AttributeDataType?: string; Mutable?: boolean; Required?: boolean }[] }>();
  if (!body.customAttributes?.length) return c.json({ error: "customAttributes is required" }, 400);
  const client = getClient();
  await client.send(new AddCustomAttributesCommand({
    UserPoolId: id, CustomAttributes: body.customAttributes,
  }));
  return c.json({ added: true });
});

// ── Admin User Operations ────────────────────────────────

router.post("/user-pools/:id/users/:username/delete-attributes", async (c: Context) => {
  const id = c.req.param("id");
  const username = c.req.param("username");
  const body = await c.req.json<{ userAttributeNames: string[] }>();
  if (!body.userAttributeNames?.length) return c.json({ error: "userAttributeNames is required" }, 400);
  const client = getClient();
  await client.send(new AdminDeleteUserAttributesCommand({
    UserPoolId: id, Username: username, UserAttributeNames: body.userAttributeNames,
  }));
  return c.json({ deleted: true });
});

router.post("/user-pools/:id/users/:username/sign-out", async (c: Context) => {
  const id = c.req.param("id");
  const username = c.req.param("username");
  const client = getClient();
  await client.send(new AdminUserGlobalSignOutCommand({ UserPoolId: id, Username: username }));
  return c.json({ signedOut: true });
});

router.post("/user-pools/:id/users/:username/confirm", async (c: Context) => {
  const id = c.req.param("id");
  const username = c.req.param("username");
  const client = getClient();
  await client.send(new AdminConfirmSignUpCommand({ UserPoolId: id, Username: username }));
  return c.json({ confirmed: true });
});

router.get("/user-pools/:id/users/:username/groups", async (c: Context) => {
  const id = c.req.param("id");
  const username = c.req.param("username");
  const client = getClient();
  const result = await client.send(new AdminListGroupsForUserCommand({ UserPoolId: id, Username: username }));
  return c.json({ groups: result.Groups || [], total: result.Groups?.length || 0 });
});

// ── Group Members ────────────────────────────────────────

router.get("/user-pools/:id/groups/:groupName/users", async (c: Context) => {
  const id = c.req.param("id");
  const groupName = c.req.param("groupName");
  const client = getClient();
  const result = await client.send(new ListUsersInGroupCommand({ UserPoolId: id, GroupName: groupName }));
  return c.json({ users: result.Users || [], total: result.Users?.length || 0 });
});

export default router;
