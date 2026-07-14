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
  useSetTrackingOptions,
  useDeleteTrackingOptions,
  useSetReputationMetrics,
  useSetDeliveryOptions,
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

describe("useSetTrackingOptions", () => {
  it("calls api with PUT method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSetTrackingOptions(), { wrapper: createWrapper() });
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
