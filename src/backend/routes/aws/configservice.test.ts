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
}));

vi.mock("../../clients/aws", () => ({ create: (Ctor: any, extra?: any) => new Ctor(extra) }));

import router from "./configservice";

async function get(p: string) { return router.request(p, { method: "GET" }); }
async function post(p: string, b?: any) {
  return router.request(p, { method: "POST", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
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
