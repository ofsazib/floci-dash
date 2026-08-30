import { Hono } from "hono";
import type { Context } from "hono";
import {
  EC2Client,
  RunInstancesCommand,
  DescribeInstancesCommand,
  TerminateInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  RebootInstancesCommand,
  DescribeInstanceStatusCommand,
  CreateVpcCommand,
  DescribeVpcsCommand,
  DeleteVpcCommand,
  ModifyVpcAttributeCommand,
  AssociateVpcCidrBlockCommand,
  DisassociateVpcCidrBlockCommand,
  CreateVpcEndpointCommand,
  DescribeVpcEndpointsCommand,
  DeleteVpcEndpointsCommand,
  CreateSubnetCommand,
  DescribeSubnetsCommand,
  DeleteSubnetCommand,
  ModifySubnetAttributeCommand,
  CreateSecurityGroupCommand,
  DescribeSecurityGroupsCommand,
  DeleteSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand,
  AuthorizeSecurityGroupEgressCommand,
  ModifyInstanceAttributeCommand,
  RevokeSecurityGroupIngressCommand,
  RevokeSecurityGroupEgressCommand,
  CreateKeyPairCommand,
  DescribeKeyPairsCommand,
  DeleteKeyPairCommand,
  ImportKeyPairCommand,
  DescribeImagesCommand,
  CreateTagsCommand,
  DeleteTagsCommand,
  DescribeTagsCommand,
  CreateInternetGatewayCommand,
  DescribeInternetGatewaysCommand,
  DeleteInternetGatewayCommand,
  AttachInternetGatewayCommand,
  DetachInternetGatewayCommand,
  CreateRouteTableCommand,
  DescribeRouteTablesCommand,
  DeleteRouteTableCommand,
  AssociateRouteTableCommand,
  DisassociateRouteTableCommand,
  CreateRouteCommand,
  DeleteRouteCommand,
  CreateNatGatewayCommand,
  DescribeNatGatewaysCommand,
  DeleteNatGatewayCommand,
  AllocateAddressCommand,
  AssociateAddressCommand,
  DisassociateAddressCommand,
  ReleaseAddressCommand,
  DescribeAddressesCommand,
  DescribeAvailabilityZonesCommand,
  DescribeRegionsCommand,
  DescribeAccountAttributesCommand,
  DescribeInstanceTypesCommand,
  CreateLaunchTemplateCommand,
  CreateLaunchTemplateVersionCommand,
  DescribeLaunchTemplatesCommand,
  DescribeLaunchTemplateVersionsCommand,
  ModifyLaunchTemplateCommand,
  DeleteLaunchTemplateCommand,
  CreateVolumeCommand,
  DescribeVolumesCommand,
  DeleteVolumeCommand,
  DescribeNetworkInterfacesCommand,
  DescribePrefixListsCommand,
  RequestSpotInstancesCommand,
  DescribeSpotInstanceRequestsCommand,
  CancelSpotInstanceRequestsCommand,
  DescribeSecurityGroupRulesCommand,
  ModifySecurityGroupRulesCommand,
  UpdateSecurityGroupRuleDescriptionsIngressCommand,
  // P1 gap audit — Transit Gateway family
  CreateTransitGatewayCommand,
  DescribeTransitGatewaysCommand,
  ModifyTransitGatewayCommand,
  DeleteTransitGatewayCommand,
  DescribeTransitGatewayAttachmentsCommand,
  CreateTransitGatewayVpcAttachmentCommand,
  DescribeTransitGatewayVpcAttachmentsCommand,
  ModifyTransitGatewayVpcAttachmentCommand,
  DeleteTransitGatewayVpcAttachmentCommand,
  CreateTransitGatewayRouteTableCommand,
  DescribeTransitGatewayRouteTablesCommand,
  DeleteTransitGatewayRouteTableCommand,
  AssociateTransitGatewayRouteTableCommand,
  DisassociateTransitGatewayRouteTableCommand,
  GetTransitGatewayRouteTableAssociationsCommand,
  GetTransitGatewayRouteTablePropagationsCommand,
  EnableTransitGatewayRouteTablePropagationCommand,
  DisableTransitGatewayRouteTablePropagationCommand,
  CreateTransitGatewayRouteCommand,
  DeleteTransitGatewayRouteCommand,
  SearchTransitGatewayRoutesCommand,
  // P1 gap audit — managed prefix lists
  CreateManagedPrefixListCommand,
  DescribeManagedPrefixListsCommand,
  GetManagedPrefixListEntriesCommand,
  ModifyManagedPrefixListCommand,
  DeleteManagedPrefixListCommand,
  // P1 gap audit — misc
  DescribeInstanceAttributeCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcEndpointServicesCommand,
  ModifyVpcEndpointCommand,
  CreateDefaultVpcCommand,
  GetSecurityGroupsForVpcCommand,
  UpdateSecurityGroupRuleDescriptionsEgressCommand,
  CreateImageCommand,
  RegisterImageCommand,
  ReplaceRouteCommand,
  DescribeAddressesAttributeCommand,
  DescribeInstanceTypeOfferingsCommand,
  DescribeIamInstanceProfileAssociationsCommand,
} from "@aws-sdk/client-ec2";
import { getAwsConfig } from "../../clients/aws";
import { sanitizeName, sanitizeText } from "../../clients/sanitize";

const router = new Hono();

function ec2(): EC2Client {
  return new EC2Client(getAwsConfig());
}

// ──────────────────────────────────────────────
//  INSTANCES
// ──────────────────────────────────────────────

router.get("/instances", async (c: Context) => {
  const result = await ec2().send(new DescribeInstancesCommand({}));
  const reservations = result.Reservations || [];
  const instances = reservations.flatMap((r) => (r.Instances || []).map((i) => ({
    id: i.InstanceId,
    imageId: i.ImageId,
    instanceType: i.InstanceType,
    state: i.State?.Name,
    privateIp: i.PrivateIpAddress,
    publicIp: i.PublicIpAddress,
    privateDns: i.PrivateDnsName,
    publicDns: i.PublicDnsName,
    vpcId: i.VpcId,
    subnetId: i.SubnetId,
    keyName: i.KeyName,
    launchTime: i.LaunchTime?.toISOString(),
    securityGroups: (i.SecurityGroups || []).map((sg: any) => ({
      id: sg.GroupId, name: sg.GroupName,
    })),
    tags: (i.Tags || []).map((t: any) => ({ key: t.Key, value: t.Value })),
    platform: i.Platform,
    architecture: i.Architecture,
    iamInstanceProfile: i.IamInstanceProfile?.Arn,
    availabilityZone: i.Placement?.AvailabilityZone,
    monitoring: i.Monitoring?.State,
    rootDeviceType: i.RootDeviceType,
    rootDeviceName: i.RootDeviceName,
    blockDevices: (i.BlockDeviceMappings || []).map((bd: any) => ({
      deviceName: bd.DeviceName, volumeId: bd.Ebs?.VolumeId, status: bd.Ebs?.Status,
    })),
    ebsOptimized: i.EbsOptimized,
    sourceDestCheck: i.SourceDestCheck,
  })));
  return c.json({ instances, total: instances.length });
});

router.post("/instances", async (c: Context) => {
  const body = await c.req.json<any>();
  const result = await ec2().send(
    new RunInstancesCommand({
      ImageId: sanitizeName(body.imageId || "ami-0abcdef1234567891", 256),
      InstanceType: body.instanceType || "t3.micro",
      KeyName: sanitizeName(body.keyName || "", 255),
      SecurityGroupIds: body.securityGroupIds,
      SubnetId: sanitizeName(body.subnetId || "", 255),
      MinCount: body.minCount || 1,
      MaxCount: body.maxCount || 1,
      UserData: body.userData ? Buffer.from(body.userData).toString("base64") : undefined,
    })
  );
  const instances = (result.Instances || []).map((i) => ({
    id: i.InstanceId, state: i.State?.Name,
  }));
  return c.json({ instances, created: true });
});

router.get("/instances/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const result = await ec2().send(new DescribeInstancesCommand({ InstanceIds: [id] }));
  const i = result.Reservations?.[0]?.Instances?.[0];
  if (!i) return c.json({ error: "Instance not found" }, 404);
  return c.json({
    id: i.InstanceId, imageId: i.ImageId, instanceType: i.InstanceType,
    state: i.State?.Name, privateIp: i.PrivateIpAddress, publicIp: i.PublicIpAddress,
    privateDns: i.PrivateDnsName, publicDns: i.PublicDnsName,
    vpcId: i.VpcId, subnetId: i.SubnetId, keyName: i.KeyName,
    launchTime: i.LaunchTime?.toISOString(),
    securityGroups: (i.SecurityGroups || []).map((sg: any) => ({ id: sg.GroupId, name: sg.GroupName })),
    tags: (i.Tags || []).map((t: any) => ({ key: t.Key, value: t.Value })),
    platform: i.Platform, architecture: i.Architecture,
    iamInstanceProfile: i.IamInstanceProfile?.Arn,
    availabilityZone: i.Placement?.AvailabilityZone,
    monitoring: i.Monitoring?.State, rootDeviceType: i.RootDeviceType, rootDeviceName: i.RootDeviceName,
    blockDevices: (i.BlockDeviceMappings || []).map((bd: any) => ({
      deviceName: bd.DeviceName, volumeId: bd.Ebs?.VolumeId, status: bd.Ebs?.Status,
    })),
    ebsOptimized: i.EbsOptimized, sourceDestCheck: i.SourceDestCheck,
  });
});

router.delete("/instances/:id", async (c: Context) => {
  const id = c.req.param("id");
  await ec2().send(new TerminateInstancesCommand({ InstanceIds: [id!] }));
  return c.json({ id, terminated: true });
});

router.post("/instances/:id/start", async (c: Context) => {
  const id = c.req.param("id");
  try {
    await ec2().send(new StartInstancesCommand({ InstanceIds: [id!] }));
  } catch { /* instance may already be running — no-op */ }
  return c.json({ id, started: true });
});

router.post("/instances/:id/stop", async (c: Context) => {
  const id = c.req.param("id");
  try {
    await ec2().send(new StopInstancesCommand({ InstanceIds: [id!] }));
  } catch { /* instance may already be stopped — no-op */ }
  return c.json({ id, stopped: true });
});

router.post("/instances/:id/reboot", async (c: Context) => {
  const id = c.req.param("id");
  try {
    await ec2().send(new RebootInstancesCommand({ InstanceIds: [id!] }));
  } catch { /* reboot may not be supported — no-op */ }
  return c.json({ id, rebooting: true });
});

router.get("/instances/:id/status", async (c: Context) => {
  const id = c.req.param("id");
  const result = await ec2().send(new DescribeInstanceStatusCommand({ InstanceIds: [id!] }));
  const s = result.InstanceStatuses?.[0];
  return c.json({
    id, instanceStatus: s?.InstanceStatus?.Status, systemStatus: s?.SystemStatus?.Status,
    events: (s?.Events || []).map((e: any) => ({
      code: e.Code, description: e.Description,
      notAfter: e.NotAfter?.toISOString(), notBefore: e.NotBefore?.toISOString(),
    })),
  });
});

router.patch("/instances/:id", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  const attrs: any[] = [];
  if (body.instanceType) attrs.push({ Attribute: "instanceType" as const, Value: body.instanceType });
  if (body.sourceDestCheck !== undefined) attrs.push({ Attribute: "sourceDestCheck" as const, Value: String(body.sourceDestCheck) });
  if (body.ebsOptimized !== undefined) attrs.push({ Attribute: "ebsOptimized" as const, Value: String(body.ebsOptimized) });
  if (body.disableApiTermination !== undefined) attrs.push({ Attribute: "disableApiTermination" as const, Value: String(body.disableApiTermination) });
  for (const attr of attrs) {
    await ec2().send(new ModifyInstanceAttributeCommand({ InstanceId: id!, ...attr }));
  }
  return c.json({ id, modified: true });
});

// ──────────────────────────────────────────────
//  VPCs
// ──────────────────────────────────────────────

router.get("/vpcs", async (c: Context) => {
  const result = await ec2().send(new DescribeVpcsCommand({}));
  const vpcs = (result.Vpcs || []).map((v: any) => ({
    id: v.VpcId, state: v.State, cidrBlock: v.CidrBlock, isDefault: v.IsDefault,
    instanceTenancy: v.InstanceTenancy,
    cidrBlockAssociations: (v.CidrBlockAssociationSet || []).map((a: any) => ({
      id: a.AssociationId, cidrBlock: a.CidrBlock, state: a.CidrBlockState?.State,
    })),
    tags: (v.Tags || []).map((t: any) => ({ key: t.Key, value: t.Value })),
  }));
  return c.json({ vpcs, total: vpcs.length });
});

router.post("/vpcs", async (c: Context) => {
  const body = await c.req.json<any>();
  const result = await ec2().send(
    new CreateVpcCommand({
      CidrBlock: body.cidrBlock || "10.0.0.0/16",
      InstanceTenancy: body.instanceTenancy || "default",
    })
  );
  return c.json({ id: result.Vpc?.VpcId, cidrBlock: result.Vpc?.CidrBlock, created: true });
});

router.get("/vpcs/:id", async (c: Context) => {
  const id = c.req.param("id");
  const result = await ec2().send(new DescribeVpcsCommand({ VpcIds: [id!] }));
  const v = result.Vpcs?.[0];
  if (!v) return c.json({ error: "VPC not found" }, 404);
  return c.json({
    id: v.VpcId, state: v.State, cidrBlock: v.CidrBlock, isDefault: v.IsDefault,
    instanceTenancy: v.InstanceTenancy,
    tags: (v.Tags || []).map((t: any) => ({ key: t.Key, value: t.Value })),
  });
});

router.delete("/vpcs/:id", async (c: Context) => {
  const id = c.req.param("id");
  await ec2().send(new DeleteVpcCommand({ VpcId: id! }));
  return c.json({ id, deleted: true });
});

router.patch("/vpcs/:id", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  if (body.enableDnsSupport !== undefined) {
    await ec2().send(new ModifyVpcAttributeCommand({ VpcId: id!, EnableDnsSupport: { Value: body.enableDnsSupport } }));
  }
  if (body.enableDnsHostnames !== undefined) {
    await ec2().send(new ModifyVpcAttributeCommand({ VpcId: id!, EnableDnsHostnames: { Value: body.enableDnsHostnames } }));
  }
  return c.json({ id, modified: true });
});

router.post("/vpcs/:id/cidr", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  if (!body.cidrBlock) return c.json({ error: "CIDR block is required" }, 400);
  const result = await ec2().send(new AssociateVpcCidrBlockCommand({ VpcId: id!, CidrBlock: body.cidrBlock }));
  return c.json({ id, cidrBlock: body.cidrBlock, associationId: result.CidrBlockAssociation?.AssociationId, created: true });
});

router.delete("/vpcs/:id/cidr/:associationId", async (c: Context) => {
  const { id, associationId } = c.req.param();
  await ec2().send(new DisassociateVpcCidrBlockCommand({ AssociationId: associationId! }));
  return c.json({ id, associationId, disassociated: true });
});

router.get("/vpc-endpoints", async (c: Context) => {
  const result = await ec2().send(new DescribeVpcEndpointsCommand({}));
  const endpoints = (result.VpcEndpoints || []).map((e: any) => ({
    id: e.VpcEndpointId, vpcId: e.VpcId, serviceName: e.ServiceName,
    state: e.State, endpointType: e.VpcEndpointType, subnetIds: e.SubnetIds,
    tags: (e.Tags || []).map((t: any) => ({ key: t.Key, value: t.Value })),
  }));
  return c.json({ endpoints, total: endpoints.length });
});

router.post("/vpc-endpoints", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.vpcId || !body.serviceName) {
    return c.json({ error: "VpcId and ServiceName are required" }, 400);
  }
  const result = await ec2().send(
    new CreateVpcEndpointCommand({
      VpcId: body.vpcId, ServiceName: body.serviceName,
      VpcEndpointType: body.vpcEndpointType,
      SubnetIds: body.subnetIds, SecurityGroupIds: body.securityGroupIds,
    })
  );
  return c.json({ id: result.VpcEndpoint?.VpcEndpointId, created: true });
});

router.delete("/vpc-endpoints/:id", async (c: Context) => {
  const id = c.req.param("id");
  await ec2().send(new DeleteVpcEndpointsCommand({ VpcEndpointIds: [id!] }));
  return c.json({ id, deleted: true });
});

// ──────────────────────────────────────────────
//  SUBNETS
// ──────────────────────────────────────────────

router.get("/subnets", async (c: Context) => {
  const result = await ec2().send(new DescribeSubnetsCommand({}));
  const subnets = (result.Subnets || []).map((s: any) => ({
    id: s.SubnetId, vpcId: s.VpcId, cidrBlock: s.CidrBlock,
    availabilityZone: s.AvailabilityZone, state: s.State,
    availableIpCount: s.AvailableIpAddressCount,
    mapPublicIpOnLaunch: s.MapPublicIpOnLaunch, defaultForAz: s.DefaultForAz,
    tags: (s.Tags || []).map((t: any) => ({ key: t.Key, value: t.Value })),
  }));
  return c.json({ subnets, total: subnets.length });
});

router.post("/subnets", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.vpcId) return c.json({ error: "VpcId is required" }, 400);
  const result = await ec2().send(
    new CreateSubnetCommand({
      VpcId: body.vpcId,
      CidrBlock: body.cidrBlock || "10.0.1.0/24",
      AvailabilityZone: body.availabilityZone,
    })
  );
  return c.json({ id: result.Subnet?.SubnetId, cidrBlock: result.Subnet?.CidrBlock, created: true });
});

router.delete("/subnets/:id", async (c: Context) => {
  const id = c.req.param("id");
  await ec2().send(new DeleteSubnetCommand({ SubnetId: id! }));
  return c.json({ id, deleted: true });
});

router.patch("/subnets/:id", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  if (body.mapPublicIpOnLaunch !== undefined) {
    await ec2().send(new ModifySubnetAttributeCommand({ SubnetId: id!, MapPublicIpOnLaunch: { Value: body.mapPublicIpOnLaunch } }));
  }
  return c.json({ id, modified: true });
});

// ──────────────────────────────────────────────
//  SECURITY GROUPS
// ──────────────────────────────────────────────

router.get("/security-groups", async (c: Context) => {
  const result = await ec2().send(new DescribeSecurityGroupsCommand({}));
  const groups = (result.SecurityGroups || []).map((g: any) => ({
    id: g.GroupId, name: g.GroupName, description: g.Description,
    vpcId: g.VpcId, ownerId: g.OwnerId,
    inboundRules: (g.IpPermissions || []).map((rule: any) => ({
      ipProtocol: rule.IpProtocol, fromPort: rule.FromPort, toPort: rule.ToPort,
      cidrIpv4: rule.IpRanges?.map((r: any) => r.CidrIp),
      cidrIpv6: rule.Ipv6Ranges?.map((r: any) => r.CidrIpv6),
      securityGroupPairs: rule.UserIdGroupPairs?.map((p: any) => p.GroupId),
    })),
    outboundRules: (g.IpPermissionsEgress || []).map((rule: any) => ({
      ipProtocol: rule.IpProtocol, fromPort: rule.FromPort, toPort: rule.ToPort,
      cidrIpv4: rule.IpRanges?.map((r: any) => r.CidrIp),
      cidrIpv6: rule.Ipv6Ranges?.map((r: any) => r.CidrIpv6),
      securityGroupPairs: rule.UserIdGroupPairs?.map((p: any) => p.GroupId),
    })),
    tags: (g.Tags || []).map((t: any) => ({ key: t.Key, value: t.Value })),
  }));
  return c.json({ securityGroups: groups, total: groups.length });
});

router.post("/security-groups", async (c: Context) => {
  const body = await c.req.json<any>();
  const groupName = sanitizeName(body.groupName || "", 255);
  if (!groupName) return c.json({ error: "GroupName is required" }, 400);
  const result = await ec2().send(
    new CreateSecurityGroupCommand({
      GroupName: groupName,
      Description: sanitizeText(body.description || "", 255),
      VpcId: sanitizeName(body.vpcId || "", 255),
    })
  );
  return c.json({ id: result.GroupId, name: groupName, created: true });
});

router.delete("/security-groups/:id", async (c: Context) => {
  const id = c.req.param("id");
  await ec2().send(new DeleteSecurityGroupCommand({ GroupId: id! }));
  return c.json({ id, deleted: true });
});

router.post("/security-groups/:id/rules/ingress", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  const permissions: any = {
    IpProtocol: body.ipProtocol || "tcp",
    FromPort: body.fromPort ?? 22,
    ToPort: body.toPort ?? 22,
  };
  if (body.cidrIp) permissions.IpRanges = [{ CidrIp: body.cidrIp }];
  if (body.sourceSecurityGroupId) permissions.UserIdGroupPairs = [{ GroupId: body.sourceSecurityGroupId }];
  await ec2().send(new AuthorizeSecurityGroupIngressCommand({ GroupId: id!, IpPermissions: [permissions] }));
  return c.json({ id, ruleAdded: true });
});

router.delete("/security-groups/:id/rules/ingress", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  const permissions: any = { IpProtocol: body.ipProtocol || "tcp", FromPort: body.fromPort ?? 22, ToPort: body.toPort ?? 22 };
  if (body.cidrIp) permissions.IpRanges = [{ CidrIp: body.cidrIp }];
  await ec2().send(new RevokeSecurityGroupIngressCommand({ GroupId: id!, IpPermissions: [permissions] }));
  return c.json({ id, ruleRemoved: true });
});

router.post("/security-groups/:id/rules/egress", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  const permissions: any = { IpProtocol: body.ipProtocol || "-1", FromPort: body.fromPort, ToPort: body.toPort };
  if (body.cidrIp) permissions.IpRanges = [{ CidrIp: body.cidrIp }];
  await ec2().send(new AuthorizeSecurityGroupEgressCommand({ GroupId: id!, IpPermissions: [permissions] }));
  return c.json({ id, egressRuleAdded: true });
});

router.delete("/security-groups/:id/rules/egress", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  const permissions: any = { IpProtocol: body.ipProtocol || "-1", FromPort: body.fromPort, ToPort: body.toPort };
  if (body.cidrIp) permissions.IpRanges = [{ CidrIp: body.cidrIp }];
  await ec2().send(new RevokeSecurityGroupEgressCommand({ GroupId: id!, IpPermissions: [permissions] }));
  return c.json({ id, egressRuleRemoved: true });
});

// ──────────────────────────────────────────────
//  KEY PAIRS
// ──────────────────────────────────────────────

router.get("/key-pairs", async (c: Context) => {
  const result = await ec2().send(new DescribeKeyPairsCommand({}));
  const keys = (result.KeyPairs || []).map((k: any) => ({
    name: k.KeyName, fingerprint: k.KeyFingerprint, type: k.KeyType,
    tags: (k.Tags || []).map((t: any) => ({ key: t.Key, value: t.Value })),
  }));
  return c.json({ keyPairs: keys, total: keys.length });
});

router.post("/key-pairs", async (c: Context) => {
  const body = await c.req.json<any>();
  const keyName = sanitizeName(body.keyName || "", 255);
  if (!keyName) return c.json({ error: "KeyName is required" }, 400);
  const result = await ec2().send(
    new CreateKeyPairCommand({ KeyName: keyName, KeyType: body.keyType || "rsa" })
  );
  return c.json({ name: result.KeyName, fingerprint: result.KeyFingerprint, keyMaterial: result.KeyMaterial, created: true });
});

router.post("/key-pairs/import", async (c: Context) => {
  const body = await c.req.json<any>();
  const importKeyName = sanitizeName(body.keyName || "", 255);
  if (!importKeyName || !body.publicKeyMaterial) {
    return c.json({ error: "KeyName and PublicKeyMaterial are required" }, 400);
  }
  const result = await ec2().send(
    new ImportKeyPairCommand({
      KeyName: importKeyName,
      PublicKeyMaterial: Buffer.from(body.publicKeyMaterial),
    })
  );
  return c.json({ name: result.KeyName, fingerprint: result.KeyFingerprint, created: true });
});

router.delete("/key-pairs/:name", async (c: Context) => {
  const name = c.req.param("name");
  await ec2().send(new DeleteKeyPairCommand({ KeyName: name! }));
  return c.json({ name, deleted: true });
});

// ──────────────────────────────────────────────
//  AMIs
// ──────────────────────────────────────────────

router.get("/amis", async (c: Context) => {
  const result = await ec2().send(new DescribeImagesCommand({ Owners: ["self"] }));
  const images = (result.Images || []).map((img: any) => ({
    id: img.ImageId, name: img.Name, description: img.Description,
    architecture: img.Architecture, platform: img.Platform, state: img.State,
    imageType: img.ImageType, creationDate: img.CreationDate,
    rootDeviceType: img.RootDeviceType, virtualizationType: img.VirtualizationType,
    tags: (img.Tags || []).map((t: any) => ({ key: t.Key, value: t.Value })),
  }));
  return c.json({ images, total: images.length });
});

// ──────────────────────────────────────────────
//  TAGS
// ──────────────────────────────────────────────

router.get("/tags", async (c: Context) => {
  const result = await ec2().send(new DescribeTagsCommand({}));
  const tags = (result.Tags || []).map((t: any) => ({
    key: t.Key, value: t.Value, resourceType: t.ResourceType, resourceId: t.ResourceId,
  }));
  return c.json({ tags, total: tags.length });
});

router.post("/tags", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.resources || !body.tags) return c.json({ error: "Resources and tags are required" }, 400);
  await ec2().send(
    new CreateTagsCommand({
      Resources: body.resources,
      Tags: body.tags.map((t: any) => ({ Key: t.key, Value: t.value })),
    })
  );
  return c.json({ tagged: true });
});

router.delete("/tags", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.resources || !body.tags) return c.json({ error: "Resources and tags are required" }, 400);
  await ec2().send(
    new DeleteTagsCommand({
      Resources: body.resources,
      Tags: body.tags.map((t: any) => ({ Key: t.key })),
    })
  );
  return c.json({ untagged: true });
});

// ──────────────────────────────────────────────
//  INTERNET GATEWAYS
// ──────────────────────────────────────────────

router.get("/internet-gateways", async (c: Context) => {
  const result = await ec2().send(new DescribeInternetGatewaysCommand({}));
  const igws = (result.InternetGateways || []).map((igw: any) => ({
    id: igw.InternetGatewayId,
    attachments: (igw.Attachments || []).map((a: any) => ({ vpcId: a.VpcId, state: a.State })),
    tags: (igw.Tags || []).map((t: any) => ({ key: t.Key, value: t.Value })),
    ownerId: igw.OwnerId,
  }));
  return c.json({ internetGateways: igws, total: igws.length });
});

router.post("/internet-gateways", async (c: Context) => {
  const result = await ec2().send(new CreateInternetGatewayCommand({}));
  return c.json({ id: result.InternetGateway?.InternetGatewayId, created: true });
});

router.delete("/internet-gateways/:id", async (c: Context) => {
  const id = c.req.param("id");
  await ec2().send(new DeleteInternetGatewayCommand({ InternetGatewayId: id! }));
  return c.json({ id, deleted: true });
});

router.post("/internet-gateways/:id/attach", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  if (!body.vpcId) return c.json({ error: "VpcId is required" }, 400);
  await ec2().send(new AttachInternetGatewayCommand({ InternetGatewayId: id!, VpcId: body.vpcId }));
  return c.json({ id, vpcId: body.vpcId, attached: true });
});

router.post("/internet-gateways/:id/detach", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  if (!body.vpcId) return c.json({ error: "VpcId is required" }, 400);
  await ec2().send(new DetachInternetGatewayCommand({ InternetGatewayId: id!, VpcId: body.vpcId }));
  return c.json({ id, vpcId: body.vpcId, detached: true });
});

// ──────────────────────────────────────────────
//  ROUTE TABLES
// ──────────────────────────────────────────────

router.get("/route-tables", async (c: Context) => {
  const result = await ec2().send(new DescribeRouteTablesCommand({}));
  const rts = (result.RouteTables || []).map((rt: any) => ({
    id: rt.RouteTableId, vpcId: rt.VpcId,
    associations: (rt.Associations || []).map((a: any) => ({
      id: a.RouteTableAssociationId, subnetId: a.SubnetId, main: a.Main, state: a.AssociationState?.State,
    })),
    routes: (rt.Routes || []).map((r: any) => ({
      destinationCidrBlock: r.DestinationCidrBlock, gatewayId: r.GatewayId,
      natGatewayId: r.NatGatewayId, state: r.State, origin: r.Origin,
    })),
    tags: (rt.Tags || []).map((t: any) => ({ key: t.Key, value: t.Value })),
  }));
  return c.json({ routeTables: rts, total: rts.length });
});

router.post("/route-tables", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.vpcId) return c.json({ error: "VpcId is required" }, 400);
  const result = await ec2().send(new CreateRouteTableCommand({ VpcId: body.vpcId }));
  return c.json({ id: result.RouteTable?.RouteTableId, vpcId: body.vpcId, created: true });
});

router.delete("/route-tables/:id", async (c: Context) => {
  const id = c.req.param("id");
  await ec2().send(new DeleteRouteTableCommand({ RouteTableId: id! }));
  return c.json({ id, deleted: true });
});

router.post("/route-tables/:id/associate", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  if (!body.subnetId) return c.json({ error: "SubnetId is required" }, 400);
  const result = await ec2().send(new AssociateRouteTableCommand({ RouteTableId: id!, SubnetId: body.subnetId }));
  return c.json({ id, subnetId: body.subnetId, associationId: result.AssociationId, associated: true });
});

router.post("/route-tables/:id/disassociate", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  if (!body.associationId) return c.json({ error: "AssociationId is required" }, 400);
  await ec2().send(new DisassociateRouteTableCommand({ AssociationId: body.associationId }));
  return c.json({ id, associationId: body.associationId, disassociated: true });
});

router.post("/route-tables/:id/routes", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  await ec2().send(
    new CreateRouteCommand({
      RouteTableId: id!,
      DestinationCidrBlock: body.destinationCidrBlock || "0.0.0.0/0",
      GatewayId: body.gatewayId,
      NatGatewayId: body.natGatewayId,
    })
  );
  return c.json({ routeTableId: id, created: true });
});

router.delete("/route-tables/:id/routes", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  if (!body.destinationCidrBlock) return c.json({ error: "DestinationCidrBlock is required" }, 400);
  await ec2().send(new DeleteRouteCommand({ RouteTableId: id!, DestinationCidrBlock: body.destinationCidrBlock }));
  return c.json({ routeTableId: id, deleted: true });
});

// ──────────────────────────────────────────────
//  NAT GATEWAYS
// ──────────────────────────────────────────────

router.get("/nat-gateways", async (c: Context) => {
  const result = await ec2().send(new DescribeNatGatewaysCommand({}));
  const natGateways = (result.NatGateways || []).map((ngw: any) => ({
    id: ngw.NatGatewayId, subnetId: ngw.SubnetId, vpcId: ngw.VpcId, state: ngw.State,
    natGatewayAddresses: (ngw.NatGatewayAddresses || []).map((a: any) => ({
      publicIp: a.PublicIp, privateIp: a.PrivateIp, allocationId: a.AllocationId,
    })),
    createdAt: ngw.CreateTime?.toISOString(),
    tags: (ngw.Tags || []).map((t: any) => ({ key: t.Key, value: t.Value })),
  }));
  return c.json({ natGateways, total: natGateways.length });
});

router.post("/nat-gateways", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.subnetId || !body.allocationId) return c.json({ error: "SubnetId and AllocationId are required" }, 400);
  const result = await ec2().send(new CreateNatGatewayCommand({ SubnetId: body.subnetId, AllocationId: body.allocationId }));
  return c.json({ id: result.NatGateway?.NatGatewayId, created: true });
});

router.delete("/nat-gateways/:id", async (c: Context) => {
  const id = c.req.param("id");
  await ec2().send(new DeleteNatGatewayCommand({ NatGatewayId: id! }));
  return c.json({ id, deleted: true });
});

// ──────────────────────────────────────────────
//  ELASTIC IPs
// ──────────────────────────────────────────────

router.get("/elastic-ips", async (c: Context) => {
  const result = await ec2().send(new DescribeAddressesCommand({}));
  const addresses = (result.Addresses || []).map((a: any) => ({
    allocationId: a.AllocationId, publicIp: a.PublicIp, privateIp: a.PrivateIpAddress,
    associationId: a.AssociationId, instanceId: a.InstanceId, domain: a.Domain,
    tags: (a.Tags || []).map((t: any) => ({ key: t.Key, value: t.Value })),
  }));
  return c.json({ addresses, total: addresses.length });
});

router.post("/elastic-ips", async (c: Context) => {
  const body = await c.req.json<any>();
  const result = await ec2().send(new AllocateAddressCommand({ Domain: body.domain || "vpc" }));
  return c.json({ allocationId: result.AllocationId, publicIp: result.PublicIp, domain: result.Domain, created: true });
});

router.delete("/elastic-ips/:allocationId", async (c: Context) => {
  const allocationId = c.req.param("allocationId");
  await ec2().send(new ReleaseAddressCommand({ AllocationId: allocationId! }));
  return c.json({ allocationId, released: true });
});

router.post("/elastic-ips/:allocationId/associate", async (c: Context) => {
  const allocationId = c.req.param("allocationId");
  const body = await c.req.json<any>();
  if (!body.instanceId) return c.json({ error: "InstanceId is required" }, 400);
  const result = await ec2().send(new AssociateAddressCommand({ AllocationId: allocationId!, InstanceId: body.instanceId }));
  return c.json({ allocationId, instanceId: body.instanceId, associationId: result.AssociationId, associated: true });
});

router.post("/elastic-ips/:allocationId/disassociate", async (c: Context) => {
  const allocationId = c.req.param("allocationId");
  const body = await c.req.json<any>();
  if (!body.associationId) return c.json({ error: "AssociationId is required" }, 400);
  await ec2().send(new DisassociateAddressCommand({ AssociationId: body.associationId }));
  return c.json({ allocationId, associationId: body.associationId, disassociated: true });
});

// ──────────────────────────────────────────────
//  REGIONS & AZS
// ──────────────────────────────────────────────

router.get("/regions", async (c: Context) => {
  const result = await ec2().send(new DescribeRegionsCommand({}));
  const regions = (result.Regions || []).map((r: any) => ({
    name: r.RegionName, endpoint: r.Endpoint, optInStatus: r.OptInStatus,
  }));
  return c.json({ regions, total: regions.length });
});

router.get("/availability-zones", async (c: Context) => {
  const result = await ec2().send(new DescribeAvailabilityZonesCommand({}));
  const zones = (result.AvailabilityZones || []).map((az: any) => ({
    name: az.ZoneName, id: az.ZoneId, state: az.State, region: az.RegionName,
    messages: (az.Messages || []).map((m: any) => m.Message),
  }));
  return c.json({ availabilityZones: zones, total: zones.length });
});

router.get("/account-attributes", async (c: Context) => {
  const result = await ec2().send(new DescribeAccountAttributesCommand({}));
  const attrs = (result.AccountAttributes || []).map((a: any) => ({
    name: a.AttributeName,
    values: (a.AttributeValues || []).map((v: any) => v.AttributeValue),
  }));
  return c.json({ accountAttributes: attrs });
});

// ──────────────────────────────────────────────
//  INSTANCE TYPES
// ──────────────────────────────────────────────

router.get("/instance-types", async (c: Context) => {
  const result = await ec2().send(new DescribeInstanceTypesCommand({}));
  const types = (result.InstanceTypes || []).map((t: any) => ({
    type: t.InstanceType,
    currentGeneration: t.CurrentGeneration,
    vCpus: t.VCpuInfo?.DefaultVCpus,
    memoryMb: t.MemoryInfo?.SizeInMiB,
    storageGb: t.InstanceStorageInfo?.TotalSizeInGB,
    networkPerformance: t.NetworkInfo?.NetworkPerformance,
    maxNetworkInterfaces: t.NetworkInfo?.MaximumNetworkInterfaces,
    ipv6Supported: t.NetworkInfo?.Ipv6Supported,
    ebsOptimizedSupported: t.EbsInfo?.EbsOptimizedSupport === "supported",
    supportedArchitectures: t.ProcessorInfo?.SupportedArchitectures,
    supportedUsageClasses: t.SupportedUsageClasses,
  }));
  return c.json({ instanceTypes: types, total: types.length });
});

// ──────────────────────────────────────────────
//  LAUNCH TEMPLATES
// ──────────────────────────────────────────────

router.get("/launch-templates", async (c: Context) => {
  const result = await ec2().send(new DescribeLaunchTemplatesCommand({}));
  const templates = (result.LaunchTemplates || []).map((lt: any) => ({
    id: lt.LaunchTemplateId, name: lt.LaunchTemplateName,
    defaultVersion: lt.DefaultVersionNumber, latestVersion: lt.LatestVersionNumber,
    createdBy: lt.CreatedBy, createdAt: lt.CreateTime?.toISOString(),
    tags: (lt.Tags || []).map((t: any) => ({ key: t.Key, value: t.Value })),
  }));
  return c.json({ launchTemplates: templates, total: templates.length });
});

router.post("/launch-templates", async (c: Context) => {
  const body = await c.req.json<any>();
  const ltName = sanitizeName(body.launchTemplateName || "", 128);
  if (!ltName) return c.json({ error: "LaunchTemplateName is required" }, 400);
  const result = await ec2().send(
    new CreateLaunchTemplateCommand({
      LaunchTemplateName: ltName,
      LaunchTemplateData: {
        ImageId: sanitizeName(body.imageId || "ami-0abcdef1234567891", 256),
        InstanceType: body.instanceType || "t3.micro",
        KeyName: sanitizeName(body.keyName || "", 255),
        SecurityGroupIds: body.securityGroupIds,
      },
    })
  );
  return c.json({ id: result.LaunchTemplate?.LaunchTemplateId, name: ltName, created: true });
});

router.delete("/launch-templates/:id", async (c: Context) => {
  const id = c.req.param("id");
  await ec2().send(new DeleteLaunchTemplateCommand({ LaunchTemplateId: id! }));
  return c.json({ id, deleted: true });
});

router.get("/launch-templates/:id", async (c: Context) => {
  const id = c.req.param("id");
  const result = await ec2().send(new DescribeLaunchTemplatesCommand({ LaunchTemplateIds: [id!] }));
  const lt = result.LaunchTemplates?.[0];
  if (!lt) return c.json({ error: "Launch template not found" }, 404);
  return c.json({
    id: lt.LaunchTemplateId, name: lt.LaunchTemplateName,
    defaultVersion: lt.DefaultVersionNumber, latestVersion: lt.LatestVersionNumber,
    createdBy: lt.CreatedBy, createdAt: lt.CreateTime?.toISOString(),
    tags: (lt.Tags || []).map((t: any) => ({ key: t.Key, value: t.Value })),
  });
});

router.get("/launch-templates/:id/versions", async (c: Context) => {
  const id = c.req.param("id");
  const result = await ec2().send(new DescribeLaunchTemplateVersionsCommand({ LaunchTemplateId: id! }));
  const versions = (result.LaunchTemplateVersions || []).map((v: any) => ({
    version: v.VersionNumber, description: v.VersionDescription,
    imageId: v.LaunchTemplateData?.ImageId, instanceType: v.LaunchTemplateData?.InstanceType,
    keyName: v.LaunchTemplateData?.KeyName,
    securityGroupIds: v.LaunchTemplateData?.SecurityGroupIds,
    createdBy: v.CreatedBy, createdAt: v.CreateTime?.toISOString(),
    defaultVersion: v.DefaultVersion,
  }));
  return c.json({ templateId: id, versions, total: versions.length });
});

router.post("/launch-templates/:id/versions", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  const result = await ec2().send(
    new CreateLaunchTemplateVersionCommand({
      LaunchTemplateId: id!,
      LaunchTemplateData: {
        ImageId: body.imageId,
        InstanceType: body.instanceType,
        KeyName: body.keyName,
        SecurityGroupIds: body.securityGroupIds,
      },
    })
  );
  return c.json({ version: result.LaunchTemplateVersion?.VersionNumber, created: true });
});

router.patch("/launch-templates/:id", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  if (body.defaultVersion) {
    await ec2().send(new ModifyLaunchTemplateCommand({ LaunchTemplateId: id!, DefaultVersion: body.defaultVersion }));
  }
  return c.json({ id, modified: true });
});

// ──────────────────────────────────────────────
//  VOLUMES
// ──────────────────────────────────────────────

router.get("/volumes", async (c: Context) => {
  const result = await ec2().send(new DescribeVolumesCommand({}));
  const volumes = (result.Volumes || []).map((v: any) => ({
    id: v.VolumeId, size: v.Size, volumeType: v.VolumeType, state: v.State,
    availabilityZone: v.AvailabilityZone, iops: v.Iops, throughput: v.Throughput,
    encrypted: v.Encrypted, snapshotId: v.SnapshotId, multiAttachEnabled: v.MultiAttachEnabled,
    attachments: (v.Attachments || []).map((a: any) => ({
      instanceId: a.InstanceId, device: a.Device, state: a.State, attachedTime: a.AttachTime?.toISOString(),
    })),
    createdAt: v.CreateTime?.toISOString(),
    tags: (v.Tags || []).map((t: any) => ({ key: t.Key, value: t.Value })),
  }));
  return c.json({ volumes, total: volumes.length });
});

router.post("/volumes", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.availabilityZone) return c.json({ error: "AvailabilityZone is required" }, 400);
  const result = await ec2().send(
    new CreateVolumeCommand({
      AvailabilityZone: body.availabilityZone,
      Size: body.size ?? 8,
      VolumeType: body.volumeType || "gp2",
      Iops: body.iops,
      Encrypted: body.encrypted,
      SnapshotId: body.snapshotId,
    })
  );
  return c.json({ id: result.VolumeId, created: true });
});

router.delete("/volumes/:id", async (c: Context) => {
  const id = c.req.param("id");
  await ec2().send(new DeleteVolumeCommand({ VolumeId: id! }));
  return c.json({ id, deleted: true });
});

// ──────────────────────────────────────────────
//  NETWORK INTERFACES
// ──────────────────────────────────────────────

router.get("/network-interfaces", async (c: Context) => {
  const result = await ec2().send(new DescribeNetworkInterfacesCommand({}));
  const interfaces = (result.NetworkInterfaces || []).map((ni: any) => ({
    id: ni.NetworkInterfaceId, vpcId: ni.VpcId, subnetId: ni.SubnetId,
    description: ni.Description, privateIp: ni.PrivateIpAddress,
    macAddress: ni.MacAddress, status: ni.Status,
    instanceId: ni.Attachment?.InstanceId,
    securityGroups: (ni.Groups || []).map((g: any) => ({ id: g.GroupId, name: g.GroupName })),
    tagSet: (ni.TagSet || []).map((t: any) => ({ key: t.Key, value: t.Value })),
  }));
  return c.json({ networkInterfaces: interfaces, total: interfaces.length });
});


// ── Prefix Lists ───────────────────────────────────────

router.get("/prefix-lists", async (c: Context) => {
  const client = ec2();
  const result = await client.send(new DescribePrefixListsCommand({}));
  const prefixLists = (result.PrefixLists || []).map((pl: any) => ({
    id: pl.PrefixListId,
    name: pl.PrefixListName,
    ownerId: pl.OwnerId || "-",
    version: pl.Version ?? "-",
    entries: pl.MaxEntries ?? "-",
    cidrs: (pl.Cidrs || []).join(", ") || "-",
  }));
  return c.json({ prefixLists, total: prefixLists.length });
});

// ── Spot Instances ─────────────────────────────────────

router.post("/spot-requests", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.instanceCount) return c.json({ error: "instanceCount is required" }, 400);
  if (!body.spotPrice) return c.json({ error: "spotPrice is required" }, 400);
  const client = ec2();
  const result = await client.send(
    new RequestSpotInstancesCommand({
      InstanceCount: body.instanceCount,
      SpotPrice: String(body.spotPrice),
      LaunchSpecification: body.launchSpecification,
    })
  );
  const requests = (result.SpotInstanceRequests || []).map((r: any) => ({
    id: r.SpotInstanceRequestId,
    state: r.State,
    status: r.Status?.Code || "-",
    price: r.SpotPrice || "-",
    instanceId: r.InstanceId || "-",
  }));
  return c.json({ spotInstanceRequests: requests, total: requests.length }, 201);
});

router.get("/spot-requests", async (c: Context) => {
  const client = ec2();
  const result = await client.send(new DescribeSpotInstanceRequestsCommand({}));
  const requests = (result.SpotInstanceRequests || []).map((r: any) => ({
    id: r.SpotInstanceRequestId,
    state: r.State,
    status: r.Status?.Code || "-",
    price: r.SpotPrice || "-",
    instanceId: r.InstanceId || "-",
    type: r.Type || "-",
    createTime: r.CreateTime ? new Date(r.CreateTime).toLocaleString() : "-",
  }));
  return c.json({ spotInstanceRequests: requests, total: requests.length });
});

router.delete("/spot-requests", async (c: Context) => {
  const body = await c.req.json<{ spotInstanceRequestIds?: string[] }>();
  if (!body.spotInstanceRequestIds?.length)
    return c.json({ error: "spotInstanceRequestIds is required" }, 400);
  const client = ec2();
  await client.send(
    new CancelSpotInstanceRequestsCommand({ SpotInstanceRequestIds: body.spotInstanceRequestIds })
  );
  return c.json({ cancelled: true });
});

// ── Security Group Rules ───────────────────────────────

router.get("/security-group-rules", async (c: Context) => {
  const groupId = c.req.query("groupId");
  const client = ec2();
  const result = await client.send(
    new DescribeSecurityGroupRulesCommand(groupId ? { Filters: [{ Name: "group-id", Values: [groupId] }] } : {})
  );
  const rules = (result.SecurityGroupRules || []).map((r: any) => ({
    id: r.SecurityGroupRuleId,
    groupId: r.GroupId,
    type: r.IsEgress ? "egress" : "ingress",
    protocol: r.IpProtocol || "-",
    fromPort: r.FromPort ?? "-",
    toPort: r.ToPort ?? "-",
    cidr: r.CidrIpv4 || r.CidrIpv6 || "-",
    description: r.Description || "-",
  }));
  return c.json({ rules, total: rules.length });
});

router.put("/security-group-rules/:ruleId", async (c: Context) => {
  const ruleId = c.req.param("ruleId")!;
  const body = await c.req.json<any>();
  if (!body.groupId) return c.json({ error: "groupId is required" }, 400);
  const client = ec2();
  const result = await client.send(
    new ModifySecurityGroupRulesCommand({
      GroupId: body.groupId,
      SecurityGroupRules: [
        {
          SecurityGroupRuleId: ruleId,
          SecurityGroupRule: {
            IpProtocol: body.protocol,
            FromPort: body.fromPort,
            ToPort: body.toPort,
            CidrIpv4: body.cidr,
            Description: body.description,
          },
        },
      ],
    })
  );
  return c.json({ returned: result.Return || false });
});

router.post("/security-groups/:groupId/rule-descriptions", async (c: Context) => {
  const groupId = c.req.param("groupId")!;
  const body = await c.req.json<any>();
  if (!body.description) return c.json({ error: "description is required" }, 400);
  const client = ec2();
  await client.send(
    new UpdateSecurityGroupRuleDescriptionsIngressCommand({
      GroupId: groupId,
      IpPermissions: body.ipPermissions,
    })
  );
  return c.json({ updated: true });
});


// ── P1 gap audit — Transit Gateway family ─────────────────

router.post("/transit-gateways", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.description && !body.options) {
    // description optional per AWS; require at least a name-ish signal is not
    // mandated by the API, so accept empty body
  }
  const client = ec2();
  const result = await client.send(new CreateTransitGatewayCommand({
    Description: body.description || undefined,
    Options: body.options,
    TagSpecifications: body.tagSpecifications,
  }));
  return c.json({ transitGateway: result.TransitGateway ?? null }, 201);
});

router.get("/transit-gateways", async (c: Context) => {
  const client = ec2();
  const result = await client.send(new DescribeTransitGatewaysCommand({
    TransitGatewayIds: c.req.query("ids") ? c.req.query("ids")!.split(",") : undefined,
  }));
  const transitGateways = (result.TransitGateways || []).map((tg: any) => ({
    id: tg.TransitGatewayId,
    state: tg.State,
    ownerId: tg.OwnerId,
    description: tg.Description ?? null,
    options: tg.Options ?? null,
  }));
  return c.json({ transitGateways, total: transitGateways.length });
});

router.put("/transit-gateways/:id", async (c: Context) => {
  const body = await c.req.json<any>();
  const client = ec2();
  const result = await client.send(new ModifyTransitGatewayCommand({
    TransitGatewayId: c.req.param("id")!,
    Description: body.description,
    Options: body.options,
  }));
  return c.json({ transitGateway: result.TransitGateway ?? null });
});

router.delete("/transit-gateways/:id", async (c: Context) => {
  const client = ec2();
  const result = await client.send(new DeleteTransitGatewayCommand({ TransitGatewayId: c.req.param("id")! }));
  return c.json({ transitGateway: result.TransitGateway ?? null, deleted: true });
});

router.get("/transit-gateway-attachments", async (c: Context) => {
  const client = ec2();
  const result = await client.send(new DescribeTransitGatewayAttachmentsCommand({}));
  const attachments = (result.TransitGatewayAttachments || []).map((a: any) => ({
    id: a.TransitGatewayAttachmentId,
    transitGatewayId: a.TransitGatewayId,
    resourceType: a.ResourceType,
    resourceId: a.ResourceId,
    state: a.State,
  }));
  return c.json({ attachments, total: attachments.length });
});

router.post("/transit-gateways/:tgwId/vpc-attachments", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.vpcId || !body.subnetIds?.length) {
    return c.json({ error: "vpcId and subnetIds are required" }, 400);
  }
  const client = ec2();
  const result = await client.send(new CreateTransitGatewayVpcAttachmentCommand({
    TransitGatewayId: c.req.param("tgwId")!,
    VpcId: body.vpcId,
    SubnetIds: body.subnetIds,
    Options: body.options,
  }));
  return c.json({ attachment: result.TransitGatewayVpcAttachment ?? null }, 201);
});

router.get("/transit-gateways/vpc-attachments", async (c: Context) => {
  const client = ec2();
  const result = await client.send(new DescribeTransitGatewayVpcAttachmentsCommand({}));
  const attachments = (result.TransitGatewayVpcAttachments || []).map((a: any) => ({
    id: a.TransitGatewayAttachmentId,
    transitGatewayId: a.TransitGatewayId,
    vpcId: a.VpcId,
    vpcOwnerId: a.VpcOwnerId,
    state: a.State,
    subnetIds: a.SubnetIds,
  }));
  return c.json({ attachments, total: attachments.length });
});

router.put("/transit-gateways/vpc-attachments/:id", async (c: Context) => {
  const body = await c.req.json<any>();
  const client = ec2();
  const result = await client.send(new ModifyTransitGatewayVpcAttachmentCommand({
    TransitGatewayAttachmentId: c.req.param("id")!,
    AddSubnetIds: body.addSubnetIds,
    RemoveSubnetIds: body.removeSubnetIds,
    Options: body.options,
  }));
  return c.json({ attachment: result.TransitGatewayVpcAttachment ?? null });
});

router.delete("/transit-gateways/vpc-attachments/:id", async (c: Context) => {
  const client = ec2();
  const result = await client.send(new DeleteTransitGatewayVpcAttachmentCommand({
    TransitGatewayAttachmentId: c.req.param("id")!,
  }));
  return c.json({ attachment: result.TransitGatewayVpcAttachment ?? null, deleted: true });
});

// ── TGW route tables ──────────────────────────────────────

router.post("/transit-gateway-route-tables", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.transitGatewayId) return c.json({ error: "transitGatewayId is required" }, 400);
  const client = ec2();
  const result = await client.send(new CreateTransitGatewayRouteTableCommand({
    TransitGatewayId: body.transitGatewayId,
    TagSpecifications: body.tagSpecifications,
  }));
  return c.json({ routeTable: result.TransitGatewayRouteTable ?? null }, 201);
});

router.get("/transit-gateway-route-tables", async (c: Context) => {
  const client = ec2();
  const result = await client.send(new DescribeTransitGatewayRouteTablesCommand({
    TransitGatewayRouteTableIds: c.req.query("ids") ? c.req.query("ids")!.split(",") : undefined,
  }));
  const routeTables = (result.TransitGatewayRouteTables || []).map((rt: any) => ({
    id: rt.TransitGatewayRouteTableId,
    transitGatewayId: rt.TransitGatewayId,
    state: rt.State,
    defaultAssociationRouteTable: rt.DefaultAssociationRouteTable,
    defaultPropagationRouteTable: rt.DefaultPropagationRouteTable,
  }));
  return c.json({ routeTables, total: routeTables.length });
});

router.delete("/transit-gateway-route-tables/:id", async (c: Context) => {
  const client = ec2();
  await client.send(new DeleteTransitGatewayRouteTableCommand({ TransitGatewayRouteTableId: c.req.param("id")! }));
  return c.json({ deleted: true });
});

router.post("/transit-gateway-route-tables/:id/associate", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.attachmentId) return c.json({ error: "attachmentId is required" }, 400);
  const client = ec2();
  const result = await client.send(new AssociateTransitGatewayRouteTableCommand({
    TransitGatewayRouteTableId: c.req.param("id")!,
    TransitGatewayAttachmentId: body.attachmentId,
  }));
  return c.json({ association: result.Association ?? null });
});

router.post("/transit-gateway-route-tables/:id/disassociate", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.attachmentId) return c.json({ error: "attachmentId is required" }, 400);
  const client = ec2();
  const result = await client.send(new DisassociateTransitGatewayRouteTableCommand({
    TransitGatewayRouteTableId: c.req.param("id")!,
    TransitGatewayAttachmentId: body.attachmentId,
  }));
  return c.json({ association: result.Association ?? null });
});

router.get("/transit-gateway-route-tables/:id/associations", async (c: Context) => {
  const client = ec2();
  const result = await client.send(new GetTransitGatewayRouteTableAssociationsCommand({
    TransitGatewayRouteTableId: c.req.param("id")!,
  }));
  const associations = (result.Associations || []).map((a: any) => ({
    attachmentId: a.TransitGatewayAttachmentId,
    resourceId: a.ResourceId,
    resourceType: a.ResourceType,
    state: a.State,
  }));
  return c.json({ associations, total: associations.length });
});

router.get("/transit-gateway-route-tables/:id/propagations", async (c: Context) => {
  const client = ec2();
  const result = await client.send(new GetTransitGatewayRouteTablePropagationsCommand({
    TransitGatewayRouteTableId: c.req.param("id")!,
  }));
  const propagations = (result.TransitGatewayRouteTablePropagations || []).map((p: any) => ({
    attachmentId: p.TransitGatewayAttachmentId,
    resourceId: p.ResourceId,
    resourceType: p.ResourceType,
    state: p.State,
  }));
  return c.json({ propagations, total: propagations.length });
});

router.post("/transit-gateway-route-tables/:id/enable-propagation", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.attachmentId) return c.json({ error: "attachmentId is required" }, 400);
  const client = ec2();
  await client.send(new EnableTransitGatewayRouteTablePropagationCommand({
    TransitGatewayRouteTableId: c.req.param("id")!,
    TransitGatewayAttachmentId: body.attachmentId,
  }));
  return c.json({ enabled: true });
});

router.post("/transit-gateway-route-tables/:id/disable-propagation", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.attachmentId) return c.json({ error: "attachmentId is required" }, 400);
  const client = ec2();
  await client.send(new DisableTransitGatewayRouteTablePropagationCommand({
    TransitGatewayRouteTableId: c.req.param("id")!,
    TransitGatewayAttachmentId: body.attachmentId,
  }));
  return c.json({ disabled: true });
});

// ── TGW static routes ─────────────────────────────────────

router.post("/transit-gateway-route-tables/:id/routes", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.destinationCidrBlock) return c.json({ error: "destinationCidrBlock is required" }, 400);
  const client = ec2();
  const result = await client.send(new CreateTransitGatewayRouteCommand({
    TransitGatewayRouteTableId: c.req.param("id")!,
    DestinationCidrBlock: body.destinationCidrBlock,
    TransitGatewayAttachmentId: body.attachmentId,
    Blackhole: body.blackhole,
  }));
  return c.json({ route: result.Route ?? null }, 201);
});

router.delete("/transit-gateway-route-tables/:id/routes/:cidr", async (c: Context) => {
  const client = ec2();
  const result = await client.send(new DeleteTransitGatewayRouteCommand({
    TransitGatewayRouteTableId: c.req.param("id")!,
    DestinationCidrBlock: decodeURIComponent(c.req.param("cidr")!),
  }));
  return c.json({ route: result.Route ?? null, deleted: true });
});

router.post("/transit-gateway-route-tables/:id/routes/search", async (c: Context) => {
  const body = await c.req.json<any>();
  const client = ec2();
  const result = await client.send(new SearchTransitGatewayRoutesCommand({
    TransitGatewayRouteTableId: c.req.param("id")!,
    Filters: body.filters,
    MaxResults: body.maxResults,
  }));
  return c.json({
    routes: result.Routes || [],
    total: (result.Routes || []).length,
  });
});

// ── Managed prefix lists ──────────────────────────────────

router.post("/managed-prefix-lists", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  if (!body.addressFamily) return c.json({ error: "addressFamily is required" }, 400);
  if (!body.entries?.length) return c.json({ error: "at least one entry is required" }, 400);
  const client = ec2();
  const result = await client.send(new CreateManagedPrefixListCommand({
    PrefixListName: body.name,
    AddressFamily: body.addressFamily,
    MaxEntries: body.maxEntries,
    Entries: body.entries,
    TagSpecifications: body.tagSpecifications,
  }));
  return c.json({ prefixList: result.PrefixList ?? null }, 201);
});

router.get("/managed-prefix-lists", async (c: Context) => {
  const client = ec2();
  const result = await client.send(new DescribeManagedPrefixListsCommand({
    PrefixListIds: c.req.query("ids") ? c.req.query("ids")!.split(",") : undefined,
  }));
  const prefixLists = (result.PrefixLists || []).map((pl: any) => ({
    id: pl.PrefixListId,
    name: pl.PrefixListName,
    addressFamily: pl.AddressFamily,
    state: pl.State,
    maxEntries: pl.MaxEntries,
    version: pl.Version,
    ownerId: pl.OwnerId,
  }));
  return c.json({ prefixLists, total: prefixLists.length });
});

router.get("/managed-prefix-lists/:id/entries", async (c: Context) => {
  const client = ec2();
  const result = await client.send(new GetManagedPrefixListEntriesCommand({
    PrefixListId: c.req.param("id")!,
  }));
  const entries = (result.Entries || []).map((e: any) => ({
    cidr: e.Cidr,
    description: e.Description ?? null,
  }));
  return c.json({ entries, total: entries.length });
});

router.put("/managed-prefix-lists/:id", async (c: Context) => {
  const body = await c.req.json<any>();
  const client = ec2();
  const result = await client.send(new ModifyManagedPrefixListCommand({
    PrefixListId: c.req.param("id")!,
    CurrentVersion: body.currentVersion,
    PrefixListName: body.name,
    AddEntries: body.addEntries,
    RemoveEntries: body.removeEntries,
  }));
  return c.json({ prefixList: result.PrefixList ?? null });
});

router.delete("/managed-prefix-lists/:id", async (c: Context) => {
  const client = ec2();
  const result = await client.send(new DeleteManagedPrefixListCommand({ PrefixListId: c.req.param("id")! }));
  return c.json({ prefixList: result.PrefixList ?? null, deleted: true });
});


// ── P1 gap audit — misc ops ───────────────────────────────

router.get("/instances/:id/attributes", async (c: Context) => {
  const client = ec2();
  const result = await client.send(new DescribeInstanceAttributeCommand({
    InstanceId: c.req.param("id")!,
    Attribute: (c.req.query("attribute") as any) || "instanceType",
  }));
  return c.json({ instanceId: result.InstanceId ?? null, attribute: result });
});

router.get("/vpcs/:id/attributes", async (c: Context) => {
  const client = ec2();
  const result = await client.send(new DescribeVpcAttributeCommand({
    VpcId: c.req.param("id")!,
    Attribute: (c.req.query("attribute") as any) || "enableDnsHostnames",
  }));
  return c.json({ vpcId: result.VpcId ?? null });
});

router.get("/vpc-endpoint-services", async (c: Context) => {
  const client = ec2();
  const result = await client.send(new DescribeVpcEndpointServicesCommand({}));
  return c.json({
    serviceNames: (result.ServiceNames || []),
    serviceDetails: result.ServiceDetails || [],
    total: (result.ServiceNames || []).length,
  });
});

router.post("/default-vpc", async (c: Context) => {
  const client = ec2();
  const result = await client.send(new CreateDefaultVpcCommand({}));
  return c.json({ vpc: result.Vpc ?? null }, 201);
});

router.get("/security-groups-for-vpc", async (c: Context) => {
  const client = ec2();
  const result: any = await client.send(new GetSecurityGroupsForVpcCommand({} as any));
  return c.json({
    securityGroups: (result.SecurityGroups || []).map((sg: any) => ({
      id: sg.GroupId, name: sg.GroupName, description: sg.GroupDescription,
    })),
    total: (result.SecurityGroups || []).length,
  });
});

router.put("/security-groups/:id/egress-descriptions", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.ipPermissions) return c.json({ error: "ipPermissions is required" }, 400);
  const client = ec2();
  const result = await client.send(new UpdateSecurityGroupRuleDescriptionsEgressCommand({
    GroupId: c.req.param("id")!,
    IpPermissions: body.ipPermissions,
  }));
  return c.json({ success: result.Return ?? false });
});

router.get("/instance-type-offerings", async (c: Context) => {
  const client = ec2();
  const result = await client.send(new DescribeInstanceTypeOfferingsCommand({
    LocationType: (c.req.query("locationType") as any) || "region",
    MaxResults: c.req.query("maxResults") ? parseInt(c.req.query("maxResults")!) : undefined,
  }));
  const offerings = (result.InstanceTypeOfferings || []).map((o: any) => ({
    type: o.InstanceType, region: o.Region, zone: o.AvailabilityZone ?? null,
  }));
  return c.json({ offerings, total: offerings.length });
});

router.get("/iam-instance-profile-associations", async (c: Context) => {
  const client = ec2();
  const result = await client.send(new DescribeIamInstanceProfileAssociationsCommand({}));
  const associations = (result.IamInstanceProfileAssociations || []).map((a: any) => ({
    id: a.AssociationId,
    instanceId: a.InstanceId,
    state: a.State,
    profile: a.IamInstanceProfile?.Arn ?? null,
  }));
  return c.json({ associations, total: associations.length });
});

router.get("/addresses-attributes", async (c: Context) => {
  const client = ec2();
  const result = await client.send(new DescribeAddressesAttributeCommand({
    Attribute: c.req.query("attribute") as any,
  }));
  return c.json({ addresses: result.Addresses ?? [], total: (result.Addresses ?? []).length });
});


router.post("/instances/:id/create-image", async (c: Context) => {
  const body = await c.req.json<{ name: string; description?: string; noReboot?: boolean }>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const client = ec2();
  const result = await client.send(new CreateImageCommand({
    InstanceId: c.req.param("id")!,
    Name: body.name,
    Description: body.description,
    NoReboot: body.noReboot,
  }));
  return c.json({ imageId: result.ImageId ?? null }, 201);
});

router.post("/images/register", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const client = ec2();
  const result = await client.send(new RegisterImageCommand({
    Name: body.name,
    Architecture: body.architecture as any,
    RootDeviceName: body.rootDeviceName || "/dev/sda1",
    BlockDeviceMappings: body.blockDeviceMappings,
  }));
  return c.json({ imageId: result.ImageId ?? null }, 201);
});

router.put("/route-tables/:routeTableId/replace-route", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.destinationCidrBlock) return c.json({ error: "destinationCidrBlock is required" }, 400);
  if (!body.gatewayId && !body.natGatewayId && !body.instanceId) {
    return c.json({ error: "gatewayId, natGatewayId or instanceId is required" }, 400);
  }
  const client = ec2();
  await client.send(new ReplaceRouteCommand({
    RouteTableId: c.req.param("routeTableId")!,
    DestinationCidrBlock: body.destinationCidrBlock,
    GatewayId: body.gatewayId,
    NatGatewayId: body.natGatewayId,
    InstanceId: body.instanceId,
  }));
  return c.json({ replaced: true });
});

export default router;