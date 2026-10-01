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
  useDmsSubnetGroups,
  useCreateDmsSubnetGroup,
  useDeleteDmsSubnetGroup,
  useDmsTags,
  useAddDmsTags,
  useRemoveDmsTags,
  type DmsSubnetGroup,
  type DmsTag,
} from "../../hooks/useDMS";

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

function TagsModal({
  group,
  onClose,
}: {
  group: DmsSubnetGroup;
  onClose: () => void;
}) {
  const identifier = group.ReplicationSubnetGroupIdentifier!;
  const tagsQuery = useDmsTags(identifier);
  const addTags = useAddDmsTags();
  const removeTags = useRemoveDmsTags();
  const [tagKey, setTagKey] = useState("");
  const [tagValue, setTagValue] = useState("");
  const [status, setStatus] = useState<Status | null>(null);

  // The ARN of a subnet group follows the DMS ARN format; Floci's ListTags
  // resolves by ARN so we reconstruct it the same way the service does.
  const arn = `arn:aws:dms:us-east-1:000000000000:rep-subnet-group/${identifier}`;

  async function handleAdd() {
    setStatus(null);
    try {
      await addTags.mutateAsync({ arn, tags: [{ Key: tagKey, Value: tagValue }] });
      setTagKey("");
      setTagValue("");
      setStatus({ type: "success", message: "Tag added." });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Failed to add tag" });
    }
  }

  return (
    <Modal visible onDismiss={onClose} header={`Tags — ${identifier}`}>
      <SpaceBetween size="m">
        {status && (
          <Alert type={status.type} dismissible onDismiss={() => setStatus(null)}>
            {status.message}
          </Alert>
        )}
        <ResourceTable
          resourceName="tag"
          headerTitle="Tags"
          items={tagsQuery.data?.tagList || []}
          loading={tagsQuery.isLoading}
          columns={[
            { id: "key", header: "Key", cell: (t: DmsTag) => t.Key },
            { id: "value", header: "Value", cell: (t: DmsTag) => t.Value },
            {
              id: "actions",
              header: "",
              cell: (t: DmsTag) => (
                <DeleteButton
                  itemName={t.Key}
                  resourceType="tag"
                  loading={removeTags.isPending}
                  onDelete={() => removeTags.mutateAsync({ arn, tagKeys: [t.Key] })}
                />
              ),
            },
          ]}
        />
        <SpaceBetween direction="horizontal" size="xs">
          <Input value={tagKey} onChange={({ detail }) => setTagKey(detail.value)} placeholder="env" />
          <Input value={tagValue} onChange={({ detail }) => setTagValue(detail.value)} placeholder="dev" />
          <Button
            variant="primary"
            disabled={!tagKey || !tagValue}
            loading={addTags.isPending}
            onClick={handleAdd}
          >
            Add tag
          </Button>
        </SpaceBetween>
      </SpaceBetween>
    </Modal>
  );
}

export default function DmsDashboard() {
  const { data, isLoading, isError, error, refetch } = useDmsSubnetGroups();
  const createGroup = useCreateDmsSubnetGroup();
  const deleteGroup = useDeleteDmsSubnetGroup();
  const [showCreate, setShowCreate] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [description, setDescription] = useState("");
  const [subnetIds, setSubnetIds] = useState("");
  const [tagsTarget, setTagsTarget] = useState<DmsSubnetGroup | null>(null);
  const [status, setStatus] = useState<Status | null>(null);

  async function handleCreate() {
    setStatus(null);
    try {
      await createGroup.mutateAsync({
        replicationSubnetGroupIdentifier: identifier,
        replicationSubnetGroupDescription: description,
        subnetIds: subnetIds.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setShowCreate(false);
      setIdentifier("");
      setDescription("");
      setSubnetIds("");
      setStatus({ type: "success", message: `Subnet group ${identifier} created.` });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Failed to create subnet group" });
    }
  }

  return (
    <SpaceBetween size="l">
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      <ResourceTable
        resourceName="subnet group"
        headerTitle="Replication subnet groups"
        items={data?.subnetGroups || []}
        loading={isLoading}
        onCreate={() => setShowCreate(true)}
        onRefresh={refetch}
        columns={[
          { id: "id", header: "Identifier", cell: (g: DmsSubnetGroup) => g.ReplicationSubnetGroupIdentifier },
          { id: "desc", header: "Description", cell: (g: DmsSubnetGroup) => g.ReplicationSubnetGroupDescription },
          { id: "vpc", header: "VPC", cell: (g: DmsSubnetGroup) => g.VpcId },
          { id: "status", header: "Status", cell: (g: DmsSubnetGroup) => g.SubnetGroupStatus },
          {
            id: "actions",
            header: "",
            cell: (g: DmsSubnetGroup) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setTagsTarget(g)}>Tags</Button>
                <DeleteButton
                  itemName={g.ReplicationSubnetGroupIdentifier!}
                  resourceType="subnet group"
                  loading={deleteGroup.isPending}
                  onDelete={() =>
                    deleteGroup
                      .mutateAsync(g.ReplicationSubnetGroupIdentifier!)
                      .then(() =>
                        setStatus({
                          type: "success",
                          message: `Subnet group ${g.ReplicationSubnetGroupIdentifier} deleted.`,
                        })
                      )
                  }
                />
              </SpaceBetween>
            ),
          },
        ]}
      />
      {isError && (
        <Alert type="error">{(error as Error)?.message || "Failed to load subnet groups"}</Alert>
      )}
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create replication subnet group"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Identifier">
              <Input
                value={identifier}
                onChange={({ detail }) => setIdentifier(detail.value)}
                placeholder="dms-subnet-group-1"
              />
            </FormField>
            <FormField label="Description">
              <Input value={description} onChange={({ detail }) => setDescription(detail.value)} />
            </FormField>
            <FormField label="Subnet IDs (comma-separated)">
              <Textarea
                value={subnetIds}
                onChange={({ detail }) => setSubnetIds(detail.value)}
                rows={2}
                placeholder="subnet-1, subnet-2"
              />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!identifier || !description || !subnetIds}
                  loading={createGroup.isPending}
                  onClick={handleCreate}
                >
                  Create
                </Button>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Form>
      </Modal>
      {tagsTarget && <TagsModal group={tagsTarget} onClose={() => setTagsTarget(null)} />}
    </SpaceBetween>
  );
}
