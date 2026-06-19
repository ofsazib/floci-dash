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
