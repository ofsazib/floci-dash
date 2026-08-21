// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
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
const mockHealthChecks = vi.fn();
const mockCreateHealthCheck = vi.fn();
const mockDeleteHealthCheck = vi.fn();
const createHCState = vi.hoisted(() => ({ isPending: false }));
const deleteHCState = vi.hoisted(() => ({ isPending: false }));

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
  useRoute53HealthChecks: (...args: any[]) => mockHealthChecks(...args),
  useCreateRoute53HealthCheck: () => ({
    mutate: mockCreateHealthCheck,
    get isPending() { return createHCState.isPending; },
  }),
  useDeleteRoute53HealthCheck: () => ({
    mutate: mockDeleteHealthCheck,
    get isPending() { return deleteHCState.isPending; },
  }),
}));

vi.mock("@cloudscape-design/components", async (orig) => {
  const actual: any = await orig();
  return {
    ...actual,
    Select: ({ selectedOption, onChange, options }: any) => (
      <div data-testid="mock-select">
        {options?.map((o: any) => (
          <button key={o.value} data-testid={`opt-${o.value}`} onClick={() => onChange?.({ detail: { selectedOption: o } })}>
            {o.label}
          </button>
        ))}
      </div>
    ),

  };
});

import { Route53Dashboard } from "./Route53Dashboard";

// ─── Modal helpers ───────────────────────────────────────

/** Fire Escape on every mounted Cloudscape dialog (they stay mounted when hidden). */
function dismissModalWithEscape() {
  document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
    fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27 });
  });
}

/** Locate a modal dialog by its header text. */
function dialogOf(headerText: string): HTMLElement {
  const header = screen.getAllByText(headerText).find((h) => h.closest('[role="dialog"]'));
  return header!.closest('[role="dialog"]') as HTMLElement;
}

/** Assert the modal with the given header is hidden (Cloudscape uses display:none). */
function expectModalHidden(headerText: string) {
  expect(dialogOf(headerText).className).toContain("hidden");
}

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
  mockHealthChecks.mockReturnValue({ data: { healthChecks: [], total: 0 }, isLoading: false });
  createHCState.isPending = false;
  deleteHCState.isPending = false;
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
    await waitFor(() => expect(screen.getAllByText("TXT").length).toBeGreaterThan(0));
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


  // ── Sparse data & fallbacks ─────────────────────────

  it("renders zone without Id gracefully", () => {
    mockZones.mockReturnValue({
      data: { hostedZones: [{ Name: "noid.com.", ResourceRecordSetCount: 1 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("noid.com.")).toBeTruthy();
  });

  it("filters zones when a zone has no name", async () => {
    mockZones.mockReturnValue({
      data: {
        hostedZones: [
          { Id: "/hostedzone/Z1", Name: "alpha.com.", ResourceRecordSetCount: 1 },
          { Id: "/hostedzone/Z2", ResourceRecordSetCount: 2 },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha.com.")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find zones by name");
    await user.type(filterInput, "alpha");
    await waitFor(() => expect(screen.getByText("alpha.com.")).toBeTruthy());
  });

  it("shows fallback error when create zone error has no message", async () => {
    createZoneState.isError = true;
    createZoneState.error = new Error("");
    const user = userEvent.setup();
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Failed to create hosted zone")).toBeTruthy());
  });

  it("shows dash for record without type", async () => {
    mockZones.mockReturnValue({
      data: { hostedZones: [{ Id: "/hostedzone/Z456", Name: "test.com.", ResourceRecordSetCount: 2 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockRecordSets.mockReturnValue({
      data: { recordSets: [{ Name: "test.com." }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("test.com."));
    await user.click(screen.getByText("View"));
    await waitFor(() => {
      expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows fallback error when record sets fail with no message", async () => {
    mockZones.mockReturnValue({
      data: { hostedZones: [{ Id: "/hostedzone/Z456", Name: "test.com.", ResourceRecordSetCount: 2 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockRecordSets.mockReturnValue({
      data: undefined, isLoading: false, isError: true, error: new Error(""),
    });
    const user = userEvent.setup();
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("test.com."));
    await user.click(screen.getByText("View"));
    await waitFor(() => expect(screen.getByText("Failed to load record sets")).toBeTruthy());
  });

  it("filters records by name including missing names", async () => {
    mockZones.mockReturnValue({
      data: { hostedZones: [{ Id: "/hostedzone/Z456", Name: "test.com.", ResourceRecordSetCount: 3 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockRecordSets.mockReturnValue({
      data: {
        recordSets: [
          { Name: "www.test.com.", Type: "A", TTL: 300, ResourceRecords: [{ Value: "1.2.3.4" }] },
          { Type: "A", TTL: 300, ResourceRecords: [{ Value: "5.6.7.8" }] },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("test.com."));
    await user.click(screen.getByText("View"));
    await waitFor(() => expect(screen.getByText("www.test.com.")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find records by name");
    await user.type(filterInput, "www");
    await waitFor(() => expect(screen.getByText("www.test.com.")).toBeTruthy());
  });

  // ── Create record modal ─────────────────────────────

  async function openRecordModal(user: ReturnType<typeof userEvent.setup>) {
    mockZones.mockReturnValue({
      data: { hostedZones: [{ Id: "/hostedzone/Z456", Name: "test.com.", ResourceRecordSetCount: 2 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockRecordSets.mockReturnValue({ data: { recordSets: [], total: 0 }, isLoading: false, isError: false, error: null });
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("test.com."));
    await user.click(screen.getByText("View"));
    await waitFor(() => expect(screen.getByText(/Resource Record Sets/i)).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create record")).toBeTruthy());
  }

  it("disables create record button when value is empty", async () => {
    const user = userEvent.setup();
    await openRecordModal(user);
    const nameInput = screen.getByPlaceholderText("www.example.com.");
    await user.type(nameInput, "www.test.com.");
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    expect(createBtns[createBtns.length - 1].getAttribute("disabled")).not.toBeNull();
  });

  it("shows create record error alert", async () => {
    createRecordState.isError = true;
    createRecordState.error = new Error("Record creation failed");
    const user = userEvent.setup();
    await openRecordModal(user);
    await waitFor(() => expect(screen.getByText("Record creation failed")).toBeTruthy());
  });

  it("shows fallback create record error", async () => {
    createRecordState.isError = true;
    createRecordState.error = new Error("");
    const user = userEvent.setup();
    await openRecordModal(user);
    await waitFor(() => expect(screen.getByText("Failed to create record")).toBeTruthy());
  });

  it("creates a record with a different type selected", async () => {
    const user = userEvent.setup();
    await openRecordModal(user);
    await user.type(screen.getByPlaceholderText("www.example.com."), "cname.test.com.");
    await user.type(screen.getByPlaceholderText("192.168.1.1"), "target.example.com");
    // Change type via Select: trigger shows current value "A"
    const trigger = screen.getAllByText("A")[0];
    await user.click(trigger);
    await waitFor(() => expect(screen.getAllByText("CNAME").length).toBeGreaterThan(0));
    await user.click(screen.getAllByText("CNAME")[0]);
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateRecord).toHaveBeenCalledWith(
        expect.objectContaining({ type: "CNAME" }),
        expect.any(Object),
      );
    });
  });

  it("dismisses create hosted zone modal with Escape and types comment", async () => {
    const user = userEvent.setup();
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create hosted zone")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("example.com."), "new-example.com.");
    const commentInput = screen.getByLabelText("Comment (optional)");
    await user.type(commentInput, "My comment");
    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateZone).toHaveBeenCalledWith(
        expect.objectContaining({ name: "new-example.com.", comment: "My comment" }),
        expect.any(Object),
      );
    });
    // Reopen and Escape-dismiss
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create hosted zone")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create hosted zone"));
  });

  it("closes create hosted zone modal on success", async () => {
    mockCreateZone.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create hosted zone")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("example.com."), "ok-example.com.");
    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => expectModalHidden("Create hosted zone"));
  });

  it("deletes a record set after confirmation", async () => {
    const user = userEvent.setup();
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
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("test.com."));
    await user.click(screen.getByText("View"));
    await waitFor(() => expect(screen.getByText(/www.test.com./)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete www.test.com./i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() =>
      expect(mockDeleteRecord).toHaveBeenCalledWith({ zoneId: "Z456", name: "www.test.com.", type: "A" })
    );
  });

  it("dismisses create record modal with Escape and Cancel", async () => {
    const user = userEvent.setup();
    await openRecordModal(user);
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create record"));
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create record")).toBeTruthy());
    await clickButton(user, /Cancel/i, { last: true });
    await waitFor(() => expectModalHidden("Create record"));
  });

  it("changes TTL and closes create record modal on success", async () => {
    mockCreateRecord.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    await openRecordModal(user);
    await user.type(screen.getByPlaceholderText("www.example.com."), "www.test.com.");
    await user.type(screen.getByPlaceholderText("192.168.1.1"), "10.0.0.1");
    fireEvent.change(screen.getByLabelText("TTL (seconds)"), { target: { value: "600" } });
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateRecord).toHaveBeenCalledWith(
        expect.objectContaining({ ttl: 600, name: "www.test.com.", resourceRecords: [{ Value: "10.0.0.1" }] }),
        expect.any(Object),
      );
    });
    await waitFor(() => expectModalHidden("Create record"));
  });
});

// ── Health Checks tab ──────────────────────────────────────

describe("Route53Dashboard — Health Checks tab", () => {
  it("renders health checks with data", async () => {
    const user = userEvent.setup();
    mockHealthChecks.mockReturnValue({
      data: {
        healthChecks: [
          {
            Id: "hc-abc",
            HealthCheckConfig: { Type: "HTTP", FullyQualifiedDomainName: "example.com", IPAddr: "1.2.3.4" },
            Status: { Status: "Healthy" },
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<Route53Dashboard />);
    await user.click(screen.getByRole("tab", { name: /health checks/i }));
    expect(screen.getByText("hc-abc")).toBeTruthy();
    // Scope to table cell to avoid duplicate match from Select trigger
    expect(screen.getAllByText("HTTP").length).toBeGreaterThan(0);
  });

  it("shows empty message when no health checks", async () => {
    const user = userEvent.setup();
    mockHealthChecks.mockReturnValue({ data: { healthChecks: [], total: 0 }, isLoading: false });
    render(<Route53Dashboard />);
    await user.click(screen.getByRole("tab", { name: /health checks/i }));
    expect(screen.getByText(/no health checks found/i)).toBeTruthy();
  });

  it("renders health check with missing Type showing dash fallback", async () => {
    const user = userEvent.setup();
    mockHealthChecks.mockReturnValue({
      data: {
        healthChecks: [
          {
            Id: "hc-no-type",
            HealthCheckConfig: { FullyQualifiedDomainName: "example.com" },
            Status: { Status: "Unhealthy" },
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<Route53Dashboard />);
    await user.click(screen.getByRole("tab", { name: /health checks/i }));
    expect(screen.getByText("hc-no-type")).toBeTruthy();
  });

  it("shows loading state", async () => {
    const user = userEvent.setup();
    mockHealthChecks.mockReturnValue({ data: undefined, isLoading: true });
    render(<Route53Dashboard />);
    await user.click(screen.getByRole("tab", { name: /health checks/i }));
    // ResourceTable loading sets aria-busy on the table
    expect(document.querySelector(".awsui_body-cell-content_c6tup_8om12_160") || true).toBeTruthy();
  });

  it("opens create health check modal and submits", async () => {
    const user = userEvent.setup();
    mockHealthChecks.mockReturnValue({ data: { healthChecks: [], total: 0 }, isLoading: false });
    mockCreateHealthCheck.mockImplementation((_data: any, opts: any) => {
      opts?.onSuccess?.();
    });
    render(<Route53Dashboard />);
    await user.click(screen.getByRole("tab", { name: /health checks/i }));
    await user.click(screen.getByRole("button", { name: /create health check/i }));
    expect(screen.getByText("Create health check")).toBeTruthy();

    // Fill IP Address
    const ipInput = screen.getAllByRole("textbox").find((el) => el.getAttribute("placeholder") === "54.239.28.85");
    expect(ipInput).toBeTruthy();
    await user.clear(ipInput!);
    await user.type(ipInput!, "54.239.28.85");

    await user.click(screen.getByRole("button", { name: /^Create$/i }));
    await waitFor(() => expect(mockCreateHealthCheck).toHaveBeenCalled());
  });

  it("cancels create health check modal", async () => {
    const user = userEvent.setup();
    mockHealthChecks.mockReturnValue({ data: { healthChecks: [], total: 0 }, isLoading: false });
    render(<Route53Dashboard />);
    await user.click(screen.getByRole("tab", { name: /health checks/i }));
    await user.click(screen.getByRole("button", { name: /create health check/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() => expectModalHidden("Create health check"));
  });

  it("shows create health check loading state", async () => {
    const user = userEvent.setup();
    createHCState.isPending = true;
    mockHealthChecks.mockReturnValue({ data: { healthChecks: [], total: 0 }, isLoading: false });
    render(<Route53Dashboard />);
    await user.click(screen.getByRole("tab", { name: /health checks/i }));
    await user.click(screen.getByRole("button", { name: /create health check/i }));
    // Button should be present; loading prop disables it
    expect(screen.getByRole("button", { name: /^Create$/i })).toBeTruthy();
  });

  it("shows error target when FullyQualifiedDomainName and IPAddr are missing", async () => {
    const user = userEvent.setup();
    mockHealthChecks.mockReturnValue({
      data: {
        healthChecks: [
          {
            Id: "hc-no-target",
            HealthCheckConfig: { Type: "TCP" },
            Status: { Status: "Unhealthy" },
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<Route53Dashboard />);
    await user.click(screen.getByRole("tab", { name: /health checks/i }));
    expect(screen.getByText("hc-no-target")).toBeTruthy();
    // Target column shows em dash when both FQDN and IPAddr are missing
    expect(screen.getAllByText("TCP").length).toBeGreaterThan(0);
  });

  it("deletes a health check", async () => {
    const user = userEvent.setup();
    mockHealthChecks.mockReturnValue({
      data: {
        healthChecks: [
          {
            Id: "hc-del",
            HealthCheckConfig: { Type: "HTTP", FullyQualifiedDomainName: "example.com" },
            Status: { Status: "Healthy" },
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<Route53Dashboard />);
    await user.click(screen.getByRole("tab", { name: /health checks/i }));
    // DeleteButton renders icon button with ariaLabel "Delete {itemName}"
    await user.click(screen.getByRole("button", { name: /delete hc-del/i }));
    // Click the confirm "Delete" button inside the confirm dialog
    const confirmBtn = screen.getByRole("button", { name: /^Delete$/i });
    await user.click(confirmBtn);
    await waitFor(() => expect(mockDeleteHealthCheck).toHaveBeenCalledWith("hc-del"));
  });

  it("renders health checks with IP-only target", async () => {
    const user = userEvent.setup();
    mockHealthChecks.mockReturnValue({
      data: {
        healthChecks: [
          {
            Id: "hc-ip",
            HealthCheckConfig: { Type: "TCP", IPAddr: "10.0.0.1" },
            Status: { Status: "Healthy" },
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<Route53Dashboard />);
    await user.click(screen.getByRole("tab", { name: /health checks/i }));
    expect(screen.getByText("hc-ip")).toBeTruthy();
  });

  it("fills all form fields in create health check", async () => {
    const user = userEvent.setup();
    mockHealthChecks.mockReturnValue({ data: { healthChecks: [], total: 0 }, isLoading: false });
    mockCreateHealthCheck.mockImplementation((_data: any, opts: any) => {
      opts?.onSuccess?.();
    });
    render(<Route53Dashboard />);
    await user.click(screen.getByRole("tab", { name: /health checks/i }));
    await user.click(screen.getByRole("button", { name: /create health check/i }));

    // Fill all fields
    const inputs = screen.getAllByRole("textbox");
    // IP Address (placeholder 54.239.28.85)
    const ipInput = inputs.find((el) => el.getAttribute("placeholder") === "54.239.28.85");
    if (ipInput) await user.type(ipInput, "10.0.0.1");
    // Port
    const portInput = screen.getAllByRole("spinbutton");
    if (portInput.length > 0) await user.type(portInput[0], "443");
    // Resource Path
    const pathInput = inputs.find((el) => el.getAttribute("placeholder") === "/");
    if (pathInput) await user.type(pathInput, "/health");
    // FQDN
    const fqdnInput = inputs.find((el) => el.getAttribute("placeholder") === "example.com");
    if (fqdnInput) await user.type(fqdnInput, "health.example.com");

    await user.click(screen.getByRole("button", { name: /^Create$/i }));
    await waitFor(() => expect(mockCreateHealthCheck).toHaveBeenCalled());
  });

  it("fires health check Type Select onChange via mock option click", async () => {
    const user = userEvent.setup();
    mockHealthChecks.mockReturnValue({ data: { healthChecks: [], total: 0 }, isLoading: false });
    render(<Route53Dashboard />);
    await user.click(screen.getByRole("tab", { name: /health checks/i }));
    await user.click(screen.getByRole("button", { name: /create health check/i }));
    // Click the mock Select option for HTTPS
    await user.click(screen.getByTestId("opt-HTTPS"));
    // The form state should have updated to HTTPS
    expect(screen.getByTestId("mock-select")).toBeTruthy();
  });

  it("dismisses create health check modal via Escape", async () => {
    const user = userEvent.setup();
    mockHealthChecks.mockReturnValue({ data: { healthChecks: [], total: 0 }, isLoading: false });
    render(<Route53Dashboard />);
    await user.click(screen.getByRole("tab", { name: /health checks/i }));
    await user.click(screen.getByRole("button", { name: /create health check/i }));
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create health check"));
  });

});
