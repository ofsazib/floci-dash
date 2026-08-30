// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mockStacks = vi.fn();
const mockStack = vi.fn();
const mockStackTemplate = vi.fn();
const mockCreateStackMutate = vi.fn(() => Promise.resolve({}));
const mockDeleteStackMutate = vi.fn(() => Promise.resolve({}));
const mockExports = vi.fn();
const mockChangeSets = vi.fn();
const mockStackSets = vi.fn();
const mockCreateCsMutate = vi.fn(() => Promise.resolve({}));
const mockExecuteCsMutate = vi.fn();
const mockDeleteCsMutate = vi.fn();

vi.mock("../../hooks/useCloudFormation", () => ({
  useStacks: (...args: any[]) => mockStacks(...args),
  useStack: (...args: any[]) => mockStack(...args),
  useStackTemplate: (...args: any[]) => mockStackTemplate(...args),
  useCreateStack: () => ({ mutateAsync: mockCreateStackMutate, isPending: false }),
  useDeleteStack: () => ({ mutateAsync: mockDeleteStackMutate, isPending: false }),
  useExports: (...args: any[]) => mockExports(...args),
  useChangeSets: (...args: any[]) => mockChangeSets(...args),
  useStackSets: (...args: any[]) => mockStackSets(...args),
  useCreateChangeSet: () => ({ mutateAsync: mockCreateCsMutate, isPending: false }),
  useExecuteChangeSet: () => ({ mutate: mockExecuteCsMutate, isPending: false }),
  useDeleteChangeSet: () => ({ mutate: mockDeleteCsMutate, isPending: false }),
}));

import { CloudFormationDashboard } from "./CloudFormationDashboard";

describe("CloudFormationDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStacks.mockReturnValue({ data: { stacks: [], total: 0 }, isLoading: false });
    mockStack.mockReturnValue({ data: { stack: null, resources: [] }, isLoading: false });
    mockStackTemplate.mockReturnValue({ data: { template: "{}" }, isLoading: false });
    mockExports.mockReturnValue({ data: { exports: [], total: 0 }, isLoading: false });
    mockChangeSets.mockReturnValue({ data: { changeSets: [], total: 0 }, isLoading: false });
    mockStackSets.mockReturnValue({ data: { stackSets: [], total: 0 }, isLoading: false });
  });

  it("renders stacks tab with empty state", () => {
    render(<CloudFormationDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No CloudFormation stacks")).toBeTruthy();
  });

  it("renders stacks tab with data", () => {
    mockStacks.mockReturnValue({
      data: { stacks: [{ StackName: "my-stack", StackStatus: "CREATE_COMPLETE", Description: "test" }], total: 1 },
      isLoading: false,
    });
    render(<CloudFormationDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-stack")).toBeTruthy();
    expect(screen.getByText("CREATE_COMPLETE")).toBeTruthy();
  });

  it("renders exports tab", async () => {
    mockExports.mockReturnValue({ data: { exports: [{ Name: "Exp1", Value: "val" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<CloudFormationDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Exports/i }));
    expect(screen.getByText("Exp1")).toBeTruthy();
  });

  it("renders stack sets tab", async () => {
    mockStackSets.mockReturnValue({ data: { stackSets: [{ StackSetName: "ss1", Status: "ACTIVE" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<CloudFormationDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Stack Sets/i }));
    expect(screen.getByText("ss1")).toBeTruthy();
  });
});
