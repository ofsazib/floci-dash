import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());
const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) { return { __cmdName: name, ...args }; });
  };
});

vi.mock("@aws-sdk/client-transcribe", () => ({
  TranscribeClient: vi.fn(function () { return { send: mockSend }; }),
  ListTranscriptionJobsCommand: createCmd("ListTranscriptionJobsCommand"),
  GetTranscriptionJobCommand: createCmd("GetTranscriptionJobCommand"),
  StartTranscriptionJobCommand: createCmd("StartTranscriptionJobCommand"),
  DeleteTranscriptionJobCommand: createCmd("DeleteTranscriptionJobCommand"),
  ListVocabulariesCommand: createCmd("ListVocabulariesCommand"),
}));

vi.mock("../../clients/aws", () => ({ create: (Ctor: any, extra?: any) => new Ctor(extra) }));

import router from "./transcribe";

async function get(p: string) { return router.request(p, { method: "GET" }); }
async function post(p: string, b?: any) {
  return router.request(p, { method: "POST", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}
async function del(p: string) { return router.request(p, { method: "DELETE" }); }

beforeEach(() => mockSend.mockReset());

describe("Transcribe Routes", () => {
  it("GET /jobs — lists jobs", async () => {
    mockSend.mockResolvedValueOnce({ TranscriptionJobSummaries: [{ TranscriptionJobName: "job-1", TranscriptionJobStatus: "COMPLETED" }] });
    const res = await get("/jobs");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /jobs — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/jobs");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("GET /jobs/:name — gets job", async () => {
    mockSend.mockResolvedValueOnce({ TranscriptionJob: { TranscriptionJobName: "job-1", TranscriptionJobStatus: "COMPLETED" } });
    const res = await get("/jobs/job-1");
    expect(res.status).toBe(200);
  });

  it("POST /jobs — starts job (201)", async () => {
    mockSend.mockResolvedValueOnce({ TranscriptionJob: { TranscriptionJobName: "new-job" } });
    const res = await post("/jobs", { transcriptionJobName: "new-job", media: { mediaFileUri: "s3://bucket/file.mp3" } });
    expect(res.status).toBe(201);
  });

  it("POST /jobs — 400 if name missing", async () => {
    const res = await post("/jobs", { media: { mediaFileUri: "s3://b/f" } });
    expect(res.status).toBe(400);
  });

  it("POST /jobs — 400 if mediaFileUri missing", async () => {
    const res = await post("/jobs", { transcriptionJobName: "job-1" });
    expect(res.status).toBe(400);
  });

  it("DELETE /jobs/:name — deletes job", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/jobs/job-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it("GET /vocabularies — lists vocabularies", async () => {
    mockSend.mockResolvedValueOnce({ Vocabularies: [{ VocabularyName: "vocab-1", VocabularyState: "READY" }] });
    const res = await get("/vocabularies");
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /vocabularies — empty", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/vocabularies");
    const body = await res.json();
    expect(body.total).toBe(0);
  });
});
