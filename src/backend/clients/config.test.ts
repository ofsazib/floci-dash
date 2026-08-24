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

describe("getCandidateEndpoints", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("includes the current endpoint and common Docker hosts", async () => {
    vi.stubEnv("FLOCI_URL", "");
    vi.resetModules();
    const { getCandidateEndpoints } = await import("./config");
    const candidates = getCandidateEndpoints();
    expect(candidates[0]).toBe("http://localhost:4566");
    expect(candidates).toContain("http://host.docker.internal:4566");
    expect(candidates).toContain("http://172.17.0.1:4566");
  });

  it("deduplicates when the configured URL matches a candidate", async () => {
    vi.stubEnv("FLOCI_URL", "http://host.docker.internal:4566");
    vi.resetModules();
    const { getCandidateEndpoints } = await import("./config");
    const candidates = getCandidateEndpoints();
    const dockerEntries = candidates.filter((c) => c.includes("host.docker.internal"));
    expect(dockerEntries).toHaveLength(1);
  });

  it("uses https scheme when configured URL is https", async () => {
    vi.stubEnv("FLOCI_URL", "https://my-floci.example.com:9999");
    vi.resetModules();
    const { getCandidateEndpoints } = await import("./config");
    const candidates = getCandidateEndpoints();
    expect(candidates[0]).toMatch(/^https:\/\//);
    candidates.forEach((c) => {
      if (c !== candidates[0]) expect(c).toMatch(/^https:\/\//);
    });
  });


});

describe("discoverFlociEndpoint", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("returns the first responding endpoint and updates config", async () => {
    vi.stubEnv("FLOCI_URL", "");
    vi.resetModules();
    const { discoverFlociEndpoint, getFlociEndpoint } = await import("./config");
    const originalFetch = globalThis.fetch;
    let callCount = 0;
    globalThis.fetch = vi.fn(async (url: string) => {
      callCount++;
      if (String(url).includes("host.docker.internal")) {
        return { ok: true } as Response;
      }
      throw new Error("connection refused");
    }) as any;
    try {
      const result = await discoverFlociEndpoint(5000);
      expect(result.working).toBe("http://host.docker.internal:4566");
      expect(callCount).toBeGreaterThanOrEqual(2);
      expect(getFlociEndpoint()).toBe("http://host.docker.internal:4566");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("skips non-OK responses and tries next candidate", async () => {
    vi.stubEnv("FLOCI_URL", "");
    vi.resetModules();
    const { discoverFlociEndpoint } = await import("./config");
    const originalFetch = globalThis.fetch;
    // localhost returns non-OK (first candidate) so we hit the res.ok=false branch
    globalThis.fetch = vi.fn(async (url: string) => {
      if (String(url).includes("localhost") || String(url).includes("127.0.0.1")) {
        return { ok: false, status: 502 } as Response;
      }
      if (String(url).includes("host.docker.internal")) {
        return { ok: true } as Response;
      }
      throw new Error("refused");
    }) as any;
    try {
      const result = await discoverFlociEndpoint(5000);
      expect(result.working).toContain("host.docker.internal");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("aborts when timeout elapses before any response", async () => {
    vi.stubEnv("FLOCI_URL", "");
    vi.resetModules();
    const { discoverFlociEndpoint } = await import("./config");
    const originalFetch = globalThis.fetch;
    // Fetch respects abort signal - rejects when controller.abort() fires
    globalThis.fetch = vi.fn((_url: string, init?: any) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal;
        if (signal) {
          if (signal.aborted) { reject(new DOMException("Aborted", "AbortError")); return; }
          signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
        }
      });
    }) as any;
    try {
      const result = await discoverFlociEndpoint(50);
      expect(result.working).toBe("");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("returns empty working when no endpoint responds", async () => {
    vi.stubEnv("FLOCI_URL", "");
    vi.resetModules();
    const { discoverFlociEndpoint } = await import("./config");
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async () => {
      throw new Error("connection refused");
    }) as any;
    try {
      const result = await discoverFlociEndpoint(1000);
      expect(result.working).toBe("");
      expect(result.candidates.length).toBeGreaterThan(0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
