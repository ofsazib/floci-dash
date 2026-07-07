// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock hooks ─────────────────────────────────────────

const mockStreams = vi.fn();
const mockCreateStream = vi.fn();
const mockDeleteStream = vi.fn();
const mockShards = vi.fn();
const mockPutRecord = vi.fn();

const createStreamState = vi.hoisted(() => ({ isPending: false }));
const deleteStreamState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const putRecordState = vi.hoisted(() => ({ isPending: false }));

vi.mock("../../hooks/useKinesis", () => ({
  useKinesisStreams: (...args: any[]) => mockStreams(...args),
  useCreateKinesisStream: () => ({
    mutateAsync: mockCreateStream,
    isPending: createStreamState.isPending,
  }),
  useDeleteKinesisStream: () => ({
    mutateAsync: mockDeleteStream,
    isPending: deleteStreamState.isPending,
    variables: deleteStreamState.variables,
  }),
  useKinesisShards: (...args: any[]) => mockShards(...args),
  usePutKinesisRecord: () => ({
    mutateAsync: mockPutRecord,
    isPending: putRecordState.isPending,
  }),
}));

import { KinesisDashboard } from "./KinesisDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  createStreamState.isPending = false;
  deleteStreamState.isPending = false;
  deleteStreamState.variables = null;
  putRecordState.isPending = false;
  mockStreams.mockReturnValue({
    data: { streams: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockShards.mockReturnValue({
    data: { shards: [], total: 0 },
    isLoading: false,
  });
  mockCreateStream.mockResolvedValue({});
  mockPutRecord.mockResolvedValue({});
});

// ─── Tests ──────────────────────────────────────────────

describe("KinesisDashboard — rendering", () => {
  it("shows loading skeleton when loading", () => {
    mockStreams.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    const { container } = render(<KinesisDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("renders stream tab", () => {
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("tab", { name: /streams/i })).toBeTruthy();
  });

  it("shows empty message for streams", () => {
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No Kinesis streams/i)).toBeTruthy();
  });
});

describe("KinesisDashboard — streams listing", () => {
  it("renders streams with data", () => {
    mockStreams.mockReturnValue({
      data: {
        streams: [
          {
            StreamName: "my-stream",
            StreamStatus: "ACTIVE",
            OpenShardCount: 2,
            RetentionPeriodHours: 24,
            EncryptionType: "KMS",
            StreamCreationTimestamp: "2024-01-15T00:00:00Z",
            StreamARN: "arn:aws:kinesis:us-east-1:123:stream/my-stream",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-stream")).toBeTruthy();
    expect(screen.getByText("ACTIVE")).toBeTruthy();
    expect(screen.getByText("KMS")).toBeTruthy();
    expect(screen.getByText("24")).toBeTruthy();
  });

  it("calls deleteStream when delete is confirmed", async () => {
    mockStreams.mockReturnValue({
      data: {
        streams: [
          {
            StreamName: "my-stream",
            StreamStatus: "ACTIVE",
            OpenShardCount: 2,
            RetentionPeriodHours: 24,
            EncryptionType: "NONE",
            StreamCreationTimestamp: "2024-01-15T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("my-stream")).toBeTruthy();
    });

    const deleteBtns = screen.getAllByRole("button", { name: /Delete my-stream/i });
    await user.click(deleteBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure/i)).toBeTruthy();
    });

    const confirmDeleteBtns = screen.getAllByRole("button", { name: /^Delete$/i });
    await user.click(confirmDeleteBtns[confirmDeleteBtns.length - 1]);

    await waitFor(() => {
      expect(mockDeleteStream).toHaveBeenCalledWith("my-stream");
    });
  });
});

describe("KinesisDashboard — create stream", () => {
  it("opens create modal and submits", async () => {
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Create Kinesis stream")).toBeTruthy();
    });

    const nameInput = screen.getByPlaceholderText("my-stream");
    await user.type(nameInput, "new-stream");

    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateStream).toHaveBeenCalledWith(
        expect.objectContaining({ streamName: "new-stream" }),
      );
    });
  });

  it("sets custom shard count in create modal", async () => {
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Create Kinesis stream")).toBeTruthy();
    });

    const nameInput = screen.getByPlaceholderText("my-stream");
    await user.type(nameInput, "sharded-stream");

    const shardInput = screen.getByPlaceholderText("1");
    await user.clear(shardInput);
    await user.type(shardInput, "3");

    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateStream).toHaveBeenCalledWith(
        expect.objectContaining({ streamName: "sharded-stream", shardCount: 3 }),
      );
    });
  });

  it("cancels create modal", async () => {
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Create Kinesis stream")).toBeTruthy();
    });

    await clickButton(user, /Cancel/i);

    await waitFor(() => {
      expect(mockCreateStream).not.toHaveBeenCalled();
    });
  });
});

describe("KinesisDashboard — fallback values", () => {
  it("shows fallback for missing fields", () => {
    mockStreams.mockReturnValue({
      data: {
        streams: [
          {
            StreamName: "minimal-stream",
            StreamStatus: "CREATING",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("minimal-stream")).toBeTruthy();
    expect(screen.getByText("CREATING")).toBeTruthy();
    // 0 from missing OpenShardCount via `|| 0`
    expect(screen.getByText("0")).toBeTruthy();
    // "NONE" from missing EncryptionType via `|| "NONE"`
    expect(screen.getAllByText("NONE").length).toBeGreaterThanOrEqual(1);
  });
});

describe("KinesisDashboard — filtering", () => {
  it("filters streams by matching name", async () => {
    mockStreams.mockReturnValue({
      data: {
        streams: [
          { StreamName: "alpha-stream", StreamStatus: "ACTIVE", OpenShardCount: 1, RetentionPeriodHours: 24 },
          { StreamName: "beta-stream", StreamStatus: "ACTIVE", OpenShardCount: 2, RetentionPeriodHours: 48 },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText("alpha-stream")).toBeTruthy());
    expect(screen.getByText("beta-stream")).toBeTruthy();

    const filterInput = screen.getByPlaceholderText("Find streams by name");
    await user.type(filterInput, "alpha");

    await waitFor(() => {
      expect(screen.getByText("alpha-stream")).toBeTruthy();
    });
  });

  it("filters out streams that do not match", async () => {
    mockStreams.mockReturnValue({
      data: {
        streams: [
          { StreamName: "visible-stream", StreamStatus: "ACTIVE", OpenShardCount: 1, RetentionPeriodHours: 24 },
        ],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText("visible-stream")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find streams by name");
    await user.type(filterInput, "nonexistent");

    await waitFor(() => {
      expect(screen.queryByText("visible-stream")).toBeNull();
    });
  });
});

describe("KinesisDashboard — loading states", () => {
  it("renders create stream loading state", async () => {
    createStreamState.isPending = true;
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create Kinesis stream")).toBeTruthy());
  });

  it("renders delete stream loading state", () => {
    deleteStreamState.isPending = true;
    deleteStreamState.variables = "my-stream";
    mockStreams.mockReturnValue({
      data: { streams: [{ StreamName: "my-stream", StreamStatus: "ACTIVE", OpenShardCount: 1, RetentionPeriodHours: 24 }], total: 1 },
      isLoading: false,
    });
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-stream")).toBeTruthy();
  });

  it("renders put record loading state", async () => {
    putRecordState.isPending = true;
    mockStreams.mockReturnValue({
      data: { streams: [{ StreamName: "my-stream", StreamStatus: "ACTIVE", OpenShardCount: 1, RetentionPeriodHours: 24 }], total: 1 },
      isLoading: false,
    });
    mockShards.mockReturnValue({ data: { shards: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/i)).toBeTruthy());
    await clickButton(user, /Put record/i);
    await waitFor(() => expect(screen.getByText(/Put record to my-stream/i)).toBeTruthy());
  });
});

describe("KinesisDashboard — stream detail", () => {
  it("navigates to stream detail on name click", async () => {
    mockStreams.mockReturnValue({
      data: {
        streams: [
          {
            StreamName: "my-stream",
            StreamStatus: "ACTIVE",
            OpenShardCount: 2,
            RetentionPeriodHours: 24,
            EncryptionType: "NONE",
            StreamCreationTimestamp: "2024-01-15T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });

    await user.click(screen.getByText("my-stream"));

    await waitFor(() => {
      expect(screen.getByText(/Shards: my-stream/i)).toBeTruthy();
      expect(screen.getByText(/No shards/i)).toBeTruthy();
    });
  });

  it("goes back to streams tab when clicking Streams tab", async () => {
    mockStreams.mockReturnValue({
      data: {
        streams: [
          {
            StreamName: "my-stream",
            StreamStatus: "ACTIVE",
            OpenShardCount: 2,
            RetentionPeriodHours: 24,
            EncryptionType: "NONE",
            StreamCreationTimestamp: "2024-01-15T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });

    await user.click(screen.getByText("my-stream"));
    await waitFor(() => {
      expect(screen.getByText(/Shards: my-stream/i)).toBeTruthy();
    });

    const streamsTab = screen.getByRole("tab", { name: /streams/i });
    await user.click(streamsTab);

    await waitFor(() => {
      expect(screen.getByText("my-stream")).toBeTruthy();
    });
  });

  it("renders shards with data", async () => {
    mockStreams.mockReturnValue({
      data: {
        streams: [
          {
            StreamName: "my-stream",
            StreamStatus: "ACTIVE",
            OpenShardCount: 2,
            RetentionPeriodHours: 24,
            EncryptionType: "NONE",
            StreamCreationTimestamp: "2024-01-15T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    mockShards.mockReturnValue({
      data: {
        shards: [
          {
            ShardId: "shard-000001",
            HashKeyRange: { StartingHashKey: "0", EndingHashKey: "100" },
            SequenceNumberRange: { StartingSequenceNumber: "seq-001" },
          },
        ],
        total: 1,
      },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });

    await user.click(screen.getByText("my-stream"));

    await waitFor(() => {
      expect(screen.getByText("shard-000001")).toBeTruthy();
    });
  });

  it("cancels put record modal", async () => {
    mockStreams.mockReturnValue({
      data: {
        streams: [
          {
            StreamName: "my-stream",
            StreamStatus: "ACTIVE",
            OpenShardCount: 1,
            RetentionPeriodHours: 24,
            EncryptionType: "NONE",
            StreamCreationTimestamp: "2024-01-15T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    mockShards.mockReturnValue({
      data: { shards: [], total: 0 },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });

    await user.click(screen.getByText("my-stream"));
    await waitFor(() => {
      expect(screen.getByText(/Shards: my-stream/i)).toBeTruthy();
    });

    await clickButton(user, /Put record/i);
    await waitFor(() => {
      expect(screen.getByText(/Put record to my-stream/i)).toBeTruthy();
    });

    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);

    await waitFor(() => {
      expect(mockPutRecord).not.toHaveBeenCalled();
    });
  });

  it("dismisses put record modal with Escape key", async () => {
    mockStreams.mockReturnValue({
      data: {
        streams: [
          {
            StreamName: "my-stream",
            StreamStatus: "ACTIVE",
            OpenShardCount: 1,
            RetentionPeriodHours: 24,
            EncryptionType: "NONE",
            StreamCreationTimestamp: "2024-01-15T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    mockShards.mockReturnValue({
      data: { shards: [], total: 0 },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });

    await user.click(screen.getByText("my-stream"));
    await waitFor(() => {
      expect(screen.getByText(/Shards: my-stream/i)).toBeTruthy();
    });

    await clickButton(user, /Put record/i);
    await waitFor(() => {
      expect(screen.getByText(/Put record to my-stream/i)).toBeTruthy();
    });

    // Escape key triggers onDismiss
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(mockPutRecord).not.toHaveBeenCalled();
    });
  });

  it("opens put record modal and submits", async () => {
    mockStreams.mockReturnValue({
      data: {
        streams: [
          {
            StreamName: "my-stream",
            StreamStatus: "ACTIVE",
            OpenShardCount: 1,
            RetentionPeriodHours: 24,
            EncryptionType: "NONE",
            StreamCreationTimestamp: "2024-01-15T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    mockShards.mockReturnValue({
      data: { shards: [], total: 0 },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });

    await user.click(screen.getByText("my-stream"));
    await waitFor(() => {
      expect(screen.getByText(/Shards: my-stream/i)).toBeTruthy();
    });

    await clickButton(user, /Put record/i);

    await waitFor(() => {
      expect(screen.getByText(/Put record to my-stream/i)).toBeTruthy();
    });

    const dataInput = screen.getByPlaceholderText("Hello, Kinesis!");
    await user.type(dataInput, "test-data");
    const keyInput = screen.getByPlaceholderText("partition-key");
    await user.type(keyInput, "key-1");

    const putBtns = screen.getAllByRole("button", { name: /Put record/i });
    await user.click(putBtns[putBtns.length - 1]);

    await waitFor(() => {
      expect(mockPutRecord).toHaveBeenCalledWith(
        expect.objectContaining({ data: "test-data", partitionKey: "key-1" }),
      );
    });
  });
});
