import { useParams, useNavigate } from "react-router-dom";
import {
  ContentLayout,
  Header,
  BreadcrumbGroup,
  SpaceBetween,
} from "@cloudscape-design/components";
import { useHealth } from "../hooks/useSystem";
import { getServiceLabel } from "../types/services";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import { SERVICE_DASHBOARDS } from "./serviceRegistry";

export default function ServicePage() {
  const { service } = useParams<{ service: string }>();
  const navigate = useNavigate();
  const { data: health } = useHealth();

  if (!service) return null;

  const label = getServiceLabel(service);
  const status = (health?.services[service] || "available") as
    | "running"
    | "available";
  const Dashboard = SERVICE_DASHBOARDS[service];

  return (
    <ContentLayout
      header={
        <SpaceBetween size="xs">
          <BreadcrumbGroup
            items={[
              { text: "Dashboard", href: "/#/" },
              { text: label, href: `/#/services/${service}` },
            ]}
            onFollow={(e) => {
              e.preventDefault();
              navigate(e.detail.href.replace("/#", ""));
            }}
          />
          <Header
            variant="h1"
            description={
              Dashboard ? "Manage resources" : "Service management coming soon"
            }
          >
            {label} <StatusBadge status={status} />
          </Header>
        </SpaceBetween>
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
