// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.hoisted(() => vi.fn());
vi.mock("../../lib/client", () => ({ api: (...args: any[]) => mockApi(...args) }));

import { AppAutoScalingDashboard } from "./AppAutoScalingDashboard";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

beforeEach(() => {
  mockApi.mockReset();
  mockApi.mockImplementation((path: string, init?: any) => {
    if (path.includes("/scalable-targets?") && (!init || init.method === undefined || init.method === "GET"))
      return Promise.resolve({ scalableTargets: [{ resourceId: "c/s", scalableDimension: "d", minCapacity: 1, maxCapacity: 4 }], total: 1 });
    if (path.includes("/scalable-policies?"))
      return Promise.resolve({ scalingPolicies: [{ name: "pol-1", resourceId: "c/s", policyType: "TargetTrackingScaling" }], total: 1 });
    return Promise.resolve({});
  });
});

describe("AppAutoScalingDashboard", () => {
  it("renders targets and policies", async () => {
    const user = userEvent.setup();
    render(<AppAutoScalingDashboard />, { wrapper: createWrapper() });
    expect(screen.getAllByText(/Scalable targets/i).length).toBeGreaterThan(0);
    expect(await screen.findByText("c/s")).toBeTruthy();
    // switch to policies tab
    await user.click(screen.getByRole("tab", { name: /Scaling Policies/i }));
    expect(await screen.findByText("pol-1")).toBeTruthy();
  });

  it("registers a scalable target via modal", async () => {
    const user = userEvent.setup();
    render(<AppAutoScalingDashboard />, { wrapper: createWrapper() });
    const btn = await screen.findByRole("button", { name: /Register scalable target/i });
    await user.click(btn);
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.type(within(dialog).getByPlaceholderText("cluster/service"), "c/s");
    await user.click(within(dialog).getByRole("button", { name: /Register$/i }));
    await waitFor(() => {
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/applicationautoscaling/scalable-targets",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("shows namespace select", async () => {
    render(<AppAutoScalingDashboard />, { wrapper: createWrapper() });
    expect(await screen.findByText("Service namespace")).toBeTruthy();
  });
});
