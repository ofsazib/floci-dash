import { describe, it, expect, vi, afterEach } from "vitest";

describe("AWS client region resolution", () => {
  // Same import-time env capture as config.ts — re-import under both stub states
  // so the 100% branch gate does not depend on the ambient AWS_REGION.
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses AWS_REGION when set", async () => {
    vi.stubEnv("AWS_REGION", "eu-west-1");
    vi.resetModules();
    const { getAwsConfig } = await import("./aws");
    expect(getAwsConfig().region).toBe("eu-west-1");
  });

  it("falls back to us-east-1 when AWS_REGION is unset", async () => {
    vi.stubEnv("AWS_REGION", "");
    vi.resetModules();
    const { getAwsConfig } = await import("./aws");
    expect(getAwsConfig().region).toBe("us-east-1");
  });
});
