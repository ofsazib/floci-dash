import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());
const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) { return { __cmdName: name, ...args }; });
  };
});

vi.mock("@aws-sdk/client-appconfig", () => ({
  AppConfigClient: vi.fn(function () { return { send: mockSend }; }),
  ListApplicationsCommand: createCmd("ListApplicationsCommand"),
  GetApplicationCommand: createCmd("GetApplicationCommand"),
  CreateApplicationCommand: createCmd("CreateApplicationCommand"),
  DeleteApplicationCommand: createCmd("DeleteApplicationCommand"),
  ListEnvironmentsCommand: createCmd("ListEnvironmentsCommand"),
  CreateEnvironmentCommand: createCmd("CreateEnvironmentCommand"),
  DeleteEnvironmentCommand: createCmd("DeleteEnvironmentCommand"),
  ListConfigurationProfilesCommand: createCmd("ListConfigurationProfilesCommand"),
  CreateConfigurationProfileCommand: createCmd("CreateConfigurationProfileCommand"),
  DeleteConfigurationProfileCommand: createCmd("DeleteConfigurationProfileCommand"),
  ListHostedConfigurationVersionsCommand: createCmd("ListHostedConfigurationVersionsCommand"),
}));

vi.mock("../../clients/aws", () => ({ create: (Ctor: any, extra?: any) => new Ctor(extra) }));

import router from "./appconfig";

async function get(p: string) { return router.request(p, { method: "GET" }); }
async function post(p: string, b?: any) {
  return router.request(p, { method: "POST", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}
async function del(p: string) { return router.request(p, { method: "DELETE" }); }

beforeEach(() => mockSend.mockReset());

describe("AppConfig Routes", () => {
  it("GET /applications — lists apps", async () => {
    mockSend.mockResolvedValueOnce({ Items: [{ Id: "app-1", Name: "myapp" }] });
    const res = await get("/applications");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /applications — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/applications");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("GET /applications/:id — gets app", async () => {
    mockSend.mockResolvedValueOnce({ Id: "app-1", Name: "myapp" });
    const res = await get("/applications/app-1");
    expect(res.status).toBe(200);
  });

  it("POST /applications — creates app (201)", async () => {
    mockSend.mockResolvedValueOnce({ Id: "new" });
    const res = await post("/applications", { name: "myapp" });
    expect(res.status).toBe(201);
  });

  it("POST /applications — creates app with description", async () => {
    mockSend.mockResolvedValueOnce({ Id: "new-desc" });
    const res = await post("/applications", { name: "myapp", description: "My app" });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].Description).toBe("My app");
  });

  it("POST /applications — 400 if name missing", async () => {
    const res = await post("/applications", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /applications/:id — deletes app", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/applications/app-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it("GET /applications/:id/environments — lists environments", async () => {
    mockSend.mockResolvedValueOnce({ Items: [{ Id: "env-1", Name: "dev" }] });
    const res = await get("/applications/app-1/environments");
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /applications/:id/environments — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/applications/app-1/environments");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("POST /applications/:id/environments — creates env (201)", async () => {
    mockSend.mockResolvedValueOnce({ Id: "env-1" });
    const res = await post("/applications/app-1/environments", { name: "dev" });
    expect(res.status).toBe(201);
  });

  it("POST /applications/:id/environments — creates env with description", async () => {
    mockSend.mockResolvedValueOnce({ Id: "env-2" });
    const res = await post("/applications/app-1/environments", { name: "prod", description: "Production env" });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].Description).toBe("Production env");
  });

  it("POST /applications/:id/environments — 400 when name missing", async () => {
    const res = await post("/applications/app-1/environments", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /applications/:appId/environments/:envId — deletes env", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/applications/app-1/environments/env-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it("GET /applications/:id/configuration-profiles — lists profiles", async () => {
    mockSend.mockResolvedValueOnce({ Items: [{ Id: "prof-1", Name: "config" }] });
    const res = await get("/applications/app-1/configuration-profiles");
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /applications/:id/configuration-profiles — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/applications/app-1/configuration-profiles");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("POST /applications/:id/configuration-profiles — creates profile (201)", async () => {
    mockSend.mockResolvedValueOnce({ Id: "prof-1" });
    const res = await post("/applications/app-1/configuration-profiles", { name: "config" });
    expect(res.status).toBe(201);
  });

  it("POST /applications/:id/configuration-profiles — with locationUri (truthy), type, and description", async () => {
    mockSend.mockResolvedValueOnce({ Id: "prof-2" });
    const res = await post("/applications/app-1/configuration-profiles", {
      name: "config-ext",
      locationUri: "https://example.com/config",
      type: "AWS::AppConfig::FeatureFlag",
      description: "External config",
    });
    expect(res.status).toBe(201);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.LocationUri).toBe("https://example.com/config");
    expect(cmd.Type).toBe("AWS::AppConfig::FeatureFlag");
    expect(cmd.Description).toBe("External config");
  });

  it("POST /applications/:id/configuration-profiles — 400 when name missing", async () => {
    const res = await post("/applications/app-1/configuration-profiles", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /applications/:appId/configuration-profiles/:profileId — deletes profile", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/applications/app-1/configuration-profiles/prof-1");
    expect(res.status).toBe(200);
  });

  it("GET /applications/:appId/configuration-profiles/:profileId/versions — lists versions", async () => {
    mockSend.mockResolvedValueOnce({ Items: [{ VersionNumber: 1 }] });
    const res = await get("/applications/app-1/configuration-profiles/prof-1/versions");
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /applications/:appId/configuration-profiles/:profileId/versions — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/applications/app-1/configuration-profiles/prof-1/versions");
    const body = await res.json();
    expect(body.total).toBe(0);
  });
});
