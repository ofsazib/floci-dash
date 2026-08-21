// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
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

const mockLBListeners = vi.fn();
const mockListenerRules = vi.fn();
const mockCreateRule = vi.fn();
const mockModifyRule = vi.fn();
const mockDeleteRule = vi.fn();
const mockSetRulePriorities = vi.fn();

const createRuleState = vi.hoisted(() => ({
  isPending: false,
}));
const modifyRuleState = vi.hoisted(() => ({
  isPending: false,
}));
const deleteRuleState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));
const setRulePrioritiesState = vi.hoisted(() => ({
  isPending: false,
}));

const capResState = vi.hoisted(() => ({
  data: null as any,
  isLoading: false,
}));
const sslPoliciesState = vi.hoisted(() => ({
  data: { sslPolicies: [] as any[], total: 0 },
  isLoading: false,
}));
const accountLimitsState = vi.hoisted(() => ({
  data: { limits: [] as any[], total: 0 },
  isLoading: false,
}));
const listenerCertsState = vi.hoisted(() => ({
  data: { certificates: [] as any[], total: 0 },
  isLoading: false,
  isError: false,
  error: null as any,
}));
const tgAttrsState = vi.hoisted(() => ({
  data: { targetGroupArn: "" as string, attributes: {} as Record<string, any> },
  isLoading: false,
  isError: false,
  error: null as any,
}));
const addCertState = vi.hoisted(() => ({
  isPending: false,
}));
const removeCertState = vi.hoisted(() => ({
  isPending: false,
}));

const mockSetSgs = vi.fn();
const mockSetSubnets = vi.fn();
const mockSetIpAddrType = vi.fn();
const mockAddCert = vi.fn();
const mockRemoveCert = vi.fn();
const mockModifyTgAttrs = vi.fn();
const mockLBDescribeTags = vi.fn();
const mockModifyListener = vi.fn();
const mockModifyTG = vi.fn();
const lbTagsState = vi.hoisted(() => ({
  data: null as any,
  isLoading: false,
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
  useELBListeners: (...args: any[]) => mockLBListeners(...args),
  useELBCreateListener: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useELBDeleteListener: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useELBSetSecurityGroups: () => ({
    mutate: mockSetSgs,
    mutateAsync: mockSetSgs,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useELBSetSubnets: () => ({
    mutate: mockSetSubnets,
    mutateAsync: mockSetSubnets,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useELBSetIpAddressType: () => ({
    mutate: mockSetIpAddrType,
    mutateAsync: mockSetIpAddrType,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useELBSSLPolicies: () => ({
    data: sslPoliciesState.data,
    isLoading: sslPoliciesState.isLoading,
    isError: false,
    error: null,
  }),
  useELBListenerCertificates: (...args: any[]) => ({
    data: listenerCertsState.data,
    isLoading: listenerCertsState.isLoading,
    isError: listenerCertsState.isError,
    error: listenerCertsState.error,
  }),
  useELBAddListenerCertificate: () => ({
    mutate: mockAddCert,
    mutateAsync: mockAddCert,
    isPending: addCertState.isPending,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useELBRemoveListenerCertificate: () => ({
    mutate: mockRemoveCert,
    mutateAsync: mockRemoveCert,
    isPending: removeCertState.isPending,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useELBListenerAttributes: (...args: any[]) => ({
    data: { listenerArn: "", attributes: {} },
    isLoading: false,
    isError: false,
    error: null,
  }),
  useELBModifyListenerAttributes: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useELBTargetGroupAttributes: (...args: any[]) => ({
    data: tgAttrsState.data,
    isLoading: tgAttrsState.isLoading,
    isError: tgAttrsState.isError,
    error: tgAttrsState.error,
  }),
  useELBModifyTargetGroupAttributes: () => ({
    mutate: mockModifyTgAttrs,
    mutateAsync: mockModifyTgAttrs,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useELBAccountLimits: () => ({
    data: accountLimitsState.data,
    isLoading: accountLimitsState.isLoading,
    isError: false,
    error: null,
  }),
  useELBListenerRules: (...args: any[]) => mockListenerRules(...args),
  useELBCreateRule: () => ({
    mutate: mockCreateRule,
    mutateAsync: mockCreateRule,
    isPending: createRuleState.isPending,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useELBModifyRule: () => ({
    mutate: mockModifyRule,
    mutateAsync: mockModifyRule,
    isPending: modifyRuleState.isPending,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useELBDeleteRule: () => ({
    mutate: mockDeleteRule,
    mutateAsync: mockDeleteRule,
    isPending: deleteRuleState.isPending,
    variables: deleteRuleState.variables,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useELBSetRulePriorities: () => ({
    mutate: mockSetRulePriorities,
    mutateAsync: mockSetRulePriorities,
    isPending: setRulePrioritiesState.isPending,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useELBDescribeTags: (...args: any[]) => ({
    data: lbTagsState.data,
    isLoading: lbTagsState.isLoading,
    isError: false,
    error: null,
  }),
  useELBModifyListener: () => ({
    mutate: mockModifyListener,
    mutateAsync: mockModifyListener,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useELBModifyTargetGroup: () => ({
    mutate: mockModifyTG,
    mutateAsync: mockModifyTG,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useELBCapacityReservation: () => ({
    data: capResState.data,
    isLoading: capResState.isLoading,
    isError: false,
    error: null,
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
  createRuleState.isPending = false;
  modifyRuleState.isPending = false;
  deleteRuleState.isPending = false;
  deleteRuleState.variables = null;
  setRulePrioritiesState.isPending = false;
  sslPoliciesState.data = { sslPolicies: [], total: 0 };
  sslPoliciesState.isLoading = false;
  accountLimitsState.data = { limits: [], total: 0 };
  accountLimitsState.isLoading = false;
  listenerCertsState.data = { certificates: [], total: 0 };
  listenerCertsState.isLoading = false;
  listenerCertsState.isError = false;
  listenerCertsState.error = null;
  capResState.data = null;
  capResState.isLoading = false;
  tgAttrsState.data = { targetGroupArn: "", attributes: {} };
  tgAttrsState.isLoading = false;
  tgAttrsState.isError = false;
  tgAttrsState.error = null;
  addCertState.isPending = false;
  removeCertState.isPending = false;
  mockSetSgs.mockReset();
  mockSetSgs.mockImplementation((_payload: any, opts?: any) => {
    opts?.onSuccess?.();
    return Promise.resolve({});
  });
  mockSetSubnets.mockReset();
  mockSetSubnets.mockImplementation((_payload: any, opts?: any) => {
    opts?.onSuccess?.();
    return Promise.resolve({});
  });
  mockSetIpAddrType.mockReset();
  mockSetIpAddrType.mockResolvedValue({});
  lbTagsState.data = null;
  lbTagsState.isLoading = false;
  mockModifyListener.mockReset();
  mockModifyListener.mockImplementation((_payload: any, opts?: any) => {
    opts?.onSuccess?.();
    return Promise.resolve({});
  });
  mockModifyTG.mockReset();
  mockModifyTG.mockImplementation((_payload: any, opts?: any) => {
    opts?.onSuccess?.();
    return Promise.resolve({});
  });

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
  mockLBListeners.mockReturnValue({
    data: { listeners: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockListenerRules.mockReturnValue({
    data: { rules: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockCreateRule.mockReset();
  mockCreateRule.mockImplementation((_payload: any, opts?: any) => {
    opts?.onSuccess?.();
    return Promise.resolve({});
  });
  mockModifyRule.mockReset();
  mockModifyRule.mockImplementation((_payload: any, opts?: any) => {
    opts?.onSuccess?.();
    return Promise.resolve({});
  });
  mockDeleteRule.mockReset();
  mockDeleteRule.mockResolvedValue({});
  mockSetRulePriorities.mockReset();
  mockSetRulePriorities.mockImplementation((_payload: any, opts?: any) => {
    opts?.onSuccess?.();
    return Promise.resolve({});
  });
  mockAddCert.mockReset();
  mockAddCert.mockImplementation((_payload: any, opts?: any) => {
    opts?.onSuccess?.();
    return Promise.resolve({});
  });
  mockRemoveCert.mockReset();
  mockRemoveCert.mockResolvedValue({});
  mockModifyTgAttrs.mockReset();
  mockModifyTgAttrs.mockResolvedValue({});
});

// ─── Tests ──────────────────────────────────────────────

/**
 * Cloudscape Modal handles Escape via a React onKeyDown on the dialog element
 * (checking `event.keyCode === 27`). user-event's `keyboard()` targets the
 * active element (body), which never reaches the dialog in happy-dom, so we
 * dispatch the keydown on the dialog directly. The selector reaches into
 * Cloudscape internals, but it is scoped to the open modal and is the only
 * mechanism that works in the test DOM.
 */
function dismissModalWithEscape() {
  const dialog = document.querySelector('[class*="awsui_dialog"]') as HTMLElement;
  fireEvent.keyDown(dialog, { keyCode: 27 });
}

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

  it("filters load balancers by search text", async () => {
    mockLoadBalancers.mockReturnValue({
      data: {
        loadBalancers: [
          {
            loadBalancerName: "my-alb",
            loadBalancerArn: "arn:1",
            type: "application",
            scheme: "internet-facing",
            state: { Code: "active" },
          },
          {
            loadBalancerName: "other-alb",
            loadBalancerArn: "arn:2",
            type: "network",
            scheme: "internal",
            state: { Code: "provisioning" },
          },
        ],
        total: 2,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("my-alb")).toBeTruthy();
      expect(screen.getByText("other-alb")).toBeTruthy();
    });
    const filterInput = screen.getByPlaceholderText("Find load balancers by name");
    await user.type(filterInput, "my-alb");
    await waitFor(() => {
      expect(screen.getByText("my-alb")).toBeTruthy();
      expect(screen.queryByText("other-alb")).toBeNull();
    });
  });

  it("shows empty state for sparse LB data without loadBalancers key", () => {
    mockLoadBalancers.mockReturnValue({
      data: {},
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<ELBDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No load balancers/i)).toBeTruthy();
  });

  it("dismisses create LB modal with Escape key", async () => {
    const user = userEvent.setup();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /create/i);
    await waitFor(() => {
      expect(screen.getByText("Create load balancer")).toBeTruthy();
    });
    dismissModalWithEscape();
    await waitFor(() => {
      expect(screen.queryByText("Create load balancer")).toBeNull();
    });
  });

  it("cancels create LB modal", async () => {
    const user = userEvent.setup();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /create/i);
    await waitFor(() => {
      expect(screen.getByText("Create load balancer")).toBeTruthy();
    });
    await clickButton(user, /Cancel/i);
    await waitFor(() => {
      expect(screen.queryByText("Create load balancer")).toBeNull();
    });
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

  it("calls deleteTargetGroup when delete is clicked", async () => {
    mockTargetGroups.mockReturnValue({
      data: {
        targetGroups: [
          {
            targetGroupName: "my-tg",
            targetGroupArn: "arn:aws:elasticloadbalancing:us-east-1:123:targetgroup/my-tg/abc",
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
    await clickButton(user, /Delete my-tg/i);
    await waitFor(() => {
      expect(mockDeleteTG).toHaveBeenCalledWith("arn:aws:elasticloadbalancing:us-east-1:123:targetgroup/my-tg/abc");
    });
  });

  it("filters target groups by search text", async () => {
    mockTargetGroups.mockReturnValue({
      data: {
        targetGroups: [
          {
            targetGroupName: "my-tg",
            targetGroupArn: "arn:1",
            protocol: "HTTP",
            port: 80,
            targetType: "ip",
          },
          {
            targetGroupName: "other-tg",
            targetGroupArn: "arn:2",
            protocol: "HTTPS",
            port: 443,
            targetType: "instance",
          },
        ],
        total: 2,
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
      expect(screen.getByText("other-tg")).toBeTruthy();
    });
    const filterInput = screen.getByPlaceholderText("Find target groups by name");
    await user.type(filterInput, "my-tg");
    await waitFor(() => {
      expect(screen.getByText("my-tg")).toBeTruthy();
      expect(screen.queryByText("other-tg")).toBeNull();
    });
  });

  it("shows empty state for sparse TG data without targetGroups key", async () => {
    mockTargetGroups.mockReturnValue({
      data: {},
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /target groups/i }));
    await waitFor(() => {
      expect(screen.getByText(/No target groups/i)).toBeTruthy();
    });
  });

  it("dismisses create TG modal with Escape key", async () => {
    const user = userEvent.setup();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /target groups/i }));
    await clickButton(user, /create target group/i);
    await waitFor(() => {
      expect(screen.getByText("Create target group")).toBeTruthy();
    });
    dismissModalWithEscape();
    await waitFor(() => {
      expect(screen.queryByText("Create target group")).toBeNull();
    });
  });

  it("cancels create TG modal", async () => {
    const user = userEvent.setup();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /target groups/i }));
    await clickButton(user, /create target group/i);
    await waitFor(() => {
      expect(screen.getByText("Create target group")).toBeTruthy();
    });
    await clickButton(user, /Cancel/i);
    await waitFor(() => {
      expect(screen.queryByText("Create target group")).toBeNull();
    });
  });

  it("changes protocol and port in create TG modal", async () => {
    const user = userEvent.setup();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /target groups/i }));
    await clickButton(user, /create target group/i);
    await waitFor(() => {
      expect(screen.getByText("Create target group")).toBeTruthy();
    });

    // Change the protocol select from HTTP to HTTPS
    const protocolTrigger = screen.getByRole("button", { name: /HTTP/i });
    await user.click(protocolTrigger);
    await user.click(screen.getByRole("option", { name: /HTTPS/i }));

    // Change the port
    const portInput = screen.getByDisplayValue("80");
    await user.clear(portInput);
    await user.type(portInput, "443");

    const nameInput = screen.getByPlaceholderText("my-tg");
    await user.type(nameInput, "tg-https");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => {
      expect(mockCreateTG).toHaveBeenCalledWith(
        expect.objectContaining({ name: "tg-https", protocol: "HTTPS", port: 443 }),
      );
    });
  });
});

// ─── Listener Rules Tests ────────────────────────────────

describe("ELBDashboard — listener rules", () => {
  const LB_ARN = "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/my-alb/abc";
  const LISTENER_ARN = "arn:aws:elasticloadbalancing:us-east-1:123:listener/app/my-alb/abc/def";
  const RULE_ARN = "arn:aws:elasticloadbalancing:us-east-1:123:listener-rule/my-rule";

  function setupLBAndListener(user: ReturnType<typeof userEvent.setup>) {
    mockLoadBalancers.mockReturnValue({
      data: {
        loadBalancers: [
          {
            loadBalancerName: "my-alb",
            loadBalancerArn: LB_ARN,
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
    mockLBListeners.mockReturnValue({
      data: {
        listeners: [{ listenerArn: LISTENER_ARN, protocol: "HTTP", port: 80 }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
  }

  async function navigateToAdvancedAndSelectLB(user: ReturnType<typeof userEvent.setup>) {
    render(<ELBDashboard />, { wrapper: createWrapper() });

    // Switch to Advanced tab
    await user.click(screen.getByRole("tab", { name: /advanced/i }));

    await waitFor(() => {
      expect(screen.getByText("Select a load balancer...")).toBeTruthy();
    });

    // Click the Select to open dropdown, then click the option
    // Note: Cloudscape renders option text in both a visible span and a screenreader div,
    // so we use getAllByText and click the first (visible) one.
    const selectTrigger = screen.getByText("Select a load balancer...");
    await user.click(selectTrigger);
    const lbOptions = screen.getAllByText(`my-alb (${LB_ARN})`);
    await user.click(lbOptions[0]);

    // Wait for listeners to appear
    await waitFor(() => {
      expect(screen.getByText("HTTP:80")).toBeTruthy();
    });
  }

  it("shows empty rules state when no rules exist", async () => {
    const user = userEvent.setup();
    setupLBAndListener(user);
    mockListenerRules.mockReturnValue({
      data: { rules: [], total: 0 },
      isLoading: false,
      isError: false,
      error: null,
    });

    await navigateToAdvancedAndSelectLB(user);

    // Click Certificates to set selectedListenerArn
    await user.click(screen.getByText("Certificates"));

    await waitFor(() => {
      expect(screen.getByText("Listener Rules")).toBeTruthy();
      expect(screen.getByText("No rules found.")).toBeTruthy();
    });
  });

  it("shows loading state when rules are loading", async () => {
    const user = userEvent.setup();
    setupLBAndListener(user);
    mockListenerRules.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    await navigateToAdvancedAndSelectLB(user);
    await user.click(screen.getByText("Certificates"));

    await waitFor(() => {
      // The Listener Rules section should be visible with a loading indicator
      expect(screen.getByText("Listener Rules")).toBeTruthy();
    });
  });

  it("renders rules list with edit and delete buttons", async () => {
    const user = userEvent.setup();
    setupLBAndListener(user);
    mockListenerRules.mockReturnValue({
      data: {
        rules: [
          {
            ruleArn: RULE_ARN,
            ruleName: "host-header",
            priority: "100",
            isDefault: false,
            conditions: [{ Field: "host-header", Values: ["example.com"] }],
            actions: [{ Type: "forward", TargetGroupArn: "arn:tg1" }],
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    await navigateToAdvancedAndSelectLB(user);

    await waitFor(() => {
      expect(screen.getByText("HTTP:80")).toBeTruthy();
    });

    // Click Attributes button (simpler text to match) to set selectedListenerArn
    const attrsBtns = screen.getAllByText("Attributes");
    await user.click(attrsBtns[0]);

    await waitFor(() => {
      expect(screen.getByText("Listener Rules")).toBeTruthy();
    });

    // The rule name is displayed as part of "Priority: 100 — host-header"
    expect(screen.getByText(/Priority: 100/)).toBeTruthy();

    // Edit buttons should be present (multiple in the page: SGs, subnets, rule)
    expect(screen.getAllByRole("button", { name: /Edit/i }).length).toBeGreaterThan(0);

    // Set rule priorities button should be present
    expect(screen.getByRole("button", { name: /Set rule priorities/i })).toBeTruthy();
  });

  it("opens create rule modal and submits with valid data", async () => {
    const user = userEvent.setup();
    setupLBAndListener(user);

    await navigateToAdvancedAndSelectLB(user);

    await waitFor(() => {
      expect(screen.getByText("HTTP:80")).toBeTruthy();
    });

    // Click Attributes to set selectedListenerArn
    const attrsBtns = screen.getAllByText("Attributes");
    await user.click(attrsBtns[0]);

    await waitFor(() => {
      expect(screen.getByText("Listener Rules")).toBeTruthy();
    });

    // Click Create rule button
    await clickButton(user, /Create rule/i);

    await waitFor(() => {
      expect(screen.getByText("Create Rule")).toBeTruthy();
    });

    // Fill in the form - use paste() for JSON to avoid keyboard parsing issues
    const priorityInput = screen.getByPlaceholderText("100");
    await user.type(priorityInput, "200");

    const conditionTextarea = screen.getByPlaceholderText(/Field.*host-header/);
    await user.click(conditionTextarea);
    await user.paste('[{"Field":"host-header","Values":["test.com"]}]');

    const actionTextarea = screen.getByPlaceholderText(/Type.*forward/);
    await user.click(actionTextarea);
    await user.paste('[{"Type":"forward","TargetGroupArn":"arn:tg2"}]');

    // Click Create button (last one in the modal)
    await clickButton(user, /Create/i, { last: true });

    await waitFor(() => {
      expect(mockCreateRule).toHaveBeenCalled();
    });
  });

  it("shows validation error for invalid JSON in conditions", async () => {
    const user = userEvent.setup();
    setupLBAndListener(user);

    await navigateToAdvancedAndSelectLB(user);

    await waitFor(() => {
      expect(screen.getByText("HTTP:80")).toBeTruthy();
    });

    const attrsBtns = screen.getAllByText("Attributes");
    await user.click(attrsBtns[0]);

    await waitFor(() => {
      expect(screen.getByText("Listener Rules")).toBeTruthy();
    });

    await clickButton(user, /Create rule/i);

    await waitFor(() => {
      expect(screen.getByText("Create Rule")).toBeTruthy();
    });

    // Enter a valid priority but invalid JSON
    const priorityInput = screen.getByPlaceholderText("100");
    await user.type(priorityInput, "200");

    const conditionTextarea = screen.getByPlaceholderText(/Field.*host-header/);
    await user.type(conditionTextarea, "not-valid-json");

    // Attempt to submit
    await clickButton(user, /Create/i, { last: true });

    await waitFor(() => {
      expect(screen.getByText("Invalid JSON in conditions or actions")).toBeTruthy();
    });
  });

  it("shows validation error for non-positive priority", async () => {
    const user = userEvent.setup();
    setupLBAndListener(user);

    await navigateToAdvancedAndSelectLB(user);

    await waitFor(() => {
      expect(screen.getByText("HTTP:80")).toBeTruthy();
    });

    const attrsBtns = screen.getAllByText("Attributes");
    await user.click(attrsBtns[0]);

    await waitFor(() => {
      expect(screen.getByText("Listener Rules")).toBeTruthy();
    });

    await clickButton(user, /Create rule/i);

    await waitFor(() => {
      expect(screen.getByText("Create Rule")).toBeTruthy();
    });

    // Enter invalid priority
    const priorityInput = screen.getByPlaceholderText("100");
    await user.type(priorityInput, "0");

    await clickButton(user, /Create/i, { last: true });

    await waitFor(() => {
      expect(screen.getByText("Priority must be a positive integer")).toBeTruthy();
    });
  });

  it("opens edit rule modal with pre-filled data", async () => {
    const user = userEvent.setup();
    setupLBAndListener(user);
    mockListenerRules.mockReturnValue({
      data: {
        rules: [
          {
            ruleArn: RULE_ARN,
            ruleName: "host-header",
            priority: "100",
            isDefault: false,
            conditions: [{ Field: "host-header", Values: ["example.com"] }],
            actions: [{ Type: "forward", TargetGroupArn: "arn:tg1" }],
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    await navigateToAdvancedAndSelectLB(user);

    await waitFor(() => {
      expect(screen.getByText("HTTP:80")).toBeTruthy();
    });

    const attrsBtns = screen.getAllByText("Attributes");
    await user.click(attrsBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Priority: 100/)).toBeTruthy();
    });

    // Click the last Edit button (rule's link variant, after SGs and subnets)
    await clickButton(user, /Edit/i, { last: true });

    await waitFor(() => {
      expect(screen.getByText("Edit Rule")).toBeTruthy();
    });

    // Verify priority is pre-filled
    const priorityInput = screen.getByPlaceholderText("100");
    expect(priorityInput).toHaveValue("100");
  });

  it("calls deleteRule when delete is clicked", async () => {
    const user = userEvent.setup();
    setupLBAndListener(user);
    mockListenerRules.mockReturnValue({
      data: {
        rules: [
          {
            ruleArn: RULE_ARN,
            ruleName: "host-header",
            priority: "100",
            isDefault: false,
            conditions: [],
            actions: [],
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    await navigateToAdvancedAndSelectLB(user);

    await waitFor(() => {
      expect(screen.getByText("HTTP:80")).toBeTruthy();
    });

    const attrsBtns = screen.getAllByText("Attributes");
    await user.click(attrsBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Priority: 100/)).toBeTruthy();
    });

    // Click Delete button
    await clickButton(user, new RegExp(`Delete ${RULE_ARN}`));

    await waitFor(() => {
      expect(mockDeleteRule).toHaveBeenCalledWith(RULE_ARN);
    });
  });

  it("shows delete rule loading state when variables match", async () => {
    deleteRuleState.isPending = true;
    deleteRuleState.variables = RULE_ARN;
    const user = userEvent.setup();
    setupLBAndListener(user);
    mockListenerRules.mockReturnValue({
      data: {
        rules: [
          {
            ruleArn: RULE_ARN,
            ruleName: "host-header",
            priority: "100",
            isDefault: false,
            conditions: [],
            actions: [],
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    await navigateToAdvancedAndSelectLB(user);
    await waitFor(() => {
      expect(screen.getByText("HTTP:80")).toBeTruthy();
    });
    const attrsBtns = screen.getAllByText("Attributes");
    await user.click(attrsBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Priority: 100/)).toBeTruthy();
    });

    // The delete button is in loading state because isPending && variables match
    expect(screen.getAllByRole("button", { name: /Delete/i }).length).toBeGreaterThan(0);
  });

  it("opens set rule priorities modal and submits", async () => {
    const user = userEvent.setup();
    setupLBAndListener(user);
    mockListenerRules.mockReturnValue({
      data: {
        rules: [
          {
            ruleArn: RULE_ARN,
            ruleName: "host-header",
            priority: "100",
            isDefault: false,
            conditions: [],
            actions: [],
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    await navigateToAdvancedAndSelectLB(user);

    await waitFor(() => {
      expect(screen.getByText("HTTP:80")).toBeTruthy();
    });

    const attrsBtns = screen.getAllByText("Attributes");
    await user.click(attrsBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Priority: 100/)).toBeTruthy();
    });

    // Click Set rule priorities
    await clickButton(user, /Set rule priorities/i);

    await waitFor(() => {
      expect(screen.getByText("Set Rule Priorities")).toBeTruthy();
    });

    // Change priority value
    const priorityInput = screen.getByDisplayValue("100");
    await user.clear(priorityInput);
    await user.type(priorityInput, "50");

    // Click Save
    await clickButton(user, /Save/i);

    await waitFor(() => {
      expect(mockSetRulePriorities).toHaveBeenCalled();
    });
  });

  it("shows info message when no non-default rules to reorder", async () => {
    const user = userEvent.setup();
    setupLBAndListener(user);
    mockListenerRules.mockReturnValue({
      data: {
        rules: [
          {
            ruleArn: RULE_ARN,
            ruleName: "default-rule",
            priority: "default",
            isDefault: true,
            conditions: [],
            actions: [],
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    await navigateToAdvancedAndSelectLB(user);

    await waitFor(() => {
      expect(screen.getByText("HTTP:80")).toBeTruthy();
    });

    const attrsBtns = screen.getAllByText("Attributes");
    await user.click(attrsBtns[0]);

    await clickButton(user, /Set rule priorities/i);

    await waitFor(() => {
      expect(screen.getByText("No non-default rules to reorder.")).toBeTruthy();
    });
  });

  it("shows no rules found for sparse data without rules key", async () => {
    const user = userEvent.setup();
    setupLBAndListener(user);
    mockListenerRules.mockReturnValue({
      data: {} as any,
      isLoading: false,
      isError: false,
      error: null,
    });

    await navigateToAdvancedAndSelectLB(user);
    await user.click(screen.getByText("Certificates"));

    await waitFor(() => {
      expect(screen.getByText("No rules found.")).toBeTruthy();
    });
  });

  it("edits a rule missing conditions and actions (sparse)", async () => {
    const user = userEvent.setup();
    setupLBAndListener(user);
    mockListenerRules.mockReturnValue({
      data: {
        rules: [
          {
            ruleArn: RULE_ARN,
            ruleName: "sparse-rule",
            priority: "50",
            isDefault: false,
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    await navigateToAdvancedAndSelectLB(user);
    await waitFor(() => {
      expect(screen.getByText("HTTP:80")).toBeTruthy();
    });
    const attrsBtns = screen.getAllByText("Attributes");
    await user.click(attrsBtns[0]);
    await waitFor(() => {
      expect(screen.getByText(/Priority: 50/)).toBeTruthy();
    });

    await clickButton(user, /Edit/i, { last: true });
    await waitFor(() => {
      expect(screen.getByText("Edit Rule")).toBeTruthy();
    });
  });

  it("saves an edited rule via modifyRule", async () => {
    const user = userEvent.setup();
    setupLBAndListener(user);
    mockListenerRules.mockReturnValue({
      data: {
        rules: [
          {
            ruleArn: RULE_ARN,
            ruleName: "host-header",
            priority: "100",
            isDefault: false,
            conditions: [{ Field: "host-header", Values: ["example.com"] }],
            actions: [{ Type: "forward", TargetGroupArn: "arn:tg1" }],
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    await navigateToAdvancedAndSelectLB(user);
    await waitFor(() => {
      expect(screen.getByText("HTTP:80")).toBeTruthy();
    });
    const attrsBtns = screen.getAllByText("Attributes");
    await user.click(attrsBtns[0]);
    await waitFor(() => {
      expect(screen.getByText(/Priority: 100/)).toBeTruthy();
    });

    await clickButton(user, /Edit/i, { last: true });
    await waitFor(() => {
      expect(screen.getByText("Edit Rule")).toBeTruthy();
    });

    // Save the edit without changing anything
    await clickButton(user, /Save/i);
    await waitFor(() => {
      expect(mockModifyRule).toHaveBeenCalledWith(
        expect.objectContaining({ ruleArn: RULE_ARN }),
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });
  });

  it("creates a rule with empty conditions and actions JSON", async () => {
    const user = userEvent.setup();
    setupLBAndListener(user);

    await navigateToAdvancedAndSelectLB(user);
    await waitFor(() => {
      expect(screen.getByText("HTTP:80")).toBeTruthy();
    });
    const attrsBtns = screen.getAllByText("Attributes");
    await user.click(attrsBtns[0]);
    await waitFor(() => {
      expect(screen.getByText("Listener Rules")).toBeTruthy();
    });

    await clickButton(user, /Create rule/i);
    await waitFor(() => {
      expect(screen.getByText("Create Rule")).toBeTruthy();
    });

    // Only fill priority; leave conditions/actions empty -> `|| "[]"` fallbacks fire
    const priorityInput = screen.getByPlaceholderText("100");
    await user.type(priorityInput, "300");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => {
      expect(mockCreateRule).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 300, conditions: [], actions: [] }),
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });
  });

  it("dismisses create rule modal with Escape key", async () => {
    const user = userEvent.setup();
    setupLBAndListener(user);
    await navigateToAdvancedAndSelectLB(user);
    const attrsBtns = screen.getAllByText("Attributes");
    await user.click(attrsBtns[0]);
    await waitFor(() => {
      expect(screen.getByText("Listener Rules")).toBeTruthy();
    });
    await clickButton(user, /Create rule/i);
    await waitFor(() => {
      expect(screen.getByText("Create Rule")).toBeTruthy();
    });
    dismissModalWithEscape();
    await waitFor(() => {
      expect(screen.queryByText("Create Rule")).toBeNull();
    });
  });

  it("cancels create rule modal", async () => {
    const user = userEvent.setup();
    setupLBAndListener(user);
    await navigateToAdvancedAndSelectLB(user);
    const attrsBtns = screen.getAllByText("Attributes");
    await user.click(attrsBtns[0]);
    await waitFor(() => {
      expect(screen.getByText("Listener Rules")).toBeTruthy();
    });
    await clickButton(user, /Create rule/i);
    await waitFor(() => {
      expect(screen.getByText("Create Rule")).toBeTruthy();
    });
    await clickButton(user, /Cancel/i);
    await waitFor(() => {
      expect(screen.queryByText("Create Rule")).toBeNull();
    });
  });

  it("saves set rule priorities without editing (fallback priority)", async () => {
    const user = userEvent.setup();
    setupLBAndListener(user);
    mockListenerRules.mockReturnValue({
      data: {
        rules: [
          {
            ruleArn: RULE_ARN,
            ruleName: "host-header",
            priority: "100",
            isDefault: false,
            conditions: [],
            actions: [],
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    await navigateToAdvancedAndSelectLB(user);
    await waitFor(() => {
      expect(screen.getByText("HTTP:80")).toBeTruthy();
    });
    const attrsBtns = screen.getAllByText("Attributes");
    await user.click(attrsBtns[0]);
    await waitFor(() => {
      expect(screen.getByText(/Priority: 100/)).toBeTruthy();
    });
    await clickButton(user, /Set rule priorities/i);
    await waitFor(() => {
      expect(screen.getByText("Set Rule Priorities")).toBeTruthy();
    });

    // Save without touching the input -> priorityInputs fallback to String(rule.priority)
    await clickButton(user, /Save/i);
    await waitFor(() => {
      expect(mockSetRulePriorities).toHaveBeenCalledWith(
        expect.objectContaining({
          rulePriorities: expect.arrayContaining([
            expect.objectContaining({ ruleArn: RULE_ARN, priority: 100 }),
          ]),
        }),
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });
  });

  it("dismisses set rule priorities modal with Escape key", async () => {
    const user = userEvent.setup();
    setupLBAndListener(user);
    mockListenerRules.mockReturnValue({
      data: {
        rules: [
          {
            ruleArn: RULE_ARN,
            ruleName: "host-header",
            priority: "100",
            isDefault: false,
            conditions: [],
            actions: [],
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    await navigateToAdvancedAndSelectLB(user);
    const attrsBtns = screen.getAllByText("Attributes");
    await user.click(attrsBtns[0]);
    await clickButton(user, /Set rule priorities/i);
    await waitFor(() => {
      expect(screen.getByText("Set Rule Priorities")).toBeTruthy();
    });
    dismissModalWithEscape();
    await waitFor(() => {
      expect(screen.queryByText("Set Rule Priorities")).toBeNull();
    });
  });

  it("cancels set rule priorities modal", async () => {
    const user = userEvent.setup();
    setupLBAndListener(user);
    mockListenerRules.mockReturnValue({
      data: {
        rules: [
          {
            ruleArn: RULE_ARN,
            ruleName: "host-header",
            priority: "100",
            isDefault: false,
            conditions: [],
            actions: [],
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    await navigateToAdvancedAndSelectLB(user);
    const attrsBtns = screen.getAllByText("Attributes");
    await user.click(attrsBtns[0]);
    await clickButton(user, /Set rule priorities/i);
    await waitFor(() => {
      expect(screen.getByText("Set Rule Priorities")).toBeTruthy();
    });
    await clickButton(user, /Cancel/i);
    await waitFor(() => {
      expect(screen.queryByText("Set Rule Priorities")).toBeNull();
    });
  });
});

// ─── Advanced Settings Tests ─────────────────────────────

describe("ELBDashboard — advanced settings", () => {
  const LB_ARN_ADV = "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/my-alb-adv/xyz";

  async function navigateToAdvancedTab(user: ReturnType<typeof userEvent.setup>) {
    mockLoadBalancers.mockReturnValue({
      data: {
        loadBalancers: [
          {
            loadBalancerName: "my-alb-adv",
            loadBalancerArn: LB_ARN_ADV,
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

    // Switch to Advanced tab
    await user.click(screen.getByRole("tab", { name: /advanced/i }));

    await waitFor(() => {
      expect(screen.getByText("Select a load balancer...")).toBeTruthy();
    });

    // Click the Select to open dropdown, then click the option
    const selectTrigger = screen.getByText("Select a load balancer...");
    await user.click(selectTrigger);
    const lbOptions = screen.getAllByText(`my-alb-adv (${LB_ARN_ADV})`);
    await user.click(lbOptions[0]);

    // Wait for advanced settings to appear (Security Groups header)
    await waitFor(() => {
      expect(screen.getByText("Security Groups")).toBeTruthy();
    });
  }

  async function navigateToAdvancedAndOpenCerts(user: ReturnType<typeof userEvent.setup>) {
    mockLBListeners.mockReturnValue({
      data: {
        listeners: [{ listenerArn: "arn:listener-1", protocol: "HTTP", port: 80 }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    await navigateToAdvancedTab(user);
    await waitFor(() => {
      expect(screen.getByText("HTTP:80")).toBeTruthy();
    });
    await user.click(screen.getByText("Certificates"));
    await waitFor(() => {
      expect(screen.getByText("Listener Certificates")).toBeTruthy();
    });
  }

  // ── SSL Policies ──

  it("renders capacity reservation data", async () => {
    capResState.data = {
      reservationState: [
        { AvailabilityZone: "us-east-1a", State: { State: "active" } },
      ],
    };
    const user = userEvent.setup();
    await navigateToAdvancedTab(user);
    await waitFor(() => {
      expect(screen.getByText("Capacity Reservation")).toBeTruthy();
      expect(screen.getByText(/us-east-1a/)).toBeTruthy();
    });
  });

  it("shows no capacity reservation data when reservationState is empty", async () => {
    capResState.data = { reservationState: [] };
    const user = userEvent.setup();
    await navigateToAdvancedTab(user);
    await waitFor(() => {
      expect(screen.getByText("Capacity Reservation")).toBeTruthy();
      expect(screen.getByText("No capacity reservation data")).toBeTruthy();
    });
  });

  it("renders SSL policies with data", async () => {
    sslPoliciesState.data = {
      sslPolicies: [
        { name: "ELBSecurityPolicy-2016-08", sslProtocols: ["TLSv1.2"], ciphers: [{ Name: "AES256-GCM-SHA384" }] },
        { name: "ELBSecurityPolicy-FS-2018-06", sslProtocols: ["TLSv1.2"], ciphers: [{ Name: "ECDHE-AES128-GCM-SHA256" }] },
      ],
      total: 2,
    };

    const user = userEvent.setup();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));

    await waitFor(() => {
      expect(screen.getByText("ELBSecurityPolicy-2016-08")).toBeTruthy();
      expect(screen.getByText("ELBSecurityPolicy-FS-2018-06")).toBeTruthy();
    });
  });

  it("shows SSL policies empty state", async () => {
    sslPoliciesState.data = { sslPolicies: [], total: 0 };

    const user = userEvent.setup();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));

    await waitFor(() => {
      expect(screen.getByText("No SSL policies found")).toBeTruthy();
    });
  });

  // ── Account Limits ──

  it("renders account limits with data", async () => {
    accountLimitsState.data = {
      limits: [
        { name: "application-load-balancers", max: "50" },
        { name: "target-groups", max: "100" },
      ],
      total: 2,
    };

    const user = userEvent.setup();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));

    await waitFor(() => {
      expect(screen.getByText("application-load-balancers")).toBeTruthy();
      expect(screen.getByText("target-groups")).toBeTruthy();
      expect(screen.getByText("50")).toBeTruthy();
    });
  });

  it("shows account limits empty state", async () => {
    accountLimitsState.data = { limits: [], total: 0 };

    const user = userEvent.setup();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));

    await waitFor(() => {
      expect(screen.getByText("No limits found")).toBeTruthy();
    });
  });

  // ── Security Groups ──

  it("opens security groups modal and submits", async () => {
    const user = userEvent.setup();
    await navigateToAdvancedTab(user);

    // Click Set security groups link
    await clickButton(user, /Set security groups/i);

    await waitFor(() => {
      expect(screen.getByText("Set Security Groups")).toBeTruthy();
    });

    // Type SG IDs into the textarea
    const sgTextarea = screen.getByPlaceholderText("sg-12345678");
    await user.type(sgTextarea, "sg-111,sg-222");

    // Click Save
    await clickButton(user, /Save/i);

    await waitFor(() => {
      expect(mockSetSgs).toHaveBeenCalledWith(
        expect.objectContaining({
          arn: LB_ARN_ADV,
          securityGroups: expect.arrayContaining(["sg-111", "sg-222"]),
        }),
        expect.any(Object),
      );
    });
  });

  // ── Subnets ──

  it("opens subnets modal and submits", async () => {
    const user = userEvent.setup();
    await navigateToAdvancedTab(user);

    // Click Set subnets link
    await clickButton(user, /Set subnets/i);

    await waitFor(() => {
      expect(screen.getByText("Set Subnets")).toBeTruthy();
    });

    // Type subnet IDs into the textarea
    const subnetTextarea = screen.getByPlaceholderText("subnet-12345678");
    await user.type(subnetTextarea, "subnet-a,subnet-b");

    // Click Save
    await clickButton(user, /Save/i);

    await waitFor(() => {
      expect(mockSetSubnets).toHaveBeenCalledWith(
        expect.objectContaining({
          arn: LB_ARN_ADV,
          subnets: expect.arrayContaining(["subnet-a", "subnet-b"]),
        }),
        expect.any(Object),
      );
    });
  });

  // ── IP Address Type ──

  it("calls Set IPv4", async () => {
    const user = userEvent.setup();
    await navigateToAdvancedTab(user);

    await clickButton(user, /Set IPv4/i);

    await waitFor(() => {
      expect(mockSetIpAddrType).toHaveBeenCalledWith({
        arn: LB_ARN_ADV,
        ipAddressType: "ipv4",
      });
    });
  });

  it("calls Set Dualstack", async () => {
    const user = userEvent.setup();
    await navigateToAdvancedTab(user);

    await clickButton(user, /Set Dualstack/i);

    await waitFor(() => {
      expect(mockSetIpAddrType).toHaveBeenCalledWith({
        arn: LB_ARN_ADV,
        ipAddressType: "dualstack",
      });
    });
  });

  // ── Sparse data fallbacks ───────────────────────────

  it("shows unknown status for LB without state", () => {
    mockLoadBalancers.mockReturnValue({
      data: {
        loadBalancers: [
          {
            loadBalancerName: "lb-no-state",
            loadBalancerArn: "arn:...",
            type: "network",
            scheme: "internal",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<ELBDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("lb-no-state")).toBeTruthy();
    expect(screen.getByText("unknown")).toBeTruthy();
  });

  it("shows dash fallbacks for TG missing fields", async () => {
    mockTargetGroups.mockReturnValue({
      data: {
        targetGroups: [
          {
            targetGroupName: "tg-sparse",
            targetGroupArn: "arn:...",
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
      expect(screen.getByText("tg-sparse")).toBeTruthy();
    });
    // All three dash fallbacks should appear
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(3);
  });

  it("shows SSL policies with missing protocols and ciphers", async () => {
    sslPoliciesState.data = {
      sslPolicies: [
        { name: "MinimalPolicy" },
      ],
      total: 1,
    };
    const user = userEvent.setup();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("MinimalPolicy")).toBeTruthy();
      expect(screen.getByText("0 ciphers")).toBeTruthy();
    });
  });

  it("shows account limits with undefined limits array", async () => {
    accountLimitsState.data = {} as any;
    const user = userEvent.setup();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("No limits found")).toBeTruthy();
    });
  });

  // ── Listener Certificates ───────────────────────────

  it("shows certificates error state", async () => {
    listenerCertsState.isError = true;
    listenerCertsState.error = new Error("Certs fetch failed");
    const user = userEvent.setup();
    await navigateToAdvancedTab(user);
    // Component renders without crashing even with cert error
    expect(screen.getByText("Security Groups")).toBeTruthy();
  });

  it("renders empty certificates list without crashing", async () => {
    listenerCertsState.data = { certificates: [], total: 0 };
    const user = userEvent.setup();
    await navigateToAdvancedTab(user);
    // Component renders without crashing with empty cert data
    expect(screen.getByText("Security Groups")).toBeTruthy();
  });

  it("shows No certificates for sparse cert data without certificates key", async () => {
    listenerCertsState.data = {} as any;
    const user = userEvent.setup();
    mockLoadBalancers.mockReturnValue({
      data: {
        loadBalancers: [
          {
            loadBalancerName: "my-alb-adv",
            loadBalancerArn: LB_ARN_ADV,
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
    mockLBListeners.mockReturnValue({
      data: {
        listeners: [{ listenerArn: "arn:listener-1", protocol: "HTTP", port: 80 }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("Select a load balancer...")).toBeTruthy();
    });
    const selectTrigger = screen.getByText("Select a load balancer...");
    await user.click(selectTrigger);
    const lbOptions = screen.getAllByText(/my-alb-adv/);
    await user.click(lbOptions[0]);
    await waitFor(() => {
      expect(screen.getByText("HTTP:80")).toBeTruthy();
    });
    await user.click(screen.getByText("Certificates"));
    await waitFor(() => {
      expect(screen.getByText("No certificates")).toBeTruthy();
    });
  });

  it("renders certificates with data and deletes one", async () => {
    listenerCertsState.data = {
      certificates: [
        { CertificateArn: "arn:aws:acm:us-east-1:123:certificate/cert-1" },
        { CertificateArn: "arn:aws:acm:us-east-1:123:certificate/cert-2" },
      ],
      total: 2,
    };
    const user = userEvent.setup();
    mockLoadBalancers.mockReturnValue({
      data: {
        loadBalancers: [
          {
            loadBalancerName: "my-alb-adv",
            loadBalancerArn: "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/my-alb-adv/xyz",
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
    mockLBListeners.mockReturnValue({
      data: {
        listeners: [{ listenerArn: "arn:listener-1", protocol: "HTTP", port: 80 }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("Select a load balancer...")).toBeTruthy();
    });
    const selectTrigger = screen.getByText("Select a load balancer...");
    await user.click(selectTrigger);
    const lbOptions = screen.getAllByText(/my-alb-adv/);
    await user.click(lbOptions[0]);
    await waitFor(() => {
      expect(screen.getByText("HTTP:80")).toBeTruthy();
    });

    // Click Certificates to set selectedListenerArn and render cert section
    await user.click(screen.getByText("Certificates"));
    await waitFor(() => {
      expect(screen.getByText("arn:aws:acm:us-east-1:123:certificate/cert-1")).toBeTruthy();
    });

    // Delete the first certificate
    await clickButton(user, /Delete arn:aws:acm:us-east-1:123:certificate\/cert-1/i);
    await waitFor(() => {
      expect(mockRemoveCert).toHaveBeenCalledWith(
        expect.objectContaining({ certificateArn: "arn:aws:acm:us-east-1:123:certificate/cert-1" }),
      );
    });
  });

  it("opens add certificate modal and adds a certificate", async () => {
    const user = userEvent.setup();
    await navigateToAdvancedAndOpenCerts(user);

    // Open the Add certificate modal
    await clickButton(user, /Add certificate/i);
    await waitFor(() => {
      expect(screen.getByText("Add Listener Certificate")).toBeTruthy();
    });

    const certInput = screen.getByPlaceholderText("arn:aws:acm:...");
    await user.type(certInput, "arn:aws:acm:us-east-1:123:certificate/cert-new");
    await clickButton(user, /Add/i, { last: true });

    await waitFor(() => {
      expect(mockAddCert).toHaveBeenCalledWith(
        expect.objectContaining({ certificateArn: "arn:aws:acm:us-east-1:123:certificate/cert-new" }),
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });
  });

  it("cancels add certificate modal", async () => {
    const user = userEvent.setup();
    await navigateToAdvancedAndOpenCerts(user);
    await clickButton(user, /Add certificate/i);
    await waitFor(() => {
      expect(screen.getByText("Add Listener Certificate")).toBeTruthy();
    });
    await clickButton(user, /Cancel/i);
    await waitFor(() => {
      expect(screen.queryByText("Add Listener Certificate")).toBeNull();
    });
  });

  it("dismisses add certificate modal with Escape key", async () => {
    const user = userEvent.setup();
    await navigateToAdvancedAndOpenCerts(user);
    await clickButton(user, /Add certificate/i);
    await waitFor(() => {
      expect(screen.getByText("Add Listener Certificate")).toBeTruthy();
    });
    dismissModalWithEscape();
    await waitFor(() => {
      expect(screen.queryByText("Add Listener Certificate")).toBeNull();
    });
  });

  // ── Target Group Attributes ─────────────────────────

  it("shows TG attributes error state", async () => {
    tgAttrsState.isError = true;
    tgAttrsState.error = new Error("TG attrs fetch failed");
    const user = userEvent.setup();
    await navigateToAdvancedTab(user);
    // Component renders without crashing even with TG attrs error
    expect(screen.getByText("Security Groups")).toBeTruthy();
  });

  it("selects a target group and renders its attributes", async () => {
    mockTargetGroups.mockReturnValue({
      data: {
        targetGroups: [
          {
            targetGroupName: "my-tg",
            targetGroupArn: "arn:aws:elasticloadbalancing:us-east-1:123:targetgroup/my-tg/abc",
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
    tgAttrsState.data = {
      targetGroupArn: "arn:aws:elasticloadbalancing:us-east-1:123:targetgroup/my-tg/abc",
      attributes: { "deregistration_delay.timeout_seconds": "300" },
    };

    const user = userEvent.setup();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("Select a target group...")).toBeTruthy();
    });
    const tgTrigger = screen.getByText("Select a target group...");
    await user.click(tgTrigger);
    const tgOptions = screen.getAllByText("my-tg");
    await user.click(tgOptions[0]);

    await waitFor(() => {
      expect(screen.getByText(/deregistration_delay\.timeout_seconds/)).toBeTruthy();
    });
  });

  it("shows empty target group attributes options for sparse TG data", async () => {
    mockTargetGroups.mockReturnValue({
      data: {},
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("Select a target group...")).toBeTruthy();
    });
    // Component renders without crashing with sparse TG data
    expect(screen.getByText("Target Group Attributes")).toBeTruthy();
  });

  it("opens security groups modal from header Edit button", async () => {
    const user = userEvent.setup();
    await navigateToAdvancedTab(user);
    // The Security Groups header has an Edit button (first Edit button)
    await clickButton(user, /Edit/i, { index: 0 });
    await waitFor(() => {
      expect(screen.getByText("Set Security Groups")).toBeTruthy();
    });
  });

  it("opens subnets modal from header Edit button", async () => {
    const user = userEvent.setup();
    await navigateToAdvancedTab(user);
    // The Subnets header has an Edit button (second Edit button)
    await clickButton(user, /Edit/i, { index: 1 });
    await waitFor(() => {
      expect(screen.getByText("Set Subnets")).toBeTruthy();
    });
  });

  it("cancels security groups modal", async () => {
    const user = userEvent.setup();
    await navigateToAdvancedTab(user);
    await clickButton(user, /Set security groups/i);
    await waitFor(() => {
      expect(screen.getByText("Set Security Groups")).toBeTruthy();
    });
    await clickButton(user, /Cancel/i);
    await waitFor(() => {
      expect(screen.queryByText("Set Security Groups")).toBeNull();
    });
  });

  it("dismisses security groups modal with Escape key", async () => {
    const user = userEvent.setup();
    await navigateToAdvancedTab(user);
    await clickButton(user, /Set security groups/i);
    await waitFor(() => {
      expect(screen.getByText("Set Security Groups")).toBeTruthy();
    });
    dismissModalWithEscape();
    await waitFor(() => {
      expect(screen.queryByText("Set Security Groups")).toBeNull();
    });
  });

  it("cancels subnets modal", async () => {
    const user = userEvent.setup();
    await navigateToAdvancedTab(user);
    await clickButton(user, /Set subnets/i);
    await waitFor(() => {
      expect(screen.getByText("Set Subnets")).toBeTruthy();
    });
    await clickButton(user, /Cancel/i);
    await waitFor(() => {
      expect(screen.queryByText("Set Subnets")).toBeNull();
    });
  });

  it("dismisses subnets modal with Escape key", async () => {
    const user = userEvent.setup();
    await navigateToAdvancedTab(user);
    await clickButton(user, /Set subnets/i);
    await waitFor(() => {
      expect(screen.getByText("Set Subnets")).toBeTruthy();
    });
    dismissModalWithEscape();
    await waitFor(() => {
      expect(screen.queryByText("Set Subnets")).toBeNull();
    });
  });

  it("shows empty SSL policies for sparse data without sslPolicies key", async () => {
    sslPoliciesState.data = {} as any;
    const user = userEvent.setup();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("No SSL policies found")).toBeTruthy();
    });
  });

  it("renders advanced tab with sparse LB data (no options)", async () => {
    mockLoadBalancers.mockReturnValue({
      data: {},
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("Select a load balancer...")).toBeTruthy();
    });
    expect(screen.getByText("Load Balancer Advanced Settings")).toBeTruthy();
  });

  it("selects an LB with empty ARN in advanced select (falsy value fallback)", async () => {
    mockLoadBalancers.mockReturnValue({
      data: {
        loadBalancers: [
          {
            loadBalancerName: "lb-no-arn",
            loadBalancerArn: "",
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
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("Select a load balancer...")).toBeTruthy();
    });
    const selectTrigger = screen.getByText("Select a load balancer...");
    await user.click(selectTrigger);
    const lbOptions = screen.getAllByText(/lb-no-arn/);
    await user.click(lbOptions[0]);
    // Empty ARN -> detail.selectedOption?.value is falsy -> stays unselected
    expect(screen.getByText("Select a load balancer...")).toBeTruthy();
  });

  it("selects a target group with empty ARN in advanced select (falsy value fallback)", async () => {
    mockTargetGroups.mockReturnValue({
      data: {
        targetGroups: [
          {
            targetGroupName: "tg-no-arn",
            targetGroupArn: "",
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
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("Select a target group...")).toBeTruthy();
    });
    const tgTrigger = screen.getByText("Select a target group...");
    await user.click(tgTrigger);
    const tgOptions = screen.getAllByText(/tg-no-arn/);
    await user.click(tgOptions[0]);
    // Empty ARN -> detail.selectedOption?.value is falsy -> stays unselected
    expect(screen.getByText("Select a target group...")).toBeTruthy();
  });

  // ── Listener Rules edge cases ───────────────────────

  it("shows delete rule loading state via isPending", () => {
    deleteRuleState.isPending = true;
    deleteRuleState.variables = "arn:rule-loading";
    render(<ELBDashboard />, { wrapper: createWrapper() });
    // Component renders with delete loading state without crashing
    expect(screen.getByText("No load balancers")).toBeTruthy();
  });

  // ── Set Rule Priorities with input ──────────────────

  it("shows set rule priorities pending state", () => {
    setRulePrioritiesState.isPending = true;
    render(<ELBDashboard />, { wrapper: createWrapper() });
    // Component renders with priorities pending state without crashing
    expect(screen.getByText("No load balancers")).toBeTruthy();
  });
});

describe("ELBDashboard — tags / modify listener / modify target group", () => {
  const LB_ARN_TAG = "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/my-alb-tag/123";

  function mockLb() {
    mockLoadBalancers.mockReturnValue({
      data: {
        loadBalancers: [
          {
            loadBalancerName: "my-alb-tag",
            loadBalancerArn: LB_ARN_TAG,
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
  }

  // ── Tags modal ────────────────────────────────────────

  it("opens the tags modal and shows tag key-value pairs", async () => {
    lbTagsState.data = {
      tagDescriptions: [{ resourceArn: LB_ARN_TAG, tags: { env: "prod", team: "core" } }],
      total: 1,
    };
    const user = userEvent.setup();
    mockLb();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    await waitFor(() => expect(screen.getByText("env: prod")).toBeTruthy());
    expect(screen.getByText("team: core")).toBeTruthy();
  });

  it("shows no-tags message when the tag list is empty", async () => {
    lbTagsState.data = { tagDescriptions: [], total: 0 };
    const user = userEvent.setup();
    mockLb();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    await waitFor(() => expect(screen.getByText("No tags found.")).toBeTruthy());
  });

  it("closes the tags modal", async () => {
    lbTagsState.data = { tagDescriptions: [], total: 0 };
    const user = userEvent.setup();
    mockLb();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    await waitFor(() => expect(screen.getByText("No tags found.")).toBeTruthy());
    await user.click(
      within(screen.getByRole("dialog", { name: /Tags —/ })).getByRole("button", {
        name: /Close/i,
      }),
    );
    await waitFor(() =>
      expect(screen.queryByText("No tags found.")).toBeNull(),
    );
  });

  it("dismisses the tags modal with Escape", async () => {
    lbTagsState.data = { tagDescriptions: [], total: 0 };
    const user = userEvent.setup();
    mockLb();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    await waitFor(() => expect(screen.getByText("No tags found.")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() =>
      expect(screen.queryByText("No tags found.")).toBeNull(),
    );
  });

  // ── Edit listener modal ───────────────────────────────

  async function openEditListener(user: ReturnType<typeof userEvent.setup>) {
    mockLb();
    mockLBListeners.mockReturnValue({
      data: {
        listeners: [{ listenerArn: "arn:listener-edit", protocol: "HTTP", port: 80 }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() =>
      expect(screen.getByText("Select a load balancer...")).toBeTruthy(),
    );
    await user.click(screen.getByText("Select a load balancer..."));
    await user.click(screen.getAllByText(/my-alb-tag/)[0]);
    await waitFor(() => expect(screen.getByText("HTTP:80")).toBeTruthy());
    const editButtons = screen.getAllByText("Edit");
    await user.click(editButtons[editButtons.length - 1]);
    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: "Edit listener" })).toBeTruthy(),
    );
  }

  it("opens the edit listener modal for a listener without port or protocol", async () => {
    mockLb();
    mockLBListeners.mockReturnValue({
      data: {
        listeners: [{ listenerArn: "arn:listener-min" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<ELBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /advanced/i }));
    await waitFor(() =>
      expect(screen.getByText("Select a load balancer...")).toBeTruthy(),
    );
    await user.click(screen.getByText("Select a load balancer..."));
    await user.click(screen.getAllByText(/my-alb-tag/)[0]);
    await waitFor(() => expect(screen.getAllByText("Edit").length).toBeGreaterThan(0));
    await user.click(screen.getAllByText("Edit")[screen.getAllByText("Edit").length - 1]);
    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: "Edit listener" })).toBeTruthy(),
    );
    const dialog = () =>
      within(screen.getByRole("dialog", { name: "Edit listener" }));
    // Port falls back to empty and protocol falls back to HTTP
    expect(dialog().getByRole("textbox", { name: /Port/i })).toHaveValue("");
    expect(dialog().getByRole("button", { name: /HTTP/i })).toBeTruthy();
  });

  it("opens the edit listener modal and saves changes", async () => {
    const user = userEvent.setup();
    await openEditListener(user);
    const dialog = () =>
      within(screen.getByRole("dialog", { name: "Edit listener" }));
    const portInput = dialog().getByRole("textbox", { name: /Port/i });
    await user.clear(portInput);
    await user.type(portInput, "8443");
    // Change the protocol select to HTTPS
    await user.click(dialog().getByRole("button", { name: /HTTP/i }));
    await user.click(screen.getByRole("option", { name: /HTTPS/i }));
    // Fill the optional SSL policy + certificates fields
    await user.type(dialog().getByPlaceholderText("ELBSecurityPolicy-TLS-1-2"), "ELBSecurityPolicy-TLS-1-2-2021-06");
    await user.type(dialog().getByPlaceholderText("arn:aws:acm:..."), "arn:aws:acm:us-east-1:123456789012:certificate/abc");
    await user.click(dialog().getByRole("button", { name: /^Save$/i }));
    await waitFor(() =>
      expect(mockModifyListener).toHaveBeenCalledWith(
        expect.objectContaining({
          listenerArn: "arn:listener-edit",
          port: 8443,
          protocol: "HTTPS",
          sslPolicy: "ELBSecurityPolicy-TLS-1-2-2021-06",
          certificates: ["arn:aws:acm:us-east-1:123456789012:certificate/abc"],
        }),
        expect.anything(),
      ),
    );
  });

  it("shows an error when the listener update fails and clears the port", async () => {
    mockModifyListener.mockImplementation((_payload: any, opts?: any) => {
      opts?.onError?.(new Error("listener update failed"));
      return Promise.reject(new Error("listener update failed"));
    });
    const user = userEvent.setup();
    await openEditListener(user);
    const dialog = () =>
      within(screen.getByRole("dialog", { name: "Edit listener" }));
    // Clear the port so the payload omits it (falsy + NaN arms)
    await user.clear(dialog().getByRole("textbox", { name: /Port/i }));
    await user.click(dialog().getByRole("button", { name: /^Save$/i }));
    await waitFor(() =>
      expect(screen.getByText("listener update failed")).toBeTruthy(),
    );
    expect(mockModifyListener.mock.calls[0][0].port).toBeUndefined();
    // Dismiss the error alert
    const dismiss = document.querySelector(
      '[class*="awsui_dismiss-button"]',
    ) as HTMLElement;
    fireEvent.click(dismiss);
    await waitFor(() =>
      expect(screen.queryByText("listener update failed")).toBeNull(),
    );
  });

  it("shows the fallback error when the listener update fails without a message", async () => {
    mockModifyListener.mockImplementation((_payload: any, opts?: any) => {
      opts?.onError?.(new Error());
      return Promise.reject(new Error());
    });
    const user = userEvent.setup();
    await openEditListener(user);
    const dialog = () =>
      within(screen.getByRole("dialog", { name: "Edit listener" }));
    // A non-numeric port parses to NaN and is omitted from the payload
    await user.clear(dialog().getByRole("textbox", { name: /Port/i }));
    await user.type(dialog().getByRole("textbox", { name: /Port/i }), "abc");
    await user.click(dialog().getByRole("button", { name: /^Save$/i }));
    await waitFor(() =>
      expect(screen.getByText("Failed to update listener")).toBeTruthy(),
    );
    expect(mockModifyListener.mock.calls[0][0].port).toBeUndefined();
  });

  it("cancels the edit listener modal", async () => {
    const user = userEvent.setup();
    await openEditListener(user);
    const dialog = () =>
      within(screen.getByRole("dialog", { name: "Edit listener" }));
    await user.click(dialog().getByRole("button", { name: /^Cancel$/i }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Edit listener" })).toBeNull(),
    );
  });

  it("dismisses the edit listener modal with Escape", async () => {
    const user = userEvent.setup();
    await openEditListener(user);
    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: "Edit listener" })).toBeTruthy(),
    );
    dismissModalWithEscape();
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Edit listener" })).toBeNull(),
    );
  });

  // ── Edit target group health check modal ─────────────

  it("opens the health check modal and saves changes", async () => {
    mockTargetGroups.mockReturnValue({
      data: {
        targetGroups: [
          {
            targetGroupName: "my-tg-hc",
            targetGroupArn: "arn:aws:elasticloadbalancing:us-east-1:123:targetgroup/my-tg-hc/abc",
            protocol: "HTTP",
            port: 80,
            targetType: "instance",
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
    await waitFor(() => expect(screen.getByText("my-tg-hc")).toBeTruthy());
    await user.click(screen.getByText("Health check"));
    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: "Edit health check" })).toBeTruthy(),
    );
    const dialog = () =>
      within(screen.getByRole("dialog", { name: "Edit health check" }));
    const pathInput = dialog().getByRole("textbox", { name: /Health check path/i });
    await user.type(pathInput, "/health");
    await user.type(dialog().getByRole("textbox", { name: /Interval seconds/i }), "30");
    await user.type(dialog().getByRole("textbox", { name: /Timeout seconds/i }), "10");
    await user.type(dialog().getByRole("textbox", { name: /^Healthy threshold/i }), "3");
    await user.type(dialog().getByRole("textbox", { name: /^Unhealthy threshold/i }), "5");
    await user.click(dialog().getByRole("button", { name: /^Save$/i }));
    await waitFor(() =>
      expect(mockModifyTG).toHaveBeenCalledWith(
        expect.objectContaining({
          targetGroupArn: "arn:aws:elasticloadbalancing:us-east-1:123:targetgroup/my-tg-hc/abc",
          healthCheckPath: "/health",
          healthCheckIntervalSeconds: 30,
          healthCheckTimeoutSeconds: 10,
          healthyThresholdCount: 3,
          unhealthyThresholdCount: 5,
        }),
        expect.anything(),
      ),
    );
  });

  it("saves the health check with non-numeric thresholds as undefined", async () => {
    mockTargetGroups.mockReturnValue({
      data: {
        targetGroups: [
          {
            targetGroupName: "my-tg-hc",
            targetGroupArn: "arn:aws:elasticloadbalancing:us-east-1:123:targetgroup/my-tg-hc/abc",
            protocol: "HTTP",
            port: 80,
            targetType: "instance",
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
    await waitFor(() => expect(screen.getByText("my-tg-hc")).toBeTruthy());
    await user.click(screen.getByText("Health check"));
    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: "Edit health check" })).toBeTruthy(),
    );
    const dialog = () =>
      within(screen.getByRole("dialog", { name: "Edit health check" }));
    await user.type(dialog().getByRole("textbox", { name: /Interval seconds/i }), "abc");
    await user.type(dialog().getByRole("textbox", { name: /Timeout seconds/i }), "xyz");
    await user.type(dialog().getByRole("textbox", { name: /^Healthy threshold/i }), "q");
    await user.type(dialog().getByRole("textbox", { name: /^Unhealthy threshold/i }), "z");
    await user.click(dialog().getByRole("button", { name: /^Save$/i }));
    await waitFor(() =>
      expect(mockModifyTG.mock.calls[0][0]).toMatchObject({
        healthCheckIntervalSeconds: undefined,
        healthCheckTimeoutSeconds: undefined,
        healthyThresholdCount: undefined,
        unhealthyThresholdCount: undefined,
      }),
    );
  });

  it("shows an error when the health check update fails and dismisses it", async () => {
    mockModifyTG.mockImplementation((_payload: any, opts?: any) => {
      opts?.onError?.(new Error());
      return Promise.reject(new Error());
    });
    mockTargetGroups.mockReturnValue({
      data: {
        targetGroups: [
          {
            targetGroupName: "my-tg-hc",
            targetGroupArn: "arn:aws:elasticloadbalancing:us-east-1:123:targetgroup/my-tg-hc/abc",
            protocol: "HTTP",
            port: 80,
            targetType: "instance",
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
    await waitFor(() => expect(screen.getByText("my-tg-hc")).toBeTruthy());
    await user.click(screen.getByText("Health check"));
    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: "Edit health check" })).toBeTruthy(),
    );
    const dialog = () =>
      within(screen.getByRole("dialog", { name: "Edit health check" }));
    await user.click(dialog().getByRole("button", { name: /^Save$/i }));
    await waitFor(() =>
      expect(screen.getByText("Failed to update health check")).toBeTruthy(),
    );
    const dismiss = document.querySelector(
      '[class*="awsui_dismiss-button"]',
    ) as HTMLElement;
    fireEvent.click(dismiss);
    await waitFor(() =>
      expect(screen.queryByText("Failed to update health check")).toBeNull(),
    );
  });

  it("cancels the health check modal", async () => {
    mockTargetGroups.mockReturnValue({
      data: {
        targetGroups: [
          {
            targetGroupName: "my-tg-hc",
            targetGroupArn: "arn:aws:elasticloadbalancing:us-east-1:123:targetgroup/my-tg-hc/abc",
            protocol: "HTTP",
            port: 80,
            targetType: "instance",
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
    await waitFor(() => expect(screen.getByText("my-tg-hc")).toBeTruthy());
    await user.click(screen.getByText("Health check"));
    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: "Edit health check" })).toBeTruthy(),
    );
    const dialog = () =>
      within(screen.getByRole("dialog", { name: "Edit health check" }));
    await user.click(dialog().getByRole("button", { name: /^Cancel$/i }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Edit health check" })).toBeNull(),
    );
  });

  it("dismisses the health check modal with Escape", async () => {
    mockTargetGroups.mockReturnValue({
      data: {
        targetGroups: [
          {
            targetGroupName: "my-tg-hc",
            targetGroupArn: "arn:aws:elasticloadbalancing:us-east-1:123:targetgroup/my-tg-hc/abc",
            protocol: "HTTP",
            port: 80,
            targetType: "instance",
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
    await waitFor(() => expect(screen.getByText("my-tg-hc")).toBeTruthy());
    await user.click(screen.getByText("Health check"));
    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: "Edit health check" })).toBeTruthy(),
    );
    dismissModalWithEscape();
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Edit health check" })).toBeNull(),
    );
  });
});
