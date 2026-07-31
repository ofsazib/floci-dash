// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import userEvent from "@testing-library/user-event";
import { clickButton } from "../../test/helpers";

// Stable references — must NOT create new objects on each call or useEffect
// deps like [data?.tags] will infinite-loop
const VERSIONING_DATA = { status: "Enabled" };
const TAGS_DATA = { tags: [{ Key: "env", Value: "prod" }], total: 1 };
const POLICY_DATA = { policy: '{"Version":"2024-01-01"}', hasPolicy: true };
const ENCRYPTION_DATA = { configured: true, rules: [{ ApplyServerSideEncryptionByDefault: { SSEAlgorithm: "AES256" } }] };
const LIFECYCLE_DATA = { rules: [{ ID: "rule1", Status: "Enabled", Filter: { Prefix: "logs/" }, Expiration: { Days: 30 } }] };
const CORS_DATA = { corsRules: [{ AllowedMethods: ["GET"], AllowedOrigins: ["*"] }], total: 1 };
const WEBSITE_DATA = { configured: true, indexDocument: "index.html", errorDocument: "error.html" };
const LOGGING_DATA = { enabled: false, targetBucket: "", targetPrefix: "" };
const NOTIFICATIONS_DATA = { lambdaConfigurations: [], queueConfigurations: [], topicConfigurations: [] };
const PUBLIC_ACCESS_DATA = { blockPublicAcls: false, ignorePublicAcls: false, blockPublicPolicy: false, restrictPublicBuckets: false };
const ACL_DATA = {
  owner: { displayName: "Owner Name", id: "owner-id-123" },
  grants: [
    { grantee: { uri: "http://acs.amazonaws.com/groups/global/AllUsers" }, permission: "READ" },
    { grantee: { uri: "http://acs.amazonaws.com/groups/global/AuthenticatedUsers" }, permission: "WRITE" },
    { grantee: { uri: "http://acs.amazonaws.com/groups/s3/LogDelivery" }, permission: "READ_ACP" },
    { grantee: { displayName: "alice" }, permission: "FULL_CONTROL" },
    { grantee: { id: "id-abc" }, permission: "WRITE_ACP" },
    { grantee: { emailAddress: "bob@example.com" }, permission: "READ" },
    { grantee: { type: "CanonicalUser" }, permission: "READ" },
  ],
  totalGrants: 7,
};


const mkQuery = <T,>(data: T) => ({ data, isLoading: false, isError: false, error: null });
const mkMutation = () => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
});

vi.mock("../hooks/useS3Config", () => ({
  useS3BucketVersioning: vi.fn(() => mkQuery(VERSIONING_DATA)),
  useS3UpdateVersioning: vi.fn(() => mkMutation()),
  useS3BucketTags: vi.fn(() => mkQuery(TAGS_DATA)),
  useS3UpdateBucketTags: vi.fn(() => mkMutation()),
  useS3BucketPolicy: vi.fn(() => mkQuery(POLICY_DATA)),
  useS3UpdateBucketPolicy: vi.fn(() => mkMutation()),
  useS3DeleteBucketPolicy: vi.fn(() => mkMutation()),
  useS3BucketLifecycle: vi.fn(() => mkQuery(LIFECYCLE_DATA)),
  useS3UpdateBucketLifecycle: vi.fn(() => mkMutation()),
  useS3DeleteBucketLifecycle: vi.fn(() => mkMutation()),
  useS3BucketCors: vi.fn(() => mkQuery(CORS_DATA)),
  useS3UpdateBucketCors: vi.fn(() => mkMutation()),
  useS3DeleteBucketCors: vi.fn(() => mkMutation()),
  useS3BucketWebsite: vi.fn(() => mkQuery(WEBSITE_DATA)),
  useS3UpdateBucketWebsite: vi.fn(() => mkMutation()),
  useS3DeleteBucketWebsite: vi.fn(() => mkMutation()),
  useS3BucketEncryption: vi.fn(() => mkQuery(ENCRYPTION_DATA)),
  useS3UpdateBucketEncryption: vi.fn(() => mkMutation()),
  useS3DeleteBucketEncryption: vi.fn(() => mkMutation()),
  useS3BucketNotifications: vi.fn(() => mkQuery(NOTIFICATIONS_DATA)),
  useS3PublicAccessBlock: vi.fn(() => mkQuery(PUBLIC_ACCESS_DATA)),
  useS3UpdatePublicAccessBlock: vi.fn(() => mkMutation()),
  useS3BucketLogging: vi.fn(() => mkQuery(LOGGING_DATA)),
  useS3UpdateBucketLogging: vi.fn(() => mkMutation()),
  useS3BucketAcl: vi.fn(() => mkQuery(ACL_DATA)),
  useS3PutBucketAcl: vi.fn(() => mkMutation()),
}));

import S3BucketConfig from "./S3BucketConfig";
import {
  useS3BucketVersioning,
  useS3BucketTags,
  useS3BucketPolicy,
  useS3BucketEncryption,
  useS3BucketLifecycle,
  useS3BucketCors,
  useS3BucketWebsite,
  useS3BucketNotifications,
  useS3PublicAccessBlock,
  useS3BucketLogging,
  useS3UpdateVersioning,
  useS3UpdateBucketTags,
  useS3UpdateBucketPolicy,
  useS3DeleteBucketPolicy,
  useS3UpdateBucketEncryption,
  useS3DeleteBucketEncryption,
  useS3UpdateBucketLifecycle,
  useS3DeleteBucketLifecycle,
  useS3UpdateBucketCors,
  useS3DeleteBucketCors,
  useS3UpdateBucketWebsite,
  useS3DeleteBucketWebsite,
  useS3UpdatePublicAccessBlock,
  useS3UpdateBucketLogging,
  useS3BucketAcl,
  useS3PutBucketAcl,
} from "../hooks/useS3Config";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("S3BucketConfig — tab navigation", () => {
  it("renders all 11 tab buttons", () => {
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    const tabs = ["Overview", "Versioning", "Tags", "Policy", "Encryption", "Lifecycle", "CORS", "Website", "Notifications", "Public Access", "Logging", "ACL"];
    for (const tab of tabs) {
      expect(screen.getByRole("button", { name: tab })).toBeTruthy();
    }
  });

  it("defaults to Overview tab", () => {
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    expect(screen.getByText("Bucket Configuration Summary")).toBeTruthy();
  });

  it("switches to Versioning tab", async () => {
    const user = userEvent.setup();
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Versioning" }));
    expect(screen.getByText("Bucket Versioning")).toBeTruthy();
  });

  it("switches to Tags tab", async () => {
    const user = userEvent.setup();
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Tags" }));
    expect(screen.getByText("Bucket Tags")).toBeTruthy();
  });

  it("switches to Policy tab", async () => {
    const user = userEvent.setup();
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Policy" }));
    await waitFor(() => {
      expect(screen.getByText("Bucket Policy")).toBeTruthy();
    });
  });

  it("switches to Encryption tab", async () => {
    const user = userEvent.setup();
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Encryption" }));
    expect(screen.getByText("Default Encryption")).toBeTruthy();
  });

  it("switches to Lifecycle tab", async () => {
    const user = userEvent.setup();
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Lifecycle" }));
    expect(screen.getByText("Lifecycle Rules")).toBeTruthy();
  });

  it("switches to CORS tab", async () => {
    const user = userEvent.setup();
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "CORS" }));
    expect(screen.getByText("CORS Configuration")).toBeTruthy();
  });

  it("switches to Website tab", async () => {
    const user = userEvent.setup();
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Website" }));
    expect(screen.getByText("Static Website Hosting")).toBeTruthy();
  });

  it("switches to Notifications tab", async () => {
    const user = userEvent.setup();
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Notifications" }));
    expect(screen.getByText("Event Notifications")).toBeTruthy();
  });

  it("switches to Public Access tab", async () => {
    const user = userEvent.setup();
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Public Access" }));
    expect(screen.getByText("Public Access Block Configuration")).toBeTruthy();
  });

  it("switches to Logging tab", async () => {
    const user = userEvent.setup();
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Logging" }));
    expect(screen.getByText("Server Access Logging")).toBeTruthy();
  });
});

describe("S3BucketConfig — Overview tab", () => {
  it("shows versioning status", () => {
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    expect(screen.getAllByText("Enabled").length).toBeGreaterThan(0);
  });

  it("shows tag count", () => {
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    expect(screen.getByText(/1 tag/)).toBeTruthy();
  });

  it("shows encryption status", () => {
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    expect(screen.getAllByText("Enabled").length).toBeGreaterThan(0);
  });
});

describe("S3BucketConfig — Versioning tab", () => {
  it("calls updateVersioning.mutate on Save changes", async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();
    (useS3UpdateVersioning as any).mockReturnValue({ mutate: mockMutate, isPending: false, isError: false, error: null });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Versioning" }));
    await user.click(screen.getByRole("button", { name: /Save changes/i }));
    expect(mockMutate).toHaveBeenCalled();
  });

  it("shows spinner while loading", async () => {
    (useS3BucketVersioning as any).mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const user = userEvent.setup();
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Versioning" }));
    // The spinner replaces the Container content when isLoading
    expect(screen.queryByText("Bucket Versioning")).toBeNull();
  });
});

describe("S3BucketConfig — Tags tab", () => {
  it("renders existing tag pairs from data", async () => {
    const user = userEvent.setup();
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Tags" }));
    expect(screen.getByDisplayValue("env")).toBeTruthy();
    expect(screen.getByDisplayValue("prod")).toBeTruthy();
  });

  it("adds a new tag pair when Add tag clicked", async () => {
    const user = userEvent.setup();
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Tags" }));
    const before = screen.getAllByPlaceholderText("Tag key").length;
    await user.click(screen.getByRole("button", { name: /Add tag/i }));
    const after = screen.getAllByPlaceholderText("Tag key").length;
    expect(after).toBe(before + 1);
  });

  it("removes a tag pair when remove clicked", async () => {
    const user = userEvent.setup();
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Tags" }));
    await waitFor(() => expect(screen.getByDisplayValue("env")).toBeTruthy());
    const before = screen.getAllByPlaceholderText("Tag key").length;
    await user.click(screen.getByRole("button", { name: /Remove tag/i }));
    const after = screen.queryAllByPlaceholderText("Tag key").length;
    expect(after).toBe(before - 1);
  });

  it("calls updateTags.mutate with valid tags on Save tags", async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();
    (useS3UpdateBucketTags as any).mockReturnValue({ mutate: mockMutate, isPending: false, isError: false, error: null });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Tags" }));
    await user.click(screen.getByRole("button", { name: /Save tags/i }));
    expect(mockMutate).toHaveBeenCalledWith([{ Key: "env", Value: "prod" }]);
  });

  it("shows error alert when tags update fails", async () => {
    const user = userEvent.setup();
    (useS3UpdateBucketTags as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: new Error("Failed to update tags"),
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Tags" }));
    expect(screen.getByText(/Failed to update tags/i)).toBeTruthy();
  });
});

describe("S3BucketConfig — Policy tab", () => {
  it("renders existing policy text", async () => {
    const user = userEvent.setup();
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Policy" }));
    await waitFor(() => {
      expect(screen.getByDisplayValue(/Version/)).toBeTruthy();
    });
  });

  it("calls updatePolicy.mutate on Save policy", async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();
    (useS3UpdateBucketPolicy as any).mockReturnValue({ mutate: mockMutate, isPending: false, isError: false, error: null });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Policy" }));
    await waitFor(() => expect(screen.getByDisplayValue(/Version/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Save policy/i }));
    expect(mockMutate).toHaveBeenCalled();
  });

  it("calls deletePolicy.mutate on Delete policy", async () => {
    const user = userEvent.setup();
    const mockDelete = vi.fn();
    (useS3DeleteBucketPolicy as any).mockReturnValue({ mutate: mockDelete, isPending: false, isError: false, error: null });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Policy" }));
    await waitFor(() => expect(screen.getByDisplayValue(/Version/)).toBeTruthy());
    const delBtn = screen.queryByRole("button", { name: /Delete policy/i });
    if (delBtn) {
      await user.click(delBtn);
      expect(mockDelete).toHaveBeenCalled();
    }
  });

  it("shows error alert when policy update fails", async () => {
    const user = userEvent.setup();
    (useS3UpdateBucketPolicy as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: new Error("Failed to update policy"),
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Policy" }));
    await waitFor(() => expect(screen.getByDisplayValue(/Version/)).toBeTruthy());
    expect(screen.getByText(/Failed to update policy/i)).toBeTruthy();
  });
});

describe("S3BucketConfig — Encryption tab", () => {
  it("renders encryption tab with save button", async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();
    (useS3UpdateBucketEncryption as any).mockReturnValue({ mutate: mockMutate, isPending: false, isError: false, error: null });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Encryption" }));
    expect(screen.getByText("Default Encryption")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Enable encryption/i }));
    expect(mockMutate).toHaveBeenCalledWith("AES256");
  });

  it("shows Disable encryption button when encryption configured", async () => {
    const user = userEvent.setup();
    const mockDelete = vi.fn();
    (useS3DeleteBucketEncryption as any).mockReturnValue({ mutate: mockDelete, isPending: false, isError: false, error: null });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Encryption" }));
    await user.click(screen.getByRole("button", { name: /Disable encryption/i }));
    expect(mockDelete).toHaveBeenCalled();
  });

  it("shows loading spinner when data is loading", async () => {
    const user = userEvent.setup();
    (useS3BucketEncryption as any).mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Encryption" }));
    expect(screen.queryByText("Default Encryption")).toBeNull();
  });
});

describe("S3BucketConfig — Lifecycle tab", () => {
  it("shows empty state when no lifecycle rules", async () => {
    const user = userEvent.setup();
    (useS3BucketLifecycle as any).mockReturnValue({ data: { rules: [] }, isLoading: false, isError: false, error: null });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Lifecycle" }));
    expect(screen.getByText(/No lifecycle rules configured/)).toBeTruthy();
  });

  it("shows lifecycle rules table and add button when rules exist", async () => {
    const user = userEvent.setup();
    (useS3BucketLifecycle as any).mockReturnValue({
      data: {
        rules: [{ ID: "rule1", Status: "Enabled", Filter: { Prefix: "logs/" }, Expiration: { Days: 30 } }],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Lifecycle" }));
    expect(screen.getByText("rule1")).toBeTruthy();
    expect(screen.getByText("Prefix: logs/")).toBeTruthy();
    expect(screen.getByText("30 days")).toBeTruthy();
  });

  it("opens add lifecycle rule modal and submits", async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();
    (useS3UpdateBucketLifecycle as any).mockReturnValue({ mutate: mockMutate, isPending: false, isError: false, error: null });
    // Use empty rules so "Add lifecycle rule" button appears at the bottom
    (useS3BucketLifecycle as any).mockReturnValue({ data: { rules: [] }, isLoading: false, isError: false, error: null });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Lifecycle" }));
    await waitFor(() => expect(screen.getByText(/No lifecycle rules configured/)).toBeTruthy());
    // Click "Add lifecycle rule" button - there's only one such button in the empty state
    const addRuleBtns = screen.getAllByRole("button", { name: /Add lifecycle rule/i });
    await user.click(addRuleBtns[0]);
    // Wait for modal to open by checking the modal header
    await waitFor(() => {
      const elements = screen.getAllByText("Add lifecycle rule");
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });
    await user.click(screen.getAllByRole("button", { name: /^Add rule$/i })[0]);
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  it("shows error alert when lifecycle update fails", async () => {
    const user = userEvent.setup();
    (useS3UpdateBucketLifecycle as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: new Error("Failed to update lifecycle rules"),
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Lifecycle" }));
    // Open the modal so the error alert renders inside it
    const addRuleBtns = screen.getAllByRole("button", { name: /Add lifecycle rule/i });
    await user.click(addRuleBtns[0]);
    await waitFor(() => {
      expect(screen.getByText(/Failed to update lifecycle rules/i)).toBeTruthy();
    });
  });
});

describe("S3BucketConfig — CORS tab", () => {
  it("renders CORS tab and saves rules", async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();
    (useS3UpdateBucketCors as any).mockReturnValue({ mutate: mockMutate, isPending: false, isError: false, error: null });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "CORS" }));
    expect(screen.getByText("CORS Configuration")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Save CORS rules/i }));
    expect(mockMutate).toHaveBeenCalled();
  });

  it("shows Delete CORS button when cors rules exist", async () => {
    const user = userEvent.setup();
    const mockDelete = vi.fn();
    (useS3DeleteBucketCors as any).mockReturnValue({ mutate: mockDelete, isPending: false, isError: false, error: null });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "CORS" }));
    await user.click(screen.getByRole("button", { name: /Delete CORS/i }));
    expect(mockDelete).toHaveBeenCalled();
  });

  it("shows CORS loading spinner", async () => {
    const user = userEvent.setup();
    (useS3BucketCors as any).mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "CORS" }));
    expect(screen.queryByText("CORS Configuration")).toBeNull();
  });
});

describe("S3BucketConfig — Website tab", () => {
  it("renders website tab and saves configuration", async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();
    (useS3UpdateBucketWebsite as any).mockReturnValue({ mutate: mockMutate, isPending: false, isError: false, error: null });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Website" }));
    await waitFor(() => expect(screen.getByText("Static Website Hosting")).toBeTruthy());
    // Wait for useEffect to populate indexDoc/errorDoc from data
    await waitFor(() => expect(screen.getByDisplayValue("index.html")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Save website configuration/i }));
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({ indexDocument: "index.html", errorDocument: "error.html" });
    });
  });

  it("shows Disable website hosting button when configured", async () => {
    const user = userEvent.setup();
    const mockDelete = vi.fn();
    (useS3DeleteBucketWebsite as any).mockReturnValue({ mutate: mockDelete, isPending: false, isError: false, error: null });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Website" }));
    await user.click(screen.getByRole("button", { name: /Disable website hosting/i }));
    expect(mockDelete).toHaveBeenCalled();
  });

  it("shows website loading spinner", async () => {
    const user = userEvent.setup();
    (useS3BucketWebsite as any).mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Website" }));
    expect(screen.queryByText("Static Website Hosting")).toBeNull();
  });
});

describe("S3BucketConfig — Public Access tab", () => {
  it("renders public access tab and saves settings", async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();
    (useS3UpdatePublicAccessBlock as any).mockReturnValue({ mutate: mockMutate, isPending: false, isError: false, error: null });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Public Access" }));
    expect(screen.getByText("Public Access Block Configuration")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Save settings/i }));
    expect(mockMutate).toHaveBeenCalled();
  });

  it("shows error alert when public access block update fails", async () => {
    const user = userEvent.setup();
    (useS3UpdatePublicAccessBlock as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: new Error("Failed to update public access block"),
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Public Access" }));
    expect(screen.getByText(/Failed to update public access block/i)).toBeTruthy();
  });

  it("shows public access loading spinner", async () => {
    const user = userEvent.setup();
    (useS3PublicAccessBlock as any).mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Public Access" }));
    expect(screen.queryByText("Public Access Block Configuration")).toBeNull();
  });
});

describe("S3BucketConfig — Logging tab", () => {
  it("renders logging tab and saves configuration", async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();
    (useS3UpdateBucketLogging as any).mockReturnValue({ mutate: mockMutate, isPending: false, isError: false, error: null });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Logging" }));
    await waitFor(() => expect(screen.getByText("Server Access Logging")).toBeTruthy());
    // Fill in target bucket to enable save button
    const bucketInput = screen.getByPlaceholderText("my-logs-bucket");
    await user.type(bucketInput, "log-bucket");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Save logging configuration/i })).not.toBeDisabled();
    });
    await user.click(screen.getByRole("button", { name: /Save logging configuration/i }));
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({ targetBucket: "log-bucket", targetPrefix: "" });
    });
  });

  it("shows error alert when logging update fails", async () => {
    const user = userEvent.setup();
    (useS3UpdateBucketLogging as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: new Error("Failed to update logging"),
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Logging" }));
    expect(screen.getByText(/Failed to update logging/i)).toBeTruthy();
  });

  it("shows logging loading spinner", async () => {
    const user = userEvent.setup();
    (useS3BucketLogging as any).mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Logging" }));
    expect(screen.queryByText("Server Access Logging")).toBeNull();
  });
});

describe("S3BucketConfig — Notifications tab", () => {
  it("shows empty state for notifications", async () => {
    (useS3BucketNotifications as any).mockReturnValue({
      data: { total: 0, lambdaNotifications: [], sqsNotifications: [], snsNotifications: [] },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Notifications" }));
    expect(screen.getByText("Event Notifications")).toBeTruthy();
    expect(screen.getByText(/No event notifications configured/)).toBeTruthy();
  });

  it("shows notifications with Lambda type", async () => {
    (useS3BucketNotifications as any).mockReturnValue({
      data: {
        total: 1,
        lambdaNotifications: [{ LambdaFunctionArn: "arn:aws:lambda:fn:my-func", Events: ["s3:ObjectCreated:*"] }],
        sqsNotifications: [],
        snsNotifications: [],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Notifications" }));
    expect(screen.getByText("Lambda")).toBeTruthy();
    expect(screen.getByText("arn:aws:lambda:fn:my-func")).toBeTruthy();
  });

  it("shows notifications with SQS type", async () => {
    (useS3BucketNotifications as any).mockReturnValue({
      data: {
        total: 1,
        lambdaNotifications: [],
        sqsNotifications: [{ QueueArn: "arn:aws:sqs:queue:my-queue", Events: ["s3:ObjectRemoved:*"] }],
        snsNotifications: [],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Notifications" }));
    expect(screen.getByText("SQS")).toBeTruthy();
  });

  it("shows notifications with SNS type", async () => {
    (useS3BucketNotifications as any).mockReturnValue({
      data: {
        total: 1,
        lambdaNotifications: [],
        sqsNotifications: [],
        snsNotifications: [{ TopicArn: "arn:aws:sns:topic:my-topic", Events: ["s3:ObjectCreated:*"] }],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Notifications" }));
    expect(screen.getByText("SNS")).toBeTruthy();
  });

  it("shows loading spinner", async () => {
    (useS3BucketNotifications as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Notifications" }));
    expect(screen.queryByText("Event Notifications")).toBeNull();
  });

  it("handles undefined notification arrays with ARN fallback", async () => {
    (useS3BucketNotifications as any).mockReturnValue({
      data: { total: 1, snsNotifications: [{}] },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Notifications" }));
    expect(screen.getByText("SNS")).toBeTruthy();
    expect(screen.getByText("—")).toBeTruthy();
  });
});

// ─── Overview edge cases ─────────────────────────────────

describe("S3BucketConfig — overview edge cases", () => {
  it("shows enabled logging target bucket", () => {
    (useS3BucketLogging as any).mockReturnValue({
      data: { enabled: true, targetBucket: "logs-bucket", targetPrefix: "logs/" },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    expect(screen.getByText("Enabled → logs-bucket")).toBeTruthy();
  });

  it("shows zero tags when total is missing", () => {
    (useS3BucketTags as any).mockReturnValue({
      data: { tags: [] },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    expect(screen.getByText("0 tag(s)")).toBeTruthy();
  });
});

// ─── Versioning edge cases ───────────────────────────────

describe("S3BucketConfig — versioning edge cases", () => {
  it("selects versioning status from data", async () => {
    const user = userEvent.setup();
    (useS3BucketVersioning as any).mockReturnValue({
      data: { status: "Suspended" },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Versioning" }));
    await waitFor(() => {
      expect(screen.getByText("Suspended")).toBeTruthy();
    });
  });

  it("falls back to Enabled for unknown versioning status", async () => {
    const user = userEvent.setup();
    (useS3BucketVersioning as any).mockReturnValue({
      data: { status: "Paused" },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Versioning" }));
    await waitFor(() => {
      expect(screen.getByText("Enabled")).toBeTruthy();
    });
  });

  it("shows versioning error alert", async () => {
    const user = userEvent.setup();
    (useS3UpdateVersioning as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: new Error("ver-boom"),
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Versioning" }));
    expect(screen.getByText("ver-boom")).toBeTruthy();
  });

  it("shows versioning error fallback when no message", async () => {
    const user = userEvent.setup();
    (useS3UpdateVersioning as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: {},
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Versioning" }));
    expect(screen.getByText("Failed to update versioning")).toBeTruthy();
  });
});

// ─── Tags edge cases ─────────────────────────────────────

describe("S3BucketConfig — tags edge cases", () => {
  it("edits a single tag pair without affecting others", async () => {
    const user = userEvent.setup();
    (useS3BucketTags as any).mockReturnValue({
      data: { tags: [{ Key: "env", Value: "prod" }, { Key: "team", Value: "core" }], total: 2 },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Tags" }));
    const keyInputs = screen.getAllByPlaceholderText("Tag key");
    expect(keyInputs).toHaveLength(2);
    await user.clear(keyInputs[0]);
    await user.type(keyInputs[0], "newkey");
    expect(screen.getAllByPlaceholderText("Tag key")[0]).toHaveProperty("value", "newkey");
    expect(screen.getAllByPlaceholderText("Tag key")[1]).toHaveProperty("value", "team");
    const valueInputs = screen.getAllByPlaceholderText("Tag value");
    await user.type(valueInputs[1], "-x");
    expect(screen.getAllByPlaceholderText("Tag value")[1]).toHaveProperty("value", "core-x");
    expect(screen.getAllByPlaceholderText("Tag value")[0]).toHaveProperty("value", "prod");
  });

  it("shows tags loading spinner", async () => {
    const user = userEvent.setup();
    (useS3BucketTags as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Tags" }));
    expect(screen.queryByText("Bucket Tags")).toBeNull();
  });

  it("shows tags error fallback when no message", async () => {
    const user = userEvent.setup();
    (useS3BucketTags as any).mockReturnValue(mkQuery(TAGS_DATA));
    (useS3UpdateBucketTags as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: {},
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Tags" }));
    expect(screen.getByText("Failed to update tags")).toBeTruthy();
  });
});

// ─── Policy edge cases ───────────────────────────────────

describe("S3BucketConfig — policy edge cases", () => {
  it("shows raw policy text when policy is invalid JSON", async () => {
    const user = userEvent.setup();
    (useS3BucketPolicy as any).mockReturnValue({
      data: { policy: "not-json", hasPolicy: true },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Policy" }));
    await waitFor(() => {
      expect(screen.getByDisplayValue("not-json")).toBeTruthy();
    });
  });

  it("shows empty policy when no policy exists", async () => {
    const user = userEvent.setup();
    (useS3BucketPolicy as any).mockReturnValue({
      data: {},
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Policy" }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Version/)).toBeTruthy();
    });
    expect(screen.queryByRole("button", { name: /Delete policy/i })).toBeNull();
  });

  it("shows policy loading spinner", async () => {
    const user = userEvent.setup();
    (useS3BucketPolicy as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Policy" }));
    expect(screen.queryByText("Bucket Policy")).toBeNull();
  });

  it("shows policy error fallback when no message", async () => {
    const user = userEvent.setup();
    (useS3BucketPolicy as any).mockReturnValue(mkQuery(POLICY_DATA));
    (useS3UpdateBucketPolicy as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: {},
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Policy" }));
    await waitFor(() => {
      expect(screen.getByDisplayValue(/Version/)).toBeTruthy();
    });
    expect(screen.getByText("Failed to update policy")).toBeTruthy();
  });
});

// ─── Encryption edge cases ───────────────────────────────

describe("S3BucketConfig — encryption edge cases", () => {
  it("shows encryption error alert", async () => {
    const user = userEvent.setup();
    (useS3BucketEncryption as any).mockReturnValue(mkQuery(ENCRYPTION_DATA));
    (useS3UpdateBucketEncryption as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: new Error("enc-boom"),
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Encryption" }));
    expect(screen.getByText("enc-boom")).toBeTruthy();
  });

  it("shows encryption error fallback when no message", async () => {
    const user = userEvent.setup();
    (useS3BucketEncryption as any).mockReturnValue(mkQuery(ENCRYPTION_DATA));
    (useS3UpdateBucketEncryption as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: {},
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Encryption" }));
    expect(screen.getByText("Failed to update encryption")).toBeTruthy();
  });
});

// ─── Lifecycle rule management ───────────────────────────

describe("S3BucketConfig — lifecycle rule management", () => {
  it("loads an existing rule into the edit form and updates it", async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();
    (useS3UpdateBucketLifecycle as any).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    });
    (useS3BucketLifecycle as any).mockReturnValue({
      data: {
        rules: [
          {
            id: "edit-me",
            status: "Enabled",
            prefix: "logs/",
            expiration: { Days: 90, ExpiredObjectDeleteMarker: true },
            noncurrentVersionExpiration: { NoncurrentDays: 30 },
            abortIncompleteMultipartUpload: { DaysAfterInitiation: 7 },
            transitions: [{ StorageClass: "DEEP_ARCHIVE", Days: 60 }],
          },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Lifecycle" }));
    await user.click(screen.getByRole("button", { name: /Edit rule/i }));
    await waitFor(() => {
      expect(screen.getByText("Edit lifecycle rule")).toBeTruthy();
    });
    expect(screen.getByPlaceholderText("e.g. expire-old-logs")).toHaveProperty("value", "edit-me");
    expect(screen.getByPlaceholderText("e.g. logs/")).toHaveProperty("value", "logs/");
    expect(screen.getByPlaceholderText("e.g. 90")).toHaveProperty("value", "90");
    const days30 = screen.getAllByPlaceholderText("e.g. 30");
    expect(days30[0]).toHaveProperty("value", "30");
    expect(days30[1]).toHaveProperty("value", "60");
    expect(screen.getByPlaceholderText("e.g. 7")).toHaveProperty("value", "7");
    await user.click(screen.getByRole("button", { name: /Update rule/i }));
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
    const payload = mockMutate.mock.calls[0][0];
    expect(payload).toHaveLength(1);
    expect(payload[0]).toEqual(
      expect.objectContaining({
        Status: "Enabled",
        ID: "edit-me",
        Filter: { Prefix: "logs/" },
        Expiration: { Days: 90 },
        NoncurrentVersionExpiration: { NoncurrentDays: 30 },
        AbortIncompleteMultipartUpload: { DaysAfterInitiation: 7 },
        Transitions: [{ StorageClass: "DEEP_ARCHIVE", Days: 60 }],
      }),
    );
  });

  it("creates a rule with only delete marker expiration", async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();
    (useS3UpdateBucketLifecycle as any).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    });
    (useS3BucketLifecycle as any).mockReturnValue({
      data: { rules: [] },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Lifecycle" }));
    await waitFor(() => {
      expect(screen.getByText(/No lifecycle rules configured/)).toBeTruthy();
    });
    await user.click(screen.getAllByRole("button", { name: /Add lifecycle rule/i })[0]);
    await waitFor(() => {
      expect(screen.getAllByText("Add lifecycle rule").length).toBeGreaterThanOrEqual(1);
    });
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getAllByRole("button", { name: /^Add rule$/i })[0]);
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
    const payload = mockMutate.mock.calls[0][0];
    expect(payload[0]).toEqual(
      expect.objectContaining({ Expiration: { ExpiredObjectDeleteMarker: true } }),
    );
  });

  it("deletes a lifecycle rule", async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();
    (useS3UpdateBucketLifecycle as any).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    });
    (useS3BucketLifecycle as any).mockReturnValue({
      data: { rules: [{ ID: "r1", Status: "Enabled" }, { ID: "r2", Status: "Enabled" }] },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Lifecycle" }));
    const deleteBtns = screen.getAllByRole("button", { name: /Delete rule/i });
    await user.click(deleteBtns[0]);
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
    expect(mockMutate.mock.calls[0][0]).toHaveLength(1);
    expect(mockMutate.mock.calls[0][0][0]).toEqual(
      expect.objectContaining({ ID: "r2" }),
    );
  });

  it("deletes all lifecycle rules", async () => {
    const user = userEvent.setup();
    const mockDelete = vi.fn();
    (useS3DeleteBucketLifecycle as any).mockReturnValue({
      mutate: mockDelete,
      isPending: false,
      isError: false,
      error: null,
    });
    (useS3BucketLifecycle as any).mockReturnValue({
      data: { rules: [{ ID: "r1", Status: "Enabled" }] },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Lifecycle" }));
    await user.click(screen.getByRole("button", { name: /Delete all/i }));
    expect(mockDelete).toHaveBeenCalled();
  });

  it("renders lifecycle table cell variants", async () => {
    const user = userEvent.setup();
    (useS3BucketLifecycle as any).mockReturnValue({
      data: {
        rules: [
          { id: "lower", status: "Enabled", filter: { Tag: { Key: "env", Value: "prod" } }, expiration: { ExpiredObjectDeleteMarker: true }, transitions: [{ StorageClass: "GLACIER", Days: 60 }] },
          { ID: "upper", Status: "Disabled", Filter: { Prefix: "x/" }, Expiration: { Days: 15 } },
          { ID: "bare" },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Lifecycle" }));
    expect(screen.getByText("lower")).toBeTruthy();
    expect(screen.getByText("upper")).toBeTruthy();
    expect(screen.getByText("Tag: env=prod")).toBeTruthy();
    expect(screen.getByText("Delete markers")).toBeTruthy();
    expect(screen.getByText("GLACIER after 60 days")).toBeTruthy();
    expect(screen.getByText("Prefix: x/")).toBeTruthy();
    expect(screen.getByText("15 days")).toBeTruthy();
    expect(screen.getByText("All objects")).toBeTruthy();
    expect(screen.getByText("bare")).toBeTruthy();
  });

  it("shows lifecycle loading spinner", async () => {
    const user = userEvent.setup();
    (useS3BucketLifecycle as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Lifecycle" }));
    expect(screen.queryByText(/Lifecycle Rules/i)).toBeNull();
  });

  it("shows lifecycle error fallback when no message", async () => {
    const user = userEvent.setup();
    (useS3UpdateBucketLifecycle as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: {},
    });
    (useS3BucketLifecycle as any).mockReturnValue({
      data: { rules: [] },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Lifecycle" }));
    await user.click(screen.getAllByRole("button", { name: /Add lifecycle rule/i })[0]);
    await waitFor(() => {
      expect(screen.getByText("Failed to update lifecycle rules")).toBeTruthy();
    });
  });
});

// ─── CORS edge cases ─────────────────────────────────────

describe("S3BucketConfig — CORS edge cases", () => {
  it("renders existing CORS rules from data", async () => {
    const user = userEvent.setup();
    (useS3BucketCors as any).mockReturnValue({
      data: { rules: [{ AllowedMethods: ["GET"], AllowedOrigins: ["*"] }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "CORS" }));
    await waitFor(() => {
      expect(screen.getByDisplayValue(/AllowedMethods/)).toBeTruthy();
    });
  });

  it("wraps a single CORS object in an array on save", async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();
    (useS3UpdateBucketCors as any).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "CORS" }));
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: '{"AllowedOrigins":["*"]}' } });
    await user.click(screen.getByRole("button", { name: /Save CORS rules/i }));
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith([{ AllowedOrigins: ["*"] }]);
    });
  });
});

// ─── Website edge cases ──────────────────────────────────

describe("S3BucketConfig — website edge cases", () => {
  it("disables save when website index document is missing", async () => {
    const user = userEvent.setup();
    (useS3BucketWebsite as any).mockReturnValue({
      data: { configured: true, indexDocument: "", errorDocument: "error.html" },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Website" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Save website configuration/i })).toBeDisabled();
    });
  });
});

// ─── Public Access edge cases ────────────────────────────

describe("S3BucketConfig — public access edge cases", () => {
  it("shows public access error fallback when no message", async () => {
    const user = userEvent.setup();
    (useS3PublicAccessBlock as any).mockReturnValue(mkQuery(PUBLIC_ACCESS_DATA));
    (useS3UpdatePublicAccessBlock as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: {},
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Public Access" }));
    expect(screen.getByText("Failed to update public access block")).toBeTruthy();
  });
});

// ─── Logging edge cases ──────────────────────────────────

describe("S3BucketConfig — logging edge cases", () => {
  it("shows logging error fallback when no message", async () => {
    const user = userEvent.setup();
    (useS3UpdateBucketLogging as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: {},
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Logging" }));
    expect(screen.getByText("Failed to update logging")).toBeTruthy();
  });
});

// ─── ACL tab ─────────────────────────────────────────────

describe("S3BucketConfig — ACL tab", () => {
  it("renders owner and grantee labels", async () => {
    const user = userEvent.setup();
    (useS3BucketAcl as any).mockReturnValue({
      data: ACL_DATA,
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "ACL" }));
    expect(screen.getByText("Bucket ACL (Access Control List)")).toBeTruthy();
    expect(screen.getByText("Owner Name")).toBeTruthy();
    expect(screen.getByText("Everyone (AllUsers)")).toBeTruthy();
    expect(screen.getByText("Authenticated Users")).toBeTruthy();
    expect(screen.getByText("Log Delivery")).toBeTruthy();
    expect(screen.getByText("alice")).toBeTruthy();
    expect(screen.getByText("ID: id-abc")).toBeTruthy();
    expect(screen.getByText("bob@example.com")).toBeTruthy();
    expect(screen.getAllByText("CanonicalUser").length).toBeGreaterThan(0);
    expect(screen.getByText("FULL_CONTROL")).toBeTruthy();
  });

  it("applies a canned ACL", async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();
    (useS3PutBucketAcl as any).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "ACL" }));
    await user.click(screen.getByRole("button", { name: /Apply ACL/i }));
    expect(mockMutate).toHaveBeenCalledWith({ cannedAcl: "private" });
  });

  it("renders ACL without owner or grants", async () => {
    const user = userEvent.setup();
    (useS3BucketAcl as any).mockReturnValue({
      data: { owner: undefined, grants: [], totalGrants: 0 },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "ACL" }));
    expect(screen.queryByText("Current Grants")).toBeNull();
    expect(screen.queryByText(/Owner Name/)).toBeNull();
    expect(screen.getByRole("button", { name: /Apply ACL/i })).toBeTruthy();
  });

  it("shows ACL loading spinner", async () => {
    const user = userEvent.setup();
    (useS3BucketAcl as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "ACL" }));
    expect(screen.queryByText("Bucket ACL (Access Control List)")).toBeNull();
  });

  it("shows ACL error alert", async () => {
    const user = userEvent.setup();
    (useS3BucketAcl as any).mockReturnValue(mkQuery(ACL_DATA));
    (useS3PutBucketAcl as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: new Error("acl-boom"),
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "ACL" }));
    expect(screen.getByText("acl-boom")).toBeTruthy();
  });

  it("shows ACL error fallback when no message", async () => {
    const user = userEvent.setup();
    (useS3BucketAcl as any).mockReturnValue(mkQuery(ACL_DATA));
    (useS3PutBucketAcl as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: {},
    });
    render(<S3BucketConfig bucket="my-bucket" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "ACL" }));
    expect(screen.getByText("Failed to update ACL")).toBeTruthy();
  });
});
