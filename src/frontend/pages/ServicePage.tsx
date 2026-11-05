import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ContentLayout, Header } from "@cloudscape-design/components";
import { useHealth } from "../hooks/useSystem";
import { getServiceLabel } from "../types/services";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import { useBreadcrumbs } from "../components/ServiceNavigationContext";
import { SERVICE_DASHBOARDS, SELF_HEADED_DASHBOARDS } from "./serviceRegistry";

export default function ServicePage() {
  const { service } = useParams<{ service: string }>();
  const { data: health } = useHealth();

  const label = service ? getServiceLabel(service) : "";
  // Self-headed dashboards set their own, deeper breadcrumbs.
  const breadcrumbs = useMemo(
    () => (service && !SELF_HEADED_DASHBOARDS.has(service) ? [
      { text: "Dashboard", href: "/#/" },
      { text: label, href: `/#/services/${service}` },
    ] : null),
    [service, label],
  );
  useBreadcrumbs(breadcrumbs);

  if (!service) return null;

  const status = (health?.services[service] || "available") as
    | "running"
    | "available";
  const Dashboard = SERVICE_DASHBOARDS[service];

  // Dashboards that lay out their own page header (as the AWS console does) render alone.
  if (Dashboard && SELF_HEADED_DASHBOARDS.has(service)) return <Dashboard />;

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description={
            Dashboard ? "Manage resources" : "Service management coming soon"
          }
        >
          {label} <StatusBadge status={status} />
        </Header>
      }
    >
      {Dashboard ? (
        <Dashboard />
      ) : (
        <EmptyState
          title="Coming soon"
          icon="🚧"
          description="This service page is under development. Check back soon — explore fully implemented services like S3, DynamoDB, or EC2 in the meantime."
        />
      )}
    </ContentLayout>
  );
}
