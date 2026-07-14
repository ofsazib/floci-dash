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

    it("PUT tracking-options — sets domain", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/configuration-sets/my-cs/tracking-options", { customRedirectDomain: "click.example.com" });
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateConfigurationSetTrackingOptionsCommand");
      expect(mockSend.mock.calls[0][0].TrackingOptions.CustomRedirectDomain).toBe("click.example.com");
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
});
