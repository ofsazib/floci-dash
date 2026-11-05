import { SERVICE_CATEGORY_MAP, getServiceLabel } from "../types/services";

// Category colours of the AWS architecture icon set, so service tiles read like the console's.
export const CATEGORY_COLORS: Record<string, string> = {
  Compute: "#ed7100",
  Containers: "#ed7100",
  Storage: "#7aa116",
  Database: "#c925d1",
  "Networking & Content Delivery": "#8c4fff",
  "Application Integration": "#e7157b",
  "Security, Identity & Compliance": "#dd344c",
  "Management & Governance": "#e7157b",
  Analytics: "#8c4fff",
  "Machine Learning": "#01a88d",
  "Cost Management": "#7aa116",
  "Developer Tools": "#c925d1",
  "Business Applications": "#dd344c",
  "Migration & Transfer": "#01a88d",
  "Internet of Things": "#7aa116",
};
const DEFAULT_COLOR = "#545b64";

/** Small square tile with the service initial, coloured by its category. */
export default function ServiceIcon({ serviceKey, size = 16 }: { serviceKey: string; size?: number }) {
  const color = CATEGORY_COLORS[SERVICE_CATEGORY_MAP[serviceKey]] || DEFAULT_COLOR;
  return (
    <span
      aria-hidden="true"
      className="fd-service-icon"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.62), backgroundColor: color }}
    >
      {getServiceLabel(serviceKey).charAt(0).toUpperCase()}
    </span>
  );
}
