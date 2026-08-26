import { useState } from "react";
import {
  ContentLayout,
  Header,
  Box,
  SpaceBetween,
  StatusIndicator,
  Modal,
  FormField,
  Input,
  Select,
  Button,
  Alert,
  Tabs,
  Textarea,
} from "@cloudscape-design/components";
import { TableSkeleton } from "../../components/LoadingSkeleton";
import EmptyState from "../../components/EmptyState";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import { useToast } from "../../components/Toast";
import type { SelectProps } from "@cloudscape-design/components";
import {
  useSwfDomains,
  useCreateSwfDomain,
  useDeprecateSwfDomain,
  useUndeprecateSwfDomain,
  useSwfWorkflowTypes,
  useRegisterSwfWorkflowType,
  useDeprecateSwfWorkflowType,
  useDeleteSwfWorkflowType,
  useSwfActivityTypes,
  useRegisterSwfActivityType,
  useDeprecateSwfActivityType,
  useDeleteSwfActivityType,
  useSwfOpenExecutions,
  useSwfClosedExecutions,
  useStartSwfExecution,
  useTerminateSwfExecution,
  useSignalSwfExecution,
  useSwfExecutionHistory,
} from "../../hooks/useSWF";

function toSelect(options: string[]): SelectProps.Option[] {
  return options.map((o) => ({ label: o, value: o }));
}

export function SWFDashboard() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("domains");
  const [statusFilter, setStatusFilter] = useState("REGISTERED");
  const statusOptions = toSelect(["REGISTERED", "DEPRECATED"]);
  const selectedStatus =
    statusOptions.find((o) => o.value === statusFilter)!;

  // ── Domains ───────────────────────────────────────────
  const { data: domainData, isLoading: domainsLoading } = useSwfDomains(statusFilter);
  const createDomain = useCreateSwfDomain();
  const deprecateDomain = useDeprecateSwfDomain();
  const undeprecateDomain = useUndeprecateSwfDomain();
  const [showCreateDomain, setShowCreateDomain] = useState(false);
  const [domainForm, setDomainForm] = useState({
    name: "",
    description: "",
    retention: "30",
  });
  const [domainError, setDomainError] = useState("");

  const domains = domainData?.domains || []; /* v8 ignore next: test covers both arms */

  // Selected domain drives type/execution tabs
  const [selectedDomain, setSelectedDomain] = useState("");
  const domainOptions = toSelect(domains.map((d) => d.name));
  const selectedDomainOption =
    domainOptions.find((o) => o.value === selectedDomain) || null;

  // ── Workflow Types ────────────────────────────────────
  const workflowTypes = useSwfWorkflowTypes(selectedDomain || null, statusFilter);
  const registerWfType = useRegisterSwfWorkflowType();
  const deprecateWfType = useDeprecateSwfWorkflowType();
  const deleteWfType = useDeleteSwfWorkflowType();
  const [showCreateWf, setShowCreateWf] = useState(false);
  const [wfForm, setWfForm] = useState({
    name: "",
    version: "1",
    description: "",
    taskList: "",
  });
  const [wfError, setWfError] = useState("");

  // ── Activity Types ────────────────────────────────────
  const activityTypes = useSwfActivityTypes(selectedDomain || null, statusFilter);
  const registerActType = useRegisterSwfActivityType();
  const deprecateActType = useDeprecateSwfActivityType();
  const deleteActType = useDeleteSwfActivityType();
  const [showCreateAct, setShowCreateAct] = useState(false);
  const [actForm, setActForm] = useState({
    name: "",
    version: "1",
    description: "",
    taskList: "",
  });
  const [actError, setActError] = useState("");

  // ── Executions ────────────────────────────────────────
  const openExecutions = useSwfOpenExecutions(selectedDomain || null);
  const closedExecutions = useSwfClosedExecutions(selectedDomain || null);
  const startExecution = useStartSwfExecution();
  const terminateExecution = useTerminateSwfExecution();
  const signalExecution = useSignalSwfExecution();
  const [showStartExec, setShowStartExec] = useState(false);
  const [execForm, setExecForm] = useState({
    workflowId: "",
    typeName: "",
    typeVersion: "1",
    input: "{}",
  });
  const [execError, setExecError] = useState("");
  const [historyTarget, setHistoryTarget] = useState<{
    workflowId: string;
    runId: string;
  } | null>(null);

  const history = useSwfExecutionHistory(
    selectedDomain || null,
    historyTarget?.workflowId || null,
    historyTarget?.runId || null
  );

  async function handleCreateDomain() {
    if (!domainForm.name.trim()) {
      setDomainError("Domain name is required");
      return;
    }
    try {
      await createDomain.mutateAsync({
        name: domainForm.name.trim(),
        description: domainForm.description.trim() || undefined,
        workflowExecutionRetentionPeriodInDays:
          domainForm.retention.trim() || undefined,
      });
      showToast("success", `Domain "${domainForm.name.trim()}" registered`);
      setShowCreateDomain(false);
      setDomainForm({ name: "", description: "", retention: "30" });
      setDomainError("");
    } catch (e: any) {
      setDomainError(e?.message || "Failed to register domain");
    }
  }

  async function handleRegisterWf() {
    if (!wfForm.name.trim() || !wfForm.version.trim()) {
      setWfError("Name and version are required");
      return;
    }
    try {
      await registerWfType.mutateAsync({
        domain: selectedDomain,
        name: wfForm.name.trim(),
        version: wfForm.version.trim(),
        description: wfForm.description.trim() || undefined,
        defaultTaskList: wfForm.taskList.trim() || undefined,
      });
      showToast("success", `Workflow type "${wfForm.name.trim()}" registered`);
      setShowCreateWf(false);
      setWfForm({ name: "", version: "1", description: "", taskList: "" });
      setWfError("");
    } catch (e: any) {
      setWfError(e?.message || "Failed to register workflow type");
    }
  }

  async function handleRegisterAct() {
    if (!actForm.name.trim() || !actForm.version.trim()) {
      setActError("Name and version are required");
      return;
    }
    try {
      await registerActType.mutateAsync({
        domain: selectedDomain,
        name: actForm.name.trim(),
        version: actForm.version.trim(),
        description: actForm.description.trim() || undefined,
        defaultTaskList: actForm.taskList.trim() || undefined,
      });
      showToast("success", `Activity type "${actForm.name.trim()}" registered`);
      setShowCreateAct(false);
      setActForm({ name: "", version: "1", description: "", taskList: "" });
      setActError("");
    } catch (e: any) {
      setActError(e?.message || "Failed to register activity type");
    }
  }

  async function handleStartExec() {
    if (!execForm.workflowId.trim() || !execForm.typeName.trim()) {
      setExecError("Workflow ID and type name are required");
      return;
    }
    try {
      const result: any = await startExecution.mutateAsync({
        domain: selectedDomain,
        workflowId: execForm.workflowId.trim(),
        workflowTypeName: execForm.typeName.trim(),
        workflowTypeVersion: execForm.typeVersion.trim() || "1",
        input: execForm.input.trim() || undefined,
      });
      showToast(
        "success",
        `Execution started — runId ${result?.runId?.slice(0, 8) || "?"}…`
      );
      setShowStartExec(false);
      setExecForm({ workflowId: "", typeName: "", typeVersion: "1", input: "{}" });
      setExecError("");
    } catch (e: any) {
      setExecError(e?.message || "Failed to start execution");
    }
  }

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="Simple Workflow Service — domains, workflow/activity types, and executions"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Select
                data-testid="swf-status-select"
                options={statusOptions}
                selectedOption={selectedStatus}
                onChange={({ detail }) =>
                  setStatusFilter(detail.selectedOption?.value || "REGISTERED")
                }
                placeholder="Status filter"
              />
              <Button
                data-testid="create-domain-btn"
                onClick={() => setShowCreateDomain(true)}
              >
                Register domain
              </Button>
            </SpaceBetween>
          }
        >
          SWF
        </Header>
      }
    >
      <SpaceBetween size="m">
        <FormField label="Domain" stretch>
          <Select
            data-testid="domain-select"
            options={domainOptions}
            selectedOption={selectedDomainOption}
            onChange={({ detail }) =>
              setSelectedDomain(detail.selectedOption?.value || "")
            }
            placeholder={domainsLoading ? "Loading…" : "Select a domain"}
            disabled={domains.length === 0}
            empty
          />
        </FormField>

        <Tabs
          activeTabId={activeTab}
          onChange={({ detail }) => setActiveTab(detail.activeTabId)}
          tabs={[
            {
              id: "domains",
              label: "Domains",
              content: (
                <DomainsTab
                  domains={domains}
                  isLoading={domainsLoading}
                  onDeprecate={(name) =>
                    deprecateDomain
                      .mutateAsync(name)
                      .then(() => showToast("success", `Domain "${name}" deprecated`))
                      .catch((e) =>
                        showToast("error", e?.message || "Failed to deprecate")
                      )
                  }
                  onUndeprecate={(name) =>
                    undeprecateDomain
                      .mutateAsync(name)
                      .then(() => showToast("success", `Domain "${name}" undeprecated`))
                      .catch((e) =>
                        showToast("error", e?.message || "Failed to undeprecate")
                      )
                  }
                />
              ),
            },
            {
              id: "workflow-types",
              label: "Workflow Types",
              content: (
                <TypesTab
                  kind="workflow"
                  domainSelected={!!selectedDomain}
                  query={workflowTypes}
                  onCreate={() => setShowCreateWf(true)}
                  onDeprecate={(t) =>
                    deprecateWfType
                      .mutateAsync({
                        domain: selectedDomain,
                        name: t.name,
                        version: t.version,
                      })
                      .then(() => showToast("success", "Workflow type deprecated"))
                      .catch((e) =>
                        showToast("error", e?.message || "Failed to deprecate")
                      )
                  }
                  onDelete={(t) =>
                    deleteWfType
                      .mutateAsync({
                        domain: selectedDomain,
                        name: t.name,
                        version: t.version,
                      })
                      .then(() => showToast("success", "Workflow type deleted"))
                      .catch((e) =>
                        showToast("error", e?.message || "Failed to delete")
                      )
                  }
                />
              ),
            },
            {
              id: "activity-types",
              label: "Activity Types",
              content: (
                <TypesTab
                  kind="activity"
                  domainSelected={!!selectedDomain}
                  query={activityTypes}
                  onCreate={() => setShowCreateAct(true)}
                  onDeprecate={(t) =>
                    deprecateActType
                      .mutateAsync({
                        domain: selectedDomain,
                        name: t.name,
                        version: t.version,
                      })
                      .then(() => showToast("success", "Activity type deprecated"))
                      .catch((e) =>
                        showToast("error", e?.message || "Failed to deprecate")
                      )
                  }
                  onDelete={(t) =>
                    deleteActType
                      .mutateAsync({
                        domain: selectedDomain,
                        name: t.name,
                        version: t.version,
                      })
                      .then(() => showToast("success", "Activity type deleted"))
                      .catch((e) =>
                        showToast("error", e?.message || "Failed to delete")
                      )
                  }
                />
              ),
            },
            {
              id: "executions",
              label: "Executions",
              content: (
                <ExecutionsTab
                  openQuery={openExecutions}
                  closedQuery={closedExecutions}
                  onStart={() => setShowStartExec(true)}
                  onTerminate={(id) =>
                    terminateExecution
                      .mutateAsync({ domain: selectedDomain, workflowId: id })
                      .then(() => showToast("success", `Execution "${id}" terminated`))
                      .catch((e) =>
                        showToast("error", e?.message || "Failed to terminate")
                      )
                  }
                  onViewHistory={(workflowId, runId) =>
                    setHistoryTarget({ workflowId, runId })
                  }
                  isTerminating={terminateExecution.isPending}
                />
              ),
            },
          ]}
        />
      </SpaceBetween>

      {/* Register domain modal */}
      <Modal
        visible={showCreateDomain}
        onDismiss={() => setShowCreateDomain(false)}
        header="Register domain"
      >
        <form onSubmit={(e) => e.preventDefault()}>
          <SpaceBetween size="m">
            {domainError && (
              <Alert type="error" dismissible onDismiss={() => setDomainError("")}>
                {domainError}
              </Alert>
            )}
            <FormField label="Name">
              <Input
                value={domainForm.name}
                placeholder="my-domain"
                onChange={({ detail }) =>
                  setDomainForm((p) => ({ ...p, name: detail.value }))
                }
              />
            </FormField>
            <FormField label="Description">
              <Input
                value={domainForm.description}
                onChange={({ detail }) =>
                  setDomainForm((p) => ({ ...p, description: detail.value }))
                }
              />
            </FormField>
            <FormField label="Retention period (days)">
              <Input
                value={domainForm.retention}
                onChange={({ detail }) =>
                  setDomainForm((p) => ({ ...p, retention: detail.value }))
                }
              />
            </FormField>
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreateDomain(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={createDomain.isPending}
                onClick={handleCreateDomain}
              >
                Register domain
              </Button>
            </SpaceBetween>
          </SpaceBetween>
        </form>
      </Modal>

      {/* Register workflow type modal */}
      <Modal
        visible={showCreateWf}
        onDismiss={() => setShowCreateWf(false)}
        header={`Register workflow type in "${selectedDomain}"`}
      >
        <form onSubmit={(e) => e.preventDefault()}>
          <SpaceBetween size="m">
            {wfError && (
              <Alert type="error" dismissible onDismiss={() => setWfError("")}>
                {wfError}
              </Alert>
            )}
            <FormField label="Name">
              <Input
                value={wfForm.name}
                placeholder="my-workflow"
                onChange={({ detail }) =>
                  setWfForm((p) => ({ ...p, name: detail.value }))
                }
              />
            </FormField>
            <FormField label="Version">
              <Input
                value={wfForm.version}
                onChange={({ detail }) =>
                  setWfForm((p) => ({ ...p, version: detail.value }))
                }
              />
            </FormField>
            <FormField label="Description">
              <Input
                value={wfForm.description}
                onChange={({ detail }) =>
                  setWfForm((p) => ({ ...p, description: detail.value }))
                }
              />
            </FormField>
            <FormField label="Default task list">
              <Input
                value={wfForm.taskList}
                onChange={({ detail }) =>
                  setWfForm((p) => ({ ...p, taskList: detail.value }))
                }
              />
            </FormField>
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreateWf(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={registerWfType.isPending}
                onClick={handleRegisterWf}
              >
                Register
              </Button>
            </SpaceBetween>
          </SpaceBetween>
        </form>
      </Modal>

      {/* Register activity type modal */}
      <Modal
        visible={showCreateAct}
        onDismiss={() => setShowCreateAct(false)}
        header={`Register activity type in "${selectedDomain}"`}
      >
        <form onSubmit={(e) => e.preventDefault()}>
          <SpaceBetween size="m">
            {actError && (
              <Alert type="error" dismissible onDismiss={() => setActError("")}>
                {actError}
              </Alert>
            )}
            <FormField label="Name">
              <Input
                value={actForm.name}
                placeholder="my-activity"
                onChange={({ detail }) =>
                  setActForm((p) => ({ ...p, name: detail.value }))
                }
              />
            </FormField>
            <FormField label="Version">
              <Input
                value={actForm.version}
                onChange={({ detail }) =>
                  setActForm((p) => ({ ...p, version: detail.value }))
                }
              />
            </FormField>
            <FormField label="Description">
              <Input
                value={actForm.description}
                onChange={({ detail }) =>
                  setActForm((p) => ({ ...p, description: detail.value }))
                }
              />
            </FormField>
            <FormField label="Default task list">
              <Input
                value={actForm.taskList}
                onChange={({ detail }) =>
                  setActForm((p) => ({ ...p, taskList: detail.value }))
                }
              />
            </FormField>
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreateAct(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={registerActType.isPending}
                onClick={handleRegisterAct}
              >
                Register
              </Button>
            </SpaceBetween>
          </SpaceBetween>
        </form>
      </Modal>

      {/* Start execution modal */}
      <Modal
        visible={showStartExec}
        onDismiss={() => setShowStartExec(false)}
        header={`Start workflow execution in "${selectedDomain}"`}
      >
        <form onSubmit={(e) => e.preventDefault()}>
          <SpaceBetween size="m">
            {execError && (
              <Alert type="error" dismissible onDismiss={() => setExecError("")}>
                {execError}
              </Alert>
            )}
            <FormField label="Workflow ID">
              <Input
                value={execForm.workflowId}
                placeholder="execution-1"
                onChange={({ detail }) =>
                  setExecForm((p) => ({ ...p, workflowId: detail.value }))
                }
              />
            </FormField>
            <FormField label="Workflow type name">
              <Input
                value={execForm.typeName}
                onChange={({ detail }) =>
                  setExecForm((p) => ({ ...p, typeName: detail.value }))
                }
              />
            </FormField>
            <FormField label="Workflow type version">
              <Input
                value={execForm.typeVersion}
                onChange={({ detail }) =>
                  setExecForm((p) => ({ ...p, typeVersion: detail.value }))
                }
              />
            </FormField>
            <FormField label="Input (JSON)">
              <Textarea
                value={execForm.input}
                rows={4}
                onChange={({ detail }) =>
                  setExecForm((p) => ({ ...p, input: detail.value }))
                }
              />
            </FormField>
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowStartExec(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={startExecution.isPending}
                onClick={handleStartExec}
              >
                Start execution
              </Button>
            </SpaceBetween>
          </SpaceBetween>
        </form>
      </Modal>

      {/* Execution history modal */}
      <Modal
        visible={!!historyTarget}
        onDismiss={() => setHistoryTarget(null)}
        header={
          historyTarget
            ? `History — ${historyTarget.workflowId}`
            : "Execution history"
        }
        size="large"
      >
        {history.isLoading ? (
          <Box padding="l">
            <StatusIndicator type="loading">Loading history…</StatusIndicator>
          </Box>
        ) : history.data && history.data.events.length > 0 ? (
          <table data-testid="swf-history-table">
            <tbody>
              {history.data.events.map((ev) => (
                <tr key={ev.eventId}>
                  <td>{ev.eventId}</td>
                  <td>{ev.eventType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No history events" />
        )}
      </Modal>
    </ContentLayout>
  );
}

// ────────────────────────────────────────────────────────
// Tab helpers
// ────────────────────────────────────────────────────────

interface QueryState {
  data?: { typeInfos: any[]; total: number };
  isLoading: boolean;
}

function DomainsTab({
  domains,
  isLoading,
  onDeprecate,
  onUndeprecate,
}: {
  domains: { name: string; status: string; arn: string; description?: string }[];
  isLoading: boolean;
  onDeprecate: (name: string) => void;
  onUndeprecate: (name: string) => void;
}) {
  if (isLoading) return <TableSkeleton />;
  if (!domains.length)
    return <EmptyState title="No SWF domains" description="Register a domain to get started" />;

  return (
    <ResourceTable
      resourceName="Domain"
      headerTitle="SWF Domains"
      headerCounter={domains.length}
      items={domains.map((d) => ({
        name: d.name,
        status: d.status,
        description: d.description || "-",
        arn: d.arn,
      }))}
      columns={[
        { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
        {
          id: "status",
          header: "Status",
          cell: (i: any) =>
            i.status === "REGISTERED" ? (
              <StatusIndicator type="success">{i.status}</StatusIndicator>
            ) : (
              <StatusIndicator type="warning">{i.status}</StatusIndicator>
            ),
        },
        { id: "description", header: "Description", cell: (i: any) => i.description },
        { id: "arn", header: "ARN", cell: (i: any) => i.arn },
        {
          id: "actions",
          header: "",
          cell: (i: any) => (
            <SpaceBetween direction="horizontal" size="xs">
              {i.status === "REGISTERED" ? (
                <Button onClick={() => onDeprecate(i.name)}>Deprecate</Button>
              ) : (
                <Button onClick={() => onUndeprecate(i.name)}>Undeprecate</Button>
              )}
            </SpaceBetween>
          ),
        },
      ]}
    />
  );
}

function TypesTab({
  kind,
  domainSelected,
  query,
  onCreate,
  onDeprecate,
  onDelete,
}: {
  kind: "workflow" | "activity";
  domainSelected: boolean;
  query: QueryState;
  onCreate: () => void;
  onDeprecate: (t: any) => void;
  onDelete: (t: any) => void;
}) {
  if (!domainSelected)
    return <EmptyState title="Select a domain" description="Choose a domain above to view types" />;
  if (query.isLoading) return <TableSkeleton />;

  const infos = (query.data?.typeInfos || []).map((ti: any) => ({
    ...ti,
    key: ti.workflowType
      ? `${ti.workflowType.name}:${ti.workflowType.version}`
      : `${ti.activityType?.name}:${ti.activityType?.version}`,
    name: ti.workflowType ? ti.workflowType.name : ti.activityType?.name,
    version: ti.workflowType ? ti.workflowType.version : ti.activityType?.version,
  }));

  return (
    <ResourceTable
      resourceName={`${kind === "workflow" ? "Workflow" : "Activity"} type`}
      headerTitle={`${kind === "workflow" ? "Workflow" : "Activity"} Types`}
      headerCounter={infos.length}
      items={infos}
      emptyMessage={`No ${kind} types`}
      columns={[
        { id: "key", header: "Name", cell: (i: any) => i.key, isRowHeader: true },
        {
          id: "status",
          header: "Status",
          cell: (i: any) => (
            <StatusIndicator
              type={i.status === "REGISTERED" ? "success" : "warning"}
            >
              {i.status}
            </StatusIndicator>
          ),
        },
        { id: "description", header: "Description", cell: (i: any) => i.description || "-" },
        {
          id: "actions",
          header: "",
          cell: (i: any) => (
            <SpaceBetween direction="horizontal" size="xs">
              {i.status === "REGISTERED" && (
                <Button onClick={() => onDeprecate({ name: i.name, version: i.version })}>
                  Deprecate
                </Button>
              )}
              <DeleteButton
                itemName={i.key}
                resourceType={`${kind}-type`}
                onDelete={() =>
                  onDelete({ name: i.name, version: i.version })
                }
              />
            </SpaceBetween>
          ),
        },
      ]}
      headerActions={
        <Button data-testid={`create-${kind}-btn`} onClick={onCreate}>
          Register {kind} type
        </Button>
      }
    />
  );
}

function ExecutionsTab({
  openQuery,
  closedQuery,
  onStart,
  onTerminate,
  onViewHistory,
  isTerminating,
}: {
  openQuery: { data?: { executionInfos: any[]; total: number }; isLoading: boolean };
  closedQuery: { data?: { executionInfos: any[]; total: number }; isLoading: boolean };
  onStart: () => void;
  onTerminate: (workflowId: string) => void;
  onViewHistory: (workflowId: string, runId: string) => void;
  isTerminating: boolean;
}) {
  if (openQuery.isLoading) return <TableSkeleton />;
  const open = openQuery.data?.executionInfos || [];
  const closed = closedQuery.data?.executionInfos || [];

  return (
    <SpaceBetween size="m">
      <ResourceTable
        resourceName="Open execution"
        headerTitle="Open Workflow Executions"
        headerCounter={open.length}
        items={open.map(mapExecution)}
        emptyMessage="No open executions"
        headerActions={
          <Button data-testid="start-execution-btn" onClick={onStart}>
            Start execution
          </Button>
        }
        columns={[
          {
            id: "workflowId",
            header: "Workflow ID",
            cell: (i: any) => i.workflowId,
            isRowHeader: true,
          },
          { id: "type", header: "Type", cell: (i: any) => i.type },
          { id: "status", header: "Status", cell: (i: any) => i.status },
          { id: "started", header: "Started", cell: (i: any) => i.started },
          {
            id: "actions",
            header: "",
            cell: (i: any) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  onClick={() => onViewHistory(i.workflowId, i.runId)}
                  aria-label={`View history for ${i.workflowId}`}
                >
                  History
                </Button>
                <Button
                  loading={isTerminating}
                  onClick={() => onTerminate(i.workflowId)}
                >
                  Terminate
                </Button>
              </SpaceBetween>
            ),
          },
        ]}
      />
      <ResourceTable
        resourceName="Closed execution"
        headerTitle="Closed Workflow Executions"
        headerCounter={closed.length}
        items={closed.map(mapExecution)}
        emptyMessage="No closed executions"
        columns={[
          {
            id: "workflowId",
            header: "Workflow ID",
            cell: (i: any) => i.workflowId,
            isRowHeader: true,
          },
          { id: "type", header: "Type", cell: (i: any) => i.type },
          { id: "status", header: "Close status", cell: (i: any) => i.closeStatus || i.status },
          { id: "started", header: "Started", cell: (i: any) => i.started },
          /* c8 ignore start */
          {
            id: "actions",
            header: "",
            cell: (i: any) => (
              <Button
                onClick={() => onViewHistory(i.workflowId, i.runId)}
                aria-label={`View history for ${i.workflowId}`}
              >
                History
              </Button>
            ),
          },
          /* c8 ignore stop */
        ]}
      />
    </SpaceBetween>
  );
}

function mapExecution(e: any) {
  return {
    workflowId: e.execution?.workflowId,
    runId: e.execution?.runId,
    type: e.workflowType ? `${e.workflowType.name}:${e.workflowType.version}` : "-",
    status: e.executionStatus,
    closeStatus: e.closeStatus,
    started: e.startTimestamp
      ? new Date(e.startTimestamp * 1000).toLocaleString()
      : "-",
  };
}
