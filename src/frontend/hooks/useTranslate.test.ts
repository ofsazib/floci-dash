// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import { useTranslateLanguages, useTranslateText, useTranslateDocument } from "./useTranslate";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Translate hooks", () => {
  it("useTranslateLanguages fetches the language catalog", async () => {
    mockApi.mockResolvedValueOnce({ languages: [{ languageCode: "en" }], displayLanguageCode: "en" });
    const { result } = renderHook(() => useTranslateLanguages(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/translate/languages");
  });

  it("useTranslateText posts text to translate", async () => {
    mockApi.mockResolvedValueOnce({ translatedText: "Bonjour" });
    const body = { text: "Hello", sourceLanguageCode: "en", targetLanguageCode: "fr" };
    const { result } = renderHook(() => useTranslateText(), { wrapper: createWrapper() });
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/translate/translate-text", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });

  it("useTranslateDocument posts document content to translate", async () => {
    mockApi.mockResolvedValueOnce({ translatedDocument: "<p>Bonjour</p>" });
    const body = {
      content: "<p>Hello</p>",
      contentType: "text/html",
      sourceLanguageCode: "en",
      targetLanguageCode: "fr",
    };
    const { result } = renderHook(() => useTranslateDocument(), { wrapper: createWrapper() });
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/translate/translate-document", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });
});
