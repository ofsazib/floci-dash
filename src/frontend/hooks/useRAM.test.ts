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
  useRAMShares,
  useCreateRAMShare,
  useUpdateRAMShare,
  useDeleteRAMShare,
  useAssociateRAMShare,
  useDisassociateRAMShare,
  useRAMPrincipals,
  useRAMResources,
  useRAMInvitations,
  useEnableRAMSharing,
  useRAMTagResource,
  useRAMUntagResource,
} from "./useRAM";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useRAMShares", () => {
  it("calls api with the default SELF owner", async () => {
    mockApi.mockResolvedValueOnce({ resourceShares: [], total: 0 });
    const { result } = renderHook(() => useRAMShares(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ram/shares?resourceOwner=SELF");
  });

  it("calls api with a custom owner", async () => {
    mockApi.mockResolvedValueOnce({ resourceShares: [], total: 0 });
    renderHook(() => useRAMShares("OTHER"), { wrapper: createWrapper() });
    await waitFor(() => expect(mockApi).toHaveBeenCalledWith("/aws/ram/shares?resourceOwner=OTHER"));
  });
});

describe("useCreateRAMShare", () => {
  it("POSTs body", async () => {
    mockApi.mockResolvedValueOnce({ resourceShare: {} });
    const { result } = renderHook(() => useCreateRAMShare(), { wrapper: createWrapper() });
    result.current.mutate({ name: "my-share" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ram/shares", {
      method: "POST",
      body: JSON.stringify({ name: "my-share" }),
    });
  });
});

describe("useUpdateRAMShare", () => {
  it("PUTs to the encoded ARN", async () => {
    mockApi.mockResolvedValueOnce({ resourceShare: {} });
    const { result } = renderHook(() => useUpdateRAMShare(), { wrapper: createWrapper() });
    result.current.mutate({ arn: "arn:aws:ram:share/1", name: "renamed" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ram/shares/" + encodeURIComponent("arn:aws:ram:share/1"),
      { method: "PUT", body: JSON.stringify({ name: "renamed" }) }
    );
  });
});

describe("useDeleteRAMShare", () => {
  it("DELETEs by encoded ARN", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteRAMShare(), { wrapper: createWrapper() });
    result.current.mutate("arn:aws:ram:share/1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ram/shares/" + encodeURIComponent("arn:aws:ram:share/1"), {
      method: "DELETE",
    });
  });
});

describe("useAssociateRAMShare", () => {
  it("POSTs association body", async () => {
    mockApi.mockResolvedValueOnce({ resourceShareAssociations: [] });
    const { result } = renderHook(() => useAssociateRAMShare(), { wrapper: createWrapper() });
    result.current.mutate({ arn: "arn:aws:ram:share/1", principals: ["123"] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ram/shares/" + encodeURIComponent("arn:aws:ram:share/1") + "/associate",
      { method: "POST", body: JSON.stringify({ principals: ["123"] }) }
    );
  });
});

describe("useDisassociateRAMShare", () => {
  it("POSTs disassociation body", async () => {
    mockApi.mockResolvedValueOnce({ resourceShareAssociations: [] });
    const { result } = renderHook(() => useDisassociateRAMShare(), { wrapper: createWrapper() });
    result.current.mutate({ arn: "arn:aws:ram:share/1", principals: ["123"] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ram/shares/" + encodeURIComponent("arn:aws:ram:share/1") + "/disassociate",
      { method: "POST", body: JSON.stringify({ principals: ["123"] }) }
    );
  });
});

describe("useRAMPrincipals", () => {
  it("does NOT call api when resourceShareArn is null", () => {
    renderHook(() => useRAMPrincipals(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded ARN when provided", async () => {
    mockApi.mockResolvedValueOnce({ principals: [], total: 0 });
    const { result } = renderHook(() => useRAMPrincipals("arn:aws:ram:share/1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ram/principals?resourceShareArn=" + encodeURIComponent("arn:aws:ram:share/1")
    );
  });
});

describe("useRAMResources", () => {
  it("does NOT call api when resourceShareArn is null", () => {
    renderHook(() => useRAMResources(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded ARN when provided", async () => {
    mockApi.mockResolvedValueOnce({ resources: [], total: 0 });
    const { result } = renderHook(() => useRAMResources("arn:aws:ram:share/1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ram/resources?resourceShareArn=" + encodeURIComponent("arn:aws:ram:share/1")
    );
  });
});

describe("useRAMInvitations", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ resourceShareInvitations: [], total: 0 });
    const { result } = renderHook(() => useRAMInvitations(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ram/invitations");
  });
});

describe("useEnableRAMSharing", () => {
  it("POSTs enable-sharing", async () => {
    mockApi.mockResolvedValueOnce({ returnValue: true });
    const { result } = renderHook(() => useEnableRAMSharing(), { wrapper: createWrapper() });
    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ram/enable-sharing", { method: "POST" });
  });
});

describe("useRAMTagResource", () => {
  it("POSTs tags", async () => {
    mockApi.mockResolvedValueOnce({ tagged: true });
    const { result } = renderHook(() => useRAMTagResource(), { wrapper: createWrapper() });
    result.current.mutate({ resourceShareArn: "arn:aws:ram:share/1", tags: [{ key: "env", value: "dev" }] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ram/tags", {
      method: "POST",
      body: JSON.stringify({ resourceShareArn: "arn:aws:ram:share/1", tags: [{ key: "env", value: "dev" }] }),
    });
  });
});

describe("useRAMUntagResource", () => {
  it("POSTs tagKeys", async () => {
    mockApi.mockResolvedValueOnce({ untagged: true });
    const { result } = renderHook(() => useRAMUntagResource(), { wrapper: createWrapper() });
    result.current.mutate({ resourceShareArn: "arn:aws:ram:share/1", tagKeys: ["env"] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ram/tags/untag", {
      method: "POST",
      body: JSON.stringify({ resourceShareArn: "arn:aws:ram:share/1", tagKeys: ["env"] }),
    });
  });
});
