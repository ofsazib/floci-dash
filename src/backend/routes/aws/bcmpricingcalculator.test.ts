import { describe, it, expect, beforeEach, vi } from "vitest";

const mockFetch = vi.hoisted(() => vi.fn());

vi.stubGlobal("fetch", mockFetch);

import router from "./bcmpricingcalculator";

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

async function del(path: string, body?: any) {
  return router.request(path, {
    method: "DELETE",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockReset();
});

describe("estimates", () => {
  it("lists an empty page (Floci has no List operation)", async () => {
    const res = await get("/estimates");
    const json = await res.json();
    expect(json.estimates).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("400 create without name", async () => {
    expect((await post("/estimates", {})).status).toBe(400);
  });

  it("creates an estimate over JSON 1.0 with a default rateType", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ id: "est-1", name: "probe", status: "VALID", totalCost: 0 })
    );
    const res = await post("/estimates", { name: "probe" });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.estimate.id).toBe("est-1");

    const [url, init] = mockFetch.mock.calls[0];
    expect(String(init.headers["x-amz-target"])).toBe(
      "AWSBCMPricingCalculator.CreateWorkloadEstimate"
    );
    expect(String(init.headers["content-type"])).toBe("application/x-amz-json-1.0");
    const body = JSON.parse(init.body);
    expect(body.name).toBe("probe");
    expect(body.rateType).toBe("BEFORE_DISCOUNTS");
  });

  it("passes a custom rateType and tags", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: "est-1" }));
    await post("/estimates", {
      name: "probe",
      rateType: "AFTER_DISCOUNTS",
      tags: { team: "sec" },
    });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.rateType).toBe("AFTER_DISCOUNTS");
    expect(body.tags).toEqual({ team: "sec" });
  });

  it("propagates create errors", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ __type: "ValidationException", message: "rateType is invalid." }, 400)
    );
    const res = await post("/estimates", { name: "probe" });
    expect(res.status).toBe(500);
  });

  it("handles empty error bodies", async () => {
    mockFetch.mockResolvedValueOnce(new Response("", { status: 502 }));
    const res = await post("/estimates", { name: "probe" });
    expect(res.status).toBe(500);
  });

  it("400 get without identifier", async () => {
    expect((await post("/estimates/get", {})).status).toBe(400);
  });

  it("gets an estimate", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ id: "est-1", name: "probe", totalCost: 1.5 })
    );
    const res = await post("/estimates/get", { identifier: "est-1" });
    const json = await res.json();
    expect(json.estimate.totalCost).toBe(1.5);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.identifier).toBe("est-1");
  });

  it("400 delete without identifier", async () => {
    expect((await del("/estimates", {})).status).toBe(400);
  });

  it("deletes an estimate", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}));
    const res = await del("/estimates", { identifier: "est-1" });
    const json = await res.json();
    expect(json.deleted).toBe(true);
    expect(String(mockFetch.mock.calls[0][1].headers["x-amz-target"])).toContain(
      "DeleteWorkloadEstimate"
    );
  });
});

describe("usage", () => {
  it("400 without workloadEstimateId", async () => {
    expect((await post("/estimates/usage", { usage: [{}] })).status).toBe(400);
  });

  it("400 without usage entries", async () => {
    expect((await post("/estimates/usage", { workloadEstimateId: "est-1" })).status).toBe(400);
    expect(
      (await post("/estimates/usage", { workloadEstimateId: "est-1", usage: [] })).status
    ).toBe(400);
  });

  it("batch-creates usage entries", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        items: [{ id: "u1", cost: 0.5, status: "VALID" }],
        errors: [{ key: "k2", errorCode: "BAD_REQUEST", errorMessage: "no pricing" }],
      })
    );
    const res = await post("/estimates/usage", {
      workloadEstimateId: "est-1",
      usage: [
        {
          serviceCode: "AmazonEC2",
          usageType: "BoxUsage:t3.micro",
          operation: "RunInstances",
          usageAccountId: "000000000000",
          amount: 2,
          key: "k1",
        },
        { serviceCode: "x", usageType: "y", operation: "z", key: "k2", amount: "not-a-number" },
      ],
    });
    const json = await res.json();
    expect(json.items).toHaveLength(1);
    expect(json.errors).toHaveLength(1);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.workloadEstimateId).toBe("est-1");
    expect(body.usage[0].amount).toBe(2);
    // Non-numeric amounts serialize as null (Floci treats that as missing).
    expect(body.usage[1].amount).toBeNull();
    expect(body.usage[1].usageAccountId).toBeUndefined();
  });

  it("returns empty items and errors when absent", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}));
    const res = await post("/estimates/usage", {
      workloadEstimateId: "est-1",
      usage: [{ serviceCode: "s", usageType: "t", operation: "o" }],
    });
    const json = await res.json();
    expect(json.items).toEqual([]);
    expect(json.errors).toEqual([]);
  });
});
