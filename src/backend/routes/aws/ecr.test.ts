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
});
