import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-cognito-identity-provider", () => ({
  CognitoIdentityProviderClient: vi.fn(function () {
    return { send: mockSend };
  }),
  ListUserPoolsCommand: createCmd("ListUserPoolsCommand"),
  DescribeUserPoolCommand: createCmd("DescribeUserPoolCommand"),
  CreateUserPoolCommand: createCmd("CreateUserPoolCommand"),
  DeleteUserPoolCommand: createCmd("DeleteUserPoolCommand"),
  ListUsersCommand: createCmd("ListUsersCommand"),
  AdminCreateUserCommand: createCmd("AdminCreateUserCommand"),
  AdminDeleteUserCommand: createCmd("AdminDeleteUserCommand"),
  AdminDisableUserCommand: createCmd("AdminDisableUserCommand"),
  AdminEnableUserCommand: createCmd("AdminEnableUserCommand"),
  AdminSetUserPasswordCommand: createCmd("AdminSetUserPasswordCommand"),
  ListGroupsCommand: createCmd("ListGroupsCommand"),
  CreateGroupCommand: createCmd("CreateGroupCommand"),
  DeleteGroupCommand: createCmd("DeleteGroupCommand"),
  ListUserPoolClientsCommand: createCmd("ListUserPoolClientsCommand"),
  DescribeUserPoolClientCommand: createCmd("DescribeUserPoolClientCommand"),
  CreateUserPoolClientCommand: createCmd("CreateUserPoolClientCommand"),
  DeleteUserPoolClientCommand: createCmd("DeleteUserPoolClientCommand"),
  ListResourceServersCommand: createCmd("ListResourceServersCommand"),
  CreateResourceServerCommand: createCmd("CreateResourceServerCommand"),
  DescribeResourceServerCommand: createCmd("DescribeResourceServerCommand"),
  UpdateResourceServerCommand: createCmd("UpdateResourceServerCommand"),
  DeleteResourceServerCommand: createCmd("DeleteResourceServerCommand"),
  GetUserPoolMfaConfigCommand: createCmd("GetUserPoolMfaConfigCommand"),
  SetUserPoolMfaConfigCommand: createCmd("SetUserPoolMfaConfigCommand"),
  AddCustomAttributesCommand: createCmd("AddCustomAttributesCommand"),
  AdminDeleteUserAttributesCommand: createCmd("AdminDeleteUserAttributesCommand"),
  AdminUserGlobalSignOutCommand: createCmd("AdminUserGlobalSignOutCommand"),
  AdminConfirmSignUpCommand: createCmd("AdminConfirmSignUpCommand"),
  AdminListGroupsForUserCommand: createCmd("AdminListGroupsForUserCommand"),
  ListUsersInGroupCommand: createCmd("ListUsersInGroupCommand"),
  ListUserPoolClientSecretsCommand: createCmd("ListUserPoolClientSecretsCommand"),
  AddUserPoolClientSecretCommand: createCmd("AddUserPoolClientSecretCommand"),
  DeleteUserPoolClientSecretCommand: createCmd("DeleteUserPoolClientSecretCommand"),
  InitiateAuthCommand: createCmd("InitiateAuthCommand"),
  AdminInitiateAuthCommand: createCmd("AdminInitiateAuthCommand"),
  ConfirmSignUpCommand: createCmd("ConfirmSignUpCommand"),
  AdminRespondToAuthChallengeCommand: createCmd("AdminRespondToAuthChallengeCommand"),
  ForgotPasswordCommand: createCmd("ForgotPasswordCommand"),
  ConfirmForgotPasswordCommand: createCmd("ConfirmForgotPasswordCommand"),
  GetUserCommand: createCmd("GetUserCommand"),
  UpdateUserAttributesCommand: createCmd("UpdateUserAttributesCommand"),
  DeleteUserAttributesCommand: createCmd("DeleteUserAttributesCommand"),
  AdminGetUserCommand: createCmd("AdminGetUserCommand"),
  AdminRemoveUserFromGroupCommand: createCmd("AdminRemoveUserFromGroupCommand"),
  AdminResetUserPasswordCommand: createCmd("AdminResetUserPasswordCommand"),
  AdminUpdateUserAttributesCommand: createCmd("AdminUpdateUserAttributesCommand"),
  ChangePasswordCommand: createCmd("ChangePasswordCommand"),
  SignUpCommand: createCmd("SignUpCommand"),
  RespondToAuthChallengeCommand: createCmd("RespondToAuthChallengeCommand"),
  GetGroupCommand: createCmd("GetGroupCommand"),
  UpdateGroupCommand: createCmd("UpdateGroupCommand"),
  UpdateUserPoolCommand: createCmd("UpdateUserPoolCommand"),
  UpdateUserPoolClientCommand: createCmd("UpdateUserPoolClientCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: (Ctor: any, extra?: any) => new Ctor(extra),
}));

import router from "./cognito";

async function get(path: string) {
  return router.request(path, { method: "GET" });
}

async function post(path: string, body?: any) {
  return router.request(path, {
    method: "POST",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function put(path: string, body?: any) {
  return router.request(path, {
    method: "PUT",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function del(path: string) {
  return router.request(path, { method: "DELETE" });
}

beforeEach(() => {
  mockSend.mockReset();
});

describe("Cognito Routes", () => {
  describe("User Pools", () => {
    it("GET /user-pools — lists pools", async () => {
      mockSend.mockResolvedValueOnce({
        UserPools: [{ Id: "us-east-1_abc", Name: "mypool", Status: "Enabled" }],
      });
      const res = await get("/user-pools");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /user-pools — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ UserPools: [] });
      const res = await get("/user-pools");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /user-pools — sparse response defaults to empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/user-pools");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.userPools).toEqual([]);
    });

    it("GET /user-pools/:id — describes pool", async () => {
      mockSend.mockResolvedValueOnce({ UserPool: { Id: "us-east-1_abc", Name: "mypool" } });
      const res = await get("/user-pools/us-east-1_abc");
      expect(res.status).toBe(200);
    });

    it("POST /user-pools — creates pool (201)", async () => {
      mockSend.mockResolvedValueOnce({ UserPool: { Id: "us-east-1_new", Name: "newpool" } });
      const res = await post("/user-pools", { poolName: "newpool" });
      expect(res.status).toBe(201);
    });

    it("POST /user-pools — 400 if poolName missing", async () => {
      const res = await post("/user-pools", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /user-pools/:id — deletes pool", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/user-pools/us-east-1_abc");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Users", () => {
    it("GET /user-pools/:id/users — lists users", async () => {
      mockSend.mockResolvedValueOnce({
        Users: [{ Username: "user1", UserStatus: "CONFIRMED", Enabled: true }],
      });
      const res = await get("/user-pools/us-east-1_abc/users");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /user-pools/:id/users — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ Users: [] });
      const res = await get("/user-pools/us-east-1_abc/users");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /user-pools/:id/users — sparse response defaults to empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/user-pools/us-east-1_abc/users");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.users).toEqual([]);
    });

    it("POST /user-pools/:id/users — creates user (201)", async () => {
      mockSend.mockResolvedValueOnce({ User: { Username: "user1" } });
      const res = await post("/user-pools/us-east-1_abc/users", { username: "user1" });
      expect(res.status).toBe(201);
    });

    it("POST /user-pools/:id/users — 400 if username missing", async () => {
      const res = await post("/user-pools/us-east-1_abc/users", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /user-pools/:id/users/:username — deletes user", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/user-pools/us-east-1_abc/users/user1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });

    it("PUT /user-pools/:id/users/:username/disable — disables user", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/user-pools/us-east-1_abc/users/user1/disable");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.disabled).toBe(true);
    });

    it("PUT /user-pools/:id/users/:username/enable — enables user", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/user-pools/us-east-1_abc/users/user1/enable");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.enabled).toBe(true);
    });

    it("PUT /user-pools/:id/users/:username/password — sets password", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/user-pools/us-east-1_abc/users/user1/password", {
        password: "NewPass123!",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
    });

    it("PUT /user-pools/:id/users/:username/password — 400 if password missing", async () => {
      const res = await put("/user-pools/us-east-1_abc/users/user1/password", {});
      expect(res.status).toBe(400);
    });
  });

  describe("Groups", () => {
    it("GET /user-pools/:id/groups — lists groups", async () => {
      mockSend.mockResolvedValueOnce({
        Groups: [{ GroupName: "admins", UserPoolId: "us-east-1_abc" }],
      });
      const res = await get("/user-pools/us-east-1_abc/groups");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /user-pools/:id/groups — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ Groups: [] });
      const res = await get("/user-pools/us-east-1_abc/groups");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /user-pools/:id/groups — sparse response defaults to empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/user-pools/us-east-1_abc/groups");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.groups).toEqual([]);
    });

    it("POST /user-pools/:id/groups — creates group (201)", async () => {
      mockSend.mockResolvedValueOnce({ Group: { GroupName: "admins" } });
      const res = await post("/user-pools/us-east-1_abc/groups", { groupName: "admins" });
      expect(res.status).toBe(201);
    });

    it("POST /user-pools/:id/groups — 400 if groupName missing", async () => {
      const res = await post("/user-pools/us-east-1_abc/groups", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /user-pools/:id/groups/:groupName — deletes group", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/user-pools/us-east-1_abc/groups/admins");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("User Pool Clients", () => {
    it("GET /user-pools/:id/clients — lists clients", async () => {
      mockSend.mockResolvedValueOnce({
        UserPoolClients: [{ ClientId: "client-1", ClientName: "myapp" }],
      });
      const res = await get("/user-pools/us-east-1_abc/clients");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /user-pools/:id/clients — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ UserPoolClients: [] });
      const res = await get("/user-pools/us-east-1_abc/clients");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /user-pools/:id/clients — sparse response defaults to empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/user-pools/us-east-1_abc/clients");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.clients).toEqual([]);
    });

    it("GET /user-pools/:id/clients/:clientId — describes client", async () => {
      mockSend.mockResolvedValueOnce({ UserPoolClient: { ClientId: "client-1" } });
      const res = await get("/user-pools/us-east-1_abc/clients/client-1");
      expect(res.status).toBe(200);
    });

    it("POST /user-pools/:id/clients — creates client (201)", async () => {
      mockSend.mockResolvedValueOnce({ UserPoolClient: { ClientId: "new-client" } });
      const res = await post("/user-pools/us-east-1_abc/clients", { clientName: "myapp" });
      expect(res.status).toBe(201);
    });

    it("POST /user-pools/:id/clients — 400 if clientName missing", async () => {
      const res = await post("/user-pools/us-east-1_abc/clients", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /user-pools/:id/clients/:clientId — deletes client", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/user-pools/us-east-1_abc/clients/client-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Resource Servers", () => {
    it("GET /user-pools/:id/resource-servers — lists resource servers", async () => {
      mockSend.mockResolvedValueOnce({
        ResourceServers: [{ Identifier: "https://api.example.com", Name: "My API" }],
      });
      const res = await get("/user-pools/us-east-1_abc/resource-servers");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /user-pools/:id/resource-servers — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ ResourceServers: [] });
      const res = await get("/user-pools/us-east-1_abc/resource-servers");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /user-pools/:id/resource-servers — sparse response defaults to empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/user-pools/us-east-1_abc/resource-servers");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.resourceServers).toEqual([]);
    });

    it("POST /user-pools/:id/resource-servers — creates resource server (201)", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/user-pools/us-east-1_abc/resource-servers", {
        identifier: "https://api.example.com",
        name: "My API",
      });
      expect(res.status).toBe(201);
    });

    it("POST /user-pools/:id/resource-servers — 400 if identifier or name missing", async () => {
      const res1 = await post("/user-pools/us-east-1_abc/resource-servers", {});
      expect(res1.status).toBe(400);
      const res2 = await post("/user-pools/us-east-1_abc/resource-servers", { identifier: "x" });
      expect(res2.status).toBe(400);
    });

    it("GET /user-pools/:id/resource-servers/:identifier — describes resource server", async () => {
      mockSend.mockResolvedValueOnce({ ResourceServer: { Identifier: "x", Name: "X" } });
      const res = await get("/user-pools/us-east-1_abc/resource-servers/x");
      expect(res.status).toBe(200);
    });

    it("PUT /user-pools/:id/resource-servers/:identifier — updates resource server", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/user-pools/us-east-1_abc/resource-servers/x", { name: "Updated" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
    });

    it("PUT /user-pools/:id/resource-servers/:identifier — 400 if name missing", async () => {
      const res = await put("/user-pools/us-east-1_abc/resource-servers/x", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /user-pools/:id/resource-servers/:identifier — deletes resource server", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/user-pools/us-east-1_abc/resource-servers/x");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("MFA Config", () => {
    it("GET /user-pools/:id/mfa-config — returns MFA config", async () => {
      mockSend.mockResolvedValueOnce({ MfaConfiguration: "OFF" });
      const res = await get("/user-pools/us-east-1_abc/mfa-config");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.mfaConfiguration).toBe("OFF");
    });

    it("PUT /user-pools/:id/mfa-config — updates MFA config", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/user-pools/us-east-1_abc/mfa-config", { mfaConfiguration: "ON" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
    });

    it("PUT /user-pools/:id/mfa-config — with smsAuthenticationMessage and non-ON config", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/user-pools/us-east-1_abc/mfa-config", {
        mfaConfiguration: "OPTIONAL",
        smsAuthenticationMessage: "Your code is {####}",
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.SmsMfaConfiguration.SmsAuthenticationMessage).toBe("Your code is {####}");
      expect(cmd.SmsMfaConfiguration.SmsConfiguration.SnsCallerArn).toBe("");
      expect(cmd.SoftwareTokenMfaConfiguration).toBeUndefined();
    });

    it("PUT /user-pools/:id/mfa-config — 400 if mfaConfiguration missing", async () => {
      const res = await put("/user-pools/us-east-1_abc/mfa-config", {});
      expect(res.status).toBe(400);
    });
  });

  describe("Custom Attributes", () => {
    it("POST /user-pools/:id/custom-attributes — adds custom attributes", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/user-pools/us-east-1_abc/custom-attributes", {
        customAttributes: [{ Name: "custom:role", AttributeDataType: "string" }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.added).toBe(true);
    });

    it("POST /user-pools/:id/custom-attributes — 400 if customAttributes missing", async () => {
      const res = await post("/user-pools/us-east-1_abc/custom-attributes", {});
      expect(res.status).toBe(400);
    });
  });

  describe("Admin User Operations", () => {
    it("POST /user-pools/:id/users/:username/delete-attributes — deletes user attributes", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/user-pools/us-east-1_abc/users/user1/delete-attributes", {
        userAttributeNames: ["custom:role"],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });

    it("POST /user-pools/:id/users/:username/delete-attributes — 400 if userAttributeNames missing", async () => {
      const res = await post("/user-pools/us-east-1_abc/users/user1/delete-attributes", {});
      expect(res.status).toBe(400);
    });

    it("POST /user-pools/:id/users/:username/sign-out — signs out user", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/user-pools/us-east-1_abc/users/user1/sign-out");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.signedOut).toBe(true);
    });

    it("POST /user-pools/:id/users/:username/confirm — confirms sign up", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/user-pools/us-east-1_abc/users/user1/confirm");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.confirmed).toBe(true);
    });

    it("GET /user-pools/:id/users/:username/groups — lists groups for user", async () => {
      mockSend.mockResolvedValueOnce({ Groups: [{ GroupName: "admins" }] });
      const res = await get("/user-pools/us-east-1_abc/users/user1/groups");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /user-pools/:id/users/:username/groups — sparse response defaults to empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/user-pools/us-east-1_abc/users/user1/groups");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.groups).toEqual([]);
    });
  });

  describe("Group Members", () => {
    it("GET /user-pools/:id/groups/:groupName/users — lists users in group", async () => {
      mockSend.mockResolvedValueOnce({ Users: [{ Username: "user1" }] });
      const res = await get("/user-pools/us-east-1_abc/groups/admins/users");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /user-pools/:id/groups/:groupName/users — returns empty", async () => {
      mockSend.mockResolvedValueOnce({ Users: [] });
      const res = await get("/user-pools/us-east-1_abc/groups/admins/users");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /user-pools/:id/groups/:groupName/users — sparse response defaults to empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/user-pools/us-east-1_abc/groups/admins/users");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.users).toEqual([]);
    });
  });

  describe("Auth Flow Tester", () => {
    it("POST /user-pools/:id/auth/initiate — initiates auth", async () => {
      mockSend.mockResolvedValueOnce({ AuthenticationResult: { AccessToken: "token" } });
      const res = await post("/user-pools/us-east-1_abc/auth/initiate", {
        clientId: "client-1",
        authFlow: "USER_PASSWORD_AUTH",
        authParameters: { USERNAME: "user1", PASSWORD: "pass" },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.result.AuthenticationResult.AccessToken).toBe("token");
    });

    it("POST /user-pools/:id/auth/initiate — 400 if clientId missing", async () => {
      const res = await post("/user-pools/us-east-1_abc/auth/initiate", { authFlow: "USER_PASSWORD_AUTH" });
      expect(res.status).toBe(400);
    });

    it("POST /user-pools/:id/auth/admin-initiate — admin initiates auth", async () => {
      mockSend.mockResolvedValueOnce({ AuthenticationResult: { AccessToken: "token" } });
      const res = await post("/user-pools/us-east-1_abc/auth/admin-initiate", {
        clientId: "client-1",
        authFlow: "ADMIN_NO_SRP_AUTH",
        authParameters: { USERNAME: "user1", PASSWORD: "pass" },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.result.AuthenticationResult.AccessToken).toBe("token");
    });

    it("POST /user-pools/:id/auth/admin-initiate — 400 if authFlow missing", async () => {
      const res = await post("/user-pools/us-east-1_abc/auth/admin-initiate", { clientId: "client-1" });
      expect(res.status).toBe(400);
    });

    it("POST /user-pools/:id/auth/confirm-sign-up — confirms sign up", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/user-pools/us-east-1_abc/auth/confirm-sign-up", {
        clientId: "client-1",
        username: "user1",
        confirmationCode: "123456",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.confirmed).toBe(true);
    });

    it("POST /user-pools/:id/auth/confirm-sign-up — 400 if confirmationCode missing", async () => {
      const res = await post("/user-pools/us-east-1_abc/auth/confirm-sign-up", { clientId: "client-1", username: "user1" });
      expect(res.status).toBe(400);
    });

    it("POST /user-pools/:id/auth/admin-respond-challenge — responds to challenge", async () => {
      mockSend.mockResolvedValueOnce({ AuthenticationResult: { AccessToken: "token" } });
      const res = await post("/user-pools/us-east-1_abc/auth/admin-respond-challenge", {
        clientId: "client-1",
        challengeName: "NEW_PASSWORD_REQUIRED",
        challengeResponses: { USERNAME: "user1", NEW_PASSWORD: "Pass123!" },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.result.AuthenticationResult.AccessToken).toBe("token");
    });

    it("POST /user-pools/:id/auth/admin-respond-challenge — 400 if challengeName missing", async () => {
      const res = await post("/user-pools/us-east-1_abc/auth/admin-respond-challenge", { clientId: "client-1" });
      expect(res.status).toBe(400);
    });

    it("POST /user-pools/:id/auth/forgot-password — starts forgot password", async () => {
      mockSend.mockResolvedValueOnce({ CodeDeliveryDetails: { Destination: "user@example.com" } });
      const res = await post("/user-pools/us-east-1_abc/auth/forgot-password", {
        clientId: "client-1",
        username: "user1",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.result.CodeDeliveryDetails.Destination).toBe("user@example.com");
    });

    it("POST /user-pools/:id/auth/forgot-password — 400 if username missing", async () => {
      const res = await post("/user-pools/us-east-1_abc/auth/forgot-password", { clientId: "client-1" });
      expect(res.status).toBe(400);
    });

    it("POST /user-pools/:id/auth/confirm-forgot-password — confirms forgot password", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/user-pools/us-east-1_abc/auth/confirm-forgot-password", {
        clientId: "client-1",
        username: "user1",
        confirmationCode: "123456",
        password: "NewPass123!",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.result).toBeDefined();
    });

    it("POST /user-pools/:id/auth/confirm-forgot-password — 400 if password missing", async () => {
      const res = await post("/user-pools/us-east-1_abc/auth/confirm-forgot-password", {
        clientId: "client-1",
        username: "user1",
        confirmationCode: "123456",
      });
      expect(res.status).toBe(400);
    });

    it("POST /user-pools/:id/auth/get-user — gets user", async () => {
      mockSend.mockResolvedValueOnce({ Username: "user1" });
      const res = await post("/user-pools/us-east-1_abc/auth/get-user", { accessToken: "access-token" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.result.Username).toBe("user1");
    });

    it("POST /user-pools/:id/auth/get-user — 400 if accessToken missing", async () => {
      const res = await post("/user-pools/us-east-1_abc/auth/get-user", {});
      expect(res.status).toBe(400);
    });

    it("POST /user-pools/:id/auth/update-user-attributes — updates attributes", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/user-pools/us-east-1_abc/auth/update-user-attributes", {
        accessToken: "access-token",
        userAttributes: [{ Name: "email", Value: "user@example.com" }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.result).toBeDefined();
    });

    it("POST /user-pools/:id/auth/update-user-attributes — 400 if userAttributes missing", async () => {
      const res = await post("/user-pools/us-east-1_abc/auth/update-user-attributes", { accessToken: "access-token" });
      expect(res.status).toBe(400);
    });

    it("POST /user-pools/:id/auth/delete-user-attributes — deletes attributes", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/user-pools/us-east-1_abc/auth/delete-user-attributes", {
        accessToken: "access-token",
        userAttributeNames: ["email"],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.result).toBeDefined();
    });

    it("POST /user-pools/:id/auth/delete-user-attributes — 400 if userAttributeNames missing", async () => {
      const res = await post("/user-pools/us-east-1_abc/auth/delete-user-attributes", { accessToken: "access-token" });
      expect(res.status).toBe(400);
    });
  });

  describe("Client Secrets", () => {
    it("GET /user-pools/:id/clients/:clientId/secrets — lists secrets", async () => {
      mockSend.mockResolvedValueOnce({ ClientSecrets: [{ ClientSecretId: "secret-1" }] });
      const res = await get("/user-pools/us-east-1_abc/clients/client-1/secrets");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.secrets).toHaveLength(1);
    });

    it("GET /user-pools/:id/clients/:clientId/secrets — sparse response defaults to empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/user-pools/us-east-1_abc/clients/client-1/secrets");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.secrets).toEqual([]);
    });

    it("POST /user-pools/:id/clients/:clientId/secrets — creates a secret", async () => {
      mockSend.mockResolvedValueOnce({ ClientSecretDescriptor: { ClientSecretId: "secret-1" } });
      const res = await post("/user-pools/us-east-1_abc/clients/client-1/secrets", { clientSecret: "mysecret" });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.secret.ClientSecretId).toBe("secret-1");
    });

    it("DELETE /user-pools/:id/clients/:clientId/secrets/:secretId — deletes a secret", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/user-pools/us-east-1_abc/clients/client-1/secrets/secret-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("G.86 — admin user ops + updates + tags", () => {
    it("GET /user-pools/:id/users/:username — gets admin user", async () => {
      mockSend.mockResolvedValueOnce({ Username: "alice", UserStatus: "CONFIRMED", Enabled: true });
      const res = await get("/user-pools/us-east-1_abc/users/alice");
      const body = await res.json();
      expect(body.user.Username).toBe("alice");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("AdminGetUserCommand");
      expect(mockSend.mock.calls[0][0].UserPoolId).toBe("us-east-1_abc");
    });

    it("DELETE /user-pools/:id/users/:username/groups/:groupName — removes user from group", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/user-pools/us-east-1_abc/users/alice/groups/admins");
      const body = await res.json();
      expect(body.removed).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("AdminRemoveUserFromGroupCommand");
      expect(mockSend.mock.calls[0][0].GroupName).toBe("admins");
    });

    it("POST /user-pools/:id/users/:username/reset-password — resets password", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/user-pools/us-east-1_abc/users/alice/reset-password");
      const body = await res.json();
      expect(body.reset).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("AdminResetUserPasswordCommand");
    });

    it("POST /user-pools/:id/users/:username/attributes — updates attributes", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/user-pools/us-east-1_abc/users/alice/attributes", {
        userAttributes: [{ Name: "email", Value: "alice@x.com" }],
      });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("AdminUpdateUserAttributesCommand");
      const res400 = await post("/user-pools/us-east-1_abc/users/alice/attributes", { userAttributes: [] });
      expect(res400.status).toBe(400);
    });

    it("GET /user-pools/:id/groups/:groupName — gets a group", async () => {
      mockSend.mockResolvedValueOnce({ Group: { GroupName: "admins", Description: "Admins" } });
      const res = await get("/user-pools/us-east-1_abc/groups/admins");
      const body = await res.json();
      expect(body.group.GroupName).toBe("admins");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetGroupCommand");
      mockSend.mockResolvedValueOnce({});
      const resNull = await get("/user-pools/us-east-1_abc/groups/none");
      expect((await resNull.json()).group).toBeNull();
    });

    it("PUT /user-pools/:id/groups/:groupName — updates a group", async () => {
      mockSend.mockResolvedValueOnce({ Group: { GroupName: "admins" } });
      const res = await put("/user-pools/us-east-1_abc/groups/admins", {
        description: "New desc",
        roleArn: "arn:aws:iam::123:role/r",
        precedence: 5,
      });
      const body = await res.json();
      expect(body.group.GroupName).toBe("admins");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateGroupCommand");
      expect(mockSend.mock.calls[0][0].Description).toBe("New desc");
      mockSend.mockResolvedValueOnce({});
      const resNull = await put("/user-pools/us-east-1_abc/groups/none", { description: "x" });
      expect((await resNull.json()).group).toBeNull();
    });

    it("PUT /user-pools/:id — updates a pool", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/user-pools/us-east-1_abc", {
        name: "renamed",
        mfaConfiguration: "ON",
        autoVerifiedAttributes: ["email"],
      });
      const body = await res.json();
      expect(body.result).toBeDefined();
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateUserPoolCommand");
      expect(mockSend.mock.calls[0][0].PoolName).toBe("renamed");
      const res400 = await put("/user-pools/us-east-1_abc", { name: "" });
      expect(res400.status).toBe(400);
    });

    it("PUT /user-pools/:id/clients/:clientId — updates a client", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/user-pools/us-east-1_abc/clients/client-1", {
        name: "renamed",
        refreshTokenValidity: 30,
        callbackURLs: ["https://x.com/cb"],
      });
      const body = await res.json();
      expect(body.result).toBeDefined();
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateUserPoolClientCommand");
      expect(mockSend.mock.calls[0][0].ClientName).toBe("renamed");
      const res400 = await put("/user-pools/us-east-1_abc/clients/client-1", { name: "" });
      expect(res400.status).toBe(400);
    });

    it("GET /user-pools/:id/tags — lists tags", async () => {
      mockSend.mockResolvedValueOnce({ Tags: { env: "prod" } });
      const res = await get("/user-pools/us-east-1_abc/tags");
      const body = await res.json();
      expect(body.tags).toEqual({ env: "prod" });
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListTagsForResourceCommand");
      mockSend.mockResolvedValueOnce({});
      const resEmpty = await get("/user-pools/us-east-1_abc/tags");
      expect((await resEmpty.json()).tags).toEqual({});
    });

    it("POST /user-pools/:id/tags — tags a pool", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/user-pools/us-east-1_abc/tags", { tags: { env: "prod", empty: "" } });
      const body = await res.json();
      expect(body.tagged).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("TagResourceCommand");
      const res400 = await post("/user-pools/us-east-1_abc/tags", { tags: {} });
      expect(res400.status).toBe(400);
      const res400b = await post("/user-pools/us-east-1_abc/tags", {});
      expect(res400b.status).toBe(400);
    });

    it("DELETE /user-pools/:id/tags — untags a pool", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await router.request("/user-pools/us-east-1_abc/tags", {
        method: "DELETE",
        body: JSON.stringify({ tagKeys: ["env"] }),
        headers: { "content-type": "application/json" },
      });
      const body = await res.json();
      expect(body.untagged).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("UntagResourceCommand");
      expect(mockSend.mock.calls[0][0].TagKeys).toEqual(["env"]);
      const res400 = await router.request("/user-pools/us-east-1_abc/tags", {
        method: "DELETE",
        body: JSON.stringify({ tagKeys: [] }),
        headers: { "content-type": "application/json" },
      });
      expect(res400.status).toBe(400);
    });

    it("POST /auth/change-password — changes password", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/auth/change-password", {
        accessToken: "tok",
        previousPassword: "old",
        proposedPassword: "new",
      });
      const body = await res.json();
      expect(body.result).toBeDefined();
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("ChangePasswordCommand");
      const res400 = await post("/auth/change-password", { accessToken: "tok" });
      expect(res400.status).toBe(400);
    });

    it("POST /auth/sign-up — signs up a user", async () => {
      mockSend.mockResolvedValueOnce({ UserConfirmed: false });
      const res = await post("/auth/sign-up", {
        clientId: "client-1",
        username: "bob",
        password: "Passw0rd!",
        userAttributes: [{ Name: "email", Value: "bob@x.com" }],
        secretHash: "hash",
      });
      const body = await res.json();
      expect(body.result.UserConfirmed).toBe(false);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("SignUpCommand");
      expect(mockSend.mock.calls[0][0].Username).toBe("bob");
      const res400 = await post("/auth/sign-up", { clientId: "c" });
      expect(res400.status).toBe(400);
    });

    it("POST /auth/respond-challenge — responds to a challenge", async () => {
      mockSend.mockResolvedValueOnce({ AuthenticationResult: {} });
      const res = await post("/auth/respond-challenge", {
        clientId: "client-1",
        challengeName: "NEW_PASSWORD_REQUIRED",
        challengeResponses: { USERNAME: "bob" },
        session: "sess",
      });
      const body = await res.json();
      expect(body.result.AuthenticationResult).toBeDefined();
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("RespondToAuthChallengeCommand");
      const res400 = await post("/auth/respond-challenge", { clientId: "c" });
      expect(res400.status).toBe(400);
    });
  });
});
