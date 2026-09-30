// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useOamSinks: vi.fn(),
  useCreateOamSink: vi.fn(),
  useDeleteOamSink: vi.fn(),
  useOamSinkPolicy: vi.fn(),
  usePutOamSinkPolicy: vi.fn(),
  useOamAttachedLinks: vi.fn(),
  useOamLinks: vi.fn(),
  useCreateOamLink: vi.fn(),
  useDeleteOamLink: vi.fn(),
}));

vi.mock("../../hooks/useOAM", () => mockHooks);

const mockCreateSink = vi.fn();
const mockDeleteSink = vi.fn();
const mockPutPolicy = vi.fn();
const mockCreateLink = vi.fn();
const mockDeleteLink = vi.fn();

function okMutation(mock: ReturnType<typeof vi.fn>, isPending = false) {
  return { mutateAsync: mock, isPending };
}

function listQuery(data: unknown, overrides: Record<string, unknown> = {}) {
  return {
    data,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

const SINK = { Arn: "arn:aws:oam::1:sink/s1", Id: "s1", Name: "monitor" };
const LINK = {
  Arn: "arn:aws:oam::1:link/l1",
  Id: "l1",
  Label: "l",
  ResourceTypes: ["AWS::Metric"],
  SinkArn: "arn:aws:oam::1:sink/s1",
};

import OamDashboard from "./OamDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockHooks.useCreateOamSink.mockReturnValue(okMutation(mockCreateSink));
  mockHooks.useDeleteOamSink.mockReturnValue(okMutation(mockDeleteSink));
  mockHooks.usePutOamSinkPolicy.mockReturnValue(okMutation(mockPutPolicy));
  mockHooks.useCreateOamLink.mockReturnValue(okMutation(mockCreateLink));
  mockHooks.useDeleteOamLink.mockReturnValue(okMutation(mockDeleteLink));
  mockHooks.useOamSinkPolicy.mockReturnValue({ data: undefined, isLoading: false });
  mockHooks.useOamAttachedLinks.mockReturnValue({
    data: { links: [{ Label: "l", LinkArn: LINK.Arn, ResourceTypes: ["AWS::Metric"] }], total: 1 },
    isLoading: false,
  });
});

describe("OamDashboard — sinks tab", () => {
  it("renders sinks", async () => {
    mockHooks.useOamSinks.mockReturnValue(listQuery({ sinks: [SINK], total: 1 }));
    mockHooks.useOamLinks.mockReturnValue(listQuery({ links: [LINK], total: 1 }));
    render(<OamDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("monitor")).toBeTruthy());
  });

  it("shows the sinks error alert with fallback message", () => {
    mockHooks.useOamSinks.mockReturnValue(
      listQuery(undefined, { isError: true, error: null })
    );
    mockHooks.useOamLinks.mockReturnValue(listQuery({ links: [], total: 0 }));
    render(<OamDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load sinks")).toBeTruthy();
  });

  it("renders with undefined data (loading tables)", () => {
    mockHooks.useOamSinks.mockReturnValue(listQuery(undefined));
    mockHooks.useOamLinks.mockReturnValue(listQuery(undefined));
    render(<OamDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Sinks (0)")).toBeTruthy();
  });

  it("creates a sink and dismisses the success alert", async () => {
    const user = userEvent.setup();
    mockCreateSink.mockResolvedValueOnce({ sink: {} });
    mockHooks.useOamSinks.mockReturnValue(listQuery({ sinks: [SINK], total: 1 }));
    mockHooks.useOamLinks.mockReturnValue(listQuery({ links: [], total: 0 }));
    render(<OamDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create sink/i }));
    await user.type(screen.getByPlaceholderText("monitoring-account"), "mon");
    await user.click(screen.getByRole("button", { name: /^Create$/i }));
    await waitFor(() => expect(mockCreateSink).toHaveBeenCalledWith("mon"));
    await waitFor(() => expect(screen.getByText("Sink created.")).toBeTruthy());
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() => expect(screen.queryByText("Sink created.")).toBeNull());
  });

  it("shows a fallback error alert when sink creation fails", async () => {
    const user = userEvent.setup();
    mockCreateSink.mockRejectedValueOnce({});
    mockHooks.useOamSinks.mockReturnValue(listQuery({ sinks: [], total: 0 }));
    mockHooks.useOamLinks.mockReturnValue(listQuery({ links: [], total: 0 }));
    render(<OamDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create sink/i }));
    await user.type(screen.getByPlaceholderText("monitoring-account"), "mon");
    await user.click(screen.getByRole("button", { name: /^Create$/i }));
    await waitFor(() => expect(screen.getByText("Failed to create sink")).toBeTruthy());
  });

  it("keeps Create disabled until a name is typed and closes on Cancel", async () => {
    const user = userEvent.setup();
    mockHooks.useOamSinks.mockReturnValue(listQuery({ sinks: [], total: 0 }));
    mockHooks.useOamLinks.mockReturnValue(listQuery({ links: [], total: 0 }));
    render(<OamDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create sink/i }));
    const dlg = screen
      .getAllByText("Sink name")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    const createBtn = Array.from(dlg.querySelectorAll("button")).find(
      (b) => b.textContent === "Create"
    ) as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
    await user.type(dlg.querySelector("input") as HTMLElement, "x");
    expect(createBtn.disabled).toBe(false);
    const cancelBtn = Array.from(dlg.querySelectorAll("button")).find(
      (b) => b.textContent === "Cancel"
    ) as HTMLElement;
    await user.click(cancelBtn);
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("opens the policy modal, saves a policy, and shows attached links", async () => {
    const user = userEvent.setup();
    mockPutPolicy.mockResolvedValueOnce({ policy: "p" });
    mockHooks.useOamSinks.mockReturnValue(listQuery({ sinks: [SINK], total: 1 }));
    mockHooks.useOamLinks.mockReturnValue(listQuery({ links: [LINK], total: 1 }));
    render(<OamDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("monitor")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Policy$/i }));
    await waitFor(() =>
      expect(screen.getByText("Sink policy — monitor")).toBeTruthy()
    );
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '{"ok":true}' } });
    await user.click(screen.getByRole("button", { name: /Save policy/i }));
    await waitFor(() =>
      expect(mockPutPolicy).toHaveBeenCalledWith({
        identifier: SINK.Arn,
        policy: '{"ok":true}',
      })
    );
    await waitFor(() => expect(screen.getByText("Sink policy saved.")).toBeTruthy());
    await waitFor(() => expect(screen.getByText("Attached links")).toBeTruthy());
    await waitFor(() => expect(screen.getByText("arn:aws:oam::1:link/l1")).toBeTruthy());
    fireEvent.click(
      (screen.getByText(/Sink policy — monitor/).closest('[role="dialog"]') as HTMLElement).querySelector('[class*="awsui_dismiss-button"]') as HTMLElement
    );
    await waitFor(() => expect(screen.queryByText("Sink policy saved.")).toBeNull());
  });

  it("renders dash arms for attached links without types", async () => {
    mockHooks.useOamAttachedLinks.mockReturnValue({
      data: { links: [{ Label: "l2", LinkArn: "arn:l2" }], total: 1 },
      isLoading: false,
    });
    mockHooks.useOamSinks.mockReturnValue(listQuery({ sinks: [SINK], total: 1 }));
    mockHooks.useOamLinks.mockReturnValue(listQuery({ links: [LINK], total: 1 }));
    render(<OamDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("monitor")).toBeTruthy());
    await userEvent.setup().click(screen.getByRole("button", { name: /^Policy$/i }));
    await waitFor(() => expect(screen.getByText("arn:l2")).toBeTruthy());
  });

  it("shows a fallback policy error alert when save fails", async () => {
    const user = userEvent.setup();
    mockPutPolicy.mockRejectedValueOnce({});
    mockHooks.useOamSinks.mockReturnValue(listQuery({ sinks: [SINK], total: 1 }));
    mockHooks.useOamLinks.mockReturnValue(listQuery({ links: [], total: 0 }));
    mockHooks.useOamAttachedLinks.mockReturnValue({ data: undefined, isLoading: false });
    render(<OamDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("monitor")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Policy$/i }));
    await waitFor(() => expect(screen.getByText("No links found")).toBeTruthy());
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "p" } });
    await user.click(screen.getByRole("button", { name: /Save policy/i }));
    await waitFor(() => expect(screen.getByText("Failed to save policy")).toBeTruthy());
  });

  it("closes the policy modal", async () => {
    const user = userEvent.setup();
    mockHooks.useOamSinks.mockReturnValue(listQuery({ sinks: [SINK], total: 1 }));
    mockHooks.useOamLinks.mockReturnValue(listQuery({ links: [], total: 0 }));
    render(<OamDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("monitor")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Policy$/i }));
    await waitFor(() => expect(screen.getByText(/Sink policy — monitor/)).toBeTruthy());
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(screen.queryByText(/Sink policy — monitor/)).toBeNull());
  });

  it("deletes a sink after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteSink.mockResolvedValueOnce({ ok: true });
    mockHooks.useOamSinks.mockReturnValue(listQuery({ sinks: [SINK], total: 1 }));
    mockHooks.useOamLinks.mockReturnValue(listQuery({ links: [], total: 0 }));
    render(<OamDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("monitor")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete monitor/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteSink).toHaveBeenCalledWith(SINK.Arn));
  });
});

describe("OamDashboard — links tab", () => {
  function setupLinks() {
    mockHooks.useOamSinks.mockReturnValue(listQuery({ sinks: [SINK], total: 1 }));
    mockHooks.useOamLinks.mockReturnValue(listQuery({ links: [LINK], total: 1 }));
    render(<OamDashboard />, { wrapper: createWrapper() });
  }

  it("lists links with types and sink arn", async () => {
    const user = userEvent.setup();
    setupLinks();
    await user.click(screen.getByRole("tab", { name: /^Links/ }));
    await waitFor(() => expect(screen.getByText("arn:aws:oam::1:link/l1")).toBeTruthy());
    expect(screen.getByText("AWS::Metric")).toBeTruthy();
  });

  it("shows the empty links message", async () => {
    const user = userEvent.setup();
    mockHooks.useOamSinks.mockReturnValue(listQuery({ sinks: [SINK], total: 1 }));
    mockHooks.useOamLinks.mockReturnValue(listQuery({ links: [], total: 0 }));
    render(<OamDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Links/ }));
    await waitFor(() => expect(screen.getByText("No links found")).toBeTruthy());
  });

  it("opens the create-link modal with no sinks preselected", async () => {
    const user = userEvent.setup();
    mockHooks.useOamSinks.mockReturnValue(listQuery({ sinks: [], total: 0 }));
    mockHooks.useOamLinks.mockReturnValue(listQuery({ links: [], total: 0 }));
    render(<OamDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Links/ }));
    await user.click(screen.getByRole("button", { name: /Create link/i }));
    const dlg = screen
      .getAllByText("Create link")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    const sinkInput = dlg.querySelector("input") as HTMLInputElement;
    expect(sinkInput.value).toBe("");
    await user.type(sinkInput, "arn:custom");
    await user.click(
      Array.from(dlg.querySelectorAll("button")).find((b) => b.textContent === "Create") as HTMLElement
    );
    await waitFor(() =>
      expect(mockCreateLink).toHaveBeenCalledWith({
        sinkIdentifier: "arn:custom",
        labelTemplate: "$AccountName",
        resourceTypes: ["AWS::Metric"],
      })
    );
  });

  it("opens create-link with undefined sinks data", async () => {
    const user = userEvent.setup();
    mockHooks.useOamSinks.mockReturnValue(listQuery(undefined));
    mockHooks.useOamLinks.mockReturnValue(listQuery({ links: [], total: 0 }));
    render(<OamDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Links/ }));
    await user.click(screen.getByRole("button", { name: /Create link/i }));
    const dlg = screen
      .getAllByText("Create link")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    expect((dlg.querySelector("input") as HTMLInputElement).value).toBe("");
    await user.click(
      Array.from(dlg.querySelectorAll("button")).find((b) => b.textContent === "Cancel") as HTMLElement
    );
    await waitFor(() =>
      expect(screen.queryByText("Create link")?.closest('[role="dialog"]') ?? null).toBeNull()
    );
  });

  it("renders dash arms for undefined links/sinks data and links without types", async () => {
    const user = userEvent.setup();
    mockHooks.useOamSinks.mockReturnValue(
      listQuery({ sinks: [{ ...SINK, Arn: undefined }], total: 1 })
    );
    mockHooks.useOamLinks.mockReturnValue(
      listQuery({ links: [{ Id: "l2", Label: "l2", SinkArn: "arn:s" }], total: 1 })
    );
    render(<OamDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Links/ }));
    await waitFor(() => expect(screen.getByText("l2")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Create link/i }));
    const dlg = screen
      .getAllByText("Create link")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    expect((dlg.querySelector("input") as HTMLInputElement).value).toBe("");
  });

  it("creates a link from the modal", async () => {
    const user = userEvent.setup();
    mockCreateLink.mockResolvedValueOnce({ link: {} });
    setupLinks();
    await user.click(screen.getByRole("tab", { name: /^Links/ }));
    await user.click(screen.getByRole("button", { name: /Create link/i }));
    const dlg = screen
      .getAllByText("Create link")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0] as HTMLElement, "s2");
    await user.type(inputs[1] as HTMLElement, "2");
    await user.type(inputs[2] as HTMLElement, ",AWS::Log");
    await user.click(
      Array.from(dlg.querySelectorAll("button")).find((b) => b.textContent === "Create") as HTMLElement
    );
    await waitFor(() =>
      expect(mockCreateLink).toHaveBeenCalledWith({
        sinkIdentifier: "arn:aws:oam::1:sink/s1s2",
        labelTemplate: "$AccountName2",
        resourceTypes: ["AWS::Metric", "AWS::Log"],
      })
    );
  });

  it("shows a fallback error alert when link creation fails", async () => {
    const user = userEvent.setup();
    mockCreateLink.mockRejectedValueOnce({});
    setupLinks();
    await user.click(screen.getByRole("tab", { name: /^Links/ }));
    await user.click(screen.getByRole("button", { name: /Create link/i }));
    const dlg = screen
      .getAllByText("Create link")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0] as HTMLElement, "s2");
    await user.click(
      Array.from(dlg.querySelectorAll("button")).find((b) => b.textContent === "Create") as HTMLElement
    );
    await waitFor(() => expect(screen.getByText("Failed to create link")).toBeTruthy());
  });

  it("deletes a link after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteLink.mockResolvedValueOnce({ ok: true });
    setupLinks();
    await user.click(screen.getByRole("tab", { name: /^Links/ }));
    await waitFor(() => expect(screen.getByText("arn:aws:oam::1:link/l1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete l1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteLink).toHaveBeenCalledWith(LINK.Arn));
  });
});
