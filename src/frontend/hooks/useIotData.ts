import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface IotNamedShadow {
  name: string | null;
  timestamp: number | null;
}

const BASE = "/aws/iotdata";
const thingQ = (thingName: string) => `?thingName=${encodeURIComponent(thingName)}`;

export function useIotShadow(thingName: string | null) {
  return useQuery({
    queryKey: ["iotdata", "shadow", thingName],
    queryFn: () =>
      api<{ thingName: string; payload: any }>(
        `${BASE}/things/${encodeURIComponent(thingName!)}/shadow`,
      ),
    enabled: !!thingName,
  });
}

export function useIotUpdateShadow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { thingName: string; payload: string | object }) =>
      api(`${BASE}/things/${encodeURIComponent(body.thingName)}/shadow`, {
        method: "POST",
        body: JSON.stringify({ payload: body.payload }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["iotdata"] }),
  });
}

export function useIotDeleteShadow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (thingName: string) =>
      api(`${BASE}/things/${encodeURIComponent(thingName)}/shadow`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["iotdata"] }),
  });
}

export function useIotNamedShadows(thingName: string | null) {
  return useQuery({
    queryKey: ["iotdata", "named-shadows", thingName],
    queryFn: () =>
      api<{ shadows: IotNamedShadow[]; total: number }>(
        `${BASE}/things/${encodeURIComponent(thingName!)}/shadows`,
      ),
    enabled: !!thingName,
  });
}

export function useIotPublish() {
  return useMutation({
    mutationFn: (body: { topic: string; payload: string | object }) =>
      api(`${BASE}/publish`, { method: "POST", body: JSON.stringify(body) }),
  });
}
