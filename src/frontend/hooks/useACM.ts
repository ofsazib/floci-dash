import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface ACMCertificateSummary {
  CertificateArn: string;
  DomainName: string;
  Status: string;
  Type?: string;
  KeyAlgorithm?: string;
  SubjectAlternativeNameSummaries?: string[];
  NotBefore?: number;
  NotAfter?: number;
  RenewalEligibility?: string;
  InUse?: boolean;
}

export interface ACMCertificate {
  CertificateArn: string;
  DomainName: string;
  Status: string;
  Type?: string;
  KeyAlgorithm?: string;
  SubjectAlternativeNames?: string[];
  DomainValidationOptions?: {
    DomainName: string;
    ValidationStatus: string;
    ValidationMethod?: string;
    ResourceRecord?: { Name: string; Type: string; Value: string };
  }[];
  NotBefore?: number;
  NotAfter?: number;
  IssuedAt?: number;
  CreatedAt?: number;
  Serial?: string;
  Subject?: string;
  Issuer?: string;
  SignatureAlgorithm?: string;
  InUseBy?: string[];
}

// ── Certificates ─────────────────────────────────────────

export function useACMCertificates() {
  return useQuery<{ certificates: ACMCertificateSummary[]; total: number }>({
    queryKey: ["aws", "acm", "certificates"],
    queryFn: () => api("/aws/acm/certificates"),
    refetchInterval: 15000,
  });
}

export function useACMCertificate(arn: string | null) {
  return useQuery<{ certificate: ACMCertificate }>({
    queryKey: ["aws", "acm", "certificate", arn],
    queryFn: () => api(`/aws/acm/certificates/${encodeURIComponent(arn!)}`),
    enabled: !!arn,
  });
}

export function useRequestACMCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      domainName: string;
      subjectAlternativeNames?: string[];
      validationMethod?: string;
      keyAlgorithm?: string;
    }) =>
      api("/aws/acm/certificates", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "acm", "certificates"] }),
  });
}

export function useDeleteACMCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) =>
      api(`/aws/acm/certificates/${encodeURIComponent(arn)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "acm", "certificates"] }),
  });
}

export function useACMCertificateTags(arn: string | null) {
  return useQuery<{ tags: { Key: string; Value: string }[] }>({
    queryKey: ["aws", "acm", "tags", arn],
    queryFn: () => api(`/aws/acm/certificates/${encodeURIComponent(arn!)}/tags`),
    enabled: !!arn,
  });
}
