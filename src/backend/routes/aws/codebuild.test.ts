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
  RetryBuildCommand: createCmd("RetryBuildCommand"),
  UpdateProjectCommand: createCmd("UpdateProjectCommand"),
  ListReportGroupsCommand: createCmd("ListReportGroupsCommand"),
  CreateReportGroupCommand: createCmd("CreateReportGroupCommand"),
  BatchGetReportGroupsCommand: createCmd("BatchGetReportGroupsCommand"),
  UpdateReportGroupCommand: createCmd("UpdateReportGroupCommand"),
  DeleteReportGroupCommand: createCmd("DeleteReportGroupCommand"),
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

async function put(path: string, body?: any) {
  return router.request(path, {
    method: "PUT",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
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
      mockSend.mockResolvedValueOnce({});
      const res = await get("/projects");
      const json = await res.json();
      expect(json.total).toBe(0);
      expect(json.projects).toEqual([]);
    });

    it("GET /projects — sparse batch-get response", async () => {
      mockSend.mockResolvedValueOnce({ projects: ["proj1"] }).mockResolvedValueOnce({});
      const res = await get("/projects");
      const json = await res.json();
      expect(json.total).toBe(0);
      expect(json.projects).toEqual([]);
      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend.mock.calls[1][0].__cmdName).toBe("BatchGetProjectsCommand");
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
      mockSend.mockResolvedValueOnce({});
      const res = await get("/projects/proj1/builds");
      const json = await res.json();
      expect(json.total).toBe(0);
      expect(json.builds).toEqual([]);
    });

    it("GET /projects/:name/builds — sparse batch-get response", async () => {
      mockSend.mockResolvedValueOnce({ ids: ["build-1"] }).mockResolvedValueOnce({});
      const res = await get("/projects/proj1/builds");
      const json = await res.json();
      expect(json.total).toBe(0);
      expect(json.builds).toEqual([]);
      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend.mock.calls[1][0].__cmdName).toBe("BatchGetBuildsCommand");
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
      mockSend.mockResolvedValueOnce({});
      const res = await get("/builds");
      const json = await res.json();
      expect(json.total).toBe(0);
    });

    it("GET /builds — sparse batch-get response", async () => {
      mockSend.mockResolvedValueOnce({ ids: ["build-1"] }).mockResolvedValueOnce({});
      const res = await get("/builds");
      const json = await res.json();
      expect(json.total).toBe(0);
      expect(json.builds).toEqual([]);
      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend.mock.calls[1][0].__cmdName).toBe("BatchGetBuildsCommand");
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

  describe("Retry Build", () => {
    it("POST /builds/:id/retry — returns the retried build", async () => {
      mockSend.mockResolvedValueOnce({ build: { id: "b2" } });
      const res = await post("/builds/b1/retry");
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.build).toEqual({ id: "b2" });
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("RetryBuildCommand");
      expect(cmd.id).toBe("b1");
    });

    it("POST /builds/:id/retry — null build when not found", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/builds/b1/retry");
      const json = await res.json();
      expect(json.build).toBeUndefined();
    });
  });

  describe("Update Project", () => {
    it("PUT /projects/:name — sends UpdateProjectCommand with body fields", async () => {
      mockSend.mockResolvedValueOnce({ project: { name: "p1" } });
      const res = await put("/projects/p1", {
        description: "updated",
        timeoutInMinutes: 30,
        queuedTimeoutInMinutes: 10,
        encryptionKey: "arn:kms",
        tags: [{ key: "k", value: "v" }],
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.project).toEqual({ name: "p1" });
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("UpdateProjectCommand");
      expect(cmd.name).toBe("p1");
      expect(cmd.description).toBe("updated");
      expect(cmd.timeoutInMinutes).toBe(30);
      expect(cmd.queuedTimeoutInMinutes).toBe(10);
      expect(cmd.encryptionKey).toBe("arn:kms");
      expect(cmd.tags).toEqual([{ key: "k", value: "v" }]);
    });
  });

  describe("Report Groups", () => {
    it("GET /report-groups — maps fields with sparse fallbacks", async () => {
      mockSend.mockResolvedValueOnce({
        reportGroups: [{ arn: "arn:rg1", name: "rg1", type: "TEST", created: 1700000000 }],
      });
      const res = await get("/report-groups");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.total).toBe(1);
      expect(json.reportGroups[0]).toEqual({
        arn: "arn:rg1",
        name: "rg1",
        type: "TEST",
        exportConfig: undefined,
        created: 1700000000,
        lastModified: undefined,
        tags: [],
        status: undefined,
      });
    });

    it("GET /report-groups — empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/report-groups");
      const json = await res.json();
      expect(json.reportGroups).toEqual([]);
      expect(json.total).toBe(0);
    });

    it("POST /report-groups — sends CreateReportGroupCommand", async () => {
      mockSend.mockResolvedValueOnce({
        reportGroup: { arn: "arn:rg1", name: "rg1", type: "TEST", tags: [{ key: "k", value: "v" }] },
      });
      const res = await post("/report-groups", {
        name: "rg1",
        type: "TEST",
        exportConfig: { exportConfigType: "S3", s3Destination: { bucket: "b", path: "p" } },
      });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.reportGroup.tags).toEqual([{ key: "k", value: "v" }]);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("CreateReportGroupCommand");
      expect(cmd.name).toBe("rg1");
      expect(cmd.type).toBe("TEST");
      expect(cmd.exportConfig.exportConfigType).toBe("S3");
    });

    it("POST /report-groups — 400 when name missing", async () => {
      const res = await post("/report-groups", { type: "TEST" });
      expect(res.status).toBe(400);
    });

    it("POST /report-groups — 400 when type missing", async () => {
      const res = await post("/report-groups", { name: "rg1" });
      expect(res.status).toBe(400);
    });

    it("POST /report-groups — null reportGroup when response is sparse", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/report-groups", { name: "rg1", type: "TEST" });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.reportGroup).toBeNull();
    });

    it("GET /report-groups/:arn — batch-gets a single group", async () => {
      mockSend.mockResolvedValueOnce({ reportGroups: [{ arn: "arn:rg1", name: "rg1" }] });
      const res = await get("/report-groups/" + encodeURIComponent("arn:rg1"));
      const json = await res.json();
      expect(json.reportGroup.arn).toBe("arn:rg1");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("BatchGetReportGroupsCommand");
      expect(cmd.reportGroupArns).toEqual(["arn:rg1"]);
    });

    it("GET /report-groups/:arn — null when not found", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/report-groups/" + encodeURIComponent("arn:missing"));
      const json = await res.json();
      expect(json.reportGroup).toBeNull();
    });

    it("PUT /report-groups/:arn — sends UpdateReportGroupCommand", async () => {
      mockSend.mockResolvedValueOnce({ reportGroup: { arn: "arn:rg1", name: "rg1" } });
      const res = await put("/report-groups/" + encodeURIComponent("arn:rg1"), {
        exportConfig: { exportConfigType: "NO_EXPORT" },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.reportGroup.arn).toBe("arn:rg1");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("UpdateReportGroupCommand");
      expect(cmd.arn).toBe("arn:rg1");
      expect(cmd.exportConfig.exportConfigType).toBe("NO_EXPORT");
    });

    it("PUT /report-groups/:arn — null reportGroup when response is sparse", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/report-groups/" + encodeURIComponent("arn:rg1"), {});
      const json = await res.json();
      expect(json.reportGroup).toBeNull();
    });

    it("DELETE /report-groups/:arn — sends DeleteReportGroupCommand", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/report-groups/" + encodeURIComponent("arn:rg1"));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.deleted).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("DeleteReportGroupCommand");
      expect(cmd.arn).toBe("arn:rg1");
    });
  });
});
