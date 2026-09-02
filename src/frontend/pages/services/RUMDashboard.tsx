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
  Button,
} from "@cloudscape-design/components";
import {
  useRUMAppMonitors,
  useRUMAppMonitor,
  useCreateRUMAppMonitor,
  useDeleteRUMAppMonitor,
} from "../../hooks/useRUM";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";

export function RUMDashboard() {
  const { data, isLoading } = useRUMAppMonitors();
  const createMonitor = useCreateRUMAppMonitor();
  const deleteMonitor = useDeleteRUMAppMonitor();
  const [selected, setSelected] = useState<string | null>(null);
  const { data: detailData } = useRUMAppMonitor(selected);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", domain: "", platform: "web" });

  const handleCreate = async () => {
    if (!form.name || !form.domain) return;
    try {
      await createMonitor.mutateAsync({
        name: form.name,
        domain: form.domain,
        platform: form.platform,
      });
      setShowCreate(false);
      setForm({ name: "", domain: "", platform: "web" });
    } catch {}
  };

  const monitors = (data as any)?.appMonitors || [];

  return (
    <SpaceBetween size="l">
      <ResourceTable
        resourceName="App monitor"
        headerTitle="CloudWatch RUM App Monitors"
        headerCounter={(data as any)?.total}
        items={monitors.map((m: any) => ({
          id: m.Name ?? m.Id,
          name: m.Name,
          state: m.State || "—",
          platform: m.Platform || "—",
        }))}
        loading={isLoading}
        emptyMessage="No CloudWatch RUM app monitors"
        columns={[
          {
            id: "name",
            header: "Name",
            cell: (item: any) => (
              <Button
                variant="link"
                onClick={() => setSelected(item.name === selected ? null : item.name)}
              >
                {item.name}
              </Button>
            ),
          },
          {
            id: "state",
            header: "State",
            cell: (item: any) => (
              <StatusIndicator type={item.state === "ACTIVE" ? "success" : "stopped"}>
                {item.state}
              </StatusIndicator>
            ),
          },
          { id: "platform", header: "Platform", cell: (item: any) => item.platform },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.name}
                resourceType="app monitor"
                loading={deleteMonitor.isPending}
                onDelete={async () => {
                  try {
                    await deleteMonitor.mutateAsync(item.name);
                    if (selected === item.name) setSelected(null);
                  } catch {}
                }}
              />
            ),
          },
        ]}
        filterEnabled
        filterPlaceholder="Find app monitors by name"
        filterFunction={(i: any, s: string) =>
          (i.name ?? "").toLowerCase().includes(s.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      {selected && (
        <Box>
          <Header variant="h3">App monitor — {selected}</Header>
          <SpaceBetween size="xs">
            <Box>
              State: {(detailData as any)?.appMonitor?.state || "—"} | Platform:{" "}
              {(detailData as any)?.appMonitor?.platform || "—"}
            </Box>
            <Box>ID: {(detailData as any)?.appMonitor?.id || "—"}</Box>
            <Box>Domain: {(detailData as any)?.appMonitor?.domain || "—"}</Box>
            <Box>Domains: {(detailData as any)?.appMonitor?.domainList?.join(", ") || "—"}</Box>
          </SpaceBetween>
        </Box>
      )}

      <Modal visible={showCreate} onDismiss={() => setShowCreate(false)} header="Create App Monitor">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.detail.value })}
                placeholder="my-app-monitor"
              />
            </FormField>
            <FormField label="Domain">
              <Input
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.detail.value })}
                placeholder="example.com"
              />
            </FormField>
            <FormField label="Platform">
              <Input
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.detail.value })}
                placeholder="web"
              />
            </FormField>
            <Button
              onClick={handleCreate}
              disabled={!form.name || !form.domain || createMonitor.isPending}
            >
              Create
            </Button>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}
