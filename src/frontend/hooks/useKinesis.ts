import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface KinesisStreamSummary {
  StreamName: string;
  StreamARN: string;
  StreamStatus: string;
  RetentionPeriodHours: number;
  StreamCreationTimestamp?: string;
  EnhancedMonitoring?: { ShardLevelMetrics: string[] }[];
  EncryptionType?: string;
  KeyId?: string;
  OpenShardCount?: number;
  ConsumerCount?: number;
}

export interface KinesisStreamDescription extends KinesisStreamSummary {
  Shards?: KinesisShard[];
}

export interface KinesisShard {
  ShardId: string;
  ParentShardId?: string;
  AdjacentParentShardId?: string;
  HashKeyRange: { StartingHashKey: string; EndingHashKey: string };
  SequenceNumberRange: { StartingSequenceNumber: string; EndingSequenceNumber?: string };
}

export interface KinesisConsumer {
  ConsumerName: string;
  ConsumerARN: string;
  ConsumerStatus: string;
  ConsumerCreationTimestamp?: string;
  StreamARN: string;
}

export interface KinesisRecord {
  SequenceNumber: string;
  ApproximateArrivalTimestamp?: Date;
  Data?: Uint8Array;
  PartitionKey: string;
  EncryptionType?: string;
}

export interface KinesisTag {
  Key: string;
  Value: string;
}

// ── Streams ──────────────────────────────────────────────

export function useKinesisStreams() {
  return useQuery<{ streams: KinesisStreamSummary[]; total: number }>({
    queryKey: ["aws", "kinesis", "streams"],
    queryFn: () => api("/aws/kinesis/streams"),
    refetchInterval: 10000,
  });
}

export function useKinesisStream(name: string | null) {
  return useQuery<{ stream: KinesisStreamDescription }>({
    queryKey: ["aws", "kinesis", "stream", name],
    queryFn: () => api(`/aws/kinesis/streams/${encodeURIComponent(name!)}`),
    enabled: !!name,
  });
}

export function useCreateKinesisStream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      streamName: string;
      shardCount?: number;
      streamModeDetails?: { streamMode: string };
    }) =>
      api("/aws/kinesis/streams", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "kinesis", "streams"] }),
  });
}

export function useDeleteKinesisStream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/kinesis/streams/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "kinesis", "streams"] }),
  });
}

// ── Shards ───────────────────────────────────────────────

export function useKinesisShards(streamName: string | null) {
  return useQuery<{ shards: KinesisShard[]; total: number }>({
    queryKey: ["aws", "kinesis", "shards", streamName],
    queryFn: () => api(`/aws/kinesis/streams/${encodeURIComponent(streamName!)}/shards`),
    enabled: !!streamName,
  });
}

// ── Consumers ────────────────────────────────────────────

export function useKinesisConsumers(streamName: string | null) {
  return useQuery<{ consumers: KinesisConsumer[]; total: number }>({
    queryKey: ["aws", "kinesis", "consumers", streamName],
    queryFn: () => api(`/aws/kinesis/streams/${encodeURIComponent(streamName!)}/consumers`),
    enabled: !!streamName,
  });
}

// ── Records ──────────────────────────────────────────────

export function usePutKinesisRecord(streamName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { data: string; partitionKey: string }) =>
      api(`/aws/kinesis/streams/${encodeURIComponent(streamName)}/records`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "kinesis", "streams"] }),
  });
}

export function usePutKinesisRecords(streamName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { records: { data: string; partitionKey: string }[] }) =>
      api(`/aws/kinesis/streams/${encodeURIComponent(streamName)}/records/batch`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "kinesis", "streams"] }),
  });
}

export function useKinesisRecords(streamName: string | null, shardId: string | null) {
  return useQuery<{ records: KinesisRecord[]; nextShardIterator?: string; millisBehindLatest?: number }>({
    queryKey: ["aws", "kinesis", "records", streamName, shardId],
    queryFn: () =>
      api(
        `/aws/kinesis/streams/${encodeURIComponent(streamName!)}/shards/${encodeURIComponent(shardId!)}/records?type=LATEST`
      ),
    enabled: !!streamName && !!shardId,
  });
}

// ── Tags ─────────────────────────────────────────────────

export function useKinesisTags(streamName: string | null) {
  return useQuery<{ tags: KinesisTag[] }>({
    queryKey: ["aws", "kinesis", "tags", streamName],
    queryFn: () => api(`/aws/kinesis/streams/${encodeURIComponent(streamName!)}/tags`),
    enabled: !!streamName,
  });
}
