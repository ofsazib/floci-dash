import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface NaclEntry {
  ruleNumber: number;
  protocol: string;
  ruleAction: string;
  egress: boolean;
  cidrBlock: string;
  portRange: { from: number; to: number } | null;
}

export interface NaclAssociation {
  networkAclAssociationId: string;
  networkAclId: string;
  subnetId: string;
}

export interface EC2NetworkAcl {
  networkAclId: string;
  vpcId: string;
  isDefault: boolean;
  ownerId?: string;
  entries: NaclEntry[];
  associations: NaclAssociation[];
  tags: Array<{ key: string; value: string }>;
}

export function useEC2NetworkAcls(vpcId?: string | null) {
  return useQuery<{ networkAcls: EC2NetworkAcl[]; total: number }>({
    queryKey: ["aws", "ec2", "network-acls", vpcId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (vpcId) params.set("vpcId", vpcId);
      return api(`/aws/ec2/network-acls?${params.toString()}`);
    },
    refetchInterval: 15000,
  });
}

export function useEC2CreateNetworkAcl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { vpcId: string }) =>
      api("/aws/ec2/network-acls", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ec2", "network-acls"] }),
  });
}

export function useEC2DeleteNetworkAcl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (networkAclId: string) =>
      api(`/aws/ec2/network-acls/${networkAclId}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ec2", "network-acls"] }),
  });
}

export function useEC2CreateNetworkAclEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      aclId,
      ...data
    }: {
      aclId: string;
      ruleNumber: number;
      protocol: string;
      ruleAction: string;
      egress: boolean;
      cidrBlock: string;
      portRangeFrom?: number;
      portRangeTo?: number;
    }) =>
      api(`/aws/ec2/network-acls/${aclId}/entries`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ec2", "network-acls"] }),
  });
}

export function useEC2DeleteNetworkAclEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      aclId,
      ruleNumber,
      egress,
    }: {
      aclId: string;
      ruleNumber: number;
      egress: boolean;
    }) =>
      api(
        `/aws/ec2/network-acls/${aclId}/entries/${ruleNumber}?egress=${egress}`,
        { method: "DELETE" }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ec2", "network-acls"] }),
  });
}

export function useEC2ReplaceNetworkAclAssociation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      aclId,
      associationId,
    }: {
      aclId: string;
      associationId: string;
    }) =>
      api(`/aws/ec2/network-acls/${aclId}/associations`, {
        method: "POST",
        body: JSON.stringify({ associationId }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ec2", "network-acls"] }),
  });
}
