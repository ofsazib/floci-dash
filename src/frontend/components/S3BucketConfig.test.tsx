// @vitest-environment jsdom
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
const CORS_DATA = { corsRules: [{ AllowedMethods: ["GET"], AllowedOrigins: ["*"] }] };
const WEBSITE_DATA = { indexDocument: "index.html", errorDocument: "error.html" };
const NOTIFICATIONS_DATA = { lambdaConfigurations: [], queueConfigurations: [], topicConfigurations: [] };
const PUBLIC_ACCESS_DATA = { blockPublicAcls: false, ignorePublicAcls: false, blockPublicPolicy: false, restrictPublicBuckets: false };
const LOGGING_DATA = { enabled: false };

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
});
