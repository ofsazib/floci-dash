import { useNavigate } from "react-router-dom";
import { Box, Container } from "@cloudscape-design/components";
import { getServiceLabel } from "../types/services";

interface Props {
  serviceKey: string;
  status: "running" | "available";
}

export default function ServiceCard({ serviceKey, status }: Props) {
  const navigate = useNavigate();
  const label = getServiceLabel(serviceKey);
  const color = status === "running" ? "#037f0c" : "#8b8b00";

  return (
    <Container>
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/services/${serviceKey}`)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate(`/services/${serviceKey}`);
          }
        }}
        style={{ cursor: "pointer", padding: "8px 0", outline: "none" }}
      >
        <Box variant="h3" padding={{ bottom: "xxs" }}>{label}</Box>
        <Box variant="small" color="text-status-info">
          <span style={{ color }}>●</span> {status === "running" ? "Running" : "Available"}
        </Box>
      </div>
    </Container>
  );
}
