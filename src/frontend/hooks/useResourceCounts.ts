import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/client";

export type ResourceCounts = Record<string, number>;

export function useResourceCounts() {
  return useQuery<ResourceCounts>({
    queryKey: ["system", "resource-counts"],
    queryFn: () => api("/system/resource-counts"),
    refetchInterval: 30000,
  });
}
