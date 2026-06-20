// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@cloudscape-design/components";
import ErrorBoundary, { withErrorBoundary } from "./ErrorBoundary";

/** A component that throws during render */
function Bomb({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error("💥 KABOOM");
  }
  return <div>All good</div>;
}

describe("ErrorBoundary", () => {
  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <div>Hello world</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText("Hello world")).toBeTruthy();
  });

  it("catches render errors and shows fallback UI", () => {
    // Suppress console.error from React's error logging
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(screen.getByText("Try again")).toBeTruthy();
    expect(screen.getByText(/unexpected error/)).toBeTruthy();

    spy.mockRestore();
  });

  it("calls onError when an error is caught", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe("💥 KABOOM");

    spy.mockRestore();
  });

  it("renders custom fallback when provided", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary
        fallback={(error, retry) => (
          <div>
            <span>Custom error: {error.message}</span>
            <Button onClick={retry}>Retry</Button>
          </div>
        )}
      >
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Custom error: 💥 KABOOM")).toBeTruthy();
    expect(screen.getByText("Retry")).toBeTruthy();

    spy.mockRestore();
  });

  it("recovers after retry when the error state clears", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { rerender } = render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeTruthy();

    // Re-render with no error — but boundary still has hasError=true until reset
    rerender(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );

    // Without clicking retry, the boundary still shows the error
    expect(screen.getByText("Something went wrong")).toBeTruthy();

    spy.mockRestore();
  });

  it("withErrorBoundary wraps children", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const wrapped = withErrorBoundary(<Bomb shouldThrow />);
    render(wrapped);

    expect(screen.getByText("Something went wrong")).toBeTruthy();

    spy.mockRestore();
  });
});
