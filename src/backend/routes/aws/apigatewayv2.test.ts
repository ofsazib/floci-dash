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
}));

vi.mock("../../clients/aws", () => ({ create: (Ctor: any, extra?: any) => new Ctor(extra) }));

import router from "./apigatewayv2";

async function get(p: string) { return router.request(p, { method: "GET" }); }
async function post(p: string, b?: any) {
  return router.request(p, { method: "POST", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}
async function del(p: string) { return router.request(p, { method: "DELETE" }); }

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

  it("POST /apis/:apiId/stages — creates stage (201)", async () => {
    mockSend.mockResolvedValueOnce({ StageName: "prod" });
    const res = await post("/apis/api-1/stages", { stageName: "prod" });
    expect(res.status).toBe(201);
  });

  it("GET /apis/:apiId/deployments — lists deployments", async () => {
    mockSend.mockResolvedValueOnce({ Items: [{ DeploymentId: "d1", DeploymentStatus: "DEPLOYED" }] });
    const res = await get("/apis/api-1/deployments");
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("POST /apis/:apiId/deployments — creates deployment (201)", async () => {
    mockSend.mockResolvedValueOnce({ DeploymentId: "d1" });
    const res = await post("/apis/api-1/deployments", {});
    expect(res.status).toBe(201);
  });
});
