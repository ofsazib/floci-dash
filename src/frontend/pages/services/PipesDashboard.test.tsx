// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockPipes = vi.fn();
const mockDeletePipe = vi.fn();
const mockStartPipe = vi.fn();
const mockStopPipe = vi.fn();

vi.mock("../../hooks/usePipes", () => ({
  usePipes: (...args: any[]) => mockPipes(...args),
  useDeletePipe: () => ({ mutateAsync: mockDeletePipe, isPending: false, variables: null }),
  useStartPipe: () => ({ mutateAsync: mockStartPipe, isPending: false, variables: null }),
  useStopPipe: () => ({ mutateAsync: mockStopPipe, isPending: false, variables: null }),
}));

import { PipesDashboard } from "./PipesDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockPipes.mockReturnValue({ data: { pipes: [], total: 0 }, isLoading: false });
});

describe("PipesDashboard", () => {
  it("shows loading skeleton", () => {
    mockPipes.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<PipesDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty message", () => {
    render(<PipesDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No EventBridge pipes/i)).toBeTruthy();
  });

  it("renders pipes with data", () => {
    mockPipes.mockReturnValue({
      data: {
        pipes: [{
          Name: "my-pipe",
          Source: "aws:lambda",
          Target: "arn:aws:sqs:...",
          DesiredState: "RUNNING",
          CurrentState: "RUNNING",
          CreationTime: 1705000000,
        }],
        total: 1,
      },
      isLoading: false,
    });
    render(<PipesDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-pipe")).toBeTruthy();
    expect(screen.getByText("aws:lambda")).toBeTruthy();
  });

  it("shows dash for missing created time", () => {
    mockPipes.mockReturnValue({
      data: { pipes: [{ Name: "test", Source: "aws:lambda", Target: "arn", DesiredState: "RUNNING", CurrentState: "RUNNING" }], total: 1 },
      isLoading: false,
    });
    render(<PipesDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("test")).toBeTruthy();
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });

  it("shows Start button for non-RUNNING pipes", () => {
    mockPipes.mockReturnValue({
      data: {
        pipes: [{ Name: "stopped-pipe", Source: "aws:lambda", Target: "arn", DesiredState: "STOPPED", CurrentState: "STOPPED", CreationTime: 1705000000 }],
        total: 1,
      },
      isLoading: false,
    });
    render(<PipesDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Start")).toBeTruthy();
  });

  it("shows Stop button for RUNNING pipes", () => {
    mockPipes.mockReturnValue({
      data: {
        pipes: [{ Name: "running-pipe", Source: "aws:lambda", Target: "arn", DesiredState: "RUNNING", CurrentState: "RUNNING", CreationTime: 1705000000 }],
        total: 1,
      },
      isLoading: false,
    });
    render(<PipesDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Stop")).toBeTruthy();
  });

  it("deletes a pipe", async () => {
    mockPipes.mockReturnValue({
      data: { pipes: [{ Name: "delete-me", Source: "aws:lambda", Target: "arn", DesiredState: "STOPPED", CurrentState: "STOPPED", CreationTime: 1705000000 }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<PipesDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("delete-me")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete delete-me/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeletePipe).toHaveBeenCalledWith("delete-me"));
  });

  it("filters pipes by name", async () => {
    mockPipes.mockReturnValue({
      data: {
        pipes: [
          { Name: "alpha", Source: "aws:lambda", Target: "arn1", DesiredState: "STOPPED", CurrentState: "STOPPED", CreationTime: 1705000000 },
          { Name: "beta", Source: "aws:lambda", Target: "arn2", DesiredState: "STOPPED", CurrentState: "STOPPED", CreationTime: 1705000000 },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<PipesDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find pipes by name");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha")).toBeNull());
  });
});
