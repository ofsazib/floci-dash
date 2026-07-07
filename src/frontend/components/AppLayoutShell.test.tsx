// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/", hash: "" }),
}));

vi.mock("../hooks/useSystem", () => ({
  useHealth: vi.fn(() => ({
    data: {
      services: {
        s3: "running",
        dynamodb: "running",
        ec2: "running",
        lambda: "running",
        sqs: "running",
        sns: "running",
        kms: "running",
      },
      stats: { running: 7, total: 7 },
    },
  })),
  useActiveServices: vi.fn(() => ({
    data: { activeServices: ["s3", "dynamodb"] },
  })),
}));

vi.mock("../stores/settings", () => ({
  useSettings: vi.fn(() => ({
    darkMode: false,
    toggleDarkMode: vi.fn(),
    refreshInterval: 5000,
    setRefreshInterval: vi.fn(),
  })),
}));

import AppLayoutShell from "./AppLayoutShell";
import { useHealth, useActiveServices } from "../hooks/useSystem";
import { useSettings } from "../stores/settings";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  (useHealth as any).mockReturnValue({
    data: {
      services: {
        s3: "running",
        dynamodb: "running",
        ec2: "running",
        lambda: "running",
        sqs: "running",
        sns: "running",
        kms: "running",
      },
      stats: { running: 7, total: 7 },
    },
  });
  (useActiveServices as any).mockReturnValue({
    data: { activeServices: ["s3", "dynamodb"] },
  });
  (useSettings as any).mockReturnValue({
    darkMode: false,
    toggleDarkMode: vi.fn(),
    refreshInterval: 5000,
    setRefreshInterval: vi.fn(),
  });
  document.body.classList.remove("awsui-dark-mode");
  document.documentElement.classList.remove("awsui-dark-mode");
});

describe("AppLayoutShell — rendering", () => {
  it("renders header with Floci Dash title", () => {
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.getAllByText("Floci Dash").length).toBeGreaterThan(0);
  });

  it("renders children content", () => {
    render(
      <AppLayoutShell>
        <div data-testid="child">Hello World</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.getByTestId("child")).toBeTruthy();
    expect(screen.getByText("Hello World")).toBeTruthy();
  });

  it("renders Dashboard link in navigation", () => {
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("Dashboard")).toBeTruthy();
  });

  it("renders Settings link in navigation", () => {
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("Settings")).toBeTruthy();
  });
});

describe("AppLayoutShell — health status", () => {
  it("shows running/total service count when healthy", () => {
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText(/7 \/ 7 services running/)).toBeTruthy();
  });

  it("shows 0/0 when no health data", () => {
    (useHealth as any).mockReturnValue({ data: undefined });
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText(/0 \/ 0 services running/)).toBeTruthy();
  });

  it("shows partial count when not all healthy", () => {
    (useHealth as any).mockReturnValue({
      data: {
        services: { s3: "running", dynamodb: "stopped" },
        stats: { running: 1, total: 2 },
      },
    });
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText(/1 \/ 2 services running/)).toBeTruthy();
  });
});

describe("AppLayoutShell — navigation items", () => {
  it("renders implemented services that Floci reports", () => {
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("S3")).toBeTruthy();
    expect(screen.getByText("DynamoDB")).toBeTruthy();
    expect(screen.getByText("EC2")).toBeTruthy();
    expect(screen.getByText("Lambda")).toBeTruthy();
  });

  it("renders Resources section header when implemented services available", () => {
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("Resources")).toBeTruthy();
  });

  it("renders global search input with placeholder", () => {
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.getAllByPlaceholderText(/^Search services/).length).toBeGreaterThan(0);
  });

  it("does not render Resources section when no health data", () => {
    (useHealth as any).mockReturnValue({ data: undefined });
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.queryByText("Resources")).toBeNull();
  });
});

describe("AppLayoutShell — search", () => {
  it("renders search input", () => {
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.getByPlaceholderText(/^Find services/)).toBeTruthy();
  });

  it("filters implemented services when searching", async () => {
    const user = userEvent.setup();
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    const input = screen.getByPlaceholderText(/^Find services/);
    await user.type(input, "S3");
    expect(screen.getByText("S3")).toBeTruthy();
    expect(screen.queryByText("DynamoDB")).toBeNull();
    expect(screen.queryByText("EC2")).toBeNull();
  });

  it("shows No matches when nothing matches", async () => {
    const user = userEvent.setup();
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    const input = screen.getByPlaceholderText(/^Find services/);
    await user.type(input, "zzzzz");
    expect(screen.getByText("No matches")).toBeTruthy();
  });

  it("shows Expand all / Collapse all toggle", () => {
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("Expand all")).toBeTruthy();
  });

  it("shows non-implemented services matching search query", async () => {
    const user = userEvent.setup();
    // Add a non-implemented service to the health response
    (useHealth as any).mockReturnValue({
      data: {
        services: {
          s3: "running",
          dynamodb: "running",
          ec2: "running",
          lambda: "running",
          sqs: "running",
          sns: "running",
          kms: "running",
          redshift: "running",
        },
        stats: { running: 8, total: 8 },
      },
    });
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    const input = screen.getByPlaceholderText(/^Find services/);
    await user.type(input, "redshift");
    expect(screen.getByText("redshift")).toBeTruthy();
  });
});

describe("AppLayoutShell — dark mode toggle", () => {
  it("renders Dark mode toggle button", () => {
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.getAllByLabelText("Switch to dark mode").length).toBeGreaterThan(0);
  });

  it("renders Light toggle when darkMode is enabled", () => {
    (useSettings as any).mockReturnValue({
      darkMode: true,
      toggleDarkMode: vi.fn(),
      refreshInterval: 5000,
      setRefreshInterval: vi.fn(),
    });
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.getAllByLabelText("Switch to light mode").length).toBeGreaterThan(0);
  });

  it("applies dark mode class to document body", () => {
    (useSettings as any).mockReturnValue({
      darkMode: true,
      toggleDarkMode: vi.fn(),
      refreshInterval: 5000,
      setRefreshInterval: vi.fn(),
    });
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(document.body.classList.contains("awsui-dark-mode")).toBe(true);
    expect(document.documentElement.classList.contains("awsui-dark-mode")).toBe(true);
  });

  it("does not apply dark mode class when darkMode is false", () => {
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(document.body.classList.contains("awsui-dark-mode")).toBe(false);
  });
});

describe("AppLayoutShell — Expand all / Collapse all toggle", () => {
  it("toggles between Expand all and Collapse all", async () => {
    const user = userEvent.setup();
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    const toggle = screen.getByText("Expand all");
    await user.click(toggle);
    expect(screen.getByText("Collapse all")).toBeTruthy();
    await user.click(screen.getByText("Collapse all"));
    expect(screen.getByText("Expand all")).toBeTruthy();
  });
});

describe("AppLayoutShell — notification bell", () => {
  it("shows bell badge when services are not all running", () => {
    (useHealth as any).mockReturnValue({
      data: {
        services: { s3: "stopped", dynamodb: "running" },
        stats: { running: 1, total: 2 },
      },
    });
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    const bells = document.querySelectorAll('[aria-label="Notifications"]');
    expect(bells.length).toBeGreaterThan(0);
  });

  it("opens notification modal on bell click", async () => {
    (useHealth as any).mockReturnValue({
      data: {
        services: { s3: "stopped", dynamodb: "running" },
        stats: { running: 1, total: 2 },
      },
    });
    const user = userEvent.setup();
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    const bells = screen.getAllByRole("button", { name: "Notifications" });
    await user.click(bells[0]);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("shows non-running services in modal", async () => {
    (useHealth as any).mockReturnValue({
      data: {
        services: { s3: "stopped", dynamodb: "running", ec2: "stopped" },
        stats: { running: 1, total: 3 },
      },
    });
    const user = userEvent.setup();
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    const bells = screen.getAllByRole("button", { name: "Notifications" });
    await user.click(bells[0]);
    expect(screen.getByText(/S3.*stopped/i)).toBeTruthy();
    expect(screen.getByText(/EC2.*stopped/i)).toBeTruthy();
  });

  it("shows all clear when all services running", async () => {
    (useHealth as any).mockReturnValue({
      data: {
        services: { s3: "running", dynamodb: "running" },
        stats: { running: 2, total: 2 },
      },
    });
    const user = userEvent.setup();
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    const bells = screen.getAllByRole("button", { name: "Notifications" });
    await user.click(bells[0]);
    expect(screen.getByText("All services are running.")).toBeTruthy();
  });
});
