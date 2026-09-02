import { useState } from "react";
import {
  Box,
  SpaceBetween,
  StatusIndicator,
  Button,
  Modal,
  Form,
  FormField,
  Input,
  Alert,
  Container,
  Spinner,
  Badge,
} from "@cloudscape-design/components";
import {
  useDynamoDBKinesisStreaming,
  useDynamoDBEnableKinesisStreaming,
  useDynamoDBDisableKinesisStreaming,
  type KinesisStreamingDestination,
} from "../hooks/useDynamoDB";
import ResourceTable from "./ResourceTable";
import DeleteButton from "./DeleteButton";
import EmptyState from "./EmptyState";

function statusBadge(status: string) {
  const map: Record<string, { color: "blue" | "green" | "grey" | "red"; label: string }> = {
    ACTIVE: { color: "green", label: "Active" },
    ENABLING: { color: "blue", label: "Enabling" },
    DISABLING: { color: "grey", label: "Disabling" },
    DISABLED: { color: "red", label: "Disabled" },
    ENABLE_FAILED: { color: "red", label: "Enable Failed" },
  };
  const m = map[status] || { color: "blue" as const, label: status };
  return <Badge color={m.color}>{m.label}</Badge>;
}

export default function DynamoDBKinesisStreaming({ tableName }: { tableName: string }) {
  const {
    data: streamingData,
    isLoading,
    isError,
    error,
  } = useDynamoDBKinesisStreaming(tableName);

  const enableStreaming = useDynamoDBEnableKinesisStreaming(tableName);
  const disableStreaming = useDynamoDBDisableKinesisStreaming(tableName);

  const [showEnable, setShowEnable] = useState(false);
  const [streamArn, setStreamArn] = useState("");

  const destinations = streamingData?.destinations || [];

  if (isError) {
    return (
      <StatusIndicator type="warning">
        {(error as Error)?.message || "Failed to load Kinesis streaming destinations"}
      </StatusIndicator>
    );
  }

  if (isLoading) {
    return (
      <Box textAlign="center" padding={{ top: "xxxl" }}>
        <Spinner size="large" />
        <Box variant="p" padding={{ top: "m" }} color="text-body-secondary">
          Loading Kinesis streaming destinations...
        </Box>
      </Box>
    );
  }

  return (
    <SpaceBetween size="l">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <Box variant="h3">
          Kinesis Data Streams destinations{" "}
          <Box variant="small" color="text-body-secondary" display="inline">
            ({destinations.length})
          </Box>
        </Box>
        <Button
          variant="primary"
          iconName="add-plus"
          onClick={() => {
            setStreamArn("");
            setShowEnable(true);
          }}
        >
          Enable streaming
        </Button>
      </div>

      {destinations.length === 0 ? (
        <EmptyState
          title="No Kinesis streaming destinations"
          description={`Send DynamoDB table item-level changes to a Kinesis Data Stream. Click "Enable streaming" to get started.`}
        />
      ) : (
        <ResourceTable
          resourceName="Destination"
          headerTitle="Streaming Destinations"
          headerCounter={streamingData?.total}
          items={destinations.map((d: KinesisStreamingDestination) => ({
            ...d,
            shortArn: d.streamArn ? d.streamArn.split("/").pop() : d.streamArn,
          }))}
          columns={[
            {
              id: "streamArn",
              header: "Stream ARN",
              cell: (d: any) => (
                <span style={{ wordBreak: "break-all", maxWidth: 360, fontSize: 14 }}>
                  {d.streamArn || "—"}
                </span>
              ),
              isRowHeader: true,
            },
            {
              id: "status",
              header: "Status",
              cell: (d: any) => statusBadge(d.destinationStatus),
            },
            {
              id: "description",
              header: "Description",
              cell: (d: any) => d.destinationStatusDescription || "—",
            },
            {
              id: "actions",
              header: "",
              cell: (d: any) => (
                <DeleteButton
                  itemName={d.streamArn ? d.streamArn.split("/").pop() : "streaming destination"}
                  resourceType="Kinesis streaming destination"
                  loading={disableStreaming.isPending}
                  onDelete={() => disableStreaming.mutateAsync(d.streamArn)}
                />
              ),
            },
          ]}
          loading={isLoading}
          emptyMessage="No streaming destinations found"
        />
      )}

      {/* Enable streaming info */}
      <Container>
        <Box variant="h4" padding={{ bottom: "s" }}>
          About Kinesis Data Streams for DynamoDB
        </Box>
        <SpaceBetween size="xs">
          <Box variant="small" color="text-body-secondary">
            Kinesis Data Streams captures item-level changes in near real-time. Unlike DynamoDB
            Streams (which retain records for 24 hours), Kinesis Data Streams can retain data for up
            to 365 days and allow multiple consumers to process the same records.
          </Box>
          <Box variant="small" color="text-body-secondary">
            Use cases include real-time analytics, cross-region replication, and materialized view
            updates.
          </Box>
        </SpaceBetween>
      </Container>

      {/* Enable modal */}
      <Modal
        visible={showEnable}
        onDismiss={() => setShowEnable(false)}
        header={`Enable Kinesis streaming on ${tableName}`}
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowEnable(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={enableStreaming.isPending}
                disabled={!streamArn}
                onClick={() => {
                  enableStreaming.mutateAsync(streamArn, {
                    onSuccess: () => setShowEnable(false),
                  });
                }}
              >
                Enable
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {enableStreaming.isError && (
            <Alert type="error" dismissible>
              {(enableStreaming.error as Error)?.message || "Failed to enable Kinesis streaming"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField
              label="Kinesis Data Stream ARN"
              description="The ARN of the Kinesis Data Stream to receive item-level changes from this table."
            >
              <Input
                value={streamArn}
                onChange={({ detail }) => setStreamArn(detail.value)}
                placeholder="arn:aws:kinesis:us-east-1:000000000000:stream/my-stream"
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}
