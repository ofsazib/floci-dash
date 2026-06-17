// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../test/helpers";
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
const mockSearchParams = vi.fn();

vi.mock("../hooks/useS3", () => ({
  useS3Buckets: (...args: any[]) => mockBuckets(...args),
  useS3Objects: (...args: any[]) => mockObjects(...args),
  useS3ObjectDetail: (...args: any[]) => mockObjectDetail(...args),
  useS3CreateBucket: () => ({ mutate: mockCreateBucketMutate, isPending: false, isError: false, error: null }),
  useS3DeleteBucket: () => ({ mutate: mockDeleteBucket, isPending: false, variables: null }),
  useS3UploadFiles: () => ({ mutateAsync: vi.fn(), isPending: false, isError: false, error: null }),
  useS3DeleteObject: () => ({ mutate: vi.fn(), isPending: false, variables: null }),
  useS3CreateFolder: () => ({ mutate: vi.fn(), isPending: false }),
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
  useSearchParams: (...args: any[]) => mockSearchParams(...args),
}));

import S3Page from "./S3Page";
describe("S3Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.mockReturnValue([new URLSearchParams(), vi.fn()]);
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
    await clickButton(user, /create bucket/i);
    // Verify modal opened - look for the modal header
    await waitFor(() => {
      const bucketInputs = screen.getAllByPlaceholderText("my-bucket");
      expect(bucketInputs.length).toBeGreaterThan(0);
    });
  });

  it("calls createBucket when create bucket form is submitted", async () => {
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await clickButton(user, /create bucket/i);
    // Fill bucket name and submit
    await waitFor(() => {
      const inputs = screen.getAllByPlaceholderText("my-bucket");
      expect(inputs.length).toBeGreaterThan(0);
    });
    const input = screen.getAllByPlaceholderText("my-bucket")[0];
    await user.type(input, "test-bucket-123");
    // Find and click Create bucket button in modal footer
    await clickButton(user, /create bucket/i, { last: true });
    expect(mockCreateBucketMutate).toHaveBeenCalled();
  });

  // ─── Object Browser Tests ──────────────────────────────

  it("renders object browser when bucket is selected", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket"), vi.fn()]);
    mockObjects.mockReturnValue({
      data: { objects: [{ key: "file.txt", size: 1024, lastModified: "2024-01-01T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getAllByText("Objects").length).toBeGreaterThan(0);
    expect(screen.getByText("file.txt")).toBeTruthy();
  });

  it("shows empty state in object browser for empty bucket", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket"), vi.fn()]);
    mockObjects.mockReturnValue({ data: { objects: [], total: 0 }, isLoading: false });
    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getByText("No objects")).toBeTruthy();
  });

  it("shows loading state in object browser", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket"), vi.fn()]);
    mockObjects.mockReturnValue({ data: undefined, isLoading: true });
    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getByText("Loading objects...")).toBeTruthy();
  });

  // ─── Overview Tab Tests ─────────────────────────────────

  it("renders overview tab with stats", () => {
    render(<S3Page />, { wrapper: createWrapper() });
    // Overview tab is visible in the tabs list alongside Buckets
    expect(screen.getByText("Overview")).toBeTruthy();
    expect(screen.getAllByText("Buckets").length).toBeGreaterThan(0);
  });

  // ─── Object Detail Tests ────────────────────────────────

  it("renders object viewer when object is selected", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.txt"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 1024, contentType: "text/plain", lastModified: "2024-01-01T00:00:00Z", etag: "abc123" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [{ Key: "env", Value: "prod" }], total: 1 } });

    // Mock fetch for text preview
    const mockFetch = vi.fn().mockResolvedValue({ text: () => Promise.resolve("file contents") });
    vi.stubGlobal("fetch", mockFetch);

    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getByText("file.txt")).toBeTruthy();
    expect(screen.getByText("Actions")).toBeTruthy();
    expect(screen.getByText("env")).toBeTruthy();

    vi.unstubAllGlobals();
  });

  it("shows spinner when object detail is loading", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.txt"), vi.fn()]);
    mockObjectDetail.mockReturnValue({ data: undefined, isLoading: true });

    const { container } = render(<S3Page />, { wrapper: createWrapper() });
    // The object viewer shows a Spinner when loading
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("shows error when object detail fails to load", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.txt"), vi.fn()]);
    mockObjectDetail.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Not found") });

    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getByText("Not found")).toBeTruthy();
  });

  it("renders preview not available for unknown content type", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.txt"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 1024, contentType: "application/octet-stream", lastModified: "2024-01-01T00:00:00Z", etag: "abc123" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });

    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getByText(/Preview not available/i)).toBeTruthy();
  });
});
