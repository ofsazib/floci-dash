import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { vi } from "vitest";

// ─── Frontend helpers ────────────────────────────────────

/**
 * Creates a QueryClientProvider wrapper for rendering React components
 * that depend on TanStack Query in tests.
 *
 * @example
 * render(<MyPage />, { wrapper: createWrapper() });
 */
export function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

/**
 * Click a Cloudscape button by its accessible name.
 *
 * Cloudscape `<Button>` components render text in nested `<span>`s, causing
 * `getByText` / `getByRole` to encounter multiple matches. This helper
 * always uses `getAllByRole("button", { name })` and lets you pick which
 * instance to click.
 *
 * @example
 * await clickButton(user, /Create/i);
 * @example
 * await clickButton(user, /Create/i, { last: true });
 */
export async function clickButton(
  user: UserEvent,
  name: RegExp | string,
  options?: { index?: number; last?: boolean },
) {
  const buttons = screen.getAllByRole("button", { name });
  const idx =
    options?.last === true
      ? buttons.length - 1
      : options?.index ?? 0;
  await user.click(buttons[idx]);
  return buttons[idx];
}

/**
 * Creates a complete set of common frontend mocks for hooks/components
 * that most page tests need. Returns an object you can spread into vi.mock().
 *
 * @example
 * vi.mock("../components/Toast", () => createFrontendMocks().Toast);
 */
export function createFrontendMocks() {
  return {
    Toast: {
      useToast: () => ({ showToast: vi.fn() }),
      ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    },
    ConfirmDialog: {
      useConfirmDialog: () => ({ confirm: vi.fn(() => Promise.resolve(true)), dialog: null }),
    },
    Router: {
      useNavigate: () => vi.fn(),
      useSearchParams: () => [new URLSearchParams(), vi.fn()],
    },
    System: {
      useHealth: () => ({ data: { services: {} } }),
    },
  };
}

// ─── Backend helpers ─────────────────────────────────────

/**
 * Creates an AWS SDK command mock factory for use with vi.mock().
 * Each command becomes a constructor that captures its args.
 *
 * @example
 * const cmd = createCommandMock();
 * vi.mock("@aws-sdk/client-s3", () => ({
 *   S3Client: mockClient,
 *   ListBucketsCommand: cmd("ListBucketsCommand"),
 * }));
 */
export function createCommandMock() {
  return function (name: string) {
    return function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    };
  };
}

/**
 * Creates route test helpers for a Hono router.
 * Returns get/post/put/patch/del functions that invoke the router directly.
 *
 * @example
 * const { get, post, del } = createRouteHelpers(router);
 * const res = await get("/buckets");
 */
export function createRouteHelpers(router: any) {
  async function request(path: string, init: any) {
    return router.request(path, init);
  }

  return {
    get: (path: string) => request(path, { method: "GET" }),
    post: (path: string, body?: any) =>
      request(path, {
        method: "POST",
        body: body != null ? JSON.stringify(body) : undefined,
        headers: body != null ? { "content-type": "application/json" } : undefined,
      }),
    put: (path: string, body?: any) =>
      request(path, {
        method: "PUT",
        body: body != null ? JSON.stringify(body) : undefined,
        headers: body != null ? { "content-type": "application/json" } : undefined,
      }),
    patch: (path: string, body?: any) =>
      request(path, {
        method: "PATCH",
        body: body != null ? JSON.stringify(body) : undefined,
        headers: body != null ? { "content-type": "application/json" } : undefined,
      }),
    del: (path: string) => request(path, { method: "DELETE" }),
  };
}

/**
 * Standard mock AWS config used across all backend route tests.
 */
export const mockAwsConfig = {
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
};
