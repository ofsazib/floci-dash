import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockFetch = vi.hoisted(() => vi.fn());

vi.mock("../../clients/config", () => ({
  getFlociEndpoint: () => "http://floci:4566",
}));

vi.mock("../../clients/floci", () => ({
  flociFetch: vi.fn(),
}));

import router from "./signin";

const get = (path: string) => router.request(path);
const post = (path: string, body?: any) =>
  router.request(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

const okRes = (headers: Record<string, string>, json: any = {}) =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: "OK",
    headers: new Headers(headers),
    json: () => Promise.resolve(json),
  });

beforeEach(() => {
  mockFetch.mockReset();
  globalThis.fetch = mockFetch;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AWS Sign-In raw proxy", () => {
  it("GET /authorize forwards query params and returns the redirect location", async () => {
    mockFetch.mockReturnValue(okRes({ location: "/_floci/signin/consent?request_id=abc" }));
    const res = await get("/authorize?client_id=cli&response_type=code&scope=aws");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.location).toBe("/_floci/signin/consent?request_id=abc");
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("http://floci:4566/v1/authorize?");
    expect(calledUrl).toContain("client_id=cli");
    expect(calledUrl).toContain("scope=aws");
  });

  it("GET /authorize without query params calls the bare path", async () => {
    mockFetch.mockReturnValue(okRes({ location: "" }));
    const res = await get("/authorize");
    expect(res.status).toBe(200);
    expect((await res.json()).location).toBe("");
    expect(mockFetch.mock.calls[0][0]).toBe("http://floci:4566/v1/authorize");
  });

  it("POST /consent approves an authorization", async () => {
    mockFetch.mockReturnValue(okRes({ location: "/v1/token?code=xyz" }));
    const res = await post("/consent", { requestId: "abc", action: "continue" });
    expect(res.status).toBe(200);
    expect((await res.json()).location).toBe("/v1/token?code=xyz");
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("http://floci:4566/_floci/signin/consent");
    expect(init.method).toBe("POST");
    expect(init.body).toContain("request_id=abc");
    expect(init.body).toContain("action=continue");
  });

  it("POST /consent denies an authorization", async () => {
    mockFetch.mockReturnValue(okRes({ location: "/v1/authorize?error=access_denied" }));
    const res = await post("/consent", { requestId: "abc", action: "cancel" });
    expect(res.status).toBe(200);
    expect((await res.json()).location).toContain("access_denied");
    expect(mockFetch.mock.calls[0][1].body).toContain("action=cancel");
  });

  it("POST /consent without a redirect location returns an empty location", async () => {
    mockFetch.mockReturnValue(okRes({}));
    const res = await post("/consent", { requestId: "abc", action: "continue" });
    expect(res.status).toBe(200);
    expect((await res.json()).location).toBe("");
  });

  it("POST /consent returns 400 when requestId is missing", async () => {
    const res = await post("/consent", { action: "continue" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("requestId");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("POST /consent returns 400 for an invalid action", async () => {
    const res = await post("/consent", { requestId: "abc", action: "maybe" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("continue|cancel");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("POST /token exchanges a code and returns credentials", async () => {
    mockFetch.mockReturnValue(
      okRes(
        {},
        {
          accessToken: { accessKeyId: "AK", secretAccessKey: "SK", sessionToken: "ST" },
          tokenType: "aws_sigv4",
          expiresIn: 3600,
        },
      ),
    );
    const res = await post("/token", { grant_type: "authorization_code", code: "xyz" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tokenType).toBe("aws_sigv4");
    expect(body.accessToken.accessKeyId).toBe("AK");
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("http://floci:4566/v1/token");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body).code).toBe("xyz");
  });

  it("POST /token surfaces Floci error responses", async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: () => Promise.resolve({ error: "invalid_grant" }),
      }),
    );
    const res = await post("/token", { grant_type: "refresh_token", refresh_token: "bad" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_grant");
  });

  it("POST /token falls back to status text when the error body is not JSON", async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: false,
        status: 502,
        statusText: "Bad Gateway",
        json: () => Promise.reject(new Error("no body")),
      }),
    );
    const res = await post("/token", {});
    expect(res.status).toBe(502);
    expect((await res.json()).error).toContain("Bad Gateway");
  });
});