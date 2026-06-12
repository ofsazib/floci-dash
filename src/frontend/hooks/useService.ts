import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export function useServiceList<T>(service: string, key: string) {
  return useQuery<T>({
    queryKey: ["aws", service, key],
    queryFn: () => api(`/aws/${service}/${key}`),
    refetchInterval: 10000,
    enabled: false, // enabled per-service when implemented
  });
}

export function useServiceMutation(service: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ method, path, body }: { method: string; path: string; body?: unknown }) =>
      api(`/aws/${service}${path}`, { method, body: body ? JSON.stringify(body) : undefined }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", service] }),
  });
}
