// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useSoRegisterClient: vi.fn(),
  useSoStartDeviceAuthorization: vi.fn(),
  useSoCreateToken: vi.fn(),
}));

vi.mock("../../hooks/useSsoOidc", () => mockHooks);

const mockRegister = vi.fn();
const mockStart = vi.fn();
const mockToken = vi.fn();

function okMutation(mock: ReturnType<typeof vi.fn>, isPending = false) {
  return { mutateAsync: mock, isPending };
}

const CLIENT = {
  clientId: "cid-1",
  clientSecret: "sec-1",
  clientIdIssuedAt: 100,
  clientSecretExpiresAt: 200,
  tokenEndpoint: "http://token",
};
const DEVICE = {
  deviceCode: "dc-1",
  userCode: "ABCD-EFGH",
  verificationUri: "http://device",
  verificationUriComplete: "http://device?user_code=ABCD-EFGH",
  expiresIn: 600,
  interval: 5,
};
const TOKEN = {
  accessToken: "at-1",
  refreshToken: "rt-1",
  expiresIn: 28800,
  tokenType: "Bearer",
};

import SsoOidcDashboard from "./SsoOidcDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockHooks.useSoRegisterClient.mockReturnValue(okMutation(mockRegister));
  mockHooks.useSoStartDeviceAuthorization.mockReturnValue(okMutation(mockStart));
  mockHooks.useSoCreateToken.mockReturnValue(okMutation(mockToken));
});

describe("SsoOidcDashboard", () => {
  it("keeps Register disabled without a client name", () => {
    render(<SsoOidcDashboard />, { wrapper: createWrapper() });
    const registerBtn = screen.getByRole("button", { name: /^Register$/ }) as HTMLButtonElement;
    expect(registerBtn.disabled).toBe(true);
    expect(screen.getByRole("button", { name: /^Start$/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Check token/i })).toBeTruthy();
  });

  it("registers a client and shows the client id with a copyable secret", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce(CLIENT);
    render(<SsoOidcDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-cli"), "my-cli");
    await user.click(screen.getByRole("button", { name: /^Register$/ }));
    await waitFor(() => expect(mockRegister).toHaveBeenCalledWith({ clientName: "my-cli" }));
    await waitFor(() => expect(screen.getByText("Client ID: cid-1")).toBeTruthy());
    await waitFor(() => expect(screen.getByText("Client my-cli registered.")).toBeTruthy());
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByText("Client my-cli registered.")).toBeNull()
    );
  });

  it("shows a fallback error when registration fails", async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValueOnce({});
    render(<SsoOidcDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-cli"), "my-cli");
    await user.click(screen.getByRole("button", { name: /^Register$/ }));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });

  it("keeps Start disabled until a client is registered, then starts device auth", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce(CLIENT);
    mockStart.mockResolvedValueOnce(DEVICE);
    render(<SsoOidcDashboard />, { wrapper: createWrapper() });
    const startBtn = screen.getByRole("button", { name: /^Start$/ }) as HTMLButtonElement;
    expect(startBtn.disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("my-cli"), "my-cli");
    await user.click(screen.getByRole("button", { name: /^Register$/ }));
    await waitFor(() => expect(startBtn.disabled).toBe(false));
    await user.type(screen.getByPlaceholderText("https://view.awsapps.com/start"), "https://start");
    await user.click(startBtn);
    await waitFor(() =>
      expect(mockStart).toHaveBeenCalledWith({
        clientId: "cid-1",
        clientSecret: "sec-1",
        startUrl: "https://start",
      })
    );
    await waitFor(() =>
      expect(screen.getByText("User code: ABCD-EFGH")).toBeTruthy()
    );
    expect(screen.getByText(/Approve at:/)).toBeTruthy();
    expect(screen.getByText(/Expires in: 600s/)).toBeTruthy();
  });

  it("omits the startUrl when left empty", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce(CLIENT);
    mockStart.mockResolvedValueOnce(DEVICE);
    render(<SsoOidcDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-cli"), "my-cli");
    await user.click(screen.getByRole("button", { name: /^Register$/ }));
    await waitFor(() => expect(startDisabled()).toBe(false));
    await user.click(screen.getByRole("button", { name: /^Start$/ }));
    await waitFor(() =>
      expect(mockStart).toHaveBeenCalledWith({
        clientId: "cid-1",
        clientSecret: "sec-1",
        startUrl: undefined,
      })
    );
  });

  function startDisabled(): boolean {
    return (screen.getByRole("button", { name: /^Start$/ }) as HTMLButtonElement).disabled;
  }

  it("shows a fallback error when starting device auth fails", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce(CLIENT);
    mockStart.mockRejectedValueOnce({});
    render(<SsoOidcDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-cli"), "my-cli");
    await user.click(screen.getByRole("button", { name: /^Register$/ }));
    await waitFor(() => expect(startDisabled()).toBe(false));
    await user.click(screen.getByRole("button", { name: /^Start$/ }));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });

  it("shows the pending notice when the token poll returns authorization_pending", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce(CLIENT);
    mockStart.mockResolvedValueOnce(DEVICE);
    const pendingError = new Error("Device authorization is pending");
    pendingError.name = "authorization_pending";
    mockToken.mockRejectedValueOnce(pendingError);
    render(<SsoOidcDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-cli"), "my-cli");
    await user.click(screen.getByRole("button", { name: /^Register$/ }));
    await waitFor(() => expect(startDisabled()).toBe(false));
    await user.click(screen.getByRole("button", { name: /^Start$/ }));
    await waitFor(() => expect(screen.getByText("User code: ABCD-EFGH")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Check token/i }));
    await waitFor(() =>
      expect(mockToken).toHaveBeenCalledWith({
        clientId: "cid-1",
        clientSecret: "sec-1",
        deviceCode: "dc-1",
      })
    );
    await waitFor(() =>
      expect(screen.getByText(/Authorization pending/)).toBeTruthy()
    );
  });

  it("shows the token details after a successful poll", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce(CLIENT);
    mockStart.mockResolvedValueOnce(DEVICE);
    mockToken.mockResolvedValueOnce(TOKEN);
    render(<SsoOidcDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-cli"), "my-cli");
    await user.click(screen.getByRole("button", { name: /^Register$/ }));
    await waitFor(() => expect(startDisabled()).toBe(false));
    await user.click(screen.getByRole("button", { name: /^Start$/ }));
    await waitFor(() => expect(screen.getByText("User code: ABCD-EFGH")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Check token/i }));
    await waitFor(() =>
      expect(screen.getByText("Token type: Bearer")).toBeTruthy()
    );
    expect(screen.getByText("Expires in: 28800s")).toBeTruthy();
    await waitFor(() => expect(screen.getByText("Token received.")).toBeTruthy());
  });

  it("shows a fallback error when the token poll fails with another error", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce(CLIENT);
    mockStart.mockResolvedValueOnce(DEVICE);
    const expiredError = new Error("Device code has expired");
    expiredError.name = "expired_token";
    mockToken.mockRejectedValueOnce(expiredError);
    render(<SsoOidcDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-cli"), "my-cli");
    await user.click(screen.getByRole("button", { name: /^Register$/ }));
    await waitFor(() => expect(startDisabled()).toBe(false));
    await user.click(screen.getByRole("button", { name: /^Start$/ }));
    await waitFor(() => expect(screen.getByText("User code: ABCD-EFGH")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Check token/i }));
    await waitFor(() =>
      expect(screen.getByText("Device code has expired")).toBeTruthy()
    );
  });
});
