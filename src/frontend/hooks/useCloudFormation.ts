import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export function useStacks() {
  return useQuery({
    queryKey: ["aws", "cloudformation", "stacks"],
    queryFn: () => api<{ stacks: any[]; total: number }>("/aws/cloudformation/stacks"),
  });
}

export function useStack(name: string | null) {
  return useQuery({
    queryKey: ["aws", "cloudformation", "stacks", name],
    queryFn: () =>
      api<{ stack: any; resources: any[]; events: any[] }>(`/aws/cloudformation/stacks/${name}`),
    enabled: !!name,
  });
}

export function useStackTemplate(name: string | null) {
  return useQuery({
    queryKey: ["aws", "cloudformation", "stacks", name, "template"],
    queryFn: () => api<{ name: string; template: string }>(`/aws/cloudformation/stacks/${name}/template`),
    enabled: !!name,
  });
}

export function useCreateStack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/cloudformation/stacks", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cloudformation", "stacks"] }),
  });
}

export function useDeleteStack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api(`/aws/cloudformation/stacks/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cloudformation", "stacks"] }),
  });
}

export function useValidateTemplate() {
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/cloudformation/validate-template", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useExports() {
  return useQuery({
    queryKey: ["aws", "cloudformation", "exports"],
    queryFn: () => api<{ exports: any[]; total: number }>("/aws/cloudformation/exports"),
  });
}

// ─── CHANGE SETS ──────────────────────────────────────

export function useChangeSets(stackName: string | null) {
  return useQuery({
    queryKey: ["aws", "cloudformation", "stacks", stackName, "changeSets"],
    queryFn: () => api<{ changeSets: any[]; total: number }>(
      `/aws/cloudformation/stacks/${stackName}/change-sets`
    ),
    enabled: !!stackName,
  });
}

export function useChangeSet(stackName: string | null, changeSetName: string | null) {
  return useQuery({
    queryKey: ["aws", "cloudformation", "stacks", stackName, "changeSets", changeSetName],
    queryFn: () => api<{ changeSet: any }>(
      `/aws/cloudformation/stacks/${stackName}/change-sets/${changeSetName}`
    ),
    enabled: !!stackName && !!changeSetName,
  });
}

export function useCreateChangeSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/cloudformation/change-sets", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["aws", "cloudformation", "stacks", variables.stackName, "changeSets"],
      });
    },
  });
}

export function useExecuteChangeSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { stackName: string; changeSetName: string }) =>
      api("/aws/cloudformation/change-sets/execute", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["aws", "cloudformation", "stacks", variables.stackName, "changeSets"],
      });
      qc.invalidateQueries({
        queryKey: ["aws", "cloudformation", "stacks", variables.stackName],
      });
      qc.invalidateQueries({ queryKey: ["aws", "cloudformation", "stacks"] });
    },
  });
}

export function useDeleteChangeSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { stackName: string; changeSetName: string }) =>
      api(
        `/aws/cloudformation/change-sets?name=${encodeURIComponent(params.changeSetName)}&stack=${encodeURIComponent(params.stackName)}`,
        { method: "DELETE" }
      ),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["aws", "cloudformation", "stacks", variables.stackName, "changeSets"],
      });
    },
  });
}

// ─── STACK SETS ───────────────────────────────────────

export function useStackSets() {
  return useQuery({
    queryKey: ["aws", "cloudformation", "stacksets"],
    queryFn: () => api<{ stackSets: any[]; total: number }>("/aws/cloudformation/stacksets"),
  });
}

export function useStackSet(name: string | null) {
  return useQuery({
    queryKey: ["aws", "cloudformation", "stacksets", name],
    queryFn: () => api<{ stackSet: any; instances: any[]; operations: any[] }>(
      `/aws/cloudformation/stacksets/${name}`
    ),
    enabled: !!name,
  });
}

export function useCreateStackSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/cloudformation/stacksets", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cloudformation", "stacksets"] }),
  });
}

export function useDeleteStackSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/cloudformation/stacksets/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cloudformation", "stacksets"] }),
  });
}

export function useCreateStackInstances() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { stackSetName: string; accounts: string[]; regions: string[] }) =>
      api(`/aws/cloudformation/stacksets/${body.stackSetName}/instances`, {
        method: "POST",
        body: JSON.stringify({ accounts: body.accounts, regions: body.regions }),
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["aws", "cloudformation", "stacksets", variables.stackSetName],
      });
    },
  });
}

export function useDeleteStackInstances() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { stackSetName: string; accounts: string[]; regions: string[]; retainStacks?: boolean }) =>
      api(`/aws/cloudformation/stacksets/${body.stackSetName}/instances`, {
        method: "DELETE",
        body: JSON.stringify({
          accounts: body.accounts,
          regions: body.regions,
          retainStacks: body.retainStacks,
        }),
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["aws", "cloudformation", "stacksets", variables.stackSetName],
      });
    },
  });
}
