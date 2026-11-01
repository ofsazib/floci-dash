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
const mockOrgAccess = vi.fn();
const mockStackSet = vi.fn();
const mockStackSetOp = vi.fn();
const mockAutoTargets = vi.fn();
const mockTpMutate = vi.fn();
const mockTemplateSummaryMutate = vi.fn(() => Promise.resolve({ summary: { description: "d", version: "2010-09-09", resourceTypes: ["AWS::S3::Bucket"], parameters: [{ key: "Env", type: "String", defaultValue: "dev" }] } }));
const mockActivateOrgMutate = vi.fn(() => Promise.resolve({}));

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
  useUpdateTerminationProtection: () => ({ mutate: mockTpMutate, isPending: false }),
  useTemplateSummary: () => ({ mutateAsync: mockTemplateSummaryMutate, isPending: false }),
  useOrganizationsAccess: (...args: any[]) => mockOrgAccess(...args),
  useActivateOrganizationsAccess: () => ({ mutateAsync: mockActivateOrgMutate, isPending: false }),
  useStackSet: (...args: any[]) => mockStackSet(...args),
  useStackSetOperation: (...args: any[]) => mockStackSetOp(...args),
  useAutoDeploymentTargets: (...args: any[]) => mockAutoTargets(...args),
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
    mockOrgAccess.mockReturnValue({ data: { status: "DISABLED" } });
    mockStackSet.mockReturnValue({ data: { instances: [], operations: [] } });
    mockStackSetOp.mockReturnValue({ data: { operation: null } });
    mockAutoTargets.mockReturnValue({ data: { targets: [], total: 0 } });
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
    expect(screen.getAllByText(/Organizations access/i).length).toBeGreaterThan(0);
  });

  it("activates organizations access", async () => {
    const user = userEvent.setup();
    render(<CloudFormationDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Stack Sets/i }));
    await user.click(screen.getByRole("button", { name: /Activate Organizations Access/i }));
    expect(mockActivateOrgMutate).toHaveBeenCalled();
  });

  it("shows stack set detail with operations and auto-deployment targets", async () => {
    mockStackSets.mockReturnValue({
      data: { stackSets: [{ StackSetName: "ss1", Status: "ACTIVE" }], total: 1 }, isLoading: false,
    });
    mockStackSet.mockReturnValue({
      data: {
        instances: [{ account: "123", region: "us-east-1", status: "CURRENT" }],
        operations: [{ id: "op-1", action: "CREATE", status: "SUCCEEDED" }],
      },
    });
    const user = userEvent.setup();
    render(<CloudFormationDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Stack Sets/i }));
    await user.click(screen.getByRole("button", { name: "ss1" }));
    expect(screen.getByText("Stack Set — ss1")).toBeTruthy();
    expect(screen.getByText("123")).toBeTruthy();
    expect(screen.getByText("op-1")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Auto-Deployment Targets/i }));
    expect(screen.getByText("Auto-Deployment Targets")).toBeTruthy();
  });

  it("shows stack set operation status", async () => {
    mockStackSets.mockReturnValue({
      data: { stackSets: [{ StackSetName: "ss1", Status: "ACTIVE" }], total: 1 }, isLoading: false,
    });
    mockStackSet.mockReturnValue({
      data: { instances: [], operations: [{ id: "op-1", action: "UPDATE", status: "SUCCEEDED" }] },
    });
    mockStackSetOp.mockReturnValue({
      data: { operation: { id: "op-1", status: "SUCCEEDED", statusReason: "done" } },
    });
    const user = userEvent.setup();
    render(<CloudFormationDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Stack Sets/i }));
    await user.click(screen.getByRole("button", { name: "ss1" }));
    await user.click(screen.getByRole("button", { name: /View status/i }));
    expect(mockStackSetOp).toHaveBeenCalledWith("ss1", "op-1");
  });

  it("shows template summary modal from stack detail", async () => {
    mockStacks.mockReturnValue({
      data: { stacks: [{ StackName: "my-stack", StackStatus: "CREATE_COMPLETE" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudFormationDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-stack" }));
    await user.click(screen.getByRole("button", { name: /Template Summary/i }));
    await screen.findByText(/Version:/i);
    expect(mockTemplateSummaryMutate).toHaveBeenCalledWith({ stackName: "my-stack" });
  });

  it("toggles termination protection from stack detail", async () => {
    mockStacks.mockReturnValue({
      data: { stacks: [{ StackName: "my-stack", StackStatus: "CREATE_COMPLETE" }], total: 1 },
      isLoading: false,
    });
    mockStack.mockReturnValue({
      data: { stack: { enableTerminationProtection: true }, resources: [] },
    });
    const user = userEvent.setup();
    render(<CloudFormationDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-stack" }));
    const toggle = screen.getByRole("checkbox");
    expect((toggle as HTMLInputElement).checked).toBe(true);
    await user.click(toggle);
    expect(mockTpMutate).toHaveBeenCalledWith({ stackName: "my-stack", enabled: false });
  });
});
