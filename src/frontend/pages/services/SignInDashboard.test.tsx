// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mockAuthorize = vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false }));
const mockConsent = vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false }));
const mockToken = vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false }));

vi.mock("../../hooks/useSignIn", () => ({
  useAuthorize: () => mockAuthorize(),
  useConsent: () => mockConsent(),
  useSignInToken: () => mockToken(),
}));

import SignInDashboard from "./SignInDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthorize.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  mockConsent.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  mockToken.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
});

describe("SignInDashboard", () => {
  it("renders the OAuth flow sections", () => {
    render(<SignInDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("AWS Sign-In (local OAuth)")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Begin authorization" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Approve" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Deny" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Exchange token" })).toBeTruthy();
  });

  it("starts authorization and extracts the request_id", async () => {
    const mutateAsync = vi.fn().mockResolvedValueOnce({
      location: "/_floci/signin/consent?request_id=abc-123",
    });
    mockAuthorize.mockReturnValue({ mutateAsync, isPending: false });
    const user = userEvent.setup();
    render(<SignInDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Begin authorization" }));
    await screen.findByText("Authorization started — request_id abc-123");
    expect((screen.getByLabelText("Request ID") as HTMLInputElement).value).toBe("abc-123");
    expect(mutateAsync).toHaveBeenCalled();
  });

  it("shows an error when no request_id is returned", async () => {
    mockAuthorize.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValueOnce({ location: "" }),
      isPending: false,
    });
    const user = userEvent.setup();
    render(<SignInDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Begin authorization" }));
    await screen.findByText("Floci did not return a request_id");
  });

  it("shows authorize failure message", async () => {
    mockAuthorize.mockReturnValue({
      mutateAsync: vi.fn().mockRejectedValueOnce(new Error("authorize failed")),
      isPending: false,
    });
    const user = userEvent.setup();
    render(<SignInDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Begin authorization" }));
    await screen.findByText("authorize failed");
  });

  it("shows fallback authorize failure for non-Error rejections", async () => {
    mockAuthorize.mockReturnValue({ mutateAsync: vi.fn().mockRejectedValueOnce("boom"), isPending: false });
    const user = userEvent.setup();
    render(<SignInDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Begin authorization" }));
    await screen.findByText("Authorize failed");
  });

  it("approves consent with the extracted request id", async () => {
    mockAuthorize.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValueOnce({ location: "/_floci/signin/consent?request_id=r-9" }),
      isPending: false,
    });
    const consentMutate = vi.fn().mockResolvedValueOnce({ location: "/v1/token?code=xyz" });
    mockConsent.mockReturnValue({ mutateAsync: consentMutate, isPending: false });
    const user = userEvent.setup();
    render(<SignInDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Begin authorization" }));
    await user.click(await screen.findByRole("button", { name: "Approve" }));
    await screen.findByText("Consent continue → /v1/token?code=xyz");
    expect(consentMutate).toHaveBeenCalledWith({ requestId: "r-9", action: "continue" });
  });

  it("denies consent", async () => {
    mockAuthorize.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValueOnce({ location: "/_floci/signin/consent?request_id=r-9" }),
      isPending: false,
    });
    const consentMutate = vi.fn().mockResolvedValueOnce({ location: "/v1/authorize?error=access_denied" });
    mockConsent.mockReturnValue({ mutateAsync: consentMutate, isPending: false });
    const user = userEvent.setup();
    render(<SignInDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Begin authorization" }));
    await user.click(await screen.findByRole("button", { name: "Deny" }));
    await screen.findByText("Consent cancel → /v1/authorize?error=access_denied");
    expect(consentMutate).toHaveBeenCalledWith({ requestId: "r-9", action: "cancel" });
  });

  it("shows the no-redirect fallback when consent returns no location", async () => {
    mockAuthorize.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValueOnce({ location: "/_floci/signin/consent?request_id=r-9" }),
      isPending: false,
    });
    mockConsent.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValueOnce({ location: "" }), isPending: false });
    const user = userEvent.setup();
    render(<SignInDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Begin authorization" }));
    await user.click(await screen.findByRole("button", { name: "Approve" }));
    await screen.findByText("Consent continue → (no redirect)");
  });

  it("shows consent failure message", async () => {
    mockAuthorize.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValueOnce({ location: "/_floci/signin/consent?request_id=r-9" }),
      isPending: false,
    });
    mockConsent.mockReturnValue({ mutateAsync: vi.fn().mockRejectedValueOnce(new Error("denied")), isPending: false });
    const user = userEvent.setup();
    render(<SignInDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Begin authorization" }));
    await user.click(await screen.findByRole("button", { name: "Approve" }));
    await screen.findByText("denied");
  });

  it("shows fallback consent failure for non-Error rejections", async () => {
    mockAuthorize.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValueOnce({ location: "/_floci/signin/consent?request_id=r-9" }),
      isPending: false,
    });
    mockConsent.mockReturnValue({ mutateAsync: vi.fn().mockRejectedValueOnce("boom"), isPending: false });
    const user = userEvent.setup();
    render(<SignInDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Begin authorization" }));
    await user.click(await screen.findByRole("button", { name: "Deny" }));
    await screen.findByText("Consent cancel failed");
  });

  it("exchanges a token and shows the JSON result", async () => {
    const tokenMutate = vi.fn().mockResolvedValueOnce({ tokenType: "aws_sigv4", expiresIn: 3600 });
    mockToken.mockReturnValue({ mutateAsync: tokenMutate, isPending: false });
    const user = userEvent.setup();
    render(<SignInDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Exchange token" }));
    await screen.findByText(/aws_sigv4/);
    expect(tokenMutate).toHaveBeenCalledWith(expect.objectContaining({ grant_type: "authorization_code" }));
  });

  it("shows invalid JSON error for malformed token body", async () => {
    const user = userEvent.setup();
    render(<SignInDashboard />, { wrapper: createWrapper() });
    const textarea = screen.getByLabelText("Token exchange body (JSON)") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "{bad" } });
    await user.click(screen.getByRole("button", { name: "Exchange token" }));
    await screen.findByText("Token body is not valid JSON");
  });

  it("shows token exchange failure message", async () => {
    mockToken.mockReturnValue({ mutateAsync: vi.fn().mockRejectedValueOnce(new Error("bad grant")), isPending: false });
    const user = userEvent.setup();
    render(<SignInDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Exchange token" }));
    await screen.findByText("bad grant");
  });

  it("shows fallback token failure for non-Error rejections", async () => {
    mockToken.mockReturnValue({ mutateAsync: vi.fn().mockRejectedValueOnce("boom"), isPending: false });
    const user = userEvent.setup();
    render(<SignInDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Exchange token" }));
    await screen.findByText("Token exchange failed");
  });

  it("dismisses the message alert", async () => {
    mockAuthorize.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValueOnce({ location: "" }),
      isPending: false,
    });
    const user = userEvent.setup();
    render(<SignInDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Begin authorization" }));
    await screen.findByText("Floci did not return a request_id");
    await user.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() => {
      expect(screen.queryByText("Floci did not return a request_id")).toBeNull();
    });
  });

  it("updates authorize params input", async () => {
    const mutateAsync = vi.fn().mockResolvedValueOnce({ location: "/_floci/signin/consent?request_id=z" });
    mockAuthorize.mockReturnValue({ mutateAsync, isPending: false });
    const user = userEvent.setup();
    render(<SignInDashboard />, { wrapper: createWrapper() });
    const input = screen.getByLabelText("Authorize query params") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "x=1" } });
    await user.click(screen.getByRole("button", { name: "Begin authorization" }));
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ x: "1" }));
    });
  });

  it("allows editing the request id manually", async () => {
    const consentMutate = vi.fn().mockResolvedValueOnce({ location: "/v1/token" });
    mockConsent.mockReturnValue({ mutateAsync: consentMutate, isPending: false });
    const user = userEvent.setup();
    render(<SignInDashboard />, { wrapper: createWrapper() });
    const input = screen.getByLabelText("Request ID") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "manual-id" } });
    await user.click(screen.getByRole("button", { name: "Approve" }));
    expect(consentMutate).toHaveBeenCalledWith({ requestId: "manual-id", action: "continue" });
  });
});
