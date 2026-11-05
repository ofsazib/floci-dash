// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@cloudscape-design/components", async (orig) => ({
  ...(await orig<object>()),
  ...(await import("../../test/cloudscapeMocks")).cloudscapeMocks,
}));

import TypedConfirmModal from "./TypedConfirmModal";

function setup() {
  const onConfirm = vi.fn();
  const onDismiss = vi.fn();
  render(
    <TypedConfirmModal visible header="Delete it?" confirmValue="o-123" confirmLabel="Delete" onConfirm={onConfirm} onDismiss={onDismiss}>
      Gone forever.
    </TypedConfirmModal>,
  );
  return { onConfirm, onDismiss, user: userEvent.setup() };
}

describe("TypedConfirmModal", () => {
  it("keeps the confirm button disabled until the value is typed", async () => {
    const { onConfirm, user } = setup();
    const confirm = screen.getByRole("button", { name: "Delete" });
    expect(confirm.hasAttribute("disabled")).toBe(true);
    await user.type(screen.getByLabelText("Confirmation"), "o-12");
    expect(confirm.hasAttribute("disabled")).toBe(true);
    await user.type(screen.getByLabelText("Confirmation"), "3");
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("cancels and clears what was typed", async () => {
    const { onDismiss, user } = setup();
    await user.type(screen.getByLabelText("Confirmation"), "abc");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onDismiss).toHaveBeenCalled();
    expect((screen.getByLabelText("Confirmation") as HTMLInputElement).value).toBe("");
  });
});
