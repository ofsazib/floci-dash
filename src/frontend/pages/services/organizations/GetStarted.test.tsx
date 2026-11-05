// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GetStarted from "./GetStarted";

describe("GetStarted landing", () => {
  it("renders the hero, steps and pricing, and calls onCreate", () => {
    const onCreate = vi.fn();
    render(<GetStarted onCreate={onCreate} creating={false} />);
    expect(screen.getByText("AWS Organizations")).toBeTruthy();
    expect(screen.getByText("Add accounts")).toBeTruthy();
    expect(screen.getByText("Group accounts")).toBeTruthy();
    expect(screen.getByText("Apply policies")).toBeTruthy();
    expect(screen.getByText("Enable services")).toBeTruthy();
    expect(screen.getByText("There is no cost to use AWS Organizations.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Create an organization" }));
    expect(onCreate).toHaveBeenCalled();
  });

  it("shows the create button in loading state", () => {
    render(<GetStarted onCreate={vi.fn()} creating />);
    const btn = screen.getByRole("button", { name: "Create an organization" }) as HTMLButtonElement;
    expect(btn.disabled || btn.getAttribute("aria-disabled") === "true" || btn.className.includes("loading")).toBe(true);
  });
});
