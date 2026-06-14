// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockBuckets = vi.fn();
const mockObjects = vi.fn();
const mockObjectDetail = vi.fn();
const mockCreateBucketMutate = vi.fn();
const mockDeleteBucket = vi.fn();
const mockUploadFiles = vi.fn();
const mockDeleteObject = vi.fn();
const mockObjectTags = vi.fn();
const mockUpdateObjectTags = vi.fn();

vi.mock("../hooks/useS3", () => ({
  useS3Buckets: (...args: any[]) => mockBuckets(...args),
  useS3Objects: (...args: any[]) => mockObjects(...args),
  useS3ObjectDetail: (...args: any[]) => mockObjectDetail(...args),
  useS3CreateBucket: () => ({ mutate: mockCreateBucketMutate, isPending: false, isError: false, error: null }),
  useS3DeleteBucket: () => ({ mutate: mockDeleteBucket, isPending: false, variables: null }),
  useS3UploadFiles: () => ({ mutateAsync: vi.fn(), isPending: false, isError: false, error: null }),
  useS3DeleteObject: () => ({ mutate: vi.fn(), isPending: false, variables: null }),
}));

vi.mock("../hooks/useS3Config", () => ({
  useS3ObjectTags: (...args: any[]) => mockObjectTags(...args),
  useS3UpdateObjectTags: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../hooks/useSystem", () => ({
  useHealth: () => ({ data: { services: { s3: "running" } } }),
}));

vi.mock("../components/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../components/ConfirmDialog", () => ({
  useConfirmDialog: () => ({ confirm: vi.fn(() => Promise.resolve(true)), dialog: null }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

import S3Page from "./S3Page";

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("S3Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBuckets.mockReturnValue({
      data: { buckets: [{ name: "my-bucket", createdAt: "2024-01-01T00:00:00Z" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockObjects.mockReturnValue({
      data: { objects: [], total: 0 },
      isLoading: false,
    });
    mockObjectDetail.mockReturnValue({ data: undefined, isLoading: false });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });
  });

  // ─── Render State Tests ─────────────────────────────────

  it("renders bucket list", () => {
    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getAllByText("S3").length).toBeGreaterThan(0);
    expect(screen.getByText("my-bucket")).toBeTruthy();
  });

  it("shows empty state when no buckets", () => {
    mockBuckets.mockReturnValue({
      data: { buckets: [], total: 0 },
      isLoading: false, isError: false, error: null,
    });
    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getByText("No buckets")).toBeTruthy();
    expect(screen.getAllByText("Create bucket").length).toBeGreaterThan(0);
  });

  it("shows loading state", () => {
    mockBuckets.mockReturnValue({
      data: undefined, isLoading: true, isError: false, error: null,
    });
    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getByText("Loading buckets...")).toBeTruthy();
  });

  it("shows error state", () => {
    mockBuckets.mockReturnValue({
      data: undefined, isLoading: false, isError: true, error: new Error("Failed to load"),
    });
    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });

  // ─── Interaction Tests ──────────────────────────────────

  it("opens create bucket modal and submits", async () => {
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    // Find "Create bucket" buttons by role and click the first one
    const createBtns = screen.getAllByRole("button", { name: /create bucket/i });
    await user.click(createBtns[0]);
    // Verify modal opened - look for the modal header
    await waitFor(() => {
      const bucketInputs = screen.getAllByPlaceholderText("my-bucket");
      expect(bucketInputs.length).toBeGreaterThan(0);
    });
  });

  it("calls createBucket when create bucket form is submitted", async () => {
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    // Open create bucket modal
    const createBtns = screen.getAllByRole("button", { name: /create bucket/i });
    await user.click(createBtns[0]);
    // Fill bucket name and submit
    await waitFor(() => {
      const inputs = screen.getAllByPlaceholderText("my-bucket");
      expect(inputs.length).toBeGreaterThan(0);
    });
    const input = screen.getAllByPlaceholderText("my-bucket")[0];
    await user.type(input, "test-bucket-123");
    // Find and click Create bucket button in modal footer
    const modalBtns = screen.getAllByRole("button", { name: /create bucket/i });
    await user.click(modalBtns[modalBtns.length - 1]);
    expect(mockCreateBucketMutate).toHaveBeenCalled();
  });
});
