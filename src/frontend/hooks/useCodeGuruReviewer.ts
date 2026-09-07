import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export function useRepositoryAssociations() {
  return useQuery({
    queryKey: ["aws", "codegurureviewer", "associations"],
    queryFn: () =>
      api<{ associations: any[]; total: number }>("/aws/codegurureviewer/associations"),
  });
}

export function useRepositoryAssociation(associationArn: string | null) {
  return useQuery({
    queryKey: ["aws", "codegurureviewer", "associations", associationArn],
    queryFn: () =>
      api<{ repositoryAssociation: any; tags: Record<string, string> }>(
        `/aws/codegurureviewer/associations/${encodeURIComponent(associationArn!)}`
      ),
    enabled: !!associationArn,
  });
}

export function useAssociateRepository() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/codegurureviewer/associations", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "codegurureviewer", "associations"] }),
  });
}

export function useDisassociateRepository() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (associationArn: string) =>
      api(`/aws/codegurureviewer/associations/${encodeURIComponent(associationArn)}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "codegurureviewer", "associations"] }),
  });
}

export function useCodeGuruTags(resourceArn: string | null) {
  return useQuery({
    queryKey: ["aws", "codegurureviewer", "tags", resourceArn],
    queryFn: () =>
      api<{ tags: Record<string, string> }>(
        `/aws/codegurureviewer/tags?resourceArn=${encodeURIComponent(resourceArn!)}`
      ),
    enabled: !!resourceArn,
  });
}

export function useCodeGuruTagResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { resourceArn: string; tags: Record<string, string> }) =>
      api("/aws/codegurureviewer/tags", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "codegurureviewer", "tags", variables.resourceArn] }),
  });
}

export function useCodeGuruUntagResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { resourceArn: string; tagKeys: string[] }) =>
      api("/aws/codegurureviewer/tags/untag", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "codegurureviewer", "tags", variables.resourceArn] }),
  });
}
