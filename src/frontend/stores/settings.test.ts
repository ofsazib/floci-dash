import { describe, it, expect, beforeEach, vi } from "vitest";

// Hoist localStorage stub so it's in place before settings.ts imports.
// loadSettings() runs at import time, so the stub must be set up first.
const { mockGetItem } = vi.hoisted(() => {
  const mockGetItem = vi.fn().mockReturnValue(
    JSON.stringify({ darkMode: false, refreshInterval: 10000, flociEndpoint: "http://init:4566" })
  );
  vi.stubGlobal("localStorage", {
    getItem: mockGetItem,
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  });
  return { mockGetItem };
});

import { useSettings } from "./settings";

// Zustand store — exercised directly via getState/setState, no React needed.
describe("settings store", () => {
  beforeEach(() => {
    // Reset to defaults between tests.
    useSettings.setState({ darkMode: true, refreshInterval: 5000, flociEndpoint: undefined });
  });

  it("starts with sensible defaults", () => {
    const s = useSettings.getState();
    expect(s.darkMode).toBe(true);
    expect(s.refreshInterval).toBe(5000);
  });

  it("toggleDarkMode flips darkMode", () => {
    useSettings.getState().toggleDarkMode();
    expect(useSettings.getState().darkMode).toBe(false);
    useSettings.getState().toggleDarkMode();
    expect(useSettings.getState().darkMode).toBe(true);
  });

  it("setRefreshInterval updates the interval", () => {
    useSettings.getState().setRefreshInterval(10000);
    expect(useSettings.getState().refreshInterval).toBe(10000);
  });

  it("setFlociEndpoint updates the endpoint", () => {
    useSettings.getState().setFlociEndpoint("http://localhost:4566");
    expect(useSettings.getState().flociEndpoint).toBe("http://localhost:4566");
  });

  it("flociEndpoint starts as undefined by default", () => {
    expect(useSettings.getState().flociEndpoint).toBeUndefined();
  });

  it("saveSettings catches setItem errors silently", () => {
    // Override the hoisted setItem to throw
    const setItem = vi.fn().mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    vi.stubGlobal("localStorage", { ...localStorage, setItem });
    // These should not throw despite localStorage.setItem failing
    expect(() => useSettings.getState().toggleDarkMode()).not.toThrow();
    expect(() => useSettings.getState().setRefreshInterval(30000)).not.toThrow();
    expect(() => useSettings.getState().setFlociEndpoint("http://fail:4566")).not.toThrow();
  });
});

// Test loadSettings branches via dynamic re-import with different localStorage states.
// The static import above covers the "valid JSON" path (if (raw) truthy).
// Dynamic re-imports below cover the catch{} fallback (corrupt JSON) and falsy raw paths.
describe("settings store — loadSettings edge cases", () => {
  it("loadSettings returns defaults when localStorage is empty", async () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    });
    // Reset modules so settings.ts re-evaluates with the new localStorage mock
    vi.resetModules();
    const { useSettings: freshUseSettings } = await import("./settings");
    const s = freshUseSettings.getState();
    expect(s.darkMode).toBe(true);
    expect(s.refreshInterval).toBe(5000);
  });

  it("loadSettings returns defaults on corrupt JSON", async () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn().mockReturnValue("{not valid json"),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    });
    vi.resetModules();
    const { useSettings: freshUseSettings } = await import("./settings");
    const s = freshUseSettings.getState();
    expect(s.darkMode).toBe(true);
    expect(s.refreshInterval).toBe(5000);
  });
});
