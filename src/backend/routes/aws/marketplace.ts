import { Hono } from "hono";
import type { Context } from "hono";
import { getFlociEndpoint } from "../../clients/config";
import { readJson } from "../../clients/read-json";

const REGION = process.env.AWS_REGION || "us-east-1";

// The @aws-sdk/client-marketplace-* clients' schema serializer drops JSON 1.0
// request bodies (verified on 3.978.0 and 3.1146.0 against a fresh dependency
// graph) and passes responses through unmapped PascalCase. Floci only reads
// the credential scope out of the Authorization header (no signature
// verification locally), so this route speaks the wire protocol directly.
async function jsonCall(
  scope: string,
  target: string,
  contentType: string,
  body: Record<string, unknown>
): Promise<any> {
  const amzDate = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const res = await fetch(`${getFlociEndpoint()}/`, {
    method: "POST",
    headers: {
      "content-type": contentType,
      "x-amz-target": target,
      "x-amz-date": amzDate,
      authorization: `AWS4-HMAC-SHA256 Credential=test/${amzDate.slice(0, 8)}/${REGION}/${scope}/aws4_request, SignedHeaders=content-type;host;x-amz-date;x-amz-target, Signature=${"0".repeat(64)}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err: any = new Error(data.message || data.Message || "Request failed");
    err.name = String(data.__type || "MarketplaceException").split("#").pop();
    throw err;
  }
  return data;
}

// Agreements speak JSON 1.0 with camelCase members (Floci's service reads
// camelCase field names directly).
const callAgreement = (action: string, body: Record<string, unknown>) =>
  jsonCall(
    "AWSMPCommerceService_v20200301.",
    `AWSMPCommerceService_v20200301.${action}`,
    "application/x-amz-json-1.0",
    body
  );

// Entitlements and metering speak JSON 1.1 with PascalCase members.
const callEntitlement = (action: string, body: Record<string, unknown>) =>
  jsonCall(
    "AWSMPEntitlementService.",
    `AWSMPEntitlementService.${action}`,
    "application/x-amz-json-1.1",
    body
  );

const callMetering = (action: string, body: Record<string, unknown>) =>
  jsonCall(
    "AWSMPMeteringService.",
    `AWSMPMeteringService.${action}`,
    "application/x-amz-json-1.1",
    body
  );

// Catalog is REST-JSON with PascalCase members.
function amzDateNow(): string {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

async function callCatalog(body: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${getFlociEndpoint()}/ListEntities`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-amz-date": amzDateNow(),
      authorization: `AWS4-HMAC-SHA256 Credential=test/${amzDateNow().slice(0, 8)}/${REGION}/aws-marketplace/aws4_request, SignedHeaders=content-type;host;x-amz-date, Signature=${"0".repeat(64)}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err: any = new Error(data.message || data.Message || "Request failed");
    err.name = String(data.__type || "MarketplaceException").split("#").pop();
    throw err;
  }
  return data;
}

async function callCatalogDescribe(query: string): Promise<any> {
  const res = await fetch(`${getFlociEndpoint()}/DescribeEntity?${query}`, {
    method: "GET",
    headers: {
      "x-amz-date": amzDateNow(),
      authorization: `AWS4-HMAC-SHA256 Credential=test/${amzDateNow().slice(0, 8)}/${REGION}/aws-marketplace/aws4_request, SignedHeaders=host;x-amz-date, Signature=${"0".repeat(64)}`,
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err: any = new Error(data.message || data.Message || "Request failed");
    err.name = String(data.__type || "MarketplaceException").split("#").pop();
    throw err;
  }
  return data;
}

const router = new Hono();

// ── Agreements ───────────────────────────────────────────

router.get("/agreements", async (c: Context) => {
  const agreementType = c.req.query("agreementType") || "PurchaseAgreement";
  const result = await callAgreement("SearchAgreements", {
    catalog: "AWSMarketplace",
    filters: [{ name: "AgreementType", values: [agreementType] }],
  });
  return c.json({
    agreements: result.agreementViewSummaries || [],
    nextToken: result.nextToken,
  });
});

router.post("/agreements/describe", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.agreementId) return c.json({ error: "agreementId is required" }, 400);
  const result = await callAgreement("DescribeAgreement", {
    agreementId: body.agreementId,
  });
  return c.json({ agreement: result || null });
});

router.post("/agreements/cancel", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.agreementId) return c.json({ error: "agreementId is required" }, 400);
  await callAgreement("CancelAgreement", { agreementId: body.agreementId });
  return c.json({ cancelled: true });
});

// ── Entitlements ─────────────────────────────────────────

router.post("/entitlements", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.productCode) return c.json({ error: "productCode is required" }, 400);
  const result = await callEntitlement("GetEntitlements", {
    ProductCode: body.productCode,
  });
  return c.json({ entitlements: result.Entitlements || [] });
});

// ── Metering ─────────────────────────────────────────────

router.post("/metering/usage", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.productCode) return c.json({ error: "productCode is required" }, 400);
  if (!body?.usageDimension)
    return c.json({ error: "usageDimension is required" }, 400);
  const result = await callMetering("MeterUsage", {
    ProductCode: body.productCode,
    // Floci (like the real wire format) requires an epoch-seconds number.
    Timestamp: Math.floor(Date.now() / 1000),
    UsageDimension: body.usageDimension,
    UsageQuantity: body.usageQuantity ?? 1,
    DryRun: body.dryRun === true,
  });
  return c.json({ meteringRecordId: result.MeteringRecordId });
});

router.post("/metering/resolve-customer", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.registrationToken)
    return c.json({ error: "registrationToken is required" }, 400);
  const result = await callMetering("ResolveCustomer", {
    RegistrationToken: body.registrationToken,
  });
  return c.json({
    productCode: result.ProductCode,
    customerAWSAccountId: result.CustomerAWSAccountId,
    licenseArn: result.LicenseArn,
  });
});

// ── Catalog ──────────────────────────────────────────────

router.get("/catalog/entities", async (c: Context) => {
  const entityType = c.req.query("entityType") || "Agreement";
  const result = await callCatalog({
    Catalog: "AWSMarketplace",
    EntityType: entityType,
  });
  return c.json({
    entities: result.EntitySummaryList || [],
    nextToken: result.NextToken,
  });
});

router.get("/catalog/entity", async (c: Context) => {
  const entityId = c.req.query("entityId");
  if (!entityId)
    return c.json({ error: "entityId query param is required" }, 400);
  const result = await callCatalogDescribe(
    `catalog=AWSMarketplace&entityId=${encodeURIComponent(entityId)}`
  );
  return c.json({ entity: result || null });
});

export default router;
