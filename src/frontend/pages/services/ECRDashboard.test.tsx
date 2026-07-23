// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock hooks ─────────────────────────────────────────

const mockRepositories = vi.fn();
const mockCreateRepo = vi.fn();
const mockDeleteRepo = vi.fn();
const mockScanConfig = vi.fn();

vi.mock("../../hooks/useECR", () => ({
  useECRRepositories: (...args: any[]) => mockRepositories(...args),
  useECRCreateRepository: () => ({
    mutate: mockCreateRepo,
    isPending: false,
  }),
  useECRDeleteRepository: () => ({
    mutateAsync: mockDeleteRepo,
    isPending: false,
    variables: null,
  }),
  useECRScanningConfiguration: (...args: any[]) => mockScanConfig(...args),
}));

import { ECRDashboard } from "./ECRDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
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
