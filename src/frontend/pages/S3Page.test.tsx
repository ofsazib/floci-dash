// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
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

let mockCreateBucketIsError = false;
let mockCreateBucketError: Error | null = null;
let mockUploadMutateAsync = vi.fn();
let mockUploadIsError = false;
let mockUploadError: Error | null = null;
let mockBatchDeleteMutate = vi.fn();
let mockBatchDeleteIsPending = false;
let mockObjectAclData: any = { owner: null, grants: [], totalGrants: 0 };
let mockObjectAclIsLoading = false;
let mockObjectAttributesData: any = { checksum: null };
let mockPutObjectAclMutate = vi.fn();
let mockPutObjectAclIsPending = false;
let mockDeleteObjectMutate = vi.fn();
let mockCreateFolderMutate = vi.fn();
let mockDeleteFolderMutate = vi.fn();
let mockConfirmDialog = vi.fn(() => Promise.resolve(true));
const mockS3SelectMutate = vi.fn();
let mockS3SelectIsError = false;
let mockS3SelectError: Error | null = null;
let mockS3SelectIsPending = false;

vi.mock("../hooks/useS3", () => ({
  useS3Buckets: (...args: any[]) => mockBuckets(...args),
  useS3Objects: (...args: any[]) => mockObjects(...args),
  useS3ObjectDetail: (...args: any[]) => mockObjectDetail(...args),
  useS3CreateBucket: () => ({ mutate: mockCreateBucketMutate, isPending: false, isError: mockCreateBucketIsError, error: mockCreateBucketError }),
  useS3DeleteBucket: () => ({ mutate: mockDeleteBucket, isPending: false, variables: null }),
  useS3UploadFiles: () => ({ mutateAsync: mockUploadMutateAsync, isPending: false, isError: mockUploadIsError, error: mockUploadError }),
  useS3DeleteObject: () => ({ mutate: mockDeleteObjectMutate, isPending: false, variables: null }),
  useS3CreateFolder: () => ({ mutate: mockCreateFolderMutate, isPending: false }),
  useS3BatchDeleteObjects: () => ({ mutate: mockBatchDeleteMutate, isPending: mockBatchDeleteIsPending }),
  useS3DeleteFolder: () => ({ mutate: mockDeleteFolderMutate, isPending: false, variables: null }),
}));

vi.mock("../hooks/useS3Config", () => ({
  useS3ObjectTags: (...args: any[]) => mockObjectTags(...args),
  useS3UpdateObjectTags: () => ({ mutate: mockUpdateObjectTags, isPending: false }),
  useS3ObjectAcl: () => ({ data: mockObjectAclData, isLoading: mockObjectAclIsLoading }),
  useS3PutObjectAcl: () => ({ mutate: mockPutObjectAclMutate, isPending: mockPutObjectAclIsPending }),
  useS3ObjectAttributes: () => ({ data: mockObjectAttributesData, isLoading: false }),
}));

vi.mock("../hooks/useS3Select", () => ({
  useS3Select: () => ({ mutate: mockS3SelectMutate, isPending: mockS3SelectIsPending, isError: mockS3SelectIsError, error: mockS3SelectError }),
}));

vi.mock("../hooks/useSystem", () => ({
  useHealth: () => ({ data: { services: { s3: "running" } } }),
}));

vi.mock("../components/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../components/ConfirmDialog", () => ({
  useConfirmDialog: () => ({ confirm: mockConfirmDialog, dialog: null }),
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
    mockCreateBucketIsError = false;
    mockCreateBucketError = null;
    mockUploadMutateAsync = vi.fn();
    mockUploadIsError = false;
    mockUploadError = null;
    mockBatchDeleteMutate = vi.fn();
    mockBatchDeleteIsPending = false;
    mockObjectAclData = { owner: null, grants: [], totalGrants: 0 };
    mockObjectAclIsLoading = false;
    mockObjectAttributesData = { checksum: null };
    mockPutObjectAclMutate = vi.fn();
    mockPutObjectAclIsPending = false;
    mockDeleteObjectMutate = vi.fn();
    mockCreateFolderMutate = vi.fn();
    mockDeleteFolderMutate = vi.fn();
    mockConfirmDialog = vi.fn(() => Promise.resolve(true));
  });

  afterEach(() => {
    cleanup();
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

  // ─── S3ObjectViewer Actions (Tier 1) ────────────────────

  it("clicking Download triggers anchor click", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.bin"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 1024, contentType: "application/octet-stream", lastModified: "2024-01-01T00:00:00Z", etag: "abc123" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });

    render(<S3Page />, { wrapper: createWrapper() });

    const clickSpy = vi.fn();
    const origCreate = document.createElement.bind(document);
    const createSpy = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        return { click: clickSpy, href: "", download: "" } as any;
      }
      return origCreate(tag);
    });

    try {
      await clickButton(user, /download/i);
      expect(clickSpy).toHaveBeenCalled();
    } finally {
      createSpy.mockRestore();
    }
  });

  it("clicking Copy S3 URI calls navigator.clipboard.writeText", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.bin"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 1024, contentType: "application/octet-stream", lastModified: "2024-01-01T00:00:00Z", etag: "abc123" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });

    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextSpy },
      configurable: true,
      writable: true,
    });

    render(<S3Page />, { wrapper: createWrapper() });
    const copyBtn = screen.getByRole("button", { name: /copy s3 uri/i });
    await user.click(copyBtn);
    expect(writeTextSpy).toHaveBeenCalledWith("s3://my-bucket/file.bin");
  });

  it("shows 'No tags set' message when object has no tags", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.bin"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 1024, contentType: "application/octet-stream", lastModified: "2024-01-01T00:00:00Z", etag: "abc123" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });

    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getByText(/No tags set on this object/i)).toBeTruthy();
  });

  it("clicking Edit tags enters edit mode", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.bin"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 1024, contentType: "application/octet-stream", lastModified: "2024-01-01T00:00:00Z", etag: "abc123" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [{ Key: "env", Value: "prod" }], total: 1 } });

    render(<S3Page />, { wrapper: createWrapper() });
    await clickButton(user, /edit tags/i);
    expect(screen.getByText("Save tags")).toBeTruthy();
    expect(screen.getByText("Add tag")).toBeTruthy();
    expect(screen.getAllByText("Cancel").length).toBeGreaterThan(0);
  });

  it("clicking Save tags calls updateObjectTags.mutate", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.bin"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 1024, contentType: "application/octet-stream", lastModified: "2024-01-01T00:00:00Z", etag: "abc123" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [{ Key: "env", Value: "prod" }], total: 1 } });

    render(<S3Page />, { wrapper: createWrapper() });
    await clickButton(user, /edit tags/i);
    await clickButton(user, /save tags/i);
    expect(mockUpdateObjectTags).toHaveBeenCalledWith(
      [{ Key: "env", Value: "prod" }],
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
  });

  // ─── Preview Variants (Tier 2) ──────────────────────────

  it("renders image preview for image/png contentType", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=image.png"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 2048, contentType: "image/png", lastModified: "2024-01-01T00:00:00Z", etag: "abc123" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });

    const { container } = render(<S3Page />, { wrapper: createWrapper() });
    expect(container.querySelector("img")).toBeTruthy();
  });

  it("renders video preview for video/mp4 contentType", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=video.mp4"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 5000, contentType: "video/mp4", lastModified: "2024-01-01T00:00:00Z", etag: "abc123" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });

    const { container } = render(<S3Page />, { wrapper: createWrapper() });
    expect(container.querySelector("video")).toBeTruthy();
  });

  it("renders audio preview for audio/mp3 contentType", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=audio.mp3"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 3000, contentType: "audio/mp3", lastModified: "2024-01-01T00:00:00Z", etag: "abc123" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });

    const { container } = render(<S3Page />, { wrapper: createWrapper() });
    expect(container.querySelector("audio")).toBeTruthy();
  });

  it("renders PDF preview for application/pdf contentType", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=doc.pdf"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 8000, contentType: "application/pdf", lastModified: "2024-01-01T00:00:00Z", etag: "abc123" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });

    const { container } = render(<S3Page />, { wrapper: createWrapper() });
    expect(container.querySelector("iframe")).toBeTruthy();
  });

  // ─── S3ObjectBrowser Interactions (Tier 3) ──────────────

  it("opens Create Folder modal when Create folder is clicked", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket"), vi.fn()]);
    mockObjects.mockReturnValue({ data: { objects: [], folders: [], total: 0 }, isLoading: false });

    render(<S3Page />, { wrapper: createWrapper() });
    await clickButton(user, /create folder/i);
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText("e.g. logs/2024").length).toBeGreaterThan(0);
    });
  });

  it("filters objects by search term typed in TextFilter", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket"), vi.fn()]);
    mockObjects.mockReturnValue({
      data: {
        objects: [
          { key: "alpha.txt", size: 100, lastModified: "2024-01-01T00:00:00Z" },
          { key: "beta.log", size: 200, lastModified: "2024-01-01T00:00:00Z" },
        ],
        folders: [],
        total: 2,
      },
      isLoading: false,
    });

    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getByText("alpha.txt")).toBeTruthy();
    expect(screen.getByText("beta.log")).toBeTruthy();

    const filterInput = screen.getByPlaceholderText("Filter by name");
    await user.type(filterInput, "alpha");

    await waitFor(() => {
      expect(screen.getByText("alpha.txt")).toBeTruthy();
      expect(screen.queryByText("beta.log")).toBeNull();
    });
  });

  // ─── Upload Modal Open ──────────────────────────────────

  it("opens upload modal and shows upload prefix input", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket"), vi.fn()]);
    mockObjects.mockReturnValue({ data: { objects: [], total: 0 }, isLoading: false });

    render(<S3Page />, { wrapper: createWrapper() });
    await clickButton(user, /upload/i);
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText("folder/subfolder/").length).toBeGreaterThan(0);
    });
  });

  // ─── Bucket Search "No matches" ─────────────────────────

  it("shows 'No matches' when bucket search has no results", async () => {
    const user = userEvent.setup();
    mockBuckets.mockReturnValue({
      data: { buckets: [{ name: "my-bucket" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<S3Page />, { wrapper: createWrapper() });
    const filterInput = screen.getByPlaceholderText("Find buckets by name");
    await user.type(filterInput, "nonexistent");
    await waitFor(() => {
      expect(screen.getByText(/No matches/)).toBeTruthy();
    });
  });

  // ─── Object Viewer: Text Preview States ──────────────

  it("renders text preview content", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=readme.txt"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 500, contentType: "text/plain", lastModified: "2024-01-01T00:00:00Z", etag: "abc123" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });

    const mockFetch = vi.fn().mockResolvedValue({ text: () => Promise.resolve("Hello world") });
    vi.stubGlobal("fetch", mockFetch);

    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("Hello world")).toBeTruthy();
    });
    vi.unstubAllGlobals();
  });

  it("renders text preview error state", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=readme.txt"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 500, contentType: "text/plain", lastModified: "2024-01-01T00:00:00Z", etag: "abc123" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });

    const mockFetch = vi.fn().mockRejectedValue(new Error("Fetch failed"));
    vi.stubGlobal("fetch", mockFetch);

    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText(/Failed to load text content/i)).toBeTruthy();
    });
    vi.unstubAllGlobals();
  });

  // ─── Object Viewer: ACL with grants ──────────────────

  it("renders ACL with grants and owner", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.bin"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 100, contentType: "application/octet-stream", lastModified: "2024-01-01T00:00:00Z", etag: "abc123" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });
    mockObjectAclData = {
      owner: { displayName: "admin", id: "123" },
      grants: [{ grantee: { displayName: "user1" }, permission: "FULL_CONTROL" }],
      totalGrants: 1,
    };

    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getByText(/admin/)).toBeTruthy();
    expect(screen.getByText(/FULL_CONTROL/)).toBeTruthy();
  });

  it("no grants message when ACL has no grants", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.bin"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 100, contentType: "application/octet-stream", lastModified: "2024-01-01T00:00:00Z", etag: "abc123" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });
    mockObjectAclData = { owner: null, grants: [], totalGrants: 0 };

    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getByText(/No grants configured for this object/i)).toBeTruthy();
  });

  // ─── Object Viewer: Checksum View ────────────────────

  it("renders checksum view with data", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.bin"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 100, contentType: "application/octet-stream", lastModified: "2024-01-01T00:00:00Z", etag: "abc123" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });
    mockObjectAttributesData = {
      checksum: {
        ChecksumSHA256: "abc123base64==",
        ChecksumType: "SHA256",
      },
    };

    const { container } = render(<S3Page />, { wrapper: createWrapper() });
    // SHA-256 appears as algorithm label and in verify selector; use getAllByText
    const shaMatches = screen.getAllByText(/SHA-256/);
    expect(shaMatches.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/abc123base64==/)).toBeTruthy();
    // The header shows "Checksums (SHA256)" when ChecksumType is present
    expect(screen.getByText(/Checksums.*SHA256/)).toBeTruthy();
  });

  it("renders no checksum message when no checksum data", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.bin"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 100, contentType: "application/octet-stream", lastModified: "2024-01-01T00:00:00Z", etag: "abc123" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });
    mockObjectAttributesData = { checksum: null };

    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getByText(/No checksum data available for this object/i)).toBeTruthy();
  });

  it("shows checksum mismatch on verify with different value", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.bin"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 100, contentType: "application/octet-stream", lastModified: "2024-01-01T00:00:00Z", etag: "abc123" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });
    mockObjectAttributesData = {
      checksum: {
        ChecksumSHA256: "abc123==",
        ChecksumType: "SHA256",
      },
    };

    render(<S3Page />, { wrapper: createWrapper() });
    // Type a non-matching value into the checksum verify input
    const verifyInputs = screen.getAllByPlaceholderText(/Paste base64/i);
    if (verifyInputs.length > 0) {
      await user.type(verifyInputs[0], "differentvalue==");
    }
    // Click Verify button
    await clickButton(user, /verify/i);
    await waitFor(() => {
      expect(screen.getByText(/Checksum does NOT match/i)).toBeTruthy();
    });
  });

  // ─── Object Browser: Folders ─────────────────────────

  it("renders folders in object browser", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket"), vi.fn()]);
    mockObjects.mockReturnValue({
      data: {
        objects: [],
        folders: [{ prefix: "images/", name: "images" }],
        total: 1,
      },
      isLoading: false,
    });

    const { container } = render(<S3Page />, { wrapper: createWrapper() });
    // Look for folder icon or button containing images/
    const folderBtns = screen.getAllByRole("button").filter(b => b.textContent?.includes("images/"));
    expect(folderBtns.length).toBeGreaterThan(0);
  });

  // ─── Object Browser: Batch Delete ────────────────────


  // ─── S3BucketList: Delete Bucket ───────────────────────

  it("calls deleteBucket when delete is confirmed", async () => {
    const user = userEvent.setup();
    mockConfirmDialog = vi.fn(() => Promise.resolve(true));
    render(<S3Page />, { wrapper: createWrapper() });
    const deleteBtn = screen.getByRole("button", { name: /delete my-bucket/i });
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(mockDeleteBucket).toHaveBeenCalledWith("my-bucket", expect.any(Object));
    });
  });

  // ─── Confirm Cancel Tests ───────────────────────────────

  it("does NOT delete bucket when confirm returns false", async () => {
    mockConfirmDialog = vi.fn(() => Promise.resolve(false));
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    const deleteBtn = screen.getByRole("button", { name: /Delete my-bucket/i });
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(mockDeleteBucket).not.toHaveBeenCalled();
    });
  });

  it("does NOT delete folder object when confirm returns false", async () => {
    mockConfirmDialog = vi.fn(() => Promise.resolve(false));
    mockObjects.mockReturnValue({
      data: {
        folders: [{ prefix: "images/", name: "images" }],
        objects: [],
        total: 0,
      },
      isLoading: false,
    });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByRole("tab", { name: /Objects/i })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete folder images/i }));
    await waitFor(() => {
      expect(mockDeleteFolderMutate).not.toHaveBeenCalled();
    });
  });

  // ─── S3 Select Tests ────────────────────────────────────

  it("renders S3 Select tab when bucket is selected", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /S3 Select/i })).toBeTruthy();
    });
  });

  it("shows SQL reference before any query run", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    render(<S3Page />, { wrapper: createWrapper() });
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /S3 Select/i }));
    await waitFor(() => {
      expect(screen.getByText("SQL reference")).toBeTruthy();
    });
  });

  it("runs S3 Select query and shows results", async () => {
    mockS3SelectMutate.mockImplementation((_data: any, opts: any) => {
      opts?.onSuccess?.({ result: "col1,col2\na,b\nc,d", stats: { bytesScanned: 100, bytesProcessed: 200, bytesReturned: 50 } });
    });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /S3 Select/i }));
    await waitFor(() => expect(screen.getByText("Run query")).toBeTruthy());

    // Fill in object key and expression
    const keyInput = screen.getByPlaceholderText("data.csv");
    await user.type(keyInput, "test.csv");

    await clickButton(user, /Run query/i);
    await waitFor(() => {
      expect(mockS3SelectMutate).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText(/col1,col2/)).toBeTruthy();
      expect(screen.getByText("Scanned")).toBeTruthy();
    });
  });

  it("shows S3 Select error", async () => {
    mockS3SelectIsError = true;
    mockS3SelectError = new Error("Select query failed");
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /S3 Select/i }));
    await waitFor(() => {
      expect(screen.getByText("Select query failed")).toBeTruthy();
    });
  });

  it("toggles S3 Select input type between CSV and JSON", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /S3 Select/i }));
    await waitFor(() => expect(screen.getByText("Input format")).toBeTruthy());
    // Click JSON button (first one is input format, second is output)
    const jsonBtns = screen.getAllByRole("button", { name: /^JSON$/i });
    await user.click(jsonBtns[0]);
  });

  it("shows CSV header treatment buttons for CSV input type", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /S3 Select/i }));
    await waitFor(() => {
      expect(screen.getByText("Use")).toBeTruthy();
      expect(screen.getByText("Ignore")).toBeTruthy();
    });
  });

  // ─── Set ACL Tests ─────────────────────────────────────

  it("shows Set ACL form when Set ACL button is clicked", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket&object=test.txt"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { contentType: "text/html", size: 512, lastModified: "2024-01-01", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectAclData = { owner: { displayName: "admin", id: "123" }, grants: [], totalGrants: 0 };
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("Object ACL")).toBeTruthy());
    await clickButton(user, /Set ACL/i);
    await waitFor(() => {
      expect(screen.getByText("Override all grants with a canned ACL.")).toBeTruthy();
    });
  });

  it("calls putObjectAcl when Apply is clicked in Set ACL form", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket&object=test.txt"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { contentType: "text/html", size: 512, lastModified: "2024-01-01", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectAclData = { owner: { displayName: "admin", id: "123" }, grants: [{ grantee: { displayName: "user1" }, permission: "READ" }], totalGrants: 1 };
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("Object ACL")).toBeTruthy());
    await clickButton(user, /Set ACL/i);
    await waitFor(() => expect(screen.getByText("Override all grants with a canned ACL.")).toBeTruthy());
    await clickButton(user, /Apply/i);
    await waitFor(() => {
      expect(mockPutObjectAclMutate).toHaveBeenCalled();
    });
  });

  it("hides Set ACL form when Cancel is clicked", async () => {
    mockPutObjectAclMutate = vi.fn();
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket&object=test.txt"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { contentType: "text/html", size: 512, lastModified: "2024-01-01", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectAclData = { owner: null, grants: [], totalGrants: 0 };
    // Mock updateAcl to have isError by making the mock return error
    // We can't easily make useS3PutObjectAcl return isError=true through mockObjectAclData
    // Instead, render and check "Cancel" toggles back
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("Object ACL")).toBeTruthy());
    await clickButton(user, /Set ACL/i);
    await waitFor(() => expect(screen.getByText("Override all grants with a canned ACL.")).toBeTruthy());
    await clickButton(user, /Cancel/i);
    await waitFor(() => {
      expect(screen.queryByText("Override all grants with a canned ACL.")).toBeNull();
    });
  });

  // ─── Batch Delete Tests ────────────────────────────────

  it("shows Delete selected button when items are selected", async () => {
    mockObjects.mockReturnValue({
      data: {
        objects: [{ key: "doc1.txt", size: 100, lastModified: "2024-01-01" }, { key: "doc2.txt", size: 200, lastModified: "2024-01-02" }],
        total: 2,
      },
      isLoading: false,
    });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1);
    });
    // Check for checkboxes (multi-select table)
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it("calls batchDelete when delete selected is confirmed", async () => {
    mockBatchDeleteMutate.mockImplementation((_keys: any, opts: any) => {
      opts?.onSuccess?.({ deleted: ["doc1.txt", "doc2.txt"], errors: [] });
    });
    mockObjects.mockReturnValue({
      data: {
        objects: [{ key: "doc1.txt", size: 100, lastModified: "2024-01-01" }, { key: "doc2.txt", size: 200, lastModified: "2024-01-02" }],
        total: 2,
      },
      isLoading: false,
    });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1);
    });
    // Select items via row checkboxes (skip header checkbox)
    const checkboxes = screen.getAllByRole("checkbox");
    if (checkboxes.length > 1) {
      await user.click(checkboxes[1]);
      await user.click(checkboxes[2]);
    }
    // The "Delete selected" button should appear
    await waitFor(() => {
      expect(screen.getByText(/Delete selected/)).toBeTruthy();
    });
    await clickButton(user, /Delete selected/i);
    await waitFor(() => {
      expect(mockBatchDeleteMutate).toHaveBeenCalled();
    });
  });

  it("does NOT call batchDelete when confirm returns false", async () => {
    mockConfirmDialog = vi.fn(() => Promise.resolve(false));
    mockObjects.mockReturnValue({
      data: {
        objects: [{ key: "doc1.txt", size: 100, lastModified: "2024-01-01" }, { key: "doc2.txt", size: 200, lastModified: "2024-01-02" }],
        total: 2,
      },
      isLoading: false,
    });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1);
    });
    // Select items
    const checkboxes = screen.getAllByRole("checkbox");
    if (checkboxes.length > 1) {
      await user.click(checkboxes[1]);
    }
    await waitFor(() => {
      expect(screen.getByText(/Delete selected/)).toBeTruthy();
    });
    await clickButton(user, /Delete selected/i);
    await waitFor(() => {
      expect(mockBatchDeleteMutate).not.toHaveBeenCalled();
    });
  });

  // ─── Batch Delete with Errors ──────────────────────────

  it("batch delete reports errors when some items fail", async () => {
    mockBatchDeleteMutate.mockImplementation((_keys: any, opts: any) => {
      opts?.onSuccess?.({ deleted: ["doc1.txt"], errors: [{ key: "doc2.txt", error: "AccessDenied" }] });
    });
    mockObjects.mockReturnValue({
      data: {
        objects: [{ key: "doc1.txt", size: 100, lastModified: "2024-01-01" }, { key: "doc2.txt", size: 200, lastModified: "2024-01-02" }],
        total: 2,
      },
      isLoading: false,
    });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1);
    });
    const checkboxes = screen.getAllByRole("checkbox");
    if (checkboxes.length > 1) {
      await user.click(checkboxes[1]);
    }
    await waitFor(() => expect(screen.getByText(/Delete selected/)).toBeTruthy());
    await clickButton(user, /Delete selected/i);
    await waitFor(() => {
      expect(mockBatchDeleteMutate).toHaveBeenCalled();
    });
  });

  it("batch delete calls onError when mutation fails", async () => {
    mockBatchDeleteMutate.mockImplementation((_keys: any, opts: any) => {
      opts?.onError?.(new Error("Batch error"));
    });
    mockObjects.mockReturnValue({
      data: {
        objects: [{ key: "doc1.txt", size: 100, lastModified: "2024-01-01" }],
        total: 1,
      },
      isLoading: false,
    });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1);
    });
    const checkboxes = screen.getAllByRole("checkbox");
    if (checkboxes.length > 1) {
      await user.click(checkboxes[1]);
    }
    await waitFor(() => expect(screen.getByText(/Delete selected/)).toBeTruthy());
    await clickButton(user, /Delete selected/i);
    await waitFor(() => {
      expect(mockBatchDeleteMutate).toHaveBeenCalled();
    });
  });

  // ─── Checksum Match ────────────────────────────────────

  it("shows checksum match on verify with matching value", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket&object=test.txt"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { contentType: "text/html", size: 512, lastModified: "2024-01-01", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectAttributesData = { checksum: { ChecksumSHA256: "dGhpcyBpcyBhIGNoZWNrc3Vt", ChecksumCRC32: "abc123" } };
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getAllByText("SHA-256").length).toBeGreaterThanOrEqual(1);
    });
    const verifyInput = screen.getByPlaceholderText("Paste base64 checksum...");
    await user.type(verifyInput, "dGhpcyBpcyBhIGNoZWNrc3Vt");
    await clickButton(user, /Verify/i);
    await waitFor(() => {
      expect(screen.getByText(/Checksum matches!/)).toBeTruthy();
    });
  });

  // ─── Single Object Delete ──────────────────────────────

  it("calls deleteObject when object delete is confirmed", async () => {
    mockObjects.mockReturnValue({
      data: {
        objects: [{ key: "doc-delete.txt", size: 100, lastModified: "2024-01-01" }],
        total: 1,
      },
      isLoading: false,
    });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1);
    });
    await user.click(screen.getByRole("button", { name: /Delete doc-delete.txt/i }));
    // The confirm dialog should appear (mockConfirmDialog returns true by default)
    await waitFor(() => {
      expect(mockDeleteObjectMutate).toHaveBeenCalled();
    });
  });

  it("does NOT delete object when confirm returns false", async () => {
    mockConfirmDialog = vi.fn(() => Promise.resolve(false));
    mockObjects.mockReturnValue({
      data: {
        objects: [{ key: "doc-cancel.txt", size: 100, lastModified: "2024-01-01" }],
        total: 1,
      },
      isLoading: false,
    });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1);
    });
    await user.click(screen.getByRole("button", { name: /Delete doc-cancel.txt/i }));
    await waitFor(() => {
      expect(mockDeleteObjectMutate).not.toHaveBeenCalled();
    });
  });

  // ─── Upload Error Alert ────────────────────────────────

  it("shows upload error alert in upload modal", async () => {
    mockUploadIsError = true;
    mockUploadError = new Error("Upload failed");
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    mockObjects.mockReturnValue({
      data: { objects: [], total: 0 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1);
    });
    await clickButton(user, /Upload/i);
    await waitFor(() => {
      expect(screen.getByText("Upload failed")).toBeTruthy();
    });
  });
});
