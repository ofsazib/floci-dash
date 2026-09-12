// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

async function clickInDialog(user: any, name: string) {
  await user.click(
    Array.from(openDialog().querySelectorAll("button")).find((b) => b.textContent?.trim() === name)!
  );
}

function openDialog(): HTMLElement {
  const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[class*="awsui_dialog"]'));
  const open = dialogs.filter((d) => !d.closest('[class*="awsui_hidden"]'));
  if (!open.length) throw new Error("No open dialog");
  return open[open.length - 1];
}

const mockLBs = vi.fn();
const mockHealth = vi.fn();
const mockTags = vi.fn();
const mockCreateLB = vi.fn(() => Promise.resolve({}));
const mockDeleteLB = vi.fn(() => Promise.resolve({}));
const mockAddListeners = vi.fn(() => Promise.resolve({}));
const mockDeleteListeners = vi.fn(() => Promise.resolve({}));
const mockRegister = vi.fn(() => Promise.resolve({}));
const mockDeregister = vi.fn(() => Promise.resolve({}));
const mockHealthCheck = vi.fn(() => Promise.resolve({}));
const mockApplySg = vi.fn(() => Promise.resolve({}));
const mockAttach = vi.fn(() => Promise.resolve({}));
const mockDetach = vi.fn(() => Promise.resolve({}));
const mockEnableZones = vi.fn(() => Promise.resolve({}));
const mockDisableZones = vi.fn(() => Promise.resolve({}));
const mockAddTags = vi.fn(() => Promise.resolve({}));
const mockRemoveTags = vi.fn(() => Promise.resolve({}));
const mockShowToast = vi.fn();

vi.mock("../../hooks/useElbClassic", () => ({
  useElbLoadBalancers: (...args: any[]) => mockLBs(...args),
  useElbLoadBalancerDetail: () => ({ data: undefined }),
  useElbCreateLoadBalancer: () => ({ mutateAsync: mockCreateLB, isPending: false }),
  useElbDeleteLoadBalancer: () => ({ mutateAsync: mockDeleteLB, isPending: false }),
  useElbAttributes: () => ({ data: undefined }),
  useElbUpdateAttributes: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useElbAddListeners: () => ({ mutateAsync: mockAddListeners, isPending: false }),
  useElbDeleteListeners: () => ({ mutateAsync: mockDeleteListeners, isPending: false }),
  useElbInstanceHealth: (...args: any[]) => mockHealth(...args),
  useElbRegisterInstances: () => ({ mutateAsync: mockRegister, isPending: false }),
  useElbDeregisterInstances: () => ({ mutateAsync: mockDeregister, isPending: false }),
  useElbConfigureHealthCheck: () => ({ mutateAsync: mockHealthCheck, isPending: false }),
  useElbApplySecurityGroups: () => ({ mutateAsync: mockApplySg, isPending: false }),
  useElbAttachSubnets: () => ({ mutateAsync: mockAttach, isPending: false }),
  useElbDetachSubnets: () => ({ mutateAsync: mockDetach, isPending: false }),
  useElbEnableZones: () => ({ mutateAsync: mockEnableZones, isPending: false }),
  useElbDisableZones: () => ({ mutateAsync: mockDisableZones, isPending: false }),
  useElbTags: (...args: any[]) => mockTags(...args),
  useElbAddTags: () => ({ mutateAsync: mockAddTags, isPending: false }),
  useElbRemoveTags: () => ({ mutateAsync: mockRemoveTags, isPending: false }),
  useElbAccountLimits: () => ({ data: undefined }),
}));

vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

import { default as ElbClassicDashboard } from "./ElbClassicDashboard";

const lb = {
  name: "web",
  dnsName: "web.elb.amazonaws.com",
  scheme: "internet-facing",
  zones: ["us-east-1a"],
  instances: ["i-1"],
  listeners: [{ Protocol: "HTTP", LoadBalancerPort: 80, InstancePort: 8080 }, {}, { Protocol: "TCP" }],
};
const bareLb = { name: "bare" };
const emptyLb = {};

function setupAll() {
  mockLBs.mockReturnValue({ data: { loadBalancers: [lb, bareLb, emptyLb], total: 3 }, isLoading: false });
  mockHealth.mockReturnValue({
    data: { instanceStates: [{ instanceId: "i-1", state: "InService", reasonCode: null }, {}] },
  });
  mockTags.mockReturnValue({ data: { tags: [{ Key: "env", Value: "dev" }, {}] } });
}

beforeEach(() => {
  vi.clearAllMocks();
  setupAll();
});

async function clickTab(user: any, name: string) {
  await user.click(await screen.findByRole("tab", { name }));
}

describe("ElbClassicDashboard — Load balancers tab", () => {
  it("lists load balancers with fallbacks", async () => {
    render(<ElbClassicDashboard />, { wrapper: createWrapper() });
    expect(await screen.findByText("web")).toBeTruthy();
    expect(screen.getByText("web.elb.amazonaws.com")).toBeTruthy();
    expect(screen.getByText("us-east-1a")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("creates a load balancer", async () => {
    const user = userEvent.setup();
    render(<ElbClassicDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create load balancer" }));
    expect((screen.getByRole("button", { name: "Create" }) as HTMLButtonElement).disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("web-lb"), "api");
    await user.type(screen.getByPlaceholderText("us-east-1a, us-east-1b"), "us-east-1a");
    await user.clear(screen.getByLabelText("Listener protocol"));
    await user.type(screen.getByLabelText("Listener protocol"), "tcp");
    await user.clear(screen.getByLabelText("Load balancer port"));
    await user.type(screen.getByLabelText("Load balancer port"), "443");
    await user.clear(screen.getByLabelText("Instance port"));
    await user.type(screen.getByLabelText("Instance port"), "8443");
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(mockCreateLB).toHaveBeenCalledWith({
        name: "api",
        zones: "us-east-1a",
        listener: { protocol: "tcp", port: "443", instancePort: "8443" },
      }),
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Load balancer created");
  });

  it("dismisses the create modal via Cancel and Escape", async () => {
    const user = userEvent.setup();
    render(<ElbClassicDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create load balancer" }));
    await clickInDialog(user, "Cancel");
    await user.click(screen.getByRole("button", { name: "Create load balancer" }));
    await waitFor(() => expect(openDialog()).toBeTruthy());
    fireEvent.keyDown(openDialog(), { keyCode: 27, key: "Escape" });
    expect(mockCreateLB).not.toHaveBeenCalled();
  });

  it("shows generic create error toast", async () => {
    mockCreateLB.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ElbClassicDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create load balancer" }));
    await user.type(screen.getByPlaceholderText("web-lb"), "api");
    await user.type(screen.getByPlaceholderText("us-east-1a, us-east-1b"), "us-east-1a");
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to create load balancer"),
    );
  });

  it("deletes a load balancer (generic error then success)", async () => {
    mockDeleteLB.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ElbClassicDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Delete web" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete load balancer"),
    );
    await user.click(await screen.findByRole("button", { name: "Delete web" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockDeleteLB).toHaveBeenCalledWith("web"));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Load balancer deleted");
  });
});

describe("ElbClassicDashboard — Traffic tab", () => {
  it("shows the selected LB, listeners and health", async () => {
    const user = userEvent.setup();
    render(<ElbClassicDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Listeners & instances");
    expect(await screen.findByRole("button", { name: "web" })).toBeTruthy();
    expect(screen.getByText("HTTP")).toBeTruthy();
    expect(screen.getByText("InService")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add listener" })).toBeTruthy();
  });

  it("adds a listener", async () => {
    const user = userEvent.setup();
    render(<ElbClassicDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Listeners & instances");
    await screen.findByRole("button", { name: "web" });
    await user.clear(screen.getByLabelText("Add listener — protocol"));
    await user.type(screen.getByLabelText("Add listener — protocol"), "tcp");
    await user.type(screen.getByLabelText("Add listener — LB port"), "443");
    await user.type(screen.getByLabelText("Add listener — instance port"), "8443");
    await user.click(screen.getByRole("button", { name: "Add listener" }));
    await waitFor(() =>
      expect(mockAddListeners).toHaveBeenCalledWith({
        name: "web",
        listeners: [{ protocol: "tcp", port: "443", instancePort: "8443" }],
      }),
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Listener added");
  });

  it("removes listeners by ports", async () => {
    const user = userEvent.setup();
    render(<ElbClassicDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Listeners & instances");
    await screen.findByRole("button", { name: "web" });
    await user.type(screen.getByLabelText("Remove listeners by ports (comma-separated)"), "80");
    await user.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(mockDeleteListeners).toHaveBeenCalledWith({ name: "web", ports: "80" }));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Listeners removed");
  });

  it("registers and deregisters instances", async () => {
    const user = userEvent.setup();
    render(<ElbClassicDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Listeners & instances");
    await screen.findByRole("button", { name: "web" });
    await user.type(screen.getByLabelText("Register instances (comma-separated)"), "i-9");
    await user.click(screen.getByRole("button", { name: "Register" }));
    await waitFor(() => expect(mockRegister).toHaveBeenCalledWith({ name: "web", instances: "i-9" }));
    await user.type(screen.getByLabelText("Deregister instances (comma-separated)"), "i-1");
    await user.click(screen.getByRole("button", { name: "Deregister" }));
    await waitFor(() => expect(mockDeregister).toHaveBeenCalledWith({ name: "web", instances: "i-1" }));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Instances registered");
    expect(mockShowToast).toHaveBeenCalledWith("success", "Instances deregistered");
  });

  it("configures a health check", async () => {
    const user = userEvent.setup();
    render(<ElbClassicDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Listeners & instances");
    await screen.findByRole("button", { name: "web" });
    await user.type(screen.getByPlaceholderText("HTTP:80/health"), "HTTP:80/");
    await user.clear(screen.getByLabelText("Health check interval (seconds)"));
    await user.type(screen.getByLabelText("Health check interval (seconds)"), "15");
    await user.click(screen.getByRole("button", { name: "Configure health check" }));
    await waitFor(() =>
      expect(mockHealthCheck).toHaveBeenCalledWith({
        name: "web",
        healthCheck: { target: "HTTP:80/", interval: "15" },
      }),
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Health check configured");
  });

  it("cycles the LB picker", async () => {
    const user = userEvent.setup();
    render(<ElbClassicDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Listeners & instances");
    await screen.findByRole("button", { name: "web" });
    await user.click(screen.getByRole("button", { name: "web" }));
    expect(screen.getByRole("button", { name: "bare" })).toBeTruthy();
  });
});

describe("ElbClassicDashboard — Networking tab", () => {
  it("shows tags and adds/removes them", async () => {
    const user = userEvent.setup();
    render(<ElbClassicDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Networking & tags");
    await user.click(screen.getByRole("button", { name: "Load tags" }));
    expect(await screen.findByText("env")).toBeTruthy();
    await user.type(screen.getByLabelText("Add tag — key"), "team");
    await user.type(screen.getByLabelText("Add tag — value"), "core");
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    await waitFor(() =>
      expect(mockAddTags).toHaveBeenCalledWith({ name: "web", tags: [{ Key: "team", Value: "core" }] }),
    );
    await user.clear(await screen.findByLabelText("Add tag — key"));
    await user.clear(await screen.findByLabelText("Add tag — value"));
    await user.type(await screen.findByLabelText("Add tag — key"), "bare");
    await user.click(await screen.findByRole("button", { name: "Add tag" }));
    await waitFor(() => expect(mockAddTags).toHaveBeenCalledTimes(2));
    expect(mockAddTags).toHaveBeenCalledWith({ name: "web", tags: [{ Key: "bare", Value: undefined }] });
    await user.type(await screen.findByLabelText("Remove tag by key"), "team");
    await user.click(await screen.findByRole("button", { name: "Remove tag" }));
    await waitFor(() => expect(mockRemoveTags).toHaveBeenCalledWith({ name: "web", keys: "team" }));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Tag removed");
    await user.click(await screen.findByRole("button", { name: "web" }));
    expect(screen.getByRole("button", { name: "bare" })).toBeTruthy();
    expect(mockShowToast).toHaveBeenCalledWith("success", "Tag added");
  });

  it("enables and disables zones", async () => {
    const user = userEvent.setup();
    render(<ElbClassicDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Networking & tags");
    await user.type(screen.getByLabelText("Enable zones (comma-separated)"), "us-east-1b");
    await user.click(screen.getByRole("button", { name: "Enable" }));
    await waitFor(() => expect(mockEnableZones).toHaveBeenCalledWith({ name: "web", zones: "us-east-1b" }));
    await user.click(screen.getByRole("button", { name: "Disable" }));
    await waitFor(() => expect(mockDisableZones).toHaveBeenCalledWith({ name: "web", zones: "us-east-1b" }));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Zones enabled");
    expect(mockShowToast).toHaveBeenCalledWith("success", "Zones disabled");
  });

  it("attaches subnets and applies security groups", async () => {
    const user = userEvent.setup();
    render(<ElbClassicDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Networking & tags");
    await user.type(screen.getByLabelText("Subnets (comma-separated)"), "subnet-9");
    await user.click(screen.getByRole("button", { name: "Attach" }));
    await waitFor(() => expect(mockAttach).toHaveBeenCalledWith({ name: "web", subnets: "subnet-9" }));
    await user.click(screen.getByRole("button", { name: "Detach" }));
    await waitFor(() => expect(mockDetach).toHaveBeenCalledWith({ name: "web", subnets: "subnet-9" }));
    await user.type(screen.getByLabelText("Security groups (comma-separated)"), "sg-9");
    await user.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(mockApplySg).toHaveBeenCalledWith({ name: "web", securityGroups: "sg-9" }));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Subnets attached");
    expect(mockShowToast).toHaveBeenCalledWith("success", "Subnets detached");
    expect(mockShowToast).toHaveBeenCalledWith("success", "Security groups applied");
  });
});

describe("ElbClassicDashboard — error fallbacks", () => {
  it("shows fallback error toasts for every mutation", async () => {
    mockAddListeners.mockRejectedValueOnce("boom");
    mockDeleteListeners.mockRejectedValueOnce("boom");
    mockRegister.mockRejectedValueOnce("boom");
    mockDeregister.mockRejectedValueOnce("boom");
    mockHealthCheck.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ElbClassicDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Listeners & instances");
    await screen.findByRole("button", { name: "web" });
    await user.type(screen.getByLabelText("Add listener — LB port"), "80");
    await user.type(screen.getByLabelText("Add listener — instance port"), "80");
    await user.click(screen.getByRole("button", { name: "Add listener" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to add listener"));
    await user.type(screen.getByLabelText("Remove listeners by ports (comma-separated)"), "80");
    await user.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to remove listeners"));
    await user.type(screen.getByLabelText("Register instances (comma-separated)"), "i-1");
    await user.click(screen.getByRole("button", { name: "Register" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to register instances"));
    await user.type(screen.getByLabelText("Deregister instances (comma-separated)"), "i-1");
    await user.click(screen.getByRole("button", { name: "Deregister" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to deregister instances"));
    await user.type(screen.getByPlaceholderText("HTTP:80/health"), "HTTP:80/");
    await user.click(screen.getByRole("button", { name: "Configure health check" }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to configure health check"),
    );
  });

  it("shows fallback error toasts for networking mutations", async () => {
    mockEnableZones.mockRejectedValueOnce("boom");
    mockDisableZones.mockRejectedValueOnce("boom");
    mockAttach.mockRejectedValueOnce("boom");
    mockDetach.mockRejectedValueOnce("boom");
    mockApplySg.mockRejectedValueOnce("boom");
    mockAddTags.mockRejectedValueOnce("boom");
    mockRemoveTags.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ElbClassicDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Networking & tags");
    await screen.findByRole("button", { name: "web" });
    await user.type(screen.getByLabelText("Enable zones (comma-separated)"), "z");
    await user.click(screen.getByRole("button", { name: "Enable" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to enable zones"));
    await user.click(screen.getByRole("button", { name: "Disable" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to disable zones"));
    await user.type(screen.getByLabelText("Subnets (comma-separated)"), "s");
    await user.click(screen.getByRole("button", { name: "Attach" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to attach subnets"));
    await user.click(screen.getByRole("button", { name: "Detach" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to detach subnets"));
    await user.type(screen.getByLabelText("Security groups (comma-separated)"), "sg");
    await user.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to apply security groups"),
    );
    await user.type(screen.getByLabelText("Add tag — key"), "k");
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to add tag"));
    await user.type(screen.getByLabelText("Remove tag by key"), "k");
    await user.click(screen.getByRole("button", { name: "Remove tag" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to remove tag"));
  });

  it("covers sparse health and tag rows", async () => {
    mockHealth.mockReturnValue({
      data: { instanceStates: [{ instanceId: "i-2" }] },
    });
    const user = userEvent.setup();
    render(<ElbClassicDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Listeners & instances");
    expect(await screen.findByText("i-2")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});

describe("ElbClassicDashboard — fallback rendering", () => {
  it("renders picker and hint when no load balancers exist", async () => {
    mockLBs.mockReturnValue({ data: { loadBalancers: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<ElbClassicDashboard />, { wrapper: createWrapper() });
    expect(await screen.findByRole("button", { name: "Create load balancer" })).toBeTruthy();
    await clickTab(user, "Listeners & instances");
    expect(screen.getByRole("button", { name: "No load balancers" })).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Add listener" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    await clickTab(user, "Networking & tags");
    expect(screen.getAllByRole("button", { name: "No load balancers" }).length).toBeGreaterThan(0);
  });

  it("renders defaults when data is an empty object", async () => {
    mockLBs.mockReturnValue({ data: {}, isLoading: false });
    mockHealth.mockReturnValue({ data: undefined });
    mockTags.mockReturnValue({ data: undefined });
    const user = userEvent.setup();
    render(<ElbClassicDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Listeners & instances");
    expect(await screen.findByRole("button", { name: "No load balancers" })).toBeTruthy();
    await clickTab(user, "Networking & tags");
    expect(
      screen.getAllByRole("button", { name: "No load balancers" }).length,
    ).toBeGreaterThan(0);
    expect(
      (screen.getByRole("button", { name: "Load tags" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});
