import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockSend, createCmd } = vi.hoisted(() => {
  const mockSend = vi.fn();
  const createCmd = (name: string) => function (this: any, input: any) { return { __cmd: name, ...(input || {}) }; };
  return { mockSend, createCmd };
});

vi.mock("../../clients/aws", () => ({
  create: vi.fn(() => ({ send: mockSend })),
}));

vi.mock("@aws-sdk/client-controltower", () => ({
  ControlTowerClient: class {},
  CreateLandingZoneCommand: createCmd("CreateLandingZoneCommand"),
  DeleteLandingZoneCommand: createCmd("DeleteLandingZoneCommand"),
  EnableBaselineCommand: createCmd("EnableBaselineCommand"),
  GetBaselineOperationCommand: createCmd("GetBaselineOperationCommand"),
  GetEnabledBaselineCommand: createCmd("GetEnabledBaselineCommand"),
  GetLandingZoneCommand: createCmd("GetLandingZoneCommand"),
  GetLandingZoneOperationCommand: createCmd("GetLandingZoneOperationCommand"),
  ListBaselinesCommand: createCmd("ListBaselinesCommand"),
  ListEnabledBaselinesCommand: createCmd("ListEnabledBaselinesCommand"),
  ListLandingZoneOperationsCommand: createCmd("ListLandingZoneOperationsCommand"),
  ListLandingZonesCommand: createCmd("ListLandingZonesCommand"),
  ResetEnabledBaselineCommand: createCmd("ResetEnabledBaselineCommand"),
  ResetLandingZoneCommand: createCmd("ResetLandingZoneCommand"),
  UpdateEnabledBaselineCommand: createCmd("UpdateEnabledBaselineCommand"),
  UpdateLandingZoneCommand: createCmd("UpdateLandingZoneCommand"),
  EnableControlCommand: createCmd("EnableControlCommand"),
  ListEnabledControlsCommand: createCmd("ListEnabledControlsCommand"),
  GetEnabledControlCommand: createCmd("GetEnabledControlCommand"),
  UpdateEnabledControlCommand: createCmd("UpdateEnabledControlCommand"),
  ResetEnabledControlCommand: createCmd("ResetEnabledControlCommand"),
  GetControlOperationCommand: createCmd("GetControlOperationCommand"),
}));

import controltowerRoutes from "./controltower";
import { Hono } from "hono";

const app = new Hono();
app.route("/", controltowerRoutes);

const get = (path: string) => app.request(path);
const post = (path: string, json?: any) =>
  app.request(path, json === undefined ? { method: "POST" } : { method: "POST", body: JSON.stringify(json), headers: { "content-type": "application/json" } });
const put = (path: string, json?: any) =>
  app.request(path, json === undefined ? { method: "PUT" } : { method: "PUT", body: JSON.stringify(json), headers: { "content-type": "application/json" } });
const del = (path: string) => app.request(path, { method: "DELETE" });

const LZ_ARN = "arn:aws:controltower:us-east-1:111111111111:landingzone/FLOCISEEDEDLZ1";
const manifest = { govern: { accounts: [] } };

beforeEach(() => {
  mockSend.mockReset();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("controltower — landing zones", () => {
  it("GET /landing-zones hydrates each arn with GetLandingZone", async () => {
    mockSend.mockImplementation((cmd: any) => {
      if (cmd.__cmd === "ListLandingZonesCommand") {
        return Promise.resolve({ landingZones: [{ arn: LZ_ARN }] });
      }
      return Promise.resolve({
        landingZone: {
          arn: LZ_ARN,
          version: "4.0",
          latestAvailableVersion: "4.0",
          status: "ACTIVE",
          driftStatus: { status: "IN_SYNC" },
          manifest,
          remediationTypes: ["INHERITANCE_DRIFT"],
        },
      });
    });
    const res = await get("/landing-zones");
    expect(res.status).toBe(200);
    const b = await res.json();
    expect(b.total).toBe(1);
    expect(b.landingZones[0]).toEqual({
      arn: LZ_ARN,
      version: "4.0",
      latestAvailableVersion: "4.0",
      status: "ACTIVE",
      driftStatus: "IN_SYNC",
      manifest,
      remediationTypes: ["INHERITANCE_DRIFT"],
    });
  });

  it("GET /landing-zones fills defaults when detail is sparse", async () => {
    mockSend.mockImplementation((cmd: any) => {
      if (cmd.__cmd === "ListLandingZonesCommand") {
        return Promise.resolve({ landingZones: [{ arn: LZ_ARN }] });
      }
      return Promise.resolve({});
    });
    const b = await (await get("/landing-zones")).json();
    expect(b.landingZones[0]).toEqual({
      arn: LZ_ARN,
      version: null,
      latestAvailableVersion: null,
      status: null,
      driftStatus: null,
      manifest: null,
      remediationTypes: [],
    });
  });

  it("GET /landing-zones handles undefined list", async () => {
    mockSend.mockResolvedValueOnce({});
    const b = await (await get("/landing-zones")).json();
    expect(b.landingZones).toEqual([]);
    expect(b.total).toBe(0);
  });

  it("POST /landing-zones creates with manifest object passthrough", async () => {
    mockSend.mockResolvedValueOnce({ arn: LZ_ARN, operationIdentifier: "op-1" });
    const res = await post("/landing-zones", { manifest, version: "4.0", tags: { env: "dev" } });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ arn: LZ_ARN, operationIdentifier: "op-1" });
    expect(mockSend.mock.calls[0][0]).toMatchObject({ manifest, version: "4.0", tags: { env: "dev" } });
  });

  it("POST /landing-zones parses manifest from a JSON string", async () => {
    mockSend.mockResolvedValueOnce({ arn: LZ_ARN, operationIdentifier: "op-1" });
    await post("/landing-zones", { manifest: JSON.stringify(manifest), version: "4.0" });
    expect(mockSend.mock.calls[0][0].manifest).toEqual(manifest);
    expect(mockSend.mock.calls[0][0].tags).toBeUndefined();
  });

  it("POST /landing-zones 400 without manifest", async () => {
    expect((await post("/landing-zones", { version: "4.0" })).status).toBe(400);
    expect((await post("/landing-zones", { manifest: "", version: "4.0" })).status).toBe(400);
    const res = await post("/landing-zones", { version: "4.0" });
    expect(await res.json()).toEqual({ error: "manifest is required" });
  });

  it("POST /landing-zones 400 with invalid manifest JSON", async () => {
    expect((await post("/landing-zones", { manifest: "{nope", version: "4.0" })).status).toBe(400);
    expect((await post("/landing-zones", { manifest: "[1,2]", version: "4.0" })).status).toBe(400);
    expect((await post("/landing-zones", { manifest: '"text"', version: "4.0" })).status).toBe(400);
  });

  it("POST /landing-zones 400 without version", async () => {
    expect((await post("/landing-zones", { manifest })).status).toBe(400);
  });

  it("POST /landing-zones tolerates invalid body", async () => {
    const res = await app.request("/landing-zones", { method: "POST", body: "not-json", headers: { "content-type": "application/json" } });
    expect(res.status).toBe(400);
  });

  it("PUT /landing-zones/update sends manifest and remediation flag", async () => {
    mockSend.mockResolvedValueOnce({ operationIdentifier: "op-2" });
    const res = await put("/landing-zones/update", {
      landingZoneIdentifier: LZ_ARN,
      version: "4.0",
      manifest: JSON.stringify(manifest),
      remediationTypes: ["INHERITANCE_DRIFT"],
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ operationIdentifier: "op-2" });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      landingZoneIdentifier: LZ_ARN,
      version: "4.0",
      manifest,
      remediationTypes: ["INHERITANCE_DRIFT"],
    });
  });

  it("PUT /landing-zones/update omits remediationTypes when unset", async () => {
    mockSend.mockResolvedValueOnce({ operationIdentifier: "op-2" });
    await put("/landing-zones/update", { landingZoneIdentifier: LZ_ARN, version: "4.0", manifest });
    expect(mockSend.mock.calls[0][0].remediationTypes).toBeUndefined();
  });

  it("PUT /landing-zones/update 400s on missing fields", async () => {
    expect((await put("/landing-zones/update", { version: "4.0", manifest })).status).toBe(400);
    expect((await put("/landing-zones/update", { landingZoneIdentifier: LZ_ARN, manifest })).status).toBe(400);
    expect((await put("/landing-zones/update", { landingZoneIdentifier: LZ_ARN, version: "4.0" })).status).toBe(400);
    expect((await put("/landing-zones/update", { landingZoneIdentifier: LZ_ARN, version: "4.0", manifest: "bad" })).status).toBe(400);
  });

  it("POST /landing-zones/reset resets", async () => {
    mockSend.mockResolvedValueOnce({ operationIdentifier: "op-3" });
    const res = await post("/landing-zones/reset", { landingZoneIdentifier: LZ_ARN });
    expect(await res.json()).toEqual({ operationIdentifier: "op-3" });
    expect((await post("/landing-zones/reset", {})).status).toBe(400);
  });

  it("DELETE /landing-zones deletes by identifier", async () => {
    mockSend.mockResolvedValueOnce({ operationIdentifier: "op-4" });
    const res = await del(`/landing-zones?identifier=${encodeURIComponent(LZ_ARN)}`);
    expect(await res.json()).toEqual({ operationIdentifier: "op-4" });
    expect(mockSend.mock.calls[0][0]).toMatchObject({ landingZoneIdentifier: LZ_ARN });
    expect((await del("/landing-zones")).status).toBe(400);
  });
});

describe("controltower — operations", () => {
  it("GET /operations maps fields", async () => {
    mockSend.mockResolvedValueOnce({
      landingZoneOperations: [{ operationIdentifier: "op-1", operationType: "CREATE", status: "SUCCEEDED" }],
    });
    const b = await (await get("/operations")).json();
    expect(b.total).toBe(1);
    expect(b.operations[0]).toMatchObject({ operationIdentifier: "op-1", operationType: "CREATE" });
  });

  it("GET /operations handles undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/operations")).json()).operations).toEqual([]);
  });

  it("GET /operations/detail returns operation", async () => {
    mockSend.mockResolvedValueOnce({
      operationDetails: { operationIdentifier: "op-1", operationType: "CREATE", status: "SUCCEEDED", startTime: "t1", endTime: "t2" },
    });
    const b = await (await get("/operations/detail?identifier=op-1")).json();
    expect(b.operation).toMatchObject({ operationIdentifier: "op-1", status: "SUCCEEDED" });
    expect((await get("/operations/detail")).status).toBe(400);
  });
});

describe("controltower — baselines", () => {
  it("GET /baselines maps fields", async () => {
    mockSend.mockResolvedValueOnce({
      baselines: [{ arn: "arn:baseline/1", name: "AWSControlTowerBaseline", description: "desc" }],
    });
    const b = await (await get("/baselines")).json();
    expect(b.total).toBe(1);
    expect(b.baselines[0]).toMatchObject({ name: "AWSControlTowerBaseline" });
  });

  it("GET /baselines handles undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/baselines")).json()).baselines).toEqual([]);
  });
});

describe("controltower — enabled baselines", () => {
  it("GET /enabled-baselines maps statusSummary", async () => {
    mockSend.mockResolvedValueOnce({
      enabledBaselines: [{
        arn: "arn:enabledbaseline/1",
        baselineIdentifier: "arn:baseline/1",
        baselineVersion: "1.0",
        targetIdentifier: "arn:ou/x",
        statusSummary: { status: "SUCCEEDED" },
        parentIdentifier: "arn:parent",
      }],
    });
    const b = await (await get("/enabled-baselines")).json();
    expect(b.total).toBe(1);
    expect(b.enabledBaselines[0]).toMatchObject({ status: "SUCCEEDED", parentIdentifier: "arn:parent" });
  });

  it("GET /enabled-baselines handles undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/enabled-baselines")).json()).enabledBaselines).toEqual([]);
  });

  it("GET /enabled-baselines/detail returns details", async () => {
    mockSend.mockResolvedValueOnce({
      enabledBaselineDetails: {
        arn: "arn:enabledbaseline/1",
        baselineIdentifier: "arn:baseline/1",
        baselineVersion: "1.0",
        targetIdentifier: "arn:ou/x",
        statusSummary: { status: "SUCCEEDED" },
        parameters: [{ key: "k", value: "v" }],
      },
    });
    const b = await (await get("/enabled-baselines/detail?identifier=arn:enabledbaseline/1")).json();
    expect(b.enabledBaseline).toMatchObject({ status: "SUCCEEDED", parameters: [{ key: "k" }] });
    expect((await get("/enabled-baselines/detail")).status).toBe(400);
  });

  it("POST /enabled-baselines/enable enables with parameters array", async () => {
    mockSend.mockResolvedValueOnce({ operationIdentifier: "op-5", arn: "arn:enabledbaseline/2" });
    const res = await post("/enabled-baselines/enable", {
      baselineIdentifier: "arn:baseline/1",
      baselineVersion: "1.0",
      targetIdentifier: "arn:ou/x",
      parameters: [{ key: "k", value: "v" }],
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ operationIdentifier: "op-5", arn: "arn:enabledbaseline/2" });
    expect(mockSend.mock.calls[0][0]).toMatchObject({ baselineIdentifier: "arn:baseline/1" });
  });

  it("POST /enabled-baselines/enable parses parameters from JSON string", async () => {
    mockSend.mockResolvedValueOnce({ operationIdentifier: "op-5", arn: "arn:enabledbaseline/2" });
    await post("/enabled-baselines/enable", {
      baselineIdentifier: "arn:baseline/1",
      baselineVersion: "1.0",
      targetIdentifier: "arn:ou/x",
      parameters: '[{"key":"k","value":1}]',
    });
    expect(mockSend.mock.calls[0][0].parameters).toEqual([{ key: "k", value: 1 }]);
  });

  it("POST /enabled-baselines/enable omits empty parameters", async () => {
    mockSend.mockResolvedValueOnce({ operationIdentifier: "op-5", arn: "arn:enabledbaseline/2" });
    await post("/enabled-baselines/enable", {
      baselineIdentifier: "arn:baseline/1",
      baselineVersion: "1.0",
      targetIdentifier: "arn:ou/x",
    });
    expect(mockSend.mock.calls[0][0].parameters).toBeUndefined();
  });

  it("POST /enabled-baselines/enable 400s on missing fields or bad parameters", async () => {
    expect((await post("/enabled-baselines/enable", { baselineVersion: "1.0", targetIdentifier: "arn:ou/x" })).status).toBe(400);
    expect((await post("/enabled-baselines/enable", { baselineIdentifier: "arn:baseline/1", targetIdentifier: "arn:ou/x" })).status).toBe(400);
    expect((await post("/enabled-baselines/enable", { baselineIdentifier: "arn:baseline/1", baselineVersion: "1.0" })).status).toBe(400);
    expect((await post("/enabled-baselines/enable", { baselineIdentifier: "arn:baseline/1", baselineVersion: "1.0", targetIdentifier: "arn:ou/x", parameters: "{bad" })).status).toBe(400);
    expect((await post("/enabled-baselines/enable", { baselineIdentifier: "arn:baseline/1", baselineVersion: "1.0", targetIdentifier: "arn:ou/x", parameters: '{"a":1}' })).status).toBe(400);
  });

  it("POST /enabled-baselines/update updates version and parameters", async () => {
    mockSend.mockResolvedValueOnce({ operationIdentifier: "op-6" });
    const res = await post("/enabled-baselines/update", {
      enabledBaselineIdentifier: "arn:enabledbaseline/1",
      baselineVersion: "2.0",
      parameters: [{ key: "k", value: "v" }],
    });
    expect(await res.json()).toEqual({ operationIdentifier: "op-6" });
    expect((await post("/enabled-baselines/update", { baselineVersion: "2.0" })).status).toBe(400);
    expect((await post("/enabled-baselines/update", { enabledBaselineIdentifier: "arn:enabledbaseline/1" })).status).toBe(400);
    expect((await post("/enabled-baselines/update", { enabledBaselineIdentifier: "arn:enabledbaseline/1", baselineVersion: "2.0", parameters: "bad" })).status).toBe(400);
  });

  it("POST /enabled-baselines/reset resets", async () => {
    mockSend.mockResolvedValueOnce({ operationIdentifier: "op-7" });
    const res = await post("/enabled-baselines/reset", { enabledBaselineIdentifier: "arn:enabledbaseline/1" });
    expect(await res.json()).toEqual({ operationIdentifier: "op-7" });
    expect((await post("/enabled-baselines/reset", {})).status).toBe(400);
  });
});

describe("controltower — baseline operations", () => {
  it("GET /baseline-operations/detail returns baselineOperation", async () => {
    mockSend.mockResolvedValueOnce({
      baselineOperation: { operationIdentifier: "op-5", operationType: "ENABLE_BASELINE", status: "SUCCEEDED", startTime: "t1", endTime: "t2" },
    });
    const b = await (await get("/baseline-operations/detail?identifier=op-5")).json();
    expect(b.baselineOperation).toMatchObject({ operationType: "ENABLE_BASELINE" });
    expect((await get("/baseline-operations/detail")).status).toBe(400);
  });
});

describe("controltower — sparse response fallbacks", () => {
  it("GET /operations fills sparse-row defaults", async () => {
    mockSend.mockResolvedValue({ landingZoneOperations: [{}] });
    const b = await (await get("/operations")).json();
    expect(b.operations[0]).toEqual({ operationIdentifier: undefined, operationType: null, status: null });
  });

  it("GET /operations/detail fills defaults from the query identifier", async () => {
    mockSend.mockResolvedValue({ operationDetails: {} });
    const b = await (await get("/operations/detail?identifier=op-9")).json();
    expect(b.operation).toEqual({
      operationIdentifier: "op-9",
      operationType: null,
      status: null,
      startTime: null,
      endTime: null,
    });
  });

  it("GET /baselines fills sparse-row defaults", async () => {
    mockSend.mockResolvedValue({ baselines: [{}] });
    const b = await (await get("/baselines")).json();
    expect(b.baselines[0]).toEqual({ arn: undefined, name: null, description: null });
  });

  it("GET /enabled-baselines fills sparse-row defaults", async () => {
    mockSend.mockResolvedValue({ enabledBaselines: [{}] });
    const b = await (await get("/enabled-baselines")).json();
    expect(b.enabledBaselines[0]).toEqual({
      arn: undefined,
      baselineIdentifier: null,
      baselineVersion: null,
      targetIdentifier: null,
      status: null,
      parentIdentifier: null,
    });
  });

  it("GET /enabled-baselines/detail fills defaults from the query identifier", async () => {
    mockSend.mockResolvedValue({ enabledBaselineDetails: {} });
    const b = await (await get("/enabled-baselines/detail?identifier=arn:eb/1")).json();
    expect(b.enabledBaseline).toEqual({
      arn: "arn:eb/1",
      baselineIdentifier: null,
      baselineVersion: null,
      targetIdentifier: null,
      status: null,
      parameters: [],
    });
  });

  it("GET /baseline-operations/detail fills defaults from the query identifier", async () => {
    mockSend.mockResolvedValue({ baselineOperation: {} });
    const b = await (await get("/baseline-operations/detail?identifier=op-9")).json();
    expect(b.baselineOperation).toEqual({
      operationIdentifier: "op-9",
      operationType: null,
      status: null,
      startTime: null,
      endTime: null,
    });
  });

  it("detail routes tolerate an undefined SDK result", async () => {
    mockSend.mockResolvedValue(undefined);
    expect(await (await get("/operations/detail?identifier=op-9")).json()).toEqual({
      operation: {
        operationIdentifier: "op-9",
        operationType: null,
        status: null,
        startTime: null,
        endTime: null,
      },
    });
    expect(await (await get("/enabled-baselines/detail?identifier=arn:eb/1")).json()).toEqual({
      enabledBaseline: {
        arn: "arn:eb/1",
        baselineIdentifier: null,
        baselineVersion: null,
        targetIdentifier: null,
        status: null,
        parameters: [],
      },
    });
    expect(await (await get("/baseline-operations/detail?identifier=op-9")).json()).toEqual({
      baselineOperation: {
        operationIdentifier: "op-9",
        operationType: null,
        status: null,
        startTime: null,
        endTime: null,
      },
    });
  });
});

describe("controltower — enabled controls", () => {
  beforeEach(() => mockSend.mockReset());

  it("GET /enabled-controls — lists enabled controls", async () => {
    mockSend.mockResolvedValueOnce({
      enabledControls: [
        {
          arn: "arn:ctl", controlIdentifier: "AWS::SeC::X", targetIdentifier: "arn:ou",
          statusSummary: { status: "SUCCEEDED" }, driftStatusSummary: { driftStatus: "IN_SYNC" },
        },
      ],
    });
    const res = await get("/enabled-controls");
    const b = await res.json();
    expect(res.status).toBe(200);
    expect(b.total).toBe(1);
    expect(b.enabledControls[0].controlIdentifier).toBe("AWS::SeC::X");
    expect(b.enabledControls[0].status).toBe("SUCCEEDED");
    expect(b.enabledControls[0].driftStatus).toBe("IN_SYNC");
    expect(mockSend.mock.calls[0][0].__cmd).toBe("ListEnabledControlsCommand");
  });

  it("GET /enabled-controls — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const b = await (await get("/enabled-controls")).json();
    expect(b.enabledControls).toEqual([]);
    expect(b.total).toBe(0);
  });

  it("GET /enabled-controls — falls back to nulls for missing fields", async () => {
    mockSend.mockResolvedValueOnce({
      enabledControls: [{ arn: "arn:ctl" }],
      nextToken: undefined,
    });
    const res = await get("/enabled-controls");
    const b = await res.json();
    expect(res.status).toBe(200);
    expect(b.enabledControls[0].controlIdentifier).toBeNull();
    expect(b.enabledControls[0].targetIdentifier).toBeNull();
    expect(b.enabledControls[0].status).toBeNull();
    expect(b.enabledControls[0].driftStatus).toBeNull();
  });

  it("GET /enabled-controls/detail — sparse detail fills defaults", async () => {
    mockSend.mockResolvedValueOnce({ enabledControlDetail: {} });
    const res = await get("/enabled-controls/detail?identifier=arn:ctl");
    const b = await res.json();
    expect(res.status).toBe(200);
    expect(b.enabledControl.arn).toBe("arn:ctl");
    expect(b.enabledControl.controlIdentifier).toBeNull();
    expect(b.enabledControl.targetIdentifier).toBeNull();
    expect(b.enabledControl.status).toBeNull();
    expect(b.enabledControl.parameters).toEqual([]);
  });

  it("GET /enabled-controls/detail — undefined result falls back to identifier", async () => {
    mockSend.mockResolvedValueOnce(undefined);
    const res = await get("/enabled-controls/detail?identifier=arn:ctl");
    const b = await res.json();
    expect(res.status).toBe(200);
    expect(b.enabledControl.arn).toBe("arn:ctl");
  });

  it("GET /control-operations/detail — sparse operation fills defaults", async () => {
    mockSend.mockResolvedValueOnce({ controlOperation: {} });
    const res = await get("/control-operations/detail?identifier=op-1");
    const b = await res.json();
    expect(res.status).toBe(200);
    expect(b.controlOperation.operationIdentifier).toBe("op-1");
    expect(b.controlOperation.operationType).toBeNull();
    expect(b.controlOperation.status).toBeNull();
    expect(b.controlOperation.startTime).toBeNull();
    expect(b.controlOperation.endTime).toBeNull();
  });

  it("GET /control-operations/detail — undefined result falls back to identifier", async () => {
    mockSend.mockResolvedValueOnce(undefined);
    const res = await get("/control-operations/detail?identifier=op-x");
    const b = await res.json();
    expect(res.status).toBe(200);
    expect(b.controlOperation.operationIdentifier).toBe("op-x");
  });

  it("GET /enabled-controls/detail — returns detail", async () => {
    mockSend.mockResolvedValueOnce({
      enabledControlDetail: {
        arn: "arn:ctl", controlIdentifier: "AWS::SeC::X", targetIdentifier: "arn:ou",
        statusSummary: { status: "SUCCEEDED" }, parameters: [{ key: "k", value: "v" }],
      },
    });
    const res = await get("/enabled-controls/detail?identifier=arn:ctl");
    const b = await res.json();
    expect(res.status).toBe(200);
    expect(b.enabledControl.controlIdentifier).toBe("AWS::SeC::X");
    expect(b.enabledControl.parameters).toEqual([{ key: "k", value: "v" }]);
    expect(mockSend.mock.calls[0][0].__cmd).toBe("GetEnabledControlCommand");
  });

  it("GET /enabled-controls/detail — 400 when identifier missing", async () => {
    expect((await get("/enabled-controls/detail")).status).toBe(400);
  });

  it("POST /enabled-controls/enable — enables a control", async () => {
    mockSend.mockResolvedValueOnce({ operationIdentifier: "op-1", arn: "arn:new" });
    const res = await post("/enabled-controls/enable", {
      controlIdentifier: "AWS::SeC::X", targetIdentifier: "arn:ou", parameters: [],
    });
    const b = await res.json();
    expect(res.status).toBe(201);
    expect(b.operationIdentifier).toBe("op-1");
    expect(mockSend.mock.calls[0][0].__cmd).toBe("EnableControlCommand");
  });

  it("POST /enabled-controls/enable — 400 when controlIdentifier missing", async () => {
    expect((await post("/enabled-controls/enable", { targetIdentifier: "x" })).status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("POST /enabled-controls/enable — 400 when targetIdentifier missing", async () => {
    expect((await post("/enabled-controls/enable", { controlIdentifier: "x" })).status).toBe(400);
  });

  it("POST /enabled-controls/enable — 400 on invalid parameters JSON", async () => {
    expect((await post("/enabled-controls/enable", {
      controlIdentifier: "x", targetIdentifier: "y", parameters: "not json",
    })).status).toBe(400);
  });

  it("POST /enabled-controls/update — updates a control", async () => {
    mockSend.mockResolvedValueOnce({ operationIdentifier: "op-2" });
    const res = await post("/enabled-controls/update", {
      enabledControlIdentifier: "arn:ctl", parameters: [{ key: "k", value: "v" }],
    });
    const b = await res.json();
    expect(res.status).toBe(200);
    expect(b.operationIdentifier).toBe("op-2");
    expect(mockSend.mock.calls[0][0].__cmd).toBe("UpdateEnabledControlCommand");
  });

  it("POST /enabled-controls/update — 400 on invalid parameters JSON", async () => {
    expect((await post("/enabled-controls/update", {
      enabledControlIdentifier: "arn:ctl", parameters: "not json",
    })).status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("POST /enabled-controls/update — 400 when identifier missing", async () => {
    expect((await post("/enabled-controls/update", { parameters: [] })).status).toBe(400);
  });

  it("POST /enabled-controls/reset — resets a control", async () => {
    mockSend.mockResolvedValueOnce({ operationIdentifier: "op-3" });
    const res = await post("/enabled-controls/reset", { enabledControlIdentifier: "arn:ctl" });
    const b = await res.json();
    expect(res.status).toBe(200);
    expect(b.operationIdentifier).toBe("op-3");
    expect(mockSend.mock.calls[0][0].__cmd).toBe("ResetEnabledControlCommand");
  });

  it("POST /enabled-controls/reset — 400 when identifier missing", async () => {
    expect((await post("/enabled-controls/reset", {})).status).toBe(400);
  });

  it("GET /control-operations/detail — returns control operation", async () => {
    mockSend.mockResolvedValueOnce({
      controlOperation: {
        operationIdentifier: "op-1", operationType: "ENABLE_CONTROL", status: "SUCCEEDED",
      },
    });
    const res = await get("/control-operations/detail?identifier=op-1");
    const b = await res.json();
    expect(res.status).toBe(200);
    expect(b.controlOperation.operationType).toBe("ENABLE_CONTROL");
    expect(b.controlOperation.status).toBe("SUCCEEDED");
    expect(mockSend.mock.calls[0][0].__cmd).toBe("GetControlOperationCommand");
  });

  it("GET /control-operations/detail — 400 when identifier missing", async () => {
    expect((await get("/control-operations/detail")).status).toBe(400);
  });
});
