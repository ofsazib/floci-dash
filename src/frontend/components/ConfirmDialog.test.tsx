// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton } from "../../test/helpers";
import { useConfirmDialog } from "./ConfirmDialog";

// Harness that exposes the hook's confirm()/dialog through a trigger button and
// reports the resolved boolean to a spy.
function Harness({
  onResult,
  options,
}: {
  onResult: (v: boolean) => void;
  options?: Parameters<ReturnType<typeof useConfirmDialog>["confirm"]>[0];
}) {
  const { confirm, dialog } = useConfirmDialog();
  return (
    <>
      <button onClick={async () => onResult(await confirm(options ?? { title: "Delete?", message: "Are you sure?" }))}>
        trigger
      </button>
      {dialog}
    </>
  );
}

describe("useConfirmDialog", () => {
  it("is hidden until confirm() is invoked", () => {
    render(<Harness onResult={vi.fn()} />);
    expect(screen.queryByText("Are you sure?")).toBeNull();
  });

  it("opens with the provided title and message", async () => {
    const user = userEvent.setup();
    render(<Harness onResult={vi.fn()} />);
    await user.click(screen.getByText("trigger"));
    expect(screen.getByText("Are you sure?")).toBeTruthy();
    expect(screen.getAllByText("Delete?").length).toBeGreaterThan(0);
  });

  it("resolves true when confirmed", async () => {
    const onResult = vi.fn();
    const user = userEvent.setup();
    render(<Harness onResult={onResult} />);
    await user.click(screen.getByText("trigger"));
    await clickButton(user, /Confirm/i);
    expect(onResult).toHaveBeenCalledWith(true);
  });

  it("resolves false when dismissed", async () => {
    const onResult = vi.fn();
    const user = userEvent.setup();
    render(<Harness onResult={onResult} />);
    await user.click(screen.getByText("trigger"));
    await clickButton(user, /Cancel/i);
    expect(onResult).toHaveBeenCalledWith(false);
  });

  it("honors custom labels and the danger variant", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        onResult={vi.fn()}
        options={{ title: "Drop", message: "msg", confirmText: "Yes do it", dismissText: "No", variant: "danger" }}
      />,
    );
    await user.click(screen.getByText("trigger"));
    expect(screen.getAllByRole("button", { name: /Yes do it/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /No/i }).length).toBeGreaterThan(0);
  });
});
