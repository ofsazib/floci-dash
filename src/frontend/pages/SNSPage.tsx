import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ContentLayout,
  Header,
  Box,
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
  Tabs,
  ColumnLayout,
  Container,
  Textarea,
  Select,
  Link,
} from "@cloudscape-design/components";
import StatCard from "../components/StatCard";
import { useToast } from "../components/Toast";
import { useConfirmDialog } from "../components/ConfirmDialog";
import {
  useSNSTopics,
  useSNSTopicAttributes,
  useSNSSubscriptions,
  useSNSTopicTags,
  useSNSPlatformApps,
  useCreateSNSTopic,
  useDeleteSNSTopic,
  useSNSSubscribe,
  useSNSUnsubscribe,
  useSNSPublish,
  useSNSTopicTagsMutation,
  useCreateSNSPlatformApp,
  useDeleteSNSPlatformApp,
  extractTopicName,
  type SNSTopic,
  type SNSSubscription,
  type SNSPlatformApp,
} from "../hooks/useSNS";

export default function SNSPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { confirm, dialog } = useConfirmDialog();

  const selectedTopic = searchParams.get("topicArn") || null;
  const [showCreate, setShowCreate] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  return (
    <ContentLayout
      header={
        <SpaceBetween size="m">
          {selectedTopic && (
            <Box>
              <Button
                variant="link"
                onClick={() => {
                  searchParams.delete("topicArn");
                  setSearchParams(searchParams);
                }}
              >
                ← Back to topics
              </Button>
            </Box>
          )}
          <Header variant="h1" description="Amazon Simple Notification Service">
            SNS
          </Header>
        </SpaceBetween>
      }
    >
      {selectedTopic ? (
        <TopicDetail
          topicArn={selectedTopic}
          showToast={showToast}
          confirm={confirm}
          showPublish={showPublish}
          setShowPublish={setShowPublish}
          showSubscribe={showSubscribe}
          setShowSubscribe={setShowSubscribe}
        />
      ) : (
        <TopicList
          searchFilter={searchFilter}
          setSearchFilter={setSearchFilter}
          showCreate={showCreate}
          setShowCreate={setShowCreate}
          showToast={showToast}
          confirm={confirm}
          onSelectTopic={(arn) => setSearchParams({ topicArn: arn })}
        />
      )}
      {dialog}
    </ContentLayout>
  );
}

function TopicList({
  searchFilter,
  setSearchFilter,
  showCreate,
  setShowCreate,
  showToast,
  confirm,
  onSelectTopic,
}: {
  searchFilter: string;
  setSearchFilter: (v: string) => void;
  showCreate: boolean;
  setShowCreate: (v: boolean) => void;
  showToast: (type: "success" | "error" | "info" | "warning", msg: string) => void;
  confirm: (opts: { title: string; message: string; confirmText?: string; variant?: "primary" | "danger" }) => Promise<boolean>;
  onSelectTopic: (arn: string) => void;
}) {
  const { data, isLoading, isError, error } = useSNSTopics();
  const deleteTopic = useDeleteSNSTopic();

  const topics = data?.topics || [];
  const filtered = searchFilter
    ? topics.filter((t) => extractTopicName(t.TopicArn).toLowerCase().includes(searchFilter.toLowerCase()))
    : topics;

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
                  Create topic
                </Button>
              }
            >
              Topics
            </Header>
          }
          filter={
            <TextFilter
              filteringText={searchFilter}
              filteringPlaceholder="Find topics..."
              onChange={({ detail }) => setSearchFilter(detail.filteringText)}
            />
          }
          columnDefinitions={[
            {
              id: "name",
              header: "Topic name",
              cell: (item: SNSTopic) => (
                <Link onFollow={() => onSelectTopic(item.TopicArn)}>
                  {extractTopicName(item.TopicArn)}
                </Link>
              ),
              sortingField: "name",
            },
            {
              id: "arn",
              header: "Topic ARN",
              cell: (item: SNSTopic) => (
                <Box fontSize="body-s" color="text-body-secondary">
                  {item.TopicArn}
                </Box>
              ),
            },
            {
              id: "type",
              header: "Type",
              cell: (item: SNSTopic) => (
                <StatusIndicator type={item.TopicArn.endsWith(".fifo") ? "info" : "success"}>
                  {item.TopicArn.endsWith(".fifo") ? "FIFO" : "Standard"}
                </StatusIndicator>
              ),
            },
            {
              id: "actions",
              header: "",
              cell: (item: SNSTopic) => (
                <Button
                  variant="icon"
                  iconName="remove"
                  ariaLabel="Delete topic"
                  onClick={async () => {
                    const ok = await confirm({
                      title: `Delete topic "${extractTopicName(item.TopicArn)}"?`,
                      message: "This action cannot be undone. The topic and all its subscriptions will be permanently deleted.",
                      confirmText: "Delete",
                      variant: "danger",
                    });
                    if (ok) {
                      deleteTopic.mutate(item.TopicArn, {
                        onSuccess: () => showToast("success", "Topic deleted"),
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
          loadingText="Loading topics..."
          empty={
            isError ? (
              <Box textAlign="center">
                <StatusIndicator type="error">{(error as Error)?.message || "Failed to load topics"}</StatusIndicator>
              </Box>
            ) : (
              <Box textAlign="center" padding={{ top: "l", bottom: "l" }}>
                <StatusIndicator type="info">No topics found</StatusIndicator>
                <Box variant="p" padding={{ top: "s" }}>
                  <Button variant="primary" onClick={() => setShowCreate(true)}>
                    Create topic
                  </Button>
                </Box>
              </Box>
            )
          }
        />
      </Container>

      {showCreate && (
        <CreateTopicModal visible={showCreate} onDismiss={() => setShowCreate(false)} showToast={showToast} />
      )}
    </SpaceBetween>
  );
}

function CreateTopicModal({
  visible,
  onDismiss,
  showToast,
}: {
  visible: boolean;
  onDismiss: () => void;
  showToast: (type: "success" | "error" | "info" | "warning", msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [isFifo, setIsFifo] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const createTopic = useCreateSNSTopic();

  const handleSubmit = () => {
    let topicName = name.trim();
    if (isFifo && !topicName.endsWith(".fifo")) topicName += ".fifo";
    if (!topicName) return;

    const attributes: Record<string, string> = {};
    if (displayName) attributes.DisplayName = displayName;
    if (isFifo) attributes.FifoTopic = "true";

    createTopic.mutate(
      { name: topicName, attributes },
      {
        onSuccess: () => {
          showToast("success", `Topic "${topicName}" created`);
          onDismiss();
          setName("");
          setDisplayName("");
          setIsFifo(false);
        },
        onError: (e) => showToast("error", `Create failed: ${e.message}`),
      }
    );
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header="Create topic"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={createTopic.isPending}
              disabled={!name.trim()}
            >
              Create
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <Form>
        <SpaceBetween size="l">
          <FormField label="Topic name">
            <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="my-topic" />
          </FormField>
          <FormField label="Display name" description="Optional, shown in SMS/email subjects">
            <Input value={displayName} onChange={({ detail }) => setDisplayName(detail.value)} />
          </FormField>
          <FormField label="FIFO topic">
            <Select
              selectedOption={isFifo ? { value: "true", label: "FIFO" } : { value: "false", label: "Standard" }}
              onChange={({ detail }) => setIsFifo(detail.selectedOption?.value === "true")}
              options={[
                { value: "false", label: "Standard" },
                { value: "true", label: "FIFO" },
              ]}
            />
          </FormField>
        </SpaceBetween>
      </Form>
    </Modal>
  );
}

function TopicDetail({
  topicArn,
  showToast,
  confirm,
  showPublish,
  setShowPublish,
  showSubscribe,
  setShowSubscribe,
}: {
  topicArn: string;
  showToast: (type: "success" | "error" | "info" | "warning", msg: string) => void;
  confirm: (opts: { title: string; message: string; confirmText?: string; variant?: "primary" | "danger" }) => Promise<boolean>;
  showPublish: boolean;
  setShowPublish: (v: boolean) => void;
  showSubscribe: boolean;
  setShowSubscribe: (v: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState("attributes");
  const { data: attrData } = useSNSTopicAttributes(topicArn);
  const attrs = attrData?.attributes || {};
  const topicName = extractTopicName(topicArn);

  return (
    <SpaceBetween size="l">
      <ColumnLayout columns={4} variant="text-grid">
        <StatCard
          label="Confirmed"
          value={attrs.SubscriptionsConfirmed || "0"}
          variant="success"
          subtext="Active subscriptions"
        />
        <StatCard
          label="Pending"
          value={attrs.SubscriptionsPending || "0"}
          variant="warning"
          subtext="Awaiting confirmation"
        />
        <StatCard
          label="Deleted"
          value={attrs.SubscriptionsDeleted || "0"}
          variant="default"
          subtext="Lifetime deletions"
          isText
        />
        <StatCard
          label="Type"
          value={attrs.FifoTopic === "true" ? "FIFO" : "Standard"}
          variant="info"
          subtext={topicName}
          isText
        />
      </ColumnLayout>

      <Tabs
        tabs={[
          {
            label: "Attributes",
            id: "attributes",
            content: <AttributesTab topicArn={topicArn} attrs={attrs} />,
          },
          {
            label: "Subscriptions",
            id: "subscriptions",
            content: (
              <SubscriptionsTab
                topicArn={topicArn}
                showToast={showToast}
                confirm={confirm}
                showSubscribe={showSubscribe}
                setShowSubscribe={setShowSubscribe}
              />
            ),
          },
          {
            label: "Publish",
            id: "publish",
            content: (
              <Box padding="l">
                <Button variant="primary" onClick={() => setShowPublish(true)}>
                  Publish message
                </Button>
              </Box>
            ),
          },
          {
            label: "Tags",
            id: "tags",
            content: <TagsTab topicArn={topicArn} showToast={showToast} />,
          },
        ]}
        activeTabId={activeTab}
        onChange={({ detail }) => setActiveTab(detail.activeTabId)}
      />

      {showPublish && (
        <PublishModal
          visible={showPublish}
          onDismiss={() => setShowPublish(false)}
          topicArn={topicArn}
          isFifo={topicName.endsWith(".fifo")}
          showToast={showToast}
        />
      )}
    </SpaceBetween>
  );
}

function AttributesTab({ topicArn, attrs }: { topicArn: string; attrs: Record<string, string> }) {
  return (
    <Container header={<Header variant="h2">Topic attributes</Header>}>
      <ColumnLayout columns={2} variant="text-grid">
        <div>
          <Box variant="awsui-key-label">Topic ARN</Box>
          <Box fontSize="body-s">{topicArn}</Box>
        </div>
        <div>
          <Box variant="awsui-key-label">Owner</Box>
          <Box>{attrs.Owner || "—"}</Box>
        </div>
        <div>
          <Box variant="awsui-key-label">Display Name</Box>
          <Box>{attrs.DisplayName || "—"}</Box>
        </div>
        <div>
          <Box variant="awsui-key-label">Type</Box>
          <Box>{attrs.FifoTopic === "true" ? "FIFO" : "Standard"}</Box>
        </div>
      </ColumnLayout>
    </Container>
  );
}

function SubscriptionsTab({
  topicArn,
  showToast,
  confirm,
  showSubscribe,
  setShowSubscribe,
}: {
  topicArn: string;
  showToast: (type: "success" | "error" | "info" | "warning", msg: string) => void;
  confirm: (opts: { title: string; message: string; confirmText?: string; variant?: "primary" | "danger" }) => Promise<boolean>;
  showSubscribe: boolean;
  setShowSubscribe: (v: boolean) => void;
}) {
  const { data, isLoading } = useSNSSubscriptions(topicArn);
  const unsubscribe = useSNSUnsubscribe();
  const subs = data?.subscriptions || [];

  return (
    <Container
      header={
        <Header
          variant="h2"
          counter={`(${subs.length})`}
          actions={
            <Button variant="primary" onClick={() => setShowSubscribe(true)}>
              Create subscription
            </Button>
          }
        >
          Subscriptions
        </Header>
      }
    >
      <Table
        items={subs}
        loading={isLoading}
        loadingText="Loading subscriptions..."
        columnDefinitions={[
          {
            id: "protocol",
            header: "Protocol",
            cell: (item: SNSSubscription) => (
              <StatusIndicator type="success">{item.Protocol}</StatusIndicator>
            ),
          },
          {
            id: "endpoint",
            header: "Endpoint",
            cell: (item: SNSSubscription) => (
              <Box fontSize="body-s">{item.Endpoint}</Box>
            ),
          },
          {
            id: "arn",
            header: "Status",
            cell: (item: SNSSubscription) =>
              item.SubscriptionArn === "PendingConfirmation" ? (
                <StatusIndicator type="pending">Pending</StatusIndicator>
              ) : (
                <StatusIndicator type="success">Confirmed</StatusIndicator>
              ),
          },
          {
            id: "actions",
            header: "",
            cell: (item: SNSSubscription) =>
              item.SubscriptionArn !== "PendingConfirmation" && (
                <Button
                  variant="icon"
                  iconName="remove"
                  ariaLabel="Unsubscribe"
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Delete subscription?",
                      message: "This endpoint will stop receiving messages from this topic.",
                      confirmText: "Delete",
                      variant: "danger",
                    });
                    if (ok) {
                      unsubscribe.mutate(
                        { subscriptionArn: item.SubscriptionArn, topicArn },
                        {
                          onSuccess: () => showToast("success", "Subscription deleted"),
                          onError: (e) => showToast("error", `Delete failed: ${e.message}`),
                        }
                      );
                    }
                  }}
                />
              ),
          },
        ]}
        empty={
          <Box textAlign="center" padding={{ top: "l", bottom: "l" }}>
            <StatusIndicator type="info">No subscriptions</StatusIndicator>
          </Box>
        }
      />

      {showSubscribe && (
        <SubscribeModal
          visible={showSubscribe}
          onDismiss={() => setShowSubscribe(false)}
          topicArn={topicArn}
          showToast={showToast}
        />
      )}
    </Container>
  );
}

function SubscribeModal({
  visible,
  onDismiss,
  topicArn,
  showToast,
}: {
  visible: boolean;
  onDismiss: () => void;
  topicArn: string;
  showToast: (type: "success" | "error" | "info" | "warning", msg: string) => void;
}) {
  const [protocol, setProtocol] = useState("sqs");
  const [endpoint, setEndpoint] = useState("");
  const subscribe = useSNSSubscribe();

  const handleSubscribe = () => {
    if (!endpoint.trim()) return;
    subscribe.mutate(
      { topicArn, protocol, endpoint: endpoint.trim() },
      {
        onSuccess: (result: unknown) => {
          const r = result as { subscriptionArn?: string };
          showToast("success", "Subscription created");
          onDismiss();
          setEndpoint("");
        },
        onError: (e) => showToast("error", `Subscribe failed: ${e.message}`),
      }
    );
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header="Create subscription"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleSubscribe}
              loading={subscribe.isPending}
              disabled={!endpoint.trim()}
            >
              Subscribe
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <Form>
        <SpaceBetween size="l">
          <FormField label="Protocol">
            <Select
              selectedOption={{ value: protocol, label: protocol.toUpperCase() }}
              onChange={({ detail }) => setProtocol(detail.selectedOption?.value || "sqs")}
              options={[
                { value: "sqs", label: "SQS" },
                { value: "lambda", label: "Lambda" },
                { value: "email", label: "Email" },
                { value: "email-json", label: "Email (JSON)" },
                { value: "http", label: "HTTP" },
                { value: "https", label: "HTTPS" },
                { value: "sms", label: "SMS" },
              ]}
            />
          </FormField>
          <FormField label="Endpoint" description="Queue ARN, Lambda ARN, URL, email, or phone number">
            <Input
              value={endpoint}
              onChange={({ detail }) => setEndpoint(detail.value)}
              placeholder="arn:aws:sqs:us-east-1:000000000000:my-queue"
            />
          </FormField>
        </SpaceBetween>
      </Form>
    </Modal>
  );
}

function PublishModal({
  visible,
  onDismiss,
  topicArn,
  isFifo,
  showToast,
}: {
  visible: boolean;
  onDismiss: () => void;
  topicArn: string;
  isFifo: boolean;
  showToast: (type: "success" | "error" | "info" | "warning", msg: string) => void;
}) {
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [groupId, setGroupId] = useState("");
  const publish = useSNSPublish();

  const handlePublish = () => {
    if (!message.trim()) return;
    publish.mutate(
      {
        topicArn,
        message,
        subject: subject || undefined,
        messageGroupId: isFifo ? groupId || undefined : undefined,
      },
      {
        onSuccess: (result: unknown) => {
          const r = result as { messageId?: string };
          showToast("success", `Published: ${r.messageId?.substring(0, 8)}…`);
          onDismiss();
          setMessage("");
          setSubject("");
          setGroupId("");
        },
        onError: (e) => showToast("error", `Publish failed: ${e.message}`),
      }
    );
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header="Publish message"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handlePublish}
              loading={publish.isPending}
              disabled={!message.trim()}
            >
              Publish
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <Form>
        <SpaceBetween size="l">
          <FormField label="Subject" description="Optional">
            <Input value={subject} onChange={({ detail }) => setSubject(detail.value)} />
          </FormField>
          <FormField label="Message body">
            <Textarea
              value={message}
              onChange={({ detail }) => setMessage(detail.value)}
              rows={5}
              placeholder="Enter message content..."
            />
          </FormField>
          {isFifo && (
            <FormField label="Message group ID" description="Required for FIFO topics">
              <Input value={groupId} onChange={({ detail }) => setGroupId(detail.value)} placeholder="group-1" />
            </FormField>
          )}
        </SpaceBetween>
      </Form>
    </Modal>
  );
}

function TagsTab({
  topicArn,
  showToast,
}: {
  topicArn: string;
  showToast: (type: "success" | "error" | "info" | "warning", msg: string) => void;
}) {
  const { data, isLoading } = useSNSTopicTags(topicArn);
  const { tag, untag } = useSNSTopicTagsMutation();
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const tags = data?.tags || [];

  const handleAdd = () => {
    if (!newKey.trim()) return;
    tag.mutate(
      { topicArn, tags: [{ Key: newKey, Value: newValue }] },
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
      ) : (
        <SpaceBetween size="m">
          <Table
            items={tags}
            columnDefinitions={[
              { id: "key", header: "Key", cell: (item: { Key: string; Value: string }) => item.Key },
              { id: "value", header: "Value", cell: (item: { Key: string; Value: string }) => item.Value },
              {
                id: "actions",
                header: "",
                cell: (item: { Key: string; Value: string }) => (
                  <Button
                    variant="icon"
                    iconName="close"
                    ariaLabel="Remove tag"
                    onClick={() =>
                      untag.mutate(
                        { topicArn, tagKeys: [item.Key] },
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
