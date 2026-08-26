// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mockApps = vi.fn();
const mockDetail = vi.fn();

vi.mock("../../hooks/useEMRServerless", () => ({
  useEMRServerlessApplications: (...args: any[]) => mockApps(...args),
  useEMRServerlessApplication: (...args: any[]) => mockDetail(...args),
  useCreateEMRServerlessApplication: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateEMRServerlessApplication: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteEMRServerlessApplication: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useStartEMRServerlessApplication: () => ({ mutate: vi.fn(), isPending: false }),
  useStopEMRServerlessApplication: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../../../components/ConfirmDialog", () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn(() => Promise.resolve(true)),
    dialog: null,
  }),
}));

import { EmrServerlessDashboard } from "./EmrServerlessDashboard";

describe("EmrServerlessDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApps.mockReturnValue({ data: { applications: [], total: 0 }, isLoading: false });
    mockDetail.mockReturnValue({ data: undefined, isLoading: false });
  });

  it("renders the applications table header", () => {
    render(<EmrServerlessDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("EMR Serverless Applications")).toBeTruthy();
  });

  it("shows the empty message", () => {
    render(<EmrServerlessDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No EMR Serverless applications/)).toBeTruthy();
  });

  it("renders rows with data", () => {
    mockApps.mockReturnValue({
      data: {
        applications: [{ id: "app-1", name: "my-app", state: "STARTED", releaseLabel: "emr-7.1.0", type: "SPARK" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<EmrServerlessDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-app")).toBeTruthy();
    expect(screen.getByText("emr-7.1.0")).toBeTruthy();
  });

  it("opens the create modal", async () => {
    render(<EmrServerlessDashboard />, { wrapper: createWrapper() });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Create Application" }));
    expect(screen.getByText("Release Label")).toBeTruthy();
  });

  it("shows no detail panel before selection", () => {
    render(<EmrServerlessDashboard />, { wrapper: createWrapper() });
    expect(screen.queryByText(/Application — /)).toBeNull();
  });

  it("renders detail panel after row click", async () => {
    mockApps.mockReturnValue({
      data: {
        applications: [{ id: "app-1", name: "my-app", state: "STARTED", releaseLabel: "emr-7.1.0", type: "SPARK" }],
        total: 1,
      },
      isLoading: false,
    });
    mockDetail.mockReturnValue({
      data: { application: { status: "STARTED", arn: "arn:x", autoStart: true, autoStop: false } },
    });
    const user = userEvent.setup();
    render(<EmrServerlessDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-app" }));
    expect(await screen.findByText(/Application — app-1/)).toBeTruthy();
    expect(screen.getByText(/arn:x/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Toggle auto-start/ })).toBeTruthy();
  });
});
