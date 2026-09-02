/**
 * Module-level global error handler that bridges non-React code (API client,
 * TanStack Query) with the React Toast context.
 *
 * Usage:
 *   1. Call `setGlobalErrorReporter` once from a React component that has
 *      access to the toast context (e.g. App.tsx after ToastProvider mounts).
 *   2. The rest of the app calls `reportError(error, context)` without
 *      needing React hooks.
 */

type ErrorReporter = (message: string, context?: string) => void;

let _reporter: ErrorReporter | null = null;

/** Register the toast-based error reporter. Must be called inside React. */
export function setGlobalErrorReporter(reporter: ErrorReporter) {
  _reporter = reporter;
}

/** Unregister the reporter (e.g. on unmount). */
export function clearGlobalErrorReporter() {
  _reporter = null;
}

/**
 * Report an error through the registered global handler.
 * Safe to call from anywhere — no-ops if no reporter is registered.
 */
export function reportError(error: unknown, context?: string) {
  if (!_reporter) return;
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "An unexpected error occurred";
  _reporter(message, context);
}

/**
 * Wraps an async operation so errors are both reported globally and re-thrown.
 * Useful for wrapping raw api() calls outside TanStack Query.
 */
export async function withErrorReport<T>(
  fn: () => Promise<T>,
  context?: string,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    reportError(error, context);
    throw error;
  }
}
