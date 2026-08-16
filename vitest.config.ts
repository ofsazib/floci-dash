import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: "node",
    // 20s: modal-flow and integration tests can exceed 10s under full-suite
    // parallel load with coverage instrumentation (they pass in isolation).
    testTimeout: 20000,
    globals: true,
    pool: "forks",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: [
        "src/frontend/**/*.{ts,tsx,js,jsx}",
        "src/backend/**/*.{ts,tsx,js,jsx}",
      ],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/**/*.d.ts",
        // Test infrastructure — not application code, must not be measured.
        "src/test/**",
        // Bootstrap entry — a single createRoot().render() call, nothing to test.
        "src/frontend/main.tsx",
        // Pure type-declaration files — no executable statements to cover.
        "src/frontend/types/api.ts",
        "src/backend/types.ts",
      ],
      reportsDirectory: "./coverage",
      reportOnFailure: true,
      thresholds: {
        statements: 72,
        branches: 50,
        functions: 62,
        lines: 74,
      },
    },
  },
  resolve: {
    conditions: ["node"],
  },
});
