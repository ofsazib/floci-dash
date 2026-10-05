import { Hono } from "hono";
import type { Context } from "hono";
import { getFlociEndpoint } from "../../clients/config";
import { readJson } from "../../clients/read-json";

const REGION = process.env.AWS_REGION || "us-east-1";
const SCOPE = "AWSBCMPricingCalculator.";

// The marketplace-family schema serializer precedent applies here too: JSON 1.0
// clients in recent @aws-sdk releases drop request bodies, so this route speaks
// the wire protocol directly. Floci reads only the credential scope out of the
// Authorization header (no signature verification locally).
async function bcmCall(action: string, body: Record<string, unknown>): Promise<any> {
  const amzDate = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const res = await fetch(`${getFlociEndpoint()}/`, {
    method: "POST",
    headers: {
      "content-type": "application/x-amz-json-1.0",
      "x-amz-target": `${SCOPE}${action}`,
      "x-amz-date": amzDate,
      authorization: `AWS4-HMAC-SHA256 Credential=test/${amzDate.slice(0, 8)}/${REGION}/${SCOPE}/aws4_request, SignedHeaders=content-type;host;x-amz-date;x-amz-target, Signature=${"0".repeat(64)}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err: any = new Error(data.message || data.Message || "Request failed");
    err.name = String(data.__type || "BCM pricing calculator error").split("#").pop();
    throw err;
  }
  return data;
}

const router = new Hono();

router.get("/estimates", async (c: Context) => {
  // Floci exposes no ListWorkloadEstimates operation; estimates are addressed
  // by id (returned at create time), so the list route reports an empty page.
  return c.json({ estimates: [] });
});

router.post("/estimates", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.name) return c.json({ error: "name is required" }, 400);
  const result = await bcmCall("CreateWorkloadEstimate", {
    name: body.name,
    rateType: body.rateType || "BEFORE_DISCOUNTS",
    clientToken: body.clientToken,
    tags: body.tags,
  });
  return c.json({ estimate: result }, 201);
});

router.post("/estimates/get", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.identifier) return c.json({ error: "identifier is required" }, 400);
  const result = await bcmCall("GetWorkloadEstimate", {
    identifier: body.identifier,
  });
  return c.json({ estimate: result });
});

router.delete("/estimates", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.identifier) return c.json({ error: "identifier is required" }, 400);
  await bcmCall("DeleteWorkloadEstimate", { identifier: body.identifier });
  return c.json({ deleted: true });
});

router.post("/estimates/usage", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.workloadEstimateId)
    return c.json({ error: "workloadEstimateId is required" }, 400);
  if (!Array.isArray(body?.usage) || body.usage.length === 0)
    return c.json({ error: "usage array with at least one entry is required" }, 400);
  const result = await bcmCall("BatchCreateWorkloadEstimateUsage", {
    workloadEstimateId: body.workloadEstimateId,
    clientToken: body.clientToken,
    usage: body.usage.map((u: any) => ({
      serviceCode: u.serviceCode,
      usageType: u.usageType,
      operation: u.operation,
      key: u.key,
      usageAccountId: u.usageAccountId,
      group: u.group,
      amount: typeof u.amount === "number" ? u.amount : NaN,
    })),
  });
  return c.json({
    items: result.items || [],
    errors: result.errors || [],
  });
});

export default router;
