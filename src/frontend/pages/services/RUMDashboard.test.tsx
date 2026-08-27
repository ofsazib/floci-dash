// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mockMonitors = vi.fn();
const mockDetail = vi.fn();
const mockCreateMutate: any = vi.fn(() => Promise.resolve({ id: "i" }));
const mockDeleteMutate = vi.fn(() => Promise.resolve({}));

vi.mock("../../hooks/useRUM", () => ({
  useRUMAppMonitors: (...args: any[]) => mockMonitors(...args),
  useRUMAppMonitor: (...args: any[]) => mockDetail(...args),
  useCreateRUMAppMonitor: () => ({ mutateAsync: mockCreateMutate, isPending: false }),
  useUpdateRUMAppMonitor: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteRUMAppMonitor: () => ({ mutateAsync: mockDeleteMutate, isPending: false }),
}));

import { RUMDashboard } from "./RUMDashboard";

describe("RUMDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateMutate.mockImplementation(() => Promise.resolve({}));
    mockDeleteMutate.mockImplementation(() => Promise.resolve({}));
    mockMonitors.mockReturnValue({ data: { appMonitors: [], total: 0 }, isLoading: false });
    mockDetail.mockReturnValue({ data: undefined });
  });

  it("renders the app monitors table header", () => {
    render(<RUMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("CloudWatch RUM App Monitors")).toBeTruthy();
  });

  it("shows the empty message", () => {
    render(<RUMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No CloudWatch RUM app monitors/)).toBeTruthy();
  });

  it("renders rows with data", () => {
    mockMonitors.mockReturnValue({
      data: {
        appMonitors: [
          { Name: "mon-a", Id: "id-1", State: "ACTIVE", Platform: "web" },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<RUMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: "mon-a" })).toBeTruthy();
    expect(screen.getByText("ACTIVE")).toBeTruthy();
  });

  it("creates an app monitor after filling the modal form", async () => {
    const user = userEvent.setup();
    render(<RUMDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create App monitor" }));

    await user.type(screen.getByLabelText("Name"), "mon-new");
    await user.type(screen.getByLabelText("Domain"), "example.io");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await screen.findByText("CloudWatch RUM App Monitors");
    expect(mockCreateMutate).toHaveBeenCalledWith({
      name: "mon-new",
      domain: "example.io",
      platform: "web",
    });
  });

  it("deletes an app monitor via confirm dialog and clears selection if deleted", async () => {
    mockMonitors.mockReturnValue({
      data: {
        appMonitors: [{ Name: "mon-a", Id: "id-1", State: "ACTIVE", Platform: "web" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<RUMDashboard />, { wrapper: createWrapper() });

    // select first so deletion clears it
    await user.click(screen.getByRole("button", { name: "mon-a" }));
    expect(await screen.findByText(/App monitor — mon-a/)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /Delete mon-a/ }));
    await screen.findByText(/Are you sure/);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await vi.waitFor(() => expect(mockDeleteMutate).toHaveBeenCalledWith("mon-a"));
    await vi.waitFor(() =>
      expect(screen.queryByText(/App monitor — mon-a/)).toBeNull()
    );
  });

  it("renders detail panel after row click with domain list", async () => {
    mockMonitors.mockReturnValue({
      data: {
        appMonitors: [{ Name: "mon-a", Id: "id-1", State: "ACTIVE", Platform: "web" }],
        total: 1,
      },
      isLoading: false,
    });
    mockDetail.mockReturnValue({
      data: {
        appMonitor: {
          id: "id-1",
          state: "ACTIVE",
          platform: "web",
          domain: "example.com",
          domainList: ["example.com", "www.example.com"],
        },
      },
    });
    const user = userEvent.setup();
    render(<RUMDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "mon-a" }));
    expect(await screen.findByText(/App monitor — mon-a/)).toBeTruthy();
    expect(screen.getByText(/www\.example\.com/)).toBeTruthy();
    expect(mockDetail).toHaveBeenCalledWith("mon-a");
  });
});
