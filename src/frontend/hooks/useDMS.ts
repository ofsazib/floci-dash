import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface DmsSubnetGroup {
  ReplicationSubnetGroupIdentifier?: string;
  ReplicationSubnetGroupDescription?: string;
  VpcId?: string;
  SubnetGroupStatus?: string;
}

export interface DmsTag {
  Key: string;
  Value: string;
}

const enc = encodeURIComponent;

export function useDmsSubnetGroups() {
  return useQuery({
    queryKey: ["aws", "dms", "subnet-groups"],
    queryFn: () =>
      api<{ subnetGroups: DmsSubnetGroup[]; total: number }>(
        "/aws/dms/subnet-groups"
      ),
  });
}

export function useCreateDmsSubnetGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      replicationSubnetGroupIdentifier: string;
      replicationSubnetGroupDescription: string;
      subnetIds: string[];
    }) =>
      api<{ subnetGroup: DmsSubnetGroup | null }>("/aws/dms/subnet-groups", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "dms", "subnet-groups"] }),
  });
}

export function useDeleteDmsSubnetGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/dms/subnet-groups/${enc(id)}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "dms", "subnet-groups"] }),
  });
}

export function useDmsTags(arn: string | null) {
  return useQuery({
    queryKey: ["aws", "dms", "tags", arn],
    queryFn: () => api<{ tagList: DmsTag[] }>(`/aws/dms/resources/tags?arn=${enc(arn!)}`),
    enabled: !!arn,
  });
}

export function useAddDmsTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ arn, tags }: { arn: string; tags: DmsTag[] }) =>
      api("/aws/dms/resources/tags", {
        method: "POST",
        body: JSON.stringify({ resourceArn: arn, tags }),
      }),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["aws", "dms", "tags", v.arn] }),
  });
}

export function useRemoveDmsTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ arn, tagKeys }: { arn: string; tagKeys: string[] }) =>
      api("/aws/dms/resources/tags/untag", {
        method: "POST",
        body: JSON.stringify({ resourceArn: arn, tagKeys }),
      }),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["aws", "dms", "tags", v.arn] }),
  });
}
