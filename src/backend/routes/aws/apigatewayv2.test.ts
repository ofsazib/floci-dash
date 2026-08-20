import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());
const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) { return { __cmdName: name, ...args }; });
  };
});

vi.mock("@aws-sdk/client-apigatewayv2", () => ({
  ApiGatewayV2Client: vi.fn(function () { return { send: mockSend }; }),
  GetApisCommand: createCmd("GetApisCommand"),
  CreateApiCommand: createCmd("CreateApiCommand"),
  GetApiCommand: createCmd("GetApiCommand"),
  DeleteApiCommand: createCmd("DeleteApiCommand"),
  GetRoutesCommand: createCmd("GetRoutesCommand"),
  CreateRouteCommand: createCmd("CreateRouteCommand"),
  DeleteRouteCommand: createCmd("DeleteRouteCommand"),
  GetIntegrationsCommand: createCmd("GetIntegrationsCommand"),
  CreateIntegrationCommand: createCmd("CreateIntegrationCommand"),
  DeleteIntegrationCommand: createCmd("DeleteIntegrationCommand"),
  GetStagesCommand: createCmd("GetStagesCommand"),
  CreateStageCommand: createCmd("CreateStageCommand"),
  DeleteStageCommand: createCmd("DeleteStageCommand"),
  GetDeploymentsCommand: createCmd("GetDeploymentsCommand"),
  CreateDeploymentCommand: createCmd("CreateDeploymentCommand"),
  DeleteDeploymentCommand: createCmd("DeleteDeploymentCommand"),
  GetAuthorizersCommand: createCmd("GetAuthorizersCommand"),
  GetAuthorizerCommand: createCmd("GetAuthorizerCommand"),
  CreateAuthorizerCommand: createCmd("CreateAuthorizerCommand"),
  UpdateAuthorizerCommand: createCmd("UpdateAuthorizerCommand"),
  DeleteAuthorizerCommand: createCmd("DeleteAuthorizerCommand"),
  GetModelsCommand: createCmd("GetModelsCommand"),
  GetModelCommand: createCmd("GetModelCommand"),
  CreateModelCommand: createCmd("CreateModelCommand"),
  UpdateModelCommand: createCmd("UpdateModelCommand"),
  DeleteModelCommand: createCmd("DeleteModelCommand"),
  GetIntegrationResponsesCommand: createCmd("GetIntegrationResponsesCommand"),
  GetIntegrationResponseCommand: createCmd("GetIntegrationResponseCommand"),
  CreateIntegrationResponseCommand: createCmd("CreateIntegrationResponseCommand"),
  UpdateIntegrationResponseCommand: createCmd("UpdateIntegrationResponseCommand"),
  DeleteIntegrationResponseCommand: createCmd("DeleteIntegrationResponseCommand"),
  GetRouteResponsesCommand: createCmd("GetRouteResponsesCommand"),
  GetRouteResponseCommand: createCmd("GetRouteResponseCommand"),
  CreateRouteResponseCommand: createCmd("CreateRouteResponseCommand"),
  UpdateRouteResponseCommand: createCmd("UpdateRouteResponseCommand"),
  DeleteRouteResponseCommand: createCmd("DeleteRouteResponseCommand"),
  GetRouteCommand: createCmd("GetRouteCommand"),
  UpdateRouteCommand: createCmd("UpdateRouteCommand"),
  GetIntegrationCommand: createCmd("GetIntegrationCommand"),
  UpdateIntegrationCommand: createCmd("UpdateIntegrationCommand"),
  GetDeploymentCommand: createCmd("GetDeploymentCommand"),
  UpdateDeploymentCommand: createCmd("UpdateDeploymentCommand"),
  GetStageCommand: createCmd("GetStageCommand"),
  UpdateStageCommand: createCmd("UpdateStageCommand"),
  GetTagsCommand: createCmd("GetTagsCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
}));

vi.mock("../../clients/aws", () => ({ create: (Ctor: any, extra?: any) => new Ctor(extra) }));

import router from "./apigatewayv2";

async function get(p: string) { return router.request(p, { method: "GET" }); }
async function post(p: string, b?: any) {
  return router.request(p, { method: "POST", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}
async function del(p: string) { return router.request(p, { method: "DELETE" }); }
async function put(p: string, b?: any) {
  return router.request(p, { method: "PUT", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}
async function delBody(p: string, b?: any) {
  return router.request(p, { method: "DELETE", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}

beforeEach(() => mockSend.mockReset());

describe("API Gateway V2 Routes", () => {
  it("GET /apis — lists APIs", async () => {
    mockSend.mockResolvedValueOnce({ Items: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }] });
    const res = await get("/apis");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /apis — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/apis");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("GET /apis/:apiId — gets API", async () => {
    mockSend.mockResolvedValueOnce({ ApiId: "api-1", Name: "my-api" });
    const res = await get("/apis/api-1");
    expect(res.status).toBe(200);
  });

  it("POST /apis — creates API (201)", async () => {
    mockSend.mockResolvedValueOnce({ ApiId: "new" });
    const res = await post("/apis", { name: "my-api" });
    expect(res.status).toBe(201);
  });

  it("POST /apis — 400 if name missing", async () => {
    const res = await post("/apis", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /apis/:apiId — deletes API", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/apis/api-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it("GET /apis/:apiId/routes — lists routes", async () => {
    mockSend.mockResolvedValueOnce({ Items: [{ RouteId: "r1", RouteKey: "GET /hello" }] });
    const res = await get("/apis/api-1/routes");
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /apis/:apiId/routes — sparse response defaults to []", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/apis/api-1/routes");
    const body = await res.json();
    expect(body).toEqual({ routes: [], total: 0 });
  });

  it("POST /apis/:apiId/routes — creates route (201)", async () => {
    mockSend.mockResolvedValueOnce({ RouteId: "r1" });
    const res = await post("/apis/api-1/routes", { routeKey: "GET /hello" });
    expect(res.status).toBe(201);
  });

  it("POST /apis/:apiId/routes — 400 if routeKey missing", async () => {
    const res = await post("/apis/api-1/routes", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /apis/:apiId/routes/:routeId — deletes route", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/apis/api-1/routes/r1");
    expect(res.status).toBe(200);
  });

  it("GET /apis/:apiId/integrations — lists integrations", async () => {
    mockSend.mockResolvedValueOnce({ Items: [{ IntegrationId: "i1", IntegrationType: "HTTP_PROXY" }] });
    const res = await get("/apis/api-1/integrations");
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /apis/:apiId/integrations — sparse response defaults to []", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/apis/api-1/integrations");
    const body = await res.json();
    expect(body).toEqual({ integrations: [], total: 0 });
  });

  it("DELETE /apis/:apiId/integrations/:integrationId — deletes integration", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/apis/api-1/integrations/i1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteIntegrationCommand");
    expect(mockSend.mock.calls[0][0].IntegrationId).toBe("i1");
  });

  it("POST /apis/:apiId/integrations — creates integration (201)", async () => {
    mockSend.mockResolvedValueOnce({ IntegrationId: "i1" });
    const res = await post("/apis/api-1/integrations", { integrationType: "HTTP_PROXY", integrationUri: "http://example.com" });
    expect(res.status).toBe(201);
  });

  it("POST /apis/:apiId/integrations — 400 if integrationType missing", async () => {
    const res = await post("/apis/api-1/integrations", {});
    expect(res.status).toBe(400);
  });

  it("GET /apis/:apiId/stages — lists stages", async () => {
    mockSend.mockResolvedValueOnce({ Items: [{ StageName: "$default" }] });
    const res = await get("/apis/api-1/stages");
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /apis/:apiId/stages — sparse response defaults to []", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/apis/api-1/stages");
    const body = await res.json();
    expect(body).toEqual({ stages: [], total: 0 });
  });

  it("POST /apis/:apiId/stages — creates stage (201)", async () => {
    mockSend.mockResolvedValueOnce({ StageName: "prod" });
    const res = await post("/apis/api-1/stages", { stageName: "prod" });
    expect(res.status).toBe(201);
  });

  it("POST /apis/:apiId/stages — 400 if stageName missing", async () => {
    const res = await post("/apis/api-1/stages", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /apis/:apiId/stages/:stageName — deletes stage", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/apis/api-1/stages/prod");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteStageCommand");
    expect(mockSend.mock.calls[0][0].StageName).toBe("prod");
  });

  it("GET /apis/:apiId/deployments — lists deployments", async () => {
    mockSend.mockResolvedValueOnce({ Items: [{ DeploymentId: "d1", DeploymentStatus: "DEPLOYED" }] });
    const res = await get("/apis/api-1/deployments");
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /apis/:apiId/deployments — sparse response defaults to []", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/apis/api-1/deployments");
    const body = await res.json();
    expect(body).toEqual({ deployments: [], total: 0 });
  });

  it("POST /apis/:apiId/deployments — creates deployment (201)", async () => {
    mockSend.mockResolvedValueOnce({ DeploymentId: "d1" });
    const res = await post("/apis/api-1/deployments", {});
    expect(res.status).toBe(201);
  });

  it("DELETE /apis/:apiId/deployments/:deploymentId — deletes deployment", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/apis/api-1/deployments/d1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteDeploymentCommand");
    expect(mockSend.mock.calls[0][0].DeploymentId).toBe("d1");
  });
});

describe("API Gateway V2 WebSocket", () => {
  it("GET /websocket-apis — filters WEBSOCKET only", async () => {
    mockSend.mockResolvedValueOnce({
      Items: [
        { ApiId: "http-1", Name: "http-api", ProtocolType: "HTTP" },
        { ApiId: "ws-1", Name: "ws-api", ProtocolType: "WEBSOCKET", ApiEndpoint: "wss://x", RouteSelectionExpression: "$request.body.action", CreatedDate: 1705000000 },
      ],
    });
    const res = await get("/websocket-apis");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.apis[0].ApiId).toBe("ws-1");
    expect(body.apis[0].ProtocolType).toBe("WEBSOCKET");
    expect(body.apis[0].RouteSelectionExpression).toBe("$request.body.action");
  });

  it("GET /websocket-apis — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/websocket-apis");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("GET /apis/:apiId/websocket-routes — resolves integration by Target", async () => {
    mockSend
      .mockResolvedValueOnce({
        Items: [
          { RouteId: "r-1", RouteKey: "$connect", Target: "integrations/int-1", AuthorizationType: "NONE" },
        ],
      })
      .mockResolvedValueOnce({
        Items: [
          { IntegrationId: "int-1", IntegrationType: "AWS_PROXY", IntegrationUri: "arn:lambda:connect", IntegrationMethod: "POST" },
        ],
      });
    const res = await get("/apis/api-1/websocket-routes");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    const route = body.routes[0];
    expect(route.RouteKey).toBe("$connect");
    expect(route.integrationId).toBe("int-1");
    expect(route.integration.IntegrationType).toBe("AWS_PROXY");
    expect(route.integration.IntegrationUri).toBe("arn:lambda:connect");
    expect(route.isWellKnown).toBe(true);
    // Assert ApiId is passed to both commands
    expect(mockSend.mock.calls[0][0].ApiId).toBe("api-1");
    expect(mockSend.mock.calls[1][0].ApiId).toBe("api-1");
  });

  it("GET /apis/:apiId/websocket-routes — null integration when target missing or unmatched", async () => {
    mockSend
      .mockResolvedValueOnce({
        Items: [
          { RouteId: "r-1", RouteKey: "customAction" },
          { RouteId: "r-2", RouteKey: "$default", Target: "integrations/missing" },
        ],
      })
      .mockResolvedValueOnce({
        Items: [
          { IntegrationId: "int-1", IntegrationType: "AWS_PROXY" },
        ],
      });
    const res = await get("/apis/api-1/websocket-routes");
    const body = await res.json();
    expect(body.total).toBe(2);
    // no target
    expect(body.routes[0].target).toBe(null);
    expect(body.routes[0].integrationId).toBe(null);
    expect(body.routes[0].integration).toBe(null);
    expect(body.routes[0].isWellKnown).toBe(false);
    // unmatched target id
    expect(body.routes[1].integrationId).toBe("missing");
    expect(body.routes[1].integration).toBe(null);
    expect(body.routes[1].isWellKnown).toBe(true);
  });

  it("GET /apis/:apiId/websocket-routes — skips integration without IntegrationId", async () => {
    mockSend
      .mockResolvedValueOnce({
        Items: [{ RouteId: "r-1", RouteKey: "$connect", Target: "integrations/ghost" }],
      })
      .mockResolvedValueOnce({
        Items: [{ IntegrationType: "AWS_PROXY", IntegrationUri: "arn:lambda:connect" }],
      });
    const res = await get("/apis/api-1/websocket-routes");
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.routes[0].integrationId).toBe("ghost");
    expect(body.routes[0].integration).toBe(null);
    expect(mockSend.mock.calls[1][0].__cmdName).toBe("GetIntegrationsCommand");
  });

  it("GET /apis/:apiId/websocket-routes — empty list", async () => {
    mockSend.mockResolvedValueOnce({}).mockResolvedValueOnce({});
    const res = await get("/apis/api-1/websocket-routes");
    const body = await res.json();
    expect(body.total).toBe(0);
  });
});

describe("G.96 — authorizers, models, sub-resources, tags", () => {
  it("GET /apis/:apiId/authorizers — lists authorizers (and empty)", async () => {
    mockSend.mockResolvedValueOnce({ Items: [{ AuthorizerId: "a-1", Name: "my-auth" }] });
    const res = await get("/apis/api-1/authorizers");
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.authorizers[0].Name).toBe("my-auth");
    mockSend.mockResolvedValueOnce({});
    const res2 = await get("/apis/api-1/authorizers");
    expect((await res2.json()).total).toBe(0);
  });

  it("GET /apis/:apiId/authorizers/:id — gets a single authorizer", async () => {
    mockSend.mockResolvedValueOnce({ AuthorizerId: "a-1", Name: "my-auth", AuthorizerType: "REQUEST" });
    const res = await get("/apis/api-1/authorizers/a-1");
    const body = await res.json();
    expect(body.authorizer.Name).toBe("my-auth");
  });

  it("POST /apis/:apiId/authorizers — creates (201) and 400s without name/type", async () => {
    mockSend.mockResolvedValueOnce({ AuthorizerId: "a-2" });
    const res = await post("/apis/api-1/authorizers", { name: "auth", authorizerType: "REQUEST", identitySource: ["$request.header.Authorization"], authorizerUri: "arn:lambda", enableSimpleResponses: true });
    expect(res.status).toBe(201);
    expect((await res.json()).authorizer.AuthorizerId).toBe("a-2");
    mockSend.mockResolvedValueOnce({ AuthorizerId: "a-3" });
    const resMin = await post("/apis/api-1/authorizers", { name: "min", authorizerType: "JWT" });
    expect(resMin.status).toBe(201);
    expect((await post("/apis/api-1/authorizers", { authorizerType: "REQUEST" })).status).toBe(400);
    expect((await post("/apis/api-1/authorizers", { name: "x" })).status).toBe(400);
  });

  it("PUT /apis/:apiId/authorizers/:id — updates and 400s without name/type", async () => {
    mockSend.mockResolvedValueOnce({ AuthorizerId: "a-1", Name: "renamed" });
    const res = await put("/apis/api-1/authorizers/a-1", { name: "renamed", authorizerType: "JWT", enableSimpleResponses: false });
    expect(res.status).toBe(200);
    expect((await res.json()).authorizer.Name).toBe("renamed");
    mockSend.mockResolvedValueOnce({ AuthorizerId: "a-1", Name: "min" });
    const resMin = await put("/apis/api-1/authorizers/a-1", { name: "min", authorizerType: "REQUEST" });
    expect(resMin.status).toBe(200);
    expect((await put("/apis/api-1/authorizers/a-1", { name: "x" })).status).toBe(400);
  });

  it("DELETE /apis/:apiId/authorizers/:id — deletes", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/apis/api-1/authorizers/a-1");
    expect((await res.json()).deleted).toBe(true);
  });

  it("GET /apis/:apiId/models — lists models (and empty)", async () => {
    mockSend.mockResolvedValueOnce({ Items: [{ ModelId: "m-1", Name: "pet" }] });
    const res = await get("/apis/api-1/models");
    const body = await res.json();
    expect(body.total).toBe(1);
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/apis/api-1/models")).json()).total).toBe(0);
  });

  it("GET /apis/:apiId/models/:id — gets a single model", async () => {
    mockSend.mockResolvedValueOnce({ ModelId: "m-1", Name: "pet", Schema: "{}" });
    const res = await get("/apis/api-1/models/m-1");
    expect((await res.json()).model.Name).toBe("pet");
  });

  it("POST /apis/:apiId/models — creates (201) and 400s without name", async () => {
    mockSend.mockResolvedValueOnce({ ModelId: "m-2" });
    const res = await post("/apis/api-1/models", { name: "pet", contentType: "application/json", schema: "{\"x\":1}" });
    expect(res.status).toBe(201);
    mockSend.mockResolvedValueOnce({ ModelId: "m-3" });
    const resMin = await post("/apis/api-1/models", { name: "bare" });
    expect(resMin.status).toBe(201);
    expect((await post("/apis/api-1/models", {})).status).toBe(400);
  });

  it("PUT /apis/:apiId/models/:id — updates and 400s without name", async () => {
    mockSend.mockResolvedValueOnce({ ModelId: "m-1", Name: "pet2" });
    const res = await put("/apis/api-1/models/m-1", { name: "pet2" });
    expect((await res.json()).model.Name).toBe("pet2");
    expect((await put("/apis/api-1/models/m-1", {})).status).toBe(400);
  });

  it("DELETE /apis/:apiId/models/:id — deletes", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/apis/api-1/models/m-1");
    expect((await res.json()).deleted).toBe(true);
  });

  it("integration responses — list (and empty), get, create 201, update, delete, 400s", async () => {
    mockSend.mockResolvedValueOnce({ Items: [{ IntegrationResponseId: "ir-1", IntegrationResponseKey: "200" }] });
    const res = await get("/apis/api-1/integrations/i-1/integrationresponses");
    expect((await res.json()).total).toBe(1);
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/apis/api-1/integrations/i-1/integrationresponses")).json()).total).toBe(0);

    mockSend.mockResolvedValueOnce({ IntegrationResponseId: "ir-1", IntegrationResponseKey: "200" });
    const res2 = await get("/apis/api-1/integrations/i-1/integrationresponses/ir-1");
    expect((await res2.json()).integrationResponse.IntegrationResponseKey).toBe("200");

    mockSend.mockResolvedValueOnce({ IntegrationResponseId: "ir-2" });
    const res3 = await post("/apis/api-1/integrations/i-1/integrationresponses", { integrationResponseKey: "400", responseTemplates: { "application/json": "{}" } });
    expect(res3.status).toBe(201);
    mockSend.mockResolvedValueOnce({ IntegrationResponseId: "ir-3" });
    const res3b = await post("/apis/api-1/integrations/i-1/integrationresponses", { integrationResponseKey: "500" });
    expect(res3b.status).toBe(201);
    expect((await post("/apis/api-1/integrations/i-1/integrationresponses", {})).status).toBe(400);

    mockSend.mockResolvedValueOnce({ IntegrationResponseId: "ir-1", IntegrationResponseKey: "201" });
    const res4 = await put("/apis/api-1/integrations/i-1/integrationresponses/ir-1", { integrationResponseKey: "201" });
    expect((await res4.json()).integrationResponse.IntegrationResponseKey).toBe("201");
    expect((await put("/apis/api-1/integrations/i-1/integrationresponses/ir-1", {})).status).toBe(400);

    mockSend.mockResolvedValueOnce({});
    const res5 = await del("/apis/api-1/integrations/i-1/integrationresponses/ir-1");
    expect((await res5.json()).deleted).toBe(true);
  });

  it("route responses — list (and empty), get, create 201, update, delete, 400s", async () => {
    mockSend.mockResolvedValueOnce({ Items: [{ RouteResponseId: "rr-1", RouteResponseKey: "200" }] });
    const res = await get("/apis/api-1/routes/r-1/routeresponses");
    expect((await res.json()).total).toBe(1);
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/apis/api-1/routes/r-1/routeresponses")).json()).total).toBe(0);

    mockSend.mockResolvedValueOnce({ RouteResponseId: "rr-1", RouteResponseKey: "200" });
    const res2 = await get("/apis/api-1/routes/r-1/routeresponses/rr-1");
    expect((await res2.json()).routeResponse.RouteResponseKey).toBe("200");

    mockSend.mockResolvedValueOnce({ RouteResponseId: "rr-2" });
    const res3 = await post("/apis/api-1/routes/r-1/routeresponses", { routeResponseKey: "default", responseModels: { "application/json": "pet" } });
    expect(res3.status).toBe(201);
    mockSend.mockResolvedValueOnce({ RouteResponseId: "rr-3" });
    const res3b = await post("/apis/api-1/routes/r-1/routeresponses", { routeResponseKey: "2xx" });
    expect(res3b.status).toBe(201);
    expect((await post("/apis/api-1/routes/r-1/routeresponses", {})).status).toBe(400);

    mockSend.mockResolvedValueOnce({ RouteResponseId: "rr-1", RouteResponseKey: "201" });
    const res4 = await put("/apis/api-1/routes/r-1/routeresponses/rr-1", { routeResponseKey: "201" });
    expect((await res4.json()).routeResponse.RouteResponseKey).toBe("201");
    expect((await put("/apis/api-1/routes/r-1/routeresponses/rr-1", {})).status).toBe(400);

    mockSend.mockResolvedValueOnce({});
    const res5 = await del("/apis/api-1/routes/r-1/routeresponses/rr-1");
    expect((await res5.json()).deleted).toBe(true);
  });

  it("single get/update — route, integration, deployment, stage", async () => {
    mockSend.mockResolvedValueOnce({ RouteId: "r-1", RouteKey: "GET /pets" });
    const res = await get("/apis/api-1/routes/r-1");
    expect((await res.json()).route.RouteKey).toBe("GET /pets");

    mockSend.mockResolvedValueOnce({ RouteId: "r-1", RouteKey: "GET /dogs" });
    const res2 = await put("/apis/api-1/routes/r-1", { routeKey: "GET /dogs", authorizationType: "JWT", target: "integrations/i-1", authorizerId: "a-1" });
    expect((await res2.json()).route.RouteKey).toBe("GET /dogs");
    mockSend.mockResolvedValueOnce({ RouteId: "r-1", RouteKey: "GET /cats" });
    const res2b = await put("/apis/api-1/routes/r-1", { routeKey: "GET /cats" });
    expect((await res2b.json()).route.RouteKey).toBe("GET /cats");
    expect((await put("/apis/api-1/routes/r-1", {})).status).toBe(400);

    mockSend.mockResolvedValueOnce({ IntegrationId: "i-1", IntegrationType: "AWS_PROXY" });
    const res3 = await get("/apis/api-1/integrations/i-1");
    expect((await res3.json()).integration.IntegrationType).toBe("AWS_PROXY");

    mockSend.mockResolvedValueOnce({ IntegrationId: "i-1", IntegrationType: "HTTP_PROXY" });
    const res4 = await put("/apis/api-1/integrations/i-1", { integrationType: "HTTP_PROXY", integrationUri: "https://x" });
    expect((await res4.json()).integration.IntegrationType).toBe("HTTP_PROXY");
    mockSend.mockResolvedValueOnce({ IntegrationId: "i-1", IntegrationType: "AWS" });
    const res4b = await put("/apis/api-1/integrations/i-1", { integrationType: "AWS" });
    expect((await res4b.json()).integration.IntegrationType).toBe("AWS");
    expect((await put("/apis/api-1/integrations/i-1", {})).status).toBe(400);

    mockSend.mockResolvedValueOnce({ DeploymentId: "d-1", DeploymentStatus: "DEPLOYED" });
    const res5 = await get("/apis/api-1/deployments/d-1");
    expect((await res5.json()).deployment.DeploymentId).toBe("d-1");

    mockSend.mockResolvedValueOnce({ DeploymentId: "d-1", Description: "updated" });
    const res6 = await put("/apis/api-1/deployments/d-1", { description: "updated" });
    expect((await res6.json()).deployment.Description).toBe("updated");

    mockSend.mockResolvedValueOnce({ StageName: "prod", AutoDeploy: true });
    const res7 = await get("/apis/api-1/stages/prod");
    expect((await res7.json()).stage.StageName).toBe("prod");

    mockSend.mockResolvedValueOnce({ StageName: "prod", AutoDeploy: false });
    const res8 = await put("/apis/api-1/stages/prod", { autoDeploy: false, deploymentId: "d-9", description: "v2" });
    expect((await res8.json()).stage.AutoDeploy).toBe(false);
    mockSend.mockResolvedValueOnce({ StageName: "prod" });
    const res8b = await put("/apis/api-1/stages/prod", {});
    expect((await res8b.json()).stage.StageName).toBe("prod");
  });

  it("tags — get, tag, untag with validation", async () => {
    mockSend.mockResolvedValueOnce({ Tags: { env: "dev" } });
    const res = await get("/apis/api-1/tags");
    expect((await res.json()).tags.env).toBe("dev");
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/apis/api-1/tags")).json()).tags).toEqual({});

    mockSend.mockResolvedValueOnce({});
    const res2 = await put("/apis/api-1/tags", { tags: { env: "dev", team: "x" } });
    expect((await res2.json()).tagged).toBe(true);
    expect((await put("/apis/api-1/tags", {})).status).toBe(400);

    mockSend.mockResolvedValueOnce({});
    const res3 = await delBody("/apis/api-1/tags", { tagKeys: ["env"] });
    expect((await res3.json()).untagged).toBe(true);
    expect((await delBody("/apis/api-1/tags", {})).status).toBe(400);
  });
});
