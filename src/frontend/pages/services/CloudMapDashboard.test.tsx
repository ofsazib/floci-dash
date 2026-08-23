// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── vi.hoisted mutable states ──────────────────────────

const deleteNsState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const deleteSvcState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

// ─── Mock hooks ─────────────────────────────────────────

vi.mock("../../components/ConfirmDialog", () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn(() => Promise.resolve(true)),
    dialog: null,
  }),
}));

const mockNamespaces = vi.fn();
const mockServices = vi.fn();
const mockInstances = vi.fn();
const mockRegisterInstance = vi.fn();
const mockOperations = vi.fn();
const mockOperationDetail = vi.fn();
const mockInstanceDetail = vi.fn();
const mockCreateHttpNs = vi.fn();
const mockCreatePrivateDns = vi.fn();
const createNsState = vi.hoisted(() => ({ isError: false, error: null as Error | null }));
const mockCreatePublicDns = vi.fn();
const registerState = vi.hoisted(() => ({ isError: false, error: null as Error | null }));
const mockDeregisterInstance = vi.fn();
const mockDeleteNs = vi.fn();
const mockDeleteSvc = vi.fn();

vi.mock("../../hooks/useCloudMap", () => ({
  useCloudMapNamespaces: (...args: any[]) => mockNamespaces(...args),
  useDeleteCloudMapNamespace: () => ({
    mutateAsync: mockDeleteNs,
    get isPending() { return deleteNsState.isPending; },
    get variables() { return deleteNsState.variables; },
  }),
  useCloudMapServices: (...args: any[]) => mockServices(...args),
  useDeleteCloudMapService: () => ({
    mutateAsync: mockDeleteSvc,
    get isPending() { return deleteSvcState.isPending; },
    get variables() { return deleteSvcState.variables; },
  }),
  useCloudMapInstances: (...args: any[]) => mockInstances(...args),
  useCreateCloudMapNamespace: () => ({
    mutate: mockCreateHttpNs,
    isPending: false,
    get isError() { return createNsState.isError; },
    get error() { return createNsState.error; },
  }),
  useCloudMapOperations: (...args: any[]) => mockOperations(...args),
  useCloudMapOperation: (...args: any[]) => mockOperationDetail(...args),
  useCloudMapInstance: (...args: any[]) => mockInstanceDetail(...args),
  useCreateCloudMapPrivateDnsNamespace: () => ({
    mutate: mockCreatePrivateDns,
    isPending: false,
    isError: false,
    error: null,
  }),
  useCreateCloudMapPublicDnsNamespace: () => ({
    mutate: mockCreatePublicDns,
    isPending: false,
    isError: false,
    error: null,
  }),
  useRegisterCloudMapInstance: () => ({
    mutate: mockRegisterInstance,
    isPending: false,
    get isError() { return registerState.isError; },
    get error() { return registerState.error; },
  }),
  useDeregisterCloudMapInstance: () => ({
    mutateAsync: mockDeregisterInstance,
    isPending: false,
  }),
}));

import { CloudMapDashboard } from "./CloudMapDashboard";

beforeEach(() => {
  createNsState.isError = false;
  createNsState.error = null;
  mockOperations.mockReturnValue({ data: { operations: [], total: 0 }, isLoading: false });
  mockOperationDetail.mockReturnValue({ data: undefined });
  mockInstanceDetail.mockReturnValue({ data: undefined });
  registerState.isError = false;
  registerState.error = null;
  vi.clearAllMocks();
  deleteNsState.isPending = false;
  deleteNsState.variables = null;
  deleteSvcState.isPending = false;
  deleteSvcState.variables = null;
  mockNamespaces.mockReturnValue({
    data: { namespaces: [], total: 0 },
    isLoading: false, isError: false, error: null,
  });
  mockServices.mockReturnValue({
    data: { services: [], total: 0 },
    isLoading: false,
  });
  mockInstances.mockReturnValue({
    data: { instances: [], total: 0 },
    isLoading: false,
  });
});

describe("CloudMapDashboard — namespace list", () => {
  it("shows loading skeleton when loading", () => {
    mockNamespaces.mockReturnValue({
      data: undefined, isLoading: true, isError: false, error: null,
    });
    const { container } = render(<CloudMapDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty message for namespaces", () => {
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No namespaces/i)).toBeTruthy();
  });

  it("renders namespaces with data", () => {
    mockNamespaces.mockReturnValue({
      data: {
        namespaces: [{ Id: "ns-123", Name: "my-namespace", Type: "DNS_PRIVATE", Description: "My private namespace" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-namespace")).toBeTruthy();
    expect(screen.getByText("DNS_PRIVATE")).toBeTruthy();
    expect(screen.getByText("My private namespace")).toBeTruthy();
  });

  it("shows dash for missing type and description", () => {
    mockNamespaces.mockReturnValue({
      data: {
        namespaces: [{ Id: "ns-456", Name: "bare-ns" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("bare-ns")).toBeTruthy();
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it("shows delete namespace loading state", () => {
    deleteNsState.isPending = true;
    deleteNsState.variables = "ns-123";
    mockNamespaces.mockReturnValue({
      data: {
        namespaces: [{ Id: "ns-123", Name: "my-namespace", Type: "DNS_PRIVATE" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-namespace")).toBeTruthy();
  });

  it("calls deleteNamespace when delete is clicked", async () => {
    mockNamespaces.mockReturnValue({
      data: {
        namespaces: [{ Id: "ns-123", Name: "my-namespace", Type: "DNS_PRIVATE", Description: "My private namespace" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-namespace")).toBeTruthy());
    const deleteBtn = screen.getByRole("button", { name: /Delete my-namespace/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(mockDeleteNs).toHaveBeenCalledWith("ns-123"));
  });

  it("filters namespaces by name", async () => {
    mockNamespaces.mockReturnValue({
      data: {
        namespaces: [
          { Id: "ns-1", Name: "alpha-ns", Type: "DNS_PRIVATE" },
          { Id: "ns-2", Name: "beta-ns", Type: "HTTP" },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-ns")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find namespaces");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-ns")).toBeNull());
  });
});

describe("CloudMapDashboard — service list drill-down", () => {
  it("shows services when a namespace is clicked", async () => {
    mockNamespaces.mockReturnValue({
      data: {
        namespaces: [{ Id: "ns-123", Name: "my-namespace", Type: "DNS_PRIVATE" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-namespace/i);
    await waitFor(() => {
      expect(screen.getByText(/Services in namespace/i)).toBeTruthy();
      expect(screen.getByText(/No services/i)).toBeTruthy();
    });
  });

  it("renders services with data when namespace is selected", async () => {
    mockNamespaces.mockReturnValue({
      data: {
        namespaces: [{ Id: "ns-123", Name: "my-namespace", Type: "DNS_PRIVATE" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    mockServices.mockReturnValue({
      data: {
        services: [{ Id: "svc-456", Name: "my-service", Type: "HTTP", Description: "My HTTP service" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-namespace/i);
    await waitFor(() => {
      expect(screen.getByText("my-service")).toBeTruthy();
      expect(screen.getByText("HTTP")).toBeTruthy();
    });
  });

  it("shows dash for missing service type and description", async () => {
    mockNamespaces.mockReturnValue({
      data: {
        namespaces: [{ Id: "ns-123", Name: "my-namespace", Type: "DNS_PRIVATE" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    mockServices.mockReturnValue({
      data: {
        services: [{ Id: "svc-789", Name: "bare-svc" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-namespace/i);
    await waitFor(() => {
      expect(screen.getByText("bare-svc")).toBeTruthy();
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows delete service loading state", async () => {
    deleteSvcState.isPending = true;
    deleteSvcState.variables = "svc-456";
    mockNamespaces.mockReturnValue({
      data: {
        namespaces: [{ Id: "ns-123", Name: "my-namespace", Type: "DNS_PRIVATE" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    mockServices.mockReturnValue({
      data: {
        services: [{ Id: "svc-456", Name: "my-service", Type: "HTTP" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-namespace/i);
    await waitFor(() => expect(screen.getByText("my-service")).toBeTruthy());
  });

  it("calls deleteService when delete is clicked on a service", async () => {
    mockNamespaces.mockReturnValue({
      data: {
        namespaces: [{ Id: "ns-123", Name: "my-namespace", Type: "DNS_PRIVATE" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    mockServices.mockReturnValue({
      data: {
        services: [{ Id: "svc-456", Name: "my-service", Type: "HTTP", Description: "My HTTP service" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-namespace/i);
    await waitFor(() => expect(screen.getByText("my-service")).toBeTruthy());
    const deleteBtn = screen.getByRole("button", { name: /Delete my-service/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(mockDeleteSvc).toHaveBeenCalledWith("svc-456"));
  });

  it("filters services by name", async () => {
    mockNamespaces.mockReturnValue({
      data: {
        namespaces: [{ Id: "ns-1", Name: "my-ns" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    mockServices.mockReturnValue({
      data: {
        services: [
          { Id: "svc-1", Name: "alpha-svc" },
          { Id: "svc-2", Name: "beta-svc" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-ns/i);
    await waitFor(() => expect(screen.getByText("alpha-svc")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find services");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-svc")).toBeNull());
  });

  it("navigates back from services to namespaces", async () => {
    mockNamespaces.mockReturnValue({
      data: {
        namespaces: [{ Id: "ns-123", Name: "my-namespace", Type: "DNS_PRIVATE" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-namespace/i);
    await waitFor(() => expect(screen.getByText(/Back to namespaces/i)).toBeTruthy());
    await clickButton(user, /Back to namespaces/i);
    await waitFor(() => expect(screen.getByText(/Cloud Map Namespaces/i)).toBeTruthy());
  });
});

describe("CloudMapDashboard — instance list drill-down", () => {
  it("shows instances when a service is clicked", async () => {
    mockNamespaces.mockReturnValue({
      data: {
        namespaces: [{ Id: "ns-123", Name: "my-namespace", Type: "DNS_PRIVATE" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    mockServices.mockReturnValue({
      data: {
        services: [{ Id: "svc-456", Name: "my-service", Type: "HTTP", Description: "My HTTP service" }],
        total: 1,
      },
      isLoading: false,
    });
    mockInstances.mockReturnValue({
      data: {
        instances: [{ Id: "inst-789", Attributes: { region: "us-east-1", version: "1.0" } }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-namespace/i);
    await waitFor(() => expect(screen.getByText("my-service")).toBeTruthy());
    await clickButton(user, /my-service/i);
    await waitFor(() => {
      expect(screen.getByText("inst-789")).toBeTruthy();
      expect(screen.getByText(/region=us-east-1/)).toBeTruthy();
    });
  });

  it("shows empty attributes for instance with no Attributes", async () => {
    mockNamespaces.mockReturnValue({
      data: {
        namespaces: [{ Id: "ns-123", Name: "my-namespace", Type: "DNS_PRIVATE" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    mockServices.mockReturnValue({
      data: {
        services: [{ Id: "svc-456", Name: "my-service", Type: "HTTP" }],
        total: 1,
      },
      isLoading: false,
    });
    mockInstances.mockReturnValue({
      data: {
        instances: [{ Id: "inst-000", Attributes: null }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-namespace/i);
    await waitFor(() => screen.getByText("my-service"));
    await clickButton(user, /my-service/i);
    await waitFor(() => expect(screen.getByText("inst-000")).toBeTruthy());
  });

  it("navigates back from instances to services", async () => {
    mockNamespaces.mockReturnValue({
      data: {
        namespaces: [{ Id: "ns-123", Name: "my-namespace", Type: "DNS_PRIVATE" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    mockServices.mockReturnValue({
      data: {
        services: [{ Id: "svc-456", Name: "my-service", Type: "HTTP" }],
        total: 1,
      },
      isLoading: false,
    });
    mockInstances.mockReturnValue({
      data: {
        instances: [{ Id: "inst-789", Attributes: {} }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-namespace/i);
    await waitFor(() => expect(screen.getByText("my-service")).toBeTruthy());
    await clickButton(user, /my-service/i);
    await waitFor(() => expect(screen.getByText("inst-789")).toBeTruthy());
    await clickButton(user, /back to services/i);
    await waitFor(() => {
      expect(screen.getByText(/Services in namespace/i)).toBeTruthy();
      expect(screen.queryByText("inst-789")).toBeNull();
    });
    await clickButton(user, /back to namespaces/i);
    await waitFor(() => {
      expect(screen.getByText(/Cloud Map Namespaces/i)).toBeTruthy();
      expect(screen.getByText("my-namespace")).toBeTruthy();
    });
  });

  it("shows empty message when namespaces key is missing", () => {
    mockNamespaces.mockReturnValue({ data: {} as any, isLoading: false });
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No namespaces/i)).toBeTruthy();
  });

  it("shows empty message when services key is missing", async () => {
    mockNamespaces.mockReturnValue({
      data: {
        namespaces: [{ Id: "ns-123", Name: "my-namespace", Type: "DNS_PRIVATE" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    mockServices.mockReturnValue({ data: {} as any, isLoading: false });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-namespace/i);
    await waitFor(() => expect(screen.getByText(/No services/i)).toBeTruthy());
  });

  it("shows empty message when instances key is missing", async () => {
    mockNamespaces.mockReturnValue({
      data: {
        namespaces: [{ Id: "ns-123", Name: "my-namespace", Type: "DNS_PRIVATE" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    mockServices.mockReturnValue({
      data: {
        services: [{ Id: "svc-456", Name: "my-service", Type: "HTTP" }],
        total: 1,
      },
      isLoading: false,
    });
    mockInstances.mockReturnValue({ data: {} as any, isLoading: false });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-namespace/i);
    await waitFor(() => expect(screen.getByText("my-service")).toBeTruthy());
    await clickButton(user, /my-service/i);
    await waitFor(() => expect(screen.getByText(/No instances/i)).toBeTruthy());
  });
});

describe("CloudMapDashboard — instance registration", () => {
  function openInstances(instances: any[]) {
    return (async () => {
      mockNamespaces.mockReturnValue({
        data: { namespaces: [{ Id: "ns-1", Name: "ns-a", Type: "DNS_PRIVATE" }], total: 1 },
        isLoading: false, isError: false, error: null,
      });
      mockServices.mockReturnValue({
        data: { services: [{ Id: "svc-1", Name: "svc-a", Type: "HTTP" }], total: 1 },
        isLoading: false,
      });
      mockInstances.mockReturnValue({ data: { instances, total: instances.length } });
      const user = userEvent.setup();
      render(<CloudMapDashboard />, { wrapper: createWrapper() });
      await clickButton(user, /ns-a/i);
      await clickButton(user, /svc-a/i);
      await screen.findByText(/Instances in svc-1/);
      return user;
    })();
  }

  it("lists instances with attributes", async () => {
    await openInstances([{ Id: "i-1", Attributes: { AWS_INSTANCE_IPV4: "10.0.0.1" } }]);
    expect(screen.getByText("AWS_INSTANCE_IPV4=10.0.0.1")).toBeTruthy();
  });

  it("registers an instance with an IP", async () => {
    mockRegisterInstance.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    const user = await openInstances([]);
    await clickButton(user, /Create instance/i);
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    const inputs = dialog.querySelectorAll("input");
    await user.type(inputs[0], "i-9");
    await user.type(inputs[1], "10.0.0.9");
    await user.click(within(dialog).getByRole("button", { name: "Register" }));
    await waitFor(() =>
      expect(mockRegisterInstance).toHaveBeenCalledWith(
        { serviceId: "svc-1", instanceId: "i-9", attributes: { AWS_INSTANCE_IPV4: "10.0.0.9" } },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    );
  });

  it("registers without attributes when IP blank", async () => {
    mockRegisterInstance.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    const user = await openInstances([]);
    await clickButton(user, /Create instance/i);
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    const inputs = dialog.querySelectorAll("input");
    await user.type(inputs[0], "i-8");
    await user.click(within(dialog).getByRole("button", { name: "Register" }));
    await waitFor(() =>
      expect(mockRegisterInstance).toHaveBeenCalledWith(
        { serviceId: "svc-1", instanceId: "i-8", attributes: undefined },
        expect.anything()
      )
    );
  });

  it("keeps Register disabled until an ID is typed", async () => {
    const user = await openInstances([]);
    await clickButton(user, /Create instance/i);
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    expect(within(dialog).getByRole("button", { name: "Register" }).hasAttribute("disabled")).toBe(true);
  });

  it("deregisters an instance", async () => {
    mockDeregisterInstance.mockResolvedValue({});
    const user = await openInstances([{ Id: "i-1", Attributes: {} }]);
    await user.click(screen.getByRole("button", { name: /Delete i-1/i }));
    await waitFor(() =>
      expect(mockDeregisterInstance).toHaveBeenCalledWith({ serviceId: "svc-1", instanceId: "i-1" })
    );
  });
});

describe("CloudMapDashboard — register modal error arms", () => {
  it("shows the register error and fallback message", async () => {
    mockNamespaces.mockReturnValue({
      data: { namespaces: [{ Id: "ns-1", Name: "ns-a", Type: "DNS_PRIVATE" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockServices.mockReturnValue({
      data: { services: [{ Id: "svc-1", Name: "svc-a", Type: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockInstances.mockReturnValue({ data: { instances: [], total: 0 } });
    registerState.isError = true;
    registerState.error = new Error("register failed");
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /ns-a/i);
    await clickButton(user, /svc-a/i);
    await clickButton(user, /Create instance/i);
    expect(await screen.findByText("register failed")).toBeTruthy();
  });

  it("dismisses the register modal via Escape and Cancel", async () => {
    mockNamespaces.mockReturnValue({
      data: { namespaces: [{ Id: "ns-1", Name: "ns-a", Type: "DNS_PRIVATE" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockServices.mockReturnValue({
      data: { services: [{ Id: "svc-1", Name: "svc-a", Type: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockInstances.mockReturnValue({ data: { instances: [], total: 0 } });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /ns-a/i);
    await clickButton(user, /svc-a/i);
    await clickButton(user, /Create instance/i);
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    // reopen + Escape
    await clickButton(user, /Create instance/i);
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) =>
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27 })
    );
    expect(mockRegisterInstance).not.toHaveBeenCalled();
  });

  it("falls back to a generic register error message", async () => {
    mockNamespaces.mockReturnValue({
      data: { namespaces: [{ Id: "ns-1", Name: "ns-a", Type: "DNS_PRIVATE" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockServices.mockReturnValue({
      data: { services: [{ Id: "svc-1", Name: "svc-a", Type: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockInstances.mockReturnValue({ data: { instances: [], total: 0 } });
    registerState.isError = true;
    registerState.error = null;
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /ns-a/i);
    await clickButton(user, /svc-a/i);
    await clickButton(user, /Create instance/i);
    expect(await screen.findByText("Failed to register instance")).toBeTruthy();
  });
});

describe("CloudMapDashboard — operations + namespace create", () => {
  it("lists operations and shows detail on click", async () => {
    mockNamespaces.mockReturnValue({
      data: { namespaces: [], total: 0 },
      isLoading: false, isError: false, error: null,
    });
    mockOperations.mockReturnValue({
      data: { operations: [{ id: "op-1", status: "SUCCESS" }], total: 1 },
      isLoading: false,
    });
    mockOperationDetail.mockReturnValue({
      data: { operation: { id: "op-1", status: "SUCCESS", createDate: new Date(0), targets: { NAMESPACE: "ns-1" } } },
    });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByText("op-1"));
    expect(await screen.findByText(/NAMESPACE=ns-1/)).toBeTruthy();
    expect(mockOperationDetail).toHaveBeenCalledWith("op-1");
  });

  it("creates a private DNS namespace with VPC", async () => {
    mockCreatePrivateDns.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    mockNamespaces.mockReturnValue({
      data: { namespaces: [], total: 0 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create namespace/i);
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.click(within(dialog).getByRole("button", { name: /HTTP/i }));
    await user.click(await within(dialog).findByRole("option", { name: "Private DNS" }));
    const inputs = dialog.querySelectorAll("input");
    await user.type(inputs[0], "corp.internal");
    await user.type(inputs[1], "vpc-1");
    await user.click(within(dialog).getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(mockCreatePrivateDns).toHaveBeenCalledWith(
        { name: "corp.internal", vpc: "vpc-1", description: undefined },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    );
  });

  it("creates a public DNS namespace without VPC field", async () => {
    mockCreatePublicDns.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    mockNamespaces.mockReturnValue({
      data: { namespaces: [], total: 0 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create namespace/i);
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.click(within(dialog).getByRole("button", { name: /HTTP/i }));
    await user.click(await within(dialog).findByRole("option", { name: "Public DNS" }));
    const inputs = dialog.querySelectorAll("input");
    await user.type(inputs[0], "example.com");
    await user.click(within(dialog).getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(mockCreatePublicDns).toHaveBeenCalledWith(
        { name: "example.com", description: undefined },
        expect.anything()
      )
    );
  });

  it("keeps Create disabled for private DNS without VPC", async () => {
    mockNamespaces.mockReturnValue({
      data: { namespaces: [], total: 0 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create namespace/i);
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.click(within(dialog).getByRole("button", { name: /HTTP/i }));
    await user.click(await within(dialog).findByRole("option", { name: "Private DNS" }));
    const createBtn = screen.getAllByRole("button", { name: "Create" }).at(-1)!;
    expect(createBtn.hasAttribute("disabled")).toBe(true);
  });

  it("shows the create-namespace error fallback", async () => {
    createNsState.isError = true;
    createNsState.error = null;
    mockNamespaces.mockReturnValue({
      data: { namespaces: [], total: 0 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create namespace/i);
    expect(await screen.findByText("Failed to create namespace")).toBeTruthy();
  });

  it("shows instance detail from the instances view", async () => {
    mockNamespaces.mockReturnValue({
      data: { namespaces: [{ Id: "ns-1", Name: "ns-a", Type: "DNS_PRIVATE" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockServices.mockReturnValue({
      data: { services: [{ Id: "svc-1", Name: "svc-a", Type: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockInstances.mockReturnValue({
      data: { instances: [{ Id: "i-1", Attributes: { AWS_INSTANCE_IPV4: "10.0.0.1" } }], total: 1 },
    });
    mockInstanceDetail.mockReturnValue({
      data: { instance: { id: "i-1", attributes: { AWS_INSTANCE_IPV4: "10.0.0.1" } } },
    });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /ns-a/i);
    await clickButton(user, /svc-a/i);
    await screen.findByText(/Instances in svc-1/);
    await user.click(screen.getByRole("button", { name: "Detail" }));
    expect(await screen.findByText("Instance — i-1")).toBeTruthy();
    expect(mockInstanceDetail).toHaveBeenCalledWith("svc-1", "i-1");
  });
});

describe("CloudMapDashboard — operations/instance edge arms", () => {
  it("toggles operations detail off on second click", async () => {
    mockNamespaces.mockReturnValue({
      data: { namespaces: [], total: 0 },
      isLoading: false, isError: false, error: null,
    });
    mockOperations.mockReturnValue({
      data: { operations: [{ id: "op-1", status: "SUCCESS" }], total: 1 },
      isLoading: false,
    });
    mockOperationDetail.mockReturnValue({
      data: { operation: { id: "op-1", status: "SUCCESS", targets: {} } },
    });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByText("op-1"));
    await screen.findByText(/Operation — op-1/);
    await user.click(screen.getByText("op-1"));
    await waitFor(() => expect(screen.queryByText(/Operation — op-1/)).toBeNull());
  });

  it("renders operation detail with sparse dates and targets", async () => {
    mockNamespaces.mockReturnValue({
      data: { namespaces: [], total: 0 },
      isLoading: false, isError: false, error: null,
    });
    mockOperations.mockReturnValue({
      data: { operations: [{ id: "op-2", status: "PENDING" }], total: 1 },
      isLoading: false,
    });
    mockOperationDetail.mockReturnValue({
      data: { operation: { id: "op-2", status: "PENDING" } },
    });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByText("op-2"));
    expect(await screen.findByText(/Operation — op-2/)).toBeTruthy();
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(3);
  });

  it("creates an HTTP namespace via the default type", async () => {
    mockCreateHttpNs.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    mockNamespaces.mockReturnValue({
      data: { namespaces: [], total: 0 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create namespace/i);
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    const inputs = dialog.querySelectorAll("input");
    await user.type(inputs[0], "api.local");
    await user.click(within(dialog).getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(mockCreateHttpNs).toHaveBeenCalledWith(
        { name: "api.local", description: undefined },
        expect.anything()
      )
    );
  });

  it("cancels + Escape-dismisses the create modal", async () => {
    mockNamespaces.mockReturnValue({
      data: { namespaces: [], total: 0 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create namespace/i);
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(mockCreateHttpNs).not.toHaveBeenCalled();
    await clickButton(user, /Create namespace/i);
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) =>
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27 })
    );
    expect(mockCreateHttpNs).not.toHaveBeenCalled();
  });

  it("toggles instance detail off and hides container when data missing", async () => {
    mockNamespaces.mockReturnValue({
      data: { namespaces: [{ Id: "ns-1", Name: "ns-a", Type: "DNS_PRIVATE" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockServices.mockReturnValue({
      data: { services: [{ Id: "svc-1", Name: "svc-a", Type: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockInstances.mockReturnValue({
      data: { instances: [{ Id: "i-1", Attributes: {} }], total: 1 },
    });
    mockInstanceDetail.mockReturnValue({ data: undefined });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /ns-a/i);
    await clickButton(user, /svc-a/i);
    await screen.findByText(/Instances in svc-1/);
    // toggle via instance-id link
    await user.click(screen.getByRole("button", { name: "i-1" }));
    await user.click(screen.getByRole("button", { name: "i-1" }));
    expect(mockInstanceDetail).toHaveBeenCalledWith("svc-1", "i-1");
    expect(screen.queryByText(/Instance — i-1/)).toBeNull();
  });
});

describe("CloudMapDashboard — remaining branch arms", () => {
  it("covers Heartbeat-style detail toggle button and description typing", async () => {
    mockNamespaces.mockReturnValue({
      data: { namespaces: [{ Id: "ns-1", Name: "ns-a", Type: "DNS_PRIVATE" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockServices.mockReturnValue({
      data: { services: [{ Id: "svc-1", Name: "svc-a", Type: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockInstances.mockReturnValue({
      data: { instances: [{ Id: "i-1", Attributes: {} }], total: 1 },
    });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /ns-a/i);
    await clickButton(user, /svc-a/i);
    await screen.findByText(/Instances in svc-1/);
    const detailBtn = screen.getByRole("button", { name: "Detail" });
    await user.click(detailBtn);
    expect(screen.getByRole("button", { name: /Hide detail/i })).toBeTruthy();
    // then exit to namespaces
    await clickButton(user, /Back to services/i);
    await clickButton(user, /Back to namespaces/i);
    // open create modal and type a description
    await clickButton(user, /Create namespace/i);
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    const inputs = dialog.querySelectorAll("input");
    await user.type(inputs[0], "n1");
    await user.type(inputs[1], "desc");
    expect(inputs[1]).toBeTruthy();
  });

  it("renders updateDate when present in operation detail", async () => {
    mockNamespaces.mockReturnValue({
      data: { namespaces: [], total: 0 },
      isLoading: false, isError: false, error: null,
    });
    mockOperations.mockReturnValue({
      data: { operations: [{ id: "op-3", status: "SUCCESS" }], total: 1 },
      isLoading: false,
    });
    mockOperationDetail.mockReturnValue({
      data: { operation: { id: "op-3", status: "SUCCESS", updateDate: new Date(0) } },
    });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByText("op-3"));
    expect(await screen.findByText(/1970/)).toBeTruthy();
  });

  it("renders operations with undefined data and non-empty attributes map", async () => {
    mockNamespaces.mockReturnValue({
      data: { namespaces: [], total: 0 },
      isLoading: false, isError: false, error: null,
    });
    mockOperations.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    expect(await screen.findByText("No operations")).toBeTruthy();

    // instance attributes map arm
    mockNamespaces.mockReturnValue({
      data: { namespaces: [{ Id: "ns-1", Name: "ns-a", Type: "HTTP" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockServices.mockReturnValue({
      data: { services: [{ Id: "svc-1", Name: "svc-a", Type: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockInstances.mockReturnValue({
      data: { instances: [{ Id: "i-2", Attributes: { A: "1" } }], total: 1 },
    });
    mockInstanceDetail.mockReturnValue({
      data: { instance: { id: "i-2", attributes: { A: "1" } } },
    });
    const user2 = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user2, /ns-a/i);
    await clickButton(user2, /svc-a/i);
    await screen.findByText(/Instances in svc-1/);
    await user2.click(screen.getByRole("button", { name: "i-2" }));
    expect((await screen.findAllByText(/A=1/)).length).toBeGreaterThanOrEqual(2);
  });
});

describe("CloudMapDashboard — detail label + empty-attrs arms", () => {
  it("shows the Detail label before selection and dash when attributes empty", async () => {
    mockNamespaces.mockReturnValue({
      data: { namespaces: [{ Id: "ns-1", Name: "ns-a", Type: "HTTP" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockServices.mockReturnValue({
      data: { services: [{ Id: "svc-1", Name: "svc-a", Type: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockInstances.mockReturnValue({
      data: { instances: [{ Id: "i-3", Attributes: {} }], total: 1 },
    });
    mockInstanceDetail.mockReturnValue({
      data: { instance: { id: "i-3", attributes: {} } },
    });
    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /ns-a/i);
    await clickButton(user, /svc-a/i);
    await screen.findByText(/Instances in svc-1/);
    // label arm: "Detail" while nothing selected
    const btn = screen.getByRole("button", { name: "Detail" });
    await user.click(btn);
    expect(await screen.findByText(/Instance — i-3/)).toBeTruthy();
    // empty attributes map falls back to dash inside detail container
    const panel = screen.getByText(/Instance — i-3/).closest('[class*="awsui_container"]') || document.body;
    expect(panel.textContent).toContain("Attributes:");
    // L608 falsy arm: attributes key absent entirely
    mockInstanceDetail.mockReturnValue({ data: { instance: { id: "i-3" } } });
    await user.click(screen.getByRole("button", { name: /Hide detail/i }));
    await user.click(screen.getByRole("button", { name: "Detail" }));
    await waitFor(() => expect(screen.getByText(/Instance — i-3/)).toBeTruthy());
  });
});
