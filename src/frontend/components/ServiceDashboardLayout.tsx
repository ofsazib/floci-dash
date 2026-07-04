import { useState } from "react";
import { Tabs, SpaceBetween, Box, StatusIndicator } from "@cloudscape-design/components";
import type { TabsProps } from "@cloudscape-design/components";
import EmptyState from "./EmptyState";

interface ServiceDashboardLayoutProps {
  /** Array of tabs to display. Each tab's content is rendered lazily. */
  tabs: TabsProps.Tab[];
  /** Initial active tab ID (defaults to first tab). */
  defaultActiveTab?: string;
  /** Loading state — shows a centered spinner when true. */
  loading?: boolean;
  /** Error message — shows an error banner when set. */
  error?: string | null;
  /** Empty state — shown when there's no data and tabs should not render. */
  empty?: {
    title: string;
    description?: string;
    actionText?: string;
    onAction?: () => void;
  } | null;
  /** Back navigation (shown above tabs for detail views). */
  backButton?: React.ReactNode;
}

/**
 * Unified layout wrapper for service dashboards.
 *
 * Provides consistent tab navigation, loading/error/empty state handling,
 * and back-button support for drill-down views.
 *
 * @example
 * ```tsx
 * <ServiceDashboardLayout
 *   tabs={[
 *     { id: "instances", label: "Instances", content: <DBInstanceList /> },
 *     { id: "clusters", label: "Clusters", content: <DBClusterList /> },
 *   ]}
 *   loading={isLoading}
 *   error={error?.message}
 * />
 * ```
 */
export default function ServiceDashboardLayout({
  tabs,
  defaultActiveTab,
  loading,
  error,
  empty,
  backButton,
}: ServiceDashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState(defaultActiveTab || tabs[0]?.id || "");

  if (loading) {
    return (
      <Box textAlign="center" padding={{ vertical: "xxl" }}>
        <StatusIndicator type="loading">Loading...</StatusIndicator>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" padding={{ vertical: "xl" }}>
        <StatusIndicator type="error">{error}</StatusIndicator>
      </Box>
    );
  }

  if (empty) {
    return (
      <EmptyState
        title={empty.title}
        description={empty.description}
        actionText={empty.actionText}
        onAction={empty.onAction}
      />
    );
  }

  if (tabs.length === 0) return null;

  return (
    <SpaceBetween size="l">
      {backButton && <div>{backButton}</div>}
      <Tabs
        activeTabId={activeTab}
        onChange={({ detail }) => setActiveTab(detail.activeTabId)}
        tabs={tabs}
      />
    </SpaceBetween>
  );
}
