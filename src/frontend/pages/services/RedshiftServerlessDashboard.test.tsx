// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useServerlessNamespaces: vi.fn(),
  useCreateServerlessNamespace: vi.fn(),
  useUpdateServerlessNamespace: vi.fn(),
  useDeleteServerlessNamespace: vi.fn(),
  useServerlessNamespaceTags: vi.fn(),
  useAddServerlessNamespaceTags: vi.fn(),
  useRemoveServerlessNamespaceTags: vi.fn(),
}));

vi.mock("../../hooks/useRedshiftServerless", () => mockHooks);

const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockAddTags = vi.fn();
const mockRemoveTags = vi.fn();

function okMutation(mock: ReturnType<typeof vi.fn>, isPending = false) {
  return { mutateAsync: mock, isPending };
}

function listQuery(overrides: Record<string, unknown> = {}) {
  return {
    data: { namespaces: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

const NS = {
  namespaceName: "analytics",
  namespaceArn: "arn:aws:redshift-serverless:us-east-1:123456789012:namespace/abc",
  dbName: "dev",
  status: "AVAILABLE",
  adminUsername: "admin",
};

import RedshiftServerlessDashboard from "./RedshiftServerlessDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockHooks.useCreateServerlessNamespace.mockReturnValue(okMutation(mockCreate));
  mockHooks.useUpdateServerlessNamespace.mockReturnValue(okMutation(mockUpdate));
  mockHooks.useDeleteServerlessNamespace.mockReturnValue(okMutation(mockDelete));
  mockHooks.useAddServerlessNamespaceTags.mockReturnValue(okMutation(mockAddTags));
  mockHooks.useRemoveServerlessNamespaceTags.mockReturnValue(okMutation(mockRemoveTags));
  mockHooks.useServerlessNamespaceTags.mockReturnValue({
    data: { tags: [{ key: "env", value: "dev" }] },
    isLoading: false,
  });
});

describe("RedshiftServerlessDashboard", () => {
  it("renders namespaces with fields", async () => {
    mockHooks.useServerlessNamespaces.mockReturnValue(
      listQuery({ data: { namespaces: [NS], total: 1 } })
    );
    render(<RedshiftServerlessDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("analytics")).toBeTruthy());
    expect(screen.getByText("AVAILABLE")).toBeTruthy();
    expect(screen.getByText("admin")).toBeTruthy();
  });

  it("renders the dash admin fallback when absent and prefills empty on edit", async () => {
    mockHooks.useServerlessNamespaces.mockReturnValue(
      listQuery({
        data: { namespaces: [{ ...NS, adminUsername: undefined }], total: 1 },
      })
    );
    render(<RedshiftServerlessDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("analytics")).toBeTruthy());
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
    await userEvent.setup().click(screen.getByRole("button", { name: /^Edit$/i }));
    const dlg = screen
      .getAllByText(/Edit namespace/)
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    const input = dlg.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("shows the empty table message", () => {
    mockHooks.useServerlessNamespaces.mockReturnValue(listQuery());
    render(<RedshiftServerlessDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No namespaces found")).toBeTruthy();
  });

  it("renders with undefined list data (loading)", () => {
    mockHooks.useServerlessNamespaces.mockReturnValue(
      listQuery({ data: undefined, isLoading: true })
    );
    render(<RedshiftServerlessDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Namespaces")).toBeTruthy();
  });

  it("shows the error alert with fallback message", () => {
    mockHooks.useServerlessNamespaces.mockReturnValue(listQuery({ isError: true, error: null }));
    render(<RedshiftServerlessDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load namespaces")).toBeTruthy();
  });

  it("creates a namespace and dismisses the success alert", async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValueOnce({ namespace: {} });
    render(<RedshiftServerlessDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create namespace/i }));
    await user.type(screen.getByPlaceholderText("analytics"), "n1");
    const createDlg = screen
      .getAllByText("Namespace name")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    const createInputs = createDlg.querySelectorAll("input");
    await user.type(createInputs[1] as HTMLElement, "warehouse");
    await user.type(createInputs[2] as HTMLElement, "root");
    await user.click(screen.getByRole("button", { name: /^Create$/i }));
    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith({
        namespaceName: "n1",
        dbName: "devwarehouse",
        adminUsername: "adminroot",
      })
    );
    await waitFor(() =>
      expect(screen.getByText("Namespace n1 created.")).toBeTruthy()
    );
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByText("Namespace n1 created.")).toBeNull()
    );
  });

  it("keeps Create disabled until a name is typed and closes on Cancel", async () => {
    const user = userEvent.setup();
    render(<RedshiftServerlessDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create namespace/i }));
    const dlg = screen
      .getAllByText("Namespace name")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    const createBtn = Array.from(dlg.querySelectorAll("button")).find(
      (b) => b.textContent === "Create"
    ) as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
    const cancelBtn = Array.from(dlg.querySelectorAll("button")).find(
      (b) => b.textContent === "Cancel"
    ) as HTMLElement;
    await user.click(cancelBtn);
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("shows a fallback error alert when create fails", async () => {
    const user = userEvent.setup();
    mockCreate.mockRejectedValueOnce({});
    render(<RedshiftServerlessDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create namespace/i }));
    await user.type(screen.getByPlaceholderText("analytics"), "n1");
    await user.click(screen.getByRole("button", { name: /^Create$/i }));
    await waitFor(() =>
      expect(screen.getByText("Failed to create namespace")).toBeTruthy()
    );
  });

  it("edits the admin username", async () => {
    const user = userEvent.setup();
    mockUpdate.mockResolvedValueOnce({ namespace: {} });
    mockHooks.useServerlessNamespaces.mockReturnValue(
      listQuery({ data: { namespaces: [NS], total: 1 } })
    );
    render(<RedshiftServerlessDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("analytics")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Edit$/i }));
    const editDlg = screen
      .getAllByText(/Edit namespace/)
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    const input = editDlg.querySelector("input") as HTMLInputElement;
    await user.type(input as HTMLElement, "2");
    await user.click(screen.getByRole("button", { name: /^Save$/i }));
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith({
        namespaceName: "analytics",
        adminUsername: "admin2",
      })
    );
    await waitFor(() => expect(screen.getByText("Namespace updated.")).toBeTruthy());
  });

  it("keeps Save disabled when admin input is cleared and cancels", async () => {
    const user = userEvent.setup();
    mockHooks.useServerlessNamespaces.mockReturnValue(
      listQuery({ data: { namespaces: [NS], total: 1 } })
    );
    render(<RedshiftServerlessDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("analytics")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Edit$/i }));
    const dlg = screen
      .getAllByText(/Edit namespace/)
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    const saveBtn = Array.from(dlg.querySelectorAll("button")).find(
      (b) => b.textContent === "Save"
    ) as HTMLButtonElement;
    const input = dlg.querySelector("input") as HTMLInputElement;
    await user.clear(input);
    expect(saveBtn.disabled).toBe(true);
    const cancelBtn = Array.from(dlg.querySelectorAll("button")).find(
      (b) => b.textContent === "Cancel"
    ) as HTMLElement;
    await user.click(cancelBtn);
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("shows a fallback error alert when update fails", async () => {
    const user = userEvent.setup();
    mockUpdate.mockRejectedValueOnce({});
    mockHooks.useServerlessNamespaces.mockReturnValue(
      listQuery({ data: { namespaces: [NS], total: 1 } })
    );
    render(<RedshiftServerlessDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("analytics")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Edit$/i }));
    await user.click(screen.getByRole("button", { name: /^Save$/i }));
    await waitFor(() =>
      expect(screen.getByText("Failed to update namespace")).toBeTruthy()
    );
  });

  it("deletes a namespace after confirmation", async () => {
    const user = userEvent.setup();
    mockDelete.mockResolvedValueOnce({ ok: true });
    mockHooks.useServerlessNamespaces.mockReturnValue(
      listQuery({ data: { namespaces: [NS], total: 1 } })
    );
    render(<RedshiftServerlessDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("analytics")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete analytics/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("analytics"));
  });

  it("opens the tags modal, adds and removes a tag", async () => {
    const user = userEvent.setup();
    mockAddTags.mockResolvedValueOnce({ ok: true });
    mockRemoveTags.mockResolvedValueOnce({ ok: true });
    mockHooks.useServerlessNamespaces.mockReturnValue(
      listQuery({ data: { namespaces: [NS], total: 1 } })
    );
    render(<RedshiftServerlessDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("analytics")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Tags$/i }));
    await waitFor(() => expect(screen.getByText("Tags — analytics")).toBeTruthy());
    const tagDlg = screen
      .getAllByText("Tags — analytics")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    await waitFor(() => expect(tagDlg.textContent).toContain("dev"));
    const addBtn = Array.from(tagDlg.querySelectorAll("button")).find(
      (b) => b.textContent === "Add tag"
    ) as HTMLButtonElement;
    expect(addBtn.disabled).toBe(true);
    const inputs = tagDlg.querySelectorAll("input");
    await user.type(inputs[0] as HTMLElement, "team");
    await user.type(inputs[1] as HTMLElement, "core");
    await user.click(addBtn);
    await waitFor(() =>
      expect(mockAddTags).toHaveBeenCalledWith({
        namespaceName: "analytics",
        arn: NS.namespaceArn,
        tags: [{ key: "team", value: "core" }],
      })
    );
    await waitFor(() => expect(screen.getByText("Tag added.")).toBeTruthy());
    const deleteEnv = Array.from(tagDlg.querySelectorAll("button")).find(
      (b) => (b.getAttribute("ariaLabel") || b.getAttribute("aria-label")) === "Delete env"
    ) as HTMLElement;
    await user.click(deleteEnv);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() =>
      expect(mockRemoveTags).toHaveBeenCalledWith({
        namespaceName: "analytics",
        arn: NS.namespaceArn,
        tagKeys: ["env"],
      })
    );
  });

  it("shows a fallback add-tag error when the failure has no message", async () => {
    const user = userEvent.setup();
    mockAddTags.mockRejectedValueOnce({});
    mockHooks.useServerlessNamespaces.mockReturnValue(
      listQuery({ data: { namespaces: [NS], total: 1 } })
    );
    render(<RedshiftServerlessDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("analytics")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Tags$/i }));
    const tagDlg = screen
      .getAllByText("Tags — analytics")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    const inputs = tagDlg.querySelectorAll("input");
    await user.type(inputs[0] as HTMLElement, "team");
    await user.type(inputs[1] as HTMLElement, "core");
    const addBtn = Array.from(tagDlg.querySelectorAll("button")).find(
      (b) => b.textContent === "Add tag"
    ) as HTMLElement;
    await user.click(addBtn);
    await waitFor(() => expect(screen.getByText("Failed to add tag")).toBeTruthy());
    fireEvent.click(tagDlg.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() => expect(screen.queryByText("Failed to add tag")).toBeNull());
  });

  it("renders empty tags when tag data is undefined", async () => {
    const user = userEvent.setup();
    mockHooks.useServerlessNamespaces.mockReturnValue(
      listQuery({ data: { namespaces: [NS], total: 1 } })
    );
    mockHooks.useServerlessNamespaceTags.mockReturnValue({
      data: undefined,
      isLoading: false,
    });
    render(<RedshiftServerlessDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("analytics")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Tags$/i }));
    await waitFor(() => expect(screen.getByText("Tags — analytics")).toBeTruthy());
    await waitFor(() => expect(screen.getByText("No tags found")).toBeTruthy());
  });

  it("closes the tags modal", async () => {
    const user = userEvent.setup();
    mockHooks.useServerlessNamespaces.mockReturnValue(
      listQuery({ data: { namespaces: [NS], total: 1 } })
    );
    render(<RedshiftServerlessDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("analytics")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Tags$/i }));
    await waitFor(() => expect(screen.getByText("Tags — analytics")).toBeTruthy());
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(screen.queryByText("Tags — analytics")).toBeNull());
  });
});
