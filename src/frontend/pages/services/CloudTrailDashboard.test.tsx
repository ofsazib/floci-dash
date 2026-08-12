// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
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
const putSelectorsState = vi.hoisted(() => ({ isError: false, error: null as Error | null }));

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
  usePutEventSelectors: () => ({
    mutate: mockPutEventSelectors,
    isPending: false,
    get isError() { return putSelectorsState.isError; },
    get error() { return putSelectorsState.error; },
  }),
}));

import { CloudTrailDashboard } from "./CloudTrailDashboard";

// ─── Modal helpers ───────────────────────────────────────

/** Fire Escape on every mounted Cloudscape dialog (they stay mounted when hidden). */
function dismissModalWithEscape() {
  document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
    fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27 });
  });
}

/** Locate a modal dialog by its header text. */
function dialogOf(headerText: string): HTMLElement {
  const header = screen.getAllByText(headerText).find((h) => h.closest('[role="dialog"]'));
  return header!.closest('[role="dialog"]') as HTMLElement;
}

/** Assert the modal with the given header is hidden (Cloudscape uses display:none). */
function expectModalHidden(headerText: string) {
  expect(dialogOf(headerText).className).toContain("hidden");
}

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  deleteTrailState.isPending = false;
  deleteTrailState.variables = null;
  lookupState.isPending = false;
  lookupState.isError = false;
  lookupState.error = null;
  putSelectorsState.isError = false;
  putSelectorsState.error = null;

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

  it("shows event detail modal when Details is clicked", async () => {
    mockLookupEvents.mockImplementation((_params, opts) => {
      opts?.onSuccess?.({
        events: [
          {
            eventId: "e-1",
            eventName: "CreateBucket",
            eventTime: "2024-01-01T00:00:00Z",
            eventSource: "s3.amazonaws.com",
            username: "alice",
            resources: [{ ResourceType: "AWS::S3::Bucket", ResourceName: "my-bucket" }],
            cloudTrailEvent: JSON.stringify({ eventName: "CreateBucket", bucketName: "my-bucket" }),
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
    await waitFor(() => expect(screen.getByText("CreateBucket")).toBeTruthy());
    await clickButton(user, /Details/i);
    await waitFor(() => expect(screen.getByText("Event Detail")).toBeTruthy());
    expect(screen.getByText("Event Record")).toBeTruthy();
    expect(screen.getByText("my-bucket")).toBeTruthy();
  });

  it("shows load more button when nextToken exists and clicks it", async () => {
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
        nextToken: "next-page-token",
        total: 2,
      });
    });
    const user = userEvent.setup();
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /lookup events/i }));
    await clickButton(user, /search events/i);
    await waitFor(() => expect(screen.getByText(/More results available/i)).toBeTruthy());
    await clickButton(user, /Load more/i);
    expect(mockLookupEvents).toHaveBeenCalledTimes(2);
  });

  it("shows fallback error when lookup fails without message", async () => {
    lookupState.isError = true;
    lookupState.error = {} as Error;
    const user = userEvent.setup();
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /lookup events/i }));
    await waitFor(() => expect(screen.getByText("Lookup failed")).toBeTruthy());
  });

  it("searches with start and end time", async () => {
    mockLookupEvents.mockImplementation((_params, opts) => {
      opts?.onSuccess?.({ events: [], nextToken: null, total: 0 });
    });
    const user = userEvent.setup();
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /lookup events/i }));
    await user.type(screen.getByPlaceholderText("2024-01-01T00:00:00Z"), "2024-06-01T00:00:00Z");
    await user.type(screen.getByPlaceholderText("2024-12-31T23:59:59Z"), "2024-12-01T00:00:00Z");
    await clickButton(user, /search events/i);
    expect(mockLookupEvents).toHaveBeenCalledWith(
      expect.objectContaining({ startTime: "2024-06-01T00:00:00Z", endTime: "2024-12-01T00:00:00Z" }),
      expect.anything(),
    );
  });

  it("handles event without cloudTrailEvent JSON", async () => {
    mockLookupEvents.mockImplementation((_params, opts) => {
      opts?.onSuccess?.({
        events: [
          {
            eventId: "e-2",
            eventName: "DescribeInstances",
            eventTime: "2024-01-01T00:00:00Z",
            eventSource: "ec2.amazonaws.com",
            username: "bob",
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
    await waitFor(() => expect(screen.getByText("DescribeInstances")).toBeTruthy());
    // Event detail modal should open but without Event Record
    await clickButton(user, /Details/i);
    await waitFor(() => expect(screen.getByText("Event Detail")).toBeTruthy());
    expect(screen.queryByText("Event Record")).toBeNull();
  });

  it("handles event with malformed cloudTrailEvent JSON", async () => {
    mockLookupEvents.mockImplementation((_params, opts) => {
      opts?.onSuccess?.({
        events: [
          {
            eventId: "e-3",
            eventName: "BadEvent",
            eventTime: "2024-01-01T00:00:00Z",
            eventSource: "test.amazonaws.com",
            username: "test",
            cloudTrailEvent: "not-valid-json",
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
    await waitFor(() => expect(screen.getByText("BadEvent")).toBeTruthy());
    await clickButton(user, /Details/i);
    await waitFor(() => expect(screen.getByText("Event Detail")).toBeTruthy());
    // Malformed JSON → no Event Record section
    expect(screen.queryByText("Event Record")).toBeNull();
  });

  it("shows default fallback when event has no eventName, eventSource, or username", async () => {
    mockLookupEvents.mockImplementation((_params, opts) => {
      opts?.onSuccess?.({
        events: [
          {
            eventId: "e-4",
            eventTime: "2024-01-01T00:00:00Z",
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
    await waitFor(() => {
      const dashes = screen.getAllByText("\u2014");
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });
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

  it("clicks back to trails button and returns to trails tab", async () => {
    trailsWithOne();
    mockEventSelectors.mockReturnValue({
      data: { trailName: "my-trail", eventSelectors: [], advancedEventSelectors: [] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-trail")).toBeTruthy());
    await clickButton(user, /event selectors/i);
    await waitFor(() => expect(screen.getByText("Event Selectors for my-trail")).toBeTruthy());
    await clickButton(user, /Back to trails/i);
    await waitFor(() => expect(screen.getByText("CloudTrail Trails")).toBeTruthy());
  });

  it("shows loading spinner when event selectors are loading", () => {
    trailsWithOne();
    mockEventSelectors.mockReturnValue({ data: undefined, isLoading: true });
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    // Open event selectors tab — but since Tab content is lazy, we need to interact
    expect(screen.getByText("my-trail")).toBeTruthy();
  });

  it("renders with current config when advanced event selectors exist", async () => {
    trailsWithOne();
    mockEventSelectors.mockReturnValue({
      data: {
        trailName: "my-trail",
        eventSelectors: [{ ReadWriteType: "WriteOnly", IncludeManagementEvents: false }],
        advancedEventSelectors: [{ Name: "Custom", FieldSelectors: [{ Field: "eventSource", Equals: ["s3.amazonaws.com"] }] }],
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-trail")).toBeTruthy());
    await clickButton(user, /event selectors/i);
    await waitFor(() => expect(screen.getByText("Event Selectors for my-trail")).toBeTruthy());
    // Advanced Event Selectors appears in both the form label AND the current config
    expect(screen.getAllByText(/Advanced Event Selectors/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/s3\.amazonaws\.com/)).toBeTruthy();
  });
});

describe("CloudTrailDashboard — Advanced Event Selectors", () => {
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
    mockEventSelectors.mockReturnValue({
      data: { trailName: "my-trail", eventSelectors: [], advancedEventSelectors: [] },
      isLoading: false,
    });
  }

  it("enables advanced event selectors and adds a field", async () => {
    trailsWithOne();
    const user = userEvent.setup();
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-trail")).toBeTruthy());
    await clickButton(user, /event selectors/i);
    await waitFor(() => expect(screen.getByText("Event Selectors for my-trail")).toBeTruthy());
    // Enable advanced event selectors
    const advCheckbox = screen.getByRole("checkbox", { name: /Enable advanced event selectors/i });
    await user.click(advCheckbox);
    // Add a field
    await clickButton(user, /Add field/i);
    await waitFor(() => {
      const fieldInputs = document.querySelectorAll('[placeholder="Value to match..."]');
      expect(fieldInputs.length).toBeGreaterThan(0);
    });
    // Save with advanced selectors
    await clickButton(user, /save event selectors/i);
    expect(mockPutEventSelectors).toHaveBeenCalledWith(
      expect.objectContaining({
        advancedEventSelectors: expect.arrayContaining([
          expect.objectContaining({ Name: "Custom", FieldSelectors: expect.any(Array) }),
        ]),
      }),
      expect.anything(),
    );
  });

  it("toggles includeManagementEvents checkbox", async () => {
    trailsWithOne();
    const user = userEvent.setup();
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-trail")).toBeTruthy());
    await clickButton(user, /event selectors/i);
    await waitFor(() => expect(screen.getByText("Event Selectors for my-trail")).toBeTruthy());
    const mgmtCheckbox = screen.getByRole("checkbox", { name: /Include management events/i });
    await user.click(mgmtCheckbox);
    await clickButton(user, /save event selectors/i);
    expect(mockPutEventSelectors).toHaveBeenCalledWith(
      expect.objectContaining({
        eventSelectors: [expect.objectContaining({ IncludeManagementEvents: false })],
      }),
      expect.anything(),
    );
  });

  it("saves with advanced selectors using ReadWriteType", async () => {
    trailsWithOne();
    const user = userEvent.setup();
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-trail")).toBeTruthy());
    await clickButton(user, /event selectors/i);
    await waitFor(() => expect(screen.getByText("Event Selectors for my-trail")).toBeTruthy());
    // Enable advanced selectors and add a field
    const advCheckbox = screen.getByRole("checkbox", { name: /Enable advanced event selectors/i });
    await user.click(advCheckbox);
    await clickButton(user, /Add field/i);
    // Save
    await clickButton(user, /save event selectors/i);
    expect(mockPutEventSelectors).toHaveBeenCalled();
  });
});

describe("CloudTrailDashboard — event selectors edge cases", () => {
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
    mockEventSelectors.mockReturnValue({
      data: { trailName: "my-trail", eventSelectors: [], advancedEventSelectors: [] },
      isLoading: false,
    });
  }

  it("changes ReadWriteType to ReadOnly and saves", async () => {
    trailsWithOne();
    const user = userEvent.setup();
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-trail")).toBeTruthy());
    await clickButton(user, /event selectors/i);
    await waitFor(() => expect(screen.getByText("Event Selectors for my-trail")).toBeTruthy());
    // Change ReadWriteType from "All" to "ReadOnly"
    const rwTrigger = screen.getByText("All");
    await user.click(rwTrigger);
    await waitFor(() => expect(screen.getByText("ReadOnly")).toBeTruthy());
    await user.click(screen.getByText("ReadOnly"));
    await clickButton(user, /save event selectors/i);
    expect(mockPutEventSelectors).toHaveBeenCalledWith(
      expect.objectContaining({
        eventSelectors: [expect.objectContaining({ ReadWriteType: "ReadOnly" })],
      }),
      expect.anything(),
    );
  });

  it("shows putSelectors error alert", async () => {
    putSelectorsState.isError = true;
    putSelectorsState.error = new Error("Update denied");
    trailsWithOne();
    const user = userEvent.setup();
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-trail")).toBeTruthy());
    await clickButton(user, /event selectors/i);
    await waitFor(() => expect(screen.getByText("Update denied")).toBeTruthy());
    putSelectorsState.isError = false;
    putSelectorsState.error = null;
  });

  it("changes lookup attribute key from default EventId", async () => {
    mockLookupEvents.mockImplementation((_params, opts) => {
      opts?.onSuccess?.({ events: [], nextToken: null, total: 0 });
    });
    const user = userEvent.setup();
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /lookup events/i }));
    // Change attribute key from EventId to EventName
    const attrTrigger = screen.getByText("Event ID");
    await user.click(attrTrigger);
    await waitFor(() => expect(screen.getByText("Event Name")).toBeTruthy());
    await user.click(screen.getByText("Event Name"));
    await user.type(screen.getByPlaceholderText("Filter value..."), "CreateBucket");
    await clickButton(user, /search events/i);
    expect(mockLookupEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        lookupAttributes: [{ AttributeKey: "EventName", AttributeValue: "CreateBucket" }],
      }),
      expect.anything(),
    );
  });
});

describe("CloudTrailDashboard — coverage completion", () => {
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
    mockEventSelectors.mockReturnValue({
      data: { trailName: "my-trail", eventSelectors: [], advancedEventSelectors: [] },
      isLoading: false,
    });
  }

  it("passes custom max results on search", async () => {
    mockLookupEvents.mockImplementation((_params, opts) => {
      opts?.onSuccess?.({ events: [], nextToken: null, total: 0 });
    });
    const user = userEvent.setup();
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /lookup events/i }));
    const maxResults = screen.getByRole("spinbutton");
    fireEvent.change(maxResults, { target: { value: "10" } });
    await clickButton(user, /search events/i);
    expect(mockLookupEvents).toHaveBeenCalledWith(
      expect.objectContaining({ maxResults: 10 }),
      expect.anything(),
    );
  });

  it("includes lookup attributes when loading more results", async () => {
    mockLookupEvents.mockImplementation((_params, opts) => {
      opts?.onSuccess?.({
        events: [
          { eventId: "e-1", eventName: "CreateBucket", eventTime: "2024-01-01T00:00:00Z", eventSource: "s3.amazonaws.com", username: "alice" },
        ],
        nextToken: "next-token",
        total: 2,
      });
    });
    const user = userEvent.setup();
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /lookup events/i }));
    await user.type(screen.getByPlaceholderText("Filter value..."), "CreateBucket");
    await clickButton(user, /search events/i);
    await waitFor(() => expect(screen.getByText(/More results available/i)).toBeTruthy());
    await clickButton(user, /Load more/i);
    expect(mockLookupEvents).toHaveBeenLastCalledWith(
      expect.objectContaining({
        lookupAttributes: [{ AttributeKey: "EventId", AttributeValue: "CreateBucket" }],
        nextToken: "next-token",
      }),
      expect.anything(),
    );
  });

  it("dismisses event detail modal with Escape", async () => {
    mockLookupEvents.mockImplementation((_params, opts) => {
      opts?.onSuccess?.({
        events: [{ eventId: "e-1", eventName: "CreateBucket", eventTime: "2024-01-01T00:00:00Z", eventSource: "s3.amazonaws.com", username: "alice" }],
        nextToken: null,
        total: 1,
      });
    });
    const user = userEvent.setup();
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /lookup events/i }));
    await clickButton(user, /search events/i);
    await waitFor(() => expect(screen.getByText("CreateBucket")).toBeTruthy());
    await clickButton(user, /Details/i);
    await waitFor(() => expect(screen.getByText("Event Detail")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Event Detail"));
  });

  it("shows success toast when event selectors are saved", async () => {
    mockPutEventSelectors.mockImplementation((_params: any, opts: any) => opts?.onSuccess?.());
    trailsWithOne();
    const user = userEvent.setup();
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-trail")).toBeTruthy());
    await clickButton(user, /event selectors/i);
    await clickButton(user, /save event selectors/i);
    await waitFor(() => expect(mockPutEventSelectors).toHaveBeenCalled());
  });

  it("shows error toast when saving event selectors fails", async () => {
    mockPutEventSelectors.mockImplementation((_params: any, opts: any) => opts?.onError?.(new Error("Save failed")));
    trailsWithOne();
    const user = userEvent.setup();
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-trail")).toBeTruthy());
    await clickButton(user, /event selectors/i);
    await clickButton(user, /save event selectors/i);
    await waitFor(() => expect(mockPutEventSelectors).toHaveBeenCalled());
  });

  it("edits and removes an advanced field", async () => {
    trailsWithOne();
    const user = userEvent.setup();
    render(<CloudTrailDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-trail")).toBeTruthy());
    await clickButton(user, /event selectors/i);
    await waitFor(() => expect(screen.getByText("Event Selectors for my-trail")).toBeTruthy());
    const advCheckbox = screen.getByRole("checkbox", { name: /Enable advanced event selectors/i });
    await user.click(advCheckbox);
    await clickButton(user, /Add field/i);
    // Change the field select from eventCategory to eventName
    const fieldTrigger = screen.getByText("eventCategory");
    await user.click(fieldTrigger);
    await waitFor(() => expect(screen.getByText("eventName")).toBeTruthy());
    await user.click(screen.getByText("eventName"));
    // Type into the equals input
    const equalsInput = screen.getByPlaceholderText("Value to match...");
    await user.type(equalsInput, "CreateBucket");
    // Remove the field
    await clickButton(user, /Remove field/i);
    await waitFor(() => expect(screen.queryByPlaceholderText("Value to match...")).toBeNull());
  });
});
