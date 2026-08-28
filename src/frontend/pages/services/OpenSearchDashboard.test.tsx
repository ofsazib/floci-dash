// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── vi.hoisted states ─────────────────────────────────

const deleteDomainState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

// ─── Mock hooks ─────────────────────────────────────────

const mockDomains = vi.fn();
const mockVersions = vi.fn();
const mockUpdateConfig = vi.fn();
const mockUpgrade = vi.fn();
const updateConfigState = vi.hoisted(() => ({ isError: false, error: null as Error | null }));
const upgradeState = vi.hoisted(() => ({ isError: false, error: null as Error | null }));
const mockDeleteDomain = vi.fn();
const mockCreateDomain = vi.fn();
const createDomainState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const mockDomainDetail = vi.fn();
const mockDomainTags = vi.fn();
const mockAddTag = vi.fn();
const mockRemoveTag = vi.fn();
const mockDomainConfig = vi.fn();

vi.mock("../../hooks/useOpenSearch", () => ({
  useOpenSearchDomains: (...args: any[]) => mockDomains(...args),
  useOpenSearchDomain: (...args: any[]) => mockDomainDetail(...args),
  useCreateOpenSearchDomain: () => ({
    mutate: mockCreateDomain,
    get isPending() { return createDomainState.isPending; },
    get isError() { return createDomainState.isError; },
    get error() { return createDomainState.error; },
  }),
  useDeleteOpenSearchDomain: () => ({
    mutateAsync: mockDeleteDomain,
    get isPending() { return deleteDomainState.isPending; },
    get variables() { return deleteDomainState.variables; },
  }),
  useUpdateOpenSearchDomainConfig: () => ({
    mutate: mockUpdateConfig,
    isPending: false,
    get isError() { return updateConfigState.isError; },
    get error() { return updateConfigState.error; },
  }),
  useUpgradeOpenSearchDomain: () => ({
    mutate: mockUpgrade,
    isPending: false,
    get isError() { return upgradeState.isError; },
    get error() { return upgradeState.error; },
  }),
  useOpenSearchVersions: (...args: any[]) => mockVersions(...args),
  useOpenSearchDomainTags: (...args: any[]) => mockDomainTags(...args),
  useAddOpenSearchDomainTags: () => ({
    mutate: mockAddTag,
    isPending: false,
  }),
  useRemoveOpenSearchDomainTags: () => ({
    mutate: mockRemoveTag,
    isPending: false,
  }),
  useOpenSearchDomainConfig: (...args: any[]) => mockDomainConfig(...args),
}));

import { OpenSearchDashboard } from "./OpenSearchDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  mockVersions.mockReturnValue({
    data: { versions: ["OpenSearch_3.6", "OpenSearch_2.19", "OpenSearch_2.11", "Elasticsearch_7.10"], total: 4 },
    isLoading: false,
  });
  updateConfigState.isError = false;
  updateConfigState.error = null;
  upgradeState.isError = false;
  upgradeState.error = null;
  createDomainState.isPending = false;
  createDomainState.isError = false;
  createDomainState.error = null;
  vi.clearAllMocks();
  deleteDomainState.isPending = false;
  deleteDomainState.variables = null;
  mockDomains.mockReturnValue({ data: { domains: [], total: 0 }, isLoading: false });
  mockDomainDetail.mockReturnValue({ data: { domain: { DomainName: "d1", ARN: "arn:os:d1", Endpoint: "search-d1.os.internal", EngineVersion: "OpenSearch_2.19", CreatedAt: 1700000000000, ClusterConfig: { InstanceType: "m5.large.search", InstanceCount: 1 }, EBSOptions: { EBSEnabled: true, VolumeType: "gp2", VolumeSize: 10 } } }, isLoading: false });
  mockDomainTags.mockReturnValue({ data: { tags: {} }, isLoading: false });
  mockDomainConfig.mockReturnValue({ data: { domainConfig: { AccessPolicies: {} } }, isLoading: false });
  mockAddTag.mockReset();
  mockRemoveTag.mockReset();
});

// ─── Tests ──────────────────────────────────────────────

describe("OpenSearchDashboard — rendering", () => {
  it("shows loading skeleton", () => {
    mockDomains.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty message", () => {
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No OpenSearch domains/i)).toBeTruthy();
  });

  it("renders domains with data", () => {
    mockDomains.mockReturnValue({
      data: { domains: [{ DomainName: "my-domain", EngineType: "OpenSearch" }], total: 1 },
      isLoading: false,
    });
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-domain")).toBeTruthy();
    expect(screen.getByText("OpenSearch")).toBeTruthy();
  });

  it("renders multiple domains", () => {
    mockDomains.mockReturnValue({
      data: {
        domains: [
          { DomainName: "prod-domain", EngineType: "Elasticsearch" },
          { DomainName: "dev-domain" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("prod-domain")).toBeTruthy();
    expect(screen.getByText("dev-domain")).toBeTruthy();
    // Second domain has no EngineType → defaults to "OpenSearch"
    expect(screen.getByText("Elasticsearch")).toBeTruthy();
  });

  it("shows OpenSearch fallback for missing engine type", () => {
    mockDomains.mockReturnValue({
      data: { domains: [{ DomainName: "no-engine" }], total: 1 },
      isLoading: false,
    });
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("no-engine")).toBeTruthy();
    // d.EngineType || "OpenSearch" → OpenSearch fallback
    expect(screen.getByText("OpenSearch")).toBeTruthy();
  });

  it("filters domains by name", async () => {
    mockDomains.mockReturnValue({
      data: {
        domains: [
          { DomainName: "alpha-domain" },
          { DomainName: "beta-domain" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-domain")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find domains");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-domain")).toBeNull());
  });

  it("shows header counter", () => {
    mockDomains.mockReturnValue({
      data: { domains: [{ DomainName: "d1" }, { DomainName: "d2" }], total: 2 },
      isLoading: false,
    });
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("(2)")).toBeTruthy();
  });
});

describe("OpenSearchDashboard — delete", () => {
  it("deletes a domain", async () => {
    mockDomains.mockReturnValue({
      data: { domains: [{ DomainName: "delete-me" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("delete-me")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete delete-me/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteDomain).toHaveBeenCalledWith("delete-me"));
  });

  it("shows delete domain loading state", () => {
    deleteDomainState.isPending = true;
    deleteDomainState.variables = "loading-domain";
    mockDomains.mockReturnValue({
      data: { domains: [{ DomainName: "loading-domain" }], total: 1 },
      isLoading: false,
    });
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("loading-domain")).toBeTruthy();
  });

  it("delete loading only affects matching domain", () => {
    deleteDomainState.isPending = true;
    deleteDomainState.variables = "domain-b";
    mockDomains.mockReturnValue({
      data: {
        domains: [
          { DomainName: "domain-a" },
          { DomainName: "domain-b" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("domain-a")).toBeTruthy();
    expect(screen.getByText("domain-b")).toBeTruthy();
  });

  it("shows the empty state when the domains key is absent", () => {
    mockDomains.mockReturnValue({ data: { total: 0 }, isLoading: false });
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No OpenSearch domains")).toBeTruthy();
  });
});

describe("OpenSearchDashboard — manage modal", () => {
  function setupDomain() {
    mockDomains.mockReturnValue({
      data: { domains: [{ DomainName: "d1", EngineType: "OpenSearch" }], total: 1 },
      isLoading: false,
    });
  }

  it("updates the domain config", async () => {
    mockUpdateConfig.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    setupDomain();
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Manage" }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.click(within(dialog).getByRole("tab", { name: /Update config/i }));
    const inputs = dialog.querySelectorAll("input");
    await user.type(inputs[0], "r6g.large.search");
    await user.type(inputs[1], "100");
    await user.click(within(dialog).getByRole("button", { name: /Update config/i }));
    await waitFor(() =>
      expect(mockUpdateConfig).toHaveBeenCalledWith(
        {
          domainName: "d1",
          clusterConfig: { InstanceType: "r6g.large.search" },
          ebsOptions: { VolumeSize: 100 },
        },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    );
  });

  it("runs an upgrade check", async () => {
    mockUpgrade.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    setupDomain();
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Manage" }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.click(within(dialog).getByRole("tab", { name: /Update config/i }));
    const inputs = dialog.querySelectorAll("input");
    // inputs are: instance type, volume size, upgrade target
    await user.type(inputs[2], "OpenSearch_2.11");
    await user.click(within(dialog).getByRole("button", { name: /Run upgrade check/i }));
    await waitFor(() =>
      expect(mockUpgrade).toHaveBeenCalledWith(
        { domainName: "d1", targetVersion: "OpenSearch_2.11", performCheckOnly: true },
        expect.anything()
      )
    );
  });

  it("keeps update disabled until a field is set and closes via Close", async () => {
    setupDomain();
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Manage" }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.click(within(dialog).getByRole("tab", { name: /Update config/i }));
    expect(within(dialog).getByRole("button", { name: /^Update config$/i }).hasAttribute("disabled")).toBe(true);
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(dialog.className).toContain("hidden"));
  });

  it("shows config + upgrade error alerts with fallbacks", async () => {
    updateConfigState.isError = true;
    updateConfigState.error = new Error("cfg failed");
    upgradeState.isError = true;
    upgradeState.error = null;
    setupDomain();
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Manage" }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.click(within(dialog).getByRole("tab", { name: /Update config/i }));
    expect(await within(dialog).findByText("cfg failed")).toBeTruthy();
    expect(within(dialog).getByText("Upgrade failed")).toBeTruthy();
  });
});

describe("OpenSearchDashboard — config-only + upgrade-only payloads", () => {
  it("updates with only instance type", async () => {
    mockUpdateConfig.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    mockDomains.mockReturnValue({
      data: { domains: [{ DomainName: "d1", EngineType: "OpenSearch" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Manage" }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.click(within(dialog).getByRole("tab", { name: /Update config/i }));
    const inputs = dialog.querySelectorAll("input");
    await user.type(inputs[0], "t3.small.search");
    await user.click(within(dialog).getByRole("button", { name: /^Update config$/i }));
    await waitFor(() =>
      expect(mockUpdateConfig).toHaveBeenCalledWith(
        { domainName: "d1", clusterConfig: { InstanceType: "t3.small.search" }, ebsOptions: undefined },
        expect.anything()
      )
    );
  });

  it("shows the generic config error fallback", async () => {
    updateConfigState.isError = true;
    updateConfigState.error = null;
    mockDomains.mockReturnValue({
      data: { domains: [{ DomainName: "d1", EngineType: "OpenSearch" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Manage" }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.click(within(dialog).getByRole("tab", { name: /Update config/i }));
    expect(await within(dialog).findByText("Failed to update config")).toBeTruthy();
  });

  it("updates with only volume size", async () => {
    mockUpdateConfig.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    mockDomains.mockReturnValue({
      data: { domains: [{ DomainName: "d1", EngineType: "OpenSearch" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Manage" }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.click(within(dialog).getByRole("tab", { name: /Update config/i }));
    const inputs = dialog.querySelectorAll("input");
    await user.type(inputs[1], "50");
    await user.click(within(dialog).getByRole("button", { name: /^Update config$/i }));
    await waitFor(() =>
      expect(mockUpdateConfig).toHaveBeenCalledWith(
        { domainName: "d1", clusterConfig: undefined, ebsOptions: { VolumeSize: 50 } },
        expect.anything()
      )
    );
  });
});

describe("OpenSearchDashboard — manage modal dismiss", () => {
  it("dismisses the manage modal with Escape", async () => {
    mockDomains.mockReturnValue({
      data: { domains: [{ DomainName: "d1", EngineType: "OpenSearch" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Manage" }));
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) =>
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27 })
    );
    expect(mockUpdateConfig).not.toHaveBeenCalled();
  });
});

describe("OpenSearchDashboard — domain detail & tags", () => {
  function setupDomain() {
    mockDomains.mockReturnValue({
      data: { domains: [{ DomainName: "d1", EngineType: "OpenSearch" }], total: 1 },
      isLoading: false,
    });
  }

  it("shows domain details in Overview tab", async () => {
    setupDomain();
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Manage" }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    expect(await within(dialog).findByText("search-d1.os.internal")).toBeTruthy();
    expect(within(dialog).getByText("arn:os:d1")).toBeTruthy();
    expect(within(dialog).getByText("OpenSearch_2.19")).toBeTruthy();
    expect(within(dialog).getByText("m5.large.search")).toBeTruthy();
    expect(within(dialog).getByText("gp2")).toBeTruthy();
  });

  it("adds a tag in the Tags tab", async () => {
    mockAddTag.mockImplementation((_p: any, opts: any) => opts?.onSuccess?.());
    setupDomain();
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Manage" }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.click(within(dialog).getByRole("tab", { name: /Tags/i }));
    const keyInput = screen.getByPlaceholderText("Key");
    const valInput = screen.getByPlaceholderText("Value");
    await user.type(keyInput, "env");
    await user.type(valInput, "prod");
    await user.click(within(dialog).getByRole("button", { name: /Add tag/i }));
    await waitFor(() =>
      expect(mockAddTag).toHaveBeenCalledWith(
        { domainName: "d1", arn: "arn:os:d1", tags: { env: "prod" } },
        expect.anything()
      )
    );
  });

  it("removes a tag", async () => {
    mockDomainTags.mockReturnValue({ data: { tags: { env: "prod" } }, isLoading: false });
    setupDomain();
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Manage" }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.click(within(dialog).getByRole("tab", { name: /Tags/i }));
    expect(await within(dialog).findByText("env")).toBeTruthy();
    expect(within(dialog).getByText("prod")).toBeTruthy();
    const removeBtn = within(dialog).getByRole("button", { name: /Remove env/i });
    await user.click(removeBtn);
    await waitFor(() =>
      expect(mockRemoveTag).toHaveBeenCalledWith({
        domainName: "d1",
        arn: "arn:os:d1",
        tagKeys: ["env"],
      })
    );
  });

  it("shows No tags when empty", async () => {
    setupDomain();
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Manage" }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.click(within(dialog).getByRole("tab", { name: /Tags/i }));
    expect(await within(dialog).findByText("No tags")).toBeTruthy();
  });

  it("shows domain config tab with access policy", async () => {
    setupDomain();
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Manage" }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.click(within(dialog).getByRole("tab", { name: /Domain config/i }));
    expect(await within(dialog).findByText("Access Policy")).toBeTruthy();
  });

  it("shows No config when config is undefined", async () => {
    mockDomainConfig.mockReturnValue({ data: undefined, isLoading: false });
    setupDomain();
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Manage" }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.click(within(dialog).getByRole("tab", { name: /Domain config/i }));
    expect(await within(dialog).findByText("No config available")).toBeTruthy();
  });

  it("shows loading state for domain detail", async () => {
    mockDomainDetail.mockReturnValue({ data: undefined, isLoading: true });
    setupDomain();
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Manage" }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    // Overview tab is default — when loading, shows tabs but no detail content
    expect(dialog.textContent).toContain("Overview");
    expect(dialog.textContent).toContain("Tags");
    // No Domain Details text when loading
    expect(dialog.textContent).not.toContain("Endpoint");
  });
});

it("shows dashes for sparse domain fields and defaults empty access policy", async () => {
    mockDomainDetail.mockReturnValue({
      data: { domain: { DomainName: "sparse" } },
      isLoading: false,
    });
    mockDomainConfig.mockReturnValue({ data: { domainConfig: {} }, isLoading: false });
    mockDomains.mockReturnValue({ data: { domains: [{ DomainName: "d1", EngineType: "OpenSearch" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Manage" }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    expect(await within(dialog).findByText("Domain Details")).toBeTruthy();
    expect(dialog.textContent).toContain("—");
    await user.click(within(dialog).getByRole("tab", { name: /Domain config/i }));
    expect(within(dialog).getByText("{}")).toBeTruthy();
  });

  it("shows spinners while tags and config are loading", async () => {
    mockDomainTags.mockReturnValue({ data: undefined, isLoading: true });
    mockDomainConfig.mockReturnValue({ data: undefined, isLoading: true });
    mockDomains.mockReturnValue({ data: { domains: [{ DomainName: "d1", EngineType: "OpenSearch" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Manage" }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.click(within(dialog).getByRole("tab", { name: /Tags/i }));
    expect(within(dialog).queryByText("Add tag")).toBeNull();
    await user.click(within(dialog).getByRole("tab", { name: /Domain config/i }));
    expect(within(dialog).queryByText("No config available")).toBeNull();
  });

  it("shows the no-domain-details fallback when domain is absent", async () => {
    mockDomainDetail.mockReturnValue({ data: {}, isLoading: false });
    mockDomains.mockReturnValue({ data: { domains: [{ DomainName: "d1", EngineType: "OpenSearch" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Manage" }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    expect(await within(dialog).findByText("No domain details available")).toBeTruthy();
  });

describe("OpenSearchDashboard — create", () => {
  async function openCreateModal(user: ReturnType<typeof userEvent.setup>) {
    await user.click(await screen.findByRole("button", { name: "Create Domain" }));
    return screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
  }

  it("creates a domain with an engine version and closes on success", async () => {
    mockCreateDomain.mockImplementation((_p: any, opts: any) => opts?.onSuccess?.());
    mockVersions.mockReturnValue({
      data: { versions: ["OpenSearch_3.6", "OpenSearch_2.19", "OpenSearch_2.11", "Elasticsearch_7.10"], total: 4 },
      isLoading: false,
    });
    mockDomains.mockReturnValue({
      data: { domains: [{ DomainName: "d1", EngineType: "OpenSearch" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    const dialog = await openCreateModal(user);
    await user.type(dialog.querySelectorAll("input")[0], "new-domain");
    await user.click(within(dialog).getByRole("button", { name: /Choose engine version/i }));
    await user.click(await screen.findByText("OpenSearch_2.11"));
    await user.click(within(dialog).getByRole("button", { name: "Create domain" }));
    await waitFor(() =>
      expect(mockCreateDomain).toHaveBeenCalledWith(
        { domainName: "new-domain", engineVersion: "OpenSearch_2.11" },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    );
    await waitFor(() => expect(dialog.className).toContain("hidden"));
  });

  it("omits engineVersion when left empty", async () => {
    mockCreateDomain.mockImplementation((_p: any, opts: any) => opts?.onSuccess?.());
    mockVersions.mockReturnValue({ data: undefined, isLoading: false });
    mockDomains.mockReturnValue({ data: { domains: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    const dialog = await openCreateModal(user);
    await user.type(dialog.querySelectorAll("input")[0], "plain-domain");
    await user.click(within(dialog).getByRole("button", { name: "Create domain" }));
    await waitFor(() =>
      expect(mockCreateDomain).toHaveBeenCalledWith(
        { domainName: "plain-domain", engineVersion: undefined },
        expect.anything()
      )
    );
  });

  it("keeps the create button disabled until a domain name is entered", async () => {
    mockDomains.mockReturnValue({ data: { domains: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    const dialog = await openCreateModal(user);
    const submit = within(dialog).getByRole("button", { name: "Create domain" });
    expect(submit.hasAttribute("disabled")).toBe(true);
    await user.type(dialog.querySelectorAll("input")[0], "x");
    await waitFor(() => expect(submit.hasAttribute("disabled")).toBe(false));
  });

  it("closes the create modal via Cancel", async () => {
    mockDomains.mockReturnValue({ data: { domains: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    const dialog = await openCreateModal(user);
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(dialog.className).toContain("hidden"));
    expect(mockCreateDomain).not.toHaveBeenCalled();
  });

  it("shows the create error alert with the error message", async () => {
    createDomainState.isError = true;
    createDomainState.error = new Error("creation failed");
    mockDomains.mockReturnValue({ data: { domains: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    const dialog = await openCreateModal(user);
    expect(await within(dialog).findByText("creation failed")).toBeTruthy();
  });

  it("shows the generic create error fallback", async () => {
    createDomainState.isError = true;
    createDomainState.error = null;
    mockDomains.mockReturnValue({ data: { domains: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    const dialog = await openCreateModal(user);
    expect(await within(dialog).findByText("Failed to create domain")).toBeTruthy();
  });

  it("renders the submit button while the mutation is pending", async () => {
    createDomainState.isPending = true;
    mockDomains.mockReturnValue({ data: { domains: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    const dialog = await openCreateModal(user);
    await user.type(dialog.querySelectorAll("input")[0], "pending-domain");
    expect(within(dialog).getByRole("button", { name: "Create domain" })).toBeTruthy();
    expect(mockCreateDomain).not.toHaveBeenCalled();
  });
});
