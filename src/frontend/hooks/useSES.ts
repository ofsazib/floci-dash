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
