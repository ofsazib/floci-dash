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
  Toggle,
  Alert,
  ColumnLayout,
} from "@cloudscape-design/components";
import ServiceDashboardLayout from "../../components/ServiceDashboardLayout";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import {
  useIdentityPools,
  useCreateIdentityPool,
  useDeleteIdentityPool,
  useIdentityPool,
  useIdentityPoolRoles,
  useSetIdentityPoolRoles,
  useIdentityPoolTags,
  useAddIdentityPoolTags,
  useRemoveIdentityPoolTags,
  usePrincipalTagAttributeMap,
  useSetPrincipalTagAttributeMap,
  type IdentityPoolSummary,
  type IdentityPool,
} from "../../hooks/useCognitoIdentity";

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

function CreatePoolModal({
  visible,
  loading,
  onDismiss,
  onSubmit,
}: {
  visible: boolean;
  loading: boolean;
  onDismiss: () => void;
  onSubmit: (body: { name: string; allowUnauthenticated: boolean }) => void;
}) {
  const [name, setName] = useState("");
  const [allowUnauthenticated, setAllowUnauthenticated] = useState(false);

  return (
    <Modal visible={visible} onDismiss={onDismiss} header="Create identity pool">
      <Form>
        <SpaceBetween size="m">
          <FormField label="Identity pool name">
            <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="my-app-pool" />
          </FormField>
          <Toggle checked={allowUnauthenticated} onChange={({ detail }) => setAllowUnauthenticated(detail.checked)}>
            Allow unauthenticated identities
          </Toggle>
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={onDismiss}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!name}
                loading={loading}
                onClick={() => {
                  onSubmit({ name, allowUnauthenticated });
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

function PoolDetail({ poolId, onBack }: { poolId: string; onBack: () => void }) {
  const [status, setStatus] = useState<Status | null>(null);
  const poolQuery = useIdentityPool(poolId);
  const rolesQuery = useIdentityPoolRoles(poolId);
  const setRoles = useSetIdentityPoolRoles();
  const tagsQuery = useIdentityPoolTags(poolId);
  const addTags = useAddIdentityPoolTags();
  const removeTags = useRemoveIdentityPoolTags();
  const [providerInput, setProviderInput] = useState("");
  const [loadedProvider, setLoadedProvider] = useState<string | null>(null);
  const providerMapQuery = usePrincipalTagAttributeMap(poolId, loadedProvider);
  const setProviderMap = useSetPrincipalTagAttributeMap();
  const [authRole, setAuthRole] = useState("");
  const [tagKey, setTagKey] = useState("");
  const [tagValue, setTagValue] = useState("");

  const pool = poolQuery.data?.pool ?? null;
  const roles = rolesQuery.data?.roles ?? null;
  const tagEntries = Object.entries(tagsQuery.data?.tags || {});
  const providerMap = providerMapQuery.data ?? null;

  async function handleSetRoles() {
    setStatus(null);
    try {
      await setRoles.mutateAsync({ poolId, roles: { authenticated: authRole } });
      setStatus({ type: "success", message: "Roles set." });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Failed to set roles" });
    }
  }

  async function handleAddTag() {
    setStatus(null);
    try {
      await addTags.mutateAsync({ poolId, tags: { [tagKey]: tagValue } });
      setTagKey("");
      setTagValue("");
      setStatus({ type: "success", message: "Tag added." });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Failed to add tag" });
    }
  }

  return (
    <SpaceBetween size="l">
      <Button variant="link" iconName="arrow-left" onClick={onBack}>
        Back to identity pools
      </Button>
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      <ServiceDashboardLayout
        tabs={[
          {
            id: "overview",
            label: "Overview",
            content: (
              <Container header={<Header variant="h2">{pool?.IdentityPoolName ?? poolId}</Header>}>
                <ColumnLayout columns={2} variant="text-grid">
                  <SpaceBetween size="xs">
                    <Box variant="awsui-key-label">Identity pool ID</Box>
                    <Box>{pool?.IdentityPoolId ?? "—"}</Box>
                  </SpaceBetween>
                  <SpaceBetween size="xs">
                    <Box variant="awsui-key-label">Unauthenticated identities</Box>
                    <Box>{pool?.AllowUnauthenticatedIdentities ? "Yes" : "No"}</Box>
                  </SpaceBetween>
                  <SpaceBetween size="xs">
                    <Box variant="awsui-key-label">Developer provider</Box>
                    <Box>{pool?.DeveloperProviderName ?? "—"}</Box>
                  </SpaceBetween>
                  <SpaceBetween size="xs">
                    <Box variant="awsui-key-label">Login providers</Box>
                    <Box>{Object.keys(pool?.SupportedLoginProviders || {}).length}</Box>
                  </SpaceBetween>
                </ColumnLayout>
              </Container>
            ),
          },
          {
            id: "roles",
            label: "Roles",
            content: (
              <SpaceBetween size="m">
                {roles === null ? (
                  <Box variant="p">No roles are set for this pool.</Box>
                ) : (
                  <ResourceTable
                    resourceName="role"
                    headerTitle="Roles"
                    items={Object.entries(roles).map(([k, v]) => ({ roleType: k, roleArn: v }))}
                    loading={rolesQuery.isLoading}
                    columns={[
                      { id: "type", header: "Type", cell: (r: any) => r.roleType },
                      { id: "arn", header: "Role ARN", cell: (r: any) => r.roleArn },
                    ]}
                  />
                )}
                <Container header={<Header variant="h3">Set authenticated role</Header>}>
                  <SpaceBetween size="m">
                    <SpaceBetween direction="horizontal" size="xs">
                      <Input
                        value={authRole}
                        onChange={({ detail }) => setAuthRole(detail.value)}
                        placeholder="arn:aws:iam::123456789012:role/auth"
                      />
                      <Button
                        variant="primary"
                        disabled={!authRole}
                        loading={setRoles.isPending}
                        onClick={handleSetRoles}
                      >
                        Set role
                      </Button>
                    </SpaceBetween>
                  </SpaceBetween>
                </Container>
                <Container header={<Header variant="h3">Principal tag attribute map</Header>}>
                  <SpaceBetween size="m">
                    <SpaceBetween direction="horizontal" size="xs">
                      <Input
                        value={providerInput}
                        onChange={({ detail }) => setProviderInput(detail.value)}
                        placeholder="login.myapp"
                      />
                      <Button
                        disabled={!providerInput}
                        onClick={() => setLoadedProvider(providerInput)}
                      >
                        Load map
                      </Button>
                    </SpaceBetween>
                    {providerMap && (
                      <SpaceBetween size="xs">
                        <Box variant="p">
                          Provider {loadedProvider} — use defaults: {providerMap.useDefaults ? "Yes" : "No"}
                        </Box>
                        <ResourceTable
                          resourceName="principal tag"
                          headerTitle="Principal tags"
                          items={Object.entries(providerMap.principalTags).map(([k, v]) => ({ key: k, value: v }))}
                          loading={providerMapQuery.isLoading}
                          columns={[
                            { id: "key", header: "Key", cell: (t: any) => t.key },
                            { id: "value", header: "Value", cell: (t: any) => t.value },
                          ]}
                        />
                        <Button
                          loading={setProviderMap.isPending}
                          onClick={() =>
                            setProviderMap.mutateAsync({
                              poolId,
                              identityProviderName: loadedProvider!,
                              useDefaults: true,
                              principalTags: providerMap.principalTags,
                            })
                          }
                        >
                          Enable defaults
                        </Button>
                      </SpaceBetween>
                    )}
                  </SpaceBetween>
                </Container>
              </SpaceBetween>
            ),
          },
          {
            id: "tags",
            label: `Tags (${tagEntries.length})`,
            content: (
              <SpaceBetween size="m">
                <ResourceTable
                  resourceName="tag"
                  headerTitle="Tags"
                  items={tagEntries.map(([key, value]) => ({ key, value }))}
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
                          onDelete={() => removeTags.mutateAsync({ poolId, tagKeys: [t.key] })}
                        />
                      ),
                    },
                  ]}
                />
                <Container header={<Header variant="h3">Add tag</Header>}>
                  <SpaceBetween direction="horizontal" size="xs">
                    <Input value={tagKey} onChange={({ detail }) => setTagKey(detail.value)} placeholder="env" />
                    <Input value={tagValue} onChange={({ detail }) => setTagValue(detail.value)} placeholder="dev" />
                    <Button
                      variant="primary"
                      disabled={!tagKey || !tagValue}
                      loading={addTags.isPending}
                      onClick={handleAddTag}
                    >
                      Add tag
                    </Button>
                  </SpaceBetween>
                </Container>
              </SpaceBetween>
            ),
          },
        ]}
      />
    </SpaceBetween>
  );
}

export default function CognitoIdentityDashboard() {
  const { data, isLoading, isError, error, refetch } = useIdentityPools();
  const createPool = useCreateIdentityPool();
  const deletePool = useDeleteIdentityPool();
  const [selected, setSelected] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);

  async function handleCreate(body: { name: string; allowUnauthenticated: boolean }) {
    setStatus(null);
    try {
      await createPool.mutateAsync(body);
      setShowCreate(false);
      setStatus({ type: "success", message: `Identity pool ${body.name} created.` });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Failed to create identity pool" });
    }
  }

  if (selected) {
    return <PoolDetail poolId={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <SpaceBetween size="l">
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      <ResourceTable
        resourceName="identity pool"
        headerTitle="Identity Pools"
        items={data?.pools || []}
        loading={isLoading}
        onCreate={() => setShowCreate(true)}
        onRefresh={refetch}
        columns={[
          { id: "name", header: "Name", cell: (p: IdentityPoolSummary) => p.IdentityPoolName },
          { id: "id", header: "Identity pool ID", cell: (p: IdentityPoolSummary) => p.IdentityPoolId },
          {
            id: "actions",
            header: "",
            cell: (p: IdentityPoolSummary) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setSelected(p.IdentityPoolId!)}>View</Button>
                <DeleteButton
                  itemName={p.IdentityPoolId!}
                  resourceType="identity pool"
                  loading={deletePool.isPending}
                  onDelete={() => deletePool.mutateAsync(p.IdentityPoolId!)}
                />
              </SpaceBetween>
            ),
          },
        ]}
      />
      {isError && (
        <Alert type="error">{(error as Error)?.message || "Failed to load identity pools"}</Alert>
      )}
      <CreatePoolModal
        visible={showCreate}
        loading={createPool.isPending}
        onDismiss={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />
    </SpaceBetween>
  );
}
