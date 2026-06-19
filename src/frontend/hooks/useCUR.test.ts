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
  useReportDefinitions,
  useCreateReportDefinition,
  useModifyReportDefinition,
  useDeleteReportDefinition,
} from "./useCUR";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useReportDefinitions", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ reportDefinitions: [], total: 0 });
    const { result } = renderHook(() => useReportDefinitions(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cur/report-definitions");
  });
});

describe("useCreateReportDefinition", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateReportDefinition(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ reportName: "test", timeUnit: "DAILY", s3Bucket: "bucket" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/cur/report-definitions",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useModifyReportDefinition", () => {
  it("calls api with PUT method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useModifyReportDefinition(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ reportName: "test", timeUnit: "HOURLY" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/cur/report-definitions",
      expect.objectContaining({ method: "PUT" }),
    );
  });
});

describe("useDeleteReportDefinition", () => {
  it("calls api with DELETE method and name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteReportDefinition(), { wrapper: createWrapper() });
    await result.current.mutateAsync("test-report");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/cur/report-definitions/test-report",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
