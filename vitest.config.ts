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
      // 100% — every file with executable code is fully covered (verified
      // 2026-08-16). New or modified code must stay at 100% or CI fails.
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
  resolve: {
    conditions: ["node"],
  },
});
