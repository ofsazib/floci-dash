// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import { useCcControls, useCcControl } from "./useControlCatalog";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCcControls", () => {
  it("fetches controls", async () => {
    mockApi.mockResolvedValueOnce({ controls: [], nextToken: null });
    const { result } = renderHook(() => useCcControls(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/controlcatalog/controls");
  });
});

describe("useCcControl", () => {
  it("fetches a control with the arn stripped of its scheme prefix", async () => {
    mockApi.mockResolvedValueOnce({ control: { Name: "c" } });
    const { result } = renderHook(() => useCcControl("arn:cc:control/1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/controlcatalog/controls/cc:control/1");
  });

  it("does not fetch when arn is null", () => {
    renderHook(() => useCcControl(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});
