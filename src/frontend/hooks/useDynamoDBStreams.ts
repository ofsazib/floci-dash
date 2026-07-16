import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface DynamoDBStream {
  streamArn: string;
  streamLabel: string;
  tableName: string;
}

export interface StreamShard {
  shardId: string;
  parentShardId: string | null;
  adjacentParentShardId: string | null;
  sequenceNumberRange: {
    startingSequenceNumber: string;
    endingSequenceNumber: string | null;
  } | null;
}

export interface DynamoDBStreamDetail {
  streamArn: string;
  streamLabel: string;
  streamStatus: string;
  streamViewType: string;
  tableName: string;
  creationRequestDateTime: number;
  keySchema: Array<{ attributeName: string; keyType: string }>;
  shards: StreamShard[];
  lastEvaluatedShardId: string | null;
}

export interface StreamRecord {
  eventID: string;
  eventName: string;
  eventVersion: string;
  eventSource: string;
  awsRegion: string;
  dynamodb: {
    approximateCreationDateTime: number;
    keys: Record<string, any>;
    newImage: Record<string, any>;
    oldImage: Record<string, any>;
    sequenceNumber: string;
    sizeBytes: number;
    streamViewType: string;
  } | null;
  userIdentity: any;
}

export interface GetRecordsResult {
  records: StreamRecord[];
  total: number;
  nextShardIterator: string | null;
  millisBehindLatest: number;
}

export function useDynamoDBStreams(tableName?: string | null) {
  return useQuery<{ streams: DynamoDBStream[]; total: number }>({
    queryKey: ["aws", "dynamodb", "streams", tableName],
    queryFn: () => {
      const params = new URLSearchParams();
      if (tableName) params.set("tableName", tableName);
      return api(`/aws/dynamodb/streams?${params.toString()}`);
    },
    refetchInterval: 15000,
  });
}

export function useDynamoDBStreamDetail(streamArn: string | null) {
  return useQuery<DynamoDBStreamDetail>({
    queryKey: ["aws", "dynamodb", "stream-detail", streamArn],
    queryFn: () =>
      api(`/aws/dynamodb/streams/${encodeURIComponent(streamArn!)}`),
    enabled: !!streamArn,
  });
}

export function useDynamoDBGetShardIterator() {
  return useMutation<
    { shardIterator: string },
    Error,
    {
      streamArn: string;
      shardId: string;
      shardIteratorType: string;
      sequenceNumber?: string;
    }
  >({
    mutationFn: (params) =>
      api(
        `/aws/dynamodb/streams/${encodeURIComponent(params.streamArn)}/shard-iterator`,
        {
          method: "POST",
          body: JSON.stringify({
            shardId: params.shardId,
            shardIteratorType: params.shardIteratorType,
            sequenceNumber: params.sequenceNumber,
          }),
        }
      ),
  });
}

export function useDynamoDBGetRecords() {
  return useMutation<GetRecordsResult, Error, { shardIterator: string; limit?: number }>({
    mutationFn: ({ shardIterator, limit }) =>
      api("/aws/dynamodb/streams/records", {
        method: "POST",
        body: JSON.stringify({ shardIterator, limit }),
      }),
  });
}

export function useDynamoDBStreamPoller() {
  const qc = useQueryClient();
  const getRecords = useDynamoDBGetRecords();

  const pollRecords = (shardIterator: string) =>
    getRecords.mutateAsync({ shardIterator });

  const continuePolling = (nextShardIterator: string | null) =>
    nextShardIterator ? getRecords.mutateAsync({ shardIterator: nextShardIterator }) : null;

  return { getRecords, pollRecords, continuePolling };
}
