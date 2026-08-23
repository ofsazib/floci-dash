import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface STSCallerIdentity {
  account: string;
  arn: string;
  userId: string;
}

export interface STSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: string;
}

export function useSTSCallerIdentity() {
  return useQuery<STSCallerIdentity>({
    queryKey: ["aws", "sts", "caller-identity"],
    queryFn: () => api("/aws/sts/caller-identity"),
    refetchInterval: 60000,
  });
}

export function useSTSAssumeRole() {
  return useMutation({
    mutationFn: (params: {
      roleArn: string;
      sessionName?: string;
      durationSeconds?: number;
      policy?: string;
    }) =>
      api("/aws/sts/assume-role", {
        method: "POST",
        body: JSON.stringify(params),
      }),
  });
}

export function useSTSGetSessionToken() {
  return useMutation({
    mutationFn: (params: {
      durationSeconds?: number;
      serialNumber?: string;
      tokenCode?: string;
    }) =>
      api("/aws/sts/session-token", {
        method: "POST",
        body: JSON.stringify(params),
      }),
  });
}

export function useSTSAssumeRoleWithSAML() {
  return useMutation({
    mutationFn: (body: {
      roleArn: string;
      principalArn: string;
      samlAssertion: string;
      durationSeconds?: number;
    }) => api("/aws/sts/assume-role-with-saml", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useSTSAssumeRoleWithWebIdentity() {
  return useMutation({
    mutationFn: (body: {
      roleArn: string;
      webIdentityToken: string;
      roleSessionName?: string;
      durationSeconds?: number;
    }) => api("/aws/sts/assume-role-with-web-identity", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useSTSGetFederationToken() {
  return useMutation({
    mutationFn: (body: { name: string; durationSeconds?: number; policy?: string }) =>
      api("/aws/sts/federation-token", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useSTSDecodeAuthorizationMessage() {
  return useMutation({
    mutationFn: (encodedMessage: string) =>
      api("/aws/sts/decode-authorization-message", {
        method: "POST",
        body: JSON.stringify({ encodedMessage }),
      }),
  });
}
