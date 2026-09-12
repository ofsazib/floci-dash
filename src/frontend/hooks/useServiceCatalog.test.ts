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
  useScPortfolios,
  useScCreatePortfolio,
  useScDeletePortfolio,
  useScProducts,
  useScCreateProduct,
  useScDeleteProduct,
  useScArtifacts,
  useScProvisioned,
  useScProvision,
  useScTerminateProvisioned,
  useScTagOptions,
  useScCreateTagOption,
  useScDeleteTagOption,
  useScConstraints,
  useScCreateConstraint,
  useScDeleteConstraint,
} from "./useServiceCatalog";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

const mutationCases: [any, any][] = [
  [useScCreatePortfolio, { displayName: "d", providerName: "p" }],
  [useScDeletePortfolio, "port-1"],
  [useScCreateProduct, { name: "n", owner: "o" }],
  [useScDeleteProduct, "prod-1"],
  [useScProvision, { provisionedName: "pp", productId: "p", artifactId: "a" }],
  [useScTerminateProvisioned, "pp-1"],
  [useScCreateTagOption, { key: "k", value: "v" }],
  [useScDeleteTagOption, "to-1"],
  [useScCreateConstraint, { portfolioId: "p", productId: "pr", parameters: "{}", type: "LAUNCH" }],
  [useScDeleteConstraint, "c-1"],
];

describe("useServiceCatalog mutations", () => {
  for (const [hook, body] of mutationCases) {
    it(`${hook.name} sends the right request`, async () => {
      mockApi.mockResolvedValueOnce({ ok: true });
      const { result } = renderHook(() => hook(), { wrapper: createWrapper() });
      result.current.mutate(body as any);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledTimes(1);
    });
  }
});

describe("useServiceCatalog queries", () => {
  it("useScPortfolios fetches", async () => {
    mockApi.mockResolvedValueOnce({ portfolios: [], total: 0 });
    const { result } = renderHook(() => useScPortfolios(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/servicecatalog/portfolios");
  });

  it("useScProducts fetches", async () => {
    mockApi.mockResolvedValueOnce({ products: [], total: 0 });
    const { result } = renderHook(() => useScProducts(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/servicecatalog/products");
  });

  it("useScProvisioned fetches", async () => {
    mockApi.mockResolvedValueOnce({ provisionedProducts: [], total: 0 });
    const { result } = renderHook(() => useScProvisioned(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/servicecatalog/provisioned");
  });

  it("useScTagOptions fetches", async () => {
    mockApi.mockResolvedValueOnce({ tagOptions: [], total: 0 });
    const { result } = renderHook(() => useScTagOptions(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/servicecatalog/tag-options");
  });

  it("useScArtifacts fetches with encoded id and is disabled without one", async () => {
    mockApi.mockResolvedValueOnce({ artifacts: [], total: 0 });
    const { result } = renderHook(() => useScArtifacts("prod/1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/servicecatalog/artifacts?productId=prod%2F1");

    const disabled = renderHook(() => useScArtifacts(null), { wrapper: createWrapper() });
    expect(disabled.result.current.fetchStatus).toBe("idle");
  });

  it("useScConstraints fetches with encoded id and is disabled without one", async () => {
    mockApi.mockResolvedValueOnce({ constraints: [], total: 0 });
    const { result } = renderHook(() => useScConstraints("port/1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/servicecatalog/constraints?portfolioId=port%2F1");

    const disabled = renderHook(() => useScConstraints(null), { wrapper: createWrapper() });
    expect(disabled.result.current.fetchStatus).toBe("idle");
  });
});
