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
  useCaDomains,
  useCaCreateDomain,
  useCaDeleteDomain,
  useCaAuthToken,
  useCaRepositories,
  useCaCreateRepository,
  useCaDeleteRepository,
  useCaRepositoryEndpoint,
  useCaFetchEndpoint,
  useCaAssociateExternalConnection,
  useCaDisassociateExternalConnection,
} from "./useCodeArtifact";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCaDomains", () => {
  it("fetches domains", async () => {
    mockApi.mockResolvedValueOnce({ domains: [] });
    const { result } = renderHook(() => useCaDomains(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codeartifact/domains");
  });
});

describe("useCaCreateDomain", () => {
  it("POSTs the domain name", async () => {
    mockApi.mockResolvedValueOnce({ domain: { name: "d" } });
    const { result } = renderHook(() => useCaCreateDomain(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "d" });
    expect(mockApi).toHaveBeenCalledWith("/aws/codeartifact/domains", {
      method: "POST",
      body: JSON.stringify({ name: "d" }),
    });
  });
});

describe("useCaDeleteDomain", () => {
  it("DELETEs with the name", async () => {
    mockApi.mockResolvedValueOnce({ domain: null });
    const { result } = renderHook(() => useCaDeleteDomain(), { wrapper: createWrapper() });
    await result.current.mutateAsync("d");
    expect(mockApi).toHaveBeenCalledWith("/aws/codeartifact/domains", {
      method: "DELETE",
      body: JSON.stringify({ name: "d" }),
    });
  });
});

describe("useCaAuthToken", () => {
  it("POSTs the domain", async () => {
    mockApi.mockResolvedValueOnce({ authorizationToken: "t", expiration: 1 });
    const { result } = renderHook(() => useCaAuthToken(), { wrapper: createWrapper() });
    await result.current.mutateAsync("d");
    expect(mockApi).toHaveBeenCalledWith("/aws/codeartifact/authorization-token", {
      method: "POST",
      body: JSON.stringify({ domain: "d" }),
    });
  });
});

describe("useCaRepositories", () => {
  it("fetches repositories", async () => {
    mockApi.mockResolvedValueOnce({ repositories: [] });
    const { result } = renderHook(() => useCaRepositories(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codeartifact/repositories");
  });

  it("encodes the prefix", async () => {
    mockApi.mockResolvedValueOnce({ repositories: [] });
    const { result } = renderHook(() => useCaRepositories("my prefix"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codeartifact/repositories?prefix=my%20prefix");
  });
});

describe("useCaCreateRepository", () => {
  it("POSTs domain, name, and upstreams", async () => {
    mockApi.mockResolvedValueOnce({ repository: { name: "r" } });
    const { result } = renderHook(() => useCaCreateRepository(), { wrapper: createWrapper() });
    const input = { domain: "d", name: "r", upstreams: ["u"] };
    await result.current.mutateAsync(input);
    expect(mockApi).toHaveBeenCalledWith("/aws/codeartifact/repositories", {
      method: "POST",
      body: JSON.stringify(input),
    });
  });
});

describe("useCaDeleteRepository", () => {
  it("DELETEs with domain and name", async () => {
    mockApi.mockResolvedValueOnce({ repository: null });
    const { result } = renderHook(() => useCaDeleteRepository(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ domain: "d", name: "r" });
    expect(mockApi).toHaveBeenCalledWith("/aws/codeartifact/repositories", {
      method: "DELETE",
      body: JSON.stringify({ domain: "d", name: "r" }),
    });
  });
});

describe("useCaRepositoryEndpoint", () => {
  it("fetches the endpoint with encoded params", async () => {
    mockApi.mockResolvedValueOnce({ repositoryEndpoint: "https://e" });
    const { result } = renderHook(() => useCaRepositoryEndpoint("d", "my repo"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/codeartifact/repositories/endpoint?domain=d&repository=my%20repo"
    );
  });

  it("does not fetch when domain or repository is null", () => {
    renderHook(() => useCaRepositoryEndpoint(null, null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useCaFetchEndpoint", () => {
  it("fetches the endpoint on demand", async () => {
    mockApi.mockResolvedValueOnce({ repositoryEndpoint: "https://e" });
    const { result } = renderHook(() => useCaFetchEndpoint(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ domain: "d", repository: "r" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/codeartifact/repositories/endpoint?domain=d&repository=r"
    );
  });
});

describe("useCaAssociateExternalConnection", () => {
  it("POSTs the association", async () => {
    mockApi.mockResolvedValueOnce({ repository: {} });
    const { result } = renderHook(() => useCaAssociateExternalConnection(), {
      wrapper: createWrapper(),
    });
    const input = { domain: "d", repository: "r", externalConnection: "public:npmjs" };
    await result.current.mutateAsync(input);
    expect(mockApi).toHaveBeenCalledWith("/aws/codeartifact/external-connections", {
      method: "POST",
      body: JSON.stringify(input),
    });
  });
});

describe("useCaDisassociateExternalConnection", () => {
  it("DELETEs the association", async () => {
    mockApi.mockResolvedValueOnce({ repository: {} });
    const { result } = renderHook(() => useCaDisassociateExternalConnection(), {
      wrapper: createWrapper(),
    });
    const input = { domain: "d", repository: "r", externalConnection: "public:npmjs" };
    await result.current.mutateAsync(input);
    expect(mockApi).toHaveBeenCalledWith("/aws/codeartifact/external-connections", {
      method: "DELETE",
      body: JSON.stringify(input),
    });
  });
});
