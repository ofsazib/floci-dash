import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BreadcrumbGroup,
  ContentLayout,
  Header,
  Box,
  SpaceBetween,
  Table,
  Button,
  Modal,
  Form,
  FormField,
  Input,
  Textarea,
  ColumnLayout,
  Container,
  Badge,
  Alert,
  Tabs,
  type TabsProps,
} from "@cloudscape-design/components";
import DeleteButton from "../components/DeleteButton";
import StatusBadge from "../components/StatusBadge";
import { useToast } from "../components/Toast";
import { useHealth } from "../hooks/useSystem";
import {
  useSecrets,
  useSecret,
  useSecretValue,
  useCreateSecret,
  useDeleteSecret,
  useRestoreSecret,
  usePutSecretValue,
  useRandomPassword,
} from "../hooks/useSecrets";

function SecretsPage() {
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const secretsQuery = useSecrets();
  const createSecret = useCreateSecret();
  const deleteSecret = useDeleteSecret();
  const restoreSecret = useRestoreSecret();

  const secrets = secretsQuery.data?.secrets || [];

  return (
    <SpaceBetween size="l">
      <Table
        header={
          <Header
            variant="h2"
            counter={`(${secrets.length})`}
            actions={<Button onClick={() => setShowCreate(true)}>Create secret</Button>}
          >
            Secrets
          </Header>
        }
        columnDefinitions={[
          {
            id: "name",
            header: "Name",
            cell: (s: any) => s.name,
          },
          {
            id: "desc",
            header: "Description",
            cell: (s: any) => s.description || "-",
          },
          {
            id: "rotation",
            header: "Rotation",
            cell: (s: any) => s.rotationEnabled
              ? <Badge color="green">Enabled</Badge>
              : <Badge color="grey">Off</Badge>,
          },
          {
            id: "created",
            header: "Created",
            cell: (s: any) => s.createdDate ? new Date(s.createdDate).toLocaleDateString() : "-",
          },
          {
            id: "tags",
            header: "Tags",
            cell: (s: any) => (s.tags || []).map((t: any) => <Badge key={t.key}>{t.key}</Badge>),
          },
          {
            id: "actions",
            header: "",
            cell: (s: any) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setSelectedId(s.name)}>View</Button>
                {s.deletedDate ? (
                  <Button onClick={async () => {
                    try {
                      await restoreSecret.mutateAsync(s.name);
                      showToast("success", `Secret ${s.name} restored`);
                    } catch (e: any) { showToast("error", e.message); }
                  }}>
                    Restore
                  </Button>
                ) : (
                  <DeleteButton
                    itemName={s.name}
                    resourceType="secret"
                    onDelete={async () => {
                      try {
                        await deleteSecret.mutateAsync({ id: s.name, force: true });
                        showToast("success", `Secret ${s.name} deleted`);
                      } catch (e: any) { showToast("error", e.message); }
                    }}
                  />
                )}
              </SpaceBetween>
            ),
          },
        ]}
        items={secrets}
        loading={secretsQuery.isLoading}
        trackBy={(s: any) => s.arn || s.name}
        empty={<Box textAlign="center"><b>No secrets</b></Box>}
      />

      {showCreate && (
        <CreateSecretModal
          onClose={() => setShowCreate(false)}
          onSubmit={async (data) => {
            try {
              await createSecret.mutateAsync(data);
              showToast("success", `Secret ${data.name} created`);
              setShowCreate(false);
            } catch (e: any) { showToast("error", e.message); }
          }}
          onGeneratePassword={async () => {
            try {
              const res = await useRandomPasswordFixed();
              return res;
            } catch { return null; }
          }}
        />
      )}

      {selectedId && (
        <SecretDetailModal secretId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </SpaceBetween>
  );
}

async function useRandomPasswordFixed(): Promise<string | null> {
  return null;
}

function CreateSecretModal({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (data: any) => void;
  onGeneratePassword: () => Promise<string | null>;
}) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [secretString, setSecretString] = useState("");
  const randomPasswordMut = useRandomPassword();

  return (
    <Modal visible={true} onDismiss={onClose} header="Create secret" footer={
      <SpaceBetween direction="horizontal" size="xs">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={() => onSubmit({ name, description, secretString })}>Create</Button>
      </SpaceBetween>
    }>
      <Form>
        <SpaceBetween size="m">
          <FormField label="Secret name">
            <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="my-app/db-password" />
          </FormField>
          <FormField label="Description">
            <Input value={description} onChange={({ detail }) => setDescription(detail.value)} />
          </FormField>
          <FormField
            label="Secret value"
            secondaryControl={
              <Button
                onClick={async () => {
                  try {
                    const res = await randomPasswordMut.mutateAsync({});
                    setSecretString(res.randomPassword);
                    showToast("success", "Random password generated");
                  } catch (e: any) { showToast("error", e.message); }
                }}
              >
                Generate password
              </Button>
            }
          >
            <Textarea value={secretString} onChange={({ detail }) => setSecretString(detail.value)} rows={4} />
          </FormField>
        </SpaceBetween>
      </Form>
    </Modal>
  );
}

function SecretDetailModal({ secretId, onClose }: { secretId: string; onClose: () => void }) {
  const { showToast } = useToast();
  const secretQuery = useSecret(secretId);
  const valueQuery = useSecretValue(secretId);
  const putValue = usePutSecretValue();

  const s = secretQuery.data?.secret;
  const versions = secretQuery.data?.versions || [];
  const [newValue, setNewValue] = useState("");
  const [showValue, setShowValue] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const tabs: TabsProps.Tab[] = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <ColumnLayout columns={2} variant="text-grid">
          <div><b>ARN:</b> {s?.arn}</div>
          <div><b>Name:</b> {s?.name}</div>
          <div><b>Description:</b> {s?.description || "-"}</div>
          <div><b>KMS Key:</b> {s?.kmsKeyId || "aws/secretsmanager (default)"}</div>
          <div><b>Rotation:</b> {s?.rotationEnabled ? "Enabled" : "Off"}</div>
          <div><b>Created:</b> {s?.createdDate ? new Date(s.createdDate).toLocaleString() : "-"}</div>
          <div><b>Last changed:</b> {s?.lastChangedDate ? new Date(s.lastChangedDate).toLocaleString() : "-"}</div>
          {s?.deletedDate && <div><b>Deleted:</b> {new Date(s.deletedDate).toLocaleString()}</div>}
        </ColumnLayout>
      ),
    },
    {
      id: "value",
      label: "Secret value",
      content: (
        <SpaceBetween size="m">
          {valueQuery.isLoading ? <Box>Loading...</Box> : (
            <SpaceBetween size="m">
              <Container header={<Header variant="h3">Current value</Header>}>
                <SpaceBetween size="s">
                  <Box>
                    <Badge>{valueQuery.data?.versionId || "-"}</Badge>
                    {(valueQuery.data?.versionStages || []).map((st) => <Badge key={st} color="blue">{st}</Badge>)}
                  </Box>
                  <Box>
                    {showValue ? (
                      <pre className="fd-code-bg" style={{ fontSize: 13, padding: 12, borderRadius: 4, overflow: "auto", maxHeight: 300 }}>
                        {valueQuery.data?.secretString || "(binary)"}
                      </pre>
                    ) : (
                      <Alert type="info">Secret value is hidden. Click "Reveal" to view.</Alert>
                    )}
                  </Box>
                  <Button onClick={() => setShowValue(!showValue)}>
                    {showValue ? "Hide" : "Reveal"}
                  </Button>
                </SpaceBetween>
              </Container>

              <Container header={<Header variant="h3">Add new version</Header>}>
                <SpaceBetween size="s">
                  <Textarea value={newValue} onChange={({ detail }) => setNewValue(detail.value)} rows={4} />
                  <Button
                    variant="primary"
                    disabled={!newValue}
                    onClick={async () => {
                      try {
                        await putValue.mutateAsync({ id: secretId, secretString: newValue });
                        showToast("success", "New version created");
                        setNewValue("");
                        valueQuery.refetch();
                        secretQuery.refetch();
                      } catch (e: any) { showToast("error", e.message); }
                    }}
                  >
                    Put value
                  </Button>
                </SpaceBetween>
              </Container>
            </SpaceBetween>
          )}
        </SpaceBetween>
      ),
    },
    {
      id: "versions",
      label: `Versions (${versions.length})`,
      content: (
        <Table
          columnDefinitions={[
            { id: "vid", header: "Version ID", cell: (v: any) => v.versionId },
            {
              id: "stages",
              header: "Stages",
              cell: (v: any) => (v.stages || []).map((st: string) => <Badge key={st} color={st === "AWSCURRENT" ? "green" : "grey"}>{st}</Badge>),
            },
            { id: "created", header: "Created", cell: (v: any) => v.createdDate ? new Date(v.createdDate).toLocaleString() : "-" },
          ]}
          items={versions}
          trackBy={(v: any) => v.versionId}
          empty={<Box>No versions</Box>}
        />
      ),
    },
    {
      id: "tags",
      label: `Tags (${s?.tags?.length || 0})`,
      content: s?.tags?.length ? (
        <SpaceBetween size="xs">
          {s.tags.map((t: any) => <Badge key={t.key}>{t.key}: {t.value}</Badge>)}
        </SpaceBetween>
      ) : <Box color="text-body-secondary">No tags</Box>,
    },
  ];

  return (
    <Modal visible={true} onDismiss={onClose} header={`Secret: ${secretId}`} size="large" footer={
      <Button onClick={onClose}>Close</Button>
    }>
      {secretQuery.isLoading ? <Box>Loading...</Box> : s ? (
        <Tabs tabs={tabs} activeTabId={activeTab} onChange={({ detail }) => setActiveTab(detail.activeTabId)} />
      ) : <Box>Secret not found</Box>}
    </Modal>
  );
}

export default function SecretsManagerPage() {
  const navigate = useNavigate();
  const { data: health } = useHealth();

  const smStatus = health?.services?.secretsmanager;
  const statusText = smStatus === "running" ? "running" : smStatus === "available" ? "available" : "connected";

  return (
    <ContentLayout
      header={
        <SpaceBetween size="xs">
          <BreadcrumbGroup
            items={[
              { text: "Dashboard", href: "/#/" },
              { text: "Secrets Manager", href: "/#/services/secretsmanager" },
            ]}
            onFollow={(e) => { e.preventDefault(); navigate(e.detail.href.replace("/#", "")); }}
          />
          <Header variant="h1" description="Store, manage, and retrieve secrets">
            Secrets Manager <StatusBadge status={statusText as any} />
          </Header>
        </SpaceBetween>
      }
    >
      <SecretsPage />
    </ContentLayout>
  );
}
