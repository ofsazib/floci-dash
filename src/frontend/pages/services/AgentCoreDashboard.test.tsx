// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mockRuntimes = vi.fn();
const mockDetail = vi.fn();
const mockCreateMutate: any = vi.fn(() => Promise.resolve({}));
const mockDeleteMutate = vi.fn(() => Promise.resolve({}));
const mockInvokeMutate: any = vi.fn();

vi.mock("../../hooks/useAgentCore", () => ({
  useAgentRuntimes: (...args: any[]) => mockRuntimes(...args),
  useAgentRuntime: (...args: any[]) => mockDetail(...args),
  useCreateAgentRuntime: () => ({ mutateAsync: mockCreateMutate, isPending: false }),
  useUpdateAgentRuntime: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteAgentRuntime: () => ({ mutateAsync: mockDeleteMutate, isPending: false }),
  useInvokeAgentRuntime: () => ({ mutate: mockInvokeMutate, isPending: false }),
}));

import { AgentCoreDashboard } from "./AgentCoreDashboard";

const ROW = {
  agentRuntimeId: "rt-1",
  agentRuntimeArn: "arn:x",
  agentRuntimeName: "agent-a",
  status: "ACTIVE",
};

describe("AgentCoreDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateMutate.mockImplementation(() => Promise.resolve({}));
    mockDeleteMutate.mockImplementation(() => Promise.resolve({}));
    mockInvokeMutate.mockImplementation((_p: any, opts: any) =>
      opts?.onSuccess?.('{"ok":true}')
    );
    mockRuntimes.mockReturnValue({ data: { agentRuntimes: [], total: 0 }, isLoading: false });
    mockDetail.mockReturnValue({ data: undefined });
  });

  it("renders the runtimes table header", () => {
    render(<AgentCoreDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Bedrock AgentCore Runtimes")).toBeTruthy();
  });

  it("shows the empty message", () => {
    render(<AgentCoreDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No Bedrock AgentCore runtimes/)).toBeTruthy();
  });

  it("renders rows with data", () => {
    mockRuntimes.mockReturnValue({
      data: { agentRuntimes: [ROW], total: 1 },
      isLoading: false,
    });
    render(<AgentCoreDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: "agent-a" })).toBeTruthy();
    expect(screen.getByText("ACTIVE")).toBeTruthy();
  });

  it("creates a runtime after filling the modal form", async () => {
    const user = userEvent.setup();
    render(<AgentCoreDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create Runtime" }));

    await user.type(screen.getByLabelText("Name"), "agent-new");
    await user.type(screen.getByLabelText("Role ARN"), "arn:role");
    await user.type(screen.getByLabelText("Description"), "desc");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await screen.findByText("Bedrock AgentCore Runtimes");
    expect(mockCreateMutate).toHaveBeenCalledWith({
      name: "agent-new",
      roleArn: "arn:role",
      description: "desc",
    });
  });

  it("invokes a runtime from the detail panel and shows the result", async () => {
    mockRuntimes.mockReturnValue({
      data: { agentRuntimes: [ROW], total: 1 },
      isLoading: false,
    });
    mockDetail.mockReturnValue({
      data: { runtime: { agentRuntimeArn: ROW.agentRuntimeArn, status: "ACTIVE" } },
    });
    const user = userEvent.setup();
    render(<AgentCoreDashboard />, { wrapper: createWrapper() });

    await user.click(screen.getByRole("button", { name: "agent-a" }));
    await screen.findByText(/arn:x/);
    await user.click(await screen.findByText("Invoke"));

    expect(mockInvokeMutate).toHaveBeenCalledWith(
      { arn: "arn:x", payload: {} },
      expect.any(Object)
    );
    expect(screen.getByTestId("invoke-result").textContent).toBe('{"ok":true}');
  });

  it("deletes a runtime via confirm dialog", async () => {
    mockRuntimes.mockReturnValue({
      data: { agentRuntimes: [ROW], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AgentCoreDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Delete agent-a/ }));
    await screen.findByText(/Are you sure/);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await vi.waitFor(() => expect(mockDeleteMutate).toHaveBeenCalledWith("rt-1"));
  });

  it("deselects when clicking the selected row again", async () => {
    mockRuntimes.mockReturnValue({
      data: { agentRuntimes: [ROW], total: 1 },
      isLoading: false,
    });
    mockDetail.mockReturnValue({
      data: { runtime: { agentRuntimeArn: ROW.agentRuntimeArn, status: "ACTIVE" } },
    });
    const user = userEvent.setup();
    render(<AgentCoreDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "agent-a" }));
    expect(await screen.findByText(/arn:x/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "agent-a" }));
    expect(screen.queryByText(/arn:x/)).toBeNull();
  });
});
