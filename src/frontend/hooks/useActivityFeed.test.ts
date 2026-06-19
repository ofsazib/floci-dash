// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useActivityFeed, addActivity, clearActivity } from "./useActivityFeed";

beforeEach(() => {
  localStorage.clear();
});

describe("useActivityFeed", () => {
  it("returns empty array initially", () => {
    const { result } = renderHook(() => useActivityFeed());
    expect(result.current.entries).toEqual([]);
  });

  it("adds an activity entry", () => {
    const { result } = renderHook(() => useActivityFeed());
    act(() => {
      result.current.addActivity({
        action: "navigate",
        service: "s3",
        description: "Opened S3",
      });
    });
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].action).toBe("navigate");
    expect(result.current.entries[0].service).toBe("s3");
    expect(result.current.entries[0].description).toBe("Opened S3");
    expect(result.current.entries[0].id).toBeTruthy();
    expect(result.current.entries[0].timestamp).toBeGreaterThan(0);
  });

  it("prepends new entries", () => {
    const { result } = renderHook(() => useActivityFeed());
    act(() => {
      result.current.addActivity({ action: "navigate", service: "s3", description: "First" });
      result.current.addActivity({ action: "create", service: "dynamodb", resource: "my-table", description: "Created table" });
    });
    expect(result.current.entries).toHaveLength(2);
    expect(result.current.entries[0].description).toBe("Created table");
    expect(result.current.entries[1].description).toBe("First");
  });

  it("clears all activity", () => {
    const { result } = renderHook(() => useActivityFeed());
    act(() => {
      result.current.addActivity({ action: "navigate", service: "s3", description: "Test" });
    });
    expect(result.current.entries).toHaveLength(1);
    act(() => {
      result.current.clearActivity();
    });
    expect(result.current.entries).toEqual([]);
  });

  it("persists across hook instances", () => {
    const { result: r1 } = renderHook(() => useActivityFeed());
    act(() => {
      r1.current.addActivity({ action: "navigate", service: "ec2", description: "Opened EC2" });
    });
    const { result: r2 } = renderHook(() => useActivityFeed());
    expect(r2.current.entries).toHaveLength(1);
    expect(r2.current.entries[0].service).toBe("ec2");
  });

  it("limits to MAX_ENTRIES (50)", () => {
    const { result } = renderHook(() => useActivityFeed());
    act(() => {
      for (let i = 0; i < 60; i++) {
        result.current.addActivity({ action: "navigate", service: "s3", description: `Entry ${i}` });
      }
    });
    expect(result.current.entries).toHaveLength(50);
  });

  it("supports static addActivity/clearActivity", () => {
    addActivity({ action: "delete", service: "s3", resource: "bucket-1", description: "Deleted bucket" });
    const { result } = renderHook(() => useActivityFeed());
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].action).toBe("delete");

    clearActivity();
    const { result: r2 } = renderHook(() => useActivityFeed());
    expect(r2.current.entries).toEqual([]);
  });
});
