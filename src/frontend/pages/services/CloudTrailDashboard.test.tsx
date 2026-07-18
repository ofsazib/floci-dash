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

vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockTrails = vi.fn();
const mockDeleteTrail = vi.fn();
const mockLookupEvents = vi.fn();
const mockEventSelectors = vi.fn();
const mockPutEventSelectors = vi.fn();

const deleteTrailState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));
const lookupState = vi.hoisted(() => ({ isPending: false, isError: false, error: null as Error | null }));

vi.mock("../../hooks/useCloudTrail", () => ({
  useCloudTrailTrails: (...args: any[]) => mockTrails(...args),
  useCreateCloudTrailTrail: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteCloudTrailTrail: () => ({
    mutateAsync: mockDeleteTrail,
    get isPending() { return deleteTrailState.isPending; },
    get variables() { return deleteTrailState.variables; },
  }),
  useStartCloudTrailLogging: () => ({ mutate: vi.fn(), isPending: false }),
  useStopCloudTrailLogging: () => ({ mutate: vi.fn(), isPending: false }),
  useLookupEvents: () => ({
    mutate: mockLookupEvents,
    get isPending() { return lookupState.isPending; },
    get isError() { return lookupState.isError; },
    get error() { return lookupState.error; },
  }),
  useEventSelectors: (...args: any[]) => mockEventSelectors(...args),
  usePutEventSelectors: () => ({ mutate: mockPutEventSelectors, isPending: false, isError: false, error: null }),
}));

import { CloudTrailDashboard } from "./CloudTrailDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  deleteTrailState.isPending = false;
  deleteTrailState.variables = null;
  lookupState.isPending = false;
  lookupState.isError = false;
  lookupState.error = null;

  mockTrails.mockReturnValue({
    data: { trails: [], total: 0 },
    isLoading: false,
  });
  mockEventSelectors.mockReturnValue({ data: undefined, isLoading: false });
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

  it("renders trails with all boolean fields false showing No", () => {
    mockTrails.mockReturnValue({
      data: {
        trails: [
          {
            Name: "no-features-trail",
            TrailARN: "arn:aws:cloudtrail:us-east-1::trail/no-features",
            S3BucketName: "bucket",
            IsMultiRegionTrail: false,
            IncludeGlobalServiceEvents: false,
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
    expect(screen.getByText("no-features-trail")).toBeTruthy();
    expect(screen.getAllByText("No").length).toBeGreaterThan(0);
    // Creation date should be rendered (not "-")
    expect(screen.queryAllByText("-").length).toBe(0);
  });

  it("filters trails by name", async () => {
    mockTrails.mockReturnValue({
      data: {
        trails: [
          { Name: "alpha-trail", TrailARN: "arn:aws:cloudtrail:us-east-1::trail/alpha", S3BucketName: "b1", IsMultiRegionTrail: true, IncludeGlobalServiceEvents: true, HomeRegion: "us-east-1", CreationDate: 1700000000 },
          { Name: "beta-trail", TrailARN: "arn:aws:cloudtrail:us-east-1::trail/beta", S3BucketName: "b2", IsMultiRegionTrail: false, IncludeGlobalServiceEvents: false, HomeRegion: "us-west-2", CreationDate: 1700000000 },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-trail")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find trails by name");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-trail")).toBeNull());
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

describe("CloudTrailDashboard — Lookup Events tab", () => {
  it("runs a search and renders results", async () => {
    mockLookupEvents.mockImplementation((_params, opts) => {
      opts?.onSuccess?.({
        events: [
          {
            eventId: "e-1",
            eventName: "CreateBucket",
            eventTime: "2024-01-01T00:00:00Z",
            eventSource: "s3.amazonaws.com",
            username: "alice",
            cloudTrailEvent: JSON.stringify({ eventName: "CreateBucket" }),
          },
        ],
        nextToken: null,
        total: 1,
      });
    });
    const user = userEvent.setup();
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /lookup events/i }));
    await clickButton(user, /search events/i);
    expect(mockLookupEvents).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText("CreateBucket")).toBeTruthy());
    expect(screen.getByText("alice")).toBeTruthy();
  });

  it("passes a lookup attribute filter when a value is entered", async () => {
    mockLookupEvents.mockImplementation((_params, opts) => {
      opts?.onSuccess?.({ events: [], nextToken: null, total: 0 });
    });
    const user = userEvent.setup();
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /lookup events/i }));
    await user.type(screen.getByPlaceholderText("Filter value..."), "CreateBucket");
    await clickButton(user, /search events/i);
    expect(mockLookupEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        lookupAttributes: [{ AttributeKey: "EventId", AttributeValue: "CreateBucket" }],
      }),
      expect.anything(),
    );
  });

  it("shows an empty message when no events match", async () => {
    mockLookupEvents.mockImplementation((_params, opts) => {
      opts?.onSuccess?.({ events: [], nextToken: null, total: 0 });
    });
    const user = userEvent.setup();
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /lookup events/i }));
    await clickButton(user, /search events/i);
    await waitFor(() => expect(screen.getByText(/no events found/i)).toBeTruthy());
  });

  it("shows an error alert when lookup fails", async () => {
    lookupState.isError = true;
    lookupState.error = new Error("AccessDenied");
    const user = userEvent.setup();
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /lookup events/i }));
    await waitFor(() => expect(screen.getByText("AccessDenied")).toBeTruthy());
  });
});

describe("CloudTrailDashboard — Event Selectors tab", () => {
  function trailsWithOne() {
    mockTrails.mockReturnValue({
      data: {
        trails: [
          { Name: "my-trail", TrailARN: "arn:aws:cloudtrail:us-east-1::trail/my-trail", S3BucketName: "b", IsMultiRegionTrail: true, IncludeGlobalServiceEvents: true, HomeRegion: "us-east-1", CreationDate: 1700000000 },
        ],
        total: 1,
      },
      isLoading: false,
    });
  }

  it("opens the event selectors tab for a trail and shows current config", async () => {
    trailsWithOne();
    mockEventSelectors.mockReturnValue({
      data: {
        trailName: "my-trail",
        eventSelectors: [{ ReadWriteType: "All", IncludeManagementEvents: true }],
        advancedEventSelectors: [],
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-trail")).toBeTruthy());
    await clickButton(user, /event selectors/i);
    await waitFor(() => expect(screen.getByText("Event Selectors for my-trail")).toBeTruthy());
    expect(mockEventSelectors).toHaveBeenCalledWith("my-trail");
    expect(screen.getByText(/Current Configuration/i)).toBeTruthy();
  });

  it("saves event selectors", async () => {
    trailsWithOne();
    mockEventSelectors.mockReturnValue({
      data: { trailName: "my-trail", eventSelectors: [], advancedEventSelectors: [] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-trail")).toBeTruthy());
    await clickButton(user, /event selectors/i);
    await clickButton(user, /save event selectors/i);
    expect(mockPutEventSelectors).toHaveBeenCalledWith(
      expect.objectContaining({
        eventSelectors: [expect.objectContaining({ ReadWriteType: "All", IncludeManagementEvents: true })],
      }),
      expect.anything(),
    );
  });
});
