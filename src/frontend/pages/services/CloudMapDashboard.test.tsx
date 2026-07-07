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

const mockNamespaces = vi.fn();
const mockServices = vi.fn();
const mockInstances = vi.fn();
const mockDeleteNs = vi.fn();
const mockDeleteSvc = vi.fn();

vi.mock("../../hooks/useCloudMap", () => ({
  useCloudMapNamespaces: (...args: any[]) => mockNamespaces(...args),
  useDeleteCloudMapNamespace: () => ({
    mutateAsync: mockDeleteNs,
    isPending: false,
  }),
  useCloudMapServices: (...args: any[]) => mockServices(...args),
  useDeleteCloudMapService: () => ({
    mutateAsync: mockDeleteSvc,
    isPending: false,
  }),
  useCloudMapInstances: (...args: any[]) => mockInstances(...args),
}));

import { CloudMapDashboard } from "./CloudMapDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  mockNamespaces.mockReturnValue({
    data: { namespaces: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
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

// ─── Tests ──────────────────────────────────────────────

describe("CloudMapDashboard — namespace list", () => {
  it("shows loading skeleton when loading", () => {
    mockNamespaces.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
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
        namespaces: [
          {
            Id: "ns-123",
            Name: "my-namespace",
            Type: "DNS_PRIVATE",
            Description: "My private namespace",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<CloudMapDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-namespace")).toBeTruthy();
    expect(screen.getByText("DNS_PRIVATE")).toBeTruthy();
    expect(screen.getByText("My private namespace")).toBeTruthy();
  });

  it("calls deleteNamespace when delete is clicked", async () => {
    mockNamespaces.mockReturnValue({
      data: {
        namespaces: [
          {
            Id: "ns-123",
            Name: "my-namespace",
            Type: "DNS_PRIVATE",
            Description: "My private namespace",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("my-namespace")).toBeTruthy();
    });

    // Find delete button by its aria-label
    const deleteBtn = screen.getByRole("button", { name: /Delete my-namespace/i });
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(mockDeleteNs).toHaveBeenCalledWith("ns-123");
    });
  });
});

describe("CloudMapDashboard — service list drill-down", () => {
  it("shows services when a namespace is clicked", async () => {
    mockNamespaces.mockReturnValue({
      data: {
        namespaces: [
          {
            Id: "ns-123",
            Name: "my-namespace",
            Type: "DNS_PRIVATE",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });

    // Click namespace link
    await clickButton(user, /my-namespace/i);

    await waitFor(() => {
      expect(screen.getByText(/Services in namespace/i)).toBeTruthy();
      expect(screen.getByText(/No services/i)).toBeTruthy();
    });
  });

  it("renders services with data when namespace is selected", async () => {
    mockNamespaces.mockReturnValue({
      data: {
        namespaces: [
          { Id: "ns-123", Name: "my-namespace", Type: "DNS_PRIVATE" },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockServices.mockReturnValue({
      data: {
        services: [
          {
            Id: "svc-456",
            Name: "my-service",
            Type: "HTTP",
            Description: "My HTTP service",
          },
        ],
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

  it("calls deleteService when delete is clicked on a service", async () => {
    mockNamespaces.mockReturnValue({
      data: {
        namespaces: [
          { Id: "ns-123", Name: "my-namespace", Type: "DNS_PRIVATE" },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockServices.mockReturnValue({
      data: {
        services: [
          {
            Id: "svc-456",
            Name: "my-service",
            Type: "HTTP",
            Description: "My HTTP service",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /my-namespace/i);

    await waitFor(() => {
      expect(screen.getByText("my-service")).toBeTruthy();
    });

    const deleteBtn = screen.getByRole("button", { name: /Delete my-service/i });
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(mockDeleteSvc).toHaveBeenCalledWith("svc-456");
    });
  });
});

describe("CloudMapDashboard — instance list drill-down", () => {
  it("shows instances when a service is clicked", async () => {
    mockNamespaces.mockReturnValue({
      data: {
        namespaces: [
          { Id: "ns-123", Name: "my-namespace", Type: "DNS_PRIVATE" },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockServices.mockReturnValue({
      data: {
        services: [
          {
            Id: "svc-456",
            Name: "my-service",
            Type: "HTTP",
            Description: "My HTTP service",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    mockInstances.mockReturnValue({
      data: {
        instances: [
          {
            Id: "inst-789",
            Attributes: { region: "us-east-1", version: "1.0" },
          },
        ],
        total: 1,
      },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<CloudMapDashboard />, { wrapper: createWrapper() });

    // Navigate: namespace -> service -> instances
    await clickButton(user, /my-namespace/i);
    await waitFor(() => expect(screen.getByText("my-service")).toBeTruthy());
    await clickButton(user, /my-service/i);

    await waitFor(() => {
      expect(screen.getByText("inst-789")).toBeTruthy();
      expect(screen.getByText(/region=us-east-1/)).toBeTruthy();
    });
  });

  it("navigates back from instances to services", async () => {
    mockNamespaces.mockReturnValue({
      data: {
        namespaces: [
          { Id: "ns-123", Name: "my-namespace", Type: "DNS_PRIVATE" },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockServices.mockReturnValue({
      data: {
        services: [
          { Id: "svc-456", Name: "my-service", Type: "HTTP" },
        ],
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

    // Click back
    await clickButton(user, /back to services/i);
    await waitFor(() => {
      expect(screen.getByText(/Services in namespace/i)).toBeTruthy();
      expect(screen.queryByText("inst-789")).toBeNull();
    });

    // Click back again
    await clickButton(user, /back to namespaces/i);
    await waitFor(() => {
      expect(screen.getByText(/Cloud Map Namespaces/i)).toBeTruthy();
      expect(screen.getByText("my-namespace")).toBeTruthy();
    });
  });
});
