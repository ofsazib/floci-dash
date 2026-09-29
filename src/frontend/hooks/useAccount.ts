import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export type AlternateContactType = "BILLING" | "OPERATIONS" | "SECURITY";

export interface AlternateContact {
  AlternateContactType?: string;
  Name?: string;
  Title?: string;
  EmailAddress?: string;
  PhoneNumber?: string;
}

export function useAlternateContact(type: AlternateContactType | null) {
  return useQuery({
    queryKey: ["aws", "account", "alternate-contact", type],
    queryFn: () =>
      api<{ contact: AlternateContact | null }>(
        `/aws/account/alternate-contact?type=${encodeURIComponent(type!)}`
      ),
    enabled: !!type,
  });
}

export function usePutAlternateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      type: AlternateContactType;
      name: string;
      title: string;
      emailAddress: string;
      phoneNumber: string;
    }) =>
      api("/aws/account/alternate-contact", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({
        queryKey: ["aws", "account", "alternate-contact", variables.type],
      }),
  });
}
