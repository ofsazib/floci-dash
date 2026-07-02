import { useState } from "react";
import {
  SpaceBetween,
  Box,
  Button,
  Header,
  Tabs,
  Container,
  Form,
  FormField,
  Input,
  Select,
  Alert,
  Modal,
  ColumnLayout,
  StatusIndicator,
  Badge,
} from "@cloudscape-design/components";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import { TableSkeleton } from "../../components/LoadingSkeleton";
import {
  usePipelines,
  useCreatePipeline,
  useDeletePipeline,
  usePipelineState,
  usePipelineExecutions,
  useStartPipelineExecution,
  useStopPipelineExecution,
  useRetryStageExecution,
  useWebhooks,
  useCreateWebhook,
  useDeleteWebhook,
  useActionTypes,
  useCreateCustomActionType,
} from "../../hooks/useCodePipeline";

export function CodePipelineDashboard() {
  const pipelinesQuery = usePipelines();
  const createPipeline = useCreatePipeline();
  const deletePipeline = useDeletePipeline();
  const startExecution = useStartPipelineExecution();
  const stopExecution = useStopPipelineExecution();
  const retryStage = useRetryStageExecution();
  const webhooksQuery = useWebhooks();
  const createWebhook = useCreateWebhook();
  const deleteWebhook = useDeleteWebhook();
  const actionTypesQuery = useActionTypes();
  const createActionType = useCreateCustomActionType();

  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [pipeName, setPipeName] = useState("");
  const [showStartExec, setShowStartExec] = useState(false);
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookName, setWebhookName] = useState("");
  const [showCreateActionType, setShowCreateActionType] = useState(false);
  const [actionTypeCat, setActionTypeCat] = useState("Build");
  const [actionTypeProv, setActionTypeProv] = useState("");

  const stateQuery = usePipelineState(selectedPipeline);
  const executionsQuery = usePipelineExecutions(selectedPipeline);

  const pipelines = (pipelinesQuery.data?.pipelines || []).map((p: any) => ({
    name: p.name,
    version: p.version || 0,
    created: p.created ? new Date(p.created).toLocaleDateString() : "—",
    updated: p.updated ? new Date(p.updated).toLocaleDateString() : "—",
  }));

  const executions = (executionsQuery.data?.executions || []).map((e: any) => ({
    id: e.pipelineExecutionId || "—",
    status: e.status || "—",
    startTime: e.startTime ? new Date(e.startTime).toLocaleString() : "—",
    lastUpdate: e.lastUpdateTime ? new Date(e.lastUpdateTime).toLocaleString() : "—",
  }));

  const webhooks = (webhooksQuery.data?.webhooks || []).map((w: any) => ({
    name: w.definition?.name || "—",
    url: w.url || "—",
    target: w.definition?.targetPipeline || "—",
    action: w.definition?.targetAction || "—",
  }));

  const actionTypes = (actionTypesQuery.data?.actionTypes || []).map((a: any) => ({
    owner: a.id?.owner || "—",
    provider: a.id?.provider || "—",
    category: a.id?.category || "—",
    version: a.id?.version || "—",
  }));

  if (pipelinesQuery.isLoading) return <TableSkeleton />;

  return (
    <SpaceBetween size="l">
      <Tabs
        tabs={[
          {
            id: "pipelines",
            label: `Pipelines (${pipelinesQuery.data?.total || 0})`,
            content: (
              <SpaceBetween size="l">
                <ResourceTable
                  resourceName="Pipeline"
                  headerTitle="CodePipeline Pipelines"
                  headerCounter={pipelinesQuery.data?.total}
                  items={pipelines}
                  columns={[
                    {
                      id: "name",
                      header: "Name",
                      cell: (i: any) => (
                        <Button variant="link" onClick={() => setSelectedPipeline(i.name === selectedPipeline ? null : i.name)}>
                          {i.name}
                        </Button>
                      ),
                      isRowHeader: true,
                    },
                    { id: "version", header: "Version", cell: (i: any) => i.version },
                    { id: "created", header: "Created", cell: (i: any) => i.created },
                    { id: "updated", header: "Updated", cell: (i: any) => i.updated },
                    {
                      id: "actions",
                      header: "",
                      cell: (i: any) => (
                        <DeleteButton
                          itemName={i.name}
                          resourceType="pipeline"
                          loading={deletePipeline.isPending && deletePipeline.variables === i.name}
                          onDelete={() => deletePipeline.mutateAsync(i.name)}
                        />
                      ),
                    },
                  ]}
                  loading={pipelinesQuery.isLoading}
                  emptyMessage="No pipelines found"
                  filterEnabled
                  filterPlaceholder="Find pipelines by name"
                  filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
                  onCreate={() => setShowCreate(true)}
                />

                {selectedPipeline && (
                  <Container
                    header={
                      <Header
                        variant="h3"
                        actions={
                          <Button onClick={() => setShowStartExec(true)}>Start Execution</Button>
                        }
                      >
                        Pipeline: {selectedPipeline}
                      </Header>
                    }
                  >
                    <ColumnLayout columns={3} variant="text-grid">
                      <div>
                        <Box variant="awsui-key-label">State</Box>
                        <Box>
                          {stateQuery.isLoading ? (
                            <StatusIndicator type="loading" />
                          ) : (
                            <StatusIndicator type="success">
                              {stateQuery.data?.state?.stageStates?.length || 0} stages
                            </StatusIndicator>
                          )}
                        </Box>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Executions</Box>
                        <Box>{executionsQuery.data?.total || 0}</Box>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Pipeline Version</Box>
                        <Box>{stateQuery.data?.state?.pipelineVersion || 0}</Box>
                      </div>
                    </ColumnLayout>

                    {selectedPipeline && stateQuery.data?.state?.stageStates && (
                      <Box margin={{ top: "m" }}>
                        <Box variant="awsui-key-label" margin={{ bottom: "s" }}>
                          Stage States
                        </Box>
                        <SpaceBetween size="xs">
                          {(stateQuery.data.state.stageStates).map((s: any) => (
                            <Box key={s.stageName} padding="s">
                              <StatusIndicator
                                type={s.actionStates?.[0]?.latestExecution?.status === "Succeeded" ? "success" : s.actionStates?.[0]?.latestExecution?.status === "Failed" ? "error" : "in-progress"}
                              >
                                {s.stageName}
                                {s.inboundTransitionState?.enabled === false && <Badge color="red">Disabled</Badge>}
                              </StatusIndicator>
                            </Box>
                          ))}
                        </SpaceBetween>
                      </Box>
                    )}

                    <Box margin={{ top: "l" }}>
                      <Header variant="h3" counter={executionsQuery.data?.total}>
                        Recent Executions
                      </Header>
                      <ResourceTable
                        resourceName="Execution"
                        items={executions}
                        columns={[
                          { id: "id", header: "Execution ID", cell: (i: any) => i.id, isRowHeader: true },
                          {
                            id: "status",
                            header: "Status",
                            cell: (i: any) => (
                              <StatusIndicator
                                type={i.status === "Succeeded" ? "success" : i.status === "Failed" ? "error" : "in-progress"}
                              >
                                {i.status}
                              </StatusIndicator>
                            ),
                          },
                          { id: "start", header: "Start Time", cell: (i: any) => i.startTime },
                          { id: "update", header: "Last Update", cell: (i: any) => i.lastUpdate },
                          {
                            id: "actions",
                            header: "Actions",
                            cell: (i: any) => (
                              <SpaceBetween direction="horizontal" size="xs">
                                {i.status === "InProgress" && (
                                  <Button
                                    iconName="close"
                                    variant="icon"
                                    ariaLabel="Stop execution"
                                    onClick={() => stopExecution.mutate({ name: selectedPipeline, executionId: i.id })}
                                  />
                                )}
                                {i.status === "Failed" && (
                                  <Button
                                    iconName="refresh"
                                    variant="icon"
                                    ariaLabel="Retry stage"
                                    onClick={() => retryStage.mutate({ name: selectedPipeline, executionId: i.id })}
                                  />
                                )}
                              </SpaceBetween>
                            ),
                          },
                        ]}
                        loading={executionsQuery.isLoading}
                        emptyMessage="No executions yet"
                        filterEnabled
                        filterPlaceholder="Find by execution ID"
                        filterFunction={(i: any, s: string) => (i.id || "").toLowerCase().includes(s.toLowerCase())}
                      />
                    </Box>
                  </Container>
                )}

                <Modal
                  visible={showCreate}
                  onDismiss={() => setShowCreate(false)}
                  header="Create pipeline"
                  footer={
                    <Box float="right">
                      <SpaceBetween direction="horizontal" size="xs">
                        <Button variant="link" onClick={() => setShowCreate(false)}>
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          loading={createPipeline.isPending}
                          disabled={!pipeName.trim()}
                          onClick={() => {
                            createPipeline.mutate(
                              {
                                pipeline: {
                                  name: pipeName.trim(),
                                  roleArn: "arn:aws:iam::000000000000:role/dummy",
                                  artifactStore: { type: "S3", location: "codepipeline-dummy" },
                                  stages: [
                                    {
                                      name: "Source",
                                      actions: [
                                        {
                                          name: "Source",
                                          actionTypeId: { category: "Source", owner: "AWS", provider: "S3", version: "1" },
                                          outputArtifacts: [{ name: "SourceOutput" }],
                                          configuration: { S3Bucket: "source-bucket", S3ObjectKey: "source.zip" },
                                          runOrder: 1,
                                        },
                                      ],
                                    },
                                    {
                                      name: "Build",
                                      actions: [
                                        {
                                          name: "Build",
                                          actionTypeId: { category: "Build", owner: "AWS", provider: "CodeBuild", version: "1" },
                                          inputArtifacts: [{ name: "SourceOutput" }],
                                          outputArtifacts: [{ name: "BuildOutput" }],
                                          configuration: { ProjectName: "my-project" },
                                          runOrder: 2,
                                        },
                                      ],
                                    },
                                  ],
                                },
                              },
                              { onSuccess: () => { setShowCreate(false); setPipeName(""); } }
                            );
                          }}
                        >
                          Create
                        </Button>
                      </SpaceBetween>
                    </Box>
                  }
                >
                  <Form>
                    {createPipeline.isError && (
                      <Alert type="error" dismissible>
                        {(createPipeline.error as Error)?.message || "Failed to create pipeline"}
                      </Alert>
                    )}
                    <FormField label="Pipeline name" description="A unique name for your pipeline.">
                      <Input value={pipeName} onChange={({ detail }) => setPipeName(detail.value)} placeholder="my-pipeline" />
                    </FormField>
                  </Form>
                </Modal>

                {selectedPipeline && (
                  <Modal
                    visible={showStartExec}
                    onDismiss={() => setShowStartExec(false)}
                    header={`Start execution: ${selectedPipeline}`}
                    footer={
                      <Box float="right">
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button variant="link" onClick={() => setShowStartExec(false)}>Cancel</Button>
                          <Button
                            variant="primary"
                            loading={startExecution.isPending}
                            onClick={() => {
                              startExecution.mutate(
                                { name: selectedPipeline },
                                { onSuccess: () => setShowStartExec(false) }
                              );
                            }}
                          >
                            Start
                          </Button>
                        </SpaceBetween>
                      </Box>
                    }
                  >
                    <Box>Start a new pipeline execution for <strong>{selectedPipeline}</strong>.</Box>
                  </Modal>
                )}
              </SpaceBetween>
            ),
          },
          {
            id: "webhooks",
            label: `Webhooks (${webhooksQuery.data?.total || 0})`,
            content: (
              <>
                <ResourceTable
                  resourceName="Webhook"
                  headerTitle="CodePipeline Webhooks"
                  headerCounter={webhooksQuery.data?.total}
                  items={webhooks}
                  columns={[
                    { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
                    { id: "url", header: "URL", cell: (i: any) => i.url },
                    { id: "target", header: "Target Pipeline", cell: (i: any) => i.target },
                    { id: "action", header: "Target Action", cell: (i: any) => i.action },
                    {
                      id: "actions",
                      header: "",
                      cell: (i: any) => (
                        <DeleteButton
                          itemName={i.name}
                          resourceType="webhook"
                          loading={deleteWebhook.isPending && deleteWebhook.variables === i.name}
                          onDelete={() => deleteWebhook.mutateAsync(i.name)}
                        />
                      ),
                    },
                  ]}
                  loading={webhooksQuery.isLoading}
                  emptyMessage="No webhooks found"
                  filterEnabled
                  filterPlaceholder="Find webhooks by name"
                  filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
                  onCreate={() => setShowCreateWebhook(true)}
                />
                <Modal
                  visible={showCreateWebhook}
                  onDismiss={() => setShowCreateWebhook(false)}
                  header="Create webhook"
                  footer={
                    <Box float="right">
                      <SpaceBetween direction="horizontal" size="xs">
                        <Button variant="link" onClick={() => setShowCreateWebhook(false)}>Cancel</Button>
                        <Button
                          variant="primary"
                          loading={createWebhook.isPending}
                          disabled={!webhookName.trim() || !webhookUrl.trim()}
                          onClick={() => {
                            createWebhook.mutate(
                              {
                                webhook: {
                                  name: webhookName.trim(),
                                  targetPipeline: selectedPipeline || "my-pipeline",
                                  targetAction: "Source",
                                  filters: [{ jsonPath: "$.ref", matchEquals: "refs/heads/main" }],
                                  authentication: "GITHUB_HMAC",
                                  authenticationConfiguration: { SecretToken: "dummy-token" },
                                },
                              },
                              { onSuccess: () => { setShowCreateWebhook(false); setWebhookName(""); setWebhookUrl(""); } }
                            );
                          }}
                        >
                          Create
                        </Button>
                      </SpaceBetween>
                    </Box>
                  }
                >
                  <Form>
                    {createWebhook.isError && (
                      <Alert type="error" dismissible>
                        {(createWebhook.error as Error)?.message || "Failed to create webhook"}
                      </Alert>
                    )}
                    <SpaceBetween size="m">
                      <FormField label="Webhook name">
                        <Input value={webhookName} onChange={({ detail }) => setWebhookName(detail.value)} placeholder="my-webhook" />
                      </FormField>
                      <FormField label="URL (optional)">
                        <Input value={webhookUrl} onChange={({ detail }) => setWebhookUrl(detail.value)} placeholder="https://example.com/webhook" />
                      </FormField>
                    </SpaceBetween>
                  </Form>
                </Modal>
              </>
            ),
          },
          {
            id: "action-types",
            label: `Action Types (${actionTypesQuery.data?.total || 0})`,
            content: (
              <>
                <ResourceTable
                  resourceName="Action Type"
                  headerTitle="Action Types"
                  headerCounter={actionTypesQuery.data?.total}
                  items={actionTypes}
                  columns={[
                    { id: "category", header: "Category", cell: (i: any) => i.category },
                    { id: "owner", header: "Owner", cell: (i: any) => i.owner },
                    { id: "provider", header: "Provider", cell: (i: any) => i.provider, isRowHeader: true },
                    { id: "version", header: "Version", cell: (i: any) => i.version },
                  ]}
                  loading={actionTypesQuery.isLoading}
                  emptyMessage="No action types found"
                  filterEnabled
                  filterPlaceholder="Find action types by provider"
                  filterFunction={(i: any, s: string) => i.provider.toLowerCase().includes(s.toLowerCase())}
                  onCreate={() => setShowCreateActionType(true)}
                />
                <Modal
                  visible={showCreateActionType}
                  onDismiss={() => setShowCreateActionType(false)}
                  header="Create custom action type"
                  footer={
                    <Box float="right">
                      <SpaceBetween direction="horizontal" size="xs">
                        <Button variant="link" onClick={() => setShowCreateActionType(false)}>Cancel</Button>
                        <Button
                          variant="primary"
                          loading={createActionType.isPending}
                          disabled={!actionTypeProv.trim()}
                          onClick={() => {
                            createActionType.mutate(
                              {
                                actionType: {
                                  category: actionTypeCat,
                                  provider: actionTypeProv.trim(),
                                  version: "1",
                                },
                              },
                              { onSuccess: () => { setShowCreateActionType(false); setActionTypeProv(""); } }
                            );
                          }}
                        >
                          Create
                        </Button>
                      </SpaceBetween>
                    </Box>
                  }
                >
                  <Form>
                    {createActionType.isError && (
                      <Alert type="error" dismissible>
                        {(createActionType.error as Error)?.message || "Failed to create action type"}
                      </Alert>
                    )}
                    <SpaceBetween size="m">
                      <FormField label="Category">
                        <Select
                          selectedOption={{ label: actionTypeCat, value: actionTypeCat }}
                          onChange={({ detail }) => setActionTypeCat(detail.selectedOption.value || "Build")}
                          options={[
                            { label: "Source", value: "Source" },
                            { label: "Build", value: "Build" },
                            { label: "Test", value: "Test" },
                            { label: "Deploy", value: "Deploy" },
                            { label: "Approval", value: "Approval" },
                            { label: "Invoke", value: "Invoke" },
                          ]}
                        />
                      </FormField>
                      <FormField label="Provider name">
                        <Input value={actionTypeProv} onChange={({ detail }) => setActionTypeProv(detail.value)} placeholder="MyCustomProvider" />
                      </FormField>
                    </SpaceBetween>
                  </Form>
                </Modal>
              </>
            ),
          },
        ]}
      />
    </SpaceBetween>
  );
}
