import { Box } from "@cloudscape-design/components";

const VARIANTS: Record<string, { className: string; icon: string }> = {
  info: { className: "fd-accent-info", icon: "●" },
  success: { className: "fd-accent-success", icon: "●" },
  warning: { className: "fd-accent-warning", icon: "●" },
  default: { className: "fd-accent-purple", icon: "◆" },
};

interface Props {
  label: string;
  value: string | number;
  variant?: "info" | "success" | "warning" | "default";
  subtext?: string;
  isText?: boolean;
  size?: "sm" | "md";
}

export default function StatCard({
  label,
  value,
  variant = "info",
  subtext,
  isText,
  size = "md",
}: Props) {
  const v = VARIANTS[variant] || VARIANTS.default;
  const padding = size === "sm" ? "16px 20px" : "20px 24px";

  return (
    <div className="fd-accent-card" style={{ padding, display: "flex", flexDirection: "column", gap: 6 }}>
      <Box variant="small" color="text-body-secondary">
        <span className={v.className} style={{ marginRight: 6 }}>{v.icon}</span>
        {label}
      </Box>
      <Box variant={isText ? "h4" : "h1"} color="inherit" padding={{ top: "xxs" }}>
        <span className={v.className} style={{ fontWeight: 700, fontSize: isText ? 14 : undefined }}>
          {value}
        </span>
      </Box>
      {subtext && (
        <Box variant="small" color="text-body-secondary" padding={{ top: "xxs" }}>
          {subtext}
        </Box>
      )}
    </div>
  );
}
