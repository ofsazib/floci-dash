import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface SESIdentity {
  identity: string;
  verificationStatus: string | null;
  verificationToken: string | null;
  dkimEnabled: boolean;
  dkimVerificationStatus: string | null;
  mailFromDomain: string | null;
  mailFromMXRecordVerificationStatus: string | null;
}

export function useSESIdentities() {
  return useQuery<{ identities: SESIdentity[]; total: number }>({
    queryKey: ["aws", "ses", "identities"],
    queryFn: () => api("/aws/email/identities"),
    refetchInterval: 10000,
  });
}

export function useSESVerifyEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (emailAddress: string) =>
      api("/aws/email/identities/verify-email", {
        method: "POST",
        body: JSON.stringify({ emailAddress }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "identities"] }),
  });
}

export function useSESVerifyDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (domain: string) =>
      api("/aws/email/identities/verify-domain", {
        method: "POST",
        body: JSON.stringify({ domain }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "identities"] }),
  });
}

export function useSESDeleteIdentity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (value: string) =>
      api(`/aws/email/identities/${encodeURIComponent(value)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "identities"] }),
  });
}

export function useSESSendEmail() {
  return useMutation({
    mutationFn: (data: {
      source: string;
      toAddresses: string[];
      ccAddresses?: string[];
      bccAddresses?: string[];
      subject: string;
      html?: string;
      text?: string;
    }) =>
      api("/aws/email/send-email", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useSESVerifiedEmails() {
  return useQuery<{ emails: string[]; total: number }>({
    queryKey: ["aws", "ses", "verified-emails"],
    queryFn: () => api("/aws/email/verified-emails"),
  });
}

export function useSESVerifyEmailAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (emailAddress: string) =>
      api("/aws/email/verified-emails", {
        method: "POST",
        body: JSON.stringify({ emailAddress }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ses", "verified-emails"] }),
  });
}

export function useSESDeleteVerifiedEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (emailAddress: string) =>
      api(`/aws/email/verified-emails/${encodeURIComponent(emailAddress)}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ses", "verified-emails"] }),
  });
}

export interface SESSendQuota {
  max24HourSend: number | undefined;
  maxSendRate: number | undefined;
  sentLast24Hours: number | undefined;
}

export interface SESSendDataPoint {
  timestamp: string | null;
  deliveryAttempts: number | undefined;
  rejects: number | undefined;
  complaints: number | undefined;
  bounces: number | undefined;
}

export function useSESSendingEnabled() {
  return useQuery<{ enabled: boolean }>({
    queryKey: ["aws", "ses", "account", "sending-enabled"],
    queryFn: () => api("/aws/email/account/sending-enabled"),
  });
}

export function useSESSetSendingEnabled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) =>
      api("/aws/email/account/sending-enabled", {
        method: "PUT",
        body: JSON.stringify({ enabled }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ses", "account", "sending-enabled"] }),
  });
}

export function useSESSendQuota() {
  return useQuery<SESSendQuota>({
    queryKey: ["aws", "ses", "account", "send-quota"],
    queryFn: () => api("/aws/email/account/send-quota"),
  });
}

export function useSESSendStatistics() {
  return useQuery<{ sendDataPoints: SESSendDataPoint[] }>({
    queryKey: ["aws", "ses", "account", "send-statistics"],
    queryFn: () => api("/aws/email/account/send-statistics"),
  });
}

export function useSESSendRawEmail() {
  return useMutation({
    mutationFn: (data: { rawMessage: string; source?: string; destinations?: string[] }) =>
      api("/aws/email/send-raw", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

// ─── Notification Attributes ─────────────────────────────

export function useSESNotificationAttributes(identity: string | null) {
  return useQuery<{
    identity: string;
    bounceTopic: any | null;
    complaintTopic: any | null;
    deliveryTopic: any | null;
    forwardingEnabled: boolean;
    headersInBounceNotifications: boolean | undefined;
    headersInComplaintNotifications: boolean | undefined;
    headersInDeliveryNotifications: boolean | undefined;
  }>({
    queryKey: ["aws", "ses", "notification-attributes", identity],
    queryFn: () => api(`/aws/email/identities/${encodeURIComponent(identity!)}/notification-attributes`),
    enabled: !!identity,
  });
}

export function useSESSetNotificationTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { identity: string; notificationType: string; snsTopic?: string }) =>
      api(`/aws/email/identities/${encodeURIComponent(body.identity)}/notification-topic`, {
        method: "PUT",
        body: JSON.stringify({ notificationType: body.notificationType, snsTopic: body.snsTopic }),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "ses", "notification-attributes", variables.identity] }),
  });
}

export function useSESSetFeedbackForwarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { identity: string; forwardingEnabled: boolean }) =>
      api(`/aws/email/identities/${encodeURIComponent(body.identity)}/feedback-forwarding`, {
        method: "PUT",
        body: JSON.stringify({ forwardingEnabled: body.forwardingEnabled }),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "ses", "notification-attributes", variables.identity] }),
  });
}

export function useSESSetHeadersInNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { identity: string; notificationType: string; enabled: boolean }) =>
      api(`/aws/email/identities/${encodeURIComponent(body.identity)}/headers-in-notifications`, {
        method: "PUT",
        body: JSON.stringify({ notificationType: body.notificationType, enabled: body.enabled }),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "ses", "notification-attributes", variables.identity] }),
  });
}

// ─── DKIM ────────────────────────────────────────────────

export function useSESSetDkimEnabled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { identity: string; enabled: boolean }) =>
      api(`/aws/email/identities/${encodeURIComponent(body.identity)}/dkim`, {
        method: "PUT",
        body: JSON.stringify({ enabled: body.enabled }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ses", "identities"] }),
  });
}

// ─── MAIL FROM ───────────────────────────────────────────

export function useSESSetMailFromDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { identity: string; mailFromDomain: string }) =>
      api(`/aws/email/identities/${encodeURIComponent(body.identity)}/mail-from`, {
        method: "PUT",
        body: JSON.stringify({ mailFromDomain: body.mailFromDomain }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ses", "identities"] }),
  });
}

// ─── Configuration Sets ──────────────────────────────────

export function useConfigurationSets() {
  return useQuery<{ configurationSets: { Name: string }[]; total: number }>({
    queryKey: ["aws", "ses", "configuration-sets"],
    queryFn: () => api("/aws/email/configuration-sets"),
  });
}

export function useCreateConfigurationSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api("/aws/email/configuration-sets", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ses", "configuration-sets"] }),
  });
}

export function useDescribeConfigurationSet(name: string | null) {
  return useQuery<{
    name: string;
    eventDestinations: any[];
    trackingOptions: any;
    deliveryOptions: any;
    reputationOptions: any;
  }>({
    queryKey: ["aws", "ses", "configuration-sets", name],
    queryFn: () => api(`/aws/email/configuration-sets/${encodeURIComponent(name!)}`),
    enabled: !!name,
  });
}

export function useDeleteConfigurationSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/email/configuration-sets/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ses", "configuration-sets"] }),
  });
}

// ─── Event Destinations ─────────────────────────────────

export function useCreateEventDestination() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      configSetName: string;
      eventDestinationName: string;
      matchingEventTypes: string[];
      snsTopicARN?: string;
      enabled?: boolean;
      cloudWatchDestination?: any;
      kinesisFirehoseDestination?: any;
    }) =>
      api(`/aws/email/configuration-sets/${encodeURIComponent(body.configSetName)}/event-destinations`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "ses", "configuration-sets", variables.configSetName] }),
  });
}

export function useUpdateEventDestination() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      configSetName: string;
      eventDestinationName: string;
      matchingEventTypes: string[];
      snsTopicARN?: string;
      enabled?: boolean;
    }) =>
      api(`/aws/email/configuration-sets/${encodeURIComponent(body.configSetName)}/event-destinations/${encodeURIComponent(body.eventDestinationName)}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "ses", "configuration-sets", variables.configSetName] }),
  });
}

export function useDeleteEventDestination() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { configSetName: string; eventDestinationName: string }) =>
      api(`/aws/email/configuration-sets/${encodeURIComponent(body.configSetName)}/event-destinations/${encodeURIComponent(body.eventDestinationName)}`, {
        method: "DELETE",
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "ses", "configuration-sets", variables.configSetName] }),
  });
}

// ─── Sending Enabled ────────────────────────────────────

export function useSetConfigSendingEnabled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { configSetName: string; enabled: boolean }) =>
      api(`/aws/email/configuration-sets/${encodeURIComponent(body.configSetName)}/sending-enabled`, {
        method: "PUT",
        body: JSON.stringify({ enabled: body.enabled }),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "ses", "configuration-sets", variables.configSetName] }),
  });
}

// ─── Tracking Options ───────────────────────────────────

export function useCreateTrackingOptions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { configSetName: string; customRedirectDomain: string }) =>
      api(`/aws/email/configuration-sets/${encodeURIComponent(body.configSetName)}/tracking-options`, {
        method: "POST",
        body: JSON.stringify({ customRedirectDomain: body.customRedirectDomain }),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "ses", "configuration-sets", variables.configSetName] }),
  });
}

export function useUpdateTrackingOptions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { configSetName: string; customRedirectDomain: string }) =>
      api(`/aws/email/configuration-sets/${encodeURIComponent(body.configSetName)}/tracking-options`, {
        method: "PUT",
        body: JSON.stringify({ customRedirectDomain: body.customRedirectDomain }),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "ses", "configuration-sets", variables.configSetName] }),
  });
}

export function useDeleteTrackingOptions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (configSetName: string) =>
      api(`/aws/email/configuration-sets/${encodeURIComponent(configSetName)}/tracking-options`, {
        method: "DELETE",
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "ses", "configuration-sets", variables] }),
  });
}

// ─── Reputation Metrics ─────────────────────────────────

export function useSetReputationMetrics() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { configSetName: string; enabled: boolean }) =>
      api(`/aws/email/configuration-sets/${encodeURIComponent(body.configSetName)}/reputation-metrics`, {
        method: "PUT",
        body: JSON.stringify({ enabled: body.enabled }),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "ses", "configuration-sets", variables.configSetName] }),
  });
}

// ─── Delivery Options ───────────────────────────────────

export function useSetDeliveryOptions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { configSetName: string; tlsPolicy?: string }) =>
      api(`/aws/email/configuration-sets/${encodeURIComponent(body.configSetName)}/delivery-options`, {
        method: "PUT",
        body: JSON.stringify({ tlsPolicy: body.tlsPolicy }),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "ses", "configuration-sets", variables.configSetName] }),
  });
}
