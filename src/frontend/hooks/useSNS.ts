import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface SNSTopic {
  TopicArn: string;
}

export interface SNSSubscription {
  SubscriptionArn: string;
  TopicArn: string;
  Protocol: string;
  Endpoint: string;
  Owner?: string;
}

export interface SNSPlatformApp {
  PlatformApplicationArn: string;
  Attributes?: Record<string, string>;
}

export interface SNSPlatformEndpoint {
  EndpointArn: string;
  Attributes?: Record<string, string>;
}

export interface SNSSmsMessage {
  Id: string;
  Region: string;
  PhoneNumber: string;
  Message: string;
  Subject?: string;
  Timestamp: string;
}

export interface SNSPushNotification {
  MessageId: string;
  EndpointArn: string;
  PlatformApplicationArn: string;
  Platform: string;
  Token: string;
  Payload: string;
  Subject?: string;
  Timestamp: string;
}

export function useSNSTopics() {
  return useQuery<{ topics: SNSTopic[] }>({
    queryKey: ["aws", "sns", "topics"],
    queryFn: () => api("/aws/sns/topics"),
    refetchInterval: 10000,
  });
}

export function useSNSTopicAttributes(topicArn: string | null) {
  return useQuery<{ attributes: Record<string, string> }>({
    queryKey: ["aws", "sns", "topic-attributes", topicArn],
    queryFn: () => api(`/aws/sns/topics/attributes?topicArn=${encodeURIComponent(topicArn!)}`),
    enabled: !!topicArn,
    refetchInterval: 10000,
  });
}

export function useSNSTopicTags(topicArn: string | null) {
  return useQuery<{ tags: Array<{ Key: string; Value: string }> }>({
    queryKey: ["aws", "sns", "topic-tags", topicArn],
    queryFn: () => api(`/aws/sns/topics/tags?topicArn=${encodeURIComponent(topicArn!)}`),
    enabled: !!topicArn,
  });
}

export function useSNSSubscriptions(topicArn: string | null) {
  return useQuery<{ subscriptions: SNSSubscription[] }>({
    queryKey: ["aws", "sns", "subscriptions", topicArn],
    queryFn: () => api(`/aws/sns/subscriptions?topicArn=${encodeURIComponent(topicArn!)}`),
    enabled: !!topicArn,
    refetchInterval: 5000,
  });
}

export function useSNSPlatformApps() {
  return useQuery<{ platformApplications: SNSPlatformApp[] }>({
    queryKey: ["aws", "sns", "platform-apps"],
    queryFn: () => api("/aws/sns/platform-apps"),
    refetchInterval: 15000,
  });
}

export function useSNSSmsMessages() {
  return useQuery<{ messages: SNSSmsMessage[] }>({
    queryKey: ["aws", "sns", "sms"],
    queryFn: () => api("/aws/sns/inspect/sms"),
    refetchInterval: 5000,
  });
}

export function useSNSPushNotifications() {
  return useQuery<{ notifications: SNSPushNotification[] }>({
    queryKey: ["aws", "sns", "push"],
    queryFn: () => api("/aws/sns/inspect/push"),
    refetchInterval: 5000,
  });
}

export function useCreateSNSTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      name: string;
      attributes?: Record<string, string>;
      tags?: Array<{ Key: string; Value: string }>;
    }) => api("/aws/sns/topics", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "sns", "topics"] }),
  });
}

export function useDeleteSNSTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (topicArn: string) =>
      api(`/aws/sns/topics?topicArn=${encodeURIComponent(topicArn)}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aws", "sns"] });
    },
  });
}

export function useSetSNSTopicAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { topicArn: string; attributeName: string; attributeValue: string }) =>
      api(`/aws/sns/topics/attributes?topicArn=${encodeURIComponent(params.topicArn)}`, {
        method: "PUT",
        body: JSON.stringify({
          attributeName: params.attributeName,
          attributeValue: params.attributeValue,
        }),
      }),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["aws", "sns", "topic-attributes", vars.topicArn] }),
  });
}

export function useSNSTopicTagsMutation() {
  const qc = useQueryClient();
  return {
    tag: useMutation({
      mutationFn: (params: { topicArn: string; tags: Array<{ Key: string; Value: string }> }) =>
        api(`/aws/sns/topics/tags?topicArn=${encodeURIComponent(params.topicArn)}`, {
          method: "POST",
          body: JSON.stringify({ tags: params.tags }),
        }),
      onSuccess: (_data, vars) =>
        qc.invalidateQueries({ queryKey: ["aws", "sns", "topic-tags", vars.topicArn] }),
    }),
    untag: useMutation({
      mutationFn: (params: { topicArn: string; tagKeys: string[] }) =>
        api(
          `/aws/sns/topics/tags?topicArn=${encodeURIComponent(params.topicArn)}&tagKeys=${params.tagKeys.join(",")}`,
          { method: "DELETE" }
        ),
      onSuccess: (_data, vars) =>
        qc.invalidateQueries({ queryKey: ["aws", "sns", "topic-tags", vars.topicArn] }),
    }),
  };
}

export function useSNSSubscribe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      topicArn: string;
      protocol: string;
      endpoint: string;
      attributes?: Record<string, string>;
    }) => api("/aws/sns/subscriptions", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["aws", "sns", "subscriptions", vars.topicArn] }),
  });
}

export function useSNSUnsubscribe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { subscriptionArn: string; topicArn: string }) =>
      api(`/aws/sns/subscriptions?subscriptionArn=${encodeURIComponent(params.subscriptionArn)}`, {
        method: "DELETE",
      }),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["aws", "sns", "subscriptions", vars.topicArn] }),
  });
}

export function useSNSPublish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      topicArn: string;
      message: string;
      subject?: string;
      messageAttributes?: Record<string, { DataType: string; StringValue?: string }>;
      messageGroupId?: string;
      messageDeduplicationId?: string;
    }) =>
      api("/aws/sns/topics/publish", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "sns"] }),
  });
}

export function useSNSPublishBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      topicArn: string;
      entries: Array<{
        Id: string;
        Message: string;
        Subject?: string;
        MessageGroupId?: string;
      }>;
    }) =>
      api("/aws/sns/topics/publish-batch", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "sns"] }),
  });
}

export function useCreateSNSPlatformApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      name: string;
      platform: string;
      attributes?: Record<string, string>;
    }) => api("/aws/sns/platform-apps", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "sns", "platform-apps"] }),
  });
}

export function useDeleteSNSPlatformApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) =>
      api(`/aws/sns/platform-apps?arn=${encodeURIComponent(arn)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "sns", "platform-apps"] }),
  });
}

export function extractTopicName(arn: string): string {
  const parts = arn.split(":");
  return parts[parts.length - 1] || arn;
}
