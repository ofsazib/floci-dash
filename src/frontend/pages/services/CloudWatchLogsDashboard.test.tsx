// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

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
  useCreateLogGroup: () => ({ mutate: mockCreateGroup, isPending: false }),
  useDeleteLogGroup: () => ({ mutateAsync: mockDeleteGroup, isPending: false, variables: null }),
  useLogStreams: (...args: any[]) => mockLogStreams(...args),
  useCreateLogStream: () => ({ mutate: mockCreateStream, isPending: false }),
  useDeleteLogStream: () => ({ mutateAsync: mockDeleteStream, isPending: false, variables: { logStreamName: "" } }),
  useLogEvents: (...args: any[]) => mockLogEvents(...args),
  usePutRetentionPolicy: () => ({ mutate: mockPutRetention, isPending: false }),
  useDeleteRetentionPolicy: () => ({ mutate: mockDeleteRetention, isPending: false }),
  useSubscriptionFilters: (...args: any[]) => mockSubFilters(...args),
  usePutSubscriptionFilter: () => ({ mutate: mockPutFilter, isPending: false }),
  useDeleteSubscriptionFilter: () => ({ mutateAsync: mockDeleteFilter, isPending: false, variables: { filterName: "" } }),
  useLogGroupTags: (...args: any[]) => mockTags(...args),
  useTagLogGroup: () => ({ mutate: mockTagGroup, isPending: false }),
  useUntagLogGroup: () => ({ mutate: mockUntagGroup, isPending: false }),
}));

import { CloudWatchLogsDashboard } from "./CloudWatchLogsDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockLogGroups.mockReturnValue({ data: { logGroups: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockLogStreams.mockReturnValue({ data: { logStreams: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockLogEvents.mockReturnValue({ data: { events: [] }, isLoading: false, isError: false, error: null, refetch: vi.fn() });
  mockSubFilters.mockReturnValue({ data: { subscriptionFilters: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockTags.mockReturnValue({ data: { tags: {} }, isLoading: false, isError: false, error: null });
});

describe("CloudWatchLogsDashboard", () => {
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
});
