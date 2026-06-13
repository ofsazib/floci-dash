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

  const handleClick = () => {
    navigate(`/services/${serviceKey}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navigate(`/services/${serviceKey}`);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`Open ${label}`}
      className={`fd-accent-card ${isRunning ? "fd-accent-success" : "fd-accent-warning"}`}
      style={{
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 12,
        outline: "none",
        userSelect: "none",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: "currentColor",
          boxShadow: "0 0 6px currentColor",
          flexShrink: 0,
        }}
      />
      <Box variant="p" fontWeight="bold">{label}</Box>
    </div>
  );
}
