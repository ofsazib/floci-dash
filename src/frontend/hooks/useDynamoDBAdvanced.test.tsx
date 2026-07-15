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
  useDynamoDBUpdateTable,
  useDynamoDBPartiQLTransaction,
  useDynamoDBPartiQLBatch,
  useDynamoDBExports,
  useDynamoDBExportTable,
  useDynamoDBDescribeExport,
} from "./useDynamoDBAdvanced";

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

describe("useDynamoDBUpdateTable", () => {
  it("calls api with PUT method and table update params body", async () => {
    mockApi.mockResolvedValueOnce({ updated: true, table: "orders" });
    const { result } = renderHook(() => useDynamoDBUpdateTable("orders"), {
      wrapper: createWrapper(),
    });
    const params = {
      BillingMode: "PAY_PER_REQUEST" as const,
      DeletionProtectionEnabled: true,
    };
    await result.current.mutateAsync(params);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/tables/orders/update",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(params),
      }),
    );
  });

  it("sends SSE specification when provided", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useDynamoDBUpdateTable("orders"), {
      wrapper: createWrapper(),
    });
    const params = {
      SSESpecification: { Enabled: true, SSEType: "KMS", KMSMasterKeyId: "arn:aws:kms:..." },
    };
    await result.current.mutateAsync(params);
    const callBody = JSON.parse(mockApi.mock.calls[0][1].body);
    expect(callBody.SSESpecification.Enabled).toBe(true);
    expect(callBody.SSESpecification.SSEType).toBe("KMS");
  });

  it("sends GSI updates when creating and deleting indexes", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useDynamoDBUpdateTable("orders"), {
      wrapper: createWrapper(),
    });
    const params = {
      GlobalSecondaryIndexUpdates: [
        {
          Create: {
            IndexName: "new-gsi",
            KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
          },
        },
        { Delete: { IndexName: "old-gsi" } },
      ],
      AttributeDefinitions: [{ AttributeName: "pk", AttributeType: "S" }],
    };
    await result.current.mutateAsync(params);
    const callBody = JSON.parse(mockApi.mock.calls[0][1].body);
    expect(callBody.GlobalSecondaryIndexUpdates).toHaveLength(2);
    expect(callBody.GlobalSecondaryIndexUpdates[0].Create.IndexName).toBe("new-gsi");
    expect(callBody.GlobalSecondaryIndexUpdates[1].Delete.IndexName).toBe("old-gsi");
    expect(callBody.AttributeDefinitions).toHaveLength(1);
  });
});

describe("useDynamoDBPartiQLTransaction", () => {
  it("calls api with POST and statements body", async () => {
    mockApi.mockResolvedValueOnce({ responses: [], total: 0 });
    const { result } = renderHook(() => useDynamoDBPartiQLTransaction(), {
      wrapper: createWrapper(),
    });
    const statements = [
      { Statement: "INSERT INTO t VALUE {'pk':'1'}" },
      { Statement: "UPDATE t SET name='x' WHERE pk='2'" },
    ];
    await result.current.mutateAsync(statements);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/partiql/transaction",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ statements }),
      }),
    );
  });

  it("sends statements with Parameters", async () => {
    mockApi.mockResolvedValueOnce({ responses: [], total: 0 });
    const { result } = renderHook(() => useDynamoDBPartiQLTransaction(), {
      wrapper: createWrapper(),
    });
    const statements = [
      { Statement: "SELECT * FROM t WHERE pk = ?", Parameters: [{ S: "val" }] },
    ];
    await result.current.mutateAsync(statements);
    const callBody = JSON.parse(mockApi.mock.calls[0][1].body);
    expect(callBody.statements[0].Parameters).toEqual([{ S: "val" }]);
  });
});

describe("useDynamoDBPartiQLBatch", () => {
  it("calls api with POST and statements body", async () => {
    mockApi.mockResolvedValueOnce({ responses: [], total: 0 });
    const { result } = renderHook(() => useDynamoDBPartiQLBatch(), {
      wrapper: createWrapper(),
    });
    const statements = [
      { Statement: "SELECT * FROM t WHERE pk = '1'" },
      { Statement: "SELECT * FROM t WHERE pk = '2'", ConsistentRead: true },
    ];
    await result.current.mutateAsync(statements);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/partiql/batch",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ statements }),
      }),
    );
  });

  it("handles batch response with errors", async () => {
    mockApi.mockResolvedValueOnce({
      responses: [
        { tableName: "t", item: { pk: "1" }, error: null },
        { tableName: "t", item: null, error: { Code: "Err", Message: "fail" } },
      ],
      total: 2,
    });
    const { result } = renderHook(() => useDynamoDBPartiQLBatch(), {
      wrapper: createWrapper(),
    });
    const data = await result.current.mutateAsync([
      { Statement: "SELECT * FROM t" },
    ]);
    expect(data.responses[1].error.Code).toBe("Err");
  });
});

describe("useDynamoDBExports", () => {
  it("does not call api when table is null", async () => {
    const { result } = renderHook(() => useDynamoDBExports(null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL when table is provided", async () => {
    mockApi.mockResolvedValueOnce({ exports: [], total: 0, nextToken: null });
    const { result } = renderHook(() => useDynamoDBExports("orders"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/dynamodb/tables/orders/exports");
  });
});

describe("useDynamoDBExportTable", () => {
  it("calls api with POST method and export params body", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => useDynamoDBExportTable("orders"), {
      wrapper: createWrapper(),
    });
    const params = {
      s3Bucket: "my-bucket",
      s3Prefix: "exports/",
      exportFormat: "DYNAMODB_JSON",
    };
    await result.current.mutateAsync(params);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/tables/orders/exports",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(params),
      }),
    );
  });
});

describe("useDynamoDBDescribeExport", () => {
  it("does not call api when exportArn is null", async () => {
    const { result } = renderHook(() => useDynamoDBDescribeExport(null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL when exportArn is provided", async () => {
    const arn = "arn:aws:dynamodb:us-east-1:000000000000:table/orders/export/017-abc";
    mockApi.mockResolvedValueOnce({
      exportArn: arn,
      exportStatus: "COMPLETED",
    });
    const { result } = renderHook(() => useDynamoDBDescribeExport(arn), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/dynamodb/exports?arn=${encodeURIComponent(arn)}`,
    );
  });
});
