import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface S3SelectParams {
  key: string;
  expression: string;
  inputType?: "CSV" | "JSON";
  outputFormat?: "CSV" | "JSON";
  fileHeaderInfo?: "USE" | "IGNORE" | "NONE";
}

export interface S3SelectResult {
  result: string;
  stats: {
    bytesScanned: number;
    bytesProcessed: number;
    bytesReturned: number;
  } | null;
}

export function useS3Select(bucket: string | null) {
  return useMutation({
    mutationFn: (params: S3SelectParams) =>
      api<S3SelectResult>(`/aws/s3/buckets/${bucket}/select`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
  });
}
