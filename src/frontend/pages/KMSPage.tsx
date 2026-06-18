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
  Select,
  SelectProps,
  Textarea,
  ColumnLayout,
  Container,
  Badge,
  Tabs,
  type TabsProps,
  Alert,
} from "@cloudscape-design/components";
import DeleteButton from "../components/DeleteButton";
import StatusBadge from "../components/StatusBadge";
import { useToast } from "../components/Toast";
import { useHealth } from "../hooks/useSystem";
import {
  useKMSKeys,
  useKMSKey,
  useCreateKey,
  useScheduleKeyDeletion,
  useCancelKeyDeletion,
  useToggleKey,
  useToggleRotation,
  useUpdateKeyDescription,
  useKMSAliases,
  useCreateAlias,
  useDeleteAlias,
  useEncrypt,
  useDecrypt,
} from "../hooks/useKMS";

const KEY_USAGE_OPTIONS: SelectProps.Option[] = [
  { label: "Encrypt and decrypt (ENCRYPT_DECRYPT)", value: "ENCRYPT_DECRYPT" },
  { label: "Sign and verify (SIGN_VERIFY)", value: "SIGN_VERIFY" },
  { label: "Generate MAC (GENERATE_MAC)", value: "GENERATE_MAC" },
];

const KEY_SPEC_OPTIONS: SelectProps.Option[] = [
  { label: "SYMMETRIC_DEFAULT", value: "SYMMETRIC_DEFAULT" },
  { label: "RSA_2048", value: "RSA_2048" },
  { label: "RSA_4096", value: "RSA_4096" },
  { label: "ECC_NIST_P256", value: "ECC_NIST_P256" },
  { label: "HMAC_256", value: "HMAC_256" },
];

function KeysTab() {
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const keysQuery = useKMSKeys();
  const createKey = useCreateKey();

  const keys = keysQuery.data?.keys || [];

  return (
    <SpaceBetween size="l">
      <Table
        header={
          <Header
            variant="h2"
            counter={`(${keys.length})`}
            actions={<Button onClick={() => setShowCreate(true)}>Create key</Button>}
          >
            KMS Keys
          </Header>
        }
        columnDefinitions={[
          { id: "id", header: "Key ID", cell: (k: any) => <span style={{ fontSize: 12, fontFamily: "monospace" }}>{k.keyId}</span> },
          {
            id: "state",
            header: "State",
            cell: (k: any) => {
              const color = k.keyState === "Enabled" ? "green" : k.keyState === "PendingDeletion" ? "red" : "grey";
              return <Badge color={color as any}>{k.keyState || (k.enabled ? "Enabled" : "Disabled")}</Badge>;
            },
          },
          { id: "desc", header: "Description", cell: (k: any) => k.description || "-" },
          { id: "usage", header: "Usage", cell: (k: any) => <Badge>{k.keyUsage || "-"}</Badge> },
          { id: "spec", header: "Spec", cell: (k: any) => <span style={{ fontSize: 12 }}>{k.keySpec || "-"}</span> },
          { id: "mgr", header: "Manager", cell: (k: any) => <Badge color={k.keyManager === "AWS" ? "blue" : "green"}>{k.keyManager || "CUSTOMER"}</Badge> },
          {
            id: "deletion",
            header: "Deletion",
            cell: (k: any) => k.deletionDate ? new Date(k.deletionDate).toLocaleDateString() : "-",
          },
          {
            id: "actions",
            header: "",
            cell: (k: any) => <Button onClick={() => setSelectedKey(k.keyId)}>View</Button>,
          },
        ]}
        items={keys}
        loading={keysQuery.isLoading}
        trackBy={(k: any) => k.keyId}
        empty={<Box textAlign="center"><b>No keys</b><Box variant="p" color="text-body-secondary">Create a KMS key to get started.</Box></Box>}
      />

      {showCreate && (
        <CreateKeyModal
          onClose={() => setShowCreate(false)}
          onSubmit={async (data) => {
            try {
              await createKey.mutateAsync(data);
              showToast("success", "Key created");
              setShowCreate(false);
            } catch (e: any) { showToast("error", e.message); }
          }}
        />
      )}

      {selectedKey && (
        <KeyDetailModal keyId={selectedKey} onClose={() => setSelectedKey(null)} />
      )}
    </SpaceBetween>
  );
}

function CreateKeyModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => void }) {
  const [description, setDescription] = useState("");
  const [keyUsage, setKeyUsage] = useState<SelectProps.Option>(KEY_USAGE_OPTIONS[0]);
  const [keySpec, setKeySpec] = useState<SelectProps.Option>(KEY_SPEC_OPTIONS[0]);

  return (
    <Modal visible={true} onDismiss={onClose} header="Create key" footer={
      <Box float="right">
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onSubmit({ description, keyUsage: keyUsage.value, keySpec: keySpec.value })}>Create</Button>
        </SpaceBetween>
      </Box>
    }>
      <Form>
        <SpaceBetween size="m">
          <FormField label="Description">
            <Input value={description} onChange={({ detail }) => setDescription(detail.value)} placeholder="My encryption key" />
          </FormField>
          <FormField label="Key usage">
            <Select selectedOption={keyUsage} onChange={({ detail }) => setKeyUsage(detail.selectedOption)} options={KEY_USAGE_OPTIONS} />
          </FormField>
          <FormField label="Key spec">
            <Select selectedOption={keySpec} onChange={({ detail }) => setKeySpec(detail.selectedOption)} options={KEY_SPEC_OPTIONS} />
          </FormField>
        </SpaceBetween>
      </Form>
    </Modal>
  );
}

function KeyDetailModal({ keyId, onClose }: { keyId: string; onClose: () => void }) {
  const { showToast } = useToast();
  const keyQuery = useKMSKey(keyId);
  const scheduleDeletion = useScheduleKeyDeletion();
  const cancelDeletion = useCancelKeyDeletion();
  const toggleKey = useToggleKey();
  const toggleRotation = useToggleRotation();
  const updateDesc = useUpdateKeyDescription();
  const encryptMut = useEncrypt();
  const decryptMut = useDecrypt();

  const k = keyQuery.data?.key;
  const tags = keyQuery.data?.tags || {};
  const aliases = keyQuery.data?.aliases || [];
  const grants = keyQuery.data?.grants || [];
  const rotationEnabled = keyQuery.data?.rotationEnabled;

  const [activeTab, setActiveTab] = useState("overview");
  const [editDesc, setEditDesc] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [plaintext, setPlaintext] = useState("");
  const [cryptoResult, setCryptoResult] = useState<any>(null);
  const [decryptInput, setDecryptInput] = useState("");
  const [decryptResult, setDecryptResult] = useState<string | null>(null);

  const tabs: TabsProps.Tab[] = [
    {
      id: "overview",
      label: "Overview",
      content: k ? (
        <SpaceBetween size="l">
          <ColumnLayout columns={2} variant="text-grid">
            <div><b>Key ID:</b> <span style={{ fontFamily: "monospace", fontSize: 12 }}>{k.keyId}</span></div>
            <div><b>ARN:</b> <span style={{ fontSize: 12 }}>{k.arn}</span></div>
            <div><b>State:</b> <Badge color={k.keyState === "Enabled" ? "green" : "grey"}>{k.keyState}</Badge></div>
            <div><b>Usage:</b> {k.keyUsage}</div>
            <div><b>Spec:</b> {k.keySpec}</div>
            <div><b>Origin:</b> {k.origin}</div>
            <div><b>Manager:</b> <Badge color={k.keyManager === "AWS" ? "blue" : "green"}>{k.keyManager}</Badge></div>
            <div><b>Created:</b> {k.creationDate ? new Date(k.creationDate).toLocaleString() : "-"}</div>
            {k.deletionDate && <div><b>Deletion date:</b> <span style={{ color: "var(--color-text-status-error)" }}>{new Date(k.deletionDate).toLocaleString()}</span></div>}
            <div><b>Multi-Region:</b> {k.multiRegion ? "Yes" : "No"}</div>
            <div><b>Rotation:</b> {rotationEnabled ? <Badge color="green">Enabled</Badge> : <Badge color="grey">Off</Badge>}</div>
          </ColumnLayout>

          <Container header={
            <Header
              variant="h3"
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  {editDesc ? (
                    <>
                      <Button onClick={() => {
                        updateDesc.mutate({ id: keyId, description: newDesc }, {
                          onSuccess: () => { showToast("success", "Description updated"); setEditDesc(false); keyQuery.refetch(); },
                          onError: (e: any) => showToast("error", e.message),
                        });
                      }}>Save</Button>
                      <Button onClick={() => setEditDesc(false)}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      {k.keyState === "Enabled" && !rotationEnabled && (
                        <Button onClick={() => toggleRotation.mutate({ id: keyId, enable: true }, {
                          onSuccess: () => showToast("success", "Rotation enabled"),
                          onError: (e: any) => showToast("error", e.message),
                        })}>Enable rotation</Button>
                      )}
                      {k.keyState === "Enabled" && rotationEnabled && (
                        <Button onClick={() => toggleRotation.mutate({ id: keyId, enable: false }, {
                          onSuccess: () => showToast("success", "Rotation disabled"),
                          onError: (e: any) => showToast("error", e.message),
                        })}>Disable rotation</Button>
                      )}
                      {k.keyState === "Enabled" && (
                        <Button onClick={() => toggleKey.mutate({ id: keyId, enable: false }, {
                          onSuccess: () => { showToast("success", "Key disabled"); keyQuery.refetch(); },
                          onError: (e: any) => showToast("error", e.message),
                        })}>Disable</Button>
                      )}
                      {k.keyState === "Disabled" && (
                        <Button onClick={() => toggleKey.mutate({ id: keyId, enable: true }, {
                          onSuccess: () => { showToast("success", "Key enabled"); keyQuery.refetch(); },
                          onError: (e: any) => showToast("error", e.message),
                        })}>Enable</Button>
                      )}
                      {k.keyState !== "PendingDeletion" ? (
                        <Button onClick={() => {
                          scheduleDeletion.mutate({ id: keyId }, {
                            onSuccess: () => { showToast("success", "Deletion scheduled"); keyQuery.refetch(); },
                            onError: (e: any) => showToast("error", e.message),
                          });
                        }}>Schedule deletion</Button>
                      ) : (
                        <Button onClick={() => {
                          cancelDeletion.mutate(keyId, {
                            onSuccess: () => { showToast("success", "Deletion cancelled"); keyQuery.refetch(); },
                            onError: (e: any) => showToast("error", e.message),
                          });
                        }}>Cancel deletion</Button>
                      )}
                      <Button onClick={() => { setNewDesc(k.description || ""); setEditDesc(true); }}>Edit description</Button>
                    </>
                  )}
                </SpaceBetween>
              }
            >
              Description
            </Header>
          }>
            {editDesc ? (
              <Input value={newDesc} onChange={({ detail }) => setNewDesc(detail.value)} />
            ) : (
              <Box>{k.description || <span className="fd-text-muted">No description</span>}</Box>
            )}
          </Container>

          <Container header={<Header variant="h3">Tags ({Object.keys(tags).length})</Header>}>
            {Object.keys(tags).length === 0 ? <Box color="text-body-secondary">No tags</Box> : (
              <SpaceBetween size="xs">
                {Object.entries(tags).map(([key, value]) => <Badge key={key}>{key}: {value}</Badge>)}
              </SpaceBetween>
            )}
          </Container>
        </SpaceBetween>
      ) : <Box>Loading...</Box>,
    },
    {
      id: "aliases",
      label: `Aliases (${aliases.length})`,
      content: (
        <Table
          columnDefinitions={[
            { id: "name", header: "Alias", cell: (a: any) => a.name },
            { id: "arn", header: "ARN", cell: (a: any) => <span style={{ fontSize: 12 }}>{a.arn}</span> },
            { id: "created", header: "Created", cell: (a: any) => a.creationDate ? new Date(a.creationDate).toLocaleDateString() : "-" },
          ]}
          items={aliases}
          trackBy={(a: any) => a.arn || a.name}
          empty={<Box>No aliases</Box>}
        />
      ),
    },
    {
      id: "grants",
      label: `Grants (${grants.length})`,
      content: (
        <Table
          columnDefinitions={[
            { id: "id", header: "Grant ID", cell: (g: any) => <span style={{ fontSize: 12, fontFamily: "monospace" }}>{g.grantId}</span> },
            { id: "name", header: "Name", cell: (g: any) => g.name || "-" },
            { id: "principal", header: "Grantee principal", cell: (g: any) => <span style={{ fontSize: 12 }}>{g.granteePrincipal}</span> },
            { id: "ops", header: "Operations", cell: (g: any) => (g.operations || []).map((op: string) => <Badge key={op}>{op}</Badge>) },
            { id: "created", header: "Created", cell: (g: any) => g.creationDate ? new Date(g.creationDate).toLocaleDateString() : "-" },
          ]}
          items={grants}
          trackBy={(g: any) => g.grantId}
          empty={<Box>No grants</Box>}
        />
      ),
    },
    {
      id: "crypto",
      label: "Encrypt / Decrypt",
      content: (
        <SpaceBetween size="l">
          <Container header={<Header variant="h3">Encrypt</Header>}>
            <SpaceBetween size="s">
              <FormField label="Plaintext (base64)">
                <Textarea value={plaintext} onChange={({ detail }) => setPlaintext(detail.value)} rows={3} placeholder="SGVsbG8gV29ybGQ=" />
              </FormField>
              <Button
                variant="primary"
                disabled={!plaintext || k?.keyState !== "Enabled"}
                loading={encryptMut.isPending}
                onClick={async () => {
                  try {
                    const res = await encryptMut.mutateAsync({ id: keyId, plaintext }) as any;
                    setCryptoResult(res);
                    setDecryptInput(res.ciphertextBlob);
                    showToast("success", "Encrypted");
                  } catch (e: any) { showToast("error", e.message); }
                }}
              >
                Encrypt
              </Button>
              {cryptoResult && (
                <Alert type="success">
                  <b>Ciphertext (base64):</b>
                  <pre style={{ fontSize: 11, overflow: "auto", marginTop: 4 }}>{cryptoResult.ciphertextBlob}</pre>
                </Alert>
              )}
            </SpaceBetween>
          </Container>

          <Container header={<Header variant="h3">Decrypt</Header>}>
            <SpaceBetween size="s">
              <FormField label="Ciphertext (base64)">
                <Textarea value={decryptInput} onChange={({ detail }) => setDecryptInput(detail.value)} rows={3} />
              </FormField>
              <Button
                variant="primary"
                disabled={!decryptInput}
                loading={decryptMut.isPending}
                onClick={async () => {
                  try {
                    const res = await decryptMut.mutateAsync({ ciphertextBlob: decryptInput }) as any;
                    setDecryptResult(res.plaintext);
                    showToast("success", "Decrypted");
                  } catch (e: any) { showToast("error", e.message); }
                }}
              >
                Decrypt
              </Button>
              {decryptResult && (
                <Alert type="success">
                  <b>Plaintext (base64):</b>
                  <pre style={{ fontSize: 11, overflow: "auto", marginTop: 4 }}>{decryptResult}</pre>
                </Alert>
              )}
            </SpaceBetween>
          </Container>
        </SpaceBetween>
      ),
    },
  ];

  return (
    <Modal visible={true} onDismiss={onClose} header={`KMS Key: ${keyId.substring(0, 16)}...`} size="large" footer={
      <Button onClick={onClose}>Close</Button>
    }>
      {keyQuery.isLoading ? <Box>Loading...</Box> : k ? (
        <Tabs tabs={tabs} activeTabId={activeTab} onChange={({ detail }) => setActiveTab(detail.activeTabId)} />
      ) : <Box>Key not found</Box>}
    </Modal>
  );
}

function AliasesTab() {
  const { showToast } = useToast();
  const aliasesQuery = useKMSAliases();
  const deleteAlias = useDeleteAlias();
  const [showCreate, setShowCreate] = useState(false);

  const aliases = aliasesQuery.data?.aliases || [];

  return (
    <SpaceBetween size="l">
      <Table
        header={
          <Header
            variant="h2"
            counter={`(${aliases.length})`}
            actions={<Button onClick={() => setShowCreate(true)}>Create alias</Button>}
          >
            Aliases
          </Header>
        }
        columnDefinitions={[
          { id: "name", header: "Alias name", cell: (a: any) => a.name },
          { id: "target", header: "Target key ID", cell: (a: any) => <span style={{ fontSize: 12, fontFamily: "monospace" }}>{a.targetKeyId}</span> },
          { id: "created", header: "Created", cell: (a: any) => a.creationDate ? new Date(a.creationDate).toLocaleDateString() : "-" },
          {
            id: "actions",
            header: "",
            cell: (a: any) => (
              <DeleteButton
                itemName={a.name}
                resourceType="alias"
                onDelete={async () => {
                  try {
                    await deleteAlias.mutateAsync(a.name);
                    showToast("success", `Alias ${a.name} deleted`);
                  } catch (e: any) { showToast("error", e.message); }
                }}
              />
            ),
          },
        ]}
        items={aliases}
        loading={aliasesQuery.isLoading}
        trackBy={(a: any) => a.arn || a.name}
        empty={<Box textAlign="center"><b>No aliases</b></Box>}
      />

      {showCreate && <CreateAliasModal onClose={() => setShowCreate(false)} />}
    </SpaceBetween>
  );
}

function CreateAliasModal({ onClose }: { onClose: () => void }) {
  const { showToast } = useToast();
  const createAlias = useCreateAlias();
  const [aliasName, setAliasName] = useState("");
  const [targetKeyId, setTargetKeyId] = useState("");

  return (
    <Modal visible={true} onDismiss={onClose} header="Create alias" footer={
      <Box float="right">
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => {
            createAlias.mutate({ aliasName, targetKeyId }, {
              onSuccess: () => { showToast("success", "Alias created"); onClose(); },
              onError: (e: any) => showToast("error", e.message),
            });
          }}>Create</Button>
        </SpaceBetween>
      </Box>
    }>
      <Form>
        <SpaceBetween size="m">
          <FormField label="Alias name" description="Will be prefixed with 'alias/' if not provided">
            <Input value={aliasName} onChange={({ detail }) => setAliasName(detail.value)} placeholder="my-key" />
          </FormField>
          <FormField label="Target key ID">
            <Input value={targetKeyId} onChange={({ detail }) => setTargetKeyId(detail.value)} placeholder="1234abcd-..." />
          </FormField>
        </SpaceBetween>
      </Form>
    </Modal>
  );
}

export default function KMSPage() {
  const navigate = useNavigate();
  const { data: health } = useHealth();
  const [activeTab, setActiveTab] = useState("keys");

  const kmsStatus = health?.services?.kms;
  const statusText = kmsStatus === "running" ? "running" : kmsStatus === "available" ? "available" : "connected";

  const tabs: TabsProps.Tab[] = [
    { id: "keys", label: "Keys", content: <KeysTab /> },
    { id: "aliases", label: "Aliases", content: <AliasesTab /> },
  ];

  return (
    <ContentLayout
      header={
        <SpaceBetween size="xs">
          <BreadcrumbGroup
            items={[
              { text: "Dashboard", href: "/#/" },
              { text: "KMS", href: "/#/services/kms" },
            ]}
            onFollow={(e) => { e.preventDefault(); navigate(e.detail.href.replace("/#", "")); }}
          />
          <Header variant="h1" description="Create and manage KMS keys, aliases, and grants">
            KMS <StatusBadge status={statusText as any} />
          </Header>
        </SpaceBetween>
      }
    >
      <Tabs tabs={tabs} activeTabId={activeTab} onChange={({ detail }) => setActiveTab(detail.activeTabId)} />
    </ContentLayout>
  );
}
