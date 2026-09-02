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
  useGuardDutyDetectors,
  useGuardDutyDetector,
  useCreateGuardDutyDetector,
  useUpdateGuardDutyDetector,
  useDeleteGuardDutyDetector,
} from "../../hooks/useGuardDuty";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";

export function GuardDutyDashboard() {
  const { data, isLoading } = useGuardDutyDetectors();
  const createDetector = useCreateGuardDutyDetector();
  const updateDetector = useUpdateGuardDutyDetector();
  const deleteDetector = useDeleteGuardDutyDetector();
  const [selected, setSelected] = useState<string | null>(null);
  const { data: detailData } = useGuardDutyDetector(selected);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ enable: "true", frequency: "SIX_HOURS" });

  const handleCreate = async () => {
    try {
      await createDetector.mutateAsync({
        enable: form.enable === "true",
        frequency: form.frequency,
      });
      setShowCreate(false);
      setForm({ enable: "true", frequency: "SIX_HOURS" });
    } catch {}
  };

  const detectors = (data as any)?.detectorIds || [];

  return (
    <SpaceBetween size="l">
      <ResourceTable
        resourceName="Detector"
        headerTitle="GuardDuty Detectors"
        headerCounter={(data as any)?.total}
        items={detectors.map((id: string) => ({ id, name: id }))}
        loading={isLoading}
        emptyMessage="No GuardDuty detectors"
        columns={[
          {
            id: "id",
            header: "Detector ID",
            cell: (item: any) => (
              <Button
                variant="link"
                onClick={() => setSelected(item.id === selected ? null : item.id)}
              >
                {item.id}
              </Button>
            ),
          },
          {
            id: "status",
            header: "Status",
            cell: () => (
              <StatusIndicator type={(detailData as any)?.detector?.status === "ENABLED" ? "success" : "stopped"}>
                {(detailData as any)?.detector?.status ?? "—"}
              </StatusIndicator>
            ),
          },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.id}
                resourceType="detector"
                loading={deleteDetector.isPending}
                onDelete={async () => {
                  try {
                    await deleteDetector.mutateAsync(item.id);
                    if (selected === item.id) setSelected(null);
                  } catch {}
                }}
              />
            ),
          },
        ]}
        filterEnabled
        filterPlaceholder="Find detectors by ID"
        filterFunction={(i: any, s: string) =>
          (i.id ?? "").toLowerCase().includes(s.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      {selected && (
        <Box>
          <Header variant="h3">Detector — {selected}</Header>
          <SpaceBetween size="xs">
            <Box>Status: {(detailData as any)?.detector?.status || "—"}</Box>
            <Box>Created: {(detailData as any)?.detector?.createdAt || "—"}</Box>
            <Box>
              Frequency:{" "}
              {(detailData as any)?.detector?.findingPublishingFrequency || "—"}
            </Box>
            <Box>Service role: {(detailData as any)?.detector?.serviceRole || "—"}</Box>
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                loading={updateDetector.isPending}
                onClick={() =>
                  updateDetector.mutate({
                    id: selected,
                    enable:
                      ((detailData as any)?.detector?.status ?? "ENABLED") !== "ENABLED",
                  })
                }
              >
                Toggle enabled
              </Button>
            </SpaceBetween>
          </SpaceBetween>
        </Box>
      )}

      <Modal visible={showCreate} onDismiss={() => setShowCreate(false)} header="Create Detector">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Enable (true/false)">
              <Input
                value={form.enable}
                onChange={(e) => setForm({ ...form, enable: e.detail.value.toLowerCase() })}
              />
            </FormField>
            <FormField label="Finding Publishing Frequency">
              <Input
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.detail.value.toUpperCase() })}
                placeholder="FIFTEEN_MINUTES | ONE_HOUR | SIX_HOURS"
              />
            </FormField>
            <Button onClick={handleCreate} disabled={createDetector.isPending}>
              Create
            </Button>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}
