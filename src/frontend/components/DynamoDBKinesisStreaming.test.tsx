// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../test/helpers";
import React from "react";

const mockStreamingData = vi.fn();
const mockEnable = vi.fn();
const mockDisable = vi.fn();

const streamingState = vi.hoisted(() => ({
  isLoading: false,
  isError: false,
  error: null as Error | null,
}));

const enableState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

vi.mock("../hooks/useDynamoDB", () => ({
  useDynamoDBKinesisStreaming: () => ({
    get data() { return mockStreamingData(); },
    get isLoading() { return streamingState.isLoading; },
    get isError() { return streamingState.isError; },
    get error() { return streamingState.error; },
  }),
  useDynamoDBEnableKinesisStreaming: () => ({
    mutateAsync: mockEnable,
    get isPending() { return enableState.isPending; },
    get isError() { return enableState.isError; },
    get error() { return enableState.error; },
  }),
  useDynamoDBDisableKinesisStreaming: () => ({
    mutateAsync: mockDisable,
    isPending: false,
  }),
}));

import DynamoDBKinesisStreaming from "./DynamoDBKinesisStreaming";

// ─── Modal helpers ───────────────────────────────────────

/** Fire Escape on every mounted Cloudscape dialog (they stay mounted when hidden). */
function dismissModalWithEscape() {
  document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
    fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27 });
  });
}

/** Locate a modal dialog by its header text. */
function dialogOf(headerText: string): HTMLElement {
  const header = screen.getAllByText(headerText).find((h) => h.closest('[role="dialog"]'));
  return header!.closest('[role="dialog"]') as HTMLElement;
}

/** Assert the modal with the given header is hidden (Cloudscape uses display:none). */
function expectModalHidden(headerText: string) {
  expect(dialogOf(headerText).className).toContain("hidden");
}

beforeEach(() => {
  vi.clearAllMocks();
  streamingState.isLoading = false;
  streamingState.isError = false;
  streamingState.error = null;
  enableState.isPending = false;
  enableState.isError = false;
  enableState.error = null;
  mockStreamingData.mockReturnValue({ destinations: [], total: 0 });
});

describe("DynamoDBKinesisStreaming", () => {
  it("shows loading spinner", () => {
    streamingState.isLoading = true;
    render(<DynamoDBKinesisStreaming tableName="test-table" />, { wrapper: createWrapper() });
    expect(screen.getByText(/Loading Kinesis streaming destinations/)).toBeTruthy();
  });

  it("shows error state", () => {
    streamingState.isError = true;
    streamingState.error = new Error("Access denied");
    render(<DynamoDBKinesisStreaming tableName="test-table" />, { wrapper: createWrapper() });
    expect(screen.getByText("Access denied")).toBeTruthy();
  });

  it("shows error with fallback message", () => {
    streamingState.isError = true;
    streamingState.error = null as any;
    render(<DynamoDBKinesisStreaming tableName="test-table" />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load Kinesis streaming destinations")).toBeTruthy();
  });

  it("shows empty state", () => {
    render(<DynamoDBKinesisStreaming tableName="test-table" />, { wrapper: createWrapper() });
    expect(screen.getByText(/No Kinesis streaming destinations/)).toBeTruthy();
  });

  it("renders destinations with data", () => {
    mockStreamingData.mockReturnValue({
      destinations: [{
        streamArn: "arn:aws:kinesis:us-east-1:123:stream/my-stream",
        destinationStatus: "ACTIVE",
        destinationStatusDescription: "Running",
      }],
      total: 1,
    });
    render(<DynamoDBKinesisStreaming tableName="test-table" />, { wrapper: createWrapper() });
    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.getByText("Running")).toBeTruthy();
  });

  it("shows dash for missing description", () => {
    mockStreamingData.mockReturnValue({
      destinations: [{
        streamArn: "arn:aws:kinesis:us-east-1:123:stream/my-stream",
        destinationStatus: "ACTIVE",
      }],
      total: 1,
    });
    render(<DynamoDBKinesisStreaming tableName="test-table" />, { wrapper: createWrapper() });
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("shows dash for missing stream ARN", () => {
    mockStreamingData.mockReturnValue({
      destinations: [{
        streamArn: null,
        destinationStatus: "ACTIVE",
      }],
      total: 1,
    });
    render(<DynamoDBKinesisStreaming tableName="test-table" />, { wrapper: createWrapper() });
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });

  it("opens enable streaming modal", async () => {
    const user = userEvent.setup();
    render(<DynamoDBKinesisStreaming tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /Enable streaming/);
    await waitFor(() => {
      expect(screen.getByText(/Enable Kinesis streaming on test-table/)).toBeTruthy();
    });
  });

  it("submits enable streaming with ARN", async () => {
    const user = userEvent.setup();
    render(<DynamoDBKinesisStreaming tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /Enable streaming/);
    await user.type(screen.getByPlaceholderText(/arn:aws:kinesis/), "arn:aws:kinesis:us-east-1:123:stream/my-stream");
    await clickButton(user, /^Enable$/);
    expect(mockEnable).toHaveBeenCalledWith("arn:aws:kinesis:us-east-1:123:stream/my-stream", expect.any(Object));
  });

  it("enable button disabled when stream ARN empty", async () => {
    const user = userEvent.setup();
    render(<DynamoDBKinesisStreaming tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /Enable streaming/);
    const enableBtn = screen.getByRole("button", { name: /^Enable$/ });
    // Cloudscape may use native disabled or aria-disabled
    expect((enableBtn as HTMLButtonElement).disabled || enableBtn.getAttribute("aria-disabled") === "true").toBe(true);
  });

  it("cancels enable streaming modal without submitting", async () => {
    const user = userEvent.setup();
    render(<DynamoDBKinesisStreaming tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /Enable streaming/);
    await waitFor(() => expect(screen.getByText(/Enable Kinesis streaming on test-table/)).toBeTruthy());
    await clickButton(user, /Cancel/i);
    expect(mockEnable).not.toHaveBeenCalled();
  });

  it("dismisses enable streaming modal with Escape", async () => {
    const user = userEvent.setup();
    render(<DynamoDBKinesisStreaming tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /Enable streaming/);
    await waitFor(() => expect(screen.getByText(/Enable Kinesis streaming on test-table/)).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Enable Kinesis streaming on test-table"));
  });

  it("enables streaming and closes the modal on success", async () => {
    mockEnable.mockImplementation((_payload: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
      return Promise.resolve({});
    });
    const user = userEvent.setup();
    render(<DynamoDBKinesisStreaming tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /Enable streaming/);
    await user.type(screen.getByPlaceholderText(/arn:aws:kinesis/), "arn:aws:kinesis:us-east-1:123:stream/my-stream");
    await clickButton(user, /^Enable$/);
    await waitFor(() => expectModalHidden("Enable Kinesis streaming on test-table"));
  });

  it("deletes a streaming destination via the row delete button", async () => {
    mockStreamingData.mockReturnValue({
      destinations: [{
        streamArn: "arn:aws:kinesis:us-east-1:123:stream/my-stream",
        destinationStatus: "ACTIVE",
      }],
      total: 1,
    });
    const user = userEvent.setup();
    render(<DynamoDBKinesisStreaming tableName="test-table" />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Delete my-stream/i }));
    await waitFor(() => expect(screen.getByText("Delete Kinesis streaming destination")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Delete$/i }));
    await waitFor(() => {
      expect(mockDisable).toHaveBeenCalledWith("arn:aws:kinesis:us-east-1:123:stream/my-stream");
    });
  });
});
