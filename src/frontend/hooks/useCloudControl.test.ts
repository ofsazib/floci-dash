// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useCloudControlResources,
  useCloudControlResource,
  useCreateCloudControlResource,
  useDeleteCloudControlResource,
} from "./useCloudControl";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CloudControl hooks", () => {
  it("useCloudControlResources gated + posts typeName", async () => {
    mockApi.mockResolvedValueOnce({ resourceDescriptions: [], typeName: "T", nextToken: null });
    const { result } = renderHook(() => useCloudControlResources("T"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudcontrol/resources/list", {
      method: "POST",
      body: JSON.stringify({ typeName: "T" }),
    });

    const idle = renderHook(() => useCloudControlResources(null), {
      wrapper: createWrapper(),
    });
    expect(idle.result.current.fetchStatus).toBe("idle");
  });

  it("useCloudControlResource gated on both + encoded", async () => {
    mockApi.mockResolvedValueOnce({ resourceDescription: null });
    const { result } = renderHook(() => useCloudControlResource("T 1", "i 2"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudcontrol/resources/T%201/i%202");

    const idle = renderHook(() => useCloudControlResource("T", null), {
      wrapper: createWrapper(),
    });
    expect(idle.result.current.fetchStatus).toBe("idle");
    const idle2 = renderHook(() => useCloudControlResource(null, "i"), {
      wrapper: createWrapper(),
    });
    expect(idle2.result.current.fetchStatus).toBe("idle");
  });

  it("useCreateCloudControlResource posts body", async () => {
    mockApi.mockResolvedValueOnce({ status: "IN_PROGRESS" });
    const body = { typeName: "T", desiredState: { a: 1 } };
    const { result } = renderHook(() => useCreateCloudControlResource(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudcontrol/resources/create", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });

  it("useDeleteCloudControlResource deletes encoded path", async () => {
    mockApi.mockResolvedValueOnce({ status: "IN_PROGRESS" });
    const { result } = renderHook(() => useDeleteCloudControlResource("T 1"), {
      wrapper: createWrapper(),
    });
    result.current.mutate("i 2");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudcontrol/resources/T%201/i%202", {
      method: "DELETE",
    });
  });
});
