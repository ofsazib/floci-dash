// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";

const m = vi.hoisted(() => ({
  policies: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  create: vi.fn(),
  del: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("../../../hooks/useOrganizations", () => ({
  useOrgPolicies: (t: string) => m.policies(t),
  useEnableOrgPolicyType: () => ({ mutateAsync: m.enable, isPending: false }),
  useDisableOrgPolicyType: () => ({ mutateAsync: m.disable, isPending: false }),
  useCreateOrgPolicy: () => ({ mutateAsync: m.create, isPending: false }),
  useDeleteOrgPolicy: () => ({ mutateAsync: m.del, isPending: false }),
}));
vi.mock("../../../components/Toast", () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock("@cloudscape-design/components", async (orig) => ({
  ...(await orig<object>()),
  ...(await import("../../../../test/cloudscapeMocks")).cloudscapeMocks,
}));

import { PoliciesView, PolicyTypeView } from "./PoliciesView";

const root = { Id: "r-1", Arn: "a", Name: "Root", PolicyTypes: [{ Type: "TAG_POLICY", Status: "ENABLED" }, { Type: "BACKUP_POLICY", Status: "PENDING_ENABLE" }] };
const fullAccess = { Id: "p-FullAWSAccess", Arn: "a", Name: "FullAWSAccess", AwsManaged: true, Description: "Allows access to every operation" };
const custom = { Id: "p-1", Arn: "a", Name: "DenyS3", AwsManaged: false };

beforeEach(() => {
  vi.clearAllMocks();
  m.policies.mockReturnValue({ data: { policies: [fullAccess, custom] }, isLoading: false });
  for (const fn of [m.enable, m.disable, m.create, m.del]) fn.mockResolvedValue({});
});

describe("PoliciesView", () => {
  it("lists policy types by category with their status and opens one", () => {
    const onOpen = vi.fn();
    render(<PoliciesView root={root} onOpen={onOpen} />);
    expect(screen.getByRole("heading", { name: "Authorization policies" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Management policies" })).toBeTruthy();
    expect(screen.getAllByText("Enabled")).toHaveLength(2); // SCP (always on) + Tag
    fireEvent.click(screen.getByText("Tag policies"));
    expect(onOpen).toHaveBeenCalledWith("TAG_POLICY");
  });

  it("treats a root without policy types as all disabled except SCPs", () => {
    render(<PoliciesView root={{ Id: "r-1", Arn: "a", Name: "Root" }} onOpen={vi.fn()} />);
    expect(screen.getAllByText("Enabled")).toHaveLength(1);
  });
});

describe("PolicyTypeView", () => {
  it("lists SCPs without a disable button and marks AWS managed ones", () => {
    render(<PolicyTypeView root={root} type="SERVICE_CONTROL_POLICY" />);
    expect(screen.getByRole("heading", { name: "Service control policies" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Disable/ })).toBeNull();
    expect(screen.getByText("AWS managed")).toBeTruthy();
    expect(screen.getByText("Customer managed")).toBeTruthy();
    expect(screen.getByText("Allows access to every operation")).toBeTruthy();
    expect(m.policies).toHaveBeenCalledWith("SERVICE_CONTROL_POLICY");
  });

  it("enables a disabled policy type", async () => {
    render(<PolicyTypeView root={root} type="BACKUP_POLICY" />);
    expect(screen.getByText(/are disabled in this organization/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Enable backup policies" }));
    await waitFor(() => expect(m.enable).toHaveBeenCalledWith({ policyType: "BACKUP_POLICY", rootId: "r-1" }));
    expect(m.toast).toHaveBeenCalledWith("success", "Backup policies enabled.");
  });

  it("disables an enabled policy type", async () => {
    render(<PolicyTypeView root={root} type="TAG_POLICY" />);
    fireEvent.click(screen.getByRole("button", { name: "Disable tag policies" }));
    await waitFor(() => expect(m.disable).toHaveBeenCalledWith({ policyType: "TAG_POLICY", rootId: "r-1" }));
    expect(m.toast).toHaveBeenCalledWith("success", "Tag policies disabled.");
  });

  it("reports enable and disable failures", async () => {
    m.enable.mockRejectedValueOnce({});
    m.disable.mockRejectedValueOnce(new Error("Nope"));
    const { unmount } = render(<PolicyTypeView root={root} type="BACKUP_POLICY" />);
    fireEvent.click(screen.getByRole("button", { name: "Enable backup policies" }));
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith("error", "Failed to enable backup policies"));
    unmount();
    render(<PolicyTypeView root={root} type="TAG_POLICY" />);
    fireEvent.click(screen.getByRole("button", { name: "Disable tag policies" }));
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith("error", "Nope"));
  });

  it("shows an empty, loading-safe table", () => {
    m.policies.mockReturnValue({ data: undefined, isLoading: true });
    render(<PolicyTypeView root={root} type="TAG_POLICY" />);
    expect(screen.getByText("(0)")).toBeTruthy();
  });

  it("validates and creates a policy with a description", async () => {
    render(<PolicyTypeView root={root} type="TAG_POLICY" />);
    fireEvent.click(screen.getByRole("button", { name: "Create policy" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Create new tag policy" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Policy content"), { target: { value: "{" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create policy" }));
    expect(screen.getByText("Enter a policy name.")).toBeTruthy();
    expect(screen.getByText(/^Invalid JSON/)).toBeTruthy();
    expect(m.create).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Policy name"), { target: { value: " tags " } });
    fireEvent.change(screen.getByLabelText("Policy description"), { target: { value: " Team tags " } });
    fireEvent.change(screen.getByLabelText("Policy content"), { target: { value: '{"tags":{}}' } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create policy" }));
    await waitFor(() =>
      expect(m.create).toHaveBeenCalledWith({ name: "tags", description: "Team tags", content: '{"tags":{}}', type: "TAG_POLICY" }),
    );
    expect(m.toast).toHaveBeenCalledWith("success", "Successfully created policy 'tags'.");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("creates without a description and reports failures", async () => {
    m.create.mockRejectedValueOnce({}).mockResolvedValueOnce({});
    render(<PolicyTypeView root={root} type="SERVICE_CONTROL_POLICY" />);
    fireEvent.click(screen.getByRole("button", { name: "Create policy" }));
    fireEvent.change(screen.getByLabelText("Policy name"), { target: { value: "deny" } });
    const create = within(screen.getByRole("dialog")).getByRole("button", { name: "Create policy" });
    fireEvent.click(create);
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith("error", "Failed to create policy"));
    fireEvent.click(create);
    await waitFor(() => expect(m.create).toHaveBeenLastCalledWith(expect.objectContaining({ name: "deny", description: undefined })));
  });

  it("cancels the create dialog", () => {
    render(<PolicyTypeView root={root} type="TAG_POLICY" />);
    fireEvent.click(screen.getByRole("button", { name: "Create policy" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("only deletes customer managed policies, after typing the name", async () => {
    render(<PolicyTypeView root={root} type="SERVICE_CONTROL_POLICY" />);
    const del = () => screen.getByRole("button", { name: "Delete" }) as HTMLButtonElement;
    const isDisabled = (b: HTMLButtonElement) => b.disabled || b.getAttribute("aria-disabled") === "true";
    expect(isDisabled(del())).toBe(true);
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[0]); // FullAWSAccess (AWS managed)
    expect(isDisabled(del())).toBe(true);
    fireEvent.click(radios[1]); // DenyS3
    expect(isDisabled(del())).toBe(false);
    fireEvent.click(del());
    fireEvent.change(screen.getByLabelText("Confirmation"), { target: { value: "DenyS3" } });
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete policy" }));
    await waitFor(() => expect(m.del).toHaveBeenCalledWith("p-1"));
    expect(m.toast).toHaveBeenCalledWith("success", "Successfully deleted policy 'DenyS3'.");
  });

  it("reports a delete failure and cancels", async () => {
    m.del.mockRejectedValueOnce(new Error("Attached"));
    render(<PolicyTypeView root={root} type="SERVICE_CONTROL_POLICY" />);
    fireEvent.click(screen.getAllByRole("radio")[1]);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.change(screen.getByLabelText("Confirmation"), { target: { value: "DenyS3" } });
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete policy" }));
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith("error", "Attached"));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
