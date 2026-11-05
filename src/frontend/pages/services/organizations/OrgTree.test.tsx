// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const { mockOUs, mockAccounts } = vi.hoisted(() => ({ mockOUs: vi.fn(), mockAccounts: vi.fn() }));

vi.mock("../../../hooks/useOrganizations", () => ({
  useOrgOUs: (id: string) => mockOUs(id),
  useOrgAccounts: (id: string) => mockAccounts(id),
}));

import { AccountRow, ContainerNode, DestinationPicker } from "./OrgTree";

const mgmt = { Id: "000", Arn: "a", Name: "management", Email: "m@x.io", Status: "ACTIVE", JoinedMethod: "INVITED", JoinedTimestamp: new Date(2026, 9, 24).toISOString() };
const member = { Id: "222", Arn: "a", Name: "dev-acct", Email: "d@x.io", Status: "SUSPENDED", JoinedMethod: "CREATED" };

beforeEach(() => {
  vi.clearAllMocks();
  mockOUs.mockImplementation((id: string) =>
    id === "r-1" ? { data: { organizationalUnits: [{ Id: "ou-1", Name: "Dev" }] }, isLoading: false } : { data: { organizationalUnits: [] }, isLoading: false },
  );
  mockAccounts.mockImplementation((id: string) =>
    id === "r-1" ? { data: { accounts: [mgmt] }, isLoading: false } : { data: undefined, isLoading: false },
  );
});

describe("AccountRow", () => {
  it("shows id | email, the management badge, status and joined date, and toggles selection", () => {
    const onToggle = vi.fn();
    render(<AccountRow account={mgmt} depth={1} parentId="r-1" selected={{}} onToggle={onToggle} managementAccountId="000" />);
    expect(screen.getByText("000 | m@x.io")).toBeTruthy();
    expect(screen.getByText("management account")).toBeTruthy();
    expect(screen.getByText("Joined 2026/10/24")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "management" }));
    expect(onToggle).toHaveBeenCalledWith({ kind: "account", id: "000", name: "management", parentId: "r-1" });
  });

  it("marks non-active members and reflects checked state", () => {
    const onToggle = vi.fn();
    render(<AccountRow account={member} depth={0} selected={{ "222": { kind: "account", id: "222", name: "dev-acct" } }} onToggle={onToggle} managementAccountId="000" />);
    expect(screen.getByText("SUSPENDED")).toBeTruthy();
    expect(screen.queryByText("management account")).toBeNull();
    const box = screen.getByLabelText("Select dev-acct") as HTMLInputElement;
    expect(box.checked).toBe(true);
    fireEvent.click(box);
    expect(onToggle).toHaveBeenCalledWith({ kind: "account", id: "222", name: "dev-acct", parentId: undefined });
  });
});

describe("ContainerNode", () => {
  it("expands the root to its OUs and accounts, then collapses", () => {
    render(<ContainerNode kind="root" id="r-1" name="Root" depth={0} defaultExpanded selected={{}} onToggle={vi.fn()} />);
    expect(screen.getByText("Dev")).toBeTruthy();
    expect(screen.getByText("management")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Collapse Root" }));
    expect(screen.queryByText("Dev")).toBeNull();
  });

  it("lazily loads a collapsed OU and shows an empty row", () => {
    render(<ContainerNode kind="ou" id="ou-9" name="Empty" depth={1} parentId="r-1" selected={{}} onToggle={vi.fn()} />);
    expect(mockOUs).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Empty" }));
    expect(mockOUs).toHaveBeenCalledWith("ou-9");
    expect(screen.getByText("No accounts or OUs")).toBeTruthy();
  });

  it("shows a loading row while children load", () => {
    mockOUs.mockReturnValue({ data: undefined, isLoading: true });
    render(<ContainerNode kind="ou" id="ou-1" name="Dev" depth={0} defaultExpanded selected={{}} onToggle={vi.fn()} />);
    expect(screen.getByText("Loading…")).toBeTruthy();
  });

  it("also shows loading while only the accounts are pending", () => {
    mockAccounts.mockReturnValue({ data: undefined, isLoading: true });
    render(<ContainerNode kind="ou" id="ou-1" name="Dev" depth={0} defaultExpanded selected={{}} onToggle={vi.fn()} />);
    expect(screen.getByText("Loading…")).toBeTruthy();
  });

  it("selects the container from its checkbox", () => {
    const onToggle = vi.fn();
    render(<ContainerNode kind="ou" id="ou-1" name="Dev" depth={0} parentId="r-1" selected={{ "ou-1": { kind: "ou", id: "ou-1", name: "Dev" } }} onToggle={onToggle} />);
    const box = screen.getByLabelText("Select Dev") as HTMLInputElement;
    expect(box.checked).toBe(true);
    fireEvent.click(box);
    expect(onToggle).toHaveBeenCalledWith({ kind: "ou", id: "ou-1", name: "Dev", parentId: "r-1" });
  });
});

describe("DestinationPicker", () => {
  it("offers the root and OUs as radio choices", () => {
    const onChange = vi.fn();
    render(<DestinationPicker rootId="r-1" rootName="Root" value="r-1" onChange={onChange} />);
    expect((screen.getByLabelText("Root") as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByLabelText("Dev"));
    expect(onChange).toHaveBeenCalledWith("ou-1", "Dev");
    expect(mockAccounts).not.toHaveBeenCalled();
  });

  it("expands nested OUs and shows loading", () => {
    render(<DestinationPicker rootId="r-1" rootName="Root" value={null} onChange={vi.fn()} />);
    mockOUs.mockReturnValue({ data: undefined, isLoading: true });
    fireEvent.click(screen.getByRole("button", { name: "Expand Dev" }));
    expect(screen.getByText("Loading…")).toBeTruthy();
  });

  it("collapses and handles missing OU data", () => {
    mockOUs.mockReturnValue({ data: undefined, isLoading: false });
    render(<DestinationPicker rootId="r-1" rootName="Root" value={null} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Collapse Root" }));
    expect(screen.getByRole("button", { name: "Expand Root" })).toBeTruthy();
  });
});
