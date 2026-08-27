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
  useFisExperimentTemplates,
  useFisExperimentTemplate,
  useCreateFisExperimentTemplate,
  useDeleteFisExperimentTemplate,
  useFisExperiments,
  useStartFisExperiment,
  useStopFisExperiment,
} from "../../hooks/useFIS";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";

export function FisDashboard() {
  const { data, isLoading } = useFisExperimentTemplates();
  const { data: expData, isLoading: expLoading } = useFisExperiments();
  const createTemplate = useCreateFisExperimentTemplate();
  const deleteTemplate = useDeleteFisExperimentTemplate();
  const startExperiment = useStartFisExperiment();
  const stopExperiment = useStopFisExperiment();
  const [selected, setSelected] = useState<string | null>(null);
  const { data: detailData } = useFisExperimentTemplate(selected);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", roleArn: "", actionsJson: "{}" });

  const handleCreate = async () => {
    if (!form.description || !form.roleArn) return;
    let actions;
    try {
      actions = JSON.parse(form.actionsJson || "{}");
    } catch {
      return;
    }
    try {
      await createTemplate.mutateAsync({
        name: form.name,
        description: form.description,
        roleArn: form.roleArn,
        actions,
      });
      setShowCreate(false);
      setForm({ name: "", description: "", roleArn: "", actionsJson: "{}" });
    } catch {}
  };

  const templates = (data as any)?.experimentTemplates || [];
  const experiments = (expData as any)?.experiments || [];

  return (
    <SpaceBetween size="l">
      <Tabs
        tabs={[
          {
            id: "templates",
            label: "Experiment Templates",
            content: (
              <ResourceTable
                resourceName="Experiment template"
                headerTitle="FIS Experiment Templates"
                headerCounter={(data as any)?.total}
                items={templates.map((t: any) => ({
                  id: t.id ?? "",
                  arn: t.arn ?? "",
                  title: t.title || t.id || "—",
                  description: t.description || "—",
                  state: (t as any).state?.status || "—",
                }))}
                loading={isLoading}
                emptyMessage="No FIS experiment templates"
                columns={[
                  {
                    id: "title",
                    header: "Title",
                    cell: (item: any) => (
                      <Button
                        variant="link"
                        onClick={() => setSelected(item.id === selected ? null : item.id)}
                      >
                        {item.title}
                      </Button>
                    ),
                  },
                  { id: "state", header: "State", cell: (item: any) => item.state },
                  { id: "description", header: "Description", cell: (item: any) => item.description },
                  {
                    id: "actions",
                    header: "",
                    cell: (item: any) => (
                      <SpaceBetween direction="horizontal" size="xs">
                        <Button
                          onClick={() => startExperiment.mutate(item.id)}
                          loading={startExperiment.isPending}
                        >
                          Start experiment
                        </Button>
                        <DeleteButton
                          itemName={item.title}
                          resourceType="template"
                          loading={deleteTemplate.isPending}
                          onDelete={async () => {
                            try {
                              await deleteTemplate.mutateAsync(item.id);
                              if (selected === item.id) setSelected(null);
                            } catch {}
                          }}
                        />
                      </SpaceBetween>
                    ),
                  },
                ]}
                filterEnabled
                filterPlaceholder="Find templates by title"
                filterFunction={(i: any, s: string) =>
                  (i.title ?? "").toLowerCase().includes(s.toLowerCase())
                }
                onCreate={() => setShowCreate(true)}
              />
            ),
          },
          {
            id: "experiments",
            label: "Experiments",
            content: (
              <ResourceTable
                resourceName="Experiment"
                headerTitle="FIS Experiments"
                headerCounter={(expData as any)?.total}
                items={experiments.map((e: any) => ({
                  id: e.id ?? "",
                  state: (e as any).state?.status || "—",
                  templateId: e.experimentTemplateId || "—",
                }))}
                loading={expLoading}
                emptyMessage="No FIS experiments"
                columns={[
                  {
                    id: "id",
                    header: "ID",
                    cell: (item: any) => <Box>{item.id}</Box>,
                  },
                  {
                    id: "state",
                    header: "State",
                    cell: (item: any) => (
                      <StatusIndicator type={item.state === "completed" ? "success" : "in-progress"}>
                        {item.state}
                      </StatusIndicator>
                    ),
                  },
                  { id: "templateId", header: "Template", cell: (item: any) => item.templateId },
                  {
                    id: "actions",
                    header: "",
                    cell: (item: any) => (
                      <Button
                        onClick={() => stopExperiment.mutate(item.id)}
                        disabled={stopExperiment.isPending || item.state !== "running"}
                      >
                        Stop
                      </Button>
                    ),
                  },
                ]}
                filterEnabled
                filterPlaceholder="Find experiments by ID"
                filterFunction={(i: any, s: string) =>
                  (i.id ?? "").toLowerCase().includes(s.toLowerCase())
                }
              />
            ),
          },
        ]}
      />

      {selected && (
        <Box>
          <Header variant="h3">Template — {selected}</Header>
          <SpaceBetween size="xs">
            <Box>State: {(detailData as any)?.experimentTemplate?.state || "—"}</Box>
            <Box>Description: {(detailData as any)?.experimentTemplate?.description || "—"}</Box>
            <Box>Role: {(detailData as any)?.experimentTemplate?.roleArn || "—"}</Box>
            <Box>
              Targets:{" "}
              {(detailData as any)?.experimentTemplate?.targets?.join(", ") || "—"}
            </Box>
            <Box>
              Actions:{" "}
              {(detailData as any)?.experimentTemplate?.actions?.join(", ") || "—"}
            </Box>
          </SpaceBetween>
        </Box>
      )}

      <Modal visible={showCreate} onDismiss={() => setShowCreate(false)} header="Create Template">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.detail.value })}
                placeholder="my-template"
              />
            </FormField>
            <FormField label="Description">
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.detail.value })}
              />
            </FormField>
            <FormField label="Role ARN">
              <Input
                value={form.roleArn}
                onChange={(e) => setForm({ ...form, roleArn: e.detail.value })}
                placeholder="arn:aws:iam::123456789012:role/fis"
              />
            </FormField>
            <FormField label="Actions (JSON)">
              <Input
                value={form.actionsJson}
                onChange={(e) => setForm({ ...form, actionsJson: e.detail.value })}
              />
            </FormField>
            <Button
              onClick={handleCreate}
              disabled={!form.description || !form.roleArn || createTemplate.isPending}
            >
              Create
            </Button>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}
// @v8 ignore end
