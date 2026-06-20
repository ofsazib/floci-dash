import { Box, SpaceBetween } from "@cloudscape-design/components";
import { SERVICE_LABELS, CATEGORY_ORDER, SERVICE_CATEGORY_MAP } from "../types/services";
import ServiceCard from "./ServiceCard";

interface Props {
  services: Record<string, "running" | "available">;
}

export default function ServiceGrid({ services }: Props) {
  const grouped: Record<string, string[]> = {};
  for (const key of Object.keys(services)) {
    const cat = SERVICE_CATEGORY_MAP[key] || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(key);
  }

  const orderedCategories: string[] = CATEGORY_ORDER.filter((c) => grouped[c]?.length);
  if (grouped["Other"]?.length) orderedCategories.push("Other");

  return (
    <SpaceBetween size="l">
      {orderedCategories.map((category) => {
        const keys = grouped[category].sort((a, b) =>
          (SERVICE_LABELS[a] || a).localeCompare(SERVICE_LABELS[b] || b)
        );
        return (
          <div key={category}>
            <Box variant="h3" padding={{ bottom: "m" }} color="text-body-secondary">
              {category}
            </Box>
            <div className="fd-grid-responsive">
              {keys.map((key) => (
                <ServiceCard key={key} serviceKey={key} status={services[key]} />
              ))}
            </div>
          </div>
        );
      })}
    </SpaceBetween>
  );
}
