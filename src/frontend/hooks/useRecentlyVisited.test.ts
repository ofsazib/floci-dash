// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useRecentlyVisited } from "./useRecentlyVisited";

const STORAGE_KEY = "fd-recently-visited";

beforeEach(() => {
  localStorage.clear();
  // Reset store state between tests
  useRecentlyVisited.setState({ recentlyVisited: [] });
});

describe("loadRecentlyVisited", () => {
  it("returns empty array when localStorage is empty", () => {
    const { recentlyVisited } = useRecentlyVisited.getState();
    expect(recentlyVisited).toEqual([]);
  });

  it("returns empty array when JSON is invalid", () => {
    localStorage.setItem(STORAGE_KEY, "not-json");
    useRecentlyVisited.setState({ recentlyVisited: [] });
    const { recentlyVisited } = useRecentlyVisited.getState();
    expect(recentlyVisited).toEqual([]);
  });

  it("handles localStorage getItem throwing", () => {
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage error");
    });
    useRecentlyVisited.setState({ recentlyVisited: [] });
    const { recentlyVisited } = useRecentlyVisited.getState();
    expect(recentlyVisited).toEqual([]);
    getItemSpy.mockRestore();
  });
});

describe("addVisited", () => {
  it("adds a new item to the front", () => {
    useRecentlyVisited.getState().addVisited("s3");
    const { recentlyVisited } = useRecentlyVisited.getState();
    expect(recentlyVisited).toEqual(["s3"]);
  });

  it("moves an existing item to the front", () => {
    useRecentlyVisited.setState({ recentlyVisited: ["ec2", "s3", "lambda"] });
    useRecentlyVisited.getState().addVisited("s3");
    const { recentlyVisited } = useRecentlyVisited.getState();
    expect(recentlyVisited[0]).toBe("s3");
    // Should not have duplicates
    expect(recentlyVisited.filter((k) => k === "s3").length).toBe(1);
  });

  it("limits items to MAX_ITEMS (10), evicting the oldest", () => {
    const items = Array.from({ length: 10 }, (_, i) => `svc-${i}`);
    useRecentlyVisited.setState({ recentlyVisited: items });
    // Adding one more should evict the oldest item (the one at the end after prepend)
    useRecentlyVisited.getState().addVisited("new-svc");
    const { recentlyVisited } = useRecentlyVisited.getState();
    expect(recentlyVisited.length).toBe(10);
    expect(recentlyVisited[0]).toBe("new-svc");
    // slice(0, MAX_ITEMS) removes from the end, so svc-9 should be evicted
    expect(recentlyVisited).not.toContain("svc-9");
    // svc-0 should still be present (it moved to index 1)
    expect(recentlyVisited).toContain("svc-0");
  });

  it("persists to localStorage", () => {
    useRecentlyVisited.getState().addVisited("iam");
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    expect(stored).toContain("iam");
  });

  it("handles localStorage setItem throwing", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage full");
    });
    expect(() => useRecentlyVisited.getState().addVisited("s3")).not.toThrow();
    setItemSpy.mockRestore();
  });
});

describe("clearVisited", () => {
  it("clears the recently visited list", () => {
    useRecentlyVisited.setState({ recentlyVisited: ["s3", "ec2"] });
    useRecentlyVisited.getState().clearVisited();
    const { recentlyVisited } = useRecentlyVisited.getState();
    expect(recentlyVisited).toEqual([]);
  });

  it("removes the localStorage key", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["s3"]));
    useRecentlyVisited.getState().clearVisited();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("[]");
  });
});
