// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

/** Fire Escape on every mounted Cloudscape dialog (fires onDismiss). */
function dismissModalWithEscape() {
  document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
    fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27, key: "Escape" });
  });
}

/** Assert the modal with the given header text is hidden (Cloudscape uses display:none). */
function expectModalHidden(headerText: string) {
  const header = screen.getAllByText(headerText).find((h) => h.closest('[role="dialog"]'));
  const dialog = header!.closest('[role="dialog"]') as HTMLElement;
  expect(dialog.className).toContain("hidden");
}

const mockQuotas = vi.fn();
const mockIncreaseMutate: any = vi.fn(() => Promise.resolve({}));

vi.mock("../../hooks/useServiceQuotas", () => ({
  useServiceQuotas: (...args: any[]) => mockQuotas(...args),
  useRequestServiceQuotaIncrease: () => ({ mutateAsync: mockIncreaseMutate, isPending: false }),
}));

import { ServiceQuotasDashboard } from "./ServiceQuotasDashboard";

const quotaRow = {
  serviceCode: "lambda",
  serviceName: "AWS Lambda",
  quotaCode: "L-B99A9384",
  quotaName: "Concurrent executions",
  value: 5000,
  unit: "None",
  adjustable: true,
  globalQuota: false,
  quotaAppliedAtLevel: "ACCOUNT",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockIncreaseMutate.mockImplementation(() => Promise.resolve({}));
  mockQuotas.mockReturnValue({ data: undefined, isLoading: false });
});

describe("ServiceQuotasDashboard", () => {
  it("renders the Service Quotas header", () => {
    render(<ServiceQuotasDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Service Quotas")).toBeTruthy();
  });

  it("shows empty message when no quotas", () => {
    mockQuotas.mockReturnValue({ data: { quotas: [], total: 0 }, isLoading: false });
    render(<ServiceQuotasDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No quotas found for service code/)).toBeTruthy();
  });

  it("loads a new service code and renders quota rows", async () => {
    mockQuotas.mockReturnValue({
      data: { quotas: [quotaRow], total: 1, defaults: false },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ServiceQuotasDashboard />, { wrapper: createWrapper() });
    await user.clear(screen.getByLabelText("Service code"));
    await user.type(screen.getByLabelText("Service code"), "ec2");
    await user.click(screen.getByRole("button", { name: "Load quotas" }));
    await waitFor(() => expect(mockQuotas).toHaveBeenCalledWith("ec2", false));
    expect(await screen.findByText("Concurrent executions")).toBeTruthy();
    expect(screen.getByText("L-B99A9384")).toBeTruthy();
    expect(screen.getByText("5000 None".trim())).toBeTruthy();
  });

  it("switches to AWS default quotas tab", async () => {
    mockQuotas.mockReturnValue({
      data: { quotas: [quotaRow], total: 1, defaults: true },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ServiceQuotasDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /AWS default quotas/ }));
    await waitFor(() => expect(mockQuotas).toHaveBeenCalledWith("lambda", true));
    expect(screen.getByText(/Quotas for lambda \(defaults\)/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Request increase" })).toBeNull();
  });

  it("opens the increase modal and submits from the applied tab", async () => {
    mockQuotas.mockReturnValue({
      data: { quotas: [quotaRow], total: 1, defaults: false },
      isLoading: false,
    });
    mockIncreaseMutate.mockImplementation(() =>
      Promise.resolve({
        requestedQuota: { quotaName: "Concurrent executions", desiredValue: 10000, status: "PENDING" },
      })
    );
    const user = userEvent.setup();
    render(<ServiceQuotasDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Request increase" }));
    await user.type(screen.getByLabelText("Desired value"), "10000");
    await user.click(screen.getByRole("button", { name: "Submit request" }));
    await waitFor(() =>
      expect(mockIncreaseMutate).toHaveBeenCalledWith({
        serviceCode: "lambda",
        quotaCode: "L-B99A9384",
        desiredValue: 10000,
      })
    );
    expect(await screen.findByText(/status: PENDING/)).toBeTruthy();
  });

  it("shows an error alert when the increase API fails", async () => {
    mockQuotas.mockReturnValue({
      data: { quotas: [quotaRow], total: 1, defaults: false },
      isLoading: false,
    });
    mockIncreaseMutate.mockRejectedValue(new Error("increase failed"));
    const user = userEvent.setup();
    render(<ServiceQuotasDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Request increase" }));
    await user.type(screen.getByLabelText("Desired value"), "20000");
    await user.click(screen.getByRole("button", { name: "Submit request" }));
    expect(await screen.findByText("increase failed")).toBeTruthy();
  });

  it("rejects a non-numeric desired value without calling the API", async () => {
    mockQuotas.mockReturnValue({
      data: { quotas: [quotaRow], total: 1, defaults: false },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ServiceQuotasDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Request increase" }));
    await user.type(screen.getByLabelText("Desired value"), "abc");
    await user.click(screen.getByRole("button", { name: "Submit request" }));
    expect(await screen.findByText("Desired value must be a number")).toBeTruthy();
    expect(mockIncreaseMutate).not.toHaveBeenCalled();
  });

  it("ignores an empty service code when loading", async () => {
    const user = userEvent.setup();
    render(<ServiceQuotasDashboard />, { wrapper: createWrapper() });
    const input = screen.getByLabelText("Service code");
    await user.clear(input);
    await user.click(screen.getByRole("button", { name: "Load quotas" }));
    // empty code → no refetch; only the default "lambda" query is ever issued
    expect(mockQuotas.mock.calls.map((c) => c[0]).filter((c) => c !== "lambda")).toEqual([]);
  });

  it("loads a service code when Enter is pressed in the input", async () => {
    mockQuotas.mockClear();
    const user = userEvent.setup();
    render(<ServiceQuotasDashboard />, { wrapper: createWrapper() });
    const input = screen.getByLabelText("Service code");
    await user.clear(input);
    await user.type(input, "sqs");
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(mockQuotas).toHaveBeenCalledWith("sqs", false));
  });

  it("filters the quota table by name or code", async () => {
    mockQuotas.mockReturnValue({
      data: { quotas: [quotaRow, { ...quotaRow, quotaName: "VPC resources", quotaCode: "L-12345678" }], total: 2 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ServiceQuotasDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("Find quotas by name or code"), "Concurrent");
    expect(await screen.findByText("Concurrent executions")).toBeTruthy();
    expect(screen.queryByText("VPC resources")).toBeNull();
  });

  it("dismisses the success alert after a submitted increase", async () => {
    mockQuotas.mockReturnValue({
      data: { quotas: [quotaRow], total: 1, defaults: false },
      isLoading: false,
    });
    mockIncreaseMutate.mockImplementation(() =>
      Promise.resolve({
        requestedQuota: { quotaName: "Concurrent executions", desiredValue: 10000, status: "PENDING" },
      })
    );
    const user = userEvent.setup();
    render(<ServiceQuotasDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Request increase" }));
    await user.type(screen.getByLabelText("Desired value"), "10000");
    await user.click(screen.getByRole("button", { name: "Submit request" }));
    expect(await screen.findByText(/status: PENDING/)).toBeTruthy();
    fireEvent.click(document.querySelector("[class*='awsui_dismiss-button']") as HTMLElement);
    await waitFor(() => expect(screen.queryByText(/status: PENDING/)).toBeNull());
  });

  it("dismisses the increase modal without submitting", async () => {
    mockQuotas.mockReturnValue({
      data: { quotas: [quotaRow], total: 1, defaults: false },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ServiceQuotasDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Request increase" }));
    dismissModalWithEscape();
    expectModalHidden("Request quota increase");
    expect(mockIncreaseMutate).not.toHaveBeenCalled();
  });
});
