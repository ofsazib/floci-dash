import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface ServerlessNamespace {
  namespaceName?: string;
  namespaceId?: string;
  namespaceArn?: string;
  dbName?: string;
  status?: string;
  adminUsername?: string;
  kmsKeyId?: string;
  defaultIamRoleArn?: string;
  creationDate?: string;
}

export interface NamespaceTag {
  key: string;
  value: string;
}

const enc = encodeURIComponent;

export function useServerlessNamespaces() {
  return useQuery({
    queryKey: ["aws", "redshiftserverless"],
    queryFn: () =>
      api<{ namespaces: ServerlessNamespace[]; total: number }>(
        "/aws/redshiftserverless/namespaces"
      ),
  });
}

export function useCreateServerlessNamespace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      namespaceName: string;
      dbName: string;
      adminUsername: string;
    }) =>
      api<{ namespace: ServerlessNamespace }>("/aws/redshiftserverless/namespaces", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "redshiftserverless"] }),
  });
}

export function useUpdateServerlessNamespace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      namespaceName,
      adminUsername,
    }: {
      namespaceName: string;
      adminUsername: string;
    }) =>
      api<{ namespace: ServerlessNamespace }>(
        `/aws/redshiftserverless/namespaces/${enc(namespaceName)}`,
        { method: "PUT", body: JSON.stringify({ adminUsername }) }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "redshiftserverless"] }),
  });
}

export function useDeleteServerlessNamespace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (namespaceName: string) =>
      api(`/aws/redshiftserverless/namespaces/${enc(namespaceName)}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "redshiftserverless"] }),
  });
}

export function useServerlessNamespaceTags(namespaceName: string | null, arn: string | null) {
  return useQuery({
    queryKey: ["aws", "redshiftserverless", namespaceName, "tags", arn],
    queryFn: () =>
      api<{ tags: NamespaceTag[] }>(
        `/aws/redshiftserverless/namespaces/${enc(namespaceName!)}/tags?arn=${enc(arn!)}`
      ),
    enabled: !!namespaceName && !!arn,
  });
}

export function useAddServerlessNamespaceTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      namespaceName,
      arn,
      tags,
    }: {
      namespaceName: string;
      arn: string;
      tags: NamespaceTag[];
    }) =>
      api(`/aws/redshiftserverless/namespaces/${enc(namespaceName)}/tags`, {
        method: "POST",
        body: JSON.stringify({ arn, tags }),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({
        queryKey: ["aws", "redshiftserverless", v.namespaceName, "tags"],
      }),
  });
}

export function useRemoveServerlessNamespaceTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      namespaceName,
      arn,
      tagKeys,
    }: {
      namespaceName: string;
      arn: string;
      tagKeys: string[];
    }) =>
      api(`/aws/redshiftserverless/namespaces/${enc(namespaceName)}/tags/untag`, {
        method: "POST",
        body: JSON.stringify({ arn, tagKeys }),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({
        queryKey: ["aws", "redshiftserverless", v.namespaceName, "tags"],
      }),
  });
}
