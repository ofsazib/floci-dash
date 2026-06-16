import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: "node",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: [
        "src/frontend/pages/**",
        "src/backend/routes/**",
        "src/test/helpers.ts",
      ],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/**/*.d.ts",
        "src/test/setup.ts",
      ],
      reportsDirectory: "./coverage",
      thresholds: {
        statements: 45,
        branches: 40,
        functions: 35,
        lines: 45,
      },
    },
  },
  resolve: {
    conditions: ["node"],
  },
});
