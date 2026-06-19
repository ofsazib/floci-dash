import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface TranscriptionJobSummary {
  TranscriptionJobName: string;
  TranscriptionJobStatus: string;
  LanguageCode?: string;
  CreationTime?: number;
  CompletionTime?: number;
}

export interface TranscriptionJob extends TranscriptionJobSummary {
  Media?: { MediaFileUri?: string };
  MediaFormat?: string;
  Transcript?: { TranscriptFileUri?: string };
}

// ── Transcription Jobs ───────────────────────────────────

export function useTranscriptionJobs() {
  return useQuery<{ jobs: TranscriptionJobSummary[]; total: number }>({
    queryKey: ["aws", "transcribe", "jobs"],
    queryFn: () => api("/aws/transcribe/jobs"),
    refetchInterval: 10000,
  });
}

export function useTranscriptionJob(name: string | null) {
  return useQuery<{ job: TranscriptionJob }>({
    queryKey: ["aws", "transcribe", "job", name],
    queryFn: () => api(`/aws/transcribe/jobs/${encodeURIComponent(name!)}`),
    enabled: !!name,
  });
}

export function useStartTranscriptionJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      transcriptionJobName: string;
      media: { mediaFileUri: string };
      languageCode?: string;
      mediaFormat?: string;
    }) =>
      api("/aws/transcribe/jobs", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "transcribe", "jobs"] }),
  });
}

export function useDeleteTranscriptionJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/transcribe/jobs/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "transcribe", "jobs"] }),
  });
}

// ── Vocabularies ─────────────────────────────────────────

export function useTranscribeVocabularies() {
  return useQuery<{ vocabularies: any[]; total: number }>({
    queryKey: ["aws", "transcribe", "vocabularies"],
    queryFn: () => api("/aws/transcribe/vocabularies"),
  });
}
