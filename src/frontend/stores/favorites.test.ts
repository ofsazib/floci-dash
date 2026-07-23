// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";

const STORAGE_KEY = "fd-favorites";

async function freshStore() {
  vi.resetModules();
  const mod = await import("./favorites");
  return mod.useFavorites;
}

describe("useFavorites", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe("initial state from localStorage", () => {
    it("loads existing favorites from localStorage", async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(["s3", "lambda"]));
      const store = await freshStore();
      expect(store.getState().favorites).toEqual(["s3", "lambda"]);
    });

    it("loads empty array when localStorage is empty", async () => {
      const store = await freshStore();
      expect(store.getState().favorites).toEqual([]);
    });

    it("loads empty array when localStorage has invalid JSON", async () => {
      localStorage.setItem(STORAGE_KEY, "not-json");
      const store = await freshStore();
      expect(store.getState().favorites).toEqual([]);
    });

    it("handles localStorage.getItem throwing during initial load", async () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("storage error");
      });
      const store = await freshStore();
      expect(store.getState().favorites).toEqual([]);
    });
  });

  describe("addFavorite", () => {
    it("adds a new favorite", async () => {
      const store = await freshStore();
      store.getState().addFavorite("s3");
      expect(store.getState().favorites).toEqual(["s3"]);
    });

    it("does not add duplicate favorites", async () => {
      const store = await freshStore();
      store.getState().addFavorite("s3");
      store.getState().addFavorite("s3");
      expect(store.getState().favorites).toEqual(["s3"]);
    });

    it("persists to localStorage", async () => {
      const store = await freshStore();
      store.getState().addFavorite("lambda");
      expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(["lambda"]));
    });

    it("handles localStorage.setItem throwing", async () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
        throw new Error("storage full");
      });
      const store = await freshStore();
      store.getState().addFavorite("s3");
      expect(store.getState().favorites).toEqual(["s3"]);
    });
  });

  describe("removeFavorite", () => {
    it("removes an existing favorite", async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(["s3", "lambda"]));
      const store = await freshStore();
      store.getState().removeFavorite("s3");
      expect(store.getState().favorites).toEqual(["lambda"]);
    });

    it("does nothing when removing non-existent favorite", async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(["s3"]));
      const store = await freshStore();
      store.getState().removeFavorite("nonexistent");
      expect(store.getState().favorites).toEqual(["s3"]);
    });

    it("persists removal to localStorage", async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(["ec2"]));
      const store = await freshStore();
      store.getState().removeFavorite("ec2");
      expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify([]));
    });
  });

  describe("toggleFavorite", () => {
    it("adds a favorite when not currently favorited", async () => {
      const store = await freshStore();
      store.getState().toggleFavorite("rds");
      expect(store.getState().favorites).toEqual(["rds"]);
    });

    it("removes a favorite when already favorited", async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(["rds"]));
      const store = await freshStore();
      store.getState().toggleFavorite("rds");
      expect(store.getState().favorites).toEqual([]);
    });
  });

  describe("isFavorite", () => {
    it("returns true for a favorited service", async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(["dynamodb"]));
      const store = await freshStore();
      expect(store.getState().isFavorite("dynamodb")).toBe(true);
    });

    it("returns false for a non-favorited service", async () => {
      const store = await freshStore();
      expect(store.getState().isFavorite("dynamodb")).toBe(false);
    });
  });
});
