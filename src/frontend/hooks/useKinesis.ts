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

export function useRegisterKinesisConsumer(streamName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (consumerName: string) =>
      api(`/aws/kinesis/streams/${encodeURIComponent(streamName)}/consumers`, {
        method: "POST",
        body: JSON.stringify({ consumerName }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "kinesis", "consumers", streamName] }),
  });
}

export function useDeregisterKinesisConsumer(streamName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (consumerName: string) =>
      api(
        `/aws/kinesis/streams/${encodeURIComponent(streamName)}/consumers/${encodeURIComponent(consumerName)}`,
        { method: "DELETE" }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "kinesis", "consumers", streamName] }),
  });
}

export function useDescribeKinesisConsumer(
  streamName: string | null,
  consumerName: string | null
) {
  return useQuery<{ consumer: KinesisConsumer }>({
    queryKey: ["aws", "kinesis", "consumer", streamName, consumerName],
    queryFn: () =>
      api(
        `/aws/kinesis/streams/${encodeURIComponent(streamName!)}/consumers/${encodeURIComponent(consumerName!)}`
      ),
    enabled: !!streamName && !!consumerName,
  });
}

// ── SubscribeToShard (Enhanced Fan-out) ──────────────────

export interface SubscribeToShardEvent {
  sequenceNumber: string;
  data: string | null;
  partitionKey: string;
  approximateArrivalTimestamp?: Date;
  encryptionType?: string;
}

export function useSubscribeToShard(streamName: string) {
  return useMutation<
    { events: SubscribeToShardEvent[]; total: number },
    Error,
    { consumerARN: string; shardId: string; startingPosition?: { Type: string } }
  >({
    mutationFn: (params) =>
      api(`/aws/kinesis/streams/${encodeURIComponent(streamName)}/subscribe-to-shard`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
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

export function useAddKinesisTags(streamName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { tags: Record<string, string> }) =>
      api(`/aws/kinesis/streams/${encodeURIComponent(streamName)}/tags`, {
        method: "PUT",
        body: JSON.stringify(params),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "kinesis", "tags", streamName] }),
  });
}

export function useRemoveKinesisTags(streamName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tagKeys: string[]) =>
      api(`/aws/kinesis/streams/${encodeURIComponent(streamName)}/tags`, {
        method: "DELETE",
        body: JSON.stringify({ tagKeys }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "kinesis", "tags", streamName] }),
  });
}

// ── Stream Management (retention / encryption / mode) ────

function useInvalidateKinesis() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["aws", "kinesis", "streams"] });
    qc.invalidateQueries({ queryKey: ["aws", "kinesis", "stream"] });
  };
}

export function useIncreaseKinesisRetention(streamName: string) {
  const invalidate = useInvalidateKinesis();
  return useMutation({
    mutationFn: (retentionPeriodHours: number) =>
      api(`/aws/kinesis/streams/${encodeURIComponent(streamName)}/retention/increase`, {
        method: "POST",
        body: JSON.stringify({ retentionPeriodHours }),
      }),
    onSuccess: invalidate,
  });
}

export function useDecreaseKinesisRetention(streamName: string) {
  const invalidate = useInvalidateKinesis();
  return useMutation({
    mutationFn: (retentionPeriodHours: number) =>
      api(`/aws/kinesis/streams/${encodeURIComponent(streamName)}/retention/decrease`, {
        method: "POST",
        body: JSON.stringify({ retentionPeriodHours }),
      }),
    onSuccess: invalidate,
  });
}

export function useStartKinesisEncryption(streamName: string) {
  const invalidate = useInvalidateKinesis();
  return useMutation({
    mutationFn: (params: { encryptionType: string; keyId: string }) =>
      api(`/aws/kinesis/streams/${encodeURIComponent(streamName)}/encryption/start`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: invalidate,
  });
}

export function useStopKinesisEncryption(streamName: string) {
  const invalidate = useInvalidateKinesis();
  return useMutation({
    mutationFn: () =>
      api(`/aws/kinesis/streams/${encodeURIComponent(streamName)}/encryption/stop`, {
        method: "POST",
      }),
    onSuccess: invalidate,
  });
}

export interface KinesisMonitoringResult {
  streamName?: string;
  streamARN?: string;
  currentShardLevelMetrics: string[];
  desiredShardLevelMetrics: string[];
}

export function useEnableKinesisMonitoring(streamName: string) {
  const invalidate = useInvalidateKinesis();
  return useMutation({
    mutationFn: async (shardLevelMetrics: string[]) => {
      const res = await api<KinesisMonitoringResult>(
        `/aws/kinesis/streams/${encodeURIComponent(streamName)}/monitoring/enable`,
        { method: "POST", body: JSON.stringify({ shardLevelMetrics }) }
      );
      return { ...res, currentShardLevelMetrics: res.currentShardLevelMetrics || [] };
    },
    onSuccess: invalidate,
  });
}

export function useDisableKinesisMonitoring(streamName: string) {
  const invalidate = useInvalidateKinesis();
  return useMutation({
    mutationFn: (shardLevelMetrics: string[]) =>
      api<KinesisMonitoringResult>(
        `/aws/kinesis/streams/${encodeURIComponent(streamName)}/monitoring/disable`,
        { method: "POST", body: JSON.stringify({ shardLevelMetrics }) }
      ),
    onSuccess: invalidate,
  });
}

export function useUpdateKinesisStreamMode(streamName: string) {
  const invalidate = useInvalidateKinesis();
  return useMutation({
    mutationFn: (params: { streamARN: string; streamMode: string }) =>
      api(`/aws/kinesis/streams/${encodeURIComponent(streamName)}/stream-mode`, {
        method: "PUT",
        body: JSON.stringify(params),
      }),
    onSuccess: invalidate,
  });
}

// ── Resharding ───────────────────────────────────────────

export function useSplitKinesisShard(streamName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { shardToSplit: string; newStartingHashKey: string }) =>
      api(`/aws/kinesis/streams/${encodeURIComponent(streamName)}/shards/split`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "kinesis", "shards", streamName] }),
  });
}

export function useMergeKinesisShards(streamName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { shardToMerge: string; adjacentShardToMerge: string }) =>
      api(`/aws/kinesis/streams/${encodeURIComponent(streamName)}/shards/merge`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "kinesis", "shards", streamName] }),
  });
}
