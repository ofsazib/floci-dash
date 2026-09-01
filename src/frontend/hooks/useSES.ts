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

export interface SESAccountDetails {
  mailType?: string;
  websiteUrl?: string;
  contactLanguage?: string;
  useCaseDescription?: string;
  additionalContacts?: string[];
  productionAccessEnabled?: boolean;
}

export function useSESAccountDetails() {
  return useQuery<{ details: SESAccountDetails | null }>({
    queryKey: ["aws", "ses", "account", "details"],
    queryFn: () => api("/aws/email/account/details"),
  });
}

export function usePutSESAccountDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      mailType: string;
      websiteUrl?: string;
      contactLanguage?: string;
      useCaseDescription?: string;
      additionalContacts?: string[];
      productionAccessEnabled?: boolean;
    }) =>
      api("/aws/email/account/details", { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "account", "details"] }),
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

// ── Templates ──────────────────────────────────────────────

export function useSESTemplates() {
  return useQuery({
    queryKey: ["aws", "ses", "templates"],
    queryFn: () => api<{ templates: { name: string; createdTimestamp?: string }[]; total: number }>("/aws/ses/templates"),
  });
}

export function useCreateSESTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; subject?: string; text?: string; html?: string }) =>
      api("/aws/ses/templates", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "templates"] }),
  });
}

export function useUpdateSESTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; subject?: string; text?: string; html?: string }) =>
      api(`/aws/ses/templates/${encodeURIComponent(params.name)}`, {
        method: "PUT",
        body: JSON.stringify({ subject: params.subject, text: params.text, html: params.html }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "templates"] }),
  });
}

export function useDeleteSESTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/ses/templates/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "templates"] }),
  });
}

export function useRenderSESTemplate() {
  return useMutation({
    mutationFn: (params: { name: string; templateData?: string }) =>
      api(`/aws/ses/templates/${encodeURIComponent(params.name)}/render`, {
        method: "POST",
        body: JSON.stringify({ templateData: params.templateData }),
      }),
  });
}

export function useSESSendTemplated() {
  return useMutation({
    mutationFn: (body: {
      source: string;
      template: string;
      destination: { to: string[]; cc?: string[] };
      templateData?: string;
    }) => api("/aws/ses/send-templated", { method: "POST", body: JSON.stringify(body) }),
  });
}

// ─── SES v2 (P1 gap audit) ───────────────────────────────
export function useSESv2Identities() {
  return useQuery<{ identities: any[]; total: number }>({
    queryKey: ["aws", "ses", "v2", "identities"],
    queryFn: () => api("/aws/email/v2/email-identities"),
  });
}

export function useCreateSESv2Identity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { emailIdentity: string; tags?: Record<string, string> }) =>
      api("/aws/email/v2/email-identities", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "v2", "identities"] }),
  });
}

export function useDeleteSESv2Identity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (identity: string) =>
      api(`/aws/email/v2/email-identities/${encodeURIComponent(identity)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "v2", "identities"] }),
  });
}

export function useSendSESv2Email() {
  return useMutation({
    mutationFn: (body: { from: string; destination: unknown; content: unknown; configurationSetName?: string }) =>
      api("/aws/email/v2/send", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useSESv2Templates() {
  return useQuery<{ templates: any[]; total: number }>({
    queryKey: ["aws", "ses", "v2", "templates"],
    queryFn: () => api("/aws/email/v2/templates"),
  });
}

export function useCreateSESv2Template() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { templateName: string; subject: string; html?: string; text?: string }) =>
      api("/aws/email/v2/templates", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "v2", "templates"] }),
  });
}

export function useDeleteSESv2Template() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/email/v2/templates/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "v2", "templates"] }),
  });
}

export function useSESv2ConfigurationSets() {
  return useQuery<{ configurationSets: string[]; total: number }>({
    queryKey: ["aws", "ses", "v2", "configuration-sets"],
    queryFn: () => api("/aws/email/v2/configuration-sets"),
  });
}

export function useCreateSESv2ConfigurationSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string }) =>
      api("/aws/email/v2/configuration-sets", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "v2", "configuration-sets"] }),
  });
}

export function useDeleteSESv2ConfigurationSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/email/v2/configuration-sets/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "v2", "configuration-sets"] }),
  });
}

export function usePutSESv2ConfigSetOptions(name: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ option, body }: { option: string; body: unknown }) =>
      api(`/aws/email/v2/configuration-sets/${encodeURIComponent(name)}/${option}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "v2", "configuration-sets"] }),
  });
}

export function useSESv2DedicatedIpPools() {
  return useQuery<{ pools: string[]; total: number }>({
    queryKey: ["aws", "ses", "v2", "dedicated-ip-pools"],
    queryFn: () => api("/aws/email/v2/dedicated-ip-pools"),
  });
}

export function useCreateSESv2DedicatedIpPool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { poolName: string }) =>
      api("/aws/email/v2/dedicated-ip-pools", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "v2", "dedicated-ip-pools"] }),
  });
}

export function useDeleteSESv2DedicatedIpPool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/email/v2/dedicated-ip-pools/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "v2", "dedicated-ip-pools"] }),
  });
}

export function useSESv2ContactLists() {
  return useQuery<{ contactLists: string[]; total: number }>({
    queryKey: ["aws", "ses", "v2", "contact-lists"],
    queryFn: () => api("/aws/email/v2/contact-lists"),
  });
}

export function useCreateSESv2ContactList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { listName: string }) =>
      api("/aws/email/v2/contact-lists", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "v2", "contact-lists"] }),
  });
}

export function useDeleteSESv2ContactList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/email/v2/contact-lists/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "v2", "contact-lists"] }),
  });
}

export function useSESv2Contacts(listName: string | null) {
  return useQuery<{ contacts: any[]; total: number }>({
    queryKey: ["aws", "ses", "v2", "contacts", listName],
    queryFn: () => api(`/aws/email/v2/contact-lists/${encodeURIComponent(listName!)}/contacts`),
    enabled: !!listName,
  });
}

export function useCreateSESv2Contact(listName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string }) =>
      api(`/aws/email/v2/contact-lists/${encodeURIComponent(listName)}/contacts`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "v2", "contacts", listName] }),
  });
}

export function useDeleteSESv2Contact(listName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) =>
      api(`/aws/email/v2/contact-lists/${encodeURIComponent(listName)}/contacts/${encodeURIComponent(email)}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "v2", "contacts", listName] }),
  });
}

export function useSESv2SuppressionList() {
  return useQuery<{ suppressed: any[]; total: number }>({
    queryKey: ["aws", "ses", "v2", "suppression"],
    queryFn: () => api("/aws/email/v2/suppressed-destinations"),
  });
}

export function useSuppressSESv2Destination() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; reason?: string }) =>
      api("/aws/email/v2/suppressed-destinations", { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "v2", "suppression"] }),
  });
}

export function useDeleteSESv2SuppressedDestination() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) =>
      api(`/aws/email/v2/suppressed-destinations/${encodeURIComponent(email)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "v2", "suppression"] }),
  });
}

// ─── SES v1 extras (P1 gap audit) ────────────────────────
export function useSendSESv1BulkTemplated() {
  return useMutation({
    mutationFn: (body: { source: string; template: string; destinations: unknown[]; defaultTemplateData?: string }) =>
      api("/aws/email/send-bulk-templated", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useSESv1CVETs() {
  return useQuery<{ templates: any[]; total: number }>({
    queryKey: ["aws", "ses", "v1", "cvets"],
    queryFn: () => api("/aws/email/custom-verification-templates"),
  });
}

export function useCreateSESv1CVET() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { templateName: string; fromEmailAddress: string; templateSubject?: string; templateHtml?: string; templateText?: string; successRedirectionURL?: string; failureRedirectionURL?: string }) =>
      api("/aws/email/custom-verification-templates", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "v1", "cvets"] }),
  });
}

export function useDeleteSESv1CVET() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/email/custom-verification-templates/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "v1", "cvets"] }),
  });
}

export function useSendSESv1CustomVerification() {
  return useMutation({
    mutationFn: (body: { emailAddress: string; templateName: string; configurationSetName?: string }) =>
      api("/aws/email/send-custom-verification", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useVerifySESv1DomainDkim() {
  return useMutation({
    mutationFn: (domain: string) =>
      api(`/aws/email/domains/${domain}/dkim`, { method: "POST", body: "{}" }),
  });
}

export function useSESv1IdentityPolicies(identity: string | null) {
  return useQuery<{ policies: Record<string, string> }>({
    queryKey: ["aws", "ses", "v1", "identity-policies", identity],
    queryFn: () => api(`/aws/email/identities/${encodeURIComponent(identity!)}/policies`),
    enabled: !!identity,
  });
}

export function useSESv1ReceiptRuleSets() {
  return useQuery<{ ruleSets: any[]; total: number }>({
    queryKey: ["aws", "ses", "v1", "receipt-rule-sets"],
    queryFn: () => api("/aws/email/receipt-rule-sets"),
  });
}

export function useCreateSESv1ReceiptRuleSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { ruleSetName: string }) =>
      api("/aws/email/receipt-rule-sets", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "v1", "receipt-rule-sets"] }),
  });
}

export function useDeleteSESv1ReceiptRuleSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/email/receipt-rule-sets/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "v1", "receipt-rule-sets"] }),
  });
}

export function useActivateSESv1ReceiptRuleSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/email/receipt-rule-sets/${name}/activate`, { method: "POST", body: "{}" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "v1", "receipt-rule-sets"] }),
  });
}

// ─── SES v2 — Additional operations ─────────────────────

export function useSESv2Account() {
  return useQuery({
    queryKey: ["aws", "ses", "v2", "account"],
    queryFn: () => api("/aws/email/v2/account"),
  });
}

export function useSESv2CustomVerificationTemplates() {
  return useQuery({
    queryKey: ["aws", "ses", "v2", "custom-verification-templates"],
    queryFn: () => api("/aws/email/v2/custom-verification-email-templates"),
  });
}

export function useCreateSESv2CustomVerificationTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/email/v2/custom-verification-email-templates", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "v2", "custom-verification-templates"] }),
  });
}

export function useDeleteSESv2CustomVerificationTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/email/v2/custom-verification-email-templates/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ses", "v2", "custom-verification-templates"] }),
  });
}

export function useSESv2ConfigSetEventDestinations(configSetName: string | null) {
  return useQuery({
    queryKey: ["aws", "ses", "v2", "config-set-events", configSetName],
    queryFn: () => api(`/aws/email/v2/configuration-sets/${configSetName}/event-destinations`),
    enabled: !!configSetName,
  });
}

export function useSESv2TemplateRender(templateName: string | null) {
  return useMutation({
    mutationFn: (templateData: string) =>
      api(`/aws/email/v2/templates/${templateName}/render`, { method: "POST", body: JSON.stringify({ TemplateData: templateData }) }),
  });
}
