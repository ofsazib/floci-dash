import { describe, it, expect, beforeEach, vi } from "vitest";

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

vi.mock("@aws-sdk/client-database-migration-service", () => ({
  DatabaseMigrationServiceClient: mockClient,
  CreateReplicationSubnetGroupCommand: createCmd("CreateReplicationSubnetGroupCommand"),
  DescribeReplicationSubnetGroupsCommand: createCmd("DescribeReplicationSubnetGroupsCommand"),
  DeleteReplicationSubnetGroupCommand: createCmd("DeleteReplicationSubnetGroupCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  AddTagsToResourceCommand: createCmd("AddTagsToResourceCommand"),
  RemoveTagsFromResourceCommand: createCmd("RemoveTagsFromResourceCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./dms";

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

describe("subnet groups", () => {
  it("lists subnet groups", async () => {
    mockSend.mockResolvedValueOnce({
      ReplicationSubnetGroups: [
        {
          ReplicationSubnetGroupIdentifier: "dms-subnet-group-1",
          ReplicationSubnetGroupDescription: "d",
          VpcId: "vpc-1",
          SubnetGroupStatus: "Complete",
        },
      ],
    });
    const res = await get("/subnet-groups");
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.subnetGroups[0].VpcId).toBe("vpc-1");
  });

  it("returns sparse subnet groups", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/subnet-groups");
    const json = await res.json();
    expect(json.subnetGroups).toEqual([]);
  });

  it("creates a subnet group", async () => {
    mockSend.mockResolvedValueOnce({ ReplicationSubnetGroup: { ReplicationSubnetGroupIdentifier: "g1" } });
    const res = await post("/subnet-groups", {
      replicationSubnetGroupIdentifier: "g1",
      replicationSubnetGroupDescription: "desc",
      subnetIds: ["subnet-1", "subnet-2"],
    });
    expect(res.status).toBe(201);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateReplicationSubnetGroupCommand",
        ReplicationSubnetGroupIdentifier: "g1",
        SubnetIds: ["subnet-1", "subnet-2"],
      })
    );
  });

  it("400 create without identifier", async () => {
    expect(
      (await post("/subnet-groups", {
        replicationSubnetGroupDescription: "d",
        subnetIds: ["s"],
      })).status
    ).toBe(400);
  });

  it("400 create without description", async () => {
    expect(
      (await post("/subnet-groups", { replicationSubnetGroupIdentifier: "g", subnetIds: ["s"] })).status
    ).toBe(400);
  });

  it("400 create without subnetIds", async () => {
    expect(
      (await post("/subnet-groups", {
        replicationSubnetGroupIdentifier: "g",
        replicationSubnetGroupDescription: "d",
      })).status
    ).toBe(400);
    expect(
      (await post("/subnet-groups", {
        replicationSubnetGroupIdentifier: "g",
        replicationSubnetGroupDescription: "d",
        subnetIds: [],
      })).status
    ).toBe(400);
  });

  it("deletes a subnet group", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/subnet-groups/g1");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteReplicationSubnetGroupCommand",
        ReplicationSubnetGroupIdentifier: "g1",
      })
    );
  });
});

describe("tags", () => {
  it("lists tags", async () => {
    mockSend.mockResolvedValueOnce({ TagList: [{ Key: "env", Value: "dev" }] });
    const res = await get("/resources/tags?arn=arn%3Adms");
    const json = await res.json();
    expect(json.tagList).toEqual([{ Key: "env", Value: "dev" }]);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "ListTagsForResourceCommand",
        ResourceArn: "arn:dms",
      })
    );
  });

  it("returns sparse tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/resources/tags?arn=arn%3Adms");
    const json = await res.json();
    expect(json.tagList).toEqual([]);
  });

  it("400 tag list without arn", async () => {
    expect((await get("/resources/tags")).status).toBe(400);
  });

  it("adds tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/resources/tags", {
      resourceArn: "arn:dms",
      tags: [{ Key: "env", Value: "dev" }],
    });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "AddTagsToResourceCommand",
        ResourceArn: "arn:dms",
        Tags: [{ Key: "env", Value: "dev" }],
      })
    );
  });

  it("400 add tags without arn or empty tags", async () => {
    expect((await post("/resources/tags", { tags: [{ Key: "k", Value: "v" }] })).status).toBe(400);
    expect((await post("/resources/tags", { resourceArn: "arn:dms" })).status).toBe(400);
    expect((await post("/resources/tags", { resourceArn: "arn:dms", tags: [] })).status).toBe(400);
  });

  it("removes tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/resources/tags/untag", { resourceArn: "arn:dms", tagKeys: ["env"] });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "RemoveTagsFromResourceCommand",
        ResourceArn: "arn:dms",
        TagKeys: ["env"],
      })
    );
  });

  it("400 untag without arn or empty keys", async () => {
    expect((await post("/resources/tags/untag", { tagKeys: ["env"] })).status).toBe(400);
    expect((await post("/resources/tags/untag", { resourceArn: "arn:dms" })).status).toBe(400);
    expect((await post("/resources/tags/untag", { resourceArn: "arn:dms", tagKeys: [] })).status).toBe(400);
  });
});
