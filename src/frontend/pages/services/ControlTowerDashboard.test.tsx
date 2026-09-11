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

/** The topmost visible Cloudscape dialog (dismissed dialogs stay mounted with an awsui_hidden_* ancestor). */
function openDialog(): HTMLElement {
  const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[class*="awsui_dialog"]'));
  const open = dialogs.filter((d) => !d.closest('[class*="awsui_hidden"]'));
  if (!open.length) throw new Error("No open dialog");
  return open[open.length - 1];
}

/** Click a named button inside the topmost visible dialog. */
async function clickInDialog(user: any, name: string) {
  await user.click(
    Array.from(openDialog().querySelectorAll("button")).find((b) => b.textContent?.trim() === name)!
  );
}

/** First <textarea> inside the topmost visible dialog. */
function textareaInDialog(): HTMLTextAreaElement {
  return Array.from(openDialog().querySelectorAll("textarea"))[0] as HTMLTextAreaElement;
}

const mockLandingZones = vi.fn();
const mockOperations = vi.fn();
const mockBaselines = vi.fn();
const mockEnabledBaselines = vi.fn();
const mockEnabledDetail = vi.fn();
const mockOpDetail = vi.fn();
const mockBaselineOp = vi.fn();
const mockCreateLZ = vi.fn(() => Promise.resolve({}));
const mockUpdateLZ = vi.fn(() => Promise.resolve({}));
const mockResetLZ = vi.fn(() => Promise.resolve({}));
const mockDeleteLZ = vi.fn(() => Promise.resolve({}));
const mockEnableBaseline = vi.fn(() => Promise.resolve({}));
const mockUpdateEB = vi.fn(() => Promise.resolve({}));
const mockResetEB = vi.fn(() => Promise.resolve({}));
const mockShowToast = vi.fn();

vi.mock("../../hooks/useControlTower", () => ({
  useLandingZones: (...args: any[]) => mockLandingZones(...args),
  useCreateLandingZone: () => ({ mutateAsync: mockCreateLZ, isPending: false }),
  useUpdateLandingZone: () => ({ mutateAsync: mockUpdateLZ, isPending: false }),
  useResetLandingZone: () => ({ mutateAsync: mockResetLZ, isPending: false }),
  useDeleteLandingZone: () => ({ mutateAsync: mockDeleteLZ, isPending: false }),
  useLandingZoneOperations: (...args: any[]) => mockOperations(...args),
  useLandingZoneOperation: (...args: any[]) => mockOpDetail(...args),
  useBaselines: (...args: any[]) => mockBaselines(...args),
  useEnabledBaselines: (...args: any[]) => mockEnabledBaselines(...args),
  useEnabledBaselineDetail: (...args: any[]) => mockEnabledDetail(...args),
  useEnableBaseline: () => ({ mutateAsync: mockEnableBaseline, isPending: false }),
  useUpdateEnabledBaseline: () => ({ mutateAsync: mockUpdateEB, isPending: false }),
  useResetEnabledBaseline: () => ({ mutateAsync: mockResetEB, isPending: false }),
  useBaselineOperation: (...args: any[]) => mockBaselineOp(...args),
}));

vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

// Mock Cloudscape Toggle so checked→unchecked transitions are deterministic
vi.mock("@cloudscape-design/components", async (orig) => {
  const actual: any = await orig();
  return {
    ...actual,
    Toggle: ({ checked, onChange, children }: any) => (
      <button data-testid={`toggle-${checked}`} onClick={() => onChange?.({ detail: { checked: !checked } })}>
        {children}
      </button>
    ),
  };
});

import { default as ControlTowerDashboard } from "./ControlTowerDashboard";

const LZ_ARN = "arn:aws:controltower:us-east-1:1:landingzone/SEED1";
const manifest = { govern: { accounts: [] } };
const landingZone = {
  arn: LZ_ARN,
  version: "4.0",
  latestAvailableVersion: "4.0",
  status: "ACTIVE",
  driftStatus: "IN_SYNC",
  manifest,
  remediationTypes: [],
};
const bareZone = { arn: "arn:aws:controltower:us-east-1:1:landingzone/BARE" };
const emptyZone = {};
const baseline = {
  arn: "arn:aws:controltower:us-east-1::baseline/17BSJV3IGJ2QSGA2",
  name: "AWSControlTowerBaseline",
  description: "Sets up resources to govern an OU.",
};
const unnamedBaseline = {
  arn: "arn:aws:controltower:us-east-1::baseline/NO NAME",
  name: null,
  description: null,
};
const enabledBaseline = {
  arn: "arn:aws:controltower:us-east-1:1:enabledbaseline/AAA",
  baselineIdentifier: "arn:aws:controltower:us-east-1::baseline/17BSJV3IGJ2QSGA2",
  baselineVersion: "1.0",
  targetIdentifier: "arn:aws:organizations::1:ou/o-x/ou-y",
  status: "SUCCEEDED",
  parentIdentifier: null,
};
const operation = { operationIdentifier: "op-1", operationType: "CREATE", status: "SUCCEEDED" };
const emptyBaseline = {};
const emptyEnabledBaseline = {};
const emptyOperation = {};

function setupAll() {
  mockLandingZones.mockReturnValue({
    data: { landingZones: [landingZone, bareZone, emptyZone], total: 3 },
    isLoading: false,
  });
  mockOperations.mockReturnValue({
    data: { operations: [operation, emptyOperation], total: 2 },
    isLoading: false,
  });
  mockBaselines.mockReturnValue({
    data: { baselines: [baseline, unnamedBaseline, emptyBaseline], total: 3 },
    isLoading: false,
  });
  mockEnabledBaselines.mockReturnValue({
    data: { enabledBaselines: [enabledBaseline, emptyEnabledBaseline], total: 2 },
    isLoading: false,
  });
  mockEnabledDetail.mockReturnValue({ data: undefined });
  mockOpDetail.mockReturnValue({ data: undefined });
  mockBaselineOp.mockReturnValue({ data: undefined });
}

async function clickTab(user: any, name: string) {
  await user.click(await screen.findByRole("tab", { name }));
}

beforeEach(() => {
  vi.clearAllMocks();
  setupAll();
});

describe("ControlTowerDashboard — Landing zone tab", () => {
  it("lists the landing zone with mapped fields", async () => {
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    expect(await screen.findByText(LZ_ARN)).toBeTruthy();
    expect(screen.getAllByText("4.0").length).toBe(2);
    expect(screen.getByText("ACTIVE")).toBeTruthy();
    expect(screen.getByText("IN_SYNC")).toBeTruthy();
    expect(screen.getByText("arn:aws:controltower:us-east-1:1:landingzone/BARE")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("creates a landing zone from manifest JSON", async () => {
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create landing zone" }));
    expect((screen.getByRole("button", { name: "Create" }) as HTMLButtonElement).disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("4.0"), "4.0");
    fireEvent.change(textareaInDialog(), { target: { value: '{"govern":{}}' } });
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(mockCreateLZ).toHaveBeenCalledWith({ manifest: '{"govern":{}}', version: "4.0" }),
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Landing zone created");
  });

  it("shows create error toast with message", async () => {
    mockCreateLZ.mockRejectedValueOnce(new Error("conflict"));
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create landing zone" }));
    await user.type(screen.getByPlaceholderText("4.0"), "4.0");
    fireEvent.change(textareaInDialog(), { target: { value: "{}" } });
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "conflict"));
  });

  it("shows generic create error toast", async () => {
    mockCreateLZ.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create landing zone" }));
    await user.type(screen.getByPlaceholderText("4.0"), "4.0");
    fireEvent.change(textareaInDialog(), { target: { value: "{}" } });
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to create landing zone"),
    );
  });

  it("updates the landing zone with remediation toggle", async () => {
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: `Update ${LZ_ARN}` }));
    const dialog = openDialog();    const versionInput = Array.from(dialog.querySelectorAll("input")).find(
      (i) => (i as HTMLInputElement).value === "4.0",
    ) as HTMLInputElement;
    await user.clear(versionInput);
    await user.type(versionInput, "5.0");
    fireEvent.change(textareaInDialog(), { target: { value: '{"govern":{"accounts":[]}}' } });
    await user.click(screen.getByTestId("toggle-false"));
    await clickInDialog(user, "Save");
    await waitFor(() =>
      expect(mockUpdateLZ).toHaveBeenCalledWith({
        landingZoneIdentifier: LZ_ARN,
        version: "5.0",
        manifest: '{"govern":{"accounts":[]}}',
        remediationTypes: ["INHERITANCE_DRIFT"],
      }),
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Landing zone update started");
  });

  it("updates a bare zone without remediation or manifest", async () => {
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: `Update ${bareZone.arn}` }));
    await clickInDialog(user, "Save");
    await waitFor(() =>
      expect(mockUpdateLZ).toHaveBeenCalledWith({
        landingZoneIdentifier: bareZone.arn,
        version: "",
        manifest: "",
        remediationTypes: undefined,
      }),
    );
  });

  it("updates a row without fields applying defaults", async () => {
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Enabled baselines");
    await user.click(await screen.findByRole("button", { name: "Update undefined" }));
    await clickInDialog(user, "Save");
    await waitFor(() =>
      expect(mockUpdateEB).toHaveBeenCalledWith({
        enabledBaselineIdentifier: undefined,
        baselineVersion: "",
        parameters: undefined,
      }),
    );
  });

  it("shows generic update error toast", async () => {
    mockUpdateLZ.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: `Update ${LZ_ARN}` }));
    await clickInDialog(user, "Save");
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to update landing zone"),
    );
  });

  it("shows generic reset error toast", async () => {
    mockResetLZ.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: `Reset ${LZ_ARN}` }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to reset landing zone"),
    );
  });

  it("resets the landing zone successfully", async () => {
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: `Reset ${LZ_ARN}` }));
    await waitFor(() => expect(mockResetLZ).toHaveBeenCalledWith(LZ_ARN));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Landing zone reset started");
  });

  it("deletes the landing zone after confirm", async () => {
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: `Delete ${LZ_ARN}` }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockDeleteLZ).toHaveBeenCalledWith(LZ_ARN));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Landing zone deleted");
  });

  it("shows delete error toast with message", async () => {
    mockDeleteLZ.mockRejectedValueOnce(new Error("locked"));
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: `Delete ${LZ_ARN}` }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "locked"));
  });

  it("shows generic delete error toast", async () => {
    mockDeleteLZ.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: `Delete ${LZ_ARN}` }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete landing zone"),
    );
  });

  it("dismisses the create and update modals via Cancel and Escape", async () => {
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create landing zone" }));
    await user.type(screen.getByPlaceholderText("4.0"), "4.0");
    await clickInDialog(user, "Cancel");
    await user.click(screen.getByRole("button", { name: "Create landing zone" }));
    await waitFor(() => expect(openDialog()).toBeTruthy());
    dismissModalWithEscape();
    await user.click(await screen.findByRole("button", { name: `Update ${LZ_ARN}` }));
    await clickInDialog(user, "Cancel");
    await user.click(await screen.findByRole("button", { name: `Update ${LZ_ARN}` }));
    dismissModalWithEscape();
    expect(mockCreateLZ).not.toHaveBeenCalled();
    expect(mockUpdateLZ).not.toHaveBeenCalled();
  });
});

describe("ControlTowerDashboard — Baselines tab", () => {
  it("lists baselines", async () => {
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Baselines");
    expect(screen.getAllByText("AWSControlTowerBaseline").length).toBeGreaterThan(0);
    expect(screen.getByText("Sets up resources to govern an OU.")).toBeTruthy();
  });

  it("enables a baseline with parameters", async () => {
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Baselines");
    await user.click(screen.getByRole("button", { name: "Enable baseline" }));
    expect(screen.getByRole("button", { name: "AWSControlTowerBaseline" })).toBeTruthy();
    expect((screen.getByRole("button", { name: "Enable" }) as HTMLButtonElement).disabled).toBe(true);
    await user.click(screen.getByRole("button", { name: "AWSControlTowerBaseline" }));
    expect(screen.getByRole("button", { name: unnamedBaseline.arn })).toBeTruthy();
    await user.type(screen.getByPlaceholderText("arn:aws:organizations::123456789012:ou/o-xxx/ou-xxx"), "arn:ou/x");
    const versionInput = screen.getByLabelText("Baseline version");
    await user.clear(versionInput);
    await user.type(versionInput, "3.0");
    fireEvent.change(textareaInDialog(), { target: { value: '[{"key":"k","value":true}]' } });
    await user.click(screen.getByRole("button", { name: "Enable" }));
    await waitFor(() =>
      expect(mockEnableBaseline).toHaveBeenCalledWith({
        baselineIdentifier: unnamedBaseline.arn,
        baselineVersion: "3.0",
        targetIdentifier: "arn:ou/x",
        parameters: '[{"key":"k","value":true}]',
      }),
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Baseline enabled");
  });

  it("enables without optional parameters", async () => {
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Baselines");
    await user.click(screen.getByRole("button", { name: "Enable baseline" }));
    await user.type(screen.getByPlaceholderText("arn:aws:organizations::123456789012:ou/o-xxx/ou-xxx"), "arn:ou/x");
    await user.click(screen.getByRole("button", { name: "Enable" }));
    await waitFor(() =>
      expect(mockEnableBaseline).toHaveBeenCalledWith({
        baselineIdentifier: baseline.arn,
        baselineVersion: "1.0",
        targetIdentifier: "arn:ou/x",
        parameters: undefined,
      }),
    );
  });

  it("shows generic enable error toast", async () => {
    mockEnableBaseline.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Baselines");
    await user.click(screen.getByRole("button", { name: "Enable baseline" }));
    await user.type(screen.getByPlaceholderText("arn:aws:organizations::123456789012:ou/o-xxx/ou-xxx"), "arn:ou/x");
    await user.click(screen.getByRole("button", { name: "Enable" }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to enable baseline"),
    );
  });

  it("disables enabling when no baselines exist", async () => {
    mockBaselines.mockReturnValue({ data: { baselines: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Baselines");
    expect(
      (screen.getByRole("button", { name: "Enable baseline" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("dismisses the enable modal via Cancel and Escape", async () => {
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Baselines");
    await user.click(screen.getByRole("button", { name: "Enable baseline" }));
    await clickInDialog(user, "Cancel");
    await user.click(screen.getByRole("button", { name: "Enable baseline" }));
    await waitFor(() => expect(openDialog()).toBeTruthy());
    dismissModalWithEscape();
    expect(mockEnableBaseline).not.toHaveBeenCalled();
  });
});

describe("ControlTowerDashboard — Enabled baselines tab", () => {
  it("lists enabled baselines", async () => {
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Enabled baselines");
    expect(await screen.findByText(enabledBaseline.arn)).toBeTruthy();
    expect(screen.getByText(enabledBaseline.targetIdentifier)).toBeTruthy();
    expect(screen.getByText("SUCCEEDED")).toBeTruthy();
  });

  it("updates an enabled baseline without parameters", async () => {
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Enabled baselines");
    await user.click(await screen.findByRole("button", { name: `Update ${enabledBaseline.arn}` }));
    const dialog = openDialog();
    const versionInput = Array.from(dialog.querySelectorAll("input")).find(
      (i) => (i as HTMLInputElement).value === "1.0",
    ) as HTMLInputElement;
    await user.clear(versionInput);
    await user.type(versionInput, "2.0");
    await clickInDialog(user, "Save");
    await waitFor(() =>
      expect(mockUpdateEB).toHaveBeenCalledWith({
        enabledBaselineIdentifier: enabledBaseline.arn,
        baselineVersion: "2.0",
        parameters: undefined,
      }),
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Enabled baseline updated");
  });

  it("updates an enabled baseline with parameters and shows current ones", async () => {
    mockEnabledDetail.mockReturnValue({
      data: { enabledBaseline: { ...enabledBaseline, parameters: [{ key: "k", value: "v" }] } },
    });
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Enabled baselines");
    await user.click(await screen.findByRole("button", { name: `Update ${enabledBaseline.arn}` }));
    expect(await screen.findByText("Current parameters")).toBeTruthy();
    fireEvent.change(textareaInDialog(), { target: { value: '[{"key":"k","value":2}]' } });
    await clickInDialog(user, "Save");
    await waitFor(() =>
      expect(mockUpdateEB).toHaveBeenCalledWith({
        enabledBaselineIdentifier: enabledBaseline.arn,
        baselineVersion: "1.0",
        parameters: '[{"key":"k","value":2}]',
      }),
    );
  });

  it("hides current parameters when detail has none", async () => {
    mockEnabledDetail.mockReturnValue({
      data: { enabledBaseline: { ...enabledBaseline, parameters: [] } },
    });
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Enabled baselines");
    await user.click(await screen.findByRole("button", { name: `Update ${enabledBaseline.arn}` }));
    await waitFor(() => expect(screen.queryByText("Current parameters")).toBeNull());
  });

  it("dismisses the enabled-baseline update modal via Cancel and Escape", async () => {
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Enabled baselines");
    await user.click(await screen.findByRole("button", { name: `Update ${enabledBaseline.arn}` }));
    await clickInDialog(user, "Cancel");
    await user.click(await screen.findByRole("button", { name: `Update ${enabledBaseline.arn}` }));
    dismissModalWithEscape();
    expect(mockUpdateEB).not.toHaveBeenCalled();
  });

  it("shows generic update error toast", async () => {
    mockUpdateEB.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Enabled baselines");
    await user.click(await screen.findByRole("button", { name: `Update ${enabledBaseline.arn}` }));
    await clickInDialog(user, "Save");
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to update enabled baseline"),
    );
  });

  it("shows generic reset error toast", async () => {
    mockResetEB.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Enabled baselines");
    await user.click(await screen.findByRole("button", { name: `Reset ${enabledBaseline.arn}` }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to reset enabled baseline"),
    );
  });

  it("resets an enabled baseline successfully", async () => {
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Enabled baselines");
    await user.click(await screen.findByRole("button", { name: `Reset ${enabledBaseline.arn}` }));
    await waitFor(() => expect(mockResetEB).toHaveBeenCalledWith(enabledBaseline.arn));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Enabled baseline reset started");
  });
});

describe("ControlTowerDashboard — Operations tab", () => {
  it("lists operations and opens details", async () => {
    mockOpDetail.mockReturnValue({
      data: { operation: { ...operation, startTime: "t1", endTime: "t2" } },
    });
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Operations");
    expect(await screen.findByText("op-1")).toBeTruthy();
    expect(screen.getByText("CREATE")).toBeTruthy();
    await user.click(await screen.findByRole("button", { name: "Details op-1" }));
    await waitFor(() => expect(screen.getByText("Operation details")).toBeTruthy());
    expect(screen.getAllByText(/CREATE/).length).toBeGreaterThan(0);
    await clickInDialog(user, "Close");
  });

  it("shows Loading in the details modal until data arrives", async () => {
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Operations");
    await user.click(await screen.findByRole("button", { name: "Details op-1" }));
    await waitFor(() => expect(screen.getByText("Loading…")).toBeTruthy());
    dismissModalWithEscape();
  });

  it("looks up a baseline operation", async () => {
    mockBaselineOp.mockReturnValue({
      data: { baselineOperation: { operationIdentifier: "op-9", operationType: "ENABLE_BASELINE", status: "SUCCEEDED" } },
    });
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Operations");
    expect(
      (screen.getByRole("button", { name: "Lookup" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    await user.type(screen.getByLabelText("Baseline operation lookup"), "op-9");
    await user.click(screen.getByRole("button", { name: "Lookup" }));
    await waitFor(() => expect(screen.getByText(/ENABLE_BASELINE/)).toBeTruthy());
  });
});

describe("ControlTowerDashboard — fallback rendering", () => {
  it("renders create button when hooks return undefined data", async () => {
    mockLandingZones.mockReturnValue({ data: undefined, isLoading: false });
    mockOperations.mockReturnValue({ data: undefined, isLoading: false });
    mockBaselines.mockReturnValue({ data: undefined, isLoading: false });
    mockEnabledBaselines.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    expect(await screen.findByRole("button", { name: "Create landing zone" })).toBeTruthy();
    for (const name of ["Baselines", "Enabled baselines", "Operations"]) {
      await user.click(screen.getByRole("tab", { name }));
    }
    expect(screen.queryByText("op-1")).toBeNull();
  });

  it("renders empty tables when lists are empty", async () => {
    mockLandingZones.mockReturnValue({ data: { landingZones: [], total: 0 }, isLoading: false });
    mockOperations.mockReturnValue({ data: { operations: [], total: 0 }, isLoading: false });
    mockEnabledBaselines.mockReturnValue({ data: { enabledBaselines: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<ControlTowerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.queryByText(LZ_ARN)).toBeNull());
    await user.click(screen.getByRole("tab", { name: "Enabled baselines" }));
    expect(screen.queryByText(enabledBaseline.arn)).toBeNull();
  });
});
