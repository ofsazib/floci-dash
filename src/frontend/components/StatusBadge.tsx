import { StatusIndicator } from "@cloudscape-design/components";

interface Props {
  status: "running" | "available" | "error" | "connected";
}

export default function StatusBadge({ status }: Props) {
  const type = status === "running" ? "success" : status === "available" ? "warning" : status === "error" ? "error" : "success";
  const label = status === "running" ? "Running" : status === "available" ? "Available" : status === "error" ? "Error" : "Connected";
  return <StatusIndicator type={type}>{label}</StatusIndicator>;
}
