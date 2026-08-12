// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock hooks ─────────────────────────────────────────

const mockBuckets = vi.fn();
const mockCreateBucket = vi.fn();
const mockDeleteBucket = vi.fn();
const mockIndexes = vi.fn();
const mockCreateIndex = vi.fn();
const mockDeleteIndex = vi.fn();
const mockGetVectors = vi.fn();
const mockPutVectors = vi.fn();
const mockQuery = vi.fn();

const createBucketState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
  isPending: false,
}));
const createIndexState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
  isPending: false,
}));
const putVectorsState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
  isPending: false,
}));
const queryState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
  isPending: false,
}));

vi.mock("../../hooks/useS3Vectors", () => ({
  useS3VectorsBuckets: (...args: any[]) => mockBuckets(...args),
  useS3VectorsBucket: () => ({ data: null, isLoading: false }),
  useS3VectorsCreateBucket: () => ({
    mutate: mockCreateBucket,
    isPending: createBucketState.isPending,
    isError: createBucketState.isError,
    error: createBucketState.error,
  }),
  useS3VectorsDeleteBucket: () => ({
    mutateAsync: mockDeleteBucket,
    isPending: false,
  }),
  useS3VectorsIndexes: (...args: any[]) => mockIndexes(...args),
  useS3VectorsIndex: () => ({ data: null, isLoading: false }),
  useS3VectorsCreateIndex: () => ({
    mutate: mockCreateIndex,
    isPending: createIndexState.isPending,
    isError: createIndexState.isError,
    error: createIndexState.error,
  }),
  useS3VectorsDeleteIndex: () => ({
    mutateAsync: mockDeleteIndex,
    isPending: false,
  }),
  useS3VectorsGetVectors: (...args: any[]) => mockGetVectors(...args),
  useS3VectorsPutVectors: () => ({
    mutate: mockPutVectors,
    isPending: putVectorsState.isPending,
    isError: putVectorsState.isError,
    error: putVectorsState.error,
  }),
  useS3VectorsDeleteVectors: () => ({ mutate: vi.fn(), isPending: false }),
  useS3VectorsQuery: () => ({
    mutate: mockQuery,
    isPending: queryState.isPending,
    isError: queryState.isError,
    error: queryState.error,
  }),
}));

const toastMock = vi.fn();
vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: toastMock }),
}));

import { S3VectorsDashboard } from "./S3VectorsDashboard";

// ─── Modal helpers ───────────────────────────────────────

/** Fire Escape on every mounted Cloudscape dialog (they stay mounted when hidden). */
function dismissModalWithEscape() {
  document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
    fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27 });
  });
}

/** Locate a modal dialog by its header text. */
function dialogOf(headerText: string): HTMLElement {
  const header = screen.getAllByText(headerText).find((h) => h.closest('[role="dialog"]'));
  return header!.closest('[role="dialog"]') as HTMLElement;
}

/** Assert the modal with the given header is hidden (Cloudscape uses display:none). */
function expectModalHidden(headerText: string) {
  expect(dialogOf(headerText).className).toContain("hidden");
}

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();
  createBucketState.isError = false;
  createBucketState.error = null;
  createBucketState.isPending = false;
  createIndexState.isError = false;
  createIndexState.error = null;
  createIndexState.isPending = false;
  putVectorsState.isError = false;
  putVectorsState.error = null;
  putVectorsState.isPending = false;
  queryState.isError = false;
  queryState.error = null;
  queryState.isPending = false;

  mockBuckets.mockReturnValue({
    data: { buckets: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockIndexes.mockReturnValue({
    data: { indexes: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockGetVectors.mockReturnValue({
    data: { vectors: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
});

// Navigate to the vector operations view (bucket selected → index selected)
async function navToVectorOps(user: any, bucketName: string, indexName: string) {
  mockBuckets.mockReturnValue({
    data: { buckets: [{ vectorBucketName: bucketName, vectorBucketArn: `arn:aws:s3vectors:bucket/${bucketName}` }], total: 1 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockIndexes.mockReturnValue({
    data: { indexes: [{ indexName, dimension: 128, distanceMetric: "cosine" }], total: 1 },
    isLoading: false,
    isError: false,
    error: null,
  });
  render(<S3VectorsDashboard />, { wrapper: createWrapper() });
  await waitFor(() => expect(screen.getByText(bucketName)).toBeTruthy());
  await user.click(screen.getByRole("button", { name: /Indexes/i }));
  await waitFor(() => expect(screen.getByText(indexName)).toBeTruthy());
  await user.click(screen.getByRole("button", { name: /Vectors/i }));
  await waitFor(() => expect(screen.getByText(/Vector Data/i)).toBeTruthy());
}

// ─── Tests ──────────────────────────────────────────────

describe("S3VectorsDashboard — buckets", () => {
  it("shows vector buckets header", () => {
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    expect(screen.getAllByText(/Vector Buckets/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders bucket list with data", () => {
    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "my-vector-bucket", vectorBucketArn: "arn:aws:s3vectors:us-east-1:123:bucket/my-bucket" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-vector-bucket")).toBeTruthy();
  });

  it("shows loading state", () => {
    mockBuckets.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    const { container } = render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("opens create bucket modal and submits", async () => {
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });

    // Click the Create Vector bucket button to open the modal
    await clickButton(user, /Create Vector bucket/i);
    await waitFor(() => expect(screen.getByText("Create Vector Bucket")).toBeTruthy());

    const input = screen.getByPlaceholderText("my-vector-bucket");
    await user.type(input, "test-bucket");

    // Click the modal's Create button (last match of "^Create$")
    await waitFor(async () => {
      const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
      const enabled = createBtns.find((b) => !b.hasAttribute("disabled"));
      if (!enabled) throw new Error("Create button still disabled");
      await user.click(enabled);
    });

    await waitFor(() => {
      expect(mockCreateBucket).toHaveBeenCalledWith(
        { vectorBucketName: "test-bucket" },
        expect.any(Object),
      );
    });
  });

  it("shows error alert in create bucket modal", async () => {
    createBucketState.isError = true;
    createBucketState.error = new Error("Bucket exists");

    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /create/i);
    await waitFor(() => expect(screen.getByText("Create Vector Bucket")).toBeTruthy());
    expect(screen.getByText("Bucket exists")).toBeTruthy();

    createBucketState.isError = false;
    createBucketState.error = null;
  });

  it("deletes a bucket", async () => {
    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "del-bucket", vectorBucketArn: "arn:aws:s3vectors:us-east-1:123:bucket/del-bucket" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("del-bucket")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete del-bucket/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => {
      expect(mockDeleteBucket).toHaveBeenCalledWith("del-bucket");
    });
  });

  it("renders bucket using fallback name field", () => {
    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ name: "fallback-bucket", vectorBucketArn: "arn:aws:s3vectors:bucket/fallback-bucket" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("fallback-bucket")).toBeTruthy();
  });

  it("filters buckets by name", async () => {
    mockBuckets.mockReturnValue({
      data: {
        buckets: [
          { vectorBucketName: "keep-bucket", vectorBucketArn: "arn:1" },
          { vectorBucketName: "drop-bucket", vectorBucketArn: "arn:2" },
        ],
        total: 2,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("keep-bucket")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Find by name"), "keep");
    await waitFor(() => {
      expect(screen.getByText("keep-bucket")).toBeTruthy();
      expect(screen.queryByText("drop-bucket")).toBeNull();
    });
  });

  it("deletes the currently selected bucket and resets selection", async () => {
    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "sel-bucket", vectorBucketArn: "arn:aws:s3vectors:bucket/sel-bucket" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("sel-bucket")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Indexes/i }));
    await waitFor(() => expect(screen.getByText(/Indexes in sel-bucket/i)).toBeTruthy());

    await user.click(screen.getByRole("button", { name: /Delete sel-bucket/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => {
      expect(mockDeleteBucket).toHaveBeenCalledWith("sel-bucket");
      // selection reset → the indexes table disappears
      expect(screen.queryByText(/Indexes in sel-bucket/i)).toBeNull();
    });
  });

  it("shows error toast when bucket delete fails", async () => {
    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "fail-bucket", vectorBucketArn: "arn:aws:s3vectors:bucket/fail-bucket" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDeleteBucket.mockRejectedValue(new Error("delete failed"));
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("fail-bucket")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete fail-bucket/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "delete failed"));
  });

  it("cancels and dismisses the create bucket modal", async () => {
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create Vector bucket/i);
    // First Cancel button in DOM order belongs to the Create Vector Bucket modal
    await clickButton(user, /^Cancel$/i);
    expect(mockCreateBucket).not.toHaveBeenCalled();
    // Reopen, then dismiss via the modal close (X) button (modals portal to document.body).
    // First dismiss control in document order belongs to the Create Vector Bucket modal.
    await clickButton(user, /Create Vector bucket/i);
    const dismissBtn = document.querySelector('[class*="dismiss"]');
    expect(dismissBtn).toBeTruthy();
    await user.click(dismissBtn as HTMLElement);
    expect(mockCreateBucket).not.toHaveBeenCalled();
  });

  it("shows success toast when bucket creation succeeds", async () => {
    mockCreateBucket.mockImplementation((_args: any, opts?: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create Vector bucket/i);
    await user.type(screen.getByPlaceholderText("my-vector-bucket"), "ok-bucket");
    await waitFor(async () => {
      const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
      const enabled = createBtns.find((b) => !b.hasAttribute("disabled"));
      if (!enabled) throw new Error("Create button still disabled");
      await user.click(enabled);
    });
    await waitFor(() => {
      expect(mockCreateBucket).toHaveBeenCalledWith({ vectorBucketName: "ok-bucket" }, expect.any(Object));
      expect(toastMock).toHaveBeenCalledWith("success", "Bucket ok-bucket created");
    });
  });

  it("shows error toast when bucket creation fails", async () => {
    mockCreateBucket.mockImplementation((_args: any, opts?: any) =>
      opts?.onError?.(new Error("bucket create failed"))
    );
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create Vector bucket/i);
    await user.type(screen.getByPlaceholderText("my-vector-bucket"), "fail-bucket");
    await waitFor(async () => {
      const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
      const enabled = createBtns.find((b) => !b.hasAttribute("disabled"));
      if (!enabled) throw new Error("Create button still disabled");
      await user.click(enabled);
    });
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "bucket create failed"));
  });
});

describe("S3VectorsDashboard — indexes", () => {
  it("shows indexes when bucket is selected", async () => {
    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "bucket-with-index", vectorBucketArn: "arn:aws:s3vectors:bucket/bucket-with-index" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("bucket-with-index")).toBeTruthy());

    await user.click(screen.getByRole("button", { name: /Indexes/i }));
    await waitFor(() => expect(screen.getByText(/Indexes in bucket-with-index/i)).toBeTruthy());
  });

  it("renders index list with data", async () => {
    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "bucket-1", vectorBucketArn: "arn:aws:s3vectors:bucket/bucket-1" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIndexes.mockReturnValue({
      data: {
        indexes: [
          {
            indexName: "my-index",
            dimension: 128,
            distanceMetric: "cosine",
            dataType: "float32",
            indexArn: "arn:aws:s3vectors:index/my-index",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("bucket-1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Indexes/i }));
    await waitFor(() => expect(screen.getByText("my-index")).toBeTruthy());
    expect(screen.getByText("128")).toBeTruthy();
    expect(screen.getAllByText("cosine").length).toBeGreaterThanOrEqual(1);
  });

  it("opens create index modal and submits", async () => {
    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "bucket-idx", vectorBucketArn: "arn:aws:s3vectors:bucket/bucket-idx" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("bucket-idx")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Indexes/i }));
    await waitFor(() => expect(screen.getByText(/Indexes in bucket-idx/i)).toBeTruthy());

    await clickButton(user, /create/i);
    await waitFor(() => {
      const modals = screen.getAllByText("Create Index");
      expect(modals.length).toBeGreaterThanOrEqual(1);
    });

    const nameInput = screen.getByPlaceholderText("my-index");
    await user.type(nameInput, "new-index");
    const dimInput = screen.getByPlaceholderText("128");
    await user.type(dimInput, "64");

    // Wait for modal Create button to be enabled
    await waitFor(() => {
      const btns = screen.getAllByRole("button", { name: /^Create$/i });
      const enabled = btns.find((b) => !b.hasAttribute("disabled"));
      expect(enabled).toBeTruthy();
    });

    // Click LAST Create button (modal footer)
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateIndex).toHaveBeenCalledWith(
        { bucketName: "bucket-idx", indexName: "new-index", dimension: 64, distanceMetric: "cosine" },
        expect.any(Object),
      );
    });
  });

  it("shows error alert in create index modal", async () => {
    createIndexState.isError = true;
    createIndexState.error = new Error("Index exists");

    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "bucket-idx-err", vectorBucketArn: "arn:aws:s3vectors:bucket/bucket-idx-err" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("bucket-idx-err")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Indexes/i }));
    await waitFor(() => expect(screen.getByText(/Indexes in bucket-idx-err/i)).toBeTruthy());

    await clickButton(user, /create/i);
    await waitFor(() => {
      const modals = screen.getAllByText("Create Index");
      expect(modals.length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText("Index exists")).toBeTruthy();

    createIndexState.isError = false;
    createIndexState.error = null;
  });

  it("renders index with fallback fields", async () => {
    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "bucket-fb", vectorBucketArn: "arn:aws:s3vectors:bucket/bucket-fb" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIndexes.mockReturnValue({
      data: {
        indexes: [{ name: "fb-index", indexArn: "arn:aws:s3vectors:index/fb-index" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("bucket-fb")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Indexes/i }));
    await waitFor(() => expect(screen.getByText("fb-index")).toBeTruthy());
    // dimension + distanceMetric fall back to "-", dataType falls back to "float32"
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("float32").length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty indexes when data is undefined", async () => {
    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "bucket-e", vectorBucketArn: "arn:aws:s3vectors:bucket/bucket-e" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIndexes.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null });
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("bucket-e")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Indexes/i }));
    await waitFor(() => expect(screen.getByText(/Indexes in bucket-e/i)).toBeTruthy());
    // ResourceTable empty title is "No indexs found" (resourceName "Index" + "s")
    expect(screen.getByText(/No index/i)).toBeTruthy();
  });

  it("deletes an index", async () => {
    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "bucket-del", vectorBucketArn: "arn:aws:s3vectors:bucket/bucket-del" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIndexes.mockReturnValue({
      data: { indexes: [{ indexName: "del-index", dimension: 128, distanceMetric: "cosine" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("bucket-del")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Indexes/i }));
    await waitFor(() => expect(screen.getByText("del-index")).toBeTruthy());

    await user.click(screen.getByRole("button", { name: /Delete del-index/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => {
      expect(mockDeleteIndex).toHaveBeenCalledWith({ bucketName: "bucket-del", indexName: "del-index" });
    });
  });

  it("deletes the selected index and clears the vector view", async () => {
    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "bucket-sel", vectorBucketArn: "arn:aws:s3vectors:bucket/bucket-sel" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIndexes.mockReturnValue({
      data: { indexes: [{ indexName: "sel-index", dimension: 128, distanceMetric: "cosine" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("bucket-sel")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Indexes/i }));
    await waitFor(() => expect(screen.getByText("sel-index")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Vectors/i }));
    await waitFor(() => expect(screen.getByText(/Vector Data/i)).toBeTruthy());

    await user.click(screen.getByRole("button", { name: /Delete sel-index/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => {
      expect(mockDeleteIndex).toHaveBeenCalledWith({ bucketName: "bucket-sel", indexName: "sel-index" });
      // selectedIndex reset → the vector data section disappears
      expect(screen.queryByText(/Vector Data/i)).toBeNull();
    });
  });

  it("shows error toast when index delete fails", async () => {
    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "bucket-fail", vectorBucketArn: "arn:aws:s3vectors:bucket/bucket-fail" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIndexes.mockReturnValue({
      data: { indexes: [{ indexName: "idx-fail", dimension: 128, distanceMetric: "cosine" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockDeleteIndex.mockRejectedValue(new Error("index delete failed"));
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("bucket-fail")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Indexes/i }));
    await waitFor(() => expect(screen.getByText("idx-fail")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete idx-fail/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "index delete failed"));
  });

  it("filters indexes by name", async () => {
    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "bucket-fi", vectorBucketArn: "arn:aws:s3vectors:bucket/bucket-fi" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIndexes.mockReturnValue({
      data: {
        indexes: [
          { indexName: "idx-a", dimension: 128, distanceMetric: "cosine" },
          { indexName: "idx-b", dimension: 64, distanceMetric: "euclidean" },
        ],
        total: 2,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("bucket-fi")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Indexes/i }));
    await waitFor(() => expect(screen.getByText("idx-a")).toBeTruthy());
    // [0] is the buckets table filter, [1] is the indexes table filter
    const filterInputs = screen.getAllByPlaceholderText("Find by name");
    await user.type(filterInputs[1], "idx-a");
    await waitFor(() => {
      expect(screen.getByText("idx-a")).toBeTruthy();
      expect(screen.queryByText("idx-b")).toBeNull();
    });
  });

  it("shows success toast when index creation succeeds", async () => {
    mockCreateIndex.mockImplementation((_args: any, opts?: any) => opts?.onSuccess?.());
    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "bucket-ok", vectorBucketArn: "arn:aws:s3vectors:bucket/bucket-ok" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIndexes.mockReturnValue({ data: { indexes: [], total: 0 }, isLoading: false, isError: false, error: null });
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("bucket-ok")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Indexes/i }));
    await waitFor(() => expect(screen.getByText(/Indexes in bucket-ok/i)).toBeTruthy());

    await clickButton(user, /Create Index/i);
    await user.type(screen.getByPlaceholderText("my-index"), "ok-index");
    await user.type(screen.getByPlaceholderText("128"), "64");
    await waitFor(async () => {
      const btns = screen.getAllByRole("button", { name: /^Create$/i });
      const enabled = btns.find((b) => !b.hasAttribute("disabled"));
      if (!enabled) throw new Error("Create button still disabled");
      await user.click(enabled);
    });
    await waitFor(() => {
      expect(mockCreateIndex).toHaveBeenCalledWith(
        { bucketName: "bucket-ok", indexName: "ok-index", dimension: 64, distanceMetric: "cosine" },
        expect.any(Object),
      );
      expect(toastMock).toHaveBeenCalledWith("success", "Index ok-index created");
    });
  });

  it("shows error toast when index creation fails", async () => {
    mockCreateIndex.mockImplementation((_args: any, opts?: any) =>
      opts?.onError?.(new Error("index create failed"))
    );
    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "bucket-ok2", vectorBucketArn: "arn:aws:s3vectors:bucket/bucket-ok2" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIndexes.mockReturnValue({ data: { indexes: [], total: 0 }, isLoading: false, isError: false, error: null });
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("bucket-ok2")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Indexes/i }));
    await waitFor(() => expect(screen.getByText(/Indexes in bucket-ok2/i)).toBeTruthy());

    await clickButton(user, /Create Index/i);
    await user.type(screen.getByPlaceholderText("my-index"), "ok-index2");
    await user.type(screen.getByPlaceholderText("128"), "64");
    await waitFor(async () => {
      const btns = screen.getAllByRole("button", { name: /^Create$/i });
      const enabled = btns.find((b) => !b.hasAttribute("disabled"));
      if (!enabled) throw new Error("Create button still disabled");
      await user.click(enabled);
    });
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "index create failed"));
  });

  it("changes distance metric via select", async () => {
    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "bucket-m", vectorBucketArn: "arn:aws:s3vectors:bucket/bucket-m" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIndexes.mockReturnValue({ data: { indexes: [], total: 0 }, isLoading: false, isError: false, error: null });
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("bucket-m")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Indexes/i }));
    await waitFor(() => expect(screen.getByText(/Indexes in bucket-m/i)).toBeTruthy());

    await clickButton(user, /Create Index/i);
    // Click the Select trigger (shows current option "cosine"), then pick "euclidean".
    // Relies on the indexes table being EMPTY here so "cosine" only matches the Select trigger.
    await user.click(screen.getAllByText("cosine")[0]);
    await user.click(screen.getAllByText("euclidean")[0]);
    await user.type(screen.getByPlaceholderText("my-index"), "metric-index");
    await user.type(screen.getByPlaceholderText("128"), "16");
    await waitFor(async () => {
      const btns = screen.getAllByRole("button", { name: /^Create$/i });
      const enabled = btns.find((b) => !b.hasAttribute("disabled"));
      if (!enabled) throw new Error("Create button still disabled");
      await user.click(enabled);
    });
    await waitFor(() => {
      expect(mockCreateIndex).toHaveBeenCalledWith(
        { bucketName: "bucket-m", indexName: "metric-index", dimension: 16, distanceMetric: "euclidean" },
        expect.any(Object),
      );
    });
  });
});

describe("S3VectorsDashboard — vector operations", () => {
  it("shows vector data section when bucket and index selected", async () => {
    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "bucket-v", vectorBucketArn: "arn:aws:s3vectors:bucket/bucket-v" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIndexes.mockReturnValue({
      data: {
        indexes: [{ indexName: "my-index", dimension: 128, distanceMetric: "cosine" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("bucket-v")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Indexes/i }));
    await waitFor(() => expect(screen.getByText("my-index")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Vectors/i }));
    await waitFor(() => expect(screen.getByText(/Vector Data/i)).toBeTruthy());

    // Buttons "Put Vectors" and "Query" should be visible
    expect(screen.getByRole("button", { name: /Put Vectors/i })).toBeTruthy();
    // Use getAllByRole for Query since there might be multiple matches (filter input etc.)
    const queryBtns = screen.getAllByRole("button", { name: /^Query$/i });
    expect(queryBtns.length).toBeGreaterThanOrEqual(1);
  });

  it("shows error alert in put vectors modal", async () => {
    putVectorsState.isError = true;
    putVectorsState.error = new Error("Invalid vector data");

    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "bucket-pv-err", vectorBucketArn: "arn:aws:s3vectors:bucket/bucket-pv-err" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIndexes.mockReturnValue({
      data: {
        indexes: [{ indexName: "pv-err-index", dimension: 128, distanceMetric: "cosine" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    const { container } = render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("bucket-pv-err")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Indexes/i }));
    await waitFor(() => expect(screen.getByText("pv-err-index")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Vectors/i }));
    await waitFor(() => expect(container.textContent).toContain("Vector Data"));

    await user.click(screen.getByRole("button", { name: /Put Vectors/i }));
    await waitFor(() => {
      const modalTexts = screen.getAllByText("Put Vectors");
      expect(modalTexts.length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText("Invalid vector data")).toBeTruthy();

    putVectorsState.isError = false;
    putVectorsState.error = null;
  });

  it("opens put vectors modal and submits", async () => {
    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "bucket-pv", vectorBucketArn: "arn:aws:s3vectors:bucket/bucket-pv" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIndexes.mockReturnValue({
      data: {
        indexes: [{ indexName: "pv-index", dimension: 128, distanceMetric: "cosine" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("bucket-pv")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Indexes/i }));
    await waitFor(() => expect(screen.getByText("pv-index")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Vectors/i }));
    await waitFor(() => expect(screen.getByText(/Vector Data/i)).toBeTruthy());

    await user.click(screen.getByRole("button", { name: /Put Vectors/i }));
    await waitFor(() => {
      const modalTexts = screen.getAllByText("Put Vectors");
      expect(modalTexts.length).toBeGreaterThanOrEqual(1);
    });

    await user.click(screen.getByRole("button", { name: /^Put$/i }));
    await waitFor(() => {
      expect(mockPutVectors).toHaveBeenCalledWith(
        { bucketName: "bucket-pv", indexName: "pv-index", vectors: [] },
        expect.any(Object),
      );
    });
  });

  it("opens query modal and submits", async () => {
    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "bucket-q", vectorBucketArn: "arn:aws:s3vectors:bucket/bucket-q" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIndexes.mockReturnValue({
      data: {
        indexes: [{ indexName: "q-index", dimension: 128, distanceMetric: "cosine" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("bucket-q")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Indexes/i }));
    await waitFor(() => expect(screen.getByText("q-index")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Vectors/i }));
    await waitFor(() => expect(screen.getByText(/Vector Data/i)).toBeTruthy());

    // Click the header Query button (actions, not filter) — hidden modals stay in the DOM,
    // so the LAST "Query" button may be a hidden modal's submit. Use the first (header) one.
    const headerQueryBtns = screen.getAllByRole("button", { name: /^Query$/i });
    await user.click(headerQueryBtns[0]);
    await waitFor(() => {
      const modalTexts = screen.getAllByText("Query Vectors");
      expect(modalTexts.length).toBeGreaterThanOrEqual(1);
    });

    // Now both header + modal Query buttons visible — click the last one (modal)
    const allQueryBtns = screen.getAllByRole("button", { name: /^Query$/i });
    await user.click(allQueryBtns[allQueryBtns.length - 1]);
    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledWith(
        {
          bucketName: "bucket-q",
          indexName: "q-index",
          queryVector: [0.1, 0.2, 0.3],
          topK: 10,
          returnMetadata: true,
        },
        expect.any(Object),
      );
    });
  });

  it("shows error alert in query modal", async () => {
    queryState.isError = true;
    queryState.error = new Error("Query timeout");

    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "bucket-q-err", vectorBucketArn: "arn:aws:s3vectors:bucket/bucket-q-err" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIndexes.mockReturnValue({
      data: {
        indexes: [{ indexName: "q-err-index", dimension: 128, distanceMetric: "cosine" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("bucket-q-err")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Indexes/i }));
    await waitFor(() => expect(screen.getByText("q-err-index")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Vectors/i }));
    await waitFor(() => expect(screen.getByText(/Vector Data/i)).toBeTruthy());

    const hdrQueryBtns = screen.getAllByRole("button", { name: /^Query$/i });
    await user.click(hdrQueryBtns[hdrQueryBtns.length - 1]);
    await waitFor(() => {
      const modalTexts = screen.getAllByText("Query Vectors");
      expect(modalTexts.length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText("Query timeout")).toBeTruthy();

    queryState.isError = false;
    queryState.error = null;
  });

  it("shows vector data section description with bucket and index names", async () => {
    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "bucket-desc", vectorBucketArn: "arn:aws:s3vectors:bucket/bucket-desc" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIndexes.mockReturnValue({
      data: {
        indexes: [{ indexName: "desc-index", dimension: 128, distanceMetric: "cosine" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    const { container } = render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("bucket-desc")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Indexes/i }));
    await waitFor(() => expect(screen.getByText("desc-index")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Vectors/i }));
    await waitFor(() => expect(container.textContent).toContain("Vector Data"));
    expect(container.textContent).toContain("bucket-desc");
    expect(container.textContent).toContain("desc-index");
  });

  it("shows query results when query completes", async () => {
    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "bucket-qr", vectorBucketArn: "arn:aws:s3vectors:bucket/bucket-qr" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIndexes.mockReturnValue({
      data: {
        indexes: [{ indexName: "qr-index", dimension: 128, distanceMetric: "cosine" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    // Make mockQuery invoke onSuccess with query results
    mockQuery.mockImplementation((_args: any, opts?: any) => {
      if (opts?.onSuccess) {
        opts.onSuccess({ vectors: [{ key: "result-1", distance: 0.95, metadata: { label: "test" } }] });
      }
    });

    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("bucket-qr")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Indexes/i }));
    await waitFor(() => expect(screen.getByText("qr-index")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Vectors/i }));
    await waitFor(() => expect(screen.getByText(/Vector Data/i)).toBeTruthy());

    // Click header Query button to open modal
    const hdrQueryBtns = screen.getAllByRole("button", { name: /^Query$/i });
    await user.click(hdrQueryBtns[hdrQueryBtns.length - 1]);
    await waitFor(() => {
      const modalTexts = screen.getAllByText("Query Vectors");
      expect(modalTexts.length).toBeGreaterThanOrEqual(1);
    });

    // Now both header + modal Query buttons visible — click the last one (modal submit)
    const allQueryBtns = screen.getAllByRole("button", { name: /^Query$/i });
    await user.click(allQueryBtns[allQueryBtns.length - 1]);
    await waitFor(() => {
      expect(screen.getByText("result-1")).toBeTruthy();
    });
  });

  it("shows query results with missing distance and metadata", async () => {
    mockQuery.mockImplementation((_args: any, opts?: any) =>
      opts?.onSuccess?.({ vectors: [{ key: "r-fallback" }] })
    );
    const user = userEvent.setup();
    await navToVectorOps(user, "bucket-qf", "qf-index");
    const allQueryBtns = screen.getAllByRole("button", { name: /^Query$/i });
    await user.click(allQueryBtns[allQueryBtns.length - 1]);
    await waitFor(() => expect(screen.getByText("r-fallback")).toBeTruthy());
    // distance falls back to "-", metadata count falls back to 0
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(1);
  });

  it("shows toast when query returns no vectors", async () => {
    mockQuery.mockImplementation((_args: any, opts?: any) => opts?.onSuccess?.({}));
    const user = userEvent.setup();
    await navToVectorOps(user, "bucket-q0", "q0-index");
    const allQueryBtns = screen.getAllByRole("button", { name: /^Query$/i });
    await user.click(allQueryBtns[allQueryBtns.length - 1]);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", "Query returned 0 results"));
  });

  it("shows error toast when query fails", async () => {
    mockQuery.mockImplementation((_args: any, opts?: any) => opts?.onError?.(new Error("query failed")));
    const user = userEvent.setup();
    await navToVectorOps(user, "bucket-qe", "qe-index");
    const allQueryBtns = screen.getAllByRole("button", { name: /^Query$/i });
    await user.click(allQueryBtns[allQueryBtns.length - 1]);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "query failed"));
  });

  it("shows invalid JSON toast for query vector", async () => {
    const user = userEvent.setup();
    await navToVectorOps(user, "bucket-qi", "qi-index");
    fireEvent.change(screen.getByPlaceholderText("[0.1, 0.2, 0.3]"), { target: { value: "not-json" } });
    const allQueryBtns = screen.getAllByRole("button", { name: /^Query$/i });
    await user.click(allQueryBtns[allQueryBtns.length - 1]);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Invalid JSON for query vector"));
  });

  it("uses default topK 10 when topK is empty", async () => {
    const user = userEvent.setup();
    await navToVectorOps(user, "bucket-tk", "tk-index");
    fireEvent.change(screen.getByPlaceholderText("10"), { target: { value: "" } });
    const allQueryBtns = screen.getAllByRole("button", { name: /^Query$/i });
    await user.click(allQueryBtns[allQueryBtns.length - 1]);
    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({ topK: 10 }), expect.any(Object));
    });
  });

  it("shows invalid JSON toast for put vectors", async () => {
    const user = userEvent.setup();
    await navToVectorOps(user, "bucket-pi", "pi-index");
    const ta = screen.getByPlaceholderText('[{"key":"v1","data":{"float32":[0.1,0.2]},"metadata":{"label":"test"}}]');
    fireEvent.change(ta, { target: { value: "not-json" } });
    await user.click(screen.getByRole("button", { name: /^Put$/i }));
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Invalid JSON"));
  });

  it("shows success toast when vectors are stored", async () => {
    mockPutVectors.mockImplementation((_args: any, opts?: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    await navToVectorOps(user, "bucket-ps", "ps-index");
    await user.click(screen.getByRole("button", { name: /^Put$/i }));
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", "Vectors stored"));
  });

  it("shows error toast when putting vectors fails", async () => {
    mockPutVectors.mockImplementation((_args: any, opts?: any) => opts?.onError?.(new Error("put failed")));
    const user = userEvent.setup();
    await navToVectorOps(user, "bucket-pe", "pe-index");
    await user.click(screen.getByRole("button", { name: /^Put$/i }));
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "put failed"));
  });
});

describe("S3VectorsDashboard — error alert fallbacks", () => {
  it("shows Failed fallback in create bucket modal", () => {
    createBucketState.isError = true;
    createBucketState.error = {} as Error;
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed")).toBeTruthy();
  });

  it("shows Failed fallback in create index modal", () => {
    createIndexState.isError = true;
    createIndexState.error = {} as Error;
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed")).toBeTruthy();
  });

  it("shows Failed fallback in put vectors modal", () => {
    putVectorsState.isError = true;
    putVectorsState.error = {} as Error;
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed")).toBeTruthy();
  });

  it("shows Failed fallback in query modal", () => {
    queryState.isError = true;
    queryState.error = {} as Error;
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed")).toBeTruthy();
  });
});

describe("S3VectorsDashboard — fallback rendering", () => {
  it("shows hyphen for missing ARN values", () => {
    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "no-arn-bucket", vectorBucketArn: null }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("no-arn-bucket")).toBeTruthy();
  });
});

describe("S3VectorsDashboard — modal dismissals", () => {
  it("dismisses create index modal with Escape and Cancel", async () => {
    mockBuckets.mockReturnValue({
      data: {
        buckets: [{ vectorBucketName: "bucket-dismiss", vectorBucketArn: "arn:aws:s3vectors:bucket/bucket-dismiss" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<S3VectorsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("bucket-dismiss")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Indexes/i }));
    await waitFor(() => expect(screen.getByText(/Indexes in bucket-dismiss/i)).toBeTruthy());
    await clickButton(user, /create/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-index")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create Index"));
    await clickButton(user, /create/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-index")).toBeTruthy());
    await user.click(within(dialogOf("Create Index")).getByRole("button", { name: /Cancel/i }));
    await waitFor(() => expectModalHidden("Create Index"));
  });

  it("dismisses put vectors modal with Escape and Cancel", async () => {
    const user = userEvent.setup();
    await navToVectorOps(user, "bucket-pvd", "pvd-index");
    await user.click(screen.getByRole("button", { name: /Put Vectors/i }));
    await waitFor(() =>
      expect(screen.getByPlaceholderText('[{"key":"v1","data":{"float32":[0.1,0.2]},"metadata":{"label":"test"}}]')).toBeTruthy()
    );
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Put Vectors"));
    await user.click(screen.getByRole("button", { name: /Put Vectors/i }));
    await waitFor(() =>
      expect(screen.getByPlaceholderText('[{"key":"v1","data":{"float32":[0.1,0.2]},"metadata":{"label":"test"}}]')).toBeTruthy()
    );
    await user.click(within(dialogOf("Put Vectors")).getByRole("button", { name: /Cancel/i }));
    await waitFor(() => expectModalHidden("Put Vectors"));
  });

  it("dismisses query modal with Escape and Cancel", async () => {
    const user = userEvent.setup();
    await navToVectorOps(user, "bucket-qd", "qd-index");
    await user.click(screen.getAllByRole("button", { name: /^Query$/i })[0]);
    await waitFor(() => expect(screen.getByPlaceholderText("[0.1, 0.2, 0.3]")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Query Vectors"));
    await user.click(screen.getAllByRole("button", { name: /^Query$/i })[0]);
    await waitFor(() => expect(screen.getByPlaceholderText("[0.1, 0.2, 0.3]")).toBeTruthy());
    await user.click(within(dialogOf("Query Vectors")).getByRole("button", { name: /Cancel/i }));
    await waitFor(() => expectModalHidden("Query Vectors"));
  });
});
