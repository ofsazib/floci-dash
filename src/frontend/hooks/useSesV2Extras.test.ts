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
  useSesAssociateTenantResource,
  useSesDisassociateTenantResource,
  useSesListTenantResources,
  useSesCreateExportJob,
  useSesListExportJobs,
  useSesCancelExportJob,
  useSesCreateImportJob,
  useSesListImportJobs,
  useSesBatchGetMetricData,
  useSesMessageInsights,
  useSesListDedicatedIps,
  useSesPutPoolScaling,
  useSesCreateTenant,
  useSesListTenants,
  useSesDeleteTenant,
} from "./useSesV2Extras";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("export job hooks", () => {
  it("creates an export job", async () => {
    mockApi.mockResolvedValueOnce({ jobId: "j1" });
    const { result } = renderHook(() => useSesCreateExportJob(), { wrapper: createWrapper() });
    const input = {
      exportDestination: { dataFormat: "CSV" },
      exportDataSource: {},
    };
    await result.current.mutateAsync(input);
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/export-jobs", {
      method: "POST",
      body: JSON.stringify(input),
    });
  });

  it("lists export jobs", async () => {
    mockApi.mockResolvedValueOnce({ jobs: [] });
    const { result } = renderHook(() => useSesListExportJobs(), { wrapper: createWrapper() });
    await result.current.mutateAsync();
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/export-jobs/list", {
      method: "POST",
      body: JSON.stringify({}),
    });
  });

  it("cancels an export job", async () => {
    mockApi.mockResolvedValueOnce({ cancelled: true });
    const { result } = renderHook(() => useSesCancelExportJob(), { wrapper: createWrapper() });
    await result.current.mutateAsync("j 1");
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/export-jobs/j%201/cancel", {
      method: "PUT",
    });
  });
});

describe("import job hooks", () => {
  it("creates an import job", async () => {
    mockApi.mockResolvedValueOnce({ jobId: "i1" });
    const { result } = renderHook(() => useSesCreateImportJob(), { wrapper: createWrapper() });
    const input = {
      importDataSource: { s3Url: "s3://b/k", dataFormat: "CSV" },
      importDestination: {},
    };
    await result.current.mutateAsync(input);
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/import-jobs", {
      method: "POST",
      body: JSON.stringify(input),
    });
  });

  it("lists import jobs", async () => {
    mockApi.mockResolvedValueOnce({ importJobs: [] });
    const { result } = renderHook(() => useSesListImportJobs(), { wrapper: createWrapper() });
    await result.current.mutateAsync();
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/import-jobs/list", {
      method: "POST",
      body: JSON.stringify({}),
    });
  });
});

describe("metrics and insights hooks", () => {
  it("batch-gets metric data", async () => {
    mockApi.mockResolvedValueOnce({ results: [] });
    const { result } = renderHook(() => useSesBatchGetMetricData(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync([{ id: "q1" }]);
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/metrics/batch", {
      method: "POST",
      body: JSON.stringify({ queries: [{ id: "q1" }] }),
    });
  });

  it("fetches message insights with an encoded id", async () => {
    mockApi.mockResolvedValueOnce({ insights: {} });
    const { result } = renderHook(() => useSesMessageInsights(), { wrapper: createWrapper() });
    await result.current.mutateAsync("m 1");
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/insights/m%201");
  });
});

describe("dedicated ip hooks", () => {
  it("lists dedicated IPs with a pool filter", async () => {
    mockApi.mockResolvedValueOnce({ dedicatedIps: [] });
    const { result } = renderHook(() => useSesListDedicatedIps(), { wrapper: createWrapper() });
    await result.current.mutateAsync("p 1");
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/dedicated-ips?pool=p%201");
  });

  it("lists dedicated IPs without a pool", async () => {
    mockApi.mockResolvedValueOnce({ dedicatedIps: [] });
    const { result } = renderHook(() => useSesListDedicatedIps(), { wrapper: createWrapper() });
    await result.current.mutateAsync(undefined);
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/dedicated-ips");
  });

  it("sets pool scaling", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useSesPutPoolScaling(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "p1", scalingMode: "MANAGED" });
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/dedicated-ip-pools/p1/scaling", {
      method: "PUT",
      body: JSON.stringify({ scalingMode: "MANAGED" }),
    });
  });
});

describe("tenant resource hooks", () => {
  it("associates a resource", async () => {
    mockApi.mockResolvedValueOnce({ associated: true });
    const { result } = renderHook(() => useSesAssociateTenantResource(), {
      wrapper: createWrapper(),
    });
    const input = { tenantName: "t1", resourceArn: "arn:x" };
    await result.current.mutateAsync(input);
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/tenants/resources", {
      method: "POST",
      body: JSON.stringify(input),
    });
  });

  it("disassociates a resource", async () => {
    mockApi.mockResolvedValueOnce({ disassociated: true });
    const { result } = renderHook(() => useSesDisassociateTenantResource(), {
      wrapper: createWrapper(),
    });
    const input = { tenantName: "t1", resourceArn: "arn:x" };
    await result.current.mutateAsync(input);
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/tenants/resources/delete", {
      method: "POST",
      body: JSON.stringify(input),
    });
  });

  it("lists tenant resources", async () => {
    mockApi.mockResolvedValueOnce({ resources: [] });
    const { result } = renderHook(() => useSesListTenantResources(), {
      wrapper: createWrapper(),
    });
    const input = { tenantName: "t1", resourceType: "identity" };
    await result.current.mutateAsync(input);
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/tenants/resources/list", {
      method: "POST",
      body: JSON.stringify(input),
    });
  });
});

describe("tenant hooks", () => {
  it("creates a tenant", async () => {
    mockApi.mockResolvedValueOnce({ tenant: {} });
    const { result } = renderHook(() => useSesCreateTenant(), { wrapper: createWrapper() });
    const input = { tenantName: "t1", tags: { a: "b" } };
    await result.current.mutateAsync(input);
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/tenants", {
      method: "POST",
      body: JSON.stringify(input),
    });
  });

  it("lists tenants", async () => {
    mockApi.mockResolvedValueOnce({ tenants: [] });
    const { result } = renderHook(() => useSesListTenants(), { wrapper: createWrapper() });
    await result.current.mutateAsync();
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/tenants/list", {
      method: "POST",
      body: JSON.stringify({}),
    });
  });

  it("deletes a tenant", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useSesDeleteTenant(), { wrapper: createWrapper() });
    await result.current.mutateAsync("t1");
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/tenants/delete", {
      method: "POST",
      body: JSON.stringify({ tenantName: "t1" }),
    });
  });
});
