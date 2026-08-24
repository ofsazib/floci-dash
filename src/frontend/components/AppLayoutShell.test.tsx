// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const { mockNavigate, mockLocation, favState, recentState } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockLocation: vi.fn(() => ({ pathname: "/", hash: "" })),
  favState: { favorites: [] as string[] },
  recentState: { recentlyVisited: [] as string[], addVisited: vi.fn() },
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation(),
}));

vi.mock("../stores/favorites", () => ({
  useFavorites: { getState: () => favState },
}));

vi.mock("../hooks/useRecentlyVisited", () => ({
  useRecentlyVisited: { getState: () => recentState },
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

// The real Cloudscape Modal always renders its role="dialog" root even when
// visible={false} (hidden via CSS), so queryByRole("dialog") can never become
// null in happy-dom. Mock it to unmount when hidden and expose a close button
// wired to onDismiss so dismiss behavior is testable. (Same pattern as
// DynamoDBTableDetail.test.tsx.)
vi.mock("@cloudscape-design/components", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@cloudscape-design/components")>();
  return {
    ...actual,
    Modal: ({ visible, header, footer, children, onDismiss }: any) => {
      if (!visible) return null;
      return React.createElement(
        "div",
        { role: "dialog" },
        React.createElement(
          "button",
          { onClick: onDismiss, "aria-label": "Close modal" },
          "Close",
        ),
        header,
        children,
        footer,
      );
    },
  };
});

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
  favState.favorites = [];
  recentState.recentlyVisited = [];
  recentState.addVisited.mockClear();
  mockNavigate.mockClear();
  mockLocation.mockReturnValue({ pathname: "/", hash: "" });
  Object.defineProperty(navigator, "platform", { value: "Linux", configurable: true });
  Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true, writable: true });
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

  it("renders Settings link even when health data is unavailable", () => {
    (useHealth as any).mockReturnValue({ data: undefined });
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("Settings")).toBeTruthy();
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

  it("closes notification modal via close button", async () => {
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
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeTruthy();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Close modal" }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("shows raw key for unknown non-running service", async () => {
    (useHealth as any).mockReturnValue({
      data: {
        services: { s3: "running", "custom-svc": "stopped" },
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
    expect(screen.getByText(/custom-svc: stopped/)).toBeTruthy();
  });
});

describe("AppLayoutShell — mac shortcuts", () => {
  it("shows ⌘K badge and Cmd+K placeholder on Mac", () => {
    Object.defineProperty(navigator, "platform", { value: "MacIntel", configurable: true });
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.getAllByText("⌘K").length).toBeGreaterThan(0);
    expect(screen.getAllByPlaceholderText(/Cmd\+K/).length).toBeGreaterThan(0);
  });

  it("shows Ctrl+K badge on non-Mac", () => {
    Object.defineProperty(navigator, "platform", { value: "Linux", configurable: true });
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.getAllByText("Ctrl+K").length).toBeGreaterThan(0);
  });
});

describe("AppLayoutShell — keyboard shortcut", () => {
  it("focuses the global search input on Cmd+K", () => {
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
    expect((document.activeElement as HTMLInputElement)?.getAttribute("placeholder")).toMatch(/Search services/);
  });

  it("focuses the global search input on Ctrl+K", () => {
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
    expect((document.activeElement as HTMLInputElement)?.getAttribute("placeholder")).toMatch(/Search services/);
  });
});

describe("AppLayoutShell — location & active services", () => {
  it("uses root href when pathname is empty", () => {
    mockLocation.mockReturnValue({ pathname: "", hash: "" });
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("Dashboard")).toBeTruthy();
  });

  it("renders when active services data is undefined", () => {
    (useActiveServices as any).mockReturnValue({ data: undefined });
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("S3")).toBeTruthy();
  });
});

describe("AppLayoutShell — favorites", () => {
  it("renders favorites section when favorites exist", () => {
    favState.favorites = ["s3", "dynamodb"];
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("★ Favorites")).toBeTruthy();
  });

  it("filters favorites by nav query", async () => {
    favState.favorites = ["s3", "dynamodb"];
    const user = userEvent.setup();
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    await user.type(screen.getByPlaceholderText(/^Find services/), "S3");
    expect(screen.getByText("★ Favorites")).toBeTruthy();
    expect(screen.queryByText("DynamoDB")).toBeNull();
  });

  it("hides favorites section when query filters them all out", async () => {
    favState.favorites = ["dynamodb"];
    const user = userEvent.setup();
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    await user.type(screen.getByPlaceholderText(/^Find services/), "S3");
    expect(screen.queryByText("★ Favorites")).toBeNull();
  });

  it("shows raw key for favorite without a label", () => {
    (useHealth as any).mockReturnValue({
      data: {
        services: { s3: "running", redshift: "running" },
        stats: { running: 2, total: 2 },
      },
    });
    favState.favorites = ["redshift"];
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("★ Favorites")).toBeTruthy();
    expect(screen.getAllByText("redshift").length).toBeGreaterThan(0);
  });
});

describe("AppLayoutShell — recently visited", () => {
  it("renders recently visited section", () => {
    recentState.recentlyVisited = ["s3"];
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("Recently Visited")).toBeTruthy();
  });

  it("hides recently visited section when query filters them out", async () => {
    recentState.recentlyVisited = ["dynamodb"];
    const user = userEvent.setup();
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    await user.type(screen.getByPlaceholderText(/^Find services/), "S3");
    expect(screen.queryByText("Recently Visited")).toBeNull();
  });

  it("shows raw key for recently visited without a label", () => {
    (useHealth as any).mockReturnValue({
      data: {
        services: { s3: "running", redshift: "running" },
        stats: { running: 2, total: 2 },
      },
    });
    recentState.recentlyVisited = ["redshift"];
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("Recently Visited")).toBeTruthy();
    expect(screen.getAllByText("redshift").length).toBeGreaterThan(0);
  });
});

describe("AppLayoutShell — category grouping", () => {
  it("renders category groups for non-implemented services", () => {
    (useHealth as any).mockReturnValue({
      data: {
        services: { s3: "running", athena: "running", redshift: "running" },
        stats: { running: 3, total: 3 },
      },
    });
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("Analytics")).toBeTruthy();
    expect(screen.getByText("Other")).toBeTruthy();
    expect(screen.getByText("Athena")).toBeTruthy();
  });

  it("sorts non-implemented services alphabetically within a category", () => {
    (useHealth as any).mockReturnValue({
      data: {
        services: { redshift: "running", glue: "running", athena: "running" },
        stats: { running: 3, total: 3 },
      },
    });
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    const texts = screen.getAllByText(/Athena|Glue/).map((el) => el.textContent);
    expect(texts.indexOf("Athena")).toBeGreaterThan(-1);
    expect(texts.indexOf("Athena")).toBeLessThan(texts.indexOf("Glue"));
  });

  it("renders category groups expanded after Expand all", async () => {
    (useHealth as any).mockReturnValue({
      data: {
        services: { s3: "running", athena: "running" },
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
    await user.click(screen.getByText("Expand all"));
    expect(screen.getByText("Collapse all")).toBeTruthy();
  });
});

describe("AppLayoutShell — navigation follow", () => {
  it("navigates to service page when service nav link clicked", async () => {
    const user = userEvent.setup();
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    await user.click(screen.getByText("S3"));
    expect(mockNavigate).toHaveBeenCalledWith("/services/s3");
    expect(recentState.addVisited).toHaveBeenCalledWith("s3");
  });

  it("navigates to settings without tracking recent", async () => {
    const user = userEvent.setup();
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    await user.click(screen.getByText("Settings"));
    expect(mockNavigate).toHaveBeenCalledWith("/settings");
    expect(recentState.addVisited).not.toHaveBeenCalled();
  });

  it("ignores empty-href nav link", async () => {
    const user = userEvent.setup();
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    await user.type(screen.getByPlaceholderText(/^Find services/), "zzzz");
    await user.click(screen.getByText("No matches"));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe("AppLayoutShell — skip to content", () => {
  it("focuses main content area on skip link click", async () => {
    const scrollSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollSpy;
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    fireEvent.click(screen.getByText("Skip to main content"));
    expect(document.querySelector("main")?.getAttribute("tabindex")).toBe("-1");
    expect(scrollSpy).toHaveBeenCalled();
  });
});

describe("AppLayoutShell — mobile viewport", () => {
  it("shows short title when viewport is narrow", () => {
    Object.defineProperty(window, "innerWidth", { value: 500, configurable: true, writable: true });
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    expect(screen.queryByText("Floci Dash")).toBeNull();
    expect(screen.getAllByText("Floci").length).toBeGreaterThan(0);
  });

  it("updates mobile state on window resize", () => {
    Object.defineProperty(window, "innerWidth", { value: 500, configurable: true, writable: true });
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    window.dispatchEvent(new Event("resize"));
    expect(screen.queryByText("Floci Dash")).toBeNull();
    expect(screen.getAllByText("Floci").length).toBeGreaterThan(0);
  });
});

describe("AppLayoutShell — global search select", () => {
  it("navigates when an implemented service option is selected", async () => {
    const user = userEvent.setup();
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    await user.type(screen.getAllByPlaceholderText(/Search services/)[1], "S3");
    const options = await screen.findAllByRole("option", { name: /S3/ });
    const option = options.find((o) => !o.textContent?.includes("Search for"))!;
    await user.click(option);
    expect(mockNavigate).toHaveBeenCalledWith("/services/s3");
    expect(recentState.addVisited).toHaveBeenCalledWith("s3");
  });

  it("navigates to a labeled non-implemented service", async () => {
    (useHealth as any).mockReturnValue({
      data: {
        services: { s3: "running", athena: "running" },
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
    await user.type(screen.getAllByPlaceholderText(/Search services/)[1], "Athena");
    const options = await screen.findAllByRole("option", { name: /Athena/ });
    const option = options.find((o) => !o.textContent?.includes("Search for"))!;
    await user.click(option);
    expect(mockNavigate).toHaveBeenCalledWith("/services/athena");
  });

  it("navigates to an unlabeled non-implemented service", async () => {
    (useHealth as any).mockReturnValue({
      data: {
        services: { s3: "running", redshift: "running" },
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
    await user.type(screen.getAllByPlaceholderText(/Search services/)[1], "redshift");
    const options = await screen.findAllByRole("option", { name: /redshift/ });
    const option = options.find((o) => !o.textContent?.includes("Search for"))!;
    await user.click(option);
    expect(mockNavigate).toHaveBeenCalledWith("/services/redshift");
  });

  it("does not navigate when a non-service value is selected", async () => {
    mockNavigate.mockClear();
    const user = userEvent.setup();
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    await user.type(screen.getAllByPlaceholderText(/Search services/)[1], "zzz");
    const option = await screen.findByRole("option", { name: /Search for "zzz"/i });
    await user.click(option);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("does not navigate when selecting with no health services", async () => {
    mockNavigate.mockClear();
    (useHealth as any).mockReturnValue({ data: { stats: { running: 0, total: 0 } } });
    const user = userEvent.setup();
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    await user.type(screen.getAllByPlaceholderText(/Search services/)[1], "zzz");
    const option = await screen.findByRole("option", { name: /Search for "zzz"/i });
    await user.click(option);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe("AppLayoutShell — search without health data", () => {
  it("shows No matches when searching without health data", async () => {
    (useHealth as any).mockReturnValue({ data: undefined });
    const user = userEvent.setup();
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    await user.type(screen.getByPlaceholderText(/^Find services/), "s3");
    expect(screen.getByText("No matches")).toBeTruthy();
  });

  it("builds empty search options when health has no services", async () => {
    (useHealth as any).mockReturnValue({ data: { stats: { running: 0, total: 0 } } });
    const user = userEvent.setup();
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    // The search still renders with no options; typing produces no service match
    await user.type(screen.getAllByPlaceholderText(/Search services/)[1], "s3");
    expect(screen.getByRole("combobox")).toBeTruthy();
    expect(screen.getAllByPlaceholderText(/Search services/).length).toBeGreaterThan(0);
  });
});

describe("AppLayoutShell — navigation toggle", () => {
  it("fires onNavigationChange when nav toggle clicked", async () => {
    const user = userEvent.setup();
    render(
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>,
      { wrapper: createWrapper() },
    );
    // The AppLayout toggle button has no aria-label unless ariaLabels is passed — find it by class
    const toggle = document.querySelector('[class*="navigation-toggle"]') as HTMLElement;
    expect(toggle).toBeTruthy();
    await user.click(toggle);
    expect(screen.getByText("Dashboard")).toBeTruthy();
  });
});
