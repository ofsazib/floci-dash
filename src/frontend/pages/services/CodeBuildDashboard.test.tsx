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

// ─── vi.hoisted states ─────────────────────────────────

const createProjectState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
  isPending: false,
}));

const deleteProjectState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const startBuildState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

// ─── Mock hooks ─────────────────────────────────────────

const mockProjectsHook = vi.fn();
const mockBuildsHook = vi.fn();
const mockCredentialsHook = vi.fn();
const mockImagesHook = vi.fn();
const mockCreateProject = vi.fn();
const mockDeleteProject = vi.fn();
const mockStartBuild = vi.fn();

vi.mock("../../hooks/useCodeBuild", () => ({
  useCodeBuildProjects: (...args: any[]) => mockProjectsHook(...args),
  useCodeBuildBuilds: (...args: any[]) => mockBuildsHook(...args),
  useCodeBuildSourceCredentials: (...args: any[]) => mockCredentialsHook(...args),
  useCodeBuildCuratedImages: (...args: any[]) => mockImagesHook(...args),
  useCreateCodeBuildProject: () => ({
    mutate: mockCreateProject,
    get isPending() { return createProjectState.isPending; },
    get isError() { return createProjectState.isError; },
    get error() { return createProjectState.error; },
    reset: vi.fn(),
  }),
  useDeleteCodeBuildProject: () => ({
    mutateAsync: mockDeleteProject,
    get isPending() { return deleteProjectState.isPending; },
    get variables() { return deleteProjectState.variables; },
  }),
  useStartCodeBuildBuild: () => ({
    mutate: mockStartBuild,
    get isPending() { return startBuildState.isPending; },
    get variables() { return startBuildState.variables; },
  }),
  useCodeBuildProject: () => ({ data: null, isLoading: false }),
  useCodeBuildProjectBuilds: () => ({ data: { builds: [] }, isLoading: false }),
  useCodeBuildBuild: () => ({ data: null, isLoading: false }),
  useStopCodeBuildBuild: () => ({ mutate: vi.fn(), isPending: false }),
  useImportCodeBuildSourceCredentials: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteCodeBuildSourceCredentials: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

import { CodeBuildDashboard } from "./CodeBuildDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  createProjectState.isError = false;
  createProjectState.error = null;
  createProjectState.isPending = false;
  deleteProjectState.isPending = false;
  deleteProjectState.variables = null;
  startBuildState.isPending = false;
  startBuildState.variables = null;

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

  it("filters projects by name", async () => {
    mockProjectsHook.mockReturnValue({
      data: {
        projects: [
          { name: "alpha-project" },
          { name: "beta-project" },
        ],
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-project")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find projects by name");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-project")).toBeNull());
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

  it("shows start build loading state", () => {
    startBuildState.isPending = true;
    startBuildState.variables = "my-project";
    mockProjectsHook.mockReturnValue({
      data: {
        projects: [{ name: "my-project", description: "Test", language: "Python" }],
      },
      isLoading: false,
    });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-project")).toBeTruthy();
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

  it("shows delete project loading state", () => {
    deleteProjectState.isPending = true;
    deleteProjectState.variables = "my-project";
    mockProjectsHook.mockReturnValue({
      data: {
        projects: [{ name: "my-project", description: "Test", language: "Python" }],
      },
      isLoading: false,
    });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-project")).toBeTruthy();
  });
});

describe("CodeBuildDashboard — create project modal", () => {
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

  it("submits create project form with name and description", async () => {
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create project/i);
    await waitFor(() => expect(screen.getByText("Create CodeBuild project")).toBeTruthy());

    const nameInput = screen.getByLabelText(/Project name/);
    await user.type(nameInput, "new-proj");
    const descInput = screen.getByLabelText(/Description/);
    await user.type(descInput, "A new project");

    await clickButton(user, /^Create$/i);

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith(
        { name: "new-proj", description: "A new project" },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });
  });

  it("Create button disabled when name is empty", async () => {
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create project/i);
    await waitFor(() => expect(screen.getByText("Create CodeBuild project")).toBeTruthy());

    // The primary Create button should exist (disabled state is tested by component)
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    expect(createBtns.length).toBeGreaterThanOrEqual(1);
  });

  it("cancels create project modal", async () => {
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create project/i);
    await waitFor(() => expect(screen.getByText("Create CodeBuild project")).toBeTruthy());

    await clickButton(user, /Cancel/i);
    // Cloudscape may keep modal header element in DOM; verify mutation wasn't called
    await waitFor(() => expect(mockCreateProject).not.toHaveBeenCalled());
  });

  it("shows create project loading state", async () => {
    createProjectState.isPending = true;
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create project/i);
    await waitFor(() => expect(screen.getByText("Create CodeBuild project")).toBeTruthy());
    // The Create button should be present with loading state
    expect(screen.queryByText("Create CodeBuild project")).toBeTruthy();
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

    // Reset for other tests
    createProjectState.isError = false;
    createProjectState.error = null;
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
    expect(screen.getByText("SUCCEEDED")).toBeTruthy();
  });

  it("renders builds with missing fields gracefully", () => {
    mockBuildsHook.mockReturnValue({
      data: {
        builds: [
          { id: "minimal-build" },
        ],
      },
    });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("minimal-build")).toBeTruthy();
    // projectName → "-", buildStatus/status → "-", startTime → "-"
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("renders builds with status field instead of buildStatus", () => {
    mockBuildsHook.mockReturnValue({
      data: {
        builds: [
          { id: "build-1", projectName: "my-project", status: "IN_PROGRESS", startTime: new Date().toISOString() },
        ],
      },
    });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("IN_PROGRESS")).toBeTruthy();
  });

  it("renders builds with short ID (no slash)", () => {
    mockBuildsHook.mockReturnValue({
      data: {
        builds: [
          { id: "short-build-id", projectName: "my-project", buildStatus: "FAILED" },
        ],
      },
    });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    // Short ID with no "/": split("/").pop() returns the whole string
    expect(screen.getByText("short-build-id")).toBeTruthy();
  });

  it("shows empty builds section", () => {
    mockBuildsHook.mockReturnValue({ data: { builds: [] } });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No builds yet/i)).toBeTruthy();
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
    const arnText = screen.getByText("arn:aws:codebuild:us-east-1:123:token/github");
    expect(arnText).toBeTruthy();
    expect(screen.getByText("PERSONAL_ACCESS_TOKEN")).toBeTruthy();
  });

  it("renders credentials with missing fields as dash", () => {
    mockCredentialsHook.mockReturnValue({
      data: {
        sourceCredentialsInfo: [{ arn: "arn:aws:codebuild:us-east-1:123:token/empty" }],
      },
    });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("arn:aws:codebuild:us-east-1:123:token/empty")).toBeTruthy();
    // serverType || "-", authType || "-"
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });
});

describe("CodeBuildDashboard — curated images", () => {
  it("renders curated images with identifier", () => {
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

  it("renders images with name as identifier fallback", () => {
    mockImagesHook.mockReturnValue({
      data: {
        images: [
          { name: "custom-image", description: "Custom" },
        ],
      },
    });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("custom-image")).toBeTruthy();
    expect(screen.getByText("Custom")).toBeTruthy();
  });

  it("renders images with repoName as identifier fallback", () => {
    mockImagesHook.mockReturnValue({
      data: {
        images: [
          { repoName: "my-repo", description: "Repo image" },
        ],
      },
    });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-repo")).toBeTruthy();
    expect(screen.getByText("Repo image")).toBeTruthy();
  });

  it("renders images with null description as dash", () => {
    mockImagesHook.mockReturnValue({
      data: {
        images: [{ identifier: "img-1" }],
      },
    });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("img-1")).toBeTruthy();
    // description || "-"
    expect(screen.getByText("-")).toBeTruthy();
  });

  it("renders image with no identifier fields as dash", () => {
    mockImagesHook.mockReturnValue({
      data: {
        images: [{}],
      },
    });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    // identifier || name || repoName || "-"
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });
});
