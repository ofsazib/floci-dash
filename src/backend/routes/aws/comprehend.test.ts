import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-comprehend", () => ({
  ComprehendClient: vi.fn(function () {
    return { send: mockSend };
  }),
  DetectSentimentCommand: createCmd("DetectSentimentCommand"),
  DetectKeyPhrasesCommand: createCmd("DetectKeyPhrasesCommand"),
  DetectDominantLanguageCommand: createCmd("DetectDominantLanguageCommand"),
  DetectPiiEntitiesCommand: createCmd("DetectPiiEntitiesCommand"),
  ContainsPiiEntitiesCommand: createCmd("ContainsPiiEntitiesCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./comprehend";

async function post(path: string, body?: any) {
  return router.request(path, {
    method: "POST",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

beforeEach(() => {
  mockSend.mockReset();
});

describe("Comprehend routes", () => {
  it("detects sentiment", async () => {
    mockSend.mockResolvedValueOnce({
      Sentiment: "NEUTRAL",
      SentimentScore: { Positive: 0.1, Negative: 0.1, Neutral: 0.7, Mixed: 0.1 },
    });
    const res = await post("/detect-sentiment", { text: "hello", languageCode: "en" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sentiment).toBe("NEUTRAL");
    expect(json.sentimentScore.Neutral).toBe(0.7);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DetectSentimentCommand");
    expect(cmd.Text).toBe("hello");
    expect(cmd.LanguageCode).toBe("en");
  });

  it("detect-sentiment rejects missing text", async () => {
    const res = await post("/detect-sentiment", { languageCode: "en" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("text is required");
  });

  it("detect-sentiment rejects missing languageCode", async () => {
    const res = await post("/detect-sentiment", { text: "hello" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("languageCode is required");
  });

  it("detect-sentiment falls back to nulls on empty result", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/detect-sentiment", { text: "hello", languageCode: "en" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sentiment).toBeNull();
    expect(json.sentimentScore).toBeNull();
  });

  it("detects key phrases", async () => {
    mockSend.mockResolvedValueOnce({
      KeyPhrases: [{ Score: 0.99, Text: "Floci", BeginOffset: 0, EndOffset: 5 }],
    });
    const res = await post("/detect-key-phrases", { text: "I love Floci", languageCode: "en" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.keyPhrases).toEqual([
      { score: 0.99, text: "Floci", beginOffset: 0, endOffset: 5 },
    ]);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DetectKeyPhrasesCommand");
    expect(cmd.Text).toBe("I love Floci");
    expect(cmd.LanguageCode).toBe("en");
  });

  it("detect-key-phrases rejects missing text", async () => {
    const res = await post("/detect-key-phrases", { languageCode: "en" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("text is required");
  });

  it("detect-key-phrases rejects missing languageCode", async () => {
    const res = await post("/detect-key-phrases", { text: "hello" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("languageCode is required");
  });

  it("detect-key-phrases falls back to empty array", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/detect-key-phrases", { text: "hello", languageCode: "en" });
    expect(res.status).toBe(200);
    expect((await res.json()).keyPhrases).toEqual([]);
  });

  it("detects dominant language", async () => {
    mockSend.mockResolvedValueOnce({
      Languages: [{ LanguageCode: "en", Score: 0.99 }],
    });
    const res = await post("/detect-dominant-language", { text: "bonjour tout le monde" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.languages).toEqual([{ languageCode: "en", score: 0.99 }]);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DetectDominantLanguageCommand");
    expect(cmd.Text).toBe("bonjour tout le monde");
    expect(cmd.LanguageCode).toBeUndefined();
  });

  it("detect-dominant-language rejects missing text", async () => {
    const res = await post("/detect-dominant-language", {});
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("text is required");
  });

  it("detect-dominant-language falls back to empty array", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/detect-dominant-language", { text: "hello" });
    expect(res.status).toBe(200);
    expect((await res.json()).languages).toEqual([]);
  });

  it("detects PII entities", async () => {
    mockSend.mockResolvedValueOnce({
      Entities: [{ Score: 0.99, Type: "EMAIL", BeginOffset: 0, EndOffset: 11 }],
    });
    const res = await post("/detect-pii-entities", {
      text: "mail me at a@b.co",
      languageCode: "en",
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.entities).toEqual([
      { score: 0.99, type: "EMAIL", beginOffset: 0, endOffset: 11 },
    ]);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DetectPiiEntitiesCommand");
    expect(cmd.Text).toBe("mail me at a@b.co");
    expect(cmd.LanguageCode).toBe("en");
  });

  it("detect-pii-entities rejects missing text", async () => {
    const res = await post("/detect-pii-entities", { languageCode: "en" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("text is required");
  });

  it("detect-pii-entities rejects missing languageCode", async () => {
    const res = await post("/detect-pii-entities", { text: "hello" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("languageCode is required");
  });

  it("detect-pii-entities falls back to empty array", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/detect-pii-entities", { text: "hello", languageCode: "en" });
    expect(res.status).toBe(200);
    expect((await res.json()).entities).toEqual([]);
  });

  it("checks whether text contains PII labels", async () => {
    mockSend.mockResolvedValueOnce({
      Labels: [{ Name: "EMAIL", Score: 0.99 }],
    });
    const res = await post("/contains-pii-entities", {
      text: "mail me at a@b.co",
      languageCode: "en",
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.labels).toEqual([{ name: "EMAIL", score: 0.99 }]);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("ContainsPiiEntitiesCommand");
    expect(cmd.Text).toBe("mail me at a@b.co");
    expect(cmd.LanguageCode).toBe("en");
  });

  it("contains-pii-entities rejects missing text", async () => {
    const res = await post("/contains-pii-entities", { languageCode: "en" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("text is required");
  });

  it("contains-pii-entities rejects missing languageCode", async () => {
    const res = await post("/contains-pii-entities", { text: "hello" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("languageCode is required");
  });

  it("contains-pii-entities falls back to empty array", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/contains-pii-entities", { text: "hello", languageCode: "en" });
    expect(res.status).toBe(200);
    expect((await res.json()).labels).toEqual([]);
  });
});
