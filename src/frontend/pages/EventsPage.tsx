import { useState } from "react";
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
  Tabs,
  Container,
  Textarea,
  Link,
  Toggle,
} from "@cloudscape-design/components";
import StatCard from "../components/StatCard";
import { useToast } from "../components/Toast";
import { useConfirmDialog } from "../components/ConfirmDialog";
import {
  useEventBuses,
  useEventRules,
  useEventTargets,
  useEventArchives,
  useCreateEventBus,
  useDeleteEventBus,
  usePutEventRule,
  useDeleteEventRule,
  useToggleEventRule,
  usePutEvents,
  usePutEventTargets,
  useRemoveEventTarget,
  useCreateEventArchive,
  useDeleteEventArchive,
  type EventBus,
  type EventRule,
  type EventTarget,
  type EventArchive,
} from "../hooks/useEvents";

export default function EventsPage() {
  const { showToast } = useToast();
  const { confirm, dialog } = useConfirmDialog();
  const [activeTab, setActiveTab] = useState("rules");
  const [showSendEvent, setShowSendEvent] = useState(false);

  return (
    <ContentLayout
      header={
        <Header variant="h1" description="Amazon EventBridge">
          EventBridge
        </Header>
      }
    >
      <SpaceBetween size="l">
        <Tabs
          tabs={[
            {
              label: "Rules",
              id: "rules",
              content: <RulesTab showToast={showToast} confirm={confirm} />,
            },
            {
              label: "Event Buses",
              id: "buses",
              content: <BusesTab showToast={showToast} confirm={confirm} />,
            },
            {
              label: "Send Event",
              id: "send-event",
              content: (
                <Box padding="l">
                  <Button variant="primary" onClick={() => setShowSendEvent(true)}>
                    Send event
                  </Button>
                </Box>
              ),
            },
            {
              label: "Archives",
              id: "archives",
              content: <ArchivesTab showToast={showToast} confirm={confirm} />,
            },
          ]}
          activeTabId={activeTab}
          onChange={({ detail }) => setActiveTab(detail.activeTabId)}
        />

        {showSendEvent && (
          <SendEventModal
            visible={showSendEvent}
            onDismiss={() => setShowSendEvent(false)}
            showToast={showToast}
          />
        )}
        {dialog}
      </SpaceBetween>
    </ContentLayout>
  );
}

function RulesTab({
  showToast,
  confirm,
}: {
  showToast: (type: "success" | "error" | "info" | "warning", msg: string) => void;
  confirm: (opts: { title: string; message: string; confirmText?: string; variant?: "primary" | "danger" }) => Promise<boolean>;
}) {
  const [searchFilter, setSearchFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const { data, isLoading, isError, error } = useEventRules();
  const deleteRule = useDeleteEventRule();
  const { enable, disable } = useToggleEventRule();

  const rules = data?.rules || [];
  const filtered = searchFilter
    ? rules.filter((r) => r.Name.toLowerCase().includes(searchFilter.toLowerCase()))
    : rules;

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
                  Create rule
                </Button>
              }
            >
              Rules
            </Header>
          }
          filter={
            <TextFilter
              filteringText={searchFilter}
              filteringPlaceholder="Find rules..."
              onChange={({ detail }) => setSearchFilter(detail.filteringText)}
            />
          }
          items={filtered}
          loading={isLoading}
          loadingText="Loading rules..."
          trackBy="Name"
          onRowClick={({ detail }) => {
            if (detail.item) setSelectedRule(detail.item.Name);
          }}
          columnDefinitions={[
            {
              id: "name",
              header: "Name",
              cell: (item: EventRule) => (
                <Link onFollow={() => setSelectedRule(item.Name)}>{item.Name}</Link>
              ),
            },
            {
              id: "state",
              header: "State",
              cell: (item: EventRule) =>
                item.State === "ENABLED" ? (
                  <StatusIndicator type="success">Enabled</StatusIndicator>
                ) : (
                  <StatusIndicator type="stopped">Disabled</StatusIndicator>
                ),
            },
            {
              id: "schedule",
              header: "Schedule",
              cell: (item: EventRule) =>
                item.ScheduleExpression ? (
                  <Box fontSize="body-s">{item.ScheduleExpression}</Box>
                ) : item.EventPattern ? (
                  <StatusIndicator type="info">Event pattern</StatusIndicator>
                ) : (
                  <Box color="text-body-secondary">—</Box>
                ),
            },
            {
              id: "bus",
              header: "Event Bus",
              cell: (item: EventRule) => item.EventBusName || "default",
            },
            {
              id: "toggle",
              header: "",
              cell: (item: EventRule) => (
                <Toggle
                  checked={item.State === "ENABLED"}
                  onChange={({ detail }) => {
                    if (detail.checked) {
                      enable.mutate(
                        { name: item.Name, eventBusName: item.EventBusName },
                        {
                          onSuccess: () => showToast("success", "Rule enabled"),
                          onError: (e) => showToast("error", e.message),
                        }
                      );
                    } else {
                      disable.mutate(
                        { name: item.Name, eventBusName: item.EventBusName },
                        {
                          onSuccess: () => showToast("success", "Rule disabled"),
                          onError: (e) => showToast("error", e.message),
                        }
                      );
                    }
                  }}
                />
              ),
            },
            {
              id: "actions",
              header: "",
              cell: (item: EventRule) => (
                <Button
                  variant="icon"
                  iconName="remove"
                  ariaLabel="Delete rule"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const ok = await confirm({
                      title: `Delete rule "${item.Name}"?`,
                      message: "All targets on this rule will also be removed.",
                      confirmText: "Delete",
                      variant: "danger",
                    });
                    if (ok) {
                      deleteRule.mutate(
                        { name: item.Name, eventBusName: item.EventBusName },
                        {
                          onSuccess: () => showToast("success", "Rule deleted"),
                          onError: (e) => showToast("error", e.message),
                        }
                      );
                    }
                  }}
                />
              ),
            },
          ]}
          empty={
            isError ? (
              <Box textAlign="center">
                <StatusIndicator type="error">{(error as Error)?.message}</StatusIndicator>
              </Box>
            ) : (
              <Box textAlign="center" padding={{ top: "l", bottom: "l" }}>
                <StatusIndicator type="info">No rules found</StatusIndicator>
              </Box>
            )
          }
        />
      </Container>

      {selectedRule && (
        <TargetsSection rule={selectedRule} showToast={showToast} confirm={confirm} onBack={() => setSelectedRule(null)} />
      )}

      {showCreate && (
        <CreateRuleModal visible={showCreate} onDismiss={() => setShowCreate(false)} showToast={showToast} />
      )}
    </SpaceBetween>
  );
}

function TargetsSection({
  rule,
  showToast,
  confirm,
  onBack,
}: {
  rule: string;
  showToast: (type: "success" | "error" | "info" | "warning", msg: string) => void;
  confirm: (opts: { title: string; message: string; confirmText?: string; variant?: "primary" | "danger" }) => Promise<boolean>;
  onBack: () => void;
}) {
  const { data, isLoading } = useEventTargets(rule);
  const removeTarget = useRemoveEventTarget();
  const [newTargetArn, setNewTargetArn] = useState("");
  const [newTargetId, setNewTargetId] = useState("");
  const putTargets = usePutEventTargets();
  const targets = data?.targets || [];

  const handleAddTarget = () => {
    if (!newTargetArn.trim() || !newTargetId.trim()) return;
    putTargets.mutate(
      { rule, targets: [{ Id: newTargetId, Arn: newTargetArn }] },
      {
        onSuccess: () => {
          showToast("success", "Target added");
          setNewTargetArn("");
          setNewTargetId("");
        },
        onError: (e) => showToast("error", e.message),
      }
    );
  };

  return (
    <Container
      header={
        <Header
          variant="h2"
          counter={`(${targets.length})`}
          actions={<Button variant="link" onClick={onBack}>Hide</Button>}
        >
          Targets for: {rule}
        </Header>
      }
    >
      {isLoading ? (
        <StatusIndicator type="loading">Loading targets...</StatusIndicator>
      ) : (
        <SpaceBetween size="m">
          <Table
            items={targets}
            columnDefinitions={[
              { id: "id", header: "ID", cell: (item: EventTarget) => item.Id },
              { id: "arn", header: "Target ARN", cell: (item: EventTarget) => <Box fontSize="body-s">{item.Arn}</Box> },
              {
                id: "actions",
                header: "",
                cell: (item: EventTarget) => (
                  <Button
                    variant="icon"
                    iconName="remove"
                    ariaLabel="Remove target"
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Remove target?",
                        message: `Target "${item.Id}" will be removed from rule "${rule}".`,
                        confirmText: "Remove",
                        variant: "danger",
                      });
                      if (ok) {
                        removeTarget.mutate(
                          { rule, ids: [item.Id] },
                          {
                            onSuccess: () => showToast("success", "Target removed"),
                            onError: (e) => showToast("error", e.message),
                          }
                        );
                      }
                    }}
                  />
                ),
              },
            ]}
            empty={<Box padding="s">No targets</Box>}
          />
          <SpaceBetween direction="horizontal" size="xs" alignItems="end">
            <FormField label="Target ID">
              <Input value={newTargetId} onChange={({ detail }) => setNewTargetId(detail.value)} placeholder="target-1" />
            </FormField>
            <FormField label="Target ARN (Lambda/SQS/SNS)">
              <Input value={newTargetArn} onChange={({ detail }) => setNewTargetArn(detail.value)} placeholder="arn:aws:lambda:us-east-1:000000000000:function:my-fn" />
            </FormField>
            <Button variant="primary" onClick={handleAddTarget} loading={putTargets.isPending} disabled={!newTargetArn.trim() || !newTargetId.trim()}>
              Add target
            </Button>
          </SpaceBetween>
        </SpaceBetween>
      )}
    </Container>
  );
}

function CreateRuleModal({
  visible,
  onDismiss,
  showToast,
}: {
  visible: boolean;
  onDismiss: () => void;
  showToast: (type: "success" | "error" | "info" | "warning", msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [eventPattern, setEventPattern] = useState("");
  const [scheduleExpr, setScheduleExpr] = useState("");
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(true);
  const putRule = usePutEventRule();

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (!eventPattern.trim() && !scheduleExpr.trim()) {
      showToast("warning", "Either event pattern or schedule expression is required");
      return;
    }
    putRule.mutate(
      {
        name: name.trim(),
        eventPattern: eventPattern.trim() || undefined,
        scheduleExpression: scheduleExpr.trim() || undefined,
        description: description.trim() || undefined,
        state: enabled ? "ENABLED" : "DISABLED",
      },
      {
        onSuccess: () => {
          showToast("success", `Rule "${name}" created`);
          onDismiss();
          setName("");
          setEventPattern("");
          setScheduleExpr("");
          setDescription("");
        },
        onError: (e) => showToast("error", e.message),
      }
    );
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header="Create rule"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} loading={putRule.isPending} disabled={!name.trim()}>
              Create
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <Form>
        <SpaceBetween size="l">
          <FormField label="Rule name">
            <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="my-rule" />
          </FormField>
          <FormField label="Schedule expression" description="e.g. rate(5 minutes) or cron(0 12 * * ? *)">
            <Input value={scheduleExpr} onChange={({ detail }) => setScheduleExpr(detail.value)} placeholder="rate(5 minutes)" />
          </FormField>
          <FormField label="Event pattern" description='JSON, e.g. {"source": ["my.app"]}'>
            <Textarea value={eventPattern} onChange={({ detail }) => setEventPattern(detail.value)} rows={4} placeholder='{"source": ["my.app"]}' />
          </FormField>
          <FormField label="Description">
            <Input value={description} onChange={({ detail }) => setDescription(detail.value)} />
          </FormField>
          <FormField label="Enabled">
            <Toggle checked={enabled} onChange={({ detail }) => setEnabled(detail.checked)}>
              Enable rule on creation
            </Toggle>
          </FormField>
        </SpaceBetween>
      </Form>
    </Modal>
  );
}

function BusesTab({
  showToast,
  confirm,
}: {
  showToast: (type: "success" | "error" | "info" | "warning", msg: string) => void;
  confirm: (opts: { title: string; message: string; confirmText?: string; variant?: "primary" | "danger" }) => Promise<boolean>;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading } = useEventBuses();
  const deleteBus = useDeleteEventBus();
  const buses = data?.eventBuses || [];

  return (
    <Container
      header={
        <Header
          variant="h2"
          counter={`(${buses.length})`}
          actions={<Button variant="primary" onClick={() => setShowCreate(true)}>Create bus</Button>}
        >
          Event Buses
        </Header>
      }
    >
      <Table
        items={buses}
        loading={isLoading}
        columnDefinitions={[
          {
            id: "name",
            header: "Name",
            cell: (item: EventBus) => (
              <StatusIndicator type={item.Name === "default" ? "info" : "success"}>
                {item.Name}
              </StatusIndicator>
            ),
          },
          { id: "arn", header: "ARN", cell: (item: EventBus) => <Box fontSize="body-s">{item.Arn || "—"}</Box> },
          { id: "description", header: "Description", cell: (item: EventBus) => item.Description || "—" },
          {
            id: "actions",
            header: "",
            cell: (item: EventBus) =>
              item.Name !== "default" && (
                <Button
                  variant="icon"
                  iconName="remove"
                  ariaLabel="Delete bus"
                  onClick={async () => {
                    const ok = await confirm({
                      title: `Delete event bus "${item.Name}"?`,
                      message: "All rules on this bus will also be deleted.",
                      confirmText: "Delete",
                      variant: "danger",
                    });
                    if (ok) {
                      deleteBus.mutate(item.Name, {
                        onSuccess: () => showToast("success", "Bus deleted"),
                        onError: (e) => showToast("error", e.message),
                      });
                    }
                  }}
                />
              ),
          },
        ]}
        empty={<Box padding="s">No event buses</Box>}
      />

      {showCreate && (
        <CreateBusModal visible={showCreate} onDismiss={() => setShowCreate(false)} showToast={showToast} />
      )}
    </Container>
  );
}

function CreateBusModal({
  visible,
  onDismiss,
  showToast,
}: {
  visible: boolean;
  onDismiss: () => void;
  showToast: (type: "success" | "error" | "info" | "warning", msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createBus = useCreateEventBus();

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header="Create event bus"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() =>
                createBus.mutate(
                  { name: name.trim(), description: description.trim() || undefined },
                  {
                    onSuccess: () => {
                      showToast("success", `Bus "${name}" created`);
                      onDismiss();
                      setName("");
                      setDescription("");
                    },
                    onError: (e) => showToast("error", e.message),
                  }
                )
              }
              loading={createBus.isPending}
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
          <FormField label="Bus name">
            <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="my-bus" />
          </FormField>
          <FormField label="Description">
            <Input value={description} onChange={({ detail }) => setDescription(detail.value)} />
          </FormField>
        </SpaceBetween>
      </Form>
    </Modal>
  );
}

function SendEventModal({
  visible,
  onDismiss,
  showToast,
}: {
  visible: boolean;
  onDismiss: () => void;
  showToast: (type: "success" | "error" | "info" | "warning", msg: string) => void;
}) {
  const [source, setSource] = useState("");
  const [detailType, setDetailType] = useState("");
  const [detail, setDetail] = useState("{}");
  const putEvents = usePutEvents();

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header="Send event"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() =>
                putEvents.mutate(
                  [{ source: source.trim(), detailType: detailType.trim(), detail }],
                  {
                    onSuccess: (result: unknown) => {
                      const r = result as { failedCount?: number };
                      if (r.failedCount === 0) showToast("success", "Event sent");
                      else showToast("warning", `${r.failedCount} entries failed`);
                      onDismiss();
                      setSource("");
                      setDetailType("");
                      setDetail("{}");
                    },
                    onError: (e) => showToast("error", e.message),
                  }
                )
              }
              loading={putEvents.isPending}
              disabled={!source.trim() || !detailType.trim()}
            >
              Send
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <Form>
        <SpaceBetween size="l">
          <FormField label="Source">
            <Input value={source} onChange={({ detail }) => setSource(detail.value)} placeholder="my.app" />
          </FormField>
          <FormField label="Detail type">
            <Input value={detailType} onChange={({ detail }) => setDetailType(detail.value)} placeholder="Order Created" />
          </FormField>
          <FormField label="Detail (JSON)">
            <Textarea value={detail} onChange={({ detail }) => setDetail(detail.value)} rows={5} />
          </FormField>
        </SpaceBetween>
      </Form>
    </Modal>
  );
}

function ArchivesTab({
  showToast,
  confirm,
}: {
  showToast: (type: "success" | "error" | "info" | "warning", msg: string) => void;
  confirm: (opts: { title: string; message: string; confirmText?: string; variant?: "primary" | "danger" }) => Promise<boolean>;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading } = useEventArchives();
  const deleteArchive = useDeleteEventArchive();
  const archives = data?.archives || [];

  return (
    <Container
      header={
        <Header
          variant="h2"
          counter={`(${archives.length})`}
          actions={<Button variant="primary" onClick={() => setShowCreate(true)}>Create archive</Button>}
        >
          Archives
        </Header>
      }
    >
      <Table
        items={archives}
        loading={isLoading}
        columnDefinitions={[
          { id: "name", header: "Name", cell: (item: EventArchive) => item.ArchiveName },
          {
            id: "state",
            header: "State",
            cell: (item: EventArchive) => (
              <StatusIndicator type={item.State === "ENABLED" ? "success" : "stopped"}>
                {item.State || "—"}
              </StatusIndicator>
            ),
          },
          { id: "count", header: "Events", cell: (item: EventArchive) => item.EventCount?.toString() || "0" },
          { id: "source", header: "Source", cell: (item: EventArchive) => <Box fontSize="body-s">{item.EventSourceArn}</Box> },
          {
            id: "actions",
            header: "",
            cell: (item: EventArchive) => (
              <Button
                variant="icon"
                iconName="remove"
                ariaLabel="Delete archive"
                onClick={async () => {
                  const ok = await confirm({
                    title: `Delete archive "${item.ArchiveName}"?`,
                    message: "All archived events will be permanently deleted.",
                    confirmText: "Delete",
                    variant: "danger",
                  });
                  if (ok) {
                    deleteArchive.mutate(item.ArchiveName, {
                      onSuccess: () => showToast("success", "Archive deleted"),
                      onError: (e) => showToast("error", e.message),
                    });
                  }
                }}
              />
            ),
          },
        ]}
        empty={<Box padding="s">No archives</Box>}
      />

      {showCreate && (
        <CreateArchiveModal visible={showCreate} onDismiss={() => setShowCreate(false)} showToast={showToast} />
      )}
    </Container>
  );
}

function CreateArchiveModal({
  visible,
  onDismiss,
  showToast,
}: {
  visible: boolean;
  onDismiss: () => void;
  showToast: (type: "success" | "error" | "info" | "warning", msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [sourceArn, setSourceArn] = useState("");
  const [description, setDescription] = useState("");
  const createArchive = useCreateEventArchive();

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header="Create archive"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() =>
                createArchive.mutate(
                  { archiveName: name.trim(), eventSourceArn: sourceArn.trim(), description: description.trim() || undefined },
                  {
                    onSuccess: () => {
                      showToast("success", `Archive "${name}" created`);
                      onDismiss();
                      setName("");
                      setSourceArn("");
                      setDescription("");
                    },
                    onError: (e) => showToast("error", e.message),
                  }
                )
              }
              loading={createArchive.isPending}
              disabled={!name.trim() || !sourceArn.trim()}
            >
              Create
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <Form>
        <SpaceBetween size="l">
          <FormField label="Archive name">
            <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="my-archive" />
          </FormField>
          <FormField label="Event source ARN" description="The event bus ARN to archive from">
            <Input value={sourceArn} onChange={({ detail }) => setSourceArn(detail.value)} placeholder="arn:aws:events:us-east-1:000000000000:event-bus/default" />
          </FormField>
          <FormField label="Description">
            <Input value={description} onChange={({ detail }) => setDescription(detail.value)} />
          </FormField>
        </SpaceBetween>
      </Form>
    </Modal>
  );
}
