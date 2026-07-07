// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockResources = vi.fn();
const mockTagKeys = vi.fn();
const mockTagValues = vi.fn();
const mockTagResources = vi.fn();
const mockUntagResources = vi.fn();

vi.mock("../../hooks/useRGT", () => ({
  useRGTResources: (...args: any[]) => mockResources(...args),
  useRGTTagKeys: (...args: any[]) => mockTagKeys(...args),
  useRGTTagValues: (...args: any[]) => mockTagValues(...args),
  useRGTTagResources: () => ({ mutate: mockTagResources, isPending: false }),
  useRGTUntagResources: () => ({ mutate: mockUntagResources, isPending: false }),
}));

import { RGTDashboard } from "./RGTDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockResources.mockReturnValue({ data: { resourceTagMappingList: [], total: 0 }, isLoading: false });
  mockTagKeys.mockReturnValue({ data: { tagKeys: [] } });
  mockTagValues.mockReturnValue({ data: { tagValues: [] } });
});

describe("RGTDashboard", () => {
  it("shows spinner when loading resources", () => {
    mockResources.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<RGTDashboard />, { wrapper: createWrapper() });
    const spinners = container.querySelectorAll('[class*="spinner"]');
    expect(spinners.length).toBeGreaterThanOrEqual(0);
  });

  it("shows empty message for tagged resources", () => {
    render(<RGTDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No tagged resources found/i)).toBeTruthy();
  });

  it("renders tagged resources with data", () => {
    mockResources.mockReturnValue({
      data: {
        resourceTagMappingList: [{ ResourceARN: "arn:aws:ec2:us-east-1:123:instance/i-123", Tags: { Name: "my-instance", Environment: "prod" } }],
        total: 1,
      },
      isLoading: false,
    });
    render(<RGTDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/arn:aws:ec2:us-east-1:123:instance\/i-123/)).toBeTruthy();
    expect(screen.getByText(/Name=my-instance, Environment=prod/)).toBeTruthy();
  });

  it("renders tag keys and allows selecting one", () => {
    mockTagKeys.mockReturnValue({ data: { tagKeys: ["Environment", "Project"] } });
    render(<RGTDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Environment")).toBeTruthy();
    expect(screen.getByText("Project")).toBeTruthy();
  });

  it("shows tagged resources with formatted tags", () => {
    mockResources.mockReturnValue({
      data: {
        resourceTagMappingList: [{ ResourceARN: "arn:aws:ec2:...", Tags: { Environment: "prod", Name: "test" } }],
        total: 1,
      },
      isLoading: false,
    });
    render(<RGTDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/Environment=prod, Name=test/)).toBeTruthy();
  });

  it("filters resources by ARN", async () => {
    mockResources.mockReturnValue({
      data: {
        resourceTagMappingList: [
          { ResourceARN: "arn:aws:ec2:us-east-1:123:instance/i-001", Tags: { Name: "alpha" } },
          { ResourceARN: "arn:aws:ec2:us-east-1:123:instance/i-002", Tags: { Name: "beta" } },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<RGTDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(/i-001/)).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find by ARN");
    await user.type(filterInput, "i-002");
    await waitFor(() => expect(screen.queryByText(/i-001/)).toBeNull());
  });
});
