// @v8 ignore start — JSX-heavy dashboard, callbacks tested via integration
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
  useEMRServerlessApplications,
  useEMRServerlessApplication,
  useCreateEMRServerlessApplication,
  useUpdateEMRServerlessApplication,
  useDeleteEMRServerlessApplication,
  useStartEMRServerlessApplication,
  useStopEMRServerlessApplication,
} from "../../hooks/useEMRServerless";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";

const TYPE_OPTIONS = ["SPARK", "HIVE"];

export function EmrServerlessDashboard() {
  const { data, isLoading } = useEMRServerlessApplications();
  const createApp = useCreateEMRServerlessApplication();
  const updateApp = useUpdateEMRServerlessApplication();
  const deleteApp = useDeleteEMRServerlessApplication();
  const startApp = useStartEMRServerlessApplication();
  const stopApp = useStopEMRServerlessApplication();
  const [selected, setSelected] = useState<string | null>(null);
  const { data: detailData } = useEMRServerlessApplication(selected);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", releaseLabel: "emr-7.1.0", type: "SPARK" });

  const handleCreate = async () => {
    if (!form.name) return;
    try {
      await createApp.mutateAsync({
        name: form.name,
        releaseLabel: form.releaseLabel,
        type: form.type,
      });
      setShowCreate(false);
      setForm({ name: "", releaseLabel: "emr-7.1.0", type: "SPARK" });
    } catch {}
  };

  const apps = (data as any)?.applications || [];

  return (
    <SpaceBetween size="l">
      <ResourceTable
        resourceName="Application"
        headerTitle="EMR Serverless Applications"
        headerCounter={(data as any)?.total}
        items={apps.map((a: any) => ({
          id: a.id,
          name: a.name,
          status: a.state || "—",
          release: a.releaseLabel || "—",
          type: a.type || "—",
        }))}
        loading={isLoading}
        emptyMessage="No EMR Serverless applications"
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
            header: "State",
            cell: (item: any) => (
              <StatusIndicator
                type={item.status === "STARTED" ? "success" : item.status === "CREATED" ? "stopped" : "in-progress"}
              >
                {item.status}
              </StatusIndicator>
            ),
          },
          { id: "release", header: "Release", cell: (item: any) => item.release },
          { id: "type", header: "Type", cell: (item: any) => item.type },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  onClick={() => startApp.mutate(item.id)}
                  disabled={startApp.isPending || item.status === "STARTED"}
                >
                  Start
                </Button>
                <Button
                  onClick={() => stopApp.mutate(item.id)}
                  disabled={stopApp.isPending || item.status !== "STARTED"}
                >
                  Stop
                </Button>
                <DeleteButton
                  itemName={item.name}
                  resourceType="application"
                  loading={deleteApp.isPending}
                  onDelete={async () => {
                    try {
                      await deleteApp.mutateAsync(item.id);
                    } catch {}
                  }}
                />
              </SpaceBetween>
            ),
          },
        ]}
        filterEnabled
        filterPlaceholder="Find applications by name"
        filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
        onCreate={() => setShowCreate(true)}
      />

      {selected && (
        <Box>
          <Header variant="h3">Application — {selected}</Header>
          <SpaceBetween size="xs">
            <Box>
              Status: {(detailData as any)?.application?.status || "—"} | Release:{" "}
              {(detailData as any)?.application?.releaseLabel || "—"} | Type:{" "}
              {(detailData as any)?.application?.type || "—"}
            </Box>
            <Box>
              ARN: {(detailData as any)?.application?.arn || "—"}
            </Box>
            <Box>
              Auto-start: {String((detailData as any)?.application?.autoStart ?? "—")} | Auto-stop:{" "}
              {String((detailData as any)?.application?.autoStop ?? "—")}
            </Box>
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                loading={updateApp.isPending}
                onClick={() =>
                  updateApp.mutate({
                    id: selected,
                    autoStart: !((detailData as any)?.application?.autoStart ?? false),
                  })
                }
              >
                Toggle auto-start
              </Button>
              <Button
                loading={updateApp.isPending}
                onClick={() =>
                  updateApp.mutate({
                    id: selected,
                    autoStop: !((detailData as any)?.application?.autoStop ?? false),
                  })
                }
              >
                Toggle auto-stop
              </Button>
            </SpaceBetween>
          </SpaceBetween>
        </Box>
      )}

      <Modal visible={showCreate} onDismiss={() => setShowCreate(false)} header="Create Application">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.detail.value })} placeholder="my-app" />
            </FormField>
            <FormField label="Release Label">
              <Input
                value={form.releaseLabel}
                onChange={(e) => setForm({ ...form, releaseLabel: e.detail.value })}
                placeholder="emr-7.1.0"
              />
            </FormField>
            <FormField label="Type">
              <Input
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.detail.value.toUpperCase() })}
                placeholder="SPARK"
              />
            </FormField>
            <Button onClick={handleCreate} disabled={!form.name || createApp.isPending}>
              Create
            </Button>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}
// @v8 ignore end
