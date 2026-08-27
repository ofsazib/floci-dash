// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useFisExperimentTemplates,
  useFisExperimentTemplate,
  useCreateFisExperimentTemplate,
  useUpdateFisExperimentTemplate,
  useDeleteFisExperimentTemplate,
  useFisExperiments,
  useStartFisExperiment,
  useStopFisExperiment,
} from "./useFIS";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("FIS hooks", () => {
  it("useFisExperimentTemplates fetches", async () => {
    mockApi.mockResolvedValueOnce({ experimentTemplates: [], total: 0 });
    const { result } = renderHook(() => useFisExperimentTemplates(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/fis/experiment-templates");
  });

  it("useFisExperimentTemplate gated + encoded", async () => {
    mockApi.mockResolvedValueOnce({ experimentTemplate: null });
    const { result } = renderHook(() => useFisExperimentTemplate("t 1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/fis/experiment-templates/t%201");

    const idle = renderHook(() => useFisExperimentTemplate(null), { wrapper: createWrapper() });
    expect(idle.result.current.fetchStatus).toBe("idle");
  });

  it("useCreateFisExperimentTemplate posts", async () => {
    mockApi.mockResolvedValueOnce({ id: "t" });
    const body = { name: "n", description: "d", roleArn: "r", actions: {} };
    const { result } = renderHook(() => useCreateFisExperimentTemplate(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/fis/experiment-templates", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });

  it("useUpdateFisExperimentTemplate patches", async () => {
    mockApi.mockResolvedValueOnce({ id: "t" });
    const { result } = renderHook(() => useUpdateFisExperimentTemplate(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({ id: "t 1", description: "new" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/fis/experiment-templates/t%201", {
      method: "PATCH",
      body: JSON.stringify({ description: "new", roleArn: undefined }),
    });
  });

  it("useDeleteFisExperimentTemplate deletes", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteFisExperimentTemplate(), {
      wrapper: createWrapper(),
    });
    result.current.mutate("t 1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/fis/experiment-templates/t%201", {
      method: "DELETE",
    });
  });

  it("useFisExperiments fetches", async () => {
    mockApi.mockResolvedValueOnce({ experiments: [], total: 0 });
    const { result } = renderHook(() => useFisExperiments(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/fis/experiments");
  });

  it("useStartFisExperiment posts templateId", async () => {
    mockApi.mockResolvedValueOnce({ id: "e" });
    const { result } = renderHook(() => useStartFisExperiment(), { wrapper: createWrapper() });
    result.current.mutate("tpl-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/fis/experiments", {
      method: "POST",
      body: JSON.stringify({ templateId: "tpl-1" }),
    });
  });

  it("useStopFisExperiment sends DELETE", async () => {
    mockApi.mockResolvedValueOnce({ state: "stopping" });
    const { result } = renderHook(() => useStopFisExperiment(), { wrapper: createWrapper() });
    result.current.mutate("e 1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/fis/experiments/e%201", { method: "DELETE" });
  });
});
