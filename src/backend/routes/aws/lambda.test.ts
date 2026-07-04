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
  PublishLayerVersionCommand: createCmd("PublishLayerVersionCommand"),
  ListEventSourceMappingsCommand: createCmd("ListEventSourceMappingsCommand"),
  DeleteEventSourceMappingCommand: createCmd("DeleteEventSourceMappingCommand"),
  ListTagsCommand: createCmd("ListTagsCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
  GetFunctionUrlConfigCommand: createCmd("GetFunctionUrlConfigCommand"),
  CreateFunctionUrlConfigCommand: createCmd("CreateFunctionUrlConfigCommand"),
  UpdateFunctionUrlConfigCommand: createCmd("UpdateFunctionUrlConfigCommand"),
  DeleteFunctionUrlConfigCommand: createCmd("DeleteFunctionUrlConfigCommand"),
  GetFunctionConcurrencyCommand: createCmd("GetFunctionConcurrencyCommand"),
  PutFunctionConcurrencyCommand: createCmd("PutFunctionConcurrencyCommand"),
  DeleteFunctionConcurrencyCommand: createCmd("DeleteFunctionConcurrencyCommand"),
  GetFunctionEventInvokeConfigCommand: createCmd("GetFunctionEventInvokeConfigCommand"),
  PutFunctionEventInvokeConfigCommand: createCmd("PutFunctionEventInvokeConfigCommand"),
  DeleteFunctionEventInvokeConfigCommand: createCmd("DeleteFunctionEventInvokeConfigCommand"),
  GetFunctionCodeSigningConfigCommand: createCmd("GetFunctionCodeSigningConfigCommand"),
  PutFunctionCodeSigningConfigCommand: createCmd("PutFunctionCodeSigningConfigCommand"),
  DeleteFunctionCodeSigningConfigCommand: createCmd("DeleteFunctionCodeSigningConfigCommand"),
  ListCodeSigningConfigsCommand: createCmd("ListCodeSigningConfigsCommand"),
  CreateCodeSigningConfigCommand: createCmd("CreateCodeSigningConfigCommand"),
  DeleteCodeSigningConfigCommand: createCmd("DeleteCodeSigningConfigCommand"),
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

    it("PUT /functions/:name/code — updates code from zipFile", async () => {
      mockSend.mockResolvedValueOnce({ ...mockFunction });
      const res = await put("/functions/my-function/code", {
        zipFile: Buffer.from("new code").toString("base64"),
      });
      expect(res.status).toBe(200);
      expect((await res.json()).updated).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.ZipFile).toBeDefined();
    });

    it("PUT /functions/:name/code — updates code from S3", async () => {
      mockSend.mockResolvedValueOnce({ ...mockFunction });
      const res = await put("/functions/my-function/code", {
        s3Bucket: "my-bucket",
        s3Key: "lambda.zip",
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.S3Bucket).toBe("my-bucket");
      expect(cmd.S3Key).toBe("lambda.zip");
      expect(cmd.ZipFile).toBeUndefined();
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

    it("DELETE /functions/:name/aliases/:aliasName — deletes alias", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/functions/my-function/aliases/staging");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(body.name).toBe("staging");
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

    it("GET /layers/:name/versions — lists layer versions", async () => {
      mockSend.mockResolvedValueOnce({
        LayerVersions: [
          { Version: 2, Description: "v2", CodeSize: 600, CompatibleRuntimes: ["nodejs22.x"] },
          { Version: 1, Description: "v1", CodeSize: 500, CompatibleRuntimes: ["nodejs20.x"] },
        ],
      });
      const res = await get("/layers/my-layer/versions");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(2);
      expect(body.versions[0].version).toBe(2);
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

    it("DELETE /event-source-mappings/:uuid — deletes mapping", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/event-source-mappings/uuid-001");
      expect(res.status).toBe(200);
      expect((await res.json()).deleted).toBe(true);
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

    it("DELETE /tags/:arn — untags resource", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/tags/arn:aws:lambda:...:function:my-function?tagKeys=env&tagKeys=team");
      expect(res.status).toBe(200);
      expect((await res.json()).untagged).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.TagKeys).toEqual(["env", "team"]);
    });
  });

  describe("Function URLs & Concurrency", () => {
    it("GET /functions/:name/url — gets function URL config", async () => {
      mockSend.mockResolvedValueOnce({
        FunctionUrl: "https://abc.lambda-url.us-east-1.on.aws/",
        AuthType: "AWS_IAM",
        Cors: { AllowMethods: ["GET"] },
        InvokeMode: "BUFFERED",
      });
      const res = await get("/functions/my-function/url");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.url).toContain("lambda-url");
      expect(body.authType).toBe("AWS_IAM");
    });

    it("DELETE /functions/:name/url — deletes function URL config", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/functions/my-function/url");
      expect(res.status).toBe(200);
      expect((await res.json()).deleted).toBe(true);
    });

    it("GET /functions/:name/concurrency — returns reserved concurrency", async () => {
      mockSend.mockResolvedValueOnce({ ReservedConcurrentExecutions: 10 });
      const res = await get("/functions/my-function/concurrency");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.reservedConcurrentExecutions).toBe(10);
    });

    it("GET /functions/:name/concurrency — undefined when not configured", async () => {
      mockSend.mockRejectedValueOnce(new Error("ResourceNotFoundException"));
      const res = await get("/functions/my-function/concurrency");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.reservedConcurrentExecutions).toBeUndefined();
    });

    it("POST /functions/:name/url — creates function URL config", async () => {
      mockSend.mockResolvedValueOnce({
        FunctionUrl: "https://new.lambda-url.us-east-1.on.aws/",
        AuthType: "NONE",
        Cors: { AllowMethods: ["*"] },
        InvokeMode: "BUFFERED",
      });
      const res = await post("/functions/my-function/url", {
        authType: "NONE",
        cors: { AllowMethods: ["*"] },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.url).toContain("lambda-url");
      expect(body.authType).toBe("NONE");
    });

    it("POST /functions/:name/url — rejects missing authType", async () => {
      const res = await post("/functions/my-function/url", { cors: {} });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("authType");
    });

    it("PUT /functions/:name/url — updates function URL config", async () => {
      mockSend.mockResolvedValueOnce({
        FunctionUrl: "https://updated.lambda-url.us-east-1.on.aws/",
        AuthType: "AWS_IAM",
        Cors: { AllowMethods: ["POST"] },
        InvokeMode: "BUFFERED",
      });
      const res = await put("/functions/my-function/url", {
        authType: "AWS_IAM",
        cors: { AllowMethods: ["POST"] },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.authType).toBe("AWS_IAM");
    });

    it("PUT /functions/:name/concurrency — sets reserved concurrency", async () => {
      mockSend.mockResolvedValueOnce({ ReservedConcurrentExecutions: 5 });
      const res = await put("/functions/my-function/concurrency", {
        reservedConcurrentExecutions: 5,
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.reservedConcurrentExecutions).toBe(5);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.ReservedConcurrentExecutions).toBe(5);
    });

    it("PUT /functions/:name/concurrency — rejects missing value", async () => {
      const res = await put("/functions/my-function/concurrency", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /functions/:name/concurrency — removes reserved concurrency", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/functions/my-function/concurrency");
      expect(res.status).toBe(200);
      expect((await res.json()).deleted).toBe(true);
    });

    it("GET /functions/:name/event-invoke-config — returns config when set", async () => {
      mockSend.mockResolvedValueOnce({
        MaximumRetryAttempts: 2,
        MaximumEventAgeInSeconds: 3600,
        DestinationConfig: { OnSuccess: { Destination: "arn:aws:sqs:...:queue" } },
        FunctionArn: "arn:aws:lambda:...:function:my-function",
      });
      const res = await get("/functions/my-function/event-invoke-config");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.maximumRetryAttempts).toBe(2);
      expect(body.maximumEventAgeInSeconds).toBe(3600);
    });

    it("GET /functions/:name/event-invoke-config — empty when not configured", async () => {
      mockSend.mockRejectedValueOnce(new Error("ResourceNotFoundException"));
      const res = await get("/functions/my-function/event-invoke-config");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Object.keys(body).length).toBe(0);
    });

    it("PUT /functions/:name/event-invoke-config — updates config", async () => {
      mockSend.mockResolvedValueOnce({
        MaximumRetryAttempts: 1,
        MaximumEventAgeInSeconds: 1800,
        FunctionArn: "arn:aws:lambda:...:function:my-function",
      });
      const res = await put("/functions/my-function/event-invoke-config", {
        maximumRetryAttempts: 1,
        maximumEventAgeInSeconds: 1800,
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.maximumRetryAttempts).toBe(1);
    });

    it("DELETE /functions/:name/event-invoke-config — deletes config", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/functions/my-function/event-invoke-config");
      expect(res.status).toBe(200);
      expect((await res.json()).deleted).toBe(true);
    });
  });

  describe("Layer Creation", () => {
    it("POST /layers/:name/versions — creates layer version", async () => {
      mockSend.mockResolvedValueOnce({
        Version: 1,
        Content: { CodeSize: 500 },
        Description: "My layer",
        CompatibleRuntimes: ["nodejs22.x"],
        LicenseInfo: "MIT",
      });
      const res = await post("/layers/my-layer/versions", {
        zipFile: Buffer.from("layer code").toString("base64"),
        compatibleRuntimes: ["nodejs22.x"],
        description: "My layer",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.version).toBe(1);
      expect(body.compatibleRuntimes).toEqual(["nodejs22.x"]);
    });

    it("POST /layers/:name/versions — rejects missing zipFile", async () => {
      const res = await post("/layers/my-layer/versions", { description: "test" });
      expect(res.status).toBe(400);
    });
  });

  describe("Code Signing Config", () => {
    it("GET /functions/:name/code-signing-config — returns config when set", async () => {
      mockSend.mockResolvedValueOnce({
        CodeSigningConfigArn: "arn:aws:lambda:us-east-1:1:code-signing-config:csc-001",
        FunctionName: "my-function",
      });
      const res = await get("/functions/my-function/code-signing-config");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.codeSigningConfigArn).toContain("code-signing-config");
    });

    it("GET /functions/:name/code-signing-config — empty when not configured", async () => {
      mockSend.mockRejectedValueOnce(new Error("ResourceNotFoundException"));
      const res = await get("/functions/my-function/code-signing-config");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Object.keys(body).length).toBe(0);
    });

    it("PUT /functions/:name/code-signing-config — sets code signing config", async () => {
      mockSend.mockResolvedValueOnce({
        CodeSigningConfigArn: "arn:aws:lambda:us-east-1:1:code-signing-config:csc-001",
        FunctionName: "my-function",
      });
      const res = await put("/functions/my-function/code-signing-config", {
        codeSigningConfigArn: "arn:aws:lambda:us-east-1:1:code-signing-config:csc-001",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.codeSigningConfigArn).toContain("code-signing-config");
    });

    it("PUT /functions/:name/code-signing-config — rejects missing arn", async () => {
      const res = await put("/functions/my-function/code-signing-config", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /functions/:name/code-signing-config — deletes code signing config", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/functions/my-function/code-signing-config");
      expect(res.status).toBe(200);
      expect((await res.json()).deleted).toBe(true);
    });

    it("GET /code-signing-configs — lists code signing configs", async () => {
      mockSend.mockResolvedValueOnce({
        CodeSigningConfigs: [
          {
            CodeSigningConfigArn: "arn:aws:lambda:...:code-signing-config:csc-001",
            Description: "My config",
            AllowedPublishers: { SigningProfileVersionArns: ["arn:aws:signer:...:/signing-profiles/my-profile"] },
            CodeSigningPolicies: { UntrustedArtifactOnDeployment: "Warn" },
            LastModified: "2025-01-01T00:00:00Z",
          },
        ],
      });
      const res = await get("/code-signing-configs");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.codeSigningConfigs[0].description).toBe("My config");
    });

    it("POST /code-signing-configs — creates code signing config", async () => {
      mockSend.mockResolvedValueOnce({
        CodeSigningConfig: {
          CodeSigningConfigArn: "arn:aws:lambda:...:code-signing-config:csc-002",
          Description: "New config",
          AllowedPublishers: { SigningProfileVersionArns: ["arn:aws:signer:...:/signing-profiles/my-profile"] },
          CodeSigningPolicies: { UntrustedArtifactOnDeployment: "Enforce" },
          LastModified: "2025-01-01T00:00:00Z",
        },
      });
      const res = await post("/code-signing-configs", {
        description: "New config",
        signingProfileVersionArns: ["arn:aws:signer:...:/signing-profiles/my-profile"],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.codeSigningConfig.description).toBe("New config");
    });

    it("POST /code-signing-configs — rejects missing signingProfileVersionArns", async () => {
      const res = await post("/code-signing-configs", { description: "test" });
      expect(res.status).toBe(400);
    });

    it("DELETE /code-signing-configs/:arn — deletes code signing config", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/code-signing-configs/arn%3Aaws%3Alambda%3Aus-east-1%3A1%3Acode-signing-config%3Acsc-001");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });
});
