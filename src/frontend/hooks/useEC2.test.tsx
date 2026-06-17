// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useEC2Instances,
  useEC2Instance,
  useEC2RunInstance,
  useEC2TerminateInstance,
  useEC2StartInstance,
  useEC2StopInstance,
  useEC2RebootInstance,
  useEC2ModifyInstance,
  useEC2Vpcs,
  useEC2Vpc,
  useEC2CreateVpc,
  useEC2DeleteVpc,
  useEC2ModifyVpc,
  useEC2Subnets,
  useEC2CreateSubnet,
  useEC2DeleteSubnet,
  useEC2SecurityGroups,
  useEC2CreateSecurityGroup,
  useEC2DeleteSecurityGroup,
  useEC2AuthorizeIngress,
  useEC2RevokeIngress,
  useEC2KeyPairs,
  useEC2CreateKeyPair,
  useEC2ImportKeyPair,
  useEC2DeleteKeyPair,
  useEC2Amis,
  useEC2InternetGateways,
  useEC2CreateInternetGateway,
  useEC2DeleteInternetGateway,
  useEC2AttachInternetGateway,
  useEC2DetachInternetGateway,
  useEC2RouteTables,
  useEC2CreateRouteTable,
  useEC2DeleteRouteTable,
  useEC2NatGateways,
  useEC2CreateNatGateway,
  useEC2DeleteNatGateway,
  useEC2ElasticIps,
  useEC2AllocateElasticIp,
  useEC2ReleaseElasticIp,
  useEC2LaunchTemplates,
  useEC2CreateLaunchTemplate,
  useEC2DeleteLaunchTemplate,
  useEC2Volumes,
  useEC2CreateVolume,
  useEC2DeleteVolume,
  useEC2NetworkInterfaces,
  useEC2Regions,
  useEC2AvailabilityZones,
  useEC2InstanceTypes,
} from "./useEC2";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── Query helpers ─────────────────────────────────────

async function expectQuery(
  hook: () => any,
  expectedUrl: string,
) {
  mockApi.mockResolvedValueOnce({});
  const { result } = renderHook(hook, { wrapper: createWrapper() });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(mockApi).toHaveBeenCalledWith(expectedUrl);
}

async function expectGuarded(
  hook: () => any,
  expectedUrl: string,
) {
  mockApi.mockResolvedValueOnce({});
  const { result } = renderHook(hook, { wrapper: createWrapper() });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(mockApi).toHaveBeenCalledWith(expectedUrl);
}

async function expectNotCalled(hook: () => any) {
  const { result } = renderHook(hook, { wrapper: createWrapper() });
  await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
  expect(mockApi).not.toHaveBeenCalled();
}

async function expectMutation(
  hook: () => any,
  mutateArg: any,
  expectedUrl: string,
  method: string,
) {
  mockApi.mockResolvedValueOnce({});
  const { result } = renderHook(hook, { wrapper: createWrapper() });
  await result.current.mutateAsync(mutateArg);
  expect(mockApi).toHaveBeenCalledWith(
    expectedUrl,
    expect.objectContaining({ method }),
  );
}

// ─── Instance queries ──────────────────────────────────

describe("useEC2Instances", () => {
  it("calls api with GET /aws/ec2/instances", async () => {
    await expectQuery(() => useEC2Instances(), "/aws/ec2/instances");
  });
});

describe("useEC2Instance", () => {
  it("does not call api when id is null", async () => {
    await expectNotCalled(() => useEC2Instance(null));
  });

  it("calls api with GET /aws/ec2/instances/:id", async () => {
    await expectGuarded(() => useEC2Instance("i-1"), "/aws/ec2/instances/i-1");
  });
});

// ─── Instance mutations ────────────────────────────────

describe("useEC2RunInstance", () => {
  it("calls api with POST /aws/ec2/instances", async () => {
    await expectMutation(() => useEC2RunInstance(), { imageId: "ami-1" }, "/aws/ec2/instances", "POST");
  });
});

describe("useEC2TerminateInstance", () => {
  it("calls api with DELETE /aws/ec2/instances/:id", async () => {
    await expectMutation(() => useEC2TerminateInstance(), "i-1", "/aws/ec2/instances/i-1", "DELETE");
  });
});

describe("useEC2StartInstance", () => {
  it("calls api with POST /aws/ec2/instances/:id/start", async () => {
    await expectMutation(() => useEC2StartInstance(), "i-1", "/aws/ec2/instances/i-1/start", "POST");
  });
});

describe("useEC2StopInstance", () => {
  it("calls api with POST /aws/ec2/instances/:id/stop", async () => {
    await expectMutation(() => useEC2StopInstance(), "i-1", "/aws/ec2/instances/i-1/stop", "POST");
  });
});

describe("useEC2RebootInstance", () => {
  it("calls api with POST /aws/ec2/instances/:id/reboot", async () => {
    await expectMutation(() => useEC2RebootInstance(), "i-1", "/aws/ec2/instances/i-1/reboot", "POST");
  });
});

describe("useEC2ModifyInstance", () => {
  it("calls api with PATCH /aws/ec2/instances/:id", async () => {
    await expectMutation(
      () => useEC2ModifyInstance(),
      { id: "i-1", instanceType: "t2.large" },
      "/aws/ec2/instances/i-1",
      "PATCH",
    );
  });

  it("sends payload without id in body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useEC2ModifyInstance(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ id: "i-1", instanceType: "t2.large" });
    const [, opts] = mockApi.mock.calls[0];
    expect(JSON.parse(opts.body)).toEqual({ instanceType: "t2.large" });
  });
});

// ─── VPC queries ───────────────────────────────────────

describe("useEC2Vpcs", () => {
  it("calls api with GET /aws/ec2/vpcs", async () => {
    await expectQuery(() => useEC2Vpcs(), "/aws/ec2/vpcs");
  });
});

describe("useEC2Vpc", () => {
  it("does not call api when id is null", async () => {
    await expectNotCalled(() => useEC2Vpc(null));
  });

  it("calls api with GET /aws/ec2/vpcs/:id", async () => {
    await expectGuarded(() => useEC2Vpc("vpc-1"), "/aws/ec2/vpcs/vpc-1");
  });
});

describe("useEC2CreateVpc", () => {
  it("calls api with POST /aws/ec2/vpcs", async () => {
    await expectMutation(() => useEC2CreateVpc(), { cidrBlock: "10.0.0.0/16" }, "/aws/ec2/vpcs", "POST");
  });
});

describe("useEC2DeleteVpc", () => {
  it("calls api with DELETE /aws/ec2/vpcs/:id", async () => {
    await expectMutation(() => useEC2DeleteVpc(), "vpc-1", "/aws/ec2/vpcs/vpc-1", "DELETE");
  });
});

describe("useEC2ModifyVpc", () => {
  it("calls api with PATCH /aws/ec2/vpcs/:id", async () => {
    await expectMutation(
      () => useEC2ModifyVpc(),
      { id: "vpc-1", enableDnsSupport: true },
      "/aws/ec2/vpcs/vpc-1",
      "PATCH",
    );
  });
});

// ─── Subnet queries ────────────────────────────────────

describe("useEC2Subnets", () => {
  it("calls api with GET /aws/ec2/subnets", async () => {
    await expectQuery(() => useEC2Subnets(), "/aws/ec2/subnets");
  });
});

describe("useEC2CreateSubnet", () => {
  it("calls api with POST /aws/ec2/subnets", async () => {
    await expectMutation(
      () => useEC2CreateSubnet(),
      { vpcId: "vpc-1", cidrBlock: "10.0.1.0/24" },
      "/aws/ec2/subnets",
      "POST",
    );
  });
});

describe("useEC2DeleteSubnet", () => {
  it("calls api with DELETE /aws/ec2/subnets/:id", async () => {
    await expectMutation(() => useEC2DeleteSubnet(), "subnet-1", "/aws/ec2/subnets/subnet-1", "DELETE");
  });
});

// ─── Security Group queries ────────────────────────────

describe("useEC2SecurityGroups", () => {
  it("calls api with GET /aws/ec2/security-groups", async () => {
    await expectQuery(() => useEC2SecurityGroups(), "/aws/ec2/security-groups");
  });
});

describe("useEC2CreateSecurityGroup", () => {
  it("calls api with POST /aws/ec2/security-groups", async () => {
    await expectMutation(
      () => useEC2CreateSecurityGroup(),
      { groupName: "sg-1" },
      "/aws/ec2/security-groups",
      "POST",
    );
  });
});

describe("useEC2DeleteSecurityGroup", () => {
  it("calls api with DELETE /aws/ec2/security-groups/:id", async () => {
    await expectMutation(() => useEC2DeleteSecurityGroup(), "sg-1", "/aws/ec2/security-groups/sg-1", "DELETE");
  });
});

describe("useEC2AuthorizeIngress", () => {
  it("calls api with POST /aws/ec2/security-groups/:id/rules/ingress", async () => {
    await expectMutation(
      () => useEC2AuthorizeIngress(),
      { groupId: "sg-1", ipProtocol: "tcp", fromPort: 80, toPort: 80, cidrIp: "0.0.0.0/0" },
      "/aws/ec2/security-groups/sg-1/rules/ingress",
      "POST",
    );
  });

  it("sends payload without groupId in body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useEC2AuthorizeIngress(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      groupId: "sg-1",
      ipProtocol: "tcp",
      fromPort: 80,
      toPort: 80,
      cidrIp: "0.0.0.0/0",
    });
    const [, opts] = mockApi.mock.calls[0];
    expect(JSON.parse(opts.body)).toEqual({
      ipProtocol: "tcp",
      fromPort: 80,
      toPort: 80,
      cidrIp: "0.0.0.0/0",
    });
  });
});

describe("useEC2RevokeIngress", () => {
  it("calls api with DELETE /aws/ec2/security-groups/:id/rules/ingress", async () => {
    await expectMutation(
      () => useEC2RevokeIngress(),
      { groupId: "sg-1", ipProtocol: "tcp", fromPort: 80, toPort: 80, cidrIp: "0.0.0.0/0" },
      "/aws/ec2/security-groups/sg-1/rules/ingress",
      "DELETE",
    );
  });
});

// ─── Key Pair queries ──────────────────────────────────

describe("useEC2KeyPairs", () => {
  it("calls api with GET /aws/ec2/key-pairs", async () => {
    await expectQuery(() => useEC2KeyPairs(), "/aws/ec2/key-pairs");
  });
});

describe("useEC2CreateKeyPair", () => {
  it("calls api with POST /aws/ec2/key-pairs", async () => {
    await expectMutation(
      () => useEC2CreateKeyPair(),
      { keyName: "kp-1" },
      "/aws/ec2/key-pairs",
      "POST",
    );
  });
});

describe("useEC2ImportKeyPair", () => {
  it("calls api with POST /aws/ec2/key-pairs/import", async () => {
    await expectMutation(
      () => useEC2ImportKeyPair(),
      { keyName: "kp-1", publicKeyMaterial: "ssh-rsa AAAA..." },
      "/aws/ec2/key-pairs/import",
      "POST",
    );
  });
});

describe("useEC2DeleteKeyPair", () => {
  it("calls api with DELETE /aws/ec2/key-pairs/:name", async () => {
    await expectMutation(() => useEC2DeleteKeyPair(), "kp-1", "/aws/ec2/key-pairs/kp-1", "DELETE");
  });
});

// ─── AMI queries ───────────────────────────────────────

describe("useEC2Amis", () => {
  it("calls api with GET /aws/ec2/amis", async () => {
    await expectQuery(() => useEC2Amis(), "/aws/ec2/amis");
  });
});

// ─── Internet Gateway queries ──────────────────────────

describe("useEC2InternetGateways", () => {
  it("calls api with GET /aws/ec2/internet-gateways", async () => {
    await expectQuery(() => useEC2InternetGateways(), "/aws/ec2/internet-gateways");
  });
});

describe("useEC2CreateInternetGateway", () => {
  it("calls api with POST /aws/ec2/internet-gateways", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useEC2CreateInternetGateway(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync();
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ec2/internet-gateways",
      expect.objectContaining({ method: "POST", body: "{}" }),
    );
  });
});

describe("useEC2DeleteInternetGateway", () => {
  it("calls api with DELETE /aws/ec2/internet-gateways/:id", async () => {
    await expectMutation(
      () => useEC2DeleteInternetGateway(),
      "igw-1",
      "/aws/ec2/internet-gateways/igw-1",
      "DELETE",
    );
  });
});

describe("useEC2AttachInternetGateway", () => {
  it("calls api with POST /aws/ec2/internet-gateways/:id/attach", async () => {
    await expectMutation(
      () => useEC2AttachInternetGateway(),
      { id: "igw-1", vpcId: "vpc-1" },
      "/aws/ec2/internet-gateways/igw-1/attach",
      "POST",
    );
  });

  it("sends vpcId in body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useEC2AttachInternetGateway(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ id: "igw-1", vpcId: "vpc-1" });
    const [, opts] = mockApi.mock.calls[0];
    expect(JSON.parse(opts.body)).toEqual({ vpcId: "vpc-1" });
  });
});

describe("useEC2DetachInternetGateway", () => {
  it("calls api with POST /aws/ec2/internet-gateways/:id/detach", async () => {
    await expectMutation(
      () => useEC2DetachInternetGateway(),
      { id: "igw-1", vpcId: "vpc-1" },
      "/aws/ec2/internet-gateways/igw-1/detach",
      "POST",
    );
  });
});

// ─── Route Table queries ───────────────────────────────

describe("useEC2RouteTables", () => {
  it("calls api with GET /aws/ec2/route-tables", async () => {
    await expectQuery(() => useEC2RouteTables(), "/aws/ec2/route-tables");
  });
});

describe("useEC2CreateRouteTable", () => {
  it("calls api with POST /aws/ec2/route-tables", async () => {
    await expectMutation(
      () => useEC2CreateRouteTable(),
      { vpcId: "vpc-1" },
      "/aws/ec2/route-tables",
      "POST",
    );
  });
});

describe("useEC2DeleteRouteTable", () => {
  it("calls api with DELETE /aws/ec2/route-tables/:id", async () => {
    await expectMutation(() => useEC2DeleteRouteTable(), "rtb-1", "/aws/ec2/route-tables/rtb-1", "DELETE");
  });
});

// ─── NAT Gateway queries ───────────────────────────────

describe("useEC2NatGateways", () => {
  it("calls api with GET /aws/ec2/nat-gateways", async () => {
    await expectQuery(() => useEC2NatGateways(), "/aws/ec2/nat-gateways");
  });
});

describe("useEC2CreateNatGateway", () => {
  it("calls api with POST /aws/ec2/nat-gateways", async () => {
    await expectMutation(
      () => useEC2CreateNatGateway(),
      { subnetId: "subnet-1", allocationId: "eipalloc-1" },
      "/aws/ec2/nat-gateways",
      "POST",
    );
  });
});

describe("useEC2DeleteNatGateway", () => {
  it("calls api with DELETE /aws/ec2/nat-gateways/:id", async () => {
    await expectMutation(() => useEC2DeleteNatGateway(), "nat-1", "/aws/ec2/nat-gateways/nat-1", "DELETE");
  });
});

// ─── Elastic IP queries ────────────────────────────────

describe("useEC2ElasticIps", () => {
  it("calls api with GET /aws/ec2/elastic-ips", async () => {
    await expectQuery(() => useEC2ElasticIps(), "/aws/ec2/elastic-ips");
  });
});

describe("useEC2AllocateElasticIp", () => {
  it("calls api with POST /aws/ec2/elastic-ips", async () => {
    await expectMutation(
      () => useEC2AllocateElasticIp(),
      "vpc",
      "/aws/ec2/elastic-ips",
      "POST",
    );
  });

  it("sends domain in body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useEC2AllocateElasticIp(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("vpc");
    const [, opts] = mockApi.mock.calls[0];
    expect(JSON.parse(opts.body)).toEqual({ domain: "vpc" });
  });
});

describe("useEC2ReleaseElasticIp", () => {
  it("calls api with DELETE /aws/ec2/elastic-ips/:allocationId", async () => {
    await expectMutation(
      () => useEC2ReleaseElasticIp(),
      "eipalloc-1",
      "/aws/ec2/elastic-ips/eipalloc-1",
      "DELETE",
    );
  });
});

// ─── Launch Template queries ───────────────────────────

describe("useEC2LaunchTemplates", () => {
  it("calls api with GET /aws/ec2/launch-templates", async () => {
    await expectQuery(() => useEC2LaunchTemplates(), "/aws/ec2/launch-templates");
  });
});

describe("useEC2CreateLaunchTemplate", () => {
  it("calls api with POST /aws/ec2/launch-templates", async () => {
    await expectMutation(
      () => useEC2CreateLaunchTemplate(),
      { launchTemplateName: "lt-1" },
      "/aws/ec2/launch-templates",
      "POST",
    );
  });
});

describe("useEC2DeleteLaunchTemplate", () => {
  it("calls api with DELETE /aws/ec2/launch-templates/:id", async () => {
    await expectMutation(
      () => useEC2DeleteLaunchTemplate(),
      "lt-1",
      "/aws/ec2/launch-templates/lt-1",
      "DELETE",
    );
  });
});

// ─── Volume queries ────────────────────────────────────

describe("useEC2Volumes", () => {
  it("calls api with GET /aws/ec2/volumes", async () => {
    await expectQuery(() => useEC2Volumes(), "/aws/ec2/volumes");
  });
});

describe("useEC2CreateVolume", () => {
  it("calls api with POST /aws/ec2/volumes", async () => {
    await expectMutation(
      () => useEC2CreateVolume(),
      { availabilityZone: "us-east-1a" },
      "/aws/ec2/volumes",
      "POST",
    );
  });
});

describe("useEC2DeleteVolume", () => {
  it("calls api with DELETE /aws/ec2/volumes/:id", async () => {
    await expectMutation(() => useEC2DeleteVolume(), "vol-1", "/aws/ec2/volumes/vol-1", "DELETE");
  });
});

// ─── Network Interface queries ─────────────────────────

describe("useEC2NetworkInterfaces", () => {
  it("calls api with GET /aws/ec2/network-interfaces", async () => {
    await expectQuery(() => useEC2NetworkInterfaces(), "/aws/ec2/network-interfaces");
  });
});

// ─── Info queries ──────────────────────────────────────

describe("useEC2Regions", () => {
  it("calls api with GET /aws/ec2/regions", async () => {
    await expectQuery(() => useEC2Regions(), "/aws/ec2/regions");
  });
});

describe("useEC2AvailabilityZones", () => {
  it("calls api with GET /aws/ec2/availability-zones", async () => {
    await expectQuery(() => useEC2AvailabilityZones(), "/aws/ec2/availability-zones");
  });
});

describe("useEC2InstanceTypes", () => {
  it("calls api with GET /aws/ec2/instance-types", async () => {
    await expectQuery(() => useEC2InstanceTypes(), "/aws/ec2/instance-types");
  });
});
