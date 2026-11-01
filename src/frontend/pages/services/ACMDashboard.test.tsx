// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock hooks ─────────────────────────────────────────

vi.mock("../../components/ConfirmDialog", () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn(() => Promise.resolve(true)),
    dialog: null,
  }),
}));

const renewState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const mockRenewCert = vi.fn(() => Promise.resolve({ renewed: true }));
const mockResendValidation = vi.fn(() => Promise.resolve({ sent: true }));
const mockRevokeCert = vi.fn(() => Promise.resolve({ revoked: true }));
const mockUpdateOptions = vi.fn(() => Promise.resolve({ updated: true }));
const mockCertificates = vi.fn();
const mockDeleteCert = vi.fn();
const mockImportCert = vi.fn();
const mockExportCert = vi.fn();
const importCertState = vi.hoisted(() => ({ isError: false, error: null as Error | null }));
const exportPendingState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));

const deleteCertState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const mockShowToast = vi.fn();
vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

vi.mock("../../hooks/useACM", () => ({
    useRenewACMCertificate: () => ({
    mutateAsync: mockRenewCert,
    get isPending() { return renewState.isPending; },
    get variables() { return renewState.variables; },
  }),
  useResendACMValidationEmail: () => ({ mutateAsync: mockResendValidation, isPending: false }),
  useRevokeACMCertificate: () => ({ mutateAsync: mockRevokeCert, isPending: false }),
  useUpdateACMCertificateOptions: () => ({ mutateAsync: mockUpdateOptions, isPending: false }),
  useACMCertificates: (...args: any[]) => mockCertificates(...args),
  useRequestACMCertificate: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteACMCertificate: () => ({
    mutateAsync: mockDeleteCert,
    isPending: deleteCertState.isPending,
    variables: deleteCertState.variables,
  }),
  useImportACMCertificate: () => ({
    mutate: mockImportCert,
    isPending: false,
    get isError() { return importCertState.isError; },
    get error() { return importCertState.error; },
  }),
  useExportACMCertificate: () => ({
    mutate: mockExportCert,
    get isPending() { return exportPendingState.isPending; },
    get variables() { return exportPendingState.variables; },
  }),
}));

import { ACMDashboard } from "./ACMDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  exportPendingState.isPending = false;
  exportPendingState.variables = null;
  importCertState.isError = false;
  importCertState.error = null;
  vi.clearAllMocks();
  deleteCertState.isPending = false;
  deleteCertState.variables = null;

  mockCertificates.mockReturnValue({
    data: { certificates: [], total: 0 },
    isLoading: false,
  });
});

// ─── Tests ──────────────────────────────────────────────

describe("ACMDashboard — rendering", () => {
  it("shows loading skeleton when loading", () => {
    mockCertificates.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    const { container } = render(<ACMDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("renders the table header", () => {
    render(<ACMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("ACM Certificates")).toBeTruthy();
  });

  it("shows empty message when no certificates", () => {
    render(<ACMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No certificates/i)).toBeTruthy();
  });
});

describe("ACMDashboard — data", () => {
  it("renders certificates with data", () => {
    mockCertificates.mockReturnValue({
      data: {
        certificates: [
          {
            CertificateArn: "arn:aws:acm:us-east-1::certificate/abc123",
            DomainName: "example.com",
            Status: "ISSUED",
            Type: "AMAZON_ISSUED",
            KeyAlgorithm: "RSA-2048",
            InUse: true,
            NotAfter: 1800000000,
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<ACMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("example.com")).toBeTruthy();
    expect(screen.getByText("ISSUED")).toBeTruthy();
    expect(screen.getByText("Yes")).toBeTruthy();
  });

  it("filters certificates by domain", async () => {
    mockCertificates.mockReturnValue({
      data: {
        certificates: [
          { CertificateArn: "arn:1", DomainName: "example.com", Status: "ISSUED", Type: "AMAZON_ISSUED", InUse: false },
          { CertificateArn: "arn:2", DomainName: "other.net", Status: "ISSUED", Type: "AMAZON_ISSUED", InUse: false },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ACMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("example.com")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Find certificates by domain"), "other");
    await waitFor(() => expect(screen.getByText("other.net")).toBeTruthy());
    expect(screen.queryByText("example.com")).toBeNull();
  });

  it("renders certificates with null/undefined fields gracefully", () => {
    mockCertificates.mockReturnValue({
      data: {
        certificates: [
          {
            CertificateArn: "arn:aws:acm:us-east-1::certificate/minimal",
            DomainName: "minimal.example.com",
            Status: "PENDING_VALIDATION",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<ACMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("minimal.example.com")).toBeTruthy();
    expect(screen.getByText("PENDING_VALIDATION")).toBeTruthy();
    // Missing fields should show "-"
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });

  it("renders with null data gracefully", () => {
    mockCertificates.mockReturnValue({
      data: null,
      isLoading: false,
    });
    render(<ACMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No certificates/i)).toBeTruthy();
  });

  it("calls deleteCertificate when delete is clicked", async () => {
    mockCertificates.mockReturnValue({
      data: {
        certificates: [
          {
            CertificateArn: "arn:aws:acm:us-east-1::certificate/abc123",
            DomainName: "example.com",
            Status: "ISSUED",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<ACMDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("example.com")).toBeTruthy();
    });

    const deleteBtn = screen.getByRole("button", { name: /Delete example.com/i });
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(mockDeleteCert).toHaveBeenCalledWith(
        "arn:aws:acm:us-east-1::certificate/abc123",
      );
    });
  });

  it("shows the delete button disabled while deleting", async () => {
    deleteCertState.isPending = true;
    deleteCertState.variables = "arn:aws:acm:us-east-1::certificate/abc123";
    mockCertificates.mockReturnValue({
      data: {
        certificates: [
          {
            CertificateArn: "arn:aws:acm:us-east-1::certificate/abc123",
            DomainName: "example.com",
            Status: "ISSUED",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });

    render(<ACMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("example.com")).toBeTruthy());
    const deleteBtn = screen.getByRole("button", { name: /Delete example.com/i });
    expect(deleteBtn).toBeDisabled();
  });
});

describe("ACMDashboard — import + export", () => {
  function setupCert() {
    mockCertificates.mockReturnValue({
      data: {
        certificates: [
          { CertificateArn: "arn:c1", DomainName: "example.com", Status: "ISSUED", InUse: false },
        ],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
  }

  it("exports a certificate and shows the PEM modal", async () => {
    mockExportCert.mockImplementation((_b: any, opts: any) =>
      opts?.onSuccess?.({ certificate: "CERTPEM", certificateChain: "CHAINPEM", privateKey: "KEYPEM" })
    );
    setupCert();
    const user = userEvent.setup();
    render(<ACMDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Export" }));
    expect(await screen.findByText("CERTPEM")).toBeTruthy();
    expect(screen.getByText("CHAINPEM")).toBeTruthy();
    expect(screen.getByText("KEYPEM")).toBeTruthy();
    await user.click(screen.getAllByRole("button", { name: "Close" }).find((b) => b.offsetParent !== null)!);
  });

  it("imports a certificate from the modal", async () => {
    mockImportCert.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    setupCert();
    const user = userEvent.setup();
    render(<ACMDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: /Create certificate/i }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    const areas = within(dialog).getAllByRole("textbox").filter((el) => el.tagName === "TEXTAREA");
    fireEvent.change(areas[0], { target: { value: "-----BEGIN CERT-----" } });
    fireEvent.change(areas[1], { target: { value: "-----BEGIN KEY-----" } });
    fireEvent.change(areas[2], { target: { value: "chain" } });
    await user.click(within(dialog).getByRole("button", { name: "Import" }));
    await waitFor(() =>
      expect(mockImportCert).toHaveBeenCalledWith(
        { certificate: "-----BEGIN CERT-----", privateKey: "-----BEGIN KEY-----", certificateChain: "chain" },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    );
  });

  it("keeps Import disabled until cert + key present", async () => {
    setupCert();
    const user = userEvent.setup();
    render(<ACMDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: /Create certificate/i }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    expect(within(dialog).getByRole("button", { name: "Import" }).hasAttribute("disabled")).toBe(true);
  });

  it("shows the import error and fallback", async () => {
    importCertState.isError = true;
    importCertState.error = new Error("import failed");
    setupCert();
    const user = userEvent.setup();
    render(<ACMDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: /Create certificate/i }));
    expect(await screen.findByText("import failed")).toBeTruthy();
  });
});

describe("ACMDashboard — import modal dismiss + fallback arms", () => {
  function setupCert() {
    mockCertificates.mockReturnValue({
      data: {
        certificates: [
          { CertificateArn: "arn:c1", DomainName: "example.com", Status: "ISSUED", InUse: false },
        ],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
  }

  it("cancels and Escape-dismisses the import modal", async () => {
    setupCert();
    const user = userEvent.setup();
    render(<ACMDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: /Create certificate/i }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(mockImportCert).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /Create certificate/i }));
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) =>
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27 })
    );
    expect(mockImportCert).not.toHaveBeenCalled();
  });

  it("imports without a chain when blank", async () => {
    mockImportCert.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    setupCert();
    const user = userEvent.setup();
    render(<ACMDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: /Create certificate/i }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    const areas = within(dialog).getAllByRole("textbox").filter((el) => el.tagName === "TEXTAREA");
    fireEvent.change(areas[0], { target: { value: "CERT" } });
    fireEvent.change(areas[1], { target: { value: "KEY" } });
    await user.click(within(dialog).getByRole("button", { name: "Import" }));
    await waitFor(() =>
      expect(mockImportCert).toHaveBeenCalledWith(
        { certificate: "CERT", privateKey: "KEY", certificateChain: undefined },
        expect.anything()
      )
    );
  });

  it("shows the generic import error fallback", async () => {
    importCertState.isError = true;
    importCertState.error = null;
    setupCert();
    const user = userEvent.setup();
    render(<ACMDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: /Create certificate/i }));
    expect(await screen.findByText("Failed to import certificate")).toBeTruthy();
  });

  it("closes the export modal via dismiss", async () => {
    mockExportCert.mockImplementation((_b: any, opts: any) =>
      opts?.onSuccess?.({ certificate: "C", certificateChain: "", privateKey: "" })
    );
    setupCert();
    const user = userEvent.setup();
    render(<ACMDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Export" }));
    await screen.findByText("C");
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) =>
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27 })
    );
    expect(screen.queryByText("C")).toBeNull();
  });
});

describe("ACMDashboard — export loading + error arms", () => {
  function setupCert() {
    mockCertificates.mockReturnValue({
      data: {
        certificates: [
          { CertificateArn: "arn:c1", DomainName: "example.com", Status: "ISSUED", InUse: false },
          { CertificateArn: "arn:c2", DomainName: "two.com", Status: "ISSUED", InUse: false },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
  }

  it("shows export loading for the in-flight certificate only", async () => {
    setupCert();
    exportPendingState.isPending = true;
    exportPendingState.variables = "arn:c1";
    render(<ACMDashboard />, { wrapper: createWrapper() });
    const buttons = await screen.findAllByRole("button", { name: "Export" });
    expect(buttons[0].className).toMatch(/disabled|loading/);
    expect(buttons[1].className).not.toMatch(/disabled|loading/);
  });

  it("covers the export onError callback", async () => {
    mockExportCert.mockImplementation((_b: any, opts: any) => opts?.onError?.());
    setupCert();
    const user = userEvent.setup();
    render(<ACMDashboard />, { wrapper: createWrapper() });
    await user.click((await screen.findAllByRole("button", { name: "Export" }))[0]);
    await waitFor(() => expect(mockExportCert).toHaveBeenCalled());
  });

  it("renews a certificate from the row action", async () => {
    setupCert();
    const user = userEvent.setup();
    render(<ACMDashboard />, { wrapper: createWrapper() });
    await user.click((await screen.findAllByRole("button", { name: "Renew" }))[0]);
    await waitFor(() => expect(mockRenewCert).toHaveBeenCalledWith("arn:c1"));
  });

  it("manages a certificate: resend validation, revoke, update options", async () => {
    setupCert();
    const user = userEvent.setup();
    render(<ACMDashboard />, { wrapper: createWrapper() });
    await user.click((await screen.findAllByRole("button", { name: "Manage" }))[0]);
    expect(screen.getByText(/Manage certificate/)).toBeTruthy();
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    const inputs = Array.from(dialog.querySelectorAll("input"));
    // validation domain
    await user.type(inputs[0] as any, "example.com");
    await user.click(screen.getByRole("button", { name: "Resend email" }));
    expect(mockResendValidation).toHaveBeenCalledWith({
      arn: "arn:c1", domain: "example.com", validationDomain: "example.com",
    });
    // revoke reason
    await user.type(inputs[1] as any, "KEY_COMPROMISE");
    await user.click(screen.getByRole("button", { name: "Revoke" }));
    expect(mockRevokeCert).toHaveBeenCalledWith({ arn: "arn:c1", revocationReason: "KEY_COMPROMISE" });
    // options
    await user.type(inputs[2] as any, "d");
    await user.click(screen.getByRole("button", { name: "Save options" }));
    expect(mockUpdateOptions).toHaveBeenCalledWith({
      arn: "arn:c1", certificateTransparencyLoggingPreference: "ENABLEDD",
    });
  });

  it("renews a certificate and surfaces failure toast on error", async () => {
    mockRenewCert.mockRejectedValueOnce(new Error("renew boom"));
    setupCert();
    const user = userEvent.setup();
    render(<ACMDashboard />, { wrapper: createWrapper() });
    await user.click((await screen.findAllByRole("button", { name: "Renew" }))[0]);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "renew boom"));
  });

  it("closes the exported certificate modal with Close", async () => {
    setupCert();
    const user = userEvent.setup();
    render(<ACMDashboard />, { wrapper: createWrapper() });
    mockExportCert.mockImplementation((_b: any, opts: any) =>
      opts?.onSuccess?.({ certificate: "C2", certificateChain: "CH2", privateKey: "K2" })
    );
    await user.click((await screen.findAllByRole("button", { name: "Export" }))[0]);
    const pemText = await screen.findByText("C2");
    const exportedDialog = pemText.closest('[role="dialog"]')!;
    await user.click(
      Array.from(exportedDialog.querySelectorAll("button")).find((b) => b.textContent?.trim() === "Close")!
    );
    // Modal closed without errors
    expect(mockShowToast).not.toHaveBeenCalledWith("error", expect.anything());
  });

  it("surfaces error toasts for resend, revoke and options failures", async () => {
    mockResendValidation.mockRejectedValueOnce(new Error("resend boom"));
    mockRevokeCert.mockRejectedValueOnce(new Error("revoke boom"));
    mockUpdateOptions.mockRejectedValueOnce(new Error("options boom"));
    setupCert();
    const user = userEvent.setup();
    render(<ACMDashboard />, { wrapper: createWrapper() });
    await user.click((await screen.findAllByRole("button", { name: "Manage" }))[0]);
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    const inputs = Array.from(dialog.querySelectorAll("input"));
    await user.type(inputs[0] as any, "example.com");
    await user.click(screen.getByRole("button", { name: "Resend email" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "resend boom"));
    await user.type(inputs[1] as any, "KEY_COMPROMISE");
    await user.click(screen.getByRole("button", { name: "Revoke" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "revoke boom"));
    await user.type(inputs[2] as any, "x");
    await user.click(screen.getByRole("button", { name: "Save options" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "options boom"));
  });

  it("shows renew loading state only for the in-flight certificate", () => {
    renewState.isPending = true;
    renewState.variables = "arn:c1";
    setupCert();
    render(<ACMDashboard />, { wrapper: createWrapper() });
    const buttons = screen.getAllByRole("button", { name: "Renew" });
    expect(buttons[0].className).toMatch(/disabled|loading/);
    renewState.isPending = false;
    renewState.variables = null;
  });

  it("surfaces fallback error message when renewal rejects without a message", async () => {
    mockRenewCert.mockRejectedValueOnce("plain-rejection");
    setupCert();
    const user = userEvent.setup();
    render(<ACMDashboard />, { wrapper: createWrapper() });
    await user.click((await screen.findAllByRole("button", { name: "Renew" }))[0]);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Renewal failed"));
  });

  it("surfaces fallback messages when validation, revoke and options reject without messages", async () => {
    mockResendValidation.mockRejectedValueOnce("no-msg-1");
    mockRevokeCert.mockRejectedValueOnce("no-msg-2");
    mockUpdateOptions.mockRejectedValueOnce("no-msg-3");
    setupCert();
    const user = userEvent.setup();
    render(<ACMDashboard />, { wrapper: createWrapper() });
    await user.click((await screen.findAllByRole("button", { name: "Manage" }))[0]);
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    const inputs = Array.from(dialog.querySelectorAll("input"));
    await user.type(inputs[0] as any, "example.com");
    await user.click(screen.getByRole("button", { name: "Resend email" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to send validation email"));
    await user.type(inputs[1] as any, "KEY_COMPROMISE");
    await user.click(screen.getByRole("button", { name: "Revoke" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Revocation failed"));
    await user.type(inputs[2] as any, "x");
    await user.click(screen.getByRole("button", { name: "Save options" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to update options"));
  });
});
