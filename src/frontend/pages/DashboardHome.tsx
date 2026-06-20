import { useNavigate } from "react-router-dom";
import { Box, Button, ColumnLayout, Container, Header, SpaceBetween, StatusIndicator, Link } from "@cloudscape-design/components";
import { useHealth, useActiveServices } from "../hooks/useSystem";
import { useResourceCounts } from "../hooks/useResourceCounts";
import { useActivityFeed } from "../hooks/useActivityFeed";
import ServiceGrid from "../components/ServiceGrid";
import StatCard from "../components/StatCard";
import { DashboardSkeleton } from "../components/LoadingSkeleton";
import EmptyState from "../components/EmptyState";

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

function serviceIcon(service: string) {
  const icons: Record<string, string> = {
    s3: "☰", dynamodb: "▤", ec2: "◈", lambda: "λ", rds: "🗄", sqs: "☰", sns: "☰", kms: "🔑", cloudwatch: "📊",
  };
  return icons[service] || "•";
}

export default function DashboardHome() {
  const navigate = useNavigate();
  const { data: health, isLoading, isError, error } = useHealth();
  const { data: active } = useActiveServices();
  const { data: resourceCounts } = useResourceCounts();
  const { entries, addActivity, clearActivity } = useActivityFeed();

  const trackNav = (path: string, service: string) => {
    addActivity({ action: "navigate", service, description: `Opened ${service.toUpperCase()}` });
    navigate(path);
  };

  return (
    <div className="fd-p-responsive fd-container-responsive">
      {isLoading ? (
        <Box padding={{ top: "l" }}>
          <DashboardSkeleton />
        </Box>
      ) : isError ? (
        <EmptyState
          title={(error as Error)?.message || "Failed to connect to Floci"}
          icon="⚠️"
          description="Make sure Floci is running and accessible."
        />
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

          {resourceCounts && Object.keys(resourceCounts).length > 0 && (
            <Container header={<Header variant="h3">Resource Counts</Header>}>
              <ColumnLayout columns={Math.min(Object.keys(resourceCounts).length, 5)}>
                {Object.entries(resourceCounts)
                  .filter(([, count]) => count > 0)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([service, count]) => (
                    <StatCard
                      key={service}
                      label={service.toUpperCase()}
                      value={count}
                      variant="info"
                      size="sm"
                    />
                  ))}
              </ColumnLayout>
            </Container>
          )}

          <Container header={<Header variant="h3">Quick actions</Header>}>
            <SpaceBetween direction="horizontal" size="s">
              <Button variant="primary" onClick={() => trackNav("/services/s3", "s3")}>Open S3</Button>
              <Button variant="normal" onClick={() => trackNav("/services/dynamodb", "dynamodb")}>Open DynamoDB</Button>
              <Button variant="normal" onClick={() => trackNav("/services/ec2", "ec2")}>Open EC2</Button>
              <Button variant="normal" onClick={() => trackNav("/services/lambda", "lambda")}>Open Lambda</Button>
              <Button variant="normal" onClick={() => trackNav("/services/rds", "rds")}>Open RDS</Button>
              <Button variant="normal" onClick={() => trackNav("/services/sqs", "sqs")}>Open SQS</Button>
              <Button variant="normal" onClick={() => trackNav("/services/sns", "sns")}>Open SNS</Button>
              <Button variant="normal" onClick={() => trackNav("/services/kms", "kms")}>Open KMS</Button>
              <Button variant="normal" onClick={() => trackNav("/services/iam", "iam")}>Open IAM</Button>
            </SpaceBetween>
          </Container>

          {entries.length > 0 && (
            <Container
              header={
                <Header
                  variant="h3"
                  actions={
                    <Button variant="inline-link" onClick={() => clearActivity()}>Clear</Button>
                  }
                >
                  Recent Activity
                </Header>
              }
            >
              <SpaceBetween size="xs">
                {entries.slice(0, 10).map((entry) => (
                  <div key={entry.id} style={{ padding: "4px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "var(--color-text-body-secondary, #5f6b7a)", fontSize: 12 }}>
                          {serviceIcon(entry.service)}
                        </span>
                        <span style={{ fontSize: 12 }}>
                          {entry.description}
                        </span>
                        {entry.resource && (
                          <span style={{ fontSize: 12, color: "var(--color-text-body-secondary, #5f6b7a)" }}>
                            — {entry.resource}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 12, color: "var(--color-text-body-secondary, #5f6b7a)" }}>
                        {formatTime(entry.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </SpaceBetween>
            </Container>
          )}

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
