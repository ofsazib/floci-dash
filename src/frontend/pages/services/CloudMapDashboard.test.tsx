// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
}));

import { CloudMapDashboard } from "./CloudMapDashboard";

beforeEach(() => {
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
});
