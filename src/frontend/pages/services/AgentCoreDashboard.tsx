import { useState } from "react";
import {
  Header,
  Box,
  SpaceBetween,
  StatusIndicator,
  Modal,
  Form,
  FormField,
  Input,
  Textarea,
  Button,
} from "@cloudscape-design/components";
import {
  useAgentRuntimes,
  useAgentRuntime,
  useCreateAgentRuntime,
  useDeleteAgentRuntime,
  useInvokeAgentRuntime,
} from "../../hooks/useAgentCore";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";

export function AgentCoreDashboard() {
  const { data, isLoading } = useAgentRuntimes();
  const createRuntime = useCreateAgentRuntime();
  const deleteRuntime = useDeleteAgentRuntime();
  const invokeRuntime = useInvokeAgentRuntime();
  const [selected, setSelected] = useState<string | null>(null);
  const { data: detailData } = useAgentRuntime(selected);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", roleArn: "", description: "" });
  const [invokePayload, setInvokePayload] = useState("{}");
  const [invokeResult, setInvokeResult] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!form.name || !form.roleArn) return;
    try {
      await createRuntime.mutateAsync({
        name: form.name,
        roleArn: form.roleArn,
        description: form.description,
      });
      setShowCreate(false);
      setForm({ name: "", roleArn: "", description: "" });
    } catch {}
  };

  const runtimes = (data as any)?.agentRuntimes || [];

  const runInvoke = async (arn: string) => {
    try {
      invokeRuntime.mutate(
        { arn, payload: JSON.parse(invokePayload || "{}") },
        {
          onSuccess: (res: any) =>
            setInvokeResult(typeof res === "string" ? res : JSON.stringify(res)),
          onError: () => setInvokeResult(null),
        }
      );
    } catch {}
  };

  return (
    <SpaceBetween size="l">
      <ResourceTable
        resourceName="Runtime"
        headerTitle="Bedrock AgentCore Runtimes"
        headerCounter={(data as any)?.total}
        items={runtimes.map((r: any) => ({
          id: r.agentRuntimeId ?? r.agentRuntimeArn ?? r.agentRuntimeName ?? "",
          arn: r.agentRuntimeArn ?? "",
          name: r.agentRuntimeName ?? r.agentRuntimeId ?? "—",
          status: r.status || "—",
        }))}
        loading={isLoading}
        emptyMessage="No Bedrock AgentCore runtimes"
        columns={[
          {
            id: "name",
            header: "Name",
            cell: (item: any) => (
              <Button
                variant="link"
                onClick={() => setSelected(item.id === selected ? null : item.id)}
              >
                {item.name}
              </Button>
            ),
          },
          {
            id: "status",
            header: "Status",
            cell: (item: any) => (
              <StatusIndicator type={item.status === "ACTIVE" ? "success" : "in-progress"}>
                {item.status}
              </StatusIndicator>
            ),
          },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.name}
                resourceType="runtime"
                loading={deleteRuntime.isPending}
                onDelete={async () => {
                  try {
                    await deleteRuntime.mutateAsync(item.id);
                    if (selected === item.id) setSelected(null);
                  } catch {}
                }}
              />
            ),
          },
        ]}
        filterEnabled
        filterPlaceholder="Find runtimes by name"
        filterFunction={(i: any, s: string) =>
          (i.name ?? "").toLowerCase().includes(s.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      {selected && (
        <Box>
          <Header variant="h3">Runtime — {selected}</Header>
          <SpaceBetween size="xs">
            <Box>ARN: {(detailData as any)?.runtime?.agentRuntimeArn || "—"}</Box>
            <Box>Status: {(detailData as any)?.runtime?.status || "—"}</Box>
            <Box>Role: {(detailData as any)?.runtime?.roleArn || "—"}</Box>
            <Box>Description: {(detailData as any)?.runtime?.description || "—"}</Box>
            <FormField label="Invoke payload (JSON)">
              <Textarea value={invokePayload} onChange={(e) => setInvokePayload(e.detail.value)} rows={3} />
            </FormField>
            {(detailData as any)?.runtime?.agentRuntimeArn && (
              <Button
                loading={invokeRuntime.isPending}
                onClick={() => runInvoke((detailData as any).runtime.agentRuntimeArn)}
              >
                Invoke
              </Button>
            )}
            {invokeResult !== null && <Box data-testid="invoke-result">{invokeResult}</Box>}
          </SpaceBetween>
        </Box>
      )}

      <Modal visible={showCreate} onDismiss={() => setShowCreate(false)} header="Create Runtime">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.detail.value })}
                placeholder="my-agent-runtime"
              />
            </FormField>
            <FormField label="Role ARN">
              <Input
                value={form.roleArn}
                onChange={(e) => setForm({ ...form, roleArn: e.detail.value })}
                placeholder="arn:aws:iam::123456789012:role/agent"
              />
            </FormField>
            <FormField label="Description">
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.detail.value })}
              />
            </FormField>
            <Button
              onClick={handleCreate}
              disabled={!form.name || !form.roleArn || createRuntime.isPending}
            >
              Create
            </Button>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}
