import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface FirehoseStream {
  DeliveryStreamName: string;
  DeliveryStreamARN: string;
  DeliveryStreamStatus: string;
  CreateTimestamp?: number;
  Destinations?: { S3DestinationDescription?: { BucketARN?: string; Prefix?: string } }[];
}

// ── Streams ──────────────────────────────────────────────

export function useFirehoseStreams() {
  return useQuery<{ streams: FirehoseStream[]; total: number }>({
    queryKey: ["aws", "firehose", "streams"],
    queryFn: () => api("/aws/firehose/streams"),
    refetchInterval: 10000,
  });
}

export function useCreateFirehoseStream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      deliveryStreamName: string;
      s3DestinationConfiguration?: {
        bucketARN: string;
        prefix?: string;
      };
    }) =>
      api("/aws/firehose/streams", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "firehose", "streams"] }),
  });
}

export function useDeleteFirehoseStream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/firehose/streams/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "firehose", "streams"] }),
  });
}

// ── Records ──────────────────────────────────────────────

export function usePutFirehoseRecord(streamName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { data: string }) =>
      api(`/aws/firehose/streams/${encodeURIComponent(streamName)}/records`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "firehose", "streams"] }),
  });
}

export interface FirehoseTag {
  Key: string;
  Value: string;
}

export function useFirehoseStreamTags(name: string | null) {
  return useQuery<{ tags: FirehoseTag[]; hasMoreTags: boolean }>({
    queryKey: ["aws", "firehose", "streams", name, "tags"],
    queryFn: () => api(`/aws/firehose/streams/${encodeURIComponent(name!)}/tags`),
    enabled: !!name,
  });
}

export function useTagFirehoseStream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; tags: Record<string, string> }) =>
      api(`/aws/firehose/streams/${encodeURIComponent(params.name)}/tags`, {
        method: "POST",
        body: JSON.stringify({ tags: params.tags }),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["aws", "firehose", "streams", v.name, "tags"] }),
  });
}

export function useUntagFirehoseStream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; tagKeys: string[] }) =>
      api(`/aws/firehose/streams/${encodeURIComponent(params.name)}/tags`, {
        method: "DELETE",
        body: JSON.stringify({ tagKeys: params.tagKeys }),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["aws", "firehose", "streams", v.name, "tags"] }),
  });
}
