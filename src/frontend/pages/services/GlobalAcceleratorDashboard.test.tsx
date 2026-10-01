// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useGaAccelerators: vi.fn(),
  useCreateGaAccelerator: vi.fn(),
  useDeleteGaAccelerator: vi.fn(),
  useGaListeners: vi.fn(),
  useCreateGaListener: vi.fn(),
  useDeleteGaListener: vi.fn(),
  useGaEndpointGroups: vi.fn(),
  useCreateGaEndpointGroup: vi.fn(),
  useDeleteGaEndpointGroup: vi.fn(),
}));

vi.mock("../../hooks/useGlobalAccelerator", () => mockHooks);

const mockCreateAcc = vi.fn();
const mockDeleteAcc = vi.fn();
const mockCreateListener = vi.fn();
const mockDeleteListener = vi.fn();
const mockCreateGroup = vi.fn();
const mockDeleteGroup = vi.fn();

function okMutation(mock: ReturnType<typeof vi.fn>, isPending = false) {
  return { mutateAsync: mock, isPending };
}

function listQuery(key: string, items: unknown[], overrides: Record<string, unknown> = {}) {
  return {
    data: { [key]: items, total: items.length },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

const ACC = {
  AcceleratorArn: "arn:aws:globalaccelerator::1:accelerator/abc",
  Name: "acc1",
  IpAddressType: "IPV4",
  Enabled: true,
  Status: "DEPLOYED",
  DnsName: "abc.awsglobalaccelerator.com",
};
const LISTENER = {
  ListenerArn: "arn:aws:globalaccelerator::1:listener/abc/def",
  PortRanges: [{ FromPort: 80, ToPort: 80 }],
  Protocol: "TCP",
};
const GROUP = {
  EndpointGroupArn: "arn:aws:globalaccelerator::1:endpointgroup/abc/def/ghi",
  EndpointGroupRegion: "us-east-1",
  TrafficDialPercentage: 100,
};

import GlobalAcceleratorDashboard from "./GlobalAcceleratorDashboard";

function dialogButton(dlg: HTMLElement, text: string): HTMLElement {
  return Array.from(dlg.querySelectorAll("button")).find(
    (b) => b.textContent === text
  ) as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockHooks.useGaAccelerators.mockReturnValue(listQuery("accelerators", [ACC]));
  mockHooks.useGaListeners.mockReturnValue(listQuery("listeners", [LISTENER]));
  mockHooks.useGaEndpointGroups.mockReturnValue(listQuery("endpointGroups", [GROUP]));
  mockHooks.useCreateGaAccelerator.mockReturnValue(okMutation(mockCreateAcc));
  mockHooks.useDeleteGaAccelerator.mockReturnValue(okMutation(mockDeleteAcc));
  mockHooks.useCreateGaListener.mockReturnValue(okMutation(mockCreateListener));
  mockHooks.useDeleteGaListener.mockReturnValue(okMutation(mockDeleteListener));
  mockHooks.useCreateGaEndpointGroup.mockReturnValue(okMutation(mockCreateGroup));
  mockHooks.useDeleteGaEndpointGroup.mockReturnValue(okMutation(mockDeleteGroup));
});

describe("GlobalAcceleratorDashboard — accelerators list", () => {
  it("renders accelerators with fields", async () => {
    render(<GlobalAcceleratorDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("acc1")).toBeTruthy());
    expect(screen.getByText("DEPLOYED")).toBeTruthy();
    expect(screen.getByText(ACC.DnsName)).toBeTruthy();
  });

  it("shows the empty table message", () => {
    mockHooks.useGaAccelerators.mockReturnValue(listQuery("accelerators", []));
    render(<GlobalAcceleratorDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No accelerators found")).toBeTruthy();
  });

  it("renders with undefined data (loading)", () => {
    mockHooks.useGaAccelerators.mockReturnValue(
      listQuery("accelerators", [], { data: undefined, isLoading: true })
    );
    render(<GlobalAcceleratorDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Accelerators")).toBeTruthy();
  });

  it("shows the error alert with fallback message", () => {
    mockHooks.useGaAccelerators.mockReturnValue(
      listQuery("accelerators", [], { isError: true, error: null })
    );
    render(<GlobalAcceleratorDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load accelerators")).toBeTruthy();
  });

  it("creates an accelerator and dismisses the success alert", async () => {
    const user = userEvent.setup();
    mockCreateAcc.mockResolvedValueOnce({ accelerator: {} });
    render(<GlobalAcceleratorDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create accelerator/i }));
    await user.type(screen.getByPlaceholderText("my-accelerator"), "acc2");
    await user.click(screen.getByRole("button", { name: /^Create$/i }));
    await waitFor(() =>
      expect(mockCreateAcc).toHaveBeenCalledWith({ name: "acc2", enabled: true })
    );
    await waitFor(() =>
      expect(screen.getByText("Accelerator acc2 created.")).toBeTruthy()
    );
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByText("Accelerator acc2 created.")).toBeNull()
    );
  });

  it("shows a fallback error when accelerator creation fails", async () => {
    const user = userEvent.setup();
    mockCreateAcc.mockRejectedValueOnce({});
    render(<GlobalAcceleratorDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create accelerator/i }));
    await user.type(screen.getByPlaceholderText("my-accelerator"), "acc2");
    await user.click(screen.getByRole("button", { name: /^Create$/i }));
    await waitFor(() =>
      expect(screen.getByText("Failed to create accelerator")).toBeTruthy()
    );
  });

  it("keeps Create disabled until a name is typed and closes on Cancel", async () => {
    const user = userEvent.setup();
    render(<GlobalAcceleratorDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create accelerator/i }));
    const dlg = screen
      .getAllByText("Name")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    const createBtn = Array.from(dlg.querySelectorAll("button")).find(
      (b) => b.textContent === "Create"
    ) as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
    await user.type(dlg.querySelector("input") as HTMLElement, "x");
    expect(createBtn.disabled).toBe(false);
    const cancelBtn = Array.from(dlg.querySelectorAll("button")).find(
      (b) => b.textContent === "Cancel"
    ) as HTMLElement;
    await user.click(cancelBtn);
    await waitFor(() => expect(dlg.className).toContain("hidden"));
    await user.click(screen.getByRole("button", { name: /Create accelerator/i }));
    const dlg2 = screen
      .getAllByText("Name")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg2.className).toContain("hidden"));
  });

  it("deletes an accelerator after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteAcc.mockResolvedValueOnce({ ok: true });
    render(<GlobalAcceleratorDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("acc1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete acc1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteAcc).toHaveBeenCalledWith(ACC.AcceleratorArn));
  });
});

describe("GlobalAcceleratorDashboard — listener detail", () => {
  function openDetail() {
    render(<GlobalAcceleratorDashboard />, { wrapper: createWrapper() });
  }

  it("drills into listeners and navigates back", async () => {
    const user = userEvent.setup();
    openDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await waitFor(() => expect(screen.getByText("Back to accelerators")).toBeTruthy());
    await waitFor(() => expect(screen.getByText("80-80")).toBeTruthy());
    await user.click(screen.getByText("Back to accelerators"));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Create accelerator/i })).toBeTruthy()
    );
  });

  it("creates a listener", async () => {
    const user = userEvent.setup();
    mockCreateListener.mockResolvedValueOnce({ listener: {} });
    openDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("button", { name: /Create listener/i }));
    const dlg = screen
      .getAllByText("From port")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    const inputs = dlg.querySelectorAll("input");
    await user.clear(inputs[0] as HTMLElement);
    await user.clear(inputs[1] as HTMLElement);
    await user.type(inputs[0] as HTMLElement, "443");
    await user.type(inputs[1] as HTMLElement, "443");
    await user.click(
      Array.from(dlg.querySelectorAll("button")).find((b) => b.textContent === "Create") as HTMLElement
    );
    await waitFor(() =>
      expect(mockCreateListener).toHaveBeenCalledWith({
        acceleratorArn: ACC.AcceleratorArn,
        portRanges: [{ FromPort: 443, ToPort: 443 }],
      })
    );
  });

  it("shows a listener-created success alert", async () => {
    const user = userEvent.setup();
    mockCreateListener.mockResolvedValueOnce({ listener: {} });
    openDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("button", { name: /Create listener/i }));
    const dlg = screen
      .getAllByText("From port")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    const inputs = dlg.querySelectorAll("input");
    await user.clear(inputs[0] as HTMLElement);
    await user.clear(inputs[1] as HTMLElement);
    await user.type(inputs[0] as HTMLElement, "8");
    await user.type(inputs[1] as HTMLElement, "8");
    await user.click(
      Array.from(dlg.querySelectorAll("button")).find((b) => b.textContent === "Create") as HTMLElement
    );
    await waitFor(() => expect(screen.getByText("Listener created.")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Create listener/i }));
    const dlg2 = screen
      .getAllByText("From port")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    await user.click(
      Array.from(dlg2.querySelectorAll("button")).find((b) => b.textContent === "Cancel") as HTMLElement
    );
    await waitFor(() => expect(dlg2.className).toContain("hidden"));
  });

  it("deletes a listener after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteListener.mockResolvedValueOnce({ ok: true });
    openDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await waitFor(() => expect(screen.getByText("80-80")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete arn:aws:globalaccelerator::1:listener\/abc\/def/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteListener).toHaveBeenCalledWith(LISTENER.ListenerArn));
    await waitFor(() => expect(screen.getByText("Listener deleted.")).toBeTruthy());
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() => expect(screen.queryByText("Listener deleted.")).toBeNull());
  });

  it("opens endpoint groups panel, creates and deletes a group", async () => {
    const user = userEvent.setup();
    mockCreateGroup.mockResolvedValueOnce({ endpointGroup: {} });
    mockDeleteGroup.mockResolvedValueOnce({ ok: true });
    openDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("button", { name: /^Endpoint groups$/i }));
    await waitFor(() => expect(screen.getByText("us-east-1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Create endpoint group/i }));
    const dlg = screen
      .getAllByText("Region")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    const input = dlg.querySelector("input") as HTMLInputElement;
    await user.clear(input);
    await user.type(input, "eu-west-1");
    await user.click(dialogButton(dlg, "Cancel"));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
    await user.click(screen.getByRole("button", { name: /Create endpoint group/i }));
    const dlg2 = screen
      .getAllByText("Region")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    await user.type(dlg2.querySelector("input") as HTMLElement, "2");
    await user.click(dialogButton(dlg2, "Create"));
    await waitFor(() =>
      expect(mockCreateGroup).toHaveBeenCalledWith({
        listenerArn: LISTENER.ListenerArn,
        endpointGroupRegion: "eu-west-12",
      })
    );
    await waitFor(() => expect(screen.getByText("Endpoint group created.")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Create endpoint group/i }));
    const dlg3 = screen
      .getAllByText("Region")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg3.className).toContain("hidden"));
    await user.click(screen.getByRole("button", { name: /Delete arn:aws:globalaccelerator::1:endpointgroup/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteGroup).toHaveBeenCalledWith(GROUP.EndpointGroupArn));
  });

  it("renders undefined listeners/groups data and sparse rows", async () => {
    const user = userEvent.setup();
    mockHooks.useGaListeners.mockReturnValue({ data: undefined, isLoading: false });
    mockHooks.useGaEndpointGroups.mockReturnValue({ data: undefined, isLoading: false });
    openDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await waitFor(() => expect(screen.getByRole("tab", { name: /^Listeners \(0\)/ })).toBeTruthy());
    await waitFor(() => expect(screen.getByText("No listeners found")).toBeTruthy());
  });

  it("renders empty endpoint groups when their query data is undefined", async () => {
    const user = userEvent.setup();
    mockHooks.useGaEndpointGroups.mockReturnValue({ data: undefined, isLoading: false });
    openDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("button", { name: /^Endpoint groups$/i }));
    await waitFor(() => expect(screen.getByText("No endpoint groups found")).toBeTruthy());
  });

  it("renders dash arms for listeners without portRanges and groups without dial", async () => {
    const user = userEvent.setup();
    mockHooks.useGaListeners.mockReturnValue(
      listQuery("listeners", [{ ListenerArn: "arn:l2" }])
    );
    mockHooks.useGaEndpointGroups.mockReturnValue(
      listQuery("endpointGroups", [{ EndpointGroupArn: "arn:g2" }])
    );
    openDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await waitFor(() => expect(screen.getByText("arn:l2")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Endpoint groups$/i }));
    await waitFor(() => expect(screen.getByText("arn:g2")).toBeTruthy());
    expect(screen.getByText("—%")).toBeTruthy();
  });

  it("closes the endpoint groups panel", async () => {
    const user = userEvent.setup();
    openDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("button", { name: /^Endpoint groups$/i }));
    await waitFor(() => expect(screen.getAllByText("Endpoint groups").length).toBeGreaterThanOrEqual(1));
    await user.click(screen.getAllByRole("button", { name: /^Close$/i })[0]);
    await waitFor(() =>
      expect(screen.queryByText("No endpoint groups found")).toBeNull()
    );
  });
});
