import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormField,
  Header,
  Input,
  SpaceBetween,
  Tabs,
  Textarea,
} from "@cloudscape-design/components";
import {
  useRekognitionDetectLabels,
  useRekognitionDetectFaces,
  useRekognitionDetectText,
  useRekognitionDetectModerationLabels,
  useRekognitionCompareFaces,
  type RekognitionImage,
} from "../../hooks/useRekognition";

interface ImageFormState {
  useS3: boolean;
  bytes: string;
  bucket: string;
  key: string;
}

function imageFromForm(f: ImageFormState): RekognitionImage | null {
  if (f.useS3) {
    if (!f.bucket.trim() || !f.key.trim()) return null;
    return { s3Object: { bucket: f.bucket.trim(), name: f.key.trim() } };
  }
  if (!f.bytes.trim()) return null;
  return { bytes: f.bytes.trim() };
}

const EMPTY_IMAGE: ImageFormState = { useS3: false, bytes: "", bucket: "", key: "" };

function pretty(data: any) {
  return JSON.stringify(data, null, 2);
}

export function RekognitionDashboard() {
  const [tab, setTab] = useState("single");
  const [image, setImage] = useState<ImageFormState>(EMPTY_IMAGE);
  const [sourceImage, setSourceImage] = useState<ImageFormState>(EMPTY_IMAGE);
  const [targetImage, setTargetImage] = useState<ImageFormState>(EMPTY_IMAGE);
  const [result, setResult] = useState<{ operation: string; data: any } | null>(null);

  const detectLabels = useRekognitionDetectLabels();
  const detectFaces = useRekognitionDetectFaces();
  const detectText = useRekognitionDetectText();
  const detectModeration = useRekognitionDetectModerationLabels();
  const compareFaces = useRekognitionCompareFaces();

  const pending =
    detectLabels.isPending ||
    detectFaces.isPending ||
    detectText.isPending ||
    detectModeration.isPending ||
    compareFaces.isPending;

  const runSingle = async (operation: string) => {
    // Buttons are disabled until an image is present, so the form is never empty here.
    const img = imageFromForm(image)!;
    try {
      let data: any;
      if (operation === "labels") data = await detectLabels.mutateAsync({ image: img });
      else if (operation === "faces") data = await detectFaces.mutateAsync({ image: img });
      else if (operation === "text") data = await detectText.mutateAsync({ image: img });
      else data = await detectModeration.mutateAsync({ image: img });
      setResult({ operation, data });
    } catch {
      setResult({ operation, data: { error: "Detection failed" } });
    }
  };

  const runCompare = async () => {
    // The Compare button is disabled until both images are present.
    const src = imageFromForm(sourceImage)!;
    const tgt = imageFromForm(targetImage)!;
    try {
      const data = await compareFaces.mutateAsync({ sourceImage: src, targetImage: tgt });
      setResult({ operation: "compare-faces", data });
    } catch {
      setResult({ operation: "compare-faces", data: { error: "Face comparison failed" } });
    }
  };

  const updateImage = (field: keyof ImageFormState, value: string | boolean) =>
    setImage((p) => ({ ...p, [field]: value }));

  const updateSource = (field: keyof ImageFormState, value: string | boolean) =>
    setSourceImage((p) => ({ ...p, [field]: value }));

  const updateTarget = (field: keyof ImageFormState, value: string | boolean) =>
    setTargetImage((p) => ({ ...p, [field]: value }));

  const singleReady = !!imageFromForm(image);
  const compareReady = !!imageFromForm(sourceImage) && !!imageFromForm(targetImage);

  return (
    <SpaceBetween size="l">
      <Box>
        <Header variant="h2">Rekognition</Header>
        <Box color="text-body-secondary">
          Test Rekognition image analysis against the Floci emulator. Detection results are fixed
          stubs.
        </Box>
      </Box>

      <Tabs
        onChange={({ detail }: any) => setTab(detail.activeTabId)}
        activeTabId={tab}
        tabs={[
          { id: "single", label: "Image analysis" },
          { id: "compare", label: "Compare faces" },
        ]}
      />

      {tab === "single" && (
        <SpaceBetween size="m">
          <SpaceBetween size="s">
            <Checkbox checked={image.useS3} onChange={(e: any) => updateImage("useS3", e.detail.checked)}>
              Use an S3 object instead of pasted image bytes
            </Checkbox>
            {image.useS3 ? (
              <SpaceBetween direction="horizontal" size="s">
                <FormField label="S3 bucket">
                  <Input value={image.bucket} onChange={(e: any) => updateImage("bucket", e.detail.value)} placeholder="my-bucket" />
                </FormField>
                <FormField label="S3 object key">
                  <Input value={image.key} onChange={(e: any) => updateImage("key", e.detail.value)} placeholder="photos/cat.jpg" />
                </FormField>
              </SpaceBetween>
            ) : (
              <FormField label="Image bytes (base64)">
                <Textarea
                  value={image.bytes}
                  onChange={(e: any) => updateImage("bytes", e.detail.value)}
                  placeholder="Paste base64-encoded image bytes"
                  rows={4}
                />
              </FormField>
            )}
          </SpaceBetween>
          <SpaceBetween direction="horizontal" size="s">
            <Button onClick={() => runSingle("labels")} disabled={!singleReady || pending}>
              Detect labels
            </Button>
            <Button onClick={() => runSingle("faces")} disabled={!singleReady || pending}>
              Detect faces
            </Button>
            <Button onClick={() => runSingle("text")} disabled={!singleReady || pending}>
              Detect text
            </Button>
            <Button onClick={() => runSingle("moderation")} disabled={!singleReady || pending}>
              Detect moderation
            </Button>
          </SpaceBetween>
        </SpaceBetween>
      )}

      {tab === "compare" && (
        <SpaceBetween size="m">
          <ImageSourceSection
            title="Source image"
            form={sourceImage}
            onToggle={(checked: boolean) => updateSource("useS3", checked)}
            onField={(field: string, value: string) => updateSource(field as keyof ImageFormState, value)}
          />
          <ImageSourceSection
            title="Target image"
            form={targetImage}
            onToggle={(checked: boolean) => updateTarget("useS3", checked)}
            onField={(field: string, value: string) => updateTarget(field as keyof ImageFormState, value)}
          />
          <Button onClick={runCompare} disabled={!compareReady || pending}>
            Compare faces
          </Button>
        </SpaceBetween>
      )}

      {result && (
        <Alert
          type={result.data?.error ? "error" : "success"}
          dismissible
          onDismiss={() => setResult(null)}
        >
          <Box variant="code">
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
              {result.operation}: {pretty(result.data)}
            </pre>
          </Box>
        </Alert>
      )}
    </SpaceBetween>
  );
}

function ImageSourceSection({
  title,
  form,
  onToggle,
  onField,
}: {
  title: string;
  form: ImageFormState;
  onToggle: (checked: boolean) => void;
  onField: (field: string, value: string) => void;
}) {
  return (
    <SpaceBetween size="s">
      <Header variant="h3">{title}</Header>
      <Checkbox checked={form.useS3} onChange={(e: any) => onToggle(e.detail.checked)}>
        Use an S3 object instead of pasted image bytes
      </Checkbox>
      {form.useS3 ? (
        <SpaceBetween direction="horizontal" size="s">
          <FormField label={`${title} S3 bucket`}>
            <Input value={form.bucket} onChange={(e: any) => onField("bucket", e.detail.value)} placeholder="my-bucket" />
          </FormField>
          <FormField label={`${title} S3 object key`}>
            <Input value={form.key} onChange={(e: any) => onField("key", e.detail.value)} placeholder="photos/a.jpg" />
          </FormField>
        </SpaceBetween>
      ) : (
        <FormField label={`${title} image bytes (base64)`}>
          <Textarea
            value={form.bytes}
            onChange={(e: any) => onField("bytes", e.detail.value)}
            placeholder="Paste base64-encoded image bytes"
            rows={3}
          />
        </FormField>
      )}
    </SpaceBetween>
  );
}
