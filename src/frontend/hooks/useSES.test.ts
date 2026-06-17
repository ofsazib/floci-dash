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
  useSESIdentities,
  useSESVerifyEmail,
  useSESVerifyDomain,
  useSESDeleteIdentity,
  useSESSendEmail,
  useSESVerifiedEmails,
} from "./useSES";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── IDENTITIES ──────────────────────────────────────────

describe("useSESIdentities", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ identities: [], total: 0 });
    const { result } = renderHook(() => useSESIdentities(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ses/identities");
  });

  it("forwards error", async () => {
    mockApi.mockRejectedValueOnce(new Error("fail"));
    const { result } = renderHook(() => useSESIdentities(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ─── VERIFY EMAIL ────────────────────────────────────────

describe("useSESVerifyEmail", () => {
  it("calls api with POST method and body", async () => {
    mockApi.mockResolvedValueOnce({ emailAddress: "a@b.com", initiated: true });
    const { result } = renderHook(() => useSESVerifyEmail(), { wrapper: createWrapper() });
    await result.current.mutateAsync("a@b.com");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ses/identities/verify-email",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ emailAddress: "a@b.com" }),
      })
    );
  });

  it("invalidates identities query on success", async () => {
    mockApi.mockResolvedValueOnce({ emailAddress: "a@b.com", initiated: true });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useSESVerifyEmail(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync("a@b.com");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "ses", "identities"] });
  });
});

// ─── VERIFY DOMAIN ───────────────────────────────────────

describe("useSESVerifyDomain", () => {
  it("calls api with POST method and body", async () => {
    mockApi.mockResolvedValueOnce({ domain: "example.com", verificationToken: "tok" });
    const { result } = renderHook(() => useSESVerifyDomain(), { wrapper: createWrapper() });
    await result.current.mutateAsync("example.com");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ses/identities/verify-domain",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ domain: "example.com" }),
      })
    );
  });

  it("invalidates identities query on success", async () => {
    mockApi.mockResolvedValueOnce({ domain: "example.com", verificationToken: "tok" });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useSESVerifyDomain(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync("example.com");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "ses", "identities"] });
  });
});

// ─── DELETE IDENTITY ─────────────────────────────────────

describe("useSESDeleteIdentity", () => {
  it("calls api with DELETE method and encoded value in path", async () => {
    mockApi.mockResolvedValueOnce({ identity: "a@b.com", deleted: true });
    const { result } = renderHook(() => useSESDeleteIdentity(), { wrapper: createWrapper() });
    await result.current.mutateAsync("a@b.com");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ses/identities/a%40b.com",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("invalidates identities query on success", async () => {
    mockApi.mockResolvedValueOnce({ identity: "a@b.com", deleted: true });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useSESDeleteIdentity(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync("a@b.com");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "ses", "identities"] });
  });
});

// ─── SEND EMAIL ──────────────────────────────────────────

describe("useSESSendEmail", () => {
  it("calls api with POST method and body", async () => {
    mockApi.mockResolvedValueOnce({ messageId: "msg-001" });
    const { result } = renderHook(() => useSESSendEmail(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      source: "sender@example.com",
      toAddresses: ["recipient@example.com"],
      subject: "Hello",
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ses/send-email",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          source: "sender@example.com",
          toAddresses: ["recipient@example.com"],
          subject: "Hello",
        }),
      })
    );
  });
});

// ─── VERIFIED EMAILS ─────────────────────────────────────

describe("useSESVerifiedEmails", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ emails: ["a@b.com"], total: 1 });
    const { result } = renderHook(() => useSESVerifiedEmails(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ses/verified-emails");
  });

  it("forwards error", async () => {
    mockApi.mockRejectedValueOnce(new Error("fail"));
    const { result } = renderHook(() => useSESVerifiedEmails(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
