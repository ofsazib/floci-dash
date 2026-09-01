import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export function useSecrets() {
  return useQuery({
    queryKey: ["aws", "secretsmanager", "secrets"],
    queryFn: () => api<{ secrets: any[]; total: number }>("/aws/secretsmanager/secrets"),
  });
}

export function useSecret(id: string | null) {
  return useQuery({
    queryKey: ["aws", "secretsmanager", "secrets", id],
    queryFn: () =>
      api<{ secret: any; versions: any[]; versionIdsToStages: Record<string, string[]> }>(
        `/aws/secretsmanager/secrets/${id}`
      ),
    enabled: !!id,
  });
}

export function useSecretValue(id: string | null, versionId?: string) {
  return useQuery({
    queryKey: ["aws", "secretsmanager", "secrets", id, "value", versionId],
    queryFn: () =>
      api<{ name: string; versionId: string; secretString: string; secretBinary: string; versionStages: string[] }>(
        `/aws/secretsmanager/secrets/${id}/value${versionId ? `?versionId=${versionId}` : ""}`
      ),
    enabled: !!id,
  });
}

export function useCreateSecret() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/secretsmanager/secrets", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "secretsmanager", "secrets"] }),
  });
}

export function useUpdateSecret() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: any) =>
      api(`/aws/secretsmanager/secrets/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "secretsmanager", "secrets"] }),
  });
}

export function useDeleteSecret() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) =>
      api(`/aws/secretsmanager/secrets/${id}?force=${force ? "true" : "false"}`, { method: "DELETE" }),
/* istanbul ignore next */
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "secretsmanager", "secrets"] }),
  });
}

export function useRestoreSecret() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/secretsmanager/secrets/${id}/restore`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "secretsmanager", "secrets"] }),
  });
}

export function useRotateSecret() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: any) =>
      api(`/aws/secretsmanager/secrets/${id}/rotate`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "secretsmanager", "secrets"] }),
  });
}

export function usePutSecretValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: any) =>
      api(`/aws/secretsmanager/secrets/${id}/value`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "secretsmanager", "secrets"] }),
  });
}

export function useRandomPassword() {
  return useMutation({
    mutationFn: (body: any) =>
      api<{ randomPassword: string }>("/aws/secretsmanager/random-password", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  });
}

export function useSecretResourcePolicy(secretId: string | null) {
  return useQuery({
    queryKey: ["aws", "secrets", secretId, "resource-policy"],
    queryFn: () => api<any>(`/aws/secretsmanager/secrets/${encodeURIComponent(secretId!)}/resource-policy`),
    enabled: !!secretId,
  });
}

export function usePutSecretResourcePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { secretId: string; resourcePolicy: string }) =>
      api(`/aws/secretsmanager/secrets/${encodeURIComponent(params.secretId)}/resource-policy`, {
        method: "PUT",
        body: JSON.stringify({ resourcePolicy: params.resourcePolicy }),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["aws", "secrets", v.secretId, "resource-policy"] }),
  });
}

export function useDeleteSecretResourcePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (secretId: string) =>
      api(`/aws/secretsmanager/secrets/${encodeURIComponent(secretId)}/resource-policy`, {
        method: "DELETE",
      }),
    onSuccess: (_d, secretId) =>
      qc.invalidateQueries({ queryKey: ["aws", "secrets", secretId, "resource-policy"] }),
  });
}

export function useBatchGetSecretValue() {
  return useMutation({
    mutationFn: (body: { secretIdList?: string[]; filters?: any[] }) =>
      api("/aws/secretsmanager/secrets/batch-value", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useUpdateSecretVersionStage() {
  return useMutation({
    mutationFn: (params: {
      secretId: string;
      versionStage: string;
      moveToVersionId?: string;
      removeFromVersionId?: string;
    }) =>
      api(`/aws/secretsmanager/secrets/${encodeURIComponent(params.secretId)}/version-stage`, {
        method: "POST",
        body: JSON.stringify({
          versionStage: params.versionStage,
          moveToVersionId: params.moveToVersionId,
          removeFromVersionId: params.removeFromVersionId,
        }),
      }),
  });
}
