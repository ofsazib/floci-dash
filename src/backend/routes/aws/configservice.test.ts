import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());
const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) { return { __cmdName: name, ...args }; });
  };
});

vi.mock("@aws-sdk/client-config-service", () => ({
  ConfigServiceClient: vi.fn(function () { return { send: mockSend }; }),
  DescribeConfigRulesCommand: createCmd("DescribeConfigRulesCommand"),
  PutConfigRuleCommand: createCmd("PutConfigRuleCommand"),
  DeleteConfigRuleCommand: createCmd("DeleteConfigRuleCommand"),
  DescribeConfigurationRecordersCommand: createCmd("DescribeConfigurationRecordersCommand"),
  PutConfigurationRecorderCommand: createCmd("PutConfigurationRecorderCommand"),
  StartConfigurationRecorderCommand: createCmd("StartConfigurationRecorderCommand"),
  StopConfigurationRecorderCommand: createCmd("StopConfigurationRecorderCommand"),
  DescribeConfigurationRecorderStatusCommand: createCmd("DescribeConfigurationRecorderStatusCommand"),
  DescribeDeliveryChannelsCommand: createCmd("DescribeDeliveryChannelsCommand"),
  PutDeliveryChannelCommand: createCmd("PutDeliveryChannelCommand"),
  DescribeConformancePacksCommand: createCmd("DescribeConformancePacksCommand"),
  PutConformancePackCommand: createCmd("PutConformancePackCommand"),
  DeleteConformancePackCommand: createCmd("DeleteConformancePackCommand"),
  DescribeConformancePackStatusCommand: createCmd("DescribeConformancePackStatusCommand"),
  DescribeComplianceByConfigRuleCommand: createCmd("DescribeComplianceByConfigRuleCommand"),
  DescribeConfigRuleEvaluationStatusCommand: createCmd("DescribeConfigRuleEvaluationStatusCommand"),
  StartConfigRulesEvaluationCommand: createCmd("StartConfigRulesEvaluationCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
  PutAggregationAuthorizationCommand: createCmd("PutAggregationAuthorizationCommand"),
  DescribeAggregationAuthorizationsCommand: createCmd("DescribeAggregationAuthorizationsCommand"),
  DeleteAggregationAuthorizationCommand: createCmd("DeleteAggregationAuthorizationCommand"),
  DeleteDeliveryChannelCommand: createCmd("DeleteDeliveryChannelCommand"),
  DeleteEvaluationResultsCommand: createCmd("DeleteEvaluationResultsCommand"),
  PutRetentionConfigurationCommand: createCmd("PutRetentionConfigurationCommand"),
  DescribeRetentionConfigurationsCommand: createCmd("DescribeRetentionConfigurationsCommand"),
  DeleteRetentionConfigurationCommand: createCmd("DeleteRetentionConfigurationCommand"),
  DescribeComplianceByResourceCommand: createCmd("DescribeComplianceByResourceCommand"),
  GetComplianceDetailsByConfigRuleCommand: createCmd("GetComplianceDetailsByConfigRuleCommand"),
  GetComplianceDetailsByResourceCommand: createCmd("GetComplianceDetailsByResourceCommand"),
  GetComplianceSummaryByConfigRuleCommand: createCmd("GetComplianceSummaryByConfigRuleCommand"),
  GetComplianceSummaryByResourceTypeCommand: createCmd("GetComplianceSummaryByResourceTypeCommand"),
}));

vi.mock("../../clients/aws", () => ({ create: (Ctor: any, extra?: any) => new Ctor(extra) }));

import router from "./configservice";

async function get(p: string) { return router.request(p, { method: "GET" }); }
async function post(p: string, b?: any) {
  return router.request(p, { method: "POST", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}
async function put(p: string, b?: any) {
  return router.request(p, { method: "PUT", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}
async function delWithBody(p: string, b?: any) {
  return router.request(p, { method: "DELETE", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}
async function del(p: string) { return router.request(p, { method: "DELETE" }); }

beforeEach(() => mockSend.mockReset());

describe("Config Service Routes", () => {
  it("GET /rules — lists rules", async () => {
    mockSend.mockResolvedValueOnce({ ConfigRules: [{ ConfigRuleName: "rule-1", ConfigRuleState: "ACTIVE" }] });
    const res = await get("/rules");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /rules — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/rules");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("POST /rules — creates rule (201)", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/rules", { configRuleName: "rule-1" });
    expect(res.status).toBe(201);
  });

  it("POST /rules — 400 if name missing", async () => {
    const res = await post("/rules", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /rules/:name — deletes rule", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/rules/rule-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it("GET /recorders — lists recorders", async () => {
    mockSend.mockResolvedValueOnce({ ConfigurationRecorders: [{ name: "default", roleARN: "arn:..." }] });
    const res = await get("/recorders");
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /recorders — sparse response defaults to empty array", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/recorders");
    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.recorders).toEqual([]);
  });

  it("POST /recorders — creates recorder (201)", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/recorders", { roleARN: "arn:aws:iam::123:role/config" });
    expect(res.status).toBe(201);
  });

  it("POST /recorders — 400 if roleARN missing", async () => {
    const res = await post("/recorders", {});
    expect(res.status).toBe(400);
  });

  it("POST /recorders/:name/start — starts recorder", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/recorders/default/start");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.started).toBe(true);
  });

  it("POST /recorders/:name/stop — stops recorder", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/recorders/default/stop");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stopped).toBe(true);
  });

  it("GET /recorders/status — lists statuses", async () => {
    mockSend.mockResolvedValueOnce({ ConfigurationRecordersStatus: [{ name: "default", recording: true }] });
    const res = await get("/recorders/status");
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /recorders/status — sparse response defaults to empty array", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/recorders/status");
    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.statuses).toEqual([]);
  });

  it("GET /delivery-channels — lists channels", async () => {
    mockSend.mockResolvedValueOnce({ DeliveryChannels: [{ name: "default" }] });
    const res = await get("/delivery-channels");
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /delivery-channels — sparse response defaults to empty array", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/delivery-channels");
    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.channels).toEqual([]);
  });

  it("POST /delivery-channels — creates channel (201)", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/delivery-channels", { s3BucketName: "my-bucket" });
    expect(res.status).toBe(201);
  });

  it("GET /conformance-packs — lists packs", async () => {
    mockSend.mockResolvedValueOnce({ ConformancePackDetails: [{ ConformancePackName: "pack-1" }] });
    const res = await get("/conformance-packs");
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /conformance-packs — sparse response defaults to empty array", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/conformance-packs");
    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.conformancePacks).toEqual([]);
  });

  it("POST /conformance-packs — creates pack (201)", async () => {
    mockSend.mockResolvedValueOnce({ ConformancePackArn: "arn:..." });
    const res = await post("/conformance-packs", { conformancePackName: "pack-1" });
    expect(res.status).toBe(201);
  });

  it("POST /conformance-packs — 400 if name missing", async () => {
    const res = await post("/conformance-packs", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /conformance-packs/:name — deletes pack", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/conformance-packs/pack-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  // ── Conformance Pack Status ──────────────────────────

  it("GET /conformance-packs/status — lists pack statuses", async () => {
    mockSend.mockResolvedValueOnce({ ConformancePackStatusDetails: [{ ConformancePackName: "pack-1", ConformancePackState: "CREATE_COMPLETE" }] });
    const res = await get("/conformance-packs/status");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /conformance-packs/status — empty", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/conformance-packs/status");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  // ── Compliance & Evaluation ──────────────────────────

  it("GET /rules/compliance — lists compliance", async () => {
    mockSend.mockResolvedValueOnce({ ComplianceByConfigRules: [{ ConfigRuleName: "rule-1", Compliance: { ComplianceType: "COMPLIANT" } }] });
    const res = await get("/rules/compliance");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /rules/compliance — empty", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/rules/compliance");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("GET /rules/evaluation-status — lists eval statuses", async () => {
    mockSend.mockResolvedValueOnce({ ConfigRulesEvaluationStatus: [{ ConfigRuleName: "rule-1", LastStatus: "SUCCEEDED" }] });
    const res = await get("/rules/evaluation-status");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /rules/evaluation-status — empty", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/rules/evaluation-status");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("POST /rules/evaluate — starts evaluation", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/rules/evaluate", { ruleNames: ["rule-1"] });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.started).toBe(true);
  });

  it("POST /rules/evaluate — starts evaluation with no rule names", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/rules/evaluate", {});
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.started).toBe(true);
  });

  describe("Tags", () => {
    it("GET /tags — maps Tags list", async () => {
      mockSend.mockResolvedValueOnce({ Tags: [{ Key: "env", Value: "prod" }] });
      const res = await get("/tags?arn=arn:aws:config:rule-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags).toEqual([{ key: "env", value: "prod" }]);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("ListTagsForResourceCommand");
      expect(cmd.ResourceArn).toBe("arn:aws:config:rule-1");
    });

    it("GET /tags — sparse response falls back to []", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/tags?arn=arn:x");
      const body = await res.json();
      expect(body.tags).toEqual([]);
    });

    it("GET /tags — 400 without arn", async () => {
      const res = await get("/tags");
      expect(res.status).toBe(400);
    });

    it("POST /tags — sends TagResourceCommand", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tags", { arn: "arn:x", tags: { env: "prod", team: "cfg" } });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tagged).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("TagResourceCommand");
      expect(cmd.Tags).toEqual([
        { Key: "env", Value: "prod" },
        { Key: "team", Value: "cfg" },
      ]);
    });

    it("POST /tags — 400 without arn", async () => {
      const res = await post("/tags", { tags: { a: "b" } });
      expect(res.status).toBe(400);
    });

    it("POST /tags — 400 with empty tags", async () => {
      const res = await post("/tags", { arn: "arn:x", tags: {} });
      expect(res.status).toBe(400);
    });

    it("POST /tags — 400 without tags", async () => {
      const res = await post("/tags", { arn: "arn:x" });
      expect(res.status).toBe(400);
    });

    it("POST /tags/untag — sends UntagResourceCommand", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tags/untag", { arn: "arn:x", tagKeys: ["env"] });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.untagged).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("UntagResourceCommand");
      expect(cmd.TagKeys).toEqual(["env"]);
    });

    it("POST /tags/untag — 400 without arn", async () => {
      const res = await post("/tags/untag", { tagKeys: ["env"] });
      expect(res.status).toBe(400);
    });

    it("POST /tags/untag — 400 with empty tagKeys", async () => {
      const res = await post("/tags/untag", { arn: "arn:x", tagKeys: [] });
      expect(res.status).toBe(400);
    });

    it("POST /tags/untag — 400 without tagKeys", async () => {
      const res = await post("/tags/untag", { arn: "arn:x" });
      expect(res.status).toBe(400);
    });
  });
});

// ── Aggregation Authorizations ──────────────────────────────

describe("Aggregation Authorizations", () => {
  it("GET /aggregation-authorizations — lists authorizations", async () => {
    mockSend.mockResolvedValueOnce({ AggregationAuthorizations: [{ AuthorizedAccountId: "111", AuthorizedAwsRegion: "us-east-1" }] });
    const res = await get("/aggregation-authorizations");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.authorizations[0].AuthorizedAccountId).toBe("111");
  });

  it("GET /aggregation-authorizations — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/aggregation-authorizations");
    const body = await res.json();
    expect(body.authorizations).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("POST /aggregation-authorizations — creates authorization", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/aggregation-authorizations", { authorizedAccountId: "111", authorizedAwsRegion: "us-west-2" });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("PutAggregationAuthorizationCommand");
    expect(mockSend.mock.calls[0][0].AuthorizedAccountId).toBe("111");
    expect(mockSend.mock.calls[0][0].AuthorizedAwsRegion).toBe("us-west-2");
  });

  it("POST /aggregation-authorizations — 400 without account id", async () => {
    const res = await post("/aggregation-authorizations", { authorizedAwsRegion: "us-west-2" });
    expect(res.status).toBe(400);
  });

  it("POST /aggregation-authorizations — 400 without region", async () => {
    const res = await post("/aggregation-authorizations", { authorizedAccountId: "111" });
    expect(res.status).toBe(400);
  });

  it("DELETE /aggregation-authorizations — deletes authorization", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await delWithBody("/aggregation-authorizations", { authorizedAccountId: "111", authorizedAwsRegion: "us-west-2" });
    expect(res.status).toBe(200);
    expect((await res.json()).deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteAggregationAuthorizationCommand");
  });

  it("DELETE /aggregation-authorizations — 400 without account id", async () => {
    const res = await delWithBody("/aggregation-authorizations", { authorizedAwsRegion: "us-west-2" });
    expect(res.status).toBe(400);
  });

  it("DELETE /aggregation-authorizations — 400 without region", async () => {
    const res = await delWithBody("/aggregation-authorizations", { authorizedAccountId: "111" });
    expect(res.status).toBe(400);
  });
});

// ── Delivery Channel delete ─────────────────────────────────

describe("Delivery Channel delete", () => {
  it("DELETE /delivery-channels/:name — deletes", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/delivery-channels/default");
    expect(res.status).toBe(200);
    expect((await res.json()).deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteDeliveryChannelCommand");
    expect(mockSend.mock.calls[0][0].DeliveryChannelName).toBe("default");
  });
});

// ── Retention Configurations ────────────────────────────────

describe("Retention Configurations", () => {
  it("GET /retention-configurations — lists configurations", async () => {
    mockSend.mockResolvedValueOnce({ RetentionConfigurations: [{ Name: "default", RetentionPeriodInDays: 30 }] });
    const res = await get("/retention-configurations");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.retentionConfigurations[0].RetentionPeriodInDays).toBe(30);
  });

  it("GET /retention-configurations — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/retention-configurations");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("GET /retention-configurations?name=x — passes ConfigurationName", async () => {
    mockSend.mockResolvedValueOnce({ RetentionConfigurations: [{ Name: "x" }] });
    const res = await get("/retention-configurations?name=x");
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].ConfigurationName).toBe("x");
  });

  it("PUT /retention-configurations — creates configuration", async () => {
    mockSend.mockResolvedValueOnce({ RetentionConfiguration: { Name: "default", RetentionPeriodInDays: 365 } });
    const res = await put("/retention-configurations", { retentionPeriodInDays: 365 });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.created).toBe(true);
    expect(body.retentionConfiguration.RetentionPeriodInDays).toBe(365);
    expect(mockSend.mock.calls[0][0].RetentionPeriodInDays).toBe(365);
  });

  it("PUT /retention-configurations — sparse response returns null configuration", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/retention-configurations", { retentionPeriodInDays: 90 });
    expect(res.status).toBe(201);
    expect((await res.json()).retentionConfiguration).toBe(null);
  });

  it("PUT /retention-configurations — 400 without days", async () => {
    const res = await put("/retention-configurations", {});
    expect(res.status).toBe(400);
  });

  it("PUT /retention-configurations — 400 with non-number days", async () => {
    const res = await put("/retention-configurations", { retentionPeriodInDays: "abc" });
    expect(res.status).toBe(400);
  });

  it("DELETE /retention-configurations/:name — deletes", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/retention-configurations/default");
    expect(res.status).toBe(200);
    expect((await res.json()).deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteRetentionConfigurationCommand");
  });
});

// ── Evaluation Results delete ───────────────────────────────

describe("Evaluation Results delete", () => {
  it("DELETE /rules/:name/evaluation-results — deletes", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/rules/rule-1/evaluation-results");
    expect(res.status).toBe(200);
    expect((await res.json()).deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteEvaluationResultsCommand");
    expect(mockSend.mock.calls[0][0].ConfigRuleName).toBe("rule-1");
  });
});

// ── Compliance ──────────────────────────────────────────────

describe("Compliance routes", () => {
  it("GET /compliance-by-resource — returns compliance items", async () => {
    mockSend.mockResolvedValueOnce({ ComplianceByResources: [{ ResourceId: "i-1", Compliance: { ComplianceType: "COMPLIANT" } }] });
    const res = await get("/compliance-by-resource");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /compliance-by-resource — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/compliance-by-resource");
    const body = await res.json();
    expect(body.compliance).toEqual([]);
  });

  it("GET /compliance-by-resource — passes filters", async () => {
    mockSend.mockResolvedValueOnce({});
    await get("/compliance-by-resource?resourceId=i-1&resourceType=AWS::EC2::Instance&complianceTypes=COMPLIANT,NON_COMPLIANT");
    expect(mockSend.mock.calls[0][0].ResourceId).toBe("i-1");
    expect(mockSend.mock.calls[0][0].ResourceType).toBe("AWS::EC2::Instance");
    expect(mockSend.mock.calls[0][0].ComplianceTypes).toEqual(["COMPLIANT", "NON_COMPLIANT"]);
  });

  it("GET /compliance-details/by-rule/:name — returns evaluation results", async () => {
    mockSend.mockResolvedValueOnce({ EvaluationResults: [{ ComplianceType: "COMPLIANT" }] });
    const res = await get("/compliance-details/by-rule/rule-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(mockSend.mock.calls[0][0].ConfigRuleName).toBe("rule-1");
  });

  it("GET /compliance-details/by-rule/:name — empty results", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/compliance-details/by-rule/rule-1");
    expect((await res.json()).total).toBe(0);
  });

  it("GET /compliance-details/by-rule/:name — passes ComplianceTypes", async () => {
    mockSend.mockResolvedValueOnce({});
    await get("/compliance-details/by-rule/rule-1?complianceTypes=COMPLIANT");
    expect(mockSend.mock.calls[0][0].ComplianceTypes).toEqual(["COMPLIANT"]);
  });

  it("GET /compliance-details/by-resource — returns evaluation results", async () => {
    mockSend.mockResolvedValueOnce({ EvaluationResults: [{ ComplianceType: "NON_COMPLIANT" }] });
    const res = await get("/compliance-details/by-resource?resourceId=i-1&resourceType=AWS::EC2::Instance");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(mockSend.mock.calls[0][0].ResourceId).toBe("i-1");
    expect(mockSend.mock.calls[0][0].ResourceType).toBe("AWS::EC2::Instance");
  });

  it("GET /compliance-details/by-resource — empty results", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/compliance-details/by-resource?resourceId=i-1&resourceType=AWS::EC2::Instance");
    expect((await res.json()).total).toBe(0);
  });

  it("GET /compliance-details/by-resource — 400 without resourceId", async () => {
    const res = await get("/compliance-details/by-resource?resourceType=AWS::EC2::Instance");
    expect(res.status).toBe(400);
  });

  it("GET /compliance-details/by-resource — 400 without resourceType", async () => {
    const res = await get("/compliance-details/by-resource?resourceId=i-1");
    expect(res.status).toBe(400);
  });

  it("GET /compliance-summary/by-config-rule — returns summary", async () => {
    mockSend.mockResolvedValueOnce({ ComplianceSummary: { CompliantConfigRuleCount: 3, NonCompliantConfigRuleCount: 1 } });
    const res = await get("/compliance-summary/by-config-rule");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.complianceSummary.CompliantConfigRuleCount).toBe(3);
  });

  it("GET /compliance-summary/by-config-rule — null when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/compliance-summary/by-config-rule");
    expect((await res.json()).complianceSummary).toBe(null);
  });

  it("GET /compliance-summary/by-resource-type — returns summaries", async () => {
    mockSend.mockResolvedValueOnce({ ComplianceSummariesByResourceType: [{ ResourceType: "AWS::EC2::Instance" }] });
    const res = await get("/compliance-summary/by-resource-type?resourceTypes=AWS::EC2::Instance");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(mockSend.mock.calls[0][0].ResourceTypes).toEqual(["AWS::EC2::Instance"]);
  });

  it("GET /compliance-summary/by-resource-type — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/compliance-summary/by-resource-type");
    const body = await res.json();
    expect(body.summaries).toEqual([]);
    expect(body.total).toBe(0);
  });
});
