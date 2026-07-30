// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
});
