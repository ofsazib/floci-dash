// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── vi.hoisted mutable states ──────────────────────────

const assumeRoleState = vi.hoisted(() => ({
  isPending: false,
}));

const sessionTokenState = vi.hoisted(() => ({
  isPending: false,
}));

// ─── Mock hooks ─────────────────────────────────────────

const mockCallerIdentity = vi.fn();

// Mutate mocks that call onSuccess with test data
const mockSamlAssume = vi.fn();
const samlState = vi.hoisted(() => ({ isError: false, error: null as Error | null }));
const webState = vi.hoisted(() => ({ isError: false, error: null as Error | null }));
const fedState = vi.hoisted(() => ({ isError: false, error: null as Error | null }));
const mockWebIdentityAssume = vi.fn();
const mockFederationToken = vi.fn();
const mockDecode = vi.fn();
const mockAssumeRole = vi.fn((_params: any, options?: { onSuccess?: (data: any) => void }) => {
  options?.onSuccess?.({
    credentials: {
      accessKeyId: "ASIA123456",
      secretAccessKey: "secretKey",
      sessionToken: "token123",
      expiration: "2026-12-31T23:59:59Z",
    },
    assumedRoleUser: {
      assumedRoleId: "AROA123456:session",
      arn: "arn:aws:iam::123456789012:role/my-role",
    },
  });
});

const mockGetSessionToken = vi.fn((_params: any, options?: { onSuccess?: (data: any) => void }) => {
  options?.onSuccess?.({
    credentials: {
      accessKeyId: "ASIA789012",
      secretAccessKey: "secretKey2",
      sessionToken: "token456",
      expiration: "2026-12-31T23:59:59Z",
    },
  });
});

vi.mock("../../hooks/useSTS", () => ({
  useSTSCallerIdentity: (...args: any[]) => mockCallerIdentity(...args),
  useSTSAssumeRole: () => ({
    mutate: mockAssumeRole,
    get isPending() { return assumeRoleState.isPending; },
  }),
  useSTSGetSessionToken: () => ({
    mutate: mockGetSessionToken,
    get isPending() { return sessionTokenState.isPending; },
  }),
  useSTSAssumeRoleWithSAML: () => ({
    mutate: mockSamlAssume,
    isPending: false,
    get isError() { return samlState.isError; },
    get error() { return samlState.error; },
  }),
  useSTSAssumeRoleWithWebIdentity: () => ({
    mutate: mockWebIdentityAssume,
    isPending: false,
    get isError() { return webState.isError; },
    get error() { return webState.error; },
  }),
  useSTSGetFederationToken: () => ({
    mutate: mockFederationToken,
    isPending: false,
    get isError() { return fedState.isError; },
    get error() { return fedState.error; },
  }),
  useSTSDecodeAuthorizationMessage: () => ({
    mutate: mockDecode,
    isPending: false,
  }),
}));

import { STSDashboard } from "./STSDashboard";

// ─── Modal helpers ───────────────────────────────────────

/** Fire Escape on every mounted Cloudscape dialog (they stay mounted when hidden). */
function dismissModalWithEscape() {
  document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
    fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27 });
  });
}

/** Locate a modal dialog by its header text. */
function dialogOf(headerText: string): HTMLElement {
  const header = screen.getAllByText(headerText).find((h) => h.closest('[role="dialog"]'));
  return header!.closest('[role="dialog"]') as HTMLElement;
}

/** Assert the modal with the given header is hidden (Cloudscape uses display:none). */
function expectModalHidden(headerText: string) {
  expect(dialogOf(headerText).className).toContain("hidden");
}

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  samlState.isError = false;
  samlState.error = null;
  webState.isError = false;
  webState.error = null;
  fedState.isError = false;
  fedState.error = null;
  vi.clearAllMocks();
  assumeRoleState.isPending = false;
  sessionTokenState.isPending = false;
  mockCallerIdentity.mockReturnValue({
    data: { account: "123456789012", userId: "AIDAEXAMPLE", arn: "arn:aws:iam::123456789012:user/test" },
    isLoading: false,
    isError: false,
    error: null,
  });
});

// ─── Tests ──────────────────────────────────────────────

describe("STSDashboard — caller identity tab", () => {
  it("shows loading skeleton when loading", () => {
    mockCallerIdentity.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    const { container } = render(<STSDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("renders caller identity with data", () => {
    render(<STSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("123456789012")).toBeTruthy();
    expect(screen.getByText("AIDAEXAMPLE")).toBeTruthy();
    expect(screen.getByText("arn:aws:iam::123456789012:user/test")).toBeTruthy();
  });

  it("shows em-dash for null identity fields", () => {
    mockCallerIdentity.mockReturnValue({
      data: { account: null, userId: null, arn: null },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<STSDashboard />, { wrapper: createWrapper() });
    const dashes = screen.getAllByText("\u2014");
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });
});

describe("STSDashboard — tabs", () => {
  it("renders all three tabs", () => {
    render(<STSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("tab", { name: /caller identity/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /assume role/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /session token/i })).toBeTruthy();
  });
});

describe("STSDashboard — assume role tab", () => {
  it("shows initial empty state after clicking tab", async () => {
    const user = userEvent.setup();
    render(<STSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /assume role/i }));
    await waitFor(() => {
      expect(screen.getByText(/No role assumed yet/i)).toBeTruthy();
    });
  });

  it("opens modal, fills form, and calls assumeRole mutation", async () => {
    const user = userEvent.setup();
    render(<STSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /assume role/i }));
    await waitFor(() => expect(screen.getByText(/No role assumed yet/i)).toBeTruthy());

    const assumeRoleBtn = screen.getByRole("button", { name: /^Assume role$/i });
    await user.click(assumeRoleBtn);
    const roleArnInput = screen.getByPlaceholderText(/arn:aws:iam/);
    await user.type(roleArnInput, "arn:aws:iam::123456789012:role/my-role");
    const sessionInput = screen.getByPlaceholderText("dashboard-session");
    await user.type(sessionInput, "my-session");

    const assumeBtns = screen.getAllByRole("button", { name: /^Assume$/i });
    await user.click(assumeBtns[assumeBtns.length - 1]);

    await waitFor(() => {
      expect(mockAssumeRole).toHaveBeenCalledWith(
        expect.objectContaining({
          roleArn: "arn:aws:iam::123456789012:role/my-role",
          sessionName: "my-session",
        }),
        expect.any(Object),
      );
    });
  });

  it("shows assume role credentials after successful mutation", async () => {
    const user = userEvent.setup();
    render(<STSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /assume role/i }));
    await waitFor(() => expect(screen.getByText(/No role assumed yet/i)).toBeTruthy());

    // Open and submit the assumption form
    await clickButton(user, /^Assume role$/i);
    const roleArnInput = screen.getByPlaceholderText(/arn:aws:iam/);
    await user.type(roleArnInput, "arn:aws:iam::123456789012:role/my-role");
    const assumeBtns = screen.getAllByRole("button", { name: /^Assume$/i });
    await user.click(assumeBtns[assumeBtns.length - 1]);

    // After successful mutation, credentials should be displayed
    await waitFor(() => {
      expect(screen.getByText("ASIA123456")).toBeTruthy();
    });
    expect(screen.getByText("secretKey")).toBeTruthy();
    expect(screen.getByText("token123")).toBeTruthy();
    // Assumed role user info should also be visible
    expect(screen.getByText("AROA123456:session")).toBeTruthy();
    expect(screen.getByText("arn:aws:iam::123456789012:role/my-role")).toBeTruthy();
  });

  it("shows assumeRole loading state on Assume button", async () => {
    assumeRoleState.isPending = true;
    const user = userEvent.setup();
    render(<STSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /assume role/i }));
    await waitFor(() => expect(screen.getByText(/No role assumed yet/i)).toBeTruthy());
  });

  it("shows assume role fallback dashes when result has null assumedRoleUser", async () => {
    mockAssumeRole.mockImplementationOnce((_params: any, options?: { onSuccess?: (data: any) => void }) => {
      options?.onSuccess?.({ credentials: { accessKeyId: "AKIA", secretAccessKey: "key", sessionToken: "tok", expiration: "2026-01-01T00:00:00Z" }, assumedRoleUser: null });
    });
    const user = userEvent.setup();
    render(<STSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /assume role/i }));
    await waitFor(() => expect(screen.getByText(/No role assumed yet/i)).toBeTruthy());
    await clickButton(user, /^Assume role$/i);
    const roleArnInput = screen.getByPlaceholderText(/arn:aws:iam/);
    await user.type(roleArnInput, "arn:aws:iam::123456789012:role/my-role");
    const assumeBtns = screen.getAllByRole("button", { name: /^Assume$/i });
    await user.click(assumeBtns[assumeBtns.length - 1]);
    await waitFor(() => {
      expect(screen.getByText("AKIA")).toBeTruthy();
    });
    // assumedRoleUser is null, so the ARN section should not appear
    expect(screen.queryByText(/Assumed Role ARN/)).toBeNull();
  });

  it("renders dash fallbacks for sparse assume role result fields", async () => {
    mockAssumeRole.mockImplementationOnce((_params: any, options?: { onSuccess?: (data: any) => void }) => {
      options?.onSuccess?.({ credentials: {}, assumedRoleUser: {} });
    });
    const user = userEvent.setup();
    render(<STSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /assume role/i }));
    await waitFor(() => expect(screen.getByText(/No role assumed yet/i)).toBeTruthy());
    await clickButton(user, /^Assume role$/i);
    const roleArnInput = screen.getByPlaceholderText(/arn:aws:iam/);
    await user.type(roleArnInput, "arn:aws:iam::123456789012:role/my-role");
    const assumeBtns = screen.getAllByRole("button", { name: /^Assume$/i });
    await user.click(assumeBtns[assumeBtns.length - 1]);
    await waitFor(() => {
      expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(6);
    });
    expect(screen.getByText(/Assumed Role ARN/)).toBeTruthy();
  });
});

describe("STSDashboard — session token tab", () => {
  it("shows initial empty state after clicking tab", async () => {
    const user = userEvent.setup();
    render(<STSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /session token/i }));
    await waitFor(() => {
      expect(screen.getByText(/No session token requested/i)).toBeTruthy();
    });
  });

  it("opens modal, fills duration, and calls getSessionToken mutation", async () => {
    const user = userEvent.setup();
    render(<STSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /session token/i }));
    await waitFor(() => expect(screen.getByText(/No session token requested/i)).toBeTruthy());

    const getTokenBtn = screen.getByRole("button", { name: /Get session token/i });
    await user.click(getTokenBtn);
    const durationInput = screen.getByPlaceholderText("3600");
    await user.type(durationInput, "7200");
    const getTokenBtns = screen.getAllByRole("button", { name: /Get token$/i });
    await user.click(getTokenBtns[getTokenBtns.length - 1]);

    await waitFor(() => {
      expect(mockGetSessionToken).toHaveBeenCalledWith(
        expect.objectContaining({ durationSeconds: 7200 }),
        expect.any(Object),
      );
    });
  });

  it("shows session token credentials after successful mutation", async () => {
    const user = userEvent.setup();
    render(<STSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /session token/i }));
    await waitFor(() => expect(screen.getByText(/No session token requested/i)).toBeTruthy());

    // Open and submit
    await clickButton(user, /Get session token/i);
    const getTokenBtns = screen.getAllByRole("button", { name: /Get token$/i });
    await user.click(getTokenBtns[getTokenBtns.length - 1]);

    // After successful mutation, credentials should be displayed
    await waitFor(() => {
      expect(screen.getByText("ASIA789012")).toBeTruthy();
    });
    expect(screen.getByText("secretKey2")).toBeTruthy();
    expect(screen.getByText("token456")).toBeTruthy();
  });

  it("shows getSessionToken loading state on Get token button", async () => {
    sessionTokenState.isPending = true;
    const user = userEvent.setup();
    render(<STSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /session token/i }));
    await waitFor(() => expect(screen.getByText(/No session token requested/i)).toBeTruthy());
  });

  it("shows only fallback dashes when session result has null credentials", async () => {
    // Override mockGetSessionToken to return null credentials
    mockGetSessionToken.mockImplementationOnce((_params: any, options?: { onSuccess?: (data: any) => void }) => {
      options?.onSuccess?.({ credentials: null });
    });

    const user = userEvent.setup();
    render(<STSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /session token/i }));
    await waitFor(() => expect(screen.getByText(/No session token requested/i)).toBeTruthy());

    await clickButton(user, /Get session token/i);
    const getTokenBtns = screen.getAllByRole("button", { name: /Get token$/i });
    await user.click(getTokenBtns[getTokenBtns.length - 1]);

    // After mutation with null credentials, fallback dashes should appear
    await waitFor(() => {
      const dashes = screen.getAllByText("\u2014");
      expect(dashes.length).toBeGreaterThanOrEqual(4);
    });
  });

  it("calls getSessionToken with no duration when field is empty", async () => {
    const user = userEvent.setup();
    render(<STSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /session token/i }));
    await waitFor(() => expect(screen.getByText(/No session token requested/i)).toBeTruthy());

    const getTokenBtn = screen.getByRole("button", { name: /Get session token/i });
    await user.click(getTokenBtn);
    const getTokenBtns = screen.getAllByRole("button", { name: /Get token$/i });
    await user.click(getTokenBtns[getTokenBtns.length - 1]);

    await waitFor(() => {
      expect(mockGetSessionToken).toHaveBeenCalledWith(
        expect.objectContaining({ durationSeconds: undefined }),
        expect.any(Object),
      );
    });
  });

  it("passes a custom duration to assumeRole", async () => {
    const user = userEvent.setup();
    render(<STSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /assume role/i }));
    await waitFor(() => expect(screen.getByText(/No role assumed yet/i)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Assume role$/i }));
    await user.type(screen.getByPlaceholderText(/arn:aws:iam/), "arn:aws:iam::123456789012:role/my-role");
    await user.type(screen.getByPlaceholderText("3600"), "7200");
    const assumeBtns = screen.getAllByRole("button", { name: /^Assume$/i });
    await user.click(assumeBtns[assumeBtns.length - 1]);
    await waitFor(() => {
      expect(mockAssumeRole).toHaveBeenCalledWith(
        expect.objectContaining({ roleArn: "arn:aws:iam::123456789012:role/my-role", durationSeconds: 7200 }),
        expect.any(Object),
      );
    });
  });

  it("cancels the assume role modal without calling the mutation", async () => {
    const user = userEvent.setup();
    render(<STSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /assume role/i }));
    await waitFor(() => expect(screen.getByText(/No role assumed yet/i)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Assume role$/i }));
    await user.click(within(dialogOf("Assume role")).getByRole("button", { name: /Cancel/i }));
    expect(mockAssumeRole).not.toHaveBeenCalled();
  });

  it("dismisses the assume role modal with Escape", async () => {
    const user = userEvent.setup();
    render(<STSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /assume role/i }));
    await waitFor(() => expect(screen.getByText(/No role assumed yet/i)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Assume role$/i }));
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Assume role"));
  });

  it("cancels the session token modal without calling the mutation", async () => {
    const user = userEvent.setup();
    render(<STSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /session token/i }));
    await waitFor(() => expect(screen.getByText(/No session token requested/i)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Get session token/i }));
    await user.click(within(dialogOf("Get session token")).getByRole("button", { name: /Cancel/i }));
    expect(mockGetSessionToken).not.toHaveBeenCalled();
  });

  it("dismisses the session token modal with Escape", async () => {
    const user = userEvent.setup();
    render(<STSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /session token/i }));
    await waitFor(() => expect(screen.getByText(/No session token requested/i)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Get session token/i }));
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Get session token"));
  });
});

describe("STSDashboard — federation tab", () => {
  function openTab() {
    return (async () => {
      const user = userEvent.setup();
      render(<STSDashboard />, { wrapper: createWrapper() });
      await user.click(screen.getByRole("tab", { name: /Federation/i }));
      return user;
    })();
  }

  it("assumes a role with SAML", async () => {
    mockSamlAssume.mockImplementation((_b: any, opts: any) =>
      opts?.onSuccess?.({ credentials: { accessKeyId: "AKIA-SAML" } })
    );
    const user = await openTab();
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "arn:role");
    await user.type(inputs[1], "arn:principal");
    const areas = screen.getAllByRole("textbox").filter((el) => el.tagName === "TEXTAREA");
    fireEvent.change(areas[0], { target: { value: "assertion" } });
    await user.click(screen.getByRole("button", { name: /Assume with SAML/i }));
    expect(await screen.findByText(/AKIA-SAML/)).toBeTruthy();
  });

  it("assumes a role with web identity", async () => {
    mockWebIdentityAssume.mockImplementation((_b: any, opts: any) =>
      opts?.onSuccess?.({ credentials: { accessKeyId: "AKIA-WEB" } })
    );
    const user = await openTab();
    await user.type(screen.getAllByPlaceholderText("arn:aws:iam::123:role/my-role")[1], "arn:role");
    const areas = screen.getAllByRole("textbox").filter((el) => el.tagName === "TEXTAREA");
    fireEvent.change(areas[1], { target: { value: "token" } });
    await user.click(screen.getByRole("button", { name: /Assume with web identity/i }));
    expect(await screen.findByText(/AKIA-WEB/)).toBeTruthy();
  });

  it("gets a federation token", async () => {
    mockFederationToken.mockImplementation((_b: any, opts: any) =>
      opts?.onSuccess?.({
        credentials: { accessKeyId: "AKIA-FED" },
        federatedUser: { arn: "123:bob" },
      })
    );
    const user = await openTab();
    await user.type(screen.getByPlaceholderText("bob"), "bob");
    await user.click(screen.getByRole("button", { name: /Get federation token/i }));
    expect(await screen.findByText(/123:bob/)).toBeTruthy();
    expect(screen.getByText(/AKIA-FED/)).toBeTruthy();
  });

  it("decodes an authorization message", async () => {
    mockDecode.mockImplementation((_b: any, opts: any) =>
      opts?.onSuccess?.({ decodedMessage: "was denied" })
    );
    const user = await openTab();
    const areas = screen.getAllByRole("textbox").filter((el) => el.tagName === "TEXTAREA");
    fireEvent.change(areas[2], { target: { value: "enc-msg" } });
    await user.click(screen.getByRole("button", { name: "Decode" }));
    expect(await screen.findByText("was denied")).toBeTruthy();
  });
});

describe("STSDashboard — federation error arms", () => {
  function openTab() {
    return (async () => {
      const user = userEvent.setup();
      render(<STSDashboard />, { wrapper: createWrapper() });
      await user.click(screen.getByRole("tab", { name: /Federation/i }));
      return user;
    })();
  }

  it("shows error alerts with messages and fallbacks", async () => {
    samlState.isError = true;
    samlState.error = new Error("saml fail");
    webState.isError = true;
    webState.error = null;
    fedState.isError = true;
    fedState.error = new Error("fed fail");
    const user = await openTab();
    expect(await screen.findByText("saml fail")).toBeTruthy();
    expect(screen.getByText("Web identity assume failed")).toBeTruthy();
    expect(screen.getByText("fed fail")).toBeTruthy();
  });

  it("covers decode error path", async () => {
    mockDecode.mockImplementation((_b: any, opts: any) => opts?.onError?.());
    const user = await openTab();
    const areas = screen.getAllByRole("textbox").filter((el) => el.tagName === "TEXTAREA");
    fireEvent.change(areas[2], { target: { value: "enc" } });
    await user.click(screen.getByRole("button", { name: "Decode" }));
    await waitFor(() => expect(mockDecode).toHaveBeenCalled());
  });

  it("shows fallback errors for SAML and federation", async () => {
    samlState.isError = true;
    samlState.error = null;
    fedState.isError = true;
    fedState.error = null;
    const user = await openTab();
    expect(await screen.findByText("SAML assume failed")).toBeTruthy();
    expect(screen.getByText("Federation token failed")).toBeTruthy();
  });

  it("shows fed credentials without federated user and vice versa", async () => {
    mockFederationToken.mockImplementation((_b: any, opts: any) =>
      opts?.onSuccess?.({ credentials: { accessKeyId: "AKIA-ONLY" } })
    );
    const user = await openTab();
    await user.type(screen.getByPlaceholderText("bob"), "bob");
    await user.click(screen.getByRole("button", { name: /Get federation token/i }));
    expect(await screen.findByText(/AKIA-ONLY/)).toBeTruthy();
  });

  it("shows no SAML result before assuming", async () => {
    await openTab();
    expect(screen.queryByText(/Access key:/)).toBeNull();
  });
});
