// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../test/helpers";
import React from "react";

const mockStreams = vi.fn();
const mockGetShardIterator = vi.fn();
const mockGetRecords = vi.fn();

const streamsState = vi.hoisted(() => ({
  isLoading: false,
  isError: false,
  error: null as Error | null,
}));

const detailState = vi.hoisted(() => ({
  data: undefined as any,
  isLoading: false,
  isError: false,
}));

const getRecordsState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
}));

vi.mock("../hooks/useDynamoDBStreams", () => ({
  useDynamoDBStreams: () => ({
    get data() { return mockStreams(); },
    get isLoading() { return streamsState.isLoading; },
    get isError() { return streamsState.isError; },
    get error() { return streamsState.error; },
  }),
  useDynamoDBStreamDetail: () => ({
    get data() { return detailState.data; },
    get isLoading() { return detailState.isLoading; },
    get isError() { return detailState.isError; },
  }),
  useDynamoDBGetShardIterator: () => ({
    mutateAsync: mockGetShardIterator,
    isPending: false,
  }),
  useDynamoDBGetRecords: () => ({
    mutateAsync: mockGetRecords,
    isPending: false,
    get isError() { return getRecordsState.isError; },
    get error() { return getRecordsState.error; },
  }),
}));

import DynamoDBStreams from "./DynamoDBStreams";

beforeEach(() => {
  vi.clearAllMocks();
  streamsState.isLoading = false;
  streamsState.isError = false;
  streamsState.error = null;
  detailState.data = undefined;
  detailState.isLoading = false;
  detailState.isError = false;
  getRecordsState.isError = false;
  getRecordsState.error = null;
  mockStreams.mockReturnValue({ streams: [], total: 0 });
});

describe("DynamoDBStreams", () => {
  it("shows loading spinner", () => {
    streamsState.isLoading = true;
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    expect(screen.getByText(/Loading streams/)).toBeTruthy();
  });

  it("shows error state", () => {
    streamsState.isError = true;
    streamsState.error = new Error("Stream error");
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    expect(screen.getByText("Stream error")).toBeTruthy();
  });

  it("shows error with fallback", () => {
    streamsState.isError = true;
    streamsState.error = null as any;
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load streams")).toBeTruthy();
  });

  it("shows empty state when no streams", () => {
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    expect(screen.getByText("No streams")).toBeTruthy();
  });

  it("renders streams with data", () => {
    mockStreams.mockReturnValue({
      streams: [{
        streamArn: "arn:aws:dynamodb:us-east-1:123:table/test-table/stream/2024-01-01",
        tableName: "test-table",
        streamLabel: "2024-01-01T00:00:00.000",
      }],
      total: 1,
    });
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    expect(screen.getByText("test-table")).toBeTruthy();
    expect(screen.getByText("View details")).toBeTruthy();
  });

  it("shows dash for missing tableName and streamLabel", () => {
    mockStreams.mockReturnValue({
      streams: [{
        streamArn: "arn:minimal",
      }],
      total: 1,
    });
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });

  it("shows stream detail with data", async () => {
    mockStreams.mockReturnValue({
      streams: [{
        streamArn: "arn:aws:dynamodb:us-east-1:123:table/test-table/stream/abc",
        tableName: "test-table",
        streamLabel: "latest",
      }],
      total: 1,
    });
    detailState.data = {
      streamArn: "arn:...",
      streamStatus: "ENABLED",
      streamViewType: "NEW_AND_OLD_IMAGES",
      creationRequestDateTime: 1705000000,
      keySchema: [{ attributeName: "id", keyType: "HASH" }],
      shards: [],
    };
    const user = userEvent.setup();
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /View details/);
    await waitFor(() => {
      expect(screen.getByText("Enabled")).toBeTruthy();
      expect(screen.getByText("NEW_AND_OLD_IMAGES")).toBeTruthy();
    });
  });

  it("shows dash for missing stream detail fields", async () => {
    mockStreams.mockReturnValue({
      streams: [{
        streamArn: "arn:minimal",
        tableName: "test-table",
      }],
      total: 1,
    });
    detailState.data = {
      streamStatus: "ENABLED",
      streamViewType: null,
      creationRequestDateTime: null,
      keySchema: [],
      shards: [],
    };
    const user = userEvent.setup();
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /View details/);
    await waitFor(() => {
      expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows key schema section with data", async () => {
    mockStreams.mockReturnValue({
      streams: [{
        streamArn: "arn:ks",
        tableName: "test-table",
      }],
      total: 1,
    });
    detailState.data = {
      streamStatus: "ENABLED",
      keySchema: [
        { attributeName: "pk", keyType: "HASH" },
        { attributeName: "sk", keyType: "RANGE" },
      ],
      shards: [],
    };
    const user = userEvent.setup();
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /View details/);
    await waitFor(() => {
      expect(screen.getByText("pk")).toBeTruthy();
      expect(screen.getByText("sk")).toBeTruthy();
    });
  });

  it("shows shards section", async () => {
    mockStreams.mockReturnValue({
      streams: [{
        streamArn: "arn:shards",
        tableName: "test-table",
      }],
      total: 1,
    });
    detailState.data = {
      streamStatus: "ENABLED",
      keySchema: [],
      shards: [{
        shardId: "shardId-000000000001",
        sequenceNumberRange: {
          startingSequenceNumber: "1000",
          endingSequenceNumber: "2000",
        },
      }],
    };
    const user = userEvent.setup();
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /View details/);
    await waitFor(() => {
      expect(screen.getAllByText("shardId-000000000001").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows shard with parentShardId", async () => {
    mockStreams.mockReturnValue({
      streams: [{ streamArn: "arn:parent", tableName: "test-table" }],
      total: 1,
    });
    detailState.data = {
      streamStatus: "ENABLED",
      keySchema: [],
      shards: [{
        shardId: "shard-2",
        parentShardId: "shard-1",
        sequenceNumberRange: { startingSequenceNumber: "2000" },
      }],
    };
    const user = userEvent.setup();
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /View details/);
    await waitFor(() => {
      expect(screen.getByText(/Parent: shard-1/)).toBeTruthy();
    });
  });

  it("shows detail error state", async () => {
    mockStreams.mockReturnValue({
      streams: [{ streamArn: "arn:err", tableName: "test-table" }],
      total: 1,
    });
    detailState.isError = true;
    const user = userEvent.setup();
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /View details/);
    await waitFor(() => {
      expect(screen.getByText("Failed to load stream details")).toBeTruthy();
    });
  });

  it("shows detail loading spinner", async () => {
    mockStreams.mockReturnValue({
      streams: [{ streamArn: "arn:loading", tableName: "test-table" }],
      total: 1,
    });
    detailState.isLoading = true;
    const user = userEvent.setup();
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /View details/);
    await waitFor(() => {
      expect(screen.getByText("Stream details")).toBeTruthy();
    });
  });

  it("shows no shards message in poll records", async () => {
    mockStreams.mockReturnValue({
      streams: [{ streamArn: "arn:noshards", tableName: "test-table" }],
      total: 1,
    });
    detailState.data = {
      streamStatus: "ENABLED",
      keySchema: [],
      shards: [],
    };
    const user = userEvent.setup();
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /View details/);
    await waitFor(() => {
      expect(screen.getByText(/No shards available/)).toBeTruthy();
    });
  });

  // ─── Record Polling Flow ────────────────────────────────

  it("fetches records after selecting a shard and clicking Get Records", async () => {
    mockStreams.mockReturnValue({
      streams: [{ streamArn: "arn:poll", tableName: "test-table" }],
      total: 1,
    });
    detailState.data = {
      streamStatus: "ENABLED",
      keySchema: [],
      shards: [{
        shardId: "shard-1",
        sequenceNumberRange: { startingSequenceNumber: "100", endingSequenceNumber: "200" },
      }],
    };
    mockGetShardIterator.mockResolvedValue({ shardIterator: "iter-1" });
    mockGetRecords.mockResolvedValue({
      records: [{ eventID: "evt-1", eventName: "INSERT", dynamodb: null }],
      nextShardIterator: "next-iter",
    });
    const user = userEvent.setup();
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /View details/);
    await waitFor(() => expect(screen.getByText("Poll Records")).toBeTruthy());
    fireEvent.change(screen.getByDisplayValue("Select a shard..."), { target: { value: "shard-1" } });
    await clickButton(user, /Get Records/);
    await waitFor(() => {
      expect(mockGetShardIterator).toHaveBeenCalledWith(
        expect.objectContaining({
          streamArn: "arn:poll",
          shardId: "shard-1",
          shardIteratorType: "TRIM_HORIZON",
        })
      );
      expect(mockGetRecords).toHaveBeenCalledWith({ shardIterator: "iter-1", limit: 50 });
    });
    await waitFor(() => {
      expect(screen.getByText(/evt-1/)).toBeTruthy();
      expect(screen.getByText("INSERT")).toBeTruthy();
      expect(screen.getByText(/1 record retrieved/)).toBeTruthy();
    });
  });

  it("does not fetch records when shard iterator is missing", async () => {
    mockStreams.mockReturnValue({
      streams: [{ streamArn: "arn:noiter", tableName: "test-table" }],
      total: 1,
    });
    detailState.data = {
      streamStatus: "ENABLED",
      keySchema: [],
      shards: [{ shardId: "shard-1" }],
    };
    mockGetShardIterator.mockResolvedValue({});
    const user = userEvent.setup();
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /View details/);
    await waitFor(() => expect(screen.getByText("Poll Records")).toBeTruthy());
    fireEvent.change(screen.getByDisplayValue("Select a shard..."), { target: { value: "shard-1" } });
    await clickButton(user, /Get Records/);
    await waitFor(() => expect(mockGetShardIterator).toHaveBeenCalled());
    expect(mockGetRecords).not.toHaveBeenCalled();
    expect(screen.queryByText(/record retrieved/)).toBeNull();
  });

  it("loads more records via continue polling", async () => {
    mockStreams.mockReturnValue({
      streams: [{ streamArn: "arn:cont", tableName: "test-table" }],
      total: 1,
    });
    detailState.data = {
      streamStatus: "ENABLED",
      keySchema: [],
      shards: [{ shardId: "shard-1" }],
    };
    mockGetShardIterator.mockResolvedValue({ shardIterator: "iter-1" });
    mockGetRecords
      .mockResolvedValueOnce({
        records: [{ eventID: "evt-1", eventName: "INSERT", dynamodb: null }],
        nextShardIterator: "next-1",
      })
      .mockResolvedValueOnce({
        records: [{ eventID: "evt-2", eventName: "MODIFY", dynamodb: null }],
        nextShardIterator: null,
      });
    const user = userEvent.setup();
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /View details/);
    await waitFor(() => expect(screen.getByText("Poll Records")).toBeTruthy());
    fireEvent.change(screen.getByDisplayValue("Select a shard..."), { target: { value: "shard-1" } });
    await clickButton(user, /Get Records/);
    await waitFor(() => expect(screen.getByText(/1 record retrieved/)).toBeTruthy());
    await clickButton(user, /Load more records/);
    await waitFor(() => {
      expect(mockGetRecords).toHaveBeenCalledWith({ shardIterator: "next-1", limit: 50 });
      expect(screen.getByText(/2 records retrieved/)).toBeTruthy();
      expect(screen.getByText(/evt-2/)).toBeTruthy();
      expect(screen.getByText("MODIFY")).toBeTruthy();
    });
  });

  it("renders record images, keys, and event badges", async () => {
    mockStreams.mockReturnValue({
      streams: [{ streamArn: "arn:imgs", tableName: "test-table" }],
      total: 1,
    });
    detailState.data = {
      streamStatus: "ENABLED",
      keySchema: [],
      shards: [{ shardId: "shard-1" }],
    };
    mockGetShardIterator.mockResolvedValue({ shardIterator: "iter-1" });
    mockGetRecords.mockResolvedValue({
      records: [
        {
          eventID: "evt-keys",
          eventName: "MODIFY",
          dynamodb: {
            keys: { pk: { S: "1" } },
            newImage: { name: { S: "Alice" } },
            oldImage: { name: { S: "Bob" } },
            sequenceNumber: "00000000000000000123",
          },
        },
        { eventID: "evt-rm", eventName: "REMOVE", dynamodb: null },
      ],
      nextShardIterator: null,
    });
    const user = userEvent.setup();
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /View details/);
    await waitFor(() => expect(screen.getByText("Poll Records")).toBeTruthy());
    fireEvent.change(screen.getByDisplayValue("Select a shard..."), { target: { value: "shard-1" } });
    await clickButton(user, /Get Records/);
    await waitFor(() => {
      expect(screen.getByText("MODIFY")).toBeTruthy();
      expect(screen.getByText("REMOVE")).toBeTruthy();
      expect(screen.getByText(/Keys:/)).toBeTruthy();
      expect(screen.getByText(/New Image:/)).toBeTruthy();
      expect(screen.getByText(/Old Image:/)).toBeTruthy();
      expect(screen.getByText(/"pk"/)).toBeTruthy();
    });
  });

  it("shows getRecords error message", async () => {
    mockStreams.mockReturnValue({
      streams: [{ streamArn: "arn:err", tableName: "test-table" }],
      total: 1,
    });
    detailState.data = {
      streamStatus: "ENABLED",
      keySchema: [],
      shards: [{ shardId: "shard-1" }],
    };
    getRecordsState.isError = true;
    getRecordsState.error = new Error("Records failed");
    const user = userEvent.setup();
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /View details/);
    await waitFor(() => {
      expect(screen.getByText("Records failed")).toBeTruthy();
    });
  });

  it("shows fallback getRecords error message", async () => {
    mockStreams.mockReturnValue({
      streams: [{ streamArn: "arn:err2", tableName: "test-table" }],
      total: 1,
    });
    detailState.data = {
      streamStatus: "ENABLED",
      keySchema: [],
      shards: [{ shardId: "shard-1" }],
    };
    getRecordsState.isError = true;
    getRecordsState.error = null as any;
    const user = userEvent.setup();
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /View details/);
    await waitFor(() => {
      expect(screen.getByText("Failed to fetch records")).toBeTruthy();
    });
  });

  it("shows fallback badge for unknown stream status", async () => {
    mockStreams.mockReturnValue({
      streams: [{ streamArn: "arn:status", tableName: "test-table" }],
      total: 1,
    });
    detailState.data = {
      streamStatus: "ENABLING",
      streamViewType: null,
      creationRequestDateTime: null,
      keySchema: [],
      shards: [],
    };
    const user = userEvent.setup();
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /View details/);
    await waitFor(() => {
      expect(screen.getByText("ENABLING")).toBeTruthy();
    });
  });

  it("filters streams by table name", async () => {
    mockStreams.mockReturnValue({
      streams: [
        { streamArn: "arn:1", tableName: "users" },
        { streamArn: "arn:2", tableName: "orders" },
      ],
      total: 2,
    });
    const user = userEvent.setup();
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("Find streams by table name"), "orders");
    await waitFor(() => {
      expect(screen.getByText("orders")).toBeTruthy();
      expect(screen.queryByText("users")).toBeNull();
    });
  });

  it("handles stream without streamArn (shortArn fallback)", () => {
    mockStreams.mockReturnValue({
      streams: [{ streamLabel: "no-arn", tableName: "test-table" }],
      total: 1,
    });
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    expect(screen.getByText("test-table")).toBeTruthy();
    expect(screen.getByText("View details")).toBeTruthy();
  });

  it("shows dash for stream with missing tableName during filter", async () => {
    mockStreams.mockReturnValue({
      streams: [{ streamArn: "arn:x", tableName: undefined }],
      total: 1,
    });
    const user = userEvent.setup();
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("Find streams by table name"), "z");
    await waitFor(() => {
      expect(screen.queryByText("View details")).toBeNull();
    });
  });

  it("handles streams data without a streams array (|| [] fallback)", () => {
    mockStreams.mockReturnValue({ total: 0 });
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    expect(screen.getByText("No streams")).toBeTruthy();
  });

  it("handles getRecords response without a records array", async () => {
    mockStreams.mockReturnValue({
      streams: [{ streamArn: "arn:norec", tableName: "test-table" }],
      total: 1,
    });
    detailState.data = {
      streamStatus: "ENABLED",
      keySchema: [],
      shards: [{ shardId: "shard-1" }],
    };
    mockGetShardIterator.mockResolvedValue({ shardIterator: "iter-1" });
    mockGetRecords.mockResolvedValue({ nextShardIterator: "next-1" });
    const user = userEvent.setup();
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /View details/);
    await waitFor(() => expect(screen.getByText("Poll Records")).toBeTruthy());
    fireEvent.change(screen.getByDisplayValue("Select a shard..."), { target: { value: "shard-1" } });
    await clickButton(user, /Get Records/);
    await waitFor(() => {
      expect(mockGetShardIterator).toHaveBeenCalled();
      expect(screen.queryByText(/record retrieved/)).toBeNull();
    });
  });

  it("handles missing records array when continuing polling", async () => {
    mockStreams.mockReturnValue({
      streams: [{ streamArn: "arn:cont2", tableName: "test-table" }],
      total: 1,
    });
    detailState.data = {
      streamStatus: "ENABLED",
      keySchema: [],
      shards: [{ shardId: "shard-1" }],
    };
    mockGetShardIterator.mockResolvedValue({ shardIterator: "iter-1" });
    mockGetRecords
      .mockResolvedValueOnce({
        records: [{ eventID: "evt-1", eventName: "INSERT", dynamodb: null }],
        nextShardIterator: "next-1",
      })
      .mockResolvedValueOnce({ nextShardIterator: null });
    const user = userEvent.setup();
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /View details/);
    await waitFor(() => expect(screen.getByText("Poll Records")).toBeTruthy());
    fireEvent.change(screen.getByDisplayValue("Select a shard..."), { target: { value: "shard-1" } });
    await clickButton(user, /Get Records/);
    await waitFor(() => expect(screen.getByText(/1 record retrieved/)).toBeTruthy());
    await clickButton(user, /Load more records/);
    await waitFor(() => {
      expect(screen.getByText(/1 record retrieved/)).toBeTruthy();
      expect(screen.queryByRole("button", { name: /Load more records/i })).toBeNull();
    });
  });

  it("renders unknown event name with fallback badge and record without eventID", async () => {
    mockStreams.mockReturnValue({
      streams: [{ streamArn: "arn:unknown", tableName: "test-table" }],
      total: 1,
    });
    detailState.data = {
      streamStatus: "ENABLED",
      keySchema: [],
      shards: [{ shardId: "shard-1" }],
    };
    mockGetShardIterator.mockResolvedValue({ shardIterator: "iter-1" });
    mockGetRecords.mockResolvedValue({
      records: [{ eventName: "UNKNOWN_EVENT", dynamodb: null }],
      nextShardIterator: null,
    });
    const user = userEvent.setup();
    render(<DynamoDBStreams tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /View details/);
    await waitFor(() => expect(screen.getByText("Poll Records")).toBeTruthy());
    fireEvent.change(screen.getByDisplayValue("Select a shard..."), { target: { value: "shard-1" } });
    await clickButton(user, /Get Records/);
    await waitFor(() => {
      expect(screen.getByText("UNKNOWN_EVENT")).toBeTruthy();
      expect(screen.getByText(/1 record retrieved/)).toBeTruthy();
    });
  });
});
