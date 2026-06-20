// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useDynamoDBTTL: vi.fn(),
  useDynamoDBUpdateTTL: vi.fn(),
  useDynamoDBTableTags: vi.fn(),
  useDynamoDBUpdateTags: vi.fn(),
  useDynamoDBDeleteTag: vi.fn(),
  useDynamoDBContinuousBackups: vi.fn(),
  useDynamoDBUpdateContinuousBackups: vi.fn(),
  useDynamoDBPartiQL: vi.fn(),
}));

vi.mock("../hooks/useDynamoDBAdvanced", () => mockHooks);

vi.mock("../lib/utils", () => ({ formatItemValue: (v: any) => String(v) }));

import DynamoDBAdvanced from "./DynamoDBAdvanced";

function setupDefaultMocks() {
  mockHooks.useDynamoDBTTL.mockReturnValue({ data: { enabled: false, attributeName: "", status: "DISABLED" }, isLoading: false });
  mockHooks.useDynamoDBUpdateTTL.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false });
  mockHooks.useDynamoDBTableTags.mockReturnValue({ data: { tags: [] }, isLoading: false });
  mockHooks.useDynamoDBUpdateTags.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false });
  mockHooks.useDynamoDBDeleteTag.mockReturnValue({ mutate: vi.fn() });
  mockHooks.useDynamoDBContinuousBackups.mockReturnValue({ data: { pointInTimeRecovery: { enabled: false, status: "DISABLED" } }, isLoading: false });
  mockHooks.useDynamoDBUpdateContinuousBackups.mockReturnValue({ mutate: vi.fn(), isError: false });
  mockHooks.useDynamoDBPartiQL.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false });
}

describe("DynamoDBAdvanced", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it("renders with Indexes tab active by default", () => {
    render(
      <DynamoDBAdvanced tableName="test-table" tableDetail={{ name: "test-table", status: "ACTIVE", keySchema: [], globalSecondaryIndexes: [], localSecondaryIndexes: [] }} />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("Global Secondary Indexes (GSIs)")).toBeTruthy();
    expect(screen.getByText("Local Secondary Indexes (LSIs)")).toBeTruthy();
  });

  it("shows GSI data when present", () => {
    render(
      <DynamoDBAdvanced tableName="t" tableDetail={{
        name: "t", status: "ACTIVE", keySchema: [],
        globalSecondaryIndexes: [{ IndexName: "my-gsi", IndexStatus: "ACTIVE", KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }], ItemCount: 5, IndexSizeBytes: 1024 }],
        localSecondaryIndexes: [],
      }} />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("my-gsi")).toBeTruthy();
  });

  it("shows LSI data when present", () => {
    render(
      <DynamoDBAdvanced tableName="t" tableDetail={{
        name: "t", status: "ACTIVE", keySchema: [],
        globalSecondaryIndexes: [],
        localSecondaryIndexes: [{ IndexName: "my-lsi", KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }, { AttributeName: "sk", KeyType: "RANGE" }] }],
      }} />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("my-lsi")).toBeTruthy();
  });

  it("switches to TTL tab", async () => {
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("TTL"));
    expect(screen.getByText("Time to Live (TTL)")).toBeTruthy();
  });

  it("switches to Tags tab", async () => {
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    expect(screen.getByText("Table Tags")).toBeTruthy();
  });

  it("switches to Backups tab", async () => {
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Backups"));
    expect(screen.getByText("Continuous Backups")).toBeTruthy();
  });

  it("switches to PartiQL tab", async () => {
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("PartiQL"));
    expect(screen.getByText("PartiQL Query Editor")).toBeTruthy();
  });

  it("TTL tab shows loading state", () => {
    mockHooks.useDynamoDBTTL.mockReturnValue({ data: undefined, isLoading: true });
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    expect(screen.getByText("Global Secondary Indexes (GSIs)")).toBeTruthy();
  });

  it("Tags tab shows loading state via hook", async () => {
    mockHooks.useDynamoDBTableTags.mockReturnValue({ data: undefined, isLoading: true });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    expect(screen.queryByText("Table Tags")).toBeFalsy();
  });

  it("Backups tab shows loading state via hook", async () => {
    mockHooks.useDynamoDBContinuousBackups.mockReturnValue({ data: undefined, isLoading: true });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Backups"));
    expect(screen.queryByText("Continuous Backups")).toBeFalsy();
  });

  it("PartiQL tab can run query", async () => {
    const mockMutate = vi.fn((args, opts) => opts?.onSuccess({ items: [{ id: "1" }], count: 1 }));
    mockHooks.useDynamoDBPartiQL.mockReturnValue({ mutate: mockMutate, isPending: false, isError: false });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("PartiQL"));
    const btn = screen.getByText("Run query");
    await user.click(btn);
    expect(mockMutate).toHaveBeenCalled();
  });

  it("Tags tab loads existing tags", async () => {
    mockHooks.useDynamoDBTableTags.mockReturnValue({
      data: { tags: [{ Key: "env", Value: "prod" }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    await waitFor(() => {
      expect(screen.getByDisplayValue("env")).toBeTruthy();
      expect(screen.getByDisplayValue("prod")).toBeTruthy();
    });
  });

  it("TTL tab loads existing TTL config", async () => {
    mockHooks.useDynamoDBTTL.mockReturnValue({
      data: { enabled: true, attributeName: "expires", status: "ENABLED" },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("TTL"));
    expect(screen.getByDisplayValue("expires")).toBeTruthy();
  });

  it("Backups tab shows PITR status when enabled", async () => {
    mockHooks.useDynamoDBContinuousBackups.mockReturnValue({
      data: { pointInTimeRecovery: { enabled: true, status: "ENABLED" } },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Backups"));
    expect(screen.getByText("PITR enabled")).toBeTruthy();
  });
});
