/**
 * Input sanitization utilities for backend routes.
 *
 * Because the Floci Dash only talks to a local emulator via the AWS SDK,
 * the attack surface is limited. Sanitization here focuses on:
 *
 *   1. Path traversal in S3 object keys
 *   2. Control characters / newlines in resource names and identifiers
 *   3. Validating JSON documents (IAM policies, bucket policies, etc.)
 *   4. Rejecting obviously malformed input (prototype pollution, etc.)
 *   5. Reasonable length limits to prevent memory abuse
 */

/** Maximum reasonable length for most string fields (resource names, keys, etc.). */
export const MAX_NAME_LENGTH = 1024;

/** Maximum length for policy/document JSON strings. */
export const MAX_DOCUMENT_LENGTH = 1024 * 100; // 100 KB

/** Maximum length for generic user-provided text (message bodies, descriptions). */
export const MAX_TEXT_LENGTH = 1024 * 512; // 512 KB

/**
 * Strip control characters (except \t and \n) from a string.
 * AWS resource names shouldn't contain null bytes, ESC, etc.
 */
export function stripControlChars(value: string): string {
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

/**
 * Sanitize a resource identifier (name, key, ARN, etc.).
 * - Truncates to MAX_NAME_LENGTH
 * - Strips control characters
 */
export function sanitizeName(value: string, maxLength = MAX_NAME_LENGTH): string {
  if (typeof value !== "string") return "";
  return stripControlChars(value).slice(0, maxLength);
}

/**
 * Sanitize an S3 object key to prevent path traversal.
 * - Strips leading "../" and "./" sequences
 * - Strips control characters
 * - Truncates to MAX_NAME_LENGTH
 */
export function sanitizeS3Key(key: string): string {
  if (typeof key !== "string") return "";
  let cleaned = stripControlChars(key);
  // Strip leading path traversal sequences repeatedly
  while (/^(\.\.\/|\.\/|\/)+/.test(cleaned)) {
    cleaned = cleaned.replace(/^(\.\.\/|\.\/|\/)+/, "");
  }
  return cleaned.slice(0, MAX_NAME_LENGTH);
}

/**
 * Sanitize a bucket name: lowercase alphanumeric, dots, hyphens only,
 * and strip control characters. Also enforces DNS-compatible naming.
 */
export function sanitizeBucketName(name: string): string {
  if (typeof name !== "string") return "";
  return stripControlChars(name).replace(/[^a-z0-9.-]/gi, "").slice(0, 63);
}

/**
 * Validate that a string is parseable JSON.
 * Optionally restricts the parsed value to an object or array.
 */
export function validateJson(
  value: string,
  kind?: "object" | "array"
): { valid: true; parsed: any } | { valid: false; error: string } {
  if (typeof value !== "string") {
    return { valid: false, error: "Expected a string" };
  }
  if (value.length > MAX_DOCUMENT_LENGTH) {
    return { valid: false, error: `Document exceeds ${MAX_DOCUMENT_LENGTH} bytes` };
  }
  try {
    const parsed = JSON.parse(value);
    // Reject prototypes and __proto__ keys at the top level
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const protoKeys = Object.keys(parsed).filter(
        (k) => k === "__proto__" || k === "constructor" || k === "prototype"
      );
      if (protoKeys.length > 0) {
        return { valid: false, error: `Disallowed key(s): ${protoKeys.join(", ")}` };
      }
    }
    if (kind === "object" && (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null)) {
      return { valid: false, error: "Expected a JSON object" };
    }
    if (kind === "array" && !Array.isArray(parsed)) {
      return { valid: false, error: "Expected a JSON array" };
    }
    return { valid: true, parsed };
  } catch {
    return { valid: false, error: "Invalid JSON" };
  }
}

/**
 * Sanitize a user-supplied SNS/SQS/Lambda message body or description.
 * - Strips control characters
 * - Truncates to MAX_TEXT_LENGTH
 */
export function sanitizeText(value: string, maxLength = MAX_TEXT_LENGTH): string {
  if (typeof value !== "string") return "";
  return stripControlChars(value).slice(0, maxLength);
}

/**
 * Sanitize a file name from an upload.
 * - Strips path separators, control characters
 * - Limits length
 */
export function sanitizeFileName(name: string): string {
  if (typeof name !== "string") return "unnamed";
  return stripControlChars(name)
    .replace(/[/\\<>:"|?*]/g, "_")
    .slice(0, 255);
}


