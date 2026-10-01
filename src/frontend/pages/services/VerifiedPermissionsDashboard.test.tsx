// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useVpStores: vi.fn(),
  useCreateVpStore: vi.fn(),
  useDeleteVpStore: vi.fn(),
  useVpPolicies: vi.fn(),
  useCreateVpPolicy: vi.fn(),
  useDeleteVpPolicy: vi.fn(),
  useVpIdentitySources: vi.fn(),
  useCreateVpIdentitySource: vi.fn(),
  useDeleteVpIdentitySource: vi.fn(),
  useVpIsAuthorized: vi.fn(),
}));

vi.mock("../../hooks/useVerifiedPermissions", () => mockHooks);

const mockApi = vi.hoisted(() => vi.fn());
vi.mock("../../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

const mockCreateStore = vi.fn();
const mockDeleteStore = vi.fn();
const mockCreatePolicy = vi.fn();
const mockDeletePolicy = vi.fn();
const mockEvaluate = vi.fn();

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

const STORE = { policyStoreId: "Ps-1", arn: "arn:vp:store/Ps-1" };
const POLICY = {
  policyId: "p1",
  definition: { static: { statement: "permit(principal, action, resource);" } },
};

import VerifiedPermissionsDashboard from "./VerifiedPermissionsDashboard";

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
  mockHooks.useVpStores.mockReturnValue(listQuery("stores", [STORE]));
  mockHooks.useVpPolicies.mockReturnValue(listQuery("policies", [POLICY]));
  mockHooks.useVpIdentitySources.mockReturnValue({
    data: { identitySources: [], total: 0 },
    isLoading: false,
  });
  mockHooks.useCreateVpStore.mockReturnValue(okMutation(mockCreateStore));
  mockHooks.useDeleteVpStore.mockReturnValue(okMutation(mockDeleteStore));
  mockHooks.useCreateVpPolicy.mockReturnValue(okMutation(mockCreatePolicy));
  mockHooks.useDeleteVpPolicy.mockReturnValue(okMutation(mockDeletePolicy));
  mockHooks.useVpIsAuthorized.mockReturnValue(okMutation(mockEvaluate));
});

describe("VerifiedPermissionsDashboard — stores list", () => {
  it("renders policy stores", async () => {
    render(<VerifiedPermissionsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("Ps-1")).toBeTruthy());
  });

  it("shows the empty table message", () => {
    mockHooks.useVpStores.mockReturnValue(listQuery("stores", []));
    render(<VerifiedPermissionsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No policy stores found")).toBeTruthy();
  });

  it("renders with undefined data (loading)", () => {
    mockHooks.useVpStores.mockReturnValue(listQuery("stores", [], { data: undefined }));
    render(<VerifiedPermissionsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Policy stores")).toBeTruthy();
  });

  it("shows the error alert with fallback message", () => {
    mockHooks.useVpStores.mockReturnValue(listQuery("stores", [], { isError: true, error: null }));
    render(<VerifiedPermissionsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load policy stores")).toBeTruthy();
  });

  it("creates a policy store and dismisses the success alert", async () => {
    const user = userEvent.setup();
    mockCreateStore.mockResolvedValueOnce({ store: {} });
    render(<VerifiedPermissionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create policy store/i }));
    await user.type(screen.getByPlaceholderText("app-store"), "app");
    await user.click(screen.getByRole("button", { name: /^Create$/i }));
    await waitFor(() =>
      expect(mockCreateStore).toHaveBeenCalledWith({
        name: "app",
        validationSettings: { mode: "OFF" },
      })
    );
    await waitFor(() =>
      expect(screen.getByText("Policy store app created.")).toBeTruthy()
    );
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByText("Policy store app created.")).toBeNull()
    );
  });

  it("shows a fallback error when store creation fails", async () => {
    const user = userEvent.setup();
    mockCreateStore.mockRejectedValueOnce({});
    render(<VerifiedPermissionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create policy store/i }));
    await user.type(screen.getByPlaceholderText("app-store"), "app");
    await user.click(screen.getByRole("button", { name: /^Create$/i }));
    await waitFor(() =>
      expect(screen.getByText("Failed to create policy store")).toBeTruthy()
    );
  });

  it("keeps Create disabled until a name is typed and closes on Cancel", async () => {
    const user = userEvent.setup();
    render(<VerifiedPermissionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create policy store/i }));
    const dlg = modalDlg("Create policy store");
    const createBtn = dialogButton(dlg, "Create") as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
    await user.type(dlg.querySelector("input") as HTMLElement, "x");
    expect(createBtn.disabled).toBe(false);
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[1] as HTMLElement, "2");
    await user.click(dialogButton(dlg, "Cancel"));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
    // Escape fires the modal onDismiss (vs Cancel's direct setter)
    await user.click(screen.getByRole("button", { name: /Create policy store/i }));
    const dlg2 = modalDlg("Create policy store");
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg2.className).toContain("hidden"));
  });

  it("deletes a store after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteStore.mockResolvedValueOnce({ ok: true });
    render(<VerifiedPermissionsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("Ps-1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete Ps-1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteStore).toHaveBeenCalledWith("Ps-1"));
  });
});

describe("VerifiedPermissionsDashboard — store detail", () => {
  function openDetail() {
    render(<VerifiedPermissionsDashboard />, { wrapper: createWrapper() });
    return userEvent
      .setup()
      .click(screen.getByRole("button", { name: /^View$/i }));
  }

  it("lists policies and navigates back", async () => {
    const user = userEvent.setup();
    await openDetail();
    await waitFor(() => expect(screen.getByText("Back to policy stores")).toBeTruthy());
    await waitFor(() => expect(screen.getByText("p1")).toBeTruthy());
    expect(screen.getByText(POLICY.definition.static.statement)).toBeTruthy();
    await user.click(screen.getByText("Back to policy stores"));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Create policy store/i })).toBeTruthy()
    );
  });

  it("shows the empty policies message", async () => {
    const user = userEvent.setup();
    mockHooks.useVpPolicies.mockReturnValue(listQuery("policies", []));
    render(<VerifiedPermissionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await waitFor(() => expect(screen.getByText("No policies found")).toBeTruthy());
  });

  it("renders undefined policies data and sparse rows", async () => {
    const user = userEvent.setup();
    mockHooks.useVpPolicies.mockReturnValue({ data: undefined, isLoading: false });
    render(<VerifiedPermissionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: /^Policies \(0\)/ })).toBeTruthy()
    );
    mockHooks.useVpPolicies.mockReturnValue(
      listQuery("policies", [{ policyId: "p2" }])
    );
    render(<VerifiedPermissionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await waitFor(() => expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1));
  });

  it("creates a policy and dismisses the success alert", async () => {
    const user = userEvent.setup();
    mockCreatePolicy.mockResolvedValueOnce({ policy: {} });
    await openDetail();
    await waitFor(() => expect(screen.getByRole("button", { name: /Create policy/i })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Create policy/i }));
    const dlg = modalDlg("Create policy");
    await user.type(dlg.querySelector('input[placeholder="view-permit"]') as HTMLElement, "permit");
    await user.type(
      dlg.querySelector("textarea") as HTMLElement,
      "permit(principal, action, resource);"
    );
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() =>
      expect(mockCreatePolicy).toHaveBeenCalledWith({
        storeId: "Ps-1",
        name: "permit",
        statement: "permit(principal, action, resource);",
      })
    );
    await waitFor(() => expect(screen.getByText("Policy created.")).toBeTruthy());
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() => expect(screen.queryByText("Policy created.")).toBeNull());
  });

  it("shows a fallback error when policy creation fails", async () => {
    const user = userEvent.setup();
    mockCreatePolicy.mockRejectedValueOnce({});
    await openDetail();
    await user.click(screen.getByRole("button", { name: /Create policy/i }));
    const dlg = modalDlg("Create policy");
    await user.type(dlg.querySelector('input[placeholder="view-permit"]') as HTMLElement, "p");
    await user.type(dlg.querySelector("textarea") as HTMLElement, "permit;");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() => expect(screen.getByText("Failed to create policy")).toBeTruthy());
  });

  it("keeps policy Create disabled until name and statement are filled and closes via Cancel and Escape", async () => {
    const user = userEvent.setup();
    await openDetail();
    await user.click(screen.getByRole("button", { name: /Create policy/i }));
    const dlg = modalDlg("Create policy");
    const createBtn = dialogButton(dlg, "Create") as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
    await user.type(dlg.querySelector('input[placeholder="view-permit"]') as HTMLElement, "p");
    await user.type(dlg.querySelector("textarea") as HTMLElement, "s");
    expect(createBtn.disabled).toBe(false);
    await user.click(dialogButton(dlg, "Cancel"));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
    await user.click(screen.getByRole("button", { name: /Create policy/i }));
    const dlg2 = modalDlg("Create policy");
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg2.className).toContain("hidden"));
  });

  it("deletes a policy after confirmation", async () => {
    const user = userEvent.setup();
    mockDeletePolicy.mockResolvedValueOnce({ ok: true });
    await openDetail();
    await waitFor(() => expect(screen.getByText("p1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete p1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() =>
      expect(mockDeletePolicy).toHaveBeenCalledWith({ storeId: "Ps-1", policyId: "p1" })
    );
  });

  it("evaluates authorization and shows ALLOW with determining policies", async () => {
    const user = userEvent.setup();
    mockEvaluate.mockResolvedValueOnce({
      decision: "ALLOW",
      determiningPolicies: [{ policyId: "p1" }],
      errors: [],
    });
    await openDetail();
    await user.click(screen.getByRole("tab", { name: /Authorization console/i }));
    const consoleInputs = screen
      .getAllByRole("textbox")
      .filter((el) => (el as HTMLInputElement).type !== "textarea");
    await user.type(consoleInputs[0] as HTMLElement, "2");
    await user.type(consoleInputs[1] as HTMLElement, "edit");
    await user.type(consoleInputs[2] as HTMLElement, "doc9");
    await user.click(screen.getByRole("button", { name: /Evaluate/i }));
    await waitFor(() => expect(screen.getByText("ALLOW")).toBeTruthy());
    expect(mockEvaluate).toHaveBeenCalledWith({
      storeId: "Ps-1",
      principal: "alice2",
      action: "viewedit",
      resource: "doc1doc9",
    });
    expect(screen.getByText(/Determining policies: p1/)).toBeTruthy();
  });

  it("shows DENY and clears the decision between evaluations", async () => {
    const user = userEvent.setup();
    mockEvaluate
      .mockResolvedValueOnce({ decision: "ALLOW", determiningPolicies: [], errors: [] })
      .mockResolvedValueOnce({ decision: "DENY", determiningPolicies: [], errors: [] });
    await openDetail();
    await user.click(screen.getByRole("tab", { name: /Authorization console/i }));
    await user.click(screen.getByRole("button", { name: /Evaluate/i }));
    await waitFor(() => expect(screen.getByText("ALLOW")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Evaluate/i }));
    await waitFor(() => expect(screen.getByText("DENY")).toBeTruthy());
  });

  it("shows a fallback error when evaluation fails", async () => {
    const user = userEvent.setup();
    mockEvaluate.mockRejectedValueOnce({});
    await openDetail();
    await user.click(screen.getByRole("tab", { name: /Authorization console/i }));
    await user.click(screen.getByRole("button", { name: /Evaluate/i }));
    await waitFor(() => expect(screen.getByText("Evaluation failed")).toBeTruthy());
  });
});
