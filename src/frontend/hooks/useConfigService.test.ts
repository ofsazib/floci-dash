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
  useAggregationAuthorizations,
  usePutAggregationAuthorization,
  useDeleteAggregationAuthorization,
  useRetentionConfigurations,
  usePutRetentionConfiguration,
  useDeleteRetentionConfiguration,
  useDeleteDeliveryChannel,
  useDeleteEvaluationResults,
  useComplianceByResource,
  useComplianceDetailsByConfigRule,
  useComplianceDetailsByResource,
  useComplianceSummaryByConfigRule,
  useComplianceSummaryByResourceType,
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

// ── Aggregation Authorizations ──────────────────────────

describe("useAggregationAuthorizations", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ authorizations: [], total: 0 });
    const { result } = renderHook(() => useAggregationAuthorizations(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/config/aggregation-authorizations");
  });
});

describe("usePutAggregationAuthorization", () => {
  it("posts account id and region", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => usePutAggregationAuthorization(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ authorizedAccountId: "111", authorizedAwsRegion: "us-west-2" });
    expect(mockApi).toHaveBeenCalledWith("/aws/config/aggregation-authorizations", {
      method: "POST",
      body: JSON.stringify({ authorizedAccountId: "111", authorizedAwsRegion: "us-west-2" }),
    });
  });
});

describe("useDeleteAggregationAuthorization", () => {
  it("sends DELETE with account id and region", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteAggregationAuthorization(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ authorizedAccountId: "111", authorizedAwsRegion: "us-west-2" });
    expect(mockApi).toHaveBeenCalledWith("/aws/config/aggregation-authorizations", {
      method: "DELETE",
      body: JSON.stringify({ authorizedAccountId: "111", authorizedAwsRegion: "us-west-2" }),
    });
  });
});

// ── Retention Configurations ────────────────────────────

describe("useRetentionConfigurations", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ retentionConfigurations: [], total: 0 });
    const { result } = renderHook(() => useRetentionConfigurations(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/config/retention-configurations");
  });
});

describe("usePutRetentionConfiguration", () => {
  it("puts retention period in days", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => usePutRetentionConfiguration(), { wrapper: createWrapper() });
    await result.current.mutateAsync(365);
    expect(mockApi).toHaveBeenCalledWith("/aws/config/retention-configurations", {
      method: "PUT",
      body: JSON.stringify({ retentionPeriodInDays: 365 }),
    });
  });
});

describe("useDeleteRetentionConfiguration", () => {
  it("sends DELETE with encoded name", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteRetentionConfiguration(), { wrapper: createWrapper() });
    await result.current.mutateAsync("default");
    expect(mockApi).toHaveBeenCalledWith("/aws/config/retention-configurations/default", { method: "DELETE" });
  });
});

// ── Delivery Channel / Evaluation Results ───────────────

describe("useDeleteDeliveryChannel", () => {
  it("sends DELETE with encoded name", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteDeliveryChannel(), { wrapper: createWrapper() });
    await result.current.mutateAsync("default");
    expect(mockApi).toHaveBeenCalledWith("/aws/config/delivery-channels/default", { method: "DELETE" });
  });
});

describe("useDeleteEvaluationResults", () => {
  it("sends DELETE for rule evaluation results", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteEvaluationResults(), { wrapper: createWrapper() });
    await result.current.mutateAsync("rule-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/config/rules/rule-1/evaluation-results", { method: "DELETE" });
  });
});

// ── Compliance ──────────────────────────────────────────

describe("useComplianceByResource", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ compliance: [], total: 0 });
    const { result } = renderHook(() => useComplianceByResource(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/config/compliance-by-resource");
  });
});

describe("useComplianceDetailsByConfigRule", () => {
  it("does not call api when rule name is null", async () => {
    const { result } = renderHook(() => useComplianceDetailsByConfigRule(null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded rule name", async () => {
    mockApi.mockResolvedValueOnce({ evaluationResults: [], total: 0 });
    const { result } = renderHook(() => useComplianceDetailsByConfigRule("rule one"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/config/compliance-details/by-rule/rule%20one");
  });
});

describe("useComplianceDetailsByResource", () => {
  it("does not call api when resource type is null", async () => {
    const { result } = renderHook(() => useComplianceDetailsByResource(null, "i-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("does not call api when resource id is null", async () => {
    const { result } = renderHook(() => useComplianceDetailsByResource("AWS::EC2::Instance", null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded query parameters", async () => {
    mockApi.mockResolvedValueOnce({ evaluationResults: [], total: 0 });
    const { result } = renderHook(() => useComplianceDetailsByResource("AWS::EC2::Instance", "i-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/config/compliance-details/by-resource?resourceType=AWS%3A%3AEC2%3A%3AInstance&resourceId=i-1");
  });
});

describe("useComplianceSummaryByConfigRule", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ complianceSummary: null });
    const { result } = renderHook(() => useComplianceSummaryByConfigRule(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/config/compliance-summary/by-config-rule");
  });
});

describe("useComplianceSummaryByResourceType", () => {
  it("does not call api when resource types is null", async () => {
    const { result } = renderHook(() => useComplianceSummaryByResourceType(null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded resource types", async () => {
    mockApi.mockResolvedValueOnce({ summaries: [], total: 0 });
    const { result } = renderHook(() => useComplianceSummaryByResourceType("AWS::EC2::Instance"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/config/compliance-summary/by-resource-type?resourceTypes=AWS%3A%3AEC2%3A%3AInstance");
  });
});
