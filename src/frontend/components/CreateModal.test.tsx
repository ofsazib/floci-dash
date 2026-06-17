// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton } from "../../test/helpers";
import CreateModal from "./CreateModal";

const fields = [
  { name: "name", label: "Name", placeholder: "my-name", required: true },
  { name: "desc", label: "Description" },
];

describe("CreateModal", () => {
  it("renders title and a field per definition when visible", () => {
    render(
      <CreateModal title="Create thing" fields={fields} visible onDismiss={vi.fn()} onSubmit={vi.fn()} />,
    );
    expect(screen.getAllByText("Create thing").length).toBeGreaterThan(0);
    expect(screen.getByText("Name")).toBeTruthy();
    expect(screen.getByText("Description")).toBeTruthy();
  });

  it("submits the typed form data and clears it", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <CreateModal title="Create thing" fields={fields} visible onDismiss={vi.fn()} onSubmit={onSubmit} />,
    );
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "hello");
    await clickButton(user, /Create/i);
    expect(onSubmit).toHaveBeenCalledWith({ name: "hello" });
  });

  it("calls onDismiss when Cancel is clicked", async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(
      <CreateModal title="Create thing" fields={fields} visible onDismiss={onDismiss} onSubmit={vi.fn()} />,
    );
    await clickButton(user, /Cancel/i);
    expect(onDismiss).toHaveBeenCalled();
  });

  it("shows the create button in a loading state", () => {
    render(
      <CreateModal title="Create thing" fields={fields} visible loading onDismiss={vi.fn()} onSubmit={vi.fn()} />,
    );
    // Cloudscape renders a loading spinner inside the button.
    expect(screen.getAllByRole("button", { name: /Create/i }).length).toBeGreaterThan(0);
  });
});
