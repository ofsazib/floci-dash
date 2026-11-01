// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

/** Fire Escape on every mounted Cloudscape dialog (fires onDismiss). */
function dismissModalWithEscape() {
  document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
    fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27, key: "Escape" });
  });
}

/** Assert the modal with the given header text is hidden (Cloudscape uses display:none). */
function expectModalHidden(headerText: string) {
  const header = screen.getAllByText(headerText).find((h) => h.closest('[role="dialog"]'));
  const dialog = header!.closest('[role="dialog"]') as HTMLElement;
  expect(dialog.className).toContain("hidden");
}

const deleteState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const untagState = vi.hoisted(() => ({
  isPending: false,
  variables: null as any,
}));

const mockWorkspaces = vi.fn();
const mockTags = vi.fn();
const mockCreateMutate = vi.fn(() => Promise.resolve({}));
const mockDeleteMutate = vi.fn(() => Promise.resolve({}));
const mockAliasMutate = vi.fn(() => Promise.resolve({}));
const mockTagMutate = vi.fn(() => Promise.resolve({}));
const mockUntagMutate = vi.fn(() => Promise.resolve({}));
const mockShowToast = vi.fn();
const mockNamespaces = vi.fn();
const mockNamespace = vi.fn();
const mockCreateNsMutate = vi.fn(() => Promise.resolve({}));
const nsUpdateState = vi.hoisted(() => ({ isPending: false, variables: null as any }));
const nsDeleteState = vi.hoisted(() => ({ isPending: false, variables: null as any }));
const mockUpdateNsMutate = vi.fn(() => Promise.resolve({}));
const mockDeleteNsMutate = vi.fn(() => Promise.resolve({}));
const mockCreateNsReject = vi.fn();

vi.mock("../../hooks/useAMP", () => ({
  useAMPNamespaces: (...args: any[]) => mockNamespaces(...args),
  useAMPNamespace: (...args: any[]) => mockNamespace(...args),
  useCreateAMPNamespace: () => ({ mutateAsync: mockCreateNsMutate, isPending: false }),
    useUpdateAMPNamespace: () => ({
    mutateAsync: mockUpdateNsMutate,
    get isPending() { return nsUpdateState.isPending; },
    get variables() { return nsUpdateState.variables; },
  }),
    useDeleteAMPNamespace: () => ({
    mutateAsync: mockDeleteNsMutate,
    get isPending() { return nsDeleteState.isPending; },
    get variables() { return nsDeleteState.variables; },
  }),
  useAMPWorkspaces: (...args: any[]) => mockWorkspaces(...args),
  useAMPTags: (...args: any[]) => mockTags(...args),
  useCreateAMPWorkspace: () => ({ mutateAsync: mockCreateMutate, isPending: false }),
  useDeleteAMPWorkspace: () => ({
    mutateAsync: mockDeleteMutate,
    get isPending() { return deleteState.isPending; },
    get variables() { return deleteState.variables; },
  }),
  useUpdateAMPWorkspaceAlias: () => ({ mutateAsync: mockAliasMutate, isPending: false }),
  useAMPTagResource: () => ({ mutateAsync: mockTagMutate, isPending: false }),
  useAMPUntagResource: () => ({
    mutateAsync: mockUntagMutate,
    get isPending() { return untagState.isPending; },
    get variables() { return untagState.variables; },
  }),
}));

vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

import { AMPDashboard } from "./AMPDashboard";

const wsRow = {
  workspaceId: "ws-1",
  alias: "lawful",
  arn: "arn:aws:aps:us-east-1:123456789012:workspace/ws-1",
  status: { statusCode: "ACTIVE" },
  createdAt: 1705000000,
};

beforeEach(() => {
  vi.clearAllMocks();
  deleteState.isPending = false;
  deleteState.variables = null;
  untagState.isPending = false;
  untagState.variables = null;
  mockCreateMutate.mockImplementation(() => Promise.resolve({}));
  mockDeleteMutate.mockImplementation(() => Promise.resolve({}));
  mockAliasMutate.mockImplementation(() => Promise.resolve({}));
  mockTagMutate.mockImplementation(() => Promise.resolve({}));
  mockUntagMutate.mockImplementation(() => Promise.resolve({}));
  mockTags.mockReturnValue({ data: { tags: {} }, isLoading: false });
  mockWorkspaces.mockReturnValue({ data: { workspaces: [], total: 0 }, isLoading: false });
  mockNamespaces.mockReturnValue({ data: { namespaces: [], total: 0 }, isLoading: false });
  mockNamespace.mockReturnValue({ data: { namespace: null } });
  nsUpdateState.isPending = false;
  nsUpdateState.variables = null;
  nsDeleteState.isPending = false;
  nsDeleteState.variables = null;
});

describe("AMPDashboard", () => {
  it("renders the header", () => {
    render(<AMPDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Managed Service for Prometheus")).toBeTruthy();
  });

  it("shows loading skeleton", () => {
    mockWorkspaces.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<AMPDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty message when no workspaces", () => {
    render(<AMPDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No AMP workspaces/i)).toBeTruthy();
  });

  it("renders workspace rows with alias, id, status and created date", () => {
    mockWorkspaces.mockReturnValue({
      data: { workspaces: [wsRow], total: 1 },
      isLoading: false,
    });
    render(<AMPDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("lawful")).toBeTruthy();
    expect(screen.getByText("ws-1")).toBeTruthy();
    expect(screen.getByText("ACTIVE")).toBeTruthy();
    expect(screen.getByText(new Date(1705000000 * 1000).toLocaleDateString())).toBeTruthy();
  });

  it("shows dash for missing alias and created date", () => {
    mockWorkspaces.mockReturnValue({
      data: {
        workspaces: [{ workspaceId: "ws-2", arn: "arn:aws:aps:ws-2", status: { statusCode: "ACTIVE" } }],
        total: 1,
      },
      isLoading: false,
    });
    render(<AMPDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("ws-2")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });

  it("shows UNKNOWN status when the status object is missing", () => {
    mockWorkspaces.mockReturnValue({
      data: {
        workspaces: [{ workspaceId: "ws-3", arn: "arn:aws:aps:ws-3" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<AMPDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("UNKNOWN")).toBeTruthy();
  });

  it("shows non-ACTIVE status as error indicator", () => {
    mockWorkspaces.mockReturnValue({
      data: {
        workspaces: [{ ...wsRow, workspaceId: "ws-bad", status: { statusCode: "FAILED" } }],
        total: 1,
      },
      isLoading: false,
    });
    render(<AMPDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("FAILED")).toBeTruthy();
  });

  it("shows CREATING status as in-progress indicator", () => {
    mockWorkspaces.mockReturnValue({
      data: {
        workspaces: [{ ...wsRow, workspaceId: "ws-new", status: { statusCode: "CREATING" } }],
        total: 1,
      },
      isLoading: false,
    });
    render(<AMPDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("CREATING")).toBeTruthy();
  });

  it("creates a workspace", async () => {
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^Create Workspace$/ }));
    await user.type(screen.getByLabelText("Alias"), "my-ws");
    await user.click(screen.getByRole("button", { name: /^Create workspace$/ }));
    await waitFor(() => expect(mockCreateMutate).toHaveBeenCalledWith({ alias: "my-ws" }));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Workspace my-ws created");
  });

  it("shows create error when the API fails", async () => {
    mockCreateMutate.mockRejectedValueOnce(new Error("create failed"));
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^Create Workspace$/ }));
    await user.type(screen.getByLabelText("Alias"), "my-ws");
    await user.click(screen.getByRole("button", { name: /^Create workspace$/ }));
    expect(await screen.findByText("create failed")).toBeTruthy();
  });

  it("shows the fallback create error for non-Error rejections", async () => {
    mockCreateMutate.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^Create Workspace$/ }));
    await user.type(screen.getByLabelText("Alias"), "my-ws");
    await user.click(screen.getByRole("button", { name: /^Create workspace$/ }));
    expect(await screen.findByText("Failed to create workspace")).toBeTruthy();
  });

  it("disables create submit on empty alias", async () => {
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^Create Workspace$/ }));
    expect(
      (screen.getByRole("button", { name: /^Create workspace$/ }) as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it("deletes a workspace", async () => {
    mockWorkspaces.mockReturnValue({
      data: { workspaces: [wsRow], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete lawful/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Delete$/i }));
    await waitFor(() => expect(mockDeleteMutate).toHaveBeenCalledWith("ws-1"));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Workspace lawful deleted");
  });

  it("deletes a workspace with no alias using its id", async () => {
    mockWorkspaces.mockReturnValue({
      data: {
        workspaces: [{ workspaceId: "ws-noalias", arn: "arn:aws:aps:ws-noalias", status: { statusCode: "ACTIVE" } }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("ws-noalias")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete ws-noalias/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Delete$/i }));
    await waitFor(() => expect(mockDeleteMutate).toHaveBeenCalledWith("ws-noalias"));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Workspace ws-noalias deleted");
  });

  it("shows the fallback delete error for non-Error rejections", async () => {
    mockWorkspaces.mockReturnValue({
      data: { workspaces: [wsRow], total: 1 },
      isLoading: false,
    });
    mockDeleteMutate.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete lawful/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Delete$/i }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete workspace")
    );
  });

  it("shows the delete row as loading while its own delete is pending", () => {
    deleteState.isPending = true;
    deleteState.variables = "ws-1";
    mockWorkspaces.mockReturnValue({
      data: { workspaces: [wsRow], total: 1 },
      isLoading: false,
    });
    render(<AMPDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("lawful")).toBeTruthy();
  });

  it("does not show delete loading for a different workspace", () => {
    deleteState.isPending = true;
    deleteState.variables = "ws-other";
    mockWorkspaces.mockReturnValue({
      data: { workspaces: [wsRow], total: 1 },
      isLoading: false,
    });
    render(<AMPDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("lawful")).toBeTruthy();
  });

  it("shows delete error toast when the API fails", async () => {
    mockWorkspaces.mockReturnValue({
      data: { workspaces: [wsRow], total: 1 },
      isLoading: false,
    });
    mockDeleteMutate.mockRejectedValueOnce(new Error("delete failed"));
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete lawful/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Delete$/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "delete failed"));
  });

  it("edits a workspace alias", async () => {
    mockWorkspaces.mockReturnValue({
      data: { workspaces: [wsRow], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Edit alias" }));
    const input = screen.getByLabelText("New alias");
    await user.clear(input);
    await user.type(input, "renamed");
    await user.click(screen.getByRole("button", { name: "Save alias" }));
    await waitFor(() =>
      expect(mockAliasMutate).toHaveBeenCalledWith({ workspaceId: "ws-1", alias: "renamed" })
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Workspace alias updated");
  });

  it("shows alias error when the API fails", async () => {
    mockWorkspaces.mockReturnValue({
      data: { workspaces: [wsRow], total: 1 },
      isLoading: false,
    });
    mockAliasMutate.mockRejectedValueOnce(new Error("alias failed"));
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Edit alias" }));
    await user.type(screen.getByLabelText("New alias"), "renamed");
    await user.click(screen.getByRole("button", { name: "Save alias" }));
    expect(await screen.findByText("alias failed")).toBeTruthy();
  });

  it("shows the fallback alias error for non-Error rejections", async () => {
    mockWorkspaces.mockReturnValue({
      data: { workspaces: [wsRow], total: 1 },
      isLoading: false,
    });
    mockAliasMutate.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Edit alias" }));
    await user.type(screen.getByLabelText("New alias"), "renamed");
    await user.click(screen.getByRole("button", { name: "Save alias" }));
    expect(await screen.findByText("Failed to update alias")).toBeTruthy();
  });

  it("opens the alias editor pre-filled empty for an alias-less workspace", async () => {
    mockWorkspaces.mockReturnValue({
      data: {
        workspaces: [{ ...wsRow, alias: undefined }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("ws-1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Edit alias" }));
    expect((screen.getByLabelText("New alias") as HTMLInputElement).value).toBe("");
  });

  it("filters workspaces by alias", async () => {
    mockWorkspaces.mockReturnValue({
      data: {
        workspaces: [wsRow, { ...wsRow, workspaceId: "ws-2", alias: "other" }],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Find workspaces by alias"), "other");
    await waitFor(() => expect(screen.queryByText("lawful")).toBeNull());
  });

  it("filters without failing when a row has no alias", async () => {
    mockWorkspaces.mockReturnValue({
      data: {
        workspaces: [{ ...wsRow, alias: undefined }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("ws-1")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Find workspaces by alias"), "nomatch");
    await waitFor(() => expect(screen.queryByText("ws-1")).toBeNull());
  });

  it("opens the tags modal and shows empty state", async () => {
    mockWorkspaces.mockReturnValue({
      data: { workspaces: [wsRow], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    expect(await screen.findByText(/Tags for/)).toBeTruthy();
    expect(await screen.findByText("No tags on this workspace.")).toBeTruthy();
  });

  it("shows the tags empty state when the tags payload is undefined", async () => {
    mockWorkspaces.mockReturnValue({
      data: { workspaces: [wsRow], total: 1 },
      isLoading: false,
    });
    mockTags.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    expect(await screen.findByText("No tags on this workspace.")).toBeTruthy();
  });

  it("shows the tags loading state", async () => {
    mockWorkspaces.mockReturnValue({
      data: { workspaces: [wsRow], total: 1 },
      isLoading: false,
    });
    mockTags.mockReturnValue({ data: undefined, isLoading: true });
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    expect(await screen.findByText(/Loading tags/)).toBeTruthy();
  });

  it("adds a tag from the tags modal", async () => {
    mockWorkspaces.mockReturnValue({
      data: { workspaces: [wsRow], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    await user.type(screen.getByLabelText("Tag key"), "env");
    await user.type(screen.getByLabelText("Tag value"), "prod");
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    await waitFor(() =>
      expect(mockTagMutate).toHaveBeenCalledWith({
        resourceArn: wsRow.arn,
        tags: { env: "prod" },
      })
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Tag env added");
  });

  it("shows tag add error toast", async () => {
    mockWorkspaces.mockReturnValue({
      data: { workspaces: [wsRow], total: 1 },
      isLoading: false,
    });
    mockTagMutate.mockRejectedValueOnce(new Error("tag failed"));
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    await user.type(screen.getByLabelText("Tag key"), "env");
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "tag failed"));
  });

  it("shows the fallback add-tag error for non-Error rejections", async () => {
    mockWorkspaces.mockReturnValue({
      data: { workspaces: [wsRow], total: 1 },
      isLoading: false,
    });
    mockTagMutate.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    await user.type(screen.getByLabelText("Tag key"), "env");
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to add tag")
    );
  });

  it("disables Add tag on empty key", async () => {
    mockWorkspaces.mockReturnValue({
      data: { workspaces: [wsRow], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    expect((screen.getByRole("button", { name: "Add tag" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("removes an existing tag", async () => {
    mockWorkspaces.mockReturnValue({
      data: { workspaces: [wsRow], total: 1 },
      isLoading: false,
    });
    mockTags.mockReturnValue({ data: { tags: { env: "prod" } }, isLoading: false });
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    expect(await screen.findByText("env")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() =>
      expect(mockUntagMutate).toHaveBeenCalledWith({
        resourceArn: wsRow.arn,
        tagKeys: ["env"],
      })
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Tag env removed");
  });

  it("shows tag remove error toast", async () => {
    mockWorkspaces.mockReturnValue({
      data: { workspaces: [wsRow], total: 1 },
      isLoading: false,
    });
    mockTags.mockReturnValue({ data: { tags: { env: "prod" } }, isLoading: false });
    mockUntagMutate.mockRejectedValueOnce(new Error("untag failed"));
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    await waitFor(() => expect(screen.getByText("env")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "untag failed"));
  });

  it("shows the fallback remove-tag error for non-Error rejections", async () => {
    mockWorkspaces.mockReturnValue({
      data: { workspaces: [wsRow], total: 1 },
      isLoading: false,
    });
    mockTags.mockReturnValue({ data: { tags: { env: "prod" } }, isLoading: false });
    mockUntagMutate.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    await waitFor(() => expect(screen.getByText("env")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to remove tag")
    );
  });

  it("shows the Remove button as loading while its own untag is pending", async () => {
    mockWorkspaces.mockReturnValue({
      data: { workspaces: [wsRow], total: 1 },
      isLoading: false,
    });
    mockTags.mockReturnValue({ data: { tags: { env: "prod" } }, isLoading: false });
    untagState.isPending = true;
    untagState.variables = { resourceArn: wsRow.arn, tagKeys: ["env"] };
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    await waitFor(() => expect(screen.getByText("env")).toBeTruthy());
    expect(screen.getByRole("button", { name: "Remove" })).toBeTruthy();
  });

  it("does not show Remove loading when a different tag key is pending", async () => {
    mockWorkspaces.mockReturnValue({
      data: { workspaces: [wsRow], total: 1 },
      isLoading: false,
    });
    mockTags.mockReturnValue({ data: { tags: { env: "prod" } }, isLoading: false });
    untagState.isPending = true;
    untagState.variables = { resourceArn: wsRow.arn, tagKeys: ["other"] };
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    await waitFor(() => expect(screen.getByText("env")).toBeTruthy());
    expect(screen.getByRole("button", { name: "Remove" })).toBeTruthy();
  });

  it("closes the create modal with Escape", async () => {
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^Create Workspace$/ }));
    dismissModalWithEscape();
    expectModalHidden("Create AMP workspace");
    expect(mockCreateMutate).not.toHaveBeenCalled();
  });

  it("opens namespaces modal and lists namespaces", async () => {
    mockWorkspaces.mockReturnValue({ data: { workspaces: [wsRow], total: 1 }, isLoading: false });
    mockNamespaces.mockReturnValue({
      data: { namespaces: [{ name: "ns1", status: { statusCode: "ACTIVE" }, modifiedAt: "t" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Namespaces" }));
    expect(await screen.findByText("ns1")).toBeTruthy();
    expect(mockNamespaces).toHaveBeenCalledWith("ws-1");
  });

  it("creates a namespace from the modal form", async () => {
    mockWorkspaces.mockReturnValue({ data: { workspaces: [wsRow], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Namespaces" }));
    const nsDialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    const areas = within(nsDialog).getAllByRole("textbox");
    await user.type(areas[0], "ns2");
    await user.type(areas[1], "groups: all");
    await user.click(screen.getByRole("button", { name: "Create namespace" }));
    expect(mockCreateNsMutate).toHaveBeenCalledWith({ workspaceId: "ws-1", name: "ns2", data: "groups: all" });
  });

  it("views and deletes a namespace", async () => {
    mockWorkspaces.mockReturnValue({ data: { workspaces: [wsRow], total: 1 }, isLoading: false });
    mockNamespaces.mockReturnValue({
      data: { namespaces: [{ name: "ns1", status: { statusCode: "ACTIVE" } }], total: 1 },
      isLoading: false,
    });
    mockNamespace.mockReturnValue({ data: { namespace: { name: "ns1", data: "groups: []" } } });
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Namespaces" }));
    await user.click(await screen.findByRole("button", { name: "View" }));
    expect(mockNamespace).toHaveBeenCalledWith("ws-1", "ns1");
    await waitFor(() => expect(screen.getByDisplayValue("groups: []")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete ns1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Delete$/i }));
    expect(mockDeleteNsMutate).toHaveBeenCalledWith({ workspaceId: "ws-1", name: "ns1" });
  });

  it("updates namespace data successfully", async () => {
    mockWorkspaces.mockReturnValue({ data: { workspaces: [wsRow], total: 1 }, isLoading: false });
    mockNamespaces.mockReturnValue({
      data: { namespaces: [{ name: "ns1", status: { statusCode: "ACTIVE" } }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Namespaces" }));
    const nsDialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.type(within(nsDialog).getAllByRole("textbox")[1], "groups: ok");
    await user.click(screen.getByRole("button", { name: "Update data" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "Namespace ns1 updated"));
  });

  it("updates namespace data and handles update/delete errors", async () => {
    mockWorkspaces.mockReturnValue({ data: { workspaces: [wsRow], total: 1 }, isLoading: false });
    mockNamespaces.mockReturnValue({
      data: { namespaces: [{ name: "ns1", status: { statusCode: "ACTIVE" } }], total: 1 },
      isLoading: false,
    });
    mockUpdateNsMutate.mockRejectedValueOnce(new Error("update boom"));
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Namespaces" }));
    const nsDialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.type(within(nsDialog).getAllByRole("textbox")[1], "groups: x");
    await user.click(screen.getByRole("button", { name: "Update data" }));
    await waitFor(() => expect(mockUpdateNsMutate).toHaveBeenCalledWith({ workspaceId: "ws-1", name: "ns1", data: "groups: x" }));
    expect(mockShowToast).toHaveBeenCalledWith("error", "update boom");
  });

  it("deletes a namespace and shows error toast on failure", async () => {
    mockWorkspaces.mockReturnValue({ data: { workspaces: [wsRow], total: 1 }, isLoading: false });
    mockNamespaces.mockReturnValue({
      data: { namespaces: [{ name: "ns1", status: { statusCode: "ACTIVE" } }], total: 1 },
      isLoading: false,
    });
    mockDeleteNsMutate.mockRejectedValueOnce(new Error("delete boom"));
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Namespaces" }));
    await user.click(await screen.findByRole("button", { name: /Delete ns1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Delete$/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "delete boom"));
  });

  it("shows error toast when namespace creation fails", async () => {
    mockWorkspaces.mockReturnValue({ data: { workspaces: [wsRow], total: 1 }, isLoading: false });
    mockCreateNsMutate.mockRejectedValueOnce(new Error("create ns boom"));
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Namespaces" }));
    const nsDialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    const areas = within(nsDialog).getAllByRole("textbox");
    await user.type(areas[0], "ns9");
    await user.type(areas[1], "groups: y");
    await user.click(screen.getByRole("button", { name: "Create namespace" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "create ns boom"));
  });

  it("renders non-string namespace data as JSON", async () => {
    mockWorkspaces.mockReturnValue({ data: { workspaces: [wsRow], total: 1 }, isLoading: false });
    mockNamespaces.mockReturnValue({
      data: { namespaces: [{ name: "ns1", status: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockNamespace.mockReturnValue({ data: { namespace: { name: "ns1", data: { groups: [] } } } });
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Namespaces" }));
    await user.click(await screen.findByRole("button", { name: "View" }));
    const areas = screen.getAllByRole("textbox");
    await waitFor(() =>
      expect(areas.some((a) => (a as HTMLTextAreaElement).value.includes("groups"))).toBe(true)
    );
  });

function visibleDeleteBtn() {
  const dialogs = screen.getAllByRole("dialog").filter((d) => !d.className.includes("hidden"));
  const dlg = dialogs[dialogs.length - 1];
  return Array.from(dlg.querySelectorAll("button")).find((b) => b.textContent?.trim() === "Delete")!;
}

  it("renders namespaces panel with undefined data and toggles view off", async () => {
    mockWorkspaces.mockReturnValue({ data: { workspaces: [wsRow], total: 1 }, isLoading: false });
    mockNamespaces.mockReturnValue({
      data: { namespaces: [{ name: "ns1", status: { statusCode: "ACTIVE" } }], total: 1 },
      isLoading: false,
    });
    mockNamespace.mockReturnValue({ data: undefined });
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Namespaces" }));
    await user.click(await screen.findByRole("button", { name: "View" }));
    expect(mockNamespace).toHaveBeenCalledWith("ws-1", "ns1");
    // toggle off (null arm) and JSON.stringify fallback arm for missing data
    await user.click(screen.getByRole("button", { name: "View" }));
    expect(mockNamespace).toHaveBeenCalledWith("ws-1", null);
  });

  it("shows update and delete loading states for the matching namespace", () => {
    nsUpdateState.isPending = true;
    nsUpdateState.variables = { name: "ns1" };
    nsDeleteState.isPending = true;
    nsDeleteState.variables = { name: "ns1" };
    mockWorkspaces.mockReturnValue({ data: { workspaces: [wsRow], total: 1 }, isLoading: false });
    mockNamespaces.mockReturnValue({
      data: {
        namespaces: [
          { name: "ns1", status: { statusCode: "ACTIVE" } },
          { name: "ns2", status: { statusCode: "ACTIVE" } },
        ],
        total: 2,
      },
      isLoading: false,
    });
    render(<AMPDashboard />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole("button", { name: "Namespaces" }));
    const updateButtons = screen.getAllByRole("button", { name: "Update data" });
    expect(updateButtons[0].className).toMatch(/loading|disabled/);
    expect(updateButtons[1].className).not.toMatch(/awsui_loading/);
    nsUpdateState.isPending = false;
    nsUpdateState.variables = null;
    nsDeleteState.isPending = false;
    nsDeleteState.variables = null;
  });

  it("shows fallback toast messages when namespace ops reject without messages", async () => {
    mockWorkspaces.mockReturnValue({ data: { workspaces: [wsRow], total: 1 }, isLoading: false });
    mockNamespaces.mockReturnValue({
      data: { namespaces: [{ name: "ns1", status: { statusCode: "ACTIVE" } }], total: 1 },
      isLoading: false,
    });
    mockCreateNsMutate.mockRejectedValueOnce("plain-1");
    mockUpdateNsMutate.mockRejectedValueOnce("plain-2");
    mockDeleteNsMutate.mockRejectedValueOnce("plain-3");
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Namespaces" }));
    // create failure fallback
    const nsDialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    const areas = within(nsDialog).getAllByRole("textbox");
    await user.type(areas[0], "nsX");
    await user.type(areas[1], "groups: z");
    await user.click(screen.getByRole("button", { name: "Create namespace" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to create namespace"));
    // update failure fallback
    await user.click(screen.getByRole("button", { name: "Update data" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to update namespace"));
    // delete failure fallback
    await user.click(screen.getByRole("button", { name: /Delete ns1/i }));
    await waitFor(() => expect(screen.getAllByText(/Are you sure/).length).toBeGreaterThan(0));
    await user.click(visibleDeleteBtn());
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete namespace"));
  });

  it("renders the namespaces panel empty when query data is undefined", async () => {
    mockWorkspaces.mockReturnValue({ data: { workspaces: [wsRow], total: 1 }, isLoading: false });
    mockNamespaces.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Namespaces" }));
    expect(await screen.findByText("No rule groups namespaces")).toBeTruthy();
  });

  it("clears the namespace view when deleting the viewed namespace", async () => {
    mockWorkspaces.mockReturnValue({ data: { workspaces: [wsRow], total: 1 }, isLoading: false });
    mockNamespaces.mockReturnValue({
      data: { namespaces: [{ name: "ns1", status: { statusCode: "ACTIVE" } }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Namespaces" }));
    await user.click(await screen.findByRole("button", { name: "View" }));
    expect(mockNamespace).toHaveBeenLastCalledWith("ws-1", "ns1");
    await user.click(screen.getByRole("button", { name: /Delete ns1/i }));
    await waitFor(() => expect(screen.getAllByText(/Are you sure/).length).toBeGreaterThan(0));
    await user.click(visibleDeleteBtn());
    await waitFor(() => expect(mockNamespace).toHaveBeenLastCalledWith("ws-1", null));
  });

  it("deletes a namespace that is not being viewed without clearing the view", async () => {
    mockWorkspaces.mockReturnValue({ data: { workspaces: [wsRow], total: 1 }, isLoading: false });
    mockNamespaces.mockReturnValue({
      data: { namespaces: [{ name: "ns1", status: { statusCode: "ACTIVE" } }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AMPDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("lawful")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Namespaces" }));
    await user.click(await screen.findByRole("button", { name: /Delete ns1/i }));
    await waitFor(() => expect(screen.getAllByText(/Are you sure/).length).toBeGreaterThan(0));
    await user.click(visibleDeleteBtn());
    await waitFor(() => expect(mockDeleteNsMutate).toHaveBeenCalledWith({ workspaceId: "ws-1", name: "ns1" }));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Namespace ns1 deleted");
  });
});
