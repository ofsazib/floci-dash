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
