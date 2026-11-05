// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";

const m = vi.hoisted(() => ({ del: vi.fn(), toast: vi.fn() }));

vi.mock("../../../hooks/useOrganizations", () => ({
  useDeleteOrg: () => ({ mutateAsync: m.del, isPending: false }),
}));
vi.mock("../../../components/Toast", () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock("@cloudscape-design/components", async (orig) => ({
  ...(await orig<object>()),
  ...(await import("../../../../test/cloudscapeMocks")).cloudscapeMocks,
}));

import SettingsView from "./SettingsView";

const org = { Id: "o-abc", Arn: "arn:org", FeatureSet: "ALL", MasterAccountId: "000", MasterAccountEmail: "m@x.io" };

beforeEach(() => {
  vi.clearAllMocks();
  m.del.mockResolvedValue({});
});

const confirmDelete = () => {
  fireEvent.click(screen.getByRole("button", { name: "Delete organization" }));
  fireEvent.change(screen.getByLabelText("Confirmation"), { target: { value: "o-abc" } });
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete organization" }));
};

describe("SettingsView", () => {
  it("shows the organization details", () => {
    render(<SettingsView org={org} />);
    expect(screen.getByText("o-abc")).toBeTruthy();
    expect(screen.getByText("All features")).toBeTruthy();
    expect(screen.getByText("m@x.io")).toBeTruthy();
  });

  it("shows unknown feature sets as-is and dashes for missing values", () => {
    render(<SettingsView org={{ Id: "o-1", Arn: "arn", FeatureSet: "NEW_SET" }} />);
    expect(screen.getByText("NEW_SET")).toBeTruthy();
    expect(screen.getAllByText("-").length).toBe(2);
  });

  it("shows a dash without a feature set", () => {
    render(<SettingsView org={{ Id: "o-1", Arn: "arn" }} />);
    expect(screen.getAllByText("-").length).toBe(3);
  });

  it("deletes the organization after typing its id", async () => {
    render(<SettingsView org={org} />);
    confirmDelete();
    await waitFor(() => expect(m.del).toHaveBeenCalled());
    expect(m.toast).toHaveBeenCalledWith("success", "Organization deleted.");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("reports a delete failure with the error or a fallback", async () => {
    m.del.mockRejectedValueOnce(new Error("Accounts remain")).mockRejectedValueOnce({});
    render(<SettingsView org={org} />);
    confirmDelete();
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith("error", "Accounts remain"));
    confirmDelete();
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith("error", "Failed to delete organization"));
  });

  it("cancels the delete dialog", () => {
    render(<SettingsView org={org} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete organization" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(m.del).not.toHaveBeenCalled();
  });
});
