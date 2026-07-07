// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockFirehoseStreams = vi.fn();
const mockDeleteStream = vi.fn();

const deleteStreamState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));

vi.mock("../../hooks/useFirehose", () => ({
  useFirehoseStreams: (...args: any[]) => mockFirehoseStreams(...args),
  useDeleteFirehoseStream: () => ({
    mutateAsync: mockDeleteStream,
    isPending: deleteStreamState.isPending,
    variables: deleteStreamState.variables,
  }),
}));

import { FirehoseDashboard } from "./FirehoseDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  deleteStreamState.isPending = false;
  deleteStreamState.variables = null;
  mockFirehoseStreams.mockReturnValue({
    data: { streams: [], total: 0 },
    isLoading: false,
  });
});

describe("FirehoseDashboard — rendering", () => {
  it("shows loading skeleton", () => {
    mockFirehoseStreams.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    const { container } = render(<FirehoseDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty state", () => {
    render(<FirehoseDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No delivery streams")).toBeTruthy();
  });

  it("renders stream data", () => {
    mockFirehoseStreams.mockReturnValue({
      data: {
        streams: [
          {
            DeliveryStreamName: "my-stream",
            DeliveryStreamARN: "arn:aws:firehose:us-east-1::delivery-stream/my-stream",
            DeliveryStreamStatus: "ACTIVE",
            Destinations: [
              {
                S3DestinationDescription: {
                  BucketARN: "arn:aws:s3:::my-bucket",
                  Prefix: "logs/",
                },
              },
            ],
            CreateTimestamp: 1700000000000,
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<FirehoseDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-stream")).toBeTruthy();
    expect(screen.getByText("ACTIVE")).toBeTruthy();
  });
});

describe("FirehoseDashboard — delete", () => {
  it("deletes a delivery stream", async () => {
    const user = userEvent.setup();
    mockFirehoseStreams.mockReturnValue({
      data: {
        streams: [
          {
            DeliveryStreamName: "my-stream",
            DeliveryStreamARN: "arn:aws:firehose:us-east-1::delivery-stream/my-stream",
            DeliveryStreamStatus: "ACTIVE",
            CreateTimestamp: 1700000000000,
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<FirehoseDashboard />, { wrapper: createWrapper() });
    const deleteBtn = screen.getByRole("button", { name: /Delete my-stream/i });
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(screen.getByText(/Are you sure/)).toBeTruthy();
    });
    await clickButton(user, /^Delete$/i);
    await waitFor(() => {
      expect(mockDeleteStream).toHaveBeenCalledWith("my-stream");
    });
  });

  it("renders delete loading state", () => {
    deleteStreamState.isPending = true;
    deleteStreamState.variables = "my-stream";
    mockFirehoseStreams.mockReturnValue({
      data: { streams: [{ DeliveryStreamName: "my-stream", DeliveryStreamARN: "arn:1", DeliveryStreamStatus: "ACTIVE", CreateTimestamp: 1700000000000 }], total: 1 },
      isLoading: false,
    });
    render(<FirehoseDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-stream")).toBeTruthy();
  });
});
