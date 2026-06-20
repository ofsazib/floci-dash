import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  setGlobalErrorReporter,
  clearGlobalErrorReporter,
  reportError,
  withErrorReport,
} from "./globalErrorHandler";

beforeEach(() => {
  clearGlobalErrorReporter();
});

describe("setGlobalErrorReporter", () => {
  it("registers a reporter", () => {
    const reporter = vi.fn();
    setGlobalErrorReporter(reporter);
    reportError("test error");
    expect(reporter).toHaveBeenCalledWith("test error", undefined);
  });
});

describe("clearGlobalErrorReporter", () => {
  it("unregisters the reporter", () => {
    const reporter = vi.fn();
    setGlobalErrorReporter(reporter);
    clearGlobalErrorReporter();
    reportError("test error");
    expect(reporter).not.toHaveBeenCalled();
  });
});

describe("reportError", () => {
  it("no-ops when no reporter registered", () => {
    expect(() => reportError("test error")).not.toThrow();
  });

  it("extracts message from Error instance", () => {
    const reporter = vi.fn();
    setGlobalErrorReporter(reporter);
    reportError(new Error("something broke"));
    expect(reporter).toHaveBeenCalledWith("something broke", undefined);
  });

  it("passes context when provided", () => {
    const reporter = vi.fn();
    setGlobalErrorReporter(reporter);
    reportError("fail", "ECR::CreateRepository");
    expect(reporter).toHaveBeenCalledWith("fail", "ECR::CreateRepository");
  });

  it("handles non-string, non-Error types", () => {
    const reporter = vi.fn();
    setGlobalErrorReporter(reporter);
    reportError(42);
    expect(reporter).toHaveBeenCalledWith("An unexpected error occurred", undefined);
  });
});

describe("withErrorReport", () => {
  it("returns the result on success", async () => {
    const result = await withErrorReport(() => Promise.resolve("ok"));
    expect(result).toBe("ok");
  });

  it("reports and re-throws on error", async () => {
    const reporter = vi.fn();
    setGlobalErrorReporter(reporter);
    await expect(withErrorReport(() => Promise.reject(new Error("fail")))).rejects.toThrow("fail");
    expect(reporter).toHaveBeenCalledWith("fail", undefined);
  });

  it("passes context to reporter on error", async () => {
    const reporter = vi.fn();
    setGlobalErrorReporter(reporter);
    await expect(
      withErrorReport(() => Promise.reject(new Error("fail")), "test-context")
    ).rejects.toThrow("fail");
    expect(reporter).toHaveBeenCalledWith("fail", "test-context");
  });
});
