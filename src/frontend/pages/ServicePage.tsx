import { useParams, useNavigate } from "react-router-dom";
import { ContentLayout, Header, Box, BreadcrumbGroup, SpaceBetween } from "@cloudscape-design/components";
import { useHealth } from "../hooks/useSystem";
import { getServiceLabel } from "../types/services";
import StatusBadge from "../components/StatusBadge";

export default function ServicePage() {
  const { service } = useParams<{ service: string }>();
  const navigate = useNavigate();
  const { data: health } = useHealth();

  if (!service) return null;

  const label = getServiceLabel(service);
  const status = (health?.services[service] || "available") as "running" | "available";

  return (
    <ContentLayout
      header={
        <SpaceBetween size="xs">
          <BreadcrumbGroup
            items={[
              { text: "All Services", href: "/#/" },
              { text: label, href: `/#/services/${service}` },
            ]}
            onFollow={(e: CustomEvent) => {
              e.preventDefault();
              const href = (e.detail as any)?.href || "";
              navigate(href.replace(/^\/#/, "") || "/");
            }}
          />
          <Header variant="h1">
            {label} <StatusBadge status={status} />
          </Header>
        </SpaceBetween>
      }
    >
      <Box textAlign="center" color="text-status-inactive" padding={{ top: "xxxl" }}>
        <Box variant="h2">Coming soon</Box>
        <Box variant="p">
          Resource management for {label} will be implemented in a future phase.
        </Box>
        <Box variant="p">
          Check the progress tracker in PLAN.md for status.
        </Box>
      </Box>
    </ContentLayout>
  );
}
