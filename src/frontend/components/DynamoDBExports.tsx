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
  Select,
  Alert,
  Container,
  Spinner,
  Badge,
  ColumnLayout,
  type SelectProps,
} from "@cloudscape-design/components";
import {
  useDynamoDBExports,
  useDynamoDBExportTable,
  useDynamoDBDescribeExport,
  type DynamoDBExport,
  type DynamoDBExportDetail,
} from "../hooks/useDynamoDBAdvanced";
import ResourceTable from "./ResourceTable";
import EmptyState from "./EmptyState";

function statusBadge(status: string) {
  const map: Record<string, { color: "blue" | "green" | "grey" | "red"; label: string }> = {
    IN_PROGRESS: { color: "blue", label: "In Progress" },
    COMPLETED: { color: "green", label: "Completed" },
    FAILED: { color: "red", label: "Failed" },
    CANCELLED: { color: "grey", label: "Cancelled" },
  };
  const m = map[status] || { color: "blue" as const, label: status };
  return <Badge color={m.color}>{m.label}</Badge>;
}

const FORMAT_OPTIONS = [
  { label: "DynamoDB JSON", value: "DYNAMODB_JSON" },
  { label: "Ion", value: "ION" },
];

export default function DynamoDBExports({ tableName }: { tableName: string }) {
  const {
    data: exportsData,
    isLoading,
    isError,
    error,
  } = useDynamoDBExports(tableName);

  const exportTable = useDynamoDBExportTable(tableName);

  const [showCreate, setShowCreate] = useState(false);
  const [s3Bucket, setS3Bucket] = useState("");
  const [s3Prefix, setS3Prefix] = useState("");
  const [exportFormat, setExportFormat] = useState<SelectProps.Option>(FORMAT_OPTIONS[0]);

  // Export detail modal
  const [selectedExportArn, setSelectedExportArn] = useState<string | null>(null);
  const { data: exportDetail, isLoading: detailLoading } =
    useDynamoDBDescribeExport(selectedExportArn);

  const exportsList = exportsData?.exports || [];

  if (isError) {
    return (
      <StatusIndicator type="warning">
        {(error as Error)?.message || "Failed to load exports"}
      </StatusIndicator>
    );
  }

  if (isLoading) {
    return (
      <Box textAlign="center" padding={{ top: "xxxl" }}>
        <Spinner size="large" />
        <Box variant="p" padding={{ top: "m" }} color="text-body-secondary">
          Loading exports...
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
          Exports to Amazon S3{" "}
          <Box variant="small" color="text-body-secondary" display="inline">
            ({exportsList.length})
          </Box>
        </Box>
        <Button
          variant="primary"
          iconName="add-plus"
          onClick={() => {
            setS3Bucket("");
            setS3Prefix("");
            setExportFormat(FORMAT_OPTIONS[0]);
            setShowCreate(true);
          }}
        >
          Export to S3
        </Button>
      </div>

      {exportsList.length === 0 ? (
        <EmptyState
          title="No exports"
          description={`Export table data to Amazon S3 at a point in time. Requires Point-in-Time Recovery (PITR) to be enabled. Click "Export to S3" to get started.`}
        />
      ) : (
        <ResourceTable
          resourceName="Export"
          headerTitle="Exports"
          headerCounter={exportsData?.total}
          items={exportsList.map((e: DynamoDBExport) => ({
            ...e,
            shortArn: e.exportArn ? e.exportArn.split("/").pop() : e.exportArn,
          }))}
          columns={[
            {
              id: "exportArn",
              header: "Export ARN",
              cell: (e: any) => (
                <span style={{ wordBreak: "break-all", maxWidth: 400, fontSize: 13 }}>
                  {e.exportArn || "—"}
                </span>
              ),
              isRowHeader: true,
            },
            {
              id: "status",
              header: "Status",
              cell: (e: any) => statusBadge(e.exportStatus),
            },
            {
              id: "items",
              header: "Items",
              cell: (e: any) =>
                e.itemCount != null ? e.itemCount.toLocaleString() : "—",
            },
            {
              id: "startTime",
              header: "Started",
              cell: (e: any) =>
                e.startTime ? new Date(e.startTime).toLocaleString() : "—",
            },
            {
              id: "endTime",
              header: "Ended",
              cell: (e: any) =>
                e.endTime ? new Date(e.endTime).toLocaleString() : "—",
            },
            {
              id: "actions",
              header: "",
              cell: (e: any) => (
                <Button
                  variant="link"
                  onClick={() => setSelectedExportArn(e.exportArn)}
                >
                  Details
                </Button>
              ),
            },
          ]}
          loading={isLoading}
          emptyMessage="No exports found"
        />
      )}

      {/* Info container */}
      <Container>
        <Box variant="h4" padding={{ bottom: "s" }}>
          About DynamoDB Exports to S3
        </Box>
        <SpaceBetween size="xs">
          <Box variant="small" color="text-body-secondary">
            DynamoDB exports enable you to export table data to Amazon S3 at any
            point in time within the Point-in-Time Recovery (PITR) window. Export
            files are written in DynamoDB JSON or Ion format.
          </Box>
          <Box variant="small" color="text-body-secondary">
            PITR must be enabled on the table before you can create exports. Each
            export is a fully consistent snapshot of the table at the specified
            point in time.
          </Box>
          <Box variant="small" color="text-body-secondary">
            Exports do not consume read capacity units and have no impact on table
            performance.
          </Box>
        </SpaceBetween>
      </Container>

      {/* Create Export modal */}
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header={`Export ${tableName} to Amazon S3`}
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={exportTable.isPending}
                disabled={!s3Bucket}
                onClick={() => {
                  exportTable.mutateAsync(
                    {
                      s3Bucket,
                      s3Prefix: s3Prefix || undefined,
                      exportFormat: exportFormat.value ?? "DYNAMODB_JSON",
                    },
                    { onSuccess: () => setShowCreate(false) }
                  );
                }}
              >
                Export
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {exportTable.isError && (
            <Alert type="error" dismissible>
              {(exportTable.error as Error)?.message || "Failed to create export"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField
              label="S3 Bucket"
              description="The destination S3 bucket for the export."
            >
              <Input
                value={s3Bucket}
                onChange={({ detail }) => setS3Bucket(detail.value)}
                placeholder="my-export-bucket"
              />
            </FormField>
            <FormField
              label="S3 Prefix (optional)"
              description="A folder path within the S3 bucket for the export files."
            >
              <Input
                value={s3Prefix}
                onChange={({ detail }) => setS3Prefix(detail.value)}
                placeholder="exports/my-table/"
              />
            </FormField>
            <FormField label="Export format">
              <Select
                selectedOption={exportFormat}
                onChange={({ detail }) => setExportFormat(detail.selectedOption)}
                options={FORMAT_OPTIONS}
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>

      {/* Export Detail modal */}
      <Modal
        visible={!!selectedExportArn}
        onDismiss={() => setSelectedExportArn(null)}
        header="Export Details"
        size="large"
        footer={
          <Box float="right">
            <Button
              variant="primary"
              onClick={() => setSelectedExportArn(null)}
            >
              Close
            </Button>
          </Box>
        }
      >
        {detailLoading ? (
          <Box textAlign="center" padding={{ top: "xl", bottom: "xl" }}>
            <Spinner size="large" />
          </Box>
        ) : exportDetail ? (
          <Container>
            <ColumnLayout columns={2} variant="text-grid">
              <div>
                <Box variant="small" color="text-body-secondary">
                  Status
                </Box>
                <Box padding={{ top: "xxs" }}>
                  {statusBadge(exportDetail.exportStatus)}
                </Box>
              </div>
              <div>
                <Box variant="small" color="text-body-secondary">
                  Export Type
                </Box>
                <Box padding={{ top: "xxs" }} variant="strong">
                  {exportDetail.exportType || "—"}
                </Box>
              </div>
              <div>
                <Box variant="small" color="text-body-secondary">
                  Items Exported
                </Box>
                <Box padding={{ top: "xxs" }} variant="strong">
                  {exportDetail.itemCount != null
                    ? exportDetail.itemCount.toLocaleString()
                    : "—"}
                </Box>
              </div>
              <div>
                <Box variant="small" color="text-body-secondary">
                  S3 Bucket
                </Box>
                <Box padding={{ top: "xxs" }} variant="strong">
                  {exportDetail.s3Bucket || "—"}
                </Box>
              </div>
              <div>
                <Box variant="small" color="text-body-secondary">
                  S3 Prefix
                </Box>
                <Box padding={{ top: "xxs" }} variant="strong">
                  {exportDetail.s3Prefix || "/"}
                </Box>
              </div>
              <div>
                <Box variant="small" color="text-body-secondary">
                  Started
                </Box>
                <Box padding={{ top: "xxs" }} variant="strong">
                  {exportDetail.startTime
                    ? new Date(exportDetail.startTime).toLocaleString()
                    : "—"}
                </Box>
              </div>
              <div>
                <Box variant="small" color="text-body-secondary">
                  Ended
                </Box>
                <Box padding={{ top: "xxs" }} variant="strong">
                  {exportDetail.endTime
                    ? new Date(exportDetail.endTime).toLocaleString()
                    : "—"}
                </Box>
              </div>
              <div>
                <Box variant="small" color="text-body-secondary">
                  Table ARN
                </Box>
                <Box padding={{ top: "xxs" }} variant="strong">
                  <span style={{ wordBreak: "break-all", fontSize: 13 }}>
                    {exportDetail.tableArn || "—"}
                  </span>
                </Box>
              </div>
              {exportDetail.exportManifest && (
                <div>
                  <Box variant="small" color="text-body-secondary">
                    Manifest
                  </Box>
                  <Box padding={{ top: "xxs" }} variant="strong">
                    <span style={{ wordBreak: "break-all", fontSize: 13 }}>
                      {exportDetail.exportManifest}
                    </span>
                  </Box>
                </div>
              )}
            </ColumnLayout>
            {exportDetail.failureCode && (
              <Box padding={{ top: "m" }}>
                <Alert type="error" header={`Failure: ${exportDetail.failureCode}`}>
                  {exportDetail.failureMessage || "No failure message available"}
                </Alert>
              </Box>
            )}
          </Container>
        ) : (
          <StatusIndicator type="warning">
            Export not found
          </StatusIndicator>
        )}
      </Modal>
    </SpaceBetween>
  );
}
