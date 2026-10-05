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
  useDtAdminAccounts,
  useDtEnableAdmin,
  useDtGraphs,
  useDtOrgConfiguration,
  useDtUpdateOrgConfiguration,
  useDtMembers,
  useDtCreateMembers,
  useDtStartMonitoring,
  type DtMember,
} from "../../hooks/useDetective";

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

export default function DetectiveDashboard() {
  const adminsQuery = useDtAdminAccounts();
  const enableAdmin = useDtEnableAdmin();
  const graphsQuery = useDtGraphs();
  const graphs = graphsQuery.data?.graphList || [];
  const graphArn = graphs[0]?.arn || null;
  const orgConfigQuery = useDtOrgConfiguration(graphArn);
  const updateOrgConfig = useDtUpdateOrgConfiguration();
  const membersQuery = useDtMembers(graphArn);
  const createMembers = useDtCreateMembers();
  const startMonitoring = useDtStartMonitoring();

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

  const admins = adminsQuery.data?.administrators || [];
  const members = membersQuery.data?.memberDetails || [];

  return (
    <SpaceBetween size="l">
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      <ServiceDashboardLayout
        tabs={[
          {
            id: "graph",
            label: "Behavior graph",
            content: (
              <SpaceBetween size="m">
                <Container header={<Header variant="h3">Graphs</Header>}>
                  {graphsQuery.isLoading ? (
                    <Box>Loading…</Box>
                  ) : graphArn ? (
                    <SpaceBetween size="m">
                      <Box>{graphArn}</Box>
                      <ResourceTable
                        resourceName="member"
                        headerTitle="Members"
                        items={members}
                        loading={membersQuery.isLoading}
                        onCreate={() => setShowAddMember(true)}
                        onRefresh={membersQuery.refetch}
                        columns={[
                          { id: "account", header: "Account ID", cell: (m: DtMember) => m.accountId },
                          { id: "email", header: "Email", cell: (m: DtMember) => m.emailAddress },
                          { id: "status", header: "Status", cell: (m: DtMember) => m.status },
                          { id: "type", header: "Invitation", cell: (m: DtMember) => m.invitationType },
                          {
                            id: "actions",
                            header: "",
                            cell: (m: DtMember) =>
                              m.status !== "ENABLED" ? (
                                <Button
                                  loading={startMonitoring.isPending}
                                  onClick={() =>
                                    wrap(
                                      () =>
                                        startMonitoring.mutateAsync({
                                          graphArn: graphArn!,
                                          accountId: m.accountId!,
                                        }),
                                      `Monitoring started for ${m.accountId}.`
                                    )
                                  }
                                >
                                  Start monitoring
                                </Button>
                              ) : null,
                          },
                        ]}
                      />
                    </SpaceBetween>
                  ) : (
                    <Box>
                      No behavior graph found. Enabling an organization administrator creates one.
                    </Box>
                  )}
                </Container>
              </SpaceBetween>
            ),
          },
          {
            id: "organization",
            label: `Organization (${admins.length})`,
            content: (
              <SpaceBetween size="m">
                <ResourceTable
                  resourceName="administrator"
                  headerTitle="Detective administrators"
                  items={admins}
                  loading={adminsQuery.isLoading}
                  onCreate={() => setShowEnableAdmin(true)}
                  onRefresh={adminsQuery.refetch}
                  columns={[
                    {
                      id: "account",
                      header: "Account ID",
                      cell: (a: { accountId?: string }) => a.accountId,
                    },
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
                      disabled={!graphArn}
                      loading={updateOrgConfig.isPending}
                      onClick={() =>
                        wrap(
                          () =>
                            updateOrgConfig.mutateAsync({
                              graphArn: graphArn!,
                              autoEnable: orgAutoEnable,
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
        ]}
      />
      <Modal
        visible={showEnableAdmin}
        onDismiss={() => setShowEnableAdmin(false)}
        header="Enable Detective administrator"
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
                      `Detective administrator ${adminAccountId} enabled.`
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
                  disabled={!memberAccountId}
                  loading={createMembers.isPending}
                  onClick={() =>
                    wrap(
                      () =>
                        createMembers.mutateAsync({
                          graphArn: graphArn!,
                          accounts: [
                            { accountId: memberAccountId, emailAddress: memberEmail },
                          ],
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
