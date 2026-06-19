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

  it("GET /delivery-channels — lists channels", async () => {
    mockSend.mockResolvedValueOnce({ DeliveryChannels: [{ name: "default" }] });
    const res = await get("/delivery-channels");
    const body = await res.json();
    expect(body.total).toBe(1);
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
});
