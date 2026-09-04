import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-service-quotas", () => ({
  ServiceQuotasClient: vi.fn(function () {
    return { send: mockSend };
  }),
  ListServiceQuotasCommand: createCmd("ListServiceQuotasCommand"),
  ListAWSDefaultServiceQuotasCommand: createCmd("ListAWSDefaultServiceQuotasCommand"),
  GetServiceQuotaCommand: createCmd("GetServiceQuotaCommand"),
  GetAWSDefaultServiceQuotaCommand: createCmd("GetAWSDefaultServiceQuotaCommand"),
  RequestServiceQuotaIncreaseCommand: createCmd("RequestServiceQuotaIncreaseCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./servicequotas";

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

const quota = {
  ServiceCode: "lambda",
  ServiceName: "AWS Lambda",
  QuotaArn: "arn:aws:servicequotas:us-east-1:000000000000:lambda/L-B99A9384",
  QuotaCode: "L-B99A9384",
  QuotaName: "Concurrent executions",
  Value: 5000,
  Unit: "None",
  Adjustable: true,
  GlobalQuota: false,
  QuotaAppliedAtLevel: "ACCOUNT",
};

beforeEach(() => {
  mockSend.mockReset();
});

describe("Service Quotas routes", () => {
  it("lists service quotas for a service code", async () => {
    mockSend.mockResolvedValueOnce({ Quotas: [quota], NextToken: "tok" });
    const res = await get("/quotas?serviceCode=lambda");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.quotas).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(json.nextToken).toBe("tok");
    expect(json.defaults).toBe(false);
    expect(json.quotas[0].quotaCode).toBe("L-B99A9384");
    expect(json.quotas[0].value).toBe(5000);
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "ListServiceQuotasCommand",
      ServiceCode: "lambda",
    });
  });

  it("forwards pagination and filter params", async () => {
    mockSend.mockResolvedValueOnce({ Quotas: [] });
    await get("/quotas?serviceCode=lambda&quotaCode=L-B99A9384&nextToken=t%201&maxResults=5");
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "ListServiceQuotasCommand",
      ServiceCode: "lambda",
      QuotaCode: "L-B99A9384",
      NextToken: "t 1",
      MaxResults: 5,
    });
  });

  it("lists AWS default quotas when defaults=true", async () => {
    mockSend.mockResolvedValueOnce({ Quotas: [quota] });
    const res = await get("/quotas?serviceCode=ec2&defaults=true");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.defaults).toBe(true);
    expect(json.total).toBe(1);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListAWSDefaultServiceQuotasCommand");
  });

  it("returns empty list when Quotas absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/quotas?serviceCode=lambda");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ quotas: [], total: 0, nextToken: null, defaults: false });
  });

  it("rejects list without serviceCode", async () => {
    const res = await get("/quotas");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "serviceCode is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("gets a single service quota", async () => {
    mockSend.mockResolvedValueOnce({ Quota: quota });
    const res = await get("/quotas/lambda/L-B99A9384");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.quota.quotaName).toBe("Concurrent executions");
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "GetServiceQuotaCommand",
      ServiceCode: "lambda",
      QuotaCode: "L-B99A9384",
    });
  });

  it("gets an AWS default quota when defaults=true", async () => {
    mockSend.mockResolvedValueOnce({ Quota: quota });
    const res = await get("/quotas/lambda/L-B99A9384?defaults=true");
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetAWSDefaultServiceQuotaCommand");
  });

  it("returns null quota when missing", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/quotas/lambda/NOPE");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ quota: null, defaults: false });
  });

  it("requests a quota increase", async () => {
    mockSend.mockResolvedValueOnce({
      RequestedQuota: {
        Id: "abc123",
        ServiceCode: "lambda",
        ServiceName: "AWS Lambda",
        QuotaCode: "L-B99A9384",
        QuotaName: "Concurrent executions",
        QuotaArn: "arn:aws:servicequotas:us-east-1:000000000000:lambda/L-B99A9384",
        DesiredValue: 10000,
        Status: "PENDING",
        Requester: "floci-emulator",
        Created: 1700000000,
        QuotaContext: { ContextId: "ctx-1", ContextScope: "RESOURCE" },
      },
    });
    const res = await post("/quotas/request-increase", {
      serviceCode: "lambda",
      quotaCode: "L-B99A9384",
      desiredValue: 10000,
      contextId: "ctx-1",
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.requestedQuota.status).toBe("PENDING");
    expect(json.requestedQuota.id).toBe("abc123");
    expect(json.requestedQuota.contextId).toBe("ctx-1");
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "RequestServiceQuotaIncreaseCommand",
      ServiceCode: "lambda",
      QuotaCode: "L-B99A9384",
      DesiredValue: 10000,
      ContextId: "ctx-1",
    });
  });

  it("accepts a string desired value and no contextId", async () => {
    mockSend.mockResolvedValueOnce({ RequestedQuota: quota });
    const res = await post("/quotas/request-increase", {
      serviceCode: "lambda",
      quotaCode: "L-B99A9384",
      desiredValue: "15000",
    });
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "RequestServiceQuotaIncreaseCommand",
      DesiredValue: 15000,
      ContextId: undefined,
    });
  });

  it("returns null requestedQuota when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/quotas/request-increase", {
      serviceCode: "lambda",
      quotaCode: "L-B99A9384",
      desiredValue: 10,
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ requestedQuota: null });
  });

  it("rejects request without serviceCode", async () => {
    const res = await post("/quotas/request-increase", { quotaCode: "L-1", desiredValue: 10 });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "serviceCode is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejects request without quotaCode", async () => {
    const res = await post("/quotas/request-increase", { serviceCode: "lambda", desiredValue: 10 });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "quotaCode is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejects request without desiredValue", async () => {
    const res = await post("/quotas/request-increase", { serviceCode: "lambda", quotaCode: "L-1" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "desiredValue is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejects request with NaN desiredValue", async () => {
    const res = await post("/quotas/request-increase", {
      serviceCode: "lambda",
      quotaCode: "L-1",
      desiredValue: "abc",
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "desiredValue is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });
});
