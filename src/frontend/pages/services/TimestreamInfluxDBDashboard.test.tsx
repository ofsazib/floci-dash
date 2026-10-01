// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useTsInstances: vi.fn(),
  useCreateTsInstance: vi.fn(),
  useDeleteTsInstance: vi.fn(),
  useRebootTsInstance: vi.fn(),
  useTsClusters: vi.fn(),
  useCreateTsCluster: vi.fn(),
  useDeleteTsCluster: vi.fn(),
  useTsBackups: vi.fn(),
  useCreateTsBackup: vi.fn(),
  useDeleteTsBackup: vi.fn(),
  useTsParameterGroups: vi.fn(),
  useCreateTsParameterGroup: vi.fn(),
}));

vi.mock("../../hooks/useTimestreamInfluxDB", () => mockHooks);

const mockCreateInstance = vi.fn();
const mockDeleteInstance = vi.fn();
const mockReboot = vi.fn();
const mockCreateCluster = vi.fn();
const mockDeleteCluster = vi.fn();
const mockCreateBackup = vi.fn();
const mockDeleteBackup = vi.fn();
const mockCreateGroup = vi.fn();

function okMutation(mock: ReturnType<typeof vi.fn>, isPending = false) {
  return { mutateAsync: mock, isPending };
}

function listQuery(key: string, items: unknown[], overrides: Record<string, unknown> = {}) {
  return {
    data: { [key]: items, total: items.length },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

const INSTANCE = { id: "i1", name: "influx-1", status: "RUNNING", dbInstanceType: "db.influx.medium" };
const CLUSTER = { id: "c1", name: "cluster-1", status: "RUNNING" };
const BACKUP = { id: "b1", name: "backup-1", arn: "arn:b" };
const GROUP = { id: "pg1", name: "pg-1", description: "d" };

import TimestreamInfluxDBDashboard from "./TimestreamInfluxDBDashboard";

function modalDlg(header: string): HTMLElement {
  return screen
    .getAllByText(header)
    .map((t) => t.closest('[role="dialog"]'))
    .find((d) => d) as HTMLElement;
}

function dialogButton(dlg: HTMLElement, text: string): HTMLElement {
  return Array.from(dlg.querySelectorAll("button")).find(
    (b) => b.textContent === text
  ) as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockHooks.useTsInstances.mockReturnValue(listQuery("instances", [INSTANCE]));
  mockHooks.useTsClusters.mockReturnValue(listQuery("clusters", [CLUSTER]));
  mockHooks.useTsBackups.mockReturnValue(listQuery("backups", [BACKUP]));
  mockHooks.useTsParameterGroups.mockReturnValue(listQuery("parameterGroups", [GROUP]));
  mockHooks.useCreateTsInstance.mockReturnValue(okMutation(mockCreateInstance));
  mockHooks.useDeleteTsInstance.mockReturnValue(okMutation(mockDeleteInstance));
  mockHooks.useRebootTsInstance.mockReturnValue(okMutation(mockReboot));
  mockHooks.useCreateTsCluster.mockReturnValue(okMutation(mockCreateCluster));
  mockHooks.useDeleteTsCluster.mockReturnValue(okMutation(mockDeleteCluster));
  mockHooks.useCreateTsBackup.mockReturnValue(okMutation(mockCreateBackup));
  mockHooks.useDeleteTsBackup.mockReturnValue(okMutation(mockDeleteBackup));
  mockHooks.useCreateTsParameterGroup.mockReturnValue(okMutation(mockCreateGroup));
});

describe("TimestreamInfluxDBDashboard — instances tab", () => {
  it("renders instances", async () => {
    render(<TimestreamInfluxDBDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("influx-1")).toBeTruthy());
    expect(screen.getByText("RUNNING")).toBeTruthy();
  });

  it("shows the instances error alert", () => {
    mockHooks.useTsInstances.mockReturnValue(
      listQuery("instances", [], { isError: true, error: new Error("down") })
    );
    render(<TimestreamInfluxDBDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("down")).toBeTruthy();
  });

  it("renders undefined list data across tabs (labels + empty tables)", async () => {
    const user = userEvent.setup();
    mockHooks.useTsInstances.mockReturnValue(listQuery("instances", [], { data: undefined }));
    mockHooks.useTsClusters.mockReturnValue(listQuery("clusters", [], { data: undefined }));
    mockHooks.useTsBackups.mockReturnValue(listQuery("backups", [], { data: undefined }));
    mockHooks.useTsParameterGroups.mockReturnValue(
      listQuery("parameterGroups", [], { data: undefined })
    );
    render(<TimestreamInfluxDBDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("No instances found")).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /^DB clusters \(0\)/ }));
    await waitFor(() => expect(screen.getByText("No clusters found")).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /^Backups \(0\)/ }));
    await waitFor(() => expect(screen.getByText("No backups found")).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /^Parameter groups \(0\)/ }));
    await waitFor(() => expect(screen.getByText("No parameter groups found")).toBeTruthy());
  });

  it("creates an instance and dismisses the success alert", async () => {
    const user = userEvent.setup();
    mockCreateInstance.mockResolvedValueOnce({ instance: {} });
    render(<TimestreamInfluxDBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create instance/i }));
    const dlg = modalDlg("Create DB instance");
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0] as HTMLElement, "influx-2");
    await user.type(inputs[2] as HTMLElement, "subnet-9");
    await user.type(inputs[3] as HTMLElement, "sg-9");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() =>
      expect(mockCreateInstance).toHaveBeenCalledWith({
        name: "influx-2",
        password: "TempPassword123!",
        dbInstanceType: "db.influx.medium",
        vpcSubnetIds: ["subnet-9"],
        vpcSecurityGroupIds: ["sg-9"],
        allocatedStorage: 20,
      })
    );
    await waitFor(() =>
      expect(screen.getByText("Instance influx-2 created.")).toBeTruthy()
    );
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByText("Instance influx-2 created.")).toBeNull()
    );
  });

  it("keeps instance Create disabled until fields are filled and closes on Cancel", async () => {
    const user = userEvent.setup();
    render(<TimestreamInfluxDBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create instance/i }));
    const dlg = modalDlg("Create DB instance");
    const createBtn = dialogButton(dlg, "Create") as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
    await user.type(dlg.querySelector('input[placeholder="influx-1"]') as HTMLElement, "x");
    await user.type(dlg.querySelector('input[placeholder="subnet-1"]') as HTMLElement, "s");
    await user.type(dlg.querySelector('input[placeholder="sg-1"]') as HTMLElement, "g");
    expect(createBtn.disabled).toBe(false);
    await user.click(dialogButton(dlg, "Cancel"));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
    await user.click(screen.getByRole("button", { name: /Create instance/i }));
    const dlg2 = modalDlg("Create DB instance");
    await user.type(dlg2.querySelector('input[placeholder="influx-1"]') as HTMLElement, "2");
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg2.className).toContain("hidden"));
  });

  it("deletes an instance after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteInstance.mockResolvedValueOnce({ ok: true });
    render(<TimestreamInfluxDBDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("influx-1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete influx-1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteInstance).toHaveBeenCalledWith("influx-1"));
  });

  it("reboots an instance", async () => {
    const user = userEvent.setup();
    mockReboot.mockResolvedValueOnce({ instance: {} });
    render(<TimestreamInfluxDBDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("influx-1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Reboot$/i }));
    await waitFor(() => expect(mockReboot).toHaveBeenCalledWith("influx-1"));
    await waitFor(() => expect(screen.getByText("Rebooting influx-1.")).toBeTruthy());
    // cover the wrap() fallback arm: message-less rejection (second render)
    mockReboot.mockRejectedValueOnce({});
    const { unmount } = render(<TimestreamInfluxDBDashboard />, { wrapper: createWrapper() });
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: /^Reboot$/i }).length).toBe(2)
    );
    await user.click(screen.getAllByRole("button", { name: /^Reboot$/i })[1]);
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
    unmount();
  });
});

describe("TimestreamInfluxDBDashboard — clusters tab", () => {
  it("lists clusters", async () => {
    const user = userEvent.setup();
    render(<TimestreamInfluxDBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^DB clusters/ }));
    await waitFor(() => expect(screen.getByText("cluster-1")).toBeTruthy());
  });

  it("creates a cluster from the modal", async () => {
    const user = userEvent.setup();
    mockCreateCluster.mockResolvedValueOnce({ cluster: {} });
    render(<TimestreamInfluxDBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^DB clusters/ }));
    await user.click(screen.getByRole("button", { name: /Create cluster/i }));
    const dlg = modalDlg("Create DB cluster");
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0] as HTMLElement, "cluster-2");
    await user.type(inputs[1] as HTMLElement, "subnet-1");
    await user.type(inputs[2] as HTMLElement, "subnet-2");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() =>
      expect(mockCreateCluster).toHaveBeenCalledWith({
        name: "cluster-2",
        dbInstanceType: "db.influx.medium",
        vpcSubnetIds: ["subnet-1", "subnet-2"],
      })
    );
  });

  it("closes the cluster modal via Cancel and Escape", async () => {
    const user = userEvent.setup();
    render(<TimestreamInfluxDBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^DB clusters/ }));
    await user.click(screen.getByRole("button", { name: /Create cluster/i }));
    let dlg = modalDlg("Create DB cluster");
    await user.click(dialogButton(dlg, "Cancel"));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
    await user.click(screen.getByRole("button", { name: /Create cluster/i }));
    dlg = modalDlg("Create DB cluster");
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("deletes a cluster after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteCluster.mockResolvedValueOnce({ ok: true });
    render(<TimestreamInfluxDBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^DB clusters/ }));
    await waitFor(() => expect(screen.getByText("cluster-1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete cluster-1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteCluster).toHaveBeenCalledWith("cluster-1"));
  });
});

describe("TimestreamInfluxDBDashboard — backups tab", () => {
  it("lists backups", async () => {
    const user = userEvent.setup();
    render(<TimestreamInfluxDBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Backups/ }));
    await waitFor(() => expect(screen.getByText("backup-1")).toBeTruthy());
  });

  it("creates a backup for an instance and dismisses the alert", async () => {
    const user = userEvent.setup();
    mockCreateBackup.mockResolvedValueOnce({ backup: {} });
    render(<TimestreamInfluxDBDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByRole("button", { name: /^Backup$/i })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Backup$/i }));
    await waitFor(() => expect(screen.getByText(/Backup instance — influx-1/)).toBeTruthy());
    const dlg = modalDlg("Backup instance — influx-1");
    await user.type(dlg.querySelector('input[placeholder="backup-1"]') as HTMLElement, "snap-1");
    await user.click(dialogButton(dlg, "Create backup"));
    await waitFor(() =>
      expect(mockCreateBackup).toHaveBeenCalledWith({
        name: "snap-1",
        dbResourceId: "i1",
      })
    );
    await waitFor(() => expect(screen.getByText("Backup snap-1 created.")).toBeTruthy());
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() => expect(screen.queryByText("Backup snap-1 created.")).toBeNull());
    await user.click(screen.getByRole("button", { name: /^Backup$/i }));
    const backupDlg = modalDlg("Backup instance — influx-1");
    await user.click(dialogButton(backupDlg, "Cancel"));
    await waitFor(() => expect(backupDlg.className).toContain("hidden"));
  });

  it("deletes a backup after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteBackup.mockResolvedValueOnce({ ok: true });
    render(<TimestreamInfluxDBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Backups/ }));
    await waitFor(() => expect(screen.getByText("backup-1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete backup-1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteBackup).toHaveBeenCalledWith("backup-1"));
  });
});

describe("TimestreamInfluxDBDashboard — parameter groups tab", () => {
  it("lists parameter groups and creates one", async () => {
    const user = userEvent.setup();
    mockCreateGroup.mockResolvedValueOnce({ parameterGroup: {} });
    render(<TimestreamInfluxDBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Parameter groups/ }));
    await waitFor(() => expect(screen.getByText("pg-1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Create parameter group/i }));
    const dlg = modalDlg("Create parameter group");
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0] as HTMLElement, "pg-2");
    await user.type(inputs[1] as HTMLElement, "desc-2");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() =>
      expect(mockCreateGroup).toHaveBeenCalledWith({
        name: "pg-2",
        description: "desc-2",
        parameters: [],
      })
    );
  });

  it("keeps group Create disabled until fields are filled and closes on Cancel", async () => {
    const user = userEvent.setup();
    render(<TimestreamInfluxDBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Parameter groups/ }));
    await user.click(screen.getByRole("button", { name: /Create parameter group/i }));
    const dlg = modalDlg("Create parameter group");
    const createBtn = dialogButton(dlg, "Create") as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
    await user.type(dlg.querySelector('input[placeholder="pg-1"]') as HTMLElement, "g");
    await user.type(dlg.querySelector('input[placeholder="pg-1"]') as HTMLElement, "2");
    await user.click(dialogButton(dlg, "Cancel"));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
    await user.click(screen.getByRole("button", { name: /Create parameter group/i }));
    const dlg2 = modalDlg("Create parameter group");
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg2.className).toContain("hidden"));
  });
});
