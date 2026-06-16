// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useDynamoDBTables,
  useDynamoDBTableDetail,
  useDynamoDBScan,
  useDynamoDBGetItem,
  useDynamoDBCreateTable,
  useDynamoDBDeleteTable,
  useDynamoDBPutItem,
  useDynamoDBFilteredScan,
  useDynamoDBDeleteItem,
} from "./useDynamoDB";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useDynamoDBTables", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ tables: [], total: 0 });
    const { result } = renderHook(() => useDynamoDBTables(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/dynamodb/tables");
    expect(mockApi).toHaveBeenCalledTimes(1);
  });

  it("returns data from api", async () => {
    const data = { tables: ["t1", "t2"], total: 2 };
    mockApi.mockResolvedValueOnce(data);
    const { result } = renderHook(() => useDynamoDBTables(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });
});

describe("useDynamoDBTableDetail", () => {
  it("does not call api when name is null", async () => {
    const { result } = renderHook(() => useDynamoDBTableDetail(null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with table name in path when name is provided", async () => {
    mockApi.mockResolvedValueOnce({ name: "myTable", status: "ACTIVE", itemCount: 0, sizeBytes: 0, keySchema: [] });
    const { result } = renderHook(() => useDynamoDBTableDetail("myTable"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/dynamodb/tables/myTable");
  });
});

describe("useDynamoDBScan", () => {
  it("does not call api when table is null", async () => {
    const { result } = renderHook(() => useDynamoDBScan(null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with scan path when table is provided", async () => {
    mockApi.mockResolvedValueOnce({ table: "t", items: [], count: 0 });
    const { result } = renderHook(() => useDynamoDBScan("orders"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/dynamodb/tables/orders/items");
  });
});

describe("useDynamoDBGetItem", () => {
  it("calls api with POST method, path, and key body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDynamoDBGetItem("orders"), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ id: "abc" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/tables/orders/items/get",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ key: { id: "abc" } }),
      }),
    );
  });
});

describe("useDynamoDBCreateTable", () => {
  it("calls api with POST method and table data body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDynamoDBCreateTable(), {
      wrapper: createWrapper(),
    });
    const payload = { name: "newTable", hashKey: "id", hashType: "S" };
    await result.current.mutateAsync(payload);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/tables",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
  });
});

describe("useDynamoDBDeleteTable", () => {
  it("calls api with DELETE method and table name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDynamoDBDeleteTable(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("dropMe");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/tables/dropMe",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("useDynamoDBPutItem", () => {
  it("calls api with PUT method and item body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDynamoDBPutItem("orders"), {
      wrapper: createWrapper(),
    });
    const item = { id: "1", val: 42 };
    await result.current.mutateAsync(item);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/tables/orders/items",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ item }),
      }),
    );
  });
});

describe("useDynamoDBFilteredScan", () => {
  it("does not call api when table is null", async () => {
    const { result } = renderHook(
      () => useDynamoDBFilteredScan(null, null, null),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls scan GET path when no filters are provided", async () => {
    mockApi.mockResolvedValueOnce({ table: "t", items: [], count: 0 });
    const { result } = renderHook(
      () => useDynamoDBFilteredScan("orders", null, null),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/dynamodb/tables/orders/items?");
  });

  it("calls scan GET path with exclusiveStartKey when provided", async () => {
    mockApi.mockResolvedValueOnce({ table: "t", items: [], count: 0 });
    const startKey = { id: "last" };
    const { result } = renderHook(
      () => useDynamoDBFilteredScan("orders", null, startKey),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/dynamodb/tables/orders/items?exclusiveStartKey=${encodeURIComponent(JSON.stringify(startKey))}`,
    );
  });

  it("calls query POST path with filters when filters are provided", async () => {
    mockApi.mockResolvedValueOnce({ table: "t", items: [], count: 0 });
    const filters = {
      filters: [{ attribute: "count", operator: ">", value: 5 }],
      logic: "AND" as const,
    };
    const { result } = renderHook(
      () => useDynamoDBFilteredScan("orders", filters, null),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/tables/orders/items/query",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          filters: filters.filters,
          filterLogic: filters.logic,
          exclusiveStartKey: undefined,
        }),
      }),
    );
  });
});

describe("useDynamoDBDeleteItem", () => {
  it("calls api with POST method, delete path, and key body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDynamoDBDeleteItem("orders"), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ id: "xyz" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/tables/orders/items/delete",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ key: { id: "xyz" } }),
      }),
    );
  });
});
