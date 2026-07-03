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

    it("GET /endpoint — passes endpointType query param", async () => {
      mockSend.mockResolvedValueOnce({ endpointAddress: "data.iot.us-east-1.amazonaws.com" });
      const res = await get("/endpoint?endpointType=iot:Data-ATS");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.endpointAddress).toContain("amazonaws.com");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DescribeEndpointCommand");
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

    it("PUT /things/:thingName — updates a thing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/things/my-device", { thingTypeName: "Sensor", attributes: { firmware: "1.0" } });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateThingCommand");
    });

    it("PUT /things/:thingName — with removeThingType and removeAttributes", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/things/my-device", { removeThingType: true, attributes: {}, removeAttributes: true });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend.mock.calls[0][0].removeThingType).toBe(true);
    });

    it("PUT /things/:thingName — with attributes and removeAttributes false (merge: true)", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/things/my-device", { attributes: { firmware: "2.0" }, removeAttributes: false });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend.mock.calls[0][0].attributePayload.merge).toBe(true);
    });

    it("PUT /things/:thingName — without attributes (no attributePayload)", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/things/my-device", { thingTypeName: "Sensor" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend.mock.calls[0][0].attributePayload).toBeUndefined();
    });

    it("POST /things — without attributes (no attributePayload)", async () => {
      mockSend.mockResolvedValueOnce({ thingName: "bare-device", thingArn: "arn:...", thingId: "id-456" });
      const res = await post("/things", { thingName: "bare-device" });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(mockSend.mock.calls[0][0].attributePayload).toBeUndefined();
    });

    it("DELETE /things/:thingName — deletes a thing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/things/my-device");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });

    it("DELETE /things/:thingName — with expectedVersion query", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/things/my-device?expectedVersion=2");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].expectedVersion).toBe(2);
    });

    it("GET /things — passes query params", async () => {
      mockSend.mockResolvedValueOnce({ things: [{ thingName: "filtered-device" }], nextToken: "next" });
      const res = await get("/things?thingTypeName=Sensor&maxResults=10&attributeName=firmware&attributeValue=1.0&nextToken=abc");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.things).toHaveLength(1);
      expect(body.nextToken).toBe("next");
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

    it("GET /thing-types/:thingTypeName — returns thing type detail", async () => {
      mockSend.mockResolvedValueOnce({ thingTypeName: "Sensor", thingTypeArn: "arn:...", thingTypeProperties: { thingTypeDescription: "A sensor device" } });
      const res = await get("/thing-types/Sensor");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.thingType.thingTypeName).toBe("Sensor");
      expect(body.thingType.thingTypeProperties.thingTypeDescription).toBe("A sensor device");
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

    it("GET /certificates — with pageSize, marker, and ascendingOrder params", async () => {
      mockSend.mockResolvedValueOnce({ certificates: [], nextMarker: "next-page" });
      const res = await get("/certificates?pageSize=10&marker=abc&ascendingOrder=true");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.nextMarker).toBe("next-page");
      expect(mockSend.mock.calls[0][0].pageSize).toBe(10);
      expect(mockSend.mock.calls[0][0].ascendingOrder).toBe(true);
    });

    it("GET /certificates — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ certificates: [] });
      const res = await get("/certificates");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /certificates/:certificateId — returns certificate detail", async () => {
      mockSend.mockResolvedValueOnce({
        certificateDescription: {
          certificateId: "cert-123",
          certificateArn: "arn:...",
          status: "ACTIVE",
          certificatePem: "pem...",
        }
      });
      const res = await get("/certificates/cert-123");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.certificate.certificateId).toBe("cert-123");
      expect(body.certificate.status).toBe("ACTIVE");
    });

    it("GET /certificates/:certificateId — handles null description", async () => {
      mockSend.mockResolvedValueOnce({ certificateDescription: null });
      const res = await get("/certificates/cert-123");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.certificate).toBeNull();
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

    it("DELETE /certificates/:certificateId — with forceDelete flag", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/certificates/cert-123?forceDelete=true");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].forceDelete).toBe(true);
    });

    it("DELETE /certificates/:certificateId — with forceDelete=false", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/certificates/cert-123?forceDelete=false");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].forceDelete).toBe(false);
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

    it("GET /policies/:policyName/versions/:versionId — returns version detail", async () => {
      mockSend.mockResolvedValueOnce({
        policyVersion: { versionId: "1", policyDocument: "{}", isDefaultVersion: true },
        policyName: "MyPolicy",
      });
      const res = await get("/policies/MyPolicy/versions/1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.policyVersion.policyName).toBe("MyPolicy");
    });

    it("PUT /policies/:policyName/versions/:versionId/set-default — sets default version", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/policies/MyPolicy/versions/2/set-default");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("SetDefaultPolicyVersionCommand");
    });

    it("DELETE /policies/:policyName/versions/:versionId — deletes version", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/policies/MyPolicy/versions/v2");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });

    it("POST /policies — accepts policyDocument as JSON object", async () => {
      mockSend.mockResolvedValueOnce({ policyName: "MyPolicy", policyArn: "arn:..." });
      const doc = { Version: "2012-10-17", Statement: [{ Effect: "Allow", Action: "iot:*", Resource: "*" }] };
      const res = await post("/policies", { policyName: "MyPolicy", policyDocument: doc });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreatePolicyCommand");
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

    it("POST /topic-rules — with all optional fields (tags, awsIotSqlVersion, errorAction)", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/topic-rules", {
        ruleName: "full_rule",
        topicRulePayload: {
          sql: "SELECT * FROM 'device/#'",
          description: "Full rule",
          actions: [{ lambda: { functionArn: "arn:..." } }],
          ruleDisabled: false,
          awsIotSqlVersion: "2016-03-23",
          errorAction: { republish: { topic: "errors", roleArn: "arn:..." } },
        },
        tags: "env=prod",
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateTopicRuleCommand");
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

  describe("Topic Rules — Detail & Replace", () => {
    it("GET /topic-rules/:ruleName — returns rule detail", async () => {
      mockSend.mockResolvedValueOnce({
        rule: { ruleName: "my_rule", sql: "SELECT * FROM 'device/#'", description: "My rule", ruleDisabled: false, actions: [] },
        ruleArn: "arn:aws:iot:...:rule/my_rule",
      });
      const res = await get("/topic-rules/my_rule");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.rule.ruleName).toBe("my_rule");
      expect(body.ruleArn).toContain("arn:");
    });

    it("PUT /topic-rules/:ruleName — replaces a rule", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/topic-rules/my_rule", {
        topicRulePayload: { sql: "SELECT * FROM 'device/updated'", actions: [], description: "Updated rule" },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("ReplaceTopicRuleCommand");
    });

    it("PUT /topic-rules/:ruleName — requires topicRulePayload", async () => {
      const res = await put("/topic-rules/my_rule", {});
      expect(res.status).toBe(400);
    });
  });

  describe("Shadows (Data Plane)", () => {
    it("GET /things/:thingName/shadow — retrieves shadow", async () => {
      const shadowPayload = { state: { reported: { temp: 25 } }, timestamp: 1234567890 };
      const encoded = new TextEncoder().encode(JSON.stringify(shadowPayload));
      mockSend.mockResolvedValueOnce({ payload: encoded });
      const res = await get("/things/my-device/shadow");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.shadow.state.reported.temp).toBe(25);
    });

    it("GET /things/:thingName/shadow — handles null payload", async () => {
      mockSend.mockResolvedValueOnce({ payload: null });
      const res = await get("/things/my-device/shadow");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.shadow).toBeNull();
    });

    it("POST /things/:thingName/shadow — updates shadow", async () => {
      const responsePayload = { state: { reported: { temp: 30 } }, timestamp: 1234567891 };
      const encoded = new TextEncoder().encode(JSON.stringify(responsePayload));
      mockSend.mockResolvedValueOnce({ payload: encoded });
      const res = await post("/things/my-device/shadow", { state: { reported: { temp: 30 } } });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(body.shadow.state.reported.temp).toBe(30);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateThingShadowCommand");
    });

    it("POST /things/:thingName/shadow — wraps bare state in {state: ...}", async () => {
      const responsePayload = { state: { desired: { led: "on" } }, timestamp: 1234567892 };
      const encoded = new TextEncoder().encode(JSON.stringify(responsePayload));
      mockSend.mockResolvedValueOnce({ payload: encoded });
      const res = await post("/things/my-device/shadow", { desired: { led: "on" } });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(body.shadow.state.desired.led).toBe("on");
    });

    it("POST /things/:thingName/shadow — handles null response payload", async () => {
      mockSend.mockResolvedValueOnce({ payload: null });
      const res = await post("/things/my-device/shadow", { state: { reported: { temp: 35 } } });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.shadow).toBeNull();
      expect(body.updated).toBe(true);
    });

    it("DELETE /things/:thingName/shadow — deletes shadow", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/things/my-device/shadow");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteThingShadowCommand");
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

  describe("Policy Attachments", () => {
    it("GET /policies/:policyName/targets — lists targets for policy", async () => {
      mockSend.mockResolvedValueOnce({ targets: ["arn:aws:iot:...:cert/cert-123"] });
      const res = await get("/policies/MyPolicy/targets");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.targets).toHaveLength(1);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListTargetsForPolicyCommand");
    });

    it("GET /targets/:target/attached-policies — lists attached policies", async () => {
      mockSend.mockResolvedValueOnce({ policies: [{ policyName: "MyPolicy", policyArn: "arn:..." }] });
      const target = encodeURIComponent("arn:aws:iot:us-east-1:123456789012:cert/cert-123");
      const res = await get(`/targets/${target}/attached-policies`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.policies).toHaveLength(1);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListAttachedPoliciesCommand");
    });

    it("POST /policies/:policyName/attach — attaches policy to target", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/policies/MyPolicy/attach", { target: "arn:aws:iot:...:cert/cert-123" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.attached).toBe(true);
    });

    it("POST /policies/:policyName/attach — requires target", async () => {
      const res = await post("/policies/MyPolicy/attach", {});
      expect(res.status).toBe(400);
    });

    it("POST /policies/:policyName/detach — detaches policy from target", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/policies/MyPolicy/detach", { target: "arn:aws:iot:...:cert/cert-123" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.detached).toBe(true);
    });

    it("POST /policies/:policyName/detach — requires target", async () => {
      const res = await post("/policies/MyPolicy/detach", {});
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

    it("POST /things/:thingName/principals — attaches principal", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/things/my-device/principals", { principal: "arn:aws:iot:...:cert/cert-123" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.attached).toBe(true);
    });

    it("POST /things/:thingName/principals — requires principal", async () => {
      const res = await post("/things/my-device/principals", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /things/:thingName/principals — detaches principal", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/things/my-device/principals?principal=arn:aws:iot:...:cert/cert-123");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.detached).toBe(true);
    });

    it("DELETE /things/:thingName/principals — requires principal query param", async () => {
      const res = await del("/things/my-device/principals");
      expect(res.status).toBe(400);
    });
  });

  describe("Jobs", () => {
    it("GET /things/:thingName/jobs — lists job executions", async () => {
      mockSend.mockResolvedValueOnce({ executionSummaries: [{ jobId: "job-1", status: "QUEUED" }] });
      const res = await get("/things/my-device/jobs");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.executionSummaries).toHaveLength(1);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListJobExecutionsForThingCommand");
    });

    it("GET /things/:thingName/jobs/:jobId — returns job execution detail", async () => {
      mockSend.mockResolvedValueOnce({
        execution: { jobId: "job-1", thingName: "my-device", status: "QUEUED", queuedAt: new Date().toISOString() },
      });
      const res = await get("/things/my-device/jobs/job-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.execution.jobId).toBe("job-1");
      expect(body.execution.status).toBe("QUEUED");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DescribeJobExecutionCommand");
    });

    it("GET /things/:thingName/jobs/:jobId — handles null execution", async () => {
      mockSend.mockResolvedValueOnce({ execution: null });
      const res = await get("/things/my-device/jobs/job-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.execution).toBeNull();
    });
  });

  describe("CSR Edge Cases", () => {
    it("POST /certificates/csr — with setAsActive: false", async () => {
      mockSend.mockResolvedValueOnce({ certificateId: "cert-csr-1", certificateArn: "arn:...", certificatePem: "pem..." });
      const res = await post("/certificates/csr", {
        certificateSigningRequest: "CSR_CONTENT",
        setAsActive: false,
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.certificateId).toBe("cert-csr-1");
      expect(mockSend.mock.calls[0][0].setAsActive).toBe(false);
    });
  });
});
