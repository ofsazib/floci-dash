import { Box, Button } from "@cloudscape-design/components";

interface PropertyItem {
  label: string;
  value: React.ReactNode;
  /** When set, renders the value as a clickable link navigable via react-router. The click handler should be provided by the parent via a custom link component. */
  href?: string;
}

interface PropertyTableProps {
  items: PropertyItem[];
  variant?: "horizontal" | "grid";
  labelWidth?: string;
}

function PropertyRow({ item, labelWidth }: { item: PropertyItem; labelWidth: string }) {
  const renderedValue = item.href ? (
    <Button variant="link" href={item.href}>
      {item.value}
    </Button>
  ) : (
    item.value
  );

  return (
    <tr
      style={{
        borderBottom: "1px solid var(--color-border-divider-default, #eaeded)",
      }}
    >
      <td
        style={{
          padding: "8px 12px",
          fontWeight: 600,
          width: labelWidth,
          verticalAlign: "top",
          whiteSpace: "nowrap",
          color: "var(--color-text-body-secondary, #545b64)",
        }}
      >
        {item.label}
      </td>
      <td style={{ padding: "8px 12px", wordBreak: "break-word" }}>{renderedValue}</td>
    </tr>
  );
}

function GridProperty({ item }: { item: PropertyItem }) {
  const renderedValue = item.href ? (
    <Button variant="link" href={item.href}>
      {item.value}
    </Button>
  ) : (
    item.value
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: "8px 12px",
        borderBottom: "1px solid var(--color-border-divider-default, #eaeded)",
      }}
    >
      <Box variant="small" color="text-body-secondary">
        {item.label}
      </Box>
      <Box variant="span" fontWeight="bold">
        {renderedValue}
      </Box>
    </div>
  );
}

/**
 * Reusable property table for detail views.
 *
 * Replaces inline `<table>` elements found across EC2, RDS, CloudWatch Logs,
 * and other detail views. Provides consistent styling, dark mode support,
 * and three layout variants.
 *
 * @example
 * ```tsx
 * <PropertyTable
 *   items={[
 *     { label: "Instance ID", value: "i-12345" },
 *     { label: "State", value: <StatusIndicator type="success">running</StatusIndicator> },
 *     { label: "VPC ID", value: "vpc-abc" },
 *   ]}
 * />
 * ```
 */
export default function PropertyTable({
  items,
  variant = "horizontal",
  labelWidth = "220px",
}: PropertyTableProps) {
  if (items.length === 0) return null;

  if (variant === "grid") {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: 0,
        }}
      >
        {items.map((item) => (
          <GridProperty key={item.label} item={item} />
        ))}
      </div>
    );
  }

  return (
    <Box variant="div">
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <tbody>
          {items.map((item) => (
            <PropertyRow key={item.label} item={item} labelWidth={labelWidth} />
          ))}
        </tbody>
      </table>
    </Box>
  );
}
