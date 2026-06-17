import "@testing-library/jest-dom/vitest";

// Polyfill localStorage for jsdom environments where it's not globally available
if (typeof globalThis.localStorage === "undefined") {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const key of Object.keys(store)) delete store[key];
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  } as Storage;
}

// Stub HTMLCanvasElement.getContext in jsdom. Cloudscape (and chart/sparkline
// components) touch canvas internally; jsdom doesn't implement it and logs a
// noisy "Not implemented: HTMLCanvasElement.getContext()" error on every render.
// Returning null is what a real browser does when a context is unavailable, and
// it skips jsdom's slow not-implemented code path.
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = (() => null) as never;
}
