import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface RekognitionImage {
  bytes?: string;
  s3Object?: { bucket: string; name: string };
}

export function useRekognitionDetectLabels() {
  return useMutation({
    mutationFn: (body: { image: RekognitionImage; maxLabels?: number; minConfidence?: number }) =>
      api("/aws/rekognition/detect-labels", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useRekognitionDetectFaces() {
  return useMutation({
    mutationFn: (body: { image: RekognitionImage }) =>
      api("/aws/rekognition/detect-faces", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useRekognitionDetectText() {
  return useMutation({
    mutationFn: (body: { image: RekognitionImage }) =>
      api("/aws/rekognition/detect-text", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useRekognitionDetectModerationLabels() {
  return useMutation({
    mutationFn: (body: { image: RekognitionImage }) =>
      api("/aws/rekognition/detect-moderation-labels", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useRekognitionCompareFaces() {
  return useMutation({
    mutationFn: (body: {
      sourceImage: RekognitionImage;
      targetImage: RekognitionImage;
      similarityThreshold?: number;
    }) => api("/aws/rekognition/compare-faces", { method: "POST", body: JSON.stringify(body) }),
  });
}
