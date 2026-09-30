import { useState } from "react";
import { api } from "../../lib/client";
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
} from "@cloudscape-design/components";
import ServiceDashboardLayout from "../../components/ServiceDashboardLayout";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import {
  useIdentityStoreUsers,
  useCreateIdentityStoreUser,
  useDeleteIdentityStoreUser,
  useIdentityStoreGroups,
  useCreateIdentityStoreGroup,
  useDeleteIdentityStoreGroup,
  useIdentityStoreMemberships,
  useAddIdentityStoreMembership,
  useRemoveIdentityStoreMembership,
  type StoreUser,
  type StoreGroup,
} from "../../hooks/useIdentityStore";

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

export default function IdentityStoreDashboard() {
  // Auto-filled from the SSO Admin instance; overridable.
  const [storeId, setStoreId] = useState<string>("");
  const [resolved, setResolved] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [userName, setUserName] = useState("");
  const [userDisplayName, setUserDisplayName] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [membersGroup, setMembersGroup] = useState<StoreGroup | null>(null);
  const [memberUserId, setMemberUserId] = useState("");

  const users = useIdentityStoreUsers(resolved && storeId ? storeId : null);
  const groups = useIdentityStoreGroups(resolved && storeId ? storeId : null);
  const memberships = useIdentityStoreMemberships(
    resolved && storeId ? storeId : null,
    membersGroup?.GroupId ?? null
  );
  const createUser = useCreateIdentityStoreUser();
  const deleteUser = useDeleteIdentityStoreUser();
  const createGroup = useCreateIdentityStoreGroup();
  const deleteGroup = useDeleteIdentityStoreGroup();
  const addMembership = useAddIdentityStoreMembership();
  const removeMembership = useRemoveIdentityStoreMembership();

  async function handleResolve() {
    setStatus(null);
    try {
      const data = await api<{
        instances: { IdentityStoreId?: string }[];
        total: number;
      }>("/aws/ssoadmin/instances");
      const id = data.instances[0]?.IdentityStoreId;
      if (!id) {
        setStatus({ type: "error", message: "No Identity Center instance found in Floci." });
        return;
      }
      setStoreId(id);
      setResolved(true);
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Failed to resolve store id" });
    }
  }

  async function handleCreateUser() {
    setStatus(null);
    try {
      await createUser.mutateAsync({ identityStoreId: storeId, userName, displayName: userDisplayName });
      setShowCreateUser(false);
      setUserName("");
      setUserDisplayName("");
      setStatus({ type: "success", message: `User ${userName} created.` });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Failed to create user" });
    }
  }

  async function handleCreateGroup() {
    setStatus(null);
    try {
      await createGroup.mutateAsync({ identityStoreId: storeId, displayName: groupName });
      setShowCreateGroup(false);
      setGroupName("");
      setStatus({ type: "success", message: `Group ${groupName} created.` });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Failed to create group" });
    }
  }

  return (
    <SpaceBetween size="l">
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      {!resolved ? (
        <Container header={<Header variant="h2">Identity Store</Header>}>
          <SpaceBetween size="m">
            <Box variant="p">
              Connect to the Identity Center directory to manage its users and groups.
            </Box>
            <FormField label="Identity store ID (optional — auto-detected from Identity Center)">
              <Input value={storeId} onChange={({ detail }) => setStoreId(detail.value)} placeholder="d-xxxxxxxxxx" />
            </FormField>
            <Button variant="primary" onClick={handleResolve}>
              Connect
            </Button>
          </SpaceBetween>
        </Container>
      ) : (
        <ServiceDashboardLayout
          tabs={[
            {
              id: "users",
              label: `Users (${users.data?.users.length ?? 0})`,
              content: (
                <SpaceBetween size="m">
                  <ResourceTable
                    resourceName="user"
                    headerTitle="Users"
                    items={users.data?.users || []}
                    loading={users.isLoading}
                    onCreate={() => setShowCreateUser(true)}
                    onRefresh={users.refetch}
                    columns={[
                      { id: "name", header: "Username", cell: (u: StoreUser) => u.UserName },
                      { id: "display", header: "Display name", cell: (u: StoreUser) => u.DisplayName ?? "—" },
                      { id: "id", header: "User ID", cell: (u: StoreUser) => u.UserId },
                      {
                        id: "actions",
                        header: "",
                        cell: (u: StoreUser) => (
                          <DeleteButton
                            itemName={u.UserName!}
                            resourceType="user"
                            loading={deleteUser.isPending}
                            onDelete={() => deleteUser.mutateAsync({ identityStoreId: storeId, userId: u.UserId! })}
                          />
                        ),
                      },
                    ]}
                  />
                  {users.isError && (
                    <Alert type="error">
                      {(users.error as Error)?.message || "Failed to load users"}
                    </Alert>
                  )}
                </SpaceBetween>
              ),
            },
            {
              id: "groups",
              label: `Groups (${groups.data?.groups.length ?? 0})`,
              content: (
                <SpaceBetween size="m">
                  <ResourceTable
                    resourceName="group"
                    headerTitle="Groups"
                    items={groups.data?.groups || []}
                    loading={groups.isLoading}
                    onCreate={() => setShowCreateGroup(true)}
                    onRefresh={groups.refetch}
                    columns={[
                      { id: "display", header: "Name", cell: (g: StoreGroup) => g.DisplayName },
                      { id: "desc", header: "Description", cell: (g: StoreGroup) => g.Description ?? "—" },
                      {
                        id: "actions",
                        header: "",
                        cell: (g: StoreGroup) => (
                          <SpaceBetween direction="horizontal" size="xs">
                            <Button onClick={() => setMembersGroup(g)}>Members</Button>
                            <DeleteButton
                              itemName={g.DisplayName!}
                              resourceType="group"
                              loading={deleteGroup.isPending}
                              onDelete={() =>
                                deleteGroup.mutateAsync({ identityStoreId: storeId, groupId: g.GroupId! })
                              }
                            />
                          </SpaceBetween>
                        ),
                      },
                    ]}
                  />
                  {membersGroup && (
                    <Container
                      header={
                        <Header
                          variant="h3"
                          actions={<Button onClick={() => setMembersGroup(null)}>Close</Button>}
                        >
                          Members of {membersGroup.DisplayName}
                        </Header>
                      }
                    >
                      <SpaceBetween size="m">
                        <SpaceBetween direction="horizontal" size="xs">
                          <Input
                            value={memberUserId}
                            onChange={({ detail }) => setMemberUserId(detail.value)}
                            placeholder="user id"
                          />
                          <Button
                            variant="primary"
                            disabled={!memberUserId}
                            loading={addMembership.isPending}
                            onClick={() => {
                              addMembership
                                .mutateAsync({
                                  identityStoreId: storeId,
                                  groupId: membersGroup.GroupId!,
                                  userId: memberUserId,
                                })
                                .then(() => setMemberUserId(""));
                            }}
                          >
                            Add member
                          </Button>
                        </SpaceBetween>
                        <ResourceTable
                          resourceName="member"
                          headerTitle="Members"
                          items={memberships.data?.memberships || []}
                          loading={memberships.isLoading}
                          columns={[
                            { id: "user", header: "User ID", cell: (m: any) => m.MemberId?.UserId ?? "—" },
                            { id: "mid", header: "Membership ID", cell: (m: any) => m.MembershipId },
                            {
                              id: "actions",
                              header: "",
                              cell: (m: any) => (
                                <DeleteButton
                                  itemName={m.MemberId?.UserId ?? m.MembershipId!}
                                  resourceType="member"
                                  loading={removeMembership.isPending}
                                  onDelete={() =>
                                    removeMembership.mutateAsync({
                                      identityStoreId: storeId,
                                      membershipId: m.MembershipId!,
                                    })
                                  }
                                />
                              ),
                            },
                          ]}
                        />
                      </SpaceBetween>
                    </Container>
                  )}
                </SpaceBetween>
              ),
            },
          ]}
        />
      )}
      <Modal
        visible={showCreateUser}
        onDismiss={() => setShowCreateUser(false)}
        header="Create user"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Username">
              <Input value={userName} onChange={({ detail }) => setUserName(detail.value)} placeholder="jane" />
            </FormField>
            <FormField label="Display name">
              <Input
                value={userDisplayName}
                onChange={({ detail }) => setUserDisplayName(detail.value)}
                placeholder="Jane Doe"
              />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreateUser(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!userName}
                  loading={createUser.isPending}
                  onClick={handleCreateUser}
                >
                  Create
                </Button>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Form>
      </Modal>
      <Modal
        visible={showCreateGroup}
        onDismiss={() => setShowCreateGroup(false)}
        header="Create group"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Group name">
              <Input value={groupName} onChange={({ detail }) => setGroupName(detail.value)} placeholder="admins" />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreateGroup(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!groupName}
                  loading={createGroup.isPending}
                  onClick={handleCreateGroup}
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
