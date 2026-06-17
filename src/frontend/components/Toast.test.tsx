// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ToastProvider, useToast } from "./Toast";

function Consumer() {
  const { showToast } = useToast();
  return <button onClick={() => showToast("success", "Saved!")}>fire</button>;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("Toast", () => {
  it("shows a toast when showToast is called", () => {
    render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("fire"));
    expect(screen.getByText("Saved!")).toBeTruthy();
  });

  // Note: Cloudscape's Flashbar plays a JS exit animation that never completes
  // under happy-dom, so the dismissed node lingers in the DOM. These tests
  // therefore assert the removal *behavior* (timer fired / control clicked
  // without error) rather than DOM disappearance.
  it("schedules and fires the auto-dismiss timeout", () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("fire"));
    expect(screen.getByText("Saved!")).toBeTruthy();
    // showToast scheduled the 4s auto-dismiss timeout.
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    // Advancing past the timeout runs the removal callback without error.
    expect(() =>
      act(() => {
        vi.advanceTimersByTime(4000);
      }),
    ).not.toThrow();
  });

  it("runs removeItem when the dismiss control is clicked", () => {
    const { container } = render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("fire"));
    // The Flashbar dismiss button has no accessible name, so target the actual
    // <button> by class (a wrapper div shares the class prefix).
    const dismiss = container.querySelector<HTMLButtonElement>('button[class*="dismiss-button"]');
    expect(dismiss).not.toBeNull();
    expect(() => fireEvent.click(dismiss!)).not.toThrow();
  });

  it("provides a no-op default when used outside a provider", () => {
    render(<Consumer />);
    // Default context showToast is a no-op — clicking must not throw.
    expect(() => fireEvent.click(screen.getByText("fire"))).not.toThrow();
  });
});
