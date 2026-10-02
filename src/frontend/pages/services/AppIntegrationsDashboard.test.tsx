// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useAiEventIntegrations: vi.fn(),
  useCreateAiEventIntegration: vi.fn(),
  useDeleteAiEventIntegration: vi.fn(),
  useAiDataIntegrations: vi.fn(),
  useCreateAiDataIntegration: vi.fn(),
  useDeleteAiDataIntegration: vi.fn(),
}));

vi.mock("../../hooks/useAppIntegrations", () => mockHooks);

const mockCreateEvent = vi.fn();
const mockDeleteEvent = vi.fn();
const mockCreateData = vi.fn();
const mockDeleteData = vi.fn();

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

const EVENT = { Name: "ev1", EventIntegrationArn: "arn:ei" };
const DATA = { Arn: "arn:di", Name: "di1", SourceURI: "s3://b" };

import AppIntegrationsDashboard from "./AppIntegrationsDashboard";

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
  mockHooks.useAiEventIntegrations.mockReturnValue(listQuery("eventIntegrations", [EVENT]));
  mockHooks.useAiDataIntegrations.mockReturnValue(listQuery("dataIntegrations", [DATA]));
  mockHooks.useCreateAiEventIntegration.mockReturnValue(okMutation(mockCreateEvent));
  mockHooks.useDeleteAiEventIntegration.mockReturnValue(okMutation(mockDeleteEvent));
  mockHooks.useCreateAiDataIntegration.mockReturnValue(okMutation(mockCreateData));
  mockHooks.useDeleteAiDataIntegration.mockReturnValue(okMutation(mockDeleteData));
});

describe("AppIntegrationsDashboard — events tab", () => {
  it("renders event integrations", async () => {
    render(<AppIntegrationsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("ev1")).toBeTruthy());
  });

  it("shows the events error alert", () => {
    mockHooks.useAiEventIntegrations.mockReturnValue(
      listQuery("eventIntegrations", [], { isError: true, error: new Error("down") })
    );
    render(<AppIntegrationsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("down")).toBeTruthy();
  });

  it("renders with undefined events data (loading)", () => {
    mockHooks.useAiEventIntegrations.mockReturnValue(
      listQuery("eventIntegrations", [], { data: undefined, isLoading: true })
    );
    render(<AppIntegrationsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Event integrations (0)")).toBeTruthy();
  });

  it("creates an event integration and dismisses the success alert", async () => {
    const user = userEvent.setup();
    mockCreateEvent.mockResolvedValueOnce({ eventIntegration: {} });
    render(<AppIntegrationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create event integration/i }));
    const dlg = modalDlg("Create event integration");
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0] as HTMLElement, "ev2");
    await user.type(inputs[1] as HTMLElement, "bus2");
    await user.type(inputs[2] as HTMLElement, "aws.s3");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() =>
      expect(mockCreateEvent).toHaveBeenCalledWith({
        name: "ev2",
        eventBridgeBus: "bus2",
        eventFilter: { Source: "aws.connectaws.s3" },
      })
    );
    await waitFor(() =>
      expect(screen.getByText("Event integration ev2 created.")).toBeTruthy()
    );
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByText("Event integration ev2 created.")).toBeNull()
    );
  });

  it("keeps event Create disabled until fields are filled and closes on Cancel and Escape", async () => {
    const user = userEvent.setup();
    render(<AppIntegrationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create event integration/i }));
    const dlg = modalDlg("Create event integration");
    const createBtn = dialogButton(dlg, "Create") as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0] as HTMLElement, "e");
    await user.type(inputs[1] as HTMLElement, "b");
    await user.type(inputs[2] as HTMLElement, "s");
    expect(createBtn.disabled).toBe(false);
    await user.click(dialogButton(dlg, "Cancel"));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
    await user.click(screen.getByRole("button", { name: /Create event integration/i }));
    const dlg2 = modalDlg("Create event integration");
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg2.className).toContain("hidden"));
  });

  it("shows a fallback error when event creation fails", async () => {
    const user = userEvent.setup();
    mockCreateEvent.mockRejectedValueOnce({});
    render(<AppIntegrationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create event integration/i }));
    const dlg = modalDlg("Create event integration");
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0] as HTMLElement, "e");
    await user.type(inputs[1] as HTMLElement, "b");
    await user.type(inputs[2] as HTMLElement, "s");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });

  it("deletes an event integration after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteEvent.mockResolvedValueOnce({ ok: true });
    render(<AppIntegrationsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("ev1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete ev1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteEvent).toHaveBeenCalledWith("ev1"));
  });
});

describe("AppIntegrationsDashboard — data tab", () => {
  it("lists data integrations", async () => {
    const user = userEvent.setup();
    render(<AppIntegrationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Data integrations/ }));
    await waitFor(() => expect(screen.getByText("di1")).toBeTruthy());
    expect(screen.getByText("s3://b")).toBeTruthy();
  });

  it("renders with undefined data integrations data (loading)", () => {
    mockHooks.useAiDataIntegrations.mockReturnValue(
      listQuery("dataIntegrations", [], { data: undefined, isLoading: true })
    );
    render(<AppIntegrationsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Data integrations (0)")).toBeTruthy();
  });

  it("creates a data integration", async () => {
    const user = userEvent.setup();
    mockCreateData.mockResolvedValueOnce({ dataIntegration: {} });
    render(<AppIntegrationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Data integrations/ }));
    await user.click(screen.getByRole("button", { name: /Create data integration/i }));
    const dlg = modalDlg("Create data integration");
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0] as HTMLElement, "di2");
    await user.type(inputs[1] as HTMLElement, "s3://c");
    await user.type(inputs[2] as HTMLElement, "key2");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() =>
      expect(mockCreateData).toHaveBeenCalledWith({
        name: "di2",
        sourceUri: "s3://c",
        kmsKey: "key2",
      })
    );
    await user.click(screen.getByRole("button", { name: /Create data integration/i }));
    const dlg2 = modalDlg("Create data integration");
    await user.click(dialogButton(dlg2, "Cancel"));
    await waitFor(() => expect(dlg2.className).toContain("hidden"));
  });

  it("deletes a data integration after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteData.mockResolvedValueOnce({ ok: true });
    render(<AppIntegrationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Data integrations/ }));
    await waitFor(() => expect(screen.getByText("di1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete di1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteData).toHaveBeenCalledWith("di1"));
  });
});
