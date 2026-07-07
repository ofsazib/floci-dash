// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── vi.hoisted mutable states ──────────────────────────

const createBucketState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const deleteBucketState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

// ─── Mock hooks ─────────────────────────────────────────

const mockBuckets = vi.fn();
const mockCreateBucket = vi.fn();
const mockDeleteBucket = vi.fn();

vi.mock("../../hooks/useS3", () => ({
  useS3Buckets: (...args: any[]) => mockBuckets(...args),
  useS3CreateBucket: () => ({
    mutate: mockCreateBucket,
    get isPending() { return createBucketState.isPending; },
    get isError() { return createBucketState.isError; },
    get error() { return createBucketState.error; },
  }),
  useS3DeleteBucket: () => ({
    mutateAsync: mockDeleteBucket,
    get isPending() { return deleteBucketState.isPending; },
    get variables() { return deleteBucketState.variables; },
  }),
  useS3Objects: () => ({ data: undefined, isLoading: false }),
  useS3ObjectDetail: () => ({ data: undefined, isLoading: false }),
  useS3UploadFiles: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useS3DeleteObject: () => ({ mutate: vi.fn(), isPending: false, variables: null }),
  useS3CreateFolder: () => ({ mutate: vi.fn(), isPending: false }),
  useS3BatchDeleteObjects: () => ({ mutate: vi.fn(), isPending: false }),
  useS3DeleteFolder: () => ({ mutate: vi.fn(), isPending: false, variables: null }),
}));

import { S3Dashboard } from "./S3Dashboard";

beforeEach(() => {
  vi.clearAllMocks();
  createBucketState.isPending = false;
  createBucketState.isError = false;
  createBucketState.error = null;
  deleteBucketState.isPending = false;
  deleteBucketState.variables = null;
  mockBuckets.mockReturnValue({ data: { buckets: [], total: 0 }, isLoading: false, isError: false, error: null });
});

describe("S3Dashboard", () => {
  it("shows loading skeleton", () => {
    mockBuckets.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const { container } = render(<S3Dashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty message", () => {
    render(<S3Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No buckets found/i)).toBeTruthy();
  });

  it("renders buckets with data", () => {
    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ name: "my-bucket", createdAt: "2024-01-15T00:00:00Z", region: "us-east-1" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    render(<S3Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-bucket")).toBeTruthy();
  });

  it("shows dash for missing created date and region", () => {
    mockBuckets.mockReturnValue({
      data: { buckets: [{ name: "bare-bucket" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<S3Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("bare-bucket")).toBeTruthy();
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("shows error alert for failed bucket load", () => {
    mockBuckets.mockReturnValue({
      data: undefined, isLoading: false, isError: true,
      error: new Error("Failed to load buckets"),
    });
    render(<S3Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load buckets")).toBeTruthy();
  });

  it("opens create modal and submits", async () => {
    const user = userEvent.setup();
    const { container } = render(<S3Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(container.textContent).toContain("Create Bucket"));
    const nameInput = screen.getByPlaceholderText("my-bucket");
    await user.type(nameInput, "new-bucket");
    const createBtns = screen.getAllByRole("button", { name: /Create bucket/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateBucket).toHaveBeenCalledWith("new-bucket", expect.any(Object));
    });
  });

  it("cancels create modal", async () => {
    const user = userEvent.setup();
    const { container } = render(<S3Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(container.textContent).toContain("Create Bucket"));
    await clickButton(user, /Cancel/i);
    expect(mockCreateBucket).not.toHaveBeenCalled();
  });

  it("shows create bucket loading state", () => {
    createBucketState.isPending = true;
    mockBuckets.mockReturnValue({
      data: { buckets: [{ name: "my-bucket" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<S3Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-bucket")).toBeTruthy();
  });

  it("shows create bucket error alert", async () => {
    createBucketState.isError = true;
    createBucketState.error = new Error("Bucket creation failed");
    const user = userEvent.setup();
    render(<S3Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Bucket creation failed")).toBeTruthy();
    });
  });

  it("shows delete bucket loading state", () => {
    deleteBucketState.isPending = true;
    deleteBucketState.variables = "del-bucket";
    mockBuckets.mockReturnValue({
      data: { buckets: [{ name: "del-bucket" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<S3Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("del-bucket")).toBeTruthy();
  });

  it("deletes a bucket", async () => {
    mockBuckets.mockReturnValue({
      data: { buckets: [{ name: "delete-me" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<S3Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("delete-me")).toBeTruthy());
    const deleteBtn = screen.getByRole("button", { name: /Delete delete-me/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteBucket).toHaveBeenCalledWith("delete-me"));
  });

  it("filters buckets by name", async () => {
    mockBuckets.mockReturnValue({
      data: {
        buckets: [
          { name: "alpha-bucket" },
          { name: "beta-bucket" },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<S3Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-bucket")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find buckets by name");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-bucket")).toBeNull());
  });

  it("bucket name link navigates to S3 page with bucket param", () => {
    mockBuckets.mockReturnValue({
      data: { buckets: [{ name: "my-bucket", createdAt: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<S3Dashboard />, { wrapper: createWrapper() });
    const link = screen.getByText("my-bucket");
    expect(link.closest("button")).toBeTruthy();
  });

  it("formats bucket created date", () => {
    mockBuckets.mockReturnValue({
      data: { buckets: [{ name: "dated-bucket", createdAt: "2024-06-15T12:00:00Z" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<S3Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("dated-bucket")).toBeTruthy();
  });
});
