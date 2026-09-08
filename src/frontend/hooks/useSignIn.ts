import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/client";

/** Begins an OAuth authorization flow — returns the consent redirect location. */
export function useAuthorize() {
  return useMutation({
    mutationFn: (params: Record<string, string>) =>
      api<{ location: string }>(`/api/signin/authorize?${new URLSearchParams(params)}`),
  });
}

/** Approves or denies a pending authorization request. */
export function useConsent() {
  return useMutation({
    mutationFn: (body: { requestId: string; action: "continue" | "cancel" }) =>
      api<{ location: string }>("/api/signin/consent", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  });
}

/** Exchanges a code/refresh token for session credentials. */
export function useSignInToken() {
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api<Record<string, unknown>>("/api/signin/token", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  });
}
