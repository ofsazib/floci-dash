import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormField,
  Header,
  Select,
  SpaceBetween,
  Textarea,
} from "@cloudscape-design/components";
import {
  useComprehendDetectSentiment,
  useComprehendDetectKeyPhrases,
  useComprehendDetectDominantLanguage,
  useComprehendDetectPiiEntities,
  useComprehendContainsPiiEntities,
} from "../../hooks/useComprehend";

/** Operations that analyze sentiment/key phrases accept these codes in Floci. */
const GENERAL_LANGUAGES = [
  { label: "English (en)", value: "en" },
  { label: "Spanish (es)", value: "es" },
  { label: "French (fr)", value: "fr" },
  { label: "German (de)", value: "de" },
  { label: "Italian (it)", value: "it" },
  { label: "Portuguese (pt)", value: "pt" },
  { label: "Arabic (ar)", value: "ar" },
  { label: "Hindi (hi)", value: "hi" },
  { label: "Japanese (ja)", value: "ja" },
  { label: "Korean (ko)", value: "ko" },
  { label: "Chinese (zh)", value: "zh" },
  { label: "Chinese (zh-TW)", value: "zh-TW" },
];

/** DetectPiiEntities / ContainsPiiEntities only accept English or Spanish in Floci. */
const PII_LANGUAGES = [
  { label: "English (en)", value: "en" },
  { label: "Spanish (es)", value: "es" },
];

const OPERATIONS = [
  { value: "sentiment", label: "Detect sentiment" },
  { value: "key-phrases", label: "Detect key phrases" },
  { value: "dominant-language", label: "Detect dominant language" },
  { value: "pii-entities", label: "Detect PII entities" },
  { value: "contains-pii", label: "Check for PII labels" },
];

function requiresLanguage(op: string) {
  return op !== "dominant-language";
}

function operationLabel(op: string) {
  // op is always one of OPERATIONS (set from the operation Select).
  return OPERATIONS.find((o) => o.value === op)!.label;
}

function pretty(data: any) {
  return JSON.stringify(data, null, 2);
}

export function ComprehendDashboard() {
  const [op, setOp] = useState<string>("sentiment");
  const [text, setText] = useState("");
  const [language, setLanguage] = useState<any>({ label: "English (en)", value: "en" });
  const [result, setResult] = useState<{ operation: string; data: any } | null>(null);

  const detectSentiment = useComprehendDetectSentiment();
  const detectKeyPhrases = useComprehendDetectKeyPhrases();
  const detectDominantLanguage = useComprehendDetectDominantLanguage();
  const detectPiiEntities = useComprehendDetectPiiEntities();
  const containsPiiEntities = useComprehendContainsPiiEntities();

  const pending =
    detectSentiment.isPending ||
    detectKeyPhrases.isPending ||
    detectDominantLanguage.isPending ||
    detectPiiEntities.isPending ||
    containsPiiEntities.isPending;

  const languageOptions = op === "pii-entities" || op === "contains-pii" ? PII_LANGUAGES : GENERAL_LANGUAGES;

  const run = async () => {
    // The Run button is disabled until text is present, so text is never empty here.
    try {
      let data: any;
      if (op === "dominant-language") {
        data = await detectDominantLanguage.mutateAsync({ text: text.trim() });
      } else {
        const body = { text: text.trim(), languageCode: language.value };
        if (op === "sentiment") data = await detectSentiment.mutateAsync(body);
        else if (op === "key-phrases") data = await detectKeyPhrases.mutateAsync(body);
        else if (op === "pii-entities") data = await detectPiiEntities.mutateAsync(body);
        else data = await containsPiiEntities.mutateAsync(body);
      }
      setResult({ operation: op, data });
    } catch {
      setResult({ operation: op, data: { error: "Analysis failed" } });
    }
  };

  return (
    <SpaceBetween size="l">
      <Box>
        <Header variant="h2">Comprehend</Header>
        <Box color="text-body-secondary">
          Test Comprehend text analysis against the Floci emulator. Results are fixed stubs.
        </Box>
      </Box>

      <FormField label="Operation">
        <Select
          selectedOption={OPERATIONS.find((o) => o.value === op)!}
          onChange={({ detail }: any) => setOp(detail.selectedOption.value)}
          options={OPERATIONS}
        />
      </FormField>

      <FormField label="Text">
        <Textarea
          value={text}
          onChange={({ detail }: any) => setText(detail.value)}
          placeholder="Enter text to analyze"
          rows={6}
        />
      </FormField>

      {requiresLanguage(op) && (
        <FormField label="Language code">
          <Select
            selectedOption={language}
            onChange={({ detail }: any) => setLanguage(detail.selectedOption)}
            options={languageOptions}
          />
        </FormField>
      )}

      <SpaceBetween direction="horizontal" size="s">
        <Button onClick={run} disabled={!text.trim() || pending}>
          Analyze
        </Button>
        <Button onClick={() => setResult(null)} disabled={!result}>
          Clear result
        </Button>
      </SpaceBetween>

      {result && (
        <Alert
          type={result.data?.error ? "error" : "success"}
          dismissible
          onDismiss={() => setResult(null)}
        >
          <Box variant="code">
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
              {operationLabel(result.operation)}: {pretty(result.data)}
            </pre>
          </Box>
        </Alert>
      )}
    </SpaceBetween>
  );
}
