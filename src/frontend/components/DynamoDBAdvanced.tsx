import { useState, useEffect } from "react";
import {
  Box,
  SpaceBetween,
  Button,
  Form,
  FormField,
  Input,
  Textarea,
  Toggle,
  StatusIndicator,
  Container,
  Header,
  Alert,
  Spinner,
  Table,
  ColumnLayout,
  Tabs,
  Select,
  type ToggleProps,
} from "@cloudscape-design/components";
import {
  useDynamoDBTTL,
  useDynamoDBUpdateTTL,
  useDynamoDBTableTags,
  useDynamoDBUpdateTags,
  useDynamoDBDeleteTag,
  useDynamoDBContinuousBackups,
  useDynamoDBUpdateContinuousBackups,
  useDynamoDBPartiQL,
  type DynamoDBTag,
} from "../hooks/useDynamoDBAdvanced";
import { formatItemValue } from "../lib/utils";

interface Props {
  tableName: string;
  tableDetail?: {
    name: string;
    status: string;
    keySchema: Array<{ AttributeName: string; KeyType: string }>;
    [key: string]: any;
  };
}

export default function DynamoDBAdvanced({ tableName, tableDetail }: Props) {
  const [activeTab, setActiveTab] = useState("gsis");

  const tabs = [
    { label: "Indexes", id: "gsis" },
    { label: "TTL", id: "ttl" },
    { label: "Tags", id: "tags" },
    { label: "Backups", id: "backups" },
    { label: "PartiQL", id: "partiql" },
  ];

  return (
    <SpaceBetween size="l">
      <Tabs
        activeTabId={activeTab}
        onChange={({ detail }) => setActiveTab(detail.activeTabId)}
        tabs={tabs}
      />

      {activeTab === "gsis" && <TableIndexes tableName={tableName} tableDetail={tableDetail} />}
      {activeTab === "ttl" && <TableTTL tableName={tableName} />}
      {activeTab === "tags" && <TableTags tableName={tableName} />}
      {activeTab === "backups" && <TableBackups tableName={tableName} />}
      {activeTab === "partiql" && <PartiQLEditor />}
    </SpaceBetween>
  );
}

function TableIndexes({ tableName, tableDetail }: { tableName: string; tableDetail?: any }) {
  // GSIs and LSIs come from the DescribeTable response
  // The backend already returns them, but we need to extend the describe endpoint
  // For now, we'll display what we have
  const gsis = tableDetail?.globalSecondaryIndexes || [];
  const lsis = tableDetail?.localSecondaryIndexes || [];

  return (
    <SpaceBetween size="m">
      {/* GSIs */}
      <Container header={<Header variant="h3" counter={`(${gsis.length})`}>Global Secondary Indexes (GSIs)</Header>}>
        {gsis.length > 0 ? (
          <Table
            columnDefinitions={[
              { id: "name", header: "Index Name", cell: (item: any) => item.IndexName || item.name || "—" },
              { id: "status", header: "Status", cell: (item: any) => (
                <StatusIndicator type={item.IndexStatus === "ACTIVE" ? "success" : "info"}>
                  {item.IndexStatus || item.status || "Unknown"}
                </StatusIndicator>
              )},
              { id: "hash", header: "Partition Key", cell: (item: any) => {
                const key = item.KeySchema?.find((k: any) => k.KeyType === "HASH");
                return key?.AttributeName || "—";
              }},
              { id: "range", header: "Sort Key", cell: (item: any) => {
                const key = item.KeySchema?.find((k: any) => k.KeyType === "RANGE");
                return key?.AttributeName || "—";
              }},
              { id: "items", header: "Items", cell: (item: any) => item.ItemCount?.toLocaleString() ?? "—" },
              { id: "size", header: "Size", cell: (item: any) => {
                if (item.IndexSizeBytes != null) {
                  const bytes = item.IndexSizeBytes;
                  if (bytes === 0) return "0 B";
                  const k = 1024;
                  const sizes = ["B", "KB", "MB", "GB"];
                  const i = Math.floor(Math.log(bytes) / Math.log(k));
                  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
                }
                return "—";
              }},
            ]}
            items={gsis}
          />
        ) : (
          <Box color="text-body-secondary" padding={{ top: "s", bottom: "s" }}>
            No global secondary indexes configured. Create GSIs to enable efficient queries on non-key attributes.
          </Box>
        )}
      </Container>

      {/* LSIs */}
      <Container header={<Header variant="h3" counter={`(${lsis.length})`}>Local Secondary Indexes (LSIs)</Header>}>
        {lsis.length > 0 ? (
          <Table
            columnDefinitions={[
              { id: "name", header: "Index Name", cell: (item: any) => item.IndexName || item.name || "—" },
              { id: "hash", header: "Partition Key", cell: (item: any) => {
                const key = item.KeySchema?.find((k: any) => k.KeyType === "HASH");
                return key?.AttributeName || "—";
              }},
              { id: "range", header: "Sort Key", cell: (item: any) => {
                const key = item.KeySchema?.find((k: any) => k.KeyType === "RANGE");
                return key?.AttributeName || "—";
              }},
            ]}
            items={lsis}
          />
        ) : (
          <Box color="text-body-secondary" padding={{ top: "s", bottom: "s" }}>
            No local secondary indexes configured. LSIs must be created at table creation time.
          </Box>
        )}
      </Container>
    </SpaceBetween>
  );
}

function TableTTL({ tableName }: { tableName: string }) {
  const { data, isLoading } = useDynamoDBTTL(tableName);
  const updateTTL = useDynamoDBUpdateTTL(tableName);
  const [enabled, setEnabled] = useState(false);
  const [attributeName, setAttributeName] = useState("");

  useEffect(() => {
    if (data) {
      setEnabled(data.enabled);
      setAttributeName(data.attributeName || "");
    }
  }, [data]);

  if (isLoading) return <Spinner />;

  return (
    <Container header={<Header variant="h3">Time to Live (TTL)</Header>}>
      <SpaceBetween size="m">
        <Box variant="p" color="text-body-secondary">
          TTL allows you to define a per-item timestamp to determine when an item is no longer needed and can be automatically deleted.
        </Box>
        <Form>
          <FormField label="TTL status">
            <StatusIndicator type={data?.enabled ? "success" : "info"}>
              {data?.status || "Unknown"}
            </StatusIndicator>
          </FormField>
          <FormField label="Enable TTL" description="Toggle TTL for this table.">
            <Toggle
              checked={enabled}
              onChange={({ detail }: { detail: ToggleProps.ChangeDetail }) => setEnabled(detail.checked)}
            >
              {enabled ? "TTL enabled" : "TTL disabled"}
            </Toggle>
          </FormField>
          <FormField label="TTL attribute" description="The name of the attribute that contains the epoch timestamp (in seconds). Items with a TTL in the past will be deleted.">
            <Input
              value={attributeName}
              onChange={({ detail }) => setAttributeName(detail.value)}
              placeholder="e.g., expires_at"
              disabled={!enabled}
            />
          </FormField>
          <Button
            variant="primary"
            loading={updateTTL.isPending}
            disabled={!enabled || !attributeName.trim()}
            onClick={() => updateTTL.mutate({ enabled, attributeName })}
          >
            Save TTL configuration
          </Button>
          {updateTTL.isError && (
            <Alert type="error" dismissible>
              {(updateTTL.error as Error)?.message || "Failed to update TTL"}
            </Alert>
          )}
        </Form>
      </SpaceBetween>
    </Container>
  );
}

function TableTags({ tableName }: { tableName: string }) {
  const { data, isLoading } = useDynamoDBTableTags(tableName);
  const updateTags = useDynamoDBUpdateTags(tableName);
  const deleteTag = useDynamoDBDeleteTag(tableName);
  const [tagPairs, setTagPairs] = useState<Array<{ key: string; value: string }>>([]);

  useEffect(() => {
    if (data?.tags) {
      setTagPairs(data.tags.map((t) => ({ key: t.Key, value: t.Value })));
    }
  }, [data?.tags]);

  if (isLoading) return <Spinner />;

  return (
    <Container header={<Header variant="h3">Table Tags</Header>}>
      <SpaceBetween size="m">
        <Box variant="p" color="text-body-secondary">
          Tags are key-value pairs you can assign to your DynamoDB table for organization and cost allocation.
        </Box>
        <SpaceBetween size="s">
          {tagPairs.map((tag, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <FormField label={i === 0 ? "Key" : ""}>
                  <Input
                    value={tag.key}
                    onChange={({ detail }) =>
                      setTagPairs((prev) => prev.map((t, idx) => (idx === i ? { ...t, key: detail.value } : t)))
                    }
                    placeholder="Tag key"
                  />
                </FormField>
              </div>
              <div style={{ flex: 1 }}>
                <FormField label={i === 0 ? "Value" : ""}>
                  <Input
                    value={tag.value}
                    onChange={({ detail }) =>
                      setTagPairs((prev) => prev.map((t, idx) => (idx === i ? { ...t, value: detail.value } : t)))
                    }
                    placeholder="Tag value"
                  />
                </FormField>
              </div>
              <Button
                variant="icon"
                iconName="remove"
                ariaLabel="Remove tag"
                onClick={() => setTagPairs((prev) => prev.filter((_, idx) => idx !== i))}
              />
            </div>
          ))}
          <Button
            variant="normal"
            iconName="add-plus"
            onClick={() => setTagPairs((prev) => [...prev, { key: "", value: "" }])}
          >
            Add tag
          </Button>
        </SpaceBetween>
        <Button
          variant="primary"
          loading={updateTags.isPending}
          onClick={() => {
            const validTags = tagPairs.filter((t) => t.key && t.value).map((t) => ({ Key: t.key, Value: t.value }));
            updateTags.mutate(validTags);
          }}
        >
          Save tags
        </Button>
        {updateTags.isError && (
          <Alert type="error" dismissible>
            {(updateTags.error as Error)?.message || "Failed to update tags"}
          </Alert>
        )}
      </SpaceBetween>
    </Container>
  );
}

function TableBackups({ tableName }: { tableName: string }) {
  const { data, isLoading } = useDynamoDBContinuousBackups(tableName);
  const updateBackups = useDynamoDBUpdateContinuousBackups(tableName);

  if (isLoading) return <Spinner />;

  return (
    <Container header={<Header variant="h3">Continuous Backups</Header>}>
      <SpaceBetween size="m">
        <Box variant="p" color="text-body-secondary">
          Point-in-time recovery (PITR) provides continuous backups of your DynamoDB table data. You can restore to any point in time during the last 35 days.
        </Box>
        <Form>
          <FormField label="Point-in-time recovery status">
            <StatusIndicator type={data?.pointInTimeRecovery?.enabled ? "success" : "info"}>
              {data?.pointInTimeRecovery?.status || "Unknown"}
            </StatusIndicator>
          </FormField>
          <FormField label="Enable point-in-time recovery" description="When enabled, DynamoDB maintains continuous backups of your table data.">
            <Toggle
              checked={data?.pointInTimeRecovery?.enabled ?? false}
              onChange={({ detail }: { detail: ToggleProps.ChangeDetail }) =>
                updateBackups.mutate(detail.checked)
              }
            >
              {data?.pointInTimeRecovery?.enabled ? "PITR enabled" : "PITR disabled"}
            </Toggle>
          </FormField>
          {updateBackups.isError && (
            <Alert type="error" dismissible>
              {(updateBackups.error as Error)?.message || "Failed to update continuous backups"}
            </Alert>
          )}
        </Form>
      </SpaceBetween>
    </Container>
  );
}

function PartiQLEditor() {
  const [statement, setStatement] = useState("SELECT * FROM table_name LIMIT 10");
  const [consistentRead, setConsistentRead] = useState(false);
  const executeStatement = useDynamoDBPartiQL();
  const [result, setResult] = useState<any>(null);

  function handleExecute() {
    if (!statement.trim()) return;
    executeStatement.mutate(
      { statement, consistentRead },
      {
        onSuccess: (data) => setResult(data),
        onError: () => setResult(null),
      }
    );
  }

  return (
    <Container header={<Header variant="h3">PartiQL Query Editor</Header>}>
      <SpaceBetween size="m">
        <Box variant="p" color="text-body-secondary">
          Run PartiQL (SQL-compatible) queries against your DynamoDB table. PartiQL supports SELECT, INSERT, UPDATE, and DELETE statements.
        </Box>
        <Form>
          <FormField label="SQL Statement" description="Enter a PartiQL statement. Use '?' as parameter placeholders.">
            <Textarea
              value={statement}
              onChange={({ detail }) => setStatement(detail.value)}
              rows={4}
              placeholder="SELECT * FROM my-table WHERE pk = ?"
            />
          </FormField>
          <FormField label="Consistent read" description="Use strongly consistent reads (slower but up-to-date).">
            <Toggle
              checked={consistentRead}
              onChange={({ detail }: { detail: ToggleProps.ChangeDetail }) => setConsistentRead(detail.checked)}
            >
              Consistent read
            </Toggle>
          </FormField>
          <Button
            variant="primary"
            loading={executeStatement.isPending}
            disabled={!statement.trim()}
            onClick={handleExecute}
          >
            Run query
          </Button>
          {executeStatement.isError && (
            <Alert type="error" dismissible>
              {(executeStatement.error as Error)?.message || "Query failed"}
            </Alert>
          )}
        </Form>

        {result && (
          <Container header={<Header variant="h3" counter={`(${result.count})`}>Results</Header>}>
            {result.items && result.items.length > 0 ? (
              <Table
                columnDefinitions={Object.keys(result.items[0]).map((key) => ({
                  id: key,
                  header: key,
                  cell: (item: any) => (
                    <span style={{ wordBreak: "break-all", fontSize: 13 }}>
                      {formatItemValue(item[key])}
                    </span>
                  ),
                }))}
                items={result.items}
                variant="full-page"
              />
            ) : (
              <Box color="text-body-secondary">No results found.</Box>
            )}
            {result.nextToken && (
              <Box padding={{ top: "s" }} color="text-body-secondary">
                More results available (pagination not yet supported).
              </Box>
            )}
          </Container>
        )}
      </SpaceBetween>
    </Container>
  );
}
