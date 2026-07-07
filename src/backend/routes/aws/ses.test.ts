import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockSES = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-ses", () => ({
  SESClient: mockSES,
  ListIdentitiesCommand: createCmd("ListIdentitiesCommand"),
  VerifyEmailIdentityCommand: createCmd("VerifyEmailIdentityCommand"),
  VerifyDomainIdentityCommand: createCmd("VerifyDomainIdentityCommand"),
  DeleteIdentityCommand: createCmd("DeleteIdentityCommand"),
  GetIdentityVerificationAttributesCommand: createCmd("GetIdentityVerificationAttributesCommand"),
  SendEmailCommand: createCmd("SendEmailCommand"),
  GetIdentityDkimAttributesCommand: createCmd("GetIdentityDkimAttributesCommand"),
  SetIdentityDkimEnabledCommand: createCmd("SetIdentityDkimEnabledCommand"),
  SetIdentityMailFromDomainCommand: createCmd("SetIdentityMailFromDomainCommand"),
  GetIdentityMailFromDomainAttributesCommand: createCmd("GetIdentityMailFromDomainAttributesCommand"),
  ListVerifiedEmailAddressesCommand: createCmd("ListVerifiedEmailAddressesCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
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

async function put(path: string, body?: any) {
  return router.request(path, {
    method: "PUT",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

beforeEach(() => {
  mockSend.mockReset();
});

describe("SES Routes", () => {
  describe("Identities", () => {
    it("GET /identities — returns empty list when no identities", async () => {
      mockSend.mockResolvedValueOnce({ Identities: [] });
      const res = await get("/identities");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.identities).toEqual([]);
    });

    it("GET /identities — returns enriched identities", async () => {
      mockSend
        .mockResolvedValueOnce({ Identities: ["test@example.com"] })
        .mockResolvedValueOnce({
          VerificationAttributes: {
            "test@example.com": { VerificationStatus: "Success", VerificationToken: "token123" },
          },
        })
        .mockResolvedValueOnce({
          DkimAttributes: {
            "test@example.com": { DkimEnabled: true, DkimVerificationStatus: "Success" },
          },
        })
        .mockResolvedValueOnce({
          MailFromDomainAttributes: {
            "test@example.com": { MailFromDomain: "mail.example.com" },
          },
        });
      const res = await get("/identities");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.identities[0].identity).toBe("test@example.com");
      expect(body.identities[0].verificationStatus).toBe("Success");
      expect(body.identities[0].dkimEnabled).toBe(true);
      expect(body.identities[0].mailFromDomain).toBe("mail.example.com");
    });

    it("GET /identities — handles optional DKIM and MailFrom gracefully", async () => {
      mockSend
        .mockResolvedValueOnce({ Identities: ["test@example.com"] })
        .mockResolvedValueOnce({
          VerificationAttributes: {
            "test@example.com": { VerificationStatus: "Pending" },
          },
        })
        .mockResolvedValueOnce({ DkimAttributes: {} })
        .mockResolvedValueOnce({ MailFromDomainAttributes: {} });
      const res = await get("/identities");
      const body = await res.json();
      expect(body.identities[0].dkimEnabled).toBe(false);
      expect(body.identities[0].mailFromDomain).toBeNull();
    });

    it("GET /identities/:value — returns single identity detail", async () => {
      mockSend
        .mockResolvedValueOnce({
          VerificationAttributes: {
            "test@example.com": { VerificationStatus: "Success", VerificationToken: "tok" },
          },
        })
        .mockResolvedValueOnce({
          DkimAttributes: {
            "test@example.com": { DkimEnabled: true, DkimVerificationStatus: "Success" },
          },
        })
        .mockResolvedValueOnce({
          MailFromDomainAttributes: {
            "test@example.com": { MailFromDomain: "mail.example.com" },
          },
        });
      const res = await get("/identities/test%40example.com");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.identity).toBe("test@example.com");
      expect(body.verificationStatus).toBe("Success");
      expect(body.dkimEnabled).toBe(true);
    });

    it("POST /identities/verify-email — verifies email", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/identities/verify-email", { emailAddress: "test@example.com" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.initiated).toBe(true);
      expect(body.emailAddress).toBe("test@example.com");
    });

    it("POST /identities/verify-email — 400 when emailAddress missing", async () => {
      const res = await post("/identities/verify-email", {});
      expect(res.status).toBe(400);
    });

    it("POST /identities/verify-domain — verifies domain", async () => {
      mockSend.mockResolvedValueOnce({ VerificationToken: "domain-token" });
      const res = await post("/identities/verify-domain", { domain: "example.com" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.verificationToken).toBe("domain-token");
      expect(body.domain).toBe("example.com");
    });

    it("POST /identities/verify-domain — 400 when domain missing", async () => {
      const res = await post("/identities/verify-domain", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /identities/:value — deletes identity", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/identities/test%40example.com");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(body.identity).toBe("test@example.com");
    });
  });

  describe("DKIM", () => {
    it("PUT /identities/:value/dkim — enables DKIM", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/identities/test%40example.com/dkim", { enabled: true });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.dkimEnabled).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("SetIdentityDkimEnabledCommand");
    });
  });

  describe("Mail From", () => {
    it("PUT /identities/:value/mail-from — sets mail-from domain", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/identities/test%40example.com/mail-from", { mailFromDomain: "mail.example.com" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.mailFromDomain).toBe("mail.example.com");
    });

    it("PUT /identities/:value/mail-from — 400 when mailFromDomain missing", async () => {
      const res = await put("/identities/test%40example.com/mail-from", {});
      expect(res.status).toBe(400);
    });
  });

  describe("Send Email", () => {
    it("POST /send-email — sends email", async () => {
      mockSend.mockResolvedValueOnce({ MessageId: "msg-123" });
      const res = await post("/send-email", {
        source: "sender@example.com",
        toAddresses: ["recipient@example.com"],
        subject: "Hello",
        html: "<p>Hi</p>",
        text: "Hi",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.messageId).toBe("msg-123");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("SendEmailCommand");
    });

    it("POST /send-email — 400 when required fields missing", async () => {
      const res = await post("/send-email", {});
      expect(res.status).toBe(400);
    });

    it("POST /send-email — sends with only required fields", async () => {
      mockSend.mockResolvedValueOnce({ MessageId: "msg-456" });
      const res = await post("/send-email", {
        source: "sender@example.com",
        toAddresses: ["recipient@example.com"],
        subject: "Hello",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.messageId).toBe("msg-456");
    });
  });

  describe("Verified Emails", () => {
    it("GET /verified-emails — returns verified emails", async () => {
      mockSend.mockResolvedValueOnce({ VerifiedEmailAddresses: ["verified@example.com"] });
      const res = await get("/verified-emails");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.emails).toEqual(["verified@example.com"]);
    });

    it("GET /verified-emails — returns empty list when none", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/verified-emails");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.emails).toEqual([]);
    });
  });
});
