// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useDmsSubnetGroups: vi.fn(),
  useCreateDmsSubnetGroup: vi.fn(),
  useDeleteDmsSubnetGroup: vi.fn(),
  useDmsTags: vi.fn(),
  useAddDmsTags: vi.fn(),
  useRemoveDmsTags: vi.fn(),
}));

vi.mock("../../hooks/useDMS", () => mockHooks);

const mockApi = vi.hoisted(() => vi.fn());
vi.mock("../../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

const mockCreateGroup = vi.fn();
const mockDeleteGroup = vi.fn();
const mockAddTags = vi.fn();
const mockRemoveTags = vi.fn();

function okMutation(mock: ReturnType<typeof vi.fn>, isPending = false) {
  return { mutateAsync: mock, isPending };
}

function listQuery(key: string, items: unknown[], overrides: Record<string, unknown> = {}) {
  return {
    data: { [key]: items, total: items.length },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

const GROUP = {
  ReplicationSubnetGroupIdentifier: "dms-group-1",
  ReplicationSubnetGroupDescription: "test group",
  VpcId: "vpc-1",
  SubnetGroupStatus: "Complete",
};

import DmsDashboard from "./DmsDashboard";

function modalDlg(header: string): HTMLElement {
  return screen
    .getAllByText(header)
    .map((t) => t.closest('[role="dialog"]'))
    .find((d) => d) as HTMLElement;
}

function dialogButton(dlg: HTMLElement, text: string): HTMLElement {
  return Array.from(dlg.querySelectorAll("button")).find(
    (b) => b.textContent === text
  ) as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockResolvedValue({ tagList: [{ Key: "env", Value: "dev" }] });
  mockHooks.useCreateDmsSubnetGroup.mockReturnValue(okMutation(mockCreateGroup));
  mockHooks.useDeleteDmsSubnetGroup.mockReturnValue(okMutation(mockDeleteGroup));
  mockHooks.useAddDmsTags.mockReturnValue(okMutation(mockAddTags));
  mockHooks.useRemoveDmsTags.mockReturnValue(okMutation(mockRemoveTags));
  mockHooks.useDmsTags.mockReturnValue({
    data: { tagList: [{ Key: "env", Value: "dev" }] },
    isLoading: false,
  });
});

describe("DmsDashboard — subnet groups list", () => {
  it("renders subnet groups with fields", async () => {
    mockHooks.useDmsSubnetGroups.mockReturnValue(listQuery("subnetGroups", [GROUP]));
    render(<DmsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("dms-group-1")).toBeTruthy());
    expect(screen.getByText("vpc-1")).toBeTruthy();
    expect(screen.getByText("Complete")).toBeTruthy();
  });

  it("shows the empty table message", () => {
    mockHooks.useDmsSubnetGroups.mockReturnValue(listQuery("subnetGroups", []));
    render(<DmsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No subnet groups found")).toBeTruthy();
  });

  it("renders with undefined data (loading)", () => {
    mockHooks.useDmsSubnetGroups.mockReturnValue(
      listQuery("subnetGroups", [], { data: undefined, isLoading: true })
    );
    render(<DmsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Replication subnet groups")).toBeTruthy();
  });

  it("shows the error alert with fallback message", () => {
    mockHooks.useDmsSubnetGroups.mockReturnValue(
      listQuery("subnetGroups", [], { isError: true, error: null })
    );
    render(<DmsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load subnet groups")).toBeTruthy();
  });

  it("creates a subnet group and dismisses the success alert", async () => {
    const user = userEvent.setup();
    mockCreateGroup.mockResolvedValueOnce({ subnetGroup: {} });
    render(<DmsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create subnet group/i }));
    const dlg = modalDlg("Create replication subnet group");
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0] as HTMLElement, "g2");
    await user.type(inputs[1] as HTMLElement, "desc2");
    await user.type(dlg.querySelector("textarea") as HTMLElement, "subnet-9");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() =>
      expect(mockCreateGroup).toHaveBeenCalledWith({
        replicationSubnetGroupIdentifier: "g2",
        replicationSubnetGroupDescription: "desc2",
        subnetIds: ["subnet-9"],
      })
    );
    await waitFor(() =>
      expect(screen.getByText("Subnet group g2 created.")).toBeTruthy()
    );
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByText("Subnet group g2 created.")).toBeNull()
    );
  });

  it("closes the create modal via Cancel", async () => {
    const user = userEvent.setup();
    render(<DmsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create subnet group/i }));
    const dlg = modalDlg("Create replication subnet group");
    await user.click(dialogButton(dlg, "Cancel"));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("shows a fallback error when create fails", async () => {
    const user = userEvent.setup();
    mockCreateGroup.mockRejectedValueOnce({});
    render(<DmsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create subnet group/i }));
    const dlg = modalDlg("Create replication subnet group");
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0] as HTMLElement, "g2");
    await user.type(inputs[1] as HTMLElement, "desc2");
    await user.type(dlg.querySelector("textarea") as HTMLElement, "subnet-9");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() =>
      expect(screen.getByText("Failed to create subnet group")).toBeTruthy()
    );
  });

  it("keeps Create disabled until required fields are filled", async () => {
    const user = userEvent.setup();
    render(<DmsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create subnet group/i }));
    const dlg = modalDlg("Create replication subnet group");
    const createBtn = dialogButton(dlg, "Create") as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0] as HTMLElement, "g");
    await user.type(inputs[1] as HTMLElement, "d");
    await user.type(dlg.querySelector("textarea") as HTMLElement, "s");
    expect(createBtn.disabled).toBe(false);
  });

  it("deletes a subnet group after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteGroup.mockResolvedValueOnce({ ok: true });
    mockHooks.useDmsSubnetGroups.mockReturnValue(
      listQuery("subnetGroups", [GROUP])
    );
    render(<DmsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("dms-group-1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete dms-group-1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() =>
      expect(mockDeleteGroup).toHaveBeenCalledWith("dms-group-1")
    );
  });

  it("shows a delete success alert and dismisses it", async () => {
    const user = userEvent.setup();
    mockDeleteGroup.mockResolvedValueOnce({ ok: true });
    mockHooks.useDmsSubnetGroups.mockReturnValue(
      listQuery("subnetGroups", [GROUP])
    );
    render(<DmsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("dms-group-1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete dms-group-1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() =>
      expect(screen.getByText("Subnet group dms-group-1 deleted.")).toBeTruthy()
    );
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByText("Subnet group dms-group-1 deleted.")).toBeNull()
    );
  });
});

describe("DmsDashboard — tags modal", () => {
  it("opens tags modal, adds and removes a tag", async () => {
    const user = userEvent.setup();
    mockAddTags.mockResolvedValueOnce({ ok: true });
    mockRemoveTags.mockResolvedValueOnce({ ok: true });
    mockHooks.useDmsSubnetGroups.mockReturnValue(
      listQuery("subnetGroups", [GROUP])
    );
    render(<DmsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("dms-group-1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Tags$/i }));
    await waitFor(() => expect(screen.getByText("Tags — dms-group-1")).toBeTruthy());
    await waitFor(() => expect(screen.getByText("dev")).toBeTruthy());
    const addBtn = screen.getByRole("button", { name: /Add tag/i }) as HTMLButtonElement;
    expect(addBtn.disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("env"), "team");
    await user.type(screen.getByPlaceholderText("dev"), "core");
    expect(addBtn.disabled).toBe(false);
    await user.click(addBtn);
    await waitFor(() =>
      expect(mockAddTags).toHaveBeenCalledWith({
        arn: "arn:aws:dms:us-east-1:000000000000:rep-subnet-group/dms-group-1",
        tags: [{ Key: "team", Value: "core" }],
      })
    );
    await waitFor(() => expect(screen.getByText("Tag added.")).toBeTruthy());
    fireEvent.click(
      (screen.getByText(/Tags — dms-group-1/).closest('[role="dialog"]') as HTMLElement).querySelector('[class*="awsui_dismiss-button"]') as HTMLElement
    );
    await waitFor(() => expect(screen.queryByText("Tag added.")).toBeNull());
    await user.click(screen.getByRole("button", { name: /Delete env/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() =>
      expect(mockRemoveTags).toHaveBeenCalledWith({
        arn: "arn:aws:dms:us-east-1:000000000000:rep-subnet-group/dms-group-1",
        tagKeys: ["env"],
      })
    );
  });

  it("shows a fallback add-tag error and undefined tags data", async () => {
    const user = userEvent.setup();
    mockAddTags.mockRejectedValueOnce({});
    mockHooks.useDmsTags.mockReturnValue({ data: undefined, isLoading: false });
    mockHooks.useDmsSubnetGroups.mockReturnValue(
      listQuery("subnetGroups", [GROUP])
    );
    render(<DmsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("dms-group-1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Tags$/i }));
    await waitFor(() => expect(screen.getByText("No tags found")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("env"), "team");
    await user.type(screen.getByPlaceholderText("dev"), "core");
    await user.click(screen.getByRole("button", { name: /Add tag/i }));
    await waitFor(() => expect(screen.getByText("Failed to add tag")).toBeTruthy());
  });

  it("closes the tags modal", async () => {
    const user = userEvent.setup();
    mockHooks.useDmsSubnetGroups.mockReturnValue(
      listQuery("subnetGroups", [GROUP])
    );
    render(<DmsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("dms-group-1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Tags$/i }));
    await waitFor(() => expect(screen.getByText("Tags — dms-group-1")).toBeTruthy());
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() =>
      expect(screen.queryByText("Tags — dms-group-1")).toBeNull()
    );
  });
});
