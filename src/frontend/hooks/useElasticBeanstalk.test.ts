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
  useApplications,
  useApplication,
  useCreateApplication,
  useDeleteApplication,
  useApplicationVersions,
  useCreateApplicationVersion,
  useDeleteApplicationVersion,
  useEnvironments,
  useEnvironment,
  useCreateEnvironment,
  useDeleteEnvironment,
  useConfigurationSettings,
  useSolutionStacks,
  useCheckDnsAvailability,
} from "./useElasticBeanstalk";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── Applications ──────────────────────────────────────

describe("useApplications", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ applications: [], total: 0 });
    const { result } = renderHook(() => useApplications(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elasticbeanstalk/applications");
  });
});

describe("useApplication", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useApplication(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with name in path", async () => {
    mockApi.mockResolvedValueOnce({ application: {} });
    const { result } = renderHook(() => useApplication("my-app"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elasticbeanstalk/applications/my-app");
  });
});

describe("useCreateApplication", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateApplication(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ applicationName: "my-app" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/elasticbeanstalk/applications",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("invalidates applications query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useCreateApplication(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({ applicationName: "my-app" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "elasticbeanstalk", "applications"] });
  });
});

describe("useDeleteApplication", () => {
  it("calls api with DELETE method and name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteApplication(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my-app");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/elasticbeanstalk/applications/my-app",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── Application Versions ──────────────────────────────

describe("useApplicationVersions", () => {
  it("does NOT call api when appName is null", () => {
    renderHook(() => useApplicationVersions(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with appName in path", async () => {
    mockApi.mockResolvedValueOnce({ versions: [], total: 0 });
    const { result } = renderHook(() => useApplicationVersions("my-app"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elasticbeanstalk/applications/my-app/versions");
  });
});

describe("useCreateApplicationVersion", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateApplicationVersion(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ appName: "my-app", versionLabel: "v1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/elasticbeanstalk/applications/my-app/versions",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("invalidates versions query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useCreateApplicationVersion(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({ appName: "my-app", versionLabel: "v1" });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["aws", "elasticbeanstalk", "applications", "my-app", "versions"],
    });
  });
});

describe("useDeleteApplicationVersion", () => {
  it("calls api with DELETE method and encoded params", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteApplicationVersion(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ appName: "my-app", versionLabel: "v1.0.0" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/elasticbeanstalk/applications/my-app/versions/v1.0.0",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── Environments ──────────────────────────────────────

describe("useEnvironments", () => {
  it("does NOT call api when appName is null", () => {
    renderHook(() => useEnvironments(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with appName in path", async () => {
    mockApi.mockResolvedValueOnce({ environments: [], total: 0 });
    const { result } = renderHook(() => useEnvironments("my-app"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elasticbeanstalk/applications/my-app/environments");
  });
});

describe("useEnvironment", () => {
  it("does NOT call api when envName is null", () => {
    renderHook(() => useEnvironment("my-app", null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("does NOT call api when appName is null", () => {
    renderHook(() => useEnvironment(null, "my-env"), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ environment: {} });
    const { result } = renderHook(() => useEnvironment("my-app", "my-env"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/elasticbeanstalk/environments/my-env?applicationName=my-app",
    );
  });
});

describe("useCreateEnvironment", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateEnvironment(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ appName: "my-app", environmentName: "my-env" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/elasticbeanstalk/applications/my-app/environments",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("invalidates environments on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useCreateEnvironment(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({ appName: "my-app", environmentName: "my-env" });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["aws", "elasticbeanstalk", "applications", "my-app", "environments"],
    });
  });
});

describe("useDeleteEnvironment", () => {
  it("calls api with DELETE method and envName in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteEnvironment(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my-env");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/elasticbeanstalk/environments/my-env",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── Configuration ─────────────────────────────────────

describe("useConfigurationSettings", () => {
  it("does NOT call api when appName is null", () => {
    renderHook(() => useConfigurationSettings(null, "my-env"), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("does NOT call api when envName is null", () => {
    renderHook(() => useConfigurationSettings("my-app", null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ configurationSettings: [] });
    const { result } = renderHook(() => useConfigurationSettings("my-app", "my-env"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/elasticbeanstalk/applications/my-app/environments/my-env/configuration",
    );
  });
});

// ─── Utility ───────────────────────────────────────────

describe("useSolutionStacks", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ solutionStacks: [] });
    const { result } = renderHook(() => useSolutionStacks(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elasticbeanstalk/solution-stacks");
  });
});

describe("useCheckDnsAvailability", () => {
  it("calls api with mutation", async () => {
    mockApi.mockResolvedValueOnce({ available: true, fullyQualifiedCNAME: "test.us-east-1.elasticbeanstalk.com" });
    const { result } = renderHook(() => useCheckDnsAvailability(), { wrapper: createWrapper() });
    const res = await result.current.mutateAsync("test-prefix");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/elasticbeanstalk/check-dns-availability/test-prefix",
    );
    expect(res.available).toBe(true);
  });
});
