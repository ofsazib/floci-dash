// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const m = vi.hoisted(() => ({
  org: vi.fn(),
  roots: vi.fn(),
  createOrg: vi.fn(),
  toast: vi.fn(),
  nav: { current: null as any },
  crumbs: { current: null as any },
}));

vi.mock("../../hooks/useOrganizations", () => ({
  useOrg: () => m.org(),
  useOrgRoots: () => m.roots(),
  useCreateOrg: () => ({ mutateAsync: m.createOrg, isPending: false }),
}));
vi.mock("../../components/Toast", () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock("../../components/ServiceNavigationContext", () => ({
  useServiceNavigation: (nav: unknown) => {
    m.nav.current = nav;
  },
  useBreadcrumbs: (items: unknown) => {
    m.crumbs.current = items;
  },
}));
// Sub-pages have their own tests; stub them to expose their callbacks.
vi.mock("./organizations/GetStarted", () => ({
  default: ({ onCreate }: any) => <button onClick={onCreate}>get-started</button>,
}));
vi.mock("./organizations/AccountsView", () => ({
  default: ({ onAddAccount }: any) => <button onClick={onAddAccount}>accounts-view</button>,
}));
vi.mock("./organizations/AddAccountView", () => ({
  default: ({ onDone }: any) => <button onClick={onDone}>add-account-view</button>,
}));
vi.mock("./organizations/PoliciesView", () => ({
  PoliciesView: ({ onOpen }: any) => <button onClick={() => onOpen("TAG_POLICY")}>policies-view</button>,
  PolicyTypeView: ({ type }: any) => <div>policy-type-view {type}</div>,
}));
vi.mock("./organizations/SettingsView", () => ({ default: () => <div>settings-view</div> }));

import { OrganizationsDashboard } from "./OrganizationsDashboard";

const org = { Id: "o-1", Arn: "arn" };
const root = { Id: "r-1", Arn: "a", Name: "Root" };

beforeEach(() => {
  vi.clearAllMocks();
  m.org.mockReturnValue({ data: { organization: org }, isLoading: false });
  m.roots.mockReturnValue({ data: { roots: [root] }, isLoading: false });
  m.createOrg.mockResolvedValue({});
});

const crumbTexts = () => m.crumbs.current.map((c: any) => c.text);

describe("OrganizationsDashboard", () => {
  it("shows a spinner while the organization loads", () => {
    m.org.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<OrganizationsDashboard />);
    expect(container.textContent).toBe("");
    expect(m.nav.current.items).toEqual([]);
  });

  it("shows a spinner while the roots load", () => {
    m.roots.mockReturnValue({ data: undefined, isLoading: true });
    render(<OrganizationsDashboard />);
    expect(screen.queryByText("accounts-view")).toBeNull();
  });

  it("shows the intro page without an organization and creates one", async () => {
    m.org.mockReturnValue({ data: { organization: null }, isLoading: false });
    render(<OrganizationsDashboard />);
    expect(m.nav.current.footer).toBeUndefined();
    expect(crumbTexts()).toEqual(["Dashboard", "AWS Organizations"]);
    fireEvent.click(screen.getByText("get-started"));
    await waitFor(() => expect(m.createOrg).toHaveBeenCalled());
    expect(m.toast).toHaveBeenCalledWith("success", "Your organization has been created.");
  });

  it("treats a missing organization payload as none", () => {
    m.org.mockReturnValue({ data: undefined, isLoading: false });
    render(<OrganizationsDashboard />);
    expect(screen.getByText("get-started")).toBeTruthy();
  });

  it("reports a create failure with the error or a fallback", async () => {
    m.org.mockReturnValue({ data: { organization: null }, isLoading: false });
    m.createOrg.mockRejectedValueOnce(new Error("Already exists")).mockRejectedValueOnce({});
    render(<OrganizationsDashboard />);
    fireEvent.click(screen.getByText("get-started"));
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith("error", "Already exists"));
    fireEvent.click(screen.getByText("get-started"));
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith("error", "Failed to create organization"));
  });

  it("explains an organization without a root", () => {
    m.roots.mockReturnValue({ data: { roots: [] }, isLoading: false });
    render(<OrganizationsDashboard />);
    expect(screen.getByText("The organization has no root.")).toBeTruthy();
  });

  it("handles a missing roots payload", () => {
    m.roots.mockReturnValue({ data: undefined, isLoading: false });
    render(<OrganizationsDashboard />);
    expect(screen.getByText("The organization has no root.")).toBeTruthy();
  });

  it("registers the AWS Organizations side navigation with the organization ID", () => {
    render(<OrganizationsDashboard />);
    expect(m.nav.current.header.text).toBe("AWS Organizations");
    expect(m.nav.current.items.map((i: any) => i.text)).toEqual(["AWS accounts", "Policies", "Settings"]);
    expect(m.nav.current.activeHref).toBe("#accounts");
    render(<>{m.nav.current.footer}</>);
    expect(screen.getByText("o-1")).toBeTruthy();
    expect(crumbTexts()).toEqual(["Dashboard", "AWS Organizations", "AWS accounts"]);
  });

  it("moves between sections from the side navigation", async () => {
    render(<OrganizationsDashboard />);
    await waitFor(() => m.nav.current.onFollow("#settings"));
    expect(await screen.findByText("settings-view")).toBeTruthy();
    expect(m.nav.current.activeHref).toBe("#settings");
    expect(crumbTexts()).toEqual(["Dashboard", "AWS Organizations", "Settings"]);
  });

  it("opens Add an AWS account under AWS accounts and returns", async () => {
    render(<OrganizationsDashboard />);
    fireEvent.click(screen.getByText("accounts-view"));
    expect(screen.getByText("add-account-view")).toBeTruthy();
    expect(m.nav.current.activeHref).toBe("#accounts");
    expect(crumbTexts()).toEqual(["Dashboard", "AWS Organizations", "AWS accounts", "Add an AWS account"]);
    fireEvent.click(screen.getByText("add-account-view"));
    expect(screen.getByText("accounts-view")).toBeTruthy();
  });

  it("opens a policy type under Policies", async () => {
    render(<OrganizationsDashboard />);
    await waitFor(() => m.nav.current.onFollow("#policies"));
    fireEvent.click(await screen.findByText("policies-view"));
    expect(screen.getByText("policy-type-view TAG_POLICY")).toBeTruthy();
    expect(m.nav.current.activeHref).toBe("#policies");
    expect(crumbTexts()).toEqual(["Dashboard", "AWS Organizations", "Policies", "Tag policies"]);
  });
});
