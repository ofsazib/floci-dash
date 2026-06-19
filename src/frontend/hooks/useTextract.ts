import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/client";

// ── Textract Operations ──────────────────────────────────

export function useTextractDetectText() {
  return useMutation({
    mutationFn: (params: { document: { bytes?: string; s3Object?: { bucket: string; name: string } } }) =>
      api("/aws/textract/detect-document-text", {
        method: "POST",
        body: JSON.stringify(params),
      }),
  });
}

export function useTextractAnalyzeDocument() {
  return useMutation({
    mutationFn: (params: {
      document: { bytes?: string; s3Object?: { bucket: string; name: string } };
      featureTypes?: string[];
    }) =>
      api("/aws/textract/analyze-document", {
        method: "POST",
        body: JSON.stringify(params),
      }),
  });
}
