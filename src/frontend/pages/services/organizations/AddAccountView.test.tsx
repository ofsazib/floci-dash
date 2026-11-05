// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const m = vi.hoisted(() => ({ create: vi.fn(), toast: vi.fn(), pending: false }));

vi.mock("../../../hooks/useOrganizations", () => ({
  useCreateOrgAccount: () => ({ mutateAsync: m.create, isPending: m.pending }),
}));
vi.mock("../../../components/Toast", () => ({ useToast: () => ({ showToast: m.toast }) }));

import AddAccountView from "./AddAccountView";

beforeEach(() => {
  vi.clearAllMocks();
  m.create.mockResolvedValue({});
});

const fill = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const submit = () => fireEvent.click(screen.getByRole("button", { name: "Create AWS account" }));

describe("AddAccountView", () => {
  it("shows the create and (disabled) invite choices with the default role", () => {
    render(<AddAccountView onDone={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Add an AWS account" })).toBeTruthy();
    expect(screen.getByText("Invite an existing AWS account")).toBeTruthy();
    expect((screen.getByLabelText("IAM role name") as HTMLInputElement).value).toBe("OrganizationAccountAccessRole");
  });

  it("validates name and email before creating", () => {
    render(<AddAccountView onDone={vi.fn()} />);
    submit();
    expect(screen.getByText("Enter an AWS account name.")).toBeTruthy();
    expect(screen.getByText("Enter a valid email address.")).toBeTruthy();
    fill("AWS account name", "Dev");
    fill("Email address of the account's owner", "not-an-email");
    submit();
    expect(screen.queryByText("Enter an AWS account name.")).toBeNull();
    expect(screen.getByText("Enter a valid email address.")).toBeTruthy();
    expect(m.create).not.toHaveBeenCalled();
  });

  it("creates the account with role and tags, then returns", async () => {
    const onDone = vi.fn();
    render(<AddAccountView onDone={onDone} />);
    fill("AWS account name", " Dev ");
    fill("Email address of the account's owner", "dev@example.com");
    fill("IAM role name", "AdminRole");
    fireEvent.click(screen.getByRole("button", { name: "Add tag" }));
    fill("Tag key 1", "team");
    fill("Tag value 1", "core");
    submit();
    await waitFor(() =>
      expect(m.create).toHaveBeenCalledWith({ name: "Dev", email: "dev@example.com", roleName: "AdminRole", tags: { team: "core" } }),
    );
    expect(m.toast).toHaveBeenCalledWith("success", expect.stringContaining("'Dev'"));
    expect(onDone).toHaveBeenCalled();
  });

  it("falls back to the default role when the field is cleared", async () => {
    render(<AddAccountView onDone={vi.fn()} />);
    fill("AWS account name", "Dev");
    fill("Email address of the account's owner", "dev@example.com");
    fill("IAM role name", " ");
    submit();
    await waitFor(() => expect(m.create).toHaveBeenCalledWith(expect.objectContaining({ roleName: "OrganizationAccountAccessRole", tags: undefined })));
  });

  it("reports failures with the error or a fallback", async () => {
    m.create.mockRejectedValueOnce(new Error("Email in use")).mockRejectedValueOnce({});
    const onDone = vi.fn();
    render(<AddAccountView onDone={onDone} />);
    fill("AWS account name", "Dev");
    fill("Email address of the account's owner", "dev@example.com");
    submit();
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith("error", "Email in use"));
    submit();
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith("error", "Failed to create account"));
    expect(onDone).not.toHaveBeenCalled();
  });

  it("cancels back to the accounts page", () => {
    const onDone = vi.fn();
    render(<AddAccountView onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onDone).toHaveBeenCalled();
    expect(m.create).not.toHaveBeenCalled();
  });
});
