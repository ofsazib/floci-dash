// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fireEvent } from "@testing-library/react";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mockTemplates = vi.fn();
const mockTemplateDetail = vi.fn();
const mockExperiments = vi.fn();
const mockCreateMutate: any = vi.fn(() => Promise.resolve({}));
const mockDeleteMutate = vi.fn(() => Promise.resolve({}));
const mockStartMutate: any = vi.fn(() => Promise.resolve({}));
const mockStopMutate: any = vi.fn(() => Promise.resolve({}));

vi.mock("../../hooks/useFIS", () => ({
  useFisExperimentTemplates: (...args: any[]) => mockTemplates(...args),
  useFisExperimentTemplate: (...args: any[]) => mockTemplateDetail(...args),
  useCreateFisExperimentTemplate: () => ({ mutateAsync: mockCreateMutate, isPending: false }),
  useUpdateFisExperimentTemplate: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteFisExperimentTemplate: () => ({ mutateAsync: mockDeleteMutate, isPending: false }),
  useFisExperiments: (...args: any[]) => mockExperiments(...args),
  useStartFisExperiment: () => ({ mutate: mockStartMutate, isPending: false }),
  useStopFisExperiment: () => ({ mutate: mockStopMutate, isPending: false }),
}));

import { FisDashboard } from "./FisDashboard";

const TPL = { id: "tpl-1", description: "d", state: { status: "available" } };
const EXP = {
  id: "exp-1",
  experimentTemplateId: "tpl-1",
  state: { status: "running" },
};

describe("FisDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateMutate.mockImplementation(() => Promise.resolve({}));
    mockDeleteMutate.mockImplementation(() => Promise.resolve({}));
    mockTemplates.mockReturnValue({
      data: { experimentTemplates: [TPL], total: 1 },
      isLoading: false,
    });
    mockTemplateDetail.mockReturnValue({ data: undefined });
    mockExperiments.mockReturnValue({
      data: { experiments: [], total: 0 },
      isLoading: false,
    });
  });

  it("renders templates tab with rows", () => {
    render(<FisDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("FIS Experiment Templates")).toBeTruthy();
    expect(screen.getByRole("button", { name: "tpl-1" })).toBeTruthy();
  });

  it("shows experiments tab content when selected", async () => {
    mockExperiments.mockReturnValue({
      data: { experiments: [EXP], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<FisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Experiments"));
    expect(await screen.findByText("FIS Experiments")).toBeTruthy();
    expect(screen.getByText("exp-1")).toBeTruthy();
  });

  it("starts an experiment from a template row", async () => {
    const user = userEvent.setup();
    render(<FisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Start experiment" }));
    expect(mockStartMutate).toHaveBeenCalledWith("tpl-1");
  });

  it("stops a running experiment", async () => {
    mockExperiments.mockReturnValue({
      data: { experiments: [{ ...EXP }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<FisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Experiments"));
    const stopButtons = await screen.findAllByRole("button", { name: "Stop" });
    await user.click(stopButtons[0]);
    expect(mockStopMutate).toHaveBeenCalledWith("exp-1");
  });

  it("creates a template after filling the modal form", async () => {
    const user = userEvent.setup();
    render(<FisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create Experiment template" }));

    await user.type(screen.getByLabelText("Name"), "t-name");
    await user.type(screen.getByLabelText("Description"), "d1");
    await user.type(screen.getByLabelText("Role ARN"), "arn:r");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await screen.findByText("FIS Experiment Templates");
    expect(mockCreateMutate).toHaveBeenCalledWith({
      name: "t-name",
      description: "d1",
      roleArn: "arn:r",
      actions: {},
    });
  });

  it("ignores invalid actions JSON on submit", async () => {
    const user = userEvent.setup();
    render(<FisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create Experiment template" }));

    await user.type(screen.getByLabelText("Description"), "d1");
    await user.type(screen.getByLabelText("Role ARN"), "arn:r");
    const actionInput = screen.getByLabelText(/Actions/);
    // replace default "{}"" with invalid JSON (fireEvent: "{" breaks userEvent key parsing)
    fireEvent.change(actionInput, { target: { value: "{bad" } });
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(mockCreateMutate).not.toHaveBeenCalled();
  });

  it("deletes a template via confirm dialog and clears selection", async () => {
    mockTemplateDetail.mockReturnValue({
      data: { experimentTemplate: { state: "available", roleArn: "arn:r" } },
    });
    const user = userEvent.setup();
    render(<FisDashboard />, { wrapper: createWrapper() });

    await user.click(screen.getByRole("button", { name: "tpl-1" }));
    expect(await screen.findByText(/Template — tpl-1/)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /Delete tpl-1/ }));
    await screen.findByText(/Are you sure/);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await vi.waitFor(() => expect(mockDeleteMutate).toHaveBeenCalledWith("tpl-1"));
    await vi.waitFor(() =>
      expect(screen.queryByText(/Template — tpl-1/)).toBeNull()
    );
  });

  it("shows template detail panel after row click", async () => {
    mockTemplateDetail.mockReturnValue({
      data: {
        experimentTemplate: {
          state: "available",
          description: "dd",
          roleArn: "arn:r",
          targets: ["t1"],
          actions: ["a1"],
        },
      },
    });
    const user = userEvent.setup();
    render(<FisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "tpl-1" }));
    expect(await screen.findByText(/Template — tpl-1/)).toBeTruthy();
    expect(screen.getByText(/t1/)).toBeTruthy();
    expect(mockTemplateDetail).toHaveBeenCalledWith("tpl-1");
  });
});
