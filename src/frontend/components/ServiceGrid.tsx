import { Container, Header, SpaceBetween } from "@cloudscape-design/components";
import { SERVICE_CATEGORIES } from "../types/services";
import ServiceCard from "./ServiceCard";

interface Props {
  services: Record<string, "running" | "available">;
}

export default function ServiceGrid({ services }: Props) {
  return (
    <SpaceBetween size="xl">
      {Object.entries(SERVICE_CATEGORIES).map(([category, serviceKeys]) => {
        const categoryServices = serviceKeys.filter((k) => k in services);
        if (categoryServices.length === 0) return null;

        return (
          <Container key={category} header={<Header variant="h2">{category}</Header>}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
              {categoryServices.map((key) => (
                <ServiceCard key={key} serviceKey={key} status={services[key]} />
              ))}
            </div>
          </Container>
        );
      })}
    </SpaceBetween>
  );
}
