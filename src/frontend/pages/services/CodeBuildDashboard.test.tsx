// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock ConfirmDialog ─────────────────────────────────

vi.mock("../../components/ConfirmDialog", () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn(() => Promise.resolve(true)),
    dialog: null,
  }),
}));

// ─── Mock hooks ─────────────────────────────────────────

const mockProjectsHook = vi.fn();
const mockBuildsHook = vi.fn();
const mockCredentialsHook = vi.fn();
const mockImagesHook = vi.fn();
const mockCreateProject = vi.fn();
const mockDeleteProject = vi.fn();
const mockStartBuild = vi.fn();

const createProjectState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
  isPending: false,
}));

vi.mock("../../hooks/useCodeBuild", () => ({
  useCodeBuildProjects: (...args: any[]) => mockProjectsHook(...args),
  useCodeBuildBuilds: (...args: any[]) => mockBuildsHook(...args),
  useCodeBuildSourceCredentials: (...args: any[]) => mockCredentialsHook(...args),
  useCodeBuildCuratedImages: (...args: any[]) => mockImagesHook(...args),
  useCreateCodeBuildProject: () => ({
    mutate: mockCreateProject,
    isPending: createProjectState.isPending,
    isError: createProjectState.isError,
    error: createProjectState.error,
    reset: vi.fn(),
  }),
  useDeleteCodeBuildProject: () => ({
    mutateAsync: mockDeleteProject,
    isPending: false,
    variables: null,
  }),
  useStartCodeBuildBuild: () => ({
    mutate: mockStartBuild,
    isPending: false,
    variables: null,
  }),
  useCodeBuildProject: () => ({
    data: null,
    isLoading: false,
  }),
  useCodeBuildProjectBuilds: () => ({
    data: { builds: [] },
    isLoading: false,
  }),
  useCodeBuildBuild: () => ({
    data: null,
    isLoading: false,
  }),
  useStopCodeBuildBuild: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useImportCodeBuildSourceCredentials: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useDeleteCodeBuildSourceCredentials: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

import { CodeBuildDashboard } from "./CodeBuildDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  createProjectState.isError = false;
  createProjectState.error = null;
  createProjectState.isPending = false;

  mockProjectsHook.mockReturnValue({
    data: { projects: [] as any[] },
    isLoading: false,
  });
  mockBuildsHook.mockReturnValue({
    data: { builds: [] as any[] },
  });
  mockCredentialsHook.mockReturnValue({
    data: { sourceCredentialsInfo: [] as any[] },
  });
  mockImagesHook.mockReturnValue({
    data: { images: [] as any[] },
  });
});

// ─── Tests ──────────────────────────────────────────────

describe("CodeBuildDashboard — rendering", () => {
  it("shows loading skeleton when loading", () => {
    mockProjectsHook.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows all section headers", () => {
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("CodeBuild Projects")).toBeTruthy();
    expect(screen.getByText("Recent Builds")).toBeTruthy();
    expect(screen.getByText("Source Credentials")).toBeTruthy();
    expect(screen.getByText("Curated Images")).toBeTruthy();
  });

  it("shows empty message for projects", () => {
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No CodeBuild project/i)).toBeTruthy();
  });
});

describe("CodeBuildDashboard — projects", () => {
  it("renders projects with data", () => {
    mockProjectsHook.mockReturnValue({
      data: {
        projects: [
          { name: "my-project", description: "Test project", language: "Python", created: new Date("2025-01-01").toISOString() },
        ],
      },
      isLoading: false,
    });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-project")).toBeTruthy();
    expect(screen.getByText("Test project")).toBeTruthy();
    expect(screen.getByText("Python")).toBeTruthy();
  });

  it("renders projects with null/undefined fields gracefully", () => {
    mockProjectsHook.mockReturnValue({
      data: {
        projects: [{ name: "minimal-project" }],
      },
      isLoading: false,
    });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("minimal-project")).toBeTruthy();
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2);
  });

  it("shows error alert when create project fails", async () => {
    createProjectState.isError = true;
    createProjectState.error = new Error("Project already exists");
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create project/i);
    await waitFor(() => {
      expect(screen.getByText("Create CodeBuild project")).toBeTruthy();
    });
    expect(screen.getByText("Project already exists")).toBeTruthy();

    createProjectState.isError = false;
    createProjectState.error = null;
  });

  it("handles createdAt timestamp field", () => {
    mockProjectsHook.mockReturnValue({
      data: {
        projects: [
          { name: "epoch-project", createdAt: 1700000000, description: "Clue", language: "Go" },
        ],
      },
      isLoading: false,
    });
    const { container } = render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("epoch-project")).toBeTruthy();
    // createdAt * 1000 → new Date(1700000000000) → toLocaleDateString() outputs a date
    expect(container.textContent).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });

  it("opens create project modal and shows form fields", async () => {
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create project/i);

    await waitFor(() => {
      expect(screen.getByText("Create CodeBuild project")).toBeTruthy();
    });

    expect(screen.getByLabelText(/Project name/)).toBeTruthy();
    expect(screen.getByLabelText(/Description/)).toBeTruthy();
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    expect(createBtns.length).toBeGreaterThanOrEqual(1);
  });

  it("starts a build", async () => {
    const user = userEvent.setup();
    mockProjectsHook.mockReturnValue({
      data: {
        projects: [{ name: "my-project", description: "Test", language: "Python", created: new Date().toISOString() }],
      },
      isLoading: false,
    });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    const startBtn = screen.getByRole("button", { name: /Start build/i });
    await user.click(startBtn);
    await waitFor(() => {
      expect(mockStartBuild).toHaveBeenCalledWith("my-project");
    });
  });

  it("deletes a project", async () => {
    const user = userEvent.setup();
    mockProjectsHook.mockReturnValue({
      data: {
        projects: [{ name: "my-project", description: "Test", language: "Python", created: new Date().toISOString() }],
      },
      isLoading: false,
    });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    const deleteBtn = screen.getByRole("button", { name: /Delete my-project/i });
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(mockDeleteProject).toHaveBeenCalledWith("my-project");
    });
  });
});

describe("CodeBuildDashboard — builds section", () => {
  it("renders builds section with data", () => {
    mockBuildsHook.mockReturnValue({
      data: {
        builds: [
          { id: "arn:aws:codebuild:us-east-1:123:build/my-project:abc123", projectName: "my-project", buildStatus: "SUCCEEDED", startTime: new Date("2025-01-01").toISOString() },
        ],
      },
    });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    // Build ID truncated from ARN via split("/").pop() → "my-project:abc123"
    expect(screen.getByText(/my-project:abc123/)).toBeTruthy();
    expect(screen.getByText("my-project")).toBeTruthy();
    expect(screen.getByText("SUCCEEDED")).toBeTruthy();
  });
});

describe("CodeBuildDashboard — source credentials", () => {
  it("renders credentials with data", () => {
    mockCredentialsHook.mockReturnValue({
      data: {
        sourceCredentialsInfo: [
          { arn: "arn:aws:codebuild:us-east-1:123:token/github", serverType: "GITHUB", authType: "PERSONAL_ACCESS_TOKEN" },
        ],
      },
    });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    // Both ARN and serverType contain "github", so use getAllByText
    const githubMatches = screen.getAllByText(/github/i);
    expect(githubMatches.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("PERSONAL_ACCESS_TOKEN")).toBeTruthy();
  });
});

describe("CodeBuildDashboard — curated images", () => {
  it("renders curated images with data", () => {
    mockImagesHook.mockReturnValue({
      data: {
        images: [
          { identifier: "aws/codebuild/standard:5.0", description: "Standard 5.0" },
        ],
      },
    });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("aws/codebuild/standard:5.0")).toBeTruthy();
    expect(screen.getByText("Standard 5.0")).toBeTruthy();
  });
});
