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
    // Cap fork workers: 12 workers × coverage-instrumented React test DOMs +
    // a live Floci container exceeds the RAM on 12-core dev machines, causing
    // tests to hang (150s+) under memory pressure. 4 workers stay stable.
    // CI runners have ≤4 vCPUs, so this does not slow CI.
    maxWorkers: 4,
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
        // JSX-heavy dashboard pages — tested via integration tests and UI,
        // not unit-tested for every conditional rendering branch.
        "src/frontend/pages/services/FisDashboard.tsx",
        "src/frontend/pages/services/CloudHSMDashboard.tsx",
        "src/frontend/pages/services/GuardDutyDashboard.tsx",
        "src/frontend/pages/services/S3TablesDashboard.tsx",
        "src/frontend/pages/services/CloudFormationDashboard.tsx",
        "src/frontend/pages/services/KinesisAnalyticsDashboard.tsx",
        "src/frontend/pages/services/CloudControlDashboard.tsx",
        "src/frontend/pages/services/RUMDashboard.tsx",
        "src/frontend/pages/services/AgentCoreDashboard.tsx",
        "src/frontend/pages/services/AmazonMQDashboard.tsx",
        "src/frontend/pages/services/LambdaMicrovmsDashboard.tsx",
        "src/frontend/pages/services/EmrServerlessDashboard.tsx",
        "src/frontend/pages/services/AgentCoreControlDashboard.tsx",
        "src/frontend/pages/services/LightsailDashboard.tsx",
        "src/frontend/pages/services/MWAADashboard.tsx",
        "src/frontend/pages/services/AppAutoScalingDashboard.tsx",
      ],
      reportsDirectory: "./coverage",
      reportOnFailure: true,
      // 100% for statements, functions, lines — enforced in CI.
      // Branches: 99% — V8 counts `|| []`, `?? null`, `|| undefined` fallback
      // patterns as branches even though the falsy path is never hit in tests
      // (SDK always returns valid data). ~150 defensive-fallback branches across
      // 17 files account for the gap; real code logic is fully covered.
      thresholds: {
        statements: 100,
        branches: 99,
        functions: 100,
        lines: 100,
      },
    },
  },
  resolve: {
    conditions: ["node"],
  },
});
