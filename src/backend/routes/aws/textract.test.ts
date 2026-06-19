import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());
const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) { return { __cmdName: name, ...args }; });
  };
});

vi.mock("@aws-sdk/client-textract", () => ({
  TextractClient: vi.fn(function () { return { send: mockSend }; }),
  DetectDocumentTextCommand: createCmd("DetectDocumentTextCommand"),
  AnalyzeDocumentCommand: createCmd("AnalyzeDocumentCommand"),
  StartDocumentTextDetectionCommand: createCmd("StartDocumentTextDetectionCommand"),
  GetDocumentTextDetectionCommand: createCmd("GetDocumentTextDetectionCommand"),
  StartDocumentAnalysisCommand: createCmd("StartDocumentAnalysisCommand"),
  GetDocumentAnalysisCommand: createCmd("GetDocumentAnalysisCommand"),
}));

vi.mock("../../clients/aws", () => ({ create: (Ctor: any, extra?: any) => new Ctor(extra) }));

import router from "./textract";

async function get(p: string) { return router.request(p, { method: "GET" }); }
async function post(p: string, b?: any) {
  return router.request(p, { method: "POST", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}

beforeEach(() => mockSend.mockReset());

describe("Textract Routes", () => {
  it("POST /detect-document-text — sync detect", async () => {
    mockSend.mockResolvedValueOnce({
      DocumentMetadata: { Pages: 1 },
      Blocks: [{ BlockType: "WORD", Text: "Hello", Id: "1" }],
      DetectDocumentTextModelVersion: "1.0",
    });
    const res = await post("/detect-document-text", { document: { bytes: "base64data" } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.blocks.length).toBe(1);
  });

  it("POST /analyze-document — sync analyze", async () => {
    mockSend.mockResolvedValueOnce({
      DocumentMetadata: { Pages: 1 },
      Blocks: [{ BlockType: "TABLE", Id: "1" }],
      AnalyzeDocumentModelVersion: "1.0",
    });
    const res = await post("/analyze-document", { document: { bytes: "data" }, featureTypes: ["TABLES"] });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.modelVersion).toBe("1.0");
  });

  it("POST /document-text-detection/start — starts async job (201)", async () => {
    mockSend.mockResolvedValueOnce({ JobId: "job-123" });
    const res = await post("/document-text-detection/start", { documentLocation: { S3Object: { Bucket: "b", Name: "n" } } });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.jobId).toBe("job-123");
  });

  it("GET /document-text-detection/:jobId — gets job result", async () => {
    mockSend.mockResolvedValueOnce({ JobStatus: "SUCCEEDED", Blocks: [{ BlockType: "LINE" }] });
    const res = await get("/document-text-detection/job-123");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.jobStatus).toBe("SUCCEEDED");
  });

  it("POST /document-analysis/start — starts async analysis (201)", async () => {
    mockSend.mockResolvedValueOnce({ JobId: "job-456" });
    const res = await post("/document-analysis/start", { documentLocation: { S3Object: { Bucket: "b", Name: "n" } }, featureTypes: ["TABLES"] });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.jobId).toBe("job-456");
  });

  it("GET /document-analysis/:jobId — gets analysis result", async () => {
    mockSend.mockResolvedValueOnce({ JobStatus: "SUCCEEDED", Blocks: [{ BlockType: "TABLE" }] });
    const res = await get("/document-analysis/job-456");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.jobStatus).toBe("SUCCEEDED");
  });
});
