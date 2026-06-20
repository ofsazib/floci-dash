// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useExecuteRDSDataStatement,
  useBeginRDSDataTransaction,
  useCommitRDSDataTransaction,
  useRollbackRDSDataTransaction,
} from "./useRDSData";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useExecuteRDSDataStatement", () => {
  it("calls api with POST method and correct URL", async () => {
    mockApi.mockResolvedValueOnce({ records: [] });
    const { result } = renderHook(() => useExecuteRDSDataStatement(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ sql: "SELECT 1", resourceArn: "arn:rds", secretArn: "arn:secret" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/rdsdata/execute",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useBeginRDSDataTransaction", () => {
  it("calls api with POST method and correct URL", async () => {
    mockApi.mockResolvedValueOnce({ transactionId: "tx-1" });
    const { result } = renderHook(() => useBeginRDSDataTransaction(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ resourceArn: "arn:rds", secretArn: "arn:secret" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/rdsdata/begin-transaction",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useCommitRDSDataTransaction", () => {
  it("calls api with POST method and correct URL", async () => {
    mockApi.mockResolvedValueOnce({ transactionStatus: "COMMITTED" });
    const { result } = renderHook(() => useCommitRDSDataTransaction(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ transactionId: "tx-1", resourceArn: "arn:rds", secretArn: "arn:secret" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/rdsdata/commit-transaction",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useRollbackRDSDataTransaction", () => {
  it("calls api with POST method and correct URL", async () => {
    mockApi.mockResolvedValueOnce({ transactionStatus: "ROLLED_BACK" });
    const { result } = renderHook(() => useRollbackRDSDataTransaction(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ transactionId: "tx-1", resourceArn: "arn:rds", secretArn: "arn:secret" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/rdsdata/rollback-transaction",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
