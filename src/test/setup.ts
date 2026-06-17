import "@testing-library/jest-dom/vitest";

// Polyfill localStorage when the test DOM doesn't expose it globally
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

// Stub HTMLCanvasElement.getContext in the test DOM. Cloudscape (and
// chart/sparkline components) touch canvas internally, which the headless DOM
// doesn't implement and logs noisy "Not implemented" errors for on every
// render. Returning null matches real-browser behavior when no context is
// available.
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = (() => null) as never;
}
