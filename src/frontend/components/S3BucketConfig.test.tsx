// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
    const tabs = ["Overview", "Versioning", "Tags", "Policy", "Encryption", "Lifecycle", "CORS", "Website", "Notifications", "Public Access", "Logging"];
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
});
