import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface SSOInstance {
  InstanceArn: string;
  IdentityStoreId: string;
  Name?: string;
  OwnerAccountId?: string;
  Status?: string;
}

export function useSSOInstances() {
  return useQuery({
    queryKey: ["aws", "ssoadmin", "instances"],
    queryFn: () => api<{ instances: SSOInstance[]; total: number }>("/aws/ssoadmin/instances"),
  });
}
