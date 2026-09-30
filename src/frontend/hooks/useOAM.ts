import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface OamSink {
  Arn?: string;
  Id?: string;
  Name?: string;
  Tags?: Record<string, string>;
}

export interface OamLink {
  Arn?: string;
  Id?: string;
  Label?: string;
  ResourceTypes?: string[];
  SinkArn?: string;
  LabelTemplate?: string;
}

const enc = encodeURIComponent;

export function useOamSinks() {
  return useQuery({
    queryKey: ["aws", "oam", "sinks"],
    queryFn: () => api<{ sinks: OamSink[]; total: number }>("/aws/oam/sinks"),
  });
}

export function useCreateOamSink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api<{ sink: OamSink }>("/aws/oam/sinks", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "oam", "sinks"] }),
  });
}

export function useDeleteOamSink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (identifier: string) =>
      api(`/aws/oam/sinks/${enc(identifier)}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aws", "oam", "sinks"] });
      qc.invalidateQueries({ queryKey: ["aws", "oam", "links"] });
    },
  });
}

export function useOamSinkPolicy(identifier: string | null) {
  return useQuery({
    queryKey: ["aws", "oam", "sinks", identifier, "policy"],
    queryFn: () =>
      api<{ policy: string | null; sinkArn: string; sinkId: string }>(
        `/aws/oam/sinks/${enc(identifier!)}/policy`
      ),
    enabled: !!identifier,
  });
}

export function usePutOamSinkPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ identifier, policy }: { identifier: string; policy: string }) =>
      api(`/aws/oam/sinks/${enc(identifier)}/policy`, {
        method: "PUT",
        body: JSON.stringify({ policy }),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["aws", "oam", "sinks", v.identifier, "policy"] }),
  });
}

export function useOamAttachedLinks(identifier: string | null) {
  return useQuery({
    queryKey: ["aws", "oam", "sinks", identifier, "attached-links"],
    queryFn: () =>
      api<{
        links: { Label?: string; LinkArn?: string; ResourceTypes?: string[] }[];
        total: number;
      }>(`/aws/oam/sinks/${enc(identifier!)}/attached-links`),
    enabled: !!identifier,
  });
}

export function useOamLinks() {
  return useQuery({
    queryKey: ["aws", "oam", "links"],
    queryFn: () => api<{ links: OamLink[]; total: number }>("/aws/oam/links"),
  });
}

export function useCreateOamLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      sinkIdentifier: string;
      labelTemplate: string;
      resourceTypes: string[];
    }) =>
      api<{ link: OamLink }>("/aws/oam/links", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aws", "oam", "links"] });
      qc.invalidateQueries({ queryKey: ["aws", "oam", "sinks"] });
    },
  });
}

export function useDeleteOamLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (identifier: string) =>
      api(`/aws/oam/links/${enc(identifier)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "oam", "links"] }),
  });
}

export function useOamResourceTags(arn: string | null) {
  return useQuery({
    queryKey: ["aws", "oam", "tags", arn],
    queryFn: () => api<{ tags: Record<string, string> }>(`/aws/oam/resources/tags?arn=${enc(arn!)}`),
    enabled: !!arn,
  });
}

export function useAddOamResourceTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ arn, tags }: { arn: string; tags: Record<string, string> }) =>
      api("/aws/oam/resources/tags", { method: "POST", body: JSON.stringify({ arn, tags }) }),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["aws", "oam", "tags", v.arn] }),
  });
}

export function useRemoveOamResourceTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ arn, tagKeys }: { arn: string; tagKeys: string[] }) =>
      api("/aws/oam/resources/tags/untag", {
        method: "POST",
        body: JSON.stringify({ arn, tagKeys }),
      }),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["aws", "oam", "tags", v.arn] }),
  });
}
