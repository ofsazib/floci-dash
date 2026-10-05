// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useCaDomains: vi.fn(),
  useCaCreateDomain: vi.fn(),
  useCaDeleteDomain: vi.fn(),
  useCaAuthToken: vi.fn(),
  useCaRepositories: vi.fn(),
  useCaCreateRepository: vi.fn(),
  useCaDeleteRepository: vi.fn(),
  useCaFetchEndpoint: vi.fn(),
  useCaAssociateExternalConnection: vi.fn(),
  useCaDisassociateExternalConnection: vi.fn(),
}));

vi.mock("../../hooks/useCodeArtifact", () => mockHooks);

const mockCreateDomain = vi.fn();
const mockDeleteDomain = vi.fn();
const mockAuthToken = vi.fn();
const mockCreateRepository = vi.fn();
const mockDeleteRepository = vi.fn();
const mockFetchEndpoint = vi.fn();
const mockAssociate = vi.fn();
const mockDisassociate = vi.fn();

function okMutation(mock: ReturnType<typeof vi.fn>, isPending = false) {
  return { mutateAsync: mock, isPending };
}

function listQuery(key: string, items: unknown[], overrides: Record<string, unknown> = {}) {
  return {
    data: { [key]: items },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

const DOMAIN = { name: "probe-domain", status: "Active", owner: "000000000000" };
const REPO = {
  name: "probe-repo",
  domainName: "probe-domain",
  description: "test repo",
  externalConnections: [{ externalConnectionName: "public:npmjs" }],
};
const BARE_REPO = { name: "bare-repo", domainName: "probe-domain", description: "" };

import CodeArtifactDashboard from "./CodeArtifactDashboard";

function modalDlg(header: string): HTMLElement {
  return screen
    .getAllByText(header)
    .map((t) => t.closest('[role="dialog"]'))
    .find((d) => d) as HTMLElement;
}

function dialogButton(dlg: HTMLElement, text: string): HTMLElement {
  return Array.from(dlg.querySelectorAll("button")).find(
    (b) => b.textContent === text
  ) as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockHooks.useCaDomains.mockReturnValue(listQuery("domains", [DOMAIN]));
  mockHooks.useCaRepositories.mockReturnValue(listQuery("repositories", [REPO, BARE_REPO]));
  mockHooks.useCaCreateDomain.mockReturnValue(okMutation(mockCreateDomain));
  mockHooks.useCaDeleteDomain.mockReturnValue(okMutation(mockDeleteDomain));
  mockHooks.useCaAuthToken.mockReturnValue(okMutation(mockAuthToken));
  mockHooks.useCaCreateRepository.mockReturnValue(okMutation(mockCreateRepository));
  mockHooks.useCaDeleteRepository.mockReturnValue(okMutation(mockDeleteRepository));
  mockHooks.useCaFetchEndpoint.mockReturnValue(okMutation(mockFetchEndpoint));
  mockHooks.useCaAssociateExternalConnection.mockReturnValue(okMutation(mockAssociate));
  mockHooks.useCaDisassociateExternalConnection.mockReturnValue(
    okMutation(mockDisassociate)
  );
});

describe("CodeArtifactDashboard — domains tab", () => {
  it("renders domains", () => {
    render(<CodeArtifactDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("probe-domain")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
  });

  it("renders with undefined data (loading)", () => {
    mockHooks.useCaDomains.mockReturnValue(listQuery("domains", [], { data: undefined }));
    mockHooks.useCaRepositories.mockReturnValue(
      listQuery("repositories", [], { data: undefined })
    );
    render(<CodeArtifactDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Domains (0)")).toBeTruthy();
  });

  it("creates a domain and closes the modal", async () => {
    const user = userEvent.setup();
    mockCreateDomain.mockResolvedValueOnce({ domain: { name: "new-domain" } });
    render(<CodeArtifactDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create domain/i }));
    const dlg = modalDlg("Create domain");
    await user.type(dlg.querySelector("input") as HTMLElement, "new-domain");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() => expect(mockCreateDomain).toHaveBeenCalledWith({ name: "new-domain" }));
    await waitFor(() => expect(screen.getByText("Domain new-domain created.")).toBeTruthy());
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("keeps Create disabled without a name and closes on cancel", async () => {
    const user = userEvent.setup();
    render(<CodeArtifactDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create domain/i }));
    const dlg = modalDlg("Create domain");
    const createBtn = dialogButton(dlg, "Create") as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
    await user.type(dlg.querySelector("input") as HTMLElement, "x");
    expect(createBtn.disabled).toBe(false);
    await user.click(dialogButton(dlg, "Cancel"));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("shows a fallback error when domain creation fails", async () => {
    const user = userEvent.setup();
    mockCreateDomain.mockRejectedValueOnce({});
    render(<CodeArtifactDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create domain/i }));
    const dlg = modalDlg("Create domain");
    await user.type(dlg.querySelector("input") as HTMLElement, "new-domain");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() => expect(screen.queryByText("Request failed")).toBeNull());
  });

  it("cancels the create repository modal and closes on escape", async () => {
    const user = userEvent.setup();
    render(<CodeArtifactDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Repositories/ }));
    await user.click(screen.getByRole("button", { name: /Create repository/i }));
    const dlg = modalDlg("Create repository");
    await user.click(dialogButton(dlg, "Cancel"));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
    await user.click(screen.getByRole("button", { name: /Create repository/i }));
    const dlg2 = modalDlg("Create repository");
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg2.className).toContain("hidden"));
  });

  it("fetches an authorization token and shows it in a modal", async () => {
    const user = userEvent.setup();
    mockAuthToken.mockResolvedValueOnce({ authorizationToken: "tok-xyz", expiration: 42 });
    render(<CodeArtifactDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Get token/i }));
    await waitFor(() => expect(mockAuthToken).toHaveBeenCalledWith("probe-domain"));
    await waitFor(() =>
      expect(screen.getByText("Expires (epoch seconds): 42")).toBeTruthy()
    );
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() =>
      expect(screen.queryByText("Expires (epoch seconds): 42")).toBeNull()
    );
  });

  it("shows a fallback error when the token fetch fails", async () => {
    const user = userEvent.setup();
    mockAuthToken.mockRejectedValueOnce({});
    render(<CodeArtifactDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Get token/i }));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });

  it("deletes a domain after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteDomain.mockResolvedValueOnce({ domain: null });
    render(<CodeArtifactDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Delete probe-domain/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Delete$/i }));
    await waitFor(() => expect(mockDeleteDomain).toHaveBeenCalledWith("probe-domain"));
    await waitFor(() => expect(screen.getByText("Domain probe-domain deleted.")).toBeTruthy());
  });
});

describe("CodeArtifactDashboard — repositories tab", () => {
  it("renders repositories and external connections", async () => {
    const user = userEvent.setup();
    render(<CodeArtifactDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Repositories/ }));
    await waitFor(() => expect(screen.getByText("probe-repo")).toBeTruthy());
    expect(screen.getByText("bare-repo")).toBeTruthy();
    expect(screen.getByText("public:npmjs")).toBeTruthy();
  });

  it("creates a repository with parsed upstreams", async () => {
    const user = userEvent.setup();
    mockCreateRepository.mockResolvedValueOnce({ repository: { name: "new-repo" } });
    render(<CodeArtifactDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Repositories/ }));
    await user.click(screen.getByRole("button", { name: /Create repository/i }));
    const dlg = modalDlg("Create repository");
    const dialogInputs = Array.from(dlg.querySelectorAll("input")) as HTMLElement[];
    await user.type(dialogInputs[0], "probe-domain");
    await user.type(dialogInputs[1], "new-repo");
    await user.type(dialogInputs[2], "up-a, up-b,");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() =>
      expect(mockCreateRepository).toHaveBeenCalledWith({
        domain: "probe-domain",
        name: "new-repo",
        upstreams: ["up-a", "up-b"],
      })
    );
    await waitFor(() => expect(screen.getByText("Repository new-repo created.")).toBeTruthy());
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("shows a fallback error when repository creation fails", async () => {
    const user = userEvent.setup();
    mockCreateRepository.mockRejectedValueOnce({});
    render(<CodeArtifactDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Repositories/ }));
    await user.click(screen.getByRole("button", { name: /Create repository/i }));
    const dlg = modalDlg("Create repository");
    const dialogInputs = Array.from(dlg.querySelectorAll("input")) as HTMLElement[];
    await user.type(dialogInputs[0], "probe-domain");
    await user.type(dialogInputs[1], "new-repo");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });

  it("associates and disassociates the npmjs external connection", async () => {
    const user = userEvent.setup();
    mockAssociate.mockResolvedValueOnce({ repository: {} });
    mockDisassociate.mockResolvedValueOnce({ repository: {} });
    render(<CodeArtifactDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Repositories/ }));
    const connectButtons = screen.getAllByRole("button", { name: /Connect npmjs/i });
    await user.click(connectButtons[0]);
    await waitFor(() =>
      expect(mockAssociate).toHaveBeenCalledWith({
        domain: "probe-domain",
        repository: "probe-repo",
        externalConnection: "public:npmjs",
      })
    );
    await waitFor(() =>
      expect(screen.getByText("public:npmjs associated with probe-repo.")).toBeTruthy()
    );
    const disconnectButtons = screen.getAllByRole("button", { name: /Disconnect/i });
    await user.click(disconnectButtons[0]);
    await waitFor(() =>
      expect(mockDisassociate).toHaveBeenCalledWith({
        domain: "probe-domain",
        repository: "probe-repo",
        externalConnection: "public:npmjs",
      })
    );
    await waitFor(() =>
      expect(
        screen.getByText("public:npmjs disassociated from probe-repo.")
      ).toBeTruthy()
    );
  });

  it("fetches a repository endpoint and shows it in a modal", async () => {
    const user = userEvent.setup();
    mockFetchEndpoint.mockResolvedValueOnce({ repositoryEndpoint: "https://endpoint" });
    render(<CodeArtifactDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Repositories/ }));
    const endpointButtons = screen.getAllByRole("button", { name: /^Endpoint$/i });
    await user.click(endpointButtons[0]);
    await waitFor(() =>
      expect(mockFetchEndpoint).toHaveBeenCalledWith({
        domain: "probe-domain",
        repository: "probe-repo",
      })
    );
    await waitFor(() =>
      expect(screen.getByText("Repository endpoint (probe-repo)")).toBeTruthy()
    );
    expect(screen.getByText("https://endpoint")).toBeTruthy();
    const dlg = modalDlg("Repository endpoint (probe-repo)");
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("shows a fallback error when the endpoint fetch fails", async () => {
    const user = userEvent.setup();
    mockFetchEndpoint.mockRejectedValueOnce({});
    render(<CodeArtifactDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Repositories/ }));
    const endpointButtons = screen.getAllByRole("button", { name: /^Endpoint$/i });
    await user.click(endpointButtons[0]);
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });

  it("deletes a repository after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteRepository.mockResolvedValueOnce({ repository: null });
    render(<CodeArtifactDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Repositories/ }));
    await user.click(screen.getByRole("button", { name: /Delete bare-repo/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Delete$/i }));
    await waitFor(() =>
      expect(mockDeleteRepository).toHaveBeenCalledWith({
        domain: "probe-domain",
        name: "bare-repo",
      })
    );
    await waitFor(() =>
      expect(screen.getByText("Repository bare-repo deleted.")).toBeTruthy()
    );
  });
});
