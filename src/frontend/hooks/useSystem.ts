import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";
import type { HealthResponse, InitResponse } from "../types/api";

export function useHealth() {
  return useQuery<HealthResponse>({
    queryKey: ["system", "health"],
    queryFn: () => api("/system/health"),
    refetchInterval: 5000,
  });
}

export function useInit() {
  return useQuery<InitResponse>({
    queryKey: ["system", "init"],
    queryFn: () => api("/system/init"),
    refetchInterval: 30000,
  });
}

export interface ActiveServicesResponse {
  activeCount: number;
  activeServices: string[];
}

export function useActiveServices() {
  return useQuery<ActiveServicesResponse>({
    queryKey: ["system", "active"],
    queryFn: () => api("/active"),
    refetchInterval: 15000,
  });
}

export interface DiscoverResponse {
  working: string;
  candidates: string[];
}

export function useDiscoverFloci() {
  const qc = useQueryClient();
  return useMutation<DiscoverResponse>({
    mutationFn: () => api("/system/discover-floci"),
    onSuccess: (data) => {
      if (data.working) {
        qc.invalidateQueries({ queryKey: ["system", "health"] });
      }
    },
  });
}
