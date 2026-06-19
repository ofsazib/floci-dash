import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());
const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) { return { __cmdName: name, ...args }; });
  };
});

vi.mock("@aws-sdk/client-bedrock-runtime", () => ({
  BedrockRuntimeClient: vi.fn(function () { return { send: mockSend }; }),
  ConverseCommand: createCmd("ConverseCommand"),
  InvokeModelCommand: createCmd("InvokeModelCommand"),
}));

vi.mock("../../clients/aws", () => ({ create: (Ctor: any, extra?: any) => new Ctor(extra) }));

import router from "./bedrockruntime";

async function post(p: string, b?: any) {
  return router.request(p, { method: "POST", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}

beforeEach(() => mockSend.mockReset());

describe("Bedrock Runtime Routes", () => {
  it("POST /models/:modelId/converse — converse", async () => {
    mockSend.mockResolvedValueOnce({
      output: { message: { role: "assistant", content: [{ text: "Hello" }] } },
      stopReason: "end_turn",
      usage: { inputTokens: 10, outputTokens: 12, totalTokens: 22 },
      metrics: { latencyMs: 1 },
    });
    const res = await post("/models/anthropic.claude-3/converse", {
      messages: [{ role: "user", content: [{ text: "Hi" }] }],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.output.message.role).toBe("assistant");
    expect(body.stopReason).toBe("end_turn");
  });

  it("POST /models/:modelId/converse — 400 if messages missing", async () => {
    const res = await post("/models/test-model/converse", {});
    expect(res.status).toBe(400);
  });

  it("POST /models/:modelId/invoke — invoke model", async () => {
    mockSend.mockResolvedValueOnce({
      body: new TextEncoder().encode(JSON.stringify({ result: "ok" })),
      contentType: "application/json",
    });
    const res = await post("/models/test-model/invoke", { prompt: "Hello" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contentType).toBe("application/json");
  });
});
