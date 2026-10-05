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
import {
  useMcSession,
  useMcEnableSession,
  useMcAdminAccounts,
  useMcEnableAdmin,
  useMcOrgConfiguration,
  useMcUpdateOrgConfiguration,
  useMcMembers,
  useMcCreateMember,
  type McMember,
  type McAdminAccount,
} from "../../hooks/useMacie2";

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

export default function Macie2Dashboard() {
  const sessionQuery = useMcSession();
  const enableSession = useMcEnableSession();
  const adminsQuery = useMcAdminAccounts();
  const enableAdmin = useMcEnableAdmin();
  const orgConfigQuery = useMcOrgConfiguration();
  const updateOrgConfig = useMcUpdateOrgConfiguration();
  const membersQuery = useMcMembers();
  const createMember = useMcCreateMember();

  const [status, setStatus] = useState<Status | null>(null);
  const [showEnableAdmin, setShowEnableAdmin] = useState(false);
  const [adminAccountId, setAdminAccountId] = useState("");
  const [orgAutoEnable, setOrgAutoEnable] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberAccountId, setMemberAccountId] = useState("");
  const [memberEmail, setMemberEmail] = useState("");

  async function wrap(action: () => Promise<unknown>, success: string) {
    setStatus(null);
    try {
      await action();
      setStatus({ type: "success", message: success });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Request failed" });
    }
  }

  const session = sessionQuery.data;
  const admins = adminsQuery.data?.adminAccounts || [];
  const members = membersQuery.data?.members || [];

  return (
    <SpaceBetween size="l">
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      <ServiceDashboardLayout
        tabs={[
          {
            id: "session",
            label: "Session",
            content: sessionQuery.isLoading ? (
              <Box>Loading…</Box>
            ) : session?.enabled ? (
              <Container header={<Header variant="h3">Macie session</Header>}>
                <SpaceBetween size="m">
                  <Box>Status: {session.status}</Box>
                  <Box>Service role: {session.serviceRole}</Box>
                </SpaceBetween>
              </Container>
            ) : (
              <Container>
                <SpaceBetween size="m">
                  <Box>Macie is not enabled for this account.</Box>
                  <Button
                    variant="primary"
                    loading={enableSession.isPending}
                    onClick={() =>
                      wrap(() => enableSession.mutateAsync(), "Macie session enabled.")
                    }
                  >
                    Enable Macie
                  </Button>
                </SpaceBetween>
              </Container>
            ),
          },
          {
            id: "members",
            label: `Members (${members.length})`,
            content: (
              <ResourceTable
                resourceName="member"
                headerTitle="Member accounts"
                items={members}
                loading={membersQuery.isLoading}
                onCreate={() => setShowAddMember(true)}
                onRefresh={membersQuery.refetch}
                columns={[
                  { id: "account", header: "Account ID", cell: (m: McMember) => m.accountId },
                  { id: "email", header: "Email", cell: (m: McMember) => m.email },
                  { id: "status", header: "Relationship", cell: (m: McMember) => m.relationshipStatus },
                  { id: "admin", header: "Administrator", cell: (m: McMember) => m.administratorAccountId },
                ]}
              />
            ),
          },
          {
            id: "organization",
            label: `Organization (${admins.length})`,
            content: (
              <SpaceBetween size="m">
                <ResourceTable
                  resourceName="administrator"
                  headerTitle="Macie administrators"
                  items={admins}
                  loading={adminsQuery.isLoading}
                  onCreate={() => setShowEnableAdmin(true)}
                  onRefresh={adminsQuery.refetch}
                  columns={[
                    { id: "account", header: "Account ID", cell: (a: McAdminAccount) => a.accountId },
                    { id: "status", header: "Status", cell: (a: McAdminAccount) => a.status },
                  ]}
                />
                <Container header={<Header variant="h3">Organization configuration</Header>}>
                  <SpaceBetween size="m">
                    {orgConfigQuery.isLoading ? (
                      <Box>Loading…</Box>
                    ) : (
                      <Box>
                        Auto-enable member accounts:{" "}
                        {orgConfigQuery.data?.autoEnable ? "Yes" : "No"}
                      </Box>
                    )}
                    <Toggle checked={orgAutoEnable} onChange={({ detail }) => setOrgAutoEnable(detail.checked)}>
                      Auto-enable
                    </Toggle>
                    <Button
                      loading={updateOrgConfig.isPending}
                      onClick={() =>
                        wrap(
                          () => updateOrgConfig.mutateAsync(orgAutoEnable),
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
        ]}
      />
      <Modal
        visible={showEnableAdmin}
        onDismiss={() => setShowEnableAdmin(false)}
        header="Enable Macie administrator"
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
                      () => enableAdmin.mutateAsync(adminAccountId),
                      `Macie administrator ${adminAccountId} enabled.`
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
        visible={showAddMember}
        onDismiss={() => setShowAddMember(false)}
        header="Add member account"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Account ID">
              <Input value={memberAccountId} onChange={({ detail }) => setMemberAccountId(detail.value)} placeholder="222222222222" />
            </FormField>
            <FormField label="Email address">
              <Input value={memberEmail} onChange={({ detail }) => setMemberEmail(detail.value)} placeholder="member@example.com" />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowAddMember(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!memberAccountId || !memberEmail}
                  loading={createMember.isPending}
                  onClick={() =>
                    wrap(
                      () =>
                        createMember.mutateAsync({
                          accountId: memberAccountId,
                          email: memberEmail,
                        }),
                      `Member ${memberAccountId} added.`
                    ).then(() => {
                      setShowAddMember(false);
                      setMemberAccountId("");
                      setMemberEmail("");
                    })
                  }
                >
                  Add
                </Button>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}
