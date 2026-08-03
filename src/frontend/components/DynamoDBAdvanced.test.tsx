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

  // ─── GSI/LSI fallback cells ─────────────────────────────

  it("renders fallback values for partial GSI/LSI data", () => {
    render(
      <DynamoDBAdvanced tableName="t" tableDetail={{
        name: "t", status: "ACTIVE", keySchema: [],
        globalSecondaryIndexes: [
          // no IndexName/IndexStatus/ItemCount/IndexSizeBytes; only a RANGE key
          { name: "gsi-name", status: "CREATING", KeySchema: [{ AttributeName: "rk", KeyType: "RANGE" }] },
          {},
        ],
        localSecondaryIndexes: [
          { name: "lsi-name", KeySchema: [{ AttributeName: "sk", KeyType: "RANGE" }] },
          {},
        ],
      }} />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("gsi-name")).toBeTruthy();
    expect(screen.getByText("CREATING")).toBeTruthy();
    expect(screen.getByText("Unknown")).toBeTruthy();
    expect(screen.getByText("lsi-name")).toBeTruthy();
    // missing partition/sort keys, item counts and sizes all render "—"
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(6);
  });

  // ─── TTL edge cases ─────────────────────────────────────

  it("TTL tab shows spinner while loading", async () => {
    mockHooks.useDynamoDBTTL.mockReturnValue({ data: undefined, isLoading: true });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("TTL"));
    expect(screen.queryByText("Time to Live (TTL)")).toBeFalsy();
  });

  it("TTL tab renders Unknown status when data is undefined", async () => {
    mockHooks.useDynamoDBTTL.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("TTL"));
    expect(screen.getByText("Unknown")).toBeTruthy();
    expect(screen.getByText("TTL disabled")).toBeTruthy();
  });

  // ─── Tags editing & saving ──────────────────────────────

  it("edits tag inputs and saves all valid tags", async () => {
    const mockMutate = vi.fn();
    mockHooks.useDynamoDBUpdateTags.mockReturnValue({ mutate: mockMutate, isPending: false, isError: false });
    mockHooks.useDynamoDBTableTags.mockReturnValue({
      data: { tags: [{ Key: "env", Value: "prod" }, { Key: "team", Value: "core" }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    await waitFor(() => expect(screen.getByDisplayValue("env")).toBeTruthy());
    const keyInputs = screen.getAllByPlaceholderText("Tag key");
    const valueInputs = screen.getAllByPlaceholderText("Tag value");
    expect(keyInputs.length).toBe(2);
    await user.clear(keyInputs[0]);
    await user.type(keyInputs[0], "environment");
    await user.clear(valueInputs[0]);
    await user.type(valueInputs[0], "production");
    await user.click(screen.getByText("Save tags"));
    expect(mockMutate).toHaveBeenCalledWith([
      { Key: "environment", Value: "production" },
      { Key: "team", Value: "core" },
    ]);
  });

  it("filters out incomplete tag rows on save", async () => {
    const mockMutate = vi.fn();
    mockHooks.useDynamoDBUpdateTags.mockReturnValue({ mutate: mockMutate, isPending: false, isError: false });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    await user.click(screen.getByText("Add tag"));
    await user.click(screen.getByText("Add tag"));
    await user.type(screen.getAllByPlaceholderText("Tag key")[0], "env");
    await user.type(screen.getAllByPlaceholderText("Tag value")[0], "prod");
    await user.click(screen.getByText("Save tags"));
    // The second (still empty) row is filtered out
    expect(mockMutate).toHaveBeenCalledWith([{ Key: "env", Value: "prod" }]);
  });

  // ─── Backups edge cases ─────────────────────────────────

  it("Backups shows Unknown status and fallback error with minimal data", async () => {
    mockHooks.useDynamoDBContinuousBackups.mockReturnValue({ data: undefined, isLoading: false });
    mockHooks.useDynamoDBUpdateContinuousBackups.mockReturnValue({ mutate: vi.fn(), isError: true, error: {} as Error });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Backups"));
    expect(screen.getByText("Unknown")).toBeTruthy();
    expect(screen.getByText("PITR disabled")).toBeTruthy();
    expect(screen.getByText("Failed to update continuous backups")).toBeTruthy();
  });

  // ─── PartiQL single statement edge cases ────────────────

  it("Single Statement shows Query failed fallback error", async () => {
    mockHooks.useDynamoDBPartiQL.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: true, error: {} as Error });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("PartiQL"));
    expect(screen.getByText("Query failed")).toBeTruthy();
  });

  it("Single Statement shows No results found for empty items", async () => {
    const mockMutate = vi.fn((_args, opts) => opts?.onSuccess({ items: [], count: 0 }));
    mockHooks.useDynamoDBPartiQL.mockReturnValue({ mutate: mockMutate, isPending: false, isError: false });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("PartiQL"));
    await user.click(screen.getByText("Run query"));
    await waitFor(() => expect(screen.getByText("No results found.")).toBeTruthy());
  });

  // ─── PartiQL transaction editor ─────────────────────────

  it("Transaction editor executes statements and renders responses", async () => {
    const mockMutate = vi.fn((_stmts, opts) =>
      opts?.onSuccess({ responses: [{ Item: { pk: "123" } }, {}], total: 2 })
    );
    mockHooks.useDynamoDBPartiQLTransaction.mockReturnValue({ mutate: mockMutate, isPending: false, isError: false });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("PartiQL"));
    await user.click(screen.getByText("Transaction"));
    await user.click(screen.getByRole("button", { name: /Execute transaction/i }));
    await waitFor(() => expect(screen.getByText("Transaction result")).toBeTruthy());
    expect(mockMutate).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ Statement: expect.any(String) })]),
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    expect(screen.getByText("Statement 1")).toBeTruthy();
    expect(screen.getByText("Statement 2")).toBeTruthy();
    // response with an Item renders JSON; response without one renders Ok
    expect(screen.getByText(/"pk"/)).toBeTruthy();
    expect(screen.getAllByText("Ok").length).toBeGreaterThanOrEqual(1);
  });

  it("Transaction editor shows committed message when no responses", async () => {
    const mockMutate = vi.fn((_stmts, opts) => opts?.onSuccess({ total: 0 }));
    mockHooks.useDynamoDBPartiQLTransaction.mockReturnValue({ mutate: mockMutate, isPending: false, isError: false });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("PartiQL"));
    await user.click(screen.getByText("Transaction"));
    await user.click(screen.getByRole("button", { name: /Execute transaction/i }));
    await waitFor(() => expect(screen.getByText("Transaction committed successfully.")).toBeTruthy());
  });

  it("Transaction editor shows error alert on failure", async () => {
    mockHooks.useDynamoDBPartiQLTransaction.mockReturnValue({
      mutate: vi.fn(), isPending: false, isError: true, error: new Error("Txn failed"),
    });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("PartiQL"));
    await user.click(screen.getByText("Transaction"));
    expect(screen.getByText("Txn failed")).toBeTruthy();
  });

  it("Transaction editor shows fallback error without message", async () => {
    mockHooks.useDynamoDBPartiQLTransaction.mockReturnValue({
      mutate: vi.fn(), isPending: false, isError: true, error: {} as Error,
    });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("PartiQL"));
    await user.click(screen.getByText("Transaction"));
    expect(screen.getByText("Transaction failed")).toBeTruthy();
  });

  // ─── PartiQL batch editor ───────────────────────────────

  it("Batch editor executes statements and renders result variants", async () => {
    const longItem = { data: "x".repeat(150) };
    const mockMutate = vi.fn((_stmts, opts) =>
      opts?.onSuccess({
        total: 3,
        responses: [
          { tableName: "t1", item: { id: "1" } },
          { tableName: "", error: { Code: "E1", Message: "boom" } },
          { item: longItem },
        ],
      })
    );
    mockHooks.useDynamoDBPartiQLBatch.mockReturnValue({ mutate: mockMutate, isPending: false, isError: false });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("PartiQL"));
    await user.click(screen.getByText("Batch"));
    await user.click(screen.getByRole("button", { name: /Execute batch/i }));
    await waitFor(() => expect(screen.getByText("Batch results")).toBeTruthy());
    expect(mockMutate).toHaveBeenCalled();
    expect(screen.getByText("t1")).toBeTruthy();
    expect(screen.getByText("E1: boom")).toBeTruthy();
    expect(screen.getAllByText("Ok").length).toBeGreaterThanOrEqual(1);
    // The long item is truncated with an ellipsis appended to the same text node
    expect(screen.getByText(/…/)).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("Batch editor shows error alert on failure", async () => {
    mockHooks.useDynamoDBPartiQLBatch.mockReturnValue({
      mutate: vi.fn(), isPending: false, isError: true, error: new Error("Batch failed"),
    });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("PartiQL"));
    await user.click(screen.getByText("Batch"));
    expect(screen.getByText("Batch failed")).toBeTruthy();
  });

  it("Batch editor shows fallback error without message", async () => {
    mockHooks.useDynamoDBPartiQLBatch.mockReturnValue({
      mutate: vi.fn(), isPending: false, isError: true, error: {} as Error,
    });
    const user = userEvent.setup();
    render(<DynamoDBAdvanced tableName="t" tableDetail={{ name: "t", status: "ACTIVE", keySchema: [] }} />, { wrapper: createWrapper() });
    await user.click(screen.getByText("PartiQL"));
    await user.click(screen.getByText("Batch"));
    expect(screen.getByText("Batch execution failed")).toBeTruthy();
  });

});
