// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

/** Fire Escape on every mounted Cloudscape dialog (fires onDismiss). */
function dismissModalWithEscape() {
  document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
    fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27, key: "Escape" });
  });
}

const untagState = vi.hoisted(() => ({
  isPending: false,
  variables: null as any,
}));

const disassociateState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const mockAssociations = vi.fn();
const mockTags = vi.fn();
const mockAssociateMutate = vi.fn(() => Promise.resolve({}));
const mockDisassociateMutate = vi.fn(() => Promise.resolve({}));
const mockTagMutate = vi.fn(() => Promise.resolve({}));
const mockUntagMutate = vi.fn(() => Promise.resolve({}));
const mockShowToast = vi.fn();

vi.mock("../../hooks/useCodeGuruReviewer", () => ({
  useRepositoryAssociations: (...args: any[]) => mockAssociations(...args),
  useCodeGuruTags: (...args: any[]) => mockTags(...args),
  useAssociateRepository: () => ({ mutateAsync: mockAssociateMutate, isPending: false }),
  useDisassociateRepository: () => ({
    mutateAsync: mockDisassociateMutate,
    get isPending() { return disassociateState.isPending; },
    get variables() { return disassociateState.variables; },
  }),
  useCodeGuruTagResource: () => ({ mutateAsync: mockTagMutate, isPending: false }),
  useCodeGuruUntagResource: () => ({
    mutateAsync: mockUntagMutate,
    get isPending() { return untagState.isPending; },
    get variables() { return untagState.variables; },
  }),
}));

vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

// Mock Cloudscape Select so provider options are clickable buttons
vi.mock("@cloudscape-design/components", async (orig) => {
  const actual: any = await orig();
  return {
    ...actual,
    Select: ({ selectedOption, onChange, options }: any) => (
      <div data-testid="mock-select">
        {options?.map((o: any) => (
          <button
            key={o.value}
            data-testid={`opt-${o.value}`}
            onClick={() => onChange?.({ detail: { selectedOption: o } })}
          >
            {o.label}
          </button>
        ))}
      </div>
    ),
  };
});

import { CodeGuruReviewerDashboard } from "./CodeGuruReviewerDashboard";

const assocRow = {
  AssociationArn: "arn:aws:codeguru-reviewer:us-east-1:123456789012:association/abc",
  AssociationId: "abc",
  Name: "my-repo",
  Owner: "123456789012",
  ProviderType: "GitHub",
  State: "Associated",
};

beforeEach(() => {
  vi.clearAllMocks();
  untagState.isPending = false;
  untagState.variables = null;
  disassociateState.isPending = false;
  disassociateState.variables = null;
  mockAssociateMutate.mockImplementation(() => Promise.resolve({}));
  mockDisassociateMutate.mockImplementation(() => Promise.resolve({}));
  mockTagMutate.mockImplementation(() => Promise.resolve({}));
  mockUntagMutate.mockImplementation(() => Promise.resolve({}));
  mockTags.mockReturnValue({ data: { tags: {} }, isLoading: false });
  mockAssociations.mockReturnValue({ data: { associations: [], total: 0 }, isLoading: false });
});

describe("CodeGuruReviewerDashboard", () => {
  it("renders the header", () => {
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("CodeGuru Reviewer")).toBeTruthy();
  });

  it("shows loading skeleton", () => {
    mockAssociations.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty message when no associations", () => {
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No repository associations/i)).toBeTruthy();
  });

  it("renders association rows", () => {
    mockAssociations.mockReturnValue({
      data: { associations: [assocRow], total: 1 },
      isLoading: false,
    });
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-repo")).toBeTruthy();
    expect(screen.getByText("123456789012")).toBeTruthy();
    expect(screen.getAllByText("GitHub").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Associated")).toBeTruthy();
  });

  it("shows dashes for sparse rows", () => {
    mockAssociations.mockReturnValue({
      data: {
        associations: [{ AssociationArn: "arn:aws:codeguru-reviewer:x", State: "Associated" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("Associated")).toBeTruthy();
  });

  it("shows UNKNOWN state when State is missing", () => {
    mockAssociations.mockReturnValue({
      data: {
        associations: [{ AssociationArn: "arn:aws:codeguru-reviewer:ns", Name: "no-state" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("UNKNOWN")).toBeTruthy();
  });

  it("shows non-Associated state as error indicator", () => {
    mockAssociations.mockReturnValue({
      data: { associations: [{ ...assocRow, State: "Failed" }], total: 1 },
      isLoading: false,
    });
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed")).toBeTruthy();
  });

  it("shows Associating state as in-progress indicator", () => {
    mockAssociations.mockReturnValue({
      data: { associations: [{ ...assocRow, State: "Associating" }], total: 1 },
      isLoading: false,
    });
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Associating")).toBeTruthy();
  });

  it("associates a GitHub repository with owner", async () => {
    const user = userEvent.setup();
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^Create Repository association$/ }));
    await user.type(screen.getByLabelText("Repository name"), "my-repo");
    await user.type(screen.getByLabelText("Owner (account ID or organization)"), "123456789012");
    await user.click(screen.getByRole("button", { name: "Associate repository" }));
    await waitFor(() =>
      expect(mockAssociateMutate).toHaveBeenCalledWith({
        Repository: { GitHub: { Name: "my-repo", Owner: "123456789012" } },
      })
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Repository my-repo associated");
  });

  it("associates an S3 bucket repository without owner field", async () => {
    const user = userEvent.setup();
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^Create Repository association$/ }));
    await user.click(screen.getByTestId("opt-S3Bucket"));
    expect(screen.queryByLabelText("Owner (account ID or organization)")).toBeNull();
    await user.type(screen.getByLabelText("Repository name"), "my-bucket");
    await user.click(screen.getByRole("button", { name: "Associate repository" }));
    await waitFor(() =>
      expect(mockAssociateMutate).toHaveBeenCalledWith({
        Repository: { S3Bucket: { Name: "my-bucket", Owner: undefined } },
      })
    );
  });

  it("associates a CodeCommit repository without owner field", async () => {
    const user = userEvent.setup();
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^Create Repository association$/ }));
    await user.click(screen.getByTestId("opt-CodeCommit"));
    expect(screen.queryByLabelText("Owner (account ID or organization)")).toBeNull();
    await user.type(screen.getByLabelText("Repository name"), "my-codecommit");
    await user.click(screen.getByRole("button", { name: "Associate repository" }));
    await waitFor(() =>
      expect(mockAssociateMutate).toHaveBeenCalledWith({
        Repository: { CodeCommit: { Name: "my-codecommit", Owner: undefined } },
      })
    );
  });

  it("associates a Bitbucket repository with empty owner omitted", async () => {
    const user = userEvent.setup();
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^Create Repository association$/ }));
    await user.click(screen.getByTestId("opt-Bitbucket"));
    await user.type(screen.getByLabelText("Repository name"), "bb-repo");
    await user.click(screen.getByRole("button", { name: "Associate repository" }));
    await waitFor(() =>
      expect(mockAssociateMutate).toHaveBeenCalledWith({
        Repository: { Bitbucket: { Name: "bb-repo", Owner: undefined } },
      })
    );
  });

  it("shows create error when the API fails", async () => {
    mockAssociateMutate.mockRejectedValueOnce(new Error("associate failed"));
    const user = userEvent.setup();
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^Create Repository association$/ }));
    await user.type(screen.getByLabelText("Repository name"), "my-repo");
    await user.click(screen.getByRole("button", { name: "Associate repository" }));
    expect(await screen.findByText("associate failed")).toBeTruthy();
  });

  it("shows the fallback create error for non-Error rejections", async () => {
    mockAssociateMutate.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^Create Repository association$/ }));
    await user.type(screen.getByLabelText("Repository name"), "my-repo");
    await user.click(screen.getByRole("button", { name: "Associate repository" }));
    expect(await screen.findByText("Failed to associate repository")).toBeTruthy();
  });

  it("disables create submit on empty name", async () => {
    const user = userEvent.setup();
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^Create Repository association$/ }));
    expect(
      (screen.getByRole("button", { name: "Associate repository" }) as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it("disassociates a repository", async () => {
    mockAssociations.mockReturnValue({
      data: { associations: [assocRow], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete my-repo/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Delete$/i }));
    await waitFor(() => expect(mockDisassociateMutate).toHaveBeenCalledWith(assocRow.AssociationArn));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Repository my-repo disassociated");
  });

  it("shows disassociate error toast when the API fails", async () => {
    mockAssociations.mockReturnValue({
      data: { associations: [assocRow], total: 1 },
      isLoading: false,
    });
    mockDisassociateMutate.mockRejectedValueOnce(new Error("disassociate failed"));
    const user = userEvent.setup();
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete my-repo/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Delete$/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "disassociate failed"));
  });

  it("shows the fallback disassociate error for non-Error rejections", async () => {
    mockAssociations.mockReturnValue({
      data: { associations: [assocRow], total: 1 },
      isLoading: false,
    });
    mockDisassociateMutate.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete my-repo/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Delete$/i }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to disassociate repository")
    );
  });

  it("shows disassociate row loading only for the matching association", () => {
    disassociateState.isPending = true;
    disassociateState.variables = assocRow.AssociationArn;
    mockAssociations.mockReturnValue({
      data: { associations: [assocRow], total: 1 },
      isLoading: false,
    });
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-repo")).toBeTruthy();
  });

  it("does not show disassociate loading for a different association", () => {
    disassociateState.isPending = true;
    disassociateState.variables = "arn:aws:codeguru-reviewer:other";
    mockAssociations.mockReturnValue({
      data: { associations: [assocRow], total: 1 },
      isLoading: false,
    });
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-repo")).toBeTruthy();
  });

  it("filters associations by name", async () => {
    mockAssociations.mockReturnValue({
      data: {
        associations: [assocRow, { ...assocRow, Name: "other", AssociationArn: "arn:x" }],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Find associations by name"), "other");
    await waitFor(() => expect(screen.queryByText("my-repo")).toBeNull());
  });

  it("filters without failing when a row has no name", async () => {
    mockAssociations.mockReturnValue({
      data: {
        associations: [{ AssociationArn: "arn:aws:codeguru-reviewer:x", State: "Associated" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("Associated")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Find associations by name"), "nomatch");
    await waitFor(() => expect(screen.queryByText("Associated")).toBeNull());
  });

  it("opens the tags modal and shows empty state", async () => {
    mockAssociations.mockReturnValue({
      data: { associations: [assocRow], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    expect(await screen.findByText(/Tags for/)).toBeTruthy();
    expect(await screen.findByText("No tags on this association.")).toBeTruthy();
  });

  it("shows the tags empty state when the tags payload is undefined", async () => {
    mockAssociations.mockReturnValue({
      data: { associations: [assocRow], total: 1 },
      isLoading: false,
    });
    mockTags.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    expect(await screen.findByText("No tags on this association.")).toBeTruthy();
  });

  it("shows the tags loading state", async () => {
    mockAssociations.mockReturnValue({
      data: { associations: [assocRow], total: 1 },
      isLoading: false,
    });
    mockTags.mockReturnValue({ data: undefined, isLoading: true });
    const user = userEvent.setup();
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    expect(await screen.findByText(/Loading tags/)).toBeTruthy();
  });

  it("adds a tag from the tags modal", async () => {
    mockAssociations.mockReturnValue({
      data: { associations: [assocRow], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    await user.type(screen.getByLabelText("Tag key"), "env");
    await user.type(screen.getByLabelText("Tag value"), "prod");
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    await waitFor(() =>
      expect(mockTagMutate).toHaveBeenCalledWith({
        resourceArn: assocRow.AssociationArn,
        tags: { env: "prod" },
      })
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Tag env added");
  });

  it("shows tag add error toast", async () => {
    mockAssociations.mockReturnValue({
      data: { associations: [assocRow], total: 1 },
      isLoading: false,
    });
    mockTagMutate.mockRejectedValueOnce(new Error("tag failed"));
    const user = userEvent.setup();
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    await user.type(screen.getByLabelText("Tag key"), "env");
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "tag failed"));
  });

  it("shows the fallback add-tag error for non-Error rejections", async () => {
    mockAssociations.mockReturnValue({
      data: { associations: [assocRow], total: 1 },
      isLoading: false,
    });
    mockTagMutate.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    await user.type(screen.getByLabelText("Tag key"), "env");
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to add tag")
    );
  });

  it("disables Add tag on empty key", async () => {
    mockAssociations.mockReturnValue({
      data: { associations: [assocRow], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    expect(
      (screen.getByRole("button", { name: "Add tag" }) as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it("removes an existing tag", async () => {
    mockAssociations.mockReturnValue({
      data: { associations: [assocRow], total: 1 },
      isLoading: false,
    });
    mockTags.mockReturnValue({ data: { tags: { env: "prod" } }, isLoading: false });
    const user = userEvent.setup();
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    expect(await screen.findByText("env")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() =>
      expect(mockUntagMutate).toHaveBeenCalledWith({
        resourceArn: assocRow.AssociationArn,
        tagKeys: ["env"],
      })
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Tag env removed");
  });

  it("shows tag remove error toast", async () => {
    mockAssociations.mockReturnValue({
      data: { associations: [assocRow], total: 1 },
      isLoading: false,
    });
    mockTags.mockReturnValue({ data: { tags: { env: "prod" } }, isLoading: false });
    mockUntagMutate.mockRejectedValueOnce(new Error("untag failed"));
    const user = userEvent.setup();
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    await waitFor(() => expect(screen.getByText("env")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "untag failed"));
  });

  it("shows the fallback remove-tag error for non-Error rejections", async () => {
    mockAssociations.mockReturnValue({
      data: { associations: [assocRow], total: 1 },
      isLoading: false,
    });
    mockTags.mockReturnValue({ data: { tags: { env: "prod" } }, isLoading: false });
    mockUntagMutate.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    await waitFor(() => expect(screen.getByText("env")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to remove tag")
    );
  });

  it("shows the Remove button as loading while its own untag is pending", async () => {
    mockAssociations.mockReturnValue({
      data: { associations: [assocRow], total: 1 },
      isLoading: false,
    });
    mockTags.mockReturnValue({ data: { tags: { env: "prod" } }, isLoading: false });
    untagState.isPending = true;
    untagState.variables = { resourceArn: assocRow.AssociationArn, tagKeys: ["env"] };
    const user = userEvent.setup();
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    await waitFor(() => expect(screen.getByText("env")).toBeTruthy());
    expect(screen.getByRole("button", { name: "Remove" })).toBeTruthy();
  });

  it("does not show Remove loading when a different tag key is pending", async () => {
    mockAssociations.mockReturnValue({
      data: { associations: [assocRow], total: 1 },
      isLoading: false,
    });
    mockTags.mockReturnValue({ data: { tags: { env: "prod" } }, isLoading: false });
    untagState.isPending = true;
    untagState.variables = { resourceArn: assocRow.AssociationArn, tagKeys: ["other"] };
    const user = userEvent.setup();
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-repo")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    await waitFor(() => expect(screen.getByText("env")).toBeTruthy());
    expect(screen.getByRole("button", { name: "Remove" })).toBeTruthy();
  });

  it("closes the create modal with Escape", async () => {
    const user = userEvent.setup();
    render(<CodeGuruReviewerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^Create Repository association$/ }));
    dismissModalWithEscape();
    const header = screen
      .getAllByText("Associate repository")
      .find((h) => h.closest('[role="dialog"]'));
    const dialog = header!.closest('[role="dialog"]') as HTMLElement;
    expect(dialog.className).toContain("hidden");
    expect(mockAssociateMutate).not.toHaveBeenCalled();
  });
});
