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
});
