import { describe, it, expect, vi, afterEach } from "vitest";

describe("config endpoint resolution", () => {
  // The module captures FLOCI_URL at import time (`|| "http://localhost:4566"`),
  // so coverage of the two arms depends on the ambient env (e.g. `make test-all-cov`
  // sets FLOCI_URL, which would starve the fallback arm). Re-importing under both
  // stub states covers both arms deterministically in any environment.
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses FLOCI_URL when set", async () => {
    vi.stubEnv("FLOCI_URL", "http://floci.example:9878");
    vi.resetModules();
    const { getDefaultFlociEndpoint } = await import("./config");
    expect(getDefaultFlociEndpoint()).toBe("http://floci.example:9878");
  });

  it("falls back to the default endpoint when FLOCI_URL is unset", async () => {
    vi.stubEnv("FLOCI_URL", "");
    vi.resetModules();
    const { getDefaultFlociEndpoint } = await import("./config");
    expect(getDefaultFlociEndpoint()).toBe("http://localhost:4566");
  });
});
