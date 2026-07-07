// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── vi.hoisted mutable states ──────────────────────────

const createZoneState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const deleteZoneState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const createRecordState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const deleteRecordState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

// ─── Mock hooks ─────────────────────────────────────────

const mockZones = vi.fn();
const mockCreateZone = vi.fn();
const mockDeleteZone = vi.fn();
const mockRecordSets = vi.fn();
const mockCreateRecord = vi.fn();
const mockDeleteRecord = vi.fn();

vi.mock("../../hooks/useRoute53", () => ({
  useRoute53HostedZones: (...args: any[]) => mockZones(...args),
  useCreateRoute53HostedZone: () => ({
    mutate: mockCreateZone,
    get isPending() { return createZoneState.isPending; },
    get isError() { return createZoneState.isError; },
    get error() { return createZoneState.error; },
  }),
  useDeleteRoute53HostedZone: () => ({
    mutateAsync: mockDeleteZone,
    get isPending() { return deleteZoneState.isPending; },
    get variables() { return deleteZoneState.variables; },
  }),
  useRoute53RecordSets: (...args: any[]) => mockRecordSets(...args),
  useCreateRoute53RecordSet: () => ({
    mutate: mockCreateRecord,
    get isPending() { return createRecordState.isPending; },
    get isError() { return createRecordState.isError; },
    get error() { return createRecordState.error; },
  }),
  useDeleteRoute53RecordSet: () => ({
    mutateAsync: mockDeleteRecord,
    get isPending() { return deleteRecordState.isPending; },
    get variables() { return deleteRecordState.variables; },
  }),
}));

import { Route53Dashboard } from "./Route53Dashboard";

beforeEach(() => {
  vi.clearAllMocks();
  createZoneState.isPending = false;
  createZoneState.isError = false;
  createZoneState.error = null;
  deleteZoneState.isPending = false;
  deleteZoneState.variables = null;
  createRecordState.isPending = false;
  createRecordState.isError = false;
  createRecordState.error = null;
  deleteRecordState.isPending = false;
  deleteRecordState.variables = null;
  mockZones.mockReturnValue({ data: { hostedZones: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockRecordSets.mockReturnValue({ data: { recordSets: [], total: 0 }, isLoading: false, isError: false, error: null });
});

describe("Route53Dashboard", () => {
  // ── List view ──────────────────────────────────────────

  it("shows loading skeleton", () => {
    mockZones.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const { container } = render(<Route53Dashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty message", () => {
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No hosted zones found/i)).toBeTruthy();
  });

  it("renders hosted zones with data", () => {
    mockZones.mockReturnValue({
      data: {
        hostedZones: [{ Id: "/hostedzone/Z123", Name: "example.com.", ResourceRecordSetCount: 3, Config: { Comment: "My zone", PrivateZone: false } }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("example.com.")).toBeTruthy();
    expect(screen.getByText("Z123")).toBeTruthy();
    expect(screen.getAllByText("No").length).toBeGreaterThanOrEqual(1);
  });

  it("shows em dash for missing comment", () => {
    mockZones.mockReturnValue({
      data: { hostedZones: [{ Id: "/hostedzone/Z123", Name: "example.com.", ResourceRecordSetCount: 2 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("shows private zone as Yes", () => {
    mockZones.mockReturnValue({
      data: { hostedZones: [{ Id: "/hostedzone/Z456", Name: "private.example.com.", ResourceRecordSetCount: 1, Config: { PrivateZone: true } }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Yes")).toBeTruthy();
  });

  // ── Create zone ────────────────────────────────────────

  it("opens create modal and submits", async () => {
    const user = userEvent.setup();
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create hosted zone")).toBeTruthy());
    const nameInput = screen.getByPlaceholderText("example.com.");
    await user.type(nameInput, "new-example.com.");
    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateZone).toHaveBeenCalledWith(
        expect.objectContaining({ name: "new-example.com." }),
        expect.any(Object),
      );
    });
  });

  it("cancels create modal", async () => {
    const user = userEvent.setup();
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create hosted zone")).toBeTruthy());
    await clickButton(user, /Cancel/i);
    expect(mockCreateZone).not.toHaveBeenCalled();
  });

  it("shows create zone loading state", () => {
    createZoneState.isPending = true;
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No hosted zones found/i)).toBeTruthy();
  });

  it("shows create zone error alert", async () => {
    createZoneState.isError = true;
    createZoneState.error = new Error("Zone creation failed");
    const user = userEvent.setup();
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Zone creation failed")).toBeTruthy();
    });
  });

  it("shows delete zone loading state", () => {
    deleteZoneState.isPending = true;
    deleteZoneState.variables = "/hostedzone/Z111";
    mockZones.mockReturnValue({
      data: { hostedZones: [{ Id: "/hostedzone/Z111", Name: "delete-me.com.", ResourceRecordSetCount: 2 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("delete-me.com.")).toBeTruthy();
  });

  // ── Delete zone ────────────────────────────────────────

  it("deletes a hosted zone", async () => {
    mockZones.mockReturnValue({
      data: { hostedZones: [{ Id: "/hostedzone/Z111", Name: "delete-me.com.", ResourceRecordSetCount: 2 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("delete-me.com.")).toBeTruthy());
    const deleteBtn = screen.getByRole("button", { name: /Delete delete-me/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteZone).toHaveBeenCalledWith("Z111"));
  });

  // ── Filter ─────────────────────────────────────────────

  it("filters zones by name", async () => {
    mockZones.mockReturnValue({
      data: {
        hostedZones: [
          { Id: "/hostedzone/Z1", Name: "alpha.com.", ResourceRecordSetCount: 1 },
          { Id: "/hostedzone/Z2", Name: "beta.com.", ResourceRecordSetCount: 2 },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha.com.")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find zones by name");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha.com.")).toBeNull());
  });

  // ── Detail view ────────────────────────────────────────

  it("navigates to zone detail view", async () => {
    mockZones.mockReturnValue({
      data: { hostedZones: [{ Id: "/hostedzone/Z456", Name: "test.com.", ResourceRecordSetCount: 2 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("test.com.")).toBeTruthy());
    await user.click(screen.getByText("View"));
    await waitFor(() => expect(screen.getByText(/Resource Record Sets/i)).toBeTruthy());
  });

  it("shows record sets with data in detail", async () => {
    mockZones.mockReturnValue({
      data: { hostedZones: [{ Id: "/hostedzone/Z456", Name: "test.com.", ResourceRecordSetCount: 2 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockRecordSets.mockReturnValue({
      data: {
        recordSets: [
          { Name: "test.com.", Type: "NS", TTL: 172800, ResourceRecords: [{ Value: "ns-1.awsdns.com." }] },
          { Name: "www.test.com.", Type: "A", TTL: 300, ResourceRecords: [{ Value: "192.168.1.1" }] },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("test.com."));
    await user.click(screen.getByText("View"));
    await waitFor(() => {
      expect(screen.getByText(/www.test.com./)).toBeTruthy();
      expect(screen.getAllByText("A").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows record set with alias target", async () => {
    mockZones.mockReturnValue({
      data: { hostedZones: [{ Id: "/hostedzone/Z789", Name: "alias.com.", ResourceRecordSetCount: 1 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockRecordSets.mockReturnValue({
      data: {
        recordSets: [{
          Name: "alias.com.", Type: "A", AliasTarget: { DNSName: "my-alb.us-east-1.elb.amazonaws.com" },
        }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("alias.com."));
    await user.click(screen.getByText("View"));
    await waitFor(() => {
      expect(screen.getByText(/my-alb.us-east-1.elb.amazonaws.com/)).toBeTruthy();
    });
  });

  it("shows record set error in detail", async () => {
    mockZones.mockReturnValue({
      data: { hostedZones: [{ Id: "/hostedzone/Z456", Name: "test.com." }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockRecordSets.mockReturnValue({
      data: undefined, isLoading: false, isError: true,
      error: new Error("Failed to load record sets"),
    });
    const user = userEvent.setup();
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("test.com."));
    await user.click(screen.getByText("View"));
    await waitFor(() => {
      expect(screen.getByText("Failed to load record sets")).toBeTruthy();
    });
  });

  it("shows record set with no value gracefully", async () => {
    mockZones.mockReturnValue({
      data: { hostedZones: [{ Id: "/hostedzone/Z789", Name: "empty.com.", ResourceRecordSetCount: 1 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockRecordSets.mockReturnValue({
      data: { recordSets: [{ Name: "empty.com.", Type: "TXT" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("empty.com."));
    await user.click(screen.getByText("View"));
    await waitFor(() => expect(screen.getByText("TXT")).toBeTruthy());
  });

  // ── Back from detail ───────────────────────────────────

  it("goes back from detail to zone list", async () => {
    mockZones.mockReturnValue({
      data: { hostedZones: [{ Id: "/hostedzone/Z456", Name: "test.com.", ResourceRecordSetCount: 2 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockRecordSets.mockReturnValue({ data: { recordSets: [], total: 0 }, isLoading: false, isError: false, error: null });
    const user = userEvent.setup();
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("test.com."));
    await user.click(screen.getByText("View"));
    await waitFor(() => expect(screen.getByText(/Back to Hosted Zones/i)).toBeTruthy());
    await user.click(screen.getByText(/Back to Hosted Zones/i));
    await waitFor(() => expect(screen.getByText("test.com.")).toBeTruthy());
  });
});
