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

vi.mock("@aws-sdk/client-datasync", () => ({
  DataSyncClient: mockClient,
  ListAgentsCommand: createCmd("ListAgentsCommand"),
  CreateAgentCommand: createCmd("CreateAgentCommand"),
  DescribeAgentCommand: createCmd("DescribeAgentCommand"),
  UpdateAgentCommand: createCmd("UpdateAgentCommand"),
  DeleteAgentCommand: createCmd("DeleteAgentCommand"),
  ListLocationsCommand: createCmd("ListLocationsCommand"),
  CreateLocationAzureBlobCommand: createCmd("CreateLocationAzureBlobCommand"),
  DescribeLocationAzureBlobCommand: createCmd("DescribeLocationAzureBlobCommand"),
  UpdateLocationAzureBlobCommand: createCmd("UpdateLocationAzureBlobCommand"),
  DeleteLocationCommand: createCmd("DeleteLocationCommand"),
  ListTasksCommand: createCmd("ListTasksCommand"),
  CreateTaskCommand: createCmd("CreateTaskCommand"),
  DescribeTaskCommand: createCmd("DescribeTaskCommand"),
  UpdateTaskCommand: createCmd("UpdateTaskCommand"),
  DeleteTaskCommand: createCmd("DeleteTaskCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./datasync";

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

describe("agents", () => {
  it("lists agents", async () => {
    mockSend.mockResolvedValueOnce({ Agents: [{ AgentArn: "arn:a", Status: "ONLINE" }] });
    const res = await get("/agents");
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.agents[0].Status).toBe("ONLINE");
  });

  it("returns sparse agents", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/agents");
    const json = await res.json();
    expect(json.agents).toEqual([]);
  });

  it("creates an agent", async () => {
    mockSend.mockResolvedValueOnce({ AgentArn: "arn:a" });
    const res = await post("/agents", { activationKey: "key-1", agentName: "agent-1" });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.agentArn).toBe("arn:a");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateAgentCommand",
        ActivationKey: "key-1",
        AgentName: "agent-1",
      })
    );
  });

  it("400 agent create without activationKey", async () => {
    expect((await post("/agents", { agentName: "a" })).status).toBe(400);
  });

  it("describes an agent", async () => {
    mockSend.mockResolvedValueOnce({ AgentArn: "arn:a", Status: "ONLINE" });
    const res = await get("/agents/arn%3Aa");
    const json = await res.json();
    expect(json.agent.Status).toBe("ONLINE");
  });

  it("returns null agent when absent", async () => {
    mockSend.mockResolvedValueOnce(null);
    const res = await get("/agents/none");
    const json = await res.json();
    expect(json.agent).toBeNull();
  });

  it("updates an agent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/agents/arn%3Aa", { name: "renamed" });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UpdateAgentCommand",
        AgentArn: "arn:a",
        Name: "renamed",
      })
    );
  });

  it("400 agent update without name", async () => {
    expect((await put("/agents/arn%3Aa", {})).status).toBe(400);
  });

  it("deletes an agent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/agents/arn%3Aa");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteAgentCommand",
        AgentArn: "arn:a",
      })
    );
  });
});

describe("locations", () => {
  it("lists locations", async () => {
    mockSend.mockResolvedValueOnce({
      Locations: [{ LocationArn: "arn:l", LocationUri: "azure-blob://c" }],
    });
    const res = await get("/locations");
    const json = await res.json();
    expect(json.total).toBe(1);
  });

  it("returns sparse locations", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/locations");
    const json = await res.json();
    expect(json.locations).toEqual([]);
  });

  it("creates an azure blob location", async () => {
    mockSend.mockResolvedValueOnce({ LocationArn: "arn:l" });
    const res = await post("/locations", {
      blobType: "BLOCK",
      containerUrl: "https://acct.blob.core.windows.net/container",
      agentArns: ["arn:a"],
      authenticationType: "SAS",
    });
    expect(res.status).toBe(201);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateLocationAzureBlobCommand",
        BlobType: "BLOCK",
        ContainerUrl: "https://acct.blob.core.windows.net/container",
        AgentArns: ["arn:a"],
      })
    );
  });

  it("400 location create without blobType", async () => {
    expect(
      (await post("/locations", { containerUrl: "u", agentArns: ["a"] })).status
    ).toBe(400);
  });

  it("400 location create without containerUrl", async () => {
    expect((await post("/locations", { blobType: "BLOCK", agentArns: ["a"] })).status).toBe(400);
  });

  it("400 location create without agentArns", async () => {
    expect(
      (await post("/locations", { blobType: "BLOCK", containerUrl: "u" })).status
    ).toBe(400);
    expect(
      (await post("/locations", { blobType: "BLOCK", containerUrl: "u", agentArns: [] })).status
    ).toBe(400);
  });

  it("describes a location", async () => {
    mockSend.mockResolvedValueOnce({ LocationArn: "arn:l", BlobType: "BLOCK" });
    const res = await get("/locations/arn%3Al");
    const json = await res.json();
    expect(json.location.BlobType).toBe("BLOCK");
  });

  it("returns null location when absent", async () => {
    mockSend.mockResolvedValueOnce(null);
    const res = await get("/locations/none");
    const json = await res.json();
    expect(json.location).toBeNull();
  });

  it("updates a location subdirectory", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/locations/arn%3Al", { subdirectory: "/sub" });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UpdateLocationAzureBlobCommand",
        LocationArn: "arn:l",
        Subdirectory: "/sub",
      })
    );
  });

  it("deletes a location", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/locations/arn%3Al");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteLocationCommand",
        LocationArn: "arn:l",
      })
    );
  });
});

describe("tasks", () => {
  it("lists tasks", async () => {
    mockSend.mockResolvedValueOnce({ Tasks: [{ TaskArn: "arn:t", Status: "AVAILABLE" }] });
    const res = await get("/tasks");
    const json = await res.json();
    expect(json.total).toBe(1);
  });

  it("returns sparse tasks", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/tasks");
    const json = await res.json();
    expect(json.tasks).toEqual([]);
  });

  it("creates a task", async () => {
    mockSend.mockResolvedValueOnce({ TaskArn: "arn:t" });
    const res = await post("/tasks", {
      sourceLocationArn: "arn:src",
      destinationLocationArn: "arn:dst",
      name: "task-1",
    });
    expect(res.status).toBe(201);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateTaskCommand",
        SourceLocationArn: "arn:src",
        DestinationLocationArn: "arn:dst",
        Name: "task-1",
      })
    );
  });

  it("400 task create without source", async () => {
    expect(
      (await post("/tasks", { destinationLocationArn: "arn:dst" })).status
    ).toBe(400);
  });

  it("400 task create without destination", async () => {
    expect((await post("/tasks", { sourceLocationArn: "arn:src" })).status).toBe(400);
  });

  it("describes a task", async () => {
    mockSend.mockResolvedValueOnce({ TaskArn: "arn:t", Status: "AVAILABLE" });
    const res = await get("/tasks/arn%3At");
    const json = await res.json();
    expect(json.task.Status).toBe("AVAILABLE");
  });

  it("returns null task when absent", async () => {
    mockSend.mockResolvedValueOnce(null);
    const res = await get("/tasks/none");
    const json = await res.json();
    expect(json.task).toBeNull();
  });

  it("updates a task", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/tasks/arn%3At", { name: "renamed" });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UpdateTaskCommand",
        TaskArn: "arn:t",
        Name: "renamed",
      })
    );
  });

  it("400 task update without name", async () => {
    expect((await put("/tasks/arn%3At", {})).status).toBe(400);
  });

  it("deletes a task", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/tasks/arn%3At");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteTaskCommand",
        TaskArn: "arn:t",
      })
    );
  });
});

describe("tags", () => {
  it("lists tags", async () => {
    mockSend.mockResolvedValueOnce({ Tags: [{ Key: "env", Value: "dev" }] });
    const res = await get("/resources/tags?arn=arn%3Ax");
    const json = await res.json();
    expect(json.tags).toEqual([{ Key: "env", Value: "dev" }]);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "ListTagsForResourceCommand",
        ResourceArn: "arn:x",
      })
    );
  });

  it("returns sparse tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/resources/tags?arn=arn%3Ax");
    const json = await res.json();
    expect(json.tags).toEqual([]);
  });

  it("400 tag list without arn", async () => {
    expect((await get("/resources/tags")).status).toBe(400);
  });

  it("adds tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/resources/tags", {
      resourceArn: "arn:x",
      tags: [{ Key: "env", Value: "dev" }],
    });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "TagResourceCommand",
        ResourceArn: "arn:x",
      })
    );
  });

  it("removes tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/resources/tags/untag", { resourceArn: "arn:x", tagKeys: ["env"] });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UntagResourceCommand",
        ResourceArn: "arn:x",
        TagKeys: ["env"],
      })
    );
  });

  it("400 untag without arn or empty keys", async () => {
    expect((await post("/resources/tags/untag", { tagKeys: ["env"] })).status).toBe(400);
    expect((await post("/resources/tags/untag", { resourceArn: "arn:x" })).status).toBe(400);
    expect((await post("/resources/tags/untag", { resourceArn: "arn:x", tagKeys: [] })).status).toBe(400);
  });

  it("400 add tags without arn or empty tags", async () => {
    expect((await post("/resources/tags", { tags: [{ Key: "k", Value: "v" }] })).status).toBe(400);
    expect((await post("/resources/tags", { resourceArn: "arn:x" })).status).toBe(400);
    expect((await post("/resources/tags", { resourceArn: "arn:x", tags: [] })).status).toBe(400);
  });
});
