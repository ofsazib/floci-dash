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
  Button,
} from "@cloudscape-design/components";
import {
  useAgentRuntimes,
  useAgentRuntime,
  useCreateAgentRuntime,
  useDeleteAgentRuntime,
  useAgentRuntimeVersions,
  useAgentRuntimeEndpoints,
  useCreateAgentRuntimeEndpoint,
  useDeleteAgentRuntimeEndpoint,
} from "../../hooks/useBedrockAgentCoreControl";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";

const statusType = (s: string) =>
  s === "READY" || s === "ACTIVE"
    ? "success"
    : s === "FAILED" || s === "DELETING"
      ? "error"
      : s === "CREATING" || s === "UPDATING" || s === "PENDING"
        ? "in-progress"
        : "pending";

export function AgentCoreControlDashboard() {
  const { data: runtimeData, isLoading } = useAgentRuntimes();
  const createRuntime = useCreateAgentRuntime();
  const deleteRuntime = useDeleteAgentRuntime();

  const [selected, setSelected] = useState<string | null>(null);
  const { data: runtimeDetail } = useAgentRuntime(selected);
  const { data: versionsData } = useAgentRuntimeVersions(selected);
  const { data: endpointsData } = useAgentRuntimeEndpoints(selected);
  const createEndpoint = useCreateAgentRuntimeEndpoint();
  const deleteEndpoint = useDeleteAgentRuntimeEndpoint();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", roleArn: "" });
  const [showEndpointCreate, setShowEndpointCreate] = useState(false);
  const [epForm, setEpForm] = useState({ name: "", version: "", description: "" });

  const runtimes = (runtimeData as any)?.agentRuntimes || [];
  const versions = (versionsData as any)?.agentRuntimes || [];
  const endpoints = (endpointsData as any)?.runtimeEndpoints || [];

  const handleCreate = async () => {
    if (!form.name) return;
    try {
      await createRuntime.mutateAsync({
        agentRuntimeName: form.name,
        description: form.description || undefined,
        roleArn: form.roleArn || undefined,
      });
      setShowCreate(false);
      setForm({ name: "", description: "", roleArn: "" });
    } catch {}
  };

  const handleCreateEndpoint = async () => {
    if (!selected || !epForm.name) return;
    try {
      await createEndpoint.mutateAsync({
        runtimeId: selected,
        body: { name: epForm.name, agentRuntimeVersion: epForm.version || undefined, description: epForm.description || undefined },
      });
      setShowEndpointCreate(false);
      setEpForm({ name: "", version: "", description: "" });
    } catch {}
  };

  return (
    <SpaceBetween size="l">
      <Tabs
        tabs={[
          {
            id: "runtimes",
            label: "Agent Runtimes",
            content: (
              <ResourceTable
                resourceName="Agent runtime"
                headerTitle="Bedrock Agent Core Runtimes"
                headerCounter={runtimes.length}
                items={runtimes.map((r: any) => ({
                  id: r.agentRuntimeId || "",
                  name: r.agentRuntimeName || "—",
                  status: r.status || "—",
                  version: r.agentRuntimeVersion || "—",
                }))}
                loading={isLoading}
                emptyMessage="No agent runtimes"
                columns={[
                  {
                    id: "name",
                    header: "Name",
                    cell: (item: any) => (
                      <Button variant="link" onClick={() => setSelected(item.id === selected ? null : item.id)}>
                        {item.name}
                      </Button>
                    ),
                  },
                  {
                    id: "status",
                    header: "Status",
                    cell: (item: any) => <StatusIndicator type={statusType(item.status)}>{item.status}</StatusIndicator>,
                  },
                  { id: "version", header: "Version", cell: (item: any) => item.version },
                  {
                    id: "actions",
                    header: "",
                    cell: (item: any) => (
                      <DeleteButton
                        itemName={item.name}
                        resourceType="runtime"
                        onDelete={async () => { try { await deleteRuntime.mutateAsync(item.id); if (selected === item.id) setSelected(null); } catch {} }}
                        loading={deleteRuntime.isPending}
                      />
                    ),
                  },
                ]}
                filterEnabled
                filterPlaceholder="Find runtimes"
                filterFunction={(i: any, s: string) => (i.name ?? "").toLowerCase().includes(s.toLowerCase())}
                onCreate={() => setShowCreate(true)}
              />
            ),
          },
          {
            id: "endpoints",
            label: "Endpoints",
            content: selected ? (
              <ResourceTable
                resourceName="Endpoint"
                headerTitle={`Endpoints — ${selected}`}
                headerCounter={endpoints.length}
                items={endpoints.map((e: any) => ({
                  name: e.endpointName || e.name || "",
                  status: e.status || "—",
                  version: e.targetVersion || "—",
                }))}
                emptyMessage="No endpoints"
                columns={[
                  { id: "name", header: "Name", cell: (item: any) => item.name },
                  {
                    id: "status",
                    header: "Status",
                    cell: (item: any) => <StatusIndicator type={statusType(item.status)}>{item.status}</StatusIndicator>,
                  },
                  { id: "version", header: "Version", cell: (item: any) => item.version },
                  {
                    id: "actions",
                    header: "",
                    cell: (item: any) => (
                      <Button onClick={() => deleteEndpoint.mutate({ runtimeId: selected!, name: item.name })} disabled={deleteEndpoint.isPending}>
                        Delete
                      </Button>
                    ),
                  },
                ]}
                onCreate={() => setShowEndpointCreate(true)}
              />
            ) : (
              <Box>Select a runtime to view endpoints</Box>
            ),
          },
        ]}
      />

      {/* Runtime detail + versions */}
      {selected && runtimeDetail && (
        <SpaceBetween size="xs">
          <Header variant="h3">Runtime — {(runtimeDetail as any)?.agentRuntimeName || selected}</Header>
          <Box>Status: {(runtimeDetail as any)?.status || "—"}</Box>
          <Box>Version: {(runtimeDetail as any)?.agentRuntimeVersion || "—"}</Box>
          <Box>Description: {(runtimeDetail as any)?.description || "—"}</Box>
          <Box>Role: {(runtimeDetail as any)?.roleArn || "—"}</Box>
          {versions.length > 0 && (
            <ResourceTable
              resourceName="Version"
              headerTitle="Versions"
              items={versions.map((v: any) => ({
                version: v.agentRuntimeVersion || "",
                status: v.status || "—",
              }))}
              columns={[
                { id: "version", header: "Version", cell: (item: any) => item.version },
                { id: "status", header: "Status", cell: (item: any) => item.status },
              ]}
            />
          )}
        </SpaceBetween>
      )}

      {/* Create Runtime modal */}
      <Modal visible={showCreate} onDismiss={() => setShowCreate(false)} header="Create Agent Runtime">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.detail.value })} placeholder="my-runtime" />
            </FormField>
            <FormField label="Description">
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.detail.value })} />
            </FormField>
            <FormField label="Role ARN">
              <Input value={form.roleArn} onChange={(e) => setForm({ ...form, roleArn: e.detail.value })} />
            </FormField>
            <Button onClick={handleCreate} disabled={!form.name || createRuntime.isPending}>
              Create Runtime
            </Button>
          </SpaceBetween>
        </Form>
      </Modal>

      {/* Create Endpoint modal */}
      <Modal visible={showEndpointCreate} onDismiss={() => setShowEndpointCreate(false)} header="Create Endpoint">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Endpoint Name">
              <Input value={epForm.name} onChange={(e) => setEpForm({ ...epForm, name: e.detail.value })} />
            </FormField>
            <FormField label="Target Version">
              <Input value={epForm.version} onChange={(e) => setEpForm({ ...epForm, version: e.detail.value })} />
            </FormField>
            <FormField label="Description">
              <Input value={epForm.description} onChange={(e) => setEpForm({ ...epForm, description: e.detail.value })} />
            </FormField>
            <Button onClick={handleCreateEndpoint} disabled={!epForm.name || createEndpoint.isPending}>
              Create Endpoint
            </Button>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}
// @v8 ignore end
