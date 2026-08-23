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
  useConformancePackStatuses,
  useComplianceByConfigRule,
  useConfigRuleEvaluationStatus,
  useStartConfigRulesEvaluation,
  useConfigTags,
  useAddConfigTags,
  useRemoveConfigTags,
} from "./useConfigService";

beforeEach(() => mockApi.mockReset());

describe("useConfigService hooks", () => {
  it("useConfigRules calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ rules: [], total: 0 });
    const { result } = renderHook(() => useConfigRules(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/config/rules");
  });

  it("usePutConfigRule calls POST", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => usePutConfigRule(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ configRuleName: "rule-1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/config/rules", {
      method: "POST",
      body: JSON.stringify({ configRuleName: "rule-1" }),
    });
  });

  it("useDeleteConfigRule calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteConfigRule(), { wrapper: createWrapper() });
    await result.current.mutateAsync("rule-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/config/rules/rule-1", { method: "DELETE" });
  });

  it("useConfigRecorders calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ recorders: [], total: 0 });
    const { result } = renderHook(() => useConfigRecorders(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/config/recorders");
  });

  it("useConfigRecorderStatuses calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ statuses: [], total: 0 });
    const { result } = renderHook(() => useConfigRecorderStatuses(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/config/recorders/status");
  });

  it("useConformancePacks calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ conformancePacks: [], total: 0 });
    const { result } = renderHook(() => useConformancePacks(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/config/conformance-packs");
  });

  it("useDeleteConformancePack calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteConformancePack(), { wrapper: createWrapper() });
    await result.current.mutateAsync("pack-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/config/conformance-packs/pack-1", { method: "DELETE" });
  });

  // ── Conformance Pack Status ──────────────────────────

  it("useConformancePackStatuses calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ statuses: [], total: 0 });
    const { result } = renderHook(() => useConformancePackStatuses(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/config/conformance-packs/status");
  });

  // ── Compliance & Evaluation ──────────────────────────

  it("useComplianceByConfigRule calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ compliance: [], total: 0 });
    const { result } = renderHook(() => useComplianceByConfigRule(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/config/rules/compliance");
  });

  it("useConfigRuleEvaluationStatus calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ statuses: [], total: 0 });
    const { result } = renderHook(() => useConfigRuleEvaluationStatus(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/config/rules/evaluation-status");
  });

  it("useStartConfigRulesEvaluation calls POST", async () => {
    mockApi.mockResolvedValueOnce({ started: true });
    const { result } = renderHook(() => useStartConfigRulesEvaluation(), { wrapper: createWrapper() });
    await result.current.mutateAsync(["rule-1"]);
    expect(mockApi).toHaveBeenCalledWith("/aws/config/rules/evaluate", {
      method: "POST",
      body: JSON.stringify({ ruleNames: ["rule-1"] }),
    });
  });

  it("useStartConfigRulesEvaluation calls POST with no rule names", async () => {
    mockApi.mockResolvedValueOnce({ started: true });
    const { result } = renderHook(() => useStartConfigRulesEvaluation(), { wrapper: createWrapper() });
    await result.current.mutateAsync(undefined);
    expect(mockApi).toHaveBeenCalledWith("/aws/config/rules/evaluate", {
      method: "POST",
      body: JSON.stringify({}),
    });
  });
});

describe("useConfigTags", () => {
  it("fetches tags with encoded arn", async () => {
    mockApi.mockResolvedValueOnce({ tags: [{ key: "env", value: "prod" }] });
    const { result } = renderHook(() => useConfigTags("arn:aws:config:rule-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/config/tags?arn=arn%3Aaws%3Aconfig%3Arule-1");
    expect(result.current.data?.tags).toEqual([{ key: "env", value: "prod" }]);
  });

  it("is disabled when arn is null", () => {
    const { result } = renderHook(() => useConfigTags(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useAddConfigTags", () => {
  it("posts tags", async () => {
    mockApi.mockResolvedValueOnce({ tagged: true });
    const { result } = renderHook(() => useAddConfigTags(), { wrapper: createWrapper() });
    result.current.mutate({ arn: "arn:x", tags: { env: "prod" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/config/tags", {
      method: "POST",
      body: JSON.stringify({ arn: "arn:x", tags: { env: "prod" } }),
    });
  });
});

describe("useRemoveConfigTags", () => {
  it("posts untag with tag keys", async () => {
    mockApi.mockResolvedValueOnce({ untagged: true });
    const { result } = renderHook(() => useRemoveConfigTags(), { wrapper: createWrapper() });
    result.current.mutate({ arn: "arn:x", tagKeys: ["env"] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/config/tags/untag", {
      method: "POST",
      body: JSON.stringify({ arn: "arn:x", tagKeys: ["env"] }),
    });
  });
});
