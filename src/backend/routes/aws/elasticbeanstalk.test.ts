import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockEbClient = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-elastic-beanstalk", () => ({
  ElasticBeanstalkClient: mockEbClient,
  CreateApplicationCommand: createCmd("CreateApplicationCommand"),
  DescribeApplicationsCommand: createCmd("DescribeApplicationsCommand"),
  UpdateApplicationCommand: createCmd("UpdateApplicationCommand"),
  DeleteApplicationCommand: createCmd("DeleteApplicationCommand"),
  CreateApplicationVersionCommand: createCmd("CreateApplicationVersionCommand"),
  DescribeApplicationVersionsCommand: createCmd("DescribeApplicationVersionsCommand"),
  DeleteApplicationVersionCommand: createCmd("DeleteApplicationVersionCommand"),
  CreateEnvironmentCommand: createCmd("CreateEnvironmentCommand"),
  DescribeEnvironmentsCommand: createCmd("DescribeEnvironmentsCommand"),
  UpdateEnvironmentCommand: createCmd("UpdateEnvironmentCommand"),
  TerminateEnvironmentCommand: createCmd("TerminateEnvironmentCommand"),
  DescribeConfigurationSettingsCommand: createCmd("DescribeConfigurationSettingsCommand"),
  CheckDNSAvailabilityCommand: createCmd("CheckDNSAvailabilityCommand"),
  ListAvailableSolutionStacksCommand: createCmd("ListAvailableSolutionStacksCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./elasticbeanstalk";

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

describe("Elastic Beanstalk Routes", () => {
  describe("Applications", () => {
    it("GET /applications — lists applications", async () => {
      mockSend.mockResolvedValueOnce({
        Applications: [
          { ApplicationName: "my-app", Description: "Test app", DateCreated: new Date(), DateUpdated: new Date(), Versions: ["v1"], ConfigurationTemplates: ["default"] },
        ],
      });
      const res = await get("/applications");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.applications[0].applicationName).toBe("my-app");
      expect(body.applications[0].versions).toBe(1);
    });

    it("GET /applications — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ Applications: [] });
      const res = await get("/applications");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /applications/:name — returns app detail", async () => {
      mockSend.mockResolvedValueOnce({
        Applications: [{ ApplicationName: "my-app", Description: "Test app" }],
      });
      const res = await get("/applications/my-app");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.application.applicationName).toBe("my-app");
    });

    it("GET /applications/:name — returns null when not found", async () => {
      mockSend.mockResolvedValueOnce({ Applications: [] });
      const res = await get("/applications/nonexistent");
      const body = await res.json();
      expect(body.application).toBeNull();
    });

    it("POST /applications — creates an application", async () => {
      mockSend.mockResolvedValueOnce({
        Application: { ApplicationName: "my-app", Description: "New app" },
      });
      const res = await post("/applications", { applicationName: "my-app", description: "New app" });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.application.applicationName).toBe("my-app");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateApplicationCommand");
    });

    it("POST /applications — requires applicationName", async () => {
      const res = await post("/applications", {});
      expect(res.status).toBe(400);
    });

    it("PUT /applications/:name — updates an application", async () => {
      mockSend.mockResolvedValueOnce({
        Application: { ApplicationName: "my-app", Description: "Updated" },
      });
      const res = await put("/applications/my-app", { description: "Updated" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
    });

    it("DELETE /applications/:name — deletes an application", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/applications/my-app");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Application Versions", () => {
    it("GET /applications/:name/versions — lists versions", async () => {
      mockSend.mockResolvedValueOnce({
        ApplicationVersions: [
          { ApplicationName: "my-app", VersionLabel: "v1", Status: "PROCESSED", DateCreated: new Date() },
        ],
      });
      const res = await get("/applications/my-app/versions");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.versions[0].versionLabel).toBe("v1");
    });

    it("GET /applications/:name/versions — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ ApplicationVersions: [] });
      const res = await get("/applications/my-app/versions");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("POST /applications/:name/versions — creates version", async () => {
      mockSend.mockResolvedValueOnce({
        ApplicationVersion: { ApplicationName: "my-app", VersionLabel: "v1", Description: "First" },
      });
      const res = await post("/applications/my-app/versions", { versionLabel: "v1", description: "First" });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.version.versionLabel).toBe("v1");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateApplicationVersionCommand");
    });

    it("POST /applications/:name/versions — requires versionLabel", async () => {
      const res = await post("/applications/my-app/versions", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /applications/:name/versions/:versionLabel — deletes version", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/applications/my-app/versions/v1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Environments", () => {
    it("GET /applications/:name/environments — lists environments", async () => {
      mockSend.mockResolvedValueOnce({
        Environments: [
          { EnvironmentName: "my-env", EnvironmentId: "e-123", ApplicationName: "my-app", Status: "Ready", Health: "Green", CNAME: "my-env.elasticbeanstalk.com", DateCreated: new Date(), DateUpdated: new Date() },
        ],
      });
      const res = await get("/applications/my-app/environments");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.environments[0].environmentName).toBe("my-env");
      expect(body.environments[0].health).toBe("Green");
    });

    it("GET /applications/:name/environments — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ Environments: [] });
      const res = await get("/applications/my-app/environments");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /environments/:envName — returns env detail", async () => {
      mockSend.mockResolvedValueOnce({
        Environments: [{ EnvironmentName: "my-env", EnvironmentId: "e-123", Status: "Ready" }],
      });
      const res = await get("/environments/my-env?applicationName=my-app");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.environment.environmentName).toBe("my-env");
    });

    it("GET /environments/:envName — returns null when not found", async () => {
      mockSend.mockResolvedValueOnce({ Environments: [] });
      const res = await get("/environments/nonexistent");
      const body = await res.json();
      expect(body.environment).toBeNull();
    });

    it("POST /applications/:name/environments — creates environment", async () => {
      mockSend.mockResolvedValueOnce({
        EnvironmentName: "my-env",
        EnvironmentId: "e-123",
        ApplicationName: "my-app",
        Status: "Launching",
        DateCreated: new Date(),
        DateUpdated: new Date(),
      });
      const res = await post("/applications/my-app/environments", {
        environmentName: "my-env",
        description: "Prod",
        solutionStackName: "64bit Amazon Linux 2023 v4.0.0 running Node.js 20",
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.environment.environmentName).toBe("my-env");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateEnvironmentCommand");
    });

    it("POST /applications/:name/environments — requires environmentName", async () => {
      const res = await post("/applications/my-app/environments", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /environments/:envName — terminates environment", async () => {
      mockSend.mockResolvedValueOnce({ EnvironmentId: "e-123" });
      const res = await del("/environments/my-env");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.terminated).toBe(true);
      expect(body.environmentId).toBe("e-123");
    });
  });

  describe("Configuration", () => {
    it("GET /applications/:name/environments/:envName/configuration — returns settings", async () => {
      mockSend.mockResolvedValueOnce({
        ConfigurationSettings: [{ OptionName: "InstanceType", Value: "t3.micro" }],
      });
      const res = await get("/applications/my-app/environments/my-env/configuration");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.configurationSettings).toHaveLength(1);
      expect(body.configurationSettings[0].OptionName).toBe("InstanceType");
    });

    it("GET /applications/:name/environments/:envName/configuration — returns empty when none", async () => {
      mockSend.mockResolvedValueOnce({ ConfigurationSettings: [] });
      const res = await get("/applications/my-app/environments/my-env/configuration");
      const body = await res.json();
      expect(body.configurationSettings).toEqual([]);
    });
  });

  describe("Utility", () => {
    it("GET /solution-stacks — returns available solution stacks", async () => {
      mockSend.mockResolvedValueOnce({
        SolutionStacks: ["64bit Amazon Linux 2023 v4.0.0 running Node.js 20"],
        SolutionStackDetails: [{ SolutionStackName: "64bit Amazon Linux 2023 v4.0.0 running Node.js 20", PermittedFileTypes: [] }],
      });
      const res = await get("/solution-stacks");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.solutionStacks).toHaveLength(1);
    });

    it("GET /check-dns-availability/:cnamePrefix — checks DNS availability", async () => {
      mockSend.mockResolvedValueOnce({
        Available: true,
        FullyQualifiedCNAME: "my-app.us-east-1.elasticbeanstalk.com",
      });
      const res = await get("/check-dns-availability/my-app");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.available).toBe(true);
      expect(body.fullyQualifiedCNAME).toBeTruthy();
    });
  });
});
