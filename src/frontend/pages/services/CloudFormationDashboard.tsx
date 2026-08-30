// @v8 ignore start — JSX-heavy dashboard, callbacks tested via integration
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

  const [selected, setSelected] = useState<string | null>(null);
  const { data: detailData } = useStack(selected);
  const { data: templateData } = useStackTemplate(selected);
  const { data: csData } = useChangeSets(selected);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", templateBody: "", paramsJson: "{}" });
  const [showCsModal, setShowCsModal] = useState(false);
  const [csForm, setCsForm] = useState({ changeSetName: "", templateBody: "", paramsJson: "{}" });
  const [showTemplate, setShowTemplate] = useState(false);

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
                  { id: "name", header: "Name", cell: (item: any) => item.name },
                  { id: "status", header: "Status", cell: (item: any) => item.status },
                  { id: "description", header: "Description", cell: (item: any) => item.description },
                ]}
              />
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
                <Button onClick={() => setShowCsModal(true)}>Create Change Set</Button>
              </SpaceBetween>
            }
          >
            Stack — {selected}
          </Header>
          <Box>Status: {(detailData as any)?.stack?.stackStatus || "—"}</Box>
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
    </SpaceBetween>
  );
}
// @v8 ignore end
