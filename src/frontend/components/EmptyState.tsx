import { Box, Button, SpaceBetween, Header } from "@cloudscape-design/components";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: string;
}

export default function EmptyState({ title, description, actionText, onAction, icon }: EmptyStateProps) {
  return (
    <Box textAlign="center" padding={{ top: "xxl", bottom: "xxl" }}>
      <SpaceBetween size="m" direction="vertical" alignItems="center">
        {icon && (
          <Box fontSize="display-l" color="text-status-inactive">
            {icon}
          </Box>
        )}
        <Box variant="h3">{title}</Box>
        {description && (
          <Box variant="p" color="text-body-secondary">
            {description}
          </Box>
        )}
        {actionText && onAction && (
          <Button variant="primary" onClick={onAction}>
            {actionText}
          </Button>
        )}
      </SpaceBetween>
    </Box>
  );
}
