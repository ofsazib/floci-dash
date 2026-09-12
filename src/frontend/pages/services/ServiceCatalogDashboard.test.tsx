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

const mockPortfolios = vi.fn();
const mockProducts = vi.fn();
const mockProvisioned = vi.fn();
const mockTagOptions = vi.fn();
const mockConstraints = vi.fn();
const mockCreatePortfolio = vi.fn(() => Promise.resolve({}));
const mockDeletePortfolio = vi.fn(() => Promise.resolve({}));
const mockCreateProduct = vi.fn(() => Promise.resolve({}));
const mockDeleteProduct = vi.fn(() => Promise.resolve({}));
const mockProvision = vi.fn(() => Promise.resolve({}));
const mockTerminate = vi.fn(() => Promise.resolve({}));
const mockCreateTagOption = vi.fn(() => Promise.resolve({}));
const mockDeleteTagOption = vi.fn(() => Promise.resolve({}));
const mockCreateConstraint = vi.fn(() => Promise.resolve({}));
const mockDeleteConstraint = vi.fn(() => Promise.resolve({}));
const mockArtifacts = vi.fn();
const mockShowToast = vi.fn();

vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

vi.mock("../../hooks/useServiceCatalog", () => ({
  useScPortfolios: (...args: any[]) => mockPortfolios(...args),
  useScCreatePortfolio: () => ({ mutateAsync: mockCreatePortfolio, isPending: false }),
  useScDeletePortfolio: () => ({ mutateAsync: mockDeletePortfolio, isPending: false }),
  useScProducts: (...args: any[]) => mockProducts(...args),
  useScCreateProduct: () => ({ mutateAsync: mockCreateProduct, isPending: false }),
  useScDeleteProduct: () => ({ mutateAsync: mockDeleteProduct, isPending: false }),
  useScArtifacts: (...args: any[]) => mockArtifacts(...args),
  useScProvisioned: (...args: any[]) => mockProvisioned(...args),
  useScProvision: () => ({ mutateAsync: mockProvision, isPending: false }),
  useScTerminateProvisioned: () => ({ mutateAsync: mockTerminate, isPending: false }),
  useScTagOptions: (...args: any[]) => mockTagOptions(...args),
  useScCreateTagOption: () => ({ mutateAsync: mockCreateTagOption, isPending: false }),
  useScDeleteTagOption: () => ({ mutateAsync: mockDeleteTagOption, isPending: false }),
  useScConstraints: (...args: any[]) => mockConstraints(...args),
  useScCreateConstraint: () => ({ mutateAsync: mockCreateConstraint, isPending: false }),
  useScDeleteConstraint: () => ({ mutateAsync: mockDeleteConstraint, isPending: false }),
}));

import { default as ServiceCatalogDashboard } from "./ServiceCatalogDashboard";

const portfolio = { id: "port-1", displayName: "Dev", providerName: "it", description: null, createdTime: null };
const product = { id: "prod-1", name: "n", owner: "o", type: null, status: "AVAILABLE" };
const provisioned = { id: "pp-1", name: "stack", status: "AVAILABLE", type: "CFN_STACK" };

function setupAll() {
  mockPortfolios.mockReturnValue({ data: { portfolios: [portfolio, {}], total: 2 }, isLoading: false });
  mockProducts.mockReturnValue({ data: { products: [product, {}], total: 2 }, isLoading: false });
  mockProvisioned.mockReturnValue({ data: { provisionedProducts: [provisioned, {}], total: 2 }, isLoading: false });
  mockTagOptions.mockReturnValue({
    data: { tagOptions: [{ id: "to-1", key: "env", value: "dev", active: true }] },
    isLoading: false,
  });
  mockConstraints.mockReturnValue({ data: { constraints: [] } });
  mockConstraints.mockReturnValue({
    data: { constraints: [{}, { ConstraintId: "c-x", Type: "LAUNCH", ProductId: "p" }] },
  });
  mockArtifacts.mockReturnValue({ data: undefined });
}

beforeEach(() => {
  vi.clearAllMocks();
  setupAll();
});

async function clickTab(user: any, name: string) {
  await user.click(await screen.findByRole("tab", { name }));
}

describe("ServiceCatalogDashboard — Portfolios tab", () => {
  it("lists portfolios", async () => {
    render(<ServiceCatalogDashboard />, { wrapper: createWrapper() });
    expect(await screen.findByText("Dev")).toBeTruthy();
    expect(screen.getByText("it")).toBeTruthy();
  });

  it("creates a portfolio", async () => {
    const user = userEvent.setup();
    render(<ServiceCatalogDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create portfolio" }));
    expect((screen.getByRole("button", { name: "Create" }) as HTMLButtonElement).disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("dev-portfolio"), "test");
    await user.type(screen.getByPlaceholderText("it-dept"), "qa");
    await clickInDialog(user, "Create");
    await waitFor(() =>
      expect(mockCreatePortfolio).toHaveBeenCalledWith({ displayName: "test", providerName: "qa" }),
    );
    await new Promise((r) => setTimeout(r, 300));
    console.log("TOASTS:", JSON.stringify(mockShowToast.mock.calls));
    console.log("CREATE_ERR:", JSON.stringify(mockCreatePortfolio.mock.results));
  });

  it("dismisses the portfolio create modal via Cancel and Escape", async () => {
    const user = userEvent.setup();
    render(<ServiceCatalogDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create portfolio" }));
    await clickInDialog(user, "Cancel");
    await user.click(screen.getByRole("button", { name: "Create portfolio" }));
    await waitFor(() => expect(openDialog()).toBeTruthy());
    fireEvent.keyDown(openDialog(), { keyCode: 27, key: "Escape" });
    expect(mockCreatePortfolio).not.toHaveBeenCalled();
  });

  it("shows generic create error toast", async () => {
    mockCreatePortfolio.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ServiceCatalogDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create portfolio" }));
    await user.type(screen.getByPlaceholderText("dev-portfolio"), "test");
    await user.type(screen.getByPlaceholderText("it-dept"), "qa");
    await clickInDialog(user, "Create");
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to create portfolio"));
  });

  it("deletes a portfolio (generic error then success)", async () => {
    mockDeletePortfolio.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ServiceCatalogDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Delete Dev" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete portfolio"));
    await user.click(await screen.findByRole("button", { name: "Delete Dev" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockDeletePortfolio).toHaveBeenCalledWith("port-1"));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "Portfolio deleted"));
  });
});

describe("ServiceCatalogDashboard — Products tab", () => {
  it("lists products and provisions one", async () => {
    mockArtifacts.mockReturnValue({
      data: { artifacts: [{ id: "pa-1", name: "v1", active: true, type: null }] },
    });
    const user = userEvent.setup();
    render(<ServiceCatalogDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Products");
    expect(await screen.findByText("n")).toBeTruthy();
    await user.click(await screen.findByRole("button", { name: "Provision prod-1" }));
    await user.click(screen.getByRole("button", { name: "Load artifacts" }));
    await user.type(screen.getByPlaceholderText("my-stack"), "stack1");
    await clickInDialog(user, "Provision");
    await waitFor(() =>
      expect(mockProvision).toHaveBeenCalledWith({
        provisionedName: "stack1", productId: "prod-1", artifactId: "pa-1",
      }),
    );
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "Provisioning started"));
  });

  it("shows generic provision error toast", async () => {
    mockProvision.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ServiceCatalogDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Products");
    await user.click(await screen.findByRole("button", { name: "Provision prod-1" }));
    await user.type(screen.getByPlaceholderText("my-stack"), "s");
    await user.type(screen.getByPlaceholderText("pa-xxxx"), "pa");
    await clickInDialog(user, "Provision");
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to provision product"));
  });

  it("creates a product", async () => {
    const user = userEvent.setup();
    render(<ServiceCatalogDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Products");
    await user.click(screen.getByRole("button", { name: "Create product" }));
    expect((screen.getByRole("button", { name: "Create" }) as HTMLButtonElement).disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("my-product"), "p2");
    await user.type(screen.getByPlaceholderText("platform-team"), "team");
    await clickInDialog(user, "Create");
    await waitFor(() => expect(mockCreateProduct).toHaveBeenCalledWith({ name: "p2", owner: "team" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "Product created"));
  });

  it("shows create error toast and cancels the product modal", async () => {
    mockCreateProduct.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ServiceCatalogDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Products");
    await user.click(screen.getByRole("button", { name: "Create product" }));
    await user.type(screen.getByPlaceholderText("my-product"), "p2");
    await user.type(screen.getByPlaceholderText("platform-team"), "team");
    await clickInDialog(user, "Create");
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to create product"));
    await user.click(screen.getByRole("button", { name: "Create product" }));
    await clickInDialog(user, "Cancel");
    await user.click(screen.getByRole("button", { name: "Create product" }));
    fireEvent.keyDown(openDialog(), { keyCode: 27, key: "Escape" });
    expect(mockDeleteProduct).not.toHaveBeenCalled();
  });

  it("cancels the provision modal via Cancel and Escape", async () => {
    const user = userEvent.setup();
    render(<ServiceCatalogDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Products");
    await user.click(await screen.findByRole("button", { name: "Provision prod-1" }));
    await clickInDialog(user, "Cancel");
    await user.click(await screen.findByRole("button", { name: "Provision prod-1" }));
    fireEvent.keyDown(openDialog(), { keyCode: 27, key: "Escape" });
    expect(mockProvision).not.toHaveBeenCalled();
  });

  it("deletes a product (generic error then success)", async () => {
    mockDeleteProduct.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ServiceCatalogDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Products");
    await user.click(await screen.findByRole("button", { name: "Delete n" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete product"));
    await user.click(await screen.findByRole("button", { name: "Delete n" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockDeleteProduct).toHaveBeenCalledWith("prod-1"));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "Product deleted"));
  });
});

describe("ServiceCatalogDashboard — Provisioned tab", () => {
  it("lists provisioned products and terminates one", async () => {
    mockTerminate.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ServiceCatalogDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Provisioned products");
    expect(await screen.findByText("stack")).toBeTruthy();
    expect(screen.getByText("AVAILABLE")).toBeTruthy();
    await user.click(await screen.findByRole("button", { name: "Terminate pp-1" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to terminate provisioned product"));
    await user.click(await screen.findByRole("button", { name: "Terminate pp-1" }));
    await waitFor(() => expect(mockTerminate).toHaveBeenCalledWith("pp-1"));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "Termination started"));
  });
});

describe("ServiceCatalogDashboard — Tag options tab", () => {
  it("creates a tag option", async () => {
    const user = userEvent.setup();
    render(<ServiceCatalogDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Tag options & constraints");
    expect(await screen.findByText("env")).toBeTruthy();
    await user.type(screen.getByLabelText("Tag option key"), "team");
    await user.type(screen.getByLabelText("Tag option value"), "core");
    await user.click(screen.getByRole("button", { name: "Create tag option" }));
    await waitFor(() => expect(mockCreateTagOption).toHaveBeenCalledWith({ key: "team", value: "core" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "Tag option created"));
  });

  it("shows create error toast for tag options and renders constraints", async () => {
    mockCreateTagOption.mockRejectedValueOnce("boom");
    mockConstraints.mockReturnValue({
      data: {
        constraints: [
          { id: "c-1", type: "LAUNCH", description: null, portfolioId: "port-1", productId: "prod-1" },
        ],
      },
    });
    const user = userEvent.setup();
    render(<ServiceCatalogDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Tag options & constraints");
    await user.type(screen.getByLabelText("Tag option key"), "team");
    await user.type(screen.getByLabelText("Tag option value"), "core");
    await user.click(screen.getByRole("button", { name: "Create tag option" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to create tag option"));
    await user.click(screen.getByRole("button", { name: "Show constraints" }));
    await user.type(screen.getByPlaceholderText("port-xxxx"), "port-1");
    expect(await screen.findByText("c-1")).toBeTruthy();
    expect(screen.getAllByText("LAUNCH").length).toBeGreaterThan(0);
    await user.click(await screen.findByRole("button", { name: "Delete c-1" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockDeleteConstraint).toHaveBeenCalledWith("c-1"));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Constraint deleted");
  });

  it("renders em-dashes for sparse tag rows and handles undefined constraints", async () => {
    mockConstraints.mockReturnValue({ data: undefined });
    const user = userEvent.setup();
    render(<ServiceCatalogDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Tag options & constraints");
    expect(await screen.findByText("env")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Show constraints" })).toBeTruthy();
  });

  it("covers sparse rows and undefined data across tabs", async () => {
    mockPortfolios.mockReturnValue({ data: undefined, isLoading: false });
    mockProducts.mockReturnValue({ data: undefined, isLoading: false });
    mockProvisioned.mockReturnValue({ data: undefined, isLoading: false });
    mockTagOptions.mockReturnValue({ data: undefined, isLoading: false });
    mockArtifacts.mockReturnValue({ data: undefined });
    const user = userEvent.setup();
    render(<ServiceCatalogDashboard />, { wrapper: createWrapper() });
    expect(await screen.findByRole("button", { name: "Create portfolio" })).toBeTruthy();
    await user.click(await screen.findByRole("tab", { name: "Products" }));
    expect(await screen.findByRole("button", { name: "Create product" })).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "Provisioned products" }));
    await user.click(screen.getByRole("tab", { name: "Tag options & constraints" }));
    await user.click(screen.getByRole("button", { name: "Show constraints" }));
    expect(screen.getByRole("button", { name: "Hide constraints" })).toBeTruthy();
  });

  it("shows constraint create error toast", async () => {
    mockCreateConstraint.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ServiceCatalogDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Tag options & constraints");
    await user.click(screen.getByRole("button", { name: "Show constraints" }));
    await user.type(screen.getByPlaceholderText("port-xxxx"), "port-1");
    await user.type(screen.getByPlaceholderText("prod-xxxx"), "prod-1");
    fireEvent.change(screen.getByLabelText("Parameters (JSON)"), { target: { value: "{}" } });
    await user.click(screen.getByRole("button", { name: "LAUNCH" }));
    expect(screen.getByRole("button", { name: "STACKSET" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "STACKSET" }));
    fireEvent.change(screen.getByLabelText("Parameters (JSON)"), { target: { value: "{}" } });
    await user.click(screen.getByRole("button", { name: "Create constraint" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to create constraint"));
  });

  it("shows error toast when constraint delete fails", async () => {
    mockDeleteConstraint.mockRejectedValueOnce("boom");
    mockConstraints.mockReturnValue({
      data: {
        constraints: [
          { id: "c-9", type: "LAUNCH", description: null, portfolioId: "port-1", productId: "prod-1" },
        ],
      },
    });
    const user = userEvent.setup();
    render(<ServiceCatalogDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Tag options & constraints");
    await user.click(screen.getByRole("button", { name: "Show constraints" }));
    await user.click(await screen.findByRole("button", { name: "Delete c-9" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete constraint"),
    );
  });

  it("shows generic delete error toast for tag options", async () => {
    mockDeleteTagOption.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<ServiceCatalogDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Tag options & constraints");
    await user.click(await screen.findByRole("button", { name: "Delete to-1" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete tag option"),
    );
  });

  it("deletes a tag option successfully", async () => {
    const user = userEvent.setup();
    render(<ServiceCatalogDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Tag options & constraints");
    await user.click(await screen.findByRole("button", { name: "Delete to-1" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockDeleteTagOption).toHaveBeenCalledWith("to-1"));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "Tag option deleted"));
  });

});
