import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-ecr", () => ({
  ECRClient: vi.fn(function () {
    return { send: mockSend };
  }),
  DescribeRepositoriesCommand: createCmd("DescribeRepositoriesCommand"),
  CreateRepositoryCommand: createCmd("CreateRepositoryCommand"),
  DeleteRepositoryCommand: createCmd("DeleteRepositoryCommand"),
  ListImagesCommand: createCmd("ListImagesCommand"),
  DescribeImagesCommand: createCmd("DescribeImagesCommand"),
  BatchDeleteImageCommand: createCmd("BatchDeleteImageCommand"),
  GetRepositoryPolicyCommand: createCmd("GetRepositoryPolicyCommand"),
  SetRepositoryPolicyCommand: createCmd("SetRepositoryPolicyCommand"),
  DeleteRepositoryPolicyCommand: createCmd("DeleteRepositoryPolicyCommand"),
  GetLifecyclePolicyCommand: createCmd("GetLifecyclePolicyCommand"),
  PutLifecyclePolicyCommand: createCmd("PutLifecyclePolicyCommand"),
  DeleteLifecyclePolicyCommand: createCmd("DeleteLifecyclePolicyCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  BatchGetRepositoryScanningConfigurationCommand: createCmd("BatchGetRepositoryScanningConfigurationCommand"),
  BatchGetImageCommand: createCmd("BatchGetImageCommand"),
  GetAuthorizationTokenCommand: createCmd("GetAuthorizationTokenCommand"),
  PutImageTagMutabilityCommand: createCmd("PutImageTagMutabilityCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: (Ctor: any, extra?: any) => new Ctor(extra),
}));

import router from "./ecr";

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
  mockSend.mockReset();
});

describe("ECR Routes", () => {
  describe("Repositories", () => {
    it("GET /repositories — lists repos", async () => {
      mockSend.mockResolvedValueOnce({
        repositories: [
          {
            repositoryName: "my-repo",
            repositoryUri: "123456789.dkr.ecr.us-east-1.amazonaws.com/my-repo",
            createdAt: new Date("2025-01-01"),
            imageTagMutability: "MUTABLE",
            encryptionConfiguration: { encryptionType: "AES256" },
          },
        ],
      });
      const res = await get("/repositories");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.repositories[0].repositoryName).toBe("my-repo");
      expect(body.repositories[0].repositoryUri).toBe(
        "123456789.dkr.ecr.us-east-1.amazonaws.com/my-repo"
      );
    });

    it("GET /repositories — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ repositories: [] });
      const res = await get("/repositories");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.repositories).toEqual([]);
    });

    it("GET /repositories — sparse response defaults to empty array", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/repositories");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.repositories).toEqual([]);
    });

    it("POST /repositories — creates a repo (201)", async () => {
      mockSend.mockResolvedValueOnce({
        repository: {
          repositoryName: "new-repo",
          repositoryUri: "123456789.dkr.ecr.us-east-1.amazonaws.com/new-repo",
        },
      });
      const res = await post("/repositories", { repositoryName: "new-repo" });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.repository.repositoryName).toBe("new-repo");
    });

    it("POST /repositories — 400 when name missing", async () => {
      const res = await post("/repositories", {});
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("repositoryName is required");
    });

    it("DELETE /repositories/:name — deletes repo", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/repositories/my-repo");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.repositoryName).toBe("my-repo");
      expect(body.deleted).toBe(true);
    });

    it("GET /repositories — filters by repositoryNames query param", async () => {
      mockSend.mockResolvedValueOnce({
        repositories: [
          {
            repositoryName: "my-repo",
            repositoryUri: "123456789.dkr.ecr.us-east-1.amazonaws.com/my-repo",
            createdAt: new Date("2025-01-01"),
            imageTagMutability: "MUTABLE",
            encryptionConfiguration: { encryptionType: "AES256" },
          },
        ],
      });
      const res = await get("/repositories?repositoryNames=my-repo,other-repo");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].repositoryNames).toEqual(["my-repo", "other-repo"]);
    });

    it("GET /repositories — handles null createdAt", async () => {
      mockSend.mockResolvedValueOnce({
        repositories: [
          {
            repositoryName: "no-date-repo",
            repositoryUri: "123456789.dkr.ecr.us-east-1.amazonaws.com/no-date-repo",
            createdAt: null,
            imageTagMutability: "MUTABLE",
          },
        ],
      });
      const res = await get("/repositories");
      const body = await res.json();
      expect(body.repositories[0].createdAt).toBeNull();
    });

    it("POST /repositories — creates a repo with tags (201)", async () => {
      mockSend.mockResolvedValueOnce({
        repository: { repositoryName: "tagged-repo" },
      });
      const res = await post("/repositories", {
        repositoryName: "tagged-repo",
        tags: { env: "prod", team: "platform" },
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.repository.repositoryName).toBe("tagged-repo");
      expect(mockSend.mock.calls[0][0].tags).toHaveLength(2);
      expect(mockSend.mock.calls[0][0].tags[0].Key).toBe("env");
      expect(mockSend.mock.calls[0][0].tags[0].Value).toBe("prod");
    });
  });

  describe("Images", () => {
    it("GET /repositories/:name/images — lists images", async () => {
      mockSend
        .mockResolvedValueOnce({
          imageIds: [{ imageDigest: "sha256:abc123" }],
        })
        .mockResolvedValueOnce({
          imageDetails: [
            {
              imageDigest: "sha256:abc123",
              imageTags: ["latest"],
              imageSizeInBytes: 1024,
              imagePushedAt: new Date("2025-01-01"),
              imageScanStatus: "COMPLETE",
              imageScanFindingsSummary: { findingSeverityCounts: {} },
            },
          ],
        });
      const res = await get("/repositories/my-repo/images");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.images[0].imageDigest).toBe("sha256:abc123");
      expect(body.images[0].imageTags).toEqual(["latest"]);
    });

    it("GET /repositories/:name/images — returns empty", async () => {
      mockSend.mockResolvedValueOnce({ imageIds: [] });
      const res = await get("/repositories/my-repo/images");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.images).toEqual([]);
    });

    it("GET /repositories/:name/images — handles null imageDetails, tags, and pushedAt", async () => {
      mockSend
        .mockResolvedValueOnce({ imageIds: [{ imageDigest: "sha256:nulled" }] })
        .mockResolvedValueOnce({
          imageDetails: [
            {
              imageDigest: "sha256:nulled",
              imageTags: undefined,
              imageSizeInBytes: 2048,
              imagePushedAt: null,
              imageScanStatus: null,
              imageScanFindingsSummary: null,
            },
          ],
        });
      const res = await get("/repositories/my-repo/images");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.images[0].imageTags).toEqual([]);
      expect(body.images[0].imagePushedAt).toBeNull();
    });

    it("GET /repositories/:name/images — handles imageDetails undefined", async () => {
      mockSend
        .mockResolvedValueOnce({ imageIds: [{ imageDigest: "sha256:no-details" }] })
        .mockResolvedValueOnce({ imageDetails: undefined });
      const res = await get("/repositories/my-repo/images");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.images).toEqual([]);
    });

    it("DELETE /repositories/:name/images — batch deletes", async () => {
      mockSend.mockResolvedValueOnce({
        imageIds: [{ imageDigest: "sha256:abc123" }],
        failures: [],
      });
      const res = await router.request("/repositories/my-repo/images", {
        method: "DELETE",
        body: JSON.stringify({ imageIds: [{ imageDigest: "sha256:abc123" }] }),
        headers: { "content-type": "application/json" },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.imageIds).toHaveLength(1);
      expect(body.failures).toEqual([]);
    });

    it("DELETE /repositories/:name/images — 400 when imageIds missing", async () => {
      const res = await router.request("/repositories/my-repo/images", {
        method: "DELETE",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("imageIds");
    });

    it("DELETE /repositories/:name/images — sparse response defaults to empty arrays", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await router.request("/repositories/my-repo/images", {
        method: "DELETE",
        body: JSON.stringify({ imageIds: [{ imageDigest: "sha256:abc123" }] }),
        headers: { "content-type": "application/json" },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.imageIds).toEqual([]);
      expect(body.failures).toEqual([]);
    });
  });

  describe("Repository Policy", () => {
    it("GET /repositories/:name/policy — gets policy", async () => {
      mockSend.mockResolvedValueOnce({
        policyText: '{"Statement":[{"Effect":"Allow"}]}',
      });
      const res = await get("/repositories/my-repo/policy");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.repositoryName).toBe("my-repo");
      expect(body.policyText).toBe('{"Statement":[{"Effect":"Allow"}]}');
    });

    it("GET /repositories/:name/policy — sparse response defaults policyText to null", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/repositories/my-repo/policy");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.repositoryName).toBe("my-repo");
      expect(body.policyText).toBeNull();
    });

    it("GET /repositories/:name/policy — catches RepositoryPolicyNotFoundException", async () => {
      const err = new Error("not found");
      err.name = "RepositoryPolicyNotFoundException";
      mockSend.mockRejectedValueOnce(err);
      const res = await get("/repositories/my-repo/policy");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.policyText).toBeNull();
    });

    it("PUT /repositories/:name/policy — sets policy", async () => {
      mockSend.mockResolvedValueOnce({
        policyText: '{"Statement":[{"Effect":"Allow"}]}',
      });
      const res = await put("/repositories/my-repo/policy", {
        policyText: '{"Statement":[{"Effect":"Allow"}]}',
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.repositoryName).toBe("my-repo");
      expect(body.policyText).toBe('{"Statement":[{"Effect":"Allow"}]}');
    });

    it("PUT /repositories/:name/policy — 400 when policyText missing", async () => {
      const res = await put("/repositories/my-repo/policy", {});
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("policyText");
    });

    it("GET /repositories/:name/policy — throws non-RepositoryPolicyNotFoundException", async () => {
      const err = new Error("Access denied");
      err.name = "AccessDeniedException";
      mockSend.mockRejectedValueOnce(err);
      const res = await get("/repositories/my-repo/policy");
      expect(res.status).toBe(500);
    });

    it("DELETE /repositories/:name/policy — deletes policy", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/repositories/my-repo/policy");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.repositoryName).toBe("my-repo");
      expect(body.deleted).toBe(true);
    });
  });

  describe("Lifecycle Policy", () => {
    it("GET /repositories/:name/lifecycle — gets lifecycle policy", async () => {
      mockSend.mockResolvedValueOnce({
        lifecyclePolicyText: '{"rules":[{"rulePriority":1}]}',
      });
      const res = await get("/repositories/my-repo/lifecycle");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.repositoryName).toBe("my-repo");
      expect(body.lifecyclePolicyText).toBe('{"rules":[{"rulePriority":1}]}');
    });

    it("GET /repositories/:name/lifecycle — sparse response defaults lifecyclePolicyText to null", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/repositories/my-repo/lifecycle");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.repositoryName).toBe("my-repo");
      expect(body.lifecyclePolicyText).toBeNull();
    });

    it("GET /repositories/:name/lifecycle — catches LifecyclePolicyNotFoundException", async () => {
      const err = new Error("not found");
      err.name = "LifecyclePolicyNotFoundException";
      mockSend.mockRejectedValueOnce(err);
      const res = await get("/repositories/my-repo/lifecycle");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.lifecyclePolicyText).toBeNull();
    });

    it("PUT /repositories/:name/lifecycle — sets lifecycle policy", async () => {
      mockSend.mockResolvedValueOnce({
        lifecyclePolicyText: '{"rules":[{"rulePriority":1}]}',
      });
      const res = await put("/repositories/my-repo/lifecycle", {
        lifecyclePolicyText: '{"rules":[{"rulePriority":1}]}',
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.lifecyclePolicyText).toBe('{"rules":[{"rulePriority":1}]}');
    });

    it("PUT /repositories/:name/lifecycle — 400 when lifecyclePolicyText missing", async () => {
      const res = await put("/repositories/my-repo/lifecycle", {});
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("lifecyclePolicyText");
    });

    it("GET /repositories/:name/lifecycle — throws non-LifecyclePolicyNotFoundException", async () => {
      const err = new Error("Service error");
      err.name = "ServiceError";
      mockSend.mockRejectedValueOnce(err);
      const res = await get("/repositories/my-repo/lifecycle");
      expect(res.status).toBe(500);
    });
  });

  describe("Tags", () => {
    it("GET /repositories/:name/tags — lists tags", async () => {
      mockSend.mockResolvedValueOnce({
        tags: [{ Key: "env", Value: "prod" }],
      });
      const res = await get("/repositories/my-repo/tags");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags).toHaveLength(1);
      expect(body.tags[0].Key).toBe("env");
    });

    it("POST /repositories/:name/tags — adds tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/repositories/my-repo/tags", {
        tags: { env: "prod", team: "platform" },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend.mock.calls[0][0].tags).toHaveLength(2);
    });

    it("DELETE /repositories/:name/tags — removes tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await router.request("/repositories/my-repo/tags", {
        method: "DELETE",
        body: JSON.stringify({ tagKeys: ["env"] }),
        headers: { "content-type": "application/json" },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend.mock.calls[0][0].tagKeys).toEqual(["env"]);
    });
  });

  describe("Scanning Configuration", () => {
    it("GET /repositories/:name/scanning-configuration — returns config", async () => {
      mockSend.mockResolvedValueOnce({
        scanningConfigurations: [
          {
            repositoryArn: "arn:aws:ecr:us-east-1:123456789:repository/my-repo",
            repositoryName: "my-repo",
            scanOnPush: true,
            scanFrequency: "SCAN_ON_PUSH",
            appliedScanFilters: [{ filter: "*", filterType: "WILDCARD" }],
          },
        ],
        failures: [],
      });
      const res = await get("/repositories/my-repo/scanning-configuration");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.repositoryName).toBe("my-repo");
      expect(body.scanningConfiguration.scanOnPush).toBe(true);
      expect(body.scanningConfiguration.scanFrequency).toBe("SCAN_ON_PUSH");
      expect(body.scanningConfiguration.appliedScanFilters).toHaveLength(1);
      expect(body.failure).toBeNull();
      expect(mockSend.mock.calls[0][0].repositoryNames).toEqual(["my-repo"]);
    });

    it("GET /repositories/:name/scanning-configuration — returns null when absent", async () => {
      mockSend.mockResolvedValueOnce({ scanningConfigurations: [], failures: [] });
      const res = await get("/repositories/missing/scanning-configuration");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.scanningConfiguration).toBeNull();
      expect(body.failure).toBeNull();
    });

    it("GET /repositories/:name/scanning-configuration — sparse response defaults to nulls", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/repositories/my-repo/scanning-configuration");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.repositoryName).toBe("my-repo");
      expect(body.scanningConfiguration).toBeNull();
      expect(body.failure).toBeNull();
    });

    it("GET /repositories/:name/scanning-configuration — surfaces failures", async () => {
      mockSend.mockResolvedValueOnce({
        scanningConfigurations: [],
        failures: [
          { repositoryName: "bad-repo", failureCode: "REPOSITORY_NOT_FOUND", failureReason: "Repository not found" },
        ],
      });
      const res = await get("/repositories/bad-repo/scanning-configuration");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.scanningConfiguration).toBeNull();
      expect(body.failure.failureCode).toBe("REPOSITORY_NOT_FOUND");
    });

    it("GET /repositories//scanning-configuration — 404 when name missing", async () => {
      const res = await get("/repositories//scanning-configuration");
      expect(res.status).toBe(404);
    });

    it("GET /repositories/:name/scanning-configuration — handles null scanOnPush and frequency", async () => {
      mockSend.mockResolvedValueOnce({
        scanningConfigurations: [
          {
            repositoryArn: "arn:aws:ecr:us-east-1:123:repo/no-scan",
            repositoryName: "no-scan",
            scanOnPush: null,
            scanFrequency: null,
            appliedScanFilters: undefined,
          },
        ],
        failures: [],
      });
      const res = await get("/repositories/no-scan/scanning-configuration");
      const body = await res.json();
      expect(body.scanningConfiguration.scanOnPush).toBe(false);
      expect(body.scanningConfiguration.scanFrequency).toBeNull();
      expect(body.scanningConfiguration.appliedScanFilters).toEqual([]);
    });
  });

  describe("Tags — edge cases", () => {
    it("GET /repositories/:name/tags — returns empty when no tags", async () => {
      mockSend.mockResolvedValueOnce({ tags: undefined });
      const res = await get("/repositories/my-repo/tags");
      const body = await res.json();
      expect(body.tags).toEqual([]);
    });

    it("POST /repositories/:name/tags — handles empty tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/repositories/my-repo/tags", { tags: {} });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].tags).toEqual([]);
    });

    it("POST /repositories/:name/tags — handles missing tags field", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/repositories/my-repo/tags", {});
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].tags).toEqual([]);
    });

    it("DELETE /repositories/:name/tags — handles empty tagKeys", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await router.request("/repositories/my-repo/tags", {
        method: "DELETE",
        body: JSON.stringify({ tagKeys: [] }),
        headers: { "content-type": "application/json" },
      });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].tagKeys).toEqual([]);
    });

    it("DELETE /repositories/:name/tags — handles missing tagKeys field", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await router.request("/repositories/my-repo/tags", {
        method: "DELETE",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].tagKeys).toEqual([]);
    });
  });

  describe("Image manifests (BatchGetImage)", () => {
    it("GET /repositories/:name/images/manifest?tag= — returns manifest", async () => {
      mockSend.mockResolvedValueOnce({
        images: [
          {
            registryId: "123456789012",
            repositoryName: "my-repo",
            imageId: { imageDigest: "sha256:abc" },
            imageManifest: "{...}",
            imageManifestMediaType: "application/vnd.docker.distribution.manifest.v2+json",
          },
        ],
      });
      const res = await get("/repositories/my-repo/images/manifest?tag=v1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.image.imageManifest).toBe("{...}");
      expect(body.image.imageId.imageDigest).toBe("sha256:abc");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("BatchGetImageCommand");
      expect(cmd.repositoryName).toBe("my-repo");
      expect(cmd.imageIds).toEqual([{ imageTag: "v1", imageDigest: undefined }]);
    });

    it("GET .../manifest?digest= — returns manifest by digest", async () => {
      mockSend.mockResolvedValueOnce({
        images: [{ imageId: { imageDigest: "sha256:def" }, imageManifest: "{}" }],
      });
      const res = await get("/repositories/my-repo/images/manifest?digest=sha256:def");
      const body = await res.json();
      expect(body.image.imageDigest).toBeUndefined();
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.imageIds).toEqual([{ imageTag: undefined, imageDigest: "sha256:def" }]);
    });

    it("GET .../manifest — 400 without tag or digest", async () => {
      const res = await get("/repositories/my-repo/images/manifest");
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("tag or digest");
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("GET .../manifest — returns null image when not found", async () => {
      mockSend.mockResolvedValueOnce({ images: [] });
      const res = await get("/repositories/my-repo/images/manifest?tag=missing");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.image).toBeNull();
    });

    it("GET .../manifest — sparse response defaults to null image", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/repositories/my-repo/images/manifest?tag=v1");
      const body = await res.json();
      expect(body.image).toBeNull();
    });
  });

  describe("Auth token (GetAuthorizationToken)", () => {
    it("GET /auth-token — returns token data", async () => {
      mockSend.mockResolvedValueOnce({
        authorizationData: [
          {
            authorizationToken: "token123",
            expiresAt: new Date("2026-01-01T00:00:00Z"),
            proxyEndpoint: "https://123456789012.dkr.ecr.us-east-1.amazonaws.com",
          },
        ],
      });
      const res = await get("/auth-token");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.authorizationToken).toBe("token123");
      expect(body.expiresAt).toBe("2026-01-01T00:00:00.000Z");
      expect(body.proxyEndpoint).toContain("dkr.ecr");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("GetAuthorizationTokenCommand");
    });

    it("GET /auth-token — sparse response defaults to nulls", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/auth-token");
      const body = await res.json();
      expect(body.authorizationToken).toBeNull();
      expect(body.expiresAt).toBeNull();
      expect(body.proxyEndpoint).toBeNull();
    });
  });

  describe("Tag mutability", () => {
    it("PUT /repositories/:name/tag-mutability — sends the command", async () => {
      mockSend.mockResolvedValueOnce({
        registryId: "000",
        repositoryName: "repo-1",
        imageTagMutability: "IMMUTABLE",
      });
      const res = await put("/repositories/repo-1/tag-mutability", { tagMutability: "IMMUTABLE" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.imageTagMutability).toBe("IMMUTABLE");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("PutImageTagMutabilityCommand");
      expect(cmd.repositoryName).toBe("repo-1");
      expect(cmd.imageTagMutability).toBe("IMMUTABLE");
    });

    it("PUT /repositories/:name/tag-mutability — 400 without tagMutability", async () => {
      const res = await put("/repositories/repo-1/tag-mutability", {});
      expect(res.status).toBe(400);
    });
  });
});
