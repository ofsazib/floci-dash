// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mockShadow = vi.fn();
const mockNamed = vi.fn();
const mockUpdate = vi.fn(() => Promise.resolve({}));
const mockDelete = vi.fn(() => Promise.resolve({}));
const mockPublish = vi.fn(() => Promise.resolve({}));
const mockShowToast = vi.fn();

vi.mock("../../hooks/useIotData", () => ({
  useIotShadow: (...args: any[]) => mockShadow(...args),
  useIotUpdateShadow: () => ({ mutateAsync: mockUpdate, isPending: false }),
  useIotDeleteShadow: () => ({ mutateAsync: mockDelete, isPending: false }),
  useIotNamedShadows: (...args: any[]) => mockNamed(...args),
  useIotPublish: () => ({ mutateAsync: mockPublish, isPending: false }),
}));

vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

import { default as IotDataDashboard } from "./IotDataDashboard";

function setup() {
  mockShadow.mockReturnValue({ data: { thingName: "lamp", payload: { state: { reported: 1 } } } });
  mockNamed.mockReturnValue({
    data: { shadows: [{ name: "named1", timestamp: 5 }, {}] },
    isLoading: false,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setup();
});

describe("IotDataDashboard — Shadows tab", () => {
  it("disables Load without a thing name and shows empty state after load", async () => {
    const user = userEvent.setup();
    render(<IotDataDashboard />, { wrapper: createWrapper() });
    expect(
      (screen.getByRole("button", { name: "Load shadow" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    await user.type(screen.getByPlaceholderText("my-thing"), "lamp");
    await user.click(screen.getByRole("button", { name: "Load shadow" }));
    expect(await screen.findByText("Current shadow:")).toBeTruthy();
    expect(screen.getByText(/reported/)).toBeTruthy();
    expect(screen.getByText("named1")).toBeTruthy();
  });

  it("shows no shadow when payload is null", async () => {
    mockShadow.mockReturnValue({ data: { thingName: "lamp", payload: null } });
    mockNamed.mockReturnValue({ data: { shadows: [] }, isLoading: false });
    const user = userEvent.setup();
    render(<IotDataDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-thing"), "lamp");
    await user.click(screen.getByRole("button", { name: "Load shadow" }));
    expect(await screen.findByText("no shadow")).toBeTruthy();
    expect(screen.queryByText("named1")).toBeNull();
  });

  it("shows unavailable when the shadow query errors", async () => {
    mockShadow.mockReturnValue({ data: undefined, error: new Error("x"), isLoading: false });
    mockNamed.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<IotDataDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-thing"), "lamp");
    await user.click(screen.getByRole("button", { name: "Load shadow" }));
    expect(await screen.findByText(/unavailable/)).toBeTruthy();
  });

  it("updates the shadow with desired state JSON", async () => {
    const user = userEvent.setup();
    render(<IotDataDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-thing"), "lamp");
    await user.click(screen.getByRole("button", { name: "Load shadow" }));
    expect(
      (screen.getByRole("button", { name: "Update shadow" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    fireEvent.change(screen.getByLabelText("Desired state (JSON)"), {
      target: { value: '{"state":{"desired":{"power":"on"}}}' },
    });
    await user.click(screen.getByRole("button", { name: "Update shadow" }));
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith({
        thingName: "lamp",
        payload: '{"state":{"desired":{"power":"on"}}}',
      }),
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Shadow updated");
  });

  it("shows generic update error toast", async () => {
    mockUpdate.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<IotDataDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-thing"), "lamp");
    await user.click(screen.getByRole("button", { name: "Load shadow" }));
    fireEvent.change(screen.getByLabelText("Desired state (JSON)"), {
      target: { value: "{}" },
    });
    await user.click(screen.getByRole("button", { name: "Update shadow" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to update shadow"));
  });

  it("deletes the shadow (generic error then success)", async () => {
    mockDelete.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<IotDataDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-thing"), "lamp");
    await user.click(screen.getByRole("button", { name: "Load shadow" }));
    await user.click(await screen.findByRole("button", { name: "Delete shadow" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete shadow"));
    await user.click(await screen.findByRole("button", { name: "Delete shadow" }));
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("lamp"));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Shadow deleted");
  });
});

describe("IotDataDashboard — Publish tab", () => {
  it("disables Publish without a topic and publishes with payload", async () => {
    const user = userEvent.setup();
    render(<IotDataDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("tab", { name: "Publish" }));
    expect(
      (screen.getByRole("button", { name: "Publish" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    await user.type(screen.getByPlaceholderText("devices/lamp/state"), "devices/lamp");
    fireEvent.change(screen.getByLabelText("Payload (JSON, optional)"), {
      target: { value: '{"on":true}' },
    });
    await user.click(screen.getByRole("button", { name: "Publish" }));
    await waitFor(() =>
      expect(mockPublish).toHaveBeenCalledWith({ topic: "devices/lamp", payload: '{"on":true}' }),
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Published to devices/lamp");
  });

  it("shows generic publish error toast", async () => {
    mockPublish.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<IotDataDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("tab", { name: "Publish" }));
    await user.type(screen.getByPlaceholderText("devices/lamp/state"), "t");
    await user.click(screen.getByRole("button", { name: "Publish" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to publish"));
  });
});
