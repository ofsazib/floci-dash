import { describe, it, expect, beforeEach, vi } from "vitest";

const mockFetch = vi.hoisted(() => vi.fn());

vi.stubGlobal("fetch", mockFetch);

import router from "./ssooidc";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function post(path: string, body?: any) {
  return router.request(path, {
    method: "POST",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockReset();
});

describe("clients", () => {
  it("400 register without clientName", async () => {
    expect((await post("/clients", {})).status).toBe(400);
  });

  it("registers a public client", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        clientId: "cid-1",
        clientSecret: "secret-1",
        clientIdIssuedAt: 100,
        clientSecretExpiresAt: 200,
        authorizationEndpoint: "http://auth",
        tokenEndpoint: "http://token",
      })
    );
    const res = await post("/clients", {
      clientName: "probe",
      scopes: ["sso:account:access"],
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.clientId).toBe("cid-1");
    expect(json.tokenEndpoint).toBe("http://token");

    const [url, init] = mockFetch.mock.calls[0];
    expect(String(url)).toContain("/client/register");
    expect(String(init.headers.authorization)).toContain("/sso-oauth/aws4_request");
    const body = JSON.parse(init.body);
    expect(body.clientName).toBe("probe");
    expect(body.clientType).toBe("public");
    expect(body.scopes).toEqual(["sso:account:access"]);
  });

  it("registers without scopes", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ clientId: "cid-2" }));
    await post("/clients", { clientName: "probe" });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.scopes).toBeUndefined();
  });

  it("propagates OIDC errors", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(
        { error: "invalid_client_metadata", error_description: "bad metadata" },
        400
      )
    );
    const res = await post("/clients", { clientName: "probe" });
    expect(res.status).toBe(500);
  });

  it("handles empty error bodies", async () => {
    mockFetch.mockResolvedValueOnce(new Response("", { status: 502 }));
    const res = await post("/clients", { clientName: "probe" });
    expect(res.status).toBe(500);
  });
});

describe("device authorization", () => {
  it("400 without clientId or clientSecret", async () => {
    expect((await post("/device-authorization", {})).status).toBe(400);
    expect((await post("/device-authorization", { clientId: "c" })).status).toBe(400);
  });

  it("starts device authorization with a startUrl", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        deviceCode: "dc-1",
        userCode: "ABCD-EFGH",
        verificationUri: "http://device",
        verificationUriComplete: "http://device?user_code=ABCD-EFGH",
        expiresIn: 600,
        interval: 5,
      })
    );
    const res = await post("/device-authorization", {
      clientId: "cid-1",
      clientSecret: "secret-1",
      startUrl: "https://view.awsapps.com/start",
    });
    const json = await res.json();
    expect(json.userCode).toBe("ABCD-EFGH");
    expect(json.verificationUriComplete).toContain("user_code");
    expect(json.interval).toBe(5);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.startUrl).toBe("https://view.awsapps.com/start");
  });

  it("omits startUrl when absent", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ deviceCode: "dc-2" }));
    await post("/device-authorization", { clientId: "c", clientSecret: "s" });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.startUrl).toBeUndefined();
  });
});

describe("token", () => {
  it("400 without clientId or clientSecret", async () => {
    expect((await post("/token", {})).status).toBe(400);
    expect((await post("/token", { clientId: "c" })).status).toBe(400);
  });

  it("polls the device-code token", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        accessToken: "at-1",
        refreshToken: "rt-1",
        expiresIn: 28800,
        tokenType: "Bearer",
      })
    );
    const res = await post("/token", {
      clientId: "cid-1",
      clientSecret: "secret-1",
      deviceCode: "dc-1",
    });
    const json = await res.json();
    expect(json.accessToken).toBe("at-1");
    expect(json.tokenType).toBe("Bearer");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.grantType).toBe("urn:ietf:params:oauth:grant-type:device_code");
    expect(body.deviceCode).toBe("dc-1");
  });

  it("surfaces authorization_pending errors", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(
        {
          error: "authorization_pending",
          error_description: "Device authorization is pending",
        },
        400
      )
    );
    const res = await post("/token", {
      clientId: "cid-1",
      clientSecret: "secret-1",
      deviceCode: "dc-1",
    });
    expect(res.status).toBe(500);
  });

  it("returns empty token fields when absent", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}));
    const res = await post("/token", {
      clientId: "cid-1",
      clientSecret: "secret-1",
      deviceCode: "dc-1",
    });
    const json = await res.json();
    expect(json.accessToken).toBeUndefined();
    expect(json.refreshToken).toBeUndefined();
  });
});
