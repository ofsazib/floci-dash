import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: "node",
    testTimeout: 10000,
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: [
        "src/frontend/**/*.{ts,tsx,js,jsx}",
        "src/backend/**/*.{ts,tsx,js,jsx}",
        "src/test/helpers.ts",
      ],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/**/*.d.ts",
        "src/test/setup.ts",
      ],
      reportsDirectory: "./coverage",
      reportOnFailure: true,
      thresholds: {
        statements: 72,
        branches: 54,
        functions: 64,
        lines: 75,
      },
    },
  },
  resolve: {
    conditions: ["node"],
  },
});
