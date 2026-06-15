import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockLambdaClient = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-lambda", () => ({
  LambdaClient: mockLambdaClient,
  ListFunctionsCommand: createCmd("ListFunctionsCommand"),
  CreateFunctionCommand: createCmd("CreateFunctionCommand"),
  GetFunctionCommand: createCmd("GetFunctionCommand"),
  UpdateFunctionConfigurationCommand: createCmd("UpdateFunctionConfigurationCommand"),
  UpdateFunctionCodeCommand: createCmd("UpdateFunctionCodeCommand"),
  DeleteFunctionCommand: createCmd("DeleteFunctionCommand"),
  InvokeCommand: createCmd("InvokeCommand"),
  PublishVersionCommand: createCmd("PublishVersionCommand"),
  ListVersionsByFunctionCommand: createCmd("ListVersionsByFunctionCommand"),
  ListAliasesCommand: createCmd("ListAliasesCommand"),
  CreateAliasCommand: createCmd("CreateAliasCommand"),
  DeleteAliasCommand: createCmd("DeleteAliasCommand"),
  ListLayersCommand: createCmd("ListLayersCommand"),
  ListLayerVersionsCommand: createCmd("ListLayerVersionsCommand"),
  DeleteLayerVersionCommand: createCmd("DeleteLayerVersionCommand"),
  ListEventSourceMappingsCommand: createCmd("ListEventSourceMappingsCommand"),
  DeleteEventSourceMappingCommand: createCmd("DeleteEventSourceMappingCommand"),
  ListTagsCommand: createCmd("ListTagsCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
  GetFunctionUrlConfigCommand: createCmd("GetFunctionUrlConfigCommand"),
  DeleteFunctionUrlConfigCommand: createCmd("DeleteFunctionUrlConfigCommand"),
  GetFunctionConcurrencyCommand: createCmd("GetFunctionConcurrencyCommand"),
}));

vi.mock("../../clients/aws", () => ({
  getAwsConfig: () => ({
    endpoint: "http://localhost:4566",
    region: "us-east-1",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  }),
}));

import router from "./lambda";

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

const mockFunction = {
  FunctionName: "my-function",
  FunctionArn: "arn:aws:lambda:us-east-1:000000000000:function:my-function",
  Runtime: "nodejs22.x",
  Handler: "index.handler",
  Role: "arn:aws:iam::000000000000:role/lambda-role",
  Timeout: 3,
  MemorySize: 128,
  LastModified: "2025-01-01T00:00:00Z",
  CodeSize: 1000,
  CodeSha256: "abc123",
  Version: "$LATEST",
  State: "Active",
};

beforeEach(() => {
  mockSend.mockReset();
});

describe("Lambda Routes", () => {
  describe("Functions", () => {
    it("GET /functions — lists functions", async () => {
      mockSend.mockResolvedValueOnce({ Functions: [mockFunction] });
      const res = await get("/functions");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.functions[0].name).toBe("my-function");
      expect(body.functions[0].runtime).toBe("nodejs22.x");
    });

    it("GET /functions — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ Functions: [] });
      const res = await get("/functions");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("POST /functions — creates a function", async () => {
      mockSend.mockResolvedValueOnce({ ...mockFunction });
      const res = await post("/functions", {
        name: "my-function",
        runtime: "nodejs22.x",
        handler: "index.handler",
        zipFile: Buffer.from("function code").toString("base64"),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.function.name).toBe("my-function");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.FunctionName).toBe("my-function");
      expect(cmd.Runtime).toBe("nodejs22.x");
      expect(cmd.Code.ZipFile).toBeDefined();
    });

    it("GET /functions/:name — gets function detail", async () => {
      mockSend.mockResolvedValueOnce({
        Configuration: mockFunction,
        Code: { RepositoryType: "S3", Location: "https://..." },
      });
      const res = await get("/functions/my-function");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.configuration.name).toBe("my-function");
      expect(body.code.repositoryType).toBe("S3");
    });

    it("PUT /functions/:name/configuration — updates config", async () => {
      mockSend.mockResolvedValueOnce({ ...mockFunction });
      const res = await put("/functions/my-function/configuration", {
        timeout: 10,
        memorySize: 256,
      });
      expect(res.status).toBe(200);
      expect((await res.json()).updated).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.FunctionName).toBe("my-function");
      expect(cmd.Timeout).toBe(10);
    });

    it("DELETE /functions/:name — deletes a function", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/functions/my-function");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].FunctionName).toBe("my-function");
    });

    it("POST /functions/:name/invocations — invokes a function", async () => {
      mockSend.mockResolvedValueOnce({
        StatusCode: 200,
        ExecutedVersion: "$LATEST",
        Payload: new TextEncoder().encode(JSON.stringify({ result: "ok" })),
        $metadata: { requestId: "req-001" },
      });
      const res = await post("/functions/my-function/invocations", {
        test: "data",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.statusCode).toBe(200);
      expect(body.payload).toEqual({ result: "ok" });
    });
  });

  describe("Versions & Aliases", () => {
    it("POST /functions/:name/versions — publishes version", async () => {
      mockSend.mockResolvedValueOnce({ ...mockFunction, Version: "2" });
      const res = await post("/functions/my-function/versions", {
        description: "v2",
      });
      expect(res.status).toBe(200);
      expect((await res.json()).published).toBe(true);
    });

    it("GET /functions/:name/versions — lists versions", async () => {
      mockSend.mockResolvedValueOnce({
        Versions: [{ ...mockFunction, Version: "1" }],
      });
      const res = await get("/functions/my-function/versions");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /functions/:name/aliases — lists aliases", async () => {
      mockSend.mockResolvedValueOnce({
        Aliases: [
          {
            Name: "prod",
            FunctionVersion: "1",
            AliasArn: "arn:aws:lambda:...:alias/prod",
          },
        ],
      });
      const res = await get("/functions/my-function/aliases");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.aliases[0].name).toBe("prod");
    });

    it("POST /functions/:name/aliases — creates alias", async () => {
      mockSend.mockResolvedValueOnce({
        Name: "staging",
        FunctionVersion: "2",
        AliasArn: "arn:aws:lambda:...:alias/staging",
      });
      const res = await post("/functions/my-function/aliases", {
        name: "staging",
        functionVersion: "2",
      });
      expect(res.status).toBe(200);
      expect((await res.json()).created).toBe(true);
    });
  });

  describe("Layers", () => {
    it("GET /layers — lists layers", async () => {
      mockSend.mockResolvedValueOnce({
        Layers: [
          {
            LayerName: "my-layer",
            LayerArn: "arn:aws:lambda:...:layer/my-layer",
            LatestMatchingVersion: {
              Version: 1,
              Description: "test",
              CodeSize: 500,
              CompatibleRuntimes: ["nodejs22.x"],
            },
          },
        ],
      });
      const res = await get("/layers");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.layers[0].name).toBe("my-layer");
    });

    it("DELETE /layers/:name/versions/:version — deletes layer version", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/layers/my-layer/versions/1");
      expect(res.status).toBe(200);
      expect((await res.json()).deleted).toBe(true);
    });
  });

  describe("Event Source Mappings", () => {
    it("GET /event-source-mappings — lists mappings", async () => {
      mockSend.mockResolvedValueOnce({
        EventSourceMappings: [
          {
            UUID: "uuid-001",
            FunctionArn: "arn:aws:lambda:...:function:my-function",
            EventSourceArn: "arn:aws:sqs:...:my-queue",
            State: "Enabled",
            BatchSize: 10,
            LastProcessingResult: "OK",
          },
        ],
      });
      const res = await get("/event-source-mappings?functionName=my-function");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.eventSourceMappings[0].uuid).toBe("uuid-001");
    });
  });

  describe("Tags", () => {
    it("GET /tags/:arn — lists tags", async () => {
      mockSend.mockResolvedValueOnce({
        Tags: { env: "prod", project: "floci" },
      });
      const res = await get("/tags/arn:aws:lambda:...:function:my-function");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags.env).toBe("prod");
    });

    it("POST /tags/:arn — tags resource", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tags/arn:aws:lambda:...:function:my-function", {
        tags: { env: "staging" },
      });
      expect(res.status).toBe(200);
      expect((await res.json()).tagged).toBe(true);
    });
  });
});
