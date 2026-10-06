import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface SesExportJob {
  jobId?: string;
  exportSourceType?: string;
  jobStatus?: string;
  exportDestination?: { dataFormat?: string; s3Url?: string };
  createdTimestamp?: string;
  completedTimestamp?: string;
}

export interface SesImportJob {
  jobId?: string;
  importJobStatus?: string;
  importDestination?: Record<string, unknown>;
}

export interface SesTenant {
  tenantName?: string;
  tenantArn?: string;
  createdTimestamp?: string;
}

export function useSesCreateExportJob() {
  return useMutation({
    mutationFn: (input: {
      exportDestination: { dataFormat: string };
      exportDataSource: Record<string, unknown>;
    }) =>
      api<{ jobId: string }>("/aws/email/v2/export-jobs", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useSesListExportJobs() {
  return useMutation({
    mutationFn: () =>
      api<{ jobs: SesExportJob[]; nextToken?: string }>(
        "/aws/email/v2/export-jobs/list",
        { method: "POST", body: JSON.stringify({}) }
      ),
  });
}

export function useSesCancelExportJob() {
  return useMutation({
    mutationFn: (jobId: string) =>
      api<{ cancelled: boolean }>(
        `/aws/email/v2/export-jobs/${encodeURIComponent(jobId)}/cancel`,
        { method: "PUT" }
      ),
  });
}

export function useSesCreateImportJob() {
  return useMutation({
    mutationFn: (input: {
      importDataSource: { s3Url: string; dataFormat: string };
      importDestination: Record<string, unknown>;
    }) =>
      api<{ jobId: string }>("/aws/email/v2/import-jobs", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useSesListImportJobs() {
  return useMutation({
    mutationFn: () =>
      api<{ importJobs: SesImportJob[]; nextToken?: string }>(
        "/aws/email/v2/import-jobs/list",
        { method: "POST", body: JSON.stringify({}) }
      ),
  });
}

export function useSesBatchGetMetricData() {
  return useMutation({
    mutationFn: (queries: Record<string, unknown>[]) =>
      api<{ results: Record<string, unknown>[]; errors: Record<string, unknown>[] }>(
        "/aws/email/v2/metrics/batch",
        { method: "POST", body: JSON.stringify({ queries }) }
      ),
  });
}

export function useSesMessageInsights() {
  return useMutation({
    mutationFn: (messageId: string) =>
      api<{ insights: Record<string, unknown> | null }>(
        `/aws/email/v2/insights/${encodeURIComponent(messageId)}`
      ),
  });
}

export function useSesListDedicatedIps() {
  return useMutation({
    mutationFn: (pool?: string) =>
      api<{ dedicatedIps: { ip?: string; status?: string }[] }>(
        `/aws/email/v2/dedicated-ips${pool ? `?pool=${encodeURIComponent(pool)}` : ""}`
      ),
  });
}

export function useSesPutPoolScaling() {
  return useMutation({
    mutationFn: (input: { name: string; scalingMode: string }) =>
      api<{ updated: boolean }>(
        `/aws/email/v2/dedicated-ip-pools/${encodeURIComponent(input.name)}/scaling`,
        { method: "PUT", body: JSON.stringify({ scalingMode: input.scalingMode }) }
      ),
  });
}

export function useSesCreateTenant() {
  return useMutation({
    mutationFn: (input: { tenantName: string; tags?: Record<string, string> }) =>
      api<{ tenant: SesTenant | null }>("/aws/email/v2/tenants", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useSesListTenants() {
  return useMutation({
    mutationFn: () =>
      api<{ tenants: SesTenant[]; nextToken?: string }>(
        "/aws/email/v2/tenants/list",
        { method: "POST", body: JSON.stringify({}) }
      ),
  });
}

export function useSesAssociateTenantResource() {
  return useMutation({
    mutationFn: (input: { tenantName: string; resourceArn: string }) =>
      api<{ associated: boolean }>("/aws/email/v2/tenants/resources", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useSesDisassociateTenantResource() {
  return useMutation({
    mutationFn: (input: { tenantName: string; resourceArn: string }) =>
      api<{ disassociated: boolean }>("/aws/email/v2/tenants/resources/delete", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useSesListTenantResources() {
  return useMutation({
    mutationFn: (input: { tenantName: string; resourceType?: string }) =>
      api<{
        resources: { resourceArn?: string; resourceType?: string }[];
        nextToken?: string;
      }>("/aws/email/v2/tenants/resources/list", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useSesDeleteTenant() {
  return useMutation({
    mutationFn: (tenantName: string) =>
      api<{ deleted: boolean }>("/aws/email/v2/tenants/delete", {
        method: "POST",
        body: JSON.stringify({ tenantName }),
      }),
  });
}
