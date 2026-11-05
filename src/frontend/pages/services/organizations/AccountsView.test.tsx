// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";

const m = vi.hoisted(() => ({
  ous: vi.fn(),
  accounts: vi.fn(),
  ou: vi.fn(),
  createOU: vi.fn(),
  updateOU: vi.fn(),
  deleteOU: vi.fn(),
  move: vi.fn(),
  remove: vi.fn(),
  close: vi.fn(),
  api: vi.fn(),
  toast: vi.fn(),
  download: vi.fn(),
}));

vi.mock("../../../hooks/useOrganizations", () => ({
  useOrgOUs: (id: string) => m.ous(id),
  useOrgAccounts: (id: string | null) => m.accounts(id),
  useOrgOU: (id: string | null) => m.ou(id),
  useCreateOrgOU: () => ({ mutateAsync: m.createOU, isPending: false }),
  useUpdateOrgOU: () => ({ mutateAsync: m.updateOU, isPending: false }),
  useDeleteOrgOU: () => ({ mutateAsync: m.deleteOU, isPending: false }),
  useMoveOrgAccount: () => ({ mutateAsync: m.move, isPending: false }),
  useRemoveOrgAccount: () => ({ mutateAsync: m.remove, isPending: false }),
  useCloseOrgAccount: () => ({ mutateAsync: m.close, isPending: false }),
}));
vi.mock("../../../lib/client", () => ({ api: (...a: unknown[]) => m.api(...a) }));
vi.mock("../../../components/Toast", () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock("./orgUtils", async (orig) => ({ ...(await orig<object>()), downloadText: (...a: unknown[]) => m.download(...a) }));
vi.mock("@cloudscape-design/components", async (orig) => ({
  ...(await orig<object>()),
  ...(await import("../../../../test/cloudscapeMocks")).cloudscapeMocks,
}));

import AccountsView from "./AccountsView";

const org = { Id: "o-1", Arn: "arn:org", MasterAccountId: "000" };
const root = { Id: "r-1", Arn: "arn:root", Name: "Root" };
const mgmt = { Id: "000", Arn: "a", Name: "management", Email: "m@x.io", Status: "ACTIVE" };
const member = { Id: "222", Arn: "a", Name: "dev-acct", Email: "d@x.io", Status: "ACTIVE" };

beforeEach(() => {
  vi.clearAllMocks();
  m.ous.mockImplementation((id: string) => ({
    data: { organizationalUnits: id === "r-1" ? [{ Id: "ou-1", Name: "Dev" }, { Id: "ou-2", Name: "Prod" }] : [] },
    isLoading: false,
  }));
  m.accounts.mockImplementation((id: string | null) => ({
    data: { accounts: id === "r-1" ? [mgmt, member] : id === null ? [mgmt, member] : [] },
    isLoading: false,
  }));
  m.ou.mockReturnValue({ data: undefined });
  for (const fn of [m.createOU, m.updateOU, m.deleteOU, m.move, m.remove, m.close]) fn.mockResolvedValue({});
});

const view = (onAddAccount = vi.fn()) => {
  render(<AccountsView org={org} root={root} onAddAccount={onAddAccount} />);
  return onAddAccount;
};
const action = (name: string) => screen.getByRole("button", { name }) as HTMLButtonElement;
const check = (name: string) => fireEvent.click(screen.getByLabelText(`Select ${name}`));
const dialog = () => screen.getByRole("dialog");

describe("AccountsView — layout", () => {
  it("shows the AWS accounts header, the root tree and opens Add an AWS account", () => {
    const onAdd = view();
    expect(screen.getByRole("heading", { name: "AWS accounts" })).toBeTruthy();
    expect(screen.getByText("Organizational structure")).toBeTruthy();
    expect(screen.getByText("Dev")).toBeTruthy();
    expect(screen.getByText("management account")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Add an AWS account" }));
    expect(onAdd).toHaveBeenCalled();
  });

  it("enables only Create new and Export without a selection", () => {
    view();
    expect(action("Create new").disabled).toBe(false);
    expect(action("Export account list").disabled).toBe(false);
    for (const n of ["Rename", "Delete", "Move", "Remove from organization", "Close account"]) expect(action(n).disabled).toBe(true);
  });

  it("switches to the flat List view of every account", () => {
    view();
    fireEvent.click(screen.getByText("List"));
    expect(screen.getByText("AWS account")).toBeTruthy();
    expect(screen.queryByText("Dev")).toBeNull();
    expect(m.accounts).toHaveBeenCalledWith(null);
  });

  it("filters accounts by search and reports no matches", () => {
    view();
    const input = screen.getByLabelText("Find AWS accounts");
    fireEvent.change(input, { target: { value: "D@X" } });
    expect(screen.getByText("dev-acct")).toBeTruthy();
    expect(screen.queryByText("management")).toBeNull();
    fireEvent.change(input, { target: { value: "zzz" } });
    expect(screen.getByText("No matching AWS accounts.")).toBeTruthy();
  });

  it("finds an OU by its exact id", () => {
    m.ou.mockImplementation((id: string | null) => ({ data: id === "ou-7" ? { Id: "ou-7", Name: "Found" } : undefined }));
    view();
    fireEvent.change(screen.getByLabelText("Find AWS accounts"), { target: { value: "ou-7" } });
    expect(screen.getByText("Found")).toBeTruthy();
  });

  it("says when the organization has no accounts", () => {
    m.accounts.mockReturnValue({ data: undefined, isLoading: false });
    view();
    fireEvent.click(screen.getByText("List"));
    expect(screen.getByText("No AWS accounts.")).toBeTruthy();
  });

  it("exports all accounts as CSV", () => {
    view();
    fireEvent.click(action("Export account list"));
    expect(m.download).toHaveBeenCalledWith("aws-accounts.csv", expect.stringContaining("dev-acct,222"));
  });

  it("exports an empty list when accounts are not loaded", () => {
    m.accounts.mockReturnValue({ data: undefined, isLoading: true });
    view();
    fireEvent.click(action("Export account list"));
    expect(m.download).toHaveBeenCalledWith("aws-accounts.csv", expect.not.stringContaining("dev-acct"));
  });

  it("disables OU and account actions for a mixed selection", () => {
    view();
    check("Dev");
    check("dev-acct");
    for (const n of ["Create new", "Rename", "Delete", "Move", "Remove from organization"]) expect(action(n).disabled).toBe(true);
  });

  it("unselects on a second click", () => {
    view();
    check("Dev");
    check("Dev");
    expect(action("Rename").disabled).toBe(true);
  });
});

describe("AccountsView — organizational units", () => {
  it("creates an OU in the root with tags", async () => {
    view();
    fireEvent.click(action("Create new"));
    expect(within(dialog()).getByText("Root")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Organizational unit name"), { target: { value: " Sandbox " } });
    fireEvent.click(screen.getByRole("button", { name: "Add tag" }));
    fireEvent.change(screen.getByLabelText("Tag key 1"), { target: { value: "env" } });
    fireEvent.click(screen.getByRole("button", { name: "Create organizational unit" }));
    await waitFor(() => expect(m.createOU).toHaveBeenCalledWith({ parentId: "r-1", name: "Sandbox", tags: { env: "" } }));
    expect(m.toast).toHaveBeenCalledWith("success", "Successfully created organizational unit 'Sandbox'.");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("creates a nested OU under the selected OU", async () => {
    view();
    check("Dev");
    fireEvent.click(action("Create new"));
    fireEvent.change(screen.getByLabelText("Organizational unit name"), { target: { value: "Team" } });
    fireEvent.click(screen.getByRole("button", { name: "Create organizational unit" }));
    await waitFor(() => expect(m.createOU).toHaveBeenCalledWith({ parentId: "ou-1", name: "Team", tags: undefined }));
  });

  it("reports a create failure, with a fallback message", async () => {
    m.createOU.mockRejectedValueOnce(new Error("Duplicate")).mockRejectedValueOnce({});
    view();
    fireEvent.click(action("Create new"));
    fireEvent.change(screen.getByLabelText("Organizational unit name"), { target: { value: "X" } });
    fireEvent.click(screen.getByRole("button", { name: "Create organizational unit" }));
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith("error", "Duplicate"));
    fireEvent.click(screen.getByRole("button", { name: "Create organizational unit" }));
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith("error", "Failed to create organizational unit"));
  });

  it("closes the OU dialog with Cancel or dismiss", () => {
    view();
    fireEvent.click(action("Create new"));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(action("Create new"));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss modal" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renames the selected OU", async () => {
    view();
    check("Dev");
    fireEvent.click(action("Rename"));
    const input = screen.getByLabelText("Organizational unit name") as HTMLInputElement;
    expect(input.value).toBe("Dev");
    fireEvent.change(input, { target: { value: "Development" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(m.updateOU).toHaveBeenCalledWith({ id: "ou-1", name: "Development" }));
    expect(m.toast).toHaveBeenCalledWith("success", "Successfully renamed organizational unit to 'Development'.");
  });

  it("reports a rename failure", async () => {
    m.updateOU.mockRejectedValueOnce({});
    view();
    check("Dev");
    fireEvent.click(action("Rename"));
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith("error", "Failed to rename organizational unit"));
  });

  it("deletes one OU after typing its name", async () => {
    view();
    check("Dev");
    fireEvent.click(action("Delete"));
    expect(screen.getByRole("heading", { name: "Delete organizational unit 'Dev'?" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Confirmation"), { target: { value: "Dev" } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(m.deleteOU).toHaveBeenCalledWith("ou-1"));
    expect(m.toast).toHaveBeenCalledWith("success", "Successfully deleted organizational unit 'Dev'.");
  });

  it("deletes several OUs after typing delete", async () => {
    view();
    check("Dev");
    check("Prod");
    fireEvent.click(action("Delete"));
    fireEvent.change(screen.getByLabelText("Confirmation"), { target: { value: "delete" } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(m.deleteOU).toHaveBeenCalledTimes(2));
    expect(m.toast).toHaveBeenCalledWith("success", "Successfully deleted 2 organizational units.");
  });

  it("reports a delete failure and can be dismissed", async () => {
    m.deleteOU.mockRejectedValueOnce(new Error("OU not empty"));
    view();
    check("Dev");
    fireEvent.click(action("Delete"));
    fireEvent.change(screen.getByLabelText("Confirmation"), { target: { value: "Dev" } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith("error", "OU not empty"));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("AccountsView — accounts", () => {
  it("does not allow removing or closing the management account", () => {
    view();
    check("management");
    expect(action("Remove from organization").disabled).toBe(true);
    expect(action("Close account").disabled).toBe(true);
    expect(action("Move").disabled).toBe(false);
  });

  it("moves an account from its known parent to a picked OU", async () => {
    view();
    check("dev-acct");
    fireEvent.click(action("Move"));
    const move = within(dialog()).getByRole("button", { name: "Move AWS account" }) as HTMLButtonElement;
    expect(move.disabled).toBe(true);
    fireEvent.click(within(dialog()).getByLabelText("Dev"));
    fireEvent.click(move);
    await waitFor(() => expect(m.move).toHaveBeenCalledWith({ accountId: "222", sourceParentId: "r-1", destinationParentId: "ou-1" }));
    expect(m.toast).toHaveBeenCalledWith("success", "Successfully moved the AWS account 'dev-acct' to 'Dev'.");
    expect(m.api).not.toHaveBeenCalled();
  });

  it("looks up the parent of accounts selected in the List view", async () => {
    m.api.mockResolvedValue({ parents: [{ Id: "ou-2" }] });
    view();
    fireEvent.click(screen.getByText("List"));
    check("dev-acct");
    check("management");
    fireEvent.click(action("Move"));
    fireEvent.click(within(dialog()).getByLabelText("Root"));
    fireEvent.click(within(dialog()).getByRole("button", { name: "Move AWS account" }));
    await waitFor(() => expect(m.move).toHaveBeenCalledTimes(2));
    expect(m.api).toHaveBeenCalledWith("/aws/organizations/parents?childId=222");
    expect(m.move).toHaveBeenCalledWith({ accountId: "222", sourceParentId: "ou-2", destinationParentId: "r-1" });
    expect(m.toast).toHaveBeenCalledWith("success", "Successfully moved 2 AWS accounts to 'Root'.");
  });

  it("reports a move failure and cancels", async () => {
    m.move.mockRejectedValueOnce({});
    view();
    check("dev-acct");
    fireEvent.click(action("Move"));
    fireEvent.click(within(dialog()).getByLabelText("Prod"));
    fireEvent.click(within(dialog()).getByRole("button", { name: "Move AWS account" }));
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith("error", "Failed to move account"));
    fireEvent.click(within(dialog()).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("removes a member account after confirming", async () => {
    view();
    check("dev-acct");
    fireEvent.click(action("Remove from organization"));
    expect(screen.getByRole("heading", { name: "Remove account 'dev-acct' (#222) from organization?" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove account" }));
    await waitFor(() => expect(m.remove).toHaveBeenCalledWith("222"));
    expect(m.toast).toHaveBeenCalledWith("success", "Successfully removed the AWS account 'dev-acct' from the organization.");
  });

  it("reports a remove failure and cancels", async () => {
    m.remove.mockRejectedValueOnce(new Error("Constraint"));
    view();
    check("dev-acct");
    fireEvent.click(action("Remove from organization"));
    fireEvent.click(screen.getByRole("button", { name: "Remove account" }));
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith("error", "Constraint"));
    fireEvent.click(within(dialog()).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes a member account after typing its id", async () => {
    view();
    check("dev-acct");
    fireEvent.click(action("Close account"));
    fireEvent.change(screen.getByLabelText("Confirmation"), { target: { value: "222" } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Close account" }));
    await waitFor(() => expect(m.close).toHaveBeenCalledWith("222"));
    expect(m.toast).toHaveBeenCalledWith("success", "Closing the AWS account 'dev-acct'.");
  });

  it("reports a close failure", async () => {
    m.close.mockRejectedValueOnce({});
    view();
    check("dev-acct");
    fireEvent.click(action("Close account"));
    fireEvent.change(screen.getByLabelText("Confirmation"), { target: { value: "222" } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Close account" }));
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith("error", "Failed to close account"));
  });
});
