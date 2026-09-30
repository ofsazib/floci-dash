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
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import {
  useServerlessNamespaces,
  useCreateServerlessNamespace,
  useUpdateServerlessNamespace,
  useDeleteServerlessNamespace,
  useServerlessNamespaceTags,
  useAddServerlessNamespaceTags,
  useRemoveServerlessNamespaceTags,
  type ServerlessNamespace,
} from "../../hooks/useRedshiftServerless";

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

function CreateNamespaceModal({
  visible,
  loading,
  onDismiss,
  onSubmit,
}: {
  visible: boolean;
  loading: boolean;
  onDismiss: () => void;
  onSubmit: (body: { namespaceName: string; dbName: string; adminUsername: string }) => void;
}) {
  const [name, setName] = useState("");
  const [dbName, setDbName] = useState("dev");
  const [adminUsername, setAdminUsername] = useState("admin");

  return (
    <Modal visible={visible} onDismiss={onDismiss} header="Create namespace">
      <Form>
        <SpaceBetween size="m">
          <FormField label="Namespace name">
            <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="analytics" />
          </FormField>
          <FormField label="Database name">
            <Input value={dbName} onChange={({ detail }) => setDbName(detail.value)} />
          </FormField>
          <FormField label="Admin username">
            <Input value={adminUsername} onChange={({ detail }) => setAdminUsername(detail.value)} />
          </FormField>
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={onDismiss}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!name}
                loading={loading}
                onClick={() => {
                  onSubmit({ namespaceName: name, dbName, adminUsername });
                  setName("");
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

function TagsModal({
  namespace,
  onClose,
}: {
  namespace: ServerlessNamespace;
  onClose: () => void;
}) {
  const name = namespace.namespaceName!;
  const arn = namespace.namespaceArn!;
  const tagsQuery = useServerlessNamespaceTags(name, arn);
  const addTags = useAddServerlessNamespaceTags();
  const removeTags = useRemoveServerlessNamespaceTags();
  const [tagKey, setTagKey] = useState("");
  const [tagValue, setTagValue] = useState("");
  const [status, setStatus] = useState<Status | null>(null);

  async function handleAdd() {
    setStatus(null);
    try {
      await addTags.mutateAsync({ namespaceName: name, arn, tags: [{ key: tagKey, value: tagValue }] });
      setTagKey("");
      setTagValue("");
      setStatus({ type: "success", message: "Tag added." });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Failed to add tag" });
    }
  }

  return (
    <Modal visible onDismiss={onClose} header={`Tags — ${name}`}>
      <SpaceBetween size="m">
        {status && (
          <Alert type={status.type} dismissible onDismiss={() => setStatus(null)}>
            {status.message}
          </Alert>
        )}
        <ResourceTable
          resourceName="tag"
          headerTitle="Tags"
          items={tagsQuery.data?.tags || []}
          loading={tagsQuery.isLoading}
          columns={[
            { id: "key", header: "Key", cell: (t: any) => t.key },
            { id: "value", header: "Value", cell: (t: any) => t.value },
            {
              id: "actions",
              header: "",
              cell: (t: any) => (
                <DeleteButton
                  itemName={t.key}
                  resourceType="tag"
                  loading={removeTags.isPending}
                  onDelete={() => removeTags.mutateAsync({ namespaceName: name, arn, tagKeys: [t.key] })}
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

export default function RedshiftServerlessDashboard() {
  const { data, isLoading, isError, error, refetch } = useServerlessNamespaces();
  const createNamespace = useCreateServerlessNamespace();
  const updateNamespace = useUpdateServerlessNamespace();
  const deleteNamespace = useDeleteServerlessNamespace();
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<ServerlessNamespace | null>(null);
  const [editAdmin, setEditAdmin] = useState("");
  const [tagTarget, setTagTarget] = useState<ServerlessNamespace | null>(null);
  const [status, setStatus] = useState<Status | null>(null);

  async function handleCreate(body: {
    namespaceName: string;
    dbName: string;
    adminUsername: string;
  }) {
    setStatus(null);
    try {
      await createNamespace.mutateAsync(body);
      setShowCreate(false);
      setStatus({ type: "success", message: `Namespace ${body.namespaceName} created.` });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Failed to create namespace" });
    }
  }

  async function handleEdit() {
    setStatus(null);
    try {
      await updateNamespace.mutateAsync({
        namespaceName: editTarget!.namespaceName!,
        adminUsername: editAdmin,
      });
      setEditTarget(null);
      setStatus({ type: "success", message: "Namespace updated." });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Failed to update namespace" });
    }
  }

  return (
    <SpaceBetween size="l">
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      <ResourceTable
        resourceName="namespace"
        headerTitle="Namespaces"
        items={data?.namespaces || []}
        loading={isLoading}
        onCreate={() => setShowCreate(true)}
        onRefresh={refetch}
        columns={[
          { id: "name", header: "Name", cell: (n: ServerlessNamespace) => n.namespaceName },
          { id: "db", header: "Database", cell: (n: ServerlessNamespace) => n.dbName },
          { id: "status", header: "Status", cell: (n: ServerlessNamespace) => n.status },
          { id: "admin", header: "Admin user", cell: (n: ServerlessNamespace) => n.adminUsername ?? "—" },
          {
            id: "actions",
            header: "",
            cell: (n: ServerlessNamespace) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  onClick={() => {
                    setEditTarget(n);
                    setEditAdmin(n.adminUsername ?? "");
                  }}
                >
                  Edit
                </Button>
                <Button onClick={() => setTagTarget(n)}>Tags</Button>
                <DeleteButton
                  itemName={n.namespaceName!}
                  resourceType="namespace"
                  loading={deleteNamespace.isPending}
                  onDelete={() => deleteNamespace.mutateAsync(n.namespaceName!)}
                />
              </SpaceBetween>
            ),
          },
        ]}
      />
      {isError && (
        <Alert type="error">{(error as Error)?.message || "Failed to load namespaces"}</Alert>
      )}
      <CreateNamespaceModal
        visible={showCreate}
        loading={createNamespace.isPending}
        onDismiss={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />
      <Modal
        visible={editTarget !== null}
        onDismiss={() => setEditTarget(null)}
        header={`Edit namespace — ${editTarget?.namespaceName ?? ""}`}
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Admin username">
              <Input value={editAdmin} onChange={({ detail }) => setEditAdmin(detail.value)} />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setEditTarget(null)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!editAdmin}
                  loading={updateNamespace.isPending}
                  onClick={handleEdit}
                >
                  Save
                </Button>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Form>
      </Modal>
      {tagTarget && <TagsModal namespace={tagTarget} onClose={() => setTagTarget(null)} />}
    </SpaceBetween>
  );
}
