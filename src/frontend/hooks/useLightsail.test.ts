// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useLightsailInstances,
  useLightsailInstance,
  useCreateLightsailInstance,
  useDeleteLightsailInstance,
  useStartLightsailInstance,
  useStopLightsailInstance,
  useRebootLightsailInstance,
  useLightsailDisks,
  useLightsailDisk,
  useCreateLightsailDisk,
  useDeleteLightsailDisk,
  useLightsailStaticIps,
  useAllocateLightsailStaticIp,
  useReleaseLightsailStaticIp,
  useAttachLightsailStaticIp,
  useDetachLightsailStaticIp,
  useLightsailKeyPairs,
  useCreateLightsailKeyPair,
  useDeleteLightsailKeyPair,
} from "./useLightsail";

describe("useLightsail hooks", () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Instance queries ───────────────────────────────────

  describe("useLightsailInstances", () => {
    it("calls api with correct URL", async () => {
      mockApi.mockResolvedValueOnce({ instances: [] });
      const { result } = renderHook(() => useLightsailInstances(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/api/aws/lightsail/instances");
    });
  });

  describe("useLightsailInstance", () => {
    it("enabled when name provided", async () => {
      mockApi.mockResolvedValueOnce({ instance: { name: "i-1" } });
      const { result } = renderHook(() => useLightsailInstance("i-1"), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/api/aws/lightsail/instances/i-1");
    });

    it("disabled when name is null", () => {
      const { result } = renderHook(() => useLightsailInstance(null), { wrapper: createWrapper() });
      expect(result.current.fetchStatus).toBe("idle");
    });
  });

  // ── Instance mutations ────────────────────────────────

  describe("useCreateLightsailInstance", () => {
    it("calls api with POST", async () => {
      mockApi.mockResolvedValueOnce({ operations: [] });
      const { result } = renderHook(() => useCreateLightsailInstance(), { wrapper: createWrapper() });
      await result.current.mutateAsync({ instanceNames: ["i-1"], bundleId: "nano_3_0", availabilityZone: "us-east-1a" });
      expect(mockApi).toHaveBeenCalledWith("/api/aws/lightsail/instances", expect.objectContaining({ method: "POST" }));
    });
  });

  describe("useDeleteLightsailInstance", () => {
    it("calls api with DELETE", async () => {
      mockApi.mockResolvedValueOnce({ deleted: true });
      const { result } = renderHook(() => useDeleteLightsailInstance(), { wrapper: createWrapper() });
      await result.current.mutateAsync("i-1");
      expect(mockApi).toHaveBeenCalledWith("/api/aws/lightsail/instances/i-1", expect.objectContaining({ method: "DELETE" }));
    });
  });

  describe("useStartLightsailInstance", () => {
    it("calls api with POST", async () => {
      mockApi.mockResolvedValueOnce({ operations: [] });
      const { result } = renderHook(() => useStartLightsailInstance(), { wrapper: createWrapper() });
      await result.current.mutateAsync("i-1");
      expect(mockApi).toHaveBeenCalledWith("/api/aws/lightsail/instances/i-1/start", expect.objectContaining({ method: "POST" }));
    });
  });

  describe("useStopLightsailInstance", () => {
    it("calls api with POST", async () => {
      mockApi.mockResolvedValueOnce({ operations: [] });
      const { result } = renderHook(() => useStopLightsailInstance(), { wrapper: createWrapper() });
      await result.current.mutateAsync("i-1");
      expect(mockApi).toHaveBeenCalledWith("/api/aws/lightsail/instances/i-1/stop", expect.objectContaining({ method: "POST" }));
    });
  });

  describe("useRebootLightsailInstance", () => {
    it("calls api with POST", async () => {
      mockApi.mockResolvedValueOnce({ rebooted: true });
      const { result } = renderHook(() => useRebootLightsailInstance(), { wrapper: createWrapper() });
      await result.current.mutateAsync("i-1");
      expect(mockApi).toHaveBeenCalledWith("/api/aws/lightsail/instances/i-1/reboot", expect.objectContaining({ method: "POST" }));
    });
  });

  // ── Disk queries ───────────────────────────────────────

  describe("useLightsailDisks", () => {
    it("calls api with correct URL", async () => {
      mockApi.mockResolvedValueOnce({ disks: [] });
      const { result } = renderHook(() => useLightsailDisks(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/api/aws/lightsail/disks");
    });
  });

  describe("useLightsailDisk", () => {
    it("enabled when name provided", async () => {
      mockApi.mockResolvedValueOnce({ disk: { name: "d-1" } });
      const { result } = renderHook(() => useLightsailDisk("d-1"), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/api/aws/lightsail/disks/d-1");
    });

    it("disabled when null", () => {
      const { result } = renderHook(() => useLightsailDisk(null), { wrapper: createWrapper() });
      expect(result.current.fetchStatus).toBe("idle");
    });
  });

  // ── Disk mutations ─────────────────────────────────────

  describe("useCreateLightsailDisk", () => {
    it("calls api with POST", async () => {
      mockApi.mockResolvedValueOnce({ operations: [] });
      const { result } = renderHook(() => useCreateLightsailDisk(), { wrapper: createWrapper() });
      await result.current.mutateAsync({ diskName: "d-1", sizeInGb: 8, availabilityZone: "us-east-1a" });
      expect(mockApi).toHaveBeenCalledWith("/api/aws/lightsail/disks", expect.objectContaining({ method: "POST" }));
    });
  });

  describe("useDeleteLightsailDisk", () => {
    it("calls api with DELETE", async () => {
      mockApi.mockResolvedValueOnce({ deleted: true });
      const { result } = renderHook(() => useDeleteLightsailDisk(), { wrapper: createWrapper() });
      await result.current.mutateAsync("d-1");
      expect(mockApi).toHaveBeenCalledWith("/api/aws/lightsail/disks/d-1", expect.objectContaining({ method: "DELETE" }));
    });
  });

  // ── Static IP queries ──────────────────────────────────

  describe("useLightsailStaticIps", () => {
    it("calls api with correct URL", async () => {
      mockApi.mockResolvedValueOnce({ staticIps: [] });
      const { result } = renderHook(() => useLightsailStaticIps(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/api/aws/lightsail/static-ips");
    });
  });

  // ── Static IP mutations ────────────────────────────────

  describe("useAllocateLightsailStaticIp", () => {
    it("calls api with POST", async () => {
      mockApi.mockResolvedValueOnce({ operations: [] });
      const { result } = renderHook(() => useAllocateLightsailStaticIp(), { wrapper: createWrapper() });
      await result.current.mutateAsync({ staticIpName: "sip-1" });
      expect(mockApi).toHaveBeenCalledWith("/api/aws/lightsail/static-ips", expect.objectContaining({ method: "POST" }));
    });
  });

  describe("useReleaseLightsailStaticIp", () => {
    it("calls api with DELETE", async () => {
      mockApi.mockResolvedValueOnce({ deleted: true });
      const { result } = renderHook(() => useReleaseLightsailStaticIp(), { wrapper: createWrapper() });
      await result.current.mutateAsync("sip-1");
      expect(mockApi).toHaveBeenCalledWith("/api/aws/lightsail/static-ips/sip-1", expect.objectContaining({ method: "DELETE" }));
    });
  });

  describe("useAttachLightsailStaticIp", () => {
    it("calls api with POST", async () => {
      mockApi.mockResolvedValueOnce({ operations: [] });
      const { result } = renderHook(() => useAttachLightsailStaticIp(), { wrapper: createWrapper() });
      await result.current.mutateAsync({ name: "sip-1", instanceName: "i-1" });
      expect(mockApi).toHaveBeenCalledWith("/api/aws/lightsail/static-ips/sip-1/attach", expect.objectContaining({ method: "POST" }));
    });
  });

  describe("useDetachLightsailStaticIp", () => {
    it("calls api with POST", async () => {
      mockApi.mockResolvedValueOnce({ operations: [] });
      const { result } = renderHook(() => useDetachLightsailStaticIp(), { wrapper: createWrapper() });
      await result.current.mutateAsync("sip-1");
      expect(mockApi).toHaveBeenCalledWith("/api/aws/lightsail/static-ips/sip-1/detach", expect.objectContaining({ method: "POST" }));
    });
  });

  // ── Key Pair queries ───────────────────────────────────

  describe("useLightsailKeyPairs", () => {
    it("calls api with correct URL", async () => {
      mockApi.mockResolvedValueOnce({ keyPairs: [] });
      const { result } = renderHook(() => useLightsailKeyPairs(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/api/aws/lightsail/key-pairs");
    });
  });

  // ── Key Pair mutations ─────────────────────────────────

  describe("useCreateLightsailKeyPair", () => {
    it("calls api with POST", async () => {
      mockApi.mockResolvedValueOnce({ keyPair: { name: "kp-1" } });
      const { result } = renderHook(() => useCreateLightsailKeyPair(), { wrapper: createWrapper() });
      await result.current.mutateAsync({ keyPairName: "kp-1" });
      expect(mockApi).toHaveBeenCalledWith("/api/aws/lightsail/key-pairs", expect.objectContaining({ method: "POST" }));
    });
  });

  describe("useDeleteLightsailKeyPair", () => {
    it("calls api with DELETE", async () => {
      mockApi.mockResolvedValueOnce({ deleted: true });
      const { result } = renderHook(() => useDeleteLightsailKeyPair(), { wrapper: createWrapper() });
      await result.current.mutateAsync("kp-1");
      expect(mockApi).toHaveBeenCalledWith("/api/aws/lightsail/key-pairs/kp-1", expect.objectContaining({ method: "DELETE" }));
    });
  });
});
