// @vitest-environment node
import { describe, it, expect } from "vitest";
import type { HealthResponse, InitResponse, InfoResponse } from "./types";

describe("backend/types.ts — shape validation", () => {
  it("HealthResponse shape matches expected structure", () => {
    const sample: HealthResponse = {
      services: { s3: "running", ec2: "available" },
      edition: "Community",
      original_edition: "Community",
      version: "1.5.22",
      stats: { total: 2, running: 1, available: 1 },
    };

    expect(sample.services).toBeDefined();
    expect(sample.edition).toBeTypeOf("string");
    expect(sample.original_edition).toBeTypeOf("string");
    expect(sample.version).toBeTypeOf("string");
    expect(sample.stats).toBeDefined();
    expect(sample.stats.total).toBeTypeOf("number");
    expect(sample.stats.running).toBeTypeOf("number");
    expect(sample.stats.available).toBeTypeOf("number");
  });

  it("HealthResponse — services can be 'running' or 'available'", () => {
    const running: HealthResponse["services"] = { s3: "running" };
    const available: HealthResponse["services"] = { ec2: "available" };
    const empty: HealthResponse["services"] = {};

    expect(running.s3).toBe("running");
    expect(available.ec2).toBe("available");
    expect(Object.keys(empty)).toHaveLength(0);
  });

  it("HealthResponse — stats totals are consistent", () => {
    const sample: HealthResponse = {
      services: { s3: "running", ec2: "available", lambda: "running" },
      edition: "Community",
      original_edition: "Community",
      version: "1.0.0",
      stats: { total: 3, running: 2, available: 1 },
    };

    // The total should equal the number of services
    expect(sample.stats.total).toBe(Object.keys(sample.services).length);
    // Running + available should equal total
    expect(sample.stats.running + sample.stats.available).toBe(sample.stats.total);
  });

  it("InitResponse shape matches expected structure", () => {
    const sample: InitResponse = {
      completed: {
        boot: true,
        start: true,
        ready: true,
        shutdown: false,
      },
      scripts: {
        init: [
          { script: "create-tables.sh", state: "done", return_code: 0 },
          { script: "seed-data.sh", state: "failed", return_code: 1 },
        ],
      },
    };

    expect(sample.completed.boot).toBe(true);
    expect(sample.completed.start).toBe(true);
    expect(sample.completed.ready).toBe(true);
    expect(sample.completed.shutdown).toBe(false);
    expect(sample.scripts).toBeDefined();
    expect(sample.scripts.init).toHaveLength(2);
    expect(sample.scripts.init[0].script).toBeTypeOf("string");
    expect(sample.scripts.init[0].state).toBeTypeOf("string");
    expect(sample.scripts.init[0].return_code).toBeTypeOf("number");
  });

  it("InitResponse — all done state", () => {
    const sample: InitResponse = {
      completed: { boot: true, start: true, ready: true, shutdown: true },
      scripts: {},
    };

    expect(Object.values(sample.completed).every(Boolean)).toBe(true);
    expect(Object.keys(sample.scripts)).toHaveLength(0);
  });

  it("InitResponse — nothing started yet", () => {
    const sample: InitResponse = {
      completed: { boot: false, start: false, ready: false, shutdown: false },
      scripts: {},
    };

    expect(Object.values(sample.completed).every((v) => v === false)).toBe(true);
  });

  it("InfoResponse shape matches expected structure", () => {
    const sample: InfoResponse = {
      version: "1.5.22",
      edition: "Community",
      original_edition: "Community",
    };

    expect(sample.version).toBeTypeOf("string");
    expect(sample.edition).toBeTypeOf("string");
    expect(sample.original_edition).toBeTypeOf("string");
  });

  it("InfoResponse — edition can differ from original_edition", () => {
    const sample: InfoResponse = {
      version: "2.0.0",
      edition: "Enterprise",
      original_edition: "Community",
    };

    expect(sample.edition).toBe("Enterprise");
    expect(sample.original_edition).toBe("Community");
    expect(sample.edition).not.toBe(sample.original_edition);
  });


});
