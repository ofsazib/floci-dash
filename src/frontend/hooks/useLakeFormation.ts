import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface LakeFormationSettings {
  dataLakeAdmins: string[];
  createDatabaseDefaultPermissions: any[];
  createTableDefaultPermissions: any[];
  allowExternalDataFiltering: boolean;
  parameters: Record<string, string>;
  trustedResourceOwners: string[];
}

export interface LakeFormationResource {
  resourceArn: string;
  roleArn?: string;
  lastModified?: number;
  withFederation?: boolean;
}

export interface LakeFormationResourceDetail extends LakeFormationResource {
  hybridAccessEnabled?: boolean;
  withPrivilegedAccess?: boolean;
}

export interface LakeFormationPermission {
  principal?: string;
  resource?: any;
  permissions: string[];
  permissionsWithGrantOption: string[];
}

export interface LfTag {
  catalogId?: string;
  tagKey: string;
  tagValues: string[];
}

export interface LfTagFailure {
  lfTag?: any;
  error?: string;
}

const queryString = (params: Record<string, string | undefined>) => {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
    .join("&");
  return qs ? `?${qs}` : "";
};

export function useLakeFormationSettings() {
  return useQuery({
    queryKey: ["lakeformation", "settings"],
    queryFn: () => api<LakeFormationSettings>("/aws/lakeformation/settings"),
  });
}

export function useUpdateLakeFormationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { dataLakeAdmins: string[]; allowExternalDataFiltering: boolean; trustedResourceOwners?: string[] }) =>
      api("/aws/lakeformation/settings", { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lakeformation", "settings"] }),
  });
}

export function useLakeFormationResources() {
  return useQuery({
    queryKey: ["lakeformation", "resources"],
    queryFn: () => api<{ resources: LakeFormationResource[]; total: number }>("/aws/lakeformation/resources"),
  });
}

export function useLakeFormationResourceDetail(resourceArn: string | null) {
  return useQuery({
    queryKey: ["lakeformation", "resources", "detail", resourceArn],
    queryFn: () =>
      api<LakeFormationResourceDetail>(
        `/aws/lakeformation/resources/detail${queryString({ resourceArn: resourceArn! })}`,
      ),
    enabled: !!resourceArn,
  });
}

export function useRegisterLakeFormationResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { resourceArn: string; roleArn?: string; useServiceLinkedRole?: boolean }) =>
      api("/aws/lakeformation/resources", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lakeformation", "resources"] }),
  });
}

export function useUpdateLakeFormationResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { resourceArn: string; roleArn?: string }) =>
      api("/aws/lakeformation/resources", { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lakeformation", "resources"] }),
  });
}

export function useDeregisterLakeFormationResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (resourceArn: string) =>
      api(`/aws/lakeformation/resources${queryString({ resourceArn })}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lakeformation", "resources"] }),
  });
}

export function useLakeFormationPermissions() {
  return useQuery({
    queryKey: ["lakeformation", "permissions"],
    queryFn: () =>
      api<{ principalResourcePermissions: LakeFormationPermission[]; total: number }>(
        "/aws/lakeformation/permissions",
      ),
  });
}

export function useGrantLakeFormationPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { principal: string; resource: any; permissions: string[]; permissionsWithGrantOption?: string[] }) =>
      api("/aws/lakeformation/permissions/grant", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lakeformation", "permissions"] }),
  });
}

export function useRevokeLakeFormationPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { principal: string; resource: any; permissions: string[]; permissionsWithGrantOption?: string[] }) =>
      api("/aws/lakeformation/permissions/revoke", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lakeformation", "permissions"] }),
  });
}

export function useLfTags(catalogId?: string) {
  return useQuery({
    queryKey: ["lakeformation", "lf-tags", catalogId],
    queryFn: () =>
      api<{ lfTags: LfTag[]; nextToken?: string; total: number }>(
        `/aws/lakeformation/lf-tags${queryString({ catalogId })}`,
      ),
  });
}

export function useLfTag(tagKey: string | null, catalogId?: string) {
  return useQuery({
    queryKey: ["lakeformation", "lf-tags", "detail", tagKey, catalogId],
    queryFn: () =>
      api<LfTag>(`/aws/lakeformation/lf-tags/${encodeURIComponent(tagKey!)}${queryString({ catalogId })}`),
    enabled: !!tagKey,
  });
}

export function useCreateLfTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { tagKey: string; tagValues: string[]; catalogId?: string }) =>
      api("/aws/lakeformation/lf-tags", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lakeformation", "lf-tags"] }),
  });
}

export function useUpdateLfTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { tagKey: string; tagValuesToAdd?: string[]; tagValuesToDelete?: string[]; catalogId?: string }) =>
      api(`/aws/lakeformation/lf-tags/${encodeURIComponent(vars.tagKey)}`, {
        method: "PUT",
        body: JSON.stringify({
          tagValuesToAdd: vars.tagValuesToAdd,
          tagValuesToDelete: vars.tagValuesToDelete,
          catalogId: vars.catalogId,
        }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lakeformation", "lf-tags"] }),
  });
}

export function useDeleteLfTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { tagKey: string; catalogId?: string }) =>
      api(`/aws/lakeformation/lf-tags/${encodeURIComponent(vars.tagKey)}${queryString({ catalogId: vars.catalogId })}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lakeformation", "lf-tags"] }),
  });
}

export function useAssignLfTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { resource: any; lfTags: { TagKey: string; TagValues: string[] }[] }) =>
      api<{ failures: LfTagFailure[] }>("/aws/lakeformation/lf-tags/assign", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lakeformation", "permissions"] }),
  });
}

export function useUnassignLfTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { resource: any; lfTags: { TagKey: string; TagValues: string[] }[] }) =>
      api<{ failures: LfTagFailure[] }>("/aws/lakeformation/lf-tags/unassign", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lakeformation", "permissions"] }),
  });
}
