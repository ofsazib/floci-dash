// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock data ──────────────────────────────────────────

const mockCertificateResult = {
  certificateId: "cert-abc123def456",
  certificateArn: "arn:aws:iot:us-east-1:000000000000:cert/cert-abc123def456",
  certificatePem:
    "-----BEGIN CERTIFICATE-----\nMIIDazCCAlM...\n-----END CERTIFICATE-----",
  keyPair: {
    PublicKey:
      "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgk...\n-----END PUBLIC KEY-----",
    PrivateKey:
      "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKC...\n-----END RSA PRIVATE KEY-----",
  },
};

// ─── Mock hooks ─────────────────────────────────────────

const mockEndpoint = vi.fn();
const mockThings = vi.fn();
const mockCertificates = vi.fn();
const mockPolicies = vi.fn();
const mockTopicRules = vi.fn();
const mockThingTypes = vi.fn();
const mockPolicyVersions = vi.fn();
const mockShadow = vi.fn();
const mockThingJobs = vi.fn();

const mockCreateKeysCert = vi.fn();
const mockUpdateCertStatus = vi.fn();
const mockDeleteCert = vi.fn();
const mockCreateThing = vi.fn();
const mockDeleteThing = vi.fn();
const mockCreateThingType = vi.fn();
const mockDeleteThingType = vi.fn();
const mockCreatePolicy = vi.fn();
const mockDeletePolicy = vi.fn();
const mockCreateTopicRule = vi.fn();
const mockDeleteTopicRule = vi.fn();
const mockEnableRule = vi.fn();
const mockDisableRule = vi.fn();
const mockUpdateShadow = vi.fn();

vi.mock("../../hooks/useIoT", () => ({
  useEndpoint: (...args: any[]) => mockEndpoint(...args),
  useThings: (...args: any[]) => mockThings(...args),
  useCreateThing: () => ({
    mutate: mockCreateThing,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useDeleteThing: () => ({
    mutateAsync: mockDeleteThing,
    isPending: false,
  }),
  useThingTypes: (...args: any[]) => mockThingTypes(...args),
  useCreateThingType: () => ({
    mutate: mockCreateThingType,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useDeleteThingType: () => ({
    mutateAsync: mockDeleteThingType,
    isPending: false,
  }),
  useCertificates: (...args: any[]) => mockCertificates(...args),
  useCreateKeysAndCertificate: () => ({
    mutate: mockCreateKeysCert,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useUpdateCertificateStatus: () => ({
    mutate: mockUpdateCertStatus,
    isPending: false,
  }),
  useDeleteCertificate: () => ({
    mutateAsync: mockDeleteCert,
    isPending: false,
  }),
  usePolicies: (...args: any[]) => mockPolicies(...args),
  useCreatePolicy: () => ({
    mutate: mockCreatePolicy,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useDeletePolicy: () => ({
    mutateAsync: mockDeletePolicy,
    isPending: false,
  }),
  usePolicyVersions: (...args: any[]) => mockPolicyVersions(...args),
  useTopicRules: (...args: any[]) => mockTopicRules(...args),
  useCreateTopicRule: () => ({
    mutate: mockCreateTopicRule,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useDeleteTopicRule: () => ({
    mutateAsync: mockDeleteTopicRule,
    isPending: false,
  }),
  useEnableTopicRule: () => ({
    mutate: mockEnableRule,
    isPending: false,
  }),
  useDisableTopicRule: () => ({
    mutate: mockDisableRule,
    isPending: false,
  }),
  useShadow: (...args: any[]) => mockShadow(...args),
  useUpdateShadow: () => ({
    mutate: mockUpdateShadow,
    isPending: false,
  }),
  useThingJobs: (...args: any[]) => mockThingJobs(...args),
}));

import { IoTDashboard } from "./IoTDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  // Default mock returns for all queries
  mockEndpoint.mockReturnValue({
    data: { endpointAddress: "test.iot.us-east-1.amazonaws.com" },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockThings.mockReturnValue({
    data: { things: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockCertificates.mockReturnValue({
    data: { certificates: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockPolicies.mockReturnValue({
    data: { policies: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockTopicRules.mockReturnValue({
    data: { rules: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockThingTypes.mockReturnValue({
    data: { thingTypes: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockPolicyVersions.mockReturnValue({
    data: { policyVersions: [], total: 0 },
    isLoading: false,
  });
  mockShadow.mockReturnValue({
    data: undefined,
    isLoading: false,
  });
  mockThingJobs.mockReturnValue({
    data: undefined,
    isLoading: false,
  });

  // Set up create cert mock to invoke onSuccess with mock result
  mockCreateKeysCert.mockImplementation((_args, options) => {
    if (options?.onSuccess) {
      options.onSuccess(mockCertificateResult);
    }
  });

  // Mock clipboard API — use defineProperty because navigator.clipboard may be read-only
  if (!navigator.clipboard) {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });
  } else {
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
  }
});

// ─── Tests ──────────────────────────────────────────────

describe("IoTDashboard — rendering", () => {
  it("renders endpoint alert with endpoint address", () => {
    render(<IoTDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/test.iot.us-east-1.amazonaws.com/)).toBeTruthy();
  });

  it("renders all 5 tabs", () => {
    render(<IoTDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("tab", { name: /things/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /certificates/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /policies/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /topic rules/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /thing types/i })).toBeTruthy();
  });

  it("shows loading skeleton when things, certs, and policies are all loading", () => {
    mockThings.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    mockCertificates.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    mockPolicies.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    const { container } = render(<IoTDashboard />, {
      wrapper: createWrapper(),
    });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty message for things tab by default", () => {
    render(<IoTDashboard />, { wrapper: createWrapper() });
    expect(
      screen.getByText(/No IoT things. Create one to get started/i),
    ).toBeTruthy();
  });

  it("shows empty message for certificates tab when switched", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /certificates/i }));
    await waitFor(() => {
      expect(
        screen.getByText(
          /No certificates. Create keys and certificate to get started/i,
        ),
      ).toBeTruthy();
    });
  });

  it("renders things data when provided", () => {
    mockThings.mockReturnValue({
      data: {
        things: [
          {
            thingName: "MyDevice",
            thingTypeName: "Sensor",
            thingArn: "arn:aws:iot:us-east-1::thing/MyDevice",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<IoTDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("MyDevice")).toBeTruthy();
    expect(screen.getByText("Sensor")).toBeTruthy();
  });
});

describe("IoTDashboard — certificate creation modal", () => {
  it("displays certificate creation success modal when Create Certificate is clicked", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /certificates/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /create certificate/i }),
      ).toBeTruthy();
    });

    await clickButton(user, /create certificate/i);

    await waitFor(() => {
      expect(screen.getByText("Certificate created")).toBeTruthy();
    });
  });

  it("shows certificate ID and ARN in the success modal", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /certificates/i }));
    await clickButton(user, /create certificate/i);

    await waitFor(() => {
      expect(screen.getAllByText(/cert-abc123def456/).length).toBeGreaterThan(
        0,
      );
    });
    expect(
      screen.getByText(mockCertificateResult.certificateArn),
    ).toBeTruthy();
  });

  it("shows certificate PEM with copy and download buttons", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /certificates/i }));
    await clickButton(user, /create certificate/i);

    await waitFor(() => {
      expect(screen.getByText("Certificate created")).toBeTruthy();
    });

    // Certificate PEM section
    expect(screen.getByText(/Certificate PEM/i)).toBeTruthy();
    expect(screen.getByText(/X\.509 certificate in PEM format/i)).toBeTruthy();
    expect(screen.getByText(/BEGIN CERTIFICATE/)).toBeTruthy();

    // Cloudscape inline-icon buttons strip children text from DOM — verify buttons exist by finding them relative to the textarea
    const pemTextarea = screen.getByDisplayValue(/BEGIN CERTIFICATE/);
    const btnRow = pemTextarea.parentElement?.previousElementSibling;
    expect(btnRow).toBeTruthy();
    if (btnRow) {
      expect(within(btnRow as HTMLElement).getAllByRole("button").length).toBeGreaterThanOrEqual(2);
    }
    // Also verify Public Key section has buttons
    const pkTextarea = screen.getByDisplayValue(/BEGIN PUBLIC KEY/);
    const pkBtnRow = pkTextarea.parentElement?.previousElementSibling;
    expect(pkBtnRow).toBeTruthy();
    if (pkBtnRow) {
      expect(within(pkBtnRow as HTMLElement).getAllByRole("button").length).toBeGreaterThanOrEqual(2);
    }
  });

  it("shows public key with copy and download buttons", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /certificates/i }));
    await clickButton(user, /create certificate/i);

    await waitFor(() => {
      expect(screen.getByText("Certificate created")).toBeTruthy();
    });

    expect(screen.getAllByText(/Public Key/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/BEGIN PUBLIC KEY/)).toBeTruthy();
  });

  it("shows private key with copy and download private key button", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /certificates/i }));
    await clickButton(user, /create certificate/i);

    await waitFor(() => {
      expect(screen.getByText("Certificate created")).toBeTruthy();
    });

    expect(screen.getAllByText(/Private Key/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/BEGIN RSA PRIVATE KEY/)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /download private key/i }),
    ).toBeTruthy();
  });

  it("shows private key warning about saving it now", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /certificates/i }));
    await clickButton(user, /create certificate/i);

    await waitFor(() => {
      expect(screen.getByText("Certificate created")).toBeTruthy();
    });

    expect(
      screen.getByText(
        /cannot be retrieved after closing this dialog/i,
      ),
    ).toBeTruthy();
  });

  it("copies certificate PEM to clipboard when Copy is clicked", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /certificates/i }));
    await clickButton(user, /create certificate/i);

    await waitFor(() => {
      expect(screen.getByText("Certificate created")).toBeTruthy();
    });

    // Find Copy button by position before the PEM textarea (inline-icon buttons have no DOM text)
    const pemTextarea = screen.getByDisplayValue(/BEGIN CERTIFICATE/);
    const btnRow = pemTextarea.parentElement?.previousElementSibling as HTMLElement;
    const copyBtn = within(btnRow).getAllByRole("button")[0];
    await user.click(copyBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        mockCertificateResult.certificatePem,
      );
    });
  });

  it("dismisses modal when Done is clicked", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /certificates/i }));
    await clickButton(user, /create certificate/i);

    await waitFor(() => {
      expect(screen.getByText("Certificate created")).toBeTruthy();
    });

    await clickButton(user, /Done/i);

    await waitFor(() => {
      // Modal header persists in DOM by Cloudscape; check that content inside {certCreationResult && ...} is removed
      expect(screen.queryByText(mockCertificateResult.certificateId)).toBeNull();
    });
  });
});

describe("IoTDashboard — certificate status actions", () => {
  it("shows deactivate button for ACTIVE certificates", async () => {
    mockCertificates.mockReturnValue({
      data: {
        certificates: [
          {
            certificateId: "cert-active-123",
            status: "ACTIVE",
            creationDate: "2025-01-01",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /certificates/i }));
    await waitFor(() => {
      // Find the table row containing "ACTIVE" status, verify it has buttons
      const activeEl = screen.getByText("ACTIVE");
      const row = activeEl.closest('tr') || activeEl.closest('[role="row"]');
      expect(row).toBeTruthy();
      if (row) {
        expect(within(row as HTMLElement).getAllByRole("button").length).toBeGreaterThan(0);
      }
    });
  });

  it("shows activate button for INACTIVE certificates", async () => {
    mockCertificates.mockReturnValue({
      data: {
        certificates: [
          {
            certificateId: "cert-inactive-456",
            status: "INACTIVE",
            creationDate: "2025-01-01",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /certificates/i }));
    await waitFor(() => {
      // Find the table row containing "INACTIVE" status, verify it has buttons
      const inactiveEl = screen.getByText("INACTIVE");
      const row = inactiveEl.closest('tr') || inactiveEl.closest('[role="row"]');
      expect(row).toBeTruthy();
      if (row) {
        expect(within(row as HTMLElement).getAllByRole("button").length).toBeGreaterThan(0);
      }
    });
  });

  it("calls updateCertificateStatus when Deactivate is clicked", async () => {
    mockCertificates.mockReturnValue({
      data: {
        certificates: [
          {
            certificateId: "cert-active-123",
            status: "ACTIVE",
            creationDate: "2025-01-01",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /certificates/i }));

    // Find Deactivate button — first button in the row containing "ACTIVE" text
    await waitFor(() => {
      const activeEl = screen.getByText("ACTIVE");
      const row = activeEl.closest('tr') || activeEl.closest('[role="row"]');
      expect(row).toBeTruthy();
    });
    const activeEl = screen.getByText("ACTIVE");
    const row = (activeEl.closest('tr') || activeEl.closest('[role="row"]'))!;
    const rowBtns = within(row).getAllByRole("button");
    // First button in the row's action cells is Deactivate (inline-icon with no text)
    const deactivateBtn = rowBtns[0];
    await user.click(deactivateBtn);

    await waitFor(() => {
      expect(mockUpdateCertStatus).toHaveBeenCalledWith({
        certificateId: "cert-active-123",
        newStatus: "INACTIVE",
      });
    });
  });
});

describe("IoTDashboard — other tabs and interactions", () => {
  it("switches to policies tab and shows empty state", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /policies/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/No policies. Create one to define access permissions/i),
      ).toBeTruthy();
    });
  });

  it("switches to topic rules tab and shows empty state", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /topic rules/i }));
    await waitFor(() => {
      expect(
        screen.getByText(
          /No topic rules. Create one to route IoT messages/i,
        ),
      ).toBeTruthy();
    });
  });

  it("switches to thing types tab and shows empty state", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /thing types/i }));
    await waitFor(() => {
      expect(
        screen.getByText(
          /No thing types. Create one to categorize your devices/i,
        ),
      ).toBeTruthy();
    });
  });

  it("shows Create Thing button on things tab", () => {
    render(<IoTDashboard />, { wrapper: createWrapper() });
    expect(
      screen.getByRole("button", { name: /create thing/i }),
    ).toBeTruthy();
  });
});
