// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useSSMParameters,
  useSSMParameter,
  usePutSSMParameter,
  useDeleteSSMParameter,
  useSSMGetParameters,
  useSSMParametersByPath,
  useSSMDeleteParameters,
  useSSMLabelParameter,
  useSSMInstanceInformation,
  useSSMParameterHistory,
  useSSMTags,
  useAddSSMTags,
  useRemoveSSMTags,
  useSSMCommands,
  useSSMSendCommand,
  useSSMCommandInvocations,
  useSSMCancelCommand,
} from "./useSSM";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ── Parameters ───────────────────────────────────────────

describe("useSSMParameters", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ parameters: [], total: 0 });
    const { result } = renderHook(() => useSSMParameters(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ssm/parameters");
  });
});

describe("useSSMParameter", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useSSMParameter(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded name in path", async () => {
    mockApi.mockResolvedValueOnce({ parameter: {} });
    const { result } = renderHook(() => useSSMParameter("/app/config"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ssm/parameters/%2Fapp%2Fconfig");
  });
});

describe("usePutSSMParameter", () => {
  it("calls api with POST", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => usePutSSMParameter(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "/app/x", value: "y", type: "String" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ssm/parameters",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("useDeleteSSMParameter", () => {
  it("calls api with DELETE and encoded name", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteSSMParameter(), { wrapper: createWrapper() });
    await result.current.mutateAsync("/app/config");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ssm/parameters/%2Fapp%2Fconfig",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("useSSMGetParameters", () => {
  it("calls api with POST batch body", async () => {
    mockApi.mockResolvedValueOnce({ parameters: [], invalidParameters: [] });
    const { result } = renderHook(() => useSSMGetParameters(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ Names: ["/a", "/b"], WithDecryption: true });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ssm/parameters/batch",
      expect.objectContaining({ method: "POST" })
    );
    const body = JSON.parse(mockApi.mock.calls[0][1].body);
    expect(body).toEqual({ Names: ["/a", "/b"], WithDecryption: true });
  });
});

describe("useSSMParametersByPath", () => {
  it("does NOT call api when path is null", () => {
    renderHook(() => useSSMParametersByPath(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded path", async () => {
    mockApi.mockResolvedValueOnce({ parameters: [], nextToken: null });
    const { result } = renderHook(() => useSSMParametersByPath("/app/dev"), { wrapper: createWrapper() });
    await waitFor(() => expect(mockApi).toHaveBeenCalled());
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ssm/parameters-by-path?path=%2Fapp%2Fdev"
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useSSMDeleteParameters", () => {
  it("calls api with POST and names", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSSMDeleteParameters(), { wrapper: createWrapper() });
    await result.current.mutateAsync(["/a", "/b"]);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ssm/parameters/delete-batch",
      expect.objectContaining({ method: "POST" })
    );
    expect(JSON.parse(mockApi.mock.calls[0][1].body)).toEqual({ Names: ["/a", "/b"] });
  });
});

describe("useSSMLabelParameter", () => {
  it("calls api with POST and label body", async () => {
    mockApi.mockResolvedValueOnce({ invalidLabels: [], parameterVersion: 2 });
    const { result } = renderHook(() => useSSMLabelParameter(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ Name: "/a", ParameterVersion: 2, Labels: ["prod"] });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ssm/parameters/label",
      expect.objectContaining({ method: "POST" })
    );
    expect(JSON.parse(mockApi.mock.calls[0][1].body)).toEqual({
      Name: "/a",
      ParameterVersion: 2,
      Labels: ["prod"],
    });
  });
});

describe("useSSMInstanceInformation", () => {
  it("calls api with GET", async () => {
    mockApi.mockResolvedValueOnce({ instances: [], total: 0 });
    const { result } = renderHook(() => useSSMInstanceInformation(), { wrapper: createWrapper() });
    await waitFor(() => expect(mockApi).toHaveBeenCalledWith("/aws/ssm/instance-information"));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

// ── Parameter History ────────────────────────────────────

describe("useSSMParameterHistory", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useSSMParameterHistory(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded name and /history path", async () => {
    mockApi.mockResolvedValueOnce({ history: [], total: 0 });
    const { result } = renderHook(() => useSSMParameterHistory("/app/config"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ssm/parameters/%2Fapp%2Fconfig/history");
  });
});

// ── Tags ────────────────────────────────────────────────

describe("useSSMTags", () => {
  it("does NOT call api when resourceId is null", () => {
    renderHook(() => useSSMTags(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with resourceId param", async () => {
    mockApi.mockResolvedValueOnce({ tags: [] });
    const { result } = renderHook(() => useSSMTags("/app/config"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ssm/tags?resourceId=%2Fapp%2Fconfig");
  });
});

describe("useAddSSMTags", () => {
  it("calls api with POST", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useAddSSMTags(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ resourceId: "/app/x", tags: [] });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ssm/tags",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("useRemoveSSMTags", () => {
  it("calls api with DELETE and comma-separated tagKeys", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRemoveSSMTags(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ resourceId: "/app/x", tagKeys: ["env", "team"] });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ssm/tags?resourceId=%2Fapp%2Fx&tagKeys=env,team",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("SSM run command hooks", () => {
  it("useSSMCommands fetches the history", async () => {
    mockApi.mockResolvedValueOnce({ commands: [], total: 0 });
    const { result } = renderHook(() => useSSMCommands(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ssm/commands");
  });

  it("useSSMSendCommand posts the body", async () => {
    mockApi.mockResolvedValueOnce({ command: {} });
    const { result } = renderHook(() => useSSMSendCommand(), { wrapper: createWrapper() });
    result.current.mutate({ documentName: "d", instanceIds: ["i-1"] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ssm/commands", {
      method: "POST",
      body: JSON.stringify({ documentName: "d", instanceIds: ["i-1"] }),
    });
  });

  it("useSSMCommandInvocations is gated on id", async () => {
    mockApi.mockResolvedValueOnce({ invocations: [], total: 0 });
    const { result } = renderHook(() => useSSMCommandInvocations("c 1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ssm/commands/c%201/invocations");

    const idle = renderHook(() => useSSMCommandInvocations(null), { wrapper: createWrapper() });
    expect(idle.result.current.fetchStatus).toBe("idle");
  });

  it("useSSMCancelCommand deletes by id", async () => {
    mockApi.mockResolvedValueOnce({ cancelled: true });
    const { result } = renderHook(() => useSSMCancelCommand(), { wrapper: createWrapper() });
    result.current.mutate("c-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ssm/commands/c-1", { method: "DELETE" });
  });
});
