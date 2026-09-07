import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export function useRAMShares(resourceOwner: string = "SELF") {
  return useQuery({
    queryKey: ["aws", "ram", "shares", resourceOwner],
    queryFn: () =>
      api<{ resourceShares: any[]; total: number }>(
        `/aws/ram/shares?resourceOwner=${encodeURIComponent(resourceOwner)}`
      ),
  });
}

export function useCreateRAMShare() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ram/shares", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ram", "shares"] }),
  });
}

export function useUpdateRAMShare() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ arn, ...body }: { arn: string } & any) =>
      api(`/aws/ram/shares/${encodeURIComponent(arn)}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ram", "shares"] }),
  });
}

export function useDeleteRAMShare() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) =>
      api(`/aws/ram/shares/${encodeURIComponent(arn)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ram", "shares"] }),
  });
}

export function useAssociateRAMShare() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ arn, ...body }: { arn: string } & any) =>
      api(`/aws/ram/shares/${encodeURIComponent(arn)}/associate`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ram"] }),
  });
}

export function useDisassociateRAMShare() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ arn, ...body }: { arn: string } & any) =>
      api(`/aws/ram/shares/${encodeURIComponent(arn)}/disassociate`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ram"] }),
  });
}

export function useRAMPrincipals(resourceShareArn: string | null) {
  return useQuery({
    queryKey: ["aws", "ram", "principals", resourceShareArn],
    queryFn: () =>
      api<{ principals: any[]; total: number }>(
        `/aws/ram/principals?resourceShareArn=${encodeURIComponent(resourceShareArn!)}`
      ),
    enabled: !!resourceShareArn,
  });
}

export function useRAMResources(resourceShareArn: string | null) {
  return useQuery({
    queryKey: ["aws", "ram", "resources", resourceShareArn],
    queryFn: () =>
      api<{ resources: any[]; total: number }>(
        `/aws/ram/resources?resourceShareArn=${encodeURIComponent(resourceShareArn!)}`
      ),
    enabled: !!resourceShareArn,
  });
}

export function useRAMInvitations() {
  return useQuery({
    queryKey: ["aws", "ram", "invitations"],
    queryFn: () =>
      api<{ resourceShareInvitations: any[]; total: number }>("/aws/ram/invitations"),
  });
}

export function useEnableRAMSharing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api("/aws/ram/enable-sharing", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ram", "shares"] }),
  });
}

export function useRAMTagResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { resourceShareArn: string; tags: { key: string; value: string }[] }) =>
      api("/aws/ram/tags", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ram", "shares"] }),
  });
}

export function useRAMUntagResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { resourceShareArn: string; tagKeys: string[] }) =>
      api("/aws/ram/tags/untag", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ram", "shares"] }),
  });
}
