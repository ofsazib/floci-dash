import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface SoClient {
  clientId: string;
  clientSecret: string;
  clientIdIssuedAt?: number;
  clientSecretExpiresAt?: number;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
}

export interface SoDeviceAuthorization {
  deviceCode: string;
  userCode: string;
  verificationUri?: string;
  verificationUriComplete?: string;
  expiresIn?: number;
  interval?: number;
}

export interface SoToken {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

export function useSoRegisterClient() {
  return useMutation({
    mutationFn: (input: { clientName: string; scopes?: string[] }) =>
      api<SoClient>("/aws/sso-oidc/clients", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useSoStartDeviceAuthorization() {
  return useMutation({
    mutationFn: (input: {
      clientId: string;
      clientSecret: string;
      startUrl?: string;
    }) =>
      api<SoDeviceAuthorization>("/aws/sso-oidc/device-authorization", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useSoCreateToken() {
  return useMutation({
    mutationFn: (input: {
      clientId: string;
      clientSecret: string;
      deviceCode: string;
    }) =>
      api<SoToken>("/aws/sso-oidc/token", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}
