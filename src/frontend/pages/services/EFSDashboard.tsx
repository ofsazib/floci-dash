import { useState } from "react";
import {
  Button,
  FormField,
  Input,
  Modal,
  Select,
  SpaceBetween,
  StatusIndicator,
  Tabs,
  Toggle,
} from "@cloudscape-design/components";
import {
  useEfsFileSystems,
  useEfsMountTargets,
  useEfsAccessPoints,
  useEfsTags,
  useCreateEfsFileSystem,
  useDeleteEfsFileSystem,
  useCreateEfsMountTarget,
  useDeleteEfsMountTarget,
  useCreateEfsAccessPoint,
  useDeleteEfsAccessPoint,
  useCreateEfsTags,
  useDeleteEfsTags,
} from "../../hooks/useEFS";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import { useToast } from "../../components/Toast";

const PERFORMANCE_OPTIONS = ["generalPurpose", "maxIO"].map((v) => ({
  label: v,
  value: v,
}));

const THROUGHPUT_OPTIONS = ["bursting", "provisioned", "elastic"].map((v) => ({
  label: v,
  value: v,
}));

/** Mount targets tab for a file system. */
function MountTargetsTab({ fileSystemId }: { fileSystemId: string }) {
  const { showToast } = useToast();
  const { data, isLoading } = useEfsMountTargets(fileSystemId);
  const createMt = useCreateEfsMountTarget();
  const deleteMt = useDeleteEfsMountTarget();
  const [showCreate, setShowCreate] = useState(false);
  const [subnetId, setSubnetId] = useState("");
  const [ipAddress, setIpAddress] = useState("");

  const mountTargets: any[] = data?.mountTargets || [];
  const canCreate = subnetId.trim().length > 0;

  const doCreate = async () => {
    try {
      await createMt.mutateAsync({
        fileSystemId,
        subnetId: subnetId.trim(),
        ipAddress: ipAddress.trim() || undefined,
      });
      showToast("success", "Mount target created");
      setShowCreate(false);
      setSubnetId("");
      setIpAddress("");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to create mount target");
    }
  };

  const doDelete = async (id: string) => {
    try {
      await deleteMt.mutateAsync(id);
      showToast("success", "Mount target deleted");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete mount target");
    }
  };

  return (
    <SpaceBetween direction="vertical" size="s">
      <div>
        <Button onClick={() => setShowCreate(true)}>Create mount target</Button>
      </div>
      <ResourceTable
        resourceName="mount target"
        headerTitle="Mount targets"
        loading={isLoading}
        items={mountTargets.map((mt) => ({
          id: mt.MountTargetId,
          subnetId: mt.SubnetId,
          ipAddress: mt.IpAddress || "—",
          state: mt.LifeCycleState || "—",
          delete: (
            <DeleteButton
              itemName={mt.MountTargetId}
              resourceType="mount target"
              onDelete={() => doDelete(mt.MountTargetId)}
            />
          ),
        }))}
        columns={[
          { id: "id", header: "Mount target ID", cell: (mt: any) => mt.id },
          { id: "subnetId", header: "Subnet", cell: (mt: any) => mt.subnetId },
          { id: "ipAddress", header: "IP address", cell: (mt: any) => mt.ipAddress },
          { id: "state", header: "State", cell: (mt: any) => mt.state },
          { id: "delete", header: "", cell: (mt: any) => mt.delete },
        ]}
      />
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create mount target"
      >
        <SpaceBetween direction="vertical" size="m">
          <FormField label="Subnet ID">
            <Input value={subnetId} onChange={(e) => setSubnetId(e.detail.value)} />
          </FormField>
          <FormField label="IP address (optional)">
            <Input value={ipAddress} onChange={(e) => setIpAddress(e.detail.value)} />
          </FormField>
          <Button variant="primary" disabled={!canCreate} onClick={doCreate}>
            Confirm mount target
          </Button>
        </SpaceBetween>
      </Modal>
    </SpaceBetween>
  );
}

/** Access points tab for a file system. */
function AccessPointsTab({ fileSystemId }: { fileSystemId: string }) {
  const { showToast } = useToast();
  const { data, isLoading } = useEfsAccessPoints(fileSystemId);
  const createAp = useCreateEfsAccessPoint();
  const deleteAp = useDeleteEfsAccessPoint();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");

  const accessPoints: any[] = data?.accessPoints || [];

  const doCreate = async () => {
    try {
      await createAp.mutateAsync({
        clientToken: `ap-${Date.now()}`,
        fileSystemId,
        name: name.trim() || undefined,
      });
      showToast("success", "Access point created");
      setShowCreate(false);
      setName("");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to create access point");
    }
  };

  const doDelete = async (id: string) => {
    try {
      await deleteAp.mutateAsync(id);
      showToast("success", "Access point deleted");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete access point");
    }
  };

  return (
    <SpaceBetween direction="vertical" size="s">
      <div>
        <Button onClick={() => setShowCreate(true)}>Create access point</Button>
      </div>
      <ResourceTable
        resourceName="access point"
        headerTitle="Access points"
        loading={isLoading}
        items={accessPoints.map((ap) => ({
          id: ap.AccessPointId,
          name: ap.Name || "—",
          state: ap.LifeCycleState || "—",
          delete: (
            <DeleteButton
              itemName={ap.AccessPointId}
              resourceType="access point"
              onDelete={() => doDelete(ap.AccessPointId)}
            />
          ),
        }))}
        columns={[
          { id: "id", header: "Access point ID", cell: (ap: any) => ap.id },
          { id: "name", header: "Name", cell: (ap: any) => ap.name },
          { id: "state", header: "State", cell: (ap: any) => ap.state },
          { id: "delete", header: "", cell: (ap: any) => ap.delete },
        ]}
      />
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create access point"
      >
        <SpaceBetween direction="vertical" size="m">
          <FormField label="Name (optional)">
            <Input value={name} onChange={(e) => setName(e.detail.value)} />
          </FormField>
          <Button variant="primary" onClick={doCreate}>
            Confirm access point
          </Button>
        </SpaceBetween>
      </Modal>
    </SpaceBetween>
  );
}

/** Tags tab for a file system. */
function TagsTab({ fileSystemId }: { fileSystemId: string }) {
  const { showToast } = useToast();
  const { data, isLoading } = useEfsTags(fileSystemId);
  const createTags = useCreateEfsTags();
  const deleteTags = useDeleteEfsTags();
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const tags: any[] = data?.tags || [];

  const doAdd = async () => {
    try {
      await createTags.mutateAsync({
        fileSystemId,
        tags: [{ Key: key.trim(), Value: value.trim() }],
      });
      showToast("success", "Tag added");
      setKey("");
      setValue("");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to add tag");
    }
  };

  const doDelete = async (tagKey: string) => {
    try {
      await deleteTags.mutateAsync({ fileSystemId, tagKeys: [tagKey] });
      showToast("success", "Tag removed");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to remove tag");
    }
  };

  return (
    <SpaceBetween direction="vertical" size="s">
      <ResourceTable
        resourceName="tag"
        headerTitle="Tags"
        loading={isLoading}
        items={tags.map((t) => ({
          key: t.Key,
          value: t.Value,
          delete: (
            <DeleteButton
              itemName={t.Key}
              resourceType="tag"
              onDelete={() => doDelete(t.Key)}
            />
          ),
        }))}
        columns={[
          { id: "key", header: "Key", cell: (t: any) => t.key },
          { id: "value", header: "Value", cell: (t: any) => t.value },
          { id: "delete", header: "", cell: (t: any) => t.delete },
        ]}
      />
      <SpaceBetween direction="horizontal" size="s">
        <FormField label="Key">
          <Input value={key} onChange={(e) => setKey(e.detail.value)} />
        </FormField>
        <FormField label="Value">
          <Input value={value} onChange={(e) => setValue(e.detail.value)} />
        </FormField>
        <Button variant="primary" disabled={!key.trim()} onClick={doAdd}>
          Add tag
        </Button>
      </SpaceBetween>
    </SpaceBetween>
  );
}

export default function EFSDashboard() {
  const { showToast } = useToast();
  const { data, isLoading } = useEfsFileSystems();
  const createFs = useCreateEfsFileSystem();
  const deleteFs = useDeleteEfsFileSystem();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [performanceMode, setPerformanceMode] = useState<any>(PERFORMANCE_OPTIONS[0]);
  const [throughputMode, setThroughputMode] = useState<any>(THROUGHPUT_OPTIONS[0]);
  const [encrypted, setEncrypted] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fileSystems: any[] = data?.fileSystems || [];
  const selected = fileSystems.find((f) => f.FileSystemId === selectedId);

  const doCreate = async () => {
    try {
      const token = `fs-${Date.now()}`;
      await createFs.mutateAsync({
        creationToken: token,
        performanceMode: performanceMode.value,
        throughputMode: throughputMode.value,
        encrypted,
        tags: name.trim() ? [{ Key: "Name", Value: name.trim() }] : undefined,
      });
      showToast("success", "File system created");
      setShowCreate(false);
      setName("");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to create file system");
    }
  };

  const doDelete = async (id: string) => {
    try {
      await deleteFs.mutateAsync(id);
      showToast("success", "File system deleted");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete file system");
    }
  };

  return (
    <SpaceBetween direction="vertical" size="s">
      <ResourceTable
        resourceName="file system"
        headerTitle="Elastic File Systems"
        loading={isLoading}
        items={fileSystems.map((f) => ({
          id: f.FileSystemId,
          name: f.Name || "—",
          state: f.LifeCycleState || "—",
          encrypted: f.Encrypted ? "Yes" : "No",
          mountTargets: String(f.NumberOfMountTargets ?? 0),
          size: String(f.SizeInBytes?.Value ?? 0),
          actions: (
            <SpaceBetween direction="horizontal" size="s">
              <Button onClick={() => setSelectedId(f.FileSystemId)}>Details</Button>
              <DeleteButton
                itemName={f.FileSystemId}
                resourceType="file system"
                onDelete={() => doDelete(f.FileSystemId)}
              />
            </SpaceBetween>
          ),
        }))}
        columns={[
          { id: "id", header: "File system ID", cell: (f: any) => f.id },
          { id: "name", header: "Name", cell: (f: any) => f.name },
          { id: "state", header: "State", cell: (f: any) => f.state },
          { id: "encrypted", header: "Encrypted", cell: (f: any) => f.encrypted },
          { id: "mountTargets", header: "Mount targets", cell: (f: any) => f.mountTargets },
          { id: "size", header: "Size (bytes)", cell: (f: any) => f.size },
          { id: "actions", header: "", cell: (f: any) => f.actions },
        ]}
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create EFS file system"
      >
        <SpaceBetween direction="vertical" size="m">
          <FormField label="Name (optional)">
            <Input value={name} onChange={(e) => setName(e.detail.value)} />
          </FormField>
          <FormField label="Performance mode">
            <Select
              selectedOption={performanceMode}
              options={PERFORMANCE_OPTIONS}
              onChange={(e) => setPerformanceMode(e.detail.selectedOption)}
            />
          </FormField>
          <FormField label="Throughput mode">
            <Select
              selectedOption={throughputMode}
              options={THROUGHPUT_OPTIONS}
              onChange={(e) => setThroughputMode(e.detail.selectedOption)}
            />
          </FormField>
          <Toggle checked={encrypted} onChange={(e) => setEncrypted(e.detail.checked)}>
            Encrypted
          </Toggle>
          <Button variant="primary" onClick={doCreate}>
            Confirm create
          </Button>
        </SpaceBetween>
      </Modal>

      <Modal
        visible={!!selectedId}
        onDismiss={() => setSelectedId(null)}
        header={`File system: ${selected?.FileSystemId || ""}`}
        size="large"
      >
        <Tabs
          tabs={[
            {
              id: "mount-targets",
              label: "Mount targets",
              content: selectedId ? <MountTargetsTab fileSystemId={selectedId} /> : null,
            },
            {
              id: "access-points",
              label: "Access points",
              content: selectedId ? <AccessPointsTab fileSystemId={selectedId} /> : null,
            },
            {
              id: "tags",
              label: "Tags",
              content: selectedId ? <TagsTab fileSystemId={selectedId} /> : null,
            },
          ]}
        />
      </Modal>
    </SpaceBetween>
  );
}
