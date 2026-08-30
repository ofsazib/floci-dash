import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ── MicroVM Images ────────────────────────────────────────

export function useMicrovmImages() {
  return useQuery<{ items: any[]; nextToken: string | null }>({
    queryKey: ["aws", "lambdamicrovms", "images"],
    queryFn: () => api("/aws/lambda/microvms/microvm-images"),
    refetchInterval: 10000,
  });
}

export function useMicrovmImage(id: string | null) {
  return useQuery<any>({
    queryKey: ["aws", "lambdamicrovms", "images", id],
    queryFn: () => api(`/aws/lambda/microvms/microvm-images/${encodeURIComponent(id!)}`),
    enabled: !!id,
  });
}

export function useCreateMicrovmImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/lambda/microvms/microvm-images", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "lambdamicrovms", "images"] }),
  });
}

export function useUpdateMicrovmImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; body: any }) =>
      api(`/aws/lambda/microvms/microvm-images/${encodeURIComponent(params.id)}`, {
        method: "PUT",
        body: JSON.stringify(params.body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "lambdamicrovms", "images"] }),
  });
}

export function useDeleteMicrovmImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/lambda/microvms/microvm-images/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "lambdamicrovms", "images"] }),
  });
}

// ── Versions ──────────────────────────────────────────────

export function useMicrovmImageVersions(imageId: string | null) {
  return useQuery<{ items: any[]; nextToken: string | null }>({
    queryKey: ["aws", "lambdamicrovms", "versions", imageId],
    queryFn: () => api(`/aws/lambda/microvms/microvm-images/${encodeURIComponent(imageId!)}/versions`),
    enabled: !!imageId,
  });
}

// ── Builds ────────────────────────────────────────────────

export function useMicrovmBuilds(imageId: string | null, version: string | null) {
  return useQuery<{ items: any[]; nextToken: string | null }>({
    queryKey: ["aws", "lambdamicrovms", "builds", imageId, version],
    queryFn: () =>
      api(`/aws/lambda/microvms/microvm-images/${encodeURIComponent(imageId!)}/versions/${encodeURIComponent(version!)}/builds`),
    enabled: !!imageId && !!version,
  });
}

// ── Managed Images ────────────────────────────────────────

export function useManagedMicrovmImages() {
  return useQuery<{ items: any[]; nextToken: string | null }>({
    queryKey: ["aws", "lambdamicrovms", "managed"],
    queryFn: () => api("/aws/lambda/microvms/managed-microvm-images"),
  });
}

// ── MicroVMs ──────────────────────────────────────────────

export function useMicrovms() {
  return useQuery<{ items: any[]; nextToken: string | null }>({
    queryKey: ["aws", "lambdamicrovms", "microvms"],
    queryFn: () => api("/aws/lambda/microvms/microvms"),
    refetchInterval: 10000,
  });
}

export function useMicrovm(id: string | null) {
  return useQuery<any>({
    queryKey: ["aws", "lambdamicrovms", "microvms", id],
    queryFn: () => api(`/aws/lambda/microvms/microvms/${encodeURIComponent(id!)}`),
    enabled: !!id,
  });
}

export function useRunMicrovm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { imageIdentifier: string }) =>
      api("/aws/lambda/microvms/microvms", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "lambdamicrovms", "microvms"] }),
  });
}

export function useTerminateMicrovm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/lambda/microvms/microvms/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "lambdamicrovms", "microvms"] }),
  });
}
