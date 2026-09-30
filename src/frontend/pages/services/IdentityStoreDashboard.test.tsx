// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockApi = vi.hoisted(() => vi.fn());
vi.mock("../../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

const mockHooks = vi.hoisted(() => ({
  useIdentityStoreUsers: vi.fn(),
  useCreateIdentityStoreUser: vi.fn(),
  useDeleteIdentityStoreUser: vi.fn(),
  useIdentityStoreGroups: vi.fn(),
  useCreateIdentityStoreGroup: vi.fn(),
  useDeleteIdentityStoreGroup: vi.fn(),
  useIdentityStoreMemberships: vi.fn(),
  useAddIdentityStoreMembership: vi.fn(),
  useRemoveIdentityStoreMembership: vi.fn(),
}));

vi.mock("../../hooks/useIdentityStore", () => mockHooks);

const mockCreateUser = vi.fn();
const mockDeleteUser = vi.fn();
const mockCreateGroup = vi.fn();
const mockDeleteGroup = vi.fn();
const mockAddMember = vi.fn();
const mockRemoveMember = vi.fn();

function okMutation(mock: ReturnType<typeof vi.fn>, isPending = false) {
  return { mutateAsync: mock, isPending };
}

function listQuery(itemsKey: string, items: unknown[], overrides: Record<string, unknown> = {}) {
  return {
    data: { [itemsKey]: items, total: items.length },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

const USER = { UserId: "u1", UserName: "jane", DisplayName: "Jane" };
const GROUP = { GroupId: "g1", DisplayName: "admins", Description: "d" };

import IdentityStoreDashboard from "./IdentityStoreDashboard";

function setupConnected(overrides: Record<string, Record<string, unknown>> = {}) {
  const users = overrides.users ?? listQuery("users", [USER]);
  const groups = overrides.groups ?? listQuery("groups", [GROUP]);
  const memberships = overrides.memberships ?? {
    data: { memberships: [{ MembershipId: "m1", MemberId: { UserId: "u1" } }], total: 1 },
    isLoading: false,
  };
  mockHooks.useIdentityStoreUsers.mockReturnValue(users);
  mockHooks.useIdentityStoreGroups.mockReturnValue(groups);
  mockHooks.useIdentityStoreMemberships.mockReturnValue(memberships);
  render(<IdentityStoreDashboard />, { wrapper: createWrapper() });
}

beforeEach(() => {
  mockApi.mockReset();
  mockApi.mockResolvedValue({
    instances: [{ IdentityStoreId: "d-9067f2a3c1" }],
    total: 1,
  });
  mockHooks.useCreateIdentityStoreUser.mockReturnValue(okMutation(mockCreateUser));
  mockHooks.useDeleteIdentityStoreUser.mockReturnValue(okMutation(mockDeleteUser));
  mockHooks.useCreateIdentityStoreGroup.mockReturnValue(okMutation(mockCreateGroup));
  mockHooks.useDeleteIdentityStoreGroup.mockReturnValue(okMutation(mockDeleteGroup));
  mockHooks.useAddIdentityStoreMembership.mockReturnValue(okMutation(mockAddMember));
  mockHooks.useRemoveIdentityStoreMembership.mockReturnValue(okMutation(mockRemoveMember));
});

describe("IdentityStoreDashboard — connect", () => {
  it("resolves the store id from SSO Admin instances and connects", async () => {
    const user = userEvent.setup();
    setupConnected();
    await user.click(screen.getByRole("button", { name: /^Connect$/i }));
    await waitFor(() => expect(screen.getByRole("tab", { name: /^Users/ })).toBeTruthy());
  });

  it("accepts a manually typed store id", async () => {
    mockApi.mockResolvedValueOnce({ instances: [], total: 0 });
    render(<IdentityStoreDashboard />, { wrapper: createWrapper() });
    const input = screen.getByPlaceholderText("d-xxxxxxxxxx");
    await userEvent.setup().type(input, "d-abc");
    expect((input as HTMLInputElement).value).toBe("d-abc");
  });

  it("shows an error when no instance exists", async () => {
    const user = userEvent.setup();
    mockApi.mockResolvedValueOnce({ instances: [], total: 0 });
    mockHooks.useIdentityStoreUsers.mockReturnValue(listQuery("users", []));
    mockHooks.useIdentityStoreGroups.mockReturnValue(listQuery("groups", []));
    mockHooks.useIdentityStoreMemberships.mockReturnValue({
      data: { memberships: [], total: 0 },
      isLoading: false,
    });
    render(<IdentityStoreDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^Connect$/i }));
    await waitFor(() =>
      expect(screen.getByText("No Identity Center instance found in Floci.")).toBeTruthy()
    );
  });

  it("shows a fallback resolve error when the failure has no message", async () => {
    const user = userEvent.setup();
    mockApi.mockRejectedValueOnce({});
    render(<IdentityStoreDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^Connect$/i }));
    await waitFor(() =>
      expect(screen.getByText("Failed to resolve store id")).toBeTruthy()
    );
  });

  it("shows a fallback error when resolving fails", async () => {
    const user = userEvent.setup();
    mockApi.mockRejectedValueOnce(new Error("down"));
    render(<IdentityStoreDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^Connect$/i }));
    await waitFor(() => expect(screen.getByText("down")).toBeTruthy());
  });
});

describe("IdentityStoreDashboard — connected views", () => {
  it("renders users and groups after connecting", async () => {
    const user = userEvent.setup();
    setupConnected();
    await user.click(screen.getByRole("button", { name: /^Connect$/i }));
    await waitFor(() => expect(screen.getByText("jane")).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /^Groups/ }));
    await waitFor(() => expect(screen.getByText("admins")).toBeTruthy());
  });

  it("creates a user", async () => {
    const user = userEvent.setup();
    mockCreateUser.mockResolvedValueOnce({ userId: "u2" });
    setupConnected();
    await user.click(screen.getByRole("button", { name: /^Connect$/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Create user/i })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Create user/i }));
    const dlg = screen
      .getAllByText("Username")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    await user.type(dlg.querySelector('input[placeholder="jane"]') as HTMLElement, "bob");
    await user.type(
      dlg.querySelector('input[placeholder="Jane Doe"]') as HTMLElement,
      "Bob"
    );
    await user.click(
      Array.from(dlg.querySelectorAll("button")).find((b) => b.textContent === "Create") as HTMLElement
    );
    await waitFor(() =>
      expect(mockCreateUser).toHaveBeenCalledWith({
        identityStoreId: "d-9067f2a3c1",
        userName: "bob",
        displayName: "Bob",
      })
    );
    await waitFor(() => expect(screen.getByText("User bob created.")).toBeTruthy());
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() => expect(screen.queryByText("User bob created.")).toBeNull());
  });

  it("closes the create-group modal with Cancel", async () => {
    const user = userEvent.setup();
    setupConnected();
    await user.click(screen.getByRole("button", { name: /^Connect$/i }));
    await user.click(screen.getByRole("tab", { name: /^Groups/ }));
    await user.click(screen.getByRole("button", { name: /Create group/i }));
    const dlg = screen
      .getAllByText("Group name")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("shows a fallback error when group creation fails", async () => {
    const user = userEvent.setup();
    mockCreateGroup.mockRejectedValueOnce({});
    setupConnected();
    await user.click(screen.getByRole("button", { name: /^Connect$/i }));
    await user.click(screen.getByRole("tab", { name: /^Groups/ }));
    await user.click(screen.getByRole("button", { name: /Create group/i }));
    const dlg = screen
      .getAllByText("Group name")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    await user.type(dlg.querySelector('input[placeholder="admins"]') as HTMLElement, "ops");
    await user.click(
      Array.from(dlg.querySelectorAll("button")).find((b) => b.textContent === "Create") as HTMLElement
    );
    await waitFor(() => expect(screen.getByText("Failed to create group")).toBeTruthy());
  });

  it("renders undefined users/groups data and sparse rows", async () => {
    setupConnected({
      users: { data: { users: [{ UserId: "u2", UserName: "sparse" }], total: 1 }, isLoading: false },
      groups: { data: { groups: [{ GroupId: "g2", DisplayName: "sparse" }], total: 1 }, isLoading: false },
      memberships: {
        data: { memberships: [{ MembershipId: "m2" }], total: 1 },
        isLoading: false,
      },
    });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^Connect$/i }));
    await waitFor(() => expect(screen.getByText("sparse")).toBeTruthy());
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
    await user.click(screen.getByRole("tab", { name: /^Groups \(1\)/ }));
    await waitFor(() => expect(screen.getByText("sparse")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Members$/i }));
    await waitFor(() => expect(screen.getByText("m2")).toBeTruthy());
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("renders empty users when query data is undefined", async () => {
    setupConnected({
      users: { data: undefined, isLoading: false },
      groups: { data: undefined, isLoading: false },
      memberships: { data: undefined, isLoading: false },
    });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^Connect$/i }));
    await waitFor(() => expect(screen.getByText("No users found")).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /^Groups \(0\)/ }));
    await waitFor(() => expect(screen.getByText("No groups found")).toBeTruthy());
  });

  it("shows the users error alert when the users query fails", async () => {
    setupConnected({
      users: listQuery("users", [], { isError: true, error: new Error("store down") }),
    });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^Connect$/i }));
    await waitFor(() => expect(screen.getByText("store down")).toBeTruthy());
  });

  it("shows the fallback users error when the error has no message", async () => {
    setupConnected({
      users: listQuery("users", [], { isError: true, error: null }),
    });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^Connect$/i }));
    await waitFor(() => expect(screen.getByText("Failed to load users")).toBeTruthy());
  });

  it("closes the create-user modal with Cancel", async () => {
    const user = userEvent.setup();
    setupConnected();
    await user.click(screen.getByRole("button", { name: /^Connect$/i }));
    await user.click(screen.getByRole("button", { name: /Create user/i }));
    const dlg = screen
      .getAllByText("Username")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("shows a fallback error when user creation fails", async () => {
    const user = userEvent.setup();
    mockCreateUser.mockRejectedValueOnce({});
    setupConnected();
    await user.click(screen.getByRole("button", { name: /^Connect$/i }));
    await user.click(screen.getByRole("button", { name: /Create user/i }));
    const dlg = screen
      .getAllByText("Username")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    await user.type(dlg.querySelector('input[placeholder="jane"]') as HTMLElement, "bob");
    await user.click(
      Array.from(dlg.querySelectorAll("button")).find((b) => b.textContent === "Create") as HTMLElement
    );
    await waitFor(() => expect(screen.getByText("Failed to create user")).toBeTruthy());
  });

  it("deletes a user after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteUser.mockResolvedValueOnce({ ok: true });
    setupConnected();
    await user.click(screen.getByRole("button", { name: /^Connect$/i }));
    await waitFor(() => expect(screen.getByText("jane")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete jane/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() =>
      expect(mockDeleteUser).toHaveBeenCalledWith({ identityStoreId: "d-9067f2a3c1", userId: "u1" })
    );
  });

  it("creates a group", async () => {
    const user = userEvent.setup();
    mockCreateGroup.mockResolvedValueOnce({ groupId: "g2" });
    setupConnected();
    await user.click(screen.getByRole("button", { name: /^Connect$/i }));
    await user.click(screen.getByRole("tab", { name: /^Groups/ }));
    await user.click(screen.getByRole("button", { name: /Create group/i }));
    const dlg = screen
      .getAllByText("Group name")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    await user.type(dlg.querySelector('input[placeholder="admins"]') as HTMLElement, "ops");
    await user.click(
      Array.from(dlg.querySelectorAll("button")).find((b) => b.textContent === "Create") as HTMLElement
    );
    await waitFor(() =>
      expect(mockCreateGroup).toHaveBeenCalledWith({
        identityStoreId: "d-9067f2a3c1",
        displayName: "ops",
      })
    );
    await waitFor(() => expect(screen.getByText("Group ops created.")).toBeTruthy());
  });

  it("deletes a group after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteGroup.mockResolvedValueOnce({ ok: true });
    setupConnected();
    await user.click(screen.getByRole("button", { name: /^Connect$/i }));
    await user.click(screen.getByRole("tab", { name: /^Groups/ }));
    await waitFor(() => expect(screen.getByText("admins")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete admins/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() =>
      expect(mockDeleteGroup).toHaveBeenCalledWith({
        identityStoreId: "d-9067f2a3c1",
        groupId: "g1",
      })
    );
  });

  it("adds and removes a group member", async () => {
    const user = userEvent.setup();
    mockAddMember.mockResolvedValueOnce({ membershipId: "m2" });
    mockRemoveMember.mockResolvedValueOnce({ ok: true });
    setupConnected();
    await user.click(screen.getByRole("button", { name: /^Connect$/i }));
    await user.click(screen.getByRole("tab", { name: /^Groups/ }));
    await waitFor(() => expect(screen.getByText("admins")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Members$/i }));
    await waitFor(() => expect(screen.getByText("Add member")).toBeTruthy());
    const addBtn = screen.getByRole("button", { name: /Add member/i }) as HTMLButtonElement;
    expect(addBtn.disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("user id"), "u9");
    expect(addBtn.disabled).toBe(false);
    await user.click(addBtn);
    await waitFor(() =>
      expect(mockAddMember).toHaveBeenCalledWith({
        identityStoreId: "d-9067f2a3c1",
        groupId: "g1",
        userId: "u9",
      })
    );
    await user.click(screen.getByRole("button", { name: /Delete u1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() =>
      expect(mockRemoveMember).toHaveBeenCalledWith({
        identityStoreId: "d-9067f2a3c1",
        membershipId: "m1",
      })
    );
  });

  it("renders empty members when memberships data is undefined", async () => {
    const user = userEvent.setup();
    setupConnected({
      memberships: { data: undefined, isLoading: false },
    });
    await user.click(screen.getByRole("button", { name: /^Connect$/i }));
    await user.click(screen.getByRole("tab", { name: /^Groups/ }));
    await user.click(screen.getByRole("button", { name: /^Members$/i }));
    await waitFor(() => expect(screen.getByText("No members found")).toBeTruthy());
  });

  it("closes the members panel", async () => {
    const user = userEvent.setup();
    setupConnected();
    await user.click(screen.getByRole("button", { name: /^Connect$/i }));
    await user.click(screen.getByRole("tab", { name: /^Groups/ }));
    await user.click(screen.getByRole("button", { name: /^Members$/i }));
    await waitFor(() => expect(screen.getByText("Add member")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Close$/i }));
    await waitFor(() => expect(screen.queryByText("Add member")).toBeNull());
  });
});
