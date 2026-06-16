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
        "src/frontend/lib/**",
        "src/backend/routes/**",
        "src/backend/clients/**",
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
        statements: 75,
        branches: 58,
        functions: 60,
        lines: 78,
      },
    },
  },
  resolve: {
    conditions: ["node"],
  },
});
