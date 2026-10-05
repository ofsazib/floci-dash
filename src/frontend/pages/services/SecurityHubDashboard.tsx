import { useState } from "react";
// V8 remaps phantom branches onto the multi-line import; no executable code here.
/* v8 ignore start */
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
  Toggle,
} from "@cloudscape-design/components";
/* v8 ignore stop */
import ServiceDashboardLayout from "../../components/ServiceDashboardLayout";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import {
  useShHub,
  useShEnableHub,
  useShUpdateHub,
  useShAdminAccounts,
  useShEnableAdmin,
  useShOrgConfiguration,
  useShUpdateOrgConfiguration,
  useShAggregators,
  useShCreateAggregator,
  useShUpdateAggregator,
  useShPolicies,
  useShCreatePolicy,
  useShAssociations,
  useShAssociate,
  useShDisassociate,
  type ShPolicySummary,
  type ShAssociation,
  type ShAdminAccount,
} from "../../hooks/useSecurityHub";

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

function parseRegions(csv: string): string[] {
  return csv
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
}

export default function SecurityHubDashboard() {
  const hubQuery = useShHub();
  const enableHub = useShEnableHub();
  const updateHub = useShUpdateHub();
  const adminsQuery = useShAdminAccounts();
  const enableAdmin = useShEnableAdmin();
  const orgConfigQuery = useShOrgConfiguration();
  const updateOrgConfig = useShUpdateOrgConfiguration();
  const aggregatorsQuery = useShAggregators();
  const createAggregator = useShCreateAggregator();
  const updateAggregator = useShUpdateAggregator();
  const policiesQuery = useShPolicies();
  const createPolicy = useShCreatePolicy();
  const associationsQuery = useShAssociations();
  const associate = useShAssociate();
  const disassociate = useShDisassociate();

  const [status, setStatus] = useState<Status | null>(null);
  const [autoEnableControls, setAutoEnableControls] = useState(true);
  const [showEnableAdmin, setShowEnableAdmin] = useState(false);
  const [adminAccountId, setAdminAccountId] = useState("");
  const [orgAutoEnable, setOrgAutoEnable] = useState(false);
  const [showCreateAggregator, setShowCreateAggregator] = useState(false);
  const [linkingMode, setLinkingMode] = useState("ALL_REGIONS");
  const [aggregatorRegions, setAggregatorRegions] = useState("");
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);
  const [policyName, setPolicyName] = useState("");
  const [policyDescription, setPolicyDescription] = useState("");
  const [assocPolicyId, setAssocPolicyId] = useState("");
  const [assocTargetAccount, setAssocTargetAccount] = useState("");

  async function wrap(action: () => Promise<unknown>, success: string) {
    setStatus(null);
    try {
      await action();
      setStatus({ type: "success", message: success });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Request failed" });
    }
  }

  const hub = hubQuery.data;
  const admins = adminsQuery.data?.adminAccounts || [];
  const orgConfig = orgConfigQuery.data;
  const aggregators = aggregatorsQuery.data?.findingAggregators || [];
  const aggregatorArn = aggregators[0]?.findingAggregatorArn;
  const policies = policiesQuery.data?.configurationPolicySummaries || [];
  const associations = associationsQuery.data?.configurationPolicyAssociationSummaries || [];

  return (
    <SpaceBetween size="l">
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      <ServiceDashboardLayout
        tabs={[
          {
            id: "hub",
            label: "Hub",
            content: hubQuery.isLoading ? (
              <Box>Loading…</Box>
            ) : hub?.enabled ? (
              <Container header={<Header variant="h3">Security Hub</Header>}>
                <SpaceBetween size="m">
                  <Box>Hub ARN: {hub.hubArn}</Box>
                  <Box>Control finding generator: {hub.controlFindingGenerator}</Box>
                  <Toggle checked={autoEnableControls} onChange={({ detail }) => setAutoEnableControls(detail.checked)}>
                    Auto-enable controls
                  </Toggle>
                  <Button
                    loading={updateHub.isPending}
                    onClick={() =>
                      wrap(
                        () =>
                          updateHub.mutateAsync({
                            autoEnableControls,
                            controlFindingGenerator: hub.controlFindingGenerator,
                          }),
                        "Hub configuration updated."
                      )
                    }
                  >
                    Save configuration
                  </Button>
                </SpaceBetween>
              </Container>
            ) : (
              <Container>
                <SpaceBetween size="m">
                  <Box>Security Hub is not enabled for this account.</Box>
                  <Button
                    variant="primary"
                    loading={enableHub.isPending}
                    onClick={() =>
                      wrap(
                        () => enableHub.mutateAsync("SECURITY_CONTROL"),
                        "Security Hub enabled."
                      )
                    }
                  >
                    Enable Security Hub
                  </Button>
                </SpaceBetween>
              </Container>
            ),
          },
          {
            id: "organization",
            label: `Organization (${admins.length})`,
            content: (
              <SpaceBetween size="m">
                <ResourceTable
                  resourceName="delegated admin"
                  headerTitle="Delegated administrators"
                  items={admins}
                  loading={adminsQuery.isLoading}
                  onCreate={() => setShowEnableAdmin(true)}
                  onRefresh={adminsQuery.refetch}
                  columns={[
                    { id: "account", header: "Account ID", cell: (a: ShAdminAccount) => a.accountId },
                    { id: "status", header: "Status", cell: (a: ShAdminAccount) => a.status },
                  ]}
                />
                <Container header={<Header variant="h3">Organization configuration</Header>}>
                  <SpaceBetween size="m">
                    {orgConfigQuery.isLoading ? (
                      <Box>Loading…</Box>
                    ) : (
                      <SpaceBetween size="xs">
                        <Box>Configuration type: {orgConfig?.organizationConfiguration?.configurationType}</Box>
                        <Box>Status: {orgConfig?.organizationConfiguration?.status}</Box>
                        <Box>Auto-enable standards: {orgConfig?.autoEnableStandards}</Box>
                      </SpaceBetween>
                    )}
                    <Toggle checked={orgAutoEnable} onChange={({ detail }) => setOrgAutoEnable(detail.checked)}>
                      Auto-enable new member accounts
                    </Toggle>
                    <Button
                      loading={updateOrgConfig.isPending}
                      onClick={() =>
                        wrap(
                          () =>
                            updateOrgConfig.mutateAsync({
                              autoEnable: orgAutoEnable,
                              autoEnableStandards: orgConfig?.autoEnableStandards,
                            }),
                          "Organization configuration updated."
                        )
                      }
                    >
                      Update configuration
                    </Button>
                  </SpaceBetween>
                </Container>
              </SpaceBetween>
            ),
          },
          {
            id: "aggregator",
            label: "Finding aggregator",
            content: aggregatorsQuery.isLoading ? (
              <Box>Loading…</Box>
            ) : aggregatorArn ? (
              <Container header={<Header variant="h3">Aggregator</Header>}>
                <SpaceBetween size="m">
                  <Box>ARN: {aggregatorArn}</Box>
                  <FormField label="Region linking mode">
                    <Input value={linkingMode} onChange={({ detail }) => setLinkingMode(detail.value)} />
                  </FormField>
                  <FormField label="Regions (comma-separated, SPECIFIED_REGIONS / ALL_REGIONS_EXCEPT_SPECIFIED only)">
                    <Input value={aggregatorRegions} onChange={({ detail }) => setAggregatorRegions(detail.value)} placeholder="regions-csv" />
                  </FormField>
                  <Button
                    loading={updateAggregator.isPending}
                    onClick={() =>
                      wrap(
                        () =>
                          updateAggregator.mutateAsync({
                            findingAggregatorArn: aggregatorArn,
                            regionLinkingMode: linkingMode,
                            regions: parseRegions(aggregatorRegions),
                          }),
                        "Finding aggregator updated."
                      )
                    }
                  >
                    Update aggregator
                  </Button>
                </SpaceBetween>
              </Container>
            ) : (
              <Container>
                <SpaceBetween size="m">
                  <Box>No finding aggregator configured.</Box>
                  <Button variant="primary" onClick={() => setShowCreateAggregator(true)}>
                    Create finding aggregator
                  </Button>
                </SpaceBetween>
              </Container>
            ),
          },
          {
            id: "policies",
            label: `Configuration policies (${policies.length})`,
            content: (
              <SpaceBetween size="m">
                <ResourceTable
                  resourceName="configuration policy"
                  headerTitle="Configuration policies"
                  items={policies}
                  loading={policiesQuery.isLoading}
                  onCreate={() => setShowCreatePolicy(true)}
                  onRefresh={policiesQuery.refetch}
                  columns={[
                    { id: "name", header: "Name", cell: (p: ShPolicySummary) => p.name },
                    { id: "enabled", header: "Service enabled", cell: (p: ShPolicySummary) => (p.serviceEnabled ? "Yes" : "No") },
                    { id: "updated", header: "Updated", cell: (p: ShPolicySummary) => p.updatedAt },
                  ]}
                />
                <Container header={<Header variant="h3">Associations</Header>}>
                  <SpaceBetween size="m">
                    <SpaceBetween direction="horizontal" size="s">
                      <FormField label="Policy ID">
                        <Input value={assocPolicyId} onChange={({ detail }) => setAssocPolicyId(detail.value)} placeholder="policy-id" />
                      </FormField>
                      <FormField label="Target account ID">
                        <Input value={assocTargetAccount} onChange={({ detail }) => setAssocTargetAccount(detail.value)} placeholder="target-account-id" />
                      </FormField>
                      <Button
                        disabled={!assocPolicyId || !assocTargetAccount}
                        loading={associate.isPending}
                        onClick={() =>
                          wrap(
                            () =>
                              associate.mutateAsync({
                                targetAccountId: assocTargetAccount,
                                configurationPolicyIdentifier: assocPolicyId,
                              }),
                            `Association for ${assocTargetAccount} started.`
                          )
                        }
                      >
                        Associate
                      </Button>
                    </SpaceBetween>
                    <ResourceTable
                      resourceName="association"
                      headerTitle="Policy associations"
                      items={associations}
                      loading={associationsQuery.isLoading}
                      onRefresh={associationsQuery.refetch}
                      columns={[
                        { id: "target", header: "Target", cell: (a: ShAssociation) => a.targetId },
                        { id: "type", header: "Type", cell: (a: ShAssociation) => a.targetType },
                        { id: "policy", header: "Policy ID", cell: (a: ShAssociation) => a.configurationPolicyId },
                        { id: "status", header: "Status", cell: (a: ShAssociation) => a.associationStatus },
                        {
                          id: "actions",
                          header: "",
                          cell: (a: ShAssociation) => (
                            <DeleteButton
                              itemName={a.targetId!}
                              resourceType="association"
                              loading={disassociate.isPending}
                              onDelete={() =>
                                wrap(
                                  () =>
                                    disassociate.mutateAsync({
                                      targetAccountId: a.targetId!,
                                      configurationPolicyIdentifier: a.configurationPolicyId!,
                                    }),
                                  `Association for ${a.targetId} removed.`
                                )
                              }
                            />
                          ),
                        },
                      ]}
                    />
                  </SpaceBetween>
                </Container>
              </SpaceBetween>
            ),
          },
        ]}
      />
      <Modal
        visible={showEnableAdmin}
        onDismiss={() => setShowEnableAdmin(false)}
        header="Enable delegated administrator"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Account ID">
              <Input value={adminAccountId} onChange={({ detail }) => setAdminAccountId(detail.value)} placeholder="111111111111" />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowEnableAdmin(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!adminAccountId}
                  loading={enableAdmin.isPending}
                  onClick={() =>
                    wrap(
                      () => enableAdmin.mutateAsync({ accountId: adminAccountId }),
                      `Delegated administrator ${adminAccountId} enabled.`
                    ).then(() => {
                      setShowEnableAdmin(false);
                      setAdminAccountId("");
                    })
                  }
                >
                  Enable
                </Button>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Form>
      </Modal>
      <Modal
        visible={showCreateAggregator}
        onDismiss={() => setShowCreateAggregator(false)}
        header="Create finding aggregator"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Region linking mode">
              <Input value={linkingMode} onChange={({ detail }) => setLinkingMode(detail.value)} />
            </FormField>
            <FormField label="Regions (comma-separated)">
              <Input value={aggregatorRegions} onChange={({ detail }) => setAggregatorRegions(detail.value)} placeholder="regions-csv" />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreateAggregator(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!linkingMode}
                  loading={createAggregator.isPending}
                  onClick={() =>
                    wrap(
                      () =>
                        createAggregator.mutateAsync({
                          regionLinkingMode: linkingMode,
                          regions: parseRegions(aggregatorRegions),
                        }),
                      "Finding aggregator created."
                    ).then(() => {
                      setShowCreateAggregator(false);
                      setAggregatorRegions("");
                    })
                  }
                >
                  Create
                </Button>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Form>
      </Modal>
      <Modal
        visible={showCreatePolicy}
        onDismiss={() => setShowCreatePolicy(false)}
        header="Create configuration policy"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Name">
              <Input value={policyName} onChange={({ detail }) => setPolicyName(detail.value)} />
            </FormField>
            <FormField label="Description">
              <Input value={policyDescription} onChange={({ detail }) => setPolicyDescription(detail.value)} />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreatePolicy(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!policyName}
                  loading={createPolicy.isPending}
                  onClick={() =>
                    wrap(
                      () =>
                        createPolicy.mutateAsync({
                          name: policyName,
                          description: policyDescription,
                          configurationPolicy: { SecurityHub: { ServiceEnabled: true } },
                        }),
                      `Configuration policy ${policyName} created.`
                    ).then(() => {
                      setShowCreatePolicy(false);
                      setPolicyName("");
                      setPolicyDescription("");
                    })
                  }
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
