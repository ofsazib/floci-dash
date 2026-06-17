import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface SQSQueue {
  queueUrl: string;
  queueName: string;
}

export interface SQSQueueAttributes {
  QueueArn?: string;
  ApproximateNumberOfMessages?: string;
  ApproximateNumberOfMessagesNotVisible?: string;
  ApproximateNumberOfMessagesDelayed?: string;
  CreatedTimestamp?: string;
  LastModifiedTimestamp?: string;
  VisibilityTimeout?: string;
  MaximumMessageSize?: string;
  DelaySeconds?: string;
  MessageRetentionPeriod?: string;
  FifoQueue?: string;
  ContentBasedDeduplication?: string;
  RedrivePolicy?: string;
  Policy?: string;
  DeduplicationScope?: string;
  [key: string]: string | undefined;
}

export interface SQSMessage {
  MessageId: string;
  MD5OfBody: string;
  Body: string;
  ReceiptHandle: string | null;
  Attributes?: Record<string, string>;
  MessageAttributes?: Record<string, { DataType: string; StringValue?: string; BinaryValue?: number[] }>;
}

export interface SQSBatchResult {
  successful: Array<{ Id: string; MessageId?: string; MD5OfMessageBody?: string }>;
  failed: Array<{ Id: string; Code: string; Message: string; SenderFault: boolean }>;
}

function extractQueueName(url: string): string {
  const parts = url.split("/");
  return parts[parts.length - 1] || url;
}

export function useSQSQueues() {
  return useQuery<{ queueUrls: string[] }>({
    queryKey: ["aws", "sqs", "queues"],
    queryFn: () => api("/aws/sqs/queues"),
    refetchInterval: 10000,
    select: (data) => ({
      queueUrls: data.queueUrls,
    }),
  });
}

export function useSQSQueueAttributes(queueUrl: string | null) {
  return useQuery<{ attributes: SQSQueueAttributes }>({
    queryKey: ["aws", "sqs", "attributes", queueUrl],
    queryFn: () => api(`/aws/sqs/queues/attributes?queueUrl=${encodeURIComponent(queueUrl!)}`),
    enabled: !!queueUrl,
    refetchInterval: 5000,
  });
}

export function useSQSQueueTags(queueUrl: string | null) {
  return useQuery<{ tags: Record<string, string> }>({
    queryKey: ["aws", "sqs", "tags", queueUrl],
    queryFn: () => api(`/aws/sqs/queues/tags?queueUrl=${encodeURIComponent(queueUrl!)}`),
    enabled: !!queueUrl,
  });
}

export function useSQSMessages(queueUrl: string | null) {
  return useQuery<{ messages: SQSMessage[] }>({
    queryKey: ["aws", "sqs", "messages", queueUrl],
    queryFn: () => api(`/aws/sqs/queues/messages?queueUrl=${encodeURIComponent(queueUrl!)}`),
    enabled: !!queueUrl,
    refetchInterval: 5000,
  });
}

export function useSQSDLQSources(queueUrl: string | null) {
  return useQuery<{ queueUrls: string[] }>({
    queryKey: ["aws", "sqs", "dlq-sources", queueUrl],
    queryFn: () => api(`/aws/sqs/queues/dlq-sources?queueUrl=${encodeURIComponent(queueUrl!)}`),
    enabled: !!queueUrl,
  });
}

export function useSQSMoveDLQMessages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { dlqUrl: string; sourceUrl: string; maxMessages?: number }) =>
      api("/aws/sqs/queues/dlq/move-tasks", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aws", "sqs", "queues"] });
      qc.invalidateQueries({ queryKey: ["aws", "sqs", "messages"] });
    },
  });
}

export function useCreateSQSQueue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      queueName: string;
      attributes?: Record<string, string>;
      tags?: Record<string, string>;
    }) => api("/aws/sqs/queues", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "sqs", "queues"] }),
  });
}

export function useDeleteSQSQueue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (queueUrl: string) =>
      api(`/aws/sqs/queues?queueUrl=${encodeURIComponent(queueUrl)}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aws", "sqs", "queues"] });
      qc.invalidateQueries({ queryKey: ["aws", "sqs"] });
    },
  });
}

export function useSetSQSAttributes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { queueUrl: string; attributes: Record<string, string> }) =>
      api(`/aws/sqs/queues/attributes?queueUrl=${encodeURIComponent(params.queueUrl)}`, {
        method: "PUT",
        body: JSON.stringify({ attributes: params.attributes }),
      }),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["aws", "sqs", "attributes", vars.queueUrl] }),
  });
}

export function useSQSTags() {
  const qc = useQueryClient();
  return {
    tag: useMutation({
      mutationFn: (params: { queueUrl: string; tags: Record<string, string> }) =>
        api(`/aws/sqs/queues/tags?queueUrl=${encodeURIComponent(params.queueUrl)}`, {
          method: "POST",
          body: JSON.stringify({ tags: params.tags }),
        }),
      onSuccess: (_data, vars) =>
        qc.invalidateQueries({ queryKey: ["aws", "sqs", "tags", vars.queueUrl] }),
    }),
    untag: useMutation({
      mutationFn: (params: { queueUrl: string; tagKeys: string[] }) =>
        api(`/aws/sqs/queues/tags?queueUrl=${encodeURIComponent(params.queueUrl)}&tagKeys=${params.tagKeys.join(",")}`, {
          method: "DELETE",
        }),
      onSuccess: (_data, vars) =>
        qc.invalidateQueries({ queryKey: ["aws", "sqs", "tags", vars.queueUrl] }),
    }),
  };
}

export function usePurgeSQSQueue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (queueUrl: string) =>
      api(`/aws/sqs/queues/purge?queueUrl=${encodeURIComponent(queueUrl)}`, { method: "POST" }),
    onSuccess: (_data, queueUrl) => {
      qc.invalidateQueries({ queryKey: ["aws", "sqs", "messages", queueUrl] });
      qc.invalidateQueries({ queryKey: ["aws", "sqs", "attributes", queueUrl] });
    },
  });
}

export function useSendSQSMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      queueUrl: string;
      messageBody: string;
      delaySeconds?: number;
      messageGroupId?: string;
      messageDeduplicationId?: string;
      messageAttributes?: Record<string, { DataType: string; StringValue?: string }>;
    }) =>
      api(`/aws/sqs/queues/messages?queueUrl=${encodeURIComponent(params.queueUrl)}`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["aws", "sqs", "messages", vars.queueUrl] }),
  });
}

export function useSendSQSBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      queueUrl: string;
      entries: Array<{
        Id: string;
        MessageBody: string;
        DelaySeconds?: number;
        MessageGroupId?: string;
        MessageDeduplicationId?: string;
      }>;
    }) =>
      api(`/aws/sqs/queues/messages/batch?queueUrl=${encodeURIComponent(params.queueUrl)}`, {
        method: "POST",
        body: JSON.stringify({ entries: params.entries }),
      }),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["aws", "sqs", "messages", vars.queueUrl] }),
  });
}

export function useDeleteSQSMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { queueUrl: string; receiptHandle: string }) =>
      api(
        `/aws/sqs/queues/messages/item?queueUrl=${encodeURIComponent(params.queueUrl)}&receiptHandle=${encodeURIComponent(params.receiptHandle)}`,
        { method: "DELETE" }
      ),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["aws", "sqs", "messages", vars.queueUrl] }),
  });
}

export function useChangeSQSVisibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { queueUrl: string; receiptHandle: string; visibilityTimeout: number }) =>
      api(`/aws/sqs/queues/messages/visibility?queueUrl=${encodeURIComponent(params.queueUrl)}`, {
        method: "POST",
        body: JSON.stringify({
          receiptHandle: params.receiptHandle,
          visibilityTimeout: params.visibilityTimeout,
        }),
      }),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["aws", "sqs", "messages", vars.queueUrl] }),
  });
}

export { extractQueueName };
