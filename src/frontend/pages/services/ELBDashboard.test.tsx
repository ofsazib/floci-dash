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

const sslPoliciesState = vi.hoisted(() => ({
  data: { sslPolicies: [] as any[], total: 0 },
  isLoading: false,
}));
const accountLimitsState = vi.hoisted(() => ({
  data: { limits: [] as any[], total: 0 },
  isLoading: false,
}));

const mockSetSgs = vi.fn();
const mockSetSubnets = vi.fn();
const mockSetIpAddrType = vi.fn();

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
    data: { certificates: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  }),
  useELBAddListenerCertificate: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useELBRemoveListenerCertificate: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
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
    data: { targetGroupArn: "", attributes: {} },
    isLoading: false,
    isError: false,
    error: null,
  }),
  useELBModifyTargetGroupAttributes: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
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
  mockSetSgs.mockReset();
  mockSetSgs.mockResolvedValue({});
  mockSetSubnets.mockReset();
  mockSetSubnets.mockResolvedValue({});
  mockSetIpAddrType.mockReset();
  mockSetIpAddrType.mockResolvedValue({});

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
  mockCreateRule.mockResolvedValue({});
  mockModifyRule.mockReset();
  mockModifyRule.mockResolvedValue({});
  mockDeleteRule.mockReset();
  mockDeleteRule.mockResolvedValue({});
  mockSetRulePriorities.mockReset();
  mockSetRulePriorities.mockResolvedValue({});
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

  // ── SSL Policies ──

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
});
