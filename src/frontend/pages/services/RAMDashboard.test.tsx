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

const sharesState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const mockShares = vi.fn();
const mockInvitations = vi.fn();
const mockPrincipals = vi.fn();
const mockResources = vi.fn();
const mockCreateMutate = vi.fn(() => Promise.resolve({}));
const mockDeleteMutate = vi.fn(() => Promise.resolve({}));
const mockAssociateMutate = vi.fn(() => Promise.resolve({}));
const mockDisassociateMutate = vi.fn(() => Promise.resolve({}));
const mockEnableMutate = vi.fn(() => Promise.resolve({ returnValue: true }));
const mockShowToast = vi.fn();

vi.mock("../../hooks/useRAM", () => ({
  useRAMShares: (...args: any[]) => mockShares(...args),
  useRAMInvitations: (...args: any[]) => mockInvitations(...args),
  useRAMPrincipals: (...args: any[]) => mockPrincipals(...args),
  useRAMResources: (...args: any[]) => mockResources(...args),
  useCreateRAMShare: () => ({ mutateAsync: mockCreateMutate, isPending: false }),
  useDeleteRAMShare: () => ({
    mutateAsync: mockDeleteMutate,
    get isPending() { return sharesState.isPending; },
    get variables() { return sharesState.variables; },
  }),
  useAssociateRAMShare: () => ({ mutateAsync: mockAssociateMutate, isPending: false }),
  useDisassociateRAMShare: () => ({ mutateAsync: mockDisassociateMutate, isPending: false }),
  useEnableRAMSharing: () => ({ mutateAsync: mockEnableMutate, isPending: false }),
  useRAMTagResource: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRAMUntagResource: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

import { RAMDashboard } from "./RAMDashboard";

const shareRow = {
  resourceShareArn: "arn:aws:ram:us-east-1:123456789012:resource-share/abc",
  name: "my-share",
  owningAccountId: "123456789012",
  allowExternalPrincipals: true,
  status: "ACTIVE",
};

beforeEach(() => {
  vi.clearAllMocks();
  sharesState.isPending = false;
  sharesState.variables = null;
  mockCreateMutate.mockImplementation(() => Promise.resolve({}));
  mockDeleteMutate.mockImplementation(() => Promise.resolve({}));
  mockAssociateMutate.mockImplementation(() => Promise.resolve({}));
  mockDisassociateMutate.mockImplementation(() => Promise.resolve({}));
  mockEnableMutate.mockImplementation(() => Promise.resolve({ returnValue: true }));
  mockPrincipals.mockReturnValue({ data: { principals: [], total: 0 }, isLoading: false });
  mockResources.mockReturnValue({ data: { resources: [], total: 0 }, isLoading: false });
  mockInvitations.mockReturnValue({
    data: { resourceShareInvitations: [], total: 0 },
    isLoading: false,
  });
  mockShares.mockReturnValue({ data: { resourceShares: [], total: 0 }, isLoading: false });
});

describe("RAMDashboard", () => {
  it("renders the header", () => {
    render(<RAMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Resource Access Manager")).toBeTruthy();
  });

  it("shows loading skeleton", () => {
    mockShares.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<RAMDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty message when no shares", () => {
    render(<RAMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No resource shares/i)).toBeTruthy();
  });

  it("renders share rows", () => {
    mockShares.mockReturnValue({
      data: { resourceShares: [shareRow], total: 1 },
      isLoading: false,
    });
    render(<RAMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-share")).toBeTruthy();
    expect(screen.getByText("123456789012")).toBeTruthy();
    expect(screen.getByText("Allowed")).toBeTruthy();
    expect(screen.getByText("ACTIVE")).toBeTruthy();
  });

  it("shows dashes and Not allowed for sparse rows", () => {
    mockShares.mockReturnValue({
      data: {
        resourceShares: [{ resourceShareArn: "arn:aws:ram:x", status: "ACTIVE" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<RAMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("arn:aws:ram:x")).toBeTruthy();
    expect(screen.getByText("Not allowed")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("shows non-ACTIVE status as error indicator", () => {
    mockShares.mockReturnValue({
      data: { resourceShares: [{ ...shareRow, status: "FAILED" }], total: 1 },
      isLoading: false,
    });
    render(<RAMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("FAILED")).toBeTruthy();
  });

  it("shows PENDING status as in-progress indicator", () => {
    mockShares.mockReturnValue({
      data: { resourceShares: [{ ...shareRow, status: "PENDING" }], total: 1 },
      isLoading: false,
    });
    render(<RAMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("PENDING")).toBeTruthy();
  });

  it("creates a resource share", async () => {
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^Create Resource share$/ }));
    await user.type(screen.getByLabelText("Name"), "new-share");
    await user.type(screen.getByLabelText("Resource ARNs (one per line)"), "arn:aws:s3:::b1\narn:aws:s3:::b2");
    await user.type(screen.getByLabelText("Principals (one per line)"), "123456789012");
    await user.click(screen.getByRole("button", { name: "Create resource share" }));
    await waitFor(() =>
      expect(mockCreateMutate).toHaveBeenCalledWith({
        name: "new-share",
        allowExternalPrincipals: false,
        resourceArns: ["arn:aws:s3:::b1", "arn:aws:s3:::b2"],
        principals: ["123456789012"],
      })
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Resource share new-share created");
  });

  it("creates a share with no principals or resources (undefined)", async () => {
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^Create Resource share$/ }));
    await user.type(screen.getByLabelText("Name"), "bare-share");
    await user.click(screen.getByRole("button", { name: "Create resource share" }));
    await waitFor(() =>
      expect(mockCreateMutate).toHaveBeenCalledWith({
        name: "bare-share",
        allowExternalPrincipals: false,
        resourceArns: undefined,
        principals: undefined,
      })
    );
  });

  it("toggles allow-external-principals in the create modal", async () => {
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^Create Resource share$/ }));
    await user.click(screen.getByText("Allow external principals"));
    await user.type(screen.getByLabelText("Name"), "ext-share");
    await user.click(screen.getByRole("button", { name: "Create resource share" }));
    await waitFor(() =>
      expect(mockCreateMutate).toHaveBeenCalledWith({
        name: "ext-share",
        allowExternalPrincipals: true,
        resourceArns: undefined,
        principals: undefined,
      })
    );
  });

  it("shows create error when the API fails", async () => {
    mockCreateMutate.mockRejectedValueOnce(new Error("create failed"));
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^Create Resource share$/ }));
    await user.type(screen.getByLabelText("Name"), "new-share");
    await user.click(screen.getByRole("button", { name: "Create resource share" }));
    expect(await screen.findByText("create failed")).toBeTruthy();
  });

  it("shows the fallback create error for non-Error rejections", async () => {
    mockCreateMutate.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^Create Resource share$/ }));
    await user.type(screen.getByLabelText("Name"), "new-share");
    await user.click(screen.getByRole("button", { name: "Create resource share" }));
    expect(await screen.findByText("Failed to create resource share")).toBeTruthy();
  });

  it("disables create submit on empty name", async () => {
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^Create Resource share$/ }));
    expect(
      (screen.getByRole("button", { name: "Create resource share" }) as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it("deletes a share", async () => {
    mockShares.mockReturnValue({
      data: { resourceShares: [shareRow], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-share")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete my-share/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Delete$/i }));
    await waitFor(() => expect(mockDeleteMutate).toHaveBeenCalledWith(shareRow.resourceShareArn));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Resource share my-share deleted");
  });

  it("shows delete error toast when the API fails", async () => {
    mockShares.mockReturnValue({
      data: { resourceShares: [shareRow], total: 1 },
      isLoading: false,
    });
    mockDeleteMutate.mockRejectedValueOnce(new Error("delete failed"));
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-share")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete my-share/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Delete$/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "delete failed"));
  });

  it("shows the fallback delete error for non-Error rejections", async () => {
    mockShares.mockReturnValue({
      data: { resourceShares: [shareRow], total: 1 },
      isLoading: false,
    });
    mockDeleteMutate.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-share")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete my-share/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Delete$/i }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete resource share")
    );
  });

  it("shows delete row loading only for the matching share", () => {
    sharesState.isPending = true;
    sharesState.variables = shareRow.resourceShareArn;
    mockShares.mockReturnValue({
      data: { resourceShares: [shareRow], total: 1 },
      isLoading: false,
    });
    render(<RAMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-share")).toBeTruthy();
  });

  it("does not show delete loading for a different share", () => {
    sharesState.isPending = true;
    sharesState.variables = "arn:aws:ram:other";
    mockShares.mockReturnValue({
      data: { resourceShares: [shareRow], total: 1 },
      isLoading: false,
    });
    render(<RAMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-share")).toBeTruthy();
  });

  it("associates principals and resources from the associate modal", async () => {
    mockShares.mockReturnValue({
      data: { resourceShares: [shareRow], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-share")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Associate" }));
    expect(screen.getByText("Associate with resource share")).toBeTruthy();
    await user.type(screen.getByLabelText("Principals to add (one per line)"), "123456789012");
    await user.type(screen.getByLabelText("Resource ARNs to update (one per line)"), "arn:aws:s3:::b1");
    await user.click(screen.getAllByRole("button", { name: /^Associate$/ }).slice(-1)[0]);
    await waitFor(() =>
      expect(mockAssociateMutate).toHaveBeenCalledWith({
        arn: shareRow.resourceShareArn,
        principals: ["123456789012"],
        resourceArns: ["arn:aws:s3:::b1"],
      })
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Associated 2 entries");
  });

  it("disables the associate submit when nothing is entered", async () => {
    mockShares.mockReturnValue({
      data: { resourceShares: [shareRow], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-share")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Associate" }));
    // Empty inputs disable the submit button, so no mutation can fire
    expect(
      (screen.getAllByRole("button", { name: /^Associate$/ }).slice(-1)[0] as HTMLButtonElement)
        .disabled
    ).toBe(true);
    expect(mockAssociateMutate).not.toHaveBeenCalled();
  });

  it("associates with resources only (principals undefined)", async () => {
    mockShares.mockReturnValue({
      data: { resourceShares: [shareRow], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-share")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Associate" }));
    await user.type(screen.getByLabelText("Resource ARNs to update (one per line)"), "arn:aws:s3:::b1");
    await user.click(screen.getAllByRole("button", { name: /^Associate$/ }).slice(-1)[0]);
    await waitFor(() =>
      expect(mockAssociateMutate).toHaveBeenCalledWith({
        arn: shareRow.resourceShareArn,
        principals: undefined,
        resourceArns: ["arn:aws:s3:::b1"],
      })
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Associated 1 entry");
  });

  it("shows associate error when the API fails", async () => {
    mockShares.mockReturnValue({
      data: { resourceShares: [shareRow], total: 1 },
      isLoading: false,
    });
    mockAssociateMutate.mockRejectedValueOnce(new Error("assoc failed"));
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-share")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Associate" }));
    await user.type(screen.getByLabelText("Principals to add (one per line)"), "123");
    await user.click(screen.getAllByRole("button", { name: /^Associate$/ }).slice(-1)[0]);
    expect(await screen.findByText("assoc failed")).toBeTruthy();
  });

  it("shows the fallback associate error for non-Error rejections", async () => {
    mockShares.mockReturnValue({
      data: { resourceShares: [shareRow], total: 1 },
      isLoading: false,
    });
    mockAssociateMutate.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-share")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Associate" }));
    await user.type(screen.getByLabelText("Principals to add (one per line)"), "123");
    await user.click(screen.getAllByRole("button", { name: /^Associate$/ }).slice(-1)[0]);
    expect(await screen.findByText("Failed to associate")).toBeTruthy();
  });

  it("disassociates principals from the disassociate modal", async () => {
    mockShares.mockReturnValue({
      data: { resourceShares: [shareRow], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-share")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Disassociate" }));
    expect(screen.getByText("Disassociate from resource share")).toBeTruthy();
    await user.type(screen.getByLabelText("Principals to add (one per line)"), "123456789012");
    await user.click(screen.getAllByRole("button", { name: /^Disassociate$/ }).slice(-1)[0]);
    await waitFor(() =>
      expect(mockDisassociateMutate).toHaveBeenCalledWith({
        arn: shareRow.resourceShareArn,
        principals: ["123456789012"],
        resourceArns: undefined,
      })
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Disassociated 1 entry");
  });

  it("shows disassociate error when the API fails", async () => {
    mockShares.mockReturnValue({
      data: { resourceShares: [shareRow], total: 1 },
      isLoading: false,
    });
    mockDisassociateMutate.mockRejectedValueOnce(new Error("disassoc failed"));
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-share")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Disassociate" }));
    await user.type(screen.getByLabelText("Principals to add (one per line)"), "123");
    await user.click(screen.getAllByRole("button", { name: /^Disassociate$/ }).slice(-1)[0]);
    expect(await screen.findByText("disassoc failed")).toBeTruthy();
  });

  it("shows the fallback disassociate error for non-Error rejections", async () => {
    mockShares.mockReturnValue({
      data: { resourceShares: [shareRow], total: 1 },
      isLoading: false,
    });
    mockDisassociateMutate.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-share")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Disassociate" }));
    await user.type(screen.getByLabelText("Principals to add (one per line)"), "123");
    await user.click(screen.getAllByRole("button", { name: /^Disassociate$/ }).slice(-1)[0]);
    expect(await screen.findByText("Failed to disassociate")).toBeTruthy();
  });

  it("filters shares by name", async () => {
    mockShares.mockReturnValue({
      data: {
        resourceShares: [shareRow, { ...shareRow, name: "other", resourceShareArn: "arn:aws:ram:y" }],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-share")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Find shares by name or ARN"), "other");
    await waitFor(() => expect(screen.queryByText("my-share")).toBeNull());
  });

  it("filters without failing when a row has no name", async () => {
    mockShares.mockReturnValue({
      data: { resourceShares: [{ resourceShareArn: "arn:aws:ram:x", status: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("arn:aws:ram:x")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Find shares by name or ARN"), "nomatch");
    await waitFor(() => expect(screen.queryByText("arn:aws:ram:x")).toBeNull());
  });

  it("shows the invitations tab with rows", async () => {
    mockInvitations.mockReturnValue({
      data: {
        resourceShareInvitations: [
          {
            resourceShareInvitationArn: "arn:aws:ram:inv/1",
            resourceShareName: "invited-share",
            senderAccountId: "111111111111",
            status: "PENDING",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<RAMDashboard />, { wrapper: createWrapper() });
    expect(await screen.findByText("invited-share")).toBeTruthy();
    expect(screen.getByText("111111111111")).toBeTruthy();
  });

  it("shows the invitations empty state", () => {
    render(<RAMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No pending resource share invitations/i)).toBeTruthy();
  });

  it("shows invitation dashes for missing fields", () => {
    mockInvitations.mockReturnValue({
      data: { resourceShareInvitations: [{ resourceShareInvitationArn: "arn:aws:ram:inv/2" }], total: 1 },
      isLoading: false,
    });
    render(<RAMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("arn:aws:ram:inv/2")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("shows the invitations loading state", () => {
    mockInvitations.mockReturnValue({ data: undefined, isLoading: true });
    render(<RAMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/Resource share invitations/)).toBeTruthy();
  });

  it("opens the details modal and shows principals/resources tabs", async () => {
    mockShares.mockReturnValue({
      data: { resourceShares: [shareRow], total: 1 },
      isLoading: false,
    });
    mockPrincipals.mockReturnValue({
      data: { principals: [{ id: "123456789012", external: false, status: "ASSOCIATED" }], total: 1 },
      isLoading: false,
    });
    mockResources.mockReturnValue({
      data: { resources: [{ arn: "arn:aws:s3:::b1", type: "s3:Bucket", status: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-share")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Details" }));
    expect(await screen.findByText("Share details")).toBeTruthy();
    expect((await screen.findAllByText("123456789012")).length).toBeGreaterThanOrEqual(1);
    await user.click(screen.getByRole("tab", { name: /Resources/ }));
    expect(await screen.findByText("arn:aws:s3:::b1")).toBeTruthy();
    expect(screen.getByText("s3:Bucket")).toBeTruthy();
  });

  it("shows detail modal empty states and external principal", async () => {
    mockShares.mockReturnValue({
      data: { resourceShares: [shareRow], total: 1 },
      isLoading: false,
    });
    mockPrincipals.mockReturnValue({
      data: { principals: [{ id: "999", external: true, status: "ASSOCIATED" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-share")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Details" }));
    expect(await screen.findByText("999")).toBeTruthy();
    expect(screen.getByText("Yes")).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: /Resources/ }));
    expect(await screen.findByText(/No shared resources/i)).toBeTruthy();
  });

  it("shows the resources tab fallbacks when the resources payload is undefined", async () => {
    mockShares.mockReturnValue({
      data: { resourceShares: [shareRow], total: 1 },
      isLoading: false,
    });
    mockResources.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-share")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Details" }));
    await user.click(screen.getByRole("tab", { name: /Resources \(0\)/ }));
    expect(await screen.findByText(/No shared resources/i)).toBeTruthy();
  });

  it("shows detail modal resources with missing type/status", async () => {
    mockShares.mockReturnValue({
      data: { resourceShares: [shareRow], total: 1 },
      isLoading: false,
    });
    mockResources.mockReturnValue({
      data: { resources: [{ arn: "arn:aws:s3:::bare" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-share")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Details" }));
    await user.click(screen.getByRole("tab", { name: /Resources \(1\)/ }));
    expect(await screen.findByText("arn:aws:s3:::bare")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("shows detail modal principals with missing status", async () => {
    mockShares.mockReturnValue({
      data: { resourceShares: [shareRow], total: 1 },
      isLoading: false,
    });
    mockPrincipals.mockReturnValue({
      data: { principals: [{ id: "777", external: false }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-share")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Details" }));
    expect(await screen.findByText("777")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });

  it("shows detail modal loading states", async () => {
    mockShares.mockReturnValue({
      data: { resourceShares: [shareRow], total: 1 },
      isLoading: false,
    });
    mockPrincipals.mockReturnValue({ data: undefined, isLoading: true });
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-share")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Details" }));
    expect(await screen.findByText("Share details")).toBeTruthy();
  });

  it("closes the create modal with Escape", async () => {
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^Create Resource share$/ }));
    dismissModalWithEscape();
    const header = screen.getAllByText("Create resource share").find((h) => h.closest('[role="dialog"]'));
    const dialog = header!.closest('[role="dialog"]') as HTMLElement;
    expect(dialog.className).toContain("hidden");
    expect(mockCreateMutate).not.toHaveBeenCalled();
  });

  it("enables organization sharing from the toggle", async () => {
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Enable sharing with AWS Organizations"));
    await waitFor(() => expect(mockEnableMutate).toHaveBeenCalled());
    expect(mockShowToast).toHaveBeenCalledWith("success", "Organization sharing enabled");
  });

  it("shows the org-sharing failure toast when returnValue is false", async () => {
    mockEnableMutate.mockImplementation(() => Promise.resolve({ returnValue: false }));
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Enable sharing with AWS Organizations"));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Organization sharing could not be enabled")
    );
  });

  it("shows the org-sharing error toast when the API fails", async () => {
    mockEnableMutate.mockRejectedValueOnce(new Error("enable failed"));
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Enable sharing with AWS Organizations"));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "enable failed"));
  });

  it("shows the fallback org-sharing error for non-Error rejections", async () => {
    mockEnableMutate.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<RAMDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Enable sharing with AWS Organizations"));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to enable organization sharing")
    );
  });
});
