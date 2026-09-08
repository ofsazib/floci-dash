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
  Toggle,
} from "@cloudscape-design/components";
import {
  useConnectInstances,
  useCreateConnectInstance,
  useDeleteConnectInstance,
  useConnectAttributes,
  useUpdateConnectAttribute,
  useConnectStorageConfigs,
  useAssociateConnectStorageConfig,
  useDisassociateConnectStorageConfig,
} from "../../hooks/useConnect";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import { useToast } from "../../components/Toast";

const IDENTITY_OPTIONS = [
  { label: "SAML", value: "SAML" },
  { label: "Connect Managed", value: "CONNECT_MANAGED" },
  { label: "Existing Directory", value: "EXISTING_DIRECTORY" },
];

function statusIndicator(status: string | undefined) {
  const s = status || "UNKNOWN";
  const color =
    s === "ACTIVE" ? "success" : s === "CREATING" || s === "DELETING" ? "in-progress" : "error";
  return <StatusIndicator type={color as any}>{s}</StatusIndicator>;
}

/** Attributes tab — read instance attributes and toggle them. */
function AttributesTab({ instanceId }: { instanceId: string }) {
  const { showToast } = useToast();
  const { data, isLoading } = useConnectAttributes(instanceId);
  const updateAttr = useUpdateConnectAttribute();

  const attributes: any[] = data?.attributes || [];

  const setAttr = async (attributeType: string, value: string) => {
    try {
      await updateAttr.mutateAsync({ instanceId, attributeType, value });
      showToast("success", `Attribute ${attributeType} set to ${value}`);
    } catch (e: any) {
      showToast("error", e?.message || "Failed to update attribute");
    }
  };

  return (
    <ResourceTable
      resourceName="attributes"
      headerTitle="Instance attributes"        loading={isLoading}
      items={attributes}
      columns={[
        { id: "name", header: "Attribute", cell: (a: any) => a.AttributeType },
        { id: "value", header: "Value", cell: (a: any) => a.Value },
        {
          id: "toggle",
          header: "Action",
          cell: (a: any) => (
            <Toggle
              checked={a.Value === "true"}
              onChange={({ detail }) => setAttr(a.AttributeType, detail.checked ? "true" : "false")}
            >
              Enabled
            </Toggle>
          ),
        },
      ]}          emptyMessage="No attributes"
    />
  );
}

/** Storage configs tab — list, associate, disassociate. */
function StorageConfigsTab({ instanceId }: { instanceId: string }) {
  const { showToast } = useToast();
  const { data, isLoading } = useConnectStorageConfigs(instanceId);
  const associate = useAssociateConnectStorageConfig();
  const disassociate = useDisassociateConnectStorageConfig();
  const [showAssociate, setShowAssociate] = useState(false);
  const [resourceType, setResourceType] = useState("CHAT_TRANSCRIPTS");
  const [bucket, setBucket] = useState("");
  const [prefix, setPrefix] = useState("");

  const configs: any[] = data?.storageConfigs || [];
  const canSubmit = bucket.trim().length > 0;

  const doAssociate = async () => {
    try {
      await associate.mutateAsync({
        instanceId,
        ResourceType: resourceType,
        StorageConfig: { StorageType: "S3", S3Config: { BucketName: bucket.trim(), ObjectKeyPrefix: prefix } },
      });
      showToast("success", "Storage config associated");
      setShowAssociate(false);
      setBucket("");
      setPrefix("");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to associate storage config");
    }
  };

  const doDisassociate = async (associationId: string) => {
    try {
      await disassociate.mutateAsync({ instanceId, associationId });
      showToast("success", "Storage config disassociated");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to disassociate storage config");
    }
  };

  return (
    <Box>
      <SpaceBetween direction="vertical" size="s">
        <div>
          <Button onClick={() => setShowAssociate(true)}>Associate storage config</Button>
        </div>
        <ResourceTable
          resourceName="storage config"
          headerTitle="Storage configs"
          loading={isLoading}
          items={configs}
          columns={[
            { id: "id", header: "Association ID", cell: (s: any) => s.AssociationId },
            { id: "type", header: "Resource", cell: (s: any) => s.ResourceType },
            { id: "storage", header: "Storage type", cell: (s: any) => s.StorageConfig?.StorageType },
            {
              id: "actions",
              header: "Actions",
              cell: (s: any) => (
                <DeleteButton
                  resourceType="storage config"
                  itemName={s.AssociationId}
                  onDelete={() => doDisassociate(s.AssociationId)}
                />
              ),
            },
          ]}
          emptyMessage="No storage configs"
        />
      </SpaceBetween>
      <Modal
        visible={showAssociate}
        onDismiss={() => setShowAssociate(false)}
        header="Associate storage config"
      >
        {showAssociate && (
        <SpaceBetween direction="vertical" size="m">
          <FormField label="Resource type">
            <Select
              selectedOption={{ label: resourceType, value: resourceType }}
              options={["CHAT_TRANSCRIPTS", "CALL_RECORDINGS", "SCHEDULED_REPORTS", "MEDIA_STREAMS", "ATTACHMENTS"].map(
                (v) => ({ label: v, value: v })
              )}
              onChange={({ detail }) => setResourceType(detail.selectedOption.value!)}
            />
          </FormField>
          <FormField label="S3 bucket name">
            <Input value={bucket} onChange={({ detail }) => setBucket(detail.value)} />
          </FormField>
          <FormField label="Object key prefix (optional)">
            <Input value={prefix} onChange={({ detail }) => setPrefix(detail.value)} />
          </FormField>
          <Button variant="primary" disabled={!canSubmit} onClick={doAssociate}>
            Associate
          </Button>
        </SpaceBetween>
        )}
      </Modal>
    </Box>
  );
}

export function ConnectDashboard() {
  const { showToast } = useToast();
  const { data, isLoading } = useConnectInstances();
  const createInstance = useCreateConnectInstance();
  const deleteInstance = useDeleteConnectInstance();
  const [showCreate, setShowCreate] = useState(false);
  const [alias, setAlias] = useState("");
  const [identityType, setIdentityType] = useState("CONNECT_MANAGED");
  const [inbound, setInbound] = useState(true);
  const [outbound, setOutbound] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const instances: any[] = data?.instances || [];
  const canCreate = alias.trim().length > 0;

  const doCreate = async () => {
    try {
      await createInstance.mutateAsync({
        InstanceAlias: alias.trim(),
        IdentityManagementType: identityType,
        InboundCallsEnabled: inbound,
        OutboundCallsEnabled: outbound,
      });
      showToast("success", `Connect instance ${alias.trim()} created`);
      setShowCreate(false);
      setAlias("");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to create instance");
    }
  };

  const doDelete = async (id: string) => {
    try {
      await deleteInstance.mutateAsync(id);
      showToast("success", "Connect instance deleted");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete instance");
    }
  };

  return (
    <Box>
      <SpaceBetween direction="vertical" size="m">
        <Header variant="h1">Amazon Connect</Header>
        <ResourceTable
          resourceName="Connect instance"
          headerTitle="Connect instances"
          loading={isLoading}
          items={instances}
          onCreate={() => setShowCreate(true)}
          columns={[
            { id: "alias", header: "Instance alias", cell: (i: any) => i.InstanceAlias },
            { id: "id", header: "Instance ID", cell: (i: any) => i.Id },
            { id: "arn", header: "ARN", cell: (i: any) => i.Arn },
            { id: "status", header: "Status", cell: (i: any) => statusIndicator(i.InstanceStatus) },
            { id: "identity", header: "Identity mgmt", cell: (i: any) => i.IdentityManagementType },
            {
              id: "actions",
              header: "Actions",
              cell: (i: any) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <Button onClick={() => setSelectedId(i.Id)}>Details</Button>
                  <DeleteButton
                    resourceType="instance"
                    itemName={i.InstanceAlias || i.Id}
                    onDelete={() => doDelete(i.Id)}
                  />
                </SpaceBetween>
              ),
            },
          ]}
          emptyMessage="No Connect instances. Create one to get started."
        />
      </SpaceBetween>

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create Connect instance"
      >
        {showCreate && (
        <SpaceBetween direction="vertical" size="m">
          <FormField label="Instance alias">
            <Input value={alias} onChange={({ detail }) => setAlias(detail.value)} />
          </FormField>
          <FormField label="Identity management type">
            <Select
              selectedOption={IDENTITY_OPTIONS.find((o) => o.value === identityType)!}
              options={IDENTITY_OPTIONS}
              onChange={({ detail }) => setIdentityType(detail.selectedOption.value!)}
            />
          </FormField>
          <Toggle checked={inbound} onChange={({ detail }) => setInbound(detail.checked)}>
            Inbound calls
          </Toggle>
          <Toggle checked={outbound} onChange={({ detail }) => setOutbound(detail.checked)}>
            Outbound calls
          </Toggle>
          <Button variant="primary" disabled={!canCreate} onClick={doCreate}>
            Create instance
          </Button>
        </SpaceBetween>
        )}
      </Modal>

      <Modal
        visible={!!selectedId}
        onDismiss={() => setSelectedId(null)}
        header="Instance details"
        size="large"
      >
        {selectedId && (
          <Tabs
            tabs={[
              { id: "attributes", label: "Attributes", content: <AttributesTab instanceId={selectedId} /> },
              {
                id: "storage",
                label: "Storage configs",
                content: <StorageConfigsTab instanceId={selectedId} />,
              },
            ]}
          />
        )}
      </Modal>
    </Box>
  );
}

export default ConnectDashboard;
