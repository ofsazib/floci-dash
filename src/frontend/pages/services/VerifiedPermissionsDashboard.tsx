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
  StatusIndicator,
} from "@cloudscape-design/components";
import ServiceDashboardLayout from "../../components/ServiceDashboardLayout";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import {
  useVpStores,
  useCreateVpStore,
  useDeleteVpStore,
  useVpPolicies,
  useCreateVpPolicy,
  useDeleteVpPolicy,
  useVpIsAuthorized,
  type VpStore,
  type VpPolicy,
} from "../../hooks/useVerifiedPermissions";

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

function StoreDetail({ storeId, onBack }: { storeId: string; onBack: () => void }) {
  const [status, setStatus] = useState<Status | null>(null);
  const policies = useVpPolicies(storeId);
  const createPolicy = useCreateVpPolicy();
  const deletePolicy = useDeleteVpPolicy();
  const isAuthorized = useVpIsAuthorized();
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);
  const [policyName, setPolicyName] = useState("");
  const [statement, setStatement] = useState("");
  const [authPrincipal, setAuthPrincipal] = useState("alice");
  const [authAction, setAuthAction] = useState("view");
  const [authResource, setAuthResource] = useState("doc1");
  const [decision, setDecision] = useState<string | null>(null);
  const [determining, setDetermining] = useState<string[]>([]);

  async function handleCreatePolicy() {
    setStatus(null);
    try {
      await createPolicy.mutateAsync({ storeId, name: policyName, statement });
      setShowCreatePolicy(false);
      setPolicyName("");
      setStatement("");
      setStatus({ type: "success", message: "Policy created." });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Failed to create policy" });
    }
  }

  async function handleEvaluate() {
    setStatus(null);
    setDecision(null);
    setDetermining([]);
    try {
      const result = await isAuthorized.mutateAsync({
        storeId,
        principal: authPrincipal,
        action: authAction,
        resource: authResource,
      });
      setDecision(result.decision);
      setDetermining(result.determiningPolicies.map((p) => p.policyId));
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Evaluation failed" });
    }
  }

  return (
    <SpaceBetween size="l">
      <Button variant="link" iconName="arrow-left" onClick={onBack}>
        Back to policy stores
      </Button>
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      <ServiceDashboardLayout
        tabs={[
          {
            id: "policies",
            label: `Policies (${policies.data?.policies.length ?? 0})`,
            content: (
              <SpaceBetween size="m">
                <ResourceTable
                  resourceName="policy"
                  headerTitle="Policies"
                  emptyMessage="No policies found"
                  items={policies.data?.policies || []}
                  loading={policies.isLoading}
                  onCreate={() => setShowCreatePolicy(true)}
                  onRefresh={policies.refetch}
                  columns={[
                    { id: "id", header: "ID", cell: (p: VpPolicy) => p.policyId },
                    {
                      id: "statement",
                      header: "Statement",
                      cell: (p: VpPolicy) => p.definition?.static?.statement ?? "—",
                    },
                    {
                      id: "actions",
                      header: "",
                      cell: (p: VpPolicy) => (
                        <DeleteButton
                          itemName={p.policyId!}
                          resourceType="policy"
                          loading={deletePolicy.isPending}
                          onDelete={() => deletePolicy.mutateAsync({ storeId, policyId: p.policyId! })}
                        />
                      ),
                    },
                  ]}
                />
              </SpaceBetween>
            ),
          },
          {
            id: "console",
            label: "Authorization console",
            content: (
              <SpaceBetween size="m">
                <Container header={<Header variant="h3">Try an authorization</Header>}>
                  <SpaceBetween size="m">
                    <SpaceBetween direction="horizontal" size="xs">
                      <FormField label="Principal (user id)">
                        <Input value={authPrincipal} onChange={({ detail }) => setAuthPrincipal(detail.value)} />
                      </FormField>
                      <FormField label="Action id">
                        <Input value={authAction} onChange={({ detail }) => setAuthAction(detail.value)} />
                      </FormField>
                      <FormField label="Resource id">
                        <Input value={authResource} onChange={({ detail }) => setAuthResource(detail.value)} />
                      </FormField>
                      <Button
                        variant="primary"
                        loading={isAuthorized.isPending}
                        onClick={handleEvaluate}
                      >
                        Evaluate
                      </Button>
                    </SpaceBetween>
                    {decision && (
                      <Box>
                        <StatusIndicator type={decision === "ALLOW" ? "success" : "error"}>
                          {decision}
                        </StatusIndicator>
                        {determining.length > 0 && (
                          <Box variant="p">Determining policies: {determining.join(", ")}</Box>
                        )}
                      </Box>
                    )}
                  </SpaceBetween>
                </Container>
              </SpaceBetween>
            ),
          },
        ]}
      />
      <Modal
        visible={showCreatePolicy}
        onDismiss={() => setShowCreatePolicy(false)}
        header="Create policy"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Policy name">
              <Input value={policyName} onChange={({ detail }) => setPolicyName(detail.value)} placeholder="view-permit" />
            </FormField>
            <FormField label="Cedar statement">
              <Textarea
                value={statement}
                onChange={({ detail }) => setStatement(detail.value)}
                rows={4}
                placeholder='permit(principal, action == Action::"view", resource);'
              />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreatePolicy(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!policyName || !statement}
                  loading={createPolicy.isPending}
                  onClick={handleCreatePolicy}
                >
                  Create
                </Button>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}

export default function VerifiedPermissionsDashboard() {
  const { data, isLoading, isError, error, refetch } = useVpStores();
  const createStore = useCreateVpStore();
  const deleteStore = useDeleteVpStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [validationMode, setValidationMode] = useState("OFF");
  const [status, setStatus] = useState<Status | null>(null);

  async function handleCreate() {
    setStatus(null);
    try {
      await createStore.mutateAsync({
        name,
        validationSettings: { mode: validationMode },
      });
      setShowCreate(false);
      setName("");
      setStatus({ type: "success", message: `Policy store ${name} created.` });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Failed to create policy store" });
    }
  }

  if (selected) {
    return <StoreDetail storeId={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <SpaceBetween size="l">
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      <ResourceTable
        resourceName="policy store"
        headerTitle="Policy stores"
        items={data?.stores || []}
        loading={isLoading}
        onCreate={() => setShowCreate(true)}
        onRefresh={refetch}
        columns={[
          { id: "id", header: "Store ID", cell: (s: VpStore) => s.policyStoreId },
          { id: "arn", header: "ARN", cell: (s: VpStore) => s.arn },
          {
            id: "actions",
            header: "",
            cell: (s: VpStore) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setSelected(s.policyStoreId!)}>View</Button>
                <DeleteButton
                  itemName={s.policyStoreId!}
                  resourceType="policy store"
                  loading={deleteStore.isPending}
                  onDelete={() => deleteStore.mutateAsync(s.policyStoreId!)}
                />
              </SpaceBetween>
            ),
          },
        ]}
      />
      {isError && (
        <Alert type="error">{(error as Error)?.message || "Failed to load policy stores"}</Alert>
      )}
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create policy store"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Name">
              <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="app-store" />
            </FormField>
            <FormField label="Validation mode (OFF / STRICT / OFF_STRICT_ENABLED)">
              <Input value={validationMode} onChange={({ detail }) => setValidationMode(detail.value)} />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!name}
                  loading={createStore.isPending}
                  onClick={handleCreate}
                >
                  Create
                </Button>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}
