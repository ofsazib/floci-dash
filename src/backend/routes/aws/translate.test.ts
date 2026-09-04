import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-translate", () => ({
  TranslateClient: vi.fn(function () {
    return { send: mockSend };
  }),
  TranslateTextCommand: createCmd("TranslateTextCommand"),
  TranslateDocumentCommand: createCmd("TranslateDocumentCommand"),
  ListLanguagesCommand: createCmd("ListLanguagesCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./translate";

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
  mockSend.mockReset();
});

describe("Translate routes", () => {
  it("lists supported languages", async () => {
    mockSend.mockResolvedValueOnce({
      Languages: [
        { LanguageCode: "en", LanguageName: "English" },
        { LanguageCode: "fr", LanguageName: "French" },
      ],
      DisplayLanguageCode: "en",
    });
    const res = await get("/languages");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.languages).toHaveLength(2);
    expect(json.languages[0].languageCode).toBe("en");
    expect(json.languages[0].languageName).toBe("English");
    expect(json.displayLanguageCode).toBe("en");
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "ListLanguagesCommand",
      DisplayLanguageCode: undefined,
    });
  });

  it("forwards display language code to ListLanguages", async () => {
    mockSend.mockResolvedValueOnce({ Languages: [] });
    const res = await get("/languages?displayLanguageCode=de");
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "ListLanguagesCommand",
      DisplayLanguageCode: "de",
    });
    expect((await res.json()).displayLanguageCode).toBe("en");
  });

  it("returns empty languages when list absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/languages");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ languages: [], displayLanguageCode: "en" });
  });

  it("translates text", async () => {
    mockSend.mockResolvedValueOnce({
      TranslatedText: "Bonjour",
      SourceLanguageCode: "en",
      TargetLanguageCode: "fr",
      AppliedTerminologies: [{ Name: "t1" }],
    });
    const res = await post("/translate-text", {
      text: "Hello",
      sourceLanguageCode: "en",
      targetLanguageCode: "fr",
      terminologyNames: ["t1"],
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.translatedText).toBe("Bonjour");
    expect(json.sourceLanguageCode).toBe("en");
    expect(json.targetLanguageCode).toBe("fr");
    expect(json.appliedTerminologies).toHaveLength(1);
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "TranslateTextCommand",
      Text: "Hello",
      SourceLanguageCode: "en",
      TargetLanguageCode: "fr",
      TerminologyNames: ["t1"],
    });
  });

  it("translates text without terminologies", async () => {
    mockSend.mockResolvedValueOnce({ TranslatedText: "Hi" });
    const res = await post("/translate-text", {
      text: "Hello",
      sourceLanguageCode: "auto",
      targetLanguageCode: "de",
    });
    expect(res.status).toBe(200);
    expect((await res.json()).appliedTerminologies).toEqual([]);
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      TerminologyNames: undefined,
    });
  });

  it("translates a document and decodes the returned content", async () => {
    const content = "<html><body>Hello</body></html>";
    mockSend.mockResolvedValueOnce({
      TranslatedDocument: { Content: Buffer.from(content, "utf8"), ContentType: "text/html" },
      SourceLanguageCode: "en",
      TargetLanguageCode: "fr",
    });
    const res = await post("/translate-document", {
      content,
      contentType: "text/html",
      sourceLanguageCode: "en",
      targetLanguageCode: "fr",
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.translatedDocument).toBe(content);
    expect(json.sourceLanguageCode).toBe("en");
    expect(json.targetLanguageCode).toBe("fr");
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "TranslateDocumentCommand",
      SourceLanguageCode: "en",
      TargetLanguageCode: "fr",
    });
    expect(mockSend.mock.calls[0][0].Document).toMatchObject({ ContentType: "text/html" });
  });

  it("returns null document content when absent", async () => {
    mockSend.mockResolvedValueOnce({ TranslatedDocument: {} });
    const res = await post("/translate-document", {
      content: "Hello",
      contentType: "text/plain",
      sourceLanguageCode: "en",
      targetLanguageCode: "fr",
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      translatedDocument: null,
      sourceLanguageCode: undefined,
      targetLanguageCode: undefined,
    });
  });

  // ── Validation ──────────────────────────────
  it("rejects translate-text without text", async () => {
    const res = await post("/translate-text", { sourceLanguageCode: "en", targetLanguageCode: "fr" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "text is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejects translate-text without source language", async () => {
    const res = await post("/translate-text", { text: "Hello", targetLanguageCode: "fr" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "sourceLanguageCode is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejects translate-text without target language", async () => {
    const res = await post("/translate-text", { text: "Hello", sourceLanguageCode: "en" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "targetLanguageCode is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejects translate-document without content", async () => {
    const res = await post("/translate-document", { contentType: "text/plain", sourceLanguageCode: "en", targetLanguageCode: "fr" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "content is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejects translate-document without contentType", async () => {
    const res = await post("/translate-document", { content: "Hello", sourceLanguageCode: "en", targetLanguageCode: "fr" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "contentType is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejects translate-document without source language", async () => {
    const res = await post("/translate-document", { content: "Hello", contentType: "text/plain", targetLanguageCode: "fr" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "sourceLanguageCode is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejects translate-document without target language", async () => {
    const res = await post("/translate-document", { content: "Hello", contentType: "text/plain", sourceLanguageCode: "en" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "targetLanguageCode is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });
});
