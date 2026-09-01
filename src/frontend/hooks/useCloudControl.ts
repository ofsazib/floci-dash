import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface CloudControlResource {
  identifier: string | null;
}

export function useCloudControlResources(typeName: string | null) {
  return useQuery<{
    resourceDescriptions: CloudControlResource[];
    typeName: string;
    nextToken: string | null;
  }>({
    queryKey: ["aws", "cloudcontrol", "resources", typeName],
    queryFn: () =>
      api("/aws/cloudcontrol/resources/list", {
        method: "POST",
        body: JSON.stringify({ typeName }),
      }),
    enabled: !!typeName,
  });
}

export function useCloudControlResource(typeName: string | null, identifier: string | null) {
  return useQuery<{ resourceDescription: any }>({
    queryKey: ["aws", "cloudcontrol", "resource", typeName, identifier],
    queryFn: () =>
      api(
        `/aws/cloudcontrol/resources/${encodeURIComponent(typeName!)}/${encodeURIComponent(
          identifier!
        )}`
      ),
    enabled: !!typeName && !!identifier,
  });
}

export function useCreateCloudControlResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { typeName: string; desiredState: unknown }) =>
      api("/aws/cloudcontrol/resources/create", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "cloudcontrol", "resources"] }),
  });
}

export function useResourceRequestStatus(requestToken: string | null) {
  return useQuery<{
    typeName: string | null;
    identifier: string | null;
    requestToken: string;
    status: string | null;
    operation: string | null;
    errorCode: string | null;
    message: string | null;
  }>({
    queryKey: ["aws", "cloudcontrol", "request-status", requestToken],
    queryFn: () =>
      api(`/aws/cloudcontrol/requests/${encodeURIComponent(requestToken!)}`),
    enabled: !!requestToken,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "SUCCESS" || status === "FAILED" ? false : 2000;
/* istanbul ignore next */
    },
  });
}

export function useDeleteCloudControlResource(typeName: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (identifier: string) =>
      api(
        `/aws/cloudcontrol/resources/${encodeURIComponent(typeName!)}/${encodeURIComponent(
          identifier
        )}`,
        { method: "DELETE" }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "cloudcontrol", "resources"] }),
  });
}
