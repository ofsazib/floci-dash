// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useEventBuses,
  useEventRules,
  useEventTargets,
  useEventArchives,
  useEventReplays,
  useCreateEventBus,
  useDeleteEventBus,
  usePutEventRule,
  useDeleteEventRule,
  useToggleEventRule,
  usePutEventTargets,
  useRemoveEventTarget,
  usePutEvents,
  useCreateEventArchive,
  useDeleteEventArchive,
} from "./useEvents";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useEventBuses", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ eventBuses: [] });
    const { result } = renderHook(() => useEventBuses(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/events/buses");
  });
});

describe("useEventRules", () => {
  it("calls api without query string when no eventBusName", async () => {
    mockApi.mockResolvedValueOnce({ rules: [] });
    const { result } = renderHook(() => useEventRules(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/events/rules");
  });

  it("appends eventBusName as query string when provided", async () => {
    mockApi.mockResolvedValueOnce({ rules: [] });
    const { result } = renderHook(() => useEventRules("default"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/events/rules?eventBusName=default");
  });

  it("encodes special characters in eventBusName", async () => {
    mockApi.mockResolvedValueOnce({ rules: [] });
    const { result } = renderHook(() => useEventRules("my bus"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/events/rules?eventBusName=my%20bus"
    );
  });
});

describe("useEventTargets", () => {
  it("does NOT call api when rule is null", () => {
    renderHook(() => useEventTargets(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with rule when rule is provided", async () => {
    mockApi.mockResolvedValueOnce({ targets: [] });
    const { result } = renderHook(() => useEventTargets("my-rule"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/events/targets?rule=my-rule");
  });

  it("includes eventBusName when provided alongside rule", async () => {
    mockApi.mockResolvedValueOnce({ targets: [] });
    const { result } = renderHook(() => useEventTargets("my-rule", "default"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/events/targets?rule=my-rule&eventBusName=default"
    );
  });

  it("encodes special characters in rule", async () => {
    mockApi.mockResolvedValueOnce({ targets: [] });
    const { result } = renderHook(() => useEventTargets("my rule & co"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/events/targets?rule=${encodeURIComponent("my rule & co")}`
    );
  });
});

describe("useEventArchives", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ archives: [] });
    const { result } = renderHook(() => useEventArchives(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/events/archives");
  });
});

describe("useEventReplays", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ replays: [] });
    const { result } = renderHook(() => useEventReplays(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/events/replays");
  });
});

describe("useCreateEventBus", () => {
  it("calls api with POST method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateEventBus(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "bus-1", description: "desc" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/events/buses",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "bus-1", description: "desc" }),
      })
    );
  });
});

describe("useDeleteEventBus", () => {
  it("calls api with DELETE method and name in query string", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteEventBus(), { wrapper: createWrapper() });
    await result.current.mutateAsync("bus-1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/events/buses?name=bus-1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("encodes special characters in name", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteEventBus(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my bus");
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/events/buses?name=${encodeURIComponent("my bus")}`,
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("usePutEventRule", () => {
  it("calls api with POST method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => usePutEventRule(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      name: "rule-1",
      eventBusName: "default",
      scheduleExpression: "rate(1 minute)",
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/events/rules",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "rule-1",
          eventBusName: "default",
          scheduleExpression: "rate(1 minute)",
        }),
      })
    );
  });
});

describe("useDeleteEventRule", () => {
  it("calls api with DELETE method, name in query (no eventBusName)", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteEventRule(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "rule-1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/events/rules?name=rule-1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("appends eventBusName when provided", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteEventRule(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "rule-1", eventBusName: "default" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/events/rules?name=rule-1&eventBusName=default",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("useToggleEventRule", () => {
  it("enable calls api with POST to /aws/events/rules/enable", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useToggleEventRule(), { wrapper: createWrapper() });
    await result.current.enable.mutateAsync({ name: "rule-1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/events/rules/enable",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "rule-1" }),
      })
    );
  });

  it("disable calls api with POST to /aws/events/rules/disable", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useToggleEventRule(), { wrapper: createWrapper() });
    await result.current.disable.mutateAsync({ name: "rule-1", eventBusName: "default" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/events/rules/disable",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "rule-1", eventBusName: "default" }),
      })
    );
  });
});

describe("usePutEventTargets", () => {
  it("calls api with POST method and serialized targets", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => usePutEventTargets(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      rule: "rule-1",
      eventBusName: "default",
      targets: [{ Id: "t1", Arn: "arn:aws:sqs:us-east-1:1:q" }],
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/events/targets",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          rule: "rule-1",
          eventBusName: "default",
          targets: [{ Id: "t1", Arn: "arn:aws:sqs:us-east-1:1:q" }],
        }),
      })
    );
  });
});

describe("useRemoveEventTarget", () => {
  it("calls api with DELETE method, rule + ids in query (no eventBusName)", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRemoveEventTarget(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ rule: "rule-1", ids: ["t1", "t2"] });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/events/targets?rule=rule-1&ids=t1,t2",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("appends eventBusName when provided", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRemoveEventTarget(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      rule: "rule-1",
      ids: ["t1"],
      eventBusName: "default",
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/events/targets?rule=rule-1&ids=t1&eventBusName=default",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("encodes special characters in rule", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRemoveEventTarget(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ rule: "my rule", ids: ["t1"] });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/events/targets?rule=${encodeURIComponent("my rule")}&ids=t1`,
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("usePutEvents", () => {
  it("calls api with POST and transforms entries to PascalCase", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => usePutEvents(), { wrapper: createWrapper() });
    await result.current.mutateAsync([
      { source: "src", detailType: "dt", detail: "{}", eventBusName: "default" },
    ]);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/events/put-events",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          entries: [
            {
              Source: "src",
              DetailType: "dt",
              Detail: "{}",
              EventBusName: "default",
            },
          ],
        }),
      })
    );
  });

  it("passes undefined EventBusName when not provided", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => usePutEvents(), { wrapper: createWrapper() });
    await result.current.mutateAsync([
      { source: "src", detailType: "dt", detail: "{}" },
    ]);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/events/put-events",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          entries: [
            { Source: "src", DetailType: "dt", Detail: "{}", EventBusName: undefined },
          ],
        }),
      })
    );
  });
});

describe("useCreateEventArchive", () => {
  it("calls api with POST method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateEventArchive(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      archiveName: "arc-1",
      eventSourceArn: "arn:aws:events:us-east-1:1:event-bus/default",
      retentionDays: 7,
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/events/archives",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          archiveName: "arc-1",
          eventSourceArn: "arn:aws:events:us-east-1:1:event-bus/default",
          retentionDays: 7,
        }),
      })
    );
  });
});

describe("useDeleteEventArchive", () => {
  it("calls api with DELETE method and name in query", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteEventArchive(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("arc-1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/events/archives?name=arc-1",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});
