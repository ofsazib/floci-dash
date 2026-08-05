// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

const mockConfirm = vi.fn();
const mockDialog = vi.fn();

vi.mock("./ConfirmDialog", () => ({
  useConfirmDialog: () => ({ confirm: mockConfirm, dialog: mockDialog() }),
}));

import DeleteButton from "./DeleteButton";

beforeEach(() => {
  vi.clearAllMocks();
  mockDialog.mockReturnValue(<div data-testid="confirm-dialog" />);
});

describe("DeleteButton", () => {
  it("renders delete button with aria label", () => {
    render(
      <DeleteButton
        itemName="my-resource"
        resourceType="table"
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Delete my-resource")).toBeTruthy();
  });

  it("calls onDelete when confirm returns true", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    mockConfirm.mockResolvedValueOnce(true);

    render(
      <DeleteButton
        itemName="my-resource"
        resourceType="table"
        onDelete={onDelete}
      />
    );
    await user.click(screen.getByLabelText("Delete my-resource"));
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledOnce();
    });
  });

  it("does NOT call onDelete when confirm returns false", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    mockConfirm.mockResolvedValueOnce(false);

    render(
      <DeleteButton
        itemName="my-resource"
        resourceType="table"
        onDelete={onDelete}
      />
    );
    await user.click(screen.getByLabelText("Delete my-resource"));
    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
    });
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("disables button when loading", () => {
    render(
      <DeleteButton
        itemName="my-resource"
        resourceType="table"
        loading={true}
        onDelete={vi.fn()}
      />
    );
    const btn = screen.getByLabelText("Delete my-resource");
    expect(btn).toHaveProperty("disabled", true);
  });
});
