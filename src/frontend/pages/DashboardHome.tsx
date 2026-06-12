import { Box, ColumnLayout, Container, Header, SpaceBetween, Spinner, StatusIndicator } from "@cloudscape-design/components";
import { useHealth } from "../hooks/useSystem";
import ServiceGrid from "../components/ServiceGrid";

export default function DashboardHome() {
  const { data: health, isLoading, isError, error } = useHealth();

  return (
    <div style={{ padding: "0 24px", maxWidth: 1200, margin: "0 auto" }}>
      <Header
        variant="h1"
        description="Local AWS emulator — manage services, buckets, tables, and more"
      >
        Floci Dashboard
      </Header>

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
        <SpaceBetween size="l">
          <ColumnLayout columns={4} variant="text-grid">
            <StatCard
              label="Available Services"
              value={health.stats.total}
              accent="#539fe5"
            />
            <StatCard
              label="Running"
              value={health.stats.running}
              accent="#037f0c"
            />
            <StatCard
              label="Inactive"
              value={health.stats.available}
              accent="#d89914"
            />
            <StatCard
              label="Floci Version"
              value={health.version}
              accent="#a066ff"
              isText
            />
          </ColumnLayout>

          <Container
            header={
              <Header
                variant="h2"
                description={`${health.stats.running} of ${health.stats.total} services active`}
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

function StatCard({
  label,
  value,
  accent,
  isText,
}: {
  label: string;
  value: string | number;
  accent: string;
  isText?: boolean;
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        padding: "24px 28px",
        border: `1px solid ${accent}33`,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.borderColor = `${accent}33`;
      }}
    >
      <Box variant="small" color="text-body-secondary">
        {label}
      </Box>
      <Box
        variant={isText ? "h4" : "h1"}
        color="inherit"
        padding={{ top: "xxs" }}
      >
        <span style={{ color: accent, fontWeight: 700 }}>{value}</span>
      </Box>
    </div>
  );
}
