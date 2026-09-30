// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useIdentityPools: vi.fn(),
  useCreateIdentityPool: vi.fn(),
  useDeleteIdentityPool: vi.fn(),
  useIdentityPool: vi.fn(),
  useIdentityPoolRoles: vi.fn(),
  useSetIdentityPoolRoles: vi.fn(),
  useIdentityPoolTags: vi.fn(),
  useAddIdentityPoolTags: vi.fn(),
  useRemoveIdentityPoolTags: vi.fn(),
  usePrincipalTagAttributeMap: vi.fn(),
  useSetPrincipalTagAttributeMap: vi.fn(),
}));

vi.mock("../../hooks/useCognitoIdentity", () => mockHooks);

const mockCreatePool = vi.fn();
const mockDeletePool = vi.fn();
const mockSetRoles = vi.fn();
const mockAddTags = vi.fn();
const mockRemoveTags = vi.fn();
const mockSetProviderMap = vi.fn();

function okMutation(mock: ReturnType<typeof vi.fn>, isPending = false) {
  return { mutateAsync: mock, isPending };
}

function listQuery(overrides: Record<string, unknown> = {}) {
  return {
    data: { pools: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

const POOL = {
  IdentityPoolId: "us-east-1:abc",
  IdentityPoolName: "app",
  AllowUnauthenticatedIdentities: true,
  DeveloperProviderName: "myapp",
  SupportedLoginProviders: { "login.myapp": "client-1" },
};

function setupDetail(overrides: Record<string, Record<string, unknown>> = {}) {
  const pool = overrides.pool ?? { data: { pool: POOL }, isLoading: false };
  const roles = overrides.roles ?? {
    data: { roles: { authenticated: "arn:aws:iam::123456789012:role/auth" }, roleMappings: {} },
    isLoading: false,
  };
  const tags = overrides.tags ?? {
    data: { tags: { env: "dev" } },
    isLoading: false,
  };
  mockHooks.useIdentityPools.mockReturnValue(
    listQuery({ data: { pools: [POOL], total: 1 } })
  );
  mockHooks.useIdentityPool.mockReturnValue(pool);
  mockHooks.useIdentityPoolRoles.mockReturnValue(roles);
  mockHooks.useIdentityPoolTags.mockReturnValue(tags);
}

import CognitoIdentityDashboard from "./CognitoIdentityDashboard";

function modalDialog(header: string): HTMLElement {
  return screen
    .getAllByText(header)
    .map((t) => t.closest('[role="dialog"]'))
    .find((d) => d) as HTMLElement;
}

function withinDlg(dlg: HTMLElement) {
  // Local helper to avoid importing within in every test block.
  return {
    getByPlaceholderText: (text: string) => dlg.querySelector(`input[placeholder="${text}"]`) as HTMLElement,
    getByRole: (role: string, opts: { name?: RegExp }) =>
      Array.from(dlg.querySelectorAll("button")).find(
        (b) => opts.name && opts.name.test(b.textContent || "")
      ) as HTMLElement,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockHooks.useCreateIdentityPool.mockReturnValue(okMutation(mockCreatePool));
  mockHooks.useDeleteIdentityPool.mockReturnValue(okMutation(mockDeletePool));
  mockHooks.useSetIdentityPoolRoles.mockReturnValue(okMutation(mockSetRoles));
  mockHooks.useAddIdentityPoolTags.mockReturnValue(okMutation(mockAddTags));
  mockHooks.useRemoveIdentityPoolTags.mockReturnValue(okMutation(mockRemoveTags));
  mockHooks.useSetPrincipalTagAttributeMap.mockReturnValue(okMutation(mockSetProviderMap));
  mockHooks.usePrincipalTagAttributeMap.mockReturnValue({
    data: undefined,
    isLoading: false,
  });
});

describe("CognitoIdentityDashboard — list view", () => {
  it("renders identity pools", async () => {
    mockHooks.useIdentityPools.mockReturnValue(
      listQuery({ data: { pools: [POOL], total: 1 } })
    );
    render(<CognitoIdentityDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("app")).toBeTruthy());
    expect(screen.getByText("us-east-1:abc")).toBeTruthy();
  });

  it("renders with undefined list data (loading)", () => {
    mockHooks.useIdentityPools.mockReturnValue(
      listQuery({ data: undefined, isLoading: true })
    );
    render(<CognitoIdentityDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Identity Pools")).toBeTruthy();
  });

  it("shows the empty table message when no pools exist", () => {
    mockHooks.useIdentityPools.mockReturnValue(listQuery());
    render(<CognitoIdentityDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No identity pools found")).toBeTruthy();
  });

  it("shows the error alert with fallback message", () => {
    mockHooks.useIdentityPools.mockReturnValue(listQuery({ isError: true, error: null }));
    render(<CognitoIdentityDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load identity pools")).toBeTruthy();
  });

  it("creates a pool and shows the success alert", async () => {
    const user = userEvent.setup();
    mockCreatePool.mockResolvedValueOnce({ pool: {} });
    render(<CognitoIdentityDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create identity pool/i }));
    await user.type(screen.getByPlaceholderText("my-app-pool"), "app");
    await user.click(screen.getByRole("button", { name: /^Create$/i }));
    await waitFor(() =>
      expect(mockCreatePool).toHaveBeenCalledWith({ name: "app", allowUnauthenticated: false })
    );
    await waitFor(() =>
      expect(screen.getByText("Identity pool app created.")).toBeTruthy()
    );
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByText("Identity pool app created.")).toBeNull()
    );
  });

  it("toggles unauthenticated on before creating", async () => {
    const user = userEvent.setup();
    mockCreatePool.mockResolvedValueOnce({ pool: {} });
    render(<CognitoIdentityDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create identity pool/i }));
    await user.type(screen.getByPlaceholderText("my-app-pool"), "app");
    await user.click(screen.getByText("Allow unauthenticated identities"));
    await user.click(screen.getByRole("button", { name: /^Create$/i }));
    await waitFor(() =>
      expect(mockCreatePool).toHaveBeenCalledWith({ name: "app", allowUnauthenticated: true })
    );
  });

  it("shows a fallback error alert when create fails", async () => {
    const user = userEvent.setup();
    mockCreatePool.mockRejectedValueOnce({});
    render(<CognitoIdentityDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create identity pool/i }));
    await user.type(screen.getByPlaceholderText("my-app-pool"), "app");
    await user.click(screen.getByRole("button", { name: /^Create$/i }));
    await waitFor(() =>
      expect(screen.getByText("Failed to create identity pool")).toBeTruthy()
    );
  });

  it("keeps Create disabled until a name is typed and closes on Cancel", async () => {
    const user = userEvent.setup();
    render(<CognitoIdentityDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create identity pool/i }));
    const dlg = modalDialog("Create identity pool");
    const createBtn = Array.from(dlg.querySelectorAll("button")).find(
      (b) => b.textContent === "Create"
    ) as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
    await user.type(withinDlg(dlg).getByPlaceholderText("my-app-pool"), "x");
    expect(createBtn.disabled).toBe(false);
    await user.click(withinDlg(dlg).getByRole("button", { name: /^Cancel$/i }));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("deletes a pool after confirmation", async () => {
    const user = userEvent.setup();
    mockDeletePool.mockResolvedValueOnce({ ok: true });
    mockHooks.useIdentityPools.mockReturnValue(
      listQuery({ data: { pools: [POOL], total: 1 } })
    );
    render(<CognitoIdentityDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("app")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete us-east-1:abc/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeletePool).toHaveBeenCalledWith("us-east-1:abc"));
  });
});

describe("CognitoIdentityDashboard — detail view", () => {
  function setupForDetail(overrides: Record<string, Record<string, unknown>> = {}) {
    setupDetail(overrides);
    render(<CognitoIdentityDashboard />, { wrapper: createWrapper() });
  }

  it("shows overview values and navigates back", async () => {
    const user = userEvent.setup();
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await waitFor(() =>
      expect(screen.getByText("Back to identity pools")).toBeTruthy()
    );
    expect(screen.getByText("us-east-1:abc")).toBeTruthy();
    expect(screen.getByText("Yes")).toBeTruthy();
    expect(screen.getByText("myapp")).toBeTruthy();
    await user.click(screen.getByText("Back to identity pools"));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Create identity pool/i })).toBeTruthy()
    );
  });

  it("renders roles dash arm when roles query data is undefined", async () => {
    const user = userEvent.setup();
    setupForDetail({
      roles: { data: undefined, isLoading: true },
      tags: { data: undefined, isLoading: true },
    });
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /^Roles/ }));
    await waitFor(() =>
      expect(screen.getByText("No roles are set for this pool.")).toBeTruthy()
    );
  });

  it("renders dash fallbacks when pool is null", async () => {
    const user = userEvent.setup();
    setupForDetail({
      pool: { data: { pool: null }, isLoading: false },
    });
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await waitFor(() =>
      expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2)
    );
  });

  it("shows the roles table when roles are set", async () => {
    const user = userEvent.setup();
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /^Roles/ }));
    await waitFor(() => expect(screen.getByText("arn:aws:iam::123456789012:role/auth")).toBeTruthy());
  });

  it("shows the not-set message when roles are null and sets a role", async () => {
    const user = userEvent.setup();
    mockSetRoles.mockResolvedValueOnce({ ok: true });
    setupForDetail({
      roles: { data: { roles: null, roleMappings: null }, isLoading: false },
    });
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /^Roles/ }));
    await waitFor(() =>
      expect(screen.getByText("No roles are set for this pool.")).toBeTruthy()
    );
    const setBtn = screen.getByRole("button", { name: /Set role/i }) as HTMLButtonElement;
    expect(setBtn.disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("arn:aws:iam::123456789012:role/auth"), "r");
    expect(setBtn.disabled).toBe(false);
    await user.click(setBtn);
    await waitFor(() =>
      expect(mockSetRoles).toHaveBeenCalledWith({ poolId: "us-east-1:abc", roles: { authenticated: "r" } })
    );
    await waitFor(() => expect(screen.getByText("Roles set.")).toBeTruthy());
  });

  it("shows and dismisses a roles error alert with the server message", async () => {
    const user = userEvent.setup();
    mockSetRoles.mockRejectedValueOnce(new Error("roleArn invalid"));
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /^Roles/ }));
    await user.type(screen.getByPlaceholderText("arn:aws:iam::123456789012:role/auth"), "r");
    await user.click(screen.getByRole("button", { name: /Set role/i }));
    await waitFor(() => expect(screen.getByText("roleArn invalid")).toBeTruthy());
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() => expect(screen.queryByText("roleArn invalid")).toBeNull());
  });

  it("shows a fallback error alert when setting roles fails", async () => {
    const user = userEvent.setup();
    mockSetRoles.mockRejectedValueOnce({});
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /^Roles/ }));
    await user.type(screen.getByPlaceholderText("arn:aws:iam::123456789012:role/auth"), "r");
    await user.click(screen.getByRole("button", { name: /Set role/i }));
    await waitFor(() => expect(mockSetRoles).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText("Failed to set roles")).toBeTruthy(), { timeout: 3000 });
  });

  it("loads the principal tag attribute map and enables defaults", async () => {
    const user = userEvent.setup();
    mockSetProviderMap.mockResolvedValueOnce({ useDefaults: true, principalTags: {} });
    mockHooks.usePrincipalTagAttributeMap.mockReturnValue({
      data: { useDefaults: true, principalTags: { sub: "${sub}" } },
      isLoading: false,
    });
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /^Roles/ }));
    const loadBtn = screen.getByRole("button", { name: /Load map/i }) as HTMLButtonElement;
    expect(loadBtn.disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("login.myapp"), "login.myapp");
    expect(loadBtn.disabled).toBe(false);
    await user.click(loadBtn);
    await waitFor(() => expect(screen.getByText(/use defaults: Yes/)).toBeTruthy());
    expect(screen.getByText("${sub}")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Enable defaults/i }));
    await waitFor(() =>
      expect(mockSetProviderMap).toHaveBeenCalledWith({
        poolId: "us-east-1:abc",
        identityProviderName: "login.myapp",
        useDefaults: true,
        principalTags: { sub: "${sub}" },
      })
    );
  });

  it("shows use defaults No when the map reports defaults off", async () => {
    const user = userEvent.setup();
    mockHooks.usePrincipalTagAttributeMap.mockReturnValue({
      data: { useDefaults: false, principalTags: {} },
      isLoading: false,
    });
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /^Roles/ }));
    await user.type(screen.getByPlaceholderText("login.myapp"), "login.myapp");
    await user.click(screen.getByRole("button", { name: /Load map/i }));
    await waitFor(() => expect(screen.getByText(/use defaults: No/)).toBeTruthy());
  });

  it("shows a fallback add-tag error when the failure has no message", async () => {
    const user = userEvent.setup();
    mockAddTags.mockRejectedValueOnce({});
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /Tags/ }));
    await user.type(screen.getByPlaceholderText("env"), "team");
    await user.type(screen.getByPlaceholderText("dev"), "core");
    await user.click(screen.getByRole("button", { name: /Add tag/i }));
    await waitFor(() => expect(screen.getByText("Failed to add tag")).toBeTruthy());
  });

  it("shows an add-tag error with the server message", async () => {
    const user = userEvent.setup();
    mockAddTags.mockRejectedValueOnce(new Error("tag too long"));
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /Tags/ }));
    await user.type(screen.getByPlaceholderText("env"), "team");
    await user.type(screen.getByPlaceholderText("dev"), "core");
    await user.click(screen.getByRole("button", { name: /Add tag/i }));
    await waitFor(() => expect(screen.getByText("tag too long")).toBeTruthy());
  });

  it("adds and removes tags", async () => {
    const user = userEvent.setup();
    mockAddTags.mockResolvedValueOnce({ ok: true });
    mockRemoveTags.mockResolvedValueOnce({ ok: true });
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /Tags/ }));
    await waitFor(() => expect(screen.getByText("dev")).toBeTruthy());
    const addBtn = screen.getByRole("button", { name: /Add tag/i }) as HTMLButtonElement;
    expect(addBtn.disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("env"), "team");
    await user.type(screen.getByPlaceholderText("dev"), "core");
    expect(addBtn.disabled).toBe(false);
    await user.click(addBtn);
    await waitFor(() =>
      expect(mockAddTags).toHaveBeenCalledWith({ poolId: "us-east-1:abc", tags: { team: "core" } })
    );
    await waitFor(() => expect(screen.getByText("Tag added.")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete env/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() =>
      expect(mockRemoveTags).toHaveBeenCalledWith({ poolId: "us-east-1:abc", tagKeys: ["env"] })
    );
  });
});
