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
  DescribeStackResourceCommand: createCmd("DescribeStackResourceCommand"),
  DescribeStackEventsCommand: createCmd("DescribeStackEventsCommand"),
  GetTemplateCommand: createCmd("GetTemplateCommand"),
  ValidateTemplateCommand: createCmd("ValidateTemplateCommand"),
  ListExportsCommand: createCmd("ListExportsCommand"),
  CreateChangeSetCommand: createCmd("CreateChangeSetCommand"),
  DescribeChangeSetCommand: createCmd("DescribeChangeSetCommand"),
  ExecuteChangeSetCommand: createCmd("ExecuteChangeSetCommand"),
  DeleteChangeSetCommand: createCmd("DeleteChangeSetCommand"),
  ListChangeSetsCommand: createCmd("ListChangeSetsCommand"),
  ListStackSetsCommand: createCmd("ListStackSetsCommand"),
  CreateStackSetCommand: createCmd("CreateStackSetCommand"),
  DescribeStackSetCommand: createCmd("DescribeStackSetCommand"),
  DeleteStackSetCommand: createCmd("DeleteStackSetCommand"),
  CreateStackInstancesCommand: createCmd("CreateStackInstancesCommand"),
  ListStackInstancesCommand: createCmd("ListStackInstancesCommand"),
  DeleteStackInstancesCommand: createCmd("DeleteStackInstancesCommand"),
  ListStackSetOperationsCommand: createCmd("ListStackSetOperationsCommand"),
  GetStackPolicyCommand: createCmd("GetStackPolicyCommand"),
  SetStackPolicyCommand: createCmd("SetStackPolicyCommand"),
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

async function del(path: string, body?: any) {
  return router.request(path, {
    method: "DELETE",
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

beforeEach(() => {
  mockSend.mockReset();
});

describe("CloudFormation Routes", () => {
  describe("Stacks", () => {
    it("GET /stacks — lists stacks", async () => {
      mockSend.mockResolvedValueOnce({
        StackSummaries: [{ StackName: "my-stack", StackStatus: "CREATE_COMPLETE", CreationTime: new Date("2025-01-01") }],
      });
      const res = await get("/stacks");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /stacks — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ StackSummaries: [] });
      const res = await get("/stacks");
      expect((await res.json()).total).toBe(0);
    });

    it("POST /stacks — creates a stack", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/stacks", { name: "new-stack", templateBody: "{}" });
      expect((await res.json()).created).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateStackCommand");
    });

    it("POST /stacks — creates with templateUrl instead of templateBody", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/stacks", { name: "from-url", templateUrl: "https://example.com/template.yaml" });
      expect((await res.json()).created).toBe(true);
    });

    it("POST /stacks — 400 when name is missing", async () => {
      const res = await post("/stacks", { templateBody: "{}" });
      expect(res.status).toBe(400);
    });

    it("PUT /stacks/:name — updates a stack", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/stacks/my-stack", { templateBody: '{"Resources":{}}' });
      expect((await res.json()).updated).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateStackCommand");
    });

    it("PUT /stacks/:name — 400 when templateBody is invalid JSON", async () => {
      const res = await put("/stacks/my-stack", { templateBody: "not json" });
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("DELETE /stacks/:name — deletes a stack", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/stacks/my-stack");
      expect((await res.json()).deleted).toBe(true);
    });

    it("GET /stacks/:name — returns stack detail", async () => {
      mockSend
        .mockResolvedValueOnce({ Stacks: [{ StackName: "my-stack", StackStatus: "CREATE_COMPLETE" }] })
        .mockResolvedValueOnce({ StackResourceSummaries: [] })
        .mockResolvedValueOnce({ StackEvents: [] });
      const res = await get("/stacks/my-stack");
      expect((await res.json()).stack.name).toBe("my-stack");
    });

    it("GET /stacks/:name — returns null stack when stack not found", async () => {
      mockSend
        .mockResolvedValueOnce({ Stacks: [] })
        .mockResolvedValueOnce({ StackResourceSummaries: [] })
        .mockResolvedValueOnce({ StackEvents: [] });
      const res = await get("/stacks/missing");
      expect((await res.json()).stack).toBeNull();
    });
  });

  describe("Template", () => {
    it("GET /stacks/:name/template — returns template", async () => {
      mockSend.mockResolvedValueOnce({ TemplateBody: "{}" });
      const res = await get("/stacks/my-stack/template");
      expect((await res.json()).template).toBe("{}");
    });

    it("GET /stacks/:name/template — stringifies object template body", async () => {
      mockSend.mockResolvedValueOnce({ TemplateBody: { Resources: {} } });
      const res = await get("/stacks/my-stack/template");
      const body = await res.json();
      expect(typeof body.template).toBe("string");
      expect(JSON.parse(body.template)).toEqual({ Resources: {} });
    });

    it("GET /stacks/:name/template — null when template body is empty", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/stacks/my-stack/template");
      expect((await res.json()).template).toBeNull();
    });

    it("POST /validate-template — validates", async () => {
      mockSend.mockResolvedValueOnce({ Parameters: [] });
      const res = await post("/validate-template", { templateBody: "{}" });
      expect((await res.json()).valid).toBe(true);
    });
  });

  describe("Stack Policy", () => {
    it("GET /stacks/:name/policy — returns policy body", async () => {
      mockSend.mockResolvedValueOnce({ StackPolicyBody: '{"Statement":[]}' });
      const res = await get("/stacks/my-stack/policy");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.name).toBe("my-stack");
      expect(body.policy).toBe('{"Statement":[]}');
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetStackPolicyCommand");
    });

    it("GET /stacks/:name/policy — null when empty (Floci stub)", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/stacks/my-stack/policy");
      expect((await res.json()).policy).toBe(null);
    });

    it("GET /stacks/:name/policy — stringifies non-string body", async () => {
      mockSend.mockResolvedValueOnce({ StackPolicyBody: { Statement: [] } });
      const res = await get("/stacks/my-stack/policy");
      expect((await res.json()).policy).toBe(JSON.stringify({ Statement: [] }, null, 2));
    });

    it("PUT /stacks/:name/policy — sets policy", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/stacks/my-stack/policy", { policyBody: '{"Statement":[]}' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("SetStackPolicyCommand");
    });

    it("PUT /stacks/:name/policy — 400 when policyBody missing", async () => {
      const res = await put("/stacks/my-stack/policy", {});
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("PUT /stacks/:name/policy — 400 when policyBody invalid JSON", async () => {
      const res = await put("/stacks/my-stack/policy", { policyBody: "not json" });
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("Change Sets", () => {
    it("GET /stacks/:name/change-sets — lists", async () => {
      mockSend.mockResolvedValueOnce({ Summaries: [{ ChangeSetName: "my-cs" }] });
      const res = await get("/stacks/my-stack/change-sets");
      expect((await res.json()).total).toBe(1);
    });

    it("POST /change-sets — creates", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/change-sets", { stackName: "s", changeSetName: "cs", templateBody: "{}" });
      expect((await res.json()).created).toBe(true);
    });

    it("POST /change-sets — with explicit changeSetType", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/change-sets", {
        stackName: "s", changeSetName: "cs", templateBody: "{}",
        changeSetType: "UPDATE",
      });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].ChangeSetType).toBe("UPDATE");
    });

    it("POST /change-sets — 400 when templateBody is invalid JSON", async () => {
      const res = await post("/change-sets", { stackName: "s", changeSetName: "cs", templateBody: "not json" });
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("POST /change-sets/execute — executes", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/change-sets/execute", { stackName: "s", changeSetName: "cs" });
      expect((await res.json()).executed).toBe(true);
    });

    it("DELETE /change-sets — deletes", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await router.request("/change-sets?name=cs&stack=s", { method: "DELETE" });
      expect((await res.json()).deleted).toBe(true);
    });

    it("GET /stacks/:name/change-sets/:csName — describes", async () => {
      mockSend.mockResolvedValueOnce({
        ChangeSetName: "my-cs", ExecutionStatus: "AVAILABLE", Changes: [], Parameters: [],
      });
      const res = await get("/stacks/s/change-sets/my-cs");
      expect((await res.json()).changeSet.name).toBe("my-cs");
    });

    it("GET /stacks/:name/change-sets/:csName — 404", async () => {
      const err = Object.assign(new Error("x"), { name: "ChangeSetNotFoundException" });
      mockSend.mockRejectedValueOnce(err);
      const res = await get("/stacks/s/change-sets/x");
      expect(res.status).toBe(404);
    });

    it("GET /stacks/:name/change-sets/:csName — with changes and details", async () => {
      mockSend.mockResolvedValueOnce({
        ChangeSetName: "my-cs",
        ExecutionStatus: "AVAILABLE",
        Parameters: [{ ParameterKey: "Env", ParameterValue: "prod", UsePreviousValue: false }],
        Changes: [
          {
            Type: "Resource",
            ResourceChange: {
              Action: "Add",
              LogicalResourceId: "MyBucket",
              PhysicalResourceId: "",
              ResourceType: "AWS::S3::Bucket",
              Replacement: "False",
              Scope: ["Properties"],
              Details: [
                {
                  Target: {
                    Attribute: "BucketName",
                    Name: "BucketName",
                    RequiresRecreation: "Never",
                  },
                  Evaluation: "Static",
                  ChangeSource: "ResourceReference",
                },
              ],
            },
          },
        ],
      });
      const res = await get("/stacks/s/change-sets/my-cs");
      const body = await res.json();
      expect(body.changeSet.changes).toHaveLength(1);
      expect(body.changeSet.changes[0].type).toBe("Resource");
      expect(body.changeSet.changes[0].resourceChange.action).toBe("Add");
      expect(body.changeSet.changes[0].resourceChange.details[0].target.attribute).toBe("BucketName");
      expect(body.changeSet.changes[0].resourceChange.details[0].evaluation).toBe("Static");
    });

    it("GET /stacks/:name/change-sets/:csName — with null ResourceChange and null Target", async () => {
      mockSend.mockResolvedValueOnce({
        ChangeSetName: "my-cs",
        ExecutionStatus: "AVAILABLE",
        Parameters: [],
        Changes: [
          { Type: "Resource", ResourceChange: null },
          { Type: "Resource", ResourceChange: { Action: "Modify", LogicalResourceId: "X", Details: [{ Target: null, Evaluation: "Dynamic" }] } },
        ],
      });
      const res = await get("/stacks/s/change-sets/my-cs");
      const body = await res.json();
      expect(body.changeSet.changes).toHaveLength(2);
      expect(body.changeSet.changes[0].resourceChange).toBeNull();
      expect(body.changeSet.changes[1].resourceChange.details[0].target).toBeNull();
    });

    it("GET /stacks/:name/change-sets/:csName — throws non-ChangeSetNotFoundException", async () => {
      const err = new Error("Access denied");
      err.name = "AccessDeniedException";
      mockSend.mockRejectedValueOnce(err);
      const res = await get("/stacks/s/change-sets/x");
      expect(res.status).toBe(500);
    });

    it("DELETE /change-sets — 400 when params missing", async () => {
      expect((await router.request("/change-sets", { method: "DELETE" })).status).toBe(400);
    });
  });

  describe("Exports", () => {
    it("GET /exports — lists exports", async () => {
      mockSend.mockResolvedValueOnce({ Exports: [{ Name: "e", Value: "v", ExportingStackId: "arn" }] });
      const res = await get("/exports");
      expect((await res.json()).total).toBe(1);
    });
  });

  describe("Stack Sets", () => {
    it("GET /stacksets — lists stack sets", async () => {
      mockSend.mockResolvedValueOnce({
        Summaries: [{ StackSetId: "ss-1", StackSetName: "my-ss", Status: "ACTIVE" }],
      });
      const res = await get("/stacksets");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.stackSets[0].name).toBe("my-ss");
    });

    it("POST /stacksets — creates a stack set", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/stacksets", { name: "my-ss", templateBody: "{}" });
      expect((await res.json()).created).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateStackSetCommand");
    });

    it("POST /stacksets — 400 when name is missing", async () => {
      expect((await post("/stacksets", { templateBody: "{}" })).status).toBe(400);
    });

    it("POST /stacksets — 400 when templateBody is invalid JSON", async () => {
      const res = await post("/stacksets", { name: "my-ss", templateBody: "not json" });
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("POST /stacksets — uses default permission model", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/stacksets", { name: "my-ss", templateBody: "{}" });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].PermissionModel).toBe("SELF_MANAGED");
    });

    it("GET /stacksets/:name — returns stack set with instances and operations", async () => {
      mockSend
        .mockResolvedValueOnce({ StackSet: { StackSetName: "my-ss", Status: "ACTIVE" } })
        .mockResolvedValueOnce({ Summaries: [{ Account: "123", Region: "us-east-1" }] })
        .mockResolvedValueOnce({ Summaries: [{ OperationId: "op-1", Action: "CREATE", Status: "SUCCEEDED" }] });
      const res = await get("/stacksets/my-ss");
      const body = await res.json();
      expect(body.stackSet.name).toBe("my-ss");
      expect(body.instances).toHaveLength(1);
      expect(body.operations).toHaveLength(1);
    });

    it("DELETE /stacksets/:name — deletes a stack set", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/stacksets/my-ss");
      expect((await res.json()).deleted).toBe(true);
    });

    it("POST /stacksets/:name/instances — creates instances", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/stacksets/my-ss/instances", {
        accounts: ["123"], regions: ["us-east-1"],
      });
      expect((await res.json()).instancesCreated).toBe(true);
    });

    it("POST /stacksets/:name/instances — 400 when accounts missing", async () => {
      expect((await post("/stacksets/my-ss/instances", { regions: ["us-east-1"] })).status).toBe(400);
    });

    it("DELETE /stacksets/:name/instances — deletes instances", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/stacksets/my-ss/instances", {
        accounts: ["123"], regions: ["us-east-1"],
      });
      expect((await res.json()).instancesDeleted).toBe(true);
    });

    it("DELETE /stacksets/:name/instances — defaults retainStacks to false", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/stacksets/my-ss/instances", {
        accounts: ["123"], regions: ["us-east-1"],
      });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].RetainStacks).toBe(false);
    });
  });

  describe("Resource Detail", () => {
    it("GET /stacks/:name/resources/:logicalId — returns resource detail", async () => {
      mockSend.mockResolvedValueOnce({
        StackResourceDetail: {
          LogicalResourceId: "MyBucket",
          PhysicalResourceId: "my-test-bucket",
          ResourceType: "AWS::S3::Bucket",
          ResourceStatus: "CREATE_COMPLETE",
          LastUpdatedTimestamp: new Date("2025-01-01"),
          Metadata: '{"key":"value"}',
          DriftInformation: { StackResourceDriftStatus: "IN_SYNC" },
        },
      });
      const res = await get("/stacks/my-stack/resources/MyBucket");
      const body = await res.json();
      expect(body.resource.logicalId).toBe("MyBucket");
      expect(body.resource.resourceType).toBe("AWS::S3::Bucket");
      expect(body.resource.driftInformation.stackResourceDriftStatus).toBe("IN_SYNC");
    });

    it("GET /stacks/:name/resources/:logicalId — with ModuleInfo and null DriftInformation", async () => {
      mockSend.mockResolvedValueOnce({
        StackResourceDetail: {
          LogicalResourceId: "MyFunction",
          PhysicalResourceId: "my-function",
          ResourceType: "AWS::Lambda::Function",
          ResourceStatus: "CREATE_COMPLETE",
          LastUpdatedTimestamp: new Date("2025-01-01"),
          DriftInformation: null,
          ModuleInfo: {
            TypeHierarchy: "AWS::Serverless::Function",
            LogicalIdHierarchy: "MyStack",
          },
        },
      });
      const res = await get("/stacks/my-stack/resources/MyFunction");
      const body = await res.json();
      expect(body.resource.driftInformation).toBeNull();
      expect(body.resource.moduleInfo.typeHierarchy).toBe("AWS::Serverless::Function");
      expect(body.resource.moduleInfo.logicalIdHierarchy).toBe("MyStack");
    });

    it("GET /stacks/:name/resources/:logicalId — 404 when not found", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/stacks/my-stack/resources/x");
      expect(res.status).toBe(404);
    });
  });
});
