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
  useBCMExports,
  useBCMExport,
  useCreateBCMExport,
  useUpdateBCMExport,
  useDeleteBCMExport,
  useBCMExportExecutions,
  useBCMTables,
} from "./useBCMDataExports";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useBCMExports", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ exports: [], total: 0 });
    const { result } = renderHook(() => useBCMExports(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/bcmdataexports/exports");
  });
});

describe("useBCMExport", () => {
  it("does NOT call api when exportArn is null", () => {
    renderHook(() => useBCMExport(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded ARN in path when provided", async () => {
    mockApi.mockResolvedValueOnce({ export: {} });
    const { result } = renderHook(() => useBCMExport("arn:aws:bcm:export1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/bcmdataexports/exports/" + encodeURIComponent("arn:aws:bcm:export1")
    );
  });
});

describe("useCreateBCMExport", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateBCMExport(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ Name: "test-export" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/bcmdataexports/exports",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("useUpdateBCMExport", () => {
  it("calls api with PUT method and encoded ARN", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUpdateBCMExport(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ exportArn: "arn:aws:bcm:export1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/bcmdataexports/exports/" + encodeURIComponent("arn:aws:bcm:export1"),
      expect.objectContaining({ method: "PUT" })
    );
  });
});

describe("useDeleteBCMExport", () => {
  it("calls api with DELETE method and encoded ARN", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteBCMExport(), { wrapper: createWrapper() });
    await result.current.mutateAsync("arn:aws:bcm:export1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/bcmdataexports/exports/" + encodeURIComponent("arn:aws:bcm:export1"),
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("useBCMExportExecutions", () => {
  it("does NOT call api when exportArn is null", () => {
    renderHook(() => useBCMExportExecutions(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded ARN and executions path", async () => {
    mockApi.mockResolvedValueOnce({ executions: [], total: 0 });
    const { result } = renderHook(() => useBCMExportExecutions("arn:aws:bcm:export1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/bcmdataexports/exports/" + encodeURIComponent("arn:aws:bcm:export1") + "/executions"
    );
  });
});

describe("useBCMTables", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ tables: [], total: 0 });
    const { result } = renderHook(() => useBCMTables(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/bcmdataexports/tables");
  });
});
