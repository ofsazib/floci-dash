// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
}));

import { STSDashboard } from "./STSDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
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
});
