import { useState } from "react";
import { ContentLayout, Header, Container, Toggle, Select, SpaceBetween, Box, Input, Button, FormField, Alert } from "@cloudscape-design/components";
import { useSettings } from "../stores/settings";
import { api } from "../lib/client";

export default function Settings() {
  const { darkMode, refreshInterval, toggleDarkMode, setRefreshInterval, flociEndpoint, setFlociEndpoint } = useSettings();
  const [endpointInput, setEndpointInput] = useState(flociEndpoint || "http://localhost:4566");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const refreshLabel = refreshInterval === 5000 ? "5 seconds"
    : refreshInterval === 10000 ? "10 seconds"
    : refreshInterval === 30000 ? "30 seconds"
    : "Off";

  async function handleSaveEndpoint() {
    setSaving(true);
    setStatus(null);
    try {
      await api("/system/floci-endpoint", { method: "PUT", body: JSON.stringify({ endpoint: endpointInput }) });
      setFlociEndpoint(endpointInput);
      setStatus({ type: "success", message: "Endpoint updated. The dashboard will now use the new Floci URL." });
    } catch (err) {
      setStatus({ type: "error", message: `Failed to update endpoint: ${(err as Error).message}` });
    } finally {
      setSaving(false);
    }
  }

  return (
    <ContentLayout header={<Header variant="h1">Settings</Header>}>
      <SpaceBetween size="l">
        <Container header={<Header variant="h2">Appearance</Header>}>
          <Toggle checked={darkMode} onChange={toggleDarkMode}>
            Dark mode
          </Toggle>
        </Container>

        <Container header={<Header variant="h2">Data Refresh</Header>}>
          <Select
            selectedOption={{
              value: String(refreshInterval),
              label: refreshLabel,
            }}
            options={[
              { value: "5000", label: "5 seconds" },
              { value: "10000", label: "10 seconds" },
              { value: "30000", label: "30 seconds" },
              { value: "0", label: "Off" },
            ]}
            onChange={({ detail }: { detail: { selectedOption: { value?: string } } }) =>
              setRefreshInterval(Number(detail.selectedOption.value))
            }
          />
        </Container>

        <Container header={<Header variant="h2">Floci Connection</Header>}>
          <SpaceBetween size="m">
            {status && (
              <Alert type={status.type} dismissible onDismiss={() => setStatus(null)}>
                {status.message}
              </Alert>
            )}
            <FormField
              label="Floci endpoint URL"
              description="The URL where your Floci instance is running. Changing this will redirect all AWS SDK calls and HTTP proxy requests."
            >
              <Input
                value={endpointInput}
                onChange={({ detail }) => setEndpointInput(detail.value)}
                placeholder="http://localhost:4566"
              />
            </FormField>
            <Box float="right">
              <Button variant="primary" loading={saving} onClick={handleSaveEndpoint}>
                Save endpoint
              </Button>
            </Box>
          </SpaceBetween>
        </Container>

        <Container header={<Header variant="h2">About</Header>}>
          <Box variant="p">Floci Dashboard v0.1.0</Box>
          <Box variant="p">AWS Console-style management interface for the Floci local AWS emulator.</Box>
        </Container>
      </SpaceBetween>
    </ContentLayout>
  );
}
