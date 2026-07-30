// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../test/helpers";
import React from "react";

const mockUpdateTable = vi.fn();

const updateState = vi.hoisted(() => ({
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null as Error | null,
}));

vi.mock("../hooks/useDynamoDBAdvanced", () => ({
  useDynamoDBUpdateTable: () => ({
    mutate: mockUpdateTable,
    get isPending() { return updateState.isPending; },
    get isSuccess() { return updateState.isSuccess; },
    get isError() { return updateState.isError; },
    get error() { return updateState.error; },
  }),
}));

import DynamoDBUpdateTable from "./DynamoDBUpdateTable";

beforeEach(() => {
  vi.clearAllMocks();
  updateState.isPending = false;
  updateState.isSuccess = false;
  updateState.isError = false;
  updateState.error = null;
});

const defaultDetail = {
  billingMode: "PROVISIONED",
  provisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  deletionProtectionEnabled: false,
  tableClass: "STANDARD",
  globalSecondaryIndexes: [],
};

describe("DynamoDBUpdateTable", () => {
  it("renders billing mode section", () => {
    render(<DynamoDBUpdateTable tableName="test-table" tableDetail={defaultDetail} />, { wrapper: createWrapper() });
    expect(screen.getAllByText("Billing mode").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Deletion protection")).toBeTruthy();
  });

  it("shows provisioned capacity fields when PROVISIONED", () => {
    render(<DynamoDBUpdateTable tableName="test-table" tableDetail={defaultDetail} />, { wrapper: createWrapper() });
    expect(screen.getByText("Read capacity units")).toBeTruthy();
    expect(screen.getByText("Write capacity units")).toBeTruthy();
  });

  it("hides provisioned capacity fields when PAY_PER_REQUEST", () => {
    const detail = { ...defaultDetail, billingMode: "PAY_PER_REQUEST" };
    render(<DynamoDBUpdateTable tableName="test-table" tableDetail={detail} />, { wrapper: createWrapper() });
    expect(screen.queryByText("Read capacity units")).toBeNull();
  });

  it("shows deletion protection toggle", () => {
    render(<DynamoDBUpdateTable tableName="test-table" tableDetail={defaultDetail} />, { wrapper: createWrapper() });
    expect(screen.getByText("Not protected")).toBeTruthy();
  });

  it("shows table class section", () => {
    render(<DynamoDBUpdateTable tableName="test-table" tableDetail={defaultDetail} />, { wrapper: createWrapper() });
    expect(screen.getAllByText("Table class").length).toBeGreaterThanOrEqual(1);
  });

  it("shows DynamoDB Streams section", () => {
    render(<DynamoDBUpdateTable tableName="test-table" tableDetail={defaultDetail} />, { wrapper: createWrapper() });
    expect(screen.getByText("DynamoDB Streams")).toBeTruthy();
    expect(screen.getByText("Stream disabled")).toBeTruthy();
  });

  it("shows stream view type when stream enabled", async () => {
    const detail = { ...defaultDetail, streamSpecification: { StreamEnabled: true, StreamViewType: "NEW_IMAGE" } };
    render(<DynamoDBUpdateTable tableName="test-table" tableDetail={detail} />, { wrapper: createWrapper() });
    expect(screen.getByText("Stream view type")).toBeTruthy();
  });

  it("shows SSE section with toggle", () => {
    render(<DynamoDBUpdateTable tableName="test-table" tableDetail={defaultDetail} />, { wrapper: createWrapper() });
    expect(screen.getByText("Server-side encryption")).toBeTruthy();
    expect(screen.getByText("Default encryption")).toBeTruthy();
  });

  it("shows KMS key input when SSE enabled", async () => {
    const detail = { ...defaultDetail, sseDescription: { Status: "ENABLED" } };
    render(<DynamoDBUpdateTable tableName="test-table" tableDetail={detail} />, { wrapper: createWrapper() });
    expect(screen.getByText("KMS key ARN (optional)")).toBeTruthy();
  });

  it("shows existing GSIs", () => {
    const detail = {
      ...defaultDetail,
      globalSecondaryIndexes: [
        { IndexName: "gsi1", IndexStatus: "ACTIVE", KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }] },
      ],
    };
    render(<DynamoDBUpdateTable tableName="test-table" tableDetail={detail} />, { wrapper: createWrapper() });
    expect(screen.getByText("gsi1")).toBeTruthy();
    expect(screen.getByText("Existing indexes")).toBeTruthy();
  });

  it("marks GSI for deletion and can keep it", async () => {
    const detail = {
      ...defaultDetail,
      globalSecondaryIndexes: [
        { IndexName: "gsi-del", IndexStatus: "ACTIVE", KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }] },
      ],
    };
    const user = userEvent.setup();
    render(<DynamoDBUpdateTable tableName="test-table" tableDetail={detail} />, { wrapper: createWrapper() });
    await clickButton(user, /^Delete$/);
    expect(screen.getByText("Keep")).toBeTruthy();
    await clickButton(user, /^Keep$/);
    expect(screen.getByText("Delete")).toBeTruthy();
  });

  it("adds GSI to create list", async () => {
    const user = userEvent.setup();
    render(<DynamoDBUpdateTable tableName="test-table" tableDetail={defaultDetail} />, { wrapper: createWrapper() });
    await clickButton(user, /Add GSI/);
    await waitFor(() => {
      expect(screen.getByText("Indexes to create (1)")).toBeTruthy();
    });
  });

  it("renders Apply changes button", () => {
    render(<DynamoDBUpdateTable tableName="test-table" tableDetail={defaultDetail} />, { wrapper: createWrapper() });
    // The Apply changes button is always present regardless of hasChanges
    expect(screen.getByRole("button", { name: /Apply changes/ })).toBeTruthy();
  });

  it("shows unsaved changes notice when billing mode differs", () => {
    // When tableDetail billingMode differs from default (PROVISIONED), hasChanges becomes true
    const detail = { ...defaultDetail, billingMode: "PAY_PER_REQUEST" };
    render(<DynamoDBUpdateTable tableName="test-table" tableDetail={detail} />, { wrapper: createWrapper() });
    // Since tableDetail.billingMode differs from initial state PROVISIONED,
    // buildParams includes BillingMode change, hasChanges=true, button enabled
    const applyBtn = screen.getByRole("button", { name: /Apply changes/ });
    expect(applyBtn.className).not.toContain("disabled");
    expect(screen.getByText("Unsaved changes detected")).toBeTruthy();
  });

  it("shows success alert after update", () => {
    updateState.isSuccess = true;
    render(<DynamoDBUpdateTable tableName="test-table" tableDetail={defaultDetail} />, { wrapper: createWrapper() });
    expect(screen.getByText(/updated successfully/)).toBeTruthy();
  });

  it("shows error alert after update failure", () => {
    updateState.isError = true;
    updateState.error = new Error("Update failed");
    render(<DynamoDBUpdateTable tableName="test-table" tableDetail={defaultDetail} />, { wrapper: createWrapper() });
    expect(screen.getByText("Update failed")).toBeTruthy();
  });

  it("shows error alert with fallback message", () => {
    updateState.isError = true;
    updateState.error = null as any;
    render(<DynamoDBUpdateTable tableName="test-table" tableDetail={defaultDetail} />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to update table")).toBeTruthy();
  });
});
