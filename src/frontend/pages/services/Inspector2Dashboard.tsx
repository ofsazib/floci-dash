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
} from "@cloudscape-design/components";
/* v8 ignore stop */
import ServiceDashboardLayout from "../../components/ServiceDashboardLayout";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import {
  useI2DelegatedAdmins,
  useI2EnableDelegatedAdmin,
  useI2DisableDelegatedAdmin,
  useI2OrgConfiguration,
  useI2UpdateOrgConfiguration,
  type I2DelegatedAdmin,
} from "../../hooks/useInspector2";

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

export default function Inspector2Dashboard() {
  const delegatedQuery = useI2DelegatedAdmins();
  const enableAdmin = useI2EnableDelegatedAdmin();
  const disableAdmin = useI2DisableDelegatedAdmin();
  const orgConfigQuery = useI2OrgConfiguration();
  const updateOrgConfig = useI2UpdateOrgConfiguration();

  const [status, setStatus] = useState<Status | null>(null);
  const [showEnable, setShowEnable] = useState(false);
  const [accountId, setAccountId] = useState("");

  async function wrap(action: () => Promise<unknown>, success: string) {
    setStatus(null);
    try {
      await action();
      setStatus({ type: "success", message: success });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Request failed" });
    }
  }

  const delegated = delegatedQuery.data?.delegatedAdminAccounts || [];
  const autoEnable = orgConfigQuery.data?.organizationConfiguration;

  return (
    <SpaceBetween size="l">
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      <ServiceDashboardLayout
        tabs={[
          {
            id: "delegated",
            label: `Delegated admins (${delegated.length})`,
            content: (
              <SpaceBetween size="m">
                <ResourceTable
                  resourceName="delegated admin"
                  headerTitle="Delegated admins"
                  items={delegated}
                  loading={delegatedQuery.isLoading}
                  onCreate={() => setShowEnable(true)}
                  onRefresh={delegatedQuery.refetch}
                  columns={[
                    { id: "account", header: "Account ID", cell: (a: I2DelegatedAdmin) => a.accountId },
                    { id: "status", header: "Status", cell: (a: I2DelegatedAdmin) => a.status },
                    {
                      id: "actions",
                      header: "",
                      cell: (a: I2DelegatedAdmin) => (
                        <DeleteButton
                          itemName={a.accountId!}
                          resourceType="delegated admin"
                          loading={disableAdmin.isPending}
                          onDelete={() =>
                            wrap(
                              () => disableAdmin.mutateAsync(a.accountId!),
                              `Delegated admin ${a.accountId} disabled.`
                            )
                          }
                        />
                      ),
                    },
                  ]}
                />
                {delegatedQuery.isError && (
                  <Alert type="error">
                    {(delegatedQuery.error as Error)?.message || "Failed to load delegated admins"}
                  </Alert>
                )}
              </SpaceBetween>
            ),
          },
          {
            id: "org",
            label: "Organization",
            content: (
              <Container header={<Header variant="h3">Auto-enable</Header>}>
                <SpaceBetween size="m">
                  {orgConfigQuery.isLoading ? (
                    <Box>Loading…</Box>
                  ) : autoEnable ? (
                    <SpaceBetween size="xs">
                      {Object.entries(autoEnable).map(([key, value]) => (
                        <Box key={key}>
                          {key}: {value ? "Yes" : "No"}
                        </Box>
                      ))}
                    </SpaceBetween>
                  ) : (
                    <Box variant="p">No organization configuration found.</Box>
                  )}
                  <Button
                    loading={updateOrgConfig.isPending}
                    onClick={() =>
                      wrap(
                        () => updateOrgConfig.mutateAsync(autoEnable ?? {}),
                        "Organization configuration refreshed."
                      )
                    }
                  >
                    Refresh configuration
                  </Button>
                </SpaceBetween>
              </Container>
            ),
          },
        ]}
      />
      <Modal
        visible={showEnable}
        onDismiss={() => setShowEnable(false)}
        header="Enable delegated admin"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Account ID">
              <Input value={accountId} onChange={({ detail }) => setAccountId(detail.value)} placeholder="111111111111" />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowEnable(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!accountId}
                  loading={enableAdmin.isPending}
                  onClick={() =>
                    wrap(
                      () => enableAdmin.mutateAsync(accountId),
                      `Delegated admin ${accountId} enabled.`
                    ).then(() => {
                      setShowEnable(false);
                      setAccountId("");
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
    </SpaceBetween>
  );
}
