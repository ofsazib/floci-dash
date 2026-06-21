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
