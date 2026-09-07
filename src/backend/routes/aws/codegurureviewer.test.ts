import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSend, mocks } = vi.hoisted(() => {
  const mockSend = vi.fn();
  const createCmd = (name: string) =>
    vi.fn(function (this: any, args?: any) {
      const cmd: any = { ...args, __cmdName: name };
      return cmd;
    });
  return {
    mockSend,
    mocks: {
      CodeGuruReviewerClient: vi.fn(function (this: any) {
        return { send: mockSend };
      }),
      AssociateRepositoryCommand: createCmd("AssociateRepositoryCommand"),
      DescribeRepositoryAssociationCommand: createCmd("DescribeRepositoryAssociationCommand"),
      DisassociateRepositoryCommand: createCmd("DisassociateRepositoryCommand"),
      ListRepositoryAssociationsCommand: createCmd("ListRepositoryAssociationsCommand"),
      ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
      TagResourceCommand: createCmd("TagResourceCommand"),
      UntagResourceCommand: createCmd("UntagResourceCommand"),
    },
  };
});

vi.mock("@aws-sdk/client-codeguru-reviewer", () => mocks);

import router from "./codegurureviewer";

const get = (path: string) => router.request(path);
const post = (path: string, body?: any) =>
  router.request(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
const put = (path: string, body?: any) =>
  router.request(path, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
const del = (path: string) => router.request(path, { method: "DELETE" });

const association = {
  AssociationArn: "arn:aws:codeguru-reviewer:us-east-1:123456789012:association/abc",
  AssociationId: "abc",
  Name: "my-repo",
  Owner: "123456789012",
  ProviderType: "GitHub",
  State: "Associated",
};

beforeEach(() => {
  mockSend.mockReset();
});

describe("CodeGuru Reviewer — associations", () => {
  it("GET /associations — lists association summaries", async () => {
    mockSend.mockResolvedValueOnce({
      RepositoryAssociationSummaries: [
        {
          AssociationArn: association.AssociationArn,
          AssociationId: association.AssociationId,
          Name: association.Name,
          Owner: association.Owner,
          ProviderType: association.ProviderType,
          State: association.State,
          LastUpdatedTimeStamp: 1705000000,
        },
      ],
    });
    const res = await get("/associations");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.associations).toHaveLength(1);
    expect(body.total).toBe(1);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("ListRepositoryAssociationsCommand");
    expect(cmd.MaxResults).toBe(100);
  });

  it("GET /associations — falls back to empty when summaries undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/associations");
    const body = await res.json();
    expect(body.associations).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("POST /associations — associates a repository", async () => {
    mockSend.mockResolvedValueOnce({
      RepositoryAssociation: association,
      Tags: { env: "dev" },
    });
    const res = await post("/associations", {
      Repository: { GitHub: { Name: "my-repo", Owner: "123456789012" } },
      Tags: { env: "dev" },
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.repositoryAssociation.Name).toBe("my-repo");
    expect(body.tags).toEqual({ env: "dev" });
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("AssociateRepositoryCommand");
    expect(cmd.Repository.GitHub.Name).toBe("my-repo");
  });

  it("POST /associations — falls back to empty tags when undefined", async () => {
    mockSend.mockResolvedValueOnce({ RepositoryAssociation: association });
    const res = await post("/associations", {
      Repository: { GitHub: { Name: "my-repo", Owner: "123456789012" } },
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.tags).toEqual({});
  });

  it("POST /associations — 400 when Repository missing", async () => {
    const res = await post("/associations", {});
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("GET /associations/:arn — describes an association", async () => {
    mockSend.mockResolvedValueOnce({
      RepositoryAssociation: association,
      Tags: { env: "dev" },
    });
    const res = await get(`/associations/${encodeURIComponent(association.AssociationArn)}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.repositoryAssociation.AssociationId).toBe("abc");
    expect(body.tags).toEqual({ env: "dev" });
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DescribeRepositoryAssociationCommand");
    expect(cmd.AssociationArn).toBe(association.AssociationArn);
  });

  it("GET /associations/:arn — falls back to empty tags when undefined", async () => {
    mockSend.mockResolvedValueOnce({ RepositoryAssociation: association });
    const res = await get(`/associations/${encodeURIComponent(association.AssociationArn)}`);
    const body = await res.json();
    expect(body.tags).toEqual({});
  });

  it("DELETE /associations/:arn — disassociates a repository", async () => {
    mockSend.mockResolvedValueOnce({
      RepositoryAssociation: { ...association, State: "Disassociated" },
      Tags: {},
    });
    const res = await del(`/associations/${encodeURIComponent(association.AssociationArn)}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.repositoryAssociation.State).toBe("Disassociated");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DisassociateRepositoryCommand");
    expect(cmd.AssociationArn).toBe(association.AssociationArn);
  });

  it("DELETE /associations/:arn — falls back to empty tags when undefined", async () => {
    mockSend.mockResolvedValueOnce({ RepositoryAssociation: association });
    const res = await del(`/associations/${encodeURIComponent(association.AssociationArn)}`);
    const body = await res.json();
    expect(body.tags).toEqual({});
  });
});

describe("CodeGuru Reviewer — tags", () => {
  it("GET /tags — lists tags for a resource ARN", async () => {
    mockSend.mockResolvedValueOnce({ tags: { env: "prod" } });
    const res = await get(`/tags?resourceArn=${encodeURIComponent(association.AssociationArn)}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tags).toEqual({ env: "prod" });
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("ListTagsForResourceCommand");
    expect(cmd.resourceArn).toBe(association.AssociationArn);
  });

  it("GET /tags — falls back to empty object when tags undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/tags?resourceArn=${encodeURIComponent(association.AssociationArn)}`);
    const body = await res.json();
    expect(body.tags).toEqual({});
  });

  it("GET /tags — 400 when resourceArn missing", async () => {
    const res = await get("/tags");
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("POST /tags — sends TagResourceCommand", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/tags", { resourceArn: association.AssociationArn, tags: { a: "b" } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tagged).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("TagResourceCommand");
    expect(cmd.resourceArn).toBe(association.AssociationArn);
    expect(cmd.tags).toEqual({ a: "b" });
  });

  it("POST /tags — 400 when params missing", async () => {
    const res = await post("/tags", { resourceArn: association.AssociationArn });
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("POST /tags/untag — sends UntagResourceCommand", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/tags/untag", {
      resourceArn: association.AssociationArn,
      tagKeys: ["a"],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.untagged).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("UntagResourceCommand");
    expect(cmd.tagKeys).toEqual(["a"]);
  });

  it("POST /tags/untag — 400 when params missing", async () => {
    const res = await post("/tags/untag", { resourceArn: association.AssociationArn });
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });
});
