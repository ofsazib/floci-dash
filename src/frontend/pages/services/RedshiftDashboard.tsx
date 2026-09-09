import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormField,
  Header,
  Input,
  Modal,
  Select,
  SpaceBetween,
  StatusIndicator,
  Tabs,
  Textarea,
} from "@cloudscape-design/components";
import {
  useRedshiftClusters,
  useCreateRedshiftCluster,
  useDeleteRedshiftCluster,
  useModifyRedshiftCluster,
  useRebootRedshiftCluster,
  useRedshiftSnapshots,
  useCreateRedshiftSnapshot,
  useDeleteRedshiftSnapshot,
  useRestoreRedshiftSnapshot,
  useRedshiftParameterGroups,
  useCreateRedshiftParameterGroup,
  useRedshiftParameters,
  useModifyRedshiftParameterGroup,
  useDeleteRedshiftParameterGroup,
  useRedshiftSubnetGroups,
  useCreateRedshiftSubnetGroup,
  useModifyRedshiftSubnetGroup,
  useDeleteRedshiftSubnetGroup,
  useRedshiftTagResource,
  useRedshiftUntagResource,
} from "../../hooks/useRedshift";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import { useToast } from "../../components/Toast";

const NODE_TYPE_OPTIONS = [
  "ra3.xlplus",
  "ra3.4xlarge",
  "ra3.16xlarge",
  "dc2.large",
  "dc2.8xlarge",
].map((v) => ({ label: v, value: v }));

function statusIndicator(status: string | undefined) {
  const s = status || "UNKNOWN";
  const color =
    s === "available" ? "success" : s === "creating" || s === "modifying" ? "in-progress" : "error";
  return <StatusIndicator type={color as any}>{s}</StatusIndicator>;
}

/** Snapshots tab — list, create, delete, restore. */
function SnapshotsTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useRedshiftSnapshots();
  const createSnap = useCreateRedshiftSnapshot();
  const deleteSnap = useDeleteRedshiftSnapshot();
  const restoreSnap = useRestoreRedshiftSnapshot();
  const [showCreate, setShowCreate] = useState(false);
  const [showRestore, setShowRestore] = useState<string | null>(null);
  const [clusterId, setClusterId] = useState("");
  const [snapId, setSnapId] = useState("");
  const [targetId, setTargetId] = useState("");

  const snapshots: any[] = data?.snapshots || [];
  const canCreate = clusterId.trim().length > 0 && snapId.trim().length > 0;
  const canRestore = targetId.trim().length > 0;

  const doCreate = async () => {
    try {
      await createSnap.mutateAsync({
        identifier: clusterId.trim(),
        snapshotIdentifier: snapId.trim(),
      });
      showToast("success", `Snapshot ${snapId.trim()} created`);
      setShowCreate(false);
      setClusterId("");
      setSnapId("");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to create snapshot");
    }
  };

  const doDelete = async (id: string) => {
    try {
      await deleteSnap.mutateAsync(id);
      showToast("success", "Snapshot deleted");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete snapshot");
    }
  };

  const doRestore = async () => {
    try {
      await restoreSnap.mutateAsync({
        snapshotIdentifier: showRestore,
        targetIdentifier: targetId.trim(),
      });
      showToast("success", `Restore started for ${targetId.trim()}`);
      setShowRestore(null);
      setTargetId("");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to restore from snapshot");
    }
  };

  return (
    <Box>
      <SpaceBetween direction="vertical" size="s">
        <div>
          <Button onClick={() => setShowCreate(true)}>Create snapshot</Button>
        </div>
        <ResourceTable
          resourceName="snapshot"
          headerTitle="Cluster snapshots"
          loading={isLoading}
          items={snapshots}
          columns={[
            { id: "id", header: "Snapshot identifier", cell: (s: any) => s.SnapshotIdentifier },
            { id: "cluster", header: "Cluster", cell: (s: any) => s.ClusterIdentifier },
            { id: "status", header: "Status", cell: (s: any) => statusIndicator(s.Status) },
            { id: "type", header: "Type", cell: (s: any) => s.SnapshotType },
            {
              id: "actions",
              header: "Actions",
              cell: (s: any) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <Button onClick={() => setShowRestore(s.SnapshotIdentifier)}>Restore</Button>
                  <DeleteButton
                    resourceType="snapshot"
                    itemName={s.SnapshotIdentifier}
                    onDelete={() => doDelete(s.SnapshotIdentifier)}
                  />
                </SpaceBetween>
              ),
            },
          ]}
          emptyMessage="No snapshots"
        />
      </SpaceBetween>
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create snapshot"
      >
        {showCreate && (
          <SpaceBetween direction="vertical" size="m">
            <FormField label="Cluster identifier">
              <Input value={clusterId} onChange={({ detail }) => setClusterId(detail.value)} />
            </FormField>
            <FormField label="Snapshot identifier">
              <Input value={snapId} onChange={({ detail }) => setSnapId(detail.value)} />
            </FormField>
            <Button variant="primary" disabled={!canCreate} onClick={doCreate}>
              Create snapshot
            </Button>
          </SpaceBetween>
        )}
      </Modal>
      <Modal
        visible={!!showRestore}
        onDismiss={() => setShowRestore(null)}
        header={`Restore from ${showRestore || ""}`}
      >
        {showRestore && (
          <SpaceBetween direction="vertical" size="m">
            <FormField label="New cluster identifier">
              <Input value={targetId} onChange={({ detail }) => setTargetId(detail.value)} />
            </FormField>
            <Button variant="primary" disabled={!canRestore} onClick={doRestore}>
              Restore cluster
            </Button>
          </SpaceBetween>
        )}
      </Modal>
    </Box>
  );
}

/** Parameter groups tab — list, create, view parameters, modify, delete. */
function ParameterGroupsTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useRedshiftParameterGroups();
  const createPg = useCreateRedshiftParameterGroup();
  const deletePg = useDeleteRedshiftParameterGroup();
  const modifyPg = useModifyRedshiftParameterGroup();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [family, setFamily] = useState("redshift-1.0");
  const [description, setDescription] = useState("");
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [paramValue, setParamValue] = useState("");
  const [editingParam, setEditingParam] = useState<string | null>(null);

  const groups: any[] = data?.parameterGroups || [];
  const canCreate = name.trim().length > 0;

  const doCreate = async () => {
    try {
      await createPg.mutateAsync({
        name: name.trim(),
        family,
        description: description.trim() || undefined,
      });
      showToast("success", `Parameter group ${name.trim()} created`);
      setShowCreate(false);
      setName("");
      setDescription("");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to create parameter group");
    }
  };

  const doDelete = async (n: string) => {
    try {
      await deletePg.mutateAsync(n);
      showToast("success", "Parameter group deleted");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete parameter group");
    }
  };

  return (
    <Box>
      <SpaceBetween direction="vertical" size="s">
        <div>
          <Button onClick={() => setShowCreate(true)}>Create parameter group</Button>
        </div>
        <ResourceTable
          resourceName="parameter group"
          headerTitle="Parameter groups"
          loading={isLoading}
          items={groups}
          columns={[
            { id: "name", header: "Name", cell: (g: any) => g.ParameterGroupName },
            { id: "family", header: "Family", cell: (g: any) => g.ParameterGroupFamily },
            { id: "desc", header: "Description", cell: (g: any) => g.Description || "—" },
            {
              id: "actions",
              header: "Actions",
              cell: (g: any) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <Button onClick={() => setSelectedName(g.ParameterGroupName)}>Parameters</Button>
                  <DeleteButton
                    resourceType="parameter group"
                    itemName={g.ParameterGroupName}
                    onDelete={() => doDelete(g.ParameterGroupName)}
                  />
                </SpaceBetween>
              ),
            },
          ]}
          emptyMessage="No parameter groups"
        />
      </SpaceBetween>
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create parameter group"
      >
        {showCreate && (
          <SpaceBetween direction="vertical" size="m">
            <FormField label="Name">
              <Input value={name} onChange={({ detail }) => setName(detail.value)} />
            </FormField>
            <FormField label="Parameter group family">
              <Select
                selectedOption={{ label: family, value: family }}
                options={["redshift-1.0", "redshift-2.0"].map((v) => ({ label: v, value: v }))}
                onChange={({ detail }) => setFamily(detail.selectedOption.value!)}
              />
            </FormField>
            <FormField label="Description (optional)">
              <Input value={description} onChange={({ detail }) => setDescription(detail.value)} />
            </FormField>
            <Button variant="primary" disabled={!canCreate} onClick={doCreate}>
              Create parameter group
            </Button>
          </SpaceBetween>
        )}
      </Modal>
      <Modal
        visible={!!selectedName}
        onDismiss={() => {
          setSelectedName(null);
          setEditingParam(null);
        }}
        header={`Parameters — ${selectedName || ""}`}
        size="large"
      >
        {selectedName && (
          <ParametersPanel
            groupName={selectedName}
            editingParam={editingParam}
            setEditingParam={setEditingParam}
            paramValue={paramValue}
            setParamValue={setParamValue}
          />
        )}
      </Modal>
    </Box>
  );
}

/** Parameters list inside a parameter group with inline value editing. */
function ParametersPanel({
  groupName,
  editingParam,
  setEditingParam,
  paramValue,
  setParamValue,
}: {
  groupName: string;
  editingParam: string | null;
  setEditingParam: (v: string | null) => void;
  paramValue: string;
  setParamValue: (v: string) => void;
}) {
  const { showToast } = useToast();
  const { data, isLoading } = useRedshiftParameters(groupName);
  const modifyPg = useModifyRedshiftParameterGroup();

  const parameters: any[] = data?.parameters || [];

  const doSave = async (paramName: string) => {
    try {
      await modifyPg.mutateAsync({
        name: groupName,
        parameters: [{ name: paramName, value: paramValue.trim() }],
      });
      showToast("success", `Parameter ${paramName} updated`);
      setEditingParam(null);
      setParamValue("");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to update parameter");
    }
  };

  return (
    <ResourceTable
      resourceName="parameter"
      headerTitle="Parameters"
      loading={isLoading}
      items={parameters}
      columns={[
        { id: "name", header: "Name", cell: (p: any) => p.ParameterName },
        { id: "value", header: "Value", cell: (p: any) => p.ParameterValue || "—" },
        {
          id: "actions",
          header: "Actions",
          cell: (p: any) =>
            editingParam === p.ParameterName ? (
              <SpaceBetween direction="horizontal" size="xs">
                <Input
                  value={paramValue}
                  onChange={({ detail }) => setParamValue(detail.value)}
                  placeholder="New value"
                />
                <Button
                  variant="primary"
                  disabled={paramValue.trim().length === 0}
                  onClick={() => doSave(p.ParameterName)}
                >
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setEditingParam(null);
                    setParamValue("");
                  }}
                >
                  Cancel
                </Button>
              </SpaceBetween>
            ) : (
              <Button
                onClick={() => {
                  setEditingParam(p.ParameterName);
                  setParamValue(p.ParameterValue || "");
                }}
              >
                Edit
              </Button>
            ),
        },
      ]}
      emptyMessage="No parameters"
    />
  );
}

/** Subnet groups tab — list, create, modify, delete. */
function SubnetGroupsTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useRedshiftSubnetGroups();
  const createSg = useCreateRedshiftSubnetGroup();
  const modifySg = useModifyRedshiftSubnetGroup();
  const deleteSg = useDeleteRedshiftSubnetGroup();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subnetIds, setSubnetIds] = useState("");
  const [editName, setEditName] = useState<string | null>(null);
  const [editSubnetIds, setEditSubnetIds] = useState("");

  const groups: any[] = data?.subnetGroups || [];
  const canCreate = name.trim().length > 0 && subnetIds.trim().length > 0;
  const canEdit = editSubnetIds.trim().length > 0;

  const doCreate = async () => {
    try {
      await createSg.mutateAsync({
        name: name.trim(),
        subnetIds: subnetIds.split(",").map((s) => s.trim()).filter(Boolean),
        description: description.trim() || undefined,
      });
      showToast("success", `Subnet group ${name.trim()} created`);
      setShowCreate(false);
      setName("");
      setDescription("");
      setSubnetIds("");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to create subnet group");
    }
  };

  const doEdit = async () => {
    try {
      await modifySg.mutateAsync({
        name: editName!,
        subnetIds: editSubnetIds.split(",").map((s) => s.trim()).filter(Boolean),
      });
      showToast("success", "Subnet group updated");
      setEditName(null);
      setEditSubnetIds("");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to update subnet group");
    }
  };

  const doDelete = async (n: string) => {
    try {
      await deleteSg.mutateAsync(n);
      showToast("success", "Subnet group deleted");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete subnet group");
    }
  };

  return (
    <Box>
      <SpaceBetween direction="vertical" size="s">
        <div>
          <Button onClick={() => setShowCreate(true)}>Create subnet group</Button>
        </div>
        <ResourceTable
          resourceName="subnet group"
          headerTitle="Cluster subnet groups"
          loading={isLoading}
          items={groups}
          columns={[
            { id: "name", header: "Name", cell: (g: any) => g.ClusterSubnetGroupName },
            { id: "status", header: "Status", cell: (g: any) => g.SubnetGroupStatus },
            { id: "desc", header: "Description", cell: (g: any) => g.Description || "—" },
            {
              id: "actions",
              header: "Actions",
              cell: (g: any) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    onClick={() => {
                      setEditName(g.ClusterSubnetGroupName);
                      setEditSubnetIds("");
                    }}
                  >
                    Edit
                  </Button>
                  <DeleteButton
                    resourceType="subnet group"
                    itemName={g.ClusterSubnetGroupName}
                    onDelete={() => doDelete(g.ClusterSubnetGroupName)}
                  />
                </SpaceBetween>
              ),
            },
          ]}
          emptyMessage="No subnet groups"
        />
      </SpaceBetween>
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create subnet group"
      >
        {showCreate && (
          <SpaceBetween direction="vertical" size="m">
            <FormField label="Name">
              <Input value={name} onChange={({ detail }) => setName(detail.value)} />
            </FormField>
            <FormField label="Description (optional)">
              <Input value={description} onChange={({ detail }) => setDescription(detail.value)} />
            </FormField>
            <FormField label="Subnet IDs (comma-separated)">
              <Textarea value={subnetIds} onChange={({ detail }) => setSubnetIds(detail.value)} />
            </FormField>
            <Button variant="primary" disabled={!canCreate} onClick={doCreate}>
              Create subnet group
            </Button>
          </SpaceBetween>
        )}
      </Modal>
      <Modal
        visible={!!editName}
        onDismiss={() => setEditName(null)}
        header={`Edit subnet group — ${editName || ""}`}
      >
        {editName && (
          <SpaceBetween direction="vertical" size="m">
            <FormField label="Subnet IDs (comma-separated)">
              <Textarea
                value={editSubnetIds}
                onChange={({ detail }) => setEditSubnetIds(detail.value)}
              />
            </FormField>
            <Button variant="primary" disabled={!canEdit} onClick={doEdit}>
              Update subnet group
            </Button>
          </SpaceBetween>
        )}
      </Modal>
    </Box>
  );
}

export function RedshiftDashboard() {
  const { showToast } = useToast();
  const { data, isLoading } = useRedshiftClusters();
  const createCluster = useCreateRedshiftCluster();
  const modifyCluster = useModifyRedshiftCluster();
  const rebootCluster = useRebootRedshiftCluster();
  const deleteCluster = useDeleteRedshiftCluster();
  const tagResource = useRedshiftTagResource();
  const untagResource = useRedshiftUntagResource();
  const [showCreate, setShowCreate] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [nodeType, setNodeType] = useState("ra3.xlplus");
  const [masterUsername, setMasterUsername] = useState("admin");
  const [masterUserPassword, setMasterUserPassword] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modifyNodeType, setModifyNodeType] = useState("");
  const [tagKey, setTagKey] = useState("");
  const [tagValue, setTagValue] = useState("");

  const clusters: any[] = data?.clusters || [];
  const canCreate =
    identifier.trim().length > 0 &&
    masterUsername.trim().length > 0 &&
    masterUserPassword.trim().length > 0;

  const doCreate = async () => {
    try {
      await createCluster.mutateAsync({
        identifier: identifier.trim(),
        nodeType,
        masterUsername: masterUsername.trim(),
        masterUserPassword: masterUserPassword,
      });
      showToast("success", `Cluster ${identifier.trim()} created`);
      setShowCreate(false);
      setIdentifier("");
      setMasterUserPassword("");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to create cluster");
    }
  };

  const doModify = async () => {
    try {
      await modifyCluster.mutateAsync({
        id: selectedId!,
        nodeType: modifyNodeType || undefined,
      });
      showToast("success", "Cluster modified");
      setSelectedId(null);
      setModifyNodeType("");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to modify cluster");
    }
  };

  const doReboot = async (id: string) => {
    try {
      await rebootCluster.mutateAsync(id);
      showToast("success", `Cluster ${id} reboot initiated`);
    } catch (e: any) {
      showToast("error", e?.message || "Failed to reboot cluster");
    }
  };

  const doDelete = async (id: string) => {
    try {
      await deleteCluster.mutateAsync(id);
      showToast("success", "Cluster deleted");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete cluster");
    }
  };

  const doTag = async (arn: string) => {
    try {
      await tagResource.mutateAsync({
        resourceName: arn,
        tags: [{ key: tagKey.trim(), value: tagValue.trim() }],
      });
      showToast("success", `Tag ${tagKey.trim()} added`);
      setTagKey("");
      setTagValue("");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to add tag");
    }
  };

  const doUntag = async (arn: string, key: string) => {
    try {
      await untagResource.mutateAsync({ resourceName: arn, tagKeys: [key] });
      showToast("success", `Tag ${key} removed`);
    } catch (e: any) {
      showToast("error", e?.message || "Failed to remove tag");
    }
  };

  return (
    <Box>
      <SpaceBetween direction="vertical" size="m">
        <Header variant="h1">Amazon Redshift</Header>
        <ResourceTable
          resourceName="Redshift cluster"
          headerTitle="Clusters"
          loading={isLoading}
          items={clusters}
          onCreate={() => setShowCreate(true)}
          columns={[
            { id: "id", header: "Cluster identifier", cell: (c: any) => c.ClusterIdentifier },
            { id: "status", header: "Status", cell: (c: any) => statusIndicator(c.ClusterStatus) },
            { id: "node", header: "Node type", cell: (c: any) => c.NodeType },
            { id: "nodes", header: "Nodes", cell: (c: any) => c.NumberOfNodes },
            { id: "endpoint", header: "Endpoint", cell: (c: any) => c.Endpoint?.Address || "—" },
            {
              id: "actions",
              header: "Actions",
              cell: (c: any) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <Button onClick={() => setSelectedId(c.ClusterIdentifier)}>Details</Button>
                  <Button onClick={() => doReboot(c.ClusterIdentifier)}>Reboot</Button>
                  <DeleteButton
                    resourceType="cluster"
                    itemName={c.ClusterIdentifier}
                    onDelete={() => doDelete(c.ClusterIdentifier)}
                  />
                </SpaceBetween>
              ),
            },
          ]}
          emptyMessage="No Redshift clusters. Create one to get started."
        />
      </SpaceBetween>

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create Redshift cluster"
      >
        {showCreate && (
          <SpaceBetween direction="vertical" size="m">
            <FormField label="Cluster identifier">
              <Input value={identifier} onChange={({ detail }) => setIdentifier(detail.value)} />
            </FormField>
            <FormField label="Node type">
              <Select
                selectedOption={NODE_TYPE_OPTIONS.find((o) => o.value === nodeType)!}
                options={NODE_TYPE_OPTIONS}
                onChange={({ detail }) => setNodeType(detail.selectedOption.value!)}
              />
            </FormField>
            <FormField label="Master username">
              <Input
                value={masterUsername}
                onChange={({ detail }) => setMasterUsername(detail.value)}
              />
            </FormField>
            <FormField label="Master user password">
              <Input
                type="password"
                value={masterUserPassword}
                onChange={({ detail }) => setMasterUserPassword(detail.value)}
              />
            </FormField>
            <Button variant="primary" disabled={!canCreate} onClick={doCreate}>
              Create cluster
            </Button>
          </SpaceBetween>
        )}
      </Modal>

      <Modal
        visible={!!selectedId}
        onDismiss={() => setSelectedId(null)}
        header={`Cluster details — ${selectedId || ""}`}
        size="large"
      >
        {selectedId && (
          <Tabs
            tabs={[
              {
                id: "modify",
                label: "Modify",
                content: (
                  <SpaceBetween direction="vertical" size="m">
                    <FormField label="Node type">
                      <Select
                        selectedOption={
                          NODE_TYPE_OPTIONS.find((o) => o.value === modifyNodeType) || {
                            label: "Keep current",
                            value: "",
                          }
                        }
                        options={[{ label: "Keep current", value: "" }, ...NODE_TYPE_OPTIONS]}
                        onChange={({ detail }) => setModifyNodeType(detail.selectedOption.value!)}
                      />
                    </FormField>
                    <Button variant="primary" onClick={doModify}>
                      Apply changes
                    </Button>
                  </SpaceBetween>
                ),
              },
              {
                id: "tags",
                label: "Tags",
                content: (
                  <SpaceBetween direction="vertical" size="m">
                    <SpaceBetween direction="horizontal" size="xs">
                      <Input
                        value={tagKey}
                        onChange={({ detail }) => setTagKey(detail.value)}
                        placeholder="Tag key"
                      />
                      <Input
                        value={tagValue}
                        onChange={({ detail }) => setTagValue(detail.value)}
                        placeholder="Tag value"
                      />
                      <Button
                        variant="primary"
                        disabled={tagKey.trim().length === 0}
                        onClick={() =>
                          doTag(`arn:aws:redshift:local:000000000000:cluster:${selectedId}`)
                        }
                      >
                        Add tag
                      </Button>
                    </SpaceBetween>
                    {(() => {
                      const cluster = clusters.find((c) => c.ClusterIdentifier === selectedId);
                      const tags: any[] = cluster?.Tags || [];
                      if (tags.length === 0) return <Alert>No tags on this cluster.</Alert>;
                      return (
                        <SpaceBetween direction="vertical" size="xs">
                          {tags.map((t: any) => (
                            <SpaceBetween key={t.Key} direction="horizontal" size="xs">
                              <Box>
                                {t.Key} = {t.Value}
                              </Box>
                              <Button
                                onClick={() =>
                                  doUntag(
                                    `arn:aws:redshift:local:000000000000:cluster:${selectedId}`,
                                    t.Key
                                  )
                                }
                              >
                                Remove
                              </Button>
                            </SpaceBetween>
                          ))}
                        </SpaceBetween>
                      );
                    })()}
                  </SpaceBetween>
                ),
              },
              { id: "snapshots", label: "Snapshots", content: <SnapshotsTab /> },
              { id: "parameter-groups", label: "Parameter groups", content: <ParameterGroupsTab /> },
              { id: "subnet-groups", label: "Subnet groups", content: <SubnetGroupsTab /> },
            ]}
          />
        )}
      </Modal>
    </Box>
  );
}

export default RedshiftDashboard;
