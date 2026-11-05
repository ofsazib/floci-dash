import { useState } from "react";
import { Alert, Box, Button, Header, SpaceBetween, Table, TextFilter } from "@cloudscape-design/components";
import EmptyState from "../../../components/EmptyState";
import { useECSClusters } from "../../../hooks/useECS";

/** "Default" or "Container Insights", from the cluster's containerInsights setting. */
export function clusterMonitoring(cluster: { settings?: { name?: string; value?: string }[] }): string {
  const insights = cluster.settings?.find((s) => s.name === "containerInsights")?.value;
  return insights === "enabled" || insights === "enhanced" ? "Container Insights" : "Default";
}

/** The cluster list, with the console's columns. */
export default function ClustersView({ onOpen, onCreate }: { onOpen: (cluster: any) => void; onCreate: () => void }) {
  const { data, isLoading, isError, error, refetch, dataUpdatedAt } = useECSClusters();
  const [filter, setFilter] = useState("");

  if (isError) {
    return (
      <Alert type="error" header="Failed to load ECS clusters">
        {(error as Error)?.message || "Unknown error"}
      </Alert>
    );
  }

  const clusters = data?.clusters || [];
  const term = filter.trim().toLowerCase();
  const items = term ? clusters.filter((c) => (c.clusterName || "").toLowerCase().includes(term)) : clusters;

  return (
    <Table
      variant="full-page"
      items={items}
      loading={isLoading}
      loadingText="Loading clusters"
      header={
        <Header
          variant="h1"
          counter={`(${clusters.length})`}
          description="An Amazon ECS cluster groups together tasks, and services, and allows for shared capacity and common configurations."
          actions={
            <SpaceBetween direction="horizontal" size="xs" alignItems="center">
              {dataUpdatedAt ? (
                <Box fontSize="body-s" color="text-body-secondary" textAlign="right">
                  Last updated
                  <br />
                  {new Date(dataUpdatedAt).toLocaleString()}
                </Box>
              ) : null}
              <Button iconName="refresh" ariaLabel="Refresh clusters" onClick={() => refetch()} />
              <Button variant="primary" onClick={onCreate}>Create cluster</Button>
            </SpaceBetween>
          }
        >
          Clusters
        </Header>
      }
      filter={
        <TextFilter
          filteringText={filter}
          filteringPlaceholder="Search clusters"
          onChange={({ detail }) => setFilter(detail.filteringText)}
          countText={`${items.length} match${items.length === 1 ? "" : "es"}`}
        />
      }
      empty={
        term ? (
          <EmptyState title="No matches" description="No clusters match the filter." />
        ) : (
          <EmptyState title="No clusters" description="No clusters to display." actionText="Create cluster" onAction={onCreate} />
        )
      }
      columnDefinitions={[
        {
          id: "name",
          header: "Cluster",
          isRowHeader: true,
          cell: (c) => (c.clusterName ? <Button variant="inline-link" onClick={() => onOpen(c)}>{c.clusterName}</Button> : "—"),
        },
        { id: "services", header: "Services", cell: (c) => c.activeServicesCount ?? 0 },
        {
          id: "tasks",
          header: "Tasks",
          cell: (c) =>
            c.pendingTasksCount || c.runningTasksCount
              ? `${c.pendingTasksCount ?? 0} Pending | ${c.runningTasksCount ?? 0} Running`
              : "No tasks running",
        },
        { id: "instances", header: "Container instances", cell: (c) => `${c.registeredContainerInstancesCount ?? 0} EC2` },
        { id: "monitoring", header: "CloudWatch monitoring", cell: (c) => clusterMonitoring(c) },
        {
          id: "strategy",
          header: "Capacity provider strategy",
          cell: (c) =>
            c.defaultCapacityProviderStrategy?.length
              ? c.defaultCapacityProviderStrategy.map((s: any) => s.capacityProvider).join(", ")
              : "No default found",
        },
      ]}
    />
  );
}
