// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@cloudscape-design/components", async (orig) => ({
  ...(await orig<object>()),
  ...(await import("../../test/cloudscapeMocks")).cloudscapeMocks,
}));

import ConsoleWidget from "./ConsoleWidget";

describe("ConsoleWidget", () => {
  it("renders the title, counter, content and footer link", () => {
    const onFollow = vi.fn();
    render(
      <ConsoleWidget title="Health" counter="(2)" footer={{ text: "Go to Health", onFollow }}>
        body
      </ConsoleWidget>,
    );
    expect(screen.getByRole("heading", { name: /Health/ })).toBeTruthy();
    expect(screen.getByText("(2)")).toBeTruthy();
    expect(screen.getByText("body")).toBeTruthy();
    fireEvent.click(screen.getByText("Go to Health"));
    expect(onFollow).toHaveBeenCalled();
  });

  it("shows the ⋮ menu and reports the clicked item", () => {
    const onMenuItemClick = vi.fn();
    render(
      <ConsoleWidget title="W" menuItems={[{ id: "remove", text: "Remove widget" }]} onMenuItemClick={onMenuItemClick}>
        x
      </ConsoleWidget>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove widget" }));
    expect(onMenuItemClick).toHaveBeenCalledWith("remove");
  });

  it("tolerates a menu without a click handler", () => {
    render(
      <ConsoleWidget title="W" menuItems={[{ id: "a", text: "A" }]}>
        x
      </ConsoleWidget>,
    );
    fireEvent.click(screen.getByRole("button", { name: "A" }));
    expect(screen.getByText("x")).toBeTruthy();
  });
});
