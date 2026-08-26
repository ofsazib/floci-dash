// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useMQBrokers,
  useMQBroker,
  useCreateMQBroker,
  useDeleteMQBroker,
  useRebootMQBroker,
  useMQUsers,
  useCreateMQUser,
  useDeleteMQUser,
} from "./useAmazonMQ";

describe("useAmazonMQ hooks", () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Broker queries ─────────────────────────────────────

  describe("useMQBrokers", () => {
    it("calls api with correct URL", async () => {
      mockApi.mockResolvedValueOnce({ brokers: [] });
      const { result } = renderHook(() => useMQBrokers(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/api/aws/mq/brokers");
    });
  });

  describe("useMQBroker", () => {
    it("enabled when id provided", async () => {
      mockApi.mockResolvedValueOnce({ broker: { brokerId: "b-1" } });
      const { result } = renderHook(() => useMQBroker("b-1"), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/api/aws/mq/brokers/b-1");
    });

    it("disabled when null", () => {
      const { result } = renderHook(() => useMQBroker(null), { wrapper: createWrapper() });
      expect(result.current.fetchStatus).toBe("idle");
    });
  });

  // ── Broker mutations ───────────────────────────────────

  describe("useCreateMQBroker", () => {
    it("calls api with POST", async () => {
      mockApi.mockResolvedValueOnce({ brokerId: "b-new" });
      const { result } = renderHook(() => useCreateMQBroker(), { wrapper: createWrapper() });
      await result.current.mutateAsync({ brokerName: "test", engineType: "ActiveMQ", hostInstanceType: "mq.t2.micro" });
      expect(mockApi).toHaveBeenCalledWith("/api/aws/mq/brokers", expect.objectContaining({ method: "POST" }));
    });
  });

  describe("useDeleteMQBroker", () => {
    it("calls api with DELETE", async () => {
      mockApi.mockResolvedValueOnce({ deleted: true });
      const { result } = renderHook(() => useDeleteMQBroker(), { wrapper: createWrapper() });
      await result.current.mutateAsync("b-1");
      expect(mockApi).toHaveBeenCalledWith("/api/aws/mq/brokers/b-1", expect.objectContaining({ method: "DELETE" }));
    });
  });

  describe("useRebootMQBroker", () => {
    it("calls api with POST", async () => {
      mockApi.mockResolvedValueOnce({ rebooted: true });
      const { result } = renderHook(() => useRebootMQBroker(), { wrapper: createWrapper() });
      await result.current.mutateAsync("b-1");
      expect(mockApi).toHaveBeenCalledWith("/api/aws/mq/brokers/b-1/reboot", expect.objectContaining({ method: "POST" }));
    });
  });

  // ── User queries ───────────────────────────────────────

  describe("useMQUsers", () => {
    it("enabled when brokerId provided", async () => {
      mockApi.mockResolvedValueOnce({ users: [{ username: "admin" }] });
      const { result } = renderHook(() => useMQUsers("b-1"), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/api/aws/mq/brokers/b-1/users");
    });

    it("disabled when null", () => {
      const { result } = renderHook(() => useMQUsers(null), { wrapper: createWrapper() });
      expect(result.current.fetchStatus).toBe("idle");
    });
  });

  // ── User mutations ─────────────────────────────────────

  describe("useCreateMQUser", () => {
    it("calls api with POST", async () => {
      mockApi.mockResolvedValueOnce({ username: "new-user" });
      const { result } = renderHook(() => useCreateMQUser(), { wrapper: createWrapper() });
      await result.current.mutateAsync({ brokerId: "b-1", username: "new-user", password: "pass123" });
      expect(mockApi).toHaveBeenCalledWith("/api/aws/mq/brokers/b-1/users/new-user", expect.objectContaining({ method: "POST" }));
    });
  });

  describe("useDeleteMQUser", () => {
    it("calls api with DELETE", async () => {
      mockApi.mockResolvedValueOnce({ deleted: true });
      const { result } = renderHook(() => useDeleteMQUser(), { wrapper: createWrapper() });
      await result.current.mutateAsync({ brokerId: "b-1", username: "admin" });
      expect(mockApi).toHaveBeenCalledWith("/api/aws/mq/brokers/b-1/users/admin", expect.objectContaining({ method: "DELETE" }));
    });
  });
});
