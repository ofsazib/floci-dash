import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── Projects ─────────────────────────────────────────

export function useCodeBuildProjects() {
  return useQuery({
    queryKey: ["aws", "codebuild", "projects"],
    queryFn: () => api<{ projects: any[] }>("/aws/codebuild/projects"),
  });
}

export function useCreateCodeBuildProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/codebuild/projects", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "codebuild", "projects"] }),
  });
}

export function useCodeBuildProject(name: string | null) {
  return useQuery({
    queryKey: ["aws", "codebuild", "projects", name],
    queryFn: () => api<any>(`/aws/codebuild/projects/${name}`),
    enabled: !!name,
  });
}

export function useDeleteCodeBuildProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/codebuild/projects/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "codebuild", "projects"] }),
  });
}

export function useStartCodeBuildBuild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/codebuild/projects/${name}/build`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "codebuild", "builds"] }),
  });
}

export function useCodeBuildProjectBuilds(name: string | null) {
  return useQuery({
    queryKey: ["aws", "codebuild", "builds", name],
    queryFn: () => api<{ builds: any[] }>(`/aws/codebuild/projects/${name}/builds`),
    enabled: !!name,
  });
}

// ─── Builds ───────────────────────────────────────────

export function useCodeBuildBuilds() {
  return useQuery({
    queryKey: ["aws", "codebuild", "builds"],
    queryFn: () => api<{ builds: any[] }>("/aws/codebuild/builds"),
  });
}

export function useCodeBuildBuild(id: string | null) {
  return useQuery({
    queryKey: ["aws", "codebuild", "builds", id],
    queryFn: () => api<any>(`/aws/codebuild/builds/${id}`),
    enabled: !!id,
  });
}

export function useStopCodeBuildBuild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/codebuild/builds/${id}/stop`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "codebuild", "builds"] }),
  });
}

// ─── Source Credentials ───────────────────────────────

export function useCodeBuildSourceCredentials() {
  return useQuery({
    queryKey: ["aws", "codebuild", "source-credentials"],
    queryFn: () => api<{ sourceCredentialsInfo: any[] }>("/aws/codebuild/source-credentials"),
  });
}

export function useImportCodeBuildSourceCredentials() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/codebuild/source-credentials", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "codebuild", "source-credentials"] }),
  });
}

export function useDeleteCodeBuildSourceCredentials() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) =>
      api(`/aws/codebuild/source-credentials/${encodeURIComponent(arn)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "codebuild", "source-credentials"] }),
  });
}

// ─── Curated Images ──────────────────────────────────

export function useCodeBuildCuratedImages() {
  return useQuery({
    queryKey: ["aws", "codebuild", "curated-images"],
    queryFn: () => api<{ images: any[] }>("/aws/codebuild/curated-images"),
  });
}
