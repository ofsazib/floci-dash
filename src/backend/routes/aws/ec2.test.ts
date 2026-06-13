import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── Mock AWS SDK ──────────────────────────────────────
// We mock the entire @aws-sdk/client-ec2 module so EC2Client.send()
// returns controlled responses without hitting Floci.
// Using vi.hoisted to hoist helpers before vi.mock runs.

const mockSend = vi.hoisted(() => vi.fn());

const mockEC2Client = vi.hoisted(() =>
  vi.fn(function() { return { send: mockSend }; })
);

// Helper that creates a mock command constructor (uses function keyword for 'new' support)
const createCmd = vi.hoisted(() => {
  return function(name: string) {
    return vi.fn(function(this: any, args?: any) {
      // Return an object that looks like the SDK command
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-ec2", () => ({
  EC2Client: mockEC2Client,
  RunInstancesCommand: createCmd("RunInstancesCommand"),
  DescribeInstancesCommand: createCmd("DescribeInstancesCommand"),
  TerminateInstancesCommand: createCmd("TerminateInstancesCommand"),
  StartInstancesCommand: createCmd("StartInstancesCommand"),
  StopInstancesCommand: createCmd("StopInstancesCommand"),
  RebootInstancesCommand: createCmd("RebootInstancesCommand"),
  DescribeInstanceStatusCommand: createCmd("DescribeInstanceStatusCommand"),
  ModifyInstanceAttributeCommand: createCmd("ModifyInstanceAttributeCommand"),
  CreateVpcCommand: createCmd("CreateVpcCommand"),
  DescribeVpcsCommand: createCmd("DescribeVpcsCommand"),
  DeleteVpcCommand: createCmd("DeleteVpcCommand"),
  ModifyVpcAttributeCommand: createCmd("ModifyVpcAttributeCommand"),
  AssociateVpcCidrBlockCommand: createCmd("AssociateVpcCidrBlockCommand"),
  DisassociateVpcCidrBlockCommand: createCmd("DisassociateVpcCidrBlockCommand"),
  CreateVpcEndpointCommand: createCmd("CreateVpcEndpointCommand"),
  DescribeVpcEndpointsCommand: createCmd("DescribeVpcEndpointsCommand"),
  DeleteVpcEndpointsCommand: createCmd("DeleteVpcEndpointsCommand"),
  CreateSubnetCommand: createCmd("CreateSubnetCommand"),
  DescribeSubnetsCommand: createCmd("DescribeSubnetsCommand"),
  DeleteSubnetCommand: createCmd("DeleteSubnetCommand"),
  ModifySubnetAttributeCommand: createCmd("ModifySubnetAttributeCommand"),
  CreateSecurityGroupCommand: createCmd("CreateSecurityGroupCommand"),
  DescribeSecurityGroupsCommand: createCmd("DescribeSecurityGroupsCommand"),
  DeleteSecurityGroupCommand: createCmd("DeleteSecurityGroupCommand"),
  AuthorizeSecurityGroupIngressCommand: createCmd("AuthorizeSecurityGroupIngressCommand"),
  AuthorizeSecurityGroupEgressCommand: createCmd("AuthorizeSecurityGroupEgressCommand"),
  RevokeSecurityGroupIngressCommand: createCmd("RevokeSecurityGroupIngressCommand"),
  RevokeSecurityGroupEgressCommand: createCmd("RevokeSecurityGroupEgressCommand"),
  CreateKeyPairCommand: createCmd("CreateKeyPairCommand"),
  DescribeKeyPairsCommand: createCmd("DescribeKeyPairsCommand"),
  DeleteKeyPairCommand: createCmd("DeleteKeyPairCommand"),
  ImportKeyPairCommand: createCmd("ImportKeyPairCommand"),
  DescribeImagesCommand: createCmd("DescribeImagesCommand"),
  CreateTagsCommand: createCmd("CreateTagsCommand"),
  DeleteTagsCommand: createCmd("DeleteTagsCommand"),
  DescribeTagsCommand: createCmd("DescribeTagsCommand"),
  CreateInternetGatewayCommand: createCmd("CreateInternetGatewayCommand"),
  DescribeInternetGatewaysCommand: createCmd("DescribeInternetGatewaysCommand"),
  DeleteInternetGatewayCommand: createCmd("DeleteInternetGatewayCommand"),
  AttachInternetGatewayCommand: createCmd("AttachInternetGatewayCommand"),
  DetachInternetGatewayCommand: createCmd("DetachInternetGatewayCommand"),
  CreateRouteTableCommand: createCmd("CreateRouteTableCommand"),
  DescribeRouteTablesCommand: createCmd("DescribeRouteTablesCommand"),
  DeleteRouteTableCommand: createCmd("DeleteRouteTableCommand"),
  AssociateRouteTableCommand: createCmd("AssociateRouteTableCommand"),
  DisassociateRouteTableCommand: createCmd("DisassociateRouteTableCommand"),
  CreateRouteCommand: createCmd("CreateRouteCommand"),
  DeleteRouteCommand: createCmd("DeleteRouteCommand"),
  CreateNatGatewayCommand: createCmd("CreateNatGatewayCommand"),
  DescribeNatGatewaysCommand: createCmd("DescribeNatGatewaysCommand"),
  DeleteNatGatewayCommand: createCmd("DeleteNatGatewayCommand"),
  AllocateAddressCommand: createCmd("AllocateAddressCommand"),
  AssociateAddressCommand: createCmd("AssociateAddressCommand"),
  DisassociateAddressCommand: createCmd("DisassociateAddressCommand"),
  ReleaseAddressCommand: createCmd("ReleaseAddressCommand"),
  DescribeAddressesCommand: createCmd("DescribeAddressesCommand"),
  DescribeAvailabilityZonesCommand: createCmd("DescribeAvailabilityZonesCommand"),
  DescribeRegionsCommand: createCmd("DescribeRegionsCommand"),
  DescribeAccountAttributesCommand: createCmd("DescribeAccountAttributesCommand"),
  DescribeInstanceTypesCommand: createCmd("DescribeInstanceTypesCommand"),
  CreateLaunchTemplateCommand: createCmd("CreateLaunchTemplateCommand"),
  CreateLaunchTemplateVersionCommand: createCmd("CreateLaunchTemplateVersionCommand"),
  DescribeLaunchTemplatesCommand: createCmd("DescribeLaunchTemplatesCommand"),
  DescribeLaunchTemplateVersionsCommand: createCmd("DescribeLaunchTemplateVersionsCommand"),
  ModifyLaunchTemplateCommand: createCmd("ModifyLaunchTemplateCommand"),
  DeleteLaunchTemplateCommand: createCmd("DeleteLaunchTemplateCommand"),
  CreateVolumeCommand: createCmd("CreateVolumeCommand"),
  DescribeVolumesCommand: createCmd("DescribeVolumesCommand"),
  DeleteVolumeCommand: createCmd("DeleteVolumeCommand"),
  DescribeNetworkInterfacesCommand: createCmd("DescribeNetworkInterfacesCommand"),
}));

// Now import the router after the mock is set up
import router from "./ec2";

// ─── Helpers ───────────────────────────────────────────

async function get(path: string) {
  return router.request(path, { method: "GET" });
}

async function post(path: string, body?: any) {
  return router.request(path, {
    method: "POST",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function del(path: string, body?: any) {
  return router.request(path, {
    method: "DELETE",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function patch(path: string, body?: any) {
  return router.request(path, {
    method: "PATCH",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

// ─── Tests ─────────────────────────────────────────────

beforeEach(() => {
  mockSend.mockReset();
  mockEC2Client.mockClear();
});

describe("EC2 Routes", () => {
  // ── Instances ─────────────────────────────────────

  describe("Instances", () => {
    it("GET /instances — lists instances", async () => {
      mockSend.mockResolvedValueOnce({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: "i-0abc123",
                ImageId: "ami-123",
                InstanceType: "t3.micro",
                State: { Name: "running" },
                PrivateIpAddress: "10.0.0.5",
                PublicIpAddress: "54.0.0.1",
                VpcId: "vpc-123",
                SubnetId: "subnet-456",
                KeyName: "my-key",
                LaunchTime: new Date("2025-01-15T10:00:00Z"),
                SecurityGroups: [{ GroupId: "sg-123", GroupName: "default" }],
                Tags: [{ Key: "Name", Value: "web-server" }],
                Placement: { AvailabilityZone: "us-east-1a" },
                Architecture: "x86_64",
                Monitoring: { State: "disabled" },
                EbsOptimized: false,
                SourceDestCheck: true,
              },
            ],
          },
        ],
      });

      const res = await get("/instances");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.instances[0].id).toBe("i-0abc123");
      expect(body.instances[0].state).toBe("running");
      expect(body.instances[0].instanceType).toBe("t3.micro");
      expect(body.instances[0].tags).toEqual([{ key: "Name", value: "web-server" }]);
    });

    it("GET /instances — empty list when no reservations", async () => {
      mockSend.mockResolvedValueOnce({ Reservations: [] });
      const res = await get("/instances");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.instances).toEqual([]);
    });

    it("POST /instances — creates an instance", async () => {
      mockSend.mockResolvedValueOnce({
        Instances: [{ InstanceId: "i-new001", State: { Name: "pending" } }],
      });

      const res = await post("/instances", {
        imageId: "ami-123",
        instanceType: "t3.large",
        keyName: "my-key",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.instances[0].id).toBe("i-new001");
      // Verify SDK command parameters
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.ImageId).toBe("ami-123");
      expect(cmd.InstanceType).toBe("t3.large");
      expect(cmd.KeyName).toBe("my-key");
      expect(cmd.MinCount).toBe(1);
      expect(cmd.MaxCount).toBe(1);
    });

    it("POST /instances — uses defaults when fields omitted", async () => {
      mockSend.mockResolvedValueOnce({ Instances: [{ InstanceId: "i-default" }] });

      const res = await post("/instances", {});
      expect(res.status).toBe(200);
      // Should have used default imageId and instanceType
      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.ImageId).toBeTruthy();
      expect(callArgs.InstanceType).toBe("t3.micro");
    });

    it("GET /instances/:id — returns instance detail", async () => {
      mockSend.mockResolvedValueOnce({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: "i-001",
                ImageId: "ami-1",
                InstanceType: "t3.micro",
                State: { Name: "running" },
                VpcId: "vpc-1",
                SubnetId: "subnet-1",
                KeyName: "k",
                LaunchTime: new Date("2025-01-01T00:00:00Z"),
                SecurityGroups: [],
                Tags: [],
                Placement: { AvailabilityZone: "us-east-1a" },
                Architecture: "x86_64",
              },
            ],
          },
        ],
      });

      const res = await get("/instances/i-001");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe("i-001");
      expect(body.state).toBe("running");
    });

    it("GET /instances/:id — 404 when not found", async () => {
      mockSend.mockResolvedValueOnce({ Reservations: [{ Instances: [] }] });
      const res = await get("/instances/i-missing");
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toContain("not found");
    });

    it("DELETE /instances/:id — terminates instance", async () => {
      mockSend.mockResolvedValueOnce({ TerminatingInstances: [] });
      const res = await del("/instances/i-001");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.terminated).toBe(true);
      expect(body.id).toBe("i-001");
      expect(mockSend.mock.calls[0][0].InstanceIds).toEqual(["i-001"]);
    });

    it("POST /instances/:id/start — starts instance", async () => {
      mockSend.mockResolvedValueOnce({ StartingInstances: [] });
      const res = await post("/instances/i-001/start");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.started).toBe(true);
      expect(mockSend.mock.calls[0][0].InstanceIds).toEqual(["i-001"]);
    });

    it("POST /instances/:id/stop — stops instance", async () => {
      mockSend.mockResolvedValueOnce({ StoppingInstances: [] });
      const res = await post("/instances/i-001/stop");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.stopped).toBe(true);
      expect(mockSend.mock.calls[0][0].InstanceIds).toEqual(["i-001"]);
    });

    it("POST /instances/:id/reboot — reboots instance", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/instances/i-001/reboot");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.rebooting).toBe(true);
      expect(mockSend.mock.calls[0][0].InstanceIds).toEqual(["i-001"]);
    });

    it("GET /instances/:id/status — returns status info", async () => {
      mockSend.mockResolvedValueOnce({
        InstanceStatuses: [
          {
            InstanceStatus: { Status: "ok" },
            SystemStatus: { Status: "ok" },
            Events: [
              { Code: "1", Description: "Reboot", NotAfter: new Date(), NotBefore: new Date() },
            ],
          },
        ],
      });
      const res = await get("/instances/i-001/status");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.instanceStatus).toBe("ok");
      expect(body.systemStatus).toBe("ok");
      expect(body.events).toHaveLength(1);
    });

    it("PATCH /instances/:id — modifies instance attributes", async () => {
      mockSend.mockResolvedValue({});
      const res = await patch("/instances/i-001", {
        instanceType: "t3.large",
        sourceDestCheck: false,
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.modified).toBe(true);
      // Should have called send twice (once for each attribute)
      expect(mockSend).toHaveBeenCalledTimes(2);
      // Verify SDK command parameters
      expect(mockSend.mock.calls[0][0].InstanceId).toBe("i-001");
      expect(mockSend.mock.calls[0][0].Attribute).toBe("instanceType");
      expect(mockSend.mock.calls[0][0].Value).toBe("t3.large");
      expect(mockSend.mock.calls[1][0].InstanceId).toBe("i-001");
      expect(mockSend.mock.calls[1][0].Attribute).toBe("sourceDestCheck");
      expect(mockSend.mock.calls[1][0].Value).toBe("false");
    });
  });

  // ── VPCs ──────────────────────────────────────────

  describe("VPCs", () => {
    it("GET /vpcs — lists VPCs", async () => {
      mockSend.mockResolvedValueOnce({
        Vpcs: [
          {
            VpcId: "vpc-001",
            State: "available",
            CidrBlock: "10.0.0.0/16",
            IsDefault: true,
            InstanceTenancy: "default",
            Tags: [{ Key: "Name", Value: "default" }],
          },
        ],
      });
      const res = await get("/vpcs");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.vpcs[0].id).toBe("vpc-001");
      expect(body.vpcs[0].isDefault).toBe(true);
    });

    it("POST /vpcs — creates a VPC", async () => {
      mockSend.mockResolvedValueOnce({
        Vpc: { VpcId: "vpc-new", CidrBlock: "10.0.0.0/16" },
      });
      const res = await post("/vpcs", { cidrBlock: "10.0.0.0/16" });
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.id).toBe("vpc-new");
      expect(mockSend.mock.calls[0][0].CidrBlock).toBe("10.0.0.0/16");
      expect(mockSend.mock.calls[0][0].InstanceTenancy).toBe("default");
    });

    it("GET /vpcs/:id — returns VPC detail", async () => {
      mockSend.mockResolvedValueOnce({
        Vpcs: [{ VpcId: "vpc-001", State: "available", CidrBlock: "10.0.0.0/16", IsDefault: false, InstanceTenancy: "default", Tags: [] }],
      });
      const res = await get("/vpcs/vpc-001");
      const body = await res.json();
      expect(body.id).toBe("vpc-001");
    });

    it("GET /vpcs/:id — 404 when not found", async () => {
      mockSend.mockResolvedValueOnce({ Vpcs: [] });
      const res = await get("/vpcs/vpc-missing");
      expect(res.status).toBe(404);
    });

    it("DELETE /vpcs/:id — deletes VPC", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/vpcs/vpc-001");
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].VpcId).toBe("vpc-001");
    });

    it("PATCH /vpcs/:id — modifies DNS attributes", async () => {
      mockSend.mockResolvedValue({});
      const res = await patch("/vpcs/vpc-001", { enableDnsSupport: true, enableDnsHostnames: false });
      const body = await res.json();
      expect(body.modified).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend.mock.calls[0][0].VpcId).toBe("vpc-001");
      expect(mockSend.mock.calls[0][0].EnableDnsSupport).toEqual({ Value: true });
      expect(mockSend.mock.calls[1][0].EnableDnsHostnames).toEqual({ Value: false });
    });

    it("POST /vpcs/:id/cidr — associates CIDR block", async () => {
      mockSend.mockResolvedValueOnce({
        CidrBlockAssociation: { AssociationId: "vpc-cidr-assoc-001" },
      });
      const res = await post("/vpcs/vpc-001/cidr", { cidrBlock: "10.1.0.0/16" });
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.associationId).toBe("vpc-cidr-assoc-001");
      expect(mockSend.mock.calls[0][0].VpcId).toBe("vpc-001");
      expect(mockSend.mock.calls[0][0].CidrBlock).toBe("10.1.0.0/16");
    });

    it("POST /vpcs/:id/cidr — 400 when CIDR missing", async () => {
      const res = await post("/vpcs/vpc-001/cidr", {});
      expect(res.status).toBe(400);
    });

    it("GET /vpc-endpoints — lists VPC endpoints", async () => {
      mockSend.mockResolvedValueOnce({
        VpcEndpoints: [
          { VpcEndpointId: "vpce-001", VpcId: "vpc-001", ServiceName: "com.amazonaws.vpce.s3", State: "available", VpcEndpointType: "Gateway", SubnetIds: [], Tags: [] },
        ],
      });
      const res = await get("/vpc-endpoints");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.endpoints[0].id).toBe("vpce-001");
    });

    it("POST /vpc-endpoints — creates endpoint", async () => {
      mockSend.mockResolvedValueOnce({
        VpcEndpoint: { VpcEndpointId: "vpce-new" },
      });
      const res = await post("/vpc-endpoints", { vpcId: "vpc-001", serviceName: "com.amazonaws.vpce.s3" });
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(mockSend.mock.calls[0][0].VpcId).toBe("vpc-001");
      expect(mockSend.mock.calls[0][0].ServiceName).toBe("com.amazonaws.vpce.s3");
    });

    it("POST /vpc-endpoints — 400 when missing required fields", async () => {
      const res = await post("/vpc-endpoints", { vpcId: "vpc-001" }); // missing serviceName
      expect(res.status).toBe(400);
    });

    it("DELETE /vpc-endpoints/:id — deletes endpoint", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/vpc-endpoints/vpce-001");
      expect((await res.json()).deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].VpcEndpointIds).toEqual(["vpce-001"]);
    });
  });

  // ── Subnets ───────────────────────────────────────

  describe("Subnets", () => {
    it("GET /subnets — lists subnets", async () => {
      mockSend.mockResolvedValueOnce({
        Subnets: [
          {
            SubnetId: "subnet-001",
            VpcId: "vpc-001",
            CidrBlock: "10.0.1.0/24",
            AvailabilityZone: "us-east-1a",
            State: "available",
            AvailableIpAddressCount: 251,
            MapPublicIpOnLaunch: false,
            DefaultForAz: false,
            Tags: [],
          },
        ],
      });
      const res = await get("/subnets");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.subnets[0].id).toBe("subnet-001");
    });

    it("POST /subnets — creates subnet", async () => {
      mockSend.mockResolvedValueOnce({
        Subnet: { SubnetId: "subnet-new", CidrBlock: "10.0.2.0/24" },
      });
      const res = await post("/subnets", { vpcId: "vpc-001", cidrBlock: "10.0.2.0/24" });
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(mockSend.mock.calls[0][0].VpcId).toBe("vpc-001");
      expect(mockSend.mock.calls[0][0].CidrBlock).toBe("10.0.2.0/24");
    });

    it("POST /subnets — 400 when VpcId missing", async () => {
      const res = await post("/subnets", { cidrBlock: "10.0.0.0/24" });
      expect(res.status).toBe(400);
    });

    it("DELETE /subnets/:id — deletes subnet", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/subnets/subnet-001");
      expect((await res.json()).deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].SubnetId).toBe("subnet-001");
    });

    it("PATCH /subnets/:id — modifies attribute", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await patch("/subnets/subnet-001", { mapPublicIpOnLaunch: true });
      expect((await res.json()).modified).toBe(true);
      expect(mockSend.mock.calls[0][0].SubnetId).toBe("subnet-001");
      expect(mockSend.mock.calls[0][0].MapPublicIpOnLaunch).toEqual({ Value: true });
    });
  });

  // ── Security Groups ───────────────────────────────

  describe("Security Groups", () => {
    it("GET /security-groups — lists groups", async () => {
      mockSend.mockResolvedValueOnce({
        SecurityGroups: [
          {
            GroupId: "sg-001",
            GroupName: "default",
            Description: "Default SG",
            VpcId: "vpc-001",
            OwnerId: "123456789012",
            IpPermissions: [{ IpProtocol: "tcp", FromPort: 22, ToPort: 22, IpRanges: [{ CidrIp: "0.0.0.0/0" }] }],
            IpPermissionsEgress: [],
            Tags: [],
          },
        ],
      });
      const res = await get("/security-groups");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.securityGroups[0].id).toBe("sg-001");
      expect(body.securityGroups[0].inboundRules).toHaveLength(1);
    });

    it("POST /security-groups — creates group", async () => {
      mockSend.mockResolvedValueOnce({ GroupId: "sg-new" });
      const res = await post("/security-groups", { groupName: "web-sg", description: "Web tier" });
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.id).toBe("sg-new");
      expect(mockSend.mock.calls[0][0].GroupName).toBe("web-sg");
      expect(mockSend.mock.calls[0][0].Description).toBe("Web tier");
    });

    it("POST /security-groups — 400 when name missing", async () => {
      const res = await post("/security-groups", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /security-groups/:id — deletes group", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/security-groups/sg-001");
      expect((await res.json()).deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].GroupId).toBe("sg-001");
    });

    it("POST /security-groups/:id/rules/ingress — authorizes ingress rule", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/security-groups/sg-001/rules/ingress", {
        ipProtocol: "tcp",
        fromPort: 443,
        toPort: 443,
        cidrIp: "10.0.0.0/16",
      });
      const body = await res.json();
      expect(body.ruleAdded).toBe(true);
      expect(mockSend.mock.calls[0][0].GroupId).toBe("sg-001");
      expect(mockSend.mock.calls[0][0].IpPermissions[0].IpProtocol).toBe("tcp");
      expect(mockSend.mock.calls[0][0].IpPermissions[0].FromPort).toBe(443);
      expect(mockSend.mock.calls[0][0].IpPermissions[0].ToPort).toBe(443);
      expect(mockSend.mock.calls[0][0].IpPermissions[0].IpRanges[0].CidrIp).toBe("10.0.0.0/16");
    });

    it("DELETE /security-groups/:id/rules/ingress — revokes ingress rule", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/security-groups/sg-001/rules/ingress", {
        ipProtocol: "tcp",
        fromPort: 443,
        toPort: 443,
        cidrIp: "10.0.0.0/16",
      });
      const body = await res.json();
      expect(body.ruleRemoved).toBe(true);
      expect(mockSend.mock.calls[0][0].GroupId).toBe("sg-001");
      expect(mockSend.mock.calls[0][0].IpPermissions[0].FromPort).toBe(443);
    });

    it("POST /security-groups/:id/rules/egress — authorizes egress rule", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/security-groups/sg-001/rules/egress", {
        ipProtocol: "-1",
        cidrIp: "0.0.0.0/0",
      });
      const body = await res.json();
      expect(body.egressRuleAdded).toBe(true);
      expect(mockSend.mock.calls[0][0].GroupId).toBe("sg-001");
      expect(mockSend.mock.calls[0][0].IpPermissions[0].IpProtocol).toBe("-1");
      expect(mockSend.mock.calls[0][0].IpPermissions[0].IpRanges[0].CidrIp).toBe("0.0.0.0/0");
    });

    it("DELETE /security-groups/:id/rules/egress — revokes egress rule", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/security-groups/sg-001/rules/egress", {
        ipProtocol: "-1",
        cidrIp: "0.0.0.0/0",
      });
      const body = await res.json();
      expect(body.egressRuleRemoved).toBe(true);
      expect(mockSend.mock.calls[0][0].GroupId).toBe("sg-001");
    });
  });

  // ── Key Pairs ─────────────────────────────────────

  describe("Key Pairs", () => {
    it("GET /key-pairs — lists keys", async () => {
      mockSend.mockResolvedValueOnce({
        KeyPairs: [{ KeyName: "my-key", KeyFingerprint: "12:34:56", KeyType: "rsa", Tags: [] }],
      });
      const res = await get("/key-pairs");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.keyPairs[0].name).toBe("my-key");
    });

    it("POST /key-pairs — creates key", async () => {
      mockSend.mockResolvedValueOnce({
        KeyName: "new-key",
        KeyFingerprint: "ab:cd:ef",
        KeyMaterial: "-----BEGIN RSA PRIVATE KEY-----\nMII...\n-----END RSA PRIVATE KEY-----",
      });
      const res = await post("/key-pairs", { keyName: "new-key", keyType: "rsa" });
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.keyMaterial).toContain("PRIVATE KEY");
      expect(mockSend.mock.calls[0][0].KeyName).toBe("new-key");
      expect(mockSend.mock.calls[0][0].KeyType).toBe("rsa");
    });

    it("POST /key-pairs — 400 when name missing", async () => {
      const res = await post("/key-pairs", {});
      expect(res.status).toBe(400);
    });

    it("POST /key-pairs/import — imports key", async () => {
      mockSend.mockResolvedValueOnce({ KeyName: "imported-key", KeyFingerprint: "00:11:22" });
      const res = await post("/key-pairs/import", {
        keyName: "imported-key",
        publicKeyMaterial: "ssh-rsa AAAA...",
      });
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(mockSend.mock.calls[0][0].KeyName).toBe("imported-key");
      // PublicKeyMaterial gets converted to Buffer
      expect(mockSend.mock.calls[0][0].PublicKeyMaterial).toBeInstanceOf(Buffer);
      expect(mockSend.mock.calls[0][0].PublicKeyMaterial.toString()).toBe("ssh-rsa AAAA...");
    });

    it("POST /key-pairs/import — 400 when missing fields", async () => {
      const res = await post("/key-pairs/import", { keyName: "k" }); // missing publicKeyMaterial
      expect(res.status).toBe(400);
    });

    it("DELETE /key-pairs/:name — deletes key", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/key-pairs/my-key");
      expect((await res.json()).deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].KeyName).toBe("my-key");
    });
  });

  // ── AMIs ──────────────────────────────────────────

  describe("AMIs", () => {
    it("GET /amis — lists images", async () => {
      mockSend.mockResolvedValueOnce({
        Images: [
          {
            ImageId: "ami-001",
            Name: "My Image",
            Description: "Test image",
            Architecture: "x86_64",
            Platform: "Linux",
            State: "available",
            ImageType: "machine",
            CreationDate: "2025-01-01T00:00:00.000Z",
            RootDeviceType: "ebs",
            VirtualizationType: "hvm",
            Tags: [],
          },
        ],
      });
      const res = await get("/amis");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.images[0].id).toBe("ami-001");
      expect(body.images[0].architecture).toBe("x86_64");
    });

    it("GET /amis — returns empty when no images", async () => {
      mockSend.mockResolvedValueOnce({ Images: [] });
      const res = await get("/amis");
      const body = await res.json();
      expect(body.total).toBe(0);
    });
  });

  // ── Tags ──────────────────────────────────────────

  describe("Tags", () => {
    it("GET /tags — lists tags", async () => {
      mockSend.mockResolvedValueOnce({
        Tags: [{ Key: "Name", Value: "web-server", ResourceType: "instance", ResourceId: "i-001" }],
      });
      const res = await get("/tags");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.tags[0].key).toBe("Name");
    });

    it("POST /tags — creates tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tags", {
        resources: ["i-001"],
        tags: [{ key: "Environment", value: "prod" }],
      });
      const body = await res.json();
      expect(body.tagged).toBe(true);
      expect(mockSend.mock.calls[0][0].Resources).toEqual(["i-001"]);
      expect(mockSend.mock.calls[0][0].Tags).toEqual([{ Key: "Environment", Value: "prod" }]);
    });

    it("POST /tags — 400 when missing fields", async () => {
      const res = await post("/tags", { resources: ["i-001"] }); // missing tags
      expect(res.status).toBe(400);
    });

    it("DELETE /tags — deletes tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/tags", {
        resources: ["i-001"],
        tags: [{ key: "Name" }],
      });
      const body = await res.json();
      expect(body.untagged).toBe(true);
      expect(mockSend.mock.calls[0][0].Resources).toEqual(["i-001"]);
      expect(mockSend.mock.calls[0][0].Tags).toEqual([{ Key: "Name" }]);
    });

    it("DELETE /tags — 400 when missing fields", async () => {
      const res = await del("/tags", { resources: ["i-001"] });
      expect(res.status).toBe(400);
    });
  });

  // ── Internet Gateways ─────────────────────────────

  describe("Internet Gateways", () => {
    it("GET /internet-gateways — lists IGWs", async () => {
      mockSend.mockResolvedValueOnce({
        InternetGateways: [
          {
            InternetGatewayId: "igw-001",
            Attachments: [{ VpcId: "vpc-001", State: "available" }],
            Tags: [],
            OwnerId: "123456789012",
          },
        ],
      });
      const res = await get("/internet-gateways");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.internetGateways[0].id).toBe("igw-001");
    });

    it("POST /internet-gateways — creates IGW", async () => {
      mockSend.mockResolvedValueOnce({ InternetGateway: { InternetGatewayId: "igw-new" } });
      const res = await post("/internet-gateways", {});
      const body = await res.json();
      expect(body.created).toBe(true);
    });

    it("DELETE /internet-gateways/:id — deletes IGW", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/internet-gateways/igw-001");
      expect((await res.json()).deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].InternetGatewayId).toBe("igw-001");
    });

    it("POST /internet-gateways/:id/attach — attaches to VPC", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/internet-gateways/igw-001/attach", { vpcId: "vpc-001" });
      expect((await res.json()).attached).toBe(true);
      expect(mockSend.mock.calls[0][0].InternetGatewayId).toBe("igw-001");
      expect(mockSend.mock.calls[0][0].VpcId).toBe("vpc-001");
    });

    it("POST /internet-gateways/:id/attach — 400 when VpcId missing", async () => {
      const res = await post("/internet-gateways/igw-001/attach", {});
      expect(res.status).toBe(400);
    });

    it("POST /internet-gateways/:id/detach — detaches from VPC", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/internet-gateways/igw-001/detach", { vpcId: "vpc-001" });
      expect((await res.json()).detached).toBe(true);
      expect(mockSend.mock.calls[0][0].InternetGatewayId).toBe("igw-001");
      expect(mockSend.mock.calls[0][0].VpcId).toBe("vpc-001");
    });
  });

  // ── Route Tables ──────────────────────────────────

  describe("Route Tables", () => {
    it("GET /route-tables — lists route tables", async () => {
      mockSend.mockResolvedValueOnce({
        RouteTables: [
          {
            RouteTableId: "rtb-001",
            VpcId: "vpc-001",
            Associations: [{ RouteTableAssociationId: "rtbassoc-001", SubnetId: "subnet-001", Main: true, AssociationState: { State: "associated" } }],
            Routes: [{ DestinationCidrBlock: "10.0.0.0/16", GatewayId: "local", State: "active", Origin: "CreateRouteTable" }],
            Tags: [],
          },
        ],
      });
      const res = await get("/route-tables");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.routeTables[0].id).toBe("rtb-001");
    });

    it("POST /route-tables — creates route table", async () => {
      mockSend.mockResolvedValueOnce({ RouteTable: { RouteTableId: "rtb-new" } });
      const res = await post("/route-tables", { vpcId: "vpc-001" });
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(mockSend.mock.calls[0][0].VpcId).toBe("vpc-001");
    });

    it("POST /route-tables — 400 when VpcId missing", async () => {
      const res = await post("/route-tables", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /route-tables/:id — deletes route table", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/route-tables/rtb-001");
      expect((await res.json()).deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].RouteTableId).toBe("rtb-001");
    });

    it("POST /route-tables/:id/routes — creates route", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/route-tables/rtb-001/routes", {
        destinationCidrBlock: "0.0.0.0/0",
        gatewayId: "igw-001",
      });
      expect((await res.json()).created).toBe(true);
      expect(mockSend.mock.calls[0][0].RouteTableId).toBe("rtb-001");
      expect(mockSend.mock.calls[0][0].DestinationCidrBlock).toBe("0.0.0.0/0");
      expect(mockSend.mock.calls[0][0].GatewayId).toBe("igw-001");
    });

    it("DELETE /route-tables/:id/routes — deletes route", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/route-tables/rtb-001/routes", {
        destinationCidrBlock: "0.0.0.0/0",
      });
      expect((await res.json()).deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].RouteTableId).toBe("rtb-001");
      expect(mockSend.mock.calls[0][0].DestinationCidrBlock).toBe("0.0.0.0/0");
    });

    it("DELETE /route-tables/:id/routes — 400 when destination missing", async () => {
      const res = await del("/route-tables/rtb-001/routes", {});
      expect(res.status).toBe(400);
    });
  });

  // ── NAT Gateways ──────────────────────────────────

  describe("NAT Gateways", () => {
    it("GET /nat-gateways — lists NAT gateways", async () => {
      mockSend.mockResolvedValueOnce({
        NatGateways: [
          {
            NatGatewayId: "nat-001",
            SubnetId: "subnet-001",
            VpcId: "vpc-001",
            State: "available",
            NatGatewayAddresses: [{ PublicIp: "54.0.0.1", PrivateIp: "10.0.0.5", AllocationId: "eipalloc-001" }],
            CreateTime: new Date("2025-01-01T00:00:00Z"),
            Tags: [],
          },
        ],
      });
      const res = await get("/nat-gateways");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.natGateways[0].id).toBe("nat-001");
    });

    it("POST /nat-gateways — creates NAT gateway", async () => {
      mockSend.mockResolvedValueOnce({ NatGateway: { NatGatewayId: "nat-new" } });
      const res = await post("/nat-gateways", { subnetId: "subnet-001", allocationId: "eipalloc-001" });
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(mockSend.mock.calls[0][0].SubnetId).toBe("subnet-001");
      expect(mockSend.mock.calls[0][0].AllocationId).toBe("eipalloc-001");
    });

    it("POST /nat-gateways — 400 when missing required fields", async () => {
      const res = await post("/nat-gateways", { subnetId: "subnet-001" }); // missing allocationId
      expect(res.status).toBe(400);
    });

    it("DELETE /nat-gateways/:id — deletes NAT gateway", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/nat-gateways/nat-001");
      expect((await res.json()).deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].NatGatewayId).toBe("nat-001");
    });
  });

  // ── Elastic IPs ───────────────────────────────────

  describe("Elastic IPs", () => {
    it("GET /elastic-ips — lists addresses", async () => {
      mockSend.mockResolvedValueOnce({
        Addresses: [
          {
            AllocationId: "eipalloc-001",
            PublicIp: "54.0.0.1",
            PrivateIpAddress: "10.0.0.5",
            AssociationId: "eipassoc-001",
            InstanceId: "i-001",
            Domain: "vpc",
            Tags: [],
          },
        ],
      });
      const res = await get("/elastic-ips");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.addresses[0].allocationId).toBe("eipalloc-001");
    });

    it("POST /elastic-ips — allocates address", async () => {
      mockSend.mockResolvedValueOnce({ AllocationId: "eipalloc-new", PublicIp: "54.0.0.2", Domain: "vpc" });
      const res = await post("/elastic-ips", {});
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.allocationId).toBe("eipalloc-new");
      expect(mockSend.mock.calls[0][0].Domain).toBe("vpc");
    });

    it("DELETE /elastic-ips/:allocationId — releases address", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/elastic-ips/eipalloc-001");
      expect((await res.json()).released).toBe(true);
      expect(mockSend.mock.calls[0][0].AllocationId).toBe("eipalloc-001");
    });

    it("POST /elastic-ips/:allocationId/associate — associates with instance", async () => {
      mockSend.mockResolvedValueOnce({ AssociationId: "eipassoc-new" });
      const res = await post("/elastic-ips/eipalloc-001/associate", { instanceId: "i-001" });
      const body = await res.json();
      expect(body.associated).toBe(true);
      expect(body.associationId).toBe("eipassoc-new");
      expect(mockSend.mock.calls[0][0].AllocationId).toBe("eipalloc-001");
      expect(mockSend.mock.calls[0][0].InstanceId).toBe("i-001");
    });

    it("POST /elastic-ips/:allocationId/associate — 400 when instanceId missing", async () => {
      const res = await post("/elastic-ips/eipalloc-001/associate", {});
      expect(res.status).toBe(400);
    });

    it("POST /elastic-ips/:allocationId/disassociate — disassociates", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/elastic-ips/eipalloc-001/disassociate", { associationId: "eipassoc-001" });
      expect((await res.json()).disassociated).toBe(true);
      expect(mockSend.mock.calls[0][0].AssociationId).toBe("eipassoc-001");
    });
  });

  // ── Regions / AZs ─────────────────────────────────

  describe("Regions & AZs", () => {
    it("GET /regions — lists regions", async () => {
      mockSend.mockResolvedValueOnce({
        Regions: [{ RegionName: "us-east-1", Endpoint: "ec2.us-east-1.amazonaws.com", OptInStatus: "opt-in-not-required" }],
      });
      const res = await get("/regions");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.regions[0].name).toBe("us-east-1");
    });

    it("GET /availability-zones — lists AZs", async () => {
      mockSend.mockResolvedValueOnce({
        AvailabilityZones: [{ ZoneName: "us-east-1a", ZoneId: "use1-az1", State: "available", RegionName: "us-east-1", Messages: [] }],
      });
      const res = await get("/availability-zones");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.availabilityZones[0].name).toBe("us-east-1a");
    });

    it("GET /account-attributes — lists account attributes", async () => {
      mockSend.mockResolvedValueOnce({
        AccountAttributes: [{ AttributeName: "supported-ec2-instance-types", AttributeValues: [{ AttributeValue: "t3.micro" }] }],
      });
      const res = await get("/account-attributes");
      const body = await res.json();
      expect(body.accountAttributes).toHaveLength(1);
    });
  });

  // ── Instance Types ────────────────────────────────

  describe("Instance Types", () => {
    it("GET /instance-types — lists types", async () => {
      mockSend.mockResolvedValueOnce({
        InstanceTypes: [
          {
            InstanceType: "t3.micro",
            CurrentGeneration: true,
            VCpuInfo: { DefaultVCpus: 2 },
            MemoryInfo: { SizeInMiB: 1024 },
            NetworkInfo: { NetworkPerformance: "Up to 5 Gigabit", MaximumNetworkInterfaces: 3, Ipv6Supported: true },
            EbsInfo: { EbsOptimizedSupport: "default" },
            ProcessorInfo: { SupportedArchitectures: ["x86_64"] },
            SupportedUsageClasses: ["on-demand", "spot"],
          },
        ],
      });
      const res = await get("/instance-types");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.instanceTypes[0].type).toBe("t3.micro");
      expect(body.instanceTypes[0].vCpus).toBe(2);
    });
  });

  // ── Launch Templates ──────────────────────────────

  describe("Launch Templates", () => {
    it("GET /launch-templates — lists templates", async () => {
      mockSend.mockResolvedValueOnce({
        LaunchTemplates: [
          {
            LaunchTemplateId: "lt-001",
            LaunchTemplateName: "web-template",
            DefaultVersionNumber: 1,
            LatestVersionNumber: 2,
            CreatedBy: "test-user",
            CreateTime: new Date("2025-01-01T00:00:00Z"),
            Tags: [],
          },
        ],
      });
      const res = await get("/launch-templates");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.launchTemplates[0].id).toBe("lt-001");
    });

    it("POST /launch-templates — creates template", async () => {
      mockSend.mockResolvedValueOnce({ LaunchTemplate: { LaunchTemplateId: "lt-new" } });
      const res = await post("/launch-templates", {
        launchTemplateName: "my-template",
        imageId: "ami-001",
        instanceType: "t3.micro",
      });
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(mockSend.mock.calls[0][0].LaunchTemplateName).toBe("my-template");
      expect(mockSend.mock.calls[0][0].LaunchTemplateData.ImageId).toBe("ami-001");
      expect(mockSend.mock.calls[0][0].LaunchTemplateData.InstanceType).toBe("t3.micro");
    });

    it("POST /launch-templates — 400 when name missing", async () => {
      const res = await post("/launch-templates", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /launch-templates/:id — deletes template", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/launch-templates/lt-001");
      expect((await res.json()).deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].LaunchTemplateId).toBe("lt-001");
    });

    it("GET /launch-templates/:id — returns template detail", async () => {
      mockSend.mockResolvedValueOnce({
        LaunchTemplates: [{ LaunchTemplateId: "lt-001", LaunchTemplateName: "web", DefaultVersionNumber: 1, LatestVersionNumber: 1, CreatedBy: "user", CreateTime: new Date(), Tags: [] }],
      });
      const res = await get("/launch-templates/lt-001");
      const body = await res.json();
      expect(body.id).toBe("lt-001");
    });

    it("GET /launch-templates/:id — 404 when not found", async () => {
      mockSend.mockResolvedValueOnce({ LaunchTemplates: [] });
      const res = await get("/launch-templates/lt-missing");
      expect(res.status).toBe(404);
    });

    it("GET /launch-templates/:id/versions — lists versions", async () => {
      mockSend.mockResolvedValueOnce({
        LaunchTemplateVersions: [
          { VersionNumber: 1, VersionDescription: "v1", LaunchTemplateData: { ImageId: "ami-001" }, CreatedBy: "user", CreateTime: new Date(), DefaultVersion: true },
        ],
      });
      const res = await get("/launch-templates/lt-001/versions");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.versions[0].version).toBe(1);
    });

    it("POST /launch-templates/:id/versions — creates version", async () => {
      mockSend.mockResolvedValueOnce({ LaunchTemplateVersion: { VersionNumber: 2 } });
      const res = await post("/launch-templates/lt-001/versions", {
        imageId: "ami-002",
        instanceType: "t3.large",
      });
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(mockSend.mock.calls[0][0].LaunchTemplateId).toBe("lt-001");
      expect(mockSend.mock.calls[0][0].LaunchTemplateData.ImageId).toBe("ami-002");
      expect(mockSend.mock.calls[0][0].LaunchTemplateData.InstanceType).toBe("t3.large");
    });

    it("PATCH /launch-templates/:id — modifies default version", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await patch("/launch-templates/lt-001", { defaultVersion: "2" });
      const body = await res.json();
      expect(body.modified).toBe(true);
      expect(mockSend.mock.calls[0][0].LaunchTemplateId).toBe("lt-001");
      expect(mockSend.mock.calls[0][0].DefaultVersion).toBe("2");
    });
  });

  // ── Volumes ───────────────────────────────────────

  describe("Volumes", () => {
    it("GET /volumes — lists volumes", async () => {
      mockSend.mockResolvedValueOnce({
        Volumes: [
          {
            VolumeId: "vol-001",
            Size: 8,
            VolumeType: "gp2",
            State: "available",
            AvailabilityZone: "us-east-1a",
            Iops: 100,
            Encrypted: false,
            Attachments: [],
            CreateTime: new Date("2025-01-01T00:00:00Z"),
            Tags: [],
          },
        ],
      });
      const res = await get("/volumes");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.volumes[0].id).toBe("vol-001");
    });

    it("POST /volumes — creates volume", async () => {
      mockSend.mockResolvedValueOnce({ VolumeId: "vol-new" });
      const res = await post("/volumes", { availabilityZone: "us-east-1a", size: 20, volumeType: "gp3" });
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(mockSend.mock.calls[0][0].AvailabilityZone).toBe("us-east-1a");
      expect(mockSend.mock.calls[0][0].Size).toBe(20);
      expect(mockSend.mock.calls[0][0].VolumeType).toBe("gp3");
    });

    it("POST /volumes — 400 when AZ missing", async () => {
      const res = await post("/volumes", { size: 10 });
      expect(res.status).toBe(400);
    });

    it("DELETE /volumes/:id — deletes volume", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/volumes/vol-001");
      expect((await res.json()).deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].VolumeId).toBe("vol-001");
    });
  });

  // ── Network Interfaces ────────────────────────────

  describe("Network Interfaces", () => {
    it("GET /network-interfaces — lists ENIs", async () => {
      mockSend.mockResolvedValueOnce({
        NetworkInterfaces: [
          {
            NetworkInterfaceId: "eni-001",
            VpcId: "vpc-001",
            SubnetId: "subnet-001",
            Description: "Primary ENI",
            PrivateIpAddress: "10.0.0.5",
            MacAddress: "0a:1b:2c:3d:4e:5f",
            Status: "in-use",
            Attachment: { InstanceId: "i-001" },
            Groups: [{ GroupId: "sg-001", GroupName: "default" }],
            TagSet: [],
          },
        ],
      });
      const res = await get("/network-interfaces");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.networkInterfaces[0].id).toBe("eni-001");
    });
  });

  // ── VPC CIDR delete ───────────────────────────────

  describe("VPC CIDR disassociation", () => {
    it("DELETE /vpcs/:id/cidr/:associationId — disassociates CIDR", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/vpcs/vpc-001/cidr/vpc-cidr-assoc-001");
      const body = await res.json();
      expect(body.disassociated).toBe(true);
      expect(mockSend.mock.calls[0][0].AssociationId).toBe("vpc-cidr-assoc-001");
    });
  });

  // ── Route table associations ──────────────────────

  describe("Route Table Associations", () => {
    it("POST /route-tables/:id/associate — associates with subnet", async () => {
      mockSend.mockResolvedValueOnce({ AssociationId: "rtbassoc-new" });
      const res = await post("/route-tables/rtb-001/associate", { subnetId: "subnet-001" });
      const body = await res.json();
      expect(body.associated).toBe(true);
      expect(body.associationId).toBe("rtbassoc-new");
      expect(mockSend.mock.calls[0][0].RouteTableId).toBe("rtb-001");
      expect(mockSend.mock.calls[0][0].SubnetId).toBe("subnet-001");
    });

    it("POST /route-tables/:id/associate — 400 when subnetId missing", async () => {
      const res = await post("/route-tables/rtb-001/associate", {});
      expect(res.status).toBe(400);
    });

    it("POST /route-tables/:id/disassociate — disassociates from subnet", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/route-tables/rtb-001/disassociate", { associationId: "rtbassoc-001" });
      expect((await res.json()).disassociated).toBe(true);
      expect(mockSend.mock.calls[0][0].AssociationId).toBe("rtbassoc-001");
    });

    it("POST /route-tables/:id/disassociate — 400 when associationId missing", async () => {
      const res = await post("/route-tables/rtb-001/disassociate", {});
      expect(res.status).toBe(400);
    });
  });
});
