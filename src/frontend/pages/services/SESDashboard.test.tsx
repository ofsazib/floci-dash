// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock hooks ─────────────────────────────────────────

const mockIdentities = vi.fn();
const mockVerifiedEmails = vi.fn();
const mockVerifyEmail = vi.fn();
const mockVerifyDomain = vi.fn();
const mockDeleteIdentity = vi.fn();
const mockSendEmail = vi.fn();

vi.mock("../../hooks/useSES", () => ({
  useSESIdentities: (...args: any[]) => mockIdentities(...args),
  useSESVerifiedEmails: (...args: any[]) => mockVerifiedEmails(...args),
  useSESVerifyEmail: () => ({
    mutate: mockVerifyEmail,
    isPending: false,
  }),
  useSESVerifyDomain: () => ({
    mutate: mockVerifyDomain,
    isPending: false,
  }),
  useSESDeleteIdentity: () => ({
    mutateAsync: mockDeleteIdentity,
    isPending: false,
    variables: null,
  }),
  useSESSendEmail: () => ({
    mutate: mockSendEmail,
    isPending: false,
  }),
}));

import { SESDashboard } from "./SESDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
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
});

describe("SESDashboard — modals", () => {
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
