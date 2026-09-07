// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mockInstances = vi.fn();

vi.mock("../../hooks/useSSOAdmin", () => ({
  useSSOInstances: (...args: any[]) => mockInstances(...args),
}));

import { SSOAdminDashboard } from "./SSOAdminDashboard";

const instanceRow = {
  InstanceArn: "arn:aws:sso:::instance/ssoins-7223b02a5d9f7c8e",
  IdentityStoreId: "d-9067f2a3c1",
  Name: "floci-identity-center",
  OwnerAccountId: "123456789012",
  Status: "ACTIVE",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockInstances.mockReturnValue({ data: { instances: [], total: 0 }, isLoading: false });
});

describe("SSOAdminDashboard", () => {
  it("renders the header", () => {
    render(<SSOAdminDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("IAM Identity Center (SSO Admin)")).toBeTruthy();
  });

  it("shows loading skeleton", () => {
    mockInstances.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<SSOAdminDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty message when no instances", () => {
    render(<SSOAdminDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No Identity Center instances/i)).toBeTruthy();
  });

  it("renders instance rows", () => {
    mockInstances.mockReturnValue({
      data: { instances: [instanceRow], total: 1 },
      isLoading: false,
    });
    render(<SSOAdminDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("floci-identity-center")).toBeTruthy();
    expect(screen.getByText("d-9067f2a3c1")).toBeTruthy();
    expect(screen.getByText("123456789012")).toBeTruthy();
    expect(screen.getByText("ACTIVE")).toBeTruthy();
  });

  it("shows dashes for missing optional fields", () => {
    mockInstances.mockReturnValue({
      data: {
        instances: [{ InstanceArn: "arn:aws:sso:::instance/x" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<SSOAdminDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("arn:aws:sso:::instance/x")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(4);
  });

  it("filters instances by name", async () => {
    mockInstances.mockReturnValue({
      data: {
        instances: [instanceRow, { ...instanceRow, Name: "other", InstanceArn: "arn:aws:sso:::instance/y" }],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<SSOAdminDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("floci-identity-center")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Find instances by name or ARN"), "other");
    await waitFor(() => expect(screen.queryByText("floci-identity-center")).toBeNull());
  });

  it("filters without failing when a row has no name", async () => {
    mockInstances.mockReturnValue({
      data: {
        instances: [{ InstanceArn: "arn:aws:sso:::instance/x", IdentityStoreId: "d-2" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<SSOAdminDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("d-2")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Find instances by name or ARN"), "nomatch");
    await waitFor(() => expect(screen.queryByText("d-2")).toBeNull());
  });
});
