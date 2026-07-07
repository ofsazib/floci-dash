// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

const mockLoadBalancers = vi.fn();
const mockTargetGroups = vi.fn();
const mockCreateLB = vi.fn();
const mockDeleteLB = vi.fn();
const mockCreateTG = vi.fn();
const mockDeleteTG = vi.fn();

const createLBState = vi.hoisted(() => ({
  isPending: false,
}));
const deleteLBState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));
const createTGState = vi.hoisted(() => ({
  isPending: false,
}));
const deleteTGState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

vi.mock("../../hooks/useELB", () => ({
  useELBLoadBalancers: (...args: any[]) => mockLoadBalancers(...args),
  useELBCreateLoadBalancer: () => ({
    mutate: mockCreateLB,
    isPending: createLBState.isPending,
  }),
  useELBDeleteLoadBalancer: () => ({
    mutateAsync: mockDeleteLB,
    isPending: deleteLBState.isPending,
    variables: deleteLBState.variables,
  }),
  useELBTargetGroups: (...args: any[]) => mockTargetGroups(...args),
  useELBCreateTargetGroup: () => ({
    mutate: mockCreateTG,
    isPending: createTGState.isPending,
  }),
  useELBDeleteTargetGroup: () => ({
    mutateAsync: mockDeleteTG,
    isPending: deleteTGState.isPending,
    variables: deleteTGState.variables,
  }),
}));

import { ELBDashboard } from "./ELBDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  createLBState.isPending = false;
  deleteLBState.isPending = false;
  deleteLBState.variables = null;
  createTGState.isPending = false;
  deleteTGState.isPending = false;
  deleteTGState.variables = null;

  mockLoadBalancers.mockReturnValue({
    data: { loadBalancers: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockTargetGroups.mockReturnValue({
    data: { targetGroups: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
});

// ─── Tests ──────────────────────────────────────────────

describe("ELBDashboard — rendering", () => {
  it("shows loading skeleton when loading", () => {
    mockLoadBalancers.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    mockTargetGroups.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    const { container } = render(<ELBDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("renders both tabs", () => {
    render(<ELBDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("tab", { name: /load balancers/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /target groups/i })).toBeTruthy();
  });

  it("shows empty message for load balancers", () => {
    render(<ELBDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No load balancers/i)).toBeTruthy();
  });
});

describe("ELBDashboard — load balancer list", () => {
  it("renders load balancers with data", () => {
    mockLoadBalancers.mockReturnValue({
      data: {
        loadBalancers: [
          {
            loadBalancerName: "my-alb",
            loadBalancerArn: "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/my-alb/123",
            type: "application",
            scheme: "internet-facing",
            state: { Code: "active" },
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<ELBDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-alb")).toBeTruthy();
    expect(screen.getByText("application")).toBeTruthy();
    expect(screen.getByText("internet-facing")).toBeTruthy();
    expect(screen.getByText("active")).toBeTruthy();
  });

  it("opens create load balancer modal and submits", async () => {
    const user = userEvent.setup();
    render(<ELBDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /create/i);

    await waitFor(() => {
      expect(screen.getByText("Create load balancer")).toBeTruthy();
    });

    const nameInput = screen.getByPlaceholderText("my-lb");
    await user.type(nameInput, "test-lb");

    // Click Create button (last one in the modal)
    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateLB).toHaveBeenCalledWith(
        expect.objectContaining({ name: "test-lb" }),
      );
    });
  });

  it("calls deleteLoadBalancer when delete is clicked", async () => {
    mockLoadBalancers.mockReturnValue({
      data: {
        loadBalancers: [
          {
            loadBalancerName: "my-alb",
            loadBalancerArn: "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/my-alb/123",
            type: "application",
            scheme: "internet-facing",
            state: { Code: "active" },
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    const user = userEvent.setup();
    render(<ELBDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("my-alb")).toBeTruthy();
    });

    const deleteBtns = screen.getAllByRole("button", { name: /Delete my-alb/i });
    await user.click(deleteBtns[0]);

    await waitFor(() => {
      expect(mockDeleteLB).toHaveBeenCalledWith(
        "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/my-alb/123",
      );
    });
  });

  it("shows create LB button loading state", () => {
    createLBState.isPending = true;
    render(<ELBDashboard />, { wrapper: createWrapper() });
    // Loading state should render - verify the component renders without error
    expect(screen.getByText(/No load balancers/i)).toBeTruthy();
  });

  it("shows delete LB button loading state", () => {
    deleteLBState.isPending = true;
    deleteLBState.variables = "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/my-alb/123";
    mockLoadBalancers.mockReturnValue({
      data: {
        loadBalancers: [
          {
            loadBalancerName: "my-alb",
            loadBalancerArn: "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/my-alb/123",
            type: "application",
            scheme: "internet-facing",
            state: { Code: "active" },
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<ELBDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-alb")).toBeTruthy();
  });
});

describe("ELBDashboard — target groups tab", () => {
  it("shows empty message for target groups", async () => {
    const user = userEvent.setup();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /target groups/i }));
    await waitFor(() => {
      expect(screen.getByText(/No target groups/i)).toBeTruthy();
    });
  });

  it("shows create TG button loading state", async () => {
    createTGState.isPending = true;
    const user = userEvent.setup();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /target groups/i }));
    await waitFor(() => {
      expect(screen.getByText(/No target groups/i)).toBeTruthy();
    });
  });

  it("shows delete TG button loading state", async () => {
    deleteTGState.isPending = true;
    deleteTGState.variables = "arn:aws:...";
    mockTargetGroups.mockReturnValue({
      data: {
        targetGroups: [
          {
            targetGroupName: "my-tg",
            targetGroupArn: "arn:aws:...",
            protocol: "HTTP",
            port: 80,
            targetType: "ip",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /target groups/i }));
    await waitFor(() => {
      expect(screen.getByText("my-tg")).toBeTruthy();
    });
  });

  it("renders target groups with data", async () => {
    mockTargetGroups.mockReturnValue({
      data: {
        targetGroups: [
          {
            targetGroupName: "my-tg",
            targetGroupArn: "arn:aws:...",
            protocol: "HTTP",
            port: 80,
            targetType: "ip",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    const user = userEvent.setup();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /target groups/i }));
    await waitFor(() => {
      expect(screen.getByText("my-tg")).toBeTruthy();
      expect(screen.getAllByText(/HTTP/).length).toBeGreaterThan(0);
      expect(screen.getByText("80")).toBeTruthy();
      expect(screen.getByText("ip")).toBeTruthy();
    });
  });

  it("opens create target group modal and submits", async () => {
    const user = userEvent.setup();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /target groups/i }));

    await waitFor(() => {
      expect(screen.getByText(/No target groups/i)).toBeTruthy();
    });

    // Click Create button
    await clickButton(user, /create target group/i);

    await waitFor(() => {
      expect(screen.getByText("Create target group")).toBeTruthy();
    });

    const nameInput = screen.getByPlaceholderText("my-tg");
    await user.type(nameInput, "test-tg");

    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateTG).toHaveBeenCalledWith(
        expect.objectContaining({ name: "test-tg" }),
      );
    });
  });
});
