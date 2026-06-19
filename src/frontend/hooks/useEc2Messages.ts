import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/client";

export function useEc2Messages(destination: string | null) {
  return useQuery({
    queryKey: ["aws", "ec2messages", "get", destination],
    queryFn: () =>
      api<{ Messages?: any[] }>("/aws/ec2messages/messages/get", {
        method: "POST",
        body: JSON.stringify({ Destination: destination }),
      }),
    enabled: !!destination,
  });
}

export function useAcknowledgeMessage() {
  return useMutation({
    mutationFn: (messageId: string) =>
      api("/aws/ec2messages/messages/acknowledge", {
        method: "POST",
        body: JSON.stringify({ MessageId: messageId }),
      }),
  });
}

export function useSendReply() {
  return useMutation({
    mutationFn: ({
      MessageId,
      Payload,
    }: {
      MessageId: string;
      Payload: string;
    }) =>
      api("/aws/ec2messages/messages/send-reply", {
        method: "POST",
        body: JSON.stringify({ MessageId, Payload }),
      }),
  });
}
