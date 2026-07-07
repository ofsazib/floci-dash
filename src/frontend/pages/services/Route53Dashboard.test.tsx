// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockZones = vi.fn();
const mockCreateZone = vi.fn();
const mockDeleteZone = vi.fn();
const mockRecordSets = vi.fn();
const mockCreateRecord = vi.fn();
const mockDeleteRecord = vi.fn();

vi.mock("../../hooks/useRoute53", () => ({
  useRoute53HostedZones: (...args: any[]) => mockZones(...args),
  useCreateRoute53HostedZone: () => ({ mutate: mockCreateZone, isPending: false }),
  useDeleteRoute53HostedZone: () => ({ mutateAsync: mockDeleteZone, isPending: false, variables: null }),
  useRoute53RecordSets: (...args: any[]) => mockRecordSets(...args),
  useCreateRoute53RecordSet: () => ({ mutate: mockCreateRecord, isPending: false }),
  useDeleteRoute53RecordSet: () => ({ mutateAsync: mockDeleteRecord, isPending: false, variables: null }),
}));

import { Route53Dashboard } from "./Route53Dashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockZones.mockReturnValue({ data: { hostedZones: [], total: 0 }, isLoading: false });
  mockRecordSets.mockReturnValue({ data: { recordSets: [], total: 0 }, isLoading: false });
});

describe("Route53Dashboard", () => {
  it("shows loading skeleton", () => {
    mockZones.mockReturnValue({ data: undefined, isLoading: true });
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
      isLoading: false,
    });
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("example.com.")).toBeTruthy();
    expect(screen.getByText("Z123")).toBeTruthy();
    expect(screen.getAllByText("No").length).toBeGreaterThanOrEqual(1);
  });

  it("shows em dash for missing comment", () => {
    mockZones.mockReturnValue({
      data: { hostedZones: [{ Id: "/hostedzone/Z123", Name: "example.com.", ResourceRecordSetCount: 2 }], total: 1 },
      isLoading: false,
    });
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("—")).toBeTruthy();
  });

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

  it("navigates to zone detail view", async () => {
    mockZones.mockReturnValue({
      data: { hostedZones: [{ Id: "/hostedzone/Z456", Name: "test.com.", ResourceRecordSetCount: 2 }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("test.com.")).toBeTruthy());

    await user.click(screen.getByText("View"));
    await waitFor(() => expect(screen.getByText(/Resource Record Sets/i)).toBeTruthy());
  });

  it("shows zones tab and record sets after navigation", async () => {
    mockZones.mockReturnValue({
      data: { hostedZones: [{ Id: "/hostedzone/Z789", Name: "zone.com.", ResourceRecordSetCount: 5 }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    const { container } = render(<Route53Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("zone.com."));
    await user.click(screen.getByText("View"));
    await waitFor(() => expect(container.textContent).toMatch(/Record Sets/i));
  });

  it("deletes a hosted zone", async () => {
    mockZones.mockReturnValue({
      data: { hostedZones: [{ Id: "/hostedzone/Z111", Name: "delete-me.com.", ResourceRecordSetCount: 2 }], total: 1 },
      isLoading: false,
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

  it("filters zones by name", async () => {
    mockZones.mockReturnValue({
      data: {
        hostedZones: [
          { Id: "/hostedzone/Z1", Name: "alpha.com.", ResourceRecordSetCount: 1 },
          { Id: "/hostedzone/Z2", Name: "beta.com.", ResourceRecordSetCount: 2 },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<Route53Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha.com.")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find zones by name");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha.com.")).toBeNull());
  });
});
