import { Box, SpaceBetween } from "@cloudscape-design/components";
import { SERVICE_CATEGORIES } from "../types/services";
import ServiceCard from "./ServiceCard";

interface Props {
  services: Record<string, "running" | "available">;
}

export default function ServiceGrid({ services }: Props) {
  return (
    <SpaceBetween size="l">
      {Object.entries(SERVICE_CATEGORIES).map(([category, serviceKeys]) => {
        const categoryServices = serviceKeys.filter((k) => k in services);
        if (categoryServices.length === 0) return null;

        return (
          <div key={category}>
            <Box
              variant="h3"
              padding={{ bottom: "s" }}
              color="text-body-secondary"
            >
              {category}
            </Box>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "10px",
              }}
            >
              {categoryServices.map((key) => (
                <ServiceCard key={key} serviceKey={key} status={services[key]} />
              ))}
            </div>
          </div>
        );
      })}
    </SpaceBetween>
  );
}
