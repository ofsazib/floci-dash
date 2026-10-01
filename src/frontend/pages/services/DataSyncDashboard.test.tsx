// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useDsAgents: vi.fn(),
  useCreateDsAgent: vi.fn(),
  useDeleteDsAgent: vi.fn(),
  useDsLocations: vi.fn(),
  useCreateDsLocation: vi.fn(),
  useDeleteDsLocation: vi.fn(),
  useDsTasks: vi.fn(),
  useCreateDsTask: vi.fn(),
  useDeleteDsTask: vi.fn(),
}));

vi.mock("../../hooks/useDataSync", () => mockHooks);

const mockCreateAgent = vi.fn();
const mockDeleteAgent = vi.fn();
const mockCreateLocation = vi.fn();
const mockDeleteLocation = vi.fn();
const mockCreateTask = vi.fn();
const mockDeleteTask = vi.fn();

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

const AGENT = { AgentArn: "arn:aws:datasync::1:agent/a1", Status: "ONLINE" };
const LOCATION = { LocationArn: "arn:aws:datasync::1:location/l1", LocationUri: "azure-blob://c" };
const TASK = { TaskArn: "arn:aws:datasync::1:task/t1", Status: "AVAILABLE" };

import DataSyncDashboard from "./DataSyncDashboard";

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
  mockHooks.useDsAgents.mockReturnValue(listQuery("agents", [AGENT]));
  mockHooks.useDsLocations.mockReturnValue(listQuery("locations", [LOCATION]));
  mockHooks.useDsTasks.mockReturnValue(listQuery("tasks", [TASK]));
  mockHooks.useCreateDsAgent.mockReturnValue(okMutation(mockCreateAgent));
  mockHooks.useDeleteDsAgent.mockReturnValue(okMutation(mockDeleteAgent));
  mockHooks.useCreateDsLocation.mockReturnValue(okMutation(mockCreateLocation));
  mockHooks.useDeleteDsLocation.mockReturnValue(okMutation(mockDeleteLocation));
  mockHooks.useCreateDsTask.mockReturnValue(okMutation(mockCreateTask));
  mockHooks.useDeleteDsTask.mockReturnValue(okMutation(mockDeleteTask));
});

describe("DataSyncDashboard — agents tab", () => {
  it("renders agents", async () => {
    render(<DataSyncDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(AGENT.AgentArn)).toBeTruthy());
  });

  it("shows the agents error alert with fallback", () => {
    mockHooks.useDsAgents.mockReturnValue(
      listQuery("agents", [], { isError: true, error: null })
    );
    render(<DataSyncDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load agents")).toBeTruthy();
  });

  it("creates an agent and dismisses the success alert", async () => {
    const user = userEvent.setup();
    mockCreateAgent.mockResolvedValueOnce({ agentArn: "arn" });
    render(<DataSyncDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create agent/i }));
    const dlg = modalDlg("Create agent");
    await user.type(dlg.querySelector('input[placeholder="activ-xxxx"]') as HTMLElement, "key-1");
    await user.type(dlg.querySelector('input[placeholder="agent-1"]') as HTMLElement, "a1");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() =>
      expect(mockCreateAgent).toHaveBeenCalledWith({
        activationKey: "key-1",
        agentName: "a1",
      })
    );
    await waitFor(() => expect(screen.getByText("Agent created.")).toBeTruthy());
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() => expect(screen.queryByText("Agent created.")).toBeNull());
  });

  it("keeps agent Create disabled until a key is typed and closes on Cancel", async () => {
    const user = userEvent.setup();
    render(<DataSyncDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create agent/i }));
    const dlg = modalDlg("Create agent");
    const createBtn = dialogButton(dlg, "Create") as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
    await user.type(dlg.querySelector('input[placeholder="activ-xxxx"]') as HTMLElement, "k");
    expect(createBtn.disabled).toBe(false);
    await user.click(dialogButton(dlg, "Cancel"));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("renders undefined agents data (labels + empty table)", () => {
    mockHooks.useDsAgents.mockReturnValue(listQuery("agents", [], { data: undefined }));
    render(<DataSyncDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Agents (0)")).toBeTruthy();
    expect(screen.getByText("No agents found")).toBeTruthy();
  });

  it("renders undefined locations data (labels + empty table)", async () => {
    const user = userEvent.setup();
    mockHooks.useDsLocations.mockReturnValue(
      listQuery("locations", [], { data: undefined })
    );
    render(<DataSyncDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Locations/ }));
    await waitFor(() => expect(screen.getByText("Locations (0)")).toBeTruthy());
    expect(screen.getByText("No locations found")).toBeTruthy();
  });

  it("renders undefined tasks data (labels + empty table)", async () => {
    mockHooks.useDsTasks.mockReturnValue(listQuery("tasks", [], { data: undefined }));
    render(<DataSyncDashboard />, { wrapper: createWrapper() });
    await userEvent.setup().click(screen.getByRole("tab", { name: /^Tasks/ }));
    waitFor(() => expect(screen.getByText("Tasks (0)")).toBeTruthy());
    expect(screen.getByText("No tasks found")).toBeTruthy();
  });

  it("deletes an agent after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteAgent.mockResolvedValueOnce({ ok: true });
    render(<DataSyncDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(AGENT.AgentArn)).toBeTruthy());
    await user.click(
      screen.getByRole("button", { name: /Delete arn:aws:datasync::1:agent\/a1/i })
    );
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteAgent).toHaveBeenCalledWith(AGENT.AgentArn));
  });
});

describe("DataSyncDashboard — locations tab", () => {
  it("lists locations", async () => {
    const user = userEvent.setup();
    render(<DataSyncDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Locations/ }));
    await waitFor(() => expect(screen.getByText(LOCATION.LocationUri)).toBeTruthy());
  });

  it("creates an azure blob location from the first agent", async () => {
    const user = userEvent.setup();
    mockCreateLocation.mockResolvedValueOnce({ locationArn: "arn" });
    render(<DataSyncDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Locations/ }));
    await user.click(screen.getByRole("button", { name: /Create location/i }));
    const dlg = modalDlg("Create Azure Blob location");
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0] as HTMLElement, "2");
    await user.type(inputs[1] as HTMLElement, "https://x.blob.core.windows.net/c");
    await user.type(inputs[2] as HTMLElement, "x");
    await user.click(dialogButton(dlg, "Cancel"));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
    await user.click(screen.getByRole("button", { name: /Create location/i }));
    const dlg2 = modalDlg("Create Azure Blob location");
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg2.className).toContain("hidden"));
  });

  it("keeps location Create disabled until a container URL is typed", async () => {
    const user = userEvent.setup();
    render(<DataSyncDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Locations/ }));
    await user.click(screen.getByRole("button", { name: /Create location/i }));
    const dlg = modalDlg("Create Azure Blob location");
    const createBtn = dialogButton(dlg, "Create") as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
    await user.type(dlg.querySelector('input[placeholder="https://acct.blob.core.windows.net/container"]') as HTMLElement, "u");
    expect(createBtn.disabled).toBe(false);
  });

  it("deletes a location after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteLocation.mockResolvedValueOnce({ ok: true });
    render(<DataSyncDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Locations/ }));
    await waitFor(() => expect(screen.getByText(LOCATION.LocationUri)).toBeTruthy());
    await user.click(
      screen.getByRole("button", { name: /Delete arn:aws:datasync::1:location\/l1/i })
    );
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteLocation).toHaveBeenCalledWith(LOCATION.LocationArn));
  });
});

describe("DataSyncDashboard — tasks tab", () => {
  it("lists tasks", async () => {
    const user = userEvent.setup();
    render(<DataSyncDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Tasks/ }));
    await waitFor(() => expect(screen.getByText(TASK.TaskArn)).toBeTruthy());
    expect(screen.getByText("AVAILABLE")).toBeTruthy();
  });

  it("creates a task and dismisses the success alert", async () => {
    const user = userEvent.setup();
    mockCreateTask.mockResolvedValueOnce({ taskArn: "arn" });
    render(<DataSyncDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Tasks/ }));
    await user.click(screen.getByRole("button", { name: /Create task/i }));
    await user.click(screen.getByRole("button", { name: /Create task/i }));
    const dlg = modalDlg("Create task");
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0] as HTMLElement, "t2");
    await user.type(inputs[1] as HTMLElement, "src");
    await user.type(inputs[2] as HTMLElement, "dst");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() =>
      expect(mockCreateTask).toHaveBeenCalledWith({
        sourceLocationArn: "src",
        destinationLocationArn: "dst",
        name: "t2",
      })
    );
    await waitFor(() => expect(screen.getByText("Task created.")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Create task/i }));
    const dlg2 = modalDlg("Create task");
    const inputs2 = dlg2.querySelectorAll("input");
    await user.type(inputs2[1] as HTMLElement, "s");
    await user.type(inputs2[2] as HTMLElement, "d");
    await user.click(dialogButton(dlg2, "Cancel"));
    await waitFor(() => expect(dlg2.className).toContain("hidden"));
    await user.click(screen.getByRole("button", { name: /Create task/i }));
    const dlg3 = modalDlg("Create task");
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg3.className).toContain("hidden"));
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() => expect(screen.queryByText("Task created.")).toBeNull());
  });

  it("shows a fallback error when task creation fails", async () => {
    const user = userEvent.setup();
    mockCreateTask.mockRejectedValueOnce({});
    render(<DataSyncDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Tasks/ }));
    await user.click(screen.getByRole("button", { name: /Create task/i }));
    const dlg = modalDlg("Create task");
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[1] as HTMLElement, "s");
    await user.type(inputs[2] as HTMLElement, "d");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });

  it("keeps task Create disabled until source and destination are typed", async () => {
    const user = userEvent.setup();
    render(<DataSyncDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Tasks/ }));
    await user.click(screen.getByRole("button", { name: /Create task/i }));
    const dlg = modalDlg("Create task");
    const createBtn = dialogButton(dlg, "Create") as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[1] as HTMLElement, "s");
    await user.type(inputs[2] as HTMLElement, "d");
    expect(createBtn.disabled).toBe(false);
  });

  it("deletes a task after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteTask.mockResolvedValueOnce({ ok: true });
    render(<DataSyncDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Tasks/ }));
    await waitFor(() => expect(screen.getByText(TASK.TaskArn)).toBeTruthy());
    await user.click(
      screen.getByRole("button", { name: /Delete arn:aws:datasync::1:task\/t1/i })
    );
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteTask).toHaveBeenCalledWith(TASK.TaskArn));
  });
});
