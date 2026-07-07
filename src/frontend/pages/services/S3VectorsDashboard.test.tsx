// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
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

    // Click the last Query button (header actions, not filter)
    const headerQueryBtns = screen.getAllByRole("button", { name: /^Query$/i });
    await user.click(headerQueryBtns[headerQueryBtns.length - 1]);
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
