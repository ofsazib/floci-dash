// @vitest-environment happy-dom
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
const mockInstanceDetail = vi.fn();

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

// Mutable error state for mutation hooks
let mockRunInstanceIsError = false;
let mockRunInstanceError: Error | null = null;

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

// Hoisted delete/action states for loading/error branches
const deleteVpcState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const deleteSubnetState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const deleteSgState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const deleteKeyPairState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const deleteIgwState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const deleteRtState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const deleteNatState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const deleteVolState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const deleteLtState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const terminateInstanceState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const deleteFlowLogState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const deleteAclState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const createFlowLogState = vi.hoisted(() => ({ isPending: false, isError: false, error: null as Error | null }));
const createAclState = vi.hoisted(() => ({ isPending: false, isError: false, error: null as Error | null }));

vi.mock("../hooks/useEC2", () => ({
  useEC2Instances: (...args: any[]) => mockInstances(...args),
  useEC2KeyPairs: (...args: any[]) => mockKeyPairs(...args),
  useEC2Subnets: (...args: any[]) => mockSubnets(...args),
  useEC2SecurityGroups: (...args: any[]) => mockSecurityGroups(...args),
  useEC2Amis: (...args: any[]) => mockAmis(...args),
  useEC2Instance: (...args: any[]) => mockInstanceDetail(...args),
  useEC2LaunchTemplates: (...args: any[]) => mockLaunchTemplates(...args),
  useEC2Vpcs: (...args: any[]) => mockVpcs(...args),
  useEC2Vpc: (...args: any[]) => mockVpc(...args),
  useEC2ElasticIps: (...args: any[]) => mockElasticIps(...args),
  useEC2InternetGateways: (...args: any[]) => mockInternetGateways(...args),
  useEC2RouteTables: (...args: any[]) => mockRouteTables(...args),
  useEC2NatGateways: (...args: any[]) => mockNatGateways(...args),
  useEC2Volumes: (...args: any[]) => mockVolumes(...args),
  useEC2NetworkInterfaces: (...args: any[]) => mockNetworkInterfaces(...args),
  useEC2RunInstance: () => ({ mutate: mockRunInstance, isPending: false, isError: mockRunInstanceIsError, error: mockRunInstanceError }),
  useEC2StartInstance: () => ({ mutate: mockStartInstance, isPending: false }),
  useEC2StopInstance: () => ({ mutate: mockStopInstance, isPending: false }),
  useEC2RebootInstance: () => ({ mutate: mockRebootInstance, isPending: false }),
  useEC2TerminateInstance: () => ({ mutateAsync: mockTerminateInstance, ...terminateInstanceState }),
  useEC2CreateVpc: () => ({ mutate: mockCreateVpc, isPending: false }),
  useEC2DeleteVpc: () => ({ mutateAsync: mockDeleteVpc, ...deleteVpcState }),
  useEC2CreateSubnet: () => ({ mutate: mockCreateSubnet, isPending: false }),
  useEC2DeleteSubnet: () => ({ mutateAsync: mockDeleteSubnet, ...deleteSubnetState }),
  useEC2CreateSecurityGroup: () => ({ mutate: mockCreateSecurityGroup, isPending: false }),
  useEC2DeleteSecurityGroup: () => ({ mutateAsync: mockDeleteSecurityGroup, ...deleteSgState }),
  useEC2AuthorizeIngress: () => ({ mutate: mockAuthorizeIngress, isPending: false }),
  useEC2RevokeIngress: () => ({ mutate: mockRevokeIngress, isPending: false }),
  useEC2CreateKeyPair: () => ({ mutate: mockCreateKeyPair, isPending: false }),
  useEC2ImportKeyPair: () => ({ mutate: mockImportKeyPair, isPending: false }),
  useEC2DeleteKeyPair: () => ({ mutateAsync: mockDeleteKeyPair, ...deleteKeyPairState }),
  useEC2CreateInternetGateway: () => ({ mutate: mockCreateInternetGateway, isPending: false }),
  useEC2DeleteInternetGateway: () => ({ mutateAsync: mockDeleteInternetGateway, ...deleteIgwState }),
  useEC2AttachInternetGateway: () => ({ mutate: mockAttachInternetGateway, isPending: false }),
  useEC2DetachInternetGateway: () => ({ mutate: mockDetachInternetGateway, isPending: false }),
  useEC2CreateRouteTable: () => ({ mutate: mockCreateRouteTable, isPending: false }),
  useEC2DeleteRouteTable: () => ({ mutateAsync: mockDeleteRouteTable, ...deleteRtState }),
  useEC2CreateNatGateway: () => ({ mutate: mockCreateNatGateway, isPending: false }),
  useEC2DeleteNatGateway: () => ({ mutateAsync: mockDeleteNatGateway, ...deleteNatState }),
  useEC2CreateVolume: () => ({ mutate: mockCreateVolume, isPending: false }),
  useEC2DeleteVolume: () => ({ mutateAsync: mockDeleteVolume, ...deleteVolState }),
  useEC2CreateLaunchTemplate: () => ({ mutate: mockCreateLaunchTemplate, isPending: false }),
  useEC2DeleteLaunchTemplate: () => ({ mutateAsync: mockDeleteLaunchTemplate, ...deleteLtState }),
  useEC2AllocateElasticIp: () => ({ mutate: mockAllocateElasticIp, isPending: false }),
  useEC2ReleaseElasticIp: () => ({ mutateAsync: mockReleaseElasticIp, isPending: false }),
  useEC2ModifyVpc: () => ({ mutate: vi.fn(), isPending: false }),
  useEC2ModifyInstance: () => ({ mutate: vi.fn(), isPending: false }),
}));

// ─── Flow Logs & Network ACLs mock ─────────────────────

const mockFlowLogs = vi.fn();
const mockCreateFlowLog = vi.fn();
const mockDeleteFlowLog = vi.fn();
const mockNetworkAcls = vi.fn();
const mockCreateNetworkAcl = vi.fn();
const mockDeleteNetworkAcl = vi.fn();
const mockCreateAclEntry = vi.fn();
const mockDeleteAclEntry = vi.fn();

const createAclEntryState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

vi.mock("../hooks/useEC2FlowLogs", () => ({
  useEC2FlowLogs: (...args: any[]) => mockFlowLogs(...args),
  useEC2CreateFlowLog: () => ({ mutate: mockCreateFlowLog, ...createFlowLogState }),
  useEC2DeleteFlowLog: () => ({ mutateAsync: mockDeleteFlowLog, ...deleteFlowLogState }),
}));

vi.mock("../hooks/useEC2NetworkAcls", () => ({
  useEC2NetworkAcls: (...args: any[]) => mockNetworkAcls(...args),
  useEC2CreateNetworkAcl: () => ({ mutate: mockCreateNetworkAcl, ...createAclState }),
  useEC2DeleteNetworkAcl: () => ({ mutateAsync: mockDeleteNetworkAcl, ...deleteAclState }),
  useEC2CreateNetworkAclEntry: () => ({
    mutate: mockCreateAclEntry,
    isPending: createAclEntryState.isPending,
    isError: createAclEntryState.isError,
    error: createAclEntryState.error,
    reset: vi.fn(),
  }),
  useEC2DeleteNetworkAclEntry: () => ({ mutate: mockDeleteAclEntry, isPending: false }),
}));

// ─── Static imports (after mock) ───────────────────────

import EC2Page, { EC2InstanceList, EC2LaunchTemplateList } from "./EC2Page";

// Global reset for all hoisted states
beforeEach(() => {
  deleteVpcState.isPending = false; deleteVpcState.variables = null;
  deleteSubnetState.isPending = false; deleteSubnetState.variables = null;
  deleteSgState.isPending = false; deleteSgState.variables = null;
  deleteKeyPairState.isPending = false; deleteKeyPairState.variables = null;
  deleteIgwState.isPending = false; deleteIgwState.variables = null;
  deleteRtState.isPending = false; deleteRtState.variables = null;
  deleteNatState.isPending = false; deleteNatState.variables = null;
  deleteVolState.isPending = false; deleteVolState.variables = null;
  deleteLtState.isPending = false; deleteLtState.variables = null;
  terminateInstanceState.isPending = false; terminateInstanceState.variables = null;
  deleteFlowLogState.isPending = false; deleteFlowLogState.variables = null;
  deleteAclState.isPending = false; deleteAclState.variables = null;
  createFlowLogState.isPending = false; createFlowLogState.isError = false; createFlowLogState.error = null;
  createAclState.isPending = false; createAclState.isError = false; createAclState.error = null;
});

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
  mockInstanceDetail.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null });
  mockFlowLogs.mockReturnValue({ data: { flowLogs: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockNetworkAcls.mockReturnValue({ data: { networkAcls: [], total: 0 }, isLoading: false, isError: false, error: null });
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

// ─── Flow Logs ────────────────────────────────────────────

describe("EC2FlowLogList (EC2Page — Flow Logs tab)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("renders flow logs from data", async () => {
    mockFlowLogs.mockReturnValue({
      data: { flowLogs: [{ flowLogId: "fl-1", logGroupName: "/aws/flowlogs", trafficType: "ALL", flowLogStatus: "ACTIVE", resourceId: "eni-1" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Flow Logs/i);
    await waitFor(() => expect(screen.getAllByText("fl-1").length).toBeGreaterThan(0));
  });
});

// ─── Network ACLs ────────────────────────────────────────

describe("EC2NetworkAclList (EC2Page — Network ACLs tab)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("renders network ACLs from data", async () => {
    mockNetworkAcls.mockReturnValue({
      data: { networkAcls: [{ networkAclId: "acl-1", vpcId: "vpc-1", isDefault: false }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network ACLs/i);
    await waitFor(() => expect(screen.getAllByText("acl-1").length).toBeGreaterThan(0));
  });
});

// ─── EC2InstanceDetail ───────────────────────────────────

describe("EC2InstanceDetail (EC2Page — Instances tab → click instance)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
    mockInstances.mockReturnValue({
      data: { instances: [{ id: "i-detail", state: "running", instanceType: "t2.micro", privateIp: "10.0.0.5", publicIp: "54.0.0.5", launchTime: "2024-01-01T00:00:00Z", keyName: "my-key", vpcId: "vpc-1", subnetId: "subnet-1", imageId: "ami-1", availabilityZone: "us-east-1a", architecture: "x86_64", platform: "Linux", ebsOptimized: false, monitoring: "disabled", rootDeviceName: "/dev/xvda", rootDeviceType: "ebs" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
  });

  it("renders instance detail with header and property table", async () => {
    mockInstanceDetail.mockReturnValue({
      data: { id: "i-detail", instanceType: "t2.micro", state: "running", privateIp: "10.0.0.5", publicIp: "54.0.0.5", launchTime: "2024-01-01T00:00:00Z", keyName: "my-key", vpcId: "vpc-1", subnetId: "subnet-1", imageId: "ami-1", availabilityZone: "us-east-1a", architecture: "x86_64", platform: "Linux", ebsOptimized: false, monitoring: "disabled", rootDeviceName: "/dev/xvda", rootDeviceType: "ebs", sourceDestCheck: true, iamInstanceProfile: null },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await waitFor(() => expect(screen.getAllByText("i-detail").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("button", { name: "i-detail" }));
    await waitFor(() => expect(screen.getByText("Back to Instances")).toBeTruthy());
    expect(screen.getByText("t2.micro")).toBeTruthy();
    expect(screen.getByText("Connection Info")).toBeTruthy();
  });

  it("shows loading state", async () => {
    mockInstanceDetail.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await waitFor(() => expect(screen.getAllByText("i-detail").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("button", { name: "i-detail" }));
    await waitFor(() => expect(screen.getByText("Loading instance details...")).toBeTruthy());
  });

  it("shows error state", async () => {
    mockInstanceDetail.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("boom-inst-detail") });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await waitFor(() => expect(screen.getAllByText("i-detail").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("button", { name: "i-detail" }));
    await waitFor(() => expect(screen.getByText("boom-inst-detail")).toBeTruthy());
  });
});

// ─── Instance List: Action Buttons by state ─────────────

describe("EC2InstanceList — action buttons by state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockKeyPairs.mockReturnValue({ data: { keyPairs: [] } });
    mockSubnets.mockReturnValue({ data: { subnets: [] } });
    mockSecurityGroups.mockReturnValue({ data: { securityGroups: [] } });
    mockAmis.mockReturnValue({ data: { images: [] }, isLoading: false });
  });

  it("shows Start button for stopped instance", () => {
    mockInstances.mockReturnValue({
      data: {
        instances: [{ id: "i-stopped", state: "stopped", instanceType: "t2.micro" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    render(<EC2InstanceList onSelect={vi.fn()} />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: /Start i-stopped/i })).toBeTruthy();
  });

  it("shows Stop and Reboot buttons for running instance", () => {
    mockInstances.mockReturnValue({
      data: {
        instances: [{ id: "i-running", state: "running", instanceType: "t2.micro" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    render(<EC2InstanceList onSelect={vi.fn()} />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: /Stop i-running/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Reboot i-running/i })).toBeTruthy();
  });

  // ─── EC2InstanceDetail — action buttons ────────────────────

  it("shows Connect button in instance detail for running state", async () => {
    const user = userEvent.setup();
    mockInstances.mockReturnValue({
      data: { instances: [{ id: "i-connect", state: "running", instanceType: "t2.micro" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockInstanceDetail.mockReturnValue({
      data: { id: "i-connect", state: "running", instanceType: "t2.micro", privateIp: "10.0.0.1", publicIp: "54.0.0.1", vpcId: "vpc-1", subnetId: "subnet-1", keyName: "my-key", imageId: "ami-0abc", availabilityZone: "us-east-1a", architecture: "x86_64", platform: "Linux", launchTime: "2024-01-01T00:00:00Z", iamInstanceProfile: null, ebsOptimized: false, monitoring: "disabled", rootDeviceName: "/dev/xvda", rootDeviceType: "ebs" },
      isLoading: false, isError: false, error: null,
    });
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Instances/i);
    await clickButton(user, /i-connect/i);
    await waitFor(() => expect(screen.getByText("Connect")).toBeTruthy());
    expect(screen.getByText("Docker Exec")).toBeTruthy();
  });

  it("shows Start button in instance detail for stopped state", async () => {
    const user = userEvent.setup();
    mockInstances.mockReturnValue({
      data: { instances: [{ id: "i-stopped-d", state: "stopped", instanceType: "t2.micro" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockInstanceDetail.mockReturnValue({
      data: { id: "i-stopped-d", state: "stopped", instanceType: "t2.micro", privateIp: null, publicIp: null },
      isLoading: false, isError: false, error: null,
    });
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Instances/i);
    await clickButton(user, /i-stopped-d/i);
    await waitFor(() => expect(screen.getByText("Start")).toBeTruthy());
  });

  it("shows Stop and Reboot buttons in instance detail for running state", async () => {
    const user = userEvent.setup();
    mockInstances.mockReturnValue({
      data: { instances: [{ id: "i-running-d", state: "running", instanceType: "t2.micro" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockInstanceDetail.mockReturnValue({
      data: { id: "i-running-d", state: "running", instanceType: "t2.micro" },
      isLoading: false, isError: false, error: null,
    });
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Instances/i);
    await clickButton(user, /i-running-d/i);
    await waitFor(() => {
      expect(screen.getByText("Stop")).toBeTruthy();
      expect(screen.getByText("Reboot")).toBeTruthy();
    });
  });

  it("returns null from instance detail when data is undefined", async () => {
    const user = userEvent.setup();
    mockInstanceDetail.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null });
    mockInstances.mockReturnValue({
      data: { instances: [{ id: "i-null", state: "running", instanceType: "t2.micro" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Instances/i);
    await clickButton(user, /i-null/i);
    await waitFor(() => {
      expect(screen.queryByText("Back to Instances")).toBeNull();
    });
  });

  // ─── VPC Detail Edge Cases ────────────────────────────────

  it("returns null from VPC detail when data is undefined", async () => {
    const user = userEvent.setup();
    mockVpcs.mockReturnValue({
      data: { vpcs: [{ id: "vpc-null", state: "available", cidrBlock: "10.0.0.0/16", isDefault: false, instanceTenancy: "default" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockVpc.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null });
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /VPCs/i);
    await user.click(screen.getByRole("button", { name: "vpc-null" }));
    await waitFor(() => {
      expect(screen.queryByText("Back to VPCs")).toBeNull();
    });
  });

  it("shows delete button in VPC detail for non-default VPC", async () => {
    const user = userEvent.setup();
    mockVpcs.mockReturnValue({
      data: { vpcs: [{ id: "vpc-nondef", state: "available", cidrBlock: "10.0.0.0/16", isDefault: false, instanceTenancy: "default" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockVpc.mockReturnValue({
      data: { id: "vpc-nondef", state: "available", cidrBlock: "10.0.0.0/16", isDefault: false, instanceTenancy: "default" },
      isLoading: false, isError: false, error: null,
    });
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /VPCs/i);
    await user.click(screen.getByRole("button", { name: "vpc-nondef" }));
    await waitFor(() => expect(screen.getByText("Back to VPCs")).toBeTruthy());
    expect(screen.getByRole("button", { name: /Delete vpc-nondef/i })).toBeTruthy();
  });



  // ─── Key Pair Key Material Display ────────────────────────

  it("shows key material modal after creating a key pair", async () => {
    mockCreateKeyPair.mockImplementation((_d: any, opts: any) => opts?.onSuccess?.({ keyMaterial: "PEM-BASE64-DATA" }));
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Key Pairs/i);
    await waitFor(() => expect(screen.getByText("No key pairs found")).toBeTruthy());
    await clickButton(user, /Create Key Pair/i);
    await waitFor(() => expect(screen.getAllByText("Create Key Pair").length).toBeGreaterThan(0));
    await user.type(screen.getByPlaceholderText("my-key"), "kp-key");
    await clickLastButton(user, /^Create$/i);
    await waitFor(() => {
      expect(screen.getByText("Key Pair Created")).toBeTruthy();
      expect(screen.getByText("PEM-BASE64-DATA")).toBeTruthy();
    });
    await clickButton(user, /I've saved the key/i);
  });

  // ─── Volume Delete — not shown for in-use ─────────────────

  it("does NOT show delete button for volume in-use", async () => {
    mockVolumes.mockReturnValue({
      data: { volumes: [{ id: "vol-inuse", size: 8, volumeType: "gp2", state: "in-use", availabilityZone: "us-east-1a", attachments: [{ instanceId: "i-1", device: "/dev/sda" }] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Volumes/i);
    await waitFor(() => expect(screen.getAllByText("vol-inuse").length).toBeGreaterThan(0));
    expect(screen.queryByRole("button", { name: /Delete vol-inuse/i })).toBeFalsy();
  });

  // ─── Launch Instance Error Alert ──────────────────────────

  it("shows launch instance error alert in modal", async () => {
    mockRunInstanceIsError = true;
    mockRunInstanceError = new Error("Launch failed");
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Instances/i);
    await clickButton(user, /Create Instance/i);
    await waitFor(() => {
      expect(screen.getByText("Launch failed")).toBeTruthy();
    });
  });

  // ─── Launch Instance with optional params ─────────────────

  it("launches instance with all optional parameters (keyName, subnetId, securityGroupId)", async () => {
    mockAmis.mockReturnValue({
      data: { images: [{ id: "ami-0abc", name: "Test", platform: "Linux", architecture: "x86_64", state: "available" }], total: 1 },
      isLoading: false,
    });
    mockKeyPairs.mockReturnValue({ data: { keyPairs: [{ name: "my-key" }], total: 1 } });
    mockSubnets.mockReturnValue({ data: { subnets: [{ id: "subnet-9", cidrBlock: "10.0.1.0/24" }], total: 1 } });
    mockSecurityGroups.mockReturnValue({ data: { securityGroups: [{ id: "sg-9", name: "web-sg" }], total: 1 } });

    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Instances/i);
    await clickButton(user, /Create Instance/i);
    await waitFor(() => expect(screen.getAllByText("Launch Instance").length).toBeGreaterThan(0));

    // Select key pair
    await pickSelectOption(user, /No key pair/i, /my-key/);
    // Select subnet
    await pickSelectOption(user, /Default/, /subnet-9/);
    // Select security group
    await pickSelectOption(user, /Default/, /sg-9/);

    await clickLastButton(user, /^Launch$/i);
    await waitFor(() => expect(mockRunInstance).toHaveBeenCalled());

    const args = mockRunInstance.mock.calls[0][0];
    expect(args.keyName).toBe("my-key");
    expect(args.subnetId).toBe("subnet-9");
    expect(args.securityGroupIds).toEqual(["sg-9"]);
  });
});

// ─── Network Interfaces ──────────────────────────────

describe("EC2NetworkInterfaceList (EC2Page — Network Interfaces tab)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("renders network interfaces from data", async () => {
    mockNetworkInterfaces.mockReturnValue({
      data: { networkInterfaces: [{ id: "eni-1", vpcId: "vpc-1", subnetId: "subnet-1", privateIp: "10.0.0.5", status: "available", instanceId: null, description: "test" }], total: 1 },
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

  it("shows loading state", async () => {
    mockNetworkInterfaces.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network Interfaces/i);
    await waitFor(() => expect(screen.getByText("Loading resources...")).toBeTruthy());
  });

  it("shows error state", async () => {
    mockNetworkInterfaces.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("boom-eni") });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network Interfaces/i);
    await waitFor(() => expect(screen.getByText("boom-eni")).toBeTruthy());
  });

  it("shows dash for missing instance attachment", async () => {
    mockNetworkInterfaces.mockReturnValue({
      data: { networkInterfaces: [{ id: "eni-2", vpcId: "vpc-1", subnetId: "subnet-1", privateIp: "10.0.0.6", status: "available", instanceId: null, description: "" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network Interfaces/i);
    await waitFor(() => expect(screen.getAllByText("-").length).toBeGreaterThan(0));
  });
});

// ─── Flow Logs ────────────────────────────────────

describe("EC2FlowLogList (EC2Page — Flow Logs tab)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("renders flow logs from data", async () => {
    mockFlowLogs.mockReturnValue({
      data: { flowLogs: [{ flowLogId: "fl-1", resourceId: "vpc-1", resourceType: "VPC", trafficType: "ALL", logDestinationType: "s3", flowLogStatus: "ACTIVE" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Flow Logs/i);
    await waitFor(() => expect(screen.getAllByText("fl-1").length).toBeGreaterThan(0));
  });

  it("shows empty state", async () => {
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Flow Logs/i);
    await waitFor(() => expect(screen.getByText("No flow logs found")).toBeTruthy());
  });

  it("shows loading state", async () => {
    mockFlowLogs.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Flow Logs/i);
    await waitFor(() => expect(screen.getByText("Loading resources...")).toBeTruthy());
  });

  it("shows error state", async () => {
    mockFlowLogs.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("boom-fl") });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Flow Logs/i);
    await waitFor(() => expect(screen.getByText("boom-fl")).toBeTruthy());
  });

  it("create flow log calls createFlowLog.mutate with resource from Select", async () => {
    mockVpcs.mockReturnValue({
      data: { vpcs: [{ id: "vpc-fl", cidrBlock: "10.0.0.0/16", state: "available", isDefault: false, instanceTenancy: "default" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Flow Logs/i);
    await waitFor(() => expect(screen.getByText("No flow logs found")).toBeTruthy());
    await clickButton(user, /Create Flow Log/i);
    await waitFor(() => expect(screen.getAllByText("Create Flow Log").length).toBeGreaterThan(0));
    await pickSelectOption(user, /Select resource/i, /vpc-fl/);
    await clickLastButton(user, /^Create$/i);
    await waitFor(() => expect(mockCreateFlowLog).toHaveBeenCalled());
    expect(mockCreateFlowLog.mock.calls[0][0]).toMatchObject({ trafficType: "ALL" });
  });

  it("delete flow log calls deleteFlowLog.mutateAsync", async () => {
    mockFlowLogs.mockReturnValue({
      data: { flowLogs: [{ flowLogId: "fl-del", resourceId: "vpc-1", resourceType: "VPC", trafficType: "ALL", logDestinationType: "s3", flowLogStatus: "ACTIVE" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Flow Logs/i);
    await waitFor(() => expect(screen.getAllByText("fl-del").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("button", { name: /Delete fl-del/i }));
    await waitFor(() => expect(screen.getAllByText("Delete flow log").length).toBeGreaterThan(0));
    await clickLastButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteFlowLog).toHaveBeenCalledWith("fl-del"));
  });

  it("shows em-dash for missing resourceId", async () => {
    mockFlowLogs.mockReturnValue({
      data: { flowLogs: [{ flowLogId: "fl-dash", resourceId: null, resourceType: "VPC", trafficType: "ALL", logDestinationType: "s3", flowLogStatus: "ACTIVE" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Flow Logs/i);
    await waitFor(() => expect(screen.getAllByText("-").length).toBeGreaterThan(0));
  });

  it("create flow log with destination type shows ARN field and submits optional fields", async () => {
    mockVpcs.mockReturnValue({
      data: { vpcs: [{ id: "vpc-fl2", cidrBlock: "10.0.0.0/16", state: "available", isDefault: false, instanceTenancy: "default" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Flow Logs/i);
    await waitFor(() => expect(screen.getByText("No flow logs found")).toBeTruthy());
    await clickButton(user, /Create Flow Log/i);
    await waitFor(() => expect(screen.getAllByText("Create Flow Log").length).toBeGreaterThan(0));
    await pickSelectOption(user, /Select resource/i, /vpc-fl2/);
    // Open the log destination type select (currently "s3") and choose cloud-watch-logs
    await pickSelectOption(user, /s3/i, /cloud-watch-logs/);
    await waitFor(() => expect(screen.getByPlaceholderText("arn:aws:s3:::flow-logs-bucket")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("arn:aws:s3:::flow-logs-bucket"), "arn:aws:logs:us-east-1:123456789012:log-group:fl");
    await clickLastButton(user, /^Create$/i);
    await waitFor(() => expect(mockCreateFlowLog).toHaveBeenCalled());
    expect(mockCreateFlowLog.mock.calls[0][0]).toMatchObject({
      resourceId: "vpc-fl2",
      trafficType: "ALL",
      logDestinationType: "cloud-watch-logs",
      logDestination: "arn:aws:logs:us-east-1:123456789012:log-group:fl",
      maxAggregationInterval: 600,
    });
  });
});

// ─── Network ACLs ─────────────────────────────────

describe("EC2NetworkAclList (EC2Page — Network ACLs tab)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createAclEntryState.isPending = false;
    createAclEntryState.isError = false;
    createAclEntryState.error = null;
    setupDefaults();
    mockVpcs.mockReturnValue({
      data: { vpcs: [{ id: "vpc-1", cidrBlock: "10.0.0.0/16", state: "available", isDefault: false, instanceTenancy: "default" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
  });

  it("renders network ACLs from data", async () => {
    mockNetworkAcls.mockReturnValue({
      data: { networkAcls: [{ id: "acl-1", vpcId: "vpc-1", isDefault: true, entries: [{ ruleNumber: 100, protocol: "-1", cidrBlock: "0.0.0.0/0", ruleAction: "allow", egress: false }], associations: [{ subnetId: "subnet-1" }] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network ACLs/i);
    await waitFor(() => expect(screen.getByText("vpc-1")).toBeTruthy());
  });

  it("shows empty state", async () => {
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network ACLs/i);
    await waitFor(() => expect(screen.getByText("No network ACLs found")).toBeTruthy());
  });

  it("shows loading state", async () => {
    mockNetworkAcls.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network ACLs/i);
    await waitFor(() => expect(screen.getByText("Loading resources...")).toBeTruthy());
  });

  it("shows error state", async () => {
    mockNetworkAcls.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("boom-acl") });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network ACLs/i);
    await waitFor(() => expect(screen.getByText("boom-acl")).toBeTruthy());
  });

  it("create ACL calls createNetworkAcl.mutate with VPC from Select", async () => {
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network ACLs/i);
    await waitFor(() => expect(screen.getByText("No network ACLs found")).toBeTruthy());
    await clickButton(user, /Create Network ACL/i);
    await waitFor(() => expect(screen.getAllByText("Create Network ACL").length).toBeGreaterThan(0));
    // Select a VPC from the dropdown so Create button is enabled
    await pickSelectOption(user, /Select a VPC/i, /vpc-1/);
    await clickLastButton(user, /^Create$/i);
    await waitFor(() => expect(mockCreateNetworkAcl).toHaveBeenCalled());
    expect(mockCreateNetworkAcl.mock.calls[0][0]).toEqual({ vpcId: "vpc-1" });
  });

  it("delete non-default ACL shows Delete button", async () => {
    mockNetworkAcls.mockReturnValue({
      data: { networkAcls: [{ id: "acl-del", vpcId: "vpc-1", isDefault: false, entries: [], associations: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network ACLs/i);
    await waitFor(() => expect(screen.getByText("vpc-1")).toBeTruthy());
    expect(screen.getByText("vpc-1")).toBeTruthy();
  });

  it("shows detail view when expand button clicked", async () => {
    mockNetworkAcls.mockReturnValue({
      data: { networkAcls: [{ id: "acl-exp", vpcId: "vpc-1", isDefault: true, entries: [{ ruleNumber: 100, protocol: "-1", cidrBlock: "0.0.0.0/0", ruleAction: "allow", egress: false }, { ruleNumber: 101, protocol: "-1", cidrBlock: "0.0.0.0/0", ruleAction: "allow", egress: true }], associations: [{ subnetId: "subnet-1" }] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network ACLs/i);
    await waitFor(() => expect(screen.getByText("vpc-1")).toBeTruthy());
    await waitFor(() => expect(screen.getByText("vpc-1")).toBeTruthy());
  });

  it("opens and cancels add rule modal", async () => {
    mockNetworkAcls.mockReturnValue({
      data: { networkAcls: [{ networkAclId: "acl-rule", id: "acl-rule", vpcId: "vpc-1", isDefault: false, entries: [], associations: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network ACLs/i);
    await waitFor(() => expect(screen.getByText("vpc-1")).toBeTruthy());
    // Click the View rules button to expand ACL details (Add Inbound Rule only visible after expand)
    await clickButton(user, /View rules for acl-rule/i);
    await clickButton(user, /Add Inbound Rule/i);
    await clickButton(user, /^Cancel$/);
    await waitFor(() => {
      expect(mockCreateAclEntry).not.toHaveBeenCalled();
    });
  });

  it("submits add inbound rule", async () => {
    mockNetworkAcls.mockReturnValue({
      data: { networkAcls: [{ networkAclId: "acl-rule", id: "acl-rule", vpcId: "vpc-1", isDefault: false, entries: [], associations: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockCreateAclEntry.mockImplementation((_params: any, opts?: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network ACLs/i);
    await waitFor(() => expect(screen.getByText("vpc-1")).toBeTruthy());
    await clickButton(user, /View rules for acl-rule/i);
    await clickButton(user, /Add Inbound Rule/i);
    // Type rule number
    const numberInput = screen.getByPlaceholderText("100");
    await user.clear(numberInput);
    await user.type(numberInput, "200");
    // Type CIDR block (clear default first)
    const cidrInput = screen.getByPlaceholderText("0.0.0.0/0");
    await user.clear(cidrInput);
    await user.type(cidrInput, "10.0.0.0/8");
    await clickButton(user, /Add Rule/i);
    await waitFor(() => {
      expect(mockCreateAclEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          aclId: "acl-rule",
          ruleNumber: 200,
          cidrBlock: "10.0.0.0/8",
          egress: false,
        }),
        expect.any(Object),
      );
    });
  });

  it("shows error alert when create entry fails", async () => {
    createAclEntryState.isError = true;
    createAclEntryState.error = new Error("Entry creation failed");
    mockNetworkAcls.mockReturnValue({
      data: { networkAcls: [{ networkAclId: "acl-err", id: "acl-err", vpcId: "vpc-1", isDefault: false, entries: [], associations: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network ACLs/i);
    await waitFor(() => expect(screen.getByText("vpc-1")).toBeTruthy());
    await clickButton(user, /View rules for acl-err/i);
    await clickButton(user, /Add Inbound Rule/i);
    await waitFor(() => {
      expect(screen.getByText("Entry creation failed")).toBeTruthy();
    });
  });

  it("shows default error message when create entry fails without message", async () => {
    createAclEntryState.isError = true;
    createAclEntryState.error = null;
    mockNetworkAcls.mockReturnValue({
      data: { networkAcls: [{ networkAclId: "acl-err2", id: "acl-err2", vpcId: "vpc-1", isDefault: false, entries: [], associations: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network ACLs/i);
    await waitFor(() => expect(screen.getByText("vpc-1")).toBeTruthy());
    await clickButton(user, /View rules for acl-err2/i);
    await clickButton(user, /Add Inbound Rule/i);
    await waitFor(() => {
      expect(screen.getByText("Failed to add rule")).toBeTruthy();
    });
  });

  it("submits add inbound rule with DENY action", async () => {
    mockCreateAclEntry.mockImplementation((_params: any, opts?: any) => opts?.onSuccess?.());
    mockNetworkAcls.mockReturnValue({
      data: { networkAcls: [{ networkAclId: "acl-deny", id: "acl-deny", vpcId: "vpc-1", isDefault: false, entries: [], associations: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network ACLs/i);
    await waitFor(() => expect(screen.getByText("vpc-1")).toBeTruthy());
    await clickButton(user, /View rules for acl-deny/i);
    await clickButton(user, /Add Inbound Rule/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("100")).toBeTruthy();
    });
    // Change rule number
    const numberInput = screen.getByPlaceholderText("100");
    await user.clear(numberInput);
    await user.type(numberInput, "300");
    // Change Action to DENY
    const actionSelect = screen.getByText("ALLOW");
    await user.click(actionSelect);
    await waitFor(() => expect(screen.getByText("DENY")).toBeTruthy());
    await user.click(screen.getByText("DENY"));
    // Submit
    await clickButton(user, /Add Rule/i);
    await waitFor(() => {
      expect(mockCreateAclEntry).toHaveBeenCalledWith(
        expect.objectContaining({ aclId: "acl-deny", ruleNumber: 300, ruleAction: "deny" }),
        expect.any(Object),
      );
    });
  });

  it("submits add inbound rule with custom protocol", async () => {
    mockCreateAclEntry.mockImplementation((_params: any, opts?: any) => opts?.onSuccess?.());
    mockNetworkAcls.mockReturnValue({
      data: { networkAcls: [{ networkAclId: "acl-proto", id: "acl-proto", vpcId: "vpc-1", isDefault: false, entries: [], associations: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network ACLs/i);
    await waitFor(() => expect(screen.getByText("vpc-1")).toBeTruthy());
    await clickButton(user, /View rules for acl-proto/i);
    await clickButton(user, /Add Inbound Rule/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("100")).toBeTruthy();
    });
    // Type rule number
    const numberInput = screen.getByPlaceholderText("100");
    await user.clear(numberInput);
    await user.type(numberInput, "400");
    // Change CIDR
    const cidrInput = screen.getByPlaceholderText("0.0.0.0/0");
    await user.clear(cidrInput);
    await user.type(cidrInput, "10.0.0.0/8");
    // Submit
    await clickButton(user, /Add Rule/i);
    await waitFor(() => {
      expect(mockCreateAclEntry).toHaveBeenCalledWith(
        expect.objectContaining({ aclId: "acl-proto", ruleNumber: 400, cidrBlock: "10.0.0.0/8" }),
        expect.any(Object),
      );
    });
  });

  it("submits add inbound rule with port ranges", async () => {
    mockCreateAclEntry.mockImplementation((_params: any, opts?: any) => opts?.onSuccess?.());
    mockNetworkAcls.mockReturnValue({
      data: { networkAcls: [{ networkAclId: "acl-port", id: "acl-port", vpcId: "vpc-1", isDefault: false, entries: [], associations: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network ACLs/i);
    await waitFor(() => expect(screen.getByText("vpc-1")).toBeTruthy());
    await clickButton(user, /View rules for acl-port/i);
    await clickButton(user, /Add Inbound Rule/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("100")).toBeTruthy();
    });
    // Type rule number
    const numberInput = screen.getByPlaceholderText("100");
    await user.clear(numberInput);
    await user.type(numberInput, "500");
    // Fill port range from/to
    const portFromInput = screen.getByPlaceholderText("From");
    const portToInput = screen.getByPlaceholderText("To");
    await user.type(portFromInput, "80");
    await user.type(portToInput, "443");
    // Submit (button text is "Add Rule" but only appears inside the modal)
    await user.click(screen.getByRole("button", { name: /Add Rule/i }));
    await waitFor(() => {
      expect(mockCreateAclEntry).toHaveBeenCalledWith(
        expect.objectContaining({ aclId: "acl-port", ruleNumber: 500 }),
        expect.any(Object),
      );
    });
  });

  it("submits add outbound rule (egress: true)", async () => {
    mockCreateAclEntry.mockImplementation((_params: any, opts?: any) => opts?.onSuccess?.());
    mockNetworkAcls.mockReturnValue({
      data: { networkAcls: [{ networkAclId: "acl-egress", id: "acl-egress", vpcId: "vpc-1", isDefault: false, entries: [], associations: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network ACLs/i);
    await waitFor(() => expect(screen.getByText("vpc-1")).toBeTruthy());
    await clickButton(user, /View rules for acl-egress/i);
    // Click "Add Outbound Rule" button
    await clickButton(user, /Add Outbound Rule/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("100")).toBeTruthy();
    });
    // Type rule number
    const numberInput = screen.getByPlaceholderText("100");
    await user.clear(numberInput);
    await user.type(numberInput, "600");
    // Change CIDR
    const cidrInput = screen.getByPlaceholderText("0.0.0.0/0");
    await user.clear(cidrInput);
    await user.type(cidrInput, "192.168.0.0/16");
    // Submit
    await user.click(screen.getByRole("button", { name: /Add Rule/i }));
    await waitFor(() => {
      expect(mockCreateAclEntry).toHaveBeenCalledWith(
        expect.objectContaining({ aclId: "acl-egress", ruleNumber: 600, egress: true }),
        expect.any(Object),
      );
    });
  });

  it("renders expanded ACL detail with sorted rules, port ranges, and statuses", async () => {
    mockNetworkAcls.mockReturnValue({
      data: {
        networkAcls: [
          {
            networkAclId: "acl-exp2",
            vpcId: "vpc-1",
            isDefault: false,
            entries: [
              { ruleNumber: 200, protocol: "6", cidrBlock: "10.0.0.0/8", ruleAction: "deny", egress: false, portRange: { from: 80, to: 443 } },
              { ruleNumber: 100, protocol: "-1", cidrBlock: "0.0.0.0/0", ruleAction: "allow", egress: false },
            ],
            associations: [{ subnetId: "subnet-1", networkAclAssociationId: "aclassoc-1" }],
          },
        ],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network ACLs/i);
    await waitFor(() => expect(screen.getByText("vpc-1")).toBeTruthy());
    await clickButton(user, /View rules for acl-exp2/i);
    await waitFor(() => expect(screen.getByText("#100")).toBeTruthy());
    // Protocol "-1" renders as "All"; port range renders as :80-443
    expect(screen.getByText("All")).toBeTruthy();
    expect(screen.getByText(/80-443/)).toBeTruthy();
    expect(screen.getAllByText("ALLOW").length).toBeGreaterThan(0);
    expect(screen.getAllByText("DENY").length).toBeGreaterThan(0);
    // Subnet association rows
    expect(screen.getByText("subnet-1")).toBeTruthy();
    expect(screen.getByText("aclassoc-1")).toBeTruthy();
  });

  it("shows no-rules and no-associations messages in expanded ACL", async () => {
    mockNetworkAcls.mockReturnValue({
      data: {
        networkAcls: [{ networkAclId: "acl-empty", vpcId: "vpc-1", isDefault: false, entries: [], associations: [] }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network ACLs/i);
    await waitFor(() => expect(screen.getByText("vpc-1")).toBeTruthy());
    await clickButton(user, /View rules for acl-empty/i);
    await waitFor(() => {
      expect(screen.getByText("No inbound rules found")).toBeTruthy();
      expect(screen.getByText("No outbound rules found")).toBeTruthy();
      expect(screen.getByText("No subnet associations")).toBeTruthy();
    });
  });

  it("delete rule calls deleteEntry.mutate with egress flag", async () => {
    mockNetworkAcls.mockReturnValue({
      data: {
        networkAcls: [
          {
            networkAclId: "acl-del2",
            vpcId: "vpc-1",
            isDefault: false,
            entries: [{ ruleNumber: 100, protocol: "6", cidrBlock: "10.0.0.0/8", ruleAction: "allow", egress: true }],
            associations: [],
          },
        ],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network ACLs/i);
    await waitFor(() => expect(screen.getByText("vpc-1")).toBeTruthy());
    await clickButton(user, /View rules for acl-del2/i);
    await waitFor(() => expect(screen.getByText("#100")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete rule 100/i }));
    await waitFor(() => {
      expect(mockDeleteAclEntry).toHaveBeenCalledWith({ aclId: "acl-del2", ruleNumber: 100, egress: true });
    });
  });
});

// ─── CommandBox copy ──────────────────────────────────

describe("EC2InstanceDetail — CommandBox copy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
    mockInstances.mockReturnValue({
      data: { instances: [{ id: "i-copy", state: "running", instanceType: "t2.micro" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockInstanceDetail.mockReturnValue({
      data: { id: "i-copy", state: "running", instanceType: "t2.micro", privateIp: "10.0.0.1", publicIp: "54.0.0.1", vpcId: "vpc-1", subnetId: "subnet-1", keyName: "my-key", imageId: "ami-0abc", availabilityZone: "us-east-1a", architecture: "x86_64", platform: "Linux", launchTime: "2024-01-01T00:00:00Z", iamInstanceProfile: null, ebsOptimized: false, monitoring: "disabled", rootDeviceName: "/dev/xvda", rootDeviceType: "ebs" },
      isLoading: false, isError: false, error: null,
    });
  });

  it("shows Copied state after clicking the copy button", async () => {
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Instances/i);
    await clickButton(user, /i-copy/i);
    await waitFor(() => expect(screen.getByText("Docker Exec")).toBeTruthy());
    // Connection Info panel renders 3 CommandBoxes — click the first copy button.
    // happy-dom's native Clipboard.writeText resolves, so handleCopy reaches
    // setCopied(true) and the aria-label flips from "Copy to clipboard" to "Copied".
    await user.click(screen.getAllByRole("button", { name: /Copy to clipboard/i })[0]);
    await waitFor(() => expect(screen.getByRole("button", { name: /Copied/i })).toBeTruthy());
  });
});

// ─── Delete Loading States (bulk hoisted state coverage) ─

describe("EC2Page — delete loading states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("shows delete VPC in loading state", async () => {
    deleteVpcState.isPending = true;
    deleteVpcState.variables = "vpc-1";
    mockVpcs.mockReturnValue({ data: { vpcs: [{ vpcId: "vpc-1", id: "vpc-1", cidrBlock: "10.0.0.0/16", isDefault: false, state: "available" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /VPCs/i);
    await waitFor(() => expect(screen.getByText("vpc-1")).toBeTruthy());
  });

  it("shows delete Subnet in loading state", async () => {
    deleteSubnetState.isPending = true;
    deleteSubnetState.variables = "subnet-1";
    mockSubnets.mockReturnValue({ data: { subnets: [{ id: "subnet-1", subnetId: "subnet-1", vpcId: "vpc-1", cidrBlock: "10.0.1.0/24", state: "available", availabilityZone: "us-east-1a" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Subnets/i);
    await waitFor(() => expect(screen.getByText("subnet-1")).toBeTruthy());
  });

  it("shows delete Security Group in loading state", async () => {
    deleteSgState.isPending = true;
    deleteSgState.variables = "sg-1";
    mockSecurityGroups.mockReturnValue({ data: { securityGroups: [{ id: "sg-1", groupId: "sg-1", name: "test-sg", description: "test", vpcId: "vpc-1" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Security Groups/i);
    await waitFor(() => expect(screen.getByText("test-sg")).toBeTruthy());
  });

  it("shows delete Key Pair in loading state", async () => {
    deleteKeyPairState.isPending = true;
    deleteKeyPairState.variables = "my-key";
    mockKeyPairs.mockReturnValue({ data: { keyPairs: [{ name: "my-key", keyFingerprint: "aa:bb", keyType: "rsa" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Key Pairs/i);
    await waitFor(() => expect(screen.getByText("my-key")).toBeTruthy());
  });

  it("shows delete Internet Gateway in loading state", async () => {
    deleteIgwState.isPending = true;
    deleteIgwState.variables = "igw-1";
    mockInternetGateways.mockReturnValue({ data: { internetGateways: [{ id: "igw-1", internetGatewayId: "igw-1", attachments: [{ vpcId: "vpc-1" }] }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Internet Gateways/i);
    await waitFor(() => expect(screen.getByText("igw-1")).toBeTruthy());
  });

  it("shows delete Route Table in loading state", async () => {
    deleteRtState.isPending = true;
    deleteRtState.variables = "rtb-1";
    mockRouteTables.mockReturnValue({ data: { routeTables: [{ id: "rtb-1", routeTableId: "rtb-1", vpcId: "vpc-1", routes: [] }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Route Tables/i);
    await waitFor(() => expect(screen.getByText("rtb-1")).toBeTruthy());
  });

  it("shows delete NAT Gateway in loading state", async () => {
    deleteNatState.isPending = true;
    deleteNatState.variables = "nat-1";
    mockNatGateways.mockReturnValue({ data: { natGateways: [{ id: "nat-1", natGatewayId: "nat-1", subnetId: "subnet-1", vpcId: "vpc-1", state: "available" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /NAT Gateways/i);
    await waitFor(() => expect(screen.getByText("nat-1")).toBeTruthy());
  });

  it("shows delete Volume in loading state", async () => {
    deleteVolState.isPending = true;
    deleteVolState.variables = "vol-1";
    mockVolumes.mockReturnValue({ data: { volumes: [{ id: "vol-1", size: 10, volumeType: "gp2", state: "available", az: "us-east-1a", attachments: [] }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Volumes/i);
    await waitFor(() => expect(screen.getByText("vol-1")).toBeTruthy());
  });

  it("shows delete Launch Template in loading state", async () => {
    deleteLtState.isPending = true;
    deleteLtState.variables = "lt-1";
    mockLaunchTemplates.mockReturnValue({ data: { launchTemplates: [{ id: "lt-1", name: "my-template", defaultVersion: 1, latestVersion: 1, createdAt: "2025-01-01" }], total: 1 }, isLoading: false });
    mockAmis.mockReturnValue({ data: { images: [] }, isLoading: false });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Launch Templates/i);
    await waitFor(() => expect(screen.getByText("my-template")).toBeTruthy());
  });
});

// ─── Volume Status Ternaries ───────────────────────────

describe("EC2Page — volume status indicators", () => {
  beforeEach(() => { vi.clearAllMocks(); setupDefaults(); });

  it("shows success status for available volume", async () => {
    mockVolumes.mockReturnValue({ data: { volumes: [{ id: "vol-avail", size: 10, volumeType: "gp2", state: "available", az: "us-east-1a", attachments: [] }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Volumes/i);
    await waitFor(() => expect(screen.getByText("available")).toBeTruthy());
  });

  it("shows in-progress status for in-use volume", async () => {
    mockVolumes.mockReturnValue({ data: { volumes: [{ id: "vol-inuse", size: 20, volumeType: "gp3", state: "in-use", az: "us-east-1b", attachments: [{ instanceId: "i-1", deviceName: "/dev/xvda" }] }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Volumes/i);
    await waitFor(() => expect(screen.getByText("in-use")).toBeTruthy());
  });

  it("shows warning status for error volume", async () => {
    mockVolumes.mockReturnValue({ data: { volumes: [{ id: "vol-err", size: 5, volumeType: "standard", state: "error", az: "us-east-1c", attachments: [] }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Volumes/i);
    await waitFor(() => expect(screen.getByText("error")).toBeTruthy());
  });
});

// ─── Flow Logs Create Error + Delete Loading ───────────

describe("EC2Page — flow log edge cases", () => {
  beforeEach(() => { vi.clearAllMocks(); setupDefaults(); });

  it("shows create flow log error alert", async () => {
    createFlowLogState.isError = true;
    createFlowLogState.error = new Error("S3 bucket not found");
    mockFlowLogs.mockReturnValue({ data: { flowLogs: [], total: 0 }, isLoading: false });
    mockVpcs.mockReturnValue({ data: { vpcs: [] }, isLoading: false });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Flow Logs/i);
    await clickButton(user, /Create Flow Log/i);
    await waitFor(() => expect(screen.getByText("S3 bucket not found")).toBeTruthy());
  });

  it("shows delete flow log in loading state", async () => {
    deleteFlowLogState.isPending = true;
    deleteFlowLogState.variables = "fl-1";
    mockFlowLogs.mockReturnValue({ data: { flowLogs: [{ flowLogId: "fl-1", resourceId: "vpc-1", resourceType: "VPC", trafficType: "ALL", logDestinationType: "s3", flowLogStatus: "ACTIVE" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Flow Logs/i);
    await waitFor(() => expect(screen.getByText("fl-1")).toBeTruthy());
  });
});

// ─── Network ACLs Create Error + Delete Loading ─────────

describe("EC2Page — network ACL edge cases", () => {
  beforeEach(() => { vi.clearAllMocks(); setupDefaults(); });

  it("shows delete ACL in loading state", async () => {
    deleteAclState.isPending = true;
    deleteAclState.variables = "acl-1";
    mockNetworkAcls.mockReturnValue({ data: { networkAcls: [{ networkAclId: "acl-1", id: "acl-1", vpcId: "vpc-1", isDefault: false, entries: [], associations: [] }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Network ACLs/i);
    await waitFor(() => expect(screen.getByText("acl-1")).toBeTruthy());
  });
});

// ─── Volumes Create Edge ───────────────────────────────

describe("EC2Page — volumes create", () => {
  beforeEach(() => { vi.clearAllMocks(); setupDefaults(); });

  it("creates volume with size and AZ", async () => {
    mockVolumes.mockReturnValue({ data: { volumes: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<EC2Page />, { wrapper: pageWrapper() });
    await goToTab(user, /Volumes/i);
    await clickButton(user, /Create Volume/i);
    await waitFor(() => expect(screen.getByPlaceholderText("us-east-1a")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("us-east-1a"), "us-east-1a");
    const sizeInput = screen.getAllByRole("spinbutton")[0];
    await user.clear(sizeInput);
    await user.type(sizeInput, "20");
    await clickButton(user, /^Create$/);
    await waitFor(() => {
      expect(mockCreateVolume).toHaveBeenCalledWith(
        expect.objectContaining({ availabilityZone: "us-east-1a", size: 20 }),
        expect.any(Object)
      );
    });
  });
});
