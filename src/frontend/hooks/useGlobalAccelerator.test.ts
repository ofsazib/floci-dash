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
  useGaAccelerators,
  useCreateGaAccelerator,
  useDeleteGaAccelerator,
  useGaListeners,
  useCreateGaListener,
  useDeleteGaListener,
  useGaEndpointGroups,
  useCreateGaEndpointGroup,
  useDeleteGaEndpointGroup,
} from "./useGlobalAccelerator";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useGaAccelerators", () => {
  it("fetches accelerators", async () => {
    mockApi.mockResolvedValueOnce({ accelerators: [], total: 0 });
    const { result } = renderHook(() => useGaAccelerators(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/globalaccelerator/accelerators");
  });
});

describe("useCreateGaAccelerator", () => {
  it("POSTs the accelerator body", async () => {
    mockApi.mockResolvedValueOnce({ accelerator: {} });
    const { result } = renderHook(() => useCreateGaAccelerator(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "acc1", enabled: true });
    expect(mockApi).toHaveBeenCalledWith("/aws/globalaccelerator/accelerators", {
      method: "POST",
      body: JSON.stringify({ name: "acc1", enabled: true }),
    });
  });
});

describe("useDeleteGaAccelerator", () => {
  it("DELETEs with the raw ARN path", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteGaAccelerator(), { wrapper: createWrapper() });
    await result.current.mutateAsync("arn:x/y");
    expect(mockApi).toHaveBeenCalledWith("/aws/globalaccelerator/accelerators/arn:x/y", {
      method: "DELETE",
    });
  });
});

describe("useGaListeners", () => {
  it("fetches listeners with encoded arn", async () => {
    mockApi.mockResolvedValueOnce({ listeners: [], total: 0 });
    const { result } = renderHook(() => useGaListeners("arn:x"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/globalaccelerator/accelerators/listeners?acceleratorArn=arn%3Ax"
    );
  });

  it("does not fetch when arn is null", () => {
    renderHook(() => useGaListeners(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useCreateGaListener", () => {
  it("POSTs the listener body", async () => {
    mockApi.mockResolvedValueOnce({ listener: {} });
    const { result } = renderHook(() => useCreateGaListener(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      acceleratorArn: "arn:x",
      portRanges: [{ FromPort: 80, ToPort: 80 }],
      protocol: "TCP",
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/globalaccelerator/listeners", {
      method: "POST",
      body: JSON.stringify({
        acceleratorArn: "arn:x",
        portRanges: [{ FromPort: 80, ToPort: 80 }],
        protocol: "TCP",
      }),
    });
  });
});

describe("useDeleteGaListener", () => {
  it("DELETEs with the raw ARN path", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteGaListener(), { wrapper: createWrapper() });
    await result.current.mutateAsync("arn:l");
    expect(mockApi).toHaveBeenCalledWith("/aws/globalaccelerator/listeners/arn:l", {
      method: "DELETE",
    });
  });
});

describe("useGaEndpointGroups", () => {
  it("fetches endpoint groups", async () => {
    mockApi.mockResolvedValueOnce({ endpointGroups: [], total: 0 });
    const { result } = renderHook(() => useGaEndpointGroups("arn:l"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/globalaccelerator/listeners/endpoint-groups?listenerArn=arn%3Al"
    );
  });

  it("does not fetch when listener arn is null", () => {
    renderHook(() => useGaEndpointGroups(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useCreateGaEndpointGroup", () => {
  it("POSTs the endpoint-group body", async () => {
    mockApi.mockResolvedValueOnce({ endpointGroup: {} });
    const { result } = renderHook(() => useCreateGaEndpointGroup(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ listenerArn: "arn:l", endpointGroupRegion: "us-east-1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/globalaccelerator/endpoint-groups", {
      method: "POST",
      body: JSON.stringify({ listenerArn: "arn:l", endpointGroupRegion: "us-east-1" }),
    });
  });
});

describe("useDeleteGaEndpointGroup", () => {
  it("DELETEs with the raw ARN path", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteGaEndpointGroup(), { wrapper: createWrapper() });
    await result.current.mutateAsync("arn:g");
    expect(mockApi).toHaveBeenCalledWith("/aws/globalaccelerator/endpoint-groups/arn:g", {
      method: "DELETE",
    });
  });
});
