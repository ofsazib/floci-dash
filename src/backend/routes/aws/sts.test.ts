import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockSTS = vi.hoisted(() =>
  vi.fn(function () {
    return { send: mockSend };
  })
);

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-sts", () => ({
  STSClient: mockSTS,
  GetCallerIdentityCommand: createCmd("GetCallerIdentityCommand"),
  AssumeRoleCommand: createCmd("AssumeRoleCommand"),
  GetSessionTokenCommand: createCmd("GetSessionTokenCommand"),
}));

import app from "../../index";

beforeEach(() => {
  mockSend.mockReset();
});

// ─── Get Caller Identity ─────────────────────────────────

describe("GET /api/aws/sts/caller-identity", () => {
  it("returns caller identity", async () => {
    mockSend.mockResolvedValue({
      Account: "123456789012",
      Arn: "arn:aws:iam::123456789012:root",
      UserId: "AIDA12345678901234567",
    });
    const res = await app.request("/api/aws/sts/caller-identity");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.account).toBe("123456789012");
    expect(body.arn).toBe("arn:aws:iam::123456789012:root");
    expect(body.userId).toBe("AIDA12345678901234567");
  });
});

// ─── Assume Role ─────────────────────────────────────────

describe("POST /api/aws/sts/assume-role", () => {
  it("assumes a role and returns credentials", async () => {
    mockSend.mockResolvedValue({
      Credentials: {
        AccessKeyId: "ASIA12345678901234567",
        SecretAccessKey: "secret123",
        SessionToken: "token123",
        Expiration: new Date("2024-01-01T00:00:00Z"),
      },
      AssumedRoleUser: {
        AssumedRoleId: "AROA12345678901234567:session",
        Arn: "arn:aws:sts::123456789012:assumed-role/MyRole/session",
      },
    });
    const res = await app.request("/api/aws/sts/assume-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleArn: "arn:aws:iam::123456789012:role/MyRole" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.credentials.accessKeyId).toBe("ASIA12345678901234567");
    expect(body.assumedRoleUser.arn).toContain("MyRole");
    // Default session name used
    expect(mockSend.mock.calls[0][0].RoleSessionName).toBe("dashboard-session");
  });

  it("assumes a role with explicit sessionName, duration, policy, and tags", async () => {
    mockSend.mockResolvedValue({
      Credentials: {
        AccessKeyId: "ASIA98765432109876543",
        SecretAccessKey: "secret456",
        SessionToken: "token456",
        Expiration: new Date("2024-02-01T00:00:00Z"),
      },
      AssumedRoleUser: {
        AssumedRoleId: "AROA98765432109876543:my-session",
        Arn: "arn:aws:sts::123456789012:assumed-role/MyRole/my-session",
      },
    });
    mockSend.mockClear();
    const res = await app.request("/api/aws/sts/assume-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roleArn: "arn:aws:iam::123456789012:role/MyRole",
        sessionName: "my-session",
        durationSeconds: 3600,
        policy: '{"Version":"2012-10-17"}',
        policyArns: [{ arn: "arn:aws:iam::aws:policy/AdministratorAccess" }],
        tags: [{ key: "env", value: "prod" }],
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.credentials.accessKeyId).toBe("ASIA98765432109876543");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.RoleSessionName).toBe("my-session");
    expect(cmd.DurationSeconds).toBe(3600);
    expect(cmd.Policy).toContain("2012-10-17");
    expect(cmd.PolicyArns).toHaveLength(1);
    expect(cmd.Tags).toHaveLength(1);
  });

  it("assumes a role with null credentials and null assumedRoleUser", async () => {
    mockSend.mockResolvedValue({
      Credentials: null,
      AssumedRoleUser: null,
    });
    const res = await app.request("/api/aws/sts/assume-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleArn: "arn:aws:iam::123456789012:role/MyRole" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.credentials).toBeNull();
    expect(body.assumedRoleUser).toBeNull();
  });

  it("returns 400 if roleArn is missing", async () => {
    const res = await app.request("/api/aws/sts/assume-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});

// ─── Get Session Token ───────────────────────────────────

describe("POST /api/aws/sts/session-token", () => {
  it("returns a session token", async () => {
    mockSend.mockResolvedValue({
      Credentials: {
        AccessKeyId: "ASIA98765432109876543",
        SecretAccessKey: "secret456",
        SessionToken: "token456",
        Expiration: new Date("2024-01-01T00:00:00Z"),
      },
    });
    const res = await app.request("/api/aws/sts/session-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationSeconds: 900 }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.credentials.accessKeyId).toBe("ASIA98765432109876543");
  });

  it("returns a session token with serialNumber and tokenCode", async () => {
    mockSend.mockResolvedValue({
      Credentials: {
        AccessKeyId: "ASIA55555555555555555",
        SecretAccessKey: "secret789",
        SessionToken: "token789",
        Expiration: new Date("2024-03-01T00:00:00Z"),
      },
    });
    const res = await app.request("/api/aws/sts/session-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        durationSeconds: 3600,
        serialNumber: "arn:aws:iam::123456789012:mfa/user",
        tokenCode: "123456",
      }),
    });
    expect(res.status).toBe(200);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.SerialNumber).toBe("arn:aws:iam::123456789012:mfa/user");
    expect(cmd.TokenCode).toBe("123456");
  });

  it("returns null credentials when no credentials returned", async () => {
    mockSend.mockResolvedValue({ Credentials: null });
    const res = await app.request("/api/aws/sts/session-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.credentials).toBeNull();
  });
});
