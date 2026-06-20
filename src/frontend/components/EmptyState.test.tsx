// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmptyState from "./EmptyState";

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="No resources" />);
    expect(screen.getByText("No resources")).toBeTruthy();
  });

  it("renders description when provided", () => {
    render(<EmptyState title="Empty" description="Create one to get started" />);
    expect(screen.getByText("Create one to get started")).toBeTruthy();
  });

  it("renders icon when provided", () => {
    render(<EmptyState title="Empty" icon="📦" />);
    expect(screen.getByText("📦")).toBeTruthy();
  });

  it("renders action button when provided", () => {
    render(<EmptyState title="Empty" actionText="Create" onAction={vi.fn()} />);
    expect(screen.getByText("Create")).toBeTruthy();
  });

  it("calls onAction when button clicked", async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(<EmptyState title="Empty" actionText="Create" onAction={onAction} />);
    await user.click(screen.getByText("Create"));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("does not render button when no actionText", () => {
    render(<EmptyState title="Empty" onAction={vi.fn()} />);
    expect(screen.queryByRole("button")).toBeFalsy();
  });

  it("does not render description when not provided", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByText("get started")).toBeFalsy();
  });
});
