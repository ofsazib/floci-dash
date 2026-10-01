import { useState } from "react";
import {
  Button,
  Container,
  Header,
  SpaceBetween,
  Box,
  Modal,
  Form,
  FormField,
  Input,
  Textarea,
  Alert,
} from "@cloudscape-design/components";
import ServiceDashboardLayout from "../../components/ServiceDashboardLayout";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import {
  useSmModels,
  useCreateSmModel,
  useDeleteSmModel,
  useSmEndpointConfigs,
  useCreateSmEndpointConfig,
  useDeleteSmEndpointConfig,
  useSmEndpoints,
  useCreateSmEndpoint,
  useUpdateSmEndpoint,
  useDeleteSmEndpoint,
  useSmTrainingJobs,
  useCreateSmTrainingJob,
  useStopSmTrainingJob,
  type SmModel,
  type SmEndpointConfig,
  type SmEndpoint,
  type SmTrainingJob,
} from "../../hooks/useSageMaker";

interface Status {
  type: "success" | "error";
  message: string;
}

function StatusAlert({ status, onDismiss }: { status: Status | null; onDismiss: () => void }) {
  if (!status) return null;
  return (
    <Alert type={status.type} dismissible onDismiss={onDismiss}>
      {status.message}
    </Alert>
  );
}

function CreateModelModal({
  visible,
  loading,
  onDismiss,
  onSubmit,
}: {
  visible: boolean;
  loading: boolean;
  onDismiss: () => void;
  onSubmit: (body: { modelName: string; image: string; executionRoleArn: string }) => void;
}) {
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [role, setRole] = useState("");

  return (
    <Modal visible={visible} onDismiss={onDismiss} header="Create model">
      <Form>
        <SpaceBetween size="m">
          <FormField label="Model name">
            <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="my-model" />
          </FormField>
          <FormField label="Container image URI">
            <Input value={image} onChange={({ detail }) => setImage(detail.value)} placeholder="1234.dkr.ecr.us-east-1.amazonaws.com/m:1" />
          </FormField>
          <FormField label="Execution role ARN">
            <Input value={role} onChange={({ detail }) => setRole(detail.value)} placeholder="arn:aws:iam::123456789012:role/…" />
          </FormField>
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={onDismiss}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!name || !image || !role}
                loading={loading}
                onClick={() => {
                  onSubmit({
                    modelName: name,
                    image,
                    executionRoleArn: role,
                  });
                  setName("");
                  setImage("");
                  setRole("");
                }}
              >
                Create
              </Button>
            </SpaceBetween>
          </Box>
        </SpaceBetween>
      </Form>
    </Modal>
  );
}

export default function SageMakerDashboard() {
  const modelsQuery = useSmModels();
  const configsQuery = useSmEndpointConfigs();
  const endpointsQuery = useSmEndpoints();
  const jobsQuery = useSmTrainingJobs();
  const createModel = useCreateSmModel();
  const deleteModel = useDeleteSmModel();
  const createConfig = useCreateSmEndpointConfig();
  const deleteConfig = useDeleteSmEndpointConfig();
  const createEndpoint = useCreateSmEndpoint();
  const updateEndpoint = useUpdateSmEndpoint();
  const deleteEndpoint = useDeleteSmEndpoint();
  const createJob = useCreateSmTrainingJob();
  const stopJob = useStopSmTrainingJob();

  const [status, setStatus] = useState<Status | null>(null);
  const [showCreateModel, setShowCreateModel] = useState(false);
  const [showCreateConfig, setShowCreateConfig] = useState(false);
  const [showCreateEndpoint, setShowCreateEndpoint] = useState(false);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [modelName, setModelName] = useState("");
  const [configImage, setConfigImage] = useState("");
  const [configInstanceType, setConfigInstanceType] = useState("ml.t2.medium");
  const [epName, setEpName] = useState("");
  const [epConfig, setEpConfig] = useState("");
  const [jobName, setJobName] = useState("");
  const [jobImage, setJobImage] = useState("");
  const [jobS3Input, setJobS3Input] = useState("");

  async function wrap(action: () => Promise<unknown>, success: string) {
    setStatus(null);
    try {
      await action();
      setStatus({ type: "success", message: success });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Request failed" });
    }
  }

  return (
    <SpaceBetween size="l">
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      <ServiceDashboardLayout
        tabs={[
          {
            id: "models",
            label: `Models (${modelsQuery.data?.models?.length ?? 0})`,
            content: (
              <SpaceBetween size="m">
                <ResourceTable
                  resourceName="model"
                  headerTitle="Models"
                  items={modelsQuery.data?.models || []}
                  loading={modelsQuery.isLoading}
                  onCreate={() => setShowCreateModel(true)}
                  onRefresh={modelsQuery.refetch}
                  columns={[
                    { id: "name", header: "Name", cell: (m: SmModel) => m.ModelName },
                    { id: "arn", header: "ARN", cell: (m: SmModel) => m.ModelArn },
                    {
                      id: "actions",
                      header: "",
                      cell: (m: SmModel) => (
                        <DeleteButton
                          itemName={m.ModelName!}
                          resourceType="model"
                          loading={deleteModel.isPending}
                          onDelete={() =>
                            wrap(
                              () => deleteModel.mutateAsync(m.ModelName!),
                              `Model ${m.ModelName} deleted.`
                            )
                          }
                        />
                      ),
                    },
                  ]}
                />
                {modelsQuery.isError && (
                  <Alert type="error">
                    {(modelsQuery.error as Error)?.message || "Failed to load models"}
                  </Alert>
                )}
              </SpaceBetween>
            ),
          },
          {
            id: "configs",
            label: `Endpoint configs (${configsQuery.data?.configs?.length ?? 0})`,
            content: (
              <ResourceTable
                resourceName="endpoint config"
                headerTitle="Endpoint configs"
                items={configsQuery.data?.configs || []}
                loading={configsQuery.isLoading}
                onCreate={() => setShowCreateConfig(true)}
                onRefresh={configsQuery.refetch}
                columns={[
                  { id: "name", header: "Name", cell: (c: SmEndpointConfig) => c.EndpointConfigName },
                  { id: "arn", header: "ARN", cell: (c: SmEndpointConfig) => c.EndpointConfigArn },
                  {
                    id: "actions",
                    header: "",
                    cell: (c: SmEndpointConfig) => (
                      <DeleteButton
                        itemName={c.EndpointConfigName!}
                        resourceType="endpoint config"
                        loading={deleteConfig.isPending}
                        onDelete={() =>
                          wrap(
                            () => deleteConfig.mutateAsync(c.EndpointConfigName!),
                            `Config ${c.EndpointConfigName} deleted.`
                          )
                        }
                      />
                    ),
                  },
                ]}
              />
            ),
          },
          {
            id: "endpoints",
            label: `Endpoints (${endpointsQuery.data?.endpoints?.length ?? 0})`,
            content: (
              <ResourceTable
                resourceName="endpoint"
                headerTitle="Endpoints"
                items={endpointsQuery.data?.endpoints || []}
                loading={endpointsQuery.isLoading}
                onCreate={() => setShowCreateEndpoint(true)}
                onRefresh={endpointsQuery.refetch}
                columns={[
                  { id: "name", header: "Name", cell: (e: SmEndpoint) => e.EndpointName },
                  { id: "status", header: "Status", cell: (e: SmEndpoint) => e.EndpointStatus },
                  { id: "config", header: "Config", cell: (e: SmEndpoint) => e.EndpointConfigName },
                  {
                    id: "actions",
                    header: "",
                    cell: (e: SmEndpoint) => (
                      <SpaceBetween direction="horizontal" size="xs">
                        <Button
                          onClick={() => {
                            const target = configsQuery.data?.configs[0]?.EndpointConfigName;
                            if (!target) {
                              setStatus({
                                type: "error",
                                message: "Create an endpoint config first.",
                              });
                              return;
                            }
                            wrap(
                              () => updateEndpoint.mutateAsync({ endpointName: e.EndpointName!, endpointConfigName: target }),
                              `Endpoint ${e.EndpointName} updating.`
                            );
                          }}
                        >
                          Update
                        </Button>
                        <DeleteButton
                          itemName={e.EndpointName!}
                          resourceType="endpoint"
                          loading={deleteEndpoint.isPending}
                          onDelete={() =>
                            wrap(
                              () => deleteEndpoint.mutateAsync(e.EndpointName!),
                              `Endpoint ${e.EndpointName} deleted.`
                            )
                          }
                        />
                      </SpaceBetween>
                    ),
                  },
                ]}
              />
            ),
          },
          {
            id: "jobs",
            label: `Training jobs (${jobsQuery.data?.jobs?.length ?? 0})`,
            content: (
              <ResourceTable
                resourceName="training job"
                headerTitle="Training jobs"
                items={jobsQuery.data?.jobs || []}
                loading={jobsQuery.isLoading}
                onCreate={() => setShowCreateJob(true)}
                onRefresh={jobsQuery.refetch}
                columns={[
                  { id: "name", header: "Name", cell: (j: SmTrainingJob) => j.TrainingJobName },
                  { id: "status", header: "Status", cell: (j: SmTrainingJob) => j.TrainingJobStatus },
                  {
                    id: "actions",
                    header: "",
                    cell: (j: SmTrainingJob) =>
                      j.TrainingJobStatus === "InProgress" ? (
                        <Button
                          loading={stopJob.isPending}
                          onClick={() =>
                            wrap(
                              () => stopJob.mutateAsync(j.TrainingJobName!),
                              `Stopping ${j.TrainingJobName}.`
                            )
                          }
                        >
                          Stop
                        </Button>
                      ) : null,
                  },
                ]}
              />
            ),
          },
        ]}
      />
      <CreateModelModal
        visible={showCreateModel}
        loading={createModel.isPending}
        onDismiss={() => setShowCreateModel(false)}
        onSubmit={(body) =>
          wrap(
            () =>
              createModel.mutateAsync({
                modelName: body.modelName,
                primaryContainer: { Image: body.image },
                executionRoleArn: body.executionRoleArn,
              }),
            `Model ${body.modelName} created.`
          ).then(() => setShowCreateModel(false))
        }
      />
      <Modal
        visible={showCreateConfig}
        onDismiss={() => setShowCreateConfig(false)}
        header="Create endpoint config"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Config name">
              <Input value={modelName} onChange={({ detail }) => setModelName(detail.value)} placeholder="cfg1" />
            </FormField>
            <FormField label="Container image URI">
              <Input value={configImage} onChange={({ detail }) => setConfigImage(detail.value)} />
            </FormField>
            <FormField label="Instance type">
              <Input value={configInstanceType} onChange={({ detail }) => setConfigInstanceType(detail.value)} />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreateConfig(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!modelName || !configImage}
                  loading={createConfig.isPending}
                  onClick={() =>
                    wrap(
                      () =>
                        createConfig.mutateAsync({
                          endpointConfigName: modelName,
                          productionVariants: [
                            {
                              ModelName: modelName,
                              InstanceType: configInstanceType,
                              InitialInstanceCount: 1,
                              VariantName: "AllTraffic",
                            },
                          ],
                        }),
                      `Config ${modelName} created.`
                    ).then(() => setShowCreateConfig(false))
                  }
                >
                  Create
                </Button>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Form>
      </Modal>
      <Modal
        visible={showCreateEndpoint}
        onDismiss={() => setShowCreateEndpoint(false)}
        header="Create endpoint"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Endpoint name">
              <Input value={epName} onChange={({ detail }) => setEpName(detail.value)} placeholder="ep1" />
            </FormField>
            <FormField label="Endpoint config name">
              <Input value={epConfig} onChange={({ detail }) => setEpConfig(detail.value)} placeholder="cfg1" />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreateEndpoint(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!epName || !epConfig}
                  loading={createEndpoint.isPending}
                  onClick={() =>
                    wrap(
                      () =>
                        createEndpoint.mutateAsync({
                          endpointName: epName,
                          endpointConfigName: epConfig,
                        }),
                      `Endpoint ${epName} created.`
                    ).then(() => setShowCreateEndpoint(false))
                  }
                >
                  Create
                </Button>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Form>
      </Modal>
      <Modal
        visible={showCreateJob}
        onDismiss={() => setShowCreateJob(false)}
        header="Create training job"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Job name">
              <Input value={jobName} onChange={({ detail }) => setJobName(detail.value)} placeholder="job1" />
            </FormField>
            <FormField label="Training image URI">
              <Input value={jobImage} onChange={({ detail }) => setJobImage(detail.value)} />
            </FormField>
            <FormField label="S3 input URI">
              <Input value={jobS3Input} onChange={({ detail }) => setJobS3Input(detail.value)} placeholder="s3://bucket/train" />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreateJob(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!jobName || !jobImage || !jobS3Input}
                  loading={createJob.isPending}
                  onClick={() =>
                    wrap(
                      () =>
                        createJob.mutateAsync({
                          trainingJobName: jobName,
                          algorithmSpecification: {
                            TrainingImage: jobImage,
                            TrainingInputMode: "File",
                          },
                          inputDataConfig: [
                            {
                              ChannelName: "train",
                              DataSource: {
                                S3DataSource: {
                                  S3Uri: jobS3Input,
                                  S3DataType: "S3Prefix",
                                },
                              },
                            },
                          ],
                          outputDataConfig: { S3OutputPath: `s3://bucket/out/${jobName}` },
                        }),
                      `Training job ${jobName} created.`
                    ).then(() => setShowCreateJob(false))
                  }
                >
                  Create
                </Button>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}
