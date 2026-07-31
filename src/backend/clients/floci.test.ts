import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flociFetch } from "./floci";
import { setFlociEndpoint } from "./config";

describe("flociFetch", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    // Explicit endpoint so URL assertions don't depend on the environment.
    setFlociEndpoint("http://floci.test:4566");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls fetch with the configured endpoint and path", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ status: "ok" }),
    });
    const result = await flociFetch("/health");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://floci.test:4566/health",
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
    expect(result).toEqual({ status: "ok" });
  });

  it("uses the endpoint set via setFlociEndpoint", async () => {
    setFlociEndpoint("http://custom:9999");
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({}),
    });
    await flociFetch("/init");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://custom:9999/init",
      expect.anything(),
    );
  });

  it("works without init and parses the JSON body", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ version: "1.0.0" }),
    });
    const result = await flociFetch("/version");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // Default headers are applied even when init is undefined.
    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      "Content-Type": "application/json",
    });
    expect(result).toEqual({ version: "1.0.0" });
  });

  it("merges custom headers with the default Content-Type", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({}),
    });
    await flociFetch("/x", { headers: { Authorization: "Bearer token" } });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer token",
    });
  });

  it("passes through init options like method and body", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({}),
    });
    await flociFetch("/x", { method: "POST", body: "{}" });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.body).toBe("{}");
  });

  it("throws a formatted error when the response is not ok", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    });
    await expect(flociFetch("/x")).rejects.toThrow(
      "Floci 503: Service Unavailable",
    );
  });
});
