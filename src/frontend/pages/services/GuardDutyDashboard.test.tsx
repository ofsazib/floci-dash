// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mockDetectors = vi.fn();
const mockDetail = vi.fn();
const mockCreateMutate: any = vi.fn(() => Promise.resolve({}));
const mockUpdateMutate: any = vi.fn();
const mockDeleteMutate = vi.fn(() => Promise.resolve({}));

vi.mock("../../hooks/useGuardDuty", () => ({
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
    mockDetail.mockReturnValue({ data: undefined });
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

    const enableInput = screen.getByLabelText(/Enable/);
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
