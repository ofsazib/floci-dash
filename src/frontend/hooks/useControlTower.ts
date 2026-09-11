import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface LandingZone {
  arn: string;
  version: string | null;
  latestAvailableVersion: string | null;
  status: string | null;
  driftStatus: string | null;
  manifest: any;
  remediationTypes: string[];
}

export interface LandingZoneOperation {
  operationIdentifier: string;
  operationType: string | null;
  status: string | null;
}

export interface Baseline {
  arn: string;
  name: string | null;
  description: string | null;
}

export interface EnabledBaseline {
  arn: string;
  baselineIdentifier: string | null;
  baselineVersion: string | null;
  targetIdentifier: string | null;
  status: string | null;
  parentIdentifier: string | null;
}

export interface EnabledBaselineDetail extends EnabledBaseline {
  parameters: any[];
}

const BASE = "/aws/controltower";
const qs = (identifier: string) => `?identifier=${encodeURIComponent(identifier)}`;

// ---------- Landing zones ----------

export function useLandingZones() {
  return useQuery({
    queryKey: ["controltower", "landing-zones"],
    queryFn: () => api<{ landingZones: LandingZone[]; total: number }>(`${BASE}/landing-zones`),
  });
}

export function useCreateLandingZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { manifest: string | object; version: string; tags?: Record<string, string> }) =>
      api(`${BASE}/landing-zones`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["controltower"] }),
  });
}

export function useUpdateLandingZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      landingZoneIdentifier: string;
      version: string;
      manifest: string | object;
      remediationTypes?: string[];
    }) => api(`${BASE}/landing-zones/update`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["controltower"] }),
  });
}

export function useResetLandingZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (landingZoneIdentifier: string) =>
      api(`${BASE}/landing-zones/reset`, {
        method: "POST",
        body: JSON.stringify({ landingZoneIdentifier }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["controltower"] }),
  });
}

export function useDeleteLandingZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (landingZoneIdentifier: string) =>
      api(`${BASE}/landing-zones${qs(landingZoneIdentifier)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["controltower"] }),
  });
}

// ---------- Operations ----------

export function useLandingZoneOperations() {
  return useQuery({
    queryKey: ["controltower", "operations"],
    queryFn: () =>
      api<{ operations: LandingZoneOperation[]; total: number }>(`${BASE}/operations`),
  });
}

export function useLandingZoneOperation(identifier: string | null) {
  return useQuery({
    queryKey: ["controltower", "operations", "detail", identifier],
    queryFn: () =>
      api<{ operation: LandingZoneOperation & { startTime: string | null; endTime: string | null } }>(
        `${BASE}/operations/detail${qs(identifier!)}`,
      ),
    enabled: !!identifier,
  });
}

// ---------- Baselines ----------

export function useBaselines() {
  return useQuery({
    queryKey: ["controltower", "baselines"],
    queryFn: () => api<{ baselines: Baseline[]; total: number }>(`${BASE}/baselines`),
  });
}

// ---------- Enabled baselines ----------

export function useEnabledBaselines() {
  return useQuery({
    queryKey: ["controltower", "enabled-baselines"],
    queryFn: () =>
      api<{ enabledBaselines: EnabledBaseline[]; total: number }>(`${BASE}/enabled-baselines`),
  });
}

export function useEnabledBaselineDetail(identifier: string | null) {
  return useQuery({
    queryKey: ["controltower", "enabled-baselines", "detail", identifier],
    queryFn: () =>
      api<{ enabledBaseline: EnabledBaselineDetail }>(
        `${BASE}/enabled-baselines/detail${qs(identifier!)}`,
      ),
    enabled: !!identifier,
  });
}

export function useEnableBaseline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      baselineIdentifier: string;
      baselineVersion: string;
      targetIdentifier: string;
      parameters?: any[] | string;
    }) => api(`${BASE}/enabled-baselines/enable`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["controltower"] }),
  });
}

export function useUpdateEnabledBaseline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      enabledBaselineIdentifier: string;
      baselineVersion: string;
      parameters?: any[] | string;
    }) =>
      api(`${BASE}/enabled-baselines/update`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["controltower"] }),
  });
}

export function useResetEnabledBaseline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enabledBaselineIdentifier: string) =>
      api(`${BASE}/enabled-baselines/reset`, {
        method: "POST",
        body: JSON.stringify({ enabledBaselineIdentifier }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["controltower"] }),
  });
}

// ---------- Baseline operations ----------

export function useBaselineOperation(identifier: string | null) {
  return useQuery({
    queryKey: ["controltower", "baseline-operations", identifier],
    queryFn: () =>
      api<{
        baselineOperation: {
          operationIdentifier: string;
          operationType: string | null;
          status: string | null;
          startTime: string | null;
          endTime: string | null;
        };
      }>(`${BASE}/baseline-operations/detail${qs(identifier!)}`),
    enabled: !!identifier,
  });
}
