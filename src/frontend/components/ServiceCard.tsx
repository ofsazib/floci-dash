import { useNavigate } from "react-router-dom";
import { Box } from "@cloudscape-design/components";
import { getServiceLabel } from "../types/services";

interface Props {
  serviceKey: string;
  status: "running" | "available";
}

export default function ServiceCard({ serviceKey, status }: Props) {
  const navigate = useNavigate();
  const label = getServiceLabel(serviceKey);
  const isRunning = status === "running";
  const accent = isRunning ? "#037f0c" : "#d89914";

  return (
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
      style={{
        cursor: "pointer",
        padding: "16px 18px",
        borderRadius: 10,
        background: "transparent",
        border: `1px solid ${accent}33`,
        display: "flex",
        alignItems: "center",
        gap: 12,
        transition: "all 0.15s ease",
        outline: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${accent}88`;
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = `0 3px 10px ${accent}18`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${accent}33`;
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = accent;
        e.currentTarget.style.boxShadow = `0 0 0 2px ${accent}44`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = `${accent}33`;
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: accent,
          boxShadow: `0 0 6px ${accent}88`,
          flexShrink: 0,
        }}
      />
      <Box variant="p" fontWeight="bold">{label}</Box>
    </div>
  );
}
