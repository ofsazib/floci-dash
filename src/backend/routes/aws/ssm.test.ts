import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockSSM = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-ssm", () => ({
  SSMClient: mockSSM,
  DescribeParametersCommand: createCmd("DescribeParametersCommand"),
  GetParameterCommand: createCmd("GetParameterCommand"),
  GetParameterHistoryCommand: createCmd("GetParameterHistoryCommand"),
  PutParameterCommand: createCmd("PutParameterCommand"),
  DeleteParameterCommand: createCmd("DeleteParameterCommand"),
  GetParametersCommand: createCmd("GetParametersCommand"),
  GetParametersByPathCommand: createCmd("GetParametersByPathCommand"),
  DeleteParametersCommand: createCmd("DeleteParametersCommand"),
  LabelParameterVersionCommand: createCmd("LabelParameterVersionCommand"),
  DescribeInstanceInformationCommand: createCmd("DescribeInstanceInformationCommand"),
  AddTagsToResourceCommand: createCmd("AddTagsToResourceCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  RemoveTagsFromResourceCommand: createCmd("RemoveTagsFromResourceCommand"),
  SendCommandCommand: createCmd("SendCommandCommand"),
  ListCommandsCommand: createCmd("ListCommandsCommand"),
  ListCommandInvocationsCommand: createCmd("ListCommandInvocationsCommand"),
  GetCommandInvocationCommand: createCmd("GetCommandInvocationCommand"),
  CancelCommandCommand: createCmd("CancelCommandCommand"),
}));

vi.mock("../../clients/aws", () => ({
  getAwsConfig: () => ({
    endpoint: "http://localhost:4566",
    region: "us-east-1",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  }),
}));

import router from "./ssm";

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

// ── Parameters ───────────────────────────────────────────

describe("SSM routes — Parameters", () => {
  it("GET /parameters — returns list", async () => {
    mockSend.mockResolvedValueOnce({
      Parameters: [{ Name: "/app/config", Type: "String", Version: 1 }],
    });
    const res = await get("/parameters");
    const json = await res.json();
    expect(json.parameters).toHaveLength(1);
    expect(json.total).toBe(1);
  });

  it("GET /parameters — returns empty when none", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/parameters");
    const json = await res.json();
    expect(json.parameters).toEqual([]);
    expect(json.total).toBe(0);
  });

  it("GET /parameters/:name — returns parameter with decryption", async () => {
    mockSend.mockResolvedValueOnce({
      Parameter: { Name: "/app/key", Value: "secret", Type: "SecureString" },
    });
    const res = await get("/parameters/%2Fapp%2Fkey");
    const json = await res.json();
    expect(json.parameter.Name).toBe("/app/key");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "GetParameterCommand",
        Name: "/app/key",
        WithDecryption: true,
      })
    );
  });

  it("GET /parameters/:name — returns null when not found", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/parameters/nonexistent");
    const json = await res.json();
    expect(json.parameter).toBeNull();
  });

  it("POST /parameters — creates parameter", async () => {
    mockSend.mockResolvedValueOnce({ Version: 1 });
    const res = await post("/parameters", {
      name: "/app/config",
      value: "my-value",
      type: "String",
      description: "test",
    });
    const json = await res.json();
    expect(json.version).toBe(1);
    expect(res.status).toBe(201);
  });

  it("POST /parameters — 400 when name or value missing", async () => {
    const res = await post("/parameters", {});
    expect(res.status).toBe(400);
  });

  it("POST /parameters — defaults type to String", async () => {
    mockSend.mockResolvedValueOnce({ Version: 1 });
    await post("/parameters", { name: "/app/x", value: "y" });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "PutParameterCommand",
        Type: "String",
      })
    );
  });

  it("DELETE /parameters/:name — deletes parameter", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/parameters/%2Fapp%2Fconfig");
    const json = await res.json();
    expect(json.deleted).toBe(true);
  });
});

// ── Parameter History ────────────────────────────────────

describe("SSM routes — Parameter History", () => {
  it("GET /parameters/:name/history — returns history", async () => {
    mockSend.mockResolvedValueOnce({
      Parameters: [
        { Name: "/app/config", Version: 1, Value: "v1" },
        { Name: "/app/config", Version: 2, Value: "v2" },
      ],
    });
    const res = await get("/parameters/%2Fapp%2Fconfig/history");
    const json = await res.json();
    expect(json.history).toHaveLength(2);
    expect(json.total).toBe(2);
  });

  it("GET /parameters/:name/history — returns empty when none", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/parameters/%2Fapp%2Fconfig/history");
    const json = await res.json();
    expect(json.history).toEqual([]);
    expect(json.total).toBe(0);
  });
});

// ── Tags ─────────────────────────────────────────────────

describe("SSM routes — Tags", () => {
  it("GET /tags — returns tags", async () => {
    mockSend.mockResolvedValueOnce({
      TagList: [{ Key: "env", Value: "prod" }],
    });
    const res = await get("/tags?resourceId=/app/config");
    const json = await res.json();
    expect(json.tags).toHaveLength(1);
  });

  it("GET /tags — returns empty when none", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/tags?resourceId=/app/config");
    const json = await res.json();
    expect(json.tags).toEqual([]);
  });

  it("GET /tags — 400 when no resourceId", async () => {
    const res = await get("/tags");
    expect(res.status).toBe(400);
  });

  it("POST /tags — tags resource", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/tags", {
      resourceId: "/app/config",
      tags: [{ Key: "env", Value: "prod" }],
    });
    const json = await res.json();
    expect(json.tagged).toBe(true);
  });

  it("DELETE /tags — untags resource", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/tags?resourceId=/app/config&tagKeys=env,team");
    const json = await res.json();
    expect(json.untagged).toBe(true);
  });

  it("DELETE /tags — defaults to empty tagKeys when omitted", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/tags?resourceId=/app/config");
    const json = await res.json();
    expect(json.untagged).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "RemoveTagsFromResourceCommand",
        TagKeys: [],
      })
    );
  });

  it("DELETE /tags — 400 when no resourceId", async () => {
    const res = await del("/tags?tagKeys=env");
    expect(res.status).toBe(400);
  });

  // ── Batch params + instance info ──────────────────────

  it("POST /parameters/batch — gets multiple parameters", async () => {
    mockSend.mockResolvedValueOnce({
      Parameters: [{ Name: "a", Value: "1" }],
      InvalidParameters: ["b"],
    });
    const res = await post("/parameters/batch", { Names: ["a", "b"], WithDecryption: true });
    const json = await res.json();
    expect(json.parameters).toEqual([{ Name: "a", Value: "1" }]);
    expect(json.invalidParameters).toEqual(["b"]);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetParametersCommand");
    expect(mockSend.mock.calls[0][0].Names).toEqual(["a", "b"]);
    expect(mockSend.mock.calls[0][0].WithDecryption).toBe(true);
  });

  it("POST /parameters/batch — sparse result and 400 without names", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/parameters/batch", { Names: ["a"] });
    const json = await res.json();
    expect(json.parameters).toEqual([]);
    expect(json.invalidParameters).toEqual([]);
    const res400 = await post("/parameters/batch", { Names: [] });
    expect(res400.status).toBe(400);
  });

  it("GET /parameters-by-path — lists parameters under a path", async () => {
    mockSend.mockResolvedValueOnce({
      Parameters: [{ Name: "/app/db" }],
      NextToken: "tok-1",
    });
    const res = await get("/parameters-by-path?path=/app&recursive=true&withDecryption=true");
    const json = await res.json();
    expect(json.parameters).toEqual([{ Name: "/app/db" }]);
    expect(json.nextToken).toBe("tok-1");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("GetParametersByPathCommand");
    expect(cmd.Path).toBe("/app");
    expect(cmd.Recursive).toBe(true);
    expect(cmd.WithDecryption).toBe(true);
  });

  it("GET /parameters-by-path — sparse and 400 without path", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/parameters-by-path?path=/app");
    const json = await res.json();
    expect(json.parameters).toEqual([]);
    expect(json.nextToken).toBeNull();
    const res400 = await get("/parameters-by-path");
    expect(res400.status).toBe(400);
  });

  it("POST /parameters/delete-batch — deletes multiple parameters", async () => {
    mockSend.mockResolvedValueOnce({ DeletedParameters: ["a"], InvalidParameters: ["b"] });
    const res = await post("/parameters/delete-batch", { Names: ["a", "b"] });
    const json = await res.json();
    expect(json.deletedParameters).toEqual(["a"]);
    expect(json.invalidParameters).toEqual(["b"]);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteParametersCommand");
    expect(mockSend.mock.calls[0][0].Names).toEqual(["a", "b"]);
    const res400 = await post("/parameters/delete-batch", {});
    expect(res400.status).toBe(400);
    mockSend.mockResolvedValueOnce({});
    const sparse = await post("/parameters/delete-batch", { Names: ["a"] });
    const sparseJson = await sparse.json();
    expect(sparseJson.deletedParameters).toEqual([]);
    expect(sparseJson.invalidParameters).toEqual([]);
  });

  it("POST /parameters/label — labels a parameter version", async () => {
    mockSend.mockResolvedValueOnce({ InvalidLabels: ["x"], ParameterVersion: 3 });
    const res = await post("/parameters/label", { Name: "a", ParameterVersion: 3, Labels: ["prod"] });
    const json = await res.json();
    expect(json.invalidLabels).toEqual(["x"]);
    expect(json.parameterVersion).toBe(3);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("LabelParameterVersionCommand");
    expect(mockSend.mock.calls[0][0].Labels).toEqual(["prod"]);
  });

  it("POST /parameters/label — defaults labels and 400s without name/version", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/parameters/label", { Name: "a", ParameterVersion: 1 });
    const json = await res.json();
    expect(json.invalidLabels).toEqual([]);
    expect(mockSend.mock.calls[0][0].Labels).toEqual([]);
    const res400 = await post("/parameters/label", {});
    expect(res400.status).toBe(400);
    const res400v = await post("/parameters/label", { Name: "a" });
    expect(res400v.status).toBe(400);
  });

  it("GET /instance-information — lists managed instances", async () => {
    mockSend.mockResolvedValueOnce({
      InstanceInformationList: [{ InstanceId: "i-1" }],
    });
    const res = await get("/instance-information");
    const json = await res.json();
    expect(json.instances).toEqual([{ InstanceId: "i-1" }]);
    expect(json.total).toBe(1);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DescribeInstanceInformationCommand");
  });

  it("GET /instance-information — sparse result", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/instance-information");
    const json = await res.json();
    expect(json.instances).toEqual([]);
    expect(json.total).toBe(0);
  });

  describe("Run Command", () => {
    it("POST /commands — sends a command", async () => {
      mockSend.mockResolvedValueOnce({
        Command: { CommandId: "c-1", DocumentName: "AWS-RunShellScript", Status: "Pending", TargetCount: 2 },
      });
      const res = await post("/commands", {
        documentName: "AWS-RunShellScript",
        instanceIds: ["i-1", "i-2"],
        parameters: { commands: ["echo hi"] },
        comment: "run",
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.command.commandId).toBe("c-1");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("SendCommandCommand");
      expect(cmd.InstanceIds).toEqual(["i-1", "i-2"]);
      expect(cmd.Parameters).toEqual({ commands: ["echo hi"] });
    });

    it("POST /commands — 400 without documentName", async () => {
      const res = await post("/commands", { instanceIds: ["i-1"] });
      expect(res.status).toBe(400);
    });

    it("POST /commands — 400 without instanceIds", async () => {
      const res = await post("/commands", { documentName: "d" });
      expect(res.status).toBe(400);
    });

    it("POST /commands — null command on sparse response", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/commands", { documentName: "d", instanceIds: ["i-1"] });
      expect((await res.json()).command).toBeNull();
    });

    it("GET /commands — lists commands", async () => {
      mockSend.mockResolvedValueOnce({
        Commands: [{ CommandId: "c-1", DocumentName: "d", Status: "Success", TargetCount: 1 }],
      });
      const res = await get("/commands");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.commands[0].status).toBe("Success");
    });

    it("GET /commands — empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/commands");
      expect((await res.json()).commands).toEqual([]);
    });

    it("GET /commands — passes instanceId filter", async () => {
      mockSend.mockResolvedValueOnce({});
      await get("/commands?instanceId=i-1");
      expect(mockSend.mock.calls[0][0].InstanceId).toBe("i-1");
    });

    it("GET /commands/:id/invocations — lists invocations with plugin output", async () => {
      mockSend.mockResolvedValueOnce({
        CommandInvocations: [{
          CommandInvocationId: "inv-1",
          InstanceId: "i-1",
          Status: "Success",
          CommandPlugins: [{ Output: "hello" }],
        }],
      });
      const res = await get("/commands/c-1/invocations");
      const body = await res.json();
      expect(body.invocations[0].standardOutputContent).toBe("hello");
      expect(mockSend.mock.calls[0][0].Details).toBe(true);
    });

    it("GET /commands/:id/invocations — sparse fallback", async () => {
      mockSend.mockResolvedValueOnce({ CommandInvocations: [{}] });
      const res = await get("/commands/c-1/invocations");
      const body = await res.json();
      expect(body.invocations[0].standardOutputContent).toBe("");
    });

    it("GET /commands/:id/invocations — undefined list falls back to []", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/commands/c-1/invocations");
      const body = await res.json();
      expect(body.invocations).toEqual([]);
    });

    it("GET /commands/:id/invocations/:instanceId — sparse content fallbacks", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/commands/c-1/invocations/i-1");
      const body = await res.json();
      expect(body.invocation.standardOutputContent).toBe("");
      expect(body.invocation.standardErrorContent).toBe("");
    });

    it("GET /commands/:id/invocations/:instanceId — gets invocation detail", async () => {
      mockSend.mockResolvedValueOnce({
        CommandInvocationId: "inv-1",
        InstanceId: "i-1",
        Status: "Success",
        StandardOutputContent: "out",
        StandardErrorContent: "err",
      });
      const res = await get("/commands/c-1/invocations/i-1");
      const body = await res.json();
      expect(body.invocation.standardOutputContent).toBe("out");
      expect(body.invocation.standardErrorContent).toBe("err");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetCommandInvocationCommand");
    });

    it("DELETE /commands/:id — cancels", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/commands/c-1");
      expect((await res.json()).cancelled).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CancelCommandCommand");
    });
  });
});
