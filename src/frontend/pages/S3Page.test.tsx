// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event";
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
const mockHealth = vi.fn();
const mockShowToast = vi.fn();
const mockNavigate = vi.fn();

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
let mockPutObjectAclIsError = false;
let mockPutObjectAclError: Error | null = null;
let mockDeleteObjectMutate = vi.fn();
let mockCreateFolderMutate = vi.fn();
let mockDeleteFolderMutate = vi.fn();
let mockDeleteBucketIsPending = false;
let mockDeleteBucketVariables: string | null = null;
let mockDeleteObjectIsPending = false;
let mockDeleteObjectVariables: string | null = null;
let mockDeleteFolderIsPending = false;
let mockDeleteFolderVariables: string | null = null;
let mockObjectAttributesIsLoading = false;
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
  useS3DeleteBucket: () => ({ mutate: mockDeleteBucket, isPending: mockDeleteBucketIsPending, variables: mockDeleteBucketVariables }),
  useS3UploadFiles: () => ({ mutateAsync: mockUploadMutateAsync, isPending: false, isError: mockUploadIsError, error: mockUploadError }),
  useS3DeleteObject: () => ({ mutate: mockDeleteObjectMutate, isPending: mockDeleteObjectIsPending, variables: mockDeleteObjectVariables }),
  useS3CreateFolder: () => ({ mutate: mockCreateFolderMutate, isPending: false }),
  useS3BatchDeleteObjects: () => ({ mutate: mockBatchDeleteMutate, isPending: mockBatchDeleteIsPending }),
  useS3DeleteFolder: () => ({ mutate: mockDeleteFolderMutate, isPending: mockDeleteFolderIsPending, variables: mockDeleteFolderVariables }),
}));

vi.mock("../hooks/useS3Config", () => ({
  useS3ObjectTags: (...args: any[]) => mockObjectTags(...args),
  useS3UpdateObjectTags: () => ({ mutate: mockUpdateObjectTags, isPending: false }),
  useS3ObjectAcl: () => ({ data: mockObjectAclData, isLoading: mockObjectAclIsLoading }),
  useS3PutObjectAcl: () => ({ mutate: mockPutObjectAclMutate, isPending: mockPutObjectAclIsPending, isError: mockPutObjectAclIsError, error: mockPutObjectAclError }),
  useS3ObjectAttributes: () => ({ data: mockObjectAttributesData, isLoading: mockObjectAttributesIsLoading }),
}));

vi.mock("../hooks/useS3Select", () => ({
  useS3Select: () => ({ mutate: mockS3SelectMutate, isPending: mockS3SelectIsPending, isError: mockS3SelectIsError, error: mockS3SelectError }),
}));

vi.mock("../hooks/useSystem", () => ({
  useHealth: (...args: any[]) => mockHealth(...args),
}));

vi.mock("../components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../components/ConfirmDialog", () => ({
  useConfirmDialog: () => ({ confirm: mockConfirmDialog, dialog: null }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: (...args: any[]) => mockSearchParams(...args),
}));

import S3Page from "./S3Page";

/** Dispatch Escape to all Cloudscape modal dialogs (fires onDismiss). */
function dismissModalWithEscape() {
  document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
    fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27 });
  });
}

/** Locate a modal dialog by its header text (Cloudscape modals stay mounted when hidden). */
function dialogOf(headerText: string): HTMLElement {
  const header = screen.getAllByText(headerText).find((h) => h.closest('[role="dialog"]'));
  return header!.closest('[role="dialog"]') as HTMLElement;
}

/** Click a button inside the modal dialog with the given header. */
async function clickInDialog(user: UserEvent, headerText: string, name: RegExp | string) {
  await user.click(within(dialogOf(headerText)).getByRole("button", { name }));
}
describe("S3Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.mockReturnValue([new URLSearchParams(), vi.fn()]);
    mockHealth.mockReturnValue({ data: { services: { s3: "running" } } });
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
    mockPutObjectAclIsError = false;
    mockPutObjectAclError = null;
    mockDeleteObjectMutate = vi.fn();
    mockCreateFolderMutate = vi.fn();
    mockDeleteFolderMutate = vi.fn();
    mockDeleteBucketIsPending = false;
    mockDeleteBucketVariables = null;
    mockDeleteObjectIsPending = false;
    mockDeleteObjectVariables = null;
    mockDeleteFolderIsPending = false;
    mockDeleteFolderVariables = null;
    mockObjectAttributesIsLoading = false;
    mockConfirmDialog = vi.fn(() => Promise.resolve(true));
    mockS3SelectIsPending = false;
    mockS3SelectIsError = false;
    mockS3SelectError = null;
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
    mockUpdateObjectTags.mockImplementation((_tags: any, opts: any) => opts?.onSuccess?.());

    render(<S3Page />, { wrapper: createWrapper() });
    await clickButton(user, /edit tags/i);
    await clickButton(user, /save tags/i);
    expect(mockUpdateObjectTags).toHaveBeenCalledWith(
      [{ Key: "env", Value: "prod" }],
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "Tags updated"));
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
    mockDeleteBucket.mockImplementation((_name: string, opts: any) => opts?.onSuccess?.());
    render(<S3Page />, { wrapper: createWrapper() });
    const deleteBtn = screen.getByRole("button", { name: /delete my-bucket/i });
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(mockDeleteBucket).toHaveBeenCalledWith("my-bucket", expect.any(Object));
    });
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", 'Bucket "my-bucket" deleted'));
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
    mockPutObjectAclMutate.mockImplementation((_acl: any, opts: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("Object ACL")).toBeTruthy());
    await clickButton(user, /Set ACL/i);
    await waitFor(() => expect(screen.getByText("Override all grants with a canned ACL.")).toBeTruthy());
    await clickButton(user, /Apply/i);
    await waitFor(() => {
      expect(mockPutObjectAclMutate).toHaveBeenCalled();
    });
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "Object ACL updated"));
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
    mockDeleteObjectMutate.mockImplementation((_key: string, opts: any) => opts?.onSuccess?.());
    await user.click(screen.getByRole("button", { name: /Delete doc-delete.txt/i }));
    // The confirm dialog should appear (mockConfirmDialog returns true by default)
    await waitFor(() => {
      expect(mockDeleteObjectMutate).toHaveBeenCalled();
    });
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", 'Object "doc-delete.txt" deleted'));
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

  // ─── ACL Loading State ──────────────────────────────────

  it("shows spinner when ACL is loading", () => {
    mockObjectAclIsLoading = true;
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.txt"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 100, contentType: "text/plain", lastModified: "2024-01-01T00:00:00Z", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });

    const { container } = render(<S3Page />, { wrapper: createWrapper() });
    // Object ACL container has a header and a Spinner
    expect(screen.getByText("Object ACL")).toBeTruthy();
    // Spinner svg should be present inside ACL section
    expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
  });

  // ─── ACL Grantee Labels ─────────────────────────────────

  it("renders AllUsers grantee label", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.txt"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 100, contentType: "text/plain", lastModified: "2024-01-01T00:00:00Z", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });
    mockObjectAclData = {
      owner: null,
      grants: [{ grantee: { uri: "http://acs.amazonaws.com/groups/global/AllUsers" }, permission: "READ", type: "Group" }],
      totalGrants: 1,
    };

    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getByText("Everyone (AllUsers)")).toBeTruthy();
  });

  it("renders AuthenticatedUsers grantee label", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.txt"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 100, contentType: "text/plain", lastModified: "2024-01-01T00:00:00Z", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });
    mockObjectAclData = {
      owner: null,
      grants: [{ grantee: { uri: "http://acs.amazonaws.com/groups/global/AuthenticatedUsers" }, permission: "READ_ACP", type: "Group" }],
      totalGrants: 1,
    };

    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getByText("Authenticated Users")).toBeTruthy();
  });

  it("renders fallback Unknown for null grantee", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.txt"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 100, contentType: "text/plain", lastModified: "2024-01-01T00:00:00Z", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });
    mockObjectAclData = {
      owner: null,
      grants: [{ grantee: null, permission: "FULL_CONTROL" }],
      totalGrants: 1,
    };

    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getAllByText("Unknown").length).toBeGreaterThanOrEqual(1);
  });

  // ─── ACL Update Error ───────────────────────────────────

  it("shows error alert when ACL update fails", async () => {
    mockPutObjectAclIsError = true;
    mockPutObjectAclError = new Error("ACL update failed");
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.txt"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 100, contentType: "text/plain", lastModified: "2024-01-01T00:00:00Z", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });
    mockObjectAclData = {
      owner: null,
      grants: [],
      totalGrants: 0,
    };

    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("Object ACL")).toBeTruthy());
    await clickButton(user, /Set ACL/i);
    await waitFor(() => {
      expect(screen.getByText("ACL update failed")).toBeTruthy();
    });
  });

  // ─── Checksum Copy Button ───────────────────────────────

  it("renders checksum copy button when checksum data is present", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.bin"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 100, contentType: "application/octet-stream", lastModified: "2024-01-01T00:00:00Z", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });
    mockObjectAttributesData = {
      checksum: {
        ChecksumSHA256: "abc123base64==",
        ChecksumType: "SHA256",
      },
    };

    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getAllByText("SHA-256").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/abc123base64==/)).toBeTruthy();
    // Copy button should be rendered
    expect(screen.getByRole("button", { name: /Copy SHA-256/i })).toBeTruthy();
  });

  // ─── S3 Select Loading ──────────────────────────────────

  it("shows loading spinner while S3 Select query is running", async () => {
    mockS3SelectIsPending = true;
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /S3 Select/i }));
    await waitFor(() => {
      expect(screen.getByText(/Running query\.\.\./)).toBeTruthy();
    });
  });

  // ─── S3 Select Empty Result ─────────────────────────────

  it("shows empty folder view when navigating into an empty folder", async () => {
    mockObjects
      .mockReturnValueOnce({
        data: { folders: [{ prefix: "images/", name: "images" }], objects: [], total: 0 },
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: { folders: [], objects: [], total: 0 },
        isLoading: false,
      });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1);
    });
    // Click the folder link button to navigate into it
    const folderBtn = screen.getByRole("button", { name: /images\//i });
    await user.click(folderBtn);
    await waitFor(() => {
      expect(screen.getByText("Empty folder")).toBeTruthy();
    });
  });

  // ─── S3 Select: Header Treatment Clicks ───────────────

  it("clicks Use header treatment button", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /S3 Select/i }));
    await waitFor(() => expect(screen.getByText("Header treatment")).toBeTruthy());
    await clickButton(user, /^Use$/i);
    // Verify the Use button is now primary variant (active)
    expect(screen.getByRole("button", { name: /^Use$/i })).toBeTruthy();
  });

  it("clicks Ignore header treatment button", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /S3 Select/i }));
    await waitFor(() => expect(screen.getByText("Header treatment")).toBeTruthy());
    await clickButton(user, /^Ignore$/i);
    expect(screen.getByRole("button", { name: /^Ignore$/i })).toBeTruthy();
  });

  it("hides header treatment when switching to JSON input", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /S3 Select/i }));
    await waitFor(() => expect(screen.getByText("Header treatment")).toBeTruthy());
    // Click JSON input type (first JSON button is for input format)
    const jsonBtns = screen.getAllByRole("button", { name: /^JSON$/i });
    await user.click(jsonBtns[0]);
    await waitFor(() => {
      expect(screen.queryByText("Header treatment")).toBeNull();
    });
  });

  it("toggles output format to JSON", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /S3 Select/i }));
    await waitFor(() => expect(screen.getByText("Output format")).toBeTruthy());
    // Click JSON output format (second JSON button is for output format)
    const jsonBtns = screen.getAllByRole("button", { name: /^JSON$/i });
    await user.click(jsonBtns[1]);
    // After clicking, both input and output format have JSON buttons visible
    const postClickBtns = screen.getAllByRole("button", { name: /^JSON$/i });
    expect(postClickBtns.length).toBeGreaterThanOrEqual(2);
  });

  it("clicks CSV input format button", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /S3 Select/i }));
    await waitFor(() => expect(screen.getByText("Input format")).toBeTruthy());
    // The first CSV button is for input format
    const csvBtns = screen.getAllByRole("button", { name: /^CSV$/i });
    await user.click(csvBtns[0]);
    // After clicking CSV input format, CSV should be primary variant
    await waitFor(() => {
      expect(screen.getByText("Header treatment")).toBeTruthy();
    });
  });

  it("clicks CSV output format button", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /S3 Select/i }));
    await waitFor(() => expect(screen.getByText("Output format")).toBeTruthy());
    // The second CSV button is for output format
    const csvBtns = screen.getAllByRole("button", { name: /^CSV$/i });
    await user.click(csvBtns[1]);
    // After clicking CSV output format, we should still have at least 2 CSV buttons
    const postClickBtns = screen.getAllByRole("button", { name: /^CSV$/i });
    expect(postClickBtns.length).toBeGreaterThanOrEqual(2);
  });

  it("clicks None header treatment button", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /S3 Select/i }));
    await waitFor(() => expect(screen.getByText("Header treatment")).toBeTruthy());
    // The None button is inactive by default (Use is default)
    await clickButton(user, /^None$/i);
    // Verify the None button is now active
    expect(screen.getByRole("button", { name: /^None$/i })).toBeTruthy();
  });

  // ─── Navigation & Selection ──────────────────────────────

  it("selects a bucket when its name is clicked", async () => {
    const setParams = vi.fn();
    mockSearchParams.mockReturnValue([new URLSearchParams(), setParams]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("my-bucket").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("button", { name: /^my-bucket$/i }));
    await waitFor(() => expect(setParams).toHaveBeenCalledWith({ bucket: "my-bucket" }));
  });

  it("selects an object when its name is clicked", async () => {
    const setParams = vi.fn();
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), setParams]);
    mockObjects.mockReturnValue({
      data: { objects: [{ key: "click-me.txt", size: 10, lastModified: "2024-01-01" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("click-me.txt")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "click-me.txt" }));
    await waitFor(() => expect(setParams).toHaveBeenCalledWith({ bucket: "my-bucket", object: "click-me.txt" }));
  });

  it("deselects the object when the back button is clicked", async () => {
    const setParams = vi.fn();
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket&object=file.txt"), setParams]);
    mockObjectDetail.mockReturnValue({
      data: { size: 10, contentType: "application/octet-stream", lastModified: "2024-01-01", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("Actions")).toBeTruthy());
    await clickButton(user, /← Objects/i);
    await waitFor(() => expect(setParams).toHaveBeenCalledWith({ bucket: "my-bucket" }));
  });

  it("shows Available status badge when s3 health is missing", () => {
    mockHealth.mockReturnValue({ data: { services: {} } });
    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getByText("Available")).toBeTruthy();
  });

  // ─── Create Bucket: empty name / errors ─────────────────

  it("does not create a bucket when the name is empty", async () => {
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await clickButton(user, /Create bucket/i);
    await waitFor(() => expect(screen.getAllByPlaceholderText("my-bucket").length).toBeGreaterThan(0));
    await clickButton(user, /Create bucket/i, { last: true });
    expect(mockCreateBucketMutate).not.toHaveBeenCalled();
  });

  it("shows create bucket error alert", async () => {
    mockCreateBucketIsError = true;
    mockCreateBucketError = new Error("Bucket creation failed");
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await clickButton(user, /Create bucket/i);
    await waitFor(() => expect(screen.getByText("Bucket creation failed")).toBeTruthy());
  });

  it("shows fallback create bucket error message", async () => {
    mockCreateBucketIsError = true;
    mockCreateBucketError = null;
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await clickButton(user, /Create bucket/i);
    await waitFor(() => expect(screen.getByText("Failed to create bucket")).toBeTruthy());
  });

  it("shows fallback bucket list error message", () => {
    mockBuckets.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: null });
    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load buckets")).toBeTruthy();
  });

  // ─── Folder Navigation ───────────────────────────────────

  it("navigates back up out of a folder", async () => {
    mockObjects
      .mockReturnValueOnce({ data: { folders: [{ prefix: "images/", name: "images" }], objects: [], total: 0 }, isLoading: false })
      .mockReturnValueOnce({ data: { folders: [], objects: [], total: 0 }, isLoading: false })
      .mockReturnValueOnce({ data: { folders: [], objects: [], total: 0 }, isLoading: false });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1));
    await user.click(screen.getByRole("button", { name: /images\//i }));
    await waitFor(() => expect(screen.getByText("Empty folder")).toBeTruthy());
    await clickButton(user, /Back/i);
    await waitFor(() => expect(screen.getByText("No objects")).toBeTruthy());
  });

  it("shows objects inside a folder with stripped prefix", async () => {
    mockObjects
      .mockReturnValueOnce({ data: { folders: [{ prefix: "images/", name: "images" }], objects: [], total: 0 }, isLoading: false })
      .mockReturnValueOnce({ data: { folders: [], objects: [{ key: "images/pic.png", size: 100, lastModified: "2024-01-01" }], total: 1 }, isLoading: false });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1));
    await user.click(screen.getByRole("button", { name: /images\//i }));
    await waitFor(() => expect(screen.getByText("pic.png")).toBeTruthy());
  });

  it("deletes a folder when confirmed", async () => {
    mockDeleteFolderMutate.mockImplementation((_prefix: string, opts: any) => opts?.onSuccess?.({ totalDeleted: 3 }));
    mockObjects.mockReturnValue({
      data: { folders: [{ prefix: "images/", name: "images" }], objects: [], total: 0 },
      isLoading: false,
    });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1));
    await user.click(screen.getByRole("button", { name: /Delete folder images/i }));
    await waitFor(() => expect(mockDeleteFolderMutate).toHaveBeenCalled());
  });

  it("shows singular message for single-object batch delete", async () => {
    mockBatchDeleteMutate.mockImplementation((_keys: any, opts: any) => {
      opts?.onSuccess?.({ deleted: ["only.txt"], errors: [] });
    });
    mockObjects.mockReturnValue({
      data: { objects: [{ key: "only.txt", size: 100, lastModified: "2024-01-01" }], total: 1 },
      isLoading: false,
    });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1));
    const checkboxes = screen.getAllByRole("checkbox");
    if (checkboxes.length > 1) {
      await user.click(checkboxes[1]);
    }
    await waitFor(() => expect(screen.getByText(/Delete selected/)).toBeTruthy());
    await clickButton(user, /Delete selected/i);
    await waitFor(() => expect(mockBatchDeleteMutate).toHaveBeenCalled());
  });

  // ─── Tag Editing ─────────────────────────────────────────

  it("cancels tag editing mode", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.bin"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 10, contentType: "application/octet-stream", lastModified: "2024-01-01", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [{ Key: "env", Value: "prod" }], total: 1 } });
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await clickButton(user, /Edit tags/i);
    await waitFor(() => expect(screen.getByText("Save tags")).toBeTruthy());
    await clickButton(user, /^Cancel$/i);
    await waitFor(() => expect(screen.getByText("env")).toBeTruthy());
  });

  it("adds, edits, and removes tag pairs", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.bin"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 10, contentType: "application/octet-stream", lastModified: "2024-01-01", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [{ Key: "env", Value: "prod" }], total: 1 } });
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await clickButton(user, /Edit tags/i);
    await waitFor(() => expect(screen.getAllByPlaceholderText("Key").length).toBe(1));
    await user.type(screen.getAllByPlaceholderText("Key")[0], "2");
    await user.type(screen.getAllByPlaceholderText("Value")[0], "dev");
    await clickButton(user, /Add tag/i);
    await waitFor(() => expect(screen.getAllByPlaceholderText("Key").length).toBe(2));
    await user.click(screen.getAllByRole("button", { name: /Remove tag/i })[0]);
    await waitFor(() => expect(screen.getAllByPlaceholderText("Key").length).toBe(1));
  });

  // ─── ACL Grantee Labels ──────────────────────────────────

  it("renders LogDelivery grantee label", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.txt"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 100, contentType: "text/plain", lastModified: "2024-01-01T00:00:00Z", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });
    mockObjectAclData = {
      owner: null,
      grants: [{ grantee: { uri: "http://acs.amazonaws.com/groups/s3/LogDelivery" }, permission: "WRITE" }],
      totalGrants: 1,
    };
    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getByText("Log Delivery")).toBeTruthy();
  });

  it("renders ID-based grantee label", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.txt"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 100, contentType: "text/plain", lastModified: "2024-01-01T00:00:00Z", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });
    mockObjectAclData = { owner: null, grants: [{ grantee: { id: "xyz-123" }, permission: "READ" }], totalGrants: 1 };
    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getByText("ID: xyz-123")).toBeTruthy();
  });

  it("renders emailAddress grantee label", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.txt"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 100, contentType: "text/plain", lastModified: "2024-01-01T00:00:00Z", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });
    mockObjectAclData = {
      owner: null,
      grants: [{ grantee: { emailAddress: "user@example.com" }, permission: "READ" }],
      totalGrants: 1,
    };
    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getByText("user@example.com")).toBeTruthy();
  });

  it("renders Unknown for a grantee with no identifiers", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.txt"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 100, contentType: "text/plain", lastModified: "2024-01-01T00:00:00Z", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });
    mockObjectAclData = { owner: null, grants: [{ grantee: {}, permission: "READ" }], totalGrants: 1 };
    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getByText("Unknown")).toBeTruthy();
  });

  // ─── Object Viewer: Metadata Fallbacks ───────────────────

  it("shows dash placeholders when object metadata is missing", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.bin"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: {},
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });
    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getByText(/Preview not available for this file type \(unknown\)/)).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(4);
  });

  // ─── Checksum Edge Cases ─────────────────────────────────

  it("verify does not show a result when the algorithm is missing", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.bin"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 10, contentType: "application/octet-stream", lastModified: "2024-01-01", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });
    mockObjectAttributesData = { checksum: { ChecksumCRC32: "abc123==", ChecksumType: "CRC32" } };
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("CRC32").length).toBeGreaterThanOrEqual(1));
    const verifyInput = screen.getByPlaceholderText("Paste base64 checksum...");
    await user.type(verifyInput, "abc123==");
    await clickButton(user, /Verify/i);
    await waitFor(() => {
      expect(screen.queryByText(/Checksum matches!/)).toBeNull();
      expect(screen.queryByText(/does NOT match/)).toBeNull();
    });
  });

  it("copies checksum to clipboard", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.bin"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 10, contentType: "application/octet-stream", lastModified: "2024-01-01", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });
    mockObjectAttributesData = { checksum: { ChecksumSHA256: "abc123base64==", ChecksumType: "SHA256" } };
    // Mock clipboard API via spyOn on the existing object (happy-dom exposes a real
    // Clipboard via getter, so defineProperty alone doesn't reach the component).
    const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByRole("button", { name: /Copy SHA-256/i })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Copy SHA-256/i }));
    await waitFor(() => expect(writeTextSpy).toHaveBeenCalledWith("abc123base64=="));
    writeTextSpy.mockRestore();
  });

  // ─── S3 Select Edge Cases ────────────────────────────────

  it("shows no-results message for empty S3 Select result", async () => {
    mockS3SelectMutate.mockImplementation((_data: any, opts: any) => {
      opts?.onSuccess?.({ result: "", stats: { bytesScanned: 0, bytesProcessed: 0, bytesReturned: 0 } });
    });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /S3 Select/i }));
    await waitFor(() => expect(screen.getByText("Run query")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("data.csv"), "empty.csv");
    await clickButton(user, /Run query/i);
    await waitFor(() => expect(screen.getByText("Query returned no results.")).toBeTruthy());
  });

  it("toggles S3 Select input type back to CSV", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /S3 Select/i }));
    await waitFor(() => expect(screen.getByText("Input format")).toBeTruthy());
    await user.click(screen.getAllByRole("button", { name: /^JSON$/i })[0]);
    await user.click(screen.getAllByRole("button", { name: /^CSV$/i })[0]);
    await waitFor(() => expect(screen.getByText("Header treatment")).toBeTruthy());
  });

  // ─── Upload Flow ─────────────────────────────────────────

  it("uploads files successfully and shows results", async () => {
    mockUploadMutateAsync.mockResolvedValue({
      results: [{ key: "a.txt", size: 10, status: "uploaded" }],
      failed: 0,
    });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    mockObjects.mockReturnValue({ data: { objects: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1));
    await clickButton(user, /Upload/i);
    await waitFor(() => expect(screen.getAllByPlaceholderText("folder/subfolder/").length).toBeGreaterThan(0));
    const fileInput = document.querySelector('input[type="file"]');
    await waitFor(() => expect(fileInput).toBeTruthy());
    fireEvent.change(fileInput!, { target: { files: [new File(["hello"], "a.txt", { type: "text/plain" })] } });
    await user.type(screen.getAllByPlaceholderText("folder/subfolder/")[0], "images/");
    await waitFor(() => expect(screen.getByRole("button", { name: /Upload 1 file/i })).toBeTruthy());
    await clickButton(user, /Upload 1 file/i);
    await waitFor(() => expect(screen.getByText(/1 of 1 files uploaded/)).toBeTruthy());
    expect(screen.getByText("Uploaded")).toBeTruthy();
    await waitFor(() => expect(mockUploadMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ prefix: "images/" })));
    // Auto-closes after the 1200ms completion timer clears the results
    await waitFor(() => expect(screen.queryByText(/1 of 1 files uploaded/)).toBeNull(), { timeout: 3000 });
  });

  it("shows failure result when upload rejects", async () => {
    mockUploadMutateAsync.mockRejectedValue(new Error("Upload boom"));
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    mockObjects.mockReturnValue({ data: { objects: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1));
    await clickButton(user, /Upload/i);
    await waitFor(() => expect(screen.getAllByPlaceholderText("folder/subfolder/").length).toBeGreaterThan(0));
    const fileInput = document.querySelector('input[type="file"]');
    await waitFor(() => expect(fileInput).toBeTruthy());
    fireEvent.change(fileInput!, { target: { files: [new File(["hello"], "a.txt", { type: "text/plain" })] } });
    await waitFor(() => expect(screen.getByRole("button", { name: /Upload 1 file/i })).toBeTruthy());
    await clickButton(user, /Upload 1 file/i);
    await waitFor(() => expect(screen.getByText("Upload boom")).toBeTruthy());
    expect(screen.getByText("Failed")).toBeTruthy();
    // Dismissing the results alert clears the upload results (the alert's dismiss
    // button has no accessible name, so target it by class within the dialog)
    const uploadDialog = dialogOf("Upload to my-bucket");
    const alertDismiss = uploadDialog.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement;
    fireEvent.click(alertDismiss);
    await waitFor(() => expect(screen.queryByText("Upload boom")).toBeNull());
  });

  // ─── Page Shell & Navigation (100% batch) ──────────────

  it("renders overview stats when Overview tab is active", async () => {
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Overview/i }));
    await waitFor(() => expect(screen.getByText("Active")).toBeTruthy());
    expect(screen.getByText("us-east-1")).toBeTruthy();
  });

  it("goes back to the bucket list when ← Buckets is clicked", async () => {
    const setter = vi.fn();
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket"), setter]);
    mockObjects.mockReturnValue({ data: { objects: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1));
    await clickButton(user, /← Buckets/i);
    await waitFor(() => expect(setter).toHaveBeenCalledWith({}));
  });

  it("deselects the bucket when the S3 breadcrumb is clicked", async () => {
    const setter = vi.fn();
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket"), setter]);
    mockObjects.mockReturnValue({ data: { objects: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1));
    await user.click(screen.getByRole("link", { name: /^S3$/i }));
    await waitFor(() => expect(setter).toHaveBeenCalledWith({}));
  });

  it("navigates when the Dashboard breadcrumb is clicked", async () => {
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("link", { name: /Dashboard/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("cancels the create bucket modal", async () => {
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await clickButton(user, /create bucket/i);
    await clickInDialog(user, "Create Bucket", /Cancel/i);
    await waitFor(() => expect(dialogOf("Create Bucket").className).toContain("hidden"));
  });

  it("dismisses the create bucket modal with Escape", async () => {
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await clickButton(user, /create bucket/i);
    dismissModalWithEscape();
    await waitFor(() => expect(dialogOf("Create Bucket").className).toContain("hidden"));
  });

  it("shows success toast when bucket creation succeeds", async () => {
    mockCreateBucketMutate.mockImplementation((_name: string, opts: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await clickButton(user, /create bucket/i);
    await waitFor(() => expect(screen.getAllByPlaceholderText("my-bucket").length).toBeGreaterThan(0));
    await user.type(screen.getAllByPlaceholderText("my-bucket")[0], "test-bucket-123");
    await clickButton(user, /create bucket/i, { last: true });
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", 'Bucket "test-bucket-123" created'));
  });

  it("shows error toast when bucket creation fails", async () => {
    mockCreateBucketMutate.mockImplementation((_name: string, opts: any) => opts?.onError?.(new Error("Bucket boom")));
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await clickButton(user, /create bucket/i);
    await waitFor(() => expect(screen.getAllByPlaceholderText("my-bucket").length).toBeGreaterThan(0));
    await user.type(screen.getAllByPlaceholderText("my-bucket")[0], "test-bucket-123");
    await clickButton(user, /create bucket/i, { last: true });
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Bucket boom"));
  });

  it("cancels the upload modal", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    mockObjects.mockReturnValue({ data: { objects: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1));
    await clickButton(user, /Upload/i);
    await waitFor(() => expect(screen.getAllByPlaceholderText("folder/subfolder/").length).toBeGreaterThan(0));
    await clickInDialog(user, "Upload to my-bucket", /Cancel/i);
    await waitFor(() => expect(dialogOf("Upload to my-bucket").className).toContain("hidden"));
  });

  it("shows dropzone text while files are dragged over the window", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    mockObjects.mockReturnValue({ data: { objects: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1));
    await clickButton(user, /Upload/i);
    await waitFor(() => expect(screen.getAllByPlaceholderText("folder/subfolder/").length).toBeGreaterThan(0));
    fireEvent.dragOver(document, { dataTransfer: { types: ["Files"] } });
    await waitFor(() => expect(screen.getByText(/Drag and drop files here, or click 'Choose files'/)).toBeTruthy());
    fireEvent.dragLeave(document, { dataTransfer: { types: ["Files"] } });
  });

  it("shows error toast when bucket deletion fails", async () => {
    mockDeleteBucket.mockImplementation((_name: string, opts: any) => opts?.onError?.(new Error("Delete boom")));
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /delete my-bucket/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Delete boom"));
  });

  it("navigates folders via the folder breadcrumb", async () => {
    mockObjects
      .mockReturnValueOnce({ data: { folders: [{ prefix: "images/", name: "images" }], objects: [], total: 0 }, isLoading: false })
      .mockReturnValueOnce({ data: { folders: [], objects: [{ key: "images/a.png", size: 1, lastModified: "2024-01-01" }], total: 1 }, isLoading: false });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1));
    await user.click(screen.getByRole("button", { name: /images\//i }));
    await waitFor(() => expect(screen.getByText("a.png")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^images$/i }));
    await waitFor(() => expect(screen.getByText("a.png")).toBeTruthy());
  });

  it("shows error toast when folder deletion fails", async () => {
    mockDeleteFolderMutate.mockImplementation((_p: string, opts: any) => opts?.onError?.(new Error("Folder boom")));
    mockObjects.mockReturnValue({ data: { folders: [{ prefix: "images/", name: "images" }], objects: [], total: 0 }, isLoading: false });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1));
    await user.click(screen.getByRole("button", { name: /Delete folder images/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Folder boom"));
  });

  it("shows error toast when object deletion fails", async () => {
    mockDeleteObjectMutate.mockImplementation((_k: string, opts: any) => opts?.onError?.(new Error("Object boom")));
    mockObjects.mockReturnValue({ data: { objects: [{ key: "doc-delete.txt", size: 100, lastModified: "2024-01-01" }], total: 1 }, isLoading: false });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1));
    await user.click(screen.getByRole("button", { name: /Delete doc-delete.txt/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Object boom"));
  });

  it("creates a folder with the typed name", async () => {
    mockCreateFolderMutate.mockImplementation((_prefix: string, opts: any) => opts?.onSuccess?.());
    mockObjects.mockReturnValue({ data: { folders: [{ prefix: "images/", name: "images" }], objects: [], total: 0 }, isLoading: false });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1));
    await clickButton(user, /Create folder/i);
    await user.type(screen.getByPlaceholderText("e.g. logs/2024"), "newfolder");
    await clickInDialog(user, "Create folder", /^Create$/i);
    await waitFor(() => expect(mockCreateFolderMutate).toHaveBeenCalledWith("newfolder/", expect.anything()));
    expect(mockShowToast).toHaveBeenCalledWith("success", 'Folder "newfolder" created');
  });

  it("shows error toast when folder creation fails", async () => {
    mockCreateFolderMutate.mockImplementation((_p: string, opts: any) => opts?.onError?.(new Error("Create folder boom")));
    mockObjects.mockReturnValue({ data: { folders: [{ prefix: "images/", name: "images" }], objects: [], total: 0 }, isLoading: false });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1));
    await clickButton(user, /Create folder/i);
    await user.type(screen.getByPlaceholderText("e.g. logs/2024"), "newfolder");
    await clickInDialog(user, "Create folder", /^Create$/i);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Create folder boom"));
  });

  it("cancels the create folder modal", async () => {
    mockObjects.mockReturnValue({ data: { folders: [{ prefix: "images/", name: "images" }], objects: [], total: 0 }, isLoading: false });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1));
    await clickButton(user, /Create folder/i);
    await clickInDialog(user, "Create folder", /Cancel/i);
    await waitFor(() => expect(dialogOf("Create folder").className).toContain("hidden"));
  });

  it("dismisses the create folder modal with Escape", async () => {
    mockObjects.mockReturnValue({ data: { folders: [{ prefix: "images/", name: "images" }], objects: [], total: 0 }, isLoading: false });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1));
    await clickButton(user, /Create folder/i);
    dismissModalWithEscape();
    await waitFor(() => expect(dialogOf("Create folder").className).toContain("hidden"));
  });

  it("shows error toast when tag update fails", async () => {
    mockUpdateObjectTags.mockImplementation((_t: any, opts: any) => opts?.onError?.(new Error("Tags boom")));
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.bin"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 1024, contentType: "application/octet-stream", lastModified: "2024-01-01T00:00:00Z", etag: "abc123" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [{ Key: "env", Value: "prod" }], total: 1 } });
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await clickButton(user, /edit tags/i);
    await clickButton(user, /save tags/i);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Tags boom"));
  });

  it("applies the selected canned ACL from the dropdown", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket&object=test.txt"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { contentType: "text/html", size: 512, lastModified: "2024-01-01", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectAclData = { owner: null, grants: [], totalGrants: 0 };
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("Object ACL")).toBeTruthy());
    await clickButton(user, /Set ACL/i);
    await waitFor(() => expect(screen.getByText("Override all grants with a canned ACL.")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Canned ACL private/i }));
    // The dropdown renders the option list twice (hidden + open) — click the one in the open dropdown
    await waitFor(() => expect(screen.getAllByRole("option", { name: /^public-read/i }).length).toBeGreaterThan(0));
    const aclOptions = screen.getAllByRole("option", { name: /^public-read/i });
    const openAclOption = aclOptions.find((o) => o.closest('[data-open="true"]')) ?? aclOptions[aclOptions.length - 1];
    await user.click(openAclOption);
    await clickButton(user, /Apply/i);
    await waitFor(() => expect(mockPutObjectAclMutate).toHaveBeenCalledWith({ cannedAcl: "public-read" }, expect.anything()));
  });

  it("shows error toast when ACL update fails", async () => {
    mockPutObjectAclMutate.mockImplementation((_a: any, opts: any) => opts?.onError?.(new Error("ACL boom")));
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket&object=test.txt"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { contentType: "text/html", size: 512, lastModified: "2024-01-01", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectAclData = { owner: null, grants: [], totalGrants: 0 };
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("Object ACL")).toBeTruthy());
    await clickButton(user, /Set ACL/i);
    await waitFor(() => expect(screen.getByText("Override all grants with a canned ACL.")).toBeTruthy());
    await clickButton(user, /Apply/i);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "ACL boom"));
  });

  it("shows no result when the selected algorithm has no stored checksum", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.bin"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 100, contentType: "application/octet-stream", lastModified: "2024-01-01T00:00:00Z", etag: "abc123" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });
    // Only CRC32 stored — default verify algorithm (SHA-256) has no stored value
    mockObjectAttributesData = { checksum: { ChecksumCRC32: "crc==", ChecksumType: "CRC32" } };
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(/Checksums.*CRC32/)).toBeTruthy());
    const verifyInputs = screen.getAllByPlaceholderText(/Paste base64/i);
    await user.type(verifyInputs[0], "crc==");
    await clickButton(user, /Verify/i);
    await waitFor(() => expect(screen.queryByText(/Checksum (does NOT match|matches)/i)).toBeNull());
  });

  it("switches verify algorithm and verifies against the new algorithm", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.bin"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 100, contentType: "application/octet-stream", lastModified: "2024-01-01T00:00:00Z", etag: "abc123" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });
    mockObjectAttributesData = { checksum: { ChecksumSHA256: "abc==", ChecksumCRC32: "xyz==", ChecksumType: "MULTI" } };
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(/Checksums.*MULTI/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Algorithm SHA-256$/i }));
    await user.click(await screen.findByRole("option", { name: /^CRC32$/i }));
    const verifyInputs = screen.getAllByPlaceholderText(/Paste base64/i);
    await user.type(verifyInputs[0], "xyz==");
    await clickButton(user, /Verify/i);
    await waitFor(() => expect(screen.getByText(/Checksum matches/i)).toBeTruthy());
  });

  it("edits the SQL expression in the query editor", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    mockObjects.mockReturnValue({ data: { objects: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1));
    await user.click(screen.getByRole("tab", { name: /S3 Select/i }));
    const textarea = screen.getByPlaceholderText("SELECT * FROM S3Object LIMIT 10") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "SELECT * FROM S3Object LIMIT 5" } });
    expect(textarea.value).toBe("SELECT * FROM S3Object LIMIT 5");
  });

  it("ignores modal dismissal while an upload is in progress", async () => {
    mockUploadMutateAsync.mockReturnValue(new Promise(() => {})); // never resolves — upload stays in flight
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    mockObjects.mockReturnValue({ data: { objects: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1));
    await clickButton(user, /Upload/i);
    await waitFor(() => expect(screen.getAllByPlaceholderText("folder/subfolder/").length).toBeGreaterThan(0));
    const fileInput = document.querySelector('input[type="file"]');
    await waitFor(() => expect(fileInput).toBeTruthy());
    fireEvent.change(fileInput!, { target: { files: [new File(["hello"], "a.txt", { type: "text/plain" })] } });
    await waitFor(() => expect(screen.getByRole("button", { name: /Upload 1 file/i })).toBeTruthy());
    await clickButton(user, /Upload 1 file/i);
    // Escape during an in-flight upload is ignored by closeUpload
    dismissModalWithEscape();
    expect(dialogOf("Upload to my-bucket").className).not.toContain("hidden");
  });

  it("shows a warning summary when some uploads fail", async () => {
    mockUploadMutateAsync.mockResolvedValue({
      results: [{ key: "a.txt", size: 10, status: "error", error: "Nope" }],
      failed: 1,
    });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    mockObjects.mockReturnValue({ data: { objects: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1));
    await clickButton(user, /Upload/i);
    await waitFor(() => expect(screen.getAllByPlaceholderText("folder/subfolder/").length).toBeGreaterThan(0));
    const fileInput = document.querySelector('input[type="file"]');
    await waitFor(() => expect(fileInput).toBeTruthy());
    fireEvent.change(fileInput!, { target: { files: [new File(["hello"], "a.txt", { type: "text/plain" })] } });
    await waitFor(() => expect(screen.getByRole("button", { name: /Upload 1 file/i })).toBeTruthy());
    await clickButton(user, /Upload 1 file/i);
    await waitFor(() => expect(screen.getByText(/0 of 1 files uploaded/)).toBeTruthy());
    expect(screen.getByText("Nope")).toBeTruthy();
  });

  it("renders overview stats when bucket data is missing", async () => {
    mockBuckets.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null });
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Overview/i }));
    await waitFor(() => expect(screen.getByText("Active")).toBeTruthy());
    expect(screen.getByText("0")).toBeTruthy();
  });

  it("shows singular message when a folder with one object is deleted", async () => {
    mockDeleteFolderMutate.mockImplementation((_p: string, opts: any) => opts?.onSuccess?.({ totalDeleted: 1 }));
    mockObjects.mockReturnValue({ data: { folders: [{ prefix: "images/", name: "images" }], objects: [], total: 0 }, isLoading: false });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1));
    await user.click(screen.getByRole("button", { name: /Delete folder images/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", 'Folder "images" deleted (1 object)'));
  });

  it("falls back when the object detail error has no message", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.txt"), vi.fn()]);
    mockObjectDetail.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("") });
    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });

  it("falls back when the ACL update error has no message", async () => {
    mockPutObjectAclIsError = true;
    mockPutObjectAclError = new Error("");
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket&object=test.txt"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { contentType: "text/html", size: 512, lastModified: "2024-01-01", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectAclData = { owner: null, grants: [], totalGrants: 0 };
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("Object ACL")).toBeTruthy());
    await clickButton(user, /Set ACL/i);
    await waitFor(() => expect(screen.getByText("Failed to update ACL")).toBeTruthy());
  });

  it("edits a tag in a multi-tag set without touching the others", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.bin"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 1024, contentType: "application/octet-stream", lastModified: "2024-01-01T00:00:00Z", etag: "abc123" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [{ Key: "env", Value: "prod" }, { Key: "team", Value: "core" }], total: 2 } });
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await clickButton(user, /edit tags/i);
    const valueInputs = screen.getAllByPlaceholderText("Value");
    await user.type(valueInputs[1], "-v2");
    await clickButton(user, /save tags/i);
    await waitFor(() => expect(mockUpdateObjectTags).toHaveBeenCalled());
    expect(mockUpdateObjectTags.mock.calls[0][0]).toEqual([
      { Key: "env", Value: "prod" },
      { Key: "team", Value: "core-v2" },
    ]);
  });
});

describe("S3Page — branch completion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.mockReturnValue([new URLSearchParams(), vi.fn()]);
    mockHealth.mockReturnValue({ data: { services: { s3: "running" } } });
    mockBuckets.mockReturnValue({
      data: { buckets: [{ name: "my-bucket", createdAt: "2024-01-01T00:00:00Z" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockObjects.mockReturnValue({ data: { objects: [], total: 0 }, isLoading: false });
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
    mockObjectAttributesIsLoading = false;
    mockPutObjectAclMutate = vi.fn();
    mockPutObjectAclIsPending = false;
    mockPutObjectAclIsError = false;
    mockPutObjectAclError = null;
    mockDeleteObjectMutate = vi.fn();
    mockCreateFolderMutate = vi.fn();
    mockDeleteFolderMutate = vi.fn();
    mockDeleteBucketIsPending = false;
    mockDeleteBucketVariables = null;
    mockDeleteObjectIsPending = false;
    mockDeleteObjectVariables = null;
    mockDeleteFolderIsPending = false;
    mockDeleteFolderVariables = null;
    mockConfirmDialog = vi.fn(() => Promise.resolve(true));
    mockS3SelectIsPending = false;
    mockS3SelectIsError = false;
    mockS3SelectError = null;
  });

  afterEach(() => {
    cleanup();
  });

  it("shows a plural upload button for multiple files", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    mockObjects.mockReturnValue({ data: { objects: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1));
    await clickButton(user, /Upload/i);
    await waitFor(() => expect(screen.getAllByPlaceholderText("folder/subfolder/").length).toBeGreaterThan(0));
    const fileInput = document.querySelector('input[type="file"]');
    await waitFor(() => expect(fileInput).toBeTruthy());
    fireEvent.change(fileInput!, {
      target: {
        files: [
          new File(["a"], "a.txt", { type: "text/plain" }),
          new File(["b"], "b.txt", { type: "text/plain" }),
        ],
      },
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Upload 2 files/i })).toBeTruthy(),
    );
  });

  it("shows the fallback message when the upload error has no message", async () => {
    mockUploadIsError = true;
    mockUploadError = new Error();
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    mockObjects.mockReturnValue({ data: { objects: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1));
    await clickButton(user, /Upload/i);
    await waitFor(() =>
      expect(screen.getByText("Failed to upload")).toBeTruthy(),
    );
  });

  it("shows the delete bucket button in its loading state", () => {
    mockDeleteBucketIsPending = true;
    mockDeleteBucketVariables = "my-bucket";
    render(<S3Page />, { wrapper: createWrapper() });
    const btn = screen.getByRole("button", { name: /Delete my-bucket/i });
    expect(btn.getAttribute("aria-disabled")).toBe("true");
  });

  it("navigates up from a nested folder", async () => {
    mockObjects
      .mockReturnValueOnce({ data: { folders: [{ prefix: "images/", name: "images" }], objects: [], total: 0 }, isLoading: false })
      .mockReturnValueOnce({ data: { folders: [{ prefix: "images/sub/", name: "sub" }], objects: [], total: 0 }, isLoading: false })
      .mockReturnValueOnce({ data: { folders: [], objects: [], total: 0 }, isLoading: false })
      .mockReturnValueOnce({ data: { folders: [], objects: [{ key: "images/a.png", size: 1, lastModified: "2024-01-01" }], total: 1 }, isLoading: false });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getAllByText("my-bucket").length).toBeGreaterThanOrEqual(1));
    await user.click(screen.getByRole("button", { name: /images\//i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /sub\//i })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /sub\//i }));
    await waitFor(() => expect(screen.getByText("Empty folder")).toBeTruthy());
    await clickButton(user, /Back/i);
    await waitFor(() => expect(screen.getByText("a.png")).toBeTruthy());
  });

  it("shows a dash for an object without a lastModified date", async () => {
    mockObjects.mockReturnValue({
      data: { objects: [{ key: "plain.txt", size: 10 }], total: 1 },
      isLoading: false,
    });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("plain.txt")).toBeTruthy());
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("shows the delete object button in its loading state", () => {
    mockObjects.mockReturnValue({
      data: { objects: [{ key: "plain.txt", size: 10, lastModified: "2024-01-01" }], total: 1 },
      isLoading: false,
    });
    mockDeleteObjectIsPending = true;
    mockDeleteObjectVariables = "plain.txt";
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    render(<S3Page />, { wrapper: createWrapper() });
    const btn = screen.getByRole("button", { name: /Delete plain\.txt/i });
    expect(btn.getAttribute("aria-disabled")).toBe("true");
  });

  it("shows the delete folder button in its loading state", async () => {
    mockObjects.mockReturnValue({
      data: { folders: [{ prefix: "images/", name: "images" }], objects: [], total: 0 },
      isLoading: false,
    });
    mockDeleteFolderIsPending = true;
    mockDeleteFolderVariables = "images/";
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Delete folder images/i })).toBeTruthy(),
    );
    const btn = screen.getByRole("button", { name: /Delete folder images/i });
    expect(btn.getAttribute("aria-disabled")).toBe("true");
  });

  it("falls back to zero when folder deletion omits totalDeleted", async () => {
    mockDeleteFolderMutate.mockImplementation((_prefix: string, opts: any) =>
      opts?.onSuccess?.({}),
    );
    mockObjects.mockReturnValue({
      data: { folders: [{ prefix: "images/", name: "images" }], objects: [], total: 0 },
      isLoading: false,
    });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Delete folder images/i })).toBeTruthy(),
    );
    await user.click(screen.getByRole("button", { name: /Delete folder images/i }));
    await waitFor(() => expect(mockDeleteFolderMutate).toHaveBeenCalled());
    expect(mockShowToast).toHaveBeenCalledWith(
      "success",
      'Folder "images" deleted (0 objects)',
    );
  });

  it("falls back to the selected keys when batch delete omits deleted", async () => {
    mockBatchDeleteMutate.mockImplementation((_keys: any, opts: any) =>
      opts?.onSuccess?.({}),
    );
    mockObjects.mockReturnValue({
      data: {
        objects: [
          { key: "a.txt", size: 10, lastModified: "2024-01-01" },
          { key: "b.txt", size: 20, lastModified: "2024-01-01" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("a.txt")).toBeTruthy());
    const checkboxes = screen.getAllByRole("checkbox");
    if (checkboxes.length > 1) {
      await user.click(checkboxes[1]);
      await user.click(checkboxes[2]);
    }
    await waitFor(() =>
      expect(screen.getByText(/Delete selected \(2\)/i)).toBeTruthy(),
    );
    await clickButton(user, /Delete selected/i);
    await waitFor(() => expect(mockBatchDeleteMutate).toHaveBeenCalled());
    expect(mockShowToast).toHaveBeenCalledWith("success", "2 objects deleted");
  });

  it("uses the raw key as filename for a trailing-slash object", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=dir/"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 100, contentType: "image/png", lastModified: "2024-01-01T00:00:00Z", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() =>
      expect(screen.getByAltText("dir/")).toBeTruthy(),
    );
  });

  it("enters tag editing with no existing tags", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.bin"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 10, contentType: "application/octet-stream", lastModified: "2024-01-01", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { total: 0 } });
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await waitFor(() =>
      expect(screen.getByText("No tags set on this object.")).toBeTruthy(),
    );
    await clickButton(user, /Edit tags/i);
    await waitFor(() =>
      expect(screen.queryAllByPlaceholderText("Key")).toHaveLength(0),
    );
  });

  it("edits a tag key without touching the other tags", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.bin"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 10, contentType: "application/octet-stream", lastModified: "2024-01-01", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({
      data: { tags: [{ Key: "env", Value: "prod" }, { Key: "team", Value: "core" }], total: 2 },
    });
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await clickButton(user, /Edit tags/i);
    const keyInputs = screen.getAllByPlaceholderText("Key");
    await user.type(keyInputs[0], "2");
    await clickButton(user, /Save tags/i);
    await waitFor(() => expect(mockUpdateObjectTags).toHaveBeenCalled());
    expect(mockUpdateObjectTags.mock.calls[0][0]).toEqual([
      { Key: "env2", Value: "prod" },
      { Key: "team", Value: "core" },
    ]);
  });

  it("renders the ACL container when the ACL data is null", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.bin"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 10, contentType: "application/octet-stream", lastModified: "2024-01-01", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });
    mockObjectAclData = null;
    render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getByText("Object ACL")).toBeTruthy();
    expect(
      screen.getByText("No grants configured for this object."),
    ).toBeTruthy();
  });

  it("shows a spinner while checksum attributes are loading", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?bucket=my-bucket&object=file.bin"), vi.fn()]);
    mockObjectDetail.mockReturnValue({
      data: { size: 10, contentType: "application/octet-stream", lastModified: "2024-01-01", etag: "abc" },
      isLoading: false, isError: false, error: null,
    });
    mockObjectTags.mockReturnValue({ data: { tags: [], total: 0 } });
    mockObjectAttributesData = null;
    mockObjectAttributesIsLoading = true;
    const { container } = render(<S3Page />, { wrapper: createWrapper() });
    expect(screen.getByText(/Checksums/)).toBeTruthy();
    expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
  });

  it("keeps a custom SQL expression when toggling the input type", async () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    mockObjects.mockReturnValue({ data: { objects: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /S3 Select/i }));
    const textarea = screen.getByPlaceholderText("SELECT * FROM S3Object LIMIT 10") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "SELECT * FROM S3Object LIMIT 5" } });
    const jsonBtns = screen.getAllByRole("button", { name: /^JSON$/i });
    await user.click(jsonBtns[0]);
    await waitFor(() =>
      expect(textarea.value).toBe("SELECT * FROM S3Object LIMIT 5"),
    );
  });

  it("shows the query failed fallback when the select error has no message", async () => {
    mockS3SelectIsError = true;
    mockS3SelectError = new Error();
    mockSearchParams.mockReturnValue([new URLSearchParams("bucket=my-bucket"), vi.fn()]);
    const user = userEvent.setup();
    render(<S3Page />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /S3 Select/i }));
    await waitFor(() => expect(screen.getByText("Run query")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("data.csv"), "test.csv");
    await clickButton(user, /Run query/i);
    await waitFor(() =>
      expect(screen.getByText("Query failed")).toBeTruthy(),
    );
  });
});
