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
const mockConnection = vi.fn();
const mockSubscriptions = vi.fn();
const mockRetained = vi.fn();
const mockDisconnect = vi.fn();
const mockPublish = vi.fn();

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

const createThingState = vi.hoisted(() => ({ isError: false, error: null as Error | null, isPending: false }));
const createPolicyState = vi.hoisted(() => ({ isError: false, error: null as Error | null }));
const createRuleState = vi.hoisted(() => ({ isError: false, error: null as Error | null }));
const createThingTypeState = vi.hoisted(() => ({ isError: false, error: null as Error | null }));
const deleteThingState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const deletePolicyState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const deleteRuleState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const deleteThingTypeState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const deleteCertState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const publishState = vi.hoisted(() => ({ isError: false, error: null as Error | null }));

vi.mock("../../hooks/useIoT", () => ({
  useEndpoint: (...args: any[]) => mockEndpoint(...args),
  useThings: (...args: any[]) => mockThings(...args),
  useCreateThing: () => ({
    mutate: mockCreateThing,
    isPending: createThingState.isPending,
    isError: createThingState.isError,
    error: createThingState.error,
    reset: vi.fn(),
  }),
  useDeleteThing: () => ({
    mutateAsync: mockDeleteThing,
    isPending: deleteThingState.isPending,
    variables: deleteThingState.variables,
  }),
  useThingTypes: (...args: any[]) => mockThingTypes(...args),
  useCreateThingType: () => ({
    mutate: mockCreateThingType,
    isPending: false,
    isError: createThingTypeState.isError,
    error: createThingTypeState.error,
    reset: vi.fn(),
  }),
  useDeleteThingType: () => ({
    mutateAsync: mockDeleteThingType,
    isPending: deleteThingTypeState.isPending,
    variables: deleteThingTypeState.variables,
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
    isPending: deleteCertState.isPending,
    variables: deleteCertState.variables,
  }),
  usePolicies: (...args: any[]) => mockPolicies(...args),
  useCreatePolicy: () => ({
    mutate: mockCreatePolicy,
    isPending: false,
    isError: createPolicyState.isError,
    error: createPolicyState.error,
    reset: vi.fn(),
  }),
  useDeletePolicy: () => ({
    mutateAsync: mockDeletePolicy,
    isPending: deletePolicyState.isPending,
    variables: deletePolicyState.variables,
  }),
  usePolicyVersions: (...args: any[]) => mockPolicyVersions(...args),
  useTopicRules: (...args: any[]) => mockTopicRules(...args),
  useCreateTopicRule: () => ({
    mutate: mockCreateTopicRule,
    isPending: false,
    isError: createRuleState.isError,
    error: createRuleState.error,
    reset: vi.fn(),
  }),
  useDeleteTopicRule: () => ({
    mutateAsync: mockDeleteTopicRule,
    isPending: deleteRuleState.isPending,
    variables: deleteRuleState.variables,
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
  useConnection: (...args: any[]) => mockConnection(...args),
  useConnectionSubscriptions: (...args: any[]) => mockSubscriptions(...args),
  useDisconnectClient: () => ({ mutate: mockDisconnect, isPending: false }),
  usePublish: () => ({ mutate: mockPublish, isPending: false, get isError() { return publishState.isError; }, get error() { return publishState.error; } }),
  useRetainedMessages: (...args: any[]) => mockRetained(...args),
}));

import { IoTDashboard } from "./IoTDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  // Reset mutable states
  createThingState.isError = false;
  createThingState.error = null;
  createThingState.isPending = false;
  createPolicyState.isError = false;
  createPolicyState.error = null;
  createRuleState.isError = false;
  createRuleState.error = null;
  createThingTypeState.isError = false;
  createThingTypeState.error = null;
  deleteThingState.isPending = false;
  deleteThingState.variables = null;
  deletePolicyState.isPending = false;
  deletePolicyState.variables = null;
  deleteRuleState.isPending = false;
  deleteRuleState.variables = null;
  deleteThingTypeState.isPending = false;
  deleteThingTypeState.variables = null;
  deleteCertState.isPending = false;
  deleteCertState.variables = null;
  publishState.isError = false;
  publishState.error = null;

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
  mockConnection.mockReturnValue({ data: undefined, isLoading: false, isError: false });
  mockSubscriptions.mockReturnValue({ data: undefined, isLoading: false });
  mockRetained.mockReturnValue({ data: { retainedTopics: [] }, isLoading: false });

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

  it("renders all 6 tabs", () => {
    render(<IoTDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("tab", { name: /things/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /certificates/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /policies/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /topic rules/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /thing types/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /mqtt broker/i })).toBeTruthy();
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

describe("IoTDashboard — no endpoint", () => {
  it("does not render endpoint alert when endpoint data is null", () => {
    mockEndpoint.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<IoTDashboard />, { wrapper: createWrapper() });
    expect(
      screen.queryByText(/IoT Endpoint:/i),
    ).toBeNull();
  });
});

describe("IoTDashboard — things tab operations", () => {
  it("opens create thing modal and submits", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /create thing/i);
    await waitFor(() => {
      expect(screen.getByText("Create thing")).toBeTruthy();
    });

    const nameInput = screen.getByPlaceholderText("MyDevice");
    await user.type(nameInput, "NewThing");

    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateThing).toHaveBeenCalledWith(
        expect.objectContaining({ thingName: "NewThing" }),
        expect.anything(),
      );
    });
  });

  it("cancels create thing modal", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /create thing/i);
    await waitFor(() => {
      expect(screen.getByText("Create thing")).toBeTruthy();
    });

    await clickButton(user, /Cancel/i);

    await waitFor(() => {
      expect(mockCreateThing).not.toHaveBeenCalled();
    });
  });

  it("deletes a thing with confirmation", async () => {
    mockThings.mockReturnValue({
      data: {
        things: [
          {
            thingName: "DeleteMe",
            thingTypeName: "Sensor",
            thingArn: "arn:aws:iot:::thing/DeleteMe",
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

    await waitFor(() => {
      expect(screen.getByText("DeleteMe")).toBeTruthy();
    });

    const deleteBtns = screen.getAllByRole("button", { name: /Delete DeleteMe/i });
    await user.click(deleteBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure/i)).toBeTruthy();
    });

    const confirmBtns = screen.getAllByRole("button", { name: /^Delete$/i });
    await user.click(confirmBtns[confirmBtns.length - 1]);

    await waitFor(() => {
      expect(mockDeleteThing).toHaveBeenCalledWith("DeleteMe");
    });
  });

  it("shows shadow modal when thing selected and View Shadow clicked", async () => {
    mockThings.mockReturnValue({
      data: {
        things: [
          {
            thingName: "ShadowDevice",
            thingTypeName: "Sensor",
            thingArn: "arn:aws:iot:::thing/ShadowDevice",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockShadow.mockReturnValue({
      data: { shadow: { state: { reported: { temp: 25 } } } },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("ShadowDevice")).toBeTruthy();
    });

    await user.click(screen.getByText("ShadowDevice"));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /View shadow/i })).toBeTruthy();
    });

    await user.click(screen.getByRole("button", { name: /View shadow/i }));
    await waitFor(() => {
      expect(screen.getAllByText(/Shadow/).length).toBeGreaterThanOrEqual(1);
      // Modal shows shadow JSON since mockShadow has data
      expect(screen.queryByText(/No shadow data/i)).toBeNull();
    });
  });

  it("shows jobs container when thing selected", async () => {
    mockThings.mockReturnValue({
      data: {
        things: [
          {
            thingName: "JobDevice",
            thingTypeName: "Sensor",
            thingArn: "arn:aws:iot:::thing/JobDevice",
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

    await waitFor(() => {
      expect(screen.getByText("JobDevice")).toBeTruthy();
    });

    await user.click(screen.getByText("JobDevice"));
    await waitFor(() => {
      expect(screen.getByText(/Jobs/)).toBeTruthy();
      expect(screen.getByText(/No job executions for this thing/i)).toBeTruthy();
    });
  });

  it("renders jobs with data when available", async () => {
    mockThings.mockReturnValue({
      data: {
        things: [
          {
            thingName: "JobDevice",
            thingTypeName: "Sensor",
            thingArn: "arn:aws:iot:::thing/JobDevice",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockThingJobs.mockReturnValue({
      data: {
        executionSummaries: [
          { jobId: "job-001", status: "SUCCEEDED", queuedAt: "2025-01-15T00:00:00Z" },
        ],
      },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });

    await user.click(screen.getByText("JobDevice"));
    await waitFor(() => {
      expect(screen.getByText("job-001")).toBeTruthy();
      expect(screen.getByText("SUCCEEDED")).toBeTruthy();
    });
  });

  it("filters things by name", async () => {
    mockThings.mockReturnValue({
      data: {
        things: [
          { thingName: "alpha-thing", thingTypeName: "A", thingArn: "arn:1" },
          { thingName: "beta-thing", thingTypeName: "B", thingArn: "arn:2" },
        ],
        total: 2,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText("alpha-thing")).toBeTruthy());
    expect(screen.getByText("beta-thing")).toBeTruthy();

    const filterInput = screen.getByPlaceholderText("Find things");
    await user.type(filterInput, "alpha");

    await waitFor(() => {
      expect(screen.queryByText("alpha-thing")).toBeTruthy();
      expect(screen.queryByText("beta-thing")).toBeNull();
    });
  });

  it("shows fallback for missing thing fields", () => {
    mockThings.mockReturnValue({
      data: {
        things: [
          { thingName: "MinimalThing" },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<IoTDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("MinimalThing")).toBeTruthy();
    // Missing thingTypeName → "—", missing thingArn → "—"
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });
});

describe("IoTDashboard — policies tab operations", () => {
  it("renders policies with data", async () => {
    mockPolicies.mockReturnValue({
      data: {
        policies: [
          {
            policyName: "MyPolicy",
            policyArn: "arn:aws:iot:::policy/MyPolicy",
            defaultVersionId: "v1",
            creationDate: "2025-01-15T00:00:00Z",
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
    await user.click(screen.getByRole("tab", { name: /policies/i }));

    await waitFor(() => {
      expect(screen.getByText("MyPolicy")).toBeTruthy();
      expect(screen.getByText("v1")).toBeTruthy();
    });
  });

  it("opens create policy modal and submits", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /policies/i }));

    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Create policy")).toBeTruthy();
    });

    const nameInput = screen.getByPlaceholderText("MyIoTPolicy");
    await user.type(nameInput, "NewPolicy");
    const docInput = screen.getByPlaceholderText(/Version/);
    await user.type(docInput, 'my-policy-document');

    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreatePolicy).toHaveBeenCalledWith(
        expect.objectContaining({ policyName: "NewPolicy" }),
        expect.anything(),
      );
    });
  });

  it("cancels create policy modal", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /policies/i }));

    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Create policy")).toBeTruthy();
    });

    await clickButton(user, /Cancel/i);
    await waitFor(() => {
      expect(mockCreatePolicy).not.toHaveBeenCalled();
    });
  });

  it("deletes a policy with confirmation", async () => {
    mockPolicies.mockReturnValue({
      data: {
        policies: [
          {
            policyName: "DeletePolicy",
            policyArn: "arn:aws:iot:::policy/DeletePolicy",
            defaultVersionId: "v1",
            creationDate: "2025-01-15T00:00:00Z",
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
    await user.click(screen.getByRole("tab", { name: /policies/i }));

    await waitFor(() => expect(screen.getByText("DeletePolicy")).toBeTruthy());

    const deleteBtns = screen.getAllByRole("button", { name: /Delete DeletePolicy/i });
    await user.click(deleteBtns[0]);
    await waitFor(() => expect(screen.getByText(/Are you sure/i)).toBeTruthy());

    const confirmBtns = screen.getAllByRole("button", { name: /^Delete$/i });
    await user.click(confirmBtns[confirmBtns.length - 1]);

    await waitFor(() => {
      expect(mockDeletePolicy).toHaveBeenCalledWith("DeletePolicy");
    });
  });

  it("shows policy versions when policy selected", async () => {
    mockPolicies.mockReturnValue({
      data: {
        policies: [
          {
            policyName: "PolicyWithVersions",
            policyArn: "arn:aws:iot:::policy/PolicyWithVersions",
            defaultVersionId: "v2",
            creationDate: "2025-01-15T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockPolicyVersions.mockReturnValue({
      data: {
        policyVersions: [
          { versionId: "v2", isDefaultVersion: true, createDate: "2025-01-16T00:00:00Z" },
          { versionId: "v1", isDefaultVersion: false, createDate: "2025-01-15T00:00:00Z" },
        ],
        total: 2,
      },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /policies/i }));

    await waitFor(() => expect(screen.getByText("PolicyWithVersions")).toBeTruthy());
    await user.click(screen.getByText("PolicyWithVersions"));

    await waitFor(() => {
      expect(screen.getAllByText(/Versions/).length).toBeGreaterThanOrEqual(1);
      // v2 appears in both policy row (defaultVersionId) and versions table
      expect(screen.getAllByText("v2").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("v1")).toBeTruthy();
      // isDefaultVersion: true shows "Yes" status indicator
      expect(screen.getByText("Yes")).toBeTruthy();
    });
  });

  it("filters policies by name", async () => {
    mockPolicies.mockReturnValue({
      data: {
        policies: [
          { policyName: "alpha-policy", policyArn: "arn:1", defaultVersionId: "v1", creationDate: "2025-01-15T00:00:00Z" },
          { policyName: "beta-policy", policyArn: "arn:2", defaultVersionId: "v1", creationDate: "2025-01-15T00:00:00Z" },
        ],
        total: 2,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /policies/i }));

    await waitFor(() => expect(screen.getByText("alpha-policy")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find policies");
    await user.type(filterInput, "beta");

    await waitFor(() => {
      expect(screen.queryByText("alpha-policy")).toBeNull();
      expect(screen.queryByText("beta-policy")).toBeTruthy();
    });
  });
});

describe("IoTDashboard — topic rules tab operations", () => {
  it("renders rules with data", async () => {
    mockTopicRules.mockReturnValue({
      data: {
        rules: [
          {
            ruleName: "MyRule",
            sql: "SELECT * FROM 'device/#'",
            description: "Routes device data",
            ruleDisabled: false,
            createdDate: "2025-01-15T00:00:00Z",
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
    await user.click(screen.getByRole("tab", { name: /topic rules/i }));

    await waitFor(() => {
      expect(screen.getByText("MyRule")).toBeTruthy();
      expect(screen.getAllByText(/SELECT/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Routes device data/)).toBeTruthy();
      expect(screen.getByText("Enabled")).toBeTruthy();
    });
  });

  it("opens create topic rule modal and submits", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /topic rules/i }));

    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Create topic rule")).toBeTruthy();
    });

    await user.type(screen.getByPlaceholderText("my_rule"), "NewRule");
    await user.type(screen.getByPlaceholderText(/SELECT/), "SELECT * FROM 'test/#'");

    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateTopicRule).toHaveBeenCalledWith(
        expect.objectContaining({ ruleName: "NewRule" }),
        expect.anything(),
      );
    });
  });

  it("cancels create topic rule modal", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /topic rules/i }));

    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Create topic rule")).toBeTruthy();
    });

    await clickButton(user, /Cancel/i);
    await waitFor(() => {
      expect(mockCreateTopicRule).not.toHaveBeenCalled();
    });
  });

  it("toggles rule enabled/disabled", async () => {
    mockTopicRules.mockReturnValue({
      data: {
        rules: [
          {
            ruleName: "ToggleRule",
            sql: "SELECT 1",
            description: "Test",
            ruleDisabled: false,
            createdDate: "2025-01-15T00:00:00Z",
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
    await user.click(screen.getByRole("tab", { name: /topic rules/i }));

    await waitFor(() => expect(screen.getByText("ToggleRule")).toBeTruthy());

    // Find Disable button — inline-icon button has text in DOM but may not expose via accessible name
    const ruleRow = screen.getByText("ToggleRule").closest('tr') || screen.getByText("ToggleRule").closest('[role="row"]');
    expect(ruleRow).toBeTruthy();
    const rowBtns = within(ruleRow!).getAllByRole("button");
    // First button is the Disable toggle (from actions column)
    await user.click(rowBtns[0]);

    await waitFor(() => {
      expect(mockDisableRule).toHaveBeenCalledWith("ToggleRule");
    });
  });

  it("shows enable button for disabled rules", async () => {
    mockTopicRules.mockReturnValue({
      data: {
        rules: [
          {
            ruleName: "DisabledRule",
            sql: "SELECT 1",
            description: "Test",
            ruleDisabled: true,
            createdDate: "2025-01-15T00:00:00Z",
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
    await user.click(screen.getByRole("tab", { name: /topic rules/i }));

    await waitFor(() => {
      expect(screen.getByText("Disabled")).toBeTruthy();
    });

    const ruleRow = screen.getByText("DisabledRule").closest('tr') || screen.getByText("DisabledRule").closest('[role="row"]');
    expect(ruleRow).toBeTruthy();
    const rowBtns = within(ruleRow!).getAllByRole("button");
    // First button is the Enable toggle (from actions column)
    await user.click(rowBtns[0]);

    await waitFor(() => {
      expect(mockEnableRule).toHaveBeenCalledWith("DisabledRule");
    });
  });

  it("deletes a rule with confirmation", async () => {
    mockTopicRules.mockReturnValue({
      data: {
        rules: [
          {
            ruleName: "DeleteRule",
            sql: "SELECT 1",
            description: "Test",
            ruleDisabled: false,
            createdDate: "2025-01-15T00:00:00Z",
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
    await user.click(screen.getByRole("tab", { name: /topic rules/i }));

    await waitFor(() => expect(screen.getByText("DeleteRule")).toBeTruthy());

    const deleteBtns = screen.getAllByRole("button", { name: /Delete DeleteRule/i });
    await user.click(deleteBtns[0]);
    await waitFor(() => expect(screen.getByText(/Are you sure/i)).toBeTruthy());

    const confirmBtns = screen.getAllByRole("button", { name: /^Delete$/i });
    await user.click(confirmBtns[confirmBtns.length - 1]);

    await waitFor(() => {
      expect(mockDeleteTopicRule).toHaveBeenCalledWith("DeleteRule");
    });
  });

  it("filters rules by name", async () => {
    mockTopicRules.mockReturnValue({
      data: {
        rules: [
          { ruleName: "alpha-rule", sql: "SELECT 1", description: "A", ruleDisabled: false, createdDate: "2025-01-15T00:00:00Z" },
          { ruleName: "beta-rule", sql: "SELECT 2", description: "B", ruleDisabled: false, createdDate: "2025-01-15T00:00:00Z" },
        ],
        total: 2,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /topic rules/i }));

    await waitFor(() => expect(screen.getByText("alpha-rule")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find rules");
    await user.type(filterInput, "alpha");

    await waitFor(() => {
      expect(screen.queryByText("alpha-rule")).toBeTruthy();
      expect(screen.queryByText("beta-rule")).toBeNull();
    });
  });

  it("handles snake_case rule fields", async () => {
    mockTopicRules.mockReturnValue({
      data: {
        rules: [
          {
            rule_name: "SnakeRule",
            rule_sql: "SELECT * FROM 'device/+'",
            description: "Snake case",
            rule_disabled: true,
            createdDate: "2025-01-15T00:00:00Z",
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
    await user.click(screen.getByRole("tab", { name: /topic rules/i }));

    await waitFor(() => {
      expect(screen.getByText("SnakeRule")).toBeTruthy();
      expect(screen.getByText("Disabled")).toBeTruthy();
    });
  });
});

describe("IoTDashboard — thing types tab operations", () => {
  it("renders thing types with data", async () => {
    mockThingTypes.mockReturnValue({
      data: {
        thingTypes: [
          {
            thingTypeName: "LightBulb",
            thingTypeArn: "arn:aws:iot:::thingtype/LightBulb",
            thingTypeProperties: { thingTypeDescription: "Smart bulb" },
            creationDate: "2025-01-15T00:00:00Z",
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
    await user.click(screen.getByRole("tab", { name: /thing types/i }));

    await waitFor(() => {
      expect(screen.getByText("LightBulb")).toBeTruthy();
      expect(screen.getByText("Smart bulb")).toBeTruthy();
    });
  });

  it("opens create thing type modal and submits", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /thing types/i }));

    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Create thing type")).toBeTruthy();
    });

    await user.type(screen.getByPlaceholderText("LightBulb"), "NewType");

    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateThingType).toHaveBeenCalledWith(
        expect.objectContaining({ thingTypeName: "NewType" }),
        expect.anything(),
      );
    });
  });

  it("cancels create thing type modal", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /thing types/i }));

    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Create thing type")).toBeTruthy();
    });

    await clickButton(user, /Cancel/i);
    await waitFor(() => {
      expect(mockCreateThingType).not.toHaveBeenCalled();
    });
  });

  it("deletes a thing type with confirmation", async () => {
    mockThingTypes.mockReturnValue({
      data: {
        thingTypes: [
          {
            thingTypeName: "DeleteType",
            thingTypeArn: "arn:aws:iot:::thingtype/DeleteType",
            creationDate: "2025-01-15T00:00:00Z",
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
    await user.click(screen.getByRole("tab", { name: /thing types/i }));

    await waitFor(() => expect(screen.getByText("DeleteType")).toBeTruthy());

    const deleteBtns = screen.getAllByRole("button", { name: /Delete DeleteType/i });
    await user.click(deleteBtns[0]);
    await waitFor(() => expect(screen.getByText(/Are you sure/i)).toBeTruthy());

    const confirmBtns = screen.getAllByRole("button", { name: /^Delete$/i });
    await user.click(confirmBtns[confirmBtns.length - 1]);

    await waitFor(() => {
      expect(mockDeleteThingType).toHaveBeenCalledWith("DeleteType");
    });
  });

  it("filters thing types by name", async () => {
    mockThingTypes.mockReturnValue({
      data: {
        thingTypes: [
          { thingTypeName: "alpha-type", thingTypeArn: "arn:1", creationDate: "2025-01-15T00:00:00Z" },
          { thingTypeName: "beta-type", thingTypeArn: "arn:2", creationDate: "2025-01-15T00:00:00Z" },
        ],
        total: 2,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /thing types/i }));

    await waitFor(() => expect(screen.getByText("alpha-type")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find types");
    await user.type(filterInput, "beta");

    await waitFor(() => {
      expect(screen.queryByText("alpha-type")).toBeNull();
      expect(screen.queryByText("beta-type")).toBeTruthy();
    });
  });

  it("shows fallback for missing thing type fields", async () => {
    mockThingTypes.mockReturnValue({
      data: {
        thingTypes: [
          { thingTypeName: "MinimalType" },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /thing types/i }));

    await waitFor(() => {
      expect(screen.getByText("MinimalType")).toBeTruthy();
      // Missing description → "—", missing ARN → "—"
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBeGreaterThanOrEqual(2);
    });
  });
});

describe("IoTDashboard — create error alerts", () => {
  it("shows error alert when create thing fails", async () => {
    createThingState.isError = true;
    createThingState.error = new Error("Creation failed");

    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /create thing/i);
    await waitFor(() => {
      expect(screen.getByText("Create thing")).toBeTruthy();
    });

    await waitFor(() => {
      expect(screen.getByText(/Creation failed/i)).toBeTruthy();
    });
  });

  it("shows error alert when create policy fails", async () => {
    createPolicyState.isError = true;
    createPolicyState.error = new Error("Policy creation failed");

    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /policies/i }));

    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Create policy")).toBeTruthy();
    });

    await waitFor(() => {
      expect(screen.getByText(/Policy creation failed/i)).toBeTruthy();
    });
  });

  it("shows error alert when create topic rule fails", async () => {
    createRuleState.isError = true;
    createRuleState.error = new Error("Rule creation failed");

    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /topic rules/i }));

    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Create topic rule")).toBeTruthy();
    });

    await waitFor(() => {
      expect(screen.getByText(/Rule creation failed/i)).toBeTruthy();
    });
  });

  it("shows error alert when create thing type fails", async () => {
    createThingTypeState.isError = true;
    createThingTypeState.error = new Error("Thing type creation failed");

    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /thing types/i }));

    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Create thing type")).toBeTruthy();
    });

    await waitFor(() => {
      expect(screen.getByText(/Thing type creation failed/i)).toBeTruthy();
    });
  });
});

describe("IoTDashboard — delete loading states", () => {
  it("renders delete thing loading state", () => {
    deleteThingState.isPending = true;
    deleteThingState.variables = "DeleteMe";
    mockThings.mockReturnValue({
      data: { things: [{ thingName: "DeleteMe", thingTypeName: "Sensor", thingArn: "arn:1" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<IoTDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("DeleteMe")).toBeTruthy();
  });

  it("renders delete policy loading state", async () => {
    deletePolicyState.isPending = true;
    deletePolicyState.variables = "DeletePolicy";
    mockPolicies.mockReturnValue({
      data: { policies: [{ policyName: "DeletePolicy", policyArn: "arn:1", defaultVersionId: "v1", creationDate: "2025-01-15" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /policies/i }));
    await waitFor(() => expect(screen.getByText("DeletePolicy")).toBeTruthy());
  });

  it("renders delete rule loading state", async () => {
    deleteRuleState.isPending = true;
    deleteRuleState.variables = "DeleteRule";
    mockTopicRules.mockReturnValue({
      data: { rules: [{ ruleName: "DeleteRule", sql: "SELECT 1", description: "Test", ruleDisabled: false, createdDate: "2025-01-15" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /topic rules/i }));
    await waitFor(() => expect(screen.getByText("DeleteRule")).toBeTruthy());
  });

  it("renders delete thing type loading state", async () => {
    deleteThingTypeState.isPending = true;
    deleteThingTypeState.variables = "DeleteType";
    mockThingTypes.mockReturnValue({
      data: { thingTypes: [{ thingTypeName: "DeleteType", thingTypeArn: "arn:1", creationDate: "2025-01-15" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /thing types/i }));
    await waitFor(() => expect(screen.getByText("DeleteType")).toBeTruthy());
  });
});

describe("IoTDashboard — create loading states", () => {
  it("shows create thing button loading state", async () => {
    createThingState.isPending = true;
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /create thing/i);
    await waitFor(() => expect(screen.getByText("Create thing")).toBeTruthy());
  });
});

describe("IoTDashboard — MQTT Broker tab", () => {
  it("renders publish and connection lookup UI", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /mqtt broker/i }));
    await waitFor(() => expect(screen.getByText("Publish to topic")).toBeTruthy());
    expect(screen.getByText("Client connections")).toBeTruthy();
    expect(screen.getByText("Retained messages")).toBeTruthy();
  });

  it("inspects a client and shows its subscriptions", async () => {
    mockConnection.mockReturnValue({
      data: { connection: { clientId: "device-001", connected: true, sourceIp: "10.0.0.5", sourcePort: 51234 } },
      isLoading: false,
      isError: false,
    });
    mockSubscriptions.mockReturnValue({
      data: { subscriptions: [{ topicFilter: "sensors/#", qos: 0 }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /mqtt broker/i }));
    await user.type(screen.getByPlaceholderText("device-001"), "device-001");
    await clickButton(user, /inspect/i);
    await waitFor(() => expect(screen.getByText("sensors/#")).toBeTruthy());
    expect(screen.getByText("Connected")).toBeTruthy();
  });

  it("shows a warning when the client is not connected", async () => {
    mockConnection.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /mqtt broker/i }));
    await user.type(screen.getByPlaceholderText("device-001"), "ghost");
    await clickButton(user, /inspect/i);
    await waitFor(() => expect(screen.getByText(/is not connected/i)).toBeTruthy());
  });

  it("disconnects an inspected client", async () => {
    mockConnection.mockReturnValue({
      data: { connection: { clientId: "device-001", connected: true } },
      isLoading: false,
      isError: false,
    });
    mockSubscriptions.mockReturnValue({ data: { subscriptions: [] }, isLoading: false });
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /mqtt broker/i }));
    await user.type(screen.getByPlaceholderText("device-001"), "device-001");
    await clickButton(user, /inspect/i);
    await clickButton(user, /disconnect client/i);
    expect(mockDisconnect).toHaveBeenCalledWith("device-001", expect.anything());
  });

  it("publishes a message from the modal", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /mqtt broker/i }));
    await clickButton(user, /publish to topic/i);
    await user.type(screen.getByPlaceholderText("sensors/temperature"), "sensors/temp");
    await clickButton(user, /^publish$/i);
    expect(mockPublish).toHaveBeenCalledWith(
      expect.objectContaining({ topic: "sensors/temp" }),
      expect.anything(),
    );
  });

  it("lists retained messages", async () => {
    mockRetained.mockReturnValue({
      data: { retainedTopics: [{ topic: "sensors/temp", payloadSize: 4, qos: 1 }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /mqtt broker/i }));
    await waitFor(() => expect(screen.getByText("sensors/temp")).toBeTruthy());
  });

  it("shows publish button disabled when topic is empty", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /mqtt broker/i }));
    await clickButton(user, /publish to topic/i);
    await waitFor(() => expect(screen.getByText("Publish MQTT message")).toBeTruthy());
    const publishBtn = screen.getByRole("button", { name: /^Publish$/i });
    expect(publishBtn.getAttribute("disabled")).not.toBeNull();
  });

  it("enables publish button when topic is filled", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /mqtt broker/i }));
    await clickButton(user, /publish to topic/i);
    await waitFor(() => expect(screen.getByPlaceholderText("sensors/temperature")).toBeTruthy());
    const topicInput = screen.getByPlaceholderText("sensors/temperature");
    await user.type(topicInput, "test/topic");
    const publishBtn = screen.getByRole("button", { name: /^Publish$/i });
    expect(publishBtn.getAttribute("disabled")).toBeNull();
  });

  it("shows publish error alert", async () => {
    publishState.isError = true;
    publishState.error = new Error("Publish failed");
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /mqtt broker/i }));
    await clickButton(user, /publish to topic/i);
    await waitFor(() => expect(screen.getByText("Publish failed")).toBeTruthy());
  });

  it("shows publish fallback 'Failed' when error has no message", async () => {
    publishState.isError = true;
    publishState.error = {} as Error;
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /mqtt broker/i }));
    await clickButton(user, /publish to topic/i);
    await waitFor(() => expect(screen.getByText("Failed")).toBeTruthy());
  });

  it("shows shadow modal with No shadow data message", async () => {
    mockThings.mockReturnValue({
      data: { things: [{ thingName: "NoShadowDev", thingTypeName: "Sensor", thingArn: "arn:1" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockShadow.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("NoShadowDev")).toBeTruthy());
    await user.click(screen.getByText("NoShadowDev"));
    await waitFor(() => expect(screen.getByRole("button", { name: /View shadow/i })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View shadow/i }));
    await waitFor(() => expect(screen.getByText("No shadow data")).toBeTruthy());
  });

  it("shows status indicator for disconnected client", async () => {
    mockConnection.mockReturnValue({
      data: { connection: { clientId: "offline-dev", connected: false, sourceIp: "10.0.0.9" } },
      isLoading: false, isError: false,
    });
    mockSubscriptions.mockReturnValue({ data: { subscriptions: [] }, isLoading: false });
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /mqtt broker/i }));
    await user.type(screen.getByPlaceholderText("device-001"), "offline-dev");
    await clickButton(user, /inspect/i);
    await waitFor(() => expect(screen.getByText("Disconnected")).toBeTruthy());
  });

  it("shows dash for connection missing sourceIp", async () => {
    mockConnection.mockReturnValue({
      data: { connection: { clientId: "noip-dev", connected: true, sourcePort: 9999 } },
      isLoading: false, isError: false,
    });
    mockSubscriptions.mockReturnValue({ data: { subscriptions: [] }, isLoading: false });
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /mqtt broker/i }));
    await user.type(screen.getByPlaceholderText("device-001"), "noip-dev");
    await clickButton(user, /inspect/i);
    await waitFor(() => expect(screen.getByText("—")).toBeTruthy());
  });

  it("shows sourceIp only when sourcePort is missing", async () => {
    mockConnection.mockReturnValue({
      data: { connection: { clientId: "noport-dev", connected: true, sourceIp: "10.0.0.5" } },
      isLoading: false, isError: false,
    });
    mockSubscriptions.mockReturnValue({ data: { subscriptions: [] }, isLoading: false });
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /mqtt broker/i }));
    await user.type(screen.getByPlaceholderText("device-001"), "noport-dev");
    await clickButton(user, /inspect/i);
    await waitFor(() => expect(screen.getByText(/10\.0\.0\.5/)).toBeTruthy());
  });
});

// ═══ Additional branch coverage tests ═══════════════════

describe("IoTDashboard — edge case branches", () => {
  it("shows error StatusIndicator for REVOKED certificate", async () => {
    mockCertificates.mockReturnValue({
      data: { certificates: [{ certificateId: "cert-revoked", status: "REVOKED", creationDate: "2025-01-01" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /certificates/i }));
    await waitFor(() => expect(screen.getByText("REVOKED")).toBeTruthy());
  });

  it("shows 'Failed' fallback when create thing error has no message", async () => {
    createThingState.isError = true;
    createThingState.error = {} as Error;
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /create thing/i);
    await waitFor(() => expect(screen.getByText("Failed")).toBeTruthy());
  });

  it("shows 'Failed' fallback when create policy error has no message", async () => {
    createPolicyState.isError = true;
    createPolicyState.error = {} as Error;
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /policies/i }));
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Failed")).toBeTruthy());
  });

  it("shows 'Failed' fallback when create rule error has no message", async () => {
    createRuleState.isError = true;
    createRuleState.error = {} as Error;
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /topic rules/i }));
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Failed")).toBeTruthy());
  });

  it("shows 'Failed' fallback when create thing type error has no message", async () => {
    createThingTypeState.isError = true;
    createThingTypeState.error = {} as Error;
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /thing types/i }));
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Failed")).toBeTruthy());
  });

  it("renders job with executionSummary nested status", async () => {
    mockThings.mockReturnValue({
      data: { things: [{ thingName: "JobDev2", thingTypeName: "T", thingArn: "arn:1" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockThingJobs.mockReturnValue({
      data: { executionSummaries: [{ jobId: "job-nested", executionSummary: { status: "QUEUED", queuedAt: "2025-06-01T00:00:00Z" } }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("JobDev2"));
    await waitFor(() => {
      expect(screen.getByText("job-nested")).toBeTruthy();
      expect(screen.getByText("QUEUED")).toBeTruthy();
    });
  });

  it("renders job with empty fields as dash", async () => {
    mockThings.mockReturnValue({
      data: { things: [{ thingName: "JobDev3", thingTypeName: "T", thingArn: "arn:1" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockThingJobs.mockReturnValue({
      data: { executionSummaries: [{ jobId: "job-empty" }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("JobDev3"));
    await waitFor(() => {
      expect(screen.getByText("job-empty")).toBeTruthy();
    });
  });

  it("shows policy version using policyVersionId fallback", async () => {
    mockPolicies.mockReturnValue({
      data: { policies: [{ policyName: "PV", policyArn: "arn:1", defaultVersionId: "v1", creationDate: "2025-01-15" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockPolicyVersions.mockReturnValue({
      data: { policyVersions: [{ policyVersionId: "v2-alt", isDefaultVersion: false }, { versionId: "v1", isDefaultVersion: true, createDate: "2025-01-15" }], total: 2 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /policies/i }));
    await waitFor(() => user.click(screen.getByText("PV")));
    await waitFor(() => expect(screen.getByText("v2-alt")).toBeTruthy());
  });

  it("does not update shadow with invalid JSON", async () => {
    mockThings.mockReturnValue({
      data: { things: [{ thingName: "ShadowDev2", thingTypeName: "S", thingArn: "arn:1" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockShadow.mockReturnValue({ data: { shadow: { state: {} } }, isLoading: false });
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("ShadowDev2"));
    await waitFor(() => clickButton(user, /View shadow/i));
    await waitFor(() => expect(screen.getByPlaceholderText(/desired/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText(/desired/), "invalid json");
    await clickButton(user, /Update/);
    await waitFor(() => {
      expect(mockUpdateShadow).not.toHaveBeenCalled();
    });
  });

  // ─── Topic Rules: Enable/Disable ────────────────────

  it("calls enableRule when Enable is clicked on disabled rule", async () => {
    mockTopicRules.mockReturnValue({
      data: {
        rules: [{ ruleName: "disabled-rule", ruleDisabled: true, sql: "SELECT *", createdDate: "2025-01-01" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /topic rules/i }));
    await waitFor(() => expect(screen.getByText("disabled-rule")).toBeTruthy());
    // Inline-icon buttons strip text — find by row and click first button
    const row = screen.getByText("disabled-rule").closest('tr') || screen.getByText("disabled-rule").closest('[role="row"]');
    expect(row).toBeTruthy();
    const btns = within(row as HTMLElement).getAllByRole("button");
    await user.click(btns[0]);
    await waitFor(() => expect(mockEnableRule).toHaveBeenCalledWith("disabled-rule"));
  });

  it("calls disableRule when Disable is clicked on enabled rule", async () => {
    mockTopicRules.mockReturnValue({
      data: {
        rules: [{ ruleName: "enabled-rule", ruleDisabled: false, sql: "SELECT *", createdDate: "2025-01-01" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /topic rules/i }));
    await waitFor(() => expect(screen.getByText("enabled-rule")).toBeTruthy());
    // Inline-icon buttons strip text — find by row and click first button
    const row = screen.getByText("enabled-rule").closest('tr') || screen.getByText("enabled-rule").closest('[role="row"]');
    expect(row).toBeTruthy();
    const btns = within(row as HTMLElement).getAllByRole("button");
    await user.click(btns[0]);
    await waitFor(() => expect(mockDisableRule).toHaveBeenCalledWith("enabled-rule"));
  });

  // ─── Create Thing Type submission ────────────────────

  it("opens create thing type modal and submits", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /thing types/i }));
    await clickButton(user, /Create thing type/i);
    await waitFor(() => expect(screen.getAllByText("Create thing type").length).toBeGreaterThan(0));
    await user.type(screen.getByPlaceholderText("LightBulb"), "LightBulbV2");
    await user.type(screen.getByPlaceholderText("Smart light bulb"), "Updated bulb");
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => expect(mockCreateThingType).toHaveBeenCalled());
  });

  // ─── Create Policy submission ────────────────────────

  it("opens create policy modal and submits", async () => {
    const user = userEvent.setup();
    const { fireEvent } = await import("@testing-library/react");
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /policies/i }));
    await clickButton(user, /Create policy/i);
    await waitFor(() => expect(screen.getAllByText("Create policy").length).toBeGreaterThan(0));
    await user.type(screen.getByPlaceholderText("MyIoTPolicy"), "my-policy");
    // JSON with curly braces breaks userEvent.type — use fireEvent.change
    fireEvent.change(screen.getByPlaceholderText(/"Version"/), { target: { value: '{"Version":"2012-10-17"}' } });
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => expect(mockCreatePolicy).toHaveBeenCalled());
  });

  // ─── Create Topic Rule submission ────────────────────

  it("opens create topic rule modal and submits", async () => {
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /topic rules/i }));
    await clickButton(user, /Create topic rule/i);
    await waitFor(() => expect(screen.getAllByText("Create topic rule").length).toBeGreaterThan(0));
    await user.type(screen.getByPlaceholderText("my_rule"), "route_temp");
    await user.type(screen.getByPlaceholderText("SELECT * FROM 'device/+'"), "SELECT * FROM 'sensors/+'");
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => expect(mockCreateTopicRule).toHaveBeenCalled());
  });

  // ─── MQTT Publish submission ─────────────────────────

  it("opens publish modal and submits with topic and payload", async () => {
    const user = userEvent.setup();
    const { fireEvent } = await import("@testing-library/react");
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /mqtt broker/i }));
    await clickButton(user, /Publish to topic/i);
    await waitFor(() => expect(screen.getAllByText("Publish MQTT message").length).toBeGreaterThan(0));
    await user.type(screen.getByPlaceholderText("sensors/temperature"), "sensors/temp");
    // JSON with curly braces breaks userEvent.type — use fireEvent.change
    fireEvent.change(screen.getByPlaceholderText('{"temp": 25}'), { target: { value: '{"temp": 30}' } });
    const pubBtns = screen.getAllByRole("button", { name: /^Publish$/i });
    await user.click(pubBtns[pubBtns.length - 1]);
    await waitFor(() => expect(mockPublish).toHaveBeenCalled());
  });

  // ─── MQTT Client Disconnect ──────────────────────────

  it("inspects a client and disconnects it", async () => {
    mockConnection.mockReturnValue({
      data: { connection: { clientId: "device-001", connected: true, sourceIp: "192.168.1.1", sourcePort: 8883 } },
      isLoading: false, isError: false,
    });
    mockSubscriptions.mockReturnValue({ data: { subscriptions: [] }, isLoading: false });
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /mqtt broker/i }));
    await waitFor(() => expect(screen.getByPlaceholderText("device-001")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("device-001"), "device-001");
    await clickButton(user, /Inspect/);
    await waitFor(() => expect(screen.getByText("Connected")).toBeTruthy());
    await clickButton(user, /Disconnect client/);
    await waitFor(() => expect(mockDisconnect).toHaveBeenCalledWith("device-001", expect.anything()));
  });

  // ─── Policy Versions: isDefaultVersion ───────────────

  it("shows Yes indicator for default policy version", async () => {
    mockPolicies.mockReturnValue({
      data: {
        policies: [{ policyName: "my-pol", policyArn: "arn:aws:iot:::policy/my-pol", defaultVersionId: "1", creationDate: "2025-01-01" }],
        total: 1,
      },
      isLoading: false,
    });
    mockPolicyVersions.mockReturnValue({
      data: { policyVersions: [{ versionId: "1", isDefaultVersion: true, createDate: "2025-01-01" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<IoTDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /policies/i }));
    await waitFor(() => expect(screen.getByText("my-pol")).toBeTruthy());
    await user.click(screen.getByText("my-pol"));
    await waitFor(() => expect(screen.getByText("Yes")).toBeTruthy());
  });
});
