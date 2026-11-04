// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── vi.hoisted mutable states ──────────────────────────

const createGroupState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const deleteGroupState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const createStreamState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const deleteStreamState = vi.hoisted(() => ({
  isPending: false,
  variables: { logStreamName: "" },
}));

const putRetentionState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const deleteRetentionState = vi.hoisted(() => ({
  isPending: false,
}));

const putFilterState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const deleteFilterState = vi.hoisted(() => ({
  isPending: false,
  variables: { filterName: "" },
}));

const tagGroupState = vi.hoisted(() => ({
  isPending: false,
}));

const untagGroupState = vi.hoisted(() => ({
  isPending: false,
}));

const putAccountPolicyState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const putMetricFilterState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const deleteMetricFilterState = vi.hoisted(() => ({
  isPending: false,
  variables: { filterName: "" },
}));

const testMetricFilterState = vi.hoisted(() => ({
  isPending: false,
}));

const putDestinationState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const putDestinationPolicyState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const putResourcePolicyState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const putProtectionState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const startQueryState = vi.hoisted(() => ({
  isPending: false,
}));

const stopQueryState = vi.hoisted(() => ({
  isPending: false,
}));

// ─── Mock hooks ─────────────────────────────────────────

const mockLogGroups = vi.fn();
const mockCreateGroup = vi.fn();
const mockDeleteGroup = vi.fn();
const mockLogStreams = vi.fn();
const mockCreateStream = vi.fn();
const mockDeleteStream = vi.fn();
const mockLogEvents = vi.fn();
const mockFilteredLogEvents = vi.fn();
const mockPutRetention = vi.fn();
const mockDeleteRetention = vi.fn();
const mockSubFilters = vi.fn();
const mockPutFilter = vi.fn();
const mockDeleteFilter = vi.fn();
const mockTags = vi.fn();
const mockTagGroup = vi.fn();
const mockUntagGroup = vi.fn();
const mockDataProtection = vi.fn();
const mockAccountPolicies = vi.fn();
const mockPutAccountPolicy = vi.fn();
const mockMetricFilters = vi.fn();
const mockPutMetricFilter = vi.fn();
const mockDeleteMetricFilter = vi.fn();
const mockTestMetricFilter = vi.fn();
const mockPutDestination = vi.fn();
const mockPutDestinationPolicy = vi.fn();
const mockResourcePolicies = vi.fn();
const mockPutResourcePolicy = vi.fn();
const mockPutProtection = vi.fn();
const mockStartQuery = vi.fn();
const mockStopQuery = vi.fn();
const mockQueryResults = vi.fn();
const mockInsightsRefetch = vi.fn();

vi.mock("../../hooks/useLogs", () => ({
  LOGS_PAGE_SIZE: 10,
  useLogGroups: (...args: any[]) => mockLogGroups(...args),
  useCreateLogGroup: () => ({
    mutate: mockCreateGroup,
    get isPending() { return createGroupState.isPending; },
    get isError() { return createGroupState.isError; },
    get error() { return createGroupState.error; },
  }),
  useDeleteLogGroup: () => ({
    mutateAsync: mockDeleteGroup,
    get isPending() { return deleteGroupState.isPending; },
    get variables() { return deleteGroupState.variables; },
  }),
  useLogStreams: (...args: any[]) => mockLogStreams(...args),
  useCreateLogStream: () => ({
    mutate: mockCreateStream,
    get isPending() { return createStreamState.isPending; },
    get isError() { return createStreamState.isError; },
    get error() { return createStreamState.error; },
  }),
  useDeleteLogStream: () => ({
    mutateAsync: mockDeleteStream,
    get isPending() { return deleteStreamState.isPending; },
    get variables() { return deleteStreamState.variables; },
  }),
  useLogEvents: (...args: any[]) => mockLogEvents(...args),
  useFilteredLogEvents: (...args: any[]) => mockFilteredLogEvents(...args),
  usePutRetentionPolicy: () => ({
    mutate: mockPutRetention,
    get isPending() { return putRetentionState.isPending; },
    get isError() { return putRetentionState.isError; },
    get error() { return putRetentionState.error; },
  }),
  useDeleteRetentionPolicy: () => ({
    mutate: mockDeleteRetention,
    get isPending() { return deleteRetentionState.isPending; },
  }),
  useSubscriptionFilters: (...args: any[]) => mockSubFilters(...args),
  usePutSubscriptionFilter: () => ({
    mutate: mockPutFilter,
    get isPending() { return putFilterState.isPending; },
    get isError() { return putFilterState.isError; },
    get error() { return putFilterState.error; },
  }),
  useDeleteSubscriptionFilter: () => ({
    mutateAsync: mockDeleteFilter,
    get isPending() { return deleteFilterState.isPending; },
    get variables() { return deleteFilterState.variables; },
  }),
  useLogGroupTags: (...args: any[]) => mockTags(...args),
  useTagLogGroup: () => ({
    mutate: mockTagGroup,
    get isPending() { return tagGroupState.isPending; },
  }),
  useUntagLogGroup: () => ({
    mutate: mockUntagGroup,
    get isPending() { return untagGroupState.isPending; },
  }),
  useDataProtectionPolicy: (...args: any[]) => mockDataProtection(...args),
  useAccountPolicies: (...args: any[]) => mockAccountPolicies(...args),
  usePutAccountPolicy: () => ({
    mutate: mockPutAccountPolicy,
    get isPending() { return putAccountPolicyState.isPending; },
    get isError() { return putAccountPolicyState.isError; },
    get error() { return putAccountPolicyState.error; },
  }),
  useMetricFilters: (...args: any[]) => mockMetricFilters(...args),
  usePutMetricFilter: () => ({
    mutate: mockPutMetricFilter,
    get isPending() { return putMetricFilterState.isPending; },
    get isError() { return putMetricFilterState.isError; },
    get error() { return putMetricFilterState.error; },
  }),
  useDeleteMetricFilter: () => ({
    mutateAsync: mockDeleteMetricFilter,
    get isPending() { return deleteMetricFilterState.isPending; },
    get variables() { return deleteMetricFilterState.variables; },
  }),
  useTestMetricFilter: () => ({
    mutateAsync: mockTestMetricFilter,
    get isPending() { return testMetricFilterState.isPending; },
  }),
  usePutDestination: () => ({
    mutate: mockPutDestination,
    get isPending() { return putDestinationState.isPending; },
    get isError() { return putDestinationState.isError; },
    get error() { return putDestinationState.error; },
  }),
  usePutDestinationPolicy: () => ({
    mutate: mockPutDestinationPolicy,
    get isPending() { return putDestinationPolicyState.isPending; },
    get isError() { return putDestinationPolicyState.isError; },
    get error() { return putDestinationPolicyState.error; },
  }),
  useResourcePolicies: (...args: any[]) => mockResourcePolicies(...args),
  usePutResourcePolicy: () => ({
    mutate: mockPutResourcePolicy,
    get isPending() { return putResourcePolicyState.isPending; },
    get isError() { return putResourcePolicyState.isError; },
    get error() { return putResourcePolicyState.error; },
  }),
  usePutLogGroupDeletionProtection: () => ({
    mutate: mockPutProtection,
    get isPending() { return putProtectionState.isPending; },
    get isError() { return putProtectionState.isError; },
    get error() { return putProtectionState.error; },
  }),
  useStartQuery: () => ({
    mutateAsync: mockStartQuery,
    get isPending() { return startQueryState.isPending; },
  }),
  useStopQuery: () => ({
    mutateAsync: mockStopQuery,
    get isPending() { return stopQueryState.isPending; },
  }),
  useQueryResults: (...args: any[]) => mockQueryResults(...args),
}));

import { CloudWatchLogsDashboard } from "./CloudWatchLogsDashboard";

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

beforeEach(() => {
  vi.clearAllMocks();
  createGroupState.isPending = false;
  createGroupState.isError = false;
  createGroupState.error = null;
  deleteGroupState.isPending = false;
  deleteGroupState.variables = null;
  createStreamState.isPending = false;
  createStreamState.isError = false;
  createStreamState.error = null;
  deleteStreamState.isPending = false;
  deleteStreamState.variables = { logStreamName: "" };
  putRetentionState.isPending = false;
  putRetentionState.isError = false;
  putRetentionState.error = null;
  deleteRetentionState.isPending = false;
  putFilterState.isPending = false;
  putFilterState.isError = false;
  putFilterState.error = null;
  deleteFilterState.isPending = false;
  deleteFilterState.variables = { filterName: "" };
  tagGroupState.isPending = false;
  untagGroupState.isPending = false;
  putAccountPolicyState.isPending = false;
  putAccountPolicyState.isError = false;
  putAccountPolicyState.error = null;
  putMetricFilterState.isPending = false;
  putMetricFilterState.isError = false;
  putMetricFilterState.error = null;
  deleteMetricFilterState.isPending = false;
  deleteMetricFilterState.variables = { filterName: "" };
  testMetricFilterState.isPending = false;
  putDestinationState.isPending = false;
  putDestinationState.isError = false;
  putDestinationState.error = null;
  putDestinationPolicyState.isPending = false;
  putDestinationPolicyState.isError = false;
  putDestinationPolicyState.error = null;
  putResourcePolicyState.isPending = false;
  putResourcePolicyState.isError = false;
  putResourcePolicyState.error = null;
  putProtectionState.isPending = false;
  putProtectionState.isError = false;
  putProtectionState.error = null;
  startQueryState.isPending = false;
  stopQueryState.isPending = false;
  mockInsightsRefetch.mockReset();
  mockDataProtection.mockReturnValue({ data: { logGroupIdentifier: "", policyDocument: "" }, isLoading: false });

  mockLogGroups.mockReturnValue({ data: { logGroups: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockLogStreams.mockReturnValue({ data: { logStreams: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockLogEvents.mockReturnValue({ data: { events: [] }, isLoading: false, isError: false, error: null, refetch: vi.fn() });
  mockFilteredLogEvents.mockReturnValue({ data: { events: [] }, isLoading: false, isError: false, error: null, refetch: vi.fn() });
  mockSubFilters.mockReturnValue({ data: { subscriptionFilters: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockTags.mockReturnValue({ data: { tags: {} }, isLoading: false, isError: false, error: null });
  mockAccountPolicies.mockReturnValue({ data: { accountPolicies: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockMetricFilters.mockReturnValue({ data: { metricFilters: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockResourcePolicies.mockReturnValue({ data: { resourcePolicies: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockQueryResults.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null, refetch: vi.fn() });
});

describe("CloudWatchLogsDashboard", () => {
  // ── Log groups tab ─────────────────────────────────────

  it("shows log groups tab", () => {
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("tab", { name: /log groups/i })).toBeTruthy();
  });

  it("shows empty message for log groups", () => {
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No log groups found/i)).toBeTruthy();
  });

  it("renders log groups with data", () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/my-fn", retentionInDays: 14, storedBytes: 1024, creationTime: 1705000000000, arn: "arn:aws:logs:..." }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("/aws/lambda/my-fn")).toBeTruthy();
    expect(screen.getByText("14 days")).toBeTruthy();
  });

  it("shows retention as Never expire when undefined", () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/no-retention", storedBytes: 0 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Never expire")).toBeTruthy();
  });

  it("shows retention with 1 day and 7 day formats", () => {
    const lg1 = { logGroupName: "/retention-1", retentionInDays: 1, storedBytes: 0 };
    const lg7 = { logGroupName: "/retention-7", retentionInDays: 7, storedBytes: 0 };
    const lg30 = { logGroupName: "/retention-30", retentionInDays: 30, storedBytes: 0 };
    mockLogGroups.mockReturnValue({
      data: { logGroups: [lg1, lg7, lg30], total: 3 },
      isLoading: false, isError: false, error: null,
    });
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("1 day")).toBeTruthy();
    expect(screen.getByText("7 days")).toBeTruthy();
    expect(screen.getByText("30 days")).toBeTruthy();
  });

  it("shows log group load error", () => {
    mockLogGroups.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Failed to load log groups") });
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load log groups")).toBeTruthy();
  });

  it("requests the next log-groups page when pagination advances", async () => {
    const user = userEvent.setup();
    mockLogGroups.mockReturnValue({
      data: {
        logGroups: [{ logGroupName: "/page-1", storedBytes: 1 }],
        total: 12,
        nextToken: "offset:10",
      },
      isLoading: false, isError: false, error: null,
    });
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByLabelText("Log groups pagination")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Next page/i }));
    await waitFor(() => {
      expect(mockLogGroups).toHaveBeenCalledWith(undefined, expect.objectContaining({ nextToken: "offset:10" }));
    });
  });

  it("keeps an open-ended next control when total is only the current AWS page", async () => {
    const user = userEvent.setup();
    mockLogGroups.mockReturnValue({
      data: {
        logGroups: [{ logGroupName: "/page-1", storedBytes: 1 }],
        total: 10,
        nextToken: "aws-page-2",
      },
      isLoading: false, isError: false, error: null,
    });
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Next page/i }));
    await waitFor(() => {
      expect(mockLogGroups).toHaveBeenCalledWith(undefined, expect.objectContaining({ nextToken: "aws-page-2" }));
    });
  });

  // ── Create log group modal ─────────────────────────────

  it("opens create log group modal and submits", async () => {
    const user = userEvent.setup();
    const { container } = render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(container.textContent).toContain("Create Log Group"));
    const nameInput = screen.getByPlaceholderText("/aws/lambda/my-function");
    await user.type(nameInput, "/aws/lambda/test");
    const createBtns = screen.getAllByRole("button", { name: /Create log group/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateGroup).toHaveBeenCalledWith(
        expect.objectContaining({ logGroupName: "/aws/lambda/test" }),
        expect.any(Object),
      );
    });
  });

  it("cancels create log group modal", async () => {
    const user = userEvent.setup();
    const { container } = render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(container.textContent).toContain("Create Log Group"));
    await clickButton(user, /Cancel/i);
    expect(mockCreateGroup).not.toHaveBeenCalled();
  });

  it("shows create log group error alert", async () => {
    createGroupState.isError = true;
    createGroupState.error = new Error("Creation failed");
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Creation failed")).toBeTruthy();
    });
  });

  it("shows delete log group loading state", () => {
    deleteGroupState.isPending = true;
    deleteGroupState.variables = "/aws/lambda/del-fn";
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/del-fn" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("/aws/lambda/del-fn")).toBeTruthy();
  });

  // ── Delete log group ───────────────────────────────────

  it("deletes a log group", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/del-fn" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("/aws/lambda/del-fn")).toBeTruthy());
    const deleteBtn = screen.getByRole("button", { name: /Delete \/aws\/lambda\/del-fn/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteGroup).toHaveBeenCalledWith("/aws/lambda/del-fn"));
  });

  // ── Filter log groups ──────────────────────────────────

  it("searches log groups across pages", async () => {
    mockLogGroups.mockReturnValue({
      data: {
        logGroups: [{ logGroupName: "/aws/lambda/beta" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    const filterInput = screen.getByPlaceholderText("Find log groups by name");
    await user.type(filterInput, "beta");
    await waitFor(() => {
      expect(mockLogGroups).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({ q: "beta", nextToken: undefined }),
      );
    });
  });

  // ── Navigate to detail ─────────────────────────────────

  it("navigates to log group detail", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test-fn" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("/aws/lambda/test-fn")).toBeTruthy());
    await user.click(screen.getByText("/aws/lambda/test-fn"));
    await waitFor(() => expect(screen.getByText(/Log Streams for \/aws\/lambda\/test-fn/i)).toBeTruthy());
  });

  it("shows back button in log group detail", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
  });

  it("goes back from detail to log group list", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    await user.click(screen.getByText(/Back to Log Groups/i));
    await waitFor(() => expect(screen.getByText("/aws/lambda/test")).toBeTruthy());
  });

  it("shows all 4 detail tabs", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    expect(screen.getByRole("tab", { name: /Log Streams/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Retention/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Subscription Filters/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Tags/i })).toBeTruthy();
  });

  // ── Log streams ──────────────────────────────────────────

  it("requests the next log-streams page when pagination advances", async () => {
    const user = userEvent.setup();
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test", storedBytes: 1 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({
      data: {
        logStreams: [{ logStreamName: "s1", storedBytes: 1 }],
        total: 12,
        nextToken: "offset:10",
      },
      isLoading: false, isError: false, error: null,
    });
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByLabelText("Log streams pagination")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Next page/i }));
    await waitFor(() => {
      expect(mockLogStreams).toHaveBeenCalledWith(
        "/aws/lambda/test",
        undefined,
        expect.objectContaining({ nextToken: "offset:10" }),
      );
    });
  });

  it("shows empty log streams in detail", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/No log streams found/i)).toBeTruthy());
  });

  it("shows log streams with data and dash for missing timestamp", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({
      data: {
        logStreams: [
          { logStreamName: "stream1", storedBytes: 512, lastEventTimestamp: 1705000000000 },
          { logStreamName: "stream2", storedBytes: 1024 },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => {
      expect(screen.getByText("stream1")).toBeTruthy();
      expect(screen.getByText("stream2")).toBeTruthy();
    });
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("searches log streams across pages", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({
      data: {
        logStreams: [{ logStreamName: "beta-stream", storedBytes: 512 }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByPlaceholderText("Find streams by name")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find streams by name");
    await user.type(filterInput, "beta");
    await waitFor(() => {
      expect(mockLogStreams).toHaveBeenCalledWith(
        "/aws/lambda/test",
        undefined,
        expect.objectContaining({ q: "beta", nextToken: undefined }),
      );
    });
  });

  it("shows create log stream error alert", async () => {
    createStreamState.isError = true;
    createStreamState.error = new Error("Stream exists");
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Log Streams for/)).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Stream exists")).toBeTruthy());
  });

  it("shows log stream load error", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Streams failed") });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText("Streams failed")).toBeTruthy());
  });

  // ── Retention config ────────────────────────────────────

  it("shows retention current value in retention tab", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test", retentionInDays: 14 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    const retentionTab = screen.getByRole("tab", { name: /Retention/i });
    await user.click(retentionTab);
    await waitFor(() => expect(screen.getAllByText("14 days").length).toBeGreaterThanOrEqual(1));
  });

  it("shows retention error alert", async () => {
    putRetentionState.isError = true;
    putRetentionState.error = new Error("Update failed");
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test", retentionInDays: 7 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    const retentionTab = screen.getByRole("tab", { name: /Retention/i });
    await user.click(retentionTab);
    await waitFor(() => {
      expect(screen.getByText(/Current retention/i)).toBeTruthy();
    });
    expect(screen.getAllByText(/days/).length).toBeGreaterThanOrEqual(1);
  });

  // ── Subscription filters ────────────────────────────────

  it("shows subscription filters tab content", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    const filtersTab = screen.getByRole("tab", { name: /Subscription Filters/i });
    await user.click(filtersTab);
    await waitFor(() => expect(screen.getByText(/No subscription filters/i)).toBeTruthy());
  });

  it("shows subscription filters error", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockSubFilters.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Failed to load filters") });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    const filtersTab = screen.getByRole("tab", { name: /Subscription Filters/i });
    await user.click(filtersTab);
    await waitFor(() => expect(screen.getByText("Failed to load filters")).toBeTruthy());
  });

  it("shows subscription filters with data and default patterns", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockSubFilters.mockReturnValue({
      data: {
        subscriptionFilters: [
          { filterName: "my-filter", filterPattern: "ERROR", destinationArn: "arn:aws:lambda:...", distribution: "ByLogStream", creationTime: 1705000000000 },
          { filterName: "minimal-filter", destinationArn: "arn:aws:lambda:..." },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    const filtersTab = screen.getByRole("tab", { name: /Subscription Filters/i });
    await user.click(filtersTab);
    await waitFor(() => {
      expect(screen.getByText("my-filter")).toBeTruthy();
      expect(screen.getByText("minimal-filter")).toBeTruthy();
      expect(screen.getByText("(all events)")).toBeTruthy();
      expect(screen.getAllByText("ByLogStream").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("filters subscription filters by name", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockSubFilters.mockReturnValue({
      data: {
        subscriptionFilters: [
          { filterName: "filter-alpha", destinationArn: "arn:alpha" },
          { filterName: "filter-beta", destinationArn: "arn:beta" },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    const filtersTab = screen.getByRole("tab", { name: /Subscription Filters/i });
    await user.click(filtersTab);
    await waitFor(() => expect(screen.getByText("filter-alpha")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find filters by name");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("filter-alpha")).toBeNull());
  });

  // ── Tags tab ─────────────────────────────────────────

  it("shows tags empty state", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    const tagsTab = screen.getByRole("tab", { name: /Tags/i });
    await user.click(tagsTab);
    await waitFor(() => expect(screen.getByText(/No tags associated with this log group/i)).toBeTruthy());
  });

  it("shows tags with entries", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockTags.mockReturnValue({ data: { tags: { Environment: "prod", Owner: "devops" } }, isLoading: false, isError: false, error: null });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    const tagsTab = screen.getByRole("tab", { name: /Tags/i });
    await user.click(tagsTab);
    await waitFor(() => {
      expect(screen.getByText("Environment")).toBeTruthy();
      expect(screen.getByText("prod")).toBeTruthy();
      expect(screen.getByText("Owner")).toBeTruthy();
    });
  });

  it("shows tags loading and error states", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockTags.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    const tagsTab = screen.getByRole("tab", { name: /Tags/i });
    await user.click(tagsTab);
    await waitFor(() => expect(screen.getByText(/Loading tags/i)).toBeTruthy());
  });

  it("shows tags error state", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockTags.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Tags load failed") });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    const tagsTab = screen.getByRole("tab", { name: /Tags/i });
    await user.click(tagsTab);
    await waitFor(() => expect(screen.getByText("Tags load failed")).toBeTruthy());
  });

  // ── Log stream detail (events viewer) ───────────────────

  it("navigates to log stream detail and shows events", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({
      data: { logStreams: [{ logStreamName: "my-stream", storedBytes: 512 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogEvents.mockReturnValue({
      data: { events: [{ eventId: "e1", timestamp: 1705000000000, message: "Hello world" }] },
      isLoading: false, isError: false, error: null, refetch: vi.fn(),
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText("my-stream")).toBeTruthy());
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => {
      expect(screen.getByText("Hello world")).toBeTruthy();
      expect(screen.getByText(/Back to Log Streams/i)).toBeTruthy();
    });
  });

  it("shows events loading spinner", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({
      data: { logStreams: [{ logStreamName: "my-stream", storedBytes: 512 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogEvents.mockReturnValue({
      data: undefined, isLoading: true, isError: false, error: null, refetch: vi.fn(),
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText("my-stream")).toBeTruthy());
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Loading log events/i)).toBeTruthy());
  });

  it("shows events error alert", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({
      data: { logStreams: [{ logStreamName: "my-stream", storedBytes: 512 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogEvents.mockReturnValue({
      data: undefined, isLoading: false, isError: true, error: new Error("Events load failed"), refetch: vi.fn(),
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText("my-stream")).toBeTruthy());
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText("Events load failed")).toBeTruthy());
  });

  it("shows empty events message", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({
      data: { logStreams: [{ logStreamName: "empty-stream", storedBytes: 0 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogEvents.mockReturnValue({
      data: { events: [] }, isLoading: false, isError: false, error: null, refetch: vi.fn(),
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText("empty-stream")).toBeTruthy());
    await user.click(screen.getByText("empty-stream"));
    await waitFor(() => expect(screen.getByText(/No log events found/i)).toBeTruthy());
  });

  it("shows event without timestamp", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({
      data: { logStreams: [{ logStreamName: "my-stream", storedBytes: 512 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogEvents.mockReturnValue({
      data: { events: [{ eventId: "no-ts", message: "no timestamp event" }] },
      isLoading: false, isError: false, error: null, refetch: vi.fn(),
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText("my-stream")).toBeTruthy());
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => {
      expect(screen.getByText("—")).toBeTruthy();
      expect(screen.getByText("no timestamp event")).toBeTruthy();
    });
  });

  // ── Retention format edge cases ─────────────────────────

  it("shows retention as 1 year for 365 days", () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/retention-365", retentionInDays: 365, storedBytes: 0 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("1 year")).toBeTruthy();
  });

  // ── Generic error fallbacks (message || fallback) ───────

  it("shows generic log groups load error when error is null", () => {
    mockLogGroups.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: null });
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load log groups")).toBeTruthy();
  });

  it("shows generic create log group error when error is null", async () => {
    createGroupState.isError = true;
    createGroupState.error = null;
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Failed to create log group")).toBeTruthy());
  });

  it("closes create log group modal on success", async () => {
    mockCreateGroup.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    const { container } = render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(container.textContent).toContain("Create Log Group"));
    await user.type(screen.getByPlaceholderText("/aws/lambda/my-function"), "/aws/lambda/test");
    const createBtns = screen.getAllByRole("button", { name: /Create log group/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => expect(mockCreateGroup).toHaveBeenCalled());
    await waitFor(() =>
      expect((screen.getByPlaceholderText("/aws/lambda/my-function") as HTMLInputElement).value).toBe("")
    );
  });

  it("shows generic log streams load error when error is null", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: null });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText("Failed to load log streams")).toBeTruthy());
  });

  it("shows delete log stream loading state", async () => {
    deleteStreamState.isPending = true;
    deleteStreamState.variables = { logStreamName: "stream1" };
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({
      data: { logStreams: [{ logStreamName: "stream1", storedBytes: 512 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText("stream1")).toBeTruthy());
    const deleteBtn = screen.getByRole("button", { name: /Delete stream1/i });
    expect(deleteBtn).toHaveProperty("disabled", true);
  });

  it("shows generic create log stream error when error is null", async () => {
    createStreamState.isError = true;
    createStreamState.error = null;
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Log Streams for/)).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Failed to create log stream")).toBeTruthy());
  });

  it("creates a log stream and closes the modal on success", async () => {
    mockCreateStream.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    const { container } = render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Log Streams for/)).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(container.textContent).toContain("Create Log Stream"));
    await user.type(screen.getByPlaceholderText("my-stream"), "new-stream");
    const createBtns = screen.getAllByRole("button", { name: /Create log stream/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateStream).toHaveBeenCalledWith(
        { logGroupName: "/aws/lambda/test", logStreamName: "new-stream" },
        expect.any(Object)
      );
    });
    await waitFor(() => expect((screen.getByPlaceholderText("my-stream") as HTMLInputElement).value).toBe(""));
  });

  it("deletes a log stream after confirmation", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({
      data: { logStreams: [{ logStreamName: "del-stream", storedBytes: 512 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText("del-stream")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete del-stream/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() =>
      expect(mockDeleteStream).toHaveBeenCalledWith({ logGroupName: "/aws/lambda/test", logStreamName: "del-stream" })
    );
  });

  // ── Stream detail: toggles, refresh, scroll, delete ──────

  it("toggles auto-refresh off", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({
      data: { logStreams: [{ logStreamName: "my-stream", storedBytes: 512 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogEvents.mockReturnValue({
      data: { events: [{ eventId: "e1", timestamp: 1705000000000, message: "Hello" }] },
      isLoading: false, isError: false, error: null, refetch: vi.fn(),
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText("my-stream")).toBeTruthy());
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Back to Log Streams/i)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Auto-refresh ON/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Auto-refresh OFF/i })).toBeTruthy());
  });

  it("toggles auto-scroll off", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({
      data: { logStreams: [{ logStreamName: "my-stream", storedBytes: 512 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogEvents.mockReturnValue({
      data: { events: [{ eventId: "e1", timestamp: 1705000000000, message: "Hello" }] },
      isLoading: false, isError: false, error: null, refetch: vi.fn(),
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText("my-stream")).toBeTruthy());
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Back to Log Streams/i)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Auto-scroll ON/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Auto-scroll OFF/i })).toBeTruthy());
  });

  it("shows delete log stream loading state in detail", async () => {
    deleteStreamState.isPending = true;
    deleteStreamState.variables = { logStreamName: "my-stream" };
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({
      data: { logStreams: [{ logStreamName: "my-stream", storedBytes: 512 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogEvents.mockReturnValue({
      data: { events: [] }, isLoading: false, isError: false, error: null, refetch: vi.fn(),
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText("my-stream")).toBeTruthy());
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Back to Log Streams/i)).toBeTruthy());
    const deleteBtn = screen.getByRole("button", { name: /Delete my-stream/i });
    expect(deleteBtn).toHaveProperty("disabled", true);
  });

  it("shows generic events error when error is null", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({
      data: { logStreams: [{ logStreamName: "my-stream", storedBytes: 512 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogEvents.mockReturnValue({
      data: undefined, isLoading: false, isError: true, error: null, refetch: vi.fn(),
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText("my-stream")).toBeTruthy());
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText("Failed to load log events")).toBeTruthy());
  });

  it("shows refreshing indicator when loading with events present", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({
      data: { logStreams: [{ logStreamName: "my-stream", storedBytes: 512 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogEvents.mockReturnValue({
      data: { events: [{ eventId: "e1", timestamp: 1705000000000, message: "Hello" }] },
      isLoading: true, isError: false, error: null, refetch: vi.fn(),
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText("my-stream")).toBeTruthy());
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Refreshing events/)).toBeTruthy());
  });

  it("renders event without eventId using index key", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({
      data: { logStreams: [{ logStreamName: "my-stream", storedBytes: 512 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogEvents.mockReturnValue({
      data: { events: [{ timestamp: 1705000000000, message: "no-id event" }] },
      isLoading: false, isError: false, error: null, refetch: vi.fn(),
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText("my-stream")).toBeTruthy());
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText("no-id event")).toBeTruthy());
  });

  it("disables auto-scroll when scrolled away from bottom", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({
      data: { logStreams: [{ logStreamName: "my-stream", storedBytes: 512 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogEvents.mockReturnValue({
      data: { events: [{ eventId: "e1", timestamp: 1705000000000, message: "Hello" }] },
      isLoading: false, isError: false, error: null, refetch: vi.fn(),
    });
    const user = userEvent.setup();
    const { container } = render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText("my-stream")).toBeTruthy());
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText("Hello")).toBeTruthy());
    const scrollDiv = container.querySelector('[style*="overflow-y"]') as HTMLElement;
    expect(scrollDiv).toBeTruthy();
    Object.defineProperty(scrollDiv, "scrollHeight", { value: 1000, configurable: true });
    Object.defineProperty(scrollDiv, "scrollTop", { value: 500, configurable: true });
    Object.defineProperty(scrollDiv, "clientHeight", { value: 100, configurable: true });
    fireEvent.scroll(scrollDiv);
    await waitFor(() => expect(screen.getByRole("button", { name: /Auto-scroll OFF/i })).toBeTruthy());
  });

  it("keeps auto-scroll on when scrolled while at the bottom", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({
      data: { logStreams: [{ logStreamName: "my-stream", storedBytes: 512 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogEvents.mockReturnValue({
      data: { events: [{ eventId: "e1", timestamp: 1705000000000, message: "Hello" }] },
      isLoading: false, isError: false, error: null, refetch: vi.fn(),
    });
    const user = userEvent.setup();
    const { container } = render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText("my-stream")).toBeTruthy());
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText("Hello")).toBeTruthy());
    const scrollDiv = container.querySelector('[style*="overflow-y"]') as HTMLElement;
    // Default happy-dom metrics (scrollHeight/scrollTop/clientHeight all 0) mean the
    // scroll position is at the bottom (0 - 0 - 0 < 50), so auto-scroll stays on.
    fireEvent.scroll(scrollDiv);
    await waitFor(() => expect(screen.getByRole("button", { name: /Auto-scroll ON/i })).toBeTruthy());
  });

  it("refreshes events via the refresh button", async () => {
    const mockRefetch = vi.fn();
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({
      data: { logStreams: [{ logStreamName: "my-stream", storedBytes: 512 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogEvents.mockReturnValue({
      data: { events: [{ eventId: "e1", timestamp: 1705000000000, message: "Hello" }] },
      isLoading: false, isError: false, error: null, refetch: mockRefetch,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText("my-stream")).toBeTruthy());
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByRole("button", { name: /^Refresh$/i })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Refresh$/i }));
    expect(mockRefetch).toHaveBeenCalled();
  });

  // ── Retention config ─────────────────────────────────────

  it("shows retention loading state", async () => {
    let lgCalls = 0;
    mockLogGroups.mockImplementation(() => {
      lgCalls++;
      if (lgCalls === 1) {
        return { data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 }, isLoading: false, isError: false, error: null };
      }
      return { data: undefined, isLoading: true, isError: false, error: null };
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Retention/i }));
    await waitFor(() => expect(screen.getByText(/Loading retention settings/)).toBeTruthy());
  });

  it("shows Never expire for retention when log groups data missing", async () => {
    let lgCalls = 0;
    mockLogGroups.mockImplementation(() => {
      lgCalls++;
      if (lgCalls === 1) {
        return { data: { logGroups: [{ logGroupName: "/aws/lambda/test", retentionInDays: 14 }], total: 1 }, isLoading: false, isError: false, error: null };
      }
      return { data: undefined, isLoading: false, isError: false, error: null };
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Retention/i }));
    await waitFor(() => expect(screen.getAllByText("Never expire").length).toBeGreaterThanOrEqual(1));
  });

  it("shows custom retention label when days not in options", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test", retentionInDays: 45 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Retention/i }));
    await waitFor(() => expect(screen.getAllByText("45 days").length).toBeGreaterThanOrEqual(1));
  });

  it("shows generic retention update error when error is null", async () => {
    putRetentionState.isError = true;
    putRetentionState.error = null;
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test", retentionInDays: 7 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Retention/i }));
    await waitFor(() => expect(screen.getByText("Failed to update retention policy")).toBeTruthy());
  });

  it("saves retention policy with selected days", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test", retentionInDays: 14 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Retention/i }));
    await waitFor(() => expect(screen.getAllByText("14 days").length).toBeGreaterThanOrEqual(1));
    // Open the Select and choose 7 days
    await user.click(screen.getByRole("button", { name: /14 days/i }));
    await user.click(screen.getAllByRole("option", { name: /7 days/i })[0]);
    await clickButton(user, /Save retention/i);
    await waitFor(() =>
      expect(mockPutRetention).toHaveBeenCalledWith({ logGroupName: "/aws/lambda/test", retentionInDays: 7 })
    );
  });

  // ── Subscription filter edge cases ───────────────────────

  it("shows generic subscription filter load error when error is null", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockSubFilters.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: null });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Subscription Filters/i }));
    await waitFor(() => expect(screen.getByText("Failed to load subscription filters")).toBeTruthy());
  });

  it("shows delete subscription filter loading state", async () => {
    deleteFilterState.isPending = true;
    deleteFilterState.variables = { filterName: "my-filter" };
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockSubFilters.mockReturnValue({
      data: { subscriptionFilters: [{ filterName: "my-filter", destinationArn: "arn:1" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Subscription Filters/i }));
    await waitFor(() => expect(screen.getByText("my-filter")).toBeTruthy());
    const deleteBtn = screen.getByRole("button", { name: /Delete my-filter/i });
    expect(deleteBtn).toHaveProperty("disabled", true);
  });

  it("creates a subscription filter with pattern", async () => {
    mockPutFilter.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Subscription Filters/i }));
    await waitFor(() => expect(screen.getByText(/No subscription filters/i)).toBeTruthy());
    await clickButton(user, /Create subscription filter/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-filter")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-filter"), "filter-1");
    await user.type(screen.getByPlaceholderText("arn:aws:lambda:us-east-1:..."), "arn:aws:lambda:us-east-1:123:function:fn");
    await user.type(screen.getByPlaceholderText("?ERROR ?WARN"), "ERROR");
    await clickButton(user, /Create filter/i);
    await waitFor(() =>
      expect(mockPutFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          logGroupName: "/aws/lambda/test",
          filterName: "filter-1",
          filterPattern: "ERROR",
          destinationArn: "arn:aws:lambda:us-east-1:123:function:fn",
        }),
        expect.any(Object)
      )
    );
  });

  it("creates a subscription filter without pattern", async () => {
    mockPutFilter.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Subscription Filters/i }));
    await waitFor(() => expect(screen.getByText(/No subscription filters/i)).toBeTruthy());
    await clickButton(user, /Create subscription filter/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-filter")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-filter"), "filter-2");
    await user.type(screen.getByPlaceholderText("arn:aws:lambda:us-east-1:..."), "arn:aws:lambda:us-east-1:123:function:fn");
    await clickButton(user, /Create filter/i);
    await waitFor(() =>
      expect(mockPutFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          logGroupName: "/aws/lambda/test",
          filterName: "filter-2",
          filterPattern: undefined,
          destinationArn: "arn:aws:lambda:us-east-1:123:function:fn",
        }),
        expect.any(Object)
      )
    );
  });

  it("keeps create filter disabled until required fields are filled", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Subscription Filters/i }));
    await waitFor(() => expect(screen.getByText(/No subscription filters/i)).toBeTruthy());
    await clickButton(user, /Create subscription filter/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-filter")).toBeTruthy());
    // Fill only the name — Create should stay disabled
    await user.type(screen.getByPlaceholderText("my-filter"), "filter-3");
    const createBtn = screen.getByRole("button", { name: /Create filter/i });
    expect(createBtn).toHaveProperty("disabled", true);
  });

  it("shows generic create filter error when error is null", async () => {
    putFilterState.isError = true;
    putFilterState.error = null;
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Subscription Filters/i }));
    await waitFor(() => expect(screen.getByText(/No subscription filters/i)).toBeTruthy());
    await clickButton(user, /Create subscription filter/i);
    await waitFor(() => expect(screen.getByText("Failed to create subscription filter")).toBeTruthy());
  });

  it("shows create filter error message when error present", async () => {
    putFilterState.isError = true;
    putFilterState.error = new Error("Filter exists");
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Subscription Filters/i }));
    await waitFor(() => expect(screen.getByText(/No subscription filters/i)).toBeTruthy());
    await clickButton(user, /Create subscription filter/i);
    await waitFor(() => expect(screen.getByText("Filter exists")).toBeTruthy());
  });

  it("cancels the create subscription filter modal", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Subscription Filters/i }));
    await waitFor(() => expect(screen.getByText(/No subscription filters/i)).toBeTruthy());
    await clickButton(user, /Create subscription filter/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-filter")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-filter"), "filter-4");
    await clickButton(user, /Cancel/i);
    expect(mockPutFilter).not.toHaveBeenCalled();
  });

  it("deletes a subscription filter after confirmation", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockSubFilters.mockReturnValue({
      data: { subscriptionFilters: [{ filterName: "del-filter", destinationArn: "arn:1" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Subscription Filters/i }));
    await waitFor(() => expect(screen.getByText("del-filter")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete del-filter/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() =>
      expect(mockDeleteFilter).toHaveBeenCalledWith({ logGroupName: "/aws/lambda/test", filterName: "del-filter" })
    );
  });

  // ── Tags edge cases ──────────────────────────────────────

  it("shows generic tags load error when error is null", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockTags.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: null });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Tags/i }));
    await waitFor(() => expect(screen.getByText("Failed to load tags")).toBeTruthy());
  });

  it("adds a tag", async () => {
    mockTagGroup.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Tags/i }));
    await waitFor(() => expect(screen.getByText(/No tags associated/i)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("tag-key"), "env");
    await user.type(screen.getByPlaceholderText("tag-value"), "prod");
    await clickButton(user, /Add tag/i);
    await waitFor(() =>
      expect(mockTagGroup).toHaveBeenCalledWith(
        { logGroupName: "/aws/lambda/test", tags: { env: "prod" } },
        expect.any(Object)
      )
    );
  });

  it("removes a tag", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockTags.mockReturnValue({ data: { tags: { Environment: "prod" } }, isLoading: false, isError: false, error: null });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Tags/i }));
    await waitFor(() => expect(screen.getByText("Environment")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Remove tag Environment/i }));
    await waitFor(() =>
      expect(mockUntagGroup).toHaveBeenCalledWith({ logGroupName: "/aws/lambda/test", tags: ["Environment"] })
    );
  });

  // ── Flow completions ────────────────────────────────────

  it("dismisses create log group modal with Escape", async () => {
    const user = userEvent.setup();
    const { container } = render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(container.textContent).toContain("Create Log Group"));
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create Log Group"));
  });

  it("dismisses create log stream modal with Escape", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    await clickButton(user, /Create log stream/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-stream")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create Log Stream"));
  });

  it("cancels create log stream modal", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    await clickButton(user, /Create log stream/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-stream")).toBeTruthy());
    await clickButton(user, /Cancel/i, { last: true });
    await waitFor(() => expectModalHidden("Create Log Stream"));
  });

  it("dismisses create subscription filter modal with Escape", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Subscription Filters/i }));
    await clickButton(user, /Create subscription filter/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-filter")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create Subscription Filter"));
  });

  it("goes back from stream detail to streams list", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({
      data: { logStreams: [{ logStreamName: "my-stream", storedBytes: 512 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogEvents.mockReturnValue({
      data: { events: [{ eventId: "e1", timestamp: 1705000000000, message: "Hello" }] },
      isLoading: false, isError: false, error: null, refetch: vi.fn(),
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText("my-stream")).toBeTruthy());
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText("Hello")).toBeTruthy());
    await clickButton(user, /Back to Log Streams/i);
    await waitFor(() => expect(screen.getByText("my-stream")).toBeTruthy());
    expect(screen.queryByText("Hello")).toBeNull();
  });

  it("changes events limit via select", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({
      data: { logStreams: [{ logStreamName: "my-stream", storedBytes: 512 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogEvents.mockReturnValue({
      data: { events: [{ eventId: "e1", timestamp: 1705000000000, message: "Hello" }] },
      isLoading: false, isError: false, error: null, refetch: vi.fn(),
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText("my-stream")).toBeTruthy());
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByRole("button", { name: /Events limit/i })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Events limit/i }));
    await user.click(screen.getAllByRole("option", { name: /1000/i })[0]);
    await waitFor(() => expect(screen.getByRole("button", { name: /1000/i })).toBeTruthy());
  });

  it("deletes a log stream from detail and goes back", async () => {
    mockDeleteStream.mockResolvedValue(undefined);
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({
      data: { logStreams: [{ logStreamName: "my-stream", storedBytes: 512 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogEvents.mockReturnValue({
      data: { events: [{ eventId: "e1", timestamp: 1705000000000, message: "Hello" }] },
      isLoading: false, isError: false, error: null, refetch: vi.fn(),
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText("my-stream")).toBeTruthy());
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText("Hello")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete my-stream/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() =>
      expect(mockDeleteStream).toHaveBeenCalledWith({ logGroupName: "/aws/lambda/test", logStreamName: "my-stream" })
    );
    await waitFor(() => expect(screen.getByText("my-stream")).toBeTruthy());
  });

  it("removes retention policy by choosing Never expire", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test", retentionInDays: 7 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Retention/i }));
    await waitFor(() => expect(screen.getAllByText("7 days").length).toBeGreaterThanOrEqual(1));
    await user.click(screen.getByRole("button", { name: /7 days/i }));
    await user.click(screen.getAllByRole("option", { name: /Never expire/i })[0]);
    await clickButton(user, /Save retention/i);
    await waitFor(() => expect(mockDeleteRetention).toHaveBeenCalledWith("/aws/lambda/test"));
  });

  // ── Filter-pattern search (single stream) ───────────────

  async function gotoStream(user: ReturnType<typeof userEvent.setup>) {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({
      data: { logStreams: [{ logStreamName: "my-stream", storedBytes: 512 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText("my-stream")).toBeTruthy());
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Back to Log Streams/i)).toBeTruthy());
  }

  it("shows the filter-pattern search box in the stream viewer", async () => {
    const user = userEvent.setup();
    await gotoStream(user);
    expect(screen.getByLabelText("Filter pattern")).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Search$/i })).toBeTruthy();
    // Hint reflects Floci's actual behaviour (case-sensitive substring match).
    expect(screen.getByText(/case-sensitive/i)).toBeTruthy();
  });

  it("runs a filter-pattern search scoped to the current stream", async () => {
    const user = userEvent.setup();
    mockFilteredLogEvents.mockReturnValue({
      data: { events: [{ eventId: "f1", timestamp: 1705000000000, message: "boom ERROR here" }] },
      isLoading: false, isError: false, error: null, refetch: vi.fn(),
    });
    await gotoStream(user);
    await user.type(screen.getByLabelText("Filter pattern"), "ERROR");
    await user.click(screen.getByRole("button", { name: /^Search$/i }));
    await waitFor(() =>
      expect(mockFilteredLogEvents).toHaveBeenLastCalledWith(
        "/aws/lambda/test",
        "my-stream",
        expect.objectContaining({ filterPattern: "ERROR" }),
        expect.anything()
      )
    );
    expect(screen.getByText("boom ERROR here")).toBeTruthy();
  });

  it("shows a no-match empty state when a search returns nothing", async () => {
    const user = userEvent.setup();
    mockFilteredLogEvents.mockReturnValue({
      data: { events: [] }, isLoading: false, isError: false, error: null, refetch: vi.fn(),
    });
    await gotoStream(user);
    await user.type(screen.getByLabelText("Filter pattern"), "NOPE");
    await user.click(screen.getByRole("button", { name: /^Search$/i }));
    // Default window is "Last 1 hour" — the empty state should nudge widening it.
    await waitFor(() =>
      expect(screen.getByText(/No events matched .* widen the time range/i)).toBeTruthy()
    );
  });

  it("clears the search and returns to live-tail mode", async () => {
    const user = userEvent.setup();
    await gotoStream(user);
    await user.type(screen.getByLabelText("Filter pattern"), "ERROR");
    await user.click(screen.getByRole("button", { name: /^Search$/i }));
    await waitFor(() =>
      expect(mockFilteredLogEvents).toHaveBeenLastCalledWith(
        "/aws/lambda/test", "my-stream",
        expect.objectContaining({ filterPattern: "ERROR" }),
        expect.anything()
      )
    );
    await user.click(screen.getByRole("button", { name: /Clear/i }));
    await waitFor(() =>
      expect(mockFilteredLogEvents).toHaveBeenLastCalledWith(
        "/aws/lambda/test", "my-stream",
        expect.objectContaining({ filterPattern: "" }),
        expect.anything()
      )
    );
  });

  it("runs the search on Enter and ignores other keys", async () => {
    const user = userEvent.setup();
    await gotoStream(user);
    const input = screen.getByLabelText("Filter pattern");
    await user.type(input, "ERROR");
    // A non-Enter key must not commit the filter.
    await user.type(input, "{Escape}");
    expect(mockFilteredLogEvents).not.toHaveBeenCalledWith(
      "/aws/lambda/test", "my-stream",
      expect.objectContaining({ filterPattern: "ERROR" }),
      expect.anything()
    );
    await user.type(input, "{Enter}");
    await waitFor(() =>
      expect(mockFilteredLogEvents).toHaveBeenLastCalledWith(
        "/aws/lambda/test", "my-stream",
        expect.objectContaining({ filterPattern: "ERROR" }),
        expect.anything()
      )
    );
  });

  it("drops the time window when the range is switched to All time", async () => {
    const user = userEvent.setup();
    await gotoStream(user);
    await user.click(screen.getByRole("button", { name: /Time range/i }));
    await user.click(screen.getAllByRole("option", { name: /All time/i })[0]);
    await user.type(screen.getByLabelText("Filter pattern"), "ERROR");
    await user.click(screen.getByRole("button", { name: /^Search$/i }));
    await waitFor(() =>
      expect(mockFilteredLogEvents).toHaveBeenLastCalledWith(
        "/aws/lambda/test", "my-stream",
        expect.objectContaining({ filterPattern: "ERROR", startTimeOffsetMs: undefined }),
        expect.anything()
      )
    );
  });
});

describe("CloudWatchLogsDashboard — Data Protection tab", () => {
  beforeEach(() => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false,
    });
  });

  it("shows loading state for data protection policy", async () => {
    mockDataProtection.mockReturnValue({ data: undefined, isLoading: true });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    const dpTab = screen.getByRole("tab", { name: /Data Protection/i });
    await user.click(dpTab);
    await waitFor(() => expect(screen.getByText("Data Protection")).toBeTruthy());
  });

  it("shows no policy message when policyDocument is empty", async () => {
    mockDataProtection.mockReturnValue({ data: { logGroupIdentifier: "", policyDocument: "" }, isLoading: false });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    const dpTab = screen.getByRole("tab", { name: /Data Protection/i });
    await user.click(dpTab);
    await waitFor(() => expect(screen.getByText(/No data protection policy configured/i)).toBeTruthy());
  });

  it("renders parsed policy JSON when policyDocument is valid", async () => {
    mockDataProtection.mockReturnValue({
      data: { logGroupIdentifier: "/aws/lambda/test", policyDocument: JSON.stringify({ Name: "my-policy" }) },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    const dpTab = screen.getByRole("tab", { name: /Data Protection/i });
    await user.click(dpTab);
    await waitFor(() => expect(screen.getByText(/my-policy/)).toBeTruthy());
  });

  it("shows no policy message when policyDocument is invalid JSON", async () => {
    mockDataProtection.mockReturnValue({
      data: { logGroupIdentifier: "/aws/lambda/test", policyDocument: "not-json" },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    const dpTab = screen.getByRole("tab", { name: /Data Protection/i });
    await user.click(dpTab);
    await waitFor(() => expect(screen.getByText(/No data protection policy configured/i)).toBeTruthy());
  });
});


// ─── Log Management tab (E.9 batch 4) ────────────────────

describe("CloudWatchLogsDashboard — Log Management", () => {
  async function openLogManagement(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole("tab", { name: /Log Management/i }));
    await waitFor(() =>
      expect(screen.getAllByText("Account Policies").length).toBeGreaterThan(0)
    );
  }

  /** Last input with a placeholder: viewed-tab panels render after earlier ones. */
  function lastByPlaceholder(placeholder: string): HTMLElement {
    const matches = screen.getAllByPlaceholderText(placeholder);
    return matches[matches.length - 1];
  }

  it("renders the Log Management tab with the Account Policies panel by default", async () => {
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    expect(screen.getByText(/No account policies/i)).toBeTruthy();
  });

  it("renders account policies including a policy without lastUpdatedTime", async () => {
    mockAccountPolicies.mockReturnValue({
      data: {
        accountPolicies: [
          { policyName: "dp", policyType: "DATA_PROTECTION", scope: "ACCOUNT", policyDocument: "{}", lastUpdatedTime: 1705000000000 },
          { policyName: "fi", policyType: "FIELD_INDEX", policyDocument: "{}" },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    expect(screen.getByText("dp")).toBeTruthy();
    expect(screen.getByText("fi")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("shows account policies load error and the fallback message arm", async () => {
    mockAccountPolicies.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("") });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    expect(screen.getByText("Failed to load account policies")).toBeTruthy();
  });

  it("shows account policies load error with the error message", async () => {
    mockAccountPolicies.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Policies down") });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    expect(screen.getByText("Policies down")).toBeTruthy();
  });

  it("submits the Put Account Policy modal", async () => {
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await clickButton(user, /Create Account Policy/i);
    const dialog = dialogOf("Put Account Policy");
    await user.type(within(dialog).getByPlaceholderText("my-data-protection-policy"), "my-policy");
    await user.type(within(dialog).getByPlaceholderText('{"Rules":[]}'), "doc");
    await user.click(within(dialog).getByText(/Save policy/i));
    await waitFor(() =>
      expect(mockPutAccountPolicy).toHaveBeenCalledWith(
        { policyName: "my-policy", policyDocument: "doc", policyType: "DATA_PROTECTION", scope: "ACCOUNT" },
        expect.any(Object)
      )
    );
  });

  it("shows the account policy mutation error fallback when error has no message", async () => {
    putAccountPolicyState.isError = true;
    putAccountPolicyState.error = null;
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await clickButton(user, /Create Account Policy/i);
    await waitFor(() => expect(screen.getByText("Failed to save account policy")).toBeTruthy());
  });

  it("loads metric filters for a log group", async () => {
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Metric Filters/i }));
    await waitFor(() => expect(screen.getByText("Load filters")).toBeTruthy());
    await user.type(lastByPlaceholder("/aws/lambda/my-function"), "/aws/test");
    await clickButton(user, /Load filters/i);
    await waitFor(() => expect(mockMetricFilters).toHaveBeenLastCalledWith("/aws/test"));
  });

  it("renders metric filter rows including the all-events and no-transformations arms", async () => {
    mockMetricFilters.mockReturnValue({
      data: {
        metricFilters: [
          { filterName: "mf-1", logGroupName: "/aws/test", creationTime: 1705000000000, metricTransformations: [{ metricNamespace: "App", metricName: "Errors" }] },
          { filterName: "mf-2", logGroupName: "/aws/test", metricTransformations: [] },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Metric Filters/i }));
    await user.type(lastByPlaceholder("/aws/lambda/my-function"), "/aws/test");
    await clickButton(user, /Load filters/i);
    await waitFor(() => expect(screen.getByText("mf-1")).toBeTruthy());
    expect(screen.getAllByText("(all events)").length).toBeGreaterThan(0);
    expect(screen.getByText("App/Errors")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("shows the metric filters empty prompt when no group is loaded", async () => {
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Metric Filters/i }));
    await waitFor(() =>
      expect(screen.getByText("Enter a log group name to list its metric filters.")).toBeTruthy()
    );
  });

  it("creates a metric filter for the loaded group", async () => {
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Metric Filters/i }));
    await user.type(lastByPlaceholder("/aws/lambda/my-function"), "/aws/test");
    await clickButton(user, /Load filters/i);
    await clickButton(user, /Create metric filter/i);
    const dialog = dialogOf("Create Metric Filter for /aws/test");
    await user.type(within(dialog).getByPlaceholderText("error-count"), "mf-1");
    await user.type(within(dialog).getByPlaceholderText("ERROR"), "ERROR");
    await user.type(within(dialog).getByPlaceholderText("Errors"), "Errors");
    await user.type(within(dialog).getByPlaceholderText("MyApp"), "App");
    await user.click(within(dialog).getByText(/Create filter/i));
    await waitFor(() =>
      expect(mockPutMetricFilter).toHaveBeenCalledWith(
        {
          logGroupName: "/aws/test",
          filterName: "mf-1",
          filterPattern: "ERROR",
          metricTransformations: [{ metricName: "Errors", metricNamespace: "App", metricValue: "1" }],
        },
        expect.any(Object)
      )
    );
  });

  it("shows the metric filter mutation error fallback", async () => {
    putMetricFilterState.isError = true;
    putMetricFilterState.error = null;
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Metric Filters/i }));
    await user.type(lastByPlaceholder("/aws/lambda/my-function"), "/aws/test");
    await clickButton(user, /Load filters/i);
    await clickButton(user, /Create metric filter/i);
    await waitFor(() => expect(screen.getByText("Failed to create metric filter")).toBeTruthy());
  });

  it("deletes a metric filter after confirmation", async () => {
    mockMetricFilters.mockReturnValue({
      data: {
        metricFilters: [{ filterName: "mf-1", logGroupName: "/aws/test", metricTransformations: [] }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    mockDeleteMetricFilter.mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Metric Filters/i }));
    await user.type(lastByPlaceholder("/aws/lambda/my-function"), "/aws/test");
    await clickButton(user, /Load filters/i);
    await waitFor(() => expect(screen.getByText("mf-1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete mf-1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() =>
      expect(mockDeleteMetricFilter).toHaveBeenCalledWith({ logGroupName: "/aws/test", filterName: "mf-1" })
    );
  });

  it("tests a metric filter pattern and renders matches", async () => {
    mockTestMetricFilter.mockResolvedValueOnce({
      matches: [{ eventNumber: 1, eventMessage: "ERROR: boom", extractedValues: { msg: "boom" } }],
      total: 1,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Metric Filters/i }));
    await clickButton(user, /Test a filter pattern/i);
    const dialog = dialogOf("Test Metric Filter Pattern");
    await user.type(within(dialog).getByPlaceholderText("ERROR"), "ERROR");
    await user.type(within(dialog).getByLabelText("Test log event messages"), "ERROR: boom\n\nINFO: ok");
    await user.click(within(dialog).getByText(/Test pattern/i));
    await waitFor(() =>
      expect(mockTestMetricFilter).toHaveBeenCalledWith({
        filterPattern: "ERROR",
        logEventMessages: ["ERROR: boom", "INFO: ok"],
      })
    );
    await waitFor(() => expect(screen.getByText("1 matches")).toBeTruthy());
    expect(screen.getByText("ERROR: boom").className).toBeDefined();
    expect(screen.getByText('{"msg":"boom"}')).toBeTruthy();
  });

  it("shows the no-matches message when the pattern matches nothing", async () => {
    mockTestMetricFilter.mockResolvedValueOnce({ matches: [], total: 0 });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Metric Filters/i }));
    await clickButton(user, /Test a filter pattern/i);
    const dialog = dialogOf("Test Metric Filter Pattern");
    await user.type(within(dialog).getByPlaceholderText("ERROR"), "ERROR");
    await user.type(within(dialog).getByLabelText("Test log event messages"), "INFO: ok");
    await user.click(within(dialog).getByText(/Test pattern/i));
    await waitFor(() => expect(screen.getByText(/No events matched this pattern/i)).toBeTruthy());
  });

  it("shows the test-failure toast path when the test mutation rejects", async () => {
    mockTestMetricFilter.mockRejectedValueOnce(new Error("bad pattern"));
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Metric Filters/i }));
    await clickButton(user, /Test a filter pattern/i);
    const dialog = dialogOf("Test Metric Filter Pattern");
    await user.type(within(dialog).getByPlaceholderText("ERROR"), "ERROR");
    await user.type(within(dialog).getByLabelText("Test log event messages"), "x");
    await user.click(within(dialog).getByText(/Test pattern/i));
    await waitFor(() => expect(mockTestMetricFilter).toHaveBeenCalled());
  });

  it("saves a destination with an optional roleArn and shows the saved destination", async () => {
    mockPutDestination.mockImplementation((_data: any, opts: any) => {
      opts.onSuccess({ destination: { destinationName: "dest-1", arn: "arn:aws:logs:...:dest-1" } });
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Destinations/i }));
    await waitFor(() => expect(screen.getAllByText("Destinations").length).toBeGreaterThan(0));
    await user.type(screen.getAllByPlaceholderText("my-destination")[0], "dest-1");
    await user.type(screen.getByPlaceholderText("arn:aws:kinesis:us-east-1:..."), "arn:aws:kinesis:x");
    await clickButton(user, /Save destination/i);
    await waitFor(() =>
      expect(mockPutDestination).toHaveBeenCalledWith(
        { destinationName: "dest-1", targetArn: "arn:aws:kinesis:x", roleArn: undefined },
        expect.any(Object)
      )
    );
    await waitFor(() => expect(screen.getAllByText(/arn:aws:logs:\.\.\.:dest-1/).length).toBeGreaterThan(0));
  });

  it("falls back to targetArn when the saved destination has no arn", async () => {
    mockPutDestination.mockImplementation((_data: any, opts: any) => {
      opts.onSuccess({ destination: { destinationName: "dest-2", targetArn: "arn:aws:kinesis:y" } });
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Destinations/i }));
    await waitFor(() => expect(screen.getAllByText("Destinations").length).toBeGreaterThan(0));
    await user.type(screen.getAllByPlaceholderText("my-destination")[0], "dest-2");
    await user.type(screen.getByPlaceholderText("arn:aws:kinesis:us-east-1:..."), "arn:aws:kinesis:y");
    await clickButton(user, /Save destination/i);
    await waitFor(() => expect(screen.getAllByText(/arn:aws:kinesis:y/).length).toBeGreaterThan(0));
  });

  it("shows the destination mutation error fallback", async () => {
    putDestinationState.isError = true;
    putDestinationState.error = null;
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Destinations/i }));
    await waitFor(() => expect(screen.getByText("Failed to save destination")).toBeTruthy());
  });

  it("attaches a destination access policy", async () => {
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Destinations/i }));
    await waitFor(() => expect(screen.getByText(/Destination access policy/)).toBeTruthy());
    await user.type(lastByPlaceholder("my-destination"), "dest-1");
    await user.type(screen.getByPlaceholderText('{"Version":"2012-10-17","Statement":[]}'), "policy-doc");
    await clickButton(user, /Attach access policy/i);
    await waitFor(() =>
      expect(mockPutDestinationPolicy).toHaveBeenCalledWith(
        { destinationName: "dest-1", accessPolicy: "policy-doc" },
        expect.any(Object)
      )
    );
  });

  it("shows the destination policy mutation error fallback", async () => {
    putDestinationPolicyState.isError = true;
    putDestinationPolicyState.error = null;
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Destinations/i }));
    await waitFor(() => expect(screen.getByText("Failed to attach access policy")).toBeTruthy());
  });

  it("renders resource policies and both lastUpdatedTime arms", async () => {
    mockResourcePolicies.mockReturnValue({
      data: {
        resourcePolicies: [
          { policyName: "rp-1", policyDocument: "{}", lastUpdatedTime: 1705000000000 },
          { policyName: "rp-2", policyDocument: "{}" },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Resource Policies/i }));
    await waitFor(() => expect(screen.getByText("rp-1")).toBeTruthy());
    expect(screen.getByText("rp-2")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("shows resource policies load error and creates a resource policy", async () => {
    mockResourcePolicies.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("RP down") });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Resource Policies/i }));
    await waitFor(() => expect(screen.getByText("RP down")).toBeTruthy());
    await clickButton(user, /Create Resource Policy/i);
    const dialog = dialogOf("Put Resource Policy");
    await user.type(within(dialog).getByPlaceholderText("cross-account-subscription"), "rp-1");
    await user.type(within(dialog).getByPlaceholderText('{"Version":"2012-10-17","Statement":[]}'), "doc");
    await user.click(within(dialog).getByText(/Save policy/i));
    await waitFor(() =>
      expect(mockPutResourcePolicy).toHaveBeenCalledWith(
        { policyName: "rp-1", policyDocument: "doc" },
        expect.any(Object)
      )
    );
  });

  it("shows the resource policy mutation error fallback", async () => {
    putResourcePolicyState.isError = true;
    putResourcePolicyState.error = null;
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Resource Policies/i }));
    await clickButton(user, /Create Resource Policy/i);
    await waitFor(() => expect(screen.getByText("Failed to save resource policy")).toBeTruthy());
  });

  it("shows the resource policies load error fallback when error has no message", async () => {
    mockResourcePolicies.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("") });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Resource Policies/i }));
    await waitFor(() => expect(screen.getByText("Failed to load resource policies")).toBeTruthy());
  });

  it("applies deletion protection enabled", async () => {
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Deletion Protection/i }));
    await waitFor(() => expect(screen.getByText(/Log group deletion protection/)).toBeTruthy());
    await user.type(lastByPlaceholder("/aws/lambda/my-function"), "/aws/test");
    await clickButton(user, /^Apply$/i);
    await waitFor(() =>
      expect(mockPutProtection).toHaveBeenCalledWith(
        { logGroupIdentifier: "/aws/test", deletionProtectionEnabled: true },
        expect.any(Object)
      )
    );
  });

  it("applies deletion protection disabled after unchecking", async () => {
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Deletion Protection/i }));
    await waitFor(() => expect(screen.getByRole("checkbox")).toBeTruthy());
    await user.click(screen.getByRole("checkbox"));
    await user.type(lastByPlaceholder("/aws/lambda/my-function"), "/aws/test");
    await clickButton(user, /^Apply$/i);
    await waitFor(() =>
      expect(mockPutProtection).toHaveBeenCalledWith(
        { logGroupIdentifier: "/aws/test", deletionProtectionEnabled: false },
        expect.any(Object)
      )
    );
  });

  it("shows the deletion protection error fallback", async () => {
    putProtectionState.isError = true;
    putProtectionState.error = null;
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Deletion Protection/i }));
    await waitFor(() => expect(screen.getByText("Failed to update deletion protection")).toBeTruthy());
  });

  it("runs an Insights query and renders results with the missing-field arm", async () => {
    mockStartQuery.mockResolvedValueOnce({ queryId: "q-1" });
    mockQueryResults.mockReturnValue({
      data: {
        queryId: "q-1",
        status: "Complete",
        results: [
          [
            { field: "@timestamp", value: "2026-01-01" },
            { field: "@message", value: "hello" },
          ],
          [{ field: "@message", value: "second" }],
        ],
        statistics: { recordsMatched: 2, recordsScanned: 100, bytesScanned: 0 },
      },
      isLoading: false, isError: false, error: null, refetch: mockInsightsRefetch,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Logs Insights/i }));
    await user.type(lastByPlaceholder("/aws/lambda/my-function"), "/aws/test");
    await clickButton(user, /Run query/i);
    await waitFor(() =>
      expect(mockStartQuery).toHaveBeenCalledWith({
        logGroupName: "/aws/test",
        startTime: expect.any(Number),
        endTime: expect.any(Number),
        queryString: "fields @timestamp, @message | limit 20",
      })
    );
    await waitFor(() => expect(screen.getByText("hello")).toBeTruthy());
    expect(screen.getByText("2026-01-01")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(screen.getByText(/Scanned 100 records — matched 2/)).toBeTruthy();
    expect(screen.getByText("Complete")).toBeTruthy();
    await clickButton(user, /Refresh/i);
    expect(mockInsightsRefetch).toHaveBeenCalled();
  });

  it("shows the running state with a Stop button and stops the query", async () => {
    mockStartQuery.mockResolvedValueOnce({ queryId: "q-2" });
    mockStopQuery.mockResolvedValueOnce({ success: true });
    mockQueryResults.mockReturnValue({
      data: { queryId: "q-2", status: "Running", results: [], statistics: { recordsMatched: 0, recordsScanned: 0, bytesScanned: 0 } },
      isLoading: false, isError: false, error: null, refetch: vi.fn(),
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Logs Insights/i }));
    await user.type(lastByPlaceholder("/aws/lambda/my-function"), "/aws/test");
    await clickButton(user, /Run query/i);
    await waitFor(() => expect(screen.getByText("Running")).toBeTruthy());
    expect(screen.getByText(/Query is running/i)).toBeTruthy();
    await clickButton(user, /Stop query/i);
    await waitFor(() => expect(mockStopQuery).toHaveBeenCalledWith("q-2"));
  });

  it("shows the completed-empty results message after a cancelled query", async () => {
    mockStartQuery.mockResolvedValueOnce({ queryId: "q-3" });
    mockQueryResults.mockReturnValue({
      data: { queryId: "q-3", status: "Cancelled", results: [], statistics: { recordsMatched: 0, recordsScanned: 0, bytesScanned: 0 } },
      isLoading: false, isError: false, error: null, refetch: vi.fn(),
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Logs Insights/i }));
    await user.type(lastByPlaceholder("/aws/lambda/my-function"), "/aws/test");
    await clickButton(user, /Run query/i);
    await waitFor(() => expect(screen.getByText(/No results yet/i)).toBeTruthy());
    expect(screen.queryByText(/Stop query/i)).toBeNull();
  });

  it("keeps the Run button disabled until a log group is entered", async () => {
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Logs Insights/i }));
    await waitFor(() => expect(screen.getAllByText("Logs Insights").length).toBeGreaterThan(0));
    const runButtons = screen.getAllByRole("button", { name: /Run query/i });
    expect((runButtons[0] as HTMLButtonElement).disabled).toBe(true);
    await user.type(lastByPlaceholder("/aws/lambda/my-function"), "/aws/test");
    await waitFor(() => expect((runButtons[0] as HTMLButtonElement).disabled).toBe(false));
  });

  it("shows an error toast path when starting the query rejects", async () => {
    mockStartQuery.mockRejectedValueOnce(new Error("query failed"));
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Logs Insights/i }));
    await user.type(lastByPlaceholder("/aws/lambda/my-function"), "/aws/test");
    await clickButton(user, /Run query/i);
    await waitFor(() => expect(mockStartQuery).toHaveBeenCalled());
  });

  it("changes the Insights query textarea and time range", async () => {
    mockStartQuery.mockResolvedValueOnce({ queryId: "q-4" });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Logs Insights/i }));
    await waitFor(() => expect(screen.getAllByText("Logs Insights").length).toBeGreaterThan(0));
    await user.type(screen.getByPlaceholderText("fields @timestamp, @message | filter @message like /ERROR/ | limit 20"), "x");
    await user.click(screen.getByRole("button", { name: /Last hour/i }));
    await user.click(screen.getAllByRole("option", { name: /Last 24 hours/i })[0]);
    await user.type(lastByPlaceholder("/aws/lambda/my-function"), "/aws/test");
    await clickButton(user, /Run query/i);
    await waitFor(() =>
      expect(mockStartQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryString: "fields @timestamp, @message | limit 20x" })
      )
    );
  });

  it("invokes onSuccess after saving an account policy, then closes the modal", async () => {
    mockPutAccountPolicy.mockImplementation((_d: any, opts: any) => opts.onSuccess({ accountPolicy: {} }));
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await clickButton(user, /Create Account Policy/i);
    const dialog = dialogOf("Put Account Policy");
    await user.type(within(dialog).getByPlaceholderText("my-data-protection-policy"), "my-policy");
    await user.type(within(dialog).getByPlaceholderText('{"Rules":[]}'), "doc");
    await user.click(within(dialog).getByRole("button", { name: /DATA_PROTECTION/i }));
    await user.click(screen.getAllByRole("option", { name: /SUBSCRIPTION_FILTER/i })[0]);
    await waitFor(() => expect(screen.queryByRole("option", { name: /SUBSCRIPTION_FILTER/i })).toBeNull());
    await user.click(screen.getByRole("button", { name: /Scope ACCOUNT/i }));
    await waitFor(() => expect(screen.getAllByRole("option", { name: /ACCOUNT/i }).length).toBeGreaterThan(0));
    await user.click(screen.getAllByRole("option", { name: /ACCOUNT/i })[0]);
    await user.click(within(dialog).getByText(/Save policy/i));
    await waitFor(() =>
      expect(mockPutAccountPolicy).toHaveBeenCalledWith(
        { policyName: "my-policy", policyDocument: "doc", policyType: "SUBSCRIPTION_FILTER", scope: "ACCOUNT" },
        expect.any(Object)
      )
    );
    await waitFor(() => expectModalHidden("Put Account Policy"));
  });

  it("closes the account policy modal with the Cancel button and Escape", async () => {
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await clickButton(user, /Create Account Policy/i);
    await user.click(within(dialogOf("Put Account Policy")).getByText(/Cancel/i));
    await waitFor(() => expectModalHidden("Put Account Policy"));
    await clickButton(user, /Create Account Policy/i);
    await waitFor(() => expect(dialogOf("Put Account Policy").className).not.toContain("hidden"));
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Put Account Policy"));
  });

  it("invokes onSuccess after saving a metric filter and closes with Cancel and Escape", async () => {
    mockPutMetricFilter.mockImplementation((_d: any, opts: any) => opts.onSuccess({}));
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Metric Filters/i }));
    await user.type(lastByPlaceholder("/aws/lambda/my-function"), "/aws/test");
    await clickButton(user, /Load filters/i);
    await clickButton(user, /Create metric filter/i);
    const dialog = dialogOf("Create Metric Filter for /aws/test");
    await user.type(within(dialog).getByPlaceholderText("error-count"), "mf-1");
    await user.type(within(dialog).getByPlaceholderText("Errors"), "Errors");
    await user.type(within(dialog).getByPlaceholderText("MyApp"), "App");
    await user.type(within(dialog).getByDisplayValue("1"), "5");
    await user.click(within(dialog).getByText(/Create filter/i));
    await waitFor(() =>
      expect(mockPutMetricFilter).toHaveBeenCalledWith(
        {
          logGroupName: "/aws/test",
          filterName: "mf-1",
          filterPattern: undefined,
          metricTransformations: [{ metricName: "Errors", metricNamespace: "App", metricValue: "15" }],
        },
        expect.any(Object)
      )
    );
    await waitFor(() => expectModalHidden("Create Metric Filter for /aws/test"));
    await clickButton(user, /Create metric filter/i);
    await user.click(within(dialogOf("Create Metric Filter for /aws/test")).getByText(/Cancel/i));
    await waitFor(() => expectModalHidden("Create Metric Filter for /aws/test"));
    await clickButton(user, /Create metric filter/i);
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create Metric Filter for /aws/test"));
  });

  it("loads metric filters with an empty group input", async () => {
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Metric Filters/i }));
    await waitFor(() => expect(screen.getByText("Load filters")).toBeTruthy());
    await clickButton(user, /Load filters/i);
    await waitFor(() => expect(mockMetricFilters).toHaveBeenLastCalledWith(null));
  });

  it("shows metric filters load error with and without a message", async () => {
    mockMetricFilters.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("MF down") });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Metric Filters/i }));
    await user.type(lastByPlaceholder("/aws/lambda/my-function"), "/aws/test");
    await clickButton(user, /Load filters/i);
    await waitFor(() => expect(screen.getByText("MF down")).toBeTruthy());
  });

  it("shows the metric filters load error fallback when error has no message", async () => {
    mockMetricFilters.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("") });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Metric Filters/i }));
    await user.type(lastByPlaceholder("/aws/lambda/my-function"), "/aws/test");
    await clickButton(user, /Load filters/i);
    await waitFor(() => expect(screen.getByText("Failed to load metric filters")).toBeTruthy());
  });

  it("closes the test metric filter modal with Close and Escape", async () => {
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Metric Filters/i }));
    await clickButton(user, /Test a filter pattern/i);
    await user.click(within(dialogOf("Test Metric Filter Pattern")).getByText(/Close/i));
    await waitFor(() => expectModalHidden("Test Metric Filter Pattern"));
    await clickButton(user, /Test a filter pattern/i);
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Test Metric Filter Pattern"));
  });

  it("invokes onSuccess after attaching a destination policy and resets the form", async () => {
    mockPutDestinationPolicy.mockImplementation((_d: any, opts: any) => opts.onSuccess({}));
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Destinations/i }));
    await waitFor(() => expect(screen.getAllByText("Destinations").length).toBeGreaterThan(0));
    await user.type(lastByPlaceholder("my-destination"), "dest-1");
    const policyBox = screen.getByPlaceholderText('{"Version":"2012-10-17","Statement":[]}');
    await user.type(policyBox, "policy-doc");
    await clickButton(user, /Attach access policy/i);
    await waitFor(() =>
      expect(mockPutDestinationPolicy).toHaveBeenCalledWith(
        { destinationName: "dest-1", accessPolicy: "policy-doc" },
        expect.any(Object)
      )
    );
    await waitFor(() => expect((screen.getByPlaceholderText('{"Version":"2012-10-17","Statement":[]}') as HTMLInputElement).value).toBe(""));
  });

  it("types an optional roleArn when saving a destination", async () => {
    mockPutDestination.mockImplementation((_d: any, opts: any) => opts.onSuccess({ destination: {} }));
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Destinations/i }));
    await waitFor(() => expect(screen.getAllByText("Destinations").length).toBeGreaterThan(0));
    await user.type(screen.getAllByPlaceholderText("my-destination")[0], "dest-3");
    await user.type(screen.getByPlaceholderText("arn:aws:kinesis:us-east-1:..."), "arn:x");
    await user.type(screen.getByPlaceholderText("arn:aws:iam::...:role/..."), "arn:aws:iam::r");
    await clickButton(user, /Save destination/i);
    await waitFor(() =>
      expect(mockPutDestination).toHaveBeenCalledWith(
        { destinationName: "dest-3", targetArn: "arn:x", roleArn: "arn:aws:iam::r" },
        expect.any(Object)
      )
    );
  });

  it("invokes onSuccess after saving a resource policy and closes with Cancel and Escape", async () => {
    mockPutResourcePolicy.mockImplementation((_d: any, opts: any) => opts.onSuccess({ resourcePolicy: {} }));
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Resource Policies/i }));
    await clickButton(user, /Create Resource Policy/i);
    const dialog = dialogOf("Put Resource Policy");
    await user.type(within(dialog).getByPlaceholderText("cross-account-subscription"), "rp-1");
    await user.type(within(dialog).getByPlaceholderText('{"Version":"2012-10-17","Statement":[]}'), "doc");
    await user.click(within(dialog).getByText(/Save policy/i));
    await waitFor(() =>
      expect(mockPutResourcePolicy).toHaveBeenCalledWith(
        { policyName: "rp-1", policyDocument: "doc" },
        expect.any(Object)
      )
    );
    await waitFor(() => expectModalHidden("Put Resource Policy"));
    await clickButton(user, /Create Resource Policy/i);
    await user.click(within(dialogOf("Put Resource Policy")).getByText(/Cancel/i));
    await waitFor(() => expectModalHidden("Put Resource Policy"));
    await clickButton(user, /Create Resource Policy/i);
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Put Resource Policy"));
  });

  it("fires the deletion-protection success toast for both enabled and disabled", async () => {
    mockPutProtection.mockImplementation((_d: any, opts: any) => opts.onSuccess({}));
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Deletion Protection/i }));
    await waitFor(() => expect(screen.getByText(/Log group deletion protection/)).toBeTruthy());
    await user.type(lastByPlaceholder("/aws/lambda/my-function"), "/aws/on");
    await clickButton(user, /^Apply$/i);
    await waitFor(() =>
      expect(mockPutProtection).toHaveBeenNthCalledWith(
        1,
        { logGroupIdentifier: "/aws/on", deletionProtectionEnabled: true },
        expect.any(Object)
      )
    );
    await user.click(screen.getByRole("checkbox"));
    await user.clear(lastByPlaceholder("/aws/lambda/my-function") as HTMLInputElement);
    await user.type(lastByPlaceholder("/aws/lambda/my-function"), "/aws/off");
    await clickButton(user, /^Apply$/i);
    await waitFor(() =>
      expect(mockPutProtection).toHaveBeenNthCalledWith(
        2,
        { logGroupIdentifier: "/aws/off", deletionProtectionEnabled: false },
        expect.any(Object)
      )
    );
  });

  it("shows the deletion-protection loading state on the matching row action", async () => {
    deleteMetricFilterState.isPending = true;
    deleteMetricFilterState.variables = { filterName: "mf-1" };
    mockMetricFilters.mockReturnValue({
      data: {
        metricFilters: [
          { filterName: "mf-1", logGroupName: "/aws/test", metricTransformations: [] },
          { filterName: "mf-2", logGroupName: "/aws/test", metricTransformations: [] },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await openLogManagement(user);
    await user.click(screen.getByRole("tab", { name: /Metric Filters/i }));
    await user.type(lastByPlaceholder("/aws/lambda/my-function"), "/aws/test");
    await clickButton(user, /Load filters/i);
    await waitFor(() => expect(screen.getByText("mf-1")).toBeTruthy());
    expect((screen.getByRole("button", { name: /Delete mf-1/i }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: /Delete mf-2/i }) as HTMLButtonElement).disabled).toBe(false);
  });
});
