// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock hooks ─────────────────────────────────────────

const mockStreams = vi.fn();
const mockCreateStream = vi.fn();
const mockDeleteStream = vi.fn();
const mockShards = vi.fn();
const mockPutRecord = vi.fn();

const mockConsumers = vi.fn();
const mockRegisterConsumer = vi.fn();
const mockDeregisterConsumer = vi.fn();
const mockSubscribeToShard = vi.fn();

const mockStreamDetail = vi.fn();
const mockTagsQuery = vi.fn();
const mockAddTags = vi.fn();
const mockRemoveTags = vi.fn();
const mockIncreaseRetention = vi.fn();
const mockDecreaseRetention = vi.fn();
const mockStartEncryption = vi.fn();
const mockStopEncryption = vi.fn();
const mockEnableMonitoring = vi.fn();
const mockDisableMonitoring = vi.fn();
const mockUpdateStreamMode = vi.fn();
const mockSplitShard = vi.fn();
const mockMergeShards = vi.fn();

const createStreamState = vi.hoisted(() => ({ isPending: false }));
const deleteStreamState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const putRecordState = vi.hoisted(() => ({ isPending: false }));
const registerConsumerState = vi.hoisted(() => ({ isPending: false }));
const deregisterConsumerState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const subscribeState = vi.hoisted(() => ({ isPending: false, isError: false, error: null as Error | null }));

function makeMutationMock(fn: ReturnType<typeof vi.fn>, state: { isPending: boolean; variables?: any; isError?: boolean; error?: Error | null }) {
  return {
    mutateAsync: fn,
    isPending: state.isPending,
    get isError() {
      return !!state.isError;
    },
    get error() {
      return state.error ?? null;
    },
    reset: vi.fn(),
    get variables() {
      return state.variables;
    },
  };
}

const addTagsState = vi.hoisted(() => ({ isPending: false, isError: false, error: null as Error | null }));
const removeTagsState = vi.hoisted(() => ({ isPending: false, variables: null as string | null, isError: false, error: null as Error | null }));
const increaseRetentionState = vi.hoisted(() => ({ isPending: false, isError: false, error: null as Error | null }));
const decreaseRetentionState = vi.hoisted(() => ({ isPending: false, isError: false, error: null as Error | null }));
const startEncryptionState = vi.hoisted(() => ({ isPending: false, isError: false, error: null as Error | null }));
const stopEncryptionState = vi.hoisted(() => ({ isPending: false, isError: false, error: null as Error | null }));
const enableMonitoringState = vi.hoisted(() => ({ isPending: false, isError: false, error: null as Error | null }));
const disableMonitoringState = vi.hoisted(() => ({ isPending: false, isError: false, error: null as Error | null }));
const updateModeState = vi.hoisted(() => ({ isPending: false, isError: false, error: null as Error | null }));
const splitState = vi.hoisted(() => ({ isPending: false, isError: false, error: null as Error | null }));
const mergeState = vi.hoisted(() => ({ isPending: false, isError: false, error: null as Error | null }));

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
  useKinesisConsumers: (...args: any[]) => mockConsumers(...args),
  useRegisterKinesisConsumer: () => ({
    mutateAsync: mockRegisterConsumer,
    isPending: registerConsumerState.isPending,
  }),
  useDeregisterKinesisConsumer: () => ({
    mutateAsync: mockDeregisterConsumer,
    isPending: deregisterConsumerState.isPending,
    variables: deregisterConsumerState.variables,
  }),
  useSubscribeToShard: () => ({
    mutateAsync: mockSubscribeToShard,
    isPending: subscribeState.isPending,
    isError: subscribeState.isError,
    error: subscribeState.error,
  }),
  useKinesisStream: (...args: any[]) => mockStreamDetail(...args),
  useKinesisTags: (...args: any[]) => mockTagsQuery(...args),
  useAddKinesisTags: () => makeMutationMock(mockAddTags, addTagsState),
  useRemoveKinesisTags: () => makeMutationMock(mockRemoveTags, removeTagsState),
  useIncreaseKinesisRetention: () => makeMutationMock(mockIncreaseRetention, increaseRetentionState),
  useDecreaseKinesisRetention: () => makeMutationMock(mockDecreaseRetention, decreaseRetentionState),
  useStartKinesisEncryption: () => makeMutationMock(mockStartEncryption, startEncryptionState),
  useStopKinesisEncryption: () => makeMutationMock(mockStopEncryption, stopEncryptionState),
  useEnableKinesisMonitoring: () => makeMutationMock(mockEnableMonitoring, enableMonitoringState),
  useDisableKinesisMonitoring: () => makeMutationMock(mockDisableMonitoring, disableMonitoringState),
  useUpdateKinesisStreamMode: () => makeMutationMock(mockUpdateStreamMode, updateModeState),
  useSplitKinesisShard: () => makeMutationMock(mockSplitShard, splitState),
  useMergeKinesisShards: () => makeMutationMock(mockMergeShards, mergeState),
}));

import { KinesisDashboard } from "./KinesisDashboard";

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
  mockConsumers.mockReturnValue({ data: { consumers: [], total: 0 }, isLoading: false });
  registerConsumerState.isPending = false;
  deregisterConsumerState.isPending = false;
  deregisterConsumerState.variables = null;
  subscribeState.isPending = false;
  subscribeState.isError = false;
  subscribeState.error = null;
  mockRegisterConsumer.mockResolvedValue({});
  mockDeregisterConsumer.mockResolvedValue({});
  mockSubscribeToShard.mockResolvedValue({ events: [] });
  mockStreamDetail.mockReturnValue({
    data: {
      stream: {
        StreamName: "stream-1",
        StreamARN: "arn:aws:kinesis:us-east-1::stream/stream-1",
        RetentionPeriodHours: 24,
        EncryptionType: "NONE",
      },
    },
    isLoading: false,
  });
  mockTagsQuery.mockReturnValue({ data: { tags: [] }, isLoading: false });
  const settingsStates = [
    addTagsState,
    removeTagsState,
    increaseRetentionState,
    decreaseRetentionState,
    startEncryptionState,
    stopEncryptionState,
    enableMonitoringState,
    disableMonitoringState,
    updateModeState,
    splitState,
    mergeState,
  ];
  for (const s of settingsStates) {
    s.isPending = false;
    (s as any).isError = false;
    (s as any).error = null;
  }
  removeTagsState.variables = null;
  mockAddTags.mockResolvedValue({});
  mockRemoveTags.mockResolvedValue({});
  mockIncreaseRetention.mockResolvedValue({});
  mockDecreaseRetention.mockResolvedValue({});
  mockStartEncryption.mockResolvedValue({});
  mockStopEncryption.mockResolvedValue({});
  mockEnableMonitoring.mockResolvedValue({
    currentShardLevelMetrics: ["IncomingBytes"],
    desiredShardLevelMetrics: ["IncomingBytes"],
  });
  mockDisableMonitoring.mockResolvedValue({
    currentShardLevelMetrics: [],
    desiredShardLevelMetrics: [],
  });
  mockUpdateStreamMode.mockResolvedValue({});
  mockSplitShard.mockResolvedValue({});
  mockMergeShards.mockResolvedValue({});
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

    // Escape key triggers onDismiss (fires on the mounted dialog)
    dismissModalWithEscape();

    await waitFor(() => expectModalHidden("Put record to my-stream"));
    expect(mockPutRecord).not.toHaveBeenCalled();
  });

  it("shows dash for missing shard parent", async () => {
    mockStreams.mockReturnValue({
      data: { streams: [{ StreamName: "my-stream", StreamStatus: "ACTIVE", OpenShardCount: 1, RetentionPeriodHours: 24 }], total: 1 },
      isLoading: false,
    });
    mockShards.mockReturnValue({
      data: { shards: [{ ShardId: "shard-1" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText("shard-1")).toBeTruthy());
    expect(screen.getByText("-")).toBeTruthy();
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

describe("KinesisDashboard — consumers", () => {
  function setupStreamAndNavigate() {
    mockStreams.mockReturnValue({
      data: {
        streams: [{ StreamName: "my-stream", StreamStatus: "ACTIVE", OpenShardCount: 1, RetentionPeriodHours: 24 }],
        total: 1,
      },
      isLoading: false,
    });
    mockShards.mockReturnValue({ data: { shards: [], total: 0 }, isLoading: false });
  }

  it("shows empty consumers message", async () => {
    setupStreamAndNavigate();
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
    await clickButton(user, /View consumers/i);
    await waitFor(() => expect(screen.getByText(/No consumers registered/)).toBeTruthy());
  });

  it("renders consumers with data", async () => {
    setupStreamAndNavigate();
    mockConsumers.mockReturnValue({
      data: {
        consumers: [{ ConsumerName: "my-consumer", ConsumerARN: "arn:...consumer/my-consumer", ConsumerStatus: "ACTIVE", ConsumerCreationTimestamp: "2024-06-01T00:00:00Z" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
    await clickButton(user, /View consumers/i);
    await waitFor(() => expect(screen.getByText("my-consumer")).toBeTruthy());
  });

  it("opens register consumer modal and cancels", async () => {
    setupStreamAndNavigate();
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
    await clickButton(user, /View consumers/i);
    await waitFor(() => expect(screen.getByText(/Register consumer/i)).toBeTruthy());
    await clickButton(user, /Register consumer/i);
    await waitFor(() => expect(screen.getByText("Register Stream Consumer")).toBeTruthy());
    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);
    expect(mockRegisterConsumer).not.toHaveBeenCalled();
  });

  it("registers a consumer", async () => {
    setupStreamAndNavigate();
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
    await clickButton(user, /View consumers/i);
    await waitFor(() => expect(screen.getByText(/Register consumer/i)).toBeTruthy());
    await clickButton(user, /Register consumer/i);
    await waitFor(() => expect(screen.getByText("Register Stream Consumer")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-consumer"), "test-consumer");
    await clickButton(user, /^Register$/i);
    await waitFor(() => expect(mockRegisterConsumer).toHaveBeenCalledWith("test-consumer"));
  });

  it("deregisters a consumer", async () => {
    setupStreamAndNavigate();
    mockConsumers.mockReturnValue({
      data: {
        consumers: [{ ConsumerName: "old-consumer", ConsumerARN: "arn:...", ConsumerStatus: "ACTIVE" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
    await clickButton(user, /View consumers/i);
    await waitFor(() => expect(screen.getByText("old-consumer")).toBeTruthy());
    const deleteBtn = screen.getByRole("button", { name: /Delete old-consumer/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeregisterConsumer).toHaveBeenCalledWith("old-consumer"));
  });

  it("shows pending status for non-ACTIVE consumer", async () => {
    setupStreamAndNavigate();
    mockConsumers.mockReturnValue({
      data: {
        consumers: [{ ConsumerName: "creating", ConsumerARN: "arn:...", ConsumerStatus: "CREATING" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
    await clickButton(user, /View consumers/i);
    await waitFor(() => expect(screen.getByText("CREATING")).toBeTruthy());
  });

  it("shows consumer dash for missing created date", async () => {
    setupStreamAndNavigate();
    mockConsumers.mockReturnValue({
      data: {
        consumers: [{ ConsumerName: "no-date", ConsumerARN: "arn:...", ConsumerStatus: "ACTIVE" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
    await clickButton(user, /View consumers/i);
    await waitFor(() => {
      expect(screen.getByText("no-date")).toBeTruthy();
      expect(screen.getByText("-")).toBeTruthy();
    });
  });

  it("shows deregister consumer not-loading when isPending but different variable", async () => {
    deregisterConsumerState.isPending = true;
    deregisterConsumerState.variables = "other-consumer";
    mockStreams.mockReturnValue({
      data: { streams: [{ StreamName: "my-stream", StreamStatus: "ACTIVE", OpenShardCount: 1, RetentionPeriodHours: 24 }], total: 1 },
      isLoading: false,
    });
    mockShards.mockReturnValue({ data: { shards: [], total: 0 }, isLoading: false });
    mockConsumers.mockReturnValue({
      data: { consumers: [{ ConsumerName: "test-consumer", ConsumerARN: "arn:...", ConsumerStatus: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
    await clickButton(user, /View consumers/i);
    await waitFor(() => {
      expect(screen.getByText("test-consumer")).toBeTruthy();
    });
  });
});

describe("KinesisDashboard — data edge cases", () => {
  function setupStream() {
    mockStreams.mockReturnValue({
      data: { streams: [{ StreamName: "my-stream", StreamStatus: "ACTIVE", OpenShardCount: 1, RetentionPeriodHours: 24 }], total: 1 },
      isLoading: false,
    });
    mockShards.mockReturnValue({ data: { shards: [], total: 0 }, isLoading: false });
  }

  it("handles undefined streams data", () => {
    mockStreams.mockReturnValue({ data: undefined, isLoading: false });
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No Kinesis streams/i)).toBeTruthy();
  });

  it("handles null streams data", () => {
    mockStreams.mockReturnValue({ data: { streams: null, total: 0 }, isLoading: false });
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No Kinesis streams/i)).toBeTruthy();
  });

  it("shows delete stream not-loading when isPending but different variable", () => {
    deleteStreamState.isPending = true;
    deleteStreamState.variables = "other-stream";
    mockStreams.mockReturnValue({
      data: { streams: [{ StreamName: "my-stream", StreamStatus: "ACTIVE", OpenShardCount: 1, RetentionPeriodHours: 24 }], total: 1 },
      isLoading: false,
    });
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-stream")).toBeTruthy();
  });

  it("shows stream detail no-selection alert", () => {
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    // The Streams tab is the default. Click the detail tab (it shows even without selection)
    const detailTabs = screen.getAllByText(/Stream Details/i);
    expect(detailTabs.length).toBeGreaterThan(0);
  });

  it("switches to the detail tab and shows no-selection alert", async () => {
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    const detailTab = screen.getByRole("tab", { name: /Stream Details/i });
    await user.click(detailTab);
    await waitFor(() => {
      expect(screen.getByText(/Select a stream to view its shards/i)).toBeTruthy();
    });
  });

  it("handles undefined shards data in detail", async () => {
    setupStream();
    mockShards.mockReturnValue({ data: undefined });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => {
      expect(screen.getByText(/No shards/i)).toBeTruthy();
    });
  });

  it("handles null shards data in detail", async () => {
    setupStream();
    mockShards.mockReturnValue({ data: { shards: null } });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => {
      expect(screen.getByText(/No shards/i)).toBeTruthy();
    });
  });

  it("handles undefined consumers data", async () => {
    setupStream();
    mockConsumers.mockReturnValue({ data: undefined });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
    await clickButton(user, /View consumers/i);
    await waitFor(() => {
      expect(screen.getByText(/No consumers registered/i)).toBeTruthy();
    });
  });

  it("handles null consumers data", async () => {
    setupStream();
    mockConsumers.mockReturnValue({ data: { consumers: null } });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
    await clickButton(user, /View consumers/i);
    await waitFor(() => {
      expect(screen.getByText(/No consumers registered/i)).toBeTruthy();
    });
  });

  it("shows subscribe modal error alert", async () => {
    subscribeState.isError = true;
    subscribeState.error = new Error("Shard not found");
    setupStream();
    mockConsumers.mockReturnValue({
      data: { consumers: [{ ConsumerName: "my-consumer", ConsumerARN: "arn:...", ConsumerStatus: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
    await clickButton(user, /View consumers/i);
    await waitFor(() => expect(screen.getByText("my-consumer")).toBeTruthy());
    await clickButton(user, /Subscribe/i);
    await waitFor(() => {
      expect(screen.getByText(/Shard not found/)).toBeTruthy();
    });
  });

  it("handles null streams data (no streams array)", () => {
    mockStreams.mockReturnValue({ data: {} as any, isLoading: false });
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No Kinesis streams/i)).toBeTruthy();
  });

  it("uses default shardCount of 1 when input is empty", async () => {
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create Kinesis stream")).toBeTruthy());
    // Type name but leave shardCount empty
    const nameInput = screen.getByPlaceholderText("my-stream");
    await user.type(nameInput, "default-shard");
    // Clear the default "1" value so parseInt returns NaN, triggering || 1
    const shardInput = screen.getByPlaceholderText("1");
    await user.clear(shardInput);
    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => expect(mockCreateStream).toHaveBeenCalledWith(
      expect.objectContaining({ streamName: "default-shard", shardCount: 1 }),
    ));
  });

  it("shows subscribe events when records returned", async () => {
    mockSubscribeToShard.mockResolvedValue({
      events: [
        { partitionKey: "pk-1", sequenceNumber: "seq-1", data: "aGVsbG8=", approximateArrivalTimestamp: "2024-06-01T00:00:00Z" },
      ],
    });
    setupStream();
    mockConsumers.mockReturnValue({
      data: { consumers: [{ ConsumerName: "sub-consumer", ConsumerARN: "arn:...", ConsumerStatus: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockShards.mockReturnValue({
      data: { shards: [{ ShardId: "shard-001" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
    await clickButton(user, /View consumers/i);
    await waitFor(() => expect(screen.getByText("sub-consumer")).toBeTruthy());
    // Click Subscribe button
    const subscribeBtns = screen.getAllByRole("button", { name: /Subscribe/i });
    await user.click(subscribeBtns[0]);
    await waitFor(() => expect(screen.getByText(/Subscribe to Shard/)).toBeTruthy());
    // Select shard from dropdown using the Select trigger
    const selectTriggers = screen.getAllByRole("button", { name: /Select a shard/i });
    await user.click(selectTriggers[selectTriggers.length - 1]);
    await waitFor(() => expect(screen.getAllByText("shard-001").length).toBeGreaterThan(0));
    await user.click(screen.getAllByText("shard-001")[0]);
    const fetchBtn = screen.getByRole("button", { name: /Fetch records/i });
    await user.click(fetchBtn);
    await waitFor(() => expect(screen.getByText("pk-1")).toBeTruthy());
    expect(screen.getByText("seq-1")).toBeTruthy();
  });

  it("shows no records alert when events array is empty", async () => {
    mockSubscribeToShard.mockResolvedValue({ events: [] });
    setupStream();
    mockConsumers.mockReturnValue({
      data: { consumers: [{ ConsumerName: "sub-consumer", ConsumerARN: "arn:...", ConsumerStatus: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockShards.mockReturnValue({
      data: { shards: [{ ShardId: "shard-001" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
    await clickButton(user, /View consumers/i);
    await waitFor(() => expect(screen.getByText("sub-consumer")).toBeTruthy());
    const subscribeBtns = screen.getAllByRole("button", { name: /Subscribe/i });
    await user.click(subscribeBtns[0]);
    await waitFor(() => expect(screen.getByText(/Subscribe to Shard/)).toBeTruthy());
    const selectTriggers2 = screen.getAllByRole("button", { name: /Select a shard/i });
    await user.click(selectTriggers2[selectTriggers2.length - 1]);
    await waitFor(() => expect(screen.getAllByText("shard-001").length).toBeGreaterThan(0));
    await user.click(screen.getAllByText("shard-001")[0]);
    const fetchBtn = screen.getByRole("button", { name: /Fetch records/i });
    await user.click(fetchBtn);
    await waitFor(() => expect(screen.getByText(/No records received/)).toBeTruthy());
  });

  it("changes subscribe starting position to LATEST", async () => {
    setupStream();
    mockConsumers.mockReturnValue({
      data: { consumers: [{ ConsumerName: "sub-consumer", ConsumerARN: "arn:...", ConsumerStatus: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
    await clickButton(user, /View consumers/i);
    await waitFor(() => expect(screen.getByText("sub-consumer")).toBeTruthy());
    const subscribeBtns = screen.getAllByRole("button", { name: /Subscribe/i });
    await user.click(subscribeBtns[0]);
    await waitFor(() => expect(screen.getByText(/Subscribe to Shard/)).toBeTruthy());
    // Change starting position to LATEST
    const startingPos = screen.getByText(/TRIM_HORIZON/);
    await user.click(startingPos);
    await waitFor(() => expect(screen.getByText("LATEST")).toBeTruthy());
    await user.click(screen.getByText("LATEST"));
    // Verify LATEST is now selected
    expect(screen.getByText("LATEST")).toBeTruthy();
  });

  it("shows shard without hash key range end", async () => {
    setupStream();
    mockShards.mockReturnValue({
      data: { shards: [{ ShardId: "shard-no-hash", HashKeyRange: { StartingHashKey: "0" } }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText("shard-no-hash")).toBeTruthy());
  });

  it("shows shard without sequence number range", async () => {
    setupStream();
    mockShards.mockReturnValue({
      data: { shards: [{ ShardId: "shard-no-seq" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText("shard-no-seq")).toBeTruthy());
  });

  it("shows subscribe modal error fallback message", async () => {
    subscribeState.isError = true;
    subscribeState.error = {} as Error;
    setupStream();
    mockConsumers.mockReturnValue({
      data: { consumers: [{ ConsumerName: "my-consumer", ConsumerARN: "arn:...", ConsumerStatus: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
    await clickButton(user, /View consumers/i);
    await waitFor(() => expect(screen.getByText("my-consumer")).toBeTruthy());
    await clickButton(user, /Subscribe/i);
    await waitFor(() => {
      expect(screen.getByText(/Failed to subscribe to shard/)).toBeTruthy();
    });
  });

  it("renders subscribe modal with Close button", async () => {
    setupStream();
    mockConsumers.mockReturnValue({
      data: { consumers: [{ ConsumerName: "sub-consumer", ConsumerARN: "arn:...", ConsumerStatus: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
    await clickButton(user, /View consumers/i);
    await waitFor(() => expect(screen.getByText("sub-consumer")).toBeTruthy());
    await clickButton(user, /Subscribe/i);
    await waitFor(() => expect(screen.getByText(/Subscribe to Shard/)).toBeTruthy());
    // Verify the modal footer Close button exists (covers subscribe modal render branch)
    expect(screen.getByRole("button", { name: /^Close$/ })).toBeTruthy();
  });

  it("changes subscribe starting position to AT_TIMESTAMP", async () => {
    setupStream();
    mockConsumers.mockReturnValue({
      data: { consumers: [{ ConsumerName: "sub-consumer", ConsumerARN: "arn:...", ConsumerStatus: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
    await clickButton(user, /View consumers/i);
    await waitFor(() => expect(screen.getByText("sub-consumer")).toBeTruthy());
    await clickButton(user, /Subscribe/i);
    await waitFor(() => expect(screen.getByText(/Subscribe to Shard/)).toBeTruthy());
    const posSelect = screen.getByText(/TRIM_HORIZON/);
    await user.click(posSelect);
    await waitFor(() => expect(screen.getByText("AT_TIMESTAMP")).toBeTruthy());
    await user.click(screen.getByText("AT_TIMESTAMP"));
    expect(screen.getByText("AT_TIMESTAMP")).toBeTruthy();
  });

  it("switches tabs and clears selection via Streams tab click", async () => {
    mockStreams.mockReturnValue({
      data: { streams: [{ StreamName: "my-stream", StreamStatus: "ACTIVE", OpenShardCount: 1, RetentionPeriodHours: 24 }], total: 1 },
      isLoading: false,
    });
    mockShards.mockReturnValue({ data: { shards: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
    // Click Streams tab — should clear selection and show stream list
    const streamsTab = screen.getByRole("tab", { name: /streams/i });
    await user.click(streamsTab);
    await waitFor(() => {
      expect(screen.getByText("my-stream")).toBeTruthy();
    });
  });

  it("navigates back to shards from consumers tab", async () => {
    setupStream();
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
    await clickButton(user, /View consumers/i);
    await waitFor(() => expect(screen.getByText(/No consumers registered/)).toBeTruthy());
    await clickButton(user, /Back to shards/i);
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
  });

  it("subscribe modal shows Fetch records button as disabled when no shard selected", async () => {
    setupStream();
    mockConsumers.mockReturnValue({
      data: { consumers: [{ ConsumerName: "sub-consumer", ConsumerARN: "arn:...", ConsumerStatus: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
    await clickButton(user, /View consumers/i);
    await waitFor(() => expect(screen.getByText("sub-consumer")).toBeTruthy());
    await clickButton(user, /Subscribe/i);
    await waitFor(() => expect(screen.getByText(/Subscribe to Shard/)).toBeTruthy());
    // Fetch records button should be disabled when no shard is selected
    const fetchBtn = screen.getByRole("button", { name: /Fetch records/i });
    expect(fetchBtn.getAttribute("disabled")).not.toBeNull();
  });

  it("subscribe shows multiple records with arrival timestamps", async () => {
    mockSubscribeToShard.mockResolvedValue({
      events: [
        { partitionKey: "pk-a", sequenceNumber: "seq-a", data: "YQ==", approximateArrivalTimestamp: "2024-06-01T10:00:00Z" },
        { partitionKey: "pk-b", sequenceNumber: "seq-b", data: "Yg==", approximateArrivalTimestamp: "2024-06-01T11:00:00Z" },
      ],
    });
    setupStream();
    mockConsumers.mockReturnValue({
      data: { consumers: [{ ConsumerName: "sub-consumer", ConsumerARN: "arn:...", ConsumerStatus: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockShards.mockReturnValue({
      data: { shards: [{ ShardId: "shard-001" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
    await clickButton(user, /View consumers/i);
    await waitFor(() => expect(screen.getByText("sub-consumer")).toBeTruthy());
    await clickButton(user, /Subscribe/i);
    await waitFor(() => expect(screen.getByText(/Subscribe to Shard/)).toBeTruthy());
    const selectTriggers = screen.getAllByRole("button", { name: /Select a shard/i });
    await user.click(selectTriggers[selectTriggers.length - 1]);
    await waitFor(() => expect(screen.getAllByText("shard-001").length).toBeGreaterThan(0));
    await user.click(screen.getAllByText("shard-001")[0]);
    await user.click(screen.getByRole("button", { name: /Fetch records/i }));
    await waitFor(() => {
      expect(screen.getByText("pk-a")).toBeTruthy();
      expect(screen.getByText("pk-b")).toBeTruthy();
    });
    // Records header should show count 2
    expect(screen.getByText("Records (2)")).toBeTruthy();
  });

  it("subscribe record without arrival timestamp does not show Arrival row", async () => {
    mockSubscribeToShard.mockResolvedValue({
      events: [
        { partitionKey: "no-ts", sequenceNumber: "seq-ts", data: "Zg==" },
      ],
    });
    setupStream();
    mockConsumers.mockReturnValue({
      data: { consumers: [{ ConsumerName: "sub-consumer", ConsumerARN: "arn:...", ConsumerStatus: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockShards.mockReturnValue({
      data: { shards: [{ ShardId: "shard-001" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
    await clickButton(user, /View consumers/i);
    await waitFor(() => expect(screen.getByText("sub-consumer")).toBeTruthy());
    await clickButton(user, /Subscribe/i);
    await waitFor(() => expect(screen.getByText(/Subscribe to Shard/)).toBeTruthy());
    const selectTriggers = screen.getAllByRole("button", { name: /Select a shard/i });
    await user.click(selectTriggers[selectTriggers.length - 1]);
    await waitFor(() => expect(screen.getAllByText("shard-001").length).toBeGreaterThan(0));
    await user.click(screen.getAllByText("shard-001")[0]);
    await user.click(screen.getByRole("button", { name: /Fetch records/i }));
    await waitFor(() => expect(screen.getByText("no-ts")).toBeTruthy());
    // Record renders but Arrival row is absent (approximateArrivalTimestamp is falsy)
    expect(screen.queryByText(/Arrival:/)).toBeNull();
  });

  it("dismisses the create stream modal with Escape", async () => {
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create Kinesis stream")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create Kinesis stream"));
  });

  it("dismisses the register consumer modal with Escape", async () => {
    setupStream();
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
    await clickButton(user, /View consumers/i);
    await waitFor(() => expect(screen.getByText(/Register consumer/i)).toBeTruthy());
    await clickButton(user, /Register consumer/i);
    await waitFor(() => expect(screen.getByText("Register Stream Consumer")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Register Stream Consumer"));
  });

  it("closes the subscribe modal with the Close button", async () => {
    mockSubscribeToShard.mockResolvedValue({ events: [] });
    setupStream();
    mockConsumers.mockReturnValue({
      data: { consumers: [{ ConsumerName: "sub-consumer", ConsumerARN: "arn:...", ConsumerStatus: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
    await clickButton(user, /View consumers/i);
    await waitFor(() => expect(screen.getByText("sub-consumer")).toBeTruthy());
    await user.click(screen.getAllByRole("button", { name: /Subscribe/i })[0]);
    await waitFor(() => expect(screen.getByText(/Subscribe to Shard/)).toBeTruthy());
    await user.click(within(dialogOf("Subscribe to Shard — my-stream")).getByRole("button", { name: /Close/i }));
    await waitFor(() => expectModalHidden("Subscribe to Shard — my-stream"));
  });

  it("dismisses the subscribe modal with Escape", async () => {
    mockSubscribeToShard.mockResolvedValue({ events: [] });
    setupStream();
    mockConsumers.mockReturnValue({
      data: { consumers: [{ ConsumerName: "sub-consumer", ConsumerARN: "arn:...", ConsumerStatus: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() => expect(screen.getByText(/Shards: my-stream/)).toBeTruthy());
    await clickButton(user, /View consumers/i);
    await waitFor(() => expect(screen.getByText("sub-consumer")).toBeTruthy());
    await user.click(screen.getAllByRole("button", { name: /Subscribe/i })[0]);
    await waitFor(() => expect(screen.getByText(/Subscribe to Shard/)).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Subscribe to Shard — my-stream"));
  });
});

// ─── Settings tab ────────────────────────────────────────

describe("KinesisDashboard — settings tab", () => {
  function setupSettings() {
    mockStreams.mockReturnValue({
      data: { streams: [{ StreamName: "my-stream", StreamStatus: "ACTIVE", OpenShardCount: 1, RetentionPeriodHours: 24 }], total: 1 },
      isLoading: false,
    });
    mockStreamDetail.mockReturnValue({
      data: {
        stream: {
          StreamName: "my-stream",
          StreamARN: "arn:aws:kinesis:us-east-1::stream/my-stream",
          RetentionPeriodHours: 24,
          EncryptionType: "NONE",
        },
      },
      isLoading: false,
    });
    mockShards.mockReturnValue({
      data: {
        shards: [
          {
            ShardId: "shardId-000000000001",
            HashKeyRange: { StartingHashKey: "0", EndingHashKey: "340" },
            SequenceNumberRange: { StartingSequenceNumber: "49" },
          },
        ],
        total: 1,
      },
    });
    return { user: userEvent.setup() };
  }

  async function openSettings(user: ReturnType<typeof userEvent.setup>) {
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: /Settings: my-stream/i })).toBeTruthy()
    );
    await user.click(screen.getByRole("tab", { name: /Settings: my-stream/i }));
    await waitFor(() =>
      expect(screen.getByText(/Retention period \(current:/i)).toBeTruthy()
    );
  }

  it("renders all settings sections with current values", async () => {
    const { user } = setupSettings();
    await openSettings(user);
    expect(screen.getByText(/current: 24 hrs/i)).toBeTruthy();
    expect(screen.getByText(/Server-side encryption \(current: NONE\)/i)).toBeTruthy();
    expect(screen.getByText(/Enhanced monitoring/i)).toBeTruthy();
    expect(screen.getByText(/Stream mode/i)).toBeTruthy();
    expect(screen.getByText(/Resharding/i)).toBeTruthy();
    expect(screen.getByText(/Tags for my-stream/i)).toBeTruthy();
  });

  it("shows encryption current type from stream detail", async () => {
    const { user } = setupSettings();
    mockStreamDetail.mockReturnValue({
      data: {
        stream: {
          StreamName: "my-stream",
          StreamARN: "arn:aws:kinesis:us-east-1::stream/my-stream",
          RetentionPeriodHours: 48,
          EncryptionType: "KMS",
        },
      },
      isLoading: false,
    });
    await openSettings(user);
    expect(screen.getByText(/current: 48 hrs/i)).toBeTruthy();
    expect(screen.getByText(/current: KMS\)/i)).toBeTruthy();
  });

  it("increases retention and clears the input", async () => {
    const { user } = setupSettings();
    await openSettings(user);
    const input = screen.getByPlaceholderText("24");
    await user.type(input, "48");
    await clickButton(user, /^Increase$/i);
    await waitFor(() => expect(mockIncreaseRetention).toHaveBeenCalledWith(48));
    await waitFor(() => expect((screen.getByPlaceholderText("24") as HTMLInputElement).value).toBe(""));
  });

  it("decreases retention", async () => {
    const { user } = setupSettings();
    await openSettings(user);
    await user.type(screen.getByPlaceholderText("24"), "12");
    await clickButton(user, /^Decrease$/i);
    await waitFor(() => expect(mockDecreaseRetention).toHaveBeenCalledWith(12));
  });

  it("disables retention buttons when input empty", async () => {
    const { user } = setupSettings();
    await openSettings(user);
    expect(
      (screen.getByRole("button", { name: /^Increase$/i }) as HTMLButtonElement).disabled
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: /^Decrease$/i }) as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it("shows retention error alert and dismisses it", async () => {
    const { user } = setupSettings();
    increaseRetentionState.isError = true;
    increaseRetentionState.error = new Error("retention boom");
    await openSettings(user);
    expect(screen.getByText(/retention boom/i)).toBeTruthy();
    const dismiss = document.querySelector(
      '[class*="awsui_dismiss-button"]'
    ) as HTMLElement;
    await user.click(dismiss);
  });

  it("starts encryption with KMS type and clears key input", async () => {
    const { user } = setupSettings();
    await openSettings(user);
    const input = screen.getByPlaceholderText("alias/aws/kinesis");
    await user.type(input, "alias/my-key");
    await clickButton(user, /Start encryption/i);
    await waitFor(() =>
      expect(mockStartEncryption).toHaveBeenCalledWith({
        encryptionType: "KMS",
        keyId: "alias/my-key",
      })
    );
    await waitFor(
      () =>
        expect(
          (screen.getByPlaceholderText("alias/aws/kinesis") as HTMLInputElement).value
        ).toBe("")
    );
  });

  it("disables start-encryption button until key typed", async () => {
    const { user } = setupSettings();
    await openSettings(user);
    expect(
      (screen.getByRole("button", { name: /Start encryption/i }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
  });

  it("stops encryption", async () => {
    const { user } = setupSettings();
    await openSettings(user);
    await clickButton(user, /Stop encryption/i);
    await waitFor(() => expect(mockStopEncryption).toHaveBeenCalled());
  });

  it("shows encryption error alert and dismisses it", async () => {
    const { user } = setupSettings();
    startEncryptionState.isError = true;
    startEncryptionState.error = new Error("kms denied");
    await openSettings(user);
    expect(screen.getByText(/kms denied/i)).toBeTruthy();
    const dismiss = document.querySelector(
      '[class*="awsui_dismiss-button"]'
    ) as HTMLElement;
    await user.click(dismiss);
  });

  it("enables monitoring and shows the result alert", async () => {
    const { user } = setupSettings();
    await openSettings(user);
    await user.type(screen.getByPlaceholderText(/IncomingBytes/), "IncomingBytes");
    await clickButton(user, /^Enable$/i);
    await waitFor(() =>
      expect(mockEnableMonitoring).toHaveBeenCalledWith(["IncomingBytes"])
    );
    await waitFor(() =>
      expect(screen.getByText(/Current metrics: IncomingBytes/i)).toBeTruthy()
    );
  });

  it("disables monitoring and shows fallback for sparse metrics", async () => {
    const { user } = setupSettings();
    mockDisableMonitoring.mockResolvedValue({});
    await openSettings(user);
    await clickButton(user, /^Disable$/i);
    await waitFor(() => expect(mockDisableMonitoring).toHaveBeenCalledWith([]));
    await waitFor(() =>
      expect(screen.getByText(/Current metrics: none/i)).toBeTruthy()
    );
  });

  it("splits metrics input on commas and drops blanks", async () => {
    const { user } = setupSettings();
    await openSettings(user);
    await user.type(
      screen.getByPlaceholderText(/IncomingBytes/),
      "IncomingBytes, OutgoingBytes, "
    );
    await clickButton(user, /^Enable$/i);
    await waitFor(() =>
      expect(mockEnableMonitoring).toHaveBeenCalledWith([
        "IncomingBytes",
        "OutgoingBytes",
      ])
    );
  });

  it("shows monitoring error alert and dismisses it", async () => {
    const { user } = setupSettings();
    disableMonitoringState.isError = true;
    disableMonitoringState.error = new Error("monitor boom");
    await openSettings(user);
    expect(screen.getByText(/monitor boom/i)).toBeTruthy();
    const dismiss = document.querySelector(
      '[class*="awsui_dismiss-button"]'
    ) as HTMLElement;
    await user.click(dismiss);
  });

  it("updates the stream mode after selecting ON_DEMAND", async () => {
    const { user } = setupSettings();
    await openSettings(user);
    await user.click(screen.getAllByText("Select a mode...")[0]);
    await waitFor(() => expect(screen.getAllByText("ON_DEMAND").length).toBeGreaterThan(0));
    await user.click(screen.getAllByText("ON_DEMAND")[0]);
    await clickButton(user, /Update mode/i);
    await waitFor(() =>
      expect(mockUpdateStreamMode).toHaveBeenCalledWith({
        streamARN: "arn:aws:kinesis:us-east-1::stream/my-stream",
        streamMode: "ON_DEMAND",
      })
    );
  });

  it("disables update-mode until a mode is selected", async () => {
    const { user } = setupSettings();
    await openSettings(user);
    expect(
      (screen.getByRole("button", { name: /Update mode/i }) as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it("disables update-mode when stream ARN is missing", async () => {
    const { user } = setupSettings();
    mockStreamDetail.mockReturnValue({ data: { stream: {} }, isLoading: false });
    await openSettings(user);
    await user.click(screen.getAllByText("Select a mode...")[0]);
    await waitFor(() => expect(screen.getAllByText("ON_DEMAND").length).toBeGreaterThan(0));
    await user.click(screen.getAllByText("ON_DEMAND")[0]);
    expect(
      (screen.getByRole("button", { name: /Update mode/i }) as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it("shows stream-mode error alert and dismisses it", async () => {
    const { user } = setupSettings();
    updateModeState.isError = true;
    updateModeState.error = new Error("mode boom");
    await openSettings(user);
    expect(screen.getByText(/mode boom/i)).toBeTruthy();
    const dismiss = document.querySelector(
      '[class*="awsui_dismiss-button"]'
    ) as HTMLElement;
    await user.click(dismiss);
  });

  it("splits a shard after selecting shard and hash key", async () => {
    const { user } = setupSettings();
    await openSettings(user);
    // Split trigger is the first "Select a shard..." on the page
    await user.click(screen.getAllByText("Select a shard...")[0]);
    await waitFor(() => expect(screen.getAllByText("shardId-000000000001").length).toBeGreaterThan(0));
    await user.click(screen.getAllByText("shardId-000000000001")[0]);
    await user.type(
      screen.getByPlaceholderText("170141183460469231731687303715884105728"),
      "170"
    );
    await clickButton(user, /^Split$/i);
    await waitFor(() =>
      expect(mockSplitShard).toHaveBeenCalledWith({
        shardToSplit: "shardId-000000000001",
        newStartingHashKey: "170",
      })
    );
  });

  it("disables split until shard and hash key are set", async () => {
    const { user } = setupSettings();
    await openSettings(user);
    expect(
      (screen.getByRole("button", { name: /^Split$/i }) as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it("merges two shards", async () => {
    const { user } = setupSettings();
    await openSettings(user);
    // Three selects share the "Select a shard..." trigger label: split, merge, merge-adjacent.
    // Option lists render twice (hidden + open) — always click the LAST matching option.
    await user.click(screen.getAllByText("Select a shard...")[0]); // split
    await waitFor(() => expect(screen.getAllByText("shardId-000000000001").length).toBeGreaterThan(0));
    await user.click(screen.getAllByText("shardId-000000000001").slice(-1)[0]);
    await user.click(screen.getAllByText("Select a shard...")[0]); // now the merge select
    await waitFor(() => expect(screen.getAllByText("shardId-000000000001").length).toBeGreaterThan(0));
    await user.click(screen.getAllByText("shardId-000000000001").slice(-1)[0]);
    await user.click(screen.getAllByText("Select a shard...")[0]); // now the adjacent-merge select
    await waitFor(() => expect(screen.getAllByText("shardId-000000000001").length).toBeGreaterThan(0));
    await user.click(screen.getAllByText("shardId-000000000001").slice(-1)[0]);
    await clickButton(user, /^Merge$/i);
    await waitFor(() =>
      expect(mockMergeShards).toHaveBeenCalledWith({
        shardToMerge: "shardId-000000000001",
        adjacentShardToMerge: "shardId-000000000001",
      })
    );
  });

  it("disables merge until both shards selected", async () => {
    const { user } = setupSettings();
    await openSettings(user);
    expect(
      (screen.getByRole("button", { name: /^Merge$/i }) as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it("shows resharding error alert and dismisses it", async () => {
    const { user } = setupSettings();
    splitState.isError = true;
    splitState.error = new Error("split boom");
    await openSettings(user);
    expect(screen.getByText(/split boom/i)).toBeTruthy();
    const dismiss = document.querySelector(
      '[class*="awsui_dismiss-button"]'
    ) as HTMLElement;
    await user.click(dismiss);
  });

  it("renders tags and adds a new one", async () => {
    const { user } = setupSettings();
    mockTagsQuery.mockReturnValue({
      data: { tags: [{ Key: "env", Value: "prod" }] },
      isLoading: false,
    });
    await openSettings(user);
    expect(screen.getByText("env")).toBeTruthy();
    await user.type(screen.getByPlaceholderText("env"), "team");
    await user.type(screen.getByPlaceholderText("dev"), "core");
    await clickButton(user, /Add tag/i);
    await waitFor(() =>
      expect(mockAddTags).toHaveBeenCalledWith({ tags: { team: "core" } })
    );
    await waitFor(() => {
      expect((screen.getByPlaceholderText("env") as HTMLInputElement).value).toBe("");
      expect((screen.getByPlaceholderText("dev") as HTMLInputElement).value).toBe("");
    });
  });

  it("disables add-tag until key typed", async () => {
    const { user } = setupSettings();
    await openSettings(user);
    expect(
      (screen.getByRole("button", { name: /Add tag/i }) as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it("removes a tag via delete confirmation", async () => {
    const { user } = setupSettings();
    mockTagsQuery.mockReturnValue({
      data: { tags: [{ Key: "env", Value: "prod" }] },
      isLoading: false,
    });
    await openSettings(user);
    await user.click(screen.getByRole("button", { name: /Delete env/i }));
    const confirm = await screen.findByRole("button", { name: /Delete$/i });
    await user.click(confirm);
    await waitFor(() => expect(mockRemoveTags).toHaveBeenCalledWith(["env"]));
  });

  it("shows tag remove not-loading state when variables differ", async () => {
    const { user } = setupSettings();
    removeTagsState.isPending = true;
    removeTagsState.variables = "other-key";
    mockTagsQuery.mockReturnValue({
      data: { tags: [{ Key: "env", Value: "prod" }] },
      isLoading: false,
    });
    await openSettings(user);
    expect(screen.getByText("env")).toBeTruthy();
  });

  it("shows add/remove tag error alerts and dismisses them", async () => {
    const { user } = setupSettings();
    addTagsState.isError = true;
    addTagsState.error = new Error("add tag boom");
    removeTagsState.isError = true;
    removeTagsState.error = new Error("remove tag boom");
    await openSettings(user);
    expect(screen.getByText(/add tag boom/i)).toBeTruthy();
    expect(screen.getByText(/remove tag boom/i)).toBeTruthy();
    const buttons = document.querySelectorAll('[class*="awsui_dismiss-button"]');
    await user.click(buttons[0] as HTMLElement);
    await user.click(buttons[1] as HTMLElement);
  });
});

describe("KinesisDashboard — settings fallbacks", () => {
  function setupSettings2() {
    mockStreams.mockReturnValue({
      data: { streams: [{ StreamName: "my-stream", StreamStatus: "ACTIVE", OpenShardCount: 1, RetentionPeriodHours: 24 }], total: 1 },
      isLoading: false,
    });
    mockStreamDetail.mockReturnValue({
      data: {
        stream: {
          StreamName: "my-stream",
          StreamARN: "arn:aws:kinesis:us-east-1::stream/my-stream",
          RetentionPeriodHours: 24,
          EncryptionType: "NONE",
        },
      },
      isLoading: false,
    });
  }

  async function open(user: ReturnType<typeof userEvent.setup>) {
    render(<KinesisDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-stream"));
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: /Settings: my-stream/i })).toBeTruthy()
    );
    await user.click(screen.getByRole("tab", { name: /Settings: my-stream/i }));
    await waitFor(() =>
      expect(screen.getByText(/Retention period \(current:/i)).toBeTruthy()
    );
  }

  it("shows the decrease-retention error alert with fallback message", async () => {
    setupSettings2();
    decreaseRetentionState.isError = true;
    decreaseRetentionState.error = new Error("");
    const user = userEvent.setup();
    await open(user);
    expect(screen.getByText(/Failed to decrease retention/i)).toBeTruthy();
    const dismiss = document.querySelector(
      '[class*="awsui_dismiss-button"]'
    ) as HTMLElement;
    await user.click(dismiss);
  });

  it("shows the increase-retention fallback message for message-less errors", async () => {
    setupSettings2();
    increaseRetentionState.isError = true;
    increaseRetentionState.error = new Error("");
    const user = userEvent.setup();
    await open(user);
    expect(screen.getByText(/Failed to increase retention/i)).toBeTruthy();
  });

  it("shows the encryption fallback message for message-less errors", async () => {
    setupSettings2();
    startEncryptionState.isError = true;
    startEncryptionState.error = new Error("");
    const user = userEvent.setup();
    await open(user);
    expect(screen.getByText(/Failed to update encryption/i)).toBeTruthy();
  });

  it("shows the monitoring fallback message for message-less errors", async () => {
    setupSettings2();
    enableMonitoringState.isError = true;
    enableMonitoringState.error = new Error("");
    const user = userEvent.setup();
    await open(user);
    expect(screen.getByText(/Failed to update monitoring/i)).toBeTruthy();
  });

  it("shows the stream-mode fallback message for message-less errors", async () => {
    setupSettings2();
    updateModeState.isError = true;
    updateModeState.error = new Error("");
    const user = userEvent.setup();
    await open(user);
    expect(screen.getByText(/Failed to update stream mode/i)).toBeTruthy();
  });

  it("shows the resharding fallback message for message-less errors", async () => {
    setupSettings2();
    mergeShardsStateFallback();
    const user = userEvent.setup();
    await open(user);
    expect(screen.getByText(/Resharding failed/i)).toBeTruthy();
  });

  function mergeShardsStateFallback() {
    mergeState.isError = true;
    mergeState.error = new Error("");
  }

  it("shows add/remove tag fallback messages for message-less errors", async () => {
    setupSettings2();
    addTagsState.isError = true;
    addTagsState.error = new Error("");
    removeTagsState.isError = true;
    removeTagsState.error = new Error("");
    const user = userEvent.setup();
    await open(user);
    expect(screen.getByText(/Failed to add tags/i)).toBeTruthy();
    expect(screen.getByText(/Failed to remove tag/i)).toBeTruthy();
  });

  it("renders empty tags table when tags data is missing", async () => {
    setupSettings2();
    mockTagsQuery.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    await open(user);
    expect(screen.getByText(/No tags/i)).toBeTruthy();
  });
});
