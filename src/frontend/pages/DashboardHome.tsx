import { ContentLayout, Header, SpaceBetween, Box, ColumnLayout } from "@cloudscape-design/components";
import { useHealth } from "../hooks/useSystem";
import ServiceGrid from "../components/ServiceGrid";

export default function DashboardHome() {
  const { data: health, isLoading, isError } = useHealth();

  return (
    <ContentLayout header={<Header variant="h1">Dashboard</Header>}>
      <SpaceBetween size="xl">
        {health && (
          <ColumnLayout columns={3} variant="text-grid">
            <Box>
              <Box variant="awsui-key-label">Total Services</Box>
              <Box variant="h1">{health.stats.total}</Box>
            </Box>
            <Box>
              <Box variant="awsui-key-label">Running</Box>
              <Box variant="h1" color="text-status-success">{health.stats.running}</Box>
            </Box>
            <Box>
              <Box variant="awsui-key-label">Floci Version</Box>
              <Box variant="h1">{health.version}</Box>
            </Box>
          </ColumnLayout>
        )}

        {isLoading && <Box textAlign="center">Loading services...</Box>}
        {isError && <Box textAlign="center" color="text-status-error">Failed to connect to Floci. Make sure Floci is running on port 4566.</Box>}

        {health && <ServiceGrid services={health.services} />}
      </SpaceBetween>
    </ContentLayout>
  );
}
