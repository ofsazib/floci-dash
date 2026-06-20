import { useState } from "react";
import { Table, Box, Button, SpaceBetween, TextFilter, Header } from "@cloudscape-design/components";
import EmptyState from "./EmptyState";

interface Column {
  id: string;
  header: string;
  cell: (item: any) => React.ReactNode;
  isRowHeader?: boolean;
  width?: number;
}

interface Props {
  resourceName: string;
  items: any[];
  columns: Column[];
  loading?: boolean;
  emptyMessage?: string;
  onCreate?: () => void;
  onDelete?: (item: any) => void;
  onRefresh?: () => void;
  /** Enable search/filter bar above the table */
  filterEnabled?: boolean;
  /** Placeholder text for the filter input */
  filterPlaceholder?: string;
  /** Custom filter function. Receives each item and the current search text. Return true to include. */
  filterFunction?: (item: any, searchText: string) => boolean;
  /** Title for the table header. When set, shows a Header with counter instead of a bare button bar. */
  headerTitle?: string;
  /** Total count for the header counter (defaults to items.length) */
  headerCounter?: number;
}

function defaultFilter(item: any, searchText: string): boolean {
  return JSON.stringify(item).toLowerCase().includes(searchText.toLowerCase());
}

export default function ResourceTable({
  resourceName,
  items,
  columns,
  loading,
  emptyMessage,
  onCreate,
  onDelete,
  onRefresh,
  filterEnabled,
  filterPlaceholder,
  filterFunction,
  headerTitle,
  headerCounter,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = filterEnabled
    ? items.filter((item) => {
        if (!searchTerm) return true;
        const fn = filterFunction || defaultFilter;
        return fn(item, searchTerm);
      })
    : items;

  const colDefs = columns.map((c) => ({
    id: c.id,
    header: c.header,
    cell: c.cell,
    isRowHeader: c.isRowHeader,
    width: c.width ?? (onDelete && c.id === "actions" ? 80 : undefined),
  }));

  return (
    <Table
      header={
        headerTitle ? (
          <Header
            variant="h2"
            counter={`(${headerCounter ?? items.length})`}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                {onCreate && <Button variant="primary" onClick={onCreate}>Create {resourceName}</Button>}
                {onRefresh && <Button onClick={onRefresh}>Refresh</Button>}
              </SpaceBetween>
            }
          >
            {headerTitle}
          </Header>
        ) : (
          <SpaceBetween direction="horizontal" size="xs">
            {onCreate && <Button variant="primary" onClick={onCreate}>Create {resourceName}</Button>}
            {onRefresh && <Button onClick={onRefresh}>Refresh</Button>}
          </SpaceBetween>
        )
      }
      filter={
        filterEnabled ? (
          <TextFilter
            filteringPlaceholder={filterPlaceholder || `Find ${resourceName.toLowerCase()}s`}
            filteringText={searchTerm}
            onChange={({ detail }) => setSearchTerm(detail.filteringText)}
            countText={`${filteredItems.length} match${filteredItems.length === 1 ? "" : "es"}`}
          />
        ) : undefined
      }
      columnDefinitions={colDefs}
      items={filteredItems}
      loading={loading}
      loadingText="Loading resources..."
      empty={
        filterEnabled && searchTerm ? (
          <EmptyState
            title="No matches"
            description={`No ${resourceName.toLowerCase()}s match "${searchTerm}". Try a different search term.`}
          />
        ) : (
          <EmptyState
            title={emptyMessage || `No ${resourceName.toLowerCase()}s found`}
            description={onCreate ? `Click "Create ${resourceName}" to get started.` : undefined}
          />
        )
      }
    />
  );
}
