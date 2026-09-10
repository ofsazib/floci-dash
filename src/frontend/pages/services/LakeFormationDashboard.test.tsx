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

const mockSettings = vi.fn();
const mockResources = vi.fn();
const mockPermissions = vi.fn();
const mockLfTags = vi.fn();
const mockUpdateSettings = vi.fn(() => Promise.resolve({}));
const mockRegister = vi.fn(() => Promise.resolve({}));
const mockUpdateResource = vi.fn(() => Promise.resolve({}));
const mockDeregister = vi.fn(() => Promise.resolve({}));
const mockGrant = vi.fn(() => Promise.resolve({}));
const mockRevoke = vi.fn(() => Promise.resolve({}));
const mockCreateTag = vi.fn(() => Promise.resolve({}));
const mockUpdateTag = vi.fn(() => Promise.resolve({}));
const mockDeleteTag = vi.fn(() => Promise.resolve({}));
const mockShowToast = vi.fn();

vi.mock("../../hooks/useLakeFormation", () => ({
  useLakeFormationSettings: (...args: any[]) => mockSettings(...args),
  useUpdateLakeFormationSettings: () => ({ mutateAsync: mockUpdateSettings, isPending: false }),
  useLakeFormationResources: (...args: any[]) => mockResources(...args),
  useLakeFormationResourceDetail: () => ({ data: undefined }),
  useRegisterLakeFormationResource: () => ({ mutateAsync: mockRegister, isPending: false }),
  useUpdateLakeFormationResource: () => ({ mutateAsync: mockUpdateResource, isPending: false }),
  useDeregisterLakeFormationResource: () => ({ mutateAsync: mockDeregister, isPending: false }),
  useLakeFormationPermissions: (...args: any[]) => mockPermissions(...args),
  useGrantLakeFormationPermissions: () => ({ mutateAsync: mockGrant, isPending: false }),
  useRevokeLakeFormationPermissions: () => ({ mutateAsync: mockRevoke, isPending: false }),
  useLfTags: (...args: any[]) => mockLfTags(...args),
  useCreateLfTag: () => ({ mutateAsync: mockCreateTag, isPending: false }),
  useUpdateLfTag: () => ({ mutateAsync: mockUpdateTag, isPending: false }),
  useDeleteLfTag: () => ({ mutateAsync: mockDeleteTag, isPending: false }),
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

import { default as LakeFormationDashboard } from "./LakeFormationDashboard";

const resource = {
  resourceArn: "arn:aws:s3:::my-datalake",
  roleArn: "arn:aws:iam::123456789012:role/lf-role",
  lastModified: 1234567890,
  withFederation: false,
};

const permission = {
  principal: "arn:aws:iam::123456789012:user/analyst",
  resource: { Database: { Name: "db1" } },
  permissions: ["SELECT"],
  permissionsWithGrantOption: [],
};

const lfTag = { catalogId: "123456789012", tagKey: "env", tagValues: ["prod", "dev"] };

function setupAll() {
  mockSettings.mockReturnValue({
    data: { dataLakeAdmins: ["arn:aws:iam::1:user/admin"], allowExternalDataFiltering: true, parameters: {}, trustedResourceOwners: [] },
    isLoading: false,
  });
  mockResources.mockReturnValue({ data: { resources: [resource], total: 1 }, isLoading: false });
  mockPermissions.mockReturnValue({ data: { principalResourcePermissions: [permission], total: 1 }, isLoading: false });
  mockLfTags.mockReturnValue({ data: { lfTags: [lfTag], total: 1 }, isLoading: false });
}

async function clickTab(user: any, name: string) {
  await user.click(await screen.findByRole("tab", { name }));
}

beforeEach(() => {
  vi.clearAllMocks();
  setupAll();
});

describe("LakeFormationDashboard — Settings tab", () => {
  it("shows current admins and external filtering", async () => {
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    expect(await screen.findByText("arn:aws:iam::1:user/admin")).toBeTruthy();
    expect(screen.getByTestId("toggle-true")).toBeTruthy();
  });

  it("enables save when dirty and saves parsed admins", async () => {
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    const save = await screen.findByRole("button", { name: "Save settings" });
    expect((save as HTMLButtonElement).disabled).toBe(true);
    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "arn:aws:iam::1:user/new");
    expect((save as HTMLButtonElement).disabled).toBe(false);
    await user.click(save);
    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalledWith({
      dataLakeAdmins: ["arn:aws:iam::1:user/new"],
      allowExternalDataFiltering: false, // toggle untouched → local state (false) wins once dirty
    }));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Data lake settings saved");
  });

  it("shows error toast on save failure", async () => {
    mockUpdateSettings.mockRejectedValueOnce(new Error("boom"));
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await user.type(await screen.findByRole("textbox"), "x");
    await user.click(screen.getByRole("button", { name: "Save settings" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "boom"));
  });

  it("shows fallback error toast when rejection has no message", async () => {
    mockUpdateSettings.mockRejectedValueOnce({});
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await user.type(await screen.findByRole("textbox"), "x");
    await user.click(screen.getByRole("button", { name: "Save settings" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to save settings"));
  });

  it("toggles external filtering", async () => {
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByTestId("toggle-true"));
    expect(screen.getByTestId("toggle-false")).toBeTruthy();
  });
});

describe("LakeFormationDashboard — Resources tab", () => {
  it("lists registered resources", async () => {
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Registered resources");
    expect(await screen.findByText("arn:aws:s3:::my-datalake")).toBeTruthy();
    expect(screen.getByText("arn:aws:iam::123456789012:role/lf-role")).toBeTruthy();
  });

  it("registers a resource", async () => {
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Registered resources");
    await user.click(screen.getByRole("button", { name: "Create registered resource" }));
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "arn:aws:s3:::new-bucket");
    await user.click(screen.getByRole("button", { name: "Register" }));
    await waitFor(() => expect(mockRegister).toHaveBeenCalledWith({
      resourceArn: "arn:aws:s3:::new-bucket",
      roleArn: undefined,
    }));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Resource registered");
  });

  it("keeps register disabled without an ARN", async () => {
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Registered resources");
    await user.click(screen.getByRole("button", { name: "Create registered resource" }));
    expect((screen.getByRole("button", { name: "Register" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows register error toast on failure", async () => {
    mockRegister.mockRejectedValueOnce(new Error("nope"));
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Registered resources");
    await user.click(screen.getByRole("button", { name: "Create registered resource" }));
    await user.type(screen.getAllByRole("textbox")[0], "arn:aws:s3:::x");
    await user.click(screen.getByRole("button", { name: "Register" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "nope"));
  });

  it("edits a resource role", async () => {
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Registered resources");
    await user.click(await screen.findByRole("button", { name: "Edit role for arn:aws:s3:::my-datalake" }));
    const modalInput = screen.getAllByRole("textbox").at(-1)!;
    await user.clear(modalInput);
    await user.type(modalInput, "arn:aws:iam::1:role/new");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mockUpdateResource).toHaveBeenCalledWith({
      resourceArn: "arn:aws:s3:::my-datalake",
      roleArn: "arn:aws:iam::1:role/new",
    }));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Resource role updated");
  });

  it("deregisters a resource after confirm", async () => {
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Registered resources");
    await user.click(await screen.findByRole("button", { name: "Delete arn:aws:s3:::my-datalake" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockDeregister).toHaveBeenCalledWith("arn:aws:s3:::my-datalake"));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Resource deregistered");
  });

  it("shows deregister error toast on failure", async () => {
    mockDeregister.mockRejectedValueOnce(new Error("busy"));
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Registered resources");
    await user.click(await screen.findByRole("button", { name: "Delete arn:aws:s3:::my-datalake" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "busy"));
  });
});

describe("LakeFormationDashboard — Permissions tab", () => {
  it("lists permissions", async () => {
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Permissions");
    expect(await screen.findByText("arn:aws:iam::123456789012:user/analyst")).toBeTruthy();
    // "SELECT" appears both as the picker label and the row text
    expect(screen.getAllByText("SELECT").length).toBeGreaterThan(0);
  });

  it("grants a permission", async () => {
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Permissions");
    await user.type(screen.getByPlaceholderText("arn:aws:iam::123456789012:user/analyst"), "arn:aws:iam::1:user/new");
    await user.click(screen.getByRole("button", { name: "Grant" }));
    await waitFor(() => expect(mockGrant).toHaveBeenCalledWith({
      principal: "arn:aws:iam::1:user/new",
      resource: { Database: { Name: "default" } },
      permissions: ["SELECT"],
    }));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Granted SELECT to arn:aws:iam::1:user/new");
  });

  it("keeps grant disabled without a principal", async () => {
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Permissions");
    expect((screen.getByRole("button", { name: "Grant" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("cycles the permission selection", async () => {
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Permissions");
    const btn = screen.getByRole("button", { name: "SELECT" });
    await user.click(btn);
    expect(screen.getByRole("button", { name: "ALL" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "ALL" }));
    expect(screen.getByRole("button", { name: "SELECT" })).toBeTruthy();
  });

  it("shows grant error toast on failure", async () => {
    mockGrant.mockRejectedValueOnce(new Error("denied"));
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Permissions");
    await user.type(screen.getByPlaceholderText("arn:aws:iam::123456789012:user/analyst"), "p");
    await user.click(screen.getByRole("button", { name: "Grant" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "denied"));
  });

  it("revokes a permission", async () => {
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Permissions");
    await user.click(await screen.findByRole("button", { name: "Revoke" }));
    await waitFor(() => expect(mockRevoke).toHaveBeenCalledWith({
      principal: "arn:aws:iam::123456789012:user/analyst",
      resource: { Database: { Name: "db1" } },
      permissions: ["SELECT"],
    }));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Permissions revoked");
  });

  it("shows revoke error toast on failure", async () => {
    mockRevoke.mockRejectedValueOnce(new Error("busy"));
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Permissions");
    await user.click(await screen.findByRole("button", { name: "Revoke" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "busy"));
  });
});

describe("LakeFormationDashboard — LF-tags tab", () => {
  it("lists LF-tags", async () => {
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "LF-tags");
    expect(await screen.findByText("env")).toBeTruthy();
    expect(screen.getByText("prod, dev")).toBeTruthy();
  });

  it("creates an LF-tag", async () => {
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "LF-tags");
    await user.click(screen.getByRole("button", { name: "Create LF-tag" }));
    await user.type(screen.getByPlaceholderText("environment"), "team");
    await user.type(screen.getByPlaceholderText("prod, dev"), "core, data");
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(mockCreateTag).toHaveBeenCalledWith({
      tagKey: "team",
      tagValues: ["core", "data"],
    }));
    expect(mockShowToast).toHaveBeenCalledWith("success", "LF-tag created");
  });

  it("keeps create disabled without key or values", async () => {
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "LF-tags");
    await user.click(screen.getByRole("button", { name: "Create LF-tag" }));
    expect((screen.getByRole("button", { name: "Create" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows create error toast on failure", async () => {
    mockCreateTag.mockRejectedValueOnce(new Error("exists"));
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "LF-tags");
    await user.click(screen.getByRole("button", { name: "Create LF-tag" }));
    await user.type(screen.getByPlaceholderText("environment"), "team");
    await user.type(screen.getByPlaceholderText("prod, dev"), "core");
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "exists"));
  });

  it("adds a value to an existing LF-tag", async () => {
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "LF-tags");
    await user.click(await screen.findByRole("button", { name: "Add value" }));
    await user.type(screen.getByLabelText("New value"), "staging");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => expect(mockUpdateTag).toHaveBeenCalledWith({
      tagKey: "env",
      tagValuesToAdd: ["staging"],
    }));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Value added");
  });

  it("keeps add-value disabled without input", async () => {
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "LF-tags");
    await user.click(await screen.findByRole("button", { name: "Add value" }));
    expect((screen.getByRole("button", { name: "Add" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows add-value error toast on failure", async () => {
    mockUpdateTag.mockRejectedValueOnce(new Error("nope"));
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "LF-tags");
    await user.click(await screen.findByRole("button", { name: "Add value" }));
    await user.type(screen.getByLabelText("New value"), "staging");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "nope"));
  });

  it("deletes an LF-tag after confirm", async () => {
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "LF-tags");
    await user.click(await screen.findByRole("button", { name: "Delete env" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockDeleteTag).toHaveBeenCalledWith({ tagKey: "env" }));
    expect(mockShowToast).toHaveBeenCalledWith("success", "LF-tag deleted");
  });

  it("shows delete error toast on failure", async () => {
    mockDeleteTag.mockRejectedValueOnce(new Error("locked"));
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "LF-tags");
    await user.click(await screen.findByRole("button", { name: "Delete env" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "locked"));
  });
});

describe("LakeFormationDashboard — empty data fallbacks", () => {
  it("renders em-dashes when data fields are absent", async () => {
    mockResources.mockReturnValue({ data: { resources: [{ resourceArn: "" }], total: 1 }, isLoading: false });
    mockPermissions.mockReturnValue({ data: { principalResourcePermissions: [{ permissions: [] }], total: 1 }, isLoading: false });
    mockLfTags.mockReturnValue({ data: { lfTags: [{ tagKey: "" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Registered resources");
    await waitFor(async () => {
      await clickTab(user, "Permissions");
      await clickTab(user, "LF-tags");
    });
    await waitFor(() => {
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBeGreaterThan(0);
    });
  });

  it("renders empty tables", async () => {
    mockResources.mockReturnValue({ data: { resources: [], total: 0 }, isLoading: false });
    mockLfTags.mockReturnValue({ data: { lfTags: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Registered resources");
    await waitFor(async () => {
      await clickTab(user, "LF-tags");
    });
    await waitFor(() => {
      expect(screen.queryByText("arn:aws:s3:::my-datalake")).toBeNull();
      expect(screen.queryByText("env")).toBeNull();
    });
  });  it("renders fallbacks when hooks return undefined data", async () => {
    mockSettings.mockReturnValue({ data: undefined, isLoading: false });
    mockResources.mockReturnValue({ data: undefined, isLoading: false });
    mockPermissions.mockReturnValue({ data: undefined, isLoading: false });
    mockLfTags.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("tab", { name: "Registered resources" }));
    expect(screen.getByRole("button", { name: "Create registered resource" })).toBeTruthy();
    for (const name of ["Permissions", "LF-tags"]) {
      await user.click(screen.getByRole("tab", { name }));
    }
    expect(screen.getAllByRole("button", { name: "Create LF-tag" }).length).toBeGreaterThan(0);
  });

  it("shows update-role error toast on failure", async () => {
    mockUpdateResource.mockRejectedValueOnce(new Error("bad-role"));
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Registered resources");
    await user.click(await screen.findByRole("button", { name: "Edit role for arn:aws:s3:::my-datalake" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "bad-role"));
  });

  it("shows add-value success toast without error path and covers value-append arm", async () => {
    mockUpdateTag.mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "LF-tags");
    await user.click(await screen.findByRole("button", { name: "Add value" }));
    await user.type(screen.getByLabelText("New value"), "staging");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "Value added"));
  });

  it("dismisses the register modal via Escape and Cancel", async () => {
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Registered resources");
    await user.click(screen.getByRole("button", { name: "Create registered resource" }));
    await user.type(screen.getByPlaceholderText("arn:aws:iam::123456789012:role/lf-role"), "arn:aws:iam::1:role/r");
    await clickInDialog(user, "Cancel");
    await user.click(screen.getByRole("button", { name: "Create registered resource" }));
    await waitFor(() => expect(screen.getByText("Register resource")).toBeTruthy());
    dismissModalWithEscape();
  });

  it("dismisses the edit-role modal via Escape and Cancel", async () => {
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Registered resources");
    await user.click(await screen.findByRole("button", { name: "Edit role for arn:aws:s3:::my-datalake" }));
    await clickInDialog(user, "Cancel");
    await user.click(await screen.findByRole("button", { name: "Edit role for arn:aws:s3:::my-datalake" }));
    dismissModalWithEscape();
    expect(mockShowToast).not.toHaveBeenCalledWith("error", expect.anything());
  });

  it("dismisses the create LF-tag modal via Escape and Cancel", async () => {
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "LF-tags");
    await user.click(screen.getByRole("button", { name: "Create LF-tag" }));
    await user.type(screen.getByPlaceholderText("environment"), "team");
    await clickInDialog(user, "Cancel");
    await user.click(screen.getByRole("button", { name: "Create LF-tag" }));
    dismissModalWithEscape();
    expect(mockCreateTag).not.toHaveBeenCalled();
  });

  it("dismisses the add-value modal via Escape and Cancel", async () => {
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "LF-tags");
    await user.click(await screen.findByRole("button", { name: "Add value" }));
    await user.type(screen.getByLabelText("New value"), "staging");
    await clickInDialog(user, "Cancel");
    await user.click(await screen.findByRole("button", { name: "Add value" }));
    dismissModalWithEscape();
    expect(mockUpdateTag).not.toHaveBeenCalled();
  });  it("shows generic error toasts when the error has no message", async () => {
    mockGrant.mockRejectedValueOnce("boom");
    mockRevoke.mockRejectedValueOnce("boom");
    mockUpdateTag.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Permissions");
    await user.type(screen.getByPlaceholderText("arn:aws:iam::123456789012:user/analyst"), "p");
    await user.click(screen.getByRole("button", { name: "Grant" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to grant permissions"));
    await user.click(await screen.findByRole("button", { name: "Revoke" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to revoke permissions"));
    await clickTab(user, "LF-tags");
    await user.click(await screen.findByRole("button", { name: "Add value" }));
    await user.type(screen.getByLabelText("New value"), "staging");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to add value"));
  });

  it("revokes a permission whose fields are missing", async () => {
    mockPermissions.mockReturnValue({
      data: { principalResourcePermissions: [{ resource: { Table: { Name: "t" } } }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Permissions");
    await screen.findByRole("button", { name: "Revoke" });
    const revokeBtn = screen.getByRole("button", { name: "Revoke" }) as HTMLButtonElement;
    expect(revokeBtn.disabled).toBe(true);
  });

  it("opens edit-role with an empty role and saves undefined", async () => {
    mockResources.mockReturnValue({
      data: { resources: [{ resourceArn: "arn:aws:s3:::bare" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Registered resources");
    await user.click(await screen.findByRole("button", { name: "Edit role for arn:aws:s3:::bare" }));
    await clickInDialog(user, "Save");
    await waitFor(() => expect(mockUpdateResource).toHaveBeenCalledWith({
      resourceArn: "arn:aws:s3:::bare",
      roleArn: undefined,
    }));
  });  it("shows generic error toasts for register/update/deregister/delete-tag failures", async () => {
    mockRegister.mockRejectedValueOnce("boom");
    mockDeregister.mockRejectedValueOnce("boom");
    mockCreateTag.mockRejectedValueOnce("boom");
    mockDeleteTag.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Registered resources");
    await user.click(screen.getByRole("button", { name: "Create registered resource" }));
    await user.type(screen.getAllByRole("textbox")[0], "arn:aws:s3:::x");
    await clickInDialog(user, "Register");
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to register resource"));
    await user.click(await screen.findByRole("button", { name: "Delete arn:aws:s3:::my-datalake" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to deregister resource"));
    await clickTab(user, "LF-tags");
    await user.click(screen.getByRole("button", { name: "Create LF-tag" }));
    await user.type(screen.getByPlaceholderText("environment"), "team");
    await user.type(screen.getByPlaceholderText("prod, dev"), "core");
    await clickInDialog(user, "Create");
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to create LF-tag"));
    await user.click(await screen.findByRole("button", { name: "Delete env" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete LF-tag"));
  });

  it("covers update-resource generic error and revoke-enabled arm", async () => {
    mockUpdateResource.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Registered resources");
    await user.click(await screen.findByRole("button", { name: "Edit role for arn:aws:s3:::my-datalake" }));
    await clickInDialog(user, "Save");
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to update resource"));
    expect(mockShowToast).not.toHaveBeenCalledWith("success", "Resource role updated");
  });  it("renders a permissions row with principal but no permissions array", async () => {
    mockPermissions.mockReturnValue({
      data: { principalResourcePermissions: [{ principal: "arn:aws:iam::1:user/x" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<LakeFormationDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Permissions");
    expect(await screen.findByText("arn:aws:iam::1:user/x")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Revoke" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
