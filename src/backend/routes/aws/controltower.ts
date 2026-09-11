import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { ControlTowerClient } from "@aws-sdk/client-controltower";
import {
  CreateLandingZoneCommand,
  DeleteLandingZoneCommand,
  EnableBaselineCommand,
  GetBaselineOperationCommand,
  GetEnabledBaselineCommand,
  GetLandingZoneCommand,
  GetLandingZoneOperationCommand,
  ListBaselinesCommand,
  ListEnabledBaselinesCommand,
  ListLandingZoneOperationsCommand,
  ListLandingZonesCommand,
  ResetEnabledBaselineCommand,
  ResetLandingZoneCommand,
  UpdateEnabledBaselineCommand,
  UpdateLandingZoneCommand,
} from "@aws-sdk/client-controltower";

const router = new Hono();
const getClient = () => create(ControlTowerClient);

const badRequest = (c: Context, msg: string) => c.json({ error: msg }, 400);

const body = async (c: Context): Promise<any> => {
  try {
    return await c.req.json();
  } catch {
    return {};
  }
};

/** Parses a manifest supplied as a JSON string (or passes through an object). */
const parseManifest = (value: unknown): { manifest?: any; error?: string } => {
  if (value === undefined || value === null || value === "") {
    return { error: "manifest is required" };
  }
  if (typeof value === "object") {
    return { manifest: value };
  }
  try {
    const parsed = JSON.parse(String(value));
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { error: "manifest must be a JSON object" };
    }
    return { manifest: parsed };
  } catch {
    return { error: "manifest must be valid JSON" };
  }
};

const parseParameters = (value: unknown): { parameters?: any[]; error?: string } => {
  if (value === undefined || value === null || value === "") {
    return {};
  }
  if (Array.isArray(value)) {
    return { parameters: value };
  }
  try {
    const parsed = JSON.parse(String(value));
    if (!Array.isArray(parsed)) {
      return { error: "parameters must be a JSON array" };
    }
    return { parameters: parsed };
  } catch {
    return { error: "parameters must be valid JSON" };
  }
};

// ---------- Landing zones ----------

router.get("/landing-zones", async (c: Context) => {
  const result: any = await getClient().send(new ListLandingZonesCommand({}));
  const landingZones = [];
  for (const entry of result?.landingZones || []) {
    const detail: any = await getClient().send(
      new GetLandingZoneCommand({ landingZoneIdentifier: entry.arn }),
    );
    const lz = detail?.landingZone || {};
    landingZones.push({
      arn: lz.arn || entry.arn,
      version: lz.version || null,
      latestAvailableVersion: lz.latestAvailableVersion || null,
      status: lz.status || null,
      driftStatus: lz.driftStatus?.status || null,
      manifest: lz.manifest || null,
      remediationTypes: lz.remediationTypes || [],
    });
  }
  return c.json({ landingZones, total: landingZones.length });
});

router.post("/landing-zones", async (c: Context) => {
  const b = await body(c);
  const { manifest, error } = parseManifest(b.manifest);
  if (error) return badRequest(c, error);
  const Version = b.version;
  if (!Version) return badRequest(c, "version is required");
  const result: any = await getClient().send(
    new CreateLandingZoneCommand({ manifest, version: Version, tags: b.tags }),
  );
  return c.json({ arn: result?.arn, operationIdentifier: result?.operationIdentifier }, 201);
});

router.put("/landing-zones/update", async (c: Context) => {
  const b = await body(c);
  const landingZoneIdentifier = b.landingZoneIdentifier;
  if (!landingZoneIdentifier) return badRequest(c, "landingZoneIdentifier is required");
  const Version = b.version;
  if (!Version) return badRequest(c, "version is required");
  const { manifest, error } = parseManifest(b.manifest);
  if (error) return badRequest(c, error);
  const result: any = await getClient().send(
    new UpdateLandingZoneCommand({
      landingZoneIdentifier,
      version: Version,
      manifest,
      remediationTypes: b.remediationTypes ? ["INHERITANCE_DRIFT"] : undefined,
    }),
  );
  return c.json({ operationIdentifier: result?.operationIdentifier });
});

router.post("/landing-zones/reset", async (c: Context) => {
  const b = await body(c);
  const landingZoneIdentifier = b.landingZoneIdentifier;
  if (!landingZoneIdentifier) return badRequest(c, "landingZoneIdentifier is required");
  const result: any = await getClient().send(
    new ResetLandingZoneCommand({ landingZoneIdentifier }),
  );
  return c.json({ operationIdentifier: result?.operationIdentifier });
});

router.delete("/landing-zones", async (c: Context) => {
  const landingZoneIdentifier = c.req.query("identifier");
  if (!landingZoneIdentifier) return badRequest(c, "identifier is required");
  const result: any = await getClient().send(
    new DeleteLandingZoneCommand({ landingZoneIdentifier }),
  );
  return c.json({ operationIdentifier: result?.operationIdentifier });
});

// ---------- Landing zone operations ----------

router.get("/operations", async (c: Context) => {
  const result: any = await getClient().send(new ListLandingZoneOperationsCommand({}));
  const operations = (result?.landingZoneOperations || []).map((o: any) => ({
    operationIdentifier: o.operationIdentifier,
    operationType: o.operationType || null,
    status: o.status || null,
  }));
  return c.json({ operations, total: operations.length });
});

router.get("/operations/detail", async (c: Context) => {
  const operationIdentifier = c.req.query("identifier");
  if (!operationIdentifier) return badRequest(c, "identifier is required");
  const result: any = await getClient().send(
    new GetLandingZoneOperationCommand({ operationIdentifier }),
  );
  const d = result?.operationDetails || {};
  return c.json({
    operation: {
      operationIdentifier: d.operationIdentifier || operationIdentifier,
      operationType: d.operationType || null,
      status: d.status || null,
      startTime: d.startTime || null,
      endTime: d.endTime || null,
    },
  });
});

// ---------- Baselines ----------

router.get("/baselines", async (c: Context) => {
  const result: any = await getClient().send(new ListBaselinesCommand({}));
  const baselines = (result?.baselines || []).map((b: any) => ({
    arn: b.arn,
    name: b.name || null,
    description: b.description || null,
  }));
  return c.json({ baselines, total: baselines.length });
});

// ---------- Enabled baselines ----------

router.get("/enabled-baselines", async (c: Context) => {
  const result: any = await getClient().send(new ListEnabledBaselinesCommand({}));
  const enabledBaselines = (result?.enabledBaselines || []).map((e: any) => ({
    arn: e.arn,
    baselineIdentifier: e.baselineIdentifier || null,
    baselineVersion: e.baselineVersion || null,
    targetIdentifier: e.targetIdentifier || null,
    status: e.statusSummary?.status || null,
    parentIdentifier: e.parentIdentifier || null,
  }));
  return c.json({ enabledBaselines, total: enabledBaselines.length });
});

router.get("/enabled-baselines/detail", async (c: Context) => {
  const identifier = c.req.query("identifier");
  if (!identifier) return badRequest(c, "identifier is required");
  const result: any = await getClient().send(
    new GetEnabledBaselineCommand({ enabledBaselineIdentifier: identifier }),
  );
  const d = result?.enabledBaselineDetails || {};
  return c.json({
    enabledBaseline: {
      arn: d.arn || identifier,
      baselineIdentifier: d.baselineIdentifier || null,
      baselineVersion: d.baselineVersion || null,
      targetIdentifier: d.targetIdentifier || null,
      status: d.statusSummary?.status || null,
      parameters: d.parameters || [],
    },
  });
});

router.post("/enabled-baselines/enable", async (c: Context) => {
  const b = await body(c);
  const BaselineIdentifier = b.baselineIdentifier;
  if (!BaselineIdentifier) return badRequest(c, "baselineIdentifier is required");
  const BaselineVersion = b.baselineVersion;
  if (!BaselineVersion) return badRequest(c, "baselineVersion is required");
  const TargetIdentifier = b.targetIdentifier;
  if (!TargetIdentifier) return badRequest(c, "targetIdentifier is required");
  const { parameters, error } = parseParameters(b.parameters);
  if (error) return badRequest(c, error);
  const result: any = await getClient().send(
    new EnableBaselineCommand({
      baselineIdentifier: BaselineIdentifier,
      baselineVersion: BaselineVersion,
      targetIdentifier: TargetIdentifier,
      parameters,
    }),
  );
  return c.json(
    { operationIdentifier: result?.operationIdentifier, arn: result?.arn },
    201,
  );
});

router.post("/enabled-baselines/update", async (c: Context) => {
  const b = await body(c);
  const enabledBaselineIdentifier = b.enabledBaselineIdentifier;
  if (!enabledBaselineIdentifier) return badRequest(c, "enabledBaselineIdentifier is required");
  const BaselineVersion = b.baselineVersion;
  if (!BaselineVersion) return badRequest(c, "baselineVersion is required");
  const { parameters, error } = parseParameters(b.parameters);
  if (error) return badRequest(c, error);
  const result: any = await getClient().send(
    new UpdateEnabledBaselineCommand({
      enabledBaselineIdentifier,
      baselineVersion: BaselineVersion,
      parameters,
    }),
  );
  return c.json({ operationIdentifier: result?.operationIdentifier });
});

router.post("/enabled-baselines/reset", async (c: Context) => {
  const b = await body(c);
  const enabledBaselineIdentifier = b.enabledBaselineIdentifier;
  if (!enabledBaselineIdentifier) return badRequest(c, "enabledBaselineIdentifier is required");
  const result: any = await getClient().send(
    new ResetEnabledBaselineCommand({ enabledBaselineIdentifier }),
  );
  return c.json({ operationIdentifier: result?.operationIdentifier });
});

// ---------- Baseline operations ----------

router.get("/baseline-operations/detail", async (c: Context) => {
  const operationIdentifier = c.req.query("identifier");
  if (!operationIdentifier) return badRequest(c, "identifier is required");
  const result: any = await getClient().send(
    new GetBaselineOperationCommand({ operationIdentifier }),
  );
  const d = result?.baselineOperation || {};
  return c.json({
    baselineOperation: {
      operationIdentifier: d.operationIdentifier || operationIdentifier,
      operationType: d.operationType || null,
      status: d.status || null,
      startTime: d.startTime || null,
      endTime: d.endTime || null,
    },
  });
});

export default router;
