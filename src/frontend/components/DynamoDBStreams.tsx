import { useState } from "react";
import {
  Box,
  SpaceBetween,
  StatusIndicator,
  Button,
  Container,
  ColumnLayout,
  Spinner,
  Badge,
} from "@cloudscape-design/components";
import {
  useDynamoDBStreams,
  useDynamoDBStreamDetail,
  useDynamoDBGetShardIterator,
  useDynamoDBGetRecords,
  type StreamRecord,
} from "../hooks/useDynamoDBStreams";
import ResourceTable from "./ResourceTable";
import EmptyState from "./EmptyState";

const SHARD_ITERATOR_TYPES = [
  { label: "TRIM_HORIZON — oldest record", value: "TRIM_HORIZON" },
  { label: "LATEST — most recent", value: "LATEST" },
  { label: "AT_SEQUENCE_NUMBER", value: "AT_SEQUENCE_NUMBER" },
  { label: "AFTER_SEQUENCE_NUMBER", value: "AFTER_SEQUENCE_NUMBER" },
];

export default function DynamoDBStreams({ tableName }: { tableName: string }) {
  const {
    data: streamsData,
    isLoading: streamsLoading,
    isError: streamsError,
    error: streamsErr,
  } = useDynamoDBStreams(tableName);

  const [streamDetailArn, setStreamDetailArn] = useState<string | null>(null);
  const [records, setRecords] = useState<StreamRecord[]>([]);
  const [nextIterator, setNextIterator] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [shardId, setShardId] = useState("");
  const [iteratorType, setIteratorType] = useState("TRIM_HORIZON");
  const [sequenceNumber, setSequenceNumber] = useState("");

  const {
    data: streamDetail,
    isLoading: detailLoading,
    isError: detailError,
  } = useDynamoDBStreamDetail(streamDetailArn);

  const getShardIterator = useDynamoDBGetShardIterator();
  const getRecords = useDynamoDBGetRecords();

  const streams = streamsData?.streams || [];

  const statusBadge = (status: string) => {
    const map: Record<string, { color: "blue" | "green" | "grey" | "red"; label: string }> = {
      ENABLED: { color: "green", label: "Enabled" },
      DISABLED: { color: "blue", label: "Disabled" },
      DISABLING: { color: "grey", label: "Disabling" },
      ACTIVE: { color: "green", label: "Active" },
    };
    const m = map[status] || { color: "blue" as const, label: status };
    return <Badge color={m.color}>{m.label}</Badge>;
  };

  async function handlePollRecords() {
    setPolling(true);
    setRecords([]);

    try {
      const iter: { shardIterator?: string } = await getShardIterator.mutateAsync({
        streamArn: streamDetailArn!,
        shardId: shardId!,
        shardIteratorType: iteratorType,
        sequenceNumber: sequenceNumber || undefined,
      });

      if (iter.shardIterator) {
        const result = await getRecords.mutateAsync({
          shardIterator: iter.shardIterator,
          limit: 50,
        });
        setRecords(result.records || []);
        setNextIterator(result.nextShardIterator);
      }
    } catch {
      /* error handled by mutation state */
    } finally {
      setPolling(false);
    }
  }

  async function handleContinuePolling() {
    setPolling(true);
    try {
      const result = await getRecords.mutateAsync({
        shardIterator: nextIterator!,
        limit: 50,
      });
      setRecords((prev) => [...prev, ...(result.records || [])]);
      setNextIterator(result.nextShardIterator);
    } catch {
      /* error handled by mutation state */
    } finally {
      setPolling(false);
    }
  }

  if (streamsError) {
    return (
      <StatusIndicator type="warning">
        {(streamsErr as Error)?.message || "Failed to load streams"}
      </StatusIndicator>
    );
  }

  if (streamsLoading) {
    return (
      <Box textAlign="center" padding={{ top: "xxxl" }}>
        <Spinner size="large" />
        <Box variant="p" padding={{ top: "m" }} color="text-body-secondary">
          Loading streams...
        </Box>
      </Box>
    );
  }

  if (streams.length === 0) {
    return (
      <EmptyState
        title="No streams"
        description="This table does not have any DynamoDB Streams enabled. Enable streams on the Advanced tab to see item-level changes."
      />
    );
  }

  return (
    <SpaceBetween size="l">
      {/* Stream list */}
      <ResourceTable
        resourceName="Stream"
        headerTitle="Streams"
        headerCounter={streamsData?.total}
        items={streams.map((s) => ({
          ...s,
          shortArn: s.streamArn ? s.streamArn.split(":").pop() : s.streamArn,
        }))}
        columns={[
          {
            id: "tableName",
            header: "Table",
            cell: (s: any) => s.tableName || "—",
            isRowHeader: true,
          },
          {
            id: "streamLabel",
            header: "Label",
            cell: (s: any) => s.streamLabel || "—",
          },
          {
            id: "actions",
            header: "",
            cell: (s: any) => (
              <Button
                variant="link"
                onClick={() => {
                  setStreamDetailArn(s.streamArn);
                  setRecords([]);
                  setNextIterator(null);
                  setShardId("");
                  setIteratorType("TRIM_HORIZON");
                  setSequenceNumber("");
                }}
              >
                View details
              </Button>
            ),
          },
        ]}
        loading={streamsLoading}
        emptyMessage="No streams found"
        filterEnabled
        filterPlaceholder="Find streams by table name"
        filterFunction={(item: any, searchText: string) =>
          (item.tableName || "")
            .toLowerCase()
            .includes(searchText.toLowerCase())
        }
      />

      {/* Stream Detail */}
      {streamDetailArn && (
        <>
          <Box variant="h3" padding={{ bottom: "xs" }}>
            Stream details
          </Box>

          {detailLoading && (
            <Box textAlign="center" padding={{ top: "l" }}>
              <Spinner />
            </Box>
          )}

          {detailError && (
            <StatusIndicator type="error">
              Failed to load stream details
            </StatusIndicator>
          )}

          {streamDetail && !detailLoading && (
            <SpaceBetween size="l">
              <Container>
                <ColumnLayout columns={3} variant="text-grid">
                  <div>
                    <Box variant="small" color="text-body-secondary">
                      Status
                    </Box>
                    <Box variant="strong">
                      {statusBadge(streamDetail.streamStatus)}
                    </Box>
                  </div>
                  <div>
                    <Box variant="small" color="text-body-secondary">
                      View Type
                    </Box>
                    <Box variant="strong">
                      {streamDetail.streamViewType || "—"}
                    </Box>
                  </div>
                  <div>
                    <Box variant="small" color="text-body-secondary">
                      Created
                    </Box>
                    <Box variant="strong">
                      {streamDetail.creationRequestDateTime
                        ? new Date(
                            streamDetail.creationRequestDateTime * 1000
                          ).toLocaleString()
                        : "—"}
                    </Box>
                  </div>
                </ColumnLayout>
              </Container>

              {streamDetail.keySchema.length > 0 && (
                <Container header={<Box variant="h3">Key Schema</Box>}>
                  <SpaceBetween size="xs">
                    {streamDetail.keySchema.map((k) => (
                      <div
                        key={k.attributeName}
                        style={{
                          display: "flex",
                          gap: 16,
                          padding: "8px 0",
                        }}
                      >
                        <Box variant="strong">{k.attributeName}</Box>
                        <Badge color="blue">{k.keyType}</Badge>
                      </div>
                    ))}
                  </SpaceBetween>
                </Container>
              )}

              {streamDetail.shards.length > 0 && (
                <Container header={<Box variant="h3">Shards</Box>}>
                  <SpaceBetween size="s">
                    {streamDetail.shards.map((shard) => (
                      <div
                        key={shard.shardId}
                        style={{
                          padding: "12px",
                          borderRadius: 8,
                          border:
                            "1px solid var(--color-border-divider-default, #e9ebed)",
                          background:
                            "var(--color-background-container-content, #fff)",
                        }}
                      >
                        <SpaceBetween size="xs">
                          <div
                            style={{
                              display: "flex",
                              gap: 12,
                              alignItems: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            <Box variant="strong">
                              {shard.shardId}
                            </Box>
                            {shard.parentShardId && (
                              <Badge color="blue">
                                Parent: {shard.parentShardId}
                              </Badge>
                            )}
                          </div>
                          {shard.sequenceNumberRange && (
                            <Box
                              variant="small"
                              color="text-body-secondary"
                            >
                              Seq:{" "}
                              {shard.sequenceNumberRange.startingSequenceNumber}{" "}
                              →{" "}
                              {shard.sequenceNumberRange.endingSequenceNumber ||
                                "open"}
                            </Box>
                          )}
                        </SpaceBetween>
                      </div>
                    ))}
                  </SpaceBetween>
                </Container>
              )}

              {/* Record polling */}
              <Container
                header={<Box variant="h3">Poll Records</Box>}
                footer={
                  records.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                      }}
                    >
                      <Box variant="small" color="text-body-secondary">
                        {records.length} record
                        {records.length !== 1 ? "s" : ""} retrieved
                        {streamDetail.shards.length > 0 && (
                          <> — select a shard below and click "Get Records"</>
                        )}
                      </Box>
                      <SpaceBetween direction="horizontal" size="xs">
                        {nextIterator && (
                          <Button
                            variant="primary"
                            loading={polling}
                            onClick={handleContinuePolling}
                          >
                            Load more records
                          </Button>
                        )}
                      </SpaceBetween>
                    </div>
                  ) : undefined
                }
              >
                <SpaceBetween size="m">
                  {streamDetail.shards.length === 0 ? (
                    <Box color="text-body-secondary">
                      No shards available for this stream.
                    </Box>
                  ) : (
                    <>
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "flex-end",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ minWidth: 160 }}>
                          <Box
                            variant="small"
                            color="text-body-secondary"
                            padding={{ bottom: "xxs" }}
                          >
                            Shard
                          </Box>
                          <select
                            value={shardId}
                            onChange={(e) => setShardId(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              borderRadius: 8,
                              border: "1px solid var(--color-border-input-default, #aab7b8)",
                              fontSize: "14px",
                              background:
                                "var(--color-background-input-default, #fff)",
                            }}
                          >
                            <option value="">Select a shard...</option>
                            {streamDetail.shards.map((s) => (
                              <option key={s.shardId} value={s.shardId}>
                                {s.shardId}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div style={{ minWidth: 200 }}>
                          <Box
                            variant="small"
                            color="text-body-secondary"
                            padding={{ bottom: "xxs" }}
                          >
                            Iterator type
                          </Box>
                          <select
                            value={iteratorType}
                            onChange={(e) =>
                              setIteratorType(e.target.value)
                            }
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              borderRadius: 8,
                              border: "1px solid var(--color-border-input-default, #aab7b8)",
                              fontSize: "14px",
                              background:
                                "var(--color-background-input-default, #fff)",
                            }}
                          >
                            {SHARD_ITERATOR_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button
                          variant="primary"
                          loading={polling || getShardIterator.isPending}
                          disabled={!shardId}
                          onClick={handlePollRecords}
                        >
                          Get Records
                        </Button>
                      </div>

                      {getRecords.isError && (
                        <StatusIndicator type="error">
                          {(getRecords.error as Error)?.message ||
                            "Failed to fetch records"}
                        </StatusIndicator>
                      )}

                      {records.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <SpaceBetween size="s">
                            {records.map((rec, i) => (
                              <div
                                key={rec.eventID || i}
                                style={{
                                  padding: "12px",
                                  borderRadius: 8,
                                  border:
                                    "1px solid var(--color-border-divider-default, #e9ebed)",
                                  background:
                                    "var(--color-background-container-content, #fff)",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 12,
                                    alignItems: "center",
                                    marginBottom: 8,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <Badge
                                    color={
                                      rec.eventName === "INSERT"
                                        ? "green"
                                        : rec.eventName === "MODIFY"
                                          ? "blue"
                                          : rec.eventName === "REMOVE"
                                            ? "red"
                                            : "blue"
                                    }
                                  >
                                    {rec.eventName}
                                  </Badge>
                                  <Box variant="small" color="text-body-secondary">
                                    {rec.eventID?.slice(0, 8)}…
                                  </Box>
                                  {rec.dynamodb && (
                                    <Box variant="small" color="text-body-secondary">
                                      Seq:{" "}
                                      {rec.dynamodb.sequenceNumber?.slice(
                                        0,
                                        16
                                      )}
                                      …
                                    </Box>
                                  )}
                                </div>
                                {rec.dynamodb && (
                                  <SpaceBetween size="xs">
                                    {rec.dynamodb.keys &&
                                      Object.keys(rec.dynamodb.keys)
                                        .length > 0 && (
                                        <div>
                                          <Box
                                            variant="small"
                                            color="text-body-secondary"
                                          >
                                            Keys:
                                          </Box>
                                          <pre
                                            style={{
                                              fontSize: 12,
                                              margin: 0,
                                              whiteSpace: "pre-wrap",
                                              maxHeight: 80,
                                              overflow: "auto",
                                            }}
                                          >
                                            {JSON.stringify(
                                              rec.dynamodb.keys,
                                              null,
                                              2
                                            )}
                                          </pre>
                                        </div>
                                      )}
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: 16,
                                        flexWrap: "wrap",
                                      }}
                                    >
                                      {rec.dynamodb.newImage &&
                                        Object.keys(rec.dynamodb.newImage)
                                          .length > 0 && (
                                          <div style={{ flex: 1 }}>
                                            <Box
                                              variant="small"
                                              color="text-status-success"
                                            >
                                              New Image:
                                            </Box>
                                            <pre
                                              style={{
                                                fontSize: 12,
                                                margin: 0,
                                                whiteSpace: "pre-wrap",
                                                maxHeight: 120,
                                                overflow: "auto",
                                              }}
                                            >
                                              {JSON.stringify(
                                                rec.dynamodb.newImage,
                                                null,
                                                2
                                              )}
                                            </pre>
                                          </div>
                                        )}
                                      {rec.dynamodb.oldImage &&
                                        Object.keys(rec.dynamodb.oldImage)
                                          .length > 0 && (
                                          <div style={{ flex: 1 }}>
                                            <Box
                                              variant="small"
                                              color="text-status-error"
                                            >
                                              Old Image:
                                            </Box>
                                            <pre
                                              style={{
                                                fontSize: 12,
                                                margin: 0,
                                                whiteSpace: "pre-wrap",
                                                maxHeight: 120,
                                                overflow: "auto",
                                              }}
                                            >
                                              {JSON.stringify(
                                                rec.dynamodb.oldImage,
                                                null,
                                                2
                                              )}
                                            </pre>
                                          </div>
                                        )}
                                    </div>
                                  </SpaceBetween>
                                )}
                              </div>
                            ))}
                          </SpaceBetween>
                        </div>
                      )}
                    </>
                  )}
                </SpaceBetween>
              </Container>
            </SpaceBetween>
          )}
        </>
      )}
    </SpaceBetween>
  );
}
