import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-rekognition", () => ({
  RekognitionClient: vi.fn(function () {
    return { send: mockSend };
  }),
  DetectLabelsCommand: createCmd("DetectLabelsCommand"),
  DetectFacesCommand: createCmd("DetectFacesCommand"),
  DetectTextCommand: createCmd("DetectTextCommand"),
  DetectModerationLabelsCommand: createCmd("DetectModerationLabelsCommand"),
  CompareFacesCommand: createCmd("CompareFacesCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./rekognition";

async function post(path: string, body?: any) {
  return router.request(path, {
    method: "POST",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

beforeEach(() => {
  mockSend.mockReset();
});

describe("Rekognition routes", () => {
  it("detects labels from base64 image bytes", async () => {
    mockSend.mockResolvedValueOnce({
      Labels: [{ Name: "Floci", Confidence: 99.9 }],
      LabelModelVersion: "2.0",
    });
    const res = await post("/detect-labels", { image: { bytes: "aGVsbG8=" }, maxLabels: 5, minConfidence: 80 });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.labels).toEqual([{ name: "Floci", confidence: 99.9 }]);
    expect(json.labelModelVersion).toBe("2.0");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DetectLabelsCommand");
    expect(cmd.MaxLabels).toBe(5);
    expect(cmd.MinConfidence).toBe(80);
    expect(Buffer.isBuffer(cmd.Image.Bytes)).toBe(true);
    expect(cmd.Image.Bytes.toString()).toBe("hello");
  });

  it("sends an undefined image for an empty image object", async () => {
    mockSend.mockResolvedValueOnce({ Labels: [] });
    const res = await post("/detect-labels", { image: {} });
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].Image).toBeUndefined();
  });

  it("detects labels from an S3 object reference", async () => {
    mockSend.mockResolvedValueOnce({ Labels: [] });
    const res = await post("/detect-labels", {
      image: { s3Object: { bucket: "my-bucket", name: "pic.jpg" } },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ labels: [], labelModelVersion: null });
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.Image).toEqual({ S3Object: { Bucket: "my-bucket", Name: "pic.jpg" } });
  });

  it("returns empty label fallbacks when Labels absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/detect-labels", { image: { bytes: "aGVsbG8=" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ labels: [], labelModelVersion: null });
  });

  it("rejects detect-labels without an image", async () => {
    const res = await post("/detect-labels", {});
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "image is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("detects faces", async () => {
    mockSend.mockResolvedValueOnce({ FaceDetails: [{ Confidence: 90 }] });
    const res = await post("/detect-faces", { image: { bytes: "aGVsbG8=" } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.faceDetails).toEqual([{ Confidence: 90 }]);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DetectFacesCommand");
  });

  it("returns empty face details when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/detect-faces", { image: { bytes: "aGVsbG8=" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ faceDetails: [] });
  });

  it("rejects detect-faces without an image", async () => {
    const res = await post("/detect-faces", {});
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "image is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("detects text", async () => {
    mockSend.mockResolvedValueOnce({
      TextDetections: [{ DetectedText: "Floci", Type: "LINE", Confidence: 99.9 }],
      TextModelVersion: "1.0",
    });
    const res = await post("/detect-text", { image: { bytes: "aGVsbG8=" } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.textDetections).toHaveLength(1);
    expect(json.textDetections[0].DetectedText).toBe("Floci");
    expect(json.textModelVersion).toBe("1.0");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DetectTextCommand");
  });

  it("returns empty text fallbacks when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/detect-text", { image: { bytes: "aGVsbG8=" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ textDetections: [], textModelVersion: null });
  });

  it("rejects detect-text without an image", async () => {
    const res = await post("/detect-text", {});
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "image is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("detects moderation labels", async () => {
    mockSend.mockResolvedValueOnce({
      ModerationLabels: [{ Name: "Explicit", Confidence: 88 }],
      ModerationModelVersion: "1.1",
    });
    const res = await post("/detect-moderation-labels", { image: { bytes: "aGVsbG8=" } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.moderationLabels).toHaveLength(1);
    expect(json.moderationModelVersion).toBe("1.1");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DetectModerationLabelsCommand");
  });

  it("returns empty moderation fallbacks when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/detect-moderation-labels", { image: { bytes: "aGVsbG8=" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ moderationLabels: [], moderationModelVersion: null });
  });

  it("rejects detect-moderation-labels without an image", async () => {
    const res = await post("/detect-moderation-labels", {});
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("compares faces between source and target images", async () => {
    mockSend.mockResolvedValueOnce({
      SourceImageFace: { Confidence: 99 },
      FaceMatches: [{ Similarity: 95 }],
      UnmatchedFaces: [],
    });
    const res = await post("/compare-faces", {
      sourceImage: { s3Object: { bucket: "b1", name: "a.jpg" } },
      targetImage: { bytes: "aGVsbG8=" },
      similarityThreshold: 90,
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sourceImageFace).toEqual({ Confidence: 99 });
    expect(json.faceMatches).toHaveLength(1);
    expect(json.unmatchedFaces).toEqual([]);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("CompareFacesCommand");
    expect(cmd.SimilarityThreshold).toBe(90);
    expect(cmd.SourceImage).toEqual({ S3Object: { Bucket: "b1", Name: "a.jpg" } });
    expect(Buffer.isBuffer(cmd.TargetImage.Bytes)).toBe(true);
  });

  it("returns null source face and empty lists when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/compare-faces", {
      sourceImage: { bytes: "aGVsbG8=" },
      targetImage: { bytes: "aGVsbG8=" },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sourceImageFace: null, faceMatches: [], unmatchedFaces: [] });
  });

  it("rejects compare-faces without a source image", async () => {
    const res = await post("/compare-faces", { targetImage: { bytes: "aGVsbG8=" } });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "sourceImage is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejects compare-faces without a target image", async () => {
    const res = await post("/compare-faces", { sourceImage: { bytes: "aGVsbG8=" } });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "targetImage is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });
});
