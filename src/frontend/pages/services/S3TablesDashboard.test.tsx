// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mockBuckets = vi.fn();
const mockNamespaces = vi.fn();
const mockTables = vi.fn();
const mockCreateBucket: any = vi.fn(() => Promise.resolve({}));
const mockDeleteBucketMutate = vi.fn(() => Promise.resolve({}));
const mockCreateNamespace: any = vi.fn(() => Promise.resolve({}));
const mockDeleteNamespaceMutate = vi.fn(() => Promise.resolve({}));
const mockCreateTable: any = vi.fn(() => Promise.resolve({}));
const mockDeleteTableMutate = vi.fn(() => Promise.resolve({}));

vi.mock("../../hooks/useS3Tables", () => ({
  useS3TableBuckets: (...args: any[]) => mockBuckets(...args),
  useCreateS3TableBucket: () => ({ mutateAsync: mockCreateBucket, isPending: false }),
  useDeleteS3TableBucket: () => ({ mutateAsync: mockDeleteBucketMutate, isPending: false }),
  useS3TableNamespaces: (...args: any[]) => mockNamespaces(...args),
  useCreateS3TableNamespace: () => ({ mutateAsync: mockCreateNamespace, isPending: false }),
  useDeleteS3TableNamespace: () => ({ mutateAsync: mockDeleteNamespaceMutate, isPending: false }),
  useS3Tables: (...args: any[]) => mockTables(...args),
  useCreateS3Table: () => ({ mutateAsync: mockCreateTable, isPending: false }),
  useDeleteS3Table: () => ({ mutateAsync: mockDeleteTableMutate, isPending: false }),
}));

import { S3TablesDashboard } from "./S3TablesDashboard";

const BUCKET = {
  arn: "arn:aws:s3tables:::bucket/b1",
  name: "b1",
  createdAt: "111",
};

describe("S3TablesDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateBucket.mockImplementation(() => Promise.resolve({}));
    mockCreateNamespace.mockImplementation(() => Promise.resolve({}));
    mockCreateTable.mockImplementation(() => Promise.resolve({}));
    mockDeleteBucketMutate.mockImplementation(() => Promise.resolve({}));
    mockDeleteNamespaceMutate.mockImplementation(() => Promise.resolve({}));
    mockDeleteTableMutate.mockImplementation(() => Promise.resolve({}));
    mockBuckets.mockReturnValue({ data: { buckets: [], total: 0 }, isLoading: false });
    mockNamespaces.mockReturnValue({ data: { namespaces: [], total: 0 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [], total: 0 }, isLoading: false });
  });

  it("renders buckets table with empty message", () => {
    render(<S3TablesDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("S3 Table Buckets")).toBeTruthy();
    expect(screen.getByText(/No S3 table buckets/)).toBeTruthy();
  });

  it("renders bucket rows", () => {
    mockBuckets.mockReturnValue({ data: { buckets: [BUCKET], total: 1 }, isLoading: false });
    render(<S3TablesDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: "b1" })).toBeTruthy();
  });

  it("creates a bucket via modal", async () => {
    const user = userEvent.setup();
    render(<S3TablesDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create Table bucket" }));
    await user.type(screen.getByLabelText("Bucket name"), "b-new");
    await user.click(screen.getByRole("button", { name: "Create bucket" }));
    await screen.findByText("S3 Table Buckets");
    expect(mockCreateBucket).toHaveBeenCalledWith("b-new");
  });

  it("shows namespaces after selecting a bucket", async () => {
    mockBuckets.mockReturnValue({ data: { buckets: [BUCKET], total: 1 }, isLoading: false });
    mockNamespaces.mockReturnValue({
      data: { namespaces: [{ namespace: ["ns-1"] }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<S3TablesDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "b1" }));
    expect(await screen.findByText("ns-1")).toBeTruthy();
    expect(mockNamespaces).toHaveBeenCalledWith(BUCKET.arn);
  });

  it("creates a namespace inside selected bucket", async () => {
    mockBuckets.mockReturnValue({ data: { buckets: [BUCKET], total: 1 }, isLoading: false });
    mockNamespaces.mockReturnValue({
      data: { namespaces: [], total: 0 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<S3TablesDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "b1" }));
    await screen.findByText("Namespaces");
    await user.click(screen.getByRole("button", { name: "Create Namespace" }));
    await user.type(screen.getByLabelText("Namespace"), "ns-new");
    await user.click(screen.getByRole("button", { name: "Create namespace" }));
    await screen.findByText("Namespaces");
    expect(mockCreateNamespace).toHaveBeenCalledWith("ns-new");
  });

  it("shows tables after selecting a namespace", async () => {
    mockBuckets.mockReturnValue({ data: { buckets: [BUCKET], total: 1 }, isLoading: false });
    mockNamespaces.mockReturnValue({
      data: { namespaces: [{ namespace: ["ns-1"] }], total: 1 },
      isLoading: false,
    });
    mockTables.mockReturnValue({
      data: {
        tables: [{ name: "t1", namespace: "ns-1", type: "ICEBERG", createdAt: "222" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<S3TablesDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "b1" }));
    await user.click(await screen.findByRole("button", { name: "ns-1" }));
    expect(await screen.findByText("t1")).toBeTruthy();
    expect(mockTables).toHaveBeenCalledWith(BUCKET.arn, "ns-1");
  });

  it("creates a table inside selected namespace", async () => {
    mockBuckets.mockReturnValue({ data: { buckets: [BUCKET], total: 1 }, isLoading: false });
    mockNamespaces.mockReturnValue({
      data: { namespaces: [{ namespace: ["ns-1"] }], total: 1 },
      isLoading: false,
    });
    mockTables.mockReturnValue({ data: { tables: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<S3TablesDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "b1" }));
    await user.click(await screen.findByRole("button", { name: "ns-1" }));
    await screen.findByText(/No tables/);
    await user.click(screen.getByRole("button", { name: "Create Table" }));
    await user.type(screen.getByLabelText("Table name"), "t-new");
    await user.click(screen.getByRole("button", { name: "Create table" }));
    await screen.findByText(/No tables/);
    expect(mockCreateTable).toHaveBeenCalledWith({ name: "t-new", format: "ICEBERG" });
  });

  it("deletes a table via confirm dialog", async () => {
    mockBuckets.mockReturnValue({ data: { buckets: [BUCKET], total: 1 }, isLoading: false });
    mockNamespaces.mockReturnValue({
      data: { namespaces: [{ namespace: ["ns-1"] }], total: 1 },
      isLoading: false,
    });
    mockTables.mockReturnValue({
      data: {
        tables: [{ name: "t1", namespace: "ns-1", type: "ICEBERG", createdAt: "" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<S3TablesDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "b1" }));
    await user.click(await screen.findByRole("button", { name: "ns-1" }));
    await user.click(await screen.findByRole("button", { name: /Delete t1/ }));
    await screen.findByText(/Are you sure/);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await vi.waitFor(() => expect(mockDeleteTableMutate).toHaveBeenCalledWith("t1"));
  });

  it("deletes a bucket via confirm dialog and clears namespace selection", async () => {
    mockBuckets.mockReturnValue({ data: { buckets: [BUCKET], total: 1 }, isLoading: false });
    mockNamespaces.mockReturnValue({
      data: { namespaces: [{ namespace: ["ns-1"] }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<S3TablesDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "b1" }));
    await screen.findByText("ns-1");
    await user.click(screen.getByRole("button", { name: /Delete b1/ }));
    await screen.findByText(/Are you sure/);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await vi.waitFor(() => expect(mockDeleteBucketMutate).toHaveBeenCalledWith(BUCKET.arn));
    await vi.waitFor(() => expect(screen.queryByText("ns-1")).toBeNull());
  });
});
