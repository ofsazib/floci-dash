import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormField,
  Header,
  Select,
  SpaceBetween,
  Tabs,
  Textarea,
} from "@cloudscape-design/components";
import {
  useTranslateLanguages,
  useTranslateText,
  useTranslateDocument,
  type TranslateLanguage,
} from "../../hooks/useTranslate";

function buildOptions(languages: TranslateLanguage[], extra: { label: string; value: string }[] = []) {
  const seen = new Set<string>();
  const out: { label: string; value: string }[] = [];
  for (const o of [...extra, ...(languages || []).map((l) => ({
    label: l.languageName || l.languageCode || "",
    value: l.languageCode || "",
  }))]) {
    if (o.value && !seen.has(o.value)) {
      seen.add(o.value);
      out.push(o);
    }
  }
  return out;
}

export function TranslateDashboard() {
  const { data: langData } = useTranslateLanguages();
  const languages: TranslateLanguage[] = (langData as any)?.languages || [];
  const languageOptions = buildOptions(languages);

  const [tab, setTab] = useState("text");

  // Text translation state
  const [sourceText, setSourceText] = useState("");
  const [sourceLang, setSourceLang] = useState<any>({ label: "English", value: "en" });
  const [targetLang, setTargetLang] = useState<any>({ label: "French", value: "fr" });
  const translateText = useTranslateText();

  // Document translation state
  const [docContent, setDocContent] = useState("");
  const [docType, setDocType] = useState<any>({ label: "text/plain", value: "text/plain" });
  const [docSource, setDocSource] = useState<any>({ label: "English", value: "en" });
  const [docTarget, setDocTarget] = useState<any>({ label: "French", value: "fr" });
  const translateDocument = useTranslateDocument();

  const textResult: any = translateText.data;
  const docResult: any = translateDocument.data;

  const runText = () => {
    translateText.mutate({
      text: sourceText,
      sourceLanguageCode: sourceLang.value,
      targetLanguageCode: targetLang.value,
    });
  };

  const runDocument = () => {
    translateDocument.mutate({
      content: docContent,
      contentType: docType.value,
      sourceLanguageCode: docSource.value,
      targetLanguageCode: docTarget.value,
    });
  };

  return (
    <SpaceBetween size="l">
      <Box>
        <Header variant="h2">Translate</Header>
        <Box color="text-body-secondary">
          Translate text or documents with the Floci emulator (echoes input as the translated result).
        </Box>
      </Box>

      <Tabs
        onChange={({ detail }: any) => setTab(detail.activeTabId)}
        activeTabId={tab}
        tabs={[
          { id: "text", label: "Translate text" },
          { id: "document", label: "Translate document" },
        ]}
      />

      {tab === "text" && (
        <SpaceBetween size="m">
          <SpaceBetween direction="horizontal" size="s">
            <FormField label="Source language">
              <Select
                selectedOption={sourceLang}
                onChange={({ detail }: any) => setSourceLang(detail.selectedOption)}
                options={buildOptions(languages, [
                  { label: "Auto-detect", value: "auto" },
                  { label: "English", value: "en" },
                ])}
                placeholder="Select source"
              />
            </FormField>
            <FormField label="Target language">
              <Select
                selectedOption={targetLang}
                onChange={({ detail }: any) => setTargetLang(detail.selectedOption)}
                options={buildOptions(languages, [{ label: "French", value: "fr" }])}
                placeholder="Select target"
              />
            </FormField>
          </SpaceBetween>
          <FormField label="Text">
            <Textarea
              value={sourceText}
              onChange={({ detail }: any) => setSourceText(detail.value)}
              placeholder="Enter text to translate"
              rows={6}
            />
          </FormField>
          <Button onClick={runText} disabled={!sourceText.trim() || translateText.isPending}>
            Translate
          </Button>
          {translateText.isError && (
            <Alert type="error" dismissible onDismiss={() => translateText.reset()}>
              {(translateText.error as Error)?.message || "Translation failed"}
            </Alert>
          )}
          {textResult?.translatedText && (
            <Alert type="success">
              <Box variant="code">{textResult.translatedText}</Box>
            </Alert>
          )}
        </SpaceBetween>
      )}

      {tab === "document" && (
        <SpaceBetween size="m">
          <SpaceBetween direction="horizontal" size="s">
            <FormField label="Source language">
              <Select
                selectedOption={docSource}
                onChange={({ detail }: any) => setDocSource(detail.selectedOption)}
                options={languageOptions}
                placeholder="Select source"
              />
            </FormField>
            <FormField label="Target language">
              <Select
                selectedOption={docTarget}
                onChange={({ detail }: any) => setDocTarget(detail.selectedOption)}
                options={languageOptions}
                placeholder="Select target"
              />
            </FormField>
            <FormField label="Content type">
              <Select
                selectedOption={docType}
                onChange={({ detail }: any) => setDocType(detail.selectedOption)}
                options={[
                  { label: "text/plain", value: "text/plain" },
                  { label: "text/html", value: "text/html" },
                  {
                    label: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    value: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                  },
                ]}
              />
            </FormField>
          </SpaceBetween>
          <FormField label="Document content">
            <Textarea
              value={docContent}
              onChange={({ detail }: any) => setDocContent(detail.value)}
              placeholder="Paste document content to translate"
              rows={6}
            />
          </FormField>
          <Button onClick={runDocument} disabled={!docContent.trim() || translateDocument.isPending}>
            Translate document
          </Button>
          {translateDocument.isError && (
            <Alert type="error" dismissible onDismiss={() => translateDocument.reset()}>
              {(translateDocument.error as Error)?.message || "Document translation failed"}
            </Alert>
          )}
          {docResult?.translatedDocument && (
            <Alert type="success">
              <Box variant="code">{docResult.translatedDocument}</Box>
            </Alert>
          )}
        </SpaceBetween>
      )}
    </SpaceBetween>
  );
}
