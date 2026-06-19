import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockCodeBuild = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-codebuild", () => ({
  CodeBuildClient: mockCodeBuild,
  ListProjectsCommand: createCmd("ListProjectsCommand"),
  CreateProjectCommand: createCmd("CreateProjectCommand"),
  DeleteProjectCommand: createCmd("DeleteProjectCommand"),
  BatchGetProjectsCommand: createCmd("BatchGetProjectsCommand"),
  StartBuildCommand: createCmd("StartBuildCommand"),
  ListBuildsCommand: createCmd("ListBuildsCommand"),
  BatchGetBuildsCommand: createCmd("BatchGetBuildsCommand"),
  StopBuildCommand: createCmd("StopBuildCommand"),
  ListBuildsForProjectCommand: createCmd("ListBuildsForProjectCommand"),
  ListCuratedEnvironmentImagesCommand: createCmd("ListCuratedEnvironmentImagesCommand"),
  ListSourceCredentialsCommand: createCmd("ListSourceCredentialsCommand"),
  ImportSourceCredentialsCommand: createCmd("ImportSourceCredentialsCommand"),
  DeleteSourceCredentialsCommand: createCmd("DeleteSourceCredentialsCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./codebuild";

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

async function del(path: string) {
  return router.request(path, { method: "DELETE" });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("CodeBuild Routes", () => {
  describe("Projects", () => {
    it("GET /projects — lists projects", async () => {
      mockSend
        .mockResolvedValueOnce({ projects: ["proj1", "proj2"] })
        .mockResolvedValueOnce({ projects: [{ name: "proj1" }, { name: "proj2" }] });
      const res = await get("/projects");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.total).toBe(2);
      expect(json.projects).toHaveLength(2);
    });

    it("GET /projects — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ projects: [] });
      const res = await get("/projects");
      const json = await res.json();
      expect(json.total).toBe(0);
      expect(json.projects).toEqual([]);
    });

    it("POST /projects — creates a project", async () => {
      mockSend.mockResolvedValueOnce({ project: { name: "new-proj" } });
      const res = await post("/projects", { name: "new-proj" });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.project.name).toBe("new-proj");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateProjectCommand");
    });

    it("POST /projects — 400 when name missing", async () => {
      const res = await post("/projects", { description: "test" });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("name is required");
    });

    it("GET /projects/:name — gets project", async () => {
      mockSend.mockResolvedValueOnce({ projects: [{ name: "proj1" }] });
      const res = await get("/projects/proj1");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.project.name).toBe("proj1");
    });

    it("GET /projects/:name — returns null when not found", async () => {
      mockSend.mockResolvedValueOnce({ projects: [] });
      const res = await get("/projects/nonexistent");
      const json = await res.json();
      expect(json.project).toBeNull();
    });

    it("DELETE /projects/:name — deletes project", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/projects/proj1");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteProjectCommand");
    });
  });

  describe("Builds", () => {
    it("POST /projects/:name/build — starts build", async () => {
      mockSend.mockResolvedValueOnce({ build: { id: "build-1" } });
      const res = await post("/projects/proj1/build");
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.build.id).toBe("build-1");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("StartBuildCommand");
    });

    it("GET /projects/:name/builds — lists builds for project", async () => {
      mockSend
        .mockResolvedValueOnce({ ids: ["build-1", "build-2"] })
        .mockResolvedValueOnce({ builds: [{ id: "build-1" }, { id: "build-2" }] });
      const res = await get("/projects/proj1/builds");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.total).toBe(2);
      expect(json.builds).toHaveLength(2);
    });

    it("GET /projects/:name/builds — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ ids: [] });
      const res = await get("/projects/proj1/builds");
      const json = await res.json();
      expect(json.total).toBe(0);
      expect(json.builds).toEqual([]);
    });

    it("GET /builds — lists all builds", async () => {
      mockSend
        .mockResolvedValueOnce({ ids: ["build-1"] })
        .mockResolvedValueOnce({ builds: [{ id: "build-1" }] });
      const res = await get("/builds");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.total).toBe(1);
    });

    it("GET /builds — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ ids: [] });
      const res = await get("/builds");
      const json = await res.json();
      expect(json.total).toBe(0);
    });

    it("GET /builds/:id — gets build", async () => {
      mockSend.mockResolvedValueOnce({ builds: [{ id: "build-1" }] });
      const res = await get("/builds/build-1");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.build.id).toBe("build-1");
    });

    it("GET /builds/:id — returns null when not found", async () => {
      mockSend.mockResolvedValueOnce({ builds: [] });
      const res = await get("/builds/nonexistent");
      const json = await res.json();
      expect(json.build).toBeNull();
    });

    it("POST /builds/:id/stop — stops build", async () => {
      mockSend.mockResolvedValueOnce({ build: { id: "build-1" } });
      const res = await post("/builds/build-1/stop");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.build.id).toBe("build-1");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("StopBuildCommand");
    });
  });

  describe("Source Credentials", () => {
    it("GET /source-credentials — lists source credentials", async () => {
      mockSend.mockResolvedValueOnce({ sourceCredentialsInfos: [{ arn: "arn:cred" }] });
      const res = await get("/source-credentials");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.sourceCredentials).toHaveLength(1);
    });

    it("GET /source-credentials — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/source-credentials");
      const json = await res.json();
      expect(json.sourceCredentials).toEqual([]);
    });

    it("POST /source-credentials — imports source credentials", async () => {
      mockSend.mockResolvedValueOnce({ arn: "arn:imported" });
      const res = await post("/source-credentials", {
        token: "ghp_token",
        serverType: "GITHUB",
        authType: "PERSONAL_ACCESS_TOKEN",
      });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.sourceCredentialsInfo.arn).toBe("arn:imported");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("ImportSourceCredentialsCommand");
    });

    it("POST /source-credentials — 400 when missing fields", async () => {
      const res = await post("/source-credentials", { token: "t" });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("token, serverType, and authType are required");
    });

    it("DELETE /source-credentials/:arn — deletes source credentials", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/source-credentials/arn%3Acred");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteSourceCredentialsCommand");
    });
  });

  describe("Curated Images", () => {
    it("GET /curated-images — lists curated images", async () => {
      mockSend.mockResolvedValueOnce({
        platforms: [{ platformArn: "arn:platform", description: "test" }],
      });
      const res = await get("/curated-images");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.curatedImages).toHaveLength(1);
    });

    it("GET /curated-images — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/curated-images");
      const json = await res.json();
      expect(json.curatedImages).toEqual([]);
    });
  });
});
