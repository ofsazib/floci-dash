import { useState } from "react";
import {
  Header,
  Box,
  SpaceBetween,
  StatusIndicator,
  Tabs,
  Modal,
  Form,
  FormField,
  Input,
  Textarea,
  Button,
  Toggle,
} from "@cloudscape-design/components";
import {
  useStacks,
  useStack,
  useStackTemplate,
  useCreateStack,
  useDeleteStack,
  useExports,
  useChangeSets,
  useStackSets,
  useStackSet,
  useStackSetOperation,
  useAutoDeploymentTargets,
  useUpdateTerminationProtection,
  useOrganizationsAccess,
  useActivateOrganizationsAccess,
  useTemplateSummary,
  useCreateChangeSet,
  useExecuteChangeSet,
  useDeleteChangeSet,
} from "../../hooks/useCloudFormation";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";

const statusType = (s: string) =>
  s === "CREATE_COMPLETE" || s === "UPDATE_COMPLETE" || s === "DELETE_COMPLETE"
    ? "success"
    : s?.includes("ROLLBACK") || s?.includes("DELETE_FAILED") || s?.includes("FAILED")
      ? "error"
      : s?.includes("IN_PROGRESS") || s?.includes("PENDING")
        ? "in-progress"
        : "pending";

export function CloudFormationDashboard() {
  const { data, isLoading } = useStacks();
  const { data: expData, isLoading: expLoading } = useExports();
  const { data: ssData, isLoading: ssLoading } = useStackSets();
  const createStack = useCreateStack();
  const deleteStack = useDeleteStack();
  const createChangeSet = useCreateChangeSet();
  const executeChangeSet = useExecuteChangeSet();
  const deleteChangeSet = useDeleteChangeSet();
  const updateTerminationProtection = useUpdateTerminationProtection();
  const templateSummary = useTemplateSummary();
  const orgAccess = useOrganizationsAccess();
  const activateOrgAccess = useActivateOrganizationsAccess();

  const [selected, setSelected] = useState<string | null>(null);
  const { data: detailData } = useStack(selected);
  const { data: templateData } = useStackTemplate(selected);
  const { data: csData } = useChangeSets(selected);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", templateBody: "", paramsJson: "{}" });
  const [showCsModal, setShowCsModal] = useState(false);
  const [csForm, setCsForm] = useState({ changeSetName: "", templateBody: "", paramsJson: "{}" });
  const [showTemplate, setShowTemplate] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const [selectedStackSet, setSelectedStackSet] = useState<string | null>(null);
  const { data: ssDetail } = useStackSet(selectedStackSet);
  const [selectedOp, setSelectedOp] = useState<string | null>(null);
  const { data: opDetail } = useStackSetOperation(selectedStackSet, selectedOp);
  const [showTargets, setShowTargets] = useState(false);
  const { data: targetsData } = useAutoDeploymentTargets(showTargets ? selectedStackSet : null);

  const stackTerminationProtected = (detailData as any)?.stack?.enableTerminationProtection === true;

  const handleTemplateSummary = async () => {
    if (!selected) return;
    try {
      const res = await templateSummary.mutateAsync({ stackName: selected });
      setSummary((res as any)?.summary || null);
      setShowSummary(true);
    } catch {}
  };

  const handleActivateOrgAccess = async () => {
    try { await activateOrgAccess.mutateAsync(); } catch {}
  };

  const stacks = (data as any)?.stacks || [];
  const exports = (expData as any)?.exports || [];
  const stackSets = (ssData as any)?.stackSets || [];
  const changeSets = (csData as any)?.changeSets || [];
  const resources = (detailData as any)?.resources || [];

  const handleCreate = async () => {
    if (!form.name || !form.templateBody) return;
    try {
      let params: any = {};
      try { params = JSON.parse(form.paramsJson || "{}"); } catch {}
      await createStack.mutateAsync({ stackName: form.name, templateBody: form.templateBody, parameters: params.Parameters });
      setShowCreate(false);
      setForm({ name: "", templateBody: "", paramsJson: "{}" });
    } catch {}
  };

  const handleCreateCs = async () => {
    if (!selected || !csForm.changeSetName) return;
    try {
      let params: any = {};
      try { params = JSON.parse(csForm.paramsJson || "{}"); } catch {}
      await createChangeSet.mutateAsync({
        stackName: selected,
        changeSetName: csForm.changeSetName,
        templateBody: csForm.templateBody || undefined,
        parameters: params.Parameters,
      });
      setShowCsModal(false);
      setCsForm({ changeSetName: "", templateBody: "", paramsJson: "{}" });
    } catch {}
  };

  return (
    <SpaceBetween size="l">
      <Tabs
        tabs={[
          {
            id: "stacks",
            label: "Stacks",
            content: (
              <ResourceTable
                resourceName="Stack"
                headerTitle="CloudFormation Stacks"
                headerCounter={(data as any)?.total}
                items={stacks.map((s: any) => ({
                  name: s.StackName || "",
                  status: s.StackStatus || "—",
                  description: s.Description || "—",
                  updated: s.LastUpdatedTime || s.CreationTime || "—",
                }))}
                loading={isLoading}
                emptyMessage="No CloudFormation stacks"
                columns={[
                  {
                    id: "name",
                    header: "Stack Name",
                    cell: (item: any) => (
                      <Button variant="link" onClick={() => setSelected(item.name === selected ? null : item.name)}>
                        {item.name}
                      </Button>
                    ),
                  },
                  {
                    id: "status",
                    header: "Status",
                    cell: (item: any) => (
                      <StatusIndicator type={statusType(item.status)}>{item.status}</StatusIndicator>
                    ),
                  },
                  { id: "description", header: "Description", cell: (item: any) => item.description },
                  { id: "updated", header: "Last Updated", cell: (item: any) => item.updated },
                  {
                    id: "actions",
                    header: "",
                    cell: (item: any) => (
                      <DeleteButton
                        itemName={item.name}
                        resourceType="stack"
                        onDelete={async () => { try { await deleteStack.mutateAsync(item.name); if (selected === item.name) setSelected(null); } catch {} }}
                        loading={deleteStack.isPending}
                      />
                    ),
                  },
                ]}
                filterEnabled
                filterPlaceholder="Find stacks"
                filterFunction={(i: any, s: string) => (i.name ?? "").toLowerCase().includes(s.toLowerCase())}
                onCreate={() => setShowCreate(true)}
              />
            ),
          },
          {
            id: "exports",
            label: "Exports",
            content: (
              <ResourceTable
                resourceName="Export"
                headerTitle="Stack Exports"
                headerCounter={(expData as any)?.total}
                items={exports.map((e: any) => ({
                  name: e.ExportingStackId || e.Name || "",
                  exportName: e.Name || "—",
                  value: e.Value || "—",
                  stackId: e.ExportingStackId || "—",
                }))}
                loading={expLoading}
                emptyMessage="No exports"
                columns={[
                  { id: "exportName", header: "Export Name", cell: (item: any) => item.exportName },
                  { id: "value", header: "Value", cell: (item: any) => item.value },
                ]}
              />
            ),
          },
          {
            id: "stacksets",
            label: "Stack Sets",
            content: (
              <SpaceBetween size="m">
                <SpaceBetween direction="horizontal" size="m">
                  <Box>
                    Organizations access:{" "}
                    <StatusIndicator
                      type={(orgAccess.data as any)?.status === "ENABLED" ? "success" : "pending"}
                    >
                      {(orgAccess.data as any)?.status || "DISABLED"}
                    </StatusIndicator>
                  </Box>
                  <Button
                    onClick={handleActivateOrgAccess}
                    disabled={activateOrgAccess.isPending}
                  >
                    Activate Organizations Access
                  </Button>
                </SpaceBetween>
                <ResourceTable
                  resourceName="Stack Set"
                  headerTitle="Stack Sets"
                  headerCounter={(ssData as any)?.total}
                  items={stackSets.map((ss: any) => ({
                    name: ss.StackSetName || "",
                    status: ss.Status || "—",
                    description: ss.Description || "—",
                  }))}
                  loading={ssLoading}
                  emptyMessage="No stack sets"
                  columns={[
                    {
                      id: "name",
                      header: "Name",
                      cell: (item: any) => (
                        <Button
                          variant="link"
                          onClick={() => {
                            setSelectedOp(null);
                            setShowTargets(false);
                            setSelectedStackSet(item.name === selectedStackSet ? null : item.name);
                          }}
                        >
                          {item.name}
                        </Button>
                      ),
                    },
                    { id: "status", header: "Status", cell: (item: any) => item.status },
                    { id: "description", header: "Description", cell: (item: any) => item.description },
                  ]}
                />
                {selectedStackSet && (
                  <SpaceBetween size="m">
                    <Header
                      variant="h3"
                      actions={
                        <Button onClick={() => setShowTargets(!showTargets)}>
                          {showTargets ? "Hide" : "Show"} Auto-Deployment Targets
                        </Button>
                      }
                    >
                      Stack Set — {selectedStackSet}
                    </Header>
                    {showTargets && (
                      <ResourceTable
                        resourceName="Target"
                        headerTitle="Auto-Deployment Targets"
                        headerCounter={(targetsData as any)?.total}
                        items={((targetsData as any)?.targets || []).map((t: any) => ({
                          account: t.account || t.organizationalUnitId || "",
                          regions: (t.regions || []).join(", "),
                        }))}
                        emptyMessage="No auto-deployment targets"
                        columns={[
                          { id: "account", header: "Account / OU", cell: (item: any) => item.account },
                          { id: "regions", header: "Regions", cell: (item: any) => item.regions || "—" },
                        ]}
                      />
                    )}
                    <ResourceTable
                      resourceName="Instance"
                      headerTitle="Stack Instances"
                      items={((ssDetail as any)?.instances || []).map((i: any) => ({
                        account: i.account || "",
                        region: i.region || "",
                        status: i.status || "—",
                      }))}
                      emptyMessage="No stack instances"
                      columns={[
                        { id: "account", header: "Account", cell: (item: any) => item.account },
                        { id: "region", header: "Region", cell: (item: any) => item.region },
                        { id: "status", header: "Status", cell: (item: any) => item.status },
                      ]}
                    />
                    <ResourceTable
                      resourceName="Operation"
                      headerTitle="Stack Set Operations"
                      items={((ssDetail as any)?.operations || []).map((o: any) => ({
                        id: o.id || "",
                        action: o.action || "—",
                        status: o.status || "—",
                      }))}
                      emptyMessage="No stack set operations"
                      columns={[
                        { id: "id", header: "Operation ID", cell: (item: any) => item.id },
                        { id: "action", header: "Action", cell: (item: any) => item.action },
                        {
                          id: "status",
                          header: "Status",
                          cell: (item: any) => (
                            <StatusIndicator type={statusType(item.status)}>{item.status}</StatusIndicator>
                          ),
                        },
                        {
                          id: "actions",
                          header: "",
                          cell: (item: any) => (
                            <Button
                              variant="link"
                              onClick={() => setSelectedOp(item.id === selectedOp ? null : item.id)}
                            >
                              View status
                            </Button>
                          ),
                        },
                      ]}
                    />
                    {selectedOp && (
                      <Box>
                        Operation {selectedOp}:{" "}
                        {(opDetail as any)?.operation ? (
                          <>
                            <StatusIndicator type={statusType((opDetail as any).operation.status)}>
                              {(opDetail as any).operation.status}
                            </StatusIndicator>
                            {(opDetail as any).operation.statusReason
                              ? ` — ${(opDetail as any).operation.statusReason}`
                              : ""}
                          </>
                        ) : (
                          "Loading…"
                        )}
                      </Box>
                    )}
                  </SpaceBetween>
                )}
              </SpaceBetween>
            ),
          },
        ]}
      />

      {/* Stack detail */}
      {selected && (
        <SpaceBetween size="m">
          <Header
            variant="h3"
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setShowTemplate(true)}>View Template</Button>
                <Button onClick={handleTemplateSummary} loading={templateSummary.isPending}>
                  Template Summary
                </Button>
                <Button onClick={() => setShowCsModal(true)}>Create Change Set</Button>
              </SpaceBetween>
            }
          >
            Stack — {selected}
          </Header>
          <Box>Status: {(detailData as any)?.stack?.stackStatus || "—"}</Box>
          <Toggle
            checked={stackTerminationProtected}
            onChange={(e) =>
              updateTerminationProtection.mutate({ stackName: selected!, enabled: e.detail.checked })
            }
            disabled={updateTerminationProtection.isPending}
          >
            Termination protection
          </Toggle>
          <Box>Outputs:</Box>
          {((detailData as any)?.stack?.outputs || []).length === 0 ? (
            <Box color="text-body-secondary">No outputs</Box>
          ) : (
            ((detailData as any)?.stack?.outputs || []).map((o: any, i: number) => (
              <Box key={i}>{o.OutputKey}: {o.OutputValue}</Box>
            ))
          )}

          {/* Resources table */}
          {resources.length > 0 && (
            <ResourceTable
              resourceName="Resource"
              headerTitle="Stack Resources"
              items={resources.map((r: any) => ({
                logicalId: r.LogicalResourceId || "",
                physicalId: r.PhysicalResourceId || "—",
                type: r.ResourceType || "—",
                status: r.ResourceStatus || "—",
              }))}
              columns={[
                { id: "logicalId", header: "Logical ID", cell: (item: any) => item.logicalId },
                { id: "physicalId", header: "Physical ID", cell: (item: any) => item.physicalId },
                { id: "type", header: "Type", cell: (item: any) => item.type },
                { id: "status", header: "Status", cell: (item: any) => item.status },
              ]}
            />
          )}

          {/* Change sets table */}
          {changeSets.length > 0 && (
            <ResourceTable
              resourceName="Change Set"
              headerTitle="Change Sets"
              items={changeSets.map((cs: any) => ({
                name: cs.ChangeSetName || "",
                status: cs.Status || "—",
              }))}
              columns={[
                { id: "name", header: "Name", cell: (item: any) => item.name },
                { id: "status", header: "Status", cell: (item: any) => item.status },
                {
                  id: "actions",
                  header: "",
                  cell: (item: any) => (
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button
                        onClick={() => executeChangeSet.mutate({ stackName: selected!, changeSetName: item.name })}
                        disabled={item.status !== "CREATE_COMPLETE"}
                      >
                        Execute
                      </Button>
                      <Button
                        onClick={() => deleteChangeSet.mutate({ stackName: selected!, changeSetName: item.name })}
                      >
                        Delete
                      </Button>
                    </SpaceBetween>
                  ),
                },
              ]}
            />
          )}
        </SpaceBetween>
      )}

      {/* Create Stack modal */}
      <Modal visible={showCreate} onDismiss={() => setShowCreate(false)} header="Create Stack">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Stack Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.detail.value })} placeholder="my-stack" />
            </FormField>
            <FormField label="Template Body">
              <Textarea value={form.templateBody} onChange={(e) => setForm({ ...form, templateBody: e.detail.value })} rows={10} placeholder='{"AWSTemplateFormatVersion": "..."}' />
            </FormField>
            <FormField label="Parameters (JSON)">
              <Textarea value={form.paramsJson} onChange={(e) => setForm({ ...form, paramsJson: e.detail.value })} rows={3} placeholder='{"Parameters": {"Key": "Value"}}' />
            </FormField>
            <Button onClick={handleCreate} disabled={!form.name || !form.templateBody || createStack.isPending}>
              Create Stack
            </Button>
          </SpaceBetween>
        </Form>
      </Modal>

      {/* Create Change Set modal */}
      <Modal visible={showCsModal} onDismiss={() => setShowCsModal(false)} header="Create Change Set">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Change Set Name">
              <Input value={csForm.changeSetName} onChange={(e) => setCsForm({ ...csForm, changeSetName: e.detail.value })} />
            </FormField>
            <FormField label="Template Body (optional — uses current stack template)">
              <Textarea value={csForm.templateBody} onChange={(e) => setCsForm({ ...csForm, templateBody: e.detail.value })} rows={6} />
            </FormField>
            <FormField label="Parameters (JSON)">
              <Textarea value={csForm.paramsJson} onChange={(e) => setCsForm({ ...csForm, paramsJson: e.detail.value })} rows={3} />
            </FormField>
            <Button onClick={handleCreateCs} disabled={!csForm.changeSetName || createChangeSet.isPending}>
              Create Change Set
            </Button>
          </SpaceBetween>
        </Form>
      </Modal>

      {/* View Template modal */}
      <Modal visible={showTemplate} onDismiss={() => setShowTemplate(false)} header="Stack Template" footer="">
        <Textarea value={(templateData as any)?.template || ""} readOnly rows={20} />
      </Modal>

      {/* Template Summary modal */}
      <Modal visible={showSummary} onDismiss={() => setShowSummary(false)} header="Template Summary" footer="">
        <SpaceBetween size="m">
          <Box>Description: {summary?.description || "—"}</Box>
          <Box>Version: {summary?.version || "—"}</Box>
          <Box>Resource types: {(summary?.resourceTypes || []).join(", ") || "—"}</Box>
          {(summary?.parameters || []).length > 0 && (
            <ResourceTable
              resourceName="Parameter"
              headerTitle="Parameters"
              items={(summary.parameters || []).map((p: any) => ({
                key: p.key || "",
                type: p.type || "—",
                defaultValue: p.defaultValue ?? "—",
              }))}
              columns={[
                { id: "key", header: "Key", cell: (item: any) => item.key },
                { id: "type", header: "Type", cell: (item: any) => item.type },
                { id: "defaultValue", header: "Default", cell: (item: any) => item.defaultValue },
              ]}
            />
          )}
        </SpaceBetween>
      </Modal>
    </SpaceBetween>
  );
}
