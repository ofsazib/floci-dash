// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useComprehendDetectSentiment,
  useComprehendDetectKeyPhrases,
  useComprehendDetectDominantLanguage,
  useComprehendDetectPiiEntities,
  useComprehendContainsPiiEntities,
} from "./useComprehend";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Comprehend mutation hooks", () => {
  it("detect-sentiment posts text and languageCode", async () => {
    mockApi.mockResolvedValueOnce({ sentiment: "NEUTRAL" });
    const { result } = renderHook(() => useComprehendDetectSentiment(), { wrapper: createWrapper() });
    result.current.mutate({ text: "hello", languageCode: "en" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/comprehend/detect-sentiment", {
      method: "POST",
      body: JSON.stringify({ text: "hello", languageCode: "en" }),
    });
  });

  it("detect-key-phrases posts text and languageCode", async () => {
    mockApi.mockResolvedValueOnce({ keyPhrases: [] });
    const { result } = renderHook(() => useComprehendDetectKeyPhrases(), { wrapper: createWrapper() });
    result.current.mutate({ text: "I love Floci", languageCode: "en" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/comprehend/detect-key-phrases", {
      method: "POST",
      body: JSON.stringify({ text: "I love Floci", languageCode: "en" }),
    });
  });

  it("detect-dominant-language posts text only", async () => {
    mockApi.mockResolvedValueOnce({ languages: [] });
    const { result } = renderHook(() => useComprehendDetectDominantLanguage(), { wrapper: createWrapper() });
    result.current.mutate({ text: "bonjour" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/comprehend/detect-dominant-language", {
      method: "POST",
      body: JSON.stringify({ text: "bonjour" }),
    });
  });

  it("detect-pii-entities posts text and languageCode", async () => {
    mockApi.mockResolvedValueOnce({ entities: [] });
    const { result } = renderHook(() => useComprehendDetectPiiEntities(), { wrapper: createWrapper() });
    result.current.mutate({ text: "mail me at a@b.co", languageCode: "en" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/comprehend/detect-pii-entities", {
      method: "POST",
      body: JSON.stringify({ text: "mail me at a@b.co", languageCode: "en" }),
    });
  });

  it("contains-pii-entities posts text and languageCode", async () => {
    mockApi.mockResolvedValueOnce({ labels: [] });
    const { result } = renderHook(() => useComprehendContainsPiiEntities(), { wrapper: createWrapper() });
    result.current.mutate({ text: "mail me at a@b.co", languageCode: "en" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/comprehend/contains-pii-entities", {
      method: "POST",
      body: JSON.stringify({ text: "mail me at a@b.co", languageCode: "en" }),
    });
  });
});
