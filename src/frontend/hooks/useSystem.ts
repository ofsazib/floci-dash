import { useQuery } from "@tanstack/react-query";
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
