// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { mockNavigate, favState, recentState } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  favState: { favorites: [] as string[] },
  recentState: { addVisited: vi.fn() },
}));

vi.mock("react-router-dom", () => ({ useNavigate: () => mockNavigate }));
vi.mock("../stores/favorites", () => ({
  useFavorites: (sel: (s: typeof favState) => unknown) => sel(favState),
}));
vi.mock("../hooks/useRecentlyVisited", () => ({
  useRecentlyVisited: { getState: () => recentState },
}));

import FavoritesBar from "./FavoritesBar";

beforeEach(() => {
  vi.clearAllMocks();
  favState.favorites = [];
});

describe("FavoritesBar", () => {
  it("renders nothing until a service is starred, as in the console", () => {
    const { container } = render(<FavoritesBar />);
    expect(container.innerHTML).toBe("");
  });

  it("lists starred services by label", () => {
    favState.favorites = ["organizations", "iam"];
    render(<FavoritesBar />);
    const nav = screen.getByRole("navigation", { name: "Favorite services" });
    expect(nav.textContent).toContain("Organizations");
    expect(nav.textContent).toContain("IAM");
  });

  it("opens a service and records the visit", async () => {
    favState.favorites = ["s3"];
    const user = userEvent.setup();
    render(<FavoritesBar />);
    await user.click(screen.getByRole("link", { name: /S3/ }));
    expect(mockNavigate).toHaveBeenCalledWith("/services/s3");
    expect(recentState.addVisited).toHaveBeenCalledWith("s3");
  });
});
