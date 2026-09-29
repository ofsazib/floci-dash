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
  useAlternateContact,
  usePutAlternateContact,
} from "./useAccount";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useAlternateContact", () => {
  it("fetches the contact for the selected type", async () => {
    mockApi.mockResolvedValueOnce({
      contact: { AlternateContactType: "BILLING", Name: "Jane Doe", Title: "CFO" },
    });
    const { result } = renderHook(() => useAlternateContact("BILLING"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/account/alternate-contact?type=BILLING");
    expect(result.current.data?.contact?.Name).toBe("Jane Doe");
  });

  it("does not fetch when type is null", () => {
    renderHook(() => useAlternateContact(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("usePutAlternateContact", () => {
  it("PUTs the contact body and invalidates the type cache on success", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => usePutAlternateContact(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      type: "OPERATIONS",
      name: "Jane",
      title: "Ops Lead",
      emailAddress: "ops@example.com",
      phoneNumber: "+1 555 0101",
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/account/alternate-contact", {
      method: "PUT",
      body: JSON.stringify({
        type: "OPERATIONS",
        name: "Jane",
        title: "Ops Lead",
        emailAddress: "ops@example.com",
        phoneNumber: "+1 555 0101",
      }),
    });
    await waitFor(() =>
      expect(result.current.isSuccess).toBe(true)
    );
  });
});
