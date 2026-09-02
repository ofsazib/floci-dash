import { useNavigate } from "react-router-dom";
import { Box } from "@cloudscape-design/components";
import { getServiceLabel } from "../types/services";
import { useFavorites } from "../stores/favorites";

interface Props {
  serviceKey: string;
  status: "running" | "available";
}

const STAR_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8 1l2.2 4.5L15 6.3l-3.5 3.4.8 4.9L8 12.4 3.7 14.6l.8-4.9L1 6.3l4.8-.8z"/></svg>';

export default function ServiceCard({ serviceKey, status }: Props) {
  const navigate = useNavigate();
  const label = getServiceLabel(serviceKey);
  const isRunning = status === "running";
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(serviceKey);

  const handleClick = () => {
    navigate(`/services/${serviceKey}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navigate(`/services/${serviceKey}`);
    }
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(serviceKey);
  };

  const handleStarKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(serviceKey);
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
      <div style={{ flex: 1 }}>
        <Box variant="p" fontWeight="bold">{label}</Box>
      </div>
      <button
        onClick={handleStarClick}
        onKeyDown={handleStarKeyDown}
        aria-label={fav ? `Remove ${label} from favorites` : `Add ${label} to favorites`}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 4,
          color: fav ? "var(--color-text-status-warning)" : "var(--color-text-body-secondary)",
          opacity: fav ? 1 : 0.4,
          transition: "opacity 0.15s",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = fav ? "1" : "0.4"; }}
      >
        <span dangerouslySetInnerHTML={{ __html: STAR_SVG }} style={{ width: 14, height: 14, display: "block" }} />
      </button>
    </div>
  );
}
