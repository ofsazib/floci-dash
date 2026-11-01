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
  useImportACMCertificate,
  useExportACMCertificate,
  useACMAccountConfiguration,
  usePutACMAccountConfiguration,
  useRenewACMCertificate,
  useResendACMValidationEmail,
  useRevokeACMCertificate,
  useUpdateACMCertificateOptions,
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

describe("useImportACMCertificate", () => {
  it("posts the import body", async () => {
    mockApi.mockResolvedValueOnce({ certificateArn: "arn:new" });
    const { result } = renderHook(() => useImportACMCertificate(), { wrapper: createWrapper() });
    result.current.mutate({ certificate: "CERT", privateKey: "KEY" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/acm/certificates/import", {
      method: "POST",
      body: JSON.stringify({ certificate: "CERT", privateKey: "KEY" }),
    });
  });
});

describe("useExportACMCertificate", () => {
  it("posts export by encoded arn", async () => {
    mockApi.mockResolvedValueOnce({ certificate: "C" });
    const { result } = renderHook(() => useExportACMCertificate(), { wrapper: createWrapper() });
    result.current.mutate("arn:c 1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/acm/certificates/arn%3Ac%201/export", {
      method: "POST",
    });
  });
});

describe("ACM account configuration hooks", () => {
  it("useACMAccountConfiguration fetches", async () => {
    mockApi.mockResolvedValueOnce({ expiryEvents: { DaysBeforeExpiry: 45 } });
    const { result } = renderHook(() => useACMAccountConfiguration(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/acm/account-configuration");
  });

  it("usePutACMAccountConfiguration puts days", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => usePutACMAccountConfiguration(), { wrapper: createWrapper() });
    result.current.mutate(30);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/acm/account-configuration", {
      method: "PUT",
      body: JSON.stringify({ daysBeforeExpiry: 30 }),
    });
  });
});

// ─── Certificate lifecycle actions ───────────────────────

describe("useRenewACMCertificate", () => {
  it("posts to renew endpoint", async () => {
    mockApi.mockResolvedValueOnce({ renewed: true });
    const { result } = renderHook(() => useRenewACMCertificate(), { wrapper: createWrapper() });
    await result.current.mutateAsync("arn:c1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/acm/certificates/arn%3Ac1/renew", { method: "POST" });
  });
});

describe("useResendACMValidationEmail", () => {
  it("posts domain and validationDomain", async () => {
    mockApi.mockResolvedValueOnce({ sent: true });
    const { result } = renderHook(() => useResendACMValidationEmail(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ arn: "arn:c1", domain: "example.com", validationDomain: "example.com" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/acm/certificates/arn%3Ac1/resend-validation", {
      method: "POST",
      body: JSON.stringify({ domain: "example.com", validationDomain: "example.com" }),
    });
  });
});

describe("useRevokeACMCertificate", () => {
  it("posts revocation reason", async () => {
    mockApi.mockResolvedValueOnce({ revoked: true });
    const { result } = renderHook(() => useRevokeACMCertificate(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ arn: "arn:c1", revocationReason: "KEY_COMPROMISE" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/acm/certificates/arn%3Ac1/revoke", {
      method: "POST",
      body: JSON.stringify({ revocationReason: "KEY_COMPROMISE" }),
    });
  });
});

describe("useUpdateACMCertificateOptions", () => {
  it("sends PUT with transparency preference", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateACMCertificateOptions(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ arn: "arn:c1", certificateTransparencyLoggingPreference: "ENABLED" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/acm/certificates/arn%3Ac1/options", {
      method: "PUT",
      body: JSON.stringify({ certificateTransparencyLoggingPreference: "ENABLED" }),
    });
  });
});
