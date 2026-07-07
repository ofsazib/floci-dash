import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockLambda = vi.hoisted(() =>
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
  LambdaClient: mockLambda,
  ListFunctionsCommand: createCmd("ListFunctionsCommand"),
  CreateFunctionCommand: createCmd("CreateFunctionCommand"),
  GetFunctionCommand: createCmd("GetFunctionCommand"),
  GetFunctionConfigurationCommand: createCmd("GetFunctionConfigurationCommand"),
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
  ListFunctionUrlConfigsCommand: createCmd("ListFunctionUrlConfigsCommand"),
  GetFunctionEventInvokeConfigCommand: createCmd("GetFunctionEventInvokeConfigCommand"),
  PutFunctionEventInvokeConfigCommand: createCmd("PutFunctionEventInvokeConfigCommand"),
  DeleteFunctionEventInvokeConfigCommand: createCmd("DeleteFunctionEventInvokeConfigCommand"),
  GetFunctionCodeSigningConfigCommand: createCmd("GetFunctionCodeSigningConfigCommand"),
  PutFunctionCodeSigningConfigCommand: createCmd("PutFunctionCodeSigningConfigCommand"),
  DeleteFunctionCodeSigningConfigCommand: createCmd("DeleteFunctionCodeSigningConfigCommand"),
  ListCodeSigningConfigsCommand: createCmd("ListCodeSigningConfigsCommand"),
  CreateCodeSigningConfigCommand: createCmd("CreateCodeSigningConfigCommand"),
  DeleteCodeSigningConfigCommand: createCmd("DeleteCodeSigningConfigCommand"),
  ListFunctionEventInvokeConfigsCommand: createCmd("ListFunctionEventInvokeConfigsCommand"),
}));

vi.mock("../../clients/aws", () => ({
  getAwsConfig: () => ({
    endpoint: "http://localhost:4566",
    region: "us-east-1",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  }),
}));

vi.mock("../../clients/sanitize", () => ({
  sanitizeName: (v: string) => v,
  sanitizeText: (v: string) => v,
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

beforeEach(() => {
  mockSend.mockReset();
});

// ─── Functions ───────────────────────────────────────────

describe("Functions", () => {
  it("GET /functions — returns empty list", async () => {
    mockSend.mockResolvedValueOnce({ Functions: [] });
    const res = await get("/functions");
    const body = await res.json();
    expect(body).toEqual({ functions: [], total: 0 });
  });

  it("GET /functions — returns list with mapped functions", async () => {
    mockSend.mockResolvedValueOnce({
      Functions: [
        {
          FunctionName: "my-func",
          FunctionArn: "arn:aws:lambda:us-east-1::function:my-func",
          Runtime: "nodejs22.x",
          Handler: "index.handler",
          Role: "arn:aws:iam::000000000000:role/lambda-role",
          Timeout: 3,
          MemorySize: 128,
          LastModified: "2025-01-01",
          CodeSize: 2048,
          Version: "$LATEST",
          State: "Active",
          Architectures: ["arm64"],
        },
      ],
    });
    const res = await get("/functions");
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.functions[0].name).toBe("my-func");
    expect(body.functions[0].runtime).toBe("nodejs22.x");
    expect(body.functions[0].architectures).toEqual(["arm64"]);
  });

  it("POST /functions — creates function with zipFile", async () => {
    mockSend.mockResolvedValueOnce({
      FunctionName: "new-func",
      Runtime: "nodejs22.x",
      Handler: "index.handler",
    });
    const res = await post("/functions", {
      name: "new-func",
      runtime: "nodejs22.x",
      handler: "index.handler",
      zipFile: Buffer.from("UEsDBBQAAAAAA").toString("base64"),
      timeout: 5,
      memorySize: 256,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.created).toBe(true);
    expect(body.function.name).toBe("new-func");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateFunctionCommand");
    expect(mockSend.mock.calls[0][0].Timeout).toBe(5);
    expect(mockSend.mock.calls[0][0].MemorySize).toBe(256);
  });

  it("POST /functions — creates function with S3", async () => {
    mockSend.mockResolvedValueOnce({ FunctionName: "s3-func" });
    const res = await post("/functions", {
      name: "s3-func",
      runtime: "python3.12",
      handler: "app.lambda_handler",
      s3Bucket: "my-bucket",
      s3Key: "function.zip",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.created).toBe(true);
    expect(mockSend.mock.calls[0][0].Code.S3Bucket).toBe("my-bucket");
  });

  it("POST /functions — 400 when name is empty", async () => {
    const res = await post("/functions", { name: "", runtime: "nodejs22.x" });
    expect(res.status).toBe(400);
  });

  it("GET /functions/:name — returns function detail", async () => {
    mockSend.mockResolvedValueOnce({
      Configuration: {
        FunctionName: "my-func",
        Runtime: "nodejs22.x",
        Handler: "index.handler",
        Timeout: 3,
        MemorySize: 128,
        State: "Active",
      },
      Code: { RepositoryType: "S3", Location: "https://example.com/code" },
    });
    const res = await get("/functions/my-func");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.configuration.name).toBe("my-func");
    expect(body.code.repositoryType).toBe("S3");
  });

  it("PUT /functions/:name/configuration — updates config", async () => {
    mockSend.mockResolvedValueOnce({
      FunctionName: "my-func",
      Runtime: "nodejs22.x",
      Handler: "index.handler",
      Timeout: 10,
      MemorySize: 512,
    });
    const res = await put("/functions/my-func/configuration", {
      timeout: 10,
      memorySize: 512,
      description: "Updated function",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
    expect(mockSend.mock.calls[0][0].Timeout).toBe(10);
  });

  it("PUT /functions/:name/code — updates code", async () => {
    mockSend.mockResolvedValueOnce({ FunctionName: "my-func" });
    const res = await put("/functions/my-func/code", {
      zipFile: Buffer.from("UEsDBBQAAAAAA").toString("base64"),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateFunctionCodeCommand");
  });

  it("DELETE /functions/:name — deletes function", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/functions/my-func");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteFunctionCommand");
  });
});

// ─── Invoke ──────────────────────────────────────────────

describe("Invoke", () => {
  it("POST /functions/:name/invocations — invokes and returns JSON payload", async () => {
    mockSend.mockResolvedValueOnce({
      StatusCode: 200,
      ExecutedVersion: "$LATEST",
      Payload: new TextEncoder().encode(JSON.stringify({ result: "ok" })),
      $metadata: { requestId: "req-123" },
    });
    const res = await post("/functions/my-func/invocations", { key: "value" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.statusCode).toBe(200);
    expect(body.payload).toEqual({ result: "ok" });
    expect(body.executedVersion).toBe("$LATEST");
  });

  it("POST /functions/:name/invocations — handles non-JSON payload", async () => {
    mockSend.mockResolvedValueOnce({
      StatusCode: 200,
      Payload: new TextEncoder().encode("plain string result"),
    });
    const res = await post("/functions/my-func/invocations", {});
    const body = await res.json();
    expect(body.payload).toBe("plain string result");
  });

  it("POST /functions/:name/invocations — includes functionError when present", async () => {
    mockSend.mockResolvedValueOnce({
      StatusCode: 200,
      FunctionError: "Unhandled",
      Payload: new TextEncoder().encode("{}"),
    });
    const res = await post("/functions/my-func/invocations", {});
    const body = await res.json();
    expect(body.functionError).toBe("Unhandled");
  });
});

// ─── Versions ────────────────────────────────────────────

describe("Versions", () => {
  it("POST /functions/:name/versions — publishes version", async () => {
    mockSend.mockResolvedValueOnce({
      FunctionName: "my-func",
      Version: "1",
      Description: "First release",
    });
    const res = await post("/functions/my-func/versions", {
      description: "First release",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.published).toBe(true);
    expect(body.version.version).toBe("1");
  });

  it("GET /functions/:name/versions — lists versions", async () => {
    mockSend.mockResolvedValueOnce({
      Versions: [
        { FunctionName: "my-func", Version: "1" },
        { FunctionName: "my-func", Version: "2" },
      ],
    });
    const res = await get("/functions/my-func/versions");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(2);
    expect(body.versions).toHaveLength(2);
  });

  it("GET /functions/:name/versions — returns empty when none", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/functions/my-func/versions");
    const body = await res.json();
    expect(body.total).toBe(0);
  });
});

// ─── Aliases ─────────────────────────────────────────────

describe("Aliases", () => {
  it("GET /functions/:name/aliases — lists aliases", async () => {
    mockSend.mockResolvedValueOnce({
      Aliases: [{ Name: "prod", FunctionVersion: "1", AliasArn: "arn:aws:lambda:us-east-1::function:my-func:prod", Description: "Production" }],
    });
    const res = await get("/functions/my-func/aliases");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.aliases[0].name).toBe("prod");
    expect(body.aliases[0].functionVersion).toBe("1");
  });

  it("GET /functions/:name/aliases — returns empty when none", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/functions/my-func/aliases");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("POST /functions/:name/aliases — creates alias", async () => {
    mockSend.mockResolvedValueOnce({ Name: "staging", FunctionVersion: "1" });
    const res = await post("/functions/my-func/aliases", {
      name: "staging",
      functionVersion: "1",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.created).toBe(true);
  });

  it("DELETE /functions/:name/aliases/:aliasName — deletes alias", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/functions/my-func/aliases/prod");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });
});

// ─── Event Source Mappings ───────────────────────────────

describe("Event Source Mappings", () => {
  it("GET /event-source-mappings — lists mappings", async () => {
    mockSend.mockResolvedValueOnce({
      EventSourceMappings: [
        { UUID: "uuid-1", FunctionArn: "arn:lambda", EventSourceArn: "arn:sqs", State: "Enabled", BatchSize: 10, LastProcessingResult: "OK" },
      ],
    });
    const res = await get("/event-source-mappings?functionName=my-func");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.eventSourceMappings[0].uuid).toBe("uuid-1");
  });

  it("GET /event-source-mappings — returns empty when none", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/event-source-mappings");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("DELETE /event-source-mappings/:uuid — deletes mapping", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/event-source-mappings/uuid-123");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });
});

// ─── Layers ──────────────────────────────────────────────

describe("Layers", () => {
  it("GET /layers — lists layers", async () => {
    mockSend.mockResolvedValueOnce({
      Layers: [
        {
          LayerName: "my-layer",
          LayerArn: "arn:aws:lambda:us-east-1::layer:my-layer:1",
          LatestMatchingVersion: {
            Version: 1,
            Description: "Test layer",
            CodeSize: 1024,
            CompatibleRuntimes: ["nodejs22.x"],
            LicenseInfo: "MIT",
          },
        },
      ],
    });
    const res = await get("/layers");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.layers[0].name).toBe("my-layer");
    expect(body.layers[0].latestVersion.version).toBe(1);
  });

  it("GET /layers — handles layer without latest version", async () => {
    mockSend.mockResolvedValueOnce({ Layers: [{ LayerName: "empty-layer", LayerArn: "arn:..." }] });
    const res = await get("/layers");
    const body = await res.json();
    expect(body.layers[0].latestVersion).toBeUndefined();
  });

  it("GET /layers — returns empty when none", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/layers");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("GET /layers/:name/versions — lists layer versions", async () => {
    mockSend.mockResolvedValueOnce({
      LayerVersions: [{ Version: 1, Description: "Initial", CodeSize: 512, CompatibleRuntimes: ["nodejs22.x"] }],
    });
    const res = await get("/layers/my-layer/versions");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.versions[0].version).toBe(1);
  });

  it("DELETE /layers/:name/versions/:version — deletes layer version", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/layers/my-layer/versions/1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].VersionNumber).toBe(1);
  });

  it("POST /layers/:name/versions — creates layer version", async () => {
    mockSend.mockResolvedValueOnce({
      Version: 2,
      Content: { CodeSize: 2048 },
      Description: "Updated layer",
      CompatibleRuntimes: ["nodejs22.x"],
      LicenseInfo: "MIT",
    });
    const res = await post("/layers/my-layer/versions", {
      zipFile: Buffer.from("UEsDBBQAAAAAA").toString("base64"),
      compatibleRuntimes: ["nodejs22.x"],
      description: "Updated layer",
      licenseInfo: "MIT",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.created).toBe(true);
    expect(body.version).toBe(2);
  });

  it("POST /layers/:name/versions — 400 when zipFile missing", async () => {
    const res = await post("/layers/my-layer/versions", {});
    expect(res.status).toBe(400);
  });
});

// ─── Tags ────────────────────────────────────────────────

describe("Tags", () => {
  it("GET /tags/:arn — lists tags", async () => {
    mockSend.mockResolvedValueOnce({ Tags: { env: "prod", team: "backend" } });
    const res = await get("/tags/arn:aws:lambda:us-east-1::function:my-func");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tags.env).toBe("prod");
    expect(body.tags.team).toBe("backend");
  });

  it("GET /tags/:arn — returns empty object when no tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/tags/arn:aws:lambda:us-east-1::function:my-func");
    const body = await res.json();
    expect(body.tags).toEqual({});
  });

  it("POST /tags/:arn — tags resource", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/tags/arn:aws:lambda:us-east-1::function:my-func", {
      tags: { env: "prod" },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tagged).toBe(true);
  });

  it("DELETE /tags/:arn — untags resource", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/tags/arn:aws:lambda:us-east-1::function:my-func?tagKeys=env&tagKeys=team");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.untagged).toBe(true);
  });
});

// ─── Function URL Config ─────────────────────────────────

describe("Function URLs", () => {
  it("GET /functions/:name/url — gets URL config", async () => {
    mockSend.mockResolvedValueOnce({
      FunctionUrl: "https://example.com/fn",
      AuthType: "NONE",
      Cors: { AllowMethods: ["*"] },
      InvokeMode: "BUFFERED",
    });
    const res = await get("/functions/my-func/url");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://example.com/fn");
    expect(body.authType).toBe("NONE");
  });

  it("POST /functions/:name/url — creates URL config", async () => {
    mockSend.mockResolvedValueOnce({
      FunctionUrl: "https://example.com/fn",
      AuthType: "NONE",
    });
    const res = await post("/functions/my-func/url", {
      authType: "NONE",
      cors: { AllowMethods: ["*"] },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://example.com/fn");
    expect(mockSend.mock.calls[0][0].AuthType).toBe("NONE");
  });

  it("POST /functions/:name/url — 400 when authType missing", async () => {
    const res = await post("/functions/my-func/url", {});
    expect(res.status).toBe(400);
  });

  it("PUT /functions/:name/url — updates URL config", async () => {
    mockSend.mockResolvedValueOnce({
      FunctionUrl: "https://example.com/fn",
      AuthType: "AWS_IAM",
      Cors: { AllowMethods: ["GET", "POST"] },
      InvokeMode: "BUFFERED",
    });
    const res = await put("/functions/my-func/url", {
      authType: "AWS_IAM",
      cors: { AllowMethods: ["GET", "POST"] },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.authType).toBe("AWS_IAM");
  });

  it("DELETE /functions/:name/url — deletes URL config", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/functions/my-func/url");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });
});

// ─── Concurrency ────────────────────────────────────────

describe("Concurrency", () => {
  it("GET /functions/:name/concurrency — returns reserved concurrency", async () => {
    mockSend.mockResolvedValueOnce({ ReservedConcurrentExecutions: 5 });
    const res = await get("/functions/my-func/concurrency");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reservedConcurrentExecutions).toBe(5);
  });

  it("GET /functions/:name/concurrency — returns undefined on error", async () => {
    mockSend.mockRejectedValueOnce(new Error("ResourceNotFoundException"));
    const res = await get("/functions/my-func/concurrency");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reservedConcurrentExecutions).toBeUndefined();
  });

  it("PUT /functions/:name/concurrency — sets concurrency", async () => {
    mockSend.mockResolvedValueOnce({ ReservedConcurrentExecutions: 10 });
    const res = await put("/functions/my-func/concurrency", {
      reservedConcurrentExecutions: 10,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reservedConcurrentExecutions).toBe(10);
  });

  it("PUT /functions/:name/concurrency — 400 when value is null", async () => {
    const res = await put("/functions/my-func/concurrency", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /functions/:name/concurrency — removes concurrency limit", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/functions/my-func/concurrency");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });
});

// ─── Event Invoke Config ────────────────────────────────

describe("Event Invoke Config", () => {
  it("GET /functions/:name/event-invoke-config — returns config", async () => {
    mockSend.mockResolvedValueOnce({
      MaximumRetryAttempts: 2,
      MaximumEventAgeInSeconds: 3600,
      DestinationConfig: { OnSuccess: { Destination: "arn:aws:sqs:..." } },
      FunctionArn: "arn:aws:lambda:...",
    });
    const res = await get("/functions/my-func/event-invoke-config");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.maximumRetryAttempts).toBe(2);
    expect(body.maximumEventAgeInSeconds).toBe(3600);
  });

  it("GET /functions/:name/event-invoke-config — returns empty on error", async () => {
    mockSend.mockRejectedValueOnce(new Error("NotFound"));
    const res = await get("/functions/my-func/event-invoke-config");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({});
  });

  it("PUT /functions/:name/event-invoke-config — sets config", async () => {
    mockSend.mockResolvedValueOnce({
      MaximumRetryAttempts: 3,
      MaximumEventAgeInSeconds: 7200,
    });
    const res = await put("/functions/my-func/event-invoke-config", {
      maximumRetryAttempts: 3,
      maximumEventAgeInSeconds: 7200,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.maximumRetryAttempts).toBe(3);
  });

  it("DELETE /functions/:name/event-invoke-config — resets config", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/functions/my-func/event-invoke-config");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });
});

// ─── Code Signing Config ────────────────────────────────

describe("Code Signing Config", () => {
  it("GET /functions/:name/code-signing-config — returns config", async () => {
    mockSend.mockResolvedValueOnce({
      CodeSigningConfigArn: "arn:aws:lambda:us-east-1::csc:001",
      FunctionName: "my-func",
    });
    const res = await get("/functions/my-func/code-signing-config");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.codeSigningConfigArn).toBe("arn:aws:lambda:us-east-1::csc:001");
  });

  it("GET /functions/:name/code-signing-config — returns empty on error", async () => {
    mockSend.mockRejectedValueOnce(new Error("NotFound"));
    const res = await get("/functions/my-func/code-signing-config");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({});
  });

  it("PUT /functions/:name/code-signing-config — attaches config", async () => {
    mockSend.mockResolvedValueOnce({
      CodeSigningConfigArn: "arn:aws:lambda:us-east-1::csc:001",
      FunctionName: "my-func",
    });
    const res = await put("/functions/my-func/code-signing-config", {
      codeSigningConfigArn: "arn:aws:lambda:us-east-1::csc:001",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.codeSigningConfigArn).toBe("arn:aws:lambda:us-east-1::csc:001");
  });

  it("PUT /functions/:name/code-signing-config — 400 when ARN missing", async () => {
    const res = await put("/functions/my-func/code-signing-config", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /functions/:name/code-signing-config — detaches config", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/functions/my-func/code-signing-config");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it("GET /code-signing-configs — lists configs", async () => {
    mockSend.mockResolvedValueOnce({
      CodeSigningConfigs: [
        {
          CodeSigningConfigArn: "arn:aws:lambda:us-east-1::csc:001",
          Description: "My CSC",
          AllowedPublishers: { SigningProfileVersionArns: ["arn:aws:signer:..."] },
          CodeSigningPolicies: { UntrustedArtifactOnDeployment: "Enforce" },
          LastModified: "2025-01-01",
        },
      ],
    });
    const res = await get("/code-signing-configs");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.codeSigningConfigs[0].arn).toBe("arn:aws:lambda:us-east-1::csc:001");
  });

  it("GET /code-signing-configs — returns empty when none", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/code-signing-configs");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("POST /code-signing-configs — creates config", async () => {
    mockSend.mockResolvedValueOnce({
      CodeSigningConfig: {
        CodeSigningConfigArn: "arn:aws:lambda:us-east-1::csc:002",
        Description: "New CSC",
        AllowedPublishers: { SigningProfileVersionArns: ["arn:aws:signer:..."] },
        CodeSigningPolicies: { UntrustedArtifactOnDeployment: "Enforce" },
        LastModified: "2025-01-01",
      },
    });
    const res = await post("/code-signing-configs", {
      description: "New CSC",
      signingProfileVersionArns: ["arn:aws:signer:..."],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.created).toBe(true);
    expect(body.codeSigningConfig.arn).toBe("arn:aws:lambda:us-east-1::csc:002");
  });

  it("POST /code-signing-configs — 400 when signingProfileVersionArns missing", async () => {
    const res = await post("/code-signing-configs", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /code-signing-configs/:arn — deletes config with encoded ARN", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/code-signing-configs/arn%3Aaws%3Alambda%3Aus-east-1%3A%3Acsc%3A001");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].CodeSigningConfigArn).toBe("arn:aws:lambda:us-east-1::csc:001");
  });
});
