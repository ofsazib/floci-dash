import { Hono } from "hono";
import type { Context } from "hono";
import { getFlociEndpoint } from "../../clients/config";
import { sanitizeBucketName, sanitizeS3Key } from "../../clients/sanitize";

const router = new Hono();

// ── XML builders ──────────────────────────────────────────────

function buildSelectRequestXml(params: {
  expression: string;
  inputType: string;
  outputFormat: string;
  fileHeaderInfo?: string;
}): string {
  const { expression, inputType, outputFormat, fileHeaderInfo = "NONE" } = params;
/* istanbul ignore next */
  const inputTag = inputType === "JSON" ? "JSON" : "CSV";
  const inputExtra = inputType === "JSON"
    ? "<Type>DOCUMENT</Type>"
    : `<FileHeaderInfo>${fileHeaderInfo}</FileHeaderInfo><FieldDelimiter>,</FieldDelimiter>`;
  const outputTag = outputFormat === "JSON" ? "JSON" : "CSV";

  // Escape XML special chars in expression
  const safeExpr = expression
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<SelectObjectContentRequest xmlns="http://s3.amazonaws.com/doc/2006-03-01/">`,
    `  <Expression>${safeExpr}</Expression>`,
    `  <ExpressionType>SQL</ExpressionType>`,
    `  <InputSerialization>`,
    `    <${inputTag}>${inputExtra}</${inputTag}>`,
    `  </InputSerialization>`,
    `  <OutputSerialization>`,
    `    <${outputTag}/>`,
    `  </OutputSerialization>`,
    `  <RequestProgress><Enabled>false</Enabled></RequestProgress>`,
    `</SelectObjectContentRequest>`,
  ].join("\n");
}

// ── Event stream parser ───────────────────────────────────────

interface EventStreamMessage {
  headers: Record<string, string>;
  payload: Uint8Array;
}

/**
 * Parse the AWS event stream binary format returned by Floci's
 * S3SelectService.encodeEventStream().
 *
 * Each message:
 *   [4 B total length (BE)] [4 B headers length (BE)]
 *   [headers...] [payload bytes] [4 B CRC32 (BE)]
 *
 * Each header:
 *   [1 B name len] [name bytes] [1 B type (7=string)] [2 B value len (BE)] [value bytes]
 */
function parseEventStream(data: Uint8Array): EventStreamMessage[] {
  const messages: EventStreamMessage[] = [];
  let offset = 0;

  while (offset + 12 <= data.length) {
    // Total length (includes the 4 bytes for this field)
    const totalLen = new DataView(data.buffer, data.byteOffset + offset, 4).getInt32(0, false);
    if (totalLen < 12 || offset + totalLen > data.length) break;

    // Headers length
    const headersLen = new DataView(data.buffer, data.byteOffset + offset + 4, 4).getInt32(0, false);
    const headersStart = offset + 12;
    const headersEnd = headersStart + headersLen;

    // Parse headers
    const headers: Record<string, string> = {};
    let hPos = headersStart;
    while (hPos < headersEnd) {
      const nameLen = data[hPos]; hPos++;
      const name = new TextDecoder().decode(data.slice(hPos, hPos + nameLen)); hPos += nameLen;
      const valueType = data[hPos]; hPos++; // 7 = string

      const valueLen = new DataView(data.buffer, data.byteOffset + hPos, 2).getUint16(0, false);
      hPos += 2;

      const value = new TextDecoder().decode(data.slice(hPos, hPos + valueLen)); hPos += valueLen;
      headers[name] = value;
    }

    // Payload: between headers end and CRC (last 4 bytes of message)
    const payloadEnd = offset + totalLen - 4;
    const payload = data.slice(headersEnd, payloadEnd);

    messages.push({ headers, payload });

    offset += totalLen;
  }

  return messages;
}

// ── Routes ────────────────────────────────────────────────────

/**
 * POST /s3/buckets/:name/select
 *
 * Body: { key, expression, inputType?, outputFormat?, fileHeaderInfo? }
 *
 * Proxies to Floci's S3 Select endpoint (POST /{bucket}/{key}?select),
 * parses the event stream response, and returns:
 *   { result, stats: { bytesScanned, bytesProcessed, bytesReturned } }
 */
router.post("/buckets/:name/select", async (c: Context) => {
  const bucket = sanitizeBucketName(c.req.param("name")!);
  if (!bucket) return c.json({ error: "Invalid bucket name" }, 400);

  const body = await c.req.json<{
    key: string;
    expression: string;
    inputType?: string;
    outputFormat?: string;
    fileHeaderInfo?: string;
  }>();

  const key = sanitizeS3Key(body?.key || "");
  if (!key) return c.json({ error: "Object key is required" }, 400);

  const expression = (body?.expression || "").trim();
  if (!expression) return c.json({ error: "Expression is required" }, 400);

  const inputType = (body?.inputType || "CSV").toUpperCase();
  if (inputType !== "CSV" && inputType !== "JSON") {
    return c.json({ error: "inputType must be CSV or JSON" }, 400);
  }

  const outputFormat = (body?.outputFormat || "CSV").toUpperCase();
  if (outputFormat !== "CSV" && outputFormat !== "JSON") {
    return c.json({ error: "outputFormat must be CSV or JSON" }, 400);
  }

  const fileHeaderInfo = (body?.fileHeaderInfo || "NONE").toUpperCase();

  const xmlBody = buildSelectRequestXml({ expression, inputType, outputFormat, fileHeaderInfo });

  try {
    const flociBase = getFlociEndpoint().replace(/\/$/, "");
    const url = `${flociBase}/${encodeURIComponent(bucket)}/${encodeURIComponent(key)}?select`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: xmlBody,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return c.json(
        { error: `Floci returned ${res.status}: ${res.statusText}`, detail: text },
        res.status as any
      );
    }

    const rawData = new Uint8Array(await res.arrayBuffer());
    const messages = parseEventStream(rawData);

    // Extract Records payload and Stats
    let result = "";
    let stats: { bytesScanned: number; bytesProcessed: number; bytesReturned: number } | null = null;

    for (const msg of messages) {
      const eventType = msg.headers[":event-type"] || "";

      if (eventType === "Records") {
        result = new TextDecoder().decode(msg.payload);
      } else if (eventType === "Stats") {
        const statsXml = new TextDecoder().decode(msg.payload);
        const scanned = statsXml.match(/<BytesScanned>(\d+)<\/BytesScanned>/);
        const processed = statsXml.match(/<BytesProcessed>(\d+)<\/BytesProcessed>/);
        const returned = statsXml.match(/<BytesReturned>(\d+)<\/BytesReturned>/);
        stats = {
          bytesScanned: scanned ? parseInt(scanned[1]) : 0,
          bytesProcessed: processed ? parseInt(processed[1]) : 0,
          bytesReturned: returned ? parseInt(returned[1]) : 0,
        };
      }
    }

    return c.json({ result, stats });
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

export default router;
