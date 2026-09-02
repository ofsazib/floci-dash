import { useState } from "react";
import { ContentLayout, Header, Container, Toggle, Select, SpaceBetween, Box, Input, Button, FormField, Alert, Modal } from "@cloudscape-design/components";
import { useSettings } from "../stores/settings";
import { api } from "../lib/client";
import { useDiscoverFloci } from "../hooks/useSystem";

export default function Settings() {
  const { darkMode, refreshInterval, toggleDarkMode, setRefreshInterval, flociEndpoint, setFlociEndpoint } = useSettings();
  const [endpointInput, setEndpointInput] = useState(flociEndpoint || "http://localhost:4566");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [maintenanceBusy, setMaintenanceBusy] = useState(false);
  const [maintenanceStatus, setMaintenanceStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<"reset" | "nuke" | null>(null);
  const [diagnostics, setDiagnostics] = useState<Record<string, unknown> | null>(null);
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const discover = useDiscoverFloci();
  const [discoverResult, setDiscoverResult] = useState<string | null>(null);
  const [discoverError, setDiscoverError] = useState<string | null>(null);

  async function handleAutoDetect() {
    setDiscoverResult(null);
    setDiscoverError(null);
    try {
      const data = await discover.mutateAsync();
      if (data.working) {
        setEndpointInput(data.working);
        setDiscoverResult(data.working);
      } else {
        setDiscoverError(`Tried ${data.candidates.length} addresses — none responded.`);
      }
    } catch (err) {
      setDiscoverError((err as Error)?.message || "Auto-detect failed");
    }
  }

  async function handleMaintenance(target: "reset" | "nuke") {
    setMaintenanceBusy(true);
    setMaintenanceStatus(null);
    try {
      await api(`/system/state/${target}`, { method: "POST" });
      setMaintenanceStatus({ type: "success", message: `Floci state ${target === "reset" ? "reset" : "nuked"} successfully.` });
    } catch (err) {
      setMaintenanceStatus({ type: "error", message: `Failed to ${target} Floci state: ${(err as Error)?.message || "unknown error"}` });
    } finally {
      setMaintenanceBusy(false);
    }
  }

  async function handleLoadDiagnostics() {
    setDiagnosticsLoading(true);
    setDiagnosticsError(null);
    setDiagnostics(null);
    try {
      const data = await api("/system/diagnose", { method: "GET" }) as Record<string, unknown>;
      setDiagnostics(data);
      setShowDiagnostics(true);
    } catch (err) {
      setDiagnosticsError((err as Error)?.message || "Failed to load diagnostics");
    } finally {
      setDiagnosticsLoading(false);
    }
  }

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
              <SpaceBetween direction="horizontal" size="xs">
                <Button loading={discover.isPending} onClick={handleAutoDetect}>
                  Auto-detect
                </Button>
                <Button variant="primary" loading={saving} onClick={handleSaveEndpoint}>
                  Save endpoint
                </Button>
              </SpaceBetween>
            </Box>
            {discoverResult && (
              <Alert type="success" dismissible onDismiss={() => setDiscoverResult(null)}>
                Found Floci at {discoverResult}. Click Save to apply.
              </Alert>
            )}
            {discoverError && (
              <Alert type="error" dismissible onDismiss={() => setDiscoverError(null)}>
                {discoverError}
              </Alert>
            )}
          </SpaceBetween>
        </Container>

        <Container header={<Header variant="h2">Floci Maintenance</Header>}>
          <SpaceBetween size="m">
            <Box variant="p">Reset or nuke the emulator state. Reset clears all service data; Nuke performs a full wipe.</Box>
            {maintenanceStatus && (
              <Alert type={maintenanceStatus.type} dismissible onDismiss={() => setMaintenanceStatus(null)}>
                {maintenanceStatus.message}
              </Alert>
            )}
            <SpaceBetween direction="horizontal" size="xs">
              <Button loading={maintenanceBusy} onClick={() => setConfirmTarget("reset")}>
                Reset state
              </Button>
              <Button loading={maintenanceBusy} variant="primary" onClick={() => setConfirmTarget("nuke")}>
                Nuke state
              </Button>
            </SpaceBetween>
            <SpaceBetween direction="horizontal" size="xs">
              <Button loading={diagnosticsLoading} onClick={handleLoadDiagnostics}>
                Load diagnostics
              </Button>
            </SpaceBetween>
            {diagnosticsError && (
              <Alert type="error" dismissible onDismiss={() => setDiagnosticsError(null)}>
                {diagnosticsError}
              </Alert>
            )}
          </SpaceBetween>
          <Modal
            visible={confirmTarget !== null}
            onDismiss={() => setConfirmTarget(null)}
            header={`${confirmTarget === "nuke" ? "Nuke" : "Reset"} Floci state?`}
            footer={
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setConfirmTarget(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    const target = confirmTarget;
                    setConfirmTarget(null);
                    handleMaintenance(target!);
                  }}
                >
                  {confirmTarget === "nuke" ? "Nuke" : "Reset"}
                </Button>
              </SpaceBetween>
            }
          >
            This will permanently delete all data in the emulator for the selected operation.
          </Modal>
          <Modal
            visible={showDiagnostics}
            onDismiss={() => setShowDiagnostics(false)}
            header="Floci Diagnostics"
          >
            <Box fontSize="body-s">
              <pre style={{ fontFamily: "monospace", whiteSpace: "pre-wrap", margin: 0 }}>
                {diagnostics ? JSON.stringify(diagnostics, null, 2) : "No diagnostics data"}
              </pre>
            </Box>
          </Modal>
        </Container>

        <Container header={<Header variant="h2">About</Header>}>
          <Box variant="p">Floci Dash v0.1.0</Box>
          <Box variant="p">AWS Console-style management interface for the Floci local AWS emulator.</Box>
        </Container>
      </SpaceBetween>
    </ContentLayout>
  );
}
