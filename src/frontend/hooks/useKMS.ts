import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── KEYS ────────────────────────────────────────────────

export function useKMSKeys() {
  return useQuery({
    queryKey: ["aws", "kms", "keys"],
    queryFn: () => api<{ keys: any[]; total: number }>("/aws/kms/keys"),
  });
}

export function useKMSKey(id: string | null) {
  return useQuery({
    queryKey: ["aws", "kms", "keys", id],
    queryFn: () =>
      api<{ key: any; tags: Record<string, string>; aliases: any[]; grants: any[]; rotationEnabled: boolean }>(
        `/aws/kms/keys/${id}`
      ),
    enabled: !!id,
  });
}

export function useCreateKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api("/aws/kms/keys", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "kms", "keys"] }),
  });
}

export function useScheduleKeyDeletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: any) =>
      api(`/aws/kms/keys/${id}/schedule-deletion`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "kms", "keys"] }),
  });
}

export function useCancelKeyDeletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/aws/kms/keys/${id}/cancel-deletion`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "kms", "keys"] }),
  });
}

export function useToggleKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enable }: { id: string; enable: boolean }) =>
      api(`/aws/kms/keys/${id}/${enable ? "enable" : "disable"}`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "kms", "keys"] }),
  });
}

export function useToggleRotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enable }: { id: string; enable: boolean }) =>
      api(`/aws/kms/keys/${id}/${enable ? "enable-rotation" : "disable-rotation"}`, { method: "POST" }),
/* istanbul ignore next */
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "kms"] }),
  });
}

export function useUpdateKeyDescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, description }: { id: string; description: string }) =>
      api(`/aws/kms/keys/${id}/description`, { method: "PUT", body: JSON.stringify({ description }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "kms", "keys"] }),
  });
}

// ─── ALIASES ─────────────────────────────────────────────

export function useKMSAliases() {
  return useQuery({
    queryKey: ["aws", "kms", "aliases"],
    queryFn: () => api<{ aliases: any[]; total: number }>("/aws/kms/aliases"),
  });
}

export function useCreateAlias() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api("/aws/kms/aliases", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "kms", "aliases"] }),
  });
}

export function useDeleteAlias() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api(`/aws/kms/aliases/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "kms", "aliases"] }),
  });
}

// ─── CRYPTO ──────────────────────────────────────────────

export function useEncrypt() {
  return useMutation({
    mutationFn: ({ id, plaintext }: { id: string; plaintext: string }) =>
      api(`/aws/kms/keys/${id}/encrypt`, { method: "POST", body: JSON.stringify({ plaintext }) }),
  });
}

export function useDecrypt() {
  return useMutation({
    mutationFn: (body: any) => api("/aws/kms/decrypt", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useKeyPolicy(keyId: string | null) {
  return useQuery({
    queryKey: ["aws", "kms", "keys", keyId, "policy"],
    queryFn: () => api<any>(`/aws/kms/keys/${encodeURIComponent(keyId!)}/policy`),
    enabled: !!keyId,
  });
}

export function usePutKeyPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { keyId: string; policy: string }) =>
      api(`/aws/kms/keys/${encodeURIComponent(params.keyId)}/policy`, {
        method: "PUT",
        body: JSON.stringify({ policy: params.policy }),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["aws", "kms", "keys", v.keyId, "policy"] }),
  });
}

export function useSign() {
  return useMutation({
    mutationFn: (body: { keyId: string; message: string; signingAlgorithm?: string }) =>
      api(`/aws/kms/keys/${encodeURIComponent(body.keyId)}/sign`, { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useVerify() {
  return useMutation({
    mutationFn: (body: { keyId: string; message: string; signature: string; signingAlgorithm?: string }) =>
      api(`/aws/kms/keys/${encodeURIComponent(body.keyId)}/verify`, { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useRotateKeyOnDemand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) =>
      api(`/aws/kms/keys/${encodeURIComponent(keyId)}/rotate-on-demand`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "kms", "keys"] }),
  });
}

// ─── P1 gap audit — KMS extras ───────────────────────────
export function useKMSKeyPolicies(keyId: string | null) {
  return useQuery<{ policyNames: string[]; truncate: boolean }>({
    queryKey: ["aws", "kms", "key-policies", keyId],
    queryFn: () => api(`/aws/kms/keys/${keyId}/policies`),
    enabled: !!keyId,
  });
}

export function useKMSRetirableGrants() {
  return useMutation({
    mutationFn: (body: { retiringPrincipal: string; limit?: number; marker?: string }) =>
      api("/aws/kms/keys/retirable", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useKMSReEncrypt(keyId: string) {
  return useMutation({
    mutationFn: (body: { ciphertextBlob: string; destinationKeyId: string; sourceEncryptionContext?: Record<string, string> }) =>
      api(`/aws/kms/keys/${keyId}/re-encrypt`, { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useKMSGenerateDataKeyNoPlaintext(keyId: string) {
  return useMutation({
    mutationFn: (body: { keySpec?: string; numberOfBytes?: number }) =>
      api(`/aws/kms/keys/${keyId}/data-key-plaintext-free`, { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useKMSUpdateAlias() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ aliasName, targetKeyId }: { aliasName: string; targetKeyId: string }) =>
      api(`/aws/kms/aliases/${encodeURIComponent(aliasName)}`, { method: "PUT", body: JSON.stringify({ targetKeyId }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "kms", "aliases"] }),
  });
}
