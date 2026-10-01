import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface VpStore {
  policyStoreId?: string;
  arn?: string;
  name?: string;
  description?: string;
}

export interface VpPolicy {
  policyId?: string;
  type?: string;
  definition?: { static?: { statement?: string } };
}

export interface VpIdentitySource {
  identitySourceId?: string;
  configuration?: Record<string, unknown>;
}

export interface VpAuthDecision {
  decision: string;
  determiningPolicies: { policyId: string }[];
  errors: { errorDescription?: string }[];
}

const enc = encodeURIComponent;

export function useVpStores() {
  return useQuery({
    queryKey: ["aws", "verifiedpermissions", "stores"],
    queryFn: () =>
      api<{ stores: VpStore[]; total: number }>("/aws/verifiedpermissions/stores"),
  });
}

export function useCreateVpStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      validationSettings: { mode: string };
      description?: string;
    }) =>
      api<{ store: VpStore }>("/aws/verifiedpermissions/stores", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "verifiedpermissions", "stores"] }),
  });
}

export function useDeleteVpStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/verifiedpermissions/stores/${enc(id)}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "verifiedpermissions", "stores"] }),
  });
}

export function useVpPolicies(storeId: string | null) {
  return useQuery({
    queryKey: ["aws", "verifiedpermissions", "policies", storeId],
    queryFn: () =>
      api<{ policies: VpPolicy[]; total: number }>(
        `/aws/verifiedpermissions/stores/${enc(storeId!)}/policies`
      ),
    enabled: !!storeId,
  });
}

export function useCreateVpPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      storeId,
      name,
      statement,
    }: {
      storeId: string;
      name: string;
      statement: string;
    }) =>
      api<{ policy: VpPolicy }>(`/aws/verifiedpermissions/stores/${enc(storeId)}/policies`, {
        method: "POST",
        body: JSON.stringify({
          name,
          definition: { static: { statement } },
        }),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({
        queryKey: ["aws", "verifiedpermissions", "policies", v.storeId],
      }),
  });
}

export function useDeleteVpPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ storeId, policyId }: { storeId: string; policyId: string }) =>
      api(`/aws/verifiedpermissions/stores/${enc(storeId)}/policies/${enc(policyId)}`, {
        method: "DELETE",
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({
        queryKey: ["aws", "verifiedpermissions", "policies", v.storeId],
      }),
  });
}

export function useVpIdentitySources(storeId: string | null) {
  return useQuery({
    queryKey: ["aws", "verifiedpermissions", "identity-sources", storeId],
    queryFn: () =>
      api<{ identitySources: VpIdentitySource[]; total: number }>(
        `/aws/verifiedpermissions/stores/${enc(storeId!)}/identity-sources`
      ),
    enabled: !!storeId,
  });
}

export function useCreateVpIdentitySource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      storeId,
      userPoolArn,
    }: {
      storeId: string;
      userPoolArn: string;
    }) =>
      api<{ identitySource: VpIdentitySource }>(
        `/aws/verifiedpermissions/stores/${enc(storeId)}/identity-sources`,
        {
          method: "POST",
          body: JSON.stringify({
            configuration: { cognitoUserPool: { userPoolArn } },
          }),
        }
      ),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({
        queryKey: ["aws", "verifiedpermissions", "identity-sources", v.storeId],
      }),
  });
}

export function useDeleteVpIdentitySource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ storeId, sourceId }: { storeId: string; sourceId: string }) =>
      api(`/aws/verifiedpermissions/stores/${enc(storeId)}/identity-sources/${enc(sourceId)}`, {
        method: "DELETE",
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({
        queryKey: ["aws", "verifiedpermissions", "identity-sources", v.storeId],
      }),
  });
}

export function useVpIsAuthorized() {
  return useMutation({
    mutationFn: ({
      storeId,
      principal,
      action,
      resource,
    }: {
      storeId: string;
      principal: string;
      action: string;
      resource: string;
    }) =>
      api<VpAuthDecision>(`/aws/verifiedpermissions/stores/${enc(storeId)}/is-authorized`, {
        method: "POST",
        body: JSON.stringify({
          principal: { entityType: "User", entityId: principal },
          action: { actionType: "Action", actionId: action },
          resource: { entityType: "Document", entityId: resource },
        }),
      }),
  });
}
