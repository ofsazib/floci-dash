import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface StoreUser {
  UserId?: string;
  UserName?: string;
  DisplayName?: string;
  Emails?: { Value?: string }[];
}

export interface StoreGroup {
  GroupId?: string;
  DisplayName?: string;
  Description?: string;
}

export interface StoreMembership {
  MembershipId?: string;
  GroupId?: string;
  MemberId?: { UserId?: string };
}

const enc = encodeURIComponent;

export function useIdentityStoreUsers(identityStoreId: string | null) {
  return useQuery({
    queryKey: ["aws", "identitystore", "users", identityStoreId],
    queryFn: () =>
      api<{ users: StoreUser[]; total: number }>(
        `/aws/identitystore/users?identityStoreId=${enc(identityStoreId!)}`
      ),
    enabled: !!identityStoreId,
  });
}

export function useCreateIdentityStoreUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      identityStoreId: string;
      userName: string;
      displayName?: string;
    }) =>
      api<{ userId: string }>(`/aws/identitystore/users?identityStoreId=${enc(body.identityStoreId)}`, {
        method: "POST",
        body: JSON.stringify({
          userName: body.userName,
          displayName: body.displayName,
        }),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["aws", "identitystore", "users", v.identityStoreId] }),
  });
}

export function useDeleteIdentityStoreUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ identityStoreId, userId }: { identityStoreId: string; userId: string }) =>
      api(`/aws/identitystore/users/${enc(userId)}?identityStoreId=${enc(identityStoreId)}`, {
        method: "DELETE",
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["aws", "identitystore", "users", v.identityStoreId] }),
  });
}

export function useIdentityStoreGroups(identityStoreId: string | null) {
  return useQuery({
    queryKey: ["aws", "identitystore", "groups", identityStoreId],
    queryFn: () =>
      api<{ groups: StoreGroup[]; total: number }>(
        `/aws/identitystore/groups?identityStoreId=${enc(identityStoreId!)}`
      ),
    enabled: !!identityStoreId,
  });
}

export function useCreateIdentityStoreGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { identityStoreId: string; displayName: string }) =>
      api<{ groupId: string }>(`/aws/identitystore/groups?identityStoreId=${enc(body.identityStoreId)}`, {
        method: "POST",
        body: JSON.stringify({ displayName: body.displayName }),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["aws", "identitystore", "groups", v.identityStoreId] }),
  });
}

export function useDeleteIdentityStoreGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ identityStoreId, groupId }: { identityStoreId: string; groupId: string }) =>
      api(`/aws/identitystore/groups/${enc(groupId)}?identityStoreId=${enc(identityStoreId)}`, {
        method: "DELETE",
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["aws", "identitystore", "groups", v.identityStoreId] }),
  });
}

export function useIdentityStoreMemberships(
  identityStoreId: string | null,
  groupId: string | null
) {
  return useQuery({
    queryKey: ["aws", "identitystore", "memberships", identityStoreId, groupId],
    queryFn: () =>
      api<{ memberships: StoreMembership[]; total: number }>(
        `/aws/identitystore/groups/${enc(groupId!)}/memberships?identityStoreId=${enc(identityStoreId!)}`
      ),
    enabled: !!identityStoreId && !!groupId,
  });
}

export function useAddIdentityStoreMembership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      identityStoreId,
      groupId,
      userId,
    }: {
      identityStoreId: string;
      groupId: string;
      userId: string;
    }) =>
      api(`/aws/identitystore/groups/${enc(groupId)}/memberships?identityStoreId=${enc(identityStoreId)}`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({
        queryKey: ["aws", "identitystore", "memberships", v.identityStoreId, v.groupId],
      }),
  });
}

export function useRemoveIdentityStoreMembership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      identityStoreId,
      membershipId,
    }: {
      identityStoreId: string;
      membershipId: string;
    }) =>
      api(`/aws/identitystore/memberships/${enc(membershipId)}?identityStoreId=${enc(identityStoreId)}`, {
        method: "DELETE",
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({
        queryKey: ["aws", "identitystore", "memberships", v.identityStoreId],
      }),
  });
}
