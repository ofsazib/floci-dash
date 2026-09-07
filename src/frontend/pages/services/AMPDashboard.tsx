import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormField,
  Header,
  Input,
  Modal,
  SpaceBetween,
  StatusIndicator,
  Tabs,
} from "@cloudscape-design/components";
import {
  useAMPWorkspaces,
  useCreateAMPWorkspace,
  useDeleteAMPWorkspace,
  useUpdateAMPWorkspaceAlias,
  useAMPTags,
  useAMPTagResource,
  useAMPUntagResource,
} from "../../hooks/useAMP";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import { useToast } from "../../components/Toast";

function statusIndicator(code: string | undefined) {
  const s = code || "UNKNOWN";
  const color = s === "ACTIVE" ? "success" : s === "CREATING" || s === "UPDATING" ? "in-progress" : "error";
  return <StatusIndicator type={color as any}>{s}</StatusIndicator>;
}

/** Tag editor: adds and removes tags against the workspace ARN. */
function TagsEditor({ arn }: { arn: string }) {
  const { showToast } = useToast();
  const { data, isLoading } = useAMPTags(arn);
  const tagResource = useAMPTagResource();
  const untagResource = useAMPUntagResource();
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const tags: Record<string, string> = data?.tags || {};
  const entries = Object.entries(tags);

  const add = async () => {
    try {
      await tagResource.mutateAsync({ resourceArn: arn, tags: { [key.trim()]: value } });
      showToast("success", `Tag ${key.trim()} added`);
      setKey("");
      setValue("");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to add tag");
    }
  };

  const remove = async (k: string) => {
    try {
      await untagResource.mutateAsync({ resourceArn: arn, tagKeys: [k] });
      showToast("success", `Tag ${k} removed`);
    } catch (e: any) {
      showToast("error", e?.message || "Failed to remove tag");
    }
  };

  if (isLoading) return <Box color="text-body-secondary">Loading tags…</Box>;

  return (
    <SpaceBetween size="m">
      <SpaceBetween direction="horizontal" size="xs">
        <FormField label="Tag key">
          <Input value={key} onChange={(e) => setKey(e.detail.value)} placeholder="env" />
        </FormField>
        <FormField label="Tag value">
          <Input value={value} onChange={(e) => setValue(e.detail.value)} placeholder="prod" />
        </FormField>
        <Box padding={{ top: "xl" }}>
          <Button onClick={add} disabled={!key.trim() || tagResource.isPending}>
            Add tag
          </Button>
        </Box>
      </SpaceBetween>
      {entries.length === 0 ? (
        <Box color="text-body-secondary">No tags on this workspace.</Box>
      ) : (
        entries.map(([k, v]) => (
          <SpaceBetween key={k} direction="horizontal" size="xs">
            <Box>
              <b>{k}</b>: {v}
            </Box>
            <Button
              variant="link"
              onClick={() => remove(k)}
              loading={untagResource.isPending && untagResource.variables?.tagKeys?.[0] === k}
            >
              Remove
            </Button>
          </SpaceBetween>
        ))
      )}
    </SpaceBetween>
  );
}

export function AMPDashboard() {
  const { showToast } = useToast();
  const { data, isLoading } = useAMPWorkspaces();
  const createWorkspace = useCreateAMPWorkspace();
  const deleteWorkspace = useDeleteAMPWorkspace();
  const updateAlias = useUpdateAMPWorkspaceAlias();

  const [showCreate, setShowCreate] = useState(false);
  const [alias, setAlias] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const [renameTarget, setRenameTarget] = useState<any>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);

  const [tagsTarget, setTagsTarget] = useState<any>(null);

  const workspaces: any[] = data?.workspaces || [];

  const closeCreate = () => {
    setShowCreate(false);
    setAlias("");
    setCreateError(null);
  };

  const submitCreate = async () => {
    try {
      await createWorkspace.mutateAsync({ alias: alias.trim() });
      showToast("success", `Workspace ${alias.trim()} created`);
      closeCreate();
    } catch (e: any) {
      setCreateError(e?.message || "Failed to create workspace");
    }
  };

  const closeRename = () => {
    setRenameTarget(null);
    setRenameValue("");
    setRenameError(null);
  };

  const submitRename = async () => {
    try {
      await updateAlias.mutateAsync({
        workspaceId: renameTarget.workspaceId,
        alias: renameValue.trim(),
      });
      showToast("success", "Workspace alias updated");
      closeRename();
    } catch (e: any) {
      setRenameError(e?.message || "Failed to update alias");
    }
  };

  const handleDelete = async (ws: any) => {
    try {
      await deleteWorkspace.mutateAsync(ws.workspaceId);
      showToast("success", `Workspace ${ws.alias || ws.workspaceId} deleted`);
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete workspace");
    }
  };

  return (
    <SpaceBetween size="l">
      <Box>
        <Header variant="h2">Managed Service for Prometheus</Header>
        <Box color="text-body-secondary">
          Create and manage AMP workspaces backed by the Floci emulator.
        </Box>
      </Box>

      <ResourceTable
        resourceName="Workspace"
        headerTitle="AMP workspaces"
        headerCounter={data?.total}
        items={workspaces.map((w) => ({
          id: w.workspaceId,
          alias: w.alias,
          workspaceId: w.workspaceId,
          status: w.status?.statusCode,
          arn: w.arn,
          created: w.createdAt,
        }))}
        loading={isLoading}
        emptyMessage="No AMP workspaces"
        onCreate={() => {
          setAlias("");
          setCreateError(null);
          setShowCreate(true);
        }}
        columns={[
          { id: "alias", header: "Alias", cell: (i: any) => i.alias || "—", isRowHeader: true },
          {
            id: "workspaceId",
            header: "Workspace ID",
            cell: (i: any) => <Box variant="code">{i.workspaceId}</Box>,
          },
          { id: "status", header: "Status", cell: (i: any) => statusIndicator(i.status) },
          {
            id: "created",
            header: "Created",
            cell: (i: any) => (i.created ? new Date(i.created * 1000).toLocaleDateString() : "—"),
          },
          {
            id: "actions",
            header: "",
            cell: (i: any) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="link"
                  onClick={() => {
                    setRenameTarget(i);
                    setRenameValue(i.alias || "");
                    setRenameError(null);
                  }}
                >
                  Edit alias
                </Button>
                <Button variant="link" onClick={() => setTagsTarget(i)}>
                  Tags
                </Button>
                <DeleteButton
                  itemName={i.alias || i.workspaceId}
                  resourceType="workspace"
                  loading={deleteWorkspace.isPending && deleteWorkspace.variables === i.workspaceId}
                  onDelete={() => handleDelete(i)}
                />
              </SpaceBetween>
            ),
          },
        ]}
        filterEnabled
        filterPlaceholder="Find workspaces by alias"
        filterFunction={(i: any, s: string) =>
          `${i.alias ?? ""} ${i.workspaceId}`.toLowerCase().includes(s.toLowerCase())
        }
      />

      <Modal visible={showCreate} onDismiss={closeCreate} header="Create AMP workspace">
        <SpaceBetween size="m">
          <FormField label="Alias">
            <Input
              value={alias}
              onChange={(e) => setAlias(e.detail.value)}
              placeholder="my-workspace"
            />
          </FormField>
          {createError && <Alert type="error">{createError}</Alert>}
          <Button onClick={submitCreate} disabled={!alias.trim() || createWorkspace.isPending}>
            Create workspace
          </Button>
        </SpaceBetween>
      </Modal>

      <Modal visible={!!renameTarget} onDismiss={closeRename} header="Edit workspace alias">
        {renameTarget && (
          <SpaceBetween size="m">
            <Box>
              Workspace <Box variant="code">{renameTarget.workspaceId}</Box>
            </Box>
            <FormField label="New alias">
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.detail.value)}
                placeholder="my-workspace"
              />
            </FormField>
            {renameError && <Alert type="error">{renameError}</Alert>}
            <Button onClick={submitRename} disabled={!renameValue.trim() || updateAlias.isPending}>
              Save alias
            </Button>
          </SpaceBetween>
        )}
      </Modal>

      <Modal visible={!!tagsTarget} onDismiss={() => setTagsTarget(null)} header="Workspace tags">
        {tagsTarget && (
          <SpaceBetween size="m">
            <Box>
              Tags for <Box variant="code">{tagsTarget.arn}</Box>
            </Box>
            <TagsEditor arn={tagsTarget.arn} />
          </SpaceBetween>
        )}
      </Modal>
    </SpaceBetween>
  );
}
