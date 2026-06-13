import { useNavigate } from "react-router-dom";
import { Box, Button, ColumnLayout, Container, Header, SpaceBetween, Spinner, StatusIndicator } from "@cloudscape-design/components";
import { useHealth, useActiveServices } from "../hooks/useSystem";
import ServiceGrid from "../components/ServiceGrid";
import StatCard from "../components/StatCard";

export default function DashboardHome() {
  const navigate = useNavigate();
  const { data: health, isLoading, isError, error } = useHealth();
  const { data: active } = useActiveServices();

  return (
    <div style={{ padding: "0 24px", maxWidth: 1280, margin: "0 auto" }}>
      {isLoading ? (
        <Box textAlign="center" padding={{ top: "xxxl", bottom: "xxxl" }}>
          <Spinner size="large" />
          <Box variant="p" padding={{ top: "m" }} color="text-body-secondary">
            Connecting to Floci...
          </Box>
        </Box>
      ) : isError ? (
        <Box textAlign="center" padding={{ top: "xxxl", bottom: "xxxl" }}>
          <StatusIndicator type="error">
            {(error as Error)?.message || "Failed to connect to Floci"}
          </StatusIndicator>
          <Box variant="p" padding={{ top: "s" }} color="text-body-secondary">
            Make sure Floci is running and accessible.
          </Box>
        </Box>
      ) : health ? (
        <SpaceBetween size="xl">
          <Header
            variant="h1"
            description="Local AWS emulator — manage services, buckets, tables, and more"
            actions={
              <StatusIndicator type="success">
                Connected — v{health.version}
              </StatusIndicator>
            }
          >
            Floci Dashboard
          </Header>

          <ColumnLayout columns={4} variant="text-grid">
            <StatCard
              label="Available Services"
              value={health.stats.total}
              variant="info"
              subtext="Total services Floci offers"
            />
            <StatCard
              label="Active"
              value={active?.activeCount ?? "—"}
              variant="success"
              subtext={active?.activeServices?.length ? active.activeServices.join(", ") : "Services with resources"}
            />
            <StatCard
              label="Running"
              value={health.stats.running}
              variant="warning"
              subtext={`${health.stats.available} inactive`}
            />
            <StatCard
              label="Edition"
              value={health.edition}
              variant="default"
              subtext={`v${health.version}`}
              isText
            />
          </ColumnLayout>

          <Container header={<Header variant="h3">Quick actions</Header>}>
            <SpaceBetween direction="horizontal" size="s">
              <Button variant="primary" onClick={() => navigate("/services/s3")}>Open S3</Button>
              <Button variant="normal" onClick={() => navigate("/services/dynamodb")}>Open DynamoDB</Button>
              <Button variant="normal" onClick={() => navigate("/services/ec2")}>Open EC2</Button>
              <Button variant="normal" onClick={() => navigate("/services/iam")}>Open IAM</Button>
            </SpaceBetween>
          </Container>

          <Container
            header={
              <Header
                variant="h2"
                description={`${health.stats.running} of ${health.stats.total} services enabled`}
              >
                Services
              </Header>
            }
          >
            <ServiceGrid services={health.services} />
          </Container>
        </SpaceBetween>
      ) : null}
    </div>
  );
}
