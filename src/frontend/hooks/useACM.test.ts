// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.hoisted(() => vi.fn());
vi.mock("../lib/client", () => ({ api: (...args: any[]) => mockApi(...args) }));
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, useQueryClient: () => ({ invalidateQueries: vi.fn() }) };
});

import {
  useACMCertificates,
  useACMCertificate,
  useRequestACMCertificate,
  useDeleteACMCertificate,
  useACMCertificateTags,
} from "./useACM";

beforeEach(() => mockApi.mockReset());

const ARN = "arn:aws:acm:us-east-1:123:certificate/abc";

describe("useACM hooks", () => {
  it("useACMCertificates calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ certificates: [], total: 0 });
    const { result } = renderHook(() => useACMCertificates(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/acm/certificates");
  });

  it("useACMCertificate calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ certificate: {} });
    const { result } = renderHook(() => useACMCertificate(ARN), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/acm/certificates/${encodeURIComponent(ARN)}`);
  });

  it("useACMCertificate disabled when null", () => {
    const { result } = renderHook(() => useACMCertificate(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useRequestACMCertificate calls POST", async () => {
    mockApi.mockResolvedValueOnce({ certificateArn: ARN });
    const { result } = renderHook(() => useRequestACMCertificate(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ domainName: "example.com" });
    expect(mockApi).toHaveBeenCalledWith("/aws/acm/certificates", {
      method: "POST",
      body: JSON.stringify({ domainName: "example.com" }),
    });
  });

  it("useDeleteACMCertificate calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteACMCertificate(), { wrapper: createWrapper() });
    await result.current.mutateAsync(ARN);
    expect(mockApi).toHaveBeenCalledWith(`/aws/acm/certificates/${encodeURIComponent(ARN)}`, {
      method: "DELETE",
    });
  });

  it("useACMCertificateTags calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ tags: [] });
    const { result } = renderHook(() => useACMCertificateTags(ARN), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/acm/certificates/${encodeURIComponent(ARN)}/tags`);
  });

  it("useACMCertificateTags disabled when null", () => {
    const { result } = renderHook(() => useACMCertificateTags(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});
