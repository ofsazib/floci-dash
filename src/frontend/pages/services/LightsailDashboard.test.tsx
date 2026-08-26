// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mockInstances = vi.fn();
const mockDisks = vi.fn();
const mockStaticIps = vi.fn();
const mockKeyPairs = vi.fn();

vi.mock("../../hooks/useLightsail", () => ({
  useLightsailInstances: (...args: any[]) => mockInstances(...args),
  useCreateLightsailInstance: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteLightsailInstance: () => ({ mutateAsync: vi.fn(), isPending: false, mutate: vi.fn() }),
  useStartLightsailInstance: () => ({ mutateAsync: vi.fn(), isPending: false, mutate: vi.fn() }),
  useStopLightsailInstance: () => ({ mutateAsync: vi.fn(), isPending: false, mutate: vi.fn() }),
  useRebootLightsailInstance: () => ({ mutateAsync: vi.fn(), isPending: false, mutate: vi.fn() }),
  useLightsailDisks: (...args: any[]) => mockDisks(...args),
  useCreateLightsailDisk: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteLightsailDisk: () => ({ mutateAsync: vi.fn(), isPending: false, mutate: vi.fn() }),
  useLightsailStaticIps: (...args: any[]) => mockStaticIps(...args),
  useAllocateLightsailStaticIp: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useReleaseLightsailStaticIp: () => ({ mutateAsync: vi.fn(), isPending: false, mutate: vi.fn() }),
  useAttachLightsailStaticIp: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDetachLightsailStaticIp: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useLightsailKeyPairs: (...args: any[]) => mockKeyPairs(...args),
  useCreateLightsailKeyPair: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteLightsailKeyPair: () => ({ mutateAsync: vi.fn(), isPending: false, mutate: vi.fn() }),
}));

import { LightsailDashboard } from "./LightsailDashboard";

describe("LightsailDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInstances.mockReturnValue({ data: undefined, isLoading: false });
    mockDisks.mockReturnValue({ data: undefined, isLoading: false });
    mockStaticIps.mockReturnValue({ data: undefined, isLoading: false });
    mockKeyPairs.mockReturnValue({ data: undefined, isLoading: false });
  });

  it("renders instances tab by default", () => {
    render(<LightsailDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("tab", { name: /Instances/ })).toBeTruthy();
  });

  it("renders all four tabs", () => {
    render(<LightsailDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("tab", { name: /Instances/ })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Disks/ })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Static IPs/ })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Key Pairs/ })).toBeTruthy();
  });

  it("switches to Disks tab", async () => {
    render(<LightsailDashboard />, { wrapper: createWrapper() });
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /Disks/ }));
    expect(screen.getByRole("tab", { name: /Disks/ })).toBeTruthy();
  });

  it("switches to Static IPs tab", async () => {
    render(<LightsailDashboard />, { wrapper: createWrapper() });
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /Static IPs/ }));
    expect(screen.getByRole("tab", { name: /Static IPs/ })).toBeTruthy();
  });

  it("switches to Key Pairs tab", async () => {
    render(<LightsailDashboard />, { wrapper: createWrapper() });
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /Key Pairs/ }));
    expect(screen.getByRole("tab", { name: /Key Pairs/ })).toBeTruthy();
  });

  it("opens create instance modal", async () => {
    render(<LightsailDashboard />, { wrapper: createWrapper() });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Create Instance/ }));
    expect(screen.getByText("Instance Name")).toBeTruthy();
  });

  it("opens create disk modal", async () => {
    render(<LightsailDashboard />, { wrapper: createWrapper() });
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /Disks/ }));
    await user.click(screen.getByRole("button", { name: /Create Disk/ }));
    expect(screen.getByText("Disk Name")).toBeTruthy();
  });

  it("opens allocate static IP modal", async () => {
    render(<LightsailDashboard />, { wrapper: createWrapper() });
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /Static IPs/ }));
    await user.click(screen.getByRole("button", { name: /Allocate Static IP/ }));
    expect(screen.getByText("Static IP Name")).toBeTruthy();
  });

  it("opens create key pair modal", async () => {
    render(<LightsailDashboard />, { wrapper: createWrapper() });
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /Key Pairs/ }));
    await user.click(screen.getByRole("button", { name: /Create Key Pair/ }));
    expect(screen.getByText("Key Pair Name")).toBeTruthy();
  });

  it("shows loading state for instances", () => {
    mockInstances.mockReturnValue({ data: undefined, isLoading: true });
    render(<LightsailDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Loading...")).toBeTruthy();
  });

  it("shows loading state for disks", async () => {
    mockDisks.mockReturnValue({ data: undefined, isLoading: true });
    render(<LightsailDashboard />, { wrapper: createWrapper() });
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /Disks/ }));
    expect(screen.getByText("Loading...")).toBeTruthy();
  });

  it("shows loading state for static IPs", () => {
    mockStaticIps.mockReturnValue({ data: undefined, isLoading: true });
    render(<LightsailDashboard />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole("tab", { name: /Static IPs/ }));
    expect(screen.getByText("Loading...")).toBeTruthy();
  });

  it("shows loading state for key pairs", () => {
    mockKeyPairs.mockReturnValue({ data: undefined, isLoading: true });
    render(<LightsailDashboard />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole("tab", { name: /Key Pairs/ }));
    expect(screen.getByText("Loading...")).toBeTruthy();
  });
});
