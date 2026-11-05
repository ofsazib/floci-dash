// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { mockNavigate, favState, recentState } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  favState: { favorites: [] as string[], toggleFavorite: vi.fn() },
  recentState: { recentlyVisited: [] as string[], addVisited: vi.fn() },
}));

vi.mock("react-router-dom", () => ({ useNavigate: () => mockNavigate }));
vi.mock("../stores/favorites", () => ({ useFavorites: () => favState }));
vi.mock("../hooks/useRecentlyVisited", () => ({
  useRecentlyVisited: Object.assign(
    (sel: (s: typeof recentState) => unknown) => sel(recentState),
    { getState: () => recentState },
  ),
}));

import ServicesMenu from "./ServicesMenu";

const KEYS = ["s3", "ec2", "lambda", "iam", "unknown-svc"];

beforeEach(() => {
  vi.clearAllMocks();
  favState.favorites = [];
  recentState.recentlyVisited = [];
});

async function openMenu(keys = KEYS) {
  const user = userEvent.setup();
  render(<ServicesMenu serviceKeys={keys} />);
  await user.click(screen.getByRole("button", { name: /Services/ }));
  return user;
}

describe("ServicesMenu", () => {
  it("is closed until the Services button is clicked", async () => {
    render(<ServicesMenu serviceKeys={KEYS} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: /Services/ }).getAttribute("aria-expanded")).toBe("false");
  });

  it("opens on Recently visited and says when there is none", async () => {
    await openMenu();
    expect(screen.getByRole("dialog", { name: "Services" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Recently visited" })).toBeTruthy();
    expect(screen.getByText("No recently visited services.")).toBeTruthy();
  });

  it("lists recently visited services that Floci still offers", async () => {
    recentState.recentlyVisited = ["lambda", "gone"];
    await openMenu();
    expect(screen.getByText("Lambda")).toBeTruthy();
    expect(screen.queryByText("gone")).toBeNull();
  });

  it("shows favorites and an empty hint when there are none", async () => {
    const user = await openMenu();
    await user.click(screen.getByRole("button", { name: "Favorites" }));
    expect(screen.getByText("No favorites yet. Star a service to add it.")).toBeTruthy();
  });

  it("lists favorites with a filled star", async () => {
    favState.favorites = ["s3"];
    const user = await openMenu();
    await user.click(screen.getByRole("button", { name: "Favorites" }));
    const star = screen.getByRole("button", { name: "Remove S3 from favorites" });
    expect(star.getAttribute("aria-pressed")).toBe("true");
  });

  it("lists all services sorted by label", async () => {
    const user = await openMenu();
    await user.click(screen.getByRole("button", { name: "All services" }));
    const links = screen.getAllByRole("link").map((a) => a.lastChild!.textContent);
    expect(links).toEqual([...links].sort((a, b) => a!.localeCompare(b!)));
    expect(links).toContain("unknown-svc");
  });

  it("groups services by category, with uncategorised ones under Other", async () => {
    const user = await openMenu();
    await user.click(screen.getByRole("button", { name: "Compute" }));
    expect(screen.getAllByRole("link").map((a) => a.lastChild!.textContent)).toEqual(["EC2", "Lambda"]);
    await user.click(screen.getByRole("button", { name: "Other" }));
    expect(screen.getAllByRole("link").map((a) => a.lastChild!.textContent)).toEqual(["unknown-svc"]);
  });

  it("only offers categories that have services", async () => {
    await openMenu(["s3"]);
    expect(screen.getByRole("button", { name: "Storage" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Compute" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Other" })).toBeNull();
  });

  it("says when no services are available", async () => {
    const user = await openMenu([]);
    await user.click(screen.getByRole("button", { name: "All services" }));
    expect(screen.getByText("No services available.")).toBeTruthy();
  });

  it("navigates to a service, records the visit and closes", async () => {
    const user = await openMenu();
    await user.click(screen.getByRole("button", { name: "All services" }));
    await user.click(screen.getByRole("link", { name: "S3" }));
    expect(mockNavigate).toHaveBeenCalledWith("/services/s3");
    expect(recentState.addVisited).toHaveBeenCalledWith("s3");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("toggles a favorite from the star", async () => {
    const user = await openMenu();
    await user.click(screen.getByRole("button", { name: "All services" }));
    await user.click(screen.getByRole("button", { name: "Add S3 to favorites" }));
    expect(favState.toggleFavorite).toHaveBeenCalledWith("s3");
  });

  it("closes on Escape but not on other keys", async () => {
    await openMenu();
    fireEvent.keyDown(window, { key: "a" });
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes on a click outside but not inside", async () => {
    await openMenu();
    fireEvent.mouseDown(screen.getByRole("heading", { name: "Recently visited" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes when the Services button is clicked again", async () => {
    const user = await openMenu();
    await user.click(screen.getByRole("button", { name: /Services/ }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
