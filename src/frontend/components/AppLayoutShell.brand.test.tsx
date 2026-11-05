// @vitest-environment happy-dom
// A locally configured brand (VITE_BRAND_*): logo only in the top bar, brand name in the side nav.
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("../lib/brand", () => ({ getBrand: () => ({ name: "Acme", title: undefined, logo: "/brand/acme.svg" }) }));
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn(), useLocation: () => ({ pathname: "/", hash: "" }) }));
vi.mock("../stores/favorites", () => ({ useFavorites: { getState: () => ({ favorites: [] }) } }));
vi.mock("./ServicesMenu", () => ({ default: () => null }));
vi.mock("./FavoritesBar", () => ({ default: () => null }));
vi.mock("../hooks/useRecentlyVisited", () => ({ useRecentlyVisited: { getState: () => ({ recentlyVisited: [], addVisited: vi.fn() }) } }));
vi.mock("../hooks/useSystem", () => ({
  useHealth: () => ({ data: { services: { s3: "running" }, stats: { running: 1, total: 1 } } }),
  useActiveServices: () => ({ data: { activeServices: [] } }),
}));
vi.mock("../stores/settings", () => ({
  useSettings: () => ({ darkMode: false, toggleDarkMode: vi.fn(), refreshInterval: 5000, setRefreshInterval: vi.fn() }),
}));

import AppLayoutShell from "./AppLayoutShell";

function renderShell() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <AppLayoutShell>
        <div>Content</div>
      </AppLayoutShell>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true, writable: true });
});

describe("AppLayoutShell — custom brand", () => {
  for (const width of [1024, 500]) {
    it(`shows the logo without a title at ${width}px`, () => {
      Object.defineProperty(window, "innerWidth", { value: width, configurable: true, writable: true });
      renderShell();
      expect(screen.getAllByAltText("Acme")[0].getAttribute("src")).toBe("/brand/acme.svg");
      expect(screen.queryByText("Floci Dash")).toBeNull();
      expect(screen.getAllByText("Acme").length).toBeGreaterThan(0);
    });
  }
});
