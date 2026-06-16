import { describe, it, expect } from "vitest";
import { formatBytes, formatItemValue } from "./utils";

describe("formatBytes", () => {
  it("returns 0 B for zero", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats bytes under 1 KB", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats exactly 1 KB", () => {
    expect(formatBytes(1024)).toBe("1 KB");
  });

  it("formats 1 MB", () => {
    expect(formatBytes(1024 * 1024)).toBe("1 MB");
  });

  it("formats 1 GB", () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe("1 GB");
  });

  it("formats fractional values to one decimal", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
  });
});

describe("formatItemValue", () => {
  it("returns em dash for null", () => {
    expect(formatItemValue(null)).toBe("—");
  });

  it("returns em dash for undefined", () => {
    expect(formatItemValue(undefined)).toBe("—");
  });

  it("stringifies objects as JSON", () => {
    expect(formatItemValue({ a: 1 })).toBe('{"a":1}');
  });

  it("stringifies arrays as JSON", () => {
    expect(formatItemValue([1, 2])).toBe("[1,2]");
  });

  it("returns strings unchanged", () => {
    expect(formatItemValue("hello")).toBe("hello");
  });

  it("converts numbers to strings", () => {
    expect(formatItemValue(42)).toBe("42");
  });
});
