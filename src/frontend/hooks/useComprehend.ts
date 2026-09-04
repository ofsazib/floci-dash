import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface TextWithLanguage {
  text: string;
  languageCode?: string;
}

export function useComprehendDetectSentiment() {
  return useMutation({
    mutationFn: (body: { text: string; languageCode: string }) =>
      api("/aws/comprehend/detect-sentiment", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useComprehendDetectKeyPhrases() {
  return useMutation({
    mutationFn: (body: { text: string; languageCode: string }) =>
      api("/aws/comprehend/detect-key-phrases", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useComprehendDetectDominantLanguage() {
  return useMutation({
    mutationFn: (body: { text: string }) =>
      api("/aws/comprehend/detect-dominant-language", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useComprehendDetectPiiEntities() {
  return useMutation({
    mutationFn: (body: { text: string; languageCode: string }) =>
      api("/aws/comprehend/detect-pii-entities", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useComprehendContainsPiiEntities() {
  return useMutation({
    mutationFn: (body: { text: string; languageCode: string }) =>
      api("/aws/comprehend/contains-pii-entities", { method: "POST", body: JSON.stringify(body) }),
  });
}
