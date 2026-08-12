// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock ConfirmDialog ─────────────────────────────────

vi.mock("../../components/ConfirmDialog", () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn(() => Promise.resolve(true)),
    dialog: null,
  }),
}));

// ─── Mock hooks ─────────────────────────────────────────

const mockRules = vi.fn();
const mockRecorders = vi.fn();
const mockPacks = vi.fn();
const mockDeleteRule = vi.fn();
const mockDeletePack = vi.fn();
const mockCompliance = vi.fn();
const mockEvalStatus = vi.fn();
const mockPackStatuses = vi.fn();
const mockRecorderStatuses = vi.fn();
const mockStartEval = vi.fn();

vi.mock("../../hooks/useConfigService", () => ({
  useConfigRules: (...args: any[]) => mockRules(...args),
  useConfigRecorders: (...args: any[]) => mockRecorders(...args),
  useConformancePacks: (...args: any[]) => mockPacks(...args),
  usePutConfigRule: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteConfigRule: () => ({
    mutateAsync: mockDeleteRule,
    isPending: false,
    variables: null,
  }),
  useDeleteConformancePack: () => ({
    mutateAsync: mockDeletePack,
    isPending: false,
    variables: null,
  }),
  useConfigRecorderStatuses: (...args: any[]) => mockRecorderStatuses(...args),
  useConformancePackStatuses: (...args: any[]) => mockPackStatuses(...args),
  useComplianceByConfigRule: (...args: any[]) => mockCompliance(...args),
  useConfigRuleEvaluationStatus: (...args: any[]) => mockEvalStatus(...args),
  useStartConfigRulesEvaluation: () => ({
    mutate: vi.fn(),
    mutateAsync: mockStartEval,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
}));

import { ConfigServiceDashboard } from "./ConfigServiceDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  mockRules.mockReturnValue({
    data: { rules: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockRecorders.mockReturnValue({
    data: { recorders: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockPacks.mockReturnValue({
    data: { conformancePacks: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockCompliance.mockReturnValue({
    data: { compliance: [], total: 0 },
    isLoading: false,
  });
  mockEvalStatus.mockReturnValue({
    data: { statuses: [], total: 0 },
    isLoading: false,
  });
  mockPackStatuses.mockReturnValue({
    data: { statuses: [], total: 0 },
    isLoading: false,
  });
  mockRecorderStatuses.mockReturnValue({
    data: { statuses: [], total: 0 },
    isLoading: false,
  });
  mockStartEval.mockResolvedValue({});
});

// ─── Tests ──────────────────────────────────────────────

describe("ConfigServiceDashboard — rendering", () => {
  it("shows loading skeleton when loading", () => {
    mockRules.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows all 4 tabs", () => {
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("tab", { name: /config rules/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /recorders/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /conformance packs/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /advanced/i })).toBeTruthy();
  });

  it("shows empty message for rules (first tab by default)", () => {
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No config rules/)).toBeTruthy();
  });
});

describe("ConfigServiceDashboard — Config Rules tab", () => {
  it("renders rules with data", () => {
    mockRules.mockReturnValue({
      data: {
        rules: [
          {
            ConfigRuleName: "required-tags",
            ConfigRuleState: "ACTIVE",
            Source: { Owner: "AWS", SourceIdentifier: "required-tags" },
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    expect(screen.getAllByText("required-tags").length).toBeGreaterThan(0);
    expect(screen.getByText("ACTIVE")).toBeTruthy();
    expect(screen.getByText("AWS")).toBeTruthy();
  });

  it("deletes a rule", async () => {
    const user = userEvent.setup();
    mockRules.mockReturnValue({
      data: {
        rules: [
          {
            ConfigRuleName: "required-tags",
            ConfigRuleState: "ACTIVE",
            Source: { Owner: "AWS", SourceIdentifier: "required-tags" },
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    const deleteBtn = screen.getByRole("button", { name: /Delete required-tags/i });
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(mockDeleteRule).toHaveBeenCalledWith("required-tags");
    });
  });

  it("renders rules with null/undefined fields", () => {
    mockRules.mockReturnValue({
      data: {
        rules: [
          {
            ConfigRuleName: "minimal-rule",
            // no ConfigRuleState, no Source
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("minimal-rule")).toBeTruthy();
    // State should default to "ACTIVE", owner/source should be "-"
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2);
  });

  it("renders rules with empty rules array when data is null", () => {
    mockRules.mockReturnValue({
      data: null,
      isLoading: false,
    });
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No config rules/)).toBeTruthy();
  });
});

describe("ConfigServiceDashboard — Recorders tab", () => {
  it("switches to Recorders tab and shows empty message", async () => {
    const user = userEvent.setup();
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /recorders/i }));
    await waitFor(() => {
      expect(screen.getByText(/No configuration recorders/)).toBeTruthy();
    });
  });

  it("renders recorders with data", async () => {
    const user = userEvent.setup();
    mockRecorders.mockReturnValue({
      data: {
        recorders: [
          {
            name: "default-recorder",
            roleARN: "arn:aws:iam::123:role/config-role",
            recordingGroup: { allSupported: true },
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /recorders/i }));
    await waitFor(() => {
      expect(screen.getByText("default-recorder")).toBeTruthy();
      expect(screen.getByText("Yes")).toBeTruthy();
    });
  });

  it("shows 'No' for allSupported when not enabled", async () => {
    const user = userEvent.setup();
    mockRecorders.mockReturnValue({
      data: {
        recorders: [
          { name: "minimal-recorder", roleARN: "arn:aws:iam::123:role/test", recordingGroup: { allSupported: false } },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /recorders/i }));
    await waitFor(() => {
      expect(screen.getAllByText("No").length).toBeGreaterThan(0);
    });
  });
});

describe("ConfigServiceDashboard — Conformance Packs tab", () => {
  it("switches to Conformance Packs tab and shows empty message", async () => {
    const user = userEvent.setup();
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /conformance packs/i }));
    await waitFor(() => {
      expect(screen.getByText(/No conformance packs/)).toBeTruthy();
    });
  });

  it("renders conformance packs with data", async () => {
    const user = userEvent.setup();
    mockPacks.mockReturnValue({
      data: {
        conformancePacks: [
          {
            ConformancePackName: "my-pack",
            ConformancePackId: "pack-123",
            ConformancePackArn: "arn:aws:config:us-east-1:123:conformance-pack/my-pack",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /conformance packs/i }));
    await waitFor(() => {
      expect(screen.getByText("my-pack")).toBeTruthy();
      expect(screen.getByText("pack-123")).toBeTruthy();
    });
  });

  it("deletes a conformance pack", async () => {
    const user = userEvent.setup();
    mockPacks.mockReturnValue({
      data: {
        conformancePacks: [
          {
            ConformancePackName: "my-pack",
            ConformancePackId: "pack-123",
            ConformancePackArn: "arn:aws:config:us-east-1:123:conformance-pack/my-pack",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /conformance packs/i }));
    await waitFor(() => {
      expect(screen.getByText("my-pack")).toBeTruthy();
    });
    const deleteBtn = screen.getByRole("button", { name: /Delete my-pack/i });
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(mockDeletePack).toHaveBeenCalledWith("my-pack");
    });
  });

  it("renders packs with null/undefined fields", async () => {
    const user = userEvent.setup();
    mockPacks.mockReturnValue({
      data: {
        conformancePacks: [
          { ConformancePackName: "minimal-pack" },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /conformance packs/i }));
    await waitFor(() => {
      expect(screen.getByText("minimal-pack")).toBeTruthy();
    });
  });
});

describe("ConfigServiceDashboard — Advanced tab", () => {
  it("switches to Advanced tab and shows compliance table", async () => {
    const user = userEvent.setup();
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/Compliance by Config Rule/)).toBeTruthy();
    });
  });

  it("shows empty compliance message", async () => {
    const user = userEvent.setup();
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/No compliance data/)).toBeTruthy();
    });
  });

  it("shows Evaluate All Rules button", async () => {
    const user = userEvent.setup();
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Evaluate All Rules/i })).toBeTruthy();
    });
  });

  it("shows Rule Evaluation Status table", async () => {
    const user = userEvent.setup();
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/Rule Evaluation Status/)).toBeTruthy();
    });
  });

  it("shows Conformance Pack Status table", async () => {
    const user = userEvent.setup();
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/Conformance Pack Status/)).toBeTruthy();
    });
  });

  it("shows Configuration Recorder Status table", async () => {
    const user = userEvent.setup();
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/Configuration Recorder Status/)).toBeTruthy();
    });
  });

  it("shows empty evaluation status", async () => {
    const user = userEvent.setup();
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/No evaluation status/)).toBeTruthy();
    });
  });

  it("shows empty pack status", async () => {
    const user = userEvent.setup();
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/No pack status/)).toBeTruthy();
    });
  });

  it("shows empty recorder status", async () => {
    const user = userEvent.setup();
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/No recorder status/)).toBeTruthy();
    });
  });

  it("renders compliance data with COMPLIANT and NON_COMPLIANT statuses", async () => {
    const user = userEvent.setup();
    mockCompliance.mockReturnValue({
      data: {
        compliance: [
          { ConfigRuleName: "good-rule", Compliance: { ComplianceType: "COMPLIANT" } },
          { ConfigRuleName: "bad-rule", Compliance: { ComplianceType: "NON_COMPLIANT", ContributorCount: { CappedCount: 5 } } },
        ],
        total: 2,
      },
      isLoading: false,
    });
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("good-rule")).toBeTruthy();
      expect(screen.getByText("bad-rule")).toBeTruthy();
      expect(screen.getByText("COMPLIANT")).toBeTruthy();
      expect(screen.getByText("NON_COMPLIANT")).toBeTruthy();
      expect(screen.getByText("5")).toBeTruthy();
    });
  });

  it("renders evaluation status with SUCCEEDED", async () => {
    const user = userEvent.setup();
    mockEvalStatus.mockReturnValue({
      data: {
        statuses: [
          { ConfigRuleName: "eval-rule", LastStatus: "SUCCEEDED", LastSuccessfulInvocationTime: "2025-01-15T00:00:00Z", LastErrorMessage: "" },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("eval-rule")).toBeTruthy();
      expect(screen.getByText("SUCCEEDED")).toBeTruthy();
    });
  });

  it("renders pack status with CREATE_COMPLETE and CREATE_FAILED", async () => {
    const user = userEvent.setup();
    mockPackStatuses.mockReturnValue({
      data: {
        statuses: [
          { ConformancePackName: "good-pack", ConformancePackState: "CREATE_COMPLETE", LastUpdateTime: "2025-01-15T00:00:00Z" },
          { ConformancePackName: "bad-pack", ConformancePackState: "CREATE_FAILED", ConformancePackStatusReason: "S3 error" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("good-pack")).toBeTruthy();
      expect(screen.getByText("bad-pack")).toBeTruthy();
      expect(screen.getByText("CREATE_COMPLETE")).toBeTruthy();
      expect(screen.getByText("CREATE_FAILED")).toBeTruthy();
    });
  });

  it("renders recorder status with recording Yes", async () => {
    const user = userEvent.setup();
    mockRecorderStatuses.mockReturnValue({
      data: {
        statuses: [
          { name: "rec1", recording: true, lastStatus: "Success", lastStartTime: "2025-01-15T00:00:00Z" },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("rec1")).toBeTruthy();
      expect(screen.getByText("Yes")).toBeTruthy();
      expect(screen.getByText("Success")).toBeTruthy();
    });
  });

  it("clicks Evaluate All Rules button", async () => {
    mockStartEval.mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    const btn = screen.getByRole("button", { name: /Evaluate All Rules/i });
    await user.click(btn);
    await waitFor(() => {
      expect(mockStartEval).toHaveBeenCalled();
    });
  });

  // ─── Compliance: warning status (INSUFFICIENT_DATA) ──

  it("shows warning indicator for INSUFFICIENT_DATA compliance", async () => {
    const user = userEvent.setup();
    mockCompliance.mockReturnValue({
      data: {
        compliance: [{ ConfigRuleName: "warn-rule", Compliance: { ComplianceType: "INSUFFICIENT_DATA" } }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("warn-rule")).toBeTruthy();
      expect(screen.getByText("INSUFFICIENT_DATA")).toBeTruthy();
    });
  });

  // ─── Compliance: null Compliance type + null ContributorCount ──

  it("shows dash for null ComplianceType and null CappedCount", async () => {
    const user = userEvent.setup();
    mockCompliance.mockReturnValue({
      data: {
        compliance: [{ ConfigRuleName: "null-rule", Compliance: null }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("null-rule")).toBeTruthy();
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ─── Evaluation status: FAILED + error message ───────

  it("renders evaluation status with FAILED and error message", async () => {
    const user = userEvent.setup();
    mockEvalStatus.mockReturnValue({
      data: {
        statuses: [{ ConfigRuleName: "fail-rule", LastStatus: "FAILED", LastSuccessfulInvocationTime: "", LastErrorMessage: "Access denied" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("fail-rule")).toBeTruthy();
      expect(screen.getByText("FAILED")).toBeTruthy();
      expect(screen.getByText("Access denied")).toBeTruthy();
    });
  });

  // ─── Evaluation status: unknown status (warning) ─────

  it("shows warning for unknown evaluation status", async () => {
    const user = userEvent.setup();
    mockEvalStatus.mockReturnValue({
      data: {
        statuses: [{ ConfigRuleName: "pending-rule", LastStatus: "IN_PROGRESS", LastSuccessfulInvocationTime: "", LastErrorMessage: "" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("pending-rule")).toBeTruthy();
      expect(screen.getByText("IN_PROGRESS")).toBeTruthy();
    });
  });

  // ─── Pack status: DELETE_FAILED + in-progress fallback ──

  it("renders pack status with DELETE_FAILED", async () => {
    const user = userEvent.setup();
    mockPackStatuses.mockReturnValue({
      data: {
        statuses: [{ ConformancePackName: "del-pack", ConformancePackState: "DELETE_FAILED", ConformancePackStatusReason: "Permission error" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("del-pack")).toBeTruthy();
      expect(screen.getByText("DELETE_FAILED")).toBeTruthy();
    });
  });

  it("shows in-progress indicator for generic pack state", async () => {
    const user = userEvent.setup();
    mockPackStatuses.mockReturnValue({
      data: {
        statuses: [{ ConformancePackName: "update-pack", ConformancePackState: "UPDATE_IN_PROGRESS" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("update-pack")).toBeTruthy();
      expect(screen.getByText("UPDATE_IN_PROGRESS")).toBeTruthy();
    });
  });

  // ─── Recorder status: recording No + null dates ─────

  it("renders recorder status with recording No and null dates", async () => {
    const user = userEvent.setup();
    mockRecorderStatuses.mockReturnValue({
      data: {
        statuses: [{ name: "stopped-rec", recording: false }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("stopped-rec")).toBeTruthy();
      expect(screen.getByText("No")).toBeTruthy();
    });
  });
});

// ─── Advanced tab: evaluation status null invocation time ───
describe("ConfigServiceDashboard — advanced edge cases", () => {
  it("shows dash for null invocation time in evaluation status", async () => {
    const user = userEvent.setup();
    mockEvalStatus.mockReturnValue({
      data: {
        statuses: [{ ConfigRuleName: "no-time", LastStatus: "SUCCEEDED", LastSuccessfulInvocationTime: null, LastErrorMessage: null }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("no-time")).toBeTruthy();
      // null LastSuccessfulInvocationTime → "-"
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows dash for null LastUpdateTime in pack status", async () => {
    const user = userEvent.setup();
    mockPackStatuses.mockReturnValue({
      data: {
        statuses: [{ ConformancePackName: "no-update", ConformancePackState: "CREATE_COMPLETE", LastUpdateTime: null }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("no-update")).toBeTruthy();
      expect(screen.getAllByText("-").length).toBeGreaterThan(0);
    });
  });

  it("shows dash for null lastStartTime and lastStopTime in recorder status", async () => {
    const user = userEvent.setup();
    mockRecorderStatuses.mockReturnValue({
      data: {
        statuses: [{ name: "no-times", recording: true, lastStartTime: null, lastStopTime: null, lastStatus: "Pending" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("no-times")).toBeTruthy();
      // Two dashes for null lastStartTime and null lastStopTime
      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2);
    });
  });

  it("filters rules on the Rules tab", async () => {
    mockRules.mockReturnValue({
      data: {
        rules: [
          { ConfigRuleName: "alpha-rule", ConfigRuleState: "ACTIVE", Source: { Owner: "AWS" } },
          { ConfigRuleName: "beta-rule", ConfigRuleState: "ACTIVE", Source: { Owner: "AWS" } },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-rule")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Find rules"), "beta");
    await waitFor(() => expect(screen.getByText("beta-rule")).toBeTruthy());
    expect(screen.queryByText("alpha-rule")).toBeNull();
  });

  it("filters conformance packs on the Conformance Packs tab", async () => {
    mockPacks.mockReturnValue({
      data: {
        conformancePacks: [
          { ConformancePackName: "alpha-pack", ConformancePackId: "p1", ConformancePackArn: "arn:1" },
          { ConformancePackName: "beta-pack", ConformancePackId: "p2", ConformancePackArn: "arn:2" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /conformance packs/i }));
    await waitFor(() => expect(screen.getByText("alpha-pack")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Find packs"), "beta");
    await waitFor(() => expect(screen.getByText("beta-pack")).toBeTruthy());
    expect(screen.queryByText("alpha-pack")).toBeNull();
  });

  it("filters compliance items on the Advanced tab", async () => {
    mockCompliance.mockReturnValue({
      data: {
        compliance: [
          { ConfigRuleName: "alpha-rule", Compliance: { ComplianceType: "COMPLIANT" } },
          { ConfigRuleName: "beta-rule", Compliance: { ComplianceType: "NON_COMPLIANT" } },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => expect(screen.getByText("alpha-rule")).toBeTruthy());
    await user.type(screen.getAllByPlaceholderText("Find rules")[0], "beta");
    await waitFor(() => expect(screen.getByText("beta-rule")).toBeTruthy());
    expect(screen.queryByText("alpha-rule")).toBeNull();
  });

  it("filters evaluation status on the Advanced tab", async () => {
    mockEvalStatus.mockReturnValue({
      data: {
        statuses: [
          { ConfigRuleName: "eval-alpha", LastStatus: "SUCCEEDED", LastErrorMessage: "" },
          { ConfigRuleName: "eval-beta", LastStatus: "FAILED", LastErrorMessage: "err" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => expect(screen.getByText("eval-alpha")).toBeTruthy());
    await user.type(screen.getAllByPlaceholderText("Find rules")[1], "beta");
    await waitFor(() => expect(screen.getByText("eval-beta")).toBeTruthy());
    expect(screen.queryByText("eval-alpha")).toBeNull();
  });

  it("filters pack status on the Advanced tab", async () => {
    mockPackStatuses.mockReturnValue({
      data: {
        statuses: [
          { ConformancePackName: "status-alpha", ConformancePackState: "CREATE_COMPLETE" },
          { ConformancePackName: "status-beta", ConformancePackState: "CREATE_COMPLETE" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => expect(screen.getByText("status-alpha")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Find packs"), "beta");
    await waitFor(() => expect(screen.getByText("status-beta")).toBeTruthy());
    expect(screen.queryByText("status-alpha")).toBeNull();
  });
});
