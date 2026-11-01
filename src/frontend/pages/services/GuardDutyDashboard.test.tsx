// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mockDetectors = vi.fn();
const mockDetail = vi.fn();
const mockCreateMutate: any = vi.fn(() => Promise.resolve({}));
const mockUpdateMutate: any = vi.fn();
const mockDeleteMutate = vi.fn(() => Promise.resolve({}));

const mockGdMembers = vi.fn();
const mockGdOrgConfig = vi.fn();
const mockCreateGdMembers = vi.fn(() => Promise.resolve({}));
const mockUpdateGdOrgConfig = vi.fn();
const mockEnableGdAdmin = vi.fn(() => Promise.resolve({}));
const mockDisableGdAdmin = vi.fn(() => Promise.resolve({}));
vi.mock("../../hooks/useGuardDuty", () => ({
  useGuardDutyMembers: (...args: any[]) => mockGdMembers(...args),
  useCreateGuardDutyMembers: () => ({ mutateAsync: mockCreateGdMembers, isPending: false }),
  useGuardDutyOrgConfig: (...args: any[]) => mockGdOrgConfig(...args),
  useUpdateGuardDutyOrgConfig: () => ({ mutate: mockUpdateGdOrgConfig, isPending: false }),
  useEnableGuardDutyAdminAccount: () => ({ mutateAsync: mockEnableGdAdmin, isPending: false }),
  useDisableGuardDutyAdminAccount: () => ({ mutateAsync: mockDisableGdAdmin, isPending: false }),
  useGuardDutyDetectors: (...args: any[]) => mockDetectors(...args),
  useGuardDutyDetector: (...args: any[]) => mockDetail(...args),
  useCreateGuardDutyDetector: () => ({ mutateAsync: mockCreateMutate, isPending: false }),
  useUpdateGuardDutyDetector: () => ({ mutate: mockUpdateMutate, isPending: false }),
  useDeleteGuardDutyDetector: () => ({ mutateAsync: mockDeleteMutate, isPending: false }),
}));

import { GuardDutyDashboard } from "./GuardDutyDashboard";

describe("GuardDutyDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateMutate.mockImplementation(() => Promise.resolve({}));
    mockDeleteMutate.mockImplementation(() => Promise.resolve({}));
    mockDetectors.mockReturnValue({ data: { detectorIds: [], total: 0 }, isLoading: false });
    mockDetail.mockReturnValue({ data: { detector: null } });
    mockGdMembers.mockReturnValue({ data: { members: [], total: 0 } });
    mockGdOrgConfig.mockReturnValue({ data: { autoEnable: false } });
  });

  it("renders the detectors table header", () => {
    render(<GuardDutyDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("GuardDuty Detectors")).toBeTruthy();
  });

  it("shows the empty message", () => {
    render(<GuardDutyDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No GuardDuty detectors/)).toBeTruthy();
  });

  it("renders rows with detector IDs", () => {
    mockDetectors.mockReturnValue({
      data: { detectorIds: ["det-1"], total: 1 },
      isLoading: false,
    });
    render(<GuardDutyDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: "det-1" })).toBeTruthy();
  });

  it("creates a detector enabled with defaults", async () => {
    const user = userEvent.setup();
    render(<GuardDutyDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create Detector" }));
    await user.click(screen.getByRole("button", { name: "Create" }));

    await screen.findByText("GuardDuty Detectors");
    expect(mockCreateMutate).toHaveBeenCalledWith({
      enable: true,
      frequency: "SIX_HOURS",
    });
  });

  it("creates a disabled detector from form input", async () => {
    const user = userEvent.setup();
    render(<GuardDutyDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create Detector" }));

    const createDialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    const enableInput = within(createDialog).getByLabelText(/Enable \(true\/false\)/);
    await user.clear(enableInput);
    await user.type(enableInput, "false");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await screen.findByText("GuardDuty Detectors");
    expect(mockCreateMutate).toHaveBeenCalledWith({
      enable: false,
      frequency: "SIX_HOURS",
    });
  });

  it("renders detail panel and toggles enabled", async () => {
    mockDetectors.mockReturnValue({
      data: { detectorIds: ["det-1"], total: 1 },
      isLoading: false,
    });
    mockDetail.mockReturnValue({
      data: {
        detector: {
          status: "ENABLED",
          createdAt: "111",
          findingPublishingFrequency: "SIX_HOURS",
          serviceRole: "arn:role",
        },
      },
    });
    const user = userEvent.setup();
    render(<GuardDutyDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "det-1" }));
    expect(await screen.findByText(/Detector — det-1/)).toBeTruthy();
    expect(screen.getByText(/SIX_HOURS/)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /Toggle enabled/ }));
    expect(mockUpdateMutate).toHaveBeenCalledWith({ id: "det-1", enable: false });
  });

  it("toggle sends enable=true when currently disabled", async () => {
    mockDetectors.mockReturnValue({
      data: { detectorIds: ["det-1"], total: 1 },
      isLoading: false,
    });
    mockDetail.mockReturnValue({
      data: { detector: { status: "DISABLED" } },
    });
    const user = userEvent.setup();
    render(<GuardDutyDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "det-1" }));
    expect(await screen.findByText(/Detector — det-1/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Toggle enabled/ }));
    expect(mockUpdateMutate).toHaveBeenCalledWith({ id: "det-1", enable: true });
  });

  it("deletes a detector via confirm dialog", async () => {
    mockDetectors.mockReturnValue({
      data: { detectorIds: ["det-1"], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GuardDutyDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Delete det-1/ }));
    await screen.findByText(/Are you sure/);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await vi.waitFor(() => expect(mockDeleteMutate).toHaveBeenCalledWith("det-1"));
  });

  it("deselects when clicking the selected row again", async () => {
    mockDetectors.mockReturnValue({
      data: { detectorIds: ["det-1"], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GuardDutyDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "det-1" }));
    expect(await screen.findByText(/Detector — det-1/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "det-1" }));
    expect(screen.queryByText(/Detector — det-1/)).toBeNull();
  });
});


function visibleDialog() {
  return within(screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!);
}
describe("GuardDuty members and organization", () => {
  function setupDetector() {
    mockDetectors.mockReturnValue({
      data: { detectorIds: ["d1"], total: 1 },
      isLoading: false,
    });
    mockDetail.mockReturnValue({ data: { detector: { status: "ENABLED" } } });
  }

  it("lists members for a selected detector", async () => {
    setupDetector();
    mockGdMembers.mockReturnValue({
      data: { members: [{ accountId: "111", email: "a@b.c", status: "Enabled" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<GuardDutyDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "d1" }));
    expect(await screen.findByText("111")).toBeTruthy();
    expect(screen.getByText("a@b.c")).toBeTruthy();
  });

  it("adds a member via modal", async () => {
    setupDetector();
    mockGdMembers.mockReturnValue({ data: { members: [], total: 0 } });
    const user = userEvent.setup();
    render(<GuardDutyDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "d1" }));
    await user.click(await screen.findByRole("button", { name: "Create Member" }));
    const areas = visibleDialog().getAllByRole("textbox");
    await user.type(areas[0], "222");
    await user.type(areas[1], "m@example.com");
    await user.click(screen.getByRole("button", { name: "Add Member" }));
    expect(mockCreateGdMembers).toHaveBeenCalledWith({
      detectorId: "d1",
      accounts: [{ accountId: "222", email: "m@example.com" }],
    });
  });

  it("shows org config and updates it", async () => {
    setupDetector();
    mockGdMembers.mockReturnValue({ data: { members: [], total: 0 } });
    mockGdOrgConfig.mockReturnValue({ data: { autoEnable: true } });
    const user = userEvent.setup();
    render(<GuardDutyDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "d1" }));
    expect(await screen.findByText(/Auto-enable member accounts: Yes/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Update organization config/i }));
    expect(mockUpdateGdOrgConfig).toHaveBeenCalled();
  });

  it("enables an org admin account via modal", async () => {
    setupDetector();
    mockGdMembers.mockReturnValue({ data: { members: [], total: 0 } });
    mockGdOrgConfig.mockReturnValue({ data: { autoEnable: false } });
    const user = userEvent.setup();
    render(<GuardDutyDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "d1" }));
    await user.click(await screen.findByRole("button", { name: /Enable admin account/i }));
    const areas = visibleDialog().getAllByRole("textbox");
    await user.type(areas[0], "999");
    await user.click(screen.getByRole("button", { name: "Enable Admin" }));
    expect(mockEnableGdAdmin).toHaveBeenCalledWith("999");
  });
});
