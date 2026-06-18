import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BreadcrumbGroup,
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
  Textarea,
  ColumnLayout,
  Container,
  Badge,
  Tabs,
  type TabsProps,
  Alert,
} from "@cloudscape-design/components";
import DeleteButton from "../components/DeleteButton";
import StatusBadge from "../components/StatusBadge";
import { useToast } from "../components/Toast";
import { useHealth } from "../hooks/useSystem";
import {
  useStacks,
  useStack,
  useStackTemplate,
  useCreateStack,
  useDeleteStack,
  useValidateTemplate,
  useExports,
} from "../hooks/useCloudFormation";

const STATUS_COLORS: Record<string, "green" | "red" | "blue" | "grey"> = {
  CREATE_COMPLETE: "green",
  UPDATE_COMPLETE: "green",
  DELETE_COMPLETE: "grey",
  CREATE_IN_PROGRESS: "blue",
  UPDATE_IN_PROGRESS: "blue",
  DELETE_IN_PROGRESS: "blue",
  CREATE_FAILED: "red",
  UPDATE_FAILED: "red",
  DELETE_FAILED: "red",
  ROLLBACK_COMPLETE: "red",
  ROLLBACK_IN_PROGRESS: "red",
  UPDATE_ROLLBACK_COMPLETE: "red",
  REVIEW_IN_PROGRESS: "blue",
};

function StacksTab() {
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedStack, setSelectedStack] = useState<string | null>(null);

  const stacksQuery = useStacks();
  const deleteStack = useDeleteStack();

  const stacks = stacksQuery.data?.stacks || [];

  return (
    <SpaceBetween size="l">
      <Table
        header={
          <Header
            variant="h2"
            counter={`(${stacks.length})`}
            actions={<Button onClick={() => setShowCreate(true)}>Create stack</Button>}
          >
            Stacks
          </Header>
        }
        columnDefinitions={[
          { id: "name", header: "Stack name", cell: (s: any) => s.name },
          {
            id: "status",
            header: "Status",
            cell: (s: any) => <Badge color={STATUS_COLORS[s.status] || "grey"}>{s.status}</Badge>,
          },
          { id: "desc", header: "Description", cell: (s: any) => s.description || "-" },
          { id: "created", header: "Created", cell: (s: any) => s.creationTime ? new Date(s.creationTime).toLocaleString() : "-" },
          { id: "updated", header: "Updated", cell: (s: any) => s.lastUpdatedTime ? new Date(s.lastUpdatedTime).toLocaleString() : "-" },
          {
            id: "actions",
            header: "",
            cell: (s: any) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setSelectedStack(s.name)}>View</Button>
                <DeleteButton
                  itemName={s.name}
                  resourceType="stack"
                  onDelete={async () => {
                    try {
                      await deleteStack.mutateAsync(s.name);
                      showToast("success", `Stack ${s.name} deletion started`);
                    } catch (e: any) { showToast("error", e.message); }
                  }}
                />
              </SpaceBetween>
            ),
          },
        ]}
        items={stacks}
        loading={stacksQuery.isLoading}
        trackBy={(s: any) => s.stackId || s.name}
        empty={<Box textAlign="center"><b>No stacks</b></Box>}
      />

      {showCreate && (
        <CreateStackModal
          onClose={() => setShowCreate(false)}
          onSubmit={async (data) => {
            try {
              const createMut = useCreateStack();
              await createMut.mutateAsync(data);
              showToast("success", `Stack ${data.name} creation started`);
              setShowCreate(false);
            } catch (e: any) { showToast("error", e.message); }
          }}
        />
      )}

      {selectedStack && (
        <StackDetailModal stackName={selectedStack} onClose={() => setSelectedStack(null)} />
      )}
    </SpaceBetween>
  );
}

function CreateStackModal({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const validateMut = useValidateTemplate();

  const defaultTemplate = `AWSTemplateFormatVersion: '2010-09-09'
Description: My stack
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: my-test-bucket`;

  return (
    <Modal visible={true} onDismiss={onClose} header="Create stack" size="large" footer={
      <Box float="right">
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => onSubmit({ name, templateBody: templateBody || defaultTemplate })}
          >
            Create
          </Button>
        </SpaceBetween>
      </Box>
    }>
      <Form>
        <SpaceBetween size="m">
          <FormField label="Stack name">
            <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="my-stack" />
          </FormField>
          <FormField
            label="Template (YAML or JSON)"
            secondaryControl={
              <Button onClick={async () => {
                try {
                  const res = await validateMut.mutateAsync({ templateBody: templateBody || defaultTemplate }) as any;
                  showToast("success", `Valid template — ${res.parameters?.length || 0} parameters`);
                } catch (e: any) { showToast("error", e.message); }
              }}>
                Validate
              </Button>
            }
          >
            <Textarea
              value={templateBody || defaultTemplate}
              onChange={({ detail }) => setTemplateBody(detail.value)}
              rows={12}
            />
          </FormField>
        </SpaceBetween>
      </Form>
    </Modal>
  );
}

function StackDetailModal({ stackName, onClose }: { stackName: string; onClose: () => void }) {
  const stackQuery = useStack(stackName);
  const templateQuery = useStackTemplate(stackName);
  const [activeTab, setActiveTab] = useState("overview");

  const s = stackQuery.data?.stack;
  const resources = stackQuery.data?.resources || [];
  const events = stackQuery.data?.events || [];

  const tabs: TabsProps.Tab[] = [
    {
      id: "overview",
      label: "Overview",
      content: s ? (
        <SpaceBetween size="l">
          <ColumnLayout columns={2} variant="text-grid">
            <div><b>Stack ID:</b> <span style={{ fontSize: 12 }}>{s.stackId}</span></div>
            <div><b>Status:</b> <Badge color={STATUS_COLORS[s.status] || "grey"}>{s.status}</Badge></div>
            <div><b>Created:</b> {s.creationTime ? new Date(s.creationTime).toLocaleString() : "-"}</div>
            <div><b>Updated:</b> {s.lastUpdatedTime ? new Date(s.lastUpdatedTime).toLocaleString() : "-"}</div>
          </ColumnLayout>

          {s.outputs?.length > 0 && (
            <Container header={<Header variant="h3">Outputs ({s.outputs.length})</Header>}>
              <ColumnLayout columns={2} variant="text-grid">
                {s.outputs.map((o: any) => (
                  <div key={o.key}><b>{o.key}:</b> {o.value}</div>
                ))}
              </ColumnLayout>
            </Container>
          )}

          {s.parameters?.length > 0 && (
            <Container header={<Header variant="h3">Parameters ({s.parameters.length})</Header>}>
              <ColumnLayout columns={2} variant="text-grid">
                {s.parameters.map((p: any) => (
                  <div key={p.key}><b>{p.key}:</b> {p.value}</div>
                ))}
              </ColumnLayout>
            </Container>
          )}

          <Container header={<Header variant="h3">Tags</Header>}>
            {s.tags?.length ? (
              <SpaceBetween size="xs">
                {s.tags.map((t: any) => <Badge key={t.key}>{t.key}: {t.value}</Badge>)}
              </SpaceBetween>
            ) : <Box color="text-body-secondary">No tags</Box>}
          </Container>
        </SpaceBetween>
      ) : <Box>Loading...</Box>,
    },
    {
      id: "resources",
      label: `Resources (${resources.length})`,
      content: (
        <Table
          columnDefinitions={[
            { id: "logical", header: "Logical ID", cell: (r: any) => r.logicalId },
            { id: "type", header: "Type", cell: (r: any) => <span style={{ fontSize: 12 }}>{r.type}</span> },
            { id: "physical", header: "Physical ID", cell: (r: any) => <span style={{ fontSize: 12 }}>{r.physicalId || "-"}</span> },
            { id: "status", header: "Status", cell: (r: any) => <Badge color={STATUS_COLORS[r.status] || "grey"}>{r.status}</Badge> },
            { id: "updated", header: "Updated", cell: (r: any) => r.lastUpdated ? new Date(r.lastUpdated).toLocaleString() : "-" },
          ]}
          items={resources}
          trackBy={(r: any) => r.logicalId}
          empty={<Box>No resources</Box>}
        />
      ),
    },
    {
      id: "events",
      label: `Events (${events.length})`,
      content: (
        <Table
          columnDefinitions={[
            { id: "time", header: "Time", cell: (e: any) => e.timestamp ? new Date(e.timestamp).toLocaleString() : "-" },
            { id: "logical", header: "Logical ID", cell: (e: any) => e.logicalId || "-" },
            { id: "type", header: "Type", cell: (e: any) => <span style={{ fontSize: 12 }}>{e.type || "-"}</span> },
            { id: "status", header: "Status", cell: (e: any) => <Badge color={STATUS_COLORS[e.status] || "grey"}>{e.status}</Badge> },
            { id: "reason", header: "Status reason", cell: (e: any) => <span style={{ fontSize: 12 }}>{e.statusReason || "-"}</span> },
          ]}
          items={events}
          trackBy={(e: any) => e.eventId}
          empty={<Box>No events</Box>}
        />
      ),
    },
    {
      id: "template",
      label: "Template",
      content: templateQuery.isLoading ? <Box>Loading...</Box> : (
        <pre className="fd-code-bg" style={{ fontSize: 12, overflow: "auto", maxHeight: 400, padding: 12, borderRadius: 4 }}>
          {templateQuery.data?.template || "No template"}
        </pre>
      ),
    },
  ];

  return (
    <Modal visible={true} onDismiss={onClose} header={`Stack: ${stackName}`} size="large" footer={
      <Button onClick={onClose}>Close</Button>
    }>
      {stackQuery.isLoading ? <Box>Loading...</Box> : s ? (
        <Tabs tabs={tabs} activeTabId={activeTab} onChange={({ detail }) => setActiveTab(detail.activeTabId)} />
      ) : <Box>Stack not found</Box>}
    </Modal>
  );
}

function ExportsTab() {
  const exportsQuery = useExports();
  const exportsList = exportsQuery.data?.exports || [];

  return (
    <Table
      header={<Header variant="h2" counter={`(${exportsList.length})`}>Exports</Header>}
      columnDefinitions={[
        { id: "name", header: "Export name", cell: (e: any) => e.name },
        { id: "value", header: "Value", cell: (e: any) => <span style={{ fontSize: 12 }}>{e.value}</span> },
        { id: "stack", header: "Exporting stack", cell: (e: any) => <span style={{ fontSize: 12 }}>{e.exportingStackId?.split("/")[1] || e.exportingStackId}</span> },
      ]}
      items={exportsList}
      loading={exportsQuery.isLoading}
      trackBy={(e: any) => e.name}
      empty={<Box textAlign="center"><b>No exports</b></Box>}
    />
  );
}

export default function CloudFormationPage() {
  const navigate = useNavigate();
  const { data: health } = useHealth();
  const [activeTab, setActiveTab] = useState("stacks");

  const cfStatus = health?.services?.cloudformation;
  const statusText = cfStatus === "running" ? "running" : cfStatus === "available" ? "available" : "connected";

  const tabs: TabsProps.Tab[] = [
    { id: "stacks", label: "Stacks", content: <StacksTab /> },
    { id: "exports", label: "Exports", content: <ExportsTab /> },
  ];

  return (
    <ContentLayout
      header={
        <SpaceBetween size="xs">
          <BreadcrumbGroup
            items={[
              { text: "Dashboard", href: "/#/" },
              { text: "CloudFormation", href: "/#/services/cloudformation" },
            ]}
            onFollow={(e) => { e.preventDefault(); navigate(e.detail.href.replace("/#", "")); }}
          />
          <Header variant="h1" description="Manage CloudFormation stacks, resources, and templates">
            CloudFormation <StatusBadge status={statusText as any} />
          </Header>
        </SpaceBetween>
      }
    >
      <Tabs tabs={tabs} activeTabId={activeTab} onChange={({ detail }) => setActiveTab(detail.activeTabId)} />
    </ContentLayout>
  );
}
