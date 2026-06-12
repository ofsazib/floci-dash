import { Box, ColumnLayout, Container, Header, SpaceBetween, Spinner, StatusIndicator } from "@cloudscape-design/components";
import { useHealth } from "../hooks/useSystem";
import ServiceGrid from "../components/ServiceGrid";

export default function DashboardHome() {
  const { data: health, isLoading, isError, error } = useHealth();

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <SpaceBetween size="xl">
        <Header
          variant="h1"
          description="Local AWS emulator — manage services, buckets, tables, and more"
          info={<StatusIndicator type="success">Connected</StatusIndicator>}
        >
          Floci Dashboard
        </Header>

        {isLoading ? (
          <Box textAlign="center" padding={{ top: "xxxl", bottom: "xxxl" }}>
            <Spinner size="large" />
            <Box variant="p" padding={{ top: "m" }} color="text-body-secondary">Connecting to Floci...</Box>
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
          <>
            <ColumnLayout columns={4} variant="text-grid">
              <StatCard
                label="Total Services"
                value={health.stats.total}
                color="#539fe5"
                bg="linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)"
              />
              <StatCard
                label="Running"
                value={health.stats.running}
                color="#037f0c"
                bg="linear-gradient(135deg, #0a1f0a 0%, #0d2818 100%)"
              />
              <StatCard
                label="Available"
                value={health.stats.available}
                color="#d89914"
                bg="linear-gradient(135deg, #1a1a0a 0%, #281f0d 100%)"
              />
              <StatCard
                label="Edition"
                value={health.edition}
                color="#a066ff"
                bg="linear-gradient(135deg, #140a28 0%, #1a1033 100%)"
                isText
              />
            </ColumnLayout>

            <Container header={<Header variant="h2" description={`${health.stats.running} of ${health.stats.total} services running`}>Services</Header>}>
              <ServiceGrid services={health.services} />
            </Container>
          </>
        ) : null}
      </SpaceBetween>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  bg,
  isText,
}: {
  label: string;
  value: string | number;
  color: string;
  bg: string;
  isText?: boolean;
}) {
  return (
    <div
      style={{
        background: bg,
        borderRadius: 12,
        padding: "20px 24px",
        border: `1px solid ${color}22`,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 4px 12px ${color}22`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <Box variant="small" color="text-body-secondary">{label}</Box>
      <Box
        variant={isText ? "h4" : "h1"}
        color="inherit"
        padding={{ top: "xxs" }}
      >
        <span style={{ color, fontWeight: 700 }}>{value}</span>
      </Box>
    </div>
  );
}
