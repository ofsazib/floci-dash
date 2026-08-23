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
  DeleteVerifiedEmailAddressCommand: createCmd("DeleteVerifiedEmailAddressCommand"),
  GetAccountSendingEnabledCommand: createCmd("GetAccountSendingEnabledCommand"),
  UpdateAccountSendingEnabledCommand: createCmd("UpdateAccountSendingEnabledCommand"),
  GetSendQuotaCommand: createCmd("GetSendQuotaCommand"),
  GetSendStatisticsCommand: createCmd("GetSendStatisticsCommand"),
  SendRawEmailCommand: createCmd("SendRawEmailCommand"),
  VerifyEmailAddressCommand: createCmd("VerifyEmailAddressCommand"),
  GetIdentityNotificationAttributesCommand: createCmd("GetIdentityNotificationAttributesCommand"),
  SetIdentityNotificationTopicCommand: createCmd("SetIdentityNotificationTopicCommand"),
  SetIdentityFeedbackForwardingEnabledCommand: createCmd("SetIdentityFeedbackForwardingEnabledCommand"),
  SetIdentityHeadersInNotificationsEnabledCommand: createCmd("SetIdentityHeadersInNotificationsEnabledCommand"),
  ListConfigurationSetsCommand: createCmd("ListConfigurationSetsCommand"),
  CreateConfigurationSetCommand: createCmd("CreateConfigurationSetCommand"),
  DescribeConfigurationSetCommand: createCmd("DescribeConfigurationSetCommand"),
  DeleteConfigurationSetCommand: createCmd("DeleteConfigurationSetCommand"),
  CreateConfigurationSetEventDestinationCommand: createCmd("CreateConfigurationSetEventDestinationCommand"),
  UpdateConfigurationSetEventDestinationCommand: createCmd("UpdateConfigurationSetEventDestinationCommand"),
  DeleteConfigurationSetEventDestinationCommand: createCmd("DeleteConfigurationSetEventDestinationCommand"),
  UpdateConfigurationSetSendingEnabledCommand: createCmd("UpdateConfigurationSetSendingEnabledCommand"),
  CreateConfigurationSetTrackingOptionsCommand: createCmd("CreateConfigurationSetTrackingOptionsCommand"),
  UpdateConfigurationSetTrackingOptionsCommand: createCmd("UpdateConfigurationSetTrackingOptionsCommand"),
  DeleteConfigurationSetTrackingOptionsCommand: createCmd("DeleteConfigurationSetTrackingOptionsCommand"),
  UpdateConfigurationSetReputationMetricsEnabledCommand: createCmd("UpdateConfigurationSetReputationMetricsEnabledCommand"),
  PutConfigurationSetDeliveryOptionsCommand: createCmd("PutConfigurationSetDeliveryOptionsCommand"),
  ListTemplatesCommand: createCmd("ListTemplatesCommand"),
  CreateTemplateCommand: createCmd("CreateTemplateCommand"),
  UpdateTemplateCommand: createCmd("UpdateTemplateCommand"),
  DeleteTemplateCommand: createCmd("DeleteTemplateCommand"),
  GetTemplateCommand: createCmd("GetTemplateCommand"),
  SendTemplatedEmailCommand: createCmd("SendTemplatedEmailCommand"),
  TestRenderTemplateCommand: createCmd("TestRenderTemplateCommand"),
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

    it("GET /identities — returns empty when Identities key missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/identities");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.identities).toEqual([]);
      expect(mockSend).toHaveBeenCalledTimes(1); // short-circuits before enrichment
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

    it("GET /identities/:value — falls back to false/null when DKIM and MailFrom missing", async () => {
      mockSend
        .mockResolvedValueOnce({ VerificationAttributes: { "test@example.com": { VerificationStatus: "Pending" } } })
        .mockResolvedValueOnce({ DkimAttributes: {} })
        .mockResolvedValueOnce({ MailFromDomainAttributes: {} });
      const res = await get("/identities/test%40example.com");
      const body = await res.json();
      expect(body.dkimEnabled).toBe(false);
      expect(body.mailFromDomain).toBeNull();
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

    it("POST /verified-emails — verifies an email address", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/verified-emails", { emailAddress: "  new@example.com  " });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.emailAddress).toBe("new@example.com");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("VerifyEmailAddressCommand");
      expect(cmd.EmailAddress).toBe("new@example.com");
    });

    it("POST /verified-emails — 400 when emailAddress missing", async () => {
      const res = await post("/verified-emails", {});
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("POST /verified-emails — 400 for blank emailAddress", async () => {
      const res = await post("/verified-emails", { emailAddress: "   " });
      expect(res.status).toBe(400);
    });

    it("DELETE /verified-emails/:email — deletes a verified email", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del(`/verified-emails/${encodeURIComponent("test@example.com")}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.emailAddress).toBe("test@example.com");
      expect(body.deleted).toBe(true);
    });
  });

  describe("Account sending stats", () => {
    it("GET /account/sending-enabled — returns enabled when true", async () => {
      mockSend.mockResolvedValueOnce({ Enabled: true });
      const res = await get("/account/sending-enabled");
      const body = await res.json();
      expect(body.enabled).toBe(true);
    });

    it("GET /account/sending-enabled — defaults to false when absent", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/account/sending-enabled");
      const body = await res.json();
      expect(body.enabled).toBe(false);
    });

    it("PUT /account/sending-enabled — enables sending", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/account/sending-enabled", { enabled: true });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateAccountSendingEnabledCommand");
      expect(mockSend.mock.calls[0][0].Enabled).toBe(true);
    });

    it("PUT /account/sending-enabled — disables sending with falsy value", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/account/sending-enabled", { enabled: false });
      const body = await res.json();
      expect(body.enabled).toBe(false);
    });

    it("GET /account/send-quota — returns quota numbers", async () => {
      mockSend.mockResolvedValueOnce({ Max24HourSend: 50000, MaxSendRate: 14, SentLast24Hours: 1234 });
      const res = await get("/account/send-quota");
      const body = await res.json();
      expect(body.max24HourSend).toBe(50000);
      expect(body.maxSendRate).toBe(14);
      expect(body.sentLast24Hours).toBe(1234);
    });

    it("GET /account/send-statistics — maps data points", async () => {
      mockSend.mockResolvedValueOnce({
        SendDataPoints: [
          {
            Timestamp: new Date("2026-01-01T00:00:00Z"),
            DeliveryAttempts: 10,
            Rejects: 1,
            Complaints: 0,
            Bounces: 2,
          },
        ],
      });
      const res = await get("/account/send-statistics");
      const body = await res.json();
      expect(body.sendDataPoints[0].timestamp).toBe("2026-01-01T00:00:00.000Z");
      expect(body.sendDataPoints[0].deliveryAttempts).toBe(10);
      expect(body.sendDataPoints[0].bounces).toBe(2);
    });

    it("GET /account/send-statistics — sparse data point defaults timestamp to null", async () => {
      mockSend.mockResolvedValueOnce({ SendDataPoints: [{ DeliveryAttempts: 1 }] });
      const res = await get("/account/send-statistics");
      const body = await res.json();
      expect(body.sendDataPoints[0].timestamp).toBeNull();
    });

    it("GET /account/send-statistics — empty data points", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/account/send-statistics");
      const body = await res.json();
      expect(body.sendDataPoints).toEqual([]);
    });
  });

  describe("Raw email", () => {
    it("POST /send-raw — sends raw message with source and destinations", async () => {
      mockSend.mockResolvedValueOnce({ MessageId: "raw-msg-1" });
      const res = await post("/send-raw", {
        rawMessage: "From: a@b.c\nSubject: hi\n\nbody",
        source: "sender@example.com",
        destinations: ["to@example.com"],
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.messageId).toBe("raw-msg-1");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("SendRawEmailCommand");
      expect(cmd.Source).toBe("sender@example.com");
      expect(cmd.Destinations).toEqual(["to@example.com"]);
      expect(cmd.RawMessage.Data).toBeInstanceOf(Uint8Array);
    });

    it("POST /send-raw — omits source/destinations when absent", async () => {
      mockSend.mockResolvedValueOnce({ MessageId: "m2" });
      const res = await post("/send-raw", { rawMessage: "Subject: x\n\nbody" });
      const body = await res.json();
      expect(body.messageId).toBe("m2");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.Source).toBeUndefined();
      expect(cmd.Destinations).toBeUndefined();
    });

    it("POST /send-raw — omits destinations when empty array", async () => {
      mockSend.mockResolvedValueOnce({ MessageId: "m3" });
      const res = await post("/send-raw", { rawMessage: "Subject: x\n\nbody", destinations: [] });
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.Destinations).toBeUndefined();
    });

    it("POST /send-raw — 400 when rawMessage missing", async () => {
      const res = await post("/send-raw", {});
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("Notification Attributes", () => {
    it("GET /identities/:value/notification-attributes — returns attributes", async () => {
      mockSend.mockResolvedValueOnce({
        NotificationAttributes: {
          "test@example.com": {
            BounceTopic: { TopicArn: "arn:sns:bounce" },
            ComplaintTopic: { TopicArn: "arn:sns:complaint" },
            DeliveryTopic: null,
            ForwardingEnabled: true,
            HeadersInBounceNotificationsEnabled: true,
            HeadersInComplaintNotificationsEnabled: false,
            HeadersInDeliveryNotificationsEnabled: true,
          },
        },
      });
      const res = await get("/identities/test%40example.com/notification-attributes");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.identity).toBe("test@example.com");
      expect(body.bounceTopic.TopicArn).toBe("arn:sns:bounce");
      expect(body.deliveryTopic).toBeNull();
      expect(body.forwardingEnabled).toBe(true);
      expect(body.headersInBounceNotifications).toBe(true);
      expect(body.headersInComplaintNotifications).toBe(false);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetIdentityNotificationAttributesCommand");
    });

    it("GET /identities/:value/notification-attributes — returns nulls when no attrs", async () => {
      mockSend.mockResolvedValueOnce({ NotificationAttributes: {} });
      const res = await get("/identities/test%40example.com/notification-attributes");
      const body = await res.json();
      expect(body.bounceTopic).toBeNull();
      expect(body.complaintTopic).toBeNull();
      expect(body.deliveryTopic).toBeNull();
      expect(body.forwardingEnabled).toBe(true); // defaults to true
    });
  });

  describe("Set Notification Topic", () => {
    it("PUT /identities/:value/notification-topic — sets topic", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/identities/test%40example.com/notification-topic", {
        notificationType: "Bounce",
        snsTopic: "arn:sns:bounce",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(body.notificationType).toBe("Bounce");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("SetIdentityNotificationTopicCommand");
      expect(mockSend.mock.calls[0][0].NotificationType).toBe("Bounce");
      expect(mockSend.mock.calls[0][0].SnsTopic).toBe("arn:sns:bounce");
    });

    it("PUT /identities/:value/notification-topic — clears topic when snsTopic omitted", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/identities/test%40example.com/notification-topic", {
        notificationType: "Delivery",
      });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].SnsTopic).toBeUndefined();
    });

    it("PUT /identities/:value/notification-topic — 400 when notificationType missing", async () => {
      const res = await put("/identities/test%40example.com/notification-topic", { snsTopic: "arn:sns:bounce" });
      expect(res.status).toBe(400);
    });
  });

  describe("Feedback Forwarding", () => {
    it("PUT /identities/:value/feedback-forwarding — enables forwarding", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/identities/test%40example.com/feedback-forwarding", { forwardingEnabled: true });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.forwardingEnabled).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("SetIdentityFeedbackForwardingEnabledCommand");
      expect(mockSend.mock.calls[0][0].ForwardingEnabled).toBe(true);
    });

    it("PUT /identities/:value/feedback-forwarding — disables forwarding", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/identities/test%40example.com/feedback-forwarding", { forwardingEnabled: false });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].ForwardingEnabled).toBe(false);
    });

    it("PUT /identities/:value/feedback-forwarding — 400 when forwardingEnabled not boolean", async () => {
      const res = await put("/identities/test%40example.com/feedback-forwarding", { forwardingEnabled: "true" });
      expect(res.status).toBe(400);
    });
  });

  describe("Headers in Notifications", () => {
    it("PUT /identities/:value/headers-in-notifications — enables headers", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/identities/test%40example.com/headers-in-notifications", {
        notificationType: "Bounce",
        enabled: true,
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.enabled).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("SetIdentityHeadersInNotificationsEnabledCommand");
      expect(mockSend.mock.calls[0][0].NotificationType).toBe("Bounce");
      expect(mockSend.mock.calls[0][0].Enabled).toBe(true);
    });

    it("PUT /identities/:value/headers-in-notifications — 400 when notificationType missing", async () => {
      const res = await put("/identities/test%40example.com/headers-in-notifications", { enabled: true });
      expect(res.status).toBe(400);
    });

    it("PUT /identities/:value/headers-in-notifications — 400 when enabled not boolean", async () => {
      const res = await put("/identities/test%40example.com/headers-in-notifications", {
        notificationType: "Complaint",
        enabled: 1,
      });
      expect(res.status).toBe(400);
    });
  });

  describe("Configuration Sets", () => {
    it("GET /configuration-sets — lists sets", async () => {
      mockSend.mockResolvedValueOnce({ ConfigurationSets: [{ Name: "cs1" }, { Name: "cs2" }] });
      const res = await get("/configuration-sets");
      const body = await res.json();
      expect(body.configurationSets).toHaveLength(2);
      expect(body.total).toBe(2);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListConfigurationSetsCommand");
    });

    it("GET /configuration-sets — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/configuration-sets");
      const body = await res.json();
      expect(body.configurationSets).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("POST /configuration-sets — creates set", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/configuration-sets", { name: "my-cs" });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateConfigurationSetCommand");
      expect(mockSend.mock.calls[0][0].ConfigurationSet.Name).toBe("my-cs");
    });

    it("POST /configuration-sets — 400 when name missing", async () => {
      const res = await post("/configuration-sets", {});
      expect(res.status).toBe(400);
    });

    it("GET /configuration-sets/:name — describes set", async () => {
      mockSend.mockResolvedValueOnce({
        ConfigurationSet: { Name: "my-cs" },
        EventDestinations: [{ Name: "ed1", MatchingEventTypes: ["send"] }],
      });
      const res = await get("/configuration-sets/my-cs");
      const body = await res.json();
      expect(body.name).toBe("my-cs");
      expect(body.eventDestinations).toHaveLength(1);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DescribeConfigurationSetCommand");
    });

    it("GET /configuration-sets/:name — returns empty eventDestinations when missing", async () => {
      mockSend.mockResolvedValueOnce({ ConfigurationSet: { Name: "no-events" } });
      const res = await get("/configuration-sets/no-events");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.name).toBe("no-events");
      expect(body.eventDestinations).toEqual([]);
      expect(body.trackingOptions).toBeNull();
    });

    it("GET /configuration-sets/:name — 404 when not found", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/configuration-sets/nonexistent");
      expect(res.status).toBe(404);
    });

    it("DELETE /configuration-sets/:name — deletes set", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/configuration-sets/my-cs");
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteConfigurationSetCommand");
    });
  });

  describe("Event Destinations", () => {
    it("POST /configuration-sets/:name/event-destinations — creates destination", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/configuration-sets/my-cs/event-destinations", {
        eventDestinationName: "ed1",
        matchingEventTypes: ["send", "bounce"],
        snsTopicARN: "arn:sns:bounce",
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateConfigurationSetEventDestinationCommand");
      expect(mockSend.mock.calls[0][0].EventDestination.Name).toBe("ed1");
      expect(mockSend.mock.calls[0][0].EventDestination.SNSDestination.TopicARN).toBe("arn:sns:bounce");
    });

    it("POST /configuration-sets/:name/event-destinations — 400 when matchingEventTypes missing", async () => {
      const res = await post("/configuration-sets/my-cs/event-destinations", { eventDestinationName: "ed1" });
      expect(res.status).toBe(400);
    });

    it("POST — supports cloudWatch and firehose destinations without SNS", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/configuration-sets/my-cs/event-destinations", {
        eventDestinationName: "ed2",
        matchingEventTypes: ["open"],
        cloudWatchDestination: {
          DimensionConfigurations: [
            { DimensionName: "d", DimensionValueSource: "messageTag", DefaultDimensionValue: "v" },
          ],
        },
        kinesisFirehoseDestination: { DeliveryStreamARN: "arn:firehose" },
      });
      expect(res.status).toBe(201);
      const dest = mockSend.mock.calls[0][0].EventDestination;
      expect(dest.CloudWatchDestination).toBeDefined();
      expect(dest.KinesisFirehoseDestination.DeliveryStreamARN).toBe("arn:firehose");
      expect(dest.SNSDestination).toBeUndefined();
    });

    it("POST /configuration-sets/:name/event-destinations — 400 when missing params", async () => {
      const res = await post("/configuration-sets/my-cs/event-destinations", {});
      expect(res.status).toBe(400);
    });

    it("PUT — updates destination", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/configuration-sets/my-cs/event-destinations/ed1", {
        matchingEventTypes: ["delivery"],
      });
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateConfigurationSetEventDestinationCommand");
    });

    it("PUT — 400 when matchingEventTypes missing", async () => {
      const res = await put("/configuration-sets/my-cs/event-destinations/ed1", {});
      expect(res.status).toBe(400);
    });

    it("PUT — supports SNS, cloudWatch, and firehose destinations", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/configuration-sets/my-cs/event-destinations/ed1", {
        matchingEventTypes: ["send"],
        snsTopicARN: "arn:sns:send",
        cloudWatchDestination: { DimensionConfigurations: [] },
        kinesisFirehoseDestination: { DeliveryStreamARN: "arn:firehose" },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      const dest = mockSend.mock.calls[0][0].EventDestination;
      expect(dest.SNSDestination.TopicARN).toBe("arn:sns:send");
      expect(dest.CloudWatchDestination).toBeDefined();
      expect(dest.KinesisFirehoseDestination).toBeDefined();
    });

    it("DELETE — deletes destination", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/configuration-sets/my-cs/event-destinations/ed1");
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteConfigurationSetEventDestinationCommand");
    });
  });

  describe("Config Set Features", () => {
    it("PUT sending-enabled — enables", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/configuration-sets/my-cs/sending-enabled", { enabled: true });
      const body = await res.json();
      expect(body.sendingEnabled).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateConfigurationSetSendingEnabledCommand");
    });

    it("PUT sending-enabled — 400 when not boolean", async () => {
      const res = await put("/configuration-sets/my-cs/sending-enabled", { enabled: "yes" });
      expect(res.status).toBe(400);
    });

    it("POST tracking-options — creates domain", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/configuration-sets/my-cs/tracking-options", { customRedirectDomain: "click.example.com" });
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateConfigurationSetTrackingOptionsCommand");
      expect(mockSend.mock.calls[0][0].TrackingOptions.CustomRedirectDomain).toBe("click.example.com");
    });

    it("POST tracking-options — 400 when missing domain", async () => {
      const res = await post("/configuration-sets/my-cs/tracking-options", {});
      expect(res.status).toBe(400);
    });

    it("PUT tracking-options — updates domain", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/configuration-sets/my-cs/tracking-options", { customRedirectDomain: "updated.example.com" });
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateConfigurationSetTrackingOptionsCommand");
      expect(mockSend.mock.calls[0][0].TrackingOptions.CustomRedirectDomain).toBe("updated.example.com");
    });

    it("PUT tracking-options — 400 when missing domain", async () => {
      const res = await put("/configuration-sets/my-cs/tracking-options", {});
      expect(res.status).toBe(400);
    });

    it("DELETE tracking-options — removes", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/configuration-sets/my-cs/tracking-options");
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteConfigurationSetTrackingOptionsCommand");
    });

    it("PUT reputation-metrics — enables", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/configuration-sets/my-cs/reputation-metrics", { enabled: false });
      const body = await res.json();
      expect(body.reputationMetricsEnabled).toBe(false);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateConfigurationSetReputationMetricsEnabledCommand");
    });

    it("PUT reputation-metrics — 400 when not boolean", async () => {
      const res = await put("/configuration-sets/my-cs/reputation-metrics", {});
      expect(res.status).toBe(400);
    });

    it("PUT delivery-options — sets TLS policy", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/configuration-sets/my-cs/delivery-options", { tlsPolicy: "Require" });
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("PutConfigurationSetDeliveryOptionsCommand");
      expect(mockSend.mock.calls[0][0].DeliveryOptions.TlsPolicy).toBe("Require");
    });
  });

  describe("Templates", () => {
    it("GET /templates — lists template metadata", async () => {
      mockSend.mockResolvedValueOnce({ TemplatesMetadata: [{ Name: "welcome", CreatedTimestamp: new Date(0) }] });
      const res = await get("/templates");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.templates[0].name).toBe("welcome");
      expect(body.total).toBe(1);
    });

    it("GET /templates — empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/templates");
      const body = await res.json();
      expect(body.templates).toEqual([]);
    });

    it("POST /templates — creates with parts", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/templates", {
        name: "welcome",
        subject: "Hi {{name}}",
        text: "Hello",
        html: "<p>Hello</p>",
      });
      expect(res.status).toBe(201);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("CreateTemplateCommand");
      expect(cmd.Template.TemplateName).toBe("welcome");
      expect(cmd.Template.SubjectPart).toBe("Hi {{name}}");
    });

    it("POST /templates — 400 without name", async () => {
      const res = await post("/templates", { subject: "x" });
      expect(res.status).toBe(400);
    });

    it("PUT /templates/:name — updates parts", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/templates/welcome", { subject: "New" });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("UpdateTemplateCommand");
      expect(cmd.Template.TemplateName).toBe("welcome");
      expect(cmd.Template.SubjectPart).toBe("New");
    });

    it("GET /templates/:name — maps the template", async () => {
      mockSend.mockResolvedValueOnce({
        Template: { TemplateName: "welcome", SubjectPart: "s", TextPart: "t", HtmlPart: "<b>h</b>" },
      });
      const res = await get("/templates/welcome");
      const body = await res.json();
      expect(body.template).toEqual({ name: "welcome", subject: "s", text: "t", html: "<b>h</b>" });
    });

    it("GET /templates/:name — null when missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/templates/none");
      expect((await res.json()).template).toBeNull();
    });

    it("DELETE /templates/:name — deletes", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/templates/welcome");
      expect((await res.json()).deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteTemplateCommand");
    });

    it("POST /templates/:name/render — returns rendered body", async () => {
      mockSend.mockResolvedValueOnce({ RenderedTemplate: "<p>Hello World</p>" });
      const res = await post("/templates/welcome/render", { templateData: '{"name":"World"}' });
      const body = await res.json();
      expect(body.rendered).toBe("<p>Hello World</p>");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("TestRenderTemplateCommand");
      expect(cmd.TemplateData).toBe('{"name":"World"}');
    });

    it("POST /templates/:name/render — defaults template data", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/templates/welcome/render", {});
      expect(mockSend.mock.calls[0][0].TemplateData).toBe("{}");
    });

    it("POST /send-templated — sends with template", async () => {
      mockSend.mockResolvedValueOnce({ MessageId: "m-1" });
      const res = await post("/send-templated", {
        source: "sender@example.com",
        template: "welcome",
        destination: { to: ["to@example.com"] },
        templateData: '{"name":"World"}',
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.messageId).toBe("m-1");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("SendTemplatedEmailCommand");
      expect(cmd.Source).toBe("sender@example.com");
      expect(cmd.Template).toBe("welcome");
    });

    it("POST /send-templated — defaults template data", async () => {
      mockSend.mockResolvedValueOnce({ MessageId: "m" });
      const res = await post("/send-templated", {
        source: "s@e.com",
        template: "t",
        destination: { to: ["x@y.z"] },
      });
      expect(mockSend.mock.calls[0][0].TemplateData).toBe("{}");
    });

    it("POST /send-templated — 400 without source", async () => {
      const res = await post("/send-templated", { template: "t", destination: { to: ["x"] } });
      expect(res.status).toBe(400);
    });

    it("POST /send-templated — 400 without template", async () => {
      const res = await post("/send-templated", { source: "s", destination: { to: ["x"] } });
      expect(res.status).toBe(400);
    });

    it("POST /send-templated — 400 without destination", async () => {
      const res = await post("/send-templated", { source: "s", template: "t" });
      expect(res.status).toBe(400);
    });
  });
});
