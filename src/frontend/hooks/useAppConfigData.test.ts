// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import { useStartConfigurationSession, useGetLatestConfiguration } from "./useAppConfigData";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useStartConfigurationSession", () => {
  it("calls api with POST method and session body", async () => {
    mockApi.mockResolvedValueOnce({ initialConfigurationToken: "token-123" });
    const { result } = renderHook(() => useStartConfigurationSession(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      ApplicationIdentifier: "app-1",
      EnvironmentIdentifier: "env-1",
      ConfigurationProfileIdentifier: "profile-1",
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/appconfigdata/sessions",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("passes optional RequiredMinimumPollIntervalInSeconds", async () => {
    mockApi.mockResolvedValueOnce({ initialConfigurationToken: "token-456" });
    const { result } = renderHook(() => useStartConfigurationSession(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      ApplicationIdentifier: "app-1",
      EnvironmentIdentifier: "env-1",
      ConfigurationProfileIdentifier: "profile-1",
      RequiredMinimumPollIntervalInSeconds: 15,
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/appconfigdata/sessions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          ApplicationIdentifier: "app-1",
          EnvironmentIdentifier: "env-1",
          ConfigurationProfileIdentifier: "profile-1",
          RequiredMinimumPollIntervalInSeconds: 15,
        }),
      }),
    );
  });
});

describe("useGetLatestConfiguration", () => {
  it("calls api with POST method and configurationToken", async () => {
    mockApi.mockResolvedValueOnce({ content: "{}", contentType: "application/json" });
    const { result } = renderHook(() => useGetLatestConfiguration(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ configurationToken: "token-123" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/appconfigdata/configurations",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("sends configurationToken in body", async () => {
    mockApi.mockResolvedValueOnce({ content: null });
    const { result } = renderHook(() => useGetLatestConfiguration(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ configurationToken: "my-token" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/appconfigdata/configurations",
      expect.objectContaining({
        body: JSON.stringify({ configurationToken: "my-token" }),
      }),
    );
  });
});
