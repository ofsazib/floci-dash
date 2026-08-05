import { describe, it, expect } from "vitest";
import {
  stripControlChars,
  sanitizeName,
  sanitizeS3Key,
  sanitizeBucketName,
  validateJson,
  sanitizeText,
  sanitizeFileName,
  MAX_NAME_LENGTH,
  MAX_DOCUMENT_LENGTH,
  MAX_TEXT_LENGTH,
} from "./sanitize";

// ─── stripControlChars ───────────────────────────────────

describe("stripControlChars", () => {
  it("removes null bytes", () => {
    expect(stripControlChars("hello\x00world")).toBe("helloworld");
  });

  it("removes ESC character (\\x1B)", () => {
    expect(stripControlChars("a\x1Bb")).toBe("ab");
  });

  it("preserves tabs and newlines", () => {
    expect(stripControlChars("line1\n\tline2")).toBe("line1\n\tline2");
  });

  it("removes BEL (\\x07) and DEL (\\x7F)", () => {
    expect(stripControlChars("\x07beep\x7F")).toBe("beep");
  });

  it("returns empty string when given only control chars", () => {
    expect(stripControlChars("\x00\x01\x02")).toBe("");
  });

  it("returns unchanged string with no control chars", () => {
    expect(stripControlChars("hello world")).toBe("hello world");
  });
});

// ─── sanitizeName ────────────────────────────────────────

describe("sanitizeName", () => {
  it("returns empty string for non-string input", () => {
    expect(sanitizeName(123 as any)).toBe("");
    expect(sanitizeName(null as any)).toBe("");
    expect(sanitizeName(undefined as any)).toBe("");
  });

  it("returns sanitized string for normal input", () => {
    expect(sanitizeName("my-resource")).toBe("my-resource");
  });

  it("strips control characters", () => {
    expect(sanitizeName("hello\x00world")).toBe("helloworld");
  });

  it("truncates to maxLength parameter", () => {
    expect(sanitizeName("abcdefghij", 5)).toBe("abcde");
  });

  it("uses MAX_NAME_LENGTH when no maxLength provided", () => {
    const long = "a".repeat(MAX_NAME_LENGTH + 100);
    expect(sanitizeName(long)).toBe("a".repeat(MAX_NAME_LENGTH));
  });
});

// ─── sanitizeS3Key ───────────────────────────────────────

describe("sanitizeS3Key", () => {
  it("returns empty string for non-string input", () => {
    expect(sanitizeS3Key(123 as any)).toBe("");
    expect(sanitizeS3Key(null as any)).toBe("");
    expect(sanitizeS3Key(undefined as any)).toBe("");
  });

  it("returns normal key unchanged", () => {
    expect(sanitizeS3Key("folder/file.txt")).toBe("folder/file.txt");
  });

  it("strips leading ../ sequences", () => {
    expect(sanitizeS3Key("../etc/passwd")).toBe("etc/passwd");
  });

  it("strips leading ./ sequences", () => {
    expect(sanitizeS3Key("./config.yaml")).toBe("config.yaml");
  });

  it("strips leading /", () => {
    expect(sanitizeS3Key("/absolute/path")).toBe("absolute/path");
  });

  it("strips repeated ../ sequences", () => {
    expect(sanitizeS3Key("../../../../secret.txt")).toBe("secret.txt");
  });

  it("strips mixed ../ and ./ sequences", () => {
    expect(sanitizeS3Key(".././../etc/file")).toBe("etc/file");
  });

  it("strips control characters", () => {
    expect(sanitizeS3Key("data\x00/file")).toBe("data/file");
  });

  it("truncates to MAX_NAME_LENGTH", () => {
    const long = "a".repeat(MAX_NAME_LENGTH + 100);
    expect(sanitizeS3Key(long)).toBe("a".repeat(MAX_NAME_LENGTH));
  });
});

// ─── sanitizeBucketName ──────────────────────────────────

describe("sanitizeBucketName", () => {
  it("returns empty string for non-string input", () => {
    expect(sanitizeBucketName(456 as any)).toBe("");
    expect(sanitizeBucketName(null as any)).toBe("");
    expect(sanitizeBucketName(undefined as any)).toBe("");
  });

  it("returns valid bucket name unchanged", () => {
    expect(sanitizeBucketName("my-bucket.example")).toBe("my-bucket.example");
  });

  it("preserves uppercase letters", () => {
    expect(sanitizeBucketName("MyBucket")).toBe("MyBucket");
  });

  it("strips special characters", () => {
    expect(sanitizeBucketName("my_bucket@test!")).toBe("mybuckettest");
  });

  it("strips control characters", () => {
    expect(sanitizeBucketName("my\x00bucket")).toBe("mybucket");
  });

  it("truncates to 63 characters", () => {
    const long = "a".repeat(100);
    expect(sanitizeBucketName(long)).toBe("a".repeat(63));
  });
});

// ─── validateJson ────────────────────────────────────────

describe("validateJson", () => {
  it("rejects non-string input", () => {
    const result = validateJson(123 as any);
    expect(result.valid).toBe(false);
    expect((result as any).error).toBe("Expected a string");
  });

  it("rejects input exceeding MAX_DOCUMENT_LENGTH", () => {
    const long = "[" + "0".repeat(MAX_DOCUMENT_LENGTH) + "]";
    const result = validateJson(long);
    expect(result.valid).toBe(false);
    expect((result as any).error).toContain("Document exceeds");
  });

  it("rejects invalid JSON", () => {
    const result = validateJson("{not valid json");
    expect(result.valid).toBe(false);
    expect((result as any).error).toBe("Invalid JSON");
  });

  it("rejects JSON with __proto__ key at top level", () => {
    const result = validateJson('{"__proto__": {"isAdmin": true}}');
    expect(result.valid).toBe(false);
    expect((result as any).error).toContain("Disallowed key(s): __proto__");
  });

  it("rejects JSON with constructor key at top level", () => {
    const result = validateJson('{"constructor": 1}');
    expect(result.valid).toBe(false);
    expect((result as any).error).toContain("constructor");
  });

  it("rejects JSON with prototype key at top level", () => {
    const result = validateJson('{"prototype": {}}');
    expect(result.valid).toBe(false);
    expect((result as any).error).toContain("prototype");
  });

  it("rejects JSON with multiple disallowed keys", () => {
    const result = validateJson('{"__proto__": {}, "constructor": 1}');
    expect(result.valid).toBe(false);
    expect((result as any).error).toContain("__proto__, constructor");
  });

  it("accepts a valid JSON object", () => {
    const result = validateJson('{"name": "test", "value": 42}');
    expect(result.valid).toBe(true);
    expect((result as any).parsed).toEqual({ name: "test", value: 42 });
  });

  it("accepts a valid JSON array", () => {
    const result = validateJson("[1, 2, 3]");
    expect(result.valid).toBe(true);
    expect((result as any).parsed).toEqual([1, 2, 3]);
  });

  it("accepts a JSON primitive (string)", () => {
    const result = validateJson('"hello"');
    expect(result.valid).toBe(true);
    expect((result as any).parsed).toBe("hello");
  });

  it("accepts a JSON number", () => {
    const result = validateJson("42");
    expect(result.valid).toBe(true);
    expect((result as any).parsed).toBe(42);
  });

  it("rejects empty string (invalid JSON)", () => {
    const result = validateJson("");
    expect(result.valid).toBe(false);
  });

  // ── kind: "object" checks ─────────────────────────────

  it("accepts a plain object when kind is 'object'", () => {
    const result = validateJson('{"a": 1}', "object");
    expect(result.valid).toBe(true);
    expect((result as any).parsed).toEqual({ a: 1 });
  });

  it("rejects an array when kind is 'object'", () => {
    const result = validateJson("[1, 2]", "object");
    expect(result.valid).toBe(false);
    expect((result as any).error).toBe("Expected a JSON object");
  });

  it("rejects null when kind is 'object'", () => {
    const result = validateJson("null", "object");
    expect(result.valid).toBe(false);
    expect((result as any).error).toBe("Expected a JSON object");
  });

  // ── kind: "array" checks ──────────────────────────────

  it("accepts an array when kind is 'array'", () => {
    const result = validateJson("[1, 2, 3]", "array");
    expect(result.valid).toBe(true);
    expect((result as any).parsed).toEqual([1, 2, 3]);
  });

  it("rejects an object when kind is 'array'", () => {
    const result = validateJson('{"a": 1}', "array");
    expect(result.valid).toBe(false);
    expect((result as any).error).toBe("Expected a JSON array");
  });

  it("rejects a primitive when kind is 'array'", () => {
    const result = validateJson("42", "array");
    expect(result.valid).toBe(false);
  });

  // ── nested proto keys should be allowed ───────────────

  it("allows __proto__ in nested keys (not top-level)", () => {
    const result = validateJson('{"data": {"__proto__": null}}');
    expect(result.valid).toBe(true);
  });
});

// ─── sanitizeText ────────────────────────────────────────

describe("sanitizeText", () => {
  it("returns empty string for non-string input", () => {
    expect(sanitizeText(123 as any)).toBe("");
    expect(sanitizeText(null as any)).toBe("");
    expect(sanitizeText(undefined as any)).toBe("");
  });

  it("returns normal text unchanged", () => {
    expect(sanitizeText("Hello, world!")).toBe("Hello, world!");
  });

  it("strips control characters", () => {
    expect(sanitizeText("line1\x00line2")).toBe("line1line2");
  });

  it("truncates to maxLength parameter", () => {
    expect(sanitizeText("abcdefghij", 5)).toBe("abcde");
  });

  it("uses MAX_TEXT_LENGTH when no maxLength provided", () => {
    const long = "a".repeat(MAX_TEXT_LENGTH + 100);
    expect(sanitizeText(long)).toBe("a".repeat(MAX_TEXT_LENGTH));
  });
});

// ─── sanitizeFileName ────────────────────────────────────

describe("sanitizeFileName", () => {
  it("returns 'unnamed' for non-string input", () => {
    expect(sanitizeFileName(789 as any)).toBe("unnamed");
    expect(sanitizeFileName(null as any)).toBe("unnamed");
    expect(sanitizeFileName(undefined as any)).toBe("unnamed");
  });

  it("returns normal file name unchanged", () => {
    expect(sanitizeFileName("report.pdf")).toBe("report.pdf");
  });

  it("replaces path separators with underscores", () => {
    expect(sanitizeFileName("etc/passwd")).toBe("etc_passwd");
  });

  it("replaces backslashes with underscores", () => {
    expect(sanitizeFileName("C:\\Windows\\file.txt")).toBe("C__Windows_file.txt");
  });

  it("replaces angle brackets, colons, quotes, pipes, question marks, asterisks, slashes", () => {
    expect(sanitizeFileName(`/<>:"|?*\\`)).toBe("_________");
  });

  it("strips control characters", () => {
    expect(sanitizeFileName("file\x00name.txt")).toBe("filename.txt");
  });

  it("truncates to 255 characters", () => {
    const long = "a".repeat(300);
    expect(sanitizeFileName(long)).toBe("a".repeat(255));
  });
});
