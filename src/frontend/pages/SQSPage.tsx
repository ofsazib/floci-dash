import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ContentLayout,
  Header,
  Box,
  BreadcrumbGroup,
  SpaceBetween,
  Table,
  Button,
  Modal,
  Form,
  FormField,
  Input,
  TextFilter,
  StatusIndicator,
  Spinner,
  Alert,
  Tabs,
  ColumnLayout,
  Container,
  Textarea,
  Toggle,
  Link,
} from "@cloudscape-design/components";
import { useHealth } from "../hooks/useSystem";
import StatusBadge from "../components/StatusBadge";
import { TableSkeleton } from "../components/LoadingSkeleton";
import StatCard from "../components/StatCard";
import { useToast } from "../components/Toast";
import { useConfirmDialog } from "../components/ConfirmDialog";
import {
  useSQSQueues,
  useSQSQueueAttributes,
  useSQSMessages,
  useSQSQueueTags,
  useSQSDLQSources,
  useCreateSQSQueue,
  useDeleteSQSQueue,
  usePurgeSQSQueue,
  useSendSQSMessage,
  useDeleteSQSMessage,
  useSetSQSAttributes,
  useSQSTags,
  extractQueueName,
  type SQSMessage,
} from "../hooks/useSQS";

export default function SQSPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { confirm, dialog } = useConfirmDialog();

  const selectedQueue = searchParams.get("queueUrl") || null;
  const [showCreate, setShowCreate] = useState(false);
  const [showSendMessage, setShowSendMessage] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  return (
    <ContentLayout
      header={
        <SpaceBetween size="m">
          {selectedQueue && (
            <BreadcrumbGroup
              items={[
                { text: "Dashboard", href: "#/" },
                { text: "SQS", href: "#/services/sqs" },
                { text: extractQueueName(selectedQueue), href: "#" },
              ]}
              onFollow={(e) => {
                e.preventDefault();
                if (e.detail.href === "#/services/sqs") {
                  searchParams.delete("queueUrl");
                  setSearchParams(searchParams);
                }
              }}
            />
          )}
          <Header variant="h1" description="Amazon Simple Queue Service">
            SQS
          </Header>
        </SpaceBetween>
      }
    >
      {selectedQueue ? (
        <QueueDetail
          queueUrl={selectedQueue}
          onBack={() => {
            searchParams.delete("queueUrl");
            setSearchParams(searchParams);
          }}
          showToast={showToast}
          confirm={confirm}
          showSendMessage={showSendMessage}
          setShowSendMessage={setShowSendMessage}
        />
      ) : (
        <QueueList
          searchFilter={searchFilter}
          setSearchFilter={setSearchFilter}
          showCreate={showCreate}
          setShowCreate={setShowCreate}
          showToast={showToast}
          confirm={confirm}
          onSelectQueue={(url) => setSearchParams({ queueUrl: url })}
        />
      )}
      {dialog}
    </ContentLayout>
  );
}

function QueueList({
  searchFilter,
  setSearchFilter,
  showCreate,
  setShowCreate,
  showToast,
  confirm,
  onSelectQueue,
}: {
  searchFilter: string;
  setSearchFilter: (v: string) => void;
  showCreate: boolean;
  setShowCreate: (v: boolean) => void;
  showToast: (type: "success" | "error" | "info" | "warning", msg: string) => void;
  confirm: (opts: { title: string; message: string; confirmText?: string; variant?: "primary" | "danger" }) => Promise<boolean>;
  onSelectQueue: (url: string) => void;
}) {
  const { data, isLoading, isError, error } = useSQSQueues();
  const deleteQueue = useDeleteSQSQueue();

  const queues = (data?.queueUrls || []).map((url) => ({
    url,
    name: extractQueueName(url),
  }));

  const filtered = searchFilter
    ? queues.filter((q) => q.name.toLowerCase().includes(searchFilter.toLowerCase()))
    : queues;

  return (
    <SpaceBetween size="l">
      <Container>
        <Table
          header={
            <Header
              variant="h2"
              counter={`(${filtered.length})`}
              actions={
                <Button variant="primary" onClick={() => setShowCreate(true)}>
                  Create queue
                </Button>
              }
            >
              Queues
            </Header>
          }
          filter={
            <TextFilter
              filteringText={searchFilter}
              filteringPlaceholder="Find queues..."
              onChange={({ detail }) => setSearchFilter(detail.filteringText)}
            />
          }
          columnDefinitions={[
            {
              id: "name",
              header: "Queue name",
              cell: (item: { url: string; name: string }) => (
                <Link onFollow={() => onSelectQueue(item.url)}>{item.name}</Link>
              ),
              sortingField: "name",
            },
            {
              id: "url",
              header: "Queue URL",
              cell: (item: { url: string }) => (
                <Box color="text-body-secondary" fontSize="body-s">
                  {item.url}
                </Box>
              ),
            },
            {
              id: "type",
              header: "Type",
              cell: (item: { name: string }) => (
                <StatusIndicator type={item.name.endsWith(".fifo") ? "info" : "success"}>
                  {item.name.endsWith(".fifo") ? "FIFO" : "Standard"}
                </StatusIndicator>
              ),
            },
            {
              id: "actions",
              header: "",
              cell: (item: { url: string; name: string }) => (
                <Button
                  variant="icon"
                  iconName="remove"
                  ariaLabel="Delete queue"
                  onClick={async () => {
                    const ok = await confirm({
                      title: `Delete queue "${item.name}"?`,
                      message: "This action cannot be undone. The queue and all its messages will be permanently deleted.",
                      confirmText: "Delete",
                      variant: "danger",
                    });
                    if (ok) {
                      deleteQueue.mutate(item.url, {
                        onSuccess: () => showToast("success", `Queue "${item.name}" deleted`),
                        onError: (e) => showToast("error", `Delete failed: ${e.message}`),
                      });
                    }
                  }}
                />
              ),
            },
          ]}
          items={filtered}
          loading={isLoading}
          loadingText="Loading queues..."
          empty={
            isError ? (
              <Box textAlign="center" color="text-status-error">
                <StatusIndicator type="error">{(error as Error)?.message || "Failed to load queues"}</StatusIndicator>
              </Box>
            ) : (
              <Box textAlign="center" padding={{ top: "l", bottom: "l" }}>
                <StatusIndicator type="info">No queues found</StatusIndicator>
                <Box variant="p" padding={{ top: "s" }}>
                  <Button variant="primary" onClick={() => setShowCreate(true)}>
                    Create queue
                  </Button>
                </Box>
              </Box>
            )
          }
        />
      </Container>

      {showCreate && (
        <CreateQueueModal
          visible={showCreate}
          onDismiss={() => setShowCreate(false)}
          showToast={showToast}
        />
      )}
    </SpaceBetween>
  );
}

function CreateQueueModal({
  visible,
  onDismiss,
  showToast,
}: {
  visible: boolean;
  onDismiss: () => void;
  showToast: (type: "success" | "error" | "info" | "warning", msg: string) => void;
}) {
  const [queueName, setQueueName] = useState("");
  const [isFifo, setIsFifo] = useState(false);
  const [visibilityTimeout, setVisibilityTimeout] = useState("30");
  const [delaySeconds, setDelaySeconds] = useState("0");
  const [maxMessageSize, setMaxMessageSize] = useState("262144");
  const [messageRetention, setMessageRetention] = useState("345600");
  const [tags, setTags] = useState("");
  const createQueue = useCreateSQSQueue();

  const handleSubmit = async () => {
    let name = queueName.trim();
    if (isFifo && !name.endsWith(".fifo")) name += ".fifo";
    if (!name) return;

    const attributes: Record<string, string> = {};
    if (visibilityTimeout) attributes.VisibilityTimeout = visibilityTimeout;
    if (delaySeconds) attributes.DelaySeconds = delaySeconds;
    if (maxMessageSize) attributes.MaximumMessageSize = maxMessageSize;
    if (messageRetention) attributes.MessageRetentionPeriod = messageRetention;
    if (isFifo) {
      attributes.FifoQueue = "true";
      attributes.ContentBasedDeduplication = "true";
    }

    let tagMap: Record<string, string> | undefined;
    if (tags.trim()) {
      try {
        tagMap = JSON.parse(tags);
      } catch {
        showToast("error", "Tags must be valid JSON");
        return;
      }
    }

    createQueue.mutate(
      { queueName: name, attributes, tags: tagMap },
      {
        onSuccess: () => {
          showToast("success", `Queue "${name}" created`);
          onDismiss();
          setQueueName("");
          setIsFifo(false);
          setVisibilityTimeout("30");
          setDelaySeconds("0");
          setMaxMessageSize("262144");
          setMessageRetention("345600");
          setTags("");
        },
        onError: (e) => showToast("error", `Create failed: ${e.message}`),
      }
    );
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header="Create queue"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={createQueue.isPending}
              disabled={!queueName.trim()}
            >
              Create
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <Form>
        <SpaceBetween size="l">
          <FormField label="Queue name" description="3-80 characters, alphanumeric, hyphens, underscores">
            <Input value={queueName} onChange={({ detail }) => setQueueName(detail.value)} placeholder="my-queue" />
          </FormField>
          <FormField label="FIFO queue">
            <Toggle checked={isFifo} onChange={({ detail }) => setIsFifo(detail.checked)}>
              Enable FIFO (First-In-First-Out) delivery
            </Toggle>
          </FormField>
          <ColumnLayout columns={2} variant="text-grid">
            <FormField label="Visibility timeout (seconds)">
              <Input value={visibilityTimeout} onChange={({ detail }) => setVisibilityTimeout(detail.value)} />
            </FormField>
            <FormField label="Delay (seconds)">
              <Input value={delaySeconds} onChange={({ detail }) => setDelaySeconds(detail.value)} />
            </FormField>
            <FormField label="Max message size (bytes)">
              <Input value={maxMessageSize} onChange={({ detail }) => setMaxMessageSize(detail.value)} />
            </FormField>
            <FormField label="Message retention (seconds)">
              <Input value={messageRetention} onChange={({ detail }) => setMessageRetention(detail.value)} />
            </FormField>
          </ColumnLayout>
          <FormField label="Tags (JSON)" description='Optional, e.g. {"env": "prod"}'>
            <Textarea value={tags} onChange={({ detail }) => setTags(detail.value)} placeholder='{"team": "backend"}' />
          </FormField>
        </SpaceBetween>
      </Form>
    </Modal>
  );
}

function QueueDetail({
  queueUrl,
  onBack,
  showToast,
  confirm,
  showSendMessage,
  setShowSendMessage,
}: {
  queueUrl: string;
  onBack: () => void;
  showToast: (type: "success" | "error" | "info" | "warning", msg: string) => void;
  confirm: (opts: { title: string; message: string; confirmText?: string; variant?: "primary" | "danger" }) => Promise<boolean>;
  showSendMessage: boolean;
  setShowSendMessage: (v: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState("attributes");
  const { data, isLoading } = useSQSQueueAttributes(queueUrl);
  const purgeQueue = usePurgeSQSQueue();

  const attrs = data?.attributes || {};
  const queueName = extractQueueName(queueUrl);

  return (
    <SpaceBetween size="l">
      <ColumnLayout columns={4} variant="text-grid">
        <StatCard
          label="Messages Available"
          value={attrs.ApproximateNumberOfMessages || "0"}
          variant="success"
          subtext="Visible in queue"
        />
        <StatCard
          label="In Flight"
          value={attrs.ApproximateNumberOfMessagesNotVisible || "0"}
          variant="warning"
          subtext="Being processed"
        />
        <StatCard
          label="Delayed"
          value={attrs.ApproximateNumberOfMessagesDelayed || "0"}
          variant="info"
          subtext="Waiting to appear"
        />
        <StatCard
          label="Visibility Timeout"
          value={`${attrs.VisibilityTimeout || "30"}s`}
          variant="default"
          subtext="Per message"
          isText
        />
      </ColumnLayout>

      <Tabs
        tabs={[
          {
            label: "Attributes",
            id: "attributes",
            content: (
              <AttributesTab queueUrl={queueUrl} attrs={attrs as Record<string, string>} isLoading={isLoading} showToast={showToast} />
            ),
          },
          {
            label: "Messages",
            id: "messages",
            content: (
              <MessagesTab
                queueUrl={queueUrl}
                queueName={queueName}
                showToast={showToast}
                confirm={confirm}
                showSendMessage={showSendMessage}
                setShowSendMessage={setShowSendMessage}
                onPurge={async () => {
                  const ok = await confirm({
                    title: "Purge queue?",
                    message: "All messages in this queue will be permanently removed. This action cannot be undone.",
                    confirmText: "Purge",
                    variant: "danger",
                  });
                  if (ok) {
                    purgeQueue.mutate(queueUrl, {
                      onSuccess: () => showToast("success", "Queue purged"),
                      onError: (e) => showToast("error", `Purge failed: ${e.message}`),
                    });
                  }
                }}
              />
            ),
          },
          {
            label: "Tags",
            id: "tags",
            content: <TagsTab queueUrl={queueUrl} showToast={showToast} />,
          },
          {
            label: "DLQ",
            id: "dlq",
            content: <DLQTab queueUrl={queueUrl} />,
          },
        ]}
        activeTabId={activeTab}
        onChange={({ detail }) => setActiveTab(detail.activeTabId)}
      />

      <Box>
        <Button variant="link" onClick={onBack}>
          ← Back to queues
        </Button>
      </Box>
    </SpaceBetween>
  );
}

function AttributesTab({
  queueUrl,
  attrs,
  isLoading,
  showToast,
}: {
  queueUrl: string;
  attrs: Record<string, string>;
  isLoading: boolean;
  showToast: (type: "success" | "error" | "info" | "warning", msg: string) => void;
}) {
  const setAttrs = useSetSQSAttributes();
  const [editing, setEditing] = useState(false);
  const [visibilityTimeout, setVisibilityTimeout] = useState(attrs.VisibilityTimeout || "30");
  const [delaySeconds, setDelaySeconds] = useState(attrs.DelaySeconds || "0");
  const [messageRetention, setMessageRetention] = useState(attrs.MessageRetentionPeriod || "345600");

  if (isLoading) {
    return <TableSkeleton />;
  }

  const hasRedrive = !!attrs.RedrivePolicy;

  const handleSave = () => {
    const newAttrs: Record<string, string> = {
      VisibilityTimeout: visibilityTimeout,
      DelaySeconds: delaySeconds,
      MessageRetentionPeriod: messageRetention,
    };
    setAttrs.mutate(
      { queueUrl, attributes: newAttrs },
      {
        onSuccess: () => {
          showToast("success", "Attributes updated");
          setEditing(false);
        },
        onError: (e) => showToast("error", `Update failed: ${e.message}`),
      }
    );
  };

  return (
    <Container
      header={
        <Header
          variant="h2"
          actions={
            editing ? (
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave} loading={setAttrs.isPending}>
                  Save
                </Button>
              </SpaceBetween>
            ) : (
              <Button onClick={() => setEditing(true)}>Edit</Button>
            )
          }
        >
          Queue attributes
        </Header>
      }
    >
      <ColumnLayout columns={2} variant="text-grid">
        <div>
          <Box variant="awsui-key-label">Queue ARN</Box>
          <Box>{attrs.QueueArn || "—"}</Box>
        </div>
        <div>
          <Box variant="awsui-key-label">Queue Type</Box>
          <Box>{attrs.FifoQueue === "true" ? "FIFO" : "Standard"}</Box>
        </div>
        <div>
          <Box variant="awsui-key-label">Created</Box>
          <Box>{attrs.CreatedTimestamp ? new Date(parseInt(attrs.CreatedTimestamp) * 1000).toLocaleString() : "—"}</Box>
        </div>
        <div>
          <Box variant="awsui-key-label">Last Modified</Box>
          <Box>{attrs.LastModifiedTimestamp ? new Date(parseInt(attrs.LastModifiedTimestamp) * 1000).toLocaleString() : "—"}</Box>
        </div>
        {editing ? (
          <>
            <FormField label="Visibility timeout (seconds)">
              <Input value={visibilityTimeout} onChange={({ detail }) => setVisibilityTimeout(detail.value)} />
            </FormField>
            <FormField label="Delay (seconds)">
              <Input value={delaySeconds} onChange={({ detail }) => setDelaySeconds(detail.value)} />
            </FormField>
            <FormField label="Message retention (seconds)">
              <Input value={messageRetention} onChange={({ detail }) => setMessageRetention(detail.value)} />
            </FormField>
          </>
        ) : (
          <>
            <div>
              <Box variant="awsui-key-label">Visibility Timeout</Box>
              <Box>{attrs.VisibilityTimeout || "30"} seconds</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Delay Seconds</Box>
              <Box>{attrs.DelaySeconds || "0"} seconds</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Message Retention</Box>
              <Box>{attrs.MessageRetentionPeriod || "345600"} seconds</Box>
            </div>
          </>
        )}
        <div>
          <Box variant="awsui-key-label">Max Message Size</Box>
          <Box>{attrs.MaximumMessageSize || "262144"} bytes</Box>
        </div>
        <div>
          <Box variant="awsui-key-label">Dead Letter Queue</Box>
          <Box>
            {hasRedrive ? (
              <StatusIndicator type="warning">{attrs.RedrivePolicy}</StatusIndicator>
            ) : (
              <StatusIndicator type="info">Not configured</StatusIndicator>
            )}
          </Box>
        </div>
      </ColumnLayout>
    </Container>
  );
}

function MessagesTab({
  queueUrl,
  queueName,
  showToast,
  confirm,
  showSendMessage,
  setShowSendMessage,
  onPurge,
}: {
  queueUrl: string;
  queueName: string;
  showToast: (type: "success" | "error" | "info" | "warning", msg: string) => void;
  confirm: (opts: { title: string; message: string; confirmText?: string; variant?: "primary" | "danger" }) => Promise<boolean>;
  showSendMessage: boolean;
  setShowSendMessage: (v: boolean) => void;
  onPurge: () => void;
}) {
  const { data, isLoading } = useSQSMessages(queueUrl);
  const deleteMessage = useDeleteSQSMessage();
  const messages = data?.messages || [];
  const isFifo = queueName.endsWith(".fifo");

  return (
    <Container
      header={
        <Header
          variant="h2"
          counter={`(${messages.length})`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={onPurge}>Purge</Button>
              <Button variant="primary" onClick={() => setShowSendMessage(true)}>
                Send message
              </Button>
            </SpaceBetween>
          }
        >
          Messages
        </Header>
      }
    >
      <Table
        items={messages}
        loading={isLoading}
        loadingText="Loading messages..."
        columnDefinitions={[
          {
            id: "messageId",
            header: "Message ID",
            cell: (item: SQSMessage) => (
              <Box fontSize="body-s">
                {item.MessageId.substring(0, 8)}…
              </Box>
            ),
          },
          {
            id: "body",
            header: "Body (preview)",
            cell: (item: SQSMessage) => (
              <Box fontSize="body-s">
                {item.Body.length > 100 ? item.Body.substring(0, 100) + "…" : item.Body}
              </Box>
            ),
          },
          {
            id: "receiveCount",
            header: "Receive count",
            cell: (item: SQSMessage) =>
              item.Attributes?.ApproximateReceiveCount || "0",
          },
          {
            id: "sent",
            header: "Sent",
            cell: (item: SQSMessage) =>
              item.Attributes?.SentTimestamp
                ? new Date(parseInt(item.Attributes.SentTimestamp)).toLocaleTimeString()
                : "—",
          },
          ...(isFifo
            ? [
                {
                  id: "groupId",
                  header: "Group ID",
                  cell: (item: SQSMessage) => item.Attributes?.MessageGroupId || "—",
                },
              ]
            : []),
          {
            id: "actions",
            header: "",
            cell: (item: SQSMessage) =>
              item.ReceiptHandle ? (
                <Button
                  variant="icon"
                  iconName="close"
                  ariaLabel="Delete message"
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Delete message?",
                      message: "This message will be removed from the queue.",
                      confirmText: "Delete",
                      variant: "danger",
                    });
                    if (ok) {
                      deleteMessage.mutate(
                        { queueUrl, receiptHandle: item.ReceiptHandle! },
                        {
                          onSuccess: () => showToast("success", "Message deleted"),
                          onError: (e) => showToast("error", `Delete failed: ${e.message}`),
                        }
                      );
                    }
                  }}
                />
              ) : null,
          },
        ]}
        empty={
          <Box textAlign="center" padding={{ top: "l", bottom: "l" }}>
            <StatusIndicator type="info">No messages in queue</StatusIndicator>
          </Box>
        }
      />

      {showSendMessage && (
        <SendMessageModal
          visible={showSendMessage}
          onDismiss={() => setShowSendMessage(false)}
          queueUrl={queueUrl}
          isFifo={isFifo}
          showToast={showToast}
        />
      )}
    </Container>
  );
}

function SendMessageModal({
  visible,
  onDismiss,
  queueUrl,
  isFifo,
  showToast,
}: {
  visible: boolean;
  onDismiss: () => void;
  queueUrl: string;
  isFifo: boolean;
  showToast: (type: "success" | "error" | "info" | "warning", msg: string) => void;
}) {
  const [body, setBody] = useState("");
  const [delay, setDelay] = useState("0");
  const [groupId, setGroupId] = useState("");
  const [dedupId, setDedupId] = useState("");
  const sendMessage = useSendSQSMessage();

  const handleSend = () => {
    if (!body.trim()) return;
    sendMessage.mutate(
      {
        queueUrl,
        messageBody: body,
        delaySeconds: parseInt(delay) || 0,
        messageGroupId: isFifo ? groupId || undefined : undefined,
        messageDeduplicationId: isFifo ? dedupId || undefined : undefined,
      },
      {
        onSuccess: (result: unknown) => {
          const r = result as { messageId?: string };
          showToast("success", `Message sent: ${r.messageId?.substring(0, 8)}…`);
          onDismiss();
          setBody("");
          setDelay("0");
          setGroupId("");
          setDedupId("");
        },
        onError: (e) => showToast("error", `Send failed: ${e.message}`),
      }
    );
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header="Send message"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSend}
              loading={sendMessage.isPending}
              disabled={!body.trim()}
            >
              Send
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <Form>
        <SpaceBetween size="l">
          <FormField label="Message body">
            <Textarea
              value={body}
              onChange={({ detail }) => setBody(detail.value)}
              rows={5}
              placeholder="Enter message content..."
            />
          </FormField>
          <FormField label="Delay (seconds)">
            <Input value={delay} onChange={({ detail }) => setDelay(detail.value)} />
          </FormField>
          {isFifo && (
            <>
              <FormField label="Message group ID" description="Required for FIFO queues">
                <Input value={groupId} onChange={({ detail }) => setGroupId(detail.value)} placeholder="group-1" />
              </FormField>
              <FormField label="Message deduplication ID" description="Optional (content-based dedup is enabled)">
                <Input value={dedupId} onChange={({ detail }) => setDedupId(detail.value)} />
              </FormField>
            </>
          )}
        </SpaceBetween>
      </Form>
    </Modal>
  );
}

function TagsTab({
  queueUrl,
  showToast,
}: {
  queueUrl: string;
  showToast: (type: "success" | "error" | "info" | "warning", msg: string) => void;
}) {
  const { data, isLoading } = useSQSQueueTags(queueUrl);
  const { tag, untag } = useSQSTags();
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const tags = data?.tags || {};

  const handleAdd = () => {
    if (!newKey.trim()) return;
    tag.mutate(
      { queueUrl, tags: { [newKey]: newValue } },
      {
        onSuccess: () => {
          showToast("success", "Tag added");
          setNewKey("");
          setNewValue("");
        },
        onError: (e) => showToast("error", `Tag failed: ${e.message}`),
      }
    );
  };

  return (
    <Container header={<Header variant="h2">Tags</Header>}>
      {isLoading ? (
        <Spinner />
      ) : Object.keys(tags).length === 0 && !newKey ? (
        <Box textAlign="center" padding={{ top: "l", bottom: "l" }}>
          <StatusIndicator type="info">No tags on this queue</StatusIndicator>
        </Box>
      ) : (
        <SpaceBetween size="m">
          <Table
            items={Object.entries(tags).map(([key, value]) => ({ key, value }))}
            columnDefinitions={[
              { id: "key", header: "Key", cell: (item: { key: string; value: string }) => item.key },
              { id: "value", header: "Value", cell: (item: { key: string; value: string }) => item.value },
              {
                id: "actions",
                header: "",
                cell: (item: { key: string }) => (
                  <Button
                    variant="icon"
                    iconName="close"
                    ariaLabel="Remove tag"
                    onClick={() =>
                      untag.mutate(
                        { queueUrl, tagKeys: [item.key] },
                        {
                          onSuccess: () => showToast("success", "Tag removed"),
                          onError: (e) => showToast("error", `Remove failed: ${e.message}`),
                        }
                      )
                    }
                  />
                ),
              },
            ]}
            empty={<Box padding="s">No tags yet</Box>}
          />
          <SpaceBetween direction="horizontal" size="xs" alignItems="end">
            <FormField label="New key">
              <Input value={newKey} onChange={({ detail }) => setNewKey(detail.value)} />
            </FormField>
            <FormField label="New value">
              <Input value={newValue} onChange={({ detail }) => setNewValue(detail.value)} />
            </FormField>
            <Button variant="primary" onClick={handleAdd} loading={tag.isPending} disabled={!newKey.trim()}>
              Add tag
            </Button>
          </SpaceBetween>
        </SpaceBetween>
      )}
    </Container>
  );
}

function DLQTab({ queueUrl }: { queueUrl: string }) {
  const { data, isLoading } = useSQSDLQSources(queueUrl);
  const sources = data?.queueUrls || [];

  return (
    <Container header={<Header variant="h2">Dead Letter Queue Sources</Header>}>
      {isLoading ? (
        <Spinner />
      ) : sources.length === 0 ? (
        <Box textAlign="center" padding={{ top: "l", bottom: "l" }}>
          <StatusIndicator type="info">
            No queues are using this queue as a dead letter queue
          </StatusIndicator>
        </Box>
      ) : (
        <Table
          items={sources.map((url) => ({ url, name: extractQueueName(url) }))}
          columnDefinitions={[
            {
              id: "name",
              header: "Source queue",
              cell: (item: { url: string; name: string }) => item.name,
            },
            {
              id: "url",
              header: "Queue URL",
              cell: (item: { url: string }) => (
                <Box fontSize="body-s" color="text-body-secondary">
                  {item.url}
                </Box>
              ),
            },
          ]}
        />
      )}
    </Container>
  );
}
