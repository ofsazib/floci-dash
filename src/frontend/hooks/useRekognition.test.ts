// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useRekognitionDetectLabels,
  useRekognitionDetectFaces,
  useRekognitionDetectText,
  useRekognitionDetectModerationLabels,
  useRekognitionCompareFaces,
} from "./useRekognition";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Rekognition hooks", () => {
  it("useRekognitionDetectLabels posts the image", async () => {
    mockApi.mockResolvedValueOnce({ labels: [{ name: "Floci" }] });
    const body = { image: { bytes: "aGVsbG8=" }, maxLabels: 5, minConfidence: 80 };
    const { result } = renderHook(() => useRekognitionDetectLabels(), { wrapper: createWrapper() });
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/rekognition/detect-labels", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });

  it("useRekognitionDetectFaces posts the image", async () => {
    mockApi.mockResolvedValueOnce({ faceDetails: [] });
    const body = { image: { s3Object: { bucket: "b1", name: "a.jpg" } } };
    const { result } = renderHook(() => useRekognitionDetectFaces(), { wrapper: createWrapper() });
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/rekognition/detect-faces", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });

  it("useRekognitionDetectText posts the image", async () => {
    mockApi.mockResolvedValueOnce({ textDetections: [] });
    const body = { image: { bytes: "aGVsbG8=" } };
    const { result } = renderHook(() => useRekognitionDetectText(), { wrapper: createWrapper() });
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/rekognition/detect-text", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });

  it("useRekognitionDetectModerationLabels posts the image", async () => {
    mockApi.mockResolvedValueOnce({ moderationLabels: [] });
    const body = { image: { bytes: "aGVsbG8=" } };
    const { result } = renderHook(() => useRekognitionDetectModerationLabels(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/rekognition/detect-moderation-labels", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });

  it("useRekognitionCompareFaces posts source and target images", async () => {
    mockApi.mockResolvedValueOnce({ faceMatches: [] });
    const body = {
      sourceImage: { s3Object: { bucket: "b1", name: "a.jpg" } },
      targetImage: { bytes: "aGVsbG8=" },
      similarityThreshold: 90,
    };
    const { result } = renderHook(() => useRekognitionCompareFaces(), { wrapper: createWrapper() });
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/rekognition/compare-faces", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });
});
