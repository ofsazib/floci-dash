import { Table, Box, Button, SpaceBetween } from "@cloudscape-design/components";

interface Column {
  id: string;
  header: string;
  cell: (item: any) => React.ReactNode;
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
}: Props) {
  return (
    <Table
      header={
        <SpaceBetween direction="horizontal" size="xs">
          {onCreate && <Button variant="primary" onClick={onCreate}>Create {resourceName}</Button>}
          {onRefresh && <Button onClick={onRefresh}>Refresh</Button>}
        </SpaceBetween>
      }
      columnDefinitions={columns.map((c) => ({
        id: c.id,
        header: c.header,
        cell: c.cell,
      }))}
      items={items}
      loading={loading}
      loadingText="Loading resources..."
      empty={
        <Box textAlign="center" color="inherit">
          <b>{emptyMessage || `No ${resourceName.toLowerCase()}s found`}</b>
        </Box>
      }
    />
  );
}
