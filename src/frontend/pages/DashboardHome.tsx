import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, ColumnLayout, Container, Grid, Header, SpaceBetween, StatusIndicator, Link } from "@cloudscape-design/components";
import { useState } from "react";
import { useHealth, useActiveServices, useDiscoverFloci } from "../hooks/useSystem";
import { useSettings } from "../stores/settings";
import { useResourceCounts } from "../hooks/useResourceCounts";
import { useActivityFeed } from "../hooks/useActivityFeed";
import ServiceGrid from "../components/ServiceGrid";
import ConsoleWidget from "../components/ConsoleWidget";
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

  const discover = useDiscoverFloci();
  const { flociEndpoint } = useSettings();
  const [discoverResult, setDiscoverResult] = useState<string | null>(null);
  const [discoverError, setDiscoverError] = useState<string | null>(null);

  async function handleAutoDetect() {
    setDiscoverResult(null);
    setDiscoverError(null);
    try {
      const data = await discover.mutateAsync();
      if (data.working) {
        setDiscoverResult(data.working);
      } else {
        setDiscoverError(`Tried ${data.candidates.length} addresses — none responded. Check that Floci is running.`);
      }
    } catch (err) {
      setDiscoverError((err as Error)?.message || "Auto-detect failed");
    }
  }

  return (
    <div className="fd-p-responsive fd-container-responsive">
      {isLoading ? (
        <Box padding={{ top: "l" }}>
          <DashboardSkeleton />
        </Box>
      ) : isError ? (
        <SpaceBetween size="m">
          <EmptyState
            title={(error as Error)?.message || "Failed to connect to Floci"}
            icon="⚠️"
            description="Make sure Floci is running and accessible."
          />
          <Container>
            <SpaceBetween size="m" alignItems="center">
              <Box variant="small" color="text-body-secondary">
                Current endpoint: {flociEndpoint || "http://localhost:4566"}
              </Box>
              <SpaceBetween direction="horizontal" size="xs">
                <Button loading={discover.isPending} onClick={handleAutoDetect}>
                  Auto-detect Floci
                </Button>
                <Button onClick={() => navigate("/#/settings")}>
                  Open Settings
                </Button>
              </SpaceBetween>
              {discoverResult && (
                <Alert type="success" dismissible onDismiss={() => setDiscoverResult(null)}>
                  Found Floci at {discoverResult} — the dashboard will use this endpoint.
                </Alert>
              )}
              {discoverError && (
                <Alert type="error" dismissible onDismiss={() => setDiscoverError(null)}>
                  {discoverError}
                </Alert>
              )}
            </SpaceBetween>
          </Container>
        </SpaceBetween>
      ) : health ? (
        <SpaceBetween size="l">
          <Header
            variant="h1"
            actions={
              <StatusIndicator type="success">
                Connected — v{health.version}
              </StatusIndicator>
            }
          >
            Console Home
          </Header>

          <Grid gridDefinition={[{ colspan: { default: 12, s: 6, l: 4 } }, { colspan: { default: 12, s: 6, l: 4 } }, { colspan: { default: 12, s: 12, l: 4 } }]}>
            <ConsoleWidget title="Welcome to Floci">
              <SpaceBetween size="l">
                <div>
                  <Link external href="https://github.com/ofsazib/floci-dash#readme" fontSize="heading-s">Getting started with Floci Dash</Link>
                  <Box color="text-body-secondary">Learn how the dashboard talks to your local Floci emulator.</Box>
                </div>
                <div>
                  <Link href="#" fontSize="heading-s" onFollow={(e) => { e.preventDefault(); navigate("/settings"); }}>Settings</Link>
                  <Box color="text-body-secondary">Change the Floci endpoint, refresh interval and theme.</Box>
                </div>
              </SpaceBetween>
            </ConsoleWidget>

            <ConsoleWidget title="Floci Health" footer={{ text: "Go to Settings", onFollow: () => navigate("/settings") }}>
              <SpaceBetween size="l">
                <div>
                  <Box variant="awsui-key-label">Available Services</Box>
                  <div className="fd-widget-stat-row">
                    <span className="fd-widget-stat-value">{health.stats.total}</span>
                    <span>Total services Floci offers</span>
                  </div>
                </div>
                <div>
                  <Box variant="awsui-key-label">Running</Box>
                  <div className="fd-widget-stat-row">
                    <span className="fd-widget-stat-value">{health.stats.running}</span>
                    <span>{health.stats.available === 0 ? "All running" : `${health.stats.available} inactive`}</span>
                  </div>
                </div>
                <div>
                  <Box variant="awsui-key-label">Active</Box>
                  <div className="fd-widget-stat-row">
                    <span className="fd-widget-stat-value">{active?.activeCount ?? "—"}</span>
                    <span>{active?.activeServices?.length ? active.activeServices.join(", ") : "Services with resources"}</span>
                  </div>
                </div>
              </SpaceBetween>
            </ConsoleWidget>

            <ConsoleWidget
              title="Resources"
              counter={`(${resourceCounts ? Object.values(resourceCounts).reduce((a, b) => a + b, 0) : "—"})`}
              description="Total resources across all services"
            >
              {resourceCounts && Object.values(resourceCounts).some((c) => c > 0) ? (
                <ColumnLayout columns={2} variant="text-grid">
                  {Object.entries(resourceCounts)
                    .filter(([, count]) => count > 0)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([service, count]) => (
                      <div key={service}>
                        <Box variant="awsui-key-label">{service.toUpperCase()}</Box>
                        <span className="fd-widget-stat-value">{count}</span>
                      </div>
                    ))}
                </ColumnLayout>
              ) : (
                <Box color="text-body-secondary">No resources yet.</Box>
              )}
            </ConsoleWidget>
          </Grid>

          <Grid gridDefinition={[{ colspan: { default: 12, l: entries.length > 0 ? 8 : 12 } }, { colspan: { default: 12, l: 4 } }]}>
            <ConsoleWidget title="Quick actions" description="Open a service you use often.">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <Button variant="primary" onClick={() => trackNav("/services/s3", "s3")}>Open S3</Button>
                <Button variant="normal" onClick={() => trackNav("/services/dynamodb", "dynamodb")}>Open DynamoDB</Button>
                <Button variant="normal" onClick={() => trackNav("/services/ec2", "ec2")}>Open EC2</Button>
                <Button variant="normal" onClick={() => trackNav("/services/lambda", "lambda")}>Open Lambda</Button>
                <Button variant="normal" onClick={() => trackNav("/services/rds", "rds")}>Open RDS</Button>
                <Button variant="normal" onClick={() => trackNav("/services/sqs", "sqs")}>Open SQS</Button>
                <Button variant="normal" onClick={() => trackNav("/services/sns", "sns")}>Open SNS</Button>
                <Button variant="normal" onClick={() => trackNav("/services/kms", "kms")}>Open KMS</Button>
                <Button variant="normal" onClick={() => trackNav("/services/iam", "iam")}>Open IAM</Button>
              </div>
            </ConsoleWidget>

            {entries.length > 0 && (
              <ConsoleWidget title="Recent Activity" actions={<Button variant="inline-link" onClick={() => clearActivity()}>Clear</Button>}>
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
              </ConsoleWidget>
            )}
          </Grid>

          <ConsoleWidget
            title="Services"
            counter={`(${health.stats.total})`}
            description={`${health.stats.running} of ${health.stats.total} services enabled`}
          >
            <ServiceGrid services={health.services} />
          </ConsoleWidget>
        </SpaceBetween>
      ) : null}
    </div>
  );
}
