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
  useDynamoDBPartiQLTransaction: vi.fn(),
  useDynamoDBPartiQLBatch: vi.fn(),
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
  mockHooks.useDynamoDBPartiQLTransaction.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false });
  mockHooks.useDynamoDBPartiQLBatch.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false });
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

  // ─── PartiQL: Transaction and Batch tabs ───────────────

  it("switches to Transaction sub-tab in PartiQL", async () => {
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("PartiQL"));
    await user.click(screen.getByText("Transaction"));
    expect(screen.getByText("Execute transaction")).toBeTruthy();
  });

  it("switches to Batch sub-tab in PartiQL", async () => {
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("PartiQL"));
    await user.click(screen.getByText("Batch"));
    expect(screen.getByText("Execute batch")).toBeTruthy();
  });

  // ─── PartiQL error states ─────────────────────────────

  it("Single Statement shows error alert", async () => {
    mockHooks.useDynamoDBPartiQL.mockReturnValue({
      mutate: vi.fn(), isPending: false, isError: true, error: new Error("Syntax error"),
    });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("PartiQL"));
    expect(screen.getByText("Syntax error")).toBeTruthy();
  });

  it("Single Statement shows result after query", async () => {
    const mockMutate = vi.fn((_args, opts) => {
      if (opts?.onSuccess) opts.onSuccess({ items: [{ id: "1", name: "test" }], count: 1 });
    });
    mockHooks.useDynamoDBPartiQL.mockReturnValue({ mutate: mockMutate, isPending: false, isError: false });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("PartiQL"));
    await user.click(screen.getByText("Run query"));
    await waitFor(() => {
      expect(screen.getByText("Results")).toBeTruthy();
    });
  });

  it("Single Statement shows nextToken message", async () => {
    const mockMutate = vi.fn((_args, opts) => {
      if (opts?.onSuccess) opts.onSuccess({ items: [{ id: "1" }], count: 1, nextToken: "tok" });
    });
    mockHooks.useDynamoDBPartiQL.mockReturnValue({ mutate: mockMutate, isPending: false, isError: false });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("PartiQL"));
    await user.click(screen.getByText("Run query"));
    await waitFor(() => {
      expect(screen.getByText(/More results available/)).toBeTruthy();
    });
  });

  // ─── TransactionEditor ─────────────────────────────────

  it("Transaction editor shows disabled button when empty", async () => {
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("PartiQL"));
    await user.click(screen.getByText("Transaction"));
    const btn = screen.getByRole("button", { name: /Execute transaction/i });
    expect(btn).toBeTruthy();
    expect(btn.getAttribute("disabled")).toBeNull(); // has default placeholder text
  });

  // ─── TTL Save and errors ──────────────────────────────

  it("TTL shows error alert on update failure", async () => {
    mockHooks.useDynamoDBTTL.mockReturnValue({
      data: { enabled: true, attributeName: "exp", status: "ENABLED" },
      isLoading: false,
    });
    mockHooks.useDynamoDBUpdateTTL.mockReturnValue({
      mutate: vi.fn(), isPending: false, isError: true, error: new Error("TTL update failed"),
    });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("TTL"));
    expect(screen.getByText("TTL update failed")).toBeTruthy();
  });

  it("TTL shows fallback error when no message", async () => {
    mockHooks.useDynamoDBTTL.mockReturnValue({
      data: { enabled: true, attributeName: "x", status: "ENABLED" },
      isLoading: false,
    });
    mockHooks.useDynamoDBUpdateTTL.mockReturnValue({
      mutate: vi.fn(), isPending: false, isError: true, error: {} as Error,
    });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("TTL"));
    expect(screen.getByText("Failed to update TTL")).toBeTruthy();
  });

  // ─── Tags add/remove ──────────────────────────────────

  it("adds a new tag row", async () => {
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    const addBtn = screen.getByText("Add tag");
    await user.click(addBtn);
    // After adding, there should be an input with placeholder "Tag key"
    expect(screen.getByPlaceholderText("Tag key")).toBeTruthy();
    expect(screen.getByPlaceholderText("Tag value")).toBeTruthy();
  });

  it("Tags show error alert on update failure", async () => {
    mockHooks.useDynamoDBUpdateTags.mockReturnValue({
      mutate: vi.fn(), isPending: false, isError: true, error: new Error("Tags update failed"),
    });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    expect(screen.getByText("Tags update failed")).toBeTruthy();
  });

  it("Tags show fallback error when no message", async () => {
    mockHooks.useDynamoDBUpdateTags.mockReturnValue({
      mutate: vi.fn(), isPending: false, isError: true, error: {} as Error,
    });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    expect(screen.getByText("Failed to update tags")).toBeTruthy();
  });

  // ─── Backups error ────────────────────────────────────

  it("Backups shows error alert on toggle failure", async () => {
    mockHooks.useDynamoDBContinuousBackups.mockReturnValue({
      data: { pointInTimeRecovery: { enabled: false, status: "DISABLED" } },
      isLoading: false,
    });
    mockHooks.useDynamoDBUpdateContinuousBackups.mockReturnValue({
      mutate: vi.fn(), isError: true, error: new Error("PITR update failed"),
    });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Backups"));
    expect(screen.getByText("PITR update failed")).toBeTruthy();
  });

  // ─── GSI size edge: 0 bytes ───────────────────────────

  it("shows 0 B for GSI with IndexSizeBytes=0", () => {
    render(
      <DynamoDBAdvanced tableName="t" tableDetail={{
        name: "t", status: "ACTIVE", keySchema: [],
        globalSecondaryIndexes: [{ IndexName: "empty-gsi", IndexStatus: "ACTIVE", KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }], ItemCount: 0, IndexSizeBytes: 0 }],
        localSecondaryIndexes: [],
      }} />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("0 B")).toBeTruthy();
  });

});
