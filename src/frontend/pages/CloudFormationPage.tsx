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
  useStackResource,
  useCreateStack,
  useDeleteStack,
  useValidateTemplate,
  useExports,
  useChangeSets,
  useChangeSet,
  useCreateChangeSet,
  useExecuteChangeSet,
  useDeleteChangeSet,
  useStackSets,
  useStackSet,
  useCreateStackSet,
  useDeleteStackSet,
  useCreateStackInstances,
  useDeleteStackInstances,
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

function ResourceDetailContainer({ resource, onClose }: { resource: any; onClose: () => void }) {
  const r = resource;
  return (
    <Container
      header={
        <Header
          variant="h3"
          actions={<Button variant="icon" iconName="close" onClick={onClose} ariaLabel="Close resource detail" />}
        >
          Resource: {r.logicalId}
        </Header>
      }
    >
      <SpaceBetween size="m">
        <ColumnLayout columns={2} variant="text-grid">
          <div>
            <Box variant="small" color="text-body-secondary">Resource Type</Box>
            <Box><span style={{ fontSize: 12 }}>{r.resourceType}</span></Box>
          </div>
          <div>
            <Box variant="small" color="text-body-secondary">Status</Box>
            <Badge color={STATUS_COLORS[r.status] || "grey"}>{r.status}</Badge>
          </div>
          <div>
            <Box variant="small" color="text-body-secondary">Physical ID</Box>
            <Box><span style={{ fontSize: 12 }}>{r.physicalId || "-"}</span></Box>
          </div>
          <div>
            <Box variant="small" color="text-body-secondary">Last Updated</Box>
            <Box>{r.lastUpdated ? new Date(r.lastUpdated).toLocaleString() : "-"}</Box>
          </div>
        </ColumnLayout>
        {r.statusReason && (
          <div><Box variant="small" color="text-body-secondary">Status Reason</Box><Box>{r.statusReason}</Box></div>
        )}
        {r.description && (
          <div><Box variant="small" color="text-body-secondary">Description</Box><Box>{r.description}</Box></div>
        )}
        {r.driftInformation && (
          <div>
            <Box variant="small" color="text-body-secondary">Drift Status</Box>
            <Badge color={r.driftInformation.stackResourceDriftStatus === "IN_SYNC" ? "green" : "red"}>{r.driftInformation.stackResourceDriftStatus}</Badge>
          </div>
        )}
        {r.metadata && (
          <div>
            <Box variant="small" color="text-body-secondary">Metadata</Box>
            <pre className="fd-code-bg" style={{ fontSize: 11, padding: 8, borderRadius: 4, maxHeight: 200, overflow: "auto" }}>{typeof r.metadata === "string" ? r.metadata : JSON.stringify(r.metadata, null, 2)}</pre>
          </div>
        )}
      </SpaceBetween>
    </Container>
  );
}

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
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const resourceQuery = useStackResource(stackName, selectedResource);
  const [activeTab, setActiveTab] = useState("overview");

  function handleViewResource(logicalId: string) {
    setSelectedResource(logicalId);
    setActiveTab("overview");
  }

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

          {selectedResource && resourceQuery.data?.resource && (
            <ResourceDetailContainer
              resource={resourceQuery.data.resource}
              onClose={() => setSelectedResource(null)}
            />
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
            { id: "actions", header: "", cell: (r: any) => <Button onClick={() => handleViewResource(r.logicalId)}>View</Button> },
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

function ChangeSetsTab() {
  const { showToast } = useToast();
  const stacksQuery = useStacks();
  const [selectedStack, setSelectedStack] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [viewingChangeSet, setViewingChangeSet] = useState<string | null>(null);

  const stacks = stacksQuery.data?.stacks || [];

  const changeSetsQuery = useChangeSets(selectedStack);
  const createChangeSet = useCreateChangeSet();
  const executeChangeSet = useExecuteChangeSet();
  const deleteChangeSet = useDeleteChangeSet();

  const changeSets = changeSetsQuery.data?.changeSets || [];

  return (
    <SpaceBetween size="l">
      <Container header={<Header variant="h2">Change Sets</Header>}>
        <SpaceBetween size="m">
          <FormField label="Select a stack">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {stacks.map((s: any) => (
                <Button
                  key={s.name}
                  variant={selectedStack === s.name ? "primary" : "normal"}
                  onClick={() => { setSelectedStack(s.name); setViewingChangeSet(null); }}
                >
                  {s.name}
                </Button>
              ))}
              {stacks.length === 0 && !stacksQuery.isLoading && (
                <Box color="text-body-secondary">No stacks available. Create a stack first.</Box>
              )}
            </div>
          </FormField>

          {selectedStack && (
            <>
              <Box float="right">
                <Button variant="primary" onClick={() => setShowCreate(true)}>
                  Create change set
                </Button>
              </Box>

              <Table
                header={
                  <Header
                    variant="h3"
                    counter={`(${changeSets.length})`}
                  >
                    Change sets for {selectedStack}
                  </Header>
                }
                columnDefinitions={[
                  { id: "name", header: "Name", cell: (cs: any) => cs.name },
                  {
                    id: "status",
                    header: "Status",
                    cell: (cs: any) => (
                      <Badge color={cs.executionStatus === "AVAILABLE" ? "green" : cs.executionStatus === "EXECUTE_COMPLETE" ? "blue" : "grey"}>
                        {cs.executionStatus || cs.status || "-"}
                      </Badge>
                    ),
                  },
                  { id: "desc", header: "Description", cell: (cs: any) => cs.description || "-" },
                  {
                    id: "created",
                    header: "Created",
                    cell: (cs: any) =>
                      cs.creationTime ? new Date(cs.creationTime).toLocaleString() : "-",
                  },
                  {
                    id: "actions",
                    header: "",
                    cell: (cs: any) => (
                      <SpaceBetween direction="horizontal" size="xs">
                        <Button onClick={() => setViewingChangeSet(cs.name)}>View</Button>
                        {cs.executionStatus === "AVAILABLE" && (
                          <Button
                            variant="primary"
                            loading={executeChangeSet.isPending}
                            onClick={async () => {
                              try {
                                await executeChangeSet.mutateAsync({
                                  stackName: selectedStack,
                                  changeSetName: cs.name,
                                });
                                showToast("success", `Change set "${cs.name}" executed`);
                              } catch (e: any) {
                                showToast("error", e.message);
                              }
                            }}
                          >
                            Execute
                          </Button>
                        )}
                        <Button
                          variant="icon"
                          iconName="remove"
                          ariaLabel={`Delete ${cs.name}`}
                          loading={deleteChangeSet.isPending && deleteChangeSet.variables?.changeSetName === cs.name}
                          onClick={async () => {
                            try {
                              await deleteChangeSet.mutateAsync({
                                stackName: selectedStack,
                                changeSetName: cs.name,
                              });
                              showToast("success", `Change set "${cs.name}" deleted`);
                              if (viewingChangeSet === cs.name) setViewingChangeSet(null);
                            } catch (e: any) {
                              showToast("error", e.message);
                            }
                          }}
                        />
                      </SpaceBetween>
                    ),
                  },
                ]}
                items={changeSets}
                loading={changeSetsQuery.isLoading}
                trackBy={(cs: any) => cs.id || cs.name}
                empty={
                  <Box textAlign="center" padding={{ top: "xl" }}>
                    <b>No change sets</b>
                    <Box variant="p" color="text-body-secondary" padding={{ top: "s" }}>
                      Create a change set to preview stack changes before applying them.
                    </Box>
                  </Box>
                }
              />
            </>
          )}
        </SpaceBetween>
      </Container>

      {showCreate && selectedStack && (
        <CreateChangeSetModal
          stackName={selectedStack}
          onClose={() => setShowCreate(false)}
          onSubmit={async (data) => {
            try {
              await createChangeSet.mutateAsync(data);
              showToast("success", `Change set "${data.changeSetName}" created`);
              setShowCreate(false);
            } catch (e: any) {
              showToast("error", e.message);
            }
          }}
        />
      )}

      {viewingChangeSet && selectedStack && (
        <ChangeSetDetail
          stackName={selectedStack}
          changeSetName={viewingChangeSet}
          onClose={() => setViewingChangeSet(null)}
          onExecute={async () => {
            try {
              await executeChangeSet.mutateAsync({
                stackName: selectedStack,
                changeSetName: viewingChangeSet,
              });
              showToast("success", `Change set "${viewingChangeSet}" executed`);
              setViewingChangeSet(null);
            } catch (e: any) {
              showToast("error", e.message);
            }
          }}
        />
      )}
    </SpaceBetween>
  );
}

function CreateChangeSetModal({
  stackName,
  onClose,
  onSubmit,
}: {
  stackName: string;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const { showToast } = useToast();
  const [changeSetName, setChangeSetName] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [description, setDescription] = useState("");
  const validateMut = useValidateTemplate();

  const defaultTemplate = `AWSTemplateFormatVersion: '2010-09-09'
Description: Updated stack
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: my-updated-bucket`;

  return (
    <Modal
      visible={true}
      onDismiss={onClose}
      header={`Create change set for ${stackName}`}
      size="large"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!changeSetName.trim()}
              onClick={() =>
                onSubmit({
                  stackName,
                  changeSetName: changeSetName.trim(),
                  templateBody: templateBody || defaultTemplate,
                  description: description.trim() || undefined,
                })
              }
            >
              Create
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <Form>
        <SpaceBetween size="m">
          <FormField label="Change set name">
            <Input
              value={changeSetName}
              onChange={({ detail }) => setChangeSetName(detail.value)}
              placeholder="my-change-set"
            />
          </FormField>
          <FormField label="Description (optional)">
            <Input
              value={description}
              onChange={({ detail }) => setDescription(detail.value)}
              placeholder="What this change set does"
            />
          </FormField>
          <FormField
            label="Updated template (YAML or JSON)"
            secondaryControl={
              <Button
                onClick={async () => {
                  try {
                    const res = (await validateMut.mutateAsync({
                      templateBody: templateBody || defaultTemplate,
                    })) as any;
                    showToast("success", `Valid template — ${res.parameters?.length || 0} parameters`);
                  } catch (e: any) {
                    showToast("error", e.message);
                  }
                }}
              >
                Validate
              </Button>
            }
          >
            <Textarea
              value={templateBody || defaultTemplate}
              onChange={({ detail }) => setTemplateBody(detail.value)}
              rows={10}
            />
          </FormField>
        </SpaceBetween>
      </Form>
    </Modal>
  );
}

function ChangeSetDetail({
  stackName,
  changeSetName,
  onClose,
  onExecute,
}: {
  stackName: string;
  changeSetName: string;
  onClose: () => void;
  onExecute: () => void;
}) {
  const { data, isLoading, isError, error } = useChangeSet(stackName, changeSetName);
  const cs = data?.changeSet;
  const executeChangeSet = useExecuteChangeSet();

  if (isLoading) {
    return (
      <Container header={<Header variant="h3">Change Set: {changeSetName}</Header>}>
        <Box textAlign="center" padding={{ top: "xl", bottom: "xl" }}>
          Loading...
        </Box>
      </Container>
    );
  }

  if (isError || !cs) {
    return (
      <Container header={<Header variant="h3">Change Set: {changeSetName}</Header>}>
        <Alert type="error">{(error as any)?.message || "Failed to load change set"}</Alert>
        <Button onClick={onClose}>Close</Button>
      </Container>
    );
  }

  return (
    <Container
      header={
        <Header
          variant="h3"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              {cs.executionStatus === "AVAILABLE" && (
                <Button
                  variant="primary"
                  loading={executeChangeSet.isPending}
                  onClick={onExecute}
                >
                  Execute
                </Button>
              )}
              <Button onClick={onClose}>Close</Button>
            </SpaceBetween>
          }
        >
          Change Set: {changeSetName}
        </Header>
      }
    >
      <SpaceBetween size="l">
        <ColumnLayout columns={3} variant="text-grid">
          <div>
            <Box variant="small" color="text-body-secondary">Status</Box>
            <Badge
              color={
                cs.executionStatus === "AVAILABLE"
                  ? "green"
                  : cs.executionStatus === "EXECUTE_COMPLETE"
                  ? "blue"
                  : "grey"
              }
            >
              {cs.executionStatus || cs.status || "-"}
            </Badge>
          </div>
          <div>
            <Box variant="small" color="text-body-secondary">Created</Box>
            <Box>{cs.creationTime ? new Date(cs.creationTime).toLocaleString() : "-"}</Box>
          </div>
          <div>
            <Box variant="small" color="text-body-secondary">Description</Box>
            <Box>{cs.description || "-"}</Box>
          </div>
        </ColumnLayout>

        {cs.changes && cs.changes.length > 0 && (
          <Container header={<Header variant="h3">Changes ({cs.changes.length})</Header>}>
            <Table
              columnDefinitions={[
                {
                  id: "action",
                  header: "Action",
                  cell: (c: any) => {
                    const action = c.resourceChange?.action;
                    return (
                      <Badge
                        color={
                          action === "Add"
                            ? "green"
                            : action === "Remove"
                            ? "red"
                            : action === "Modify"
                            ? "blue"
                            : "grey"
                        }
                      >
                        {action || c.type || "-"}
                      </Badge>
                    );
                  },
                },
                {
                  id: "logicalId",
                  header: "Logical ID",
                  cell: (c: any) => c.resourceChange?.logicalResourceId || "-",
                },
                {
                  id: "type",
                  header: "Resource Type",
                  cell: (c: any) => (
                    <span style={{ fontSize: 12 }}>
                      {c.resourceChange?.resourceType || "-"}
                    </span>
                  ),
                },
                {
                  id: "replacement",
                  header: "Replacement",
                  cell: (c: any) => {
                    const repl = c.resourceChange?.replacement;
                    return repl ? (
                      <Badge color={repl === "True" ? "red" : "grey"}>{repl}</Badge>
                    ) : (
                      "-"
                    );
                  },
                },
                {
                  id: "scope",
                  header: "Scope",
                  cell: (c: any) =>
                    (c.resourceChange?.scope || []).length > 0
                      ? (c.resourceChange?.scope || []).join(", ")
                      : "-",
                },
              ]}
              items={cs.changes}
              trackBy={(c: any) => c.resourceChange?.logicalResourceId || c.type || "change"}
              empty={<Box>No changes to display</Box>}
            />
          </Container>
        )}

        {cs.parameters && cs.parameters.length > 0 && (
          <Container header={<Header variant="h3">Parameters ({cs.parameters.length})</Header>}>
            <ColumnLayout columns={2} variant="text-grid">
              {cs.parameters.map((p: any) => (
                <div key={p.key}>
                  <b>{p.key}:</b> {p.value || "(use previous)"}
                </div>
              ))}
            </ColumnLayout>
          </Container>
        )}
      </SpaceBetween>
    </Container>
  );
}

// ─── STACK SETS TAB ─────────────────────────────────────

function StackSetsTab() {
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedStackSet, setSelectedStackSet] = useState<string | null>(null);

  const stackSetsQuery = useStackSets();
  const createStackSet = useCreateStackSet();
  const deleteStackSet = useDeleteStackSet();

  const stackSets = stackSetsQuery.data?.stackSets || [];

  return (
    <SpaceBetween size="l">
      <Table
        header={
          <Header
            variant="h2"
            counter={`(${stackSets.length})`}
            actions={<Button onClick={() => setShowCreate(true)}>Create stack set</Button>}
          >
            Stack Sets
          </Header>
        }
        columnDefinitions={[
          { id: "name", header: "Name", cell: (ss: any) => ss.name },
          {
            id: "status",
            header: "Status",
            cell: (ss: any) => (
              <Badge color={ss.status === "ACTIVE" ? "green" : "grey"}>{ss.status}</Badge>
            ),
          },
          {
            id: "description",
            header: "Description",
            cell: (ss: any) => ss.description || "-",
          },
          {
            id: "actions",
            header: "",
            cell: (ss: any) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setSelectedStackSet(ss.name)}>View</Button>
                <DeleteButton
                  itemName={ss.name}
                  resourceType="stack set"
                  onDelete={async () => {
                    try {
                      await deleteStackSet.mutateAsync(ss.name);
                      showToast("success", `Stack set "${ss.name}" deleted`);
                    } catch (e: any) {
                      showToast("error", e.message);
                    }
                  }}
                />
              </SpaceBetween>
            ),
          },
        ]}
        items={stackSets}
        loading={stackSetsQuery.isLoading}
        trackBy={(ss: any) => ss.id || ss.name}
        empty={
          <Box textAlign="center" padding={{ top: "xl" }}>
            <b>No stack sets</b>
            <Box variant="p" color="text-body-secondary" padding={{ top: "s" }}>
              Create a stack set to deploy across multiple accounts and regions.
            </Box>
          </Box>
        }
      />

      {showCreate && (
        <CreateStackSetModal
          onClose={() => setShowCreate(false)}
          onSubmit={async (data) => {
            try {
              await createStackSet.mutateAsync(data);
              showToast("success", `Stack set "${data.name}" created`);
              setShowCreate(false);
            } catch (e: any) {
              showToast("error", e.message);
            }
          }}
        />
      )}

      {selectedStackSet && (
        <StackSetDetailModal
          stackSetName={selectedStackSet}
          onClose={() => setSelectedStackSet(null)}
        />
      )}
    </SpaceBetween>
  );
}

function CreateStackSetModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [name, setName] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [description, setDescription] = useState("");

  const defaultTemplate = `AWSTemplateFormatVersion: '2010-09-09'
Description: Stack set template
Resources:
  LogBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub \${AWS::AccountId}-logs`;

  return (
    <Modal
      visible={true}
      onDismiss={onClose}
      header="Create stack set"
      size="large"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!name.trim()}
              onClick={() =>
                onSubmit({
                  name: name.trim(),
                  templateBody: templateBody || defaultTemplate,
                  description: description.trim() || undefined,
                })
              }
            >
              Create
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <Form>
        <SpaceBetween size="m">
          <FormField label="Stack set name">
            <Input
              value={name}
              onChange={({ detail }) => setName(detail.value)}
              placeholder="my-stack-set"
            />
          </FormField>
          <FormField label="Description (optional)">
            <Input
              value={description}
              onChange={({ detail }) => setDescription(detail.value)}
              placeholder="Multi-account deployment"
            />
          </FormField>
          <FormField label="Template (YAML or JSON)">
            <Textarea
              value={templateBody || defaultTemplate}
              onChange={({ detail }) => setTemplateBody(detail.value)}
              rows={10}
            />
          </FormField>
        </SpaceBetween>
      </Form>
    </Modal>
  );
}

function StackSetDetailModal({
  stackSetName,
  onClose,
}: {
  stackSetName: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useStackSet(stackSetName);
  const createInstances = useCreateStackInstances();
  const deleteInstances = useDeleteStackInstances();
  const { showToast } = useToast();
  const [showAddInstances, setShowAddInstances] = useState(false);

  const ss = data?.stackSet;
  const instances = data?.instances || [];
  const operations = data?.operations || [];

  if (isLoading) {
    return (
      <Modal visible={true} onDismiss={onClose} header={`Stack Set: ${stackSetName}`}>
        <Box textAlign="center" padding={{ top: "xl", bottom: "xl" }}>Loading...</Box>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        visible={true}
        onDismiss={onClose}
        header={`Stack Set: ${stackSetName}`}
        size="large"
        footer={<Button onClick={onClose}>Close</Button>}
      >
        <SpaceBetween size="l">
          {ss && (
            <>
              <ColumnLayout columns={3} variant="text-grid">
                <div>
                  <Box variant="small" color="text-body-secondary">Status</Box>
                  <Badge color={ss.status === "ACTIVE" ? "green" : "grey"}>{ss.status}</Badge>
                </div>
                <div>
                  <Box variant="small" color="text-body-secondary">Permission Model</Box>
                  <Box>{ss.permissionModel || "SELF_MANAGED"}</Box>
                </div>
                <div>
                  <Box variant="small" color="text-body-secondary">Description</Box>
                  <Box>{ss.description || "-"}</Box>
                </div>
              </ColumnLayout>

              {ss.parameters?.length > 0 && (
                <Container header={<Header variant="h3">Parameters</Header>}>
                  <ColumnLayout columns={2} variant="text-grid">
                    {ss.parameters.map((p: any) => (
                      <div key={p.key}>
                        <b>{p.key}:</b> {p.value}
                      </div>
                    ))}
                  </ColumnLayout>
                </Container>
              )}
            </>
          )}

          <Container
            header={
              <Header
                variant="h3"
                counter={`(${instances.length})`}
                actions={
                  <Button variant="primary" onClick={() => setShowAddInstances(true)}>
                    Add instances
                  </Button>
                }
              >
                Instances
              </Header>
            }
          >
            {instances.length > 0 ? (
              <Table
                columnDefinitions={[
                  { id: "account", header: "Account", cell: (i: any) => i.account },
                  { id: "region", header: "Region", cell: (i: any) => i.region },
                  {
                    id: "status",
                    header: "Status",
                    cell: (i: any) => (
                      <Badge color={i.status === "CURRENT" ? "green" : "red"}>{i.status}</Badge>
                    ),
                  },
                  { id: "stackId", header: "Stack", cell: (i: any) => <span style={{ fontSize: 11 }}>{i.stackId || "-"}</span> },
                  {
                    id: "delete",
                    header: "",
                    cell: (i: any) => (
                      <Button
                        variant="icon"
                        iconName="remove"
                        ariaLabel={`Remove instance ${i.account}/${i.region}`}
                        loading={deleteInstances.isPending}
                        onClick={async () => {
                          try {
                            await deleteInstances.mutateAsync({
                              stackSetName,
                              accounts: [i.account],
                              regions: [i.region],
                            });
                            showToast("success", `Instance ${i.account}/${i.region} deleted`);
                          } catch (e: any) {
                            showToast("error", e.message);
                          }
                        }}
                      />
                    ),
                  },
                ]}
                items={instances}
                trackBy={(i: any) => `${i.account}:${i.region}`}
              />
            ) : (
              <Box color="text-body-secondary" padding={{ top: "m", bottom: "m" }}>
                No instances deployed. Add target accounts and regions.
              </Box>
            )}
          </Container>

          {operations.length > 0 && (
            <Container
              header={<Header variant="h3" counter={`(${operations.length})`}>Operations</Header>}
            >
              <Table
                columnDefinitions={[
                  { id: "id", header: "Operation ID", cell: (o: any) => <span style={{ fontSize: 11 }}>{o.id}</span> },
                  {
                    id: "action",
                    header: "Action",
                    cell: (o: any) => (
                      <Badge
                        color={o.action === "CREATE" ? "green" : o.action === "DELETE" ? "red" : "blue"}
                      >
                        {o.action}
                      </Badge>
                    ),
                  },
                  {
                    id: "status",
                    header: "Status",
                    cell: (o: any) => (
                      <Badge color={o.status === "SUCCEEDED" ? "green" : "red"}>{o.status}</Badge>
                    ),
                  },
                  {
                    id: "created",
                    header: "Created",
                    cell: (o: any) => o.creationTime ? new Date(o.creationTime).toLocaleString() : "-",
                  },
                ]}
                items={operations}
                trackBy={(o: any) => o.id}
              />
            </Container>
          )}
        </SpaceBetween>
      </Modal>

      {showAddInstances && (
        <AddInstancesModal
          stackSetName={stackSetName}
          onClose={() => setShowAddInstances(false)}
          onSubmit={async (data) => {
            try {
              await createInstances.mutateAsync({
                stackSetName,
                accounts: data.accounts,
                regions: data.regions,
              });
              showToast("success", "Instances deployment started");
              setShowAddInstances(false);
            } catch (e: any) {
              showToast("error", e.message);
            }
          }}
        />
      )}
    </>
  );
}

function AddInstancesModal({
  stackSetName,
  onClose,
  onSubmit,
}: {
  stackSetName: string;
  onClose: () => void;
  onSubmit: (data: { accounts: string[]; regions: string[] }) => void;
}) {
  const [accountsText, setAccountsText] = useState("");
  const [regionsText, setRegionsText] = useState("us-east-1");

  function parseList(text: string): string[] {
    return text
      .split(/[,\n\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return (
    <Modal
      visible={true}
      onDismiss={onClose}
      header={`Add instances to ${stackSetName}`}
      size="medium"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!accountsText.trim() || !regionsText.trim()}
              onClick={() =>
                onSubmit({
                  accounts: parseList(accountsText),
                  regions: parseList(regionsText),
                })
              }
            >
              Deploy
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <Form>
        <SpaceBetween size="m">
          <FormField
            label="Target accounts"
            description="Comma or newline separated account IDs"
          >
            <Textarea
              value={accountsText}
              onChange={({ detail }) => setAccountsText(detail.value)}
              placeholder="123456789012"
              rows={3}
            />
          </FormField>
          <FormField
            label="Target regions"
            description="Comma or newline separated region names"
          >
            <Textarea
              value={regionsText}
              onChange={({ detail }) => setRegionsText(detail.value)}
              placeholder="us-east-1"
              rows={3}
            />
          </FormField>
        </SpaceBetween>
      </Form>
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
    { id: "changesets", label: "Change Sets", content: <ChangeSetsTab /> },
    { id: "stacksets", label: "Stack Sets", content: <StackSetsTab /> },
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
