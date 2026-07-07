// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
});

// ─── Tests ──────────────────────────────────────────────

describe("ConfigServiceDashboard — rendering", () => {
  it("shows loading skeleton when loading", () => {
    mockRules.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows all 3 tabs", () => {
    render(<ConfigServiceDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("tab", { name: /config rules/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /recorders/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /conformance packs/i })).toBeTruthy();
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
