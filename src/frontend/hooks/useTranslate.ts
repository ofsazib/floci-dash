import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface TranslateLanguage {
  languageCode?: string;
  languageName?: string;
}

export function useTranslateLanguages() {
  return useQuery<{ languages: TranslateLanguage[]; displayLanguageCode: string }>({
    queryKey: ["aws", "translate", "languages"],
    queryFn: () => api("/aws/translate/languages"),
  });
}

export function useTranslateText() {
  return useMutation({
    mutationFn: (body: {
      text: string;
      sourceLanguageCode: string;
      targetLanguageCode: string;
    }) => api("/aws/translate/translate-text", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useTranslateDocument() {
  return useMutation({
    mutationFn: (body: {
      content: string;
      contentType: string;
      sourceLanguageCode: string;
      targetLanguageCode: string;
    }) => api("/aws/translate/translate-document", { method: "POST", body: JSON.stringify(body) }),
  });
}
