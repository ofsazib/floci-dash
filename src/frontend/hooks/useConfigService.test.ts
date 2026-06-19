// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.hoisted(() => vi.fn());
vi.mock("../lib/client", () => ({ api: (...args: any[]) => mockApi(...args) }));
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, useQueryClient: () => ({ invalidateQueries: vi.fn() }) };
});

import {
  useConfigRules,
  usePutConfigRule,
  useDeleteConfigRule,
  useConfigRecorders,
  useConfigRecorderStatuses,
  useConformancePacks,
  useDeleteConformancePack,
} from "./useConfigService";

beforeEach(() => mockApi.mockReset());

describe("useConfigService hooks", () => {
  it("useConfigRules calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ rules: [], total: 0 });
    const { result } = renderHook(() => useConfigRules(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/configservice/rules");
  });

  it("usePutConfigRule calls POST", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => usePutConfigRule(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ configRuleName: "rule-1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/configservice/rules", {
      method: "POST",
      body: JSON.stringify({ configRuleName: "rule-1" }),
    });
  });

  it("useDeleteConfigRule calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteConfigRule(), { wrapper: createWrapper() });
    await result.current.mutateAsync("rule-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/configservice/rules/rule-1", { method: "DELETE" });
  });

  it("useConfigRecorders calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ recorders: [], total: 0 });
    const { result } = renderHook(() => useConfigRecorders(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/configservice/recorders");
  });

  it("useConfigRecorderStatuses calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ statuses: [], total: 0 });
    const { result } = renderHook(() => useConfigRecorderStatuses(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/configservice/recorders/status");
  });

  it("useConformancePacks calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ conformancePacks: [], total: 0 });
    const { result } = renderHook(() => useConformancePacks(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/configservice/conformance-packs");
  });

  it("useDeleteConformancePack calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteConformancePack(), { wrapper: createWrapper() });
    await result.current.mutateAsync("pack-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/configservice/conformance-packs/pack-1", { method: "DELETE" });
  });
});
