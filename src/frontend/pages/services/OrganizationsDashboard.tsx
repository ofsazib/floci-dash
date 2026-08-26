// Auto-split from ServicePage.tsx. Shared import preamble is intentional;
// unused imports are tree-shaken at build (noUnusedLocals is off).
import { useParams } from "react-router-dom";
import { useState } from "react";
import {
  ContentLayout,
  Header,
  Box,
  SpaceBetween,
  StatusIndicator,
  Modal,
  FormField,
  Input,
  Button,
  Tabs,
  Textarea,
  Select,
} from "@cloudscape-design/components";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import { useToast } from "../../components/Toast";
import {
  useOrg,
  useCreateOrg,
  useDeleteOrg,
  useOrgRoots,
  useOrgOUs,
  useCreateOrgOU,
  useDeleteOrgOU,
  useOrgAccounts,
  useCreateOrgAccount,
  useCloseOrgAccount,
  useOrgPolicies,
  useCreateOrgPolicy,
  useDeleteOrgPolicy,
  useAttachOrgPolicy,
  useDetachOrgPolicy,
  useOrgPolicyTargets,
  useOrgTargetPolicies,
} from "../../hooks/useOrganizations";

export function OrganizationsDashboard() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("org");
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null);

  const org = useOrg();
  const orgData = org.data?.organization;
  const createOrg = useCreateOrg();
  const deleteOrg = useDeleteOrg();

  const roots = useOrgRoots();
  const rootId = selectedRoot || (roots.data?.roots?.length ? roots.data.roots[0].Id : null);

  const ous = useOrgOUs(rootId);
  const createOU = useCreateOrgOU();
  const deleteOU = useDeleteOrgOU();
  const [showCreateOU, setShowCreateOU] = useState(false);
  const [ouName, setOuName] = useState("");
  const [ouError, setOuError] = useState("");

  const accounts = useOrgAccounts(rootId);
  const createAccount = useCreateOrgAccount();
  const closeAccount = useCloseOrgAccount();
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [acctEmail, setAcctEmail] = useState("");
  const [acctName, setAcctName] = useState("");
  const [acctError, setAcctError] = useState("");

  const policies = useOrgPolicies();
  const createPolicy = useCreateOrgPolicy();
  const deletePolicy = useDeleteOrgPolicy();
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);
  const [policyName, setPolicyName] = useState("");
  const [policyContent, setPolicyContent] = useState("");
  const [policyError, setPolicyError] = useState("");

  async function handleCreateOrg() {
    try {
      await createOrg.mutateAsync();
      showToast("success", "Organization created");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to create organization");
    }
  }

  async function handleDeleteOrg() {
    try {
      await deleteOrg.mutateAsync();
      showToast("success", "Organization deleted");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete organization");
    }
  }

  async function handleCreateOU() {
    if (!ouName.trim()) { setOuError("Name is required"); return; }
    if (!rootId) { setOuError("Select a root first"); return; }
    try {
      await createOU.mutateAsync({ parentId: rootId, name: ouName.trim() });
      showToast("success", `OU "${ouName.trim()}" created`);
      setShowCreateOU(false);
      setOuName("");
      setOuError("");
    } catch (e: any) {
      setOuError(e?.message || "Failed to create OU");
    }
  }

  async function handleCreateAccount() {
    if (!acctEmail.trim()) { setAcctError("Email is required"); return; }
    try {
      await createAccount.mutateAsync({ email: acctEmail.trim(), name: acctName.trim() || undefined, parentId: rootId || undefined });
      showToast("success", "Account creation initiated");
      setShowCreateAccount(false);
      setAcctEmail("");
      setAcctName("");
      setAcctError("");
    } catch (e: any) {
      setAcctError(e?.message || "Failed to create account");
    }
  }

  async function handleCreatePolicy() {
    if (!policyName.trim() || !policyContent.trim()) { setPolicyError("Name and content are required"); return; }
    try {
      await createPolicy.mutateAsync({ name: policyName.trim(), content: policyContent.trim() });
      showToast("success", `Policy "${policyName.trim()}" created`);
      setShowCreatePolicy(false);
      setPolicyName("");
      setPolicyContent("");
      setPolicyError("");
    } catch (e: any) {
      setPolicyError(e?.message || "Failed to create policy");
    }
  }

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="AWS Organizations — manage OUs, accounts, and SCPs"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              {orgData ? (
                <Button onClick={handleDeleteOrg} loading={deleteOrg.isPending}>Delete Organization</Button>
              ) : (
                <Button variant="primary" onClick={handleCreateOrg} loading={createOrg.isPending}>Create Organization</Button>
              )}
            </SpaceBetween>
          }
        >
          Organizations
        </Header>
      }
    >
      <Tabs
        activeTabId={activeTab}
        onChange={({ detail }) => setActiveTab(detail.activeTabId)}
        tabs={[
          {
            id: "org",
            label: "Organization",
            content: (
              <SpaceBetween size="m">
                {org.isLoading ? (
                  <Box>Loading...</Box>
                ) : orgData ? (
                  <SpaceBetween size="m">
                    <Box>
                      <Box fontWeight="bold">Organization</Box>
                      <Box>{orgData.Id}</Box>
                      <Box>{orgData.Arn}</Box>
                      <StatusIndicator type="success">Active</StatusIndicator>
                    </Box>
                    <Box>
                      <Box fontWeight="bold">Roots</Box>
                      {roots.data?.roots?.map((r: any) => (
                        <div key={r.Id}>
                          <Button
                            variant={selectedRoot === r.Id || (!selectedRoot && roots.data.roots[0]?.Id === r.Id) ? "primary" : "normal"}
                            onClick={() => setSelectedRoot(r.Id)}
                          >
                            {r.Name} ({r.Id})
                          </Button>
                        </div>
                      ))}
                      {roots.data?.roots?.length === 0 && <Box>No roots</Box>}
                    </Box>
                  </SpaceBetween>
                ) : (
                  <Box>No organization. Click "Create Organization" to get started.</Box>
                )}
              </SpaceBetween>
            ),
          },
          {
            id: "ous",
            label: "Organizational Units",
            content: (
              <SpaceBetween size="m">
                <Button variant="primary" onClick={() => setShowCreateOU(true)}>Create OU</Button>
                <ResourceTable
                  resourceName="organizational unit"
                  headerTitle="Organizational Units"
                  headerCounter={ous.data?.total}
                  items={ous.data?.organizationalUnits || []}
                  loading={ous.isLoading}
                  emptyMessage="No OUs in this root"
                  columns={[
                    { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
                    { id: "id", header: "ID", cell: (i: any) => i.id },
                    { id: "arn", header: "ARN", cell: (i: any) => i.arn },
                  ]}
                  onDelete={(item: any) =>
                    deleteOU.mutateAsync(item.id).then(() => showToast("success", `OU "${item.name}" deleted`)).catch((e) => showToast("error", e?.message || "Failed to delete"))
                  }
                                />
                <Modal
                  visible={showCreateOU}
                  onDismiss={() => setShowCreateOU(false)}
                  header="Create Organizational Unit"
                >
                  <SpaceBetween size="m">
                    {ouError && <Box color="text-status-error">{ouError}</Box>}
                    <FormField label="Name">
                      <Input value={ouName} onChange={({ detail }) => setOuName(detail.value)} placeholder="my-ou" />
                    </FormField>
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button onClick={() => setShowCreateOU(false)}>Cancel</Button>
                      <Button variant="primary" onClick={handleCreateOU} loading={createOU.isPending}>Create</Button>
                    </SpaceBetween>
                  </SpaceBetween>
                </Modal>
              </SpaceBetween>
            ),
          },
          {
            id: "accounts",
            label: "Accounts",
            content: (
              <SpaceBetween size="m">
                <Button variant="primary" onClick={() => setShowCreateAccount(true)}>Create Account</Button>
                <ResourceTable
                  resourceName="account"
                  headerTitle="Accounts"
                  headerCounter={accounts.data?.total}
                  items={accounts.data?.accounts || []}
                  loading={accounts.isLoading}
                  emptyMessage="No accounts"
                  columns={[
                    { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
                    { id: "id", header: "Account ID", cell: (i: any) => i.id },
                    { id: "email", header: "Email", cell: (i: any) => i.email },
                    { id: "status", header: "Status", cell: (i: any) => <StatusIndicator type={i.status === "ACTIVE" ? "success" : "warning"}>{i.status}</StatusIndicator> },
                  ]}
                  onDelete={(item: any) =>
                    closeAccount.mutateAsync(item.id).then(() => showToast("success", `Account "${item.name}" closed`)).catch((e) => showToast("error", e?.message || "Failed to close"))
                  }
                />
                <Modal
                  visible={showCreateAccount}
                  onDismiss={() => setShowCreateAccount(false)}
                  header="Create Account"
                >
                  <SpaceBetween size="m">
                    {acctError && <Box color="text-status-error">{acctError}</Box>}
                    <FormField label="Email">
                      <Input value={acctEmail} onChange={({ detail }) => setAcctEmail(detail.value)} placeholder="account@example.com" />
                    </FormField>
                    <FormField label="Name (optional)">
                      <Input value={acctName} onChange={({ detail }) => setAcctName(detail.value)} placeholder="My Account" />
                    </FormField>
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button onClick={() => setShowCreateAccount(false)}>Cancel</Button>
                      <Button variant="primary" onClick={handleCreateAccount} loading={createAccount.isPending}>Create</Button>
                    </SpaceBetween>
                  </SpaceBetween>
                </Modal>
              </SpaceBetween>
            ),
          },
          {
            id: "policies",
            label: "Policies (SCPs)",
            content: (
              <SpaceBetween size="m">
                <Button variant="primary" onClick={() => setShowCreatePolicy(true)}>Create Policy</Button>
                <ResourceTable
                  resourceName="policy"
                  headerTitle="Service Control Policies"
                  headerCounter={policies.data?.total}
                  items={policies.data?.policies || []}
                  loading={policies.isLoading}
                  emptyMessage="No policies"
                  columns={[
                    { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
                    { id: "id", header: "ID", cell: (i: any) => i.id },
                    { id: "description", header: "Description", cell: (i: any) => i.description || "-" },
                    { id: "awsManaged", header: "AWS Managed", cell: (i: any) => i.awsManaged ? "Yes" : "No" },
                  ]}
                  onDelete={(item: any) =>
                    deletePolicy.mutateAsync(item.id).then(() => showToast("success", `Policy "${item.name}" deleted`)).catch((e) => showToast("error", e?.message || "Failed to delete"))
                  }
                />
                <Modal
                  visible={showCreatePolicy}
                  onDismiss={() => setShowCreatePolicy(false)}
                  header="Create Service Control Policy"
                >
                  <SpaceBetween size="m">
                    {policyError && <Box color="text-status-error">{policyError}</Box>}
                    <FormField label="Name">
                      <Input value={policyName} onChange={({ detail }) => setPolicyName(detail.value)} placeholder="my-scp" />
                    </FormField>
                    <FormField label="Policy Document">
                      <Textarea value={policyContent} onChange={({ detail }) => setPolicyContent(detail.value)} rows={10} placeholder='{"Version":"2012-10-17","Statement":[]}' />
                    </FormField>
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button onClick={() => setShowCreatePolicy(false)}>Cancel</Button>
                      <Button variant="primary" onClick={handleCreatePolicy} loading={createPolicy.isPending}>Create</Button>
                    </SpaceBetween>
                  </SpaceBetween>
                </Modal>
              </SpaceBetween>
            ),
          },
        ]}
      />
    </ContentLayout>
  );
}
