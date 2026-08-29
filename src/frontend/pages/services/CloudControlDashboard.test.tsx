// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fireEvent } from "@testing-library/react";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mockResources = vi.fn();
const mockResourceDetail = vi.fn();
const mockCreateMutate: any = vi.fn(() => Promise.resolve({}));
const mockDeleteMutate = vi.fn(() => Promise.resolve({}));

vi.mock("../../hooks/useCloudControl", () => ({
  useCloudControlResources: (...args: any[]) => mockResources(...args),
  useCloudControlResource: (...args: any[]) => mockResourceDetail(...args),
  useCreateCloudControlResource: () => ({ mutateAsync: mockCreateMutate, isPending: false }),
  useResourceRequestStatus: () => ({ data: undefined, isLoading: false }),
  useDeleteCloudControlResource: () => ({ mutateAsync: mockDeleteMutate, isPending: false }),
}));

import { CloudControlDashboard } from "./CloudControlDashboard";

describe("CloudControlDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateMutate.mockImplementation(() => Promise.resolve({}));
    mockDeleteMutate.mockImplementation(() => Promise.resolve({}));
    mockResources.mockReturnValue({
      data: { resourceDescriptions: [], typeName: null, nextToken: null },
      isLoading: false,
    });
    mockResourceDetail.mockReturnValue({ data: undefined });
  });

  it("prompts for a resource type before load", () => {
    render(<CloudControlDashboard />, { wrapper: createWrapper() });
    expect(
      screen.getByText(/Enter a resource type and press Load/)
    ).toBeTruthy();
  });

  it("lists resources after Load", async () => {
    mockResources.mockImplementation((t: string | null) => ({
      data: t
        ? { resourceDescriptions: [{ identifier: "b-1" }], typeName: t, nextToken: null }
        : { resourceDescriptions: [], typeName: null, nextToken: null },
      isLoading: false,
    }));
    const user = userEvent.setup();
    render(<CloudControlDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Load" }));
    expect(await screen.findByRole("button", { name: "b-1" })).toBeTruthy();
    expect(mockResources).toHaveBeenCalledWith("AWS::S3::Bucket");
  });

  it("shows properties after selecting a resource", async () => {
    mockResources.mockReturnValue({
      data: {
        resourceDescriptions: [{ identifier: "b-1" }],
        typeName: "AWS::S3::Bucket",
        nextToken: null,
      },
      isLoading: false,
    });
    mockResourceDetail.mockImplementation((_t: any, id: string | null) => ({
      data: id
        ? { resourceDescription: { identifier: id, properties: '{"Name":"b-1"}' } }
        : { data: undefined },
    }));
    const user = userEvent.setup();
    render(<CloudControlDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "b-1" }));
    expect(await screen.findByText(/Properties — b-1/)).toBeTruthy();
    expect(screen.getByText(/"Name":"b-1"/)).toBeTruthy();
  });

  it("shows raw string when properties are not JSON-stringifiable cleanly", async () => {
    mockResources.mockReturnValue({
      data: {
        resourceDescriptions: [{ identifier: "b-1" }],
        typeName: "T",
        nextToken: null,
      },
      isLoading: false,
    });
    mockResourceDetail.mockReturnValue({
      data: { resourceDescription: { identifier: "b-1", properties: { a: 1 } } },
    });
    const user = userEvent.setup();
    render(<CloudControlDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "b-1" }));
    expect(await screen.findByText(/Properties — b-1/)).toBeTruthy();
    expect(screen.getByText(/"a":1/)).toBeTruthy();
  });

  it("creates a resource with parsed desired state", async () => {
    mockResources.mockImplementation((t: string | null) => ({
      data: t
        ? { resourceDescriptions: [{ identifier: "b-1" }], typeName: t, nextToken: null }
        : { resourceDescriptions: [], typeName: null, nextToken: null },
      isLoading: false,
    }));
    const user = userEvent.setup();
    render(<CloudControlDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Load" }));
    await user.click(screen.getByRole("button", { name: "Create Resource" }));
    fireEvent.change(screen.getByLabelText(/Desired state/), {
      target: { value: '{"BucketName":"x"}' },
    });
    await user.click(screen.getByRole("button", { name: "Create resource" }));
    await screen.findByText(/Properties —/).catch(() => {});
    expect(mockCreateMutate).toHaveBeenCalledWith({
      typeName: "AWS::S3::Bucket",
      desiredState: { BucketName: "x" },
    });
  });

  it("ignores create when desired state is invalid JSON", async () => {
    mockResources.mockReturnValue({
      data: {
        resourceDescriptions: [{ identifier: "b-1" }],
        typeName: "AWS::S3::Bucket",
        nextToken: null,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudControlDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create Resource" }));
    const area = screen.getByLabelText(/Desired state/);
    fireEvent.change(area, { target: { value: "{bad" } });
    await user.click(screen.getByRole("button", { name: "Create resource" }));
    expect(mockCreateMutate).not.toHaveBeenCalled();
  });

  it("deletes a resource via confirm dialog", async () => {
    mockResources.mockReturnValue({
      data: {
        resourceDescriptions: [{ identifier: "b-1" }],
        typeName: "AWS::S3::Bucket",
        nextToken: null,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudControlDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Delete b-1/ }));
    await screen.findByText(/Are you sure/);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await vi.waitFor(() => expect(mockDeleteMutate).toHaveBeenCalledWith("b-1"));
  });

  it("deselects when clicking the selected resource again", async () => {
    mockResources.mockReturnValue({
      data: {
        resourceDescriptions: [{ identifier: "b-1" }],
        typeName: "AWS::S3::Bucket",
        nextToken: null,
      },
      isLoading: false,
    });
    mockResourceDetail.mockReturnValue({
      data: { resourceDescription: { identifier: "b-1", properties: "{}" } },
    });
    const user = userEvent.setup();
    render(<CloudControlDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "b-1" }));
    expect(await screen.findByText(/Properties — b-1/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "b-1" }));
    expect(screen.queryByText(/Properties — b-1/)).toBeNull();
  });
});
