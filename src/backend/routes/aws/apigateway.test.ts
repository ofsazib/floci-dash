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
