import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockCodeDeploy = vi.hoisted(
  () =>
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

vi.mock("@aws-sdk/client-codedeploy", () => ({
  CodeDeployClient: mockCodeDeploy,
  ListApplicationsCommand: createCmd("ListApplicationsCommand"),
  CreateApplicationCommand: createCmd("CreateApplicationCommand"),
  GetApplicationCommand: createCmd("GetApplicationCommand"),
  UpdateApplicationCommand: createCmd("UpdateApplicationCommand"),
  DeleteApplicationCommand: createCmd("DeleteApplicationCommand"),
  BatchGetApplicationsCommand: createCmd("BatchGetApplicationsCommand"),
  ListDeploymentGroupsCommand: createCmd("ListDeploymentGroupsCommand"),
  CreateDeploymentGroupCommand: createCmd("CreateDeploymentGroupCommand"),
  GetDeploymentGroupCommand: createCmd("GetDeploymentGroupCommand"),
  UpdateDeploymentGroupCommand: createCmd("UpdateDeploymentGroupCommand"),
  DeleteDeploymentGroupCommand: createCmd("DeleteDeploymentGroupCommand"),
  BatchGetDeploymentGroupsCommand: createCmd("BatchGetDeploymentGroupsCommand"),
  ListDeploymentConfigsCommand: createCmd("ListDeploymentConfigsCommand"),
  CreateDeploymentConfigCommand: createCmd("CreateDeploymentConfigCommand"),
  GetDeploymentConfigCommand: createCmd("GetDeploymentConfigCommand"),
  DeleteDeploymentConfigCommand: createCmd("DeleteDeploymentConfigCommand"),
  CreateDeploymentCommand: createCmd("CreateDeploymentCommand"),
  ListDeploymentsCommand: createCmd("ListDeploymentsCommand"),
  BatchGetDeploymentsCommand: createCmd("BatchGetDeploymentsCommand"),
  GetDeploymentCommand: createCmd("GetDeploymentCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./codedeploy";

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
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("CodeDeploy Routes", () => {
  describe("Applications", () => {
    it("GET /applications — lists applications", async () => {
      mockSend
        .mockResolvedValueOnce({ applications: ["app1", "app2"] })
        .mockResolvedValueOnce({
          applicationsInfo: [{ applicationName: "app1" }, { applicationName: "app2" }],
        });
      const res = await get("/applications");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.total).toBe(2);
      expect(json.applications).toHaveLength(2);
    });

    it("GET /applications — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ applications: [] });
      const res = await get("/applications");
      const json = await res.json();
      expect(json.total).toBe(0);
      expect(json.applications).toEqual([]);
    });

    it("POST /applications — creates an application", async () => {
      mockSend.mockResolvedValueOnce({ applicationId: "app-id-1" });
      const res = await post("/applications", { applicationName: "my-app" });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.created).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateApplicationCommand");
    });

    it("POST /applications — 400 when applicationName missing", async () => {
      const res = await post("/applications", {});
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("applicationName is required");
    });

    it("GET /applications/:name — gets an application", async () => {
      mockSend.mockResolvedValueOnce({
        application: { applicationName: "my-app", description: "Test app" },
      });
      const res = await get("/applications/my-app");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.application.applicationName).toBe("my-app");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetApplicationCommand");
    });

    it("PUT /applications/:name — updates an application", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/applications/my-app", { newApplicationName: "renamed-app" });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.updated).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateApplicationCommand");
    });

    it("DELETE /applications/:name — deletes an application", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/applications/my-app");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteApplicationCommand");
    });
  });

  describe("Deployment Groups", () => {
    it("GET /applications/:name/deployment-groups — lists groups", async () => {
      mockSend
        .mockResolvedValueOnce({ deploymentGroups: ["grp1", "grp2"] })
        .mockResolvedValueOnce({
          deploymentGroupsInfo: [
            { deploymentGroupName: "grp1" },
            { deploymentGroupName: "grp2" },
          ],
        });
      const res = await get("/applications/my-app/deployment-groups");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.total).toBe(2);
      expect(json.deploymentGroups).toHaveLength(2);
    });

    it("GET /applications/:name/deployment-groups — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ deploymentGroups: [] });
      const res = await get("/applications/my-app/deployment-groups");
      const json = await res.json();
      expect(json.total).toBe(0);
      expect(json.deploymentGroups).toEqual([]);
    });

    it("POST /applications/:name/deployment-groups — creates a group", async () => {
      mockSend.mockResolvedValueOnce({ deploymentGroupId: "grp-id-1" });
      const res = await post("/applications/my-app/deployment-groups", {
        deploymentGroupName: "my-group",
        serviceRoleArn: "arn:aws:iam::123456789012:role/MyRole",
      });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.created).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateDeploymentGroupCommand");
    });

    it("POST /applications/:name/deployment-groups — 400 when fields missing", async () => {
      const res = await post("/applications/my-app/deployment-groups", {});
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("deploymentGroupName and serviceRoleArn are required");
    });

    it("GET /deployment-groups/:groupName — gets a deployment group", async () => {
      mockSend.mockResolvedValueOnce({
        deploymentGroupInfo: { deploymentGroupName: "my-group" },
      });
      const res = await get("/deployment-groups/my-group?applicationName=my-app");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.deploymentGroup.deploymentGroupName).toBe("my-group");
    });

    it("GET /deployment-groups/:groupName — 400 without applicationName", async () => {
      const res = await get("/deployment-groups/my-group");
      expect(res.status).toBe(400);
    });

    it("DELETE /deployment-groups/:groupName — deletes a group", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/deployment-groups/my-group?applicationName=my-app");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.deleted).toBe(true);
    });

    it("DELETE /deployment-groups/:groupName — 400 without applicationName", async () => {
      const res = await del("/deployment-groups/my-group");
      expect(res.status).toBe(400);
    });
  });

  describe("Deployment Configs", () => {
    it("GET /deployment-configs — lists configs", async () => {
      mockSend.mockResolvedValueOnce({
        deploymentConfigsList: ["CodeDeployDefault.OneAtATime"],
      });
      const res = await get("/deployment-configs");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.deploymentConfigs).toHaveLength(1);
    });

    it("POST /deployment-configs — creates a config", async () => {
      mockSend.mockResolvedValueOnce({ deploymentConfigId: "cfg-id-1" });
      const res = await post("/deployment-configs", {
        deploymentConfigName: "MyConfig",
      });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.created).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateDeploymentConfigCommand");
    });

    it("POST /deployment-configs — 400 when deploymentConfigName missing", async () => {
      const res = await post("/deployment-configs", {});
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("deploymentConfigName is required");
    });

    it("GET /deployment-configs/:name — gets a config", async () => {
      mockSend.mockResolvedValueOnce({
        deploymentConfigInfo: { deploymentConfigName: "MyConfig" },
      });
      const res = await get("/deployment-configs/MyConfig");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.deploymentConfig.deploymentConfigName).toBe("MyConfig");
    });

    it("DELETE /deployment-configs/:name — deletes a config", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/deployment-configs/MyConfig");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.deleted).toBe(true);
    });
  });

  describe("Deployments", () => {
    it("POST /applications/:name/deployments — creates a deployment", async () => {
      mockSend.mockResolvedValueOnce({ deploymentId: "deploy-id-1" });
      const res = await post("/applications/my-app/deployments", {
        deploymentGroupName: "my-group",
      });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.created).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateDeploymentCommand");
    });

    it("POST /applications/:name/deployments — 400 when deploymentGroupName missing", async () => {
      const res = await post("/applications/my-app/deployments", {});
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("deploymentGroupName is required");
    });

    it("GET /applications/:name/deployments — lists deployments", async () => {
      mockSend
        .mockResolvedValueOnce({ deployments: ["d1", "d2"] })
        .mockResolvedValueOnce({
          deploymentsInfo: [{ deploymentId: "d1" }, { deploymentId: "d2" }],
        });
      const res = await get("/applications/my-app/deployments");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.total).toBe(2);
      expect(json.deployments).toHaveLength(2);
    });

    it("GET /applications/:name/deployments — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ deployments: [] });
      const res = await get("/applications/my-app/deployments");
      const json = await res.json();
      expect(json.total).toBe(0);
      expect(json.deployments).toEqual([]);
    });

    it("GET /deployments/:deployId — gets a deployment", async () => {
      mockSend.mockResolvedValueOnce({
        deploymentInfo: { deploymentId: "d1", status: "Succeeded" },
      });
      const res = await get("/deployments/d1");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.deployment.deploymentId).toBe("d1");
    });
  });

  describe("Tags", () => {
    it("GET /tags — lists tags for resourceArn", async () => {
      mockSend.mockResolvedValueOnce({
        Tags: [{ Key: "env", Value: "prod" }],
      });
      const res = await get("/tags?resourceArn=arn:aws:codedeploy:us-east-1:123:application:my-app");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.tags).toHaveLength(1);
    });

    it("GET /tags — 400 without resourceArn", async () => {
      const res = await get("/tags");
      expect(res.status).toBe(400);
    });

    it("POST /tags — tags a resource", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tags", {
        resourceArn: "arn:aws:codedeploy:us-east-1:123:application:my-app",
        tags: [{ Key: "env", Value: "prod" }],
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.tagged).toBe(true);
    });

    it("POST /tags — 400 when fields missing", async () => {
      const res = await post("/tags", {});
      expect(res.status).toBe(400);
    });

    it("POST /tags/untag — untags a resource", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tags/untag", {
        resourceArn: "arn:aws:codedeploy:us-east-1:123:application:my-app",
        tagKeys: ["env"],
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.untagged).toBe(true);
    });

    it("POST /tags/untag — 400 when fields missing", async () => {
      const res = await post("/tags/untag", {});
      expect(res.status).toBe(400);
    });
  });
});
