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
  useDynamoDBUpdateItem,
  useDynamoDBBatchGet,
  useDynamoDBBatchWrite,
  useDynamoDBTransactGet,
  useDynamoDBTransactWrite,
  useDynamoDBTTL,
  useDynamoDBUpdateTTL,
  useDynamoDBTableTags,
  useDynamoDBUpdateTags,
  useDynamoDBDeleteTag,
  useDynamoDBContinuousBackups,
  useDynamoDBUpdateContinuousBackups,
  useDynamoDBPartiQL,
} from "./useDynamoDBAdvanced";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── UpdateItem ─────────────────────────────────────────

describe("useDynamoDBUpdateItem", () => {
  it("calls api with POST method and serialized body including optional fields", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDynamoDBUpdateItem("my-table"), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      key: { id: "k1" },
      updates: { name: "v1" },
      conditionExpression: "attribute_exists(id)",
      expressionAttributeNames: { "#n": "name" },
      expressionAttributeValues: { ":v": "v1" },
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/tables/my-table/items/update",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          key: { id: "k1" },
          updates: { name: "v1" },
          conditionExpression: "attribute_exists(id)",
          expressionAttributeNames: { "#n": "name" },
          expressionAttributeValues: { ":v": "v1" },
        }),
      })
    );
  });

  it("passes undefined for optional fields when not provided", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDynamoDBUpdateItem("t1"), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ key: { id: "k" }, updates: { a: 1 } });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/tables/t1/items/update",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          key: { id: "k" },
          updates: { a: 1 },
          conditionExpression: undefined,
          expressionAttributeNames: undefined,
          expressionAttributeValues: undefined,
        }),
      })
    );
  });
});

// ─── BatchGetItem ───────────────────────────────────────

describe("useDynamoDBBatchGet", () => {
  it("calls api with POST method and serialized requests", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDynamoDBBatchGet(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync([
      { tableName: "t1", keys: [{ id: "k1" }] },
      { tableName: "t2", keys: [{ id: "k2" }] },
    ]);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/batch-get",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          requests: [
            { tableName: "t1", keys: [{ id: "k1" }] },
            { tableName: "t2", keys: [{ id: "k2" }] },
          ],
        }),
      })
    );
  });
});

// ─── BatchWriteItem ─────────────────────────────────────

describe("useDynamoDBBatchWrite", () => {
  it("calls api with POST method and serialized requests", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDynamoDBBatchWrite(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync([
      { tableName: "t1", type: "put", item: { id: "k1" } },
      { tableName: "t2", type: "delete", key: { id: "k2" } },
    ]);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/batch-write",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          requests: [
            { tableName: "t1", type: "put", item: { id: "k1" } },
            { tableName: "t2", type: "delete", key: { id: "k2" } },
          ],
        }),
      })
    );
  });
});

// ─── TransactGetItems ───────────────────────────────────

describe("useDynamoDBTransactGet", () => {
  it("calls api with POST method and serialized items", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDynamoDBTransactGet(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync([{ tableName: "t1", key: { id: "k1" } }]);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/transaction/get",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          items: [{ tableName: "t1", key: { id: "k1" } }],
        }),
      })
    );
  });
});

// ─── TransactWriteItems ─────────────────────────────────

describe("useDynamoDBTransactWrite", () => {
  it("calls api with POST method and serialized items", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDynamoDBTransactWrite(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync([
      { type: "put", tableName: "t1", item: { id: "k1" } },
      { type: "delete", tableName: "t2", key: { id: "k2" } },
      { type: "update", tableName: "t3", key: { id: "k3" }, updates: { a: 1 } },
    ]);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/transaction/write",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          items: [
            { type: "put", tableName: "t1", item: { id: "k1" } },
            { type: "delete", tableName: "t2", key: { id: "k2" } },
            { type: "update", tableName: "t3", key: { id: "k3" }, updates: { a: 1 } },
          ],
        }),
      })
    );
  });
});

// ─── TTL ────────────────────────────────────────────────

describe("useDynamoDBTTL", () => {
  it("does NOT call api when table is null", () => {
    renderHook(() => useDynamoDBTTL(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with ttl URL when table provided", async () => {
    mockApi.mockResolvedValueOnce({
      table: "t1",
      enabled: false,
      status: "DISABLED",
      attributeName: null,
    });
    const { result } = renderHook(() => useDynamoDBTTL("t1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/dynamodb/tables/t1/ttl");
  });
});

describe("useDynamoDBUpdateTTL", () => {
  it("calls api with PUT method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDynamoDBUpdateTTL("t1"), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ enabled: true, attributeName: "expires" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/tables/t1/ttl",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ enabled: true, attributeName: "expires" }),
      })
    );
  });
});

// ─── Tags ───────────────────────────────────────────────

describe("useDynamoDBTableTags", () => {
  it("does NOT call api when table is null", () => {
    renderHook(() => useDynamoDBTableTags(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with tags URL when table provided", async () => {
    mockApi.mockResolvedValueOnce({ table: "t1", tags: [], total: 0 });
    const { result } = renderHook(() => useDynamoDBTableTags("t1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/dynamodb/tables/t1/tags");
  });
});

describe("useDynamoDBUpdateTags", () => {
  it("calls api with POST method and serialized tags", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDynamoDBUpdateTags("t1"), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync([
      { Key: "env", Value: "prod" },
      { Key: "team", Value: "infra" },
    ]);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/tables/t1/tags",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          tags: [
            { Key: "env", Value: "prod" },
            { Key: "team", Value: "infra" },
          ],
        }),
      })
    );
  });
});

describe("useDynamoDBDeleteTag", () => {
  it("calls api with DELETE method and encoded tagKey in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDynamoDBDeleteTag("t1"), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("env");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/tables/t1/tags/env",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("encodes special characters in tagKey", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDynamoDBDeleteTag("t1"), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("my tag/key");
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/dynamodb/tables/t1/tags/${encodeURIComponent("my tag/key")}`,
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── Continuous Backups ─────────────────────────────────

describe("useDynamoDBContinuousBackups", () => {
  it("does NOT call api when table is null", () => {
    renderHook(() => useDynamoDBContinuousBackups(null), {
      wrapper: createWrapper(),
    });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with backups URL when table provided", async () => {
    mockApi.mockResolvedValueOnce({
      table: "t1",
      pointInTimeRecovery: { enabled: false, status: "DISABLED" },
    });
    const { result } = renderHook(() => useDynamoDBContinuousBackups("t1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/dynamodb/tables/t1/backups");
  });
});

describe("useDynamoDBUpdateContinuousBackups", () => {
  it("calls api with PUT method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDynamoDBUpdateContinuousBackups("t1"), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync(true);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/tables/t1/backups",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ pointInTimeRecovery: true }),
      })
    );
  });

  it("passes false to disable PITR", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDynamoDBUpdateContinuousBackups("t1"), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync(false);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/tables/t1/backups",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ pointInTimeRecovery: false }),
      })
    );
  });
});

// ─── PartiQL ────────────────────────────────────────────

describe("useDynamoDBPartiQL", () => {
  it("calls api with POST method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({ items: [], count: 0, nextToken: null });
    const { result } = renderHook(() => useDynamoDBPartiQL(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      statement: "SELECT * FROM t1",
      parameters: ["a"],
      consistentRead: true,
      nextToken: "tok",
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/partiql/execute",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          statement: "SELECT * FROM t1",
          parameters: ["a"],
          consistentRead: true,
          nextToken: "tok",
        }),
      })
    );
  });

  it("passes undefined for optional fields when not provided", async () => {
    mockApi.mockResolvedValueOnce({ items: [], count: 0, nextToken: null });
    const { result } = renderHook(() => useDynamoDBPartiQL(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ statement: "SELECT 1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/partiql/execute",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          statement: "SELECT 1",
          parameters: undefined,
          consistentRead: undefined,
          nextToken: undefined,
        }),
      })
    );
  });
});
