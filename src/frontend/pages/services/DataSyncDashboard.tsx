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
  Alert,
} from "@cloudscape-design/components";
import ServiceDashboardLayout from "../../components/ServiceDashboardLayout";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import {
  useDsAgents,
  useCreateDsAgent,
  useDeleteDsAgent,
  useDsLocations,
  useCreateDsLocation,
  useDeleteDsLocation,
  useDsTasks,
  useCreateDsTask,
  useDeleteDsTask,
  type DsAgent,
  type DsLocation,
  type DsTask,
} from "../../hooks/useDataSync";

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

export default function DataSyncDashboard() {
  const agentsQuery = useDsAgents();
  const locationsQuery = useDsLocations();
  const tasksQuery = useDsTasks();
  const createAgent = useCreateDsAgent();
  const deleteAgent = useDeleteDsAgent();
  const createLocation = useCreateDsLocation();
  const deleteLocation = useDeleteDsLocation();
  const createTask = useCreateDsTask();
  const deleteTask = useDeleteDsTask();

  const [status, setStatus] = useState<Status | null>(null);
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [agentKey, setAgentKey] = useState("");
  const [agentName, setAgentName] = useState("");
  const [showCreateLocation, setShowCreateLocation] = useState(false);
  const [blobType, setBlobType] = useState("BLOCK");
  const [containerUrl, setContainerUrl] = useState("");
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [sourceArn, setSourceArn] = useState("");
  const [destinationArn, setDestinationArn] = useState("");

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
            id: "agents",
            label: `Agents (${agentsQuery.data?.agents.length ?? 0})`,
            content: (
              <SpaceBetween size="m">
                <ResourceTable
                  resourceName="agent"
                  headerTitle="Agents"
                  items={agentsQuery.data?.agents || []}
                  loading={agentsQuery.isLoading}
                  onCreate={() => setShowCreateAgent(true)}
                  onRefresh={agentsQuery.refetch}
                  columns={[
                    { id: "arn", header: "ARN", cell: (a: DsAgent) => a.AgentArn },
                    { id: "status", header: "Status", cell: (a: DsAgent) => a.Status },
                    {
                      id: "actions",
                      header: "",
                      cell: (a: DsAgent) => (
                        <DeleteButton
                          itemName={a.AgentArn!}
                          resourceType="agent"
                          loading={deleteAgent.isPending}
                          onDelete={() =>
                            wrap(
                              () => deleteAgent.mutateAsync(a.AgentArn!),
                              "Agent deleted."
                            )
                          }
                        />
                      ),
                    },
                  ]}
                />
                {agentsQuery.isError && (
                  <Alert type="error">
                    {(agentsQuery.error as Error)?.message || "Failed to load agents"}
                  </Alert>
                )}
              </SpaceBetween>
            ),
          },
          {
            id: "locations",
            label: `Locations (${locationsQuery.data?.locations.length ?? 0})`,
            content: (
              <SpaceBetween size="m">
                <ResourceTable
                  resourceName="location"
                  headerTitle="Locations"
                  items={locationsQuery.data?.locations || []}
                  loading={locationsQuery.isLoading}
                  onCreate={() => setShowCreateLocation(true)}
                  onRefresh={locationsQuery.refetch}
                  columns={[
                    { id: "arn", header: "ARN", cell: (l: DsLocation) => l.LocationArn },
                    { id: "uri", header: "URI", cell: (l: DsLocation) => l.LocationUri },
                    {
                      id: "actions",
                      header: "",
                      cell: (l: DsLocation) => (
                        <DeleteButton
                          itemName={l.LocationArn!}
                          resourceType="location"
                          loading={deleteLocation.isPending}
                          onDelete={() =>
                            wrap(
                              () => deleteLocation.mutateAsync(l.LocationArn!),
                              "Location deleted."
                            )
                          }
                        />
                      ),
                    },
                  ]}
                />
              </SpaceBetween>
            ),
          },
          {
            id: "tasks",
            label: `Tasks (${tasksQuery.data?.tasks.length ?? 0})`,
            content: (
              <SpaceBetween size="m">
                <ResourceTable
                  resourceName="task"
                  headerTitle="Tasks"
                  items={tasksQuery.data?.tasks || []}
                  loading={tasksQuery.isLoading}
                  onCreate={() => setShowCreateTask(true)}
                  onRefresh={tasksQuery.refetch}
                  columns={[
                    { id: "arn", header: "ARN", cell: (t: DsTask) => t.TaskArn },
                    { id: "status", header: "Status", cell: (t: DsTask) => t.Status },
                    {
                      id: "actions",
                      header: "",
                      cell: (t: DsTask) => (
                        <DeleteButton
                          itemName={t.TaskArn!}
                          resourceType="task"
                          loading={deleteTask.isPending}
                          onDelete={() =>
                            wrap(
                              () => deleteTask.mutateAsync(t.TaskArn!),
                              "Task deleted."
                            )
                          }
                        />
                      ),
                    },
                  ]}
                />
              </SpaceBetween>
            ),
          },
        ]}
      />
      <Modal
        visible={showCreateAgent}
        onDismiss={() => setShowCreateAgent(false)}
        header="Create agent"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Activation key">
              <Input value={agentKey} onChange={({ detail }) => setAgentKey(detail.value)} placeholder="activ-xxxx" />
            </FormField>
            <FormField label="Agent name (optional)">
              <Input value={agentName} onChange={({ detail }) => setAgentName(detail.value)} placeholder="agent-1" />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreateAgent(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!agentKey}
                  loading={createAgent.isPending}
                  onClick={() =>
                    wrap(
                      () =>
                        createAgent.mutateAsync({
                          activationKey: agentKey,
                          agentName: agentName || undefined,
                        }),
                      "Agent created."
                    ).then(() => setShowCreateAgent(false))
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
        visible={showCreateLocation}
        onDismiss={() => setShowCreateLocation(false)}
        header="Create Azure Blob location"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Blob type">
              <Input value={blobType} onChange={({ detail }) => setBlobType(detail.value)} />
            </FormField>
            <FormField label="Container URL">
              <Input value={containerUrl} onChange={({ detail }) => setContainerUrl(detail.value)} placeholder="https://acct.blob.core.windows.net/container" />
            </FormField>
            <FormField label="Agent ARN">
              <Input
                value={agentsQuery.data?.agents[0]?.AgentArn ?? ""}
                readOnly
              />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreateLocation(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!containerUrl || !agentsQuery.data?.agents[0]?.AgentArn}
                  loading={createLocation.isPending}
                  onClick={() =>
                    wrap(
                      () =>
                        createLocation.mutateAsync({
                          blobType,
                          containerUrl,
                          agentArns: [agentsQuery.data!.agents[0].AgentArn!],
                          authenticationType: "SAS",
                        }),
                      "Location created."
                    ).then(() => setShowCreateLocation(false))
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
        visible={showCreateTask}
        onDismiss={() => setShowCreateTask(false)}
        header="Create task"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Task name (optional)">
              <Input value={taskName} onChange={({ detail }) => setTaskName(detail.value)} placeholder="task-1" />
            </FormField>
            <FormField label="Source location ARN">
              <Input value={sourceArn} onChange={({ detail }) => setSourceArn(detail.value)} placeholder="arn:aws:datasync::…" />
            </FormField>
            <FormField label="Destination location ARN">
              <Input value={destinationArn} onChange={({ detail }) => setDestinationArn(detail.value)} placeholder="arn:aws:datasync::…" />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreateTask(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!sourceArn || !destinationArn}
                  loading={createTask.isPending}
                  onClick={() =>
                    wrap(
                      () =>
                        createTask.mutateAsync({
                          sourceLocationArn: sourceArn,
                          destinationLocationArn: destinationArn,
                          name: taskName || undefined,
                        }),
                      "Task created."
                    ).then(() => setShowCreateTask(false))
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
