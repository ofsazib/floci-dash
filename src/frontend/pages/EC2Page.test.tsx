// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { clickButton, createWrapper } from "../../test/helpers";
import React from "react";

// ─── Mock useEC2 hooks ─────────────────────────────────
// vi.mock is hoisted above all imports. Variables prefixed with `mock` that are
// assigned `vi.fn()` are also hoisted by vitest, so they are safe to reference
// inside the factory below.

// Query hooks
const mockInstances = vi.fn();
const mockKeyPairs = vi.fn();
const mockSubnets = vi.fn();
const mockSecurityGroups = vi.fn();
const mockAmis = vi.fn();
const mockLaunchTemplates = vi.fn();
const mockVpcs = vi.fn();
const mockVpc = vi.fn();
const mockElasticIps = vi.fn();
const mockInternetGateways = vi.fn();
const mockRouteTables = vi.fn();
const mockNatGateways = vi.fn();
const mockVolumes = vi.fn();
const mockNetworkInterfaces = vi.fn();

// Mutation hooks (mutate)
const mockRunInstance = vi.fn();
const mockStartInstance = vi.fn();
const mockStopInstance = vi.fn();
const mockRebootInstance = vi.fn();
const mockCreateVpc = vi.fn();
const mockCreateSubnet = vi.fn();
const mockCreateSecurityGroup = vi.fn();
const mockAuthorizeIngress = vi.fn();
const mockRevokeIngress = vi.fn();
const mockCreateKeyPair = vi.fn();
const mockImportKeyPair = vi.fn();
const mockCreateInternetGateway = vi.fn();
const mockAttachInternetGateway = vi.fn();
const mockDetachInternetGateway = vi.fn();
const mockCreateRouteTable = vi.fn();
const mockCreateNatGateway = vi.fn();
const mockCreateVolume = vi.fn();
const mockCreateLaunchTemplate = vi.fn();
const mockAllocateElasticIp = vi.fn();

// Mutation hooks (mutateAsync)
const mockTerminateInstance = vi.fn();
const mockDeleteVpc = vi.fn();
const mockDeleteSubnet = vi.fn();
const mockDeleteSecurityGroup = vi.fn();
const mockDeleteKeyPair = vi.fn();
const mockDeleteInternetGateway = vi.fn();
const mockDeleteRouteTable = vi.fn();
const mockDeleteNatGateway = vi.fn();
const mockDeleteVolume = vi.fn();
const mockDeleteLaunchTemplate = vi.fn();
const mockReleaseElasticIp = vi.fn();

vi.mock("../hooks/useEC2", () => ({
  useEC2Instances: (...args: any[]) => mockInstances(...args),
  useEC2KeyPairs: (...args: any[]) => mockKeyPairs(...args),
  useEC2Subnets: (...args: any[]) => mockSubnets(...args),
  useEC2SecurityGroups: (...args: any[]) => mockSecurityGroups(...args),
  useEC2Amis: (...args: any[]) => mockAmis(...args),
  useEC2LaunchTemplates: (...args: any[]) => mockLaunchTemplates(...args),
  useEC2Vpcs: (...args: any[]) => mockVpcs(...args),
  useEC2Vpc: (...args: any[]) => mockVpc(...args),
  useEC2ElasticIps: (...args: any[]) => mockElasticIps(...args),
  useEC2InternetGateways: (...args: any[]) => mockInternetGateways(...args),
  useEC2RouteTables: (...args: any[]) => mockRouteTables(...args),
  useEC2NatGateways: (...args: any[]) => mockNatGateways(...args),
  useEC2Volumes: (...args: any[]) => mockVolumes(...args),
  useEC2NetworkInterfaces: (...args: any[]) => mockNetworkInterfaces(...args),
  useEC2RunInstance: () => ({ mutate: mockRunInstance, isPending: false, isError: false, error: null }),
  useEC2StartInstance: () => ({ mutate: mockStartInstance, isPending: false }),
  useEC2StopInstance: () => ({ mutate: mockStopInstance, isPending: false }),
  useEC2RebootInstance: () => ({ mutate: mockRebootInstance, isPending: false }),
  useEC2TerminateInstance: () => ({ mutateAsync: mockTerminateInstance, isPending: false }),
  useEC2CreateVpc: () => ({ mutate: mockCreateVpc, isPending: false }),
  useEC2DeleteVpc: () => ({ mutateAsync: mockDeleteVpc, isPending: false }),
  useEC2CreateSubnet: () => ({ mutate: mockCreateSubnet, isPending: false }),
  useEC2DeleteSubnet: () => ({ mutateAsync: mockDeleteSubnet, isPending: false }),
  useEC2CreateSecurityGroup: () => ({ mutate: mockCreateSecurityGroup, isPending: false }),
  useEC2DeleteSecurityGroup: () => ({ mutateAsync: mockDeleteSecurityGroup, isPending: false }),
  useEC2AuthorizeIngress: () => ({ mutate: mockAuthorizeIngress, isPending: false }),
  useEC2RevokeIngress: () => ({ mutate: mockRevokeIngress, isPending: false }),
  useEC2CreateKeyPair: () => ({ mutate: mockCreateKeyPair, isPending: false }),
  useEC2ImportKeyPair: () => ({ mutate: mockImportKeyPair, isPending: false }),
  useEC2DeleteKeyPair: () => ({ mutateAsync: mockDeleteKeyPair, isPending: false }),
  useEC2CreateInternetGateway: () => ({ mutate: mockCreateInternetGateway, isPending: false }),
  useEC2DeleteInternetGateway: () => ({ mutateAsync: mockDeleteInternetGateway, isPending: false }),
  useEC2AttachInternetGateway: () => ({ mutate: mockAttachInternetGateway, isPending: false }),
  useEC2DetachInternetGateway: () => ({ mutate: mockDetachInternetGateway, isPending: false }),
  useEC2CreateRouteTable: () => ({ mutate: mockCreateRouteTable, isPending: false }),
  useEC2DeleteRouteTable: () => ({ mutateAsync: mockDeleteRouteTable, isPending: false }),
  useEC2CreateNatGateway: () => ({ mutate: mockCreateNatGateway, isPending: false }),
  useEC2DeleteNatGateway: () => ({ mutateAsync: mockDeleteNatGateway, isPending: false }),
  useEC2CreateVolume: () => ({ mutate: mockCreateVolume, isPending: false }),
  useEC2DeleteVolume: () => ({ mutateAsync: mockDeleteVolume, isPending: false }),
  useEC2CreateLaunchTemplate: () => ({ mutate: mockCreateLaunchTemplate, isPending: false }),
  useEC2DeleteLaunchTemplate: () => ({ mutateAsync: mockDeleteLaunchTemplate, isPending: false }),
  useEC2AllocateElasticIp: () => ({ mutate: mockAllocateElasticIp, isPending: false }),
  useEC2ReleaseElasticIp: () => ({ mutateAsync: mockReleaseElasticIp, isPending: false }),
  useEC2ModifyVpc: () => ({ mutate: vi.fn(), isPending: false }),
  useEC2ModifyInstance: () => ({ mutate: vi.fn(), isPending: false }),
}));

// ─── Static imports (after mock) ───────────────────────

import EC2Page, { EC2InstanceList, EC2LaunchTemplateList } from "./EC2Page";

// ─── Tests ─────────────────────────────────────────────

describe("EC2InstanceList — AMI auto-detection", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock returns for hooks used by EC2InstanceList
    mockInstances.mockReturnValue({
      data: { instances: [], total: 0 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockKeyPairs.mockReturnValue({ data: { keyPairs: [] } });
    mockSubnets.mockReturnValue({ data: { subnets: [] } });
    mockSecurityGroups.mockReturnValue({ data: { securityGroups: [] } });
  });

  it("auto-selects first AMI from catalog when launch modal opens", async () => {
    mockAmis.mockReturnValue({
      data: {
        images: [
          { id: "ami-0abc", name: "Amazon Linux 2023", platform: "Linux", architecture: "x86_64", state: "available" },
          { id: "ami-0def", name: "Ubuntu 22.04", platform: "Linux", architecture: "arm64", state: "available" },
        ],
        total: 2,
      },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<EC2InstanceList onSelect={vi.fn()} />, { wrapper: createWrapper() });

    // Verify the initial form state uses the hardcoded default
    // (The Select isn't visible yet because the modal is closed)

    // Open the launch modal
    await clickButton(user, /create/i);

    // The auto-detection useEffect should have selected the first AMI
    // The Cloudscape Select button displays the selected AMI ID
    await waitFor(() => {
      // Find buttons in the modal that contain the auto-detected AMI ID
      const amiButtons = screen.getAllByRole("button");
      const autoSelected = amiButtons.find(b => b.textContent?.includes("ami-0abc"));
      expect(autoSelected).toBeTruthy();
      // Verify it's NOT the old default
      const oldDefault = amiButtons.find(b => b.textContent?.includes("ami-0abcdef1234567891"));
      expect(oldDefault).toBeFalsy();
    });
  });

  it("renders fallback Input when AMI catalog is empty", async () => {
    mockAmis.mockReturnValue({
      data: { images: [], total: 0 },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<EC2InstanceList onSelect={vi.fn()} />, { wrapper: createWrapper() });

    // Open the launch modal
    await clickButton(user, /create/i);

    // When no AMIs, the component renders an Input with placeholder "ami-xxx"
    await waitFor(() => {
      expect(screen.getByPlaceholderText("ami-xxx")).toBeTruthy();
    });
  });

  it("renders fallback Input when AMIs are still loading", async () => {
    mockAmis.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const user = userEvent.setup();
    render(<EC2InstanceList onSelect={vi.fn()} />, { wrapper: createWrapper() });

    await clickButton(user, /create/i);

    // While loading, no images means we show the Input fallback
    await waitFor(() => {
      expect(screen.getByPlaceholderText("ami-xxx")).toBeTruthy();
    });
  });
});

describe("EC2LaunchTemplateList — AMI auto-detection", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockLaunchTemplates.mockReturnValue({
      data: { launchTemplates: [], total: 0 },
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it("auto-selects first AMI from catalog when create modal opens", async () => {
    mockAmis.mockReturnValue({
      data: {
        images: [
          { id: "ami-001", name: "Test Image", platform: "Linux", architecture: "x86_64", state: "available" },
        ],
        total: 1,
      },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<EC2LaunchTemplateList />, { wrapper: createWrapper() });

    // Open the create modal
    await clickButton(user, /create/i);

    // Verify the auto-detected AMI is selected
    await waitFor(() => {
      const buttons = screen.getAllByRole("button");
      const amiSelected = buttons.find(b => b.textContent?.includes("ami-001"));
      expect(amiSelected).toBeTruthy();
      // Not the old default
      const oldDefault = buttons.find(b => b.textContent?.includes("ami-0abcdef1234567891"));
      expect(oldDefault).toBeFalsy();
    });
  });

  it("renders fallback Input when AMI catalog is empty", async () => {
    mockAmis.mockReturnValue({
      data: { images: [], total: 0 },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<EC2LaunchTemplateList />, { wrapper: createWrapper() });

    const createButtons = screen.getAllByRole("button", { name: /create/i });
    await user.click(createButtons[0]);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("ami-xxx")).toBeTruthy();
    });
  });

  it("renders fallback Input when AMIs are loading", async () => {
    mockAmis.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const user = userEvent.setup();
    render(<EC2LaunchTemplateList />, { wrapper: createWrapper() });

    const createButtons = screen.getAllByRole("button", { name: /create/i });
    await user.click(createButtons[0]);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("ami-xxx")).toBeTruthy();
    });
  });
});

describe("EC2InstanceList — list states", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockInstances.mockReturnValue({
      data: { instances: [], total: 0 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockKeyPairs.mockReturnValue({ data: { keyPairs: [] } });
    mockSubnets.mockReturnValue({ data: { subnets: [] } });
    mockSecurityGroups.mockReturnValue({ data: { securityGroups: [] } });
    mockAmis.mockReturnValue({ data: { images: [] }, isLoading: false });
  });

  it("renders instances from data", () => {
    mockInstances.mockReturnValue({
      data: {
        instances: [
          {
            id: "i-0abc123",
            state: "running",
            instanceType: "t2.micro",
            privateIp: "10.0.0.1",
            publicIp: "54.0.0.1",
            launchTime: "2024-01-01T00:00:00Z",
            keyName: "my-key",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<EC2InstanceList onSelect={vi.fn()} />, { wrapper: createWrapper() });

    expect(screen.getAllByText("i-0abc123").length).toBeGreaterThan(0);
    expect(screen.getAllByText("t2.micro").length).toBeGreaterThan(0);
  });

  it("shows empty state when no instances", () => {
    mockInstances.mockReturnValue({
      data: { instances: [], total: 0 },
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<EC2InstanceList onSelect={vi.fn()} />, { wrapper: createWrapper() });

    expect(screen.getByText("No instances found")).toBeTruthy();
  });

  it("shows error state when loading fails", () => {
    mockInstances.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("boom-instances"),
    });

    render(<EC2InstanceList onSelect={vi.fn()} />, { wrapper: createWrapper() });

    expect(screen.getByText("boom-instances")).toBeTruthy();
  });

  it("shows loading state while instances load", () => {
    mockInstances.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    render(<EC2InstanceList onSelect={vi.fn()} />, { wrapper: createWrapper() });

    expect(screen.getByText("Loading resources...")).toBeTruthy();
  });
});

describe("EC2LaunchTemplateList — list states", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockLaunchTemplates.mockReturnValue({
      data: { launchTemplates: [], total: 0 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockAmis.mockReturnValue({ data: { images: [] }, isLoading: false });
  });

  it("renders launch templates from data", () => {
    mockLaunchTemplates.mockReturnValue({
      data: {
        launchTemplates: [
          { name: "my-template", id: "lt-0abc", creationDate: "2024-01-01" },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<EC2LaunchTemplateList />, { wrapper: createWrapper() });

    expect(screen.getAllByText("my-template").length).toBeGreaterThan(0);
    expect(screen.getAllByText("lt-0abc").length).toBeGreaterThan(0);
  });

  it("shows empty state when no launch templates", () => {
    mockLaunchTemplates.mockReturnValue({
      data: { launchTemplates: [], total: 0 },
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<EC2LaunchTemplateList />, { wrapper: createWrapper() });

    expect(screen.getByText("No launch templates")).toBeTruthy();
  });

  it("shows error state when loading fails", () => {
    mockLaunchTemplates.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("boom-templates"),
    });

    render(<EC2LaunchTemplateList />, { wrapper: createWrapper() });

    expect(screen.getByText("boom-templates")).toBeTruthy();
  });

  it("shows loading state while launch templates load", () => {
    mockLaunchTemplates.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    render(<EC2LaunchTemplateList />, { wrapper: createWrapper() });

    expect(screen.getByText("Loading resources...")).toBeTruthy();
  });
});

// ─── Helpers for tab-based sub-component tests ─────────
//
// The sub-components (EC2VpcList, EC2SubnetList, …) are NOT named exports of
// EC2Page.tsx, so they cannot be imported directly. They are rendered as the
// content of Cloudscape <Tabs>, which only mounts the *active* tab's panel.
// We therefore test them through the default `EC2Page` export: render the page
// (wrapped in a Router, because EC2Page uses useNavigate) and click the tab we
// want to exercise.

function pageWrapper() {
  const Wrapper = createWrapper();
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <Wrapper>{children}</Wrapper>
    </MemoryRouter>
  );
}

async function goToTab(user: UserEvent, name: RegExp) {
  await user.click(screen.getByRole("tab", { name }));
}

/** Click the last button whose accessible name exactly matches `name`. */
async function clickLastButton(user: UserEvent, name: RegExp) {
  const buttons = screen.getAllByRole("button", { name });
  await user.click(buttons[buttons.length - 1]);
  return buttons[buttons.length - 1];
}

/** Open a Cloudscape Select (by its trigger-button text) and pick an option. */
async function pickSelectOption(user: UserEvent, triggerText: RegExp, optionText: RegExp) {
  const trigger = screen.getAllByRole("button").find((b) => triggerText.test(b.textContent || ""));
  if (!trigger) throw new Error(`Select trigger matching ${triggerText} not found`);
  await user.click(trigger);
  const option = (await screen.findAllByRole("option")).find((o) => optionText.test(o.textContent || ""));
  if (!option) throw new Error(`Select option matching ${optionText} not found`);
  await user.click(option);
}

/** Set every query hook to a safe empty/default return value. */
function setupDefaults() {
  mockInstances.mockReturnValue({ data: { instances: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockKeyPairs.mockReturnValue({ data: { keyPairs: [], total: 0 } });
  mockSubnets.mockReturnValue({ data: { subnets: [], total: 0 } });
  mockSecurityGroups.mockReturnValue({ data: { securityGroups: [], total: 0 } });
  mockAmis.mockReturnValue({ data: { images: [], total: 0 }, isLoading: false });
  mockLaunchTemplates.mockReturnValue({ data: { launchTemplates: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockVpcs.mockReturnValue({ data: { vpcs: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockVpc.mockReturnValue({ data: null, isLoading: false, isError: false, error: null });
  mockElasticIps.mockReturnValue({ data: { addresses: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockInternetGateways.mockReturnValue({ data: { internetGateways: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockRouteTables.mockReturnValue({ data: { routeTables: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockNatGateways.mockReturnValue({ data: { natGateways: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockVolumes.mockReturnValue({ data: { volumes: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockNetworkInterfaces.mockReturnValue({ data: { networkInterfaces: [], total: 0 }, isLoading: false, isError: false, error: null });
}

// ─── VPCs ──────────────────────────────────────────────

describe("EC2VpcList (EC2Page — VPCs tab)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("renders VPCs from data", async () => {
    mockVpcs.mockReturnValue({
      data: { vpcs: [{ id: "vpc-abc", state: "available", cidrBlock: "10.0.0.0/16", isDefault: false, instanceTenancy: "default" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /VPCs/i);
    await waitFor(() => expect(screen.getAllByText("vpc-abc").length).toBeGreaterThan(0));
    expect(screen.getAllByText("10.0.0.0/16").length).toBeGreaterThan(0);
  });

  it("shows empty state", async () => {
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /VPCs/i);
    await waitFor(() => expect(screen.getByText("No VPCs found")).toBeTruthy());
  });

  it("shows loading state", async () => {
    mockVpcs.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /VPCs/i);
    await waitFor(() => expect(screen.getByText("Loading resources...")).toBeTruthy());
  });

  it("shows error state", async () => {
    mockVpcs.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("boom-vpc") });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /VPCs/i);
    await waitFor(() => expect(screen.getByText("boom-vpc")).toBeTruthy());
  });

  it("create VPC calls createVpc.mutate with the cidr block", async () => {
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /VPCs/i);
    await waitFor(() => expect(screen.getByText("No VPCs found")).toBeTruthy());
    await clickButton(user, /Create VPC/i);
    await waitFor(() => expect(screen.getAllByText("Create VPC").length).toBeGreaterThan(0));
    await clickLastButton(user, /^Create$/i);
    await waitFor(() => expect(mockCreateVpc).toHaveBeenCalled());
    expect(mockCreateVpc.mock.calls[0][0]).toEqual({ cidrBlock: "10.0.0.0/16" });
  });

  it("delete VPC calls deleteVpc.mutateAsync with the id", async () => {
    mockVpcs.mockReturnValue({
      data: { vpcs: [{ id: "vpc-del", state: "available", cidrBlock: "10.0.0.0/16", isDefault: false, instanceTenancy: "default" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /VPCs/i);
    await waitFor(() => expect(screen.getAllByText("vpc-del").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("button", { name: /Delete vpc-del/i }));
    await waitFor(() => expect(screen.getAllByText("Delete VPC").length).toBeGreaterThan(0));
    await clickLastButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteVpc).toHaveBeenCalledWith("vpc-del"));
  });
});

// ─── VPC Detail ────────────────────────────────────────

describe("EC2VpcDetail (EC2Page — VPCs tab → open VPC)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
    mockVpcs.mockReturnValue({
      data: { vpcs: [{ id: "vpc-detail", state: "available", cidrBlock: "10.1.0.0/16", isDefault: false, instanceTenancy: "default" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
  });

  it("renders the detail view with back button and attributes", async () => {
    mockVpc.mockReturnValue({
      data: { id: "vpc-detail", state: "available", cidrBlock: "10.1.0.0/16", isDefault: false, instanceTenancy: "default" },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /VPCs/i);
    await waitFor(() => expect(screen.getAllByText("vpc-detail").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("button", { name: "vpc-detail" }));
    await waitFor(() => expect(screen.getByText("Back to VPCs")).toBeTruthy());
    expect(screen.getAllByText("10.1.0.0/16").length).toBeGreaterThan(0);
  });

  it("shows loading state", async () => {
    mockVpc.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /VPCs/i);
    await user.click(screen.getByRole("button", { name: "vpc-detail" }));
    await waitFor(() => expect(screen.getByText("Loading VPC details...")).toBeTruthy());
  });

  it("shows error state", async () => {
    mockVpc.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("boom-vpc-detail") });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /VPCs/i);
    await user.click(screen.getByRole("button", { name: "vpc-detail" }));
    await waitFor(() => expect(screen.getByText("boom-vpc-detail")).toBeTruthy());
  });
});

// ─── Subnets ───────────────────────────────────────────

describe("EC2SubnetList (EC2Page — Subnets tab)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
    mockVpcs.mockReturnValue({
      data: { vpcs: [{ id: "vpc-1", cidrBlock: "10.0.0.0/16" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
  });

  it("renders subnets from data", async () => {
    mockSubnets.mockReturnValue({
      data: { subnets: [{ id: "subnet-1", vpcId: "vpc-1", cidrBlock: "10.0.1.0/24", availabilityZone: "us-east-1a", state: "available", availableIpCount: 251 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Subnets/i);
    await waitFor(() => expect(screen.getAllByText("subnet-1").length).toBeGreaterThan(0));
    expect(screen.getAllByText("10.0.1.0/24").length).toBeGreaterThan(0);
  });

  it("shows empty state", async () => {
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Subnets/i);
    await waitFor(() => expect(screen.getByText("No subnets found")).toBeTruthy());
  });

  it("shows loading state", async () => {
    mockSubnets.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Subnets/i);
    await waitFor(() => expect(screen.getByText("Loading resources...")).toBeTruthy());
  });

  it("shows error state", async () => {
    mockSubnets.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("boom-subnet") });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Subnets/i);
    await waitFor(() => expect(screen.getByText("boom-subnet")).toBeTruthy());
  });

  it("create subnet (pick VPC via Select) calls createSubnet.mutate", async () => {
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Subnets/i);
    await waitFor(() => expect(screen.getByText("No subnets found")).toBeTruthy());
    await clickButton(user, /Create Subnet/i);
    await waitFor(() => expect(screen.getAllByText("Create Subnet").length).toBeGreaterThan(0));
    await pickSelectOption(user, /Select a VPC/i, /vpc-1/);
    await clickLastButton(user, /^Create$/i);
    await waitFor(() => expect(mockCreateSubnet).toHaveBeenCalled());
    expect(mockCreateSubnet.mock.calls[0][0]).toEqual({ vpcId: "vpc-1", cidrBlock: "10.0.1.0/24", availabilityZone: "" });
  });

  it("delete subnet calls deleteSubnet.mutateAsync with the id", async () => {
    mockSubnets.mockReturnValue({
      data: { subnets: [{ id: "subnet-del", vpcId: "vpc-1", cidrBlock: "10.0.1.0/24", availabilityZone: "us-east-1a", state: "available", availableIpCount: 251 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Subnets/i);
    await waitFor(() => expect(screen.getAllByText("subnet-del").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("button", { name: /Delete subnet-del/i }));
    await waitFor(() => expect(screen.getAllByText("Delete subnet").length).toBeGreaterThan(0));
    await clickLastButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteSubnet).toHaveBeenCalledWith("subnet-del"));
  });
});

// ─── Security Groups ───────────────────────────────────

describe("EC2SecurityGroupList (EC2Page — Security Groups tab)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("renders security groups from data", async () => {
    mockSecurityGroups.mockReturnValue({
      data: { securityGroups: [{ id: "sg-1", name: "my-sg", description: "desc", vpcId: "vpc-1", inboundRules: [{ ipProtocol: "tcp", fromPort: 22, toPort: 22 }] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Security Groups/i);
    await waitFor(() => expect(screen.getAllByText("my-sg").length).toBeGreaterThan(0));
  });

  it("shows empty state", async () => {
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Security Groups/i);
    await waitFor(() => expect(screen.getByText("No security groups found")).toBeTruthy());
  });

  it("shows loading state", async () => {
    mockSecurityGroups.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Security Groups/i);
    await waitFor(() => expect(screen.getByText("Loading resources...")).toBeTruthy());
  });

  it("shows error state", async () => {
    mockSecurityGroups.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("boom-sg") });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Security Groups/i);
    await waitFor(() => expect(screen.getByText("boom-sg")).toBeTruthy());
  });

  it("create security group calls createSecurityGroup.mutate", async () => {
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Security Groups/i);
    await waitFor(() => expect(screen.getByText("No security groups found")).toBeTruthy());
    await clickButton(user, /Create Security Group/i);
    await waitFor(() => expect(screen.getAllByText("Create Security Group").length).toBeGreaterThan(0));
    await user.type(screen.getByPlaceholderText("my-sg"), "web-sg");
    await clickLastButton(user, /^Create$/i);
    await waitFor(() => expect(mockCreateSecurityGroup).toHaveBeenCalled());
    expect(mockCreateSecurityGroup.mock.calls[0][0]).toEqual({ groupName: "web-sg", description: "", vpcId: "" });
  });

  it("add ingress rule calls authorizeIngress.mutate", async () => {
    mockSecurityGroups.mockReturnValue({
      data: { securityGroups: [{ id: "sg-1", name: "my-sg", description: "desc", vpcId: "vpc-1", inboundRules: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Security Groups/i);
    await waitFor(() => expect(screen.getAllByText("my-sg").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("button", { name: "Add rule" }));
    await waitFor(() => expect(screen.getAllByText("Add Inbound Rule").length).toBeGreaterThan(0));
    await clickLastButton(user, /^Add$/i);
    await waitFor(() => expect(mockAuthorizeIngress).toHaveBeenCalled());
    expect(mockAuthorizeIngress.mock.calls[0][0]).toEqual({ groupId: "sg-1", ipProtocol: "tcp", fromPort: 22, toPort: 22, cidrIp: "0.0.0.0/0" });
  });

  it("delete security group calls deleteSecurityGroup.mutateAsync", async () => {
    mockSecurityGroups.mockReturnValue({
      data: { securityGroups: [{ id: "sg-del", name: "del-sg", description: "desc", vpcId: "vpc-1", inboundRules: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Security Groups/i);
    await waitFor(() => expect(screen.getAllByText("del-sg").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("button", { name: /Delete del-sg/i }));
    await waitFor(() => expect(screen.getAllByText("Delete security group").length).toBeGreaterThan(0));
    await clickLastButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteSecurityGroup).toHaveBeenCalledWith("sg-del"));
  });
});

// ─── Key Pairs ─────────────────────────────────────────

describe("EC2KeyPairList (EC2Page — Key Pairs tab)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("renders key pairs from data", async () => {
    mockKeyPairs.mockReturnValue({
      data: { keyPairs: [{ name: "kp-1", fingerprint: "aa:bb", type: "rsa" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Key Pairs/i);
    await waitFor(() => expect(screen.getAllByText("kp-1").length).toBeGreaterThan(0));
  });

  it("shows empty state", async () => {
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Key Pairs/i);
    await waitFor(() => expect(screen.getByText("No key pairs found")).toBeTruthy());
  });

  it("shows loading state", async () => {
    mockKeyPairs.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Key Pairs/i);
    await waitFor(() => expect(screen.getByText("Loading resources...")).toBeTruthy());
  });

  it("shows error state", async () => {
    mockKeyPairs.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("boom-kp") });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Key Pairs/i);
    await waitFor(() => expect(screen.getByText("boom-kp")).toBeTruthy());
  });

  it("create key pair calls createKeyPair.mutate", async () => {
    mockCreateKeyPair.mockImplementation((_d: any, opts: any) => opts?.onSuccess?.({ keyMaterial: "PEM" }));
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Key Pairs/i);
    await waitFor(() => expect(screen.getByText("No key pairs found")).toBeTruthy());
    await clickButton(user, /Create Key Pair/i);
    await waitFor(() => expect(screen.getAllByText("Create Key Pair").length).toBeGreaterThan(0));
    await user.type(screen.getByPlaceholderText("my-key"), "new-key");
    await clickLastButton(user, /^Create$/i);
    await waitFor(() => expect(mockCreateKeyPair).toHaveBeenCalled());
    expect(mockCreateKeyPair.mock.calls[0][0]).toEqual({ keyName: "new-key", keyType: "rsa" });
  });

  it("import key pair calls importKeyPair.mutate", async () => {
    mockImportKeyPair.mockImplementation((_d: any, opts: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Key Pairs/i);
    await waitFor(() => expect(screen.getByText("No key pairs found")).toBeTruthy());
    await clickButton(user, /Import Key Pair/i);
    await waitFor(() => expect(screen.getAllByText("Import Key Pair").length).toBeGreaterThan(0));
    await user.type(screen.getByPlaceholderText("my-imported-key"), "imp-key");
    await user.type(screen.getByPlaceholderText("ssh-rsa AAAA..."), "ssh-rsa AAAAB3Nza");
    await clickLastButton(user, /^Import$/i);
    await waitFor(() => expect(mockImportKeyPair).toHaveBeenCalled());
    expect(mockImportKeyPair.mock.calls[0][0]).toEqual({ keyName: "imp-key", publicKeyMaterial: "ssh-rsa AAAAB3Nza" });
  });

  it("delete key pair calls deleteKeyPair.mutateAsync", async () => {
    mockKeyPairs.mockReturnValue({
      data: { keyPairs: [{ name: "del-key", fingerprint: "aa:bb", type: "rsa" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Key Pairs/i);
    await waitFor(() => expect(screen.getAllByText("del-key").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("button", { name: /Delete del-key/i }));
    await waitFor(() => expect(screen.getAllByText("Delete key pair").length).toBeGreaterThan(0));
    await clickLastButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteKeyPair).toHaveBeenCalledWith("del-key"));
  });
});

// ─── Elastic IPs ───────────────────────────────────────

describe("EC2ElasticIpList (EC2Page — Elastic IPs tab)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("renders elastic IPs from data", async () => {
    mockElasticIps.mockReturnValue({
      data: { addresses: [{ allocationId: "eipalloc-1", publicIp: "203.0.113.1", domain: "vpc" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Elastic IPs/i);
    await waitFor(() => expect(screen.getAllByText("203.0.113.1").length).toBeGreaterThan(0));
  });

  it("shows empty state", async () => {
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Elastic IPs/i);
    await waitFor(() => expect(screen.getByText("No Elastic IPs found")).toBeTruthy());
  });

  it("shows loading state", async () => {
    mockElasticIps.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Elastic IPs/i);
    await waitFor(() => expect(screen.getByText("Loading resources...")).toBeTruthy());
  });

  it("shows error state", async () => {
    mockElasticIps.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("boom-eip") });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Elastic IPs/i);
    await waitFor(() => expect(screen.getByText("boom-eip")).toBeTruthy());
  });

  it("allocate elastic IP calls allocateElasticIp.mutate", async () => {
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Elastic IPs/i);
    await waitFor(() => expect(screen.getByText("No Elastic IPs found")).toBeTruthy());
    await clickButton(user, /Create Elastic IP/i);
    await waitFor(() => expect(screen.getAllByText("Allocate Elastic IP").length).toBeGreaterThan(0));
    await clickLastButton(user, /^Allocate$/i);
    await waitFor(() => expect(mockAllocateElasticIp).toHaveBeenCalled());
  });

  it("release elastic IP calls releaseElasticIp.mutateAsync", async () => {
    mockElasticIps.mockReturnValue({
      data: { addresses: [{ allocationId: "eipalloc-rel", publicIp: "203.0.113.9", domain: "vpc" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Elastic IPs/i);
    await waitFor(() => expect(screen.getAllByText("203.0.113.9").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("button", { name: /Delete 203.0.113.9/i }));
    await waitFor(() => expect(screen.getAllByText("Delete Elastic IP").length).toBeGreaterThan(0));
    await clickLastButton(user, /^Delete$/i);
    await waitFor(() => expect(mockReleaseElasticIp).toHaveBeenCalledWith("eipalloc-rel"));
  });
});

// ─── Internet Gateways ─────────────────────────────────

describe("EC2InternetGatewayList (EC2Page — Internet Gateways tab)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("renders internet gateways from data", async () => {
    mockInternetGateways.mockReturnValue({
      data: { internetGateways: [{ id: "igw-1", attachments: [{ vpcId: "vpc-1", state: "available" }], ownerId: "me" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Internet Gateways/i);
    await waitFor(() => expect(screen.getAllByText("igw-1").length).toBeGreaterThan(0));
  });

  it("shows empty state", async () => {
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Internet Gateways/i);
    await waitFor(() => expect(screen.getByText("No internet gateways")).toBeTruthy());
  });

  it("shows loading state", async () => {
    mockInternetGateways.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Internet Gateways/i);
    await waitFor(() => expect(screen.getByText("Loading resources...")).toBeTruthy());
  });

  it("shows error state", async () => {
    mockInternetGateways.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("boom-igw") });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Internet Gateways/i);
    await waitFor(() => expect(screen.getByText("boom-igw")).toBeTruthy());
  });

  it("create internet gateway calls createInternetGateway.mutate", async () => {
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Internet Gateways/i);
    await waitFor(() => expect(screen.getByText("No internet gateways")).toBeTruthy());
    await clickButton(user, /Create Internet Gateway/i);
    await waitFor(() => expect(screen.getAllByText("Create Internet Gateway").length).toBeGreaterThan(0));
    await clickLastButton(user, /^Create$/i);
    await waitFor(() => expect(mockCreateInternetGateway).toHaveBeenCalled());
  });

  it("attach internet gateway calls attachInternetGateway.mutate", async () => {
    mockInternetGateways.mockReturnValue({
      data: { internetGateways: [{ id: "igw-att", attachments: [], ownerId: "me" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Internet Gateways/i);
    await waitFor(() => expect(screen.getAllByText("igw-att").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("button", { name: "Attach to VPC" }));
    await waitFor(() => expect(screen.getAllByText("Attach to VPC").length).toBeGreaterThan(0));
    await user.type(screen.getByPlaceholderText("vpc-xxx"), "vpc-9");
    await clickLastButton(user, /^Attach$/i);
    await waitFor(() => expect(mockAttachInternetGateway).toHaveBeenCalled());
    expect(mockAttachInternetGateway.mock.calls[0][0]).toEqual({ id: "igw-att", vpcId: "vpc-9" });
  });

  it("delete internet gateway calls deleteInternetGateway.mutateAsync", async () => {
    mockInternetGateways.mockReturnValue({
      data: { internetGateways: [{ id: "igw-del", attachments: [], ownerId: "me" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Internet Gateways/i);
    await waitFor(() => expect(screen.getAllByText("igw-del").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("button", { name: /Delete igw-del/i }));
    await waitFor(() => expect(screen.getAllByText("Delete internet gateway").length).toBeGreaterThan(0));
    await clickLastButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteInternetGateway).toHaveBeenCalledWith("igw-del"));
  });
});

// ─── Route Tables ──────────────────────────────────────

describe("EC2RouteTableList (EC2Page — Route Tables tab)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("renders route tables from data", async () => {
    mockRouteTables.mockReturnValue({
      data: { routeTables: [{ id: "rtb-1", vpcId: "vpc-1", routes: [{ destinationCidrBlock: "0.0.0.0/0" }], associations: [{ id: "a-1", main: false }] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Route Tables/i);
    await waitFor(() => expect(screen.getAllByText("rtb-1").length).toBeGreaterThan(0));
  });

  it("shows empty state", async () => {
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Route Tables/i);
    await waitFor(() => expect(screen.getByText("No route tables")).toBeTruthy());
  });

  it("shows loading state", async () => {
    mockRouteTables.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Route Tables/i);
    await waitFor(() => expect(screen.getByText("Loading resources...")).toBeTruthy());
  });

  it("shows error state", async () => {
    mockRouteTables.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("boom-rtb") });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Route Tables/i);
    await waitFor(() => expect(screen.getByText("boom-rtb")).toBeTruthy());
  });

  it("create route table calls createRouteTable.mutate", async () => {
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Route Tables/i);
    await waitFor(() => expect(screen.getByText("No route tables")).toBeTruthy());
    await clickButton(user, /Create Route Table/i);
    await waitFor(() => expect(screen.getAllByText("Create Route Table").length).toBeGreaterThan(0));
    await user.type(screen.getByPlaceholderText("vpc-xxx"), "vpc-rt");
    await clickLastButton(user, /^Create$/i);
    await waitFor(() => expect(mockCreateRouteTable).toHaveBeenCalledWith({ vpcId: "vpc-rt" }, expect.anything()));
  });

  it("delete route table calls deleteRouteTable.mutateAsync (non-main only)", async () => {
    mockRouteTables.mockReturnValue({
      data: { routeTables: [{ id: "rtb-del", vpcId: "vpc-1", routes: [], associations: [{ id: "a-1", main: false }] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Route Tables/i);
    await waitFor(() => expect(screen.getAllByText("rtb-del").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("button", { name: /Delete rtb-del/i }));
    await waitFor(() => expect(screen.getAllByText("Delete route table").length).toBeGreaterThan(0));
    await clickLastButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteRouteTable).toHaveBeenCalledWith("rtb-del"));
  });
});

// ─── NAT Gateways ──────────────────────────────────────

describe("EC2NatGatewayList (EC2Page — NAT Gateways tab)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("renders NAT gateways from data", async () => {
    mockNatGateways.mockReturnValue({
      data: { natGateways: [{ id: "nat-1", subnetId: "subnet-1", vpcId: "vpc-1", state: "available", natGatewayAddresses: [{ publicIp: "203.0.113.5" }] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /NAT Gateways/i);
    await waitFor(() => expect(screen.getAllByText("nat-1").length).toBeGreaterThan(0));
  });

  it("shows empty state", async () => {
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /NAT Gateways/i);
    await waitFor(() => expect(screen.getByText("No NAT gateways")).toBeTruthy());
  });

  it("shows loading state", async () => {
    mockNatGateways.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /NAT Gateways/i);
    await waitFor(() => expect(screen.getByText("Loading resources...")).toBeTruthy());
  });

  it("shows error state", async () => {
    mockNatGateways.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("boom-nat") });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /NAT Gateways/i);
    await waitFor(() => expect(screen.getByText("boom-nat")).toBeTruthy());
  });

  it("create NAT gateway calls createNatGateway.mutate", async () => {
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /NAT Gateways/i);
    await waitFor(() => expect(screen.getByText("No NAT gateways")).toBeTruthy());
    await clickButton(user, /Create NAT Gateway/i);
    await waitFor(() => expect(screen.getAllByText("Create NAT Gateway").length).toBeGreaterThan(0));
    await user.type(screen.getByPlaceholderText("subnet-xxx"), "subnet-9");
    await user.type(screen.getByPlaceholderText("eipalloc-xxx"), "eipalloc-9");
    await clickLastButton(user, /^Create$/i);
    await waitFor(() => expect(mockCreateNatGateway).toHaveBeenCalled());
    expect(mockCreateNatGateway.mock.calls[0][0]).toEqual({ subnetId: "subnet-9", allocationId: "eipalloc-9" });
  });

  it("delete NAT gateway calls deleteNatGateway.mutateAsync", async () => {
    mockNatGateways.mockReturnValue({
      data: { natGateways: [{ id: "nat-del", subnetId: "subnet-1", vpcId: "vpc-1", state: "available", natGatewayAddresses: [{ publicIp: "203.0.113.5" }] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /NAT Gateways/i);
    await waitFor(() => expect(screen.getAllByText("nat-del").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("button", { name: /Delete nat-del/i }));
    await waitFor(() => expect(screen.getAllByText("Delete NAT gateway").length).toBeGreaterThan(0));
    await clickLastButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteNatGateway).toHaveBeenCalledWith("nat-del"));
  });
});

// ─── Volumes ───────────────────────────────────────────

describe("EC2VolumeList (EC2Page — Volumes tab)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("renders volumes from data", async () => {
    mockVolumes.mockReturnValue({
      data: { volumes: [{ id: "vol-1", size: 8, volumeType: "gp2", state: "available", availabilityZone: "us-east-1a", attachments: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Volumes/i);
    await waitFor(() => expect(screen.getAllByText("vol-1").length).toBeGreaterThan(0));
  });

  it("shows empty state", async () => {
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Volumes/i);
    await waitFor(() => expect(screen.getByText("No volumes")).toBeTruthy());
  });

  it("shows loading state", async () => {
    mockVolumes.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Volumes/i);
    await waitFor(() => expect(screen.getByText("Loading resources...")).toBeTruthy());
  });

  it("shows error state", async () => {
    mockVolumes.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("boom-vol") });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Volumes/i);
    await waitFor(() => expect(screen.getByText("boom-vol")).toBeTruthy());
  });

  it("create volume calls createVolume.mutate", async () => {
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Volumes/i);
    await waitFor(() => expect(screen.getByText("No volumes")).toBeTruthy());
    await clickButton(user, /Create Volume/i);
    await waitFor(() => expect(screen.getAllByText("Create Volume").length).toBeGreaterThan(0));
    await user.type(screen.getByPlaceholderText("us-east-1a"), "us-east-1b");
    await clickLastButton(user, /^Create$/i);
    await waitFor(() => expect(mockCreateVolume).toHaveBeenCalled());
    expect(mockCreateVolume.mock.calls[0][0]).toMatchObject({ availabilityZone: "us-east-1b", size: 8, volumeType: "gp2" });
  });

  it("delete volume calls deleteVolume.mutateAsync (available only)", async () => {
    mockVolumes.mockReturnValue({
      data: { volumes: [{ id: "vol-del", size: 8, volumeType: "gp2", state: "available", availabilityZone: "us-east-1a", attachments: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Volumes/i);
    await waitFor(() => expect(screen.getAllByText("vol-del").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("button", { name: /Delete vol-del/i }));
    await waitFor(() => expect(screen.getAllByText("Delete volume").length).toBeGreaterThan(0));
    await clickLastButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteVolume).toHaveBeenCalledWith("vol-del"));
  });
});

// ─── AMIs (read-only list) ─────────────────────────────

describe("EC2AmiList (EC2Page — AMIs tab)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("renders AMIs from data", async () => {
    mockAmis.mockReturnValue({
      data: { images: [{ id: "ami-1", name: "Linux", description: "d", architecture: "x86_64", state: "available", platform: "Linux" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /AMIs/i);
    await waitFor(() => expect(screen.getAllByText("ami-1").length).toBeGreaterThan(0));
  });

  it("shows empty state", async () => {
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /AMIs/i);
    await waitFor(() => expect(screen.getByText("No AMIs found")).toBeTruthy());
  });

  it("shows error state", async () => {
    mockAmis.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("boom-ami") });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /AMIs/i);
    await waitFor(() => expect(screen.getByText("boom-ami")).toBeTruthy());
  });
});

// ─── Network Interfaces (read-only list) ───────────────

describe("EC2NetworkInterfaceList (EC2Page — Network Interfaces tab)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("renders network interfaces from data", async () => {
    mockNetworkInterfaces.mockReturnValue({
      data: { networkInterfaces: [{ id: "eni-1", vpcId: "vpc-1", subnetId: "subnet-1", privateIp: "10.0.0.5", status: "in-use", instanceId: "i-1" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network Interfaces/i);
    await waitFor(() => expect(screen.getAllByText("eni-1").length).toBeGreaterThan(0));
  });

  it("shows empty state", async () => {
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network Interfaces/i);
    await waitFor(() => expect(screen.getByText("No network interfaces")).toBeTruthy());
  });

  it("shows error state", async () => {
    mockNetworkInterfaces.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("boom-eni") });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network Interfaces/i);
    await waitFor(() => expect(screen.getByText("boom-eni")).toBeTruthy());
  });
});

// ─── EC2Page shell (breadcrumbs / default tab) ─────────

describe("EC2Page shell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("renders breadcrumbs and opens on the Instances tab by default", async () => {
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    // Header description is unique to the EC2 page header
    expect(screen.getByText("Amazon Elastic Compute Cloud")).toBeTruthy();
    const instancesTab = screen.getByRole("tab", { name: /Instances/i });
    expect(instancesTab.getAttribute("aria-selected")).toBe("true");
    // instances empty state is visible before any tab switch
    expect(screen.getByText("No instances found")).toBeTruthy();
    // breadcrumb items exist
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
  });

  it("switching tabs unmounts the previous panel content", async () => {
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    expect(screen.getByText("No instances found")).toBeTruthy();
    await goToTab(user, /VPCs/i);
    await waitFor(() => expect(screen.getByText("No VPCs found")).toBeTruthy());
    // instances panel content is no longer mounted
    expect(screen.queryByText("No instances found")).toBeNull();
  });
});
