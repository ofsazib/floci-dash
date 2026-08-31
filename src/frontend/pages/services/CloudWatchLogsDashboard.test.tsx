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

// ─── Mock hooks ─────────────────────────────────────────

const mockLogGroups = vi.fn();
const mockCreateGroup = vi.fn();
const mockDeleteGroup = vi.fn();
const mockLogStreams = vi.fn();
const mockCreateStream = vi.fn();
const mockDeleteStream = vi.fn();
const mockLogEvents = vi.fn();
const mockPutRetention = vi.fn();
const mockDeleteRetention = vi.fn();
const mockSubFilters = vi.fn();
const mockPutFilter = vi.fn();
const mockDeleteFilter = vi.fn();
const mockTags = vi.fn();
const mockTagGroup = vi.fn();
const mockUntagGroup = vi.fn();
const mockDataProtection = vi.fn();

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
  mockDataProtection.mockReturnValue({ data: { logGroupIdentifier: "", policyDocument: "" }, isLoading: false });

  mockLogGroups.mockReturnValue({ data: { logGroups: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockLogStreams.mockReturnValue({ data: { logStreams: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockLogEvents.mockReturnValue({ data: { events: [] }, isLoading: false, isError: false, error: null, refetch: vi.fn() });
  mockSubFilters.mockReturnValue({ data: { subscriptionFilters: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockTags.mockReturnValue({ data: { tags: {} }, isLoading: false, isError: false, error: null });
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

  it("filters log groups by name", async () => {
    mockLogGroups.mockReturnValue({
      data: {
        logGroups: [
          { logGroupName: "/aws/lambda/alpha" },
          { logGroupName: "/aws/lambda/beta" },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("/aws/lambda/alpha")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find log groups by name");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("/aws/lambda/alpha")).toBeNull());
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

  it("filters log streams by name", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({
      data: {
        logStreams: [
          { logStreamName: "alpha-stream", storedBytes: 256 },
          { logStreamName: "beta-stream", storedBytes: 512 },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText("alpha-stream")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find streams by name");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-stream")).toBeNull());
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
