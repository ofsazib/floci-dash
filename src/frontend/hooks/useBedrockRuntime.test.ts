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

import { useBedrockConverse, useBedrockInvokeModel } from "./useBedrockRuntime";

beforeEach(() => mockApi.mockReset());

describe("useBedrockRuntime hooks", () => {
  it("useBedrockConverse calls POST", async () => {
    mockApi.mockResolvedValueOnce({ output: {} });
    const { result } = renderHook(() => useBedrockConverse("anthropic.claude-3"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ messages: [{ role: "user", content: [{ text: "Hi" }] }] });
    expect(mockApi).toHaveBeenCalledWith("/aws/bedrockruntime/models/anthropic.claude-3/converse", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: [{ text: "Hi" }] }] }),
    });
  });

  it("useBedrockInvokeModel calls POST", async () => {
    mockApi.mockResolvedValueOnce({ body: {} });
    const { result } = renderHook(() => useBedrockInvokeModel("test-model"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ prompt: "Hello" });
    expect(mockApi).toHaveBeenCalledWith("/aws/bedrockruntime/models/test-model/invoke", {
      method: "POST",
      body: JSON.stringify({ prompt: "Hello" }),
    });
  });
});
