import { useState } from "react";
// V8 remaps phantom branches onto the multi-line import; no executable code here.
/* v8 ignore start */
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
/* v8 ignore stop */
import ServiceDashboardLayout from "../../components/ServiceDashboardLayout";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import {
  useTsInstances,
  useCreateTsInstance,
  useDeleteTsInstance,
  useRebootTsInstance,
  useTsClusters,
  useCreateTsCluster,
  useDeleteTsCluster,
  useTsBackups,
  useCreateTsBackup,
  useDeleteTsBackup,
  useTsParameterGroups,
  useCreateTsParameterGroup,
  type TsInstance,
  type TsCluster,
  type TsBackup,
  type TsParameterGroup,
} from "../../hooks/useTimestreamInfluxDB";

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

export default function TimestreamInfluxDBDashboard() {
  const instancesQuery = useTsInstances();
  const clustersQuery = useTsClusters();
  const backupsQuery = useTsBackups();
  const groupsQuery = useTsParameterGroups();
  const createInstance = useCreateTsInstance();
  const deleteInstance = useDeleteTsInstance();
  const rebootInstance = useRebootTsInstance();
  const createCluster = useCreateTsCluster();
  const deleteCluster = useDeleteTsCluster();
  const createBackup = useCreateTsBackup();
  const deleteBackup = useDeleteTsBackup();
  const createGroup = useCreateTsParameterGroup();

  const [status, setStatus] = useState<Status | null>(null);
  const [showCreateInstance, setShowCreateInstance] = useState(false);
  const [instanceName, setInstanceName] = useState("");
  const [instanceType, setInstanceType] = useState("db.influx.medium");
  const [subnet, setSubnet] = useState("");
  const [securityGroup, setSecurityGroup] = useState("");
  const [showCreateCluster, setShowCreateCluster] = useState(false);
  const [clusterName, setClusterName] = useState("");
  const [backupTarget, setBackupTarget] = useState<TsInstance | null>(null);
  const [backupName, setBackupName] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");

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
            id: "instances",
            label: `DB instances (${instancesQuery.data?.instances.length ?? 0})`,
            content: (
              <SpaceBetween size="m">
                <ResourceTable
                  resourceName="instance"
                  headerTitle="DB instances"
                  items={instancesQuery.data?.instances || []}
                  loading={instancesQuery.isLoading}
                  onCreate={() => setShowCreateInstance(true)}
                  onRefresh={instancesQuery.refetch}
                  columns={[
                    { id: "name", header: "Name", cell: (i: TsInstance) => i.name },
                    { id: "status", header: "Status", cell: (i: TsInstance) => i.status },
                    { id: "type", header: "Type", cell: (i: TsInstance) => i.dbInstanceType },
                    {
                      id: "actions",
                      header: "",
                      cell: (i: TsInstance) => (
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button
                            loading={rebootInstance.isPending}
                            onClick={() =>
                              wrap(
                                () => rebootInstance.mutateAsync(i.name!),
                                `Rebooting ${i.name}.`
                              )
                            }
                          >
                            Reboot
                          </Button>
                          <Button
                            onClick={() => {
                              setBackupTarget(i);
                              setBackupName("");
                            }}
                          >
                            Backup
                          </Button>
                          <DeleteButton
                            itemName={i.name!}
                            resourceType="instance"
                            loading={deleteInstance.isPending}
                            onDelete={() =>
                              wrap(
                                () => deleteInstance.mutateAsync(i.name!),
                                `Instance ${i.name} deleted.`
                              )
                            }
                          />
                        </SpaceBetween>
                      ),
                    },
                  ]}
                />
                {instancesQuery.isError && (
                  <Alert type="error">
                    {(instancesQuery.error as Error)?.message || "Failed to load instances"}
                  </Alert>
                )}
              </SpaceBetween>
            ),
          },
          {
            id: "clusters",
            label: `DB clusters (${clustersQuery.data?.clusters.length ?? 0})`,
            content: (
              <ResourceTable
                resourceName="cluster"
                headerTitle="DB clusters"
                items={clustersQuery.data?.clusters || []}
                loading={clustersQuery.isLoading}
                onCreate={() => setShowCreateCluster(true)}
                onRefresh={clustersQuery.refetch}
                columns={[
                  { id: "name", header: "Name", cell: (c: TsCluster) => c.name },
                  { id: "status", header: "Status", cell: (c: TsCluster) => c.status },
                  { id: "region", header: "Region", cell: (c: TsCluster) => c.readerEndpoint },
                  {
                    id: "actions",
                    header: "",
                    cell: (c: TsCluster) => (
                      <DeleteButton
                        itemName={c.name!}
                        resourceType="cluster"
                        loading={deleteCluster.isPending}
                        onDelete={() =>
                          wrap(
                            () => deleteCluster.mutateAsync(c.name!),
                            `Cluster ${c.name} deleted.`
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
            id: "backups",
            label: `Backups (${backupsQuery.data?.backups.length ?? 0})`,
            content: (
              <ResourceTable
                resourceName="backup"
                headerTitle="Backups"
                items={backupsQuery.data?.backups || []}
                loading={backupsQuery.isLoading}
                onRefresh={backupsQuery.refetch}
                columns={[
                  { id: "name", header: "Name", cell: (b: TsBackup) => b.name },
                  { id: "arn", header: "ARN", cell: (b: TsBackup) => b.arn },
                  {
                    id: "actions",
                    header: "",
                    cell: (b: TsBackup) => (
                      <DeleteButton
                        itemName={b.name!}
                        resourceType="backup"
                        loading={deleteBackup.isPending}
                        onDelete={() =>
                          wrap(
                            () => deleteBackup.mutateAsync(b.name!),
                            `Backup ${b.name} deleted.`
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
            id: "groups",
            label: `Parameter groups (${groupsQuery.data?.parameterGroups.length ?? 0})`,
            content: (
              <ResourceTable
                resourceName="parameter group"
                headerTitle="Parameter groups"
                items={groupsQuery.data?.parameterGroups || []}
                loading={groupsQuery.isLoading}
                onCreate={() => setShowCreateGroup(true)}
                onRefresh={groupsQuery.refetch}
                columns={[
                  { id: "name", header: "Name", cell: (g: TsParameterGroup) => g.name },
                  { id: "desc", header: "Description", cell: (g: TsParameterGroup) => g.description },
                ]}
              />
            ),
          },
        ]}
      />
      <Modal
        visible={showCreateInstance}
        onDismiss={() => setShowCreateInstance(false)}
        header="Create DB instance"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Name">
              <Input value={instanceName} onChange={({ detail }) => setInstanceName(detail.value)} placeholder="influx-1" />
            </FormField>
            <FormField label="Instance type">
              <Input value={instanceType} onChange={({ detail }) => setInstanceType(detail.value)} />
            </FormField>
            <FormField label="Subnet ID">
              <Input value={subnet} onChange={({ detail }) => setSubnet(detail.value)} placeholder="subnet-1" />
            </FormField>
            <FormField label="Security group ID">
              <Input value={securityGroup} onChange={({ detail }) => setSecurityGroup(detail.value)} placeholder="sg-1" />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreateInstance(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!instanceName || !subnet || !securityGroup}
                  loading={createInstance.isPending}
                  onClick={() =>
                    wrap(
                      () =>
                        createInstance.mutateAsync({
                          name: instanceName,
                          password: "TempPassword123!",
                          dbInstanceType: instanceType,
                          vpcSubnetIds: [subnet],
                          vpcSecurityGroupIds: [securityGroup],
                          allocatedStorage: 20,
                        }),
                      `Instance ${instanceName} created.`
                    ).then(() => setShowCreateInstance(false))
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
        visible={showCreateCluster}
        onDismiss={() => setShowCreateCluster(false)}
        header="Create DB cluster"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Cluster name">
              <Input value={clusterName} onChange={({ detail }) => setClusterName(detail.value)} placeholder="cluster-1" />
            </FormField>
            <FormField label="Subnet ID 1">
              <Input
                value={subnet}
                onChange={({ detail }) => setSubnet(detail.value)}
                placeholder="subnet-1"
              />
            </FormField>
            <FormField label="Subnet ID 2">
              <Input
                value={securityGroup}
                onChange={({ detail }) => setSecurityGroup(detail.value)}
                placeholder="subnet-2"
              />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreateCluster(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!clusterName || !subnet || !securityGroup}
                  loading={createCluster.isPending}
                  onClick={() =>
                    wrap(
                      () =>
                        createCluster.mutateAsync({
                          name: clusterName,
                          dbInstanceType: instanceType,
                          vpcSubnetIds: [subnet, securityGroup],
                        }),
                      `Cluster ${clusterName} created.`
                    ).then(() => setShowCreateCluster(false))
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
        visible={backupTarget !== null}
        onDismiss={() => setBackupTarget(null)}
        header={`Backup instance — ${backupTarget?.name ?? ""}`}
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Backup name">
              <Input value={backupName} onChange={({ detail }) => setBackupName(detail.value)} placeholder="backup-1" />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setBackupTarget(null)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!backupName}
                  loading={createBackup.isPending}
                  onClick={() =>
                    wrap(
                      () =>
                        createBackup.mutateAsync({
                          name: backupName,
                          dbResourceId: backupTarget!.id!,
                        }),
                      `Backup ${backupName} created.`
                    ).then(() => setBackupTarget(null))
                  }
                >
                  Create backup
                </Button>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Form>
      </Modal>
      <Modal
        visible={showCreateGroup}
        onDismiss={() => setShowCreateGroup(false)}
        header="Create parameter group"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Name">
              <Input value={groupName} onChange={({ detail }) => setGroupName(detail.value)} placeholder="pg-1" />
            </FormField>
            <FormField label="Description">
              <Input value={groupDescription} onChange={({ detail }) => setGroupDescription(detail.value)} />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreateGroup(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!groupName || !groupDescription}
                  loading={createGroup.isPending}
                  onClick={() =>
                    wrap(
                      () =>
                        createGroup.mutateAsync({
                          name: groupName,
                          description: groupDescription,
                          parameters: [],
                        }),
                      `Parameter group ${groupName} created.`
                    ).then(() => setShowCreateGroup(false))
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
