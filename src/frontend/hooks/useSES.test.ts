// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useSESIdentities,
  useSESVerifyEmail,
  useSESVerifyDomain,
  useSESDeleteIdentity,
  useSESSendEmail,
  useSESVerifiedEmails,
  useSESVerifyEmailAddress,
  useSESDeleteVerifiedEmail,
  useSESSendingEnabled,
  useSESSetSendingEnabled,
  useSESAccountDetails,
  usePutSESAccountDetails,
  useSESSendQuota,
  useSESSendStatistics,
  useSESSendRawEmail,
  useSESNotificationAttributes,
  useSESSetNotificationTopic,
  useSESSetFeedbackForwarding,
  useSESSetHeadersInNotifications,
  useSESSetDkimEnabled,
  useSESSetMailFromDomain,
  useConfigurationSets,
  useCreateConfigurationSet,
  useDescribeConfigurationSet,
  useDeleteConfigurationSet,
  useCreateEventDestination,
  useUpdateEventDestination,
  useDeleteEventDestination,
  useSetConfigSendingEnabled,
  useCreateTrackingOptions,
  useUpdateTrackingOptions,
  useDeleteTrackingOptions,
  useSetReputationMetrics,
  useSetDeliveryOptions,
  useSESTemplates,
  useCreateSESTemplate,
  useUpdateSESTemplate,
  useDeleteSESTemplate,
  useRenderSESTemplate,
  useSESSendTemplated,
  useSESv2Identities,
  useSendSESv1BulkTemplated,
  useSESv1CVETs,
  useCreateSESv1CVET,
  useDeleteSESv1CVET,
  useSendSESv1CustomVerification,
  useVerifySESv1DomainDkim,
  useSESv1IdentityPolicies,
  useSESv1ReceiptRuleSets,
  useCreateSESv1ReceiptRuleSet,
  useDeleteSESv1ReceiptRuleSet,
  useActivateSESv1ReceiptRuleSet,
  useCreateSESv2Identity,
  useDeleteSESv2Identity,
  useSendSESv2Email,
  useSESv2Templates,
  useCreateSESv2Template,
  useDeleteSESv2Template,
  useSESv2ConfigurationSets,
  useCreateSESv2ConfigurationSet,
  useDeleteSESv2ConfigurationSet,
  usePutSESv2ConfigSetOptions,
  useSESv2DedicatedIpPools,
  useCreateSESv2DedicatedIpPool,
  useDeleteSESv2DedicatedIpPool,
  useSESv2ContactLists,
  useCreateSESv2ContactList,
  useDeleteSESv2ContactList,
  useSESv2Contacts,
  useCreateSESv2Contact,
  useDeleteSESv2Contact,
  useSESv2SuppressionList,
  useSuppressSESv2Destination,
  useDeleteSESv2SuppressedDestination,
  useSESv2Account,
  useSESv2CustomVerificationTemplates,
  useCreateSESv2CustomVerificationTemplate,
  useDeleteSESv2CustomVerificationTemplate,
  useSESv2ConfigSetEventDestinations,
  useSESv2TemplateRender,
} from "./useSES";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── IDENTITIES ──────────────────────────────────────────

describe("useSESIdentities", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ identities: [], total: 0 });
    const { result } = renderHook(() => useSESIdentities(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/email/identities");
  });

  it("forwards error", async () => {
    mockApi.mockRejectedValueOnce(new Error("fail"));
    const { result } = renderHook(() => useSESIdentities(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ─── VERIFY EMAIL ────────────────────────────────────────

describe("useSESVerifyEmail", () => {
  it("calls api with POST method and body", async () => {
    mockApi.mockResolvedValueOnce({ emailAddress: "a@b.com", initiated: true });
    const { result } = renderHook(() => useSESVerifyEmail(), { wrapper: createWrapper() });
    await result.current.mutateAsync("a@b.com");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/email/identities/verify-email",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ emailAddress: "a@b.com" }),
      })
    );
  });

  it("invalidates identities query on success", async () => {
    mockApi.mockResolvedValueOnce({ emailAddress: "a@b.com", initiated: true });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useSESVerifyEmail(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync("a@b.com");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "ses", "identities"] });
  });
});

// ─── VERIFY DOMAIN ───────────────────────────────────────

describe("useSESVerifyDomain", () => {
  it("calls api with POST method and body", async () => {
    mockApi.mockResolvedValueOnce({ domain: "example.com", verificationToken: "tok" });
    const { result } = renderHook(() => useSESVerifyDomain(), { wrapper: createWrapper() });
    await result.current.mutateAsync("example.com");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/email/identities/verify-domain",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ domain: "example.com" }),
      })
    );
  });

  it("invalidates identities query on success", async () => {
    mockApi.mockResolvedValueOnce({ domain: "example.com", verificationToken: "tok" });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useSESVerifyDomain(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync("example.com");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "ses", "identities"] });
  });
});

// ─── DELETE IDENTITY ─────────────────────────────────────

describe("useSESDeleteIdentity", () => {
  it("calls api with DELETE method and encoded value in path", async () => {
    mockApi.mockResolvedValueOnce({ identity: "a@b.com", deleted: true });
    const { result } = renderHook(() => useSESDeleteIdentity(), { wrapper: createWrapper() });
    await result.current.mutateAsync("a@b.com");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/email/identities/a%40b.com",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("invalidates identities query on success", async () => {
    mockApi.mockResolvedValueOnce({ identity: "a@b.com", deleted: true });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useSESDeleteIdentity(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync("a@b.com");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "ses", "identities"] });
  });
});

// ─── SEND EMAIL ──────────────────────────────────────────

describe("useSESSendEmail", () => {
  it("calls api with POST method and body", async () => {
    mockApi.mockResolvedValueOnce({ messageId: "msg-001" });
    const { result } = renderHook(() => useSESSendEmail(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      source: "sender@example.com",
      toAddresses: ["recipient@example.com"],
      subject: "Hello",
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/email/send-email",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          source: "sender@example.com",
          toAddresses: ["recipient@example.com"],
          subject: "Hello",
        }),
      })
    );
  });
});

// ─── VERIFIED EMAILS ─────────────────────────────────────

describe("useSESVerifiedEmails", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ emails: ["a@b.com"], total: 1 });
    const { result } = renderHook(() => useSESVerifiedEmails(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/email/verified-emails");
  });

  it("forwards error", async () => {
    mockApi.mockRejectedValueOnce(new Error("fail"));
    const { result } = renderHook(() => useSESVerifiedEmails(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useSESVerifyEmailAddress", () => {
  it("calls api with POST method and email body", async () => {
    mockApi.mockResolvedValueOnce({ emailAddress: "new@b.com", verified: true });
    const { result } = renderHook(() => useSESVerifyEmailAddress(), { wrapper: createWrapper() });
    await result.current.mutateAsync("new@b.com");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/email/verified-emails",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ emailAddress: "new@b.com" }),
      }),
    );
  });
});

describe("useSESDeleteVerifiedEmail", () => {
  it("calls api with DELETE method and encoded email", async () => {
    mockApi.mockResolvedValueOnce({ emailAddress: "a@b.com", deleted: true });
    const { result } = renderHook(() => useSESDeleteVerifiedEmail(), { wrapper: createWrapper() });
    await result.current.mutateAsync("a@b.com");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/email/verified-emails/a%40b.com",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("useSESSendingEnabled", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ enabled: true });
    const { result } = renderHook(() => useSESSendingEnabled(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/email/account/sending-enabled");
  });
});

describe("useSESSetSendingEnabled", () => {
  it("calls api with PUT method and enabled body", async () => {
    mockApi.mockResolvedValueOnce({ enabled: false, updated: true });
    const { result } = renderHook(() => useSESSetSendingEnabled(), { wrapper: createWrapper() });
    await result.current.mutateAsync(false);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/email/account/sending-enabled",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ enabled: false }),
      }),
    );
  });
});

describe("useSESSendQuota", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ max24HourSend: 50000, maxSendRate: 14, sentLast24Hours: 10 });
    const { result } = renderHook(() => useSESSendQuota(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/email/account/send-quota");
  });
});

describe("useSESSendStatistics", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ sendDataPoints: [] });
    const { result } = renderHook(() => useSESSendStatistics(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/email/account/send-statistics");
  });
});

describe("useSESSendRawEmail", () => {
  it("calls api with POST method and raw body", async () => {
    mockApi.mockResolvedValueOnce({ messageId: "m1" });
    const { result } = renderHook(() => useSESSendRawEmail(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ rawMessage: "Subject: x\n\nbody", source: "a@b.c" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/email/send-raw",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ rawMessage: "Subject: x\n\nbody", source: "a@b.c" }),
      }),
    );
  });
});

// ─── NOTIFICATION ATTRIBUTES ────────────────────────────

describe("useSESNotificationAttributes", () => {
  it("does NOT call api when identity is null", () => {
    renderHook(() => useSESNotificationAttributes(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with URL-encoded identity", async () => {
    mockApi.mockResolvedValueOnce({
      identity: "test@example.com",
      bounceTopic: null,
      complaintTopic: null,
      deliveryTopic: null,
      forwardingEnabled: true,
    });
    const { result } = renderHook(() => useSESNotificationAttributes("test@example.com"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/email/identities/test%40example.com/notification-attributes");
  });
});

describe("useSESSetNotificationTopic", () => {
  it("calls api with PUT method and body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSESSetNotificationTopic(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      identity: "test@example.com",
      notificationType: "Bounce",
      snsTopic: "arn:sns:bounce",
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/email/identities/test%40example.com/notification-topic",
      expect.objectContaining({ method: "PUT" })
    );
    const callArgs = mockApi.mock.calls[0][1];
    expect(JSON.parse(callArgs.body)).toEqual({
      notificationType: "Bounce",
      snsTopic: "arn:sns:bounce",
    });
  });
});

describe("useSESSetFeedbackForwarding", () => {
  it("calls api with PUT method and body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSESSetFeedbackForwarding(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ identity: "test@example.com", forwardingEnabled: false });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/email/identities/test%40example.com/feedback-forwarding",
      expect.objectContaining({ method: "PUT" })
    );
    const callArgs = mockApi.mock.calls[0][1];
    expect(JSON.parse(callArgs.body)).toEqual({ forwardingEnabled: false });
  });
});

describe("useSESSetHeadersInNotifications", () => {
  it("calls api with PUT method and body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSESSetHeadersInNotifications(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      identity: "test@example.com",
      notificationType: "Complaint",
      enabled: true,
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/email/identities/test%40example.com/headers-in-notifications",
      expect.objectContaining({ method: "PUT" })
    );
    const callArgs = mockApi.mock.calls[0][1];
    expect(JSON.parse(callArgs.body)).toEqual({
      notificationType: "Complaint",
      enabled: true,
    });
  });
});

// ─── DKIM ────────────────────────────────────────────────

describe("useSESSetDkimEnabled", () => {
  it("calls api with PUT method and body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSESSetDkimEnabled(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ identity: "test@example.com", enabled: false });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/email/identities/test%40example.com/dkim",
      expect.objectContaining({ method: "PUT" })
    );
    const callArgs = mockApi.mock.calls[0][1];
    expect(JSON.parse(callArgs.body)).toEqual({ enabled: false });
  });
});

// ─── MAIL FROM ───────────────────────────────────────────

describe("useSESSetMailFromDomain", () => {
  it("calls api with PUT method and body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSESSetMailFromDomain(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ identity: "test@example.com", mailFromDomain: "mail.example.com" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/email/identities/test%40example.com/mail-from",
      expect.objectContaining({ method: "PUT" })
    );
    const callArgs = mockApi.mock.calls[0][1];
    expect(JSON.parse(callArgs.body)).toEqual({ mailFromDomain: "mail.example.com" });
  });
});

// ─── CONFIGURATION SETS ─────────────────────────────────

describe("useConfigurationSets", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ configurationSets: [], total: 0 });
    const { result } = renderHook(() => useConfigurationSets(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/email/configuration-sets");
  });
});

describe("useCreateConfigurationSet", () => {
  it("calls api with POST method and name", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateConfigurationSet(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my-cs");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/email/configuration-sets",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("useDescribeConfigurationSet", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useDescribeConfigurationSet(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with URL-encoded name", async () => {
    mockApi.mockResolvedValueOnce({ name: "cs1", eventDestinations: [], trackingOptions: null, deliveryOptions: null, reputationOptions: null });
    const { result } = renderHook(() => useDescribeConfigurationSet("my set"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/email/configuration-sets/my%20set");
  });
});

describe("useDeleteConfigurationSet", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteConfigurationSet(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my-cs");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/email/configuration-sets/my-cs",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("useCreateEventDestination", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateEventDestination(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      configSetName: "cs1",
      eventDestinationName: "ed1",
      matchingEventTypes: ["send"],
      snsTopicARN: "arn:sns:1",
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/email/configuration-sets/cs1/event-destinations",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("useDeleteEventDestination", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteEventDestination(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ configSetName: "cs1", eventDestinationName: "ed1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/email/configuration-sets/cs1/event-destinations/ed1",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("useUpdateEventDestination", () => {
  it("calls api with PUT method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUpdateEventDestination(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      configSetName: "cs1",
      eventDestinationName: "ed1",
      matchingEventTypes: ["send", "bounce"],
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/email/configuration-sets/cs1/event-destinations/ed1",
      expect.objectContaining({ method: "PUT" })
    );
  });
});

describe("useSetConfigSendingEnabled", () => {
  it("calls api with PUT method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSetConfigSendingEnabled(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ configSetName: "cs1", enabled: false });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/email/configuration-sets/cs1/sending-enabled",
      expect.objectContaining({ method: "PUT" })
    );
  });
});

describe("useCreateTrackingOptions", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateTrackingOptions(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ configSetName: "cs1", customRedirectDomain: "click.example.com" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/email/configuration-sets/cs1/tracking-options",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("useUpdateTrackingOptions", () => {
  it("calls api with PUT method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUpdateTrackingOptions(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ configSetName: "cs1", customRedirectDomain: "click.example.com" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/email/configuration-sets/cs1/tracking-options",
      expect.objectContaining({ method: "PUT" })
    );
  });
});

describe("useDeleteTrackingOptions", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteTrackingOptions(), { wrapper: createWrapper() });
    await result.current.mutateAsync("cs1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/email/configuration-sets/cs1/tracking-options",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("useSetReputationMetrics", () => {
  it("calls api with PUT method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSetReputationMetrics(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ configSetName: "cs1", enabled: true });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/email/configuration-sets/cs1/reputation-metrics",
      expect.objectContaining({ method: "PUT" })
    );
  });
});

describe("useSetDeliveryOptions", () => {
  it("calls api with PUT method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSetDeliveryOptions(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ configSetName: "cs1", tlsPolicy: "Require" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/email/configuration-sets/cs1/delivery-options",
      expect.objectContaining({ method: "PUT" })
    );
  });
});

describe("SES template hooks", () => {
  it("useSESTemplates fetches the list", async () => {
    mockApi.mockResolvedValueOnce({ templates: [], total: 0 });
    const { result } = renderHook(() => useSESTemplates(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ses/templates");
  });

  it("useCreateSESTemplate posts the body", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => useCreateSESTemplate(), { wrapper: createWrapper() });
    result.current.mutate({ name: "welcome", subject: "s" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ses/templates", {
      method: "POST",
      body: JSON.stringify({ name: "welcome", subject: "s" }),
    });
  });

  it("useUpdateSESTemplate puts by name", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateSESTemplate(), { wrapper: createWrapper() });
    result.current.mutate({ name: "welcome", subject: "new" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ses/templates/welcome", {
      method: "PUT",
      body: JSON.stringify({ subject: "new", text: undefined, html: undefined }),
    });
  });

  it("useDeleteSESTemplate deletes by encoded name", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteSESTemplate(), { wrapper: createWrapper() });
    result.current.mutate("my template");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ses/templates/my%20template", { method: "DELETE" });
  });

  it("useRenderSESTemplate posts render", async () => {
    mockApi.mockResolvedValueOnce({ rendered: "x" });
    const { result } = renderHook(() => useRenderSESTemplate(), { wrapper: createWrapper() });
    result.current.mutate({ name: "welcome", templateData: "{}" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ses/templates/welcome/render", {
      method: "POST",
      body: JSON.stringify({ templateData: "{}" }),
    });
  });

  it("useSESSendTemplated posts the send", async () => {
    mockApi.mockResolvedValueOnce({ messageId: "m1" });
    const { result } = renderHook(() => useSESSendTemplated(), { wrapper: createWrapper() });
    result.current.mutate({ source: "a@b.c", template: "t", destination: { to: ["x@y.z"] } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ses/send-templated", {
      method: "POST",
      body: JSON.stringify({ source: "a@b.c", template: "t", destination: { to: ["x@y.z"] }, templateData: undefined }),
    });
  });
});

describe("useSESAccountDetails + usePutSESAccountDetails", () => {
  it("queries account details", async () => {
    mockApi.mockResolvedValueOnce({ details: null });
    const { result } = renderHook(() => useSESAccountDetails(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/email/account/details");
  });

  it("puts account details", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const body = { mailType: "MARKETING" };
    const { result } = renderHook(() => usePutSESAccountDetails(), { wrapper: createWrapper() });
    await result.current.mutateAsync(body);
    expect(mockApi).toHaveBeenCalledWith("/aws/email/account/details", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  });
});


// ─── SES v2 (P1 gap audit) ───────────────────────────────
describe("useSES v2 hooks", () => {
  it("identities query/create/delete", async () => {
    mockApi.mockResolvedValueOnce({ identities: [], total: 0 });
    const list = renderHook(() => useSESv2Identities(), { wrapper: createWrapper() });
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/email-identities");
    mockApi.mockResolvedValueOnce({ identityType: "EMAIL_ADDRESS" });
    const { result: createR } = renderHook(() => useCreateSESv2Identity(), { wrapper: createWrapper() });
    await createR.current.mutateAsync({ emailIdentity: "x@y.z" });
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/email-identities", {
      method: "POST",
      body: JSON.stringify({ emailIdentity: "x@y.z" }),
    });
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result: delR } = renderHook(() => useDeleteSESv2Identity(), { wrapper: createWrapper() });
    await delR.current.mutateAsync("x@y.z");
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/email-identities/x%40y.z", { method: "DELETE" });
  });

  it("send email", async () => {
    mockApi.mockResolvedValueOnce({ messageId: "m1" });
    const { result } = renderHook(() => useSendSESv2Email(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ from: "a@b.c", destination: {}, content: {} });
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/send", {
      method: "POST",
      body: JSON.stringify({ from: "a@b.c", destination: {}, content: {} }),
    });
  });

  it("templates query/create/delete", async () => {
    mockApi.mockResolvedValueOnce({ templates: [], total: 0 });
    const list = renderHook(() => useSESv2Templates(), { wrapper: createWrapper() });
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));
    mockApi.mockResolvedValueOnce({ created: true });
    const { result: createR } = renderHook(() => useCreateSESv2Template(), { wrapper: createWrapper() });
    await createR.current.mutateAsync({ templateName: "t1", subject: "s" });
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/templates", {
      method: "POST",
      body: JSON.stringify({ templateName: "t1", subject: "s" }),
    });
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result: delR } = renderHook(() => useDeleteSESv2Template(), { wrapper: createWrapper() });
    await delR.current.mutateAsync("t1");
  });

  it("configuration sets query/create/delete + options PUT", async () => {
    mockApi.mockResolvedValueOnce({ configurationSets: [], total: 0 });
    const list = renderHook(() => useSESv2ConfigurationSets(), { wrapper: createWrapper() });
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));
    mockApi.mockResolvedValueOnce({ created: true });
    const { result: createR } = renderHook(() => useCreateSESv2ConfigurationSet(), { wrapper: createWrapper() });
    await createR.current.mutateAsync({ name: "cs1" });
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result: opts } = renderHook(() => usePutSESv2ConfigSetOptions("cs1"), { wrapper: createWrapper() });
    await opts.current.mutateAsync({ option: "sending", body: { SendingEnabled: true } });
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/configuration-sets/cs1/sending", {
      method: "PUT",
      body: JSON.stringify({ SendingEnabled: true }),
    });
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result: delR } = renderHook(() => useDeleteSESv2ConfigurationSet(), { wrapper: createWrapper() });
    await delR.current.mutateAsync("cs1");
  });

  it("dedicated ip pools query/create/delete", async () => {
    mockApi.mockResolvedValueOnce({ pools: [], total: 0 });
    const list = renderHook(() => useSESv2DedicatedIpPools(), { wrapper: createWrapper() });
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));
    mockApi.mockResolvedValueOnce({ created: true });
    const { result: createR } = renderHook(() => useCreateSESv2DedicatedIpPool(), { wrapper: createWrapper() });
    await createR.current.mutateAsync({ poolName: "p1" });
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result: delR } = renderHook(() => useDeleteSESv2DedicatedIpPool(), { wrapper: createWrapper() });
    await delR.current.mutateAsync("p1");
  });

  it("contact lists + contacts", async () => {
    mockApi.mockResolvedValueOnce({ contactLists: [], total: 0 });
    const lists = renderHook(() => useSESv2ContactLists(), { wrapper: createWrapper() });
    await waitFor(() => expect(lists.result.current.isSuccess).toBe(true));
    mockApi.mockResolvedValueOnce({ created: true });
    const { result: createR } = renderHook(() => useCreateSESv2ContactList(), { wrapper: createWrapper() });
    await createR.current.mutateAsync({ listName: "cl1" });
    mockApi.mockResolvedValueOnce({ contacts: [], total: 0 });
    const contacts = renderHook(() => useSESv2Contacts("cl1"), { wrapper: createWrapper() });
    await waitFor(() => expect(contacts.result.current.isSuccess).toBe(true));
    mockApi.mockResolvedValueOnce({ created: true });
    const { result: addC } = renderHook(() => useCreateSESv2Contact("cl1"), { wrapper: createWrapper() });
    await addC.current.mutateAsync({ email: "c@x.y" });
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result: delC } = renderHook(() => useDeleteSESv2Contact("cl1"), { wrapper: createWrapper() });
    await delC.current.mutateAsync("c@x.y");
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result: delL } = renderHook(() => useDeleteSESv2ContactList(), { wrapper: createWrapper() });
    await delL.current.mutateAsync("cl1");
    const idle = renderHook(() => useSESv2Contacts(null), { wrapper: createWrapper() });
    expect(idle.result.current.fetchStatus).toBe("idle");
  });

  it("suppression list query/suppress/delete", async () => {
    mockApi.mockResolvedValueOnce({ suppressed: [], total: 0 });
    const list = renderHook(() => useSESv2SuppressionList(), { wrapper: createWrapper() });
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));
    mockApi.mockResolvedValueOnce({ suppressed: true });
    const { result: supR } = renderHook(() => useSuppressSESv2Destination(), { wrapper: createWrapper() });
    await supR.current.mutateAsync({ email: "b@x.y" });
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/suppressed-destinations", {
      method: "PUT",
      body: JSON.stringify({ email: "b@x.y" }),
    });
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result: delR } = renderHook(() => useDeleteSESv2SuppressedDestination(), { wrapper: createWrapper() });
    await delR.current.mutateAsync("b@x.y");
  });
});

describe("useSES v1 extras hooks", () => {
  it("bulk templated send", async () => {
    mockApi.mockResolvedValueOnce({ status: [] });
    const { result } = renderHook(() => useSendSESv1BulkTemplated(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ source: "a@b.c", template: "t", destinations: [] });
    expect(mockApi).toHaveBeenCalledWith("/aws/email/send-bulk-templated", {
      method: "POST",
      body: JSON.stringify({ source: "a@b.c", template: "t", destinations: [] }),
    });
  });

  it("CVET query/create/delete", async () => {
    mockApi.mockResolvedValueOnce({ templates: [], total: 0 });
    const list = renderHook(() => useSESv1CVETs(), { wrapper: createWrapper() });
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));
    mockApi.mockResolvedValueOnce({ created: true });
    const { result: createR } = renderHook(() => useCreateSESv1CVET(), { wrapper: createWrapper() });
    await createR.current.mutateAsync({ templateName: "cv1", fromEmailAddress: "a@b.c" });
    expect(mockApi).toHaveBeenCalledWith("/aws/email/custom-verification-templates", {
      method: "POST",
      body: JSON.stringify({ templateName: "cv1", fromEmailAddress: "a@b.c" }),
    });
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result: delR } = renderHook(() => useDeleteSESv1CVET(), { wrapper: createWrapper() });
    await delR.current.mutateAsync("cv1");
  });

  it("send custom verification + dkim", async () => {
    mockApi.mockResolvedValueOnce({ sent: true });
    const { result: send } = renderHook(() => useSendSESv1CustomVerification(), { wrapper: createWrapper() });
    await send.current.mutateAsync({ emailAddress: "x@y.z", templateName: "cv1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/email/send-custom-verification", {
      method: "POST",
      body: JSON.stringify({ emailAddress: "x@y.z", templateName: "cv1" }),
    });
    mockApi.mockResolvedValueOnce({ dkimTokens: [] });
    const { result: dkim } = renderHook(() => useVerifySESv1DomainDkim(), { wrapper: createWrapper() });
    await dkim.current.mutateAsync("example.com");
    expect(mockApi).toHaveBeenCalledWith("/aws/email/domains/example.com/dkim", { method: "POST", body: "{}" });
  });

  it("identity policies query", async () => {
    mockApi.mockResolvedValueOnce({ policies: { p1: "{}" } });
    const policies = renderHook(() => useSESv1IdentityPolicies("x@y.z"), { wrapper: createWrapper() });
    await waitFor(() => expect(policies.result.current.isSuccess).toBe(true));
    const idle = renderHook(() => useSESv1IdentityPolicies(null), { wrapper: createWrapper() });
    expect(idle.result.current.fetchStatus).toBe("idle");
  });

  it("receipt rule sets query/create/delete/activate", async () => {
    mockApi.mockResolvedValueOnce({ ruleSets: [], total: 0 });
    const list = renderHook(() => useSESv1ReceiptRuleSets(), { wrapper: createWrapper() });
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));
    mockApi.mockResolvedValueOnce({ created: true });
    const { result: createR } = renderHook(() => useCreateSESv1ReceiptRuleSet(), { wrapper: createWrapper() });
    await createR.current.mutateAsync({ ruleSetName: "rs1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/email/receipt-rule-sets", {
      method: "POST",
      body: JSON.stringify({ ruleSetName: "rs1" }),
    });
    mockApi.mockResolvedValueOnce({ activated: true });
    const { result: actR } = renderHook(() => useActivateSESv1ReceiptRuleSet(), { wrapper: createWrapper() });
    await actR.current.mutateAsync("rs1");
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result: delR } = renderHook(() => useDeleteSESv1ReceiptRuleSet(), { wrapper: createWrapper() });
    await delR.current.mutateAsync("rs1");
  });

  it("useSESv2Account", async () => {
    mockApi.mockResolvedValueOnce({ account: { ProductionAccessEnabled: true } });
    const { result } = renderHook(() => useSESv2Account(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/account");
  });

  it("useSESv2CustomVerificationTemplates", async () => {
    mockApi.mockResolvedValueOnce({ templates: [] });
    const { result } = renderHook(() => useSESv2CustomVerificationTemplates(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/custom-verification-email-templates");
  });

  it("useCreateSESv2CustomVerificationTemplate", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => useCreateSESv2CustomVerificationTemplate(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ TemplateName: "t1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/custom-verification-email-templates", {
      method: "POST",
      body: JSON.stringify({ TemplateName: "t1" }),
    });
  });

  it("useDeleteSESv2CustomVerificationTemplate", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteSESv2CustomVerificationTemplate(), { wrapper: createWrapper() });
    await result.current.mutateAsync("t1");
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/custom-verification-email-templates/t1", { method: "DELETE" });
  });

  it("useSESv2ConfigSetEventDestinations", async () => {
    mockApi.mockResolvedValueOnce({ eventDestinations: [] });
    const { result } = renderHook(() => useSESv2ConfigSetEventDestinations("cs1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/configuration-sets/cs1/event-destinations");
  });

  it("useSESv2ConfigSetEventDestinations disabled when null", async () => {
    const { result } = renderHook(() => useSESv2ConfigSetEventDestinations(null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useSESv2TemplateRender", async () => {
    mockApi.mockResolvedValueOnce({ renderedTemplate: "Hi" });
    const { result } = renderHook(() => useSESv2TemplateRender("t1"), { wrapper: createWrapper() });
    await result.current.mutateAsync("{\"name\":\"John\"}");
    expect(mockApi).toHaveBeenCalledWith("/aws/email/v2/templates/t1/render", {
      method: "POST",
      body: JSON.stringify({ TemplateData: "{\"name\":\"John\"}" }),
    });
  });
});
