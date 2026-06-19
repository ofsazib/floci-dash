// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useBackupPlans,
  useCreateBackupPlan,
  useBackupPlan,
  useDeleteBackupPlan,
  useBackupVaults,
  useCreateBackupVault,
  useBackupVault,
  useDeleteBackupVault,
  useBackupSelections,
  useCreateBackupSelection,
  useDeleteBackupSelection,
  useBackupJobs,
  useStartBackupJob,
  useBackupJob,
  useStopBackupJob,
  useBackupTags,
} from "./useBackup";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── Plans ────────────────────────────────────────────

describe("useBackupPlans", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ backupPlans: [] });
    const { result } = renderHook(() => useBackupPlans(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/backup/plans");
  });
});

describe("useCreateBackupPlan", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateBackupPlan(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ backupPlan: { backupPlanName: "my-plan" } });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/backup/plans",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useBackupPlan", () => {
  it("does NOT call api when id is null", () => {
    renderHook(() => useBackupPlan(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with id in path when provided", async () => {
    mockApi.mockResolvedValueOnce({ backupPlan: {} });
    const { result } = renderHook(() => useBackupPlan("plan-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/backup/plans/plan-1");
  });
});

describe("useDeleteBackupPlan", () => {
  it("calls api with DELETE method and id in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteBackupPlan(), { wrapper: createWrapper() });
    await result.current.mutateAsync("plan-1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/backup/plans/plan-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── Vaults ───────────────────────────────────────────

describe("useBackupVaults", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ backupVaults: [] });
    const { result } = renderHook(() => useBackupVaults(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/backup/backup-vaults");
  });
});

describe("useCreateBackupVault", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateBackupVault(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ backupVaultName: "my-vault" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/backup/backup-vaults",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useBackupVault", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useBackupVault(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with name in path when provided", async () => {
    mockApi.mockResolvedValueOnce({ backupVault: {} });
    const { result } = renderHook(() => useBackupVault("my-vault"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/backup/backup-vaults/my-vault");
  });
});

describe("useDeleteBackupVault", () => {
  it("calls api with DELETE method and name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteBackupVault(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my-vault");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/backup/backup-vaults/my-vault",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── Selections ───────────────────────────────────────

describe("useBackupSelections", () => {
  it("does NOT call api when planId is null", () => {
    renderHook(() => useBackupSelections(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with planId in path when provided", async () => {
    mockApi.mockResolvedValueOnce({ backupSelections: [] });
    const { result } = renderHook(() => useBackupSelections("plan-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/backup/plans/plan-1/selections");
  });
});

describe("useCreateBackupSelection", () => {
  it("calls api with POST method and planId in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateBackupSelection(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ planId: "plan-1", selection: {} });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/backup/plans/plan-1/selections",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useDeleteBackupSelection", () => {
  it("calls api with DELETE method and planId/selId in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteBackupSelection(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ planId: "plan-1", selectionId: "sel-1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/backup/plans/plan-1/selections/sel-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── Jobs ─────────────────────────────────────────────

describe("useBackupJobs", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ backupJobs: [] });
    const { result } = renderHook(() => useBackupJobs(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/backup/jobs");
  });
});

describe("useStartBackupJob", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useStartBackupJob(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ backupVaultName: "v1", resourceArn: "arn:1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/backup/jobs",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useBackupJob", () => {
  it("does NOT call api when jobId is null", () => {
    renderHook(() => useBackupJob(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with jobId in path when provided", async () => {
    mockApi.mockResolvedValueOnce({ backupJob: {} });
    const { result } = renderHook(() => useBackupJob("job-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/backup/jobs/job-1");
  });
});

describe("useStopBackupJob", () => {
  it("calls api with POST method and jobId in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useStopBackupJob(), { wrapper: createWrapper() });
    await result.current.mutateAsync("job-1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/backup/jobs/job-1/stop",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

// ─── Tags ─────────────────────────────────────────────

describe("useBackupTags", () => {
  it("does NOT call api when resourceArn is null", () => {
    renderHook(() => useBackupTags(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with resourceArn query param when provided", async () => {
    mockApi.mockResolvedValueOnce({ tags: {} });
    const { result } = renderHook(() => useBackupTags("arn:aws:backup:us-east-1:123:plan/plan-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/backup/tags?resourceArn=arn%3Aaws%3Abackup%3Aus-east-1%3A123%3Aplan%2Fplan-1",
    );
  });
});
