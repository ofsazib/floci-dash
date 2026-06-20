// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import EC2NetworkTopology from "./EC2NetworkTopology";

// Mock all the hooks used by the topology component
const mockVpcs = vi.fn();
const mockSubnets = vi.fn();
const mockInstances = vi.fn();
const mockIgws = vi.fn();
const mockRtbs = vi.fn();

vi.mock("../hooks/useEC2", () => ({
  useEC2Vpcs: (...args: any[]) => mockVpcs(...args),
  useEC2Subnets: (...args: any[]) => mockSubnets(...args),
  useEC2Instances: (...args: any[]) => mockInstances(...args),
  useEC2InternetGateways: (...args: any[]) => mockIgws(...args),
  useEC2RouteTables: (...args: any[]) => mockRtbs(...args),
}));

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

/** Set up mock data for a VPC with subnets and instances */
function setupMockData(overrides?: {
  vpcs?: any[];
  subnets?: any[];
  instances?: any[];
  igws?: any[];
  rtbs?: any[];
}) {
  mockVpcs.mockReturnValue({
    data: { vpcs: overrides?.vpcs ?? [] },
    isLoading: false,
    isError: false,
  });
  mockSubnets.mockReturnValue({
    data: { subnets: overrides?.subnets ?? [] },
    isLoading: false,
    isError: false,
  });
  mockInstances.mockReturnValue({
    data: { instances: overrides?.instances ?? [] },
    isLoading: false,
    isError: false,
  });
  mockIgws.mockReturnValue({
    data: { internetGateways: overrides?.igws ?? [] },
  });
  mockRtbs.mockReturnValue({
    data: { routeTables: overrides?.rtbs ?? [] },
  });
}

describe("EC2NetworkTopology", () => {
  it("shows loading spinner when data is loading", () => {
    mockVpcs.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    mockSubnets.mockReturnValue({ data: undefined, isLoading: false, isError: false });
    mockInstances.mockReturnValue({ data: undefined, isLoading: false, isError: false });
    mockIgws.mockReturnValue({ data: undefined });
    mockRtbs.mockReturnValue({ data: undefined });

    render(<EC2NetworkTopology />, { wrapper: createWrapper() });
    expect(screen.getByText("Loading network topology...")).toBeTruthy();
  });

  it("shows empty state when no VPCs exist", () => {
    setupMockData({ vpcs: [] });
    render(<EC2NetworkTopology />, { wrapper: createWrapper() });
    expect(screen.getByText(/No VPCs found/)).toBeTruthy();
  });

  it("shows VPC header with CIDR and default status", () => {
    setupMockData({
      vpcs: [{ id: "vpc-123", cidrBlock: "10.0.0.0/16", isDefault: true, state: "available", instanceTenancy: "default" }],
      subnets: [],
      instances: [],
    });

    render(<EC2NetworkTopology />, { wrapper: createWrapper() });
    expect(screen.getByText("vpc-123")).toBeTruthy();
    expect(screen.getByText(/10\.0\.0\.0\/16/)).toBeTruthy();
    expect(screen.getByText("Default VPC")).toBeTruthy();
  });

  it("shows subnet with CIDR and AZ", () => {
    setupMockData({
      vpcs: [{ id: "vpc-1", cidrBlock: "10.0.0.0/16", isDefault: false, state: "available", instanceTenancy: "default" }],
      subnets: [{ id: "subnet-1", vpcId: "vpc-1", cidrBlock: "10.0.1.0/24", availabilityZone: "us-east-1a", state: "available", availableIpCount: 251 }],
      instances: [],
    });

    render(<EC2NetworkTopology />, { wrapper: createWrapper() });
    expect(screen.getByText("subnet-1")).toBeTruthy();
    expect(screen.getByText(/10.0.1.0\/24/)).toBeTruthy();
    expect(screen.getByText(/us-east-1a/)).toBeTruthy();
    expect(screen.getByText(/251 available IPs/)).toBeTruthy();
  });

  it("shows no instances message when subnet has no instances", () => {
    setupMockData({
      vpcs: [{ id: "vpc-1", cidrBlock: "10.0.0.0/16", isDefault: false, state: "available", instanceTenancy: "default" }],
      subnets: [{ id: "subnet-1", vpcId: "vpc-1", cidrBlock: "10.0.1.0/24", availabilityZone: "us-east-1a", state: "available", availableIpCount: 251 }],
      instances: [],
    });

    render(<EC2NetworkTopology />, { wrapper: createWrapper() });
    expect(screen.getByText(/No running instances/)).toBeTruthy();
  });

  it("shows running instances in a subnet", () => {
    setupMockData({
      vpcs: [{ id: "vpc-1", cidrBlock: "10.0.0.0/16", isDefault: false, state: "available", instanceTenancy: "default" }],
      subnets: [{ id: "subnet-1", vpcId: "vpc-1", cidrBlock: "10.0.1.0/24", availabilityZone: "us-east-1a", state: "available", availableIpCount: 250 }],
      instances: [
        { id: "i-abc", state: "running", instanceType: "t3.micro", privateIp: "10.0.1.5", vpcId: "vpc-1", subnetId: "subnet-1" },
        { id: "i-def", state: "running", instanceType: "t3.small", privateIp: "10.0.1.6", vpcId: "vpc-1", subnetId: "subnet-1" },
      ],
    });

    render(<EC2NetworkTopology />, { wrapper: createWrapper() });
    expect(screen.getByText("i-abc")).toBeTruthy();
    expect(screen.getByText("i-def")).toBeTruthy();
    expect(screen.getByText("t3.micro")).toBeTruthy();
    expect(screen.getByText("10.0.1.5")).toBeTruthy();
    expect(screen.getByText("10.0.1.6")).toBeTruthy();
    expect(screen.getByText(/Running \(2\)/)).toBeTruthy();
  });

  it("shows stopped instances with warning indicator", () => {
    setupMockData({
      vpcs: [{ id: "vpc-1", cidrBlock: "10.0.0.0/16", isDefault: false, state: "available", instanceTenancy: "default" }],
      subnets: [{ id: "subnet-1", vpcId: "vpc-1", cidrBlock: "10.0.1.0/24", availabilityZone: "us-east-1a", state: "available", availableIpCount: 251 }],
      instances: [
        { id: "i-stopped", state: "stopped", instanceType: "t3.micro", privateIp: "10.0.1.5", vpcId: "vpc-1", subnetId: "subnet-1" },
      ],
    });

    render(<EC2NetworkTopology />, { wrapper: createWrapper() });
    expect(screen.getByText("i-stopped")).toBeTruthy();
    expect(screen.getByText(/Stopped \(1\)/)).toBeTruthy();
  });

  it("filters out terminated instances", () => {
    setupMockData({
      vpcs: [{ id: "vpc-1", cidrBlock: "10.0.0.0/16", isDefault: false, state: "available", instanceTenancy: "default" }],
      subnets: [{ id: "subnet-1", vpcId: "vpc-1", cidrBlock: "10.0.1.0/24", availabilityZone: "us-east-1a", state: "available", availableIpCount: 251 }],
      instances: [
        { id: "i-running", state: "running", instanceType: "t3.micro", privateIp: "10.0.1.5", vpcId: "vpc-1", subnetId: "subnet-1" },
        { id: "i-terminated", state: "terminated", instanceType: "t3.micro", privateIp: "10.0.1.6", vpcId: "vpc-1", subnetId: "subnet-1" },
      ],
    });

    render(<EC2NetworkTopology />, { wrapper: createWrapper() });
    expect(screen.getByText("i-running")).toBeTruthy();
    expect(screen.queryByText("i-terminated")).toBeNull();
  });

  it("shows internet gateways attached to VPC", () => {
    setupMockData({
      vpcs: [{ id: "vpc-1", cidrBlock: "10.0.0.0/16", isDefault: false, state: "available", instanceTenancy: "default" }],
      subnets: [],
      instances: [],
      igws: [{ id: "igw-abc", attachments: [{ vpcId: "vpc-1", state: "attached" }] }],
    });

    render(<EC2NetworkTopology />, { wrapper: createWrapper() });
    expect(screen.getByText("igw-abc")).toBeTruthy();
    expect(screen.getByText("Internet Gateways")).toBeTruthy();
  });

  it("shows route tables for a VPC", () => {
    setupMockData({
      vpcs: [{ id: "vpc-1", cidrBlock: "10.0.0.0/16", isDefault: false, state: "available", instanceTenancy: "default" }],
      subnets: [],
      instances: [],
      igws: [],
      rtbs: [
        { id: "rtb-1", vpcId: "vpc-1", associations: [{ main: true }] },
        { id: "rtb-2", vpcId: "vpc-1", associations: [{ subnetId: "subnet-1" }] },
      ],
    });

    render(<EC2NetworkTopology />, { wrapper: createWrapper() });
    expect(screen.getByText("Route Tables (2)")).toBeTruthy();
    expect(screen.getByText("rtb-1 (main)")).toBeTruthy();
    expect(screen.getByText("rtb-2")).toBeTruthy();
  });

  it("handles multiple VPCs", () => {
    setupMockData({
      vpcs: [
        { id: "vpc-1", cidrBlock: "10.0.0.0/16", isDefault: false, state: "available", instanceTenancy: "default" },
        { id: "vpc-2", cidrBlock: "192.168.0.0/16", isDefault: false, state: "available", instanceTenancy: "default" },
      ],
      subnets: [
        { id: "subnet-a", vpcId: "vpc-1", cidrBlock: "10.0.1.0/24", availabilityZone: "us-east-1a", state: "available", availableIpCount: 251 },
        { id: "subnet-b", vpcId: "vpc-2", cidrBlock: "192.168.1.0/24", availabilityZone: "us-east-1b", state: "available", availableIpCount: 251 },
      ],
      instances: [
        { id: "i-vpc1", state: "running", instanceType: "t3.micro", privateIp: "10.0.1.5", vpcId: "vpc-1", subnetId: "subnet-a" },
        { id: "i-vpc2", state: "running", instanceType: "t3.small", privateIp: "192.168.1.5", vpcId: "vpc-2", subnetId: "subnet-b" },
      ],
    });

    render(<EC2NetworkTopology />, { wrapper: createWrapper() });
    expect(screen.getByText("vpc-1")).toBeTruthy();
    expect(screen.getByText("vpc-2")).toBeTruthy();
    expect(screen.getByText("i-vpc1")).toBeTruthy();
    expect(screen.getByText("i-vpc2")).toBeTruthy();
  });
});
