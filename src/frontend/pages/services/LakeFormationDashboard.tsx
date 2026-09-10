import { useState } from "react";
import {
  Box,
  Button,
  FormField,
  Header,
  Input,
  Modal,
  SpaceBetween,
  StatusIndicator,
  Tabs,
  Textarea,
  Toggle,
} from "@cloudscape-design/components";
import {
  useLakeFormationSettings,
  useUpdateLakeFormationSettings,
  useLakeFormationResources,
  useLakeFormationResourceDetail,
  useRegisterLakeFormationResource,
  useUpdateLakeFormationResource,
  useDeregisterLakeFormationResource,
  useLakeFormationPermissions,
  useGrantLakeFormationPermissions,
  useRevokeLakeFormationPermissions,
  useLfTags,
  useCreateLfTag,
  useUpdateLfTag,
  useDeleteLfTag,
} from "../../hooks/useLakeFormation";
import { useToast } from "../../components/Toast";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";

/** admin input textarea → one principal ARN per line */
function parseAdmins(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function SettingsTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useLakeFormationSettings();
  const updateSettings = useUpdateLakeFormationSettings();
  const [adminsText, setAdminsText] = useState("");
  const [allowExternal, setAllowExternal] = useState(false);
  const [dirty, setDirty] = useState(false);

  const admins: string[] = data?.dataLakeAdmins || [];
  const effectiveText = dirty ? adminsText : admins.join("\n");
  const effectiveExternal = dirty ? allowExternal : !!data?.allowExternalDataFiltering;

  const doSave = async () => {
    try {
      await updateSettings.mutateAsync({
        dataLakeAdmins: parseAdmins(effectiveText),
        allowExternalDataFiltering: effectiveExternal,
      });
      setDirty(false);
      showToast("success", "Data lake settings saved");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to save settings");
    }
  };

  return (
    <SpaceBetween size="m">
      <FormField label="Data lake admins (one principal ARN per line)" description="Principals with full Lake Formation admin rights">
        <Textarea
          value={effectiveText}
          onChange={({ detail }) => {
            setAdminsText(detail.value);
            setDirty(true);
          }}
          rows={4}
          placeholder="arn:aws:iam::123456789012:user/admin"
        />
      </FormField>
      <Toggle
        checked={effectiveExternal}
        onChange={({ detail }) => {
          setAllowExternal(detail.checked);
          setDirty(true);
        }}
      >
        Allow external data filtering
      </Toggle>
      <Button variant="primary" onClick={doSave} disabled={!dirty || updateSettings.isPending} loading={updateSettings.isPending}>
        Save settings
      </Button>
    </SpaceBetween>
  );
}

function ResourcesTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useLakeFormationResources();
  const { data: detail } = useLakeFormationResourceDetail(null);
  const register = useRegisterLakeFormationResource();
  const update = useUpdateLakeFormationResource();
  const deregister = useDeregisterLakeFormationResource();

  const [showRegister, setShowRegister] = useState(false);
  const [arn, setArn] = useState("");
  const [roleArn, setRoleArn] = useState("");
  const [editingArn, setEditingArn] = useState<string | null>(null);
  const [editRoleArn, setEditRoleArn] = useState("");

  const resources: any[] = data?.resources || [];
  const canSubmit = arn.trim().length > 0;

  const doRegister = async () => {
    try {
      await register.mutateAsync({ resourceArn: arn.trim(), roleArn: roleArn.trim() || undefined });
      setShowRegister(false);
      setArn("");
      setRoleArn("");
      showToast("success", "Resource registered");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to register resource");
    }
  };

  const doUpdate = async () => {
    try {
      await update.mutateAsync({ resourceArn: editingArn!, roleArn: editRoleArn.trim() || undefined });
      setEditingArn(null);
      showToast("success", "Resource role updated");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to update resource");
    }
  };

  const doDeregister = async (resourceArn: string) => {
    try {
      await deregister.mutateAsync(resourceArn);
      showToast("success", "Resource deregistered");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to deregister resource");
    }
  };

  return (
    <>
      <ResourceTable
        resourceName="registered resource"
        loading={isLoading}
        items={resources}
        onCreate={() => setShowRegister(true)}
        columns={[
          { id: "arn", header: "Resource ARN", cell: (r: any) => r.resourceArn || "—" },
          { id: "role", header: "Role ARN", cell: (r: any) => r.roleArn || "—" },
          { id: "actions", header: "Actions", cell: (r: any) => (
            <SpaceBetween size="xxs" direction="horizontal">
              <Button
                variant="inline-icon"
                iconName="edit"
                ariaLabel={`Edit role for ${r.resourceArn}`}
                onClick={() => {
                  setEditingArn(r.resourceArn);
                  setEditRoleArn(r.roleArn || "");
                }}
              />
              <DeleteButton
                itemName={r.resourceArn}
                resourceType="registered resource"
                onDelete={() => doDeregister(r.resourceArn)}
              />
            </SpaceBetween>
          ) },
        ]}
      />
      <Modal
        visible={showRegister}
        onDismiss={() => setShowRegister(false)}
        header="Register resource"
        footer={
          <Box float="right">
            <SpaceBetween size="xs" direction="horizontal">
              <Button variant="link" onClick={() => setShowRegister(false)}>Cancel</Button>
              <Button variant="primary" onClick={doRegister} disabled={!canSubmit || register.isPending}>Register</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Resource ARN">
            <Input value={arn} onChange={({ detail }) => setArn(detail.value)} placeholder="arn:aws:s3:::my-datalake" />
          </FormField>
          <FormField label="Role ARN (optional)">
            <Input value={roleArn} onChange={({ detail }) => setRoleArn(detail.value)} placeholder="arn:aws:iam::123456789012:role/lf-role" />
          </FormField>
        </SpaceBetween>
      </Modal>
      <Modal
        visible={!!editingArn}
        onDismiss={() => setEditingArn(null)}
        header={`Edit role for ${editingArn ?? ""}`}
        footer={
          <Box float="right">
            <SpaceBetween size="xs" direction="horizontal">
              <Button variant="link" onClick={() => setEditingArn(null)}>Cancel</Button>
              <Button variant="primary" onClick={doUpdate} loading={update.isPending}>Save</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <FormField label="Role ARN">
          <Input value={editRoleArn} onChange={({ detail }) => setEditRoleArn(detail.value)} />
        </FormField>
      </Modal>
    </>
  );
}

const DATABASE_RESOURCE = { Database: { Name: "default" } };

function PermissionsTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useLakeFormationPermissions();
  const grant = useGrantLakeFormationPermissions();
  const revoke = useRevokeLakeFormationPermissions();

  const [principal, setPrincipal] = useState("");
  const [permission, setPermission] = useState<"SELECT" | "ALL">("SELECT");

  const rows: any[] = data?.principalResourcePermissions || [];
  const canSubmit = principal.trim().length > 0;

  const doGrant = async () => {
    try {
      await grant.mutateAsync({
        principal: principal.trim(),
        resource: DATABASE_RESOURCE,
        permissions: [permission],
      });
      setPrincipal("");
      showToast("success", `Granted ${permission} to ${principal.trim()}`);
    } catch (e: any) {
      showToast("error", e?.message || "Failed to grant permissions");
    }
  };

  const doRevoke = async (p: any) => {
    try {
      await revoke.mutateAsync({
        principal: p.principal!,
        resource: p.resource,
        permissions: p.permissions,
      });
      showToast("success", "Permissions revoked");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to revoke permissions");
    }
  };

  return (
    <SpaceBetween size="m">
      <SpaceBetween size="s" direction="horizontal">
        <FormField label="Principal ARN">
          <Input value={principal} onChange={({ detail }) => setPrincipal(detail.value)} placeholder="arn:aws:iam::123456789012:user/analyst" />
        </FormField>
        <FormField label="Permission">
          <Button
            onClick={() => setPermission(permission === "SELECT" ? "ALL" : "SELECT")}
          >
            {permission}
          </Button>
        </FormField>
        <Button variant="primary" onClick={doGrant} disabled={!canSubmit || grant.isPending}>Grant</Button>
      </SpaceBetween>
      <ResourceTable
        resourceName="permission"
        loading={isLoading}
        items={rows}
        columns={[
          { id: "principal", header: "Principal", cell: (p: any) => p.principal || "—" },
          { id: "resource", header: "Resource", cell: (p: any) => JSON.stringify(p.resource ?? {}) },
          { id: "permissions", header: "Permissions", cell: (p: any) => (p.permissions || []).join(", ") || "—" },
          { id: "actions", header: "Actions", cell: (p: any) => (
            <Button onClick={() => doRevoke(p)} disabled={!p.principal || !(p.permissions || []).length}>Revoke</Button>
          ) },
        ]}
      />
    </SpaceBetween>
  );
}

function LfTagsTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useLfTags();
  const createTag = useCreateLfTag();
  const updateTag = useUpdateLfTag();
  const deleteTag = useDeleteLfTag();

  const [showCreate, setShowCreate] = useState(false);
  const [tagKey, setTagKey] = useState("");
  const [tagValues, setTagValues] = useState("");
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [newValue, setNewValue] = useState("");

  const tags: any[] = data?.lfTags || [];
  const canCreate = tagKey.trim().length > 0 && tagValues.trim().length > 0;

  const doCreate = async () => {
    try {
      await createTag.mutateAsync({
        tagKey: tagKey.trim(),
        tagValues: tagValues.split(",").map((v) => v.trim()).filter(Boolean),
      });
      setShowCreate(false);
      setTagKey("");
      setTagValues("");
      showToast("success", "LF-tag created");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to create LF-tag");
    }
  };

  const doAddValue = async () => {
    try {
      await updateTag.mutateAsync({ tagKey: addingFor!, tagValuesToAdd: [newValue.trim()] });
      setAddingFor(null);
      setNewValue("");
      showToast("success", "Value added");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to add value");
    }
  };

  const doDelete = async (key: string) => {
    try {
      await deleteTag.mutateAsync({ tagKey: key });
      showToast("success", "LF-tag deleted");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete LF-tag");
    }
  };

  return (
    <>
      <ResourceTable
        resourceName="LF-tag"
        loading={isLoading}
        items={tags}
        onCreate={() => setShowCreate(true)}
        columns={[
          { id: "key", header: "Tag key", cell: (t: any) => t.tagKey || "—" },
          { id: "values", header: "Values", cell: (t: any) => (t.tagValues || []).join(", ") || "—" },
          { id: "actions", header: "Actions", cell: (t: any) => (
            <SpaceBetween size="xxs" direction="horizontal">
              <Button onClick={() => { setAddingFor(t.tagKey); setNewValue(""); }}>Add value</Button>
              <DeleteButton itemName={t.tagKey} resourceType="LF-tag" onDelete={() => doDelete(t.tagKey)} />
            </SpaceBetween>
          ) },
        ]}
      />
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create LF-tag"
        footer={
          <Box float="right">
            <SpaceBetween size="xs" direction="horizontal">
              <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" onClick={doCreate} disabled={!canCreate || createTag.isPending}>Create</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Tag key">
            <Input value={tagKey} onChange={({ detail }) => setTagKey(detail.value)} placeholder="environment" />
          </FormField>
          <FormField label="Tag values (comma-separated)">
            <Input value={tagValues} onChange={({ detail }) => setTagValues(detail.value)} placeholder="prod, dev" />
          </FormField>
        </SpaceBetween>
      </Modal>
      <Modal
        visible={!!addingFor}
        onDismiss={() => setAddingFor(null)}
        header={`Add value to ${addingFor ?? ""}`}
        footer={
          <Box float="right">
            <SpaceBetween size="xs" direction="horizontal">
              <Button variant="link" onClick={() => setAddingFor(null)}>Cancel</Button>
              <Button variant="primary" onClick={doAddValue} disabled={newValue.trim().length === 0 || updateTag.isPending}>Add</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <FormField label="New value">
          <Input value={newValue} onChange={({ detail }) => setNewValue(detail.value)} />
        </FormField>
      </Modal>
    </>
  );
}

export default function LakeFormationDashboard() {
  return (
    <Tabs
      tabs={[
        {
          id: "settings",
          label: "Settings",
          content: <SettingsTab />,
        },
        {
          id: "resources",
          label: "Registered resources",
          content: <ResourcesTab />,
        },
        {
          id: "permissions",
          label: "Permissions",
          content: <PermissionsTab />,
        },
        {
          id: "lftags",
          label: "LF-tags",
          content: <LfTagsTab />,
        },
      ]}
    />
  );
}
