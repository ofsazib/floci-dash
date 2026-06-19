// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.hoisted(() => vi.fn());
vi.mock("../lib/client", () => ({ api: (...args: any[]) => mockApi(...args) }));
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, useQueryClient: () => ({ invalidateQueries: vi.fn() }) };
});

import { useTextractDetectText, useTextractAnalyzeDocument } from "./useTextract";

beforeEach(() => mockApi.mockReset());

describe("useTextract hooks", () => {
  it("useTextractDetectText calls POST", async () => {
    mockApi.mockResolvedValueOnce({ blocks: [] });
    const { result } = renderHook(() => useTextractDetectText(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ document: { bytes: "base64" } });
    expect(mockApi).toHaveBeenCalledWith("/aws/textract/detect-document-text", {
      method: "POST",
      body: JSON.stringify({ document: { bytes: "base64" } }),
    });
  });

  it("useTextractAnalyzeDocument calls POST", async () => {
    mockApi.mockResolvedValueOnce({ blocks: [] });
    const { result } = renderHook(() => useTextractAnalyzeDocument(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ document: { bytes: "data" }, featureTypes: ["TABLES"] });
    expect(mockApi).toHaveBeenCalledWith("/aws/textract/analyze-document", {
      method: "POST",
      body: JSON.stringify({ document: { bytes: "data" }, featureTypes: ["TABLES"] }),
    });
  });
});
