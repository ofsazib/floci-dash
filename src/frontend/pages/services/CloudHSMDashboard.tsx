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
  useCloudHsmClusters,
  useCloudHsmBackups,
  useCreateCloudHsmCluster,
  useDeleteCloudHsmCluster,
  useDeleteCloudHsmBackup,
} from "../../hooks/useCloudHSM";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";

export function CloudHSMDashboard() {
  const { data, isLoading } = useCloudHsmClusters();
  const { data: backupData, isLoading: backupLoading } = useCloudHsmBackups();
  const createCluster = useCreateCloudHsmCluster();
  const deleteCluster = useDeleteCloudHsmCluster();
  const deleteBackup = useDeleteCloudHsmBackup();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ hsmType: "hsm1.medium", subnets: "subnet-1,subnet-2" });

  const handleCreate = async () => {
    const subnetIds = form.subnets
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!form.hsmType || !subnetIds.length) return;
    try {
      await createCluster.mutateAsync({ hsmType: form.hsmType, subnetIds });
      setShowCreate(false);
      setForm({ hsmType: "hsm1.medium", subnets: "subnet-1,subnet-2" });
    } catch {}
  };

  const clusters = (data as any)?.clusters || [];
  const backups = (backupData as any)?.backups || [];

  return (
    <SpaceBetween size="l">
      <Tabs
        tabs={[
          {
            id: "clusters",
            label: "Clusters",
            content: (
              <ResourceTable
                resourceName="Cluster"
                headerTitle="CloudHSM Clusters"
                headerCounter={(data as any)?.total}
                items={clusters.map((c: any) => ({
                  id: c.ClusterId ?? "",
                  state: c.State || "—",
                  hsmType: c.HsmType || "—",
                  hsmCount: c.Hsms ? Object.keys(c.Hsms).length : 0,
                  vpcId: c.VpcId || "—",
                }))}
                loading={isLoading}
                emptyMessage="No CloudHSM clusters"
                columns={[
                  {
                    id: "id",
                    header: "Cluster ID",
                    cell: (item: any) => <Box>{item.id}</Box>,
                  },
                  {
                    id: "state",
                    header: "State",
                    cell: (item: any) => (
                      <StatusIndicator
                        type={
                          item.state === "ACTIVE" || item.state === "INITIALIZED"
                            ? "success"
                            : item.state === "DELETED" || item.state === "DEGRADED"
                              ? "error"
                              : "in-progress"
                        }
                      >
                        {item.state}
                      </StatusIndicator>
                    ),
                  },
                  { id: "hsmType", header: "HSM Type", cell: (item: any) => item.hsmType },
                  { id: "hsmCount", header: "HSMs", cell: (item: any) => String(item.hsmCount) },
                  { id: "vpcId", header: "VPC", cell: (item: any) => item.vpcId },
                  {
                    id: "actions",
                    header: "",
                    cell: (item: any) => (
                      <DeleteButton
                        itemName={item.id}
                        resourceType="cluster"
                        loading={deleteCluster.isPending}
                        onDelete={async () => {
                          try {
                            await deleteCluster.mutateAsync(item.id);
                          } catch {}
                        }}
                      />
                    ),
                  },
                ]}
                filterEnabled
                filterPlaceholder="Find clusters by ID"
                filterFunction={(i: any, s: string) =>
                  (i.id ?? "").toLowerCase().includes(s.toLowerCase())
                }
                onCreate={() => setShowCreate(true)}
              />
            ),
          },
          {
            id: "backups",
            label: "Backups",
            content: (
              <ResourceTable
                resourceName="Backup"
                headerTitle="CloudHSM Backups"
                headerCounter={(backupData as any)?.total}
                items={backups.map((b: any) => ({
                  id: b.backupId ?? "",
                  clusterId: b.clusterId || "—",
                  state: b.state || "—",
                  created: b.createTimestamp || "—",
                }))}
                loading={backupLoading}
                emptyMessage="No CloudHSM backups"
                columns={[
                  {
                    id: "id",
                    header: "Backup ID",
                    cell: (item: any) => <Box>{item.id}</Box>,
                  },
                  { id: "clusterId", header: "Cluster", cell: (item: any) => item.clusterId },
                  { id: "state", header: "State", cell: (item: any) => item.state },
                  { id: "created", header: "Created", cell: (item: any) => item.created },
                  {
                    id: "actions",
                    header: "",
                    cell: (item: any) => (
                      <DeleteButton
                        itemName={item.id}
                        resourceType="backup"
                        loading={deleteBackup.isPending}
                        onDelete={async () => {
                          try {
                            await deleteBackup.mutateAsync(item.id);
                          } catch {}
                        }}
                      />
                    ),
                  },
                ]}
                filterEnabled
                filterPlaceholder="Find backups by ID"
                filterFunction={(i: any, s: string) =>
                  (i.id ?? "").toLowerCase().includes(s.toLowerCase())
                }
              />
            ),
          },
        ]}
      />

      <Modal visible={showCreate} onDismiss={() => setShowCreate(false)} header="Create Cluster">
        <Form>
          <SpaceBetween size="m">
            <FormField label="HSM Type">
              <Input
                value={form.hsmType}
                onChange={(e) => setForm({ ...form, hsmType: e.detail.value })}
                placeholder="hsm1.medium"
              />
            </FormField>
            <FormField label="Subnet IDs (comma-separated)">
              <Input
                value={form.subnets}
                onChange={(e) => setForm({ ...form, subnets: e.detail.value })}
              />
            </FormField>
            <Button onClick={handleCreate} disabled={createCluster.isPending}>
              Create
            </Button>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}
