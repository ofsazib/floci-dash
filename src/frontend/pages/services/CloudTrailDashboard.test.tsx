// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock hooks ─────────────────────────────────────────

vi.mock("../../components/ConfirmDialog", () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn(() => Promise.resolve(true)),
    dialog: null,
  }),
}));

const mockTrails = vi.fn();
const mockDeleteTrail = vi.fn();

const deleteTrailState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

vi.mock("../../hooks/useCloudTrail", () => ({
  useCloudTrailTrails: (...args: any[]) => mockTrails(...args),
  useCreateCloudTrailTrail: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteCloudTrailTrail: () => ({
    mutateAsync: mockDeleteTrail,
    isPending: deleteTrailState.isPending,
    variables: deleteTrailState.variables,
  }),
  useStartCloudTrailLogging: () => ({ mutate: vi.fn(), isPending: false }),
  useStopCloudTrailLogging: () => ({ mutate: vi.fn(), isPending: false }),
}));

import { CloudTrailDashboard } from "./CloudTrailDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  deleteTrailState.isPending = false;
  deleteTrailState.variables = null;

  mockTrails.mockReturnValue({
    data: { trails: [], total: 0 },
    isLoading: false,
  });
});

// ─── Tests ──────────────────────────────────────────────

describe("CloudTrailDashboard — rendering", () => {
  it("shows loading skeleton when loading", () => {
    mockTrails.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    const { container } = render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("renders the table header", () => {
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("CloudTrail Trails")).toBeTruthy();
  });

  it("shows empty message when no trails", () => {
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No trails/i)).toBeTruthy();
  });
});

describe("CloudTrailDashboard — data", () => {
  it("renders trails with data", () => {
    mockTrails.mockReturnValue({
      data: {
        trails: [
          {
            Name: "my-trail",
            TrailARN: "arn:aws:cloudtrail:us-east-1::trail/my-trail",
            S3BucketName: "my-bucket",
            IsMultiRegionTrail: true,
            IncludeGlobalServiceEvents: true,
            IsOrganizationTrail: false,
            HomeRegion: "us-east-1",
            CreationDate: 1700000000,
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-trail")).toBeTruthy();
    expect(screen.getByText("my-bucket")).toBeTruthy();
    expect(screen.getAllByText("Yes").length).toBeGreaterThan(0);
  });

  it("renders trails with null/undefined fields gracefully", () => {
    mockTrails.mockReturnValue({
      data: {
        trails: [
          {
            Name: "minimal-trail",
            TrailARN: "arn:aws:cloudtrail:us-east-1::trail/minimal",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("minimal-trail")).toBeTruthy();
    // Missing fields should show "-"
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });

  it("renders with null data gracefully", () => {
    mockTrails.mockReturnValue({
      data: null,
      isLoading: false,
    });
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No trails/i)).toBeTruthy();
  });

  it("calls deleteTrail when delete is clicked", async () => {
    mockTrails.mockReturnValue({
      data: {
        trails: [
          {
            Name: "my-trail",
            TrailARN: "arn:aws:cloudtrail:us-east-1::trail/my-trail",
            S3BucketName: "my-bucket",
            IsMultiRegionTrail: true,
            IncludeGlobalServiceEvents: true,
            HomeRegion: "us-east-1",
            CreationDate: 1700000000,
          },
        ],
        total: 1,
      },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("my-trail")).toBeTruthy();
    });

    const deleteBtn = screen.getByRole("button", { name: /Delete my-trail/i });
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(mockDeleteTrail).toHaveBeenCalledWith("my-trail");
    });
  });

  it("shows delete loading state", () => {
    deleteTrailState.isPending = true;
    deleteTrailState.variables = "my-trail";
    mockTrails.mockReturnValue({
      data: {
        trails: [
          {
            Name: "my-trail",
            TrailARN: "arn:aws:cloudtrail:us-east-1::trail/my-trail",
            S3BucketName: "my-bucket",
            IsMultiRegionTrail: true,
            IncludeGlobalServiceEvents: true,
            HomeRegion: "us-east-1",
            CreationDate: 1700000000,
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-trail")).toBeTruthy();
  });
});
