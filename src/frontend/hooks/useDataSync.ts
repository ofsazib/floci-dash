import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface DsAgent {
  AgentArn?: string;
  Status?: string;
  Name?: string;
}

export interface DsLocation {
  LocationArn?: string;
  LocationUri?: string;
}

export interface DsTask {
  TaskArn?: string;
  Status?: string;
  Name?: string;
}

const enc = encodeURIComponent;

export function useDsAgents() {
  return useQuery({
    queryKey: ["aws", "datasync", "agents"],
    queryFn: () => api<{ agents: DsAgent[]; total: number }>("/aws/datasync/agents"),
  });
}

export function useCreateDsAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { activationKey: string; agentName?: string }) =>
      api<{ agentArn: string }>("/aws/datasync/agents", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "datasync", "agents"] }),
  });
}

export function useDeleteDsAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) => api(`/aws/datasync/agents/${arn}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "datasync", "agents"] }),
  });
}

export function useDsLocations() {
  return useQuery({
    queryKey: ["aws", "datasync", "locations"],
    queryFn: () =>
      api<{ locations: DsLocation[]; total: number }>("/aws/datasync/locations"),
  });
}

export function useCreateDsLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      blobType: string;
      containerUrl: string;
      agentArns: string[];
      authenticationType?: string;
    }) =>
      api<{ locationArn: string }>("/aws/datasync/locations", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "datasync", "locations"] }),
  });
}

export function useDeleteDsLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) => api(`/aws/datasync/locations/${arn}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "datasync", "locations"] }),
  });
}

export function useDsTasks() {
  return useQuery({
    queryKey: ["aws", "datasync", "tasks"],
    queryFn: () => api<{ tasks: DsTask[]; total: number }>("/aws/datasync/tasks"),
  });
}

export function useCreateDsTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      sourceLocationArn: string;
      destinationLocationArn: string;
      name?: string;
    }) =>
      api<{ taskArn: string }>("/aws/datasync/tasks", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "datasync", "tasks"] }),
  });
}

export function useDeleteDsTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) => api(`/aws/datasync/tasks/${arn}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "datasync", "tasks"] }),
  });
}
