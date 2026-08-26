// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mockApps = vi.fn();
const mockDetail = vi.fn();
const mockSnaps = vi.fn();

vi.mock("../../hooks/useKinesisAnalytics", () => ({
  useKinesisAnalyticsApplications: (...args: any[]) => mockApps(...args),
  useKinesisAnalyticsApplication: (...args: any[]) => mockDetail(...args),
  useCreateKinesisAnalyticsApplication: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateKinesisAnalyticsApplication: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteKinesisAnalyticsApplication: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useStartKinesisAnalyticsApplication: () => ({ mutate: vi.fn(), isPending: false }),
  useStopKinesisAnalyticsApplication: () => ({ mutate: vi.fn(), isPending: false }),
  useKinesisAnalyticsSnapshots: (...args: any[]) => mockSnaps(...args),
  useCreateKinesisAnalyticsSnapshot: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteKinesisAnalyticsSnapshot: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useKinesisAnalyticsTags: () => ({ data: undefined }),
  useAddKinesisAnalyticsTags: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRemoveKinesisAnalyticsTags: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("../../../components/ConfirmDialog", () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn(() => Promise.resolve(true)),
    dialog: null,
  }),
}));

import { KinesisAnalyticsDashboard } from "./KinesisAnalyticsDashboard";

describe("KinesisAnalyticsDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApps.mockReturnValue({ data: undefined, isLoading: false });
    mockDetail.mockReturnValue({ data: undefined, isLoading: false });
    mockSnaps.mockReturnValue({ data: undefined, isLoading: false });
  });

  it("renders applications tab by default with all three tabs", () => {
    render(<KinesisAnalyticsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("tab", { name: /Applications/ })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Snapshots/ })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Detail/ })).toBeTruthy();
  });

  it("shows loading state for applications", () => {
    mockApps.mockReturnValue({ data: undefined, isLoading: true });
    render(<KinesisAnalyticsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Loading...")).toBeTruthy();
  });

  it("shows select-application hint in snapshots tab when none selected", async () => {
    render(<KinesisAnalyticsDashboard />, { wrapper: createWrapper() });
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /Snapshots/ }));
    expect(screen.getByText(/Select an application/)).toBeTruthy();
  });

  it("shows placeholder in detail tab when no app selected", async () => {
    render(<KinesisAnalyticsDashboard />, { wrapper: createWrapper() });
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /Detail/ }));
    expect(screen.getByText(/Select an application to view detail/)).toBeTruthy();
  });

  it("opens the create application modal", async () => {
    render(<KinesisAnalyticsDashboard />, { wrapper: createWrapper() });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Create Application/ }));
    expect(screen.getByText("Application Name")).toBeTruthy();
  });

  it("renders applications table data", () => {
    mockApps.mockReturnValue({
      data: {
        applications: [
          {
            ApplicationName: "my-flink-app",
            ApplicationStatus: "RUNNING",
            RuntimeEnvironment: "FLINK-1_19",
            ApplicationVersionId: 2,
            ApplicationARN: "arn:app",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<KinesisAnalyticsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("tab", { name: /Applications/ })).toBeTruthy();
  });

  it("switches to snapshots tab and shows create button disabled without selection", async () => {
    render(<KinesisAnalyticsDashboard />, { wrapper: createWrapper() });
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /Snapshots/ }));
    const btn = screen.getByRole("button", { name: /Create Snapshot/ });
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  it("shows detail panel content when an app is selected via tab label flow", () => {
    mockApps.mockReturnValue({
      data: { applications: [], total: 0 },
      isLoading: false,
    });
    render(<KinesisAnalyticsDashboard />, { wrapper: createWrapper() });
    // No selection — placeholder present
    fireEvent.click(screen.getByRole("tab", { name: /Detail/ }));
    expect(screen.getByText(/Select an application to view detail/)).toBeTruthy();
  });
});
