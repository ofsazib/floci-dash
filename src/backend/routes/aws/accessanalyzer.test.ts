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

vi.mock("@aws-sdk/client-accessanalyzer", () => ({
  AccessAnalyzerClient: mockClient,
  ListAnalyzersCommand: createCmd("ListAnalyzersCommand"),
  CreateAnalyzerCommand: createCmd("CreateAnalyzerCommand"),
  DeleteAnalyzerCommand: createCmd("DeleteAnalyzerCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./accessanalyzer";

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

async function del(path: string) {
  return router.request(path, { method: "DELETE" });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("GET /analyzers", () => {
  it("lists analyzers", async () => {
    mockSend.mockResolvedValueOnce({
      analyzers: [{ arn: "arn:aa", name: "a1", type: "ACCOUNT", status: "ACTIVE" }],
    });
    const res = await get("/analyzers");
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.analyzers[0].name).toBe("a1");
  });

  it("returns sparse analyzers", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/analyzers");
    const json = await res.json();
    expect(json.analyzers).toEqual([]);
  });
});

describe("POST /analyzers", () => {
  it("creates an analyzer", async () => {
    mockSend.mockResolvedValueOnce({ arn: "arn:aa" });
    const res = await post("/analyzers", { analyzerName: "a2", type: "ACCOUNT" });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.arn).toBe("arn:aa");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateAnalyzerCommand",
        analyzerName: "a2",
        type: "ACCOUNT",
      })
    );
  });

  it("400 without analyzerName", async () => {
    expect((await post("/analyzers", { type: "ACCOUNT" })).status).toBe(400);
  });

  it("400 without type", async () => {
    expect((await post("/analyzers", { analyzerName: "a2" })).status).toBe(400);
  });
});

describe("DELETE /analyzers/:name", () => {
  it("deletes an analyzer", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/analyzers/a1");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteAnalyzerCommand",
        analyzerName: "a1",
      })
    );
  });
});
