import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockClient = vi.hoisted(() =>
  vi.fn(function () {
    return { send: mockSend };
  })
);

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-appintegrations", () => ({
  AppIntegrationsClient: mockClient,
  ListEventIntegrationsCommand: createCmd("ListEventIntegrationsCommand"),
  CreateEventIntegrationCommand: createCmd("CreateEventIntegrationCommand"),
  GetEventIntegrationCommand: createCmd("GetEventIntegrationCommand"),
  UpdateEventIntegrationCommand: createCmd("UpdateEventIntegrationCommand"),
  DeleteEventIntegrationCommand: createCmd("DeleteEventIntegrationCommand"),
  ListDataIntegrationsCommand: createCmd("ListDataIntegrationsCommand"),
  CreateDataIntegrationCommand: createCmd("CreateDataIntegrationCommand"),
  GetDataIntegrationCommand: createCmd("GetDataIntegrationCommand"),
  UpdateDataIntegrationCommand: createCmd("UpdateDataIntegrationCommand"),
  DeleteDataIntegrationCommand: createCmd("DeleteDataIntegrationCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./appintegrations";

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

async function patch(path: string, body?: any) {
  return router.request(path, {
    method: "PATCH",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function del(path: string) {
  return router.request(path, { method: "DELETE" });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("event integrations", () => {
  it("lists event integrations", async () => {
    mockSend.mockResolvedValueOnce({
      EventIntegrations: [{ Name: "ev1", EventIntegrationArn: "arn:ei" }],
    });
    const res = await get("/event-integrations");
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.eventIntegrations[0].Name).toBe("ev1");
  });

  it("returns sparse event integrations", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/event-integrations");
    const json = await res.json();
    expect(json.eventIntegrations).toEqual([]);
  });

  it("creates an event integration", async () => {
    mockSend.mockResolvedValueOnce({ EventIntegrationArn: "arn:ei" });
    const res = await post("/event-integrations", {
      name: "ev1",
      eventBridgeBus: "arn:aws:events::1:bus/b",
      eventFilter: { Source: "aws.connect" },
    });
    expect(res.status).toBe(201);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateEventIntegrationCommand",
        Name: "ev1",
        EventBridgeBus: "arn:aws:events::1:bus/b",
        EventFilter: { Source: "aws.connect" },
      })
    );
  });

  it("400 event create without name", async () => {
    expect(
      (await post("/event-integrations", { eventBridgeBus: "b", eventFilter: { Source: "s" } })).status
    ).toBe(400);
  });

  it("400 event create without bus", async () => {
    expect((await post("/event-integrations", { name: "e", eventFilter: { Source: "s" } })).status).toBe(400);
  });

  it("400 event create without filter source", async () => {
    expect((await post("/event-integrations", { name: "e", eventBridgeBus: "b" })).status).toBe(400);
    expect(
      (await post("/event-integrations", { name: "e", eventBridgeBus: "b", eventFilter: {} })).status
    ).toBe(400);
  });

  it("gets an event integration", async () => {
    mockSend.mockResolvedValueOnce({ Name: "ev1" });
    const res = await get("/event-integrations/ev1");
    const json = await res.json();
    expect(json.eventIntegration.Name).toBe("ev1");
  });

  it("returns null event integration when absent", async () => {
    mockSend.mockResolvedValueOnce(null);
    const res = await get("/event-integrations/none");
    const json = await res.json();
    expect(json.eventIntegration).toBeNull();
  });

  it("patches an event integration description", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await patch("/event-integrations/ev1", { description: "new" });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UpdateEventIntegrationCommand",
        Name: "ev1",
        Description: "new",
      })
    );
  });

  it("400 event patch without description", async () => {
    expect((await patch("/event-integrations/ev1", {})).status).toBe(400);
  });

  it("deletes an event integration", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/event-integrations/ev1");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteEventIntegrationCommand",
        Name: "ev1",
      })
    );
  });
});

describe("data integrations", () => {
  it("lists data integrations", async () => {
    mockSend.mockResolvedValueOnce({
      DataIntegrations: [{ Arn: "arn:di", Name: "di1", SourceURI: "s3://b" }],
    });
    const res = await get("/data-integrations");
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.dataIntegrations[0].SourceURI).toBe("s3://b");
  });

  it("returns sparse data integrations", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/data-integrations");
    const json = await res.json();
    expect(json.dataIntegrations).toEqual([]);
  });

  it("creates a data integration", async () => {
    mockSend.mockResolvedValueOnce({ Arn: "arn:di" });
    const res = await post("/data-integrations", {
      name: "di1",
      sourceUri: "s3://b",
      kmsKey: "arn:aws:kms::1:key/k",
    });
    expect(res.status).toBe(201);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateDataIntegrationCommand",
        Name: "di1",
        SourceURI: "s3://b",
        KmsKey: "arn:aws:kms::1:key/k",
      })
    );
  });

  it("400 data create without name", async () => {
    expect((await post("/data-integrations", { sourceUri: "s", kmsKey: "k" })).status).toBe(400);
  });

  it("400 data create without sourceUri", async () => {
    expect((await post("/data-integrations", { name: "n", kmsKey: "k" })).status).toBe(400);
  });

  it("400 data create without kmsKey", async () => {
    expect((await post("/data-integrations", { name: "n", sourceUri: "s" })).status).toBe(400);
  });

  it("gets a data integration", async () => {
    mockSend.mockResolvedValueOnce({ Name: "di1" });
    const res = await get("/data-integrations/di1");
    const json = await res.json();
    expect(json.dataIntegration.Name).toBe("di1");
  });

  it("returns null data integration when absent", async () => {
    mockSend.mockResolvedValueOnce(null);
    const res = await get("/data-integrations/none");
    const json = await res.json();
    expect(json.dataIntegration).toBeNull();
  });

  it("patches a data integration name", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await patch("/data-integrations/di1", { name: "renamed" });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UpdateDataIntegrationCommand",
        Identifier: "di1",
        Name: "renamed",
      })
    );
  });

  it("patches a data integration description", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await patch("/data-integrations/di1", { description: "new" });
    expect(res.status).toBe(200);
  });

  it("400 data patch without name or description", async () => {
    expect((await patch("/data-integrations/di1", {})).status).toBe(400);
  });

  it("deletes a data integration", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/data-integrations/di1");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteDataIntegrationCommand",
        Identifier: "di1",
      })
    );
  });
});
