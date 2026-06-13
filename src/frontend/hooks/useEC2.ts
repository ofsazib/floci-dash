import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── Shared Types ──────────────────────────────────────

interface Tag {
  key: string;
  value: string;
}

// ─── Instance Types ──────────────────────────────────

export interface EC2Instance {
  id: string;
  imageId?: string;
  instanceType?: string;
  state?: string;
  privateIp?: string;
  publicIp?: string;
  privateDns?: string;
  publicDns?: string;
  vpcId?: string;
  subnetId?: string;
  keyName?: string;
  launchTime?: string;
  securityGroups?: Array<{ id: string; name: string }>;
  tags: Tag[];
  platform?: string;
  architecture?: string;
  iamInstanceProfile?: string;
  availabilityZone?: string;
  monitoring?: string;
  rootDeviceType?: string;
  rootDeviceName?: string;
  blockDevices?: Array<{ deviceName: string; volumeId: string; status: string }>;
  ebsOptimized?: boolean;
  sourceDestCheck?: boolean;
}

export function useEC2Instances() {
  return useQuery<{ instances: EC2Instance[]; total: number }>({
    queryKey: ["aws", "ec2", "instances"],
    queryFn: () => api("/aws/ec2/instances"),
    refetchInterval: 10000,
  });
}

export function useEC2Instance(id: string | null) {
  return useQuery<EC2Instance>({
    queryKey: ["aws", "ec2", "instance", id],
    queryFn: () => api(`/aws/ec2/instances/${id}`),
    enabled: !!id,
  });
}

export function useEC2RunInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      imageId?: string;
      instanceType?: string;
      keyName?: string;
      securityGroupIds?: string[];
      subnetId?: string;
      minCount?: number;
      maxCount?: number;
      userData?: string;
      tagSpecifications?: Array<{ resourceType: string; tags: Array<{ key: string; value: string }> }>;
    }) => api("/aws/ec2/instances", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "instances"] }),
  });
}

export function useEC2TerminateInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/aws/ec2/instances/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "instances"] }),
  });
}

export function useEC2StartInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/aws/ec2/instances/${id}/start`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "instances"] }),
  });
}

export function useEC2StopInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/aws/ec2/instances/${id}/stop`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "instances"] }),
  });
}

export function useEC2RebootInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/aws/ec2/instances/${id}/reboot`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "instances"] }),
  });
}

export function useEC2ModifyInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; instanceType?: string; sourceDestCheck?: boolean; ebsOptimized?: boolean; disableApiTermination?: boolean }) =>
      api(`/aws/ec2/instances/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aws", "ec2", "instances"] });
      qc.invalidateQueries({ queryKey: ["aws", "ec2", "instance"] });
    },
  });
}

// ─── VPC Types ─────────────────────────────────────────

export interface VPC {
  id: string;
  state?: string;
  cidrBlock?: string;
  isDefault?: boolean;
  instanceTenancy?: string;
  cidrBlockAssociations?: Array<{ id: string; cidrBlock: string; state?: string }>;
  tags: Tag[];
}

export function useEC2Vpcs() {
  return useQuery<{ vpcs: VPC[]; total: number }>({
    queryKey: ["aws", "ec2", "vpcs"],
    queryFn: () => api("/aws/ec2/vpcs"),
    refetchInterval: 10000,
  });
}

export function useEC2Vpc(id: string | null) {
  return useQuery<VPC>({
    queryKey: ["aws", "ec2", "vpc", id],
    queryFn: () => api(`/aws/ec2/vpcs/${id}`),
    enabled: !!id,
  });
}

export function useEC2CreateVpc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { cidrBlock?: string; instanceTenancy?: string }) =>
      api("/aws/ec2/vpcs", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "vpcs"] }),
  });
}

export function useEC2DeleteVpc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/aws/ec2/vpcs/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "vpcs"] }),
  });
}

export function useEC2ModifyVpc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; enableDnsSupport?: boolean; enableDnsHostnames?: boolean }) =>
      api(`/aws/ec2/vpcs/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aws", "ec2", "vpcs"] });
      qc.invalidateQueries({ queryKey: ["aws", "ec2", "vpc"] });
    },
  });
}

// ─── Subnet Types ──────────────────────────────────────

export interface Subnet {
  id: string;
  vpcId?: string;
  cidrBlock?: string;
  availabilityZone?: string;
  state?: string;
  availableIpCount?: number;
  mapPublicIpOnLaunch?: boolean;
  defaultForAz?: boolean;
  tags: Tag[];
}

export function useEC2Subnets() {
  return useQuery<{ subnets: Subnet[]; total: number }>({
    queryKey: ["aws", "ec2", "subnets"],
    queryFn: () => api("/aws/ec2/subnets"),
    refetchInterval: 10000,
  });
}

export function useEC2CreateSubnet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { vpcId: string; cidrBlock?: string; availabilityZone?: string }) =>
      api("/aws/ec2/subnets", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "subnets"] }),
  });
}

export function useEC2DeleteSubnet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/aws/ec2/subnets/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "subnets"] }),
  });
}

// ─── Security Group Types ──────────────────────────────

export interface SecurityGroup {
  id: string;
  name: string;
  description?: string;
  vpcId?: string;
  ownerId?: string;
  inboundRules?: Array<{
    ipProtocol?: string;
    fromPort?: number;
    toPort?: number;
    cidrIpv4?: string[];
    cidrIpv6?: string[];
    securityGroupPairs?: string[];
  }>;
  outboundRules?: Array<{
    ipProtocol?: string;
    fromPort?: number;
    toPort?: number;
    cidrIpv4?: string[];
    cidrIpv6?: string[];
    securityGroupPairs?: string[];
  }>;
  tags: Tag[];
}

export function useEC2SecurityGroups() {
  return useQuery<{ securityGroups: SecurityGroup[]; total: number }>({
    queryKey: ["aws", "ec2", "security-groups"],
    queryFn: () => api("/aws/ec2/security-groups"),
    refetchInterval: 10000,
  });
}

export function useEC2CreateSecurityGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { groupName: string; description?: string; vpcId?: string }) =>
      api("/aws/ec2/security-groups", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "security-groups"] }),
  });
}

export function useEC2DeleteSecurityGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/aws/ec2/security-groups/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "security-groups"] }),
  });
}

export function useEC2AuthorizeIngress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, ...data }: { groupId: string; ipProtocol?: string; fromPort?: number; toPort?: number; cidrIp?: string }) =>
      api(`/aws/ec2/security-groups/${groupId}/rules/ingress`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "security-groups"] }),
  });
}

export function useEC2RevokeIngress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, ...data }: { groupId: string; ipProtocol?: string; fromPort?: number; toPort?: number; cidrIp?: string }) =>
      api(`/aws/ec2/security-groups/${groupId}/rules/ingress`, { method: "DELETE", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "security-groups"] }),
  });
}

// ─── Key Pair Types ────────────────────────────────────

export interface KeyPair {
  name: string;
  fingerprint?: string;
  type?: string;
  tags: Tag[];
}

export function useEC2KeyPairs() {
  return useQuery<{ keyPairs: KeyPair[]; total: number }>({
    queryKey: ["aws", "ec2", "key-pairs"],
    queryFn: () => api("/aws/ec2/key-pairs"),
    refetchInterval: 10000,
  });
}

export function useEC2CreateKeyPair() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { keyName: string; keyType?: string }) =>
      api("/aws/ec2/key-pairs", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "key-pairs"] }),
  });
}

export function useEC2ImportKeyPair() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { keyName: string; publicKeyMaterial: string }) =>
      api("/aws/ec2/key-pairs/import", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "key-pairs"] }),
  });
}

export function useEC2DeleteKeyPair() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api(`/aws/ec2/key-pairs/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "key-pairs"] }),
  });
}

// ─── AMI / Image Types ─────────────────────────────────

export interface AMI {
  id: string;
  name?: string;
  description?: string;
  architecture?: string;
  platform?: string;
  state?: string;
  imageType?: string;
  creationDate?: string;
  rootDeviceType?: string;
  virtualizationType?: string;
  tags: Tag[];
}

export function useEC2Amis() {
  return useQuery<{ images: AMI[]; total: number }>({
    queryKey: ["aws", "ec2", "amis"],
    queryFn: () => api("/aws/ec2/amis"),
  });
}

// ─── Internet Gateway Types ────────────────────────────

export interface InternetGateway {
  id: string;
  attachments?: Array<{ vpcId: string; state: string }>;
  tags: Tag[];
  ownerId?: string;
}

export function useEC2InternetGateways() {
  return useQuery<{ internetGateways: InternetGateway[]; total: number }>({
    queryKey: ["aws", "ec2", "internet-gateways"],
    queryFn: () => api("/aws/ec2/internet-gateways"),
    refetchInterval: 10000,
  });
}

export function useEC2CreateInternetGateway() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api("/aws/ec2/internet-gateways", { method: "POST", body: "{}" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "internet-gateways"] }),
  });
}

export function useEC2DeleteInternetGateway() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/aws/ec2/internet-gateways/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "internet-gateways"] }),
  });
}

export function useEC2AttachInternetGateway() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, vpcId }: { id: string; vpcId: string }) =>
      api(`/aws/ec2/internet-gateways/${id}/attach`, { method: "POST", body: JSON.stringify({ vpcId }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "internet-gateways"] }),
  });
}

export function useEC2DetachInternetGateway() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, vpcId }: { id: string; vpcId: string }) =>
      api(`/aws/ec2/internet-gateways/${id}/detach`, { method: "POST", body: JSON.stringify({ vpcId }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "internet-gateways"] }),
  });
}

// ─── Route Table Types ─────────────────────────────────

export interface RouteTable {
  id: string;
  vpcId?: string;
  associations?: Array<{ id: string; subnetId?: string; main?: boolean; state?: string }>;
  routes?: Array<{
    destinationCidrBlock?: string;
    gatewayId?: string;
    natGatewayId?: string;
    state?: string;
    origin?: string;
  }>;
  tags: Tag[];
}

export function useEC2RouteTables() {
  return useQuery<{ routeTables: RouteTable[]; total: number }>({
    queryKey: ["aws", "ec2", "route-tables"],
    queryFn: () => api("/aws/ec2/route-tables"),
    refetchInterval: 10000,
  });
}

export function useEC2CreateRouteTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { vpcId: string }) =>
      api("/aws/ec2/route-tables", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "route-tables"] }),
  });
}

export function useEC2DeleteRouteTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/aws/ec2/route-tables/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "route-tables"] }),
  });
}

// ─── NAT Gateway Types ─────────────────────────────────

export interface NatGateway {
  id: string;
  subnetId?: string;
  vpcId?: string;
  state?: string;
  natGatewayAddresses?: Array<{ publicIp?: string; privateIp?: string; allocationId?: string }>;
  createdAt?: string;
  tags: Tag[];
}

export function useEC2NatGateways() {
  return useQuery<{ natGateways: NatGateway[]; total: number }>({
    queryKey: ["aws", "ec2", "nat-gateways"],
    queryFn: () => api("/aws/ec2/nat-gateways"),
    refetchInterval: 10000,
  });
}

export function useEC2CreateNatGateway() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { subnetId: string; allocationId: string }) =>
      api("/aws/ec2/nat-gateways", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "nat-gateways"] }),
  });
}

export function useEC2DeleteNatGateway() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/aws/ec2/nat-gateways/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "nat-gateways"] }),
  });
}

// ─── Elastic IP Types ──────────────────────────────────

export interface ElasticIp {
  allocationId: string;
  publicIp?: string;
  privateIp?: string;
  associationId?: string;
  instanceId?: string;
  networkInterfaceId?: string;
  domain?: string;
  tags: Tag[];
}

export function useEC2ElasticIps() {
  return useQuery<{ addresses: ElasticIp[]; total: number }>({
    queryKey: ["aws", "ec2", "elastic-ips"],
    queryFn: () => api("/aws/ec2/elastic-ips"),
    refetchInterval: 10000,
  });
}

export function useEC2AllocateElasticIp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (domain?: string) =>
      api("/aws/ec2/elastic-ips", { method: "POST", body: JSON.stringify({ domain }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "elastic-ips"] }),
  });
}

export function useEC2ReleaseElasticIp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (allocationId: string) =>
      api(`/aws/ec2/elastic-ips/${allocationId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "elastic-ips"] }),
  });
}

// ─── Launch Template Types ─────────────────────────────

export interface LaunchTemplate {
  id: string;
  name: string;
  defaultVersion?: number;
  latestVersion?: number;
  createdBy?: string;
  createdAt?: string;
  tags: Tag[];
}

export function useEC2LaunchTemplates() {
  return useQuery<{ launchTemplates: LaunchTemplate[]; total: number }>({
    queryKey: ["aws", "ec2", "launch-templates"],
    queryFn: () => api("/aws/ec2/launch-templates"),
    refetchInterval: 10000,
  });
}

export function useEC2CreateLaunchTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      launchTemplateName: string;
      imageId?: string;
      instanceType?: string;
      keyName?: string;
      securityGroupIds?: string[];
      userData?: string;
    }) => api("/aws/ec2/launch-templates", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "launch-templates"] }),
  });
}

export function useEC2DeleteLaunchTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/aws/ec2/launch-templates/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "launch-templates"] }),
  });
}

// ─── Volume Types ──────────────────────────────────────

export interface Volume {
  id: string;
  size?: number;
  volumeType?: string;
  state?: string;
  availabilityZone?: string;
  iops?: number;
  throughput?: number;
  encrypted?: boolean;
  snapshotId?: string;
  multiAttachEnabled?: boolean;
  attachments?: Array<{ instanceId: string; device: string; state: string; attachedTime?: string }>;
  createdAt?: string;
  tags: Tag[];
}

export function useEC2Volumes() {
  return useQuery<{ volumes: Volume[]; total: number }>({
    queryKey: ["aws", "ec2", "volumes"],
    queryFn: () => api("/aws/ec2/volumes"),
    refetchInterval: 10000,
  });
}

export function useEC2CreateVolume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { availabilityZone: string; size?: number; volumeType?: string; iops?: number; encrypted?: boolean; snapshotId?: string }) =>
      api("/aws/ec2/volumes", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "volumes"] }),
  });
}

export function useEC2DeleteVolume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/aws/ec2/volumes/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ec2", "volumes"] }),
  });
}

// ─── Network Interface Types ───────────────────────────

export interface NetworkInterface {
  id: string;
  vpcId?: string;
  subnetId?: string;
  description?: string;
  privateIp?: string;
  macAddress?: string;
  status?: string;
  instanceId?: string;
  securityGroups?: Array<{ id: string; name: string }>;
  tags: Tag[];
}

export function useEC2NetworkInterfaces() {
  return useQuery<{ networkInterfaces: NetworkInterface[]; total: number }>({
    queryKey: ["aws", "ec2", "network-interfaces"],
    queryFn: () => api("/aws/ec2/network-interfaces"),
  });
}

// ─── Info Types (Regions, AZs, Instance Types) ─────────

export function useEC2Regions() {
  return useQuery<{ regions: Array<{ name: string; endpoint?: string; optInStatus?: string }> }>({
    queryKey: ["aws", "ec2", "regions"],
    queryFn: () => api("/aws/ec2/regions"),
  });
}

export function useEC2AvailabilityZones() {
  return useQuery<{ availabilityZones: Array<{ name: string; id: string; state?: string; region?: string }> }>({
    queryKey: ["aws", "ec2", "availability-zones"],
    queryFn: () => api("/aws/ec2/availability-zones"),
  });
}

export function useEC2InstanceTypes() {
  return useQuery<{ instanceTypes: Array<{
    type?: string;
    currentGeneration?: boolean;
    vCpus?: number;
    memoryMb?: number;
    storageGb?: number;
    networkPerformance?: string;
    supportedArchitectures?: string[];
  }> }>({
    queryKey: ["aws", "ec2", "instance-types"],
    queryFn: () => api("/aws/ec2/instance-types"),
  });
}
