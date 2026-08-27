// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mockEnvs = vi.fn();
const mockDetail = vi.fn();
const mockCreateMutate: any = vi.fn(() => Promise.resolve({ arn: "arn" }));
const mockDeleteMutate = vi.fn(() => Promise.resolve({}));
const mockWebTokenMutate = vi.fn();
const mockCliTokenMutate = vi.fn();

vi.mock("../../hooks/useMWAA", () => ({
  useMWAAEnvironments: (...args: any[]) => mockEnvs(...args),
  useMWAAEnvironment: (...args: any[]) => mockDetail(...args),
  useCreateMWAAEnvironment: () => ({ mutateAsync: mockCreateMutate, isPending: false }),
  useUpdateMWAAEnvironment: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteMWAAEnvironment: () => ({ mutateAsync: mockDeleteMutate, isPending: false }),
  useCreateMWAAWebToken: () => ({ mutate: mockWebTokenMutate, isPending: false }),
  useCreateMWAACliToken: () => ({ mutate: mockCliTokenMutate, isPending: false }),
}));

import { MWAADashboard } from "./MWAADashboard";

describe("MWAADashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateMutate.mockImplementation(() => Promise.resolve({}));
    mockDeleteMutate.mockImplementation(() => Promise.resolve({}));
    mockEnvs.mockReturnValue({ data: { environments: [], total: 0 }, isLoading: false });
    mockDetail.mockReturnValue({ data: undefined });
  });

  it("renders the environments table header", () => {
    render(<MWAADashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("MWAA Environments")).toBeTruthy();
  });

  it("shows the empty message", () => {
    render(<MWAADashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No MWAA environments/)).toBeTruthy();
  });

  it("renders rows with data", () => {
    mockEnvs.mockReturnValue({
      data: { environments: [{ name: "env-a" }], total: 1 },
      isLoading: false,
    });
    render(<MWAADashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: "env-a" })).toBeTruthy();
  });

  it("handles string-only environment names", () => {
    mockEnvs.mockReturnValue({
      data: { environments: ["env-str"], total: 1 },
      isLoading: false,
    });
    render(<MWAADashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: "env-str" })).toBeTruthy();
  });

  it("creates an environment after filling the modal form", async () => {
    const user = userEvent.setup();
    render(<MWAADashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create Environment" }));

    await user.type(screen.getByLabelText("Name"), "env-new");
    await user.type(screen.getByLabelText("Source Bucket ARN"), "arn:aws:s3:::bucket");
    await user.type(screen.getByLabelText("Execution Role ARN"), "arn:aws:iam::1:role/r");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await screen.findByText("MWAA Environments");
    expect(mockCreateMutate).toHaveBeenCalledWith({
      name: "env-new",
      sourceBucketArn: "arn:aws:s3:::bucket",
      executionRoleArn: "arn:aws:iam::1:role/r",
      airflowVersion: "2.10.1",
      environmentClass: "ENV_TYPE_SMALL",
      dagS3Path: "dags/",
    });
  });

  it("requests a web token and CLI token per row", async () => {
    mockEnvs.mockReturnValue({
      data: { environments: [{ name: "env-a" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<MWAADashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Web token" }));
    await user.click(screen.getByRole("button", { name: "CLI token" }));
    expect(mockWebTokenMutate).toHaveBeenCalledWith("env-a");
    expect(mockCliTokenMutate).toHaveBeenCalledWith("env-a");
  });

  it("deletes an environment via row action", async () => {
    mockEnvs.mockReturnValue({
      data: { environments: [{ name: "env-a" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<MWAADashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Delete env-a/ }));
    await screen.findByText(/Are you sure/);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await vi.waitFor(() => expect(mockDeleteMutate).toHaveBeenCalledWith("env-a"));
  });

  it("shows no detail panel before selection", () => {
    render(<MWAADashboard />, { wrapper: createWrapper() });
    expect(screen.queryByText(/Environment — /)).toBeNull();
  });

  it("renders detail panel after row click", async () => {
    mockEnvs.mockReturnValue({
      data: { environments: [{ name: "env-a" }], total: 1 },
      isLoading: false,
    });
    mockDetail.mockReturnValue({
      data: {
        environment: {
          status: "AVAILABLE",
          airflowVersion: "2.10.1",
          environmentClass: "ENV_TYPE_SMALL",
          arn: "arn:x",
          webserverUrl: "https://host",
          sourceBucketArn: "arn:b",
        },
      },
    });
    const user = userEvent.setup();
    render(<MWAADashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "env-a" }));
    expect(await screen.findByText(/Environment — env-a/)).toBeTruthy();
    expect(screen.getByText(/AVAILABLE/)).toBeTruthy();
    expect(screen.getByText(/https:\/\/host/)).toBeTruthy();
    expect(mockDetail).toHaveBeenCalledWith("env-a");
  });

  it("deselects when clicking the selected row again", async () => {
    mockEnvs.mockReturnValue({
      data: { environments: [{ name: "env-a" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<MWAADashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "env-a" }));
    expect(await screen.findByText(/Environment — env-a/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "env-a" }));
    expect(screen.queryByText(/Environment — env-a/)).toBeNull();
  });
});
