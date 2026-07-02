import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockIoTClient = vi.hoisted(() =>
  vi.fn(function () {
    return { send: mockSend };
  })
);

const mockIoTDataPlaneClient = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-iot", () => ({
  IoTClient: mockIoTClient,
  CreateThingCommand: createCmd("CreateThingCommand"),
  DescribeThingCommand: createCmd("DescribeThingCommand"),
  ListThingsCommand: createCmd("ListThingsCommand"),
  UpdateThingCommand: createCmd("UpdateThingCommand"),
  DeleteThingCommand: createCmd("DeleteThingCommand"),
  CreateKeysAndCertificateCommand: createCmd("CreateKeysAndCertificateCommand"),
  CreateCertificateFromCsrCommand: createCmd("CreateCertificateFromCsrCommand"),
  DescribeCertificateCommand: createCmd("DescribeCertificateCommand"),
  ListCertificatesCommand: createCmd("ListCertificatesCommand"),
  UpdateCertificateCommand: createCmd("UpdateCertificateCommand"),
  DeleteCertificateCommand: createCmd("DeleteCertificateCommand"),
  CreatePolicyCommand: createCmd("CreatePolicyCommand"),
  GetPolicyCommand: createCmd("GetPolicyCommand"),
  ListPoliciesCommand: createCmd("ListPoliciesCommand"),
  DeletePolicyCommand: createCmd("DeletePolicyCommand"),
  CreatePolicyVersionCommand: createCmd("CreatePolicyVersionCommand"),
  GetPolicyVersionCommand: createCmd("GetPolicyVersionCommand"),
  ListPolicyVersionsCommand: createCmd("ListPolicyVersionsCommand"),
  SetDefaultPolicyVersionCommand: createCmd("SetDefaultPolicyVersionCommand"),
  DeletePolicyVersionCommand: createCmd("DeletePolicyVersionCommand"),
  AttachPolicyCommand: createCmd("AttachPolicyCommand"),
  DetachPolicyCommand: createCmd("DetachPolicyCommand"),
  ListAttachedPoliciesCommand: createCmd("ListAttachedPoliciesCommand"),
  ListTargetsForPolicyCommand: createCmd("ListTargetsForPolicyCommand"),
  AttachThingPrincipalCommand: createCmd("AttachThingPrincipalCommand"),
  DetachThingPrincipalCommand: createCmd("DetachThingPrincipalCommand"),
  ListThingPrincipalsCommand: createCmd("ListThingPrincipalsCommand"),
  ListPrincipalThingsCommand: createCmd("ListPrincipalThingsCommand"),
  CreateTopicRuleCommand: createCmd("CreateTopicRuleCommand"),
  GetTopicRuleCommand: createCmd("GetTopicRuleCommand"),
  ListTopicRulesCommand: createCmd("ListTopicRulesCommand"),
  ReplaceTopicRuleCommand: createCmd("ReplaceTopicRuleCommand"),
  DeleteTopicRuleCommand: createCmd("DeleteTopicRuleCommand"),
  EnableTopicRuleCommand: createCmd("EnableTopicRuleCommand"),
  DisableTopicRuleCommand: createCmd("DisableTopicRuleCommand"),
  CreateThingTypeCommand: createCmd("CreateThingTypeCommand"),
  DescribeThingTypeCommand: createCmd("DescribeThingTypeCommand"),
  ListThingTypesCommand: createCmd("ListThingTypesCommand"),
  DeprecateThingTypeCommand: createCmd("DeprecateThingTypeCommand"),
  DeleteThingTypeCommand: createCmd("DeleteThingTypeCommand"),
  DescribeEndpointCommand: createCmd("DescribeEndpointCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
  ListJobExecutionsForThingCommand: createCmd("ListJobExecutionsForThingCommand"),
  DescribeJobExecutionCommand: createCmd("DescribeJobExecutionCommand"),
}));

vi.mock("@aws-sdk/client-iot-data-plane", () => ({
  IoTDataPlaneClient: mockIoTDataPlaneClient,
  GetThingShadowCommand: createCmd("GetThingShadowCommand"),
  UpdateThingShadowCommand: createCmd("UpdateThingShadowCommand"),
  DeleteThingShadowCommand: createCmd("DeleteThingShadowCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./iot";

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
  mockSend.mockReset();
});

describe("IoT Core Routes", () => {
  describe("Endpoint", () => {
    it("GET /endpoint — returns endpoint address", async () => {
      mockSend.mockResolvedValueOnce({ endpointAddress: "abcdef12345-ats.iot.us-east-1.amazonaws.com" });
      const res = await get("/endpoint");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.endpointAddress).toContain("amazonaws.com");
    });
  });

  describe("Things", () => {
    it("GET /things — lists things", async () => {
      mockSend.mockResolvedValueOnce({ things: [{ thingName: "my-device", thingTypeName: "Sensor", thingArn: "arn:..." }] });
      const res = await get("/things");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.things[0].thingName).toBe("my-device");
    });

    it("GET /things — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ things: [] });
      const res = await get("/things");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /things/:thingName — returns thing detail", async () => {
      mockSend.mockResolvedValueOnce({ thingName: "my-device", thingTypeName: "Sensor" });
      const res = await get("/things/my-device");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.thing.thingName).toBe("my-device");
    });

    it("POST /things — creates a thing", async () => {
      mockSend.mockResolvedValueOnce({ thingName: "my-device", thingArn: "arn:...", thingId: "id-123" });
      const res = await post("/things", { thingName: "my-device", thingTypeName: "Sensor" });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.thingName).toBe("my-device");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateThingCommand");
    });

    it("POST /things — requires thingName", async () => {
      const res = await post("/things", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /things/:thingName — deletes a thing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/things/my-device");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Thing Types", () => {
    it("GET /thing-types — lists thing types", async () => {
      mockSend.mockResolvedValueOnce({ thingTypes: [{ thingTypeName: "Sensor", description: "A sensor" }] });
      const res = await get("/thing-types");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("POST /thing-types — creates thing type", async () => {
      mockSend.mockResolvedValueOnce({ thingTypeName: "Sensor", thingTypeArn: "arn:...", thingTypeId: "id-1" });
      const res = await post("/thing-types", { thingTypeName: "Sensor" });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
    });

    it("POST /thing-types — requires thingTypeName", async () => {
      const res = await post("/thing-types", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /thing-types/:thingTypeName — deletes thing type", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/thing-types/Sensor");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });

    it("POST /thing-types/:thingTypeName/deprecate — deprecates thing type", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/thing-types/Sensor/deprecate", { undoDeprecate: false });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deprecated).toBe(true);
    });
  });

  describe("Certificates", () => {
    it("GET /certificates — lists certificates", async () => {
      mockSend.mockResolvedValueOnce({ certificates: [{ certificateId: "cert-123", status: "ACTIVE" }] });
      const res = await get("/certificates");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /certificates — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ certificates: [] });
      const res = await get("/certificates");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("POST /certificates/keys-and-certificate — creates keys and cert", async () => {
      mockSend.mockResolvedValueOnce({ certificateArn: "arn:...", certificateId: "cert-123", certificatePem: "pem...", keyPair: { PublicKey: "pub...", PrivateKey: "priv..." } });
      const res = await post("/certificates/keys-and-certificate");
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.keyPair.PublicKey).toBeTruthy();
    });

    it("POST /certificates/csr — creates cert from CSR", async () => {
      mockSend.mockResolvedValueOnce({ certificateId: "cert-456", certificateArn: "arn:...", certificatePem: "pem..." });
      const res = await post("/certificates/csr", { certificateSigningRequest: "CSR_CONTENT" });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
    });

    it("POST /certificates/csr — requires CSR", async () => {
      const res = await post("/certificates/csr", {});
      expect(res.status).toBe(400);
    });

    it("PUT /certificates/:certificateId — updates cert status", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/certificates/cert-123", { newStatus: "INACTIVE" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
    });

    it("PUT /certificates/:certificateId — requires newStatus", async () => {
      const res = await put("/certificates/cert-123", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /certificates/:certificateId — deletes certificate", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/certificates/cert-123");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Policies", () => {
    it("GET /policies — lists policies", async () => {
      mockSend.mockResolvedValueOnce({ policies: [{ policyName: "MyPolicy", policyArn: "arn:..." }] });
      const res = await get("/policies");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /policies — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ policies: [] });
      const res = await get("/policies");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /policies/:policyName — returns policy detail", async () => {
      mockSend.mockResolvedValueOnce({ policyName: "MyPolicy", policyDocument: "{}" });
      const res = await get("/policies/MyPolicy");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.policy.policyName).toBe("MyPolicy");
    });

    it("POST /policies — creates a policy", async () => {
      mockSend.mockResolvedValueOnce({ policyName: "MyPolicy", policyArn: "arn:..." });
      const res = await post("/policies", { policyName: "MyPolicy", policyDocument: "{}" });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
    });

    it("POST /policies — requires policyName and policyDocument", async () => {
      const res = await post("/policies", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /policies/:policyName — deletes a policy", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/policies/MyPolicy");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Policy Versions", () => {
    it("GET /policies/:policyName/versions — lists versions", async () => {
      mockSend.mockResolvedValueOnce({ policyVersions: [{ versionId: "1", isDefaultVersion: true }] });
      const res = await get("/policies/MyPolicy/versions");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("POST /policies/:policyName/versions — creates version", async () => {
      mockSend.mockResolvedValueOnce({ policyVersion: { versionId: "2" } });
      const res = await post("/policies/MyPolicy/versions", { policyDocument: "{}", setAsDefault: true });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
    });

    it("POST /policies/:policyName/versions — requires policyDocument", async () => {
      const res = await post("/policies/MyPolicy/versions", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /policies/:policyName/versions/:versionId — deletes version", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/policies/MyPolicy/versions/v2");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Topic Rules", () => {
    it("GET /topic-rules — lists rules", async () => {
      mockSend.mockResolvedValueOnce({ rules: [{ ruleName: "my_rule", ruleDisabled: false }] });
      const res = await get("/topic-rules");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /topic-rules — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ rules: [] });
      const res = await get("/topic-rules");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("POST /topic-rules — creates a rule", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/topic-rules", { ruleName: "my_rule", topicRulePayload: { sql: "SELECT * FROM 'device/#'", actions: [] } });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
    });

    it("POST /topic-rules — requires ruleName and topicRulePayload", async () => {
      const res = await post("/topic-rules", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /topic-rules/:ruleName — deletes a rule", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/topic-rules/my_rule");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });

    it("POST /topic-rules/:ruleName/enable — enables a rule", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/topic-rules/my_rule/enable");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.enabled).toBe(true);
    });

    it("POST /topic-rules/:ruleName/disable — disables a rule", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/topic-rules/my_rule/disable");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.disabled).toBe(true);
    });
  });

  describe("Tags", () => {
    it("POST /tags — adds tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tags", { resourceArn: "arn:aws:iot:us-east-1::thing/my-device", tags: [{ key: "env", value: "prod" }] });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tagged).toBe(true);
    });

    it("POST /tags — requires resourceArn and tags", async () => {
      const res = await post("/tags", {});
      expect(res.status).toBe(400);
    });

    it("GET /tags — lists tags", async () => {
      mockSend.mockResolvedValueOnce({ tags: [{ key: "env", value: "prod" }] });
      const res = await get("/tags?resourceArn=arn:aws:iot:us-east-1::thing/my-device");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags).toHaveLength(1);
    });

    it("GET /tags — requires resourceArn", async () => {
      const res = await get("/tags");
      expect(res.status).toBe(400);
    });

    it("DELETE /tags — untags a resource", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/tags?resourceArn=arn:aws:iot:us-east-1::thing/my-device&tagKeys=env,team");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.untagged).toBe(true);
    });

    it("DELETE /tags — requires resourceArn and tagKeys", async () => {
      const res = await del("/tags");
      expect(res.status).toBe(400);
    });
  });

  describe("Thing Principals", () => {
    it("GET /things/:thingName/principals — lists principals", async () => {
      mockSend.mockResolvedValueOnce({ principals: ["arn:aws:iot:...:cert/cert-123"] });
      const res = await get("/things/my-device/principals");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.principals).toHaveLength(1);
    });
  });

  describe("Jobs", () => {
    it("GET /things/:thingName/jobs — lists job executions", async () => {
      mockSend.mockResolvedValueOnce({ executionSummaries: [{ jobId: "job-1", status: "QUEUED" }] });
      const res = await get("/things/my-device/jobs");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.executionSummaries).toHaveLength(1);
    });
  });
});
