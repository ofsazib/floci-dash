import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export function useAASScalableTargets(serviceNamespace: string | null) {
  return useQuery<{ scalableTargets: any[]; total: number }>({
    queryKey: ["aws", "applicationautoscaling", "scalable-targets", serviceNamespace],
    queryFn: () =>
      api(`/aws/applicationautoscaling/scalable-targets?serviceNamespace=${serviceNamespace}`),
    enabled: !!serviceNamespace,
  });
}

export function useRegisterAAScalableTarget(serviceNamespace: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      resourceId: string;
      scalableDimension: string;
      minCapacity: number;
      maxCapacity: number;
      roleArn?: string;
    }) =>
      api("/aws/applicationautoscaling/scalable-targets", {
        method: "POST",
        body: JSON.stringify({ ...body, serviceNamespace }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "applicationautoscaling", "scalable-targets", serviceNamespace] }),
  });
}

export function useDeregisterAAScalableTarget(serviceNamespace: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { resourceId: string; scalableDimension: string }) =>
      api("/aws/applicationautoscaling/scalable-targets", {
        method: "DELETE",
        body: JSON.stringify({ ...body, serviceNamespace }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "applicationautoscaling", "scalable-targets", serviceNamespace] }),
  });
}

export function useAASScalingPolicies(serviceNamespace: string | null) {
  return useQuery<{ scalingPolicies: any[]; total: number }>({
    queryKey: ["aws", "applicationautoscaling", "scaling-policies", serviceNamespace],
    queryFn: () =>
      api(`/aws/applicationautoscaling/scalable-policies?serviceNamespace=${serviceNamespace}`),
    enabled: !!serviceNamespace,
  });
}

export function usePutAASScalingPolicy(serviceNamespace: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      policyName: string;
      resourceId: string;
      scalableDimension: string;
      targetTrackingConfiguration?: unknown;
      stepScalingConfiguration?: unknown;
    }) =>
      api("/aws/applicationautoscaling/scalable-policies", {
        method: "POST",
        body: JSON.stringify({ ...body, serviceNamespace }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "applicationautoscaling", "scaling-policies", serviceNamespace] }),
  });
}

export function useDeleteAASScalingPolicy(serviceNamespace: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { policyName: string; resourceId: string; scalableDimension: string }) =>
      api(
        `/aws/applicationautoscaling/scalable-policies/${encodeURIComponent(body.policyName)}?serviceNamespace=${serviceNamespace}&resourceId=${encodeURIComponent(body.resourceId)}&scalableDimension=${encodeURIComponent(body.scalableDimension)}`,
        { method: "DELETE" },
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "applicationautoscaling", "scaling-policies", serviceNamespace] }),
  });
}

export function useAASResourceTags(resourceId: string | null) {
  return useQuery<{ tags: Array<{ Key: string; Value: string }>; total: number }>({
    queryKey: ["aws", "applicationautoscaling", "resource-tags", resourceId],
    queryFn: () => api(`/aws/applicationautoscaling/resources/${encodeURIComponent(resourceId!)}/tags`),
    enabled: !!resourceId,
  });
}

export function useTagAASResource(resourceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tags: Array<{ Key: string; Value: string }>) =>
      api(`/aws/applicationautoscaling/resources/${encodeURIComponent(resourceId)}/tags`, {
        method: "PUT",
        body: JSON.stringify({ tags }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "applicationautoscaling", "resource-tags", resourceId] }),
  });
}

export function useUntagAASResource(resourceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tagKey: string) =>
      api(`/aws/applicationautoscaling/resources/${encodeURIComponent(resourceId)}/tags/${encodeURIComponent(tagKey)}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "applicationautoscaling", "resource-tags", resourceId] }),
  });
}
