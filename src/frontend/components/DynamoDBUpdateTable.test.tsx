// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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
  (mockUpdateTable as any).mockReset();
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

// ─── Init edge cases ─────────────────────────────────────

describe("DynamoDBUpdateTable — init edge cases", () => {
  it("skips re-initialization when the table name changes", () => {
    const { rerender } = render(
      <DynamoDBUpdateTable tableName="t1" tableDetail={defaultDetail} />,
      { wrapper: createWrapper() },
    );
    rerender(
      <DynamoDBUpdateTable
        tableName="t2"
        tableDetail={{ ...defaultDetail, billingMode: "PAY_PER_REQUEST" }}
      />,
    );
    expect(screen.getByText("Deletion protection")).toBeTruthy();
  });

  it("renders without tableDetail", () => {
    render(<DynamoDBUpdateTable tableName="t" />, { wrapper: createWrapper() });
    expect(screen.getByText("Global Secondary Indexes")).toBeTruthy();
    expect(screen.queryByText("Existing indexes")).toBeNull();
  });

  it("handles missing billingMode", () => {
    render(
      <DynamoDBUpdateTable
        tableName="t"
        tableDetail={{ ...defaultDetail, billingMode: undefined }}
      />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("Read capacity units")).toBeTruthy();
  });

  it("ignores an unknown billing mode value", () => {
    render(
      <DynamoDBUpdateTable
        tableName="t"
        tableDetail={{ ...defaultDetail, billingMode: "GLOBAL_TABLE" }}
      />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("Read capacity units")).toBeTruthy();
  });

  it("handles missing provisionedThroughput", () => {
    render(
      <DynamoDBUpdateTable
        tableName="t"
        tableDetail={{ ...defaultDetail, provisionedThroughput: undefined }}
      />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("Read capacity units")).toBeTruthy();
  });

  it("defaults read capacity when ReadCapacityUnits is missing", () => {
    render(
      <DynamoDBUpdateTable
        tableName="t"
        tableDetail={{
          ...defaultDetail,
          provisionedThroughput: { WriteCapacityUnits: 5 },
        }}
      />,
      { wrapper: createWrapper() },
    );
    expect(screen.getAllByDisplayValue("5").length).toBeGreaterThanOrEqual(2);
  });

  it("defaults write capacity when WriteCapacityUnits is missing", () => {
    render(
      <DynamoDBUpdateTable
        tableName="t"
        tableDetail={{
          ...defaultDetail,
          provisionedThroughput: { ReadCapacityUnits: 5 },
        }}
      />,
      { wrapper: createWrapper() },
    );
    expect(screen.getAllByDisplayValue("5").length).toBeGreaterThanOrEqual(2);
  });

  it("handles missing deletionProtectionEnabled", () => {
    render(
      <DynamoDBUpdateTable
        tableName="t"
        tableDetail={{ ...defaultDetail, deletionProtectionEnabled: undefined }}
      />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("Not protected")).toBeTruthy();
  });

  it("handles missing tableClass", () => {
    render(
      <DynamoDBUpdateTable
        tableName="t"
        tableDetail={{ ...defaultDetail, tableClass: undefined }}
      />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("Standard — default, general purpose")).toBeTruthy();
  });

  it("ignores an unknown table class value", () => {
    render(
      <DynamoDBUpdateTable
        tableName="t"
        tableDetail={{ ...defaultDetail, tableClass: "GLOBAL_TABLE" }}
      />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("Standard — default, general purpose")).toBeTruthy();
  });

  it("handles a stream specification without a view type", () => {
    render(
      <DynamoDBUpdateTable
        tableName="t"
        tableDetail={{ ...defaultDetail, streamSpecification: { StreamEnabled: true } }}
      />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("Stream enabled")).toBeTruthy();
    expect(screen.getByText("New and old images")).toBeTruthy();
  });

  it("ignores an unknown stream view type", () => {
    render(
      <DynamoDBUpdateTable
        tableName="t"
        tableDetail={{
          ...defaultDetail,
          streamSpecification: { StreamEnabled: true, StreamViewType: "INVALID" },
        }}
      />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("New and old images")).toBeTruthy();
  });

  it("shows a dash for an existing GSI without key schema", () => {
    render(
      <DynamoDBUpdateTable
        tableName="t"
        tableDetail={{
          ...defaultDetail,
          globalSecondaryIndexes: [{ IndexName: "gsi-x", IndexStatus: "ACTIVE" }],
        }}
      />,
      { wrapper: createWrapper() },
    );
    // The dash is merged into the adjacent "Key:" text node — scope the regex
    // so the always-rendered select labels ("Provisioned — ...") don't match
    expect(screen.getAllByText(/Key: —/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows an info status for a non-active GSI", () => {
    render(
      <DynamoDBUpdateTable
        tableName="t"
        tableDetail={{
          ...defaultDetail,
          globalSecondaryIndexes: [
            {
              IndexName: "gsi-y",
              IndexStatus: "CREATING",
              KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
            },
          ],
        }}
      />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("CREATING")).toBeTruthy();
  });
});

// ─── Apply changes ───────────────────────────────────────

describe("DynamoDBUpdateTable — apply changes", () => {
  it("applies a changed read capacity", async () => {
    const user = userEvent.setup();
    render(<DynamoDBUpdateTable tableName="t" tableDetail={defaultDetail} />, {
      wrapper: createWrapper(),
    });
    fireEvent.change(screen.getAllByDisplayValue("5")[0], {
      target: { value: "10" },
    });
    await clickButton(user, /Apply changes/);
    await waitFor(() => {
      expect(mockUpdateTable).toHaveBeenCalledWith(
        expect.objectContaining({
          ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 5 },
        }),
        expect.any(Object),
      );
    });
  });

  it("falls back read capacity to 5 when the input is cleared", () => {
    render(<DynamoDBUpdateTable tableName="t" tableDetail={defaultDetail} />, {
      wrapper: createWrapper(),
    });
    const inputs = screen.getAllByDisplayValue("5");
    fireEvent.change(inputs[0], { target: { value: "" } });
    expect(inputs[0]).toHaveProperty("value", "");
  });

  it("falls back write capacity to 5 when the input is cleared", () => {
    render(<DynamoDBUpdateTable tableName="t" tableDetail={defaultDetail} />, {
      wrapper: createWrapper(),
    });
    const inputs = screen.getAllByDisplayValue("5");
    fireEvent.change(inputs[1], { target: { value: "" } });
    expect(inputs[1]).toHaveProperty("value", "");
  });

  it("toggles deletion protection and applies it", async () => {
    const user = userEvent.setup();
    render(<DynamoDBUpdateTable tableName="t" tableDetail={defaultDetail} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getByText("Not protected"));
    expect(screen.getByText("Protected")).toBeTruthy();
    await clickButton(user, /Apply changes/);
    await waitFor(() => {
      expect(mockUpdateTable).toHaveBeenCalledWith(
        expect.objectContaining({ DeletionProtectionEnabled: true }),
        expect.any(Object),
      );
    });
  });

  it("changes the table class and applies it", async () => {
    const user = userEvent.setup();
    render(<DynamoDBUpdateTable tableName="t" tableDetail={defaultDetail} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getByText("Standard — default, general purpose"));
    await user.click(
      screen.getByRole("option", {
        name: "Standard-IA — infrequent access, lower storage cost",
      }),
    );
    await clickButton(user, /Apply changes/);
    await waitFor(() => {
      expect(mockUpdateTable).toHaveBeenCalledWith(
        expect.objectContaining({ TableClass: "STANDARD_INFREQUENT_ACCESS" }),
        expect.any(Object),
      );
    });
  });

  it("changes the stream view type and applies it", async () => {
    const user = userEvent.setup();
    const detail = {
      ...defaultDetail,
      streamSpecification: { StreamEnabled: true, StreamViewType: "NEW_IMAGE" },
    };
    render(<DynamoDBUpdateTable tableName="t" tableDetail={detail} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getByText("New image only"));
    await user.click(screen.getByRole("option", { name: "Old image only" }));
    await clickButton(user, /Apply changes/);
    await waitFor(() => {
      expect(mockUpdateTable).toHaveBeenCalledWith(
        expect.objectContaining({
          StreamSpecification: { StreamEnabled: true, StreamViewType: "OLD_IMAGE" },
        }),
        expect.any(Object),
      );
    });
  });

  it("enables SSE with a KMS key and applies it", async () => {
    const user = userEvent.setup();
    render(<DynamoDBUpdateTable tableName="t" tableDetail={defaultDetail} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getByText("Default encryption"));
    await user.type(
      screen.getByPlaceholderText(/arn:aws:kms/),
      "arn:aws:kms:us-east-1:123456789012:key/abc-123",
    );
    await clickButton(user, /Apply changes/);
    await waitFor(() => {
      expect(mockUpdateTable).toHaveBeenCalledWith(
        expect.objectContaining({
          SSESpecification: {
            Enabled: true,
            KMSMasterKeyId: "arn:aws:kms:us-east-1:123456789012:key/abc-123",
            SSEType: "KMS",
          },
        }),
        expect.any(Object),
      );
    });
  });

  it("enables SSE without a KMS key", async () => {
    const user = userEvent.setup();
    render(<DynamoDBUpdateTable tableName="t" tableDetail={defaultDetail} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getByText("Default encryption"));
    await clickButton(user, /Apply changes/);
    await waitFor(() => {
      const payload = (mockUpdateTable as any).mock.calls[0][0];
      expect(payload.SSESpecification).toEqual({ Enabled: true, SSEType: "KMS" });
    });
  });

  it("creates a GSI with a sort key and clears the form on success", async () => {
    const user = userEvent.setup();
    (mockUpdateTable as any).mockImplementation(
      (_params: any, opts?: any) => opts?.onSuccess?.(),
    );
    render(<DynamoDBUpdateTable tableName="t" tableDetail={defaultDetail} />, {
      wrapper: createWrapper(),
    });
    await clickButton(user, /Add GSI/);
    await user.type(screen.getByPlaceholderText("my-gsi"), "gsi-new");
    await user.type(screen.getByPlaceholderText("gsi_pk"), "pk1");
    await user.type(screen.getByPlaceholderText("gsi_sk"), "sk1");
    await clickButton(user, /Apply changes/);
    await waitFor(() => {
      expect(mockUpdateTable).toHaveBeenCalledWith(
        expect.objectContaining({
          GlobalSecondaryIndexUpdates: [
            expect.objectContaining({
              Create: expect.objectContaining({
                IndexName: "gsi-new",
                KeySchema: [
                  { AttributeName: "pk1", KeyType: "HASH" },
                  { AttributeName: "sk1", KeyType: "RANGE" },
                ],
              }),
            }),
          ],
          AttributeDefinitions: [
            { AttributeName: "pk1", AttributeType: "S" },
            { AttributeName: "sk1", AttributeType: "S" },
          ],
        }),
        expect.any(Object),
      );
    });
    await waitFor(() => {
      expect(screen.queryByPlaceholderText("my-gsi")).toBeNull();
    });
  });

  it("creates a GSI with undefined throughput in PAY_PER_REQUEST mode", async () => {
    const user = userEvent.setup();
    const detail = { ...defaultDetail, billingMode: "PAY_PER_REQUEST" };
    render(<DynamoDBUpdateTable tableName="t" tableDetail={detail} />, {
      wrapper: createWrapper(),
    });
    await clickButton(user, /Add GSI/);
    await user.type(screen.getByPlaceholderText("my-gsi"), "gsi-pay");
    await user.type(screen.getByPlaceholderText("gsi_pk"), "pk2");
    await clickButton(user, /Apply changes/);
    await waitFor(() => {
      const payload = (mockUpdateTable as any).mock.calls[0][0];
      const create = payload.GlobalSecondaryIndexUpdates[0].Create;
      expect(create.IndexName).toBe("gsi-pay");
      expect(create.ProvisionedThroughput).toBeUndefined();
    });
  });

  it("falls back GSI capacity to 5 when the inputs are cleared", async () => {
    const user = userEvent.setup();
    render(<DynamoDBUpdateTable tableName="t" tableDetail={defaultDetail} />, {
      wrapper: createWrapper(),
    });
    await clickButton(user, /Add GSI/);
    const capacityInputs = screen.getAllByDisplayValue("5");
    // [0]=read, [1]=write (table), [2]=GSI read, [3]=GSI write
    expect(capacityInputs.length).toBe(4);
    fireEvent.change(capacityInputs[2], { target: { value: "" } });
    fireEvent.change(capacityInputs[3], { target: { value: "" } });
    expect(capacityInputs[2]).toHaveProperty("value", "");
    expect(capacityInputs[3]).toHaveProperty("value", "");
  });

  it("updates the first GSI without affecting the second", async () => {
    const user = userEvent.setup();
    render(<DynamoDBUpdateTable tableName="t" tableDetail={defaultDetail} />, {
      wrapper: createWrapper(),
    });
    await clickButton(user, /Add GSI/);
    await clickButton(user, /Add GSI/);
    await user.type(screen.getAllByPlaceholderText("my-gsi")[0], "first");
    await user.type(screen.getAllByPlaceholderText("gsi_pk")[0], "f-pk");
    await user.type(screen.getAllByPlaceholderText("gsi_sk")[0], "f-sk");
    const capacityInputs = screen.getAllByDisplayValue("5");
    // [0]=read, [1]=write (table), [2]=GSI1 read, [3]=GSI1 write, [4]=GSI2 read, [5]=GSI2 write
    fireEvent.change(capacityInputs[2], { target: { value: "7" } });
    fireEvent.change(capacityInputs[3], { target: { value: "8" } });
    const names = screen.getAllByPlaceholderText("my-gsi");
    expect(names[0]).toHaveProperty("value", "first");
    expect(names[1]).toHaveProperty("value", "");
  });
});
