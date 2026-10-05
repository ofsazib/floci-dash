// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useBcmCreateEstimate: vi.fn(),
  useBcmGetEstimate: vi.fn(),
  useBcmDeleteEstimate: vi.fn(),
  useBcmCreateUsage: vi.fn(),
}));

vi.mock("../../hooks/useBcmPricingCalculator", () => mockHooks);

const mockCreate = vi.fn();
const mockGet = vi.fn();
const mockDelete = vi.fn();
const mockUsage = vi.fn();

function okMutation(mock: ReturnType<typeof vi.fn>, isPending = false) {
  return { mutateAsync: mock, isPending };
}

const BARE_ESTIMATE = {
  id: "e-2222",
  name: "bare",
  status: "VALID",
  rateType: "BEFORE_DISCOUNTS",
  totalCost: 0,
};
const ESTIMATE = {
  id: "e-1111",
  name: "probe",
  status: "VALID",
  rateType: "BEFORE_DISCOUNTS",
  totalCost: 1.5,
  costCurrency: "USD",
};

import BcmPricingCalculatorDashboard from "./BcmPricingCalculatorDashboard";

function modalDlg(header: string): HTMLElement {
  return screen
    .getAllByText(header)
    .map((t) => t.closest('[role="dialog"]'))
    .find((d) => d) as HTMLElement;
}

function dialogButton(dlg: HTMLElement, text: string): HTMLElement {
  return Array.from(dlg.querySelectorAll("button")).find(
    (b) => b.textContent === text
  ) as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockHooks.useBcmCreateEstimate.mockReturnValue(okMutation(mockCreate));
  mockHooks.useBcmGetEstimate.mockReturnValue(okMutation(mockGet));
  mockHooks.useBcmDeleteEstimate.mockReturnValue(okMutation(mockDelete));
  mockHooks.useBcmCreateUsage.mockReturnValue(okMutation(mockUsage));
});

describe("BcmPricingCalculatorDashboard — estimates", () => {
  it("starts with an empty session list", () => {
    render(<BcmPricingCalculatorDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No workload estimates found")).toBeTruthy();
  });

  it("creates an estimate and adds it to the session list", async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValueOnce({ estimate: ESTIMATE });
    render(<BcmPricingCalculatorDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create workload estimate/i }));
    const dlg = modalDlg("Create workload estimate");
    const dialogInputs = Array.from(dlg.querySelectorAll("input")) as HTMLElement[];
    await user.type(dialogInputs[0], "probe");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith({
        name: "probe",
        rateType: "BEFORE_DISCOUNTS",
      })
    );
    await waitFor(() => expect(screen.getByText("Estimate probe created.")).toBeTruthy());
    await waitFor(() => expect(screen.getByText("probe")).toBeTruthy());
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("does not duplicate an estimate already in the session list", async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValue({ estimate: ESTIMATE });
    render(<BcmPricingCalculatorDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create workload estimate/i }));
    let dlg = modalDlg("Create workload estimate");
    await user.type(dlg.querySelectorAll("input")[0] as HTMLElement, "probe");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() => expect(screen.getByText("probe")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Create workload estimate/i }));
    dlg = modalDlg("Create workload estimate");
    await user.type(dlg.querySelectorAll("input")[0] as HTMLElement, "probe");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(2));
    expect(screen.getAllByText("probe").length).toBe(1);
  });

  it("keeps Create disabled without a name and closes on cancel", async () => {
    const user = userEvent.setup();
    render(<BcmPricingCalculatorDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create workload estimate/i }));
    const dlg = modalDlg("Create workload estimate");
    const createBtn = dialogButton(dlg, "Create") as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
    await user.type(dlg.querySelector("input") as HTMLElement, "x");
    expect(createBtn.disabled).toBe(false);
    await user.click(dialogButton(dlg, "Cancel"));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("shows a fallback error when creation fails", async () => {
    const user = userEvent.setup();
    mockCreate.mockRejectedValueOnce({});
    render(<BcmPricingCalculatorDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create workload estimate/i }));
    const dlg = modalDlg("Create workload estimate");
    await user.type(dlg.querySelector("input") as HTMLElement, "probe");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });

  it("opens an estimate by ID", async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValueOnce({ estimate: BARE_ESTIMATE });
    render(<BcmPricingCalculatorDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Open by ID/i }));
    const dlg = modalDlg("Open estimate by ID");
    const openBtn = dialogButton(dlg, "Open") as HTMLButtonElement;
    expect(openBtn.disabled).toBe(true);
    await user.type(dlg.querySelector("input") as HTMLElement, "e-2222");
    expect(openBtn.disabled).toBe(false);
    await user.click(openBtn);
    await waitFor(() => expect(mockGet).toHaveBeenCalledWith("e-2222"));
    await waitFor(() => expect(screen.getByText("Estimate e-2222 opened.")).toBeTruthy());
    await waitFor(() => expect(screen.getByText("bare")).toBeTruthy());
  });

  it("removes an estimate from the session list after deletion", async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValueOnce({ estimate: ESTIMATE });
    mockDelete.mockResolvedValueOnce({ deleted: true });
    render(<BcmPricingCalculatorDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create workload estimate/i }));
    const dlg = modalDlg("Create workload estimate");
    await user.type(dlg.querySelector("input") as HTMLElement, "probe");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() => expect(screen.getByText("probe")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete e-1111/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Delete$/i }));
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("e-1111"));
    await waitFor(() => expect(screen.queryByText("probe")).toBeNull());
  });
});

describe("BcmPricingCalculatorDashboard — modals and refresh", () => {
  it("refreshes the session list and dismisses the alert", async () => {
    const user = userEvent.setup();
    render(<BcmPricingCalculatorDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Refresh/i }));
    await waitFor(() => expect(screen.getByText("Session list refreshed.")).toBeTruthy());
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByText("Session list refreshed.")).toBeNull()
    );
  });

  it("types the rate type in the create modal and closes on escape", async () => {
    const user = userEvent.setup();
    render(<BcmPricingCalculatorDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create workload estimate/i }));
    const dlg = modalDlg("Create workload estimate");
    const dialogInputs = Array.from(dlg.querySelectorAll("input")) as HTMLElement[];
    expect((dialogInputs[1] as HTMLInputElement).value).toBe("BEFORE_DISCOUNTS");
    await user.type(dialogInputs[1], "S");
    expect((dialogInputs[1] as HTMLInputElement).value).toBe("BEFORE_DISCOUNTSS");
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("cancels the open-by-ID modal and closes on escape", async () => {
    const user = userEvent.setup();
    render(<BcmPricingCalculatorDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Open by ID/i }));
    const dlg = modalDlg("Open estimate by ID");
    await user.click(dialogButton(dlg, "Cancel"));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
    await user.click(screen.getByRole("button", { name: /Open by ID/i }));
    const dlg2 = modalDlg("Open estimate by ID");
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg2.className).toContain("hidden"));
  });

  it("edits the amount input", async () => {
    const user = userEvent.setup();
    render(<BcmPricingCalculatorDashboard />, { wrapper: createWrapper() });
    const amountInput = screen
      .getAllByRole("textbox")
      .find((el) => (el as HTMLInputElement).value === "1") as HTMLElement;
    await user.clear(amountInput);
    await user.type(amountInput, "5");
    expect((amountInput as HTMLInputElement).value).toBe("5");
  });
});

describe("BcmPricingCalculatorDashboard — usage", () => {
  function fillUsage(user: ReturnType<typeof userEvent.setup>) {
    return user.type(screen.getByPlaceholderText("AmazonEC2"), "AmazonEC2");
  }

  async function createTarget(user: ReturnType<typeof userEvent.setup>) {
    mockCreate.mockResolvedValueOnce({ estimate: ESTIMATE });
    await user.click(screen.getByRole("button", { name: /Create workload estimate/i }));
    const dlg = modalDlg("Create workload estimate");
    await user.type(dlg.querySelector("input") as HTMLElement, "probe");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() => expect(screen.getByText("probe")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Set as usage target/i }));
    await waitFor(() => expect(screen.getByText(/Target estimate: e-1111/)).toBeTruthy());
  }

  it("disables Add usage until a target and fields are set", async () => {
    const user = userEvent.setup();
    render(<BcmPricingCalculatorDashboard />, { wrapper: createWrapper() });
    const addBtn = screen.getByRole("button", { name: /Add usage/i }) as HTMLButtonElement;
    expect(addBtn.disabled).toBe(true);
    await fillUsage(user);
    await user.type(screen.getByPlaceholderText("BoxUsage:t3.micro"), "t");
    await user.type(screen.getByPlaceholderText("RunInstances"), "r");
    expect(addBtn.disabled).toBe(true);
    await createTarget(user);
    expect(addBtn.disabled).toBe(false);
  });

  it("submits usage and surfaces batch errors", async () => {
    const user = userEvent.setup();
    mockUsage.mockResolvedValueOnce({
      items: [],
      errors: [{ errorCode: "BAD_REQUEST", errorMessage: "no pricing" }],
    });
    render(<BcmPricingCalculatorDashboard />, { wrapper: createWrapper() });
    await createTarget(user);
    await fillUsage(user);
    await user.type(screen.getByPlaceholderText("BoxUsage:t3.micro"), "t");
    await user.type(screen.getByPlaceholderText("RunInstances"), "r");
    const amountInput = screen
      .getAllByRole("textbox")
      .find((el) => (el as HTMLInputElement).value === "1") as HTMLElement;
    await user.clear(amountInput);
    await user.click(screen.getByRole("button", { name: /Add usage/i }));
    await waitFor(() =>
      expect(mockUsage).toHaveBeenCalledWith({
        workloadEstimateId: "e-1111",
        usage: [
          {
            serviceCode: "AmazonEC2",
            usageType: "t",
            operation: "r",
            usageAccountId: "000000000000",
            amount: 1,
          },
        ],
      })
    );
    await waitFor(() =>
      expect(screen.getByText(/entry: BAD_REQUEST — no pricing/)).toBeTruthy()
    );
  });

  it("renders no error alert when the batch result omits errors", async () => {
    const user = userEvent.setup();
    mockUsage.mockResolvedValueOnce({ items: [] } as any);
    render(<BcmPricingCalculatorDashboard />, { wrapper: createWrapper() });
    await createTarget(user);
    await fillUsage(user);
    await user.type(screen.getByPlaceholderText("BoxUsage:t3.micro"), "t");
    await user.type(screen.getByPlaceholderText("RunInstances"), "r");
    await user.click(screen.getByRole("button", { name: /Add usage/i }));
    await waitFor(() => expect(mockUsage).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.queryByText(/BAD_REQUEST/)).toBeNull()
    );
  });

  it("shows a fallback error when the usage batch fails", async () => {
    const user = userEvent.setup();
    mockUsage.mockRejectedValueOnce({});
    render(<BcmPricingCalculatorDashboard />, { wrapper: createWrapper() });
    await createTarget(user);
    await fillUsage(user);
    await user.type(screen.getByPlaceholderText("BoxUsage:t3.micro"), "t");
    await user.type(screen.getByPlaceholderText("RunInstances"), "r");
    await user.click(screen.getByRole("button", { name: /Add usage/i }));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });
});
