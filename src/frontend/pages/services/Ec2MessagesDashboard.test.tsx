// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockEc2Messages = vi.fn();
const mockAcknowledge = vi.fn();
const mockShowToast = vi.fn();

vi.mock("../../hooks/useEc2Messages", () => ({
  useEc2Messages: (...args: any[]) => mockEc2Messages(...args),
  useAcknowledgeMessage: () => ({ mutateAsync: mockAcknowledge, isPending: false }),
}));

vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

import { Ec2MessagesDashboard } from "./Ec2MessagesDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockEc2Messages.mockReturnValue({ data: { Messages: [] }, isLoading: false, refetch: vi.fn() });
});

describe("Ec2MessagesDashboard", () => {
  it("renders lookup form", () => {
    render(<Ec2MessagesDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/SSM Message Lookup/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Get Messages/i })).toBeDisabled();
  });

  it("enables button when destination is provided", async () => {
    const user = userEvent.setup();
    render(<Ec2MessagesDashboard />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText("i-xxxxxxxx");
    await user.type(input, "i-12345678");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Get Messages/i })).not.toBeDisabled();
    });
  });

  it("shows empty message for messages", () => {
    mockEc2Messages.mockReturnValue({ data: { Messages: [] }, isLoading: false, refetch: vi.fn() });
    render(<Ec2MessagesDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No messages found/i)).toBeTruthy();
  });

  it("renders messages with data", () => {
    mockEc2Messages.mockReturnValue({
      data: {
        Messages: [
          { MessageId: "msg-001", Destination: "i-123", Acknowledged: false, CreatedTime: 1705000000000 },
          { MessageId: "msg-002", Destination: "i-456", Acknowledged: true, CreatedTime: 1705100000000 },
        ],
      },
      isLoading: false,
      refetch: vi.fn(),
    });
    render(<Ec2MessagesDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("msg-001")).toBeTruthy();
    expect(screen.getByText("msg-002")).toBeTruthy();
    expect(screen.getByText("Pending")).toBeTruthy();
    expect(screen.getByText("Acknowledged")).toBeTruthy();
  });

  it("shows dash for missing message fields", () => {
    mockEc2Messages.mockReturnValue({
      data: { Messages: [{ NotARealField: "test" }] },
      isLoading: false,
      refetch: vi.fn(),
    });
    render(<Ec2MessagesDashboard />, { wrapper: createWrapper() });
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("falls back to empty list when data has no Messages key", () => {
    mockEc2Messages.mockReturnValue({
      data: {},
      isLoading: false,
      refetch: vi.fn(),
    });
    render(<Ec2MessagesDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No messages found/i)).toBeTruthy();
  });

  it("activates the lookup with the trimmed destination and refetches", async () => {
    const refetch = vi.fn();
    mockEc2Messages.mockReturnValue({ data: { Messages: [] }, isLoading: false, refetch });
    const user = userEvent.setup();
    render(<Ec2MessagesDashboard />, { wrapper: createWrapper() });

    await user.type(screen.getByPlaceholderText("i-xxxxxxxx"), "  i-12345678  ");
    await user.click(screen.getByRole("button", { name: /Get Messages/i }));

    // Hook is now called with the trimmed destination (not null)
    await waitFor(() => {
      expect(mockEc2Messages).toHaveBeenCalledWith("i-12345678");
    });
    // The setTimeout(…, 100) fires refetch
    await waitFor(() => expect(refetch).toHaveBeenCalled(), { timeout: 2000 });
  });

  it("acknowledges a message and toasts success", async () => {
    const refetch = vi.fn();
    mockEc2Messages.mockReturnValue({
      data: { Messages: [{ MessageId: "msg-001", Destination: "i-123", Acknowledged: false }] },
      isLoading: false,
      refetch,
    });
    mockAcknowledge.mockResolvedValue({});
    const user = userEvent.setup();
    render(<Ec2MessagesDashboard />, { wrapper: createWrapper() });

    await user.click(screen.getByRole("button", { name: /Acknowledge/i }));

    await waitFor(() => {
      expect(mockAcknowledge).toHaveBeenCalledWith("msg-001");
      expect(mockShowToast).toHaveBeenCalledWith("success", "Message msg-001 acknowledged");
      expect(refetch).toHaveBeenCalled();
    });
  });

  it("toasts error when acknowledgement fails", async () => {
    mockEc2Messages.mockReturnValue({
      data: { Messages: [{ MessageId: "msg-001", Destination: "i-123", Acknowledged: false }] },
      isLoading: false,
      refetch: vi.fn(),
    });
    mockAcknowledge.mockRejectedValue(new Error("ack failed"));
    const user = userEvent.setup();
    render(<Ec2MessagesDashboard />, { wrapper: createWrapper() });

    await user.click(screen.getByRole("button", { name: /Acknowledge/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("error", "ack failed");
    });
  });
});
