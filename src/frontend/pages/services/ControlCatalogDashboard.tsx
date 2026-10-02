import { useState } from "react";
// V8 remaps phantom branches onto the multi-line import; no executable code here.
/* v8 ignore start */
import {
  Button,
  Container,
  Header,
  SpaceBetween,
  Box,
  ColumnLayout,
  Alert,
} from "@cloudscape-design/components";
/* v8 ignore stop */
import ServiceDashboardLayout from "../../components/ServiceDashboardLayout";
import ResourceTable from "../../components/ResourceTable";
import {
  useCcControls,
  useCcControl,
  type CcControlSummary,
} from "../../hooks/useControlCatalog";

export default function ControlCatalogDashboard() {
  const { data, isLoading, isError, error, refetch } = useCcControls();
  const [selected, setSelected] = useState<string | null>(null);
  const detail = useCcControl(selected);

  const controls = data?.controls || [];

  if (selected) {
    const c = detail.data?.control;
    return (
      <SpaceBetween size="l">
        <Button variant="link" iconName="arrow-left" onClick={() => setSelected(null)}>
          Back to controls
        </Button>
        <Container header={<Header variant="h2">{c?.Name ?? selected}</Header>}>
          {detail.isLoading ? (
            <Box>Loading…</Box>
          ) : c ? (
            <ColumnLayout columns={2} variant="text-grid">
              <SpaceBetween size="xs">
                <Box variant="awsui-key-label">ARN</Box>
                <Box>{c.Arn ?? selected}</Box>
              </SpaceBetween>
              <SpaceBetween size="xs">
                <Box variant="awsui-key-label">Behavior</Box>
                <Box>{c.Behavior ?? "—"}</Box>
              </SpaceBetween>
              <SpaceBetween size="xs">
                <Box variant="awsui-key-label">Severity</Box>
                <Box>{c.Severity ?? "—"}</Box>
              </SpaceBetween>
              <SpaceBetween size="xs">
                <Box variant="awsui-key-label">Description</Box>
                <Box>{c.Description ?? "—"}</Box>
              </SpaceBetween>
              <SpaceBetween size="xs">
                <Box variant="awsui-key-label">Parameters</Box>
                <Box>{c.ParameterRequirementSummary ?? "—"}</Box>
              </SpaceBetween>
            </ColumnLayout>
          ) : (
            <Box>Control not found.</Box>
          )}
        </Container>
      </SpaceBetween>
    );
  }

  return (
    <SpaceBetween size="l">
      <ResourceTable
        resourceName="control"
        headerTitle="Controls"
        items={controls}
        loading={isLoading}
        onRefresh={refetch}
        columns={[
          { id: "name", header: "Name", cell: (c: CcControlSummary) => c.Name },
          { id: "behavior", header: "Behavior", cell: (c: CcControlSummary) => c.Behavior },
          { id: "severity", header: "Severity", cell: (c: CcControlSummary) => c.Severity },
          {
            id: "actions",
            header: "",
            cell: (c: CcControlSummary) => (
              <Button onClick={() => setSelected(c.Arn!)}>View</Button>
            ),
          },
        ]}
      />
      {isError && (
        <Alert type="error">{(error as Error)?.message || "Failed to load controls"}</Alert>
      )}
    </SpaceBetween>
  );
}
