// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// ─── Mock useEC2 hooks ─────────────────────────────────
// vi.mock is hoisted above all imports, so this runs before the module import below.

const mockInstances = vi.fn();
const mockKeyPairs = vi.fn();
const mockSubnets = vi.fn();
const mockSecurityGroups = vi.fn();
const mockAmis = vi.fn();
const mockLaunchTemplates = vi.fn();

vi.mock("../hooks/useEC2", () => ({
  useEC2Instances: (...args: any[]) => mockInstances(...args),
  useEC2KeyPairs: (...args: any[]) => mockKeyPairs(...args),
  useEC2Subnets: (...args: any[]) => mockSubnets(...args),
  useEC2SecurityGroups: (...args: any[]) => mockSecurityGroups(...args),
  useEC2Amis: (...args: any[]) => mockAmis(...args),
  useEC2LaunchTemplates: (...args: any[]) => mockLaunchTemplates(...args),
  useEC2Vpcs: () => ({ data: { vpcs: [] }, isLoading: false }),
  useEC2Vpc: () => ({ data: null, isLoading: false }),
  useEC2InternetGateways: () => ({ data: { internetGateways: [] }, isLoading: false }),
  useEC2RouteTables: () => ({ data: { routeTables: [] }, isLoading: false }),
  useEC2NatGateways: () => ({ data: { natGateways: [] }, isLoading: false }),
  useEC2ElasticIps: () => ({ data: { addresses: [] }, isLoading: false }),
  useEC2Volumes: () => ({ data: { volumes: [] }, isLoading: false }),
  useEC2NetworkInterfaces: () => ({ data: { networkInterfaces: [] }, isLoading: false }),
  useEC2RunInstance: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useEC2TerminateInstance: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEC2StartInstance: () => ({ mutate: vi.fn(), isPending: false }),
  useEC2StopInstance: () => ({ mutate: vi.fn(), isPending: false }),
  useEC2RebootInstance: () => ({ mutate: vi.fn(), isPending: false }),
  useEC2CreateVpc: () => ({ mutate: vi.fn(), isPending: false }),
  useEC2DeleteVpc: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEC2CreateSubnet: () => ({ mutate: vi.fn(), isPending: false }),
  useEC2DeleteSubnet: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEC2CreateSecurityGroup: () => ({ mutate: vi.fn(), isPending: false }),
  useEC2DeleteSecurityGroup: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEC2AuthorizeIngress: () => ({ mutate: vi.fn(), isPending: false }),
  useEC2RevokeIngress: () => ({ mutate: vi.fn(), isPending: false }),
  useEC2CreateKeyPair: () => ({ mutate: vi.fn(), isPending: false }),
  useEC2ImportKeyPair: () => ({ mutate: vi.fn(), isPending: false }),
  useEC2DeleteKeyPair: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEC2CreateInternetGateway: () => ({ mutate: vi.fn(), isPending: false }),
  useEC2DeleteInternetGateway: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEC2AttachInternetGateway: () => ({ mutate: vi.fn(), isPending: false }),
  useEC2DetachInternetGateway: () => ({ mutate: vi.fn(), isPending: false }),
  useEC2CreateRouteTable: () => ({ mutate: vi.fn(), isPending: false }),
  useEC2DeleteRouteTable: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEC2CreateNatGateway: () => ({ mutate: vi.fn(), isPending: false }),
  useEC2DeleteNatGateway: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEC2CreateVolume: () => ({ mutate: vi.fn(), isPending: false }),
  useEC2DeleteVolume: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEC2CreateLaunchTemplate: () => ({ mutate: vi.fn(), isPending: false }),
  useEC2DeleteLaunchTemplate: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEC2AllocateElasticIp: () => ({ mutate: vi.fn(), isPending: false }),
  useEC2ReleaseElasticIp: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEC2ModifyVpc: () => ({ mutate: vi.fn(), isPending: false }),
  useEC2ModifyInstance: () => ({ mutate: vi.fn(), isPending: false }),
}));

// ─── Static imports (after mock) ───────────────────────

import { EC2InstanceList, EC2LaunchTemplateList } from "./EC2Page";

// ─── Helper to create wrapper ──────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// ─── Async helper to open a Cloudscape Select dropdown ──
// Cloudscape Select renders as a button. Clicking it opens the options popup.
async function openSelect(user: ReturnType<typeof userEvent.setup>, selectButton: HTMLElement) {
  await user.click(selectButton);
  // Cloudscape renders options in a portal; wait for rendering
  await new Promise((r) => setTimeout(r, 50));
}

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

  it("shows AMI Select dropdown when AMI catalog has images (opens to reveal options)", async () => {
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

    // Open the launch modal
    const createButtons = screen.getAllByRole("button", { name: /create/i });
    await user.click(createButtons[0]);

    // Wait for the modal to appear - the AMI Select button should be visible
    // The Select shows the currently selected AMI (auto-detected from catalog)
    await waitFor(() => {
      // Cloudscape Select renders as a <button> with the selected value
      // The auto-detection should have selected "ami-0abc" (first AMI)
      const amisSelect = screen.getByRole("button", { name: /ami/i });
      expect(amisSelect).toBeTruthy();
    });

    // Open the Select dropdown to reveal all AMI options
    const amiButton = screen.getByRole("button", { name: /ami/i });
    await openSelect(user, amiButton);

    // Now the options should be visible in the DOM (rendered in a Cloudscape portal)
    await waitFor(() => {
      // The options should show AMI ID + name
      expect(screen.getByText(/Amazon Linux 2023/i)).toBeTruthy();
      expect(screen.getByText(/Ubuntu 22.04/i)).toBeTruthy();
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
    const createButtons = screen.getAllByRole("button", { name: /create/i });
    await user.click(createButtons[0]);

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

    const createButtons = screen.getAllByRole("button", { name: /create/i });
    await user.click(createButtons[0]);

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

  it("shows AMI Select when catalog has images (opens to reveal options)", async () => {
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
    const createButtons = screen.getAllByRole("button", { name: /create/i });
    await user.click(createButtons[0]);

    // Wait for modal and verify Select exists
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /ami/i })).toBeTruthy();
    });

    // Open the Select dropdown
    const amiButton = screen.getByRole("button", { name: /ami/i });
    await openSelect(user, amiButton);

    // Verify options are visible in the dropdown
    await waitFor(() => {
      expect(screen.getByText(/Test Image/i)).toBeTruthy();
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
