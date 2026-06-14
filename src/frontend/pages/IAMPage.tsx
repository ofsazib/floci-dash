import { useState } from "react";
import {
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
  Tabs,
  type TabsProps,
  Badge,
  ColumnLayout,
  Container,
  Textarea,
  Alert,
} from "@cloudscape-design/components";
import DeleteButton from "../components/DeleteButton";
import { useToast } from "../components/Toast";
import {
  useIAMUsers,
  useIAMUser,
  useCreateUser,
  useDeleteUser,
  useIAMRoles,
  useIAMRole,
  useCreateRole,
  useDeleteRole,
  useIAMGroups,
  useCreateGroup,
  useDeleteGroup,
  useIAMPolicies,
  useIAMPolicy,
  usePolicyVersion,
  useCreatePolicy,
  useDeletePolicy,
  useCreateAccessKey,
  useInstanceProfiles,
} from "../hooks/useIAM";

// ─── USERS TAB ───────────────────────────────────────────

function UsersTab() {
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const usersQuery = useIAMUsers();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();

  const users = usersQuery.data?.users || [];

  return (
    <SpaceBetween size="l">
      <Table
        header={
          <Header
            variant="h2"
            counter={`(${users.length})`}
            actions={<Button onClick={() => setShowCreate(true)}>Create user</Button>}
          >
            Users
          </Header>
        }
        columnDefinitions={[
          { id: "name", header: "User name", cell: (u: any) => u.name },
          { id: "arn", header: "ARN", cell: (u: any) => <span style={{ fontSize: 12, color: "#888" }}>{u.arn}</span> },
          { id: "created", header: "Created", cell: (u: any) => u.createDate ? new Date(u.createDate).toLocaleDateString() : "-" },
          {
            id: "actions",
            header: "",
            cell: (u: any) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setSelectedUser(u.name)}>View</Button>
                <DeleteButton
                  itemName={u.name}
                  resourceType="user"
                  onDelete={async () => {
                    try {
                      await deleteUser.mutateAsync(u.name);
                      showToast("success", `User ${u.name} deleted`);
                    } catch (e: any) { showToast("error", e.message); }
                  }}
                />
              </SpaceBetween>
            ),
          },
        ]}
        items={users}
        loading={usersQuery.isLoading}
        trackBy={(u: any) => u.name}
        empty={<Box textAlign="center"><b>No users</b></Box>}
      />

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onSubmit={async (data) => {
            try {
              await createUser.mutateAsync(data);
              showToast("success", `User ${data.name} created`);
              setShowCreate(false);
            } catch (e: any) { showToast("error", e.message); }
          }}
        />
      )}

      {selectedUser && (
        <UserDetailModal userName={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </SpaceBetween>
  );
}

function CreateUserModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => void }) {
  const [name, setName] = useState("");
  const [path, setPath] = useState("/");
  return (
    <Modal visible={true} onDismiss={onClose} header="Create user" footer={
      <SpaceBetween direction="horizontal" size="xs">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={() => onSubmit({ name, path })}>Create</Button>
      </SpaceBetween>
    }>
      <Form>
        <SpaceBetween size="m">
          <FormField label="User name">
            <Input value={name} onChange={({ detail }) => setName(detail.value)} />
          </FormField>
          <FormField label="Path">
            <Input value={path} onChange={({ detail }) => setPath(detail.value)} />
          </FormField>
        </SpaceBetween>
      </Form>
    </Modal>
  );
}

function UserDetailModal({ userName, onClose }: { userName: string; onClose: () => void }) {
  const { showToast } = useToast();
  const userQuery = useIAMUser(userName);
  const createAccessKey = useCreateAccessKey();

  const u = userQuery.data?.user;
  const accessKeys = userQuery.data?.accessKeys || [];
  const attachedPolicies = userQuery.data?.attachedPolicies || [];
  const groups = userQuery.data?.groups || [];
  const inlinePolicies = userQuery.data?.inlinePolicies || [];

  const [newKey, setNewKey] = useState<any | null>(null);

  return (
    <Modal visible={true} onDismiss={onClose} header={`User: ${userName}`} size="large" footer={
      <Button onClick={onClose}>Close</Button>
    }>
      {userQuery.isLoading ? <Box>Loading...</Box> : u ? (
        <SpaceBetween size="l">
          <ColumnLayout columns={2} variant="text-grid">
            <div><b>ARN:</b> {u.arn}</div>
            <div><b>User ID:</b> {u.userId}</div>
            <div><b>Path:</b> {u.path}</div>
            <div><b>Created:</b> {u.createDate ? new Date(u.createDate).toLocaleString() : "-"}</div>
          </ColumnLayout>

          <Container header={<Header variant="h3">Groups ({groups.length})</Header>}>
            {groups.length === 0 ? <Box color="text-body-secondary">No groups</Box> : (
              <SpaceBetween size="xs">
                {groups.map((g: any) => <Badge key={g.name}>{g.name}</Badge>)}
              </SpaceBetween>
            )}
          </Container>

          <Container header={
            <Header variant="h3" actions={
              <Button onClick={async () => {
                try {
                  const res = await createAccessKey.mutateAsync(userName);
                  setNewKey(res);
                  showToast("success", "Access key created");
                } catch (e: any) { showToast("error", e.message); }
              }}>
                Create access key
              </Button>
            }>
              Access keys ({accessKeys.length})
            </Header>
          }>
            {newKey && (
              <Alert type="warning" dismissible onDismiss={() => setNewKey(null)}>
                <Box>
                  <b>Save these credentials — secret key won't be shown again:</b><br />
                  Access Key ID: {newKey.accessKeyId}<br />
                  Secret Access Key: {newKey.secretAccessKey}
                </Box>
              </Alert>
            )}
            {accessKeys.length === 0 && !newKey ? (
              <Box color="text-body-secondary">No access keys</Box>
            ) : (
              <Table
                columnDefinitions={[
                  { id: "id", header: "Access Key ID", cell: (k: any) => k.accessKeyId },
                  { id: "status", header: "Status", cell: (k: any) => <Badge color={k.status === "Active" ? "green" : "grey"}>{k.status}</Badge> },
                  { id: "created", header: "Created", cell: (k: any) => k.createDate ? new Date(k.createDate).toLocaleDateString() : "-" },
                ]}
                items={[...(newKey ? [{ accessKeyId: newKey.accessKeyId, status: newKey.status || "Active", createDate: new Date() }] : []), ...accessKeys]}
                trackBy={(k: any) => k.accessKeyId}
              />
            )}
          </Container>

          <Container header={<Header variant="h3">Attached policies ({attachedPolicies.length})</Header>}>
            {attachedPolicies.length === 0 ? <Box color="text-body-secondary">No attached policies</Box> : (
              <Table
                columnDefinitions={[
                  { id: "name", header: "Policy", cell: (p: any) => p.name },
                  { id: "arn", header: "ARN", cell: (p: any) => <span style={{ fontSize: 12, color: "#888" }}>{p.arn}</span> },
                ]}
                items={attachedPolicies}
                trackBy={(p: any) => p.arn}
              />
            )}
          </Container>

          <Container header={<Header variant="h3">Inline policies ({inlinePolicies.length})</Header>}>
            {inlinePolicies.length === 0 ? <Box color="text-body-secondary">No inline policies</Box> : (
              <SpaceBetween size="xs">
                {inlinePolicies.map((p: string) => <Badge key={p}>{p}</Badge>)}
              </SpaceBetween>
            )}
          </Container>
        </SpaceBetween>
      ) : <Box>User not found</Box>}
    </Modal>
  );
}

// ─── ROLES TAB ───────────────────────────────────────────

function RolesTab() {
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const rolesQuery = useIAMRoles();
  const createRole = useCreateRole();
  const deleteRole = useDeleteRole();

  const roles = rolesQuery.data?.roles || [];

  return (
    <SpaceBetween size="l">
      <Table
        header={
          <Header
            variant="h2"
            counter={`(${roles.length})`}
            actions={<Button onClick={() => setShowCreate(true)}>Create role</Button>}
          >
            Roles
          </Header>
        }
        columnDefinitions={[
          { id: "name", header: "Role name", cell: (r: any) => r.name },
          { id: "desc", header: "Description", cell: (r: any) => r.description || "-" },
          { id: "arn", header: "ARN", cell: (r: any) => <span style={{ fontSize: 12, color: "#888" }}>{r.arn}</span> },
          { id: "created", header: "Created", cell: (r: any) => r.createDate ? new Date(r.createDate).toLocaleDateString() : "-" },
          {
            id: "actions",
            header: "",
            cell: (r: any) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setSelectedRole(r.name)}>View</Button>
                <DeleteButton
                  itemName={r.name}
                  resourceType="role"
                  onDelete={async () => {
                    try {
                      await deleteRole.mutateAsync(r.name);
                      showToast("success", `Role ${r.name} deleted`);
                    } catch (e: any) { showToast("error", e.message); }
                  }}
                />
              </SpaceBetween>
            ),
          },
        ]}
        items={roles}
        loading={rolesQuery.isLoading}
        trackBy={(r: any) => r.name}
        empty={<Box textAlign="center"><b>No roles</b></Box>}
      />

      {showCreate && (
        <CreateRoleModal
          onClose={() => setShowCreate(false)}
          onSubmit={async (data) => {
            try {
              await createRole.mutateAsync(data);
              showToast("success", `Role ${data.name} created`);
              setShowCreate(false);
            } catch (e: any) { showToast("error", e.message); }
          }}
        />
      )}

      {selectedRole && (
        <RoleDetailModal roleName={selectedRole} onClose={() => setSelectedRole(null)} />
      )}
    </SpaceBetween>
  );
}

function CreateRoleModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const defaultTrustPolicy = JSON.stringify({
    Version: "2012-10-17",
    Statement: [{ Effect: "Allow", Principal: { Service: "ec2.amazonaws.com" }, Action: "sts:AssumeRole" }],
  }, null, 2);

  return (
    <Modal visible={true} onDismiss={onClose} header="Create role" size="large" footer={
      <SpaceBetween direction="horizontal" size="xs">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={() => onSubmit({ name, description })}>Create</Button>
      </SpaceBetween>
    }>
      <Form>
        <SpaceBetween size="m">
          <FormField label="Role name">
            <Input value={name} onChange={({ detail }) => setName(detail.value)} />
          </FormField>
          <FormField label="Description">
            <Input value={description} onChange={({ detail }) => setDescription(detail.value)} />
          </FormField>
          <FormField label="Trust policy (AssumeRolePolicyDocument)" description="Default: EC2 service can assume this role">
            <Textarea value={defaultTrustPolicy} rows={8} onChange={() => {}} />
          </FormField>
        </SpaceBetween>
      </Form>
    </Modal>
  );
}

function RoleDetailModal({ roleName, onClose }: { roleName: string; onClose: () => void }) {
  const roleQuery = useIAMRole(roleName);
  const r = roleQuery.data?.role;
  const attachedPolicies = roleQuery.data?.attachedPolicies || [];
  const tags = roleQuery.data?.tags || {};

  return (
    <Modal visible={true} onDismiss={onClose} header={`Role: ${roleName}`} size="large" footer={
      <Button onClick={onClose}>Close</Button>
    }>
      {roleQuery.isLoading ? <Box>Loading...</Box> : r ? (
        <SpaceBetween size="l">
          <ColumnLayout columns={2} variant="text-grid">
            <div><b>ARN:</b> {r.arn}</div>
            <div><b>Role ID:</b> {r.roleId}</div>
            <div><b>Path:</b> {r.path}</div>
            <div><b>Max session:</b> {r.maxSessionDuration}s</div>
            <div><b>Created:</b> {r.createDate ? new Date(r.createDate).toLocaleString() : "-"}</div>
            <div><b>Description:</b> {r.description || "-"}</div>
          </ColumnLayout>

          {r.assumeRolePolicyDocument && (
            <Container header={<Header variant="h3">Trust policy</Header>}>
              <pre style={{ fontSize: 12, overflow: "auto", maxHeight: 200 }}>
                {(() => {
                  try { return JSON.stringify(JSON.parse(r.assumeRolePolicyDocument), null, 2); }
                  catch { return r.assumeRolePolicyDocument; }
                })()}
              </pre>
            </Container>
          )}

          <Container header={<Header variant="h3">Attached policies ({attachedPolicies.length})</Header>}>
            {attachedPolicies.length === 0 ? <Box color="text-body-secondary">No attached policies</Box> : (
              <Table
                columnDefinitions={[
                  { id: "name", header: "Policy", cell: (p: any) => p.name },
                  { id: "arn", header: "ARN", cell: (p: any) => <span style={{ fontSize: 12, color: "#888" }}>{p.arn}</span> },
                ]}
                items={attachedPolicies}
                trackBy={(p: any) => p.arn}
              />
            )}
          </Container>

          <Container header={<Header variant="h3">Tags</Header>}>
            {Object.keys(tags).length === 0 ? <Box color="text-body-secondary">No tags</Box> : (
              <SpaceBetween size="xs">
                {Object.entries(tags).map(([k, v]) => <Badge key={k}>{k}: {v}</Badge>)}
              </SpaceBetween>
            )}
          </Container>
        </SpaceBetween>
      ) : <Box>Role not found</Box>}
    </Modal>
  );
}

// ─── POLICIES TAB ────────────────────────────────────────

function PoliciesTab() {
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [scope, setScope] = useState<SelectProps.Option>({ label: "Local", value: "Local" });
  const [selectedPolicyArn, setSelectedPolicyArn] = useState<string | null>(null);

  const policiesQuery = useIAMPolicies(scope.value);
  const createPolicy = useCreatePolicy();
  const deletePolicy = useDeletePolicy();

  const policies = policiesQuery.data?.policies || [];

  return (
    <SpaceBetween size="l">
      <Table
        header={
          <Header
            variant="h2"
            counter={`(${policies.length})`}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Select
                  selectedOption={scope}
                  onChange={({ detail }) => setScope(detail.selectedOption)}
                  options={[
                    { label: "Local", value: "Local" },
                    { label: "AWS", value: "AWS" },
                    { label: "All", value: "All" },
                  ]}
                />
                <Button onClick={() => setShowCreate(true)}>Create policy</Button>
              </SpaceBetween>
            }
          >
            Policies
          </Header>
        }
        columnDefinitions={[
          { id: "name", header: "Policy name", cell: (p: any) => p.name },
          { id: "scope", header: "Scope", cell: (p: any) => <Badge color={p.scope === "AWS" ? "blue" : "green"}>{p.scope}</Badge> },
          { id: "version", header: "Default version", cell: (p: any) => p.defaultVersionId || "-" },
          { id: "attached", header: "Attachments", cell: (p: any) => p.attachmentCount ?? 0 },
          { id: "created", header: "Created", cell: (p: any) => p.createDate ? new Date(p.createDate).toLocaleDateString() : "-" },
          {
            id: "actions",
            header: "",
            cell: (p: any) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setSelectedPolicyArn(p.arn)}>View</Button>
                {p.scope !== "AWS" && (
                  <DeleteButton
                    itemName={p.name}
                    resourceType="policy"
                    onDelete={async () => {
                      try {
                        await deletePolicy.mutateAsync(p.arn);
                        showToast("success", `Policy ${p.name} deleted`);
                      } catch (e: any) { showToast("error", e.message); }
                    }}
                  />
                )}
              </SpaceBetween>
            ),
          },
        ]}
        items={policies}
        loading={policiesQuery.isLoading}
        trackBy={(p: any) => p.arn}
        empty={<Box textAlign="center"><b>No policies</b></Box>}
      />

      {showCreate && (
        <CreatePolicyModal
          onClose={() => setShowCreate(false)}
          onSubmit={async (data) => {
            try {
              await createPolicy.mutateAsync(data);
              showToast("success", `Policy ${data.name} created`);
              setShowCreate(false);
            } catch (e: any) { showToast("error", e.message); }
          }}
        />
      )}

      {selectedPolicyArn && (
        <PolicyDetailModal arn={selectedPolicyArn} onClose={() => setSelectedPolicyArn(null)} />
      )}
    </SpaceBetween>
  );
}

function CreatePolicyModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const defaultDoc = JSON.stringify({
    Version: "2012-10-17",
    Statement: [{ Effect: "Allow", Action: "*", Resource: "*" }],
  }, null, 2);

  return (
    <Modal visible={true} onDismiss={onClose} header="Create policy" size="large" footer={
      <SpaceBetween direction="horizontal" size="xs">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={() => onSubmit({ name, description, document: defaultDoc })}>Create</Button>
      </SpaceBetween>
    }>
      <Form>
        <SpaceBetween size="m">
          <FormField label="Policy name">
            <Input value={name} onChange={({ detail }) => setName(detail.value)} />
          </FormField>
          <FormField label="Description">
            <Input value={description} onChange={({ detail }) => setDescription(detail.value)} />
          </FormField>
          <FormField label="Policy document">
            <Textarea value={defaultDoc} rows={10} onChange={() => {}} />
          </FormField>
        </SpaceBetween>
      </Form>
    </Modal>
  );
}

function PolicyDetailModal({ arn, onClose }: { arn: string; onClose: () => void }) {
  const policyQuery = useIAMPolicy(arn);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const versionQuery = usePolicyVersion(arn, selectedVersion);

  const p = policyQuery.data?.policy;
  const versions = policyQuery.data?.versions || [];
  const defaultVersion = versions.find((v: any) => v.isDefaultVersion);

  const currentVersion = selectedVersion || defaultVersion?.versionId;
  const currentDoc = versionQuery.data?.document;

  return (
    <Modal visible={true} onDismiss={onClose} header={`Policy: ${p?.name || arn}`} size="large" footer={
      <Button onClick={onClose}>Close</Button>
    }>
      {policyQuery.isLoading ? <Box>Loading...</Box> : p ? (
        <SpaceBetween size="l">
          <ColumnLayout columns={2} variant="text-grid">
            <div><b>ARN:</b> {p.arn}</div>
            <div><b>Policy ID:</b> {p.policyId}</div>
            <div><b>Default version:</b> {p.defaultVersionId}</div>
            <div><b>Attachments:</b> {p.attachmentCount}</div>
            <div><b>Created:</b> {p.createDate ? new Date(p.createDate).toLocaleString() : "-"}</div>
          </ColumnLayout>

          <Container header={<Header variant="h3">Policy document</Header>}>
            <SpaceBetween size="m">
              <Select
                selectedOption={currentVersion ? { label: currentVersion + (defaultVersion?.versionId === currentVersion ? " (default)" : ""), value: currentVersion } : null}
                onChange={({ detail }) => setSelectedVersion(detail.selectedOption?.value || null)}
                options={versions.map((v: any) => ({
                  label: v.versionId + (v.isDefaultVersion ? " (default)" : ""),
                  value: v.versionId,
                }))}
                placeholder="Select version"
              />
              {versionQuery.isLoading ? <Box>Loading document...</Box> : currentDoc ? (
                <pre style={{ fontSize: 12, overflow: "auto", maxHeight: 300, background: "#f5f5f5", padding: 12, borderRadius: 4 }}>
                  {(() => {
                    try { return JSON.stringify(JSON.parse(currentDoc), null, 2); }
                    catch { return currentDoc; }
                  })()}
                </pre>
              ) : <Box color="text-body-secondary">Select a version to view document</Box>}
            </SpaceBetween>
          </Container>
        </SpaceBetween>
      ) : <Box>Policy not found</Box>}
    </Modal>
  );
}

// ─── GROUPS TAB ──────────────────────────────────────────

function GroupsTab() {
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);

  const groupsQuery = useIAMGroups();
  const createGroup = useCreateGroup();
  const deleteGroup = useDeleteGroup();

  const groups = groupsQuery.data?.groups || [];

  return (
    <SpaceBetween size="l">
      <Table
        header={
          <Header
            variant="h2"
            counter={`(${groups.length})`}
            actions={<Button onClick={() => setShowCreate(true)}>Create group</Button>}
          >
            Groups
          </Header>
        }
        columnDefinitions={[
          { id: "name", header: "Group name", cell: (g: any) => g.name },
          { id: "arn", header: "ARN", cell: (g: any) => <span style={{ fontSize: 12, color: "#888" }}>{g.arn}</span> },
          { id: "created", header: "Created", cell: (g: any) => g.createDate ? new Date(g.createDate).toLocaleDateString() : "-" },
          {
            id: "actions",
            header: "",
            cell: (g: any) => (
              <DeleteButton
                itemName={g.name}
                resourceType="group"
                onDelete={async () => {
                  try {
                    await deleteGroup.mutateAsync(g.name);
                    showToast("success", `Group ${g.name} deleted`);
                  } catch (e: any) { showToast("error", e.message); }
                }}
              />
            ),
          },
        ]}
        items={groups}
        loading={groupsQuery.isLoading}
        trackBy={(g: any) => g.name}
        empty={<Box textAlign="center"><b>No groups</b></Box>}
      />

      {showCreate && (
        <Modal visible={true} onDismiss={() => setShowCreate(false)} header="Create group" footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => {
              const name = (document.getElementById("group-name-input") as HTMLInputElement)?.value;
              if (name) {
                createGroup.mutate({ name }, {
                  onSuccess: () => { showToast("success", `Group ${name} created`); setShowCreate(false); },
                  onError: (e: any) => showToast("error", e.message),
                });
              }
            }}>Create</Button>
          </SpaceBetween>
        }>
          <Form>
            <FormField label="Group name">
              <Input id="group-name-input" value="" onChange={() => {}} />
            </FormField>
          </Form>
        </Modal>
      )}
    </SpaceBetween>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────

export default function IAMPage() {
  const [activeTab, setActiveTab] = useState("roles");

  const tabs: TabsProps.Tab[] = [
    { id: "roles", label: "Roles", content: <RolesTab /> },
    { id: "users", label: "Users", content: <UsersTab /> },
    { id: "policies", label: "Policies", content: <PoliciesTab /> },
    { id: "groups", label: "Groups", content: <GroupsTab /> },
  ];

  return (
    <ContentLayout
      header={
        <Header variant="h1" description="Users, roles, policies, groups, and instance profiles">
          IAM
        </Header>
      }
    >
      <Tabs tabs={tabs} activeTabId={activeTab} onChange={({ detail }) => setActiveTab(detail.activeTabId)} />
    </ContentLayout>
  );
}
