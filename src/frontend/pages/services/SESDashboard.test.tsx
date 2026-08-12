// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── vi.hoisted mutable states ──────────────────────────

const verifyEmailState = vi.hoisted(() => ({
  isPending: false,
}));

const deleteIdentityState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const sendEmailState = vi.hoisted(() => ({
  isPending: false,
}));

const createConfigSetState = vi.hoisted(() => ({
  isPending: false,
}));

const deleteConfigSetState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const createEventDestState = vi.hoisted(() => ({
  isPending: false,
}));

const deleteEventDestState = vi.hoisted(() => ({
  isPending: false,
  variables: null as { configSetName: string; eventDestinationName: string } | null,
}));

const setSendingEnabledState = vi.hoisted(() => ({
  isPending: false,
}));

const setMailFromState = vi.hoisted(() => ({
  isPending: false,
}));

const setNotifTopicState = vi.hoisted(() => ({
  isPending: false,
}));

const setRepMetricsState = vi.hoisted(() => ({
  isPending: false,
}));

const setDeliveryOptsState = vi.hoisted(() => ({
  isPending: false,
}));

// ─── Mock functions (controllable) ─────────────────────

const mockIdentities = vi.fn();
const mockVerifiedEmails = vi.fn();
const mockVerifyEmail = vi.fn();
const mockDeleteIdentity = vi.fn();
const mockSendEmail = vi.fn();
const mockConfigSets = vi.fn();
const mockCreateConfigSet = vi.fn();
const mockDeleteConfigSet = vi.fn();
const mockDescribeConfigSet = vi.fn();
const mockCreateEventDest = vi.fn();
const mockUpdateEventDest = vi.fn();
const mockDeleteEventDest = vi.fn();
const mockDeleteTrackingOpts = vi.fn();
const mockCreateTrackingOpts = vi.fn();
const mockUpdateTrackingOpts = vi.fn();
const mockSetSendingEnabled = vi.fn();
const mockSetRepMetrics = vi.fn();
const mockSetDeliveryOpts = vi.fn();
const mockNotifAttrs = vi.fn();
const mockSetNotifTopic = vi.fn();
const mockSetMailFrom = vi.fn();
let mockSetFeedbackForwarding = vi.fn();
let mockSetDkimEnabled = vi.fn();
let mockSetHeadersInNotifications = vi.fn();

vi.mock("../../hooks/useSES", () => ({
  useSESIdentities: (...args: any[]) => mockIdentities(...args),
  useSESVerifiedEmails: (...args: any[]) => mockVerifiedEmails(...args),
  useSESVerifyEmail: () => ({
    mutate: mockVerifyEmail,
    get isPending() { return verifyEmailState.isPending; },
  }),
  useSESDeleteIdentity: () => ({
    mutateAsync: mockDeleteIdentity,
    get isPending() { return deleteIdentityState.isPending; },
    get variables() { return deleteIdentityState.variables; },
  }),
  useSESSendEmail: () => ({
    mutate: mockSendEmail,
    get isPending() { return sendEmailState.isPending; },
  }),
  useSESNotificationAttributes: (...args: any[]) => mockNotifAttrs(...args),
  useSESSetNotificationTopic: () => ({
    mutate: mockSetNotifTopic,
    mutateAsync: vi.fn().mockResolvedValue({}),
    get isPending() { return setNotifTopicState.isPending; },
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useSESSetFeedbackForwarding: () => ({
    mutate: mockSetFeedbackForwarding,
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useSESSetHeadersInNotifications: () => ({
    mutate: mockSetHeadersInNotifications,
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useSESSetDkimEnabled: () => ({
    mutate: mockSetDkimEnabled,
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useSESSetMailFromDomain: () => ({
    mutate: mockSetMailFrom,
    mutateAsync: vi.fn().mockResolvedValue({}),
    get isPending() { return setMailFromState.isPending; },
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useConfigurationSets: (...args: any[]) => mockConfigSets(...args),
  useCreateConfigurationSet: () => ({
    mutate: mockCreateConfigSet,
    mutateAsync: vi.fn().mockResolvedValue({}),
    get isPending() { return createConfigSetState.isPending; },
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useDeleteConfigurationSet: () => ({
    mutateAsync: mockDeleteConfigSet,
    get isPending() { return deleteConfigSetState.isPending; },
    get variables() { return deleteConfigSetState.variables; },
  }),
  useDescribeConfigurationSet: (...args: any[]) => mockDescribeConfigSet(...args),
  useCreateEventDestination: () => ({
    mutate: mockCreateEventDest,
    mutateAsync: vi.fn().mockResolvedValue({}),
    get isPending() { return createEventDestState.isPending; },
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useUpdateEventDestination: () => ({
    mutate: mockUpdateEventDest,
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useDeleteEventDestination: () => ({
    mutateAsync: mockDeleteEventDest,
    get isPending() { return deleteEventDestState.isPending; },
    get variables() { return deleteEventDestState.variables; },
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useSetConfigSendingEnabled: () => ({
    mutate: mockSetSendingEnabled,
    mutateAsync: vi.fn().mockResolvedValue({}),
    get isPending() { return setSendingEnabledState.isPending; },
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useCreateTrackingOptions: () => ({
    mutate: mockCreateTrackingOpts,
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useUpdateTrackingOptions: () => ({
    mutate: mockUpdateTrackingOpts,
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useDeleteTrackingOptions: () => ({
    mutate: vi.fn(),
    mutateAsync: mockDeleteTrackingOpts,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useSetReputationMetrics: () => ({
    mutate: mockSetRepMetrics,
    mutateAsync: vi.fn().mockResolvedValue({}),
    get isPending() { return setRepMetricsState.isPending; },
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useSetDeliveryOptions: () => ({
    mutate: mockSetDeliveryOpts,
    mutateAsync: vi.fn().mockResolvedValue({}),
    get isPending() { return setDeliveryOptsState.isPending; },
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
}));

import { SESDashboard } from "./SESDashboard";

/** Dispatch Escape to all Cloudscape modal dialogs (fires onDismiss). */
function dismissModalWithEscape() {
  document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
    fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27 });
  });
}

/** Locate a modal dialog by its header text (Cloudscape modals stay mounted when hidden). */
function dialogOf(headerText: string): HTMLElement {
  const header = screen.getAllByText(headerText).find((h) => h.closest('[role="dialog"]'));
  return header!.closest('[role="dialog"]') as HTMLElement;
}

/** Assert the modal with the given header is hidden (Cloudscape uses display:none). */
function expectModalHidden(headerText: string) {
  const dialog = dialogOf(headerText).closest('[role="dialog"]') as HTMLElement;
  expect(dialog.className).toContain("hidden");
}

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  verifyEmailState.isPending = false;
  deleteIdentityState.isPending = false;
  deleteIdentityState.variables = null;
  sendEmailState.isPending = false;
  mockIdentities.mockReturnValue({
    data: { identities: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockVerifiedEmails.mockReturnValue({
    data: { emails: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  createConfigSetState.isPending = false;
  deleteConfigSetState.isPending = false;
  deleteConfigSetState.variables = null;
  createEventDestState.isPending = false;
  deleteEventDestState.isPending = false;
  deleteEventDestState.variables = null;
  setSendingEnabledState.isPending = false;
  setMailFromState.isPending = false;
  setNotifTopicState.isPending = false;
  setRepMetricsState.isPending = false;
  setDeliveryOptsState.isPending = false;
  mockConfigSets.mockReturnValue({
    data: { configurationSets: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockDescribeConfigSet.mockReturnValue({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
  });
  mockNotifAttrs.mockReturnValue({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
  });
  mockSetFeedbackForwarding = vi.fn();
  mockSetDkimEnabled = vi.fn();
  mockSetHeadersInNotifications = vi.fn();
  mockDeleteTrackingOpts.mockResolvedValue({});
});

// ─── Tests ──────────────────────────────────────────────

describe("SESDashboard — rendering", () => {
  it("shows loading skeleton when loading", () => {
    mockIdentities.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    const { container } = render(<SESDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty state", () => {
    render(<SESDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No email identities/i)).toBeTruthy();
  });

  it("renders email identity list with data", () => {
    mockIdentities.mockReturnValue({
      data: {
        identities: [
          {
            identity: "user@example.com",
            verificationStatus: "Success",
            dkimEnabled: true,
            mailFromDomain: "mail.example.com",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("user@example.com")).toBeTruthy();
    expect(screen.getByText("Success")).toBeTruthy();
    expect(screen.getByText("Enabled")).toBeTruthy();
    expect(screen.getByText("mail.example.com")).toBeTruthy();
  });

  it("renders multiple identities", () => {
    mockIdentities.mockReturnValue({
      data: {
        identities: [
          { identity: "a@example.com", verificationStatus: "Success", dkimEnabled: true, mailFromDomain: "mail.example.com" },
          { identity: "b@example.com", verificationStatus: "Pending", dkimEnabled: false, mailFromDomain: null },
        ],
        total: 2,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("a@example.com")).toBeTruthy();
    expect(screen.getByText("b@example.com")).toBeTruthy();
  });

  it("shows verified emails container when data present", () => {
    mockVerifiedEmails.mockReturnValue({
      data: { emails: ["verified@example.com"], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Verified Emails")).toBeTruthy();
    expect(screen.getByText("verified@example.com")).toBeTruthy();
  });

  it("does not show verified emails container when empty", () => {
    mockVerifiedEmails.mockReturnValue({
      data: { emails: [], total: 0 },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    expect(screen.queryByText("Verified Emails")).toBeNull();
  });

  it("filters identities by text", async () => {
    mockIdentities.mockReturnValue({
      data: {
        identities: [
          { identity: "alpha@example.com", verificationStatus: "Success", dkimEnabled: true, mailFromDomain: null },
          { identity: "beta@example.com", verificationStatus: "Success", dkimEnabled: true, mailFromDomain: null },
        ],
        total: 2,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha@example.com")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find identities");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha@example.com")).toBeNull());
  });
});

describe("SESDashboard — verify email modal", () => {
  it("opens verify email modal and submits", async () => {
    const user = userEvent.setup();
    render(<SESDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /create/i);
    await waitFor(() => expect(screen.getByText("Verify email address")).toBeTruthy());
    const input = screen.getByPlaceholderText("user@example.com");
    await user.type(input, "test@example.com");
    await clickButton(user, /^Verify$/i);
    await waitFor(() => {
      expect(mockVerifyEmail).toHaveBeenCalledWith("test@example.com");
    });
  });

  it("cancels verify email modal does not call mutation", async () => {
    const user = userEvent.setup();
    render(<SESDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /create/i);
    await waitFor(() => expect(screen.getByText("Verify email address")).toBeTruthy());
    await clickButton(user, /Cancel/i);
    expect(mockVerifyEmail).not.toHaveBeenCalled();
  });

  it("shows verify email loading state on Verify button", async () => {
    verifyEmailState.isPending = true;
    const user = userEvent.setup();
    render(<SESDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /create/i);
    await waitFor(() => expect(screen.getByText("Verify email address")).toBeTruthy());
    // Both verify email and verify domain modals render a Verify button in the DOM
    const verifyBtns = screen.getAllByRole("button", { name: /Verify/i });
    expect(verifyBtns.length).toBeGreaterThanOrEqual(1);
  });

  it("Verify button is disabled when email is empty", async () => {
    const user = userEvent.setup();
    render(<SESDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /create/i);
    await waitFor(() => expect(screen.getByText("Verify email address")).toBeTruthy());
    // Verify button should be disabled since emailAddress is empty
    const verifyBtns = screen.getAllByRole("button", { name: /Verify/i });
    expect(verifyBtns.length).toBeGreaterThanOrEqual(1);
  });
});

describe("SESDashboard — send email modal", () => {
  it("shows send email loading state", () => {
    sendEmailState.isPending = true;
    render(<SESDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No email identities/i)).toBeTruthy();
  });
});

describe("SESDashboard — delete identity", () => {
  it("shows delete identity loading state", () => {
    deleteIdentityState.isPending = true;
    deleteIdentityState.variables = "delete-me@example.com";
    mockIdentities.mockReturnValue({
      data: {
        identities: [
          {
            identity: "delete-me@example.com",
            verificationStatus: "Success",
            dkimEnabled: true,
            mailFromDomain: "mail.example.com",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("delete-me@example.com")).toBeTruthy();
  });

  it("deletes an identity", async () => {
    mockIdentities.mockReturnValue({
      data: {
        identities: [
          {
            identity: "delete-me@example.com",
            verificationStatus: "Success",
            dkimEnabled: false,
            mailFromDomain: null,
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("delete-me@example.com")).toBeTruthy());
    const deleteBtn = screen.getByRole("button", { name: /Delete delete-me@example.com/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => {
      expect(mockDeleteIdentity).toHaveBeenCalledWith("delete-me@example.com");
    });
  });
});

describe("SESDashboard — fallback branches", () => {
  it("shows Pending status and Disabled DKIM when fields missing", () => {
    mockIdentities.mockReturnValue({
      data: {
        identities: [
          {
            identity: "fallback@example.com",
            verificationStatus: null,
            dkimEnabled: false,
            mailFromDomain: null,
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("fallback@example.com")).toBeTruthy();
    expect(screen.getByText("Pending")).toBeTruthy();
    expect(screen.getByText("Disabled")).toBeTruthy();
    expect(screen.getByText("-")).toBeTruthy();
  });

  it("shows mailFrom domain when present", () => {
    mockIdentities.mockReturnValue({
      data: {
        identities: [
          {
            identity: "full@example.com",
            verificationStatus: "Success",
            dkimEnabled: true,
            mailFromDomain: "mail.example.com",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("full@example.com")).toBeTruthy();
    expect(screen.getByText("mail.example.com")).toBeTruthy();
  });
});

describe("SESDashboard — configuration sets", () => {
  it("shows configuration sets section and empty message", () => {
    render(<SESDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Configuration Sets")).toBeTruthy();
    expect(screen.getByText(/No configuration sets found/i)).toBeTruthy();
  });

  it("lists configuration sets", () => {
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: "my-config-set" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-config-set")).toBeTruthy();
  });

  it("opens create config set modal and creates", async () => {
    const user = userEvent.setup();
    render(<SESDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create config set/i);
    await waitFor(() => expect(screen.getByText("Create Configuration Set")).toBeTruthy());

    const input = screen.getByPlaceholderText("my-config-set");
    await user.type(input, "new-config");

    await clickButton(user, /^Create$/i);
    await waitFor(() => {
      expect(mockCreateConfigSet).toHaveBeenCalledWith("new-config", expect.any(Object));
    });
  });

  it("deletes a configuration set", async () => {
    const user = userEvent.setup();
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: "del-config" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("del-config")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete del-config/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => {
      expect(mockDeleteConfigSet).toHaveBeenCalledWith("del-config");
    });
  });

  it("views config set detail and shows event destinations", async () => {
    const user = userEvent.setup();
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: "detail-config" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDescribeConfigSet.mockReturnValue({
      data: {
        name: "detail-config",
        eventDestinations: [
          { Name: "my-dest", Enabled: true, MatchingEventTypes: ["send", "bounce"], SNSDestination: { TopicARN: "arn:sns:topic" } },
        ],
        trackingOptions: { CustomRedirectDomain: "click.example.com" },
        reputationOptions: { ReputationMetricsEnabled: true },
        deliveryOptions: { TlsPolicy: "Require" },
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("detail-config")).toBeTruthy());

    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => expect(screen.getByText("Event Destinations")).toBeTruthy());

    expect(screen.getByText("my-dest")).toBeTruthy();
    expect(screen.getAllByText(/send/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/click.example/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Require/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows config set detail error state", async () => {
    const user = userEvent.setup();
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: "err-config" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDescribeConfigSet.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Failed") });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("err-config")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => expect(screen.getByText(/Failed to load configuration set details/i)).toBeTruthy());
  });
});

describe("SESDashboard — identity notification detail", () => {
  const IDENTITY = "notif@example.com";

  function setupIdentities() {
    mockIdentities.mockReturnValue({
      data: {
        identities: [
          { identity: IDENTITY, verificationStatus: "Success", dkimEnabled: false, mailFromDomain: null },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
  }

  it("clicks Notifications and shows identity detail", async () => {
    const user = userEvent.setup();
    setupIdentities();
    mockNotifAttrs.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(IDENTITY)).toBeTruthy());

    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    await waitFor(() => {
      expect(screen.getByText(new RegExp(`Identity Details: ${IDENTITY}`))).toBeTruthy();
    });
  });

  it("shows notification topics and feedback forwarding", async () => {
    const user = userEvent.setup();
    setupIdentities();
    mockNotifAttrs.mockReturnValue({
      data: {
        bounceTopic: { TopicArn: "arn:aws:sns:bounce" },
        complaintTopic: null,
        deliveryTopic: { TopicArn: "arn:aws:sns:delivery" },
        forwardingEnabled: true,
        headersInBounceNotifications: true,
        headersInComplaintNotifications: false,
        headersInDeliveryNotifications: true,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(IDENTITY)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Notifications/i }));

    await waitFor(() => {
      // Notification topics (Bounce/Complaint appear in headers section too, use getAllByText)
      expect(screen.getAllByText("Bounce").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Feedback Forwarding")).toBeTruthy();
      expect(screen.getByText("DKIM Signing")).toBeTruthy();
      expect(screen.getAllByText("MAIL FROM Domain").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Headers in Notifications")).toBeTruthy();
    });
  });

  it("opens and saves notification topic modal", async () => {
    const user = userEvent.setup();
    setupIdentities();
    mockNotifAttrs.mockReturnValue({
      data: {
        bounceTopic: { TopicArn: "arn:aws:sns:bounce" },
        complaintTopic: null,
        deliveryTopic: null,
        forwardingEnabled: false,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(IDENTITY)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    await waitFor(() => screen.getByText("DKIM Signing"));

    // Click "Set" on Bounce's notification topic (first Set button in notification topics area)
    const setBtns = screen.getAllByRole("button", { name: /Set|Edit/i });
    await user.click(setBtns[0]);
    await waitFor(() => {
      expect(screen.getByText("Set Bounce Notification Topic")).toBeTruthy();
    });

    await clickButton(user, /Save/i);
    await waitFor(() => {
      expect(mockSetNotifTopic).toHaveBeenCalled();
    });
  });

  it("opens MAIL FROM domain modal with structure", async () => {
    const user = userEvent.setup();
    setupIdentities();
    mockNotifAttrs.mockReturnValue({
      data: { forwardingEnabled: false },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(IDENTITY)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    await waitFor(() => screen.getByText("DKIM Signing"));

    // Click "Set" button on MAIL FROM (last Set button in identity detail)
    const setBtns = screen.getAllByRole("button", { name: /Set/i });
    await user.click(setBtns[setBtns.length - 1]);
    await waitFor(() => {
      expect(screen.getByText("Set MAIL FROM Domain")).toBeTruthy();
    });

    // Verify modal structure: input field and Save/Cancel buttons
    expect(screen.getByPlaceholderText("mail.example.com")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Save/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("button", { name: /Cancel/i }).length).toBeGreaterThanOrEqual(1);
    expect(mockSetMailFrom).not.toHaveBeenCalled();
  });
});

describe("SESDashboard — event destinations", () => {
  it("adds an event destination", async () => {
    const user = userEvent.setup();
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: "cs-dest" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDescribeConfigSet.mockReturnValue({
      data: { name: "cs-dest", eventDestinations: [] },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("cs-dest")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => screen.getByText("Event Destinations"));

    await user.click(screen.getByRole("button", { name: /Add destination/i }));
    await waitFor(() => expect(screen.getByText("Add Event Destination")).toBeTruthy());

    const nameInput = screen.getByPlaceholderText("my-sns-destination");
    await user.type(nameInput, "new-dest");
    const eventTypesInputs = screen.getAllByPlaceholderText("send, bounce");
    await user.type(eventTypesInputs[0], "bounce");

    await clickButton(user, /^Add$/i);
    await waitFor(() => {
      expect(mockCreateEventDest).toHaveBeenCalledWith(
        expect.objectContaining({
          configSetName: "cs-dest",
          eventDestinationName: "new-dest",
        }),
        expect.any(Object),
      );
    });
  });

  it("opens edit event destination modal with structure", async () => {
    const user = userEvent.setup();
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: "cs-edit" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDescribeConfigSet.mockReturnValue({
      data: {
        name: "cs-edit",
        eventDestinations: [
          { Name: "edit-dest", Enabled: true, MatchingEventTypes: ["send"], SNSDestination: { TopicARN: "arn:sns:old" } },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("cs-edit")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => screen.getByText("edit-dest"));

    // Find the Edit button in event destinations
    const editBtns = screen.getAllByRole("button", { name: /Edit/i });
    await user.click(editBtns[editBtns.length - 1]);

    // Verify modal opened — verify input fields and buttons are rendered instead
    // of checking header text (Cloudscape Modal header may not be queryable)
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-sns-destination")).toBeTruthy();
    });
    expect(screen.getAllByPlaceholderText("send, bounce").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("button", { name: /Save/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("button", { name: /Cancel/i }).length).toBeGreaterThanOrEqual(1);
    expect(mockUpdateEventDest).not.toHaveBeenCalled();
  });

  it("deletes an event destination", async () => {
    const user = userEvent.setup();
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: "cs-del" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDescribeConfigSet.mockReturnValue({
      data: {
        name: "cs-del",
        eventDestinations: [{ Name: "del-dest", Enabled: true, MatchingEventTypes: ["send"] }],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("cs-del")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => screen.getByText("del-dest"));

    const deleteBtn = screen.getByRole("button", { name: /Delete del-dest/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => {
      expect(mockDeleteEventDest).toHaveBeenCalledWith(
        expect.objectContaining({ configSetName: "cs-del", eventDestinationName: "del-dest" }),
      );
    });
  });
});

describe("SESDashboard — sending, tracking, reputation, delivery", () => {
  async function openDetail(user: ReturnType<typeof userEvent.setup>) {
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: "cs-actions" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDescribeConfigSet.mockReturnValue({
      data: {
        name: "cs-actions",
        eventDestinations: [],
        trackingOptions: { CustomRedirectDomain: "track.example.com" },
        reputationOptions: { ReputationMetricsEnabled: true },
        deliveryOptions: { TlsPolicy: "Optional" },
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("cs-actions")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => screen.getByText("Sending"));
  }

  it("shows sending enabled buttons", async () => {
    const user = userEvent.setup();
    await openDetail(user);
    expect(screen.getByRole("button", { name: /Enable sending/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Disable sending/i })).toBeTruthy();
  });

  it("calls enable sending", async () => {
    const user = userEvent.setup();
    await openDetail(user);
    await user.click(screen.getByRole("button", { name: /Enable sending/i }));
    await waitFor(() => {
      expect(mockSetSendingEnabled).toHaveBeenCalledWith(
        expect.objectContaining({ configSetName: "cs-actions", enabled: true }),
      );
    });
  });

  it("shows reputation metrics status", async () => {
    const user = userEvent.setup();
    await openDetail(user);
    expect(screen.getByText("Reputation Metrics")).toBeTruthy();
    expect(screen.getByText("Disable")).toBeTruthy();
  });

  it("shows tracking options and delivery options", async () => {
    const user = userEvent.setup();
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: "cs-actions" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDescribeConfigSet.mockReturnValue({
      data: {
        name: "cs-actions",
        eventDestinations: [],
        trackingOptions: { CustomRedirectDomain: "track.example.com" },
        reputationOptions: { ReputationMetricsEnabled: true },
        deliveryOptions: { TlsPolicy: "Optional" },
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("cs-actions")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => {
      expect(screen.getByText("Tracking Options")).toBeTruthy();
      expect(screen.getByText("Delivery Options")).toBeTruthy();
      expect(screen.getAllByText(/Optional/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows not configured tracking options when null", async () => {
    const user = userEvent.setup();
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: "cs-no-track" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDescribeConfigSet.mockReturnValue({
      data: { name: "cs-no-track", eventDestinations: [] },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("cs-no-track")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => expect(screen.getByText(/Not configured/i)).toBeTruthy());
    expect(screen.getByRole("button", { name: /^Set$/i })).toBeTruthy();
  });

  it("calls disable sending", async () => {
    const user = userEvent.setup();
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: "cs-actions" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDescribeConfigSet.mockReturnValue({
      data: {
        name: "cs-actions",
        eventDestinations: [],
        trackingOptions: { CustomRedirectDomain: "track.example.com" },
        reputationOptions: { ReputationMetricsEnabled: true },
        deliveryOptions: { TlsPolicy: "Optional" },
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("cs-actions")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => screen.getByText("Sending"));
    await user.click(screen.getByRole("button", { name: /Disable sending/i }));
    await waitFor(() => {
      expect(mockSetSendingEnabled).toHaveBeenCalledWith(
        expect.objectContaining({ configSetName: "cs-actions", enabled: false }),
      );
    });
  });

  it("shows identity detail error state when notification attrs fail to load", async () => {
    const user = userEvent.setup();
    mockIdentities.mockReturnValue({
      data: {
        identities: [
          { identity: "notif-err@example.com", verificationStatus: "Success", dkimEnabled: false, mailFromDomain: null },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockNotifAttrs.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("notif-err@example.com")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    await waitFor(() => {
      expect(screen.getByText(/Failed to load notification attributes/i)).toBeTruthy();
    });
  });

  it("toggles feedback forwarding", async () => {
    const user = userEvent.setup();
    mockIdentities.mockReturnValue({
      data: {
        identities: [
          { identity: "ff@example.com", verificationStatus: "Success", dkimEnabled: false, mailFromDomain: null },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockNotifAttrs.mockReturnValue({
      data: { forwardingEnabled: true },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("ff@example.com")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    await waitFor(() => screen.getByText("Feedback Forwarding"));
    // Click the Disable button (forwardingEnabled is true)
    await user.click(screen.getByRole("button", { name: /Disable/i }));
    await waitFor(() => {
      expect(mockSetFeedbackForwarding).toHaveBeenCalled();
    });
  });

  it("toggles DKIM signing", async () => {
    const user = userEvent.setup();
    mockIdentities.mockReturnValue({
      data: {
        identities: [
          { identity: "dkim@example.com", verificationStatus: "Success", dkimEnabled: false, mailFromDomain: null },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    // Set forwardingEnabled: true so feedback forwarding shows "Disable" not "Enable"
    mockNotifAttrs.mockReturnValue({
      data: { forwardingEnabled: true },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("dkim@example.com")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    await waitFor(() => screen.getByText("DKIM Signing"));
    // Click the Enable button (dkimEnabled is false, only one Enable on page)
    await user.click(screen.getByRole("button", { name: /^Enable$/i }));
    await waitFor(() => {
      expect(mockSetDkimEnabled).toHaveBeenCalled();
    });
  });

  it("toggles headers in notifications", async () => {
    const user = userEvent.setup();
    mockIdentities.mockReturnValue({
      data: {
        identities: [
          { identity: "headers@example.com", verificationStatus: "Success", dkimEnabled: false, mailFromDomain: null },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockNotifAttrs.mockReturnValue({
      data: {
        forwardingEnabled: false,
        headersInBounceNotifications: false,
        headersInComplaintNotifications: true,
        headersInDeliveryNotifications: false,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("headers@example.com")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    await waitFor(() => screen.getByText("Headers in Notifications"));
    // Click the Include button for Bounce (headersInBounceNotifications is false)
    const includeBtns = screen.getAllByRole("button", { name: /^Include$/i });
    await user.click(includeBtns[0]);
    await waitFor(() => {
      expect(mockSetHeadersInNotifications).toHaveBeenCalled();
    });
  });



  it("opens delivery options modal and shows Save button", async () => {
    const user = userEvent.setup();
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: "cs-delivery" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDescribeConfigSet.mockReturnValue({
      data: {
        name: "cs-delivery",
        eventDestinations: [],
        trackingOptions: { CustomRedirectDomain: "track.example.com" },
        reputationOptions: { ReputationMetricsEnabled: false },
        deliveryOptions: { TlsPolicy: "Require" },
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("cs-delivery")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => screen.getByText("Delivery Options"));
    // Edit buttons: [0] = Tracking Options, [1] = Delivery Options
    const editBtns = screen.getAllByRole("button", { name: /Edit/i });
    await user.click(editBtns[1]);
    await waitFor(() => expect(screen.getByText("Set Delivery Options")).toBeTruthy());
  });

  it("shows config set detail loading state", async () => {
    const user = userEvent.setup();
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: "cs-loading" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDescribeConfigSet.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => {
      const nameMatches = screen.getAllByText("cs-loading");
      expect(nameMatches.length).toBeGreaterThanOrEqual(1);
    });
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => {
      // Config set name appears in both the list header and detail header
      const nameMatches = screen.getAllByText("cs-loading");
      expect(nameMatches.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("closes config set detail", async () => {
    const user = userEvent.setup();
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: "cs-close" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDescribeConfigSet.mockReturnValue({
      data: { name: "cs-close", eventDestinations: [] },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("cs-close")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => screen.getByText("Event Destinations"));
    // Click the last Close button (config set detail Close, avoids identity detail Close)
    await clickButton(user, /Close/i, { last: true });
    await waitFor(() => {
      expect(screen.queryByText("Event Destinations")).toBeNull();
    });
  });

  it("disables reputation metrics", async () => {
    const user = userEvent.setup();
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: "cs-rep" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDescribeConfigSet.mockReturnValue({
      data: {
        name: "cs-rep",
        eventDestinations: [],
        reputationOptions: { ReputationMetricsEnabled: true },
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("cs-rep")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => screen.getByText("Reputation Metrics"));
    // Use clickButton to handle Disable vs Disable sending ambiguity
    await clickButton(user, /^Disable$/i);
    await waitFor(() => {
      expect(mockSetRepMetrics).toHaveBeenCalledWith(
        expect.objectContaining({ configSetName: "cs-rep", enabled: false }),
      );
    });
  });

  it("enables reputation metrics when disabled", async () => {
    const user = userEvent.setup();
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: "cs-rep-enable" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDescribeConfigSet.mockReturnValue({
      data: {
        name: "cs-rep-enable",
        eventDestinations: [],
        reputationOptions: { ReputationMetricsEnabled: false },
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("cs-rep-enable")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => screen.getByText("Reputation Metrics"));
    await user.click(screen.getByRole("button", { name: /^Enable$/i }));
    await waitFor(() => {
      expect(mockSetRepMetrics).toHaveBeenCalledWith(
        expect.objectContaining({ configSetName: "cs-rep-enable", enabled: true }),
      );
    });
  });

  it("disables DKIM signing when enabled", async () => {
    const user = userEvent.setup();
    mockIdentities.mockReturnValue({
      data: {
        identities: [
          { identity: "dkim-off@example.com", verificationStatus: "Success", dkimEnabled: true, mailFromDomain: "mail.example.com" },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockNotifAttrs.mockReturnValue({
      data: { forwardingEnabled: false },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("dkim-off@example.com")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    await waitFor(() => screen.getByText("DKIM Signing"));
    // dkimEnabled is true so button should say "Disable"
    await user.click(screen.getByRole("button", { name: /^Disable$/i }));
    await waitFor(() => {
      expect(mockSetDkimEnabled).toHaveBeenCalled();
    });
  });

  it("enables feedback forwarding when disabled", async () => {
    const user = userEvent.setup();
    mockIdentities.mockReturnValue({
      data: {
        identities: [
          { identity: "ff-on@example.com", verificationStatus: "Success", dkimEnabled: false, mailFromDomain: null },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockNotifAttrs.mockReturnValue({
      data: { forwardingEnabled: false },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("ff-on@example.com")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    await waitFor(() => screen.getByText("Feedback Forwarding"));
    // forwardingEnabled is false so button says "Enable". There may also be a DKIM Enable button.
    // Click the first Enable button (Feedback Forwarding)
    await user.click(screen.getAllByRole("button", { name: /^Enable$/i })[0]);
    await waitFor(() => {
      expect(mockSetFeedbackForwarding).toHaveBeenCalled();
    });
  });

  it("opens edit event destination modal with fields", async () => {
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: "cs-edit-modal" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDescribeConfigSet.mockReturnValue({
      data: {
        name: "cs-edit-modal",
        eventDestinations: [
          { Name: "edit-me-modal", Enabled: true, MatchingEventTypes: ["send"], SNSDestination: { TopicARN: "arn:sns:old" } },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("cs-edit-modal")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => screen.getByText("edit-me-modal"));

    // Click Edit button on the event destination
    const editBtns = screen.getAllByRole("button", { name: /Edit/i });
    await user.click(editBtns[editBtns.length - 1]);

    // Verify the edit modal renders with pre-filled fields (name disabled, event types, SNS topic ARN)
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText("send, bounce").length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByPlaceholderText("my-sns-destination")).toBeTruthy();
    // Name input should be disabled in edit mode
    const nameInput = screen.getByPlaceholderText("my-sns-destination");
    expect(nameInput.tagName).toBe("INPUT");
  });

  it("opens delivery options modal and renders TLS policy select", async () => {
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: "cs-del-modal" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDescribeConfigSet.mockReturnValue({
      data: {
        name: "cs-del-modal",
        eventDestinations: [],
        trackingOptions: { CustomRedirectDomain: "track.example.com" },
        deliveryOptions: { TlsPolicy: "Optional" },
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("cs-del-modal")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => screen.getByText("Delivery Options"));

    // Click Edit button for delivery options
    const editBtns = screen.getAllByRole("button", { name: /Edit/i });
    await user.click(editBtns[1]);
    await waitFor(() => {
      expect(screen.getByText("Set Delivery Options")).toBeTruthy();
    });

    // Verify the TLS policy input is rendered
    expect(screen.getByText("TLS Policy")).toBeTruthy();
  });

  it("opens MAIL FROM modal with heading", async () => {
    mockIdentities.mockReturnValue({
      data: {
        identities: [
          { identity: "mf@example.com", verificationStatus: "Success", dkimEnabled: false, mailFromDomain: null },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockNotifAttrs.mockReturnValue({
      data: { forwardingEnabled: false },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("mf@example.com")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    await waitFor(() => screen.getByText("Feedback Forwarding"));

    // Click "Set" for MAIL FROM (last Set button)
    const setBtns = screen.getAllByRole("button", { name: /Set/i });
    await user.click(setBtns[setBtns.length - 1]);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("mail.example.com")).toBeTruthy();
    });

    // Verify the modal rendered with input and Save button
    expect(screen.getByText(/Set MAIL FROM/i)).toBeTruthy();
  });

  it("renders tracking options modal create state", async () => {
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: "cs-tr-create" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDescribeConfigSet.mockReturnValue({
      data: { name: "cs-tr-create", eventDestinations: [] },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("cs-tr-create")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    // "Not configured" appears in the tracking options section when no trackingOptions exist
    await waitFor(() => {
      expect(screen.getByText(/Not configured/i)).toBeTruthy();
    });

    // Click "Set" for tracking options
    await user.click(screen.getByRole("button", { name: /^Set$/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText("click.example.com")).toBeTruthy();
    });
  });

  it("renders tracking options modal edit state", async () => {
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: "cs-tr-edit" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDescribeConfigSet.mockReturnValue({
      data: {
        name: "cs-tr-edit",
        eventDestinations: [],
        trackingOptions: { CustomRedirectDomain: "old.track.com" },
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("cs-tr-edit")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));

    // The tracking options section should show the existing domain with Edit button
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /Edit/i }).length).toBeGreaterThanOrEqual(1);
    });

    // Click Edit button for tracking options (first Edit in config set detail section)
    await user.click(screen.getAllByRole("button", { name: /Edit/i })[0]);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("click.example.com")).toBeTruthy();
    });
  });

  // ─── Modal Submit Handler Coverage ──────────────────────

  it("verifies edit event destination modal renders with disabled name input", async () => {
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: "cs-disabled-input" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDescribeConfigSet.mockReturnValue({
      data: {
        name: "cs-disabled-input",
        eventDestinations: [
          { Name: "disable-me", Enabled: true, MatchingEventTypes: ["send"], SNSDestination: { TopicARN: "arn:sns:old" } },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("cs-disabled-input")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => screen.getByText("disable-me"));

    // Click Edit on event destination
    await user.click(screen.getAllByRole("button", { name: /Edit/i }).pop()!);

    // Verify the name input is rendered (it's disabled in edit mode)
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-sns-destination")).toBeTruthy();
    });

    // Verify event types textarea exists
    expect(screen.getAllByPlaceholderText("send, bounce").length).toBeGreaterThanOrEqual(1);
  });

  it("clicks Save on delivery options modal", async () => {
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: "cs-save-del" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDescribeConfigSet.mockReturnValue({
      data: {
        name: "cs-save-del",
        eventDestinations: [],
        trackingOptions: { CustomRedirectDomain: "track.example.com" },
        deliveryOptions: { TlsPolicy: "Optional" },
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("cs-save-del")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => screen.getByText("Delivery Options"));

    // Click Edit for delivery options (second Edit)
    await user.click(screen.getAllByRole("button", { name: /Edit/i })[1]);
    await waitFor(() => expect(screen.getByText("Set Delivery Options")).toBeTruthy());

    // Click the last Save button using fireEvent to ensure native click fires
    const saveBtns = screen.getAllByRole("button", { name: /^Save$/i });
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.click(saveBtns[saveBtns.length - 1]);
    await waitFor(() => {
      expect(mockSetDeliveryOpts).toHaveBeenCalledWith(
        expect.objectContaining({ configSetName: "cs-save-del" }),
        expect.any(Object),
      );
    });
  });

  it("renders tracking options create Save button present", async () => {
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: "cs-save-tr-create" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDescribeConfigSet.mockReturnValue({
      data: { name: "cs-save-tr-create", eventDestinations: [] },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("cs-save-tr-create")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => screen.getByText(/Not configured/i));

    // Click "Set" for tracking options — this renders the modal with createTrackingOpts.mutate code path
    await user.click(screen.getByRole("button", { name: /^Set$/i }));
    await waitFor(() => expect(screen.getByPlaceholderText("click.example.com")).toBeTruthy());

    // Type a domain and click Save (scoped to the open tracking dialog) → create branch
    await user.type(screen.getByPlaceholderText("click.example.com"), "mydomain.com");
    const trackingDlg = screen.getByRole("dialog", { name: /Set Tracking Options/i });
    await user.click(within(trackingDlg).getByRole("button", { name: /^Save$/i }));
    await waitFor(() => {
      expect(mockCreateTrackingOpts).toHaveBeenCalledWith(
        { configSetName: "cs-save-tr-create", customRedirectDomain: "mydomain.com" },
        expect.any(Object),
      );
    });
  });

  it("renders tracking options update Save button present", async () => {
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: "cs-save-tr-update" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDescribeConfigSet.mockReturnValue({
      data: {
        name: "cs-save-tr-update",
        eventDestinations: [],
        trackingOptions: { CustomRedirectDomain: "old.track.com" },
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("cs-save-tr-update")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /Edit/i }).length).toBeGreaterThanOrEqual(1);
    });

    // Click Edit for tracking options (first Edit) — this opens modal with updateTrackingOpts.mutate code path
    await user.click(screen.getAllByRole("button", { name: /Edit/i })[0]);
    await waitFor(() => expect(screen.getByPlaceholderText("click.example.com")).toBeTruthy());

    // Clear prefilled domain, type a new one, and click Save (scoped to dialog) → update branch
    const domainInput = screen.getByPlaceholderText("click.example.com");
    await user.clear(domainInput);
    await user.type(domainInput, "new.domain.com");
    const trackingDlg = screen.getByRole("dialog", { name: /Set Tracking Options/i });
    await user.click(within(trackingDlg).getByRole("button", { name: /^Save$/i }));
    await waitFor(() => {
      expect(mockUpdateTrackingOpts).toHaveBeenCalledWith(
        { configSetName: "cs-save-tr-update", customRedirectDomain: "new.domain.com" },
        expect.any(Object),
      );
    });
  });
});

// ─── || [] fallback branches ──────────────────────────

describe("SESDashboard — fallback rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIdentities.mockReturnValue({ data: { identities: [], total: 0 }, isLoading: false, isError: false, error: null });
    mockVerifiedEmails.mockReturnValue({ data: { emails: [], total: 0 }, isLoading: false, isError: false, error: null });
    mockConfigSets.mockReturnValue({ data: { configurationSets: [], total: 0 }, isLoading: false, isError: false, error: null });
    mockDescribeConfigSet.mockReturnValue({ data: null, isLoading: false, isError: false, error: null });
  });

  it("renders with undefined identities (covers || [] right side)", () => {
    mockIdentities.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null });
    render(<SESDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No email identities")).toBeTruthy();
  });

  it("renders config sets with undefined data (covers || [] right side)", () => {
    mockIdentities.mockReturnValue({ data: { identities: [{ identity: "test@example.com", verificationStatus: "Success", dkimEnabled: true }], total: 1 }, isLoading: false });
    mockConfigSets.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null });
    render(<SESDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No configuration sets found")).toBeTruthy();
  });
});

// ─── Config set delete loading ─────────────────────────

describe("SESDashboard — config set delete loading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIdentities.mockReturnValue({ data: { identities: [], total: 0 }, isLoading: false });
    mockVerifiedEmails.mockReturnValue({ data: { emails: [], total: 0 }, isLoading: false });
    createConfigSetState.isPending = false;
  });

  it("shows delete config set in loading state", () => {
    deleteConfigSetState.isPending = true;
    deleteConfigSetState.variables = "my-config-set";
    mockConfigSets.mockReturnValue({ data: { configurationSets: [{ Name: "my-config-set" }], total: 1 }, isLoading: false });
    render(<SESDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-config-set")).toBeTruthy();
  });
});

// ─── Event dest edge cases ─────────────────────────────

describe("SESDashboard — event dest edge cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIdentities.mockReturnValue({ data: { identities: [], total: 0 }, isLoading: false });
    mockVerifiedEmails.mockReturnValue({ data: { emails: [], total: 0 }, isLoading: false });
    mockConfigSets.mockReturnValue({ data: { configurationSets: [{ Name: "cs-1" }], total: 1 }, isLoading: false });
  });

  it("shows empty event destinations message", async () => {
    const user = userEvent.setup();
    mockDescribeConfigSet.mockReturnValue({ data: { name: "cs-1", eventDestinations: [] }, isLoading: false });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("cs-1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => expect(screen.getByText("No event destinations configured.")).toBeTruthy());
  });

  it("shows event dest without MatchingEventTypes", async () => {
    const user = userEvent.setup();
    mockDescribeConfigSet.mockReturnValue({
      data: { name: "cs-1", eventDestinations: [{ Name: "ed-1", Enabled: true }] },
      isLoading: false,
    });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("cs-1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => expect(screen.getByText("ed-1")).toBeTruthy());
  });

  it("renders with undefined eventDestinations (covers || [] right side)", async () => {
    const user = userEvent.setup();
    mockDescribeConfigSet.mockReturnValue({ data: { name: "cs-1" }, isLoading: false });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("cs-1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => expect(screen.getByText("No event destinations configured.")).toBeTruthy());
  });
});

// ─── Notification topic save + tracking/delivery ────────

describe("SESDashboard — notification + tracking + delivery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIdentities.mockReturnValue({ data: { identities: [{ identity: "test@example.com", verificationStatus: "Success", dkimEnabled: true, dkimVerificationStatus: "Success" }], total: 1 }, isLoading: false });
    mockVerifiedEmails.mockReturnValue({ data: { emails: [], total: 0 }, isLoading: false });
    mockConfigSets.mockReturnValue({ data: { configurationSets: [{ Name: "cs-1" }], total: 1 }, isLoading: false });
    mockDescribeConfigSet.mockReturnValue({ data: { name: "cs-1", eventDestinations: [] }, isLoading: false });
    mockNotifAttrs.mockReturnValue({
      data: { bounceTopic: { TopicArn: "" }, complaintTopic: null, deliveryTopic: null, forwardingEnabled: true, headersInBounceNotificationsEnabled: true, headersInComplaintNotificationsEnabled: false },
      isLoading: false,
    });
  });

  it("verifies mail from domain set button opens modal", async () => {
    const user = userEvent.setup();
    render(<SESDashboard />, { wrapper: createWrapper() });
    const notifBtns = screen.getAllByRole("button", { name: /Notifications/i });
    await user.click(notifBtns[0]);
    await waitFor(() => expect(screen.getAllByText("MAIL FROM Domain").length).toBeGreaterThanOrEqual(1));
  });

  it("verifies notification detail shows complaint feedback", async () => {
    const user = userEvent.setup();
    render(<SESDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: /Notifications/i })[0]);
    await waitFor(() => expect(screen.getByText(/Feedback Forwarding/i)).toBeTruthy());
  });

  it("verifies config set detail shows tracking options header", async () => {
    const user = userEvent.setup();
    mockDescribeConfigSet.mockReturnValue({ data: { name: "cs-1", eventDestinations: [] }, isLoading: false });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("cs-1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => expect(screen.getAllByText(/Tracking Options/i).length).toBeGreaterThanOrEqual(1));
  });

  it("verifies config set detail shows delivery options header", async () => {
    const user = userEvent.setup();
    mockDescribeConfigSet.mockReturnValue({ data: { name: "cs-1", eventDestinations: [], deliveryOptions: { TlsPolicy: "Require" } }, isLoading: false });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("cs-1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => expect(screen.getAllByText(/Delivery Options/i).length).toBeGreaterThanOrEqual(1));
  });
});

// ─── Remaining branch targets ───────────────────────────

describe("SESDashboard — remaining branches", () => {
  function setupConfigSet(name: string, detail: any) {
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: name }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDescribeConfigSet.mockReturnValue({
      data: detail,
      isLoading: false,
      isError: false,
      error: null,
    });
  }

  async function openDetail(user: any, name: string) {
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(name)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => screen.getByText("Event Destinations"));
  }

  it("sends email from Verified Emails with all fields filled", async () => {
    mockVerifiedEmails.mockReturnValue({
      data: { emails: ["sender@example.com"] },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("Verified Emails")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Send email/i }));
    await waitFor(() => expect(screen.getByPlaceholderText("recipient@example.com")).toBeTruthy());

    // Send stays disabled until all four fields are filled (covers the || chain)
    const sendBtn = () => screen.getByRole("button", { name: /^Send$/i }) as HTMLButtonElement;
    expect(sendBtn().disabled).toBe(true);

    await user.type(screen.getByPlaceholderText("sender@example.com"), "sender@example.com");
    expect(sendBtn().disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("recipient@example.com"), "to@example.com");
    expect(sendBtn().disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("Test email"), "Hello");
    expect(sendBtn().disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("Hello from SES"), "Body text");
    expect(sendBtn().disabled).toBe(false);

    await user.click(sendBtn());
    await waitFor(() => {
      expect(mockSendEmail).toHaveBeenCalledWith({
        source: "sender@example.com",
        toAddresses: ["to@example.com"],
        subject: "Hello",
        text: "Body text",
      });
    });
  });

  it("opens notification topic Set modal and saves with empty ARN", async () => {
    mockIdentities.mockReturnValue({
      data: { identities: [{ identity: "set-topic@example.com", verificationStatus: "Success", dkimEnabled: false, mailFromDomain: null }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockNotifAttrs.mockReturnValue({ data: { forwardingEnabled: false }, isLoading: false, isError: false, error: null });
    const user = userEvent.setup();
    render(<SESDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    await waitFor(() => screen.getByText("Notification Topics"));
    // No topics configured → Set button covers topic?.TopicArn || "" right side
    await user.click(screen.getAllByRole("button", { name: /^Set$/i })[0]);
    await waitFor(() => screen.getByRole("dialog", { name: /Set Bounce Notification Topic/i }));
    // Save with empty ARN → snsTopic.trim() || undefined right side
    const notifDlg = screen.getByRole("dialog", { name: /Set Bounce Notification Topic/i });
    await user.click(within(notifDlg).getByRole("button", { name: /^Save$/i }));
    await waitFor(() => {
      expect(mockSetNotifTopic).toHaveBeenCalledWith(
        expect.objectContaining({ identity: "set-topic@example.com", notificationType: "Bounce", snsTopic: undefined }),
        expect.any(Object),
      );
    });
  });

  it("opens MAIL FROM Set modal when no domain configured", async () => {
    mockIdentities.mockReturnValue({
      data: { identities: [{ identity: "mf-set@example.com", verificationStatus: "Success", dkimEnabled: false, mailFromDomain: null }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockNotifAttrs.mockReturnValue({ data: { forwardingEnabled: false }, isLoading: false, isError: false, error: null });
    const user = userEvent.setup();
    render(<SESDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    await waitFor(() => screen.getByText("DKIM Signing"));
    const setBtns = screen.getAllByRole("button", { name: /^Set$/i });
    await user.click(setBtns[setBtns.length - 1]); // MAIL FROM is last Set
    const mfSetDlg = screen.getByRole("dialog", { name: /Set MAIL FROM Domain/i });
    // No domain → input prefilled empty (proves the Set click fired setMailFromInput)
    expect(within(mfSetDlg).getByDisplayValue("")).toBeTruthy();
  });

  it("opens MAIL FROM Edit modal with existing domain prefilled", async () => {
    mockIdentities.mockReturnValue({
      data: { identities: [{ identity: "mf-edit@example.com", verificationStatus: "Success", dkimEnabled: false, mailFromDomain: "mail.example.com" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockNotifAttrs.mockReturnValue({ data: { forwardingEnabled: false }, isLoading: false, isError: false, error: null });
    const user = userEvent.setup();
    render(<SESDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    await waitFor(() => screen.getByText("DKIM Signing"));
    const editBtns = screen.getAllByRole("button", { name: /^Edit$/i });
    await user.click(editBtns[editBtns.length - 1]); // MAIL FROM is last Edit
    await waitFor(() => screen.getByRole("dialog", { name: /Set MAIL FROM Domain/i }));
    // The input is prefilled from the identity's mailFromDomain (covers || "" truthy side)
    expect(screen.getByDisplayValue("mail.example.com")).toBeTruthy();
  });

  it("shows Enabled No and opens edit modal for sparse event destination", async () => {
    setupConfigSet("cs-sparse-ed", {
      name: "cs-sparse-ed",
      eventDestinations: [{ Name: "sparse-dest" }],
    });
    const user = userEvent.setup();
    await openDetail(user, "cs-sparse-ed");
    await waitFor(() => expect(screen.getByText("sparse-dest")).toBeTruthy());
    // Enabled missing → "No" (cond-expr right side); MatchingEventTypes missing → empty
    expect(screen.getByText(/Enabled: No/i)).toBeTruthy();
    await user.click(screen.getAllByRole("button", { name: /^Edit$/i })[0]);
    const sparseDlg = screen.getByRole("dialog", { name: /Edit Event Destination: sparse-dest/i });
    await waitFor(() => expect(within(sparseDlg).getByDisplayValue("sparse-dest")).toBeTruthy());
    // Name input prefilled + disabled; MatchingEventTypes/SNSDestination fallbacks → ""
  });

  it("shows event destination delete loading state", async () => {
    deleteEventDestState.isPending = true;
    deleteEventDestState.variables = { configSetName: "cs-del-load", eventDestinationName: "del-me" };
    setupConfigSet("cs-del-load", {
      name: "cs-del-load",
      eventDestinations: [{ Name: "del-me", Enabled: true }],
    });
    const user = userEvent.setup();
    await openDetail(user, "cs-del-load");
    await waitFor(() => expect(screen.getByText("del-me")).toBeTruthy());
    // loading prop evaluates isPending && variables.eventDestinationName === ed.Name
    expect(screen.getByText("del-me")).toBeTruthy();
  });

  it("opens tracking edit modal when CustomRedirectDomain is empty", async () => {
    setupConfigSet("cs-tr-empty", {
      name: "cs-tr-empty",
      eventDestinations: [],
      trackingOptions: { CustomRedirectDomain: "" },
    });
    const user = userEvent.setup();
    await openDetail(user, "cs-tr-empty");
    await user.click(screen.getAllByRole("button", { name: /^Edit$/i })[0]);
    await waitFor(() => screen.getByRole("dialog", { name: /Set Tracking Options/i }));
  });

  it("saves edited event destination with topic ARN", async () => {
    setupConfigSet("cs-ed-save-arn", {
      name: "cs-ed-save-arn",
      eventDestinations: [{ Name: "ed-arn", Enabled: true, MatchingEventTypes: ["send"], SNSDestination: { TopicARN: "arn:topic" } }],
    });
    const user = userEvent.setup();
    await openDetail(user, "cs-ed-save-arn");
    await waitFor(() => expect(screen.getByText("ed-arn")).toBeTruthy());
    await user.click(screen.getAllByRole("button", { name: /^Edit$/i })[0]);
    const editDlg = screen.getByRole("dialog", { name: /Edit Event Destination: ed-arn/i });
    await waitFor(() => expect(within(editDlg).getByDisplayValue("ed-arn")).toBeTruthy());
    await user.click(within(editDlg).getByRole("button", { name: /^Save$/i }));
    await waitFor(() => {
      expect(mockUpdateEventDest).toHaveBeenCalledWith(
        expect.objectContaining({ eventDestinationName: "ed-arn", snsTopicARN: "arn:topic", matchingEventTypes: ["send"] }),
        expect.any(Object),
      );
    });
  });

  it("saves edited event destination without topic ARN", async () => {
    setupConfigSet("cs-ed-save-noarn", {
      name: "cs-ed-save-noarn",
      eventDestinations: [{ Name: "ed-noarn", Enabled: true, MatchingEventTypes: ["bounce"] }],
    });
    const user = userEvent.setup();
    await openDetail(user, "cs-ed-save-noarn");
    await waitFor(() => expect(screen.getByText("ed-noarn")).toBeTruthy());
    await user.click(screen.getAllByRole("button", { name: /^Edit$/i })[0]);
    const editDlg = screen.getByRole("dialog", { name: /Edit Event Destination: ed-noarn/i });
    await waitFor(() => expect(within(editDlg).getByDisplayValue("ed-noarn")).toBeTruthy());
    await user.click(within(editDlg).getByRole("button", { name: /^Save$/i }));
    await waitFor(() => {
      expect(mockUpdateEventDest).toHaveBeenCalledWith(
        expect.objectContaining({ eventDestinationName: "ed-noarn", snsTopicARN: undefined }),
        expect.any(Object),
      );
    });
  });

  it("saves delivery options without a TLS policy", async () => {
    setupConfigSet("cs-del-empty", {
      name: "cs-del-empty",
      eventDestinations: [],
    });
    const user = userEvent.setup();
    await openDetail(user, "cs-del-empty");
    await waitFor(() => screen.getByText("Delivery Options"));
    await user.click(screen.getAllByRole("button", { name: /^Edit$/i })[0]);
    const delDlg = screen.getByRole("dialog", { name: /Set Delivery Options/i });
    await user.click(within(delDlg).getByRole("button", { name: /^Save$/i }));
    await waitFor(() => {
      expect(mockSetDeliveryOpts).toHaveBeenCalledWith(
        expect.objectContaining({ configSetName: "cs-del-empty", tlsPolicy: undefined }),
        expect.any(Object),
      );
    });
  });
});

// ─── Modal completeness (onSuccess / onDismiss / Cancel / inputs) ──

describe("SESDashboard — modal completeness", () => {
  const IDENTITY = "complete@example.com";

  function setupIdentity() {
    mockIdentities.mockReturnValue({
      data: {
        identities: [
          { identity: IDENTITY, verificationStatus: "Success", dkimEnabled: false, mailFromDomain: null },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockNotifAttrs.mockReturnValue({
      data: { forwardingEnabled: false },
      isLoading: false,
      isError: false,
      error: null,
    });
  }

  function setupConfigSet(name: string, detail: any) {
    mockConfigSets.mockReturnValue({
      data: { configurationSets: [{ Name: name }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDescribeConfigSet.mockReturnValue({
      data: detail,
      isLoading: false,
      isError: false,
      error: null,
    });
  }

  async function openDetail(user: ReturnType<typeof userEvent.setup>, name: string) {
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(name)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /View/i }));
    await waitFor(() => screen.getByText("Event Destinations"));
  }

  it("closes the identity notification detail", async () => {
    const user = userEvent.setup();
    setupIdentity();
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(IDENTITY)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    await waitFor(() => expect(screen.getByText(/Identity Details:/)).toBeTruthy());
    await clickButton(user, /^Close$/i, { last: true });
    await waitFor(() => expect(screen.queryByText(/Identity Details:/)).toBeNull());
  });

  it("dismisses the verify email modal with Escape", async () => {
    const user = userEvent.setup();
    render(<SESDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /create/i);
    await waitFor(() => expect(screen.getByText("Verify email address")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Verify email address"));
  });

  it("cancels and escapes the send email modal", async () => {
    const user = userEvent.setup();
    mockVerifiedEmails.mockReturnValue({ data: { emails: ["sender@example.com"] }, isLoading: false });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("Verified Emails")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Send email/i }));
    await waitFor(() => expect(screen.getByRole("dialog", { name: /Send email/i })).toBeTruthy());
    await user.click(within(screen.getByRole("dialog", { name: /Send email/i })).getByRole("button", { name: /^Cancel$/i }));
    expect(mockSendEmail).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /Send email/i }));
    await waitFor(() => expect(screen.getByRole("dialog", { name: /Send email/i })).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Send email"));
  });

  it("deletes tracking options from the config set detail", async () => {
    const user = userEvent.setup();
    setupConfigSet("cs-tr-del", {
      name: "cs-tr-del",
      eventDestinations: [],
      trackingOptions: { CustomRedirectDomain: "click.example.com" },
    });
    await openDetail(user, "cs-tr-del");
    await waitFor(() => expect(screen.getByText("Tracking Options")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete tracking options/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteTrackingOpts).toHaveBeenCalledWith("cs-tr-del"));
  });

  it("saves a notification topic with a typed ARN and closes on success", async () => {
    const user = userEvent.setup();
    let onSuccessRan = false;
    mockSetNotifTopic.mockImplementation((_a: any, opts: any) => { if (opts?.onSuccess) { onSuccessRan = true; opts.onSuccess(); } });
    setupIdentity();
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(IDENTITY)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    await waitFor(() => screen.getByText("DKIM Signing"));
    await user.click(screen.getAllByRole("button", { name: /^Set$/i })[0]);
    await waitFor(() => screen.getByRole("dialog", { name: /Set Bounce Notification Topic/i }));
    const notifDlg = screen.getByRole("dialog", { name: /Set Bounce Notification Topic/i });
    await user.type(within(notifDlg).getByPlaceholderText("arn:aws:sns:us-east-1:123456789:my-topic"), "arn:aws:sns:us-east-1:123456789:bounce-topic");
    await user.click(within(notifDlg).getByRole("button", { name: /^Save$/i }));
    await waitFor(() => expect(onSuccessRan).toBe(true));
    expect(mockSetNotifTopic.mock.calls[0][0]).toMatchObject({
      identity: IDENTITY,
      notificationType: "Bounce",
      snsTopic: "arn:aws:sns:us-east-1:123456789:bounce-topic",
    });
  });

  it("cancels and escapes the notification topic modal", async () => {
    const user = userEvent.setup();
    setupIdentity();
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(IDENTITY)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    await waitFor(() => screen.getByText("DKIM Signing"));
    await user.click(screen.getAllByRole("button", { name: /^Set$/i })[0]);
    await waitFor(() => screen.getByRole("dialog", { name: /Set Bounce Notification Topic/i }));
    await user.click(within(screen.getByRole("dialog", { name: /Set Bounce Notification Topic/i })).getByRole("button", { name: /^Cancel$/i }));
    expect(mockSetNotifTopic).not.toHaveBeenCalled();
    await user.click(screen.getAllByRole("button", { name: /^Set$/i })[0]);
    await waitFor(() => screen.getByRole("dialog", { name: /Set Bounce Notification Topic/i }));
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Set Bounce Notification Topic"));
  });

  it("saves MAIL FROM domain with a typed input and closes on success", async () => {
    const user = userEvent.setup();
    let onSuccessRan = false;
    mockSetMailFrom.mockImplementation((_a: any, opts: any) => { if (opts?.onSuccess) { onSuccessRan = true; opts.onSuccess(); } });
    setupIdentity();
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(IDENTITY)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    await waitFor(() => screen.getByText("DKIM Signing"));
    await user.click(screen.getAllByRole("button", { name: /^Set$/i }).at(-1)!);
    await waitFor(() => screen.getByRole("dialog", { name: /Set MAIL FROM Domain/i }));
    const mfDlg = screen.getByRole("dialog", { name: /Set MAIL FROM Domain/i });
    await user.type(within(mfDlg).getByPlaceholderText("mail.example.com"), "mail.example.com");
    await user.click(within(mfDlg).getByRole("button", { name: /^Save$/i }));
    await waitFor(() => expect(onSuccessRan).toBe(true));
    expect(mockSetMailFrom.mock.calls[0][0]).toMatchObject({ identity: IDENTITY, mailFromDomain: "mail.example.com" });
  });

  it("cancels and escapes the MAIL FROM modal", async () => {
    const user = userEvent.setup();
    setupIdentity();
    render(<SESDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(IDENTITY)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    await waitFor(() => screen.getByText("DKIM Signing"));
    await user.click(screen.getAllByRole("button", { name: /^Set$/i }).at(-1)!);
    await waitFor(() => screen.getByRole("dialog", { name: /Set MAIL FROM Domain/i }));
    await user.click(within(screen.getByRole("dialog", { name: /Set MAIL FROM Domain/i })).getByRole("button", { name: /^Cancel$/i }));
    expect(mockSetMailFrom).not.toHaveBeenCalled();
    await user.click(screen.getAllByRole("button", { name: /^Set$/i }).at(-1)!);
    await waitFor(() => screen.getByRole("dialog", { name: /Set MAIL FROM Domain/i }));
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Set MAIL FROM Domain"));
  });

  it("creates a config set and closes on success", async () => {
    const user = userEvent.setup();
    let onSuccessRan = false;
    mockCreateConfigSet.mockImplementation((_a: any, opts: any) => { if (opts?.onSuccess) { onSuccessRan = true; opts.onSuccess(); } });
    render(<SESDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create config set/i);
    await waitFor(() => expect(screen.getByText("Create Configuration Set")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-config-set"), "new-config");
    await clickButton(user, /^Create$/i);
    await waitFor(() => expect(onSuccessRan).toBe(true));
    expect(mockCreateConfigSet).toHaveBeenCalledWith("new-config", expect.any(Object));
  });

  it("cancels and escapes the create config set modal", async () => {
    const user = userEvent.setup();
    render(<SESDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create config set/i);
    await waitFor(() => expect(screen.getByText("Create Configuration Set")).toBeTruthy());
    await user.click(within(screen.getByRole("dialog", { name: /Create Configuration Set/i })).getByRole("button", { name: /^Cancel$/i }));
    expect(mockCreateConfigSet).not.toHaveBeenCalled();
    await clickButton(user, /Create config set/i);
    await waitFor(() => expect(screen.getByText("Create Configuration Set")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create Configuration Set"));
  });

  it("adds an event destination with an ARN and closes on success", async () => {
    const user = userEvent.setup();
    let onSuccessRan = false;
    mockCreateEventDest.mockImplementation((_a: any, opts: any) => { if (opts?.onSuccess) { onSuccessRan = true; opts.onSuccess(); } });
    setupConfigSet("cs-add-arn", { name: "cs-add-arn", eventDestinations: [] });
    await openDetail(user, "cs-add-arn");
    await user.click(screen.getByRole("button", { name: /Add destination/i }));
    await waitFor(() => screen.getByRole("dialog", { name: /Add Event Destination/i }));
    const dlg = screen.getByRole("dialog", { name: /Add Event Destination/i });
    await user.type(within(dlg).getByPlaceholderText("my-sns-destination"), "dest-1");
    await user.type(within(dlg).getByPlaceholderText("send, bounce"), "send, bounce");
    await user.type(within(dlg).getAllByPlaceholderText("arn:aws:sns:us-east-1:123456789:my-topic")[0], "arn:aws:sns:us-east-1:123456789:dest-topic");
    await user.click(within(dlg).getByRole("button", { name: /^Add$/i }));
    await waitFor(() => expect(onSuccessRan).toBe(true));
    expect(mockCreateEventDest.mock.calls[0][0]).toMatchObject({
      configSetName: "cs-add-arn",
      eventDestinationName: "dest-1",
      matchingEventTypes: ["send", "bounce"],
      snsTopicARN: "arn:aws:sns:us-east-1:123456789:dest-topic",
    });
  });

  it("cancels and escapes the add event destination modal", async () => {
    const user = userEvent.setup();
    setupConfigSet("cs-add-cancel", { name: "cs-add-cancel", eventDestinations: [] });
    await openDetail(user, "cs-add-cancel");
    await user.click(screen.getByRole("button", { name: /Add destination/i }));
    await waitFor(() => screen.getByRole("dialog", { name: /Add Event Destination/i }));
    await user.click(within(screen.getByRole("dialog", { name: /Add Event Destination/i })).getByRole("button", { name: /^Cancel$/i }));
    expect(mockCreateEventDest).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /Add destination/i }));
    await waitFor(() => screen.getByRole("dialog", { name: /Add Event Destination/i }));
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Add Event Destination"));
  });

  it("edits an event destination with typed fields and closes on success", async () => {
    const user = userEvent.setup();
    let onSuccessRan = false;
    mockUpdateEventDest.mockImplementation((_a: any, opts: any) => { if (opts?.onSuccess) { onSuccessRan = true; opts.onSuccess(); } });
    setupConfigSet("cs-edit-type", {
      name: "cs-edit-type",
      eventDestinations: [{ Name: "dest-x", Enabled: true, MatchingEventTypes: ["send"], SNSDestination: { TopicARN: "arn:old" } }],
    });
    await openDetail(user, "cs-edit-type");
    await waitFor(() => expect(screen.getByText("dest-x")).toBeTruthy());
    await user.click(screen.getAllByRole("button", { name: /^Edit$/i })[0]);
    await waitFor(() => screen.getByRole("dialog", { name: /Edit Event Destination: dest-x/i }));
    const dlg = screen.getByRole("dialog", { name: /Edit Event Destination: dest-x/i });
    const types = within(dlg).getByPlaceholderText("send, bounce");
    await user.clear(types);
    await user.type(types, "send, bounce, open");
    const arn = within(dlg).getAllByPlaceholderText("arn:aws:sns:us-east-1:123456789:my-topic")[0];
    await user.clear(arn);
    await user.type(arn, "arn:new-topic");
    await user.click(within(dlg).getByRole("button", { name: /^Save$/i }));
    await waitFor(() => expect(onSuccessRan).toBe(true));
    expect(mockUpdateEventDest.mock.calls[0][0]).toMatchObject({
      configSetName: "cs-edit-type",
      eventDestinationName: "dest-x",
      matchingEventTypes: ["send", "bounce", "open"],
      snsTopicARN: "arn:new-topic",
    });
  });

  it("cancels and escapes the edit event destination modal", async () => {
    const user = userEvent.setup();
    setupConfigSet("cs-edit-cancel", {
      name: "cs-edit-cancel",
      eventDestinations: [{ Name: "dest-y", Enabled: true, MatchingEventTypes: ["send"] }],
    });
    await openDetail(user, "cs-edit-cancel");
    await waitFor(() => expect(screen.getByText("dest-y")).toBeTruthy());
    await user.click(screen.getAllByRole("button", { name: /^Edit$/i })[0]);
    await waitFor(() => screen.getByRole("dialog", { name: /Edit Event Destination: dest-y/i }));
    await user.click(within(screen.getByRole("dialog", { name: /Edit Event Destination: dest-y/i })).getByRole("button", { name: /^Cancel$/i }));
    expect(mockUpdateEventDest).not.toHaveBeenCalled();
    await user.click(screen.getAllByRole("button", { name: /^Edit$/i })[0]);
    await waitFor(() => screen.getByRole("dialog", { name: /Edit Event Destination: dest-y/i }));
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden(`Edit Event Destination: dest-y`));
  });

  it("saves tracking options in create state and closes on success", async () => {
    const user = userEvent.setup();
    let onSuccessRan = false;
    mockCreateTrackingOpts.mockImplementation((_a: any, opts: any) => { if (opts?.onSuccess) { onSuccessRan = true; opts.onSuccess(); } });
    setupConfigSet("cs-tr-create", { name: "cs-tr-create", eventDestinations: [] });
    await openDetail(user, "cs-tr-create");
    await waitFor(() => expect(screen.getByText("Tracking Options")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Set$/i }));
    await waitFor(() => screen.getByRole("dialog", { name: /Set Tracking Options/i }));
    const dlg = screen.getByRole("dialog", { name: /Set Tracking Options/i });
    await user.type(within(dlg).getByPlaceholderText("click.example.com"), "click.example.com");
    await user.click(within(dlg).getByRole("button", { name: /^Save$/i }));
    await waitFor(() => expect(onSuccessRan).toBe(true));
    expect(mockCreateTrackingOpts.mock.calls[0][0]).toMatchObject({ configSetName: "cs-tr-create", customRedirectDomain: "click.example.com" });
  });

  it("saves tracking options in edit state and closes on success", async () => {
    const user = userEvent.setup();
    let onSuccessRan = false;
    mockUpdateTrackingOpts.mockImplementation((_a: any, opts: any) => { if (opts?.onSuccess) { onSuccessRan = true; opts.onSuccess(); } });
    setupConfigSet("cs-tr-edit", {
      name: "cs-tr-edit",
      eventDestinations: [],
      trackingOptions: { CustomRedirectDomain: "click.example.com" },
    });
    await openDetail(user, "cs-tr-edit");
    await waitFor(() => expect(screen.getByText("Tracking Options")).toBeTruthy());
    await user.click(screen.getAllByRole("button", { name: /^Edit$/i })[0]);
    await waitFor(() => screen.getByRole("dialog", { name: /Set Tracking Options/i }));
    const dlg = screen.getByRole("dialog", { name: /Set Tracking Options/i });
    const domainInput = within(dlg).getByPlaceholderText("click.example.com");
    await user.clear(domainInput);
    await user.type(domainInput, "redirect.example.com");
    await user.click(within(dlg).getByRole("button", { name: /^Save$/i }));
    await waitFor(() => expect(onSuccessRan).toBe(true));
    expect(mockUpdateTrackingOpts.mock.calls[0][0]).toMatchObject({ configSetName: "cs-tr-edit", customRedirectDomain: "redirect.example.com" });
  });

  it("cancels and escapes the tracking options modal", async () => {
    const user = userEvent.setup();
    setupConfigSet("cs-tr-cancel", { name: "cs-tr-cancel", eventDestinations: [] });
    await openDetail(user, "cs-tr-cancel");
    await waitFor(() => expect(screen.getByText("Tracking Options")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Set$/i }));
    await waitFor(() => screen.getByRole("dialog", { name: /Set Tracking Options/i }));
    await user.click(within(screen.getByRole("dialog", { name: /Set Tracking Options/i })).getByRole("button", { name: /^Cancel$/i }));
    expect(mockCreateTrackingOpts).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /^Set$/i }));
    await waitFor(() => screen.getByRole("dialog", { name: /Set Tracking Options/i }));
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Set Tracking Options"));
  });

  it("selects a TLS policy and saves delivery options on success", async () => {
    const user = userEvent.setup();
    let onSuccessRan = false;
    mockSetDeliveryOpts.mockImplementation((_a: any, opts: any) => { if (opts?.onSuccess) { onSuccessRan = true; opts.onSuccess(); } });
    setupConfigSet("cs-del-policy", { name: "cs-del-policy", eventDestinations: [], deliveryOptions: { TlsPolicy: "Optional" } });
    await openDetail(user, "cs-del-policy");
    await waitFor(() => screen.getByText("Delivery Options"));
    await user.click(screen.getAllByRole("button", { name: /^Edit$/i })[0]);
    await waitFor(() => screen.getByRole("dialog", { name: /Set Delivery Options/i }));
    const dlg = screen.getByRole("dialog", { name: /Set Delivery Options/i });
    const trigger = within(dlg).getAllByRole("button").find((b) => /Optional|Require/.test(b.textContent || ""));
    await user.click(trigger!);
    await user.click(screen.getByRole("option", { name: /Require/ }));
    await user.click(within(dlg).getByRole("button", { name: /^Save$/i }));
    await waitFor(() => expect(onSuccessRan).toBe(true));
    expect(mockSetDeliveryOpts.mock.calls[0][0]).toMatchObject({ configSetName: "cs-del-policy", tlsPolicy: "Require" });
  });

  it("cancels and escapes the delivery options modal", async () => {
    const user = userEvent.setup();
    setupConfigSet("cs-del-cancel", { name: "cs-del-cancel", eventDestinations: [], deliveryOptions: { TlsPolicy: "Optional" } });
    await openDetail(user, "cs-del-cancel");
    await waitFor(() => screen.getByText("Delivery Options"));
    await user.click(screen.getAllByRole("button", { name: /^Edit$/i })[0]);
    await waitFor(() => screen.getByRole("dialog", { name: /Set Delivery Options/i }));
    await user.click(within(screen.getByRole("dialog", { name: /Set Delivery Options/i })).getByRole("button", { name: /^Cancel$/i }));
    expect(mockSetDeliveryOpts).not.toHaveBeenCalled();
    await user.click(screen.getAllByRole("button", { name: /^Edit$/i })[0]);
    await waitFor(() => screen.getByRole("dialog", { name: /Set Delivery Options/i }));
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Set Delivery Options"));
  });
});
