// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

function openDialog(): HTMLElement {
  const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[class*="awsui_dialog"]'));
  const open = dialogs.filter((d) => !d.closest('[class*="awsui_hidden"]'));
  if (!open.length) throw new Error("No open dialog");
  return open[open.length - 1];
}

async function clickInDialog(user: any, name: string) {
  await user.click(
    Array.from(openDialog().querySelectorAll("button")).find((b) => b.textContent?.trim() === name)!
  );
}

function textareaInDialog(): HTMLTextAreaElement {
  return Array.from(openDialog().querySelectorAll("textarea"))[0] as HTMLTextAreaElement;
}

function dismissWithEscape() {
  fireEvent.keyDown(openDialog(), { keyCode: 27, key: "Escape" });
}

const mockIndexes = vi.fn();
const mockIndexDetail = vi.fn();
const mockServiceConfig = vi.fn();
const mockViews = vi.fn();
const mockViewDetail = vi.fn();
const mockDefaultView = vi.fn();
const mockResourceTypes = vi.fn();
const mockCreateIndex = vi.fn(() => Promise.resolve({}));
const mockDeleteIndex = vi.fn(() => Promise.resolve({}));
const mockSwitchType = vi.fn(() => Promise.resolve({}));
const mockCreateView = vi.fn(() => Promise.resolve({}));
const mockUpdateView = vi.fn(() => Promise.resolve({}));
const mockDeleteView = vi.fn(() => Promise.resolve({}));
const mockAssociate = vi.fn(() => Promise.resolve({}));
const mockDisassociate = vi.fn(() => Promise.resolve({}));
const mockSearch = vi.fn((): any => Promise.resolve({ resources: [], total: 0 }));
const mockShowToast = vi.fn();

vi.mock("../../hooks/useResourceExplorer2", () => ({
  useRe2Indexes: (...args: any[]) => mockIndexes(...args),
  useRe2IndexDetail: (...args: any[]) => mockIndexDetail(...args),
  useRe2CreateIndex: () => ({ mutateAsync: mockCreateIndex, isPending: false }),
  useRe2DeleteIndex: () => ({ mutateAsync: mockDeleteIndex, isPending: false }),
  useRe2UpdateIndexType: () => ({ mutateAsync: mockSwitchType, isPending: false }),
  useRe2ServiceConfig: (...args: any[]) => mockServiceConfig(...args),
  useRe2Views: (...args: any[]) => mockViews(...args),
  useRe2ViewDetail: (...args: any[]) => mockViewDetail(...args),
  useRe2CreateView: () => ({ mutateAsync: mockCreateView, isPending: false }),
  useRe2UpdateView: () => ({ mutateAsync: mockUpdateView, isPending: false }),
  useRe2DeleteView: () => ({ mutateAsync: mockDeleteView, isPending: false }),
  useRe2DefaultView: (...args: any[]) => mockDefaultView(...args),
  useRe2AssociateDefaultView: () => ({ mutateAsync: mockAssociate, isPending: false }),
  useRe2DisassociateDefaultView: () => ({ mutateAsync: mockDisassociate, isPending: false }),
  useRe2Search: () => ({ mutateAsync: mockSearch, isPending: false }),
  useRe2ResourceTypes: (...args: any[]) => mockResourceTypes(...args),
}));

vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

import { default as ResourceExplorer2Dashboard } from "./ResourceExplorer2Dashboard";

const INDEX_ARN = "arn:aws:resource-explorer-2:us-east-1:1:index/1";
const AGG_ARN = "arn:aws:resource-explorer-2:us-west-2:1:index/2";
const VIEW_ARN = "arn:aws:resource-explorer-2:us-east-1:1:view/v";

function setupAll() {
  mockIndexes.mockReturnValue({
    data: {
      indexes: [
        { arn: INDEX_ARN, region: "us-east-1", type: "LOCAL" },
        { arn: AGG_ARN, region: "us-west-2", type: "AGGREGATOR" },
        {},
      ],
      total: 3,
    },
    isLoading: false,
  });
  mockIndexDetail.mockReturnValue({ data: { index: { Arn: INDEX_ARN, State: "ACTIVE" } } });
  mockServiceConfig.mockReturnValue({
    data: { OrgConfiguration: { AWSServiceAccessStatus: "ENABLED" } },
  });
  mockViews.mockReturnValue({ data: { views: [{ arn: VIEW_ARN }, {}], total: 2 }, isLoading: false });
  mockViewDetail.mockReturnValue({ data: undefined });
  mockDefaultView.mockReturnValue({ data: { viewArn: VIEW_ARN } });
  mockResourceTypes.mockReturnValue({
    data: { types: [{ resourceType: "s3:bucket", service: "s3" }, {}], total: 2 },
    isLoading: false,
  });
}

async function clickTab(user: any, name: string) {
  await user.click(await screen.findByRole("tab", { name }));
}

beforeEach(() => {
  vi.clearAllMocks();
  setupAll();
});

describe("ResourceExplorer2Dashboard — Indexes tab", () => {
  it("lists indexes with config and state cards", async () => {
    render(<ResourceExplorer2Dashboard />, { wrapper: createWrapper() });
    expect(await screen.findByText(INDEX_ARN)).toBeTruthy();
    expect(screen.getByText(AGG_ARN)).toBeTruthy();
    expect(screen.getByText("Account-level service access: ENABLED")).toBeTruthy();
    expect(screen.getByText("Region index state: ACTIVE")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: `Switch type ${INDEX_ARN}` }).textContent,
    ).toBe("Switch to AGGREGATOR");
    expect(
      screen.getByRole("button", { name: `Switch type ${AGG_ARN}` }).textContent,
    ).toBe("Switch to LOCAL");
  });

  it("creates an index without tags", async () => {
    const user = userEvent.setup();
    render(<ResourceExplorer2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create index" }));
    await clickInDialog(user, "Create");
    await waitFor(() => expect(mockCreateIndex).toHaveBeenCalledWith({ tags: undefined }));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Index created");
  });

  it("creates an index with tags JSON", async () => {
    const user = userEvent.setup();
    render(<ResourceExplorer2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create index" }));
    fireEvent.change(textareaInDialog(), { target: { value: '{"env":"dev"}' } });
    await clickInDialog(user, "Create");
    await waitFor(() => expect(mockCreateIndex).toHaveBeenCalledWith({ tags: '{"env":"dev"}' }));
  });

  it("shows create error toasts (message and generic)", async () => {
    mockCreateIndex.mockRejectedValueOnce(new Error("exists"));
    const user = userEvent.setup();
    render(<ResourceExplorer2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create index" }));
    await clickInDialog(user, "Create");
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "exists"));
    mockCreateIndex.mockRejectedValueOnce("boom");
    await user.click(screen.getByRole("button", { name: "Create index" }));
    await clickInDialog(user, "Create");
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to create index"),
    );
  });

  it("switches index types both directions", async () => {
    const user = userEvent.setup();
    render(<ResourceExplorer2Dashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: `Switch type ${INDEX_ARN}` }));
    await waitFor(() =>
      expect(mockSwitchType).toHaveBeenCalledWith({ arn: INDEX_ARN, type: "AGGREGATOR" }),
    );
    await user.click(await screen.findByRole("button", { name: `Switch type ${AGG_ARN}` }));
    await waitFor(() => expect(mockSwitchType).toHaveBeenCalledWith({ arn: AGG_ARN, type: "LOCAL" }));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Index switched to AGGREGATOR");
    expect(mockShowToast).toHaveBeenCalledWith("success", "Index switched to LOCAL");
  });

  it("shows generic switch error toast", async () => {
    mockSwitchType.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ResourceExplorer2Dashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: `Switch type ${INDEX_ARN}` }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to update index type"),
    );
  });

  it("deletes an index (generic error then success)", async () => {
    mockDeleteIndex.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ResourceExplorer2Dashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: `Delete ${INDEX_ARN}` }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete index"));
    await user.click(await screen.findByRole("button", { name: `Delete ${INDEX_ARN}` }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockDeleteIndex).toHaveBeenCalledWith(INDEX_ARN));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Index deleted");
  });

  it("dismisses the create modal via Cancel and Escape", async () => {
    const user = userEvent.setup();
    render(<ResourceExplorer2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create index" }));
    fireEvent.change(textareaInDialog(), { target: { value: "{}" } });
    await clickInDialog(user, "Cancel");
    await user.click(screen.getByRole("button", { name: "Create index" }));
    await waitFor(() => expect(openDialog()).toBeTruthy());
    dismissWithEscape();
    expect(mockCreateIndex).not.toHaveBeenCalled();
  });
});

describe("ResourceExplorer2Dashboard — Views tab", () => {
  it("lists views and the default view", async () => {
    const user = userEvent.setup();
    render(<ResourceExplorer2Dashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Views");
    expect(await screen.findByText(VIEW_ARN)).toBeTruthy();
    expect(screen.getByText(`Default view: ${VIEW_ARN}`)).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Disassociate default" }) as HTMLButtonElement).disabled,
    ).toBe(false);
  });

  it("shows no default view and disables disassociate", async () => {
    mockDefaultView.mockReturnValue({ data: { viewArn: null } });
    const user = userEvent.setup();
    render(<ResourceExplorer2Dashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Views");
    expect(await screen.findByText("Default view: none")).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Disassociate default" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("creates a view with optional fields", async () => {
    const user = userEvent.setup();
    render(<ResourceExplorer2Dashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Views");
    await user.click(screen.getByRole("button", { name: "Create view" }));
    expect((screen.getByRole("button", { name: "Create" }) as HTMLButtonElement).disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("my-view"), "v");
    await user.type(screen.getByPlaceholderText("service eq s3"), "service eq s3");
    await user.type(screen.getByPlaceholderText("tags"), "tags");
    await user.type(screen.getByLabelText("Scope ARN (optional)"), "arn:scope");
    await clickInDialog(user, "Create");
    await waitFor(() =>
      expect(mockCreateView).toHaveBeenCalledWith({
        viewName: "v",
        filters: "service eq s3",
        includedProperties: "tags",
        scope: "arn:scope",
      }),
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "View created");
  });

  it("shows generic create error toast", async () => {
    mockCreateView.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ResourceExplorer2Dashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Views");
    await user.click(screen.getByRole("button", { name: "Create view" }));
    await user.type(screen.getByPlaceholderText("my-view"), "v");
    await clickInDialog(user, "Create");
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to create view"));
  });

  it("updates a view and shows its current definition", async () => {
    mockViewDetail.mockReturnValue({
      data: { view: { ViewArn: VIEW_ARN, Filters: null }, tags: {} },
    });
    const user = userEvent.setup();
    render(<ResourceExplorer2Dashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Views");
    await user.click(await screen.findByRole("button", { name: `Update ${VIEW_ARN}` }));
    expect(await screen.findByText("Current definition")).toBeTruthy();
    const dialog = openDialog();
    const inputs = Array.from(dialog.querySelectorAll("input"));
    await user.type(inputs[0], "service eq ec2");
    await user.type(inputs[1], "tags");
    await clickInDialog(user, "Save");
    await waitFor(() =>
      expect(mockUpdateView).toHaveBeenCalledWith({
        viewArn: VIEW_ARN,
        filters: "service eq ec2",
        includedProperties: "tags",
      }),
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "View updated");
  });

  it("hides current definition when detail is absent", async () => {
    const user = userEvent.setup();
    render(<ResourceExplorer2Dashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Views");
    await user.click(await screen.findByRole("button", { name: `Update ${VIEW_ARN}` }));
    await waitFor(() => expect(screen.queryByText("Current definition")).toBeNull());
    await clickInDialog(user, "Cancel");
    expect(mockUpdateView).not.toHaveBeenCalled();
  });

  it("shows generic update error toast", async () => {
    mockUpdateView.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ResourceExplorer2Dashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Views");
    await user.click(await screen.findByRole("button", { name: `Update ${VIEW_ARN}` }));
    await clickInDialog(user, "Save");
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to update view"));
  });

  it("associates a view as default (success and generic error)", async () => {
    mockAssociate.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ResourceExplorer2Dashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Views");
    await user.click(await screen.findByRole("button", { name: `Make default ${VIEW_ARN}` }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to associate default view"),
    );
    await user.click(await screen.findByRole("button", { name: `Make default ${VIEW_ARN}` }));
    await waitFor(() => expect(mockAssociate).toHaveBeenCalledWith(VIEW_ARN));
    expect(mockShowToast).toHaveBeenCalledWith("success", "View associated as default");
  });

  it("disassociates the default view (generic error then success)", async () => {
    mockDisassociate.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ResourceExplorer2Dashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Views");
    await user.click(screen.getByRole("button", { name: "Disassociate default" }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to disassociate default view"),
    );
    await user.click(screen.getByRole("button", { name: "Disassociate default" }));
    await waitFor(() => expect(mockDisassociate).toHaveBeenCalled());
    expect(mockShowToast).toHaveBeenCalledWith("success", "Default view disassociated");
  });

  it("deletes a view (generic error then success)", async () => {
    mockDeleteView.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ResourceExplorer2Dashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Views");
    await user.click(await screen.findByRole("button", { name: `Delete ${VIEW_ARN}` }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete view"));
    await user.click(await screen.findByRole("button", { name: `Delete ${VIEW_ARN}` }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockDeleteView).toHaveBeenCalledWith(VIEW_ARN));
    expect(mockShowToast).toHaveBeenCalledWith("success", "View deleted");
  });

  it("dismisses the create and update modals via Cancel and Escape", async () => {
    const user = userEvent.setup();
    render(<ResourceExplorer2Dashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Views");
    await user.click(screen.getByRole("button", { name: "Create view" }));
    await clickInDialog(user, "Cancel");
    await user.click(screen.getByRole("button", { name: "Create view" }));
    await waitFor(() => expect(openDialog()).toBeTruthy());
    dismissWithEscape();
    await user.click(await screen.findByRole("button", { name: `Update ${VIEW_ARN}` }));
    await clickInDialog(user, "Cancel");
    await user.click(await screen.findByRole("button", { name: `Update ${VIEW_ARN}` }));
    dismissWithEscape();
    expect(mockCreateView).not.toHaveBeenCalled();
    expect(mockUpdateView).not.toHaveBeenCalled();
  });
});

describe("ResourceExplorer2Dashboard — Search tab", () => {
  it("shows the empty hint before searching", async () => {
    const user = userEvent.setup();
    render(<ResourceExplorer2Dashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Search");
    expect((screen.getByRole("button", { name: "Search" }) as HTMLButtonElement).disabled).toBe(true);
    expect(await screen.findByText("Enter a query to search indexed resources.")).toBeTruthy();
    expect(screen.getByText("s3:bucket")).toBeTruthy();
  });

  it("runs a search and renders results", async () => {
    mockSearch.mockResolvedValueOnce({
      resources: [
        { arn: "arn:aws:s3:::b", resourceType: "s3:bucket", region: "us-east-1", service: "s3" },
        {},
      ],
      total: 2,
    });
    const user = userEvent.setup();
    render(<ResourceExplorer2Dashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Search");
    await user.type(screen.getByPlaceholderText("service:s3"), "service:s3");
    await user.type(screen.getAllByRole("textbox")[1], VIEW_ARN);
    await user.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() =>
      expect(mockSearch).toHaveBeenCalledWith({ queryString: "service:s3", viewArn: VIEW_ARN }),
    );
    expect(await screen.findByText("arn:aws:s3:::b")).toBeTruthy();
  });

  it("renders an empty results table when the search fails", async () => {
    mockSearch.mockRejectedValueOnce(new Error("no index"));
    const user = userEvent.setup();
    render(<ResourceExplorer2Dashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Search");
    await user.type(screen.getByPlaceholderText("service:s3"), "x");
    await user.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() => expect(mockSearch).toHaveBeenCalled());
    expect(screen.queryByText("Enter a query to search indexed resources.")).toBeNull();
  });
});

describe("ResourceExplorer2Dashboard — fallback rendering", () => {
  it("renders create button when hooks return undefined data", async () => {
    mockIndexes.mockReturnValue({ data: undefined, isLoading: false });
    mockIndexDetail.mockReturnValue({ data: undefined });
    mockServiceConfig.mockReturnValue({ data: undefined });
    mockViews.mockReturnValue({ data: undefined, isLoading: false });
    mockDefaultView.mockReturnValue({ data: undefined });
    mockResourceTypes.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<ResourceExplorer2Dashboard />, { wrapper: createWrapper() });
    expect(await screen.findByRole("button", { name: "Create index" })).toBeTruthy();
    expect(screen.getByText("Account-level service access: —")).toBeTruthy();
    expect(screen.getByText("Region index state: —")).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "Views" }));
    expect(screen.getByText("Default view: none")).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "Search" }));
    expect(screen.queryByText("s3:bucket")).toBeNull();
  });
});
