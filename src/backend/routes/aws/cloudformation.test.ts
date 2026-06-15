import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockCFN = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-cloudformation", () => ({
  CloudFormationClient: mockCFN,
  ListStacksCommand: createCmd("ListStacksCommand"),
  DescribeStacksCommand: createCmd("DescribeStacksCommand"),
  CreateStackCommand: createCmd("CreateStackCommand"),
  UpdateStackCommand: createCmd("UpdateStackCommand"),
  DeleteStackCommand: createCmd("DeleteStackCommand"),
  ListStackResourcesCommand: createCmd("ListStackResourcesCommand"),
  DescribeStackResourcesCommand: createCmd("DescribeStackResourcesCommand"),
  DescribeStackEventsCommand: createCmd("DescribeStackEventsCommand"),
  GetTemplateCommand: createCmd("GetTemplateCommand"),
  ValidateTemplateCommand: createCmd("ValidateTemplateCommand"),
  ListExportsCommand: createCmd("ListExportsCommand"),
  CreateChangeSetCommand: createCmd("CreateChangeSetCommand"),
  DescribeChangeSetCommand: createCmd("DescribeChangeSetCommand"),
  ExecuteChangeSetCommand: createCmd("ExecuteChangeSetCommand"),
  DeleteChangeSetCommand: createCmd("DeleteChangeSetCommand"),
  ListChangeSetsCommand: createCmd("ListChangeSetsCommand"),
}));

vi.mock("../../clients/aws", () => ({
  getAwsConfig: () => ({
    endpoint: "http://localhost:4566",
    region: "us-east-1",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  }),
}));

import router from "./cloudformation";

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

describe("CloudFormation Routes", () => {
  describe("Stacks", () => {
    it("GET /stacks — lists stacks", async () => {
      mockSend.mockResolvedValueOnce({
        StackSummaries: [
          { StackName: "my-stack", StackStatus: "CREATE_COMPLETE", CreationTime: new Date("2025-01-01"), Description: "Test stack" },
        ],
      });
      const res = await get("/stacks");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.stacks[0].name).toBe("my-stack");
      expect(body.stacks[0].status).toBe("CREATE_COMPLETE");
    });

    it("GET /stacks — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ StackSummaries: [] });
      const res = await get("/stacks");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("POST /stacks — creates a stack", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/stacks", { name: "new-stack", templateBody: "{\"Resources\":{}}" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateStackCommand");
      expect(mockSend.mock.calls[0][0].StackName).toBe("new-stack");
    });

    it("DELETE /stacks/:name — deletes a stack", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/stacks/my-stack");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteStackCommand");
    });

    it("PUT /stacks/:name — updates a stack", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/stacks/my-stack", { templateBody: "{\"Resources\":{}}" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateStackCommand");
    });

    it("GET /stacks/:name — returns stack detail with resources and events", async () => {
      mockSend
        .mockResolvedValueOnce({
          Stacks: [{ StackName: "my-stack", StackStatus: "CREATE_COMPLETE", CreationTime: new Date("2025-01-01") }],
        })
        .mockResolvedValueOnce({
          StackResourceSummaries: [
            { LogicalResourceId: "MyBucket", ResourceType: "AWS::S3::Bucket", ResourceStatus: "CREATE_COMPLETE", PhysicalResourceId: "my-bucket", LastUpdatedTimestamp: new Date("2025-01-01") },
          ],
        })
        .mockResolvedValueOnce({
          StackEvents: [
            { EventId: "evt-1", Timestamp: new Date("2025-01-01"), LogicalResourceId: "MyBucket", ResourceType: "AWS::S3::Bucket", ResourceStatus: "CREATE_COMPLETE" },
          ],
        });
      const res = await get("/stacks/my-stack");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.stack.name).toBe("my-stack");
      expect(body.resources).toHaveLength(1);
      expect(body.resources[0].logicalId).toBe("MyBucket");
      expect(body.events).toHaveLength(1);
    });
  });

  describe("Template", () => {
    it("GET /stacks/:name/template — returns template body", async () => {
      mockSend.mockResolvedValueOnce({ TemplateBody: "{\"Resources\":{}}" });
      const res = await get("/stacks/my-stack/template");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.template).toBe("{\"Resources\":{}}");
    });

    it("POST /validate-template — validates a template", async () => {
      mockSend.mockResolvedValueOnce({ Description: "Test template", Parameters: [] });
      const res = await post("/validate-template", { templateBody: "{\"Resources\":{}}" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.valid).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("ValidateTemplateCommand");
    });
  });

  describe("Change Sets", () => {
    it("GET /stacks/:name/change-sets — lists change sets", async () => {
      mockSend.mockResolvedValueOnce({
        Summaries: [
          { ChangeSetId: "cs-1", ChangeSetName: "my-cs", ExecutionStatus: "AVAILABLE", CreationTime: new Date("2025-01-01") },
        ],
      });
      const res = await get("/stacks/my-stack/change-sets");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.changeSets[0].name).toBe("my-cs");
    });

    it("POST /change-sets — creates a change set", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/change-sets", { stackName: "my-stack", changeSetName: "my-cs", templateBody: "{}" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateChangeSetCommand");
    });

    it("POST /change-sets/execute — executes a change set", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/change-sets/execute", { stackName: "my-stack", changeSetName: "my-cs" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.executed).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("ExecuteChangeSetCommand");
    });

    it("DELETE /change-sets — deletes a change set", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await router.request("/change-sets?name=my-cs&stack=my-stack", { method: "DELETE" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteChangeSetCommand");
    });
  });

  describe("Exports", () => {
    it("GET /exports — lists exports", async () => {
      mockSend.mockResolvedValueOnce({
        Exports: [
          { Name: "export-1", Value: "value-1", ExportingStackId: "arn:..." },
        ],
      });
      const res = await get("/exports");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.exports[0].name).toBe("export-1");
    });
  });
});
