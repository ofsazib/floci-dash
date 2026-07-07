// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

vi.mock("../../hooks/useLogs", () => ({
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
}));

import { CloudWatchLogsDashboard } from "./CloudWatchLogsDashboard";

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

  // ── Filter ────────────────────────────────────────────

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

  // ── Log streams in detail ──────────────────────────────

  it("shows log streams tab in detail", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    expect(screen.getByRole("tab", { name: /Log Streams/i })).toBeTruthy();
  });

  // ── Retention tab in detail ────────────────────────────

  it("shows retention tab in detail", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test", retentionInDays: 30 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    expect(screen.getByRole("tab", { name: /Retention/i })).toBeTruthy();
  });

  it("shows subscription filters tab in detail", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    expect(screen.getByRole("tab", { name: /Subscription Filters/i })).toBeTruthy();
  });

  it("shows tags tab in detail", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    expect(screen.getByRole("tab", { name: /Tags/i })).toBeTruthy();
  });

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

  it("shows log group detail tabs exist", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    // Verify all 4 tabs are visible in the detail view
    expect(screen.getByRole("tab", { name: /Log Streams/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Retention/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Subscription Filters/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Tags/i })).toBeTruthy();
  });

  // ─── Delete log stream loading ─────────────────────────

  it("shows delete log stream loading in detail", async () => {
    deleteStreamState.isPending = true;
    deleteStreamState.variables = { logStreamName: "main-stream" };
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockLogStreams.mockReturnValue({
      data: { logStreams: [{ logStreamName: "main-stream" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText("main-stream")).toBeTruthy());
  });

  it("shows subscription filters error in detail", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockSubFilters.mockReturnValue({
      data: undefined, isLoading: false, isError: true,
      error: new Error("Failed to load filters"),
    });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    const filtersTab = screen.getByRole("tab", { name: /Subscription Filters/i });
    await user.click(filtersTab);
    await waitFor(() => expect(screen.getByText("Failed to load filters")).toBeTruthy());
  });

  it("shows tags empty state in tags tab", async () => {
    mockLogGroups.mockReturnValue({
      data: { logGroups: [{ logGroupName: "/aws/lambda/test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockTags.mockReturnValue({ data: { tags: {} }, isLoading: false, isError: false, error: null });
    const user = userEvent.setup();
    render(<CloudWatchLogsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("/aws/lambda/test"));
    await user.click(screen.getByText("/aws/lambda/test"));
    await waitFor(() => expect(screen.getByText(/Back to Log Groups/i)).toBeTruthy());
    const tagsTab = screen.getByRole("tab", { name: /Tags/i });
    await user.click(tagsTab);
    await waitFor(() => expect(screen.getByText(/No tags associated with this log group/i)).toBeTruthy());
  });
});
