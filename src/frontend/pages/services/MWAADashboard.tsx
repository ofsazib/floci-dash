import { useState } from "react";
import {
  Header,
  Box,
  SpaceBetween,
  Modal,
  Form,
  FormField,
  Input,
  Button,
} from "@cloudscape-design/components";
import {
  useMWAAEnvironments,
  useMWAAEnvironment,
  useCreateMWAAEnvironment,
  useDeleteMWAAEnvironment,
  useCreateMWAAWebToken,
  useCreateMWAACliToken,
} from "../../hooks/useMWAA";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";

export function MWAADashboard() {
  const { data, isLoading } = useMWAAEnvironments();
  const createEnv = useCreateMWAAEnvironment();
  const deleteEnv = useDeleteMWAAEnvironment();
  const webToken = useCreateMWAAWebToken();
  const cliToken = useCreateMWAACliToken();
  const [selected, setSelected] = useState<string | null>(null);
  const { data: detailData } = useMWAAEnvironment(selected);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    sourceBucketArn: "",
    executionRoleArn: "",
    airflowVersion: "2.10.1",
    environmentClass: "ENV_TYPE_SMALL",
    dagS3Path: "dags/",
  });

  const handleCreate = async () => {
    if (!form.name || !form.sourceBucketArn || !form.executionRoleArn) return;
    try {
      await createEnv.mutateAsync({
        name: form.name,
        sourceBucketArn: form.sourceBucketArn,
        executionRoleArn: form.executionRoleArn,
        airflowVersion: form.airflowVersion,
        environmentClass: form.environmentClass,
        dagS3Path: form.dagS3Path,
      });
      setShowCreate(false);
      setForm({ ...form, name: "", sourceBucketArn: "", executionRoleArn: "" });
    } catch {}
  };

  const envs = (data as any)?.environments || [];

  return (
    <SpaceBetween size="l">
      <ResourceTable
        resourceName="Environment"
        headerTitle="MWAA Environments"
        headerCounter={(data as any)?.total}
        items={envs.map((e: any) => ({
          id: e.name ?? e,
          name: e.name ?? e,
        }))}
        loading={isLoading}
        emptyMessage="No MWAA environments"
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
            id: "actions",
            header: "",
            cell: (item: any) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => webToken.mutate(item.id)} loading={webToken.isPending}>
                  Web token
                </Button>
                <Button onClick={() => cliToken.mutate(item.id)} loading={cliToken.isPending}>
                  CLI token
                </Button>
                <DeleteButton
                  itemName={item.name}
                  resourceType="environment"
                  loading={deleteEnv.isPending}
                  onDelete={async () => {
                    try {
                      await deleteEnv.mutateAsync(item.id);
                    } catch {}
                  }}
                />
              </SpaceBetween>
            ),
          },
        ]}
        filterEnabled
        filterPlaceholder="Find environments by name"
        filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
        onCreate={() => setShowCreate(true)}
      />

      {selected && (
        <Box>
          <Header variant="h3">Environment — {selected}</Header>
          <SpaceBetween size="xs">
            <Box>
              Status: {(detailData as any)?.environment?.status || "—"} | Airflow:{" "}
              {(detailData as any)?.environment?.airflowVersion || "—"} | Class:{" "}
              {(detailData as any)?.environment?.environmentClass || "—"}
            </Box>
            <Box>ARN: {(detailData as any)?.environment?.arn || "—"}</Box>
            <Box>Webserver URL: {(detailData as any)?.environment?.webserverUrl || "—"}</Box>
            <Box>Source bucket: {(detailData as any)?.environment?.sourceBucketArn || "—"}</Box>
          </SpaceBetween>
        </Box>
      )}

      <Modal visible={showCreate} onDismiss={() => setShowCreate(false)} header="Create Environment">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.detail.value })}
                placeholder="my-airflow-env"
              />
            </FormField>
            <FormField label="Source Bucket ARN">
              <Input
                value={form.sourceBucketArn}
                onChange={(e) => setForm({ ...form, sourceBucketArn: e.detail.value })}
                placeholder="arn:aws:s3:::my-bucket"
              />
            </FormField>
            <FormField label="Execution Role ARN">
              <Input
                value={form.executionRoleArn}
                onChange={(e) => setForm({ ...form, executionRoleArn: e.detail.value })}
                placeholder="arn:aws:iam::123456789012:role/mwaa"
              />
            </FormField>
            <FormField label="Airflow Version">
              <Input
                value={form.airflowVersion}
                onChange={(e) => setForm({ ...form, airflowVersion: e.detail.value })}
              />
            </FormField>
            <FormField label="Environment Class">
              <Input
                value={form.environmentClass}
                onChange={(e) => setForm({ ...form, environmentClass: e.detail.value.toUpperCase() })}
              />
            </FormField>
            <FormField label="DAGs S3 Path">
              <Input
                value={form.dagS3Path}
                onChange={(e) => setForm({ ...form, dagS3Path: e.detail.value })}
              />
            </FormField>
            <Button
              onClick={handleCreate}
              disabled={
                !form.name || !form.sourceBucketArn || !form.executionRoleArn || createEnv.isPending
              }
            >
              Create
            </Button>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}
