// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock hooks ─────────────────────────────────────────

const mockRepositories = vi.fn();
const mockCreateRepo = vi.fn();
const mockDeleteRepo = vi.fn();
const mockScanConfig = vi.fn();
const mockManifestMutate = vi.fn();
const mockAuthTokenRefetch = vi.fn();
const mockAuthToken = vi.fn();
const mockPutMutability = vi.fn();

const mockPutMutabilityState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
}));
const deleteRepoState: { isPending: boolean; variables: string | null } = {
  isPending: false,
  variables: null,
};
const authTokenState: {
  data: { authorizationToken: string | null; expiresAt: string | null; proxyEndpoint: string | null } | undefined;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
} = {
  data: undefined,
  isFetching: false,
  isError: false,
  error: null,
};

vi.mock("../../hooks/useECR", () => ({
  useECRRepositories: (...args: any[]) => mockRepositories(...args),
  useECRCreateRepository: () => ({
    mutate: mockCreateRepo,
    isPending: false,
  }),
  useECRDeleteRepository: () => ({
    mutateAsync: mockDeleteRepo,
    get isPending() { return deleteRepoState.isPending; },
    get variables() { return deleteRepoState.variables; },
  }),
  useECRScanningConfiguration: (...args: any[]) => mockScanConfig(...args),
  useECRImageManifest: () => ({
    mutate: mockManifestMutate,
    isPending: false,
  }),
  useECRAuthToken: (...args: any[]) => mockAuthToken(...args),
  usePutECRImageTagMutability: () => ({
    mutate: mockPutMutability,
    isPending: false,
    get isError() { return mockPutMutabilityState.isError; },
    get error() { return mockPutMutabilityState.error; },
  }),
}));

import { ECRDashboard } from "./ECRDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  deleteRepoState.isPending = false;
  deleteRepoState.variables = null;
  mockPutMutabilityState.isError = false;
  mockPutMutabilityState.error = null;
  mockRepositories.mockReturnValue({
    data: { repositories: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockScanConfig.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
  });
  mockManifestMutate.mockReset();
  mockAuthTokenRefetch.mockReset();
  authTokenState.data = undefined;
  authTokenState.isFetching = false;
  authTokenState.isError = false;
  authTokenState.error = null;
  mockAuthToken.mockReturnValue({
    refetch: mockAuthTokenRefetch,
    get data() { return authTokenState.data; },
    get isFetching() { return authTokenState.isFetching; },
    get isError() { return authTokenState.isError; },
    get error() { return authTokenState.error; },
  });
});

// ─── Tests ──────────────────────────────────────────────

describe("ECRDashboard — rendering", () => {
  it("shows loading skeleton when loading", () => {
    mockRepositories.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    const { container } = render(<ECRDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty message", () => {
    render(<ECRDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No repositories/i)).toBeTruthy();
  });

  it("renders repositories with data", () => {
    mockRepositories.mockReturnValue({
      data: {
        repositories: [
          {
            repositoryName: "my-repo",
            repositoryUri: "123.dkr.ecr.us-east-1.amazonaws.com/my-repo",
            createdAt: "2024-01-15T00:00:00Z",
            imageTagMutability: "IMMUTABLE",
            encryptionConfiguration: {},
            tags: [],
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<ECRDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-repo")).toBeTruthy();
    expect(screen.getByText("123.dkr.ecr.us-east-1.amazonaws.com/my-repo")).toBeTruthy();
  });

  it("shows dash for missing createdAt", () => {
    mockRepositories.mockReturnValue({
      data: {
        repositories: [
          {
            repositoryName: "no-date-repo",
            repositoryUri: "uri",
            createdAt: null,
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<ECRDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("no-date-repo")).toBeTruthy();
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });
});

describe("ECRDashboard — filtering", () => {
  it("filters repositories by matching name", async () => {
    mockRepositories.mockReturnValue({
      data: {
        repositories: [
          {
            repositoryName: "alpha-repo",
            repositoryUri: "uri1",
            createdAt: "2024-01-15T00:00:00Z",
          },
          {
            repositoryName: "beta-repo",
            repositoryUri: "uri2",
            createdAt: "2024-01-15T00:00:00Z",
          },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText("alpha-repo")).toBeTruthy());
    expect(screen.getByText("beta-repo")).toBeTruthy();

    const filterInput = screen.getByPlaceholderText("Find repositories by name");
    await user.type(filterInput, "alpha");

    await waitFor(() => {
      expect(screen.getByText("alpha-repo")).toBeTruthy();
    });
  });

  it("filters out repositories that do not match", async () => {
    mockRepositories.mockReturnValue({
      data: {
        repositories: [
          {
            repositoryName: "visible-repo",
            repositoryUri: "uri",
            createdAt: "2024-01-15T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText("visible-repo")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find repositories by name");
    await user.type(filterInput, "nonexistent");

    // After filtering, the repo should not be visible
    await waitFor(() => {
      expect(screen.queryByText("visible-repo")).toBeNull();
    });
  });
});

describe("ECRDashboard — create repository", () => {
  it("opens create modal and submits", async () => {
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create/i);

    await waitFor(() => {
      expect(screen.getByText("Create repository")).toBeTruthy();
    });

    const nameInput = screen.getByPlaceholderText("my-repo");
    await user.type(nameInput, "new-repo");

    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateRepo).toHaveBeenCalledWith(
        expect.objectContaining({ name: "new-repo" }),
      );
    });
  });

  it("dismisses create repository modal with Escape", async () => {
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create repository")).toBeTruthy());
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => fireEvent.keyDown(d as HTMLElement, { keyCode: 27 }));
    await waitFor(() => {
      const header = screen.getAllByText("Create repository").find((h) => h.closest('[role="dialog"]'));
      expect(header!.closest('[role="dialog"]')!.className).toContain("hidden");
    });
  });

  it("disables create button when name is empty", async () => {
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create/i);

    await waitFor(() => {
      expect(screen.getByText("Create repository")).toBeTruthy();
    });

    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    // The last Create button should be disabled when repoName is empty
    expect(createBtns[createBtns.length - 1]).toBeDisabled();
  });

  it("cancels create modal", async () => {
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create/i);

    await waitFor(() => {
      expect(screen.getByText("Create repository")).toBeTruthy();
    });

    await clickButton(user, /Cancel/i);

    await waitFor(() => {
      expect(mockCreateRepo).not.toHaveBeenCalled();
    });
  });
});

describe("ECRDashboard — delete repository", () => {
  it("calls deleteRepository when delete is confirmed", async () => {
    mockRepositories.mockReturnValue({
      data: {
        repositories: [
          {
            repositoryName: "my-repo",
            repositoryUri: "123.dkr.ecr.us-east-1.amazonaws.com/my-repo",
            createdAt: "2024-01-15T00:00:00Z",
            imageTagMutability: "IMMUTABLE",
            encryptionConfiguration: {},
            tags: [],
          },
        ],
        total: 1,
      },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("my-repo")).toBeTruthy();
    });

    // Click delete button, then confirm in dialog
    const deleteBtns = screen.getAllByRole("button", { name: /Delete my-repo/i });
    await user.click(deleteBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure/i)).toBeTruthy();
    });

    // Click confirm Delete in dialog
    const confirmDeleteBtns = screen.getAllByRole("button", { name: /^Delete$/i });
    await user.click(confirmDeleteBtns[confirmDeleteBtns.length - 1]);

    await waitFor(() => {
      expect(mockDeleteRepo).toHaveBeenCalledWith("my-repo");
    });
  });

  it("shows empty message when repositories key is missing", () => {
    mockRepositories.mockReturnValue({ data: {} as any, isLoading: false });
    render(<ECRDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No repositories/i)).toBeTruthy();
  });

  it("shows delete loading state on the matching repository only", async () => {
    mockRepositories.mockReturnValue({
      data: {
        repositories: [
          { repositoryName: "repo-a", repositoryUri: "uri-a" },
          { repositoryName: "repo-b", repositoryUri: "uri-b" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    deleteRepoState.isPending = true;
    deleteRepoState.variables = "repo-a";
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("repo-b")).toBeTruthy());
    // repo-a's delete button is disabled (loading); repo-b's stays enabled
    const deleteA = screen.getByRole("button", { name: /Delete repo-a/i });
    const deleteB = screen.getByRole("button", { name: /Delete repo-b/i });
    expect((deleteA as HTMLButtonElement).disabled).toBe(true);
    expect((deleteB as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("ECRDashboard — scanning configuration", () => {
  const repoData = {
    data: {
      repositories: [
        {
          repositoryName: "my-repo",
          repositoryUri: "123.dkr.ecr.us-east-1.amazonaws.com/my-repo",
          createdAt: "2024-01-15T00:00:00Z",
          imageTagMutability: "IMMUTABLE",
          encryptionConfiguration: {},
          tags: [],
        },
      ],
      total: 1,
    },
    isLoading: false,
  };

  it("opens scan config modal and shows configuration", async () => {
    mockRepositories.mockReturnValue(repoData);
    mockScanConfig.mockReturnValue({
      data: {
        repositoryName: "my-repo",
        scanningConfiguration: {
          repositoryArn: "arn:aws:ecr:us-east-1:123:repository/my-repo",
          scanOnPush: true,
          scanFrequency: "SCAN_ON_PUSH",
          appliedScanFilters: [{ filter: "*", filterType: "WILDCARD" }],
        },
        failure: null,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());

    await clickButton(user, /Scan config/i);
    await waitFor(() => expect(screen.getByText(/Scanning configuration/i)).toBeTruthy());
    expect(screen.getByText("Enabled")).toBeTruthy();
    expect(screen.getByText("SCAN_ON_PUSH")).toBeTruthy();
    expect(screen.getByText(/WILDCARD/)).toBeTruthy();
    expect(mockScanConfig).toHaveBeenCalledWith("my-repo");
  });

  it("shows empty state when no scan configuration", async () => {
    mockRepositories.mockReturnValue(repoData);
    mockScanConfig.mockReturnValue({
      data: { repositoryName: "my-repo", scanningConfiguration: null, failure: null },
      isLoading: false,
      isError: false,
      error: null,
    });

    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await clickButton(user, /Scan config/i);
    await waitFor(() =>
      expect(screen.getByText("No scanning configuration for this repository.")).toBeTruthy()
    );
  });

  it("surfaces failure from the API", async () => {
    mockRepositories.mockReturnValue(repoData);
    mockScanConfig.mockReturnValue({
      data: {
        repositoryName: "my-repo",
        scanningConfiguration: null,
        failure: { failureCode: "REPOSITORY_NOT_FOUND", failureReason: "Repository not found" },
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await clickButton(user, /Scan config/i);
    await waitFor(() => expect(screen.getByText("Repository not found")).toBeTruthy());
  });

  it("shows loading spinner in scan config modal", async () => {
    mockRepositories.mockReturnValue(repoData);
    mockScanConfig.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await clickButton(user, /Scan config/i);
    await waitFor(() => expect(screen.getByText(/Scanning configuration — my-repo/i)).toBeTruthy());
  });

  it("shows error alert when scan config fails to load", async () => {
    mockRepositories.mockReturnValue(repoData);
    mockScanConfig.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Failed to fetch scanning config"),
    });

    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await clickButton(user, /Scan config/i);
    await waitFor(() => expect(screen.getByText("Failed to fetch scanning config")).toBeTruthy());
  });

  it("shows fallback message when the scan config error has no message", async () => {
    mockRepositories.mockReturnValue(repoData);
    mockScanConfig.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error(""),
    });

    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await clickButton(user, /Scan config/i);
    await waitFor(() => {
      expect(screen.getByText(/Failed to load scanning configuration/i)).toBeTruthy();
    });
  });

  it("shows failure with fallback messages", async () => {
    mockRepositories.mockReturnValue(repoData);
    mockScanConfig.mockReturnValue({
      data: {
        repositoryName: "my-repo",
        scanningConfiguration: null,
        failure: { failureCode: null, failureReason: null },
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await clickButton(user, /Scan config/i);
    await waitFor(() => expect(screen.getByText("Unavailable")).toBeTruthy());
    expect(screen.getByText(/Scanning configuration is not available/i)).toBeTruthy();
  });

  it("shows disabled scan on push and no frequency fallback", async () => {
    mockRepositories.mockReturnValue(repoData);
    mockScanConfig.mockReturnValue({
      data: {
        repositoryName: "my-repo",
        scanningConfiguration: {
          repositoryArn: "arn:aws:ecr:us-east-1:123:repository/my-repo",
          scanOnPush: false,
          scanFrequency: null,
          appliedScanFilters: [],
        },
        failure: null,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await clickButton(user, /Scan config/i);
    await waitFor(() => expect(screen.getByText(/Scanning configuration/i)).toBeTruthy());
    expect(screen.getByText("Disabled")).toBeTruthy();
    // scrollFrequency null → "—" fallback; empty filters → "—" fallback
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it("shows applied scan filters with missing filterType and filter", async () => {
    mockRepositories.mockReturnValue(repoData);
    mockScanConfig.mockReturnValue({
      data: {
        repositoryName: "my-repo",
        scanningConfiguration: {
          repositoryArn: "arn:aws:ecr:us-east-1:123:repository/my-repo",
          scanOnPush: false,
          scanFrequency: "MANUAL",
          appliedScanFilters: [{ filterType: null, filter: null }],
        },
        failure: null,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await clickButton(user, /Scan config/i);
    await waitFor(() => expect(screen.getByText(/Scanning configuration/i)).toBeTruthy());
    // filterType null → "?" fallback, filter null → "*" fallback
    expect(screen.getByText(/\?: \*/)).toBeTruthy();
  });
});

// ─── Manifest modal ───────────────────────────────────────

describe("ECRDashboard — image manifest modal", () => {
  const repoData = {
    data: {
      repositories: [
        {
          repositoryName: "my-repo",
          repositoryUri: "uri",
          createdAt: "2024-01-15T00:00:00Z",
          imageTagMutability: "IMMUTABLE",
          encryptionConfiguration: {},
          tags: [],
        },
      ],
      total: 1,
    },
    isLoading: false,
  };

  it("opens the manifest modal from a repository row", async () => {
    mockRepositories.mockReturnValue(repoData);
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await clickButton(user, /Manifest/i);
    await waitFor(() =>
      expect(screen.getByText("Image manifest — my-repo")).toBeTruthy(),
    );
  });

  it("fetches manifest by tag and shows the result", async () => {
    mockRepositories.mockReturnValue(repoData);
    mockManifestMutate.mockImplementation((params: any, opts: any) => {
      expect(params).toEqual({ repoName: "my-repo", tag: "v1", digest: undefined });
      opts.onSuccess({ repositoryName: "my-repo", image: { imageManifest: "{}" } });
    });
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await clickButton(user, /Manifest/i);
    await user.type(screen.getByPlaceholderText("latest"), "v1");
    await clickButton(user, /Fetch manifest/i);
    await waitFor(() => expect(screen.getByText(/imageManifest/)).toBeTruthy());
    expect(mockManifestMutate).toHaveBeenCalledTimes(1);
  });

  it("fetches manifest by digest", async () => {
    mockRepositories.mockReturnValue(repoData);
    mockManifestMutate.mockImplementation((params: any, opts: any) => {
      expect(params).toEqual({
        repoName: "my-repo",
        tag: undefined,
        digest: "sha256:abc",
      });
      opts.onSuccess({ repositoryName: "my-repo", image: { imageManifest: "{}" } });
    });
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await clickButton(user, /Manifest/i);
    await user.type(screen.getByPlaceholderText("sha256:... (alternative to tag)"), "sha256:abc");
    await clickButton(user, /Fetch manifest/i);
    await waitFor(() => expect(screen.getByText(/imageManifest/)).toBeTruthy());
  });

  it("does not fetch when tag and digest are both empty", async () => {
    mockRepositories.mockReturnValue(repoData);
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await clickButton(user, /Manifest/i);
    const fetchBtn = screen.getByRole("button", { name: /Fetch manifest/i });
    await user.click(fetchBtn);
    expect(mockManifestMutate).not.toHaveBeenCalled();
  });

  it("renders the raw result when image is null", async () => {
    mockRepositories.mockReturnValue(repoData);
    mockManifestMutate.mockImplementation((_params: any, opts: any) => {
      opts.onSuccess({ repositoryName: "my-repo", image: null });
    });
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await clickButton(user, /Manifest/i);
    await user.type(screen.getByPlaceholderText("latest"), "v1");
    await clickButton(user, /Fetch manifest/i);
    await waitFor(() => expect(screen.getByText(/"image": null/)).toBeTruthy());
  });

  it("shows error when manifest fetch fails", async () => {
    mockRepositories.mockReturnValue(repoData);
    mockManifestMutate.mockImplementation((_params: any, opts: any) => {
      opts.onError(new Error("manifest gone"));
    });
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await clickButton(user, /Manifest/i);
    await user.type(screen.getByPlaceholderText("latest"), "v1");
    await clickButton(user, /Fetch manifest/i);
    await waitFor(() => expect(screen.getByText("manifest gone")).toBeTruthy());
  });

  it("shows generic error when manifest fetch fails without message", async () => {
    mockRepositories.mockReturnValue(repoData);
    mockManifestMutate.mockImplementation((_params: any, opts: any) => {
      opts.onError("boom");
    });
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await clickButton(user, /Manifest/i);
    await user.type(screen.getByPlaceholderText("latest"), "v1");
    await clickButton(user, /Fetch manifest/i);
    await waitFor(() =>
      expect(screen.getByText("Failed to fetch manifest")).toBeTruthy(),
    );
  });

  it("dismisses the manifest error alert", async () => {
    mockRepositories.mockReturnValue(repoData);
    mockManifestMutate.mockImplementation((_params: any, opts: any) => {
      opts.onError(new Error("dismiss me"));
    });
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await clickButton(user, /Manifest/i);
    await user.type(screen.getByPlaceholderText("latest"), "v1");
    await clickButton(user, /Fetch manifest/i);
    await waitFor(() => expect(screen.getByText("dismiss me")).toBeTruthy());
    const dismiss = document.querySelector(
      '[class*="awsui_dismiss-button"]',
    ) as HTMLElement;
    fireEvent.click(dismiss);
    await waitFor(() => expect(screen.queryByText("dismiss me")).toBeNull());
  });

  it("closes the manifest modal", async () => {
    mockRepositories.mockReturnValue(repoData);
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await clickButton(user, /Manifest/i);
    await waitFor(() =>
      expect(screen.getByText("Image manifest — my-repo")).toBeTruthy(),
    );
    await clickButton(user, /^Close$/i);
  });
});

// ─── Auth token modal ─────────────────────────────────────

describe("ECRDashboard — auth token modal", () => {
  const repoData = {
    data: {
      repositories: [
        {
          repositoryName: "my-repo",
          repositoryUri: "uri",
          createdAt: "2024-01-15T00:00:00Z",
          imageTagMutability: "IMMUTABLE",
          encryptionConfiguration: {},
          tags: [],
        },
      ],
      total: 1,
    },
    isLoading: false,
  };

  it("opens the auth token modal and calls refetch on demand", async () => {
    mockRepositories.mockReturnValue(repoData);
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await clickButton(user, /Auth token/i);
    await waitFor(() => expect(screen.getByText("Registry auth token")).toBeTruthy());
    await clickButton(user, /Fetch token/i);
    expect(mockAuthTokenRefetch).toHaveBeenCalledTimes(1);
  });

  it("renders fetched token data", async () => {
    mockRepositories.mockReturnValue(repoData);
    authTokenState.data = {
      authorizationToken: "tok123",
      expiresAt: "2026-01-01T00:00:00Z",
      proxyEndpoint: "https://proxy",
    };
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await clickButton(user, /Auth token/i);
    await waitFor(() => expect(screen.getByDisplayValue("tok123")).toBeTruthy());
    expect(screen.getByDisplayValue("https://proxy")).toBeTruthy();
    expect(screen.getByDisplayValue("2026-01-01T00:00:00Z")).toBeTruthy();
  });

  it("shows error when auth token fetch fails", async () => {
    mockRepositories.mockReturnValue(repoData);
    authTokenState.isError = true;
    authTokenState.error = new Error("auth down");
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await clickButton(user, /Auth token/i);
    await waitFor(() => expect(screen.getByText("auth down")).toBeTruthy());
  });

  it("shows generic error when auth token fetch fails without message", async () => {
    mockRepositories.mockReturnValue(repoData);
    authTokenState.isError = true;
    authTokenState.error = null;
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await clickButton(user, /Auth token/i);
    await waitFor(() =>
      expect(screen.getByText("Failed to fetch auth token")).toBeTruthy(),
    );
  });

  it("shows dashes when auth token fields are null", async () => {
    mockRepositories.mockReturnValue(repoData);
    authTokenState.data = {
      authorizationToken: null,
      expiresAt: null,
      proxyEndpoint: null,
    };
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await clickButton(user, /Auth token/i);
    await waitFor(() => expect(screen.getByText("Registry auth token")).toBeTruthy());
    const dashes = screen.getAllByDisplayValue("—");
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it("closes the auth token modal", async () => {
    mockRepositories.mockReturnValue(repoData);
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await clickButton(user, /Auth token/i);
    await waitFor(() => expect(screen.getByText("Registry auth token")).toBeTruthy());
    await clickButton(user, /Close/i);
  });
});

describe("ECRDashboard — tag mutability", () => {
  it("opens the mutability modal, selects IMMUTABLE, and saves", async () => {
    mockPutMutability.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    mockRepositories.mockReturnValue({
      data: { repositories: [{ repositoryName: "repo-1", repositoryUri: "x", createdAt: 1700000000000 }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Mutability" }));
    await screen.findByRole("button", { name: /MUTABLE/i });
    await user.click(screen.getByRole("button", { name: /MUTABLE/i }));
    await user.click(await screen.findByRole("option", { name: "IMMUTABLE" }));
    const saveBtn = screen.getAllByRole("button", { name: "Save" }).at(-1)!;
    await user.click(saveBtn);
    await waitFor(() =>
      expect(mockPutMutability).toHaveBeenCalledWith(
        { repositoryName: "repo-1", tagMutability: "IMMUTABLE" },
        { onSuccess: expect.any(Function) },
      )
    );
  });

  it("shows the mutability error and fallback message", async () => {
    mockPutMutabilityState.isError = true;
    mockPutMutabilityState.error = new Error("mutability failed");
    mockRepositories.mockReturnValue({
      data: { repositories: [{ repositoryName: "repo-1", repositoryUri: "x", createdAt: 1700000000000 }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Mutability" }));
    expect(await screen.findByText("mutability failed")).toBeTruthy();
  });

  it("falls back to a generic mutability error message", async () => {
    mockPutMutabilityState.isError = true;
    mockPutMutabilityState.error = null;
    mockRepositories.mockReturnValue({
      data: { repositories: [{ repositoryName: "repo-1", repositoryUri: "x", createdAt: 1700000000000 }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Mutability" }));
    expect(await screen.findByText("Failed to update tag mutability")).toBeTruthy();
  });

  it("cancels the mutability modal without saving", async () => {
    mockRepositories.mockReturnValue({
      data: { repositories: [{ repositoryName: "repo-1", repositoryUri: "x", createdAt: 1700000000000 }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECRDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Mutability" }));
    await screen.findByRole("button", { name: /MUTABLE/i });
    const cancelBtn = screen.getAllByRole("button", { name: "Cancel" }).at(-1)!;
    await user.click(cancelBtn);
    expect(mockPutMutability).not.toHaveBeenCalled();
  });
});
