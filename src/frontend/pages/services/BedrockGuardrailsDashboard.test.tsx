// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useBedrockGuardrails: vi.fn(),
  useCreateBedrockGuardrail: vi.fn(),
  useDeleteBedrockGuardrail: vi.fn(),
}));

vi.mock("../../hooks/useBedrockGuardrails", () => mockHooks);

const mockCreate = vi.fn();
const mockDelete = vi.fn();

function okMutation(mock: ReturnType<typeof vi.fn>, isPending = false) {
  return { mutateAsync: mock, isPending };
}

function listQuery(overrides: Record<string, unknown> = {}) {
  return {
    data: { guardrails: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

const GUARDRAIL = {
  id: "gr-1",
  arn: "arn:aws:bedrock::1:guardrail/gr-1",
  name: "safe",
  description: "keeps things safe",
  status: "READY",
  version: "DRAFT",
};

import BedrockGuardrailsDashboard from "./BedrockGuardrailsDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockHooks.useCreateBedrockGuardrail.mockReturnValue(okMutation(mockCreate));
  mockHooks.useDeleteBedrockGuardrail.mockReturnValue(okMutation(mockDelete));
});

describe("BedrockGuardrailsDashboard", () => {
  it("renders guardrails with fields", async () => {
    mockHooks.useBedrockGuardrails.mockReturnValue(
      listQuery({ data: { guardrails: [GUARDRAIL], total: 1 } })
    );
    render(<BedrockGuardrailsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("safe")).toBeTruthy());
    expect(screen.getByText("READY")).toBeTruthy();
    expect(screen.getByText("DRAFT")).toBeTruthy();
    expect(screen.getByText("keeps things safe")).toBeTruthy();
  });

  it("renders the dash description fallback", async () => {
    mockHooks.useBedrockGuardrails.mockReturnValue(
      listQuery({
        data: { guardrails: [{ ...GUARDRAIL, description: undefined }], total: 1 },
      })
    );
    render(<BedrockGuardrailsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("safe")).toBeTruthy());
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });

  it("shows the empty table message", () => {
    mockHooks.useBedrockGuardrails.mockReturnValue(listQuery());
    render(<BedrockGuardrailsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No guardrails found")).toBeTruthy();
  });

  it("renders with undefined data (loading)", () => {
    mockHooks.useBedrockGuardrails.mockReturnValue(
      listQuery({ data: undefined, isLoading: true })
    );
    render(<BedrockGuardrailsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Guardrails")).toBeTruthy();
  });

  it("shows the error alert with fallback message", () => {
    mockHooks.useBedrockGuardrails.mockReturnValue(
      listQuery({ isError: true, error: null })
    );
    render(<BedrockGuardrailsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load guardrails")).toBeTruthy();
  });

  it("creates a guardrail and dismisses the success alert", async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValueOnce({ guardrail: {} });
    render(<BedrockGuardrailsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create guardrail/i }));
    await user.type(screen.getByPlaceholderText("safe-guardrail"), "safe2");
    const createDlg = screen
      .getAllByText("Name")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    const descInput = createDlg.querySelectorAll("input")[1] as HTMLElement;
    if (descInput) await user.type(descInput, "desc");
    await user.type(document.querySelector("textarea") as HTMLElement, "custom input msg");
    await user.click(screen.getByRole("button", { name: /^Create$/i }));
    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith({
        name: "safe2",
        description: "desc",
        blockedInputMessaging: "Sorry, I can't answer that.custom input msg",
        blockedOutputsMessaging: "Sorry, I can't provide that response.",
      })
    );
    await waitFor(() =>
      expect(screen.getByText("Guardrail safe2 created.")).toBeTruthy()
    );
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByText("Guardrail safe2 created.")).toBeNull()
    );
  });

  it("shows a fallback error when create fails", async () => {
    const user = userEvent.setup();
    mockCreate.mockRejectedValueOnce({});
    render(<BedrockGuardrailsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create guardrail/i }));
    await user.type(screen.getByPlaceholderText("safe-guardrail"), "safe2");
    const createDlg = screen
      .getAllByText("Name")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    // description left empty — covers the `description || undefined` falsy arm
    await user.type(document.querySelector("textarea") as HTMLElement, "custom input msg");
    await user.click(screen.getByRole("button", { name: /^Create$/i }));
    await waitFor(() =>
      expect(screen.getByText("Failed to create guardrail")).toBeTruthy()
    );
  });

  it("keeps Create disabled until a name is typed and closes on Cancel", async () => {
    const user = userEvent.setup();
    render(<BedrockGuardrailsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create guardrail/i }));
    const dlg = screen
      .getAllByText("Name")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    const createBtn = Array.from(dlg.querySelectorAll("button")).find(
      (b) => b.textContent === "Create"
    ) as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
    await user.type(dlg.querySelector("input") as HTMLElement, "x");
    expect(createBtn.disabled).toBe(false);
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[1] as HTMLElement, "desc");
    const textareas = dlg.querySelectorAll("textarea");
    await user.type(textareas[0] as HTMLElement, "no input");
    await user.type(textareas[1] as HTMLElement, "no output");
    const cancelBtn = Array.from(dlg.querySelectorAll("button")).find(
      (b) => b.textContent === "Cancel"
    ) as HTMLElement;
    await user.click(cancelBtn);
    await waitFor(() => expect(dlg.className).toContain("hidden"));
    await user.click(screen.getByRole("button", { name: /Create guardrail/i }));
    const dlg2 = screen
      .getAllByText("Name")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg2.className).toContain("hidden"));
  });

  it("deletes a guardrail after confirmation", async () => {
    const user = userEvent.setup();
    mockDelete.mockResolvedValueOnce({ ok: true });
    mockHooks.useBedrockGuardrails.mockReturnValue(
      listQuery({ data: { guardrails: [GUARDRAIL], total: 1 } })
    );
    render(<BedrockGuardrailsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("safe")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete safe/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith({ id: "gr-1" }));
  });

  it("shows a delete success alert and dismisses it", async () => {
    const user = userEvent.setup();
    mockDelete.mockResolvedValueOnce({ ok: true });
    mockHooks.useBedrockGuardrails.mockReturnValue(
      listQuery({ data: { guardrails: [GUARDRAIL], total: 1 } })
    );
    render(<BedrockGuardrailsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("safe")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete safe/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() =>
      expect(screen.getByText("Guardrail safe deleted.")).toBeTruthy()
    );
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByText("Guardrail safe deleted.")).toBeNull()
    );
  });
});
