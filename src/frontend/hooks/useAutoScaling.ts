import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface AutoScalingGroup {
  AutoScalingGroupName: string;
  AutoScalingGroupARN: string;
  MinSize: number;
  MaxSize: number;
  DesiredCapacity: number;
  DefaultCooldown: number;
  AvailabilityZones: string[];
  HealthCheckType: string;
  HealthCheckGracePeriod: number;
  CreatedTime: string;
  LaunchConfigurationName?: string;
  LaunchTemplate?: { LaunchTemplateName: string; Version: string };
  Instances?: {
    InstanceId: string;
    AvailabilityZone: string;
    LifecycleState: string;
    HealthStatus: string;
    ProtectedFromScaleIn: boolean;
  }[];
  TargetGroupARNs?: string[];
  LoadBalancerNames?: string[];
  Tags?: { Key: string; Value: string; ResourceId: string; ResourceType: string; PropagateAtLaunch: boolean }[];
  Status?: string;
}

export interface LaunchConfiguration {
  LaunchConfigurationName: string;
  LaunchConfigurationARN: string;
  ImageId: string;
  InstanceType: string;
  CreatedTime: string;
  AssociatePublicIpAddress?: boolean;
  KeyName?: string;
  UserData?: string;
  IamInstanceProfile?: string;
  SecurityGroups?: string[];
}

export interface ScalingPolicy {
  PolicyName: string;
  PolicyARN: string;
  AutoScalingGroupName: string;
  PolicyType: string;
  AdjustmentType?: string;
  ScalingAdjustment?: number;
  Cooldown?: number;
}

export interface ScalingActivity {
  ActivityId: string;
  AutoScalingGroupName: string;
  StatusCode: string;
  Progress: number;
  StartTime: string;
  EndTime?: string;
  Cause?: string;
  Description?: string;
  StatusMessage?: string;
}

// ── Auto Scaling Groups ──────────────────────────────────

export function useAutoScalingGroups() {
  return useQuery<{ groups: AutoScalingGroup[]; total: number }>({
    queryKey: ["aws", "autoscaling", "groups"],
    queryFn: () => api("/aws/autoscaling/groups"),
    refetchInterval: 10000,
  });
}

export function useCreateAutoScalingGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      autoScalingGroupName: string;
      minSize: number;
      maxSize: number;
      desiredCapacity?: number;
      launchConfigurationName?: string;
      launchTemplate?: { launchTemplateName?: string; version?: string };
      availabilityZones?: string[];
      targetGroupARNs?: string[];
      loadBalancerNames?: string[];
      healthCheckType?: string;
      healthCheckGracePeriod?: number;
      tags?: { key: string; value: string; propagateAtLaunch?: boolean }[];
    }) =>
      api("/aws/autoscaling/groups", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "autoscaling", "groups"] }),
  });
}

export function useUpdateAutoScalingGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      name: string;
      minSize?: number;
      maxSize?: number;
      desiredCapacity?: number;
      launchConfigurationName?: string;
    }) =>
      api(`/aws/autoscaling/groups/${encodeURIComponent(params.name)}`, {
        method: "PUT",
        body: JSON.stringify(params),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "autoscaling", "groups"] }),
  });
}

export function useDeleteAutoScalingGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/autoscaling/groups/${encodeURIComponent(name)}?force=true`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "autoscaling", "groups"] }),
  });
}

export function useSetDesiredCapacity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; desiredCapacity: number }) =>
      api(`/aws/autoscaling/groups/${encodeURIComponent(params.name)}/desired-capacity`, {
        method: "PUT",
        body: JSON.stringify({ desiredCapacity: params.desiredCapacity }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "autoscaling", "groups"] }),
  });
}

// ── Launch Configurations ────────────────────────────────

export function useLaunchConfigurations() {
  return useQuery<{ launchConfigurations: LaunchConfiguration[]; total: number }>({
    queryKey: ["aws", "autoscaling", "launch-configurations"],
    queryFn: () => api("/aws/autoscaling/launch-configurations"),
  });
}

// ── Scaling Policies ─────────────────────────────────────

export function useScalingPolicies(groupName: string | null) {
  return useQuery<{ policies: ScalingPolicy[]; total: number }>({
    queryKey: ["aws", "autoscaling", "policies", groupName],
    queryFn: () => api(`/aws/autoscaling/groups/${encodeURIComponent(groupName!)}/policies`),
    enabled: !!groupName,
  });
}

// ── Scaling Activities ───────────────────────────────────

export function useScalingActivities(groupName: string | null) {
  return useQuery<{ activities: ScalingActivity[]; total: number }>({
    queryKey: ["aws", "autoscaling", "activities", groupName],
    queryFn: () => api(`/aws/autoscaling/groups/${encodeURIComponent(groupName!)}/activities`),
    enabled: !!groupName,
  });
}

// ─── Instance Refresh ────────────────────────────────────

export function useStartInstanceRefresh() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; minHealthyPercentage?: number; instanceWarmup?: number }) =>
      api(`/aws/autoscaling/groups/${encodeURIComponent(params.name)}/instance-refresh`, {
        method: "POST",
        body: JSON.stringify({ minHealthyPercentage: params.minHealthyPercentage, instanceWarmup: params.instanceWarmup }),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "autoscaling", "instance-refreshes", variables.name] }),
  });
}

export function useInstanceRefreshes(groupName: string | null) {
  return useQuery<{ instanceRefreshes: any[]; total: number }>({
    queryKey: ["aws", "autoscaling", "instance-refreshes", groupName],
    queryFn: () => api(`/aws/autoscaling/groups/${encodeURIComponent(groupName!)}/instance-refreshes`),
    enabled: !!groupName,
    refetchInterval: 5000,
  });
}

// ─── Tags ────────────────────────────────────────────────

export function useCreateOrUpdateTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; tags: { key: string; value: string; propagateAtLaunch?: boolean }[] }) =>
      api(`/aws/autoscaling/groups/${encodeURIComponent(params.name)}/tags`, {
        method: "POST",
        body: JSON.stringify({ tags: params.tags }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "autoscaling", "groups"] }),
  });
}

export function useDeleteTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; tagKeys: string[] }) =>
      api(`/aws/autoscaling/groups/${encodeURIComponent(params.name)}/tags/delete`, {
        method: "POST",
        body: JSON.stringify({ tagKeys: params.tagKeys }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "autoscaling", "groups"] }),
  });
}

// ─── LB Target Groups ────────────────────────────────────

export function useASGLoadBalancerTargetGroups(groupName: string | null) {
  return useQuery<{ targetGroups: any[]; total: number }>({
    queryKey: ["aws", "autoscaling", "lb-target-groups", groupName],
    queryFn: () => api(`/aws/autoscaling/groups/${encodeURIComponent(groupName!)}/lb-target-groups`),
    enabled: !!groupName,
  });
}

export function useAttachLBTargetGroups() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; targetGroupARNs: string[] }) =>
      api(`/aws/autoscaling/groups/${encodeURIComponent(params.name)}/lb-target-groups`, {
        method: "POST",
        body: JSON.stringify({ targetGroupARNs: params.targetGroupARNs }),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "autoscaling", "lb-target-groups", variables.name] }),
  });
}

export function useDetachLBTargetGroups() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; targetGroupARNs: string[] }) =>
      api(`/aws/autoscaling/groups/${encodeURIComponent(params.name)}/lb-target-groups/detach`, {
        method: "POST",
        body: JSON.stringify({ targetGroupARNs: params.targetGroupARNs }),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "autoscaling", "lb-target-groups", variables.name] }),
  });
}

// ─── Classic Load Balancers ──────────────────────────────

export function useASGLoadBalancers(groupName: string | null) {
  return useQuery<{ loadBalancers: any[]; total: number }>({
    queryKey: ["aws", "autoscaling", "load-balancers", groupName],
    queryFn: () => api(`/aws/autoscaling/groups/${encodeURIComponent(groupName!)}/load-balancers`),
    enabled: !!groupName,
  });
}

export function useAttachLoadBalancers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; loadBalancerNames: string[] }) =>
      api(`/aws/autoscaling/groups/${encodeURIComponent(params.name)}/load-balancers`, {
        method: "POST",
        body: JSON.stringify({ loadBalancerNames: params.loadBalancerNames }),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "autoscaling", "load-balancers", variables.name] }),
  });
}

export function useDetachLoadBalancers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; loadBalancerNames: string[] }) =>
      api(`/aws/autoscaling/groups/${encodeURIComponent(params.name)}/load-balancers/detach`, {
        method: "POST",
        body: JSON.stringify({ loadBalancerNames: params.loadBalancerNames }),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "autoscaling", "load-balancers", variables.name] }),
  });
}
