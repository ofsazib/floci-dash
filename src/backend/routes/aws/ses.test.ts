import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-ses", () => ({
  SESClient: vi.fn(function () {
    return { send: mockSend };
  }),
  ListIdentitiesCommand: createCmd("ListIdentitiesCommand"),
  GetIdentityVerificationAttributesCommand: createCmd("GetIdentityVerificationAttributesCommand"),
  GetIdentityDkimAttributesCommand: createCmd("GetIdentityDkimAttributesCommand"),
  GetIdentityMailFromDomainAttributesCommand: createCmd("GetIdentityMailFromDomainAttributesCommand"),
  VerifyEmailIdentityCommand: createCmd("VerifyEmailIdentityCommand"),
  VerifyDomainIdentityCommand: createCmd("VerifyDomainIdentityCommand"),
  DeleteIdentityCommand: createCmd("DeleteIdentityCommand"),
  SendEmailCommand: createCmd("SendEmailCommand"),
  ListVerifiedEmailAddressesCommand: createCmd("ListVerifiedEmailAddressesCommand"),
}));

vi.mock("../../clients/aws", () => ({
  getAwsConfig: () => ({
    endpoint: "http://localhost:4566",
    region: "us-east-1",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  }),
  create: (Cls: any) => new Cls(),
}));

import router from "./ses";

async function get(path: string) {
  return router.request(path, { method: "GET" });
}

async function post(path: string, body?: any) {
  return router.request(path, {
    method: "POST",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function del(path: string) {
  return router.request(path, { method: "DELETE" });
}

beforeEach(() => {
  mockSend.mockReset();
});

describe("SES Routes", () => {
  describe("Identities", () => {
    it("GET /identities — lists identities", async () => {
      mockSend
        .mockResolvedValueOnce({ Identities: ["user@example.com"] })
        .mockResolvedValueOnce({
          VerificationAttributes: {
            "user@example.com": {
              VerificationStatus: "Success",
              VerificationToken: "tok123",
            },
          },
        })
        .mockResolvedValueOnce({
          DkimAttributes: {
            "user@example.com": {
              DkimEnabled: true,
              DkimVerificationStatus: "Success",
            },
          },
        })
        .mockResolvedValueOnce({
          MailFromDomainAttributes: {
            "user@example.com": { MailFromDomain: "mail.example.com" },
          },
        });
      const res = await get("/identities");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.identities[0].identity).toBe("user@example.com");
      expect(body.identities[0].verificationStatus).toBe("Success");
      expect(body.identities[0].dkimEnabled).toBe(true);
      expect(body.identities[0].mailFromDomain).toBe("mail.example.com");
    });

    it("GET /identities — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ Identities: [] });
      const res = await get("/identities");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.identities).toEqual([]);
    });

    it("POST /identities/verify-email — verifies email", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/identities/verify-email", { emailAddress: "user@example.com" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.emailAddress).toBe("user@example.com");
      expect(body.initiated).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("VerifyEmailIdentityCommand");
    });

    it("POST /identities/verify-email — 400 when email missing", async () => {
      const res = await post("/identities/verify-email", {});
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("emailAddress is required");
    });

    it("POST /identities/verify-domain — verifies domain", async () => {
      mockSend.mockResolvedValueOnce({ VerificationToken: "dns-token" });
      const res = await post("/identities/verify-domain", { domain: "example.com" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.domain).toBe("example.com");
      expect(body.verificationToken).toBe("dns-token");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("VerifyDomainIdentityCommand");
    });

    it("POST /identities/verify-domain — 400 when domain missing", async () => {
      const res = await post("/identities/verify-domain", {});
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("domain is required");
    });

    it("DELETE /identities/:value — deletes identity", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/identities/user%40example.com");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.identity).toBe("user@example.com");
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteIdentityCommand");
    });
  });

  describe("Send Email", () => {
    it("POST /send-email — sends email", async () => {
      mockSend.mockResolvedValueOnce({ MessageId: "msg-001" });
      const res = await post("/send-email", {
        source: "sender@example.com",
        toAddresses: ["recipient@example.com"],
        subject: "Hello",
        html: "<b>Hi</b>",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.messageId).toBe("msg-001");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("SendEmailCommand");
    });

    it("POST /send-email — 400 when fields missing", async () => {
      const res = await post("/send-email", { source: "a@b.com" });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("source, toAddresses, and subject are required");
    });
  });

  describe("Verified Emails", () => {
    it("GET /verified-emails — lists verified emails", async () => {
      mockSend.mockResolvedValueOnce({
        VerifiedEmailAddresses: ["a@example.com", "b@example.com"],
      });
      const res = await get("/verified-emails");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(2);
      expect(body.emails).toEqual(["a@example.com", "b@example.com"]);
    });
  });
});
