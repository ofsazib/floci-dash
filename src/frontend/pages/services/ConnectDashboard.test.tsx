// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

/** Fire Escape on every mounted Cloudscape dialog (fires onDismiss). */
function dismissModalWithEscape() {
  document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
    fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27, key: "Escape" });
  });
}

/** The currently-visible Cloudscape dialog element (create modal or details modal). */
function visibleDialog(): HTMLElement {
  const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[class*="awsui_dialog"]'));
  const visible = dialogs.find((d) => !d.className.includes("hidden"));
  if (!visible) throw new Error("No visible dialog");
  return visible;
}

const mockInstances = vi.fn();
const mockAttributes = vi.fn();
const mockStorageConfigs = vi.fn();
const mockCreateMutate = vi.fn(() => Promise.resolve({}));
const mockDeleteMutate = vi.fn(() => Promise.resolve({}));
const mockUpdateAttrMutate = vi.fn(() => Promise.resolve({}));
const mockAssociateMutate = vi.fn(() => Promise.resolve({}));
const mockDisassociateMutate = vi.fn(() => Promise.resolve({}));
const mockShowToast = vi.fn();

vi.mock("../../hooks/useConnect", () => ({
  useConnectInstances: (...args: any[]) => mockInstances(...args),
  useConnectAttributes: (...args: any[]) => mockAttributes(...args),
  useConnectStorageConfigs: (...args: any[]) => mockStorageConfigs(...args),
  useCreateConnectInstance: () => ({ mutateAsync: mockCreateMutate, isPending: false }),
  useDeleteConnectInstance: () => ({ mutateAsync: mockDeleteMutate, isPending: false }),
  useUpdateConnectAttribute: () => ({ mutateAsync: mockUpdateAttrMutate, isPending: false }),
  useAssociateConnectStorageConfig: () => ({ mutateAsync: mockAssociateMutate, isPending: false }),
  useDisassociateConnectStorageConfig: () => ({ mutateAsync: mockDisassociateMutate, isPending: false }),
}));

vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

// Mock Cloudscape Select so options are clickable buttons, and Toggle so
// checked→unchecked transitions are deterministic under happy-dom
vi.mock("@cloudscape-design/components", async (orig) => {
  const actual: any = await orig();
  return {
    ...actual,
    Select: ({ selectedOption, onChange, options }: any) => (
      <div data-testid="mock-select">
        {options?.map((o: any) => (
          <button
            key={o.value}
            data-testid={`opt-${o.value}`}
            onClick={() => onChange?.({ detail: { selectedOption: o } })}
          >
            {o.label}
          </button>
        ))}
      </div>
    ),
    Toggle: ({ checked, onChange, children }: any) => (
      <button data-testid={`toggle-${checked}`} onClick={() => onChange?.({ detail: { checked: !checked } })}>
        {children}
      </button>
    ),
  };
});

import { ConnectDashboard } from "./ConnectDashboard";

const instance = {
  Id: "inst-1",
  Arn: "arn:aws:connect:us-east-1:123456789012:instance/inst-1",
  InstanceAlias: "support-center",
  InstanceStatus: "ACTIVE",
  IdentityManagementType: "CONNECT_MANAGED",
};

const instance2 = {
  Id: "inst-2",
  Arn: "arn:aws:connect:us-east-1:123456789012:instance/inst-2",
  InstanceAlias: "billing-desk",
  InstanceStatus: "CREATING",
  IdentityManagementType: "SAML",
};

function setupInstances(list = [instance, instance2]) {
  mockInstances.mockReturnValue({ data: { instances: list, total: list.length }, isLoading: false });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockInstances.mockReturnValue({ data: { instances: [], total: 0 }, isLoading: false });
  mockAttributes.mockReturnValue({ data: { attributes: [], total: 0 }, isLoading: false });
  mockStorageConfigs.mockReturnValue({ data: { storageConfigs: [], total: 0 }, isLoading: false });
});

describe("ConnectDashboard", () => {
  it("renders empty state", () => {
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No Connect instances. Create one to get started.")).toBeTruthy();
  });

  it("renders loading state", () => {
    mockInstances.mockReturnValue({ data: undefined, isLoading: true });
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Loading resources...")).toBeTruthy();
  });

  it("renders instance rows with status indicators", () => {
    setupInstances();
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("support-center")).toBeTruthy();
    expect(screen.getByText("billing-desk")).toBeTruthy();
    expect(screen.getByText("ACTIVE")).toBeTruthy();
    expect(screen.getByText("CREATING")).toBeTruthy();
  });

  it("creates an instance with identity type and call toggles", async () => {
    const user = userEvent.setup();
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create Connect instance" }));
    await user.type(screen.getByLabelText("Instance alias"), "new-inst");
    await user.click(screen.getByTestId("opt-SAML"));
    await user.click(screen.getByRole("button", { name: "Inbound calls" }));
    await user.click(screen.getByRole("button", { name: "Outbound calls" }));
    await user.click(screen.getByRole("button", { name: "Create instance" }));
    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalledWith({
        InstanceAlias: "new-inst",
        IdentityManagementType: "SAML",
        InboundCallsEnabled: false,
        OutboundCallsEnabled: false,
      });
    });
    expect(mockShowToast).toHaveBeenCalledWith("success", "Connect instance new-inst created");
  });

  it("shows create error toast on failure", async () => {
    mockCreateMutate.mockRejectedValueOnce(new Error("create failed"));
    const user = userEvent.setup();
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create Connect instance" }));
    await user.type(screen.getByLabelText("Instance alias"), "bad");
    await user.click(screen.getByRole("button", { name: "Create instance" }));
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("error", "create failed");
    });
  });

  it("deletes an instance via confirm dialog", async () => {
    setupInstances();
    const user = userEvent.setup();
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    const deleteButtons = screen.getAllByRole("button", { name: /^Delete/i });
    await user.click(deleteButtons[0]);
    await user.click(await screen.findByRole("button", { name: /Delete$/i }));
    await waitFor(() => {
      expect(mockDeleteMutate).toHaveBeenCalledWith("inst-1");
    });
    expect(mockShowToast).toHaveBeenCalledWith("success", "Connect instance deleted");
  });

  it("shows delete error toast on failure", async () => {
    mockDeleteMutate.mockRejectedValueOnce(new Error("delete failed"));
    setupInstances();
    const user = userEvent.setup();
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    const deleteButtons = screen.getAllByRole("button", { name: /^Delete/i });
    await user.click(deleteButtons[0]);
    await user.click(await screen.findByRole("button", { name: /Delete$/i }));
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("error", "delete failed");
    });
  });

  it("opens details modal with Attributes and Storage configs tabs", async () => {
    setupInstances();
    const user = userEvent.setup();
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: "Details" })[0]);
    expect(await screen.findByText("Instance attributes")).toBeTruthy();
    expect(screen.getByText("Storage configs")).toBeTruthy();
    expect(screen.getByText("No attributes")).toBeTruthy();
  });

  it("closes details modal on dismiss", async () => {
    setupInstances();
    const user = userEvent.setup();
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: "Details" })[0]);
    await screen.findByText("Instance attributes");
    dismissModalWithEscape();
    await waitFor(() => {
      expect(screen.queryByText("Instance attributes")).toBeNull();
    });
  });

  it("toggles an attribute to false and shows success toast", async () => {
    setupInstances();
    mockAttributes.mockReturnValue({
      data: { attributes: [{ AttributeType: "CONTACTFLOW_LOGS", Value: "true" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: "Details" })[0]);
    await screen.findByText("CONTACTFLOW_LOGS");
    const row = screen.getByText("CONTACTFLOW_LOGS").closest("tr")!;
    await user.click(within(row as HTMLElement).getByRole("button", { name: "Enabled" }));
    await waitFor(() => {
      expect(mockUpdateAttrMutate).toHaveBeenCalledWith({
        instanceId: "inst-1",
        attributeType: "CONTACTFLOW_LOGS",
        value: "false",
      });
    });
    expect(mockShowToast).toHaveBeenCalledWith("success", "Attribute CONTACTFLOW_LOGS set to false");
  });

  it("toggles an attribute to true when currently false", async () => {
    setupInstances();
    mockAttributes.mockReturnValue({
      data: { attributes: [{ AttributeType: "HIGH_VOLUME_OUTBOUND", Value: "false" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: "Details" })[0]);
    await screen.findByText("HIGH_VOLUME_OUTBOUND");
    const row = screen.getByText("HIGH_VOLUME_OUTBOUND").closest("tr")!;
    await user.click(within(row as HTMLElement).getByRole("button", { name: "Enabled" }));
    await waitFor(() => {
      expect(mockUpdateAttrMutate).toHaveBeenCalledWith({
        instanceId: "inst-1",
        attributeType: "HIGH_VOLUME_OUTBOUND",
        value: "true",
      });
    });
  });

  it("shows attribute update error toast on failure", async () => {
    mockUpdateAttrMutate.mockRejectedValueOnce(new Error("update failed"));
    setupInstances();
    mockAttributes.mockReturnValue({
      data: { attributes: [{ AttributeType: "CONTACTFLOW_LOGS", Value: "true" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: "Details" })[0]);
    await screen.findByText("CONTACTFLOW_LOGS");
    const row = screen.getByText("CONTACTFLOW_LOGS").closest("tr")!;
    await user.click(within(row as HTMLElement).getByRole("button", { name: "Enabled" }));
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("error", "update failed");
    });
  });

  it("associates a storage config with resource type and bucket", async () => {
    setupInstances();
    const user = userEvent.setup();
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: "Details" })[0]);
    await user.click(await screen.findByText("Storage configs"));
    await user.click(await screen.findByRole("button", { name: "Associate storage config" }));
    await user.click(screen.getByTestId("opt-CALL_RECORDINGS"));
    await user.type(screen.getByLabelText("S3 bucket name"), "my-transcripts");
    await user.type(screen.getByLabelText("Object key prefix (optional)"), "logs/");
    await user.click(screen.getByRole("button", { name: "Associate" }));
    await waitFor(() => {
      expect(mockAssociateMutate).toHaveBeenCalledWith({
        instanceId: "inst-1",
        ResourceType: "CALL_RECORDINGS",
        StorageConfig: { StorageType: "S3", S3Config: { BucketName: "my-transcripts", ObjectKeyPrefix: "logs/" } },
      });
    });
    expect(mockShowToast).toHaveBeenCalledWith("success", "Storage config associated");
  });

  it("keeps associate submit disabled until bucket is filled", async () => {
    setupInstances();
    const user = userEvent.setup();
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: "Details" })[0]);
    await user.click(await screen.findByText("Storage configs"));
    await user.click(await screen.findByRole("button", { name: "Associate storage config" }));
    const submit = screen.getByRole("button", { name: "Associate" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    expect(mockAssociateMutate).not.toHaveBeenCalled();
  });

  it("shows associate error toast on failure", async () => {
    mockAssociateMutate.mockRejectedValueOnce(new Error("associate failed"));
    setupInstances();
    const user = userEvent.setup();
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: "Details" })[0]);
    await user.click(await screen.findByText("Storage configs"));
    await user.click(await screen.findByRole("button", { name: "Associate storage config" }));
    await user.type(screen.getByLabelText("S3 bucket name"), "b");
    await user.click(screen.getByRole("button", { name: "Associate" }));
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("error", "associate failed");
    });
  });

  it("disassociates a storage config via confirm dialog", async () => {
    setupInstances();
    mockStorageConfigs.mockReturnValue({
      data: {
        storageConfigs: [
          { AssociationId: "assoc-1", ResourceType: "CHAT_TRANSCRIPTS", StorageConfig: { StorageType: "S3" } },
        ],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: "Details" })[0]);
    await user.click(await screen.findByText("Storage configs"));
    await screen.findByText("assoc-1");
    await user.click(screen.getByRole("button", { name: "Delete assoc-1" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(mockDisassociateMutate).toHaveBeenCalledWith({ instanceId: "inst-1", associationId: "assoc-1" });
    });
    expect(mockShowToast).toHaveBeenCalledWith("success", "Storage config disassociated");
  });

  it("shows disassociate error toast on failure", async () => {
    mockDisassociateMutate.mockRejectedValueOnce(new Error("disassociate failed"));
    setupInstances();
    mockStorageConfigs.mockReturnValue({
      data: {
        storageConfigs: [
          { AssociationId: "assoc-1", ResourceType: "CHAT_TRANSCRIPTS", StorageConfig: { StorageType: "S3" } },
        ],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: "Details" })[0]);
    await user.click(await screen.findByText("Storage configs"));
    await screen.findByText("assoc-1");
    await user.click(screen.getByRole("button", { name: "Delete assoc-1" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("error", "disassociate failed");
    });
  });

  it("shows fallback error message for non-Error rejections", async () => {
    mockCreateMutate.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create Connect instance" }));
    await user.type(screen.getByLabelText("Instance alias"), "x");
    await user.click(screen.getByRole("button", { name: "Create instance" }));
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to create instance");
    });
  });

  it("renders instance with UNKNOWN status", () => {
    setupInstances([{ ...instance, InstanceStatus: undefined as any }]);
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("UNKNOWN")).toBeTruthy();
  });

  it("renders DELETING status as in-progress", () => {
    setupInstances([{ ...instance, InstanceStatus: "DELETING" }]);
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("DELETING")).toBeTruthy();
  });

  it("renders instance without alias using its Id", () => {
    setupInstances([{ ...instance, InstanceAlias: undefined as any }]);
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    expect(screen.getByLabelText("Delete inst-1")).toBeTruthy();
  });

  it("renders attributes fallback when data is undefined", async () => {
    setupInstances();
    mockAttributes.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: "Details" })[0]);
    expect(await screen.findByText("No attributes")).toBeTruthy();
  });

  it("renders storage configs fallback when data is undefined", async () => {
    setupInstances();
    mockStorageConfigs.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: "Details" })[0]);
    await user.click(await screen.findByText("Storage configs"));
    expect(await screen.findByText("No storage configs")).toBeTruthy();
  });

  it("shows fallback error for non-Error attribute update rejection", async () => {
    mockUpdateAttrMutate.mockRejectedValueOnce("boom");
    setupInstances();
    mockAttributes.mockReturnValue({
      data: { attributes: [{ AttributeType: "CONTACTFLOW_LOGS", Value: "true" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: "Details" })[0]);
    await screen.findByText("CONTACTFLOW_LOGS");
    const row = screen.getByText("CONTACTFLOW_LOGS").closest("tr")!;
    await user.click(within(row as HTMLElement).getByRole("button", { name: "Enabled" }));
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to update attribute");
    });
  });

  it("shows fallback error for non-Error associate rejection", async () => {
    mockAssociateMutate.mockRejectedValueOnce("boom");
    setupInstances();
    const user = userEvent.setup();
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: "Details" })[0]);
    await user.click(await screen.findByText("Storage configs"));
    await user.click(await screen.findByRole("button", { name: "Associate storage config" }));
    await user.type(screen.getByLabelText("S3 bucket name"), "b");
    await user.click(screen.getByRole("button", { name: "Associate" }));
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to associate storage config");
    });
  });

  it("shows fallback error for non-Error disassociate rejection", async () => {
    mockDisassociateMutate.mockRejectedValueOnce("boom");
    setupInstances();
    mockStorageConfigs.mockReturnValue({
      data: {
        storageConfigs: [
          { AssociationId: "assoc-1", ResourceType: "CHAT_TRANSCRIPTS", StorageConfig: { StorageType: "S3" } },
        ],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: "Details" })[0]);
    await user.click(await screen.findByText("Storage configs"));
    await screen.findByText("assoc-1");
    await user.click(screen.getByRole("button", { name: "Delete assoc-1" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to disassociate storage config");
    });
  });

  it("shows fallback error for non-Error delete rejection", async () => {
    mockDeleteMutate.mockRejectedValueOnce("boom");
    setupInstances();
    const user = userEvent.setup();
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    const deleteButtons = screen.getAllByRole("button", { name: /^Delete/i });
    await user.click(deleteButtons[0]);
    await user.click(await screen.findByRole("button", { name: /Delete$/i }));
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete instance");
    });
  });

  it("dismisses the associate storage config modal", async () => {
    setupInstances();
    const user = userEvent.setup();
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: "Details" })[0]);
    await user.click(await screen.findByText("Storage configs"));
    await user.click(await screen.findByRole("button", { name: "Associate storage config" }));
    await screen.findByLabelText("S3 bucket name");
    dismissModalWithEscape();
    await waitFor(() => {
      expect(screen.queryByLabelText("S3 bucket name")).toBeNull();
    });
  });

  it("closes the associate modal via its dismiss button", async () => {
    setupInstances();
    const user = userEvent.setup();
    render(<ConnectDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: "Details" })[0]);
    await user.click(await screen.findByText("Storage configs"));
    await user.click(await screen.findByRole("button", { name: "Associate storage config" }));
    await screen.findByLabelText("S3 bucket name");
    // Click the X (dismiss) button of the topmost (associate) modal — the
    // last dismiss-control in DOM order belongs to the innermost open modal
    const dismissControls = screen
      .getAllByRole("button")
      .filter((b) => b.className.includes("awsui_dismiss-control")) as HTMLElement[];
    expect(dismissControls.length).toBeGreaterThan(0);
    await user.click(dismissControls[dismissControls.length - 1]);
    await waitFor(() => {
      expect(screen.queryByLabelText("S3 bucket name")).toBeNull();
    });
  });
});
