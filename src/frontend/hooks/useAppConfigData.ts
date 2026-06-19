import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/client";

export function useStartConfigurationSession() {
  return useMutation({
    mutationFn: (body: {
      ApplicationIdentifier: string;
      EnvironmentIdentifier: string;
      ConfigurationProfileIdentifier: string;
      RequiredMinimumPollIntervalInSeconds?: number;
    }) =>
      api<{ initialConfigurationToken: string }>("/aws/appconfigdata/sessions", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  });
}

export function useGetLatestConfiguration() {
  return useMutation({
    mutationFn: (body: { configurationToken: string }) =>
      api<{
        content: string | null;
        contentType: string;
        versionLabel: string;
        nextPollConfigurationToken: string;
        nextPollIntervalInSeconds: number;
      }>("/aws/appconfigdata/configurations", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  });
}
