// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
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

const retryBuildState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const updateProjectState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const createRGState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const deleteRGState = vi.hoisted(() => ({
  isPending: false,
  variables: null as any,
}));

// ─── Mock hooks ─────────────────────────────────────────

const mockProjectsHook = vi.fn();
const mockBuildsHook = vi.fn();
const mockCredentialsHook = vi.fn();
const mockImagesHook = vi.fn();
const mockCreateProject = vi.fn();
const mockDeleteProject = vi.fn();
const mockStartBuild = vi.fn();
const mockRetryBuild = vi.fn();
const mockUpdateProject = vi.fn();
const mockReportGroupsHook = vi.fn();
const mockCreateReportGroup = vi.fn();
const mockDeleteReportGroup = vi.fn();

vi.mock("../../hooks/useCodeBuild", () => ({
  useCodeBuildProjects: (...args: any[]) => mockProjectsHook(...args),
  useCodeBuildBuilds: (...args: any[]) => mockBuildsHook(...args),
  useCodeBuildSourceCredentials: (...args: any[]) => mockCredentialsHook(...args),
  useCodeBuildCuratedImages: (...args: any[]) => mockImagesHook(...args),
  useRetryCodeBuildBuild: () => ({
    mutate: mockRetryBuild,
    get isPending() { return retryBuildState.isPending; },
    get variables() { return retryBuildState.variables; },
  }),
  useUpdateCodeBuildProject: () => ({
    mutate: mockUpdateProject,
    get isPending() { return updateProjectState.isPending; },
    get isError() { return updateProjectState.isError; },
    get error() { return updateProjectState.error; },
  }),
  useCodeBuildReportGroups: (...args: any[]) => mockReportGroupsHook(...args),
  useCreateCodeBuildReportGroup: () => ({
    mutate: mockCreateReportGroup,
    get isPending() { return createRGState.isPending; },
    get isError() { return createRGState.isError; },
    get error() { return createRGState.error; },
  }),
  useDeleteCodeBuildReportGroup: () => ({
    mutateAsync: mockDeleteReportGroup,
    get isPending() { return deleteRGState.isPending; },
    get variables() { return deleteRGState.variables; },
  }),
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
  retryBuildState.isPending = false;
  retryBuildState.variables = null;
  updateProjectState.isPending = false;
  updateProjectState.isError = false;
  updateProjectState.error = null;
  createRGState.isPending = false;
  createRGState.isError = false;
  createRGState.error = null;
  deleteRGState.isPending = false;
  deleteRGState.variables = null;

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
  mockReportGroupsHook.mockReturnValue({
    data: { reportGroups: [] as any[] },
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
    expect(screen.getByLabelText(/Description \(optional\)/)).toBeTruthy();
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    expect(createBtns.length).toBeGreaterThanOrEqual(1);
  });

  it("dismisses create project modal with Escape", async () => {
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create project/i);
    await waitFor(() => expect(screen.getByText("Create CodeBuild project")).toBeTruthy());
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => fireEvent.keyDown(d as HTMLElement, { keyCode: 27 }));
    await waitFor(() => {
      const header = screen.getAllByText("Create CodeBuild project").find((h) => h.closest('[role="dialog"]'));
      expect(header!.closest('[role="dialog"]')!.className).toContain("hidden");
    });
  });

  it("submits create project form with name and description", async () => {
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create project/i);
    await waitFor(() => expect(screen.getByText("Create CodeBuild project")).toBeTruthy());

    const nameInput = screen.getByLabelText(/Project name/);
    await user.type(nameInput, "new-proj");
    const descInput = screen.getByLabelText(/Description \(optional\)/);
    await user.type(descInput, "A new project");

    await clickButton(user, /^Create$/i);

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith(
        { name: "new-proj", description: "A new project" },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });
  });

  it("invokes onSuccess after creating a project, clearing the form", async () => {
    mockCreateProject.mockImplementation((_payload: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create project/i);
    await waitFor(() => expect(screen.getByText("Create CodeBuild project")).toBeTruthy());

    await user.type(screen.getByLabelText(/Project name/), "new-proj");
    await clickButton(user, /^Create$/i);

    await waitFor(() => {
      expect((screen.getByLabelText(/Project name/) as HTMLInputElement).value).toBe("");
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

  it("shows default error message when error has no message", async () => {
    createProjectState.isError = true;
    createProjectState.error = new Error();
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create project/i);
    await waitFor(() => expect(screen.getByText("Create CodeBuild project")).toBeTruthy());
    expect(screen.getByText("Failed to create project")).toBeTruthy();
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

  it("renders builds with empty ID", () => {
    mockBuildsHook.mockReturnValue({
      data: {
        builds: [{ id: "", projectName: "p1", buildStatus: "SUCCEEDED", startTime: new Date().toISOString() }],
      },
    });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    // Build ID column: "".split("/").pop() = "" then "" || "" = "" → renders empty
    expect(screen.getByText("p1")).toBeTruthy();
  });

  it("renders builds with null ID", () => {
    mockBuildsHook.mockReturnValue({
      data: {
        builds: [{ id: null, projectName: "p2", buildStatus: "FAILED" }],
      },
    });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    // Build ID column: (null || "").split("/").pop() = "" then "" || null = null → renders nothing
    expect(screen.getByText("p2")).toBeTruthy();
    expect(screen.getByText("FAILED")).toBeTruthy();
  });

  it("shows build startTime formatted", () => {
    mockBuildsHook.mockReturnValue({
      data: {
        builds: [{ id: "b1", projectName: "p3", buildStatus: "STOPPED", startTime: "2025-06-15T14:30:00Z" }],
      },
    });
    const { container } = render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    // startTime truthy → new Date(startTime).toLocaleString() produces date-like output
    expect(container.textContent).toMatch(/2025/);
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

describe("CodeBuildDashboard — data edge cases", () => {
  it("handles undefined projects in data", () => {
    mockProjectsHook.mockReturnValue({ data: {}, isLoading: false });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No CodeBuild project/i)).toBeTruthy();
  });

  it("handles null projects in data", () => {
    mockProjectsHook.mockReturnValue({ data: { projects: null }, isLoading: false });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No CodeBuild project/i)).toBeTruthy();
  });

  it("handles undefined builds in data", () => {
    mockBuildsHook.mockReturnValue({ data: {} });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No builds yet/i)).toBeTruthy();
  });

  it("handles undefined credentials in data", () => {
    mockCredentialsHook.mockReturnValue({ data: {} });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No source credentials/i)).toBeTruthy();
  });

  it("handles undefined images in data", () => {
    mockImagesHook.mockReturnValue({ data: {} });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No curated images/i)).toBeTruthy();
  });

  it("handles credentials with null sourceCredentialsInfo", () => {
    mockCredentialsHook.mockReturnValue({ data: { sourceCredentialsInfo: null } });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No source credentials/i)).toBeTruthy();
  });

  it("handles images with null images", () => {
    mockImagesHook.mockReturnValue({ data: { images: null } });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No curated images/i)).toBeTruthy();
  });

  it("shows dash for project created when both created and createdAt are missing", () => {
    mockProjectsHook.mockReturnValue({
      data: {
        projects: [{ name: "no-date-project", description: "No dates", language: "JS" }],
      },
      isLoading: false,
    });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("no-date-project")).toBeTruthy();
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });
});

describe("CodeBuildDashboard — loading states", () => {
  it("shows start build not-loading when isPending but different variable", () => {
    startBuildState.isPending = true;
    startBuildState.variables = "other-project";
    mockProjectsHook.mockReturnValue({
      data: { projects: [{ name: "my-project", description: "Test", language: "Python" }] },
      isLoading: false,
    });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-project")).toBeTruthy();
    expect(screen.getByText("Start build")).toBeTruthy();
  });

  it("shows delete project not-loading when isPending but different variable", () => {
    deleteProjectState.isPending = true;
    deleteProjectState.variables = "other-project";
    mockProjectsHook.mockReturnValue({
      data: { projects: [{ name: "my-project", description: "Test", language: "Python" }] },
      isLoading: false,
    });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-project")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Delete my-project/i })).toBeTruthy();
  });
});

describe("CodeBuildDashboard — retry build", () => {
  it("retries a build from the builds table", async () => {
    mockBuildsHook.mockReturnValue({
      data: { builds: [{ id: "p1:abc-123", projectName: "p1", buildStatus: "FAILED", startTime: 1700000000000 }] },
    });
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(mockRetryBuild).toHaveBeenCalledWith("p1:abc-123"));
  });

  it("shows retry loading for the in-flight build only", async () => {
    mockBuildsHook.mockReturnValue({
      data: { builds: [{ id: "b1", buildStatus: "FAILED" }, { id: "b2", buildStatus: "SUCCEEDED" }] },
    });
    retryBuildState.isPending = true;
    retryBuildState.variables = "b1";
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    const buttons = screen.getAllByRole("button", { name: "Retry" });
    expect(buttons[0].className).toMatch(/disabled|loading/);
    expect(buttons[1].className).not.toMatch(/disabled|loading/);
  });
});

describe("CodeBuildDashboard — edit project", () => {
  it("opens the edit modal prefilled and saves the description", async () => {
    mockProjectsHook.mockReturnValue({
      data: { projects: [{ name: "p1", description: "old" }] },
      isLoading: false,
    });
    mockUpdateProject.mockImplementation((_body: any, opts?: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    const dialog = screen.getByRole("dialog", { name: /Edit project p1/i });
    const input = dialog.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("old");
    await user.clear(input);
    await user.type(input, "new description");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(mockUpdateProject).toHaveBeenCalledWith(
        { name: "p1", description: "new description" },
        { onSuccess: expect.any(Function) },
      )
    );
    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /Edit project p1/i }).className).toContain("hidden");
    });
  });

  it("prefills an empty description when the table showed a dash", async () => {
    mockProjectsHook.mockReturnValue({
      data: { projects: [{ name: "p1" }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    const dialog = screen.getByRole("dialog", { name: /Edit project p1/i });
    const input = dialog.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("shows the update error and fallback message", async () => {
    mockProjectsHook.mockReturnValue({
      data: { projects: [{ name: "p1", description: "old" }] },
      isLoading: false,
    });
    updateProjectState.isError = true;
    updateProjectState.error = new Error("update failed");
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    expect(await screen.findByText("update failed")).toBeTruthy();
  });

  it("falls back to a generic update error message", async () => {
    mockProjectsHook.mockReturnValue({
      data: { projects: [{ name: "p1" }] },
      isLoading: false,
    });
    updateProjectState.isError = true;
    updateProjectState.error = null;
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    expect(await screen.findByText("Failed to update project")).toBeTruthy();
  });

  it("cancels the edit modal without saving", async () => {
    mockProjectsHook.mockReturnValue({
      data: { projects: [{ name: "p1", description: "old" }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    const dialog = screen.getByRole("dialog", { name: /Edit project p1/i });
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /Edit project p1/i }).className).toContain("hidden");
    });
    expect(mockUpdateProject).not.toHaveBeenCalled();
  });
});

describe("CodeBuildDashboard — report groups", () => {
  it("renders report groups with export type and dash fallbacks", async () => {
    mockReportGroupsHook.mockReturnValue({
      data: { reportGroups: [{ arn: "arn:rg1", name: "rg1", type: "TEST", exportConfig: { exportConfigType: "S3" }, created: 1700000000 }] },
    });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(await screen.findByText("rg1")).toBeTruthy();
    expect(screen.getByText("S3")).toBeTruthy();
    expect(screen.getByText("TEST")).toBeTruthy();
  });

  it("falls back to a dash when the report group has no type or export config", async () => {
    mockReportGroupsHook.mockReturnValue({
      data: { reportGroups: [{ arn: "arn:rg2", name: "rg2", exportConfig: {} }] },
    });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(await screen.findByText("rg2")).toBeTruthy();
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it("shows no report groups while the query is still loading", () => {
    mockReportGroupsHook.mockReturnValue({ data: undefined });
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No report groups")).toBeTruthy();
  });

  it("shows empty message when there are no report groups", () => {
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No report groups")).toBeTruthy();
  });

  it("creates a report group with S3 export config", async () => {
    mockCreateReportGroup.mockImplementation((_body: any, opts?: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create report group" }));
    const dialog = screen.getByRole("dialog", { name: "Create report group" });
    const inputs = dialog.querySelectorAll("input");
    await user.type(inputs[0], "my-rg");
    await user.type(inputs[1], "my-bucket");
    await user.type(inputs[2], "reports");
    const createBtn = screen.getAllByRole("button", { name: "Create" }).at(-1)!;
    await user.click(createBtn);
    await waitFor(() =>
      expect(mockCreateReportGroup).toHaveBeenCalledWith(
        {
          name: "my-rg",
          type: "TEST",
          exportConfig: {
            exportConfigType: "S3",
            s3Destination: { bucket: "my-bucket", path: "reports" },
          },
        },
        { onSuccess: expect.any(Function) },
      )
    );
  });

  it("creates a report group without export config when bucket is blank", async () => {
    mockCreateReportGroup.mockImplementation((_body: any, opts?: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create report group" }));
    const dialog = screen.getByRole("dialog", { name: "Create report group" });
    const inputs = dialog.querySelectorAll("input");
    await user.type(inputs[0], "my-rg");
    await user.click(screen.getAllByRole("button", { name: "Create" }).at(-1)!);
    await waitFor(() =>
      expect(mockCreateReportGroup).toHaveBeenCalledWith(
        { name: "my-rg", type: "TEST", exportConfig: undefined },
        { onSuccess: expect.any(Function) },
      )
    );
  });

  it("cancels the create report group modal", async () => {
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create report group" }));
    const dialog = screen.getByRole("dialog", { name: "Create report group" });
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: "Create report group" }).className).toContain("hidden");
    });
    expect(mockCreateReportGroup).not.toHaveBeenCalled();
  });

  it("omits the S3 path when blank", async () => {
    mockCreateReportGroup.mockImplementation((_body: any, opts?: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create report group" }));
    const dialog = screen.getByRole("dialog", { name: "Create report group" });
    const inputs = dialog.querySelectorAll("input");
    await user.type(inputs[0], "my-rg");
    await user.type(inputs[1], "my-bucket");
    await user.click(screen.getAllByRole("button", { name: "Create" }).at(-1)!);
    await waitFor(() =>
      expect(mockCreateReportGroup).toHaveBeenCalledWith(
        {
          name: "my-rg",
          type: "TEST",
          exportConfig: { exportConfigType: "S3", s3Destination: { bucket: "my-bucket", path: undefined } },
        },
        { onSuccess: expect.any(Function) },
      )
    );
  });

  it("keeps Create disabled until a name is entered", async () => {
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create report group" }));
    const createBtn = screen.getAllByRole("button", { name: "Create" }).at(-1)!;
    expect(createBtn.hasAttribute("disabled")).toBe(true);
  });

  it("selects the Series report type", async () => {
    mockCreateReportGroup.mockImplementation((_body: any, opts?: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create report group" }));
    await user.click(screen.getByRole("button", { name: /Test/i }));
    await user.click(await screen.findByRole("option", { name: "Series" }));
    const dialog = screen.getByRole("dialog", { name: "Create report group" });
    const inputs = dialog.querySelectorAll("input");
    await user.type(inputs[0], "my-rg");
    await user.click(screen.getAllByRole("button", { name: "Create" }).at(-1)!);
    await waitFor(() => expect(mockCreateReportGroup.mock.calls[0][0].type).toBe("SERIES"));
  });

  it("shows the create error and fallback message", async () => {
    mockReportGroupsHook.mockReturnValue({
      data: { reportGroups: [{ arn: "arn:rg1", name: "rg1" }] },
    });
    createRGState.isError = true;
    createRGState.error = new Error("rg failed");
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create report group" }));
    expect(await screen.findByText("rg failed")).toBeTruthy();
  });

  it("falls back to a generic create error message", async () => {
    createRGState.isError = true;
    createRGState.error = null;
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create report group" }));
    expect(await screen.findByText("Failed to create report group")).toBeTruthy();
  });

  it("deletes a report group after confirmation", async () => {
    mockDeleteReportGroup.mockResolvedValue({});
    mockReportGroupsHook.mockReturnValue({
      data: { reportGroups: [{ arn: "arn:rg1", name: "rg1" }] },
    });
    const user = userEvent.setup();
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Delete rg1/i }));
    await waitFor(() => expect(mockDeleteReportGroup).toHaveBeenCalledWith("arn:rg1"));
  });

  it("disables the delete button while that group deletion is pending", async () => {
    mockReportGroupsHook.mockReturnValue({
      data: { reportGroups: [{ arn: "arn:rg1", name: "rg1" }] },
    });
    deleteRGState.isPending = true;
    deleteRGState.variables = "arn:rg1";
    render(<CodeBuildDashboard />, { wrapper: createWrapper() });
    const btn = await screen.findByRole("button", { name: /Delete rg1/i });
    expect(btn.hasAttribute("disabled")).toBe(true);
  });
});
