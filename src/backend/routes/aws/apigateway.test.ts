import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockClient = vi.hoisted(() =>
  vi.fn(function () {
    return { send: mockSend };
  })
);

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-api-gateway", () => ({
  APIGatewayClient: mockClient,
  GetRestApisCommand: createCmd("GetRestApisCommand"),
  GetRestApiCommand: createCmd("GetRestApiCommand"),
  CreateRestApiCommand: createCmd("CreateRestApiCommand"),
  DeleteRestApiCommand: createCmd("DeleteRestApiCommand"),
  GetResourcesCommand: createCmd("GetResourcesCommand"),
  GetDeploymentsCommand: createCmd("GetDeploymentsCommand"),
  CreateResourceCommand: createCmd("CreateResourceCommand"),
  GetResourceCommand: createCmd("GetResourceCommand"),
  DeleteResourceCommand: createCmd("DeleteResourceCommand"),
  UpdateResourceCommand: createCmd("UpdateResourceCommand"),
  PutMethodCommand: createCmd("PutMethodCommand"),
  GetMethodCommand: createCmd("GetMethodCommand"),
  DeleteMethodCommand: createCmd("DeleteMethodCommand"),
  PutMethodResponseCommand: createCmd("PutMethodResponseCommand"),
  GetMethodResponseCommand: createCmd("GetMethodResponseCommand"),
  DeleteMethodResponseCommand: createCmd("DeleteMethodResponseCommand"),
  PutIntegrationCommand: createCmd("PutIntegrationCommand"),
  GetIntegrationCommand: createCmd("GetIntegrationCommand"),
  DeleteIntegrationCommand: createCmd("DeleteIntegrationCommand"),
  PutIntegrationResponseCommand: createCmd("PutIntegrationResponseCommand"),
  GetIntegrationResponseCommand: createCmd("GetIntegrationResponseCommand"),
  DeleteIntegrationResponseCommand: createCmd("DeleteIntegrationResponseCommand"),
  CreateDeploymentCommand: createCmd("CreateDeploymentCommand"),
  GetDeploymentCommand: createCmd("GetDeploymentCommand"),
  DeleteDeploymentCommand: createCmd("DeleteDeploymentCommand"),
  UpdateDeploymentCommand: createCmd("UpdateDeploymentCommand"),
  CreateStageCommand: createCmd("CreateStageCommand"),
  GetStagesCommand: createCmd("GetStagesCommand"),
  GetStageCommand: createCmd("GetStageCommand"),
  UpdateStageCommand: createCmd("UpdateStageCommand"),
  DeleteStageCommand: createCmd("DeleteStageCommand"),
  CreateAuthorizerCommand: createCmd("CreateAuthorizerCommand"),
  GetAuthorizersCommand: createCmd("GetAuthorizersCommand"),
  GetAuthorizerCommand: createCmd("GetAuthorizerCommand"),
  UpdateAuthorizerCommand: createCmd("UpdateAuthorizerCommand"),
  DeleteAuthorizerCommand: createCmd("DeleteAuthorizerCommand"),
  CreateApiKeyCommand: createCmd("CreateApiKeyCommand"),
  GetApiKeysCommand: createCmd("GetApiKeysCommand"),
  GetApiKeyCommand: createCmd("GetApiKeyCommand"),
  UpdateApiKeyCommand: createCmd("UpdateApiKeyCommand"),
  DeleteApiKeyCommand: createCmd("DeleteApiKeyCommand"),
  ImportApiKeysCommand: createCmd("ImportApiKeysCommand"),
  CreateUsagePlanCommand: createCmd("CreateUsagePlanCommand"),
  GetUsagePlansCommand: createCmd("GetUsagePlansCommand"),
  GetUsagePlanCommand: createCmd("GetUsagePlanCommand"),
  UpdateUsagePlanCommand: createCmd("UpdateUsagePlanCommand"),
  DeleteUsagePlanCommand: createCmd("DeleteUsagePlanCommand"),
  CreateUsagePlanKeyCommand: createCmd("CreateUsagePlanKeyCommand"),
  GetUsagePlanKeysCommand: createCmd("GetUsagePlanKeysCommand"),
  DeleteUsagePlanKeyCommand: createCmd("DeleteUsagePlanKeyCommand"),
  GetUsageCommand: createCmd("GetUsageCommand"),
  CreateRequestValidatorCommand: createCmd("CreateRequestValidatorCommand"),
  GetRequestValidatorsCommand: createCmd("GetRequestValidatorsCommand"),
  GetRequestValidatorCommand: createCmd("GetRequestValidatorCommand"),
  UpdateRequestValidatorCommand: createCmd("UpdateRequestValidatorCommand"),
  DeleteRequestValidatorCommand: createCmd("DeleteRequestValidatorCommand"),
  CreateModelCommand: createCmd("CreateModelCommand"),
  GetModelsCommand: createCmd("GetModelsCommand"),
  GetModelCommand: createCmd("GetModelCommand"),
  UpdateModelCommand: createCmd("UpdateModelCommand"),
  DeleteModelCommand: createCmd("DeleteModelCommand"),
  CreateDomainNameCommand: createCmd("CreateDomainNameCommand"),
  GetDomainNamesCommand: createCmd("GetDomainNamesCommand"),
  GetDomainNameCommand: createCmd("GetDomainNameCommand"),
  UpdateDomainNameCommand: createCmd("UpdateDomainNameCommand"),
  DeleteDomainNameCommand: createCmd("DeleteDomainNameCommand"),
  CreateBasePathMappingCommand: createCmd("CreateBasePathMappingCommand"),
  GetBasePathMappingsCommand: createCmd("GetBasePathMappingsCommand"),
  DeleteBasePathMappingCommand: createCmd("DeleteBasePathMappingCommand"),
  GetAccountCommand: createCmd("GetAccountCommand"),
  UpdateAccountCommand: createCmd("UpdateAccountCommand"),
  ImportRestApiCommand: createCmd("ImportRestApiCommand"),
  PutRestApiCommand: createCmd("PutRestApiCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
  GetTagsCommand: createCmd("GetTagsCommand"),
}));

import app from "../../index";

beforeEach(() => {
  mockSend.mockReset();
});

// ─── REST APIs ─────────────────────────────────────────

describe("GET /api/aws/apigateway/rest-apis", () => {
  it("returns list of REST APIs", async () => {
    mockSend.mockResolvedValue({
      items: [{ id: "abc123", name: "my-api", description: "Test API" }],
    });
    const res = await app.request("/api/aws/apigateway/rest-apis");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.apis).toHaveLength(1);
    expect(body.apis[0].name).toBe("my-api");
    expect(body.total).toBe(1);
  });

  it("returns empty list when no APIs exist", async () => {
    mockSend.mockResolvedValue({ items: undefined });
    const res = await app.request("/api/aws/apigateway/rest-apis");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.apis).toHaveLength(0);
    expect(body.total).toBe(0);
  });
});

describe("GET /api/aws/apigateway/rest-apis/:apiId", () => {
  it("returns a single REST API", async () => {
    mockSend.mockResolvedValue({ id: "abc123", name: "my-api" });
    const res = await app.request("/api/aws/apigateway/rest-apis/abc123");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.api.name).toBe("my-api");
  });
});

describe("POST /api/aws/apigateway/rest-apis", () => {
  it("creates a REST API", async () => {
    mockSend.mockResolvedValue({ id: "new123", name: "new-api" });
    const res = await app.request("/api/aws/apigateway/rest-apis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "new-api", description: "My new API" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.api.name).toBe("new-api");
  });

  it("returns 400 if name is missing", async () => {
    const res = await app.request("/api/aws/apigateway/rest-apis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "no name" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/aws/apigateway/rest-apis/:apiId", () => {
  it("deletes a REST API", async () => {
    mockSend.mockResolvedValue({});
    const res = await app.request("/api/aws/apigateway/rest-apis/abc123", {
      method: "DELETE",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });
});

// ─── Resources ─────────────────────────────────────────

describe("GET /api/aws/apigateway/rest-apis/:apiId/resources", () => {
  it("returns resources for an API", async () => {
    mockSend.mockResolvedValue({
      items: [{ id: "res1", path: "/pets", resourceMethods: { GET: {}, POST: {} } }],
    });
    const res = await app.request("/api/aws/apigateway/rest-apis/abc123/resources");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.resources).toHaveLength(1);
    expect(body.resources[0].path).toBe("/pets");
    expect(body.total).toBe(1);
  });

  it("returns empty list when no resources exist", async () => {
    mockSend.mockResolvedValue({ items: undefined });
    const res = await app.request("/api/aws/apigateway/rest-apis/abc123/resources");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.resources).toHaveLength(0);
  });
});

// ─── Deployments ───────────────────────────────────────

describe("GET /api/aws/apigateway/rest-apis/:apiId/deployments", () => {
  it("returns deployments for an API", async () => {
    mockSend.mockResolvedValue({
      items: [{ id: "dep1", stageName: "prod", createdDate: "2024-01-01" }],
    });
    const res = await app.request("/api/aws/apigateway/rest-apis/abc123/deployments");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deployments).toHaveLength(1);
    expect(body.deployments[0].stageName).toBe("prod");
    expect(body.total).toBe(1);
  });

  it("returns empty list when no deployments exist", async () => {
    mockSend.mockResolvedValue({ items: undefined });
    const res = await app.request("/api/aws/apigateway/rest-apis/abc123/deployments");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deployments).toHaveLength(0);
  });
});

// ─── P1 gap audit — full API GW v1 surface ──────────────

const AG = "/api/aws/apigateway";
const j = async (r: Response) => await r.json();

describe("resources tree", () => {
  it("creates resource", async () => {
    mockSend.mockResolvedValueOnce({ id: "res-1", path: "/users", parentId: "root" });
    const res = await app.request(`${AG}/rest-apis/api1/resources`, { method: "POST", body: JSON.stringify({ parentId: "root", pathPart: "users" }), headers: { "content-type": "application/json" } });
    expect(res.status).toBe(201);
    expect((await j(res)).id).toBe("res-1");
  });
  it("400 without parentId", async () => {
    expect((await app.request(`${AG}/rest-apis/api1/resources`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
  });
  it("get/update/delete resource", async () => {
    mockSend.mockResolvedValueOnce({ id: "res-1" });
    expect((await app.request(`${AG}/rest-apis/api1/resources/res-1`)).status).toBe(200);
    mockSend.mockResolvedValueOnce({ id: "res-1", pathPart: "v2" });
    const up = await app.request(`${AG}/rest-apis/api1/resources/res-1`, { method: "PUT", body: JSON.stringify({ pathPart: "v2" }), headers: { "content-type": "application/json" } });
    expect(up.status).toBe(200);
    mockSend.mockResolvedValueOnce({});
    expect((await app.request(`${AG}/rest-apis/api1/resources/res-1`, { method: "DELETE" })).status).toBe(200);
    // update without pathPart -> empty patch operations
    mockSend.mockResolvedValueOnce({ id: "res-1" });
    const up2 = await app.request(`${AG}/rest-apis/api1/resources/res-1`, { method: "PUT", body: "{}", headers: { "content-type": "application/json" } });
    expect(up2.status).toBe(200);
    expect(mockSend.mock.calls[3][0].patchOperations).toEqual([]);
  });
});

describe("methods + method responses", () => {
  it("PUT/GET/DELETE method", async () => {
    mockSend.mockResolvedValueOnce({ httpMethod: "GET", authorizationType: "NONE" });
    const res = await app.request(`${AG}/rest-apis/api1/resources/res-1/methods/GET`, { method: "PUT", body: JSON.stringify({ authorizationType: "NONE" }), headers: { "content-type": "application/json" } });
    expect(res.status).toBe(200);
    expect((await j(res)).method.httpMethod).toBe("GET");
    // no authorizationType -> defaults to NONE
    mockSend.mockResolvedValueOnce({ httpMethod: "POST", authorizationType: "NONE" });
    const res2 = await app.request(`${AG}/rest-apis/api1/resources/res-1/methods/POST`, { method: "PUT", body: "{}", headers: { "content-type": "application/json" } });
    expect(res2.status).toBe(200);
    expect(mockSend.mock.calls[1][0].authorizationType).toBe("NONE");
    mockSend.mockResolvedValueOnce({ httpMethod: "GET" });
    expect((await app.request(`${AG}/rest-apis/api1/resources/res-1/methods/GET`)).status).toBe(200);
    mockSend.mockResolvedValueOnce({});
    expect((await app.request(`${AG}/rest-apis/api1/resources/res-1/methods/GET`, { method: "DELETE" })).status).toBe(200);
  });
  it("method responses PUT/GET/DELETE", async () => {
    mockSend.mockResolvedValueOnce({ statusCode: "200" });
    expect((await app.request(`${AG}/rest-apis/api1/resources/res-1/methods/GET/responses/200`, { method: "PUT", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(200);
    mockSend.mockResolvedValueOnce({ statusCode: "200" });
    expect((await app.request(`${AG}/rest-apis/api1/resources/res-1/methods/GET/responses/200`)).status).toBe(200);
    mockSend.mockResolvedValueOnce({});
    expect((await app.request(`${AG}/rest-apis/api1/resources/res-1/methods/GET/responses/200`, { method: "DELETE" })).status).toBe(200);
  });
});

describe("integrations", () => {
  it("PUT/GET/DELETE integration", async () => {
    mockSend.mockResolvedValueOnce({ type: "MOCK" });
    const res = await app.request(`${AG}/rest-apis/api1/resources/res-1/methods/GET/integration`, { method: "PUT", body: JSON.stringify({ type: "MOCK" }), headers: { "content-type": "application/json" } });
    expect(res.status).toBe(200);
    expect((await j(res)).integration.type).toBe("MOCK");
    mockSend.mockResolvedValueOnce({ type: "MOCK" });
    expect((await app.request(`${AG}/rest-apis/api1/resources/res-1/methods/GET/integration`)).status).toBe(200);
    mockSend.mockResolvedValueOnce({});
    expect((await app.request(`${AG}/rest-apis/api1/resources/res-1/methods/GET/integration`, { method: "DELETE" })).status).toBe(200);
  });
  it("integration 400 without type", async () => {
    expect((await app.request(`${AG}/rest-apis/api1/resources/res-1/methods/GET/integration`, { method: "PUT", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
  });
  it("integration responses PUT/GET/DELETE", async () => {
    mockSend.mockResolvedValueOnce({ statusCode: "200" });
    expect((await app.request(`${AG}/rest-apis/api1/resources/res-1/methods/GET/integration/responses/200`, { method: "PUT", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(200);
    mockSend.mockResolvedValueOnce({ statusCode: "200" });
    expect((await app.request(`${AG}/rest-apis/api1/resources/res-1/methods/GET/integration/responses/200`)).status).toBe(200);
    mockSend.mockResolvedValueOnce({});
    expect((await app.request(`${AG}/rest-apis/api1/resources/res-1/methods/GET/integration/responses/200`, { method: "DELETE" })).status).toBe(200);
  });
});

describe("deployments + stages", () => {
  it("deployments create/get/update/delete", async () => {
    mockSend.mockResolvedValueOnce({ id: "dep-1" });
    const res = await app.request(`${AG}/rest-apis/api1/deployments`, { method: "POST", body: JSON.stringify({ stageName: "dev" }), headers: { "content-type": "application/json" } });
    expect(res.status).toBe(201);
    expect((await j(res)).id).toBe("dep-1");
    mockSend.mockResolvedValueOnce({ id: "dep-1" });
    expect((await app.request(`${AG}/rest-apis/api1/deployments/dep-1`)).status).toBe(200);
    mockSend.mockResolvedValueOnce({ id: "dep-1" });
    expect((await app.request(`${AG}/rest-apis/api1/deployments/dep-1`, { method: "PUT", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(200);
    expect(mockSend.mock.calls[2][0].patchOperations).toEqual([]);
    mockSend.mockResolvedValueOnce({ id: "dep-1" });
    await app.request(`${AG}/rest-apis/api1/deployments/dep-1`, { method: "PUT", body: JSON.stringify({ description: "x" }), headers: { "content-type": "application/json" } });
    mockSend.mockResolvedValueOnce({});
    expect((await app.request(`${AG}/rest-apis/api1/deployments/dep-1`, { method: "DELETE" })).status).toBe(200);
  });
  it("stages create/list/get/update/delete", async () => {
    mockSend.mockResolvedValueOnce({ stageName: "dev" });
    const res = await app.request(`${AG}/rest-apis/api1/stages`, { method: "POST", body: JSON.stringify({ stageName: "dev" }), headers: { "content-type": "application/json" } });
    expect(res.status).toBe(201);
    mockSend.mockResolvedValueOnce({ item: [{ name: "dev" }] });
    const list = await app.request(`${AG}/rest-apis/api1/stages`);
    expect((await j(list)).total).toBe(1);
    // sparse stages list
    mockSend.mockResolvedValueOnce({});
    const empty = await app.request(`${AG}/rest-apis/api1/stages`);
    expect((await j(empty)).total).toBe(0);
    // stage update with patchOperations provided
    mockSend.mockResolvedValueOnce({ stageName: "dev" });
    await app.request(`${AG}/rest-apis/api1/stages/dev`, { method: "PUT", body: JSON.stringify({ patchOperations: [{ op: "replace", path: "/description", value: "x" }] }), headers: { "content-type": "application/json" } });
    // stage update with description (no patchOperations)
    mockSend.mockResolvedValueOnce({ stageName: "dev" });
    await app.request(`${AG}/rest-apis/api1/stages/dev`, { method: "PUT", body: JSON.stringify({ description: "env" }), headers: { "content-type": "application/json" } });
    // stage update with neither -> empty patches
    mockSend.mockResolvedValueOnce({ stageName: "dev" });
    await app.request(`${AG}/rest-apis/api1/stages/dev`, { method: "PUT", body: "{}", headers: { "content-type": "application/json" } });
    mockSend.mockResolvedValueOnce({ stageName: "dev" });
    expect((await app.request(`${AG}/rest-apis/api1/stages/dev`)).status).toBe(200);
    mockSend.mockResolvedValueOnce({ stageName: "dev" });
    expect((await app.request(`${AG}/rest-apis/api1/stages/dev`, { method: "PUT", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(200);
    mockSend.mockResolvedValueOnce({});
    expect((await app.request(`${AG}/rest-apis/api1/stages/dev`, { method: "DELETE" })).status).toBe(200);
  });
  it("stage 400 without stageName", async () => {
    expect((await app.request(`${AG}/rest-apis/api1/stages`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
  });
});

describe("authorizers", () => {
  it("create/list/get/update/delete", async () => {
    mockSend.mockResolvedValueOnce({ id: "auth-1" });
    const res = await app.request(`${AG}/rest-apis/api1/authorizers`, { method: "POST", body: JSON.stringify({ name: "a1", type: "COGNITO_USER_POOLS" }), headers: { "content-type": "application/json" } });
    expect(res.status).toBe(201);
    mockSend.mockResolvedValueOnce({ items: [{ id: "auth-1" }] });
    expect((await j(await app.request(`${AG}/rest-apis/api1/authorizers`))).total).toBe(1);
    mockSend.mockResolvedValueOnce({});
    expect((await j(await app.request(`${AG}/rest-apis/api1/authorizers`))).total).toBe(0);
    mockSend.mockResolvedValueOnce({ id: "auth-1" });
    expect((await app.request(`${AG}/rest-apis/api1/authorizers/auth-1`)).status).toBe(200);
    mockSend.mockResolvedValueOnce({ id: "auth-1" });
    expect((await app.request(`${AG}/rest-apis/api1/authorizers/auth-1`, { method: "PUT", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(200);
    mockSend.mockResolvedValueOnce({});
    expect((await app.request(`${AG}/rest-apis/api1/authorizers/auth-1`, { method: "DELETE" })).status).toBe(200);
    expect((await app.request(`${AG}/rest-apis/api1/authorizers`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
  });
});

describe("api keys + usage plans", () => {
  it("api key create/list/get/update/delete/import", async () => {
    mockSend.mockResolvedValueOnce({ id: "k1", name: "key1" });
    const res = await app.request(`${AG}/api-keys`, { method: "POST", body: JSON.stringify({ name: "key1" }), headers: { "content-type": "application/json" } });
    expect(res.status).toBe(201);
    mockSend.mockResolvedValueOnce({ items: [{ id: "k1" }] });
    expect((await j(await app.request(`${AG}/api-keys`))).total).toBe(1);
    mockSend.mockResolvedValueOnce({});
    expect((await j(await app.request(`${AG}/api-keys`))).total).toBe(0);
    mockSend.mockResolvedValueOnce({ id: "k1" });
    expect((await app.request(`${AG}/api-keys/k1`)).status).toBe(200);
    mockSend.mockResolvedValueOnce({ id: "k1" });
    expect((await app.request(`${AG}/api-keys/k1`, { method: "PUT", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(200);
    mockSend.mockResolvedValueOnce({});
    expect((await app.request(`${AG}/api-keys/k1`, { method: "DELETE" })).status).toBe(200);
    mockSend.mockResolvedValueOnce({ ids: ["k2"] });
    const imp = await app.request(`${AG}/api-keys/import`, { method: "POST", body: JSON.stringify({ csv: "name,key,type\nk1,abc,STEP" }), headers: { "content-type": "application/json" } });
    expect(imp.status).toBe(201);
    expect((await j(imp)).imported).toBe(1);
    // sparse import result -> ids defaults to []
    mockSend.mockResolvedValueOnce({});
    const imp2 = await app.request(`${AG}/api-keys/import`, { method: "POST", body: JSON.stringify({ csv: "n,k" }), headers: { "content-type": "application/json" } });
    expect((await j(imp2)).imported).toBe(0);
    expect((await app.request(`${AG}/api-keys`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
    expect((await app.request(`${AG}/api-keys/import`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
  });
  it("usage plans CRUD + keys + usage", async () => {
    mockSend.mockResolvedValueOnce({ id: "up-1" });
    const res = await app.request(`${AG}/usage-plans`, { method: "POST", body: JSON.stringify({ name: "plan1" }), headers: { "content-type": "application/json" } });
    expect(res.status).toBe(201);
    mockSend.mockResolvedValueOnce({ items: [{ id: "up-1" }] });
    expect((await j(await app.request(`${AG}/usage-plans`))).total).toBe(1);
    mockSend.mockResolvedValueOnce({});
    expect((await j(await app.request(`${AG}/usage-plans`))).total).toBe(0);
    mockSend.mockResolvedValueOnce({ id: "up-1" });
    expect((await app.request(`${AG}/usage-plans/up-1`)).status).toBe(200);
    mockSend.mockResolvedValueOnce({ id: "up-1" });
    expect((await app.request(`${AG}/usage-plans/up-1`, { method: "PUT", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(200);
    mockSend.mockResolvedValueOnce({ id: "key-1" });
    const key = await app.request(`${AG}/usage-plans/up-1/keys`, { method: "POST", body: JSON.stringify({ keyId: "key-1" }), headers: { "content-type": "application/json" } });
    expect(key.status).toBe(201);
    mockSend.mockResolvedValueOnce({ items: [] });
    expect((await j(await app.request(`${AG}/usage-plans/up-1/keys`))).total).toBe(0);
    mockSend.mockResolvedValueOnce({});
    expect((await j(await app.request(`${AG}/usage-plans/up-1/keys`))).total).toBe(0);
    mockSend.mockResolvedValueOnce({});
    expect((await app.request(`${AG}/usage-plans/up-1/usage?startDate=2026-01-01&endDate=2026-01-02&keyId=key-1`)).status).toBe(200);
    mockSend.mockResolvedValueOnce({});
    expect((await app.request(`${AG}/usage-plans/up-1/keys/key-1`, { method: "DELETE" })).status).toBe(200);
    mockSend.mockResolvedValueOnce({});
    expect((await app.request(`${AG}/usage-plans/up-1`, { method: "DELETE" })).status).toBe(200);
    expect((await app.request(`${AG}/usage-plans`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
    expect((await app.request(`${AG}/usage-plans/up-1/keys`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
  });
});

describe("request validators + models", () => {
  it("validators CRUD", async () => {
    mockSend.mockResolvedValueOnce({ id: "v1" });
    const res = await app.request(`${AG}/rest-apis/api1/request-validators`, { method: "POST", body: JSON.stringify({ name: "v1" }), headers: { "content-type": "application/json" } });
    expect(res.status).toBe(201);
    mockSend.mockResolvedValueOnce({ items: [{ id: "v1" }] });
    expect((await j(await app.request(`${AG}/rest-apis/api1/request-validators`))).total).toBe(1);
    mockSend.mockResolvedValueOnce({});
    expect((await j(await app.request(`${AG}/rest-apis/api1/request-validators`))).total).toBe(0);
    mockSend.mockResolvedValueOnce({ id: "v1" });
    expect((await app.request(`${AG}/rest-apis/api1/request-validators/v1`)).status).toBe(200);
    mockSend.mockResolvedValueOnce({ id: "v1" });
    expect((await app.request(`${AG}/rest-apis/api1/request-validators/v1`, { method: "PUT", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(200);
    mockSend.mockResolvedValueOnce({});
    expect((await app.request(`${AG}/rest-apis/api1/request-validators/v1`, { method: "DELETE" })).status).toBe(200);
    expect((await app.request(`${AG}/rest-apis/api1/request-validators`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
  });
  it("models CRUD + 400", async () => {
    mockSend.mockResolvedValueOnce({ name: "m1" });
    const res = await app.request(`${AG}/rest-apis/api1/models`, { method: "POST", body: JSON.stringify({ name: "m1", contentType: "application/json", schema: "{}" }), headers: { "content-type": "application/json" } });
    expect(res.status).toBe(201);
    mockSend.mockResolvedValueOnce({ items: [{ name: "m1" }] });
    expect((await j(await app.request(`${AG}/rest-apis/api1/models`))).total).toBe(1);
    mockSend.mockResolvedValueOnce({});
    expect((await j(await app.request(`${AG}/rest-apis/api1/models`))).total).toBe(0);
    mockSend.mockResolvedValueOnce({ name: "m1" });
    expect((await app.request(`${AG}/rest-apis/api1/models/m1`)).status).toBe(200);
    mockSend.mockResolvedValueOnce({ name: "m1" });
    expect((await app.request(`${AG}/rest-apis/api1/models/m1`, { method: "PUT", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(200);
    mockSend.mockResolvedValueOnce({});
    expect((await app.request(`${AG}/rest-apis/api1/models/m1`, { method: "DELETE" })).status).toBe(200);
    expect((await app.request(`${AG}/rest-apis/api1/models`, { method: "POST", body: JSON.stringify({ name: "m1" }), headers: { "content-type": "application/json" } })).status).toBe(400);
  });
});

describe("domain names + base path mappings", () => {
  it("domain CRUD + mappings", async () => {
    mockSend.mockResolvedValueOnce({ domainName: "api.example.com" });
    const res = await app.request(`${AG}/domain-names`, { method: "POST", body: JSON.stringify({ domainName: "api.example.com" }), headers: { "content-type": "application/json" } });
    expect(res.status).toBe(201);
    mockSend.mockResolvedValueOnce({ items: [{ domainName: "api.example.com" }] });
    expect((await j(await app.request(`${AG}/domain-names`))).total).toBe(1);
    mockSend.mockResolvedValueOnce({});
    expect((await j(await app.request(`${AG}/domain-names`))).total).toBe(0);
    mockSend.mockResolvedValueOnce({ domainName: "api.example.com" });
    expect((await app.request(`${AG}/domain-names/api.example.com`)).status).toBe(200);
    mockSend.mockResolvedValueOnce({ domainName: "api.example.com" });
    expect((await app.request(`${AG}/domain-names/api.example.com`, { method: "PUT", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(200);
    mockSend.mockResolvedValueOnce({ basePathMapping: {} });
    const map = await app.request(`${AG}/domain-names/api.example.com/base-path-mappings`, { method: "POST", body: JSON.stringify({ restApiId: "api1" }), headers: { "content-type": "application/json" } });
    expect(map.status).toBe(201);
    mockSend.mockResolvedValueOnce({ items: [] });
    expect((await j(await app.request(`${AG}/domain-names/api.example.com/base-path-mappings`))).total).toBe(0);
    mockSend.mockResolvedValueOnce({});
    expect((await j(await app.request(`${AG}/domain-names/api.example.com/base-path-mappings`))).total).toBe(0);
    mockSend.mockResolvedValueOnce({});
    expect((await app.request(`${AG}/domain-names/api.example.com/base-path-mappings/(none)`, { method: "DELETE" })).status).toBe(200);
    mockSend.mockResolvedValueOnce({});
    expect((await app.request(`${AG}/domain-names/api.example.com/base-path-mappings/v1`, { method: "DELETE" })).status).toBe(200);
    mockSend.mockResolvedValueOnce({});
    expect((await app.request(`${AG}/domain-names/api.example.com`, { method: "DELETE" })).status).toBe(200);
    expect((await app.request(`${AG}/domain-names`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
    expect((await app.request(`${AG}/domain-names/api.example.com/base-path-mappings`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
  });
});

describe("account + import + tags", () => {
  it("account get/update", async () => {
    mockSend.mockResolvedValueOnce({ features: [] });
    expect((await app.request(`${AG}/account`)).status).toBe(200);
    mockSend.mockResolvedValueOnce({ features: [] });
    expect((await app.request(`${AG}/account`, { method: "PUT", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(200);
  });
  it("import + put rest api", async () => {
    mockSend.mockResolvedValueOnce({ id: "imp-1" });
    const res = await app.request(`${AG}/rest-apis/import`, { method: "POST", body: JSON.stringify({ spec: { openapi: "3.0.0" } }), headers: { "content-type": "application/json" } });
    expect(res.status).toBe(201);
    // spec as raw string
    mockSend.mockResolvedValueOnce({ id: "imp-2" });
    const res2 = await app.request(`${AG}/rest-apis/import`, { method: "POST", body: JSON.stringify({ spec: "openapi: 3.0.0" }), headers: { "content-type": "application/json" } });
    expect(res2.status).toBe(201);
    mockSend.mockResolvedValueOnce({ id: "api1" });
    expect((await app.request(`${AG}/rest-apis/api1`, { method: "PUT", body: JSON.stringify({ spec: "{}" }), headers: { "content-type": "application/json" } })).status).toBe(200);
    // spec as raw string
    mockSend.mockResolvedValueOnce({ id: "api1" });
    expect((await app.request(`${AG}/rest-apis/api1`, { method: "PUT", body: JSON.stringify({ spec: { openapi: "3.0.0" } }), headers: { "content-type": "application/json" } })).status).toBe(200);
    expect((await app.request(`${AG}/rest-apis/import`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
    expect((await app.request(`${AG}/rest-apis/api1`, { method: "PUT", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
  });
  it("tags", async () => {
    mockSend.mockResolvedValueOnce({});
    expect((await app.request(`${AG}/rest-apis/api1/tags`, { method: "POST", body: JSON.stringify({ tags: { a: "b" } }), headers: { "content-type": "application/json" } })).status).toBe(200);
    mockSend.mockResolvedValueOnce({ tags: { a: "b" } });
    expect((await j(await app.request(`${AG}/rest-apis/api1/tags`))).tags).toEqual({ a: "b" });
    mockSend.mockResolvedValueOnce({});
    expect((await j(await app.request(`${AG}/rest-apis/api1/tags`))).tags).toEqual({});
    mockSend.mockResolvedValueOnce({});
    expect((await app.request(`${AG}/rest-apis/api1/tags?tagKeys=a`, { method: "DELETE" })).status).toBe(200);
    expect((await app.request(`${AG}/rest-apis/api1/tags`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
    expect((await app.request(`${AG}/rest-apis/api1/tags`, { method: "DELETE" })).status).toBe(400);
  });
});
