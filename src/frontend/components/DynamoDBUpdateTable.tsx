import { useState, useEffect, useRef } from "react";
import {
  Box,
  SpaceBetween,
  Button,
  Form,
  FormField,
  Input,
  Toggle,
  Select,
  StatusIndicator,
  Container,
  Header,
  Alert,
  Spinner,
  ColumnLayout,
  type ToggleProps,
  type SelectProps,
} from "@cloudscape-design/components";
import {
  useDynamoDBUpdateTable,
  type UpdateTableParams,
} from "../hooks/useDynamoDBAdvanced";

const BILLING_OPTIONS: SelectProps.Option[] = [
  { label: "Provisioned — you specify read/write capacity", value: "PROVISIONED" },
  { label: "On-demand — pay per request, auto-scaling", value: "PAY_PER_REQUEST" },
];

const TABLE_CLASS_OPTIONS: SelectProps.Option[] = [
  { label: "Standard — default, general purpose", value: "STANDARD" },
  { label: "Standard-IA — infrequent access, lower storage cost", value: "STANDARD_INFREQUENT_ACCESS" },
];

const STREAM_VIEW_OPTIONS: SelectProps.Option[] = [
  { label: "New and old images", value: "NEW_AND_OLD_IMAGES" },
  { label: "New image only", value: "NEW_IMAGE" },
  { label: "Old image only", value: "OLD_IMAGE" },
  { label: "Keys only", value: "KEYS_ONLY" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Props {
  tableName: string;
  tableDetail?: Record<string, any>;
}

export default function DynamoDBUpdateTable({ tableName, tableDetail }: Props) {
  const updateTable = useDynamoDBUpdateTable(tableName);

  // Billing mode
  const [billingMode, setBillingMode] = useState<SelectProps.Option>(
    BILLING_OPTIONS[0]
  );
  const [readCapacity, setReadCapacity] = useState("5");
  const [writeCapacity, setWriteCapacity] = useState("5");

  // Deletion protection
  const [deletionProtection, setDeletionProtection] = useState(false);

  // Table class
  const [tableClass, setTableClass] = useState<SelectProps.Option>(
    TABLE_CLASS_OPTIONS[0]
  );

  // Stream specification
  const [streamEnabled, setStreamEnabled] = useState(false);
  const [streamViewType, setStreamViewType] = useState<SelectProps.Option>(
    STREAM_VIEW_OPTIONS[0]
  );

  // SSE
  const [sseEnabled, setSseEnabled] = useState(false);
  const [kmsKeyId, setKmsKeyId] = useState("");

  // GSI management
  const [gsisToCreate, setGsisToCreate] = useState<
    Array<{
      indexName: string;
      partitionKey: string;
      sortKey: string;
      readCapacity: string;
      writeCapacity: string;
    }>
  >([]);
  const [gsisToDelete, setGsisToDelete] = useState<string[]>([]);

  const prevTableName = useRef(tableName);

  // Initialize from tableDetail — only when tableName changes
  useEffect(() => {
    if (prevTableName.current !== tableName) {
/* istanbul ignore next */
      prevTableName.current = tableName;
      return;
    }
    if (tableDetail) {
      if (tableDetail.billingMode) {
        const mode = BILLING_OPTIONS.find((o) => o.value === tableDetail.billingMode);
        if (mode) setBillingMode(mode);
      }
      if (tableDetail.provisionedThroughput) {
        setReadCapacity(String(tableDetail.provisionedThroughput.ReadCapacityUnits ?? 5));
        setWriteCapacity(String(tableDetail.provisionedThroughput.WriteCapacityUnits ?? 5));
      }
      if (tableDetail.deletionProtectionEnabled !== undefined) {
        setDeletionProtection(tableDetail.deletionProtectionEnabled);
      }
      if (tableDetail.tableClass) {
        const tc = TABLE_CLASS_OPTIONS.find((o) => o.value === tableDetail.tableClass);
        if (tc) setTableClass(tc);
      }
      if (tableDetail.streamSpecification) {
        setStreamEnabled(tableDetail.streamSpecification.StreamEnabled);
        if (tableDetail.streamSpecification.StreamViewType) {
          const sv = STREAM_VIEW_OPTIONS.find(
            (o) => o.value === tableDetail.streamSpecification?.StreamViewType
          );
          if (sv) setStreamViewType(sv);
        }
      }
      if (tableDetail.sseDescription) {
        setSseEnabled(tableDetail.sseDescription.Status === "ENABLED");
      }
    }
  }, [tableDetail, tableName]);

  function buildParams(): UpdateTableParams {
    const params: UpdateTableParams = {};

    // Billing mode + throughput
    const mode = billingMode.value as string;
    if (mode !== tableDetail?.billingMode) {
      params.BillingMode = mode as "PROVISIONED" | "PAY_PER_REQUEST";
    }
    if (mode === "PROVISIONED") {
      const newRead = parseInt(readCapacity, 10) || 5;
      const newWrite = parseInt(writeCapacity, 10) || 5;
      const currentPt = tableDetail?.provisionedThroughput;
      if (
        !currentPt ||
        newRead !== currentPt.ReadCapacityUnits ||
        newWrite !== currentPt.WriteCapacityUnits
      ) {
        params.ProvisionedThroughput = {
          ReadCapacityUnits: newRead,
          WriteCapacityUnits: newWrite,
        };
      }
    }

    // Deletion protection
    if (deletionProtection !== tableDetail?.deletionProtectionEnabled) {
      params.DeletionProtectionEnabled = deletionProtection;
    }

    // Table class
    const tc = tableClass.value as string;
    if (tc !== tableDetail?.tableClass) {
      params.TableClass = tc as "STANDARD" | "STANDARD_INFREQUENT_ACCESS";
    }

    // Stream specification
    const currentStreamEnabled = tableDetail?.streamSpecification?.StreamEnabled;
    if (streamEnabled !== currentStreamEnabled) {
      params.StreamSpecification = {
        StreamEnabled: streamEnabled,
        StreamViewType: streamViewType.value as string,
      };
    } else if (streamEnabled && streamViewType.value !== tableDetail?.streamSpecification?.StreamViewType) {
      params.StreamSpecification = {
        StreamEnabled: true,
        StreamViewType: streamViewType.value as string,
      };
    }

    // SSE
    const currentSseEnabled = tableDetail?.sseDescription?.Status === "ENABLED";
    if (sseEnabled !== currentSseEnabled) {
      const sseSpec: any = { Enabled: sseEnabled };
      if (sseEnabled && kmsKeyId) sseSpec.KMSMasterKeyId = kmsKeyId;
      if (sseEnabled) sseSpec.SSEType = "KMS";
      params.SSESpecification = sseSpec;
    }

    // GSI updates
    const gsiUpdates: UpdateTableParams["GlobalSecondaryIndexUpdates"] = [];
    const attributeDefs: UpdateTableParams["AttributeDefinitions"] = [];

    for (const gsi of gsisToDelete) {
      gsiUpdates.push({ Delete: { IndexName: gsi } });
    }

    for (const gsi of gsisToCreate) {
      gsiUpdates.push({
        Create: {
          IndexName: gsi.indexName,
          KeySchema: [
            { AttributeName: gsi.partitionKey, KeyType: "HASH" },
            ...(gsi.sortKey
              ? [{ AttributeName: gsi.sortKey, KeyType: "RANGE" as const }]
              : []),
          ],
          Projection: { ProjectionType: "ALL" },
          ProvisionedThroughput:
            billingMode.value === "PROVISIONED"
              ? {
                  ReadCapacityUnits: parseInt(gsi.readCapacity, 10) || 5,
                  WriteCapacityUnits: parseInt(gsi.writeCapacity, 10) || 5,
                }
              : undefined,
        },
      });
      attributeDefs.push({
        AttributeName: gsi.partitionKey,
        AttributeType: "S",
      });
      if (gsi.sortKey) {
        attributeDefs.push({
          AttributeName: gsi.sortKey,
          AttributeType: "S",
        });
      }
    }

    if (gsiUpdates.length > 0) {
      params.GlobalSecondaryIndexUpdates = gsiUpdates;
    }
    if (attributeDefs.length > 0) {
      params.AttributeDefinitions = attributeDefs;
    }

    return params;
  }

  function handleApplyChanges() {
    const params = buildParams();
    // The Apply changes button is disabled via `hasChanges` (same computation),
    // so params is never empty here.
    updateTable.mutate(params, {
      onSuccess: () => {
        setGsisToCreate([]);
        setGsisToDelete([]);
      },
    });
  }

  const hasChanges = (() => {
    const p = buildParams();
    return Object.keys(p).length > 0;
  })();

  const existingGsis = tableDetail?.globalSecondaryIndexes || [];

  return (
    <SpaceBetween size="l">
      {/* Success / Error feedback */}
      {updateTable.isSuccess && (
        <Alert type="success" dismissible>
          Table <strong>{tableName}</strong> updated successfully.
        </Alert>
      )}
      {updateTable.isError && (
        <Alert type="error" dismissible>
          {(updateTable.error as Error)?.message || "Failed to update table"}
        </Alert>
      )}

      {/* Billing Mode */}
      <Container header={<Header variant="h3">Billing mode</Header>}>
        <SpaceBetween size="m">
          <Box variant="p" color="text-body-secondary">
            Choose between provisioned capacity (you specify read/write units) or
            on-demand (pay per request with automatic scaling).
          </Box>
          <Form>
            <FormField label="Billing mode">
              <Select
                selectedOption={billingMode}
                onChange={({ detail }) => setBillingMode(detail.selectedOption)}
                options={BILLING_OPTIONS}
              />
            </FormField>
            {billingMode.value === "PROVISIONED" && (
              <ColumnLayout columns={2} variant="text-grid">
                <FormField
                  label="Read capacity units"
                  description="Min 1, max 40,000 per table"
                >
                  <Input
                    type="number"
                    value={readCapacity}
                    onChange={({ detail }) => setReadCapacity(detail.value)}
                    inputMode="numeric"
                  />
                </FormField>
                <FormField
                  label="Write capacity units"
                  description="Min 1, max 40,000 per table"
                >
                  <Input
                    type="number"
                    value={writeCapacity}
                    onChange={({ detail }) => setWriteCapacity(detail.value)}
                    inputMode="numeric"
                  />
                </FormField>
              </ColumnLayout>
            )}
          </Form>
        </SpaceBetween>
      </Container>

      {/* Deletion Protection */}
      <Container header={<Header variant="h3">Deletion protection</Header>}>
        <SpaceBetween size="m">
          <Box variant="p" color="text-body-secondary">
            When enabled, the table cannot be deleted until deletion protection is
            disabled.
          </Box>
          <Form>
            <FormField label="Enable deletion protection">
              <Toggle
                checked={deletionProtection}
                onChange={({ detail }: { detail: ToggleProps.ChangeDetail }) =>
                  setDeletionProtection(detail.checked)
                }
              >
                {deletionProtection ? "Protected" : "Not protected"}
              </Toggle>
            </FormField>
          </Form>
        </SpaceBetween>
      </Container>

      {/* Table Class */}
      <Container header={<Header variant="h3">Table class</Header>}>
        <SpaceBetween size="m">
          <Box variant="p" color="text-body-secondary">
            Standard-IA offers lower storage costs for tables that store infrequently
            accessed data.
          </Box>
          <Form>
            <FormField label="Table class">
              <Select
                selectedOption={tableClass}
                onChange={({ detail }) => setTableClass(detail.selectedOption)}
                options={TABLE_CLASS_OPTIONS}
              />
            </FormField>
          </Form>
        </SpaceBetween>
      </Container>

      {/* DynamoDB Streams */}
      <Container header={<Header variant="h3">DynamoDB Streams</Header>}>
        <SpaceBetween size="m">
          <Box variant="p" color="text-body-secondary">
            A DynamoDB stream captures item-level changes in your table and stores
            them for 24 hours. Enable this to use triggers or replicate data.
          </Box>
          <Form>
            <FormField label="Enable DynamoDB Streams">
              <Toggle
                checked={streamEnabled}
                onChange={({ detail }: { detail: ToggleProps.ChangeDetail }) =>
                  setStreamEnabled(detail.checked)
                }
              >
                {streamEnabled ? "Stream enabled" : "Stream disabled"}
              </Toggle>
            </FormField>
            {streamEnabled && (
              <FormField
                label="Stream view type"
                description="Determines what information is written to the stream for each change."
              >
                <Select
                  selectedOption={streamViewType}
                  onChange={({ detail }) =>
                    setStreamViewType(detail.selectedOption)
                  }
                  options={STREAM_VIEW_OPTIONS}
                />
              </FormField>
            )}
          </Form>
        </SpaceBetween>
      </Container>

      {/* Server-Side Encryption */}
      <Container header={<Header variant="h3">Server-side encryption</Header>}>
        <SpaceBetween size="m">
          <Box variant="p" color="text-body-secondary">
            DynamoDB encrypts all data at rest by default. You can use a
            customer-managed KMS key for additional control.
          </Box>
          <Form>
            <FormField label="Use KMS-managed encryption key">
              <Toggle
                checked={sseEnabled}
                onChange={({ detail }: { detail: ToggleProps.ChangeDetail }) =>
                  setSseEnabled(detail.checked)
                }
              >
                {sseEnabled ? "KMS encryption enabled" : "Default encryption"}
              </Toggle>
            </FormField>
            {sseEnabled && (
              <FormField
                label="KMS key ARN (optional)"
                description="Leave empty to use the AWS-managed DynamoDB KMS key."
              >
                <Input
                  value={kmsKeyId}
                  onChange={({ detail }) => setKmsKeyId(detail.value)}
                  placeholder="arn:aws:kms:us-east-1:123456789012:key/abc-123"
                />
              </FormField>
            )}
          </Form>
        </SpaceBetween>
      </Container>

      {/* Global Secondary Indexes */}
      <Container
        header={
          <Header variant="h3" counter={`(${existingGsis.length})`}>
            Global Secondary Indexes
          </Header>
        }
      >
        <SpaceBetween size="m">
          <Box variant="p" color="text-body-secondary">
            GSIs allow you to query on non-primary key attributes. Add or remove GSIs
            without downtime.
          </Box>

          {/* Existing GSIs */}
          {existingGsis.length > 0 && (
            <SpaceBetween size="s">
              <Box variant="strong">Existing indexes</Box>
              {existingGsis.map((gsi: Record<string, any>) => {
                const markedForDeletion = gsisToDelete.includes(gsi.IndexName);
                return (
                  <div
                    key={gsi.IndexName}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "10px 14px",
                      borderRadius: 6,
                      border: "1px solid var(--color-border-divider-default, #e9ebed)",
                      opacity: markedForDeletion ? 0.5 : 1,
                    }}
                  >
                    <div>
                      <Box variant="strong">{gsi.IndexName}</Box>
                      <Box variant="small" color="text-body-secondary">
                        Key:{" "}
                        {gsi.KeySchema?.map(
                          (k: any) =>
                            `${k.AttributeName} (${k.KeyType})`
                        ).join(", ") || "—"}{" "}
                        · <StatusIndicator
                          type={
                            gsi.IndexStatus === "ACTIVE" ? "success" : "info"
                          }
                        >
                          {gsi.IndexStatus}
                        </StatusIndicator>
                      </Box>
                    </div>
                    <Button
                      variant="normal"
                      onClick={() =>
                        setGsisToDelete((prev) =>
                          markedForDeletion
                            ? prev.filter((n) => n !== gsi.IndexName)
                            : [...prev, gsi.IndexName]
                        )
                      }
                    >
                      {markedForDeletion ? "Keep" : "Delete"}
                    </Button>
                  </div>
                );
              })}
            </SpaceBetween>
          )}

          {/* GSIs to create */}
          {gsisToCreate.length > 0 && (
            <SpaceBetween size="s">
              <Box variant="strong">
                Indexes to create ({gsisToCreate.length})
              </Box>
              {gsisToCreate.map((gsi, i) => (
                <SpaceBetween key={i} size="s">
                  <ColumnLayout columns={3} variant="text-grid">
                    <FormField label="Index name">
                      <Input
                        value={gsi.indexName}
                        onChange={({ detail }) =>
                          setGsisToCreate((prev) =>
                            prev.map((g, idx) =>
                              idx === i ? { ...g, indexName: detail.value } : g
                            )
                          )
                        }
                        placeholder="my-gsi"
                      />
                    </FormField>
                    <FormField label="Partition key">
                      <Input
                        value={gsi.partitionKey}
                        onChange={({ detail }) =>
                          setGsisToCreate((prev) =>
                            prev.map((g, idx) =>
                              idx === i
                                ? { ...g, partitionKey: detail.value }
                                : g
                            )
                          )
                        }
                        placeholder="gsi_pk"
                      />
                    </FormField>
                    <FormField label="Sort key (optional)">
                      <Input
                        value={gsi.sortKey}
                        onChange={({ detail }) =>
                          setGsisToCreate((prev) =>
                            prev.map((g, idx) =>
                              idx === i
                                ? { ...g, sortKey: detail.value }
                                : g
                            )
                          )
                        }
                        placeholder="gsi_sk"
                      />
                    </FormField>
                  </ColumnLayout>
                  {billingMode.value === "PROVISIONED" && (
                    <ColumnLayout columns={2} variant="text-grid">
                      <FormField label="Read capacity">
                        <Input
                          type="number"
                          value={gsi.readCapacity}
                          onChange={({ detail }) =>
                            setGsisToCreate((prev) =>
                              prev.map((g, idx) =>
                                idx === i
                                  ? { ...g, readCapacity: detail.value }
                                  : g
                              )
                            )
                          }
                          inputMode="numeric"
                        />
                      </FormField>
                      <FormField label="Write capacity">
                        <Input
                          type="number"
                          value={gsi.writeCapacity}
                          onChange={({ detail }) =>
                            setGsisToCreate((prev) =>
                              prev.map((g, idx) =>
                                idx === i
                                  ? { ...g, writeCapacity: detail.value }
                                  : g
                              )
                            )
                          }
                          inputMode="numeric"
                        />
                      </FormField>
                    </ColumnLayout>
                  )}
                  <Button
                    variant="link"
                    onClick={() =>
                      setGsisToCreate((prev) =>
                        prev.filter((_, idx) => idx !== i)
                      )
                    }
                  >
                    Remove
                  </Button>
                </SpaceBetween>
              ))}
            </SpaceBetween>
          )}

          <Button
            variant="normal"
            iconName="add-plus"
            onClick={() => {
              setGsisToCreate((prev) => [
                ...prev,
                {
                  indexName: "",
                  partitionKey: "",
                  sortKey: "",
                  readCapacity: "5",
                  writeCapacity: "5",
                },
              ]);
            }}
          >
            Add GSI
          </Button>
        </SpaceBetween>
      </Container>

      {/* Apply changes */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 12,
          padding: "12px 0",
          borderTop: "1px solid var(--color-border-divider-default, #e9ebed)",
        }}
      >
        {hasChanges && (
          <Box variant="small" color="text-status-info">
            Unsaved changes detected
          </Box>
        )}
        <Button
          variant="primary"
          loading={updateTable.isPending}
          disabled={!hasChanges}
          onClick={handleApplyChanges}
        >
          Apply changes
        </Button>
      </div>
    </SpaceBetween>
  );
}
