import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mockFetch = vi.hoisted(() => vi.fn());

vi.stubGlobal("fetch", mockFetch);

import router from "./marketplace";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

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

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("agreements", () => {
  it("searches agreements with an AgreementType filter over JSON 1.0", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        agreementViewSummaries: [{ agreementId: "agmt-1", status: "ACTIVE" }],
      })
    );
    const res = await get("/agreements");
    const json = await res.json();
    expect(json.agreements).toHaveLength(1);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain("://");
    expect(String(init.headers["x-amz-target"])).toBe(
      "AWSMPCommerceService_v20200301.SearchAgreements"
    );
    expect(String(init.headers["content-type"])).toBe("application/x-amz-json-1.0");
    const body = JSON.parse(init.body);
    expect(body.catalog).toBe("AWSMarketplace");
    expect(body.filters[0].name).toBe("AgreementType");
  });

  it("passes the agreement type query through", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}));
    await get("/agreements?agreementType=RenewalAgreement");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.filters[0].values).toEqual(["RenewalAgreement"]);
  });

  it("returns an empty list when absent", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}));
    const res = await get("/agreements");
    const json = await res.json();
    expect(json.agreements).toEqual([]);
  });

  it("400 describe without agreementId", async () => {
    expect((await post("/agreements/describe", {})).status).toBe(400);
  });

  it("returns a null agreement when describe returns null", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(null));
    const res = await post("/agreements/describe", { agreementId: "agmt-1" });
    const json = await res.json();
    expect(json.agreement).toBeNull();
  });

  it("describes an agreement", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ agreementId: "agmt-1", status: "ACTIVE" })
    );
    const res = await post("/agreements/describe", { agreementId: "agmt-1" });
    const json = await res.json();
    expect(json.agreement.agreementId).toBe("agmt-1");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.agreementId).toBe("agmt-1");
  });

  it("400 cancel without agreementId", async () => {
    expect((await post("/agreements/cancel", {})).status).toBe(400);
  });

  it("cancels an agreement", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}));
    const res = await post("/agreements/cancel", { agreementId: "agmt-1" });
    const json = await res.json();
    expect(json.cancelled).toBe(true);
    expect(String(mockFetch.mock.calls[0][1].headers["x-amz-target"])).toContain(
      "CancelAgreement"
    );
  });
});

describe("entitlements", () => {
  it("400 without productCode", async () => {
    expect((await post("/entitlements", {})).status).toBe(400);
  });

  it("gets entitlements over JSON 1.1 with PascalCase input", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ Entitlements: [{ productCode: "prod-1", customerIdentifier: "c1" }] })
    );
    const res = await post("/entitlements", { productCode: "prod-1" });
    const json = await res.json();
    expect(json.entitlements).toHaveLength(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(String(init.headers["x-amz-target"])).toBe(
      "AWSMPEntitlementService.GetEntitlements"
    );
    expect(String(init.headers["content-type"])).toBe("application/x-amz-json-1.1");
    expect(JSON.parse(init.body)).toEqual({ ProductCode: "prod-1" });
  });

  it("returns an empty entitlement list when absent", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}));
    const res = await post("/entitlements", { productCode: "prod-1" });
    const json = await res.json();
    expect(json.entitlements).toEqual([]);
  });
});

describe("metering", () => {
  it("400 usage without productCode or dimension", async () => {
    expect((await post("/metering/usage", {})).status).toBe(400);
    expect((await post("/metering/usage", { productCode: "p" })).status).toBe(400);
  });

  it("meters usage", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ MeteringRecordId: "mr-1" }));
    const res = await post("/metering/usage", {
      productCode: "prod-1",
      usageDimension: "hours",
      usageQuantity: 3,
    });
    const json = await res.json();
    expect(json.meteringRecordId).toBe("mr-1");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.ProductCode).toBe("prod-1");
    expect(body.UsageDimension).toBe("hours");
    expect(body.UsageQuantity).toBe(3);
    expect(body.DryRun).toBe(false);
    expect(body.Timestamp).toBeTruthy();
  });

  it("meters usage with dryRun", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ MeteringRecordId: "mr-2" }));
    await post("/metering/usage", {
      productCode: "prod-1",
      usageDimension: "hours",
      dryRun: true,
    });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.DryRun).toBe(true);
    expect(body.UsageQuantity).toBe(1);
  });

  it("400 resolve-customer without registrationToken", async () => {
    expect((await post("/metering/resolve-customer", {})).status).toBe(400);
  });

  it("resolves a customer", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        ProductCode: "prod-9",
        CustomerAWSAccountId: "444444444444",
        LicenseArn: "arn:license",
      })
    );
    const res = await post("/metering/resolve-customer", {
      registrationToken: "tok-xyz",
    });
    const json = await res.json();
    expect(json.productCode).toBe("prod-9");
    expect(json.customerAWSAccountId).toBe("444444444444");
    expect(json.licenseArn).toBe("arn:license");
  });
});

describe("catalog", () => {
  it("lists entities via REST with PascalCase body", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ EntitySummaryList: [{ EntityId: "e1", Name: "prod" }] })
    );
    const res = await get("/catalog/entities");
    const json = await res.json();
    expect(json.entities).toHaveLength(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(String(url)).toContain("/ListEntities");
    expect(JSON.parse(init.body)).toEqual({
      Catalog: "AWSMarketplace",
      EntityType: "Agreement",
    });
  });

  it("passes the entity type query through", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}));
    await get("/catalog/entities?entityType=Amendment");
    expect(JSON.parse(mockFetch.mock.calls[0][1].body).EntityType).toBe("Amendment");
  });

  it("returns an empty entity list when absent", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}));
    const res = await get("/catalog/entities");
    const json = await res.json();
    expect(json.entities).toEqual([]);
  });

  it("propagates catalog list errors", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ __type: "ValidationException", message: "bad catalog" }, 400)
    );
    const res = await get("/catalog/entities");
    expect(res.status).toBe(500);
  });

  it("falls back when a catalog error body is empty", async () => {
    mockFetch.mockResolvedValueOnce(new Response("", { status: 502 }));
    const res = await get("/catalog/entities");
    expect(res.status).toBe(500);
  });

  it("falls back when an entity error body uses Message without __type", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ Message: "boom" }, 400));
    const res = await get("/catalog/entity?entityId=e-1");
    expect(res.status).toBe(500);
  });

  it("falls back when an entity error body is empty", async () => {
    mockFetch.mockResolvedValueOnce(new Response("", { status: 502 }));
    const res = await get("/catalog/entity?entityId=e-1");
    expect(res.status).toBe(500);
  });

  it("returns a null entity when describe returns null", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(null));
    const res = await get("/catalog/entity?entityId=e-1");
    const json = await res.json();
    expect(json.entity).toBeNull();
  });

  it("propagates entity describe errors", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ __type: "ResourceNotFoundException", message: "no entity" }, 404)
    );
    const res = await get("/catalog/entity?entityId=e-1");
    expect(res.status).toBe(500);
  });

  it("400 entity describe without entityId", async () => {
    expect((await get("/catalog/entity")).status).toBe(400);
  });

  it("describes an entity via GET with encoded id", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ EntityId: "e1" }));
    const res = await get("/catalog/entity?entityId=e%201");
    const json = await res.json();
    expect(json.entity.EntityId).toBe("e1");
    expect(String(mockFetch.mock.calls[0][0])).toContain("entityId=e%201");
  });
});

describe("error propagation", () => {
  it("maps wire errors to thrown exceptions", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ __type: "ResourceNotFoundException", message: "not found" }, 404)
    );
    const res = await post("/agreements/describe", { agreementId: "missing" });
    expect(res.status).toBe(500);
  });

  it("handles empty error bodies", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("", { status: 502 })
    );
    const res = await post("/agreements/describe", { agreementId: "x" });
    expect(res.status).toBe(500);
  });
});
